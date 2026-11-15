/* Test del Monaco (Sangue, Ossa) sul motore nuovo. Dadi programmati. Uso: node tests/scontro_monaco.test.js */
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
  /* Monaco: Spirito +3, spada (taglio d6), focus d8, CA 14, salute 26 */
  const monaco = (o) => Object.assign({ nome: "pg", liv: 1, pv: 26, pvMax: 26, modClasse: 3, mod: { Vigore: 1, "Agilità": 0, Mente: 0, Spirito: 3 },
    caBase: 14, arma: { dado: 6, tipo: "taglio" }, focus: { dado: 8, bonus: 0 }, tratti: [], spec: "sangue" }, o || {});
  const ossomante = (o) => monaco({ spec: "ossa", ...(o || {}) });
  const nemico = (o) => Object.assign({ nome: "nem", liv: 1, pv: 20, pvMax: 20, modAtt: 2, modDanno: 1, mod: {}, caBase: 12, arma: { dado: 6, tipo: "taglio" } }, o || {});
  const sangue = (liv, turni) => ({ sanguinante: { liv, turni, tipo: "sangue" } });
  const ev = (r, k) => (r.eventi || r).filter(e => e && e.k === k);

  const casi = [];
  const caso = (nome, fn) => casi.push({ nome, fn });
  const eq = (a, b, msg) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${msg || "atteso"}: ${JSON.stringify(b)}, ottenuto ${JSON.stringify(a)}`); };
  const vero = (x, msg) => { if (!x) throw new Error(msg || "atteso vero"); };

  /* ===== Sangue (dall'Arcanista l'11/11: Spirito, niente cure) ===== */
  caso("Dardo di sangue: dado dell'arma (d8 con il focus) + Spirito, Sanguinante di tipo sangue", () => {
    const a = monaco(), n = nemico(), c = ctx([10, 5, 3]); S.usa(a, n, "dardo_di_sangue", c);
    eq([n.pv, n.stati.sanguinante.tipo], [12, "sangue"]); fine(c);
  });
  caso("Il tipo sangue segue le vulnerabilità (Enea: Sangue ✓)", () => {
    const a = monaco(), n = nemico({ res: { sangue: "vuln" } }), c = ctx([10, 5, 15]); S.usa(a, n, "dardo_di_sangue", c); eq(n.pv, 8); fine(c);
  });
  caso("Sangue versato: sopra il 50% paghi il 10% della salute massima (per eccesso) per +1 dado, una volta per turno", () => {
    const a = monaco(), n = nemico({ pv: 40, pvMax: 40 });
    const c = ctx([10, 5, 5, 15]); S.usa(a, n, "dardo_di_sangue", c, { sangueVersato: true }); eq([a.pv, n.pv], [23, 27]); fine(c);
    const c2 = ctx([10, 5, 15]); S.usa(a, n, "dardo_di_sangue", c2, { sangueVersato: true }); eq([a.pv, n.pv], [23, 19], "già pagato in questo turno"); fine(c2);
    S.inizioTurno(a, n, ctx([])); const c3 = ctx([10, 1, 1, 15]); S.usa(a, n, "dardo_di_sangue", c3, { sangueVersato: true }); eq(a.pv, 20); fine(c3);
    const g = monaco({ pv: 50, pvMax: 50 }), c4 = ctx([10, 1, 1, 15]); S.usa(g, nemico(), "dardo_di_sangue", c4, { sangueVersato: true }); eq(g.pv, 45, "50 → 5"); fine(c4);
  });
  caso("Sangue versato: da Vacillante il dado in più è gratis (anche senza chiederlo)", () => {
    const a = monaco({ pv: 10 }), n = nemico(), c = ctx([10, 1, 1, 15]); S.usa(a, n, "dardo_di_sangue", c); eq([a.pv, n.pv], [10, 15]); fine(c);
  });
  caso("Frusta cremisi: 1d4 senza tiro, Indebolito; il sanguinamento dura 1 turno in più", () => {
    const a = monaco(), n = nemico({ stati: sangue(1, 2) }), c = ctx([3, 2]); S.usa(a, n, "frusta_cremisi", c);
    eq([n.pv, n.stati.sanguinante.turni], [17, 3]); vero(P.ha(n, "indebolito")); fine(c);
  });
  caso("Crosta: +2 CA; chi ti colpisce diventa Sanguinante", () => {
    const a = monaco(), n = nemico(), c = ctx([18, 3, 2]); S.usa(a, n, "crosta", c); eq(S.ca(a), 16);
    S.attacco(n, a, {}, c); vero(P.ha(n, "sanguinante")); fine(c);
  });
  caso("Ebollizione: un dado in più, aggrava; niente cura", () => {
    const a = monaco({ pv: 20 }), n = nemico({ stati: sangue(2, 2) }), c = ctx([10, 1, 1]); S.usa(a, n, "ebollizione", c);
    eq([n.pv, a.pv, n.stati.sanguinante.turni], [15, 20, 3]); fine(c);
  });
  caso("Meteora di sangue: critico con 19 se il bersaglio sanguina, Esposto", () => {
    const a = monaco(), n = nemico({ stati: sangue(1, 2) }), c = ctx([19, 1, 1, 1, 1, 2]);
    const r = S.usa(a, n, "meteora_di_sangue", c); vero(ev(r, "attacco")[0].crit); eq(n.pv, 13); vero(P.ha(n, "esposto")); fine(c);
  });
  caso("Lancia di sangue: due dadi in più; con Sangue versato tre", () => {
    const n = nemico(), c = ctx([10, 1, 1, 1]); S.usa(monaco(), n, "lancia_di_sangue", c); eq(n.pv, 14); fine(c);
    const a = monaco(), m = nemico(), c2 = ctx([10, 1, 1, 1, 1]); S.usa(a, m, "lancia_di_sangue", c2, { sangueVersato: true }); eq([m.pv, a.pv], [13, 23]); fine(c2);
  });
  caso("Cuore spezzato: il doppio dei turni rimasti subito, lo stato finisce; niente cura", () => {
    const a = monaco({ pv: 10 }), n = nemico({ stati: sangue(1, 2) }), c = ctx([1, 1, 1, 1, 1, 1]);
    S.usa(a, n, "cuore_spezzato", c); eq([n.pv, a.pv], [14, 10]); vero(!P.ha(n, "sanguinante")); fine(c);
  });
  caso("Sangue in piena: un dado in più, ogni colpo aggrava; l'Emorragia non cura più", () => {
    const a = monaco(), n = nemico({ pv: 40, pvMax: 40, stati: sangue(1, 2) }); S.usa(a, n, "sangue_in_piena", ctx([]));
    const c = ctx([10, 1, 1, 3]); S.usa(a, n, "dardo_di_sangue", c); eq([n.pv, n.stati.sanguinante.liv], [35, 2]); fine(c);
    a.pv = 10; S.inizioTurno(n, a, ctx([2])); eq(a.pv, 10);
  });
  caso("Vincolo di sangue: TS Spirito; il bersaglio subisce la metà del danno che subisci tu", () => {
    const a = monaco(), n = nemico(); const c = ctx([5]); const r = S.usa(a, n, "vincolo_di_sangue", c);
    eq(ev(r, "ts")[0].attr, "Spirito"); fine(c);
    const c2 = ctx([18, 3]); S.attacco(n, a, {}, c2); eq([a.pv, n.pv], [22, 18]); fine(c2);
  });
  caso("Costellazione rossa: tre sfere da 1d6 all'inizio dei tuoi turni; la terza aggrava", () => {
    const a = monaco(), n = nemico({ pv: 40, pvMax: 40 }); S.usa(a, n, "costellazione_rossa", ctx([]));
    const c = ctx([4, 5, 4, 5, 4]); S.inizioTurno(a, n, c); S.inizioTurno(a, n, c); S.inizioTurno(a, n, c);
    eq([n.pv, n.stati.sanguinante.liv], [28, 2]); vero(!a.buff.costellazione); fine(c);
  });
  caso("Marea cremisi: 4d8 + Spirito senza tiro, aggrava; se era già Emorragia dura 6 turni", () => {
    const a = monaco(), n = nemico({ stati: sangue(2, 1) }), c = ctx([1, 1, 1, 1]); S.usa(a, n, "marea_cremisi", c);
    eq([n.pv, n.stati.sanguinante.turni], [13, 6]); fine(c);
  });

  /* ===== Ossa ===== */
  caso("Lancia d'ossa: focus, critico con 19; Gabbia d'ossa → Stordito", () => {
    const n = nemico(), c = ctx([19, 1, 1, 3]); const r = S.usa(ossomante(), n, "lancia_d_ossa", c);
    vero(ev(r, "attacco")[0].crit); eq(n.pv, 15); vero(P.ha(n, "stordito")); fine(c);
  });
  caso("Spine d'ossa: 1d6, Indebolito; nasce una placca anche se manca", () => {
    const o = ossomante(), n = nemico(), c = ctx([10, 3, 2]); S.usa(o, n, "spine_d_ossa", c); eq([n.pv, o.placche], [17, 1]); vero(P.ha(n, "indebolito")); fine(c);
    const o2 = ossomante(), c2 = ctx([1]); S.usa(o2, nemico(), "spine_d_ossa", c2); eq(o2.placche, 1); fine(c2);
  });
  caso("Armatura d'ossa: 1d4 senza tiro, +2 CA, nasce una placca", () => {
    const o = ossomante(), n = nemico(), c = ctx([2]); S.usa(o, n, "armatura_d_ossa", c); eq([n.pv, S.ca(o), o.placche], [18, 16, 1]); fine(c);
  });
  caso("Placche: una si spezza a ogni colpo e riduce di 3 + 1 per livello oltre il primo", () => {
    const o = ossomante({ placche: 1 }), n = nemico(), c = ctx([18, 6]); S.attacco(n, o, {}, c); eq([o.pv, o.placche], [22, 0]); fine(c);
    const o3 = ossomante({ liv: 3, placche: 2 }), c3 = ctx([18, 6]); S.attacco(n, o3, {}, c3); eq([o3.pv, o3.placche], [24, 1]); fine(c3);
  });
  caso("Spirito d'ossa: serve almeno una placca; 1d8 per placca + Spirito una volta", () => {
    eq(S.disponibile(ossomante(), "spirito_d_ossa").motivo, "senzaPlacche");
    const o = ossomante({ placche: 3 }), n = nemico(), c = ctx([1, 1, 1]); S.usa(o, n, "spirito_d_ossa", c); eq([n.pv, o.placche], [14, 0], "20 − (3 + 3)");
    const visti = [], o2 = ossomante({ placche: 2 }); S.usa(o2, nemico(), "spirito_d_ossa", { tira: (d) => { visti.push(d); return 1; } }); eq(visti, [8, 8], "un d8 per placca"); fine(c);
  });
  caso("Lama d'osso: spendi una placca, due dadi in più; se colpisce la placca torna", () => {
    const o = ossomante({ placche: 1 }), n = nemico(), c = ctx([10, 1, 1, 1]); S.usa(o, n, "lama_d_osso", c); eq([n.pv, o.placche], [14, 1]); fine(c);
  });
  caso("Barricata di costole: placche al massimo; il prossimo attacco del nemico ha −2", () => {
    const o = ossomante(), n = nemico(); S.usa(o, n, "barricata_di_costole", ctx([])); eq(o.placche, 3);
    const c = ctx([12]); eq(S.attacco(n, o, {}, c).ok, false, "12 + 2 − 2 = 12 contro 14"); eq(n.malusProssimo, 0); fine(c);
  });
  caso("Prigione d'ossa: TS → Stordito; Esposto in ogni caso", () => {
    const n = nemico(), c = ctx([5]); S.usa(ossomante(), n, "prigione_d_ossa", c); vero(P.ha(n, "stordito") && P.ha(n, "esposto")); fine(c);
    const n2 = nemico(), c2 = ctx([15]); S.usa(ossomante(), n2, "prigione_d_ossa", c2); vero(!P.ha(n2, "stordito") && P.ha(n2, "esposto")); fine(c2);
  });
  caso("Armatura del sepolcro: all'inizio dei tuoi 3 turni placche al massimo", () => {
    const o = ossomante(), n = nemico(); S.usa(o, n, "armatura_del_sepolcro", ctx([]));
    const v = ctx([]); S.inizioTurno(o, n, v); eq(o.placche, 3); o.placche = 0; S.inizioTurno(o, n, v); S.inizioTurno(o, n, v); eq(o.placche, 3); vero(!o.buff.sepolcro);
  });
  caso("Armatura spezzata: ogni placca spezzata fa 1d6 a chi l'ha colpita", () => {
    const o = ossomante({ placche: 1 }), n = nemico(); S.usa(o, n, "armatura_spezzata", ctx([]));
    const c = ctx([18, 6, 4]); S.attacco(n, o, {}, c); eq(n.pv, 16); fine(c);
  });
  caso("Decrepitezza: un TS → Indebolito ed Esposto insieme; nasce una placca", () => {
    const o = ossomante(), n = nemico(), c = ctx([5]); S.usa(o, n, "decrepitezza", c); vero(P.ha(n, "indebolito") && P.ha(n, "esposto")); eq(o.placche, 1); fine(c);
  });
  caso("Armata dei morti: 4d8 + Spirito senza consumare le placche, Stordito", () => {
    const o = ossomante({ placche: 2 }), n = nemico(), c = ctx([1, 1, 1, 1, 2]); S.usa(o, n, "armata_dei_morti", c);
    eq([n.pv, o.placche], [13, 2]); vero(P.ha(n, "stordito")); fine(c);
  });

  /* ===== Classe e tratti ===== */
  caso("Tocco lenitivo: 1/4 della salute e togli uno stato", () => {
    const m = monaco({ pv: 10, stati: { sanguinante: { liv: 1, turni: 2 } } }); S.usa(m, nemico(), "tocco_lenitivo", ctx([]));
    eq(m.pv, 16); vero(!P.ha(m, "sanguinante"));
  });
  caso("Ultimo servizio: una volta al giorno, a 0 resti a 1 e ti curi 1d6 + Spirito", () => {
    const m = monaco({ pv: 3, tratti: ["ultimo_servizio"] }), n = nemico(), c = ctx([18, 6, 2]); S.attacco(n, m, {}, c); eq(m.pv, 6); fine(c);
    m.pv = 3; S.attacco(n, m, {}, ctx([18, 6])); eq(m.pv, 0, "già usato oggi");
  });
  caso("Eredità del sepolcro: dopo un giornaliero, fino al tuo turno dimezzi i danni", () => {
    const m = monaco({ tratti: ["eredita_sepolcro"] }), n = nemico({ pv: 99, pvMax: 99 }); S.usa(m, n, "marea_cremisi", ctx([1, 1, 1, 1, 15]));
    const c = ctx([18, 6]); S.attacco(n, m, {}, c); eq(m.pv, 22); fine(c);
  });

  caso("Catalogo: ogni potere del Monaco è implementato e la scelta di creazione funziona", () => {
    const sp = SP.SPEC.Accolito, ids = new Set([sp.classe.privilegi[5]]);
    ["sangue", "ossa"].forEach(k => SP.tuttiDi(sp[k]).forEach(i => ids.add(i)));
    ids.forEach(id => { const r = S.usa(ossomante({ placche: 1 }), nemico({ pv: 99, pvMax: 99 }), id, { tira: (d) => Math.min(d, 10) }); eq(ev(r, "nonImplementato").length, 0, id); });
    eq(SP.sceltaValida("Accolito", "ossa", ["lancia_d_ossa", "spine_d_ossa", "spirito_d_ossa", "prigione_d_ossa"], 1).ok, true);
    vero(!SP.SPEC.Accolito.purificatore && !SP.POTERI.colpo_consacrato, "il Purificatore non c'è più");
  });
  caso("Tutte le classi: 8 specializzazioni, ognuna 3 + 3 + 2 + 3 poteri, tutti nel catalogo", () => {
    let n = 0;
    Object.values(SP.SPEC).forEach(cl => Object.keys(cl).filter(k => k !== "classe").forEach(k => {
      const x = cl[k]; n++;
      eq([x.volonta.length, x.scontro.length, x.giornalieri.length, Object.keys(x.fissi).length], [3, 3, 2, 3], x.nome);
      SP.tuttiDi(x).forEach(id => vero(SP.POTERI[id], "manca " + id));
    }));
    eq(n, 8);
  });

  function esegui() { return casi.map(({ nome, fn }) => { try { fn(); return { nome, ok: true }; } catch (e) { return { nome, ok: false, errore: e.message }; } }); }
  root.TestScontroMonaco = { esegui, casi };
  if (inNode && require.main === module) {
    const esiti = esegui();
    esiti.forEach(e => console.log(`${e.ok ? "OK    " : "ERRORE"} ${e.nome}${e.ok ? "" : "\n       → " + e.errore}`));
    const ko = esiti.filter(e => !e.ok).length;
    console.log(`\n${esiti.length - ko} / ${esiti.length} superati`);
    process.exit(ko ? 1 : 0);
  }
})(typeof window !== "undefined" ? window : globalThis);
