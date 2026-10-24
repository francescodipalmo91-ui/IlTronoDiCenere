# Guerriero — Tecniche del taglio e vie di prestigio (v5, implementata)

Versione finale, ora nel codice. Le regole stanno in `js/combattimento.js`; le tecniche (italiano e inglese) in `js/tecniche.js`; i numeri condivisi in `js/regole.js`.

---

## 1. Regole

- **Attacco:** d20 + mod Vigore contro la CA del nemico. Se la tecnica manca, l'ira è spesa lo stesso.
- **Danno:** dado dell'arma + mod Vigore, salvo "+1 dado", "solo il dado" o "dadi doppi".
- **Tiro salvezza del nemico:** d20 + suo mod Vigore contro CD = 8 + tuo mod Vigore + livello.
- **Durata:** in turni del nemico. Un effetto già attivo si rinnova, non si somma.

### Punti ira
- Livello 1: 10 + mod Vigore. A ogni salita: + mod Vigore + nuovo livello (minimo 1).
- Esempio con mod +3: 13, 18, 24, 31, 39.
- Riposo: 1d4 + livello (invariato).
- **In combattimento:** per ogni colpo subito che va a segno, +1 ai livelli 1-2, +2 ai livelli 3-4, +3 al livello 5, doppio sul critico.
  - Non conta un attacco mancato né uno annullato dalla Parata.
  - Il Soffio conta solo se ti colpisce.
  - La Presa e il sanguinamento non contano.
  - Resta anche la regola che c'era già: un tuo colpo critico ti dà +2 ira.

### Posti
- Per ogni livello ci sono 3 opzioni: se ne scelgono 2 ai livelli 1-2 e 1 ai livelli 3-5.
- Posti totali 2, 4, 5, 6, 7, più 1 con lo scudo (quello in più vale per qualsiasi livello).
- Le quote valgono per livello: al livello 3 puoi avere una sola tecnica di livello 3.
- Le abilità della via non occupano posti.

## 2. Stati

| Stato | Effetto | Boss |
|---|---|---|
| Sanguinamento / Emorragia | 1d4 / 1d6 all'inizio del turno del nemico. L'Emorragia non si abbassa con un 1d4 | Sì |
| Indebolito | −2 per colpire | Massimo 2 turni |
| Sbilanciato | −2 alla CA | Massimo 2 turni |
| Frastornato | −4 per colpire, niente critici | Immune, senza tiro |
| Stordito | Salta il turno | Immune, senza tiro |
| Senza attacchi speciali | Niente Presa né Soffio | Immune, senza tiro |
| Esecuzione (Mutilazione) | Nemico comune sotto 1/4 della salute | Mai |

**Boss:** Guendalina, Aldo, il sovrano, Adele, Ettore, Enea, Dafne, Atena, il mastino a due teste e il mastino della camera di Adele. Nel codice basta `boss: true` in `NEMICI`; oggi esiste solo Ettore.

## 3. Le 15 tecniche del taglio

| Liv | Tecnica | Costo | Effetto |
|---|---|---|---|
| 1 | Fendente al Polso | 2 | Indebolito 2 |
| 1 | Morso dell'Acciaio | 3 | Sanguinamento 1d4 per 2 |
| 1 | Pomolo Sbalorditivo | 3 | Sbilanciato 1 |
| 2 | Fendente della Vipera | 5 | Tiro salvezza → Frastornato 1 |
| 2 | Recisione dei Tendini | 5 | Sanguinamento 2 + Sbilanciato 1 |
| 2 | Stoccata Cremisi | 4 | +1 dado; se sanguina: sanguinamento da 2 turni + Indebolito 2 |
| 3 | Eco del Metallo Stridente | 6 | Tiro salvezza → Stordito 1; se resiste (o è un boss) Sbilanciato 1 |
| 3 | Lacerazione delle Arterie | 6 | Emorragia 1d6 per 3, recuperi 1d4 salute |
| 3 | Spezza-Guardia | 5 | Sbilanciato 2, +2 per colpire al prossimo attacco |
| 4 | Squarcia-Articolazioni | 8 | +1 dado; tiro salvezza → Frastornato 2 + niente attacchi speciali 2 |
| 4 | Mutilazione del Carnefice | 8 | +1 dado; Indebolito 3 + Sanguinamento 2; esecuzione sotto 1/4 (comuni) |
| 4 | Parata Mutilante | 7 | Consuma l'azione; il primo colpo fa 0 danni, contrattacco + Sanguinamento 2 |
| 5 | Cateratta delle Cento Lacerazioni | 10 | 3 attacchi col solo dado, rinnovano il sanguinamento; 3 su 3 + tiro salvezza → Stordito 1 |
| 5 | Diluvio Rosso | 9 | +1 dado; Emorragia 3 + Indebolito 3 |
| 5 | Cataclisma del Filo Rovinato | 10 | Una volta per riposo; dadi doppi, Frastornato + Sbilanciato 3, poi un attacco normale gratuito |

