# Il Trono di Cenere — Loot casuale (prima versione)

Bozza del 13/11/2026 da lavorare insieme; **aggiornata il 17/11/2026** su `decisioni_17_novembre.md` (limiti di classe, focus, dotazione, bottino della partita), **il 18/11/2026** su `decisioni_18_novembre.md` (vuoti, set di classe, quota per classe) e **il 19/11/2026** sulla sessione oggetti (`decisioni_19_novembre.md` sez. 5: vesti, focus a due forme, armatura pesante, quota 60/40). Tutto ⚠ proposta da approvare; i numeri sono ipotesi da misurare con `serie_scontri.js`. Collegato a `oggetti_per_rarita.md` (sezioni 5, 6, 7), `vuoti.md` (bottino dei vuoti) e `set_di_classe.md`.

## 0. Principi (già decisi)
- Modello ibrido: **fissi** (guardiani, set, storia, catalogo di Aldo, tutti i Leggendari) e **casuali** da Comune a Raro, per tutti i nemici non guardiani.
- La rarità decide il bonus (+0 / +1 / +2); il caso sceglie tipo, base e affisso; i poteri sono **già scritti** (il caso non li inventa). Tetto +3 su ogni abilità o tiro salvezza, anche sommando più pezzi. Su un oggetto un attributo dà al massimo +1 al modificatore, mai quello principale della classe (19/11).
- Il bottino casuale si genera da un **seme di partita** (nome del nemico + stanza + seme), salvato: ricaricare dà lo stesso bottino.
- **Limiti di classe (DECISO il 17/11):** ogni classe usa solo le armi e le armature del proprio elenco (Guerriero tutte; Sciamano e Monaco leggera e media; Arcanista solo leggera; con un focus solo armi a una mano). **La «libera scelta» e il malus del 13/11 sono cancellati.** **Armatura pesante per tutti: non si fa (19/11).** Vedi 6.
- Dadi: una mano 1d6, due mani 1d8, Leggendari e set 1d10, sovrano 1d12. I nemici normali possono essere un po' più forti del bottino che danno; gli incontri che contano sono i guardiani.

## 0b. Il bottino della partita (DECISO il 17/11)
- All'ingresso nel dungeon, con la classe scelta in creazione, si genera dal seme un **gruppo di oggetti** (il bottino di quella partita), salvato nel personaggio. I nemici lo pescano mentre il giocatore avanza; non si riceve tutto all'inizio. Non si può rigenerare cambiando classe nella creazione.
- **Utilità per classe (DECISO il 17/11, ribadito il 19/11 come parametro):** per Arcanista, Sciamano e Monaco circa il **60% degli oggetti** è usabile dalla propria classe e il **40% no**; per il **Guerriero** circa l'80% usabile e il 20% no (ha le esclusioni vere: vesti delle classi magiche e focus). La quota è un **parametro del generatore, per classe**, da tarare giocando, non il frutto delle esclusioni naturali. Gli inutili si **scambiano con Aldo** (armeria, baratto alla pari della stessa rarità), così non sono mai spazzatura. Serve a dare l'idea di un mondo abitato che ha visto passare molti avventurieri.
- I **pezzi dei set di classe** sono fuori da questo bottino casuale (`set_di_classe.md`): sono fissi, legati alla classe, non si barattano.
- ⚠ Da misurare: il peso degli inutili sullo zaino (8 posti) e il flusso di baratti con Aldo.

## 1. Quando e cosa cade (per stelle del nemico)
Ogni nemico non guardiano tira, in ordine, queste voci (percentuali ⚠ da misurare):

| Nemico | Equip. base (Comune) | Risorse (pozioni, ingredienti, dotazione) | Oggetto Non comune | Oggetto Raro | Pergamena |
|---|---|---|---|---|---|
| ★ bronzo | 60% | 60% | 25% | — | 10%, semplice |
| ★★ argento | 50% | 60% | 35% | 10% | 15%, semplice |
| ★★★ oro / platino | 40% | 70% | 35% | 25% | 25%, semplice o importante |
| Animali della foresta | solo pelo, unghie, ecc.: mai equipaggiamento |

