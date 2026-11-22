# Decisioni del 16 novembre 2026

Registro delle decisioni prese con Francesco lunedì 16/11 (le 5 decisioni piccole del punto della situazione, con i punti che hanno aperto). Come `decisioni_14_novembre.md`: i documenti grandi si allineano da qui. **Il codice resta congelato fino a domenica 22/11**; le misure si fanno con il codice nuovo.

## Stato dell'allineamento
| Documento | Stato |
|---|---|
| Questo registro | Scritto il 16/11 |
| `riscrittura_meccaniche.md`, `riepilogo_riscrittura.md`, `oggetti_per_rarita.md`, `armeria_aldo.md`, `oggetti_manuale.html`, `nemici_manuale.html`, `schema_classi.md`, `classi_manuale.html` | **Regole del 16/11 da riversare** (poteri senza tiro, rinomi «Sentenza», prova di agguato): si fa con il codice domenica 22/11, per non avere nei documenti regole diverse da quelle che i playtest di martedì e venerdì usano (le sezioni toccate sono indicate sotto) |
| Copie in `docs/` sul PC | Allineate il 16/11 sera ai documenti ripuliti (vedi sotto) |
| Pulizia dei cancellati (goblin, orchi, avventurieri) | **Fatta** il 16/11 sera in: `riscrittura_meccaniche.md`, `nemici_manuale.html`, `armeria_aldo.md` (Primo passo), `storia_enea.md`, `storia_casa_ed_esterni.md`, `storia_verita_e_finali.md`, `riepilogo_riscrittura.md`, `mondo_e_incontri.md`, `progressione.md`. Resta `gioco.html` (domenica) |
| Codice (`js/specializzazioni.js`, `js/nemici.js`, test) | **Domenica 22/11**: i sette poteri della sez. 6, *Primo passo*, agguato |

## 1. Elisir rari: più immunità attive insieme
**Scelta B:** nessun limite alle immunità da elisir raro attive insieme. Il freno è l'economia d'azione: un'azione rapida per turno, durata 3 turni, massimo 2 elisir per tipo.
Ripiego: A (una sola immunità per volta, il nuovo sostituisce il vecchio) se dopo le partite il sovrano risulta troppo facile.

## 2. *Voce del sangue* (set di cenere)
**Scelta A:** vale solo sui tiri per colpire (come nel codice). **B** (anche sui TS) è da valutare dopo le misure di domenica. Non vale sulle prove di abilità.

## 3. Mano libera del set di carne
**Scelta A: +2 CA** (come nel codice). È un'eccezione alla regola «+3» dei set, che riguarda il livello dei pezzi e non la CA di questo pezzo. Si alza a +3 solo se i test mostrano gli incantatori troppo fragili (la corazza del platino dà già +3).

## 4. *Piede fermo* (Stivali della lunga caccia, Leggendari)
**Scelta A:** carica (azione rapida), il prossimo TS ha **+4**, giornaliero. Ripiego B: +5.

## 5. *Primo passo* (Stivali dell'Ultimo passo, Leggendari +3, giornaliero)
Sostituisce il «colpo gratuito» del testo dell'armeria. **Non è un colpo gratuito: è un attacco extra.**
- Un attacco extra **classico o speciale a volontà** (mai poteri per scontro o giornalieri), con d20, dadi e bonus completi, come un attacco normale. Può mancare e può essere critico.
- Parte **all'inizio del primo turno del giocatore**, qualunque sia l'esito della prova dell'agguato (sez. 6).
- **−2 CA al nemico nel primo round** solo se il giocatore agisce per primo. Se ha perso la prova dell'agguato, agisce per secondo e questo −2 non vale.
- Il −2 CA di *Primo passo* si **somma** a quello della prova riuscita (agguato, sez. 7) o della Furtività riuscita contro i guardiani: **−4 CA** nel primo round (da misurare contro Dafne, che ha già −2 se scovata).
- Il critico raddoppia solo i dadi, non il modificatore.

