'use strict';

/*
 * PDF Power Suite — OCR feature.
 *
 * SHIPPED OUTCOME: a real searchable-PDF text layer, not the simpler "export as .txt" fallback.
 * Each page is rasterized via pdf.js, recognized word-by-word with Tesseract.js (bounding boxes
 * included), then rebuilt with pdf-lib: the original page image is drawn first, and every
 * recognized word is drawn again on top as ordinary PDF text at opacity 0, positioned at its
 * bounding box's origin and sized from its bounding box height. The page looks identical to the
 * scan, but its text can now be selected, copied and found with Ctrl/Cmd+F.
 *
 * Glyph-width alignment (v1.1): each word is additionally wrapped in
 * pushGraphicsState()/concatTransformationMatrix(scaleX,0,0,1,x*(1-scaleX),0)/popGraphicsState()
 * — a standard PDF content-stream idiom, built from pdf-lib's own low-level operator helpers, that
 * horizontally scales just that word's glyphs around its left edge (x) to its Tesseract bounding
 * box's exact width, without touching drawText's own font/color/opacity handling. Verified with a
 * Node round-trip (pdf-lib write → pdf.js read-back): the extracted text run's width matches the
 * intended scaled width exactly. scaleX is clamped to [0.4, 2.5] so a mis-OCR'd sliver of a word
 * (e.g. stray punctuation) can't produce a pathologically stretched glyph run. This replaces the
 * v1.0 approximation and is why invisible-selection boxes now line up closely with the visible
 * word beneath them — search and copy-all were already correct either way, since those only ever
 * depended on text content and reading order, not glyph geometry.
 *
 * This is also the ONLY feature in PDF Power Suite that touches the network after the page has
 * loaded: Tesseract.js downloads its worker script, WASM core and per-language traineddata
 * (~10-15MB/language) from jsdelivr the first time a language is used.
 */

const ocrState = { file: null };
const OCR_MAX_PAGES = 50;

function initOcr() {
    PPS.setupDropzone('ocr-upload', 'ocr-file-input', (files) => {
        PPS.hideAlerts('ocr');
        const file = files[0];
        if (!PPS.isPdfFile(file)) { PPS.showAlert('ocr', 'error', `"${file.name}" is not a PDF.`); return; }
        try { PPS.checkFileSize(file); } catch (err) { PPS.showAlert('ocr', 'error', err.message); return; }
        ocrState.file = file;
        const list = document.getElementById('ocr-file-list');
        list.textContent = '';
        list.appendChild(PPS.createFileRow(file.name, file.size, {
            onRemove: () => { ocrState.file = null; list.textContent = ''; document.getElementById('ocr-run-btn').disabled = true; },
        }));
        if (window.lucide) lucide.createIcons();
        document.getElementById('ocr-run-btn').disabled = false;
    });

    const scaleSlider = document.getElementById('ocr-scale');
    const scaleValue = document.getElementById('ocr-scale-value');
    scaleSlider.addEventListener('input', () => { scaleValue.textContent = parseFloat(scaleSlider.value).toFixed(1); });

    document.getElementById('ocr-run-btn').addEventListener('click', runOcrUi);
}

