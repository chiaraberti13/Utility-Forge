# 🕶️ Document Redaction & Sanitization Studio

> 🇬🇧 **English** | 🇮🇹 [Italiano](README-IT.md)

A standalone web app that performs **real redaction** of images and PDFs — not the cosmetic kind.
Most free "redaction" tools just draw a black rectangle *on top of* your content: the original
text or pixels are still sitting underneath, fully intact and extractable with a simple
copy-paste or a two-line script. This tool instead **destroys the underlying data** at the pixel
level (images) or by **rebuilding the entire PDF from page images** (PDFs) — and then verifies,
for real, that nothing extractable is left behind. Everything runs client-side, in your own
browser: no upload, no server, no account.

---

## 🎯 COMPLETE PACKAGE

This package contains:
- **`document-redaction-studio.html`** - The application shell (open this file to run the app)
- **`document-redaction-studio.js`** - All the application logic (loaded by the HTML file; keep
  both files in the same folder)
- **`LICENSE`** - MIT License
- **`README.md`** / **`README-IT.md`** - This documentation (English / Italian)

---

## ✅ INSTALLATION (NONE REQUIRED!)

This is a **completely standalone** web app. You don't need to install:
- ❌ Python, Node.js or other programming languages
- ❌ Libraries or dependencies
- ❌ Additional software

Two ways to use it, both work equally well:

- **Locally, on your own computer** — just double-click `document-redaction-studio.html`; it
  opens in your default browser and everything (rendering, detection, redaction, PDF rebuilding)
  happens entirely in that browser tab.
- **Shared on a team/intranet server** — since it's two static files (HTML + JS), you can also
  drop the folder on any plain web server (or an internal file share, or a static host) so
  colleagues can reach it at a URL instead of each needing their own copy. No backend, no build
  step, no server-side language required.

**Just open the HTML file in your browser!**

---

## 🚀 HOW TO USE

The app has three tabs, reachable from the same page.

### Mode 1 — Image redaction
1. Open **"Redazione Immagine"** and drop in a JPEG, PNG or WEBP (max 30 MB).
2. Drag rectangles over the areas you want to hide. Draw as many as you like; click an existing
   box to remove it; use "Annulla ultimo box" / "Cancella tutti" to undo/clear.
3. Pick the fill color if you don't want plain black.
4. Click **"Applica redazione"**. The boxes are painted directly into the canvas's pixel data —
   the original pixels underneath are gone — and the image is re-exported from scratch with
   `canvas.toBlob()`. As a side effect, the re-encoding also strips any EXIF metadata (GPS
   location, camera model, timestamps, etc.).
5. Download the redacted image.

### Mode 2 — PDF redaction (interactive)
1. Open **"Redazione PDF"** and drop in a PDF (max 50 MB, max 300 pages). Every page is rendered
   to an on-screen canvas at ~150 dpi.
2. **Optional — auto-detect:** tick which categories to look for (email, phone numbers, IBAN,
   credit-card-like numbers with a Luhn checksum, Italian *codice fiscale*) and click "Rileva dati
   sensibili". Matches appear as **orange** suggested boxes — they are *not* redacted yet.
3. **Review:** click an orange box to confirm it (it turns **red**); click a red box to remove it;
   or use "Conferma tutti i suggerimenti" to accept everything at once. You can also draw manual
   boxes by hand on any page exactly like in image mode — those are red/confirmed immediately.
4. Optionally set a watermark text and/or a Bates-numbering prefix + start number.
5. Click **"Applica redazione e ricostruisci PDF"**. For every page, all confirmed boxes are
   painted solid black directly onto that page's already-rendered canvas, then **every page of the
   whole document** (redacted or not) is exported as a flattened JPEG image, and a brand-new PDF
   is rebuilt from those images with pdf-lib.
6. **Verification, done for real:** the app immediately re-opens the freshly built PDF with pdf.js
   and calls `getTextContent()` on every page again, showing you a line such as *"0 caratteri di
   testo estraibili trovati nel PDF redatto"*. If that count is ever not zero, it is shown
   prominently as a **failure**, not hidden.
