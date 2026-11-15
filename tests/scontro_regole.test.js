/* Test delle regole generali del 11-14/11/2026: azione rapida, due armi, colpo gratuito, consumo alla dichiarazione,
   stati del sovrano (Maledetto, Condannato, Svuotato, Prosciugato, Furente). Dadi programmati. Uso: node tests/scontro_regole.test.js */
(function (root) {
  const inNode = typeof module !== "undefined" && module.exports && typeof require === "function";
  if (inNode) { root.window = root; require("../js/poteri.js"); require("../js/specializzazioni.js"); require("../js/scontro.js"); }
  const P = root.Poteri, S = root.Scontro;

  function dadi(seq) {
    const q = [...seq];
    const f = (d) => { if (!q.length) throw new Error(`tiro in più (d${d}) non previsto`); const v = q.shift(); if (v < 1 || v > d) throw new Error(`valore ${v} impossibile su d${d}`); return v; };
    f.resto = () => q.length;
    return f;
  }
  const ctx = (seq) => ({ tira: dadi(seq) });
  const fine = (c) => { if (c.tira.resto()) throw new Error(`dadi avanzati: ${c.tira.resto()}`); };
  const SPADA = { nome: "Spada", dado: 6, tipo: "taglio" }, MAGLIO = { nome: "Maglio", dado: 8, tipo: "contundente", dueMani: true };
  const guerriero = (o) => Object.assign({ nome: "Tu", liv: 2, pv: 30, pvMax: 30, modClasse: 3, mod: { Vigore: 3 }, caBase: 16,
    arma: SPADA, armi: [SPADA, MAGLIO], tratti: [], spec: "berserker" }, o || {});
  const nemico = (o) => Object.assign({ nome: "nem", liv: 1, pv: 40, pvMax: 40, modAtt: 2, modDanno: 1, mod: {}, caBase: 12, arma: { dado: 6, tipo: "taglio" } }, o || {});
  const ev = (r, k) => (r.eventi || r).filter(e => e && e.k === k);

  const casi = [];
  const caso = (nome, fn) => casi.push({ nome, fn });
  const eq = (a, b, msg) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${msg || "atteso"}: ${JSON.stringify(b)}, ottenuto ${JSON.stringify(a)}`); };
  const vero = (x, msg) => { if (!x) throw new Error(msg || "atteso vero"); };

  caso("Due armi: cambiare arma è l'azione rapida, una per turno; il potere prende lo stato dell'arma in mano", () => {
    const g = guerriero(), n = nemico();
    eq(S.cambiaArma(g, 1).ok, true); eq(g.arma.nome, "Maglio");
    eq(S.cambiaArma(g, 0).eventi[0].k, "rapidaUsata", "una rapida per turno");
    const c = ctx([10, 4, 2]); S.usa(g, n, "colpo_di_mestiere", c); vero(P.ha(n, "stordito"), "maglio → Stordito"); fine(c);
    S.inizioTurno(g, n, ctx([])); eq(S.cambiaArma(g, 0).ok, true); eq(g.arma.nome, "Spada");
    eq(S.cambiaArma(g, 2).ok, false, "non c'è una terza arma");
  });
  caso("Azione rapida e azione standard nello stesso turno: pozione e attacco", () => {
    const g = guerriero({ pv: 10 }), n = nemico();
    eq(S.beviPozione(g, 8).ok, true); eq(g.pv, 18);
    const c = ctx([10, 3]); S.usa(g, n, "colpo_poderoso", c); eq(n.pv, 34); fine(c);
    eq(S.beviPozione(g, 8).ok, false, "seconda pozione nello stesso turno");
  });
  caso("Stordito: perde l'intero turno, anche l'azione rapida", () => {
    const g = guerriero({ stati: { stordito: { liv: 1, turni: 1 } } });
    eq(P.puoAgire(g), false); eq(S.cambiaArma(g, 1).eventi[0].k, "stordito"); eq(S.beviPozione(g, 5).ok, false);
  });
  caso("Consumo alla dichiarazione: per scontro e giornalieri si spendono anche se l'attacco manca; gli a volontà no", () => {
    const g = guerriero(), n = nemico();
    S.usa(g, n, "colpo_crudele", ctx([1])); eq(S.disponibile(g, "colpo_crudele").motivo, "giaUsatoScontro");
    S.usa(g, n, "colpo_del_boia", ctx([1])); eq(S.disponibile(g, "colpo_del_boia").motivo, "giaUsatoGiorno");
    S.usa(g, n, "colpo_poderoso", ctx([1])); eq(S.disponibile(g, "colpo_poderoso").ok, true);
  });
  caso("Colpo gratuito: va a segno, solo il dado dell'arma, niente bonus né critico, resistenze valide", () => {
    const g = guerriero({ arma: { dado: 6, tipo: "taglio", bonus: 2 } }), n = nemico({ res: { taglio: "res" } }), c = ctx([5]);
    const e = S.colpoGratuito(g, n, c); eq([e[0].k, n.pv], ["colpoGratuito", 37]); fine(c);
  });
  caso("Maledetto dimezza le cure (per eccesso), Condannato le annulla", () => {
    const g = guerriero({ pv: 10, stati: { maledizione: { liv: 1, turni: 3 } } });
    S.usa(g, nemico(), "secondo_vento", ctx([])); eq(g.pv, 14, "7 → 4");
    const h = guerriero({ pv: 10, stati: { maledizione: { liv: 2, turni: 3 } } }); S.beviPozione(h, 8); eq(h.pv, 10);
  });
  caso("Svuotato spegne il primo per scontro non usato fino a fine scontro; Prosciugato anche un giornaliero", () => {
    const g = guerriero({ poteri: ["colpo_poderoso", "spezza_guardia", "colpo_crudele", "colpo_del_boia"], usati: { scontro: { spezza_guardia: true }, giorno: {} } });
    const sovrano = nemico({ nome: "Sovrano", liv: 6, modClasse: 3 });
    const c = ctx([2]); const r = S.statoSu(sovrano, g, "applica", c, "vuoto"); fine(c);
    eq(ev(r, "spento")[0].potere, "colpo_crudele"); eq(S.disponibile(g, "colpo_crudele").motivo, "spento");
    const r2 = S.statoSu(sovrano, g, "aggrava", ctx([]), "vuoto"); eq(ev(r2, "spento").map(e => e.potere), ["colpo_del_boia"], "nessun altro per scontro: il giornaliero");
    eq(P.nomeStato("vuoto", g.stati.vuoto.liv), "Prosciugato");
    S.fineScontro(g); eq(S.disponibile(g, "colpo_crudele").ok, true);
  });
  caso("Furente: il sovrano fa +2 danni", () => {
    const s = nemico({ stati: { furente: { liv: 1, turni: 3 } } }), g = guerriero(), c = ctx([18, 3]);
    S.attacco(s, g, {}, c); eq(g.pv, 24); fine(c);
  });
  caso("Armatura integra del sovrano (statiCorti): gli stati durano 1 turno e non si aggravano", () => {
    const g = guerriero(), s = nemico({ statiCorti: true, stati: { sanguinante: { liv: 1, turni: 1 } } }), c = ctx([10, 1, 1, 2]);
    S.usa(g, s, "colpo_crudele", c); eq([s.stati.sanguinante.liv, s.stati.sanguinante.turni], [1, 1]); fine(c);
    const t = nemico({ statiCorti: true }), c2 = ctx([10, 1, 1, 2]); S.usa(guerriero(), t, "spezza_guardia", c2); eq(t.stati.esposto.turni, 1); fine(c2);
  });

  function esegui() { return casi.map(({ nome, fn }) => { try { fn(); return { nome, ok: true }; } catch (e) { return { nome, ok: false, errore: e.message }; } }); }
  root.TestScontroRegole = { esegui, casi };
  if (inNode && require.main === module) {
    const esiti = esegui();
    esiti.forEach(e => console.log(`${e.ok ? "OK    " : "ERRORE"} ${e.nome}${e.ok ? "" : "\n       → " + e.errore}`));
    const ko = esiti.filter(e => !e.ok).length;
    console.log(`\n${esiti.length - ko} / ${esiti.length} superati`);
    if (ko) process.exitCode = 1;
  }
})(typeof window !== "undefined" ? window : globalThis);
