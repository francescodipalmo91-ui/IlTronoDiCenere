# Riepilogo della riscrittura (per Claude) — stato al 08/11/2026

Leggere questo per primo. Dettaglio completo: `claude/riscrittura_meccaniche.md` (sezioni 0-9).
**Codice: motore nuovo scritto il 08/11/2026 (blocchi 1-3), isolato dal vecchio e non ancora collegato al gioco.** Sezione «Codice» in fondo.

## Da fare, in ordine
1. ~~8c gruppo 4 (élite)~~ → **approvato il 06/11/2026**: mastino della soglia di Adele (liv. 4) e **mastino corazzato** (liv. 5, tre rune azzurre, taglio ✗ / perforante ✓), al posto del mastino a due teste.
2. **8c gruppo 5 (PROSSIMO: vulnerabilità fatte il 06/11, restano personaggi e poteri):** le otto cacce (★ 2/1, ★★ 2/2, ★★★ 3/2), dati in `bilanciamento_nemici_oggetti.md` («Le otto cacce comuni»: le vulnerabilità usano ancora Arcano/Forza/Luce/Ombra, da rimappare).
3. **8d guardiani** (Ettore, Enea, Dafne, Atena) e **8e sovrano**, con poteri a volontà/per scontro/giornalieri a soglie; più le pergamene (quali, dove, quale prova).
4. **Allineare i documenti** (mastino a due teste → mastino corazzato in `storia_casa_vespera.md` e `bilanciamento_nemici_oggetti.md`) (`storia_casa_vespera.md`, `bilanciamento_nemici_oggetti.md`, `incantesimi_arcanista_monaco.md`, `punto_della_situazione.md`) e `docs/` nel repo GitHub. Elenco contraddizioni in riscrittura, fine sezione 8a.
5. **Regolamento** Base / Facoltative; **codice**: collegare il motore nuovo a `test.html` (sala di prova veritiera), creazione, scheda e `gioco.html`; zip dei file modificati a fine blocco.

## Metodo di Francesco (rispettarlo)
- Punto per punto, una cosa alla volta; prima le leggere.
- Proposte nel formato tabellare già usato (a volontà / per scontro 2 su 3 / giornaliero 1 su 2 / livelli 3-5).
- Pensiero critico sempre: obiezioni numerate, poi «lavoriamo sulle obiezioni» una per una con opzioni A/B/C e una proposta motivata.

## Schema delle classi
| Classe | Spec. 1 | Spec. 2 | Potere di classe | Tratto I | Tratto II |
|---|---|---|---|---|---|
| Guerriero (Vigore) | Esecutore | Sentinella | Secondo vento | Mente incrollabile | Furia |
| Sciamano (Agilità) | Spore | Linfa | Infuso | Legame del sottobosco | Radici profonde (+1d4 se Avvelenato) |
| Arcanista (Mente) | Sangue | Illusione | Coagulo | Pozzo arcano | Ultima scintilla |
| Monaco (Spirito) | Purificatore | Ossomante | Tocco lenitivo | Ultimo servizio | Eredità del sepolcro |

- Livello 1: 3 a volontà fissi; 3 per scontro (sceglie 2); 2 giornalieri (sceglie 1). Livelli 3/4/5: giornaliero / per scontro / giornaliero finale fissi. Livello 5 = 3/3/3.
- Per scontro = una volta per scontro. Specializzazione scelta in creazione, mai cambiabile.
- Vie (livello 3-5, uguali per tutti, niente poteri): **Aldo, la caccia** (Occhio del cacciatore / Odore del sangue / Senza scampo); **Guendalina, il focolare** (La lanterna / Mani che curano / La soglia di casa).
- Meccaniche firma: Sangue versato (Sangue); Copie a metà danno + Indebolito (Illusione); Balsamo della linfa (Linfa); placche d'ossa 3 × (3 + livello − 1), generate solo da Spine e Armatura d'ossa, Gabbia d'ossa su 19-20 (Ossomante); fuoco sacro che ignora le immunità al fuoco (Purificatore).

