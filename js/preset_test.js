/* =====================================================================
   PRESET DELLA PAGINA DI TEST — test.html
   Valori fissi e riutilizzabili: «Umano Guerriero livello 1» ha sempre gli stessi numeri,
   così due prove fatte in giorni diversi si possono confrontare.
   Regole di costruzione (le stesse della creazione, js/regole.js):
   - Umano: minimo 10 per attributo, 8 punti + 3 della razza = 11 punti, massimo 20.
   - Attributi ordinati per classe: si alza prima quello che serve alla classe.
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
    guerriero: { nome: "Guerriero", dado: 10, attr: { vig: 16, agi: 13, men: 10, spi: 12 }, armatura: "pesante", arma: 0, scudo: true, risorsa: "Punti furia (10 + mod Vigore)" },
    sciamano:  { nome: "Sciamano",  dado: 8,  attr: { vig: 12, agi: 14, men: 10, spi: 15 }, armatura: "media",   arma: 4, scudo: false, risorsa: "Punti natura (10 + mod Spirito)" },
    arcanista: { nome: "Arcanista", dado: 6,  attr: { vig: 10, agi: 14, men: 17, spi: 10 }, armatura: "leggera", arma: 2, scudo: false, risorsa: "Mana (10 + mod Mente)" },
    monaco:    { nome: "Monaco",    dado: 8,  attr: { vig: 12, agi: 12, men: 10, spi: 17 }, armatura: "media",   arma: 0, scudo: true, risorsa: "Punti fede (10 + mod Spirito)" }
  };

  const ca = (armatura, agi, scudo) => { const a = ARMATURE[armatura] || ARMATURE.nessuna; return R.CA_BASE + a.ca + Math.min(a.tetto, mod(agi)) + (scudo ? 1 : 0); };
  const salute = (dado, vig, liv) => { const m = mod(vig); let pv = R.SALUTE_BASE + dado + m; for (let l = 2; l <= liv; l++) pv += R.CRESCITA_FISSA(dado, m); return pv; };

  /* personaggio completo per classe e livello */
  function pg(classe, liv) {
    const b = PG[classe] || PG.guerriero, a = b.attr;
    return { classe, liv, razza: "Umano", ...a, armatura: b.armatura, arma: b.arma, scudo: b.scudo, ca: ca(b.armatura, a.agi, b.scudo), pv: salute(b.dado, a.vig, liv), intuizione: mod(a.spi), dado: b.dado, risorsa: b.risorsa };
  }

  /* nemici: valori dei documenti (bilanciamento_nemici_oggetti.md); chiavi = NEMICI di js/sala_prova.js.
     ca = senza scudo; lo scudo del nemico aggiunge 1. */
  const NEMICI = {
    mastino:   { classe: "Bestia infernale", liv: 1, vig: 12, agi: 12, men: 6,  spi: 10, ca: 10, pv: 13, arma: "Morso o zampata · 1d4 + Vigore; Soffio Infuocato 2d6, Presa 1d4", scudo: false },
    ettore:    { classe: "Cacciatore di taglie (boss, bronzo)", liv: 2, vig: 12, agi: 13, men: 12, spi: 8, ca: 13, pv: 30, arma: "Spada sbreccata · 1d6 + Vigore + 1", scudo: false },
    enea:      { classe: "Paladino decaduto (boss, argento)", liv: 3, vig: 12, agi: 10, men: 12, spi: 14, ca: 13, pv: 36, arma: "Mani nude 2 × 1d4 · Maglio 1d8 + 4 (caricato 2d8 + 4)", scudo: false },
    manichino: { classe: "Bersaglio (non attacca)", liv: 1, vig: 10, agi: 10, men: 10, spi: 10, ca: 12, pv: 60, arma: "Nessuna", scudo: false }
  };

  return Object.freeze({ PG, NEMICI, ARMATURE, pg, ca, salute, mod });
})();
