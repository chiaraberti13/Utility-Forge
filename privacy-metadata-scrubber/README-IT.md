# 🕵️ Privacy & Metadata Forensics Studio

> 🇬🇧 [English](README.md) | 🇮🇹 **Italiano**

Una web app autonoma che ispeziona e permette di rimuovere in modo selettivo i metadati nascosti
contenuti in immagini (JPEG/PNG/WEBP), documenti PDF e file Office Open XML (.docx/.xlsx/.pptx) —
coordinate GPS, nomi degli autori, cronologia di modifica, campi del dizionario Info dei PDF,
modifiche tracciate, commenti. Tutto gira lato client, nel tuo browser: nulla di ciò che carichi
viene mai inviato a un server. Va oltre il tipico strumento gratuito "rimuovi EXIF" perché prima
mostra esattamente cosa ha trovato, in linguaggio semplice, e solo dopo decidi cosa rimuovere.

---

## 🎯 PACCHETTO COMPLETO

Questo pacchetto contiene:
- **`privacy-metadata-scrubber.html`** — la shell dell'applicazione e l'interfaccia (apri questo file)
- **`privacy-metadata-scrubber.js`** — tutta la logica dell'applicazione, caricata dal file HTML
- **`LICENSE`** — Licenza MIT
- **`README.md`** / **`README-IT.md`** — questa documentazione (Inglese / Italiano)
- **`descrizione.md`** — presentazione del progetto in italiano (stile portfolio/curriculum)

`privacy-metadata-scrubber.html` e `privacy-metadata-scrubber.js` devono rimanere nella stessa
cartella — il file HTML carica il file JS con un percorso relativo semplice.

---

## ✅ INSTALLAZIONE (NESSUNA!)

Questa è una web app **completamente standalone**. Non devi installare:
- ❌ Python, Node.js o altri linguaggi di programmazione
- ❌ Librerie o dipendenze
- ❌ Software aggiuntivo

Due modi per usarla, entrambi validi:

- **In locale, sul tuo computer** — basta fare doppio click su `privacy-metadata-scrubber.html`; si
  apre nel browser predefinito e tutto (analisi, rimozione dei metadati, creazione dello ZIP)
  avviene interamente in quella scheda del browser.
- **Condivisa su un server di team/intranet** — essendo un file HTML statico più un file JS, puoi
  anche mettere la cartella su un qualunque server web (o una condivisione file interna, o un
  hosting statico come GitHub Pages), così i colleghi la raggiungono con un URL invece di dover
  avere ciascuno la propria copia. Nessun backend, nessuna build, nessun linguaggio lato server
  richiesto.

**Basta aprire il file HTML nel browser!**

---

## 🚀 COME USARE

### Passo 1: Aprire l'applicazione
1. Fai **doppio click** sul file `privacy-metadata-scrubber.html` (oppure apri l'URL, se ospitata
   su un server)
2. Si aprirà automaticamente nel tuo browser predefinito
3. Funziona con: Chrome, Firefox, Safari, Edge (qualsiasi browser moderno e aggiornato)

💡 **Nota:** la pagina carica quattro piccole librerie (analisi metadati immagini, gestione PDF,
creazione ZIP, icone) da un CDN via internet ogni volta che la apri, quindi serve una connessione
per caricare la pagina stessa. L'elaborazione che avviene *dopo* il caricamento — leggere e ripulire
i tuoi file — non invia mai nulla in rete.

✅ **Come capire se si è caricata correttamente:** se vedi l'icona a scudo nell'intestazione e
l'elenco di checkbox sotto "What to remove", le librerie si sono caricate bene. Se il layout sembra
senza stile o l'elenco delle categorie è vuoto, controlla la connessione e ricarica — vedi
"Risoluzione problemi" più sotto.

### Passo 2: Scegli cosa rimuovere
Sotto **"What to remove"**, seleziona le categorie che vuoi ripulire:
- **GPS / location** (immagini)
- **Author / editor names** (immagini, PDF, Office)
- **PDF metadata fields** (Titolo, Oggetto, Parole chiave, Producer, date)
- **Office comments & tracked changes** (.docx)

