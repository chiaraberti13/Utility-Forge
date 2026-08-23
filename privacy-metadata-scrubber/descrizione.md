# Privacy & Metadata Forensics Studio — Descrizione del progetto

> Documento di presentazione da allegare al curriculum.
> Spiega in modo semplice **cosa fa** l'applicazione, **come è stata costruita**
> a livello tecnico e **qual è stato il mio ruolo e le competenze dimostrate**.

---

## 1. In una frase

Un'applicazione web che ispeziona e ripulisce in modo selettivo i metadati nascosti dentro
immagini, PDF e documenti Office (GPS, autore, cronologia di modifica, commenti, modifiche
tracciate), mostrando prima cosa ha trovato e lasciando all'utente la scelta di cosa rimuovere —
tutto nel browser, senza che un solo file lasci mai il computer.

---

## 2. Il problema che risolve

Foto, PDF e documenti Office portano quasi sempre con sé molte più informazioni di quanto sembri a
prima vista: coordinate GPS del luogo dello scatto, nome dell'autore e del software usato, chi ha
modificato per ultimo un file, commenti di revisione mai eliminati, intere frasi cancellate ma
ancora presenti come "modifica tracciata". Prima di condividere un file pubblicamente — un
curriculum, un contratto, una foto — questi dettagli possono rivelare più di quanto si vorrebbe.

