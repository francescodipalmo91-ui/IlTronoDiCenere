# Il cervello del giocatore automatico

File: `js/cervello.js` (15/11/2026). È il giocatore automatico della sala di prova, sia nello scontro automatico sia nelle simulazioni: gioca come un giocatore medio umano. Ogni turno scorre le regole della sua specializzazione **in ordine** e usa il primo potere che è disponibile e la cui condizione vale. Nel registro dello scontro automatico scrive anche il perché.

Prima delle regole, per tutti: se la salute è sotto il 40% (o è Vacillante con un colpo annunciato) usa la cura di classe del livello 5. In simulazione beve una pozione (azione rapida) quando è Vacillante e cerca Dafne quando è nascosta.

**Azione rapida (una per turno, prima dell'azione):** pozione se è Vacillante; altrimenti un elisir di stato contro lo stato che pesa di più (Impaurito, poi Esposto, Sanguinante, Intossicato, Scottato; Indebolito solo se grave o lungo; il raro se c'è, il comune solo sul lieve); altrimenti i poteri di set: Sguardo della Casa, poi Voce del sangue.

**Come correggerlo:** scrivi accanto a una riga cosa faresti tu (spostala, cambia la condizione, aggiungine una); io aggiorno il codice e questo file.

## Guerriero, Berserker

| # | Potere | Quando | Perché |
|---|---|---|---|
| 1 | Marchio della preda (giornaliero) | `s.boss && s.turno <= 2` | contro un boss il marchio rende per tutto lo scontro |
| 2 | Sentenza (giornaliero) | `s.vac` | Vacillante: tre critici |
| 3 | Colpo del boia (giornaliero) | `s.vac` | Vacillante: critico automatico |
| 4 | Caccia al ferito (per scontro) | `s.vac || s.annuncio` | Vacillante o colpo annunciato: un dado in più e niente carica |
| 5 | Assalto implacabile (giornaliero) | `!s.haSa && s.puoSa` | applica e aggrava lo stato dell'arma in un colpo |
| 6 | Colpo di mestiere (a volontà) | `!s.haSa && s.puoSa` | prima lo stato dell'arma |
| 7 | Colpo crudele (per scontro) | `s.haSa && !s.graveSa` | stato dell'arma presente: lo aggrava |
| 8 | Ferita riaperta (per scontro) | `s.haSa && s.turni(s.sa) >= 2` | stato lungo: lo incassa tutto subito |
| 9 | Spezza-guardia (per scontro) | `!s.ha("esposto")` | Esposto: più facile colpire |
| 10 | Guardia feroce (a volontà) | `s.annuncio && s.ioVac` | colpo annunciato e poca salute: in difesa |
| 11 | Colpo poderoso (a volontà) | `sempre` | attacco base, +2 sugli stati |

## Guerriero, Paladino

| # | Potere | Quando | Perché |
|---|---|---|---|
| 1 | Spezza-carica (per scontro) | `s.annuncio` | colpo annunciato: lo spezza |
| 2 | Silenzio della casa (giornaliero) | `s.annuncio` | colpo annunciato: lo spegne per 2 turni |
| 3 | Ritorsione (per scontro) | `s.annuncio` | colpo annunciato: lo annulla e risponde |
| 4 | Veglia di ferro (giornaliero) | `s.boss && s.turno <= 2` | contro un boss: difesa per 3 turni |
| 5 | Ultimo baluardo (giornaliero) | `s.pvPct < 0.6` | salute in calo: non può scendere a 0 |
| 6 | Rivalsa (giornaliero) | `s.ioVac || s.colpitoUltimo` | è stato colpito: restituisce il danno |
| 7 | Rintocco (per scontro) | `sempre` | stato dell'arma e Indebolito, +2 CA |
| 8 | Rappresaglia (per scontro) | `s.ioVac` | poca salute: ogni colpo subito si paga |
| 9 | In guardia (a volontà) | `s.annuncio` | colpo annunciato: in guardia |
| 10 | Colpo di mestiere (a volontà) | `!s.haSa && s.puoSa` | prima lo stato dell'arma |
| 11 | Colpo di guardia (a volontà) | `sempre` | attacco base, +2 se colpito |

## Sciamano, Funghi

