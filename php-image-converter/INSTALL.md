# 🚀 Installation Guide / Guida all'Installazione

---

## 🇬🇧 English

### Quick Start

The simplest way to get started:

1. Download `converter.php`
2. Upload to your web server
3. Access via browser: `http://yourdomain.com/converter.php`

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
   - Download `converter.php` from the repository

2. **Upload to server**:
   - Use FTP/SFTP client (FileZilla, Cyberduck, etc.)
   - Upload to your web directory (e.g., `public_html/`, `www/`, `htdocs/`)

3. **Set permissions** (Linux/Unix servers):
   ```bash
   chmod 644 converter.php
   ```

4. **Access the converter**:
   - Open browser
   - Navigate to: `http://yourdomain.com/converter.php`

##### Option 2: Git Clone (for developers)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/php-image-converter.git
   cd php-image-converter
   ```

2. **Copy to web directory**:
   ```bash
   cp converter.php /path/to/your/webroot/
   ```

3. **Access the converter**:
   ```
   http://yourdomain.com/converter.php
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

Create/edit `.htaccess` in the same directory as `converter.php`:

```apache
php_value memory_limit 512M
php_value max_execution_time 300
php_value upload_max_filesize 100M
php_value post_max_size 100M
```

**Option C: Use .user.ini (some shared hosts)**

Create `.user.ini` in the same directory as `converter.php`:

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

1. **File Upload Directory**: The converter uses system temp directory with unique session-based subdirectories
2. **File Validation**: Only accepted image formats are processed
3. **Session Security**: Files are isolated per session
4. **Cleanup**: Temporary files can be cleaned manually or with cron jobs

Optional: Add automatic cleanup with cron:
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

1. Scarica `converter.php`
2. Carica sul tuo server web
3. Accedi via browser: `http://tuodominio.com/converter.php`

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
   - Scarica `converter.php` dal repository

2. **Carica sul server**:
   - Usa client FTP/SFTP (FileZilla, Cyberduck, ecc.)
   - Carica nella directory web (es. `public_html/`, `www/`, `htdocs/`)

3. **Imposta permessi** (server Linux/Unix):
   ```bash
   chmod 644 converter.php
   ```

4. **Accedi al convertitore**:
   - Apri browser
   - Naviga su: `http://tuodominio.com/converter.php`

##### Opzione 2: Git Clone (per sviluppatori)

1. **Clona il repository**:
   ```bash
   git clone https://github.com/yourusername/php-image-converter.git
   cd php-image-converter
   ```

2. **Copia nella directory web**:
   ```bash
   cp converter.php /percorso/del/tuo/webroot/
   ```

3. **Accedi al convertitore**:
   ```
   http://tuodominio.com/converter.php
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

Crea/modifica `.htaccess` nella stessa directory di `converter.php`:

```apache
php_value memory_limit 512M
php_value max_execution_time 300
php_value upload_max_filesize 100M
php_value post_max_size 100M
```

**Opzione C: Usa .user.ini (alcuni hosting condivisi)**

Crea `.user.ini` nella stessa directory di `converter.php`:

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

1. **Directory Upload File**: Il convertitore usa directory temp di sistema con sottodirectory uniche basate su sessione
2. **Validazione File**: Solo formati immagine accettati vengono elaborati
3. **Sicurezza Sessione**: I file sono isolati per sessione
4. **Pulizia**: I file temporanei possono essere puliti manualmente o con cron job

Opzionale: Aggiungi pulizia automatica con cron:
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
