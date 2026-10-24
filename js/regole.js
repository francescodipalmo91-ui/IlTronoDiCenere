/* =====================================================================
   REGOLE — numeri condivisi tra creazione, gioco e regolamento.
   Si cambia un valore qui e cambia ovunque: il regolamento non resta mai indietro rispetto al gioco.
   Contiene solo meccaniche visibili al giocatore, niente dinamiche di trama.
   ===================================================================== */
window.Regole = (() => {
  const CLASSI = { /* chiavi interne: Soldato = Guerriero, Forestiero = Sciamano, Sapiente = Arcanista, Accolito = Monaco */
    Soldato: { dado: 10, risorsa: "ira", attrRisorsa: "Vigore" },
    Forestiero: { dado: 8, risorsa: "natura", attrRisorsa: "Spirito" },
    Sapiente: { dado: 6, risorsa: "mana", attrRisorsa: "Mente" },
    Accolito: { dado: 6, risorsa: "fede", attrRisorsa: "Spirito" }
  };
  const perClasse = (filtro, valore) => Object.fromEntries(Object.entries(CLASSI).filter(([, c]) => filtro(c)).map(([k, c]) => [k, valore(c)]));
  const marziale = (c) => c.risorsa === "ira" || c.risorsa === "natura";
  return Object.freeze({
  /* attributi */
  ATTRIBUTI: ["Vigore", "Agilità", "Mente", "Spirito"],
  VALORE_MINIMO: 10,
  VALORE_MASSIMO: 20,          /* bonus della razza compreso */
  PUNTI_BASE: 8,               /* punti da distribuire in creazione */
  RAZZE: {
    Umano: { punti: 3 },       /* punti liberi in più */
    Elfo: { bonus: { "Agilità": 2, Mente: 1 } },
    Nano: { bonus: { Vigore: 2, Spirito: 1 } },
    Gnomo: { bonus: { Spirito: 2, "Agilità": 1 } }
  },

  /* abilità: due per attributo */
  ABILITA: [
    ["Atletica", "Vigore"], ["Sopravvivenza", "Vigore"],
    ["Furtività", "Agilità"], ["Acrobazia", "Agilità"],
    ["Investigazione", "Mente"], ["Sapienza", "Mente"],
    ["Socialità", "Spirito"], ["Intuizione", "Spirito"]
  ],
  MAX_ABILITA: 4,
  MAX_DOTAZIONE: 3,

  CLASSI,
  /* ricavati da CLASSI, così creazione e gioco non li ricopiano */
  DADO_VITA: perClasse(() => true, c => c.dado),
  RISORSA_MARZIALE: perClasse(marziale, c => ({ id: c.risorsa, attr: c.attrRisorsa })), /* punti ira (Guerriero), punti natura (Sciamano) */
  ATTR_MAGIA: perClasse(c => !marziale(c), c => c.attrRisorsa),                         /* attributo del mana (Arcanista) e della fede (Monaco) */
  ARMATURE_CLASSI: { Forestiero: ["Armatura leggera", "Armatura media"], Sapiente: ["Armatura leggera"], Accolito: ["Armatura leggera", "Armatura media"] },
  RISORSA_BASE: 10,            /* mana, fede, ira, natura = 10 + modificatore */
  MAX_INCANTESIMI: 4,
  MAX_TECNICHE: 2,             /* tecniche speciali preparate al livello 1 */
  TECNICHE_PER_LIVELLO: [2, 2, 1, 1, 1], /* scelte nuove a ogni livello: posti 2, 4, 5, 6, 7 */
  IRA_PER_COLPO: [1, 1, 2, 2, 3], /* ira guadagnata per ogni colpo subito, per livello (doppia sui critici) */
  TECNICHE_SCUDO: 1,           /* una tecnica in più con lo scudo imbracciato */
  SALUTE_BASE: 10,             /* salute fisica e mentale = 10 + dado vita + modificatore */
  CA_BASE: 10,
  TETTO_AGILITA: { "Armatura leggera": 3, "Armatura media": 2, "Armatura pesante": 0 },

  /* prove e combattimento */
  COSTO_PROVA_FALLITA: 1,      /* punti di salute mentale */
  CD_INCROLLABILE: 10,

  /* riposo */
  RAZIONI_MAX: 10,
  RAZIONI_AL_GIORNO: 2,

  /* livelli */
  LIVELLO_MAX: 5,
  SOGLIE_PE: [0, 500, 1500, 3000, 5000] /* PE totali per raggiungere il livello 2, 3, 4, 5 */
});
})();