7. Download the redacted PDF.

### Mode 3 — Batch PDF
1. Open **"Batch PDF"** and drop in multiple PDFs.
2. Configure a reusable rule-set (which categories to detect) and, optionally, watermark/Bates
   settings.
3. By default, detections are **never applied automatically** — batch mode will detect and count
   matches per file but leave pixels untouched unless you explicitly turn on **"Applica
   automaticamente i rilevamenti senza revisione manuale"**, which shows a prominent warning about
   false positives/negatives before you can rely on it for unattended processing.
4. Click "Avvia elaborazione batch". Each file is processed, verified and offered as an individual
   download, with a per-file summary (pages, detections, redactions applied, verification result).

---

## 📊 TECHNICAL LIMITS

- **Images:** rejected above **30 MB**. The longest side is capped at **4000 px** in the editor
  (larger images are downscaled for the on-screen canvas) to avoid freezing the browser tab;
  export quality/size depends on your original image.
- **PDFs:** rejected above **50 MB** or **300 pages**, per file, in every mode (interactive and
  batch) — with a clear message instead of hanging.
- **Performance:** rendering happens page by page with small asynchronous yields so the tab stays
  responsive even on documents with dozens of pages; very large batches will still take real wall
  time because every page is genuinely rasterized and re-encoded.
- **PII detection is heuristic, not perfect.** Regex-based detection (with a Luhn checksum for
  card-like numbers) works at the granularity of pdf.js's individual text items — it can miss a
  match split across two text runs, and it can flag things that only look like the pattern
  (false positives). That is exactly why detections are only *suggestions* by default and require
  a click to confirm, and why the batch "auto-apply" toggle carries an explicit warning.

---

## 🎯 FEATURES

✅ **Real pixel/text destruction** — not a cosmetic overlay  
✅ **Image redaction** with freehand rectangles, undo, color picker, EXIF stripped as a side effect  
✅ **PDF redaction** via rasterize-and-rebuild, the only technique that guarantees no leftover text  
✅ **Automatic PII detection** — email, phone, IBAN, credit card (Luhn-checked), Italian codice fiscale  
✅ **Suggested vs. confirmed boxes** — nothing is redacted without an explicit confirmation  
✅ **Real post-export verification** — re-extracts text from the finished PDF and reports the count  
✅ **Batch processing** with a reusable rule-set and an explicit, warned opt-in for unattended runs  
✅ **Optional watermark and Bates-style sequential page numbering**  
✅ **No installation, works offline** after first load, fully responsive interface  
✅ **100% local** — nothing is ever uploaded anywhere

---

## 💻 SYSTEM REQUIREMENTS

### Supported browsers
- ✅ Chrome 90+ (recommended)
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

A modern browser with `<canvas>`, Web Workers and `Blob`/`Uint8Array` support is required (all
current browsers qualify).

### Operating system
- ✅ Windows 10/11
- ✅ macOS 10.15+
- ✅ Linux (Ubuntu, Debian, Fedora, etc.)
- ✅ Android 9+ (Chrome Mobile)
- ✅ iOS/iPadOS 14+ (Safari)

### Minimum resources
- **RAM:** 4 GB (8 GB recommended for large multi-page PDFs or batch runs)
- **Internet connection:** only for the first load, to fetch pdf.js, pdf-lib and Lucide from CDN

---

## 🔧 TROUBLESHOOTING

### The page looks unstyled or icons are missing
**Cause:** the CDN scripts (pdf.js, pdf-lib, Lucide) didn't load — usually a connectivity issue.
**Solution:** check your connection and reload. The app cannot function for PDF mode without
pdf.js/pdf-lib, since those libraries do the actual rendering and PDF construction.

### "File troppo grande" / "Il PDF ha troppe pagine"
**Cause:** the file exceeds the built-in safety limits (30 MB for images; 50 MB or 300 pages for
PDFs).
**Solution:** split the PDF into smaller parts, or compress the image/PDF before uploading.

