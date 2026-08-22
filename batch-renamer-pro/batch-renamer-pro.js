/*
 * Batch Renamer & File Organizer Pro
 * All logic lives in this external file (kept out of the HTML) so the page's
 * Content-Security-Policy can be `script-src 'self' <CDN origins>` with no
 * inline-script hash needed at all.
 *
 * Security notes (see README "Privacy & Security" for the full writeup):
 * - No innerHTML / inline onclick with data derived from files, CSV rows or
 *   filenames anywhere in this file: every dynamic value is written with
 *   textContent and every handler is attached with addEventListener.
 * - Every proposed new filename is sanitized (invalid chars stripped, length
 *   capped) BEFORE it is ever passed to getFileHandle()/getDirectoryHandle().
 *   getFileHandle/removeEntry only ever operate inside the single directory
 *   handle the user granted (that's how the File System Access API sandboxes
 *   itself), so path traversal outside that folder isn't possible through
 *   this API regardless — but path separators are still stripped defensively
 *   here since they are invalid filename characters on every OS anyway.
 */
(() => {
'use strict';

// ---------------------------------------------------------------------------
// Constants & limits
// ---------------------------------------------------------------------------
const MAX_FILES = 5000;
const MAX_NAME_BYTES = 255;
// Characters invalid on at least one of Windows / macOS / Linux, plus ASCII
// control characters. Path separators are included defensively even though
// getFileHandle() cannot escape the granted directory.
const INVALID_CHARS_RE = /[\\/:*?"<>|\x00-\x1F]/g;

// ---------------------------------------------------------------------------
// Pure logic: Levenshtein distance (hand-rolled, no library)
// ---------------------------------------------------------------------------
function levenshteinDistance(a, b) {
    a = String(a);
    b = String(b);
    if (a === b) return 0;
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    let prevRow = new Array(b.length + 1);
    let curRow = new Array(b.length + 1);
    for (let j = 0; j <= b.length; j++) prevRow[j] = j;

    for (let i = 1; i <= a.length; i++) {
        curRow[0] = i;
        const aChar = a.charCodeAt(i - 1);
        for (let j = 1; j <= b.length; j++) {
            const cost = aChar === b.charCodeAt(j - 1) ? 0 : 1;
            curRow[j] = Math.min(
                prevRow[j] + 1,      // deletion
                curRow[j - 1] + 1,   // insertion
                prevRow[j - 1] + cost // substitution
            );
        }
        [prevRow, curRow] = [curRow, prevRow];
    }
    return prevRow[b.length];
}

// Normalized similarity in [0,1], 1 = identical. Used to rank fuzzy matches.
function similarity(a, b) {
    const maxLen = Math.max(a.length, b.length);
    if (maxLen === 0) return 1;
    return 1 - levenshteinDistance(a, b) / maxLen;
}

// ---------------------------------------------------------------------------
// Pure logic: filename sanitization
// ---------------------------------------------------------------------------
// Returns { safe, changed, strippedChars } where `safe` is a filename that is
// valid on Windows/macOS/Linux and within the byte-length budget.
function sanitizeFilename(name, maxBytes = MAX_NAME_BYTES) {
    const original = String(name);
    let strippedChars = [];
    let safe = original.replace(INVALID_CHARS_RE, (ch) => {
        strippedChars.push(ch);
        return '';
    });

    // Trailing dots/spaces are problematic on Windows.
    const trimmed = safe.replace(/[ .]+$/, '');
    if (trimmed !== safe) safe = trimmed;

    // Windows reserved device names (case-insensitive), with or without ext.
    const reserved = /^(CON|PRN|AUX|NUL|COM[0-9]|LPT[0-9])(\.[^.]*)?$/i;
    if (reserved.test(safe)) {
        safe = '_' + safe;
    }

    if (safe === '') safe = '_';

    // Enforce a safe byte length (UTF-8), preserving the extension when we
    // have to truncate.
    let bytes = utf8ByteLength(safe);
    if (bytes > maxBytes) {
        const dot = safe.lastIndexOf('.');
        const ext = dot > 0 ? safe.slice(dot) : '';
        let base = dot > 0 ? safe.slice(0, dot) : safe;
        const extBytes = utf8ByteLength(ext);
        let budget = Math.max(1, maxBytes - extBytes);
        while (utf8ByteLength(base) > budget && base.length > 0) {
            base = base.slice(0, -1);
        }
        safe = base + ext;
        bytes = utf8ByteLength(safe);
    }

    return {
        safe,
        changed: safe !== original,
        strippedChars: [...new Set(strippedChars)],
        byteLength: bytes,
        tooLong: bytes > maxBytes && original.length > 0 && utf8ByteLength(original) > maxBytes
    };
}

function utf8ByteLength(str) {
    return new TextEncoder().encode(str).length;
}

// ---------------------------------------------------------------------------
// Pure logic: template parsing
// ---------------------------------------------------------------------------
// Supported placeholders:
//   {orig}               -> original filename without extension
//   {ext}                -> extension, including the leading dot
//   {seq} / {seq:000}    -> sequence number, zero-padded to the digit count
//                           given after ':' (width = length of that literal)
//   {date} / {date:YYYYMMDD} -> last-modified date, optional format
//   {exifdate} / {exifdate:YYYYMMDD} -> EXIF capture date, optional format
//   {csv:ColumnName}     -> value from the matched CSV row for this file
//
// `ctx` shape: { orig, ext, seq, date (Date|null), exifdate (Date|null), csvRow (object|null) }
const PLACEHOLDER_RE = /\{([a-zA-Z]+)(?::([^}]*))?\}/g;

function formatDate(d, fmt) {
    if (!d || isNaN(d.getTime())) return '';
    const pad = (n, w = 2) => String(n).padStart(w, '0');
    const yyyy = d.getFullYear();
    const MM = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    const ss = pad(d.getSeconds());

    if (!fmt) fmt = 'YYYYMMDD';
    return fmt
        .replace(/YYYY/g, yyyy)
        .replace(/MM/g, MM)
        .replace(/DD/g, dd)
        .replace(/hh/g, hh)
        .replace(/mm/g, mm)
        .replace(/ss/g, ss);
}

function applyTemplate(pattern, ctx) {
    return String(pattern).replace(PLACEHOLDER_RE, (whole, key, arg) => {
        switch (key) {
            case 'orig':
                return ctx.orig ?? '';
            case 'ext':
                return ctx.ext ?? '';
            case 'seq': {
                const width = arg !== undefined ? arg.length : 0;
                const n = String(ctx.seq ?? 0);
                return width > 0 ? n.padStart(width, '0') : n;
            }
            case 'date':
                return formatDate(ctx.date, arg);
            case 'exifdate':
                return ctx.exifdate ? formatDate(ctx.exifdate, arg) : '';
            case 'csv': {
                if (!ctx.csvRow || !arg) return '';
                // Case-insensitive column lookup.
                const key2 = Object.keys(ctx.csvRow).find(
                    (k) => k.toLowerCase() === arg.toLowerCase()
                );
                return key2 !== undefined ? String(ctx.csvRow[key2] ?? '') : '';
            }
            default:
                return whole; // Unknown placeholder: leave it untouched.
        }
    });
}

function splitExt(filename) {
    const dot = filename.lastIndexOf('.');
    if (dot <= 0) return { base: filename, ext: '' };
    return { base: filename.slice(0, dot), ext: filename.slice(dot) };
}

// ---------------------------------------------------------------------------
// Pure logic: CSV/XLSX mapping matching
// ---------------------------------------------------------------------------
// rows: array of plain objects (from XLSX.utils.sheet_to_json)
// files: array of { name }
// Returns array of { file, row, matchType: 'exact'|'ci'|'fuzzy'|'none', score }
function matchRowsToFiles(rows, files, fromCol, toCol, fuzzyThreshold = 0.75) {
    const byExact = new Map();
    const byLower = new Map();
    rows.forEach((row) => {
        const key = String(row[fromCol] ?? '').trim();
        if (key === '') return;
        if (!byExact.has(key)) byExact.set(key, row);
        const lower = key.toLowerCase();
        if (!byLower.has(lower)) byLower.set(lower, row);
    });

    const usedRows = new Set();
    const results = [];

    for (const file of files) {
        const name = file.name;
        let matchType = 'none';
        let row = null;
        let score = 0;

        if (byExact.has(name)) {
            row = byExact.get(name);
            matchType = 'exact';
            score = 1;
        } else if (byLower.has(name.toLowerCase())) {
            row = byLower.get(name.toLowerCase());
            matchType = 'ci';
            score = 0.99;
        } else {
            // Fuzzy fallback: best-scoring unused row above threshold.
            let best = null;
            let bestScore = 0;
            for (const r of rows) {
                const key = String(r[fromCol] ?? '').trim();
                if (key === '') continue;
                const s = similarity(name.toLowerCase(), key.toLowerCase());
                if (s > bestScore) {
                    bestScore = s;
                    best = r;
                }
            }
            if (best && bestScore >= fuzzyThreshold) {
                row = best;
                matchType = 'fuzzy';
                score = bestScore;
            }
        }

        results.push({ file, row, matchType, score, toValue: row ? row[toCol] : undefined });
    }

    return results;
}

// ---------------------------------------------------------------------------
// Pure logic: collision resolution
// ---------------------------------------------------------------------------
// entries: array of objects with a mutable `.proposedName` string (already
// sanitized). Mutates in place, appending `_1`, `_2`, ... on later
// duplicates, and returns the list of indices that were changed.
function resolveCollisions(entries) {
    const seen = new Map(); // lowercased name -> count
    const changedIndices = [];
    entries.forEach((entry, idx) => {
        const lower = entry.proposedName.toLowerCase();
        const count = seen.get(lower) || 0;
        seen.set(lower, count + 1);
        if (count > 0) {
            const { base, ext } = splitExt(entry.proposedName);
            let n = count;
            let candidate;
            do {
                candidate = `${base}_${n}${ext}`;
                n++;
            } while (seen.has(candidate.toLowerCase()));
            seen.set(candidate.toLowerCase(), 1);
            entry.proposedName = candidate;
            changedIndices.push(idx);
        }
    });
    return changedIndices;
}

// Expose the pure-logic functions for testing (e.g. via Playwright
// page.evaluate) and for use by the rest of this module.
const BatchRenamerCore = {
    levenshteinDistance,
    similarity,
    sanitizeFilename,
    applyTemplate,
    formatDate,
    splitExt,
    matchRowsToFiles,
    resolveCollisions,
    utf8ByteLength,
    MAX_FILES,
    MAX_NAME_BYTES
};
window.BatchRenamerCore = BatchRenamerCore;

// ---------------------------------------------------------------------------
// Application state
// ---------------------------------------------------------------------------
const state = {
    dirHandle: null,
    files: [],          // { name, size, lastModified (Date), handle, path (relative), isImage, exifDate (Date|null) }
    recursive: false,
    flatten: true,
    csvRows: null,       // array of row objects, or null
    csvMode: null,        // 'twoColumn' | 'singleColumn' | null
    csvFromCol: null,
    csvToCol: null,
    sortKey: 'name',
    sortDir: 'asc',
    autoResolveCollisions: true,
    previewEntries: [],   // computed preview rows
    rollbackLog: [],      // { oldName, newName, timestamp }
    lastRunReport: []      // { oldName, newName, result, reason }
};

// ---------------------------------------------------------------------------
// DOM references (populated on DOMContentLoaded)
// ---------------------------------------------------------------------------
let dom = {};

function qs(id) { return document.getElementById(id); }

function initDom() {
    dom = {
        unsupportedBanner: qs('unsupportedBanner'),
        appRoot: qs('appRoot'),
        pickFolderBtn: qs('pickFolderBtn'),
        folderInfo: qs('folderInfo'),
        folderName: qs('folderName'),
        fileCount: qs('fileCount'),
        recursiveToggle: qs('recursiveToggle'),
        flattenToggle: qs('flattenToggle'),
        flattenRow: qs('flattenRow'),
        fileListSection: qs('fileListSection'),
        fileListBody: qs('fileListBody'),
        sortKey: qs('sortKey'),
        sortDir: qs('sortDir'),

        csvInput: qs('csvInput'),
        csvUploadArea: qs('csvUploadArea'),
        csvInfo: qs('csvInfo'),
        csvModeRadios: () => document.querySelectorAll('input[name="csvMode"]'),
        csvFromCol: qs('csvFromCol'),
        csvToCol: qs('csvToCol'),
        csvColsRow: qs('csvColsRow'),
        csvSingleColRow: qs('csvSingleColRow'),
        csvSingleCol: qs('csvSingleCol'),

        templateInput: qs('templateInput'),
        seqStart: qs('seqStart'),
        dateFormat: qs('dateFormat'),
        collisionToggle: qs('collisionToggle'),

        buildPreviewBtn: qs('buildPreviewBtn'),
        previewSection: qs('previewSection'),
        previewBody: qs('previewBody'),
        previewSummary: qs('previewSummary'),
        confirmRunBtn: qs('confirmRunBtn'),

        progressContainer: qs('progressContainer'),
        progressFill: qs('progressFill'),
        progressText: qs('progressText'),

        resultsSection: qs('resultsSection'),
        resultsSummary: qs('resultsSummary'),
        downloadReportBtn: qs('downloadReportBtn'),
        undoLastBtn: qs('undoLastBtn'),
        downloadLogBtn: qs('downloadLogBtn'),
        reuploadLogInput: qs('reuploadLogInput'),
        reuploadLogBtn: qs('reuploadLogBtn'),

        alertBox: qs('alertBox'),
        alertText: qs('alertText')
    };
}

function showAlert(type, message, autoHide = true) {
    if (!dom.alertBox) return;
    dom.alertBox.className = 'alert alert-' + type;
    dom.alertBox.style.display = 'flex';
    dom.alertText.textContent = message;
    refreshIcons();
    if (autoHide) {
        clearTimeout(showAlert._t);
        showAlert._t = setTimeout(() => {
            dom.alertBox.style.display = 'none';
        }, 6000);
    }
}

function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
    }
}

