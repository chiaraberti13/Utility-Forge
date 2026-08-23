'use strict';

/*
 * PDF Power Suite — Pagine (standalone page management) feature.
 *
 * Loads one PDF, renders a low-resolution thumbnail per page via pdf.js, and lets the user
 * reorder pages (native HTML5 drag & drop), rotate individual pages in 90° steps, and delete
 * pages, entirely client-side. Export rebuilds the PDF with pdf-lib: pdfDoc.copyPages() for the
 * new order, then page.setRotation() to combine the page's existing rotation with the user's
 * chosen delta — the same building blocks Merge and Split already use elsewhere in this tool.
 */

const pagesState = { file: null, pdfBytes: null, entries: [] }; // entries: [{originalIndex, rotation, canvas}]
let pagesDragFromIndex = null;

function initPages() {
    PPS.setupDropzone('pages-upload', 'pages-file-input', (files) => {
        PPS.hideAlerts('pages');
        const file = files[0];
        if (!PPS.isPdfFile(file)) { PPS.showAlert('pages', 'error', `"${file.name}" is not a PDF.`); return; }
        try { PPS.checkFileSize(file); } catch (err) { PPS.showAlert('pages', 'error', err.message); return; }
        pagesState.file = file;
        const list = document.getElementById('pages-file-list');
        list.textContent = '';
        list.appendChild(PPS.createFileRow(file.name, file.size, {
            onRemove: () => {
                pagesState.file = null;
                pagesState.pdfBytes = null;
                pagesState.entries = [];
                list.textContent = '';
                document.getElementById('pages-grid').textContent = '';
                document.getElementById('pages-hint').style.display = 'none';
                document.getElementById('pages-run-btn').disabled = true;
                document.getElementById('pages-reset-btn').style.display = 'none';
            },
        }));
        if (window.lucide) lucide.createIcons();
        loadPagesFile(file);
    });

    document.getElementById('pages-run-btn').addEventListener('click', runPagesExport);
    document.getElementById('pages-reset-btn').addEventListener('click', () => {
        if (pagesState.pdfBytes) renderThumbnailsFromBytes(pagesState.pdfBytes);
    });
}

async function loadPagesFile(file) {
    PPS.hideAlerts('pages');
    try {
        const bytes = await PPS.readFileAsArrayBuffer(file);
        pagesState.pdfBytes = bytes;
        await renderThumbnailsFromBytes(bytes);
    } catch (err) {
        PPS.showAlert('pages', 'error', err.message);
    }
}

async function renderThumbnailsFromBytes(bytes) {
    const grid = document.getElementById('pages-grid');
    grid.textContent = '';
    document.getElementById('pages-run-btn').disabled = true;
    document.getElementById('pages-hint').style.display = 'none';
    PPS.showProgress('pages');
    PPS.setProgress('pages', 0, 1, 'Loading PDF…');
    try {
        const pdf = await pdfjsLib.getDocument({ data: bytes.slice() }).promise;
        PPS.checkPageCount(pdf.numPages, 'document');
        pagesState.entries = [];
        const targetWidth = 160;
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const baseViewport = page.getViewport({ scale: 1 });
            const scale = targetWidth / baseViewport.width;
            const viewport = page.getViewport({ scale });
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(viewport.width));
            canvas.height = Math.max(1, Math.round(viewport.height));
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            await page.render({ canvasContext: ctx, viewport }).promise;
            pagesState.entries.push({ originalIndex: i - 1, rotation: 0, canvas });
            PPS.setProgress('pages', i, pdf.numPages, `Rendering thumbnail ${i} / ${pdf.numPages}…`);
            await PPS.tick();
        }
        document.getElementById('pages-hint').style.display = pagesState.entries.length ? 'block' : 'none';
        renderPagesGrid();
    } catch (err) {
        PPS.showAlert('pages', 'error', err.message);
    } finally {
        PPS.hideProgress('pages');
    }
}