## 6. Colpi automatici e poteri senza tiro
**Regola (16/11, vale per tutti i poteri senza tiro, giocatore e nemici):** un colpo che va a segno senza d20 **non è mai critico** e **non riceve bonus** (né +N dell'arma, né caratteristica). Valgono solo il dado dell'arma (se è un attacco con l'arma) e i dadi scritti nel potere. I bonus si applicano solo a un attacco vero e proprio con d20. La CD degli stati dipende ancora dalla caratteristica.

**Poteri che oggi sommano la caratteristica senza tiro (da correggere nel codice domenica 22/11):**
| Classe | Potere | Oggi | Nuovo |
|---|---|---|---|
| Realtà | Sovraccarico | 2d8 + Mente | 2d8 |
| Realtà | Annullamento | 4d8 + Mente (2 dadi in più se Scoperto) | 4d8 (idem) |
| Illusione | Frantumare | 1d6 per Copia + Mente | 1d6 per Copia |
| Illusione | Il Grande Inganno | 2d8 per Copia + Mente | 2d8 per Copia |
| Sangue | Marea cremisi | 4d8 + Spirito | 4d8 |
| Ossa | Spirito d'ossa | 1d8 per placca + Spirito | 1d8 per placca |
| Ossa | Armata dei morti | 4d8 + Spirito | 4d8 |

Effetto stimato al livello 5 (mod circa +4): da −13% (Grande Inganno) a −31% (Sovraccarico) sul danno di questi poteri. **Colpisce solo le quattro specializzazioni degli incantatori.** Francesco: le regole devono essere coerenti per tutti, ci possono essere classi un po' più facili e altre un po' più difficili. Da rimisurare domenica (le misure del 15/11 contavano la caratteristica); da aggiornare i test. Da verificare anche se qualche potere dei nemici somma la caratteristica senza tiro.

***Ultimo colpo*** (Lascito di Dafne, Leggendario, giornaliero): attacco garantito, senza d20; fa dado dell'arma + 2 dadi, senza bonus e senza critico; applica Esposto poi aggrava in Scoperto senza TS. Resta a +2 dadi.

## 7. Agguato (regola univoca con i guardiani)
- Quando si entra in un agguato: **prova contrapposta, d20 + abilità del giocatore contro d20 + Furtività dell'agguatore.**
- **Quale abilità (scelta C):** dipende dall'agguatore, un campo nei dati del nemico. **Percezione** per chi si nasconde o tende trappole (default), **Intuizione** per chi si lancia a testa bassa o finge (da assegnare ai vuoti, sez. 10). Chi usa Intuizione si assegna nella sessione delle cacce (mercoledì 18/11). *Intuizione* esiste tra le nove abilità della scheda (correzione: la prima versione di questo registro lo negava per errore).
- **Prova riuscita:** il giocatore non è sorpreso, agisce per primo e fa un turno completo; il nemico ha **−2 CA nel primo round**.
- **Prova fallita:** l'agguatore agisce per primo con un turno intero (azione standard e rapida), poi ordine normale; il giocatore ha **−2 CA nel primo round**, turno dell'agguatore compreso.
- **Primo round** = finché tutti hanno agito una volta; la stessa definizione vale per la Furtività contro i guardiani (riuscita: −2 CA al guardiano; fallita: −2 CA al giocatore).
- *Elmo del Cacciatore di notti* («non puoi essere sorpreso»): la prova riesce in automatico (e vale il −2 CA al nemico). *Anello del Mastino*: la Percezione contro la Furtività riesce in automatico.
- Il fermaglio nascosto riduce gli agguati al 15% (percentuali da rivalutare quando i vuoti avranno statistiche e PE).

## 8. Nomi dei poteri «Sentenza» (scelta C: si rinominano tutti e quattro)
Il nome compariva su quattro poteri, con rischio di confusione (un Berserker con lo Spadone o con il set avrebbe due «Sentenza» nella lista; contro il sovrano due nel registro dello scontro). Nuovi nomi:
| Potere | Dove | Vecchio nome | **Nuovo nome** |
|---|---|---|---|
| Giornaliero finale, 3 attacchi, critici sul Vacillante | Berserker, livello 5 (nel codice) | Sentenza | **Resa dei conti** |
| Giornaliero | Spadone della Veglia lunga (armeria) | Sentenza del giudice | **Verdetto del giudice** |
| Giornaliero, set di cenere a 5 pezzi (non ancora nel codice) | Set di cenere | Sentenza dell'erede | **Decreto dell'erede** |
| Colpo annunciato, aggrava Maledetto in Condannato | Sovrano (`nemici.js`) | Sentenza maledetta | **Condanna maledetta** |
I nuovi nomi non compaiono altrove nel codice. Il cambio di nome non tocca nessun valore: **si applica ovunque nell'allineamento di domenica 22/11** (codice: `specializzazioni.js`, `nemici.js`, `cervello.js`, test, `prova.html`, `gioco.html`; documenti: schema delle classi, manuale classi, riscrittura, riepilogo, armeria, oggetti per rarità, manuale nemici, regole del bot).

## 9. Aperti
- Chi usa Percezione o Intuizione tra i vuoti: sessione di mercoledì 18/11.
- Misure di domenica: sette poteri senza caratteristica, *Primo passo* (−4 CA sui guardiani e sugli agguati riusciti), *Voce del sangue* su TS, mano libera +2, *Piede fermo* +4, elisir rari multipli.
- Verificare nel codice dei guardiani se la Furtività dà già il −2 CA al primo round e se Dafne scovata lo riceve (vedi sez. 5).

## 10. I vuoti: cacce, agguati, diari, compendio (decisioni di Francesco, 16/11)
Cancellati: goblin, orchi, bande e i cinque avventurieri (`registro_cancellati.md`). Al loro posto, una sola famiglia di nemici comuni.
- **Chi sono:** ex avventurieri morti nel tentativo di arrivare a Casa Vespera; di razze diverse. La maledizione li ha *svuotati*: nessuna personalità, resta solo «che cosa sapevo fare in vita». Sono **tutti maledetti** e devono essere **tutti diversi** tra loro.
- **Come combattono:** attaccano qualunque cosa in qualunque modo; alcuni a testa bassa senza ragionare, altri con trappole (così lavorano le abilità). Nessuna resa, nessun ritorno.
- **Cacce:** si riusano le statistiche già bilanciate (riscrittura 8c, gruppo 5), **cambia solo il nome** e si aggiunge il background. **Agguati:** vuoti nuovi, da progettare.
- **Linea guida uniforme:** si riusa tutto il possibile, con un'unica linea guida (vuoto + diario + compendio) su tutto.
- **Maledetto = colore, non meccanica** (verificato nel codice: `maledetto` in `nemici.js` non altera lo scontro; Maledetto/Condannato sono stati del giocatore). Dichiarare tutti i vuoti maledetti non tocca nessun bilanciamento.
- **Diari:** ogni vuoto (caccia e agguato) ha un diario privato con una data più o meno distante dal personaggio. L'ordine dei diari è sparso, senza senso logico (momenti diversi). Per i **Guardiani** invece l'ordine è reale: Atena è la più vecchia e poi a scalare gli altri. Per i **PNG principali** (sovrano, regina, maggiordomi, figli) il tempo si è fermato nell'istante in cui il sovrano è stato avvolto del tutto dalla maledizione.
- **Compendio** (nuova sezione accanto a «Regolamento» nella pagina principale): PNG, nemici, armi, armature sbloccati, ciascuno con un po' di background e storia. Realizzazione a fasi, dopo il codice di domenica (da pianificare).
- **Calendario (battuta di Guendalina, 16/11):** «Siamo a Foscomonte, nella foresta dei pini secolari ai piedi dei monti di ferro. È la II decade del V mese, anno XV della luna crescente. Oggi sarebbe la festa del raccolto.» Formato delle date dei diari: «decade, mese, anno» in cifre romane, era della luna crescente; oggi = II decade, V mese, anno XV.
- **Calendario (16/11, risposte di Francesco):** 1 anno = 10 mesi; 1 mese = 50 giorni (5 decadi); 1 giorno = 10 ore; 1 anno = 500 giorni. La decade (10 giorni) è l'unità della regola facoltativa «Peso dei giorni» (punto di salute mentale ogni 10 giorni trascorsi): il calendario è fatto apposta per questo. «II decade del V mese» = giorni 11-20 del quinto mese.
- **Maledizione (16/11):** inizia con l'incantesimo di Adele, si fortifica nella rabbia del sovrano **fino alla data di Guendalina (II decade, V mese, anno XV)**; da lì il tempo non scorre più in modo normale per nessun PNG della casa, bloccati tra tempo e spazio. Quindi la data dei PNG principali è **II decade, V mese, anno XV**, uguale per tutti.
- **Risposte di Francesco (16/11, sera):** (1) l'incantesimo di Adele è **pochi mesi prima** della data di Guendalina (scelgo II mese, anno XV; modificabile). (2) La casa è una **bolla temporale** raggiungibile solo dai portali sparsi per il mondo: il tempo dentro non scorre, ma la maledizione divora tutto e tutti (prova: gli animali si trasformano lentamente). Quindi **nessuna data dei diari dopo l'anno XV**; i vuoti entrati dai portali hanno date nell'anno XV o prima, a distanza varia. (3) **Ordine di età dei guardiani:** Atena (angelica, la più vecchia), poi Dafne (drow), poi Enea (nano) ed Ettore (umano) di età simile (propongo Enea prima di Ettore, modificabile).
- **Da fornire/decidere:** otto nuovi nomi delle cacce (proposta di una rosa mercoledì 18/11); Percezione/Intuizione per vuoto (mercoledì 18/11: trappole e agguati Percezione, cariche a testa bassa Intuizione); nome più semplice per il codice (suggerito: campo `vuoto: true`, senza nuovo tipo).
