# 🕶️ Document Redaction & Sanitization Studio

> 🇮🇹 **Italiano** | 🇬🇧 [English](README.md)

Un'applicazione web standalone che esegue una **redazione vera** di immagini e PDF — non quella
cosmetica. La maggior parte degli strumenti di "redazione" gratuiti disegna semplicemente un
rettangolo nero *sopra* il contenuto: testo o pixel originali restano sotto, intatti ed estraibili
con un copia-incolla o uno script di due righe. Questo strumento invece **distrugge i dati
sottostanti** a livello di pixel (immagini) oppure **ricostruisce l'intero PDF a partire da
immagini di pagina** (PDF) — e poi verifica per davvero che non resti nulla di estraibile. Tutto
avviene lato client, nel tuo browser: nessun upload, nessun server, nessun account.

---

## 🎯 PACCHETTO COMPLETO

Questo pacchetto contiene:
- **`document-redaction-studio.html`** - L'involucro dell'applicazione (apri questo file per
  avviare l'app)
- **`document-redaction-studio.js`** - Tutta la logica dell'applicazione (caricata dal file HTML;
  tieni i due file nella stessa cartella)
- **`LICENSE`** - Licenza MIT
- **`README.md`** / **`README-IT.md`** - Questa documentazione (inglese / italiano)

---

## ✅ INSTALLAZIONE (NESSUNA RICHIESTA!)

Questa è un'app web **completamente standalone**. Non serve installare:
- ❌ Python, Node.js o altri linguaggi di programmazione
- ❌ Librerie o dipendenze
- ❌ Software aggiuntivo

Due modalità d'uso, entrambe valide:

- **In locale, sul tuo computer** — basta fare doppio clic su `document-redaction-studio.html`: si
  apre nel browser predefinito e tutto (rendering, rilevamento, redazione, ricostruzione del PDF)
  avviene interamente in quella scheda del browser.
- **Condivisa su un server aziendale/intranet** — trattandosi di due file statici (HTML + JS), puoi
  anche copiare la cartella su un qualsiasi server web (o una condivisione file interna, o un
  hosting statico) così i colleghi la raggiungono con un URL invece di avere ognuno una propria
  copia. Nessun backend, nessuna build, nessun linguaggio server-side richiesto.

**Basta aprire il file HTML nel browser!**

---

## 🚀 COME SI USA

L'app ha tre schede, raggiungibili dalla stessa pagina.

### Modalità 1 — Redazione immagine
1. Apri **"Redazione Immagine"** e trascina un file JPEG, PNG o WEBP (max 30 MB).
2. Trascina il mouse per disegnare rettangoli sulle aree da nascondere. Puoi crearne quanti vuoi;
   clicca su un box esistente per rimuoverlo; usa "Annulla ultimo box" / "Cancella tutti" per
   annullare/svuotare.
3. Scegli il colore di riempimento se non vuoi il nero semplice.
4. Clicca **"Applica redazione"**. I box vengono dipinti direttamente sui dati dei pixel del
   canvas — i pixel originali sottostanti spariscono — e l'immagine viene ri-esportata da zero con
   `canvas.toBlob()`. Come effetto collaterale, la ri-codifica rimuove anche eventuali metadati
   EXIF (posizione GPS, modello fotocamera, data/ora, ecc.).
5. Scarica l'immagine redatta.

### Modalità 2 — Redazione PDF (interattiva)
1. Apri **"Redazione PDF"** e trascina un PDF (max 50 MB, max 300 pagine). Ogni pagina viene
   renderizzata su un canvas a schermo a circa 150 dpi.
2. **Opzionale — rilevamento automatico:** seleziona le categorie da cercare (email, telefoni,
   IBAN, numeri simili a carte di credito con verifica del checksum di Luhn, codice fiscale
   italiano) e clicca "Rileva dati sensibili". Le corrispondenze appaiono come box suggeriti
   **arancioni** — non sono ancora una redazione.
3. **Revisione:** clicca un box arancione per confermarlo (diventa **rosso**); clicca un box rosso
   per rimuoverlo; oppure usa "Conferma tutti i suggerimenti" per accettarli tutti insieme. Puoi
   anche disegnare box manuali a mano su qualsiasi pagina, esattamente come nella modalità
   immagine — questi diventano subito rossi/confermati.
