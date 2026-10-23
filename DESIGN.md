---
name: Il Trono di Cenere
description: "Libro game testuale gotico: un diario di azioni, prove di abilità e dialoghi dentro Casa Vespera."
colors:
  ash-black: "#141414"
  ash-surface: "#1c1c1c"
  ash-line: "#333333"
  ash-text: "#d6d6d6"
  ash-muted: "#9a9a9a"
  ash-accent: "#b5b5b5"
  ash-light: "#e6e6e6"
  ash-box: "#222222"
  ash-box-edge: "#4d4d4d"
  ash-quest: "#c8c8c8"
  ash-quest-wash: "#1f1f1f"
  ash-quest-edge: "#464646"
  ash-done-edge: "#555555"
  leather-black: "#181512"
  leather-surface: "#211c17"
  leather-line: "#3a3129"
  parchment: "#D8C9B2"
  parchment-muted: "#A69882"
  antique-bronze: "#C09563"
  old-gold: "#CFA862"
  old-gold-wash: "#28200F"
  old-gold-edge: "#6a5426"
  verdigris: "#7DB8AE"
  verdigris-wash: "#14221F"
  verdigris-edge: "#2f5a54"
  requiem-rose: "#D497B2"
  requiem-rose-wash: "#29171F"
  requiem-rose-edge: "#6e3a52"
  moss: "#8fbf7a"
  moss-wash: "#18201a"
  moss-edge: "#3f5a3c"
  moss-warm: "#9DBB7A"
  moss-warm-wash: "#1A2116"
  moss-warm-edge: "#45573a"
  blood: "#e0705f"
  blood-wash: "#2a1716"
  blood-edge: "#74302a"
  blood-warm: "#E07A6A"
  blood-warm-wash: "#2B1715"
  blood-warm-edge: "#7a2e28"
  arcane-violet: "#b4a2dc"
  arcane-violet-wash: "#1f1b28"
  arcane-violet-edge: "#4a3f66"
  arcane-violet-warm: "#B9A3E0"
  arcane-violet-warm-wash: "#211B2D"
  arcane-violet-warm-edge: "#4f3f6e"
  rust: "#d98a57"
  rust-wash: "#261c14"
  rust-edge: "#6e4626"
  rust-warm: "#E0905A"
  rust-warm-wash: "#2A1C12"
  rust-warm-edge: "#7a4a2a"
  alarm-red: "#ff2d2d"
  bar-health: "#e0524a"
  bar-mind: "#9a7be0"
  bar-mana: "#4c8dff"
  bar-resource: "#e0a23a"
  clasp-bronze: "#c98a4b"
  clasp-silver: "#c0c7d0"
  clasp-gold: "#e3b341"
  clasp-platinum: "#a8d8e8"
  star-red: "#d64545"
  conflict-amber: "#d9a441"
  conflict-amber-light: "#f0c674"
  delete-red: "#d96b6b"
typography:
  display:
    fontFamily: "Cinzel, Georgia, serif"
    fontSize: "clamp(2rem, 6.5vw, 4.25rem)"
    fontWeight: 600
    letterSpacing: "0.14em"
  headline:
    fontFamily: "Cinzel, Georgia, serif"
    fontSize: "1.6rem"
    fontWeight: 600
    letterSpacing: "0.06em"
  title:
    fontFamily: "Cinzel, Georgia, serif"
    fontSize: "1.15rem"
    fontWeight: 600
    letterSpacing: "0.06em"
  body:
    fontFamily: "Lora, Georgia, serif"
    fontSize: "1.12rem"
    fontWeight: 400
    lineHeight: 1.75
  body-sheet:
    fontFamily: "Lora, Georgia, serif"
    fontSize: "0.97rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Cinzel, Georgia, serif"
    fontSize: "0.78rem"
    fontWeight: 600
    letterSpacing: "0.14em"
rounded:
  xs: "0.25rem"
  sm: "0.4rem"
  md: "0.5rem"
  lg: "0.6rem"
  xl: "0.8rem"
  pill: "999px"