| # | Potere | Quando | Perché |
|---|---|---|---|
| 1 | Esalazione (per scontro) | `!s.ha("intossicato") && s.puo("intossicato")` | veleno e Indebolito senza tiro per colpire |
| 2 | Puntura di mandragora (a volontà) | `!s.ha("intossicato")` | prima il veleno |
| 3 | Pestilenza (giornaliero) | `s.ha("intossicato")` | veleno addosso: non scade più |
| 4 | Muffa che dilaga (per scontro) | `s.ha("intossicato")` | ogni colpo allunga il veleno |
| 5 | Sciame putrido (giornaliero) | `s.boss` | danno ogni turno senza tiro |
| 6 | Spore del morbo (per scontro) | `s.ha("intossicato") && !s.grave("intossicato")` | aggrava il veleno |
| 7 | Marea di putrefazione (giornaliero) | `s.grave("intossicato")` | veleno grave: doppio dei dadi |
| 8 | Cuore di tossina (giornaliero) | `s.grave("intossicato") && s.turni("intossicato") >= 2` | incassa tutto il veleno |
| 9 | Cisti parassita (per scontro) | `s.ha("intossicato")` | trappola: aggrava al prossimo attacco |
| 10 | Tappeto di micelio (a volontà) | `s.ha("intossicato") && s.turni("intossicato") <= 1` | il veleno sta per scadere: lo allunga |
| 11 | Pelle di micelio (a volontà) | `s.annuncio && s.ioVac` | colpo annunciato e poca salute |
| 12 | Puntura di mandragora (a volontà) | `sempre` | attacco base |

## Sciamano, Legno

| # | Potere | Quando | Perché |
|---|---|---|---|
| 1 | Corazza di quercia (giornaliero) | `s.boss && s.turno <= 2` | scudo e CA per tutto lo scontro |
| 2 | Radici avvolgenti (per scontro) | `!s.scudo` | senza scudo: scudo grande e nemico Indebolito |
| 3 | Pioggia di rami (giornaliero) | `s.boss` | danno ogni turno senza tiro |
| 4 | Radice madre (giornaliero) | `s.boss && s.turno <= 4` | lo scudo si ricarica di più |
| 5 | Corteccia nuova (per scontro) | `s.annuncio && (!s.scudo || s.scudo.pf < 6)` | colpo annunciato e scudo basso |
| 6 | Ghianda esplosiva (per scontro) | `s.annuncio` | colpo annunciato: la trappola scoppia |
| 7 | Foresta che avanza (giornaliero) | `s.vac || s.turno >= 4` | grande attacco e scudo pieno per 3 turni |
| 8 | Pugno di quercia (per scontro) | `s.ha("stordito") && !s.grave("stordito")` | aggrava lo stato contundente |
| 9 | Corteccia viva (a volontà) | `!s.scudo && s.annuncio` | colpo annunciato: scudo |
| 10 | Radice inchiodante (a volontà) | `s.grave("stordito") && !s.ha("indebolito")` | Commosso: Indebolito più lungo |
| 11 | Colpo di nodo (a volontà) | `sempre` | attacco base |

## Arcanista, Realtà

| # | Potere | Quando | Perché |
|---|---|---|---|
| 1 | Collasso gravitazionale (giornaliero) | `s.boss && s.turno <= 2` | danno e Esposto per 3 turni |
| 2 | Lancia di realtà (per scontro) | `!s.ha("esposto")` | due dadi in più e Esposto |
| 3 | Colpo di forza (a volontà) | `!s.ha("esposto")` | prima l'Esposto |
| 4 | Punto di rottura (giornaliero) | `s.ha("esposto")` | l'Esposto non scade più |
| 5 | Schianto (per scontro) | `s.ha("esposto") && !s.grave("esposto")` | aggrava: Scoperto |
| 6 | Annullamento (giornaliero) | `s.grave("esposto")` | Scoperto: 2 dadi in più |
| 7 | Doppia frattura (per scontro) | `s.grave("esposto")` | Scoperto: due dadi in più |
| 8 | Sovraccarico (giornaliero) | `s.ha("esposto")` | danno senza tiro, aggrava |
| 9 | Gravità (a volontà) | `s.ha("esposto") && !s.ha("indebolito")` | Esposto: Indebolito più lungo, senza tiro |
| 10 | Spezzare la materia (per scontro) | `s.n.res && s.n.res.forza === "res"` | resiste alla forza |
| 11 | Campo di peso (a volontà) | `s.annuncio && s.ioVac` | colpo annunciato e poca salute |
| 12 | Colpo di forza (a volontà) | `sempre` | attacco base, tiene l'Esposto |

## Arcanista, Illusione

