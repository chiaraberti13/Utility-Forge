# Batch Renamer & File Organizer Pro — Descrizione del progetto

> Documento di presentazione da allegare al curriculum.
> Spiega in modo semplice **cosa fa** l'applicazione, **come è stata costruita**
> a livello tecnico e **qual è stato il mio ruolo e le competenze dimostrate**.

---

## 1. In una frase

Un'applicazione web che **rinomina in blocco i file di una cartella locale reale, direttamente dal
browser**, guidata da un mapping Excel/CSV e/o da un modello testuale, con anteprima obbligatoria
prima di ogni scrittura e un vero log di annullamento (rollback) — senza mai caricare nulla su un
server.

---

## 2. Il problema che risolve

Chi gestisce grandi quantità di file — foto di prodotto, documenti scansionati, archivi fotografici,
export da gestionali — si trova spesso a dover rinominare centinaia o migliaia di file secondo una
logica precisa (un codice prodotto, una data, un numero progressivo). I metodi disponibili di
solito sono scomodi:

- rinominare a mano, file per file, un lavoro enorme e soggetto a errori,
- strumenti che **scaricano una copia rinominata** di ogni file uno alla volta, lasciando
  all'utente il compito di sostituire manualmente gli originali,
- servizi online in cui bisogna **caricare i propri file su un server** esterno, con evidenti
  problemi di privacy per documenti aziendali o personali.

Questa app risolve tutti e tre i problemi contemporaneamente: rinomina **davvero, sul posto**, i
file nella cartella scelta dall'utente — sfruttando una API del browser pensata proprio per questo
— senza che alcun file lasci mai il computer, e senza dover scaricare/sostituire nulla a mano.

---

## 3. Come funziona, passo per passo

Dal punto di vista dell'utente il flusso è pensato per essere sicuro per costruzione, non solo
comodo:

1. **Apre l'app** — doppio click sul file HTML, si apre nel browser come una normale pagina web.
2. **Sceglie la cartella** — tramite il selettore nativo del sistema operativo, concedendo
   l'accesso a una singola cartella. L'app ne elenca i file (nome, dimensione, data), con opzione
   di scansione ricorsiva delle sottocartelle.
3. **Definisce la logica di rinomina** — caricando un foglio Excel/CSV (a due colonne per
   corrispondenza per nome, oppure a colonna singola per posizione) e/o scrivendo un modello con
   segnaposto (`{orig}`, `{ext}`, `{seq:000}`, `{date:YYYYMMDD}`, `{exifdate}`, `{csv:Colonna}`).
4. **Rivede l'anteprima obbligatoria** — una tabella nome-attuale → nome-nuovo per ogni file, con
   segnalazioni evidenti per collisioni, caratteri non validi rimossi, nomi troppo lunghi e
   corrispondenze CSV incerte (approssimate) che richiedono conferma manuale esplicita. **Nessuna
   scrittura avviene prima di questo passaggio.**
5. **Conferma ed esegue** — l'app rinomina un file alla volta, con barra di avanzamento, fermandosi
   in modo pulito e trasparente se il permesso sulla cartella viene revocato a metà lavoro.
6. **Scarica un report e, se serve, annulla** — un CSV con l'esito di ogni file, e un pulsante di
   rollback che inverte esattamente le operazioni appena eseguite (o, in una sessione successiva,
   ricaricando il log salvato in precedenza).

---

## 4. Come è stata sviluppata (parte tecnica)

### 4.1 Architettura: due file, zero dipendenze da installare

L'applicazione è divisa in due file, mantenuti volutamente separati:

- `batch-renamer-pro.html` — struttura e stile dell'interfaccia,
- `batch-renamer-pro.js` — tutta la logica applicativa.

Questa separazione non è solo organizzativa: tenere il JavaScript in un file esterno permette di
usare una **Content-Security-Policy più stretta** (`script-src 'self' + CDN`, senza alcun hash per
script inline), riducendo la superficie di attacco della pagina.

Le uniche librerie esterne, caricate da CDN con versione fissata:

