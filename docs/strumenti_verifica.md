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
| 9 | Sala di prova | `tutorial.html?prova` |
| 10 | Audit periodici | `/ponytail-audit`, `/impeccable critique` (Claude Code) |
| 11 | Sito pubblicato e telefono vero | Claude in Chrome / Chrome DevTools MCP |

Controllo rapido dopo ogni modifica: `npm test` (regole + lint + coerenza).

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
