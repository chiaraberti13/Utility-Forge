<?php
/**
 * Image Converter by Chiara Berti
 * PHP 8 Version - All-in-One File - Hardened Edition
 *
 * Requirements:
 * - PHP 8.2+ (tested up to 8.4)
 * - GD Library (php-gd)
 * - ImageMagick extension (php-imagick) - Recommended for TIFF/HEIC support
 * - ZipArchive support
 *
 * Security notes:
 * - Every state-changing request (upload, convert, remove, ...) requires a
 *   per-session CSRF token.
 * - Uploaded files are validated by their real content (finfo + getimagesize),
 *   not just by their extension.
 * - Any filename coming from the client (original name, prefix/suffix) is
 *   sanitized before being reused in an HTTP header, on disk or inside the ZIP
 *   archive, to prevent header injection and "zip slip" path traversal.
 * - Image dimensions are capped to prevent decompression-bomb style memory
 *   exhaustion.
 */

// --- Sessione sicura: va configurata PRIMA di session_start() ---
$isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');

ini_set('session.use_strict_mode', '1');
ini_set('session.cookie_httponly', '1');
ini_set('session.cookie_samesite', 'Strict');
ini_set('session.cookie_secure', $isHttps ? '1' : '0');

session_start();
error_reporting(E_ALL);
ini_set('display_errors', 0); // Disabilita in produzione
ini_set('memory_limit', '512M');
ini_set('max_execution_time', 300);
ini_set('upload_max_filesize', '100M');
ini_set('post_max_size', '100M');

// --- Header di sicurezza per ogni risposta ---
// Nonce CSP generato ad ogni richiesta: gli unici due <script> inline della pagina (lo script
// anti-flash del tema in <head> e lo script applicativo in fondo al <body>, che contiene il CSRF
// token e altri valori interpolati da PHP, quindi non è mai testualmente identico da una richiesta
// all'altra) sono autorizzati tramite questo nonce invece che tramite un hash SHA-256 statico, che
// non potrebbe mai corrispondere al contenuto dinamico.
$cspNonce = base64_encode(random_bytes(16));
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: no-referrer');
header("Content-Security-Policy: default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; script-src 'self' 'nonce-$cspNonce' https://unpkg.com; base-uri 'none'; form-action 'self'");
header('Permissions-Policy: geolocation=(), camera=(), microphone=()');

// Costanti
define('MAX_FILE_SIZE_MB', 100);
define('MAX_FILE_SIZE_BYTES', MAX_FILE_SIZE_MB * 1024 * 1024);
define('MAX_FILES_PER_SESSION', 100); // limita l'abuso/esaurimento risorse
define('MAX_IMAGE_MEGAPIXELS', 60); // protegge da immagini "decompression bomb"
define('MAX_OUTPUT_DIMENSION', 10000); // px, per resize/crop
define('UPLOAD_DIR', sys_get_temp_dir() . '/image_converter_' . session_id() . '/');
define('SUPPORTED_INPUT_EXTENSIONS', ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'tif', 'heic', 'heif']);

/**
 * Formati di output disponibili, calcolati in base a cosa il server supporta
 * davvero a runtime (es. AVIF richiede PHP 8.1+ con libavif).
 */
function getSupportedOutputFormats(): array {
    $formats = ['JPG', 'PNG', 'WEBP', 'BMP', 'GIF'];
    if (extension_loaded('imagick')) {
        $formats[] = 'TIFF';
    }
    if (function_exists('imageavif')) {
        $formats[] = 'AVIF'; // formato avanzato, più efficiente di WEBP a parità di qualità
    }
    return $formats;
}
define('SUPPORTED_FORMATS', getSupportedOutputFormats());

// Crea directory di upload se non esiste, leggibile/scrivibile solo dal processo PHP
if (!file_exists(UPLOAD_DIR)) {
    mkdir(UPLOAD_DIR, 0700, true);
}
chmod(UPLOAD_DIR, 0700);

// Inizializza sessione file
if (!isset($_SESSION['files'])) {
    $_SESSION['files'] = [];
}

// --- CSRF token: richiesto su ogni endpoint che modifica lo stato ---
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

function requireValidCsrfToken(): void {
    $token = $_POST['csrf_token'] ?? '';
    if (!is_string($token) || $token === '' || !hash_equals($_SESSION['csrf_token'], $token)) {
        header('Content-Type: application/json');
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Token di sicurezza mancante o non valido, ricarica la pagina']);
        exit;
    }
}

/**
 * Rimuove ogni carattere pericoloso da un nome fornito dal client, così che
 * possa essere riusato in sicurezza in un header HTTP, su disco o come voce
 * di un archivio ZIP (previene header injection e "zip slip").
 */
function sanitizeFilenameComponent(string $name, string $fallback = 'file'): string {
    $name = basename($name);
    // Rimuove caratteri di controllo, CR/LF e caratteri riservati (header/Windows/ZIP)
    $name = preg_replace('/[\x00-\x1F\x7F"\\\\\/:*?<>|]/', '', $name) ?? '';
    $name = trim($name, " .\t");
    if ($name === '') {
        $name = $fallback;
    }
    return mb_substr($name, 0, 180);
}

/**
 * Costruisce un header Content-Disposition sicuro (RFC 6266), con fallback
 * ASCII e nome UTF-8 percent-encoded, a partire da un nome file arbitrario.
 */
function buildContentDispositionHeader(string $filename): string {
    $filename = sanitizeFilenameComponent($filename, 'download');
    $asciiFallback = preg_replace('/[^\x20-\x7E]/', '_', $filename) ?? 'download';
    $asciiFallback = str_replace(['"', '\\'], '_', $asciiFallback);
    $encoded = rawurlencode($filename);
    return 'Content-Disposition: attachment; filename="' . $asciiFallback . '"; filename*=UTF-8\'\'' . $encoded;
}

/**
 * Valida un file caricato in base al contenuto reale (non solo all'estensione
 * dichiarata) e ne limita le dimensioni per evitare "decompression bomb".
 */
function validateUploadedImage(array $file): array {
    $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

    if (!in_array($extension, SUPPORTED_INPUT_EXTENSIONS, true)) {
        return ['valid' => false, 'error' => 'Tipo di file non supportato'];
    }

    $allowedMimes = [
        'jpg' => ['image/jpeg'], 'jpeg' => ['image/jpeg'],
        'png' => ['image/png'],
        'webp' => ['image/webp'],
        'gif' => ['image/gif'],
        'bmp' => ['image/bmp', 'image/x-ms-bmp'],
        'tiff' => ['image/tiff'], 'tif' => ['image/tiff'],
        // libmagic spesso riconosce HEIC/HEIF come octet-stream: viene comunque
        // validato più avanti da Imagick/getimagesize prima di essere elaborato.
        'heic' => ['image/heic', 'image/heif', 'application/octet-stream'],
        'heif' => ['image/heif', 'image/heic', 'application/octet-stream'],
    ];

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $realMime = $finfo->file($file['tmp_name']) ?: '';

    if (!in_array($realMime, $allowedMimes[$extension] ?? [], true)) {
        return ['valid' => false, 'error' => 'Il contenuto del file non corrisponde all\'estensione dichiarata'];
    }

    $dimensions = @getimagesize($file['tmp_name']);
    if ($dimensions !== false) {
        $megapixels = ($dimensions[0] * $dimensions[1]) / 1_000_000;
        if ($megapixels > MAX_IMAGE_MEGAPIXELS) {
            return ['valid' => false, 'error' => 'Immagine troppo grande (oltre ' . MAX_IMAGE_MEGAPIXELS . ' megapixel)'];
        }
    }

    return ['valid' => true];
}

/**
 * Classe principale per la conversione immagini
 */
class ImageConverter {

    private bool $imagick_available = false;

    public function __construct() {
        $this->imagick_available = extension_loaded('imagick');
    }

