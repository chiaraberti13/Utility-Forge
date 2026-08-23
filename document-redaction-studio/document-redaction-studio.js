'use strict';

/*
 * Document Redaction & Sanitization Studio
 * Tutta la logica vive qui (file esterno) apposta: così la pagina HTML può avere una CSP
 * script-src ristretta a 'self' + le origini CDN, senza bisogno di hash per script inline.
 *
 * Principio di sicurezza seguito ovunque in questo file: nessun valore che deriva da un file
 * caricato dall'utente (nome file, testo estratto da un PDF, contenuto di un'immagine) viene mai
 * inserito nel DOM con innerHTML o con un attributo onclick costruito come stringa. Si costruiscono
 * sempre nodi DOM con document.createElement/appendChild e si usa textContent per il testo.
 */

// ---------------------------------------------------------------------------------------------
// Tema chiaro/scuro — applicato come primissima cosa eseguita da questo script (che è comunque
// caricato in fondo al body per scelta architetturale/CSP, quindi un flash iniziale non è del
// tutto eliminabile senza uno script inline, che romperebbe la CSP script-src rigorosa: qui si
// riduce al minimo eseguendo questo blocco prima di qualunque altra cosa). I canvas (contenuto PDF
// /immagine e box di redazione) non usano MAI questi token: i colori disegnati sui canvas sono
// scelti esplicitamente nel codice e restano identici in entrambi i temi.
// ---------------------------------------------------------------------------------------------

const THEME_STORAGE_KEY = 'uf-theme';

function getStoredTheme() {
    try { return localStorage.getItem(THEME_STORAGE_KEY); } catch (e) { return null; }
}

function setStoredTheme(theme) {
    try {
        if (theme) localStorage.setItem(THEME_STORAGE_KEY, theme);
        else localStorage.removeItem(THEME_STORAGE_KEY);
    } catch (e) { /* localStorage non disponibile (es. navigazione privata): non è bloccante */ }
}

function applyTheme(theme) {
    if (theme === 'dark' || theme === 'light') {
        document.documentElement.setAttribute('data-theme', theme);
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
}

function currentEffectiveTheme() {
    const attr = document.documentElement.getAttribute('data-theme');
    if (attr === 'dark' || attr === 'light') return attr;
    return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
}

applyTheme(getStoredTheme());

// ---------------------------------------------------------------------------------------------
// Costanti e limiti di sicurezza/robustezza
// ---------------------------------------------------------------------------------------------

const MAX_IMAGE_BYTES = 30 * 1024 * 1024;   // 30 MB
const MAX_PDF_BYTES = 50 * 1024 * 1024;     // 50 MB
const MAX_PDF_PAGES = 300;
const MAX_IMAGE_DIM = 4000;                 // lato massimo (px) per l'editor immagine, per non bloccare il browser
const RENDER_SCALE = 150 / 72;              // ~150dpi (i PDF usano 72pt/pollice come unità base)

// Versione fissata di pdf.js: il worker deve combaciare esattamente con la libreria caricata sopra.
// Il controllo di presenza (typeof) evita che un blocco di rete/firewall su UNA sola libreria CDN
// (es. pdf.js) mandi in errore l'intero script e disattivi anche la modalità Immagine, che non
// dipende da pdf.js: le modalità PDF/Batch mostreranno invece un messaggio d'errore chiaro (vedi
// setupPdfMode/setupBatchMode) invece di un crash silenzioso.
const PDFJS_AVAILABLE = typeof pdfjsLib !== 'undefined';
const PDFLIB_AVAILABLE = typeof PDFLib !== 'undefined';
if (PDFJS_AVAILABLE) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js';
}

// Richiama lucide.createIcons() solo se la libreria si è caricata: se il CDN di Lucide non è
// raggiungibile l'app deve continuare a funzionare (senza icone) invece di bloccarsi.
function safeCreateIcons() {
    try {
        if (typeof lucide !== 'undefined') lucide.createIcons();
    } catch (e) { /* ignore: le icone sono puramente decorative */ }
}

// ---------------------------------------------------------------------------------------------
// Utility generiche
// ---------------------------------------------------------------------------------------------

function $(id) { return document.getElementById(id); }

function clearChildren(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
}

// Rimuove separatori di percorso e caratteri di controllo da un nome file, così può essere usato
// in sicurezza come nome di download.
function sanitizeFilename(name) {
    let safe = String(name).replace(/[\/\\?%*:|"<>\x00-\x1F]/g, '_').trim();
    if (safe === '') safe = 'documento';
    return safe.slice(0, 150);
}

function baseName(filename) {
    return String(filename).replace(/\.[^./\\]+$/, '');
}

// Timer di auto-hide per ciascun alert, così una nuova chiamata a showAlertBox sullo stesso
// elemento cancella il timer precedente invece di farlo sparire troppo presto/tardi.
const alertHideTimers = new WeakMap();

// Componente alert unificato per tutta la suite Utility Forge: successo/info si nascondono da soli
// dopo 6s, errore/warning dopo 8s (tempo di lettura più lungo per i messaggi critici). Passa
// { persist: true } per un alert che deve restare visibile finché non lo si nasconde esplicitamente
// (es. l'avviso "batch senza revisione manuale", che resta sempre visibile finché l'opzione è attiva).
function showAlertBox(alertEl, message, options) {
    const span = alertEl.querySelector('span');
    if (span) span.textContent = message; else alertEl.textContent = message;
    alertEl.classList.add('show');

    const existing = alertHideTimers.get(alertEl);
    if (existing) { clearTimeout(existing); alertHideTimers.delete(alertEl); }

    if (options && options.persist) return;

    const isUrgent = alertEl.classList.contains('alert-error') || alertEl.classList.contains('alert-warning');
    const delay = isUrgent ? 8000 : 6000;
    const timer = setTimeout(() => { alertEl.classList.remove('show'); }, delay);
    alertHideTimers.set(alertEl, timer);
}

function hideAlertBox(alertEl) {
    const existing = alertHideTimers.get(alertEl);
    if (existing) { clearTimeout(existing); alertHideTimers.delete(alertEl); }
    alertEl.classList.remove('show');
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = sanitizeFilename(filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function canvasToBlob(canvas, type, quality) {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) resolve(blob); else reject(new Error('Impossibile esportare il canvas come immagine.'));
        }, type, quality);
    });
}

function hexToRgba(hex, alpha) {
    let h = String(hex).replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const r = parseInt(h.substring(0, 2), 16) || 0;
    const g = parseInt(h.substring(2, 4), 16) || 0;
    const b = parseInt(h.substring(4, 6), 16) || 0;
    return `rgba(${r},${g},${b},${alpha})`;
}

function outputMimeFor(file) {
    if (file.type === 'image/png') return 'image/png';
    if (file.type === 'image/webp') return 'image/webp';
    return 'image/jpeg';
}

function extFor(mime) {
    if (mime === 'image/png') return '.png';
    if (mime === 'image/webp') return '.webp';
    return '.jpg';
}

function loadImageFile(file) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Impossibile leggere il file: formato non valido o immagine corrotta.')); };
        img.src = url;
    });
}

