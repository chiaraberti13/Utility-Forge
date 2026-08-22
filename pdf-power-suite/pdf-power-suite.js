'use strict';

/*
 * PDF Power Suite — core module.
 *
 * Holds shared utilities (namespace `PPS`), tab navigation, and the Merge, Split, Compress and
 * Watermark/Bates features. Reusable "operation" functions are exposed on `PPS.ops` so the
 * Pipeline Builder (pdf-power-suite-pipeline.js) can chain them without duplicating logic. The
 * other feature files (diff, table extraction, mail merge, OCR) load after this one and rely on
 * the helpers defined here.
 */

// pdf.js needs an explicit worker URL when not using ES modules.
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js';

const PPS = {
    MAX_FILE_SIZE_BYTES: 100 * 1024 * 1024, // 100 MB per file
    MAX_PAGES: 500,                          // per document, and per merged/rebuilt output
    MAX_TOTAL_MERGE_PAGES: 500,

    // --- generic helpers -------------------------------------------------

    formatBytes(bytes) {
        if (!Number.isFinite(bytes)) return '—';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    },

    // Strips path separators and control characters so a name can be safely used as a download
    // filename or a ZIP entry, whatever its origin (uploaded file name, CSV cell, etc).
    sanitizeFilename(name, fallback = 'file') {
        let safe = String(name == null ? '' : name).replace(/[\/\\?%*:|"<>\x00-\x1F]/g, '_').trim();
        safe = safe.replace(/^\.+/, '').slice(0, 150);
        if (safe === '') safe = fallback;
        return safe;
    },

    withExtension(name, ext) {
        const safe = PPS.sanitizeFilename(name);
        return safe.toLowerCase().endsWith('.' + ext) ? safe : safe + '.' + ext;
    },

    isPdfFile(file) {
        return file && (file.type === 'application/pdf' || /\.pdf$/i.test(file.name));
    },

    checkFileSize(file) {
        if (file.size > PPS.MAX_FILE_SIZE_BYTES) {
            throw new Error(`"${file.name}" is ${PPS.formatBytes(file.size)}, which is over the ${PPS.formatBytes(PPS.MAX_FILE_SIZE_BYTES)} limit per file.`);
        }
    },

    checkPageCount(count, label = 'document') {
        if (count > PPS.MAX_PAGES) {
            throw new Error(`The ${label} has ${count} pages, which is over the ${PPS.MAX_PAGES}-page limit. Split it into smaller files first.`);
        }
    },

    readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(new Uint8Array(reader.result));
            reader.onerror = () => reject(new Error(`Could not read "${file.name}".`));
            reader.readAsArrayBuffer(file);
        });
    },

    dataUrlToBytes(dataUrl) {
        const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return bytes;
    },

    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = PPS.sanitizeFilename(filename);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    },

    downloadBytes(bytes, filename, mime = 'application/pdf') {
        PPS.downloadBlob(new Blob([bytes], { type: mime }), filename);
    },

    // Yield to the browser so long synchronous stretches don't freeze the tab / the "Aw, Snap"
    // watchdog. Called periodically inside per-page loops.
    tick() {
        return new Promise((resolve) => setTimeout(resolve, 0));
    },

    // --- UI helpers (alert boxes + progress bars, addressed by a per-panel prefix) -------------

    showAlert(prefix, type, message) {
        const box = document.getElementById(`${prefix}-alert-${type}`);
        const other = document.getElementById(`${prefix}-alert-${type === 'success' ? 'error' : 'success'}`);
        if (!box) return;
        box.querySelector('span').textContent = message;
        box.classList.add('show');
        if (other) other.classList.remove('show');
        if (type === 'success') {
            clearTimeout(box._hideTimer);
            box._hideTimer = setTimeout(() => box.classList.remove('show'), 8000);
        }
    },

    hideAlerts(prefix) {
        ['success', 'error'].forEach((t) => {
            const box = document.getElementById(`${prefix}-alert-${t}`);
            if (box) box.classList.remove('show');
        });
    },

    showProgress(prefix) {
        const c = document.getElementById(`${prefix}-progress`);
        if (c) c.style.display = 'block';
    },

    hideProgress(prefix) {
        const c = document.getElementById(`${prefix}-progress`);
        if (c) c.style.display = 'none';
    },

    setProgress(prefix, current, total, label) {
        const fill = document.getElementById(`${prefix}-progress-fill`);
        const text = document.getElementById(`${prefix}-progress-text`);
        const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
        if (fill) fill.style.width = pct + '%';
        if (text) text.textContent = label || `${current} / ${total}`;
    },

    // Builds one row for a file list (used by Merge's multi-file list and every single-file
    // upload panel). All text is set via textContent, never innerHTML.
    createFileRow(name, sizeBytes, handlers = {}) {
        const row = document.createElement('div');
        row.className = 'file-row';

        const icon = document.createElement('i');
        icon.setAttribute('data-lucide', 'file-text');
        icon.style.color = '#737373';
        row.appendChild(icon);

        const nameEl = document.createElement('div');
        nameEl.className = 'file-name';
        nameEl.textContent = name;
        nameEl.title = name;
        row.appendChild(nameEl);

        const metaEl = document.createElement('div');
        metaEl.className = 'file-meta';
        metaEl.textContent = PPS.formatBytes(sizeBytes);
        row.appendChild(metaEl);

        const controls = document.createElement('div');
        controls.className = 'file-controls';
        if (handlers.onUp) controls.appendChild(PPS.iconButton('chevron-up', handlers.onUp, handlers.upDisabled));
        if (handlers.onDown) controls.appendChild(PPS.iconButton('chevron-down', handlers.onDown, handlers.downDisabled));
        if (handlers.onRemove) controls.appendChild(PPS.iconButton('x', handlers.onRemove));
        row.appendChild(controls);

        return row;
    },

    iconButton(iconName, handler, disabled = false) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-icon';
        btn.disabled = !!disabled;
        const icon = document.createElement('i');
        icon.setAttribute('data-lucide', iconName);
        icon.setAttribute('width', '14');
        icon.setAttribute('height', '14');
        btn.appendChild(icon);
        btn.addEventListener('click', handler);
        return btn;
    },

    setupDropzone(areaId, inputId, onFiles) {
        const area = document.getElementById(areaId);
        const input = document.getElementById(inputId);
        if (!area || !input) return;
        area.addEventListener('click', () => input.click());
        area.addEventListener('dragover', (e) => { e.preventDefault(); area.classList.add('dragover'); });
        area.addEventListener('dragleave', () => area.classList.remove('dragover'));
        area.addEventListener('drop', (e) => {
            e.preventDefault();
            area.classList.remove('dragover');
            if (e.dataTransfer.files && e.dataTransfer.files.length) onFiles(Array.from(e.dataTransfer.files));
        });
        input.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length) onFiles(Array.from(e.target.files));
            input.value = '';
        });
    },

    // Parses a page-range string like "1-3,4,7-9" against a page count, 1-based inclusive.
    // Returns an array of {start, end} groups (each becomes one output file when splitting).
    parsePageRanges(input, maxPage) {
        const groups = [];
        const tokens = String(input).split(',').map((t) => t.trim()).filter((t) => t !== '');
        if (tokens.length === 0) throw new Error('Enter at least one page or range, e.g. "1-3,4,7-9".');
        for (const token of tokens) {
            const m = token.match(/^(\d+)(?:-(\d+))?$/);
            if (!m) throw new Error(`"${token}" is not a valid page or range.`);
            const start = parseInt(m[1], 10);
            const end = m[2] ? parseInt(m[2], 10) : start;
            if (start < 1 || end < 1 || start > maxPage || end > maxPage) {
                throw new Error(`"${token}" is out of range — this document has ${maxPage} pages.`);
            }
            if (start > end) throw new Error(`"${token}" has a start page after its end page.`);
            groups.push({ start, end });
        }
        return groups;
    },

    ops: {}, // filled in below by each feature (used by the Pipeline Builder)
};

