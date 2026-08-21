# 📦 EPS Barcode Generator

> 🇬🇧 **English** | 🇮🇹 [Italiano](README-IT.md)

A single self-contained HTML page that turns an Excel/CSV list of article codes and barcodes into
ready-to-print **EAN-13 barcodes in vector EPS format** — in bulk, with a one-click ZIP download.
Everything runs client-side, in your own browser: no upload, no server, no account, and the input
spreadsheet never leaves your machine. Designed for graphic/prepress workflows (Adobe Illustrator,
CorelDRAW, Inkscape) where you need dozens or hundreds of print-ready barcode files at once instead
of generating them one by one.

---

## 🎯 COMPLETE PACKAGE

This package contains:
- **`barcode-eps-wizard.html`** - The complete web application (this is the only file you need to run it)
- **`example.xlsx`** - Sample Excel file with correct structure
- **`LICENSE`** - MIT License
- **`README.md`** / **`README-IT.md`** - This documentation (English / Italian)

---

## ✅ INSTALLATION (NONE REQUIRED!)

This is a **completely standalone** web app. You don't need to install:
- ❌ Python, Node.js or other programming languages
- ❌ Libraries or dependencies
- ❌ Additional software

Two ways to use it, both work equally well:

- **Locally, on your own computer** — just double-click `barcode-eps-wizard.html`; it opens in
  your default browser and everything (Excel parsing, EPS generation, ZIP packaging) happens
  entirely in that browser tab.
- **Shared on a team/intranet server** — since it's a single static HTML file, you can also drop
  it on any plain web server (or an internal file share, or a static host like GitHub Pages) so
  colleagues can reach it at a URL instead of each needing their own copy. No backend, no build
  step, no server-side language required.

**Just open the HTML file in your browser!**

---

## 🚀 HOW TO USE IN 3 STEPS

### Step 1: Open the application
1. **Double-click** on `barcode-eps-wizard.html` (or open its URL, if hosted on a server)
2. It will automatically open in your default browser
3. Works with: Chrome, Firefox, Safari, Edge (any modern, up-to-date browser)

💡 **Note:** the page loads three small libraries (Excel parsing, ZIP creation, icons) from a CDN
over the internet each time you open it, so you do need a connection to load the page itself. The
processing that happens *after* it has loaded — reading your Excel file and generating the EPS
barcodes — never sends anything back over the network.

✅ **How to tell it loaded correctly:** if you see the barcode icon and the upload area with its
icon in the top-left, the libraries loaded fine. If the layout looks unstyled or icons are
missing, check your connection and reload — see the "Troubleshooting" section further down if it
persists.

### Step 2: Prepare your Excel file
Use `example.xlsx` as an example. The structure must be:

```
| Codice articolo | Barcode        |
|-----------------|----------------|
| CODE01          | 9090171029796  |
| CODE02          | 9090171029802  |
| CODE03          | 9090171029819  |
```

**Requirements:**
- Two columns: `Codice articolo` and `Barcode` (exact names, case-sensitive)
- Barcodes must be **12-digit** numbers (EAN-13 without check digit) or **13-digit** (complete EAN-13)
- File format: `.xlsx` or `.xls` or `.csv`