- **Vuoti (DECISO il 18/11, `vuoti.md` sez. 6):** fasce 0-1 = colonna ★, fascia 2 = ★★, fasce 3-4 = ★★★; il diario cade **sempre**; il vuoto che lascia un pezzo di set lascia solo risorse (mai altro equipaggiamento né pergamena); le **cacce** non lasciano equipaggiamento casuale (il premio è il regalo di Aldo) ma diario e risorse; dai vuoti non cadono mai parti di animale. Gli agguati ci sono anche prima di Ettore (19/11).
- **Guardiani:** arma propria **garantita** (rarità che cresce: Ettore Non comune, Enea Raro, Dafne e Atena Leggendario), più il tiro già esistente di oggetto magico o pergamena importante (Ettore 60%, Enea 70%, Dafne 80%, Atena 90%), che ora estrae dal pool casuale, Raro o pergamena importante. Dai guardiani cade anche il **pezzo 1 del set di classe** (fallback: Ettore 20%, Enea 40%, Dafne 100%, Atena sempre; `set_di_classe.md`).
- **Garantito o probabilità?** Per il caso: probabilità. Il garantito resta solo per i premi fissi dei guardiani (correzione alla mia idea di ieri: «garantito da Raro in su» renderebbe i Rari troppo comuni).
- **Pergamene** (⚠ da allineare con `elisir_e_bottino.md`): semplice = potere per scontro; importante = giornaliero. Si legano a uno slot di potere.
- **Dotazione (DECISO il 17/11, confermato il 19/11):** tutti gli oggetti della dotazione (pozione di cura, torcia, piede di porco, gesso, corda, lente, quaderno e carboncino) cadono anche dai PNG sconfitti, **mai dagli animali e dalle bestie**; rientrano nella colonna «Risorse». ⚠ Percentuali e quantità da fissare giocando (parametro).

## 2. Come si genera un oggetto
1. **Slot** (pesi ⚠): arma 25%, armatura o scudo 20%, elmo / guanti / stivali / mantello 8% l'uno (32%), accessorio (anello, amuleto, cintura) 23%. Le vesti sono un tipo di armatura (4b).
2. **Base** (tabella 3 o 4). Il Comune finisce qui.
3. **Bonus** secondo la rarità: arma +N a colpire e ai danni; armatura e scudo +N CA; gli altri pezzi +N a un'abilità o a un tiro salvezza (tabella 5).
4. **Affisso** (nome): «base + di + sostantivo», senza articolo, così non servono accordi di genere: *Spadone di brace*, *Elmo di vedetta*, *Anello di cenere*. Sostantivi (⚠ da ampliare): brace, cenere, vedetta, cacciatore, radice, veglia, ferro, nebbia, spina, sale, corvo, lupo.
5. **Potere per scontro** solo se Raro (tabelle 7 e 8). I Non comuni non hanno poteri.
6. **Seme e ripetibilità:** stesso nemico, stessa partita, stesso oggetto.

## 3. Armi base (Comuni; dadi per categoria)
Le armi comuni sono **sei** (17/11): due per tipo di danno, una a una mano (1d6) e una a due mani (1d8).

| Tipo | Una mano (1d6) | Due mani (1d8) |
|---|---|---|
| Taglio | Spada | Spadone |
| Contundente | Mazza ferrata | Maglio |
| Perforante | Pugnale | Tridente |

⚠ I nomi della vecchia tabella (Spada corta, Scimitarra, Ascia, Mannaia, Martello, Randello, Daga lunga, Giavellotto, Lancia, Mazza a due mani) sono **superati**: gli affissi si applicano alle sei armi.

