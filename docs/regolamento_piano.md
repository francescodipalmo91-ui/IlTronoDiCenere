# Regolamento Base / Facoltative — piano di lavoro (bozza del 20/11/2026)

Obiettivo (decisione del tester, `riscrittura_meccaniche.md` sez. 1): un regolamento **corto**, poche regole Base e un capitolo **Regole facoltative**, che dica solo ciò che il codice fa davvero. Il testo si scrive **dopo domenica 22/11**, quando il codice è allineato (`punto_della_situazione.md`, sez. 4): scriverlo ora vorrebbe dire correggerlo di nuovo domenica.

Stato attuale: `regolamento.html` (111 KB) è ancora sul **vecchio sistema** (furia, natura, mana, fede, Bilancia, Tecniche e Incantesimi preparati, Guerriero con la spada corta, Arcanista di Sangue, Monaco di Negromanzia). È generato da script, in italiano e inglese. Non si ripulisce: si riscrive.

## 1. Cosa tiene, cosa si riscrive, cosa sparisce

| Capitolo attuale | Destino | Nota |
|---|---|---|
| Come funzionano le prove, le quattro caratteristiche, quale abilità usare, colore delle tendine, regole delle prove, chiedere una prova, enigmi | **Tiene (Base)**, da controllare | Correggere le due contraddizioni del tester: osservare è gratis, *forzare* i sensi con una prova può costare |
| Riposo, peso dei giorni, pozioni, quando si muore, cosa consuma la mente, modalità | **Riscrive (Base)** | Riposo: cura tutta la salute fisica, 2 punti mentali. Morte: facile/difficile, contro il sovrano si muore (riscrittura 8e) |
| Caratteristica di classe, razze, classi, salute e risorse al livello 1, cosa guadagni a ogni livello | **Riscrive (Base)** | Scala 2-1-1 … 3-3-3, tre privilegi, via al livello 2, livelli fino a 10 senza poteri nuovi |
| Chi agisce per primo, la tua azione, colpire e ferire, CA, durata e cumulo | **Riscrive (Base)** | Azione standard + rapida, niente reazioni, applica/aggrava, TS per stato, caratteristica una volta per attacco |
| Elisir, avversari temibili, vulnerabilità e resistenze, abilità dei nemici, fuga | **Riscrive (Base)** | Elisir di stato (6 famiglie), mappa ✓ ✗ ⛔ ·, annuncio dei colpi con icone. «Abilità dei nemici» diventa i poteri dei nemici |
| Cacce comuni, agguati, il fermaglio | **Riscrive (Base)** | Vuoti, prova contrapposta Percezione/Intuizione, agguati dall'inizio, cacce di Aldo |
| Le tre classi di esempio (spada corta, Arcanista di Sangue, Monaco di Negromanzia) | **Sparisce** | Esempi vecchi; sostituire con un solo esempio di creazione a 5 passi |
| Per ogni classe: risorsa e recupero, preparazione, tecniche/incantesimi, tratto di classe, Bilancia | **Sparisce** | Sostituiti da poteri a volontà / per scontro / giornalieri e privilegi (un solo capitolo comune + `classi_manuale.html`) |

## 2. Proposta di divisione Base / Facoltative

**Base** (tutti giocano così): prove e abilità, azioni del turno, colpire e ferire, stati e TS, poteri per classe, riposo che cura il corpo, 2 punti mentali, pozioni ed elisir, agguati, cacce, guardiani, equipaggiamento e set.

**Facoltative, già decise** (`riscrittura_meccaniche.md`, sez. 2):
1. **Fame**: il riposo non cura il corpo; curano le razioni (1/4 della salute massima ciascuna; Guendalina ne cucina 1d4 al giorno, tetto 10; contatore Dispensa).
2. **Peso dei giorni**: ogni 10 giorni −1 alla salute mentale massima (il contatore dei giorni resta visibile per tutti).

**Facoltative, da decidere con Francesco** (proposte mie, non ancora scelte):
- A. **Pozioni limitate:** al massimo 2 per scontro. È il «correttivo pronto» già annotato per la pozione come azione rapida; oggi non c'è. Meglio tenerlo come facoltativa solo se le misure di domenica mostrano che serve.
- B. **Modalità difficile** (morte permanente): oggi è una modalità, non una regola facoltativa. Proposta: lasciarla dov'è («Modalità»), senza spostarla.
- C. Nessuna altra: ogni regola in più da tenere dietro le quinte appesantisce il regolamento, che nasce per snellire.

## 3. Ordine di lavoro (dopo domenica)

1. Elenco delle **discrepanze** regolamento ↔ codice, riga per riga (già previsto: intervento 3 del tester).
2. Scheletro in italiano: Base in circa 8 capitoli, poi «Regole facoltative» (Fame, Peso dei giorni).
3. Controllo con il codice; poi traduzione in inglese (la struttura del file è bilingue).
4. Il capitolo «Classi» resta un rimando a `classi_manuale.html`, non un duplicato (regola «un solo posto per ogni fatto»).

## 4. Da chiedere a Francesco

- Confermare la divisione Base/Facoltative del par. 2, soprattutto A e B.
- Il regolamento deve restare **bilingue** (italiano e inglese) come oggi, o per ora solo italiano?
