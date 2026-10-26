# Sciamano — Tecniche e vie di prestigio (v1, proposta)

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
- **Recupero in combattimento:** come il Guerriero, per ogni colpo subito a segno: +1 ai livelli 1-2, +2 ai livelli 3-4, +3 al livello 5, doppio sul critico.
- **Attacco:** d20 + mod Vigore contro CA, danno dell'arma + mod Vigore. Una tecnica che manca costa comunque.
- **Tiro salvezza del nemico:** d20 + suo mod Vigore contro CD = 8 + **mod Spirito** + livello.
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

## 4. Le 15 tecniche

| Liv | Tecnica | Tipo | Costo | Effetto |
|---|---|---|---|---|
| 1 | Punta di Mandragora | Rivestimento | 2 | Attacco normale; per 3 turni ogni colpo a segno dà Avvelenato 2 |
| 1 | Tappeto di Micelio | Spora | 2 | Attacco normale; se colpisce, Indebolito 2 (le muffe appiccicose impacciano i movimenti) |
| 1 | Infuso di Linfa Vitale | Cura | 3 | Consuma l'azione; recuperi 1d4 salute subito e all'inizio dei tuoi 2 turni successivi; rimuove da te Sanguinamento e Avvelenato. Fuori dal combattimento: 1d4 + livello |
| 2 | Muffa Necrotica | Rivestimento | 4 | Attacco normale; per 3 turni ogni colpo a segno dà Sbilanciato 2 |
| 2 | Baccello Esplosivo | Trappola | 4 | Il baccello scoppia al prossimo attacco del nemico: Accecato 2 |
| 2 | Pelle di Corteccia e Resina | Difesa | 5 | Attacco normale; fino al tuo prossimo turno il primo colpo che subisci fa metà danni (dà natura normalmente) e l'aggressore subisce 1d4 danni da acido |
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

## 6. Decisioni aperte

1. **CD dei tiri salvezza su Spirito** (proposta) o su Vigore come il Guerriero?
2. **Recupero di natura:** resta come il Guerriero (colpi subiti) o, più a tema, si guadagna quando il veleno fa danno (+1 per turno di Avvelenato)?
3. **Raccolta:** capacità di classe fuori combattimento (erbe del giardino, +1d4 natura una volta per riposo), come nella lista originale?
4. **Nemici immuni al veleno** (non morti, armature animate): da decidere quali, per non far crollare lo Sciamano contro di loro.
