# Bilanciamento — progressione, nemici, stati, armi e bottino (v2, 28 ottobre 2026)

Documento di lavoro. Le sezioni segnate **DECISO** sono state concordate in chat il 28 ottobre; quelle segnate **PROPOSTA** sono di Claude e vanno discusse. Niente codice ancora.
Sostituisce la `proposta_ettore_scontro.md` del 27 ottobre (Ettore ora è tarato sul livello 2).

**Stato del lavoro (punto 1, tutto ciò che viene prima del bronzo):** passi 1-5 chiusi. Il 28 ottobre notte il codice è stato allineato (sezione 10, «Nel codice dal 28 ottobre»). Restano per i punti successivi: agguati (servono i cinque avventurieri), pedinamento (serve il secondo piano), poteri d'arma (serve il bottino dei guardiani).

---

## 1. Progressione (DECISO)

### Soglie di livello (PE cumulativi)

| Livello | 2 | 3 | 4 | 5 |
|---|---|---|---|---|
| PE | 300 | 1000 | 2400 | 4400 |

(Prima 2200 e 4000: alzate il 28 ottobre sera per far posto agli agguati.)

Il livello massimo del personaggio resta 5. **Il sovrano è di livello 6**: supera il tetto per costruzione, e la differenza la colmano reliquie del Retaggio e fede nuziale.

### Salute del personaggio (DECISO il 28 ottobre)
- **Livello 1:** salute = **10 + massimo del dado vita + mod Vigore**; mente = **10 + massimo del dado vita + mod Spirito**. Il dado non si tira più in creazione.
- **Crescita a ogni livello: valore fisso**, metà del dado + 1 + mod (Guerriero d10 +6, Sciamano d8 +5, Arcanista e Monaco d6 +4, più il modificatore). Niente tiro: un 1 al livello 2 non deve rovinare la partita.
- **Personaggi di prova (livello 1):**

| Prova | Salute | Mente | CA |
|---|---|---|---|
| Guerriero nano (Vigore 17, armatura pesante e scudo) | 23 | 21 | 15 |
| Sciamano elfo (Agilità 16, armatura media) | 19 | 19 | 15 |
| Arcanista gnomo (Mente 16, armatura leggera) | 16 | 17 | 13 |
| Monaco gnomo (Spirito 17, armatura media) | 16 | 19 | 14 |

- **Simulazione contro un mastino della cantina** (20.000 scontri, probabilità di sconfitta; pessimista per gli incantatori, perché non conta Scudo, cure e Detonazione):

| Soffio | Guerriero | Sciamano | Arcanista | Monaco |
|---|---|---|---|---|
| 2d6, una volta, Ustionato da 1 (vecchio) | 1% | 3% | 21% | 19% |
| 2d6, una volta, Ustionato 1d4 × 3 | 4% | 9% | 34% | 32% |
| 2d6, due volte, Ustionato 1d4 × 3 | 8% | 13% | 43% | 42% |

  Conclusione: il secondo Soffio è quello che uccide. Per questo i mastini del piano terra hanno 3 PA (un Soffio e una Presa), vedi sezione 2.

### PE per nemico

| Nemico | PE |
|---|---|
| Animali normali (fuori casa e foresta) | 50-75 (cinghiale 75) |
| Animali infernali (fuori casa e foresta) | 75-100 (cinghiale 100) |
| Mastini comuni | 150 |
| Mastini boss (a due teste, della soglia di Adele) | 300 |
| Cacce comuni di Aldo | grado 1: 100, grado 2: 150, grado 3: 200 |
| Guardiani | bronzo 400, argento 550, oro 700, platino 900 |
| Avventurieri degli agguati | 100, solo la prima volta che si sconfigge ciascuno |
| Missioni di Guendalina (scaletta, figli, blasone) | 50 ciascuna |
| Fiducia del figlio maggiore (libro aperto) | 50 |
| Reliquie del Retaggio, lacrime, diari e appunti | 0: la ricompensa è la soglia, la storia o la conoscenza |

### PE della foresta a scalare

Gli animali restano sempre allo stesso livello: col tempo diventano facili e servono solo per gli ingredienti.

| Livello del personaggio | Animali normali | Animali infernali |
|---|---|---|
| 1-2 | Pieni | Pieni |
| 3 | Metà | Pieni |
| 4 | Nessuno | Metà |
| 5 | Nessuno | Nessuno |

Incontro al **40%** a ogni ingresso nella foresta (60:40 tra normali e infernali) e al **20%** fuori casa (giardino, cimitero, cappella; 67:33, dopo il bronzo 50:25:25 con gli agguati), **senza limite per riposo**. Il limite vero è l'esperienza: oltre il livello 3 nessuna delle due zone fa più crescere. Zone e fauna nella sezione 4.

### Cacce comuni
Aldo ne affida **due dopo ogni fermaglio** (bronzo, argento, oro): sei in tutto, una per preda. La caccia al guardiano successivo arriva solo dopo averle completate. Gli oggetti speciali (2, 4, 6 cacce) si sbloccano alla fine di ogni intervallo.

### Percorso atteso

| Momento | PE | Livello |
|---|---|---|
| 2 mastini + 4 animali scoperti | ~550 | 2 |
| **Ettore** | 950 | 2 |
| Cacce di grado 1 + 3 mastini dei corridoi + 1 agguato | 1700 | 3 |
| **Enea** | 2250 | 3 |
| Cacce di grado 2 + mastino a due teste + 1 agguato | 2950 | 4 |
| **Dafne** | 3650 | 4 |
| Cacce di grado 3 + mastino della soglia + 1 agguato | 4450 | 5 |
| **Atena**, poi il **sovrano** | 5350 | 5 |

Le missioni (200 PE in tutto, quasi tutte nella prima metà) non sono nella tabella: portano a circa 650 prima di Ettore e circa 2300 prima di Enea, sempre sotto le soglie. Il percorso conta 3 agguati su 5. Chi li incontra tutti presto può anticipare un livello di poco: è un margine accettabile.

**Livelli attesi dei nemici:** Ettore 2, Enea 3, Dafne 4, Atena 5, sovrano 6.

### Guardiani più deboli di chi si è allenato (DECISO)
Per ogni livello del personaggio oltre quello atteso, il guardiano prende **+5 salute, +1 per colpire, +1 punto abilità**, fino a un massimo di +2 livelli. Chi si allena resta avvantaggiato, ma lo scontro non diventa una formalità.

---

## 2. Regole comuni dei nemici

