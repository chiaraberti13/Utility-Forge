# 📦 EPS Barcode Generator

> 🇬🇧 **English** | 🇮🇹 [Italiano](#-generatore-barcode-eps-italiano)

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
- **`README.md`** - This documentation (English + Italian)

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

---
---

# 📦 Generatore Barcode EPS (Italiano)

> 🇬🇧 [English](#-eps-barcode-generator) | 🇮🇹 **Italiano**

Una singola pagina HTML autonoma che trasforma un elenco Excel/CSV di codici articolo e barcode in
**barcode EAN-13 pronti per la stampa in formato vettoriale EPS** — in massa, con download ZIP in
un click. Tutto gira lato client, nel tuo browser: nessun upload, nessun server, nessun account, e
il file Excel di partenza non lascia mai il tuo computer. Pensato per i flussi di lavoro
grafici/prestampa (Adobe Illustrator, CorelDRAW, Inkscape) dove servono decine o centinaia di file
barcode pronti per la stampa tutti insieme, invece di generarli uno alla volta.

---

## 🎯 PACCHETTO COMPLETO

Questo pacchetto contiene:
- **`barcode-eps-wizard.html`** - L'applicazione web completa (è l'unico file che ti serve per usarla)
- **`example.xlsx`** - File Excel di esempio con la struttura corretta
- **`LICENSE`** - Licenza MIT
- **`README.md`** - Questa documentazione (Inglese + Italiano)

---

## ✅ INSTALLAZIONE (NESSUNA!)

Questa è una web app **completamente standalone**. Non devi installare:
- ❌ Python, Node.js o altri linguaggi di programmazione
- ❌ Librerie o dipendenze
- ❌ Software aggiuntivo

Due modi per usarla, entrambi validi:

- **In locale, sul tuo computer** — basta fare doppio click su `barcode-eps-wizard.html`; si apre
  nel browser predefinito e tutto (lettura dell'Excel, generazione EPS, creazione dello ZIP)
  avviene interamente in quella scheda del browser.
- **Condivisa su un server di team/intranet** — essendo un singolo file HTML statico, puoi anche
  metterla su un qualunque server web (o una condivisione file interna, o un hosting statico come
  GitHub Pages), così i colleghi la raggiungono con un URL invece di dover avere ciascuno la
  propria copia. Nessun backend, nessuna build, nessun linguaggio lato server richiesto.

**Basta aprire il file HTML nel browser!**

---

## 🚀 COME USARE IN 3 PASSI

### Passo 1: Aprire l'applicazione
1. Fai **doppio click** sul file `barcode-eps-wizard.html` (oppure apri l'URL, se ospitata su un server)
2. Si aprirà automaticamente nel tuo browser predefinito
3. Funziona con: Chrome, Firefox, Safari, Edge (qualsiasi browser moderno e aggiornato)

💡 **Nota:** la pagina carica tre piccole librerie (lettura Excel, creazione ZIP, icone) da un CDN
via internet ogni volta che la apri, quindi serve una connessione per caricare la pagina stessa.
L'elaborazione che avviene *dopo* il caricamento — leggere il tuo file Excel e generare i barcode
EPS — non invia mai nulla in rete.

✅ **Come capire se si è caricata correttamente:** se vedi l'icona del barcode e l'area di
caricamento con la sua icona in alto a sinistra, le librerie si sono caricate bene. Se il layout
sembra senza stile o mancano le icone, controlla la connessione e ricarica — vedi la sezione
"Risoluzione problemi" più sotto se persiste.

### Passo 2: Preparare il file Excel
Usa il file `example.xlsx` come esempio. La struttura deve essere:

```
| Codice articolo | Barcode        |
|-----------------|----------------|
| CODICE01        | 9090171029796  |
| CODICE02        | 9090171029802  |
| CODICE03        | 9090171029819  |
```

**Requisiti:**
- Due colonne: `Codice articolo` e `Barcode` (nomi esatti, case-sensitive)
- I barcode devono essere numeri di **12 cifre** (EAN-13 senza check digit) o **13 cifre** (EAN-13 completo)
- Formato file: `.xlsx` o `.xls` o `.csv`

### Passo 3: Generare i barcode
1. **Trascina** il file Excel nell'area di caricamento (oppure clicca per selezionarlo)
2. Clicca su **"Genera Barcode EPS"**
3. Attendi il completamento (vedrai la barra di progresso)
4. Scarica i file:
   - **Singolarmente**: clicca "Scarica" su ogni barcode nella lista
   - **Tutti insieme**: clicca "Scarica tutti" per ottenere un file `.zip`

---

## 📊 LIMITI TECNICI

### Numero massimo di barcode

**Limite rigido: 5.000 righe per file** (imposto dall'app, per evitare di bloccare la scheda del
browser). Un foglio con più righe viene rifiutato subito con un messaggio d'errore chiaro — meglio
dividerlo in più file. L'app rifiuta anche i file sorgente oltre i 20 MB prima ancora di leggerli.

Il limite dipende da:
- **Memoria RAM disponibile** - Ogni barcode occupa ~5-10 KB in memoria
- **Capacità del browser** - Chrome/Firefox gestiscono meglio grandi quantità
- **Sistema operativo** - Desktop ha più risorse di mobile

**Consigli pratici:**
- ✅ **< 1.000 barcode** - Nessun problema, generazione veloce
- ⚠️ **1.000 - 5.000 barcode** - Funziona bene, potrebbe richiedere 10-30 secondi

### File ZIP

Il file ZIP generato contiene tutti i barcode compressi. Dimensione approssimativa:
- 100 barcode ≈ 0.5 MB
- 1.000 barcode ≈ 5 MB  
- 5.000 barcode ≈ 25 MB
- 10.000 barcode ≈ 50 MB

**Nota:** Il browser potrebbe richiedere conferma per scaricare file ZIP > 100 MB.

---

## 🎯 CARATTERISTICHE

✅ **Nessuna installazione** - basta aprire il file HTML  
✅ **Funziona offline** - dopo il primo caricamento  
✅ **Multi-piattaforma** - Windows, Mac, Linux, Android, iOS  
✅ **File EPS veri** - formato PostScript compatibile con Adobe Illustrator  
✅ **Download ZIP** - tutti i barcode in un unico file compresso  
✅ **Drag & Drop** - interfaccia intuitiva  
✅ **Anteprima in tempo reale** - vedi i barcode mentre vengono generati  
✅ **Statistiche live** - totale, successi, errori  
✅ **Design responsive** - si adatta a desktop, tablet, smartphone  
✅ **Icone vettoriali** - interfaccia professionale con Lucide Icons  
✅ **Palette azzurro/blu** - design minimale e moderno  

---

## 💻 REQUISITI SISTEMA

### Browser supportati
- ✅ Chrome 90+ (consigliato)
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### Sistema operativo
- ✅ Windows 10/11
- ✅ macOS 10.15+
- ✅ Linux (Ubuntu, Debian, Fedora, ecc.)
- ✅ Android 9+ (Chrome Mobile)
- ✅ iOS/iPadOS 14+ (Safari)

### Risorse minime
- **RAM:** 2 GB (4 GB consigliati per > 1.000 barcode)
- **Spazio disco:** 100 MB liberi per i file generati
- **Connessione internet:** Solo per il primo caricamento

---

## 🔧 RISOLUZIONE PROBLEMI

### Il file HTML non si apre nel browser
**Soluzione:**
1. Click destro su `barcode-eps-wizard.html`
2. Seleziona "Apri con"
3. Scegli il tuo browser (Chrome consigliato)

### Le icone non si vedono
**Causa:** Problema di connessione internet  
**Soluzione:**
1. Verifica la connessione
2. Ricarica la pagina (F5 o Cmd+R)
3. L'app funziona comunque anche senza icone

### Errore "Codice deve avere 12 o 13 cifre"
**Causa:** Il barcode nel file Excel non è valido  
**Soluzione:**
1. Verifica che tutti i barcode abbiano 12 o 13 cifre
2. Rimuovi spazi, punti o altri caratteri
3. Assicurati che siano solo numeri

### Il browser va in crash con molti barcode
**Causa:** Troppi barcode, memoria insufficiente  
**Soluzione:**
1. Dividi il file Excel in più parti (es: 2.000 barcode per file)
2. Genera i barcode in più sessioni
3. Chiudi altre schede del browser per liberare RAM
4. Usa Chrome o Firefox per prestazioni migliori

### I file EPS non si aprono in Illustrator
**Soluzione:**
1. I file sono in formato PostScript puro
2. In Illustrator: File → Apri
3. Seleziona "Tutti i file" nel filtro
4. I file sono vettoriali al 100%

### Il file ZIP è troppo grande
**Soluzione:**
1. Il limite di download del browser è ~2 GB
2. Se superi questo limite, genera i barcode in più gruppi
3. Scarica i file singolarmente invece dello ZIP

---

## 📁 STRUTTURA FILE GENERATI

Ogni barcode viene salvato come:
```
CODICE01.eps
CODICE02.eps
CODICE03.eps
...
```

Il file ZIP viene chiamato:
```
barcode_eps_1234567890.zip
```
(dove `1234567890` è un timestamp univoco)

---

## 🎨 SPECIFICHE TECNICHE FILE EPS

- **Formato:** PostScript (EPS) versione 3.0
- **Encoding:** EAN-13 standard (ISO/IEC 15420)
- **Check digit:** Calcolato automaticamente secondo algoritmo Modulo 10
- **Quiet zone:** 10 moduli (conforme GS1 General Specifications)
- **Altezza barre:** 50 punti (≈ 17.6 mm)
- **Larghezza modulo:** 1 punto (≈ 0.35 mm)
- **Font:** Helvetica 11pt
- **Colori:** Nero 100% (K) su bianco
- **BoundingBox:** Calcolato automaticamente
- **Compatibilità:** Adobe Illustrator, CorelDRAW, Inkscape, Affinity Designer

---

## 🔒 PRIVACY E SICUREZZA

✅ **Tutti i dati rimangono sul tuo computer**  
✅ **Nessun file viene caricato su server esterni**  
✅ **Nessun tracking o analytics**  
✅ **Nessun account richiesto**  
✅ **Open source** - puoi ispezionare il codice

L'applicazione elabora i file completamente nel browser locale. Nessuna informazione viene trasmessa su internet.

**Interventi di hardening in questa versione:**
- **Validazione rigorosa del barcode** — viene accettato solo se composto da 12 o 13 cifre
  numeriche. Questo chiude un possibile vettore di injection PostScript: senza questo controllo,
  una cella del foglio Excel opportunamente costruita (parentesi, backslash, operatori
  PostScript) poteva finire tale e quale nel file `.eps` generato e venire eseguita da qualunque
  strumento lo apra o lo rasterizzi in seguito.
- **Rendering sicuro contro XSS** — ogni valore letto dal file caricato (codice articolo, barcode,
  messaggi d'errore) viene scritto nella pagina con `textContent`, mai con `innerHTML` o stringhe
  `onclick`. Il contenuto di una cella malevola non può più eseguire script nel browser.
- **Nomi file sanificati** — il codice articolo viene ripulito da separatori di percorso e
  caratteri di controllo prima di essere usato come nome file o voce dello ZIP, e i codici
  duplicati vengono automaticamente resi univoci invece di sovrascriversi in silenzio nello ZIP.
- **Content-Security-Policy** — la pagina applica una CSP rigorosa: possono essere eseguiti solo i
  tre script CDN esatti e lo script di questa pagina (identificato tramite hash SHA-256); tutto il
  resto è negato di default.
- **Limiti dimensionali** — file oltre i 20 MB o fogli con più di 5.000 righe vengono rifiutati
  subito con un messaggio chiaro, invece di bloccare la scheda del browser.
- **Dipendenza fissata** — la libreria di icone Lucide viene ora caricata da una versione fissa
  invece di `@latest`, così il suo codice non può più cambiare a tua insaputa.

---

## 💾 CONDIVISIONE

Puoi condividere l'intera cartella con colleghi:
1. Copia tutti i file su una chiavetta USB
2. Oppure condividi via email/WeTransfer/Google Drive
3. Chi riceve deve solo aprire `barcode-eps-wizard.html`

**Nessuna installazione richiesta per chi riceve i file!**

---

## 📝 CHANGELOG

### Versione 2.1 (Attuale) — Edizione Rinforzata
- 🔒 Validazione rigorosa del barcode (blocca l'injection PostScript nel file EPS generato)
- 🔒 Rendering DOM sicuro contro XSS (niente più `innerHTML`/`onclick` con dati del foglio Excel)
- 🔒 Nomi file sanificati e resi univoci per download e voci ZIP
- 🔒 Content-Security-Policy rigorosa (script inline ancorato via hash, origini CDN in whitelist)
- 🔒 Icone Lucide fissate a una versione precisa invece di `@latest`
- ✨ Limiti su dimensione file (20 MB) e numero di righe (5.000), con messaggi d'errore chiari

### Versione 2.0
- ✨ Nuovo design minimale ispirato a Lucide
- ✨ Icone vettoriali professionali
- ✨ Palette azzurro/blu
- ✨ **Download ZIP** per tutti i barcode
- ✨ Interfaccia responsive per mobile
- ✨ Alert migliorati con icone
- ✨ Progress bar con conteggio
- 🐛 Corretti bug con Excel formattazione numeri

### Versione 1.0
- 🎉 Prima release
- ✅ Generazione barcode EPS
- ✅ Supporto Excel/CSV
- ✅ Download singoli

---

## 🆘 SUPPORTO

Per problemi, domande o suggerimenti, apri una issue su GitHub.

---

## 📜 LICENZA

Licenza MIT - vedi il file [LICENSE](LICENSE) per i dettagli.

Copyright (c) 2026 Chiara Berti 13

---

**Generatore Barcode EPS v2.0 (Minimalist Edition)**  
Di Chiara Berti 13 - 2026
