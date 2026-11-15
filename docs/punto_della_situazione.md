# Punto della situazione — 11 novembre 2026 (aggiornato il 15 novembre sera)

Da leggere per primo, a ogni nuova conversazione. Sostituisce la versione del 4 novembre (superata dalla riscrittura delle meccaniche).
Repo: francescodipalmo91-ui/IlTronoDiCenere. Copia locale di Francesco: `C:\Users\franc\OneDrive\Desktop\IlTronoDiCenere`. **Dal 9 novembre si lavora solo sul PC**: GitHub si aggiorna con un rilascio, dopo i test.

**Cartella riordinata il 9 novembre:** nella radice c'è il gioco con il motore nuovo (ex `PROVA_gioco`, ramo `riscrittura`); la versione del 4 novembre è in `archivio/versione_2026-11-04`; `PROVA_gioco` e `PROVA_riscrittura` sono state tolte (registri degli scontri uniti in `log_scontri`); `classi_manuale.html` è in `docs/`. In `immagini` restano le immagini nuove di Francesco, più i 15 file ancora usati dal codice (cripta, foresta nord, sala caccia e trofei, mastini, re) che mancavano. Mappa delle cartelle: `LEGGIMI.txt` nella radice.

## Aggiornamento del 15 novembre 2026 (sera) — leggere prima del resto

- **Codice CONGELATO** (Francesco, 15/11): niente più modifiche al bilanciamento; il gioco ora va **giocato e testato da persone**. Le misure del bot non tengono conto di molti aspetti del gioco vero.
- Domenica 15/11 il motore nuovo è stato completato sul PC: scala e specializzazioni nuove, azione rapida, colpi e TS del 14/11, guardiani e sovrano a fasi (opzione B, annunci con icone), poteri di armi e armature, set, elisir di stato, giocatore automatico `js/cervello.js`; 233 test verdi. Dettaglio e valori congelati dei boss: `lavoro_codice_domenica.md` e riscrittura 8g; sintesi in `riepilogo_riscrittura.md`.
- **Documenti allineati** al registro del 14/11 e al codice (progetto, `docs/` sul PC, GitHub) il 15/11 sera.
- **Prossimi passi:** partita completa giocata da umani; collegare Enea, Dafne, Atena e il sovrano in `gioco.html`; inventario (togliere, buttare, posare nello sgabuzzino); pulizia del vecchio motore. **Aperti da decidere con Francesco:** un solo elisir raro attivo per volta; *Voce del sangue* su TS e prove; mano libera +2 o +3; *Sentenza dell'erede*.
- Le sezioni qui sotto descrivono lo stato all'11/11: dove contraddicono questo blocco, vale questo blocco.

## Dove siamo, in breve

- **Il gioco non si butta.** Tra il 5 e l'8 novembre è stato riscritto un solo strato: combattimento e crescita del personaggio (niente più risorse, poteri a volontà / per scontro / giornalieri, specializzazioni). Storia, luoghi, dialoghi, prove di abilità, missioni, grafica, riposo e salvataggi restano com'erano.
- **Meccaniche congelate dal 9 novembre.** Ciò che è deciso nella riscrittura non si ridiscute: si aggiunge soltanto (guardiani, sovrano, cacce, pergamene, livelli 6-10). Si cambia una regola solo se una prova giocata lo chiede.
- **Schema delle classi ridisegnato il 10 novembre** su diagramma di Francesco: privilegi di classe ai livelli 1, 3, 5; via di prestigio al livello 2 con poteri passivi ai livelli 2-4; scala 3/1/1 al livello 2 e 3/2/2 al 3 (terzo giornaliero in scelta dal 3); Guerriero: Berserker e Paladino (ex Esecutore e Sentinella/Difensore); dall'11/11 anche Sciamano Funghi e Legno, Arcanista Realtà e Illusione, Monaco Sangue e Ossa (vedi sotto). Dettaglio: `riscrittura_meccaniche.md`, sezioni 0 e 7. Chiusi il 10/11: *Mani che curano* = pozioni ed elisir +50%; *Infuso* resta al 5; focus per classe (libro arcano, filatterio, simbolo sacro, bastone), *Bastone* → *Manganello*. Da misurare la domenica: incantatori senza scudo (soglia 10 punti sotto il peggior Guerriero), Secondo vento su Enea e Dafne.
- **Specializzazioni ridisegnate l'11 novembre:** una offensiva e una difensiva per classe (Berserker/Paladino, Funghi/Legno, Realtà/Illusione, Sangue/Ossa); Purificatore eliminato, fuoco sacro riciclato in oggetti e pergamene; forza e psichico da assegnare nelle mappe di boss e cacce; `classi_manuale.html` aggiornato anch'esso l'11/11 (rigenerato dai dati di `schema_classi.md`). Dettaglio: riscrittura, sezioni 4-6.
- **Decisioni dell'11 novembre:** azione rapida (equipaggiare, pozione, Infuso; una per turno oltre alla standard); Stordito = intero turno; al massimo due armi con sé (il tipo di danno lo decide l'arma per il Guerriero e per l'attacco base; gli incantatori tengono il tipo dei loro poteri); sovrano chiuso (riscrittura 8e); contro il sovrano si muore (facile: ripartenza dalla scena di preparazione; difficile: game over). Dettaglio: `riepilogo_riscrittura.md`.
- **Regola di precedenza:** per le regole vale `riscrittura_meccaniche.md`; per la storia valgono i moduli `storia_*`; per livelli e PE `progressione.md`, per incontri e cacce `mondo_e_incontri.md`, per elisir e bottino `elisir_e_bottino.md`.