| Libreria    | A cosa serve                                                    |
|-------------|-------------------------------------------------------------------|
| **SheetJS** | Leggere e interpretare i file Excel/CSV di mapping                |
| **exifr**   | Lettura opzionale della data di scatto EXIF dalle immagini        |
| **Lucide**  | Le icone vettoriali dell'interfaccia                              |

### 4.2 Il cuore tecnico: rinominare senza un'API di "rename"

La File System Access API del browser non offre un comando diretto di rinomina. La pipeline
implementata da zero è:

```
leggi i byte del file esistente (getFile → arrayBuffer)
   → crea un nuovo file con il nome proposto (getFileHandle create:true)
   → scrivi i byte nel nuovo file (createWritable → write → close)
   → solo dopo il successo, rimuovi il file originale (removeEntry)
```

Ogni file viene processato **uno alla volta**, non in parallelo, in modo che un errore su un file
non comprometta lo stato degli altri e che il progresso visibile all'utente sia sempre accurato.

### 4.3 Motore di abbinamento CSV, riusato per il rollback

Il motore che abbina le righe del foglio Excel/CSV ai file (per nome esatto, poi
case-insensitive, poi per **distanza di Levenshtein** implementata a mano, senza librerie esterne,
per le corrispondenze approssimate) non è una funzionalità isolata: viene **riutilizzato anche per
il rollback da log salvato**, semplicemente scambiando le colonne "nome attuale"/"nome nuovo". È
una scelta di design deliberata per non duplicare la stessa logica in due punti diversi del codice.

### 4.4 Motore di template, indipendente dalla sorgente dati

Il parsing dei modelli di rinomina (`{orig}`, `{ext}`, `{seq:000}`, `{date:YYYYMMDD}`,
`{exifdate}`, `{csv:Colonna}`) è una funzione pura che riceve un "contesto" per ogni file (nome
originale, estensione, numero di sequenza, date, riga CSV eventualmente abbinata) e restituisce il
nome risolto. Essendo pura e priva di effetti collaterali, è stata verificata direttamente con
test automatizzati (Playwright) senza bisogno di aprire realmente una cartella.

### 4.5 Validazione difensiva prima di ogni scrittura

Ogni nome proposto — che provenga dal CSV, dal modello o da entrambi — attraversa sempre una
funzione di sanificazione **prima** di essere passato a `getFileHandle()`: rimozione dei caratteri
non validi su Windows/macOS/Linux, gestione dei nomi riservati di Windows, troncamento a un limite
di byte sicuro preservando l'estensione. Le collisioni di nome vengono rilevate e risolte (o
segnalate) prima dell'esecuzione, mai scoperte a scrittura già iniziata.

### 4.6 Attenzione all'esperienza d'uso, alla sicurezza e alla trasparenza

- **Interfaccia responsive** e minimale, coerente con il resto della suite di strumenti (palette
  blu, card bianche, icone vettoriali).
- **Anteprima obbligatoria**: nessuna scrittura è possibile senza un passaggio esplicito di
  revisione da parte dell'utente, con segnalazioni visive per ogni tipo di rischio.
- **Nessuno stato "a metà" silenzioso**: se il permesso sulla cartella viene revocato durante
  l'esecuzione, l'app si ferma immediatamente e il report finale distingue con precisione cosa è
  stato rinominato, cosa è stato saltato e cosa ha dato errore.
- **Rollback reale**, non solo dichiarato: sia in sessione (log in memoria) sia tra sessioni
  diverse (log CSV scaricabile e ricaricabile).

### 4.7 Privacy by design

Tutta l'elaborazione avviene **nel browser dell'utente**: la cartella scelta, il foglio Excel/CSV
caricato e i file stessi non vengono mai trasmessi a un server. È una scelta architetturale, non un
dettaglio: dati aziendali sensibili (archivi documentali, foto, elenchi prodotto) non lasciano mai
il computer.

---

## 5. Il mio ruolo e le competenze dimostrate

Ho ideato e realizzato il progetto **individualmente**, dall'idea iniziale fino al prodotto finito
e documentato. In concreto:

- **Ho progettato l'architettura** dell'applicazione scegliendo un approccio *client-side,
  zero-install*, con separazione netta tra struttura/stile e logica applicativa per poter applicare
  una Content-Security-Policy più stretta.

