# Document Redaction & Sanitization Studio — Descrizione del progetto

> Documento di presentazione da allegare al curriculum.
> Spiega in modo semplice **cosa fa** l'applicazione, **come è stata costruita**
> a livello tecnico e **qual è stato il mio ruolo e le competenze dimostrate**.

---

## 1. In una frase

Un'applicazione web che esegue una **redazione realmente irreversibile** di immagini e PDF —
distruggendo i pixel o il testo sottostante invece di limitarsi a nasconderli sotto un rettangolo
nero — e che **verifica da sola** il risultato, riestraendo il testo dal documento finito per
dimostrare che non è rimasto nulla di recuperabile. Tutto avviene nel browser, senza installare
nulla e senza inviare dati su internet.

---

## 2. Il problema che risolve

Chi deve condividere un documento — un contratto, un referto, un estratto conto, una scansione con
dati personali — ha spesso bisogno di **oscurare** alcune informazioni prima di inviarlo. Il
problema è che la maggior parte degli strumenti gratuiti (e anche alcuni a pagamento) fa una
**redazione solo cosmetica**: disegna un rettangolo nero sopra il contenuto, ma il testo o i pixel
originali restano nel file, recuperabili con un semplice copia-incolla o con uno script di poche
righe. È una categoria di errore così comune che ha causato diverse fughe di dati reali e
documentate.

Questa app risolve il problema alla radice, con due tecniche diverse a seconda del formato:

- per le **immagini**, i rettangoli di redazione vengono dipinti direttamente sui dati dei pixel
  del canvas prima dell'esportazione — non su un livello separato rimovibile;
- per i **PDF**, l'intero documento viene rasterizzato e ricostruito da zero come una sequenza di
  immagini di pagina, l'unico modo davvero sicuro di garantire che non resti alcun livello di
  testo recuperabile, dato che nessuno strumento può "editare chirurgicamente" in sicurezza il
  content stream di un PDF esistente.

E soprattutto: l'app non si limita ad affermare che la redazione ha funzionato, la **verifica**,
riaprendo il file appena creato ed estraendone di nuovo il testo.

---

## 3. Come funziona, passo per passo

Dal punto di vista dell'utente il flusso cambia leggermente a seconda della modalità scelta.

**Redazione immagine:**
1. Carica un'immagine (JPEG/PNG/WEBP) trascinandola o selezionandola.
2. Disegna a mano uno o più rettangoli sopra le aree da nascondere.
3. Preme "Applica redazione": i rettangoli vengono dipinti sui pixel reali e l'immagine viene
   ri-esportata da zero (il che rimuove anche gli eventuali metadati EXIF).
4. Scarica l'immagine redatta.

**Redazione PDF (interattiva):**
1. Carica un PDF: ogni pagina viene renderizzata su un canvas nel browser.
2. Preme "Rileva dati sensibili": l'app analizza il testo di ogni pagina con espressioni regolari
   (email, telefoni, IBAN, carte di credito con verifica del checksum di Luhn, codice fiscale) e
   propone dei box **suggeriti**, in arancione — nessuna redazione è ancora avvenuta.
3. L'utente rivede i suggerimenti: un clic conferma un box (diventa rosso), un secondo clic lo
   rimuove. Può anche disegnare box manuali su qualsiasi pagina.
4. Preme "Applica redazione e ricostruisci PDF": tutti i box confermati vengono dipinti in nero
   sui pixel di ciascuna pagina già renderizzata, poi **ogni pagina dell'intero documento** viene
   esportata come immagine e un PDF completamente nuovo viene ricostruito da queste immagini.
5. L'app **riapre subito il PDF appena creato** e ne riestrae il testo, mostrando un messaggio
   chiaro tipo "0 caratteri di testo estraibili trovati" — o segnalando in modo ben visibile un
   fallimento, se il conteggio non fosse zero.
6. Scarica il PDF redatto.

**Batch PDF:** lo stesso motore di rilevamento e ricostruzione viene applicato in sequenza a più
file, con un set di regole riutilizzabile e un interruttore esplicito (disattivato di default, con
avviso) per applicare i rilevamenti automatici senza revisione manuale in esecuzioni non presidiate.

---

## 4. Come è stata sviluppata (parte tecnica)

### 4.1 Architettura: due file, zero dipendenze da installare