function clearChildren(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
}

// ---------------------------------------------------------------------------
// Feature detection
// ---------------------------------------------------------------------------
function checkSupport() {
    const supported = 'showDirectoryPicker' in window;
    if (!supported) {
        if (dom.unsupportedBanner) dom.unsupportedBanner.style.display = 'flex';
        if (dom.appRoot) dom.appRoot.style.display = 'none';
    } else {
        if (dom.unsupportedBanner) dom.unsupportedBanner.style.display = 'none';
        if (dom.appRoot) dom.appRoot.style.display = 'block';
    }
    return supported;
}

// ---------------------------------------------------------------------------
// Folder listing
// ---------------------------------------------------------------------------
async function pickFolder() {
    try {
        const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
        state.dirHandle = handle;
        await listFolder();
    } catch (err) {
        if (err && err.name === 'AbortError') return; // user cancelled
        showAlert('error', 'Impossibile aprire la cartella: ' + err.message);
    }
}

async function walkDirectory(dirHandle, relPath, out) {
    for await (const [name, handle] of dirHandle.entries()) {
        if (out.length >= MAX_FILES + 1) return; // stop early past the limit
        if (handle.kind === 'file') {
            out.push({ handle, name, path: relPath ? relPath + '/' + name : name, dirHandle });
        } else if (handle.kind === 'directory' && state.recursive) {
            await walkDirectory(handle, relPath ? relPath + '/' + name : name, out);
        }
    }
}

