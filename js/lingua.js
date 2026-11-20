/* ---------- Lingua del gioco ----------
   Scelta nella pagina iniziale e salvata nel browser ("lingua": "it" oppure "en").
   Le chiavi interne (razze, classi, attributi, abilità, oggetti) restano in italiano:
   sono quelle salvate nel personaggio. Qui c'è il nome da mostrare in inglese
   e le descrizioni degli oggetti usate sia nella creazione sia nel gioco. */
(function () {
  let corrente = "it";
  try { if (localStorage.getItem("lingua") === "en") corrente = "en"; } catch (e) {}
  document.documentElement.lang = corrente;

  const EN = {
    razze: { Umano: "Human", Elfo: "Elf", Nano: "Dwarf", Gnomo: "Gnome" },
    classi: { Soldato: "Warrior", Forestiero: "Shaman", Sapiente: "Arcanist", Accolito: "Monk" },
    attributi: { Vigore: "Vigour", "Agilità": "Agility", Mente: "Mind", Spirito: "Spirit", Lotta: "Vigour", Corpo: "Vigour", Carisma: "Spirit" },
    abilita: {
      Atletica: "Athletics", Sopravvivenza: "Survival", "Furtività": "Stealth", Acrobazia: "Acrobatics",
      Indagare: "Investigation", Percezione: "Perception", Investigazione: "Investigation and Perception", Sapienza: "Lore", "Socialità": "Influence", Intuizione: "Insight",
      /* nomi delle abilità accorpate (personaggi e prove scritti prima della revisione) */
      Medicina: "Lore", Arcano: "Lore", Misticismo: "Lore", Persuasione: "Influence", Intimidire: "Influence"
    },
    danni: { Tagliente: "Slashing", Contundente: "Bludgeoning", Perforante: "Piercing" },
    oggetti: {
      "Spada corta": "Shortsword", "Ascia da battaglia": "Battleaxe", Bastone: "Quarterstaff",
      "Martello da battaglia": "Warhammer", "Mazza chiodata": "Morningstar", "Piccone da battaglia": "War pick",
      Spada: "Sword", Spadone: "Greatsword", "Mazza ferrata": "Flanged mace", Maglio: "Maul", Pugnale: "Dagger", Tridente: "Trident",
      "Retaggio del Padrone": "The Master's Legacy",
      "Armatura leggera": "Light armor", "Armatura media": "Medium armor", "Armatura pesante": "Heavy armor",
      Scudo: "Shield",
      "Pozione di cura": "Healing potion", "Pozione di essenza": "Essence potion", "Pozione di mana": "Essence potion", "Razioni da viaggio": "Travel rations",
      Torcia: "Torch", "Piede di porco": "Crowbar", "Ampolla di fuoco": "Fire flask", "Corda e rampino": "Rope and grappling hook", "Borsa dei veleni": "Poison pouch",
      "Foglietto di Adele": "Adele's note",
      /* 17/11: dotazione fissa; 19/11: focus a due forme */
      Corda: "Rope", Lente: "Magnifying glass", Gesso: "Chalk", "Quaderno e carboncino": "Notebook and charcoal",
      "Asse del mondo": "Axis of the World", "Scudo Feticcio": "Fetish Shield", "Libro arcano": "Arcane Tome", "Brocchiere Runico": "Runic Buckler",
      Filatterio: "Phylactery", "Aegis Divina": "Divine Aegis",
      /* bottino degli agguati (29/10) */
      "Ascia da battaglia di Mezzaluna": "Mezzaluna's Battleaxe", "Scudo di Vallerossa": "Vallerossa's Shield", "Pugnale della Biscia": "The Viper's Dagger", "Bastone di Anselmo": "Anselmo's Quarterstaff"
    }
  };

  /* Nomi italiani da mostrare quando sono diversi dalla chiave interna.
     Le classi sono state rinominate, ma la chiave resta quella vecchia: è salvata nei personaggi già creati
     e nei nomi dei file dei ritratti (immagini/pg/Razza_Classe_N.webp). */
  const IT = {
    classi: { Soldato: "Guerriero", Forestiero: "Sciamano", Sapiente: "Arcanista", Accolito: "Monaco" },
    /* attributi e abilità accorpati: le vecchie chiavi si mostrano con il nome nuovo */
    attributi: { Lotta: "Vigore", Corpo: "Vigore", Carisma: "Spirito" },
    abilita: { Investigazione: "Indagare e Percezione", Medicina: "Sapienza", Arcano: "Sapienza", Misticismo: "Sapienza", Persuasione: "Socialità", Intimidire: "Socialità" }
  };

  /* Descrizioni di dotazione e scudo */
  const DESC = {
    "Scudo di Vallerossa": {
      it: "Lo scudo di Corrado, ammaccato da cento parate, con lo stemma della sua vecchia compagnia raschiato via.",
      en: "Corrado's shield, dented by a hundred parries, the crest of his old company scraped away."
    },
    "Pozione di cura": {
      it: "Quando un personaggio beve il fluido magico rossastro contenuto in questa fiala, recupera 1d6 + il livello del personaggio in salute fisica.",
      en: "When a character drinks the reddish magical fluid in this vial, they recover 1d6 + the character's level in physical health."
    },
    "Pozione di essenza": {
      it: "Quando un personaggio beve il fluido magico violaceo contenuto in questa fiala, recupera 1d6 + il livello del personaggio in {risorsa}.",
      en: "When a character drinks the violet magical fluid in this vial, they recover 1d6 + the character's level in {risorsa}."
    },
    "Razioni da viaggio": {
      it: "Non sai se troverai da mangiare dove stai andando: queste razioni ti terranno in vita per qualche giorno, anche se fanno schifo. Recupera 1 punto salute + il livello del personaggio. Si può utilizzare una razione a turno.",
      en: "You don't know whether you'll find food where you're going: these rations will keep you alive for a few days, even if they taste awful. Recover 1 health point + the character's level. You can use one ration per turn."
    },
    Torcia: {
      it: "Un massiccio tizzone di legno avvolto da panno imbevuto di pece e resina ancora vischiosa. Un oggetto fondamentale da tenere stretto... a meno che tu non pretenda di orientarti nei sotterranei affidandoti unicamente ai respiri affannosi di ciò che ti attende nell'oscurità.",
      en: "A heavy wooden brand wrapped in cloth soaked in pitch and still-sticky resin. An essential thing to keep close... unless you expect to find your way through the depths guided only by the ragged breathing of whatever awaits you in the dark."
    },
    "Piede di porco": { /* 17/11: dotazione fissa, +2 solo nelle prove dei luoghi */
      it: "Una sbarra di ferro piegata a una punta. Dove si può fare leva dà +2 alla prova di Atletica, e forzare un coperchio non ti costa più le dita. Non si usa in combattimento.",
      en: "An iron bar bent at one end. Where you can get leverage it gives +2 to the Athletics check, and prying a lid no longer costs you your fingers. Not usable in combat."
    },
    Corda: {
      it: "Diversi metri di canapa robusta. Su travi, cornicioni e dislivelli dà +2 alle prove di Acrobazia e di Atletica. Non si usa in combattimento.",
      en: "Several metres of sturdy hemp. On beams, ledges and drops it gives +2 to Acrobatics and Athletics checks. Not usable in combat."
    },
    Lente: {
      it: "Una lente d'ingrandimento cerchiata d'ottone. Quando cerchi qualcosa di nascosto dà +2 alle prove di Indagare e di Percezione.",
      en: "A brass-rimmed magnifying glass. When you look for something hidden it gives +2 to Investigation and Perception checks."
    },
    Gesso: {
      it: "Tre pezzi di gesso per segnare porte, muri e tentativi. In un enigma a scelta, il primo errore non ti costa punti mentali (un pezzo per enigma).",
      en: "Three sticks of chalk to mark doors, walls and attempts. In a multiple-choice riddle your first mistake costs no mental points (one stick per riddle)."
    },
    "Quaderno e carboncino": {
      it: "Un quaderno con due fogli puliti e un pezzo di carboncino. Prendere appunti ti concede un tentativo in più a una prova di Sapienza (un foglio per tentativo).",
      en: "A notebook with two clean pages and a stick of charcoal. Taking notes grants you one more attempt at a Lore check (one page per attempt)."
    },
    /* focus degli incantatori (17/11 e 19/11): un oggetto, due forme */
    "Asse del mondo": {
      it: "Un bastoncino di frassino intagliato a nodi, che lo sciamano tiene come un asse tra la terra e gli spiriti. Forma normale del focus: una mano, 1d8.",
      en: "A short ash rod carved with knots, which the shaman holds like an axis between the earth and the spirits. Normal form of the focus: one hand, 1d8."
    },
    "Scudo Feticcio": {
      it: "Uno scudo ricoperto di ossa, teschi di piccoli animali, erbe essiccate e amuleti legati insieme per creare una barriera spirituale. Forma scudo del focus: 1d6, +1 CA.",
      en: "A shield covered in bones, small animal skulls, dried herbs and amulets bound together into a spiritual barrier. Shield form of the focus: 1d6, +1 AC."
    },
    "Libro arcano": {
      it: "Un tomo rilegato in cuoio scuro, fitto di formule e di diagrammi. Forma normale del focus: una mano, 1d8.",
      en: "A tome bound in dark leather, dense with formulae and diagrams. Normal form of the focus: one hand, 1d8."
    },
    "Brocchiere Runico": {
      it: "Un piccolo scudo leggero inciso con rune di protezione e di interdizione. Forma scudo del focus: 1d6, +1 CA.",
      en: "A small, light shield engraved with runes of protection and warding. Shield form of the focus: 1d6, +1 AC."
    },
    Filatterio: {
      it: "Una piccola teca di cuoio con un frammento di pergamena sacra, legata al braccio. Forma normale del focus: una mano, 1d8.",
      en: "A small leather case holding a scrap of sacred parchment, bound to the arm. Normal form of the focus: one hand, 1d8."
    },
    "Aegis Divina": {
      it: "Uno scudo che custodisce una reliquia sacra protetta da una griglia di ferro. Forma scudo del focus: 1d6, +1 CA.",
      en: "A shield that keeps a holy relic behind an iron grille. Shield form of the focus: 1d6, +1 AC."
    },
    "Ampolla di fuoco": {
      it: "Questo fluido giallognolo ed aranciato si infiamma quando è esposto all'aria. Il personaggio può lanciare questa ampolla causando al bersaglio, se lo colpisce, 1d4 danni da fuoco.",
      en: "This yellowish-orange fluid ignites when exposed to air. The character can throw this flask, dealing 1d4 fire damage to the target if it hits."
    },
    "Corda e rampino": { /* PROVVISORIO */
      it: "Un rampino d'acciaio legato a diversi metri di robusta corda: utile per scalare muri, superare dislivelli e raggiungere luoghi altrimenti inaccessibili.",
      en: "A steel grappling hook tied to several metres of sturdy rope: useful for climbing walls, crossing drops and reaching places otherwise out of reach."
    },
    "Borsa dei veleni": {
      it: "Una borsa di cuoio scuro piena di fiale, radici essiccate e spore in polvere: solo uno Sciamano sa dosarle. Tre dosi: ognuna fa recuperare 1d4 + il livello del personaggio in punti natura (una a turno). Vuota, si riempie con gli ingredienti giusti, che si trovano nella foresta.",
      en: "A dark leather pouch full of vials, dried roots and powdered spores: only a Shaman knows how to measure them. Three doses: each restores 1d4 + the character's level in nature points (one per turn). When empty, it is refilled with the right ingredients, found in the forest."
    },
    Scudo: { /* PROVVISORIO */
      it: "Uno scudo di legno robusto, cerchiato di ferro: devia i colpi, ma il suo peso rende i movimenti meno agili. Occupa una mano.",
      en: "A sturdy wooden shield rimmed with iron: it turns aside blows, but its weight makes you less nimble. It takes up one hand."
    }
  };

  DESC["Pozione di mana"] = DESC["Pozione di essenza"]; /* vecchio nome nei salvataggi esistenti */

  /* Risorsa di ogni classe (i nomi interni delle classi restano quelli vecchi). Serve alle descrizioni che dipendono dalla classe:
     pozione di essenza, olio della falena. Le pagine registrano con setRisorsa() una funzione che dice quale classe è in uso. */
  const RISORSE = {
    Soldato: { it: "punti furia", en: "fury points" }, Forestiero: { it: "punti natura", en: "nature points" },
    Sapiente: { it: "punti arcano", en: "arcane points" }, Accolito: { it: "punti fede", en: "faith points" }
  };
  let classeFn = () => null;
  const risorsaDi = (classe) => (RISORSE[classe] ? RISORSE[classe][corrente] : null);
  const FALLBACK_RIS = { it: "punti furia, natura, arcano o fede (secondo la tua classe)", en: "fury, nature, arcane or faith points (depending on your class)" };
  const conRisorsa = (t) => (typeof t === "string" ? t.replace(/\{risorsa\}/g, risorsaDi(classeFn()) || FALLBACK_RIS[corrente]) : t);

  window.Lingua = {
    get: () => corrente,
    set(l) {
      corrente = l === "en" ? "en" : "it";
      try { localStorage.setItem("lingua", corrente); } catch (e) {}
      document.documentElement.lang = corrente;
    },
    /* nome da mostrare: in inglese se esiste la traduzione, altrimenti la chiave italiana */
    nome: (cat, k) => (corrente === "en" && EN[cat] && EN[cat][k]) || (IT[cat] && IT[cat][k]) || k,
    /* tutti i nomi di una chiave nelle due lingue (per riconoscere ciò che scrive il giocatore) */
    nomi: (k) => [k, ...[...Object.values(IT), ...Object.values(EN)].map(c => c[k]).filter(Boolean)],
    desc: (k) => (DESC[k] ? conRisorsa(DESC[k][corrente] || DESC[k].it) : null),
    risorsaClasse: risorsaDi,                       /* «punti arcano» per la classe Sapiente, ecc. */
    setRisorsa(fn) { classeFn = typeof fn === "function" ? fn : () => null; },
    conRisorsa,                                     /* sostituisce {risorsa} in un testo */
    locale: () => (corrente === "en" ? "en-GB" : "it-IT"),
    /* testo bilingue { it, en } → testo nella lingua corrente */
    t: (o) => (o && typeof o === "object" && !Array.isArray(o) && "it" in o) ? (o[corrente] ?? o.it) : o
  };
})();