## Mappa dei documenti

| Documento | Contiene | Stato |
|---|---|---|
| `punto_della_situazione.md` | Questo file: stato, piano, regole di lavoro | Punto d'ingresso |
| `riepilogo_riscrittura.md` | Sintesi delle meccaniche nuove, «Da fare», stato del codice | Da leggere subito dopo |
| `riscrittura_meccaniche.md` | Tutte le regole: classi, specializzazioni, poteri, stati, nemici, vulnerabilità, armi, livelli | **Fonte delle regole** |
| `storia_verita_e_finali.md` | Verità, patto di Guendalina, lacrime, finali, Bilancia di Cenere | Valido |
| `storia_personaggi.md` | Guendalina, figli, Aldo, Ettore, Dafne, Atena, sovrano, via e coscienza | Valido |
| `storia_enea.md` | Enea: carattere, rivelazione, oggetti dei suoi uomini | Valido (scontro da rifare in 8d) |
| `storia_retaggio_e_set.md` | I due set (7c: pezzi indossati, poteri 2/4/5), reliquie, spada (campo di forza, solo finale B), visioni, enigmi | Valido |
| `storia_casa_ed_esterni.md` | Casa, esterni, cucina e dispensa, tempo e riposo | Valido |
| `progressione.md` | Livelli, salute, attributi, PE, livelli attesi, percorso atteso | Valido (percorso e livelli 6-10 da ricalcolare) |
| `mondo_e_incontri.md` | Dove si incontrano i nemici, morte, fuga, modalità, pedinamento, agguati, fermaglio, Furtività contro i guardiani, cacce comuni | Valido |
| `elisir_e_bottino.md` | Elisir (comuni e rari), erbe, lanterna, bottino, oggetti degli uomini di Enea | Valido |
| `schema_classi.md`, `classi_manuale.html` | Riassunto delle classi e impaginato da manuale, base del futuro regolamento | Valido (allineati al diagramma del 10 novembre; da allineare a ogni modifica della riscrittura) |
| `DESIGN.md` | Sistema grafico | Valido |
| `strumenti_verifica.md` | Test e strumenti di controllo | Valido (i test del vecchio motore spariranno con la pulizia) |

**Archiviati il 9 novembre** (tolti dal progetto; le copie restano in `docs/` sul PC e nel repo, da spostare in `docs/archivio/`): `storia_casa_vespera.md` (divisa nei cinque moduli `storia_*`), `incantesimi_arcanista_monaco.md`, `tecniche_guerriero_taglio.md`, `tecniche_guerriero_contundenti.md`, `tecniche_guerriero_perforanti.md`, `tecniche_guerriero_scudo.md`, `tecniche_sciamano.md`, `bilanciamento_nemici_oggetti.md` (diviso in tre file e tradotto sul sistema nuovo). Descrivono il sistema a risorse, che non esiste più. L'unica regola ancora utile (la soglia del Retaggio) è stata copiata in `storia_retaggio_e_set.md`.

## Stato del codice

| Dove | Cosa c'è |
|---|---|
| **main** | Gioco sul vecchio motore. Motore nuovo scritto l'8 novembre in file a parte (`poteri.js`, `specializzazioni.js`, `scontro.js`, `nemici.js`), con i suoi test (verdi il 9 novembre), e sala di prova `prova.html` |
| **ramo `riscrittura`** | Il motore nuovo collegato al gioco: creazione con specializzazione, scontro, riposo, scelte di livello, scheda Poteri. Ettore PROVVISORIO. **Sul PC è già la versione della cartella principale (9 novembre)**; su GitHub si porta con il rilascio, dopo i test |

**Debito tecnico da togliere prima di costruire altro:** nel ramo convivono i due sistemi. `gioco.html` controlla a ogni passo se il personaggio è nuovo o vecchio (`motoreNuovo()`), ci sono ancora circa 270 riferimenti a furia, natura, mana e fede e si caricano ancora i file del vecchio motore. Vanno tolti prima di costruire altro. `test.html`, `tutorial.html` e `regolamento.html` sono ancora sul vecchio sistema.

## Piano, in ordine