- **Ho implementato da zero la pipeline di rinomina** basata sulla File System Access API
  (lettura → scrittura del nuovo file → rimozione del vecchio solo dopo il successo), gestendo con
  cura i casi di permesso revocato a metà esecuzione.

- **Ho scritto da zero l'algoritmo di distanza di Levenshtein** per il matching approssimato tra
  nomi file e righe di un foglio Excel/CSV, con normalizzazione del punteggio e soglia di
  confidenza configurabile, senza usare librerie esterne per questa parte.

- **Ho progettato e implementato un motore di template** con segnaposto combinabili (nome
  originale, estensione, numero di sequenza con padding, data di modifica, data EXIF, colonne
  CSV), scritto come funzione pura per essere facilmente testabile.

- **Ho curato la sicurezza in ogni punto della pipeline**: sanificazione dei nomi file prima di
  ogni operazione su disco, rendering DOM esclusivamente con `textContent`/`addEventListener` (mai
  `innerHTML` con dati non fidati), Content-Security-Policy esplicita, versioni delle librerie
  fissate.

- **Ho progettato un sistema di rollback reale**, riusando lo stesso motore di abbinamento CSV
  (con colonne scambiate) sia per l'annullamento in sessione sia per il ripristino da un log
  scaricato in una sessione precedente, evitando di duplicare la logica di matching.

- **Ho curato l'esperienza utente**, con un'anteprima obbligatoria e leggibile prima di ogni
  scrittura, segnalazioni visive puntuali per ogni tipo di rischio (collisioni, caratteri non
  validi, nomi troppo lunghi, corrispondenze incerte) e un report finale scaricabile.

- **Ho verificato il codice** con test mirati sulle funzioni pure (parsing dei template, distanza
  di Levenshtein, sanificazione dei nomi file) tramite automazione browser, e ho controllato che la
  schermata di "browser non supportato" si attivi correttamente solo quando serve.

- **Ho documentato il progetto** in modo bilingue (italiano/inglese), con guida d'uso, limiti
  tecnici, requisiti di sistema — inclusa la dipendenza specifica da browser Chromium — risoluzione
  dei problemi e sezione dedicata a privacy e sicurezza.

### Competenze in sintesi

| Area                          | Competenze dimostrate                                                        |
|--------------------------------|-------------------------------------------------------------------------------|
| **Frontend**                   | HTML, CSS (responsive design), JavaScript (ES6+, async/await, moduli IIFE)   |
| **API browser avanzate**       | File System Access API (directory picker, file/directory handle, writable stream) |
| **Algoritmi**                  | Distanza di Levenshtein implementata da zero, parsing di template con segnaposto |
| **Architettura software**      | Separazione HTML/JS per CSP più stretta, riuso di logica (matching CSV per rinomina e rollback) |
| **Sicurezza applicativa**      | Sanificazione input, rendering DOM sicuro, CSP, gestione stato parziale/errori |
| **Integrazione dati**          | Parsing Excel/CSV (SheetJS), lettura metadati EXIF (exifr), validazione dati  |
| **UX / Product**               | Anteprima obbligatoria, feedback in tempo reale, gestione del rischio visibile all'utente |
| **Test**                       | Verifica automatizzata delle funzioni pure con Playwright                    |
| **Documentazione**             | Guida utente bilingue, changelog, troubleshooting, sezione privacy e sicurezza |

---

## 6. Caratteristiche principali in breve

- Rinomina **in blocco e sul posto** i file di una cartella reale, via File System Access API
- Mapping da **Excel/CSV** (esatto, case-insensitive, approssimato con Levenshtein) o **modello**
  con segnaposto combinabili
- **Anteprima obbligatoria** con segnalazione di collisioni, caratteri non validi e nomi troppo
  lunghi
- **Rollback reale**, in sessione e tra sessioni diverse (log CSV scaricabile/ricaricabile)
- **100% privato**: nessun file lascia mai il computer dell'utente
- Interfaccia **responsive**, coerente con il resto della suite di strumenti

---

*Progetto realizzato da Chiara Berti — 2026. Licenza MIT.*
