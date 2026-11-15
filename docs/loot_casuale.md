# Il Trono di Cenere — Loot casuale (prima versione)

Bozza del 13/11/2026 da lavorare insieme. Tutto ⚠ proposta da approvare; i numeri sono ipotesi da misurare con `serie_scontri.js`. Collegato a `oggetti_per_rarita.md` (sezioni 5, 6, 7).

## 0. Principi (già decisi)
- Modello ibrido: **fissi** (guardiani, set, storia, catalogo di Aldo, tutti i Leggendari) e **casuali** da Comune a Raro, per tutti i nemici non guardiani.
- La rarità decide il bonus (+0 / +1 / +2); il caso sceglie tipo, base e affisso; i poteri sono **già scritti** (il caso non li inventa). Tetto +3 su ogni abilità o tiro salvezza, anche sommando più pezzi.
- Il bottino casuale si genera da un **seme di partita** (nome del nemico + stanza + seme), salvato: ricaricare dà lo stesso bottino.
- Armi e armature a **libera scelta per tutte le classi**; vedi 6 per il malus.
- Dadi: una mano 1d6, due mani 1d8, Leggendari e set 1d10, sovrano 1d12. I nemici normali possono essere un po' più forti del bottino che danno; gli incontri che contano sono i guardiani.

## 1. Quando e cosa cade (per stelle del nemico)
Ogni nemico non guardiano tira, in ordine, queste voci (percentuali ⚠ da misurare):

| Nemico | Equip. base (Comune) | Risorse (pozioni, ingredienti) | Oggetto Non comune | Oggetto Raro | Pergamena |
|---|---|---|---|---|---|
| ★ bronzo | 60% | 60% | 25% | — | 10%, semplice |
| ★★ argento | 50% | 60% | 35% | 10% | 15%, semplice |
| ★★★ oro / platino | 40% | 70% | 35% | 25% | 25%, semplice o importante |
| Animali della foresta | solo pelo, unghie, ecc.: mai equipaggiamento |

- **Guardiani:** arma propria **garantita** (rarità che cresce: Ettore Non comune, Enea Raro, Dafne e Atena Leggendario), più il tiro già esistente di oggetto magico o pergamena importante (Ettore 60%, Enea 70%, Dafne 80%, Atena 90%), che ora estrae dal pool casuale, Raro o pergamena importante.
- **Garantito o probabilità?** Per il caso: probabilità. Il garantito resta solo per i premi fissi dei guardiani (correzione alla mia idea di ieri: «garantito da Raro in su» renderebbe i Rari troppo comuni).
- **Pergamene** (⚠ da allineare con `elisir_e_bottino.md`): semplice = potere per scontro; importante = giornaliero. Si legano a uno slot di potere.

## 2. Come si genera un oggetto
1. **Slot** (pesi ⚠): arma 25%, armatura o scudo 20%, elmo / guanti / stivali / mantello 8% l'uno (32%), accessorio (anello, amuleto, cintura) 23%.
2. **Base** (tabella 3 o 4). Il Comune finisce qui.
3. **Bonus** secondo la rarità: arma +N a colpire e ai danni; armatura e scudo +N CA; gli altri pezzi +N a un'abilità o a un tiro salvezza (tabella 5).
4. **Affisso** (nome): «base + di + sostantivo», senza articolo, così non servono accordi di genere: *Spadone di brace*, *Elmo di vedetta*, *Anello di cenere*. Sostantivi (⚠ da ampliare): brace, cenere, vedetta, cacciatore, radice, veglia, ferro, nebbia, spina, sale, corvo, lupo.
5. **Potere per scontro** solo se Raro (tabelle 7 e 8). I Non comuni non hanno poteri.
6. **Seme e ripetibilità:** stesso nemico, stessa partita, stesso oggetto.

