# 🕵️ Privacy & Metadata Forensics Studio

> 🇬🇧 **English** | 🇮🇹 [Italiano](README-IT.md)

A self-contained web app that inspects and lets you selectively scrub the hidden metadata carried
inside images (JPEG/PNG/WEBP), PDF documents, and Office Open XML files (.docx/.xlsx/.pptx) — GPS
coordinates, author names, edit history, PDF Info-dictionary fields, tracked changes, comments.
Everything runs client-side, in your own browser: nothing you upload is ever sent to a server. It
goes further than a typical free "strip EXIF" tool by first showing you exactly what it found, in
plain language, before you decide what to remove.

---

## 🎯 COMPLETE PACKAGE

This package contains:
- **`privacy-metadata-scrubber.html`** — the application shell and UI (open this file)
- **`privacy-metadata-scrubber.js`** — all of the application logic, loaded by the HTML file
- **`LICENSE`** — MIT License
- **`README.md`** / **`README-IT.md`** — this documentation (English / Italian)
- **`descrizione.md`** — Italian project write-up (portfolio/CV style)

Both `privacy-metadata-scrubber.html` and `privacy-metadata-scrubber.js` must stay in the same
folder — the HTML file loads the JS file by a plain relative path.

---

## ✅ INSTALLATION (NONE REQUIRED!)

This is a **completely standalone** web app. You don't need to install:
- ❌ Python, Node.js or other programming languages
- ❌ Libraries or dependencies
- ❌ Additional software

Two ways to use it, both work equally well:

- **Locally, on your own computer** — just double-click `privacy-metadata-scrubber.html`; it opens
  in your default browser and everything (parsing, scrubbing, ZIP packaging) happens entirely in
  that browser tab.
- **Shared on a team/intranet server** — since it's a static HTML file plus one JS file, you can
  also drop the folder on any plain web server (or an internal file share, or a static host like
  GitHub Pages) so colleagues can reach it at a URL instead of each needing their own copy. No
  backend, no build step, no server-side language required.

**Just open the HTML file in your browser!**

---

## 🚀 HOW TO USE

### Step 1: Open the application
1. **Double-click** on `privacy-metadata-scrubber.html` (or open its URL, if hosted on a server)
2. It will automatically open in your default browser
3. Works with: Chrome, Firefox, Safari, Edge (any modern, up-to-date browser)

💡 **Note:** the page loads four small libraries (image metadata parsing, PDF handling, ZIP
creation, icons) from a CDN over the internet each time you open it, so you do need a connection to
load the page itself. The processing that happens *after* it has loaded — reading and scrubbing
your files — never sends anything back over the network.

✅ **How to tell it loaded correctly:** if you see the shield icon in the header and the checkbox
list under "What to remove", the libraries loaded fine. If the layout looks unstyled or the
category list is empty, check your connection and reload — see "Troubleshooting" further down.

### Step 2: Choose what to remove
Under **"What to remove"**, tick the categories you want scrubbed:
- **GPS / location** (images)
- **Author / editor names** (images, PDF, Office)
- **PDF metadata fields** (Title, Subject, Keywords, Producer, dates)
- **Office comments & tracked changes** (.docx)

All four are checked by default. You can save your current selection as a **named profile** (top
of the page) and switch between saved profiles later — profiles are stored only in your browser's
local storage, on this device.

### Step 3: Add your files
**Drag** files into the upload area, or click it to open the file picker. You can select images,
PDFs and Office documents together in one batch. Anything else (or anything over the size/count
limits below) is rejected up front with a clear message, and valid files in the same batch are
still accepted.

### Step 4: Inspect
Click **"Inspect all"**, or expand a file card and click its own **"Inspect"** button, to see a
read-only report of exactly what metadata that file carries — no file is modified by this step.
GPS coordinates, if found, are shown as plain decimal numbers with an optional link you can click
to open the location in OpenStreetMap; the app itself never loads a map tile or contacts any
mapping service on your behalf.

### Step 5: Scrub
Click **"Scrub all"**, or a file's own **"Scrub"** button, to produce a **new** file with the
selected categories removed. The original file on your disk is never touched — a new, separate
file is generated for download. A file whose only found metadata doesn't match any category you
selected is skipped rather than needlessly re-encoded, and shows as "Skipped" in its status badge.

### Step 6: Download
- **Per file**: click "Download" on that file's card once it shows "Scrubbed".
- **Whole batch**: click **"Download ZIP of scrubbed files"** for a single `.zip` containing every
  scrubbed file plus `scrub_report.csv` and `scrub_report.json` summarizing the run.
- **Report only**: the "Report (CSV)" / "Report (JSON)" buttons export the same per-file summary
  (filename, categories found, categories removed, status) on its own, for every loaded file,
  scrubbed or not.

---

## 📊 TECHNICAL LIMITS

- **Per-file size limit: 50 MB.** Larger files are rejected up front with a clear message; other
  valid files in the same batch are still accepted.
- **Batch limit: 200 files.** Adding files that would push the total over 200 rejects the whole new
  selection with a message asking you to add fewer at a time.