// Core OCR operation, reused by the Pipeline Builder. `onProgress(page, total, label)`.
PPS.ops.ocr = async function ocrOp(bytes, { langs = 'eng', scale = 2 } = {}, onProgress) {
    const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
    if (pdf.numPages > OCR_MAX_PAGES) {
        throw new Error(`This document has ${pdf.numPages} pages; OCR is limited to ${OCR_MAX_PAGES} pages per run because recognition is CPU-heavy. Split the PDF first.`);
    }

    let currentPage = 0;
    const worker = await Tesseract.createWorker(langs, 1, {
        logger: (m) => {
            if (onProgress && m && m.status) {
                const pct = m.progress != null ? ` (${Math.round(m.progress * 100)}%)` : '';
                onProgress(currentPage, pdf.numPages, `${m.status}${pct} — page ${currentPage} / ${pdf.numPages}`);
            }
        },
    });

    try {
        const outDoc = await PDFLib.PDFDocument.create();
        const font = await outDoc.embedFont(PDFLib.StandardFonts.Helvetica);

        for (let i = 1; i <= pdf.numPages; i++) {
            currentPage = i;
            const page = await pdf.getPage(i);
            const baseViewport = page.getViewport({ scale: 1 });
            const viewport = page.getViewport({ scale });

            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(viewport.width));
            canvas.height = Math.max(1, Math.round(viewport.height));
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            await page.render({ canvasContext: ctx, viewport }).promise;

            const { data } = await worker.recognize(canvas);

            const jpgDataUrl = canvas.toDataURL('image/jpeg', 0.85);
            const jpgBytes = PPS.dataUrlToBytes(jpgDataUrl);
            const jpgImage = await outDoc.embedJpg(jpgBytes);
            const outPage = outDoc.addPage([baseViewport.width, baseViewport.height]);
            outPage.drawImage(jpgImage, { x: 0, y: 0, width: baseViewport.width, height: baseViewport.height });

            const scaleFactor = baseViewport.width / canvas.width;
            const words = (data.words || []).filter((w) => w.text && w.text.trim() !== '' && w.bbox);
            for (const w of words) {
                const bbox = w.bbox;
                const wPt = (bbox.x1 - bbox.x0) * scaleFactor;
                const hPt = (bbox.y1 - bbox.y0) * scaleFactor;
                if (wPt <= 0 || hPt <= 0) continue;
                const fontSize = Math.max(3, Math.min(400, hPt * 0.85));
                const x = bbox.x0 * scaleFactor;
                const y = baseViewport.height - bbox.y1 * scaleFactor;
                try {
                    // Stretch this word's glyphs horizontally so the invisible run's width matches
                    // its Tesseract bounding box, anchored at the left edge (x) — see file header.
                    const naturalWidth = font.widthOfTextAtSize(w.text, fontSize);
                    let scaleX = naturalWidth > 0 ? wPt / naturalWidth : 1;
                    if (!Number.isFinite(scaleX) || scaleX <= 0) scaleX = 1;
                    scaleX = Math.max(0.4, Math.min(2.5, scaleX));

                    outPage.pushOperators(
                        PDFLib.pushGraphicsState(),
                        PDFLib.concatTransformationMatrix(scaleX, 0, 0, 1, x * (1 - scaleX), 0),
                    );
                    outPage.drawText(w.text, { x, y, size: fontSize, font, opacity: 0 });
                    outPage.pushOperators(PDFLib.popGraphicsState());
                } catch (e) {
                    // A handful of glyphs (rare symbols outside WinAnsi) can't be encoded by the
                    // standard font; skip just that word rather than failing the whole page.
                }
            }

            if (onProgress) onProgress(i, pdf.numPages, `Rebuilding page ${i} / ${pdf.numPages}…`);
            await PPS.tick();
        }

        return outDoc.save();
    } finally {
        await worker.terminate();
    }
};

async function runOcrUi() {
    if (!ocrState.file) return;
    const engOn = document.getElementById('ocr-lang-eng').checked;
    const itaOn = document.getElementById('ocr-lang-ita').checked;
    if (!engOn && !itaOn) {
        PPS.showAlert('ocr', 'error', 'Select at least one language.');
        return;
    }
    const langs = [engOn && 'eng', itaOn && 'ita'].filter(Boolean).join('+');
    const scale = parseFloat(document.getElementById('ocr-scale').value);

    const btn = document.getElementById('ocr-run-btn');
    btn.disabled = true;
    PPS.hideAlerts('ocr');
    PPS.showProgress('ocr');
    PPS.setProgress('ocr', 0, 1, 'Loading OCR engine and language data (downloads from the network on first use)…');

    try {
        const bytes = await PPS.readFileAsArrayBuffer(ocrState.file);
        const outBytes = await PPS.ops.ocr(bytes, { langs, scale }, (done, total, label) => PPS.setProgress('ocr', done, total, label));
        const baseName = ocrState.file.name.replace(/\.pdf$/i, '');
        PPS.downloadBytes(outBytes, PPS.withExtension(baseName + '_searchable', 'pdf'));
        PPS.showAlert('ocr', 'success', 'OCR complete: recognized text was embedded as an invisible, searchable layer.');
    } catch (err) {
        PPS.showAlert('ocr', 'error', `${err.message} (if this is a network error, Tesseract.js could not reach its CDN to download the OCR engine/language data — this feature needs internet access even though the rest of the tool works offline).`);
    } finally {
        PPS.hideProgress('ocr');
        btn.disabled = !ocrState.file;
    }
}

document.addEventListener('DOMContentLoaded', initOcr);
