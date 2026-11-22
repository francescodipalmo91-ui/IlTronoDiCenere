# Decisioni e lavori del 22 novembre 2026 (domenica)

Registro più recente. Sul PC e, dalla sera (sezione 16), anche su GitHub. Il bilanciamento resta congelato (15/11): nessun valore toccato, le misure sono indicative.

## 1. Controlli lasciati aperti il 21/11
- **Test del motore (16 serie)**: tutti verdi, anche dopo le modifiche di oggi.
- **Lint**: ESLint 0 errori. html-validate aveva 5 errori, ora 0: un'etichetta con due controlli in `prova.html` (focus: radio, oggetto e forma, ora separati con `aria-label`) e 4 `role="presentation"` → `role="none"` in `gioco.html` (2) e `tutorial.html` (2).
- **`npm run coerenza`**: ripuntato `strumenti/coerenza_docs.mjs` a `docs/archivio/bilanciamento_nemici_oggetti.md`; ora gira (le divergenze rimaste riguardano immagini mancanti nella copia di lavoro).
- **Test del browser**: nel file `combattimento` falliscono i casi dell'Arcanista con il vecchio motore; falliscono uguale sulla copia di ieri (vedi 4.4).

## 2. Verga di cenere: convertita in focus (scelta di Francesco)
- `FOCUS.verga_di_cenere` con `dadoBase: 10`, bonus +3, Leggendario, da Profeta della cenere, potere giornaliero *Pioggia di braci*. **Forma normale d10, forma scudo d8 con +1 CA.** Tolta da `ARMI`. Il fuoco resta nel potere; i poteri di classe tengono il loro tipo.
- `focus()`: con `dadoBase` la forma scudo scende di un gradino. `prova.html`: Verga nel menu del focus. `tests/oggetti.test.js` aggiornato.
- Documenti allineati il 22/11 (`oggetti_per_rarita.md`, `oggetti_manuale.html`, `riscrittura_meccaniche.md`, matrice 8f).

## 3. Inventario (in `gioco.html`)
- **Posa** (solo in Casa, fuori scontro) e **Getta** (ovunque, conferma al secondo clic) su armi, scudi, armature, consumabili, materiali e dotazione; gli oggetti di storia no.
- **Sgabuzzino**: 10 posti, stesso tipo impilato (tetto 10), salvato con la partita (`usate.sgabuzzino`). Zaino: 8 posti di scorta per armi/scudi/armature; al massimo due armi tra mano e zaino.
- **Pozioni ed elisir: 2 per tipo in borsa** (anche Siero, essenza, serenità); l'eccesso resta nello sgabuzzino; il laboratorio non ne prepara oltre il tetto. L'acqua benedetta non ha tetto.
- **Comandi scritti** (IT/EN): «poso X nello sgabuzzino», «riprendo X dallo sgabuzzino», «getto X» (conferma ripetendo il comando).
- `tests/inventario.browser.js` (11 casi) in `npm run test:browser`.

## 4. «Da sapere» chiusi (scelte di Francesco)
1. **Tetto 8 posti al bottino**: con il bottino dei vuoti («Raccogli / Raccogli tutto»; ciò che avanza resta sul corpo; i premi garantiti del guardiano entrano sempre).
2. **Pozioni**: 2 per tipo.
3. **Comandi scritti**: aggiunti.
4. **Vecchi test browser**: personaggi di prova senza `motore: 2` → avviso «Personaggio da ricreare» che blocca i clic. La suite browser non fa da controllo; i dati di prova si aggiornano con la pulizia del vecchio motore.

## 5. Modifiche del 16/11 nel motore
- **Poteri senza tiro senza caratteristica** (`js/scontro.js`, testi in `js/specializzazioni.js`): Sovraccarico, Annullamento, Frantumare, Il Grande Inganno, Marea cremisi, Spirito d'ossa, Armata dei morti **e Incubo** (non era nella lista del 16/11 ma rientra nella regola; si annulla con una riga). Nessun potere dei nemici sommava la caratteristica senza tiro.
- **Rinomi**: *Resa dei conti* (`resa_dei_conti`), *Condanna maledetta* (`condanna_maledetta`), *Decreto dell'erede* (`prova.html`), *Verdetto del giudice* (solo documenti: lo Spadone non è nel motore).
- **Stivali dell'Ultimo passo** (Leggendario, +3 Furtività): *Primo passo* automatico (`Scontro.primoPasso`): attacco extra all'inizio del primo turno, attacco base o a volontà, d20 e bonus completi; con `primo` −2 CA al nemico nel primo round, sommato al −2 di Furtività/agguato. Giornaliero.
- **Lascito di Dafne** (`PERGAMENE.lascito_di_dafne`): potere *Ultimo colpo* (giornaliero): senza tiro, dado dell'arma + 2 dadi, niente bonus né critico, Esposto poi Scoperto senza TS.

