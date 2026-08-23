# 📦 Batch Renamer & File Organizer Pro

> 🇬🇧 [English](README.md) | 🇮🇹 **Italiano**

Un'applicazione web standalone che rinomina i file **direttamente in una cartella locale reale**,
dal tuo browser — guidata da un mapping Excel/CSV caricato e/o da un modello di rinomina, con
un'anteprima obbligatoria e un vero log di rollback. A differenza dei renamer che ti fanno solo
scaricare una copia rinominata di ogni file, uno alla volta, questo strumento usa la **File System
Access API** del browser per scrivere i nuovi nomi direttamente nella cartella che hai scelto.
Tutto avviene lato client: niente viene caricato su un server.

---

## 🎯 PACCHETTO COMPLETO

Questo pacchetto contiene:
- **`batch-renamer-pro.html`** — la struttura e l'interfaccia dell'applicazione (apri questo file per usarla)
- **`batch-renamer-pro.js`** — tutta la logica applicativa (caricata dall'HTML; tieni i due file insieme)
- **`LICENSE`** — Licenza MIT
- **`README.md`** / **`README-IT.md`** — questa documentazione (Inglese / Italiano)

---

## ✅ INSTALLAZIONE (NESSUNA!)

Questa è una web app **completamente standalone**. Non devi installare:
- ❌ Python, Node.js o altri linguaggi di programmazione
- ❌ Librerie o dipendenze
- ❌ Software aggiuntivo

Basta tenere `batch-renamer-pro.html` e `batch-renamer-pro.js` nella stessa cartella e aprire il
file HTML in un **browser basato su Chromium** (vedi Requisiti di sistema più sotto — per questo
strumento non è un semplice consiglio).

---

## ⚠️ PRIMA DI INIZIARE: REQUISITO DEL BROWSER

Questo strumento deve scrivere direttamente in una cartella sul tuo disco, il che richiede la
**File System Access API** (`window.showDirectoryPicker()`). Questa API esiste attualmente **solo
nei browser basati su Chromium**:

- ✅ Google Chrome 86+
- ✅ Microsoft Edge 86+
- ✅ Opera, Brave (basati su Chromium)
- ❌ Mozilla Firefox — non supportato
- ❌ Apple Safari — non supportato

Se apri la pagina in un browser non supportato, l'app lo rileva immediatamente e mostra una
schermata di spiegazione chiara al posto di un'interfaccia rotta — nessun pulsante morto, nessun
fallimento silenzioso.

---

## 🚀 COME USARE, PASSO PASSO

### Passo 1 — Apri l'applicazione
Fai doppio click su `batch-renamer-pro.html`, oppure apri il suo URL se ospitata su un server, in
Chrome o Edge.

💡 **Nota:** la pagina carica tre piccole librerie (lettura Excel, lettura EXIF, icone) da un CDN
via internet ogni volta che la apri. L'elaborazione che avviene *dopo* il caricamento — leggere la
tua cartella, il tuo CSV e rinominare i tuoi file — non invia mai nulla in rete.

### Passo 2 — Scegli la tua cartella
Clicca su **"Scegli cartella…"** e concedi al browser l'accesso alla cartella su cui vuoi
lavorare. L'app elenca ogni file: nome, dimensione e data di ultima modifica. Per i file immagine
tenta anche di leggere una **data di scatto EXIF** (in via opzionale — se l'immagine non ha dati
EXIF, o la libreria non riesce a leggerli, l'elenco funziona comunque, mostrando solo "—" per
quel file).

Attiva **"Includi sottocartelle"** per esplorare le sottocartelle in modo ricorsivo. Quando è
attivo, compare un secondo interruttore: **"Appiattisci nella cartella principale"** — attivo, i
file rinominati dalle sottocartelle vengono spostati nella cartella principale; disattivo, vengono
rinominati sul posto e la struttura delle cartelle viene mantenuta.

### Passo 3 — Scegli come vengono decisi i nuovi nomi
Puoi usare uno o entrambi questi metodi, combinati:

**A. Mapping Excel/CSV** — carica un foglio con:
- **Due colonne**, es. "nome attuale" / "nome nuovo": ogni file viene abbinato a una riga per nome
  esatto, poi senza distinzione maiuscole/minuscole, poi con una **corrispondenza approssimata**
  (distanza di Levenshtein implementata a mano) per nomi simili ma non identici. Le corrispondenze
  approssimate non vengono mai applicate silenziosamente — vengono segnalate nell'anteprima e
  l'esecuzione resta bloccata finché non le confermi.
- **Una colonna singola** di nuovi nomi: applicati nell'ordine dei file, dopo aver scelto come
  ordinarli (nome/data/dimensione, crescente/decrescente) — cioè "rinomina il file N con la riga N
  del CSV".

**B. Modello (template)** — un pattern testuale con segnaposto, ad esempio:
```
{csv:Prodotto}_{date:YYYYMMDD}_{seq:000}{ext}
```
Segnaposto supportati: `{orig}` (nome originale senza estensione), `{ext}`, `{seq}` /
`{seq:000}` (numero di sequenza, con inizio e zero-padding configurabili), `{date}` /
`{date:YYYYMMDD}` (data di ultima modifica del file), `{exifdate}` (data di scatto, stessa
formattazione, vuota se non disponibile) e `{csv:NomeColonna}` (preleva un valore dalla riga CSV
abbinata). Tutti i segnaposto sono liberamente combinabili in un unico pattern.

### Passo 4 — Rivedi l'anteprima obbligatoria
Clicca su **"Genera anteprima"**. Ottieni una tabella completa nome-attuale → nome-nuovo per ogni
file coinvolto, con segnalazioni chiare per:
- **Collisioni di nome** — due file finirebbero con lo stesso nome; risolte automaticamente con un
  suffisso numerico incrementale (disattivabile) oppure segnalate in rosso se disattivi la
  risoluzione automatica
- **Nessuna corrispondenza CSV** (in modalità CSV)
- **Caratteri non validi** (`\ / : * ? " < > |` e caratteri di controllo) — rimossi
  automaticamente, mostrati nella colonna avvisi così vedi esattamente cosa è cambiato
- **Nomi troppo lunghi** (oltre ~255 byte)
- **Corrispondenze approssimate** — richiedono sempre la tua conferma esplicita prima che
  l'esecuzione sia permessa

**Nulla viene scritto su disco finché non clicchi "Conferma ed esegui rinomina."**

### Passo 5 — Esegui e, se serve, annulla
L'app elabora un file alla volta con una barra di avanzamento visibile. Se il permesso sulla
cartella viene perso durante l'esecuzione (negato/revocato), si interrompe in modo pulito e ti dice
esattamente quali file sono stati toccati e quali no.

Dopo l'esecuzione:
- **Scarica un report CSV** (nome vecchio / nome nuovo / risultato: rinominato / saltato /
  errore+motivo)
- **"Annulla ultima operazione"** inverte l'esecuzione con la stessa tecnica
  lettura/scrittura/rimozione — funziona solo finché lo stesso handle di cartella è ancora tenuto
  in questa sessione del browser
- **Scarica il log di rollback** come CSV da conservare
- **Ricarica un log scaricato in precedenza** in una sessione successiva (dopo aver riselezionato
  la stessa cartella) per annullarlo anche allora — questo riusa il motore di mapping CSV con le
  colonne nome vecchio/nome nuovo scambiate

---

## 📊 LIMITI TECNICI

- **Limite massimo: 5.000 file per esecuzione**, applicato in anticipo con un messaggio d'errore
  chiaro — suddividi il lavoro su più cartelle/sottocartelle.
- I nomi file sono limitati a **255 byte** (UTF-8) — i nomi proposti più lunghi vengono segnalati e
  troncati (preservando l'estensione) prima di essere usati.
- Il log di rollback e "Annulla ultima operazione" funzionano solo **all'interno della stessa
  sessione del browser**, finché l'handle della cartella resta attivo — l'accesso alla cartella
  non sopravvive alla chiusura della scheda o del browser. Usa il log CSV scaricabile per
  annullare in una sessione successiva.
- La lettura della data EXIF è **best-effort**: formati non supportati, dati EXIF mancanti o un
  errore di lettura non bloccano mai l'elenco dei file, lasciano solo quel campo vuoto.

---

## 🎯 CARATTERISTICHE

✅ **Rinomina i file sul posto** — scrive direttamente nella cartella scelta, niente download uno a uno
✅ **Scansione ricorsiva delle cartelle** con scelta appiattisci-o-mantieni-struttura
✅ **Rinomina guidata da CSV/XLSX** con corrispondenza esatta → case-insensitive → approssimata
✅ **Rinomina basata su modello** con segnaposto orig/ext/seq/date/exifdate/csv
✅ **Anteprima obbligatoria** prima di ogni scrittura, con avvisi su collisioni/caratteri non validi/lunghezza/nessuna corrispondenza
✅ **Rollback reale** — annullamento in sessione, log di rollback scaricabile/ricaricabile
✅ **Report di esecuzione scaricabile** (rinominato/saltato/errore, con motivi)
✅ **Barra di avanzamento visibile**, interruzione sicura in caso di perdita del permesso
✅ **Nessuna installazione**, funziona dopo il primo caricamento salvo le librerie da CDN
✅ **Elaborazione 100% locale** — niente viene caricato da nessuna parte
✅ **Design responsive**, icone vettoriali, palette blu coerente con il resto della suite

---

## 💻 REQUISITI DI SISTEMA

### ⚠️ Browser supportati — solo Chromium
Questo strumento **richiede** un browser che implementi la File System Access API:
- ✅ Google Chrome 86+ (consigliato)
- ✅ Microsoft Edge 86+
- ✅ Opera, Brave (basati su Chromium)
- ❌ Firefox — **non supportato**, nessuna File System Access API
- ❌ Safari — **non supportato**, nessuna File System Access API

Questo è un requisito vincolante, non un consiglio — l'app rileva il supporto al caricamento e
mostra una schermata di spiegazione chiara al posto dello strumento se il tuo browser non può
eseguirlo.

### Sistema operativo
- ✅ Windows 10/11
- ✅ macOS 10.15+
- ✅ Linux (Ubuntu, Debian, Fedora, ecc.)
- ⚠️ Android/iOS — la File System Access API è di fatto solo per desktop; Chrome mobile non
  supporta attualmente `showDirectoryPicker()`

### Risorse minime
- **RAM:** 2 GB (4 GB consigliati per cartelle con migliaia di file)
- **Connessione internet:** serve solo per caricare le tre librerie da CDN al primo avvio

---

## 🔧 RISOLUZIONE PROBLEMI

### La pagina mostra "Browser non supportato" invece dell'app
**Causa:** stai usando Firefox, Safari o un altro browser non basato su Chromium.
**Soluzione:** apri lo stesso file HTML in Chrome, Edge, Opera o Brave.

### "Scegli cartella…" non fa nulla / non appare nessuna finestra
**Causa:** il browser ha bloccato il selettore (es. attivato al di fuori di un click diretto
dell'utente), oppure sei in un contesto browser non supportato (alcune webview
integrate/automatizzate non possono mostrare finestre di dialogo native).
**Soluzione:** clicca il pulsante direttamente in una normale finestra/scheda del browser, non da
uno script di automazione o una webview integrata.

### L'accesso alla cartella si perde dopo aver ricaricato la pagina
**Causa:** è previsto — la File System Access API non mantiene gli handle di cartella tra un
ricaricamento e l'altro per questa app. **Soluzione:** riseleziona la cartella con "Scegli
cartella…"; usa il CSV del log di rollback scaricato se devi annullare un'esecuzione precedente.

### Le icone o le librerie da CDN non si caricano
**Causa:** problema di connessione internet al primo caricamento.
**Soluzione:** controlla la connessione e ricarica; le funzioni principali di elenco e rinomina
non dipendono dalla libreria delle icone, solo da SheetJS (per CSV/XLSX) e, in via opzionale, da
exifr (per le date EXIF).

### Una rinomina fallisce a metà esecuzione
**Causa:** più comunemente un permesso sulla cartella perso/negato, un file bloccato da un altro
programma, oppure un nome che collide sul disco con qualcosa che l'app non conosceva.
**Soluzione:** controlla il report CSV scaricato per l'errore esatto per ogni file; i file già
rinominati con successo sono elencati come "renamed" e possono essere invertiti con "Annulla
ultima operazione" o con il log di rollback salvato.

### Alcuni nomi file sono diversi da quanto digitato nel modello/CSV
**Causa:** il nome proposto conteneva caratteri non validi su Windows/macOS/Linux, oppure superava
il limite di 255 byte — l'app sanifica entrambi automaticamente e segnala la modifica
nell'anteprima.
**Soluzione:** controlla la colonna "Avvisi" nell'anteprima prima di confermare; correggi il tuo
modello o i valori del CSV se il risultato automatico non è quello che volevi.

---

## 🔒 PRIVACY E SICUREZZA

✅ **Tutti i dati restano sul tuo computer** — il contenuto delle cartelle e i mapping CSV vengono
letti ed elaborati interamente nella memoria del tuo browser
✅ **Nessun file caricato su server esterni**
✅ **Nessun tracciamento o analytics**
✅ **Nessun account richiesto**
✅ **Open source** — puoi ispezionare il codice (due file semplici, nessuna build, nessuna
minificazione)

**Hardening applicato in questo strumento:**
- **Rendering sicuro contro XSS** — ogni valore che proviene da un file, da un elenco di cartella
  o da un foglio caricato (nomi file, contenuto delle celle CSV, messaggi d'errore) viene scritto
  nella pagina con `textContent` e ogni elemento interattivo è collegato con `addEventListener`.
  `innerHTML` e stringhe `onclick` inline costruite con dati non fidati non vengono mai usati.
- **Sanificazione del nome file prima di ogni scrittura** — ogni nuovo nome proposto viene
  validato e ripulito dai caratteri non validi su Windows/macOS/Linux (`\ / : * ? " < > |` e
  caratteri di controllo) e limitato a 255 byte **prima** di essere passato a `getFileHandle()`. I
  separatori di percorso vengono rimossi in modo difensivo anche se la File System Access API
  sandboxa già `getFileHandle()`/`removeEntry()` alla sola cartella che l'utente ha concesso
  esplicitamente — per progettazione, questa API non può essere usata per scrivere o cancellare
  fuori da quella cartella — ma rimuovere quei caratteri non costa nulla e toglie ogni ambiguità,
  visto che sono comunque caratteri non validi in un nome file su qualunque sistema operativo.
- **Content-Security-Policy** — `default-src 'none'; script-src 'self' https://cdn.sheetjs.com
  https://cdn.jsdelivr.net https://unpkg.com; style-src 'unsafe-inline'; img-src data: blob:;
  connect-src 'self'; base-uri 'none'; form-action 'none'`. Tutta la logica applicativa vive nel
  file esterno `batch-renamer-pro.js` (non inline), quindi `script-src` non ha bisogno di alcun
  hash per script inline — solo `'self'` più le tre origini CDN pinnate da cui l'app carica
  effettivamente.
- **Versioni delle dipendenze pinnate** — SheetJS (`xlsx-0.20.3`), exifr (`7.1.3`) e Lucide
  (`0.469.0`) sono tutte caricate da URL CDN con versione fissata, mai `@latest`, così il loro
  codice non può cambiare a tua insaputa.
- **Limiti di dimensione** — le esecuzioni oltre 5.000 file vengono rifiutate in anticipo con un
  messaggio chiaro invece di bloccare la scheda del browser.
- **Nessuno stato parziale silenzioso** — se il permesso sulla cartella viene perso a metà
  esecuzione, questa si interrompe immediatamente e i risultati/il report separano chiaramente
  cosa è stato rinominato da cosa è stato saltato o ha dato errore; l'app non dichiara mai un
  successo per file che non ha effettivamente toccato.
- **Blocco di conferma esplicito** — nulla viene scritto su disco finché non clicchi l'apposito
  pulsante di conferma nella schermata di anteprima, e le corrispondenze CSV approssimate
  bloccano specificamente quel pulsante finché non le riconosci.

---

## 📝 CHANGELOG

### Versione 1.1
- 🌗 Tema scuro (segue la preferenza di sistema di default, con un toggle manuale salvato nel browser)
- 🎨 Token di design unificati con il resto della suite Utility Forge (componente alert, stati
  `:focus-visible`, breakpoint standard a 680px)
- 🖼️ Anteprime miniatura per i file immagine nell'elenco della cartella (limitate alle prime 200
  immagini per non bloccare la scheda su cartelle enormi)
- 📋 "Ricette" salvabili con nome — salva le impostazioni attuali (template, ordinamento,
  collisioni, appiattimento) con un nome nel local storage del browser e ricaricale da un menu
- 🔍 Rilevamento duplicati opzionale: hash SHA-256 del contenuto per trovare copie identiche, con
  selezione manuale file per file e conferma esplicita prima di eliminare — completamente separato
  dal flusso di rinomina, non si attiva mai per errore
- 🐛 Corretto un bug reale della v1.0: l'anteprima poteva chiedere di spuntare una casella "conferma
  corrispondenze approssimate" che in realtà non esisteva nella pagina, bloccando permanentemente
  l'esecuzione quando era presente un match CSV approssimato

### Versione 1.0
- 🎉 Prima versione
- ✅ Selezione ed elenco cartelle tramite File System Access API (nome, dimensione, data, EXIF opzionale)
- ✅ Scansione ricorsiva con scelta appiattisci-o-mantieni-struttura
- ✅ Mapping CSV/XLSX: corrispondenza a due colonne esatta/case-insensitive/approssimata, e
  modalità a colonna singola per posizione
- ✅ Rinomina basata su modello con `{orig}`, `{ext}`, `{seq}`, `{date}`, `{exifdate}`, `{csv:...}`
- ✅ Anteprima obbligatoria con avvisi su collisioni/caratteri non validi/lunghezza/nessuna corrispondenza
- ✅ Esecuzione sul posto (leggi → scrivi nuovo → rimuovi vecchio), con barra di avanzamento e
  interruzione sicura in caso di permesso perso
- ✅ Annullamento in sessione, log di rollback scaricabile/ricaricabile, report di esecuzione scaricabile
- ✅ Limite di 5.000 file per esecuzione

---

## 🆘 SUPPORTO

Per problemi, domande o suggerimenti, apri una issue su GitHub.

---

## 📜 LICENZA

Licenza MIT - vedi il file [LICENSE](LICENSE) per i dettagli.

Copyright (c) 2026 Chiara Berti 13

---

**Batch Renamer & File Organizer Pro v1.0**
Di Chiara Berti - 2026
