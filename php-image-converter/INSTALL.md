# 🚀 Installation Guide / Guida all'Installazione

---

## 🇬🇧 English

### Quick Start

The simplest way to get started:

1. Download `php-image-converter.php`
2. Upload to your web server
3. Access via browser: `http://yourdomain.com/php-image-converter.php`

That's it! 🎉

---

### Detailed Installation

#### Prerequisites

Before installing, ensure your server meets these requirements:

**Required:**
- PHP 8.2 or higher
- PHP GD Library (`php-gd`)
- ZipArchive support

**Recommended:**
- PHP ImageMagick extension (`php-imagick`) for HEIC/HEIF support
- At least 512MB PHP memory limit

#### Check Your PHP Installation

Create a file named `phpinfo.php` with:
```php
<?php phpinfo(); ?>
```

Upload it to your server and access it via browser. Check for:
- PHP version (must be 8.2+)
- GD Library (enabled)
- ImageMagick (optional, for HEIC support)
- ZipArchive (enabled)

#### Installation Steps

##### Option 1: Direct Upload

1. **Download the file**:
   - Download `php-image-converter.php` from the repository

2. **Upload to server**:
   - Use FTP/SFTP client (FileZilla, Cyberduck, etc.)
   - Upload to your web directory (e.g., `public_html/`, `www/`, `htdocs/`)

3. **Set permissions** (Linux/Unix servers):
   ```bash
   chmod 644 php-image-converter.php
   ```

4. **Access the converter**:
   - Open browser
   - Navigate to: `http://yourdomain.com/php-image-converter.php`

##### Option 2: Git Clone (for developers)

1. **Clone the Utility Forge repository** (this tool lives in it as a self-contained folder):
   ```bash
   git clone https://github.com/chiaraberti13/Utility-Forge.git
   cd Utility-Forge/php-image-converter
   ```

2. **Copy to web directory**:
   ```bash
   cp php-image-converter.php /path/to/your/webroot/
   ```

3. **Access the converter**:
   ```
   http://yourdomain.com/php-image-converter.php
   ```

---

### PHP Configuration

#### Recommended php.ini Settings

For optimal performance, configure these settings:

```ini
# Memory limit (for large images)
memory_limit = 512M

# Maximum execution time (for batch processing)
max_execution_time = 300

# Upload file size (adjust based on your needs)
upload_max_filesize = 100M
post_max_size = 100M

# Enable required extensions
extension=gd
extension=zip
extension=imagick  ; Optional but recommended
```

#### How to Edit PHP Settings

**Option A: Edit php.ini (requires server access)**
1. Find your `php.ini` file
2. Edit the values above
3. Restart web server (Apache/Nginx)

**Option B: Use .htaccess (Apache only)**

Create/edit `.htaccess` in the same directory as `php-image-converter.php`:

```apache
php_value memory_limit 512M
php_value max_execution_time 300
php_value upload_max_filesize 100M
php_value post_max_size 100M
```

**Option C: Use .user.ini (some shared hosts)**

Create `.user.ini` in the same directory as `php-image-converter.php`:

```ini
memory_limit = 512M
max_execution_time = 300
upload_max_filesize = 100M
post_max_size = 100M
```

---

### Installing PHP Extensions

#### On Ubuntu/Debian:

```bash
# Update package list
sudo apt update

# Install PHP GD (required)
sudo apt install php-gd

# Install PHP ImageMagick (optional)
sudo apt install php-imagick

# Install PHP Zip (required)
sudo apt install php-zip

# Restart web server
sudo systemctl restart apache2
# OR for Nginx with PHP-FPM:
sudo systemctl restart php8.3-fpm
```

#### On CentOS/RHEL:

```bash
# Install PHP GD
sudo yum install php-gd

# Install PHP ImageMagick
sudo yum install php-pecl-imagick

# Install PHP Zip
sudo yum install php-zip

# Restart web server
sudo systemctl restart httpd
```

#### On macOS (with Homebrew):

```bash
# Install PHP
brew install php

# GD is usually included by default
# To install ImageMagick:
brew install imagemagick
brew install pkg-config
pecl install imagick

# Restart PHP (if using built-in server)
brew services restart php
```

#### On Windows (XAMPP/WAMP):

1. Open `php.ini` file
2. Find and uncomment these lines (remove the `;`):
   ```ini
   extension=gd
   extension=zip
   extension=imagick
   ```
3. Restart Apache

---

### Troubleshooting

#### Problem: "Call to undefined function imagecreatefromjpeg()"
**Solution**: GD library is not installed. Install `php-gd` and restart web server.

#### Problem: "Maximum execution time exceeded"
**Solution**: Increase `max_execution_time` in php.ini or .htaccess.

#### Problem: "Allowed memory size exhausted"
**Solution**: Increase `memory_limit` in php.ini or .htaccess.

#### Problem: "HEIC/HEIF files not converting"
**Solution**: Install ImageMagick extension (`php-imagick`).

#### Problem: "Cannot write to temp directory"
**Solution**: Ensure web server user has write permissions to system temp directory.

#### Problem: File upload fails
**Solution**: Check `upload_max_filesize` and `post_max_size` settings.

