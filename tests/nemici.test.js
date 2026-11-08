/* Test dei nemici comuni sul motore nuovo (js/nemici.js). Dadi programmati + una simulazione di fumo a caso.
   Uso: node tests/nemici.test.js */
(function (root) {
  const inNode = typeof module !== "undefined" && module.exports && typeof require === "function";
  if (inNode) { root.window = root; require("../js/poteri.js"); require("../js/specializzazioni.js"); require("../js/scontro.js"); require("../js/nemici.js"); }
  const P = root.Poteri, S = root.Scontro, N = root.Nemici;

  function dadi(seq) {
    const q = [...seq];
    const f = (d) => { if (!q.length) throw new Error(`tiro in più (d${d}) non previsto`); const v = q.shift(); if (v < 1 || v > d) throw new Error(`valore ${v} impossibile su d${d}`); return v; };
    f.resto = () => q.length;
    return f;
  }
  const ctx = (seq) => ({ tira: dadi(seq) });
  const fine = (c) => { if (c.tira.resto()) throw new Error(`dadi avanzati: ${c.tira.resto()}`); };
  /* Guerriero di livello 1: Vigore +3, Agilità +1, Spirito +0; TS = d20 + mod + 1 */
  const pg = (o) => Object.assign({ nome: "pg", liv: 1, pv: 30, pvMax: 30, modClasse: 3, mod: { Vigore: 3, "Agilità": 1, Mente: 0, Spirito: 0 },
    caBase: 16, arma: { dado: 6, tipo: "contundente" }, tratti: [], spec: "esecutore", stati: {} }, o || {});
  const ev = (r, k) => (r.eventi || r).filter(e => e && e.k === k);

  const casi = [];
  const caso = (nome, fn) => casi.push({ nome, fn });
  const eq = (a, b, msg) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${msg || "atteso"}: ${JSON.stringify(b)}, ottenuto ${JSON.stringify(a)}`); };
  const vero = (x, msg) => { if (!x) throw new Error(msg || "atteso vero"); };

  caso("Crea: statistiche approvate (lupo 10 / 12 / +2 / 1d6)", () => {
    const l = N.crea("lupo"); eq([l.pv, l.caBase, l.modAtt, l.arma.dado, l.modDanno, l.maledetto], [10, 12, 2, 6, 0, false]);
  });
  caso("Turno 1: lo stato (Morso lacerante, solo il dado; TS del giocatore contro CD 8 + 2 + 1)", () => {
    const l = N.crea("lupo"), g = pg(), c = ctx([18, 4, 2]); const r = N.agisci(l, g, c);
    eq(r.scelta.id, "morso_lacerante"); eq(g.pv, 26); eq(ev(r, "ts")[0].cd, 11); vero(P.ha(g, "sanguinante")); fine(c);
  });
  caso("Turno 2: con lo stato attivo il per scontro (aggrava); turno 3: alterna gli a volontà", () => {
    const l = N.crea("lupo"), g = pg({ stati: { sanguinante: { liv: 1, turni: 2, tipo: "taglio" } } }); l.turno = 1;
    const c = ctx([18, 3]); eq(N.agisci(l, g, c).scelta.id, "azzannare"); eq(g.stati.sanguinante.liv, 2); fine(c);
    const c2 = ctx([1]); eq(N.agisci(l, g, c2).scelta.id, "morso"); fine(c2);
  });
  caso("Turno 2 senza lo stato: ritenta lo stato invece del per scontro", () => {
    const l = N.crea("lupo"), g = pg(); l.turno = 1; eq(N.agisci(l, g, ctx([1])).scelta.id, "morso_lacerante");
  });
  caso("Impaurito: il nemico usa solo gli a volontà", () => {
    const l = N.crea("lupo", { stati: { impaurito: { liv: 1, turni: 2 } } }), g = pg({ stati: { sanguinante: { liv: 1, turni: 2 } } }); l.turno = 1;
    eq(N.scegli(Object.assign(l, { turno: 2 }), g).id, "morso_lacerante");
  });
  caso("Cervo: fugge al secondo turno", () => {
    const c = N.crea("cervo"), g = pg(); N.agisci(c, g, ctx([1])); const r = N.agisci(c, g, ctx([])); vero(c.fuggito); eq(ev(r, "fuga").length, 1);
  });
  caso("Stordito: il nemico perde il turno", () => {
    const l = N.crea("lupo", { stati: { stordito: { liv: 1, turni: 1 } } }); eq(ev(N.agisci(l, pg(), ctx([])), "perdeAzione").length, 1);
  });
  caso("Mastino: Soffio infuocato senza tiro per colpire + Scottato (TS Agilità)", () => {
    const m = N.crea("mastino"), g = pg({ stati: { indebolito: { liv: 1, turni: 2 } } }); m.turno = 1;
    const c = ctx([4, 2]); const r = N.agisci(m, g, c); eq(r.scelta.id, "soffio_infuocato"); eq(g.pv, 26); eq(ev(r, "ts")[0].attr, "Agilità"); vero(P.ha(g, "scottato")); fine(c);
  });
  caso("Mastino: fuoco comune ⛔, fuoco sacro ✓, maledetto (+1d4 del Colpo consacrato)", () => {
    const m = N.crea("mastino", { stati: { scottato: { liv: 1, turni: 2, tipo: "fuoco" } } });
    S.inizioTurno(m, null, ctx([4])); eq(m.pv, 13, "bruciatura comune: immune");
    const mo = { nome: "monaco", liv: 1, pv: 26, pvMax: 26, modClasse: 3, mod: { Spirito: 3 }, caBase: 14, arma: { dado: 6, tipo: "taglio" }, spec: "purificatore" };
    const m2 = N.crea("mastino"), c = ctx([10, 2, 3, 15]); S.usa(mo, m2, "colpo_consacrato", c); eq(m2.pv, 5, "(2 + 3 + 3) = 8, nessuna resistenza al taglio"); fine(c);
    const m3 = N.crea("mastino", { stati: { scottato: { liv: 1, turni: 2, tipo: "fuoco_sacro" } } }); S.inizioTurno(m3, null, ctx([4])); eq(m3.pv, 7, "fuoco sacro vulnerabile: 4 → 6");
  });
  caso("Infernali di cenere: contundente ✓, fuoco ✗, sanguinamento dimezzato", () => {
    const r = N.crea("ratto_di_cenere", { stati: { sanguinante: { liv: 1, turni: 2, tipo: "taglio" } } });
    S.inizioTurno(r, null, ctx([3])); eq(r.pv, 6); eq(P.modificaDanno(r, "contundente", 4).danno, 6); eq(P.modificaDanno(r, "fuoco", 4).danno, 2);
  });
  caso("Infernali di brace: perforante ✓; Veleno rovente aggrava la bruciatura e applica Intossicato", () => {
    const v = N.crea("vipera_di_brace"), g = pg({ stati: { scottato: { liv: 1, turni: 2 } } }); v.turno = 1;
    const c = ctx([18, 2, 2]); eq(N.agisci(v, g, c).scelta.id, "veleno_rovente"); eq(g.stati.scottato.liv, 2); vero(P.ha(g, "intossicato")); fine(c);
    eq(P.modificaDanno(v, "perforante", 4).danno, 6);
  });
  caso("Lupo di cenere: Ululato → Impaurito (TS Spirito)", () => {
    const l = N.crea("lupo_di_cenere"), g = pg({ stati: { indebolito: { liv: 1, turni: 2 } } }); l.turno = 1;
    const c = ctx([3]); const r = N.agisci(l, g, c); eq(ev(r, "ts")[0].attr, "Spirito"); vero(P.ha(g, "impaurito")); fine(c);
  });

  /* ===== Élite ===== */
  caso("Élite: annuncia il per scontro un turno prima (attaccando con un a volontà), poi lo esegue", () => {
    const m = N.crea("mastino_della_soglia"), g = pg({ pv: 60, pvMax: 60 });
    N.agisci(m, g, ctx([1]));                                   /* turno 1: Presa, manca */
    const r2 = N.agisci(m, g, ctx([1]));                        /* turno 2: annuncia il Soffio di cenere, attacca */
    eq(ev(r2, "annuncio")[0].potere, "soffio_di_cenere"); eq(m.pronto, "soffio_di_cenere");
    const c = ctx([3, 3, 2]); const r3 = N.agisci(m, g, c);     /* turno 3: Soffio di cenere, 2d6 e un TS per i due stati */
    eq(r3.scelta.id, "soffio_di_cenere"); eq(g.pv, 54); vero(P.ha(g, "indebolito") && P.ha(g, "scottato")); eq(ev(r3, "ts").length, 1); eq(m.pronto, null); fine(c);
  });
  caso("Spezza-carica sull'annuncio: il potere è perso e la sua runa si spegne", () => {
    const m = N.crea("mastino_corazzato"), g = pg({ liv: 4, pv: 60, pvMax: 60, spec: "sentinella" }); m.turno = 1;
    N.agisci(m, g, ctx([1])); eq(m.pronto, "soffio_infuocato_2"); eq(N.statoRune(m)[0], { potere: "soffio_infuocato_2", accesa: true, pulsaVeloce: true });
    const c = ctx([19, 1, 1, 2]); S.usa(g, m, "spezza_carica", c); eq(m.pronto, null);
    eq(N.statoRune(m)[0].accesa, false); vero(P.ha(m, "indebolito")); fine(c);
  });
  caso("Mastino corazzato: da Vacillante la runa del petto si spegne e la CA scende da 15 a 13", () => {
    const m = N.crea("mastino_corazzato"); eq(S.ca(m), 15); m.pv = 19; eq(S.ca(m), 13); eq(N.statoRune(m)[2], { potere: "armatura", accesa: false, pulsaVeloce: false });
    eq(P.modificaDanno(m, "taglio", 6).danno, 3); eq(P.modificaDanno(m, "perforante", 6).danno, 9);
  });
  caso("Caccia al ferito / Silenzio della casa: niente per scontro né annunci finché dura", () => {
    const m = N.crea("mastino_corazzato", { nonCarica: 1 }); m.turno = 1; vero(!N.scegli(Object.assign(m, { turno: 2 }), pg()).annuncia);
  });
  caso("Ceneri sul pelo: chi lo colpisce in mischia fino al suo turno è Scottato; gli incantesimi a distanza no", () => {
    const m = N.crea("mastino_della_soglia"), g = pg(); N.esegui(m, g, "ceneri_sul_pelo", ctx([]));
    const c = ctx([15, 2, 2]); S.attacco(g, m, {}, c); vero(P.ha(g, "scottato")); fine(c);
    const g2 = pg({ focus: { dado: 8 } }), c2 = ctx([15, 2]); S.attacco(g2, m, { focus: true }, c2); vero(!P.ha(g2, "scottato")); fine(c2);
  });

  /* ===== Fumo: scontri veri a caso ===== */
  caso("Fumo: 200 scontri a caso contro ogni nemico finiscono senza errori (Guerriero di livello 1, Colpo poderoso)", () => {
    const tira = (d) => 1 + Math.floor(Math.random() * d), c = { tira };
    Object.keys(N.NEMICI).forEach(id => {
      for (let i = 0; i < 200; i++) {
        const g = pg({ liv: 1 }), n = N.crea(id); let turni = 0;
        while (g.pv > 0 && n.pv > 0 && !n.fuggito && turni++ < 100) {
          S.inizioTurno(g, n, c); if (g.pv > 0 && P.puoAgire(g)) S.usa(g, n, "colpo_poderoso", c); S.fineTurno(g);
          if (n.pv <= 0) break;
          S.inizioTurno(n, g, c); if (n.pv > 0) N.agisci(n, g, c); S.fineTurno(n);
        }
        vero(turni < 100, `${id}: scontro senza fine`);
      }
    });
  });

  function esegui() { return casi.map(({ nome, fn }) => { try { fn(); return { nome, ok: true }; } catch (e) { return { nome, ok: false, errore: e.message }; } }); }
  root.TestNemici = { esegui, casi };
  if (inNode && require.main === module) {
    const esiti = esegui();
    esiti.forEach(e => console.log(`${e.ok ? "OK    " : "ERRORE"} ${e.nome}${e.ok ? "" : "\n       → " + e.errore}`));
    const ko = esiti.filter(e => !e.ok).length;
    console.log(`\n${esiti.length - ko} / ${esiti.length} superati`);
    process.exit(ko ? 1 : 0);
  }
})(typeof window !== "undefined" ? window : globalThis);