function renderPagesGrid() {
    const grid = document.getElementById('pages-grid');
    grid.textContent = '';

    pagesState.entries.forEach((entry, idx) => {
        const tile = document.createElement('div');
        tile.className = 'page-tile';
        tile.draggable = true;
        tile.setAttribute('role', 'group');
        tile.setAttribute('aria-label', `Page ${entry.originalIndex + 1}, position ${idx + 1} of ${pagesState.entries.length}`);

        tile.addEventListener('dragstart', (e) => {
            pagesDragFromIndex = idx;
            tile.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            try { e.dataTransfer.setData('text/plain', String(idx)); } catch (err) { /* Safari needs this call even if unused */ }
        });
        tile.addEventListener('dragend', () => {
            tile.classList.remove('dragging');
            pagesDragFromIndex = null;
        });
        tile.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            tile.classList.add('drag-over');
        });
        tile.addEventListener('dragleave', () => tile.classList.remove('drag-over'));
        tile.addEventListener('drop', (e) => {
            e.preventDefault();
            tile.classList.remove('drag-over');
            const from = pagesDragFromIndex;
            if (from === null || from === idx) return;
            const [moved] = pagesState.entries.splice(from, 1);
            pagesState.entries.splice(idx, 0, moved);
            renderPagesGrid();
        });

        const wrap = document.createElement('div');
        wrap.className = 'page-thumb-wrap';
        entry.canvas.style.transform = `rotate(${entry.rotation}deg)`;
        wrap.appendChild(entry.canvas);
        tile.appendChild(wrap);

        const num = document.createElement('div');
        num.className = 'page-num';
        num.textContent = `Page ${entry.originalIndex + 1}`;
        tile.appendChild(num);

        const controls = document.createElement('div');
        controls.className = 'page-controls';
        controls.appendChild(PPS.iconButton('rotate-ccw', () => {
            entry.rotation = (entry.rotation + 270) % 360;
            renderPagesGrid();
        }, false, `Rotate page ${entry.originalIndex + 1} left`));
        controls.appendChild(PPS.iconButton('rotate-cw', () => {
            entry.rotation = (entry.rotation + 90) % 360;
            renderPagesGrid();
        }, false, `Rotate page ${entry.originalIndex + 1} right`));
        controls.appendChild(PPS.iconButton('trash-2', () => {
            pagesState.entries.splice(idx, 1);
            renderPagesGrid();
        }, false, `Delete page ${entry.originalIndex + 1}`));
        tile.appendChild(controls);

        grid.appendChild(tile);
    });

    const hasPages = pagesState.entries.length > 0;
    document.getElementById('pages-run-btn').disabled = !hasPages;
    document.getElementById('pages-reset-btn').style.display = pagesState.pdfBytes ? 'inline-flex' : 'none';
    if (!hasPages) {
        PPS.showAlert('pages', 'error', 'All pages have been deleted — reset or upload a PDF to continue.');
    }
    if (window.lucide) lucide.createIcons();
}

async function runPagesExport() {
    if (!pagesState.pdfBytes || pagesState.entries.length === 0) return;
    const btn = document.getElementById('pages-run-btn');
    btn.disabled = true;
    PPS.hideAlerts('pages');
    PPS.showProgress('pages');
    PPS.setProgress('pages', 0, pagesState.entries.length, 'Rebuilding PDF…');
    try {
        const src = await PDFLib.PDFDocument.load(pagesState.pdfBytes, { ignoreEncryption: true });
        const out = await PDFLib.PDFDocument.create();
        for (let i = 0; i < pagesState.entries.length; i++) {
            const entry = pagesState.entries[i];
            const [copied] = await out.copyPages(src, [entry.originalIndex]);
            const newAngle = (copied.getRotation().angle + entry.rotation + 360) % 360;
            copied.setRotation(PDFLib.degrees(newAngle));
            out.addPage(copied);
            PPS.setProgress('pages', i + 1, pagesState.entries.length, `Adding page ${i + 1} / ${pagesState.entries.length}…`);
            await PPS.tick();
        }
        const bytes = await out.save();
        const baseName = pagesState.file ? pagesState.file.name.replace(/\.pdf$/i, '') : 'pages';
        PPS.downloadBytes(bytes, PPS.withExtension(baseName + '_edited', 'pdf'));
        PPS.showAlert('pages', 'success', `Exported ${pagesState.entries.length} page(s).`);
    } catch (err) {
        PPS.showAlert('pages', 'error', err.message);
    } finally {
        PPS.hideProgress('pages');
        btn.disabled = pagesState.entries.length === 0;
    }
}

document.addEventListener('DOMContentLoaded', initPages);