## Regole generali chiave
- Un'azione per turno; dialogo gratuito; niente risorse (furia, mana, fede, natura eliminati).
- Stati: lieve/grave per Taglio (Sanguinante/Emorragia), Fuoco (Scottato/Ustionato), Veleno (Intossicato/Avvelenato), Contundente (Stordito/Commosso = Indebolito 3 turni), Perforante (Esposto −2 CA / Scoperto −4 CA e critico 19-20). Indebolito −2 per colpire. Impaurito: 2 turni, solo poteri a volontà.
- Durata 3 turni (Impaurito 2). A volontà applicano; per scontro applicano e aggravano; giornalieri aggravano. Aggravare richiede il lieve (eccezione: Commosso anche se il bersaglio è immune allo Stordito).
- **TS simmetrico:** applicare uno stato → TS di chi lo subisce (CD 8 + mod + livello); aggravare è automatico; un TS solo per potere. TS: Vigore (Sanguinante, Intossicato, Stordito, Indebolito), Agilità (Scottato), Mente (Esposto), Spirito (Impaurito).
- «Danno subito» = salute effettivamente persa.
- Vulnerabile +50% (eccesso), resistente −50% (eccesso), immune 0. Gradiente della maledizione: fuori casa solo resistenze; mastini immunità; sovrano le più forti. Fuoco sacro: neutro fuori, vulnerabili mastini e sovrano. Etichetta «Maledetto» (infernali, mastini, guardiani, sovrano).
- Pergamene: lasciti di avventurieri; alternativa in uno slot (2 poteri, 1 uso); prova di abilità per prenderle, si perdono solo fallendo; tipi nuovi vulnerabili solo per il guardiano del lascito.