### Punti abilità (DECISO il 28 ottobre)
- Ogni nemico ha una riserva **fissa per tipologia** di **punti abilità (PA)**, come la risorsa del personaggio. Finiti i PA, solo attacchi normali.
- La riserva torna piena a ogni nuovo scontro.
- **Ogni abilità che infligge uno stato costa PA**, per tutti i nemici: niente più stati gratuiti (sparisce l'Indebolito gratis sul critico del cinghiale).
- **Oggetti di recupero:** un nemico può avere un oggetto che gli restituisce PA. Se lo usa, l'oggetto non compare più tra i tesori.
- **Nella scheda del nemico:** una barra dei PA, come l'ira del personaggio. Svuotarla diventa una strategia: quando uno stato scade, il nemico lo rimette, ma ogni volta paga.
- **Quando usa le abilità:** se ha i PA e lo stato non è già attivo sul personaggio; altrimenti attacca. Così non spreca punti.
- **Elisir di protezione:** il nemico non lo «vede». Il primo tentativo va sprecato (paga i PA, lo stato non attecchisce), poi smette di provarci per quello stato. Prepararsi ripaga due volte.

**Costi standard**

| Abilità | PA |
|---|---|
| Senza stato (Presa) | 1 |
| Con uno stato base | 2 |
| Con uno stato potenziato o con due stati | 3 |
| Controllo forte (Bloccato, Stordito), una volta per scontro | 4 |

**PA fissi**

| Tipologia | Livello | PA |
|---|---|---|
| Animali che fuggono / che combattono | 1 | 0 / 2 |
| Infernali grado 1 / 2 / 3 (i gruppi di grado 3 condividono i PA come la salute) | 2 / 3 / 4 | 3 / 4 / 5 |
| Mastini comuni (piano terra / secondo piano) | 2 / 3 | **3** / 5 |
| Avventurieri degli agguati | come il personaggio | 6 |
| Mastini boss (a due teste / della soglia) | 4 / 5 | 8 |
| Guardiani (bronzo / argento / oro / platino) | 2 / 3 / 4 / 5 | 8 / 9 / 10 / 12 |
| Sovrano | 6 | 14 |

### Tiri salvezza del personaggio (PROPOSTA)
d20 + mod attributo contro **CD = 8 + mod del nemico + livello del nemico**, la stessa formula che usa il personaggio. Esempio: vipera di livello 1 con mod +2 → CD 11, come già nel gioco.

### Danno dei nemici (DECISO il 28 ottobre)
- **Arma magica:** dado + mod Vigore + livello dell'arma. Per i nemici il livello dell'arma è il loro livello. È la stessa regola delle armi del personaggio.
- **Tutto il resto** (armi comuni, morsi, artigli, becchi): dado + mod Vigore.
- **Bottino coerente:** un'arma magica lasciata da un nemico conserva il suo numero. La spada di Ettore resta 1d6 + 2 nelle mani del personaggio.
- Se il guardiano è rafforzato perché il personaggio è oltre il livello atteso, il bonus dell'arma non cambia.
- Un PNG che impugna un'arma magica ne usa il danno, non il potere: i poteri d'arma sono solo del giocatore.

### Controlli forti (DECISO)
- I nemici comuni **non stordiscono né bloccano mai** il personaggio.
- Guardiani e mastini boss: al massimo **una abilità di controllo forte per scontro** (Stordito o Bloccato, 1 turno), sempre con tiro salvezza, a 4 PA.
- Un nemico non infligge lo stesso stato se è già attivo.

---

## 2b. Morte, fuga e modalità (DECISO il 28 ottobre)

### Quando si muore
- **Contro i guardiani non si muore:** Aldo ti riporta indietro «perché crede in te». Resta la scena nella sala della caccia («Questa dimora rifiuta di lasciar morire i suoi ospiti prima del dovuto…»), **solo per i guardiani**, con le ferite della mente già decise.
- **Contro animali, prede delle cacce comuni, avventurieri degli agguati e mastini si muore** quando la salute fisica arriva a 0. **Eccezione (passo 4):** i mastini di Aldo nella sala da ballo non uccidono, è la sua prova (lo schiocco di dita prima del colpo finale); il mastino della cantina e i mastini dei corridoi sì. Aldo non salva chi cade contro una preda qualunque: non era degno.
- **Morire vuol dire diventare parte di Casa Vespera**, lo stesso esito della mente a zero: la casa ti prende il corpo o la mente.
- **Da togliere nel gioco:** il risveglio nella sala della caccia dopo una caccia comune persa e il risveglio in cucina dopo una sconfitta nella foresta («Vi hanno riportato dal bosco»).

### Modalità
| | Facile | Difficile |
|---|---|---|
| Dopo la morte (fisica o mentale) | Si riparte dall'ultimo salvataggio | Morte permanente |
| Salvataggi | Liberi | Uno solo, automatico, cancellato alla morte |

- Si sceglie in **creazione del personaggio**. Si può scendere da difficile a facile, mai il contrario.

### Fuga
- Possibile contro animali, prede delle cacce e avventurieri; **mai contro i guardiani**.
- Prova di **Atletica o Acrobazia** contro **CD 10 + livello del nemico**.
- Riuscita: torni nella stanza da cui eri arrivato. La preda di una caccia resta: la caccia non è fallita.
- Fallita: il nemico ti colpisce con vantaggio e lo scontro continua.

---

## 3. Stati alterati (DECISO il 28 ottobre)

### Stati comuni a giocatore e PNG
- I sei stati qui sotto valgono **allo stesso modo per il personaggio e per i nemici**: stesso effetto, stessa durata. Sul lato dei nemici il gioco li ha già quasi tutti (Sanguinamento e Avvelenato 1d4, Emorragia e Tossina 1d6).
- **Durata in turni**, non per tutto lo scontro: gli stati che tolgono salute durano **3 turni**, i malus **2 turni**.
- **Finiscono con lo scontro**, anche se restano turni. Sostituisce la regola precedente («per tutto lo scontro e fino alla prossima azione scritta»).
- **Letali** durante lo scontro, tutti.

| Stato | Effetto | Durata | Origine tipica | Cura |
|---|---|---|---|---|
| Ustionato | **1d4** a inizio turno (potenziato 1d6) | 3 turni | Fuoco degli infernali e dei mastini | Balsamo di grasso di cinghiale |
| Sanguinamento | **1d4** a inizio turno (potenziato, Emorragia: 1d6) | 3 turni | Lame (Ettore, avventurieri) | **Impiastro di achillea** (erba) |
| Avvelenato | **1d4** a inizio turno (potenziato, Tossina: 1d6). Prima era −2 a prove e TS | 3 turni | Vipera, Dafne | Tintura di fiele di vipera |
| Indebolito | −2 per colpire | 2 turni | Cinghiale | Infuso di velluto di cervo |
| Impaurito | −2 CA | 2 turni | Ululati, Atena | Sale di zanna di lupo (prima zampa di coniglio) |
| Accecato | 2d20 per colpire, tieni il peggiore (solo in combattimento, 29 ottobre) | 2 turni | Cenere degli infernali | **Collirio di eufrasia** (erba) |

**Chi può infliggere la versione potenziata (1d6):** le abilità del giocatore, i guardiani e i mastini boss. I nemici comuni mai.

### Cumulo
- Lo **stesso stato** riapplicato rinnova la durata, non si somma.
- **Stati diversi** si sommano: Sanguinamento più Ustionato fanno 2d4 a turno (il caso di Ettore con le braci).
- La **versione potenziata** sostituisce la base.

### Immunità (distinguono i tre stati che tolgono salute)
- Infernali, mastini e sovrano: **immuni a Ustionato** (sono fatti di fuoco).
- Creature di cenere: **immuni a Sanguinamento** (non hanno sangue).
- Animali normali e umani: nessuna immunità.
- Restano le immunità al veleno già decise (Dafne, sovrano).
- Per chi infligge gli stati, scegliere quello giusto diventa tattica; per chi li subisce, la differenza la fa l'elisir.

### Impaurito (pedinamento)
- Variante di Impaurito che nasce **fuori dallo scontro**, dal pedinamento fallito dei mastini (sezione 8).
- **Effetto:** −2 CA e **1d4 danni mentali, letali, a ogni stanza in cui entri**. Chi crede di essere seguito non trova pace.
- **Durata:** **2 stanze** o fino al riposo al camino.
- **Cura:** il sale di zanna di lupo; bevuto prima, protegge. Un elisir con un uso anche fuori dallo scontro.
- **Se inizia uno scontro:** contro un guardiano la variante sparisce, lo scontro parte pulito; contro un mastino o un agguato diventa un Impaurito normale per 2 turni e il danno mentale si ferma.
- Peso: al secondo piano (livello 3, circa 28-31 punti di mente) due stanze fanno circa 5 danni, il 17% della mente.

### Elisir (DECISO il 28 ottobre)
- Ogni elisir riguarda **uno stato**: lo **cura** se è già attivo, oppure, bevuto prima, **protegge** da quello stato per lo scontro successivo.
- **Un solo elisir di protezione attivo per volta:** prepararsi è una scelta (contro Dafne il fiele, contro il re l'infuso o il collirio).
- **Borsa degli elisir:** al massimo **2 per stato**, concentrati compresi (confermato il 29 ottobre).
- **Fonti:** Guendalina li prepara con gli ingredienti (fonte principale); Aldo li dà con una **nuova rastrelliera «Elisir»**: a ogni caccia completata, «scegli due» tra tutti gli elisir sbloccati, oltre alla scelta consueta.
- Il giocatore deve girare per la casa preparato al meglio: gli elisir diventano parte della strategia, non un rimedio dopo il danno.

### Erbe (DECISO il 28 ottobre)
- La ricerca nel sottobosco che già riempie la borsa dei veleni (Sopravvivenza o Indagare, CD 12, una volta al giorno) dà anche **un'erba**, achillea o eufrasia: **finché non le hai trovate entrambe, l'erba è sempre una nuova**; dopo, a caso. Al secondo giorno il giocatore ha tutte e due le ricette prima di Ettore.
- Un'erba, un elisir. Come per le parti animali, la prima erba portata a Guendalina sblocca una domanda e la ricetta.

### Controlli forti
Solo guardiani e mastini boss: Bloccato o Stordito, salti 1 turno. Non si curano: durano un turno.

---

## 3b. Stati corrotti dei guardiani (DECISO il 28 ottobre)

Tre stati che oggi infligge solo il giocatore tornano contro di lui in versione corrotta.

| Stato del giocatore | Cosa fa oggi | Versione corrotta | Chi la usa |
|---|---|---|---|
| Esposto | Gli attacchi contro il bersaglio fanno critico con un numero in meno, mai sotto 18 | **Preda segnata** | Dafne |
| Sigillo | Marchio dell'Arcanista, fino a 3; esplode con la Detonazione | **Sigilli di zaffiro** | Atena |
| Incrinatura | −1 CA per carica, fino a 3, per tutto lo scontro | Da definire | Libera (forse il sovrano, con l'alabarda). Enea non la usa |

- **Preda segnata** (Dafne, 3 PA): per 2 turni Dafne fa critico con 19-20 contro di te, e ogni suo critico ti infligge **Avvelenato potenziato** (1d6). Il fiele bevuto prima protegge dal veleno, non dal critico.
- **Sigilli di zaffiro** (Atena): le sue abilità incidono sigilli sul personaggio, al massimo 2. Con 2 sigilli usa **«La lacrima chiama»** (4 PA, una volta): consuma i sigilli, TS Spirito → **Bloccato 1** e 1d4 danni mentali per sigillo, non letali (i guardiani non uccidono). **I sigilli si spezzano se colpisci Atena con un critico.** È il controllo forte di Atena legato alla lacrima; lo zaffiro gela come quello di Adele.
- **Incrinatura corrotta:** non più per Enea (29 ottobre, notte): lui combatte con il ritmo, senza stato firma. Resta disponibile, eventualmente per il sovrano. Atena, essendo l'ultima, può essere rivista in seguito.

---

## 4. Stati per nemico (DECISO il 28 ottobre, costi standard)

Regola decisa: **i normali feriscono il corpo** (Sanguinamento, Avvelenato, Indebolito), **gli infernali portano fuoco e cenere** (Ustionato, Accecato, Impaurito).

### Dove si incontrano (DECISO il 28 ottobre, passo 4)
- **Dentro casa solo i mastini.** Dentro si rischia la mente (pedinamento, prove, diari), fuori il corpo (animali, agguati).
- **Fuori casa** è tutto ciò che non è foresta: giardino, cimitero, cappella. Ratto, corvo, lupo e le loro tre versioni infernali. Incontro al **20%** a ogni ingresso (si attraversano per andare nella foresta).
- **Foresta:** lupo, cinghiale, cervo, vipera e le loro quattro versioni infernali. Incontro al **40%** a ogni ingresso.
- **Mai incontri casuali né agguati dove il fuoco è caldo:** la cripta ha il braciere, e lo scontro della cripta è solo quello con Ettore, che non è un incontro casuale.
- **Un solo tiro per ingresso:** fuori casa, se dopo il bronzo esce l'agguato, prende il posto dell'animale. Mai due scontri di fila.
- **Giardino con una caccia aperta:** al posto dell'incontro casuale si fa avanti la preda di Aldo.
- **I gruppi (branco, sciame) sono solo nelle cacce di Aldo.** Le cacce restano come sono; gli incontri casuali sono gli animali del luogo.
- **Gradi per livello:** livello 1 solo normali e infernali di grado 1, dal livello 2 anche il grado 2 (al livello 1 il grado 2 darebbe il 28-32% di sconfitta all'Arcanista).
- **PE:** la stessa tabella a scalare per tutte e due le zone.
- Il coniglio esce dal gioco: la sua cura (Impaurito) passa al lupo.

### Statistiche fisse (DECISO il 28 ottobre, passo 4)
Niente più attributi tirati a caso a ogni incontro (oggi 10 + 1d6 su Vigore e Agilità) né salute con il dado vita: ogni tipologia ha i suoi numeri. Criterio: **sotto il 10% di sconfitta per ogni classe** al livello a cui il nemico compare (simulazione sui personaggi di prova, senza fuga né elisir).

| Animale | Dove | Liv. | Salute | CA | Attacco | Danno | PA e abilità | Parte | Sconfitta peggiore |
|---|---|---|---|---|---|---|---|---|---|
| Ratto | fuori | 1 | 5 | 10 | +0 | 1d3 | 2: Morso sporco (2), TS Vigore → Avvelenato | — | 0,3% |
| Corvo | fuori | 1 | 4 | 12 | +1 | 1d3 | 2: Becco (2), TS Vigore → Sanguinamento | — | 0,4% |
| Lupo | fuori, foresta | 1 | 10 | 12 | +2 | 1d6 | 2: Morso (2), TS Vigore → Sanguinamento | Zanna di lupo | 9% |
| Cinghiale selvatico | foresta | 1 | 12 | 11 | +2 | 1d6 + 1 | 2: Zannata (2), TS Vigore CD 10 → Indebolito (l'Indebolito gratis sul critico è tolto) | Grasso (2) | 8% |
| Cervo | foresta | 1 | come oggi | | | | 0: fugge al secondo turno | Velluto | — |
| Vipera dei pini | foresta | 1 | 5 | 13 | +3 | 1d3 | 2: Morso velenoso (2), TS Vigore CD 11 → Avvelenato | Fiele | 2% |
| Ratto di cenere | fuori | 2 (gr. 1) | 8 | 10 | +1 | 1d4 + 1 | 3: Nube di cenere (2), TS Agilità CD 11 → Accecato. Accecato già dal grado 1: si impara contro un nemico debole | Occhio di cenere | 0,6% |
| Corvo di brace | fuori | 2 (gr. 1) | 8 | 11 | +2 | 1d4 + 1 | 3: Becco ardente (2), TS Vigore → Ustionato | Piuma di brace | 4% |
| Vipera di brace | foresta | 2 (gr. 1) | 8 | 13 | +3 | 1d4 + 1 | 3: Morso ardente (2), TS Vigore → Ustionato | Fiele di brace | 9% |
| Cervo di cenere | foresta | 2 (gr. 1) | 12 | 11 | +2 | 1d6 | 3: Scrollata di cenere (2), TS Agilità → Accecato. Combatte, non fugge | Velluto di cenere | 5% |
| Cinghiale di brace | foresta | 3 (gr. 2) | 14 | 11 | +2 | 1d6 + 1 | 4: Carica rovente (3), TS Vigore CD 11 → Ustionato, sul critico anche Indebolito | Grasso di brace | 10% (al livello 2) |
| Lupo di cenere | fuori, foresta | 3 (gr. 2) | 14 | 12 | +3 | 1d6 + 1 | 4: Ululato (2), TS Spirito → Impaurito; Morso di cenere (2), TS Agilità → Accecato | Zanna di cenere | 7% (al livello 2) |

Il lupo normale è stato abbassato: con 11 di salute e 1d6 + 1 dava il 15% di sconfitta all'Arcanista.

### Elisir comuni e rari (DECISO il 29 ottobre, sostituisce i concentrati)
- **Comuni** (parti degli animali normali ed erbe): curano lo stato attivo, niente protezione.
- **Rari** (la sola parte infernale): bevuti prima o durante uno scontro, rendono immuni a quello stato per tutto lo scontro (e curano, se lo stato è attivo). La protezione «fino al riposo» è tolta.
- Restano: 2 per stato nella borsa, rari compresi; Aldo concede solo i comuni; un solo raro di protezione attivo fuori dallo scontro.
- Nomi dei rari: Balsamo di brace, Tintura di brace, Infuso di cenere, Sale di cenere, Impiastro di brace, Collirio di cenere. Nel codice dal 29 ottobre.

#### Il modello precedente (concentrati), per memoria
- Anche gli infernali lasciano una parte. Ognuna si abbina alla ricetta del suo doppio normale (per ratto e corvo, alle erbe legate allo stato che il normale infligge) e dà il **concentrato** di quell'elisir:

| Parte infernale | Concentrato |
|---|---|
| Grasso di brace (cinghiale di brace) | Balsamo concentrato → Ustionato |
| Fiele di brace (vipera di brace) | Tintura concentrata → Avvelenato |
| Velluto di cenere (cervo di cenere) | Infuso concentrato → Indebolito |
| Zanna di cenere (lupo di cenere) | Sale concentrato → Impaurito |
| Occhio di cenere (ratto di cenere) | Collirio concentrato → Accecato |
| Piuma di brace (corvo di brace) | Impiastro concentrato → Sanguinamento |

- **Ricetta:** ingrediente base + parte infernale. **Effetto:** bevuto durante lo scontro cura lo stato e rende immuni per il resto dello scontro; bevuto prima protegge **fino al prossimo riposo** invece che per uno scontro. Conta come l'unico elisir di protezione attivo.
- **Borsa:** i concentrati rientrano nel tetto del loro stato (2 in tutto per stato). Aldo, nella rastrelliera Elisir, dà solo quelli base.
- Come per le altre parti, la prima portata a Guendalina sblocca una domanda e la ricetta.
- **Alternativa di Francesco (29 ottobre, da decidere):** chiamarli elisir **comuni** e **rari**. I comuni, con risorse accessibili, *interrompono* lo stato già applicato; i rari, con risorse scarse, *proteggono* per tutto l'incontro. Differenza con il modello attuale: i comuni non proteggerebbero più se bevuti prima (vedi punto della situazione).
- Senso: dal livello 3-4, quando gli animali non danno più PE, gli infernali restano utili per i concentrati, e prepararsi a Dafne, Atena e al sovrano ha una forma vera.

### Infernali delle cacce di Aldo

**Cacce contro altri avventurieri (29 ottobre, da progettare):** le cacce di Aldo comprenderanno anche avventurieri entrati da altri ingressi, quindi servono nemici nuovi: orchi, goblin e le razze già nel gioco (umani, elfi, nani, gnomi). Da decidere se si aggiungono alle sei cacce comuni (e allora cambiano PE e percorso atteso) o ne sostituiscono una parte. Non vanno confusi con i cinque avventurieri degli agguati, che sono personaggi scritti.

| Preda | Grado | PA | Abilità |
|---|---|---|---|
| Ratto di cenere | 1 | 3 | Come sopra |
| Corvo di brace | 1 | 3 | Come sopra |
| Cinghiale di brace | 2 | 4 | Come sopra |
| Lupo di cenere | 2 | 4 | Come sopra |
| Branco di segugi di cenere (26 salute, CA 11, +3, 2 × 1d4 + 1; 15% al livello 4) | 3 | 5 | Ululato del branco (2): TS Spirito → Impaurito; Assalto (2): Ustionato |
| Sciame di corvi di brace (22 salute, CA 12, +2, 3 × 1d4; 13% al livello 4) | 3 | 5 | Nuvola di becchi (2): TS Agilità → Accecato; Piume ardenti (2): Ustionato |

### Mastini

| Mastino | Livello | PA | Abilità |
|---|---|---|---|
| Comune | 2 (3 al secondo piano) | 3 (5) | Presa (1), Soffio Infuocato (2) → Ustionato. Al piano terra un Soffio e una Presa; al secondo piano due Soffi. **Piano terra (DECISO, passo 4):** Vigore 12, Agilità 12, salute 13, CA 10, +2, morso 1d4 + 1, Soffio **1d6** + Ustionato (TS Agilità CD 11): sconfitta peggiore 8% al livello 1. Al secondo piano il Soffio torna 2d6 |
| A due teste (anticamera del trono) | 4 | 8 | Ululato doppio (3): TS Spirito → Impaurito e Indebolito; Doppia Presa (4, una volta): TS Vigore → Bloccato 1; Soffio (2) |
| Della soglia di Adele (fuori dalla camera) | 5 | 8 | Soffio di cenere (2): TS Agilità → Accecato; Presa (1); Ringhio della soglia (4, una volta): TS Spirito → Stordito 1 |

### Guardiani

| Guardiano | Stato firma | Note |
|---|---|---|
| Ettore | Sanguinamento (coltello), Ustionato (braci) | Sezione 5 |
| Enea | Nessuno: combatte con il ritmo | 9 PA. **Mani nude:** 2 colpi da 1d4 + Vigore; Spinta (1): il tuo prossimo attacco ha svantaggio. **Maglio:** 1 colpo da 1d10 + Vigore; Colpo caricato (3): annunciato, danno doppio il turno dopo, mai due cariche di fila (difendersi dimezza, colpirlo durante la carica lo fa andare a vuoto); dopo la prima interruzione carica in guardia (+2 CA); Finta (2): annuncia la carica e colpisce subito ignorando la difesa, Intuizione gratuita per smascherarla. Mani nude o maglio secondo fermaglio di bronzo e spada del Retaggio; maglio sotto il 50% se scopre il fermaglio. Risurrezione una volta (1d4 + livello, senza PA), niente cura al 50%. Sdegno del cavaliere con la spada: +1 per colpire e +5 salute, tolto da Socialità. Salute, CA e attacco da fare. **Verifica nel codice (29 notte):** non esiste un'azione di difesa comune a tutti; le difese sono tecniche o incantesimi scelti (Parata, scudo, Specchio di Rune, Barriera Cinetica, Respingere, Santuario). **Deciso (30 ottobre):** azione contestuale **«Mi difendo»**, solo durante la carica di Enea: consuma l'azione e dimezza il colpo. Non è un'azione generale (cambierebbe gli altri scontri, Ettore compreso). Interrompere vale con qualsiasi colpo a segno, incantesimi d'attacco compresi. Chi ha una difesa vera (Parata, scudo, Barriera…) la usa al posto di «Mi difendo» con il suo beneficio pieno. Numeri proposti in sezione 5c |
| Dafne | Avvelenato | Primo turno: tiro d'arco con vantaggio (gratis, senza stato). Poi lancia: Lancia avvelenata (2): TS Vigore → Avvelenato. Preda segnata (3, sezione 3b). Trappola (4, una volta): TS Agilità → Bloccato 1. Oggetto di recupero: Sorso di resina (+3 PA) |
| Atena | Impaurito | Presenza (2): TS Spirito → Impaurito. Sigilli di zaffiro e «La lacrima chiama» (4, una volta): sezione 3b |
| Sovrano | Indebolito, Accecato, Impaurito (fuoco freddo) | Sezione 5b |

---

## 5. Ettore, livello 2 (DECISO il 28 ottobre, passo 3)

| Voce | Valore |
|---|---|
| Attributi | **Vigore 12 (+1)** (prima 14: la gamba spezzata gli ha tolto forza nei colpi), Agilità 13 (+1), Mente 12 (+1), Spirito 8 (−1) |
| Salute | 30 fissa |
| CA | 13 (11 con il consiglio di Aldo sulla gamba) |
| Attacco | **+3**, spada sbreccata **1d6 + 1 (Vigore) + 2 (arma)**. Nel bottino resta 1d6 + 2 |
| PA | 8 |
| CD dei suoi effetti | **11** (8 + 1 + 2) |
| Oggetto di recupero | Nessuno: non gli è rimasto niente |

**Abilità**
- **Il conteggio** (gratis): conta i suoi attacchi; all'undicesimo sferra «il dodicesimo colpo», con vantaggio e +1d8. Ogni colpo che lo porta sotto metà salute gli fa perdere il conto (riparte da uno), e così ogni stato che lo frastorna o lo stordisce. Dalla rivincita riparte da tre.
- **Fendente sporco** (2 PA): attacco normale; se colpisce, TS Vigore → Sanguinamento.
- **Colpo basso** (3 PA, una volta per scontro): quando il personaggio usa un'azione difensiva che **consuma l'azione** (Specchio di Rune, Barriera Cinetica, Respingere, parate e tecniche di difesa dello scudo), Ettore lo aggira col coltello: 1d4 senza tiro e Sanguinamento. **Scudo e Scudo della Fede non lo fanno scattare** (DECISO): con loro l'Arcanista scendeva dal 45% al 15% di vittorie.
- **Le braci** (3 PA, una volta, in cripta): la prima volta che scende sotto metà salute calcia parte delle braci, **al posto del suo attacco**: TS Agilità → 1d4 e Ustionato. **Il braciere resta acceso** per i riposi.
- **La gamba**: un tuo critico gli fa perdere il turno successivo (vale anche se è un boss).
- **Il dodicesimo colpo** non scatta quasi mai (lo scontro dura 5-7 turni): resta, perché punisce chi temporeggia ed è il cuore del personaggio.

Vulnerabilità (DECISO il 29 ottobre): **luce e contundente**, +1 dado. Nel codice: armi contundenti (anche la torcia e il bastone) e incantesimi di Luce. Effetto rispetto a forza: Arcanista con il consiglio di Aldo da circa 61% a 54% di vittorie (il bastone resta contundente), Monaco in su.

**Inizio dello scontro (29 ottobre):** Ettore è seduto con la schiena contro un sarcofago, la spada appoggiata accanto al giaciglio. Se il personaggio scende in silenzio e **lo attacca**, Ettore perde il primo turno a recuperare l'arma (oltre a lasciare al personaggio la prima mossa). Se il personaggio **parla**, Ettore scatta in piedi allarmato e va a prendere la spada prima del dialogo. Ritratto da nemico: `immagini/nemici/Ettore.webp`.

**Simulazione al livello 2** (12.000 scontri per caso; salute nuova, stati nuovi, incantatori senza Scudo; percentuale di vittorie):

| Personaggio | Senza consiglio | Con consiglio | Con consiglio e achillea |
|---|---|---|---|
| Guerriero (spada) | 85% | 92% | ~95% |
| Guerriero (martello) | 89% | 93% | ~96% |
| Sciamano | 67% | 73% | ~78% |
| Arcanista | 35% → ~47% con il + mod | 45% → ~58% | ~55% → ~68% |
| Monaco | 47% → ~58% con il + mod | 58% → ~70% | ~68% → ~80% |

Prima (Vigore 14, +4, 1d6 + 4) l'Arcanista vinceva il 34% con il consiglio. Abbassare Ettore di più renderebbe il Guerriero una formalità senza alzare gli incantatori: la distanza era una questione di classe, risolta con la regola qui sotto.

### Incantesimi d'attacco + modificatore (DECISO il 28 ottobre)
Gli incantesimi che fanno un attacco magico aggiungono al danno il **modificatore dell'attributo** (Mente per l'Arcanista, Spirito per il Monaco), come le armi aggiungono il Vigore. Il dado vita degli incantatori resta d6. La simulazione degli incantatori è grezza (niente Bilancia, Crepuscolo, Stasi): i numeri reali saranno un po' più alti.

---

## 5c. Enea, livello 3 (PROPOSTA del 30 ottobre, da confermare)

| Voce | Valore |
|---|---|
| Attributi | Vigore 12 (+1), Agilità 10 (0), Mente 12 (+1), Spirito 14 (+2) |
| Salute | 36 fissa; risurrezione una volta con 1d4 + 3 |
| CA | 13 (armatura pesante consunta) |
| Attacco | +4 |
| Mani nude | 2 colpi da **1d4**, senza Vigore: combatte per misurarti, non per ucciderti |
| Maglio | **1d8 + 1 + 3** (arma magica: dado + Vigore + livello). Colpo caricato: doppi dadi, 2d8 + 4 |
| PA | 9 |
| CD dei suoi effetti | 12 (8 + 1 + 3) |
| Vulnerabilità | **forza, luce e veleno** (DECISO il 30 ottobre): la luce del dio che l'ha abbandonato; il veleno perché un cavaliere in armatura pesante si prepara alle lame, non al veleno. Veleno = un dado in più a ogni turno di Avvelenato. Niente perforante: il Guerriero passava dall'75% all'87%, e solo il ramo delle perforanti |
| Sdegno del cavaliere | solo **+1 per colpire** (con anche +5 salute toglieva 14 punti di vittorie) |

**Simulazione** (modello semplificato, 12.000 scontri per caso, senza tecniche né Santuario: circa 5 punti più pessimista del gioco; tarato su Ettore, che nel modello dà G 87, S 68, A 51, M 69):

| Caso | Guerriero | Sciamano | Arcanista | Monaco |
|---|---|---|---|---|
| Maglio da subito | 75% | 47% | 51% | 44% |
| Fermaglio nascosto (pugni fino al 50%) | 81% | 55% | 60% | 53% |
| Sdegno (spada, Socialità fallita) | 69% | 40% | 46% | 37% |
| Senza la luce tra le vulnerabilità | 72% | 43% | 48% | **15%** |
| Senza risurrezione (salute 38) | 84% | 59% | 68% | 60% |

**Cosa dice la simulazione:**
- Maglio 1d10 + 2 + 3 era ingestibile (Monaco 5-10%): sceso a 1d8 + 4.
- Senza luce il Monaco crolla (15%): Ettore lo aiutava con la luce, Enea no.
- Con i pugni a 1d4 + Vigore nascondere il fermaglio non cambiava nulla (74 contro 73): ora vale circa 7 punti, e la scelta conta.
- La **risurrezione** è la meccanica che pesa di più (circa 12-17 punti). Se lo scontro risulta troppo duro, si toglie da lì (1d4 invece di 1d4 + 3).
- **Finta e adattamento** pesano 1-3 punti: sono tattica e lettura del nemico, non un muro di numeri.
- **Correzione (30 ottobre):** il modello non contava i veleni dello Sciamano. Con il veleno che ha già, lo Sciamano è intorno al **64%** (non 47%); con la vulnerabilità al veleno 66-69%.
- **Risurrezione più morbida (1d4 invece di 1d4 + 3):** non cambia quasi nulla (Monaco 43 → 44%). Pesa il fatto che si rialzi e impugni il maglio, non quanta salute riprende.
- **Monaco (44% nel modello):** il modello è grezzo (niente cure, niente Santuario). Non si corregge su questi numeri: **si prova nella sala di prova** con le classi vere.

**Nella sala di prova dal 30 ottobre** (`tutorial.html?prova`, nemico «Enea»): tutto quanto sopra, con le caselle «fermaglio indossato», «spada impugnata», «Socialità riuscita», la mossa forzabile (casuale, carica, finta, Spinta) e il bonus di Intuizione del personaggio. Nella sala anche Ettore ha le sue vulnerabilità (contundente e luce). Non ancora nel gioco: manca la scena del cimitero. La Percezione di Enea per scoprire il fermaglio nascosto non è nella sala (lo scopre solo sotto il 50%).

## 5b. Il sovrano (DECISO il 28 ottobre, numeri da provare)

**Immagine:** sala del trono in luce azzurra, vetrate, re in armatura con crepe luminose e alabarda (immagine scelta da Francesco; **il logo «Pippit AI» va tolto** prima di usarla).

**Chi è in scontro**
- **Da cavaliere a boia:** la spada del Retaggio è rimasta nell'armatura dell'atrio (o nelle mani del personaggio). Il re impugna un'**alabarda**: l'arma di chi difende la casa.
- **Corona fittizia di cenere e braci azzurre:** la vera corona è la reliquia del sottotetto. Se il personaggio la porta nello zaino, il re indossa una corona falsa e quella vera ce l'ha chi lo affronta.
- **Fuoco freddo:** le fiamme della sala sono azzurre, come il fuoco consumato dove non si riposa. La sala resta in palette Cenere. Il suo fuoco **gela**, non brucia: niente Ustionato.
- **Aggancio con il diario di platino:** lo zaffiro di Adele gela e la stanza si raffredda. Stesso azzurro, stesso freddo: il potere di Adele e la rabbia del re potrebbero avere la stessa fonte. Rende la scelta finale più ambigua.

**Statistiche indicative** (da tarare sulla salute di un personaggio di livello 5)
| Voce | Valore |
|---|---|
| Livello | 6 |
| Salute | 70 |
| CA | 16 |
| Attacco | +8 |
| Alabarda (magica, due mani) | 1d12 + mod Vigore + 6 (media circa 16, critico circa 23) |
| PA | 14 |
| Resistenze | Ombra a metà danni; vulnerabile (+1 dado) sotto la soglia del Retaggio |

**Tre fasi, in base alla salute** (costi standard del 28 ottobre)
| Fase | Salute | Scena | Abilità |
|---|---|---|---|
| 1 · Il Signore | 100-50% | Scende dal trono, alabarda in pugno | **Fiamma fredda** (2 PA): TS Vigore → Indebolito. **Nebbia di cenere** (2 PA): TS Agilità → Accecato |
| 2 · La casa lo nutre | 50-25% | Le crepe dell'armatura si allargano, il fuoco freddo divampa; recupera 4 PA (gratis, una volta) | Si aggiunge **Collera del Signore** (3 PA): TS Spirito → Impaurito, +2 per colpire per 2 turni |
| 3 · Il Trono di Cenere | sotto 25% | L'ultima rabbia | Si aggiunge **Il trono chiama** (4 PA, una volta, controllo forte): TS Spirito → Bloccato 1 |

**Varianti per finale**
| Finale | Il re | Il personaggio | Fase 3 |
|---|---|---|---|
| Positivo | Rafforzato: +20% salute, +1 per colpire | **Fede nuziale:** una volta per scontro il re la riconosce e salta il turno | Non c'è: al 25% scena di dialogo, la fede, Adele interviene col collier, il re si arrende |
| A (Aldo) | Indebolito: −25% salute, 10 PA, niente controllo forte | Set Vespera, se indossato | Senza «Il trono chiama»: difende la casa ma non ha più forza |
| B (per sé) | Normale | **Il fuoco di Adele:** una volta per scontro, 3d6 senza tiro, costa 1d4 punti mentali | Completa: «Il trono chiama» annuncia il finale |

**Reliquie e fasi:** le fasi sono fisse, la soglia di vulnerabilità no. Senza reliquie la vulnerabilità arriva con la fase 3; ogni reliquia la anticipa e accorcia lo scontro; con tutte e cinque è vulnerabile dall'inizio.

**Rischio:** con circa 45-55 di salute al livello 5, il re abbatte il personaggio in circa 3 colpi. Nei finali A e B c'è chi lo affronta senza spada: va provato nella sala di prova prima di fissare i numeri.

---

## 6. Armi (DECISO)

| Origine | Una mano | Due mani | Poteri |
|---|---|---|---|
| Creazione | 1d6 | 1d8 | No |
| Cacce comuni di Aldo | 1d6 + livello | 1d8 + livello | No |
| Cacce dei guardiani (bottino) | 1d6 + livello | 1d8 + livello | Sì |
| Set Vespera e spada del Retaggio | 1d10 + livello | 1d12 + livello | Sì |

- **"+livello" è fissato al ritrovamento**: un'arma trovata al livello 2 resta +2 per sempre.
- **Set Vespera:** Aldo offre due armi (una mano 1d10, due mani 1d12); il personaggio ne prende una, l'altra resta nella teca. L'arma arriva con l'**oro** e prende il posto degli **stivali**. Si lega come gli altri pezzi: chi la impugna non può più impugnare la spada del Retaggio, che però conta ancora nello zaino per la soglia.
- **Spada del Retaggio:** 1d10 + livello. La differenza con l'arma Vespera sta nei poteri.
- **Runa sull'Arma:** se il dado è già 1d12, +2 al danno.

### Vulnerabilità e danni senza tiro (DECISO il 29 ottobre)
La vulnerabilità (+1 dado) vale anche per i danni senza tiro (Spinta, Onda d'Urto), **solo sul dado base**: non sui dadi dei Sigilli (Detonazione, Implosione, Singolarità). Nel codice dal 29 ottobre.

### Poteri (DECISO il 28 ottobre, esempi PROPOSTA)
- **Costo (DECISO):** anche i poteri d'arma consumano la risorsa del personaggio, **al 50% dell'abilità equivalente**. Uno stato base (2) costa **1 punto**. Il potere scatta da solo; senza punti non scatta.
- **Bottino dei guardiani:** poteri che scattano **sul critico o una volta per scontro**, legati al tipo d'arma. Esempi: taglio, Sanguinamento sul critico; contundente, Incrinatura 1; perforante, Esposto 1; bastone degli incantatori, 1 Sigillo in più o la Bilancia spostata di 1.
- **Arma Vespera:** potere **sempre attivo** che si adatta a classe e via (è Aldo che veste il guardiano su misura). Per gli incantatori diventa un bastone che potenzia gli incantesimi.
- **Spada del Retaggio:** potere **fisso** legato alla storia, più forte contro guardiani e sovrano che contro il resto. Così la scelta servo/erede ha anche un senso meccanico: l'arma di Aldo rende di più ovunque, quella del re nello scontro che conta.
- Da verificare: le classi che oggi non possono usare una spada. Se l'Arcanista non può impugnarla, la spada del Retaggio per lui è solo una reliquia nello zaino.

### Armature e scudi (DECISO il 29 ottobre)
"+livello" sulla CA sarebbe troppo (+5 CA al livello 5). Propongo:
- Cacce comuni: armature +1 CA (gradi 1-2), +2 (grado 3); scudi +1.
- Bottino dei guardiani: +1 o +2 con un potere.
- Set Vespera: abilità al posto dei bonus (già deciso).

---

## 7. Bottino (DECISO la struttura, PROPOSTA i contenuti)

### Due livelli
1. **Garantito:** l'equipaggiamento del guardiano, solo se ucciso. Ciò che vedi nello scontro è ciò che trovi.
2. **Oggetto magico:** Ettore 60%, Enea 70%, Dafne 80%, Atena 90%. Se il guardiano viene risparmiato la percentuale resta: te lo lascia come segno di rispetto.

**Contro il ricaricamento:** il tiro si fa **all'inizio della partita** e si salva con i dati del salvataggio. Ricaricare non cambia l'esito.

### Slot
Il set Vespera copre mantello, guanti, elmo, arma e corazza. Il bottino magico va soprattutto negli **slot liberi** (anelli, amuleti, cinture e, ora, **stivali**), così non diventa inutile quando il set si lega.

### Scala del potere
**rastrelliere < speciali di Aldo < bottino dei guardiani < set Vespera e spada del Retaggio**

### Esempi per grado (da rivedere)

| Grado | Esempi |
|---|---|
| Bronzo | Talismano di ferro freddo (+2 ai TS contro Ustionato); Fascia del cacciatore (+1 a Percezione e Sopravvivenza); Fiala di brace (consumabile: cura 2d4) |
| Argento | Stivali del passo felpato (+2 Furtività); Amuleto della veglia (+1 CA contro il primo attacco di ogni scontro) |
| Oro | Cintura del segugio (+2 risorsa massima); Anello della resina (una volta per scontro, ignora uno stato appena subito) |
| Platino | Amuleto della quiete (+2 salute mentale massima); Stivali della lunga caccia (+1 CA e immunità a Bloccato) |

### Bottino garantito per guardiano

| Guardiano | Se ucciso | Oggetto magico |
|---|---|---|
| Ettore | Spada sbreccata di Valdombra (una mano, 1d6 + 2, sul critico Sanguinamento, 1 punto); Coltello delle tacche (Dotazione, 1d4 perforante, senza poteri) | 60%, tabella bronzo |
| Enea | Da definire (il maglio, solo se lo ha impugnato) | 70%, argento |
| Dafne | Lancia da caccia (due mani, 1d8 + 4, potere da definire); l'arco resta descrittivo (il giocatore non usa archi). Se vince la gara: lascia comunque corno, fermaglio e i suoi averi | 80%, oro |
| Atena | Da definire | 90%, platino |

---

## 8. Mastini nei corridoi (DECISO, dettagli PROPOSTA)

- **Regola:** i mastini non entrano dove c'è un membro della famiglia. Il mastino a due teste sta nell'anticamera, fuori dalla sala del trono; quello della **soglia di Adele** sta fuori dalla camera, a guardia.
- **2-3 mastini fissi** nei corridoi del secondo piano, ognuno si affronta una volta.
- **Pedinamento:** entrando in un corridoio, 20% di una frase che fa sentire seguiti (passi, ringhio lontano, odore di bruciato). Prova di **Furtività CD 8**.
  - Riuscita: il mastino perde la traccia.
  - Fallita (DECISO il 28 ottobre): **Impaurito (pedinamento)**, sezione 3: −2 CA e 1d4 danni mentali letali a ogni stanza, per 2 stanze o fino al riposo. Sostituisce l'1d2 mentale e l'Impaurito «fino alla fine del prossimo scontro». Niente scontro, niente PE. Il giocatore deve sapere che in questa storia si muore anche fuori dagli scontri.
  - La frase del pedinamento arriva **prima** della prova, come avviso: chi ha la mente bassa sa che dovrebbe riposare, o bere il sale di zanna di lupo.
  - Così l'evento non diventa una fonte di esperienza e Impaurito ha finalmente un'origine anche prima di Atena.
  - Peso stimato: con mod 0 la prova fallisce il 35% delle volte; al 20% per corridoio è circa un pedinamento fallito ogni 14 ingressi. Una pressione costante, non un salasso.

---

## 8b. Agguati — orchi, goblin e i cinque avventurieri (DECISO il 29 ottobre, nel gioco dal 29 sera)

### Regole
- **Solo fuori casa** (giardino, cimitero, cappella), mai in cripta né nella foresta (terreno di Dafne), **solo dopo il bronzo**.
- **Un solo tiro per ingresso** fuori casa: 20% di incontro; se c'è, **50% animale normale, 25% infernale, 25% agguato**. Prima del bronzo 67:33 tra normali e infernali. Nella foresta 60:40.
- **Due livelli di agguato:** su un agguato, **1 volta su 5** uno dei cinque avventurieri (tra quelli ancora in gioco), altrimenti orchi o goblin (livello 2: goblin; livello 3: metà goblin e metà orchi; **dal livello 4 anche in banda**: metà banda di goblin, un quarto orco, un quarto banda di orchi).
- **Perché attaccano:** sono entrati da altri ingressi della grotta. Aldo ha sussurrato a ognuno che chi è entrato dalla porta principale è la chiave per uscire: è l'anomalia che legge nel personaggio, usata come esca.
- **Orchi e goblin:** ripetibili, PE come gli infernali (goblin 75, orco 100) a scalare con il livello (pieni fino al 3, metà al 4, niente al 5). **Bottino:** un'arma o un'armatura comune; il **15%** delle volte con il bonus delle cacce comuni (+livello sulle armi, +1/+2 sulle armature).
- **I cinque avventurieri:** 100 PE solo la prima volta che li sconfiggi, che tu li uccida o li risparmi.
- **La resa (DECISO il 29 ottobre):** a un terzo della salute l'avventuriero si arrende e scegli tu: ucciderlo o risparmiarlo. Tobia invece prova a fuggire; se la fuga fallisce, scegli lo stesso.
- **Si risparmia una volta sola:** chi risparmi torna una volta, con rancore, **+1 livello**, senza PE, e quella volta combatte fino alla fine. Torna solo dopo un riposo, attraverso il solito «1 agguato su 5».
- **Uccidere chi chiede pietà o tenta di fuggire costa 1 punto mentale, letale:** è la casa che ti cambia e ti reclama. A un punto di mente, finirlo vuol dire diventare parte di Casa Vespera.
- **Testi:** tre frasi per ciascuno (l'agguato, la resa, il ritorno con rancore), scritte da Claude e corrette da Francesco. Bottino garantito se ucciso: il loro pezzo d'equipaggiamento, al livello delle cacce comuni, senza poteri. Vulnerabili all'Ombra.
- **Stati:** gli umani e gli altri popoli feriscono il corpo (Sanguinamento, Avvelenato, Indebolito); gli orchi anche Impaurito (il ruggito).

### Il fermaglio indossato o nascosto (DECISO il 29 ottobre, numeri compresi)
Il fermaglio ha un suo slot e si può togliere, solo fuori dal combattimento (storia, sezione 10b). Dentro la mente, fuori il corpo:
- **Indossato:** +2 alla Furtività del pedinamento (i mastini riconoscono l'odore di Aldo); fuori casa più agguati, perché sei una preda di valore: **45% animale normale, 20% infernale, 35% agguato**.
- **Nascosto:** nessun bonus al pedinamento; fuori casa **55% animale normale, 30% infernale, 15% agguato**.
- Il 20% di incontro a ogni ingresso non cambia. Prima del bronzo il fermaglio non c'è e resta il 67:33.
- **Da controllare:** con il fermaglio sempre indossato, gli agguati del percorso atteso salgono di poco (da 3 a circa 4 su 5). Va bene, ma va visto nella simulazione.

### Statistiche dei cinque (crescono con il personaggio)
Livello = livello del personaggio (minimo 2), +1 al ritorno. **Salute 15 + 3 per livello oltre il 2**, attacco **+3**, arma magica **dado + livello** (Vigore 10), **6 PA**, CD 8 + livello + mod. Simulazione al livello 2-3 (pessimista sugli incantatori): sconfitta peggiore 25-31% per l'Arcanista, sotto il 20% per gli altri. Sono i nemici comuni più pericolosi: si può fuggire e prepararsi con gli elisir.

| Avventuriero | Chi è | Combatte | Abilità (PA) | Bottino se ucciso | Frase |
|---|---|---|---|---|---|
| **Brunilde Mezzaluna** | Nana, minatrice: entrata dal pozzo di una galleria crollata. Brusca, conta i giorni in monete di rame | Ascia a due mani 1d8 + liv; salute −2; CA 13 | Squarcio (2): se colpisce, TS Vigore → Sanguinamento | Ascia di Mezzaluna (due mani) | «Tu hai avuto una porta. Io un pozzo.» |
| **Corrado Vallerossa** | Umano, soldato disertore: crede ancora negli ordini, ora li prende dal vecchio. **È il bronzo di un tempo, battuto e risparmiato da Enea** (storia, sezione 10b): battuta in più se lo incontri prima di Enea, variante dopo | Spada e scudo 1d6 + liv; CA 14 | Colpo di scudo (2): TS Vigore → Indebolito | Scudo di Vallerossa (+1 CA) | «Anche qui qualcuno dà ordini. Io li eseguo.» |
| **Isotta la Biscia** | Elfa, sicaria: seguiva un contratto fin dentro la grotta | Due pugnali, 2 attacchi da **1d4 + metà del livello** (con il livello pieno era troppo forte: Arcanista 37-46% di sconfitta); salute −3; CA 13 | Lama intinta (2): se colpisce, TS Vigore → Avvelenato | Pugnale della Biscia (arma 1d4 + livello, una mano) | «Il vecchio dice che hai la chiave. Fammela vedere.» |
| **Fra' Anselmo** | Umano, monaco itinerante: ha smesso di pregare per uscire. La sua frase fa eco alla fede perduta di Enea (voluto: nei secoli la casa ha tradito molti uomini di fede) | Bastone 1d6 + liv; CA 12 | Anatema (2): TS Spirito → Indebolito · Preghiera (2, una volta): si cura 1d6 + liv | Bastone di Anselmo (due mani) | «Ho pregato per uscire. Mi hanno risposto i cani.» |
| **Tobia Spillo** | Gnomo, trappolaio: ruba più che combattere | Pugnale 1d4 + liv; salute −3; CA 13 | Tagliola (2): al posto dell'attacco, TS Agilità → Sanguinamento · **Sotto un terzo di salute prova a fuggire**: se ci riesce torna più avanti, come se l'avessi risparmiato | Borsa degli attrezzi: piede di porco e corda (Dotazione) | «Non è niente di personale. È che la porta l'hai trovata tu.» |

### Frasi dei cinque (Francesco, 29 ottobre)
Le indicazioni di scena (tra parentesi) diventano narrazione, le battute dialogo. «Medaglione sacro» → «simbolo sacro» (il medaglione è la reliquia del Retaggio); la parolaccia di Tobia resta.

**Brunilde Mezzaluna**
- *Agguato:* «Fermo lì. Sei quello della porta, no? Il vecchio ha detto che la chiave sei tu. Io è una vita che scavo: ora si apre.»
- *Resa:* «Cedo il passo. Tanto è solo questione di tempo prima che sia io a stare davanti.»
- *Ritorno:* «Mi hai lasciata indietro, ma ho recuperato strada. C'è posto solo per uno di noi qui... e hai finito il tuo turno.»

**Corrado Vallerossa**
- *Agguato:* «Alt. Il vecchio vuole che resti qui. E io ubbidisco, è l'unico modo che conosco per campare.»
- *Resa:* (Pianta la spada e si copre dietro lo scudo) «Mi arrendo. Ho già scelto la vita una volta, non cambio idea adesso.»
- *Ritorno:* (Scuote la testa, con lo sguardo basso) «Ci ho pensato a quello che hai fatto per me. Davvero. Ma gli ordini sono catene più pesanti delle tue. Ricominciamo.»

**Isotta la Biscia**
- *Agguato:* (Una voce fredda e vicinissima alle tue spalle) «Non voltarti. Il vecchio dice che hai la chiave. Fammela vedere, e forse ti lascio le mani attaccate ai polsi.»
- *Resa:* (Alza le mani con finta noia, facendo tintinnare le lame prima di mollarle) «D'accordo, hai vinto. Oggi l'aria di questo posto non mi piaceva comunque.»
- *Ritorno:* (Si ricompone con una grazia letale, afferrando di nuovo le lame) «Mi hai lasciata andare. Che errore da principiante. Io i conti non li lascio mai a metà.»

**Fra' Anselmo**
- *Agguato:* «Pace a te, peccatore. Ho passato giorni a pregare per una via d'uscita, e il padrone di questo posto mi ha risposto... indicandomi la tua gola.»
- *Resa:* (Inchina il capo, stringendo il simbolo sacro tra le dita nodose) «La carne è debole. E la mia preghiera di oggi è solo di restare intero.»
- *Ritorno:* (Congiunge le mani in una preghiera silenziosa) «Ho pregato per la tua anima dopo che mi hai risparmiato. Ma il vecchio mi ha ordinato di correggere il mio errore di clemenza.»

**Tobia Spillo**
- *Agguato:* «Ehi, ehi, non guardarmi così, non è personale! È che la porta l'hai trovata tu, e io ne ho trovate solo di chiuse.»
- *Fuga:* «Oh, merda, no! Questo non era nei patti!» (E sparisce di corsa tra le lapidi, facendo scattare un fruscio di ingranaggi)
- *Ritorno:* «Eccomi di nuovo! Ti ho portato un regalino: ho oliato le molle alla tagliola nuova. Questa sì che morde sul serio.»

### Orchi e goblin (ripetibili)

| Nemico | Livello | Salute | CA | Attacco | Danno | PA e abilità | PE | Sconfitta peggiore |
|---|---|---|---|---|---|---|---|---|
| Goblin predone | 2 | 12 | 13 | +2 | pugnale 1d4 + 1 | 3: Lama sporca (2), se colpisce TS Vigore CD 11 → Avvelenato | 75 | 7% al livello 2 |
| Orco razziatore | 3 | 18 | 11 | +4 | ascia 1d8 | 4: Fendente (2), se colpisce TS Vigore CD 12 → Sanguinamento · Ruggito (2), TS Spirito CD 12 → Impaurito | 100 | 14% al livello 3 (senza il Ruggito nella simulazione) |
| Banda di goblin | 4 | 20 | 12 | +2 | 2 attacchi, 1d4 | 4: Lama sporca (2), TS Vigore CD 12 → Avvelenato | 125 | 13,5% al livello 4 (Arcanista, pessimista; le altre classi sotto il 2%) |
| Banda di orchi | 4 | 28 | 10 | +3 | 2 attacchi, 1d6 | 5: Ruggito (2) e Fendente (2), CD 12 | 150 | 15% al livello 4 (Arcanista, pessimista; le altre sotto il 5%) |

**Gruppi (29 ottobre, regole già scritte):** come le prede di grado 3, la banda è una creatura sola: salute e PA condivisi, più attacchi per turno, danni bassi. Compaiono dal livello 4. **Alzate leggermente (Francesco, 29 sera)** e con una scena di gruppo prima degli attacchi di ogni turno («l'orco con la cicatrice si fa avanti; gli altri due guardano divertiti»): si capisce che è un piccolo gruppo. PE pieni fino al livello di riferimento (orco e goblin 3, bande 4), metà al successivo, poi niente.

**Frasi di orchi e goblin (Claude, approvate da Francesco):** due agguati a caso per ciascuno e una frase di sconfitta; per le bande due agguati e una sconfitta scritti sullo stesso tono.

**Nel codice (29 sera):** tutto. Incontro fuori casa dopo il bronzo 50:25:25; 1 agguato su 5 è uno dei cinque ancora in gioco (non uccisi; i risparmiati solo dopo un riposo). Statistiche dei cinque calcolate a ogni scontro dal livello del personaggio. Resa a un terzo della salute dopo la tua azione; Tobia prova a scappare (Atletica o Acrobazia, la migliore, contro CD 10 + il suo livello per afferrarlo). Fra' Anselmo usa la Preghiera sotto metà salute. Vulnerabili all'Ombra anche con gli incantesimi. Bottino: il pezzo dei cinque con il bonus del livello (Ascia da battaglia di Mezzaluna, solo Guerriero come le altre armi «da battaglia»; Scudo di Vallerossa +1; Pugnale della Biscia, ora un'arma 1d4 + livello, una mano (Francesco, 29 sera); Bastone di Anselmo; piede di porco e corda di Tobia); orchi e goblin un'arma, un'armatura o uno scudo permessi alla classe, il 15% delle volte con il bonus. **Armi «+livello»:** il bonus ora conta davvero nel danno (attacchi e tecniche); prima era solo nel nome. Dal 29 sera anche le armi delle rastrelliere di Aldo (comuni e speciali) prendono il livello del personaggio al momento della scelta.

---

## 9. Da decidere
1. ~~Sanguinamento e Accecato come stati nuovi del personaggio~~ → deciso, sezione 3.
2. ~~Statistiche e abilità di Ettore al livello 2~~ → deciso, sezione 5.
3. ~~PA dei nemici e tabella degli stati per nemico~~ → deciso, sezioni 2 e 4.
4. ~~Armature e scudi~~ → deciso: +1/+2.
5. Esempi di bottino per grado e poteri concreti delle armi (il costo è deciso: 50%).
6. Abilità del set Vespera, compresa quella dell'arma; «Passo Silenzioso» era pensata per gli stivali, va spostata o tolta. Resta da definire anche il prezzo del set (mente massima ridotta o follia più vicina).
7. Enea: carattere, stato firma, Incrinatura corrotta e bottino.
8. ~~Borsa degli elisir~~ → confermato: 2 per stato.
9. Elisir comuni e rari (alternativa di Francesco ai concentrati).
10. Cacce contro altri avventurieri: nemici nuovi e posto nel percorso atteso.

## 10. Cosa manca (verifica del 28 ottobre)

**Buchi nel bilanciamento**
1. ~~Agguati degli avventurieri~~ → risolto, sezione 8b. Mancano i cinque caratteri e gli stati firma.
2. ~~PE di missioni e frammenti di diario~~ → risolto: 50 PE per le tre missioni di Guendalina e per la fiducia del figlio maggiore; niente PE per reliquie, lacrime e diari.
3. ~~Il sovrano~~ → deciso, sezione 5b. Restano da tarare i numeri sulla salute di un personaggio di livello 5.
4. ~~Atena: il controllo forte legato alla lacrima~~ → deciso, sezione 3b (Sigilli di zaffiro).
5. ~~Gruppi di grado 3~~ → deciso: PA condivisi, come la salute. Il gruppo è una creatura sola.

**Nel codice dal 28 ottobre (notte)**
- Soglie 300/1000/2400/4400; dado vita al massimo in creazione; crescita fissa a ogni livello; incantesimi d'attacco + mod.
- Sei stati comuni con durate fisse (anche quelli inflitti dal giocatore: `DURATE_COMUNI` in js/combattimento.js), letali, che finiscono con lo scontro; Accecato sul personaggio (2d20, il peggiore); cumulo; immunità delle creature (le creature di cenere non sanguinano, anche sotto i colpi del giocatore).
- Elisir che curano o proteggono, concentrati, borsa a 2 per stato, rastrelliera Elisir (due a caccia), erbe nel sottobosco (prima le nuove), zanna di lupo al posto della zampa di coniglio.
- PA e costi standard per tutti i nemici (Soffio 2, Presa 1, abilità con stato 2-3), statistiche fisse, fauna nuova e zone (fuori casa 20%, foresta 40% senza limite), PE a scalare, mastino della cantina senza ricomparsa e con Soffio 1d6.
- Ettore con Vigore 12 e CD 11; Colpo basso senza i due Scudi.
- Morte (diventi parte di Casa Vespera), modalità facile/difficile, salvataggio automatico in difficile, fuga.
- Test: `tests/bilanciamento.browser.js` (15 casi) più gli aggiornamenti dei test esistenti.

**Non ancora nel codice:** agguati, Impaurito (pedinamento), poteri d'arma e il loro costo, stati corrotti di Dafne e Atena (i guardiani non ci sono ancora).

**Da allineare nel codice (elenco di partenza)**
6. **Soglie di livello:** nel gioco ci sono ancora quelle vecchie (`SOGLIE_PE` in js/regole.js: 500 / 1500 / 3000 / 5000).
7. **Mastini della cantina:** oggi 150 PE, caratteristiche tirate a caso (10 + 1d4) e 30% di ricomparsa. Le regole nuove dicono mastini fissi, nessuna ricomparsa, 3 PA (Soffio 2, Presa 1).
8. **Ettore:** nel codice Vigore 14 diventa 12 (attacco +3, spada 1d6 + 3, CD 11 al posto di 12 in `salvezzaSangue` e nelle braci); togliere `scudo` e `scudo_fede` da `DIFESE_INC` (Colpo basso); il Sanguinamento del personaggio (`tickSangue`) oggi non scende sotto 1: diventa letale, e contro un guardiano lo 0 è una sconfitta.
8b. **Incantesimi d'attacco:** aggiungere il modificatore dell'attributo al danno (js/magia_combattimento.js) e aggiornare regolamento e descrizioni.
9. **Foresta e fuori casa:** foresta da 30% e un incontro per riposo a 40% senza limite; nuovi incontri fuori casa al 20% (giardino, cimitero, cappella; mai in cripta); PE a scalare; un solo tiro per ingresso con l'agguato; preda della caccia al posto dell'incontro in giardino.
9b. **Fauna:** statistiche fisse (sezione 4) al posto di `10 + tira(6)` e del dado vita in `avviaScontro`; nuovi ratto, corvo e lupo normali, vipera di brace e cervo di cenere; coniglio tolto; zanna di lupo al posto della zampa di coniglio nel sale; parti infernali e concentrati; mastino della cantina senza ricomparsa (`cantina_ricompare`) e con Soffio 1d6; mastini letali tranne quelli di Aldo.
10. **Morte e modalità:** schermata della morte («diventi parte di Casa Vespera»), scelta facile/difficile in creazione, salvataggio unico automatico in difficile, azione Fuggire, rastrelliera Elisir, borsa degli elisir.
11. **Salute del personaggio:** in creazione dado vita al massimo (oggi si tira); al passaggio di livello crescita fissa (oggi `saliDiLivello` tira il dado).
12. **Stati del personaggio:** Ustionato da 1 danno non letale a 1d4 letale; Avvelenato da −2 a prove e TS a 1d4; Sanguinamento e Accecato nuovi; durate 3/2 turni e fine con lo scontro (oggi «finché non lo curi o non riposi»); cumulo; immunità; Impaurito (pedinamento) contato in stanze.
13. **Stati inflitti dal giocatore:** le tecniche con durate diverse per i sei stati comuni (es. Sanguinamento 2 turni) vanno portate alle durate standard. Da rivedere il tetto dei boss (`TETTO_BOSS`, 2 turni) per Sanguinamento e Avvelenato.
14. **PA dei nemici:** barra dei PA, costi standard, niente stati gratuiti (`critStato` del cinghiale), regola dell'elisir di protezione.
15. **Poteri d'arma:** costo di 1 punto per gli stati base.
16. **Erbe:** achillea ed eufrasia nella ricerca del sottobosco, prima quelle nuove; ricette di Guendalina.

**Altro che tocca gli stati**
17. **Tecniche dello Sciamano:** ancora da scrivere; con i veleni e la foresta è la classe che più usa gli stati. L'Avvelenato del giocatore e quello dei nemici ora coincidono.
