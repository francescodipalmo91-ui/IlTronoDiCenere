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
    const g = guerriero(), n = nemico(), c = ctx([10, 1, 2]); /* un TS solo per i due stati */
    S.usa(g, n, "rintocco", c); vero(P.ha(n, "sanguinante") && P.ha(n, "indebolito")); eq(S.ca(g), 18); fine(c);
    const n2 = nemico(), c2 = ctx([10, 1, 15]); S.usa(guerriero(), n2, "rintocco", c2);
    vero(!P.ha(n2, "sanguinante") && !P.ha(n2, "indebolito"), "TS riuscito: nessuno dei due"); fine(c2);
  });
  caso("Veglia di ferro: +2 CA e +4 TS per 3 turni; In guardia contrattacca anche se colpito, e aggrava", () => {
    const g = guerriero(), n = nemico({ stati: { sanguinante: { liv: 1, turni: 3, tipo: "taglio" } } });
    S.usa(g, n, "veglia_di_ferro", ctx([])); eq([S.ca(g), g.bonusTs], [18, 4]);
    S.usa(g, n, "in_guardia", ctx([]));
    const c = ctx([19, 1, 10, 1]); S.attacco(n, g, {}, c); /* 19 + 2 = 21 > 20: colpito; contrattacco */
    eq(n.stati.sanguinante.liv, 2); fine(c);
    const vuoto = ctx([]); S.inizioTurno(g, n, vuoto); eq([g.bonusTs, S.ca(g)], [4, 18], "In guardia finita, Veglia ancora attiva");
    S.inizioTurno(g, n, vuoto); eq(g.bonusTs, 4); S.inizioTurno(g, n, vuoto); eq([g.bonusTs, S.ca(g)], [0, 16], "Veglia scaduta dopo 3 turni del nemico");
  });
  caso("Rivalsa: + metà del danno subito nell'ultimo turno del nemico (tutto da Vacillante)", () => {
    const g = guerriero({ dannoSubitoTurno: 9 }), n = nemico(), c = ctx([10, 1, 2]);
    S.usa(g, n, "rivalsa", c); eq(n.pv, 11, "metà di 9 per eccesso = 5"); fine(c);
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
  caso("Scelte doppie: le opzioni a ogni livello (1: 3 + 2, 2: nessuna, 3: i due rimasti, 4: rimasto o fisso, 5: nessuna)", () => {
    const o = (sc, l) => SP.opzioniLivello("Soldato", "esecutore", sc, l).map(x => [x.tipo, x.opzioni]);
    eq(o([], 1), [["scontro", ["spezza_guardia", "colpo_crudele", "caccia_al_ferito"]], ["giornaliero", ["assalto_implacabile", "colpo_del_boia"]]]);
    eq(o(["spezza_guardia", "colpo_del_boia"], 2), []);
    eq(o(["spezza_guardia", "colpo_del_boia"], 3), [["scontro", ["colpo_crudele", "caccia_al_ferito"]]]);
    eq(o(["spezza_guardia", "colpo_del_boia", "colpo_crudele"], 4), [["scontro", ["caccia_al_ferito", "ferita_riaperta"]], ["giornaliero", ["assalto_implacabile", "marchio_della_preda"]]]);
    eq(o(["spezza_guardia", "colpo_del_boia", "colpo_crudele", "ferita_riaperta", "assalto_implacabile"], 5), []);
  });
  caso("Scelte doppie: validazione nell'ordine delle scelte; niente poteri in anticipo, niente estranei", () => {
    const v = (x, l) => SP.sceltaValida("Soldato", "esecutore", x, l);
    eq(v(["spezza_guardia", "colpo_del_boia"], 1).ok, true);
    eq(v(["ferita_riaperta", "colpo_del_boia"], 1).motivo, "manca", "il fisso del 4 non si prende al livello 1");
    eq(v(["spezza_guardia", "colpo_del_boia", "colpo_crudele"], 2).motivo, "inAnticipo");
    eq(v(["spezza_guardia", "colpo_del_boia"], 3).livello, 3);
    eq(v(["spezza_guardia", "colpo_del_boia", "colpo_crudele", "caccia_al_ferito", "marchio_della_preda"], 4).ok, true, "lasciato il fisso del 4");
    eq(v(["spezza_guardia", "colpo_del_boia", "colpo_crudele", "ferita_riaperta", "assalto_implacabile"], 5).ok, true, "lasciato il fisso giornaliero");
    eq(v({ 1: { scontro: "caccia_al_ferito", giornaliero: "assalto_implacabile" }, 3: { scontro: "spezza_guardia" } }, 3).ok, true, "anche come oggetto per livello");
    eq(v(["spezza_guardia", "rivalsa"], 1).motivo, "estranei");
  });
  caso("Scala 08/11: 2-1-1, 3-1-1, 3-2-1, 3-3-2, 3-3-3 per le 8 specializzazioni, qualunque scelta (più il potere di classe)", () => {
    Object.entries(SP.SPEC).forEach(([classe, cl]) => Object.keys(cl).filter(k => k !== "classe").forEach(spec => {
      [0, 1].forEach(variante => { /* variante 0: prende i fissi al 4; variante 1: li lascia */
        const scelti = [];
        [1, 2, 3, 4, 5].forEach(liv => {
          SP.opzioniLivello(classe, spec, scelti, liv).forEach(o => scelti.push(variante ? o.opzioni[0] : o.opzioni[o.opzioni.length - 1]));
          eq(SP.sceltaValida(classe, spec, scelti, liv).ok, true, `${spec} ${liv}`);
          const pot = SP.poteriAlLivello(classe, spec, scelti, liv).filter(id => id !== cl.classe.potere);
          eq(["volonta", "scontro", "giornaliero"].map(t => pot.filter(id => SP.POTERI[id].tipo === t).length), SP.SCALA[liv], `${spec} livello ${liv}`);
          eq(new Set(pot).size, pot.length, `${spec} ${liv}: nessun doppione`);
        });
      });
    }));
  });
  caso("Al livello 1 manca la difesa (alla Sentinella Colpo di mestiere); il finale arriva sempre al 5; tratto II al livello 2", () => {
    const l1 = SP.poteriAlLivello("Soldato", "sentinella", ["ritorsione", "rivalsa"], 1);
    vero(l1.includes("in_guardia") && !l1.includes("colpo_di_mestiere"));
    vero(SP.poteriAlLivello("Soldato", "sentinella", ["ritorsione", "rivalsa"], 2).includes("colpo_di_mestiere"));
    vero(!SP.poteriAlLivello("Sapiente", "illusione", ["labirinto", "incubo"], 1).includes("riflessi"));
    const l5 = SP.poteriAlLivello("Soldato", "esecutore", ["spezza_guardia", "colpo_del_boia", "colpo_crudele", "caccia_al_ferito", "assalto_implacabile"], 5);
    vero(l5.includes("sentenza") && !l5.includes("ferita_riaperta") && !l5.includes("marchio_della_preda"), "finale fisso, i due fissi lasciati");
    eq([SP.livelloDi("Soldato", "sentinella", "colpo_di_mestiere"), SP.livelloDi("Soldato", "esecutore", "colpo_di_mestiere"), SP.livelloDi("Soldato", "esecutore", "marchio_della_preda")], [2, 1, 4]);
    eq(SP.trattiAlLivello("Soldato", 1), ["mente_incrollabile"]); eq(SP.trattiAlLivello("Soldato", 2), ["mente_incrollabile", "furia"]);
  });
  caso("Catalogo: ogni potere del Guerriero è implementato", () => {
    const s = SP.SPEC.Soldato, ids = new Set([s.classe.potere]);
    ["esecutore", "sentinella"].forEach(k => { const x = s[k]; SP.tuttiDi(x).forEach(i => ids.add(i)); });
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
