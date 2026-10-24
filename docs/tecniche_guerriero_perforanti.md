# Guerriero — Tecniche perforanti e vie di prestigio (v2, implementata)

Versione finale, ora nel codice. Le regole stanno in `js/combattimento.js`; le tecniche (italiano e inglese) in `js/tecniche.js`. Segue le stesse regole del taglio e delle contundenti: d20 contro CA, tiri salvezza con CD = 8 + mod Vigore + livello, durate in turni del nemico, immunità dei boss, **critico = 20 sul d20, doppio dei dadi di danno**.

Armi perforanti del gioco: **Mazza chiodata** (1d6) e **Piccone da battaglia** (1d8, due mani). Tema: **Precisione** (colpire anche le armature robuste) e **Critico** (allargare l'intervallo del critico).

---

## 1. Problemi trovati nelle due liste originali

| # | Problema | Dove | Soluzione |
|---|---|---|---|
| 1 | Percentuali di critico (+10%, +15%, +25%) | Quasi tutte | Sul d20 ogni numero vale 5%: diventano intervalli di critico (19-20, 18-20) |
| 2 | "Ignora il 25/60/100% dell'armatura" | 1, 4, 6, 8… | I nemici hanno solo la CA: ignorare l'armatura equivale a un bonus per colpire. Diventa "+N per colpire" |
| 3 | Moltiplicatori di danno (×1,5, ×2, ×2,5, 200%) | Prestigio B1, C3 | Il critico è il doppio dei dadi: si lavora su "+1 dado" e sull'intervallo del critico |
| 4 | Critico garantito già al livello 3, "ignora 100%" al livello 2 | 6, 9 | Progressione graduale |
| 5 | Attacchi a più bersagli ("tutti i nemici", "in linea retta") | 14 | Gli scontri sono uno contro uno: effetto su un solo bersaglio |
| 6 | "Difesa Fisica", "precisione −20%", "tempo di recupero" | Varie | Non esistono: diventano CA, Indebolito, costo in ira |
| 7 | "Rimborsa metà dei punti" + "consuma tutte le risorse" | 15 | Contraddittorio: tolto, resta "una volta per riposo" come gli altri livello 5 |
| 8 | Prestigio con 2 abilità su 3 per livello | Classi di prestigio | Il gioco dà 1 abilità della via per livello (3, 4, 5), legata ad Aldo o Guendalina |
| 9 | Recupero ira sul critico (Momentum) | Prestigio A2 | Esiste già: un tuo critico dà +2 ira |
| 10 | Stile da scherma (fioretto, cigno, danza) | Nomi | Adattati a mazza chiodata e piccone |

## 2. Regola e stato nuovi

**Intervallo del critico.** Alcune tecniche fanno critico anche con 19 o 18. Un critico colpisce sempre (come il 20 naturale). **Tetto: il critico non scende mai sotto 18** (18-20), anche sommando tecnica ed Esposto.

| Stato | Effetto | Boss |
|---|---|---|
| **Esposto** | I tuoi attacchi contro il nemico fanno critico con un numero in meno (19-20; 18-20 se la tecnica ha già 19-20). Si rinnova, non si somma | Sì, massimo 2 turni |

Esposto funziona anche sui boss, come Incrinatura per le contundenti: altrimenti il ramo perde gli scontri che contano.

## 3. Le 15 tecniche perforanti

Le tre perforanti attuali più in tema restano (Affondo al Cuore, Puntura di Spillo, Colpo alla Giuntura). Puntata al Plesso, Zanzara di Ferro e Stoccata Laterale vengono tolte (controllo e sanguinamento sono di altri rami; la Zanzara rigenera troppa ira) e diventano posti vuoti nei salvataggi.

| Liv | Tecnica | Costo | Effetto |
|---|---|---|---|
| 1 | Affondo al Cuore *(esistente)* | 2 | +2 per colpire; critico 19-20 |
| 1 | Puntura di Spillo *(esistente)* | 2 | Solo il dado; se colpisce, prossimo attacco +2 per colpire |
| 1 | Mirare al Varco | 3 | Attacco normale; se colpisce, Esposto 2 |
| 2 | Colpo alla Giuntura *(esistente)* | 4 | Attacco normale; se colpisce, prossimo attacco +1 dado |
| 2 | Trafittura | 5 | +3 per colpire, +1 dado |
| 2 | Punta nel Fianco | 4 | Critico 18-20; se è critico, Indebolito 2 |
| 3 | Doppia Punta | 5 | 2 attacchi col solo dado, ciascuno critico 19-20 |
| 3 | Perforazione Profonda | 6 | +3 per colpire, +1 dado; se colpisce, Esposto 2 |
| 3 | Colpo Mirato | 6 | Se colpisce, è sempre critico |
| 4 | Ferita Profonda | 8 | +1 dado; Esposto 3 + Indebolito 2 |
| 4 | Guardia di Punta | 7 | Consuma l'azione; il primo colpo subito fa 0 danni, contrattacco con critico 18-20 + Esposto 2 |
| 4 | Colpo di Grazia | 8 | +1 dado, critico 19-20; esecuzione sotto 1/4 della salute (comuni) |
| 5 | Tempesta di Punte | 10 | 3 attacchi col solo dado, critico 18-20; ogni critico rinnova Esposto 2; 3 su 3 + tiro salvezza → Stordito 1 (boss: Indebolito 2) |
| 5 | Trafittura Celeste | 9 | +5 per colpire, +1 dado; Esposto 3 + Sbilanciato 3 |
| 5 | Il Colpo Perfetto | 10 | Una volta per riposo; +1 dado e sempre critico se colpisce (4 dadi), poi un attacco normale gratuito |

Note:
- Guardia di Punta segue la Parata Mutilante: il colpo annullato non dà ira.
- Colpo di Grazia: sui boss niente esecuzione, resta solo il critico 19-20 (come la Mutilazione del Carnefice).
- Il Colpo Perfetto: stessa struttura del Cataclisma del Filo Rovinato, con il critico al posto degli stati di controllo.

## 4. Vie di prestigio (dal livello 3)

Stessa scelta degli altri rami (`sceglieVia`). Proposta: **Aldo = Penetrazione** (sfondare, punire), **Guendalina = Precisione** (reattività, difesa), in linea con Spezzare/Controllo delle contundenti.

| Via | Liv | Abilità | Costo | Effetto |
|---|---|---|---|---|
| Aldo | 3 | Segno del Cacciatore | 6 | Esposto 3; finché è Esposto, +1d4 agli attacchi normali |
| Aldo | 4 | Trapasso | 8 | +5 per colpire, +1 dado; se il nemico è Esposto, +1 dado in più e l'Esposto si consuma |
| Aldo | 5 | Il Foro Eterno | 10 | Se il nemico è Esposto e colpisci: sempre critico + Esposto per tutto lo scontro (boss: 2 turni) |
| Guendalina | 3 | Occhio Vigile | 5 | Attacco normale, critico 19-20; +2 CA fino al tuo turno |
| Guendalina | 4 | Stoccata a Specchio | 8 | +1 dado, critico 18-20; se è critico, tiro salvezza → Frastornato 1 (boss: Indebolito 2); prossima tecnica −2 ira |
| Guendalina | 5 | Affondo dei Mille Soli | 10 | +1 dado; Esposto + Indebolito 3; per 3 turni +2 CA e i tuoi attacchi fanno critico con 18-20 |

## 5. Decisioni (24/10/2026)

1. **Critici forzati e ira:** restano così, anche i critici sicuri (Colpo Mirato, Il Foro Eterno, Il Colpo Perfetto) danno +2 ira.
2. **Vie:** confermate, Aldo = Penetrazione e Guendalina = Precisione.
3. **Esposto sui boss:** massimo 2 turni, come Indebolito e Sbilanciato.

Note di implementazione:
- Il contrattacco della Guardia di Punta tira un d20 solo per il critico (18-20); come per la Parata, il colpo annullato non dà ira e nemmeno il critico del contrattacco.
- Puntata al Plesso, Zanzara di Ferro e Stoccata Laterale sono tolte: nei salvataggi diventano posti vuoti; Affondo al Cuore, Puntura di Spillo e Colpo alla Giuntura restano preparate.
- Il testo dello sconto (Ritmo del Duello, Cadenza, Stoccata a Specchio) ora dice solo «Sconto».

## Nel codice

- **Intervallo del critico:** `Combattimento.sogliaCrit(s, base)` calcola da quale numero è critico (Esposto −1, Mille Soli 18, mai sotto `CRIT_MIN` = 18). La usano le tecniche, l'attacco normale del gioco e la sala di prova; l'evento `colpo` porta `critDa` quando è sotto 20.
- **Esposto:** stato `esposto` del nemico, `TETTO_BOSS.esposto = 2`; quello «per tutto lo scontro» del Foro Eterno vale 99 turni. Nella scheda del nemico compare con il mirino, «· segnato» se c'è il Segno del Cacciatore.
- **Segno del Cacciatore:** `scontro.segno`, +1d4 agli attacchi normali finché il nemico è Esposto; finisce con l'Esposto (`fineTurnoNemico`) o con il Trapasso.
- **Mille Soli:** stato `precisione` del personaggio (3 turni), compare tra i tuoi effetti attivi.
- **Guardia di Punta:** usa la Parata con `parataPunta`.
- **Scelta della via:** con un'arma perforante la finestra mostra le abilità perforanti.
- **Regolamento:** aggiunti Esposto e l'intervallo del critico (italiano e inglese).

## Test

- `node tests/combattimento.test.js`: 82 test delle regole (19 nuovi per le perforanti e le loro vie).
- `node tests/combattimento.browser.js`: 48 test nel browser (11 nuovi: sala di prova con la mazza, partita, boss, via, salvataggi, creazione, regolamento).
- **Sala di prova:** `tutorial.html?prova`, arma «Mazza chiodata» o «Piccone da battaglia».

## 6. Verifica di taglio e contundenti (critico = doppio dei dadi)

- Il codice è già coerente: il 20 colpisce sempre e tira il doppio dei dadi (`nd = 2 × dadi`), anche quelli extra delle tecniche. Il regolamento lo dice uguale. Nessuna percentuale nei due rami.
- **Unica ambiguità:** Cataclisma del Filo Rovinato e Sentenza del Maglio Titanico sono descritti come "il doppio dei dadi di danno", ma nel codice sono "+1 dado". Con armi a un dado il risultato è identico; con un 20 naturale diventano 4 dadi. È coerente con la regola, ma la descrizione fa sembrare quelle tecniche un critico già garantito. Proposta: riscriverle come "+1 dado di danno" (non ancora decisa, il testo resta com'è).
