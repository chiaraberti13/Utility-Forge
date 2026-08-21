# 📦 Generatore Barcode EPS

> 🇬🇧 [English](README.md) | 🇮🇹 **Italiano**

Una singola pagina HTML autonoma che trasforma un elenco Excel/CSV di codici articolo e barcode in
**barcode EAN-13 pronti per la stampa in formato vettoriale EPS** — in massa, con download ZIP in
un click. Tutto gira lato client, nel tuo browser: nessun upload, nessun server, nessun account, e
il file Excel di partenza non lascia mai il tuo computer. Pensato per i flussi di lavoro
grafici/prestampa (Adobe Illustrator, CorelDRAW, Inkscape) dove servono decine o centinaia di file
barcode pronti per la stampa tutti insieme, invece di generarli uno alla volta.

---

## 🎯 PACCHETTO COMPLETO

Questo pacchetto contiene:
- **`barcode-eps-wizard.html`** - L'applicazione web completa (è l'unico file che ti serve per usarla)
- **`example.xlsx`** - File Excel di esempio con la struttura corretta
- **`LICENSE`** - Licenza MIT
- **`README.md`** / **`README-IT.md`** - Questa documentazione (Inglese / Italiano)

---

## ✅ INSTALLAZIONE (NESSUNA!)

Questa è una web app **completamente standalone**. Non devi installare:
- ❌ Python, Node.js o altri linguaggi di programmazione
- ❌ Librerie o dipendenze
- ❌ Software aggiuntivo

Due modi per usarla, entrambi validi:

- **In locale, sul tuo computer** — basta fare doppio click su `barcode-eps-wizard.html`; si apre
  nel browser predefinito e tutto (lettura dell'Excel, generazione EPS, creazione dello ZIP)
  avviene interamente in quella scheda del browser.
- **Condivisa su un server di team/intranet** — essendo un singolo file HTML statico, puoi anche
  metterla su un qualunque server web (o una condivisione file interna, o un hosting statico come
  GitHub Pages), così i colleghi la raggiungono con un URL invece di dover avere ciascuno la
  propria copia. Nessun backend, nessuna build, nessun linguaggio lato server richiesto.

**Basta aprire il file HTML nel browser!**

---

## 🚀 COME USARE IN 3 PASSI

### Passo 1: Aprire l'applicazione
1. Fai **doppio click** sul file `barcode-eps-wizard.html` (oppure apri l'URL, se ospitata su un server)
2. Si aprirà automaticamente nel tuo browser predefinito
3. Funziona con: Chrome, Firefox, Safari, Edge (qualsiasi browser moderno e aggiornato)

💡 **Nota:** la pagina carica tre piccole librerie (lettura Excel, creazione ZIP, icone) da un CDN
via internet ogni volta che la apri, quindi serve una connessione per caricare la pagina stessa.
L'elaborazione che avviene *dopo* il caricamento — leggere il tuo file Excel e generare i barcode
EPS — non invia mai nulla in rete.

✅ **Come capire se si è caricata correttamente:** se vedi l'icona del barcode e l'area di
caricamento con la sua icona in alto a sinistra, le librerie si sono caricate bene. Se il layout
sembra senza stile o mancano le icone, controlla la connessione e ricarica — vedi la sezione
"Risoluzione problemi" più sotto se persiste.

### Passo 2: Preparare il file Excel
Usa il file `example.xlsx` come esempio. La struttura deve essere:

```
| Codice articolo | Barcode        |
|-----------------|----------------|
| CODICE01        | 9090171029796  |
| CODICE02        | 9090171029802  |
| CODICE03        | 9090171029819  |
```

**Requisiti:**
- Due colonne: `Codice articolo` e `Barcode` (nomi esatti, case-sensitive)
- I barcode devono essere numeri di **12 cifre** (EAN-13 senza check digit) o **13 cifre** (EAN-13 completo)
- Formato file: `.xlsx` o `.xls` o `.csv`

### Passo 3: Generare i barcode
1. **Trascina** il file Excel nell'area di caricamento (oppure clicca per selezionarlo)
2. Clicca su **"Genera Barcode EPS"**
3. Attendi il completamento (vedrai la barra di progresso)
4. Scarica i file:
   - **Singolarmente**: clicca "Scarica" su ogni barcode nella lista
   - **Tutti insieme**: clicca "Scarica tutti" per ottenere un file `.zip`

---

## 📊 LIMITI TECNICI

### Numero massimo di barcode

**Limite rigido: 5.000 righe per file** (imposto dall'app, per evitare di bloccare la scheda del
browser). Un foglio con più righe viene rifiutato subito con un messaggio d'errore chiaro — meglio
dividerlo in più file. L'app rifiuta anche i file sorgente oltre i 20 MB prima ancora di leggerli.

Il limite dipende da:
- **Memoria RAM disponibile** - Ogni barcode occupa ~5-10 KB in memoria
- **Capacità del browser** - Chrome/Firefox gestiscono meglio grandi quantità
- **Sistema operativo** - Desktop ha più risorse di mobile

**Consigli pratici:**
- ✅ **< 1.000 barcode** - Nessun problema, generazione veloce
- ⚠️ **1.000 - 5.000 barcode** - Funziona bene, potrebbe richiedere 10-30 secondi

### File ZIP

Il file ZIP generato contiene tutti i barcode compressi. Dimensione approssimativa:
- 100 barcode ≈ 0.5 MB
- 1.000 barcode ≈ 5 MB  
- 5.000 barcode ≈ 25 MB
- 10.000 barcode ≈ 50 MB

**Nota:** Il browser potrebbe richiedere conferma per scaricare file ZIP > 100 MB.

---

## 🎯 CARATTERISTICHE

✅ **Nessuna installazione** - basta aprire il file HTML  
✅ **Funziona offline** - dopo il primo caricamento  
✅ **Multi-piattaforma** - Windows, Mac, Linux, Android, iOS  
✅ **File EPS veri** - formato PostScript compatibile con Adobe Illustrator  
✅ **Download ZIP** - tutti i barcode in un unico file compresso  
✅ **Drag & Drop** - interfaccia intuitiva  
✅ **Anteprima in tempo reale** - vedi i barcode mentre vengono generati  
✅ **Statistiche live** - totale, successi, errori  
✅ **Design responsive** - si adatta a desktop, tablet, smartphone  
✅ **Icone vettoriali** - interfaccia professionale con Lucide Icons  
✅ **Palette azzurro/blu** - design minimale e moderno  

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
- **RAM:** 2 GB (4 GB consigliati per > 1.000 barcode)
- **Spazio disco:** 100 MB liberi per i file generati
- **Connessione internet:** Solo per il primo caricamento

---

## 🔧 RISOLUZIONE PROBLEMI

### Il file HTML non si apre nel browser
**Soluzione:**
1. Click destro su `barcode-eps-wizard.html`
2. Seleziona "Apri con"
3. Scegli il tuo browser (Chrome consigliato)

### Le icone non si vedono
**Causa:** Problema di connessione internet  
**Soluzione:**
1. Verifica la connessione
2. Ricarica la pagina (F5 o Cmd+R)
3. L'app funziona comunque anche senza icone

### Errore "Codice deve avere 12 o 13 cifre"
**Causa:** Il barcode nel file Excel non è valido  
**Soluzione:**
1. Verifica che tutti i barcode abbiano 12 o 13 cifre
2. Rimuovi spazi, punti o altri caratteri
3. Assicurati che siano solo numeri

### Il browser va in crash con molti barcode
**Causa:** Troppi barcode, memoria insufficiente  
**Soluzione:**
1. Dividi il file Excel in più parti (es: 2.000 barcode per file)
2. Genera i barcode in più sessioni
3. Chiudi altre schede del browser per liberare RAM
4. Usa Chrome o Firefox per prestazioni migliori

### I file EPS non si aprono in Illustrator
**Soluzione:**
1. I file sono in formato PostScript puro
2. In Illustrator: File → Apri
3. Seleziona "Tutti i file" nel filtro
4. I file sono vettoriali al 100%

### Il file ZIP è troppo grande
**Soluzione:**
1. Il limite di download del browser è ~2 GB
2. Se superi questo limite, genera i barcode in più gruppi
3. Scarica i file singolarmente invece dello ZIP

---

## 📁 STRUTTURA FILE GENERATI

Ogni barcode viene salvato come:
```
CODICE01.eps
CODICE02.eps
CODICE03.eps
...
```

Il file ZIP viene chiamato:
```
barcode_eps_1234567890.zip
```
(dove `1234567890` è un timestamp univoco)

---

## 🎨 SPECIFICHE TECNICHE FILE EPS

- **Formato:** PostScript (EPS) versione 3.0
- **Encoding:** EAN-13 standard (ISO/IEC 15420)
- **Check digit:** Calcolato automaticamente secondo algoritmo Modulo 10
- **Quiet zone:** 10 moduli (conforme GS1 General Specifications)
- **Altezza barre:** 50 punti (≈ 17.6 mm)
- **Larghezza modulo:** 1 punto (≈ 0.35 mm)
- **Font:** Helvetica 11pt
- **Colori:** Nero 100% (K) su bianco
- **BoundingBox:** Calcolato automaticamente
- **Compatibilità:** Adobe Illustrator, CorelDRAW, Inkscape, Affinity Designer

---

## 🔒 PRIVACY E SICUREZZA

✅ **Tutti i dati rimangono sul tuo computer**  
✅ **Nessun file viene caricato su server esterni**  
✅ **Nessun tracking o analytics**  
✅ **Nessun account richiesto**  
✅ **Open source** - puoi ispezionare il codice

L'applicazione elabora i file completamente nel browser locale. Nessuna informazione viene trasmessa su internet.

**Interventi di hardening in questa versione:**
- **Validazione rigorosa del barcode** — viene accettato solo se composto da 12 o 13 cifre
  numeriche. Questo chiude un possibile vettore di injection PostScript: senza questo controllo,
  una cella del foglio Excel opportunamente costruita (parentesi, backslash, operatori
  PostScript) poteva finire tale e quale nel file `.eps` generato e venire eseguita da qualunque
  strumento lo apra o lo rasterizzi in seguito.
- **Rendering sicuro contro XSS** — ogni valore letto dal file caricato (codice articolo, barcode,
  messaggi d'errore) viene scritto nella pagina con `textContent`, mai con `innerHTML` o stringhe
  `onclick`. Il contenuto di una cella malevola non può più eseguire script nel browser.
- **Nomi file sanificati** — il codice articolo viene ripulito da separatori di percorso e
  caratteri di controllo prima di essere usato come nome file o voce dello ZIP, e i codici
  duplicati vengono automaticamente resi univoci invece di sovrascriversi in silenzio nello ZIP.
- **Content-Security-Policy** — la pagina applica una CSP rigorosa: possono essere eseguiti solo i
  tre script CDN esatti e lo script di questa pagina (identificato tramite hash SHA-256); tutto il
  resto è negato di default.
- **Limiti dimensionali** — file oltre i 20 MB o fogli con più di 5.000 righe vengono rifiutati
  subito con un messaggio chiaro, invece di bloccare la scheda del browser.
- **Dipendenza fissata** — la libreria di icone Lucide viene ora caricata da una versione fissa
  invece di `@latest`, così il suo codice non può più cambiare a tua insaputa.

---

## 💾 CONDIVISIONE

Puoi condividere l'intera cartella con colleghi:
1. Copia tutti i file su una chiavetta USB
2. Oppure condividi via email/WeTransfer/Google Drive
3. Chi riceve deve solo aprire `barcode-eps-wizard.html`

**Nessuna installazione richiesta per chi riceve i file!**

---

## 📝 CHANGELOG

### Versione 2.1 (Attuale) — Edizione Rinforzata
- 🔒 Validazione rigorosa del barcode (blocca l'injection PostScript nel file EPS generato)
- 🔒 Rendering DOM sicuro contro XSS (niente più `innerHTML`/`onclick` con dati del foglio Excel)
- 🔒 Nomi file sanificati e resi univoci per download e voci ZIP
- 🔒 Content-Security-Policy rigorosa (script inline ancorato via hash, origini CDN in whitelist)
- 🔒 Icone Lucide fissate a una versione precisa invece di `@latest`
- ✨ Limiti su dimensione file (20 MB) e numero di righe (5.000), con messaggi d'errore chiari

### Versione 2.0
- ✨ Nuovo design minimale ispirato a Lucide
- ✨ Icone vettoriali professionali
- ✨ Palette azzurro/blu
- ✨ **Download ZIP** per tutti i barcode
- ✨ Interfaccia responsive per mobile
- ✨ Alert migliorati con icone
- ✨ Progress bar con conteggio
- 🐛 Corretti bug con Excel formattazione numeri

### Versione 1.0
- 🎉 Prima release
- ✅ Generazione barcode EPS
- ✅ Supporto Excel/CSV
- ✅ Download singoli

---

## 🆘 SUPPORTO

Per problemi, domande o suggerimenti, apri una issue su GitHub.

---

## 📜 LICENZA

Licenza MIT - vedi il file [LICENSE](LICENSE) per i dettagli.

Copyright (c) 2026 Chiara Berti 13

---

**Generatore Barcode EPS v2.0 (Minimalist Edition)**  
Di Chiara Berti 13 - 2026
