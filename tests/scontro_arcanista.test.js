/* Test dell'Arcanista (Sangue, Illusione) sul motore nuovo. Dadi programmati. Uso: node tests/scontro_arcanista.test.js */
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
    caBase: 12, focus: { dado: 8, bonus: 0 }, arma: { dado: 6, tipo: "contundente" }, tratti: [], spec: "sangue" }, o || {});
  const illusionista = (o) => arcanista({ spec: "illusione", ...(o || {}) });
  const nemico = (o) => Object.assign({ nome: "nem", liv: 1, pv: 20, pvMax: 20, modAtt: 2, modDanno: 1, mod: {}, caBase: 12, arma: { dado: 6, tipo: "taglio" } }, o || {});
  const sangue = (liv, turni) => ({ sanguinante: { liv, turni, tipo: "sangue" } });
  const ev = (r, k) => (r.eventi || r).filter(e => e && e.k === k);

  const casi = [];
  const caso = (nome, fn) => casi.push({ nome, fn });
  const eq = (a, b, msg) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${msg || "atteso"}: ${JSON.stringify(b)}, ottenuto ${JSON.stringify(a)}`); };
  const vero = (x, msg) => { if (!x) throw new Error(msg || "atteso vero"); };

  /* ===== Sangue ===== */
  caso("Stilo cremisi: dado del focus + Mente, Sanguinante di tipo sangue", () => {
    const a = arcanista(), n = nemico(), c = ctx([10, 5, 3]); S.usa(a, n, "stilo_cremisi", c);
    eq([n.pv, n.stati.sanguinante.tipo], [12, "sangue"]); fine(c);
  });
  caso("Focus: il suo bonus vale per colpire e per i danni degli incantesimi", () => {
    const a = arcanista({ focus: { dado: 8, bonus: 2 } }), n = nemico(), c = ctx([8, 5, 15]); S.usa(a, n, "stilo_cremisi", c); eq(n.pv, 10); fine(c);
  });
  caso("Il tipo sangue segue le vulnerabilità (Enea: Sangue ✓)", () => {
    const a = arcanista(), n = nemico({ res: { sangue: "vuln" } }), c = ctx([10, 5, 15]); S.usa(a, n, "stilo_cremisi", c); eq(n.pv, 8); fine(c);
  });
  caso("Sangue versato: sopra il 50% paghi 3 salute per +1 dado, una volta per turno", () => {
    const a = arcanista(), n = nemico({ pv: 40, pvMax: 40 });
    const c = ctx([10, 5, 5, 15]); S.usa(a, n, "stilo_cremisi", c, { sangueVersato: true }); eq([a.pv, n.pv], [21, 27]); fine(c);
    const c2 = ctx([10, 5, 15]); S.usa(a, n, "stilo_cremisi", c2, { sangueVersato: true }); eq([a.pv, n.pv], [21, 19], "già pagato in questo turno"); fine(c2);
    S.inizioTurno(a, n, ctx([])); const c3 = ctx([10, 1, 1, 15]); S.usa(a, n, "stilo_cremisi", c3, { sangueVersato: true }); eq(a.pv, 18); fine(c3);
  });
  caso("Sangue versato: da Vacillante il dado in più è gratis (anche senza chiederlo)", () => {
    const a = arcanista({ pv: 10 }), n = nemico(), c = ctx([10, 1, 1, 15]); S.usa(a, n, "stilo_cremisi", c); eq([a.pv, n.pv], [10, 15]); fine(c);
  });
  caso("Frusta cremisi: 1d4 senza tiro, Indebolito; il sanguinamento dura 1 turno in più", () => {
    const a = arcanista(), n = nemico({ stati: sangue(1, 2) }), c = ctx([3, 2]); S.usa(a, n, "frusta_cremisi", c);
    eq([n.pv, n.stati.sanguinante.turni], [17, 3]); vero(P.ha(n, "indebolito")); fine(c);
  });
  caso("Crosta: +2 CA; chi ti colpisce diventa Sanguinante", () => {
    const a = arcanista(), n = nemico(), c = ctx([18, 3, 2]); S.usa(a, n, "crosta", c); eq(S.ca(a), 14);
    S.attacco(n, a, {}, c); vero(P.ha(n, "sanguinante")); fine(c);
  });
  caso("Ebollizione: un dado in più, aggrava; se era già Emorragia ti curi 1d6", () => {
    const a = arcanista({ pv: 20 }), n = nemico({ stati: sangue(2, 2) }), c = ctx([10, 1, 1, 4]); S.usa(a, n, "ebollizione", c);
    eq([n.pv, a.pv, n.stati.sanguinante.turni], [15, 24, 3]); fine(c);
  });
  caso("Meteora di sangue: critico con 19 se il bersaglio sanguina, Esposto", () => {
    const a = arcanista(), n = nemico({ stati: sangue(1, 2) }), c = ctx([19, 1, 1, 1, 1, 2]);
    const r = S.usa(a, n, "meteora_di_sangue", c); vero(ev(r, "attacco")[0].crit); eq(n.pv, 13); vero(P.ha(n, "esposto")); fine(c);
  });
  caso("Ali cremisi: metà danno (per eccesso) e il sanguinamento di chi colpisce", () => {
    const a = arcanista({ pv: 24 }), n = nemico(), c = ctx([18, 6, 2]); S.usa(a, n, "ali_cremisi", ctx([]));
    S.attacco(n, a, {}, c); eq(a.pv, 20); vero(P.ha(n, "sanguinante")); fine(c);
  });
  caso("Cuore spezzato: il doppio dei turni rimasti subito, lo stato finisce, ti curi della metà", () => {
    const a = arcanista({ pv: 10 }), n = nemico({ stati: sangue(1, 2) }), c = ctx([1, 1, 1, 1, 1, 1]);
    S.usa(a, n, "cuore_spezzato", c); eq([n.pv, a.pv], [14, 13]); vero(!P.ha(n, "sanguinante")); fine(c);
  });
  caso("Sangue in piena: un dado in più, ogni colpo aggrava; l'Emorragia del nemico ti cura 1", () => {
    const a = arcanista(), n = nemico({ pv: 40, pvMax: 40, stati: sangue(1, 2) }); S.usa(a, n, "sangue_in_piena", ctx([]));
    const c = ctx([10, 1, 1, 3]); S.usa(a, n, "stilo_cremisi", c); eq([n.pv, n.stati.sanguinante.liv], [35, 2]); fine(c);
    a.pv = 10; S.inizioTurno(n, a, ctx([2])); eq(a.pv, 11);
  });
  caso("Vincolo di sangue: TS Spirito; il bersaglio subisce la metà del danno che subisci tu", () => {
    const a = arcanista(), n = nemico(); const c = ctx([5]); const r = S.usa(a, n, "vincolo_di_sangue", c);
    eq(ev(r, "ts")[0].attr, "Spirito"); fine(c);
    const c2 = ctx([18, 3]); S.attacco(n, a, {}, c2); eq([a.pv, n.pv], [20, 18]); fine(c2);
  });
  caso("Costellazione rossa: tre sfere da 1d6 all'inizio dei tuoi turni; la terza aggrava", () => {
    const a = arcanista(), n = nemico({ pv: 40, pvMax: 40 }); S.usa(a, n, "costellazione_rossa", ctx([]));
    const c = ctx([4, 5, 4, 5, 4]); S.inizioTurno(a, n, c); S.inizioTurno(a, n, c); S.inizioTurno(a, n, c);
    eq([n.pv, n.stati.sanguinante.liv], [28, 2]); vero(!a.buff.costellazione); fine(c);
  });
  caso("Marea cremisi: 4d8 + Mente senza tiro, aggrava; se era già Emorragia dura 6 turni", () => {
    const a = arcanista(), n = nemico({ stati: sangue(2, 1) }), c = ctx([1, 1, 1, 1]); S.usa(a, n, "marea_cremisi", c);
    eq([n.pv, n.stati.sanguinante.turni], [13, 6]); fine(c);
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
    S.usa(a, n, "ebollizione", ctx([1])); eq(S.disponibile(a, "ebollizione").ok, false);
    S.attacco(n, a, {}, ctx([18, 1])); eq(S.disponibile(a, "ebollizione").ok, true); vero(a.scintillaUsata);
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
  caso("Sussurro illusorio: 1d6, Indebolito; se era già Indebolito nasce una Copia", () => {
    const a = illusionista(), n = nemico({ stati: { indebolito: { liv: 1, turni: 1 } } }), c = ctx([10, 4, 3]);
    S.usa(a, n, "sussurro_illusorio", c); eq([n.pv, a.copie], [16, 1]); fine(c);
  });
  caso("Frantumare: 1d8 + Mente per Copia senza tiro; con 3 Copie anche Esposto", () => {
    const a = illusionista({ copie: 3 }), n = nemico(), c = ctx([1, 1, 1, 2]); S.usa(a, n, "frantumare", c);
    eq([n.pv, a.copie], [8, 0]); vero(P.ha(n, "esposto")); fine(c);
  });
  caso("Labirinto: TS di Mente → Stordito; nasce una Copia", () => {
    const a = illusionista(), n = nemico(), c = ctx([5]); const r = S.usa(a, n, "labirinto", c);
    eq(ev(r, "ts")[0].attr, "Mente"); vero(P.ha(n, "stordito")); eq(a.copie, 1); fine(c);
  });
  caso("Sdoppiamento: 2 Copie e +2 CA", () => { const a = illusionista(); S.usa(a, nemico(), "sdoppiamento", ctx([])); eq([a.copie, S.ca(a)], [2, 14]); });
  caso("Incubo: 2d8 + Mente + 1d8 per Copia (non le consuma); TS Spirito → Impaurito", () => {
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
  caso("Il Grande Inganno: serve almeno una Copia; 2d10 + Mente per Copia, svantaggio per 2 turni", () => {
    eq(S.disponibile(illusionista(), "grande_inganno").motivo, "senzaCopie");
    const a = illusionista({ copie: 2 }), n = nemico(), c = ctx([1, 1, 1, 1]); S.usa(a, n, "grande_inganno", c);
    eq([n.pv, a.copie, n.svantaggio], [10, 0, 2]); fine(c);
  });

  caso("Catalogo: ogni potere dell'Arcanista è implementato e la scelta di creazione funziona", () => {
    const sp = SP.SPEC.Sapiente, ids = new Set([sp.classe.potere]);
    ["sangue", "illusione"].forEach(k => { const x = sp[k]; SP.tuttiDi(x).forEach(i => ids.add(i)); });
    ids.forEach(id => { const r = S.usa(illusionista({ copie: 1 }), nemico({ pv: 99, pvMax: 99 }), id, { tira: (d) => Math.min(d, 10) }); eq(ev(r, "nonImplementato").length, 0, id); });
    eq(SP.sceltaValida("Sapiente", "illusione", ["frantumare", "labirinto", "incubo"], 3).ok, true);
    eq(SP.sceltaValida("Sapiente", "sangue", ["frantumare", "ebollizione", "cuore_spezzato"]).motivo, "estranei");
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