const IMAGE_EXT_RE = /\.(jpe?g|tiff?|png|heic|heif)$/i;

async function listFolder() {
    if (!state.dirHandle) return;
    dom.folderName.textContent = state.dirHandle.name;

    const rawEntries = [];
    await walkDirectory(state.dirHandle, '', rawEntries);

    if (rawEntries.length > MAX_FILES) {
        showAlert('error', `La cartella contiene più di ${MAX_FILES} file (limite per singola operazione). Suddividi il lavoro in più cartelle o sottocartelle.`);
        dom.folderInfo.style.display = 'flex';
        dom.fileCount.textContent = `${rawEntries.length} file (oltre il limite di ${MAX_FILES})`;
        dom.fileListSection.style.display = 'none';
        state.files = [];
        return;
    }

    const files = [];
    for (const entry of rawEntries) {
        let file;
        try {
            file = await entry.handle.getFile();
        } catch (err) {
            continue; // skip unreadable entries rather than failing the whole listing
        }
        const isImage = IMAGE_EXT_RE.test(entry.name);
        let exifDate = null;
        if (isImage && window.exifr) {
            try {
                const buf = await file.arrayBuffer();
                const tags = await window.exifr.parse(buf, { pick: ['DateTimeOriginal', 'CreateDate'] });
                const raw = tags && (tags.DateTimeOriginal || tags.CreateDate);
                if (raw) {
                    const d = raw instanceof Date ? raw : new Date(raw);
                    if (!isNaN(d.getTime())) exifDate = d;
                }
            } catch (err) {
                // Best-effort only: EXIF parsing failures never block the listing.
            }
        }
        files.push({
            name: entry.name,
            path: entry.path,
            size: file.size,
            lastModified: new Date(file.lastModified),
            handle: entry.handle,
            dirHandle: entry.dirHandle,
            isImage,
            exifDate
        });
    }

    state.files = files;
    dom.folderInfo.style.display = 'flex';
    dom.fileCount.textContent = `${files.length} file trovati${state.recursive ? ' (incluse sottocartelle)' : ''}`;
    dom.fileListSection.style.display = files.length ? 'block' : 'none';
    dom.flattenRow.style.display = state.recursive ? 'flex' : 'none';
    renderFileList();
    showAlert('success', `Cartella caricata: ${files.length} file.`);
}

