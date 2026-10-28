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
    c.ca = () => c.caBase - (c.s ? C.malusCA(c.s) : 0); /* Sbilanciato e Incrinatura, come in partita */
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
    const s = scontro(), c = ctx({ dadi: [15, 4, 3, 2, 1] }); /* colpo 15+3, danno 4+3=7; poi tre tick (28/10: 3 turni): 3, 2 e 1 */
    prova(s, c, "morso_acciaio");
    eq(s.pv, 33, "danno del colpo"); eq(s.eff.sanguina, 3); eq(s.sangueDado, 4);
    eq(C.tickSangue(s, c).d, 3); C.fineTurnoNemico(s); eq(s.eff.sanguina, 2);
    eq(C.tickSangue(s, c).d, 2); C.fineTurnoNemico(s); eq(s.eff.sanguina, 1);
    eq(C.tickSangue(s, c).d, 1); C.fineTurnoNemico(s); eq(s.eff.sanguina, 0);
    eq(C.tickSangue(s, c), null, "finito: niente tick"); eq(s.pv, 27);
  });
  caso("2b. Rinnovo senza somma: un secondo sanguinamento riporta la durata, non la somma", () => {
    const s = scontro({ eff: { sanguina: 1 }, sangueDado: 4 }), c = ctx({ dadi: [15, 1] });
    prova(s, c, "morso_acciaio"); eq(s.eff.sanguina, 3, "3, non 4");
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
    eq(s.eff.debole, 2, "durata comune"); eq(s.eff.sanguina, 3);
  });

  /* ================= 6. Parata Mutilante ================= */
  caso("6a. Parata Mutilante: il primo colpo fa 0 danni, non dà ira, contrattacco e sanguinamento", () => {
    const s = scontro(), c = ctx({ liv: 4, dadi: [] });
    const r = prova(s, c, "parata"); eq(ev(r, "colpo").length, 0, "nessun tiro: consuma l'azione"); eq(s.parata, true);
    const c2 = ctx({ liv: 4, dadi: [5] }); c2.s = s;
    const sub = C.colpoSubito(s, c2, false);
    eq(sub.annullato, true); eq(sub.ira, 0); eq(s.pv, 32, "5 + 3 di contrattacco"); eq(s.eff.sanguina, 3); eq(s.parata, false);
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
  caso("9c. Le abilità delle vie non sono tra le tecniche da preparare e sono 3 per via e per tipo d'arma, ai livelli 3, 4, 5", () => {
    ["Tagliente", "Contundente"].forEach(tipo => {
      ["aldo", "guendalina"].forEach(v => eq(T.filter(t => t.via === v && t.tipo === tipo).map(t => t.liv), [3, 4, 5], v + " " + tipo));
      eq(T.filter(t => t.tipo === tipo && !t.via).map(t => t.liv), [1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5], tipo);
    });
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
  caso("11b. Ferita Riaperta senza sanguinamento: lo applica per 3 turni (durata comune)", () => {
    const s = scontro(), c = ctx({ liv: 4, dadi: [15, 2] }); prova(s, c, "ferita_riaperta"); eq(s.eff.sanguina, 3);
  });

  /* ================= Le altre tecniche del taglio ================= */
  caso("Fendente al Polso: Indebolito 2 turni (−2 al tiro del nemico)", () => {
    const s = scontro(); prova(s, ctx({ dadi: [15, 2] }), "polso"); eq(s.eff.debole, 2); eq(C.modAttaccoNem(s), -2);
  });
  caso("Pomolo Sbalorditivo: Sbilanciato 1 turno (−2 alla CA)", () => {
    const s = scontro(), c = ctx({ dadi: [15, 2] }); prova(s, c, "pomolo"); eq(s.eff.sbilanciato, 1); eq(c.ca(), 10);
  });
  caso("Recisione dei Tendini: Sanguinamento 2 e Sbilanciato 1", () => {
    const s = scontro(); prova(s, ctx({ liv: 2, dadi: [15, 2] }), "tendini"); eq([s.eff.sanguina, s.eff.sbilanciato], [3, 1]);
  });
  caso("Stoccata Cremisi: +1 dado; con sanguinamento lo rinnova e indebolisce, senza no", () => {
    const s = scontro(); const r = prova(s, ctx({ liv: 2, dadi: [15, 2, 2] }), "cremisi");
    eq(ev(r, "colpo")[0].nd, 2); eq(s.eff.sanguina || 0, 0); eq(s.eff.debole || 0, 0);
    const s2 = scontro({ eff: { sanguina: 1 }, sangueDado: 4 }); prova(s2, ctx({ liv: 2, dadi: [15, 2, 2] }), "cremisi");
    eq([s2.eff.sanguina, s2.eff.debole], [3, 2]);
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
    eq(ev(r, "colpo").map(e => e.danno), [2, 2, 2], "senza modificatore"); eq(s.eff.sanguina, 3); eq(s.eff.bloccato, 1);
    const b = scontro(), rb = prova(b, ctx({ liv: 5, boss: true, dadi: [15, 2, 15, 2, 15, 2] }), "cateratta"); eq(b.eff.bloccato || 0, 0); eq(ev(rb, "immune").length, 1);
    const m = scontro(), rm = prova(m, ctx({ liv: 5, dadi: [15, 2, 1, 15, 2] }), "cateratta"); eq(ev(rm, "ts").length, 0, "uno mancato: niente stordimento");
  });
  caso("Diluvio Rosso: Emorragia 1d6 3 turni e Indebolito 2 (durata comune)", () => {
    const s = scontro(); prova(s, ctx({ liv: 5, dadi: [15, 2, 2] }), "diluvio"); eq([s.eff.sanguina, s.sangueDado, s.eff.debole], [3, 6, 2]);
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
    prova(s, c, "ritmo"); eq(s.sconto, 2); eq(s.eff.debole, 2);
    eq(C.costo(tec("polso"), s), 1, "2 − 2 → minimo 1"); const r = prova(s, c, "polso"); eq(r.costo, 1); eq(s.sconto, 0, "lo sconto si consuma");
  });
  caso("Veglia Inflessibile: Indebolito e Sbilanciato 3, +2 CA e +4 ai tiri salvezza (Furore) per 3 turni", () => {
    const s = scontro(); prova(s, ctx({ liv: 5, dadi: [15, 2, 2] }), "veglia_inflessibile"); eq([s.eff.debole, s.eff.sbilanciato, s.eff.guardia, s.eff.furore], [2, 3, 3, 3]); eq(s.eff.incrollabile, undefined);
  });
  caso("Guardia: una guardia scaduta non lascia il vecchio valore (Postura Salda +3 poi Veglia di Ferro +2)", () => {
    const s = scontro(); prova(s, ctx(), "postura_salda"); eq(s.guardiaVal, 3); C.fineTurnoNemico(s);
    prova(s, ctx({ liv: 3, dadi: [2] }), "veglia_ferro"); eq(s.guardiaVal, 2);
  });

  /* ================= Contundenti: Incrinatura ================= */
  caso("C1. Incrinatura: −1 CA per carica, si somma fino a 3 e dura tutto lo scontro", () => {
    const s = scontro(), c = ctx({ dadi: [15, 2, 15, 2, 15, 2, 15, 2] });
    prova(s, c, "maglio"); eq(s.crepe, 1); eq(c.ca(), 11);
    prova(s, c, "maglio"); prova(s, c, "maglio"); eq(s.crepe, 3); eq(c.ca(), 9);
    const r = prova(s, c, "maglio"); eq(s.crepe, 3, "oltre il massimo si perde"); eq(ev(r, "crepe")[0].perse, 1);
    for (let i = 0; i < 10; i++) C.fineTurnoNemico(s); eq(s.crepe, 3, "non scade con i turni");
  });
  caso("C2. Incrinatura su un boss: al massimo 2 cariche", () => {
    const s = scontro(), c = ctx({ liv: 5, boss: true, dadi: [15, 2, 2] });
    const r = prova(s, c, "impatto_cataclisma"); eq(s.crepe, 2); eq(ev(r, "crepe")[0], { k: "crepe", n: 2, perse: 1, tot: 2, max: 2 });
  });
  caso("C3. Incrinatura + Sbilanciato: CA −5 su un comune, −4 su un boss", () => {
    const s = scontro(), c = ctx({ liv: 5, dadi: [15, 2, 2] }); prova(s, c, "impatto_cataclisma"); eq(C.malusCA(s), 5); eq(c.ca(), 7);
    const b = scontro(), cb = ctx({ liv: 5, boss: true, dadi: [15, 2, 2] }); prova(b, cb, "impatto_cataclisma"); eq(C.malusCA(b), 4); eq(b.eff.sbilanciato, 2, "tetto dei boss");
  });

  /* ================= Contundenti: Frattura ================= */
  caso("C4. Frattura: 1d4 a ogni attacco del nemico, poi scade", () => {
    const s = scontro(), c = ctx({ liv: 2, dadi: [15, 2, 2, 3, 4] });
    prova(s, c, "costole"); eq(s.eff.frattura, 2); eq(s.pv, 40 - 7);
    eq(C.frattura(s, c).d, 3); eq(s.pv, 30);
    eq(C.frattura(s, c).d, 4, "anche la Presa nello stesso turno"); C.fineTurnoNemico(s); C.fineTurnoNemico(s);
    eq(C.frattura(s, c), null, "scaduta");
  });
  caso("C5. Frattura funziona anche sui boss; quella della Sentenza dura tutto lo scontro", () => {
    const b = scontro(); prova(b, ctx({ liv: 2, boss: true, dadi: [15, 2, 2] }), "costole"); eq(b.eff.frattura, 2);
    const s = scontro({ pv: 80, pvMax: 80 }), c = ctx({ liv: 5, dadi: [15, 2, 2, 18] });
    const r = prova(s, c, "sentenza_maglio"); eq(ev(r, "colpo")[0].mA, 8, "+5 per colpire"); eq(ev(r, "colpo")[0].nd, 2, "dadi doppi");
    vero(C.perScontro(s.eff.frattura)); for (let i = 0; i < 20; i++) C.fineTurnoNemico(s); vero(C.attivo(s, "frattura"), "ancora attiva");
    eq(prova(s, ctx({ liv: 5, usate: c.usate }), "sentenza_maglio").rifiutata, true, "una volta per riposo");
  });

  /* ================= Contundenti: le 15 tecniche ================= */
  caso("Percossa al Mento: Indebolito 1 e niente critici nel prossimo turno, anche su un boss", () => {
    const s = scontro(), c = ctx({ liv: 1, boss: true, dadi: [15, 2] }); prova(s, c, "mento");
    eq([s.eff.debole, s.eff.intontito], [2, 1]); eq(C.critNemPossibile(s), false); eq(C.modAttaccoNem(s), -2);
    C.fineTurnoNemico(s); eq(C.critNemPossibile(s), true);
  });
  caso("Impatto Sbilanciante: Sbilanciato 1 e Indebolito 1", () => {
    const s = scontro(); prova(s, ctx({ dadi: [15, 2] }), "sbilanciante"); eq([s.eff.sbilanciato, s.eff.debole], [1, 2]);
  });
  caso("Frantumazione dello Scudo: 2 cariche di Incrinatura", () => {
    const s = scontro(); prova(s, ctx({ liv: 2, dadi: [15, 2] }), "frantumascudo"); eq(s.crepe, 2);
  });
  caso("Mazzata Tremante: non resiste → Frastornato; resiste → Sbilanciato; boss → Sbilanciato senza tiro", () => {
    const a = scontro(); prova(a, ctx({ liv: 2, dadi: [15, 2, 3] }), "tremante"); eq([a.eff.frastornato, a.eff.sbilanciato || 0], [1, 0]);
    const b = scontro(); prova(b, ctx({ liv: 2, dadi: [15, 2, 18] }), "tremante"); eq([b.eff.frastornato || 0, b.eff.sbilanciato], [0, 1]);
    const c = scontro(), r = prova(c, ctx({ liv: 2, boss: true, dadi: [15, 2] }), "tremante"); eq(c.eff.sbilanciato, 1); eq(ev(r, "ts").length, 0);
  });
  caso("Martellata Sismica: 1 carica e Sbilanciato 2", () => {
    const s = scontro(); prova(s, ctx({ liv: 3, dadi: [15, 2] }), "sismica"); eq([s.crepe, s.eff.sbilanciato], [1, 2]);
  });
  caso("Impatto Demolitore: +1 dado e 2 cariche", () => {
    const s = scontro(), r = prova(s, ctx({ liv: 3, dadi: [15, 2, 2] }), "demolitore"); eq(ev(r, "colpo")[0].nd, 2); eq(s.crepe, 2);
  });
  caso("Colpo del Coma: Stordito; se resiste Indebolito 2; boss Indebolito 2 senza tiro; nessun dado extra", () => {
    const a = scontro(), ra = prova(a, ctx({ liv: 3, dadi: [15, 2, 3] }), "coma"); eq(a.eff.bloccato, 1); eq(ev(ra, "colpo")[0].nd, 1);
    const b = scontro(); prova(b, ctx({ liv: 3, dadi: [15, 2, 18] }), "coma"); eq([b.eff.bloccato || 0, b.eff.debole], [0, 2]);
    const c = scontro(), r = prova(c, ctx({ liv: 3, boss: true, dadi: [15, 2] }), "coma"); eq([c.eff.bloccato || 0, c.eff.debole], [0, 2]); eq(ev(r, "ts").length, 0);
  });
  caso("Spezza-Ginocchia: +1 dado, Indebolito e Sbilanciato 3 (2 su un boss), costa 8", () => {
    eq(tec("ginocchia").costo, 8);
    const s = scontro(); prova(s, ctx({ liv: 4, dadi: [15, 2, 2] }), "ginocchia"); eq([s.eff.debole, s.eff.sbilanciato], [2, 3]);
    const b = scontro(); prova(b, ctx({ liv: 4, boss: true, dadi: [15, 2, 2] }), "ginocchia"); eq([b.eff.debole, b.eff.sbilanciato], [2, 2]);
  });
  caso("Demolizione della Guardia: due attacchi col solo dado; due a segno → 2 cariche e Stordito (boss: Sbilanciato 2)", () => {
    const s = scontro(), r = prova(s, ctx({ liv: 4, dadi: [15, 2, 15, 3, 4] }), "demolizione");
    eq(ev(r, "colpo").map(e => e.danno), [2, 3], "senza modificatore"); eq(s.crepe, 2); eq(s.eff.bloccato, 1);
    const b = scontro(), rb = prova(b, ctx({ liv: 4, boss: true, dadi: [15, 2, 15, 3] }), "demolizione"); eq([b.crepe, b.eff.bloccato || 0, b.eff.sbilanciato], [2, 0, 2]); eq(ev(rb, "ts").length, 0);
    const m = scontro(); prova(m, ctx({ liv: 4, dadi: [15, 2, 1] }), "demolizione"); eq(m.crepe || 0, 0, "uno mancato: niente");
    const z = scontro(); prova(z, ctx({ liv: 4, dadi: [15, 2, 15, 3, 18] }), "demolizione"); eq([z.crepe, z.eff.sbilanciato || 0], [2, 0], "il comune che resiste non ha ripiego");
  });
  caso("Contro-Schiacciamento: 0 danni, nessuna ira, contrattacco e 1 carica di Incrinatura", () => {
    const s = scontro(), r = prova(s, ctx({ liv: 4 }), "controschiaccio"); eq(ev(r, "colpo").length, 0); eq(s.parata, true);
    const c2 = ctx({ liv: 4, dadi: [5] }); c2.s = s;
    const sub = C.colpoSubito(s, c2, false); eq(sub.annullato, true); eq(sub.ira, 0); eq(s.pv, 32); eq(s.crepe, 1); eq(s.eff.sanguina || 0, 0, "niente sanguinamento");
    const p = scontro(); prova(p, ctx({ liv: 4 }), "controschiaccio"); C.inizioTurnoPg(p); eq([p.parata, p.parataCrepe], [false, false]);
    const q = scontro(); prova(q, ctx({ liv: 4 }), "controschiaccio"); C.inizioTurnoPg(q); prova(q, ctx({ liv: 4 }), "parata");
    C.colpoSubito(q, ctx({ liv: 4, dadi: [1, 1] }), false); eq([q.crepe || 0, q.eff.sanguina], [0, 3], "la Parata di dopo resta da taglio");
  });
  caso("Cateratta della Roccia: 3 attacchi col solo dado, 1 carica a colpo; 3 su 3 → Stordito (boss: Sbilanciato 2)", () => {
    const s = scontro(), r = prova(s, ctx({ liv: 5, dadi: [15, 2, 15, 2, 15, 2, 3] }), "cateratta_roccia");
    eq(ev(r, "colpo").map(e => e.danno), [2, 2, 2]); eq(s.crepe, 3); eq(s.eff.bloccato, 1);
    const b = scontro(); prova(b, ctx({ liv: 5, boss: true, dadi: [15, 2, 15, 2, 15, 2] }), "cateratta_roccia"); eq([b.crepe, b.eff.sbilanciato], [2, 2]);
    const m = scontro(), rm = prova(m, ctx({ liv: 5, dadi: [15, 2, 1, 15, 2] }), "cateratta_roccia"); eq(m.crepe, 2); eq(ev(rm, "ts").length, 0);
  });
  caso("Impatto del Cataclisma: niente tiro salvezza né Frastornato", () => {
    const s = scontro(), r = prova(s, ctx({ liv: 5, dadi: [15, 2, 2] }), "impatto_cataclisma"); eq(ev(r, "ts").length, 0); eq(s.eff.frastornato || 0, 0);
  });

  /* ================= Contundenti: vie di prestigio ================= */
  caso("Sigillo del Demolitore: +1d4 agli attacchi normali solo con le cariche massime", () => {
    const s = scontro(), c = ctx({ liv: 3, dadi: [15, 2, 15, 2, 15, 2, 15, 2, 3] }); c.s = s;
    prova(s, c, "sigillo"); eq([s.crepe, s.sigillo], [2, true]);
    eq(C.colpo(s, c, { base: true }).sigillo, undefined, "2 cariche su un comune: non basta");
    prova(s, c, "maglio"); eq(s.crepe, 3); const b = C.colpo(s, c, { base: true }); eq(b.sigillo, 3); eq(b.danno, 2 + 3 + 3);
    const x = scontro(), cx = ctx({ liv: 3, boss: true, dadi: [15, 2, 15, 2, 4] }); cx.s = x; prova(x, cx, "sigillo"); eq(C.colpo(x, cx, { base: true }).sigillo, 4, "sul boss bastano 2");
  });
  caso("Crollo: +1 dado per carica, le cariche si consumano; senza cariche ne dà 2; se manca restano", () => {
    const s = scontro({ crepe: 3 }), r = prova(s, ctx({ liv: 4, dadi: [15, 1, 1, 1, 1] }), "crollo"); eq(ev(r, "colpo")[0].nd, 4); eq(s.crepe, 0); eq(ev(r, "crollo")[0].n, 3);
    const n = scontro(); prova(n, ctx({ liv: 4, dadi: [15, 2] }), "crollo"); eq(n.crepe, 2);
    const m = scontro({ crepe: 2 }); prova(m, ctx({ liv: 4, dadi: [1] }), "crollo"); eq(m.crepe, 2);
  });
  caso("Martello del Mastro: critico sicuro e Frattura per lo scontro solo con le cariche massime", () => {
    const s = scontro({ crepe: 3 }), r = prova(s, ctx({ liv: 5, dadi: [15, 2, 2] }), "martello"); eq(ev(r, "colpo")[0].crit, true); vero(C.perScontro(s.eff.frattura));
    const n = scontro({ crepe: 2 }), rn = prova(n, ctx({ liv: 5, dadi: [15, 2] }), "martello"); eq(ev(rn, "colpo")[0].crit, false); eq(n.eff.frattura || 0, 0);
    const b = scontro({ crepe: 2 }), rb = prova(b, ctx({ liv: 5, boss: true, dadi: [15, 2, 2] }), "martello"); eq(ev(rb, "colpo")[0].crit, true, "sul boss bastano 2");
  });
  caso("Rintocco: Frastornato (boss: Indebolito 2) e +2 CA per un turno, anche se manchi", () => {
    const s = scontro(); prova(s, ctx({ liv: 3, dadi: [15, 2, 3] }), "rintocco"); eq([s.eff.frastornato, s.eff.guardia, s.guardiaVal], [1, 1, 2]);
    const b = scontro(), rb = prova(b, ctx({ liv: 3, boss: true, dadi: [15, 2] }), "rintocco"); eq([b.eff.frastornato || 0, b.eff.debole], [0, 2]); eq(ev(rb, "ts").length, 0);
    const z = scontro(); prova(z, ctx({ liv: 3, dadi: [15, 2, 18] }), "rintocco"); eq(z.eff.debole || 0, 0, "il comune che resiste non ha ripiego");
    const m = scontro(); prova(m, ctx({ liv: 3, dadi: [2] }), "rintocco"); eq(m.eff.guardia, 1);
  });
  caso("Cadenza della Campana: Stordito (boss: Indebolito e Sbilanciato 2) e prossima tecnica −2", () => {
    const s = scontro(); prova(s, ctx({ liv: 4, dadi: [15, 2, 2, 3] }), "cadenza"); eq([s.eff.bloccato, s.sconto], [1, 2]);
    const b = scontro(); prova(b, ctx({ liv: 4, boss: true, dadi: [15, 2, 2] }), "cadenza"); eq([b.eff.bloccato || 0, b.eff.debole, b.eff.sbilanciato], [0, 2, 2]);
  });
  caso("Silenzio della Casa: niente attacchi speciali sui comuni, +4 ai tiri salvezza contro i boss, +2 CA per 3 turni", () => {
    const s = scontro(); prova(s, ctx({ liv: 5, dadi: [15, 2, 2] }), "silenzio_casa"); eq([s.eff.debole, s.eff.sbilanciato, s.eff.silenzio, s.eff.guardia, s.eff.furore || 0], [2, 3, 2, 3, 0]);
    const b = scontro(); prova(b, ctx({ liv: 5, boss: true, dadi: [15, 2, 2] }), "silenzio_casa"); eq([b.eff.silenzio || 0, b.eff.furore, b.eff.guardia], [0, 3, 3]);
  });

  /* ================= Perforanti: Esposto e intervallo del critico ================= */
  caso("Esposto: critico con un numero in meno anche sugli attacchi normali, mai sotto 18", () => {
    const s = scontro({ eff: { esposto: 1 } }), c = ctx({ dadi: [19, 1, 1, 18, 1, 1, 17, 1] }); c.s = s;
    eq(C.colpo(s, c, { base: true }).crit, true, "19 con Esposto");
    eq(prova(s, c, "cuore").eventi[0].crit, true, "Affondo al Cuore + Esposto: 18");
    const f = ev(prova(s, c, "fianco"), "colpo")[0]; eq([f.ok, f.crit, f.critDa], [true, false, 18], "tetto: 17 non è critico");
    eq(C.sogliaCrit({ eff: { esposto: 1, precisione: 2 } }, 19), 18); eq(C.sogliaCrit({ eff: {} }), 20);
  });
  caso("Esposto sui boss: al massimo 2 turni", () => {
    const b = scontro(), r = prova(b, ctx({ liv: 4, boss: true, dadi: [15, 1, 1] }), "ferita_profonda");
    eq([b.eff.esposto, b.eff.debole], [2, 2]); vero(ev(r, "stato").find(e => e.s === "esposto").ridotto);
  });
  caso("Mirare al Varco: Esposto 2 se colpisce, niente se manca", () => {
    const s = scontro(); prova(s, ctx({ dadi: [15, 2] }), "varco"); eq([s.eff.esposto, s.pv], [2, 35]);
    const m = scontro(); prova(m, ctx({ dadi: [2] }), "varco"); eq(m.eff.esposto || 0, 0);
  });
  caso("Trafittura e Perforazione Profonda: +3 per colpire e un dado in più", () => {
    const s = scontro(), r = ev(prova(s, ctx({ liv: 2, dadi: [8, 1, 1] }), "trafittura"), "colpo")[0]; eq([r.ok, r.mA, r.nd], [true, 6, 2]);
    const p = scontro(), rp = ev(prova(p, ctx({ liv: 3, dadi: [10, 1, 1] }), "perforazione"), "colpo")[0]; eq([rp.mA, rp.nd, p.eff.esposto], [6, 2, 2]);
  });
  caso("Punta nel Fianco: critico da 18, Indebolito solo sul critico", () => {
    const s = scontro(), r = ev(prova(s, ctx({ liv: 2, dadi: [18, 1, 1] }), "fianco"), "colpo")[0]; eq([r.crit, r.nd, s.eff.debole], [true, 2, 2]);
    const n = scontro(); prova(n, ctx({ liv: 2, dadi: [17, 1] }), "fianco"); eq(n.eff.debole || 0, 0);
  });
  caso("Doppia Punta: due attacchi col solo dado, critico da 19", () => {
    const s = scontro(), r = ev(prova(s, ctx({ liv: 3, dadi: [19, 1, 1, 2] }), "doppia_punta"), "colpo");
    eq(r.length, 2); eq([r[0].crit, r[0].nd, r[0].mm, r[1].ok], [true, 2, 0, false]); eq(s.pv, 38);
  });
  caso("Colpo Mirato: se colpisce è sempre critico", () => {
    const s = scontro(), r = ev(prova(s, ctx({ liv: 3, dadi: [15, 1, 1] }), "mirato"), "colpo")[0]; eq([r.crit, r.nd], [true, 2]);
    const m = scontro(), rm = ev(prova(m, ctx({ liv: 3, dadi: [2] }), "mirato"), "colpo")[0]; eq([rm.ok, rm.crit], [false, false]);
  });
  caso("Guardia di Punta: 0 danni, contrattacco critico con 18-20 ed Esposto 2, niente ira", () => {
    const s = scontro(), c = ctx({ liv: 4 }); prova(s, c, "guardia_punta"); eq([s.parata, s.parataPunta], [true, true]);
    const sub = C.colpoSubito(s, ctx({ liv: 4, dadi: [18, 2, 3] }), false), k = sub.eventi.find(e => e.k === "contrattacco");
    eq([sub.annullato, sub.ira, k.crit, k.tiri, k.danno, s.eff.esposto, s.parata], [true, 0, true, [2, 3], 8, 2, false]);
    const n = scontro(); prova(n, ctx({ liv: 4 }), "guardia_punta"); const k2 = C.colpoSubito(n, ctx({ liv: 4, dadi: [10, 4] }), false).eventi.find(e => e.k === "contrattacco"); eq([k2.crit, k2.danno], [false, 7]);
  });
  caso("Colpo di Grazia: esecuzione dei comuni sotto un quarto, mai sui boss", () => {
    const s = scontro({ pv: 14 }), r = prova(s, ctx({ liv: 4, dadi: [15, 1, 1] }), "grazia"); eq(s.pv, 0); eq(ev(r, "esecuzione").length, 1);
    const b = scontro({ pv: 14 }); prova(b, ctx({ liv: 4, boss: true, dadi: [15, 1, 1] }), "grazia"); eq(b.pv, 9);
    const g = scontro({ pv: 40 }); prova(g, ctx({ liv: 4, dadi: [19, 1, 1, 1, 1] }), "grazia"); eq(g.pv, 33, "critico da 19: 4 dadi");
  });
  caso("Tempesta di Punte: ogni critico dà Esposto; 3 su 3 → Stordito (boss: Indebolito 2)", () => {
    const s = scontro(), r = prova(s, ctx({ liv: 5, dadi: [18, 1, 1, 15, 1, 15, 1, 2] }), "tempesta");
    eq(ev(r, "colpo").map(e => e.crit), [true, false, false]); eq([s.eff.esposto, s.eff.bloccato], [2, 1]);
    const b = scontro(), rb = prova(b, ctx({ liv: 5, boss: true, dadi: [15, 1, 15, 1, 15, 1] }), "tempesta"); eq([b.eff.bloccato || 0, b.eff.debole], [0, 2]); eq(ev(rb, "ts").length, 0);
  });
  caso("Trafittura Celeste: +5 per colpire, Esposto e Sbilanciato 3", () => {
    const s = scontro(), r = ev(prova(s, ctx({ liv: 5, dadi: [7, 1, 1] }), "celeste"), "colpo")[0]; eq([r.ok, r.mA, s.eff.esposto, s.eff.sbilanciato], [true, 8, 3, 3]);
  });
  caso("Il Colpo Perfetto: una volta per riposo, critico sicuro con un dado in più (4 dadi) e attacco gratuito", () => {
    const s = scontro({ pv: 60, pvMax: 60 }), c = ctx({ liv: 5, dadi: [15, 1, 1, 1, 1, 15, 1] }), r = prova(s, c, "colpo_perfetto"), k = ev(r, "colpo");
    eq([k[0].crit, k[0].nd, k[1].nd, ev(r, "attaccoGratuito").length], [true, 4, 1, 1]); eq(c.usate.colpo_perfetto, true);
    eq(prova(s, c, "colpo_perfetto").rifiutata, true);
  });
  caso("Segno del Cacciatore: Esposto 3 e +1d4 agli attacchi normali finché dura", () => {
    const s = scontro(), c = ctx({ liv: 3, dadi: [15, 2, 15, 2, 4] }); c.s = s;
    prova(s, c, "segno"); eq([s.eff.esposto, s.segno], [3, true]);
    const b = C.colpo(s, c, { base: true }); eq([b.segno, b.danno], [4, 9]);
    C.fineTurnoNemico(s); C.fineTurnoNemico(s); C.fineTurnoNemico(s); eq([s.eff.esposto, s.segno], [0, false]);
  });
  caso("Trapasso: +5 per colpire; con Esposto un altro dado e l'Esposto si consuma", () => {
    const s = scontro({ eff: { esposto: 2 }, segno: true }), r = prova(s, ctx({ liv: 4, dadi: [10, 1, 1, 1] }), "trapasso"), k = ev(r, "colpo")[0];
    eq([k.mA, k.nd, s.eff.esposto, s.segno, ev(r, "espostoConsumato").length], [8, 3, 0, false, 1]);
    const n = scontro(); eq(ev(prova(n, ctx({ liv: 4, dadi: [10, 1, 1] }), "trapasso"), "colpo")[0].nd, 2);
  });
  caso("Il Foro Eterno: con Esposto critico sicuro ed Esposto per lo scontro (boss: 2 turni)", () => {
    const s = scontro({ eff: { esposto: 1 } }), r = prova(s, ctx({ liv: 5, dadi: [15, 1, 1] }), "foro"); eq(ev(r, "colpo")[0].crit, true); vero(C.perScontro(s.eff.esposto));
    const b = scontro({ eff: { esposto: 1 } }); prova(b, ctx({ liv: 5, boss: true, dadi: [15, 1, 1] }), "foro"); eq(b.eff.esposto, 2);
    const n = scontro(); eq(ev(prova(n, ctx({ liv: 5, dadi: [15, 1] }), "foro"), "colpo")[0].crit, false);
  });
  caso("Occhio Vigile: critico da 19 e +2 CA fino al tuo turno", () => {
    const s = scontro(), r = prova(s, ctx({ liv: 3, dadi: [19, 1, 1] }), "occhio_vigile"); eq([ev(r, "colpo")[0].crit, s.eff.guardia, s.guardiaVal], [true, 1, 2]);
  });
  caso("Stoccata a Specchio: critico da 18 → Frastornato (boss: Indebolito 2), prossima tecnica −2", () => {
    const s = scontro(); prova(s, ctx({ liv: 4, dadi: [18, 1, 1, 1, 1, 2] }), "specchio"); eq([s.eff.frastornato, s.sconto], [1, 2]);
    const b = scontro(); prova(b, ctx({ liv: 4, boss: true, dadi: [18, 1, 1, 1, 1] }), "specchio"); eq([b.eff.frastornato || 0, b.eff.debole], [0, 2]);
    const n = scontro(); prova(n, ctx({ liv: 4, dadi: [15, 1, 1] }), "specchio"); eq([n.eff.frastornato || 0, n.sconto], [0, 2]);
  });
  caso("Affondo dei Mille Soli: Esposto e Indebolito 3, +2 CA e critico da 18 per 3 turni", () => {
    const s = scontro(), c = ctx({ liv: 5, dadi: [15, 1, 1, 18, 1, 1] }); c.s = s;
    prova(s, c, "mille_soli"); eq([s.eff.esposto, s.eff.debole, s.eff.guardia, s.eff.precisione], [3, 2, 3, 3]);
    eq(C.colpo(s, c, { base: true }).crit, true, "18 è critico");
  });

  /* ================= Le tecniche già esistenti funzionano ancora ================= */
  /* ================= Scudo: Carica Cinetica, assorbimento, difese ================= */
  caso("S1. Carica Cinetica: massimo 3 anche sui boss, le cariche oltre il massimo vanno perse", () => {
    const s = scontro(); eq(C.carica(s, 2).tot, 2); const e = C.carica(s, 2); eq([e.n, e.perse, e.tot, s.cariche], [1, 1, 3, 3]);
    const b = scontro(), c = ctx({ boss: true, liv: 2 }); prova(b, c, "muro"); C.colpoSubito(b, c, false, 6); eq(b.cariche, 3, "boss: 3 come per tutti");
  });
  caso("S2. Assorbimento Minimale: colpo di scudo 1d4; il primo colpo subito fa metà danni (ira normale) e dà 1 Carica", () => {
    const s = scontro(), c = ctx({ dadi: [15, 2] });
    const r = prova(s, c, "assorbimento"); eq(ev(r, "colpo")[0].dado, 4); eq(s.pv, 35);
    const sub = C.colpoSubito(s, c, false, 7); eq([sub.danno, sub.ira, sub.annullato, s.cariche, s.assorbiti], [3, 1, false, 1, 1]);
    eq(C.colpoSubito(s, c, false, 7).danno, 7, "solo il primo colpo");
  });
  caso("S3. Postura Salda: consuma l'azione, +3 CA fino al tuo turno, niente Presa; se il nemico manca, 1 Carica", () => {
    const s = scontro(), c = ctx(); const r = prova(s, c, "postura_salda");
    eq(ev(r, "colpo").length, 0, "nessun attacco"); eq([s.guardiaVal, s.eff.guardia], [3, 1]); eq(C.presaBloccata(s), true);
    C.colpoMancato(s, c); eq(s.cariche, 1); C.inizioTurnoPg(s, c); eq(C.presaBloccata(s), false);
    eq(C.colpoMancato(s, c).length, 0, "scaduta: niente Carica");
  });
  caso("S4. Rimbalzo della Marea: metà danni a te, l'altra metà al nemico senza tiro, 1 Carica", () => {
    const s = scontro(), c = ctx(); prova(s, c, "rimbalzo_marea");
    const sub = C.colpoSubito(s, c, false, 7); eq([sub.danno, s.pv, s.cariche], [3, 36, 1]); eq(ev(sub, "rimbalzo")[0].danno, 4);
  });
  caso("S5. Batteria Cinetica: 0 danni ma l'ira resta; Muro di Assorbimento: 0 danni, niente ira, 3 Cariche", () => {
    const s = scontro(), c = ctx({ liv: 2 }); prova(s, c, "batteria");
    const a = C.colpoSubito(s, c, true, 9); eq([a.danno, a.annullato, a.ira, s.cariche], [0, true, 2, 1], "critico: ira doppia");
    const m = scontro(); prova(m, c, "muro"); const b = C.colpoSubito(m, c, false, 9); eq([b.danno, b.ira, m.cariche], [0, 0, 3]);
  });
  caso("S6. Niente difesa dello scudo due turni di fila; un colpo di scudo o un attacco in mezzo la sblocca", () => {
    const s = scontro(), c = ctx({ liv: 2, dadi: [2] }); prova(s, c, "muro"); C.inizioTurnoPg(s, c);
    eq(C.disponibile(tec("postura_salda"), s).ok, false); const r = prova(s, c, "postura_salda"); eq([r.rifiutata, r.costo, ev(r, "difesaDiFila").length], [true, 0, 1]);
    eq(C.disponibile(tec("assorbimento"), s).ok, true, "le tecniche che attaccano restano libere");
    prova(s, c, "assorbimento"); C.inizioTurnoPg(s, c); eq(C.disponibile(tec("postura_salda"), s).ok, true, "un turno dopo si può");
  });
  caso("S7. Spinta della Risacca: 1d6; tiro salvezza fallito → perde il Soffio e niente attacchi speciali; resiste o boss → Sbilanciato", () => {
    const s = scontro({ soffioPronto: true }); prova(s, ctx({ liv: 2, dadi: [15, 2, 5] }), "spinta"); eq([s.eff.silenzio, s.soffioPronto, s.pv], [1, false, 35]);
    const r = scontro(); prova(r, ctx({ liv: 2, dadi: [15, 2, 18] }), "spinta"); eq([r.eff.silenzio || 0, r.eff.sbilanciato], [0, 1]);
    const b = scontro(), cb = ctx({ liv: 2, boss: true, dadi: [15, 2] }); prova(b, cb, "spinta"); eq(b.eff.sbilanciato, 1); eq(cb.tira.resto(), 0, "boss: nessun tiro salvezza");
  });
  caso("S8. Inversione della Marea: +1 dado e +2 CA per 2 turni solo se il nemico ti ha colpito nel suo ultimo turno", () => {
    const s = scontro(), c = ctx({ liv: 3, dadi: [15, 2] }); prova(s, c, "inversione"); eq([s.pv, s.eff.guardia || 0], [35, 0]);
    C.colpoSubito(s, c, false, 4); C.inizioTurnoPg(s, c);
    const c2 = ctx({ liv: 3, dadi: [15, 2, 3] }); prova(s, c2, "inversione"); eq([s.pv, s.eff.guardia, s.guardiaVal], [27, 2, 2]);
    C.inizioTurnoPg(s, c2); eq(s.colpitoUltimo, false, "un turno senza colpi: niente vendetta");
  });
  caso("S9. Onda di Ritorno: serve almeno 1 Carica; 1d6 per Carica + Vigore, senza tiro per colpire", () => {
    const s = scontro(); eq(C.disponibile(tec("onda_ritorno"), s).ok, false); eq(prova(s, ctx({ liv: 3 }), "onda_ritorno").rifiutata, true);
    s.cariche = 2; const c = ctx({ liv: 3, dadi: [4, 5] }); const r = prova(s, c, "onda_ritorno");
    eq([s.pv, s.cariche, ev(r, "colpo").length], [28, 0, 0]); eq(c.tira.resto(), 0);
  });
  caso("S10. Baluardo d'Acciaio: +2 CA per 2 turni; ogni colpo subito dà ira doppia e 1 Carica", () => {
    const s = scontro(), c = ctx({ liv: 3 }); prova(s, c, "baluardo"); eq([s.eff.guardia, s.guardiaVal, s.eff.baluardo], [2, 2, 2]);
    const a = C.colpoSubito(s, c, false, 6); eq([a.danno, a.ira, s.cariche], [6, 4, 1]); C.colpoSubito(s, c, false, 6); eq(s.cariche, 2);
    C.fineTurnoNemico(s); C.fineTurnoNemico(s); eq(C.colpoSubito(s, c, false, 6).ira, 2, "finito: ira normale");
  });
  caso("S11. Risucchio della Voragine: 2d6 + Vigore; se colpisce 1 Carica e 1d4 ira", () => {
    const s = scontro(), c = ctx({ liv: 4, dadi: [15, 3, 4, 2] }); prova(s, c, "risucchio"); eq([s.pv, s.cariche, c.ira], [30, 1, 2]);
  });
  caso("S12. Postura del Mare Profondo: ogni colpo fa 0 danni e dà 1 Carica; al tuo turno 1d6 + Vigore per colpo assorbito", () => {
    const s = scontro(), c = ctx({ liv: 4 }); prova(s, c, "mare_profondo");
    const a = C.colpoSubito(s, c, false, 6), b = C.colpoSubito(s, c, false, 5); eq([a.danno, a.ira, b.danno, s.cariche, s.assorbiti], [0, 0, 0, 2, 2]);
    const r = C.inizioTurnoPg(s, ctx({ liv: 4, dadi: [5, 6] })); eq(s.pv, 23); eq(r.filter(e => e.k === "onda").length, 2); eq(s.assorbe, null);
  });
  caso("S13. Frantumazione della Riserva: 2d6; tiro salvezza → niente attacchi speciali + Indebolito 2; boss Indebolito + Sbilanciato 2 senza tiro", () => {
    const s = scontro(); prova(s, ctx({ liv: 4, dadi: [15, 1, 1, 5] }), "frantumazione"); eq([s.eff.silenzio, s.eff.debole, s.pv], [2, 2, 35]);
    const b = scontro(), cb = ctx({ liv: 4, boss: true, dadi: [15, 1, 1] }); const r = prova(b, cb, "frantumazione");
    eq([b.eff.silenzio || 0, b.eff.debole, b.eff.sbilanciato], [0, 2, 2]); eq(ev(r, "ts").length, 0); eq(cb.tira.resto(), 0);
  });
  caso("S14. Tempesta di Risacca: 3 colpi col solo dado, 1 Carica per colpo; 3 su 3 → Stordito (boss: Sbilanciato 2)", () => {
    const s = scontro(), c = ctx({ liv: 5, dadi: [15, 2, 15, 3, 15, 4, 5] }); prova(s, c, "tempesta_risacca"); eq([s.pv, s.cariche, s.eff.bloccato], [31, 3, 1]);
    const b = scontro(), cb = ctx({ liv: 5, boss: true, dadi: [15, 2, 15, 3, 15, 4] }); prova(b, cb, "tempesta_risacca"); eq([b.eff.bloccato || 0, b.eff.sbilanciato], [0, 2]);
    const m = scontro(); prova(m, ctx({ liv: 5, dadi: [15, 2, 2, 15, 4] }), "tempesta_risacca"); eq([m.cariche, m.eff.bloccato || 0], [2, 0], "2 su 3: niente controllo");
  });
  caso("S15. Ancoraggio del Cosmo: 0 danni al primo colpo, Cariche al massimo, niente attacchi speciali 3 (boss: Indebolito 2)", () => {
    const s = scontro(), c = ctx({ liv: 5, dadi: [4] }); prova(s, c, "ancoraggio"); eq([s.cariche, s.eff.silenzio], [3, 3]); eq(C.colpoSubito(s, c, false, 8).danno, 0);
    const b = scontro(), cb = ctx({ liv: 5, boss: true }); prova(b, cb, "ancoraggio"); eq([b.eff.silenzio || 0, b.eff.debole, b.cariche], [0, 2, 3]);
  });
  caso("S16. Egida del Vuoto: una volta per riposo; ogni colpo 0 danni e 1 Carica; al tuo turno 2d6 per Carica + Vigore, Cariche a zero", () => {
    const s = scontro({ cariche: 1 }), c = ctx({ liv: 5 }); prova(s, c, "egida"); eq(c.usate.egida, true);
    C.colpoSubito(s, c, false, 9); eq(s.cariche, 2);
    C.inizioTurnoPg(s, ctx({ liv: 5, dadi: [1, 2, 3, 4] })); eq([s.pv, s.cariche], [27, 0]);
    const r = prova(scontro(), c, "egida"); eq([r.rifiutata, ev(r, "giaUsataRiposo").length], [true, 1]);
    const v = scontro(); prova(v, ctx({ liv: 5 }), "egida"); const w = C.inizioTurnoPg(v, ctx({ liv: 5 })); eq(w[0].k, "ondaVuota"); eq(v.pv, 40);
  });
  caso("S17. Fortezza Eterna (via di Guendalina): una volta per scontro il colpo mortale ti lascia a 1 e dà 3 Cariche", () => {
    const s = scontro(), c = ctx({ liv: 5, dadi: [15, 1, 1] }); prova(s, c, "fortezza_eterna"); eq([s.eff.silenzio, s.eff.debole, s.eff.guardia, s.eff.fortezza], [3, 2, 3, 3]);
    const f = C.fortezza(s, 10, 6); eq([f.danno, s.cariche, s.fortezzaUsata], [5, 3, true]); eq(C.fortezza(s, 10, 1).danno, 10, "una sola volta");
    eq(C.fortezza(scontro(), 10, 6).danno, 10, "senza Fortezza nulla cambia");
    const b = scontro(); prova(b, ctx({ liv: 5, boss: true, dadi: [15, 1, 1] }), "fortezza_eterna"); eq([b.eff.silenzio || 0, b.eff.debole, b.eff.sbilanciato], [0, 2, 2]);
  });
  caso("S18. Marea Elastica (via di Aldo): metà danni e 2 Cariche; con almeno 2 Cariche ogni colpo subito restituisce 1d4", () => {
    const s = scontro(), c = ctx({ liv: 3, dadi: [15, 2] }); prova(s, c, "marea_elastica"); eq([s.pv, s.elastica], [35, true]);
    const sub = C.colpoSubito(s, ctx({ liv: 3, dadi: [3] }), false, 8); eq([sub.danno, s.cariche, s.pv], [4, 2, 32]);
    s.cariche = 1; const n = C.colpoSubito(s, ctx({ liv: 3 }), false, 8); eq([n.danno, s.pv], [8, 32], "sotto 2 Cariche: niente");
  });
  caso("S19. Onda di Rimbalzo (via di Aldo): +3 per colpire e +1 dado per Carica, che si consumano; senza Cariche metà danni e 2 Cariche", () => {
    const s = scontro({ cariche: 2 }), c = ctx({ liv: 4, dadi: [8, 1, 2, 3] }); const r = prova(s, c, "onda_rimbalzo");
    eq([ev(r, "colpo")[0].tot, s.pv, s.cariche], [14, 31, 0]);
    const m = scontro({ cariche: 2 }); prova(m, ctx({ liv: 4, dadi: [2] }), "onda_rimbalzo"); eq(m.cariche, 2, "mancato: le Cariche restano");
    const v = scontro(); prova(v, ctx({ liv: 4 }), "onda_rimbalzo"); eq(C.colpoSubito(v, ctx({ liv: 4 }), false, 6).danno, 3); eq(v.cariche, 2);
  });
  caso("S20. Ritorno dello Tsunami (via di Aldo): 1d6 per Carica + 1d4 per colpo assorbito (max 3) + Vigore, poi resta 1 Carica", () => {
    const s = scontro({ cariche: 2, assorbiti: 5 }), c = ctx({ liv: 5, dadi: [6, 6, 4, 4, 4] }); prova(s, c, "tsunami"); eq([s.pv, s.cariche], [13, 1]);
    eq(C.disponibile(tec("tsunami"), scontro()).ok, false, "senza Cariche non si usa");
  });
  caso("S21. Drenaggio d'Urto e Sigillo del Monolito (via di Guendalina)", () => {
    const s = scontro(), c = ctx({ liv: 3, dadi: [15, 2, 5] }); prova(s, c, "drenaggio"); eq([s.eff.silenzio, s.eff.guardia], [1, 1]);
    C.colpoMancato(s, c); eq([c.ira, s.cariche], [1, 1]);
    const b = scontro(); prova(b, ctx({ liv: 3, boss: true, dadi: [15, 2] }), "drenaggio"); eq(b.eff.debole, 2);
    const g = scontro(); prova(g, ctx({ liv: 4, dadi: [15, 1, 1, 5] }), "sigillo_monolito"); eq([g.eff.silenzio, g.eff.guardia, g.sconto], [2, 2, 2]);
    const gb = scontro(); prova(gb, ctx({ liv: 4, boss: true, dadi: [15, 1, 1] }), "sigillo_monolito"); eq([gb.eff.debole, gb.eff.sbilanciato], [2, 2]);
  });
  caso("S22. Le vecchie tecniche di scudo sono tolte e tutte le nuove sono riconosciute", () => {
    ["carica", "schiaffo", "frontale", "balzo", "scagliata", "guardia"].forEach(id => vero(!T.some(t => t.id === id), id + " ancora presente"));
    T.filter(t => t.tipo === "Scudo").forEach(t => {
      const s = scontro({ cariche: 1 }), c = ctx({ liv: 5 }); c.tira = (d) => (d === 20 ? 15 : 1); c.s = s;
      const r = C.usa(t, s, c); vero(!ev(r, "sconosciuta").length, t.id + " non riconosciuta"); vero(t.nome.en && t.effetto.en, t.id + ": manca l'inglese");
    });
  });
  caso("Tutte le tecniche di taglio, contundenti, perforanti e delle vie sono riconosciute, con l'inglese", () => {
    T.filter(t => ["Tagliente", "Contundente", "Perforante", "Utilita"].includes(t.tipo)).forEach(t => {
      const s = scontro(), c = ctx({ liv: 5 }); c.tira = (d) => (d === 20 ? 15 : 1); c.s = s;
      const r = C.usa(t, s, c); vero(!ev(r, "sconosciuta").length, t.id); vero(t.nome.en && t.effetto.en, t.id + ": manca l'inglese");
    });
  });
  caso("Ogni ramo (armi e scudo) ha 15 tecniche (3 per livello) e 6 abilità delle vie", () => {
    ["Tagliente", "Contundente", "Perforante", "Scudo"].forEach(tipo => {
      const base = T.filter(t => t.tipo === tipo && !t.via), vie = T.filter(t => t.tipo === tipo && t.via);
      eq(base.length, 15, tipo); [1, 2, 3, 4, 5].forEach(l => eq(base.filter(t => t.liv === l).length, 3, tipo + " livello " + l));
      eq(vie.map(t => t.via + t.liv).sort(), ["aldo3", "aldo4", "aldo5", "guendalina3", "guendalina4", "guendalina5"], tipo + " vie");
    });
    eq(new Set(T.map(t => t.id)).size, T.length, "id unici");
  });
  caso("Ogni tecnica ha un costo coerente con il suo livello", () => {
    T.filter(t => ["Tagliente", "Contundente", "Perforante", "Scudo"].includes(t.tipo)).forEach(t => { const [lo, hi] = [[2, 3], [4, 5], [5, 6], [7, 8], [9, 10]][t.liv - 1]; vero(t.costo >= lo && t.costo <= hi, `${t.id}: ${t.costo} fuori da ${lo}-${hi}`); });
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