## Nemici
- Niente PA. Ordinari e cacce ★ 2/1; ★★ 2/2; ★★★ 3/2; élite (mastini boss) 3/2; boss come il giocatore, giornalieri a soglie 75/50/25% (Ettore 50%; Enea 50% e prima caduta; Dafne 50/25; Atena e sovrano 75/50/25, il sovrano sull'armatura). Annuncio un turno prima dei poteri forti dei boss.
- Sovrano: ultimo 25% forma vera (armatura distrutta), poi la scena dei tre finali. Resistente (non immune) al veleno.
- 5 avventurieri tolti per ora.

## Mappa vulnerabilità (✓ vuln, ✗ resist, ⛔ immune, · neutro)
| Tipo | Ettore | Enea | Dafne | Atena | Sovrano arm. | Sovrano vero |
|---|---|---|---|---|---|---|
| Taglio | ✓ | ✗ | · | ✗ | ✗ | ✓ |
| Contundente | · | ✓ | ✗ | · | ✓ | · |
| Perforante | · | · | ✓ | ✓ | ✗ | · |
| Sangue | · | ✓ | · | ✓ | ⛔ | ✓ |
| Illusione | ✓ | · | ✓ | ✗ | ⛔ | ✗ |
| Fuoco sacro | · | ✓ | · | ✓ | ✓ | · |
| Ossa | · | ✗ | ✓ | · | ✗ | · |
| Veleno | ✓ | · | ✗ | ✓ | ✗ | ✓ |

## Decisioni del 06/11/2026 (dettaglio: riscrittura, sezione 8f e 8c gruppo 5)
- **Livelli fino a 10**, solo numeri (caratteristiche, salute, mente); +1 punto attributo dal 6 (da riconfermare); soglie oltre il 5 da ricalcolare.
- **Boss sempre un livello sopra il giocatore**; percentuali di vittoria (Ettore ~sempre, Enea 80%, Dafne 70%, Atena 60%, sovrano 50%) misurate con l'equipaggiamento del momento.
- **Bonus equipaggiamento +1/+2/+3/+4** (tetto +3, +4 leggendarie; armature tetto +3, +4 solo set Vespera); sostituisce «+livello».
- Armi: attacco base senza stati e senza sinergie; ogni PNG lascia la sua arma (nessuna scelta); **focus** per Arcanista e Ossomante (dado del focus per i 3 offensivi a volontà); pergamene solo come extra; matrice arma-classe approvata.
- **Mastino corazzato** (liv. 5, tre rune azzurre) e **mastino della soglia di Adele** (liv. 4); cacce rimappate, Profeta unico maledetto; PE per arrivo 100/150/200/250 proposti.
- **Da aggiornare nei documenti collegati:** `bilanciamento_nemici_oggetti.md` (livello massimo 5, +livello, PE, percorso atteso).

## Codice (domenica 08/11/2026) — motore nuovo su main
Commit da `a593729` a `f9e1044`. Il motore nuovo è **isolato** dal vecchio (combattimento.js, magia_combattimento.js, sciamano.js, tecniche.js restano com'erano): **gioco.html e test.html non lo usano ancora**. Zip dei file nella cartella locale: `riscrittura_08-11-2026.zip`.

| File | Contenuto | Test |
|---|---|---|
| `js/poteri.js` | Stati lieve/grave, TS simmetrico (uno solo per potere), applica/aggrava, Vacillante, vulnerabilità, fuoco sacro come tipo a sé | `tests/poteri.test.js` (34) |
| `js/specializzazioni.js` | Catalogo delle 8 specializzazioni (89 poteri), scelta 2 su 3 / 1 su 2, poteri e tratti per livello | dentro i test sotto |
| `js/scontro.js` | Attacco (totale > CA, come oggi), turni, reazioni, tutti i poteri, poteri di classe, tratti, vie di Aldo e Guendalina | `scontro` (33), `scontro_sciamano` (25), `scontro_arcanista` (32), `scontro_monaco` (29), `scontro_vie` (7) |
| `js/nemici.js` | Gruppi 1-4 di 8c (animali, infernali, mastini, élite), scelta del potere, annuncio degli élite, rune del corazzato | `tests/nemici.test.js` (18, con 3200 scontri di fumo) |

**Scelte fatte nel codice dove i documenti tacevano** (Francesco, 08/11: «si continua così», si decide dopo i test):
1. Stordito = 1 azione persa, poi 2 turni di immunità.
2. «Per eccesso» sul risultato: tutte le metà si arrotondano per eccesso (resistenze, Copie, Ali cremisi, Rivalsa, Vincolo…).
3. Danni continuativi all'inizio del turno di chi li porta; durata che scende a fine turno.
4. Effetti «per N turni» scendono all'inizio del proprio turno (coprono N turni del nemico); quelli sui tuoi turni successivi (Muffa, Sangue in piena, Arma benedetta) contano N turni tuoi.
5. Contrattacchi: tiro per colpire, solo il dado dell'arma.
6. Colpo del boia e Sentenza contro un Vacillante: colpiscono sempre e sono critici.
7. Rivalsa somma il Vigore; Marchio della preda costa l'azione.
8. Poteri con dadi senza la parola «attacco» (Pira, Incubo, Marea cremisi…) = senza tiro per colpire.
9. Infuso: elisir PROVVISORIO = 1/4 della salute; bere costa l'azione.
10. Fioritura del parassita: al terzo turno 1d6 + esplosione 2d6.
11. Gabbia d'ossa solo su Lancia e Spine (Spirito d'ossa non tira il d20).
12. Nemici comuni: caratteristiche a +0 (TS = d20 + livello); CD dei loro stati = 8 + attacco + livello; mastino del secondo piano livello 2.
13. Élite: il turno dell'annuncio attaccano comunque con un a volontà; il potere annunciato è già speso (Spezza-carica lo fa perdere e spegne la runa).
14. Ceneri sul pelo: a volontà difensivo (fino al suo turno), vale contro gli attacchi in mischia, non contro il focus.
15. Senza scampo: usa il primo a volontà della specializzazione (l'offesa); scatta solo sui tuoi poteri, non sui danni continuativi.

**Prossimi passi del codice:** collegare il motore a `test.html` (sala di prova veritiera, con il registro degli scontri), poi creazione e scheda (specializzazione e scelte), poi `gioco.html`; togliere il vecchio motore solo quando il nuovo è in gioco. Guardiani e sovrano (8d-8e) e cacce (gruppo 5) dopo le decisioni.