window.PPS = PPS;

// --- tab navigation ------------------------------------------------------

function initNav() {
    const buttons = document.querySelectorAll('.nav-btn');
    buttons.forEach((btn) => {
        btn.addEventListener('click', () => {
            buttons.forEach((b) => b.classList.remove('active'));
            document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
            btn.classList.add('active');
            const panel = document.getElementById('panel-' + btn.dataset.tab);
            if (panel) panel.classList.add('active');
            if (window.lucide) lucide.createIcons();
        });
    });
}

// ==========================================================================
// MERGE
// ==========================================================================

const mergeState = { files: [] }; // [{file, id}]
let mergeIdSeq = 0;

function renderMergeList() {
    const list = document.getElementById('merge-file-list');
    list.textContent = '';
    mergeState.files.forEach((entry, idx) => {
        const row = PPS.createFileRow(entry.file.name, entry.file.size, {
            onUp: () => moveMergeFile(idx, -1),
            upDisabled: idx === 0,
            onDown: () => moveMergeFile(idx, 1),
            downDisabled: idx === mergeState.files.length - 1,
            onRemove: () => removeMergeFile(entry.id),
        });
        list.appendChild(row);
    });
    document.getElementById('merge-run-btn').disabled = mergeState.files.length < 1;
    if (window.lucide) lucide.createIcons();
}

