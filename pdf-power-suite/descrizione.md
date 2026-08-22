# PDF Power Suite — Descrizione del progetto

> Documento di presentazione da allegare al curriculum.
> Spiega in modo semplice **cosa fa** l'applicazione, **come è stata costruita**
> a livello tecnico e **qual è stato il mio ruolo e le competenze dimostrate**.

---

## 1. In una frase

Un'applicazione web che riunisce nove operazioni professionali sui PDF — unire, dividere,
comprimere, applicare filigrana e numerazione Bates, OCR verso testo ricercabile, confronto tra
due versioni, estrazione tabelle, stampa unione da foglio di calcolo e una pipeline configurabile
per concatenarle — interamente nel browser, senza installare nulla e senza inviare i documenti a
un server.

---

## 2. Il problema che risolve

Chi lavora con documenti PDF — studi legali, uffici amministrativi, grafica, editoria — si trova
spesso a dover fare cose più complesse del semplice "unisci due PDF". I problemi tipici sono:

- gli strumenti online gratuiti per operazioni semplici (unire, dividere) abbondano, ma quasi
  sempre **caricano il file su un server esterno**;
- le operazioni più avanzate — OCR per rendere ricercabile una scansione, un confronto affidabile
  tra due versioni di un contratto, la compilazione automatica di centinaia di moduli da un
  elenco Excel — o non sono gratuite, o richiedono software desktop a pagamento, o comunque non
  sono client-side;
- concatenare più operazioni in sequenza (per esempio: comprimi, poi applica una filigrana, poi
  numera le pagine) richiede quasi sempre di ripetere manualmente ogni passaggio con strumenti
  diversi.

PDF Power Suite risolve tutti e tre i problemi in un'unica pagina web autonoma: **gratuita,
completa e privata**. Tutte le nove operazioni — comprese quelle più avanzate — girano nel
browser dell'utente.

---

## 3. Come funziona, passo per passo

Dal punto di vista dell'utente il flusso è pensato per essere immediato:

1. **Apre l'app** — doppio click sul file HTML: si apre nel browser come una normale pagina web,
   con un menu laterale che elenca le nove operazioni disponibili.
2. **Sceglie un'operazione** dal menu — ad esempio "Confronto" per confrontare due versioni di un
   contratto, oppure "Stampa Unione" per generare centinaia di lettere personalizzate da un CSV.
3. **Carica i file richiesti** (uno o più PDF, e per alcune funzioni anche un CSV/XLSX) trascinandoli
   nell'area dedicata o selezionandoli.
