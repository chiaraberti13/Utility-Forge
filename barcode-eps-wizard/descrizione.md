# Generatore Barcode EPS — Descrizione del progetto

> Documento di presentazione da allegare al curriculum.
> Spiega in modo semplice **cosa fa** l'applicazione, **come è stata costruita**
> a livello tecnico e **qual è stato il mio ruolo e le competenze dimostrate**.

---

## 1. In una frase

Un'applicazione web che trasforma un semplice file Excel di codici prodotto in
**barcode EAN-13 pronti per la stampa** (formato vettoriale EPS), utilizzabili
direttamente in Adobe Illustrator. Tutto avviene nel browser, senza installare
nulla e senza inviare dati su internet.

---

## 2. Il problema che risolve

Chi lavora nel packaging, nel retail o nella grafica ha spesso bisogno di
generare **decine, centinaia o migliaia di codici a barre** partendo da un
listino prodotti. I metodi tradizionali richiedono:

- software a pagamento (font speciali, plugin per Illustrator),
- oppure servizi online dove bisogna **caricare i propri dati su un server**,
- oppure generare i barcode uno alla volta, a mano.

Questa app elimina tutti e tre i problemi: è **gratuita, massiva e privata**.
Si carica un Excel, si preme un pulsante e si ottengono tutti i file EPS in un
unico archivio ZIP.

---

## 3. Come funziona, passo per passo

Dal punto di vista dell'utente il flusso è volutamente semplice:

1. **Apre l'app** — basta fare doppio click sul file HTML: si apre nel browser,
   come una normale pagina web.
2. **Carica il file Excel/CSV** — trascinandolo (drag & drop) o cliccando per
   selezionarlo. Il file deve avere due colonne: `Codice articolo` e `Barcode`.
3. **Preme "Genera Barcode EPS"** — l'app elabora ogni riga e mostra in tempo
   reale una barra di avanzamento e delle statistiche (totali, generati, errori).
4. **Scarica i risultati** — ogni barcode può essere scaricato singolarmente,
   oppure tutti insieme in un file `.zip`.

Ogni codice diventa un file `.eps` (es. `CODICE01.eps`) contenente il barcode
in **formato vettoriale**, quindi ingrandibile a qualsiasi dimensione senza
perdere qualità.

---

## 4. Come è stata sviluppata (parte tecnica)

### 4.1 Architettura: un unico file, zero dipendenze da installare

L'intera applicazione vive in **un solo file HTML** che contiene struttura
(HTML), stile (CSS) e logica (JavaScript). Questa scelta di architettura ha
conseguenze concrete e volute:

- **Nessuna installazione**: niente Python, Node.js, librerie o build. Si apre
  e funziona.
- **Portabile**: si può inviare via email o copiare su una chiavetta; chi lo
  riceve deve solo aprirlo.
- **Funziona offline**: dopo il primo avvio non serve connessione.

Le uniche tre librerie esterne vengono caricate al volo da CDN:

| Libreria    | A cosa serve                                    |
|-------------|-------------------------------------------------|
| **SheetJS** | Leggere e interpretare i file Excel/CSV         |
| **JSZip**   | Comprimere tutti i barcode in un unico file ZIP |
| **Lucide**  | Le icone vettoriali dell'interfaccia            |

### 4.2 La pipeline di generazione (il cuore dell'app)

Ogni codice attraversa una catena di trasformazioni, interamente scritta a mano:

```
Excel  →  lettura dati  →  codifica EAN-13  →  disegno EPS/PostScript  →  file .eps
```

1. **Lettura dei dati** — il file caricato viene letto in memoria e convertito
   in una lista di righe (codice articolo + numero barcode).

2. **Codifica EAN-13** — questa è la parte più "algoritmica" e non usa librerie
   pronte, è implementata da zero:
   - Se il codice ha **12 cifre**, viene calcolata la **13ª cifra di controllo**
     (check digit) con l'algoritmo standard **Modulo 10**.
   - Ogni cifra viene tradotta in barre secondo le **tabelle di codifica
     ufficiali L, G ed R** dello standard EAN-13.
   - La sequenza delle prime sei cifre segue uno schema di parità che dipende
     dalla **prima cifra** del codice (i cosiddetti *first-digit patterns*).
   - Vengono aggiunte le **barre di guardia** (inizio, centro, fine).

3. **Rendering in EPS/PostScript** — la sequenza di barre viene tradotta in
   codice **PostScript** vero e proprio: rettangoli neri per le barre, barre di
   guardia più lunghe, e il testo delle cifre in **Helvetica**, con un
   `BoundingBox` calcolato in automatico. Il risultato è un file EPS vettoriale
   conforme alle specifiche (quiet zone, altezza barre, larghezza modulo) e
   compatibile con Illustrator, CorelDRAW, Inkscape e Affinity Designer.

