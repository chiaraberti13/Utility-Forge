# 📄 PDF Power Suite

> 🇮🇹 **Italiano** | 🇬🇧 [English](README.md)

Un'unica applicazione web autonoma che raggruppa nove operazioni sui PDF — unire, dividere,
comprimere, filigrana e numerazione Bates, OCR verso PDF ricercabile, confronto tra versioni,
estrazione tabelle, stampa unione da CSV verso moduli PDF e un generatore di pipeline per
concatenarle — in un'unica pagina. Tutto avviene nel browser: i tuoi documenti non vengono mai
caricati su un server. Molti strumenti gratuiti "unisci/dividi PDF" online si fermano qui;
PDF Power Suite va oltre raggruppando operazioni raramente gratuite *e* client-side nello stesso
posto — OCR offline, un vero confronto parola-per-parola e pixel-per-pixel tra due versioni di un
PDF, stampa unione verso campi modulo compilabili ed estrazione tabelle euristica — più un modo
per concatenarle in una pipeline ripetibile.

---

## 🎯 PACCHETTO COMPLETO

Questo pacchetto contiene:
- **`pdf-power-suite.html`** — la struttura dell'app e l'interfaccia (apri questo file per usarla)
- **`pdf-power-suite.js`** — logica principale: utilità, navigazione a schede, Unisci, Dividi, Comprimi, Filigrana e Bates
- **`pdf-power-suite-diff.js`** — la funzione Confronto (testuale + visivo)
- **`pdf-power-suite-table.js`** — la funzione Estrazione Tabelle
- **`pdf-power-suite-mailmerge.js`** — la funzione Stampa Unione
- **`pdf-power-suite-ocr.js`** — la funzione OCR
- **`pdf-power-suite-pipeline.js`** — il Generatore di Pipeline
- **`LICENSE`** — Licenza MIT
- **`README.md`** / **`README-IT.md`** — questa documentazione (inglese / italiano)

Tutti e sei i file `.js` devono restare nella stessa cartella del file `.html` — la pagina li
carica con semplici tag relativi `<script src="...">`.

---

## ✅ INSTALLAZIONE (NON RICHIESTA!)

Questa è un'applicazione web **completamente autonoma**. Non serve installare:
- ❌ Python, Node.js o altri linguaggi di programmazione
- ❌ Librerie o dipendenze
- ❌ Software aggiuntivo

Due modalità d'uso, entrambe valide:

- **In locale, sul tuo computer** — basta fare doppio click su `pdf-power-suite.html`: si apre nel
  browser predefinito ed ogni operazione avviene interamente in quella scheda del browser.
- **Condiviso su un server aziendale/intranet** — trattandosi di pochi file statici, puoi anche
  copiare l'intera cartella su un qualsiasi server web semplice (o una condivisione file interna, o
  un hosting statico come GitHub Pages) così i colleghi possono raggiungerla tramite URL invece di
  dover avere ciascuno una propria copia. Nessun backend, nessuna build, nessun linguaggio
  server-side richiesto.

**Basta aprire il file HTML nel browser!**

---

## 🚀 COME USARLO

### Aprire l'app
1. **Doppio click** su `pdf-power-suite.html` (oppure apri il suo URL, se ospitata su un server).
2. Si apre nel browser predefinito. Funziona con Chrome, Firefox, Safari, Edge (qualsiasi browser
   moderno e aggiornato).
3. Il menu laterale elenca le nove operazioni come schede; viene mostrato un solo pannello alla
   volta.

