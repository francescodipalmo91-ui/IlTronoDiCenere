# Il Trono di Cenere — Lavoro sul codice della domenica

Preparato l'11/11/2026, aggiornato il 15/11/2026 a fine sessione. Fonte delle regole: `riscrittura_meccaniche.md` e `decisioni_14_novembre.md` (prevale finché i documenti grandi non sono allineati). Si lavora sulla copia del PC, non su GitHub.

## Fatto il 15/11/2026 (motore nuovo, 197 test verdi)

**`js/poteri.js` (fondamenta)**
- TS per stato: Esposto e Scoperto su **Agilità**; Vuoto (Svuotato / Prosciugato) su **Mente**; Maledetto / Condannato su **Spirito**.
- Tipi di danno **forza** e **psichico** (tolto «illusione»); il fuoco sacro resta.
- **Stordito = intero turno**: perde anche l'azione rapida (`puoAzioneRapida`).
- Stati del sovrano: **Furente**, **Maledetto → Condannato** (cure dimezzate, poi niente cure), **Svuotato → Prosciugato** (spengono un per scontro, poi anche un giornaliero, fino a fine scontro).
- **Scudi di PF**: uno alla volta, assorbono prima della salute (anche i danni continuativi), il danno assorbito non è «danno subito».

**`js/specializzazioni.js` (catalogo)**
- Otto specializzazioni: Berserker / Paladino, Funghi / Legno, Realtà / Illusione, Sangue / Ossa; 11 poteri ciascuna. Purificatore tolto.
- Scala 2-1-1 / 3-1-1 / 3-2-2 / 3-3-2 / 3-3-3: al livello 1 si scelgono 2 a volontà su 3, 1 per scontro su 3, 1 giornaliero su 2; il terzo a volontà arriva da solo al 2; al 3 per scontro e giornaliero (il rimasto o il terzo); al 4 per scontro (il rimasto o il quarto); al 5 il finale.
- Privilegi di classe ai livelli 1 / 3 / 5; vie di Aldo e Guendalina al livello 2 con poteri ai livelli 2, 3 e 4.
- I vecchi nomi (esecutore, sentinella, spore, linfa, ossomante) portano ai nuovi.

