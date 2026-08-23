# 📄 PDF Power Suite

> 🇬🇧 **English** | 🇮🇹 [Italiano](README-IT.md)

A single self-contained web app that bundles eleven PDF operations — merge, split, page management,
compress, PDF → images, watermark & Bates numbering, OCR to searchable PDF, version diffing, table
extraction, CSV mail merge into PDF forms, and a pipeline builder to chain them together — into one
page, with a light/dark theme toggle. Everything runs client-side, in your own browser: your
documents are never uploaded to a server. Most free online "merge/split PDF" tools stop there; PDF
Power Suite goes further by bundling operations that are rarely both free *and* client-side in the
same place — offline OCR, a real word-level and pixel-level diff between two PDF versions,
mail-merge into fillable form fields, and heuristic table extraction — plus a way to chain any of
them into a repeatable pipeline.

---

## 🎯 COMPLETE PACKAGE

This package contains:
- **`pdf-power-suite.html`** — the application shell and UI (open this file to run the app)
- **`pdf-power-suite.js`** — core logic: utilities, tab navigation, Merge, Split, Compress, Watermark & Bates
- **`pdf-power-suite-diff.js`** — the Diff feature (text + visual)
- **`pdf-power-suite-table.js`** — the Table Extraction feature
- **`pdf-power-suite-mailmerge.js`** — the Mail Merge feature
- **`pdf-power-suite-ocr.js`** — the OCR feature
- **`pdf-power-suite-pages.js`** — the Pagine (page management) feature
- **`pdf-power-suite-images.js`** — the PDF → Immagini feature
- **`pdf-power-suite-pipeline.js`** — the Pipeline Builder
- **`LICENSE`** — MIT License
- **`README.md`** / **`README-IT.md`** — this documentation (English / Italian)

All eight `.js` files must stay in the same folder as the `.html` file — the page loads them with
plain relative `<script src="...">` tags.

---

## ✅ INSTALLATION (NONE REQUIRED!)

This is a **completely standalone** web app. You don't need to install:
- ❌ Python, Node.js or other programming languages
- ❌ Libraries or dependencies
- ❌ Additional software

Two ways to use it, both work equally well:

- **Locally, on your own computer** — just double-click `pdf-power-suite.html`; it opens in your
  default browser and every operation happens entirely in that browser tab.
- **Shared on a team/intranet server** — since it's a handful of static files, you can also drop
  the whole folder on any plain web server (or an internal file share, or a static host like
  GitHub Pages) so colleagues can reach it at a URL instead of each needing their own copy. No
  backend, no build step, no server-side language required.

**Just open the HTML file in your browser!**

---

## 🚀 HOW TO USE

### Opening the app
1. **Double-click** `pdf-power-suite.html` (or open its URL, if hosted on a server).
2. It opens in your default browser. Works with Chrome, Firefox, Safari, Edge (any modern,
   up-to-date browser).
3. The left-hand navigation lists all eleven operations as tabs; only one panel is shown at a time.