    /**
     * Converte un'immagine nel formato specificato
     */
    public function convert(
        string $sourcePath,
        string $targetFormat,
        int $quality = 92,
        ?array $resizeOptions = null,
        ?array $cropOptions = null
    ): array {
        try {
            // Carica l'immagine sorgente
            $image = $this->loadImage($sourcePath);
            
            if (!$image) {
                throw new Exception("Impossibile caricare l'immagine");
            }
            
            $width = imagesx($image);
            $height = imagesy($image);
            $this->assertSafeDimensions($width, $height);

            // Applica crop se necessario
            if ($cropOptions && $cropOptions['enabled'] && $cropOptions['aspectRatio']) {
                $image = $this->applyCrop($image, $width, $height, $cropOptions['aspectRatio']);
                $width = imagesx($image);
                $height = imagesy($image);
            }
            
            // Applica resize se necessario
            if ($resizeOptions && $resizeOptions['enabled']) {
                $image = $this->applyResize($image, $width, $height, $resizeOptions);
                $width = imagesx($image);
                $height = imagesy($image);
            }
            
            // Genera nome file output
            $outputPath = UPLOAD_DIR . uniqid('converted_', true);
            
            // Converti nel formato target
            $result = $this->saveImage($image, $outputPath, $targetFormat, $quality);
            
            imagedestroy($image);
            
            return $result;

        } catch (\Throwable $e) {
            error_log("Errore conversione: " . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Carica un'immagine da file
     */
    private function loadImage(string $path): \GdImage|false {
        $imageInfo = @getimagesize($path);

        if (!$imageInfo) {
            // Prova con ImageMagick per formati speciali (HEIC, TIFF complessi)
            if ($this->imagick_available) {
                return $this->loadWithImageMagick($path);
            }
            return false;
        }

        $mimeType = $imageInfo['mime'];

        return match ($mimeType) {
            'image/jpeg' => imagecreatefromjpeg($path),
            'image/png'  => imagecreatefrompng($path),
            'image/gif'  => imagecreatefromgif($path),
            'image/bmp', 'image/x-ms-bmp' => imagecreatefrombmp($path),
            'image/webp' => imagecreatefromwebp($path),
            // TIFF richiede ImageMagick
            'image/tiff' => $this->imagick_available
                ? $this->loadWithImageMagick($path)
                : throw new Exception("TIFF richiede l'estensione ImageMagick"),
            // Prova comunque con ImageMagick per gli altri formati (es. HEIC)
            default => $this->imagick_available
                ? $this->loadWithImageMagick($path)
                : throw new Exception("Formato immagine non supportato: " . $mimeType),
        };
    }

    /**
     * Carica immagine usando ImageMagick (per formati speciali)
     */
    private function loadWithImageMagick(string $path): \GdImage|false {
        try {
            $imagick = new Imagick($path);
            
            // Converti in RGB se necessario
            if ($imagick->getImageColorspace() !== Imagick::COLORSPACE_RGB) {
                $imagick->setImageColorspace(Imagick::COLORSPACE_RGB);
            }
            
            // Converti a risorsa GD
            $imagick->setImageFormat('png');
            $blob = $imagick->getImageBlob();
            
            $image = imagecreatefromstring($blob);
            $imagick->clear();
            $imagick->destroy();
            
            return $image;

        } catch (\Throwable $e) {
            error_log("Errore ImageMagick: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Verifica che le dimensioni richieste non permettano un esaurimento di
     * memoria ("decompression bomb") o richieste di output abnormi.
     */
    private function assertSafeDimensions(float $width, float $height): void {
        if ($width < 1 || $height < 1) {
            throw new Exception('Dimensioni immagine non valide');
        }
        if ($width > MAX_OUTPUT_DIMENSION || $height > MAX_OUTPUT_DIMENSION) {
            throw new Exception('Dimensioni richieste troppo grandi (max ' . MAX_OUTPUT_DIMENSION . 'px per lato)');
        }
        if (($width * $height) > (MAX_IMAGE_MEGAPIXELS * 1_000_000)) {
            throw new Exception('Immagine risultante troppo grande (max ' . MAX_IMAGE_MEGAPIXELS . ' megapixel)');
        }
    }

    /**
     * Applica ritaglio all'immagine
     */
    private function applyCrop(\GdImage $image, int $width, int $height, string $aspectRatio): \GdImage {
        $allowedRatios = ['1:1', '16:9', '9:16', '4:3', '3:4'];
        if (!in_array($aspectRatio, $allowedRatios, true)) {
            $aspectRatio = '1:1';
        }
        list($ratioW, $ratioH) = explode(':', $aspectRatio);
        $targetRatio = (float)$ratioW / (float)$ratioH;
        $imageRatio = $width / $height;
        
        $sourceX = 0;
        $sourceY = 0;
        $sourceWidth = $width;
        $sourceHeight = $height;
        
        if ($imageRatio > $targetRatio) {
            // Immagine più larga, ritaglia i lati
            $sourceWidth = $height * $targetRatio;
            $sourceX = ($width - $sourceWidth) / 2;
        } elseif ($imageRatio < $targetRatio) {
            // Immagine più alta, ritaglia sopra/sotto
            $sourceHeight = $width / $targetRatio;
            $sourceY = ($height - $sourceHeight) / 2;
        }
        
        $this->assertSafeDimensions($sourceWidth, $sourceHeight);
        $croppedImage = imagecreatetruecolor((int)$sourceWidth, (int)$sourceHeight);
        
        // Preserva trasparenza per PNG
        imagealphablending($croppedImage, false);
        imagesavealpha($croppedImage, true);
        
        imagecopyresampled(
            $croppedImage, $image,
            0, 0,
            (int)$sourceX, (int)$sourceY,
            (int)$sourceWidth, (int)$sourceHeight,
            (int)$sourceWidth, (int)$sourceHeight
        );
        
        imagedestroy($image);
        return $croppedImage;
    }
    
    /**
     * Applica ridimensionamento all'immagine
     */
    private function applyResize(\GdImage $image, int $width, int $height, array $resizeOptions): \GdImage {
        $targetWidth = $resizeOptions['width'] ? min((int)$resizeOptions['width'], MAX_OUTPUT_DIMENSION) : null;
        $targetHeight = $resizeOptions['height'] ? min((int)$resizeOptions['height'], MAX_OUTPUT_DIMENSION) : null;
        
        // Calcola dimensioni mantenendo aspect ratio se necessario
        if ($targetWidth && $targetHeight) {
            // Entrambe le dimensioni specificate
            $newWidth = $targetWidth;
            $newHeight = $targetHeight;
        } elseif ($targetWidth) {
            // Solo larghezza specificata
            $aspectRatio = $width / $height;
            $newWidth = $targetWidth;
            $newHeight = $targetWidth / $aspectRatio;
        } elseif ($targetHeight) {
            // Solo altezza specificata
            $aspectRatio = $width / $height;
            $newHeight = $targetHeight;
            $newWidth = $targetHeight * $aspectRatio;
        } else {
            // Nessuna dimensione specificata, ritorna l'originale
            return $image;
        }
        
        $this->assertSafeDimensions($newWidth, $newHeight);
        $resizedImage = imagecreatetruecolor((int)$newWidth, (int)$newHeight);
        
        // Preserva trasparenza per PNG
        imagealphablending($resizedImage, false);
        imagesavealpha($resizedImage, true);
        
        imagecopyresampled(
            $resizedImage, $image,
            0, 0, 0, 0,
            (int)$newWidth, (int)$newHeight,
            $width, $height
        );
        
        imagedestroy($image);
        return $resizedImage;
    }
    
    /**
     * Salva l'immagine nel formato specificato
     */
    private function saveImage(\GdImage $image, string $basePath, string $format, int $quality): array {
        $format = strtoupper($format);
        $extension = strtolower($format);
        
        // Gestisci estensioni speciali
        if ($format === 'JPG') {
            $extension = 'jpg';
            $mimeType = 'image/jpeg';
        } elseif ($format === 'TIFF') {
            $extension = 'tiff';
            $mimeType = 'image/tiff';
        } else {
            $extension = strtolower($format);
            $mimeType = 'image/' . $extension;
        }
        
        $outputPath = $basePath . '.' . $extension;
        
        // Converti qualità da 0-100 a 0-9 per PNG
        $pngQuality = 9 - (int)(($quality / 100) * 9);
        
        try {
            switch ($format) {
                case 'JPG':
                    // Crea sfondo bianco per JPG (no trasparenza)
                    $jpgImage = imagecreatetruecolor(imagesx($image), imagesy($image));
                    $white = imagecolorallocate($jpgImage, 255, 255, 255);
                    imagefill($jpgImage, 0, 0, $white);
                    imagecopy($jpgImage, $image, 0, 0, 0, 0, imagesx($image), imagesy($image));
                    
                    $success = imagejpeg($jpgImage, $outputPath, $quality);
                    imagedestroy($jpgImage);
                    break;
                    
                case 'PNG':
                    imagesavealpha($image, true);
                    $success = imagepng($image, $outputPath, $pngQuality);
                    break;
                    
                case 'WEBP':
                    $success = imagewebp($image, $outputPath, $quality);
                    break;
                    
                case 'GIF':
                    $success = imagegif($image, $outputPath);
                    break;

                case 'AVIF':
                    if (!function_exists('imageavif')) {
                        throw new Exception("AVIF non supportato su questo server");
                    }
                    imagesavealpha($image, true);
                    $success = imageavif($image, $outputPath, $quality);
                    break;

                case 'BMP':
                    // Crea sfondo bianco per BMP (no trasparenza)
                    $bmpImage = imagecreatetruecolor(imagesx($image), imagesy($image));
                    $white = imagecolorallocate($bmpImage, 255, 255, 255);
                    imagefill($bmpImage, 0, 0, $white);
                    imagecopy($bmpImage, $image, 0, 0, 0, 0, imagesx($image), imagesy($image));
                    
                    $success = imagebmp($bmpImage, $outputPath);
                    imagedestroy($bmpImage);
                    break;
                    
                case 'TIFF':
                    // TIFF richiede ImageMagick
                    if (!$this->imagick_available) {
                        throw new Exception("TIFF richiede l'estensione ImageMagick");
                    }
                    
                    // Salva come PNG temporaneamente
                    $tempPath = $basePath . '_temp.png';
                    imagepng($image, $tempPath);
                    
                    // Converti in TIFF con ImageMagick
                    $imagick = new Imagick($tempPath);
                    $imagick->setImageFormat('tiff');
                    $imagick->setImageCompression(Imagick::COMPRESSION_LZW);
                    $imagick->writeImage($outputPath);
                    $imagick->clear();
                    $imagick->destroy();
                    
                    unlink($tempPath);
                    $success = true;
                    break;
                    
                case 'HEIC':
                case 'HEIF':
                    // HEIC non supportato per output, converti in PNG
                    imagesavealpha($image, true);
                    $outputPath = $basePath . '.png';
                    $extension = 'png';
                    $mimeType = 'image/png';
                    $success = imagepng($image, $outputPath, $pngQuality);
                    break;
                    
                default:
                    throw new Exception("Formato di output non supportato: " . $format);
            }
            
            if (!$success) {
                throw new Exception("Errore durante il salvataggio dell'immagine");
            }
            
            return [
                'success' => true,
                'path' => $outputPath,
                'size' => filesize($outputPath),
                'extension' => $extension,
                'mimeType' => $mimeType
            ];
            
        } catch (\Throwable $e) {
            error_log("Errore salvataggio immagine: " . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
}

/**
 * Funzioni di utilità
 */
function formatFileSize(int $bytes): string {
    if ($bytes === 0) return '0 Bytes';
    $k = 1024;
    $sizes = ['Bytes', 'KB', 'MB', 'GB'];
    $i = (int)floor(log($bytes) / log($k));
    return round($bytes / pow($k, $i), 2) . ' ' . $sizes[$i];
}

function generateFilename(string $originalName, string $targetFormat, array $namingConvention): string {
    $pathInfo = pathinfo($originalName);
    $nameWithoutExtension = $pathInfo['filename'];

    // Gestisci estensione TIFF speciale
    $extension = strtolower($targetFormat);
    if ($targetFormat === 'TIFF') {
        // Preserva .tif se l'originale era .tif
        $originalExtension = strtolower($pathInfo['extension'] ?? '');
        if ($originalExtension === 'tif') {
            $extension = 'tif';
        } else {
            $extension = 'tiff';
        }
    } elseif ($targetFormat === 'JPG') {
        $extension = 'jpg';
    } elseif (in_array($targetFormat, ['HEIC', 'HEIF'])) {
        // HEIC/HEIF output diventa PNG
        $extension = 'png';
    }
    
    // Prefisso/suffisso sono già sanificati in updateNaming; ri-sanifichiamo comunque
    // qui in difesa in profondità, dato che il risultato finisce in header HTTP e ZIP.
    $prefix = sanitizeFilenameComponent($namingConvention['prefix'] ?? 'converted_', 'converted_');
    $suffix = sanitizeFilenameComponent($namingConvention['suffix'] ?? '_converted', '_converted');

    $result = match ($namingConvention['type']) {
        'prefix' => $prefix . $nameWithoutExtension . '.' . $extension,
        'suffix' => $nameWithoutExtension . $suffix . '.' . $extension,
        default => $nameWithoutExtension . '.' . $extension,
    };

    return sanitizeFilenameComponent($result, 'converted.' . $extension);
}

function cleanupOldFiles(): void {
    // Pulisci file più vecchi di 1 ora
    $files = glob(UPLOAD_DIR . '*');
    $now = time();
    
    foreach ($files as $file) {
        if (is_file($file) && ($now - filemtime($file)) > 3600) {
            unlink($file);
        }
    }
}

/**
 * API Endpoints
 */

// Upload file
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' && isset($_POST['action']) && $_POST['action'] === 'upload') {
    header('Content-Type: application/json');
    requireValidCsrfToken();

    if (!isset($_FILES['files'])) {
        echo json_encode(['success' => false, 'error' => 'Nessun file caricato']);
        exit;
    }

    $uploadedFiles = [];
    $files = $_FILES['files'];

    // Gestisci upload multipli
    if (is_array($files['name'])) {
        for ($i = 0; $i < count($files['name']); $i++) {
            if (count($_SESSION['files']) >= MAX_FILES_PER_SESSION) {
                $uploadedFiles[] = [
                    'success' => false,
                    'filename' => $files['name'][$i],
                    'error' => 'Limite di ' . MAX_FILES_PER_SESSION . ' file per sessione raggiunto'
                ];
                continue;
            }

            $file = [
                'name' => $files['name'][$i],
                'type' => $files['type'][$i],
                'tmp_name' => $files['tmp_name'][$i],
                'error' => $files['error'][$i],
                'size' => $files['size'][$i]
            ];

            if ($file['error'] === UPLOAD_ERR_OK) {
                // Verifica il contenuto reale del file (magic bytes), non solo l'estensione
                $validation = validateUploadedImage($file);
                if (!$validation['valid']) {
                    $uploadedFiles[] = [
                        'success' => false,
                        'filename' => $file['name'],
                        'error' => $validation['error']
                    ];
                    continue;
                }

                if ($file['size'] > MAX_FILE_SIZE_BYTES) {
                    $uploadedFiles[] = [
                        'success' => false,
                        'filename' => $file['name'],
                        'error' => 'File troppo grande (max ' . MAX_FILE_SIZE_MB . 'MB)'
                    ];
                    continue;
                }

                $safeName = sanitizeFilenameComponent($file['name'], 'image');
                $fileId = uniqid('file_', true);
                $destination = UPLOAD_DIR . $fileId . '_' . $safeName;

                if (move_uploaded_file($file['tmp_name'], $destination)) {
                    $_SESSION['files'][$fileId] = [
                        'id' => $fileId,
                        'originalName' => $safeName,
                        'originalSize' => $file['size'],
                        'path' => $destination,
                        'targetFormat' => 'PNG',
                        'status' => 'waiting'
                    ];

                    $uploadedFiles[] = [
                        'success' => true,
                        'id' => $fileId,
                        'filename' => $safeName,
                        'size' => $file['size']
                    ];
                } else {
                    $uploadedFiles[] = [
                        'success' => false,
                        'filename' => $safeName,
                        'error' => 'Errore durante il caricamento'
                    ];
                }
            }
        }
    }

    echo json_encode(['success' => true, 'files' => $uploadedFiles]);
    exit;
}

// Converti file
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' && isset($_POST['action']) && $_POST['action'] === 'convert') {
    header('Content-Type: application/json');
    requireValidCsrfToken();

    $fileId = $_POST['fileId'] ?? '';
    $targetFormat = strtoupper($_POST['targetFormat'] ?? 'PNG');

    if (!in_array($targetFormat, SUPPORTED_FORMATS, true)) {
        echo json_encode(['success' => false, 'error' => 'Formato di output non supportato']);
        exit;
    }

    $quality = max(1, min(100, (int)($_POST['quality'] ?? 92)));

    $resizeOptions = null;
    if (isset($_POST['resizeEnabled']) && $_POST['resizeEnabled'] === 'true') {
        $resizeOptions = [
            'enabled' => true,
            'width' => !empty($_POST['resizeWidth']) ? max(1, min(MAX_OUTPUT_DIMENSION, (int)$_POST['resizeWidth'])) : null,
            'height' => !empty($_POST['resizeHeight']) ? max(1, min(MAX_OUTPUT_DIMENSION, (int)$_POST['resizeHeight'])) : null
        ];
    }

    $cropOptions = null;
    if (isset($_POST['cropEnabled']) && $_POST['cropEnabled'] === 'true') {
        $allowedRatios = ['1:1', '16:9', '9:16', '4:3', '3:4'];
        $ratio = $_POST['cropAspectRatio'] ?? '1:1';
        $cropOptions = [
            'enabled' => true,
            'aspectRatio' => in_array($ratio, $allowedRatios, true) ? $ratio : '1:1'
        ];
    }

    if (!isset($_SESSION['files'][$fileId])) {
        echo json_encode(['success' => false, 'error' => 'File non trovato']);
        exit;
    }
    
    $file = $_SESSION['files'][$fileId];
    $converter = new ImageConverter();
    
    $result = $converter->convert($file['path'], $targetFormat, $quality, $resizeOptions, $cropOptions);
    
    if ($result['success']) {
        $_SESSION['files'][$fileId]['convertedPath'] = $result['path'];
        $_SESSION['files'][$fileId]['convertedSize'] = $result['size'];
        $_SESSION['files'][$fileId]['convertedExtension'] = $result['extension'];
        $_SESSION['files'][$fileId]['targetFormat'] = $targetFormat;
        $_SESSION['files'][$fileId]['status'] = 'done';
        
        echo json_encode([
            'success' => true,
            'id' => $fileId,
            'size' => $result['size'],
            'downloadUrl' => '?action=download&fileId=' . $fileId
        ]);
    } else {
        $_SESSION['files'][$fileId]['status'] = 'error';
        echo json_encode(['success' => false, 'error' => $result['error']]);
    }
    exit;
}

// Download singolo file
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'GET' && isset($_GET['action']) && $_GET['action'] === 'download') {
    $fileId = $_GET['fileId'] ?? '';
    
    if (!isset($_SESSION['files'][$fileId]) || !isset($_SESSION['files'][$fileId]['convertedPath'])) {
        http_response_code(404);
        echo "File non trovato";
        exit;
    }
    
    $file = $_SESSION['files'][$fileId];
    $filePath = $file['convertedPath'];
    
    if (!file_exists($filePath)) {
        http_response_code(404);
        echo "File non trovato";
        exit;
    }
    
    $namingConvention = [
        'type' => $_SESSION['namingConvention']['type'] ?? 'suffix',
        'suffix' => $_SESSION['namingConvention']['suffix'] ?? '_converted',
        'prefix' => $_SESSION['namingConvention']['prefix'] ?? 'converted_'
    ];
    
    $downloadName = generateFilename($file['originalName'], $file['targetFormat'], $namingConvention);

    header('Content-Type: application/octet-stream');
    header(buildContentDispositionHeader($downloadName));
    header('Content-Length: ' . filesize($filePath));
    header('Cache-Control: no-cache, must-revalidate');
    header('Expires: 0');
    
    readfile($filePath);
    exit;
}

// Download ZIP di tutti i file convertiti
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'GET' && isset($_GET['action']) && $_GET['action'] === 'downloadAll') {
    
    $convertedFiles = array_filter($_SESSION['files'], function($file) {
        return $file['status'] === 'done' && isset($file['convertedPath']);
    });
    
    if (empty($convertedFiles)) {
        http_response_code(404);
        echo "Nessun file da scaricare";
        exit;
    }
    
    $zipPath = UPLOAD_DIR . 'converted_images_' . time() . '.zip';
    $zip = new ZipArchive();
    
    if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
        http_response_code(500);
        echo "Errore nella creazione del file ZIP";
        exit;
    }
    
    $namingConvention = [
        'type' => $_SESSION['namingConvention']['type'] ?? 'suffix',
        'suffix' => $_SESSION['namingConvention']['suffix'] ?? '_converted',
        'prefix' => $_SESSION['namingConvention']['prefix'] ?? 'converted_'
    ];
    
    foreach ($convertedFiles as $file) {
        if (file_exists($file['convertedPath'])) {
            $downloadName = generateFilename($file['originalName'], $file['targetFormat'], $namingConvention);
            $zip->addFile($file['convertedPath'], $downloadName);
        }
    }
    
    $zip->close();
    
    header('Content-Type: application/zip');
    header('Content-Disposition: attachment; filename="converted-images.zip"');
    header('Content-Length: ' . filesize($zipPath));
    header('Cache-Control: no-cache, must-revalidate');
    header('Expires: 0');
    
    readfile($zipPath);
    unlink($zipPath);
    exit;
}

// Get lista file
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'GET' && isset($_GET['action']) && $_GET['action'] === 'getFiles') {
    header('Content-Type: application/json');
    
    $filesList = [];
    foreach ($_SESSION['files'] as $file) {
        $filesList[] = [
            'id' => $file['id'],
            'originalName' => $file['originalName'],
            'originalSize' => $file['originalSize'],
            'targetFormat' => $file['targetFormat'],
            'status' => $file['status'],
            'convertedSize' => $file['convertedSize'] ?? null
        ];
    }
    
    echo json_encode(['success' => true, 'files' => $filesList]);
    exit;
}

// Rimuovi file
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' && isset($_POST['action']) && $_POST['action'] === 'removeFile') {
    header('Content-Type: application/json');
    requireValidCsrfToken();

    $fileId = $_POST['fileId'] ?? '';
    
    if (isset($_SESSION['files'][$fileId])) {
        $file = $_SESSION['files'][$fileId];
        
        // Elimina file fisici
        if (file_exists($file['path'])) {
            unlink($file['path']);
        }
        if (isset($file['convertedPath']) && file_exists($file['convertedPath'])) {
            unlink($file['convertedPath']);
        }
        
        unset($_SESSION['files'][$fileId]);
        
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'File non trovato']);
    }
    exit;
}