// Generico attach di drag&drop + click-to-select per un'area di upload.
function setupUploadArea(areaEl, inputEl, onFiles, options) {
    const multiple = !!(options && options.multiple);
    areaEl.addEventListener('click', () => inputEl.click());
    areaEl.addEventListener('dragover', (e) => { e.preventDefault(); areaEl.classList.add('dragover'); });
    areaEl.addEventListener('dragleave', () => areaEl.classList.remove('dragover'));
    areaEl.addEventListener('drop', (e) => {
        e.preventDefault();
        areaEl.classList.remove('dragover');
        const files = e.dataTransfer && e.dataTransfer.files;
        if (!files || !files.length) return;
        onFiles(multiple ? Array.from(files) : files[0]);
    });
    inputEl.addEventListener('change', (e) => {
        const files = e.target.files;
        if (!files || !files.length) return;
        onFiles(multiple ? Array.from(files) : files[0]);
        inputEl.value = '';
    });
}

// Interazione generica "disegna rettangolo trascinando, clicca per interagire con uno esistente"
// su un canvas overlay trasparente. Le coordinate restituite sono in pixel del canvas (non CSS).
function attachBoxDrawing(overlayCanvas, handlers) {
    let dragging = false;
    let moved = false;
    let startX = 0, startY = 0, curX = 0, curY = 0;

    function pos(evt) {
        const rect = overlayCanvas.getBoundingClientRect();
        const touch = evt.touches && evt.touches[0];
        const clientX = touch ? touch.clientX : evt.clientX;
        const clientY = touch ? touch.clientY : evt.clientY;
        const scaleX = overlayCanvas.width / rect.width;
        const scaleY = overlayCanvas.height / rect.height;
        return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
    }

    function down(evt) {
        evt.preventDefault();
        const p = pos(evt);
        dragging = true; moved = false;
        startX = p.x; startY = p.y; curX = p.x; curY = p.y;
    }

    function move(evt) {
        if (!dragging) return;
        evt.preventDefault();
        const p = pos(evt);
        curX = p.x; curY = p.y;
        if (Math.abs(curX - startX) > 3 || Math.abs(curY - startY) > 3) moved = true;
        handlers.redraw({ x: Math.min(startX, curX), y: Math.min(startY, curY), w: Math.abs(curX - startX), h: Math.abs(curY - startY) });
    }

    function up() {
        if (!dragging) return;
        dragging = false;
        if (moved) {
            const rect = { x: Math.min(startX, curX), y: Math.min(startY, curY), w: Math.abs(curX - startX), h: Math.abs(curY - startY) };
            if (rect.w >= 4 && rect.h >= 4) handlers.onDragEnd(rect); else handlers.redraw(null);
        } else {
            handlers.onClick(startX, startY);
        }
    }

    overlayCanvas.addEventListener('mousedown', down);
    overlayCanvas.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    overlayCanvas.addEventListener('touchstart', down, { passive: false });
    overlayCanvas.addEventListener('touchmove', move, { passive: false });
    overlayCanvas.addEventListener('touchend', up);
}

// ---------------------------------------------------------------------------------------------
// Rilevamento PII: regex + validazioni aggiuntive per ridurre i falsi positivi
// ---------------------------------------------------------------------------------------------

function luhnCheck(digitsStr) {
    let sum = 0;
    let alt = false;
    for (let i = digitsStr.length - 1; i >= 0; i--) {
        let n = parseInt(digitsStr[i], 10);
        if (alt) { n *= 2; if (n > 9) n -= 9; }
        sum += n;
        alt = !alt;
    }
    return sum % 10 === 0;
}

// Restituisce true se il testo contiene almeno una corrispondenza per la categoria indicata.
function findMatches(category, text) {
    const results = [];
    if (!text) return results;

    if (category === 'email') {
        const re = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        let m;
        while ((m = re.exec(text))) results.push({ start: m.index, end: m.index + m[0].length, text: m[0] });
    } else if (category === 'phone') {
        const re = /(?:\+\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?){2,5}\d{2,4}/g;
        let m;
        while ((m = re.exec(text))) {
            const digits = m[0].replace(/\D/g, '');
            if (digits.length >= 8 && digits.length <= 15) {
                results.push({ start: m.index, end: m.index + m[0].length, text: m[0] });
            }
        }
    } else if (category === 'iban') {
        const re = /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/g;
        let m;
        while ((m = re.exec(text))) {
            const len = m[0].length;
            if (len >= 15 && len <= 34) results.push({ start: m.index, end: m.index + len, text: m[0] });
        }
    } else if (category === 'creditcard') {
        const re = /\b(?:\d[ -]?){13,19}\b/g;
        let m;
        while ((m = re.exec(text))) {
            const digits = m[0].replace(/[ -]/g, '');
            if (digits.length >= 13 && digits.length <= 19 && luhnCheck(digits)) {
                results.push({ start: m.index, end: m.index + m[0].length, text: m[0] });
            }
        }
    } else if (category === 'codicefiscale') {
        const re = /\b[A-Za-z]{6}\d{2}[A-Za-z]\d{2}[A-Za-z]\d{3}[A-Za-z]\b/g;
        let m;
        while ((m = re.exec(text))) results.push({ start: m.index, end: m.index + m[0].length, text: m[0] });
    }
    return results;
}

// Converte il transform di un text item di pdf.js in un rettangolo nelle coordinate del viewport
// (cioè coordinate pixel del canvas su cui la pagina è stata renderizzata).
function itemToViewportRect(item, viewport) {
    try {
        const x0 = item.transform[4];
        const y0 = item.transform[5];
        const w = item.width || 1;
        const h = item.height || Math.abs(item.transform[3]) || 8;
        const rect = viewport.convertToViewportRectangle([x0, y0, x0 + w, y0 + h]);
        const x = Math.min(rect[0], rect[2]);
        const y = Math.min(rect[1], rect[3]);
        const rw = Math.abs(rect[2] - rect[0]);
        const rh = Math.abs(rect[3] - rect[1]);
        if (!isFinite(x) || !isFinite(y) || rw <= 0 || rh <= 0) return null;
        return { x, y, w: rw, h: rh };
    } catch (e) {
        return null;
    }
}

function boxAlreadyPresent(boxes, rect) {
    return boxes.some((b) => Math.abs(b.x - rect.x) < 2 && Math.abs(b.y - rect.y) < 2 && Math.abs(b.w - rect.w) < 2 && Math.abs(b.h - rect.h) < 2);
}

// ---------------------------------------------------------------------------------------------
// Interruttore tema chiaro/scuro
// ---------------------------------------------------------------------------------------------

function updateThemeToggleIcon() {
    const btn = $('themeToggle');
    if (!btn) return;
    const eff = currentEffectiveTheme();
    clearChildren(btn);
    const icon = document.createElement('i');
    icon.setAttribute('data-lucide', eff === 'dark' ? 'sun' : 'moon');
    icon.setAttribute('size', '18');
    btn.appendChild(icon);
    safeCreateIcons();
}

function setupThemeToggle() {
    const btn = $('themeToggle');
    if (!btn) return;
    updateThemeToggleIcon();
    btn.addEventListener('click', () => {
        const next = currentEffectiveTheme() === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        setStoredTheme(next);
        updateThemeToggleIcon();
    });
}

// ---------------------------------------------------------------------------------------------
// Tab switching
// ---------------------------------------------------------------------------------------------

function setupTabs() {
    const defs = [
        { btn: $('tabImage'), panel: $('panelImage') },
        { btn: $('tabPdf'), panel: $('panelPdf') },
        { btn: $('tabBatch'), panel: $('panelBatch') },
    ];
    defs.forEach((d) => {
        d.btn.addEventListener('click', () => {
            defs.forEach((o) => {
                o.btn.classList.toggle('active', o === d);
                o.panel.classList.toggle('active', o === d);
            });
        });
    });
}

