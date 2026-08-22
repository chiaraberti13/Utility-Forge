'use strict';

/*
 * PDF Power Suite — Diff feature.
 *
 * Compares two PDF versions two ways:
 *  - Text diff: pdf.js text extraction per page, word-level diff via jsdiff's Diff.diffWords.
 *  - Visual diff: both pages rasterized to same-size canvases, per-pixel absolute difference via
 *    getImageData, contrast-boosted and rendered as a red heatmap — this surfaces layout-only
 *    changes (moved images, font substitutions, spacing) that a text diff cannot see.
 */

const diffState = { fileA: null, fileB: null };

function initDiffUpload(letter, uploadId, inputId, listId) {
    PPS.setupDropzone(uploadId, inputId, (files) => {
        PPS.hideAlerts('diff');
        const file = files[0];
        if (!PPS.isPdfFile(file)) { PPS.showAlert('diff', 'error', `"${file.name}" is not a PDF.`); return; }
        try { PPS.checkFileSize(file); } catch (err) { PPS.showAlert('diff', 'error', err.message); return; }
        diffState[letter] = file;
        const list = document.getElementById(listId);
        list.textContent = '';
        list.appendChild(PPS.createFileRow(file.name, file.size, {
            onRemove: () => { diffState[letter] = null; list.textContent = ''; updateDiffButton(); },
        }));
        if (window.lucide) lucide.createIcons();
        updateDiffButton();
    });
}

function updateDiffButton() {
    document.getElementById('diff-run-btn').disabled = !(diffState.fileA && diffState.fileB);
}

function initDiff() {
    initDiffUpload('fileA', 'diff-upload-a', 'diff-file-input-a', 'diff-file-list-a');
    initDiffUpload('fileB', 'diff-upload-b', 'diff-file-input-b', 'diff-file-list-b');
    document.getElementById('diff-run-btn').addEventListener('click', runDiff);
}

async function extractPageText(pdfDoc, pageNum) {
    const page = await pdfDoc.getPage(pageNum);
    const content = await page.getTextContent();
    return content.items.map((it) => it.str).join(' ').replace(/\s+/g, ' ').trim();
}

async function renderPageToCanvas(pdfDoc, pageNum, scale) {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(viewport.width));
    canvas.height = Math.max(1, Math.round(viewport.height));
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;
    return canvas;
}

function padCanvasTo(canvas, w, h) {
    if (canvas.width === w && canvas.height === h) return canvas;
    const padded = document.createElement('canvas');
    padded.width = w;
    padded.height = h;
    const ctx = padded.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(canvas, 0, 0);
    return padded;
}

function buildTextDiffPage(pageNum, textA, textB) {
    const wrap = document.createElement('div');
    wrap.className = 'diff-page';

    const head = document.createElement('div');
    head.className = 'diff-page-head';
    head.textContent = `Page ${pageNum}`;
    wrap.appendChild(head);

    const body = document.createElement('div');
    body.className = 'diff-page-body';

    if (textA === textB) {
        const same = document.createElement('span');
        same.style.color = '#737373';
        same.textContent = '(no text differences on this page)';
        body.appendChild(same);
    } else {
        const parts = Diff.diffWords(textA, textB);
        parts.forEach((part) => {
            const span = document.createElement('span');
            if (part.added) span.className = 'diff-add';
            else if (part.removed) span.className = 'diff-del';
            span.textContent = part.value;
            body.appendChild(span);
        });
    }

    wrap.appendChild(body);
    return wrap;
}

async function runTextDiff(pdfA, pdfB, minPages) {
    const results = document.getElementById('diff-results');
    let changedPages = 0;
    for (let i = 1; i <= minPages; i++) {
        const [textA, textB] = await Promise.all([extractPageText(pdfA, i), extractPageText(pdfB, i)]);
        if (textA !== textB) changedPages++;
        results.appendChild(buildTextDiffPage(i, textA, textB));
        PPS.setProgress('diff', i, minPages, `Comparing text, page ${i} / ${minPages}…`);
        await PPS.tick();
    }
    return changedPages;
}

