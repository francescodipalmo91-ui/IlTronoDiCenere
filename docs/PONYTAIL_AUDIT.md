# Audit Ponytail: Il Trono di Cenere (terza passata, 27/11/2026)

*Fatto con le regole di `/ponytail-audit` (DietrichGebert/ponytail, `skills/ponytail-audit/SKILL.md`). È un report: non cambia il codice. Dimmi i numeri da sistemare («fai 1, 2 e 5»).*

**Cosa fa questo progetto:** gioco di ruolo testuale per browser, tutto statico (GitHub Pages). Si crea un personaggio, si scrivono azioni in italiano o in inglese, si tirano i dadi e si esplora Casa Vespera. I salvataggi stanno nel browser (3 posti); con l'accesso Google vanno anche su Firestore. Un log anonimo delle partite va su Firestore, in sola scrittura.

**Carico ipotizzato:** una persona alla volta, due dispositivi (PC e Pixel 9a), pochi tester. Nessun server proprio.

**Cosa ho letto e provato:** regole di Firestore, `js/cloud.js` (salvataggio e sincronizzazione), `js/sicuro.js`, tutti gli usi di `innerHTML`, `salvaPartita()`, i due workflow di GitHub, la lista delle dipendenze, i test (16 serie di regole, 11 suite browser, lint, coerenza dei documenti: tutti verdi), il codice morto (`/tmp/deadcode.py`: 0 funzioni orfane in `gioco.html`) e i residui del vecchio motore. Le 4 correzioni della passata del 2/11 sono state ricontrollate (tabella in fondo).

**Cosa non va (in breve):** niente di grave. Un difetto vero ma raro nel cloud, un sistema di stati vecchio che i giocatori non possono più incontrare, e un po' di scarti del vecchio motore ancora in pagina.

---

## Da sistemare

**1. Gli elisir di cura e di protezione curano stati che il personaggio non può più avere** (`gioco.html` righe 5860-5870, 5876-5890, 6669-6670, 7425, 9984-10003)
- **Cos'è:** Guendalina prepara sei rimedi (ustione, debolezza, veleno, paura, sangue, cecità) e i «concentrati» che rendono immuni per uno scontro. Il gioco ricorda gli stati del giocatore in `usate.stati_pg`.
- **Problema:** nel motore nuovo nessuna riga scrive più `usate.stati_pg` (si legge, si svuota, ma non si riempie). Un rimedio comune risponde sempre «Sei già a posto»; un concentrato scrive `usate.protezione`, che nessuno legge tranne la riga che la mostra tra i valori. Il giocatore consuma ingredienti per oggetti che non fanno nulla.
- **Fix:** scegliere. (a) Collegare i sei rimedi agli stati del motore nuovo (`js/poteri.js`: Stordito, Impaurito, ecc.), oppure (b) togliere le ricette, `statiPg`, `haStato`, `togliStatoPg`, `protezionePg` e il ramo `cura_/conc_` (circa 45 righe). È una scelta di gioco: decide Francesco.
- **Se non lo facciamo:** i tester trovano elisir inutili e pensano a un errore.

**2. Due salvataggi ravvicinati segnalano un falso «conflitto» nel cloud** (`js/cloud.js` righe 139-152, ancora aperto dalla passata del 2/11)
- **Cos'è:** dopo «Salva partita» il posto va a Firestore con una transazione che controlla che nessun altro dispositivo abbia salvato nel frattempo.
- **Problema:** `setBase` si aggiorna solo quando il primo invio finisce. Con due «Salva» in pochi secondi il secondo trova scritto il primo e risponde «conflitto», anche con un solo dispositivo. Il giocatore legge «☁ conflitto» e può scegliere a mano quale versione tenere.
- **Fix:** mettere gli invii in fila: `let coda = Promise.resolve();` e `coda = coda.then(() => invia(n))` dentro `inviaSlot`. Tre righe, più un test in `tests/cloud.test.js`.
- **Se non lo facciamo:** falsi allarmi e sfiducia nei salvataggi.

