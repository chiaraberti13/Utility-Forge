# 📦 Batch Renamer & File Organizer Pro

> 🇬🇧 **English** | 🇮🇹 [Italiano](README-IT.md)

A standalone web app that renames files **in place, inside a real local folder**, straight from
your browser — driven by an uploaded Excel/CSV mapping and/or a rename-template pattern, with a
mandatory preview and a real rollback log. Unlike renamers that only let you download a renamed
copy of each file one at a time, this tool uses the browser's **File System Access API** to write
the new names directly back into the folder you picked. Everything runs client-side: nothing is
uploaded to a server.

---

## 🎯 COMPLETE PACKAGE

This package contains:
- **`batch-renamer-pro.html`** — the application shell and UI (open this file to run the app)
- **`batch-renamer-pro.js`** — all application logic (loaded by the HTML file; keep both together)
- **`LICENSE`** — MIT License
- **`README.md`** / **`README-IT.md`** — this documentation (English / Italian)

---

## ✅ INSTALLATION (NONE REQUIRED!)

This is a **completely standalone** web app. You don't need to install:
- ❌ Python, Node.js or other programming languages
- ❌ Libraries or dependencies
- ❌ Additional software

Just keep `batch-renamer-pro.html` and `batch-renamer-pro.js` in the same folder and open the HTML
file in a **Chromium-based browser** (see System Requirements below — this is not optional for
this particular tool).

---

## ⚠️ BEFORE YOU START: BROWSER REQUIREMENT

This tool needs to write directly into a folder on your disk, which requires the **File System
Access API** (`window.showDirectoryPicker()`). That API currently exists **only in Chromium-based
browsers**:

- ✅ Google Chrome 86+
- ✅ Microsoft Edge 86+
- ✅ Opera, Brave (Chromium-based)
- ❌ Mozilla Firefox — not supported
- ❌ Apple Safari — not supported

If you open the page in an unsupported browser, the app detects this immediately and shows a clear
explanation screen instead of a broken interface — no dead buttons, no silent failures.

---

## 🚀 HOW TO USE, STEP BY STEP

### Step 1 — Open the application
Double-click `batch-renamer-pro.html`, or open its URL if hosted on a server, in Chrome or Edge.

💡 **Note:** the page loads three small libraries (Excel parsing, EXIF reading, icons) from a CDN
over the internet each time you open it. The processing that happens *after* it has loaded —
reading your folder, your CSV, and renaming your files — never sends anything back over the
network.

### Step 2 — Pick your folder
Click **"Scegli cartella…"** and grant the browser access to the folder you want to work in. The
app lists every file: name, size, and last-modified date. For image files it also tries to read an
**EXIF capture date** (best-effort — if the image has no EXIF data, or the library can't parse it,
the listing still works fine, it just shows "—" for that file).

Toggle **"Includi sottocartelle"** to walk subfolders recursively. When that's on, a second toggle
appears: **"Appiattisci nella cartella principale"** — on, renamed files from subfolders are moved
up into the top folder; off, they're renamed in place and the folder structure is kept.

### Step 3 — Choose how new names are decided
You can use either or both of these, combined:

**A. CSV/XLSX mapping** — upload a spreadsheet with either:
- **Two columns**, e.g. "nome attuale" / "nome nuovo": each file is matched to a row by exact
  filename first, then case-insensitive, then a **fuzzy match** (hand-implemented Levenshtein
  distance) for close-but-not-identical names. Fuzzy matches are never applied silently — they're
  flagged in the preview and the run is blocked until you confirm them.
- **A single column** of new names: applied in file order, after you choose how the files are
  sorted (name/date/size, ascending/descending) — i.e. "rename file N to CSV row N".

**B. Template pattern** — a text pattern with placeholders, e.g.:
```
{csv:Prodotto}_{date:YYYYMMDD}_{seq:000}{ext}
```
Supported placeholders: `{orig}` (original name without extension), `{ext}`, `{seq}` /
`{seq:000}` (sequence number, configurable start and zero-padding), `{date}` /
`{date:YYYYMMDD}` (file's last-modified date), `{exifdate}` (capture date, same formatting, empty
if unavailable), and `{csv:ColumnName}` (pulls a value from the matched CSV row). All placeholders
are combinable in one pattern.

### Step 4 — Review the mandatory preview
Click **"Genera anteprima"**. You get a full old-name → new-name table for every file in scope,
with clear flags for:
- **Name collisions** — two files would end up with the same name; auto-resolved with an
  incremental numeric suffix (toggleable) or flagged in red if you turn auto-resolve off