4. Facoltativamente imposta un testo di filigrana e/o un prefisso + numero iniziale per la
   numerazione Bates.
5. Clicca **"Applica redazione e ricostruisci PDF"**. Per ogni pagina, tutti i box confermati
   vengono dipinti in nero pieno direttamente sul canvas già renderizzato di quella pagina; poi
   **tutte le pagine dell'intero documento** (redatte o no) vengono esportate come immagini JPEG
   appiattite, e un PDF nuovo di zecca viene ricostruito da queste immagini con pdf-lib.
6. **Verifica fatta per davvero:** l'app riapre subito il PDF appena costruito con pdf.js e chiama
   di nuovo `getTextContent()` su ogni pagina, mostrandoti una riga come *"0 caratteri di testo
   estraibili trovati nel PDF redatto"*. Se quel numero non è mai zero, viene mostrato in modo
   ben visibile come **fallimento**, non nascosto.
7. Scarica il PDF redatto.

### Modalità 3 — Batch PDF
1. Apri **"Batch PDF"** e trascina più PDF.
2. Configura un set di regole riutilizzabile (quali categorie rilevare) e, facoltativamente,
   filigrana/numerazione Bates.
3. Per impostazione predefinita, i rilevamenti **non vengono mai applicati automaticamente** — la
   modalità batch rileva e conta le corrispondenze per ogni file ma lascia i pixel intatti a meno
   che tu non attivi esplicitamente **"Applica automaticamente i rilevamenti senza revisione
   manuale"**, che mostra un avviso ben visibile sui falsi positivi/negativi prima di poterla usare
   per l'elaborazione massiva senza supervisione.
4. Clicca "Avvia elaborazione batch". Ogni file viene elaborato, verificato e offerto in download
   individuale, con un riepilogo per file (pagine, rilevamenti, redazioni applicate, esito della
   verifica).

---

## 📊 LIMITI TECNICI

- **Immagini:** rifiutate oltre **30 MB**. Il lato più lungo è limitato a **4000 px** nell'editor
  (le immagini più grandi vengono ridimensionate per il canvas a schermo) per non bloccare la
  scheda del browser; qualità/dimensione dell'export dipendono dall'immagine originale.
- **PDF:** rifiutati oltre **50 MB** o **300 pagine**, per ogni singolo file, in entrambe le
  modalità (interattiva e batch) — con un messaggio chiaro invece che un blocco.
- **Prestazioni:** il rendering avviene pagina per pagina con piccole pause asincrone così la
  scheda resta reattiva anche con documenti di decine di pagine; i batch molto grandi richiedono
  comunque tempo reale, perché ogni pagina viene realmente rasterizzata e ri-codificata.
- **Il rilevamento PII è euristico, non perfetto.** Il rilevamento basato su regex (con checksum
  di Luhn per i numeri simili a carte) lavora alla granularità dei singoli elementi di testo di
  pdf.js — può non vedere una corrispondenza divisa su due elementi di testo diversi, e può
  segnalare cose che assomigliano solo al pattern (falsi positivi). Proprio per questo i
  rilevamenti sono solo *suggerimenti* per impostazione predefinita e richiedono un clic per
  essere confermati, e proprio per questo l'opzione batch di "applicazione automatica" mostra un
  avviso esplicito.

---

## 🎯 CARATTERISTICHE

✅ **Distruzione reale di pixel/testo** — non un livello cosmetico sopra il contenuto  
✅ **Redazione immagine** con rettangoli a mano libera, annulla, selettore colore, EXIF rimossi come effetto collaterale  
✅ **Redazione PDF** tramite rasterizzazione e ricostruzione, l'unica tecnica che garantisce nessun testo residuo  
✅ **Rilevamento automatico PII** — email, telefono, IBAN, carta di credito (verificata con Luhn), codice fiscale italiano  
✅ **Box suggeriti vs. confermati** — nulla viene redatto senza una conferma esplicita  
✅ **Verifica reale post-esportazione** — riestrae il testo dal PDF finito e ne mostra il conteggio  
✅ **Elaborazione batch** con set di regole riutilizzabile e opt-in esplicito e avvisato per l'esecuzione senza supervisione  
✅ **Filigrana e numerazione sequenziale delle pagine in stile Bates, opzionali**  
✅ **Nessuna installazione, funziona offline** dopo il primo caricamento, interfaccia responsive  
✅ **100% locale** — nulla viene mai caricato da nessuna parte