## 6. +2 della dotazione nelle prove dei luoghi (in `gioco.html`; scelta A di Francesco)
- **Il +2 vale solo se il giocatore nomina l'oggetto nell'azione** («esamino la tomba con la lente») **e ce l'ha**. Uno solo per prova. Piede di porco → Atletica; corda (anche *Corda e rampino*) → Atletica e Acrobazia; lente → Indagare e Percezione.
- Nominato ma non posseduto: «Non hai la lente con te.» Posseduto ma non nominato: suggerimento le prime 3 volte (`usate.dotazioneSugg`). Prove da pulsante: secondo pulsante «Lancia d20 con la lente (+2)» dopo il primo uso scritto (`usate.dotazioneUsata`).
- Mai in scontro né nelle prove contrapposte; esclusione con `prova.dotazione: false` (quaderno nel braciere di Ettore). Sarcofago: con il piede di porco usato, niente danno alle dita.
- Non toccati: gesso, quaderno e carboncino, torcia (servono enigmi e prove di Sapienza).

## 7. Set di classe e vesti nel motore
- **Pezzi** (`js/oggetti.js`, rarità «Set», `setClasse`): Valoroso (guanti, stivali, cintura); Sapiente (guanti, cappello, tunica leggera con +1 mod. Vigore); Penitente (*Mazzafrusto del Penitente* d6 contundente +2, mantello, focus +2); Pellegrino (focus +2, anello, collana). `Oggetti.SET_CLASSE`, `Oggetti.pezziSet`. Attributi degli oggetti ricalcolati da capo in `indossa`.
- **2 pezzi**: *Slancio*, *Mente lucida* (`cdBonus`), *Carne domata* (`riduciTick`), *Passo del pellegrino*. **3 pezzi** (per scontro, rapida): *Grido del valoroso*, *Lampo di intuizione*, *Fede incrollabile*, *Radice che resta*.
- **Vesti** (armatura `veste` = leggera, campo `classi`, mai il Guerriero): 6 esempi ⚠ da approvare (Tonaca, Paramenti, Veste runica, Cappa di viaggio, Veste feticcio, Abito dello spirito).
- `prova.html`: pezzi, vesti, arma e focus del set, pulsanti dei poteri a 3 pezzi; il cervello li usa. Non fatto: cadute dei pezzi dal seme, limiti di classe, vesti casuali nel bottino.

## 8. Misure dei boss (giocatore automatico)
`strumenti/misure_prova.js` (`N=400`, `SET_CLASSE=1`). Condizioni: livello del boss (sovrano contro il 5), arma +1/+2/+3/+3, via di Guendalina, set della storia, 2 elisir rari per famiglia, 2 pozioni. La copia del 21/11 rifà le medie del 15/11. Errore ±3.

| % vittorie (media) | Ettore | Enea | Dafne | Atena | Sovrano |
|---|---|---|---|---|---|
| Copia del 21/11 | 97 | 87 | 89 | 74 | 63 |
| Oggi, senza set di classe | 96 | 85 | 89 | 73 | 62 |
| Oggi, con il set di classe a 3 pezzi | 99 | 87 | 90 | 75 | 63 |

- Poteri senza caratteristica: Realtà Enea 70 → 62, Atena 75 → 64, sovrano 75 → 66; Illusione Ettore 91 → 84, Atena 62 → 53, sovrano 20 → 15; le altre non cambiano.
- Set di classe: qualche punto (Berserker Atena 57 → 65, Realtà Enea 62 → 70, Illusione Ettore 84 → 95); Monaco e Sciamano quasi fermi; tre set insieme non spostano le medie (il tetto di due poteri di set per ora non serve).
- Da osservare: Paladino contro Atena (32-38), Illusione contro il sovrano (13-20), Legno contro Dafne (59-68), Funghi contro il sovrano (40); Ossa sempre vincente. Corretto anche: l'arma del set non compariva nel menu della sala.