// Clear all
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' && isset($_POST['action']) && $_POST['action'] === 'clearAll') {
    header('Content-Type: application/json');
    requireValidCsrfToken();

    foreach ($_SESSION['files'] as $file) {
        if (file_exists($file['path'])) {
            unlink($file['path']);
        }
        if (isset($file['convertedPath']) && file_exists($file['convertedPath'])) {
            unlink($file['convertedPath']);
        }
    }
    
    $_SESSION['files'] = [];
    
    echo json_encode(['success' => true]);
    exit;
}

// Aggiorna formato target
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' && isset($_POST['action']) && $_POST['action'] === 'updateFormat') {
    header('Content-Type: application/json');
    requireValidCsrfToken();

    $fileId = $_POST['fileId'] ?? '';
    $targetFormat = strtoupper($_POST['targetFormat'] ?? 'PNG');

    if (!in_array($targetFormat, SUPPORTED_FORMATS, true)) {
        echo json_encode(['success' => false, 'error' => 'Formato non supportato']);
        exit;
    }

    if (isset($_SESSION['files'][$fileId])) {
        $_SESSION['files'][$fileId]['targetFormat'] = $targetFormat;
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'File non trovato']);
    }
    exit;
}

// Aggiorna naming convention
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' && isset($_POST['action']) && $_POST['action'] === 'updateNaming') {
    header('Content-Type: application/json');
    requireValidCsrfToken();

    $type = $_POST['type'] ?? 'suffix';
    if (!in_array($type, ['preserve', 'suffix', 'prefix'], true)) {
        $type = 'suffix';
    }

    $_SESSION['namingConvention'] = [
        'type' => $type,
        'suffix' => sanitizeFilenameComponent($_POST['suffix'] ?? '_converted', '_converted'),
        'prefix' => sanitizeFilenameComponent($_POST['prefix'] ?? 'converted_', 'converted_')
    ];

    echo json_encode(['success' => true]);
    exit;
}