### Step 3: Generate barcodes
1. **Drag** the Excel file into the upload area (or click to select it)
2. Click **"Genera Barcode EPS"** (Generate Barcode EPS)
3. Wait for completion (you'll see the progress bar)
4. Download files:
   - **Individually**: click "Scarica" (Download) on each barcode in the list
   - **All at once**: click "Scarica tutti" (Download all) to get a `.zip` file

---

## 📊 TECHNICAL LIMITS

### Maximum number of barcodes

**Hard limit: 5,000 rows per file** (enforced by the app, to avoid freezing the browser tab).
Uploading a spreadsheet with more rows is rejected up front with a clear error message — split it
into multiple files instead. The app also rejects source files over 20 MB before reading them.

The limit depends on:
- **Available RAM** - Each barcode takes ~5-10 KB in memory
- **Browser capacity** - Chrome/Firefox handle large quantities better
- **Operating system** - Desktop has more resources than mobile

**Practical recommendations:**
- ✅ **< 1,000 barcodes** - No problem, fast generation
- ⚠️ **1,000 - 5,000 barcodes** - Works well, may take 10-30 seconds

### ZIP file

The generated ZIP file contains all compressed barcodes. Approximate size:
- 100 barcodes ≈ 0.5 MB
- 1,000 barcodes ≈ 5 MB  
- 5,000 barcodes ≈ 25 MB
- 10,000 barcodes ≈ 50 MB

**Note:** Browser may request confirmation to download ZIP files > 100 MB.

---

## 🎯 FEATURES

✅ **No installation** - just open the HTML file  
✅ **Works offline** - after first load  
✅ **Multi-platform** - Windows, Mac, Linux, Android, iOS  
✅ **True EPS files** - PostScript format compatible with Adobe Illustrator  
✅ **ZIP download** - all barcodes in a single compressed file  
✅ **Drag & Drop** - intuitive interface  
✅ **Real-time preview** - see barcodes as they're generated  
✅ **Live statistics** - total, successes, errors  
✅ **Responsive design** - adapts to desktop, tablet, smartphone  
✅ **Vector icons** - professional interface with Lucide Icons  
✅ **Blue color palette** - minimal and modern design  

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
- **RAM:** 2 GB (4 GB recommended for > 1,000 barcodes)
- **Disk space:** 100 MB free for generated files
- **Internet connection:** Only for first load

---

## 🔧 TROUBLESHOOTING

### HTML file doesn't open in browser
**Solution:**
1. Right-click on `barcode-eps-wizard.html`
2. Select "Open with"
3. Choose your browser (Chrome recommended)

### Icons don't show up
**Cause:** Internet connection issue  
**Solution:**
1. Check your connection
2. Reload the page (F5 or Cmd+R)
3. App works anyway even without icons

### Error "Code must have 12 or 13 digits"
**Cause:** Invalid barcode in Excel file  
**Solution:**
1. Verify all barcodes have 12 or 13 digits
2. Remove spaces, dots or other characters
3. Make sure they're numbers only

### Browser crashes with many barcodes
**Cause:** Too many barcodes, insufficient memory  
**Solution:**
1. Split Excel file into parts (e.g., 2,000 barcodes per file)
2. Generate barcodes in multiple sessions
3. Close other browser tabs to free RAM
4. Use Chrome or Firefox for better performance

### EPS files don't open in Illustrator
**Solution:**
1. Files are in pure PostScript format
2. In Illustrator: File → Open
3. Select "All files" in filter
4. Files are 100% vector

### ZIP file is too large
**Solution:**
1. Browser download limit is ~2 GB
2. If you exceed this, generate barcodes in groups
3. Download files individually instead of ZIP

---

## 📁 GENERATED FILE STRUCTURE

Each barcode is saved as:
```
CODE01.eps
CODE02.eps
CODE03.eps
...
```

ZIP file is named:
```
barcode_eps_1234567890.zip
```
(where `1234567890` is a unique timestamp)

---

## 🎨 EPS FILE TECHNICAL SPECIFICATIONS

- **Format:** PostScript (EPS) version 3.0
- **Encoding:** EAN-13 standard (ISO/IEC 15420)
- **Check digit:** Automatically calculated according to Modulo 10 algorithm
- **Quiet zone:** 10 modules (GS1 General Specifications compliant)
- **Bar height:** 50 points (≈ 17.6 mm)
- **Module width:** 1 point (≈ 0.35 mm)
- **Font:** Helvetica 11pt
- **Colors:** 100% Black (K) on white
- **BoundingBox:** Automatically calculated
- **Compatibility:** Adobe Illustrator, CorelDRAW, Inkscape, Affinity Designer

---

## 🔒 PRIVACY AND SECURITY

✅ **All data stays on your computer**  
✅ **No files uploaded to external servers**  
✅ **No tracking or analytics**  
✅ **No account required**  
✅ **Open source** - you can inspect the code

The application processes files entirely in the local browser. No information is transmitted over the internet.

**Hardening applied in this version:**
- **Strict barcode validation** — a barcode is only accepted if it is 12 or 13 digits. This closes
  off a PostScript-injection vector: without it, a crafted spreadsheet cell (parentheses,
  backslashes, PostScript operators) could have been embedded verbatim into the generated `.eps`
  file and executed by whatever tool later opens/rasterizes it.
- **XSS-safe rendering** — every value read from the uploaded spreadsheet (article code, barcode,
  error messages) is written to the page with `textContent`, never `innerHTML` or an inline
  `onclick` string. A malicious cell content can no longer run script in your browser.
- **Sanitized filenames** — the article code is stripped of path separators and control characters
  before being used as a filename or as a ZIP entry, and duplicate codes are automatically
  de-duplicated instead of silently overwriting each other in the ZIP.
- **Content-Security-Policy** — the page ships a strict CSP: only the exact three CDN scripts and
  this page's own script (identified by SHA-256 hash) are allowed to run; everything else is
  denied by default.
- **Size limits** — files over 20 MB or spreadsheets with more than 5,000 rows are rejected up
  front with a clear message, instead of freezing the browser tab.
- **Pinned dependency** — the Lucide icons library is now loaded from a fixed version instead of
  `@latest`, so its code can no longer change under you without notice.

---

## 💾 SHARING

You can share the entire folder with colleagues:
1. Copy all files to a USB drive
2. Or share via email/WeTransfer/Google Drive
3. Recipients just need to open `barcode-eps-wizard.html`

**No installation required for recipients!**

---

## 📝 CHANGELOG

### Version 2.1 (Current) — Hardened Edition
- 🔒 Strict digit-only barcode validation (blocks PostScript injection into the EPS output)
- 🔒 XSS-safe DOM rendering (no more `innerHTML`/`onclick` with data from the spreadsheet)
- 🔒 Sanitized, de-duplicated filenames for downloads and ZIP entries
- 🔒 Strict Content-Security-Policy (hash-pinned inline script, whitelisted CDN origins)
- 🔒 Lucide icons pinned to a fixed version instead of `@latest`
- ✨ File-size (20 MB) and row-count (5,000) limits, with clear error messages

### Version 2.0
- ✨ New minimal design inspired by Lucide
- ✨ Professional vector icons
- ✨ Blue color palette
- ✨ **ZIP download** for all barcodes
- ✨ Responsive interface for mobile
- ✨ Improved alerts with icons
- ✨ Progress bar with counter
- 🐛 Fixed bugs with Excel number formatting

### Version 1.0
- 🎉 First release
- ✅ EPS barcode generation
- ✅ Excel/CSV support
- ✅ Individual downloads

---

## 🆘 SUPPORT

For issues, questions or suggestions, please open an issue on GitHub.

---

## 📜 LICENSE

MIT License - see [LICENSE](LICENSE) file for details.

Copyright (c) 2026 Chiara Berti 13

---

**EPS Barcode Generator v2.0 (Minimalist Edition)**  
By Chiara Berti - 2026