Tutte e quattro sono selezionate di default. Puoi salvare la selezione corrente come **profilo con
nome** (in cima alla pagina) e richiamarla in seguito — i profili sono salvati solo nella memoria
locale del tuo browser, su questo dispositivo.

### Passo 3: Aggiungi i tuoi file
**Trascina** i file nell'area di caricamento, oppure clicca per aprire il selettore file. Puoi
selezionare insieme immagini, PDF e documenti Office in un unico batch. Qualsiasi altro tipo di
file (o file oltre i limiti di dimensione/numero indicati sotto) viene rifiutato subito con un
messaggio chiaro, mentre i file validi nello stesso batch vengono comunque accettati.

### Passo 4: Ispeziona
Clicca **"Inspect all"**, oppure espandi la scheda di un file e clicca il suo pulsante
**"Inspect"**, per vedere un report di sola lettura di esattamente quali metadati contiene quel
file — nessun file viene modificato in questo passaggio. Le coordinate GPS, se trovate, vengono
mostrate come numeri decimali semplici con un link opzionale che puoi cliccare per aprire la
posizione su OpenStreetMap; l'app stessa non carica mai una tile di mappa né contatta alcun
servizio di mappe per tuo conto.

### Passo 5: Ripulisci (Scrub)
Clicca **"Scrub all"**, oppure il pulsante **"Scrub"** di un singolo file, per produrre un file
**nuovo** con le categorie selezionate rimosse. Il file originale sul disco non viene mai toccato —
viene generato un file nuovo e separato da scaricare. Un file i cui unici metadati trovati non
corrispondono a nessuna categoria selezionata viene saltato invece di essere ri-codificato
inutilmente, e mostra "Skipped" nel suo stato.

### Passo 6: Scarica
- **Per singolo file**: clicca "Download" sulla scheda del file una volta che mostra "Scrubbed".
- **Batch intero**: clicca **"Download ZIP of scrubbed files"** per ottenere un unico `.zip` con
  tutti i file ripuliti più `scrub_report.csv` e `scrub_report.json` che riassumono l'operazione.
- **Solo report**: i pulsanti "Report (CSV)" / "Report (JSON)" esportano da soli lo stesso riepilogo
  per file (nome, categorie trovate, categorie rimosse, stato), per ogni file caricato, ripulito o
  meno.

---

## 📊 LIMITI TECNICI

- **Limite per file: 50 MB.** I file più grandi vengono rifiutati subito con un messaggio chiaro;
  gli altri file validi nello stesso batch vengono comunque accettati.
- **Limite di batch: 200 file.** Aggiungere file che porterebbero il totale oltre 200 rifiuta
  l'intera nuova selezione con un messaggio che chiede di aggiungerne meno alla volta.
- **Tipi accettati:** immagini JPEG, PNG, WEBP; `.pdf`; `.docx`, `.xlsx`, `.pptx`. Qualsiasi altro
  formato (compresi i vecchi formati binari `.doc`/`.xls`/`.ppt`, `.rtf`, `.odt`, archivi cifrati,
  ecc.) viene rifiutato con un messaggio esplicativo invece di essere ignorato silenziosamente.
- **Prestazioni pratiche:** qualche decina di file piccoli/medi vengono ispezionati e ripuliti in
  pochi secondi. Batch molto grandi (vicini al limite di 200 file / 50MB per file) richiederanno
  più tempo e più memoria, dato che tutto avviene nella scheda del browser e non su un server.

---

## 🎯 CARATTERISTICHE

