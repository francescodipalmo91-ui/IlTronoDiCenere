# Decisioni e lavori del 27 novembre 2026 (venerdì)

Sessione di chiusura della settimana: i due aperti di S3 (sez. 1-2), S4 (sovrano e visioni, sez. 3), S6 (scena finale ed epiloghi, sez. 4) e il riversamento nei moduli (sez. 5). **⚠ = proposta di Claude non confermata esplicitamente da Francesco.** Nessun codice toccato.

## 1. Origine della maledizione (S3, punto 2) — DECISO da Francesco (opzione A, precisata)
- **L'incantesimo di Adele è solo un incantesimo andato male.** Causa l'incendio e la morte di Lorenzo (2º mese, anno 15). **Non scatena la maledizione.**
- **La maledizione nasce dalla rabbia e dal dolore del sovrano** (funerale, tunica bianca, prigionia di Adele) e si **completa** alla 2ª decade del 5º mese, anno 15.
- **Conseguenze (riversate il 27/11 in `storia_verita_e_finali.md` sez. 1 e nel riassunto):** Lorenzo non è sospeso perché è già morto e sepolto; il funerale ha una folla **viva** (gli spettri compaiono solo nella visione della corona); Adele è colpevole dell'incendio, **non della maledizione** (il «Sono stata io» della pagina III vale solo per l'incendio). Finale A («la lacrima sigilla la rabbia») e finale positivo (il perché raggiunge il re) restano coerenti, anzi più nette.
- **Ancora da fare (codice):** pagina IV dei diari (`CACCIA2`, 📖): Adele *vede* la rabbia di Rodolfo farsi catena e trono, non è un atto che lui compie né vuole. ⚠ Verificare in `storia_personaggi.md` e nei testi del gioco che nessuna riga attribuisca la sospensione ad Adele.

## 2. Danno mentale alla lettura dei diari (S3, punto 3) — DECISO da Francesco (opzione B)
- **Nessun danno mentale alla lettura dei diari di Adele**, stessa linea dei flashback (9/11). Il costo mentale resta nella casa.
- **Codice da fare (controllato su `gioco.html` del PC, nessuna modifica):** `DANNO_DIARIO` (~9350), tiro in `leggiPagina` (~9368-9369), frase `A2.diario.ferisce` (IT ~3726, EN ~3921).
- ⚠ **Incongruenza trovata:** il codice applica ancora **1d4 di danno mentale ai flashback** (contro il 9/11): visione del funerale dell'anello (`flash_anello` ~9535-9540, `visioneDanno` ~3857) e «primo tocco» delle scale (`primoTocco` ~10515-10521, `SCALE.dannoDado`). Da togliere con la stessa modifica **CONFERMATO da Francesco il 27/11** («vince sempre la decisione più recente»: vale la linea del 9/11 e del 27/11, quindi niente danno nemmeno ai flashback). I diari dei vuoti (`js/cacce.js`) non hanno danno.

## 3. S4: le visioni del sovrano e le tre lacrime — DECISO da Francesco
**3a. Le tre lacrime sono tre ricordi positivi di Adele (condizione di Francesco).**
- Quando il giocatore **prende** una lacrima parte un ricordo felice di Adele, **punto di vista di Adele**, uguale per tutte e tre. Nessun danno mentale, nessun peso sulla Bilancia: sono scene, visibili a tutti i finali.
- **Una lacrima per figlio, in ordine di nascita:** 1ª il figlio maggiore, 2ª Lorenzo, 3ª Agnese. **La terza è il pranzo in giardino** (Adele incinta di Agnese parla con Rodolfo, i figli seduti a tavola con i giocattoli, Aldo e Guendalina in disparte), puramente felice. Arriva con Atena, **prima** della scelta finale.
- **L'epilogo positivo non ripete la scena:** aggiunge Agnese nata, Lorenzo ricordato con un sorriso, il dolore accettato.
- **Gemma per figlio (confermata):** Rodolfo regala ad Adele una gemma per ogni figlio e le incastona nel collier; la catena sola è il dono di nozze. ⚠ Da verificare con la pagina I dei diari («dono di nozze»).
- **La spada** perde la visione del pranzo e ne ha una nuova (3b).

**3b. I due set = le due metà della vita di Rodolfo.**
- **Set di carne** (mantello, guanti, elmo, mano libera, corazza) = Rodolfo **buono**: vittorie in difesa della terra e della casa, giustizia severa ma onesta, famiglia.
- **Set di cenere** (medaglione, anello, spada, corno, corona) = il **declino**, in ordine cronologico: notte dell'incendio, funerale (folla viva), prigionia di Adele (spada come sigillo), ultima caccia (corno, punto di vista di Aldo), lutto e completamento (corona, gli spettri compaiono qui). **Confusione solo nello stile del testo**, mai meccanica.
- **Un ricordo per oggetto, 80-100 parole**: 5 + 5 + 3 = **13 scene**, provvisorie 📖 in `visioni_e_ricordi.md` (tra 84 e 98 parole, solo italiano).
- **Il corno diventa «l'ultima caccia del re»** (la consegna a Dafne resta lore del 26/11). La collana vuota (visione di Guendalina) resta fuori dai set.
- **Atena (confermato):** lacrima 3, corona e diario IV restano insieme.
- Eventuali mancanze si lavorano dopo, caso per caso.