## 9. Vuoti e agguato nel motore (in `gioco.html` dal pomeriggio: sezione 12)
- `js/nemici.js`: `FASCE_VUOTI`, `ARCHETIPI` (sei), `CACCE` (otto); `crea("vuoto:<fascia>:<archetipo>")`, `crea("caccia:<id>")`. Poteri per fascia come `vuoti.md`; cacce élite con *Colpo feroce* e *Colpo furioso*. Campi `vuoto`, `maledetto`, `agguato` (Percezione / Intuizione), `furtivita` (⚠ = il suo attacco), `pe`.
- Ingredienti nuovi: `scopre`, `allaSpalle`, `malusPoi`, `seMancato`, `togliRapida`, `applicaPoiAggrava`, `tipoDanno`; in `scontro.js` `bonusColpire`, `ultimoMancato`, `rapidaPersa`.
- **Prova dell'agguato** (`Nemici.provaAgguato`): d20 + abilità contro d20 + Furtività. Riuscita: −2 CA al vuoto nel primo round. Fallita: il vuoto agisce per primo (con *Colpo alle spalle* +2) e il giocatore ha −2 CA. `auto` per Elmo del Cacciatore di notti e Anello del Mastino. Nella sala: Percezione = Mente + livello, **Intuizione = Spirito + livello** (assunzione).
- `prova.html`: 30 vuoti e 8 cacce nella lista, agguato negli scontri a mano e nella simulazione, «Agguati di fila» (1-3, senza riposo). `strumenti/misure_vuoti.js` (`FILA=2`). Test: `nemici.test.js` 26/26.

