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

- Regole 236/236, browser 105/105 combattimento + 18/18 bilanciamento + 20/20 Sciamano.
- Problemi da approvare: (1) manca `immagini/Trono_di_Cenere.webp` (poster del video in index.html); (2) chiave `zainoVuoto` duplicata nei testi del tutorial; (3) `PE_NEMICI` in gioco.html non usata e con valori vecchi; (4) bersagli piccoli sul telefono; (5) diario del tutorial non raggiungibile da tastiera, `#vitali` con elenco di definizioni non valido; (6) coniglio 20 PE contro 50-75 del documento.
- Non verificato qui: regole Firestore sull'emulatore (download bloccato in questo ambiente), sincronizzazione reale PC ↔ Pixel.
