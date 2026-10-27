# Guerriero — Tecniche con lo scudo e vie di prestigio (v3, implementata)

Versione finale, ora nel codice. Le regole stanno in `js/combattimento.js`; le tecniche (italiano e inglese) in `js/tecniche.js`. Segue le regole degli altri rami: d20 contro CA, tiri salvezza con CD = 8 + mod Vigore + livello, durate in turni del nemico, immunità dei boss, critico = 20 sul d20 con il doppio dei dadi.

Lo scudo non è un'arma: le sue tecniche si usano con **qualsiasi arma a una mano** e danno **un posto in più** (di qualsiasi livello). Tema: **Risacca** (assorbire i colpi e restituirli) e **Postura** (difendersi e togliere al nemico i suoi attacchi speciali).

---

## 1. Problemi trovati nella lista originale

| # | Problema | Dove | Soluzione |
|---|---|---|---|
| 1 | I nemici non hanno Punti Furia né altre risorse | 2, 4, 7, 10, 12, 13, 14 | La "furia nemica" diventa i suoi **attacchi speciali** (Presa, Soffio), che il gioco ha già; "rubare furia" diventa recuperare ira |
| 2 | Risorsa "Punti Vigore/Scudo", costi da 1 | Tutte | La risorsa è l'ira; costi allineati agli altri rami: L1 2-3, L2 4-5, L3 5-6, L4 7-8, L5 9-10 |
| 3 | Percentuali (−25% danni, 30% restituito, +50% Resilienza) | 1, 3, 9 | Diventano **metà danni** o **0 danni**, come la Parata |
| 4 | "Ignora l'armatura" | 8 | I nemici hanno solo la CA: diventa **colpisce senza tiro per colpire** |
| 5 | Danni subiti convertiti in ira invece che in salute | 9 | Troppo forte, e l'ira cresce già con i colpi subiti: diventa ira doppia |
| 6 | Raddoppia la tua risorsa, blocca il nemico per tutto lo scontro | 14 | Troppo forte: Cariche al massimo e blocco a turni |
| 7 | Danni pari a tutti quelli tentati nello scontro, azione extra, "consuma tutto" | 15 | Ridimensionata sulle Cariche, una volta per riposo come gli altri livello 5 |
| 8 | 4 colpi nella Tempesta | 13 | Portati a 3, come le altre Cateratte |
| 9 | Contro i boss "Inibito" non funziona (immuni) | 5, 12, 14 | Ripiego per i boss su Indebolito e Sbilanciato |
| 10 | Le 6 tecniche di scudo attuali si sovrappongono | Codice | Tolte tutte (vedi Decisioni) |

## 2. Regole nuove

**Colpo di scudo.** Le tecniche che colpiscono con lo scudo usano **1d4 + mod Vigore**, oppure il dado indicato. Il tiro per colpire è quello normale.

**Assorbire un colpo.** Come la Parata, vale per il primo colpo che ti va a segno prima del tuo turno successivo (salvo dove detto "ogni colpo").
- **Metà danni** (arrotondati per difetto): il colpo è andato a segno, quindi dà l'ira normale.
- **0 danni**: il colpo è annullato e non dà ira. Unica eccezione: Batteria Cinetica.

