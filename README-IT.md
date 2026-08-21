# 🛠️ Utility Forge

<p align="center">
  <a href="README.md">🇬🇧 English</a> | <a href="README-IT.md">🇮🇹 Italiano</a>
</p>

<p align="center">
  <a href="https://github.com/chiaraberti13/Utility-Forge/stargazers"><img src="https://img.shields.io/github/stars/chiaraberti13/Utility-Forge?style=for-the-badge&color=blue" alt="Stelle GitHub"></a>
  <img src="https://img.shields.io/badge/tool-2-blue?style=for-the-badge" alt="2 tool">
  <a href="LICENSE"><img src="https://img.shields.io/github/license/chiaraberti13/Utility-Forge?style=for-the-badge&color=green" alt="Licenza"></a>
</p>

Una raccolta di tool di utilità standalone, orientati alla privacy, in un unico
repository. Ogni tool è autonomo — lo apri e funziona, senza account, senza
registrazione SaaS, senza che i dati escano dal tuo browser o dal tuo server.

<p align="center">
  <img src="assets/banner.svg" alt="Utility Forge" width="800">
</p>

<p align="center">
  <b>Se questi tool ti sono utili, considera di supportare il progetto:</b><br><br>
  <a href="https://www.paypal.me/chiaraberti13"><img src="https://img.shields.io/badge/PayPal-Donate-00457C?style=for-the-badge&logo=paypal&logoColor=white" alt="Dona con PayPal"></a>
</p>

## Cos'è

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

## Tool disponibili

| Tool | Cosa fa | Stack | Funziona su | Cartella |
|---|---|---|---|---|
| 📦 **EPS Barcode Generator** | Genera barcode EAN-13 in formato vettoriale EPS direttamente da un elenco Excel/CSV — in massa, con download ZIP. | HTML/JS a file singolo | Solo browser | [`barcode-eps-wizard/`](barcode-eps-wizard) |
| 🖼️ **PHP Image Converter** | Converte immagini tra JPG/PNG/WEBP/BMP/TIFF/GIF/HEIC, con ridimensionamento, ritagli predefiniti ed export ZIP in batch, tramite interfaccia web. | PHP a file singolo + GD/ImageMagick | Un tuo server | [`php-image-converter/`](php-image-converter) |

Ogni cartella è autonoma: si può aprire direttamente
`barcode-eps-wizard/barcode-eps-wizard.html` nel browser, oppure caricare
`php-image-converter/php-image-converter.php` su un server PHP — non serve nient'altro
al di fuori della propria cartella per farlo funzionare. Per le istruzioni complete di
installazione e uso vedi il README di ciascuna cartella.

Entrambi i tool sono stati messi in sicurezza contro le classi di bug tipiche di questo
genere di strumenti "incolli i tuoi dati, ottieni un file" (injection, XSS, abuso degli
upload): validazione rigorosa degli input, protezione CSRF, una Content-Security-Policy,
nomi file sanificati, limiti dimensionali — per i dettagli specifici vedi il README di
ciascuna cartella.

## Licenza

L'intero repository, comprese tutte le cartelle dei tool, è distribuito con **licenza
MIT** — vedi [`LICENSE`](LICENSE) per il testo completo. Puoi usarlo, studiarlo,
modificarlo e ridistribuirlo liberamente, anche commercialmente, mantenendo l'avviso di
copyright; è fornito così com'è, senza alcuna garanzia.

## Aggiungere un nuovo tool

Ogni volta che un nuovo tool viene aggiunto a questa raccolta, questo README viene
aggiornato nella stessa modifica — un nuovo tool e un indice non aggiornato non vengono
mai pubblicati separatamente. In pratica, aggiungere il tool numero *n+1* significa:

1. Creare una nuova cartella nella radice del repository, con il nome del tool.
2. Inserirci i file del tool, incluso il proprio `README.md` con le istruzioni di
   installazione e uso.
3. Aggiungere una riga alla tabella qui sopra: nome, descrizione in una riga, stack,
   dove funziona, link alla cartella.
4. Aggiornare il badge `tool-N` in cima a questo file con il nuovo conteggio.

---

<p align="center">
  <sub>Realizzato con 🛠️ da <a href="https://github.com/chiaraberti13">chiaraberti13</a></sub>
</p>
