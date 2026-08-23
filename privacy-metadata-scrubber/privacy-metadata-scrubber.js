'use strict';

/* ============================================================================================
 * Privacy & Metadata Forensics Studio
 * ------------------------------------------------------------------------------------------
 * All logic lives in this external file (kept out of the HTML) so the page's CSP script-src
 * only has to whitelist 'self' plus the CDN origins -- no inline-script hash needed.
 *
 * Security ground rules followed throughout this file:
 *  - Never use innerHTML or an inline onclick string with data that came from a loaded file.
 *    Every value read from an image/PDF/Office document is written to the DOM with
 *    textContent, and every event handler is wired with addEventListener.
 *  - GPS coordinates are shown as plain decimal text only. This script never fetches a map
 *    tile or any other network resource for you -- the only way to see a map is an explicit
 *    <a target="_blank"> link that you click yourself, which opens in your own browser/maps
 *    app rather than being silently loaded by this page.
 *  - Every filename this script produces (single download or ZIP entry) is sanitized and
 *    de-duplicated before use.
 *  - The standalone HTML privacy report built in this file is a separate downloadable
 *    document, not something injected into this page's own DOM, but every value placed into
 *    it is still HTML-escaped before concatenation, out of the same "never trust file-derived
 *    content" discipline as the rest of the app.
 * ==========================================================================================*/

// ---------------------------------------------------------------------------------------------
// Apply a saved theme choice as early as possible, to minimize a light->dark flash. This script
// tag has no defer/async and sits at the very end of <body>, so this runs synchronously right
// after the DOM has been parsed but generally before the browser's first paint completes. A
// strict CSP with no 'unsafe-inline'/hash for scripts rules out an even-earlier inline <script>
// in <head>, so this is the earliest hook available to an external-file-only script.
// ---------------------------------------------------------------------------------------------

(function applyStoredThemeEarly() {
    try {
        var stored = localStorage.getItem('uf-theme');
        if (stored === 'dark' || stored === 'light') {
            document.documentElement.setAttribute('data-theme', stored);
        }
    } catch (e) {
        // localStorage unavailable (private browsing, disabled storage) -- falls back to the
        // system prefers-color-scheme via the CSS media query, no error surfaced to the user.
    }
})();

// ---------------------------------------------------------------------------------------------
// Constants & limits
// ---------------------------------------------------------------------------------------------

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB per file
const MAX_FILES = 200; // per batch
const MAX_VALUE_DISPLAY_LEN = 400; // truncate very long metadata values in the report tables

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
const OFFICE_EXTENSIONS = ['docx', 'xlsx', 'pptx'];

// Marker strings for the heuristic byte-level PDF scan. Plain substrings, not regex, so no
// escaping concerns and no ReDoS surface.
const PDF_BYTE_MARKERS = ['/JavaScript', '/JS', '/EmbeddedFile', '/OpenAction'];

// EXIF/IPTC/XMP tag names that identify a person, so we can classify found metadata into the
// "author / editor names" category for images.
const IMAGE_IDENTITY_KEYS = [
    'Artist', 'Copyright', 'OwnerName', 'CameraOwnerName', 'creator', 'Creator',
    'By-line', 'CreatorTool', 'rights', 'Rights', 'author', 'Author'
];

// The four scrub categories offered to the user. `appliesTo` is informational (shown in the
// UI); the actual gating logic in scrubImage/scrubPdf/scrubOffice re-checks these ids directly.
const CATEGORIES = [
    {
        id: 'gps',
        label: 'GPS / location',
        desc: 'Images only. Removing this requires re-encoding the image (see below), which strips ALL embedded metadata, not just GPS.',
        appliesTo: 'Images'
    },
    {
        id: 'identity',
        label: 'Author / editor names',
        desc: 'Images: Artist/Owner/Creator EXIF-IPTC-XMP tags. PDF: Author + Creator fields. Office: creator + last-modified-by.',
        appliesTo: 'Images, PDF, Office'
    },
    {
        id: 'pdfFields',
        label: 'PDF metadata fields',
        desc: 'Blanks Title, Subject, Keywords, Producer and the two dates in the PDF Info dictionary.',
        appliesTo: 'PDF'
    },
    {
        id: 'officeTracking',
        label: 'Office comments & tracked changes',
        desc: 'Removes comment parts and resolves tracked changes in .docx (insertions kept, deletions dropped).',
        appliesTo: 'Word (.docx)'
    }
];

const PROFILES_KEY = 'privacyMetadataScrubberProfiles';
const THEME_KEY = 'uf-theme';

const ALERT_ICONS = { success: 'check-circle', error: 'alert-circle', warning: 'alert-triangle', info: 'info' };
const ALERT_DURATIONS = { success: 6000, info: 6000, error: 8000, warning: 8000 };

// ---------------------------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------------------------

let fileEntries = [];
let entryCounter = 0;

// ---------------------------------------------------------------------------------------------
// DOM references (populated on DOMContentLoaded)
// ---------------------------------------------------------------------------------------------

let els = {};

document.addEventListener('DOMContentLoaded', () => {
    els = {
        themeToggle: document.getElementById('themeToggle'),
        uploadArea: document.getElementById('uploadArea'),
        fileInput: document.getElementById('fileInput'),
        categoriesGrid: document.getElementById('categoriesGrid'),
        profileSelect: document.getElementById('profileSelect'),
        profileNameInput: document.getElementById('profileNameInput'),
        saveProfileBtn: document.getElementById('saveProfileBtn'),
        deleteProfileBtn: document.getElementById('deleteProfileBtn'),
        stats: document.getElementById('stats'),
        totalCount: document.getElementById('totalCount'),
        inspectedCount: document.getElementById('inspectedCount'),
        scrubbedCount: document.getElementById('scrubbedCount'),
        errorCount: document.getElementById('errorCount'),
        inspectAllBtn: document.getElementById('inspectAllBtn'),
        downloadZipBtn: document.getElementById('downloadZipBtn'),
        downloadCsvBtn: document.getElementById('downloadCsvBtn'),
        downloadJsonBtn: document.getElementById('downloadJsonBtn'),
        downloadHtmlReportBtn: document.getElementById('downloadHtmlReportBtn'),
        clearAllBtn: document.getElementById('clearAllBtn'),
        progressContainer: document.getElementById('progressContainer'),
        progressFill: document.getElementById('progressFill'),
        progressText: document.getElementById('progressText'),
        alertBox: document.getElementById('alertBox'),
        alertIcon: document.getElementById('alertIcon'),
        alertText: document.getElementById('alertText'),
        fileList: document.getElementById('fileList'),
        queueWrap: document.getElementById('queueWrap'),
        queueTableBody: document.getElementById('queueTableBody'),
        scrubConfirmedBtn: document.getElementById('scrubConfirmedBtn')
    };

    lucide.createIcons();

    initThemeToggle();
    buildCategoryCheckboxes();
    refreshProfileSelect();

    els.uploadArea.addEventListener('click', () => els.fileInput.click());
    els.uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        els.uploadArea.classList.add('dragover');
    });
    els.uploadArea.addEventListener('dragleave', () => {
        els.uploadArea.classList.remove('dragover');
    });
    els.uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        els.uploadArea.classList.remove('dragover');
        if (e.dataTransfer && e.dataTransfer.files) handleIncomingFiles(e.dataTransfer.files);
    });
    els.fileInput.addEventListener('change', (e) => {
        if (e.target.files) handleIncomingFiles(e.target.files);
        e.target.value = ''; // allow re-selecting the same file later
    });

    els.inspectAllBtn.addEventListener('click', () => runInspectAll());
    els.scrubConfirmedBtn.addEventListener('click', () => runScrubAll());
    els.downloadZipBtn.addEventListener('click', () => downloadZipOfScrubbed());
    els.downloadCsvBtn.addEventListener('click', () => downloadReport('csv'));
    els.downloadJsonBtn.addEventListener('click', () => downloadReport('json'));
    els.downloadHtmlReportBtn.addEventListener('click', () => downloadReport('html'));
    els.clearAllBtn.addEventListener('click', () => clearAll());

    els.saveProfileBtn.addEventListener('click', () => saveCurrentProfile());
    els.deleteProfileBtn.addEventListener('click', () => deleteSelectedProfile());
    els.profileSelect.addEventListener('change', () => applySelectedProfile());

    refreshGlobalButtons();
    renderReviewQueue();
});