Le sei tecniche del taglio di prima (Squarcio della Belva, Taglio Arterioso…) sono state tolte. Contundenti, perforanti e scudo restano come prima.

## 4. Vie di prestigio (dal livello 3)

| Via | Liv | Abilità | Costo | Effetto |
|---|---|---|---|---|
| Aldo | 3 | Marchio del Guardiano | 6 | Sanguinamento 3; finché sanguina, +1d4 agli attacchi normali |
| Aldo | 4 | Ferita Riaperta | 8 | Se sanguina: tutti i danni rimasti subito; altrimenti Sanguinamento 2 |
| Aldo | 5 | Sentenza del Boia | 10 | Se sanguina e colpisci: sempre critico |
| Guendalina | 3 | Veglia di Ferro | 5 | Indebolito + Sbilanciato 2; +2 CA fino al tuo turno |
| Guendalina | 4 | Ritmo del Duello | 8 | +1 dado; Indebolito 3 (tiro salvezza → Frastornato 1); prossima tecnica −2 ira |
| Guendalina | 5 | Veglia Inflessibile | 10 | +1 dado; Indebolito + Sbilanciato 3; per 3 turni +2 CA e +4 ai tiri salvezza e alle prove contrapposte (come Furore) |

La scelta della via è **provvisoria**: al livello 3 compare un pulsante «Scegli» nella sezione Tecniche. Quando scriverai i dialoghi con Aldo e Guendalina, basterà chiamare `sceglieVia("aldo")` o `sceglieVia("guendalina")`. La scelta è definitiva.

## 5. Test

- `node tests/combattimento.test.js`: 40 test delle regole, con dadi programmati. Coprono le 21 tecniche nuove, tutte le vecchie e gli 11 punti della lista.
- `node tests/combattimento.browser.js`: 24 test nel browser, su sala di prova, partita vera, creazione e regolamento in italiano e inglese. Servono un server locale e Playwright.
- **Sala di prova:** `tutorial.html?prova`. Puoi scegliere livello, arma, scudo, via e nemico (comune, Ettore boss, manichino), truccare i dadi e lanciare i test con un pulsante. Senza `?prova` il tutorial è quello di sempre.

## 6. Da decidere

Decise il 24/10/2026:
1. **Veglia Inflessibile:** la parte su Mente incrollabile (inutile in combattimento) è sostituita da +4 ai tiri salvezza e alle prove contrapposte per 3 turni, come Furore.
2. **Critico del giocatore:** resta il +2 ira.
3. **Presa:** non dà ira.

Da ricordare:
- **Scelta della via nei dialoghi:** quando si scrivono i dialoghi con Aldo e Guendalina, collegarli a `sceglieVia("aldo")` / `sceglieVia("guendalina")` e togliere il pulsante provvisorio nella sezione Tecniche.
- **Salvataggi esistenti:** l'ira già cresciuta con la vecchia regola (dado vita) resta com'è; le vecchie tecniche del taglio diventano posti vuoti da riempire.
