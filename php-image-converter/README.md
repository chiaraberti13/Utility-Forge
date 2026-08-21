# 🖼️ PHP Image Converter

> 🇬🇧 **English** | 🇮🇹 [Italiano](README-IT.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PHP Version](https://img.shields.io/badge/PHP-8.2%2B-purple.svg)](https://www.php.net/)
[![Made with ❤️](https://img.shields.io/badge/Made%20with-❤️-red.svg)](https://github.com/chiaraberti13)

---

A powerful, self-contained PHP image converter with an intuitive web interface. Convert images between multiple formats with advanced options like resizing, cropping, and quality control — all in a single, hardened PHP file you drop straight onto your own server, with no database and no external service involved.

## ✨ Key Features

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

## 📋 Requirements

- **PHP**: 8.2 or higher
- **PHP GD Library**: `php-gd` (required)
- **ImageMagick Extension**: `php-imagick` (recommended for TIFF/HEIC support)
- **ZipArchive Support**: For batch download functionality
- **Memory**: At least 512MB PHP memory limit
- **Upload Size**: Recommended 100MB max upload size

## 🚀 Installation

This tool is a **single, self-contained PHP file**: `php-image-converter.php`. That one file is
all you need on the server — everything else in this folder (`README.md`, `INSTALL.md`,
`LICENSE`) is documentation, not required at runtime.

1. **Get the file** — either clone the whole Utility Forge repository and use this folder:
   ```bash
   git clone https://github.com/chiaraberti13/Utility-Forge.git
   cd Utility-Forge/php-image-converter
   ```
   or just download `php-image-converter.php` on its own from the
   [`php-image-converter/`](.) folder on GitHub.

2. **Upload it to your web server** (FTP/SFTP, `scp`, your host's file manager — whatever you
   normally use):
   - Copy `php-image-converter.php` into a web-accessible directory
   - Make sure the PHP process can write to the system temp directory — it's where uploads and
     converted files are kept for up to 1 hour before automatic cleanup

3. **Check the required PHP extensions are enabled** on the server:
   ```bash
   php -m | grep -E "gd|fileinfo|zip|imagick"
   ```
   `gd`, `fileinfo` and `zip` are **required**; `imagick` is **optional** (only needed for TIFF
   output and for some HEIC/HEIF sources GD alone can't decode).

4. **Raise PHP's limits if your host caps them lower than this script needs.** The script already
   sets these at runtime via `ini_set()`, but a restrictive `php.ini` can still override it — if
   so, adjust `php.ini`, a per-directory `.user.ini`, or `.htaccess`:
   ```ini
   memory_limit = 512M
   max_execution_time = 300
   upload_max_filesize = 100M
   post_max_size = 100M
   ```

5. **Serve it over HTTPS if at all possible.** The session cookie is automatically marked
   `Secure` the moment the request arrives over HTTPS (directly, or via a reverse proxy sending
   `X-Forwarded-Proto: https`) — over plain HTTP it still works, just without that extra
   protection.

6. **Open it**:
   Navigate to `https://yourdomain.com/php-image-converter.php` in your browser — no setup
   wizard, no database migration, no account to create.

## 📖 Usage

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

## 🎛️ Advanced Features

### Image Transformations
- **Resize**: Specify target dimensions while maintaining aspect ratio
- **Crop**: Choose from 9 aspect ratio presets (1:1, 16:9, 4:3, 21:9, 3:2, 5:4, 9:16, 2:3, 4:5)
- **Quality Control**: Adjust compression level for lossy formats

### File Naming Options
- **Preserve original name**: `photo.jpg` → `photo.png`
- **Add suffix**: `photo.jpg` → `photo_converted.png`
- **Add prefix**: `photo.jpg` → `converted_photo.png`

### Batch Operations
- Convert multiple files in one go
- Set same format for all files
- Download all converted files as ZIP

## 🔧 Technical Details

- **Backend**: Pure PHP with GD Library
- **Optional**: ImageMagick for HEIC/HEIF and complex TIFF support
- **Session Management**: Temporary files stored in system temp directory, in a folder created with
  `0700` permissions (readable only by the PHP process)
- **Performance**: Optimized memory usage, configurable timeouts

## 🔒 Security

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

## 🌐 Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Opera (latest)

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Chiara Berti 13**

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## 🐛 Bug Reports

If you find a bug, please open an issue with:
- Description of the problem
- Steps to reproduce
- Expected behavior
- Screenshots (if applicable)

---

**Made with ❤️ by Chiara Berti 13**

© 2026 - Licensed under MIT License
