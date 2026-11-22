# Decisioni e lavori del 21 novembre 2026

Registro più recente. Sabato: sessione di codice «leggero» scelta da Francesco (consumo basso; il limite settimanale si resetta domenica alle 10). Tutto sul PC, **non su GitHub** (rilascio con l'ok di Francesco).

## 1. Fatto nel codice (sul PC)
- **Focus a due forme in `js/oggetti.js`**: nuova tabella `FOCUS` (Focus comune +0, **Focus rinforzato** +1, **Sfera armillare** +2 con il potere *Segno sulla mappa*), `FORME_FOCUS` (normale d8 / scudo d6 con +1 CA) e `focus(id, forma)` che restituisce il focus pronto per il combattente `{ id, nome, forma, dado, bonus, ca, potere? }`. Il bonus N è uguale nelle due forme.
- **`bastone_da_cartografo` tolto dalle armi** (era ancora un'arma a due mani): la Sfera armillare è un focus a una mano.
- **`js/scontro.js`**: nuova `potereArma(b)`, esportata. Il potere dell'arma in mano o, se manca, quello del focus (se il focus è attivo). `disponibileArma` la usa, quindi *Segno sulla mappa* funziona dal focus; resta «si dichiara con un potere di classe, mai da solo».
- **Rinomi nel codice** (ids e nomi, in `oggetti.js`, `scontro.js`, `poteri.js`, `tests/oggetti.test.js`): `elmo_del_penitente` → `elmo_della_sentinella`, `mantello_del_penitente` → `mantello_del_fuggiasco`, `calzari_del_pellegrino` → `calzari_del_viandante`. In `gioco.html` non c'erano riferimenti.
- **Sala di prova (`prova.html`)**: la mano secondaria «focus» ora sceglie l'oggetto (comune, Focus rinforzato, Sfera armillare) e la forma (normale / scudo); la forma scudo conta come scudo (+1 CA, *In guardia*, come in creazione); descrizione del focus con il suo potere; **Bastone tolto** dalle armi (cancellato il 17/11); con la Sfera compare la casella «Segno sulla mappa con il prossimo potere».
- **Test**: nuovo caso «Focus a due forme» in `tests/oggetti.test.js`; il caso di *Segno sulla mappa* usa la Sfera armillare come focus. Tutte le 12 serie del motore verificate passano (poteri 38, scontro 35, sciamano 29, arcanista 30, monaco 31, vie 7, regole 10, guardiani 16, oggetti 15, set e elisir 6, nemici 18, registro 6). Prova nel browser: sala di prova caricata senza errori, forma scudo e casella Segno verificate. **Non eseguiti**: `npm run test:browser`, lint e `npm run coerenza` (fatti il 22/11).
- **Registro dei cancellati**: le righe di Elmo della Sentinella, Mantello del Fuggiasco, Calzari del Viandante, Sfera armillare e focus a due forme dicono ancora «codice da fare»: per quelle voci vale questo documento (codice fatto il 21/11).

## 2. Aperto (chiuso il 22/11)
- **Verga di cenere**: convertita in focus a due forme il 22/11 (`decisioni_22_novembre.md`, sez. 2).
- Il focus del set di carne «mano libera» in `prova.html` resta d8 senza bonus (come prima).

## 3. Resta per domenica 22/11
Dalla lista del 20/11 (sez. 6) sono fatti `prova.html` e `oggetti.js` (focus, rinomi). Restano: +2 della dotazione nelle prove dei luoghi, vuoti al posto di goblin, orchi e avventurieri in `gioco.html`, inventario, set di classe, modifiche del 16/11, vecchio motore, `tutorial.html` e `test.html`, traduzione dei poteri, passi di Francesco per il log delle partite. (Esito: `decisioni_22_novembre.md`.)