### Nothing happens when I click "Rileva dati sensibili"
**Cause:** no category checkbox is selected.
**Solution:** tick at least one category (email, phone, IBAN, credit card, codice fiscale) first.

### The verification line shows a number greater than zero
This means the rebuilt PDF still contains extractable text — the app deliberately surfaces this as
a visible failure instead of hiding it. This should not normally happen (every page is rasterized
to an image before being placed in the new PDF), but if you ever see it, do not use that output
file and please treat it as a bug.

### The redacted PDF is much larger/smaller than the original
This is expected: the output is a brand-new PDF made entirely of JPEG page images, so its size
depends on page resolution (~150 dpi) and JPEG quality rather than on the original PDF's internal
structure. It is also no longer text-selectable/searchable — see the Privacy & Security section
below for why that trade-off is unavoidable with a genuinely secure technique.

### Browser feels sluggish with a very large batch
**Solution:** process fewer files per batch run, close other tabs to free RAM, or use a
desktop-class Chrome/Firefox rather than a mobile browser for large jobs.

---

## 🔒 PRIVACY & SECURITY

✅ **All data stays on your computer** — files are read with the File API and processed entirely
in memory in your browser tab.  
✅ **No files uploaded to external servers.**  
✅ **No tracking or analytics.**  
✅ **No account required.**  
✅ **Open source** — you can inspect the code (two plain files, no bundler, no minification).

### Why "rasterize and rebuild" instead of surgically editing the PDF's text layer?

This is the core design decision behind the PDF mode, and it deserves to be stated plainly rather
than oversold: **nothing can safely "surgically" remove text from an existing PDF's content
stream in place.** A PDF's text layer, embedded fonts, cross-reference tables and object streams
are interconnected in ways that make targeted deletion fragile and easy to get wrong — a redacted
string can survive in a font's subsetting tables, in an incremental-update history, in an
unreferenced but still-present object, or simply because the "deletion" only removed the visible
glyphs while leaving the underlying string operator untouched. This is precisely the class of bug
behind several well-known real-world redaction failures.

The technique used here sidesteps all of that by construction: every page is rendered to a bitmap,
confirmed redaction boxes are painted directly onto that bitmap's pixels, and the *entire* document
— not just the redacted pages — is then rebuilt as a new PDF made of nothing but page images. There
is no text layer left anywhere in the output for anything to have survived in. This is the
well-known, correct way to guarantee this property; the price is that the resulting PDF is no
longer text-selectable or searchable.

### Hardening applied in this version

- **No `innerHTML`/inline `onclick` with file-derived data** — every value that comes from a
  loaded file (filenames, text extracted from a PDF) is written to the DOM with `textContent` and
  wired up with `addEventListener`, never `innerHTML` or an inline event-handler string.
- **Sanitized filenames** — every filename used for a download is stripped of path separators and
  control characters before being handed to the browser's download mechanism.
- **Strict Content-Security-Policy** — `default-src 'none'` with `script-src` limited to `'self'`
  plus the two pinned CDN origins (cdnjs, unpkg); the JavaScript logic itself lives in an external
  file (`document-redaction-studio.js`) specifically so no inline-script hash exception is needed.
  `worker-src` allows `blob:` and the cdnjs origin because pdf.js instantiates its own worker from
  a CDN-loaded script; nothing else is relaxed.
- **Pinned dependencies** — pdf.js, pdf-lib and Lucide are all loaded from exact, fixed version
  URLs (never `@latest`), so their code cannot change under you without notice, and the pdf.js
  worker version is kept in lock-step with the main library.
- **Size and page-count limits** — images over 30 MB and PDFs over 50 MB or 300 pages are rejected
  up front with a clear message, instead of freezing the browser tab.
- **Never auto-applies a detection silently** — automatically detected PII is always shown as an
  unconfirmed *suggestion* first; it only becomes an actual redaction after an explicit click (or,
  in batch mode, after an explicit opt-in toggle that carries its own on-screen warning).