| # | Potere | Quando | Perché |
|---|---|---|---|
| 1 | Teatro di specchi (giornaliero) | `s.boss && s.turno <= 2` | Copie al massimo che esplodono |
| 2 | Il Grande Inganno (giornaliero) | `s.copie >= 3` | 3 Copie: scarica tutto |
| 3 | Frantumare (per scontro) | `s.copie >= 3 || (s.vac && s.copie >= 2)` | Copie pronte: le fa esplodere |
| 4 | Dado truccato (giornaliero) | `s.annuncio` | colpo annunciato: due d20, tiene il peggiore |
| 5 | Incubo (giornaliero) | `s.copie >= 2` | +1d6 per Copia senza consumarle |
| 6 | Sdoppiamento (per scontro) | `s.copie <= 1` | due Copie e +2 CA |
| 7 | Specchio rotto (per scontro) | `s.copie < 3` | una Copia che rimanda il colpo |
| 8 | Labirinto (per scontro) | `s.copie < 3` | Stordito (Indebolito sui boss) e una Copia |
| 9 | Sussurro illusorio (a volontà) | `s.copie < 3 && ["frantumare", "grande_inganno", "incubo"].some(s.disp)` | Indebolito e una Copia per la scarica |
| 10 | Riflessi (a volontà) | `s.annuncio && s.copie < 3` | colpo annunciato: se manca, nasce una Copia |
| 11 | Dardo fantasma (a volontà) | `sempre` | attacco base, +1d4 con le Copie |

## Monaco, Sangue

| # | Potere | Quando | Perché |
|---|---|---|---|
| 1 | Sangue in piena (giornaliero) | `s.boss && s.turno <= 2` | un dado in più per 3 turni, aggrava |
| 2 | Costellazione rossa (per scontro) | `s.boss` | sfere ogni turno |
| 3 | Dardo di sangue (a volontà) | `!s.ha("sanguinante")` | prima il Sanguinante |
| 4 | Ebollizione (per scontro) | `s.ha("sanguinante") && !s.grave("sanguinante")` | aggrava: Emorragia |
| 5 | Marea cremisi (giornaliero) | `s.grave("sanguinante")` | Emorragia: durata doppia |
| 6 | Cuore spezzato (giornaliero) | `s.grave("sanguinante") && s.turni("sanguinante") >= 2` | incassa il doppio dei turni |
| 7 | Meteora di sangue (per scontro) | `s.ha("sanguinante")` | sanguina: critico con 19-20 |
| 8 | Lancia di sangue (per scontro) | `sempre` | due dadi in più |
| 9 | Vincolo di sangue (giornaliero) | `s.boss && s.pvPct > 0.6` | il boss divide il danno che subisci |
| 10 | Frusta cremisi (a volontà) | `s.ha("sanguinante") && s.turni("sanguinante") <= 1` | il sanguinamento sta per scadere: lo allunga |
| 11 | Crosta (a volontà) | `s.annuncio && s.ioVac` | colpo annunciato e poca salute |
| 12 | Dardo di sangue (a volontà) | `sempre` | attacco base |

## Monaco, Ossa

| # | Potere | Quando | Perché |
|---|---|---|---|
| 1 | Armatura del sepolcro (giornaliero) | `s.boss && s.turno <= 2` | placche al massimo per 3 turni |
| 2 | Armatura spezzata (giornaliero) | `s.boss && s.placche >= 2` | ogni placca spezzata ferisce |
| 3 | Spirito d'ossa (per scontro) | `s.placche >= 3` | 3 placche: le scarica |
| 4 | Barricata di costole (per scontro) | `s.annuncio && s.placche < 3` | colpo annunciato: placche al massimo e −2 |
| 5 | Prigione d'ossa (giornaliero) | `!s.ha("esposto")` | Esposto per 3 turni |
| 6 | Decrepitezza (per scontro) | `!s.ha("indebolito")` | Indebolito ed Esposto, una placca |
| 7 | Armata dei morti (giornaliero) | `s.vac || s.turno >= 4` | danno grande senza consumare placche |
| 8 | Lama d'osso (per scontro) | `s.placche >= 1 && s.placche < 3` | due dadi in più, la placca torna |
| 9 | Armatura d'ossa (a volontà) | `s.placche < 3` | una placca e +2 CA |
| 10 | Spine d'ossa (a volontà) | `s.placche < 3` | una placca e Indebolito |
| 11 | Lancia d'ossa (a volontà) | `sempre` | attacco base |

Legenda delle condizioni: `s.boss` = contro un guardiano o il sovrano; `s.turno` = numero del turno; `s.ha("x")` / `s.grave("x")` = il nemico ha lo stato x / la sua forma grave; `s.turni("x")` = turni che restano allo stato; `s.haSa` = il nemico ha lo stato della tua arma; `s.vac` = nemico Vacillante; `s.ioVac` = tu Vacillante; `s.annuncio` = il nemico ha annunciato un colpo; `s.placche`, `s.copie`, `s.scudo` = le tue risorse; `s.pvPct` = la tua salute in proporzione; `s.puoSa` / `s.puo("x")` = lo stato si può applicare (il sovrano integro è immune al Sanguinante); `s.disp("id")` = quel potere è pronto.