✅ **Nessuna installazione** — basta aprire il file HTML
✅ **Passo Inspect di sola lettura** prima di qualsiasi azione distruttiva
✅ **Rimozione selettiva** per categoria, non tutto-o-niente
✅ **Profili con nome** salvati localmente, per riusare una configurazione di pulizia
✅ **Elaborazione in batch** con un unico download ZIP più report riassuntivo CSV/JSON
✅ **Drag & drop** e azioni per singolo file o per intero batch
✅ **GPS mostrato solo come testo** — nessun caricamento automatico di tile di mappa, mai
✅ **Multi-piattaforma** — Windows, Mac, Linux, Android, iOS
✅ **Design responsive** — si adatta da desktop fino alla larghezza di uno smartphone
✅ **Limiti documentati onestamente** — vedi Privacy e Sicurezza più sotto per sapere esattamente
   cosa è garantito e cosa no

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
- **RAM:** 4 GB consigliati, di più per batch grandi vicini al limite di 200 file/50MB
- **Connessione internet:** serve solo per caricare la pagina stessa (le quattro librerie da CDN)

---

## 🔧 RISOLUZIONE PROBLEMI

### Il file HTML non si apre nel browser
1. Click destro su `privacy-metadata-scrubber.html`
2. Seleziona "Apri con"
3. Scegli il tuo browser (Chrome consigliato)

### Le icone o le checkbox non si vedono / la pagina sembra senza stile
**Causa:** una delle quattro librerie CDN non si è caricata (problema di connessione).
**Soluzione:**
1. Verifica la connessione internet
2. Ricarica la pagina (F5 o Cmd+R)
3. Se la tua rete blocca `cdn.jsdelivr.net`, `cdnjs.cloudflare.com` o `unpkg.com`, chiedi
   all'amministratore di rete di sbloccarli — l'app non può sostituire un'altra fonte, per scelta
   di progettazione (vedi la nota sulla CSP più sotto).

### Rifiuto "unsupported type" per un file che mi aspettavo funzionasse
Sono accettate solo immagini JPEG/PNG/WEBP, `.pdf`, e `.docx`/`.xlsx`/`.pptx`. I vecchi formati
binari di Office (`.doc`, `.xls`, `.ppt`) e altri formati documento non sono contenitori ZIP Office
Open XML e sono fuori dallo scopo di questo strumento.

### "Could not parse this PDF (it may be encrypted or malformed)"
I PDF protetti da password/cifrati, e alcune strutture PDF molto insolite o corrotte, non possono
essere analizzati dalla libreria pdf-lib su cui si basa questo strumento. Rimuovi prima la password
con il tuo lettore PDF, poi riprova.

### Un .docx/.xlsx/.pptx non si apre più dopo la pulizia
Questo strumento ricostruisce il contenitore ZIP e riscrive un piccolo numero di parti XML. Se un
file era già insolito (ad esempio già corrotto prima di iniziare, o prodotto da software non
standard), la ricostruzione può occasionalmente romperlo. Conserva il file originale finché non hai
verificato che la copia ripulita si apre correttamente in Word/Excel/PowerPoint.

### I colori dell'immagine ripulita sembrano leggermente diversi
È previsto per le immagini che avevano un profilo colore ICC incorporato (comune nelle foto
professionali/wide-gamut) — vedi "Profilo colore ICC" nella sezione Privacy e Sicurezza più sotto.

### Il browser rallenta con un batch molto grande
1. Dividi il batch in gruppi più piccoli
2. Chiudi altre schede del browser per liberare memoria
3. Usa un browser desktop invece che mobile per i batch grandi

---

## 🔒 PRIVACY E SICUREZZA

✅ **Tutti i dati rimangono sul tuo computer** — ogni analisi e ogni pulizia avviene nella scheda
   del browser
✅ **Nessun file viene caricato su alcun server** — questo strumento non ha alcun backend
✅ **Nessun tracking o analytics**
✅ **Nessun account richiesto**
✅ **Open source** — puoi leggere ogni riga di `privacy-metadata-scrubber.js`

Questa sezione documenta, con precisione e senza esagerare, cosa è realmente protetto e quali sono
i limiti reali di ogni operazione di pulizia.

