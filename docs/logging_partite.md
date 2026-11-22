# Il Trono di Cenere — Log delle partite dei tester

Deciso il 15/11/2026: **opzione B**, i log vanno su **Firestore**, lo stesso progetto Firebase dei salvataggi in cloud (`js/cloud.js`). GitHub tiene solo il codice. Implementato il **20/11** (anticipato da domenica): vedi la sezione 0.

## 0. Stato (20/11/2026): ATTIVO, rilasciato su GitHub

Fatto il 20/11, sul PC. Dettaglio in `decisioni_20_novembre.md`, sez. 7.

**Passi una tantum di Francesco:**
1. ✅ **Regole di Firestore pubblicate** dalla console (20/11, 16:17).
2. ✅ **Regole provate** sul PC: `npm run test:firestore` → 25/25 (20/11; installato Java da adoptium.net).
3. ✅ **Chiave di servizio** in `strumenti/chiave_firebase.json`; `git check-ignore` conferma che è esclusa. Accesso anonimo attivo, con pulizia automatica degli account anonimi dopo 30 giorni (i log restano). Prova di `node strumenti\scarica_log.mjs`: 0 eventi, nessun errore.
4. ✅ **Pianificazione** «IlTronoDiCenere scarica log»: ogni 30 giorni alle 10:00, «avvia appena possibile se saltata» attivo; provata a mano (compaiono `log_partite/esecuzioni.txt` e `ultima_esecuzione.txt`).
5. ✅ **Rilascio su GitHub** il 20/11 alle 16:44 (commit `7a6fba3` su `main`, OK di Francesco; GitHub Pages pubblicato). Le verifiche automatiche restano rosse solo per l'errore di lint già noto in `prova.html` (rosse anche il 15/11).

Nota 20/11: in `C:\Users\franc` c'era un repository git vuoto creato per sbaglio (nessun commit, nessun remoto) che inglobava la cartella del gioco. Rinominato in `.git_residuo`, si può cancellare. La cartella del gioco sul PC **non** è una copia git di GitHub: il rilascio va fatto da un clone.

**Come è stato fatto (differenze dal progetto qui sotto):**
- `js/registro.js`: coda anche in localStorage (non si perde chiudendo la pagina), scrittura a lotti ogni 30 secondi, quando la pagina va in secondo piano e subito dopo scontro, prova, riposo, livello, morte, uscita. `dati` è una **stringa JSON** (fino a 200 KB, oltre si tronca): evita i limiti di Firestore sugli array annidati.
- Documento: `log/{idPartita}/eventi/{n}_{sessione}` (la sessione evita collisioni tra due dispositivi sulla stessa partita). L'id della partita nasce in creazione; i personaggi già creati lo ricevono alla prima apertura del gioco.
- `js/cloud.js`: l'accesso anonimo serve solo ai log e **non** conta come accesso (i salvataggi in cloud restano legati a Google).
- Consenso: chiesto **una volta sola alla fine della creazione**, quando si clicca «Entra nel dungeon» (riquadro sopra la pagina, «No, grazie» / «Va bene»). Nella pagina iniziale, dopo la risposta, compare la riga «Registro anonimo delle partite: attivo / spento · Cambia». (20/11, Francesco: niente riquadro in home dopo la creazione, niente domanda in mezzo al gioco.)
- Eventi agganciati: `inizio`, `movimento`, `prova` (tutte, dal punto comune in cui il gioco scrive l'esito), `scontro` (riassunto + tutti gli eventi del motore turno per turno), `guardiano`, `riposo`, `livello`, `morte`, `dialogo` (ogni nodo raggiunto), `uscita`. **Non ancora**: `inventario` e `fine` (il finale non è ancora collegato nel gioco).
- Il formato dello scontro **non** è quello della sala di prova: il riassunto lo fa `strumenti/scarica_log.mjs` (partite, classi, scontri per nemico, prove fallite, morti, dove si smette, dove si resta di più).
- Test: `tests/registro.test.js` (6 casi, in `npm test`); 11 casi nuovi in `tests/firestore.rules.test.mjs`.


## 1. Cosa si registra

**Niente richieste di feedback al giocatore** (Francesco, 15/11): il log raccoglie in silenzio più dati possibile dal gioco reale. Con pochi tester previsti si può essere ricchi: lo scontro si registra **turno per turno**, sempre in un solo documento scritto a fine scontro, quindi si resta comunque nel piano gratuito di Firebase (20.000 scritture al giorno).

| Evento | Quando | Campi principali |
|---|---|---|
| `inizio` | nuova partita o ripresa di un salvataggio | classe, specializzazione, modalità (facile o difficile), livello, posto |
| `scontro` | **a fine scontro**, un solo documento | riassunto (nemico, livelli, turni, esito: vittoria, sconfitta, fuga, risparmio; PF iniziali e finali; armi, pezzi di set, borsa) più **il registro completo turno per turno**: azione e azione rapida del giocatore, tiri e totali, danni dati e subiti, stati applicati e TS, mossa e annunci del nemico, fase del boss, scudi, Copie e placche. È lo stesso formato del log JSON v2 della sala di prova, quindi `analisi_prova.mjs` lo legge già |
| `prova` | prova di abilità | abilità, CD, tiro, esito, luogo |
| `livello` | salita di livello | nuovo livello, scelte fatte (potere, via) |
| `riposo` | riposo | giorno di gioco, PF e mente prima e dopo |
| `morte` | morte | luogo, nemico, livello |
| `guardiano` | dopo ogni guardiano | esito, scelta (finito o risparmiato), tentativi prima della vittoria, tempo dall'ingresso nell'area |
| `movimento` | ingresso in un luogo | luogo, giorno di gioco, tempo reale dall'ingresso precedente (serve a vedere dove ci si perde o ci si annoia) |
| `inventario` | oggetto preso, lasciato, barattato, bevuto fuori scontro | oggetto, azione, luogo |
| `dialogo` | scelta di tono o risposta in un dialogo | personaggio, scelta |
| `uscita` | chiusura della pagina o pausa lunga | ultimo luogo, ultima azione (serve a capire dove si smette di giocare) |
| `fine` | finale raggiunto | quale finale, giorni di gioco, tempo totale |

Ogni evento ha anche: **versione del gioco** (per non mescolare bilanciamenti diversi), id della partita, numero progressivo, data e ora, dispositivo (computer o telefono).

## 2. Dove finiscono i dati

- Raccolta `log/{idPartita}/eventi/{n}`. L'id della partita è casuale e nasce alla nuova partita, dentro il salvataggio.
- **Identità:** nessun nome né email. Se il tester ha fatto l'accesso con Google si usa il suo uid Firebase (un codice, non l'email); altrimenti si attiva l'**accesso anonimo** di Firebase (da abilitare una volta nella console). Così anche chi gioca senza account viene tracciato.
- **Regole di sicurezza:** dal browser si può **solo creare** eventi con il proprio uid, con i campi attesi e una dimensione massima; nessuno può leggere, modificare o cancellare i log dal gioco. Le regole si provano con l'emulatore, come quelle dei salvataggi (`npm run test:firestore`).
- **Lettura:** solo tu, dal PC, con lo script `strumenti/scarica_log.mjs` (firebase-admin e una chiave di servizio). La chiave resta **solo sul PC**, nel `.gitignore`, mai su GitHub. Lo script salva tutto in `log_partite/` (cartella esclusa da git) e stampa il riassunto (sez. 0).