**3. Restano scarti del vecchio motore nelle pagine** (`gioco.html`: `disegnaIncantesimi` r. 6758, `incantesimiBox` r. 641, `tecnicheBox` r. 638, barra `r-mana` r. 656, testi «incantesimi/mana» nelle tabelle IT/EN; `incantesimi: []` e `mana: null` nei personaggi)
- **Cos'è:** il vecchio sistema (mana, incantesimi, tecniche, furia) è stato tolto dalla logica il 27/11. Restano riquadri nascosti, una funzione che nasconde un riquadro, e circa 240 righe che nominano ancora mana, incantesimi, tecniche o furia (in parte testi di storia e commenti, che vanno bene).
- **Problema:** ogni riga in più va letta e provata; i riquadri nascosti confondono chi legge il codice e il lint non li vede.
- **Fix:** togliere i tre riquadri e la barra mana dall'HTML, le funzioni stub e le chiavi di testo non più usate. Va fatto a piccoli blocchi con la suite browser verde dopo ogni blocco.
- **Se non lo facciamo:** nulla si rompe; il debito resta.

**4. Test mancanti sulle due difese del salvataggio** (`js/sicuro.js`, `js/cloud.js`)
- **Cos'è:** `sicuro.js` filtra l'HTML (DOMPurify). Se `lib/purify.min.js` non si carica, il file inserisce l'HTML **senza filtro** e scrive solo un avviso in console.
- **Problema:** nessun test lo verifica. Un salvataggio manomesso o un file mancante dopo un cambio di cartella lascerebbe passare un nome con codice dentro. Oggi le stringhe sono nostre e i soli due `innerHTML` diretti (`gioco.html` 12145 e 12257) sono statici: nessun buco aperto.
- **Fix:** un test che carica la pagina senza `purify.min.js` e controlla che un nome tipo `<img onerror=...>` resti testo; e in `pulisci()` rispondere con il testo scappato invece del markup quando DOMPurify manca.
- **Se non lo facciamo:** il giorno che si sposta `lib/`, la protezione sparisce senza che nessuno se ne accorga.

## Piccole migliorie

**5. `immagini/nemici/dafne.png` pesa 5,6 MB** (gli altri nemici sono `.webp` da 0,9-1,2 MB)
- **Fix:** convertirla in `.webp` (come gli altri) e cambiare il nome nel codice: circa −4,5 MB al primo incontro con Dafne, utile sul telefono.
- **Se non lo facciamo:** caricamento lento sulla rete mobile, solo per quella scena.

**6. I due `innerHTML` diretti di `gioco.html` (12145, 12257) saltano `Sicuro.html`**
- **Fix:** usare `Sicuro.html(el, markup)` come nel resto del gioco: coerenza, due righe.

---

**Verdict:** sano. Prima da decidere il punto 1 (è una scelta di gioco), poi il 2 (tre righe); il resto si fa a blocchi piccoli.
**Lean:** circa −45 righe (punto 1b) e −60 righe (punto 3) possibili, 0 dipendenze.
**Not checked:** testi della storia (letti solo quelli toccati oggi), `strumenti/*` oltre il lint, le regole Firestore pubblicate sulla console (qui c'è la versione proposta), le prestazioni su telefono reale.

## Stato delle correzioni della passata del 2/11
| N. | Cosa | Oggi |
|---|---|---|
| 1 | Pulsanti «Usa» delle Tecniche troppo piccoli | superato: le Tecniche sono uscite col vecchio motore |
| 2 | Personaggio perso con i tre posti pieni | **fatto** (`creazione.html` r. 449: torna alla pagina iniziale) |
| 3 | Falso conflitto con due salvataggi ravvicinati | **aperto** (punto 2) |
| 4 | Diario troppo grande per Firestore | **fatto** (limite 30 voci per stanza, `gioco.html` `salvaPartita`) |
