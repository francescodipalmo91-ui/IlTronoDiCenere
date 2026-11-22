# Il Trono di Cenere — Mappa del progetto

Mappa concettuale per ritrovare subito dove sta ogni fatto e cosa aggiornare quando qualcosa cambia. Creata il 16/11/2026, aggiornata il 18/11 (documenti dei vuoti, dei set e dei diari). Si aggiorna solo se nasce, si divide o si archivia un documento. **Un fatto vive in un solo documento (la fonte); gli altri rimandano.**

## 1. Argomento → fonte unica
| Argomento | Fonte (vale questa) | Dipende da / rimanda a |
|---|---|---|
| Stato, piano, regole di lavoro | `punto_della_situazione.md` | tutti |
| Cosa è cancellato / sostituito | `registro_cancellati.md` | da controllare prima di dire che qualcosa esiste |
| Decisioni recenti non ancora riversate | `decisioni_19_novembre.md`, `decisioni_18_novembre.md`, `decisioni_17_novembre.md`, `decisioni_16_novembre.md` (poi `decisioni_14_novembre.md`) | tabella «Stato dell'allineamento» in cima |
| Regole di combattimento, stati, poteri, scala dei livelli, nemici (8c), guardiani (8d), sovrano (8e), armi/armature/focus (8f) | `riscrittura_meccaniche.md` | sintesi in `riepilogo_riscrittura.md` |
| Classi e specializzazioni (riassunto) | `schema_classi.md` → `classi_manuale.html` (generato) | riscrittura sez. 0 e 4-7 |
| Livelli, salute, attributi, PE, percorso atteso | `progressione.md` | riscrittura (poteri per livello) |
| Dove e con chi si combatte, morte, fuga, pedinamento, agguati, fermaglio, cacce | `mondo_e_incontri.md` | statistiche in riscrittura 8c; PE in progressione |
| **Vuoti: fasce, statistiche, archetipi, poteri, cacce élite, bottino** | `vuoti.md` | `mondo_e_incontri.md` sez. 4 e 7; stati in riscrittura |
| **Diari dei vuoti** (regole, date, modi di svuotarsi, scorta) | `diari_vuoti.md` | aiuti agli enigmi da collegare a `pergamene.md` |
| **Set di classe** (Valoroso, Sapiente, Penitente, Pellegrino) | `set_di_classe.md` | `storia_retaggio_e_set.md` (set storici); `loot_casuale.md` |
| Elisir, erbe, lanterna, bottino dei guardiani, oggetti degli uomini di Enea | `elisir_e_bottino.md` | riscrittura 4 e 8f |
| Oggetti per rarità, armeria di Aldo, loot | `oggetti_per_rarita.md`, `armeria_aldo.md`, `loot_casuale.md` → `oggetti_manuale.html` | riscrittura 8f; set in `storia_retaggio_e_set.md`; vuoti in `vuoti.md` |
| Pergamene | `pergamene.md` | da decidere (settimana dopo) |
| Manuale dei nemici | `nemici_manuale.html` (da dati di riscrittura 8c e `nemici.js`) | |
| Storia: verità, patto, lacrime, finali | `storia_verita_e_finali.md` | |
| Storia: Guendalina, figli, Aldo, Ettore, Dafne, Atena, sovrano | `storia_personaggi.md` | |
| Storia: Enea e i suoi uomini | `storia_enea.md` | |
| Storia: set, reliquie, spada, visioni, enigmi | `storia_retaggio_e_set.md` | |
| Storia: casa, esterni, cucina, tempo e riposo, calendario | `storia_casa_ed_esterni.md` | calendario nuovo in decisioni 16/11 (da riversare qui) |
| Grafica | `DESIGN.md` | |
| Test e strumenti di controllo | `strumenti_verifica.md` | |
| Giocatore automatico (bot) | `cervello_bot.md` | |
| Logging partite | `logging_partite.md` | |
| Storico del lavoro sul codice | `lavoro_codice_domenica.md`, `report_domenica_15_novembre.md` | solo cronaca, non regole |

## 2. Se cambia X, aggiorna Y (cascata)
| Cambia… | Aggiorna (in quest'ordine) |
|---|---|
| Una regola di combattimento, stato o potere | riscrittura → riepilogo_riscrittura → schema_classi → classi_manuale.html → cervello_bot → codice (`poteri.js`, `specializzazioni.js`, `scontro.js`) e test → regolamento |
| Un nemico, una caccia | riscrittura 8c → `mondo_e_incontri.md` → `progressione.md` (PE) → `nemici_manuale.html` → `nemici.js` → `gioco.html` |
| Un vuoto, una fascia, un archetipo, un diario | `vuoti.md` / `diari_vuoti.md` → `progressione.md` (PE) → `nemici_manuale.html` → generatore nel codice (dopo domenica) |
| Un oggetto, un'arma, un set | `oggetti_per_rarita.md` → `armeria_aldo.md` / `set_di_classe.md` / `storia_retaggio_e_set.md` → `oggetti_manuale.html` → `oggetti.js` |
| Un elisir o un ingrediente | `elisir_e_bottino.md` → riscrittura 2 → codice → sala di prova |
| Livelli, PE, salute | `progressione.md` → riscrittura (scala) → codice |
| Un PNG, un luogo, la storia | il modulo `storia_*` giusto → `gioco.html` (testi) |
| Qualcosa viene cancellato | **`registro_cancellati.md`** → purga dei documenti nello stesso blocco → grep nel codice → `punto_della_situazione.md` |

## 3. Metodo rapido di revisione (a basso costo)
1. Leggere `punto_della_situazione.md` e `registro_cancellati.md` (poche righe).
2. Per un argomento: aprire **solo** la fonte della tabella 1, non l'intero progetto.
3. Controllo di residui con ricerca per termini (goblin, orchi, nomi dei cinque avventurieri, «colpo gratuito», «Sentenza», nomi vecchi delle cacce ecc.): `project_search` nel progetto e `grep` nel codice; l'elenco dei termini è nella colonna «Residui» del registro.
4. Fine blocco di lavoro: aggiornare registro e punto della situazione, copiare i file in `docs/` sul PC.

## 4. Archiviati (non usare)
`storia_casa_vespera.md`, `incantesimi_arcanista_monaco.md`, `tecniche_guerriero_*.md`, `tecniche_sciamano.md`, `bilanciamento_nemici_oggetti.md` (sistema a risorse, 9/11), `archivio_frasi_avventurieri.md` (16/11, solo tono per i diari).