// ---------------------------------------------------------------------------------------------
// Dark mode toggle
// ---------------------------------------------------------------------------------------------

function currentTheme() {
    const attr = document.documentElement.getAttribute('data-theme');
    if (attr === 'dark' || attr === 'light') return attr;
    // No explicit choice stored yet -- reflect the system preference so the icon starts correct.
    return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try {
        localStorage.setItem(THEME_KEY, theme);
    } catch (e) {
        // Storage unavailable -- the choice just won't persist across reloads this session.
    }
    updateThemeToggleUI();
}

function updateThemeToggleUI() {
    const theme = currentTheme();
    // Rebuild the icon node from scratch rather than mutating the (possibly already
    // lucide-replaced) child, so repeated toggles reliably swap moon <-> sun.
    while (els.themeToggle.firstChild) els.themeToggle.removeChild(els.themeToggle.firstChild);
    const icon = document.createElement('i');
    icon.setAttribute('data-lucide', theme === 'dark' ? 'sun' : 'moon');
    icon.setAttribute('size', '18');
    els.themeToggle.appendChild(icon);
    els.themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    lucide.createIcons();
}

function initThemeToggle() {
    updateThemeToggleUI();
    els.themeToggle.addEventListener('click', () => {
        applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
    });
}

// ---------------------------------------------------------------------------------------------
// Category checkboxes
// ---------------------------------------------------------------------------------------------

function buildCategoryCheckboxes() {
    els.categoriesGrid.textContent = '';
    for (const cat of CATEGORIES) {
        const label = document.createElement('label');
        label.className = 'category-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = 'cat-' + cat.id;
        checkbox.checked = true;
        label.appendChild(checkbox);

        const textWrap = document.createElement('div');
        textWrap.className = 'category-text';

        const strong = document.createElement('strong');
        strong.textContent = cat.label + ' — ' + cat.appliesTo;
        textWrap.appendChild(strong);

        const span = document.createElement('span');
        span.textContent = cat.desc;
        textWrap.appendChild(span);

        label.appendChild(textWrap);
        els.categoriesGrid.appendChild(label);
    }
}

function currentCategories() {
    const state = {};
    for (const cat of CATEGORIES) {
        const el = document.getElementById('cat-' + cat.id);
        state[cat.id] = !!(el && el.checked);
    }
    return state;
}

function applyCategories(settings) {
    for (const cat of CATEGORIES) {
        const el = document.getElementById('cat-' + cat.id);
        if (el) el.checked = !!(settings && settings[cat.id]);
    }
}

// ---------------------------------------------------------------------------------------------
// Profiles (localStorage) -- a purely local convenience, not an account system
// ---------------------------------------------------------------------------------------------

function loadProfiles() {
    try {
        const raw = localStorage.getItem(PROFILES_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        return [];
    }
}

function saveProfiles(profiles) {
    try {
        localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
    } catch (e) {
        // localStorage unavailable (private browsing, disabled storage, some file:// setups) --
        // the app still works, profiles just won't persist across reloads.
        showAlert('error', 'Could not save the profile locally (browser storage is unavailable in this context).');
    }
}

function refreshProfileSelect() {
    const profiles = loadProfiles();
    els.profileSelect.textContent = '';

    const noneOpt = document.createElement('option');
    noneOpt.value = '';
    noneOpt.textContent = '— none (custom selection) —';
    els.profileSelect.appendChild(noneOpt);

    for (const profile of profiles) {
        const opt = document.createElement('option');
        opt.value = profile.name;
        opt.textContent = profile.name;
        els.profileSelect.appendChild(opt);
    }
}

function saveCurrentProfile() {
    const name = (els.profileNameInput.value || '').trim();
    if (!name) {
        showAlert('error', 'Type a name for the profile before saving.');
        return;
    }
    const profiles = loadProfiles();
    const settings = currentCategories();
    const existingIndex = profiles.findIndex((p) => p.name === name);
    if (existingIndex >= 0) {
        profiles[existingIndex] = { name, settings };
    } else {
        profiles.push({ name, settings });
    }
    saveProfiles(profiles);
    refreshProfileSelect();
    els.profileSelect.value = name;
    els.profileNameInput.value = '';
    showAlert('success', `Profile "${name}" saved.`);
}

function deleteSelectedProfile() {
    const name = els.profileSelect.value;
    if (!name) {
        showAlert('error', 'Select a saved profile first.');
        return;
    }
    const profiles = loadProfiles().filter((p) => p.name !== name);
    saveProfiles(profiles);
    refreshProfileSelect();
    showAlert('success', `Profile "${name}" deleted.`);
}

function applySelectedProfile() {
    const name = els.profileSelect.value;
    if (!name) return;
    const profiles = loadProfiles();
    const profile = profiles.find((p) => p.name === name);
    if (profile) applyCategories(profile.settings);
}

// ---------------------------------------------------------------------------------------------
// File intake, validation, classification
// ---------------------------------------------------------------------------------------------

function classifyFile(file) {
    const name = file.name || '';
    const dot = name.lastIndexOf('.');
    const ext = dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
    if (IMAGE_EXTENSIONS.includes(ext)) return { kind: 'image', ext };
    if (ext === 'pdf') return { kind: 'pdf', ext };
    if (OFFICE_EXTENSIONS.includes(ext)) return { kind: 'office', ext };
    return { kind: null, ext };
}

function handleIncomingFiles(fileList) {
    const incoming = Array.from(fileList);
    if (incoming.length === 0) return;

    if (fileEntries.length + incoming.length > MAX_FILES) {
        showAlert('error', `This would total ${fileEntries.length + incoming.length} files, which exceeds the ${MAX_FILES}-file batch limit. Add fewer files at a time.`);
        return;
    }

    const rejected = [];
    const accepted = [];

    for (const file of incoming) {
        if (file.size > MAX_FILE_SIZE_BYTES) {
            rejected.push(`${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB, limit is ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB)`);
            continue;
        }
        const { kind, ext } = classifyFile(file);
        if (!kind) {
            rejected.push(`${file.name} (unsupported type — accepted: JPEG/PNG/WEBP, PDF, DOCX/XLSX/PPTX)`);
            continue;
        }
        accepted.push({ file, kind, ext });
    }

    for (const item of accepted) {
        addFileEntry(item.file, item.kind, item.ext);
    }

    if (accepted.length) {
        showAlert('success', `${accepted.length} file(s) added.`);
    }
    if (rejected.length) {
        const shown = rejected.slice(0, 5).join('; ');
        showAlert('error', `${rejected.length} file(s) rejected: ${shown}${rejected.length > 5 ? ', …' : ''}`);
    }

    refreshGlobalButtons();
}

function addFileEntry(file, kind, ext) {
    entryCounter += 1;
    const entry = {
        id: 'f' + entryCounter,
        file,
        kind,
        ext,
        name: file.name,
        size: file.size,
        status: 'pending', // pending | inspected | scrubbed | skipped | error
        inspected: false,
        inspection: null,
        error: null,
        categoriesFound: [],
        categoriesRemoved: [],
        scrubBlob: null,
        scrubFilename: null,
        beforeSnapshot: null,
        afterSnapshot: null,
        expanded: false
    };
    fileEntries.push(entry);
    buildFileCard(entry);
    els.fileList.style.display = 'block';
    els.stats.style.display = 'block';
    updateStatsAndButtons();
}

// ---------------------------------------------------------------------------------------------
// File card UI
// ---------------------------------------------------------------------------------------------

const KIND_ICON = { image: 'image', pdf: 'file-text', office: 'file-type-2' };
const KIND_LABEL = { image: 'Image', pdf: 'PDF', office: 'Office document' };

function buildFileCard(entry) {
    const card = document.createElement('div');
    card.className = 'file-card';

    const header = document.createElement('div');
    header.className = 'file-card-header';

    const iconWrap = document.createElement('div');
    iconWrap.className = 'file-card-icon';
    const icon = document.createElement('i');
    icon.setAttribute('data-lucide', KIND_ICON[entry.kind] || 'file');
    icon.setAttribute('size', '16');
    icon.style.color = 'var(--uf-accent)';
    iconWrap.appendChild(icon);
    header.appendChild(iconWrap);

    const info = document.createElement('div');
    info.className = 'file-card-info';
    const nameEl = document.createElement('div');
    nameEl.className = 'file-card-name';
    nameEl.textContent = entry.name;
    info.appendChild(nameEl);
    const metaEl = document.createElement('div');
    metaEl.className = 'file-card-meta';
    metaEl.textContent = `${KIND_LABEL[entry.kind] || entry.kind} · ${formatBytes(entry.size)}`;
    info.appendChild(metaEl);
    header.appendChild(info);

    const statusEl = document.createElement('span');
    statusEl.className = 'file-card-status status-pending';
    statusEl.textContent = 'Pending';
    header.appendChild(statusEl);

    header.addEventListener('click', () => {
        entry.expanded = !entry.expanded;
        body.classList.toggle('open', entry.expanded);
    });
    card.appendChild(header);

    const body = document.createElement('div');
    body.className = 'file-card-body';

    const actionsRow = document.createElement('div');
    actionsRow.className = 'file-card-actions';

    const inspectBtn = document.createElement('button');
    inspectBtn.className = 'btn btn-secondary btn-small';
    inspectBtn.type = 'button';
    inspectBtn.appendChild(iconEl('search', 18));
    inspectBtn.appendChild(document.createTextNode(' Inspect'));
    inspectBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        inspectSingle(entry);
    });
    actionsRow.appendChild(inspectBtn);

    const scrubBtn = document.createElement('button');
    scrubBtn.className = 'btn btn-small';
    scrubBtn.type = 'button';
    scrubBtn.appendChild(iconEl('eraser', 18));
    scrubBtn.appendChild(document.createTextNode(' Scrub'));
    scrubBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        scrubSingle(entry);
    });
    actionsRow.appendChild(scrubBtn);

    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'btn btn-secondary btn-small';
    downloadBtn.type = 'button';
    downloadBtn.style.display = 'none';
    downloadBtn.appendChild(iconEl('download', 18));
    downloadBtn.appendChild(document.createTextNode(' Download'));
    downloadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (entry.scrubBlob) downloadBlob(entry.scrubFilename, entry.scrubBlob);
    });
    actionsRow.appendChild(downloadBtn);

    body.appendChild(actionsRow);

    const resultsWrap = document.createElement('div');
    resultsWrap.className = 'results-wrap';
    body.appendChild(resultsWrap);

    const diffWrap = document.createElement('div');
    diffWrap.className = 'diff-wrap';
    body.appendChild(diffWrap);

    card.appendChild(body);
    els.fileList.appendChild(card);

    entry.el = { card, statusEl, body, resultsWrap, diffWrap, inspectBtn, scrubBtn, downloadBtn };
    lucide.createIcons();
}