---

### Security Considerations

The script includes several protections out of the box — see the "🔒 Security" section of
[`README.md`](README.md) for the full list. In short:

1. **Upload directory**: system temp directory, in a unique per-session subfolder created with
   `0700` permissions (readable/writable only by the PHP process)
2. **Real content validation**: uploads are checked with `finfo` against their actual MIME type,
   not just the file extension, and oversized images (decompression-bomb risk) are rejected
3. **CSRF protection**: every state-changing request (upload, convert, remove, rename, clear)
   requires a per-session token
4. **Safe filenames and headers**: filenames are sanitized before being used in an HTTP header,
   on disk or inside the ZIP archive; downloads use a proper RFC 6266 `Content-Disposition`
5. **Hardened session cookie**: `HttpOnly`, `SameSite=Strict`, and `Secure` when served over HTTPS
6. **Security response headers**: `Content-Security-Policy`, `X-Content-Type-Options`,
   `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` on every response
7. **Cleanup**: converted files are deleted automatically after 1 hour; you can still add a cron
   job for extra peace of mind

What this script does **not** do for you: serve itself over HTTPS, keep PHP/GD/ImageMagick
patched, or restrict *who* can reach the URL — that's still on you as the person deploying it.

Optional: add automatic cleanup with cron anyway, as a second line of defense:
```bash
# Clean old temp files daily (Linux)
0 2 * * * find /tmp -name "image_converter_*" -mtime +1 -exec rm -rf {} \;
```

---

### Testing Your Installation

1. **Access the converter** in your browser
2. **Upload a test image** (e.g., a JPG file)
3. **Select a target format** (e.g., PNG)
4. **Click "Convert"**
5. **Download the result**

If all steps work, your installation is successful! ✅

---

## 🇮🇹 Italiano

### Avvio Rapido

Il modo più semplice per iniziare:

1. Scarica `php-image-converter.php`
2. Carica sul tuo server web
3. Accedi via browser: `http://tuodominio.com/php-image-converter.php`

È tutto! 🎉

---

### Installazione Dettagliata

#### Prerequisiti

Prima di installare, assicurati che il tuo server soddisfi questi requisiti:

**Obbligatori:**
- PHP 8.2 o superiore
- PHP GD Library (`php-gd`)
- Supporto ZipArchive

**Consigliati:**
- Estensione PHP ImageMagick (`php-imagick`) per supporto HEIC/HEIF
- Almeno 512MB di limite memoria PHP

#### Verifica Installazione PHP

Crea un file chiamato `phpinfo.php` con:
```php
<?php phpinfo(); ?>
```

Caricalo sul server e accedi via browser. Controlla:
- Versione PHP (deve essere 8.2+)
- GD Library (abilitata)
- ImageMagick (opzionale, per supporto HEIC)
- ZipArchive (abilitato)

#### Passaggi Installazione

##### Opzione 1: Upload Diretto

1. **Scarica il file**:
   - Scarica `php-image-converter.php` dal repository

2. **Carica sul server**:
   - Usa client FTP/SFTP (FileZilla, Cyberduck, ecc.)
   - Carica nella directory web (es. `public_html/`, `www/`, `htdocs/`)

3. **Imposta permessi** (server Linux/Unix):
   ```bash
   chmod 644 php-image-converter.php
   ```

4. **Accedi al convertitore**:
   - Apri browser
   - Naviga su: `http://tuodominio.com/php-image-converter.php`

##### Opzione 2: Git Clone (per sviluppatori)

1. **Clona il repository Utility Forge** (questo tool vive al suo interno come cartella
   autonoma):
   ```bash
   git clone https://github.com/chiaraberti13/Utility-Forge.git
   cd Utility-Forge/php-image-converter
   ```

2. **Copia nella directory web**:
   ```bash
   cp php-image-converter.php /percorso/del/tuo/webroot/
   ```

3. **Accedi al convertitore**:
   ```
   http://tuodominio.com/php-image-converter.php
   ```

---

### Configurazione PHP

#### Impostazioni php.ini Consigliate

Per prestazioni ottimali, configura queste impostazioni:

```ini
# Limite memoria (per immagini grandi)
memory_limit = 512M

# Tempo massimo esecuzione (per elaborazione batch)
max_execution_time = 300

# Dimensione upload file (regola in base alle tue esigenze)
upload_max_filesize = 100M
post_max_size = 100M

# Abilita estensioni richieste
extension=gd
extension=zip
extension=imagick  ; Opzionale ma consigliato
```

#### Come Modificare Impostazioni PHP

**Opzione A: Modifica php.ini (richiede accesso server)**
1. Trova il tuo file `php.ini`
2. Modifica i valori sopra
3. Riavvia server web (Apache/Nginx)

**Opzione B: Usa .htaccess (solo Apache)**

Crea/modifica `.htaccess` nella stessa directory di `php-image-converter.php`:

```apache
php_value memory_limit 512M
php_value max_execution_time 300
php_value upload_max_filesize 100M
php_value post_max_size 100M
```

**Opzione C: Usa .user.ini (alcuni hosting condivisi)**