4. **Regola le opzioni specifiche** della funzione scelta (ad esempio DPI e qualità per la
   compressione, oppure le soglie di tolleranza per l'estrazione tabelle) e avvia l'elaborazione,
   seguendo l'avanzamento in tempo reale.
5. **Scarica il risultato** — un PDF, oppure uno ZIP se l'operazione produce più file.

Per chi deve ripetere la stessa sequenza di operazioni più volte, il **Generatore di Pipeline**
permette di comporre una catena di fasi (ad esempio: unisci → comprimi → applica filigrana),
eseguirla con un solo click, e salvarne la definizione per riusarla in seguito.

---

## 4. Come è stata sviluppata (parte tecnica)

### 4.1 Architettura: pagina unica, logica modulare, zero build

L'applicazione è distribuita come una manciata di file statici (un `.html` più sei file `.js`)
senza alcun passaggio di compilazione: si apre e funziona. Rispetto a un singolo file monolitico,
la logica JavaScript è stata divisa per dominio funzionale — un modulo centrale con le utilità
condivise e le operazioni base (Unisci, Dividi, Comprimi, Filigrana/Bates), e moduli separati per
Confronto, Estrazione Tabelle, Stampa Unione, OCR e Pipeline — per mantenere ogni file leggibile
e testabile nonostante la quantità di funzionalità.

Le librerie esterne, tutte caricate da CDN a **versione fissata** (mai `@latest`):

| Libreria         | A cosa serve                                                        |
|-------------------|----------------------------------------------------------------------|
| **pdf-lib**       | Creare e modificare PDF: unire pagine, disegnare testo/immagini, compilare moduli AcroForm |
| **pdf.js**        | Renderizzare pagine PDF su canvas ed estrarre il testo (compressione, OCR, confronto, tabelle) |
| **JSZip**         | Comprimere output multi-file in un unico archivio ZIP scaricabile   |
| **SheetJS**       | Leggere file CSV/XLSX per la stampa unione                          |
| **jsdiff**        | Calcolare il confronto a livello di parola tra due testi            |
| **Tesseract.js**  | Motore di riconoscimento ottico dei caratteri (OCR), eseguito in locale |
| **Lucide**        | Le icone vettoriali dell'interfaccia                                 |

### 4.2 Le pipeline di elaborazione (il cuore delle singole funzioni)

Ogni funzione ha una propria catena di trasformazioni, scritta senza framework:

```
PDF caricato → lettura/rasterizzazione (pdf.js) → elaborazione → ricostruzione (pdf-lib) → download
```

Alcuni esempi rappresentativi:

- **Compressione**: ogni pagina viene rasterizzata da pdf.js su un canvas alla risoluzione (DPI)
  scelta dall'utente, ricodificata come JPEG alla qualità scelta, e reinserita in un nuovo PDF
  ricostruito con pdf-lib — con un compromesso dichiarato: il testo non è più selezionabile.

- **OCR verso PDF ricercabile**: ogni pagina viene rasterizzata e passata a Tesseract.js, che
  restituisce ogni parola riconosciuta con il proprio riquadro di delimitazione (bounding box).
  Il PDF di output viene ricostruito disegnando prima l'immagine originale della pagina, poi ogni
  parola riconosciuta come testo PDF reale ma invisibile (`opacity: 0`), posizionato e
  dimensionato in base al proprio riquadro — il documento appare identico all'originale ma il suo
  testo è ora selezionabile e ricercabile.

- **Confronto tra versioni**: il testo di ogni pagina viene estratto con pdf.js e confrontato
  parola per parola con jsdiff (evidenziando aggiunte e rimozioni); in alternativa, le due pagine
  vengono renderizzate su canvas della stessa dimensione e confrontate pixel per pixel per
  produrre una heatmap delle differenze, utile per cogliere cambiamenti di impaginazione che il
  confronto testuale non vedrebbe.

- **Estrazione tabelle**: gli elementi di testo restituiti da pdf.js vengono raggruppati in righe
  in base alla vicinanza della coordinata Y, poi ogni riga viene divisa in colonne dove lo spazio
  orizzontale supera una soglia — un'euristica volutamente semplice, con soglie regolabili
  dall'utente, invece di un modello di riconoscimento tabelle.

- **Stampa unione**: per ogni riga di un CSV/XLSX viene caricata una copia fresca del PDF modulo,
  e ogni colonna viene abbinata (senza distinzione tra maiuscole/minuscole) al campo AcroForm
  corrispondente tramite le API testuali di pdf-lib; i campi senza corrispondenza vengono saltati
  e segnalati, mai causa di un'interruzione dell'intero processo.

### 4.3 Attenzione alle prestazioni e alla robustezza

- **Elaborazione a blocchi con pause asincrone**: ogni ciclo pagina-per-pagina cede periodicamente
  il controllo al browser, così anche documenti da centinaia di pagine non bloccano la scheda.
- **Limiti espliciti e comunicati**: dimensione massima per file, numero massimo di pagine, limite
  di pagine specifico per l'OCR (più oneroso in termini di CPU) e limite di righe per la stampa
  unione — tutti verificati prima di iniziare l'elaborazione, con un messaggio chiaro invece di un
  blocco silenzioso del browser.
- **Robustezza di caricamento**: le funzioni che non richiedono una libreria particolare
  continuano a funzionare anche se il caricamento di quella libreria da CDN fallisse — un
  controllo esplicito evita che un singolo script mancante blocchi l'intera applicazione.

### 4.4 Privacy by design

Tutta l'elaborazione avviene **nel browser dell'utente**, tranne un'unica eccezione dichiarata
esplicitamente sia nell'interfaccia sia nella documentazione: la funzione OCR scarica da una CDN
il motore di riconoscimento e i dati della lingua scelta (non il contenuto del PDF, che resta
sempre locale). Ogni altra funzione — comprese Confronto, Estrazione Tabelle e Stampa Unione, che
maneggiano dati potenzialmente sensibili — non contatta mai alcun server dopo il caricamento
iniziale della pagina.

---

## 5. Il mio ruolo e le competenze dimostrate

Ho ideato e realizzato il progetto **individualmente**, dall'idea iniziale fino al prodotto
finito e documentato. In concreto:

- **Ho progettato l'architettura** dell'applicazione, scegliendo un approccio *multi-file
  client-side senza build* e una scomposizione della logica JavaScript per dominio funzionale, per
  bilanciare la portabilità (nessuna installazione) con la manutenibilità di un progetto che copre
  nove funzionalità distinte.

- **Ho implementato nove pipeline di elaborazione PDF indipendenti**, ciascuna con la propria
  logica di lettura, trasformazione e ricostruzione del documento, integrando cinque librerie
  specializzate (pdf-lib, pdf.js, JSZip, SheetJS, jsdiff) e un motore OCR (Tesseract.js) in un
  'unica interfaccia coerente.

- **Ho progettato e implementato da zero l'algoritmo di posizionamento del testo OCR invisibile**,
  convertendo le coordinate in pixel dei riquadri di riconoscimento nelle coordinate in punti dello
  spazio PDF, per produrre un vero livello di testo ricercabile sovrapposto all'immagine originale
  della scansione.

- **Ho progettato due modalità di confronto complementari tra versioni di un documento** — un
  confronto testuale a livello di parola e un confronto visivo basato su differenza pixel per
  pixel — per coprire sia le modifiche al contenuto sia quelle solo di impaginazione.

- **Ho implementato un'euristica di estrazione tabelle** basata sul clustering spaziale degli
  elementi di testo, con parametri regolabili dall'utente per adattarsi a layout diversi, dopo
  aver valutato consapevolmente il compromesso tra un'euristica semplice e trasparente e un
  modello di riconoscimento più complesso ma opaco.

- **Ho costruito il generatore di pipeline**, con un modello dati per la serializzazione delle
  fasi in JSON (esportazione/importazione) e un meccanismo di richiamo delle configurazioni
  recenti tramite `localStorage`, riutilizzando le stesse funzioni di elaborazione delle singole
  schede per garantire un comportamento identico.

- **Ho curato la sicurezza e la privacy** applicando una Content-Security-Policy rigorosa,
  eliminando ogni uso di `innerHTML`/`onclick` inline con dati provenienti da file caricati,
  sanificando i nomi dei file per download e voci ZIP, e documentando in modo esplicito e onesto
  l'unica eccezione di rete (i dati linguistici dell'OCR) sia nell'interfaccia sia nel README.

