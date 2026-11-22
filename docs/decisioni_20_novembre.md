# Decisioni e lavori del 20 novembre 2026

Registro delle decisioni più recente. Francesco (20/11, pomeriggio): «tutto quello che possiamo fare oggi facciamolo, non aspettiamo domenica». Il congelamento del codice fino al 22/11 è quindi superato per creazione, riposo e regolamento; GitHub resta da aggiornare con un rilascio, con l'ok di Francesco.

## 1. Verifiche
- **GitHub allineato al PC** (verificato il 20/11): i 35 file di codice del PC sono identici all'ultimo commit (15/11, 17:51). Diversi solo `docs/` e `mockup_creazione.html`, che non fanno parte del gioco. Il sito online è quindi la versione del PC fino ai lavori di oggi.
- **Logging delle partite:** non c'era; fatto nel pomeriggio (sez. 7).
- Test: le 15 serie di test delle regole passano; lint e test di fumo (PC e telefono) verdi. **Difetti già presenti prima di oggi**, identici sulla versione di GitHub: `tests/livelli.browser.js` (2 casi su 3), `tests/cacce.browser.js` (2 su 4, cercano ancora il troll), errore di lint in `prova.html` (etichetta con più campi), `npm run coerenza` che cerca `docs/bilanciamento_nemici_oggetti.md` (archiviato).

## 2. Creazione a cinque passi (`creazione.html`, nel codice)
- Passi: Chi sei · Attributi e abilità · Specializzazione e poteri · Equipaggiamento · Riepilogo; indicatore in alto con la spunta sui passi completi; navigazione libera; «Entra nel dungeon» solo quando tutto è completo.
- Nel primo passo: privilegio del livello 1 e **tabella di classe** (livelli 1-5, privilegi, poteri conosciuti), come deciso il 17/11.
- **Focus a due forme** per Sciamano, Arcanista e Monaco (radio «forma normale / forma scudo» con il nome della classe); per loro niente scudo e solo armi a una mano; **Bastone tolto** dalle armi.
- **Dotazione fissa di sette oggetti**: piede di porco, corda, lente, pozione di cura (1), torcia (2), gesso (3), quaderno e carboncino (2). Descrizioni in italiano e inglese in `js/lingua.js`.
- Testi della creazione in italiano e inglese (anche la parte dei poteri, prima solo in italiano). I nomi e i testi dei poteri vengono da `specializzazioni.js` e restano in italiano (traduzione dei poteri: lavoro a parte).
- Salvataggio: `equipaggiamento.focus = { nome, forma, dado, bonus, ca }`; la forma scudo vive anche nello slot dello scudo (`scudo.focus`), così CA e mano secondaria funzionano come per lo scudo.

## 3. Motore e gioco
- **Dado dei poteri degli incantatori = dado del focus** se più alto di quello dell'arma: d8 in forma normale, **d6 in forma scudo**. Chiude la questione aperta «d8 con il focus». Personaggi creati prima del 20/11: d8 come prima. Nuovo caso di test in `tests/scontro_regole.test.js`.
- Scheda: il focus normale compare in mano secondaria; il focus scudo come scudo, senza malus di Agilità.
- Corretto un difetto vecchio: la scheda calcolava il danno dell'arma con l'attributo «Lotta», non più esistente; ora usa la caratteristica di classe.

## 4. Riposo base e regole facoltative (nel codice)
- **Base**: il riposo cura tutta la salute fisica e 2 punti mentali (3 con *La lanterna*); non servono razioni.
- **Fame (facoltativa)**: il corpo non guarisce dormendo; al riposo si mangiano le razioni che servono, 1/4 della salute massima l'una (+50% con *Mani che curano*). *Interpretazione di Claude*: «quante se ne vogliono» è reso così, al riposo; non c'è ancora un comando per mangiare fuori dal riposo.
- **Peso dei giorni (facoltativa)**: −1 alla salute mentale massima ogni 10 giorni.
- Si scelgono in creazione, accanto alla modalità (spente di base). Personaggi creati prima del 20/11: «Peso dei giorni» attivo e «Fame» spenta.
- Aggiornati i testi del gioco che descrivevano il vecchio riposo (italiano e inglese).

