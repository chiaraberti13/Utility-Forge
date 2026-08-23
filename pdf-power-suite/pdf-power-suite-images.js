'use strict';

/*
 * PDF Power Suite — PDF → Immagini feature.
 *
 * Rasterizes a chosen page range via pdf.js — the same rasterization approach Compress uses
 * (canvas render at a DPI-derived scale) — but instead of re-embedding pages into a rebuilt PDF,
 * exports each page as a standalone PNG or JPEG image, downloadable individually or all together
 * as a ZIP. This is what makes it a distinct feature from Compress: the output is images, not a
 * (smaller) PDF.
 */

const imagesState = { file: null, results: [] }; // results: [{pageNum, bytes, mime, ext, canvas}]

function initImages() {
    PPS.setupDropzone('images-upload', 'images-file-input', (files) => {
        PPS.hideAlerts('images');
        const file = files[0];
        if (!PPS.isPdfFile(file)) { PPS.showAlert('images', 'error', `"${file.name}" is not a PDF.`); return; }
        try { PPS.checkFileSize(file); } catch (err) { PPS.showAlert('images', 'error', err.message); return; }
        imagesState.file = file;
        const list = document.getElementById('images-file-list');
        list.textContent = '';
        list.appendChild(PPS.createFileRow(file.name, file.size, {
            onRemove: () => {
                imagesState.file = null;
                list.textContent = '';
                document.getElementById('images-run-btn').disabled = true;
                document.getElementById('images-results').textContent = '';
                document.getElementById('images-zip-btn').style.display = 'none';
            },
        }));
        if (window.lucide) lucide.createIcons();
        document.getElementById('images-run-btn').disabled = false;
        document.getElementById('images-results').textContent = '';
        document.getElementById('images-zip-btn').style.display = 'none';
    });

    const dpiSlider = document.getElementById('images-dpi');
    const dpiValue = document.getElementById('images-dpi-value');
    dpiSlider.addEventListener('input', () => { dpiValue.textContent = dpiSlider.value; });

    const qSlider = document.getElementById('images-quality');
    const qValue = document.getElementById('images-quality-value');
    qSlider.addEventListener('input', () => { qValue.textContent = qSlider.value; });

    const formatSelect = document.getElementById('images-format');
    const qualityRow = document.getElementById('images-quality-row');
    const syncQualityVisibility = () => { qualityRow.style.display = formatSelect.value === 'jpeg' ? '' : 'none'; };
    formatSelect.addEventListener('change', syncQualityVisibility);
    syncQualityVisibility();

    document.getElementById('images-run-btn').addEventListener('click', runImagesRasterize);
    document.getElementById('images-zip-btn').addEventListener('click', downloadImagesZip);
}

function renderImagesResults() {
    const grid = document.getElementById('images-results');
    grid.textContent = '';
    imagesState.results.forEach((res) => {
        const tile = document.createElement('div');
        tile.className = 'page-tile';

        const wrap = document.createElement('div');
        wrap.className = 'page-thumb-wrap';
        wrap.appendChild(res.canvas);
        tile.appendChild(wrap);

        const num = document.createElement('div');
        num.className = 'page-num';
        num.textContent = `Page ${res.pageNum}`;
        tile.appendChild(num);

        const controls = document.createElement('div');
        controls.className = 'page-controls';
        controls.appendChild(PPS.iconButton('download', () => {
            const filename = PPS.withExtension(`page_${res.pageNum}`, res.ext);
            PPS.downloadBlob(new Blob([res.bytes], { type: res.mime }), filename);
        }, false, `Download page ${res.pageNum} as ${res.ext.toUpperCase()}`));
        tile.appendChild(controls);

        grid.appendChild(tile);
    });
    if (window.lucide) lucide.createIcons();
}

async function runImagesRasterize() {
    if (!imagesState.file) return;
    const btn = document.getElementById('images-run-btn');
    btn.disabled = true;
    PPS.hideAlerts('images');
    document.getElementById('images-results').textContent = '';
    document.getElementById('images-zip-btn').style.display = 'none';
    PPS.showProgress('images');
    PPS.setProgress('images', 0, 1, 'Loading PDF…');

    try {
        const bytes = await PPS.readFileAsArrayBuffer(imagesState.file);
        const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
        PPS.checkPageCount(pdf.numPages, 'document');

        const rangeInput = document.getElementById('images-page-range').value.trim();
        let pageNums;
        if (!rangeInput) {
            pageNums = Array.from({ length: pdf.numPages }, (_, i) => i + 1);
        } else {
            const groups = PPS.parsePageRanges(rangeInput, pdf.numPages);
            const set = new Set();
            groups.forEach((g) => { for (let p = g.start; p <= g.end; p++) set.add(p); });
            pageNums = Array.from(set).sort((a, b) => a - b);
        }

        const dpi = parseFloat(document.getElementById('images-dpi').value);
        const format = document.getElementById('images-format').value; // 'png' | 'jpeg'
        const quality = parseFloat(document.getElementById('images-quality').value);
        const scale = dpi / 72;
        const mime = format === 'png' ? 'image/png' : 'image/jpeg';
        const ext = format === 'png' ? 'png' : 'jpg';

        imagesState.results = [];
        for (let i = 0; i < pageNums.length; i++) {
            const pageNum = pageNums[i];
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale });
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(viewport.width));
            canvas.height = Math.max(1, Math.round(viewport.height));
            const ctx = canvas.getContext('2d');
            if (format === 'jpeg') {
                // JPEG has no alpha channel; paint a white background first so transparent PDF
                // content doesn't turn black.
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            await page.render({ canvasContext: ctx, viewport }).promise;

            const dataUrl = canvas.toDataURL(mime, format === 'jpeg' ? quality : undefined);
            const imgBytes = PPS.dataUrlToBytes(dataUrl);

            const thumbCanvas = document.createElement('canvas');
            const thumbScale = Math.min(1, 160 / canvas.width);
            thumbCanvas.width = Math.max(1, Math.round(canvas.width * thumbScale));
            thumbCanvas.height = Math.max(1, Math.round(canvas.height * thumbScale));
            thumbCanvas.getContext('2d').drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);

            imagesState.results.push({ pageNum, bytes: imgBytes, mime, ext, canvas: thumbCanvas });
            PPS.setProgress('images', i + 1, pageNums.length, `Rasterizing page ${pageNum} (${i + 1} / ${pageNums.length})…`);
            await PPS.tick();
        }

        renderImagesResults();
        document.getElementById('images-zip-btn').style.display = imagesState.results.length > 1 ? 'inline-flex' : 'none';
        PPS.showAlert('images', 'success', `Rasterized ${imagesState.results.length} page(s) as ${format.toUpperCase()}.`);
    } catch (err) {
        PPS.showAlert('images', 'error', err.message);
    } finally {
        PPS.hideProgress('images');
        btn.disabled = !imagesState.file;
    }
}

async function downloadImagesZip() {
    if (imagesState.results.length === 0) return;
    try {
        const zip = new JSZip();
        imagesState.results.forEach((res) => {
            zip.file(PPS.withExtension(`page_${res.pageNum}`, res.ext), res.bytes);
        });
        const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
        PPS.downloadBlob(zipBlob, `pdf_images_${Date.now()}.zip`);
    } catch (err) {
        PPS.showAlert('images', 'error', err.message);
    }
}

document.addEventListener('DOMContentLoaded', initImages);