function moveMergeFile(idx, dir) {
    const j = idx + dir;
    if (j < 0 || j >= mergeState.files.length) return;
    [mergeState.files[idx], mergeState.files[j]] = [mergeState.files[j], mergeState.files[idx]];
    renderMergeList();
}

function removeMergeFile(id) {
    mergeState.files = mergeState.files.filter((e) => e.id !== id);
    renderMergeList();
}

function addMergeFiles(fileList) {
    PPS.hideAlerts('merge');
    for (const file of fileList) {
        if (!PPS.isPdfFile(file)) {
            PPS.showAlert('merge', 'error', `"${file.name}" is not a PDF and was skipped.`);
            continue;
        }
        try {
            PPS.checkFileSize(file);
        } catch (err) {
            PPS.showAlert('merge', 'error', err.message);
            continue;
        }
        mergeState.files.push({ file, id: ++mergeIdSeq });
    }
    renderMergeList();
}

// Core merge operation, reused by the Pipeline Builder. Accepts an array of {bytes, name}.
PPS.ops.merge = async function mergeOp(inputs, onProgress) {
    const merged = await PDFLib.PDFDocument.create();
    let totalPages = 0;
    const loaded = [];
    for (const input of inputs) {
        let src;
        try {
            src = await PDFLib.PDFDocument.load(input.bytes, { ignoreEncryption: true });
        } catch (err) {
            throw new Error(`"${input.name}" could not be read as a PDF (${err.message}).`);
        }
        totalPages += src.getPageCount();
        loaded.push(src);
    }
    PPS.checkPageCount(totalPages, 'merged document');
    for (let i = 0; i < loaded.length; i++) {
        const src = loaded[i];
        const pages = await merged.copyPages(src, src.getPageIndices());
        pages.forEach((p) => merged.addPage(p));
        if (onProgress) onProgress(i + 1, loaded.length);
        await PPS.tick();
    }
    return merged.save();
};

async function runMerge() {
    if (mergeState.files.length < 1) return;
    const btn = document.getElementById('merge-run-btn');
    btn.disabled = true;
    PPS.hideAlerts('merge');
    PPS.showProgress('merge');
    PPS.setProgress('merge', 0, mergeState.files.length, 'Reading files…');
    try {
        const inputs = [];
        for (const entry of mergeState.files) {
            inputs.push({ name: entry.file.name, bytes: await PPS.readFileAsArrayBuffer(entry.file) });
        }
        const bytes = await PPS.ops.merge(inputs, (done, total) => PPS.setProgress('merge', done, total, `Merging ${done} / ${total}…`));
        PPS.downloadBytes(bytes, 'merged.pdf');
        PPS.showAlert('merge', 'success', `Merged ${mergeState.files.length} files into merged.pdf (${PPS.formatBytes(bytes.length)}).`);
    } catch (err) {
        PPS.showAlert('merge', 'error', err.message);
    } finally {
        PPS.hideProgress('merge');
        btn.disabled = mergeState.files.length < 1;
    }
}

function initMerge() {
    PPS.setupDropzone('merge-upload', 'merge-file-input', addMergeFiles);
    document.getElementById('merge-run-btn').addEventListener('click', runMerge);
    document.getElementById('merge-clear-btn').addEventListener('click', () => {
        mergeState.files = [];
        renderMergeList();
        PPS.hideAlerts('merge');
    });
}

// ==========================================================================
// SPLIT
// ==========================================================================

const splitState = { file: null };