function sortedFiles() {
    const key = state.sortKey;
    const dir = state.sortDir === 'asc' ? 1 : -1;
    return [...state.files].sort((a, b) => {
        let av, bv;
        if (key === 'name') { av = a.name.toLowerCase(); bv = b.name.toLowerCase(); }
        else if (key === 'date') { av = a.lastModified.getTime(); bv = b.lastModified.getTime(); }
        else { av = a.size; bv = b.size; }
        if (av < bv) return -1 * dir;
        if (av > bv) return 1 * dir;
        return 0;
    });
}

function formatBytes(n) {
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    return (n / (1024 * 1024)).toFixed(1) + ' MB';
}

function renderFileList() {
    clearChildren(dom.fileListBody);
    const files = sortedFiles();
    for (const f of files) {
        const tr = document.createElement('tr');

        const tdName = document.createElement('td');
        tdName.textContent = f.path;
        tr.appendChild(tdName);

        const tdSize = document.createElement('td');
        tdSize.textContent = formatBytes(f.size);
        tr.appendChild(tdSize);

        const tdDate = document.createElement('td');
        tdDate.textContent = f.lastModified.toLocaleString();
        tr.appendChild(tdDate);

        const tdExif = document.createElement('td');
        tdExif.textContent = f.exifDate ? f.exifDate.toLocaleString() : '—';
        tr.appendChild(tdExif);

        dom.fileListBody.appendChild(tr);
    }
}