---

## 💻 REQUISITI DI SISTEMA

### Browser supportati
- ✅ Chrome 90+ (consigliato)
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

Serve un browser moderno con supporto a `<canvas>`, Web Worker e `Blob`/`Uint8Array` (tutti i
browser attuali lo hanno).

### Sistema operativo
- ✅ Windows 10/11
- ✅ macOS 10.15+
- ✅ Linux (Ubuntu, Debian, Fedora, ecc.)
- ✅ Android 9+ (Chrome Mobile)
- ✅ iOS/iPadOS 14+ (Safari)

### Risorse minime
- **RAM:** 4 GB (8 GB consigliati per PDF multi-pagina di grandi dimensioni o elaborazioni batch)
- **Connessione internet:** solo per il primo caricamento, per scaricare pdf.js, pdf-lib e Lucide da CDN

---

## 🔧 RISOLUZIONE PROBLEMI

### La pagina appare senza stile o mancano le icone
**Causa:** gli script da CDN (pdf.js, pdf-lib, Lucide) non si sono caricati — di solito un problema
di connessione.
**Soluzione:** verifica la connessione e ricarica la pagina. La modalità PDF non può funzionare
senza pdf.js/pdf-lib, perché sono queste librerie a occuparsi del rendering e della costruzione
del PDF.

### "File troppo grande" / "Il PDF ha troppe pagine"
**Causa:** il file supera i limiti di sicurezza integrati (30 MB per le immagini; 50 MB o 300
pagine per i PDF).
**Soluzione:** dividi il PDF in parti più piccole, oppure comprimi l'immagine/il PDF prima di
caricarlo.

### Non succede nulla cliccando "Rileva dati sensibili"
**Causa:** nessuna categoria è selezionata.
**Soluzione:** seleziona almeno una categoria (email, telefono, IBAN, carta di credito, codice
fiscale) prima di procedere.