- **Ho testato l'applicazione end-to-end** generando documenti PDF di prova e verificando con test
  automatizzati (browser headless) che unione, divisione, filigrana/numerazione Bates, confronto,
  estrazione tabelle, stampa unione, compressione e pipeline producessero l'output atteso.

- **Ho documentato il progetto** in modo bilingue (italiano/inglese), con una guida d'uso
  suddivisa per singola funzionalità, limiti tecnici dichiarati con onestà (incluse le
  approssimazioni dell'OCR e dell'estrazione tabelle), requisiti di sistema e risoluzione dei
  problemi.

### Competenze in sintesi

| Area                          | Competenze dimostrate                                                        |
|-------------------------------|--------------------------------------------------------------------------------|
| **Frontend**                  | HTML, CSS (design responsive), JavaScript (ES6+, async/await, moduli multipli) |
| **Architettura software**     | Progettazione client-side modulare, scelte zero-dependency/zero-build, privacy by design |
| **Elaborazione documenti**    | Manipolazione PDF programmatica (pdf-lib), rendering ed estrazione testo (pdf.js) |
| **Algoritmi**                 | Mappatura coordinate pixel→punti PDF, clustering spaziale per l'estrazione tabelle, diff testuale e visivo |
| **Integrazione di librerie**  | Orchestrazione di sei librerie di terze parti (pdf-lib, pdf.js, JSZip, SheetJS, jsdiff, Tesseract.js) in un'unica applicazione coerente |
| **Sicurezza**                 | Content-Security-Policy, prevenzione XSS, sanificazione input/nomi file        |
| **UX / Product**              | Interfaccia a schede per nove funzionalità, feedback in tempo reale, gestione dei limiti |
| **Testing**                   | Generazione di fixture di test, verifica automatizzata con browser headless    |
| **Documentazione**            | Guida utente bilingue per-funzionalità, changelog, risoluzione problemi        |

---

## 6. Caratteristiche principali in breve

- **Nove operazioni PDF** in un'unica applicazione: unisci, dividi, comprimi, filigrana e Bates,
  OCR, confronto, estrazione tabelle, stampa unione, pipeline
- **OCR verso PDF realmente ricercabile**, non solo un'esportazione di testo semplice
- **Confronto a doppia modalità**: testuale a livello di parola e visivo a livello di pixel
- **Generatore di pipeline** con salvataggio ed esportazione delle configurazioni
- **Nessuna installazione**, funziona **offline** (tranne l'OCR) e **multi-piattaforma**
- **Privacy by design**, con l'unica eccezione di rete dichiarata con chiarezza
- Interfaccia **responsive** con navigazione a schede e feedback in tempo reale su ogni operazione

---

*Progetto realizzato da Chiara Berti — 2026. Licenza MIT.*