// ---------------------------------------------------------------------------
// CSV / XLSX upload
// ---------------------------------------------------------------------------
function handleCsvFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = window.XLSX.read(data, { type: 'array' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = window.XLSX.utils.sheet_to_json(sheet, { defval: '' });
            if (rows.length === 0) {
                showAlert('error', 'Il foglio non contiene righe di dati.');
                return;
            }
            state.csvRows = rows;
            const columns = Object.keys(rows[0]);
            populateColumnSelectors(columns);
            dom.csvInfo.style.display = 'block';
            dom.csvInfo.textContent = `Caricate ${rows.length} righe, colonne: ${columns.join(', ')}`;
            showAlert('success', `File di mapping caricato: ${rows.length} righe.`);
        } catch (err) {
            showAlert('error', 'Errore nella lettura del file: ' + err.message);
        }
    };
    reader.readAsArrayBuffer(file);
}

function populateColumnSelectors(columns) {
    for (const sel of [dom.csvFromCol, dom.csvToCol, dom.csvSingleCol]) {
        clearChildren(sel);
        for (const col of columns) {
            const opt = document.createElement('option');
            opt.value = col;
            opt.textContent = col;
            sel.appendChild(opt);
        }
    }
    // Best-effort auto-detection of common header names.
    const lower = columns.map((c) => c.toLowerCase());
    const fromGuess = columns[lower.findIndex((c) => /nome.*attuale|current.*name|old.*name|vecchio/.test(c))];
    const toGuess = columns[lower.findIndex((c) => /nome.*nuovo|new.*name|nuovo.*nome/.test(c))];
    if (fromGuess) dom.csvFromCol.value = fromGuess;
    if (toGuess) dom.csvToCol.value = toGuess;
}

function getCsvMode() {
    for (const r of dom.csvModeRadios()) {
        if (r.checked) return r.value;
    }
    return 'twoColumn';
}

// ---------------------------------------------------------------------------
// Preview building
// ---------------------------------------------------------------------------
function buildPreview() {
    if (!state.files.length) {
        showAlert('error', 'Nessun file caricato: seleziona prima una cartella.');
        return;
    }

    const mode = getCsvMode();
    const files = sortedFiles();
    const template = dom.templateInput.value.trim();
    const seqStart = parseInt(dom.seqStart.value, 10) || 1;
    const dateFormat = dom.dateFormat.value.trim() || 'YYYYMMDD';
    state.autoResolveCollisions = dom.collisionToggle.checked;

    let matches = null;
    if (state.csvRows && mode === 'twoColumn') {
        const fromCol = dom.csvFromCol.value;
        const toCol = dom.csvToCol.value;
        state.csvFromCol = fromCol;
        state.csvToCol = toCol;
        matches = matchRowsToFiles(state.csvRows, files, fromCol, toCol);
    }

    const entries = files.map((file, idx) => {
        let proposed;
        let csvRow = null;
        let matchType = null;
        let matchScore = 0;

        if (matches) {
            const m = matches[idx];
            csvRow = m.row;
            matchType = m.matchType;
            matchScore = m.score;
            if (m.row && m.toValue !== undefined && m.toValue !== '') {
                proposed = String(m.toValue);
            } else {
                proposed = null; // no match -> flagged below
            }
        } else if (state.csvRows && mode === 'singleColumn') {
            const col = dom.csvSingleCol.value;
            const row = state.csvRows[idx];
            csvRow = row || null;
            if (row && row[col] !== undefined && row[col] !== '') {
                proposed = String(row[col]);
                matchType = 'position';
                matchScore = 1;
            } else {
                proposed = null;
                matchType = 'none';
            }
        }

        // Template mode: applied whenever a pattern is given. If CSV already
        // produced a name and a template is also given, the template wins
        // (it can reference {csv:...} to combine both).
        if (template) {
            const { base, ext } = splitExt(file.name);
            const ctx = {
                orig: base,
                ext,
                seq: seqStart + idx,
                date: file.lastModified,
                exifdate: file.exifDate,
                csvRow
            };
            proposed = applyTemplate(template, ctx);
        }

        if (proposed === null || proposed === undefined || proposed === '') {
            proposed = file.name; // fallback: no change proposed
        }

        // Preserve original extension if the proposal has none and the
        // original did.
        if (!/\.[^./\\]+$/.test(proposed)) {
            const { ext } = splitExt(file.name);
            if (ext) proposed += ext;
        }

        const sanitized = sanitizeFilename(proposed);

        return {
            file,
            originalProposed: proposed,
            proposedName: sanitized.safe,
            sanitizeChanged: sanitized.changed,
            strippedChars: sanitized.strippedChars,
            tooLong: sanitized.tooLong,
            byteLength: sanitized.byteLength,
            csvRow,
            matchType,
            matchScore,
            noMatch: (state.csvRows && (mode === 'twoColumn' || mode === 'singleColumn') && !template) ? (matchType === 'none' || matchType === null) : false
        };
    });

    let collisionIndices = [];
    if (state.autoResolveCollisions) {
        collisionIndices = resolveCollisions(entries);
    } else {
        // Just flag collisions without renaming them.
        const seen = new Map();
        entries.forEach((e, idx) => {
            const lower = e.proposedName.toLowerCase();
            if (seen.has(lower)) {
                collisionIndices.push(idx);
                collisionIndices.push(seen.get(lower));
            } else {
                seen.set(lower, idx);
            }
        });
        collisionIndices = [...new Set(collisionIndices)];
    }

    entries.forEach((e, idx) => { e.collisionResolved = collisionIndices.includes(idx); });

    state.previewEntries = entries;
    renderPreview();
}