I tool gratuiti che risolvono "un pezzetto" di questo problema esistono, ma quasi sempre:
- si limitano a un solo formato (spesso solo le immagini, e spesso solo l'EXIF),
- **richiedono di caricare il file su un server esterno** per essere elaborato,
- non spiegano davvero cosa è stato trovato o cosa è stato tolto, funzionando come una scatola nera.

Questa app copre tre famiglie di formati insieme (immagini, PDF, Office), mostra sempre prima un
report leggibile di cosa contiene il file, e non lo carica mai da nessuna parte: tutto avviene nel
browser dell'utente.

---

## 3. Come funziona, passo per passo

Dal punto di vista dell'utente il flusso è in sei passaggi:

1. **Sceglie cosa rimuovere** — quattro categorie selezionabili (GPS/posizione, nomi di
   autore/editor, campi metadati PDF, commenti e modifiche tracciate Office), con la possibilità di
   salvare la combinazione scelta come profilo con nome per riusarla in futuro.
2. **Carica i file** — trascinandoli o selezionandoli, anche in batch fino a 200 file da 50 MB
   ciascuno; ogni file non supportato o fuori limite viene segnalato subito, senza bloccare gli
   altri.
3. **Ispeziona** — un passaggio di sola lettura che mostra, per ogni file, esattamente quali
   metadati sono stati trovati: tag EXIF/GPS/IPTC/XMP per le immagini, il dizionario Info più una
   scansione euristica dei byte grezzi per i PDF, le proprietà core/app e i commenti/modifiche
   tracciate per i documenti Office.
4. **Ripulisce (Scrub)** — genera un file **nuovo**, mai sovrascrivendo l'originale, con solo le
   categorie selezionate effettivamente rimosse; un file che non contiene nulla di pertinente alle
   categorie scelte viene saltato invece di essere inutilmente ri-processato.
5. **Scarica** — singolarmente, oppure in un unico ZIP con dentro tutti i file ripuliti più un
   report riassuntivo in CSV e JSON.
6. **Riusa il profilo** — la combinazione di categorie scelta resta salvata nel browser per la
   prossima sessione.

---

## 4. Come è stata sviluppata (parte tecnica)

### 4.1 Architettura: HTML + JS separati, zero dipendenze da installare

L'applicazione è divisa in due file — struttura/stile in `privacy-metadata-scrubber.html` e tutta
la logica in `privacy-metadata-scrubber.js`, caricato con un semplice `<script src="...">`
relativo. Questa scelta, rispetto a un unico file con script inline, permette a un Content-Security-
Policy molto rigorosa di limitare gli script eseguibili alle sole origini CDN necessarie più
`'self'`, senza dover calcolare e mantenere sincronizzato un hash SHA-256 per uno script inline.

Le uniche quattro librerie esterne vengono caricate al volo da CDN, a versione fissata:

| Libreria    | A cosa serve                                                          |
|-------------|------------------------------------------------------------------------|
| **exifr**   | Estrarre tag EXIF, GPS, IPTC e XMP dalle immagini                     |
| **pdf-lib** | Leggere e riscrivere il dizionario Info dei file PDF                  |
| **JSZip**   | Aprire, modificare e ricostruire i contenitori ZIP di Office Open XML |
| **Lucide**  | Le icone vettoriali dell'interfaccia                                  |

### 4.2 Tre pipeline di elaborazione, una per tipo di file

Ogni formato ha una sua pipeline di ispezione e una di pulizia, scritte per essere oneste sui
propri limiti, non solo efficaci:

- **Immagini** — l'ispezione usa exifr per leggere tutti i blocchi di metadati; la pulizia
  ridisegna i pixel decodificati su un `<canvas>` alle dimensioni originali e li ri-esporta con
  `canvas.toBlob()`. Questo elimina *per costruzione* ogni metadato (nessuna API selettiva è
  necessaria, perché il canvas semplicemente non porta con sé alcun metadato) — ma comporta anche,
  come effetto collaterale dichiarato apertamente, la perdita del profilo colore ICC incorporato.

- **PDF** — l'ispezione legge i campi standard del dizionario Info con pdf-lib e affianca una
  scansione euristica dei byte grezzi alla ricerca dei marcatori `/JavaScript`, `/JS`,
  `/EmbeddedFile`, `/OpenAction`, etichettata chiaramente come euristica e non come garanzia. La
  pulizia azzera i campi selezionati e, non esistendo un'API di pdf-lib per eliminare del tutto le
  date, le sovrascrive con un valore segnaposto fisso — scelta dichiarata esplicitamente invece di
  essere presentata come una rimozione vera e propria.

- **Documenti Office** — l'ispezione apre il contenitore ZIP con JSZip e analizza `docProps/core.xml`
  e `docProps/app.xml` con `DOMParser`, oltre a contare le occorrenze di `<w:ins>`/`<w:del>` nel
  documento. La pulizia riscrive `docProps/core.xml` azzerando i campi identificativi, rimuove le
  parti di commento e le relative voci di relazione/content-type, e risolve le modifiche tracciate
  con semantica "accetta tutto": elimina il contenuto cancellato, mantiene quello inserito
  rimuovendo solo il wrapper XML.

### 4.3 Attenzione alla sicurezza e all'onestà del prodotto

- **Nessun `innerHTML`/`onclick` con dati del file**: ogni valore letto da un file caricato viene
  scritto nella pagina con `textContent` e creazione di nodi DOM, per evitare che un file costruito
  ad arte possa iniettare script.
- **GPS mostrato solo come testo**: nessuna tile di mappa viene mai caricata automaticamente; un
  link opzionale verso OpenStreetMap richiede un click esplicito dell'utente.
- **Nomi file sanificati e resi univoci** prima di essere usati per un download o una voce ZIP.
- **Limiti documentati onestamente**: la sezione Privacy & Security del README spiega, per ognuna
  delle tre pipeline, esattamente cosa è garantito e cosa no (ad esempio: la scansione byte-level
  dei PDF non è uno scanner di sicurezza; la ri-codifica WEBP non è lossless garantito).

### 4.4 Privacy by design

Non esiste un backend: tutta l'elaborazione — parsing, ispezione, pulizia, creazione dello ZIP —
avviene nel browser dell'utente. Questa non è un'ottimizzazione, è la premessa su cui l'intero
prodotto è costruito: i file sensibili (foto personali, contratti, documenti di lavoro) non
lasciano mai il dispositivo.

---

## 5. Il mio ruolo e le competenze dimostrate

Ho ideato e realizzato il progetto **individualmente**, dall'idea iniziale fino al prodotto finito
e documentato. In concreto:

- **Ho progettato l'architettura** dell'applicazione scegliendo una separazione HTML/JS pulita,
  client-side, zero-install, valutando esplicitamente il compromesso tra semplicità del singolo
  file e la CSP più rigorosa resa possibile da uno script esterno.

- **Ho integrato e coordinato quattro librerie di parsing eterogenee** (exifr, pdf-lib, JSZip più
  `DOMParser`/`XMLSerializer` nativi) per costruire tre pipeline di ispezione e pulizia distinte,
  ciascuna specifica per il formato di file che tratta.

- **Ho implementato la pulizia selettiva per categoria**, non un semplice "rimuovi tutto",
  progettando un modello di categorie che si applica in modo coerente attraverso tipi di file
  diversi (es. "nomi di autore/editor" copre EXIF, dizionario Info del PDF e core.xml di Office con
  campi diversi ma stesso significato per l'utente).

- **Ho manipolato direttamente XML Office Open XML** con `DOMParser`/`XMLSerializer` per risolvere
  le modifiche tracciate con semantica "accetta tutto" e per rimuovere in modo coerente commenti e
  le relative voci di relazione/content-type, mantenendo il contenitore ZIP strutturalmente valido.

- **Ho curato la sicurezza del rendering e dei nomi file**: uso sistematico di `textContent` e
  creazione di nodi DOM al posto di `innerHTML`/`onclick`, sanificazione e deduplicazione dei nomi
  file, e una Content-Security-Policy rigorosa costruita ad hoc per questo specifico set di
  dipendenze.

- **Ho scritto una documentazione tecnica onesta sui limiti reali** dello strumento — evitando
  deliberatamente di promettere garanzie (es. rimozione sicura di JavaScript nei PDF, WEBP
  lossless) che l'implementazione non può effettivamente mantenere.

- **Ho progettato l'elaborazione in batch** con report riassuntivo esportabile in CSV e JSON e
  download ZIP unico, e un sistema di profili con nome salvati in locale per riusare rapidamente
  una configurazione di pulizia.

### Competenze in sintesi

| Area                         | Competenze dimostrate                                                     |
|------------------------------|-----------------------------------------------------------------------------|
| **Frontend**                 | HTML, CSS (responsive design), JavaScript (ES6+, async/await)              |
| **Architettura software**    | Separazione HTML/JS, CSP mirata, zero-dependency, privacy by design        |
| **Parsing di formati file**  | EXIF/GPS/IPTC/XMP, struttura PDF (Info dictionary), Office Open XML (ZIP)  |
| **Manipolazione XML**        | `DOMParser`/`XMLSerializer` per riscrivere e ricostruire parti OOXML       |
| **Elaborazione grafica**     | Re-encoding di immagini via `<canvas>` per la rimozione garantita dei metadati |
| **Sicurezza applicativa**    | Rendering sicuro contro XSS, sanificazione filename, CSP, dipendenze fissate |
| **UX / Product**             | Flusso ispeziona-poi-ripulisci, categorie selettive, profili, report batch |
| **Documentazione**           | Guida utente bilingue, changelog, troubleshooting, limiti dichiarati onestamente |

---

## 6. Caratteristiche principali in breve

- Ispezione **di sola lettura** prima di qualunque modifica, su **immagini, PDF e Office**
- **Coda di revisione**: tabella riassuntiva di tutti i file caricati con le categorie rilevate,
  da controllare prima di lanciare una pulizia in batch confermata
- Pulizia **selettiva per categoria**, non tutto-o-niente
- **Vista diff prima/dopo**: dopo la pulizia, mostra esattamente quali campi sono cambiati,
  verificati ri-ispezionando l'output effettivo, non previsti a priori
- **100% locale**: nessun file viene mai caricato su un server
- **GPS mostrato solo come testo**, nessuna chiamata automatica a servizi di mappe
- Elaborazione **in batch** con **ZIP** e report **CSV/JSON/HTML** (il report HTML è presentabile
  a un cliente come prova del passaggio di pulizia, senza riprodurre i valori sensibili originali)
- **Profili con nome** salvati nel browser per riusare una configurazione
- **Tema chiaro/scuro** con preferenza salvata localmente, e interfaccia allineata al design
  system condiviso della suite Utility Forge (colori, focus da tastiera, dimensioni delle icone)
- Limiti e comportamenti **documentati onestamente**, senza promesse non mantenibili

---

*Progetto realizzato da Chiara Berti — 2026. Licenza MIT.*