function iconEl(name, size) {
    const i = document.createElement('i');
    i.setAttribute('data-lucide', name);
    i.setAttribute('size', String(size));
    return i;
}

function setEntryStatus(entry, status, label) {
    entry.status = status;
    const cls = {
        pending: 'status-pending',
        inspected: 'status-inspected',
        scrubbed: 'status-scrubbed',
        skipped: 'status-pending',
        error: 'status-error'
    }[status] || 'status-pending';
    entry.el.statusEl.className = 'file-card-status ' + cls;
    entry.el.statusEl.textContent = label;
}

// ---------------------------------------------------------------------------------------------
// Generic rendering helpers
// ---------------------------------------------------------------------------------------------

function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function formatTagValue(value) {
    if (value === null || value === undefined) return '';
    if (value instanceof Date) return isNaN(value.getTime()) ? '' : value.toISOString();
    if (value instanceof Uint8Array) return `[binary data, ${value.byteLength} bytes]`;
    if (value instanceof ArrayBuffer) return `[binary data, ${value.byteLength} bytes]`;
    if (Array.isArray(value)) return value.map(formatTagValue).join(', ');
    let out;
    if (typeof value === 'object') {
        try {
            out = JSON.stringify(value);
        } catch (e) {
            out = '[object]';
        }
    } else {
        out = String(value);
    }
    if (out.length > MAX_VALUE_DISPLAY_LEN) {
        out = out.slice(0, MAX_VALUE_DISPLAY_LEN) + '… (truncated)';
    }
    return out;
}

function renderKeyValueTable(container, entries, emptyMessage) {
    const rows = entries.filter((e) => e[1] !== undefined);
    if (rows.length === 0) {
        const p = document.createElement('div');
        p.className = 'empty-note';
        p.textContent = emptyMessage;
        container.appendChild(p);
        return;
    }
    const wrap = document.createElement('div');
    wrap.className = 'table-scroll';
    const table = document.createElement('table');
    table.className = 'meta-table';
    const tbody = document.createElement('tbody');
    for (const [key, rawValue] of rows) {
        const tr = document.createElement('tr');
        const th = document.createElement('th');
        th.textContent = key;
        tr.appendChild(th);
        const td = document.createElement('td');
        const formatted = formatTagValue(rawValue);
        td.textContent = formatted === '' ? '(empty)' : formatted;
        tr.appendChild(td);
        tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    wrap.appendChild(table);
    container.appendChild(wrap);
}

function badgeRow(container, categories) {
    if (categories.length === 0) return;
    const row = document.createElement('div');
    row.style.marginBottom = '10px';
    for (const catId of categories) {
        const cat = CATEGORIES.find((c) => c.id === catId);
        const badge = document.createElement('span');
        badge.className = 'badge';
        badge.textContent = cat ? cat.label : catId;
        row.appendChild(badge);
    }
    container.appendChild(row);
}

function categoryLabel(catId) {
    const cat = CATEGORIES.find((c) => c.id === catId);
    return cat ? cat.label : catId;
}

// ---------------------------------------------------------------------------------------------
// Byte-level helpers (shared by PDF inspection and general use)
// ---------------------------------------------------------------------------------------------

function bytesToLatin1String(bytes) {
    let result = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        result += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
    }
    return result;
}

function countOccurrences(haystack, needle) {
    if (!needle) return 0;
    let count = 0;
    let pos = 0;
    while (true) {
        const idx = haystack.indexOf(needle, pos);
        if (idx === -1) break;
        count += 1;
        pos = idx + needle.length;
    }
    return count;
}

// ---------------------------------------------------------------------------------------------
// INSPECT: images (exifr)
// ---------------------------------------------------------------------------------------------

async function inspectImage(entry) {
    const buf = await entry.file.arrayBuffer();

    const options = {
        tiff: true, exif: true, gps: true, iptc: true, xmp: true,
        icc: false, jfif: false, interop: false,
        translateValues: true, reviveValues: true,
        mergeOutput: true, sanitize: true
    };

    let tags = {};
    try {
        const parsed = await exifr.parse(buf.slice(0), options);
        if (parsed) tags = parsed;
    } catch (e) {
        // Not fatal -- many images simply carry no metadata segment exifr understands.
    }

    let gps = null;
    try {
        gps = await exifr.gps(buf.slice(0));
    } catch (e) {
        gps = null;
    }

    const hasGps = !!(gps && typeof gps.latitude === 'number' && typeof gps.longitude === 'number');
    const hasIdentity = IMAGE_IDENTITY_KEYS.some((k) => tags[k] !== undefined && String(tags[k]).trim() !== '');
    const otherKeysCount = Object.keys(tags).filter((k) => !IMAGE_IDENTITY_KEYS.includes(k)).length;

    const found = [];
    if (hasGps) found.push('gps');
    if (hasIdentity) found.push('identity');

    return {
        tags,
        gps: hasGps ? gps : null,
        found,
        hasOtherMetadata: otherKeysCount > 0
    };
}

