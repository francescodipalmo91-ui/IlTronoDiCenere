/* =====================================================================
   PRESET DELLA PAGINA DI TEST — test.html
   Valori fissi e riutilizzabili: «Umano Guerriero livello 1» ha sempre gli stessi numeri,
   così due prove fatte in giorni diversi si possono confrontare.
   Regole di costruzione (le stesse della creazione, js/regole.js):
   - Base di classe: minimo 10 per attributo e 8 punti, prima sulla caratteristica di classe
     (Guerriero Vigore, Sciamano Agilità, Arcanista Mente, Monaco Spirito).
   - Razza (Regole.RAZZE): Elfo, Nano e Gnomo aggiungono i loro bonus fissi; l'Umano ha 3 punti liberi,
     spesi come indica «umano» della classe. Massimo 20, bonus compreso.
   - Salute = 10 + massimo del dado vita + mod Vigore; a ogni livello Regole.CRESCITA_FISSA.
   - CA = 10 + armatura + mod Agilità (con il tetto dell'armatura) + 1 con lo scudo.
   - Gli attributi non crescono con il livello (non è ancora deciso un aumento): cambiano salute, risorsa, tecniche.
   Si cambia un numero qui e cambia ovunque nella pagina di test.
   ===================================================================== */
window.PresetTest = (() => {
  const R = window.Regole;
  const mod = (v) => Math.floor((Number(v) - 10) / 2);

  const ARMATURE = { nessuna: { nome: "Nessuna", ca: 0, tetto: 99 }, leggera: { nome: "Leggera", ca: 2, tetto: 3 }, media: { nome: "Media", ca: 3, tetto: 2 }, pesante: { nome: "Pesante", ca: 4, tetto: 0 } };

  /* arma = indice in ARMI di js/sala_prova.js: 0 Spada corta, 1 Ascia da battaglia, 2 Bastone, 3 Martello da battaglia, 4 Mazza chiodata, 5 Piccone da battaglia */
  const PG = {
    guerriero: { nome: "Guerriero", dado: 10, base: { vig: 15, agi: 12, men: 10, spi: 11 }, umano: { vig: 1, agi: 1, spi: 1 }, armatura: "pesante", arma: 0, scudo: true, risorsa: "Punti furia (10 + mod Vigore)" },
    sciamano:  { nome: "Sciamano",  dado: 8,  base: { vig: 11, agi: 15, men: 10, spi: 12 }, umano: { agi: 1, vig: 1, spi: 1 }, armatura: "media",   arma: 4, scudo: false, risorsa: "Punti natura (10 + mod Agilità)" },
    arcanista: { nome: "Arcanista", dado: 6,  base: { vig: 10, agi: 13, men: 15, spi: 10 }, umano: { men: 2, agi: 1 },         armatura: "leggera", arma: 2, scudo: false, risorsa: "Mana (10 + mod Mente)", scuola: "sangue" },
    monaco:    { nome: "Monaco",    dado: 8,  base: { vig: 11, agi: 11, men: 10, spi: 16 }, umano: { spi: 1, vig: 1, agi: 1 }, armatura: "media",   arma: 0, scudo: true, risorsa: "Punti fede (10 + mod Spirito)", scuola: "luce" }
  };
  /* bonus di razza letti da Regole.RAZZE (chiavi Vigore, Agilità, Mente, Spirito) */
  const CHIAVE = { Vigore: "vig", "Agilità": "agi", Mente: "men", Spirito: "spi" }, ETICHETTA = { vig: "Vigore", agi: "Agilità", men: "Mente", spi: "Spirito" };
  const RAZZE = Object.keys(R.RAZZE);
  const bonusRazza = (razza, classe) => {
    const r = R.RAZZE[razza] || {};
    if (r.bonus) return Object.fromEntries(Object.entries(r.bonus).map(([k, v]) => [CHIAVE[k], v]));
    return { ...(PG[classe] || PG.guerriero).umano }; /* Umano: punti liberi secondo la classe */
  };
  const testoBonus = (razza, classe) => Object.entries(bonusRazza(razza, classe)).map(([k, v]) => `+${v} ${ETICHETTA[k]}`).join(", ") + (R.RAZZE[razza] && R.RAZZE[razza].punti ? " (punti liberi)" : "");

  const ca = (armatura, agi, scudo) => { const a = ARMATURE[armatura] || ARMATURE.nessuna; return R.CA_BASE + a.ca + Math.min(a.tetto, mod(agi)) + (scudo ? 1 : 0); };
  const salute = (dado, vig, liv) => { const m = mod(vig); let pv = R.SALUTE_BASE + dado + m; for (let l = 2; l <= liv; l++) pv += R.CRESCITA_FISSA(dado, m); return pv; };

  /* personaggio completo per classe e livello */
  function pg(classe, liv, razza) {
    razza = R.RAZZE[razza] ? razza : "Umano";
    const b = PG[classe] || PG.guerriero, br = bonusRazza(razza, classe), a = {};
    Object.keys(b.base).forEach(k => { a[k] = Math.min(R.VALORE_MASSIMO, b.base[k] + (br[k] || 0)); });
    return { classe, liv, razza, ...a, armatura: b.armatura, arma: b.arma, scudo: b.scudo, ca: ca(b.armatura, a.agi, b.scudo), pv: salute(b.dado, a.vig, liv), intuizione: mod(a.spi), dado: b.dado, risorsa: b.risorsa };
  }

  /* nemici: valori dei documenti (bilanciamento_nemici_oggetti.md); chiavi = NEMICI di js/sala_prova.js.
     ca = senza scudo; lo scudo del nemico aggiunge 1. */
  const NEMICI = {
    mastino:   { classe: "Bestia infernale", liv: 1, vig: 12, agi: 12, men: 6,  spi: 10, ca: 10, pv: 13, arma: "Morso o zampata · 1d4 + Vigore; Soffio Infuocato 2d6, Presa 1d4", scudo: false },
    ettore:    { classe: "Ladro umano (boss, bronzo)", liv: 2, vig: 10, agi: 13, men: 13, spi: 8, ca: 13, pv: 30, arma: "Due pugnali · 2 × 1d4 + 1 tagliente (+2 per colpire)", scudo: false }, /* 02/11 */
    enea:      { classe: "Barbaro nano, ex paladino (boss, argento)", liv: 3, vig: 14, agi: 10, men: 10, spi: 12, ca: 13, pv: 32, arma: "Mani nude 2 × 1d4 · Doppia faccia 1d8 + 4: maglio (caricato 2d8 + 4) o ascia (Squarcio)", scudo: false }, /* 02/11 */
    manichino: { classe: "Bersaglio (non attacca)", liv: 1, vig: 10, agi: 10, men: 10, spi: 10, ca: 12, pv: 60, arma: "Nessuna", scudo: false }
  };

  return Object.freeze({ PG, NEMICI, ARMATURE, RAZZE, pg, ca, salute, mod, testoBonus });
})();