**Focus (19/11: un oggetto, due forme)**, per Sciamano, Arcanista e Monaco, a una mano nella mano secondaria. Ogni focus di una rarità è un solo oggetto che prende la forma scelta in creazione: normale 1d8 oppure scudo 1d6 con +1 CA senza malus di Agilità; il bonus N a colpire e ai danni è lo stesso nelle due forme.
| Focus | Forma normale (1d8) | Forma scudo (1d6, +1 CA) |
|---|---|---|
| Sciamano | Asse del mondo | Scudo Feticcio |
| Arcanista | Libro arcano | Brocchiere Runico |
| Monaco | Filatterio | Aegis Divina |

Il Simbolo sacro, il Bastone (come focus a due mani, 1d8) e il Manganello sono cancellati. Due armi portate al massimo; con un'arma a due mani non si imbraccia lo scudo. Il tipo decide lo stato dei poteri (taglio → Sanguinante, contundente → Stordito, perforante → Esposto).

## 4. Armature base
Leggera, media, pesante e scudo con i valori di CA dal codice (⚠ da leggere quando il PC è collegato). Il Comune non ha bonus; Non comune +1 CA, Raro +2 CA. Il **focus scudo** non ha un oggetto a parte: è la forma scudo del focus della stessa rarità (19/11; `oggetti_per_rarita.md`, sez. 1).

### 4b. Vesti delle classi magiche (DECISO il 19/11, opzione A; solo Sciamano, Arcanista e Monaco, **il Guerriero è escluso**)
Un tipo di armatura per le classi magiche (Sciamano compreso): servono anche a far sì che il Guerriero abbia oggetti davvero inutili.
- **CA** della leggera della stessa rarità (Non comune +1, Raro +2), **nessun malus** di Agilità, tetto di Agilità +3.
- **Bonus vero** di +1 (Non comune) o +2 (Raro) a un'abilità o a un TS, preso dalla tabella 5; i Rari hanno anche un potere per scontro della tabella 8 (gruppo armatura). Mai Leggendarie.
- Oggetti casuali del campo, non fissi. Nomi (spunti di Gemini): tonaca, paramenti, scapolare (Monaco); veste runica, farsetto del sapiente (Arcanista); veste feticcio, mantello di pelli (Sciamano). I nomi non devono collidere con i pezzi dei set di classe né con lo Scudo Feticcio.
- ⚠ Sciamano e Monaco, che arrivano alla media, con la veste hanno un punto di CA in meno della media a Agilità +2 (ma senza malus): da misurare.

## 5. Bonus dei pezzi non armatura e non arma (Non comune +1, Raro +2)
Tirare 1d12 sulla stessa tabella per tutti gli slot (elmo, guanti, stivali, mantello, anelli, amuleto, cintura, vesti); il bonus è la rarità:

| d12 | Bonus |
|---|---|
| 1 | Percezione |
| 2 | Sopravvivenza |
| 3 | Furtività |
| 4 | Atletica |
| 5 | Indagare |
| 6 | TS contro Scottato |
| 7 | TS contro Intossicato |
| 8 | TS contro Impaurito |
| 9 | TS contro Esposto |
| 10 | TS contro Indebolito |
| 11 | TS contro Stordito |
| 12 | Salute mentale: +1 (Non comune) / +2 (Raro), massimo |

Per armi e armature Non comuni, l'affisso è solo nome (il +1 va a colpire e ai danni, o alla CA), così il bilancio resta semplice (le vesti fanno eccezione, 4b). ⚠ Se vuoi più varietà, aggiungiamo un +1 a una abilità anche su armi e armature Non comuni.

## 6. Armi e armature: limiti di classe (sostituisce la «libera scelta» e il malus del 13/11)
DECISO il 17/11: restano i limiti di classe. Il malus per l'armatura sopra la propria categoria (−2 a colpire e alla CD per categoria) **non si scrive**. Gli oggetti che la classe non può usare restano nel bottino e si scambiano con Aldo (0b). L'armatura pesante resta del Guerriero (19/11).

## 7. Poteri per scontro dei Rari: armi (⚠ ricavati dai poteri già proposti)
Si estrae un potere dal gruppo del **tipo** dell'arma (il dado del potere è quello dell'arma).