**Carica Cinetica** (stato del personaggio, l'identità del ramo, come Incrinatura per le contundenti ed Esposto per le perforanti):
- Si guadagna quando una tecnica di scudo assorbe un colpo, o dove indicato.
- **Massimo 3, anche contro i boss.** Le cariche oltre il massimo vanno perse.
- Dura tutto lo scontro e si azzera alla fine.
- Si spende con le tecniche di Rilascio (Onda di Ritorno, Egida del Vuoto e le abilità della via di Aldo).

**Niente difesa due turni di fila.** Le tecniche di scudo che consumano l'azione non si possono usare nel turno subito dopo un'altra tecnica di scudo che consuma l'azione: in quel turno compaiono come non disponibili. Serve a evitare un personaggio intoccabile finché ha ira. Le Parate degli altri rami restano come sono.

## 3. Le 15 tecniche con lo scudo

| Liv | Tecnica | Costo | Effetto |
|---|---|---|---|
| 1 | Assorbimento Minimale | 3 | Colpo di scudo; il primo colpo subito fa metà danni e ti dà 1 Carica |
| 1 | Postura Salda | 2 | Consuma l'azione; +3 CA fino al tuo turno e la Presa non ti afferra; se il nemico ti manca, 1 Carica |
| 1 | Rimbalzo della Marea | 3 | Consuma l'azione; il primo colpo subito fa metà danni, l'altra metà colpisce il nemico senza tiro; 1 Carica |
| 2 | Batteria Cinetica | 4 | Consuma l'azione; il primo colpo subito fa 0 danni ma ti dà l'ira come se fosse andato a segno; 1 Carica |
| 2 | Spinta della Risacca | 4 | Colpo di scudo 1d6; tiro salvezza → perde l'attacco speciale pronto (il Soffio va ricaricato) e Inibito 1; se resiste (o è un boss) Sbilanciato 1 |
| 2 | Muro di Assorbimento | 5 | Consuma l'azione; il primo colpo subito fa 0 danni e ti dà 3 Cariche |
| 3 | Inversione della Marea | 5 | Colpo di scudo; se il nemico ti ha colpito nel suo ultimo turno, +1 dado e +2 CA per 2 turni |
| 3 | Onda di Ritorno | 6 | Spendi tutte le Cariche (almeno 1): 1d6 per Carica + mod Vigore, senza tiro per colpire |
| 3 | Baluardo d'Acciaio | 6 | Consuma l'azione; per 2 turni +2 CA, ogni colpo subito ti dà il doppio dell'ira e 1 Carica |
| 4 | Risucchio della Voragine | 7 | Colpo di scudo 1d6, +1 dado; se colpisce, 1 Carica e recuperi 1d4 ira |
| 4 | Postura del Mare Profondo | 8 | Consuma l'azione; fino al tuo turno ogni colpo subito fa 0 danni e ti dà 1 Carica; all'inizio del tuo turno l'onda colpisce senza tiro per 1d6 + mod Vigore per ogni colpo assorbito |
| 4 | Frantumazione della Riserva | 8 | Colpo di scudo 1d6, +1 dado; tiro salvezza → Inibito 2 + Indebolito 2 (boss: Indebolito + Sbilanciato 2) |
| 5 | Tempesta di Risacca | 10 | 3 colpi di scudo col solo dado, ognuno a segno dà 1 Carica; 3 su 3 + tiro salvezza → Stordito 1 (boss: Sbilanciato 2) |
| 5 | Ancoraggio del Cosmo | 9 | Consuma l'azione; il primo colpo subito fa 0 danni; Cariche al massimo; tiro salvezza → Inibito 3 (boss: Indebolito 2) |
| 5 | Egida del Vuoto Assoluto | 10 | Una volta per riposo; consuma l'azione; fino al tuo turno ogni colpo fa 0 danni e ti dà 1 Carica; all'inizio del tuo turno, senza spendere l'azione, rilasci 2d6 per Carica + mod Vigore senza tiro, e le Cariche si azzerano |

Note:
- **Inversione di Furia** diventa **Inversione della Marea**: il confronto tra Punti Furia non si può fare, al suo posto la vendetta sul colpo appena subito.
- **Egida del Vuoto**: con 3 Cariche fa in media 21 + mod Vigore senza tiro, poi hai ancora il tuo turno. È il posto della "azione extra" originale.
- **Onda di Ritorno**: basta 1 Carica, così a livello 3 non serve per forza il Muro per prepararla. Sparare subito o aspettare di averne 3 è una scelta del giocatore.

## 4. Vie di prestigio con lo scudo (dal livello 3)

Stessa scelta degli altri rami (Aldo o Guendalina, `sceglieVia`) e stessa struttura. **Al riposo si sceglie quale serie della via preparare**, quella dell'arma o quella dello scudo; quelle dello scudo si usano solo con lo scudo imbracciato. In tutto: **una abilità della via per livello** (3, 4, 5), attiva, che non occupa posti. Le due classi della lista originale diventano le due vie: **Aldo = Risacca** (accumulare e restituire, in linea con Spezzare e Penetrazione) e **Guendalina = Postura** (controllo e protezione, in linea con Controllo e Precisione).

### Problemi trovati nella lista delle classi di prestigio

| # | Problema | Dove | Soluzione |
|---|---|---|---|
| 1 | 2 abilità su 3 per livello, molte passive | Tutte | Il gioco dà 1 abilità della via per livello: le passive migliori diventano l'effetto "finché…" dell'abilità attiva, come Marchio del Guardiano e Sigillo del Demolitore |
| 2 | Furia del nemico (drenare, azzerare, nemico a zero furia) | Postura A2, A3, B2, B3, C1, C3 | Diventa "Inibito", con ripiego per i boss, e ira per te |
| 3 | Cariche massime +2, Cariche che non decadono | Risacca A1, C1 | Le Cariche durano già tutto lo scontro; il massimo resta 3 (deciso) |
| 4 | Percentuali (15% respinto, 40%, +25% per carica, 50% di non consumare, +30% Difesa, +20% danni, 15% e 20% dei PV) | Quasi tutte | Convertite in dadi, metà danni e CA |
| 5 | Danno pari a tutti i colpi parati nello scontro | Risacca C3 | Contatore dei colpi assorbiti, con tetto |
| 6 | Raddoppia la tua risorsa, nemico senza azioni offensive | Postura C3 | Troppo forte: diventa controllo a turni con ripiego per i boss |
| 7 | Costi 2-6 PS | Attive | Allineati alle altre vie: 5-6, 8, 10 |

### Via di Aldo — Risacca

| Liv | Abilità | Costo | Effetto |
|---|---|---|---|
| 3 | Marea Elastica | 6 | Colpo di scudo; il primo colpo subito fa metà danni e ti dà 2 Cariche. Per tutto lo scontro, finché hai almeno 2 Cariche, ogni colpo che ti va a segno restituisce 1d4 al nemico senza tiro |
| 4 | Onda di Rimbalzo | 8 | Se hai Cariche: colpo di scudo 1d6 con +3 per colpire e +1 dado per Carica, le Cariche si consumano; altrimenti, il primo colpo subito fa metà danni e ti dà 2 Cariche |
| 5 | Ritorno dello Tsunami | 10 | Spendi tutte le Cariche (almeno 1): senza tiro, 1d6 per Carica + 1d4 per ogni colpo assorbito in questo scontro (massimo 3) + mod Vigore; dopo il rilascio ti resta 1 Carica |

- **Marea Elastica** riunisce Assorbimento Rapido (2 Cariche) ed Elasticità della Marea (danno restituito).
- **Onda di Rimbalzo** prende "+25% per carica" da Cinetica Violenta come +1 dado per Carica, e "ignora il 50% dell'armatura" come +3 per colpire. Con un 20 naturale i dadi raddoppiano: è il picco del ramo, ma richiede il tiro.
- **Ritorno dello Tsunami** prende "1 carica resta attiva" da Marea Inarrestabile. Al massimo fa 3d6 + 3d4 + Vigore (circa 18 + Vigore) senza tiro, ed è ripetibile: più forte di Onda di Ritorno, meno dell'Egida, che è una volta per riposo.
- I colpi assorbiti sono quelli andati a segno che una tecnica di scudo ha ridotto a metà o a 0 danni. Un attacco mancato, anche grazie a Postura Salda, non conta.

### Via di Guendalina — Postura

| Liv | Abilità | Costo | Effetto |
|---|---|---|---|
| 3 | Drenaggio d'Urto | 5 | Colpo di scudo; tiro salvezza → Inibito 1 (boss: Indebolito 2); +2 CA fino al tuo turno; se il nemico ti manca, +1 ira e 1 Carica |
| 4 | Sigillo del Monolito | 8 | Colpo di scudo 1d6, +1 dado; tiro salvezza → Inibito 2 (boss: Indebolito + Sbilanciato 2); +2 CA per 2 turni; prossima tecnica −2 ira |
| 5 | Fortezza Eterna | 10 | Colpo di scudo 1d6, +1 dado; Inibito 3 + Indebolito 3 (boss: Indebolito + Sbilanciato 2); per 3 turni +2 CA e, una volta per scontro, il primo colpo che ti porterebbe a 0 salute ti lascia a 1 e ti dà 3 Cariche |

- **Drenaggio d'Urto** riunisce Drenaggio d'Urto e Parassita Posturale (il nemico che ti manca ti "regala" ira).
- **Sigillo del Monolito** riunisce Sigillo e Postura di Marmo (+2 CA), con lo sconto sulla tecnica successiva come Ritmo del Duello e Cadenza della Campana.
- **Fortezza Eterna** prende il colpo mortale assorbito dalla passiva omonima e il blocco del nemico dal Trono di Pietra. Il nome "Il Trono di Pietra" è tolto per non confondersi con il Trono di Cenere del finale.
- Ancoraggio Magnetico (immunità allo sbilanciamento) è già nella tecnica Postura Salda (la Presa non ti afferra).

## 5. Decisioni (24/10/2026)

1. **Tecniche di scudo attuali** (Carica d'Impatto, Schiaffo di Piastra, Scudo Frontale, Balzo, Scagliata, Colpo di Guardia): tolte tutte. Nei salvataggi diventano posti vuoti, come negli altri rami.
2. **Carica Cinetica:** massimo 3 per tutti, boss compresi.
3. **Batteria Cinetica:** dà ira anche se il colpo è annullato (unica eccezione alla regola della Parata).
4. **Onda di Ritorno:** basta 1 Carica.
5. **Niente difesa due turni di fila** per le tecniche di scudo che consumano l'azione.
6. **Vie di prestigio:** anche lo scudo ha le sue, Aldo = Risacca e Guendalina = Postura.
7. **Arma o scudo per le abilità della via:** si sceglie al riposo quale serie preparare (scelta B).

## 6. Nel codice

- **Carica Cinetica:** `scontro.cariche` (0-3), `Combattimento.carica()` e `CARICHE_MAX`. Nella scheda del personaggio compare tra gli effetti attivi con tre rombi («· Marea Elastica» quando restituisce i colpi).
- **Assorbimento:** `scontro.assorbe = { tipo }` con `meta`, `rimbalzo`, `zero`, `zeroIra` (Batteria) e `tutti` (Mare Profondo, Egida). `colpoSubito(s, ctx, crit, danno)` ora riceve il danno già tirato e restituisce `{ annullato, danno, ira, eventi }`; la Parata degli altri rami funziona come prima.
- **Colpo mancato:** `colpoMancato(s, ctx)` per Postura Salda e Drenaggio d'Urto. **Presa:** `presaBloccata(s)`.
- **Inizio del tuo turno:** `inizioTurnoPg(s, ctx)` rilascia l'onda del Mare Profondo e dell'Egida, sblocca la regola dei due turni e prepara la vendetta dell'Inversione.
- **Niente difesa due turni di fila:** tecniche con `difesa: true`; `disponibile(t, s)` si controlla prima di spendere l'ira (anche per `servonoCariche`: Onda di Ritorno, Ritorno dello Tsunami). Il pulsante non spende ira e il turno resta tuo.
- **Fortezza Eterna:** `fortezza(s, danno, pv)`, chiamata in `dannoAlPg`, quindi vale anche per Soffio e Presa.
- **Serie della via:** `usate.viaSerie` («arma» o «scudo»), si sceglie nella finestra di preparazione al riposo; la finestra della scelta della via mostra anche le abilità dello scudo.
- **Assorbimento solo sugli attacchi:** morso, zampata, spada. Il Soffio è un tiro salvezza e non si assorbe; la Fortezza però lo ferma.
- **Salvataggi:** le sei vecchie tecniche di scudo diventano posti vuoti.
- **Regolamento:** aggiunti Carica Cinetica, assorbimento, regola dei due turni e serie della via (italiano e inglese).

## 7. Test

- `node tests/combattimento.test.js`: 103 test delle regole (22 nuovi per lo scudo e le sue vie).
- `node tests/combattimento.browser.js`: 60 test nel browser (12 nuovi: sala di prova con lo scudo, Muro, Egida, partita con Assorbimento, regola dei due turni, Postura Salda e Presa, Fortezza Eterna, serie della via al riposo, finestra della via, salvataggi, creazione, regolamento, inglese). Con `SOLO="testo"` se ne lanciano solo alcuni.
- **Sala di prova:** `tutorial.html?prova`, spunta «Scudo imbracciato» e scegli la «Serie della via».