Crea `.user.ini` nella stessa directory di `php-image-converter.php`:

```ini
memory_limit = 512M
max_execution_time = 300
upload_max_filesize = 100M
post_max_size = 100M
```

---

### Installazione Estensioni PHP

#### Su Ubuntu/Debian:

```bash
# Aggiorna lista pacchetti
sudo apt update

# Installa PHP GD (obbligatorio)
sudo apt install php-gd

# Installa PHP ImageMagick (opzionale)
sudo apt install php-imagick

# Installa PHP Zip (obbligatorio)
sudo apt install php-zip

# Riavvia server web
sudo systemctl restart apache2
# OPPURE per Nginx con PHP-FPM:
sudo systemctl restart php8.3-fpm
```

#### Su CentOS/RHEL:

```bash
# Installa PHP GD
sudo yum install php-gd

# Installa PHP ImageMagick
sudo yum install php-pecl-imagick

# Installa PHP Zip
sudo yum install php-zip

# Riavvia server web
sudo systemctl restart httpd
```

#### Su macOS (con Homebrew):

```bash
# Installa PHP
brew install php

# GD è solitamente incluso di default
# Per installare ImageMagick:
brew install imagemagick
brew install pkg-config
pecl install imagick

# Riavvia PHP (se usi server integrato)
brew services restart php
```

#### Su Windows (XAMPP/WAMP):

1. Apri file `php.ini`
2. Trova e decommenta queste righe (rimuovi il `;`):
   ```ini
   extension=gd
   extension=zip
   extension=imagick
   ```
3. Riavvia Apache

---

### Risoluzione Problemi

#### Problema: "Call to undefined function imagecreatefromjpeg()"
**Soluzione**: Libreria GD non installata. Installa `php-gd` e riavvia server web.

#### Problema: "Maximum execution time exceeded"
**Soluzione**: Aumenta `max_execution_time` in php.ini o .htaccess.

#### Problema: "Allowed memory size exhausted"
**Soluzione**: Aumenta `memory_limit` in php.ini o .htaccess.

#### Problema: "File HEIC/HEIF non convertono"
**Soluzione**: Installa estensione ImageMagick (`php-imagick`).

#### Problema: "Cannot write to temp directory"
**Soluzione**: Assicurati che l'utente del server web abbia permessi di scrittura sulla directory temp.

#### Problema: Upload file fallisce
**Soluzione**: Controlla impostazioni `upload_max_filesize` e `post_max_size`.

---

### Considerazioni Sicurezza

Lo script include diverse protezioni già attive — vedi la sezione "🔒 Sicurezza" del
[`README.md`](README.md) per l'elenco completo. In breve:

1. **Directory di upload**: directory temp di sistema, in una sottocartella per-sessione unica
   creata con permessi `0700` (leggibile/scrivibile solo dal processo PHP)
2. **Validazione sul contenuto reale**: gli upload vengono verificati con `finfo` in base al MIME
   type reale, non solo all'estensione, e le immagini troppo grandi (rischio "decompression
   bomb") vengono rifiutate
3. **Protezione CSRF**: ogni richiesta che modifica lo stato (upload, conversione, rimozione,
   rinomina, cancellazione) richiede un token per-sessione
4. **Nomi file e header sicuri**: i nomi file vengono sanificati prima di essere usati in un
   header HTTP, su disco o dentro lo ZIP; i download usano un `Content-Disposition` conforme a
   RFC 6266
5. **Cookie di sessione rinforzato**: `HttpOnly`, `SameSite=Strict` e `Secure` quando servito via
   HTTPS
6. **Header di sicurezza in risposta**: `Content-Security-Policy`, `X-Content-Type-Options`,
   `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` su ogni risposta
7. **Pulizia**: i file convertiti vengono eliminati automaticamente dopo 1 ora; puoi comunque
   aggiungere un cron job per maggiore tranquillità

Quello che questo script **non** fa al posto tuo: servirsi in HTTPS, mantenere PHP/GD/ImageMagick
aggiornati, o limitare *chi* può raggiungere l'URL — resta responsabilità di chi lo mette online.

Opzionale: aggiungi comunque una pulizia automatica con cron, come ulteriore livello di difesa:
```bash
# Pulisci vecchi file temp giornalmente (Linux)
0 2 * * * find /tmp -name "image_converter_*" -mtime +1 -exec rm -rf {} \;
```

---

### Test Installazione

1. **Accedi al convertitore** nel browser
2. **Carica un'immagine di test** (es. un file JPG)
3. **Seleziona formato di destinazione** (es. PNG)
4. **Clicca "Converti"**
5. **Scarica il risultato**

Se tutti i passaggi funzionano, l'installazione è riuscita! ✅

---

## 📞 Support / Supporto

If you encounter any issues during installation, please:
- Check the troubleshooting section above
- Verify your PHP version and extensions
- Open an issue on GitHub with detailed error messages

Se riscontri problemi durante l'installazione:
- Controlla la sezione risoluzione problemi sopra
- Verifica versione PHP ed estensioni
- Apri un issue su GitHub con messaggi di errore dettagliati

---

**Made with © by Chiara Berti 13**