## 5. Regolamento (`regolamento.html`, riscritto)
- Cinque parti: Come si gioca · Il personaggio · Combattimento · Le classi · **Regole facoltative**; 22 capitoli; italiano e inglese. Tolti tecniche, incantesimi, risorse, Bilancia e i tre esempi vecchi; nuovo esempio di combattimento (Berserker).
- Corrette le due contraddizioni segnalate dal tester: «osservare è gratis, forzare costa»; il parser resta da sistemare a parte.
- Nel testo inglese gli stati hanno tra parentesi il nome italiano, perché il registro di combattimento è ancora in italiano.
- Descrive regole già decise ma **non ancora nel gioco**: agguati dei vuoti (nel gioco ci sono ancora goblin, orchi e avventurieri) e +2 della dotazione nelle prove. Si allineano con il codice di domenica.

## 6. Restano per domenica 22/11 (o dopo)
- `prova.html` (sala di prova) e `js/oggetti.js` (Sfera armillare ancora «Bastone da cartografo» a due mani; Focus rinforzato in due forme).
- +2 della dotazione nelle prove dei luoghi.
- Vuoti al posto di goblin, orchi e avventurieri in `gioco.html`; inventario; set di classe; le modifiche del 16/11.
- `tutorial.html` e `test.html` sul motore nuovo.
- Traduzione inglese dei poteri e del registro di combattimento.

## 7. Log delle partite (nel codice, da pubblicare)
- Fatto il 20/11 secondo `logging_partite.md` (sez. 0 con le differenze): `js/registro.js`, accesso anonimo solo per i log in `js/cloud.js`, consenso nella pagina iniziale, eventi agganciati in `gioco.html`, id della partita in creazione, regole in `firestore.rules`, `strumenti/scarica_log.mjs` e `.bat`, `firebase-admin` nelle dipendenze di sviluppo, test.
- **Per farlo funzionare servono cinque passi di Francesco** (pubblicare le regole, provarle con l'emulatore, chiave di servizio, pianificazione, rilascio): elenco in `logging_partite.md`, sez. 0.
- Non ancora agganciati: `inventario` e `fine`.

## 8. Dopo la prova della creazione (sera del 20/11)
Richieste di Francesco dopo aver provato la creazione; dove c'era da decidere ha scelto lui (domande a risposta multipla).
- **Ordine dei passi**: Chi sei · Attributi e abilità · **Equipaggiamento** · **Specializzazione e poteri** · Riepilogo (i poteri parlano dello stato dell'arma, quindi prima si sceglie l'arma).
- **Chi sei**: tolto il privilegio di classe (si legge in Specializzazione); nella tabella niente nomi di Aldo e Guendalina e niente «giornaliero finale»; la via di prestigio è distribuita ai livelli 2, 3 e 4 («primo / secondo / terzo potere»).
- **Riquadri a scomparsa** più stretti (al massimo 18rem), così non coprono le voci sotto.
- **Specializzazioni**: tolte «offensiva / difensiva»; descrizione più lunga per capire da soli lo stile.
- **Poteri**: tolte le diciture «a volontà offesa / controllo / difesa» e simili; tolto il riquadro «Più avanti…»; gli stati nei testi sono sottolineati e al passaggio (o al tocco) spiegano cosa fanno.
- **«Dado in più»** ovunque diventa **«dado di danno in più»** (non è un d20 in più).
- **Armi**: micro descrizione fantasy e tipo di danno in breve.
- **Riepilogo** come una scheda, con il ritratto scelto.
- **Armature** (decisione di Francesco): leggera CA +1 con Agilità fino a +4; media CA +3 con Agilità fino a +2; pesante CA +6 senza Agilità e **−1 alle abilità di Agilità**. Leggera e media senza malus. Con Agilità +1/+2/+3: leggera 2/3/4, media 4/5/5, pesante 6. Valori in `js/regole.js` (`ARMATURA_CA`, `TETTO_AGILITA`, `MALUS_AGILITA`); il malus vale anche per i personaggi creati prima.
- **Niente più regole facoltative** (sostituisce la sez. 4): si applicano sempre e sono spiegate nel regolamento.
  - **Il sonno cura solo la mente** (+2, +3 con *La lanterna*). La salute fisica la curano cibo e pozioni.
  - **Razioni di Adele** (decisione di Francesco): si mangiano **quando vuoi, fuori dallo scontro**, dallo zaino («Mangia») o scrivendo «mangio una razione»; ognuna cura 1/4 della salute fisica massima (+50% con *Mani che curano*). Il riposo non le consuma. In scontro non si mangia.
  - **Peso dei giorni** sempre attivo.
- **Modalità difficile** (decisione di Francesco): niente salvataggio automatico; **un solo salvataggio manuale in tutta la partita**, quando decide il giocatore. Dopo, il pulsante si spegne.
- **Consenso al log**: chiesto una volta sola alla fine della creazione, quando si clicca «Entra nel dungeon». Tolto il riquadro dalla home e la domanda dentro il gioco.