function renderPreview() {
    clearChildren(dom.previewBody);
    let flagged = 0;
    let unchanged = 0;

    for (const e of state.previewEntries) {
        const tr = document.createElement('tr');
        const hasIssue = e.sanitizeChanged || e.tooLong || e.noMatch || (e.matchType === 'fuzzy');
        if (hasIssue) { tr.classList.add('preview-flagged'); flagged++; }
        if (e.file.name === e.proposedName) { tr.classList.add('preview-unchanged'); unchanged++; }

        const tdOld = document.createElement('td');
        tdOld.textContent = e.file.path;
        tr.appendChild(tdOld);

        const tdArrow = document.createElement('td');
        tdArrow.textContent = '→';
        tdArrow.className = 'preview-arrow';
        tr.appendChild(tdArrow);

        const tdNew = document.createElement('td');
        tdNew.textContent = e.proposedName;
        tr.appendChild(tdNew);

        const tdFlags = document.createElement('td');
        tdFlags.className = 'preview-flags';
        const flagsList = [];
        if (e.sanitizeChanged) flagsList.push('caratteri non validi rimossi');
        if (e.tooLong) flagsList.push('nome troppo lungo');
        if (e.collisionResolved) flagsList.push(state.autoResolveCollisions ? 'collisione risolta' : 'COLLISIONE');
        if (e.noMatch) flagsList.push('nessuna corrispondenza CSV');
        if (e.matchType === 'fuzzy') flagsList.push(`corrispondenza approssimata (${Math.round(e.matchScore * 100)}%) — conferma manuale`);
        tdFlags.textContent = flagsList.join(', ');
        tr.appendChild(tdFlags);

        dom.previewBody.appendChild(tr);
    }

    const fuzzyCount = state.previewEntries.filter((e) => e.matchType === 'fuzzy').length;
    dom.previewSummary.textContent =
        `${state.previewEntries.length} file in anteprima — ${flagged} con avvisi, ${unchanged} invariati` +
        (fuzzyCount ? `, ${fuzzyCount} corrispondenze approssimate da confermare` : '');

    dom.previewSection.style.display = 'block';
    // Fuzzy matches require explicit confirmation before the run can proceed.
    dom.confirmRunBtn.disabled = fuzzyCount > 0;
    if (fuzzyCount > 0) {
        showAlert('info', `${fuzzyCount} corrispondenza/e approssimata/e trovate: spunta "Conferma corrispondenze approssimate" per procedere.`, false);
    }
}

// ---------------------------------------------------------------------------
// Execution
// ---------------------------------------------------------------------------
async function renameOneFile(dirHandle, oldName, newName) {
    const oldHandle = await dirHandle.getFileHandle(oldName);
    const file = await oldHandle.getFile();
    const buffer = await file.arrayBuffer();

    const newHandle = await dirHandle.getFileHandle(newName, { create: true });
    const writable = await newHandle.createWritable();
    await writable.write(buffer);
    await writable.close();

    await dirHandle.removeEntry(oldName);
}

