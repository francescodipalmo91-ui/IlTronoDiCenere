/* Test dei dati di js/magia.js e dei posti degli incantatori (creazione e scheda).
   Uso:  node tests/magia.test.js   → stampa OK/ERRORE per ogni caso, esce con 1 se qualcosa fallisce. */
global.window = global;
require("../js/regole.js"); require("../js/magia.js");
const M = window.MAGIA, R = window.Regole;
const casi = [];
const caso = (nome, fn) => casi.push({ nome, fn });
const vero = (x, msg) => { if (!x) throw new Error(msg || "atteso vero"); };

caso("Gli id di incantesimi e abilità delle vie sono tutti diversi", () => {
  const ids = [...M.INCANTESIMI, ...M.VIE].map(i => i.id);
  vero(new Set(ids).size === ids.length, "id doppi: " + ids.filter((x, i) => ids.indexOf(x) !== i));
});
caso("Ogni voce ha livello 1-5, costo, scuola e testi italiano e inglese", () => {
  [...M.INCANTESIMI, ...M.VIE].forEach(i => {
    vero(i.liv >= 1 && i.liv <= 5 && i.costo > 0, "livello o costo: " + i.id);
    vero(i.nome.it && i.nome.en && i.effetto.it && i.effetto.en, "testo mancante: " + i.id);
    vero(M.NOMI_SCUOLE[i.scuola], "scuola sconosciuta: " + i.id);
  });
});
caso("Ogni scuola ha incantesimi a sufficienza per i posti di ogni livello (principale) e per l'altra scuola", () => {
  Object.entries(M.CLASSI).forEach(([classe, scuole]) => {
    for (let liv = 1; liv <= R.LIVELLO_MAX; liv++) {
      const posti = R.TECNICHE_PER_LIVELLO.slice(0, liv).reduce((a, b) => a + b, 0);
      scuole.forEach(sc => {
        const n = M.INCANTESIMI.filter(i => i.scuola === sc && i.liv <= liv).length;
        vero(n >= posti, `${classe} ${sc} livello ${liv}: ${n} incantesimi per ${posti} posti`);
        vero(n >= M.POSTI_ALTRA_SCUOLA, `${classe} ${sc}: nessun incantesimo per l'altra scuola`);
      });
    }
  });
});
caso("Ogni classe ha due vie, ciascuna con un'abilità ai livelli 3, 4 e 5, e un nome per la via", () => {
  Object.entries(M.CLASSI).forEach(([classe, scuole]) => {
    ["aldo", "guendalina"].forEach(v => {
      const abil = M.VIE.filter(x => x.via === v && scuole.includes(x.scuola));
      vero(abil.map(x => x.liv).sort().join() === "3,4,5", `${classe} via ${v}: ${abil.map(x => x.liv)}`);
      vero(M.NOMI_VIE[classe][v].it && M.NOMI_VIE[classe][v].en, "nome via mancante");
    });
  });
});
caso("La capacità di classe ha id «luce» (il dungeon si illumina con quell'id) e non occupa posti", () => {
  Object.keys(M.CLASSI).forEach(c => {
    vero(M.CAPACITA[c].id === "luce", c);
    vero(!M.INCANTESIMI.some(i => i.id === "luce"), "«luce» non deve essere anche un incantesimo da preparare");
  });
});
caso("In creazione si preparano 3 incantesimi di livello 1: 2 della scuola principale e 1 dell'altra", () => {
  vero(R.TECNICHE_PER_LIVELLO[0] === 2 && M.POSTI_ALTRA_SCUOLA === 1);
  Object.values(M.CLASSI).forEach(([a, b]) => [[a, b], [b, a]].forEach(([p, o]) => {
    vero(M.INCANTESIMI.filter(i => i.scuola === p && i.liv === 1).length >= 2 && M.INCANTESIMI.filter(i => i.scuola === o && i.liv === 1).length >= 1);
  }));
});

const esiti = casi.map(({ nome, fn }) => { try { fn(); return { nome, ok: true }; } catch (e) { return { nome, ok: false, errore: e.message }; } });
esiti.forEach(e => console.log(`${e.ok ? "OK    " : "ERRORE"} ${e.nome}${e.ok ? "" : "\n       → " + e.errore}`));
const ko = esiti.filter(e => !e.ok).length;
console.log(`\n${esiti.length - ko} / ${esiti.length} superati`);
process.exit(ko ? 1 : 0);
