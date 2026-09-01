<p align="center">
  <img src="assets/banner.svg" alt="Utility-Forge" width="100%">
</p>

<p align="center"><a href="README.md">English</a> · <a href="README.it.md">Italiano</a></p>

<p align="center">
  <img src="https://img.shields.io/badge/status-active-F2C94C?style=flat-square" alt="Project status: active">
  <img src="https://img.shields.io/badge/category-AUTOMATION-22D3EE?style=flat-square" alt="AUTOMATION">
  <img src="https://img.shields.io/badge/stack-JavaScript-8B949E?style=flat-square" alt="JavaScript">
  <img src="https://img.shields.io/badge/languages-EN%20%7C%20IT-8B5CF6?style=flat-square" alt="English and Italian">
  <img src="https://img.shields.io/badge/licence-MIT-2EA043?style=flat-square" alt="MIT">
</p>

> A curated collection of standalone, privacy-first tools for documents, files and everyday automation.

<p align="center"><a href="https://github.com/chiaraberti13/Utility-Forge/issues">Report an issue</a> · <a href="https://github.com/chiaraberti13/Utility-Forge">Repository</a></p>

---

## Quick Navigation

- **[Tools](#tools)** — What's in the collection right now: what each tool does, what
  it's built with, and where it runs.
- **[Licence](#licence)** — MIT, for the whole repository and every tool folder in it.
- **[Adding a new tool](#adding-a-new-tool)** — How a new tool gets folded into this
  monorepo, and what the README needs to reflect it.

> [!TIP]
> **Have a tool idea?** Open an [issue](https://github.com/chiaraberti13/Utility-Forge/issues) — standalone and privacy-first is the only real requirement.

---

## What this is

Utility Forge is a **monorepo**: every tool below lives in its own folder, with its own
README and, where useful, its own notes — but the code itself lives right here, in this
repository. No hunting across separate repos to find a tool: clone this one and you have
everything.

The tools share a philosophy, not a stack:

- **Standalone** — no server-side account, no SaaS signup; usually a single file you
  can just open or drop onto a server.
- **Privacy-first** — data is processed locally (in the browser) or on your own
  server; nothing is sent to a third party.
- **Free and open-source**, under the MIT licence.

## Tools

| Tool | What it does | Stack | Runs on | Folder | Docs |
|---|---|---|---|---|---|
| 📦 **EPS Barcode Generator** | Generates EAN-13 barcodes in vector EPS format straight from an Excel/CSV list — bulk, with ZIP download. | Single-file HTML/JS | Browser only | [`barcode-eps-wizard/`](barcode-eps-wizard) | [README](barcode-eps-wizard/README.md) |
| 🖼️ **PHP Image Converter** | Converts images between JPG/PNG/WEBP/BMP/TIFF/GIF/HEIC, with resize, crop presets and batch ZIP export, via a web UI. | Single-file PHP + GD/ImageMagick | Your own server | [`php-image-converter/`](php-image-converter) | [README](php-image-converter/README.md) |
| 🕵️ **Privacy & Metadata Forensics Studio** | Inspects and selectively scrubs hidden metadata (EXIF/GPS, IPTC/XMP, PDF info fields and embedded-JS/attachment flags, Office tracked changes/comments/author fields) from images, PDFs and Office documents — batch mode, named profiles, exportable audit report. | HTML/JS (self-contained folder) | Browser only | [`privacy-metadata-scrubber/`](privacy-metadata-scrubber) | [README](privacy-metadata-scrubber/README.md) |
| ✂️ **Document Redaction & Sanitization Studio** | Real redaction, not a cosmetic black box: auto-detects PII (emails, IBANs, phone numbers, codice fiscale) for review, then rasterizes every page so no text remains extractable — and proves it by re-extracting text from the result. Also does true pixel-level image redaction. | HTML/JS (self-contained folder) | Browser only | [`document-redaction-studio/`](document-redaction-studio) | [README](document-redaction-studio/README.md) |
| 📚 **PDF Power Suite** | Merge, split, compress, watermark/Bates-number, OCR to searchable PDF, diff two versions (text + visual), extract tables to CSV, mail-merge a CSV into filled PDF forms — plus a chainable pipeline builder to run several of these in sequence. | HTML/JS (self-contained folder) | Browser only | [`pdf-power-suite/`](pdf-power-suite) | [README](pdf-power-suite/README.md) |
| 🗂️ **Batch Renamer & File Organizer Pro** | Renames files inside a real local folder in place — driven by an Excel/CSV name mapping or a placeholder template, with a mandatory preview (collision/invalid-character checks) and a downloadable rollback log. | HTML/JS (self-contained folder) | Browser only, Chromium-based (File System Access API) | [`batch-renamer-pro/`](batch-renamer-pro) | [README](batch-renamer-pro/README.md) |

Each folder is self-contained: open `barcode-eps-wizard/barcode-eps-wizard.html` directly
in a browser, or drop `php-image-converter/php-image-converter.php` on a PHP server —
nothing outside its own folder is required to run it. The four newer tools ship their
JavaScript as a plain sibling `.js` file instead of inlining it (so their
Content-Security-Policy needs no inline-script hash), but they're just as self-contained:
open the `.html` file and everything it needs is next to it. See each folder's own README
for full setup and usage instructions.

All six tools have been hardened against the injection/XSS/upload-abuse classes of bugs
that this kind of "give it your data, get a file back" tool is typically exposed to
(strict input validation, a Content-Security-Policy, sanitized filenames, size/count
limits, `textContent`-only DOM rendering — see each folder's own README for the specifics
that apply to it, including the honest limits of what each tool's hardening can and can't
guarantee).

## Licence

The whole repository, including every tool folder, is distributed under the **MIT
licence** — see [`LICENSE`](LICENSE) for the full text. You're free to use, study,
modify and redistribute it, including commercially, as long as the copyright notice is
kept; it's provided as-is, with no warranty.

## Adding a new tool

Whenever a new tool is added to this collection, this README is updated in the same
change — a new tool and a stale index don't ship separately. In practice, adding tool
number *n+1* means:

1. Create a new folder at the repository root, named after the tool.
2. Put the tool's files in it, including its own `README.md` with setup/usage
   instructions.
3. Add one row to the table above: name, one-line description, stack, where it runs,
   link to the folder.
4. Bump the `tools-N` badge at the top of this file to the new count.

---

<p align="center">
  <sub>Made with 🛠️ by <a href="https://github.com/chiaraberti13">chiaraberti13</a></sub>
</p>
