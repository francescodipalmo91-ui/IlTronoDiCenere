/* =====================================================================
   REGOLE — numeri condivisi tra creazione, gioco e regolamento.
   Si cambia un valore qui e cambia ovunque: il regolamento non resta mai indietro rispetto al gioco.
   Contiene solo meccaniche visibili al giocatore, niente dinamiche di trama.
   ===================================================================== */
window.Regole = Object.freeze({
  /* attributi */
  ATTRIBUTI: ["Vigore", "Agilità", "Mente", "Spirito"],
  VALORE_MINIMO: 10,
  VALORE_MASSIMO: 20,          /* bonus della razza compreso */
  PUNTI_BASE: 8,               /* punti da distribuire in creazione */
  RAZZE: {
    Umano: { punti: 4 },       /* punti liberi in più */
    Elfo: { bonus: { "Agilità": 2, Vigore: 1, Spirito: 1 } },
    Nano: { bonus: { Vigore: 2, Spirito: 1, Mente: 1 } },
    Gnomo: { bonus: { Spirito: 2, Mente: 1, "Agilità": 1 } }
  },

  /* abilità: due per attributo */
  ABILITA: [
    ["Atletica", "Vigore"], ["Sopravvivenza", "Vigore"],
    ["Furtività", "Agilità"], ["Acrobazia", "Agilità"],
    ["Investigazione", "Mente"], ["Sapienza", "Mente"],
    ["Socialità", "Spirito"], ["Intuizione", "Spirito"]
  ],
  MAX_ABILITA: 3,
  MAX_DOTAZIONE: 3,

  /* classi (chiavi interne: Soldato = Guerriero, Forestiero = Sciamano, Sapiente = Arcanista, Accolito = Monaco) */
  CLASSI: {
    Soldato: { dado: 10, risorsa: "ira", attrRisorsa: "Vigore" },
    Forestiero: { dado: 8, risorsa: "natura", attrRisorsa: "Spirito" },
    Sapiente: { dado: 6, risorsa: "mana", attrRisorsa: "Mente" },
    Accolito: { dado: 6, risorsa: "fede", attrRisorsa: "Spirito" }
  },
  ARMATURE_CLASSI: { Forestiero: ["Armatura leggera", "Armatura media"], Sapiente: ["Armatura leggera"], Accolito: ["Armatura leggera", "Armatura media"] },
  RISORSA_BASE: 10,            /* mana, fede, ira, natura = 10 + modificatore */
  MAX_INCANTESIMI: 4,
  MAX_TECNICHE: 4,             /* tecniche speciali preparate dalle classi marziali */
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