- **Accepted types:** JPEG, PNG, WEBP images; `.pdf`; `.docx`, `.xlsx`, `.pptx`. Anything else
  (including old binary `.doc`/`.xls`/`.ppt`, `.rtf`, `.odt`, encrypted archives, etc.) is rejected
  with an explanatory message rather than silently ignored.
- **Practical performance:** a few dozen small-to-medium files inspect and scrub in a few seconds.
  Very large batches (close to the 200-file / 50MB-per-file ceiling) will take longer and use more
  memory, since everything happens in your browser tab rather than on a server.

---

## 🎯 FEATURES

✅ **No installation** — just open the HTML file
✅ **Read-only Inspect step** before any destructive action
✅ **Selective scrubbing** by category, not all-or-nothing
✅ **Named profiles** saved locally, so you can reuse a scrub configuration
✅ **Batch processing** with a single ZIP download plus CSV/JSON summary report
✅ **Drag & drop** and per-file or per-batch actions
✅ **GPS shown as text only** — no automatic map tile loading, ever
✅ **Multi-platform** — Windows, Mac, Linux, Android, iOS
✅ **Responsive design** — adapts from desktop down to phone width
✅ **Honest limits documented** — see Privacy & Security below for exactly what is and isn't
   guaranteed

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
- **RAM:** 4 GB recommended, more for large batches near the 200-file/50MB ceiling
- **Internet connection:** only needed to load the page itself (the four CDN libraries)

---

## 🔧 TROUBLESHOOTING

### HTML file doesn't open in browser
1. Right-click on `privacy-metadata-scrubber.html`
2. Select "Open with"
3. Choose your browser (Chrome recommended)

### Icons or checkboxes don't show up / page looks unstyled
**Cause:** one of the four CDN libraries failed to load (connection issue).
**Solution:**
1. Check your internet connection
2. Reload the page (F5 or Cmd+R)
3. If your network blocks `cdn.jsdelivr.net`, `cdnjs.cloudflare.com` or `unpkg.com`, ask your
   network administrator to allow them — the app cannot substitute another source, by design (see
   the CSP note below).

### "unsupported type" rejection for a file I expected to work
Only JPEG/PNG/WEBP images, `.pdf`, and `.docx`/`.xlsx`/`.pptx` are accepted. Older binary Office
formats (`.doc`, `.xls`, `.ppt`) and other document formats are not Office Open XML ZIP containers
and are out of scope for this tool.

### "Could not parse this PDF (it may be encrypted or malformed)"
Password-protected/encrypted PDFs, and some very unusual or corrupted PDF structures, cannot be
parsed by the pdf-lib library this tool relies on. Remove the password with your PDF viewer first,
then retry.

### A .docx/.xlsx/.pptx fails to open after scrubbing
This tool rebuilds the ZIP container and rewrites a small number of XML parts. If a file was
already unusual (e.g. corrupted before you started, or produced by non-standard software), the
rebuild can occasionally break it. Keep your original file until you've confirmed the scrubbed copy
opens correctly in Word/Excel/PowerPoint.

### Scrubbed image colors look very slightly different
This is expected for images that carried an embedded ICC color profile (common on wide-gamut/
professional photos) — see "ICC color profile" under Privacy & Security below.

### Browser slows down with a very large batch
1. Split the batch into smaller groups
2. Close other browser tabs to free memory
3. Use a desktop browser rather than a mobile one for large batches

---

## 🔒 PRIVACY & SECURITY

✅ **All data stays on your computer** — every parse and every scrub runs in your browser tab
✅ **No files are uploaded to any server** — this tool has no backend at all
✅ **No tracking or analytics**
✅ **No account required**
✅ **Open source** — you can read every line in `privacy-metadata-scrubber.js`

This section documents, precisely and without overclaiming, what is actually hardened and what the
real limits of each scrub operation are.

**GPS handling.** When GPS coordinates are found in an image, they are shown as plain decimal
latitude/longitude text. The app never fetches a map tile image or calls any mapping API on your
behalf — the only way to see the location on a map is an explicit `<a target="_blank">` link to
OpenStreetMap that **you** must click yourself, which then opens in your own browser using your own
network connection, not this page's.

