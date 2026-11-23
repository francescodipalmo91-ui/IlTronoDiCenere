# Riepilogo della riscrittura (per Claude) — stato al 15/11/2026 (sera)

Leggere dopo `punto_della_situazione.md` e `registro_cancellati.md`. **Decisioni del 16/11 (poteri senza tiro, *Primo passo* come attacco extra, prova di agguato, rinomi «Sentenza», vuoti, calendario):** vedi `decisioni_16_novembre.md`; **riversate nel codice e nei documenti il 22/11** (`decisioni_22_novembre.md`). Dettaglio completo: `claude/riscrittura_meccaniche.md` (sezioni 0-9), che prevale su ogni altro documento per le regole. Le decisioni del 14/11 (armi, colpi, TS, zaino, armature senza reazioni) sono in `decisioni_14_novembre.md`; quelle del 15/11 (bilanciamento dei boss, caratteristica una volta per attacco, opzione B) in `lavoro_codice_domenica.md`; entrambe riassunte in fondo a questo file.
**Meccaniche congelate dal 09/11/2026:** quelle decise non si ridiscutono, si aggiunge soltanto. **Schema dei livelli, privilegi e vie ridisegnato il 10/11/2026** su diagramma di Francesco (sotto).
**Codice CONGELATO dal 15/11/2026 (sera):** Francesco: niente più modifiche; ora va giocato e testato da persone. Le misure del bot non tengono conto di molti aspetti del gioco vero.