// ---------------------------------------------------------------------------------------------
// MODE A: redazione immagine
// ---------------------------------------------------------------------------------------------

let imgState = null;          // { file, boxes: [{x,y,w,h,color}] }
let lastImgResultBlob = null;
let lastImgResultName = '';

function redrawImgOverlay(previewRect) {
    const overlay = $('imgOverlayCanvas');
    const ctx = overlay.getContext('2d');
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    if (!imgState) return;
    imgState.boxes.forEach((b) => {
        ctx.fillStyle = hexToRgba(b.color, 0.35);
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.strokeStyle = b.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(b.x, b.y, b.w, b.h);
    });
    if (previewRect) {
        const color = $('imgBoxColor').value;
        ctx.fillStyle = hexToRgba(color, 0.25);
        ctx.fillRect(previewRect.x, previewRect.y, previewRect.w, previewRect.h);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 4]);
        ctx.strokeRect(previewRect.x, previewRect.y, previewRect.w, previewRect.h);
        ctx.setLineDash([]);
    }
}

function updateImgBoxCount() {
    $('imgBoxCount').textContent = `${imgState ? imgState.boxes.length : 0} box disegnati`;
}

async function handleImageFile(file) {
    hideAlertBox($('imgErrorAlert'));
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        showAlertBox($('imgErrorAlert'), `Formato non supportato (${file.type || 'sconosciuto'}). Usa un file JPEG, PNG o WEBP.`);
        return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
        showAlertBox($('imgErrorAlert'), `File troppo grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Il limite è ${MAX_IMAGE_BYTES / 1024 / 1024}MB.`);
        return;
    }

    try {
        const img = await loadImageFile(file);
        let w = img.naturalWidth, h = img.naturalHeight;
        const maxDim = Math.max(w, h);
        if (maxDim > MAX_IMAGE_DIM) {
            const scale = MAX_IMAGE_DIM / maxDim;
            w = Math.round(w * scale);
            h = Math.round(h * scale);
        }
        const canvas = $('imgCanvas');
        const overlay = $('imgOverlayCanvas');
        canvas.width = w; canvas.height = h;
        overlay.width = w; overlay.height = h;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);

        imgState = { file, boxes: [] };
        lastImgResultBlob = null;
        $('imgEditorCard').classList.remove('hidden');
        $('imgDownloadBtn').classList.add('hidden');
        hideAlertBox($('imgSuccessAlert'));
        redrawImgOverlay(null);
        updateImgBoxCount();
        safeCreateIcons();
    } catch (err) {
        showAlertBox($('imgErrorAlert'), err.message);
    }
}

function setupImageMode() {
    setupUploadArea($('imgUploadArea'), $('imgFileInput'), handleImageFile, { multiple: false });

    attachBoxDrawing($('imgOverlayCanvas'), {
        redraw: (preview) => redrawImgOverlay(preview),
        onDragEnd: (rect) => {
            if (!imgState) return;
            imgState.boxes.push({ x: rect.x, y: rect.y, w: rect.w, h: rect.h, color: $('imgBoxColor').value });
            redrawImgOverlay(null);
            updateImgBoxCount();
        },
        onClick: (x, y) => {
            if (!imgState) return;
            for (let i = imgState.boxes.length - 1; i >= 0; i--) {
                const b = imgState.boxes[i];
                if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
                    imgState.boxes.splice(i, 1);
                    redrawImgOverlay(null);
                    updateImgBoxCount();
                    return;
                }
            }
        },
    });

    $('imgUndoBtn').addEventListener('click', () => {
        if (!imgState || !imgState.boxes.length) return;
        imgState.boxes.pop();
        redrawImgOverlay(null);
        updateImgBoxCount();
    });

    $('imgClearBtn').addEventListener('click', () => {
        if (!imgState) return;
        imgState.boxes = [];
        redrawImgOverlay(null);
        updateImgBoxCount();
    });

    $('imgApplyBtn').addEventListener('click', async () => {
        if (!imgState || imgState.boxes.length === 0) {
            showAlertBox($('imgErrorAlert'), 'Disegna almeno un box prima di applicare la redazione.');
            return;
        }
        hideAlertBox($('imgErrorAlert'));
        const canvas = $('imgCanvas');
        const ctx = canvas.getContext('2d');
        // Distruzione reale dei pixel: i rettangoli vengono dipinti direttamente sui dati del
        // canvas, sovrascrivendo il contenuto originale. Non è un livello separato removibile.
        imgState.boxes.forEach((b) => {
            ctx.fillStyle = b.color;
            ctx.fillRect(b.x, b.y, b.w, b.h);
        });
        imgState.boxes = [];
        redrawImgOverlay(null);
        updateImgBoxCount();

        try {
            const mime = outputMimeFor(imgState.file);
            const blob = await canvasToBlob(canvas, mime, 0.92);
            lastImgResultBlob = blob;
            lastImgResultName = sanitizeFilename(baseName(imgState.file.name) + '-redatta' + extFor(mime));
            $('imgDownloadBtn').classList.remove('hidden');
            showAlertBox($('imgSuccessAlert'), 'Redazione applicata: i pixel originali sotto ogni box sono stati sovrascritti in modo permanente e non sono più recuperabili. La ri-esportazione ha anche rimosso eventuali metadati EXIF.');
        } catch (err) {
            showAlertBox($('imgErrorAlert'), err.message);
        }
    });

    $('imgDownloadBtn').addEventListener('click', () => {
        if (lastImgResultBlob) downloadBlob(lastImgResultBlob, lastImgResultName);
    });
}

// ---------------------------------------------------------------------------------------------
// MODE B: redazione PDF interattiva
// ---------------------------------------------------------------------------------------------

let currentPdfState = null;   // { file, name, pdfProxy, pages: [pageState] }
let lastPdfResultBlob = null;
let lastPdfResultName = '';

// Ogni box (suggerito, confermato o disegnato a mano) riceve un id stabile e incrementale: serve a
// riferirlo dal pannello globale dei rilevamenti e dalle scorciatoie da tastiera senza dipendere da
// indici di array che cambiano quando un box viene rimosso.
let nextBoxId = 1;

// Etichette leggibili delle categorie di rilevamento, usate nel pannello, nello stato da tastiera e
// nel riepilogo "N redazioni applicate: X email, Y IBAN, ..." mostrato dopo l'esportazione.
const CATEGORY_LABELS = {
    email: 'Email',
    phone: 'Telefono',
    iban: 'IBAN',
    creditcard: 'Carta di credito',
    codicefiscale: 'Codice fiscale',
    manuale: 'Manuale',
};

function defaultReasonFor(category) {
    return CATEGORY_LABELS[category] || category || 'Manuale';
}

function truncateSnippet(text, max) {
    const s = String(text || '').trim();
    const limit = max || 60;
    return s.length > limit ? s.slice(0, limit - 1) + '…' : s;
}

// Stato del "focus da tastiera": quale pagina/box è correntemente selezionato per Invio/Canc/frecce.
// Separato dallo stato dei box stessi perché deve sopravvivere a redraw e riflettersi sia sul
// canvas (anello di evidenziazione) sia nel pannello globale (riga evidenziata) sia nella barra di
// stato testuale (per chi usa uno screen reader).
let kbdFocusPageIdx = null;
let kbdFocusBoxId = null;