**Gestione del GPS.** Quando vengono trovate coordinate GPS in un'immagine, sono mostrate come
testo decimale semplice (latitudine/longitudine). L'app non carica mai una tile di mappa né chiama
alcuna API di mappe per tuo conto — l'unico modo per vedere la posizione su una mappa è un link
esplicito `<a target="_blank">` verso OpenStreetMap che **devi cliccare tu**, che si apre poi nel
tuo browser usando la tua connessione di rete, non quella di questa pagina.

**Pulizia delle immagini (ri-codifica via canvas).** Le immagini vengono ripulite disegnando i
pixel decodificati su un `<canvas>` in memoria alle dimensioni originali e ri-esportando con
`canvas.toBlob()` (JPEG a qualità 0.92; PNG senza perdita; WEBP alla massima qualità offerta
dall'API canvas). Ri-codificare in questo modo elimina intrinsecamente ogni blocco di metadati
EXIF/IPTC/XMP, perché nessuno di essi fa parte dei dati dei pixel che il canvas porta avanti.
**Effetto collaterale, dichiarato senza mezzi termini:** questo rimuove anche il profilo colore ICC
incorporato, perché l'esportazione da canvas non porta con sé alcun profilo colore. Nella maggior
parte delle foto comuni questo è invisibile; nelle immagini professionali/wide-gamut può causare
uno spostamento di colore molto lieve, di solito impercettibile. Per WEBP in particolare, la
"qualità 1.0" di `canvas.toBlob()` è alta qualità ma non è una garanzia di ri-codifica WEBP
*lossless* bit-per-bit su tutti i browser (il vero WEBP lossless richiede una modalità di codifica
che l'API Canvas non espone) — converti prima in PNG se hai bisogno di un output garantito senza
perdita.

**Pulizia dei PDF (pdf-lib).** "Author / editor names" azzera i campi Author e Creator del
dizionario Info. "PDF metadata fields" azzera Title, Subject, Keywords e Producer, e — poiché
pdf-lib non offre un'API per eliminare del tutto le chiavi CreationDate/ModificationDate —
**sovrascrive** entrambe le date con un valore segnaposto fisso (epoca Unix, 1970-01-01) invece di
lasciare le tue date reali nel file. È una sovrascrittura, non una vera rimozione della chiave, ed è
documentato qui perché nessuno dia per scontato il contrario. **Cosa questo strumento NON
garantisce:** la scansione grezza a livello di byte mostrata nel report di Inspect conta le
occorrenze letterali di `/JavaScript`, `/JS`, `/EmbeddedFile` e `/OpenAction` nei byte del PDF solo
come segnale euristico — non è uno scanner di sicurezza, può produrre falsi positivi (ad esempio
quelle stringhe che compaiono dentro un testo normale), non può vedere dentro gli stream di oggetti
compressi, e il processo di riscrittura al salvataggio di pdf-lib in genere elimina gli oggetti non
referenziati ma non offre **nessuna API e nessuna garanzia** che JavaScript incorporato o allegati
vengano rimossi. Se questo è rilevante per il tuo caso d'uso, considera un PDF con contenuto attivo
come bisognoso di un sanitizzatore PDF dedicato, non solo di questo strumento.

**Pulizia dei documenti Office (JSZip + DOMParser).** "Author / editor names" azzera i campi
`dc:creator` e `cp:lastModifiedBy` dentro `docProps/core.xml`, mantenendo l'XML strutturalmente
valido. "Office comments & tracked changes" (solo docx) rimuove ogni parte `word/comments*.xml`
trovata più le relative voci di override in `[Content_Types].xml` e le relazioni in
`word/_rels/document.xml.rels`, e risolve le modifiche tracciate con la semantica "accetta tutte le
modifiche": gli elementi `<w:del>` (contenuto eliminato) vengono rimossi del tutto, e gli elementi
wrapper `<w:ins>` (contenuto inserito) vengono "spacchettati" così che il testo inserito resti come
contenuto finale ordinario. Questo strumento tocca solo le parti XML descritte sopra — non analizza
intestazioni/piè di pagina, oggetti incorporati o macro alla ricerca di ulteriori informazioni
identificative.

**Sicurezza del rendering.** Ogni valore letto da un file caricato (valori dei tag EXIF, stringhe di
metadati PDF, valori dei campi XML di Office, nomi file, messaggi d'errore) viene scritto nella
pagina usando `textContent` e creazione di nodi DOM — mai `innerHTML` e mai una stringa `onclick`
inline costruita con dati provenienti dal file — così un file costruito ad arte non può iniettare
script nella pagina.

**Sicurezza dei nomi file.** Ogni nome file prodotto da questo strumento, sia per un download
singolo che per una voce dello ZIP, viene ripulito da `/ \ : * ? " < > |` e caratteri di controllo
prima dell'uso, e i nomi duplicati all'interno dello stesso ZIP vengono resi automaticamente univoci
con un suffisso numerico invece di sovrascriversi in silenzio.

**Content-Security-Policy.** La pagina applica:
```
default-src 'none'; script-src 'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://unpkg.com; style-src 'unsafe-inline'; img-src data: blob:; connect-src 'self'; base-uri 'none'; form-action 'none'
```
Tutta la logica applicativa vive nel file separato `privacy-metadata-scrubber.js` (caricato tramite
`script-src 'self'`), quindi — a differenza di un vecchio schema a file unico che richiede un hash
SHA-256 per uno script inline — qui non c'è nessun hash di script inline da tenere sincronizzato.
Possono eseguire script solo le tre origini CDN che effettivamente servono una libreria; tutto il
resto è negato di default. `img-src` consente solo `blob:`/`data:` (necessario per il percorso di
decodifica immagine via canvas), mai un'origine remota, ed è proprio questo che rende la garanzia
"nessuna tile di mappa viene mai caricata" imposta strutturalmente e non solo una promessa scritta
nel testo.

**Dipendenze fissate.** Tutte e quattro le librerie CDN sono caricate a una versione fissa esatta
(exifr 7.1.3, pdf-lib 1.17.1, JSZip 3.10.1, Lucide 0.469.0) invece di `@latest`, così il loro codice
non può cambiare a tua insaputa.

---

## 💾 CONDIVISIONE

Puoi condividere l'intera cartella con colleghi:
1. Copia `privacy-metadata-scrubber.html` e `privacy-metadata-scrubber.js` (devono restare
   insieme) su una chiavetta USB, oppure l'intera cartella incluso LICENSE/README
2. Oppure condividi via email/WeTransfer/Google Drive
3. Chi riceve deve solo aprire `privacy-metadata-scrubber.html`

**Nessuna installazione richiesta per chi riceve i file!**

---

## 📝 CHANGELOG

### Versione 1.0
- 🎉 Prima release
- ✅ Inspect: EXIF/GPS/IPTC/XMP per le immagini (exifr), dizionario Info dei PDF + scansione
  euristica a livello di byte (pdf-lib), proprietà core/app di Office + rilevamento
  commenti/modifiche tracciate (JSZip + DOMParser)
- ✅ Scrub: ri-codifica via canvas per le immagini, azzeramento selettivo del dizionario Info per i
  PDF, azzeramento dell'identità in core.xml + risoluzione commenti/modifiche tracciate per i
  documenti Office
- ✅ Checkbox per categoria con profili con nome, salvati localmente
- ✅ Elaborazione in batch con output ZIP e report riassuntivo CSV/JSON
- 🔒 File JS esterno (nessun hash CSP per script inline necessario), CSP rigorosa, nomi file
  sanificati e resi univoci, rendering solo tramite `textContent`, versioni delle dipendenze CDN
  fissate
- ✅ Documentazione bilingue (Inglese / Italiano)

---

## 🆘 SUPPORTO

Per problemi, domande o suggerimenti, apri una issue su GitHub.

---

## 📜 LICENZA

Licenza MIT - vedi il file [LICENSE](LICENSE) per i dettagli.

Copyright (c) 2026 Chiara Berti 13

---

**Privacy & Metadata Forensics Studio v1.0**
Di Chiara Berti - 2026