## 3. Armi base (Comuni, nuove ⚠; dadi per categoria)
| Tipo | Una mano (1d6) | Due mani (1d8) |
|---|---|---|
| Taglio | Spada corta (di creazione), Scimitarra, Ascia | Spadone, Mannaia |
| Contundente | Mazza chiodata (di creazione), Martello, Randello | Maglio, Mazza a due mani |
| Perforante | Daga lunga, Giavellotto | **Tridente**, Lancia |
| Focus | Libro arcano, Filatterio, Simbolo sacro (1d6) | Bastone (1d8, arma e focus insieme) |

Due armi portate al massimo; con un'arma a due mani non si imbraccia lo scudo (regola esistente). Il tipo decide lo stato dei poteri (taglio → Sanguinante, contundente → Stordito, perforante → Esposto).

## 4. Armature base
Leggera, media, pesante e scudo con i valori di CA dal codice (⚠ da leggere quando il PC è collegato). Il Comune non ha bonus; Non comune +1 CA, Raro +2 CA.

## 5. Bonus dei pezzi non armatura e non arma (Non comune +1, Raro +2)
Tirare 1d12 sulla stessa tabella per tutti gli slot (elmo, guanti, stivali, mantello, anelli, amuleto, cintura); il bonus è la rarità:

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

Per armi e armature Non comuni, l'affisso è solo nome (il +1 va a colpire e ai danni, o alla CA), così il bilancio resta semplice. ⚠ Se vuoi più varietà, aggiungiamo un +1 a una abilità anche su armi e armature Non comuni.

## 6. Armi e armature a libera scelta: il malus
Decisione del 13/11: ogni classe può usare qualsiasi arma e armatura. Nei documenti non ho trovato il malus per l'armatura sbagliata (c'è solo la regola della pagina di test: Guerriero tutte, Sciamano e Monaco fino alla media, Arcanista solo leggera; verificare nel codice). **Proposta:** per ogni categoria sopra quella propria della classe, **−2 a colpire e −2 alla CD degli incantesimi**. Esempio: Arcanista (leggera) con armatura pesante: due categorie, −4. Il Guerriero non ha malus. Armi: nessun malus. ⚠ Da misurare: la CA alta compensa il malus, soprattutto per Monaco e Sciamano.

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
| Armatura | Ombra | il primo attacco di un nemico contro di te ha −4 a colpire |
| Armatura | Veglia | un colpo subito è ridotto di 4 |
| Armatura | Fermezza | un TS contro uno stato appena applicato riesce in automatico |
| Scudo | Muro | +2 CA per 3 turni |
| Scudo | Riflesso | un nemico che ti manca subisce 1d6 |
| Scudo | Parata | un colpo subito è dimezzato |
| Elmo, guanti, stivali, mantello, anelli, amuleto, cintura | Occhio vigile | un TS contro Impaurito o Esposto riesce in automatico |
| (stessi) | Mano ferma | il prossimo attacco ignora le resistenze |
| (stessi) | Passo leggero | il prossimo attacco contro di te ha −4 a colpire |
| (stessi) | Respiro | cura 1d8 |
| (stessi) | Presa salda | un TS contro Stordito o Indebolito riesce in automatico |
| (stessi) | Colpo d'occhio | +4 al tuo prossimo attacco |

⚠ Un solo potere uguale per volta in funzione; due pezzi con lo stesso potere non si sommano.

## 9. Oggetti maledetti (opzionale, ⚠)
Visibili **prima** di raccoglierli: +1 più alto della rarità ma un malus nominato (−1 a un TS o una abilità). Tre esempi: *Spadone di spina* (+3 a colpire e ai danni, ma −2 CA mentre è equipaggiato), *Elmo di nebbia* (+2 Percezione, −1 TS contro Impaurito), *Anello di cenere* (+1 TS contro Scottato, −1 salute mentale massima). Se non ti convincono, si tolgono.

## 10. Da fare
1. Approvare o cambiare percentuali, pesi degli slot, sostantivi, poteri.
2. Leggere dal codice i valori base (CA, nomi) e il malus esistente per le armature.
3. Scrivere il generatore con seme e misurare peggiore e migliore build.
4. Allineare con `elisir_e_bottino.md` e `nemici_manuale.html` (spada del Retaggio +3).
