# Arcanista e Monaco — Scuole di magia e vie di prestigio (v2, decisa, dati in js/magia.js)

Bozza da leggere, **niente codice ancora**. Segue le regole del Guerriero: d20 contro CA, durate in turni del nemico, immunità dei boss (Frastornato, Bloccato, Silenzio), tetto di 2 turni sui boss per Indebolito, Sbilanciato ed Esposto, critico = 20 sul d20 con il doppio dei dadi.

- **Arcanista** (mana, Mente): **Arcano** e **Forza**. L'Arcano *scrive* rune sul nemico, la Forza le *fa esplodere*.
- **Monaco** (punti fede, Spirito): **Luce** e **Ombra**. Ogni incantesimo sposta una bilancia: l'Ombra è più forte ma costa la mente, la Luce protegge e cura.

---

## 1. Regole comuni agli incantatori

| Regola | Valore |
|---|---|
| Attacco magico | d20 + mod attributo (Mente / Spirito) contro CA, come l'attacco con l'arma (il livello entra solo nella CD) |
| Tiro salvezza del nemico | CD = 8 + mod attributo + livello (come il Guerriero con il Vigore) |
| Incantesimi preparati | Come le tecniche: **2 al livello 1, 2 al 2, 1 al 3, 1 al 4, 1 al 5** (7 posti), più 1 abilità della via per livello dal 3 |
| Scelta | Liberi tra **le due scuole** della classe: 3 incantesimi per scuola per livello, quindi 6 opzioni per livello |
| Cambio | Al riposo, come già deciso |
| Costi | L1 1-2, L2 3-4, L3 4-6, L4 6-7, L5 8-9 (un po' sotto il Guerriero, perché gli incantatori recuperano meno risorsa durante lo scontro) |
| Recupero in combattimento | Niente ira dai colpi subiti; ogni classe ha la sua meccanica (Detonazione per l'Arcanista, Crepuscolo per il Monaco) |
| Arma | L'attacco con l'arma resta gratuito: quando il mana finisce si combatte con il bastone |

**Luce resta una capacità di classe** per entrambi, **fuori dai posti** (costo 1), come Mente incrollabile per i marziali: serve nel dungeon al posto della torcia e nessuno deve rinunciare a un incantesimo per vedere. Per l'Arcanista si chiama **Lume Arcano** (stessa id `luce`).

### Stati nuovi

| Stato | Effetto | Boss |
|---|---|---|
| **Accecato** | Il nemico tira 2d20 per colpire e tiene il peggiore | Massimo 2 turni |
| **Avvizzito** | 1d4 necrotico all'inizio del turno del nemico (1d6 dove indicato). Si somma al Sanguinamento: sono due ferite diverse | Massimo 3 turni |

Gli altri stati sono quelli che il gioco ha già: Indebolito, Sbilanciato, Esposto, Frastornato, Bloccato, Silenzio (niente attacchi speciali).

---

## 2. Arcanista — Arcano e Forza

### Meccanica: i Sigilli

- Gli incantesimi d'**Arcano** incidono **Sigilli** sul nemico. **Massimo 3, 2 sui boss.** Durano tutto lo scontro.
- Gli incantesimi di **Forza** con la scritta *Detonazione* consumano tutti i Sigilli: **+1d6 di danno per Sigillo** e **recuperi 1 mana per Sigillo**. È così che l'Arcanista ricarica in combattimento.
- Lo stile: preparare con l'Arcano (controllo, informazioni), chiudere con la Forza (danno, spinta). Chi sceglie una sola scuola funziona lo stesso, ma rende meno.
- Nella scheda: tre piccole rune accanto al nemico, come le Cariche dello scudo.

### Arcano (controllo, conoscenza, rune)

| Liv | Incantesimo | Costo | Effetto |
|---|---|---|---|
| 1 | Dardo Arcano | 2 | Attacco magico, 1d8 arcano; se colpisce, 1 Sigillo |
| 1 | Scopri Carte | 1 | Apre la scheda del nemico (CA, salute, vulnerabilità) e incide 1 Sigillo senza tiro. Fuori dallo scontro: +2 a Sapienza su rune e oggetti magici |
| 1 | Runa sull'Arma | 2 | Per 3 turni il dado dell'arma sale di un passo (1d6→1d8→1d10→1d12); ogni colpo d'arma a segno incide 1 Sigillo |
| 2 | Marchio Arcano | 3 | Tiro salvezza → Esposto 2 e 1 Sigillo (il Sigillo resta anche se resiste) |
| 2 | Stasi | 4 | Tiro salvezza → Bloccato 1 (boss: 2 Sigilli) |
| 2 | Specchio di Rune | 3 | Consuma l'azione; il primo colpo subito fa metà danni e incide 1 Sigillo sull'attaccante |
| 3 | Catena di Glifi | 5 | Attacco magico 2d6; se colpisce, 2 Sigilli |
| 3 | Sigillo del Silenzio | 5 | Tiro salvezza → Silenzio 2 (boss: Indebolito 2); 1 Sigillo |
| 3 | Disfare | 4 | Ti libera dalla Presa, il Soffio del nemico va ricaricato; 1 Sigillo |
| 4 | Risonanza | 6 | Attacco magico 2d8, +1d8 per Sigillo, **senza consumarli** |
| 4 | Prigione di Rune | 7 | Tiro salvezza → Bloccato 2 (boss: Sbilanciato 2 e 1 Sigillo) |
| 4 | Occhio del Tomo | 6 | Per 3 turni i tuoi attacchi magici fanno critico con 19-20; ogni critico incide 2 Sigilli |
| 5 | Parola Vera | 9 | Una volta per riposo; senza tiro, 4d8 arcano; per 2 turni il nemico ha −4 ai tiri salvezza |
| 5 | Tomo Proibito | 8 | Per 3 turni gli incantesimi d'Arcano costano 2 in meno (minimo 1) e incidono 1 Sigillo in più. **Costa 1 punto mentale** (non letale) |
| 5 | Sigillo Assoluto | 9 | Sigilli al massimo; tiro salvezza → Bloccato 2 (boss: Indebolito e Sbilanciato 2) |

### Forza (danno, spinta, barriere)

| Liv | Incantesimo | Costo | Effetto |
|---|---|---|---|
| 1 | Pugno di Forza | 2 | Attacco magico, 1d10 forza. *Detonazione* |
| 1 | Spinta | 2 | Senza tiro, 1d6 forza; tiro salvezza → Sbilanciato 1. *Detonazione* |
| 1 | Scudo | 1 | +2 CA per 2 turni (l'incantesimo di oggi) |
| 2 | Ariete | 4 | Attacco magico 2d6; se colpisce, Sbilanciato 2. *Detonazione* |
| 2 | Onda d'Urto | 4 | Senza tiro, 2d4; tiro salvezza → perde l'attacco speciale pronto. *Detonazione* |
| 2 | Barriera Cinetica | 3 | Consuma l'azione; il primo colpo subito fa 0 danni e l'attaccante subisce 1d6 forza |
| 3 | Implosione | 6 | Consuma tutti i Sigilli (almeno 1): 2d6 per Sigillo senza tiro, e recuperi 1 mana per Sigillo |
| 3 | Pressione | 5 | Tiro salvezza → Indebolito 2 e 1d6 forza all'inizio dei suoi 2 turni. *Detonazione* |
| 3 | Muro di Forza | 5 | Per 2 turni +3 CA e la Presa non ti afferra |
| 4 | Maglio Invisibile | 7 | Attacco magico 3d8, critico con 19-20. *Detonazione* |
| 4 | Gravità | 6 | Tiro salvezza → Bloccato 1 e Sbilanciato 2 (boss: Sbilanciato 2 e Indebolito 1) |
| 4 | Respingere | 7 | Consuma l'azione; fino al tuo turno ogni colpo fa 0 danni e ne restituisce 1d6 |
| 5 | Singolarità | 9 | Una volta per riposo; consuma tutti i Sigilli: 3d6 per Sigillo + mod Mente senza tiro; recuperi 2 mana per Sigillo |
| 5 | Invulnerabilità | 8 | Una volta per riposo; fino al tuo turno 0 danni da tutto, Soffio compreso |
| 5 | Cataclisma Cinetico | 9 | 3 attacchi magici da 1d8; ognuno a segno fa detonare 1 Sigillo (+1d6 e 1 mana) |

Note:
- **Barriera Cinetica, Respingere, Specchio di Rune** consumano l'azione: propongo la stessa regola dello scudo (niente difesa due turni di fila).
- **Implosione** con 3 Sigilli: 6d6 (media 21) e ti restituisce 3 mana, quindi costa 3 netti. È il premio per aver preparato.

---

## 3. Monaco — Luce e Ombra

### Meccanica: la Bilancia

Una barra da **Ombra 3** a **Luce 3**, che parte da 0 a ogni scontro. Ogni incantesimo di Luce la sposta di 1 verso la Luce, ogni incantesimo d'Ombra di 1 verso l'Ombra.

| Posizione | Effetto |
|---|---|
| Luce 2-3 · **Aureola** | Le tue cure +2, +1 ai tuoi tiri salvezza |
| Luce 3 · **Zenit** | Il prossimo incantesimo d'Ombra è un *Crepuscolo* |
| Ombra 2-3 · **Velo** | Gli incantesimi d'Ombra +1 dado di danno |
| Ombra 3 · **Nadir** | Ogni incantesimo d'Ombra costa anche **1 punto mentale** (non letale); il prossimo incantesimo di Luce è un *Crepuscolo* |
| **Crepuscolo** | L'incantesimo costa 2 fede in meno e ha +1 dado (danno o cura); poi la Bilancia torna a 0 |

Perché funziona nel gioco:
- L'Ombra fa più male, ma a Nadir consuma proprio la risorsa che decide il game over: è la casa che si nutre di chi usa le tenebre.
- Il Crepuscolo è il recupero in combattimento: chi alterna le scuole spende meno.
- Si lega alla vulnerabilità degli Appunti di Guendalina: contro un nemico vulnerabile alla luce, gli incantesimi di Luce hanno già il dado in più deciso.

### Luce (cura, protezione, Accecato)

| Liv | Incantesimo | Costo | Effetto |
|---|---|---|---|
| 1 | Dardo di Luce | 2 | Attacco magico, 1d8 radiante; sul critico anche Accecato 1 |
| 1 | Tocco Lenitivo | 2 | Cura 1d8 + mod Spirito |
| 1 | Scudo della Fede | 1 | +2 CA per 2 turni (l'incantesimo Scudo di oggi) |
| 2 | Accecare | 3 | Tiro salvezza → Accecato 2 |
| 2 | Folgore Sacra | 4 | Attacco magico 2d6 radiante; tiro salvezza → Frastornato 1 (boss: +1d6) |
| 2 | Voto di Luce | 3 | Per 3 turni ogni colpo d'arma a segno fa +1d4 radiante e ti cura 1 |
| 3 | Raggio del Mattino | 5 | Senza tiro 2d8 radiante; tiro salvezza per dimezzare |
| 3 | Santuario | 5 | Consuma l'azione; per 2 turni il primo colpo di ogni turno fa metà danni; alla fine cura 1d6 |
| 3 | Purificazione | 4 | Ti libera dalla Presa e dalle bruciature, cura 1d6 |
| 4 | Lancia del Sole | 7 | Attacco magico 3d8; se colpisce, tiro salvezza → Accecato 2 |
| 4 | Corona di Raggi | 6 | Per 3 turni 1d6 radiante al nemico a inizio del suo turno; se ti colpisce, Accecato 1 |
| 4 | Grazia | 6 | Cura 2d8 + mod Spirito e +2 CA per 2 turni |
| 5 | Alba Eterna | 9 | Una volta per riposo; senza tiro 4d8 radiante e Accecato 2; ti curi della metà dei danni |
| 5 | Seconda Vita | 8 | Una volta per scontro, si lancia prima; il primo colpo che ti porterebbe a 0 ti lascia a 1 e ti cura 2d6 |
| 5 | Giudizio | 9 | Attacco magico 2d10, +1d10 per ogni punto di Luce sulla Bilancia; poi Bilancia a 0 |

### Ombra (drenaggio, paura, Avvizzito)

| Liv | Incantesimo | Costo | Effetto |
|---|---|---|---|
| 1 | Tocco Avvizzente | 2 | Attacco magico, 1d6 necrotico; ti curi della metà dei danni |
| 1 | Sussurro della Paura | 2 | Tiro salvezza → Silenzio 1 (boss: Indebolito 1) |
| 1 | Manto d'Ombra | 1 | Il prossimo attacco del nemico tira 2d20 e tiene il peggiore. Fuori dallo scontro: +2 a Furtività per una stanza |
| 2 | Avvizzire | 3 | Tiro salvezza → Avvizzito 3 |
| 2 | Sete di Tenebra | 4 | Attacco magico 2d6 necrotico; se colpisce, recuperi 2 fede |
| 2 | Catene d'Ombra | 4 | Tiro salvezza → Bloccato 1 (boss: Sbilanciato 2) |
| 3 | Divorare | 6 | Attacco magico 2d8; se il nemico è Avvizzito, consuma l'Avvizzito: infligge subito tutti i danni rimasti e te ne cura altrettanti |
| 3 | Patto d'Ombra | 4 | Perdi 1d4 salute, recuperi 1d4 + livello fede |
| 3 | Eclisse | 5 | Tiro salvezza → Accecato 2 e Indebolito 2. Costa 1 punto mentale, anche fuori da Nadir |
| 4 | Ombra Gemella | 7 | Per 3 turni ogni tuo incantesimo a segno fa +1d6 necrotico |
| 4 | Terrore | 6 | Tiro salvezza → Frastornato 2 (boss: Indebolito 2 e −2 ai tiri salvezza) |
| 4 | Mietitura | 7 | Senza tiro 3d6 necrotico; se il nemico scende sotto metà salute, recuperi 3 fede |
| 5 | Notte Senza Fine | 9 | Una volta per riposo; per 3 turni il nemico è Accecato e Avvizzito (1d6) e gli incantesimi d'Ombra costano 2 in meno. Costa 1d4 punti mentali (non letale) |
| 5 | Nome Taciuto | 8 | Tiro salvezza → Bloccato 2 (boss: Indebolito e Sbilanciato 2) |
| 5 | Abbraccio del Vuoto | 9 | Attacco magico 4d8 necrotico, ti curi di tutti i danni inflitti; la Bilancia va a Ombra 3 |

---

## 4. Vie di prestigio (dal livello 3)

Stessa scelta del Guerriero (`sceglieVia("aldo")` / `sceglieVia("guendalina")`), una abilità per livello (3, 4, 5), attiva, fuori dai posti. Costi 5, 7, 9. Il legame con la storia:
- **Aldo** è il servitore del re, duro e senza pietà: le sue vie spingono la scuola "violenta" (Forza, Ombra).
- **Guendalina** è fedele ad Adele, che era un'incantatrice e nei secoli ha imparato la concentrazione: le sue vie spingono la scuola "paziente" (Arcano, Luce).

### Arcanista — Via di Aldo: Demolizione

| Liv | Abilità | Costo | Effetto |
|---|---|---|---|
| 3 | Pugno della Casa | 5 | Attacco magico 2d8 forza, *Detonazione* con 1d8 per Sigillo. Per tutto lo scontro, ogni tua Detonazione fa anche Sbilanciato 1 |
| 4 | Spezzare il Vincolo | 7 | Tiro salvezza → Indebolito 3 (boss 2); per tutto lo scontro la sua CA −2 (non si somma con sé stessa) |
| 5 | Crollo | 9 | Consuma tutti i Sigilli: 2d10 per Sigillo senza tiro; se il nemico arriva a 0, recuperi il mana speso |

### Arcanista — Via di Guendalina: Trama

| Liv | Abilità | Costo | Effetto |
|---|---|---|---|
| 3 | Filo della Governante | 5 | 2 Sigilli senza tiro. Per tutto lo scontro, finché il nemico ha almeno 2 Sigilli, ha −2 per colpirti |
| 4 | Ricamo di Rune | 7 | Tiro salvezza → Silenzio 2 ed Esposto 2 (boss: Indebolito ed Esposto 2); il prossimo incantesimo −2 mana |
| 5 | Concentrazione di Adele | 9 | Per 3 turni gli incantesimi d'Arcano non costano mana: ognuno consuma 1 Sigillo al suo posto (se non ce ne sono, si paga normalmente) |

### Monaco — Via di Aldo: Eclissi

| Liv | Abilità | Costo | Effetto |
|---|---|---|---|
| 3 | Rancore | 5 | Attacco magico 2d6 necrotico, +1d6 per ogni colpo subito in questo scontro (massimo 3) |
| 4 | Lutto | 7 | Tiro salvezza → Avvizzito 3 (1d6) e Indebolito 2. Per tutto lo scontro, Nadir non ti costa punti mentali |
| 5 | Rabbia del Sovrano | 9 | Per 3 turni gli incantesimi d'Ombra +1 dado e ti curano della metà dei danni; la Bilancia resta bloccata a Ombra 3 |

### Monaco — Via di Guendalina: Focolare

Si lega alla regola "si è al sicuro solo dove le fiamme sono calde".

| Liv | Abilità | Costo | Effetto |
|---|---|---|---|
| 3 | Fiamma Calda | 5 | Cura 2d6 + mod Spirito; per 2 turni chi ti colpisce subisce 1d4 di fuoco sacro |
| 4 | Cerchio del Focolare | 7 | Per 3 turni +2 CA, +2 ai tiri salvezza, e il Soffio Infuocato ti fa metà danni |
| 5 | Fuoco che Cura | 9 | Cura 4d8 + mod Spirito; la cura in eccesso (oltre la salute massima) diventa danno radiante al nemico. È l'eco dell'incantesimo di Adele: una cura troppo potente che ferisce |

---

## 5. Cosa succede agli incantesimi di oggi

| Oggi | Classe | Proposta |
|---|---|---|
| Luce | entrambe | Resta, diventa capacità di classe fuori dai posti (Lume Arcano per l'Arcanista) |
| Dardo di Ghiaccio | Arcanista | Diventa **Dardo Arcano** (il ghiaccio non è né forza né arcano) |
| Scudo | Arcanista | Resta in **Forza** |
| Stop | Arcanista | Diventa **Stasi**, 1 turno (2 turni a costo 2 era troppo forte) |
| Invulnerabilità | Arcanista | Resta in **Forza** al livello 5, 1 turno, una volta per riposo |
| Scopri Carte | Arcanista | Resta in **Arcano** al livello 1 |
| Arma Migliorata | Arcanista | Diventa **Runa sull'Arma** (Arcano, livello 1) |
| Dardo di Luce | Monaco | Resta in **Luce** |
| Scudo | Monaco | Diventa **Scudo della Fede** (Luce) |
| Folgorazione | Monaco | Diventa **Folgore Sacra** (Luce, livello 2), Frastornato 1 invece di paralisi 2 |
| Pelle di Pietra | Monaco | **Tolto** (la pietra non è né luce né ombra) |
| Accecare | Monaco | Resta in **Luce**, con lo stato Accecato invece del 50% |
| Aumento di Potenza | Monaco | **Tolto** (+2 a tutto per 3 turni era troppo forte); il suo posto lo prende Voto di Luce |

Nei salvataggi, quelli tolti diventano posti vuoti, come per il Guerriero.

---

## 6. Da decidere

1. **Scuole libere o una sola?** Proposta: libere (6 opzioni per livello). In alternativa, come il Guerriero con l'arma, si sceglie una scuola principale in creazione e l'altra si sblocca più tardi.
2. **Luce fuori dai posti:** va bene come capacità di classe?
3. **Nadir e punti mentali:** l'Ombra che costa la mente ti piace, o è troppo punitiva per una classe che ha già pochi punti salute?
4. **Sigilli:** massimo 3 (2 sui boss) come Incrinatura, o 3 per tutti come le Cariche dello scudo?
5. **Vie:** Aldo = Forza/Ombra e Guendalina = Arcano/Luce ti convince? I nomi (Demolizione, Trama, Eclissi, Focolare) sono provvisori.
6. **Vulnerabilità:** quali nemici sono vulnerabili a luce, ombra o forza? Per esempio: i mastini (fuoco) vulnerabili alla Forza? I guardiani legati al Signore vulnerabili alla Luce?
7. **Fuori dallo scontro:** ho messo pochi usi (Lume Arcano, Scopri Carte, Manto d'Ombra). Ne vuoi di più, collegati alle prove (es. Spinta per aprire una porta incastrata)?
8. **Crescita del mana:** oggi sale di dado vita + mod a ogni livello (circa 4-5). Con questi costi basta; se vuoi la stessa formula dell'ira (mod + livello), i costi vanno rivisti.

---

## 7. Risposte (25/10/2026) e proposte v2

| # | Decisione | Proposta per applicarla |
|---|---|---|
| 1 | Come il Guerriero | **Scuola principale** scelta in creazione (come l'arma decide il ramo); l'altra scuola dà **1 posto in più** di qualsiasi livello, come lo scudo. Cambio di scuola: vale dal livello successivo, come il cambio d'arma. **Confermata.** Da aggiungere: sul critico degli incantesimi di Forza si incide 1 Sigillo, così l'Arcanista di Forza ha di che far detonare |
| 2 | Luce capacità di classe | Decisa |
| 3 | Nadir costa punti mentali | Decisa; in futuro forse oggetti per bilanciare |
| 4 | Sigilli | Massimo 3, 2 sui boss |
| 5 | Vie | Assegnazione confermata, **nomi da cambiare** |
| 6 | Vulnerabilità | Mastini → Luce, guardiani → Forza, avventurieri delle cacce comuni → Ombra, sovrano → Ombra (con condizioni). *In discussione* |
| 7 | Usi fuori dallo scontro | Restano questi per ora |
| 8 | Recupero coerente con i marziali | Risorsa che cresce di **mod attributo + livello** per tutte le classi; recupero in combattimento con la **stessa tabella 1/1/2/2/3**, doppio nel caso "forte": Guerriero per colpo subito (doppio sul critico), Arcanista per Detonazione (doppio se detona 3 Sigilli), Monaco per Crepuscolo (doppio se parte da Nadir). *Da confermare* |

---

## 8. Vulnerabilità (v2)

Effetto, come deciso: **+1 dado di danno** oppure **condizione +1 turno**.

| Nemici | Vulnerabili a | Effetto | Note |
|---|---|---|---|
| Mastini (tutti) | Luce | Condizione +1 turno (Accecato più lungo) | Niente dado in più: sono i nemici più frequenti, il Monaco di Luce sarebbe sempre avvantaggiato |
| Avventurieri delle cacce comuni | Ombra | +1 dado | Menti fresche e fragili in una casa che opprime |
| Ettore (bronzo, cripta) | Luce + contundente | +1 dado | La cripta è buia; vecchia armatura che si incrina |
| Enea (argento, cimitero) | Forza + taglio | +1 dado | |
| Dafne (oro, foresta) | Ombra + perforante | +1 dado | Cacciatrice che sta perdendo la mente |
| Atena (platino, sottotetto) | Arcano + taglio | +1 dado | Custodisce una Lacrima: è legata alla magia |
| Sovrano | **Resiste all'Ombra** (metà danni); vulnerabile a tutto oltre la soglia del Retaggio | +1 dado a ogni danno | Vedi sezione 9 |

- Ogni scuola copre un guardiano, ogni tipo d'arma almeno uno: nessuna classe resta senza risposta.
- Gli **Appunti di Guendalina** tornano utili: rivelano la vulnerabilità del guardiano successivo.
- Le vulnerabilità dei guardiani sono una proposta, si possono scambiare.

## 9. Il Retaggio del Padrone (proposta)

Idea tua: in ogni luogo di un guardiano c'è un enigma che dà una reliquia del Retaggio; più reliquie si portano allo scontro finale, più il sovrano è vulnerabile.

| Reliquia | Dove | Enigma (spunto) |
|---|---|---|
| Spada | Atrio (c'è già) | Prova dell'armatura |
| Anello col sigillo | Cripta di Ettore | Sarcofago e braciere |
| Medaglione | Cimitero di Enea | Lapidi da leggere nell'ordine giusto |
| Corno da caccia | Foresta di Dafne | Tracce da seguire (Sopravvivenza) |
| Corona | Sottotetto di Atena | Da definire |

**Regola unica per tutte le classi** (al posto di "danni extra per i marziali, vulnerabilità per gli incantatori"):
- Il sovrano diventa vulnerabile (+1 dado a ogni danno) quando la sua salute scende sotto una **soglia**.
- Senza reliquie: 25%. Ogni reliquia alza la soglia del 15%: 1 → 40%, 2 → 55%, 3 → 70%, 4 → 85%, **5 → vulnerabile da subito**.
- Le reliquie valgono anche solo nello zaino: una corona o un medaglione non si "equipaggiano", e così non entrano in conflitto con i limiti d'armatura né con il set Vespera.
- La reliquia si ottiene con l'enigma, **indipendentemente** dal fatto di uccidere o risparmiare il guardiano.
- L'enigma si può ritentare; ogni tentativo fallito costa 1 punto mentale, come le altre prove.

## 10. Recupero ricalcolato

**Crescita della risorsa, uguale per tutte le classi:** a ogni livello + (mod attributo + livello raggiunto). Con mod +3: 13 / 18 / 24 / 31 / 39.

**Recupero in combattimento, tabella unica 1 / 1 / 2 / 2 / 3** per livello:

| Classe | Evento | Doppio quando |
|---|---|---|
| Guerriero, Sciamano | Colpo subito a segno | Critico subito |
| Arcanista | Ogni Detonazione (non per Sigillo) | Detona il massimo dei Sigilli (3, oppure 2 su un boss) |
| Monaco | Ogni Crepuscolo | Il Crepuscolo parte da Nadir |

**Stima per scontro** (5 turni, mod +3):

| Livello | Guerriero | Incantatore |
|---|---|---|
| 1 | 13 + ~3 colpi × 1 = **~16** | 13 + ~1,5 eventi × 1 = **~15** |
| 5 | 39 + ~3 × 3 = **~48** | 39 + ~1,5 × 3 (≈ 2 con i doppi) = **~45** |

Gli incantatori recuperano un po' meno, quindi **i costi restano 1 punto sotto il Guerriero**: L1 1-2, L2 3-4, L3 4-5, L4 6-7, L5 8-9.

**Correzioni agli incantesimi:**
- **Crepuscolo:** non costa più 2 in meno; dà il recupero della tabella e +1 dado.
- **Detonazione:** +1d6 di danno per Sigillo resta; il recupero diventa quello della tabella (prima era 1 mana per Sigillo).
- **Implosione:** è una Detonazione (tabella, doppia con 3 Sigilli).
- **Singolarità:** Detonazione sempre doppia.
- **Cataclisma Cinetico:** i 3 colpi contano come **una sola** Detonazione.
- **Sete di Tenebra:** da +2 fede a +1.
- **Mietitura:** da +3 fede a +2.
- **Patto d'Ombra:** resta (costa salute, è uno scambio, non un recupero gratuito).

## 11. Nomi delle vie (astratti)

| Via | Ora | Proposte |
|---|---|---|
| Arcanista · Aldo | Demolizione | **Dominio**, Impeto, Rovina |
| Arcanista · Guendalina | Trama | **Ordito**, Custodia, Equilibrio |
| Monaco · Aldo | Eclissi | **Abisso**, Penombra, Lutto |
| Monaco · Guendalina | Focolare | **Brace**, Aurora, Grazia |

Da cambiare anche i nomi delle abilità che citano personaggi: «Filo della Governante», «Concentrazione di Adele» (è anche uno spoiler: rivela che Adele è un'incantatrice), «Rabbia del Sovrano», «Pugno della Casa».

---

## 12. Aggiornamento (25/10/2026, 11:30)

**Set legati ai PNG (proposta di Francesco):** set Vespera ↔ Aldo, Retaggio del Padrone ↔ Guendalina.
- Aldo vuole che il personaggio diventi il prossimo guardiano: vestirlo con l'armatura di famiglia è coerente.
- Guendalina vuole liberare Adele, quindi indebolire il re: il Retaggio, che rende il sovrano vulnerabile, è coerente.
- **Conflitto:** oggi la posizione del set Vespera è la benedizione di Adele. Va cambiata (es. Adele benedice le reliquie del Retaggio, oppure dà altro).

**Reliquie:** nessuno le ha nascoste, sono in luoghi dimenticati. Il **figlio maggiore** (biblioteca, "topo da biblioteca") conosce quei luoghi e affida gli enigmi, come Aldo affida le cacce.
- Guendalina, vincolata dal patto, non può parlarne: manda il giocatore dal figlio.
- Scambio possibile: il figlio cerca la verità sull'incendio, il giocatore gli porta i frammenti di diario e lui in cambio indica un luogo dimenticato.
- **Tempi:** la biblioteca è al secondo piano. Se si sblocca dopo il bronzo, l'enigma della cripta di Ettore va reso risolvibile anche senza il figlio (lui darà solo un indizio in più), oppure si torna in cripta dopo.

**Nomi delle vie: coppie opposte**

| Classe | Aldo / Guendalina | Alternative |
|---|---|---|
| Arcanista | **Frattura / Sutura** | Caos / Ordine · Rovina / Fondamenta |
| Monaco | **Tramonto / Alba** | Cenere / Brace · Notte / Giorno |
| Guerriero, contundenti *(opzionale)* | Spezzare / Controllo → Martello / Incudine | |
| Guerriero, perforanti *(opzionale)* | Penetrazione / Precisione → Punta / Mira | |
| Guerriero, scudo *(opzionale)* | Risacca / Postura → Marea / Scoglio | |

---

## 13. Decisioni (25/10/2026, 11:40) e proposte

**Nomi decisi**
- Arcanista: **Frattura** (Aldo) / **Sutura** (Guendalina)
- Monaco: **Cenere** (Aldo) / **Brace** (Guendalina)
- Guerriero: contundenti **Martello / Incudine**, perforanti **Punta / Mira**, scudo **Marea / Scoglio**; taglio (oggi senza nome) proposta **Lama / Guardia**

**Fede nuziale di Adele** (al posto della posizione del set Vespera come benedizione)
- Anello "intriso d'amore", con una piccola goccia di zaffiro che richiama le lacrime.
- Esiste solo nel finale positivo (Adele liberata). Proposta: **non è una sesta reliquia della soglia**, ma la benedizione specifica contro il re già prevista: nello scontro il sovrano la riconosce e la rabbia vacilla (es. una volta per scontro salta il suo turno, o i suoi attacchi −2 per 2 turni); è anche ciò che fa scattare la resa.
- Così le 5 reliquie restano la regola per tutti i finali e la fede compensa il re rafforzato dalla liberazione di Adele.

**Guendalina, dialogo «Parla dei figli»** (dopo la missione della cantina, vale per entrambi gli approcci)
- Racconta che cercò di tenere i bambini lontani dalle fiamme.
- Per il patto non può dire **chi** è morto né **come** nacque il fuoco: «Non riuscii a salvarli tutti».
- Affida la missione dei figli e dei loro oggetti. **Da chiarire:** è la quest 2 (Il Vincolo del Silenzio) riscritta o una quest nuova?

**Figlio maggiore**
- Si fida di Guendalina, come la madre. Il libro (ottenuto dopo Ettore) è il segno di fiducia che apre il dialogo e gli enigmi.
- Ritorno in cripta: durante la caccia il personaggio era concentrato su Ettore; dopo l'indizio del figlio la cripta mostra un'interazione nuova (va segnalata nella tendina Missioni).

---

## 14. Stato (25/10/2026, pomeriggio)

- **Dati:** tutti gli incantesimi, le vie e le capacità di classe sono in `js/magia.js` (italiano e inglese), con le correzioni della sezione 10. Li leggono regolamento, creazione e scheda di gioco (fase 1, sotto); `js/incantesimi.js` non è più usato da nessuna pagina.
- **Regolamento:** sezioni per classe (Guerriero, Sciamano, Arcanista, Monaco) con tutte le tecniche e gli incantesimi, stati, avversari temibili, debolezze, enigmi ed esempi di combattimento. Le sezioni degli incantatori hanno l'avviso «in arrivo», quella dello Sciamano «in preparazione». Nessun PNG nominato nelle vie.
- **Abilità delle vie rinominate** (prima citavano personaggi): Pugno della Casa → Colpo Demolitore, Filo della Governante → Filo di Rune, Concentrazione di Adele → Quiete Assoluta, Rabbia del Sovrano → Furia Cinerea.
- **Attacco magico:** d20 + mod attributo, senza livello, come l'attacco con l'arma.
- **Crescita delle risorse nel codice:** tutte (ira, natura, mana, fede) + mod attributo + nuovo livello, senza dado (`saliDiLivello` in gioco.html).

---

## 15. Fase 1: creazione e scheda (25/10/2026, sera)

Fatto:
- **Creazione:** scelta della scuola principale (due per classe), poi 3 incantesimi di livello 1: 2 della scuola principale e 1 dell'altra. La capacità di classe (Luce / Lume Arcano) è sempre disponibile e non occupa posti. Nel personaggio si salvano `scuola` e `incantesimi` (solo gli id di `magia.js`).
- **Scheda:** capacità di classe, incantesimi preparati (n/posti), posti liberi con pulsante «Scegli», via di prestigio dal livello 3 (stessa finestra «Scegli per sempre» delle tecniche, provvisoria in attesa dei dialoghi con Aldo e Guendalina).
- **Posti:** come le tecniche, 2 / 4 / 5 / 6 / 7 della scuola principale, più 1 dell'altra scuola di qualsiasi livello sbloccato. Si cambiano riposando; un posto nuovo si riempie subito.
- **Luce nel buio:** funziona come prima (il dungeon si illumina con la capacità di classe).
- **Vecchi incantatori:** Arcanisti e Monaci creati prima delle scuole non si possono più giocare; la pagina iniziale li segnala e si eliminano con il pulsante di sempre.

Non ancora fatto:
- **Usi fuori dallo scontro** (Scopri Carte +2 Sapienza, Manto d'Ombra +2 Furtività, ecc.).
- **Vulnerabilità** dei nemici (Luce sui mastini, ecc.) e resistenza del sovrano all'Ombra: nessuna è ancora applicata in combattimento.

## 16. Fase 2: Arcanista in combattimento (25/10/2026, sera)

Fatto, in `js/magia_combattimento.js` (regole) con test in `tests/magia_combattimento.test.js` (49 casi, dadi programmati) e prove nel browser:
- **Tutti i 30 incantesimi di Arcano e Forza e le 6 abilità delle vie Frattura e Sutura.**
- **Sigilli:** massimo 3 (2 sui boss), per tutto lo scontro; compaiono nella scheda del nemico come rombi.
- **Detonazione:** consuma tutti i Sigilli, +1d6 per Sigillo; recupero mana 1/1/2/2/3 per livello, doppio con il massimo dei Sigilli. Implosione e Crollo contano come indicato nei testi; Singolarità sempre doppia; Cataclisma Cinetico è una sola Detonazione.
- **Attacco magico** d20 + Mente contro la CA, **dadi senza modificatore** (tranne Singolarità: + Mente), critico = dadi doppi (Esposto lo allarga, Occhio del Tomo e Maglio Invisibile 19-20). **Tiro salvezza** del nemico: d20 + Vigore contro 8 + Mente + livello. I boss ignorano Bloccato, Silenzio e Frastornato e usano il ripiego scritto nell'incantesimo.
- **Difese** (Specchio di Rune, Barriera Cinetica, Respingere) consumano l'azione e non si usano due turni di fila; Scudo +2 CA, Muro di Forza +3 CA e la Presa non ti tiene; Invulnerabilità annulla ogni danno fino al tuo turno, Soffio compreso.
- **Una volta per riposo:** Parola Vera, Singolarità, Invulnerabilità.
- **Sala di prova** (`tutorial.html?prova`): selettore Arcanista con tutti gli incantesimi sbloccati.

Scelte dove il testo non bastava (da confermare):
1. **Senza Sigilli la Detonazione non fa nulla** (né danno né mana). L'Arcanista di sola Forza parte quindi con la sola ricarica del critico (1 Sigillo).
2. **Spezzare il Vincolo:** Indebolito *e* CA −2 solo se il nemico fallisce il tiro salvezza.
3. **Colpo Demolitore:** il bonus «ogni Detonazione fa Sbilanciato 1» parte solo se l'attacco colpisce.
4. **Crollo Arcano** non è una Detonazione (nessun recupero oltre al rimborso se il nemico cade); richiede almeno 1 Sigillo, come Implosione e Singolarità.
5. **Disfare:** la Presa del mastino si risolve subito, quindi «ti libera dalla Presa» diventa «il nemico non può più afferrarti in questo scontro».
6. **Durate:** contano turni del nemico, come per il Guerriero (un incantesimo da «3 turni» lanciato adesso copre i suoi prossimi tre turni).
7. **Pressione:** 1d6 forza all'inizio di ciascuno dei suoi 2 turni, insieme a Indebolito 2.
8. **Quiete Assoluta:** senza Sigilli si paga il costo normale (con gli sconti del Tomo).

## 17. Fase 3: Monaco in combattimento (25/10/2026, sera)

Fatto, nello stesso motore (`js/magia_combattimento.js`), con 30 incantesimi di Luce e Ombra e le 6 abilità delle vie Cenere e Brace, 30 test nuovi e prove nel browser (gioco e sala di prova con selettore Monaco):
- **Bilancia** da −3 (Ombra 3) a +3 (Luce 3), parte da 0 a ogni scontro, ogni incantesimo di Luce/Ombra la sposta di 1 (il valore conta *prima* del lancio). Si vede nella scheda.
- **Aureola** (Luce 2-3): cure +2 e +1 al tiro salvezza contro il Soffio. **Velo** (Ombra 2-3): +1 dado di danno. **Zenit** (Luce 3) e **Nadir** (Ombra 3): l'incantesimo della scuola opposta è un **Crepuscolo**.
- **Crepuscolo:** +1 dado (danno o cura), recupero di fede 1/1/2/2/3 per livello (doppio se parte da Nadir), poi la Bilancia torna a 0. **Nadir:** ogni incantesimo d'Ombra costa 1 punto di salute mentale (non letale).
- **Stati nuovi:** Accecato (il nemico tira 2d20 e tiene il peggiore, anche per il Manto d'Ombra), Avvizzito (1d4, o 1d6 dove indicato, a inizio turno; sui boss al massimo 3 turni), Terrore (−2 ai tiri salvezza del nemico).
- **Effetti con durata:** Santuario, Voto di Luce, Corona di Raggi, Fiamma Calda, Cerchio del Focolare, Ombra Gemella, Notte Senza Fine, Furia Cinerea, Seconda Vita (una volta per scontro).

Scelte dove il testo non bastava (da confermare):
1. **Furia Cinerea** blocca la Bilancia a Ombra 3: finché dura, gli incantesimi di Luce *non* sono Crepuscolo (altrimenti sarebbero un recupero doppio gratuito).
2. **Eclisse** costa 1 punto mentale in ogni caso, ma non 2 se lanciata a Nadir.
3. **Giudizio** conta i punti di Luce *prima* del lancio e poi azzera; **Abbraccio del Vuoto** porta la Bilancia a Ombra 3 anche se manca.
4. **Ombra Gemella** si applica a ogni incantesimo del Monaco che va a segno (attacco colpito, danno senza tiro, tiro salvezza fallito), anche di Luce.
5. **Rancore** conta i colpi che il nemico ti mette a segno in questo scontro (massimo 3), anche se poi vengono dimezzati o annullati.
6. **Fuoco che Cura:** l'eccesso è la cura tirata meno la salute che ti mancava.
7. **Seconda Vita** si lancia in qualunque momento del tuo turno, una volta per scontro; la cura arriva dopo il danno.
8. **Divorare** tira un dado per ogni turno di Avvizzito rimasto; **Purificazione** non toglie bruciature perché nel gioco non esistono ancora.
9. **Sovrano che resiste all'Ombra** e vulnerabilità: da applicare quando ci sarà lo scontro finale.