## Da fare, in ordine
1. ~~8c gruppo 4 (élite)~~ → approvato il 06/11/2026 (mastino della soglia di Adele liv. 4, mastino corazzato liv. 5).
2. **8c gruppo 5:** vulnerabilità e resistenze delle otto cacce fatte (riscrittura 8c); restano personaggi e poteri (★ 2/1, ★★ 2/2, ★★★ 3/2) .
3a. **Set (10/11):** due set indossati, bonus a 2/4/5 pezzi (a volontà / per scontro / giornaliero, fuori dagli slot di potere); nomi provvisori «set del sovrano di cenere» (danno, ex Retaggio) e «set del sovrano di carne» (resistenza, ex Vespera); conflitto sulla testa (corona/elmo); spada con campo di forza, solo finale B; oggetto di mano libera +2 CA al posto dell'arma Vespera; niente legame vincolante. Dettaglio in `storia_retaggio_e_set.md` 7c e riscrittura 8e. **Nel codice dal 15/11:** Odore di Casa (−1), Sguardo della Casa, Ultima Guardia, Voce del sangue, mano libera +2; manca Decreto dell'erede.
3. **8d guardiani** (Ettore, Enea, Dafne e Atena fatti il 10/11; regola del risparmio per Ettore ed Enea; **Dafne non si risparmia** dal 15/11; Atena muore sempre) e **8e sovrano (fatto l'11/11: tre fasi di armatura più la carne, stati Maledetto/Condannato/Svuotato/Prosciugato, evento finale per finale, soglia della sala del trono)**; restano le pergamene (quali, dove, quale prova) e la soglia del Retaggio sul nuovo sistema (`storia_retaggio_e_set.md`, sezione 7).
4. ~~Allineare i documenti~~ → **fatto il 09/11**; `docs/` del repo GitHub allineato il 15/11 (sera).
4b. ~~Scala dell'08/11 nella riscrittura~~ → **fatto il 09/11** (sezioni 0 e 2).
4c. ~~Allineamento ai documenti del 14/11~~ → **fatto il 15/11**: tutti i documenti (compresi `riscrittura_meccaniche.md`, `oggetti_manuale.html` e le copie in `docs/` sul PC) allineati al registro del 14/11 e al codice del 15/11.
5. **Codice, in quest'ordine:** (a) **test di Francesco giocando** (sala di prova e gioco); (b) collegare Enea, Dafne, Atena e il sovrano in `gioco.html` (oggi sono nella sala di prova); (c) **pulizia**: togliere il vecchio motore (`combattimento.js`, `magia_combattimento.js`, `sciamano.js`, `tecniche.js`, `magia.js`, `incantesimi.js`) e i percorsi doppi `motoreNuovo()` in `gioco.html` e `creazione.html`; i personaggi vecchi si ricreano; (d) `test.html`, `tutorial.html` sul motore nuovo; (e) regolamento Base / Facoltative, allineato al codice; (f) inventario: togliere, buttare o posare oggetti nello sgabuzzino della dispensa (deciso il 15/11, non nel codice).

## Metodo di Francesco (rispettarlo)
- Punto per punto, una cosa alla volta; prima le leggere.
- Proposte nel formato tabellare già usato (a volontà / per scontro 2 su 3 / giornaliero 1 su 2 / livelli 3-5).
- Pensiero critico sempre: obiezioni numerate, poi «lavoriamo sulle obiezioni» una per una con opzioni A/B/C e una proposta motivata.

## Schema delle classi
| Classe | Spec. 1 | Spec. 2 | Privilegio liv. 1 | Privilegio liv. 3 | Privilegio liv. 5 |
|---|---|---|---|---|---|
| Guerriero (Vigore) | Berserker (ex Esecutore) | Paladino (ex Difensore) | Furia | Mente incrollabile | Secondo vento |
| Sciamano (Agilità) | Funghi (ex Spore) | Legno (ex Linfa) | Radici profonde (+1d4 se il bersaglio ha uno stato) | Legame del sottobosco | Infuso |
| Arcanista (Mente) | Realtà | Illusione | Ultima scintilla | Pozzo arcano | Coagulo |
| Monaco (Spirito) | Sangue | Ossa | Eredità del sepolcro | Ultimo servizio | Tocco lenitivo |

Privilegi: il Guerriero è dal diagramma; le altre classi per tipo (ex tratto II, ex tratto I, ex potere di classe), assegnazione confermata il 10/11. **Arcanista: dado vita d6** (15/11, scelta di Francesco: classe più «hard», compensata da oggetti, pergamene e pozioni).

- **Scala dei poteri (DECISA il 10/11/2026 dal diagramma di Francesco, identica per tutte le classi; prevale sulle tabelle delle specializzazioni; dettaglio: riscrittura, sezione 0):**

| Livello | A volontà | Per scontro | Giornalieri | Cosa arriva |
|---|---|---|---|---|
| 1 | 2 (scelti su 3) | 1 (scelto su 3) | 1 (scelto su 2) | specializzazione (e arma) in creazione; privilegio I |
| 2 | 3 | 1 | 1 | il terzo a volontà arriva da solo; **via di prestigio** e 1° potere della via |
| 3 | 3 | 2 | 2 | privilegio II; 2° potere della via; per scontro una delle due carte rimaste; giornaliero il rimasto **o** il terzo |
| 4 | 3 | 3 | 2 | 3° potere della via; per scontro il rimasto **o** il quarto |
| 5 | 3 | 3 | 3 | privilegio III; giornaliero finale (arriva da solo) |

  - Il livello 3 è lo «spartiacque» del personaggio dentro la casa (voluto): quattro novità. Il livello 5 non ha potere della via.
  - **Catalogo per specializzazione: 11 poteri**, 3 a volontà, 4 per scontro, 4 giornalieri; il giocatore ne conosce 9. Niente etichetta «fisso». Il **terzo giornaliero entra in scelta al livello 3** (era il 4, spostato il 10/11), il quarto per scontro al 4, il finale giornaliero arriva da solo al 5.
  - **Nessun potere d'ufficio (DECISO il 09/11/2026, 1A e 2A):** al livello 1 si scelgono 2 a volontà su 3 (a video il ruolo di ciascuno, nessun avviso). Eccezioni volute: il terzo a volontà al livello 2, il finale del 5 e i poteri della via (la scelta è la via). Con le pergamene il pool potrà allargarsi e le scelte con lui.
  - **Scelte doppie (DECISE l'08/11/2026, aggiornate il 10/11):** a ogni livello che porta una scelta il giocatore sceglie a video tra potere e descrizione, vedendo i poteri che ha già; **nessun cambio** nel gioco (nella sala di prova sì). Coppie sempre «di base contro del livello». Un per scontro e un giornaliero restano fuori per sempre. ⚠ Con le pergamene (cambio dei poteri al riposo dopo il livello, vedi `pergamene.md`) i poteri non scelti non restano più fuori per sempre.
  - **Via di prestigio al livello 2** (Aldo o Guendalina): tre poteri **passivi** (non occupano slot) ai livelli 2, 3 e 4.
  - **Decisioni chiuse (10/11):** *Mani che curano* = pozioni ed elisir di salute +50% (arrotondato per eccesso; con «Fame» anche razioni), dal livello 3; *Infuso* resta al 5 e *Legame del sottobosco* al 3; arma in creazione per tutte le classi; focus per classe (Sciamano, Arcanista, Monaco): libro arcano, filatterio, simbolo sacro (d6) o bastone (d8, due mani); *Bastone* → *Manganello*. Privilegi delle altre classi confermati.
- Per scontro = una volta per scontro. Specializzazione scelta in creazione, mai cambiabile.
- Vie (si scelgono al livello 2, poteri passivi ai livelli 2-4, uguali per tutti): **Aldo, la caccia** (Occhio del cacciatore / Odore del sangue / Senza scampo); **Guendalina, il focolare** (La lanterna / Mani che curano / La soglia di casa).
- Meccaniche firma (11/11, aggiornate il 15/11): Frattura +2 danni su Esposto/Scoperto (Realtà, forza; *Annullamento* su Scoperto +2 dadi); Copie deterministiche a metà danno + Indebolito (Illusione, psichico; *Sussurro* crea una Copia a ogni colpo); Scorza viva e scudi di PF (Legno, contundente, niente cure); veleno e Pelle di micelio (Funghi); Sangue versato al 10% della salute massima, senza cure (Monaco del Sangue); placche d'ossa 3 × (3 + livello − 1), generate solo da Spine e Armatura d'ossa, Gabbia d'ossa su 19-20; *Spirito d'ossa* 1d8 per placca, senza Spirito dal 22/11 (Ossa). Il fuoco sacro non ha più una classe (oggetti e pergamene).

## Regole generali chiave
- Un'azione standard e una rapida per turno (rapida: un oggetto equipaggiato o cambiato, pozione o elisir, Infuso; dal 14/11 anche i poteri di equipaggiamento; dal 15/11 anche i poteri di set a carica come Sguardo della Casa e Voce del sangue); dialogo gratuito; niente risorse (furia, mana, fede, natura eliminati). **Niente reazioni nel gioco (14/11).**
- Stati: lieve/grave per Taglio (Sanguinante/Emorragia), Fuoco (Scottato/Ustionato), Veleno (Intossicato/Avvelenato), Contundente (Stordito/Commosso = Indebolito 3 turni), Perforante (Esposto −2 CA / Scoperto −4 CA e critico 19-20). Indebolito −2 per colpire. Impaurito: 2 turni, solo poteri a volontà. **Stordito = perde l'intero turno (standard e rapida), poi immune 2 turni** (11/11; sui boss Indebolito).
- Durata 3 turni (Impaurito 2). A volontà applicano; per scontro applicano e aggravano; giornalieri aggravano. Aggravare richiede il lieve (eccezione: Commosso anche se il bersaglio è immune allo Stordito).
- **TS simmetrico:** applicare uno stato → TS di chi lo subisce (CD 8 + mod + livello); aggravare è automatico; un TS solo per potere. **TS (aggiornati il 14/11): Vigore (Sanguinante, Intossicato, Stordito, Indebolito), Agilità (Scottato, Esposto, Scoperto), Mente (Svuotato, Prosciugato), Spirito (Impaurito, Maledetto, Condannato).** Il TS dipende dallo stato, non dal tipo di danno.
- **Colpi (14/11, precisato il 15/11):** attacco singolo un d20; più attacchi un d20 ciascuno, senza catena; colpo gratuito automatico, solo dado dell'arma, mai critico, solo se il principale colpisce; poteri per scontro e giornalieri (anche di classe) si consumano alla dichiarazione, anche se l'attacco manca. **La caratteristica si somma una volta per attacco, mai per dado** (vale per tutte le classi e per i nemici); con attacchi separati si somma a ciascuno.
- «Danno subito» = salute effettivamente persa.
- Vulnerabile +50% (eccesso), resistente −50% (eccesso), immune 0. Gradiente della maledizione: fuori casa solo resistenze; mastini immunità; sovrano le più forti. Fuoco sacro: neutro fuori, vulnerabili mastini e sovrano. Etichetta «Maledetto» (infernali, mastini, guardiani, sovrano).
- Pergamene (aggiornato 13-14/11, dettaglio `pergamene.md`): lasciti di avventurieri; **26 pergamene uniche**, nessun limite di numero, sostituiscono solo poteri per scontro e giornalieri; prova di abilità per prenderle; cambio dei poteri al primo riposo dopo il livello (facile) o una sola volta (difficile); tipi nuovi vulnerabili solo per il guardiano del lascito. **Non ancora nel codice.**
- **Elisir di stato (nel codice dal 15/11):** sei famiglie; comune cura il lieve, raro anche il grave e dà 3 turni di immunità; azione rapida. ⚠ Il codice permette più immunità rare insieme: da decidere se tenerne una sola attiva.

## Nemici
- Niente PA. Ordinari e cacce ★ 2/1; ★★ 2/2; ★★★ 3/2; élite (mastini boss) 3/2; boss come il giocatore, giornalieri a soglie (Ettore 50%; Enea 50% e prima caduta; Dafne 50/25; Atena a terzi di salute; il sovrano una fase per armatura). **Annuncio un turno prima dei poteri forti dei boss**, con icone (🗡️ attacco, 🗡️ vibrante caricato, 🛡️ difesa); il colpo annunciato non si perde al cambio fase. **Opzione B (15/11):** a ogni cambio fase il boss gioca tutta la sequenza della fase, una fase per volta, anche dopo un danno massiccio (Dafne esclusa). **Ettore scritto con Agilità alta** (ladro).
- **Valori congelati (15/11):** Ettore 42 PF / CA 12 / +4 / 1d4+2; Enea 62 / 13 / +6 / 1d8+2; Dafne 72 / 15 / +8 / 1d8+3; Atena 105 / 16 / +10 / 1d10+4; sovrano 70 di cenere + 40 di carne, +10, 1d12+4, CA 16 (70–47) / 15 (47–23) / 14 (23–0) / 13 carne.
- Sovrano (11/11): due barre (cenere in tre fasi di armatura, poi carne); ascia bipenne, solo taglio; dadi 1/1/2; 3/3/3 (uno per fase); stati nuovi Maledetto/Condannato/Svuotato/Prosciugato (TS di Spirito per Maledetto e Condannato, di Mente per Svuotato e Prosciugato); evento finale diverso per finale; resistente (non immune) al veleno; immunità della mappa originale con le clausole del set di cenere. Vedi riscrittura 8e.
- **Goblin, orchi e i cinque avventurieri cancellati (16/11)**: al loro posto i vuoti (`decisioni_16_novembre.md`, sez. 10).

## Mappa vulnerabilità (✓ vuln, ✗ resist, ⛔ immune, · neutro) — aggiornata il 15/11
| Tipo | Ettore | Enea | Dafne | Atena | Sovrano arm. | Sovrano vero |
|---|---|---|---|---|---|---|
| Taglio | ✓ | ✗ | · | ✗ | ✗ | ✓ |
| Contundente | · | ✓ | ✗ | · | ✓ | · |
| Perforante | · | · | ✓ | ✓ | ✗ | · |
| Sangue | · | ✓ | · | · | ⛔ | ✓ |
| Psichico (ex illusione) | ✓ | · | ✓ | · | ⛔ | ✗ |
| Fuoco sacro | · | ✓ | · | ✓ | ✓ | · |
| Ossa | · | ✗ | ✓ | · | ✗ | · |
| Veleno | ✓ | · | ✗ | · | ✗ | ✓ |

Atena (15/11): tolte le vulnerabilità a sangue e veleno e la resistenza allo psichico.

## Decisioni del 06/11/2026 (dettaglio: riscrittura, sezione 8f e 8c gruppo 5)
- ~~Livelli fino a 10~~ → **cancellati il 23/11**: livelli a tappe, tetto 5, niente PE (`progressione.md`).
- **Boss sempre un livello sopra il giocatore**; percentuali di vittoria (Ettore ~sempre, Enea 80%, Dafne 70%, Atena 60%, sovrano 50%) misurate con l'equipaggiamento del momento.
- **Bonus equipaggiamento +1/+2/+3** (tetto +3 per tutto, set compresi dal 12/11; vedi `oggetti_per_rarita.md`); sostituisce «+livello».
- Armi: attacco base senza stati e senza sinergie; ogni PNG lascia la sua arma (nessuna scelta); **focus** per classe (Sciamano, Arcanista, Monaco): mano primaria arma, secondaria focus facoltativo; con il focus gli offensivi che tirano il dado dell'arma passano da d6 a d8; bastone = arma + focus, due mani, d8; pergamene solo come extra; matrice arma-classe approvata (poi resa libera il 13/11).
- **Mastino corazzato** (liv. 5, tre rune azzurre) e **mastino della soglia di Adele** (liv. 4); cacce rimappate, Profeta unico maledetto (ora Ezechiele Cenerino).

## Decisioni dell'11/11/2026 (dettaglio: riscrittura, sezioni 0, 2, 4-6 e 8e)
- **Specializzazioni ridisegnate (una offensiva e una difensiva per classe):** Guerriero Berserker / Paladino; Sciamano Funghi (veleno) / Legno (contundente e scudi di PF, senza cure); Arcanista Realtà (forza, nuova) / Illusione (psichico); Monaco Sangue (dall'Arcanista, costo 10% della salute, niente cure) / Ossa. Purificatore eliminato; fuoco sacro riciclato in oggetti e pergamene. Privilegi dello Sciamano validi per qualsiasi stato. Scariche alleggerite (Frantumare 1d6, Incubo +1d6, Grande Inganno 2d8; Spirito d'ossa portato a 1d8 per placca il 15/11). Idea in serbo *Appesantito*.
- **Azione rapida** (una per turno, in più della standard): equipaggiare o cambiare un oggetto, pozione o elisir, Infuso dello Sciamano. Stordito = intero turno.
- **Armi:** al massimo due con sé, cambio con l'azione rapida; il tipo di danno lo decide l'arma per il Guerriero e per l'attacco base di tutte le classi; gli incantatori (Sciamano compreso) tengono il tipo dei loro poteri.
- **Sovrano:** cenere immune al Sanguinante finché l'armatura è integra o incrinata; fasi Rabbia / Maledetto / Vuoto; dadi 1/1/2; evento finale per finale, associazione ai finali confermata l'11/11.
- **Morte contro il sovrano:** facile, ripartenza dalla scena di preparazione; difficile, game over; niente fuga né resa; avviso prima dell'ultimo ingresso (testi provvisori). Rivelazione di Atena riscritta sui set (provvisoria).

## Decisioni del 14/11/2026 (dettaglio: `decisioni_14_novembre.md`)
- **Armi:** Lama gemella (ora Corvino Due Lame) Raro +2 (e pergamena garantita del platino, tra le 26); Flagello chiodato perforante; Strega della torbiera (ora Ysolde della Torbiera) → pergamena di fuoco sacro; **Focus rinforzato** (Non comune +1, senza poteri, in armeria); Stiletto rituale solo perforante; Giuramento del Rettore (arma a due facce, cambio faccia = azione rapida) e Spaccatoro di Caius si tengono entrambi.
- **Poteri delle armi chiusi:** Danza delle lame, Colpo del Giuramento, Punta nella piaga, Segno sulla mappa (Rari); Raccolto, Albero caduto, Doppia stoccata, Pioggia di braci (Leggendari).
- **Colpi e TS:** regole di colpo e tabella TS (vedi sopra).
- **Zaino:** 8 posti di scorta, nascondiglio da 10, consumabili fuori dai posti, pergamene senza limite. **Armi comuni:** sei armi da mischia (tre tipi × una/due mani), niente armi da lancio.
- **Niente reazioni:** i poteri di armature e accessori diventano poteri normali con azione rapida, nelle due formule «fino al tuo prossimo turno» e «carica». *Piede fermo* da riconfermare con Francesco.

## Decisioni del 15/11/2026 (dettaglio: `lavoro_codice_domenica.md`, riscrittura 8g)
- **Caratteristica una volta per attacco**, mai per dado (giocatore e nemici); attacchi separati la sommano ciascuno. *Frantumare* e *Grande Inganno* sommavano la Mente una volta; *Spirito d'ossa* 1d8 per placca (dal 16/11, nel codice dal 22/11, i poteri senza tiro non sommano più la caratteristica).
- **Annunci tenuti** (non trasformati in poteri normali), con icone; colpo annunciato mai perso al cambio fase.
- **Opzione B** per tutti i boss tranne Dafne: ogni fase gioca tutta la sequenza, una fase per volta.
- **Valori dei boss rialzati e congelati** (vedi Nemici). Misure del bot (set della storia, 2 elisir per tipo, scelte da «secondo cervello» `js/cervello.js`): Ettore 96%, Enea 83%, Dafne 82%, Atena 74%, sovrano 63%; forbice ampia tra le build (es. Ossa ~100%, Paladino contro Atena 29%, Legno contro Dafne 43%, Funghi e Illusione contro il sovrano 27-32%). Le misure non contano pergamene, armeria né scelte umane.
- **Arcanista d6**, **Atena** senza vulnerabilità a sangue e veleno né resistenza allo psichico, **sovrano** con la mappa originale e le clausole del set di cenere, **Odore di Casa −1**, **Dafne non si risparmia**.
- **Inventario:** il giocatore potrà togliere, buttare o posare oggetti nello sgabuzzino della dispensa (da fare nel gioco). Il giocatore terrà di solito elisir e pozioni rari.
- **Aperti (non toccare il codice senza Francesco):** una sola immunità di elisir raro attiva per volta?; *Voce del sangue* vale anche su TS e prove?; mano libera +2 o +3 (`oggetti_manuale` proponeva +3); *Decreto dell'erede* da scrivere.

## Codice — storia (08/11) e stato (15/11)
Il motore nuovo (`js/poteri.js`, `specializzazioni.js`, `scontro.js`, `nemici.js`, `oggetti.js`, `racconto.js`, `regole.js`, `cervello.js`) è descritto in `lavoro_codice_domenica.md` e `cervello_bot.md`. Sala di prova: `prova.html` (blocco «Set e borsa», pulsanti elisir e set, icone degli annunci, bot). 233 test verdi il 15/11.

**Ramo `riscrittura` (08/11):** creazione con specializzazione (personaggi `motore: 2`), scontro sul motore nuovo con un ponte in `gioco.html`, riposo e scelte di livello. Copia di prova sul PC: `PROVA_gioco`. I personaggi vecchi ricevono un avviso e l'invito a ricrearli.

**Scelte fatte nel codice dove i documenti tacevano** (08/11, Francesco: «si continua così»): metà per eccesso; danni continuativi a inizio turno di chi li porta; effetti «per N turni» scendono all'inizio del proprio turno; contrattacchi solo dado dell'arma; Colpo del boia e Resa dei conti (ex Sentenza) contro un Vacillante colpiscono sempre e sono critici; Rivalsa somma il Vigore; poteri con dadi senza la parola «attacco» = senza tiro; Fioritura del parassita 1d6 + esplosione 2d6; Gabbia d'ossa solo su Lancia e Spine; nemici comuni con caratteristiche a +0; élite: il potere annunciato è già speso; Ceneri sul pelo solo contro la mischia; Senza scampo usa il primo a volontà della specializzazione.
