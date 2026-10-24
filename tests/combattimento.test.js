/* Test delle regole di combattimento (js/combattimento.js) con dadi programmati: niente caso, risultati certi.
   Uso:  node tests/combattimento.test.js   → stampa OK/ERRORE per ogni caso, esce con 1 se qualcosa fallisce.
   Lo stesso file gira anche nel browser, nella sala di prova (tutorial.html?prova → «Esegui i test»). */
(function (root) {
  const inNode = typeof module !== "undefined" && module.exports && typeof require === "function";
  if (inNode) {
    root.window = root;
    require("../js/regole.js"); require("../js/tecniche.js"); require("../js/combattimento.js");
  }
  const C = root.Combattimento, T = root.TECNICHE, R = root.Regole;
  const tec = (id) => { const t = T.find(x => x.id === id); if (!t) throw new Error("tecnica mancante: " + id); return t; };

  /* dadi programmati: ogni tiro prende il valore successivo; se la tecnica tira più del previsto, il test fallisce */
  function dadi(seq) {
    const q = [...seq];
    const f = (d) => { if (!q.length) throw new Error(`tiro in più (d${d}) non previsto`); const v = q.shift(); if (v < 1 || v > d) throw new Error(`valore ${v} impossibile su d${d}`); return v; };
    f.resto = () => q.length;
    return f;
  }
  function ctx(o) {
    o = o || {};
    const c = { liv: 1, modAtt: 3, modDanno: 3, dado: 6, caBase: 12, boss: false, cd: 12, modTs: 0, cura: 0, ira: 0, usate: {} };
    Object.assign(c, o);
    c.tira = dadi(o.dadi || []);
    c.ca = () => c.caBase - (c.s && c.s.eff && c.s.eff.sbilanciato > 0 ? 2 : 0);
    c.curaPg = (n) => { c.cura += n; };
    c.iraPiu = (n) => { c.ira += n; };
    c.usataPerRiposo = (id) => !!c.usate[id];
    c.segnaPerRiposo = (id) => { c.usate[id] = true; };
    return c;
  }
  const scontro = (o) => Object.assign({ pv: 40, pvMax: 40, eff: {}, effMax: {} }, o || {});
  const prova = (s, c, id) => { c.s = s; return C.usa(tec(id), s, c); };
  const ev = (r, k) => r.eventi.filter(e => e.k === k);

  const casi = [];
  const caso = (nome, fn) => casi.push({ nome, fn });
  const eq = (a, b, msg) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${msg || "atteso"}: ${JSON.stringify(b)}, ottenuto ${JSON.stringify(a)}`); };
  const vero = (x, msg) => { if (!x) throw new Error(msg || "atteso vero"); };

  /* ================= 1. Una tecnica che manca spende comunque l'ira ================= */
  caso("1. Tecnica mancata: il costo resta dovuto e non succede nulla", () => {
    const s = scontro(), c = ctx({ dadi: [2] }); /* 2 + 3 = 5 contro CA 12 */
    const r = prova(s, c, "morso_acciaio");
    eq(r.costo, 3, "costo"); vero(!r.rifiutata, "non rifiutata");
    eq(ev(r, "colpo")[0].ok, false, "mancato"); eq(s.eff.sanguina || 0, 0, "nessun sanguinamento"); eq(s.pv, 40, "pv intatti");
  });

  /* ================= 2. Sanguinamento ed Emorragia ================= */
  caso("2a. Sanguinamento: 1d4 all'inizio del turno del nemico, la durata scende", () => {
    const s = scontro(), c = ctx({ dadi: [15, 4, 3, 2] }); /* colpo 15+3, danno 4+3=7; poi due tick: 3 e 2 */
    prova(s, c, "morso_acciaio");
    eq(s.pv, 33, "danno del colpo"); eq(s.eff.sanguina, 2); eq(s.sangueDado, 4);
    eq(C.tickSangue(s, c).d, 3); C.fineTurnoNemico(s); eq(s.eff.sanguina, 1);
    eq(C.tickSangue(s, c).d, 2); C.fineTurnoNemico(s); eq(s.eff.sanguina, 0);
    eq(C.tickSangue(s, c), null, "finito: niente tick"); eq(s.pv, 28);
  });
  caso("2b. Rinnovo senza somma: un secondo sanguinamento riporta la durata, non la somma", () => {
    const s = scontro({ eff: { sanguina: 1 }, sangueDado: 4 }), c = ctx({ dadi: [15, 1] });
    prova(s, c, "morso_acciaio"); eq(s.eff.sanguina, 2, "2, non 3");
  });
  caso("2c. Emorragia 1d6 sostituisce il sanguinamento e un 1d4 successivo non la abbassa", () => {
    const s = scontro(), c = ctx({ liv: 3, dadi: [15, 1, 2, 15, 1, 6] });
    prova(s, c, "arterie"); eq(s.sangueDado, 6); eq(s.eff.sanguina, 3); eq(c.cura, 2, "cura 1d4");
    prova(s, c, "morso_acciaio"); eq(s.sangueDado, 6, "resta 1d6"); eq(s.eff.sanguina, 3, "durata non scende");
    const t = C.tickSangue(s, ctx({ dadi: [6] })); eq(t.dado, 6);
  });

  /* ================= 3. Frastornato: comune con tiro salvezza, boss immune ================= */
  caso("3a. Frastornato su un mastino comune (tiro salvezza fallito): −4 per colpire, niente critici", () => {
    const s = scontro(), c = ctx({ liv: 2, dadi: [15, 3, 5] }); /* colpo, danno, tiro salvezza 5 < 12 */
    const r = prova(s, c, "vipera");
    eq(ev(r, "ts")[0].ok, false); eq(s.eff.frastornato, 1);
    eq(C.modAttaccoNem(s), -4); eq(C.critNemPossibile(s), false);
  });
  caso("3b. Frastornato su un mastino comune (tiro salvezza superato): nessun effetto", () => {
    const s = scontro(), c = ctx({ liv: 2, dadi: [15, 3, 14] });
    const r = prova(s, c, "vipera"); eq(ev(r, "resiste").length, 1); eq(s.eff.frastornato || 0, 0);
  });
  caso("3c. Frastornato su un boss: nessun effetto e nessun tiro salvezza", () => {
    const s = scontro(), c = ctx({ liv: 2, boss: true, dadi: [15, 3] });
    const r = prova(s, c, "vipera"); eq(ev(r, "ts").length, 0, "niente tiro"); eq(ev(r, "immune")[0].s, "frastornato"); eq(s.eff.frastornato || 0, 0);
    eq(c.tira.resto(), 0);
  });

  /* ================= 4. Squarcia-Articolazioni blocca Presa e Soffio ================= */
  caso("4. Squarcia-Articolazioni: niente attacchi speciali e Frastornato per 2 turni, poi svaniscono", () => {
    const s = scontro(), c = ctx({ liv: 4, dadi: [15, 3, 4, 2] }); /* +1 dado: due d6 */
    const r = prova(s, c, "squarcia");
    eq(ev(r, "colpo")[0].nd, 2, "due dadi"); eq(s.eff.silenzio, 2); eq(s.eff.frastornato, 2);
    C.fineTurnoNemico(s); eq(C.attivo(s, "silenzio"), true);
    eq(C.fineTurnoNemico(s).sort(), ["frastornato", "silenzio"]); eq(C.attivo(s, "silenzio"), false);
  });
  caso("4b. Squarcia-Articolazioni su un boss: solo il danno", () => {
    const s = scontro(), c = ctx({ liv: 4, boss: true, dadi: [15, 3, 4] });
    const r = prova(s, c, "squarcia"); eq(s.eff.silenzio || 0, 0); eq(ev(r, "immune").length, 2);
  });

  /* ================= 5. Mutilazione del Carnefice ================= */
  caso("5a. Mutilazione: un nemico comune sotto un quarto della salute muore", () => {
    const s = scontro({ pv: 15, pvMax: 40 }), c = ctx({ liv: 4, dadi: [15, 1, 1] }); /* danno 1+1+3=5 → 10 < 10? no: 10 non è sotto 10 */
    prova(s, c, "mutilazione"); eq(s.pv, 10, "esattamente un quarto: resta vivo");
    const s2 = scontro({ pv: 14, pvMax: 40 }), c2 = ctx({ liv: 4, dadi: [15, 1, 1] });
    const r = prova(s2, c2, "mutilazione"); eq(s2.pv, 0); eq(ev(r, "esecuzione").length, 1);
  });
  caso("5b. Mutilazione: un boss (Ettore) non muore e Indebolito scende a 2 turni", () => {
    const s = scontro({ pv: 14, pvMax: 40 }), c = ctx({ liv: 4, boss: true, dadi: [15, 1, 1] });
    const r = prova(s, c, "mutilazione"); eq(s.pv, 9); eq(ev(r, "esecuzione").length, 0);
    eq(s.eff.debole, 2, "tetto dei boss"); eq(ev(r, "stato").find(e => e.s === "debole").ridotto, true); eq(s.eff.sanguina, 2);
  });

  /* ================= 6. Parata Mutilante ================= */
  caso("6a. Parata Mutilante: il primo colpo fa 0 danni, non dà ira, contrattacco e sanguinamento", () => {
    const s = scontro(), c = ctx({ liv: 4, dadi: [] });
    const r = prova(s, c, "parata"); eq(ev(r, "colpo").length, 0, "nessun tiro: consuma l'azione"); eq(s.parata, true);
    const c2 = ctx({ liv: 4, dadi: [5] }); c2.s = s;
    const sub = C.colpoSubito(s, c2, false);
    eq(sub.annullato, true); eq(sub.ira, 0); eq(s.pv, 32, "5 + 3 di contrattacco"); eq(s.eff.sanguina, 2); eq(s.parata, false);
    eq(C.colpoSubito(s, c2, false).annullato, false, "solo il primo colpo");
  });
  caso("6b. Parata Mutilante: finisce all'inizio del tuo turno se nessuno ti colpisce", () => {
    const s = scontro(); prova(s, ctx(), "parata"); C.inizioTurnoPg(s); eq(s.parata, false);
  });

  /* ================= 7. Recupero dell'ira ================= */
  caso("7. Ira per colpo subito: 1/2 ai livelli 1-2, 2/4 ai livelli 3-4, 3/6 al livello 5", () => {
    const att = [[1, 1, 2], [2, 1, 2], [3, 2, 4], [4, 2, 4], [5, 3, 6]];
    att.forEach(([l, n, cr]) => { eq(C.iraPerColpo(l, false), n, "livello " + l); eq(C.iraPerColpo(l, true), cr, "critico livello " + l); });
    eq(C.colpoSubito(scontro(), ctx({ liv: 3 }), true).ira, 4);
  });

  /* ================= 8. Punti ira massimi ================= */
  caso("8. Ira massima con Vigore +3: 13, 18, 24, 31, 39", () => {
    eq([1, 2, 3, 4, 5].map(l => C.iraMax(3, l)), [13, 18, 24, 31, 39]);
    eq(C.crescitaIra(-1, 2), 1, "almeno 1 punto a livello");
  });

  /* ================= 9. Posti delle tecniche ================= */
  caso("9a. Posti: 2, 4, 5, 6, 7 e uno in più con lo scudo", () => {
    eq([1, 2, 3, 4, 5].map(l => C.slotTecniche(l, false)), [2, 4, 5, 6, 7]);
    eq([1, 2, 3, 4, 5].map(l => C.slotTecniche(l, true)), [3, 5, 6, 7, 8]);
  });
  caso("9b. Quote per livello: tre tecniche di livello 1 solo con lo scudo; niente tecniche oltre il livello", () => {
    const l1 = ["polso", "morso_acciaio", "pomolo"].map(tec);
    eq(C.sceltaValida(l1, 1, false).ok, false); eq(C.sceltaValida(l1, 1, true).ok, true);
    eq(C.sceltaValida([tec("eco")], 2, false).motivo, "livello");
    eq(C.sceltaValida(["eco", "arterie"].map(tec), 3, false).ok, false, "una sola di livello 3");
    eq(C.sceltaValida(["polso", "morso_acciaio", "vipera", "tendini", "eco", "squarcia", "cateratta"].map(tec), 5, false).ok, true, "7 posti al livello 5");
    eq(C.sceltaPredefinita(T.filter(t => t.tipo === "Tagliente" && !t.via), 3, false).length, 5);
  });
  caso("9c. Le abilità delle vie non sono tra le tecniche da preparare e sono 3 per via, ai livelli 3, 4, 5", () => {
    ["aldo", "guendalina"].forEach(v => eq(T.filter(t => t.via === v).map(t => t.liv), [3, 4, 5], v));
    eq(T.filter(t => t.tipo === "Tagliente" && !t.via).map(t => t.liv), [1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5]);
  });

  /* ================= 10. Durate degli stati (scheda nemico) ================= */
  caso("10. Stati: durata massima per i rombi, scadenza a fine turno del nemico", () => {
    const s = scontro(), c = ctx({ liv: 3, dadi: [15, 2] });
    prova(s, c, "spezzaguardia"); eq(s.eff.sbilanciato, 2); eq(s.effMax.sbilanciato, 2);
    eq(C.fineTurnoNemico(s), []); eq(C.fineTurnoNemico(s), ["sbilanciato"]);
  });

  /* ================= 11. Ferita Riaperta ================= */
  caso("11. Ferita Riaperta: con 3 turni rimasti subisce subito 3 tiri e la ferita si chiude", () => {
    const s = scontro({ eff: { sanguina: 3 }, sangueDado: 4, marchio: true }), c = ctx({ liv: 4, dadi: [15, 2, 4, 3, 1] });
    const r = prova(s, c, "ferita_riaperta");
    const st = ev(r, "sangueTutto")[0]; eq(st.n, 3); eq(st.tiri, [4, 3, 1]); eq(s.eff.sanguina, 0); eq(s.marchio, false);
    eq(s.pv, 40 - 5 - 8);
  });
  caso("11b. Ferita Riaperta senza sanguinamento: lo applica per 2 turni", () => {
    const s = scontro(), c = ctx({ liv: 4, dadi: [15, 2] }); prova(s, c, "ferita_riaperta"); eq(s.eff.sanguina, 2);
  });

  /* ================= Le altre tecniche del taglio ================= */
  caso("Fendente al Polso: Indebolito 2 turni (−2 al tiro del nemico)", () => {
    const s = scontro(); prova(s, ctx({ dadi: [15, 2] }), "polso"); eq(s.eff.debole, 2); eq(C.modAttaccoNem(s), -2);
  });
  caso("Pomolo Sbalorditivo: Sbilanciato 1 turno (−2 alla CA)", () => {
    const s = scontro(), c = ctx({ dadi: [15, 2] }); prova(s, c, "pomolo"); eq(s.eff.sbilanciato, 1); eq(c.ca(), 10);
  });
  caso("Recisione dei Tendini: Sanguinamento 2 e Sbilanciato 1", () => {
    const s = scontro(); prova(s, ctx({ liv: 2, dadi: [15, 2] }), "tendini"); eq([s.eff.sanguina, s.eff.sbilanciato], [2, 1]);
  });
  caso("Stoccata Cremisi: +1 dado; con sanguinamento lo rinnova e indebolisce, senza no", () => {
    const s = scontro(); const r = prova(s, ctx({ liv: 2, dadi: [15, 2, 2] }), "cremisi");
    eq(ev(r, "colpo")[0].nd, 2); eq(s.eff.sanguina || 0, 0); eq(s.eff.debole || 0, 0);
    const s2 = scontro({ eff: { sanguina: 1 }, sangueDado: 4 }); prova(s2, ctx({ liv: 2, dadi: [15, 2, 2] }), "cremisi");
    eq([s2.eff.sanguina, s2.eff.debole], [2, 2]);
  });
  caso("Eco del Metallo: comune non resiste → Stordito; resiste → Sbilanciato; boss → Sbilanciato senza tiro", () => {
    const a = scontro(); prova(a, ctx({ liv: 3, dadi: [15, 2, 3] }), "eco"); eq(a.eff.bloccato, 1);
    const b = scontro(); prova(b, ctx({ liv: 3, dadi: [15, 2, 18] }), "eco"); eq([b.eff.bloccato || 0, b.eff.sbilanciato], [0, 1]);
    const c = scontro(), cc = ctx({ liv: 3, boss: true, dadi: [15, 2] }); const r = prova(c, cc, "eco"); eq([c.eff.bloccato || 0, c.eff.sbilanciato], [0, 1]); eq(ev(r, "ts").length, 0);
  });
  caso("Spezza-Guardia: il bonus +2 vale per l'attacco successivo e poi sparisce", () => {
    const s = scontro(), c = ctx({ liv: 3, dadi: [15, 2, 5, 2] });
    prova(s, c, "spezzaguardia"); eq(s.prossimo, { bonus: 2 });
    const r = prova(s, c, "polso"); eq(ev(r, "colpo")[0].mA, 5, "3 + 2"); eq(s.prossimo, null);
  });
  caso("Cateratta: 3 attacchi col solo dado; 3 a segno + tiro salvezza fallito → Stordito; boss immune", () => {
    const s = scontro(), r = prova(s, ctx({ liv: 5, dadi: [15, 2, 15, 2, 15, 2, 3] }), "cateratta");
    eq(ev(r, "colpo").map(e => e.danno), [2, 2, 2], "senza modificatore"); eq(s.eff.sanguina, 2); eq(s.eff.bloccato, 1);
    const b = scontro(), rb = prova(b, ctx({ liv: 5, boss: true, dadi: [15, 2, 15, 2, 15, 2] }), "cateratta"); eq(b.eff.bloccato || 0, 0); eq(ev(rb, "immune").length, 1);
    const m = scontro(), rm = prova(m, ctx({ liv: 5, dadi: [15, 2, 1, 15, 2] }), "cateratta"); eq(ev(rm, "ts").length, 0, "uno mancato: niente stordimento");
  });
  caso("Diluvio Rosso: Emorragia 1d6 3 turni e Indebolito 3 (2 su un boss)", () => {
    const s = scontro(); prova(s, ctx({ liv: 5, dadi: [15, 2, 2] }), "diluvio"); eq([s.eff.sanguina, s.sangueDado, s.eff.debole], [3, 6, 3]);
    const b = scontro(); prova(b, ctx({ liv: 5, boss: true, dadi: [15, 2, 2] }), "diluvio"); eq(b.eff.debole, 2);
  });
  caso("Cataclisma: doppi dadi, Frastornato e Sbilanciato 3, attacco gratuito, una volta per riposo", () => {
    const s = scontro({ pv: 60, pvMax: 60 }), c = ctx({ liv: 5, dadi: [15, 3, 3, 15, 4] });
    const r = prova(s, c, "cataclisma");
    const colpi = ev(r, "colpo"); eq(colpi.length, 2); eq(colpi[0].nd, 2); eq([s.eff.frastornato, s.eff.sbilanciato], [3, 3]); eq(ev(r, "attaccoGratuito").length, 1);
    const r2 = prova(s, ctx({ liv: 5, usate: c.usate }), "cataclisma"); eq(r2.rifiutata, true, "seconda volta nello stesso riposo");
  });

  /* ================= Vie di prestigio ================= */
  caso("Marchio del Guardiano: Sanguinamento 3, +1d4 sugli attacchi normali finché sanguina", () => {
    const s = scontro(), c = ctx({ liv: 3, dadi: [15, 2, 15, 2, 3] }); c.s = s;
    prova(s, c, "marchio"); eq(s.eff.sanguina, 3); eq(C.marchiato(s), true);
    const b = C.colpo(s, c, { base: true }); eq(b.marchio, 3); eq(b.danno, 2 + 3 + 3);
    s.eff.sanguina = 1; C.fineTurnoNemico(s); eq(C.marchiato(s), false); eq(s.marchio, false, "finito il sangue, finito il marchio");
  });
  caso("Marchio: le tecniche (non gli attacchi normali) non prendono il +1d4", () => {
    const s = scontro({ eff: { sanguina: 3 }, sangueDado: 4, marchio: true }); const r = prova(s, ctx({ dadi: [15, 2] }), "polso"); eq(ev(r, "colpo")[0].marchio, undefined);
  });
  caso("Sentenza del Boia: critico garantito se il nemico sanguina, normale altrimenti", () => {
    const s = scontro({ eff: { sanguina: 2 }, sangueDado: 4 }), r = prova(s, ctx({ liv: 5, dadi: [15, 2, 3] }), "sentenza"); eq(ev(r, "colpo")[0].crit, true); eq(ev(r, "colpo")[0].nd, 2);
    const n = scontro(), rn = prova(n, ctx({ liv: 5, dadi: [15, 2] }), "sentenza"); eq(ev(rn, "colpo")[0].crit, false);
    const m = scontro({ eff: { sanguina: 2 } }), rm = prova(m, ctx({ liv: 5, dadi: [2] }), "sentenza"); eq(ev(rm, "colpo")[0].ok, false, "deve comunque colpire");
  });
  caso("Veglia di Ferro: Indebolito e Sbilanciato 2, +2 CA per un turno", () => {
    const s = scontro(); prova(s, ctx({ liv: 3, dadi: [15, 2] }), "veglia_ferro"); eq([s.eff.debole, s.eff.sbilanciato, s.eff.guardia, s.guardiaVal], [2, 2, 1, 2]);
    const m = scontro(); prova(m, ctx({ liv: 3, dadi: [2] }), "veglia_ferro"); eq(m.eff.guardia, 1, "la guardia vale anche se manchi");
  });
  caso("Ritmo del Duello: la tecnica successiva costa 2 in meno (minimo 1)", () => {
    const s = scontro(), c = ctx({ liv: 4, dadi: [15, 2, 2, 15, 15, 2] });
    prova(s, c, "ritmo"); eq(s.sconto, 2); eq(s.eff.debole, 3);
    eq(C.costo(tec("polso"), s), 1, "2 − 2 → minimo 1"); const r = prova(s, c, "polso"); eq(r.costo, 1); eq(s.sconto, 0, "lo sconto si consuma");
  });
  caso("Veglia Inflessibile: Indebolito e Sbilanciato 3, +2 CA e +4 ai tiri salvezza (Furore) per 3 turni", () => {
    const s = scontro(); prova(s, ctx({ liv: 5, dadi: [15, 2, 2] }), "veglia_inflessibile"); eq([s.eff.debole, s.eff.sbilanciato, s.eff.guardia, s.eff.furore], [3, 3, 3, 3]); eq(s.eff.incrollabile, undefined);
  });
  caso("Guardia: una guardia scaduta non lascia il vecchio valore (Scudo Frontale +3 poi Veglia di Ferro +2)", () => {
    const s = scontro(); prova(s, ctx(), "frontale"); eq(s.guardiaVal, 3); C.fineTurnoNemico(s);
    prova(s, ctx({ liv: 3, dadi: [2] }), "veglia_ferro"); eq(s.guardiaVal, 2);
  });

  /* ================= Le tecniche già esistenti funzionano ancora ================= */
  caso("Contundenti, perforanti e scudo: ognuna si risolve senza errori", () => {
    T.filter(t => !["Tagliente", "Utilita"].includes(t.tipo)).forEach(t => {
      const s = scontro(), c = ctx({ liv: 2 }); c.tira = (d) => (d === 20 ? 15 : 1); c.s = s;
      const r = C.usa(t, s, c); vero(!ev(r, "sconosciuta").length, t.id + " non riconosciuta");
    });
  });
  caso("Tutte le tecniche del taglio e delle vie sono riconosciute", () => {
    T.filter(t => t.tipo === "Tagliente" || t.tipo === "Utilita").forEach(t => {
      const s = scontro(), c = ctx({ liv: 5 }); c.tira = (d) => (d === 20 ? 15 : 1); c.s = s;
      const r = C.usa(t, s, c); vero(!ev(r, "sconosciuta").length, t.id); vero(t.nome.en && t.effetto.en, t.id + ": manca l'inglese");
    });
  });
  caso("Ogni tecnica ha un costo coerente con il suo livello", () => {
    T.filter(t => t.tipo === "Tagliente").forEach(t => { const [lo, hi] = [[2, 3], [4, 5], [5, 6], [7, 8], [9, 10]][t.liv - 1]; vero(t.costo >= lo && t.costo <= hi, `${t.id}: ${t.costo} fuori da ${lo}-${hi}`); });
  });

  /* ---------- esecuzione ---------- */
  function esegui() {
    const esiti = casi.map(({ nome, fn }) => { try { fn(); return { nome, ok: true }; } catch (e) { return { nome, ok: false, errore: e.message }; } });
    return esiti;
  }
  root.TestCombattimento = { esegui, casi };
  if (inNode && require.main === module) {
    const esiti = esegui();
    esiti.forEach(e => console.log(`${e.ok ? "OK    " : "ERRORE"} ${e.nome}${e.ok ? "" : "\n       → " + e.errore}`));
    const ko = esiti.filter(e => !e.ok).length;
    console.log(`\n${esiti.length - ko} / ${esiti.length} superati`);
    process.exit(ko ? 1 : 0);
  }
})(typeof window !== "undefined" ? window : globalThis);