L'applicazione è composta da **un file HTML** (struttura e stile) e **un file JavaScript esterno**
che contiene tutta la logica. Tenere il JavaScript in un file separato — invece che inline — è una
scelta deliberata di sicurezza: permette alla pagina di avere una Content-Security-Policy con
`script-src` limitato a `'self'` più le origini CDN, senza dover ricorrere a un'eccezione con hash
per uno script inline.

Le librerie esterne, caricate da CDN con versione fissata (mai `@latest`):

| Libreria    | A cosa serve                                                             |
|-------------|---------------------------------------------------------------------------|
| **pdf.js**  | Renderizzare ogni pagina PDF su un canvas ed estrarne il testo con posizione |
| **pdf-lib** | Ricostruire da zero un nuovo PDF a partire dalle immagini di pagina, con filigrana e numerazione |
| **Lucide**  | Le icone vettoriali dell'interfaccia                                     |

### 4.2 La pipeline di redazione (il cuore dell'app)

```
File caricato → rendering su canvas → (rilevamento PII opzionale) → conferma umana →
  → pittura pixel neri sul canvas → esportazione pagina come immagine →
  → ricostruzione PDF da immagini con pdf-lib → riapertura e riestrazione testo → verifica
```

1. **Rendering** — ogni pagina PDF viene renderizzata da pdf.js su un `<canvas>` a ~150dpi.
2. **Rilevamento PII** — per ogni elemento di testo restituito da `page.getTextContent()`, viene
   ricostruito il rettangolo sulla pagina a partire dalla sua matrice di trasformazione
   (`item.transform`), tradotto in coordinate del canvas con `viewport.convertToViewportRectangle`,
   e il testo dell'elemento viene passato a un motore di regex per categoria: email, telefono,
   IBAN, carta di credito (con verifica del **checksum di Luhn** per ridurre i falsi positivi) e
   codice fiscale italiano.
3. **Conferma umana obbligatoria** — nessun box rilevato automaticamente diventa una redazione
   reale finché l'utente non lo conferma con un clic (o, in batch, finché non attiva
   esplicitamente l'opzione di applicazione automatica, mostrata con un avviso).
4. **Distruzione dei pixel** — al momento dell'applicazione, i box confermati vengono dipinti con
   `fillRect` direttamente sul canvas già renderizzato di ciascuna pagina: è una scrittura
   distruttiva sui dati dei pixel, non un livello sovrapposto.
5. **Ricostruzione del PDF** — ogni pagina (redatta o no) viene esportata come JPEG con
   `canvas.toBlob()`, incorporata in un documento pdf-lib nuovo con `embedJpg`, e posizionata a
   piena pagina con `drawImage`. Filigrana e numerazione Bates, se richieste, vengono aggiunte con
   `drawText`.
6. **Verifica reale** — il PDF appena costruito viene riaperto con `pdfjsLib.getDocument()` e per
   ogni pagina viene richiamato di nuovo `getTextContent()`, sommando i caratteri trovati. Il
   risultato (idealmente zero) viene mostrato esplicitamente all'utente, con un messaggio di
   allarme ben visibile nel caso — non previsto ma da non nascondere mai — in cui non lo fosse.

### 4.3 Interazione e prestazioni

- Disegno dei rettangoli con **due canvas sovrapposti** per pagina: uno di contenuto (renderizzato
  da pdf.js) e uno trasparente per l'interazione (trascinamento con mouse/touch, click per
  confermare o rimuovere un box), con conversione delle coordinate CSS→pixel del canvas per
  restare precisi anche quando la pagina è ridimensionata in modo responsive.
- Il rendering di documenti con molte pagine è spezzato con piccole pause asincrone (`setTimeout`)
  per non bloccare l'interfaccia del browser.
- Limiti di sicurezza applicati prima di elaborare qualunque file: 30 MB per le immagini, 50 MB e
  300 pagine per i PDF, con messaggi di errore chiari invece di blocchi silenziosi.

### 4.4 Privacy by design

Tutta l'elaborazione avviene **nel browser dell'utente**: nessun file viene caricato su server
esterni, nessun tracciamento, nessun account. Per un tool che tratta dati potenzialmente molto
sensibili (documenti con informazioni personali, finanziarie, sanitarie), questa non è una
funzionalità accessoria ma il presupposto stesso del progetto.