- **No CSV match** (in CSV mode)
- **Invalid characters** (`\ / : * ? " < > |` and control characters) — automatically stripped,
  shown in the flags column so you see exactly what changed
- **Names too long** (over ~255 bytes)
- **Fuzzy matches** — always require your explicit confirmation before the run is allowed

**Nothing is written to disk until you click "Conferma ed esegui rinomina."**

### Step 5 — Execute and (if needed) roll back
The app processes one file at a time with a visible progress bar. If folder permission is lost
mid-run (denied/revoked), it stops cleanly and tells you exactly which files were and weren't
touched.

After the run:
- **Download a report CSV** (old name / new name / result: renamed / skipped / error+reason)
- **"Annulla ultima operazione"** reverses the run using the same read/write/remove technique —
  only works while the same folder handle is still held in this browser tab/session
- **Download the rollback log** as CSV to keep for later
- **Re-upload a previously downloaded log CSV** in a later session (after re-picking the same
  folder) to reverse it then too — this reuses the CSV-mapping engine with the old/new columns
  swapped

---

## 📊 TECHNICAL LIMITS

- **Hard limit: 5,000 files per run**, enforced up front with a clear error message — split the
  work across multiple folders/subfolders instead.
- Filenames are capped at **255 bytes** (UTF-8) — proposed names longer than that are flagged and
  truncated (preserving the extension) before being used.
- The rollback log and "Annulla ultima operazione" only work **within the same browser session**,
  while the directory handle is still held — folder access does not survive closing the tab or
  the browser. Use the downloadable CSV log to roll back in a later session.
- EXIF date reading is **best-effort**: unsupported formats, missing EXIF data, or a parsing
  failure never block the file listing, they just leave that field empty.

---

## 🎯 FEATURES

✅ **Renames files in place** — writes directly into the folder you pick, no one-by-one downloads
✅ **Recursive folder scanning** with flatten-or-keep-structure choice
✅ **CSV/XLSX-driven renaming** with exact → case-insensitive → fuzzy matching
✅ **Template-based renaming** with orig/ext/seq/date/exifdate/csv placeholders
✅ **Mandatory preview** before any write, with collision/invalid-char/length/no-match flags
✅ **Real rollback** — in-session undo, downloadable/re-uploadable rollback log
✅ **Downloadable run report** (renamed/skipped/error, with reasons)
✅ **Visible progress bar**, safe stop on permission loss
✅ **No installation**, works after first load except for CDN libraries
✅ **100% local processing** — nothing is uploaded anywhere
✅ **Responsive design**, vector icons, blue accent palette matching the rest of the suite

---

## 💻 SYSTEM REQUIREMENTS

### ⚠️ Supported browsers — Chromium only
This tool **requires** a browser that implements the File System Access API:
- ✅ Google Chrome 86+ (recommended)
- ✅ Microsoft Edge 86+
- ✅ Opera, Brave (Chromium-based)
- ❌ Firefox — **not supported**, no File System Access API
- ❌ Safari — **not supported**, no File System Access API

This is a hard requirement, not a recommendation — the app detects support on load and shows a
clear explanation screen instead of the tool if your browser can't run it.

### Operating system
- ✅ Windows 10/11
- ✅ macOS 10.15+
- ✅ Linux (Ubuntu, Debian, Fedora, etc.)
- ⚠️ Android/iOS — the File System Access API is desktop-only in practice; mobile Chrome does not
  currently support `showDirectoryPicker()`

### Minimum resources
- **RAM:** 2 GB (4 GB recommended for folders with thousands of files)
- **Internet connection:** only needed to load the three CDN libraries on first open

---

## 🔧 TROUBLESHOOTING

### The page shows "Browser non supportato" instead of the app
**Cause:** you're using Firefox, Safari, or another non-Chromium browser.
**Solution:** open the same HTML file in Chrome, Edge, Opera, or Brave.

### "Scegli cartella…" does nothing / no dialog appears
**Cause:** the browser blocked the picker (e.g. triggered outside a direct user click), or you're
in an unsupported browser context (some embedded/automated browser views can't show native
dialogs).
**Solution:** click the button directly in a normal browser window/tab, not from an automation
script or an embedded webview.

### Folder access is lost after reloading the page
**Cause:** this is expected — the File System Access API does not persist folder handles across
page reloads for this app. **Solution:** re-pick the folder with "Scegli cartella…"; use the
downloaded rollback-log CSV if you need to undo an older run.

