/* =====================================================================
   MAGIA — scuole dell'Arcanista (Sangue, Illusione; fino al 04/11 Arcano e Forza) e del Monaco (Luce, Ombra), livelli 1-5, con le vie di prestigio.
   Progetto in docs/incantesimi_arcanista_monaco.md (decisioni del 25/10/2026).

   STATO (25/10/2026): lo leggono regolamento, creazione e scheda di gioco (posti, preparazione al riposo, via di prestigio).
   Combattimento dell'Arcanista (Ferite, Copie, Sangue e Illusione, vie Vena e Velo): js/magia_combattimento.js. Anche il Monaco (Bilancia, Crepuscolo, Luce e Ombra).
   js/incantesimi.js (vecchio sistema) cancellato il 03/11; in gioco.html tolto anche il suo ramo di combattimento.

   - 04/11: niente scuola principale; posti liberi tra le due scuole (POSTI_ALTRA_SCUOLA resta come «1 posto in più»);
     dal livello 3 la via di prestigio potenzia la sua scuola (MagiaCombattimento.scuolaDellaVia, POTENZIAMENTI_VIA)
   - posti come le tecniche: Regole.TECNICHE_PER_LIVELLO (2, 2, 1, 1, 1)
   - via: "aldo" | "guendalina" → abilità della via di prestigio (dal livello 3), sempre pronte, non occupano posti
   - costo in mana (Arcanista) o fede (Monaco)
   - formato: [id, livello, costo, nome it, nome en, effetto it, effetto en]
   ===================================================================== */