async function executeRun() {
    const entries = state.previewEntries.filter((e) => e.file.name !== e.proposedName);
    if (entries.length === 0) {
        showAlert('error', 'Nessuna modifica da applicare: tutti i nomi proposti coincidono con quelli attuali.');
        return;
    }

    dom.progressContainer.style.display = 'block';
    dom.confirmRunBtn.disabled = true;
    dom.buildPreviewBtn.disabled = true;

    const report = [];
    const runLog = [];
    let permissionLost = false;

    for (let i = 0; i < entries.length; i++) {
        const e = entries[i];
        const progressPct = Math.round(((i + 1) / entries.length) * 100);
        dom.progressFill.style.width = progressPct + '%';
        dom.progressText.textContent = `${i + 1} / ${entries.length}`;

        if (permissionLost) {
            report.push({ oldName: e.file.path, newName: e.proposedName, result: 'skipped', reason: 'interrotto: permesso cartella perso' });
            continue;
        }

        try {
            // Only files directly inside the granted top folder (non-recursive
            // or flattened) support renaming into the top-level dirHandle;
            // files kept in subfolders are renamed via their own parent
            // dirHandle (state.flatten controls destination).
            const parentHandle = state.flatten ? state.dirHandle : e.file.dirHandle;
            if (state.flatten && parentHandle !== e.file.dirHandle) {
                // Cross-folder move: read from original parent, write into top folder.
                const oldHandle = await e.file.dirHandle.getFileHandle(e.file.name);
                const file = await oldHandle.getFile();
                const buffer = await file.arrayBuffer();
                const newHandle = await parentHandle.getFileHandle(e.proposedName, { create: true });
                const writable = await newHandle.createWritable();
                await writable.write(buffer);
                await writable.close();
                await e.file.dirHandle.removeEntry(e.file.name);
            } else {
                await renameOneFile(parentHandle, e.file.name, e.proposedName);
            }

            report.push({ oldName: e.file.path, newName: e.proposedName, result: 'renamed', reason: '' });
            runLog.push({ oldName: e.file.name, newName: e.proposedName, timestamp: new Date().toISOString(), dirHandle: parentHandle });
        } catch (err) {
            const isPermission = err && (err.name === 'NotAllowedError' || err.name === 'SecurityError');
            if (isPermission) permissionLost = true;
            report.push({ oldName: e.file.path, newName: e.proposedName, result: 'error', reason: err.message });
        }
    }

    state.rollbackLog = runLog;
    state.lastRunReport = report;

    dom.progressContainer.style.display = 'none';
    dom.buildPreviewBtn.disabled = false;

    const renamed = report.filter((r) => r.result === 'renamed').length;
    const errored = report.filter((r) => r.result === 'error').length;
    const skipped = report.filter((r) => r.result === 'skipped').length;

    dom.resultsSection.style.display = 'block';
    dom.resultsSummary.textContent = `${renamed} rinominati, ${errored} errori, ${skipped} saltati.` +
        (permissionLost ? ' Il permesso sulla cartella è stato revocato durante l\'esecuzione: operazione interrotta in sicurezza.' : '');
    dom.undoLastBtn.disabled = runLog.length === 0;

    await listFolder();

    showAlert(errored > 0 || permissionLost ? 'error' : 'success',
        `Operazione completata: ${renamed} rinominati, ${errored} errori${skipped ? `, ${skipped} saltati` : ''}.`);
}

async function undoRun(log) {
    if (!log || log.length === 0) {
        showAlert('error', 'Nessuna operazione da annullare in questa sessione.');
        return;
    }
    let ok = 0, fail = 0;
    for (let i = log.length - 1; i >= 0; i--) {
        const entry = log[i];
        try {
            const dirHandle = entry.dirHandle || state.dirHandle;
            await renameOneFile(dirHandle, entry.newName, entry.oldName);
            ok++;
        } catch (err) {
            fail++;
        }
    }
    showAlert(fail ? 'error' : 'success', `Annullamento completato: ${ok} ripristinati, ${fail} errori.`);
    state.rollbackLog = [];
    dom.undoLastBtn.disabled = true;
    await listFolder();
}