## 4. S6: la scena finale e gli epiloghi — DECISO da Francesco
**Nomi dei finali:** da ora solo *Il pranzo in giardino*, *Il Guardiano di Cenere*, *Il Trono di Cenere* (basta «finale A/B»).

**4a. Scena della scelta (opzione B).** Sequenza: Atena → terza lacrima → diario IV → **scena a tre nella stanza di Adele** (⚠ stanza del secondo piano, da verificare con la mappa) → preparazione sulla soglia del re → scontro → epilogo. Il giocatore trova Adele incatenata; Aldo arriva sulla porta e chiede la lacrima. Azioni: **dare ad Adele**, **dare ad Aldo** (guardando Adele incatenata), **tenere e uscire**, **«Non riesco a decidere»** (4d). Aldo e Adele hanno una battuta che cambia con la Bilancia (il tono, non il finale).

**4b. Costo di andare contro la Bilancia (opzione A).** Il polo in testa (almeno 3 punti, ⚠ da misurare) rende naturale un finale ma non blocca niente. Andare contro costa **un confronto con il proprio passato** (Aldo e Adele nominano due o tre azioni vere del giocatore, circa 6-9 righe modulari dalla tabella dei pesi), una **riga nell'epilogo** e **lo zaffiro di Adele che resta spento**. Nessun costo meccanico. Con equilibrio la scena tace e la scelta è libera.

**4c. Epiloghi a moduli (opzione A).** Nucleo fisso di circa tre paragrafi per epilogo più quattro moduli: **guardiani** (Ettore ed Enea risparmiati o uccisi, due varianti ciascuno; ⚠ **correzione del 27/11: Dafne va sempre uccisa**, quindi due varianti secondo il tono con cui la si accompagna, da confermare; Atena mai); **background** (una riga ciascuno; nel Pranzo l'avidità si paga lì); **strappo** (solo se contro il polo in testa); **giorni** (solo nel Pranzo). Circa 20 righe più i tre nuclei, da scrivere.

**4d. Il Guardiano di Cenere (opzioni B e A).** Chi non sceglie arriva qui con l'azione **«Non riesco a decidere»** (Aldo: «Allora resti», prende la lacrima). **Ultima immagine:** il personaggio in fondo al corridoio dell'atrio, con il fermaglio e l'uniforme Vespera, mentre **un nuovo avventuriero entra dalla grotta**. Superato: «scontro perso nel finale A: Aldo ti riporta indietro» (vale la regola dell'11/11: si muore, in facile si riparte dalla preparazione).

## 5. Riversamento (fatto il 27/11) e cosa resta
- **Riversati nel progetto:** `storia_verita_e_finali.md` (sez. 1, 3, 5, 6 con scena della scelta, finali ed epiloghi a moduli, 6b, Aperti), `storia_retaggio_e_set.md` (sez. 7b, 7c, 8b, 12 rifatta, Aperti; nomi dei finali), `storia_personaggi.md` (nuova sez. 10d con le decisioni 23-26/11; risparmio solo per Ettore ed Enea; Dafne lucida e da uccidere), `storia_protagonista.md`, `bilancia_tre_poli.md` (non decide il finale; Dafne), `storia_riassunto.md`, `registro_cancellati.md` (6 righe nuove), `mappa_progetto.md`, `punto_della_situazione.md`.
- ⚠ **Contraddizione trovata e sistemata:** `bilancia_tre_poli.md` dava «+2 Obbedienza per aver ucciso Dafne»; ora Dafne non pesa (⚠ da confermare).
- **Ancora da riversare:** date e calendario in `storia_casa_ed_esterni.md`; `vuoti.md` («consumati prima della casa» → «nei pressi»); `storia_enea.md` (nomi dei finali); `riscrittura_meccaniche.md` 8e e `riepilogo_riscrittura.md` («finale B»); `storia_mappa.md` (da costruire dopo S5).
- **Testi da scrivere:** scena a tre della scelta, righe del confronto, 3 nuclei e ~20 moduli degli epiloghi, pagina IV dei diari.
- **Codice (lunedì 30/11):** togliere il danno mentale da diari e (se confermato) flashback; sostituire i testi delle visioni; avvio della rimozione del vecchio motore in copia a parte (lavoro pesante: avviso prima per il budget).
- **Aperti di storia:** S5 (il perché di Aldo; perché Guendalina nascose la catena di notte, e da chi); soglia della Bilancia da misurare.