function getPageBoxes(pageIdx) {
    return (currentPdfState && currentPdfState.pages[pageIdx]) ? currentPdfState.pages[pageIdx].boxes : [];
}

function findBoxById(id) {
    if (!currentPdfState || id == null) return null;
    for (let pi = 0; pi < currentPdfState.pages.length; pi++) {
        const boxes = currentPdfState.pages[pi].boxes;
        for (let bi = 0; bi < boxes.length; bi++) {
            if (boxes[bi].id === id) {
                return { pageIdx: pi, boxIdx: bi, box: boxes[bi], pageState: currentPdfState.pages[pi] };
            }
        }
    }
    return null;
}

function redrawPageOverlay(pageState, previewRect) {
    const ctx = pageState.overlay.getContext('2d');
    ctx.clearRect(0, 0, pageState.overlay.width, pageState.overlay.height);
    pageState.boxes.forEach((b) => {
        const confirmed = b.status === 'confirmed';
        ctx.fillStyle = confirmed ? 'rgba(220,38,38,0.40)' : 'rgba(234,88,12,0.35)';
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.strokeStyle = confirmed ? '#dc2626' : '#ea580c';
        ctx.lineWidth = 2;
        ctx.strokeRect(b.x, b.y, b.w, b.h);
        // Anello blu tratteggiato per il box attualmente selezionato via tastiera/pannello — questi
        // colori sono scelti esplicitamente in JS e NON dipendono dal tema chiaro/scuro: il
        // contenuto del canvas deve restare identico in entrambi i temi.
        if (b.id === kbdFocusBoxId) {
            ctx.save();
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 3;
            ctx.setLineDash([6, 3]);
            ctx.strokeRect(b.x - 3, b.y - 3, b.w + 6, b.h + 6);
            ctx.restore();
        }
    });
    if (previewRect) {
        ctx.fillStyle = 'rgba(59,130,246,0.25)';
        ctx.fillRect(previewRect.x, previewRect.y, previewRect.w, previewRect.h);
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 4]);
        ctx.strokeRect(previewRect.x, previewRect.y, previewRect.w, previewRect.h);
        ctx.setLineDash([]);
    }
}

function updatePdfCounts() {
    let sugg = 0, conf = 0;
    if (currentPdfState) {
        currentPdfState.pages.forEach((p) => {
            let ps = 0, pc = 0;
            p.boxes.forEach((b) => { if (b.status === 'suggested') { ps++; sugg++; } else { pc++; conf++; } });
            if (p.statsEl) p.statsEl.textContent = `${ps} suggeriti · ${pc} confermati`;
        });
    }
    $('pdfSuggestedCount').textContent = `${sugg} suggeriti`;
    $('pdfConfirmedCount').textContent = `${conf} confermati`;
    renderDetectionPanel();
}

// ---- Pannello globale dei rilevamenti (tutte le pagine) ----------------------------------------

function renderDetectionPanel() {
    const body = $('detectionPanelBody');
    const countBadge = $('detectionPanelCount');
    const emptyMsg = $('detectionPanelEmpty');
    if (!body) return;

    clearChildren(body);
    let total = 0;

    if (currentPdfState) {
        currentPdfState.pages.forEach((pageState, pageIdx) => {
            pageState.boxes.forEach((box) => {
                total++;
                body.appendChild(buildDetectionRow(pageState, pageIdx, box));
            });
        });
    }

    if (total === 0 && emptyMsg) body.appendChild(emptyMsg);
    if (countBadge) countBadge.textContent = `${total} totali`;
    safeCreateIcons();
}

function buildDetectionRow(pageState, pageIdx, box) {
    const row = document.createElement('div');
    row.className = 'detection-row';
    if (box.id === kbdFocusBoxId) row.classList.add('focused');

    const main = document.createElement('div');
    main.className = 'detection-row-main';
    const pageLine = document.createElement('div');
    pageLine.className = 'detection-row-page';
    const catLabel = CATEGORY_LABELS[box.category] || box.category;
    const statusLabel = box.status === 'confirmed' ? 'confermato' : 'suggerito';
    pageLine.textContent = `Pagina ${pageState.pageNum} · ${catLabel} · ${statusLabel}`;
    const snippetLine = document.createElement('div');
    snippetLine.className = 'detection-row-snippet';
    snippetLine.textContent = box.snippet || '';
    main.appendChild(pageLine);
    main.appendChild(snippetLine);

    const reasonInput = document.createElement('input');
    reasonInput.type = 'text';
    reasonInput.className = 'detection-row-reason';
    reasonInput.value = box.reason || '';
    reasonInput.placeholder = 'Motivo (opzionale)';
    reasonInput.setAttribute('aria-label', `Motivo della redazione per il box a pagina ${pageState.pageNum}, categoria ${catLabel}`);
    reasonInput.addEventListener('click', (e) => e.stopPropagation());
    reasonInput.addEventListener('input', () => { box.reason = reasonInput.value; });

    const actions = document.createElement('div');
    actions.className = 'detection-row-actions';

    if (box.status === 'suggested') {
        const confirmBtn = document.createElement('button');
        confirmBtn.type = 'button';
        confirmBtn.setAttribute('aria-label', `Conferma il box a pagina ${pageState.pageNum}`);
        confirmBtn.title = 'Conferma';
        const ci = document.createElement('i');
        ci.setAttribute('data-lucide', 'check');
        ci.setAttribute('size', '16');
        confirmBtn.appendChild(ci);
        confirmBtn.addEventListener('click', (e) => { e.stopPropagation(); confirmBoxById(box.id); });
        actions.appendChild(confirmBtn);
    }

    const rejectBtn = document.createElement('button');
    rejectBtn.type = 'button';
    rejectBtn.setAttribute('aria-label', `Rimuovi il box a pagina ${pageState.pageNum}`);
    rejectBtn.title = 'Rimuovi';
    const ri = document.createElement('i');
    ri.setAttribute('data-lucide', 'x');
    ri.setAttribute('size', '16');
    rejectBtn.appendChild(ri);
    rejectBtn.addEventListener('click', (e) => { e.stopPropagation(); rejectBoxById(box.id); });
    actions.appendChild(rejectBtn);

    row.appendChild(main);
    row.appendChild(reasonInput);
    row.appendChild(actions);
    row.addEventListener('click', () => setKbdFocus(pageIdx, box.id));

    return row;
}

// ---- Azioni condivise da click sul canvas, pannello e scorciatoie da tastiera ------------------

function confirmBoxById(id) {
    const found = findBoxById(id);
    if (!found || found.box.status !== 'suggested') return;
    found.box.status = 'confirmed';
    redrawPageOverlay(found.pageState, null);
    updatePdfCounts();
    updateKbdStatus();
}

function rejectBoxById(id) {
    const found = findBoxById(id);
    if (!found) return;
    found.pageState.boxes.splice(found.boxIdx, 1);
    const remaining = found.pageState.boxes;
    const nextFocusId = remaining.length ? remaining[Math.min(found.boxIdx, remaining.length - 1)].id : null;
    redrawPageOverlay(found.pageState, null);
    updatePdfCounts();
    setKbdFocus(found.pageIdx, nextFocusId);
}

// ---- Scorciatoie da tastiera: stato del focus e navigazione -----------------------------------