function initSplit() {
    PPS.setupDropzone('split-upload', 'split-file-input', (files) => {
        PPS.hideAlerts('split');
        const file = files[0];
        if (!PPS.isPdfFile(file)) { PPS.showAlert('split', 'error', `"${file.name}" is not a PDF.`); return; }
        try { PPS.checkFileSize(file); } catch (err) { PPS.showAlert('split', 'error', err.message); return; }
        splitState.file = file;
        const list = document.getElementById('split-file-list');
        list.textContent = '';
        list.appendChild(PPS.createFileRow(file.name, file.size, { onRemove: () => { splitState.file = null; list.textContent = ''; document.getElementById('split-run-btn').disabled = true; } }));
        if (window.lucide) lucide.createIcons();
        document.getElementById('split-run-btn').disabled = false;
    });

    document.querySelectorAll('input[name="split-mode"]').forEach((radio) => {
        radio.addEventListener('change', () => {
            document.getElementById('split-ranges-row').style.display =
                document.getElementById('split-mode-ranges').checked ? 'block' : 'none';
        });
    });

    document.getElementById('split-run-btn').addEventListener('click', runSplit);
}

async function runSplit() {
    if (!splitState.file) return;
    const btn = document.getElementById('split-run-btn');
    btn.disabled = true;
    PPS.hideAlerts('split');
    PPS.showProgress('split');
    PPS.setProgress('split', 0, 1, 'Reading file…');
    try {
        const bytes = await PPS.readFileAsArrayBuffer(splitState.file);
        const src = await PDFLib.PDFDocument.load(bytes, { ignoreEncryption: true });
        const pageCount = src.getPageCount();
        PPS.checkPageCount(pageCount, 'document');

        const byRanges = document.getElementById('split-mode-ranges').checked;
        let groups;
        if (byRanges) {
            const raw = document.getElementById('split-ranges-input').value;
            groups = PPS.parsePageRanges(raw, pageCount);
        } else {
            groups = Array.from({ length: pageCount }, (_, i) => ({ start: i + 1, end: i + 1 }));
        }

        const zip = new JSZip();
        const padWidth = String(groups.length).length;
        for (let i = 0; i < groups.length; i++) {
            const { start, end } = groups[i];
            const out = await PDFLib.PDFDocument.create();
            const indices = [];
            for (let p = start; p <= end; p++) indices.push(p - 1);
            const pages = await out.copyPages(src, indices);
            pages.forEach((p) => out.addPage(p));
            const outBytes = await out.save();
            const label = start === end ? `page_${String(start).padStart(padWidth, '0')}` : `pages_${start}-${end}`;
            zip.file(PPS.withExtension(label, 'pdf'), outBytes);
            PPS.setProgress('split', i + 1, groups.length, `Splitting ${i + 1} / ${groups.length}…`);
            await PPS.tick();
        }

        const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
        PPS.downloadBlob(zipBlob, `split_${Date.now()}.zip`);
        PPS.showAlert('split', 'success', `Created ${groups.length} file(s) from ${pageCount} pages.`);
    } catch (err) {
        PPS.showAlert('split', 'error', err.message);
    } finally {
        PPS.hideProgress('split');
        btn.disabled = !splitState.file;
    }
}

// ==========================================================================
// COMPRESS
// ==========================================================================

const compressState = { file: null };

// Core compress operation, reused by the Pipeline Builder.
PPS.ops.compress = async function compressOp(bytes, { dpi = 150, quality = 0.75 } = {}, onProgress) {
    const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
    PPS.checkPageCount(pdf.numPages, 'document');
    const out = await PDFLib.PDFDocument.create();
    const scale = dpi / 72;

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const baseViewport = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(viewport.width));
        canvas.height = Math.max(1, Math.round(viewport.height));
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const jpgBytes = PPS.dataUrlToBytes(dataUrl);
        const jpgImage = await out.embedJpg(jpgBytes);

        const outPage = out.addPage([baseViewport.width, baseViewport.height]);
        outPage.drawImage(jpgImage, { x: 0, y: 0, width: baseViewport.width, height: baseViewport.height });

        if (onProgress) onProgress(i, pdf.numPages);
        await PPS.tick();
    }
    return out.save();
};