spacing:
  xs: "0.5rem"
  sm: "0.75rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.ash-accent}"
    textColor: "{colors.ash-black}"
    rounded: "{rounded.md}"
    padding: "0.55rem 1.2rem"
  button-primary-warm:
    backgroundColor: "{colors.antique-bronze}"
    textColor: "{colors.leather-black}"
    rounded: "{rounded.md}"
    padding: "0.55rem 1.2rem"
  button-action:
    backgroundColor: "transparent"
    textColor: "{colors.ash-text}"
    rounded: "{rounded.md}"
    padding: "0.7rem 1.1rem"
  button-mini:
    backgroundColor: "transparent"
    textColor: "{colors.ash-text}"
    rounded: "{rounded.sm}"
    padding: "0.25rem 0.65rem"
  input-command:
    backgroundColor: "transparent"
    textColor: "{colors.ash-text}"
    rounded: "{rounded.md}"
    padding: "0.7rem 1rem"
  action-drawer:
    backgroundColor: "{colors.ash-surface}"
    textColor: "{colors.ash-muted}"
    rounded: "{rounded.md}"
    padding: "0.75rem 1rem"
  action-drawer-pass:
    backgroundColor: "{colors.moss-wash}"
    textColor: "{colors.moss}"
    rounded: "{rounded.md}"
    padding: "0.75rem 1rem"
  action-drawer-fail:
    backgroundColor: "{colors.blood-wash}"
    textColor: "{colors.blood}"
    rounded: "{rounded.md}"
    padding: "0.75rem 1rem"
  action-drawer-dialogue:
    backgroundColor: "{colors.arcane-violet-wash}"
    textColor: "{colors.arcane-violet}"
    rounded: "{rounded.md}"
    padding: "0.75rem 1rem"
  box-enemy:
    backgroundColor: "{colors.rust-wash}"
    textColor: "{colors.rust}"
    rounded: "{rounded.md}"
    padding: "1.25rem 1.5rem"
  box-ability-warm:
    backgroundColor: "{colors.old-gold-wash}"
    textColor: "{colors.old-gold}"
    rounded: "{rounded.md}"
    padding: "1.25rem 1.5rem"
  box-quest-warm:
    backgroundColor: "{colors.verdigris-wash}"
    textColor: "{colors.verdigris}"
    rounded: "{rounded.md}"
    padding: "1.25rem 1.5rem"
  box-quest-done-warm:
    backgroundColor: "{colors.requiem-rose-wash}"
    textColor: "{colors.requiem-rose}"
    rounded: "{rounded.md}"
    padding: "1.25rem 1.5rem"
  chip-check-data:
    backgroundColor: "transparent"
    textColor: "{colors.ash-text}"
    rounded: "{rounded.pill}"
    padding: "0.15rem 0.8rem"
---

# Design System: Il Trono di Cenere

<!-- Aggiornato il 23 ottobre: palette «Cenere» / «Tomo Proibito» e caratteri Lora + Cinzel. I token vivono in tema.css; i colori «-warm» sono quelli di body.fuoco-caldo. -->

## Overview

**Creative North Star: "Il Diario di Cenere"**

Il gioco è un diario che si scrive mentre lo si vive. Ogni azione del giocatore apre una tendina, e dentro la tendina cade tutto ciò che quell'azione ha provocato: la narrazione, la prova di abilità, il colpo del mastino, la voce di Guendalina. La pagina è una colonna di testo lunga e scorrevole, letta come un libro, con l'interfaccia ridotta a una scheda del personaggio a sinistra e a una riga di comando in basso.

Tutto è **cenere**: fondo, testo, pulsanti e scheda sono grigi neutri, e il colore compare solo quando ha un significato (esito delle prove, dialoghi, nemico, salute bassa). Dove il fuoco è caldo e si può riposare, la casa si scalda: l'interfaccia sfuma in 1,2 secondi verso il **Tomo Proibito**, cuoio nero, pergamena, bronzo e oro. Quando il fuoco si consuma, torna la cenere. Il giocatore sente la sicurezza prima ancora di leggerla.

Densità media, ritmo da romanzo: righe alte (1.75), spazi generosi tra le voci (1.5rem), niente ombre decorative. La pagina iniziale è l'unica superficie "cinematografica" (video a tutto schermo, titolo in Cinzel spaziato); il resto lavora in modalità lettura.

**Key Characteristics:**
- Lora per tutto il testo (narrazione, scheda, pulsanti), Cinzel solo per titoli brevi.
- Due palette: Cenere di base, Tomo Proibito dove il fuoco è caldo (`body.fuoco-caldo`).
- Tendine `<details>` come unità narrativa: un'azione = una tendina.
- Codice cromatico semantico stabile in entrambe le palette.
- Stato del personaggio visibile sull'interfaccia (cornici, crepe, distorsioni), non solo nei numeri.
- Sempre tema scuro; i caratteri sono file locali in `lib/fonts`.

## Colors

Cenere neutra come base; il calore è un premio legato al fuoco; ogni colore acceso è un segnale.

### Primary
- **Ash Accent** (ash-accent) → **Antique Bronze** (antique-bronze) col fuoco caldo: il colore del giocatore. Bordo delle tendine d'azione, "Salva partita", pulsanti d'azione e mini-pulsanti, cornice del ritratto, anello di focus.
- **Ash Light** (ash-light) → **Old Gold** (old-gold): nome della stanza, nome del personaggio.

