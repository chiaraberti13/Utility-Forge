# 🖼️ PHP Image Converter

> 🇬🇧 [English](README.md) | 🇮🇹 **Italiano**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PHP Version](https://img.shields.io/badge/PHP-8.2%2B-purple.svg)](https://www.php.net/)
[![Made with ❤️](https://img.shields.io/badge/Made%20with-❤️-red.svg)](https://github.com/chiaraberti13)

---

Un potente convertitore di immagini PHP con interfaccia web intuitiva. Converti immagini tra diversi formati con opzioni avanzate come ridimensionamento, ritaglio e controllo della qualità — tutto in un singolo file PHP messo in sicurezza, da caricare direttamente sul tuo server, senza database e senza alcun servizio esterno.

## ✨ Caratteristiche Principali

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

## 📋 Requisiti

- **PHP**: 8.2 o superiore
- **PHP GD Library**: `php-gd` (obbligatorio)
- **Estensione ImageMagick**: `php-imagick` (consigliato per supporto TIFF/HEIC)
- **Supporto ZipArchive**: Per la funzionalità di download batch
- **Memoria**: Almeno 512MB di limite memoria PHP
- **Dimensione Upload**: Consigliato massimo 100MB per upload

## 🚀 Installazione

Questo tool è un **singolo file PHP autonomo**: `php-image-converter.php`. Sul server serve solo
quel file — tutto il resto in questa cartella (`README.md`, `INSTALL.md`, `LICENSE`) è
documentazione, non necessaria a runtime.

1. **Recupera il file** — puoi clonare l'intero repository Utility Forge e usare questa cartella:
   ```bash
   git clone https://github.com/chiaraberti13/Utility-Forge.git
   cd Utility-Forge/php-image-converter
   ```
   oppure scaricare direttamente `php-image-converter.php` dalla cartella
   [`php-image-converter/`](.) su GitHub.

2. **Caricalo sul tuo server web** (FTP/SFTP, `scp`, il file manager del tuo hosting — quello che
   usi di solito):
   - Copia `php-image-converter.php` in una directory raggiungibile dal web
   - Assicurati che il processo PHP possa scrivere nella directory temp di sistema — è lì che
     vengono tenuti upload e file convertiti per un massimo di 1 ora, prima della pulizia
     automatica

3. **Verifica che le estensioni PHP necessarie siano attive** sul server:
   ```bash
   php -m | grep -E "gd|fileinfo|zip|imagick"
   ```
   `gd`, `fileinfo` e `zip` sono **obbligatorie**; `imagick` è **opzionale** (serve solo per
   l'output TIFF e per alcune sorgenti HEIC/HEIF che GD da solo non riesce a decodificare).

4. **Alza i limiti di PHP se il tuo hosting li impone più bassi di quanto serva.** Lo script li
   imposta già a runtime con `ini_set()`, ma un `php.ini` restrittivo può comunque avere la
   precedenza — in tal caso modifica `php.ini`, un `.user.ini` per directory, oppure `.htaccess`:
   ```ini
   memory_limit = 512M
   max_execution_time = 300
   upload_max_filesize = 100M
   post_max_size = 100M
   ```

5. **Servilo in HTTPS quando possibile.** Il cookie di sessione viene marcato automaticamente
   `Secure` non appena la richiesta arriva via HTTPS (direttamente, o tramite un reverse proxy che
   invia `X-Forwarded-Proto: https`) — su HTTP semplice funziona comunque, solo senza questa
   protezione aggiuntiva.

6. **Aprilo**:
   Naviga su `https://tuodominio.com/php-image-converter.php` nel browser — nessun setup
   guidato, nessuna migrazione di database, nessun account da creare.

## 📖 Utilizzo

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

## 🎛️ Funzionalità Avanzate

### Trasformazioni Immagine
- **Ridimensionamento**: Specifica dimensioni target mantenendo le proporzioni
- **Ritaglio**: Scegli tra 9 proporzioni predefinite (1:1, 16:9, 4:3, 21:9, 3:2, 5:4, 9:16, 2:3, 4:5)
- **Controllo Qualità**: Regola il livello di compressione per formati lossy

### Opzioni Nomenclatura File
- **Mantieni nome originale**: `foto.jpg` → `foto.png`
- **Aggiungi suffisso**: `foto.jpg` → `foto_converted.png`
- **Aggiungi prefisso**: `foto.jpg` → `converted_foto.png`

### Operazioni Batch
- Converti più file in una volta
- Imposta lo stesso formato per tutti i file
- Scarica tutti i file convertiti come ZIP

## 🔧 Dettagli Tecnici

- **Backend**: PHP puro con GD Library
- **Opzionale**: ImageMagick per supporto HEIC/HEIF e TIFF complessi
- **Gestione Sessioni**: File temporanei memorizzati nella directory temp di sistema, in una
  cartella creata con permessi `0700` (leggibile solo dal processo PHP)
- **Performance**: Uso ottimizzato della memoria, timeout configurabili

## 🔒 Sicurezza

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

## 🌐 Compatibilità Browser

- Chrome/Edge (ultime versioni)
- Firefox (ultime versioni)
- Safari (ultime versioni)
- Opera (ultime versioni)

## 📝 Licenza

Questo progetto è concesso in licenza con Licenza MIT - vedi il file [LICENSE](LICENSE) per i dettagli.

## 👤 Autore

**Chiara Berti 13**

## 🤝 Contributi

I contributi sono benvenuti! Sentiti libero di aprire issue o inviare pull request.

## 🐛 Segnalazione Bug

Se trovi un bug, apri una issue con:
- Descrizione del problema
- Passaggi per riprodurlo
- Comportamento atteso
- Screenshot (se applicabile)

---

**Realizzato con ❤️ da Chiara Berti 13**

© 2026 - Licenza MIT
