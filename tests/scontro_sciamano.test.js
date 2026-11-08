/* Test dello Sciamano (Spore, Linfa) sul motore nuovo. Dadi programmati. Uso: node tests/scontro_sciamano.test.js */
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
    caBase: 14, arma: { dado: 6, tipo: "contundente" }, tratti: [], spec: "spore" }, o || {});
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
  caso("Legame del sottobosco: i veleni durano 4 turni", () => {
    const s = sciamano({ tratti: ["legame_sottobosco"] }), n = nemico(), c = ctx([10, 4, 5]); S.usa(s, n, "puntura_di_mandragora", c);
    eq(n.stati.intossicato.turni, 4); fine(c);
  });
  caso("Tappeto di micelio: solo il dado, Indebolito; il veleno dura 1 turno in più", () => {
    const s = sciamano(), n = nemico({ stati: veleno(1, 2) }), c = ctx([10, 3, 2]); S.usa(s, n, "tappeto_di_micelio", c);
    eq([n.pv, n.stati.intossicato.turni], [17, 3]); vero(P.ha(n, "indebolito")); fine(c);
  });
  caso("Radici profonde: +1d4 contro un Avvelenato", () => {
    const s = sciamano({ tratti: ["radici_profonde"] }), n = nemico({ stati: veleno(2, 3) }), c = ctx([10, 2, 3, 5]);
    S.usa(s, n, "puntura_di_mandragora", c); eq(n.pv, 12); fine(c);
  });
  caso("Infuso: bere costa l'azione e cura 1/4; senza elisir è rifiutato; al riposo massimo 2 (3 con Mani che curano)", () => {
    const s = sciamano({ pv: 10, elisir: 1 }); S.usa(s, nemico(), "bevi_elisir", ctx([])); eq([s.pv, s.elisir], [17, 0]);
    eq(S.disponibile(s, "bevi_elisir").motivo, "senzaElisir");
    S.preparaInfuso(s); S.preparaInfuso(s); S.preparaInfuso(s); eq(s.elisir, 2);
    const g = sciamano({ liv: 4, via: "guendalina" }); [1, 2, 3, 4].forEach(() => S.preparaInfuso(g)); eq(g.elisir, 3);
  });

  /* ===== Spore ===== */
  caso("Pelle di corteccia: +2 CA; chi ti colpisce diventa Intossicato", () => {
    const s = sciamano(), n = nemico(), c = ctx([18, 3, 2]); S.usa(s, n, "pelle_di_corteccia", c); eq(S.ca(s), 16);
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
  caso("Balsamo della linfa: ogni turno di veleno sul nemico cura 1 (2 se Avvelenato, doppio con Cuore di linfa)", () => {
    const s = sciamano({ spec: "linfa", pv: 10 }), n = nemico({ stati: veleno(1, 3) });
    S.inizioTurno(n, s, ctx([2])); eq(s.pv, 11);
    n.stati.intossicato.liv = 2; S.inizioTurno(n, s, ctx([2])); eq(s.pv, 13);
    s.buff.cuoreLinfa = { turni: 3 }; S.inizioTurno(n, s, ctx([2])); eq(s.pv, 17);
    S.inizioTurno(n, sciamano({ spec: "spore", pv: 10 }), ctx([2])); /* le Spore non si curano */
  });
  caso("Cuore di linfa: aggrava e il Balsamo raddoppia per 3 turni del nemico", () => {
    const s = sciamano({ spec: "linfa" }), n = nemico({ stati: veleno(1, 3) }); S.usa(s, n, "cuore_di_linfa", ctx([]));
    eq([n.stati.intossicato.liv, s.buff.cuoreLinfa.turni], [2, 3]);
  });
  caso("Linfa perenne: ogni cura del Balsamo allunga il veleno di 1 turno, massimo 3 volte", () => {
    const s = sciamano({ spec: "linfa", pv: 10 }), n = nemico({ pv: 40, pvMax: 40, stati: veleno(1, 3) }); S.usa(s, n, "linfa_perenne", ctx([]));
    const c = ctx([1, 1, 1, 1]); for (let i = 0; i < 4; i++) S.inizioTurno(n, s, c);
    eq([s.buff.linfaPerenne.usi, n.stati.intossicato.turni, s.pv], [3, 6, 14]); fine(c);
  });
  caso("Corteccia viva: se il nemico ti manca, il suo veleno torna a durata piena", () => {
    const s = sciamano({ spec: "linfa" }), n = nemico({ stati: veleno(1, 1) }); S.usa(s, n, "corteccia_viva", ctx([]));
    const c = ctx([1]); S.attacco(n, s, {}, c); eq(n.stati.intossicato.turni, 3); fine(c);
  });
  caso("Baccello esplosivo: al prossimo attacco del nemico aggrava il veleno ed Esposto", () => {
    const s = sciamano({ spec: "linfa" }), n = nemico({ stati: veleno(1, 2) }); S.usa(s, n, "baccello_esplosivo", ctx([]));
    const c = ctx([2, 1]); S.attacco(n, s, {}, c); eq(n.stati.intossicato.liv, 2); vero(P.ha(n, "esposto")); fine(c);
  });
  caso("Radici avvolgenti: Indebolito, il veleno +1 turno, +2 CA fino al tuo turno", () => {
    const s = sciamano({ spec: "linfa" }), n = nemico({ stati: veleno(1, 2) }), c = ctx([3]); S.usa(s, n, "radici_avvolgenti", c);
    vero(P.ha(n, "indebolito")); eq([n.stati.intossicato.turni, S.ca(s)], [3, 16]); fine(c);
  });
  caso("Fioritura del parassita: 1d6 a ogni turno del nemico; al terzo esplode per 2d6 e aggrava", () => {
    const s = sciamano({ spec: "linfa" }), n = nemico({ pv: 30, pvMax: 30 }); S.usa(s, n, "fioritura_del_parassita", ctx([]));
    const c = ctx([2, 2, 2, 3, 3, 5]); S.inizioTurno(n, s, c); S.inizioTurno(n, s, c); S.inizioTurno(n, s, c);
    eq(n.pv, 18); vero(P.ha(n, "intossicato")); eq(n.bulbo, null); fine(c);
  });
  caso("Purga: aggrava il veleno e togli tutti i tuoi stati", () => {
    const s = sciamano({ spec: "linfa", stati: { sanguinante: { liv: 2, turni: 3 }, esposto: { liv: 1, turni: 2 } } }), n = nemico({ stati: veleno(1, 2) });
    S.usa(s, n, "purga", ctx([])); vero(!P.ha(s, "sanguinante") && !P.ha(s, "esposto")); eq(n.stati.intossicato.liv, 2);
  });
  caso("Rinascita del sottobosco: aggrava a durata piena, pulisce e cura un dado per turno rimasto", () => {
    const s = sciamano({ spec: "linfa", pv: 10, stati: { stordito: { liv: 2, turni: 2 } } }), n = nemico({ stati: veleno(2, 1) }), c = ctx([1, 1, 1]);
    S.usa(s, n, "rinascita_del_sottobosco", c); eq([s.pv, n.stati.intossicato.turni], [13, 3]); vero(!P.ha(s, "stordito")); fine(c);
  });

  caso("Catalogo: ogni potere dello Sciamano è implementato e la scelta di creazione funziona", () => {
    const sp = SP.SPEC.Forestiero, ids = new Set([sp.classe.potere]);
    ["spore", "linfa"].forEach(k => { const x = sp[k]; [...x.volonta, ...x.scontro, ...x.giornalieri, ...Object.values(x.livelli)].forEach(i => ids.add(i)); });
    ids.forEach(id => { const r = S.usa(sciamano({ elisir: 1 }), nemico({ pv: 99, pvMax: 99 }), id, { tira: (d) => Math.min(d, 10) }); eq(ev(r, "nonImplementato").length, 0, id); });
    eq(SP.sceltaValida("Forestiero", "linfa", ["baccello_esplosivo", "linfa_amara", "cuore_di_linfa"]).ok, true);
    eq(SP.sceltaValida("Forestiero", "linfa", ["spore_del_morbo", "linfa_amara", "cuore_di_linfa"]).motivo, "estranei");
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
