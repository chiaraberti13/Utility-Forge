# 🖼️ PHP Image Converter

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PHP Version](https://img.shields.io/badge/PHP-8.2%2B-purple.svg)](https://www.php.net/)
[![Made with ❤️](https://img.shields.io/badge/Made%20with-❤️-red.svg)](https://github.com/chiaraberti13)

---

## 🇬🇧 English

A powerful, self-contained PHP image converter with an intuitive web interface. Convert images between multiple formats with advanced options like resizing, cropping, and quality control—all in a single PHP file.

### ✨ Key Features

- **🔄 Multiple Format Support**: Convert between JPG, PNG, WEBP, AVIF*, BMP, TIFF, GIF, HEIC/HEIF input
  (*AVIF output is enabled automatically when the server's GD build supports it, PHP 8.1+)
- **📦 Batch Processing**: Convert multiple images simultaneously
- **✂️ Advanced Options**: Resize, crop with aspect ratio presets, quality control
- **🎯 Smart Cropping**: Pre-defined aspect ratios (1:1, 16:9, 4:3, 21:9, etc.)
- **💾 Flexible Downloads**: Download files individually or all together in a ZIP archive
- **🎨 Modern UI**: Clean, responsive interface with drag-and-drop support
- **🔒 Privacy First**: All processing happens on your server—no third-party services
- **📄 Single File**: Everything in one PHP file—easy deployment
- **⚙️ Customizable**: Adjust quality, dimensions, file naming conventions
- **🚀 Fast Processing**: Optimized with GD Library and optional ImageMagick support

### 📋 Requirements

- **PHP**: 8.2 or higher
- **PHP GD Library**: `php-gd` (required)
- **ImageMagick Extension**: `php-imagick` (recommended for TIFF/HEIC support)
- **ZipArchive Support**: For batch download functionality
- **Memory**: At least 512MB PHP memory limit
- **Upload Size**: Recommended 100MB max upload size

### 🚀 Installation

1. **Download the converter**:
   ```bash
   git clone https://github.com/yourusername/php-image-converter.git
   cd php-image-converter
   ```

2. **Upload to your web server**:
   - Copy `converter.php` to your web directory
   - Ensure PHP has write permissions for the temp directory

3. **Configure PHP (if needed)**:
   Edit your `php.ini` or use `.htaccess`:
   ```ini
   memory_limit = 512M
   max_execution_time = 300
   upload_max_filesize = 100M
   post_max_size = 100M
   ```

4. **Access the converter**:
   Navigate to `http://yourdomain.com/converter.php` in your browser

### 📖 Usage

1. **Upload Images**:
   - Drag and drop files or click to select
   - Supported input formats: JPG, PNG, WEBP, GIF, BMP, TIFF, HEIC/HEIF

2. **Configure Conversion**:
   - Select target format for each file (or set for all at once)
   - Adjust quality (1-100%)
   - Enable resize: specify width and/or height
   - Enable crop: choose aspect ratio

3. **Convert**:
   - Click "Convert All" to start processing
   - Progress bars show conversion status

4. **Download**:
   - Download files individually
   - Or use "Download All" to get a ZIP archive

### 🎛️ Advanced Features

#### Image Transformations
- **Resize**: Specify target dimensions while maintaining aspect ratio
- **Crop**: Choose from 9 aspect ratio presets (1:1, 16:9, 4:3, 21:9, 3:2, 5:4, 9:16, 2:3, 4:5)
- **Quality Control**: Adjust compression level for lossy formats

#### File Naming Options
- **Preserve original name**: `photo.jpg` → `photo.png`
- **Add suffix**: `photo.jpg` → `photo_converted.png`
- **Add prefix**: `photo.jpg` → `converted_photo.png`

#### Batch Operations
- Convert multiple files in one go
- Set same format for all files
- Download all converted files as ZIP

### 🔧 Technical Details

- **Backend**: Pure PHP with GD Library
- **Optional**: ImageMagick for HEIC/HEIF and complex TIFF support
- **Session Management**: Temporary files stored in system temp directory, in a folder created with
  `0700` permissions (readable only by the PHP process)
- **Performance**: Optimized memory usage, configurable timeouts

### 🔒 Security

This tool accepts file uploads and reflects user input back into HTTP headers, disk paths and a
ZIP archive — all classic injection surfaces for a PHP upload tool. This version hardens each of
them:

- **CSRF protection**: every state-changing request (upload, convert, rename, remove, clear) must
  carry a per-session token; requests without a valid token are rejected with `403`.
- **Real content validation, not just the extension**: each upload is checked with `finfo` against
  its real MIME type, so a script renamed to `.jpg` is rejected instead of being processed.
- **Decompression-bomb protection**: images above a configurable megapixel limit are rejected at
  upload time, and any resize/crop request that would produce an oversized image is rejected
  before allocating memory for it.
- **Safe filenames**: the original filename and the naming prefix/suffix are sanitized before
  being reused as a download filename, an HTTP header, or a ZIP entry — this closes both HTTP
  header injection and "zip slip" path traversal.
- **RFC 6266 download headers**: `Content-Disposition` is built with a safe ASCII fallback plus a
  UTF-8 encoded name, instead of interpolating the filename directly into the header string.
- **Hardened session cookie**: `HttpOnly`, `SameSite=Strict`, and `Secure` (when served over
  HTTPS).
- **Security headers** on every response: `Content-Security-Policy`, `X-Content-Type-Options`,
  `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`.
- **Per-session upload directory** created with `0700` permissions, plus a cap on the number of
  files a single session can hold.
- **XSS-safe file list rendering**: filenames shown in the UI are escaped before being inserted
  into the page.

None of this replaces running the server itself behind HTTPS, keeping PHP/GD/ImageMagick patched,
and restricting who can reach this script — see *Requirements* above for the baseline.

### 🌐 Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Opera (latest)

### 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### 👤 Author

**Chiara Berti 13**

---

## 🇮🇹 Italiano

Un potente convertitore di immagini PHP con interfaccia web intuitiva. Converti immagini tra diversi formati con opzioni avanzate come ridimensionamento, ritaglio e controllo della qualità—tutto in un singolo file PHP.

### ✨ Caratteristiche Principali

- **🔄 Supporto Formati Multipli**: Converti in JPG, PNG, WEBP, AVIF*, BMP, TIFF, GIF, in input anche HEIC/HEIF
  (*l'output AVIF si attiva automaticamente se la build di GD del server lo supporta, PHP 8.1+)
- **📦 Elaborazione Batch**: Converti più immagini contemporaneamente
- **✂️ Opzioni Avanzate**: Ridimensionamento, ritaglio con proporzioni predefinite, controllo qualità
- **🎯 Ritaglio Intelligente**: Proporzioni predefinite (1:1, 16:9, 4:3, 21:9, ecc.)
- **💾 Download Flessibili**: Scarica file singolarmente o tutti insieme in un archivio ZIP
- **🎨 UI Moderna**: Interfaccia pulita e responsiva con supporto drag-and-drop
- **🔒 Privacy Garantita**: Tutta l'elaborazione avviene sul tuo server—nessun servizio di terze parti
- **📄 File Singolo**: Tutto in un file PHP—facile da distribuire
- **⚙️ Personalizzabile**: Regola qualità, dimensioni, convenzioni di denominazione file
- **🚀 Elaborazione Veloce**: Ottimizzato con GD Library e supporto opzionale ImageMagick

### 📋 Requisiti

- **PHP**: 8.2 o superiore
- **PHP GD Library**: `php-gd` (obbligatorio)
- **Estensione ImageMagick**: `php-imagick` (consigliato per supporto TIFF/HEIC)
- **Supporto ZipArchive**: Per la funzionalità di download batch
- **Memoria**: Almeno 512MB di limite memoria PHP
- **Dimensione Upload**: Consigliato massimo 100MB per upload

### 🚀 Installazione

1. **Scarica il convertitore**:
   ```bash
   git clone https://github.com/yourusername/php-image-converter.git
   cd php-image-converter
   ```

2. **Carica sul tuo server web**:
   - Copia `converter.php` nella directory web
   - Assicurati che PHP abbia i permessi di scrittura sulla directory temp

3. **Configura PHP (se necessario)**:
   Modifica il tuo `php.ini` o usa `.htaccess`:
   ```ini
   memory_limit = 512M
   max_execution_time = 300
   upload_max_filesize = 100M
   post_max_size = 100M
   ```

4. **Accedi al convertitore**:
   Naviga su `http://tuodominio.com/converter.php` nel tuo browser

### 📖 Utilizzo

1. **Carica Immagini**:
   - Trascina e rilascia i file o clicca per selezionarli
   - Formati di input supportati: JPG, PNG, WEBP, GIF, BMP, TIFF, HEIC/HEIF

2. **Configura Conversione**:
   - Seleziona il formato di destinazione per ogni file (o imposta per tutti)
   - Regola la qualità (1-100%)
   - Abilita ridimensionamento: specifica larghezza e/o altezza
   - Abilita ritaglio: scegli le proporzioni

3. **Converti**:
   - Clicca "Converti Tutto" per iniziare l'elaborazione
   - Le barre di progresso mostrano lo stato della conversione

4. **Scarica**:
   - Scarica i file singolarmente
   - Oppure usa "Scarica Tutto" per ottenere un archivio ZIP

### 🎛️ Funzionalità Avanzate

#### Trasformazioni Immagine
- **Ridimensionamento**: Specifica dimensioni target mantenendo le proporzioni
- **Ritaglio**: Scegli tra 9 proporzioni predefinite (1:1, 16:9, 4:3, 21:9, 3:2, 5:4, 9:16, 2:3, 4:5)
- **Controllo Qualità**: Regola il livello di compressione per formati lossy

#### Opzioni Nomenclatura File
- **Mantieni nome originale**: `foto.jpg` → `foto.png`
- **Aggiungi suffisso**: `foto.jpg` → `foto_converted.png`
- **Aggiungi prefisso**: `foto.jpg` → `converted_foto.png`

#### Operazioni Batch
- Converti più file in una volta
- Imposta lo stesso formato per tutti i file
- Scarica tutti i file convertiti come ZIP

### 🔧 Dettagli Tecnici

- **Backend**: PHP puro con GD Library
- **Opzionale**: ImageMagick per supporto HEIC/HEIF e TIFF complessi
- **Gestione Sessioni**: File temporanei memorizzati nella directory temp di sistema, in una
  cartella creata con permessi `0700` (leggibile solo dal processo PHP)
- **Performance**: Uso ottimizzato della memoria, timeout configurabili

### 🔒 Sicurezza

Questo strumento accetta upload di file e riutilizza input dell'utente in header HTTP, percorsi su
disco e un archivio ZIP — le classiche superfici di injection per un tool PHP di upload. Questa
versione le rinforza tutte:

- **Protezione CSRF**: ogni richiesta che modifica lo stato (upload, conversione, rinomina,
  rimozione, cancellazione) deve portare un token per-sessione; le richieste senza token valido
  vengono rifiutate con `403`.
- **Validazione sul contenuto reale, non solo sull'estensione**: ogni upload viene verificato con
  `finfo` confrontando il MIME type reale, così uno script rinominato in `.jpg` viene rifiutato
  invece di essere elaborato.
- **Protezione da "decompression bomb"**: le immagini oltre un limite di megapixel configurabile
  vengono rifiutate al momento dell'upload, e qualsiasi richiesta di ridimensionamento/ritaglio
  che produrrebbe un'immagine troppo grande viene rifiutata prima di allocare memoria per essa.
- **Nomi file sicuri**: il nome file originale e il prefisso/suffisso di nomenclatura vengono
  sanificati prima di essere riusati come nome di download, header HTTP o voce dello ZIP — questo
  chiude sia l'header injection HTTP sia il path traversal di tipo "zip slip".
- **Header di download conformi a RFC 6266**: `Content-Disposition` viene costruito con un
  fallback ASCII sicuro più un nome codificato UTF-8, invece di interpolare direttamente il nome
  file nella stringa dell'header.
- **Cookie di sessione rinforzato**: `HttpOnly`, `SameSite=Strict` e `Secure` (quando servito via
  HTTPS).
- **Header di sicurezza** su ogni risposta: `Content-Security-Policy`, `X-Content-Type-Options`,
  `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`.
- **Directory di upload per-sessione** creata con permessi `0700`, più un limite al numero di file
  che una singola sessione può contenere.
- **Rendering della lista file sicuro contro XSS**: i nomi dei file mostrati nell'interfaccia
  vengono sanificati prima di essere inseriti nella pagina.

Nulla di questo sostituisce l'eseguire il server dietro HTTPS, mantenere PHP/GD/ImageMagick
aggiornati e limitare chi può raggiungere questo script — vedi *Requisiti* qui sopra per la base
di partenza.

### 🌐 Compatibilità Browser

- Chrome/Edge (ultime versioni)
- Firefox (ultime versioni)
- Safari (ultime versioni)
- Opera (ultime versioni)

### 📝 Licenza

Questo progetto è concesso in licenza con Licenza MIT - vedi il file [LICENSE](LICENSE) per i dettagli.

### 👤 Autore

**Chiara Berti 13**

---

## 🤝 Contributing / Contributi

Contributions are welcome! Feel free to open issues or submit pull requests.

I contributi sono benvenuti! Sentiti libero di aprire issue o inviare pull request.

## 🐛 Bug Reports / Segnalazione Bug

If you find a bug, please open an issue with:
- Description of the problem
- Steps to reproduce
- Expected behavior
- Screenshots (if applicable)

Se trovi un bug, apri un issue con:
- Descrizione del problema
- Passaggi per riprodurlo
- Comportamento atteso
- Screenshot (se applicabile)

---

**Made with © by Chiara Berti 13**

© 2026 - Licensed under MIT License