**Image scrubbing (canvas re-encode).** Images are scrubbed by drawing the decoded pixels onto an
in-memory `<canvas>` at their original dimensions and re-exporting via `canvas.toBlob()` (JPEG at
quality 0.92; PNG losslessly; WEBP at the canvas API's highest quality setting). Re-encoding this
way inherently drops every EXIF/IPTC/XMP metadata block, because none of it is part of the pixel
data the canvas carries forward. **Side effect, stated plainly:** this also removes the embedded
ICC color profile, since canvas export carries no color profile at all. On most consumer photos
this is invisible; on wide-gamut/professional images it can cause a very slight, usually
imperceptible color shift. For WEBP specifically, `canvas.toBlob()`'s "quality 1.0" is high-quality
but is not a guaranteed bit-for-bit *lossless* WEBP re-encode across all browsers (true lossless
WEBP needs an encoder mode the Canvas API does not expose) — convert to PNG first if you need
guaranteed-lossless output.

**PDF scrubbing (pdf-lib).** "Author / editor names" blanks the Author and Creator Info-dictionary
fields. "PDF metadata fields" blanks Title, Subject, Keywords and Producer, and — because pdf-lib
has no API to delete the CreationDate/ModificationDate keys outright — **overwrites** both dates
with a fixed placeholder (Unix epoch, 1970-01-01) rather than leaving your real dates in the file.
This is an overwrite, not a true removal of the key, and is documented here so nobody assumes
otherwise. **What this tool does NOT guarantee:** the raw byte-level scan shown in the Inspect
report counts literal occurrences of `/JavaScript`, `/JS`, `/EmbeddedFile` and `/OpenAction` in the
PDF bytes as a heuristic signal only — it is not a security scanner, can produce false positives
(e.g. those strings appearing inside ordinary text), cannot see inside compressed object streams,
and pdf-lib's rewrite-on-save process typically drops unreferenced objects but provides **no API
and no guarantee** that embedded JavaScript or file attachments are removed. Treat a PDF with
active content as needing a dedicated PDF sanitizer, not just this tool, if that matters for your
use case.

**Office document scrubbing (JSZip + DOMParser).** "Author / editor names" blanks the `dc:creator`
and `cp:lastModifiedBy` fields inside `docProps/core.xml`, keeping the XML structurally valid.
"Office comments & tracked changes" (docx only) removes every `word/comments*.xml` part it finds
plus the matching `[Content_Types].xml` overrides and `word/_rels/document.xml.rels` relationship
entries, and resolves tracked changes with "accept all changes" semantics: `<w:del>` elements
(deleted content) are removed entirely, and `<w:ins>` wrapper elements (inserted content) are
unwrapped so the inserted text is kept as ordinary final content. This tool only touches the XML
parts described above — it does not scan headers/footers, embedded objects, or macros for
additional identity information.

**Rendering safety.** Every value read from an uploaded file (EXIF tag values, PDF metadata
strings, Office XML field values, filenames, error messages) is written to the page using
`textContent` and DOM node creation — never `innerHTML` and never an inline `onclick` string built
from file-derived data — so a maliciously crafted file cannot inject script into the page.

**Filename safety.** Every filename this tool produces, for a single download or for a ZIP entry,
is stripped of `/ \ : * ? " < > |` and control characters before use, and duplicate names within
the same ZIP are automatically de-duplicated with a numeric suffix instead of silently overwriting
each other.

**Content-Security-Policy.** The page ships:
```
default-src 'none'; script-src 'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://unpkg.com; style-src 'unsafe-inline'; img-src data: blob:; connect-src 'self'; base-uri 'none'; form-action 'none'
```
All application logic lives in the separate `privacy-metadata-scrubber.js` file (loaded via `script-src 'self'`), so — unlike an older single-file pattern that needs a SHA-256 hash for an inline
script — there is no inline-script hash to keep in sync here. Only the three CDN origins that
actually serve a library are allowed to execute script; everything else is denied by default.
`img-src` allows `blob:`/`data:` only (needed for the canvas image-decode path), never a remote
origin, which is what keeps the "no map tile is ever fetched" guarantee structurally enforced
rather than just a promise in prose.

**Pinned dependencies.** All four CDN libraries are loaded at an exact pinned version (exifr
7.1.3, pdf-lib 1.17.1, JSZip 3.10.1, Lucide 0.469.0) rather than `@latest`, so their code cannot
change under you without notice.

---

## 💾 SHARING

You can share the whole folder with colleagues:
1. Copy `privacy-metadata-scrubber.html` and `privacy-metadata-scrubber.js` (they must stay
   together) to a USB drive, or the whole folder including LICENSE/README
2. Or share via email/WeTransfer/Google Drive
3. Recipients just need to open `privacy-metadata-scrubber.html`

**No installation required for recipients!**

---

## 📝 CHANGELOG

### Version 1.0
- 🎉 First release
- ✅ Inspect: EXIF/GPS/IPTC/XMP for images (exifr), PDF Info dictionary + heuristic byte scan
  (pdf-lib), Office core/app properties + tracked-changes/comments detection (JSZip + DOMParser)
- ✅ Scrub: canvas re-encode for images, selective Info-dictionary blanking for PDF, core.xml
  identity blanking + comments/tracked-changes resolution for Office documents
- ✅ Category checkboxes with named, locally-saved profiles
- ✅ Batch processing with ZIP output and CSV/JSON summary report
- 🔒 External JS file (no inline-script CSP hash needed), strict CSP, sanitized/de-duplicated
  filenames, `textContent`-only rendering, pinned CDN dependency versions
- ✅ Bilingual documentation (English / Italian)

---

## 🆘 SUPPORT

For issues, questions or suggestions, please open an issue on GitHub.

---

## 📜 LICENSE

MIT License - see [LICENSE](LICENSE) file for details.

Copyright (c) 2026 Chiara Berti 13

---

**Privacy & Metadata Forensics Studio v1.0**
By Chiara Berti - 2026