(function (root) {
  const voce = (scuola, via) => ([id, liv, costo, nIt, nEn, eIt, eEn]) => ({ id, liv, costo, scuola, via, nome: { it: nIt, en: nEn }, effetto: { it: eIt, en: eEn } });

  /* 04/11 (Francesco): Arcano e Forza sostituite da Sangue e Illusione (docs/incantesimi_arcanista_monaco.md, sezione 2bis).
     Regola: ogni scuola vince da sola, la combo tra le due è un bonus. Sangue: Ferite sul nemico (il campo s.sigilli del motore), si paga in mana o salute.
     Illusione: Copie su di te (s.copie), solo mana. Stile del Sangue ispirato a Choso (Jujutsu Kaisen), con nomi nostri. */
  const SANGUE = [
    ["stilo_cremisi", 1, 1, "Stilo Cremisi", "Crimson Stylus", "Attacco magico, 1d8 sangue; se colpisce, 1 Ferita.", "Spell attack, 1d8 blood; on a hit, 1 Wound."],
    ["frusta_cremisi", 1, 2, "Frusta Cremisi", "Crimson Lash", "Senza tiro, 1d4 sangue; tiro salvezza → Sanguinamento (1d4 a turno). 1 Ferita in ogni caso.", "No roll, 1d4 blood; saving throw → Bleeding (1d4 per turn). 1 Wound either way."],
    ["crosta", 1, 1, "Crosta", "Scab", "Per 3 turni +2 alla Classe armatura; chi ti ferisce prende 1 Ferita.", "For 3 turns +2 Armor class; whoever wounds you takes 1 Wound."],
    ["lama_coagulata", 2, 2, "Lama Coagulata", "Clotted Blade", "Per 3 turni l'arma fa +1d4 e ogni colpo d'arma a segno incide 1 Ferita.", "For 3 turns your weapon deals +1d4 and every weapon hit carves 1 Wound."],
    ["ebollizione", 2, 3, "Ebollizione", "Boiling Blood", "Attacco magico, 2d6 sangue; consuma le Ferite: +1d6 e ti curi di 2 per ogni Ferita.", "Spell attack, 2d6 blood; spends the Wounds: +1d6 and you heal 2 for each Wound."],
    ["meteora_sangue", 2, 3, "Meteora di Sangue", "Blood Meteor", "Attacco magico, 2d6 sangue; se colpisce, Sbilanciato 1. Critico con 19-20 se il nemico ha almeno 2 Ferite.", "Spell attack, 2d6 blood; on a hit, Off-balance 1. Crits on 19-20 if the enemy has at least 2 Wounds."],
    ["condensazione", 3, 3, "Condensazione", "Condensation", "Non consuma l'azione (una per turno): il prossimo incantesimo di Sangue fa +2 dadi. Con lo Stilo Cremisi è il colpo a piena pressione.", "Does not use your action (once per turn): your next Blood spell deals +2 dice. With the Crimson Stylus it is the full-pressure shot."],
    ["costellazione_rossa", 3, 4, "Costellazione Rossa", "Red Constellation", "Tre sfere di sangue ti girano attorno: all'inizio dei tuoi 3 turni successivi ne esplode una, 1d6 sangue e 1 Ferita.", "Three spheres of blood circle you: at the start of each of your next 3 turns one bursts, 1d6 blood and 1 Wound."],
    ["sangue_velenoso", 3, 3, "Sangue Velenoso", "Poisoned Blood", "Tiro salvezza → Avvelenato 3 (1d4 a inizio del suo turno); se il nemico ha almeno 2 Ferite, 1d6.", "Saving throw → Poisoned 3 (1d4 at the start of its turn); if the enemy has at least 2 Wounds, 1d6."],
    ["sangue_in_piena", 4, 5, "Sangue in Piena", "Blood in Flood", "Per 3 turni +2 a colpire e ai danni con l'arma e con il Sangue; il Coagulo cura metà del colpo invece di un quarto.", "For 3 turns +2 to hit and damage with your weapon and with Blood; Clotting heals half the blow instead of a quarter."],
    ["emorragia", 4, 6, "Emorragia", "Haemorrhage", "Per 3 turni, all'inizio del turno del nemico, 1d4 sangue per ogni Ferita, senza consumarle.", "For 3 turns, at the start of the enemy's turn, 1d4 blood per Wound, without spending them."],
    ["ali_cremisi", 4, 5, "Ali Cremisi", "Crimson Wings", "Consuma l'azione; fino al tuo turno ogni colpo che subisci fa metà danni e incide 1 Ferita su chi ti colpisce.", "Uses your action; until your turn every blow you take deals half damage and carves 1 Wound on the attacker."],
    ["cuore_spezzato", 5, 8, "Cuore Spezzato", "Broken Heart", "Consuma tutte le Ferite (almeno 1): 2d8 sangue per Ferita, senza tiro; ti curi della metà del danno.", "Spends all Wounds (at least 1): 2d8 blood per Wound, no roll; you heal half the damage."],
    ["vincolo_sangue", 5, 8, "Vincolo di Sangue", "Blood Bond", "Tiro salvezza → per 3 turni il nemico subisce metà del danno che subisci tu.", "Saving throw → for 3 turns the enemy takes half the damage you take."],
    ["marea_cremisi", 5, 9, "Marea Cremisi", "Crimson Tide", "Una volta per riposo. Senza tiro, 4d8 sangue; Ferite al massimo.", "Once per rest. No roll, 4d8 blood; Wounds to maximum."]
  ].map(voce("sangue"));

  const ILLUSIONE = [
    ["riflessi", 1, 1, "Riflessi", "Reflections", "Crei 2 Copie di te (al massimo 3).", "You create 2 Copies of yourself (at most 3)."],
    ["dardo_fantasma", 1, 1, "Dardo Fantasma", "Phantom Bolt", "Attacco magico, 1d8 psichico; se colpisce, +1 Copia.", "Spell attack, 1d8 psychic; on a hit, +1 Copy."],
    ["colpo_fortuna", 1, 1, "Colpo di Fortuna", "Stroke of Luck", "Il tuo prossimo attacco magico tira due d20 e tiene il migliore; se è critico, crei 1 Copia.", "Your next spell attack rolls two d20 and keeps the better; on a critical, you create 1 Copy."],
    ["passo_sfasato", 2, 2, "Passo Sfasato", "Phase Step", "Consuma l'azione; il prossimo colpo che ti andrebbe a segno ti manca e crei 1 Copia.", "Uses your action; the next blow that would hit you misses and you create 1 Copy."],
    ["frantumare", 2, 3, "Frantumare", "Shatter", "Consuma le Copie (almeno 1): 1d8 psichico per Copia, senza tiro, e recuperi 1 mana per Copia; con 3 Copie anche Frastornato 1 (avversari temibili: Sbilanciato 1).", "Spends your Copies (at least 1): 1d8 psychic per Copy, no roll, and you recover 1 mana per Copy; with 3 Copies also Dazed 1 (fearsome foes: Off-balance 1)."],
    ["miraggio", 2, 3, "Miraggio", "Mirage", "Senza tiro, 1d8 psichico per ogni Copia, senza consumarle (serve almeno 1 Copia).", "No roll, 1d8 psychic per Copy, without spending them (needs at least 1 Copy)."],
    ["dado_truccato", 3, 3, "Dado Truccato", "Loaded Die", "Per 3 turni il nemico tira due d20 per colpirti e tiene il peggiore (avversari temibili: 2 turni).", "For 3 turns the enemy rolls two d20 to hit you and keeps the worse (fearsome foes: 2 turns)."],
    ["scambio", 3, 3, "Scambio", "Swap", "Ti scambi con una Copia, che svanisce: ti liberi dalla Presa e il nemico perde l'attacco speciale pronto.", "You swap places with a Copy, which vanishes: you break free of a Grab and the enemy loses its readied special attack."],
    ["specchio_rotto", 3, 4, "Specchio Rotto", "Broken Mirror", "La prossima Copia distrutta rimanda al nemico il danno che avrebbe fatto a te (metà sugli avversari temibili).", "The next destroyed Copy sends back to the enemy the damage it would have dealt you (half against fearsome foes)."],
    ["terrore_illusorio", 4, 5, "Terrore Illusorio", "Illusory Terror", "Senza tiro, 2d8 psichico; tiro salvezza → Impaurito 2 (se resiste, metà danni).", "No roll, 2d8 psychic; saving throw → Frightened 2 (half damage if it resists)."],
    ["labirinto", 4, 6, "Labirinto", "Labyrinth", "Tiro salvezza → Stordito 1 (avversari temibili: Sbilanciato 2 e −2 a smascherare le Copie per 2 turni); crei 1 Copia.", "Saving throw → Stunned 1 (fearsome foes: Off-balance 2 and −2 to see through Copies for 2 turns); you create 1 Copy."],
    ["destino_segnato", 4, 5, "Destino Segnato", "Marked Fate", "Per 3 turni i tuoi attacchi magici fanno critico con 18-20; ogni critico crea 1 Copia.", "For 3 turns your spell attacks crit on 18-20; every critical creates 1 Copy."],
    ["teatro_specchi", 5, 8, "Teatro di Specchi", "Theatre of Mirrors", "Copie al massimo; per 3 turni ogni Copia distrutta esplode con 1d6 psichico su chi l'ha colpita.", "Copies to maximum; for 3 turns every destroyed Copy bursts for 1d6 psychic on whoever struck it."],
    ["incubo", 5, 8, "Incubo", "Nightmare", "Senza tiro, 3d8 psichico, +1d8 per ogni Copia senza consumarle; tiro salvezza → Impaurito 2.", "No roll, 3d8 psychic, +1d8 per Copy without spending them; saving throw → Frightened 2."],
    ["grande_inganno", 5, 9, "Il Grande Inganno", "The Great Deceit", "Una volta per riposo. Consuma tutte le Copie (almeno 1): 2d10 psichico per Copia, senza tiro, e recuperi 1 mana per Copia; per 2 turni il nemico tira due d20 per colpirti e tiene il peggiore.", "Once per rest. Spends all Copies (at least 1): 2d10 psychic per Copy, no roll, and you recover 1 mana per Copy; for 2 turns the enemy rolls two d20 to hit you and keeps the worse."]
  ].map(voce("illusione"));

  const LUCE = [
    ["dardo_luce", 1, 2, "Dardo Vitale", "Life Bolt", "Attacco magico, 1d8 vitale; sul critico un bagliore di vita lo acceca (Accecato 2).", "Spell attack, 1d8 life; on a critical a flare of life blinds it (Blinded 2)."],
    ["tocco_lenitivo", 1, 2, "Tocco Lenitivo", "Soothing Touch", "Cura 1d8 + mod. Spirito.", "Heals 1d8 + Spirit mod."],
    ["scudo_fede", 1, 1, "Scudo della Fede", "Shield of Faith", "+2 alla Classe armatura per 3 turni.", "+2 Armor class for 3 turns."],
    ["accecare", 2, 3, "Bagliore Vitale", "Life Flare", "Un bagliore di vita troppo intenso: tiro salvezza → Accecato 2.", "A flare of life too bright to bear: saving throw → Blinded 2."],
    ["folgore_sacra", 2, 4, "Impeto Vitale", "Life Surge", "Attacco magico, 2d6 vitale; tiro salvezza → Frastornato 1 (avversari temibili: +1d6).", "Spell attack, 2d6 life; saving throw → Dazed 1 (fearsome foes: +1d6)."],
    ["voto_luce", 2, 3, "Voto di Vita", "Vow of Life", "Per 3 turni ogni colpo d'arma a segno fa +1d4 vitale e sei in Rigenerazione (cura 1d4 all'inizio del tuo turno).", "For 3 turns every weapon hit deals +1d4 life and you are Regenerating (heal 1d4 at the start of your turn)."],
    ["raggio_mattino", 3, 5, "Flusso di Vita", "Life Stream", "Senza tiro, 2d8 vitale; con il tiro salvezza il nemico ne subisce metà.", "No roll, 2d8 life; on a saving throw the enemy takes half."],
    ["santuario", 3, 5, "Santuario", "Sanctuary", "Consuma l'azione; per 2 turni il primo colpo di ogni turno fa metà danni; alla fine cura 1d6.", "Uses your action; for 2 turns the first blow each turn deals half damage; at the end heals 1d6."],
    ["purificazione", 3, 4, "Purificazione", "Purification", "Ti libera dalla Presa e dalle bruciature, cura 1d6.", "Frees you from a Grab and from burns, heals 1d6."],
    ["lancia_sole", 4, 7, "Lancia della Vita", "Spear of Life", "Attacco magico, 3d8 vitale; se colpisce, tiro salvezza → Accecato 2.", "Spell attack, 3d8 life; on a hit, saving throw → Blinded 2."],
    ["corona_raggi", 4, 6, "Aura Vitale", "Vital Aura", "Per 3 turni 1d6 vitale al nemico all'inizio del suo turno; se ti colpisce, Accecato 2.", "For 3 turns 1d6 life to the enemy at the start of its turn; if it hits you, Blinded 2."],
    ["grazia", 4, 6, "Grazia", "Grace", "Cura 1d8 + mod. Spirito, poi Rigenerazione per 3 turni (1d4 all'inizio del tuo turno), e +2 alla Classe armatura per 2 turni.", "Heals 1d8 + Spirit mod., then Regeneration for 3 turns (1d4 at the start of your turn), and +2 Armor class for 2 turns."],
    ["alba_eterna", 5, 9, "Primavera Eterna", "Eternal Spring", "Una volta per riposo. Senza tiro, 4d8 vitale e Accecato 2; ti curi della metà dei danni.", "Once per rest. No roll, 4d8 life and Blinded 2; you heal half the damage."],
    ["seconda_vita", 5, 8, "Seconda Vita", "Second Life", "Una volta per scontro, si lancia prima: il primo colpo che ti porterebbe a 0 ti lascia a 1 e ti cura 2d6.", "Once per fight, cast in advance: the first blow that would drop you to 0 leaves you at 1 and heals 2d6."],
    ["giudizio", 5, 9, "Giudizio", "Judgement", "Attacco magico, 2d10 vitale, +1d10 per ogni punto di Vita sulla Bilancia; poi la Bilancia torna a 0.", "Spell attack, 2d10 life, +1d10 per point of Life on the Balance; then the Balance returns to 0."]
  ].map(voce("luce"));

  const OMBRA = [
    ["tocco_avvizzente", 1, 2, "Tocco Avvizzente", "Withering Touch", "Attacco magico, 1d6 necrotico; ti curi della metà dei danni.", "Spell attack, 1d6 necrotic; you heal half the damage."],
    ["sussurro_paura", 1, 2, "Sussurri dei Morti", "Whispers of the Dead", "Gli spiriti gli sussurrano all'orecchio: tiro salvezza → Inibito per 1 turno (avversari temibili: Indebolito 2).", "Saving throw → Inhibited for 1 turn (fearsome foes: Weakened 2)."],
    ["manto_ombra", 1, 1, "Velo degli Spiriti", "Veil of Spirits", "Uno spirito si frappone: il prossimo attacco del nemico tira 2d20 e tiene il peggiore. Fuori dallo scontro: +2 a Furtività per una stanza, uno spirito ti precede.", "A spirit steps between you: the enemy's next attack rolls 2d20 and keeps the worse. Outside combat: +2 Stealth for one room, a spirit goes ahead of you."],
    ["avvizzire", 2, 3, "Avvizzire", "Wither", "Tiro salvezza → Avvizzito 3.", "Saving throw → Withered 3."],
    ["sete_tenebra", 2, 4, "Sete del Sepolcro", "Thirst of the Grave", "Attacco magico, 2d6 necrotico; se colpisce, recuperi 1 punto fede.", "Spell attack, 2d6 necrotic; on a hit, you recover 1 faith point."],
    ["catene_ombra", 2, 4, "Mani dalla Terra", "Hands from the Earth", "Mani di morti lo afferrano: tiro salvezza → Stordito 1 (avversari temibili: Sbilanciato 2).", "Dead hands grip it: saving throw → Stunned 1 (fearsome foes: Off-balance 2)."],
    ["divorare", 3, 6, "Divorare", "Devour", "Attacco magico, 2d8 necrotico; se il nemico è Avvizzito, consuma l'Avvizzito: infligge subito tutti i danni rimasti e te ne cura altrettanti.", "Spell attack, 2d8 necrotic; if the enemy is Withered, consumes it: deals all remaining damage at once and heals you as much."],
    ["patto_ombra", 3, 4, "Patto col Defunto", "Pact with the Dead", "Perdi 1d4 salute fisica, recuperi 1d4 + livello punti fede.", "You lose 1d4 physical health, recover 1d4 + level faith points."],
    ["eclisse", 3, 5, "Coro dei Morti", "Choir of the Dead", "Gli spiriti gli sciamano davanti agli occhi: tiro salvezza → Accecato 2 e Indebolito 2. Costa 1 punto di salute mentale, anche fuori da Nadir.", "The spirits swarm before its eyes: saving throw → Blinded 2 and Weakened 2. Costs 1 point of mental health, even outside Nadir."],
    ["ombra_gemella", 4, 7, "Spirito Servitore", "Servant Spirit", "Per 3 turni uno spirito evocato colpisce da solo all'inizio del tuo turno: 1d6 necrotico, senza tiro.", "For 3 turns a summoned spirit strikes on its own at the start of your turn: 1d6 necrotic, no roll."],
    ["terrore", 4, 6, "Terrore", "Terror", "Tiro salvezza → Frastornato 2 (avversari temibili: Indebolito 2 e −2 ai tiri salvezza).", "Saving throw → Dazed 2 (fearsome foes: Weakened 2 and −2 to saving throws)."],
    ["mietitura", 4, 7, "Mietitura", "Reaping", "Senza tiro, 3d6 necrotico; se il nemico scende sotto metà salute, recuperi 2 punti fede.", "No roll, 3d6 necrotic; if the enemy drops below half health, you recover 2 faith points."],
    ["notte_senza_fine", 5, 9, "Notte dei Morti", "Night of the Dead", "Una volta per riposo. Per 3 turni il nemico è Accecato e Avvizzito (1d6) e gli incantesimi di Negromanzia costano 2 in meno. Costa 1d4 punti di salute mentale (non letale).", "Once per rest. For 3 turns the enemy is Blinded and Withered (1d6) and Necromancy spells cost 2 less. Costs 1d4 points of mental health (never lethal)."],
    ["nome_taciuto", 5, 8, "Nome Taciuto", "Unspoken Name", "Tiro salvezza → Stordito 2 (avversari temibili: Indebolito e Sbilanciato 2).", "Saving throw → Stunned 2 (fearsome foes: Weakened and Off-balance 2)."],
    ["abbraccio_vuoto", 5, 9, "Abbraccio della Tomba", "Embrace of the Grave", "Attacco magico, 4d8 necrotico; ti curi di tutti i danni inflitti. La Bilancia va a Negromanzia 3.", "Spell attack, 4d8 necrotic; you heal all the damage dealt. The Balance goes to Necromancy 3."]
  ].map(voce("ombra"));

  /* vie di prestigio: Arcanista Vena (aldo, Sangue) / Velo (guendalina, Illusione), Monaco Cenere (aldo) / Brace (guendalina) */
  const VIE = [
    ...[["fiume_rosso", 3, 3, "Fiume Rosso", "Red River", "2 Ferite senza tiro.", "2 Wounds with no roll."],
        ["sete", 4, 5, "Sete", "Thirst", "Per tutto lo scontro ogni Detonazione di Sangue (Ebollizione, Cuore Spezzato, Ultima Goccia) ti cura anche 1d4.", "For the whole fight every Blood Detonation (Boiling Blood, Broken Heart, Last Drop) also heals you 1d4."],
        ["ultima_goccia", 5, 9, "Ultima Goccia", "Last Drop", "Una volta per riposo. Consuma tutte le Ferite (almeno 1): 3d10 sangue per Ferita, senza tiro.", "Once per rest. Spends all Wounds (at least 1): 3d10 blood per Wound, no roll."]
      ].map(voce("sangue", "aldo")),
    ...[["il_doppio", 3, 3, "Il Doppio", "The Double", "Per 3 turni, se hai almeno 2 Copie, ogni tuo attacco magico a segno fa +1d6 psichico.", "For 3 turns, if you have at least 2 Copies, every spell attack that hits deals +1d6 psychic."],
        ["sala_specchi", 4, 5, "Sala degli Specchi", "Hall of Mirrors", "Crei 1 Copia. Per tutto lo scontro il nemico ha −1 per colpirti per ogni Copia che hai.", "You create 1 Copy. For the whole fight the enemy has −1 to hit you for every Copy you have."],
        ["nessuno_qui", 5, 9, "Nessuno è Qui", "No One Is Here", "Una volta per riposo. Per 2 turni nessun colpo ti raggiunge (il Soffio sì); Copie al massimo.", "Once per rest. For 2 turns no blow reaches you (the Breath does); Copies to maximum."]
      ].map(voce("illusione", "guendalina")),
    ...[["rancore", 3, 5, "Rancore", "Grudge", "Attacco magico, 2d6 necrotico, +1d6 per ogni colpo subito in questo scontro (massimo 3).", "Spell attack, 2d6 necrotic, +1d6 per blow taken this fight (maximum 3)."],
        ["lutto", 4, 7, "Lutto", "Mourning", "Tiro salvezza → Avvizzito 3 (1d6) e Indebolito 2. Per tutto lo scontro Nadir non ti costa salute mentale.", "Saving throw → Withered 3 (1d6) and Weakened 2. For the whole fight Nadir costs you no mental health."],
        ["furia_cinerea", 5, 9, "Furia Cinerea", "Ashen Fury", "Per 3 turni gli incantesimi di Negromanzia hanno +1 dado e ti curano della metà dei danni; la Bilancia resta bloccata a Negromanzia 3.", "For 3 turns Necromancy spells have +1 die and heal you half the damage; the Balance stays locked at Necromancy 3."]
      ].map(voce("ombra", "aldo")),
    ...[["fiamma_calda", 3, 5, "Fiamma Calda", "Warm Flame", "Cura 2d6 + mod. Spirito; per 2 turni chi ti colpisce subisce 1d4 fuoco sacro.", "Heals 2d6 + Spirit mod.; for 2 turns whoever hits you takes 1d4 holy fire."],
        ["cerchio_focolare", 4, 7, "Cerchio del Focolare", "Hearth Circle", "Per 3 turni +2 alla Classe armatura, +2 ai tiri salvezza, e il soffio infuocato ti fa metà danni.", "For 3 turns +2 Armor class, +2 to saving throws, and fiery breath deals you half damage."],
        ["fuoco_cura", 5, 9, "Fuoco che Cura", "Healing Fire", "Cura 4d8 + mod. Spirito; la cura oltre la salute massima diventa danno vitale al nemico.", "Heals 4d8 + Spirit mod.; healing beyond your maximum health becomes life damage to the enemy."]
      ].map(voce("luce", "guendalina"))
  ];

  const CLASSI = { Sapiente: ["sangue", "illusione"], Accolito: ["luce", "ombra"] };
  const NOMI_SCUOLE = { sangue: { it: "Sangue", en: "Blood" }, illusione: { it: "Illusione", en: "Illusion" }, luce: { it: "Vita", en: "Life" }, ombra: { it: "Negromanzia", en: "Necromancy" } /* 03/11: id invariati (salvataggi, vulnerabilità), nomi nuovi */ };
  const NOMI_VIE = { Sapiente: { aldo: { it: "Vena", en: "Vein" }, guendalina: { it: "Velo", en: "Veil" } },
                     Accolito: { aldo: { it: "Cenere", en: "Ash" }, guendalina: { it: "Brace", en: "Ember" } } };
  /* capacità di classe fuori dai posti */
  const CAPACITA = {
    Sapiente: { id: "luce", costo: 1, nome: { it: "Lume Arcano", en: "Arcane Glow" }, effetto: { it: "Una sfera di luce fredda ti segue e illumina il buio, al posto della torcia.", en: "A sphere of cold light follows you and lights the dark, instead of a torch." } },
    Accolito: { id: "luce", costo: 1, nome: { it: "Luce", en: "Light" }, effetto: { it: "Un orbe di luce sacra ti segue e illumina il buio, al posto della torcia.", en: "An orb of holy light follows you and lights the dark, instead of a torch." } }
  };

  root.MAGIA = Object.freeze({
    INCANTESIMI: [...SANGUE, ...ILLUSIONE, ...LUCE, ...OMBRA], VIE, CLASSI, NOMI_SCUOLE, NOMI_VIE, CAPACITA,
    SIGILLI_MAX: 3, SIGILLI_MAX_BOSS: 2, COPIE_MAX: 3, /* le Ferite usano i massimi dei vecchi Sigilli */ BILANCIA_MAX: 3, POSTI_ALTRA_SCUOLA: 1
  });
})(typeof window !== "undefined" ? window : globalThis);