### La riga di verifica mostra un numero maggiore di zero
Significa che il PDF ricostruito contiene ancora testo estraibile — l'app lo segnala
deliberatamente come un fallimento visibile invece di nasconderlo. Normalmente non dovrebbe
succedere (ogni pagina viene rasterizzata in un'immagine prima di essere inserita nel nuovo PDF),
ma se capita non usare quel file e consideralo un difetto da segnalare.

### Il PDF redatto è molto più grande/piccolo dell'originale
È normale: l'output è un PDF nuovo composto interamente da immagini JPEG di pagina, quindi la sua
dimensione dipende dalla risoluzione di rendering (~150 dpi) e dalla qualità JPEG, non dalla
struttura interna del PDF originale. Inoltre non è più selezionabile/ricercabile come testo —
vedi la sezione Privacy e Sicurezza qui sotto per capire perché questo compromesso è inevitabile
con una tecnica realmente sicura.

### Il browser è lento con un batch molto grande
**Soluzione:** elabora meno file per ogni esecuzione batch, chiudi altre schede per liberare RAM,
oppure usa un Chrome/Firefox da desktop invece di un browser mobile per lavori di grandi
dimensioni.

---

## 🔒 PRIVACY E SICUREZZA

✅ **Tutti i dati restano sul tuo computer** — i file vengono letti con la File API ed elaborati
interamente in memoria nella scheda del browser.  
✅ **Nessun file caricato su server esterni.**  
✅ **Nessun tracciamento o analytics.**  
✅ **Nessun account richiesto.**  
✅ **Open source** — puoi ispezionare il codice (due semplici file, nessun bundler, nessuna
minificazione).

### Perché "rasterizza e ricostruisci" invece di modificare chirurgicamente il livello di testo del PDF?

Questa è la scelta di progettazione centrale della modalità PDF, e merita di essere dichiarata in
modo onesto invece che venduta come più di quello che è: **nessuno strumento può rimuovere in modo
davvero sicuro il testo da un content stream di un PDF esistente "chirurgicamente", in loco.** Il
livello di testo di un PDF, i font incorporati, le tabelle dei riferimenti incrociati e gli object
stream sono collegati tra loro in modi che rendono una cancellazione mirata fragile e facile da
sbagliare — una stringa "redatta" può sopravvivere nelle tabelle di subsetting di un font, nella
cronologia di un aggiornamento incrementale, in un oggetto non più referenziato ma ancora presente,
o semplicemente perché la "cancellazione" ha rimosso solo i glifi visibili lasciando intatto
l'operatore di stringa sottostante. È esattamente la classe di bug dietro diversi famosi casi reali
di fallimento della redazione di documenti.

La tecnica usata qui aggira tutto questo per costruzione: ogni pagina viene renderizzata come
bitmap, i box di redazione confermati vengono dipinti direttamente sui pixel di quella bitmap, e
**l'intero documento** — non solo le pagine redatte — viene poi ricostruito come un nuovo PDF
composto solo da immagini di pagina. Non resta alcun livello di testo da nessuna parte nel file
finale in cui qualcosa potrebbe essere sopravvissuto. È il modo noto e corretto per garantire
questa proprietà; il prezzo è che il PDF risultante non è più selezionabile o ricercabile come
testo.

### Hardening applicato in questa versione

- **Nessun `innerHTML`/`onclick` inline con dati derivati da file** — ogni valore che proviene da
  un file caricato (nomi file, testo estratto da un PDF) viene scritto nel DOM con `textContent` e
  collegato con `addEventListener`, mai con `innerHTML` o una stringa di gestore evento inline.
- **Nomi file sanificati** — ogni nome file usato per un download viene ripulito da separatori di
  percorso e caratteri di controllo prima di essere passato al meccanismo di download del browser.
- **Content-Security-Policy rigorosa** — `default-src 'none'` con `script-src` limitato a `'self'`
  più le due origini CDN fissate (cdnjs, unpkg); la logica JavaScript vive interamente in un file
  esterno (`document-redaction-studio.js`) proprio per non dover ricorrere a un'eccezione con hash
  per uno script inline. `worker-src` consente `blob:` e l'origine cdnjs perché pdf.js istanzia il
  proprio worker da uno script caricato da CDN; nient'altro è stato allentato.
- **Dipendenze fissate** — pdf.js, pdf-lib e Lucide sono tutti caricati da URL di versione esatta e
  fissa (mai `@latest`), così il loro codice non può cambiare a tua insaputa, e la versione del
  worker di pdf.js resta allineata a quella della libreria principale.
- **Limiti di dimensione e numero di pagine** — immagini oltre 30 MB e PDF oltre 50 MB o 300
  pagine vengono rifiutati subito con un messaggio chiaro, invece di bloccare la scheda del
  browser.
- **Nessuna applicazione automatica silenziosa di un rilevamento** — i dati PII rilevati
  automaticamente sono sempre mostrati prima come *suggerimento* non confermato; diventano una
  redazione vera solo dopo un clic esplicito (oppure, in modalità batch, dopo un opt-in esplicito
  che porta con sé un proprio avviso a schermo).
- **Verifica reale post-esportazione, non un'affermazione** — dopo aver ricostruito il PDF, l'app
  riapre i byte prodotti con pdf.js e riestrae il testo di ogni pagina per confermare che il
  conteggio sia zero, segnalandolo in modo ben visibile se non lo è.

### Limiti noti, dichiarati onestamente

- Il rilevamento automatico dei dati PII è basato su regex/euristiche e lavora alla granularità
  dei singoli elementi di testo di pdf.js; può non vedere alcuni dati sensibili (falsi negativi) e
  può segnalare del testo non sensibile (falsi positivi). È un punto di partenza per la revisione
  manuale, non una garanzia di completezza — proprio per questo ogni suggerimento richiede una
  conferma per impostazione predefinita. L'opzione batch di "applicazione automatica" senza
  supervisione è disattivata per impostazione predefinita e avvisa esplicitamente di questo
  compromesso quando viene attivata.
- I box disegnati a mano sono precisi solo quanto lo è chi li disegna — un box che non copre
  interamente il contenuto sensibile ne lascerà una parte visibile nell'immagine di pagina
  appiattita.
- Il PDF redatto è un insieme di immagini di pagina: non è selezionabile come testo, non è
  ricercabile, e la dimensione del file dipende dalla risoluzione di rendering/qualità JPEG
  piuttosto che dalla struttura del PDF originale. Questo è il costo diretto e dichiarato della
  garanzia descritta sopra.

---

## 📝 CHANGELOG

### Versione 1.1
- 🌓 **Interruttore tema chiaro/scuro** nell'intestazione, memorizzato per browser
  (`localStorage`) e allineato per default alla preferenza del sistema operativo. Il tema cambia
  solo la cornice dell'interfaccia: ogni canvas (pixel dell'immagine, pagine PDF renderizzate,
  colori dei box di redazione) viene sempre disegnato in modo identico in entrambi i temi, perché
  è proprio il contenuto da redigere e non deve mai sembrare diverso.
