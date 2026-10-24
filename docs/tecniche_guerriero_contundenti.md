# Guerriero — Tecniche contundenti e vie di prestigio (v4, implementata)

Versione finale, ora nel codice. Le regole stanno in `js/combattimento.js`; le tecniche (italiano e inglese) in `js/tecniche.js`.

Revisione della lista proposta (mazze, martelli, magli) per adattarla alle regole già in uso con il taglio: d20 contro CA, tiri salvezza con CD = 8 + mod Vigore + livello, stati del gioco, durate in turni del nemico, immunità dei boss. Tema: **Stordimento** (controllo) e **Spezzare** (armatura e guardia).

---

## 1. Problemi trovati nella lista originale

| # | Problema | Dove | Soluzione |
|---|---|---|---|
| 1 | Percentuali (−10% Difesa, −20% Precisione, 40% di fallire, 50% di stordire) | Quasi tutte | Il gioco ragiona in CA, malus fissi e tiri salvezza: convertite |
| 2 | "Difesa Fisica" e "Precisione" non esistono | 1, 2, 8, 10, 13, 14 | Diventano CA e "per colpire" |
| 3 | Attacchi ad area ("tutti i nemici") | 7, 14 | Gli scontri sono uno contro uno: effetti su un solo bersaglio |
| 4 | Mente Annebbiata blocca le risorse del nemico, che non ne ha | 7 | Sostituita |
| 5 | Costi fuori scala (1 PI al livello 1, 7 PI al livello 3) | 1, 9 | Allineati al taglio: L1 2-3, L2 4-5, L3 5-6, L4 7-8, L5 9-10 |
| 6 | Stordimento garantito al livello 3 | 9 Colpo del Coma | Serve un tiro salvezza, come Eco del Metallo |
| 7 | Armatura azzerata, −50% Difesa, +50% danni per tutto lo scontro, azione extra, ignora l'armatura | 11, 14, 15 | Troppo forti: ridimensionati |
| 8 | 4 colpi nella Cateratta (il taglio ne ha 3) | 13 | Portati a 3 |
| 9 | Contro i boss quasi tutto è inutile (immuni a Stordito e Frastornato) | Ramo intero | Ogni tecnica di controllo ha un ripiego per i boss, e lo Spezzare funziona anche su di loro |
| 10 | "Consuma tutta l'ira" sulla Sentenza | 15 | Tolto: basta il costo 10 e il limite di una volta per riposo |

## 2. Stati nuovi

Il taglio ha il sanguinamento; il contundente ha bisogno di un suo stato che **funzioni anche contro i boss**, altrimenti il ramo perde proprio gli scontri che contano.

| Stato | Effetto | Boss |
|---|---|---|
| **Incrinatura** | −1 CA per carica, fino a 3 cariche, dura tutto lo scontro. **È l'unico effetto che si somma** invece di rinnovarsi | Sì, massimo 2 cariche |
| **Frattura** | Il nemico subisce 1d4 ogni volta che attacca (anche Presa e Soffio), prima del tiro | Sì |

Incrinatura e Sbilanciato si sommano: la CA può scendere al massimo di 5 (3 + 2), di 4 per un boss (2 + 2).

**Cariche massime:** 3 per un nemico comune, 2 per un boss. Le abilità che chiedono le cariche massime scattano a 3 sui comuni e a 2 sui boss; le cariche oltre il massimo vanno perse.

## 3. Le 15 tecniche contundenti

| Liv | Tecnica | Costo | Effetto |
|---|---|---|---|
| 1 | Colpo del Maglio Incrinante | 2 | Incrinatura 1 |
| 1 | Percossa al Mento | 2 | Indebolito 1; nel suo prossimo turno il nemico non può fare critici |
| 1 | Impatto Sbilanciante | 3 | Sbilanciato 1 + Indebolito 1 |
| 2 | Frantumazione dello Scudo | 4 | Incrinatura 2 |
| 2 | Mazzata Tremante | 5 | Tiro salvezza → Frastornato 1; se resiste (o è un boss) Sbilanciato 1 |
| 2 | Spezza-Costole | 5 | +1 dado; Frattura 2 |
| 3 | Martellata Sismica | 5 | Incrinatura 1 + Sbilanciato 2 |
| 3 | Impatto Demolitore | 6 | +1 dado; Incrinatura 2 |
| 3 | Colpo del Coma | 6 | Tiro salvezza → Stordito 1; se resiste (o è un boss) Indebolito 2 |
| 4 | Spezza-Ginocchia | 8 | +1 dado; Indebolito 3 + Sbilanciato 3 |
| 4 | Demolizione della Guardia | 8 | Due attacchi col solo dado; se vanno a segno entrambi: Incrinatura 2 + tiro salvezza → Stordito 1 (boss: Sbilanciato 2) |
| 4 | Contro-Schiacciamento | 7 | Consuma l'azione; il primo colpo subito fa 0 danni, contrattacco + Incrinatura 1 |
| 5 | Cateratta della Roccia Infranta | 10 | 3 attacchi col solo dado, ognuno a segno dà Incrinatura 1; 3 su 3 + tiro salvezza → Stordito 1 (boss: Sbilanciato 2) |
| 5 | Impatto del Cataclisma | 9 | +1 dado; Incrinatura 3 + Sbilanciato 3 |
| 5 | Sentenza del Maglio Titanico | 10 | Una volta per riposo; +5 per colpire, dadi doppi, Frattura per tutto lo scontro; tiro salvezza → Stordito 1 |

