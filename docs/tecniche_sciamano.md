# Sciamano — Tecniche e vie di prestigio (v2, proposta con decisioni del 26/10/2026)

Adattamento della lista originale (13 poteri in tempo reale) alle regole del gioco. Stessa struttura del Guerriero: d20 contro CA, durate in turni del nemico, 3 tecniche per livello (se ne scelgono 2 ai livelli 1-2, 1 ai livelli 3-5; posti 2, 4, 5, 6, 7), vie di prestigio dal livello 3, immunità e tetti dei boss.

---

## 1. Problemi corretti nella lista originale

| # | Problema | Dove | Soluzione |
|---|---|---|---|
| 1 | Durate in secondi | Tutte | Turni del nemico (1-3) |
| 2 | Velocità di movimento, velocità d'attacco, precisione | Micelio, Fumo, Linfa Furiosa, Baccello | Diventano Indebolito, Accecato, attacco in più |
| 3 | Percentuali di armatura (−10%, cumulabile) | Muffa Necrotica | I nemici hanno solo la CA: Sbilanciato |
| 4 | Effetti ad area ("tutti i nemici vicini", ondate) | Miasma, Botola, Fioritura | Gli scontri sono uno contro uno: effetto sul solo bersaglio |
| 5 | Stordimento dopo 4 colpi consecutivi | Spore Paralizzanti | Tiro salvezza al colpo, una volta per rivestimento |
| 6 | Annulla del tutto un colpo al livello 2 + contrattacco | Pelle di Corteccia | Metà danni + 1d4 di acido |
| 7 | Costi da 2 a 10 senza regola del livello | Tutte | Fasce del Guerriero: 2-3, 4-5, 5-6, 7-8, 9-10 |
| 8 | Solo 1 potere al livello 5, nessuna scelta | Livello 5 | 3 opzioni come gli altri livelli (2 nuove) |
| 9 | Botola e Miasma doppioni di Baccello e Muffa | Livello 4 | Effetti distinti (Frastornato; veleno + corrosione insieme) |
| 10 | Risorsa "combattendo o raccogliendo" non definita | Punti natura | Regole già nel codice (sotto) |

## 2. Regole della classe

- **Punti natura:** 10 + mod Spirito; a ogni livello + mod Spirito + nuovo livello. Riposo: 1d4 + livello.
- **Recupero in combattimento (DECISO): sui danni inflitti.** Per ogni tuo colpo a segno: +1 ai livelli 1-2, +2 ai livelli 3-4, +3 al livello 5, doppio sul critico. Stessa tabella del Guerriero, ma su ciò che dai invece che su ciò che subisci.
  - Contano gli attacchi della tecnica e quelli normali, compresi gli attacchi in più di Linfa Furiosa.
  - **Non contano** i danni a ogni turno (veleno, Tossina, bulbo della Fioritura) né l'acido della Pelle di Corteccia: altrimenti la natura si ricarica da sola.
  - Un attacco mancato non dà nulla.
- **Attacco:** d20 + mod Vigore contro CA, danno dell'arma + mod Vigore. Una tecnica che manca costa comunque.
- **Tiro salvezza del nemico (DECISO): sempre sul corpo.** I veleni agiscono sul corpo: d20 + mod Vigore del nemico (il vecchio Corpo è confluito in Vigore) contro CD = 8 + mod Vigore + livello, come il Guerriero.
- **Armi:** tutte tranne quelle «da battaglia». Le tecniche non dipendono dal tipo d'arma (niente rami): il veleno funziona su lama, mazza o bastone.
- **Capacità di classe:** Mente incrollabile (esistente).

### Tre famiglie di tecniche

- **Rivestimento:** la tecnica è un attacco normale che riveste l'arma. Per i turni indicati, i tuoi attacchi a segno applicano l'effetto. **Un solo rivestimento attivo:** uno nuovo sostituisce il vecchio.
- **Trappola:** consuma l'azione. Scatta al prossimo attacco del nemico, **prima** del suo tiro (l'effetto vale già su quell'attacco). Una sola trappola alla volta; come le tecniche che consumano l'azione, non si usa due turni di fila.
- **Spora / radice:** effetto diretto, spesso con tiro salvezza.

## 3. Stato nuovo