function initCompress() {
    PPS.setupDropzone('compress-upload', 'compress-file-input', (files) => {
        PPS.hideAlerts('compress');
        const file = files[0];
        if (!PPS.isPdfFile(file)) { PPS.showAlert('compress', 'error', `"${file.name}" is not a PDF.`); return; }
        try { PPS.checkFileSize(file); } catch (err) { PPS.showAlert('compress', 'error', err.message); return; }
        compressState.file = file;
        const list = document.getElementById('compress-file-list');
        list.textContent = '';
        list.appendChild(PPS.createFileRow(file.name, file.size, { onRemove: () => { compressState.file = null; list.textContent = ''; document.getElementById('compress-run-btn').disabled = true; } }));
        if (window.lucide) lucide.createIcons();
        document.getElementById('compress-run-btn').disabled = false;
    });

    const dpiSlider = document.getElementById('compress-dpi');
    const dpiValue = document.getElementById('compress-dpi-value');
    dpiSlider.addEventListener('input', () => { dpiValue.textContent = dpiSlider.value; });

    const qSlider = document.getElementById('compress-quality');
    const qValue = document.getElementById('compress-quality-value');
    qSlider.addEventListener('input', () => { qValue.textContent = qSlider.value; });

    document.getElementById('compress-run-btn').addEventListener('click', runCompress);
}

async function runCompress() {
    if (!compressState.file) return;
    const btn = document.getElementById('compress-run-btn');
    btn.disabled = true;
    PPS.hideAlerts('compress');
    PPS.showProgress('compress');
    PPS.setProgress('compress', 0, 1, 'Reading file…');
    try {
        const originalSize = compressState.file.size;
        const bytes = await PPS.readFileAsArrayBuffer(compressState.file);
        const dpi = parseFloat(document.getElementById('compress-dpi').value);
        const quality = parseFloat(document.getElementById('compress-quality').value);
        const outBytes = await PPS.ops.compress(bytes, { dpi, quality }, (done, total) => PPS.setProgress('compress', done, total, `Rasterizing page ${done} / ${total}…`));
        PPS.downloadBytes(outBytes, 'compressed.pdf');
        const pct = originalSize > 0 ? Math.round((1 - outBytes.length / originalSize) * 100) : 0;
        PPS.showAlert('compress', 'success', `Compressed: ${PPS.formatBytes(originalSize)} → ${PPS.formatBytes(outBytes.length)} (${pct >= 0 ? pct + '% smaller' : Math.abs(pct) + '% larger'}).`);
    } catch (err) {
        PPS.showAlert('compress', 'error', err.message);
    } finally {
        PPS.hideProgress('compress');
        btn.disabled = !compressState.file;
    }
}

// ==========================================================================
// WATERMARK & BATES
// ==========================================================================

const watermarkState = { file: null };

function computeStampPosition(position, pageWidth, pageHeight, textWidth, textHeight, margin) {
    switch (position) {
        case 'top-left': return { x: margin, y: pageHeight - margin - textHeight };
        case 'top-right': return { x: pageWidth - margin - textWidth, y: pageHeight - margin - textHeight };
        case 'bottom-left': return { x: margin, y: margin };
        case 'bottom-right': return { x: pageWidth - margin - textWidth, y: margin };
        case 'center':
        default: return { x: (pageWidth - textWidth) / 2, y: (pageHeight - textHeight) / 2 };
    }
}

// Core watermark operation, reused by the Pipeline Builder.
PPS.ops.watermark = async function watermarkOp(bytes, cfg) {
    return applyStamps(bytes, { watermark: cfg, bates: null });
};

// Core Bates-numbering operation, reused by the Pipeline Builder.
PPS.ops.bates = async function batesOp(bytes, cfg) {
    return applyStamps(bytes, { watermark: null, bates: cfg });
};

async function applyStamps(bytes, { watermark, bates }) {
    const pdfDoc = await PDFLib.PDFDocument.load(bytes, { ignoreEncryption: true });
    PPS.checkPageCount(pdfDoc.getPageCount(), 'document');
    const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();

    for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();

        if (watermark && watermark.text) {
            const size = watermark.fontSize;
            const textWidth = font.widthOfTextAtSize(watermark.text, size);
            const pos = computeStampPosition(watermark.position, width, height, textWidth, size, 24);
            page.drawText(watermark.text, {
                x: pos.x,
                y: pos.y,
                size,
                font,
                color: PDFLib.rgb(0.35, 0.35, 0.35),
                opacity: watermark.opacity,
                rotate: PDFLib.degrees(watermark.rotation),
            });
        }

        if (bates) {
            const number = String(bates.start + i).padStart(bates.digits, '0');
            const text = `${bates.prefix}${number}${bates.suffix}`;
            const size = 10;
            const textWidth = font.widthOfTextAtSize(text, size);
            const pos = computeStampPosition(bates.position, width, height, textWidth, size, 18);
            page.drawText(text, { x: pos.x, y: pos.y, size, font, color: PDFLib.rgb(0, 0, 0), opacity: 1 });
        }

        if (i % 25 === 0) await PPS.tick();
    }

    return pdfDoc.save();
}

