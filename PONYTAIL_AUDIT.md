# Audit Ponytail: Il Trono di Cenere

*Fatto con le regole di `/ponytail-audit` (DietrichGebert/ponytail). È un report: non cambia il codice. Dimmi i numeri da sistemare («fai 1, 2 e 5»).*

**Cosa fa questo progetto:** è un gioco di ruolo testuale per browser. Si crea un personaggio, si scrivono le azioni in italiano o in inglese, si tirano i dadi e si esplora Casa Vespera. I salvataggi stanno nel browser (tre posti) e, con l'accesso Google, anche su Firestore, il database online di Firebase, per giocare da PC e telefono.

**Carico ipotizzato:** una persona alla volta, con due dispositivi (PC e Pixel 9a). Nessun server proprio.

**Cosa ho letto e provato:** tutti gli 11 file. In gioco.html ho letto per intero la logica (scheda, prove, riposo, livelli, salvataggio, audio, combattimento); i testi della storia solo a campione. Ho giocato 6 partite casuali da 70 azioni ciascuna (420 azioni, nessun errore JavaScript), ho misurato pulsanti e tempi di caricamento e ho pesato un salvataggio.

---

## Da sistemare subito

**1. Sul telefono i pulsanti «Usa» delle Tecniche sono troppo piccoli** (`gioco.html` righe 297–303 e 523–524)
- **Cos'è:** nella scheda, ogni tecnica del Guerriero ha un pulsante «Usa» per lanciarla in combattimento.
- **Problema:** lo stile dei mini-pulsanti è copiato quattro volte (zaino, tecniche, incantesimi, missioni). La regola che li ingrandisce sul telefono elenca zaino, equipaggiamento, incantesimi e missioni, ma dimentica le tecniche. Misurato a 412px di larghezza: «Usa» delle Tecniche è alto **26px**, quello dello Zaino **34px**.
- **Correzione:** unire le quattro copie in un'unica regola con tutti i selettori, `#tecniche` compreso. Si tolgono circa 12 righe e il difetto sparisce.
- **Se non lo facciamo:** in combattimento sul Pixel il Guerriero sbaglia il tocco proprio sul pulsante che usa di più.

**2. Un personaggio creato con i tre posti già pieni va perso** (`creazione.html` righe 833–839)
- **Cos'è:** quando si conferma la scheda, il personaggio viene messo nel primo posto libero.
- **Problema:** se i tre posti sono pieni e si apre `creazione.html` direttamente (da un segnalibro o dalla cronologia), il personaggio finisce solo in `personaggio` e `partita`, senza posto. Si gioca, si salva, ma dalla pagina iniziale non compare più, e la prossima nuova partita lo sovrascrive.
- **Correzione:** all'apertura di creazione.html, se non c'è un posto libero, tornare alla pagina iniziale. Una riga: `if (!["1","2","3"].some(k => !localStorage.getItem("slot" + k))) location.replace("index.html");`
- **Se non lo facciamo:** raro, ma quando succede il giocatore perde ore di partita senza capire perché.

## Da sistemare

