<p align="center">
  <img src="https://img.shields.io/badge/tools-2-blue" alt="Tools">
  <img src="https://img.shields.io/badge/license-MIT-lightgrey" alt="License: MIT">
  <img src="https://img.shields.io/badge/maintainer-chiaraberti13-informational" alt="Maintainer">
</p>

<h1 align="center">🛠️ Utility Forge</h1>

<p align="center">
  <b>A curated hub of standalone, privacy-first utility tools.</b><br>
  <b>Un raccoglitore di tool di utilità standalone, orientati alla privacy.</b>
</p>

<p align="center">
  🇬🇧 <a href="#english">English</a> · 🇮🇹 <a href="#italiano">Italiano</a>
</p>

---

## English

### What this is

Utility Forge is an **index**, not a monorepo: each tool below lives in its own
repository, with its own README, its own LICENSE and its own release history. This
repository exists to give them one shared front door, so anyone landing here can see
at a glance what's available and jump straight to the one they need.

The tools share a philosophy, not code:
- **Standalone** — no server-side account, no SaaS signup; usually a single file you
  can just open or drop onto a server.
- **Privacy-first** — data is processed locally (in the browser) or on your own
  server; nothing is sent to a third party.
- **Free and open-source**, under the MIT licence.

### Tools

| Tool | What it does | Stack | Repository |
|---|---|---|---|
| 📦 **EPS Barcode Generator** | Generates EAN-13 barcodes in vector EPS format straight from an Excel/CSV list — bulk, with ZIP download. Runs entirely in the browser, no install. | Single-file HTML/JS | [Barcode-eps-wizard](https://github.com/chiaraberti13/Barcode-eps-wizard) |
| 🖼️ **PHP Image Converter** | Converts images between JPG/PNG/WEBP/BMP/TIFF/GIF/HEIC, with resize, crop presets and batch ZIP export, via a web UI. Runs entirely on your own server. | Single-file PHP + GD/ImageMagick | [PHP-Image-Converter](https://github.com/chiaraberti13/PHP-Image-Converter) |

Each entry keeps its own MIT licence in its own repository; this repository's
[`LICENSE`](LICENSE) covers only the content of this index (this README and any
shared assets added here in the future).

### Adding a new tool

Whenever a new tool is added to this collection, the table above is updated in the
same change — a new tool and a stale index don't ship separately. In practice, adding
tool number *n+1* means:

1. Publish the tool in its own repository (own README, own LICENSE).
2. Add one row to the table above: name, one-line description, stack, link.
3. Bump the `tools-N` badge at the top of this file to the new count.

### Licence

This index is distributed under the **MIT licence** — see [`LICENSE`](LICENSE) for
the full text. You're free to use, study, modify and redistribute it, including
commercially, as long as the copyright notice is kept; it's provided as-is, with no
warranty.

---

## Italiano

### Cos'è

Utility Forge è un **indice**, non un monorepo: ogni tool elencato qui sotto vive nel
proprio repository, con il proprio README, la propria LICENSE e la propria cronologia
di release. Questo repository serve a dargli un unico punto d'ingresso comune, così
chi arriva qui vede subito cosa c'è disponibile e va dritto al tool che gli serve.

I tool condividono una filosofia, non del codice:
- **Standalone** — nessun account lato server, nessuna registrazione SaaS; di solito
  un singolo file da aprire o caricare su un server.
- **Privacy-first** — i dati vengono elaborati in locale (nel browser) o sul proprio
  server; nulla viene inviato a terzi.
- **Gratuiti e open-source**, con licenza MIT.

### Tool disponibili

| Tool | Cosa fa | Stack | Repository |
|---|---|---|---|
| 📦 **EPS Barcode Generator** | Genera barcode EAN-13 in formato vettoriale EPS direttamente da un elenco Excel/CSV — in massa, con download ZIP. Funziona interamente nel browser, senza installazione. | HTML/JS a file singolo | [Barcode-eps-wizard](https://github.com/chiaraberti13/Barcode-eps-wizard) |
| 🖼️ **PHP Image Converter** | Converte immagini tra JPG/PNG/WEBP/BMP/TIFF/GIF/HEIC, con ridimensionamento, ritagli predefiniti ed export ZIP in batch, tramite interfaccia web. Funziona interamente sul proprio server. | PHP a file singolo + GD/ImageMagick | [PHP-Image-Converter](https://github.com/chiaraberti13/PHP-Image-Converter) |

Ogni voce mantiene la propria licenza MIT nel proprio repository; la
[`LICENSE`](LICENSE) di questo repository copre solo il contenuto di questo indice
(questo README ed eventuali risorse condivise aggiunte qui in futuro).

### Aggiungere un nuovo tool

Ogni volta che un nuovo tool viene aggiunto a questa raccolta, la tabella qui sopra
viene aggiornata nella stessa modifica — un nuovo tool e un indice non aggiornato non
vengono mai pubblicati separatamente. In pratica, aggiungere il tool numero *n+1*
significa:

1. Pubblicare il tool nel proprio repository (con README e LICENSE propri).
2. Aggiungere una riga alla tabella qui sopra: nome, descrizione in una riga, stack,
   link.
3. Aggiornare il badge `tools-N` in cima a questo file con il nuovo conteggio.

### Licenza

Questo indice è distribuito con **licenza MIT** — vedi [`LICENSE`](LICENSE) per il
testo completo. Puoi usarlo, studiarlo, modificarlo e ridistribuirlo liberamente,
anche commercialmente, mantenendo l'avviso di copyright; è fornito così com'è, senza
alcuna garanzia.
