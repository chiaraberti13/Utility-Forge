<div align="center">
  <img src="assets/banner.svg" alt="Utility Forge" width="100%">

  <br><br>

  <a href="#english">
    <img src="https://img.shields.io/badge/🇬🇧_ENGLISH-4c1d95?style=for-the-badge&labelColor=1e1b4b" alt="English">
  </a>
  &nbsp;&nbsp;
  <a href="#italiano">
    <img src="https://img.shields.io/badge/🇮🇹_ITALIANO-047857?style=for-the-badge&labelColor=022c22" alt="Italiano">
  </a>

  <br><br>

  <img src="https://img.shields.io/github/stars/chiaraberti13/Utility-Forge?style=for-the-badge&color=fbbf24" alt="Stars">
  <img src="https://img.shields.io/github/forks/chiaraberti13/Utility-Forge?style=for-the-badge&color=3b82f6" alt="Forks">
  <img src="https://img.shields.io/github/issues/chiaraberti13/Utility-Forge?style=for-the-badge&color=d97706" alt="Issues">
  <img src="https://img.shields.io/github/license/chiaraberti13/Utility-Forge?style=for-the-badge&color=lightgrey" alt="License: MIT">
  <br>
  <img src="https://img.shields.io/badge/tools-2-blue?style=for-the-badge" alt="Tools">
  <img src="https://img.shields.io/badge/standalone-yes-success?style=for-the-badge" alt="Standalone">
  <img src="https://img.shields.io/badge/privacy--first-yes-success?style=for-the-badge" alt="Privacy-first">
  <img src="https://img.shields.io/badge/maintainer-chiaraberti13-informational?style=for-the-badge" alt="Maintainer">

  <br><br>

  <a href="https://www.paypal.me/chiaraberti13">
    <img src="https://img.shields.io/badge/PayPal-Donate-00457C?style=for-the-badge&logo=paypal&logoColor=white" alt="PayPal Donate">
  </a>
  <a href="https://github.com/chiaraberti13/Utility-Forge/stargazers">
    <img src="https://img.shields.io/badge/⭐-Star_this_repo-fbbf24?style=for-the-badge" alt="Star this repo">
  </a>
</div>

<br>

---

<a name="english"></a>
## 🇬🇧 English

<h1>🛠️ Utility Forge</h1>

**A collection of standalone, privacy-first utility tools, in one repository.**