💡 **Nota:** la pagina carica sette piccole librerie da CDN via internet ogni volta che la apri,
quindi serve una connessione per caricare la pagina stessa. Dopo il caricamento, ogni scheda
tranne **OCR** non tocca più la rete — vedi [Privacy e Sicurezza](#-privacy-e-sicurezza) più sotto
per il dettaglio completo.

✅ **Come capire se si è caricata correttamente:** se il menu laterale mostra un'icona colorata
accanto a ciascuno dei nove nomi di scheda, le librerie si sono caricate correttamente. Se le
icone mancano o il pulsante "Esegui" di una scheda non si attiva mai dopo aver scelto un file,
controlla la connessione e ricarica — vedi [Risoluzione problemi](#-risoluzione-problemi).

### 1. Unisci
Combina più PDF in uno solo, nell'ordine che preferisci.
1. Trascina o seleziona **più** file PDF nell'area di caricamento.
2. Riordinali con i pulsanti ▲/▼ su ciascuna riga (o rimuovine uno con ✕).
3. Clicca **Merge & Download** — ottieni un unico `merged.pdf`.

### 2. Dividi
Spezza un PDF in più file.
1. Seleziona un singolo PDF.
2. Scegli **Un PDF per pagina**, oppure **Intervalli di pagine personalizzati** digitando qualcosa
   come `1-3,4,7-9` (ogni gruppo separato da virgola diventa un file di output — l'esempio produce
   3 file).
3. Clicca **Split & Download ZIP** — ottieni uno ZIP con un PDF per ogni pagina/intervallo.

### 3. Comprimi
Riduci un PDF rasterizzando ogni pagina e ricodificandola come JPEG.
1. Seleziona un singolo PDF.
2. Imposta gli slider **DPI di rasterizzazione** (72–300, default 150) e **qualità JPEG**
   (0,05–1, default 0,75).
3. Clicca **Compress & Download**.

⚠️ Questo scambia la selezionabilità del testo con dimensioni ridotte: l'output è un'immagine
piatta per pagina, quindi il testo non è più selezionabile, ricercabile o copiabile. Usalo per
scansioni o quando conta solo l'aspetto visivo.

### 4. Filigrana e Numerazione Bates
Applica una filigrana testuale e/o una numerazione di pagina sequenziale su ogni pagina.
1. Seleziona un singolo PDF.
2. Apri la sezione **Filigrana**: attivala, imposta testo, angolo di rotazione, opacità,
   dimensione font e posizione (centro/angolo).
3. Apri la sezione **Numerazione Bates**: attivala, imposta prefisso/suffisso, numero iniziale,
   numero di cifre e posizione.
4. Puoi attivare l'una, l'altra, entrambe, o usare i rispettivi valori predefiniti indipendenti.
   Clicca **Apply & Download**.

### 5. OCR → PDF Ricercabile
Riconosce il testo in un PDF scansionato/immagine e lo incorpora come livello di testo invisibile
e selezionabile.
1. Seleziona un singolo PDF scansionato (fino a 50 pagine per esecuzione — l'OCR è pesante per la
   CPU).
2. Scegli una o entrambe le lingue (**Inglese**, **Italiano**).
3. Facoltativamente aumenta la **scala di rasterizzazione** (più alta = più precisa, più lenta).
4. Clicca **Run OCR & Download Searchable PDF**.

🌐 **Questa è l'unica funzione che richiede internet oltre al caricamento iniziale della pagina**
— vedi [Privacy e Sicurezza](#-privacy-e-sicurezza). Il PDF risultante appare identico alla
scansione originale, ma il suo testo è ora selezionabile, copiabile e ricercabile con Ctrl/Cmd+F.
Vedi [Limiti tecnici](#-limiti-tecnici) per cosa significa esattamente "ricercabile" in questo
caso.

### 6. Confronto (tra due versioni di un PDF)
Confronta un PDF "prima" e uno "dopo" in due modi.
1. Carica il PDF A (prima) e il PDF B (dopo).
2. Scegli **Confronto testuale (a livello di parola)** — le aggiunte in verde, le rimozioni in
   rosso barrato, pagina per pagina — oppure **Confronto visivo (heatmap a pixel)** — entrambe le
   pagine renderizzate su canvas con una heatmap rossa che mostra le differenze pixel per pixel,
   utile per cogliere cambiamenti solo di impaginazione (immagini spostate, font sostituiti) che un
   confronto testuale non vedrebbe.
3. Clicca **Compare**. Se i due PDF hanno un numero di pagine diverso, un avviso lo segnala
   chiaramente e il confronto avviene solo sulle pagine presenti in entrambi.

### 7. Estrazione Tabelle
Trasforma una semplice tabella a griglia su una pagina in un CSV.
1. Seleziona un singolo PDF e, facoltativamente, un intervallo di pagine (vuoto = tutte le
   pagine).
2. Regola gli slider **tolleranza riga** (quanto devono essere vicine le coordinate Y di due
   elementi di testo per essere considerati sulla stessa riga) e **soglia spaziatura colonna**
   (quanto deve essere ampio uno spazio orizzontale per iniziare una nuova colonna).
3. Clicca **Extract & Preview**, controlla le tabelle di anteprima, regola gli slider e riesegui
   se righe o colonne non sembrano corrette, poi **Download CSV**.

È un'euristica basata sul miglior tentativo possibile, non un modello di riconoscimento tabelle —
vedi [Limiti tecnici](#-limiti-tecnici).

### 8. Stampa Unione (CSV → moduli PDF compilati)
Compila una copia di un modulo PDF per ogni riga di un foglio di calcolo.
1. Carica un PDF con campi modulo AcroForm e un file CSV o XLSX in cui ogni riga è un documento di
   output.
2. Controlla l'**anteprima corrispondenza campi**: mostra quanti campi del modulo corrispondono a
   una colonna dei dati per nome (senza distinzione tra maiuscole/minuscole), ed elenca quelli
   senza corrispondenza da entrambi i lati.
3. Facoltativamente spunta **Flatten filled forms** per rendere l'output non modificabile, e
   facoltativamente indica una colonna del CSV da usare per i nomi dei file di output (altrimenti
   vengono numerati automaticamente).
4. Clicca **Generate & Download ZIP** — ottieni un PDF compilato per ogni riga, compresso insieme
   agli altri, più un resoconto di eventuali campi saltati.

### 9. Generatore di Pipeline
Concatena operazioni in modo che l'output di ogni fase diventi l'input della successiva.
1. Carica il PDF di partenza.
2. Scegli un tipo di fase (**Merge**, **Compress**, **Watermark**, **Bates numbering**, o **OCR** —
   le altre quattro schede non sono incluse perché non sono trasformazioni "un input, un output")
   e clicca **Add step**; configurala direttamente in linea, poi aggiungi altre fasi e riordinale
   con ▲/▼.
3. Clicca **Run Pipeline & Download** per eseguire tutte le fasi in ordine con un indicatore di
   avanzamento, oppure **Export JSON** per salvare l'elenco delle fasi (solo le impostazioni, non
   i file) per dopo, oppure **Import JSON** per ricaricarne uno.
4. Le ultime 5 pipeline eseguite o esportate vengono conservate nella memoria locale di questo
   browser e proposte nel menu **Recall a saved pipeline** per un riutilizzo rapido. Una fase
   Merge richiamata/importata richiede di riallegare i file aggiuntivi, poiché i contenuti dei
   file non fanno parte di una definizione salvata.

---

## 📊 LIMITI TECNICI

### Generali
- **100 MB per file caricato**, verificato prima della lettura.
- **500 pagine** per documento per l'output di unisci/dividi/comprimi/filigrana — un file più
  grande viene rifiutato subito con un messaggio chiaro invece di bloccare la scheda.
- **L'OCR è limitato a 50 pagine per esecuzione** (il riconoscimento è pesante per la CPU); dividi
  prima una scansione più grande.
- **La stampa unione è limitata a 2.000 righe per esecuzione.**

### Risultato dell'OCR — da leggere prima di farci affidamento
PDF Power Suite implementa il **vero risultato "PDF ricercabile"**, non la più semplice
alternativa "esporta come .txt": le parole riconosciute vengono ridisegnate su ogni pagina come
normale testo PDF con `opacity: 0`, posizionate al riquadro di delimitazione di ciascuna parola e
dimensionate in base alla sua altezza, così il risultato appare identico alla scansione ma il suo
testo è selezionabile, copiabile e ricercabile con Ctrl/Cmd+F.

Un limite dichiarato onestamente: i glifi delle parole **non vengono stirati orizzontalmente** per
corrispondere esattamente alla larghezza di ciascun riquadro (farlo senza perdite richiederebbe
operatori di basso livello nello stream di contenuto del PDF scritti a mano, giudicato non
conveniente per un livello invisibile, viste le fragilità che introdurrebbe). Questo significa che
il riquadro di selezione invisibile sotto una parola è allineato solo approssimativamente — non in
modo perfetto al pixel — con la parola visibile sottostante. La ricerca e "seleziona tutto"
funzionano comunque correttamente, poiché dipendono solo dal contenuto testuale e dal suo ordine
di lettura, non dalla geometria esatta dei glifi.

### Estrazione tabelle
Il rilevamento di righe/colonne è **euristico**: raggruppa gli elementi di testo per coordinata Y
in righe, poi divide ogni riga in colonne dove lo spazio orizzontale tra elementi supera una
soglia. Non ha alcun concetto di bordi di tabella o celle unite, funziona meglio su griglie
semplici e chiaramente allineate, e può rilevare colonne in modo errato su celle multi-riga o
impaginazioni insolite. Entrambe le soglie sono slider regolabili — modifica e riesegui se il
primo tentativo non sembra corretto.

### Confronto
Il confronto testuale confronta le pagine per indice corrispondente (pagina 1 con pagina 1, ecc.).
Se una pagina è stata inserita o rimossa a metà di uno dei due documenti, tutto ciò che segue
apparirà come un'unica grande differenza — questo strumento non tenta di riallineare pagine
spostate. Il confronto visivo renderizza entrambe le pagine alla stessa larghezza target prima di
confrontare i pixel; se i due PDF usano dimensioni di pagina molto diverse, la heatmap mostrerà
gran parte della pagina come "diversa" semplicemente a causa del ridimensionamento.

---

## 🎯 CARATTERISTICHE

✅ **Nessuna installazione** — basta aprire il file HTML
✅ **Nove operazioni sui PDF in un'unica pagina** — unisci, dividi, comprimi, filigrana e Bates,
OCR, confronto, estrazione tabelle, stampa unione, generatore di pipeline
✅ **Offline dopo il primo caricamento**, tranne l'OCR (vedi Privacy e Sicurezza)
✅ **Multi-piattaforma** — Windows, Mac, Linux, Android, iOS
✅ **Output OCR realmente ricercabile** — livello di testo invisibile, non solo un'esportazione .txt
✅ **Confronto PDF a livello di parola e di pixel** in un unico strumento
✅ **Stampa unione CSV/XLSX verso veri campi AcroForm**, con resoconto degli scarti e flattening
facoltativo
✅ **Generatore di pipeline** con esportazione/importazione JSON e richiamo delle ultime 5 pipeline
✅ **Download ZIP** per ogni output multi-file (dividi, stampa unione)
✅ **Trascina e rilascia** su ogni area di caricamento
✅ **Design responsive** — il menu laterale diventa uno scorrimento orizzontale su schermi stretti
✅ **Icone vettoriali** — Lucide Icons, versione fissata
✅ **Palette blu** — stesso linguaggio visivo del resto di questa suite di strumenti

---

## 💻 REQUISITI DI SISTEMA

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
- **RAM:** 4 GB (8 GB consigliati per OCR o Compress su documenti grandi — rasterizzare pagine a
  DPI/scala elevate consuma molta memoria)
- **Spazio su disco:** 100 MB liberi per i file scaricati, più, per l'OCR, circa 10–15 MB per
  lingua che il browser mette in cache dopo la prima esecuzione
- **Connessione internet:** richiesta per caricare la pagina stessa, e richiesta di nuovo ogni
  volta che usi la scheda OCR (vedi sotto); ogni altra scheda funziona interamente offline una
  volta caricata la pagina

---

## 🔧 RISOLUZIONE PROBLEMI

### Il file HTML non si apre nel browser
1. Click destro su `pdf-power-suite.html`.
2. Seleziona "Apri con".
3. Scegli il tuo browser (consigliato Chrome).

### Il pulsante "Esegui" di una scheda resta disattivato dopo aver scelto un file
**Causa:** il file non è stato riconosciuto come PDF (estensione/tipo errati), oppure supera il
limite di 100 MB.
**Soluzione:** verifica che il file sia un `.pdf` genuino e controlla il messaggio di errore a
schermo per il motivo specifico.

### Le icone non compaiono / il pulsante "Esegui" di una scheda non si attiva mai anche con un file valido
**Causa:** una delle librerie CDN non si è caricata (nessuna connessione al primo caricamento,
oppure un firewall aziendale blocca gli host CDN).
**Soluzione:** controlla la connessione, ricarica (F5 / Cmd+R) e verifica che la pagina possa
raggiungere `cdnjs.cloudflare.com`, `cdn.sheetjs.com`, `cdn.jsdelivr.net` e `unpkg.com`. Le schede
che non necessitano della libreria non caricata (es. Unisci/Dividi/Filigrana non necessitano di
pdf.js) funzionano comunque anche se una CDN è irraggiungibile.

### L'OCR fallisce con un errore che sembra di rete
**Causa:** Tesseract.js non è riuscito a raggiungere la sua CDN per scaricare il motore OCR, il
core WASM o i dati della lingua. Questa è l'unica funzione che richiede la rete oltre al
caricamento iniziale della pagina.
**Soluzione:** controlla la connessione e riprova; una volta scaricati i dati di una lingua, il
browser li mette in cache e le esecuzioni successive sono più rapide e richiedono meno dati.

### "This document has N pages, which is over the 500-page limit"
**Causa:** i limiti di dimensione/numero di pagine descritti in [Limiti tecnici](#-limiti-tecnici)
esistono per evitare di bloccare la scheda del browser.
**Soluzione:** dividi prima il documento in parti più piccole (usa la scheda Dividi), oppure
elaboralo a gruppi.

### La stampa unione ha saltato alcuni campi
**Causa:** il nome di un campo modulo non corrisponde a nessuna colonna del CSV/XLSX (o
viceversa), oppure un campo non è un campo di testo semplice (caselle di spunta/radio/menu a
tendina non vengono compilati da questo strumento).
**Soluzione:** controlla l'**anteprima corrispondenza campi** e il **resoconto degli scarti**
mostrati dopo l'esecuzione; rinomina le colonne del foglio di calcolo in modo che corrispondano ai
nomi dei campi del PDF (le maiuscole/minuscole non contano) e riesegui.

### Il browser è lento con PDF grandi
**Causa:** rasterizzare pagine (Comprimi, OCR) o renderizzare canvas (Confronto visivo, Comprimi)
è intensivo per memoria e CPU.
**Soluzione:** abbassa lo slider DPI/scala, elabora meno pagine alla volta, chiudi altre schede per
liberare RAM e preferisci Chrome o Firefox.

### Il file ZIP è troppo grande da scaricare
**Soluzione:** la maggior parte dei browser limita i download a circa 2 GB. Dividi l'input in
gruppi più piccoli (meno pagine per Dividi, meno righe per Stampa Unione) ed eseguili
separatamente.

---

## 🔒 PRIVACY E SICUREZZA

✅ **Tutti i dati restano sul tuo computer**, con un'eccezione documentata (OCR, vedi sotto)
✅ **Nessun file caricato su un server nell'uso normale di questo strumento**
✅ **Nessun tracciamento né analytics**
✅ **Nessun account richiesto**
✅ **Open source** — puoi ispezionare il codice, è semplice HTML/CSS/JavaScript

### L'eccezione dell'OCR, nel dettaglio
Il riconoscimento del testo esegue il motore Tesseract.js **nel tuo browser**, ma Tesseract.js ha
bisogno del proprio script worker, del core WASM e dei dati di addestramento per lingua (circa
10–15 MB per lingua) che scarica da una CDN (`cdn.jsdelivr.net`) la prima volta che usi una
determinata lingua. Il *contenuto* del tuo PDF non viene mai caricato da nessuna parte — vengono
scaricati solo gli asset del motore OCR stesso, il riconoscimento avviene interamente in locale.
Ogni altra scheda di questo strumento non contatta alcun server dopo che la pagina ha terminato il
caricamento.

### Protezioni applicate
- **Nessun `innerHTML` / `onclick` inline con dati provenienti dai file** — ogni valore che
  proviene da un file caricato (nomi file, nomi campi modulo, valori celle CSV, testo OCR, celle
  di tabelle, testo di confronto) viene scritto nella pagina solo con `textContent`; i nodi DOM
  vengono costruiti con `createElement`/`addEventListener`. Un PDF, CSV o XLSX malevolo non può
  eseguire script nel tuo browser tramite questo strumento.
- **Nomi file sanificati** — ogni nome file usato per un download o una voce ZIP (output di
  unisci/dividi, output di stampa unione, CSV delle tabelle) viene ripulito da separatori di
  percorso e caratteri di controllo prima dell'uso, e i nomi duplicati vengono resi univoci invece
  di sovrascriversi silenziosamente a vicenda in uno ZIP.
- **Content-Security-Policy** — la pagina applica una CSP rigorosa: `default-src 'none'`; gli
  script sono limitati a `'self'` (i file `.js` di questo strumento, caricati come file esterni,
  quindi non serve alcun hash per script inline) più le esatte origini CDN utilizzate
  (`cdnjs.cloudflare.com`, `cdn.sheetjs.com`, `cdn.jsdelivr.net`, `unpkg.com`); `img-src` consente
  solo `data:`/`blob:`, per le anteprime di pagina renderizzate su canvas; `connect-src` e
  `worker-src` consentono specificamente `cdn.jsdelivr.net` perché Tesseract.js scarica da lì il
  proprio worker/core/dati linguistici al momento dell'esecuzione dell'OCR, e `worker-src`
  consente anche `cdnjs.cloudflare.com` e `blob:` perché pdf.js carica il proprio worker da cdnjs
  e lo avvia tramite un blob URL; `base-uri` e `form-action` sono entrambi disabilitati del tutto.
- **Dati dei moduli validati solo tramite le API testuali di pdf-lib** — i valori dei campi per la
  stampa unione provenienti da CSV/XLSX vengono passati a `TextField.setText()`; non vengono mai
  interpolati in HTML o in una stringa che venga interpretata come markup o script.
- **Limiti di dimensione e numero di pagine** — vedi [Limiti tecnici](#-limiti-tecnici); i file o i
  documenti oltre i limiti vengono rifiutati subito con un messaggio chiaro invece di bloccare la
  scheda.
- **Dipendenze fissate** — ogni libreria CDN (pdf-lib, pdf.js, JSZip, SheetJS, jsdiff,
  Tesseract.js, Lucide) viene caricata a una versione esatta, mai `@latest`, così nessuna di esse
  può cambiare senza preavviso.
- **Tutto il JavaScript in file esterni** — ogni file `.js` viene caricato tramite un semplice tag
  `<script src="...">` (non inline nell'HTML), il che è ciò che permette alla CSP sopra di usare un
  semplice `script-src 'self' ...` invece di un fragile hash per script inline.

---

## 💾 CONDIVISIONE

Puoi condividere l'intera cartella con i colleghi:
1. Copia tutti i file (l'`.html`, tutti e sei i file `.js`, `LICENSE`) su una chiavetta USB o una
   cartella condivisa.
2. Oppure condividi via email/WeTransfer/Google Drive come un unico ZIP della cartella.
3. Chi la riceve deve solo aprire `pdf-power-suite.html` — gli altri file devono restare accanto ad
   esso.

**Nessuna installazione richiesta per chi la riceve!**

---

## 📝 CHANGELOG

### Versione 1.0
- 🎉 Prima release
- ✅ Unisci, Dividi, Comprimi, Filigrana e numerazione Bates
- ✅ OCR verso PDF ricercabile (livello di testo invisibile), inglese + italiano
- ✅ Confronto tra due versioni di un PDF: confronto testuale a livello di parola e confronto
  visivo con heatmap a pixel
- ✅ Estrazione tabelle euristica verso CSV con tolleranza riga/colonna regolabile
- ✅ Stampa unione CSV/XLSX verso campi PDF AcroForm, con opzione di flattening e resoconto degli
  scarti
- ✅ Generatore di pipeline con esportazione/importazione JSON e lista di richiamo a 5 elementi in
  memoria locale
- 🔒 Content-Security-Policy rigorosa, nomi file sanificati, rendering DOM solo tramite
  `textContent`
- 🔒 Tutte le dipendenze CDN fissate a versioni esatte

---

## 🆘 SUPPORTO

Per problemi, domande o suggerimenti, apri una issue su GitHub.

---

## 📜 LICENZA

Licenza MIT - vedi il file [LICENSE](LICENSE) per i dettagli.

Copyright (c) 2026 Chiara Berti 13

---

**PDF Power Suite v1.0**
Di Chiara Berti - 2026
