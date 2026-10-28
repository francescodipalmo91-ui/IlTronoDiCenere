# Bilanciamento — progressione, nemici, stati, armi e bottino (v1, 28 ottobre 2026)

Documento di lavoro. Le sezioni segnate **DECISO** sono state concordate in chat il 28 ottobre; quelle segnate **PROPOSTA** sono di Claude e vanno discusse.
Sostituisce la `proposta_ettore_scontro.md` del 27 ottobre (Ettore ora è tarato sul livello 2).
**Nel gioco dal 28 ottobre sera:** Ettore completo (sezione 5), i punti abilità dei nemici (sezione 2) e il Sanguinamento del personaggio (sezione 3).

---

## 1. Progressione (DECISO)

### Soglie di livello (PE cumulativi)

| Livello | 2 | 3 | 4 | 5 |
|---|---|---|---|---|
| PE | 300 | 1000 | 2400 | 4400 |

(Prima 2200 e 4000: alzate il 28 ottobre sera per far posto agli agguati.)

Il livello massimo del personaggio resta 5. **Il sovrano è di livello 6**: supera il tetto per costruzione, e la differenza la colmano reliquie del Retaggio e fede nuziale.

### PE per nemico

| Nemico | PE |
|---|---|
| Animali normali del bosco | 50-75 (cinghiale 75) |
| Animali infernali del bosco | 75-100 (cinghiale 100) |
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

Incontro al **40%** a ogni ingresso, **senza limite per riposo**. Il limite vero è l'esperienza: oltre il livello 3 la foresta non fa più crescere.

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

### Guardiani più deboli di chi si è allenato (DECISO, nel gioco per Ettore)
Per ogni livello del personaggio oltre quello atteso, il guardiano prende **+5 salute, +1 per colpire, +1 punto abilità**, fino a un massimo di +2 livelli. Chi si allena resta avvantaggiato, ma lo scontro non diventa una formalità.

---

## 2. Regole comuni dei nemici

### Punti abilità (DECISO; nel gioco dal 28 ottobre, primo nemico Ettore; numeri degli altri PROPOSTA)
- Ogni nemico ha una riserva di **punti abilità (PA)**, come la risorsa del personaggio. Finiti i PA, solo attacchi normali.
- La riserva torna piena a ogni nuovo scontro.
- **Oggetti di recupero:** un nemico può avere un oggetto che gli restituisce PA. Se lo usa, l'oggetto non compare più tra i tesori.
- **Nella scheda del nemico:** la riga «Punti abilità» (attuali / massimi), visibile quando la scheda è scoperta. Svuotarla diventa una strategia.
- **Quando usa le abilità:** se ha i PA e lo stato non è già attivo sul personaggio; altrimenti attacca. Così non spreca punti.
- **Nel codice:** `NEMICI[id].pa` (e `livello`, `pvFissi`, `statFisse` per i guardiani); `scontro.pa` / `scontro.paMax`. Mastini e prede li prenderanno quando la tabella sarà approvata.

| Nemico | Livello | PA |
|---|---|---|
| Animali normali | 1 | 0-2 |
| Infernali grado 1 / 2 / 3 | 2 / 3 / 4 | 3 / 4 / 5 |
| Mastini comuni (piano terra / secondo piano) | 2 / 3 | 4 / 5 |
| Mastini boss (a due teste / della soglia) | 4 / 5 | 8 |
| Guardiani (bronzo / argento / oro / platino) | 2 / 3 / 4 / 5 | 8 / 9 / 10 / 12 |
| Sovrano | 6 | 14 |

### Tiri salvezza del personaggio (PROPOSTA)
d20 + mod attributo contro **CD = 8 + mod del nemico + livello del nemico**, la stessa formula che usa il personaggio. Esempio: vipera di livello 1 con mod +2 → CD 11, come già nel gioco.