function renderImageInspection(entry) {
    const c = entry.el.resultsWrap;
    c.textContent = '';
    const insp = entry.inspection;

    badgeRow(c, insp.found);

    if (insp.gps) {
        const label = document.createElement('div');
        label.className = 'section-label';
        label.textContent = 'GPS location';
        c.appendChild(label);

        const p = document.createElement('div');
        p.style.fontSize = '13px';
        p.style.marginBottom = '6px';
        p.textContent = `Latitude ${insp.gps.latitude}, Longitude ${insp.gps.longitude}` +
            (typeof insp.gps.altitude === 'number' ? `, Altitude ${insp.gps.altitude}m` : '');
        c.appendChild(p);

        const note = document.createElement('div');
        note.style.fontSize = '12px';
        note.style.color = 'var(--uf-text-muted)';
        note.style.marginBottom = '4px';
        note.textContent = 'This page never loads a map tile or sends these coordinates anywhere. Opening the link below is optional and happens only if you click it, in your own browser.';
        c.appendChild(note);

        const link = document.createElement('a');
        link.className = 'gps-link';
        link.href = `https://www.openstreetmap.org/?mlat=${encodeURIComponent(insp.gps.latitude)}&mlon=${encodeURIComponent(insp.gps.longitude)}#map=16/${encodeURIComponent(insp.gps.latitude)}/${encodeURIComponent(insp.gps.longitude)}`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = 'Open this location in OpenStreetMap ↗ (opt-in, opens a new tab)';
        c.appendChild(link);
    }

    const label2 = document.createElement('div');
    label2.className = 'section-label';
    label2.textContent = 'All EXIF / IPTC / XMP tags found';
    c.appendChild(label2);

    renderKeyValueTable(c, Object.entries(insp.tags), 'No embedded EXIF/IPTC/XMP metadata tags were found in this image.');
}

// ---------------------------------------------------------------------------------------------
// SCRUB: images (canvas re-encode)
// ---------------------------------------------------------------------------------------------

function mimeForImage(file, ext) {
    if (file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp') return file.type;
    if (ext === 'png') return 'image/png';
    if (ext === 'webp') return 'image/webp';
    return 'image/jpeg';
}

function loadImageElement(file) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            resolve({ source: img, width: img.naturalWidth, height: img.naturalHeight, cleanup: () => URL.revokeObjectURL(url) });
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Could not decode image'));
        };
        img.src = url;
    });
}

async function loadDrawableImage(file) {
    if (window.createImageBitmap) {
        try {
            const bmp = await createImageBitmap(file);
            return { source: bmp, width: bmp.width, height: bmp.height, cleanup: () => { if (bmp.close) bmp.close(); } };
        } catch (e) {
            // Fall through to the <img> fallback below (older Safari / some WEBP cases).
        }
    }
    return loadImageElement(file);
}

async function scrubImage(entry) {
    const { source, width, height, cleanup } = await loadDrawableImage(entry.file);
    try {
        if (!width || !height) throw new Error('Image has zero dimensions');
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas 2D context unavailable');
        ctx.drawImage(source, 0, 0, width, height);

        const mime = mimeForImage(entry.file, entry.ext);
        const quality = mime === 'image/jpeg' ? 0.92 : (mime === 'image/webp' ? 1.0 : undefined);

        const blob = await new Promise((resolve, reject) => {
            canvas.toBlob((b) => {
                if (b) resolve(b); else reject(new Error('Image export failed'));
            }, mime, quality);
        });
        return blob;
    } finally {
        cleanup();
    }
}

// ---------------------------------------------------------------------------------------------
// INSPECT: PDF (pdf-lib + raw byte heuristic scan)
// ---------------------------------------------------------------------------------------------

async function inspectPdf(entry) {
    const buf = await entry.file.arrayBuffer();

    let info;
    try {
        const pdfDoc = await PDFLib.PDFDocument.load(buf, { updateMetadata: false, ignoreEncryption: true });
        let keywords = '';
        try {
            const kw = pdfDoc.getKeywords();
            keywords = Array.isArray(kw) ? kw.join(', ') : (kw || '');
        } catch (e) { /* ignore */ }
        const creationDate = safeDate(() => pdfDoc.getCreationDate());
        const modDate = safeDate(() => pdfDoc.getModificationDate());
        info = {
            Title: pdfDoc.getTitle() || '',
            Author: pdfDoc.getAuthor() || '',
            Subject: pdfDoc.getSubject() || '',
            Keywords: keywords,
            Producer: pdfDoc.getProducer() || '',
            Creator: pdfDoc.getCreator() || '',
            CreationDate: creationDate,
            ModificationDate: modDate,
            PageCount: pdfDoc.getPageCount()
        };
    } catch (e) {
        throw new Error('Could not parse this PDF (it may be encrypted or malformed): ' + e.message);
    }

    const bytes = new Uint8Array(buf);
    const text = bytesToLatin1String(bytes);
    const byteScan = {};
    for (const marker of PDF_BYTE_MARKERS) {
        byteScan[marker] = countOccurrences(text, marker);
    }

    const found = [];
    if ((info.Author || '').trim() || (info.Creator || '').trim()) found.push('identity');
    if ((info.Title || '').trim() || (info.Subject || '').trim() || (info.Keywords || '').trim() || (info.Producer || '').trim() || info.CreationDate || info.ModificationDate) {
        found.push('pdfFields');
    }

    return { info, byteScan, found };
}

function safeDate(getter) {
    try {
        const d = getter();
        return d instanceof Date && !isNaN(d.getTime()) ? d.toISOString() : '';
    } catch (e) {
        return '';
    }
}

function renderPdfInspection(entry) {
    const c = entry.el.resultsWrap;
    c.textContent = '';
    const insp = entry.inspection;

    badgeRow(c, insp.found);

    const label = document.createElement('div');
    label.className = 'section-label';
    label.textContent = 'Document Info dictionary';
    c.appendChild(label);
    renderKeyValueTable(c, Object.entries(insp.info), 'No Info dictionary fields were found.');

    const label2 = document.createElement('div');
    label2.className = 'section-label';
    label2.textContent = 'Raw byte-level scan';
    c.appendChild(label2);

    const note = document.createElement('div');
    note.className = 'heuristic-note';
    note.textContent = 'Heuristic scan only: this counts literal marker strings found anywhere in the raw PDF bytes. It is not a guarantee that active JavaScript, embedded files or an OpenAction are actually present or absent — some matches can be false positives (e.g. text that merely contains the string), and this scan cannot see anything hidden inside compressed object streams.';
    c.appendChild(note);

    renderKeyValueTable(c, Object.entries(insp.byteScan), 'No markers found.');
}

// ---------------------------------------------------------------------------------------------
// SCRUB: PDF (pdf-lib)
// ---------------------------------------------------------------------------------------------

async function scrubPdf(entry, categories) {
    const buf = await entry.file.arrayBuffer();
    const pdfDoc = await PDFLib.PDFDocument.load(buf, { updateMetadata: false, ignoreEncryption: true });
    const removed = [];

    if (categories.identity) {
        pdfDoc.setAuthor('');
        pdfDoc.setCreator('');
        removed.push('identity');
    }

    if (categories.pdfFields) {
        pdfDoc.setTitle('');
        pdfDoc.setSubject('');
        try { pdfDoc.setKeywords([]); } catch (e) { /* some pdf-lib versions require a non-empty array; ignore if so */ }
        pdfDoc.setProducer('');
        // pdf-lib has no API to delete the CreationDate/ModificationDate keys outright, so we
        // overwrite them with a fixed placeholder (Unix epoch) rather than leaving your real
        // dates in place. This is documented in the README -- it is an overwrite, not a removal.
        const epoch = new Date(0);
        pdfDoc.setCreationDate(epoch);
        pdfDoc.setModificationDate(epoch);
        removed.push('pdfFields');
    }

    const bytes = await pdfDoc.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    return { blob, removed };
}

