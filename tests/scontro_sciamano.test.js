/* Test dello Sciamano (Funghi, Legno) sul motore nuovo. Dadi programmati. Uso: node tests/scontro_sciamano.test.js */
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
  /* Sciamano: Agilità +3, mazza (contundente d6), CA 14, salute 30 */
  const sciamano = (o) => Object.assign({ nome: "pg", liv: 1, pv: 30, pvMax: 30, modClasse: 3, mod: { Vigore: 1, "Agilità": 3, Mente: 0, Spirito: 1 },
    caBase: 14, arma: { dado: 6, tipo: "contundente" }, tratti: [], spec: "funghi" }, o || {});
  const nemico = (o) => Object.assign({ nome: "nem", liv: 1, pv: 20, pvMax: 20, modAtt: 2, modDanno: 1, mod: {}, caBase: 12, arma: { dado: 6, tipo: "taglio" } }, o || {});
  const veleno = (liv, turni) => ({ intossicato: { liv, turni, tipo: "veleno" } });
  const ev = (r, k) => (r.eventi || r).filter(e => e && e.k === k);

  const casi = [];
  const caso = (nome, fn) => casi.push({ nome, fn });
  const eq = (a, b, msg) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${msg || "atteso"}: ${JSON.stringify(b)}, ottenuto ${JSON.stringify(a)}`); };
  const vero = (x, msg) => { if (!x) throw new Error(msg || "atteso vero"); };

  /* ===== In comune e tratti ===== */
  caso("Puntura di mandragora: dado + Agilità, applica Intossicato (3 turni)", () => {
    const s = sciamano(), n = nemico(), c = ctx([10, 4, 5]); S.usa(s, n, "puntura_di_mandragora", c);
    eq([n.pv, n.stati.intossicato.turni], [13, 3]); fine(c);
  });
  caso("Legame del sottobosco: gli stati da 3 turni che applichi durano 4 (non Stordito né Impaurito)", () => {
    const s = sciamano({ tratti: ["legame_sottobosco"] }), n = nemico(), c = ctx([10, 4, 5]); S.usa(s, n, "puntura_di_mandragora", c);
    eq(n.stati.intossicato.turni, 4); fine(c);
    const l = sciamano({ tratti: ["legame_sottobosco"], spec: "legno" }), m = nemico(), c2 = ctx([10, 3, 2]); S.usa(l, m, "radice_inchiodante", c2);
    eq(m.stati.indebolito.turni, 4); fine(c2);
    const m2 = nemico(), c3 = ctx([10, 3, 2]); S.usa(l, m2, "colpo_di_nodo", c3); eq(m2.stati.stordito.turni, 1); fine(c3);
  });
  caso("Tappeto di micelio: solo il dado, Indebolito; il veleno dura 1 turno in più", () => {
    const s = sciamano(), n = nemico({ stati: veleno(1, 2) }), c = ctx([10, 3, 2]); S.usa(s, n, "tappeto_di_micelio", c);
    eq([n.pv, n.stati.intossicato.turni], [17, 3]); vero(P.ha(n, "indebolito")); fine(c);
  });
  caso("Radici profonde: +1d4 se il bersaglio ha uno stato, qualsiasi (11/11)", () => {
    const s = sciamano({ tratti: ["radici_profonde"] }), n = nemico({ stati: veleno(2, 3) }), c = ctx([10, 2, 3, 5]);
    S.usa(s, n, "puntura_di_mandragora", c); eq(n.pv, 12); fine(c);
    const m = nemico({ stati: { indebolito: { liv: 1, turni: 2 } } }), c2 = ctx([10, 2, 3, 15]); S.usa(s, m, "puntura_di_mandragora", c2); eq(m.pv, 12); fine(c2);
  });
  caso("Funghi: il danno dei poteri è veleno, qualunque sia l'arma", () => {
    const s = sciamano(), n = nemico({ res: { veleno: "res" } }), c = ctx([10, 4, 15]); const r = S.usa(s, n, "puntura_di_mandragora", c);
    eq([ev(r, "attacco")[0].tipo, n.pv], ["veleno", 16]); fine(c);
  });
  caso("Infuso (privilegio del livello 5): azione rapida, cura 1/4 (+50% con Mani che curano); al riposo massimo 2", () => {
    const s = sciamano({ pv: 10, elisir: 2, liv: 5 }), n = nemico(); const r = S.usa(s, n, "bevi_elisir", ctx([])); eq([s.pv, s.elisir, ev(r, "potere")[0].rapida], [17, 1, true]);
    eq(S.disponibile(s, "bevi_elisir").motivo, "rapidaUsata", "una rapida per turno");
    S.inizioTurno(s, n, ctx([])); eq(S.disponibile(s, "bevi_elisir").ok, true);
    s.elisir = 0; eq(S.disponibile(s, "bevi_elisir").motivo, "senzaElisir");
    S.preparaInfuso(s); S.preparaInfuso(s); S.preparaInfuso(s); eq(s.elisir, 2);
    const g = sciamano({ liv: 3, via: "guendalina", pv: 10, elisir: 1 }); S.usa(g, n, "bevi_elisir", ctx([])); eq(g.pv, 21);
    const z = sciamano({ elisir: 1, stati: { stordito: { liv: 1, turni: 1 } } }); eq(S.disponibile(z, "bevi_elisir").motivo, "rapidaUsata", "lo stordito perde anche la rapida");
  });

  /* ===== Funghi ===== */
  caso("Pelle di micelio: +2 CA; chi ti colpisce diventa Intossicato", () => {
    const s = sciamano(), n = nemico(), c = ctx([18, 3, 2]); S.usa(s, n, "pelle_di_micelio", c); eq(S.ca(s), 16);
    S.attacco(n, s, {}, c); eq(s.pv, 26); vero(P.ha(n, "intossicato")); fine(c);
  });
  caso("Spore del morbo: un dado in più, aggrava il veleno", () => {
    const s = sciamano(), n = nemico({ stati: veleno(1, 1) }), c = ctx([10, 1, 1]); S.usa(s, n, "spore_del_morbo", c);
    eq(n.stati.intossicato.liv, 2); eq(P.nomeStato("intossicato", 2), "Avvelenato"); fine(c);
  });
  caso("Muffa che dilaga: per i tuoi 3 turni ogni colpo applica Intossicato o allunga il veleno", () => {
    const s = sciamano(), n = nemico({ pv: 40, pvMax: 40 }); S.usa(s, n, "muffa_che_dilaga", ctx([]));
    const c = ctx([10, 2, 3, 10, 2]); S.attacco(s, n, {}, c); eq(n.stati.intossicato.turni, 3); S.attacco(s, n, {}, c); eq(n.stati.intossicato.turni, 4); fine(c);
    const v = ctx([]); S.inizioTurno(s, n, v); S.inizioTurno(s, n, v); S.inizioTurno(s, n, v); vero(!!s.buff.muffa, "ancora attiva al terzo turno");
    S.inizioTurno(s, n, v); vero(!s.buff.muffa, "finita");
  });
  caso("Esalazione: senza tiro per colpire, un TS → Indebolito e Stordito; Intossicato in ogni caso", () => {
    const n = nemico(), c = ctx([5]); S.usa(sciamano(), n, "esalazione", c);
    vero(P.ha(n, "indebolito") && P.ha(n, "stordito") && P.ha(n, "intossicato")); fine(c);
    const n2 = nemico(), c2 = ctx([15]); S.usa(sciamano(), n2, "esalazione", c2);
    vero(!P.ha(n2, "indebolito") && !P.ha(n2, "stordito") && P.ha(n2, "intossicato"), "TS riuscito: solo il veleno"); fine(c2);
    const b = nemico({ boss: true }), c3 = ctx([5]); S.usa(sciamano(), b, "esalazione", c3);
    vero(P.ha(b, "indebolito") && !P.ha(b, "stordito"), "sul boss niente stordimento"); fine(c3);
  });
  caso("Cuore di tossina: aggrava, subisce subito i turni rimasti, il veleno riparte grave", () => {
    const n = nemico({ stati: veleno(1, 2) }), c = ctx([2, 2, 2]); S.usa(sciamano(), n, "cuore_di_tossina", c);
    eq([n.pv, n.stati.intossicato.liv, n.stati.intossicato.turni], [14, 2, 3]); fine(c);
  });
  caso("Cuore di tossina con Pestilenza: tanti turni quanti ne sono passati, massimo 5", () => {
    const n = nemico({ pv: 40, pvMax: 40, stati: veleno(2, 3), velenoPerenne: true, pestilenzaTurni: 7 }), c = ctx([1, 1, 1, 1, 1]);
    S.usa(sciamano(), n, "cuore_di_tossina", c); eq(n.pv, 35); fine(c);
  });
  caso("Pestilenza: il veleno non scade; si contano i turni", () => {
    const n = nemico({ stati: veleno(1, 1) }); S.usa(sciamano(), n, "pestilenza", ctx([]));
    S.fineTurno(n); S.fineTurno(n); eq([n.stati.intossicato.turni, n.pestilenzaTurni], [1, 2]);
  });
  caso("Sciame putrido: all'inizio dei tuoi 3 turni 1d6 e applica (poi aggrava) il veleno", () => {
    const s = sciamano(), n = nemico({ pv: 40, pvMax: 40 }); S.usa(s, n, "sciame_putrido", ctx([]));
    const c = ctx([4, 5, 4, 4]); S.inizioTurno(s, n, c); vero(P.ha(n, "intossicato")); S.inizioTurno(s, n, c); eq(n.stati.intossicato.liv, 2);
    S.inizioTurno(s, n, c); vero(!s.buff.sciame); eq(n.pv, 28); fine(c);
  });
  caso("Cisti parassita: al prossimo attacco del nemico aggrava e fa subito un turno di veleno", () => {
    const s = sciamano(), n = nemico({ stati: veleno(1, 2) }); S.usa(s, n, "cisti_parassita", ctx([]));
    const c = ctx([3, 1]); S.attacco(n, s, {}, c); eq([n.stati.intossicato.liv, n.pv, s.pv], [2, 17, 30]); vero(!s.buff.cisti); fine(c);
  });
  caso("Marea di putrefazione: il veleno tira il doppio dei dadi per 3 turni (4 se Vacillante)", () => {
    const n = nemico({ stati: veleno(1, 2) }); S.usa(sciamano(), n, "marea_di_putrefazione", ctx([]));
    eq(n.stati.intossicato.doppio, 3); const c = ctx([2, 3]); S.inizioTurno(n, null, c); eq(n.pv, 15); fine(c);
    const n2 = nemico({ pv: 9, stati: veleno(1, 2) }); S.usa(sciamano(), n2, "marea_di_putrefazione", ctx([])); eq(n2.stati.intossicato.doppio, 4);
  });

  /* ===== Linfa ===== */
  /* ===== Legno (contundente, scudi di PF) ===== */
  const legno = (o) => sciamano({ spec: "legno", ...(o || {}) });
  caso("Colpo di nodo: dado dell'arma + Agilità, contundente; Stordito", () => {
    const s = legno(), n = nemico(), c = ctx([10, 4, 5]); const r = S.usa(s, n, "colpo_di_nodo", c);
    eq([n.pv, ev(r, "attacco")[0].tipo], [13, "contundente"]); vero(P.ha(n, "stordito")); fine(c);
  });
  caso("Radice inchiodante: solo il dado, Indebolito; su un Commosso dura 1 turno in più", () => {
    const s = legno(), n = nemico({ stati: { stordito: { liv: 2, turni: 2 } } }), c = ctx([10, 3, 2]); S.usa(s, n, "radice_inchiodante", c);
    eq([n.pv, n.stati.indebolito.turni], [17, 4]); fine(c);
  });
  caso("Corteccia viva: scudo di 5 + livello fino al tuo turno; se assorbe tutto il colpo, chi colpisce è Indebolito", () => {
    const s = legno(), n = nemico(); S.usa(s, n, "corteccia_viva", ctx([])); eq(s.scudoPF.pf, 6);
    const c = ctx([18, 3, 2]); S.attacco(n, s, {}, c); eq([s.pv, s.scudoPF.pf, s.dannoSubitoTurno || 0], [30, 2, 0]); vero(P.ha(n, "indebolito")); fine(c);
    S.inizioTurno(s, n, ctx([])); eq(s.scudoPF, null, "finisce al tuo turno");
    eq(legno({ liv: 5 }).liv + 5, 10);
  });
  caso("Corteccia viva: un colpo più grosso dello scudo passa in parte; niente Indebolito", () => {
    const s = legno(), n = nemico({ modDanno: 5 }); S.usa(s, n, "corteccia_viva", ctx([]));
    const c = ctx([18, 4]); S.attacco(n, s, {}, c); eq([s.pv, s.scudoPF], [27, null]); vero(!P.ha(n, "indebolito")); fine(c);
  });
  caso("Radici avvolgenti: scudo di 5 + 2 × livello per 3 turni, +2 CA, nemico Indebolito; Scorza viva +2 a ogni tuo turno", () => {
    const s = legno(), n = nemico(), c = ctx([2]); S.usa(s, n, "radici_avvolgenti", c); eq([s.scudoPF.pf, S.ca(s)], [7, 16]); vero(P.ha(n, "indebolito")); fine(c);
    const c2 = ctx([18, 3]); S.attacco(n, s, {}, c2); eq(s.scudoPF.pf, 3); fine(c2);
    S.inizioTurno(s, n, ctx([])); eq(s.scudoPF.pf, 5); S.inizioTurno(s, n, ctx([])); eq(s.scudoPF.pf, 7);
    S.inizioTurno(s, n, ctx([])); eq(s.scudoPF, null, "dopo 3 turni del nemico finisce");
    eq(P.creaScudo(legno({ scudoPF: { nome: "x", pf: 3, max: 3, turni: 2 } }), "corteccia_viva", 6).k, "scudoRifiutato");
  });
  caso("Pugno di quercia: un dado in più, aggrava Stordito in Commosso", () => {
    const s = legno(), n = nemico({ stati: { stordito: { liv: 1, turni: 1 } } }), c = ctx([10, 1, 1]); S.usa(s, n, "pugno_di_quercia", c);
    eq([n.pv, n.stati.stordito.liv, P.nomeStato("stordito", 2)], [15, 2, "Commosso"]); fine(c);
  });
  caso("Ghianda esplosiva: al prossimo attacco del nemico 1d6 senza tiro e aggrava lo stato contundente", () => {
    const s = legno(), n = nemico(); S.usa(s, n, "ghianda_esplosiva", ctx([]));
    const c = ctx([4, 2, 5]); S.attacco(n, s, {}, c); eq(n.pv, 16); vero(P.ha(n, "stordito")); vero(!s.buff.ghianda); fine(c);
  });
  caso("Corteccia nuova: lo scudo attivo torna al massimo; chi ti ha colpito per ultimo è Indebolito", () => {
    const s = legno({ colpitoUltimo: true, scudoPF: { nome: "radici_avvolgenti", pf: 2, max: 7, turni: 2 } }), n = nemico(), c = ctx([2]);
    S.usa(s, n, "corteccia_nuova", c); eq(s.scudoPF.pf, 7); vero(P.ha(n, "indebolito")); fine(c);
    const t = legno(); S.usa(t, nemico(), "corteccia_nuova", ctx([])); eq(t.scudoPF.pf, 6, "senza scudo nasce quello a volontà");
  });
  caso("Corazza di quercia: aggrava il contundente; scudo di 5 + 3 × livello e +2 CA per tutto lo scontro", () => {
    const s = legno({ liv: 2, scudoPF: { nome: "corteccia_viva", pf: 1, max: 7, turni: null } }), n = nemico(), c = ctx([2]);
    S.usa(s, n, "corazza_di_quercia", c); eq([s.scudoPF.pf, S.ca(s)], [11, 16]); vero(P.ha(n, "stordito")); fine(c);
    [1, 2, 3, 4, 5].forEach(() => S.inizioTurno(s, n, ctx([]))); eq([s.scudoPF.pf, S.ca(s)], [11, 16]);
    S.fineScontro(s); eq(s.scudoPF, null);
  });
  caso("Pioggia di rami: a inizio dei tuoi 3 turni 1d6 contundente senza tiro, applica poi aggrava", () => {
    const s = legno(), n = nemico({ pv: 30, pvMax: 30 }); S.usa(s, n, "pioggia_di_rami", ctx([]));
    const c = ctx([4, 2, 4, 4]); S.inizioTurno(s, n, c); S.inizioTurno(s, n, c); eq(n.stati.stordito.liv, 2); S.inizioTurno(s, n, c);
    eq(n.pv, 18); vero(!s.buff.rami); fine(c);
  });
  caso("Radice madre: Scorza viva recupera 4; Foresta che avanza: due dadi in più, aggrava, scudo pieno per 3 turni", () => {
    const s = legno({ scudoPF: { nome: "radici_avvolgenti", pf: 1, max: 7, turni: 3 } }), n = nemico({ pv: 40, pvMax: 40 });
    S.usa(s, n, "radice_madre", ctx([])); S.inizioTurno(s, n, ctx([])); eq(s.scudoPF.pf, 5);
    const c = ctx([10, 1, 1, 1, 2]); S.usa(s, n, "foresta_che_avanza", c); eq(n.pv, 34); vero(P.ha(n, "stordito")); fine(c);
    s.scudoPF.pf = 1; S.inizioTurno(s, n, ctx([])); eq(s.scudoPF.pf, 7);
  });
  caso("Gli scudi assorbono anche i danni continuativi", () => {
    const s = legno({ stati: { sanguinante: { liv: 1, turni: 2 } } }), n = nemico(); S.usa(s, n, "radici_avvolgenti", ctx([15]));
    S.inizioTurno(s, n, ctx([3])); eq([s.pv, s.scudoPF.pf], [30, 6]);
  });

  caso("Catalogo: ogni potere dello Sciamano è implementato e la scelta di creazione funziona", () => {
    const sp = SP.SPEC.Forestiero, ids = new Set([sp.classe.privilegi[5]]);
    ["funghi", "legno"].forEach(k => SP.tuttiDi(sp[k]).forEach(i => ids.add(i)));
    ids.forEach(id => { const r = S.usa(sciamano({ elisir: 1 }), nemico({ pv: 99, pvMax: 99 }), id, { tira: (d) => Math.min(d, 10) }); eq(ev(r, "nonImplementato").length, 0, id); });
    eq(SP.sceltaValida("Forestiero", "legno", ["colpo_di_nodo", "corteccia_viva", "pugno_di_quercia", "corazza_di_quercia"], 1).ok, true);
    eq(SP.sceltaValida("Forestiero", "legno", ["colpo_di_nodo", "corteccia_viva", "spore_del_morbo", "corazza_di_quercia"]).motivo, "estranei");
  });

  function esegui() { return casi.map(({ nome, fn }) => { try { fn(); return { nome, ok: true }; } catch (e) { return { nome, ok: false, errore: e.message }; } }); }
  root.TestScontroSciamano = { esegui, casi };
  if (inNode && require.main === module) {
    const esiti = esegui();
    esiti.forEach(e => console.log(`${e.ok ? "OK    " : "ERRORE"} ${e.nome}${e.ok ? "" : "\n       → " + e.errore}`));
    const ko = esiti.filter(e => !e.ok).length;
    console.log(`\n${esiti.length - ko} / ${esiti.length} superati`);
    process.exit(ko ? 1 : 0);
  }
})(typeof window !== "undefined" ? window : globalThis);