function scrollPageIntoView(pageIdx) {
    if (!currentPdfState || !currentPdfState.pages[pageIdx]) return;
    const block = currentPdfState.pages[pageIdx].blockEl;
    if (block && block.scrollIntoView) block.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function setKbdFocus(pageIdx, boxId) {
    kbdFocusPageIdx = pageIdx;
    kbdFocusBoxId = boxId != null ? boxId : null;
    if (currentPdfState) {
        currentPdfState.pages.forEach((p, i) => {
            redrawPageOverlay(p, null);
            if (p.blockEl) p.blockEl.classList.toggle('focus-target', i === pageIdx);
        });
    }
    scrollPageIntoView(pageIdx);
    updateKbdStatus();
    renderDetectionPanel();
}

function updateKbdStatus() {
    const el = $('kbdHintStatus');
    if (!el) return;
    if (!currentPdfState || kbdFocusPageIdx == null || !currentPdfState.pages[kbdFocusPageIdx]) {
        el.textContent = 'Nessun box selezionato. Clicca un box, una riga del pannello, oppure usa PgUp/PgDn per iniziare a usare le scorciatoie.';
        return;
    }
    const pageState = currentPdfState.pages[kbdFocusPageIdx];
    if (kbdFocusBoxId == null) {
        el.textContent = `Pagina ${pageState.pageNum} di ${pageState.totalPages} selezionata — nessun box in questa pagina. Frecce/[ ] per scegliere un box, PgUp/PgDn per cambiare pagina.`;
        return;
    }
    const found = findBoxById(kbdFocusBoxId);
    if (!found) { el.textContent = 'Il box selezionato non esiste più.'; return; }
    const catLabel = CATEGORY_LABELS[found.box.category] || found.box.category;
    const statusLabel = found.box.status === 'confirmed' ? 'confermato' : 'da confermare';
    el.textContent = `Pagina ${pageState.pageNum} di ${pageState.totalPages} — box "${catLabel}" (${statusLabel}). Invio conferma, Canc rimuove, [ ] cambia box, PgUp/PgDn cambia pagina.`;
}

function moveBoxFocus(delta) {
    if (!currentPdfState || !currentPdfState.pages.length) return;
    const pageIdx = kbdFocusPageIdx != null ? kbdFocusPageIdx : 0;
    const boxes = getPageBoxes(pageIdx);
    if (!boxes.length) { setKbdFocus(pageIdx, null); return; }
    let idx = kbdFocusBoxId != null ? boxes.findIndex((b) => b.id === kbdFocusBoxId) : -1;
    idx = idx === -1 ? (delta > 0 ? 0 : boxes.length - 1) : Math.min(Math.max(idx + delta, 0), boxes.length - 1);
    setKbdFocus(pageIdx, boxes[idx].id);
}

function movePageFocus(delta) {
    if (!currentPdfState || !currentPdfState.pages.length) return;
    const from = kbdFocusPageIdx != null ? kbdFocusPageIdx : 0;
    const pageIdx = Math.min(Math.max(from + delta, 0), currentPdfState.pages.length - 1);
    const boxes = getPageBoxes(pageIdx);
    setKbdFocus(pageIdx, boxes.length ? boxes[0].id : null);
}

function setupPdfKeyboardShortcuts() {
    document.addEventListener('keydown', (evt) => {
        if (!currentPdfState) return;
        const pdfPanelEl = $('panelPdf');
        if (!pdfPanelEl || !pdfPanelEl.classList.contains('active')) return;
        const editorCard = $('pdfEditorCard');
        if (!editorCard || editorCard.classList.contains('hidden')) return;
        const active = document.activeElement;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;

        const key = evt.key;
        if (key === 'Enter' || key === ' ') {
            if (kbdFocusBoxId != null) { evt.preventDefault(); confirmBoxById(kbdFocusBoxId); }
        } else if (key === 'Delete' || key === 'Backspace') {
            if (kbdFocusBoxId != null) { evt.preventDefault(); rejectBoxById(kbdFocusBoxId); }
        } else if (key === '[' || key === 'ArrowLeft' || key === 'ArrowUp') {
            evt.preventDefault(); moveBoxFocus(-1);
        } else if (key === ']' || key === 'ArrowRight' || key === 'ArrowDown') {
            evt.preventDefault(); moveBoxFocus(1);
        } else if (key === 'PageUp' || key === 'p') {
            evt.preventDefault(); movePageFocus(-1);
        } else if (key === 'PageDown' || key === 'n') {
            evt.preventDefault(); movePageFocus(1);
        }
    });

    const toggleBtn = $('detectionPanelToggle');
    const panelBody = $('detectionPanelBody');
    if (toggleBtn && panelBody) {
        toggleBtn.addEventListener('click', () => {
            const open = panelBody.classList.toggle('open');
            toggleBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
    }

    const helpBtn = $('kbdHelpToggle');
    const helpBody = $('kbdHelpBody');
    if (helpBtn && helpBody) {
        helpBtn.addEventListener('click', () => {
            const open = helpBody.classList.toggle('open');
            helpBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
    }
}

// ---- Riepilogo per categoria (usato sia dalla modalità interattiva sia dal batch) --------------

function tallyCategories(pageEntries) {
    const tally = {};
    pageEntries.forEach((entry) => {
        entry.confirmedBoxes.forEach((b) => {
            const key = b.category || 'manuale';
            tally[key] = (tally[key] || 0) + 1;
        });
    });
    return tally;
}

function formatCategoryTally(tally) {
    const keys = Object.keys(tally);
    if (!keys.length) return '';
    return keys.map((k) => `${tally[k]} ${(CATEGORY_LABELS[k] || k).toLowerCase()}`).join(', ');
}

function buildPageBlock(pageState) {
    const block = document.createElement('div');
    block.className = 'page-block';

    const header = document.createElement('div');
    header.className = 'page-block-header';
    const title = document.createElement('span');
    title.textContent = `Pagina ${pageState.pageNum} di ${pageState.totalPages}`;
    const stats = document.createElement('span');
    stats.className = 'page-block-stats';
    stats.textContent = '0 suggeriti · 0 confermati';
    header.appendChild(title);
    header.appendChild(stats);
    block.appendChild(header);

    const scrollWrap = document.createElement('div');
    scrollWrap.className = 'canvas-scroll';
    const wrap = document.createElement('div');
    wrap.className = 'canvas-wrap';
    wrap.appendChild(pageState.canvas);
    wrap.appendChild(pageState.overlay);
    scrollWrap.appendChild(wrap);
    block.appendChild(scrollWrap);

    pageState.statsEl = stats;
    pageState.blockEl = block;
    $('pdfPagesContainer').appendChild(block);
}

function resetPdfEditor() {
    if (currentPdfState && currentPdfState.pdfProxy) {
        try { currentPdfState.pdfProxy.destroy(); } catch (e) { /* ignore */ }
    }
    currentPdfState = null;
    lastPdfResultBlob = null;
    kbdFocusPageIdx = null;
    kbdFocusBoxId = null;
    clearChildren($('pdfPagesContainer'));
    $('pdfEditorCard').classList.add('hidden');
    $('pdfDownloadBtn').classList.add('hidden');
    $('pdfVerifyResult').style.display = 'none';
    hideAlertBox($('pdfErrorAlert'));
    hideAlertBox($('pdfApplyErrorAlert'));
    renderDetectionPanel();
    updateKbdStatus();
}

async function handlePdfFileForEditing(file) {
    resetPdfEditor();

    if (!PDFJS_AVAILABLE || !PDFLIB_AVAILABLE) {
        showAlertBox($('pdfErrorAlert'), 'Le librerie pdf.js/pdf-lib non si sono caricate dal CDN (controlla la connessione e ricarica la pagina): la modalità PDF non può funzionare senza di esse.');
        return;
    }

    const looksLikePdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
    if (!looksLikePdf) {
        showAlertBox($('pdfErrorAlert'), 'Il file selezionato non sembra un PDF.');
        return;
    }
    if (file.size > MAX_PDF_BYTES) {
        showAlertBox($('pdfErrorAlert'), `File troppo grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Il limite è ${MAX_PDF_BYTES / 1024 / 1024}MB.`);
        return;
    }

    const progress = $('pdfLoadProgress');
    const fill = $('pdfLoadProgressFill');
    progress.style.display = 'block';
    fill.style.width = '0%';

    try {
        const buf = await file.arrayBuffer();
        const pdfProxy = await pdfjsLib.getDocument({ data: buf }).promise;

        if (pdfProxy.numPages > MAX_PDF_PAGES) {
            showAlertBox($('pdfErrorAlert'), `Il PDF ha troppe pagine (${pdfProxy.numPages}). Il limite è ${MAX_PDF_PAGES}.`);
            try { pdfProxy.destroy(); } catch (e) { /* ignore */ }
            progress.style.display = 'none';
            return;
        }

        currentPdfState = { file, name: file.name, pdfProxy, pages: [] };

        for (let n = 1; n <= pdfProxy.numPages; n++) {
            const page = await pdfProxy.getPage(n);
            const viewport = page.getViewport({ scale: RENDER_SCALE });
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(viewport.width);
            canvas.height = Math.round(viewport.height);
            const ctx = canvas.getContext('2d');
            await page.render({ canvasContext: ctx, viewport }).promise;

            const overlay = document.createElement('canvas');
            overlay.className = 'overlay-canvas';
            overlay.width = canvas.width;
            overlay.height = canvas.height;

            const pageState = {
                pageNum: n,
                totalPages: pdfProxy.numPages,
                canvas,
                overlay,
                viewport,
                boxes: [],
                statsEl: null,
            };

            buildPageBlock(pageState);

            attachBoxDrawing(overlay, {
                redraw: (preview) => redrawPageOverlay(pageState, preview),
                onDragEnd: (rect) => {
                    const box = {
                        id: nextBoxId++,
                        x: rect.x, y: rect.y, w: rect.w, h: rect.h,
                        status: 'confirmed',
                        category: 'manuale',
                        snippet: '(disegnato a mano)',
                        reason: defaultReasonFor('manuale'),
                    };
                    pageState.boxes.push(box);
                    const pageIdx = currentPdfState.pages.indexOf(pageState);
                    updatePdfCounts();
                    setKbdFocus(pageIdx, box.id);
                },
                onClick: (x, y) => {
                    for (let i = pageState.boxes.length - 1; i >= 0; i--) {
                        const b = pageState.boxes[i];
                        if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
                            const pageIdx = currentPdfState.pages.indexOf(pageState);
                            if (b.status === 'suggested') {
                                b.status = 'confirmed';
                                updatePdfCounts();
                                setKbdFocus(pageIdx, b.id);
                            } else {
                                pageState.boxes.splice(i, 1);
                                updatePdfCounts();
                                setKbdFocus(pageIdx, null);
                            }
                            return;
                        }
                    }
                },
            });

            currentPdfState.pages.push(pageState);
            fill.style.width = `${Math.round((n / pdfProxy.numPages) * 100)}%`;
            if (n % 3 === 0) await new Promise((r) => setTimeout(r, 0));
        }

        progress.style.display = 'none';
        $('pdfEditorCard').classList.remove('hidden');
        updatePdfCounts();
        safeCreateIcons();
    } catch (err) {
        progress.style.display = 'none';
        showAlertBox($('pdfErrorAlert'), `Errore nel caricamento del PDF: ${err.message}`);
    }
}

async function runDetectionOnState(pdfState, categories) {
    for (const pageState of pdfState.pages) {
        // Rimuove i suggerimenti precedenti non ancora confermati, per evitare duplicati se si
        // rilancia il rilevamento; i box confermati o manuali restano intatti.
        pageState.boxes = pageState.boxes.filter((b) => b.status === 'confirmed');
        const page = await pdfState.pdfProxy.getPage(pageState.pageNum);
        const tc = await page.getTextContent();
        for (const item of tc.items) {
            if (!item.str || !item.str.trim()) continue;
            for (const cat of categories) {
                const matches = findMatches(cat, item.str);
                if (matches.length) {
                    const rect = itemToViewportRect(item, pageState.viewport);
                    if (rect && !boxAlreadyPresent(pageState.boxes, rect)) {
                        pageState.boxes.push({
                            id: nextBoxId++,
                            x: rect.x, y: rect.y, w: rect.w, h: rect.h,
                            status: 'suggested',
                            category: cat,
                            snippet: truncateSnippet(matches[0].text, 60),
                            reason: defaultReasonFor(cat),
                        });
                    }
                    break;
                }
            }
        }
        redrawPageOverlay(pageState, null);
    }
}

// Costruisce un nuovo PDF a partire da un array di { canvas, confirmedBoxes } — dipinge i box
// direttamente sui pixel del canvas, esporta ogni pagina come JPEG e la incolla in un documento
// pdf-lib nuovo di zecca. Poi riapre il risultato con pdf.js e riconta il testo estraibile.
async function buildRedactedPdf(pageEntries, options, onProgress) {
    const outDoc = await PDFLib.PDFDocument.create();
    let font = null;
    if (options.watermarkText || options.batesPrefix) {
        font = await outDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
    }

    for (let i = 0; i < pageEntries.length; i++) {
        const entry = pageEntries[i];
        const ctx = entry.canvas.getContext('2d');
        entry.confirmedBoxes.forEach((b) => {
            ctx.fillStyle = options.redactionColor || '#000000';
            ctx.fillRect(b.x, b.y, b.w, b.h);
        });

        const blob = await canvasToBlob(entry.canvas, 'image/jpeg', 0.9);
        const bytes = new Uint8Array(await blob.arrayBuffer());
        const jpg = await outDoc.embedJpg(bytes);

        const widthPt = entry.canvas.width / RENDER_SCALE;
        const heightPt = entry.canvas.height / RENDER_SCALE;
        const page = outDoc.addPage([widthPt, heightPt]);
        page.drawImage(jpg, { x: 0, y: 0, width: widthPt, height: heightPt });

        if (options.watermarkText && font) {
            const size = Math.max(20, Math.min(widthPt, heightPt) / 8);
            const textWidth = font.widthOfTextAtSize(options.watermarkText, size);
            page.drawText(options.watermarkText, {
                x: widthPt / 2 - textWidth / 2,
                y: heightPt / 2,
                size,
                font,
                color: PDFLib.rgb(0.55, 0.55, 0.55),
                opacity: 0.35,
                rotate: PDFLib.degrees(45),
            });
        }

        if (options.batesPrefix && font) {
            const num = String((options.batesStart || 0) + i).padStart(6, '0');
            const label = `${options.batesPrefix}${num}`;
            const size = 10;
            const tw = font.widthOfTextAtSize(label, size);
            page.drawText(label, { x: Math.max(4, widthPt - tw - 18), y: 14, size, font, color: PDFLib.rgb(0.1, 0.1, 0.1) });
        }

        if (onProgress) onProgress((i + 1) / pageEntries.length);
        if (i % 3 === 0) await new Promise((r) => setTimeout(r, 0));
    }

    const pdfBytes = await outDoc.save();

    // Verifica reale: riapre il PDF appena costruito ed estrae di nuovo il testo di ogni pagina.
    let totalChars = 0;
    const verifyProxy = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
    for (let n = 1; n <= verifyProxy.numPages; n++) {
        const vp = await verifyProxy.getPage(n);
        const tc = await vp.getTextContent();
        totalChars += tc.items.reduce((s, it) => s + (it.str ? it.str.length : 0), 0);
    }
    try { await verifyProxy.destroy(); } catch (e) { /* ignore */ }

    return { blob: new Blob([pdfBytes], { type: 'application/pdf' }), totalChars, pageCount: pageEntries.length };
}

async function applyRedactionPipeline(pdfState, opts, onProgress) {
    const pageEntries = pdfState.pages.map((p) => ({
        canvas: p.canvas,
        confirmedBoxes: p.boxes.filter((b) => b.status === 'confirmed').map((b) => ({ x: b.x, y: b.y, w: b.w, h: b.h, category: b.category })),
    }));
    const categoryTally = tallyCategories(pageEntries);
    const appliedCount = Object.values(categoryTally).reduce((s, n) => s + n, 0);
    const result = await buildRedactedPdf(pageEntries, opts, onProgress);
    // I box confermati sono ormai dipinti in modo permanente sul canvas (stessa istanza usata
    // sopra): li rimuoviamo dalla lista logica per riflettere che non sono più "box separati".
    pdfState.pages.forEach((p) => {
        p.boxes = p.boxes.filter((b) => b.status !== 'confirmed');
        redrawPageOverlay(p, null);
    });
    result.categoryTally = categoryTally;
    result.appliedCount = appliedCount;
    return result;
}

function showVerifyResult(el, totalChars, pageCount, categoryTally, appliedCount) {
    clearChildren(el);
    el.className = 'verify-result ' + (totalChars === 0 ? 'verify-ok' : 'verify-fail');
    el.style.display = 'block';
    const icon = document.createElement('i');
    icon.setAttribute('data-lucide', totalChars === 0 ? 'shield-check' : 'shield-alert');
    icon.setAttribute('size', '18');
    icon.style.flexShrink = '0';
    el.appendChild(icon);
    const span = document.createElement('span');
    span.style.marginLeft = '8px';
    if (totalChars === 0) {
        let auditLine = '';
        if (appliedCount != null) {
            auditLine = appliedCount > 0
                ? ` ${appliedCount} redazioni applicate: ${formatCategoryTally(categoryTally)}.`
                : ' Nessuna redazione confermata è stata applicata (solo rasterizzazione delle pagine).';
        }
        span.textContent = `Verifica completata: 0 caratteri di testo estraibili trovati nel PDF redatto (su ${pageCount} pagine).${auditLine} Il documento è stato ricostruito interamente come immagini di pagina.`;
    } else {
        span.textContent = `ATTENZIONE — verifica fallita: ${totalChars} caratteri di testo risultano ancora estraibili dal PDF redatto (su ${pageCount} pagine). Non usare questo file.`;
    }
    el.appendChild(span);
    safeCreateIcons();
}

function setupPdfMode() {
    setupUploadArea($('pdfUploadArea'), $('pdfFileInput'), handlePdfFileForEditing, { multiple: false });

    $('pdfDetectBtn').addEventListener('click', async () => {
        if (!currentPdfState) return;
        const categories = Array.from($('pdfRuleset').querySelectorAll('input[type=checkbox]:checked')).map((c) => c.value);
        if (!categories.length) {
            showAlertBox($('pdfErrorAlert'), 'Seleziona almeno una categoria da rilevare.');
            return;
        }
        hideAlertBox($('pdfErrorAlert'));
        $('pdfDetectBtn').disabled = true;
        try {
            await runDetectionOnState(currentPdfState, categories);
            updatePdfCounts();
        } catch (err) {
            showAlertBox($('pdfErrorAlert'), `Errore durante il rilevamento: ${err.message}`);
        } finally {
            $('pdfDetectBtn').disabled = false;
        }
    });

    $('pdfConfirmAllBtn').addEventListener('click', () => {
        if (!currentPdfState) return;
        currentPdfState.pages.forEach((p) => {
            p.boxes.forEach((b) => { if (b.status === 'suggested') b.status = 'confirmed'; });
            redrawPageOverlay(p, null);
        });
        updatePdfCounts();
    });

    $('pdfClearBoxesBtn').addEventListener('click', () => {
        if (!currentPdfState) return;
        currentPdfState.pages.forEach((p) => {
            p.boxes = [];
            redrawPageOverlay(p, null);
        });
        updatePdfCounts();
    });

    $('pdfApplyBtn').addEventListener('click', async () => {
        if (!currentPdfState) return;
        hideAlertBox($('pdfApplyErrorAlert'));
        $('pdfVerifyResult').style.display = 'none';
        $('pdfDownloadBtn').classList.add('hidden');
        $('pdfApplyBtn').disabled = true;
        const progress = $('pdfApplyProgress');
        const fill = $('pdfApplyProgressFill');
        progress.style.display = 'block';
        fill.style.width = '0%';

        try {
            const opts = {
                redactionColor: '#000000',
                watermarkText: $('pdfWatermarkText').value.trim(),
                batesPrefix: $('pdfBatesPrefix').value.trim(),
                batesStart: parseInt($('pdfBatesStart').value, 10) || 0,
            };
            const result = await applyRedactionPipeline(currentPdfState, opts, (frac) => { fill.style.width = `${Math.round(frac * 100)}%`; });
            lastPdfResultBlob = result.blob;
            lastPdfResultName = sanitizeFilename(baseName(currentPdfState.name) + '-redatto.pdf');
            $('pdfDownloadBtn').classList.remove('hidden');
            showVerifyResult($('pdfVerifyResult'), result.totalChars, result.pageCount, result.categoryTally, result.appliedCount);
            updatePdfCounts();
        } catch (err) {
            showAlertBox($('pdfApplyErrorAlert'), `Errore durante l'applicazione della redazione: ${err.message}`);
        } finally {
            $('pdfApplyBtn').disabled = false;
            progress.style.display = 'none';
        }
    });

    $('pdfDownloadBtn').addEventListener('click', () => {
        if (lastPdfResultBlob) downloadBlob(lastPdfResultBlob, lastPdfResultName);
    });
}

// ---------------------------------------------------------------------------------------------
// MODE C: batch PDF
// ---------------------------------------------------------------------------------------------

let batchFiles = [];

function createBatchRow(name) {
    const row = document.createElement('div');
    row.className = 'batch-file-row';

    const nameEl = document.createElement('span');
    nameEl.className = 'batch-file-name';
    nameEl.textContent = name;

    const rightWrap = document.createElement('div');
    rightWrap.style.display = 'flex';
    rightWrap.style.alignItems = 'center';
    rightWrap.style.gap = '10px';

    const statusEl = document.createElement('span');
    statusEl.className = 'batch-file-status';
    statusEl.textContent = 'In attesa';

    const dlBtn = document.createElement('button');
    dlBtn.className = 'btn btn-secondary btn-sm hidden';
    dlBtn.type = 'button';
    const dlIcon = document.createElement('i');
    dlIcon.setAttribute('data-lucide', 'download');
    dlIcon.setAttribute('size', '16');
    dlBtn.appendChild(dlIcon);
    dlBtn.appendChild(document.createTextNode(' Scarica'));

    rightWrap.appendChild(statusEl);
    rightWrap.appendChild(dlBtn);
    row.appendChild(nameEl);
    row.appendChild(rightWrap);

    return {
        el: row,
        setStatus(text) { statusEl.textContent = text; },
        setResult(result, downloadName) {
            const verifyText = result.totalChars === 0
                ? 'verifica OK, 0 caratteri estraibili'
                : `verifica FALLITA, ${result.totalChars} caratteri estraibili`;
            const tallyText = result.categoryTally ? formatCategoryTally(result.categoryTally) : '';
            const appliedText = result.appliedCount > 0
                ? `${result.appliedCount} box oscurati (${tallyText})`
                : 'nessun box oscurato (revisione manuale disattivata)';
            statusEl.textContent = `${result.pageCount} pagine · ${result.detectedCount} rilevati · ${appliedText} · ${verifyText}`;
            dlBtn.classList.remove('hidden');
            dlBtn.addEventListener('click', () => downloadBlob(result.blob, downloadName));
            safeCreateIcons();
        },
        setError(msg) {
            statusEl.textContent = `Errore: ${msg}`;
            statusEl.style.color = '#dc2626';
        },
    };
}

function renderBatchFileList() {
    const list = $('batchFileList');
    clearChildren(list);
    batchFiles.forEach((f) => {
        const row = createBatchRow(f.name);
        list.appendChild(row.el);
    });
    safeCreateIcons();
}

async function processBatchFile(file, opts) {
    if (file.size > MAX_PDF_BYTES) {
        throw new Error(`file troppo grande (${(file.size / 1024 / 1024).toFixed(1)}MB, limite ${MAX_PDF_BYTES / 1024 / 1024}MB)`);
    }
    const buf = await file.arrayBuffer();
    const pdfProxy = await pdfjsLib.getDocument({ data: buf }).promise;
    if (pdfProxy.numPages > MAX_PDF_PAGES) {
        try { pdfProxy.destroy(); } catch (e) { /* ignore */ }
        throw new Error(`troppe pagine (${pdfProxy.numPages}, limite ${MAX_PDF_PAGES})`);
    }

    const pageEntries = [];
    let detectedCount = 0;

    for (let n = 1; n <= pdfProxy.numPages; n++) {
        const page = await pdfProxy.getPage(n);
        const viewport = page.getViewport({ scale: RENDER_SCALE });
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;

        let confirmedBoxes = [];
        if (opts.categories.length) {
            const foundBoxes = [];
            const tc = await page.getTextContent();
            for (const item of tc.items) {
                if (!item.str || !item.str.trim()) continue;
                for (const cat of opts.categories) {
                    const matches = findMatches(cat, item.str);
                    if (matches.length) {
                        const rect = itemToViewportRect(item, viewport);
                        if (rect && !boxAlreadyPresent(foundBoxes, rect)) foundBoxes.push({ ...rect, category: cat });
                        break;
                    }
                }
            }
            detectedCount += foundBoxes.length;
            if (opts.autoApply) confirmedBoxes = foundBoxes;
        }

        pageEntries.push({ canvas, confirmedBoxes });
        if (n % 3 === 0) await new Promise((r) => setTimeout(r, 0));
    }

    try { await pdfProxy.destroy(); } catch (e) { /* ignore */ }

    const categoryTally = tallyCategories(pageEntries);
    const result = await buildRedactedPdf(pageEntries, opts, null);
    return {
        name: file.name,
        detectedCount,
        appliedCount: opts.autoApply ? detectedCount : 0,
        categoryTally,
        totalChars: result.totalChars,
        pageCount: result.pageCount,
        blob: result.blob,
    };
}

function setupBatchMode() {
    setupUploadArea($('batchUploadArea'), $('batchFileInput'), (files) => {
        if (!PDFJS_AVAILABLE || !PDFLIB_AVAILABLE) {
            showAlertBox($('batchErrorAlert'), 'Le librerie pdf.js/pdf-lib non si sono caricate dal CDN (controlla la connessione e ricarica la pagina): la modalità Batch non può funzionare senza di esse.');
            return;
        }
        const errors = [];
        files.forEach((f) => {
            const looksLikePdf = f.type === 'application/pdf' || /\.pdf$/i.test(f.name);
            if (!looksLikePdf) { errors.push(`${f.name}: non è un PDF`); return; }
            if (f.size > MAX_PDF_BYTES) { errors.push(`${f.name}: troppo grande`); return; }
            batchFiles.push(f);
        });
        renderBatchFileList();
        $('batchConfigCard').classList.remove('hidden');
        if (errors.length) showAlertBox($('batchErrorAlert'), errors.join('; '));
        else hideAlertBox($('batchErrorAlert'));
    }, { multiple: true });

    $('batchAutoApply').addEventListener('change', (e) => {
        // Avviso persistente: nessun timer di auto-hide, resta visibile finché l'opzione è attiva.
        $('batchAutoApplyWarning').classList.toggle('show', e.target.checked);
    });

    $('batchRunBtn').addEventListener('click', async () => {
        if (!batchFiles.length) return;
        const categories = Array.from($('batchRuleset').querySelectorAll('input[type=checkbox]:checked')).map((c) => c.value);
        const opts = {
            categories,
            autoApply: $('batchAutoApply').checked,
            redactionColor: '#000000',
            watermarkText: $('batchWatermarkText').value.trim(),
            batesPrefix: $('batchBatesPrefix').value.trim(),
            batesStart: parseInt($('batchBatesStart').value, 10) || 0,
        };

        $('batchRunBtn').disabled = true;
        const progress = $('batchProgress');
        const fill = $('batchProgressFill');
        progress.style.display = 'block';
        fill.style.width = '0%';

        const list = $('batchFileList');
        clearChildren(list);
        const rows = batchFiles.map((f) => {
            const row = createBatchRow(f.name);
            list.appendChild(row.el);
            return row;
        });
        safeCreateIcons();

        for (let i = 0; i < batchFiles.length; i++) {
            const file = batchFiles[i];
            rows[i].setStatus('Elaborazione in corso...');
            try {
                const result = await processBatchFile(file, opts);
                const downloadName = sanitizeFilename(baseName(file.name) + '-redatto.pdf');
                rows[i].setResult(result, downloadName);
            } catch (err) {
                rows[i].setError(err.message);
            }
            fill.style.width = `${Math.round(((i + 1) / batchFiles.length) * 100)}%`;
        }

        $('batchRunBtn').disabled = false;
    });
}

// ---------------------------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------------------------

// Ogni funzione di setup è isolata in un proprio try/catch: un problema in una modalità non deve
// impedire l'inizializzazione delle altre (es. tab, drag&drop di base restano utilizzabili anche
// se una libreria CDN specifica non si è caricata).
safeCreateIcons();
try { setupThemeToggle(); } catch (e) { console.error('setupThemeToggle failed:', e); }
try { setupTabs(); } catch (e) { console.error('setupTabs failed:', e); }
try { setupImageMode(); } catch (e) { console.error('setupImageMode failed:', e); }
try { setupPdfMode(); } catch (e) { console.error('setupPdfMode failed:', e); }
try { setupPdfKeyboardShortcuts(); } catch (e) { console.error('setupPdfKeyboardShortcuts failed:', e); }
try { setupBatchMode(); } catch (e) { console.error('setupBatchMode failed:', e); }