**Codice (la domenica)**
1. Scelta libera degli a volontà al livello 1 (2 su 3, decisa il 9 novembre) in `js/specializzazioni.js` e nella creazione; poi test di Francesco sulla cartella principale → correzioni. **Dal 10 novembre** va riscritta anche la scala dei livelli (3/1/1 al 2, 3/2/2 al 3, privilegi ai livelli 1/3/5, via al livello 2) e vanno rinominati Berserker e Paladino (e le specializzazioni nuove dell'11 novembre: Funghi, Legno, Realtà, Monaco del Sangue, Ossa; scudi di PF del Legno); dall'11 novembre anche azione rapida, Stordito a intero turno e due armi con sé.
2. **Pulizia:** togliere il vecchio motore (`combattimento.js`, `magia_combattimento.js`, `sciamano.js`, `tecniche.js`, `magia.js`, `incantesimi.js`, i loro test) e tutti i percorsi doppi; i personaggi vecchi si ricreano.
3. `test.html`, sala di prova e `tutorial.html` sul motore nuovo, con il registro degli scontri.
4. Rilascio su GitHub (dopo i test): tutta la cartella del PC, documenti compresi.
5. Regolamento Base / Facoltative, allineato al codice riga per riga.

**Decisioni (in settimana, nei documenti) — ordine deciso da Francesco il 9 novembre sera**
1. **Guardiani (8d), uno alla volta in ordine di storia:** ~~Ettore~~ (fatto il 10 novembre: ciclo in due fasi con due combo, schiva 20%, ricompensa solo storia), ~~Enea~~ (fatto il 10 novembre: ascia sopra il 50%, maglio sotto, sequenza a volontà → per scontro → giornaliero con intervallo; riscrittura 8d); ~~Dafne~~ (fatto il 10 novembre: poteri 3/2/1; fase nascosta con l'arco, stacco con il mastino del corno, fase in mischia con lo stocco); ~~Atena~~ (fatto il 10 novembre: tre fasi falce, gelo, ombra; morte sempre, due gesti di accompagnamento; rivelazione sul sovrano). **Regola unica del risparmio per Ettore, Dafne ed Enea** (non per Atena né per il sovrano): chi viene risparmiato lascia il campo. ← **sovrano (8e) fatto l'11 novembre**; si riparte dalle **cacce comuni**, poi pergamene e sessione oggetti
2. **Le otto cacce comuni:** carattere dei PNG e poteri (8c, gruppo 5); conferma dei PE per arrivo.
3. **Pergamene:** quali, dove, con quale prova (compresa quella dei giocattoli di Agnese).
4. ~~Il sovrano (8e)~~ → **fatto l'11 novembre:** due barre (70 cenere + 30 carne), CA a fasce, mappe, due set indossati con poteri 2/4/5 (nomi provvisori), spada solo nel finale B, obiettivi di vittoria; stati sulle fasi dell'armatura (cenere immune al Sanguinante finché integra o incrinata), poteri delle tre fasi Rabbia / Maledetto / Vuoto più la carne (ascia bipenne, dadi 1/1/2), stati nuovi, evento finale per finale, morte e soglia della sala del trono, rivelazione di Atena sui set (testi provvisori). **Restano:** conferma dell'associazione evento-finale (vedi sotto) e una sessione dedicata a tutti gli oggetti (nomi, bonus per pezzo, valori della spada, mano libera, quando si trova ogni pezzo).
5. ~~Livelli 6-10~~ → **rinviati** (Francesco, 9 novembre): si va avanti così e se ne riparla se serve.

**Storia:** ogni modulo `storia_*` ha in fondo la sua sezione «Aperti (9 novembre)». **Confermato (11 novembre):** l'evento finale del sovrano (cenere che si stacca e protegge il personaggio, dimora in rovina, tutti divorati) è del **Trono di Cenere** (lacrima tenuta) e solo di quello; il Guardiano di Cenere resta un finale in cui si vince lo scontro (nessun finale per sconfitta). Nei documenti del Retaggio «finale B» indica il finale di Adele (positivo), nella Verità e finali «negativo A / B» sono Guardiano e Trono: da uniformare.

## In attesa di materiale di Francesco
- Testi PROVVISORI (in `gioco.html` e negli esterni) e testi del riposo per fasce di giorni.
- Immagini: le sta rifacendo tutte; non vanno toccate finché non le fornisce insieme (poi Claude toglie i loghi). Con lo scambio est/ovest i file `foresta_pini_est` e `foresta_pini_ovest` vanno scambiati nel codice.
- Dialoghi di Aldo e Guendalina per la via di prestigio: collegare `sceglieVia("aldo")` / `sceglieVia("guendalina")` e togliere i pulsanti provvisori.
- Formato degli enigmi.

## Regole di lavoro
- In settimana si decide nei documenti, la domenica si scrive il codice (budget pieno dopo il reset delle 10). Avvisare prima delle operazioni pesanti.
- Punto per punto, prima le cose leggere; pensiero critico sempre (obiezioni numerate, opzioni A/B/C, proposta motivata).
- Si lavora sui file del PC (cartella principale); il rilascio su GitHub solo dopo i test e con l'ok esplicito di Francesco.
- Documenti del progetto e `docs/` del repo sempre allineati; documenti divisi per argomento, non un unico file enorme.