---

## 5. Il mio ruolo e le competenze dimostrate

Ho ideato e realizzato il progetto **individualmente**, dall'idea iniziale fino al prodotto finito
e documentato. In concreto:

- **Ho progettato l'architettura** dell'applicazione scegliendo un approccio *client-side,
  zero-install*, con la logica separata in un file JavaScript esterno per poter applicare una
  Content-Security-Policy rigorosa senza eccezioni per script inline.

- **Ho implementato la tecnica di redazione "rasterizza e ricostruisci"** per i PDF, la sola in
  grado di garantire l'assenza di testo residuo in un documento PDF esistente, comprendendo e
  documentando esplicitamente perché una modifica chirurgica del content stream di un PDF non è
  mai davvero sicura.

- **Ho costruito una pipeline di rilevamento automatico di dati sensibili** basata sull'estrazione
  del testo posizionato di pdf.js, con regex dedicate per email, telefono, IBAN, carta di credito
  (con **verifica del checksum di Luhn** per ridurre i falsi positivi) e codice fiscale italiano,
  progettando deliberatamente un flusso "suggerito → confermato dall'utente" per non applicare mai
  automaticamente e silenziosamente una redazione.

- **Ho progettato e implementato l'editor visuale** per il disegno di rettangoli di redazione a
  mano libera su immagini e su ogni pagina di un PDF, con interazione mouse e touch, su un sistema
  a doppio canvas (contenuto + overlay interattivo).

- **Ho implementato una verifica automatica reale del risultato**: dopo la ricostruzione del PDF,
  l'app lo riapre e ne riestrae il testo per dimostrare — non solo affermare — che la redazione ha
  funzionato, mostrando un fallimento in modo ben visibile nel caso contrario.

- **Ho progettato la modalità di elaborazione batch**, con un set di regole riutilizzabile e un
  interruttore esplicito, disattivato di default e corredato di avviso, per l'applicazione
  automatica dei rilevamenti in esecuzioni non presidiate su più file.

- **Ho curato l'hardening di sicurezza dell'interfaccia**: nessun `innerHTML`/`onclick` inline con
  dati provenienti da file caricati dall'utente, nomi file sanificati per i download, dipendenze
  CDN con versione fissata, limiti di dimensione e di numero di pagine.

- **Ho documentato il progetto** in modo bilingue (italiano/inglese), inclusa una sezione
  Privacy & Security che spiega onestamente i limiti reali della tecnica usata, non solo i suoi
  pregi.

### Competenze in sintesi

| Area                         | Competenze dimostrate                                                     |
|------------------------------|------------------------------------------------------------------------------|
| **Frontend**                 | HTML, CSS (responsive design), JavaScript (ES6+, async/await, Canvas API) |
| **Architettura software**    | Progettazione client-side, separazione logica/markup per CSP, privacy by design |
| **Elaborazione documenti**   | Rendering PDF con pdf.js, ricostruzione PDF con pdf-lib, manipolazione pixel su canvas |
| **Sicurezza applicativa**    | Content-Security-Policy, DOM XSS-safe, sanificazione filename, verifica post-esportazione |
| **Algoritmi**                | Rilevamento PII basato su regex, checksum di Luhn, conversione di coordinate matrice→viewport |
| **UX / Product**             | Editor visuale a doppio canvas, flusso suggerito/confermato, gestione volumi e limiti |
| **Documentazione**           | Guida utente bilingue, changelog, troubleshooting, dichiarazione onesta dei limiti |

---

## 6. Caratteristiche principali in breve

- Redazione **reale** di immagini (distruzione diretta dei pixel) e PDF (rasterizzazione e
  ricostruzione completa del documento)
- **Rilevamento automatico** di email, telefoni, IBAN, carte di credito (verifica Luhn) e codice
  fiscale italiano, sempre soggetto a conferma umana
- **Verifica automatica reale** del risultato tramite riestrazione del testo dal PDF finito
- **Elaborazione batch** con set di regole riutilizzabile e opt-in esplicito per l'uso non presidiato
- Filigrana e numerazione **Bates** opzionali
- **Nessuna installazione**, funziona **offline** e **multi-piattaforma**
- **100% privato**: i dati restano sul computer dell'utente

---

*Progetto realizzato da Chiara Berti — 2026. Licenza MIT.*