// ---------------------------------------------------------------------------
// CSV log download / re-upload for rollback
// ---------------------------------------------------------------------------
function toCsvString(rows, headers) {
    const escape = (v) => {
        const s = String(v ?? '');
        return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const lines = [headers.join(',')];
    for (const row of rows) {
        lines.push(headers.map((h) => escape(row[h])).join(','));
    }
    return lines.join('\r\n');
}

function downloadTextFile(filename, content, mime = 'text/csv;charset=utf-8') {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function downloadRollbackLog() {
    if (state.rollbackLog.length === 0) {
        showAlert('error', 'Nessun log da scaricare in questa sessione.');
        return;
    }
    const csv = toCsvString(
        state.rollbackLog.map((r) => ({ 'nome attuale': r.newName, 'nome nuovo': r.oldName, timestamp: r.timestamp })),
        ['nome attuale', 'nome nuovo', 'timestamp']
    );
    downloadTextFile(`batch-renamer-log_${Date.now()}.csv`, csv);
}

function downloadReport() {
    if (state.lastRunReport.length === 0) {
        showAlert('error', 'Nessun report disponibile.');
        return;
    }
    const csv = toCsvString(state.lastRunReport, ['oldName', 'newName', 'result', 'reason']);
    downloadTextFile(`batch-renamer-report_${Date.now()}.csv`, csv);
}

// Re-upload a previously downloaded log CSV to reverse it in a later
// session, against the same folder re-picked via the directory picker. This
// reuses the CSV-mapping engine (matchRowsToFiles) with the old/new columns
// swapped, instead of duplicating matching logic.
function handleReuploadedLog(file) {
    if (!state.dirHandle) {
        showAlert('error', 'Seleziona prima la cartella su cui applicare il ripristino.');
        return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = window.XLSX.read(data, { type: 'array' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = window.XLSX.utils.sheet_to_json(sheet, { defval: '' });
            // Swapped columns: the log's "nome nuovo" (current on-disk name)
            // is the match key, "nome attuale" (original name) is the target.
            const matches = matchRowsToFiles(rows, sortedFiles(), 'nome nuovo', 'nome attuale');
            let ok = 0, fail = 0, skipped = 0;
            for (const m of matches) {
                if (!m.row || m.matchType === 'none') { skipped++; continue; }
                const target = sanitizeFilename(String(m.toValue));
                try {
                    await renameOneFile(m.file.dirHandle, m.file.name, target.safe);
                    ok++;
                } catch (err) {
                    fail++;
                }
            }
            showAlert(fail ? 'error' : 'success', `Ripristino da log: ${ok} rinominati, ${fail} errori, ${skipped} senza corrispondenza.`);
            await listFolder();
        } catch (err) {
            showAlert('error', 'Errore nella lettura del log: ' + err.message);
        }
    };
    reader.readAsArrayBuffer(file);
}

// ---------------------------------------------------------------------------
// Wiring
// ---------------------------------------------------------------------------
function wireEvents() {
    dom.pickFolderBtn.addEventListener('click', pickFolder);

    dom.recursiveToggle.addEventListener('change', async () => {
        state.recursive = dom.recursiveToggle.checked;
        if (state.dirHandle) await listFolder();
    });
    dom.flattenToggle.addEventListener('change', () => {
        state.flatten = dom.flattenToggle.checked;
    });

    dom.sortKey.addEventListener('change', () => { state.sortKey = dom.sortKey.value; renderFileList(); });
    dom.sortDir.addEventListener('change', () => { state.sortDir = dom.sortDir.value; renderFileList(); });

    dom.csvUploadArea.addEventListener('click', () => dom.csvInput.click());
    dom.csvUploadArea.addEventListener('dragover', (e) => { e.preventDefault(); dom.csvUploadArea.classList.add('dragover'); });
    dom.csvUploadArea.addEventListener('dragleave', () => dom.csvUploadArea.classList.remove('dragover'));
    dom.csvUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        dom.csvUploadArea.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file) handleCsvFile(file);
    });
    dom.csvInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleCsvFile(file);
    });

    for (const r of dom.csvModeRadios()) {
        r.addEventListener('change', () => {
            const mode = getCsvMode();
            dom.csvColsRow.style.display = mode === 'twoColumn' ? 'flex' : 'none';
            dom.csvSingleColRow.style.display = mode === 'singleColumn' ? 'flex' : 'none';
        });
    }

    dom.buildPreviewBtn.addEventListener('click', buildPreview);
    dom.confirmRunBtn.addEventListener('click', executeRun);
    dom.undoLastBtn.addEventListener('click', () => undoRun(state.rollbackLog));
    dom.downloadLogBtn.addEventListener('click', downloadRollbackLog);
    dom.downloadReportBtn.addEventListener('click', downloadReport);

    dom.reuploadLogBtn.addEventListener('click', () => dom.reuploadLogInput.click());
    dom.reuploadLogInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleReuploadedLog(file);
    });
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    initDom();
    refreshIcons();
    const supported = checkSupport();
    if (supported) {
        wireEvents();
    }
});

})();