- 🎨 Token di design condivisi con tutta la suite Utility Forge, per un aspetto coerente tra i
  vari strumenti; componente alert unificato (nasconde da sé successo/info dopo 6s, errore/avviso
  dopo 8s; gli alert persistenti come l'avviso di applicazione automatica in batch restano
  visibili).
- ♿ Interventi di accessibilità: anelli di focus visibili, `aria-label` su ogni controllo solo-icona
  e input file, `role="status" aria-live="polite"` sugli alert, controlli di redazione
  raggiungibili da tastiera (vedi le nuove scorciatoie sotto). Breakpoint responsive uniformato a
  680px.
- 🗂️ **Pannello globale dei rilevamenti**: un elenco pieghevole di tutti i box suggeriti/confermati
  su *tutte* le pagine del PDF corrente (pagina, categoria, estratto del testo trovato, stato),
  ogni riga cliccabile per saltare direttamente a quel box — non serve più scorrere un documento
  lungo una schermata alla volta per trovare cosa è stato segnalato.
- ⌨️ **Scorciatoie da tastiera** per la revisione dei rilevamenti PDF: `Invio`/`Spazio` conferma il
  box selezionato, `Canc`/`Backspace` lo rimuove, `[`/`]` o le frecce spostano la selezione tra i
  box della pagina corrente, `PagSu`/`PagGiù` o `p`/`n` cambiano pagina. Un pulsante "?" mostra
  l'elenco delle scorciatoie; una riga di stato annuncia la selezione corrente per chi usa uno
  screen reader.
- 🏷️ **Etichettatura del motivo di redazione**: ogni box porta ora con sé la sua categoria di
  rilevamento (email, telefono, IBAN, carta di credito, codice fiscale o manuale) e un motivo in
  testo libero modificabile, entrambi visibili nel pannello dei rilevamenti. Il riepilogo dopo
  l'esportazione riporta ora un vero e proprio registro di controllo, es. *"12 redazioni
  applicate: 4 email, 3 IBAN, 5 manuali"*, sia nel flusso interattivo sia in quello batch — non
  più un semplice conteggio.

### Versione 1.0
- 🎉 Prima versione
- ✅ Redazione immagine con rettangoli a mano libera, annulla/cancella, selettore colore,
  distruzione diretta dei pixel
- ✅ Redazione PDF interattiva: rendering delle pagine, rilevamento automatico PII (email,
  telefono, IBAN, carta di credito con verifica Luhn, codice fiscale italiano), flusso
  suggerito/confermato, box manuali, opzioni di filigrana e numerazione Bates
- ✅ Esportazione PDF tramite rasterizzazione e ricostruzione con pdf-lib, con verifica reale
  dell'estrazione del testo mostrata all'utente dopo l'esportazione
- ✅ Elaborazione batch di PDF con set di regole riutilizzabile e opzione di applicazione
  automatica esplicitamente avvisata
- 🔒 CSP rigorosa con tutta la logica in uno script esterno, nomi file sanificati, dipendenze CDN
  fissate, limiti di dimensione/pagine

---

## 🆘 SUPPORTO

Per problemi, domande o suggerimenti, apri una issue su GitHub.

---

## 📜 LICENZA

Licenza MIT - vedi il file [LICENSE](LICENSE) per i dettagli.

Copyright (c) 2026 Chiara Berti 13

---

**Document Redaction & Sanitization Studio v1.1**
Di Chiara Berti - 2026
