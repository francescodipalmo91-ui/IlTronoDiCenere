# Punto della situazione — 4 novembre 2026

Da leggere all'inizio di una nuova conversazione. Repo: francescodipalmo91-ui/IlTronoDiCenere, ramo **main**. Linee guida: `storia_casa_vespera.md` e `bilanciamento_nemici_oggetti.md` (identiche nel progetto e in `docs/` nel repo). Copia locale di Francesco: `C:\Users\franc\OneDrive\Desktop\IlTronoDiCenere`. Test: `npm test` (il test nel browser dello Sciamano va lanciato senza limite di tempo o a pezzi con `SOLO=…`).

Metodo: punto per punto, prima le cose leggere; zip dei file modificati solo a fine blocco; pensiero critico sempre.

## Fatto fino al 30 ottobre (in sintesi)
- Punto 1 del bilanciamento (tutto ciò che viene prima del bronzo): morte e modalità, stati comuni, Ettore al livello 2, zone e fauna, elisir comuni e rari, agguati con resa e ritorno, bande, rastrelliere «+livello».
- Enea: carattere, scontro (mani nude / maglio, colpo caricato, finta, «Mi difendo»), vulnerabilità forza-luce-veleno, sdegno, risurrezione, slot del fermaglio; nella sala di prova (`tutorial.html?prova`).