Note:
- Contro-Schiacciamento segue la Parata Mutilante: il colpo annullato non dà ira.
- I boss hanno Indebolito e Sbilanciato limitati a 2 turni, come oggi.
- "Spezza-Ginocchia Mutilante" diventa "Spezza-Ginocchia": «mutilare» è lessico del taglio.
- "Sentenza della Mazza Titani" rinominata per non confondersi con la Sentenza del Boia della via di Aldo.

## 4. Vie di prestigio (dal livello 3)

Stessa scelta del taglio (Aldo o Guendalina, `sceglieVia`), ma con abilità diverse in base all'arma. Confermato: **Aldo = Spezzare** (punire, demolire), **Guendalina = Controllo** (stordire, proteggersi).

| Via | Liv | Abilità | Costo | Effetto |
|---|---|---|---|---|
| Aldo | 3 | Sigillo del Demolitore | 6 | Incrinatura 2; finché ha le cariche massime, +1d4 agli attacchi normali |
| Aldo | 4 | Crollo | 8 | Se ha Incrinatura: +1 dado per carica e le cariche si consumano; altrimenti Incrinatura 2 |
| Aldo | 5 | Martello del Mastro | 10 | Se ha le cariche massime e colpisci: sempre critico + Frattura per tutto lo scontro |
| Guendalina | 3 | Rintocco | 5 | Tiro salvezza → Frastornato 1 (boss: Indebolito 2); +2 CA fino al tuo turno |
| Guendalina | 4 | Cadenza della Campana | 8 | +1 dado; tiro salvezza → Stordito 1 (boss: Indebolito + Sbilanciato 2); prossima tecnica −2 ira |
| Guendalina | 5 | Silenzio della Casa | 10 | +1 dado; Indebolito + Sbilanciato 3; niente attacchi speciali 2 (boss: +4 ai tuoi tiri salvezza e prove contrapposte per 3 turni); +2 CA per 3 turni |

## 5. Decisioni (24/10/2026)

1. **Incrinatura sui boss:** massimo 2 cariche.
2. **Frattura:** scatta a ogni attacco del nemico.
3. **Vie:** confermate, Aldo = Spezzare e Guendalina = Controllo.
4. **Frantumazione dello Scudo:** nessun nemico ha bonus temporanei alla CA, quindi resta solo Incrinatura 2. Se in futuro ne arriveranno, si potrà aggiungere l'annullamento.
5. **Tecniche contundenti attuali:** vengono tolte e diventano posti vuoti nei salvataggi esistenti, come per il taglio.

## 6. Revisione critica (24/10/2026)

Confronto con il taglio, tecnica per tecnica, per tenere i due rami allo stesso livello di potenza.

| Tecnica | Prima | Ora | Motivo |
|---|---|---|---|
| Demolizione della Guardia | Due attacchi normali | Due attacchi col solo dado | Facevano più danno della Cateratta di livello 5 |
| Colpo del Coma | +1 dado finché stordito; ripiego Indebolito 2 + Sbilanciato 1 | Ripiego Indebolito 2, niente dado extra | Lo stordimento scade prima del tuo attacco; ripiego doppio rispetto a Eco del Metallo |
| Impatto del Cataclisma | Incrinatura 3 + Sbilanciato 3 + Frastornato 2 | Incrinatura 3 + Sbilanciato 3 | Tre effetti contro i due di Diluvio Rosso, stesso costo |
| Contro-Schiacciamento | Contrattacco + Incrinatura 1 + Frastornato | Contrattacco + Incrinatura 1 | Allineato alla Parata Mutilante |
| Spezza-Ginocchia | Costo 7, nome "Mutilante" | Costo 8 | Valeva la Mutilazione del Carnefice (8) |

Restano così, dopo verifica:
- **Incrinatura** permanente già al livello 1: è l'identità del ramo, con tetto di 3 cariche (2 sui boss).
- **Frattura** equivale a un sanguinamento, ma non scatta se il nemico è stordito: scelta voluta tra stordire e fratturare. Non dà ira.
- **Sigillo del Demolitore** ha un bonus permanente, bilanciato da Crollo che consuma le cariche.
- **Fendente della Vipera** (taglio) resta senza ripiego, a differenza di Mazzata Tremante.

## 7. Nel codice

- **Incrinatura:** `scontro.crepe` (cariche, non scade con i turni). `Combattimento.malusCA(s)` somma Sbilanciato e Incrinatura e la usano gioco, sala di prova e test. Nella scheda del nemico compare con i rombi delle cariche (3, o 2 sui boss).
- **Frattura:** stato `frattura` a turni; quella «per tutto lo scontro» vale 99 turni e nella scheda si legge «tutto lo scontro». Scatta con `Combattimento.frattura()` prima di morso, zampata, Soffio e Presa.
- **Percossa al Mento:** stato nuovo `intontito` (niente critici del nemico per un turno), funziona anche sui boss.
- **Contro-Schiacciamento:** usa la stessa Parata del taglio, con `parataCrepe` che sostituisce il sanguinamento con 1 carica di Incrinatura.
- **Vie:** le abilità della via dipendono dall'arma in mano (taglio o contundente); con un'arma perforante non ce ne sono. La finestra di scelta mostra quelle dell'arma attuale.
- **Regolamento:** aggiunti Incrinatura e Frattura (italiano e inglese).
- **Salvataggi:** le sei vecchie contundenti (Spezzatendini, Schiaccio-Ossa…) diventano posti vuoti.

## 8. Test

- `node tests/combattimento.test.js`: 63 test delle regole (23 nuovi per le contundenti e le loro vie).
- `node tests/combattimento.browser.js`: 37 test nel browser (11 nuovi: sala di prova, partita col martello, boss, via, creazione, regolamento).
- **Sala di prova:** `tutorial.html?prova`, arma «Martello da battaglia» o «Bastone».