## 3. Consenso e privacy

- Alla fine della creazione, su «Entra nel dungeon» (vedi sez. 0): «Per migliorare il gioco registriamo in forma anonima come vanno le partite (scontri, prove, scelte). Nessun dato personale.» con «Va bene» e «No, grazie». La scelta si cambia dalle impostazioni.
- Con «No, grazie» non parte nessuna scrittura. Nessuna domanda al giocatore durante il gioco.
- **Conservazione: 30 giorni** (Francesco, 15/11). La regola TTL di Firestore ha dato errore 403 il 15/11 (probabilmente richiede la fatturazione): **piano B**, lo script `strumenti/scarica_log.mjs` prima scarica sul PC tutti i log nuovi, poi cancella da Firestore quelli più vecchi di 30 giorni (campo `scade`). Sul PC i dati restano.
- **Esecuzione pianificata ogni 30 giorni** (Francesco, 15/11) con l'Utilità di pianificazione di Windows: `strumenti/scarica_log.bat` contiene il comando `schtasks` da lanciare una volta e l'opzione «esegui appena possibile se l'esecuzione è stata saltata». Lo script scrive un registro in `log_partite/esecuzioni.txt`.
- Cancellazione su richiesta: con l'id della partita (`idPartita` nel salvataggio) cancelli tu i suoi dati dalla console.

## 4. Dove va nel codice

- Un solo modulo nuovo, `js/registro.js`: coda in memoria, scrittura a lotti (a fine scontro, alla prova, al riposo), nuovo tentativo se si è offline. Gli altri file chiamano solo `Registro.evento(tipo, dati)`.
- Agganci: `racconto.js` e `scontro.js` per lo scontro (riusando i dati del log JSON v2 della sala di prova), `gioco.html` per prove, livelli, riposi, guardiani, morte e finale, `creazione.html` per l'inizio.
- La sala di prova continua a scrivere i suoi file in `log_scontri/`: i log Firestore sono per il gioco vero.
- Test: `tests/registro.test.js` (forma degli eventi, consenso spento = nessuna scrittura, coda offline, campo `scade` a 30 giorni) e test delle regole con l'emulatore.
- Limite di Firestore: 1 MB per documento. Uno scontro lungo turno per turno sta sotto i 50 KB; il modulo spezza in più documenti se mai servisse.

## 5. Decisioni e punti aperti
- **Deciso (15/11):** nessun feedback chiesto al giocatore; più dati possibili dal gioco; log tenuti 30 giorni su Firestore.
- **Console Firebase:** abilitare l'**accesso anonimo** (senza, chi gioca senza account Google non viene registrato) → **fatto il 15/11**. La regola TTL non serve più (piano B).