## Fatto il 1° novembre
- **Esterni:** il giardino è il crocevia (nord cimitero, est cappella e cripta, ovest orto e serra, sud ingresso senza porte), foresta a settori, movimento per punti cardinali; immagini del cimitero con e senza Enea.
- **Scontro:** ritmo Lento/Normale/Veloce (⏱ in barra, predefinito Lento).
- **Punti ira → punti furia** ovunque; tabella stati del regolamento in 4 colonne.
- **Lanterna di Guendalina** per la cantina buia (1 utilizzo, ricarica con l'olio di scarto del laboratorio).
- **Monaco a d8.**
- **Caratteristica di classe** per tutti gli attacchi, le CD e la risorsa: Guerriero Vigore, Sciamano Agilità, Arcanista Mente, Monaco Spirito.
- **Peso dei giorni:** ogni 10 giorni −1 alla mente massima; fontana e lacrime restituiscono 1 punto.
- **Furtività contro i guardiani:** prova contrapposta, riuscita = primo turno e −2 CA al guardiano, fallita = il contrario; Dafne con vantaggio.
- **Rami delle armi:** taglio logora (Sanguinamento, Indebolito, Inibito), contundente stordisce (Stordito, Frastornato, Sbilanciato + Incrinatura/Frattura), perforante punta al critico (Esposto, Sbilanciato, critico allargato), scudo difende e controlla; ripieghi sui boss. Pomolo Sbalorditivo → Punta Rapida.
- **Crescita di livello al primo riposo utile** con +2 punti attributo (livelli 2-5), CD + 1 per livello, niente ricalcolo all'indietro.
- **Tiri salvezza dei nemici** per caratteristica + livello; Percezione nemici d20 + Mente + livello ovunque. Primarie: Ettore Mente (Spirito basso), Enea Spirito, Dafne Agilità, Atena Vigore.
- **Otto cacce comuni** (`js/cacce.js`, due per finestra) con resistenze, nota di Aldo (★ ★★), studio ★★★ nella foresta, voce in Missioni; stati nuovi sul personaggio: Stordito, Sbilanciato, Frastornato, Inibito. Numeri **PROVVISORI**.
- **Documenti:** bottino di Enea completato (Darius, Caius, Magnus, i quattro flashback, poteri di scudo, martello, calzari e maglio, il Rettore).

## 2 novembre
- Tolte dal repo le 12 immagini .png sorgenti (~100 MB, non usate dal gioco).
- Documenti riallineati (questo file; elisir comuni e rari segnati come decisi).
- **Niente ingresso principale:** tolti il luogo «ingresso», l'arco e la fuga con i mastini. **La foresta che riporta indietro:** a sud del giardino, scavalcando le siepi o oltre i settori della foresta si torna alla fontana o al limitare, senza costo (prima la fuga dal giardino costava 1 punto mentale). Salvataggi fermi sull'ingresso → giardino.
- Nuova immagine del giardino (logo rimosso). Immagini dei tre settori della foresta collegate (dalla cartella locale di Francesco, loghi rimossi).
- **Serra:** era di Adele. Dopo un riposo, alla prima visita del giorno (non la prima in assoluto) e dopo il dialogo in cucina, si trova Guendalina tra i vasi: una volta sola, racconta la serra e la sua arte di miscelare, promette il laboratorio in cambio della scaletta (o lo collega alla serra se già sbloccato) e regala un'erba. Niente incontri durante la scena. Testi PROVVISORI.
- **Orto:** agguati e animali restano al 20%.
- **Revisione dei guardiani e del sovrano** (storia 10a): razza, arma, classe e una primaria diversa per ciascuno (Ettore Mente, Enea Vigore, Dafne Agilità, Atena Spirito, sovrano Vigore + Spirito). Enea barbaro, ex paladino, compagnia di nani, arma maglio-ascia; Atena ghiaccio e ombra; sovrano con armatura di cenere che si sgretola.
- **Ettore ladro nel codice:** due pugnali a +2 (1d4 + 1), conteggio per pugnale (+1d6), Lama nel fianco, «L'ho già vista», Pugnale del conteggio se ucciso, testi con i pugnali. Simulazione: percentuali in linea con prima (Monaco qualche punto sotto). Immagini della cripta e del ritratto da rifare.

## 3 novembre
- **Pagina di test realistica** (`test.html`): limiti di classe su armi, armature, tecniche e incantesimi preparati, scuola principale, Retaggio come arma, resistenza al veleno automatica.
- **Arcanista:** Sigilli leggibili (◆◇), +1 Sigillo massimo dal livello 4, Runa e Specchio di Rune corretti, Scudo 3 turni, Filo di Rune −1 per Sigillo, Cataclisma, Pugno di Forza 1d8.
- **Tratti di classe** (livelli 1, 2, 4): Arcanista «Pozzo Arcano», Monaco «Respiro dell'Equilibrio», Guerriero «Tempra del Soldato» (Ultimo a cadere), Sciamano «Legame del Sottobosco». Tabella in bilanciamento, sezione «Tratti di classe».
- **Combo (A1-A2):** etichette sotto ogni incantesimo e avvisi «combo pronta» in gioco, sala e test; avviso Zenit/Nadir nel diario.
- **Giocatore medio (B)** in `strumenti/serie_scontri.js` (predefinito; `BOT=vecchio`, `SCUOLA=forza,luce`). Risultati in bilanciamento, sezione «Combo tra incantesimi».
- **Scala dei guardiani DECISA:** Ettore 90-95%, Enea 80%, Dafne 70%, Atena 60%, sovrano 50% per ogni classe e razza (±7), misurata col giocatore medio al livello e all'equipaggiamento previsti.

## 3 novembre, pomeriggio
- **Arcanista:** Marchio Arcano +1d6 senza tiro (proposta 2, in prova; la 1 scartata); **Detonazione 1 mana per Sigillo**, senza doppio (Singolarità 2).
- **Mappa bilanciata delle vulnerabilità dei guardiani** (una per Guerriero, Arcanista, Monaco; Sottobosco su due): Ettore contundente-forza-negromanzia, Enea perforante-arcano-vita-sottobosco, Dafne taglio-arcano-vita, Atena contundente-forza-negromanzia-sottobosco.
- **Monaco: Vita e Negromanzia** al posto di Luce e Ombra (nomi, testi, Rigenerazione su Voto di Vita e Grazia, Spirito Servitore). Incantesimi, sezione 3.
- Serie di tutte le classi in bilanciamento (fine documento). Enea sotto l'80% per tutti; l'Arcano principale 20 punti sotto la Forza per la meccanica (Sigilli 2 sui boss, controlli ridotti), non per le vulnerabilità.

## 3 novembre, sera
- **Enea tarato:** salute 32, Furia senza +2 (scala: 80% con la via giusta).
- **Regolamento riorganizzato:** 4 parti, 20 capitoli, «Regole comuni alle classi», classi con lo stesso schema; IT e EN.
- **Verifiche:** ponytail-audit e impeccable da GitHub (resoconto in PONYTAIL_AUDIT.md, seconda passata); tolti il vecchio `js/incantesimi.js` e il suo ramo in gioco.html; titoli di creazione in ordine; Stordito non salta più Rigenerazione, Pozzo, Linfa e Spirito; test aggiornati, tutti verdi.
- **Restano dall'audit:** dati di Enea in un posto solo (quando entra nel gioco), bot che conta Runa sull'Arma come danno, testi narrativi del vecchio sistema (~60 righe).

## 4 novembre (decisioni, documenti aggiornati; codice da fare)
- **La via di prestigio è la scuola**, al livello 3 (storia 10c): fino al 3 incantesimi liberi tra le due scuole, niente scuola principale in creazione; stesso schema per tutte le classi. Ettore (livello 2) su una curva sola.
- **Regola delle armature:** Forza contro i corazzati (Atena, sovrano con l'armatura), Arcano contro gli altri; Ettore da forza ad arcano; sovrano con doppia debolezza.
- **La coscienza e Aldo:** uccidere un guardiano gli dà presa sul personaggio (si apre, tono complice, verso il finale A); risparmiare tiene Aldo freddo ed evasivo e dà fiducia a Guendalina e ai figli. La via resta libera per tutti.
- **Tratti di classe:** un grado per livello, aiuti 1-2, potenziamenti 3-5.
- **Nel codice (4 novembre):** niente scuola principale (creazione, scheda, preparazione al riposo, sala e pagina di test, regolamento IT/EN); potenziamenti della via (Sutura: Sigilli pieni sui boss + Rune che bruciano; Frattura: Detonazione d8; Brace: Rigenerazione 4 turni; Cenere: Avvizzito un dado in più), etichetta «potenziata dalla via» al riposo; Ettore vulnerabile all'Arcano. Serie: giocatore misto (`MISTO=1`), via della scuola (`VIA=scuola`), casi a scelta (`CASI=mastino:2`). Risultati in bilanciamento, «Serie del 4 novembre».

## Punti aperti, in ordine di priorità

**Subito (in corso il 3 novembre)**
0. **Dopo il nuovo schema (4 novembre):** (a) l'Arcano puro non ha ancora un terreno dove rende di più (condizione della scelta B); (b) potenziamenti della via timidi, da rivedere con i tratti di classe; (c) Enea sotto l'80% per tutti gli incantatori: ritaratura per tutte le classi.
0. **Arcanista con Arcano principale** troppo debole (Ettore 44% contro 80% con Forza principale): le combo sono tra due scuole ma l'altra ha un solo posto. Proposte da provare con la serie: (1) un Sigillo inciso oltre il massimo rende 1 mana (massimo 1 per turno); (2) un incantesimo d'Arcano di danno al livello 2 (es. Marchio Arcano + 1d6); (3) in riserva, 2 posti all'altra scuola dal livello 3. Cambiare la meccanica sconsigliato per ora.
0b. **Enea tarato (3 novembre):** salute 32, niente +2 in Furia; l'80% vale con la via giusta (vulnerabilità), senza si sta al 55-65%. Tabella in bilanciamento, «Taratura di Enea».
0d. **Arcano principale: prossimo passo** (Sigilli 2 sui boss, controlli ridotti a ripieghi; 37-45% contro Enea anche con la vulnerabilità).
0c. **A3:** poche combo nuove tra scuole, solo dove la serie lo chiede.

**Leggeri**
1. **Guardiani, uno alla volta:** Enea deciso (storia 10a: arma a doppia faccia, Furia del becchino, bottino); vulnerabile al sottobosco (Sciamano) al posto del veleno; **nella sala di prova dal 2 novembre**, da provare con le classi vere, poi nel gioco (dialogo, cimitero, bottino). Poi Dafne, Atena, sovrano (documenti).

**Da provare prima di costruirci sopra**
2. **Enea nella sala di prova** con le classi vere (scheda del 2 novembre, bilanciamento 5c). Il 44% del Monaco del vecchio modello non vale più.
3. **Le otto cacce comuni** nella stessa sessione.

**Lavoro grosso, in ordine di storia**
4. **Set Vespera:** mantello (prima caccia comune) e guanti (bronzo) per primi; l'arma; dove va «Passo Silenzioso»; il prezzo del set.
5. **Esempi di bottino e poteri delle armi** per grado (costo deciso: 50%).
6. **Enea nel gioco:** dialogo con i rami Signore/Signora, tre domande, cimitero, oggetti nei settori della foresta, collana.
7. **Mastini del secondo piano e pedinamento** (Impaurito ancora fuori dal codice).
8. **Dafne → Atena → sovrano** (numeri del livello 5).

**In attesa di materiale di Francesco**
- Testi PROVVISORI (78 in `gioco.html`, più quelli degli esterni).
- Immagini `foresta_nord`, `foresta_est`, `foresta_ovest`; `immagini/Trono_di_Cenere.webp` mancante.
- Dialoghi di Aldo e Guendalina per la via di prestigio: collegare `sceglieVia("aldo")` / `sceglieVia("guendalina")` e togliere il pulsante provvisorio «Scegli».
- Formato degli enigmi del Retaggio (primo: le torce del cimitero).