### Secondary
- **Arcane Violet** (arcane-violet): tutto ciò che è dialogo. Tendina della domanda, riquadro delle risposte, nome di chi parla.
- **Rust** (rust): il nemico. Riquadro delle sue mosse, scheda del nemico, barra dello scontro.

### Tertiary
- **Moss / Blood** (moss, blood): esito delle prove; tingono l'intera tendina dell'azione. Il testo rosso è schiarito (5.4:1) per restare leggibile.
- **Old Gold / Verdigris / Requiem Rose** (col fuoco caldo): capacità, missioni, missione completata. Nella cenere diventano grigi e si distinguono dal titolo.
- **Alarm Red** (alarm-red): solo salute fisica bassa. È l'unico colore saturo: deve spaventare.
- **Barre e fermagli** (bar-*, clasp-*): salute, mente, mana e risorsa nella barra del telefono; gradi di caccia sotto il nome.

### Neutral
- **Ash Black / Leather Black** (ash-black, leather-black): fondo di tutte le pagine.
- **Ash Text / Parchment** (ash-text, parchment): testo principale (12.7:1 e 11.2:1).
- **Ash Muted / Parchment Muted**: etichette, azioni del giocatore nelle tendine, note di sistema (6.5:1 e 6.4:1).
- **Ash Line / Leather Line**: divisori, bordi secondari, campo di scrittura a riposo.

Ogni colore semantico ha tre gradi: tinta piena (testo), `-wash` (fondo del riquadro), `-edge` (bordo). Tutti i colori di testo superano 4.5:1 sul loro fondo in entrambe le palette.

### Named Rules
**The Warmth Is Safety Rule.** Il Tomo Proibito appare solo dove il fuoco è caldo e si può riposare (cucina, sala da conversazione finché il fuoco non è consumato, cripta col braciere acceso). Mai altrove, mai come decorazione.

**The One Meaning Rule.** Ogni tinta ha un solo significato. Un nuovo tipo di contenuto riceve un colore nuovo, mai uno già usato con un altro senso.

**The Alarm Is Not a Verdict Rule.** Alarm Red parla solo della salute del personaggio. Una prova fallita usa Blood, mai l'allarme.

## Typography

**Display Font:** Cinzel (con Georgia)
**Body Font:** Lora (con Georgia)

**Character:** Lora, un serif calligrafico nato per leggere a lungo, porta la narrazione e l'interfaccia; il suo corsivo dà voce ai personaggi. Cinzel, maiuscole romane incise, segna soltanto i titoli.

### Hierarchy
- **Display** (Cinzel 600, clamp(2rem, 6.5vw, 4.25rem), spaziatura 0.14em): titolo della pagina iniziale.
- **Headline** (Cinzel 600, 1.6rem, 0.06em): nome della stanza (`h2.luogo`), titoli di creazione e regolamento; 1.3rem su telefono.
- **Title** (Cinzel 600, 1.15rem): titolo dei riquadri di prova, sezioni della scheda, nomi dei personaggi.
- **Body** (Lora 400, 1.12rem, interlinea 1.75): narrazione; 1.04rem / 1.6 su telefono.
- **Body Sheet** (Lora 400, 0.97rem): schede, liste di oggetti e tecniche, pulsanti; cifre allineate.
- **Label** (Cinzel 600, 0.78rem, 0.14em): nome di chi parla nei dialoghi.

### Named Rules
**The Short Title Rule.** Cinzel non ha vere minuscole: solo titoli brevi (stanze, nomi, sezioni). Mai frasi, pulsanti o titoli dei riquadri che contengono una frase intera.

**The Voice Rule.** Le parole dei personaggi (righe che iniziano con «) sono in corsivo; descrizioni e narrazione restano in tondo. Le azioni del giocatore nelle tendine sono in corsivo e color cenere, come una nota a margine.

## Layout

Tre colonne su schermo largo: scheda del personaggio (20rem), un divisore da 1px che sfuma alle estremità, e il gioco. Durante uno scontro compare una quarta colonna con la scheda del nemico (18rem). Il gioco è una pila verticale: barra in alto, diario scorrevole, comandi in basso. La colonna del diario è centrata con un massimo di 62rem.

Sotto gli 820px tutto lo schermo va al diario. In alto una barra compatta con mini-ritratto e tre barre (salute, mente, risorsa); toccandola la scheda completa entra come pannello da sinistra (88vw, massimo 23rem). Durante uno scontro una striscia color ruggine apre la scheda del nemico da destra. Bersagli tattili di almeno 2.75rem; safe-area rispettate.