// ---------------------------------------------------------------------------------------------
// INSPECT: Office Open XML (.docx/.xlsx/.pptx via JSZip + DOMParser)
// ---------------------------------------------------------------------------------------------

async function readZipEntryText(zip, path) {
    const file = zip.file(path);
    if (!file) return null;
    return file.async('string');
}

function parseXmlOrThrow(xmlString, label) {
    const doc = new DOMParser().parseFromString(xmlString, 'application/xml');
    if (doc.getElementsByTagName('parsererror').length > 0) {
        throw new Error(`Could not parse ${label}`);
    }
    return doc;
}

function firstTagText(doc, tagName) {
    const els2 = doc.getElementsByTagName(tagName);
    return els2.length > 0 ? (els2[0].textContent || '') : '';
}

async function inspectOffice(entry) {
    const buf = await entry.file.arrayBuffer();
    const zip = await JSZip.loadAsync(buf);

    let coreProps = {};
    const coreXml = await readZipEntryText(zip, 'docProps/core.xml');
    if (coreXml) {
        const doc = parseXmlOrThrow(coreXml, 'docProps/core.xml');
        coreProps = {
            creator: firstTagText(doc, 'dc:creator'),
            lastModifiedBy: firstTagText(doc, 'cp:lastModifiedBy'),
            title: firstTagText(doc, 'dc:title'),
            subject: firstTagText(doc, 'dc:subject'),
            description: firstTagText(doc, 'dc:description'),
            keywords: firstTagText(doc, 'cp:keywords'),
            created: firstTagText(doc, 'dcterms:created'),
            modified: firstTagText(doc, 'dcterms:modified')
        };
    }

    let appProps = {};
    const appXml = await readZipEntryText(zip, 'docProps/app.xml');
    if (appXml) {
        const doc = parseXmlOrThrow(appXml, 'docProps/app.xml');
        appProps = {
            application: firstTagText(doc, 'Application'),
            company: firstTagText(doc, 'Company'),
            appVersion: firstTagText(doc, 'AppVersion')
        };
    }

    let hasComments = false;
    let insCount = 0;
    let delCount = 0;
    if (entry.ext === 'docx') {
        hasComments = Object.keys(zip.files).some((name) => /^word\/comments/i.test(name));
        const docXml = await readZipEntryText(zip, 'word/document.xml');
        if (docXml) {
            insCount = countOccurrences(docXml, '<w:ins ') + countOccurrences(docXml, '<w:ins>');
            delCount = countOccurrences(docXml, '<w:del ') + countOccurrences(docXml, '<w:del>');
        }
    }

    const found = [];
    if ((coreProps.creator || '').trim() || (coreProps.lastModifiedBy || '').trim()) found.push('identity');
    if (hasComments || insCount > 0 || delCount > 0) found.push('officeTracking');

    return { coreProps, appProps, hasComments, insCount, delCount, found };
}

function renderOfficeInspection(entry) {
    const c = entry.el.resultsWrap;
    c.textContent = '';
    const insp = entry.inspection;

    badgeRow(c, insp.found);

    const label = document.createElement('div');
    label.className = 'section-label';
    label.textContent = 'docProps/core.xml (personal / editing metadata)';
    c.appendChild(label);
    renderKeyValueTable(c, Object.entries(insp.coreProps), 'docProps/core.xml was not found in this file.');

    const label2 = document.createElement('div');
    label2.className = 'section-label';
    label2.textContent = 'docProps/app.xml (application metadata)';
    c.appendChild(label2);
    renderKeyValueTable(c, Object.entries(insp.appProps), 'docProps/app.xml was not found in this file.');

    if (entry.ext === 'docx') {
        const label3 = document.createElement('div');
        label3.className = 'section-label';
        label3.textContent = 'Comments & tracked changes';
        c.appendChild(label3);
        renderKeyValueTable(c, [
            ['Comment parts present', insp.hasComments ? 'yes' : 'no'],
            ['Tracked insertions (<w:ins>)', insp.insCount],
            ['Tracked deletions (<w:del>)', insp.delCount]
        ], '');
    }
}

// ---------------------------------------------------------------------------------------------
// SCRUB: Office Open XML (JSZip rebuild)
// ---------------------------------------------------------------------------------------------

function blankTagsInXmlDoc(doc, tagNames) {
    let changed = false;
    for (const tag of tagNames) {
        const nodes = doc.getElementsByTagName(tag);
        for (let i = 0; i < nodes.length; i++) {
            if (nodes[i].textContent !== '') {
                nodes[i].textContent = '';
                changed = true;
            }
        }
    }
    return changed;
}

function removeAllByTag(doc, tag) {
    const nodes = Array.prototype.slice.call(doc.getElementsByTagName(tag));
    for (const node of nodes) {
        if (node.parentNode) node.parentNode.removeChild(node);
    }
    return nodes.length > 0;
}

function unwrapAllByTag(doc, tag) {
    const nodes = Array.prototype.slice.call(doc.getElementsByTagName(tag));
    for (const node of nodes) {
        const parent = node.parentNode;
        if (!parent) continue;
        while (node.firstChild) {
            parent.insertBefore(node.firstChild, node);
        }
        parent.removeChild(node);
    }
    return nodes.length > 0;
}

async function stripCommentsReferences(zip) {
    const ctXml = await readZipEntryText(zip, '[Content_Types].xml');
    if (ctXml) {
        const doc = parseXmlOrThrow(ctXml, '[Content_Types].xml');
        const overrides = Array.prototype.slice.call(doc.getElementsByTagName('Override'));
        for (const ov of overrides) {
            const partName = (ov.getAttribute('PartName') || '').toLowerCase();
            if (partName.includes('comments')) ov.parentNode.removeChild(ov);
        }
        zip.file('[Content_Types].xml', new XMLSerializer().serializeToString(doc));
    }

    const relsXml = await readZipEntryText(zip, 'word/_rels/document.xml.rels');
    if (relsXml) {
        const doc = parseXmlOrThrow(relsXml, 'word/_rels/document.xml.rels');
        const rels = Array.prototype.slice.call(doc.getElementsByTagName('Relationship'));
        for (const rel of rels) {
            const target = (rel.getAttribute('Target') || '').toLowerCase();
            if (target.includes('comments')) rel.parentNode.removeChild(rel);
        }
        zip.file('word/_rels/document.xml.rels', new XMLSerializer().serializeToString(doc));
    }
}

async function scrubOffice(entry, categories) {
    const buf = await entry.file.arrayBuffer();
    const zip = await JSZip.loadAsync(buf);
    const removed = [];

    if (categories.identity) {
        const coreXml = await readZipEntryText(zip, 'docProps/core.xml');
        if (coreXml) {
            const doc = parseXmlOrThrow(coreXml, 'docProps/core.xml');
            const changed = blankTagsInXmlDoc(doc, ['dc:creator', 'cp:lastModifiedBy']);
            if (changed) {
                zip.file('docProps/core.xml', new XMLSerializer().serializeToString(doc));
                removed.push('identity');
            }
        }
    }

    if (categories.officeTracking && entry.ext === 'docx') {
        let touched = false;

        const commentParts = Object.keys(zip.files).filter((name) => /^word\/comments/i.test(name));
        if (commentParts.length > 0) {
            for (const part of commentParts) zip.remove(part);
            await stripCommentsReferences(zip);
            touched = true;
        }

        const docXml = await readZipEntryText(zip, 'word/document.xml');
        if (docXml) {
            const doc = parseXmlOrThrow(docXml, 'word/document.xml');
            // "Accept all changes" semantics: drop deleted content entirely, keep inserted
            // content but unwrap its <w:ins> wrapper so the document reads as final text.
            const removedDel = removeAllByTag(doc, 'w:del');
            const unwrappedIns = unwrapAllByTag(doc, 'w:ins');
            if (removedDel || unwrappedIns) {
                zip.file('word/document.xml', new XMLSerializer().serializeToString(doc));
                touched = true;
            }
        }

        if (touched) removed.push('officeTracking');
    }

    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 9 } });
    return { blob, removed };
}

