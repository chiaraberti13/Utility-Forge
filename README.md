<p align="center">
  <img src="https://img.shields.io/badge/tools-2-blue" alt="Tools">
  <img src="https://img.shields.io/badge/license-MIT-lightgrey" alt="License: MIT">
  <img src="https://img.shields.io/badge/maintainer-chiaraberti13-informational" alt="Maintainer">
</p>

<h1 align="center">🛠️ Utility Forge</h1>

<p align="center">
  <b>A collection of standalone, privacy-first utility tools, in one repository.</b><br>
  <b>Una raccolta di tool di utilità standalone, orientati alla privacy, in un unico repository.</b>
</p>

<p align="center">
  🇬🇧 <a href="#english">English</a> · 🇮🇹 <a href="#italiano">Italiano</a>
</p>

---

## English

### What this is

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

### Tools

| Tool | What it does | Stack | Folder |
|---|---|---|---|
| 📦 **EPS Barcode Generator** | Generates EAN-13 barcodes in vector EPS format straight from an Excel/CSV list — bulk, with ZIP download. Runs entirely in the browser, no install. | Single-file HTML/JS | [`barcode-eps-wizard/`](barcode-eps-wizard) |
| 🖼️ **PHP Image Converter** | Converts images between JPG/PNG/WEBP/BMP/TIFF/GIF/HEIC, with resize, crop presets and batch ZIP export, via a web UI. Runs entirely on your own server. | Single-file PHP + GD/ImageMagick | [`php-image-converter/`](php-image-converter) |

Each folder is self-contained: open `barcode-eps-wizard/barcode-eps-wizard.html` directly
in a browser, or drop `php-image-converter/php-image-converter.php` on a PHP server —
nothing outside its own folder is required to run it. See each folder's own README for
full setup and usage instructions.

### Licence

The whole repository, including every tool folder, is distributed under the **MIT
licence** — see [`LICENSE`](LICENSE) for the full text. You're free to use, study,
modify and redistribute it, including commercially, as long as the copyright notice is
kept; it's provided as-is, with no warranty.

### Adding a new tool

Whenever a new tool is added to this collection, this README is updated in the same
change — a new tool and a stale index don't ship separately. In practice, adding tool
number *n+1* means:

1. Create a new folder at the repository root, named after the tool.
2. Put the tool's files in it, including its own `README.md` with setup/usage
   instructions.
3. Add one row to the table above: name, one-line description, stack, link to the
   folder.
4. Bump the `tools-N` badge at the top of this file to the new count.

---

## Italiano

### Cos'è

Utility Forge è un **monorepo**: ogni tool elencato qui sotto vive nella propria
cartella, con il proprio README ed eventuali note dedicate — ma il codice vero e proprio
sta qui, in questo repository. Niente più repo sparsi da cercare: si clona questo e c'è
tutto.

I tool condividono una filosofia, non uno stack:
- **Standalone** — nessun account lato server, nessuna registrazione SaaS; di solito
  un singolo file da aprire o caricare su un server.
- **Privacy-first** — i dati vengono elaborati in locale (nel browser) o sul proprio
  server; nulla viene inviato a terzi.
- **Gratuiti e open-source**, con licenza MIT.

### Tool disponibili

| Tool | Cosa fa | Stack | Cartella |
|---|---|---|---|
| 📦 **EPS Barcode Generator** | Genera barcode EAN-13 in formato vettoriale EPS direttamente da un elenco Excel/CSV — in massa, con download ZIP. Funziona interamente nel browser, senza installazione. | HTML/JS a file singolo | [`barcode-eps-wizard/`](barcode-eps-wizard) |
| 🖼️ **PHP Image Converter** | Converte immagini tra JPG/PNG/WEBP/BMP/TIFF/GIF/HEIC, con ridimensionamento, ritagli predefiniti ed export ZIP in batch, tramite interfaccia web. Funziona interamente sul proprio server. | PHP a file singolo + GD/ImageMagick | [`php-image-converter/`](php-image-converter) |

Ogni cartella è autonoma: si può aprire direttamente
`barcode-eps-wizard/barcode-eps-wizard.html` nel browser, oppure caricare
`php-image-converter/php-image-converter.php` su un server PHP — non serve nient'altro
al di fuori della propria cartella per farlo funzionare. Per le istruzioni complete di
installazione e uso vedi il README di ciascuna cartella.

### Licenza

L'intero repository, comprese tutte le cartelle dei tool, è distribuito con **licenza
MIT** — vedi [`LICENSE`](LICENSE) per il testo completo. Puoi usarlo, studiarlo,
modificarlo e ridistribuirlo liberamente, anche commercialmente, mantenendo l'avviso di
copyright; è fornito così com'è, senza alcuna garanzia.

### Aggiungere un nuovo tool

Ogni volta che un nuovo tool viene aggiunto a questa raccolta, questo README viene
aggiornato nella stessa modifica — un nuovo tool e un indice non aggiornato non vengono
mai pubblicati separatamente. In pratica, aggiungere il tool numero *n+1* significa:

1. Creare una nuova cartella nella radice del repository, con il nome del tool.
2. Inserirci i file del tool, incluso il proprio `README.md` con le istruzioni di
   installazione e uso.
3. Aggiungere una riga alla tabella qui sopra: nome, descrizione in una riga, stack,
   link alla cartella.
4. Aggiornare il badge `tools-N` in cima a questo file con il nuovo conteggio.
