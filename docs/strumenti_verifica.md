# Strumenti di verifica

Versione completa con descrizioni ed esiti: `docs/Strumenti_di_verifica.pdf`. Il gioco resta statico: questi strumenti servono solo a controllarlo.

## Installazione (una volta)

```
npm install
npx playwright install chromium
```

## Comandi, in ordine di importanza

| # | Strumento | Comando |
|---|---|---|
| 1 | Playwright, test nel browser (fumo, bilanciamento, Sciamano, combattimento) | `python3 -m http.server 8765 --bind 127.0.0.1` poi `npm run test:browser` |
| 2 | Test delle regole (Node) | `npm run test:regole` |
| 3 | Regole Firestore sull'emulatore (serve Java) | `npm run test:firestore` |
| 4 | GitHub Actions: tutto a ogni push | scheda «Actions» del repo |
| 5 | ESLint pagina per pagina | `npm run lint` (`node strumenti/lint_pagine.mjs --tutto` per gli avvisi) |
| 6 | Coerenza documenti ↔ codice e file mancanti | `npm run coerenza` |
| 7 | axe-core (accessibilità) | dentro `node tests/fumo.browser.js` |
| 8 | html-validate | dentro `npm run lint` |
| 9 | Pagina di test (consigliata) / sala di prova storica | `test.html` · `tutorial.html?prova` (la usano i test Playwright) |
| 10 | Audit periodici | `/ponytail-audit`, `/impeccable critique` (Claude Code) |
| 11 | Sito pubblicato e telefono vero | Claude in Chrome / Chrome DevTools MCP |

Controllo rapido dopo ogni modifica: `npm test` (regole + lint + coerenza).

## Pagina di test (01/11/2026)

`test.html`: stesso motore della sala di prova (`js/sala_prova.js`), layout più leggibile.
- **Metà alta:** Personaggio a sinistra (blu), Nemico a destra (rosso), con gli stessi dettagli: classe/tipo, livello, statistiche (Vigore, Agilità, Mente, Spirito), arma, scudo sì/no, CA, salute; in cima a ciascuno lo stato in scontro con le barre.
- **Metà bassa:** turno, azioni, tecniche/incantesimi a sinistra; diario a colori a destra (blu tu, rosso nemico, verde esito buono, rosso chiaro esito cattivo, grigio sistema); dadi truccati e test automatici a scomparsa.
- **Preset fissi** in `js/preset_test.js`: base di classe (minimo 10, 8 punti, prima sulla caratteristica di classe) + bonus di razza da `Regole.RAZZE` (Elfo +2 Agi +1 Men, Nano +2 Vig +1 Spi, Gnomo +2 Spi +1 Agi; Umano 3 punti liberi spesi secondo la classe). Massimo 20; gli attributi non crescono col livello; salute e CA calcolate dalle regole.

| Classe | Base (Vig/Agi/Men/Spi) | Umano | Elfo | Nano | Gnomo | Arma | Scudo | Armatura |
|---|---|---|---|---|---|---|---|---|
| Guerriero | 15/12/10/11 | 16/13/10/12 | 15/14/11/11 | 17/12/10/12 | 15/13/10/13 | Spada corta | sì | pesante |
| Sciamano | 11/15/10/12 | 12/16/10/13 | 11/17/11/12 | 13/15/10/13 | 11/16/10/14 | Mazza chiodata | no | media |
| Arcanista | 10/13/15/10 | 10/14/17/10 | 10/15/16/10 | 12/13/15/11 | 10/14/15/12 | Bastone | no | leggera |
| Monaco | 11/11/10/16 | 12/12/10/17 | 11/13/11/16 | 13/11/10/17 | 11/12/10/18 | Spada corta | sì | media |

| Nemico | Liv | Vig | Agi | Men | Spi | CA | Salute |
|---|---|---|---|---|---|---|---|
| Mastino (piano terra) | 1 | 12 | 12 | 6 | 10 | 10 | 13 |
| Ettore | 2 | 12 | 13 | 12 | 8 | 13 | 30 |
| Enea | 3 | 12 | 10 | 12 | 14 | 13 | 36 |
| Manichino | 1 | 10 | 10 | 10 | 10 | 12 | 60 |

Cambiare classe o razza rimette il preset; livello e Vigore ricalcolano la salute; armatura, Agilità e scudo ricalcolano la CA; «Ripristina preset» torna ai valori di default. Mente e Spirito del nemico sono solo di scheda (il motore non li usa ancora).

## File nuovi (29/10/2026)

- `package.json`, `.gitignore`, `.htmlvalidate.json`
- `strumenti/lint_pagine.mjs`, `strumenti/coerenza_docs.mjs`
- `tests/fumo.browser.js`, `tests/firestore.rules.test.mjs`
- `firestore.rules` (versione PROPOSTA, non pubblicata), `firebase.json`
- `.github/workflows/verifiche.yml`

## Esito del 29/10/2026

- Regole 236/236, browser 105/105 combattimento + 18/18 bilanciamento + 20/20 Sciamano; fumo 0 problemi e 0 avvisi; lint 0 errori; coerenza tutto allineato.
- Corretti lo stesso giorno: (1) creata `immagini/Trono_di_Cenere.webp` dal primo fotogramma del video (poster della pagina iniziale); (2) tolta la chiave `zainoVuoto` duplicata nei testi del tutorial; (3) cancellata `PE_NEMICI` (non usata, valori vecchi); (4) bersagli di tocco sul telefono (bandiere 44 px, link del regolamento, scelta facile/difficile, tendine del diario e del tutorial); (5) diario del tutorial raggiungibile da tastiera, separatori delle barre vitali decorativi (elenco `#vitali` valido); (6) coniglio: falso allarme, è fuori dal gioco (zone vuote); il controllo di coerenza ora ignora gli animali che non compaiono mai.
- Non verificato qui: regole Firestore sull'emulatore (download bloccato in questo ambiente), sincronizzazione reale PC ↔ Pixel.

## Serie automatica di scontri (02/11/2026)

`strumenti/serie_scontri.js`: fa giocare in automatico molti scontri nella pagina di test (`test.html`, stesso motore della sala di prova) e stampa una riga per classe e caso (vittorie, salute residua, turni). Avvio: `python3 -m http.server 8765 --bind 127.0.0.1`, poi `N=150 node strumenti/serie_scontri.js` (`SOLO_ENEA=1` per il solo Enea col fermaglio, `CLASSI=guerriero,monaco` per scegliere le classi). Il giocatore automatico usa a caso tecniche e incantesimi, si cura sotto il 40% e contro le cariche di Enea osserva e interrompe: è pessimista, serve a confrontare versioni e classi. Con 150 scontri per caso l'errore è di circa ±5 punti; per decidere tra due versioni vicine usare 400.