// ---------------------------------------------------------------------------------------------
// Dispatchers
// ---------------------------------------------------------------------------------------------

async function inspectFile(entry) {
    if (entry.kind === 'image') {
        entry.inspection = await inspectImage(entry);
    } else if (entry.kind === 'pdf') {
        entry.inspection = await inspectPdf(entry);
    } else if (entry.kind === 'office') {
        entry.inspection = await inspectOffice(entry);
    } else {
        throw new Error('Unknown file kind');
    }
    entry.categoriesFound = entry.inspection.found.slice();
    entry.inspected = true;
}

async function inspectBlobAsPseudoEntry(blob, kind, ext) {
    const pseudo = { file: blob, kind, ext };
    if (kind === 'image') return inspectImage(pseudo);
    if (kind === 'pdf') return inspectPdf(pseudo);
    if (kind === 'office') return inspectOffice(pseudo);
    throw new Error('Unknown file kind');
}

function renderInspection(entry) {
    if (entry.kind === 'image') renderImageInspection(entry);
    else if (entry.kind === 'pdf') renderPdfInspection(entry);
    else if (entry.kind === 'office') renderOfficeInspection(entry);
}

async function scrubFile(entry, categories) {
    if (entry.kind === 'image') {
        const applicable = categories.gps || categories.identity;
        if (!applicable) return { skipped: true };
        const blob = await scrubImage(entry);
        const removed = [];
        if (categories.gps) removed.push('gps');
        if (categories.identity) removed.push('identity');
        return { blob, removed };
    }
    if (entry.kind === 'pdf') {
        if (!categories.identity && !categories.pdfFields) return { skipped: true };
        return scrubPdf(entry, categories);
    }
    if (entry.kind === 'office') {
        if (!categories.identity && !categories.officeTracking) return { skipped: true };
        return scrubOffice(entry, categories);
    }
    throw new Error('Unknown file kind');
}

// ---------------------------------------------------------------------------------------------
// Before / after snapshots (feature: diff view)
// ---------------------------------------------------------------------------------------------
// A "snapshot" is an ordered array of [label, displayValue] pairs, using the SAME labels in the
// same order for a given file kind so a before/after pair can be compared position-by-position.
// These are deliberately compact summaries (not the full raw tag dump shown in Inspect), so the
// diff view stays readable even for images that can carry dozens of EXIF tags.

function snapshotImage(inspection) {
    const gpsText = inspection.gps ? `${inspection.gps.latitude}, ${inspection.gps.longitude}` : '(none found)';
    const identityKeysPresent = Object.keys(inspection.tags).filter(
        (k) => IMAGE_IDENTITY_KEYS.includes(k) && String(inspection.tags[k]).trim() !== ''
    );
    const otherCount = Object.keys(inspection.tags).filter((k) => !IMAGE_IDENTITY_KEYS.includes(k)).length;
    return [
        ['GPS coordinates', gpsText],
        ['Identity tags (Artist/Copyright/…)', identityKeysPresent.length ? identityKeysPresent.join(', ') : '(none found)'],
        ['Other EXIF/IPTC/XMP tags found', String(otherCount)]
    ];
}

function snapshotPdf(inspection) {
    const info = inspection.info;
    return [
        ['Title', info.Title || '(empty)'],
        ['Author', info.Author || '(empty)'],
        ['Subject', info.Subject || '(empty)'],
        ['Keywords', info.Keywords || '(empty)'],
        ['Producer', info.Producer || '(empty)'],
        ['Creator', info.Creator || '(empty)'],
        ['CreationDate', info.CreationDate || '(empty)'],
        ['ModificationDate', info.ModificationDate || '(empty)']
    ];
}

function snapshotOffice(inspection) {
    return [
        ['Creator', inspection.coreProps.creator || '(empty)'],
        ['Last modified by', inspection.coreProps.lastModifiedBy || '(empty)'],
        ['Comment parts present', inspection.hasComments ? 'yes' : 'no'],
        ['Tracked insertions', String(inspection.insCount)],
        ['Tracked deletions', String(inspection.delCount)]
    ];
}

function snapshotFor(kind, inspection) {
    if (kind === 'image') return snapshotImage(inspection);
    if (kind === 'pdf') return snapshotPdf(inspection);
    if (kind === 'office') return snapshotOffice(inspection);
    return [];
}

