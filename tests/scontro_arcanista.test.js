/* Test dell'Arcanista (Realtà, Illusione) sul motore nuovo. Dadi programmati. Uso: node tests/scontro_arcanista.test.js */
(function (root) {
  const inNode = typeof module !== "undefined" && module.exports && typeof require === "function";
  if (inNode) { root.window = root; require("../js/poteri.js"); require("../js/specializzazioni.js"); require("../js/scontro.js"); }
  const P = root.Poteri, S = root.Scontro, SP = root.SPECIALIZZAZIONI;

  function dadi(seq) {
    const q = [...seq];
    const f = (d) => { if (!q.length) throw new Error(`tiro in più (d${d}) non previsto`); const v = q.shift(); if (v < 1 || v > d) throw new Error(`valore ${v} impossibile su d${d}`); return v; };
    f.resto = () => q.length;
    return f;
  }
  const ctx = (seq) => ({ tira: dadi(seq) });
  const fine = (c) => { if (c.tira.resto()) throw new Error(`dadi avanzati: ${c.tira.resto()}`); };
  /* Arcanista: Mente +3, focus d8, bastone (contundente d6), CA 12, salute 24 */
  const arcanista = (o) => Object.assign({ nome: "pg", liv: 1, pv: 24, pvMax: 24, modClasse: 3, mod: { Vigore: 0, "Agilità": 1, Mente: 3, Spirito: 0 },
    caBase: 12, focus: { dado: 8, bonus: 0 }, arma: { dado: 6, tipo: "contundente" }, tratti: [], spec: "realta" }, o || {});
  const illusionista = (o) => arcanista({ spec: "illusione", ...(o || {}) });
  const nemico = (o) => Object.assign({ nome: "nem", liv: 1, pv: 20, pvMax: 20, modAtt: 2, modDanno: 1, mod: {}, caBase: 12, arma: { dado: 6, tipo: "taglio" } }, o || {});
  const sangue = (liv, turni) => ({ sanguinante: { liv, turni, tipo: "sangue" } });
  const ev = (r, k) => (r.eventi || r).filter(e => e && e.k === k);

  const casi = [];
  const caso = (nome, fn) => casi.push({ nome, fn });
  const eq = (a, b, msg) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${msg || "atteso"}: ${JSON.stringify(b)}, ottenuto ${JSON.stringify(a)}`); };
  const vero = (x, msg) => { if (!x) throw new Error(msg || "atteso vero"); };

  /* ===== Realtà (forza, Esposto, Frattura) ===== */
  const esposto = (liv, turni) => ({ esposto: { liv, turni } });
  caso("Colpo di forza: dado dell'arma (d8 con il focus) + Mente, forza; Esposto con TS di Agilità", () => {
    const a = arcanista(), n = nemico(), c = ctx([10, 5, 3]); const r = S.usa(a, n, "colpo_di_forza", c);
    eq([n.pv, ev(r, "attacco")[0].tipo, ev(r, "ts")[0].attr], [12, "forza", "Agilità"]); vero(P.ha(n, "esposto")); fine(c);
  });
  caso("Focus: d8 se l'arma è d6; il bonus del focus si somma a quello dell'arma; arma a due mani senza focus", () => {
    const a = arcanista({ focus: { dado: 8, bonus: 1 }, arma: { dado: 6, tipo: "contundente", bonus: 1 } }), n = nemico(), c = ctx([8, 8, 15]);
    S.usa(a, n, "colpo_di_forza", c); eq(n.pv, 7); fine(c);
    eq(S.dadoIncanto(arcanista({ arma: { dado: 8, tipo: "taglio", dueMani: true } })), 8);
    eq(S.dadoIncanto(arcanista({ arma: { dado: 6, tipo: "taglio", dueMani: true } })), 6, "due mani: il focus non amplifica");
    eq(S.dadoIncanto(arcanista({ arma: { dado: 8, tipo: "contundente", dueMani: true, eFocus: true } })), 8, "il bastone è arma e focus");
  });
  caso("Frattura: +2 danni ai poteri contro un Esposto o Scoperto (non all'attacco base)", () => {
    const a = arcanista(), n = nemico({ stati: esposto(1, 2) }), c = ctx([10, 5, 15]); const r = S.usa(a, n, "colpo_di_forza", c);
    eq([n.pv, ev(r, "attacco")[0].frattura], [10, 2]); fine(c);
    const n2 = nemico({ stati: esposto(1, 2) }), c2 = ctx([10, 5]); S.attacco(a, n2, {}, c2); eq(n2.pv, 12); fine(c2);
  });
  caso("Gravità: 1d6 di forza senza tiro, Indebolito; su un Esposto dura 1 turno in più (e Frattura)", () => {
    const a = arcanista(), n = nemico({ stati: esposto(1, 2) }), c = ctx([4, 3]); S.usa(a, n, "gravita", c);
    eq([n.pv, n.stati.indebolito.turni], [14, 4]); fine(c);
  });
  caso("Campo di peso: +2 CA; se il nemico ti manca, 1d4 di forza senza tiro", () => {
    const a = arcanista(), n = nemico(), c = ctx([5, 3]); S.usa(a, n, "campo_di_peso", ctx([])); eq(S.ca(a), 14);
    S.attacco(n, a, {}, c); eq(n.pv, 17); fine(c);
  });
  caso("Schianto: un dado in più, aggrava l'Esposto in Scoperto (senza TS), con Frattura", () => {
    const a = arcanista(), n = nemico({ stati: esposto(1, 2) }), c = ctx([10, 2, 3]); S.usa(a, n, "schianto", c);
    eq([n.pv, n.stati.esposto.liv], [10, 2]); fine(c);
  });
  caso("Lancia di realtà: due dadi in più, applica Esposto", () => {
    const a = arcanista(), n = nemico({ pv: 40, pvMax: 40 }), c = ctx([10, 1, 1, 1, 2]); S.usa(a, n, "lancia_di_realta", c);
    eq(n.pv, 34); vero(P.ha(n, "esposto")); fine(c);
  });
  caso("Spezzare la materia: ignora le resistenze, non le immunità", () => {
    const a = arcanista(), n = nemico({ res: { forza: "res" } }), c = ctx([10, 4, 4]); S.usa(a, n, "spezzare_la_materia", c); eq(n.pv, 9); fine(c);
    const m = nemico({ res: { forza: "imm" } }), c2 = ctx([10, 4, 4]); S.usa(arcanista(), m, "spezzare_la_materia", c2); eq(m.pv, 20); fine(c2);
  });
  caso("Doppia frattura: due dadi in più solo su uno Scoperto", () => {
    const a = arcanista(), n = nemico({ stati: esposto(2, 2) }), c = ctx([10, 1, 1, 1]); S.usa(a, n, "doppia_frattura", c); eq(n.pv, 12); fine(c);
    const m = nemico(), c2 = ctx([10, 1]); S.usa(arcanista(), m, "doppia_frattura", c2); eq(m.pv, 16); fine(c2);
  });
  caso("Sovraccarico: 2d8 + Mente senza tiro, aggrava l'Esposto (senza il lieve lo applica)", () => {
    const a = arcanista(), n = nemico(), c = ctx([3, 4, 2]); S.usa(a, n, "sovraccarico", c); eq(n.pv, 10); vero(P.ha(n, "esposto")); fine(c);
  });
  caso("Collasso gravitazionale: 1d8 a inizio dei tuoi 3 turni, applica poi aggrava l'Esposto, Frattura dal secondo", () => {
    const a = arcanista(), n = nemico({ pv: 40, pvMax: 40 }); S.usa(a, n, "collasso_gravitazionale", ctx([]));
    const c = ctx([5, 2, 5, 1]); S.inizioTurno(a, n, c); eq(n.pv, 35); S.inizioTurno(a, n, c); eq([n.pv, n.stati.esposto.liv], [28, 2]);
    S.inizioTurno(a, n, c); eq(n.pv, 25); vero(!a.buff.collasso); fine(c);
  });
  caso("Punto di rottura: l'Esposto sul bersaglio non scade", () => {
    const a = arcanista(), n = nemico({ stati: esposto(1, 1) }); S.usa(a, n, "punto_di_rottura", ctx([]));
    S.fineTurno(n); S.fineTurno(n); vero(P.ha(n, "esposto")); S.fineScontro(n); vero(!n.espostoPerenne);
  });
  caso("Annullamento: 4d8 + Mente senza tiro; su uno Scoperto 2 dadi in più (15/11)", () => {
    const a = arcanista(), n = nemico({ pv: 40, pvMax: 40, stati: esposto(2, 2) }), c = ctx([1, 1, 1, 1, 1, 1]); S.usa(a, n, "annullamento", c);
    eq(n.pv, 29, "40 − (6 + 3 + Frattura 2)"); fine(c);
  });

  /* ===== Classe e tratti ===== */
  caso("Coagulo: 1/4 della salute, +1d6 se il nemico ha uno stato", () => {
    const a = arcanista({ pv: 10 }); S.usa(a, nemico(), "coagulo", ctx([])); eq(a.pv, 16);
    const b = arcanista({ pv: 10 }), c = ctx([4]); S.usa(b, nemico({ stati: sangue(1, 2) }), "coagulo", c); eq(b.pv, 20); fine(c);
  });
  caso("Pozzo arcano: la prima volta per turno nemico che vieni colpito recuperi 1", () => {
    const a = arcanista({ tratti: ["pozzo_arcano"] }), n = nemico(), c = ctx([18, 1, 18, 1]);
    S.attacco(n, a, {}, c); eq(a.pv, 23); S.attacco(n, a, {}, c); eq(a.pv, 21); fine(c);
    S.inizioTurno(n, a, ctx([])); vero(!a.pozzoUsato, "torna al turno del nemico successivo");
  });
  caso("Ultima scintilla: diventando Vacillante recuperi un potere per scontro già usato (una volta)", () => {
    const a = arcanista({ tratti: ["ultima_scintilla"], pv: 13 }), n = nemico({ modDanno: 5 });
    S.usa(a, n, "schianto", ctx([1])); eq(S.disponibile(a, "schianto").ok, false, "consumato anche se manca");
    S.attacco(n, a, {}, ctx([18, 1])); eq(S.disponibile(a, "schianto").ok, true); vero(a.scintillaUsata);
  });

  /* ===== Illusione ===== */
  caso("Riflessi: se il nemico ti manca, nasce una Copia", () => {
    const a = illusionista(), n = nemico(); S.usa(a, n, "riflessi", ctx([])); S.attacco(n, a, {}, ctx([1])); eq(a.copie, 1);
  });
  caso("Copie: il colpo prende una Copia, metà danno, chi colpisce è Indebolito", () => {
    const a = illusionista({ copie: 2 }), n = nemico(), c = ctx([18, 6, 3]); S.attacco(n, a, {}, c);
    eq([a.pv, a.copie], [20, 1]); vero(P.ha(n, "indebolito")); fine(c);
  });
  caso("Copie: un colpo caricato le distrugge tutte e dimezza una volta (niente Indebolito)", () => {
    const a = illusionista({ copie: 3 }), n = nemico(), c = ctx([18, 6]); S.attacco(n, a, { carica: true }, c);
    eq([a.pv, a.copie], [20, 0]); vero(!P.ha(n, "indebolito")); fine(c);
  });
  caso("Dardo fantasma: +1d4 con almeno una Copia", () => {
    const a = illusionista({ copie: 1 }), n = nemico(), c = ctx([10, 5, 2]); S.usa(a, n, "dardo_fantasma", c); eq(n.pv, 10); fine(c);
  });
  caso("Sussurro illusorio: 1d6, Indebolito e una Copia a ogni colpo a segno (15/11)", () => {
    const a = illusionista(), n = nemico({ stati: { indebolito: { liv: 1, turni: 1 } } }), c = ctx([10, 4, 3]);
    S.usa(a, n, "sussurro_illusorio", c); eq([n.pv, a.copie], [16, 1]); fine(c);
    const a2 = illusionista(), n2 = nemico(), c2 = ctx([10, 4, 3]); S.usa(a2, n2, "sussurro_illusorio", c2); eq(a2.copie, 1, "anche senza Indebolito");
  });
  caso("Frantumare: 1d6 per Copia + Mente una volta, senza tiro; con 3 Copie anche Esposto", () => {
    const a = illusionista({ copie: 3 }), n = nemico(), c = ctx([1, 1, 1, 2]); S.usa(a, n, "frantumare", c);
    eq([n.pv, a.copie], [14, 0], "20 − (3 + 3)"); vero(P.ha(n, "esposto")); fine(c);
  });
  caso("Labirinto: TS di Mente → Stordito; nasce una Copia", () => {
    const a = illusionista(), n = nemico(), c = ctx([5]); const r = S.usa(a, n, "labirinto", c);
    eq(ev(r, "ts")[0].attr, "Mente"); vero(P.ha(n, "stordito")); eq(a.copie, 1); fine(c);
  });
  caso("Sdoppiamento: 2 Copie e +2 CA", () => { const a = illusionista(); S.usa(a, nemico(), "sdoppiamento", ctx([])); eq([a.copie, S.ca(a)], [2, 14]); });
  caso("Incubo: 2d8 + Mente + 1d6 per Copia (non le consuma); TS Spirito → Impaurito", () => {
    const a = illusionista({ copie: 2 }), n = nemico(), c = ctx([1, 1, 1, 1, 2]); S.usa(a, n, "incubo", c);
    eq([n.pv, a.copie], [13, 2]); vero(P.ha(n, "impaurito")); fine(c);
  });
  caso("Dado truccato: il nemico tira due d20 e tiene il peggiore (3 turni, 2 sui boss)", () => {
    const a = illusionista(), n = nemico(); S.usa(a, n, "dado_truccato", ctx([]));
    const c = ctx([18, 2]); eq(S.attacco(n, a, {}, c).ok, false); fine(c); eq(n.svantaggio, 3);
    const b = nemico({ boss: true }); S.usa(illusionista(), b, "dado_truccato", ctx([])); eq(b.svantaggio, 2);
  });
  caso("Teatro di specchi: Copie al massimo; ogni Copia distrutta esplode con 1d6 su chi l'ha colpita", () => {
    const a = illusionista(), n = nemico(); S.usa(a, n, "teatro_di_specchi", ctx([])); eq(a.copie, 3);
    const c = ctx([18, 2, 3, 4]); S.attacco(n, a, {}, c); eq([a.pv, n.pv, a.copie], [22, 16, 2]); fine(c);
  });
  caso("Specchio rotto: la prossima Copia distrutta rimanda il danno pieno (metà sui boss)", () => {
    const a = illusionista(), n = nemico(); S.usa(a, n, "specchio_rotto", ctx([]));
    const c = ctx([18, 6, 3]); S.attacco(n, a, {}, c); eq([a.pv, n.pv, a.specchio], [20, 13, false]); fine(c);
  });
  caso("Il Grande Inganno: serve almeno una Copia; 2d8 per Copia + Mente una volta, svantaggio per 2 turni", () => {
    eq(S.disponibile(illusionista(), "grande_inganno").motivo, "senzaCopie");
    const a = illusionista({ copie: 2 }), n = nemico(), c = ctx([1, 1, 1, 1]); S.usa(a, n, "grande_inganno", c);
    eq([n.pv, a.copie, n.svantaggio], [13, 0, 2], "20 − (4 + 3)"); fine(c);
  });

  caso("Catalogo: ogni potere dell'Arcanista è implementato; i tipi sono forza e psichico", () => {
    const sp = SP.SPEC.Sapiente, ids = new Set([sp.classe.privilegi[5]]);
    ["realta", "illusione"].forEach(k => SP.tuttiDi(sp[k]).forEach(i => ids.add(i)));
    ids.forEach(id => { const r = S.usa(illusionista({ copie: 1 }), nemico({ pv: 99, pvMax: 99 }), id, { tira: (d) => Math.min(d, 10) }); eq(ev(r, "nonImplementato").length, 0, id); });
    const r = S.usa(illusionista(), nemico(), "dardo_fantasma", ctx([10, 1])); eq(ev(r, "attacco")[0].tipo, "psichico");
    eq(SP.sceltaValida("Sapiente", "illusione", ["dardo_fantasma", "riflessi", "labirinto", "incubo"], 1).ok, true);
    eq(SP.sceltaValida("Sapiente", "realta", ["dardo_fantasma", "riflessi", "labirinto", "incubo"]).motivo, "estranei");
  });

  function esegui() { return casi.map(({ nome, fn }) => { try { fn(); return { nome, ok: true }; } catch (e) { return { nome, ok: false, errore: e.message }; } }); }
  root.TestScontroArcanista = { esegui, casi };
  if (inNode && require.main === module) {
    const esiti = esegui();
    esiti.forEach(e => console.log(`${e.ok ? "OK    " : "ERRORE"} ${e.nome}${e.ok ? "" : "\n       → " + e.errore}`));
    const ko = esiti.filter(e => !e.ok).length;
    console.log(`\n${esiti.length - ko} / ${esiti.length} superati`);
    process.exit(ko ? 1 : 0);
  }
})(typeof window !== "undefined" ? window : globalThis);
