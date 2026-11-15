# Pulizia settimanale — 2026-11-01

Primo report: dalla prossima settimana compaiono le differenze.

| Voce | Valore |
|---|---|
| File orfani | 10 (17.4 MB) |
| Media pesanti | 14 (74.5 MB) |
| Doppioni png accanto a webp | 4 |
| Codice duplicato | 9 blocchi, 0.4% |
| Funzioni mai chiamate | 3 |
| Funzioni oltre 150 righe | 4 |
| Residui (console.log / debugger / codice commentato) | 0 / 0 / 0 |
| Lavori aperti (PROVVISORIO / TODO) | 66 |
| Righe del gioco (gioco.html) | 19062 (12109) |
| Pacchetti npm da aggiornare / vulnerabilità alte | 4 / 5 |

## 1. File che nessuna pagina usa
Da controllare a mano: se non servono vanno in `archivio/` (o cancellati). Se un file è usato con un nome costruito al volo, aggiungi la cartella a `DINAMICI`.

- `audio/anteprima_fuoco.mp3` — 490 KB
- `audio/outro.mp3` — 3.9 MB
- `immagini/house/sala_conversazione_fredda.webp` — 787 KB
- `immagini/house/sala_da_pranzo.png` — 7.2 MB
- `immagini/nemici/Mastino_catene.webp` — 1.1 MB
- `immagini/nemici/Mastino_due_teste.webp` — 1.1 MB
- `immagini/nemici/Mastino_portale.webp` — 926 KB
- `immagini/nemici/Mastino_sala.webp` — 1.1 MB
- `immagini/png/maggiordomo.webp` — 368 KB
- `immagini/png/regina.webp` — 403 KB

## 2. Peso
Soglie: immagini 1.0 MB, audio 4.0 MB. Sul Pixel ogni MB è attesa al cambio stanza.

- `immagini/house/dispensa.png` — 9.8 MB
- `immagini/house/sala_trofei.png` — 8.1 MB
- `immagini/house/armeria.png` — 8.0 MB
- `immagini/house/cappella.png` — 7.5 MB
- `immagini/house/sala_da_pranzo.png` — 7.2 MB
- `immagini/nemici/mastino_cantina.png` — 7.2 MB
- `audio/sala_addestramento.mp3` — 7.1 MB
- `audio/intro.mp3` — 5.5 MB
- `audio/Foresta.mp3` — 5.2 MB
- `audio/combat2.mp3` — 4.4 MB
- `immagini/house/giardino.webp` — 1.2 MB
- `immagini/nemici/Mastino_catene.webp` — 1.1 MB
- `immagini/nemici/Mastino_sala.webp` — 1.1 MB
- `immagini/nemici/Mastino_due_teste.webp` — 1.1 MB