function renderDiff(entry) {
    const c = entry.el.diffWrap;
    c.textContent = '';
    if (!entry.beforeSnapshot || !entry.afterSnapshot) return;

    const label = document.createElement('div');
    label.className = 'section-label';
    label.textContent = 'Before / after this scrub';
    c.appendChild(label);

    const changedRows = [];
    for (let i = 0; i < entry.beforeSnapshot.length; i++) {
        const [fieldLabel, beforeVal] = entry.beforeSnapshot[i];
        const afterVal = entry.afterSnapshot[i] ? entry.afterSnapshot[i][1] : beforeVal;
        if (beforeVal !== afterVal) changedRows.push([fieldLabel, beforeVal, afterVal]);
    }

    if (changedRows.length === 0) {
        const p = document.createElement('div');
        p.className = 'empty-note';
        p.textContent = 'No change in these fields — nothing in the selected categories was present in this file, or the scrub was skipped for it.';
        c.appendChild(p);
        return;
    }

    const wrap = document.createElement('div');
    wrap.className = 'table-scroll';
    const table = document.createElement('table');
    table.className = 'meta-table';
    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    for (const h of ['Field', 'Before', 'After']) {
        const th = document.createElement('th');
        th.textContent = h;
        headRow.appendChild(th);
    }
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    for (const [fieldLabel, beforeVal, afterVal] of changedRows) {
        const tr = document.createElement('tr');
        const tdField = document.createElement('td');
        tdField.textContent = fieldLabel;
        tr.appendChild(tdField);
        const tdBefore = document.createElement('td');
        tdBefore.className = 'diff-before';
        tdBefore.textContent = beforeVal;
        tr.appendChild(tdBefore);
        const tdAfter = document.createElement('td');
        tdAfter.className = 'diff-after';
        tdAfter.textContent = afterVal;
        tr.appendChild(tdAfter);
        tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    wrap.appendChild(table);
    c.appendChild(wrap);
}

// ---------------------------------------------------------------------------------------------
// Per-file actions
// ---------------------------------------------------------------------------------------------

async function inspectSingle(entry) {
    try {
        await inspectFile(entry);
        setEntryStatus(entry, 'inspected', 'Inspected');
        entry.expanded = true;
        entry.el.body.classList.add('open');
        renderInspection(entry);
        lucide.createIcons();
    } catch (e) {
        entry.error = e.message;
        setEntryStatus(entry, 'error', 'Error');
        entry.el.resultsWrap.textContent = '';
        const p = document.createElement('div');
        p.className = 'empty-note';
        p.style.color = 'var(--uf-error-text)';
        p.textContent = 'Error: ' + e.message;
        entry.el.resultsWrap.appendChild(p);
        entry.expanded = true;
        entry.el.body.classList.add('open');
    }
    updateStatsAndButtons();
}

async function scrubSingle(entry) {
    try {
        if (!entry.inspected) await inspectFile(entry);
        const beforeSnapshot = snapshotFor(entry.kind, entry.inspection);
        const categories = currentCategories();
        const result = await scrubFile(entry, categories);
        if (result.skipped) {
            setEntryStatus(entry, 'skipped', 'Skipped (no matching category)');
            entry.el.diffWrap.textContent = '';
        } else {
            entry.scrubBlob = result.blob;
            entry.categoriesRemoved = result.removed;
            entry.scrubFilename = buildScrubFilename(entry);
            entry.beforeSnapshot = beforeSnapshot;
            try {
                const afterInspection = await inspectBlobAsPseudoEntry(result.blob, entry.kind, entry.ext);
                entry.afterSnapshot = snapshotFor(entry.kind, afterInspection);
            } catch (e) {
                entry.afterSnapshot = null; // re-inspection of our own output failed; diff just won't render
            }
            setEntryStatus(entry, 'scrubbed', 'Scrubbed');
            entry.el.downloadBtn.style.display = 'inline-flex';
            renderDiff(entry);
        }
        renderInspection(entry);
        entry.expanded = true;
        entry.el.body.classList.add('open');
        lucide.createIcons();
    } catch (e) {
        entry.error = e.message;
        setEntryStatus(entry, 'error', 'Error');
    }
    updateStatsAndButtons();
}

// ---------------------------------------------------------------------------------------------
// Filenames
// ---------------------------------------------------------------------------------------------

function sanitizeFilename(name) {
    let safe = String(name).replace(/[\/\\:*?"<>|\x00-\x1F]/g, '_').trim();
    if (safe === '') safe = 'file';
    return safe.slice(0, 150);
}

function buildScrubFilename(entry) {
    return sanitizeFilename('scrubbed_' + entry.name);
}

function makeFilenameDeduper() {
    const used = new Map();
    return function unique(base) {
        const count = used.get(base) || 0;
        used.set(base, count + 1);
        if (count === 0) return base;
        const dot = base.lastIndexOf('.');
        return dot > 0 ? `${base.slice(0, dot)}_${count + 1}${base.slice(dot)}` : `${base}_${count + 1}`;
    };
}

// ---------------------------------------------------------------------------------------------
// Review queue (feature: review-then-confirm batch flow)
// ---------------------------------------------------------------------------------------------

function renderReviewQueue() {
    if (!els.queueWrap) return;
    els.queueTableBody.textContent = '';

    if (fileEntries.length === 0) {
        els.queueWrap.style.display = 'none';
        els.scrubConfirmedBtn.disabled = true;
        return;
    }
    els.queueWrap.style.display = 'block';
    els.scrubConfirmedBtn.disabled = false;

    for (const entry of fileEntries) {
        const tr = document.createElement('tr');

        const tdName = document.createElement('td');
        tdName.textContent = entry.name;
        tr.appendChild(tdName);

        const tdType = document.createElement('td');
        tdType.textContent = KIND_LABEL[entry.kind] || entry.kind;
        tr.appendChild(tdType);

        const tdSize = document.createElement('td');
        tdSize.textContent = formatBytes(entry.size);
        tr.appendChild(tdSize);

        const tdFound = document.createElement('td');
        if (!entry.inspected) {
            tdFound.className = 'queue-empty-cell';
            tdFound.textContent = 'not inspected yet';
        } else if (entry.categoriesFound.length === 0) {
            tdFound.className = 'queue-empty-cell';
            tdFound.textContent = 'none found';
        } else {
            tdFound.textContent = entry.categoriesFound.map(categoryLabel).join(', ');
        }
        tr.appendChild(tdFound);

        const tdRemoved = document.createElement('td');
        if (entry.categoriesRemoved.length === 0) {
            tdRemoved.className = 'queue-empty-cell';
            tdRemoved.textContent = '—';
        } else {
            tdRemoved.textContent = entry.categoriesRemoved.map(categoryLabel).join(', ');
        }
        tr.appendChild(tdRemoved);

        const tdStatus = document.createElement('td');
        const pill = document.createElement('span');
        pill.className = 'file-card-status ' + ({
            pending: 'status-pending', inspected: 'status-inspected', scrubbed: 'status-scrubbed',
            skipped: 'status-pending', error: 'status-error'
        }[entry.status] || 'status-pending');
        pill.textContent = entry.status;
        tdStatus.appendChild(pill);
        tr.appendChild(tdStatus);

        els.queueTableBody.appendChild(tr);
    }
}

// ---------------------------------------------------------------------------------------------
// Batch operations
// ---------------------------------------------------------------------------------------------

function showProgress(current, total) {
    els.progressContainer.style.display = 'block';
    const pct = total > 0 ? (current / total) * 100 : 0;
    els.progressFill.style.width = pct + '%';
    els.progressText.textContent = `${current} / ${total}`;
}

function hideProgress() {
    els.progressContainer.style.display = 'none';
}

async function runInspectAll() {
    if (fileEntries.length === 0) return;
    setBatchButtonsDisabled(true);
    let i = 0;
    for (const entry of fileEntries) {
        await inspectSingle(entry);
        i += 1;
        showProgress(i, fileEntries.length);
        if (i % 5 === 0) await new Promise((r) => setTimeout(r, 0));
    }
    hideProgress();
    setBatchButtonsDisabled(false);
    showAlert('success', `Inspected ${fileEntries.length} file(s).`);
    updateStatsAndButtons();
}

async function runScrubAll() {
    if (fileEntries.length === 0) return;
    const categories = currentCategories();
    if (!categories.gps && !categories.identity && !categories.pdfFields && !categories.officeTracking) {
        showAlert('error', 'Select at least one category to remove before scrubbing.');
        return;
    }
    setBatchButtonsDisabled(true);
    let i = 0;
    for (const entry of fileEntries) {
        await scrubSingle(entry);
        i += 1;
        showProgress(i, fileEntries.length);
        if (i % 5 === 0) await new Promise((r) => setTimeout(r, 0));
    }
    hideProgress();
    setBatchButtonsDisabled(false);
    const scrubbedCount = fileEntries.filter((e) => e.status === 'scrubbed').length;
    showAlert('success', `Scrub complete. ${scrubbedCount} of ${fileEntries.length} file(s) produced a new scrubbed copy (others were skipped or errored — see the review queue for details).`);
    updateStatsAndButtons();
}

function setBatchButtonsDisabled(disabled) {
    els.inspectAllBtn.disabled = disabled;
    els.scrubConfirmedBtn.disabled = disabled || fileEntries.length === 0;
    els.clearAllBtn.disabled = disabled;
}

// ---------------------------------------------------------------------------------------------
// Downloads: single file, ZIP of scrubbed files, CSV/JSON/HTML report
// ---------------------------------------------------------------------------------------------

function downloadBlob(filename, blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

async function downloadZipOfScrubbed() {
    const scrubbed = fileEntries.filter((e) => e.status === 'scrubbed' && e.scrubBlob);
    if (scrubbed.length === 0) {
        showAlert('error', 'No scrubbed files yet — run Scrub first.');
        return;
    }
    try {
        const zip = new JSZip();
        const dedupe = makeFilenameDeduper();
        for (const entry of scrubbed) {
            const name = dedupe(sanitizeFilename(entry.scrubFilename));
            zip.file(name, entry.scrubBlob);
        }
        const rows = buildSummaryRows();
        zip.file('scrub_report.csv', toCsv(rows));
        zip.file('scrub_report.json', toJson(rows));
        zip.file('scrub_report.html', buildHtmlReportString(rows));

        const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 9 } });
        downloadBlob(`privacy_metadata_scrubbed_${Date.now()}.zip`, blob);
        showAlert('success', `ZIP created with ${scrubbed.length} scrubbed file(s) plus the summary report.`);
    } catch (e) {
        showAlert('error', 'Could not create the ZIP: ' + e.message);
    }
}

function buildSummaryRows() {
    return fileEntries.map((entry) => ({
        filename: entry.name,
        type: KIND_LABEL[entry.kind] || entry.kind,
        categoriesFound: entry.categoriesFound.map(categoryLabel).join('; '),
        categoriesRemoved: entry.categoriesRemoved.map(categoryLabel).join('; '),
        status: entry.status,
        error: entry.error || ''
    }));
}

function csvEscape(value) {
    const s = String(value === undefined || value === null ? '' : value);
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
}

function toCsv(rows) {
    const header = ['filename', 'type', 'categoriesFound', 'categoriesRemoved', 'status', 'error'];
    const lines = [header.join(',')];
    for (const row of rows) {
        lines.push(header.map((h) => csvEscape(row[h])).join(','));
    }
    return lines.join('\r\n');
}

function toJson(rows) {
    return JSON.stringify(rows, null, 2);
}

// ---- Standalone HTML privacy report (feature 2) -------------------------------------------
// Deliberately lists only WHICH categories were found/removed, not the underlying sensitive
// values (GPS coordinates, author names, ...) -- a document meant as proof that a privacy pass
// happened should not itself become a new copy of the sensitive data it is reporting on.

function escapeHtmlText(value) {
    return String(value === undefined || value === null ? '' : value).replace(/[&<>"']/g, (ch) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
}

function buildHtmlReportString(rows) {
    const generatedAt = new Date().toISOString();
    const totalFiles = rows.length;
    const scrubbedFiles = rows.filter((r) => r.status === 'scrubbed').length;

    const bodyRows = rows.map((r) => `
        <tr>
            <td>${escapeHtmlText(r.filename)}</td>
            <td>${escapeHtmlText(r.type)}</td>
            <td>${escapeHtmlText(r.categoriesFound || '—')}</td>
            <td>${escapeHtmlText(r.categoriesRemoved || '—')}</td>
            <td><span class="pill pill-${escapeHtmlText(r.status)}">${escapeHtmlText(r.status)}</span></td>
        </tr>`).join('');

    return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Privacy Scrub Report</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#fafafa; color:#1a1a1a; padding:32px 16px; }
  .container { max-width: 900px; margin: 0 auto; background:#ffffff; border:1px solid #e5e5e5; border-radius:12px; overflow:hidden; }
  .header { padding:28px 32px; border-bottom:1px solid #e5e5e5; }
  h1 { font-size:20px; font-weight:600; margin-bottom:6px; }
  .meta { color:#737373; font-size:13px; }
  .content { padding:28px 32px; }
  .summary { display:flex; gap:24px; margin-bottom:24px; flex-wrap:wrap; }
  .stat { background:#fafafa; border:1px solid #e5e5e5; border-radius:8px; padding:16px 20px; min-width:120px; }
  .stat .num { font-size:24px; font-weight:600; }
  .stat .lbl { font-size:12px; color:#737373; }
  table { width:100%; border-collapse:collapse; font-size:13px; }
  th, td { text-align:left; padding:10px; border-bottom:1px solid #f0f0f0; vertical-align:top; word-break:break-word; }
  th { color:#737373; font-weight:600; background:#fafafa; }
  .pill { display:inline-block; font-size:11px; font-weight:500; padding:2px 8px; border-radius:999px; white-space:nowrap; }
  .pill-scrubbed { background:#f0fdf4; color:#166534; }
  .pill-inspected { background:#eff6ff; color:#2563eb; }
  .pill-error { background:#fef2f2; color:#991b1b; }
  .pill-skipped, .pill-pending { background:#f5f5f5; color:#737373; }
  .disclaimer { margin-top:24px; padding:14px 16px; background:#fffbeb; border:1px solid #fde68a; border-radius:8px; font-size:12px; color:#92400e; }
  .footer { padding:20px 32px; text-align:center; color:#a3a3a3; font-size:12px; border-top:1px solid #e5e5e5; background:#fafafa; }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Privacy &amp; Metadata Scrub Report</h1>
      <div class="meta">Generated locally by Privacy &amp; Metadata Forensics Studio on ${escapeHtmlText(generatedAt)}</div>
    </div>
    <div class="content">
      <div class="summary">
        <div class="stat"><div class="num">${totalFiles}</div><div class="lbl">Files processed</div></div>
        <div class="stat"><div class="num">${scrubbedFiles}</div><div class="lbl">Scrubbed</div></div>
      </div>
      <table>
        <thead>
          <tr><th>File</th><th>Type</th><th>Categories found</th><th>Categories removed</th><th>Status</th></tr>
        </thead>
        <tbody>${bodyRows}</tbody>
      </table>
      <div class="disclaimer">
        This report lists which <em>categories</em> of metadata were found and removed for each
        file. It deliberately does not reproduce the underlying sensitive values themselves (exact
        GPS coordinates, author names, etc.) so that a document meant as proof of a privacy pass
        does not itself become a new copy of the data it is reporting on. Generated entirely in
        your browser — this report was never uploaded or sent anywhere.
      </div>
    </div>
    <div class="footer">Privacy &amp; Metadata Forensics Studio — Chiara Berti 13</div>
  </div>
</body>
</html>`;
}

function downloadReport(format) {
    if (fileEntries.length === 0) {
        showAlert('error', 'No files loaded yet.');
        return;
    }
    const rows = buildSummaryRows();
    if (format === 'csv') {
        const blob = new Blob([toCsv(rows)], { type: 'text/csv' });
        downloadBlob(`scrub_report_${Date.now()}.csv`, blob);
    } else if (format === 'json') {
        const blob = new Blob([toJson(rows)], { type: 'application/json' });
        downloadBlob(`scrub_report_${Date.now()}.json`, blob);
    } else if (format === 'html') {
        const blob = new Blob([buildHtmlReportString(rows)], { type: 'text/html' });
        downloadBlob(`privacy_report_${Date.now()}.html`, blob);
    }
}

// ---------------------------------------------------------------------------------------------
// Stats, buttons, clear
// ---------------------------------------------------------------------------------------------

function updateStatsAndButtons() {
    const total = fileEntries.length;
    const inspected = fileEntries.filter((e) => e.inspected).length;
    const scrubbed = fileEntries.filter((e) => e.status === 'scrubbed').length;
    const errors = fileEntries.filter((e) => e.status === 'error').length;

    els.totalCount.textContent = String(total);
    els.inspectedCount.textContent = String(inspected);
    els.scrubbedCount.textContent = String(scrubbed);
    els.errorCount.textContent = String(errors);

    refreshGlobalButtons();
    renderReviewQueue();
}

function refreshGlobalButtons() {
    const total = fileEntries.length;
    const scrubbed = fileEntries.filter((e) => e.status === 'scrubbed').length;
    els.inspectAllBtn.disabled = total === 0;
    els.scrubConfirmedBtn.disabled = total === 0;
    els.downloadZipBtn.disabled = scrubbed === 0;
    els.downloadCsvBtn.disabled = total === 0;
    els.downloadJsonBtn.disabled = total === 0;
    els.downloadHtmlReportBtn.disabled = total === 0;
}

function clearAll() {
    fileEntries = [];
    els.fileList.textContent = '';
    els.fileList.style.display = 'none';
    els.stats.style.display = 'none';
    hideProgress();
    updateStatsAndButtons();
}

// ---------------------------------------------------------------------------------------------
// Unified alert component
// ---------------------------------------------------------------------------------------------

let alertTimer = null;

function showAlert(type, message) {
    const kind = ALERT_ICONS[type] ? type : 'info';

    els.alertBox.className = 'alert alert-' + kind + ' show';

    // Rebuild the icon node rather than mutate a possibly lucide-replaced element, same
    // reasoning as the theme toggle icon swap above.
    const oldIcon = document.getElementById('alertIcon');
    if (oldIcon) oldIcon.remove();
    const icon = document.createElement('i');
    icon.id = 'alertIcon';
    icon.setAttribute('data-lucide', ALERT_ICONS[kind]);
    icon.setAttribute('size', '18');
    els.alertBox.insertBefore(icon, els.alertText);

    els.alertText.textContent = message;

    lucide.createIcons();

    if (alertTimer) clearTimeout(alertTimer);
    const duration = ALERT_DURATIONS[kind] || 6000;
    alertTimer = setTimeout(() => {
        els.alertBox.classList.remove('show');
    }, duration);
}
