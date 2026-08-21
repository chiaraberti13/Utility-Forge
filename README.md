# 🛠️ Utility Forge

<p align="center">
  <a href="README.md">🇬🇧 English</a> | <a href="README-IT.md">🇮🇹 Italiano</a>
</p>

<p align="center">
  <img src="assets/banner.svg" alt="Utility Forge" width="800">
</p>

A collection of standalone, privacy-first utility tools, in one repository. Every tool
is self-contained — open it and it just works, no account, no SaaS signup, no data
leaving your browser or your own server.

<p align="center">
  <a href="https://github.com/chiaraberti13/Utility-Forge/stargazers"><img src="https://img.shields.io/github/stars/chiaraberti13/Utility-Forge?style=for-the-badge&color=blue" alt="GitHub stars"></a>
  <a href="https://github.com/chiaraberti13/Utility-Forge/network/members"><img src="https://img.shields.io/github/forks/chiaraberti13/Utility-Forge?style=for-the-badge&color=blue" alt="GitHub forks"></a>
  <a href="https://github.com/chiaraberti13/Utility-Forge/issues"><img src="https://img.shields.io/github/issues/chiaraberti13/Utility-Forge?style=for-the-badge&color=orange" alt="Open issues"></a>
  <img src="https://img.shields.io/badge/tools-2-blue?style=for-the-badge" alt="2 tools">
  <a href="LICENSE"><img src="https://img.shields.io/github/license/chiaraberti13/Utility-Forge?style=for-the-badge&color=green" alt="License"></a>
</p>

<p align="center">
  <b>If you find these tools useful, consider supporting the project:</b><br><br>
  <a href="https://www.paypal.me/chiaraberti13"><img src="https://img.shields.io/badge/PayPal-Donate-00457C?style=for-the-badge&logo=paypal&logoColor=white" alt="PayPal Donate"></a>
</p>

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

Each folder is self-contained: open `barcode-eps-wizard/barcode-eps-wizard.html` directly
in a browser, or drop `php-image-converter/php-image-converter.php` on a PHP server —
nothing outside its own folder is required to run it. See each folder's own README for
full setup and usage instructions.

Both tools have been hardened against the injection/XSS/upload-abuse classes of bugs that
this kind of "paste your data in, get a file out" tool is typically exposed to (strict
input validation, CSRF protection, a Content-Security-Policy, sanitized filenames, size
limits — see each folder's own README for the specifics that apply to it).

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