| Stato | Effetto | Boss |
|---|---|---|
| **Avvelenato** | 1d4 danni da veleno all'inizio del turno del nemico (**Tossina:** 1d6). Si somma a Sanguinamento e Avvizzito; un nuovo Avvelenato rinnova, non si somma | Sì, massimo 2 turni |

Gli altri effetti usano stati che esistono già: Indebolito, Sbilanciato, Accecato, Frastornato, Stordito, Senza attacchi speciali.

### Immuni al veleno (DECISO)

| Nemico | Motivo |
|---|---|
| **Dafne** | Abituata a vivere nei boschi: conosce ogni erba e ogni tossina |
| **Il sovrano** | È praticamente un non morto: il veleno non trova sangue vivo |

Contro di loro Avvelenato e Tossina non si applicano e i danni da veleno sono 0. Il resto delle tecniche funziona: i rivestimenti danno ancora gli altri effetti (Sbilanciato, Indebolito, Stordito), trappole e radici non sono veleno. Nella scheda del nemico compare «immune al veleno» quando il giocatore lo scopre (come le altre debolezze e resistenze).

Nel codice basta un campo `immune: ["veleno"]` in `NEMICI`, controllato quando si applica Avvelenato.

## 4. Le 15 tecniche

| Liv | Tecnica | Tipo | Costo | Effetto |
|---|---|---|---|---|
| 1 | Punta di Mandragora | Rivestimento | 2 | Attacco normale; per 3 turni ogni colpo a segno dà Avvelenato 2 |
| 1 | Tappeto di Micelio | Spora | 2 | Attacco normale; se colpisce, Indebolito 2 (le muffe appiccicose impacciano i movimenti) |
| 1 | Infuso di Linfa Vitale | Cura | 3 | Consuma l'azione; recuperi 1d4 salute subito e all'inizio dei tuoi 2 turni successivi; rimuove da te Sanguinamento e Avvelenato. Fuori dal combattimento: 1d4 + livello |
| 2 | Muffa Necrotica | Rivestimento | 4 | Attacco normale; per 3 turni ogni colpo a segno dà Sbilanciato 2 |
| 2 | Baccello Esplosivo | Trappola | 4 | Il baccello scoppia al prossimo attacco del nemico: Accecato 2 |
| 2 | Pelle di Corteccia e Resina | Difesa | 5 | Attacco normale; fino al tuo prossimo turno il primo colpo che subisci fa metà danni e l'aggressore subisce 1d4 danni da acido |
| 3 | Spore Paralizzanti | Rivestimento | 6 | Attacco normale; per 3 turni ogni colpo a segno dà Indebolito 1; al primo colpo a segno il nemico fa un tiro salvezza → Stordito 1 (boss: Indebolito 2) |
| 3 | Radici Strangolatrici | Radice | 5 | Tiro salvezza → Sbilanciato 2 + Senza attacchi speciali 2; se resiste, Sbilanciato 1 (boss: Sbilanciato 2) |
| 3 | Fumo della Palude | Spora | 6 | Consuma l'azione; il nemico è Accecato 2 e tu hai +2 CA per 2 turni |
| 4 | Miasma Corrosivo | Rivestimento | 8 | Attacco con +1 dado; per 3 turni ogni colpo a segno dà Avvelenato 2 e Sbilanciato 2 |
| 4 | Botola di Spore | Trappola | 7 | Al prossimo attacco del nemico: tiro salvezza → Frastornato 2; se resiste (o è un boss), Accecato 2 |
| 4 | Linfa Furiosa | Potenziamento | 8 | Attacco normale; per 3 turni fai un attacco in più a ogni turno (solo il dado dell'arma). Alla fine subisci 1d6 danni |
| 5 | Fioritura del Parassita Colossale | Spora | 10 | Una volta per riposo. Consuma l'azione. Il bulbo vive 3 turni: all'inizio di ogni turno del nemico gli fa 1d6 veleno e rinnova Avvelenato e Sbilanciato; tu recuperi 1d4 salute a ogni tuo turno. Al terzo turno esplode: 2d6 + mod Spirito, tiro salvezza → Stordito 1 (boss: Indebolito 2) |
| 5 | Cuore di Tossina *(nuova)* | Spora | 9 | Attacco con +1 dado; se il nemico è Avvelenato, il veleno diventa Tossina per 3 turni + Indebolito 3; altrimenti Avvelenato 2 |
| 5 | Abbraccio della Foresta *(nuova)* | Radice | 10 | Attacco con +1 dado; tiro salvezza → Senza attacchi speciali 3 + Sbilanciato 3 (boss: Sbilanciato + Indebolito 2); per 3 turni +2 CA |

Note:
- Linfa Furiosa: i 1d6 finali non si riducono e non danno natura.
- Fioritura: stessa struttura dei livello 5 «una volta per riposo» del Guerriero; il bulbo non si somma a un secondo bulbo.
- Rivestimenti e Linfa Furiosa si combinano: gli attacchi in più applicano il rivestimento.

## 5. Vie di prestigio (dal livello 3)

Stesso schema del Guerriero: **Aldo = Putrefazione** (il veleno come condanna), **Guendalina = Germoglio** (resistere, curarsi, logorare).

| Via | Liv | Abilità | Costo | Effetto |
|---|---|---|---|---|
| Aldo | 3 | Marchio della Spora | 6 | Avvelenato 3; finché è Avvelenato, +1d4 agli attacchi normali |
| Aldo | 4 | Fioritura Interna | 8 | Se Avvelenato: il veleno fa subito tutti i danni rimasti e finisce; altrimenti Avvelenato 2 |
| Aldo | 5 | Necrosi | 10 | Se Avvelenato e colpisci: sempre critico + Tossina per tutto lo scontro (boss: 2 turni) |
| Guendalina | 3 | Germoglio di Guardia | 5 | Attacco normale; +2 CA fino al tuo turno e recuperi 1d4 salute |
| Guendalina | 4 | Linfa Lenta | 8 | +1 dado; Indebolito 3 (tiro salvezza → Frastornato 1); prossima tecnica −2 natura |
| Guendalina | 5 | Santuario di Muschio | 10 | +1 dado; Indebolito + Sbilanciato 3; per 3 turni +2 CA e recuperi 1d4 salute all'inizio di ogni tuo turno |

## 6. Borsa dei veleni (DECISO: oggetto, niente raccolta)

Al posto della raccolta di erbe (niente farming), un oggetto di dotazione.

| Oggetto | Dove | Effetto |
|---|---|---|
| **Borsa dei veleni** | Dotazione in creazione, **solo Sciamano** (occupa uno dei 3 posti) | 3 dosi. Una dose: recuperi 1d4 + livello punti natura. Una a turno, come le razioni. **Le dosi tornano piene a ogni riposo** |

- Si usa da zaino («Usa») o scrivendo «uso la borsa dei veleni», come gli altri oggetti.
- Non sostituisce la pozione di essenza: quella resta per tutte le classi e non si ricarica.
- Possibile ricompensa futura nella sala da caccia: una **Borsa dei veleni grande** (4 dosi) dopo una caccia difficile.

## 7. Dafne: spunti per i suoi poteri

L'immunità diventa il suo tema: Dafne usa le tossine del bosco contro chi la sfida, e lo Sciamano si trova davanti qualcuno che conosce il suo mestiere meglio di lui.

| Potere | Effetto |
|---|---|
| **Sangue di Bosco** (passivo) | Immune al veleno. Quando un rivestimento la colpisce, se lo «ruba»: il suo prossimo attacco applica a te lo stesso veleno |
| **Freccia di Cicuta** | Attacco; se colpisce, sei Avvelenato 2 (tiro salvezza sul corpo per resistere) |
| **Velo di Muschio** | Una volta per scontro: si cura 2d4 e toglie da sé tutti gli stati per 1 turno |

Servono due cose nel codice: lo stato **Avvelenato anche sul personaggio** (l'Infuso di Linfa Vitale lo rimuove già, così diventa la contromossa naturale) e il campo `immune` sui nemici.

## 8. Decisioni aperte

1. **Recupero sui colpi a segno:** con Linfa Furiosa (2 attacchi a turno) lo Sciamano può ricaricarsi in fretta. Se in prova risulta troppo, gli attacchi in più danno solo +1.
2. **Dafne:** confermi i tre spunti, o vuoi che il suo tema sia diverso dal veleno (per esempio arco e trappole)?
