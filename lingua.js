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
    classi: { Soldato: "Soldier", Forestiero: "Outlander", Sapiente: "Sage", Accolito: "Acolyte" },
    attributi: { Lotta: "Might", "Agilità": "Agility", Mente: "Mind", Corpo: "Body", Carisma: "Charisma", Spirito: "Spirit" },
    abilita: {
      "Furtività": "Stealth", Indagare: "Investigation", Medicina: "Medicine", Persuasione: "Persuasion", Intimidire: "Intimidation",
      Percezione: "Perception", Atletica: "Athletics", Acrobazia: "Acrobatics", Arcano: "Arcana", Misticismo: "Mysticism"
    },
    danni: { Tagliente: "Slashing", Contundente: "Bludgeoning", Perforante: "Piercing" },
    oggetti: {
      "Spada corta": "Shortsword", "Ascia da battaglia": "Battleaxe", Bastone: "Quarterstaff",
      "Martello da battaglia": "Warhammer", "Mazza chiodata": "Morningstar", "Piccone da battaglia": "War pick",
      "Retaggio del Padrone": "The Master's Legacy",
      "Armatura leggera": "Light armor", "Armatura media": "Medium armor", "Armatura pesante": "Heavy armor",
      Scudo: "Shield",
      "Pozione di cura": "Healing potion", "Pozione di mana": "Mana potion", "Razioni da viaggio": "Travel rations",
      Torcia: "Torch", "Piede di porco": "Crowbar", "Ampolla di fuoco": "Fire flask", "Corda e rampino": "Rope and grappling hook",
      "Foglietto di Adele": "Adele's note"
    }
  };

  /* Descrizioni di dotazione e scudo */
  const DESC = {
    "Pozione di cura": {
      it: "Quando un personaggio beve il fluido magico rossastro contenuto in questa fiala, recupera 1d4 + il livello del personaggio.",
      en: "When a character drinks the reddish magical fluid in this vial, they recover 1d4 + the character's level."
    },
    "Pozione di mana": {
      it: "Quando un personaggio beve il fluido magico violaceo contenuto in questa fiala, recupera 1d4 + il livello del personaggio.",
      en: "When a character drinks the violet magical fluid in this vial, they recover 1d4 + the character's level."
    },
    "Razioni da viaggio": {
      it: "Non sai se troverai da mangiare dove stai andando: queste razioni ti terranno in vita per qualche giorno, anche se fanno schifo. Recupera 1 punto salute + il livello del personaggio. Si può utilizzare una razione a turno.",
      en: "You don't know whether you'll find food where you're going: these rations will keep you alive for a few days, even if they taste awful. Recover 1 health point + the character's level. You can use one ration per turn."
    },
    Torcia: {
      it: "Un massiccio tizzone di legno avvolto da panno imbevuto di pece e resina ancora vischiosa. Un oggetto fondamentale da tenere stretto... a meno che tu non pretenda di orientarti nei sotterranei affidandoti unicamente ai respiri affannosi di ciò che ti attende nell'oscurità.",
      en: "A heavy wooden brand wrapped in cloth soaked in pitch and still-sticky resin. An essential thing to keep close... unless you expect to find your way through the depths guided only by the ragged breathing of whatever awaits you in the dark."
    },
    "Piede di porco": {
      it: "L'utilizzo di un piede di porco conferisce vantaggio alle prove di lotta in cui è possibile usare il piede di porco per fare leva.",
      en: "Using a crowbar grants advantage on Might checks where the crowbar can be used for leverage."
    },
    "Ampolla di fuoco": {
      it: "Questo fluido giallognolo ed aranciato si infiamma quando è esposto all'aria. Il personaggio può lanciare questa ampolla causando al bersaglio, se lo colpisce, 1d4 danni da fuoco.",
      en: "This yellowish-orange fluid ignites when exposed to air. The character can throw this flask, dealing 1d4 fire damage to the target if it hits."
    },
    "Corda e rampino": { /* PROVVISORIO */
      it: "Un rampino d'acciaio legato a diversi metri di robusta corda: utile per scalare muri, superare dislivelli e raggiungere luoghi altrimenti inaccessibili.",
      en: "A steel grappling hook tied to several metres of sturdy rope: useful for climbing walls, crossing drops and reaching places otherwise out of reach."
    },
    Scudo: { /* PROVVISORIO */
      it: "Uno scudo di legno robusto, cerchiato di ferro: devia i colpi, ma il suo peso rende i movimenti meno agili. Occupa una mano.",
      en: "A sturdy wooden shield rimmed with iron: it turns aside blows, but its weight makes you less nimble. It takes up one hand."
    }
  };

  window.Lingua = {
    get: () => corrente,
    set(l) {
      corrente = l === "en" ? "en" : "it";
      try { localStorage.setItem("lingua", corrente); } catch (e) {}
      document.documentElement.lang = corrente;
    },
    /* nome da mostrare: in inglese se esiste la traduzione, altrimenti la chiave italiana */
    nome: (cat, k) => (corrente === "en" && EN[cat] && EN[cat][k]) || k,
    /* tutti i nomi di una chiave nelle due lingue (per riconoscere ciò che scrive il giocatore) */
    nomi: (k) => [k, ...Object.values(EN).map(c => c[k]).filter(Boolean)],
    desc: (k) => (DESC[k] ? (DESC[k][corrente] || DESC[k].it) : null),
    locale: () => (corrente === "en" ? "en-GB" : "it-IT"),
    /* testo bilingue { it, en } → testo nella lingua corrente */
    t: (o) => (o && typeof o === "object" && !Array.isArray(o) && "it" in o) ? (o[corrente] ?? o.it) : o
  };
})();