### Controlli forti (PROPOSTA)
- I nemici comuni **non stordiscono né bloccano mai** il personaggio.
- Guardiani e mastini boss: al massimo **una abilità di controllo forte per scontro** (Stordito o Bloccato, 1 turno), sempre con tiro salvezza.
- Un nemico non infligge lo stesso stato se è già attivo.

### Vulnerabilità (DECISO il 28 ottobre per Ettore)
- **+1 dado di danno** quando il colpo è del tipo a cui il nemico è vulnerabile.
- Vale per gli attacchi normali, per la torcia (conta come contundente), per le tecniche del Guerriero e per gli incantesimi di forza che tirano per colpire. Non vale ancora per i danni «senza tiro» (Spinta, Onda d'Urto, Detonazione).
- I guardiani sono vulnerabili alla **forza** (idea di Francesco del 25 ottobre), più una vulnerabilità propria. La Luce contro gli umani resta inutile.

---

## 3. Stati alterati del personaggio

### I sei stati (tetto deciso: non più di sei)

| Stato | Effetto | Origine tipica | Cura |
|---|---|---|---|
| Ustionato | 1 danno a inizio turno, non uccide | Fuoco degli infernali, le braci di Ettore | Balsamo di grasso di cinghiale (c'è già) |
| Avvelenato | −2 a prove e tiri salvezza | Vipera, Dafne | Tintura di fiele di vipera (c'è già) |
| Indebolito | −2 per colpire | Cinghiale | Infuso di velluto di cervo (c'è già) |
| Impaurito | −2 CA | Ululati, Atena, pedinamento dei mastini | Sale di zampa di coniglio (c'è già) |
| **Sanguinamento** (DECISO il 28 ottobre, nel gioco) | 1d4 a inizio turno, ti lascia almeno a 1; finisce con lo scontro | Lame (Ettore) | Per ora nessuna: finisce con lo scontro. Più avanti l'**impiastro di achillea** (erba) |
| **Accecato** (nuovo, PROPOSTA) | 2d20 per colpire, tieni il peggiore; svantaggio a Percezione | Cenere degli infernali | **Collirio di eufrasia** (erba) |

Gli stati restano finché non bevi l'elisir o riposi (regola già decisa), salvo il Sanguinamento che finisce con lo scontro.

**Erbe (DECISO l'uso, PROPOSTA il modo):** la ricerca nel sottobosco che già riempie la borsa dei veleni (Sopravvivenza o Indagare, CD 12, una volta al giorno) dà anche **un'erba a caso** (achillea o eufrasia). Come per le parti animali, la prima erba portata a Guendalina sblocca una domanda e la ricetta.

**Controlli forti** (solo guardiani e mastini boss): Bloccato o Stordito, salti 1 turno. Non si curano: durano un turno.

---

## 4. Stati per nemico (PROPOSTA)

Regola decisa: **i normali feriscono il corpo** (Sanguinamento, Avvelenato, Indebolito), **gli infernali portano fuoco e cenere** (Ustionato, Accecato, Impaurito).

### Animali normali (livello 1)

| Animale | PA | Abilità |
|---|---|---|
| Coniglio, cervo | 0 | Nessuna: scappano |
| Cinghiale selvatico | 2 | Zannata (2): se colpisce, TS Vigore → Indebolito. Sul critico Indebolito comunque (c'è già) |
| Vipera dei pini | 2 | Morso velenoso (2): TS Vigore CD 11 → Avvelenato (c'è già) |

### Infernali (cacce comuni e foresta)

| Preda | Grado | PA | Abilità |
|---|---|---|---|
| Ratto di cenere | 1 | 3 | Nube di cenere (3): TS Agilità → Accecato |
| Corvo di brace | 1 | 3 | Becco ardente (3): se colpisce, TS Vigore → Ustionato |
| Cinghiale di brace | 2 | 4 | Carica rovente (4): TS Vigore → Ustionato; sul critico anche Indebolito |
| Lupo di cenere | 2 | 4 | Ululato (2): TS Spirito → Impaurito; Morso di cenere (2): se colpisce, TS Agilità → Accecato |
| Branco di segugi di cenere | 3 | 5 | Ululato del branco (3): TS Spirito → Impaurito; Assalto (2): Ustionato |
| Sciame di corvi di brace | 3 | 5 | Nuvola di becchi (3): TS Agilità → Accecato; Piume ardenti (2): Ustionato |

### Mastini

| Mastino | Livello | PA | Abilità |
|---|---|---|---|
| Comune | 2 (3 al secondo piano) | 4 (5) | Presa (2), Soffio Infuocato (2) → Ustionato (ci sono già) |
| A due teste (anticamera del trono) | 4 | 8 | Ululato doppio (3): TS Spirito → Impaurito; Doppia Presa (3, una volta): TS Vigore → Bloccato 1; Soffio (2) |
| Della soglia di Adele (fuori dalla camera) | 5 | 8 | Soffio di cenere (3): TS Agilità → Accecato; Presa (2); Ringhio della soglia (3, una volta): TS Spirito → Stordito 1 |

### Guardiani

| Guardiano | Stato firma | Note |
|---|---|---|
| Ettore | Sanguinamento (coltello), Ustionato (braci) | Sezione 5 (DECISO) |
| Enea | Da definire | Serve prima il carattere |
| Dafne | Avvelenato | Primo turno: tiro d'arco con vantaggio (gratis). Poi lancia: Lancia avvelenata (3): TS Vigore → Avvelenato. Trappola (4, una volta): TS Agilità → Bloccato 1. Oggetto di recupero: Sorso di resina (+3 PA) |
| Atena | Impaurito | Presenza (3): TS Spirito → Impaurito. Il controllo forte va legato alla lacrima che custodisce: da definire |
| Sovrano | Da definire | Livello 6, PA 14 |

---

## 5. Ettore, livello 2 (DECISO il 28 ottobre sera, nel gioco)

| Voce | Valore |
|---|---|
| Attributi | Vigore 14 (+2), Agilità 13 (+1), Mente 12 (+1), Spirito 8 (−1) |
| Salute | 30 fissa |
| CA | 13 (11 con il consiglio di Aldo sulla gamba) |
| Attacco | +4, spada sbreccata 1d6 + 4 |
| PA | 8 |
| CD dei suoi effetti | 12 (8 + 2 + 2) |
| PE | 400 (prima 500), gli stessi se risparmiato |
| Oggetto di recupero | Nessuno: non gli è rimasto niente |
| Crescita | +5 salute, +1 per colpire, +1 PA per ogni livello del personaggio oltre il 2 (al massimo +2) |

**Abilità**
- **Il conteggio** (gratis): conta i suoi attacchi; il numero si vede sempre, la frase intera a uno, quattro, sette e undici. Confonde nove e dieci («Nove… dieci?»), quindi la frase «Undici» arriva al decimo attacco e **all'undicesimo sferra «il dodicesimo colpo»**: vantaggio (due d20, tiene il migliore) e +1d8. Poi riparte da uno. **Perde il conto** (riparte da uno, «Ho perso il conto») la prima volta che scende sotto metà salute e ogni volta che provi a stordirlo, anche se resiste. **Dalla rivincita riparte da tre.**
- **Fendente sporco** (2 PA): attacco normale; se colpisce, TS Vigore CD 12 → Sanguinamento. Lo usa solo se il personaggio non sanguina già e se gli restano i 3 PA per le braci: di solito due volte per scontro.
- **Colpo basso** (3 PA, una volta per scontro): se nel tuo turno hai usato una **difesa che consuma il turno** (Parata, difese dello scudo, Scudo, Scudo della Fede, Muro di Forza, Specchio di Rune, Barriera Cinetica, Respingere, Santuario, Invulnerabilità, Manto d'Ombra, Pelle di Pietra, difese dello Sciamano), Ettore ti aggira col coltello: 1d4 senza tiro e Sanguinamento, poi attacca come sempre.
- **Le braci** (3 PA, una volta, in cripta): la prima volta che è sotto metà salute, al suo turno calcia le braci invece di attaccare: TS Agilità CD 12 → 1d4 e Ustionato. **Il braciere resta acceso** per i riposi.
- **La gamba**: un tuo critico (attacco, tecnica o incantesimo) gli fa perdere il turno successivo (vale anche se è un boss).

**Vulnerabilità (DECISO il 28 ottobre):** contundente e **forza**, +1 dado. La Luce resta inutile contro di lui.

**Stima al livello 2:** il personaggio lo batte in circa 5 colpi andati a segno, lui in circa 4. Pericoloso ma vincibile; con il consiglio di Aldo il personaggio è in vantaggio. Al primo incontro il dodicesimo colpo arriva di rado (si arrende a un terzo della salute e sotto metà perde il conto); nella rivincita, che riparte da tre e senza resa, arriva davvero.

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

### Poteri (DECISO il 28 ottobre, esempi PROPOSTA)
- **Bottino dei guardiani:** poteri che scattano **sul critico o una volta per scontro**, legati al tipo d'arma. Esempi: taglio, Sanguinamento 2 sul critico; contundente, Incrinatura 1; perforante, Esposto 1; bastone degli incantatori, 1 Sigillo in più o la Bilancia spostata di 1.
- **Arma Vespera:** potere **sempre attivo** che si adatta a classe e via (è Aldo che veste il guardiano su misura). Per gli incantatori diventa un bastone che potenzia gli incantesimi.
- **Spada del Retaggio:** potere **fisso** legato alla storia, più forte contro guardiani e sovrano che contro il resto. Così la scelta servo/erede ha anche un senso meccanico: l'arma di Aldo rende di più ovunque, quella del re nello scontro che conta.
- Da verificare: le classi che oggi non possono usare una spada. Se l'Arcanista non può impugnarla, la spada del Retaggio per lui è solo una reliquia nello zaino.

### Armature e scudi (PROPOSTA)
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
| Ettore | Spada sbreccata di Valdombra (una mano, 1d6 + 2, sul critico Sanguinamento 2); Coltello delle tacche (Dotazione, 1d4 perforante, senza poteri) | 60%, tabella bronzo |
| Enea | Da definire | 70%, argento |
| Dafne | Lancia da caccia (due mani, 1d8 + 4, potere da definire); l'arco resta descrittivo (il giocatore non usa archi). Se vince la gara: lascia comunque corno, fermaglio e i suoi averi | 80%, oro |
| Atena | Da definire | 90%, platino |

---

## 8. Mastini nei corridoi (DECISO, dettagli PROPOSTA)

- **Regola:** i mastini non entrano dove c'è un membro della famiglia. Il mastino a due teste sta nell'anticamera, fuori dalla sala del trono; quello della **soglia di Adele** sta fuori dalla camera, a guardia.
- **2-3 mastini fissi** nei corridoi del secondo piano, ognuno si affronta una volta.
- **Pedinamento:** entrando in un corridoio, 20% di una frase che fa sentire seguiti (passi, ringhio lontano, odore di bruciato). Prova di **Furtività CD 8**.
  - Riuscita: il mastino perde la traccia.
  - Fallita (DECISO): **Impaurito** fino al prossimo scontro o riposo e **1d2 danni mentali, letali**: a 0 il personaggio diventa parte di Casa Vespera. Niente scontro, niente PE. Il giocatore deve sapere che in questa storia si muore anche fuori dagli scontri.
  - La frase del pedinamento arriva **prima** della prova, come avviso: chi ha la mente bassa sa che dovrebbe riposare.
  - Così l'evento non diventa una fonte di esperienza e Impaurito ha finalmente un'origine anche prima di Atena.
  - Peso stimato: con mod 0 la prova fallisce il 35% delle volte; al 20% per corridoio è circa un danno ogni 14 ingressi. Una pressione costante, non un salasso.

---

## 8b. Agguati degli avventurieri — il riscatto del disperato (DECISO il 28 ottobre)

Restano valide le regole di ottobre: 5 PNG scritti da Francesco, che partono dal livello 1 e crescono con il personaggio; 20% di agguato, al massimo uno per ciclo di riposo, solo dopo il bronzo, mai dove il fuoco è caldo né nelle stanze dei PNG.

- **PE:** 100, **solo la prima volta** che si sconfigge ciascuno. Dalla seconda volta, niente PE.
- **Chi uccidi non torna, chi risparmi sì.** Il risparmiato ritorna con rancore, più forte, senza dare PE: il riscatto del disperato. Proposta per «più forte»: +1 livello a ogni ritorno (+5 salute, +1 per colpire, +1 PA), al massimo +2.
- **Stati:** sono umani, quindi feriscono il corpo (Sanguinamento, Avvelenato, Indebolito). **6 PA**, uno stato firma ciascuno, legato al carattere. Vulnerabili all'Ombra (già deciso).
- **Bottino:** armi del livello delle cacce comuni (magiche, senza poteri). Un oggetto garantito se ucciso, nessun oggetto magico: restano sotto i guardiani.
- Così uccidere o risparmiare ha un costo anche con gli avventurieri, come con i guardiani reietti.

---

## 9. Da decidere
1. ~~Sanguinamento~~ → deciso e nel gioco (senza cura per ora). Resta da decidere Accecato, con achillea ed eufrasia.
2. ~~Statistiche e abilità di Ettore al livello 2~~ → decise e nel gioco (sezione 5).
3. PA degli altri nemici e tabella degli stati per nemico (il sistema dei PA c'è già).
4. Armature e scudi: +1/+2 invece di "+livello".
5. Esempi di bottino per grado e poteri concreti delle armi.
6. Abilità del set Vespera, compresa quella dell'arma; «Passo Silenzioso» era pensata per gli stivali, va spostata o tolta. Resta da definire anche il prezzo del set (mente massima ridotta o follia più vicina).
7. Enea: carattere, stato firma e bottino.

## 10. Cosa manca (verifica del 28 ottobre)

**Buchi nel bilanciamento**
1. ~~Agguati degli avventurieri~~ → risolto, sezione 8b. Mancano i cinque caratteri e gli stati firma.
2. ~~PE di missioni e frammenti di diario~~ → risolto: 50 PE per le tre missioni di Guendalina e per la fiducia del figlio maggiore; niente PE per reliquie, lacrime e diari.
3. **Il sovrano** al livello 6: statistiche, abilità, e il peso in numeri di reliquie e fede nuziale.
4. **Atena:** il controllo forte legato alla lacrima.
5. **Gruppi di grado 3** (branco, sciame): i PA sono condivisi come la salute?

**Da allineare nel codice**
6. **Soglie di livello:** nel gioco ci sono ancora quelle vecchie (500 / 1000 / 1500 / 2000).
7. **Mastini della cantina:** oggi 200 PE, caratteristiche tirate a caso e 30% di ricomparsa. Le regole nuove dicono 150 PE, mastini fissi, nessuna ricomparsa.
8. ~~**Ettore:** attributi tirati a caso~~ → fatto il 28 ottobre sera (sezione 5).
9. **Foresta:** 30% e un incontro per riposo diventano 40% senza limite, con PE a scalare.
10. **Danni senza tiro e vulnerabilità:** Spinta, Onda d'Urto e Detonazione non prendono ancora il dado in più contro i nemici vulnerabili alla forza.

**Altro che tocca gli stati**
11. **Tecniche dello Sciamano:** ancora da scrivere; con i veleni e la foresta è la classe che più usa gli stati.