Png con una versione webp accanto (il png è quasi sempre l'originale dimenticato):
- `immagini/house/cappella.png` (7.5 MB) ↔ `immagini/house/cappella.webp`
- `immagini/house/dispensa.png` (9.8 MB) ↔ `immagini/house/dispensa.webp`
- `immagini/house/sala_trofei.png` (8.1 MB) ↔ `immagini/house/sala_trofei.webp`
- `immagini/nemici/mastino_cantina.png` (7.2 MB) ↔ `immagini/house/mastino_cantina.webp`

## 3. Codice duplicato
Blocchi identici in più punti: se ne correggi uno, l'altro resta sbagliato.

- 7 righe × 2: gioco.html:138, tutorial.html:51 — `.scheda details.sez { margin-top: 1rem; }`
- 7 righe × 2: gioco.html:7398, gioco.html:8701 — `if (incantesimo) {`
- 6 righe × 2: gioco.html:17, index.html:14 — `<script src="js/volume.js"></script>`
- 6 righe × 2: gioco.html:291, tutorial.html:93 — `details.voce.giocatore > summary::-webkit-details-marker { display: no`
- 6 righe × 2: gioco.html:298, tutorial.html:102 — `details.voce.giocatore.t-ok { background: var(--ok-bg); border-color: `
- 6 righe × 2: gioco.html:304, tutorial.html:109 — `.voce.prova { padding: 1rem 1.25rem; border: 1px solid var(--accent); `
- 6 righe × 2: gioco.html:1073, tutorial.html:655 — `fitte: [`
- 6 righe × 2: gioco.html:1515, tutorial.html:752 — `fitte: [`
- 6 righe × 2: gioco.html:6656, gioco.html:6721 — `else {`

## 4. Funzioni dichiarate e mai chiamate
Candidate, non certezze: una funzione chiamata solo da console o costruendone il nome al volo compare qui. Quelle da tenere vanno in `IGNORA_FUNZIONI`.

- `statoDaColpo` — gioco.html:5734
- `tickUstione` — gioco.html:5735
- `riempiBorse` — gioco.html:9226

## 5. Funzioni oltre 150 righe

- `lancia` — js/magia_combattimento.js:54, 298 righe
- `usa` — js/combattimento.js:165, 281 righe
- `interpretaAltrove` — gioco.html:5828, 192 righe
- `gestisci` — gioco.html:9984, 159 righe

## 6. Residui e lavori aperti
I PROVVISORIO non sono sporcizia: sono la lista delle cose da rifinire. Conta solo che il numero scenda nel tempo.

TODO / PROVVISORIO:
- creazione.html:413: /* PROVVISORIO: danno di mazza chiodata e piccone da battaglia scelto da me */
- gioco.html:705: fallimento: ["Scosti il pesante drappo e ne tasti la piega inferiore, ma non riesci a capi
- gioco.html:717: /* PROVVISORIO: guardare le scale dal basso (diverso da salirle) */
- gioco.html:719: /* PROVVISORIO: guardare la sala da pranzo dalla soglia (diverso da entrarci) */
- gioco.html:725: /* PROVVISORIO: testi di esito scritti da me */
- gioco.html:732: pranzo_niente: { fisso: ["Osservi con attenzione, ma non noti nulla che la sala non ti abb
- gioco.html:733: pranzo_porta: { fisso: ["Poco oltre l'angolo a sinistra del camino si apre una porta di le
- gioco.html:745: corr_scala: { fisso: ["In fondo al corridoio, la scala a chiocciola si avvolge su sé stess
- gioco.html:746: corr_niente: { fisso: ["Osservi con attenzione, ma il corridoio non ha nulla di utile da o
- gioco.html:766: /* PROVVISORIO: al posto della fitta generica, una di queste due a caso */
- gioco.html:791: /* PROVVISORIO: dettagli dell'accampamento fuori dal dungeon */
- gioco.html:796: portone: { fisso: ["Alle tue spalle, dove prima si apriva l'ingresso della grotta, si erge
- gioco.html:810: /* PROVVISORIO: la torcia improvvisata dell'accampamento, un solo utilizzo */
- gioco.html:828: /* PROVVISORIO: passaggio dal buio all'atrio, prima della descrizione dell'atrio */
- gioco.html:840: gabbia: [ /* PROVVISORIO */
- …e altri 51

## 7. Dimensioni dei file

- `gioco.html` — 12109 righe, 1.2 MB
- `tutorial.html` — 1349 righe, 100 KB
- `creazione.html` — 915 righe, 70 KB
- `regolamento.html` — 694 righe, 78 KB
- `index.html` — 593 righe, 33 KB
- `js/combattimento.js` — 558 righe, 36 KB
- …e altri 13

## 8. Dipendenze
Vulnerabilità: moderate 20, high 5, total 25

- eslint 9.39.5 → 10.14.0 ⚠️ versione maggiore: leggere le novità prima di aggiornare
- espree 10.4.0 → 11.2.0 ⚠️ versione maggiore: leggere le novità prima di aggiornare
- firebase 12.19.0 → 13.1.0 ⚠️ versione maggiore: leggere le novità prima di aggiornare
- playwright 1.63.0 → 1.64.1

---
*Report automatico di `strumenti/pulizia_settimanale.mjs`. Non corregge niente: si sceglie cosa sistemare, una voce alla volta.*