4. **Esportazione** — i file vengono resi disponibili per il download singolo
   oppure impacchettati in uno ZIP compresso.

### 4.3 Attenzione all'esperienza d'uso e alle prestazioni

- **Interfaccia responsive** e minimale (drag & drop, palette blu, icone
  vettoriali) che si adatta a desktop, tablet e smartphone.
- **Feedback in tempo reale**: barra di progresso, contatori live e anteprima
  di ogni barcode generato con stato di successo/errore.
- **Gestione dei grandi volumi**: la generazione viene spezzata in piccoli
  blocchi con brevi pause asincrone, così **l'interfaccia non si blocca** anche
  con migliaia di codici. Ogni errore su una riga viene isolato e segnalato
  senza interrompere l'elaborazione delle altre.

### 4.4 Privacy by design

Tutta l'elaborazione avviene **nel browser dell'utente**: nessun file viene
caricato su server esterni, nessun tracciamento, nessun account. È una scelta
architetturale, non un dettaglio: i dati commerciali (listini, codici prodotto)
non lasciano mai il computer.

---

## 5. Il mio ruolo e le competenze dimostrate

Ho ideato e realizzato il progetto **individualmente**, dall'idea iniziale fino
al prodotto finito e documentato. In concreto:

- **Ho progettato l'architettura** dell'applicazione scegliendo un approccio
  *single-file, zero-install e client-side*, valutando i vantaggi in termini di
  portabilità, privacy e semplicità d'uso per l'utente finale.

- **Ho implementato da zero l'algoritmo di codifica EAN-13**, comprese le
  tabelle di codifica L/G/R, gli schemi di parità basati sulla prima cifra e il
  calcolo della cifra di controllo con l'algoritmo Modulo 10, nel rispetto dello
  standard ISO/IEC 15420 e delle specifiche GS1.

- **Ho gestito la pipeline di rendering** che traduce le cifre in un file
  **EPS/PostScript vettoriale** valido (barre, barre di guardia, testo, quiet
  zone e BoundingBox), garantendo la compatibilità con i principali software di
  grafica professionale.

- **Ho integrato l'elaborazione dei dati** leggendo e normalizzando file
  Excel/CSV, gestendo i casi limite (spazi, formattazione numerica, codici non
  validi) con segnalazione puntuale degli errori.

- **Ho curato l'esperienza utente e l'interfaccia**, con un design responsive e
  minimale, drag & drop, feedback in tempo reale (progresso, statistiche,
  anteprime) e messaggi di stato chiari.

- **Ho ottimizzato le prestazioni** per la generazione massiva, introducendo
  un'elaborazione asincrona a blocchi che mantiene l'interfaccia reattiva anche
  con migliaia di elementi, e l'**esportazione in ZIP** dei risultati.

- **Ho documentato il progetto** in modo bilingue (italiano/inglese), con guida
  d'uso, limiti tecnici, requisiti di sistema e risoluzione dei problemi.

### Competenze in sintesi

| Area                         | Competenze dimostrate                                              |
|------------------------------|--------------------------------------------------------------------|
| **Frontend**                 | HTML, CSS (responsive design), JavaScript (ES6+, async/await)     |
| **Architettura software**    | Progettazione client-side, scelte zero-dependency, privacy by design |
| **Algoritmi & standard**     | Implementazione EAN-13, check digit Modulo 10, standard GS1/ISO   |
| **Generazione grafica**      | Rendering vettoriale EPS/PostScript programmatico                 |
| **Integrazione dati**        | Parsing Excel/CSV, validazione e gestione errori                  |
| **UX / Product**             | Interfaccia intuitiva, feedback in tempo reale, gestione volumi   |
| **Documentazione**           | Guida utente bilingue, changelog, troubleshooting                 |

---

## 6. Caratteristiche principali in breve

- Generazione di barcode **EAN-13** in **formato EPS vettoriale**
- Elaborazione **massiva** da Excel/CSV con download **ZIP**
- **Nessuna installazione**, funziona **offline** e **multi-piattaforma**
- **100% privato**: i dati restano sul computer dell'utente
- Interfaccia **responsive** con anteprima e statistiche in tempo reale
- Compatibile con **Adobe Illustrator, CorelDRAW, Inkscape, Affinity Designer**

---

*Progetto realizzato da Chiara Berti — 2026. Licenza MIT.*