**3. Due salvataggi ravvicinati segnalano un falso conflitto nel cloud** (`cloud.js` righe 138–155)
- **Cos'è:** dopo «Salva partita» il gioco manda il posto a Firestore con una transazione, cioè un'operazione che controlla che nessun altro dispositivo abbia salvato nel frattempo.
- **Problema:** con due tocchi rapidi su «Salva» partono due invii insieme. Il secondo trova già scritto il primo e, poiché la base locale non è ancora aggiornata, risponde «conflitto»: il giocatore legge «☁ conflitto» anche se ha usato un solo dispositivo. Si sistema da solo alla sincronizzazione successiva, ma spaventa. (Ricavato dal codice: senza un account Firebase di prova non l'ho riprodotto.)
- **Correzione:** mettere gli invii in fila: `let coda = Promise.resolve();` e far passare `inviaSlot` da `coda = coda.then(() => invia(n))`. Tre righe.
- **Se non lo facciamo:** falsi allarmi di conflitto e dubbi sulla sicurezza dei salvataggi.

**4. Il salvataggio crescerà verso il limite di Firestore** (`gioco.html` riga 6778)
- **Cos'è:** quando si salva, il diario viene tenuto per intero fino a **80 voci per stanza**.
- **Problema:** una voce pesa in media **220 byte** (misurato). Con circa 25 stanze piene fanno già circa 440 KB, e le voci dei dialoghi lunghi pesano 3–5 volte di più. Firestore accetta al massimo **1 MiB** per documento; oltre, `cloud.js` risponde «troppo» e quel posto smette di sincronizzarsi per sempre. Inoltre in locale la stessa partita è scritta due volte (`partita` e `slotN`).
- **Correzione:** abbassare 80 a 30 (un numero). Il diario mostra comunque le ultime 30 azioni di ogni stanza.
- **Se non lo facciamo:** a fine gioco, proprio sulle partite più lunghe, PC e telefono smettono di allinearsi.

**5. Le stesse regole sono scritte in tre posti** (`regole.js`; `creazione.html` righe 349, 360, 445, 448; `gioco.html` righe 4926–4927, 4965, 5011–5013)
- **Cos'è:** regole.js promette «si cambia un valore qui e cambia ovunque».
- **Problema:** dado vita, risorse di classe, attributi degli incantatori e lista delle abilità sono ricopiati a mano in creazione e gioco. Se cambi il dado del Guerriero in regole.js, il regolamento mostra il nuovo dado ma creazione e passaggio di livello tirano ancora d10. Anche i valori di riserva (`?? 10`, `?? 3`…) sono doppioni, e uno è già sbagliato: in creazione `MAX_ABILITA` ha come riserva **3**, mentre la regola dice **4**.
- **Correzione:** leggere tutto da `Regole` (es. `const CLASSI = Object.fromEntries(Object.entries(Regole.CLASSI).map(([k, v]) => [k, v.dado]))`) e togliere i valori di riserva: regole.js è un file locale, se manca non parte niente comunque. Circa −15 righe.
- **Se non lo facciamo:** la prossima modifica alle regole crea un gioco che non rispetta il proprio regolamento.

**6. La sincronizzazione cloud non ha nessun test** (`cloud.js` righe 166–191)
- **Cos'è:** `sincronizza()` decide, posto per posto, se caricare, scaricare o chiedere al giocatore quale versione tenere.
- **Problema:** è la logica più delicata del progetto (decide quale salvataggio sopravvive), ma nessun test si accorgerebbe se una modifica la rompe.
- **Correzione:** un solo test con un Firestore finto che copra i sei casi della tabella (cambiato solo il locale, solo il cloud, entrambi, eliminato da una parte, eliminato da entrambe, uguali). Il banco di prova l'ho già usato per il controllo dei dati scaricati.
- **Se non lo facciamo:** un errore qui sovrascrive in silenzio la partita buona con quella vecchia.

**7. Codice che non serve più** (`gioco.html` righe 4426–4427, 4429, 6916, 6925–6937, 7086, e i testi `dannoStanza` alle righe 1095–1096 e 1521–1522)
- **Cos'è:** `PROVA_PERCEZIONE`, `PROVA_MENTE` e `laboratorioAperto` non sono usati da nessuna parte. Il danno mentale «tutte le prove della stanza fallite» (`DANNO_STANZA`, `controllaDannoStanza`) è stato tolto: la tabella è vuota e quella funzione non fa mai nulla.
- **Problema:** circa 25 righe da leggere e mantenere, in italiano e in inglese, che non fanno niente.
- **Correzione:** cancellarle. Se pensi di riattivare il danno della stanza, tienilo ma scrivilo nel commento.
- **Se non lo facciamo:** nessun danno immediato, solo peso in un file che ha già 9.000 righe.

## Utile ma non urgente

**8. Il ripiego senza howler in `audio.js` si potrebbe togliere** (`audio.js` righe 86–121 e 129–135)
- **Cos'è:** l'ho aggiunto io al passo 3: se howler non si carica, l'audio usa il lettore del browser.
- **Problema:** howler è un file locale servito insieme al gioco; se non arriva quello, quasi sicuramente non arriva neanche il resto. Sono circa 45 righe di sicurezza raramente utili (stesso discorso, più piccolo, per il ripiego di `sicuro.js`).
- **Correzione:** cancellare il ramo `tracciaNativa` e il ripiego di `effetto`. Io lo terrei: è testato e protegge l'audio sul telefono se la cache si corrompe. Decidi tu.
- **Se non lo facciamo:** 45 righe in più, nient'altro.

**9. Commenti che dicono il contrario del codice** (`tecniche.js` riga 4; `creazione.html` riga 441; `gioco.html` righe 376 e 4466)
- **Cos'è:** tecniche.js dice «si preparano 4 tecniche speciali» (la regola è 2, 3 con lo scudo); creazione dice che il cambio incantesimi al riposo «non è ancora implementato» (lo è); il CSS dice «riquadro viola come i dialoghi» per capacità e missioni (sono ambra e verde acqua); `PROVE_DICHIARATE` è segnata «VUOTA» ma è piena.
- **Problema:** chi modifica il gioco, anche un'AI, si fida del commento e sbaglia.
- **Correzione:** correggere le 4 righe di commento.
- **Se non lo facciamo:** errori futuri quando si mette mano a quelle parti.

---

**Verdict:** sano per un gioco a un giocatore: nessun errore in 420 azioni casuali, dati del cloud validati, nessuna chiave segreta nel codice (la chiave Firebase è pubblica per progetto, la protezione sono le regole di Firestore). Da sistemare per primi: **1** e **2**.

**Lean:** −50 righe possibili (−95 togliendo anche i ripieghi del punto 8), −0 dipendenze.

**Not checked:** sincronizzazione con un vero account Firebase (il punto 3 viene dalla lettura del codice); immagini e audio reali (non tra i file ricevuti); i contenuti oltre il piano terra (le partite casuali sono arrivate fino all'atrio e alla sala da conversazione); i testi inglesi, solo a campione. Caricamento di gioco.html misurato: circa 0,6–0,7 s con processore rallentato 4 volte, va bene così.

---

## Esito delle correzioni (23 ottobre)

| # | Esito |
|---|-------|
| 1 | **Fatto.** Le quattro copie dello stile sono diventate una sola regola. Sul telefono «Usa» delle Tecniche passa da 26px a 34px, come le altre sezioni; nessun altro stile cambiato (42 elementi controllati su PC e telefono, Guerriero e Arcanista). |
| 2 | **Fatto.** Con tre posti pieni, creazione.html torna alla pagina iniziale. |
| 3 | **Smentito dal test e non applicato.** Con un Firestore finto anche il codice originale gestisce bene due salvataggi ravvicinati: quando la transazione riprova, la base locale è già aggiornata. Il caso resta nel test come controllo. |
| 4 | **Fatto.** Diario salvato: 30 voci per stanza. |
| 5 | **Fatto.** Dado vita, risorse marziali e attributo degli incantatori sono ricavati in regole.js (`DADO_VITA`, `RISORSA_MARZIALE`, `ATTR_MAGIA`); creazione e gioco li leggono da lì, e i valori di riserva sono stati tolti (incluso il `MAX_ABILITA ?? 3` sbagliato). |
| 6 | **Fatto.** `tests/cloud.test.js`, 8 casi: `node tests/cloud.test.js`. Sul cloud.js originale fallisce il caso «dati illeggibili», sistemato al passo DOMPurify. |
| 7 | **Fatto.** Tolto il codice morto e il danno «tutte le prove della stanza fallite». Nuova regola decisa: diari (bronzo/argento 1d2, oro/platino 1d4, campo `grado` della pagina) e flashback (1d4) feriscono la mente solo la prima volta e non la portano mai sotto 1. Regolamento aggiornato. |
| 8 | **Fatto.** Tolto il ripiego HTMLAudio; senza howler il gioco resta giocabile ma muto (il fuoco generato suona comunque). |
| 9 | **Fatto.** Corretti i 4 commenti. |