**`js/scontro.js` (poteri e regole)**
- Logica di tutti i poteri nuovi: Legno (scudi, Scorza viva, Ghianda, Corazza, Foresta), Realtà (Frattura +2, Spezzare la materia, Punto di rottura, Collasso), Sangue nel Monaco (Spirito, Sangue versato al 10%, niente cure), Illusione e Ossa alleggerite.
- **Azione rapida** (una per turno): cambiare arma tra **due armi**, bere pozione o elisir (Infuso). **Colpo gratuito** (solo dado dell'arma, niente bonus né critico); *Senza scampo* lo usa. Consumo alla dichiarazione (già così, ora con test).
- Vie spostate di un livello; *Mani che curano* vale solo su pozioni ed elisir; Infuso al livello 5, massimo 2.
- Gancio `statiCorti` per l'armatura integra del sovrano (stati di 1 turno, niente aggravamento): pronto, non ancora usato.

**Pagine**
- `prova.html` (sala di prova): scelte nuove a ogni livello, seconda arma e pulsanti dell'azione rapida (cambia arma, pozione), scudo di PF e poteri spenti nella scheda, armi comuni a griglia, test «Regole generali».
- `creazione.html`: scelta di 2 a volontà su 3 più per scontro e giornaliero; privilegi 1/3/5 nella scheda della classe.
- `gioco.html`: via dal livello 2, focus solo degli incantatori, Infuso dal 5, elisir come azione rapida, Sangue versato al 10%.
- Test: `tests/scontro_regole.test.js` nuovo; gli altri riscritti sulle specializzazioni nuove.

**Assunzioni prese (da confermare)**
1. *Legame del sottobosco* porta a 4 turni solo gli stati da 3 (non Stordito né Impaurito).
2. Il bonus del focus si somma a quello dell'arma per i poteri degli incantatori.
3. **Funghi:** i poteri fanno danno di **veleno** qualunque arma (regola dell'11/11: gli incantatori tengono il tipo dei poteri). Così cade la vecchia sinergia «Funghi + arma da taglio = Sanguinante + veleno».
4. Pozione nella sala di prova: 1/4 della salute massima, 2 per scontro (valore PROVVISORIO).
5. *Corteccia nuova* senza scudo attivo crea lo scudo a volontà; *Corazza di quercia* e *Sovraccarico* senza tiro per colpire.
6. *Svuotato* spegne il primo per scontro non usato nell'ordine della scheda.

**Risposte di Francesco alle assunzioni (15/11, mattina):** 1. gli incantatori tengono il tipo di danno dei loro poteri con qualunque arma (trasferiscono la magia all'arma): confermato; 2. Legame del sottobosco solo sugli stati da 3 turni: confermato; 3. bonus del focus sommato a quello dell'arma: confermato.

## Fatto il 15/11/2026, secondo blocco: guardiani e sovrano (212 test verdi)
- `js/nemici.js`: motore dei boss a **fasi**: in ogni fase sequenza a volontà → per scontro → giornaliero, poi un ciclo; i colpi forti si **annunciano un turno prima** (se non c'era il tempo, il boss fa il riempitivo e annuncia); al cambio di fase i colpi non usati si perdono e c'è l'**intervallo** (difesa + attacco semplice). Impaurito o Silenzio della casa: il colpo forte salta. Spezza-carica: il colpo annunciato è perso.
- **Ettore** (34 / 12 / +4 / 1d4 + 2, Agilità +3, Spirito −1): ciclo Pugnalata → Lama nel fianco → «L'ho già vista» (schiva con 17+) → Doppio pugnale; al 50% «Undici» → «Alla dodicesima» (3 turni di due Pugnalate); conteggio da uno a cinque.
- **Enea** (44 / 13 / +4 / 1d8 + 2): ascia sopra il 50%, maglio sotto, Guardia del becchino; **si rialza una volta** con 1d4 + 3.
- **Dafne** (48 / 14 / +6 / 1d8 + 3): **nascosta** (non si può colpire, Percezione CD 12 per trovarla), **stacco** con il corno e il mastino infernale (3 turni, +1 salute a turno), poi lo stocco; una sola Pioggia (di frecce o di stoccate); con la Furtività riuscita parte scovata (−2 CA).
- **Atena** (64 / 15 / +7 / 1d8 + 4): falce, gelo, ombra per terzi di salute. Stato nuovo **Gelato** (−2 per colpire, come Indebolito) → **Congelato** (aggiunge lo Stordito, TS Vigore); *Velo del vuoto* dà 1d4 danni mentali.
- **Sovrano** (100 PF = cenere 70 + carne 30, +8, 1d12 + 4, giornalieri 2d12 + 4): Rabbia (armatura integra: stati di 1 turno e niente aggravamento, immune al Sanguinante, Furente), Maledetto (incrinata, immune al Sanguinante), Vuoto (caduta), carne (CA 13, un colpo senza stati né annunci); CA 16 / 15 / 14 / 13; mappa della cenere e della carne (forza ancora neutra).
- Sala di prova: i boss nella lista, la fase e la coda delle prossime mosse, le barre del sovrano, il pulsante «Cerca Dafne», lo stacco con il mastino (anche nella simulazione).
- Assunzioni: il +1 dei pugnali di Ettore vale per colpire e per i danni; i colpi annunciati contano come colpi caricati (distruggono tutte le Copie); Percezione nella sala di prova = Mente + livello; il ciclo di Atena e di Dafne (non scritto nei documenti) segue quello di Enea.

**Prime misure (giocatore automatico grezzo, 600 scontri, via di Guendalina, arma +0 / +1 / +2 / +3 / +3, nessun set né pergamena): % di vittorie**

| Boss (obiettivo) | Berserker | Paladino | Funghi | Legno | Realtà | Illusione | Sangue | Ossa |
|---|---|---|---|---|---|---|---|---|
| Ettore liv. 2 (quasi sempre) | 98 | 98 | 97 | 94 | 86 | 77 | 91 | 64 |
| Enea liv. 3 (80%) | 74 | 72 | 84 | 96 | 76 | 52 | 96 | 73 |
| Dafne liv. 4 (70%) | 98 | 97 | 80 | 88 | 75 | 88 | 94 | 97 |
| Atena liv. 5 (60%) | 92 | 61 | 97 | 96 | 87 | 10 | 99 | 100 |
| Sovrano liv. 6 contro liv. 5 (50%) | 17 | 9 | 5 | 87 | 44 | 0 | 0 | 10 |

Lettura: il giocatore automatico usa male Copie, scudi e difese, quindi i numeri sono indicativi. Segnali forti: le **placche delle Ossa** quasi annullano i colpi singoli dei boss al livello 5 (riduzione 7 a colpo: Atena 100%); il **Legno** regge il sovrano (87%) mentre le altre classi senza set non arrivano al 50%; **Sangue e Illusione contro la cenere** a zero (immuni, previsto); Dafne troppo facile per quasi tutti; l'Illusione crolla contro Atena (psichico resistito, ombra che toglie i poteri). Le misure vere vanno fatte con l'equipaggiamento del momento (set e pergamene per il sovrano) e giocando a mano.

**Risposte di Francesco (15/11, 11:14):** +1 dei pugnali a colpire e ai danni: sì; colpi annunciati = colpi caricati (distruggono le Copie): sì; **Dafne non si ritira né si risparmia: il giocatore deve ucciderla** (supera la regola del risparmio per Dafne in 8d: niente esito «risparmiata», lo stocco è sempre del giocatore); Atena: la fine resta quella dei due approcci (il secco o accompagnarla).

## Fatto il 15/11/2026, terzo blocco: poteri di armi, armature e accessori (226 test verdi)
- `js/oggetti.js` (nuovo): le 11 armi speciali (Non comuni, Rari +2 con potere per scontro, Leggendari +3 a 1d10 con giornaliero) e 13 pezzi di equipaggiamento con i poteri del 14/11.
- `js/scontro.js`: **attacco con l'arma** (attacco base, nessuno stato) con il potere dell'arma dichiarato sopra (si consuma anche se manca): Danza delle lame (colpo gratuito), Colpo del Giuramento (stato della faccia attiva; cambiare faccia = azione rapida), Punta nella piaga, Raccolto, Albero caduto, Doppia stoccata (due attacchi, stati senza TS), Pioggia di braci; **Segno sulla mappa** si dichiara con un potere di classe.
- Poteri di armature e accessori come **azione rapida** (niente reazioni): Cuoio dell'Ombra (+4 CA fino al tuo turno); cariche di Maglia della Veglia (−4), Mantello del Penitente (metà, mai con la Maglia sullo stesso colpo), Piastre del Rettore e Elmo del Penitente (TS automatico), La risata di Darius (annulla il prossimo attacco, boss compresi), Amuleto della veglia (1d6 + livello a chi ti colpisce), Studio del bersaglio (dado in più solo sul vulnerabile), Piede fermo (+4 al prossimo TS); passivi di Calzari, Talismano, Stivali della lunga caccia; Cinturone (una rapida in più per scontro); Anello della resina (immune allo stato scelto per lo scontro).
- Sala di prova: armi speciali nella scelta dell'arma, riquadro «Equipaggiamento con poteri», pulsanti per l'attacco con l'arma, il potere dell'arma, la faccia del Giuramento e i poteri degli oggetti.
- Non fatti: *«Caius, colpisci!»* dello Spaccatoro (scritto come reazione, da convertire), Fiducia condivisa e Primo passo del Giuramento, poteri dei set (bonus dei pezzi ancora da definire).

## Fatto il 15/11/2026, pomeriggio: regole, boss, cervello, set ed elisir (233 test verdi) — CONGELATO
**Decisione di Francesco (16:42): niente più modifiche al bilanciamento. Il gioco va giocato e testato da umani; le simulazioni non tengono conto di molti aspetti.**

Regole decise oggi:
- **Caratteristica una volta per attacco**, mai per dado o per risorsa (giocatore e nemici); più attacchi separati = la caratteristica su ognuno. Corretti Spirito d'ossa (ora 1d8 per placca + Spirito una volta), Frantumare, Il Grande Inganno.
- **Colpi annunciati restano**, con icone nel registro e nel riquadro del nemico: spada (attacco), spada che vibra (colpo caricato), scudo (difesa). Il colpo annunciato non si perde al cambio di fase.
- **Fasi dei boss, opzione B:** nessuna fase saltata; ogni fase gioca tutta la sua sequenza prima della successiva; il danno resta tutto; il boss può morire in qualunque fase.
- **Arcanista resta d6** (classe volutamente più dura: oggetti, pergamene e pozioni compensano).
- Il giocatore tende ad avere con sé elisir e pozioni rari: **da fare nel gioco** la gestione dell'inventario (togliere, buttare, posare nello sgabuzzino della dispensa).

Codice:
- `js/cervello.js` (nuovo): giocatore automatico a regole per specializzazione (combo, risposta agli annunci, cure, azione rapida: pozione, elisir di stato, poteri di set). Regole leggibili in `docs/cervello_bot.md`.
- **Set del sovrano** nel motore: Odore di Casa (carne 2, **−1** a colpo fisico), Sguardo della Casa (carne 4, rapida, −2 a colpirti), mano libera +2 CA, Ultima Guardia (carne 5); Voce del sangue (cenere 4, rapida, carica: rilancia il primo tiro mancato); clausole del set di cenere sulla mappa del sovrano (mappa originale ripristinata: immune a sangue e psichico). Manca Sentenza dell'erede (solo finale B).
- **Elisir di stato** (6 famiglie): comune cura il lieve, raro anche il grave + 3 turni di immunità; azione rapida; 2 per famiglia.
- Sala di prova: blocco «Set e borsa» (pezzi come nella storia per il nemico scelto, elmo/corona al sovrano, elisir rari/comuni, pozioni), pulsanti in scontro; setup diviso in Chi sei / Armi / Equipaggiamento / Poteri.
- Altre modifiche: Annullamento su Scoperto +2 dadi (era doppio); Sussurro illusorio crea una Copia a ogni colpo; Atena senza vulnerabilità a sangue e veleno né resistenza al psichico; nel registro il bonus del danno tra parentesi.

**Valori dei boss congelati** (misurati con i pezzi di set della storia e 2 elisir rari per famiglia):

| Boss | Salute | CA | Per colpire | Danno |
|---|---|---|---|---|
| Ettore | 42 | 12 | +4 | 1d4+2 |
| Enea | 62 | 13 | +6 | 1d8+2 |
| Dafne | 72 | 15 | +8 | 1d8+3 |
| Atena | 105 | 16 | +10 | 1d10+4 |
| Sovrano | 70 cenere + 40 carne | 16/15/14/13 | +10 | 1d12+4 |

Ultime misure (% di vittorie, giocatore automatico, livello del boss tranne il sovrano contro liv. 5, elmo):

| | Ettore | Enea | Dafne | Atena | Sovrano |
|---|---|---|---|---|---|
| Berserker | 100 | 77 | 97 | 53 | 61 |
| Paladino | 100 | 76 | 96 | 29 | 55 |
| Funghi | 99 | 81 | 66 | 79 | 32 |
| Legno | 100 | 98 | 43 | 94 | 100 |
| Realtà | 85 | 66 | 71 | 77 | 79 |
| Illusione | 89 | 69 | 95 | 68 | 27 |
| Sangue | 95 | 98 | 89 | 93 | 55 |
| Ossa | 100 | 99 | 100 | 100 | 96 |

Da osservare nei test umani (non toccati): le Ossa sempre vincenti; il Guerriero con la spada contro Atena (resiste al taglio: una seconda arma perforante cambierebbe le cose); Legno contro Dafne; Funghi e Illusione contro il sovrano.

## Ancora da fare (in ordine consigliato)
1. **Partita completa giocata da umani** (decisione del 15/11): poi tarare i boss sulle prove vere. Collegare Enea, Dafne, Atena e il sovrano in `gioco.html` (oggi il gioco usa il motore nuovo solo per Ettore e i nemici comuni; scelta del risparmio, evento finale, danni mentali di Atena).
2. ~~Poteri di armi, armature e accessori~~ → fatto il 15/11 (terzo blocco).
3. `creazione.html`: armi comuni a griglia, scelta del focus e del Manganello.
4. **Pulizia del vecchio motore** (`combattimento.js`, `magia_combattimento.js`, `sciamano.js`, `tecniche.js`, `magia.js`, `incantesimi.js`, percorsi doppi `motoreNuovo()` in `gioco.html`), `test.html` e `tutorial.html` sul motore nuovo.
5. ~~Allineare i documenti grandi~~ → fatto il 15/11 (sera): progetto, `docs/` sul PC e GitHub. Resta il regolamento Base / Facoltative.
7. Inventario nel gioco: togliere, buttare o posare oggetti nello sgabuzzino della dispensa (deciso il 15/11).
6. Ancora da decidere: cacce comuni (con la **forza** da assegnare), pergamene, testo del Monaco, stato Appesantito.
