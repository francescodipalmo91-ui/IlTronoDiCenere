/* Test del Monaco (Purificatore, Ossomante) sul motore nuovo. Dadi programmati. Uso: node tests/scontro_monaco.test.js */
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
    caBase: 14, arma: { dado: 6, tipo: "taglio" }, focus: { dado: 8, bonus: 0 }, tratti: [], spec: "purificatore" }, o || {});
  const ossomante = (o) => monaco({ spec: "ossomante", ...(o || {}) });
  const nemico = (o) => Object.assign({ nome: "nem", liv: 1, pv: 20, pvMax: 20, modAtt: 2, modDanno: 1, mod: {}, caBase: 12, arma: { dado: 6, tipo: "taglio" } }, o || {});
  const fuoco = (liv, turni) => ({ scottato: { liv, turni, tipo: "fuoco_sacro" } });
  const ev = (r, k) => (r.eventi || r).filter(e => e && e.k === k);

  const casi = [];
  const caso = (nome, fn) => casi.push({ nome, fn });
  const eq = (a, b, msg) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${msg || "atteso"}: ${JSON.stringify(b)}, ottenuto ${JSON.stringify(a)}`); };
  const vero = (x, msg) => { if (!x) throw new Error(msg || "atteso vero"); };

  /* ===== Purificatore ===== */
  caso("Colpo consacrato: Scottato di fuoco sacro al posto dello stato dell'arma; +1d4 contro i maledetti", () => {
    const m = monaco(), n = nemico(), c = ctx([10, 4, 2]); S.usa(m, n, "colpo_consacrato", c);
    eq([n.pv, n.stati.scottato.tipo], [13, "fuoco_sacro"]); vero(!P.ha(n, "sanguinante")); fine(c);
    const n2 = nemico({ maledetto: true }), c2 = ctx([10, 4, 3, 15]); S.usa(monaco(), n2, "colpo_consacrato", c2); eq(n2.pv, 10); fine(c2);
  });
  caso("Il fuoco sacro passa l'immunità al fuoco comune (mastini) e ne segue la vulnerabilità", () => {
    const n = nemico({ res: { fuoco: "imm", fuoco_sacro: "vuln" }, stati: fuoco(1, 3) });
    S.inizioTurno(n, monaco(), ctx([4])); eq(n.pv, 14);
  });
  caso("Marchio del rogo: 1d6, Indebolito; la bruciatura dura 1 turno in più", () => {
    const n = nemico({ stati: fuoco(1, 2) }), c = ctx([10, 4, 2]); S.usa(monaco(), n, "marchio_del_rogo", c);
    eq([n.pv, n.stati.scottato.turni], [16, 3]); vero(P.ha(n, "indebolito")); fine(c);
  });
  caso("Aura purificante: il primo stato che subiresti brucia via (senza TS)", () => {
    const m = monaco(), n = nemico(); S.usa(m, n, "aura_purificante", ctx([])); eq(S.ca(m), 16);
    const c = ctx([18, 3]); const r = S.usa(n, m, "colpo_di_mestiere", c);
    eq(ev(r, "purificato").length, 1); vero(!P.ha(m, "sanguinante")); vero(!m.buff.aura); fine(c);
  });
  caso("Rogo: un dado in più, aggrava la bruciatura", () => {
    const n = nemico({ stati: fuoco(1, 2) }), c = ctx([10, 1, 1]); S.usa(monaco(), n, "rogo", c); eq(n.stati.scottato.liv, 2); fine(c);
  });
  caso("Arma benedetta: per i tuoi 3 turni +1d4 e ogni colpo applica Scottato", () => {
    const m = monaco(), n = nemico(); S.usa(m, n, "arma_benedetta", ctx([]));
    const c = ctx([10, 2, 3, 4]); S.attacco(m, n, {}, c); eq(n.pv, 12); vero(P.ha(n, "scottato")); fine(c);
  });
  caso("Fiamma calda: ti curi 1d8 + Spirito; chi ti colpisce diventa Scottato", () => {
    const m = monaco({ pv: 10 }), n = nemico(), c = ctx([5, 18, 3, 2]); S.usa(m, n, "fiamma_calda", c); eq(m.pv, 18);
    S.attacco(n, m, {}, c); eq(m.pv, 14); vero(P.ha(n, "scottato")); fine(c);
  });
  caso("Pira: 3d8 + Spirito senza tiro, aggrava; se era già Ustionato anche Esposto", () => {
    const n = nemico({ stati: fuoco(2, 1) }), c = ctx([1, 1, 1, 2]); S.usa(monaco(), n, "pira", c);
    eq([n.pv, n.stati.scottato.turni], [14, 3]); vero(P.ha(n, "esposto")); fine(c);
  });
  caso("Fuoco che cura: la cura in eccesso colpisce il nemico come fuoco sacro", () => {
    const m = monaco({ pv: 24 }), n = nemico(), c = ctx([2, 2, 2]); S.usa(m, n, "fuoco_che_cura", c); eq([m.pv, n.pv], [26, 13]); fine(c);
  });
  caso("Consacrazione: niente stati; ogni stato ti ritorna contro come Scottato (poi aggrava)", () => {
    const m = monaco(), n = nemico({ pv: 40, pvMax: 40 }); S.usa(m, n, "consacrazione", ctx([]));
    const c = ctx([18, 3, 2, 18, 3]); S.usa(n, m, "colpo_di_mestiere", c); vero(!P.ha(m, "sanguinante")); eq(n.stati.scottato.liv, 1);
    delete n.usati.scontro.colpo_di_mestiere; S.usa(n, m, "colpo_di_mestiere", c); eq(n.stati.scottato.liv, 2); fine(c);
  });
  caso("Martello del giudizio: aggrava insieme la bruciatura e lo stato dell'arma", () => {
    const n = nemico({ stati: { ...fuoco(1, 2), sanguinante: { liv: 1, turni: 2, tipo: "taglio" } } }), c = ctx([10, 1, 1]);
    S.usa(monaco(), n, "martello_del_giudizio", c); eq([n.stati.scottato.liv, n.stati.sanguinante.liv], [2, 2]); fine(c);
  });
  caso("Rogo purificatore: 4d8 + Spirito, aggrava, ti pulisce; su un Ustionato la bruciatura dura tutto lo scontro", () => {
    const m = monaco({ stati: { indebolito: { liv: 1, turni: 2 } } }), n = nemico({ stati: fuoco(2, 1) }), c = ctx([1, 1, 1, 1]);
    S.usa(m, n, "rogo_purificatore", c); eq([n.pv, n.stati.scottato.turni], [13, 99]); vero(!P.ha(m, "indebolito")); fine(c);
  });

  /* ===== Ossomante ===== */
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
  caso("Spirito d'ossa: serve almeno una placca; 1d8 + Spirito per placca", () => {
    eq(S.disponibile(ossomante(), "spirito_d_ossa").motivo, "senzaPlacche");
    const o = ossomante({ placche: 3 }), n = nemico(), c = ctx([1, 1, 1]); S.usa(o, n, "spirito_d_ossa", c); eq([n.pv, o.placche], [8, 0]); fine(c);
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
  caso("Armata dei morti: 4d8 + Spirito + 1d8 per placca (consumate), Stordito", () => {
    const o = ossomante({ placche: 2 }), n = nemico(), c = ctx([1, 1, 1, 1, 1, 1, 2]); S.usa(o, n, "armata_dei_morti", c);
    eq([n.pv, o.placche], [11, 0]); vero(P.ha(n, "stordito")); fine(c);
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
    const m = monaco({ tratti: ["eredita_sepolcro"] }), n = nemico({ pv: 99, pvMax: 99 }); S.usa(m, n, "pira", ctx([1, 1, 1, 15]));
    const c = ctx([18, 6]); S.attacco(n, m, {}, c); eq(m.pv, 22); fine(c);
  });

  caso("Catalogo: ogni potere del Monaco è implementato e la scelta di creazione funziona", () => {
    const sp = SP.SPEC.Accolito, ids = new Set([sp.classe.potere]);
    ["purificatore", "ossomante"].forEach(k => { const x = sp[k]; [...x.volonta, ...x.scontro, ...x.giornalieri, ...Object.values(x.livelli)].forEach(i => ids.add(i)); });
    ids.forEach(id => { const r = S.usa(ossomante({ placche: 1 }), nemico({ pv: 99, pvMax: 99 }), id, { tira: (d) => Math.min(d, 10) }); eq(ev(r, "nonImplementato").length, 0, id); });
    eq(SP.sceltaValida("Accolito", "ossomante", ["spirito_d_ossa", "lama_d_osso", "prigione_d_ossa"]).ok, true);
  });
  caso("Tutte le classi: 8 specializzazioni, ognuna 3 + 3 + 2 + 3 poteri, tutti nel catalogo", () => {
    let n = 0;
    Object.values(SP.SPEC).forEach(cl => Object.keys(cl).filter(k => k !== "classe").forEach(k => {
      const x = cl[k]; n++;
      eq([x.volonta.length, x.scontro.length, x.giornalieri.length, Object.keys(x.livelli).length], [3, 3, 2, 3], x.nome);
      [...x.volonta, ...x.scontro, ...x.giornalieri, ...Object.values(x.livelli)].forEach(id => vero(SP.POTERI[id], "manca " + id));
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