**Misure (300 scontri, giocatore al livello fascia + 1, con l'agguato):** obiettivo 85-90%.

| Fascia | 1 agguato | 2 di fila |
|---|---|---|
| 0 | 87-99 (Carica 87) | 59-89 |
| 1 | 91-99 | 69-93 |
| 2 | 96-100 | 81-96 |
| 3 | 98-100 | 93-100 |
| 4 | 98-100 | 89-100 |

- Fasce 0-1 vicine all'obiettivo con due agguati di fila; **fasce 3-4 troppo facili** (proposta da decidere: alzare salute o danno delle fasce 3-4).
- Cacce (senza agguato; media, minimo): Gualtiero 74 (Legno 38), Fiammetta 78 (Illusione 60), Baldassarre 82 (Illusione 18, resiste allo psichico), Ottilia 93, Brunilde 97, Ysolde 98, Corvino 89 (Paladino 62), Ezechiele 99: le ★ sono più dure delle ★★★.

## 10. Documenti allineati il 22/11 (sul PC, `docs/`)
`riscrittura_meccaniche.md` (poteri senza tiro nella sezione Colpi e nelle tabelle, rinomi, agguato e *Primo passo* nel gruppo 6, Verga nella matrice), `riepilogo_riscrittura.md`, `schema_classi.md`, `classi_manuale.html`, `nemici_manuale.html`, `oggetti_per_rarita.md`, `oggetti_manuale.html`, `armeria_aldo.md`, `punto_della_situazione.md`; copiati in `docs/` anche `decisioni_21_novembre.md` e questo file. **Le copie del progetto di questi documenti grandi sono più vecchie di quelle sul PC** (il PC ha anche gli aggiornamenti del 20-21/11): da caricare nel progetto dal PC.

## 11. Resta (prossima sessione)
Vuoti in `gioco.html` (testi IT/EN, agguato, bottino con tetto 8, diari); Enea, Dafne, Atena e sovrano in `gioco.html`; pulizia del vecchio motore e dati di prova dei test browser; gesso e quaderno negli enigmi; cadute dei pezzi dei set. Da decidere: fasce 3-4 dei vuoti, Furtività dei vuoti, Intuizione nella sala, vesti di esempio, Incubo.

## 12. Pomeriggio: vuoti negli agguati di `gioco.html`
Solo con il motore nuovo (`pg.motore === 2`); il ramo vecchio (goblin, orchi, i cinque avventurieri, dopo il bronzo) resta com'era.
- **Agguati fin dall'inizio**, stesse percentuali col fermaglio appuntato o nascosto. **Fascia dal fermaglio:** nessuno 0, bronzo 1, argento 2, oro 3, platino 4.
- **I vuoti con nome** (diari 5-12 e 17-24) escono una volta ciascuno, con nome sulla scheda e una frase d'apertura per archetipo (testi provvisori IT/EN); finiti, vuoti senza nome.
- **Prova di agguato** all'inizio dello scontro (`Nemici.provaAgguato`): Percezione o Intuizione secondo l'archetipo, contro la Furtività del vuoto; riga «Agguato» nel diario e nel log dello scontro.
- **Niente resa.** **Vittoria:** PE della fascia; diario nello zaino (nota rileggibile); per fascia equipaggiamento base, Non comune +1 e 1-2 erbe (achillea o eufrasia). Rispetta 8 posti di scorta, due armi e 10 materiali: il resto resta sul corpo, con un messaggio.
- **Manca:** Raro e pergamena (generatore del loot), pezzo 2 del set di classe e diari dal seme (seme di partita), ritratto del vuoto, cacce come vuoti élite.
- **Decisioni di Francesco:** Ruggero resta Trappolista; scrivere altri diari (fatti 17-24 in `diari_vuoti.md`, **approvati** da Francesco); inglese di Claude va bene se è naturale.
- **Test:** `tests/vuoti.browser.js` 8/8 (aggiunto a `test:browser`); motore verde; lint 0 errori; inventario 11/11, esterni 5/5. `cacce.browser.js` 2/4 per l'avviso del personaggio vecchio (già noto: dati dei test senza `motore: 2`).

## 13. Pomeriggio: le cacce di Aldo come vuoti élite
Francesco approva i diari 17-24. Poi, solo col motore nuovo:
- **Le otto prede sono i vuoti élite del motore** (`crea("caccia:<id>")`): Gualtiero, Fiammetta, Baldassarre, Ottilia, Brunilde, Ysolde, Corvino, Ezechiele, con salute +50%, +1 CA, +1 attacco, *Colpo feroce* e *Colpo furioso* (`vuoti.md` sez. 5). Prima combattevano come nemici generici, senza poteri.
- **`js/cacce.js`**: nomi, presentazioni, «arma e armatura» (testi provvisori IT/EN) e diari 1-4 e 13-16 (IT approvati, inglese di Claude) sopra i vecchi testi; i nomi valgono anche per il vecchio motore. Aldo: «si è fatto vedere un vuoto: <nome>».
- **Nota di Aldo e studio della preda ★★★** prendono vulnerabilità, resistenze, tipo di danno e stato dal motore (archetipo), non più dalle vecchie liste (Ombra, Luce, Illusione…).
- **Vittoria:** trofeo come prima (premio = regalo di Aldo), più il diario della preda e risorse (1-2 erbe), niente equipaggiamento. ⚠ Mancano la pergamena di fuoco sacro di Ysolde e la pergamena garantita del platino (aspettano le pergamene).
- **Test:** `tests/vuoti.browser.js` 9/9 (caccia di Gualtiero; studio di Brunilde); motore verde; lint 0 errori. Caccia di Ottilia giocata intera nel browser, senza errori.

## 14. Sera: Enea nel gioco (solo motore nuovo; scelta A di Francesco: tutto il percorso, testi mancanti in bozza)
Prima non c'era: il cimitero era solo un passaggio. Ora (`gioco.html`, modulo «ENEA»):
- **Caccia d'argento** dalla bacheca (livello 3, dopo il bronzo): pulsante «Accetta», Aldo dà la missione **q5 «La Preda del Cimitero»** (riquadro Missioni).
- **Cimitero:** Enea scava; arrivo, poche battute (chiede il nome e lo ripete), «Impugno l'arma». Con la spada del Retaggio in pugno, lo sdegno (solo dialogo; Persuasione CD 13 per spiegarsi). Con Enea al cimitero niente incontri casuali.
- **Scontro** col motore (`Nemici.BOSS.enea`): ascia e poi maglio, annunci, intervalli, le tombe lo rialzano una volta. Niente fuga. Sconfitto: non si muore, risveglio nella sala della caccia (pena e ferita come con Ettore), al ritorno Enea combatte subito.
- **Seconda caduta → rivelazione:** gentile (tomba di Guendalina, poi una domanda per compagno: racconti del dopo) o brusca (una riga, tutti e tre i luoghi). Poi **lo finisci** (Giuramento del Rettore, Raro +2, due mani, contundente, con il testo di Francesco) o **lo risparmi** (lascia il campo, il cimitero torna senza di lui). In tutti e due i casi il fermaglio d'argento.
- **Aldo:** con Enea morto, silenzio freddo; vivo, «uno scarto». Fermaglio d'argento, una scelta alle rastrelliere, udienza d'argento.
- **Foresta:** dopo la rivelazione, nei settori indicati (Darius nord, Caius ovest, Magnus est) si cerca con Sopravvivenza CD 10 (gentile) o 13 (brusco, un tentativo al giorno); anche dopo uno scontro nel settore. Scudo di Darius (+2 CA), Spaccatoro di Caius (1d6 contundente +2), Calzari del Viandante (per ora solo da leggere: il gioco non ha lo slot degli stivali). Il testo dell'oggetto (il prima, di Francesco) compare quando lo trovi.
- **Scheda del nemico:** per i guardiani del motore nuovo mostra la fase in corso e i suoi poteri (prima «Nessuno»; vale anche per Ettore).
- **Non ancora:** poteri degli oggetti di Enea (il gioco non ha i poteri degli oggetti), faccia d'ascia del Giuramento, Bilancia (si salva `usate.enea_tono`), risposta di Guendalina («Chiedi al ragazzo»), cose da risparmiato.
- **Testi provvisori di Claude** da riscrivere: elenco in `storia_enea.md`, «Nel gioco (22/11)».
- **Test:** `tests/enea.browser.js` 6/6 (in `test:browser`); vuoti 9/9, inventario 11/11, esterni 5/5 (aggiornato: Enea risparmiato non resta al cimitero), motore verde, lint 0 errori. Scontro vero giocato nel browser fino alla rivelazione, senza errori.


## 15. Sera: Dafne nel gioco e il segno 📖 sui testi da riscrivere
**Il segno 📖 (richiesta di Francesco):** i testi provvisori nel gioco cominciano con «📖 » invece di «da rivedere». In `gioco.html` c'è `bozza(oggetto, chiaviDaSaltare)`, che mette il segno alla prima riga di ogni elenco di testo; la scrittura a macchina non spezza l'emoji e il riconoscimento del parlato («…») lo ignora. Segnati: Enea (tranne i testi di Francesco), aperture e vittorie dei vuoti, intro delle cacce-vuoto (`js/cacce.js`), Aldo (`AL_TUTTI`, dialoghi della casa), fiducia e guardiano del figlio, scena della serra, 30 righe singole `/* PROVVISORIO */`, Dafne.
**Ancora senza segno** (grandi sezioni provvisorie, da decidere se segnarle tutte): caccia di Aldo/giardino/cappella/cripta (`CACCIA2`), diari di Adele, nodi del sistema di dialogo, primo piano (`P1_TUTTI`), esterni (`ESTERNI`), sussurri, scelta della via.

**Dafne (solo motore nuovo):**
- **Missione q6** «La Preda della Foresta», dalla bacheca (livello 4, dopo l'argento).
- **Incontro:** con q6 attiva Dafne attacca a vista in qualunque settore della foresta (niente incontri casuali né caccia comune lì finché c'è lei). Stato in `usate.dafne`: scontro → rivincita → caduta → morta.
- **Apertura:** Furtività del giocatore contro 2d20 (il migliore) + 6 (⚠ come nella sala di prova; il pareggio va a lei). Riuscita: scovata (fase dello stocco, −2 CA, agisci per primo). Fallita: è nascosta e agisce per prima.
- **Fase nascosta:** pulsante «Cerco Dafne (Percezione)» nella barra (o scrivendo «cerco»), CD 12, è l'azione del turno.
- **Stacco:** il corno chiama il mastino, che diventa il bersaglio; Dafne aspetta in riserva. Finisce quando il mastino cade, sparisce o passano 3 turni; Dafne torna con la salute recuperata (motore).
- **Sconfitta:** non si muore, risveglio nella sala della caccia (pena e ferita come Enea); nella foresta lei ti ritrova. Niente fuga.
- **A 0:** parla; il giocatore sceglie Gentile o Minaccioso (`usate.dafne_tono`); lei risponde e muore (niente risparmio, 15/11).
- **Bottino:** Stocco di Dafne (1d10 + 3, perforante, una mano; il potere *Doppia stoccata* non c'è ancora nel gioco, come per il Giuramento), Corno del Signore (reliquia) con la visione di Francesco (senza la cornice della fitta, nessun 📖), fermaglio d'oro.
- **Aldo:** riceve il fermaglio, vede il corno e lo lascia al personaggio; dice che i boschi ora sono muti (cieco per le ★★★, già nel codice dal grado del fermaglio). Una scelta alle rastrelliere, poi l'udienza d'oro.
- **Non fatto:** il *Lascito di Dafne* (pergamena) aspetta le pergamene nel gioco.
- **Testi provvisori di Claude (tutti con 📖):** accettazione di Aldo, arrivo e ritorno nella foresta, Furtività riuscita/fallita, fine dello stacco, sconfitta e Aldo, caduta, le sue parole, i due toni e le risposte, la morte, intro e chiusura della visione, Aldo con il fermaglio, vittoria.
- **Test:** `tests/dafne.browser.js` 7/7; enea 6/6, vuoti 9/9, inventario 11/11, esterni 5/5; motore e lint verdi.

## 16. Sera: 📖 ovunque, prima pulizia del vecchio motore, tutto su GitHub
**📖 su tutte le parti provvisorie** (Francesco non ricorda quali siano sue: le rivedrà): `CACCIA2` intero (caccia di Aldo, giardino, cappella, cripta, diari di Adele), primo piano (`P1_TUTTI`), esterni (`ESTERNI`), più 29 righe `/* PROVVISORIO */` (atrio, accampamento, torcia, porta-gabbia, spada del Retaggio, Guendalina brusca/accetta/rimanda, blasone, cripta furtiva, Ettore furtivo). Nelle frasi a caso (fitte, porta-gabbia) il segno è su tutte. ⚠ I testi inglesi delle righe singole non hanno il segno. Esclusi i dialoghi di Guendalina che non erano segnati come provvisori e le etichette della scelta della via. `bozza` ora tocca solo oggetti semplici (non RegExp, Set, Map).

**Prima pulizia del codice vecchio** (`gioco.html`, −527 righe). I personaggi del vecchio motore sono bloccati dall'avviso «Personaggio da ricreare», quindi il ramo vecchio dello scontro non gira più:
- `turnoPgScontro`, `fineAzionePgScontro`, `turnoNemScontro`, `gestisciScontro`, `barraScontro`, `disegnaTecniche`, `disegnaIncantesimi`: resta solo la strada del motore nuovo.
- Tolte 25 funzioni rimaste senza chiamate (cercate con un'analisi del codice, a ripetizione): attacco, soffio, prove degli stati e preghiere dei nemici vecchi, tecniche e incantesimi in scontro, ticchettii degli stati vecchi, `guardiani`, `candele`, `apriSceltaVia` (la via si sceglie dalla scheda dei poteri), Ettore vecchio (gamba, «già vista»).
- **Resta da fare** (prossimi passi): le librerie del vecchio motore (`js/magia.js`, `tecniche.js`, `combattimento.js`, `magia_combattimento.js`, `sciamano.js`) e i loro test; i rami `motoreNuovo()` nel resto della scheda e nell'avvio dello scontro; i test browser del vecchio motore (spostati in `npm run test:browser:vecchio`, fuori dal giro su GitHub).

**GitHub (con l'OK di Francesco):** caricato tutto il lavoro dal 20/11 (codice, test, documenti, strumenti, immagini usate dal gioco: `dafne.png`, `enea_combat.webp`, mastini aggiornati). **Non caricati:** `strumenti/chiave_firebase.json`, `archivio/`, `Claude outputs/`, log, `mockup_creazione.html`, i ritratti grandi non ancora usati (`immagini/PIPPIT_PG/`, i PNG dei nemici tranne Dafne, scene nuove non collegate). Il giro di verifiche su GitHub ora lancia fumo, esterni, inventario, vuoti, Enea e Dafne.
**Verifiche sulla copia completa (con immagini e librerie):** motore verde, lint 0 errori, coerenza allineata, fumo 0 problemi gravi, esterni 5/5, inventario 11/11, vuoti 9/9, Enea 6/6, Dafne 7/7; giro di tutte le 24 stanze e scontri veri (cinghiale, Dafne con stacco) senza errori.