async function runVisualDiff(pdfA, pdfB, minPages) {
    const results = document.getElementById('diff-results');
    const scale = 1.3;
    let pagesWithChanges = 0;

    for (let i = 1; i <= minPages; i++) {
        const canvasA = await renderPageToCanvas(pdfA, i, scale);
        const pageB = await pdfB.getPage(i);
        const vpB1 = pageB.getViewport({ scale: 1 });
        const vpA1 = (await pdfA.getPage(i)).getViewport({ scale: 1 });
        const scaleB = (vpA1.width * scale) / vpB1.width;
        const canvasB = await renderPageToCanvas(pdfB, i, scaleB);

        const w = Math.max(canvasA.width, canvasB.width);
        const h = Math.max(canvasA.height, canvasB.height);
        const padA = padCanvasTo(canvasA, w, h);
        const padB = padCanvasTo(canvasB, w, h);

        const dataA = padA.getContext('2d').getImageData(0, 0, w, h).data;
        const dataB = padB.getContext('2d').getImageData(0, 0, w, h).data;

        const heat = document.createElement('canvas');
        heat.width = w;
        heat.height = h;
        const heatCtx = heat.getContext('2d');
        const outImg = heatCtx.createImageData(w, h);
        let diffPixels = 0;
        const totalPixels = w * h;
        const BOOST = 4;
        for (let p = 0; p < dataA.length; p += 4) {
            const diff = (Math.abs(dataA[p] - dataB[p]) + Math.abs(dataA[p + 1] - dataB[p + 1]) + Math.abs(dataA[p + 2] - dataB[p + 2])) / 3;
            const boosted = Math.min(255, diff * BOOST);
            if (diff > 12) diffPixels++;
            outImg.data[p] = 255;
            outImg.data[p + 1] = 255 - boosted;
            outImg.data[p + 2] = 255 - boosted;
            outImg.data[p + 3] = 255;
        }
        heatCtx.putImageData(outImg, 0, 0);

        const pct = totalPixels > 0 ? (diffPixels / totalPixels) * 100 : 0;
        if (pct > 0.05) pagesWithChanges++;

        const wrap = document.createElement('div');
        wrap.className = 'diff-page';
        const head = document.createElement('div');
        head.className = 'diff-page-head';
        head.textContent = `Page ${i} — ${pct.toFixed(2)}% of pixels differ`;
        wrap.appendChild(head);

        const body = document.createElement('div');
        body.className = 'diff-page-body';
        const pair = document.createElement('div');
        pair.className = 'canvas-pair';

        const figA = document.createElement('figure');
        const capA = document.createElement('figcaption'); capA.textContent = 'A (before)';
        figA.appendChild(capA); figA.appendChild(canvasA);

        const figB = document.createElement('figure');
        const capB = document.createElement('figcaption'); capB.textContent = 'B (after)';
        figB.appendChild(capB); figB.appendChild(canvasB);

        const figHeat = document.createElement('figure');
        const capHeat = document.createElement('figcaption'); capHeat.textContent = 'Difference heatmap';
        figHeat.appendChild(capHeat); figHeat.appendChild(heat);

        pair.appendChild(figA); pair.appendChild(figB); pair.appendChild(figHeat);
        body.appendChild(pair);
        wrap.appendChild(body);
        results.appendChild(wrap);

        PPS.setProgress('diff', i, minPages, `Rendering visual diff, page ${i} / ${minPages}…`);
        await PPS.tick();
    }
    return pagesWithChanges;
}

async function runDiff() {
    if (!diffState.fileA || !diffState.fileB) return;
    const btn = document.getElementById('diff-run-btn');
    btn.disabled = true;
    PPS.hideAlerts('diff');
    const results = document.getElementById('diff-results');
    results.textContent = '';
    PPS.showProgress('diff');
    PPS.setProgress('diff', 0, 1, 'Loading PDFs…');
    try {
        const [bytesA, bytesB] = await Promise.all([
            PPS.readFileAsArrayBuffer(diffState.fileA),
            PPS.readFileAsArrayBuffer(diffState.fileB),
        ]);
        const [pdfA, pdfB] = await Promise.all([
            pdfjsLib.getDocument({ data: bytesA }).promise,
            pdfjsLib.getDocument({ data: bytesB }).promise,
        ]);
        PPS.checkPageCount(Math.max(pdfA.numPages, pdfB.numPages), 'document');

        if (pdfA.numPages !== pdfB.numPages) {
            const notice = document.createElement('div');
            notice.className = 'notice';
            notice.style.marginTop = '16px';
            const icon = document.createElement('i');
            icon.setAttribute('data-lucide', 'alert-triangle');
            icon.setAttribute('width', '18');
            icon.setAttribute('height', '18');
            notice.appendChild(icon);
            const span = document.createElement('span');
            span.textContent = `PDF A has ${pdfA.numPages} page(s) and PDF B has ${pdfB.numPages} page(s) — comparing only the first ${Math.min(pdfA.numPages, pdfB.numPages)} matching page(s). The extra pages are not covered by this comparison.`;
            notice.appendChild(span);
            results.appendChild(notice);
        }

        const minPages = Math.min(pdfA.numPages, pdfB.numPages);
        const mode = document.getElementById('diff-mode-visual').checked ? 'visual' : 'text';

        let changed;
        if (mode === 'text') changed = await runTextDiff(pdfA, pdfB, minPages);
        else changed = await runVisualDiff(pdfA, pdfB, minPages);

        if (window.lucide) lucide.createIcons();
        PPS.showAlert('diff', 'success', `Compared ${minPages} page(s): ${changed} page(s) show differences.`);
    } catch (err) {
        PPS.showAlert('diff', 'error', err.message);
    } finally {
        PPS.hideProgress('diff');
        btn.disabled = false;
    }
}

document.addEventListener('DOMContentLoaded', initDiff);