- **Real post-export verification, not a claim** — after rebuilding the PDF, the app re-opens the
  output bytes with pdf.js and re-extracts the text of every page to confirm the count is zero, and
  prominently reports it if it is not.

### Known limitations, stated honestly

- Automatic PII detection is regex/heuristic-based and works at the granularity of individual
  pdf.js text items; it will miss some sensitive data (false negatives) and can flag some
  non-sensitive text (false positives). It is a starting point for manual review, not a guarantee
  of completeness — this is exactly why every suggestion requires confirmation by default.
  Batch mode's unattended "auto-apply" toggle is off by default and warns explicitly about this
  trade-off when turned on.
  - Manually drawn boxes are only as accurate as where you draw them — a box that doesn't fully
  cover the sensitive content will leave part of it visible in the flattened page image.
- The redacted PDF is a set of page images: it is not text-selectable, not searchable, and file
  size scales with page resolution/JPEG quality rather than with the original PDF's structure.
  This is the direct, disclosed cost of the guarantee described above.

---

## 📝 CHANGELOG

### Version 1.1
- 🌓 **Light/dark theme toggle** in the header, remembered per browser (`localStorage`) and
  synced with the OS preference by default. The theme only changes the surrounding chrome — every
  canvas (image pixels, rendered PDF pages, redaction box colors) always renders identically in
  both themes, since that's the actual content being redacted and must never appear to change.
- 🎨 Shared Utility Forge design tokens (CSS custom properties) so this tool is visually consistent
  with the rest of the suite; unified alert component (auto-hides success/info after 6s,
  error/warning after 8s; persistent alerts like the batch auto-apply warning stay visible).
- ♿ Accessibility pass: visible focus rings, `aria-label` on every icon-only control and file
  input, `role="status" aria-live="polite"` on alerts, and keyboard-reachable redaction controls
  (see the new shortcuts below). Responsive breakpoint standardized to 680px.
- 🗂️ **Global detection panel**: a collapsible list of every suggested/confirmed box across *all*
  pages of the current PDF (page, category, matched-text snippet, status), each row clickable to
  jump straight to that box — no more paging through a long document one screen at a time to find
  what was flagged.
- ⌨️ **Keyboard shortcuts** for reviewing PDF detections: `Enter`/`Space` confirms the selected
  box, `Delete`/`Backspace` rejects it, `[`/`]` or arrow keys move between boxes on the current
  page, `PageUp`/`PageDown` or `p`/`n` move between pages. A `?` button shows the shortcut list;
  a live status line announces the current selection for screen-reader users.
- 🏷️ **Redaction reason tagging**: every box now carries its detection category (email, phone,
  IBAN, credit card, codice fiscale, or manual) and an editable free-text reason, both shown in the
  detection panel. The post-export summary now reports a real audit trail, e.g. *"12 redazioni
  applicate: 4 email, 3 IBAN, 5 manuali"*, in both the interactive and batch flows — not just a
  bare count.

### Version 1.0
- 🎉 First release
- ✅ Image redaction with freehand rectangles, undo/clear, color picker, direct pixel destruction
- ✅ Interactive PDF redaction: page rendering, automatic PII detection (email, phone, IBAN,
  credit card with Luhn check, Italian codice fiscale), suggested/confirmed box workflow, manual
  boxes, watermark and Bates-numbering options
- ✅ Rasterize-and-rebuild PDF export via pdf-lib, with real post-export text-extraction
  verification shown to the user
- ✅ Batch PDF processing with a reusable rule-set and an explicitly warned auto-apply toggle
- 🔒 Strict CSP with all logic in an external script, sanitized filenames, pinned CDN dependencies,
  size/page limits

---

## 🆘 SUPPORT

For issues, questions or suggestions, please open an issue on GitHub.

---

## 📜 LICENSE

MIT License - see [LICENSE](LICENSE) file for details.

Copyright (c) 2026 Chiara Berti 13

---

**Document Redaction & Sanitization Studio v1.1**  
By Chiara Berti - 2026