Ritmo verticale: 1.5rem tra le voci del diario (1.1rem su telefono), 1.1rem tra i paragrafi, 1.25rem tra il titolo di una tendina e il suo contenuto. Le immagini delle stanze entrano sempre intere nello schermo.

## Elevation & Depth

Sistema piatto. La profondità si ottiene con fondi tonali (i `-wash`) e bordi da 1px. Le ombre compaiono solo per staccare ciò che sta sopra la partita (pannelli del telefono, finestra del regolamento, toast) e come segnale di stato (alone rosso della salute bassa).

### Shadow Vocabulary
- **Pannello sovrapposto** (`box-shadow: 0 0 40px rgba(0,0,0,0.45)`): scheda a scomparsa su telefono.
- **Toast** (`box-shadow: 0 6px 20px rgba(0,0,0,0.3)`): conferme brevi su telefono.
- **Allarme salute** (`box-shadow: 0 0 10px 2px rgba(255,45,45,0.55)`, pulsante sotto il 20%): solo salute fisica bassa.

### Named Rules
**The Flat Page Rule.** Il diario è carta: niente ombre su voci, tendine o riquadri. Un'ombra significa "questo sta sopra la partita" oppure "sei in pericolo". Niente aloni colorati decorativi.

## Shapes

Angoli morbidi e costanti: 0.5rem per tendine, riquadri, pulsanti e campo di scrittura; 0.4rem per i mini-pulsanti; 0.6rem per ritratti e sezioni; 0.8rem per le finestre sovrapposte; 0.25rem per le bandiere della lingua; pillola per dati delle prove e badge. I ritratti mantengono la proporzione originale (900/1122) con cornice piena da 3px. Rombi a 45° per i turni degli effetti, medaglioni circolari per gli effetti attivi.

## Components

### Buttons
- **Primary:** "Salva partita": fondo accento (cenere chiara, bronzo col fuoco), testo del colore del fondo, Lora 600.
- **Action:** scelte e "Invia": fondo trasparente, bordo accento da 2px, hover con velo dell'accento.
- **Mini:** "Usa", "Lancia": bordo da 1px accento, 0.85rem; su telefono più grandi (anche nelle Tecniche).
- **Icon:** regolamento, volume, casa: bordo linea, hover sul bordo accento; 2.75rem su telefono.
- **Focus:** contorno da 3px accento con offset 3px.

### Cards / Containers
- **Tendina d'azione** (componente firma): `<details>` con fondo superficie e bordo linea, sommario in corsivo con barra verticale e freccia ▸/▾. Varianti: neutra (nessuna prova), muschio (superata), sangue (fallita), viola (dialogo), grassetto per il turno di combattimento, "Scontro" per raccogliere i turni di uno scontro concluso.
- **Riquadro di prova:** bordo accento, titolo in Cinzel, azione in corsivo, dati (CD, dado, modificatore) come pillole.
- **Riquadri semantici:** stessa forma con la coppia wash/edge del loro colore: mia, nemico, capacità, missioni, missione completata.
- **Riquadro dialogo:** fondo viola, nome di chi parla in Cinzel, battute in corsivo che si scrivono a macchina.

### Inputs / Fields
- **Campo di comando:** fondo trasparente, bordo 2px linea, 16px su telefono.
- **Salute bassa:** bordo Alarm Red da 3px con alone; sotto il 20% pulsa.

### Effetti di stato (signature)
- **Cambio di palette col fuoco:** dissolvenza di 1,2 s delle variabili di colore (`@property`), disattivata con `prefers-reduced-motion`.
- **Ritratto incrinato**, **testo distorto**, **cenere del mastino**, **fermagli di grado**: invariati.

## Do's and Don'ts

### Do:
- **Do** usare le variabili di `tema.css` (`--bg`, `--text`, `--accent`, `--ok`, `--ko`, `--dlg`, `--nem`, `--cap`, `--mis`, `--fine`): così ogni elemento nuovo segue da solo il cambio di palette.
- **Do** dare a ogni nuovo colore semantico i valori per entrambe le palette, con contrasto di almeno 4.5:1.
- **Do** tenere le battute dei personaggi in corsivo e le descrizioni in tondo.
- **Do** rispettare `prefers-reduced-motion` per ogni animazione.
- **Do** mantenere bersagli tattili di almeno 2.75rem e il campo di comando a 16px su telefono.

### Don't:
- **Don't** scrivere colori fissi nelle pagine: un colore fuori da `tema.css` non cambia col fuoco.
- **Don't** usare il Tomo Proibito dove non c'è un fuoco caldo.
- **Don't** usare Alarm Red per qualcosa che non sia la salute fisica bassa.
- **Don't** usare Cinzel per frasi o pulsanti, né aggiungere un terzo carattere.
- **Don't** aggiungere aloni colorati o ombre decorative.