💡 **Note:** the page loads seven small libraries from CDNs over the internet each time you open
it, so you need a connection to load the page itself. After that, every tab except **OCR** never
touches the network again — see [Privacy & Security](#-privacy--security) below for the full
breakdown.

✅ **How to tell it loaded correctly:** if the sidebar shows a colored icon next to each of the
eleven tab names, the libraries loaded fine. If icons are missing or a tab's "Run" button never
enables after picking a file, check your connection and reload — see
[Troubleshooting](#-troubleshooting).

### 1. Merge
Combine several PDFs into one, in whatever order you choose.
1. Drop or select **multiple** PDF files in the upload area.
2. Reorder them with the ▲/▼ buttons on each row (or remove one with ✕).
3. Click **Merge & Download** — you get a single `merged.pdf`.

### 2. Split
Break one PDF into several.
1. Select a single PDF.
2. Choose **One PDF per page**, or **Custom page ranges** and type something like `1-3,4,7-9`
   (each comma-separated group becomes one output file — that example makes 3 files).
3. Click **Split & Download ZIP** — you get a ZIP with one PDF per page/range.

### 3. Compress
Shrink a PDF by rasterizing every page and re-encoding it as JPEG.
1. Select a single PDF.
2. Set the **Rasterize DPI** (72–300, default 150) and **JPEG quality** (0.05–1, default 0.75)
   sliders.
3. Click **Compress & Download**.

⚠️ This trades text-selectability for size: the output is a flat image per page, so text can no
longer be selected, searched, or copied. Use it for scans or when only the visual look matters.

### 4. Watermark & Bates Numbering
Stamp a text watermark and/or sequential page numbers onto every page.
1. Select a single PDF.
2. Open the **Watermark** section: enable it, set the text, rotation angle, opacity, font size and
   corner/center position.
3. Open the **Bates numbering** section: enable it, set a prefix/suffix, starting number, digit
   padding, and position.
4. You can enable either, both, or use their independent defaults. Click **Apply & Download**.

### 5. OCR → Searchable PDF
Recognize text in a scanned/image PDF and embed it as an invisible, selectable text layer.
1. Select a single scanned PDF (up to 50 pages per run — OCR is CPU-heavy).
2. Pick one or both languages (**English**, **Italian**).
3. Optionally raise the **rasterize scale** (higher = more accurate, slower).
4. Click **Run OCR & Download Searchable PDF**.

🌐 **This is the one feature that needs the internet beyond the initial page load** — see
[Privacy & Security](#-privacy--security). The output PDF looks identical to the original scan,
but its text can now be selected, copied and found with Ctrl/Cmd+F. See
[Technical limits](#-technical-limits) for what "searchable" precisely means here.

### 6. Diff (compare two PDF versions)
Compare a "before" and "after" PDF two ways.
1. Upload PDF A (before) and PDF B (after).
2. Choose **Text diff (word-level)** — additions shown in green, removals in red-strikethrough,
   page by page — or **Visual diff (pixel heatmap)** — both pages rendered to canvases with a
   red heatmap showing per-pixel differences, which catches layout-only changes (moved images,
   font substitutions) that a text diff would miss.
3. Click **Compare**. If the two PDFs have different page counts, a banner says so and the tool
   compares only the pages that exist in both.

### 7. Table Extraction
Turn a simple grid-like table on a page into a CSV.
1. Select a single PDF and, optionally, a page range (blank = all pages).
2. Tune the **row tolerance** (how close two text runs' Y-coordinates must be to count as the same
   row) and **column gap threshold** (how wide an X-gap must be to start a new column) sliders.
3. Click **Extract & Preview**, check the preview table(s), adjust the sliders and re-run if rows
   or columns look wrong, then **Download CSV**.

This is a best-effort heuristic, not a table-recognition model — see
[Technical limits](#-technical-limits).

### 8. Mail Merge (CSV → filled PDF forms)
Fill one copy of a PDF form per row of a spreadsheet.
1. Upload a PDF that has AcroForm fields, and a CSV or XLSX file where each row is one output
   document.
2. Check the **field matching preview**: it shows how many form fields matched a data column by
   name (case-insensitively), and lists any that didn't match on either side.
3. Optionally tick **Flatten filled forms** to make the output non-editable, and optionally name a
   CSV column to use for output filenames (otherwise files are auto-numbered).
4. Click **Generate & Download ZIP** — you get one filled PDF per row, zipped together, plus a
   report of any fields that were skipped.

### 9. Pipeline Builder
Chain operations so each step's output feeds the next step's input.
1. Upload the starting PDF.
2. Pick a step type (**Merge**, **Compress**, **Watermark**, **Bates numbering**, or **OCR**) and
   click **Add step**; configure it inline, then add more steps and reorder them with ▲/▼. Split
   and PDF → Immagini aren't included because they produce multiple output files per run, Diff /
   Table Extraction / Mail Merge take a second non-PDF input, and Pagine's interactive
   drag/rotate/delete editing doesn't reduce to a scriptable step.
3. Click **Run Pipeline & Download** to execute all steps in order with a progress indicator, or
   **Export JSON** to save the step list (settings only, not file contents) for later, or
   **Import JSON** to load one back in.
4. The **Cronologia** list shows your last 5 pipeline runs/exports — timestamp, step summary, and
   input/output file counts — each with a one-click **Load** button to bring those settings back
   into the step list. A loaded Merge step needs its extra files re-attached, since file contents
   aren't part of a saved definition.

### 10. Pagine (Page Management)
Reorder, rotate, or delete individual pages of one PDF.
1. Select a single PDF; a thumbnail grid of every page appears.
2. **Drag** a page tile to move it to a new position.
3. Use each tile's buttons to **rotate** that page 90° left/right (repeatable up to 270°) or
   **delete** it.
4. Click **Export & Download** to rebuild the PDF in the new order with the chosen rotations
   applied, or **Reset order/rotation** to start over from the original file without re-uploading.

### 11. PDF → Immagini
Rasterize a page range and export each page as a standalone image (distinct from Compress, whose
output is a smaller PDF, not image files).
1. Select a single PDF and, optionally, a page range (blank = all pages).
2. Choose **PNG** or **JPEG**, and set the **DPI** slider (and, for JPEG, the **quality** slider).
3. Click **Rasterize** to render every selected page and preview it as a thumbnail.
4. Download images **individually** from each thumbnail, or click **Download all as ZIP** for every
   rasterized page at once.

---

## 📊 TECHNICAL LIMITS

### General
- **100 MB per uploaded file**, enforced before reading it.
- **500 pages** per document for merge/split/compress/watermark output — uploading something
  larger is rejected up front with a clear message instead of freezing the tab.
- **OCR is capped at 50 pages per run** (recognition is CPU-heavy); split a larger scan first.
- **Mail merge is capped at 2,000 rows per run.**

### OCR outcome — read this before relying on it
PDF Power Suite ships the **real searchable-PDF outcome**, not the simpler "export as .txt"
fallback: recognized words are drawn back onto each page as ordinary PDF text at `opacity: 0`,
positioned at each word's bounding box and sized from its height, so the result looks identical to
the scan but its text is selectable, copyable and findable with Ctrl/Cmd+F.

**Since v1.1**, each word's glyphs are also horizontally scaled (via a standard PDF content-stream
transformation matrix wrapped around the invisible text, anchored at the word's left edge) so the
invisible run's width matches its Tesseract bounding box, not just its position and height. This
was verified with a write/read round trip (built with pdf-lib, read back with pdf.js) confirming
the extracted text run's width matches exactly. The remaining honest limitation: rotated text and
badly mis-recognized words can still end up only approximately aligned. Search and "select all"
were already fully correct in v1.0 either way, since those only depend on text content and reading
order, never on exact glyph geometry.

### Table extraction
The row/column detection is a **heuristic**, clustering text runs by Y-coordinate into rows and
then splitting each row into columns wherever the X-gap between runs exceeds a threshold. It has
no concept of table borders or merged cells, works best on simple, clearly-aligned grids, and can
mis-detect columns on multi-line cells or unusual layouts. Both thresholds are adjustable sliders —
tune and re-run if the first pass looks wrong.

### Diff
Text diff compares pages by matching index (page 1 to page 1, etc). If a page was inserted or
removed partway through one of the documents, everything after that point will show as one large
diff — this tool does not attempt to re-align shifted pages. Visual diff renders both pages at the
same target width before comparing pixels; if the two PDFs use very different page sizes, the
heatmap will show much of the page as "different" simply from the scaling.

---

## 🎯 FEATURES

✅ **No installation** — just open the HTML file
✅ **Eleven PDF operations in one page** — merge, split, page management, compress, PDF → images,
watermark & Bates, OCR, diff, table extraction, mail merge, pipeline builder
✅ **Offline after first load**, except OCR (see Privacy & Security)
✅ **Multi-platform** — Windows, Mac, Linux, Android, iOS
✅ **Real searchable-PDF OCR output** — invisible text layer with glyph-width–matched positioning,
not just a .txt export
✅ **Word-level and pixel-level PDF diffing** in one tool
✅ **Drag-to-reorder page management** — rotate and delete pages in a visual thumbnail grid
✅ **CSV/XLSX mail merge into real AcroForm fields**, with a skip report and optional flattening
✅ **Pipeline builder** with JSON export/import and a visible, one-click-reload history of your
last 5 runs/exports
✅ **ZIP download** for every multi-file output (split, PDF → images, mail merge)
✅ **Drag & drop** on every upload area
✅ **Light and dark themes** — follows your system preference by default, with a manual toggle that
remembers your choice
✅ **Responsive design** — left-nav collapses to a horizontal scroller on narrow screens
✅ **Keyboard-accessible** — visible focus rings, labeled controls, `aria-current` on the active tab
✅ **Vector icons** — Lucide Icons, pinned version
✅ **Blue accent palette** — same visual language as the rest of this tool suite, now driven by a
shared set of CSS custom properties for both themes

---

## 💻 SYSTEM REQUIREMENTS

### Supported browsers
- ✅ Chrome 90+ (recommended)
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### Operating system
- ✅ Windows 10/11
- ✅ macOS 10.15+
- ✅ Linux (Ubuntu, Debian, Fedora, etc.)
- ✅ Android 9+ (Chrome Mobile)
- ✅ iOS/iPadOS 14+ (Safari)

### Minimum resources
- **RAM:** 4 GB (8 GB recommended for OCR or Compress on large documents — rasterizing pages at
  higher DPI/scale is memory-hungry)
- **Disk space:** 100 MB free for downloaded output plus, for OCR, roughly 10–15 MB per language
  the browser caches after the first run
- **Internet connection:** required to load the page itself, and required again every time you use
  the OCR tab (see below); every other tab works fully offline once the page has loaded

---

## 🔧 TROUBLESHOOTING

### HTML file doesn't open in the browser
1. Right-click on `pdf-power-suite.html`.
2. Select "Open with".
3. Choose your browser (Chrome recommended).

### A tab's "Run" button stays disabled after picking a file
**Cause:** the file wasn't recognized as a PDF (wrong extension/type), or it's over the 100 MB
limit.
**Solution:** confirm the file is a genuine `.pdf`, and check the on-screen error message for the
specific reason.

### Icons don't show up / a tab's "Run" button never becomes usable even with a valid file
**Cause:** one of the CDN libraries didn't load (no internet on first load, or a corporate
firewall blocking the CDN hosts).
**Solution:** check your connection, reload (F5 / Cmd+R), and confirm the page can reach
`cdnjs.cloudflare.com`, `cdn.sheetjs.com`, `cdn.jsdelivr.net` and `unpkg.com`. Tabs that don't need
the library that failed to load (e.g. Merge/Split/Watermark don't need pdf.js) still work even if
one CDN is unreachable.

### OCR fails with a network-looking error
**Cause:** Tesseract.js could not reach its CDN to download the OCR engine, WASM core or language
data. This is the one feature that needs the network beyond the initial page load.
**Solution:** check your connection and try again; once a language's data has been downloaded
once, the browser caches it and subsequent runs are faster and need less data.

### "This document has N pages, which is over the 500-page limit"
**Cause:** the size/page limits described in [Technical limits](#-technical-limits) exist to avoid
freezing the browser tab.
**Solution:** split the document into smaller pieces first (use the Split tab), or process it in
batches.

### Mail merge skipped some fields
**Cause:** a form field's name doesn't match any CSV/XLSX column (or vice versa), or a field isn't
a plain text field (checkbox/radio/dropdown aren't filled by this tool).
**Solution:** check the **field matching preview** and the **skip report** shown after the run;
rename your spreadsheet columns to match the PDF's field names (case doesn't matter) and re-run.

### Browser feels slow with large PDFs
**Cause:** rasterizing pages (Compress, OCR) or rendering canvases (Diff visual mode, Compress) is
memory- and CPU-intensive.
**Solution:** lower the DPI/scale slider, process fewer pages at a time, close other tabs to free
RAM, and prefer Chrome or Firefox.

### ZIP file is too large to download
**Solution:** most browsers cap downloads around 2 GB. Split the input into smaller batches (fewer
pages for Split, fewer rows for Mail Merge) and run them separately.

---

## 🔒 PRIVACY & SECURITY

✅ **All data stays on your computer**, with one documented exception (OCR, below)
✅ **No files uploaded to a server as part of using this tool**
✅ **No tracking or analytics**
✅ **No account required**
✅ **Open source** — you can inspect the code, it's plain HTML/CSS/JavaScript

### The OCR exception, precisely
Recognizing text runs the Tesseract.js engine **in your browser**, but Tesseract.js needs its
worker script, WASM core, and per-language training data (~10–15 MB per language) which it
downloads from a CDN (`cdn.jsdelivr.net`) the first time you use a given language. Your PDF's
*content* is never uploaded anywhere — only the OCR engine's own assets are fetched, the
recognition itself runs locally. Every other tab in this tool never contacts any server after the
page has finished loading.

### Hardening applied
- **No `innerHTML` / inline `onclick` with file-derived data** — every value that comes out of an
  uploaded file (filenames, form-field names, CSV cell values, OCR text, table cells, diff text)
  is written to the page with `textContent` only; DOM nodes are built with
  `createElement`/`addEventListener`. A malicious PDF, CSV or XLSX cannot run script in your
  browser through this tool.
- **Sanitized filenames** — every filename used for a download or a ZIP entry (merge/split output,
  mail-merge output, table CSV) is stripped of path separators and control characters before use,
  and duplicate names are de-duplicated instead of silently overwriting each other in a ZIP.
- **Content-Security-Policy** — the page ships a strict CSP: `default-src 'none'`; scripts are
  limited to `'self'` (this tool's own `.js` files, loaded as plain files, so no inline-script hash
  is needed) plus the exact CDN origins used (`cdnjs.cloudflare.com`, `cdn.sheetjs.com`,
  `cdn.jsdelivr.net`, `unpkg.com`); `img-src` allows `data:`/`blob:` only, for canvas-rendered
  page previews; `connect-src` and `worker-src` allow `cdn.jsdelivr.net` specifically because
  Tesseract.js fetches its worker/core/language-data from there at OCR run time, and `worker-src`
  allows `cdnjs.cloudflare.com` and `blob:` because pdf.js loads its own worker script from cdnjs
  and spins it up via a blob URL; `base-uri` and `form-action` are both disabled entirely.
- **Form data validated through pdf-lib's text APIs only** — mail-merge field values from the
  CSV/XLSX are passed to `TextField.setText()`; they are never interpolated into HTML or any
  string that gets parsed as markup or script.
- **Size and page-count limits** — see [Technical limits](#-technical-limits); files or documents
  over the limits are rejected up front with a clear message instead of freezing the tab.
- **Pinned dependencies** — every CDN library (pdf-lib, pdf.js, JSZip, SheetJS, jsdiff, Tesseract.js,
  Lucide) is loaded at an exact version, never `@latest`, so none of them can change under you
  without notice.
- **All JavaScript in external files** — every `.js` file is loaded via a plain
  `<script src="...">` tag (not inlined in the HTML), which is what lets the CSP above use a
  simple `script-src 'self' ...` instead of a fragile inline-script hash.
- **`localStorage` stays on this device** — your light/dark theme choice and the Pipeline Builder's
  last-5 run/export history (step types and settings only, never file contents) are saved in this
  browser's `localStorage`, scoped to this page's own origin. Nothing in `localStorage` is ever
  transmitted anywhere; it just lets those two small preferences survive a reload.

---

## 💾 SHARING

You can share the entire folder with colleagues:
1. Copy all files (the `.html`, all eight `.js` files, `LICENSE`) to a USB drive or shared folder.
2. Or share via email/WeTransfer/Google Drive as a single ZIP of the folder.
3. Recipients just need to open `pdf-power-suite.html` — the other files must stay alongside it.

**No installation required for recipients!**

---

## 📝 CHANGELOG

### Version 1.1 — Consistency, Dark Mode &amp; New Features
- 🎨 **Design-system tokens shared across the whole Utility Forge suite** — every color in the page
  now comes from a small set of CSS custom properties (`--uf-*`) instead of hardcoded hex values,
  so this tool is now visually identical to the other five tools in the suite.
- 🌗 **Light/dark theme toggle** — follows your OS preference by default; the toggle button in the
  header remembers an explicit choice in `localStorage` and applies it before first paint (no
  flash of the wrong theme). Rendered PDF page content itself is never recolored — only the UI
  chrome around it switches themes.
- 🆕 **New tab: Pagine (Page Management)** — reorder pages by dragging thumbnails, rotate
  individual pages 90°/180°/270°, delete pages, and export the result — all on one PDF, no need to
  route through Split + Merge for a simple reorder.
- 🆕 **New tab: PDF → Immagini** — rasterize a page range and export PNG or JPEG images, one file
  per page, downloadable individually or as a ZIP. Distinct from Compress, whose output stays a
  (smaller) PDF rather than becoming image files.
- 🎯 **More accurate OCR text alignment** — invisible OCR text is now horizontally scaled to match
  each word's exact Tesseract bounding-box width (previously only position and height were
  matched), so selection boxes track the visible word more closely. Verified with a write/read
  round trip confirming the extracted text run's width matches exactly. See
  [Technical limits → OCR outcome](#-technical-limits) for the remaining honest caveats.
- 📜 **Visible Pipeline Builder history** — the last 5 runs/exports are now shown as a readable
  list (timestamp, step summary, input/output file counts) with a one-click **Load** button,
  instead of only a plain dropdown.
- ♿ **Accessibility pass** — visible focus rings on every interactive element, `aria-label` on
  every icon-only button, `<label for>` correctly paired with its input throughout, `aria-current`
  on the active tab, and `role="status" aria-live="polite"` on success/error messages so screen
  readers announce them.
- ⏱️ Alert auto-hide timing standardized: success/info messages clear after 6s, error/warning
  messages stay for 8s (previously errors never auto-hid).
- 📱 Responsive breakpoint standardized to 680px to match the rest of the suite (the sidenav-to-top-nav
  collapse keeps its own slightly wider 780px breakpoint, since 680px is too narrow for a
  comfortable horizontal tab scroller).

### Version 1.0
- 🎉 First release
- ✅ Merge, Split, Compress, Watermark & Bates numbering
- ✅ OCR to searchable PDF (invisible text layer), English + Italian
- ✅ Diff between two PDF versions: word-level text diff and pixel-heatmap visual diff
- ✅ Heuristic table extraction to CSV with adjustable row/column tolerance
- ✅ CSV/XLSX mail merge into AcroForm PDF fields, with flatten option and skip reporting
- ✅ Pipeline builder with JSON export/import and a 5-item local-storage recall list
- 🔒 Strict Content-Security-Policy, sanitized filenames, `textContent`-only DOM rendering
- 🔒 All CDN dependencies pinned to exact versions

---

## 🆘 SUPPORT

For issues, questions or suggestions, please open an issue on GitHub.

---

## 📜 LICENSE

MIT License - see [LICENSE](LICENSE) file for details.

Copyright (c) 2026 Chiara Berti 13

---

**PDF Power Suite v1.0**
By Chiara Berti - 2026