function initWatermark() {
    PPS.setupDropzone('watermark-upload', 'watermark-file-input', (files) => {
        PPS.hideAlerts('watermark');
        const file = files[0];
        if (!PPS.isPdfFile(file)) { PPS.showAlert('watermark', 'error', `"${file.name}" is not a PDF.`); return; }
        try { PPS.checkFileSize(file); } catch (err) { PPS.showAlert('watermark', 'error', err.message); return; }
        watermarkState.file = file;
        const list = document.getElementById('watermark-file-list');
        list.textContent = '';
        list.appendChild(PPS.createFileRow(file.name, file.size, { onRemove: () => { watermarkState.file = null; list.textContent = ''; document.getElementById('watermark-run-btn').disabled = true; } }));
        if (window.lucide) lucide.createIcons();
        document.getElementById('watermark-run-btn').disabled = false;
    });

    const bindRange = (id, valueId) => {
        const el = document.getElementById(id);
        const val = document.getElementById(valueId);
        el.addEventListener('input', () => { val.textContent = el.value; });
    };
    bindRange('wm-rotation', 'wm-rotation-value');
    bindRange('wm-opacity', 'wm-opacity-value');
    bindRange('wm-fontsize', 'wm-fontsize-value');

    document.getElementById('watermark-run-btn').addEventListener('click', runWatermark);
}

async function runWatermark() {
    if (!watermarkState.file) return;
    const btn = document.getElementById('watermark-run-btn');
    const wmOn = document.getElementById('wm-enable').checked;
    const batesOn = document.getElementById('bates-enable').checked;
    if (!wmOn && !batesOn) {
        PPS.showAlert('watermark', 'error', 'Enable the watermark, Bates numbering, or both before running.');
        return;
    }
    btn.disabled = true;
    PPS.hideAlerts('watermark');
    PPS.showProgress('watermark');
    PPS.setProgress('watermark', 0, 1, 'Reading file…');
    try {
        const bytes = await PPS.readFileAsArrayBuffer(watermarkState.file);
        const watermark = wmOn ? {
            text: document.getElementById('wm-text').value.trim(),
            rotation: parseFloat(document.getElementById('wm-rotation').value),
            opacity: parseFloat(document.getElementById('wm-opacity').value),
            fontSize: parseFloat(document.getElementById('wm-fontsize').value),
            position: document.getElementById('wm-position').value,
        } : null;
        if (watermark && !watermark.text) throw new Error('Watermark text cannot be empty.');
        const bates = batesOn ? {
            prefix: document.getElementById('bates-prefix').value,
            suffix: document.getElementById('bates-suffix').value,
            start: parseInt(document.getElementById('bates-start').value, 10) || 0,
            digits: Math.max(1, parseInt(document.getElementById('bates-digits').value, 10) || 6),
            position: document.getElementById('bates-position').value,
        } : null;

        PPS.setProgress('watermark', 0, 1, 'Stamping pages…');
        const outBytes = await applyStamps(bytes, { watermark, bates });
        PPS.downloadBytes(outBytes, 'watermarked.pdf');
        const parts = [];
        if (wmOn) parts.push('watermark');
        if (batesOn) parts.push('Bates numbering');
        PPS.showAlert('watermark', 'success', `Applied ${parts.join(' and ')} to every page.`);
    } catch (err) {
        PPS.showAlert('watermark', 'error', err.message);
    } finally {
        PPS.hideProgress('watermark');
        btn.disabled = !watermarkState.file;
    }
}

// ==========================================================================
// bootstrap
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initMerge();
    initSplit();
    initCompress();
    initWatermark();
    if (window.lucide) lucide.createIcons();
});
