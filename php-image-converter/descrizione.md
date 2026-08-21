# PHP Image Converter — Descrizione del progetto

> Documento di accompagnamento al curriculum
> Autrice: **Chiara Berti**

---

## 1. In due righe (l'idea)

**PHP Image Converter** è un'applicazione web che permette di **convertire immagini da un formato all'altro** (per esempio da JPG a PNG, o da HEIC del telefono a WEBP) direttamente dal browser, con la possibilità di **ridimensionarle, ritagliarle e regolarne la qualità** — il tutto senza installare programmi e senza mandare le foto a servizi esterni.

La particolarità tecnica è che **tutta l'applicazione vive in un solo file PHP**: server, interfaccia grafica e logica sono contenuti in un unico documento facilissimo da distribuire (basta copiarlo su un qualsiasi server web e funziona).

---

## 2. Cosa fa l'app, spiegato semplice

Immagina di avere una cartella piena di foto nel formato sbagliato. Con questa app:

1. **Carichi le immagini** trascinandole nella pagina (drag-and-drop) o cliccando per selezionarle. Puoi caricarne **tante insieme**.
2. **Scegli il formato di destinazione** (JPG, PNG, WEBP, BMP, TIFF, GIF). Puoi impostarlo file per file oppure "tutti nello stesso formato" con un clic.
3. **Personalizzi la conversione**, se vuoi:
   - **Ridimensiona**: imposti larghezza e/o altezza (lasciando un campo vuoto le proporzioni restano corrette);
   - **Ritaglia**: scegli un formato predefinito (1:1 quadrato, 16:9, 9:16, 4:3, 3:4) e l'immagine viene tagliata dal centro;
   - **Qualità**: uno slider da 1 a 100% per bilanciare nitidezza e peso del file;
   - **Nome del file**: mantieni l'originale, oppure aggiungi un prefisso o un suffisso (es. `foto_converted.png`).
4. **Converti**: parte l'elaborazione con una **barra di avanzamento** per ogni file.
5. **Scarichi il risultato**: ogni file singolarmente, oppure **tutti insieme in un unico archivio ZIP**.

### Punti di forza per l'utente

- **Privacy**: le immagini vengono elaborate sul server dell'utente, non su servizi di terze parti, e vengono **cancellate automaticamente dopo un'ora**.
- **Nessuna installazione lato utente**: funziona nel browser (Chrome, Firefox, Safari, Edge).
- **Formati "difficili" gestiti**: supporta anche l'**HEIC/HEIF** degli iPhone e il **TIFF**, appoggiandosi a ImageMagick quando disponibile.
- **Interfaccia moderna e responsive**: pulita, con supporto al trascinamento, funziona anche da smartphone.

---

## 3. Come è stata sviluppata (la parte tecnica)

### Architettura generale

L'applicazione segue un'architettura **self-contained**: un singolo file PHP che si comporta contemporaneamente da:

- **API di backend** (elabora upload, conversioni e download);
- **motore di elaborazione immagini**;
- **pagina web** (HTML + CSS + JavaScript) servita all'utente.

Il flusso è quello di una **Single Page Application leggera**: la pagina non si ricarica mai. Il JavaScript dialoga con il backend PHP tramite chiamate asincrone `fetch`, e il backend risponde in **JSON**.

### Il backend PHP

Il cuore logico è la classe **`ImageConverter`**, che incapsula tutta l'elaborazione e implementa una **pipeline di rendering** ordinata:

```
Caricamento immagine  →  Ritaglio (crop)  →  Ridimensionamento (resize)  →  Salvataggio nel formato scelto
```

Ogni fase è un metodo dedicato e indipendente:

- `loadImage()` — riconosce il formato in ingresso dal *MIME type* reale (non dall'estensione del nome) e sceglie la funzione di decodifica corretta;
- `loadWithImageMagick()` — **fallback intelligente**: quando GD non basta (HEIC, TIFF), l'immagine viene aperta con ImageMagick, normalizzata in spazio colore RGB e passata a GD;
- `applyCrop()` — calcola matematicamente l'area da ritagliare per rispettare le proporzioni scelte, tagliando sempre dal centro;
- `applyResize()` — ridimensiona preservando le proporzioni quando viene indicata una sola dimensione;
- `saveImage()` — gestisce le specificità di ogni formato di output (per esempio lo sfondo bianco su JPG/BMP che non hanno trasparenza, la conversione della scala qualità 0–100 in 0–9 per il PNG, la compressione LZW per il TIFF).

Attenzione particolare è stata data alla **gestione della trasparenza** (canale alpha preservato per i PNG) e alla **gestione della memoria** (le risorse immagine vengono liberate con `imagedestroy()` a ogni passaggio, importante quando si elaborano molti file grandi).

Il codice è scritto con le **pratiche moderne di PHP 8**: tipizzazione esplicita di proprietà, parametri e valori di ritorno (compresi gli *union type* come `\GdImage|false`), uso delle **espressioni `match`** al posto dei vecchi `switch`, e una **gestione degli errori robusta** basata su `\Throwable`, che intercetta anche le eccezioni di tipo `TypeError`/`ValueError` introdotte da PHP 8. Gli accessi agli array sono resi sicuri con il *null coalescing* per evitare i warning delle versioni recenti dell'interprete. Il progetto richiede **PHP 8.2+ ed è stato testato fino a PHP 8.4**.

### Il "router" delle API

Il backend espone diversi **endpoint**, riconosciuti da un parametro `action`, ciascuno con una responsabilità precisa:

| Azione | Cosa fa |
|--------|---------|
| `upload` | Riceve e valida i file caricati |
| `convert` | Esegue la conversione di un singolo file |
| `download` | Restituisce un file convertito |
| `downloadAll` | Impacchetta tutti i file convertiti in uno ZIP |
| `getFiles` | Restituisce lo stato della coda |
| `removeFile` / `clearAll` | Rimozione dei file |
| `updateFormat` / `updateNaming` | Aggiorna le preferenze di conversione |

### Gestione dei file e sicurezza

- Ogni utente lavora in una **cartella temporanea isolata**, legata al suo `session_id`, così i file di persone diverse non si mescolano mai.
- I file caricati sono **validati** per estensione e **limitati nelle dimensioni** (max 100 MB).
- Viene eseguita una **pulizia automatica** dei file più vecchi di un'ora, per non lasciare dati sul server.

### Il frontend

Interfaccia costruita in **JavaScript "vanilla"** (senza framework esterni), per mantenere l'app leggera e a dipendenze zero. Include:

- area di **drag-and-drop** con feedback visivo;
- **conversione batch asincrona** (i file vengono elaborati in sequenza con `async/await`), con barra di avanzamento per ciascuno;
- aggiornamento dinamico dello stato di ogni file (in attesa → conversione → completato / errore);
- uno stile CSS curato e **responsive**, con un design pulito e un accento cromatico coerente.

### Tecnologie usate

- **PHP 8.2+** (backend e logica, testato fino a 8.4)
- **Libreria GD** (elaborazione immagini nativa)
- **ImageMagick** (opzionale, per HEIC/HEIF e TIFF)
- **ZipArchive** (download multiplo in ZIP)
- **HTML5 / CSS3 / JavaScript (Fetch API)** (frontend)
- **JSON** come formato di scambio dati client–server

---

## 4. Il mio ruolo e il mio contributo

Ho **ideato e sviluppato il progetto end-to-end**, occupandomi di ogni suo aspetto: dalla progettazione dell'architettura all'interfaccia utente, fino alla documentazione. In particolare:

- **Ho progettato l'architettura modulare** dell'applicazione, scegliendo un approccio *self-contained* in un unico file e separando comunque in modo netto le responsabilità (motore di conversione, router delle API, frontend).
- **Ho gestito la pipeline di rendering** delle immagini — caricamento, ritaglio, ridimensionamento e salvataggio — progettandola come una sequenza di fasi indipendenti e riutilizzabili all'interno della classe `ImageConverter`.
- **Ho implementato il supporto multi-formato**, integrando un *fallback* automatico verso ImageMagick per i formati che la libreria GD non gestisce nativamente (HEIC/HEIF, TIFF).
- **Ho progettato le API del backend**, definendo un insieme coerente di endpoint con risposte in JSON per far dialogare frontend e server senza mai ricaricare la pagina.
- **Ho curato la gestione sicura dei file**: validazione degli upload, limiti dimensionali, isolamento per sessione e pulizia automatica dei file temporanei.
- **Ho sviluppato l'interfaccia utente** in JavaScript puro, con drag-and-drop, elaborazione batch asincrona, barre di progresso e un layout responsive.
- **Ho modernizzato il codice a PHP 8.2+** (testato fino a 8.4), introducendo tipizzazione statica, espressioni `match`, gestione degli errori con `\Throwable` e verificando l'assenza di errori con l'analisi statica (`php -l`) e con test funzionali della pipeline di conversione.
- **Ho scritto la documentazione** completa e bilingue (README e guida all'installazione, in italiano e inglese).

---

## 5. Competenze dimostrate

Attraverso questo progetto ho dimostrato competenze in:

- **Programmazione backend con PHP 8** e progettazione orientata agli oggetti (classi, incapsulamento, separazione delle responsabilità, tipizzazione statica, `match`, gestione delle eccezioni).
- **Elaborazione digitale delle immagini**: uso delle librerie GD e ImageMagick, gestione di spazi colore, trasparenza, compressione e conversione tra formati.
- **Progettazione di API** e comunicazione client–server asincrona in JSON.
- **Sviluppo frontend**: HTML5, CSS3 (layout responsive), JavaScript moderno (Fetch API, `async/await`, manipolazione del DOM).
- **Attenzione a sicurezza e affidabilità**: validazione degli input, gestione degli errori, isolamento dei dati per sessione, gestione consapevole della memoria.
- **Manutenzione e ammodernamento del codice**: aggiornamento a una versione di linguaggio supportata (PHP 8.2+), verifica con analisi statica e test funzionali.
- **Cura dell'esperienza utente (UX)**: interfaccia intuitiva, feedback in tempo reale, funzionalità batch.
- **Documentazione tecnica** chiara e orientata all'utente finale.
- **Autonomia nella gestione di un progetto completo**, dalla progettazione al rilascio.

---

*Progetto rilasciato con licenza MIT.*