### Icons or CDN libraries don't load
**Cause:** internet connection issue on first load.
**Solution:** check your connection and reload; core folder-listing and renaming functionality
does not depend on the icon library, only on SheetJS (for CSV/XLSX) and, best-effort, exifr (for
EXIF dates).

### A rename fails partway through the run
**Cause:** most commonly a lost/denied folder permission, a file locked by another program, or a
name that collides on disk with something the app didn't know about.
**Solution:** check the downloaded report CSV for the exact error per file; files already renamed
successfully are listed as "renamed" and can be reversed with "Annulla ultima operazione" or the
saved rollback log.

### Some filenames look different from what I typed in the template/CSV
**Cause:** the proposed name contained characters invalid on Windows/macOS/Linux, or exceeded the
255-byte limit — the app sanitizes both automatically and flags the change in the preview.
**Solution:** check the "Avvisi" column in the preview before confirming; adjust your template or
CSV values if the automatic result isn't what you want.

---

## 🔒 PRIVACY AND SECURITY

✅ **All data stays on your computer** — folder contents and CSV mappings are read and processed
entirely in your browser's memory
✅ **No files uploaded to external servers**
✅ **No tracking or analytics**
✅ **No account required**
✅ **Open source** — you can inspect the code (two plain files, no build step, no minification)

**Hardening applied in this tool:**
- **XSS-safe rendering** — every value that comes from a file, folder listing, or uploaded
  spreadsheet (filenames, CSV cell contents, error messages) is written to the page with
  `textContent` and every interactive element is wired with `addEventListener`. `innerHTML` and
  inline `onclick` strings built from untrusted data are never used.
- **Filename sanitization before every write** — every proposed new filename is validated and
  stripped of characters invalid on Windows/macOS/Linux (`\ / : * ? " < > |` and control
  characters) and capped at 255 bytes **before** it is ever passed to `getFileHandle()`. Path
  separators are stripped defensively even though the File System Access API already sandboxes
  `getFileHandle()`/`removeEntry()` to the single directory the user explicitly granted — by
  design, this API cannot be used to write or delete outside that folder — but stripping those
  characters costs nothing and removes any ambiguity, since they're invalid filename characters on
  every OS anyway.
- **Content-Security-Policy** — `default-src 'none'; script-src 'self' https://cdn.sheetjs.com
  https://cdn.jsdelivr.net https://unpkg.com; style-src 'unsafe-inline'; img-src data: blob:;
  connect-src 'self'; base-uri 'none'; form-action 'none'`. All application logic lives in the
  external `batch-renamer-pro.js` file (not inline), so `script-src` needs no inline-script hash —
  only `'self'` plus the three pinned CDN origins the app actually loads from.
- **Pinned dependency versions** — SheetJS (`xlsx-0.20.3`), exifr (`7.1.3`), and Lucide (`0.469.0`)
  are all loaded from version-pinned CDN URLs, never `@latest`, so their code cannot change under
  you without notice.
- **Size limits** — runs over 5,000 files are rejected up front with a clear message instead of
  freezing the browser tab.
- **No silent partial state** — if folder permission is lost mid-run, the run stops immediately
  and the results/report clearly separate what was renamed from what was skipped or errored; the
  app never claims success for files it didn't actually touch.
- **Explicit confirmation gate** — nothing is written to disk until you click the dedicated confirm
  button on the preview screen, and fuzzy CSV matches specifically block that button until you
  acknowledge them.

---

## 📝 CHANGELOG

### Version 1.0
- 🎉 First release
- ✅ Folder picking and listing via the File System Access API (name, size, date, best-effort EXIF)
- ✅ Recursive scan with flatten-or-keep-structure choice
- ✅ CSV/XLSX mapping: two-column exact/case-insensitive/fuzzy matching, and single-column
  positional mode
- ✅ Template-based renaming with `{orig}`, `{ext}`, `{seq}`, `{date}`, `{exifdate}`, `{csv:...}`
- ✅ Mandatory preview with collision/invalid-char/length/no-match flags
- ✅ In-place execution (read → write new → remove old), with progress bar and safe stop on lost
  permission
- ✅ In-session undo, downloadable/re-uploadable rollback log, downloadable run report
- ✅ 5,000-file limit per run

---

## 🆘 SUPPORT

For issues, questions or suggestions, please open an issue on GitHub.

---

## 📜 LICENSE

MIT License - see [LICENSE](LICENSE) file for details.

Copyright (c) 2026 Chiara Berti 13

---

**Batch Renamer & File Organizer Pro v1.0**
By Chiara Berti - 2026
