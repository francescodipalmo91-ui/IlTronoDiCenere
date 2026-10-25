/* =====================================================================
   MAGIA — scuole dell'Arcanista (Arcano, Forza) e del Monaco (Luce, Ombra), livelli 1-5, con le vie di prestigio.
   Progetto in docs/incantesimi_arcanista_monaco.md (decisioni del 25/10/2026).

   STATO: per ora lo legge solo il regolamento. Creazione e gioco usano ancora js/incantesimi.js:
   quando si implementano gli incantatori, si passa a questo file e si toglie l'avviso «in arrivo» dal regolamento.

   - scuola principale scelta in creazione (come l'arma per il Guerriero); l'altra scuola dà 1 posto in più, di qualsiasi livello
   - posti come le tecniche: Regole.TECNICHE_PER_LIVELLO (2, 2, 1, 1, 1)
   - via: "aldo" | "guendalina" → abilità della via di prestigio (dal livello 3), sempre pronte, non occupano posti
   - costo in mana (Arcanista) o fede (Monaco)
   - formato: [id, livello, costo, nome it, nome en, effetto it, effetto en]
   ===================================================================== */
(function (root) {
  const voce = (scuola, via) => ([id, liv, costo, nIt, nEn, eIt, eEn]) => ({ id, liv, costo, scuola, via, nome: { it: nIt, en: nEn }, effetto: { it: eIt, en: eEn } });

  const ARCANO = [
    ["dardo_arcano", 1, 2, "Dardo Arcano", "Arcane Bolt", "Attacco magico, 1d8 arcano; se colpisce, 1 Sigillo.", "Spell attack, 1d8 arcane; on a hit, 1 Seal."],
    ["scopri_carte", 1, 1, "Scopri Carte", "Reveal Cards", "Apre la scheda del nemico e incide 1 Sigillo senza tiro. Fuori dallo scontro: +2 a Sapienza su rune e oggetti magici.", "Reveals the enemy's sheet and carves 1 Seal with no roll. Outside combat: +2 Lore on runes and magic items."],
    ["runa_arma", 1, 2, "Runa sull'Arma", "Weapon Rune", "Per 3 turni il dado dell'arma sale di un passo (1d6 → 1d8 → 1d10 → 1d12); ogni colpo d'arma a segno incide 1 Sigillo.", "For 3 turns your weapon die goes up one step (1d6 → 1d8 → 1d10 → 1d12); every weapon hit carves 1 Seal."],
    ["marchio_arcano", 2, 3, "Marchio Arcano", "Arcane Brand", "Tiro salvezza → Esposto per 2 turni. 1 Sigillo in ogni caso.", "Saving throw → Exposed for 2 turns. 1 Seal either way."],
    ["stasi", 2, 4, "Stasi", "Stasis", "Tiro salvezza → Stordito per 1 turno (avversari temibili: 2 Sigilli).", "Saving throw → Stunned for 1 turn (fearsome foes: 2 Seals)."],
    ["specchio_rune", 2, 3, "Specchio di Rune", "Rune Mirror", "Consuma l'azione; il primo colpo che subisci fa metà danni e incide 1 Sigillo su chi ti ha colpito.", "Uses your action; the first blow you take deals half damage and carves 1 Seal on the attacker."],
    ["catena_glifi", 3, 5, "Catena di Glifi", "Glyph Chain", "Attacco magico, 2d6 arcano; se colpisce, 2 Sigilli.", "Spell attack, 2d6 arcane; on a hit, 2 Seals."],
    ["sigillo_silenzio", 3, 5, "Sigillo del Silenzio", "Seal of Silence", "Tiro salvezza → senza attacchi speciali per 2 turni (avversari temibili: Indebolito 2). 1 Sigillo.", "Saving throw → no special attacks for 2 turns (fearsome foes: Weakened 2). 1 Seal."],
    ["disfare", 3, 4, "Disfare", "Unravel", "Ti libera dalla Presa e scarica l'attacco speciale pronto del nemico. 1 Sigillo.", "Frees you from a Grab and discharges the enemy's readied special attack. 1 Seal."],
    ["risonanza", 4, 6, "Risonanza", "Resonance", "Attacco magico, 2d8 arcano, +1d8 per ogni Sigillo, senza consumarli.", "Spell attack, 2d8 arcane, +1d8 per Seal, without spending them."],
    ["prigione_rune", 4, 7, "Prigione di Rune", "Rune Prison", "Tiro salvezza → Stordito per 2 turni (avversari temibili: Sbilanciato 2 e 1 Sigillo).", "Saving throw → Stunned for 2 turns (fearsome foes: Off-balance 2 and 1 Seal)."],
    ["occhio_tomo", 4, 6, "Occhio del Tomo", "Eye of the Tome", "Per 3 turni i tuoi attacchi magici fanno critico con 19-20; ogni critico incide 2 Sigilli.", "For 3 turns your spell attacks crit on 19-20; every critical carves 2 Seals."],
    ["parola_vera", 5, 9, "Parola Vera", "True Word", "Una volta per riposo. Senza tiro, 4d8 arcano; per 2 turni il nemico ha −4 ai tiri salvezza.", "Once per rest. No roll, 4d8 arcane; for 2 turns the enemy has −4 to saving throws."],
    ["tomo_proibito", 5, 8, "Tomo Proibito", "Forbidden Tome", "Per 3 turni gli incantesimi d'Arcano costano 2 in meno (minimo 1) e incidono 1 Sigillo in più. Costa 1 punto di salute mentale (non letale).", "For 3 turns Arcane spells cost 2 less (minimum 1) and carve 1 extra Seal. Costs 1 point of mental health (never lethal)."],
    ["sigillo_assoluto", 5, 9, "Sigillo Assoluto", "Absolute Seal", "Sigilli al massimo; tiro salvezza → Stordito per 2 turni (avversari temibili: Indebolito e Sbilanciato 2).", "Seals to maximum; saving throw → Stunned for 2 turns (fearsome foes: Weakened and Off-balance 2)."]
  ].map(voce("arcano"));

  const FORZA = [
    ["pugno_forza", 1, 2, "Pugno di Forza", "Force Fist", "Attacco magico, 1d10 forza. Detonazione.", "Spell attack, 1d10 force. Detonation."],
    ["spinta", 1, 2, "Spinta", "Thrust", "Senza tiro, 1d6 forza; tiro salvezza → Sbilanciato 1. Detonazione.", "No roll, 1d6 force; saving throw → Off-balance 1. Detonation."],
    ["scudo", 1, 1, "Scudo", "Shield", "+2 alla Classe armatura per 2 turni.", "+2 Armor class for 2 turns."],
    ["ariete", 2, 4, "Ariete", "Battering Ram", "Attacco magico, 2d6 forza; se colpisce, Sbilanciato 2. Detonazione.", "Spell attack, 2d6 force; on a hit, Off-balance 2. Detonation."],
    ["onda_urto", 2, 4, "Onda d'Urto", "Shockwave", "Senza tiro, 2d4 forza; tiro salvezza → perde l'attacco speciale pronto. Detonazione.", "No roll, 2d4 force; saving throw → loses its readied special attack. Detonation."],
    ["barriera_cinetica", 2, 3, "Barriera Cinetica", "Kinetic Barrier", "Consuma l'azione; il primo colpo che subisci fa 0 danni e chi ti ha colpito subisce 1d6 forza.", "Uses your action; the first blow you take deals 0 damage and the attacker takes 1d6 force."],
    ["implosione", 3, 6, "Implosione", "Implosion", "Consuma tutti i Sigilli (almeno 1): 2d6 forza per Sigillo, senza tiro. Conta come Detonazione per il recupero.", "Spends all Seals (at least 1): 2d6 force per Seal, no roll. Counts as a Detonation for recovery."],
    ["pressione", 3, 5, "Pressione", "Pressure", "Tiro salvezza → Indebolito 2 e 1d6 forza all'inizio dei suoi 2 turni. Detonazione.", "Saving throw → Weakened 2 and 1d6 force at the start of its next 2 turns. Detonation."],
    ["muro_forza", 3, 5, "Muro di Forza", "Wall of Force", "Per 2 turni +3 alla Classe armatura e la Presa non ti afferra.", "For 2 turns +3 Armor class and Grab cannot hold you."],
    ["maglio_invisibile", 4, 7, "Maglio Invisibile", "Invisible Maul", "Attacco magico, 3d8 forza, critico con 19-20. Detonazione.", "Spell attack, 3d8 force, crits on 19-20. Detonation."],
    ["gravita", 4, 6, "Gravità", "Gravity", "Tiro salvezza → Stordito 1 e Sbilanciato 2 (avversari temibili: Sbilanciato 2 e Indebolito 1).", "Saving throw → Stunned 1 and Off-balance 2 (fearsome foes: Off-balance 2 and Weakened 1)."],
    ["respingere", 4, 7, "Respingere", "Repel", "Consuma l'azione; fino al tuo turno ogni colpo fa 0 danni e restituisce 1d6 forza.", "Uses your action; until your turn every blow deals 0 damage and returns 1d6 force."],
    ["singolarita", 5, 9, "Singolarità", "Singularity", "Una volta per riposo. Consuma tutti i Sigilli: 3d6 forza per Sigillo + mod. Mente, senza tiro. Detonazione sempre doppia.", "Once per rest. Spends all Seals: 3d6 force per Seal + Mind mod., no roll. Always a double Detonation."],
    ["invulnerabilita", 5, 8, "Invulnerabilità", "Invulnerability", "Una volta per riposo. Fino al tuo turno non subisci danni da nulla, soffio compreso.", "Once per rest. Until your turn you take no damage from anything, breath included."],
    ["cataclisma", 5, 9, "Cataclisma Cinetico", "Kinetic Cataclysm", "3 attacchi magici da 1d8 forza; ognuno a segno fa detonare 1 Sigillo (+1d6). I tre colpi contano come una sola Detonazione per il recupero.", "3 spell attacks of 1d8 force; each hit detonates 1 Seal (+1d6). The three blows count as one Detonation for recovery."]
  ].map(voce("forza"));

  const LUCE = [
    ["dardo_luce", 1, 2, "Dardo di Luce", "Bolt of Light", "Attacco magico, 1d8 radiante; sul critico anche Accecato 1.", "Spell attack, 1d8 radiant; on a critical also Blinded 1."],
    ["tocco_lenitivo", 1, 2, "Tocco Lenitivo", "Soothing Touch", "Cura 1d8 + mod. Spirito.", "Heals 1d8 + Spirit mod."],
    ["scudo_fede", 1, 1, "Scudo della Fede", "Shield of Faith", "+2 alla Classe armatura per 2 turni.", "+2 Armor class for 2 turns."],
    ["accecare", 2, 3, "Accecare", "Blind", "Tiro salvezza → Accecato 2.", "Saving throw → Blinded 2."],
    ["folgore_sacra", 2, 4, "Folgore Sacra", "Holy Lightning", "Attacco magico, 2d6 radiante; tiro salvezza → Frastornato 1 (avversari temibili: +1d6).", "Spell attack, 2d6 radiant; saving throw → Dazed 1 (fearsome foes: +1d6)."],
    ["voto_luce", 2, 3, "Voto di Luce", "Vow of Light", "Per 3 turni ogni colpo d'arma a segno fa +1d4 radiante e ti cura 1.", "For 3 turns every weapon hit deals +1d4 radiant and heals you 1."],
    ["raggio_mattino", 3, 5, "Raggio del Mattino", "Morning Ray", "Senza tiro, 2d8 radiante; con il tiro salvezza il nemico ne subisce metà.", "No roll, 2d8 radiant; on a saving throw the enemy takes half."],
    ["santuario", 3, 5, "Santuario", "Sanctuary", "Consuma l'azione; per 2 turni il primo colpo di ogni turno fa metà danni; alla fine cura 1d6.", "Uses your action; for 2 turns the first blow each turn deals half damage; at the end heals 1d6."],
    ["purificazione", 3, 4, "Purificazione", "Purification", "Ti libera dalla Presa e dalle bruciature, cura 1d6.", "Frees you from a Grab and from burns, heals 1d6."],
    ["lancia_sole", 4, 7, "Lancia del Sole", "Sun Spear", "Attacco magico, 3d8 radiante; se colpisce, tiro salvezza → Accecato 2.", "Spell attack, 3d8 radiant; on a hit, saving throw → Blinded 2."],
    ["corona_raggi", 4, 6, "Corona di Raggi", "Crown of Rays", "Per 3 turni 1d6 radiante al nemico all'inizio del suo turno; se ti colpisce, Accecato 1.", "For 3 turns 1d6 radiant to the enemy at the start of its turn; if it hits you, Blinded 1."],
    ["grazia", 4, 6, "Grazia", "Grace", "Cura 2d8 + mod. Spirito e +2 alla Classe armatura per 2 turni.", "Heals 2d8 + Spirit mod. and +2 Armor class for 2 turns."],
    ["alba_eterna", 5, 9, "Alba Eterna", "Eternal Dawn", "Una volta per riposo. Senza tiro, 4d8 radiante e Accecato 2; ti curi della metà dei danni.", "Once per rest. No roll, 4d8 radiant and Blinded 2; you heal half the damage."],
    ["seconda_vita", 5, 8, "Seconda Vita", "Second Life", "Una volta per scontro, si lancia prima: il primo colpo che ti porterebbe a 0 ti lascia a 1 e ti cura 2d6.", "Once per fight, cast in advance: the first blow that would drop you to 0 leaves you at 1 and heals 2d6."],
    ["giudizio", 5, 9, "Giudizio", "Judgement", "Attacco magico, 2d10 radiante, +1d10 per ogni punto di Luce sulla Bilancia; poi la Bilancia torna a 0.", "Spell attack, 2d10 radiant, +1d10 per point of Light on the Balance; then the Balance returns to 0."]
  ].map(voce("luce"));

  const OMBRA = [
    ["tocco_avvizzente", 1, 2, "Tocco Avvizzente", "Withering Touch", "Attacco magico, 1d6 necrotico; ti curi della metà dei danni.", "Spell attack, 1d6 necrotic; you heal half the damage."],
    ["sussurro_paura", 1, 2, "Sussurro della Paura", "Whisper of Fear", "Tiro salvezza → senza attacchi speciali per 1 turno (avversari temibili: Indebolito 1).", "Saving throw → no special attacks for 1 turn (fearsome foes: Weakened 1)."],
    ["manto_ombra", 1, 1, "Manto d'Ombra", "Cloak of Shadow", "Il prossimo attacco del nemico tira 2d20 e tiene il peggiore. Fuori dallo scontro: +2 a Furtività per una stanza.", "The enemy's next attack rolls 2d20 and keeps the worse. Outside combat: +2 Stealth for one room."],
    ["avvizzire", 2, 3, "Avvizzire", "Wither", "Tiro salvezza → Avvizzito 3.", "Saving throw → Withered 3."],
    ["sete_tenebra", 2, 4, "Sete di Tenebra", "Thirst of Darkness", "Attacco magico, 2d6 necrotico; se colpisce, recuperi 1 punto fede.", "Spell attack, 2d6 necrotic; on a hit, you recover 1 faith point."],
    ["catene_ombra", 2, 4, "Catene d'Ombra", "Shadow Chains", "Tiro salvezza → Stordito 1 (avversari temibili: Sbilanciato 2).", "Saving throw → Stunned 1 (fearsome foes: Off-balance 2)."],
    ["divorare", 3, 6, "Divorare", "Devour", "Attacco magico, 2d8 necrotico; se il nemico è Avvizzito, consuma l'Avvizzito: infligge subito tutti i danni rimasti e te ne cura altrettanti.", "Spell attack, 2d8 necrotic; if the enemy is Withered, consumes it: deals all remaining damage at once and heals you as much."],
    ["patto_ombra", 3, 4, "Patto d'Ombra", "Shadow Pact", "Perdi 1d4 salute fisica, recuperi 1d4 + livello punti fede.", "You lose 1d4 physical health, recover 1d4 + level faith points."],
    ["eclisse", 3, 5, "Eclisse", "Eclipse", "Tiro salvezza → Accecato 2 e Indebolito 2. Costa 1 punto di salute mentale, anche fuori da Nadir.", "Saving throw → Blinded 2 and Weakened 2. Costs 1 point of mental health, even outside Nadir."],
    ["ombra_gemella", 4, 7, "Ombra Gemella", "Twin Shadow", "Per 3 turni ogni tuo incantesimo a segno fa +1d6 necrotico.", "For 3 turns every spell of yours that hits deals +1d6 necrotic."],
    ["terrore", 4, 6, "Terrore", "Terror", "Tiro salvezza → Frastornato 2 (avversari temibili: Indebolito 2 e −2 ai tiri salvezza).", "Saving throw → Dazed 2 (fearsome foes: Weakened 2 and −2 to saving throws)."],
    ["mietitura", 4, 7, "Mietitura", "Reaping", "Senza tiro, 3d6 necrotico; se il nemico scende sotto metà salute, recuperi 2 punti fede.", "No roll, 3d6 necrotic; if the enemy drops below half health, you recover 2 faith points."],
    ["notte_senza_fine", 5, 9, "Notte Senza Fine", "Endless Night", "Una volta per riposo. Per 3 turni il nemico è Accecato e Avvizzito (1d6) e gli incantesimi d'Ombra costano 2 in meno. Costa 1d4 punti di salute mentale (non letale).", "Once per rest. For 3 turns the enemy is Blinded and Withered (1d6) and Shadow spells cost 2 less. Costs 1d4 points of mental health (never lethal)."],
    ["nome_taciuto", 5, 8, "Nome Taciuto", "Unspoken Name", "Tiro salvezza → Stordito 2 (avversari temibili: Indebolito e Sbilanciato 2).", "Saving throw → Stunned 2 (fearsome foes: Weakened and Off-balance 2)."],
    ["abbraccio_vuoto", 5, 9, "Abbraccio del Vuoto", "Embrace of the Void", "Attacco magico, 4d8 necrotico; ti curi di tutti i danni inflitti. La Bilancia va a Ombra 3.", "Spell attack, 4d8 necrotic; you heal all the damage dealt. The Balance goes to Shadow 3."]
  ].map(voce("ombra"));

  /* vie di prestigio: Arcanista Frattura (aldo) / Sutura (guendalina), Monaco Cenere (aldo) / Brace (guendalina) */
  const VIE = [
    ...[["colpo_demolitore", 3, 5, "Colpo Demolitore", "Wrecking Blow", "Attacco magico, 2d8 forza; Detonazione con 1d8 per Sigillo. Per tutto lo scontro ogni tua Detonazione fa anche Sbilanciato 1.", "Spell attack, 2d8 force; Detonation with 1d8 per Seal. For the whole fight every Detonation of yours also causes Off-balance 1."],
        ["spezzare_vincolo", 4, 7, "Spezzare il Vincolo", "Break the Bond", "Tiro salvezza → Indebolito 3 (avversari temibili 2); per tutto lo scontro la sua Classe armatura −2.", "Saving throw → Weakened 3 (fearsome foes 2); for the whole fight its Armor class −2."],
        ["crollo_arcano", 5, 9, "Crollo", "Collapse", "Consuma tutti i Sigilli: 2d10 forza per Sigillo, senza tiro; se il nemico arriva a 0, recuperi il mana speso.", "Spends all Seals: 2d10 force per Seal, no roll; if the enemy drops to 0, you recover the mana spent."]
      ].map(voce("forza", "aldo")),
    ...[["filo_rune", 3, 5, "Filo di Rune", "Thread of Runes", "2 Sigilli senza tiro. Per tutto lo scontro, finché il nemico ha almeno 2 Sigilli, ha −2 per colpirti.", "2 Seals with no roll. For the whole fight, while the enemy has at least 2 Seals, it has −2 to hit you."],
        ["ricamo_rune", 4, 7, "Ricamo di Rune", "Rune Embroidery", "Tiro salvezza → senza attacchi speciali 2 ed Esposto 2 (avversari temibili: Indebolito ed Esposto 2); il prossimo incantesimo costa 2 in meno.", "Saving throw → no special attacks 2 and Exposed 2 (fearsome foes: Weakened and Exposed 2); your next spell costs 2 less."],
        ["quiete_assoluta", 5, 9, "Quiete Assoluta", "Absolute Stillness", "Per 3 turni gli incantesimi d'Arcano non costano mana: ognuno consuma 1 Sigillo al suo posto (senza Sigilli si paga normalmente).", "For 3 turns Arcane spells cost no mana: each spends 1 Seal instead (with no Seals you pay as usual)."]
      ].map(voce("arcano", "guendalina")),
    ...[["rancore", 3, 5, "Rancore", "Grudge", "Attacco magico, 2d6 necrotico, +1d6 per ogni colpo subito in questo scontro (massimo 3).", "Spell attack, 2d6 necrotic, +1d6 per blow taken this fight (maximum 3)."],
        ["lutto", 4, 7, "Lutto", "Mourning", "Tiro salvezza → Avvizzito 3 (1d6) e Indebolito 2. Per tutto lo scontro Nadir non ti costa salute mentale.", "Saving throw → Withered 3 (1d6) and Weakened 2. For the whole fight Nadir costs you no mental health."],
        ["furia_cinerea", 5, 9, "Furia Cinerea", "Ashen Fury", "Per 3 turni gli incantesimi d'Ombra hanno +1 dado e ti curano della metà dei danni; la Bilancia resta bloccata a Ombra 3.", "For 3 turns Shadow spells have +1 die and heal you half the damage; the Balance stays locked at Shadow 3."]
      ].map(voce("ombra", "aldo")),
    ...[["fiamma_calda", 3, 5, "Fiamma Calda", "Warm Flame", "Cura 2d6 + mod. Spirito; per 2 turni chi ti colpisce subisce 1d4 fuoco sacro.", "Heals 2d6 + Spirit mod.; for 2 turns whoever hits you takes 1d4 holy fire."],
        ["cerchio_focolare", 4, 7, "Cerchio del Focolare", "Hearth Circle", "Per 3 turni +2 alla Classe armatura, +2 ai tiri salvezza, e il soffio infuocato ti fa metà danni.", "For 3 turns +2 Armor class, +2 to saving throws, and fiery breath deals you half damage."],
        ["fuoco_cura", 5, 9, "Fuoco che Cura", "Healing Fire", "Cura 4d8 + mod. Spirito; la cura oltre la salute massima diventa danno radiante al nemico.", "Heals 4d8 + Spirit mod.; healing beyond your maximum health becomes radiant damage to the enemy."]
      ].map(voce("luce", "guendalina"))
  ];

  const CLASSI = { Sapiente: ["arcano", "forza"], Accolito: ["luce", "ombra"] };
  const NOMI_SCUOLE = { arcano: { it: "Arcano", en: "Arcane" }, forza: { it: "Forza", en: "Force" }, luce: { it: "Luce", en: "Light" }, ombra: { it: "Ombra", en: "Shadow" } };
  const NOMI_VIE = { Sapiente: { aldo: { it: "Frattura", en: "Fracture" }, guendalina: { it: "Sutura", en: "Suture" } },
                     Accolito: { aldo: { it: "Cenere", en: "Ash" }, guendalina: { it: "Brace", en: "Ember" } } };
  /* capacità di classe fuori dai posti */
  const CAPACITA = {
    Sapiente: { id: "luce", costo: 1, nome: { it: "Lume Arcano", en: "Arcane Glow" }, effetto: { it: "Una sfera di luce fredda ti segue e illumina il buio, al posto della torcia.", en: "A sphere of cold light follows you and lights the dark, instead of a torch." } },
    Accolito: { id: "luce", costo: 1, nome: { it: "Luce", en: "Light" }, effetto: { it: "Un orbe di luce sacra ti segue e illumina il buio, al posto della torcia.", en: "An orb of holy light follows you and lights the dark, instead of a torch." } }
  };

  root.MAGIA = Object.freeze({
    INCANTESIMI: [...ARCANO, ...FORZA, ...LUCE, ...OMBRA], VIE, CLASSI, NOMI_SCUOLE, NOMI_VIE, CAPACITA,
    SIGILLI_MAX: 3, SIGILLI_MAX_BOSS: 2, BILANCIA_MAX: 3, POSTI_ALTRA_SCUOLA: 1
  });
})(typeof window !== "undefined" ? window : globalThis);
