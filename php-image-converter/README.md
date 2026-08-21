# 🖼️ PHP Image Converter

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PHP Version](https://img.shields.io/badge/PHP-8.2%2B-purple.svg)](https://www.php.net/)
[![Made with ❤️](https://img.shields.io/badge/Made%20with-❤️-red.svg)](https://github.com/chiaraberti13)

---

## 🇬🇧 English

A powerful, self-contained PHP image converter with an intuitive web interface. Convert images between multiple formats with advanced options like resizing, cropping, and quality control—all in a single PHP file.

### ✨ Key Features

- **🔄 Multiple Format Support**: Convert between JPG, PNG, WEBP, BMP, TIFF, GIF, HEIC/HEIF
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
- **Session Management**: Temporary files stored in system temp directory
- **Security**: File size limits, extension validation, secure file handling
- **Performance**: Optimized memory usage, configurable timeouts

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

- **🔄 Supporto Formati Multipli**: Converti tra JPG, PNG, WEBP, BMP, TIFF, GIF, HEIC/HEIF
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
- **Gestione Sessioni**: File temporanei memorizzati nella directory temp di sistema
- **Sicurezza**: Limiti dimensione file, validazione estensioni, gestione sicura dei file
- **Performance**: Uso ottimizzato della memoria, timeout configurabili

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