**[📑 Jump to:](#tools)** [What this is](#what-this-is) · [Tools](#tools) · [Licence](#licence) · [Adding a new tool](#adding-a-new-tool) — or switch to [🇮🇹 Italiano](#italiano)

### What this is

Utility Forge is a **monorepo**: every tool below lives in its own folder, with its own
README and, where useful, its own notes — but the code itself lives right here, in this
repository. No hunting across separate repos to find a tool: clone this one and you have
everything.

The tools share a philosophy, not a stack:

- ✅ **Standalone** — no server-side account, no SaaS signup; usually a single file you
  can just open or drop onto a server.
- ✅ **Privacy-first** — data is processed locally (in the browser) or on your own
  server; nothing is sent to a third party.
- ✅ **Free and open-source**, under the MIT licence.

### Tools

| Tool | What it does | Stack | Runs on | Folder |
|---|---|---|---|---|
| 📦 **EPS Barcode Generator** | Generates EAN-13 barcodes in vector EPS format straight from an Excel/CSV list — bulk, with ZIP download. | Single-file HTML/JS | 🌐 Browser only | [`barcode-eps-wizard/`](barcode-eps-wizard) |
| 🖼️ **PHP Image Converter** | Converts images between JPG/PNG/WEBP/BMP/TIFF/GIF/HEIC, with resize, crop presets and batch ZIP export, via a web UI. | Single-file PHP + GD/ImageMagick | 🖥️ Your own server | [`php-image-converter/`](php-image-converter) |

Each folder is self-contained: open `barcode-eps-wizard/barcode-eps-wizard.html` directly
in a browser, or drop `php-image-converter/php-image-converter.php` on a PHP server —
nothing outside its own folder is required to run it. See each folder's own README for
full setup and usage instructions.

Both tools have been hardened against the injection/XSS/upload-abuse classes of bugs that this
kind of "paste your data in, get a file out" tool is typically exposed to (strict input
validation, CSRF protection, a Content-Security-Policy, sanitized filenames, size limits — see
each folder's own README for the specifics that apply to it).

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
3. Add one row to the table above: name, one-line description, stack, where it runs,
   link to the folder.
4. Bump the `tools-N` badge at the top of this file to the new count.

### Support this project

If these tools saved you some time, a ⭐ on the repo costs nothing, and a coffee is
always appreciated:

<a href="https://www.paypal.me/chiaraberti13">
  <img src="https://img.shields.io/badge/PayPal-Donate-00457C?style=for-the-badge&logo=paypal&logoColor=white" alt="PayPal Donate">
</a>

<br><br>

---

<a name="italiano"></a>
## 🇮🇹 Italiano

<h1>🛠️ Utility Forge</h1>

**Una raccolta di tool di utilità standalone, orientati alla privacy, in un unico repository.**

**[📑 Vai a:](#tool-disponibili)** [Cos'è](#cosè) · [Tool disponibili](#tool-disponibili) · [Licenza](#licenza) · [Aggiungere un nuovo tool](#aggiungere-un-nuovo-tool) — oppure passa a [🇬🇧 English](#english)

### Cos'è

Utility Forge è un **monorepo**: ogni tool elencato qui sotto vive nella propria
cartella, con il proprio README ed eventuali note dedicate — ma il codice vero e proprio
sta qui, in questo repository. Niente più repo sparsi da cercare: si clona questo e c'è
tutto.

I tool condividono una filosofia, non uno stack:

- ✅ **Standalone** — nessun account lato server, nessuna registrazione SaaS; di solito
  un singolo file da aprire o caricare su un server.
- ✅ **Privacy-first** — i dati vengono elaborati in locale (nel browser) o sul proprio
  server; nulla viene inviato a terzi.
- ✅ **Gratuiti e open-source**, con licenza MIT.

### Tool disponibili

| Tool | Cosa fa | Stack | Funziona su | Cartella |
|---|---|---|---|---|
| 📦 **EPS Barcode Generator** | Genera barcode EAN-13 in formato vettoriale EPS direttamente da un elenco Excel/CSV — in massa, con download ZIP. | HTML/JS a file singolo | 🌐 Solo browser | [`barcode-eps-wizard/`](barcode-eps-wizard) |
| 🖼️ **PHP Image Converter** | Converte immagini tra JPG/PNG/WEBP/BMP/TIFF/GIF/HEIC, con ridimensionamento, ritagli predefiniti ed export ZIP in batch, tramite interfaccia web. | PHP a file singolo + GD/ImageMagick | 🖥️ Un tuo server | [`php-image-converter/`](php-image-converter) |

Ogni cartella è autonoma: si può aprire direttamente
`barcode-eps-wizard/barcode-eps-wizard.html` nel browser, oppure caricare
`php-image-converter/php-image-converter.php` su un server PHP — non serve nient'altro
al di fuori della propria cartella per farlo funzionare. Per le istruzioni complete di
installazione e uso vedi il README di ciascuna cartella.

Entrambi i tool sono stati messi in sicurezza contro le classi di bug tipiche di questo genere di
strumenti "incolli i tuoi dati, ottieni un file" (injection, XSS, abuso degli upload): validazione
rigorosa degli input, protezione CSRF, una Content-Security-Policy, nomi file sanificati, limiti
dimensionali — per i dettagli specifici vedi il README di ciascuna cartella.

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
   dove funziona, link alla cartella.
4. Aggiornare il badge `tools-N` in cima a questo file con il nuovo conteggio.

### Sostieni il progetto

Se questi tool ti hanno fatto risparmiare tempo, una ⭐ al repo non costa nulla, e un
caffè è sempre gradito:

<a href="https://www.paypal.me/chiaraberti13">
  <img src="https://img.shields.io/badge/PayPal-Donate-00457C?style=for-the-badge&logo=paypal&logoColor=white" alt="PayPal Donate">
</a>

<br><br>

---

<div align="center">
  <sub>Made with 🛠️ by <a href="https://github.com/chiaraberti13">chiaraberti13</a></sub>
</div>