| Tipo | Potere | Effetto, su un colpo a segno |
|---|---|---|
| Taglio | Doppio colpo | secondo colpo gratuito col dado dell'arma; se è Sanguinante, lo aggrava in Emorragia |
| Taglio | Taglio profondo | un dado in più e applica Sanguinante (se già Sanguinante, Emorragia) |
| Taglio | Fendente | due dadi in più ma nessuno stato |
| Contundente | Schianto | un dado in più; Stordito (TS; sui boss Indebolito); se già Stordito o immune, Commosso |
| Contundente | Spaccaguardia | ignora le resistenze del bersaglio (non le immunità) |
| Contundente | Scossone | applica Stordito senza TS |
| Perforante | Punta nella piaga | applica Esposto; se già Esposto, Scoperto |
| Perforante | Affondo | +4 a colpire e un dado in più |
| Perforante | Doppia punta | due attacchi di fila, il secondo con −2 |
| Focus | Segno sulla mappa | il prossimo stato che applichi con un potere entra senza TS |
| Focus | Mente acuta | +2 a colpire e +2 alla CD del prossimo potere |
| Focus | Eco | il prossimo potere a volontà non occupa l'azione standard |

⚠ Il bonus del potere non si somma a quello di classe nello stesso colpo (regola esistente). Questi tre per tipo sostituiscono i poteri fissi della tabella 1c solo per gli oggetti **casuali**; gli oggetti con nome restano quelli già scritti.

## 8. Poteri per scontro dei Rari: armature, scudi e altri pezzi
| Gruppo | Potere | Effetto |
|---|---|---|
| Armatura (vesti comprese) | Ombra | il primo attacco di un nemico contro di te ha −4 a colpire |
| Armatura (vesti comprese) | Veglia | un colpo subito è ridotto di 4 |
| Armatura (vesti comprese) | Fermezza | un TS contro uno stato appena applicato riesce in automatico |
| Scudo | Muro | +2 CA per 3 turni |
| Scudo | Riflesso | un nemico che ti manca subisce 1d6 |
| Scudo | Parata | un colpo subito è dimezzato |
| Elmo, guanti, stivali, mantello, anelli, amuleto, cintura | Occhio vigile | un TS contro Impaurito o Esposto riesce in automatico |
| (stessi) | Mano ferma | il prossimo attacco ignora le resistenze |
| (stessi) | Passo leggero | il prossimo attacco contro di te ha −4 a colpire |
| (stessi) | Respiro | cura 1d8 |
| (stessi) | Presa salda | un TS contro Stordito o Indebolito riesce in automatico |
| (stessi) | Colpo d'occhio | +4 al tuo prossimo attacco |

⚠ Un solo potere uguale per volta in funzione; due pezzi con lo stesso potere non si sommano. ⚠ Le reazioni sono eliminate (14/11): questi poteri si dichiarano come azione rapida.

## 9. Oggetti maledetti (opzionale, ⚠)
Visibili **prima** di raccoglierli: +1 più alto della rarità ma un malus nominato (−1 a un TS o una abilità). Tre esempi: *Spadone di spina* (+3 a colpire e ai danni, ma −2 CA mentre è equipaggiato), *Elmo di nebbia* (+2 Percezione, −1 TS contro Impaurito), *Anello di cenere* (+1 TS contro Scottato, −1 salute mentale massima). Se non ti convincono, si tolgono.

## 10. Da fare
1. Approvare o cambiare percentuali, pesi degli slot, sostantivi, poteri.
2. ~~Definire le vesti delle classi magiche (4b) e l'equivalente dei focus scudo per rarità~~ → fatto il 19/11.
3. Scrivere il generatore con seme e quota di utilità per classe (0b), e misurare peggiore e migliore build; il generatore dei vuoti (`vuoti.md`) è un blocco a parte dopo domenica.
4. Allineare con `elisir_e_bottino.md` e `nemici_manuale.html` (spada del Retaggio +3).
