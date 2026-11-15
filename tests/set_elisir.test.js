/* Test di set ed elisir di stato (15/11/2026). Uso: node tests/set_elisir.test.js */
(function (root) {
  const inNode = typeof module !== "undefined" && module.exports && typeof require === "function";
  if (inNode) { root.window = root; require("../js/poteri.js"); require("../js/specializzazioni.js"); require("../js/oggetti.js"); require("../js/scontro.js"); require("../js/nemici.js"); }
  const P = root.Poteri, S = root.Scontro, N = root.Nemici;
  function dadi(seq) {
    const q = [...seq];
    const f = (d) => { if (!q.length) throw new Error(`tiro in più (d${d}) non previsto`); const v = q.shift(); if (v < 1 || v > d) throw new Error(`valore ${v} impossibile su d${d}`); return v; };
    f.resto = () => q.length; return f;
  }
  const ctx = (seq) => ({ tira: dadi(seq) });
  const fine = (c) => { if (c.tira.resto()) throw new Error(`dadi avanzati: ${c.tira.resto()}`); };
  const pg = (o) => S.preparaScontro(Object.assign({ nome: "Tu", liv: 2, pv: 30, pvMax: 30, modClasse: 3, mod: { Vigore: 3, "Agilità": 0, Mente: 0, Spirito: 0 }, caBase: 15,
    arma: { dado: 6, tipo: "taglio" }, tratti: [], spec: "berserker", poteri: ["colpo_poderoso", "colpo_di_mestiere", "spezza_guardia", "colpo_del_boia"] }, o || {}));
  const nemico = (o) => S.preparaScontro(Object.assign({ nome: "nem", liv: 1, pv: 40, pvMax: 40, modAtt: 2, modDanno: 1, modClasse: 2, mod: {}, caBase: 12, arma: { dado: 6, tipo: "taglio" } }, o || {}));
  const ev = (r, k) => (r.eventi || r).filter(e => e && e.k === k);
  const casi = [], caso = (nome, fn) => casi.push({ nome, fn });
  const eq = (a, b, msg) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${msg || "atteso"}: ${JSON.stringify(b)}, ottenuto ${JSON.stringify(a)}`); };
  const vero = (x, msg) => { if (!x) throw new Error(msg || "atteso vero"); };

  caso("Odore di Casa (carne 2): −1 a ogni colpo fisico subito, non agli stati che bruciano", () => {
    const g = pg({ set: { carne: 2, cenere: 0 } }), n = nemico(), c = ctx([15, 5]);
    S.attacco(n, g, {}, c); eq(g.pv, 30 - (5 + 1 - 1)); fine(c);
    const g2 = pg({ set: { carne: 1 } }), c2 = ctx([15, 5]); S.attacco(n, g2, {}, c2); eq(g2.pv, 24, "con 1 pezzo niente");
  });
  caso("Sguardo della Casa (carne 4): azione rapida, una volta per scontro; il nemico marchiato ha −2 a colpirti", () => {
    const g = pg({ set: { carne: 4 } }), n = nemico();
    vero(S.usaSet(g, "sguardo_della_casa", n).ok); eq(S.disponibileSet(g, "sguardo_della_casa").motivo, "giaUsatoScontro");
    const c = ctx([11]); const r = S.attacco(n, g, {}, c); vero(!r.ok, "11 + 2 − 2 = 11 non supera 15"); fine(c);
    vero(!S.usaSet(pg({ set: { carne: 3 } }), "sguardo_della_casa", n).ok, "servono 4 pezzi");
  });
  caso("Ultima Guardia (carne 5): a 0 ti rialzi con il 10% della salute, una volta al giorno", () => {
    const g = pg({ set: { carne: 5 }, pv: 3 }), n = nemico(), c = ctx([15, 6]);
    S.attacco(n, g, {}, c); eq(g.pv, 3, "10% di 30"); vero(g.usati.giorno.ultima_guardia);
    g.pv = 2; S.attacco(n, g, {}, ctx([15, 6])); vero(g.pv <= 0, "il secondo colpo no");
  });
  caso("Voce del sangue (cenere 4): carica con l'azione rapida, rilancia il primo tiro per colpire mancato", () => {
    const g = pg({ set: { cenere: 4 } }), n = nemico(); vero(S.usaSet(g, "voce_del_sangue").ok);
    const c = ctx([2, 15, 4]); const r = S.attacco(g, n, {}, c); vero(r.ok); eq(ev(r, "voceDelSangue").length, 1); fine(c);
    const c2 = ctx([2]); vero(!S.attacco(g, n, {}, c2).ok, "una sola volta"); fine(c2);
  });
  caso("Clausole del set di cenere sul sovrano: 2 pezzi sangue/psichico resistenti, 4 anche taglio/perforante/ossa neutri, 5 armatura azzerata", () => {
    eq([N.crea("sovrano").res.sangue, N.crea("sovrano").res.taglio], ["imm", "res"]);
    eq([N.crea("sovrano", { setCenere: 2 }).res.psichico, N.crea("sovrano", { setCenere: 2 }).res.taglio], ["res", "res"]);
    const s4 = N.crea("sovrano", { setCenere: 4 }); eq([s4.res.sangue, s4.res.taglio, s4.res.ossa, s4.res.veleno, s4.res.contundente], ["res", undefined, undefined, "res", "vuln"]);
    eq(N.crea("sovrano", { setCenere: 5 }).res, { contundente: "vuln", fuoco_sacro: "vuln" });
  });
  caso("Elisir di stato: azione rapida; comune cura solo il lieve, raro anche il grave e dà 3 turni di immunità", () => {
    const g = pg({ borsa: { sanguinante: { comune: 1, raro: 1 } }, stati: { sanguinante: { liv: 2, turni: 2 } } });
    eq(S.beviElisirStato(g, "sanguinante", false).eventi[0].k, "elisirDebole");
    vero(S.beviElisirStato(g, "sanguinante", true).ok); vero(!P.ha(g, "sanguinante")); eq(g.borsa.sanguinante.raro, 0);
    vero(!S.beviElisirStato(g, "sanguinante", false).ok, "una sola azione rapida per turno");
    const n = nemico(); eq(ev(S.statoSu(n, g, "applica", ctx([]), "sanguinante"), "immune").length, 1);
    for (let i = 0; i < 3; i++) S.inizioTurno(g, n, ctx([]));
    vero(!(g.immuni || []).includes("sanguinante"), "dopo 3 turni l'immunità finisce");
    const g2 = pg({ borsa: { esposto: { comune: 2 } }, stati: { esposto: { liv: 1, turni: 2 } } }); vero(S.beviElisirStato(g2, "esposto", false).ok); vero(!P.ha(g2, "esposto")); eq(g2.borsa.esposto.comune, 1);
  });

  function esegui() { return casi.map(({ nome, fn }) => { try { fn(); return { nome, ok: true }; } catch (e) { return { nome, ok: false, errore: e.message }; } }); }
  root.TestSetElisir = { esegui, casi };
  if (inNode && require.main === module) {
    const esiti = esegui();
    esiti.forEach(e => console.log(`${e.ok ? "OK    " : "ERRORE"} ${e.nome}${e.ok ? "" : "\n       → " + e.errore}`));
    const ko = esiti.filter(e => !e.ok).length;
    console.log(`\n${esiti.length - ko} / ${esiti.length} superati`);
    if (ko) process.exitCode = 1;
  }
})(typeof window !== "undefined" ? window : globalThis);
