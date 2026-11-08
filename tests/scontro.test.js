/* Test del Guerriero sul motore nuovo (js/scontro.js + js/specializzazioni.js). Dadi programmati.
   Uso: node tests/scontro.test.js */
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
  /* Guerriero: Vigore +3, spada (taglio d6), CA 16, salute 30 */
  const guerriero = (o) => Object.assign({ nome: "pg", liv: 1, pv: 30, pvMax: 30, modClasse: 3, mod: { Vigore: 3, "Agilità": 1, Mente: 0, Spirito: 0 },
    caBase: 16, arma: { dado: 6, tipo: "taglio" }, tratti: [] }, o || {});
  /* nemico comune: +2 a colpire, 1d6 + 1, CA 12, salute 20, caratteristiche a +0 (TS = d20 + 1 contro CD 12) */
  const nemico = (o) => Object.assign({ nome: "nem", liv: 1, pv: 20, pvMax: 20, modAtt: 2, modDanno: 1, mod: {}, caBase: 12, arma: { dado: 6, tipo: "contundente" } }, o || {});
  const ev = (r, k) => (r.eventi || r).filter(e => e && e.k === k);

  const casi = [];
  const caso = (nome, fn) => casi.push({ nome, fn });
  const eq = (a, b, msg) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${msg || "atteso"}: ${JSON.stringify(b)}, ottenuto ${JSON.stringify(a)}`); };
  const vero = (x, msg) => { if (!x) throw new Error(msg || "atteso vero"); };

  /* ===== Attacco ===== */
  caso("Attacco: d20 + mod deve superare la CA (uguale non basta)", () => {
    const g = guerriero(), n = nemico(), c = ctx([9]);
    eq(S.attacco(g, n, {}, c).ok, false, "9 + 3 = 12 contro CA 12"); fine(c);
  });
  caso("Colpo poderoso: dado + Vigore; +2 se il bersaglio ha già uno stato", () => {
    const g = guerriero(), n = nemico(), c = ctx([10, 4]);
    S.usa(g, n, "colpo_poderoso", c); eq(n.pv, 13);
    n.stati = { sanguinante: { liv: 1, turni: 2, tipo: "taglio" } };
    const c2 = ctx([10, 4]); S.usa(g, n, "colpo_poderoso", c2); eq(n.pv, 4); fine(c); fine(c2);
  });
  caso("Colpo di mestiere: solo il dado, applica lo stato dell'arma con TS", () => {
    const g = guerriero(), n = nemico(), c = ctx([10, 5, 5]);
    S.usa(g, n, "colpo_di_mestiere", c); eq(n.pv, 15); vero(P.ha(n, "sanguinante")); fine(c);
  });
  caso("L'arma colora lo stato: contundente → Stordito, il nemico perde il turno", () => {
    const g = guerriero({ arma: { dado: 6, tipo: "contundente" } }), n = nemico(), c = ctx([10, 2, 3]);
    S.usa(g, n, "colpo_di_mestiere", c); vero(P.ha(n, "stordito"));
    eq(ev(S.inizioTurno(n, g, c), "perdeAzione").length, 1); fine(c);
  });
  caso("Perforante: critico con 19, il critico raddoppia i dadi", () => {
    const g = guerriero({ arma: { dado: 6, tipo: "perforante" } }), n = nemico(), c = ctx([19, 2, 2]);
    const r = S.attacco(g, n, {}, c); vero(r.crit); eq(n.pv, 13); fine(c);
  });
  caso("Scoperto: critico con 19 anche con il taglio; Indebolito −2 per colpire", () => {
    const g = guerriero(), n = nemico({ stati: { esposto: { liv: 2, turni: 3 } } }), c = ctx([19, 1, 1]);
    vero(S.attacco(g, n, {}, c).crit); fine(c);
    g.stati = { indebolito: { liv: 1, turni: 3 } }; const c2 = ctx([11]);
    eq(S.attacco(g, nemico(), {}, c2).ok, false, "11 + 3 − 2 = 12 contro 12"); fine(c2);
  });

  /* ===== Esecutore ===== */
  caso("Guardia feroce: +2 CA fino al tuo turno; mancato → contrattacco che applica lo stato", () => {
    const g = guerriero(), n = nemico(), c = ctx([15, 10, 3, 2]); /* 15 + 2 = 17 contro 18; contrattacco 10 + 3, danno 3, TS 2 */
    S.usa(g, n, "guardia_feroce", c); eq(S.ca(g), 18);
    const r = S.attacco(n, g, {}, c);
    eq(r.ok, false); eq(n.pv, 17); vero(P.ha(n, "sanguinante")); fine(c);
    S.inizioTurno(g, n, ctx([])); eq(S.ca(g), 16, "scaduta al tuo turno");
  });
  caso("Spezza-guardia: un dado in più, Esposto; per scontro una volta sola", () => {
    const g = guerriero(), n = nemico(), c = ctx([10, 3, 3, 2]);
    S.usa(g, n, "spezza_guardia", c); eq(n.pv, 11); vero(P.ha(n, "esposto")); fine(c);
    eq(S.usa(g, n, "spezza_guardia", ctx([])).rifiutato, true);
    S.fineScontro(g); eq(S.disponibile(g, "spezza_guardia").ok, true, "torna a fine scontro");
  });
  caso("Colpo crudele: aggrava lo stato dell'arma senza TS", () => {
    const g = guerriero(), n = nemico({ stati: { sanguinante: { liv: 1, turni: 1, tipo: "taglio" } } }), c = ctx([10, 1, 1]);
    S.usa(g, n, "colpo_crudele", c); eq(n.stati.sanguinante.liv, 2); fine(c);
  });
  caso("Caccia al ferito: contro un Vacillante due dadi in più e niente carica", () => {
    const g = guerriero(), n = nemico({ pv: 9 }), c = ctx([10, 1, 1, 1]);
    S.usa(g, n, "caccia_al_ferito", c); eq(n.pv, 3); eq(n.nonCarica, 1); fine(c);
  });
  caso("Colpo del boia: doppio dei dadi; contro un Vacillante critico automatico (senza tiro)", () => {
    const g = guerriero(), n = nemico({ pv: 30, pvMax: 30 }), c = ctx([10, 2, 2]);
    S.usa(g, n, "colpo_del_boia", c); eq(n.pv, 23); fine(c);
    const g2 = guerriero(), n2 = nemico({ pv: 9 }), c2 = ctx([1, 1, 1, 1]);
    S.usa(g2, n2, "colpo_del_boia", c2); eq(n2.pv, 2); fine(c2);
  });
  caso("Assalto implacabile: il primo applica, il secondo aggrava", () => {
    const g = guerriero(), n = nemico({ pv: 40, pvMax: 40 }), c = ctx([10, 1, 2, 10, 1]);
    S.usa(g, n, "assalto_implacabile", c); eq(n.stati.sanguinante.liv, 2); eq(n.pv, 32); fine(c);
  });
  caso("Marchio della preda: +1d4 a tutti i tuoi attacchi contro di lui", () => {
    const g = guerriero(), n = nemico(); S.usa(g, n, "marchio_della_preda", ctx([]));
    const c = ctx([10, 1, 4]); S.usa(g, n, "colpo_poderoso", c); eq(n.pv, 12); fine(c);
  });
  caso("Ferita riaperta: un dado per turno rimasto, poi lo stato finisce", () => {
    const g = guerriero(), n = nemico({ stati: { sanguinante: { liv: 1, turni: 2, tipo: "taglio" } } }), c = ctx([10, 1, 1, 1]);
    S.usa(g, n, "ferita_riaperta", c); eq(n.pv, 14); vero(!P.ha(n, "sanguinante")); fine(c);
  });
  caso("Sentenza: tre attacchi, tutti critici contro un Vacillante", () => {
    const g = guerriero(), n = nemico({ pv: 40, pvMax: 40 }); n.pv = 19;
    const c = ctx([1, 1, 1, 1, 1, 1]); S.usa(g, n, "sentenza", c); eq(n.pv, 4, "3 × (2 dadi da 1 + 3)"); fine(c);
  });

  /* ===== Sentinella ===== */
  caso("In guardia: +4 CA con lo scudo; mancato → contrattacco senza stato", () => {
    const g = guerriero({ scudo: true }), n = nemico(), c = ctx([17, 10, 2]);
    S.usa(g, n, "in_guardia", c); eq(S.ca(g), 20);
    S.attacco(n, g, {}, c); eq(n.pv, 18); vero(!P.ha(n, "sanguinante")); fine(c);
  });
  caso("Colpo di guardia: +2 se il nemico ti ha colpito nel suo ultimo turno", () => {
    const g = guerriero(), n = nemico(), c = ctx([18, 2, 10, 4]);
    S.attacco(n, g, {}, c); eq(g.pv, 27); S.usa(g, n, "colpo_di_guardia", c); eq(n.pv, 11); fine(c);
    S.inizioTurno(n, g, ctx([])); vero(!g.colpitoUltimo, "dimenticato al turno del nemico");
  });
  caso("Ritorsione: il primo colpo fa 0, contrattacco a danno pieno che aggrava (qui applica, TS)", () => {
    const g = guerriero(), n = nemico(), c = ctx([18, 10, 4, 3]);
    S.usa(g, n, "ritorsione", c); const r = S.attacco(n, g, {}, c);
    eq(g.pv, 30); vero(r.annullato); eq(n.pv, 13); vero(P.ha(n, "sanguinante")); fine(c);
  });
  caso("Rappresaglia: ogni colpo subito → contrattacco con il dado che applica lo stato", () => {
    const g = guerriero(), n = nemico(), c = ctx([18, 3, 10, 2, 4]);
    S.usa(g, n, "rappresaglia", c); S.attacco(n, g, {}, c);
    eq(g.pv, 26); eq(n.pv, 18); vero(P.ha(n, "sanguinante")); fine(c);
  });
  caso("Rintocco: stato dell'arma + Indebolito, +2 CA anche se manca", () => {
    const g = guerriero(), n = nemico(), c = ctx([10, 1, 2, 2]);
    S.usa(g, n, "rintocco", c); vero(P.ha(n, "sanguinante") && P.ha(n, "indebolito")); eq(S.ca(g), 18); fine(c);
  });
  caso("Veglia di ferro: +2 CA e +4 TS per 3 turni; In guardia contrattacca anche se colpito, e aggrava", () => {
    const g = guerriero(), n = nemico({ stati: { sanguinante: { liv: 1, turni: 3, tipo: "taglio" } } });
    S.usa(g, n, "veglia_di_ferro", ctx([])); eq([S.ca(g), g.bonusTs], [18, 4]);
    S.usa(g, n, "in_guardia", ctx([]));
    const c = ctx([19, 1, 10, 1]); S.attacco(n, g, {}, c); /* 19 + 2 = 21 > 20: colpito; contrattacco */
    eq(n.stati.sanguinante.liv, 2); fine(c);
    S.fineTurno(g); S.fineTurno(g); eq(g.bonusTs, 4); S.fineTurno(g); eq([g.bonusTs, S.ca(g)], [0, 18], "Veglia scaduta (In guardia resta fino al tuo turno)");
  });
  caso("Rivalsa: + metà del danno subito nell'ultimo turno del nemico (tutto da Vacillante)", () => {
    const g = guerriero({ dannoSubitoTurno: 9 }), n = nemico(), c = ctx([10, 1, 2]);
    S.usa(g, n, "rivalsa", c); eq(n.pv, 12); fine(c);
    const g2 = guerriero({ pv: 10, dannoSubitoTurno: 9 }), n2 = nemico({ pv: 30, pvMax: 30 }), c2 = ctx([10, 1, 2]);
    S.usa(g2, n2, "rivalsa", c2); eq(n2.pv, 17); fine(c2);
  });
  caso("Ultimo baluardo: il colpo che porterebbe a 0 lascia a 1; ogni colpo +1 dado al prossimo attacco", () => {
    const g = guerriero({ pv: 3 }), n = nemico({ pv: 40, pvMax: 40 }), c = ctx([18, 6]);
    S.usa(g, n, "ultimo_baluardo", ctx([])); S.attacco(n, g, {}, c); eq(g.pv, 1); eq(g.prossimiDadi, 1); fine(c);
    const c2 = ctx([10, 1, 1]); S.usa(g, n, "colpo_poderoso", c2); eq(n.pv, 35); eq(g.prossimiDadi, 0); fine(c2);
  });
  caso("Spezza-carica: il colpo pronto si perde e il nemico è Indebolito", () => {
    const g = guerriero(), n = nemico({ pronto: "colpo caricato" }), c = ctx([10, 1, 1, 2]);
    const r = S.usa(g, n, "spezza_carica", c); eq(ev(r, "caricaSpezzata").length, 1); eq(n.pronto, null); vero(P.ha(n, "indebolito")); fine(c);
  });
  caso("Silenzio della casa: due dadi in più, aggrava, niente cariche per 2 turni, +2 CA per 3", () => {
    const g = guerriero(), n = nemico({ pv: 40, pvMax: 40, stati: { sanguinante: { liv: 1, turni: 2, tipo: "taglio" } } }), c = ctx([10, 1, 1, 1]);
    S.usa(g, n, "silenzio_della_casa", c); eq([n.pv, n.stati.sanguinante.liv, n.nonCarica, S.ca(g)], [34, 2, 2, 18]); fine(c);
  });

  /* ===== Classe, tratti, regole d'uso ===== */
  caso("Secondo vento: 1/4 della salute massima (1/3 con Mani che curano, via di Guendalina dal 4)", () => {
    const g = guerriero({ pv: 10 }); S.usa(g, nemico(), "secondo_vento", ctx([])); eq(g.pv, 17);
    const g2 = guerriero({ pv: 10, liv: 4, via: "guendalina" }); S.usa(g2, nemico(), "secondo_vento", ctx([])); eq(g2.pv, 20);
  });
  caso("Furia (tratto II): da Vacillante +2 danni", () => {
    const g = guerriero({ pv: 10, tratti: ["furia"] }), n = nemico(), c = ctx([10, 1]); S.usa(g, n, "colpo_poderoso", c); eq(n.pv, 14); fine(c);
  });
  caso("Impaurito: niente per scontro né giornalieri", () => {
    const g = guerriero({ stati: { impaurito: { liv: 1, turni: 2 } } });
    eq(S.disponibile(g, "colpo_crudele").motivo, "impaurito"); eq(S.disponibile(g, "colpo_poderoso").ok, true);
  });
  caso("Giornalieri: una volta, tornano al riposo (non a fine scontro)", () => {
    const g = guerriero(), n = nemico({ pv: 99, pvMax: 99 }); S.usa(g, n, "colpo_del_boia", ctx([10, 1, 1]));
    S.fineScontro(g); eq(S.disponibile(g, "colpo_del_boia").motivo, "giaUsatoGiorno"); S.riposo(g); eq(S.disponibile(g, "colpo_del_boia").ok, true);
  });
  caso("Poteri preparati: un potere fuori dalla lista è rifiutato", () => {
    const g = guerriero({ poteri: ["colpo_poderoso"] }); eq(S.disponibile(g, "colpo_crudele").motivo, "nonPreparato");
  });
  caso("Scelta di creazione: 2 per scontro su 3, 1 giornaliero su 2, solo della propria specializzazione", () => {
    eq(SP.sceltaValida("Soldato", "esecutore", ["spezza_guardia", "colpo_crudele", "colpo_del_boia"]).ok, true);
    eq(SP.sceltaValida("Soldato", "esecutore", ["spezza_guardia", "colpo_del_boia"]).motivo, "scontro");
    eq(SP.sceltaValida("Soldato", "esecutore", ["spezza_guardia", "colpo_crudele", "rivalsa"]).motivo, "estranei");
  });
  caso("Poteri al livello: a volontà + scelti + fissi dei livelli 3-5 + potere di classe; tratti 1 e 4", () => {
    const l3 = SP.poteriAlLivello("Soldato", "sentinella", ["ritorsione", "rintocco", "rivalsa"], 3);
    eq(l3.length, 8); vero(l3.includes("ultimo_baluardo") && !l3.includes("spezza_carica") && l3.includes("secondo_vento"));
    eq(SP.poteriAlLivello("Soldato", "sentinella", ["ritorsione", "rintocco", "rivalsa"], 5).length, 10);
    eq(SP.trattiAlLivello("Soldato", 4), ["mente_incrollabile", "furia"]);
  });
  caso("Catalogo: ogni potere del Guerriero è implementato", () => {
    const s = SP.SPEC.Soldato, ids = new Set([s.classe.potere]);
    ["esecutore", "sentinella"].forEach(k => { const x = s[k]; [...x.volonta, ...x.scontro, ...x.giornalieri, ...Object.values(x.livelli)].forEach(i => ids.add(i)); });
    ids.forEach(id => { const r = S.usa(guerriero(), nemico({ pv: 99, pvMax: 99 }), id, { tira: (d) => Math.min(d, 10) }); eq(ev(r, "nonImplementato").length, 0, id); });
  });

  function esegui() { return casi.map(({ nome, fn }) => { try { fn(); return { nome, ok: true }; } catch (e) { return { nome, ok: false, errore: e.message }; } }); }
  root.TestScontro = { esegui, casi };
  if (inNode && require.main === module) {
    const esiti = esegui();
    esiti.forEach(e => console.log(`${e.ok ? "OK    " : "ERRORE"} ${e.nome}${e.ok ? "" : "\n       → " + e.errore}`));
    const ko = esiti.filter(e => !e.ok).length;
    console.log(`\n${esiti.length - ko} / ${esiti.length} superati`);
    process.exit(ko ? 1 : 0);
  }
})(typeof window !== "undefined" ? window : globalThis);