// Pulisci file vecchi
cleanupOldFiles();

?>
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Image Converter</title>
    <!-- Lucide Icons (versione fissata, stessa versione usata in tutta la suite) -->
    <script src="https://unpkg.com/lucide@0.469.0"></script>
    <script nonce="<?php echo htmlspecialchars($cspNonce, ENT_QUOTES, 'UTF-8'); ?>">
        // Applica il tema salvato prima del paint per evitare un flash del tema sbagliato
        (function () {
            try {
                var saved = localStorage.getItem('uf-theme');
                if (saved === 'dark' || saved === 'light') {
                    document.documentElement.setAttribute('data-theme', saved);
                }
            } catch (e) {}
        })();
    </script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        /* Token di design condivisi da tutta la suite Utility Forge: stesso nome/stesso valore in
           ogni tool, così l'aspetto resta identico ovunque e il tema chiaro/scuro si applica con
           un'unica sorgente di verità invece di colori hardcoded sparsi nel CSS. */
        :root {
            --uf-bg:#fafafa; --uf-card-bg:#ffffff; --uf-border:#e5e5e5; --uf-text:#1a1a1a; --uf-text-muted:#737373;
            --uf-accent:#3b82f6; --uf-accent-hover:#2563eb; --uf-accent-soft:#f0f9ff; --uf-accent-softer:#eff6ff; --uf-dragover-bg:#dbeafe;
            --uf-success-bg:#f0fdf4; --uf-success-border:#bbf7d0; --uf-success-text:#166534;
            --uf-error-bg:#fef2f2; --uf-error-border:#fecaca; --uf-error-text:#991b1b;
            --uf-warning-bg:#fffbeb; --uf-warning-border:#fde68a; --uf-warning-text:#92400e;
            --uf-info-bg:#eff6ff; --uf-info-border:#bfdbfe; --uf-info-text:#1e40af;
            --uf-progress-track:#f5f5f5; --uf-upload-border:#d4d4d4;
        }
        @media (prefers-color-scheme: dark) {
            :root:not([data-theme="light"]) {
                --uf-bg:#18181b; --uf-card-bg:#242428; --uf-border:#3a3a40; --uf-text:#f4f4f5; --uf-text-muted:#a1a1aa;
                --uf-accent:#60a5fa; --uf-accent-hover:#93c5fd; --uf-accent-soft:#1e2a3d; --uf-accent-softer:#1e293b; --uf-dragover-bg:#1e3a5f;
                --uf-success-bg:#052e16; --uf-success-border:#166534; --uf-success-text:#86efac;
                --uf-error-bg:#450a0a; --uf-error-border:#991b1b; --uf-error-text:#fca5a5;
                --uf-warning-bg:#451a03; --uf-warning-border:#92400e; --uf-warning-text:#fcd34d;
                --uf-info-bg:#1e293b; --uf-info-border:#1e40af; --uf-info-text:#93c5fd;
                --uf-progress-track:#3a3a40; --uf-upload-border:#52525b;
            }
        }
        :root[data-theme="dark"] {
            --uf-bg:#18181b; --uf-card-bg:#242428; --uf-border:#3a3a40; --uf-text:#f4f4f5; --uf-text-muted:#a1a1aa;
            --uf-accent:#60a5fa; --uf-accent-hover:#93c5fd; --uf-accent-soft:#1e2a3d; --uf-accent-softer:#1e293b; --uf-dragover-bg:#1e3a5f;
            --uf-success-bg:#052e16; --uf-success-border:#166534; --uf-success-text:#86efac;
            --uf-error-bg:#450a0a; --uf-error-border:#991b1b; --uf-error-text:#fca5a5;
            --uf-warning-bg:#451a03; --uf-warning-border:#92400e; --uf-warning-text:#fcd34d;
            --uf-info-bg:#1e293b; --uf-info-border:#1e40af; --uf-info-text:#93c5fd;
            --uf-progress-track:#3a3a40; --uf-upload-border:#52525b;
        }
        a:focus-visible, button:focus-visible, input:focus-visible, [tabindex]:focus-visible {
            outline: 2px solid var(--uf-accent); outline-offset: 2px;
        }
        .icon-btn { background:transparent; border:1px solid var(--uf-border); border-radius:8px; padding:8px; cursor:pointer; color:var(--uf-text-muted); display:inline-flex; align-items:center; justify-content:center; }
        .icon-btn:hover { background:var(--uf-accent-soft); color:var(--uf-accent); border-color:var(--uf-accent); }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', Oxygen, Ubuntu, Cantarell, sans-serif;
            background-color: var(--uf-bg);
            min-height: 100vh;
            padding: 20px;
            color: var(--uf-text);
            overflow-x: hidden;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .header {
            position: relative;
            background: var(--uf-card-bg);
            padding: 30px;
            border-radius: 12px;
            margin-bottom: 30px;
            text-align: center;
            border: 1px solid var(--uf-border);
        }

        .header #themeToggle { position: absolute; top: 20px; right: 20px; }

        .header h1 {
            color: var(--uf-accent);
            font-size: 2.5em;
            margin-bottom: 10px;
            font-weight: 700;
        }

        .header p {
            color: var(--uf-text-muted);
            font-size: 1.1em;
        }
        
        .main-card {
            background: var(--uf-card-bg);
            padding: 40px;
            border-radius: 12px;
            border: 1px solid var(--uf-border);
            margin-bottom: 30px;
        }

        .upload-area {
            border: 2px dashed var(--uf-upload-border);
            border-radius: 14px;
            padding: 60px 20px;
            text-align: center;
            background: var(--uf-bg);
            transition: border-color .2s, background-color .2s;
            cursor: pointer;
            margin-bottom: 30px;
        }

        .upload-area:hover {
            border-color: var(--uf-accent);
            background: var(--uf-dragover-bg);
        }

        .upload-area.dragover {
            border-color: var(--uf-accent);
            background: var(--uf-dragover-bg);
        }

        .upload-icon {
            display: inline-flex;
            justify-content: center;
            color: var(--uf-accent);
            margin-bottom: 20px;
        }

        .upload-text {
            font-size: 1.3em;
            color: var(--uf-text);
            margin-bottom: 10px;
        }

        .upload-hint {
            color: var(--uf-text-muted);
            font-size: 0.95em;
        }
        
        .btn {
            padding: 12px 30px;
            border: none;
            border-radius: 8px;
            font-size: 1em;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            background-color: var(--uf-accent);
            border-color: var(--uf-accent);
            color: white;
        }

        .btn:hover:not(:disabled) {
            background-color: var(--uf-accent-hover);
            border-color: var(--uf-accent-hover);
        }
        
        .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }
        
        .btn-secondary {
            background: #6c757d;
            border-color: #6c757d;
        }
        
        .btn-secondary:hover {
            background: #5a6268;
            border-color: #5a6268;
        }
        
        .btn-small {
            padding: 8px 20px;
            font-size: 0.9em;
        }
        
        .file-list {
            margin-top: 30px;
        }
        
        .file-item {
            background: var(--uf-bg);
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 15px;
            border: 2px solid var(--uf-border);
            transition: all 0.3s ease;
        }

        .file-item:hover {
            border-color: var(--uf-accent);
            transform: translateY(-2px);
        }

        .file-info {
            flex: 1;
            min-width: 200px;
        }

        .file-name {
            font-weight: 600;
            color: var(--uf-text);
            margin-bottom: 5px;
        }
        
        .file-size {
            color: var(--uf-text-muted);
            font-size: 0.9em;
        }

        .file-status {
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.85em;
            margin-top: 5px;
        }

        .status-waiting { color: var(--uf-warning-text); }
        .status-converting { color: var(--uf-accent-hover); }
        .status-done { color: var(--uf-success-text); }
        .status-error { color: var(--uf-error-text); }

        .progress-bar {
            width: 100%;
            height: 8px;
            background: var(--uf-progress-track);
            border-radius: 4px;
            overflow: hidden;
            margin-top: 8px;
        }

        .progress-fill {
            height: 100%;
            background: var(--uf-accent);
            border-radius: 4px;
            transition: width 0.3s;
        }

        .file-controls {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
        }

        select {
            padding: 8px 12px;
            border: 2px solid var(--uf-border);
            border-radius: 8px;
            font-size: 0.95em;
            font-weight: 600;
            background: var(--uf-card-bg);
            color: var(--uf-text);
            cursor: pointer;
        }

        select:focus {
            outline: none;
            border-color: var(--uf-accent);
        }

        .options-panel {
            background: var(--uf-bg);
            padding: 30px;
            border-radius: 10px;
            margin: 30px 0;
            border: 1px solid var(--uf-border);
        }

        .options-title {
            font-size: 1.5em;
            color: var(--uf-accent);
            margin-bottom: 20px;
            font-weight: 600;
            padding-bottom: 10px;
            border-bottom: 2px solid var(--uf-bg);
        }

        .option-group {
            margin-bottom: 25px;
        }

        .option-label {
            display: block;
            font-weight: 600;
            color: var(--uf-text);
            margin-bottom: 10px;
        }
        
        .option-row {
            display: flex;
            gap: 15px;
            align-items: center;
            flex-wrap: wrap;
        }
        
        input[type="number"],
        input[type="text"] {
            padding: 10px;
            border: 2px solid var(--uf-border);
            border-radius: 8px;
            font-size: 0.95em;
            width: 120px;
            background: var(--uf-card-bg);
            color: var(--uf-text);
        }

        input[type="number"]:focus,
        input[type="text"]:focus {
            outline: none;
            border-color: var(--uf-accent);
        }

        input[type="range"] {
            -webkit-appearance: none;
            width: 100%;
            height: 6px;
            background: var(--uf-border);
            outline: none;
            transition: background 0.15s ease-in-out;
            margin-top: 15px;
            border-radius: 3px;
            flex: 1;
            min-width: 200px;
        }

        input[type="range"]:focus {
            box-shadow: none;
        }

        input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 20px;
            height: 20px;
            background: var(--uf-accent);
            cursor: pointer;
            border-radius: 50%;
            box-shadow: none;
        }

        input[type="range"]:focus::-webkit-slider-thumb {
            background: var(--uf-accent);
            box-shadow: 0 0 3px 3px var(--uf-dragover-bg);
        }

        input[type="range"]::-moz-range-thumb {
            width: 20px;
            height: 20px;
            background: var(--uf-accent);
            cursor: pointer;
            border-radius: 50%;
            border: none;
            box-shadow: none;
        }

        input[type="range"]:focus::-moz-range-thumb {
            background: var(--uf-accent);
            box-shadow: 0 0 3px 3px var(--uf-dragover-bg);
        }

        input[type="checkbox"],
        input[type="radio"] {
            width: 18px;
            height: 18px;
            cursor: pointer;
            accent-color: var(--uf-accent);
        }
        
        .checkbox-group,
        .radio-group {
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
        }
        
        .checkbox-label,
        .radio-label {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
        }
        
        .actions-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 15px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid var(--uf-border);
        }
        
        .bulk-actions {
            display: flex;
            gap: 10px;
            align-items: center;
            flex-wrap: wrap;
        }
        
        .spinner {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: white;
            animation: spin 0.8s linear infinite;
            margin-right: 10px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .footer {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            color: var(--uf-text-muted);
        }

        .hidden {
            display: none;
        }

        .quality-value {
            font-weight: 600;
            color: var(--uf-accent);
            margin-left: 10px;
        }

        @media (max-width: 680px) {
            .header h1 {
                font-size: 1.8em;
            }
            
            .main-card {
                padding: 20px;
            }
            
            .file-item {
                flex-direction: column;
                align-items: stretch;
            }
            
            .actions-bar {
                flex-direction: column;
            }
            
            .option-row {
                width: 100%;
                flex-direction: column;
            }
            
            .btn {
                width: 100%;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <button class="icon-btn" id="themeToggle" type="button" aria-label="Cambia tema chiaro/scuro" title="Tema chiaro/scuro">
                <i data-lucide="moon" size="18"></i>
            </button>
            <h1><i data-lucide="image" size="32" style="vertical-align:middle;"></i> Image Converter</h1>
        </div>
        
        <div class="main-card">
            <div class="upload-area" id="uploadArea">
                <div class="upload-icon"><i data-lucide="image-plus" size="56" stroke-width="1.5"></i></div>
                <div class="upload-text">Trascina i file qui o clicca per selezionarli</div>
                <div class="upload-hint">Supporta JPG, PNG, WEBP, GIF, BMP, TIFF, HEIC (max <?php echo MAX_FILE_SIZE_MB; ?>MB a file, max <?php echo MAX_FILES_PER_SESSION; ?> file per sessione)</div>
                <input type="file" id="fileInput" multiple accept="image/*,.heic,.heif" style="display: none;">
            </div>
            
            <div id="fileListSection" class="hidden">
                <h2 style="color: #575756; margin-bottom: 20px;">Coda di Conversione</h2>
                
                <div class="bulk-actions">
                    <label for="bulkFormat" style="font-weight: 600; color: #575756;">Converti tutti in:</label>
                    <select id="bulkFormat">
                        <option value="">Seleziona...</option>
                        <?php foreach (SUPPORTED_FORMATS as $format): ?>
                        <option value="<?php echo $format; ?>"><?php echo $format; ?></option>
                        <?php endforeach; ?>
                    </select>
                    <button class="btn btn-secondary btn-small" onclick="clearAll()">Cancella Tutto</button>
                </div>
                
                <div id="fileList" class="file-list"></div>
                
                <!-- Opzioni di Conversione -->
                <div class="options-panel">
                    <h3 class="options-title">Opzioni di Conversione</h3>
                    
                    <div class="option-group">
                        <label class="option-label">Trasformazioni</label>
                        
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                            <!-- Resize -->
                            <div>
                                <label class="checkbox-label">
                                    <input type="checkbox" id="resizeEnabled">
                                    <span style="font-weight: 600;">Ridimensiona Immagine</span>
                                </label>
                                <div id="resizeOptions" class="hidden" style="margin-top: 15px;">
                                    <div class="option-row" style="margin-bottom: 10px;">
                                        <label for="resizeWidth" style="width: 80px;">Larghezza:</label>
                                        <input type="number" id="resizeWidth" placeholder="1920" min="1">
                                        <span>px</span>
                                    </div>
                                    <div class="option-row">
                                        <label for="resizeHeight" style="width: 80px;">Altezza:</label>
                                        <input type="number" id="resizeHeight" placeholder="1080" min="1">
                                        <span>px</span>
                                    </div>
                                    <small style="color: var(--uf-text-muted);">Lascia un valore vuoto per mantenere le proporzioni</small>
                                </div>
                            </div>
                            
                            <!-- Crop -->
                            <div>
                                <label class="checkbox-label">
                                    <input type="checkbox" id="cropEnabled">
                                    <span style="font-weight: 600;">Ritaglia Immagine</span>
                                </label>
                                <div id="cropOptions" class="hidden" style="margin-top: 15px;">
                                    <div class="option-row">
                                        <label for="cropAspectRatio" style="width: 120px;">Proporzioni:</label>
                                        <select id="cropAspectRatio" style="width: 180px;">
                                            <option value="1:1">1:1 (Quadrato)</option>
                                            <option value="16:9">16:9 (Widescreen)</option>
                                            <option value="9:16">9:16 (Verticale)</option>
                                            <option value="4:3">4:3 (Standard)</option>
                                            <option value="3:4">3:4 (Ritratto)</option>
                                        </select>
                                    </div>
                                    <small style="color: var(--uf-text-muted);">Ritaglia dal centro dell'immagine</small>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="option-group">
                        <label class="option-label">Impostazioni Output</label>
                        
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                            <!-- Naming -->
                            <div>
                                <label style="font-weight: 600; display: block; margin-bottom: 10px;">Nomenclatura File</label>
                                <div class="radio-group" style="flex-direction: column; gap: 10px;">
                                    <label class="radio-label">
                                        <input type="radio" name="naming" value="preserve" checked>
                                        <span>Mantieni nome originale</span>
                                    </label>
                                    <label class="radio-label">
                                        <input type="radio" name="naming" value="suffix">
                                        <span>Aggiungi suffisso</span>
                                        <input type="text" id="namingSuffix" value="_converted" style="width: 140px;" onclick="document.querySelector('input[value=suffix]').checked = true">
                                    </label>
                                    <label class="radio-label">
                                        <input type="radio" name="naming" value="prefix">
                                        <span>Aggiungi prefisso</span>
                                        <input type="text" id="namingPrefix" value="converted_" style="width: 140px;" onclick="document.querySelector('input[value=prefix]').checked = true">
                                    </label>
                                </div>
                            </div>
                            
                            <!-- Quality -->
                            <div>
                                <label for="quality" style="font-weight: 600; display: block; margin-bottom: 10px;">
                                    Qualità Immagine <span class="quality-value" id="qualityValue">92%</span>
                                </label>
                                <input type="range" id="quality" min="1" max="100" value="92" style="width: 100%;">
                                <small style="color: var(--uf-text-muted);">Qualità inferiore riduce la dimensione del file (JPEG & WEBP)</small>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="actions-bar">
                    <button class="btn" id="convertBtn" onclick="convertAll()">
                        <span id="convertBtnText">Converti</span>
                    </button>
                    <button class="btn btn-secondary hidden" id="downloadAllBtn" onclick="downloadAll()">
                        <i data-lucide="download" size="18"></i> Scarica Tutto (ZIP)
                    </button>
                </div>
            </div>
        </div>

        <div class="footer">
            <p style="margin-top: 10px; font-size: 0.9em; color: var(--uf-text-muted);">
                Tutte le conversioni avvengono sul server. I tuoi file vengono eliminati automaticamente dopo 1 ora.<br>
                <i data-lucide="shield-check" size="14" style="vertical-align:text-bottom;"></i> Ogni file caricato viene verificato in base al contenuto reale, non solo all'estensione; la
                conversione ricodifica sempre l'immagine, quindi eventuali metadati EXIF/GPS dell'originale non
                vengono trasferiti nel file convertito.
            </p>
        </div>
    </div>

    <script nonce="<?php echo htmlspecialchars($cspNonce, ENT_QUOTES, 'UTF-8'); ?>">
        // Token anti-CSRF, generato lato server e richiesto da ogni chiamata che modifica lo stato
        const CSRF_TOKEN = '<?php echo htmlspecialchars($_SESSION['csrf_token'], ENT_QUOTES, 'UTF-8'); ?>';

        if (window.lucide) { lucide.createIcons(); }

        (function initThemeToggle() {
            const btn = document.getElementById('themeToggle');
            if (!btn) return;
            function getPreferredTheme() {
                try {
                    const saved = localStorage.getItem('uf-theme');
                    if (saved === 'dark' || saved === 'light') return saved;
                } catch (e) {}
                return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            }
            function applyTheme(theme) {
                document.documentElement.setAttribute('data-theme', theme);
                // lucide.createIcons() replaces the <i data-lucide> element with a brand-new <svg>
                // each time, so any previously-queried reference to it goes stale — rebuild the
                // icon element itself on every call instead of mutating a cached one.
                btn.innerHTML = '';
                const icon = document.createElement('i');
                icon.setAttribute('data-lucide', theme === 'dark' ? 'sun' : 'moon');
                icon.setAttribute('size', '18');
                btn.appendChild(icon);
                if (window.lucide) lucide.createIcons();
            }
            let currentTheme = getPreferredTheme();
            applyTheme(currentTheme);
            btn.addEventListener('click', () => {
                currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
                try { localStorage.setItem('uf-theme', currentTheme); } catch (e) {}
                applyTheme(currentTheme);
            });
        })();

        function escapeHtml(value) {
            const div = document.createElement('div');
            div.textContent = String(value ?? '');
            return div.innerHTML;
        }

        let files = {};

        // Setup upload area
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        
        uploadArea.addEventListener('click', () => fileInput.click());
        
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            handleFiles(e.dataTransfer.files);
        });
        
        fileInput.addEventListener('change', (e) => {
            handleFiles(e.target.files);
            e.target.value = ''; // Reset input
        });
        
        // Gestione opzioni
        document.getElementById('resizeEnabled').addEventListener('change', (e) => {
            document.getElementById('resizeOptions').classList.toggle('hidden', !e.target.checked);
        });
        
        document.getElementById('cropEnabled').addEventListener('change', (e) => {
            document.getElementById('cropOptions').classList.toggle('hidden', !e.target.checked);
        });
        
        document.getElementById('quality').addEventListener('input', (e) => {
            document.getElementById('qualityValue').textContent = e.target.value + '%';
        });
        
        // Bulk format change
        document.getElementById('bulkFormat').addEventListener('change', (e) => {
            const format = e.target.value;
            if (format) {
                Object.keys(files).forEach(fileId => {
                    files[fileId].targetFormat = format;
                    const select = document.querySelector(`select[data-file-id="${fileId}"]`);
                    if (select) select.value = format;
                });
                updateNamingConvention();
            }
            e.target.value = '';
        });
        
        // Gestione naming convention
        document.querySelectorAll('input[name="naming"]').forEach(radio => {
            radio.addEventListener('change', updateNamingConvention);
        });
        
        document.getElementById('namingSuffix').addEventListener('input', updateNamingConvention);
        document.getElementById('namingPrefix').addEventListener('input', updateNamingConvention);
        
        function handleFiles(fileList) {
            const formData = new FormData();
            
            Array.from(fileList).forEach(file => {
                formData.append('files[]', file);
            });
            
            formData.append('action', 'upload');
            formData.append('csrf_token', CSRF_TOKEN);

            fetch('', {
                method: 'POST',
                body: formData
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    data.files.forEach(file => {
                        if (file.success) {
                            files[file.id] = {
                                id: file.id,
                                originalName: file.filename,
                                originalSize: file.size,
                                targetFormat: 'PNG',
                                status: 'waiting',
                                progress: 0
                            };
                        } else {
                            alert(`Errore con ${file.filename}: ${file.error}`);
                        }
                    });
                    renderFileList();
                    document.getElementById('fileListSection').classList.remove('hidden');
                }
            })
            .catch(err => {
                console.error('Errore upload:', err);
                alert('Errore durante il caricamento dei file');
            });
        }
        
        function renderFileList() {
            const fileList = document.getElementById('fileList');
            fileList.innerHTML = '';
            
            Object.values(files).forEach(file => {
                const fileItem = document.createElement('div');
                fileItem.className = 'file-item';
                fileItem.innerHTML = `
                    <div class="file-info">
                        <div class="file-name">${escapeHtml(file.originalName)}</div>
                        <div class="file-size">${formatFileSize(file.originalSize)}</div>
                        <div class="file-status status-${file.status.toLowerCase()}">${getStatusText(file.status)}</div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${file.progress}%"></div>
                        </div>
                    </div>
                    <div class="file-controls">
                        <label for="format-${file.id}" style="font-weight: 600;">A:</label>
                        <select id="format-${file.id}" data-file-id="${file.id}" onchange="updateFileFormat('${file.id}', this.value)" ${file.status !== 'waiting' && file.status !== 'error' ? 'disabled' : ''}>
                            <?php foreach (SUPPORTED_FORMATS as $format): ?>
                            <option value="<?php echo $format; ?>" ${file.targetFormat === '<?php echo $format; ?>' ? 'selected' : ''}><?php echo $format; ?></option>
                            <?php endforeach; ?>
                        </select>
                        ${file.status === 'done' ? `<button class="btn btn-small" onclick="downloadFile('${file.id}')"><i data-lucide="download" size="16"></i> Scarica</button>` : ''}
                        <button class="btn btn-secondary btn-small" onclick="removeFile('${file.id}')" aria-label="Rimuovi file" title="Rimuovi file"><i data-lucide="trash-2" size="16"></i></button>
                    </div>
                `;
                fileList.appendChild(fileItem);
            });
            if (window.lucide) { lucide.createIcons(); }

            updateConvertButton();
        }
        
        function getStatusText(status) {
            const statusMap = {
                'waiting': 'In Attesa',
                'converting': 'Conversione...',
                'done': 'Completato',
                'error': 'Errore'
            };
            return statusMap[status] || status;
        }
        
        function formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
        }
        
        function updateFileFormat(fileId, format) {
            files[fileId].targetFormat = format;
            
            const formData = new FormData();
            formData.append('action', 'updateFormat');
            formData.append('fileId', fileId);
            formData.append('targetFormat', format);
            formData.append('csrf_token', CSRF_TOKEN);

            fetch('', {
                method: 'POST',
                body: formData
            });
        }
        
        function updateNamingConvention() {
            const type = document.querySelector('input[name="naming"]:checked').value;
            const suffix = document.getElementById('namingSuffix').value;
            const prefix = document.getElementById('namingPrefix').value;
            
            const formData = new FormData();
            formData.append('action', 'updateNaming');
            formData.append('type', type);
            formData.append('suffix', suffix);
            formData.append('prefix', prefix);
            formData.append('csrf_token', CSRF_TOKEN);

            fetch('', {
                method: 'POST',
                body: formData
            });
        }
        
        function removeFile(fileId) {
            const formData = new FormData();
            formData.append('action', 'removeFile');
            formData.append('fileId', fileId);
            formData.append('csrf_token', CSRF_TOKEN);

            fetch('', {
                method: 'POST',
                body: formData
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    delete files[fileId];
                    renderFileList();
                    
                    if (Object.keys(files).length === 0) {
                        document.getElementById('fileListSection').classList.add('hidden');
                    }
                }
            });
        }
        
        function clearAll() {
            if (!confirm('Sei sicuro di voler cancellare tutti i file?')) return;
            
            const formData = new FormData();
            formData.append('action', 'clearAll');
            formData.append('csrf_token', CSRF_TOKEN);

            fetch('', {
                method: 'POST',
                body: formData
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    files = {};
                    document.getElementById('fileListSection').classList.add('hidden');
                }
            });
        }
        
        async function convertAll() {
            const filesToConvert = Object.values(files).filter(f => f.status === 'waiting' || f.status === 'error');
            
            if (filesToConvert.length === 0) {
                alert('Nessun file da convertire');
                return;
            }
            
            const convertBtn = document.getElementById('convertBtn');
            convertBtn.disabled = true;
            document.getElementById('convertBtnText').innerHTML = '<span class="spinner"></span> Conversione...';
            
            for (const file of filesToConvert) {
                await convertFile(file.id);
            }
            
            convertBtn.disabled = false;
            document.getElementById('convertBtnText').textContent = 'Converti';
            
            updateConvertButton();
        }
        
        async function convertFile(fileId) {
            files[fileId].status = 'converting';
            files[fileId].progress = 0;
            renderFileList();
            
            const formData = new FormData();
            formData.append('action', 'convert');
            formData.append('fileId', fileId);
            formData.append('targetFormat', files[fileId].targetFormat);
            formData.append('quality', document.getElementById('quality').value);
            formData.append('csrf_token', CSRF_TOKEN);
            
            // Resize options
            if (document.getElementById('resizeEnabled').checked) {
                formData.append('resizeEnabled', 'true');
                const width = document.getElementById('resizeWidth').value;
                const height = document.getElementById('resizeHeight').value;
                if (width) formData.append('resizeWidth', width);
                if (height) formData.append('resizeHeight', height);
            }
            
            // Crop options
            if (document.getElementById('cropEnabled').checked) {
                formData.append('cropEnabled', 'true');
                formData.append('cropAspectRatio', document.getElementById('cropAspectRatio').value);
            }
            
            // Simula progresso
            const progressInterval = setInterval(() => {
                if (files[fileId].progress < 90) {
                    files[fileId].progress += 10;
                    renderFileList();
                }
            }, 200);
            
            try {
                const response = await fetch('', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                
                clearInterval(progressInterval);
                
                if (data.success) {
                    files[fileId].status = 'done';
                    files[fileId].progress = 100;
                    files[fileId].convertedSize = data.size;
                    files[fileId].downloadUrl = data.downloadUrl;
                } else {
                    files[fileId].status = 'error';
                    files[fileId].progress = 0;
                    alert(`Errore nella conversione di ${files[fileId].originalName}: ${data.error}`);
                }
            } catch (err) {
                clearInterval(progressInterval);
                files[fileId].status = 'error';
                files[fileId].progress = 0;
                console.error('Errore conversione:', err);
            }
            
            renderFileList();
        }
        
        function downloadFile(fileId) {
            window.location.href = `?action=download&fileId=${fileId}`;
        }
        
        function downloadAll() {
            window.location.href = '?action=downloadAll';
        }
        
        function updateConvertButton() {
            const waiting = Object.values(files).filter(f => f.status === 'waiting' || f.status === 'error').length;
            const done = Object.values(files).filter(f => f.status === 'done').length;
            
            const convertBtn = document.getElementById('convertBtn');
            const downloadAllBtn = document.getElementById('downloadAllBtn');
            
            if (done > 0 && waiting === 0) {
                convertBtn.classList.add('hidden');
                downloadAllBtn.classList.remove('hidden');
            } else {
                convertBtn.classList.remove('hidden');
                downloadAllBtn.classList.add('hidden');
                
                if (waiting > 0) {
                    document.getElementById('convertBtnText').textContent = `Converti ${waiting} File${waiting > 1 ? 's' : ''}`;
                } else {
                    document.getElementById('convertBtnText').textContent = 'Tutto Fatto!';
                }
            }
        }
    </script>
</body>
</html>