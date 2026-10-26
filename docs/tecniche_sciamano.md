# Sciamano — Tecniche e vie di prestigio (v4, proposta con decisioni del 26/10/2026)

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
| 10 | Risorsa "combattendo o raccogliendo" non definita | Punti natura | Recupero sui danni della natura (sotto) e Borsa dei veleni |

## 2. Regole della classe

- **Punti natura:** 10 + mod Spirito; a ogni livello + mod Spirito + nuovo livello. Riposo: 1d4 + livello.
- **Recupero in combattimento (DECISO): sulla forza della natura.** La natura torna quando la natura colpisce, non l'arma. Stessa tabella del Guerriero: +1 ai livelli 1-2, +2 ai livelli 3-4, +3 al livello 5.
  - **Cosa conta:**
    - danni da veleno (Avvelenato) e da Tossina;
    - danni da acido (Pelle di Corteccia);
    - danni del bulbo della Fioritura, compresa l'esplosione;
    - radici e trappole: un tiro salvezza fallito dal nemico contro una tua tecnica, oppure una trappola che scatta (Baccello Esplosivo).
  - **Al massimo un recupero per turno del nemico**, anche se nello stesso turno ci sono più eventi (veleno + acido, per esempio): così la natura non si ricarica da sola.
  - **Doppio se nel turno c'è Tossina**: il premio per chi investe nel veleno.
  - **Non contano** i danni dell'arma, nemmeno sul critico, né gli attacchi in più di Linfa Furiosa.
  - **Contro gli immuni** (Dafne, il sovrano) il veleno non dà nulla, ma acido, bulbo, radici e trappole sì: lo Sciamano passa al controllo e si ricarica più lentamente. La Borsa dei veleni copre il resto.
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

Dalla tua lista delle classi di prestigio. **Aldo = Signore delle Spore Putride** (offesa, veleno che logora), **Guendalina = Custode dei Boschi Sacri** (difesa, cura, purificazione). Come nel Guerriero: una abilità ai livelli 3, 4 e 5, sempre pronte, senza posti; scelta definitiva. **Novità rispetto al Guerriero:** ogni via ha anche una **passiva**, attiva dal momento della scelta.

### Problemi corretti nella lista originale

| # | Problema | Dove | Soluzione |
|---|---|---|---|
| 1 | Alleati, party, compagni, totem ad area, onda «globale» | Custode, Marea | Il gioco è uno contro uno, senza compagni: effetti solo su di te o sul nemico |
| 2 | Percentuali (50% del danno, 40% della salute, −30% armatura) | Balsamo, Resurrezione, Marea | Dadi, metà dei danni, Sbilanciato |
| 3 | Confusione («colpisce un bersaglio casuale»), Immobilizzato («salta il movimento») | Morbo, Cisti | Non c'è movimento né altri bersagli: Frastornato e Sbilanciato |
| 4 | Costi 3-9, sotto le tecniche normali dello stesso livello | Tutte | Fasce delle vie: 5-6, 8, 10 |
| 5 | Attacchi che non fanno danno (Balsamo) | Custode 1 | In uno scontro uno contro uno blocca la partita: metà al nemico, metà allo scudo |
| 6 | «+1 natura per turno di veleno» (Cisti) | Spore Putride 2 | Doppione della regola di recupero: diventa Tossina, che lo raddoppia già |
| 7 | Azione minore, raccogliere spore | Introduzione | Non esistono: un'azione per turno, niente raccolta (c'è la Borsa dei veleni) |
| 8 | «Resurrezione» senza resuscitare nessuno | Custode 3 | Rinominata Rinascita del Sottobosco |

### Nuovo: Scudo di Corteccia

Salute temporanea: assorbe i danni prima della salute fisica. **Massimo 5 + livello**, non si somma oltre; sparisce a fine scontro. I danni assorbiti dallo scudo non danno natura e non contano come colpo a segno per i tuoi effetti.

### Signore delle Spore Putride (Aldo)

| Liv | Abilità | Costo | Effetto |
|---|---|---|---|
| Passiva | Fame del Parassita | — | Se il nemico muore mentre è Avvelenato o colpito da una tua trappola, recuperi 3 punti natura (restano per lo scontro successivo) |
| 3 | Spore del Morbo | 6 | Rivestimento per 3 turni: ogni colpo a segno dà 1 carica di Morbo. Alla terza carica il nemico è Frastornato 1 e le cariche si azzerano (boss: Indebolito 2). Nessun tiro salvezza: servono 3 colpi |
| 4 | Cisti Parassita | 8 | Trappola: al prossimo attacco del nemico, Sbilanciato 2 + **Tossina 3** (vale doppio per il recupero di natura) |
| 5 | Marea di Putrefazione | 10 | Consuma l'azione. Per 3 turni 1d6 danni da acido all'inizio del turno del nemico; **Sbilanciato per tutto lo scontro** (boss: 2 turni). L'acido funziona anche su Dafne e il sovrano |

### Custode dei Boschi Sacri (Guendalina)

| Liv | Abilità | Costo | Effetto |
|---|---|---|---|
| Passiva | Linfa Rigeneratrice | — | Le tue cure e lo Scudo di Corteccia durano 1 turno in più (Infuso di Linfa Vitale, Fioritura, Aura, Rinascita) |
| 3 | Balsamo della Linfa Primordiale | 6 | Rivestimento per 3 turni: i tuoi colpi a segno fanno metà danni al nemico; l'altra metà diventa Scudo di Corteccia |
| 4 | Aura di Purificazione | 8 | Consuma l'azione. Per 3 turni recuperi 1d4 salute all'inizio di ogni tuo turno e sei immune a Avvelenato, Sanguinamento, Indebolito, Sbilanciato e Accecato; gli stati che hai già spariscono |
| 5 | Rinascita del Sottobosco | 10 | Una volta per riposo. Non consuma l'azione: puoi anche attaccare. Rimuove tutti i tuoi stati, recuperi 2d6 + livello salute e per 2 turni recuperi 1d4 salute e 1 punto natura all'inizio di ogni tuo turno |

Note:
- Con la passiva, l'Aura dura 4 turni e la Rinascita 3: è voluto, la via premia chi resta in piedi a lungo.
- La Rinascita è l'unica abilità che non consuma l'azione: è l'«azione immediata» della tua lista, tenuta solo qui perché è una volta per riposo.
- I natura della Rinascita (1 a turno) sono a parte dal recupero normale: non contano nel «massimo uno per turno».

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

1. **Dafne:** confermi i tre spunti, o vuoi che il suo tema sia diverso dal veleno (per esempio arco e trappole)?
2. **Passive delle vie:** il Guerriero non le ha. Le teniamo solo per lo Sciamano o le aggiungiamo poi anche alle altre classi?
3. **Scudo di Corteccia:** è salute temporanea, una meccanica nuova nel codice. Massimo 5 + livello ti sembra giusto?
