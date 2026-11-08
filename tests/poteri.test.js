/* Test del motore nuovo (js/poteri.js), blocco 1: stati, tiro salvezza, applica / aggrava, Vacillante, vulnerabilità.
   Dadi programmati: niente caso. Uso: node tests/poteri.test.js */
(function (root) {
  const inNode = typeof module !== "undefined" && module.exports && typeof require === "function";
  if (inNode) { root.window = root; require("../js/poteri.js"); }
  const P = root.Poteri;

  function dadi(seq) {
    const q = [...seq];
    const f = (d) => { if (!q.length) throw new Error(`tiro in più (d${d}) non previsto`); const v = q.shift(); if (v < 1 || v > d) throw new Error(`valore ${v} impossibile su d${d}`); return v; };
    f.resto = () => q.length;
    return f;
  }
  /* bersaglio: livello 1, tutte le caratteristiche a +0 (TS = d20 + 1) */
  const pg = (o) => Object.assign({ nome: "bersaglio", liv: 1, pv: 30, pvMax: 30, mod: { Vigore: 0, "Agilità": 0, Mente: 0, Spirito: 0 }, stati: {} }, o || {});
  const fonte = { liv: 1, modClasse: 3 }; /* CD 12 */
  const ev = (E, k) => E.filter(e => e && e.k === k);

  const casi = [];
  const caso = (nome, fn) => casi.push({ nome, fn });
  const eq = (a, b, msg) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${msg || "atteso"}: ${JSON.stringify(b)}, ottenuto ${JSON.stringify(a)}`); };
  const vero = (x, msg) => { if (!x) throw new Error(msg || "atteso vero"); };

  /* ===== Tiro salvezza ===== */
  caso("TS: CD = 8 + mod della fonte + livello della fonte", () => { eq(P.cd(fonte), 12); eq(P.cd({ liv: 3, modClasse: 4 }), 15); });
  caso("TS: d20 + mod della caratteristica + livello + bonus, riuscito con il totale ≥ CD", () => {
    const b = pg({ mod: { Vigore: 2 }, liv: 2, bonusTs: 2 }); /* +6 */
    const z = P.tiroSalvezza(b, "sanguinante", fonte, dadi([6]));
    eq([z.attr, z.tot, z.cd, z.ok], ["Vigore", 12, 12, true]);
  });
  caso("TS: la caratteristica dipende dallo stato (Scottato Agilità, Esposto Mente, Impaurito Spirito)", () => {
    eq(P.tiroSalvezza(pg(), "scottato", fonte, dadi([1])).attr, "Agilità");
    eq(P.tiroSalvezza(pg(), "esposto", fonte, dadi([1])).attr, "Mente");
    eq(P.tiroSalvezza(pg(), "impaurito", fonte, dadi([1])).attr, "Spirito");
    eq(P.tiroSalvezza(pg(), "indebolito", fonte, dadi([1])).attr, "Vigore");
  });

  /* ===== Applica ===== */
  caso("Applica: TS fallito → lo stato lieve entra per 3 turni", () => {
    const b = pg(), E = P.applica(b, "sanguinante", { fonte, tira: dadi([5]) });
    eq(ev(E, "ts")[0].ok, false); eq(b.stati.sanguinante, { liv: 1, turni: 3, tipo: "taglio" });
  });
  caso("Applica: TS riuscito → niente stato", () => {
    const b = pg(), E = P.applica(b, "sanguinante", { fonte, tira: dadi([15]) });
    eq(ev(E, "resiste").length, 1); vero(!P.ha(b, "sanguinante"));
  });
  caso("Applica: la stessa fonte rinnova la durata, non si somma", () => {
    const b = pg({ stati: { sanguinante: { liv: 1, turni: 1, tipo: "taglio" } } });
    const E = P.applica(b, "sanguinante", { fonte, tira: dadi([2]) });
    eq(b.stati.sanguinante.turni, 3); eq(ev(E, "stato")[0].rinnovato, true);
  });
  caso("Applica: il lieve su un grave rinnova soltanto, non lo abbassa", () => {
    const b = pg({ stati: { sanguinante: { liv: 2, turni: 1, tipo: "taglio" } } });
    P.applica(b, "sanguinante", { fonte, tira: dadi([2]) });
    eq(b.stati.sanguinante.liv, 2); eq(b.stati.sanguinante.turni, 3);
  });
  caso("Applica: famiglie diverse convivono (Sanguinante + Intossicato + Scottato)", () => {
    const b = pg(), t = dadi([1, 1, 1]);
    ["sanguinante", "intossicato", "scottato"].forEach(id => P.applica(b, id, { fonte, tira: t }));
    vero(P.ha(b, "sanguinante") && P.ha(b, "intossicato") && P.ha(b, "scottato"));
  });
  caso("Applica: Impaurito dura 2 turni", () => { const b = pg(); P.applica(b, "impaurito", { fonte, tira: dadi([1]) }); eq(b.stati.impaurito.turni, 2); });
  caso("Applica: durata personalizzata (Legame del sottobosco, veleni 4 turni)", () => { const b = pg(); P.applica(b, "intossicato", { fonte, tira: dadi([1]), turni: 4 }); eq(b.stati.intossicato.turni, 4); });
  caso("Applica: immunità dichiarata (La lanterna → Impaurito) senza tiro", () => {
    const b = pg({ immuni: ["impaurito"] }), E = P.applica(b, "impaurito", { fonte, tira: dadi([]) });
    eq(ev(E, "immune").length, 1); vero(!P.ha(b, "impaurito"));
  });

  /* ===== Aggrava ===== */
  caso("Aggrava: con il lieve presente diventa grave, automatico (nessun TS) e a durata piena", () => {
    const b = pg({ stati: { intossicato: { liv: 1, turni: 1, tipo: "veleno" } } });
    const E = P.aggrava(b, "intossicato", { fonte, tira: dadi([]) });
    eq(ev(E, "ts").length, 0); eq(b.stati.intossicato, { liv: 2, turni: 3, tipo: "veleno" });
    eq(P.nomeStato("intossicato", 2), "Avvelenato");
  });
  caso("Aggrava: senza il lieve mette solo il lieve (con TS)", () => {
    const b = pg(), E = P.aggrava(b, "esposto", { fonte, tira: dadi([3]) });
    eq(ev(E, "ts").length, 1); eq(b.stati.esposto.liv, 1);
  });
  caso("Aggrava: sul grave rinnova la durata", () => {
    const b = pg({ stati: { esposto: { liv: 2, turni: 1 } } });
    const E = P.aggrava(b, "esposto", { fonte, tira: dadi([]) });
    eq(ev(E, "rinnovato").length, 1); eq(b.stati.esposto.turni, 3);
  });
  caso("Aggrava: stati senza grave (Indebolito) si applicano con TS", () => {
    const b = pg(); P.aggrava(b, "indebolito", { fonte, tira: dadi([2]) }); eq(b.stati.indebolito.liv, 1);
  });

  /* ===== Stordito e Commosso ===== */
  caso("Stordito: perde un'azione, poi 2 turni di immunità", () => {
    const b = pg(); P.applica(b, "stordito", { fonte, tira: dadi([2]) });
    vero(!P.puoAgire(b)); eq(ev(P.inizioTurno(b, dadi([])), "perdeAzione").length, 1);
    P.fineTurno(b); vero(P.puoAgire(b)); eq(b.immStordito, 2);
    eq(ev(P.applica(b, "stordito", { fonte, tira: dadi([]) }), "immune").length, 1, "immune subito dopo");
    P.fineTurno(b); P.fineTurno(b); eq(b.immStordito, 0);
    P.applica(b, "stordito", { fonte, tira: dadi([2]) }); vero(P.ha(b, "stordito"), "di nuovo stordibile");
  });
  caso("Stordito sui boss diventa Indebolito (con TS)", () => {
    const b = pg({ boss: true }), E = P.applica(b, "stordito", { fonte, tira: dadi([2]) });
    eq(ev(E, "convertito").length, 1); vero(P.ha(b, "indebolito")); vero(!P.ha(b, "stordito")); vero(P.puoAgire(b));
  });
  caso("Commosso: si aggrava se il bersaglio è Stordito → Indebolito 3 turni, può agire", () => {
    const b = pg({ stati: { stordito: { liv: 1, turni: 1 } } });
    P.aggrava(b, "stordito", { fonte, tira: dadi([]) });
    eq(b.stati.stordito, { liv: 2, turni: 3 }); vero(P.puoAgire(b)); eq(P.malusColpire(b), 2); eq(P.nomeStato("stordito", 2), "Commosso");
  });
  caso("Commosso: eccezione, entra anche se il bersaglio è immune allo stordimento (boss, immunità dei 2 turni)", () => {
    const boss = pg({ boss: true }); P.aggrava(boss, "stordito", { fonte, tira: dadi([]) }); eq(boss.stati.stordito.liv, 2);
    const b = pg({ immStordito: 2 }); P.aggrava(b, "stordito", { fonte, tira: dadi([]) }); eq(b.stati.stordito.liv, 2);
  });
  caso("Commosso e Indebolito insieme non si sommano (−2 per colpire)", () => {
    const b = pg({ stati: { stordito: { liv: 2, turni: 3 }, indebolito: { liv: 1, turni: 3 } } }); eq(P.malusColpire(b), 2);
  });
  caso("Commosso finito non dà immunità allo stordimento", () => {
    const b = pg({ stati: { stordito: { liv: 2, turni: 1 } } }); P.fineTurno(b); eq(b.immStordito || 0, 0);
  });

  /* ===== Esposto / Scoperto, Impaurito ===== */
  caso("Esposto −2 CA; Scoperto −4 CA e critico da 19", () => {
    const b = pg({ stati: { esposto: { liv: 1, turni: 3 } } }); eq([P.malusCA(b), P.sogliaCritContro(b)], [2, 20]);
    b.stati.esposto.liv = 2; eq([P.malusCA(b), P.sogliaCritContro(b)], [4, 19]);
  });
  caso("Scoperto sui boss: il critico allargato si può spegnere da CONFIG", () => {
    const b = pg({ boss: true, stati: { esposto: { liv: 2, turni: 3 } } });
    eq(P.sogliaCritContro(b), 19); P.CONFIG.scopertoCritSuiBoss = false; eq(P.sogliaCritContro(b), 20); P.CONFIG.scopertoCritSuiBoss = true;
  });
  caso("Impaurito: solo poteri a volontà", () => { const b = pg({ stati: { impaurito: { liv: 1, turni: 2 } } }); vero(P.soloAVolonta(b)); });

  /* ===== Danni continuativi e durate ===== */
  caso("Tick: Sanguinante 1d4 per 3 turni, poi scade", () => {
    const b = pg(); P.applica(b, "sanguinante", { fonte, tira: dadi([1]) });
    const t = dadi([4, 2, 1]);
    for (let i = 0; i < 3; i++) { eq(ev(P.inizioTurno(b, t), "tick").length, 1); P.fineTurno(b); }
    eq(b.pv, 23); vero(!P.ha(b, "sanguinante")); eq(P.inizioTurno(b, dadi([])).length, 0);
  });
  caso("Tick: il grave tira 1d6, famiglie diverse tirano tutte", () => {
    const b = pg({ stati: { sanguinante: { liv: 2, turni: 3, tipo: "taglio" }, intossicato: { liv: 1, turni: 3, tipo: "veleno" } } });
    const E = P.inizioTurno(b, dadi([6, 4]));
    eq(ev(E, "tick").map(e => [e.nome, e.dado, e.danno]), [["Emorragia", 6, 6], ["Intossicato", 4, 4]]); eq(b.pv, 20);
  });
  caso("Tick: il danno continuativo segue le resistenze del suo tipo", () => {
    const b = pg({ res: { veleno: "res", fuoco: "imm" }, stati: { intossicato: { liv: 1, turni: 3, tipo: "veleno" }, scottato: { liv: 1, turni: 3, tipo: "fuoco" } } });
    const E = P.inizioTurno(b, dadi([3, 4]));
    eq(ev(E, "tick").map(e => e.danno), [0, 2], "scottato immune (0), veleno 3 → 2"); /* ordine: sanguinante, scottato, intossicato */
  });
  caso("Tick: la bruciatura del fuoco sacro passa l'immunità al fuoco comune", () => {
    const b = pg({ res: { fuoco: "imm", fuoco_sacro: "vuln" } });
    P.applica(b, "scottato", { fonte, tira: dadi([1]), tipo: "fuoco_sacro" });
    eq(ev(P.inizioTurno(b, dadi([3])), "tick")[0].danno, 5);
  });
  caso("Allunga: +1 turno solo se lo stato c'è", () => {
    const b = pg({ stati: { intossicato: { liv: 1, turni: 2 } } });
    eq(P.allunga(b, "intossicato", 1).turni, 3); eq(P.allunga(b, "sanguinante", 1), null);
  });
  caso("Togli tutti: Purga e simili", () => {
    const b = pg({ stati: { intossicato: { liv: 1, turni: 2 }, esposto: { liv: 2, turni: 1 } } });
    eq(P.togliTutti(b).length, 2); vero(!P.ha(b, "intossicato") && !P.ha(b, "esposto"));
  });

  /* ===== Vulnerabilità e Vacillante ===== */
  caso("Vulnerabile +50%, resistente −50% (per eccesso), immune 0, neutro pieno", () => {
    const b = pg({ res: { taglio: "vuln", contundente: "res", sangue: "imm" } });
    eq(P.modificaDanno(b, "taglio", 5).danno, 8); eq(P.modificaDanno(b, "contundente", 5).danno, 3);
    eq(P.modificaDanno(b, "sangue", 9).danno, 0); eq(P.modificaDanno(b, "perforante", 5).danno, 5);
  });
  caso("Danno subito = salute effettivamente persa (dopo le riduzioni)", () => {
    const b = pg({ pv: 4, res: { taglio: "res" } }); const e = P.subisci(b, 10, "taglio");
    eq([e.danno, b.pv, e.abbattuto], [4, 0, true]);
  });
  caso("Vacillante sotto il 50%; avviso una volta sola, al passaggio", () => {
    const b = pg(); /* 30 */
    eq(!!P.subisci(b, 15).vacillanteOra, false, "a 15 su 30 non è ancora sotto il 50%"); vero(!P.vacillante(b));
    eq(P.subisci(b, 1).vacillanteOra, true); vero(P.vacillante(b));
    eq(!!P.subisci(b, 1).vacillanteOra, false);
  });

  function esegui() { return casi.map(({ nome, fn }) => { try { fn(); return { nome, ok: true }; } catch (e) { return { nome, ok: false, errore: e.message }; } }); }
  root.TestPoteri = { esegui, casi };
  if (inNode && require.main === module) {
    const esiti = esegui();
    esiti.forEach(e => console.log(`${e.ok ? "OK    " : "ERRORE"} ${e.nome}${e.ok ? "" : "\n       → " + e.errore}`));
    const ko = esiti.filter(e => !e.ok).length;
    console.log(`\n${esiti.length - ko} / ${esiti.length} superati`);
    process.exit(ko ? 1 : 0);
  }
})(typeof window !== "undefined" ? window : globalThis);
