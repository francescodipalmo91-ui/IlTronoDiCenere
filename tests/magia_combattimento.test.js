/* Test degli incantesimi dell'Arcanista (Sangue e Illusione dal 04/11 sera) e del Monaco (js/magia_combattimento.js) con dadi programmati.
   Uso:  node tests/magia_combattimento.test.js   → OK/ERRORE per ogni caso, esce con 1 se qualcosa fallisce.
   Gira anche nel browser (sala di prova: «Esegui i test»). */
(function (root) {
  const inNode = typeof module !== "undefined" && module.exports && typeof require === "function";
  if (inNode) { root.window = root; require("../js/regole.js"); require("../js/combattimento.js"); require("../js/magia.js"); require("../js/magia_combattimento.js"); }
  const C = root.Combattimento, M = root.MagiaCombattimento, MG = root.MAGIA;
  const inc = (id) => { const x = [...MG.INCANTESIMI, ...MG.VIE].find(i => i.id === id); if (!x) throw new Error("incantesimo mancante: " + id); return x; };

  function dadi(seq) {
    const q = [...seq];
    const f = (d) => { if (!q.length) throw new Error(`tiro in più (d${d}) non previsto`); const v = q.shift(); if (v < 1 || v > d) throw new Error(`valore ${v} impossibile su d${d}`); return v; };
    f.resto = () => q.length; return f;
  }
  function ctx(o) {
    o = o || {};
    const c = { liv: 1, modAtt: 3, modDanno: 0, boss: false, cd: 12, modTs: 0, caBase: 12, mana: 0, mente: 0, usate: {} }; /* modDanno 0: i casi storici contano i soli dadi; il caso del 28/10 lo alza */
    Object.assign(c, o);
    c.tira = dadi(o.dadi || []);
    c.ca = () => c.caBase - (c.s ? C.malusCA(c.s) : 0);
    c.manaPiu = (n) => { c.mana += n; return n; };
    c.dannoMente = (n) => { c.mente += n; return n; };
    c.mancano = o.mancano != null ? o.mancano : 100; c.curato = 0; c.corpo = 0;
    c.cura = (n) => { const f = Math.min(n, c.mancano); c.mancano -= f; c.curato += f; return f; };
    c.pvMancanti = () => c.mancano;
    c.dannoCorpo = (n) => { c.corpo += n; return n; };
    c.usataPerRiposo = (id) => !!c.usate[id];
    c.segnaPerRiposo = (id) => { c.usate[id] = true; };
    return c;
  }
  const scontro = (o) => Object.assign({ pv: 80, pvMax: 80, eff: {}, effMax: {}, soffioPronto: true }, o || {});
  const lancia = (id, s, c) => { c.s = s; return M.lancia(inc(id), s, c); };
  const ev = (r, k) => r.eventi.filter(e => e.k === k);

  const casi = [];
  const caso = (nome, fn) => casi.push({ nome, fn });
  const eq = (a, b, msg) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${msg || "atteso"}: ${JSON.stringify(b)}, ottenuto ${JSON.stringify(a)}`); };
  const vero = (x, msg) => { if (!x) throw new Error(msg || "atteso vero"); };
  /* tiro salvezza fallito: d20 basso; superato: d20 alto (CD 12, modTs 0) */

  caso("03/11: Respiro dell'Equilibrio (Monaco) — I: Luce −1 ai colpi subiti; II: Zenit/Nadir curano 1d4 + livello; III: sotto metà, Brace cura e azzera, Cenere fa curare il prossimo incantesimo d'Ombra", () => {
    const s = scontro({ bilancia: 2 }), cl = ctx({ respiro: 1 });
    const r = C.colpoSubito(s, cl, false, 7); eq(r.danno, 6, "in Luce −1"); s.bilancia = -1; eq(C.colpoSubito(s, cl, false, 7).danno, 7, "in Ombra no");
    let t = scontro({ bilancia: 2 }), c = ctx({ respiro: 2, liv: 2, dadi: [15, 4, 3] }); lancia("dardo_luce", t, c); eq(t.bilancia, 3); eq(c.curato, 3 + 2, "Zenit: 1d4 3 + livello 2");
    t = scontro({ bilancia: 3 }); c = ctx({ respiro: 2, liv: 2, dadi: [15, 4, 1, 1, 1] }); const rz = lancia("tocco_avvizzente", t, c); eq(ev(rz, "respiroAlba").length, 0, "uscendo dallo Zenit (Crepuscolo) il Respiro non scatta");
    const b = scontro({ bilancia: 2 }), cb = ctx({ respiro: 3, via: "guendalina", modDanno: 3, dadi: [4] });
    eq(M.sottoMetaMonaco(b, cb, 24, 17, 31).length, 0, "sopra metà niente"); eq(M.sottoMetaMonaco(b, cb, 16, 12, 31)[0].k, "equilibrioRitrovato"); eq([b.bilancia, cb.curato], [0, 7]);
    eq(M.sottoMetaMonaco(b, cb, 16, 10, 31).length, 0, "una volta per scontro");
    const n = scontro({ bilancia: -1 }), cn = ctx({ respiro: 3, via: "aldo" }); eq(M.sottoMetaMonaco(n, cn, 16, 12, 31)[0].k, "fameOmbra"); eq(n.fameOmbra, true);
    const cn2 = ctx({ respiro: 3, via: "aldo", dadi: [15, 4, 5] }); lancia("tocco_avvizzente", n, cn2); eq([n.fameOmbra, cn2.curato], [false, 80 - n.pv], "cura tutto il danno");
  });
  /* ================= Arcanista: Sangue e Illusione (04/11 sera) ================= */
  caso("04/11 sera: ogni incantesimo di Sangue, Illusione e delle vie Vena e Velo è gestito dal motore e ha il testo inglese", () => {
    const ids = [...MG.INCANTESIMI.filter(i => ["sangue", "illusione"].includes(i.scuola)), ...MG.VIE.filter(v => ["sangue", "illusione"].includes(v.scuola))];
    eq(ids.length, 14 + 6, "7 + 7 incantesimi e 6 abilità di via");
    ids.forEach(i => {
      vero(i.nome.en && i.effetto.en, i.id + ": testo inglese");
      const s = scontro({ sigilli: 3, copie: 3 }), c = ctx({ liv: 5 }); c.tira = (d) => (d === 20 ? 15 : 1); c.s = s;
      const r = M.lancia(i, s, c); vero(!ev(r, "sconosciuta").length, i.id);
      r.eventi.filter(e => !["colpo", "ts", "stato", "immune", "resiste"].includes(e.k)).forEach(e => vero(M.testo(e) !== null, `${i.id}: evento senza testo: ${e.k}`));
    });
  });
  caso("03/11: Pozzo Arcano — I: +1 mana dopo un turno senza incantesimi; II: Passo Sfasato −1 (04/11 sera); III: il primo incantesimo dello scontro è gratis", () => {
    eq([M.gradoPozzo(1), M.gradoPozzo(2), M.gradoPozzo(3), M.gradoPozzo(4)], [1, 2, 2, 3]);
    const s = scontro(); let mana = 0; const c = ctx({ pozzo: 1 }); c.manaPiu = (n) => { mana += n; return n; };
    M.inizioTurnoPozzo(s, c); eq(mana, 0, "primo turno: niente");
    M.inizioTurnoPozzo(s, c); eq(mana, 1, "turno passato senza incantesimi: +1");
    s.incQuestoTurno = true; M.inizioTurnoPozzo(s, c); eq(mana, 1, "hai lanciato: niente");
    eq([M.costo(inc("passo_sfasato"), scontro(), { pozzo: 1 }), M.costo(inc("passo_sfasato"), scontro(), { pozzo: 2 }), M.costo(inc("stilo_cremisi"), scontro(), { pozzo: 2 })], [2, 1, 1]);
    const t = scontro(); eq(M.costo(inc("ebollizione"), t, { pozzo: 3 }), 0, "grado III: il primo è gratis"); t.pozzoGratis = true; eq(M.costo(inc("ebollizione"), t, { pozzo: 3 }), 3, "poi costa");
  });
  caso("Ferite (i vecchi Sigilli): 3, 2 sui boss, +1 dal livello 4; la via Vena le riempie anche sui boss", () => {
    eq([C.sigilliMax({ liv: 3 }), C.sigilliMax({ liv: 3, boss: true }), C.sigilliMax({ liv: 4 }), C.sigilliMax({ liv: 5, boss: true })], [3, 2, 4, 3]);
    eq([C.sigilliMax({ boss: true, liv: 3, scuolaVia: "sangue" }), C.sigilliMax({ boss: true, liv: 3, scuolaVia: "illusione" })], [3, 2]);
    const s = scontro({ sigilli: 1 }), c = ctx({ boss: true, liv: 2 }); const r = lancia("fiume_rosso", s, c);
    eq(s.sigilli, 2); eq(ev(r, "sigilli")[0].perse, 1, "il resto va perso");
  });
  caso("Stilo Cremisi: 1d8 e 1 Ferita; manca, niente Ferita; il modificatore si aggiunge al danno", () => {
    let s = scontro(), c = ctx({ dadi: [15, 6] }); let r = lancia("stilo_cremisi", s, c); eq(s.pv, 80 - 6); eq(s.sigilli, 1); eq(r.costo, 1);
    s = scontro(); c = ctx({ dadi: [2] }); lancia("stilo_cremisi", s, c); eq(s.sigilli || 0, 0);
    s = scontro(); c = ctx({ modDanno: 3, dadi: [15, 6] }); lancia("stilo_cremisi", s, c); eq(s.pv, 80 - 9);
  });
  caso("Pagare in salute: solo il Sangue, solo restando sopra metà; Sangue versato +1 dado e accende il Coagulo", () => {
    const s = scontro();
    eq(M.puoVersare(inc("stilo_cremisi"), s, { pvPg: 12, pvMaxPg: 20 }), true, "12 − 1 = 11 > 10");
    eq(M.puoVersare(inc("stilo_cremisi"), s, { pvPg: 11, pvMaxPg: 20 }), false, "11 − 1 = 10, non sopra metà");
    eq(M.puoVersare(inc("ebollizione"), s, { pvPg: 13, pvMaxPg: 20 }), false, "13 − 3 = 10");
    eq(M.puoVersare(inc("riflessi"), s, { pvPg: 20, pvMaxPg: 20 }), false, "l'Illusione si paga solo in mana");
    const c = ctx({ versato: true, pvPg: 19, pvMaxPg: 20, dadi: [15, 4, 5] }); const r = lancia("stilo_cremisi", s, c);
    eq(ev(r, "colpo")[0].nd, 2, "2d8"); eq(s.pv, 80 - 9); eq(s.versato, true);
  });
  caso("Sangue che chiama: sotto metà salute +1 dado; Risucchio: un quarto del danno (per eccesso) ti cura", () => {
    const s = scontro(), c = ctx({ pvPg: 9, pvMaxPg: 20, dadi: [15, 4, 5] }); const r = lancia("stilo_cremisi", s, c);
    eq(ev(r, "sangueChiama").length, 1); eq(s.pv, 80 - 9); eq(c.curato, 3, "9 / 4 = 2,25 → 3");
    const t = scontro(), d = ctx({ pvPg: 20, pvMaxPg: 20, dadi: [15, 4] }); lancia("stilo_cremisi", t, d); eq(d.curato, 1, "4 / 4 = 1");
    const u = scontro(), e = ctx({ dadi: [2] }); lancia("stilo_cremisi", u, e); eq(e.curato, 0, "mancato: niente");
  });
  caso("Frusta Cremisi: 1d4 senza tiro, Sanguinamento se fallisce il tiro, 1 Ferita in ogni caso", () => {
    let s = scontro(), c = ctx({ dadi: [3, 2, 4] }); lancia("frusta_cremisi", s, c); eq(s.pv, 80 - 3); vero(s.eff.sanguina > 0, "Sanguinamento"); eq(s.sangueDado, 4); eq(s.sigilli, 1);
    s = scontro(); c = ctx({ dadi: [3, 19] }); lancia("frusta_cremisi", s, c); eq(s.eff.sanguina || 0, 0); eq(s.sigilli, 1);
  });
  caso("Lama Coagulata: 3 dei tuoi turni; ogni colpo d'arma a segno fa +1d4 e incide 1 Ferita", () => {
    const s = scontro(), c = ctx({ dadi: [3] }); lancia("lama_coagulata", s, c); eq(s.eff.lama, 3);
    const e = M.suColpoArma(s, c); eq(e[0].d, 3); eq(s.pv, 77); eq(s.sigilli, 1);
    eq(M.suColpoArma(scontro(), c).length, 0, "senza la lama niente");
  });
  caso("Ebollizione: 2d6, poi le Ferite scoppiano (+1d6 ciascuna) e ti curi di 2 per Ferita (3 con la via Vena)", () => {
    let s = scontro({ sigilli: 2 }), c = ctx({ dadi: [15, 3, 3, 4, 5], mancano: 100 }); let r = lancia("ebollizione", s, c);
    eq(s.sigilli, 0); eq(s.pv, 80 - 6 - 9); eq(ev(r, "ebolle")[0].fatto, 4); eq(c.curato, 4 + Math.ceil(15 / 4));
    s = scontro({ sigilli: 2 }); c = ctx({ scuolaVia: "sangue", dadi: [15, 3, 3, 4, 5] }); r = lancia("ebollizione", s, c); eq(ev(r, "ebolle")[0].fatto, 6);
    s = scontro(); c = ctx({ dadi: [15, 3, 3] }); r = lancia("ebollizione", s, c); eq(ev(r, "detonaVuota").length, 1, "senza Ferite solo il colpo");
  });
  caso("Condensazione: non consuma l'azione, una per turno; il prossimo incantesimo di Sangue fa +2 dadi", () => {
    const s = scontro(), c = ctx(); const r = lancia("condensazione", s, c); eq(r.gratuita, true); eq(s.condens, 2);
    eq(M.disponibile(inc("condensazione"), s, c).ok, false, "una per turno");
    const d = ctx({ dadi: [15, 1, 2, 3] }); lancia("stilo_cremisi", s, d); eq(s.pv, 80 - 6); eq(s.condens, 0);
    M.inizioTurnoPozzo(s, ctx({ pozzo: 0 })); eq(M.disponibile(inc("condensazione"), s, c).ok, true, "nuovo turno: di nuovo");
    vero(/piena pressione/.test(M.comboPronta(inc("stilo_cremisi"), scontro({ condens: 2 }), ctx()).t));
  });
  caso("Sangue in Piena: +2 a colpire e ai danni con l'arma e con il Sangue (non con l'Illusione); il Coagulo cura metà", () => {
    const s = scontro(); lancia("sangue_in_piena", s, ctx()); eq(s.eff.piena, 3);
    let c = ctx({ dadi: [10, 4] }); let r = lancia("stilo_cremisi", s, c); eq(ev(r, "colpo")[0].mA, 5); eq(ev(r, "colpo")[0].danno, 6);
    c = ctx({ dadi: [10, 4] }); r = lancia("dardo_fantasma", s, c); eq(ev(r, "colpo")[0].mA, 3, "l'Illusione no");
    c = ctx({ dado: 8, dadi: [10, 4] }); r = { eventi: [C.colpo(s, c, { base: true })] }; eq(r.eventi[0].mA, 5, "l'arma sì");
    s.copie = 0; s.versato = true; eq(C.colpoSubito(s, ctx(), false, 9).coagulo, 5, "metà per eccesso");
  });
  caso("Coagulo: dopo aver versato sangue ogni colpo subito rende un quarto (per eccesso); prima no", () => {
    const s = scontro(); eq(C.colpoSubito(s, ctx(), false, 9).coagulo, 0, "senza sangue versato");
    s.versato = true; eq(C.colpoSubito(s, ctx(), false, 9).coagulo, 3); eq(C.colpoSubito(s, ctx(), false, 15).coagulo, 4, "colpo caricato di Enea");
    const c = ctx({ mancano: 2 }); eq(M.coagula(3, c)[0].fatto, 2, "non oltre la salute mancante"); eq(M.coagula(0, c).length, 0);
  });
  caso("Cuore Spezzato: serve 1 Ferita; 2d8 per Ferita senza tiro, ti curi della metà (niente Risucchio); Ultima Goccia 3d10, una per riposo", () => {
    eq(M.disponibile(inc("cuore_spezzato"), scontro(), ctx()).ok, false);
    let s = scontro({ sigilli: 2 }), c = ctx({ dadi: [3, 4, 5, 6] }); let r = lancia("cuore_spezzato", s, c);
    eq(s.pv, 80 - 18); eq(s.sigilli, 0); eq(c.curato, 9); eq(ev(r, "risucchio").length, 0);
    s = scontro({ sigilli: 2 }); c = ctx({ liv: 5, dadi: [1, 2, 3, 4, 5, 6] }); lancia("ultima_goccia", s, c); eq(s.pv, 80 - 21);
    eq(M.disponibile(inc("ultima_goccia"), scontro({ sigilli: 1 }), c).ok, false, "una per riposo");
  });
  caso("Sete (Vena): ogni Detonazione di Sangue cura anche 1d4", () => {
    const s = scontro({ sigilli: 1 }); lancia("sete", s, ctx()); eq(s.sete, true);
    const c = ctx({ dadi: [15, 2, 2, 3, 4] }); const r = lancia("ebollizione", s, c); eq(ev(r, "seteCura")[0].d, 4);
  });
  caso("Copie: Riflessi ne crea 2 (massimo 3, 4 con Velo); un colpo che ti andrebbe a segno tira d(Copie+1): con 1 prende te", () => {
    const s = scontro(); lancia("riflessi", s, ctx()); eq(s.copie, 2); lancia("riflessi", s, ctx()); eq(s.copie, 3, "massimo 3");
    const t = scontro(); lancia("riflessi", t, ctx({ scuolaVia: "illusione" })); lancia("riflessi", t, ctx({ scuolaVia: "illusione" })); eq(t.copie, 4, "Velo: 4");
    let r = C.colpoSubito(s, ctx({ dadi: [3] }), false, 8); eq([r.annullato, r.danno, s.copie], [true, 0, 2]);
    eq(s.sigilli, 1, "combo: la Copia distrutta incide 1 Ferita");
    r = C.colpoSubito(s, ctx({ dadi: [1] }), false, 8); eq([r.annullato, r.danno, s.copie], [false, 8, 2]);
  });
  caso("Dardo Fantasma: 1d8 psichico e +1 Copia se colpisce; Frantumare: 1d8 per Copia senza tiro, 1 mana per Copia, con 3 Frastornato (boss: Sbilanciato)", () => {
    let s = scontro(), c = ctx({ dadi: [15, 5] }); lancia("dardo_fantasma", s, c); eq([s.pv, s.copie], [75, 1]);
    eq(M.disponibile(inc("frantumare"), scontro(), ctx()).ok, false, "senza Copie");
    s = scontro({ copie: 3 }); c = ctx({ dadi: [2, 3, 4, 2] }); lancia("frantumare", s, c); eq([s.pv, s.copie, c.mana], [80 - 9, 0, 3]); eq(s.eff.frastornato, 1);
    s = scontro({ copie: 3 }); c = ctx({ boss: true, dadi: [2, 3, 4] }); lancia("frantumare", s, c); eq(s.eff.sbilanciato, 1);
  });
  caso("Passo Sfasato: difesa che aspetta il primo colpo, 0 danni e +1 Copia; non due turni di fila", () => {
    const s = scontro(), c = ctx(); lancia("passo_sfasato", s, c);
    for (let i = 0; i < 2; i++) { C.colpoMancato(s, c); C.fineTurnoNemico(s); C.inizioTurnoPg(s, c); }
    s.difesaBloccata = false;
    const r = C.colpoSubito(s, c, false, 9); eq([r.danno, s.copie, s.assorbe], [0, 1, null]);
    const t = scontro(); lancia("passo_sfasato", t, ctx()); C.inizioTurnoPg(t, {}); eq(M.disponibile(inc("passo_sfasato"), t, ctx()).ok, false);
  });
  caso("Dado Truccato: il nemico tira 2d20 e tiene il peggiore, 3 turni (boss 2)", () => {
    const s = scontro(); lancia("dado_truccato", s, ctx()); eq(s.eff.truccato, 3); eq(C.tiroAttaccoNem(s, ctx({ dadi: [17, 6] })).d, 6);
    const b = scontro(); lancia("dado_truccato", b, ctx({ boss: true })); eq(b.eff.truccato, 2);
  });
  caso("Terrore Illusorio: 2d8 senza tiro, Impaurito 2 se fallisce, metà danni se resiste", () => {
    let s = scontro(), c = ctx({ dadi: [5, 6, 3] }); lancia("terrore_illusorio", s, c); eq(s.pv, 69); eq(s.eff.paura, 2);
    s = scontro(); c = ctx({ dadi: [5, 6, 19] }); lancia("terrore_illusorio", s, c); eq(s.pv, 75); eq(s.eff.paura || 0, 0);
  });
  caso("Teatro di Specchi: Copie al massimo; ogni Copia distrutta esplode 1d6 su chi l'ha colpita", () => {
    const s = scontro(); lancia("teatro_specchi", s, ctx()); eq(s.copie, 3);
    const r = C.colpoSubito(s, ctx({ dadi: [4, 5] }), false, 9); eq(r.danno, 0); eq(s.pv, 75);
  });
  caso("Vie di Velo: Il Doppio (+1d6 con 2 Copie), Sala degli Specchi (−1 a colpirti per Copia), Nessuno è Qui (nessun colpo, una per riposo)", () => {
    let s = scontro({ copie: 2 }); lancia("il_doppio", s, ctx()); let r = lancia("dardo_fantasma", s, ctx({ dadi: [15, 3, 4] })); eq(ev(r, "doppioColpo")[0].d, 4);
    s = scontro({ copie: 1 }); s.eff.doppio = 3; r = lancia("stilo_cremisi", s, ctx({ dadi: [15, 3] })); eq(ev(r, "doppioColpo").length, 0, "con 1 Copia no");
    s = scontro({ copie: 1 }); lancia("sala_specchi", s, ctx()); eq(C.modAttaccoNem(s), -2);
    s = scontro(); const c = ctx(); lancia("nessuno_qui", s, c); eq(s.copie, 3); r = C.colpoSubito(s, c, false, 12); eq([r.danno, r.annullato], [0, true]);
    eq(M.disponibile(inc("nessuno_qui"), scontro(), c).ok, false, "una per riposo");
  });
  caso("Smascherare: a inizio turno un boss tira Mente; se riesce distrugge 1 Copia (Velo −2); i comuni no", () => {
    let s = scontro({ copie: 2 }); let e = M.inizioTurnoNemico(s, ctx({ boss: true, dadi: [15] })); eq(s.copie, 1); eq(e[1].k, "smascherata");
    s = scontro({ copie: 2 }); M.inizioTurnoNemico(s, ctx({ boss: true, dadi: [3] })); eq(s.copie, 2);
    s = scontro({ copie: 2 }); M.inizioTurnoNemico(s, ctx({ boss: true, scuolaVia: "illusione", dadi: [13] })); eq(s.copie, 2, "13 − 2 = 11 contro 12");
    s = scontro({ copie: 2 }); M.inizioTurnoNemico(s, ctx({ dadi: [] })); eq(s.copie, 2);
    eq(M.haTick(scontro({ copie: 1 })), true);
  });
  caso("Un incantesimo costa il suo mana; il critico raddoppia i dadi; Esposto allarga il critico; Sbilanciato abbassa la CA", () => {
    let s = scontro(), c = ctx({ dadi: [20, 3, 4] }); let r = lancia("stilo_cremisi", s, c); eq(r.costo, 1); eq(s.pv, 80 - 7);
    s = scontro({ eff: { esposto: 2 } }); c = ctx({ dadi: [19, 2, 3] }); r = lancia("stilo_cremisi", s, c); eq(ev(r, "colpo")[0].crit, true);
    s = scontro({ eff: { sbilanciato: 2 } }); c = ctx({ dadi: [8, 1], caBase: 12 }); r = lancia("stilo_cremisi", s, c); eq(ev(r, "colpo")[0].ok, true);
  });


  /* ================= Monaco ================= */
  caso("Ogni incantesimo di Luce e Ombra e delle vie Cenere e Brace è gestito dal motore", () => {
    const ids = [...MG.INCANTESIMI.filter(i => ["luce", "ombra"].includes(i.scuola)), ...MG.VIE.filter(v => ["luce", "ombra"].includes(v.scuola))];
    eq(ids.length, 30 + 6, "30 incantesimi + 6 abilità di via");
    ids.forEach(i => {
      const st = scontro({ bilancia: 0 }), c = ctx({ liv: 5 }); c.tira = (d) => (d === 20 ? 15 : 2); c.s = st;
      const r = M.lancia(i, st, c); vero(!ev(r, "sconosciuta").length, i.id);
      r.eventi.filter(e => !["colpo", "ts", "stato", "immune", "resiste"].includes(e.k)).forEach(e => vero(M.testo(e) !== null || ["scontoInc", "giudizio"].includes(e.k), `${i.id}: evento senza testo: ${e.k}`));
    });
  });
  caso("La Bilancia: ogni incantesimo la sposta di 1, da −3 (Ombra) a +3 (Luce), e parte da 0", () => {
    const s = scontro(); lancia("scudo_fede", s, ctx()); eq(s.bilancia, 1); lancia("scudo_fede", s, ctx()); lancia("scudo_fede", s, ctx()); eq(s.bilancia, 3);
    lancia("scudo_fede", s, ctx()); eq(s.bilancia, 3, "si ferma a Luce 3");
    const o = scontro(); lancia("manto_ombra", o, ctx()); eq(o.bilancia, -1);
  });
  caso("Zenit: a Luce 3 il prossimo incantesimo d'Ombra è un Crepuscolo (+1 dado, recupero, Bilancia a 0)", () => {
    const s = scontro({ bilancia: 3 }), c = ctx({ dadi: [15, 2, 3] }); /* tocco avvizzente 1d6 + 1 */
    const r = lancia("tocco_avvizzente", s, c); eq(s.pv, 80 - 5, "2d6 = 5"); eq(c.mana, 1, "livello 1"); eq(s.bilancia, 0); eq(ev(r, "crepuscolo")[0].da, "zenit");
    eq(c.curato, 2, "ti curi di metà del danno (5 → 2)");
  });
  caso("Nadir: a Ombra 3 il prossimo incantesimo di Luce è un Crepuscolo con recupero doppio; l'Ombra costa salute mentale", () => {
    let s = scontro({ bilancia: -3 }), c = ctx({ dadi: [15, 4, 5] }); lancia("dardo_luce", s, c); eq(c.mana, 2, "doppio"); eq(s.bilancia, 0); eq(c.mente, 0);
    s = scontro({ bilancia: -3 }); c = ctx({ dadi: [15, 4, 2] }); lancia("tocco_avvizzente", s, c); eq(c.mente, 1, "a Nadir l'Ombra costa 1 punto mentale"); eq(s.bilancia, -3);
    s = scontro({ bilancia: -3, lutto: true }); c = ctx({ dadi: [15, 4, 2] }); lancia("tocco_avvizzente", s, c); eq(c.mente, 0, "il Lutto lo toglie");
  });
  caso("Velo: da Ombra 2 gli incantesimi d'Ombra hanno +1 dado di danno; Aureola: da Luce 2 le cure valgono +2", () => {
    let s = scontro({ bilancia: -2 }), c = ctx({ dadi: [15, 1, 2] }); lancia("tocco_avvizzente", s, c); eq(s.pv, 80 - 3, "2d6");
    s = scontro({ bilancia: 2 }), c = ctx({ dadi: [5] }); lancia("tocco_lenitivo", s, c); eq(c.curato, 5 + 3 + 2, "1d8 + Spirito + Aureola");
  });
  caso("Dardo di Luce: 1d8; sul critico anche Accecato 1", () => {
    let s = scontro(), c = ctx({ dadi: [15, 6] }); lancia("dardo_luce", s, c); eq(s.pv, 74); eq(s.eff.accecato || 0, 0);
    s = scontro(); c = ctx({ dadi: [20, 3, 4] }); lancia("dardo_luce", s, c); eq(s.pv, 73); eq(s.eff.accecato, 2, "durata comune");
  });
  caso("Tocco Lenitivo: cura 1d8 + Spirito e non oltre la salute mancante", () => {
    const s = scontro(), c = ctx({ dadi: [6], mancano: 4 }); lancia("tocco_lenitivo", s, c); eq(c.curato, 4);
  });
  caso("Accecare, Folgore Sacra, Raggio del Mattino", () => {
    let s = scontro(), c = ctx({ dadi: [3] }); lancia("accecare", s, c); eq(s.eff.accecato, 2);
    s = scontro(); c = ctx({ dadi: [15, 2, 3, 4] }); lancia("folgore_sacra", s, c); eq(s.pv, 80 - 5); eq(s.eff.frastornato, 1, "salvezza 4 su CD 12: fallita");
    s = scontro(); c = ctx({ dadi: [15, 2, 3, 5], boss: true }); lancia("folgore_sacra", s, c); eq(s.pv, 80 - 5 - 5, "sui boss +1d6"); eq(s.eff.frastornato || 0, 0);
    s = scontro(); c = ctx({ dadi: [3, 5, 4] }); lancia("raggio_mattino", s, c); eq(s.pv, 80 - 8, "salvezza 4 fallita: danno pieno 2d8 = 3+5");
    s = scontro(); c = ctx({ dadi: [3, 5, 18] }); lancia("raggio_mattino", s, c); eq(s.pv, 80 - 4, "salvezza superata: metà");
  });
  caso("Santuario: consuma l'azione, il primo colpo di ogni turno fa metà, alla fine cura 1d6", () => {
    const s = scontro(), c = ctx(); lancia("santuario", s, c); eq(s.eff.santuario, 2);
    eq(C.colpoSubito(s, c, false, 9).danno, 4); eq(C.colpoSubito(s, c, false, 9).danno, 9, "il secondo colpo dello stesso turno passa");
    const fin = C.fineTurnoNemico(s); eq(C.colpoSubito(s, c, false, 9).danno, 4, "nuovo turno: di nuovo metà");
    C.fineTurnoNemico(s); const sc = M.scaduti(s, ["santuario"], ctx({ dadi: [4] })); eq(sc[0].d, 4);
    C.inizioTurnoPg(s, c); eq(M.disponibile(inc("santuario"), s, c).motivo, "difesaDiFila");
  });
  caso("Lancia del Sole: 3d8, poi Accecato 2 se fallisce il tiro", () => {
    const s = scontro(), c = ctx({ liv: 4, dadi: [15, 1, 2, 3, 4] }); lancia("lancia_sole", s, c); eq(s.pv, 74); eq(s.eff.accecato, 2);
  });
  caso("Corona di Raggi: 1d6 a inizio turno per 3 turni; se ti colpisce, il nemico è Accecato 1", () => {
    const s = scontro(), c = ctx(); lancia("corona_raggi", s, c); eq(s.eff.corona, 3);
    M.inizioTurnoNemico(s, ctx({ dadi: [5] })); eq(s.pv, 75);
    C.colpoSubito(s, ctx({ boss: false }), false, 3); eq(s.eff.accecato, 2, "durata comune");
  });
  caso("Grazia (03/11): 1d8 + Spirito subito, Rigenerazione 3 turni, +2 CA per 2 turni", () => {
    const s = scontro(), c = ctx({ dadi: [4] }); lancia("grazia", s, c); eq(c.curato, 7); eq(s.eff.scudo, 2); eq(s.eff.rigen, 3);
    const c2 = ctx({ dadi: [3] }); const e = M.inizioTurnoMonaco(s, c2); eq(c2.curato, 3); eq(e[0].k, "rigenera");
  });
  caso("Voto di Vita (03/11): +1d4 sull'arma e Rigenerazione per 3 dei tuoi turni", () => {
    const s = scontro(), c = ctx(); lancia("voto_luce", s, c); eq(s.eff.voto, 3); eq(s.eff.rigen, 3);
    s.effInizio = {}; C.fineTurnoNemico(s); eq(s.eff.rigen, 3, "il turno del nemico subito dopo il lancio non la consuma");
    let cure = 0; for (let i = 0; i < 4; i++) { const ci = ctx({ dadi: [2] }); M.inizioTurnoMonaco(s, ci); cure += ci.curato || 0; C.fineTurnoNemico(s); }
    eq(cure, 6, "tre cure da 2, poi finisce");
  });
  caso("Alba Eterna: una volta per riposo, 4d8 senza tiro, Accecato 2, ti curi della metà", () => {
    const s = scontro(), c = ctx({ liv: 5, dadi: [2, 3, 4, 5] }); lancia("alba_eterna", s, c); eq(s.pv, 80 - 14); eq(s.eff.accecato, 2); eq(c.curato, 7);
    eq(M.disponibile(inc("alba_eterna"), s, c).motivo, "giaUsataRiposo");
  });
  caso("Seconda Vita: una volta per scontro; il colpo letale ti lascia a 1 e ti cura 2d6", () => {
    const s = scontro(), c = ctx(); lancia("seconda_vita", s, c); eq(M.disponibile(inc("seconda_vita"), s, c).motivo, "giaUsataScontro");
    const r = M.secondaVita(s, 12, 5, ctx({ dadi: [3, 4] })); eq(r.danno, 4); eq(r.cura, 7); eq(s.eff.seconda, 0);
    eq(M.secondaVita(s, 12, 5, ctx()).danno, 12, "una volta sola");
  });
  caso("Giudizio: 2d10 + 1d10 per ogni punto di Luce, poi la Bilancia torna a 0", () => {
    const s = scontro({ bilancia: 2 }), c = ctx({ liv: 5, dadi: [15, 1, 2, 3, 4] }); lancia("giudizio", s, c); eq(s.pv, 80 - 10); eq(s.bilancia, 0);
  });
  caso("Fiamma Calda: cura 2d6 + Spirito e chi ti colpisce brucia; Cerchio del Focolare: +2 ai tiri salvezza", () => {
    const s = scontro(), c = ctx({ liv: 3, dadi: [3, 4] }); lancia("fiamma_calda", s, c); eq(c.curato, 10); eq(s.eff.fiamma, 2);
    C.colpoSubito(s, ctx({ dadi: [3] }), false, 5); eq(s.pv, 77);
    lancia("cerchio_focolare", s, ctx({ liv: 4 })); eq(M.bonusTsPg(s), 3, "+2 del Cerchio e +1 dell'Aureola: la Bilancia è a Luce 2");
  });
  caso("Fuoco che Cura: la cura oltre la salute massima diventa danno radiante", () => {
    const s = scontro(), c = ctx({ liv: 5, mancano: 5, dadi: [8, 8, 8, 8] }); lancia("fuoco_cura", s, c); eq(c.curato, 5); eq(s.pv, 80 - (35 - 5), "32+3 = 35 di cura, 5 servono");
  });
  caso("Tocco Avvizzente, Sete di Tenebra, Mietitura", () => {
    let s = scontro(), c = ctx({ dadi: [15, 6] }); lancia("tocco_avvizzente", s, c); eq(c.curato, 3);
    s = scontro(), c = ctx({ liv: 2, dadi: [15, 3, 4] }); lancia("sete_tenebra", s, c); eq(s.pv, 73); eq(c.mana, 1);
    s = scontro({ pv: 40 }), c = ctx({ liv: 4, dadi: [6, 6, 6] }); lancia("mietitura", s, c); eq(s.pv, 22); eq(c.mana, 2, "sotto metà della salute massima (80)");
  });
  caso("Sussurro della Paura e Catene d'Ombra: controlli, con il ripiego sui boss", () => {
    let s = scontro(), c = ctx({ dadi: [3] }); lancia("sussurro_paura", s, c); eq(s.eff.silenzio, 1);
    s = scontro(); c = ctx({ boss: true }); lancia("sussurro_paura", s, c); eq(s.eff.debole, 2, "durata comune");
    s = scontro(); c = ctx({ liv: 2, dadi: [3] }); lancia("catene_ombra", s, c); eq(s.eff.bloccato, 1);
    s = scontro(); c = ctx({ liv: 2, boss: true }); lancia("catene_ombra", s, c); eq(s.eff.sbilanciato, 2);
  });
  caso("Avvizzire: Avvizzito 3 con 1d4 a inizio turno, il tetto sui boss resta 3", () => {
    let s = scontro(), c = ctx({ liv: 2, dadi: [3] }); lancia("avvizzire", s, c); eq(s.eff.avvizzito, 3);
    M.inizioTurnoNemico(s, ctx({ dadi: [3] })); eq(s.pv, 77);
    s = scontro(), c = ctx({ liv: 2, dadi: [18] }); lancia("avvizzire", s, c); eq(s.eff.avvizzito || 0, 0, "tiro superato");
  });
  caso("Divorare: consuma l'Avvizzito, danni subito e ti curi altrettanto", () => {
    const s = scontro({ eff: { avvizzito: 2 }, avvizzitoDado: 4 }), c = ctx({ liv: 3, dadi: [15, 3, 4, 2, 3] }); lancia("divorare", s, c);
    eq(s.pv, 80 - 7 - 5); eq(s.eff.avvizzito, 0); eq(c.curato, 5);
  });
  caso("Patto d'Ombra: perdi 1d4 salute e recuperi 1d4 + livello fede", () => {
    const s = scontro(), c = ctx({ liv: 3, dadi: [2, 3] }); lancia("patto_ombra", s, c); eq(c.corpo, 2); eq(c.mana, 6);
  });
  caso("Eclisse: Accecato 2 e Indebolito 2, costa sempre 1 punto mentale", () => {
    const s = scontro(), c = ctx({ liv: 3, dadi: [3] }); lancia("eclisse", s, c); eq(s.eff.accecato, 2); eq(s.eff.debole, 2); eq(c.mente, 1);
  });
  caso("Spirito Servitore (03/11): colpisce da solo a inizio turno, 1d6 senza tiro, non più sugli incantesimi", () => {
    const s = scontro(), c = ctx({ liv: 4 }); lancia("ombra_gemella", s, c);
    lancia("dardo_luce", s, ctx({ dadi: [15, 4] })); eq(s.pv, 76, "l'incantesimo non aggiunge più il dado");
    M.inizioTurnoMonaco(s, ctx({ dadi: [5] })); eq(s.pv, 71);
  });
  caso("Terrore: Frastornato 2; sui boss Indebolito 2 e −2 ai suoi tiri salvezza", () => {
    let s = scontro(), c = ctx({ liv: 4, dadi: [3] }); lancia("terrore", s, c); eq(s.eff.frastornato, 2);
    s = scontro(); c = ctx({ liv: 4, boss: true }); lancia("terrore", s, c); eq(s.eff.debole, 2); eq(s.eff.paura, 2);
    lancia("accecare", s, ctx({ dadi: [13], boss: true })); eq(s.eff.accecato, 2, "13 − 2 = 11 contro 12: fallisce");
  });
  caso("Notte Senza Fine: nemico Accecato e Avvizzito (1d6), Ombra −2, 1d4 salute mentale, una volta per riposo", () => {
    const s = scontro(), c = ctx({ liv: 5, dadi: [3] }); lancia("notte_senza_fine", s, c); eq(s.eff.accecato, 2, "durata comune"); eq(s.eff.avvizzito, 3); eq(s.avvizzitoDado, 6); eq(c.mente, 3);
    eq(M.costo(inc("tocco_avvizzente"), s), 1, "2 − 2, minimo 1"); eq(M.costo(inc("abbraccio_vuoto"), s), 7);
    eq(M.disponibile(inc("notte_senza_fine"), s, c).motivo, "giaUsataRiposo");
  });
  caso("Nome Taciuto e Abbraccio del Vuoto (4d8, ti curi di tutto, Bilancia a Ombra 3)", () => {
    let s = scontro(), c = ctx({ liv: 5, dadi: [3] }); lancia("nome_taciuto", s, c); eq(s.eff.bloccato, 2);
    s = scontro(); c = ctx({ liv: 5, boss: true }); lancia("nome_taciuto", s, c); eq(s.eff.debole, 2); eq(s.eff.sbilanciato, 2);
    s = scontro({ bilancia: 1 }); c = ctx({ liv: 5, dadi: [15, 1, 2, 3, 4] }); lancia("abbraccio_vuoto", s, c); eq(s.pv, 70); eq(c.curato, 10); eq(s.bilancia, -3);
  });
  caso("Vie del Monaco: Rancore (+1d6 per colpo subito, max 3), Lutto, Furia Cinerea", () => {
    let s = scontro({ colpiSubiti: 5 }), c = ctx({ liv: 3, dadi: [15, 1, 1, 2, 2, 3, 3] }); lancia("rancore", s, c); eq(s.pv, 80 - 9, "2d6 + 3d6: i primi cinque dadi");
    s = scontro(); c = ctx({ liv: 4, dadi: [3] }); lancia("lutto", s, c); eq(s.eff.avvizzito, 3); eq(s.avvizzitoDado, 6); eq(s.eff.debole, 2); eq(s.lutto, true);
    s = scontro({ bilancia: 1 }); c = ctx({ liv: 5 }); lancia("furia_cinerea", s, c); eq(s.bilancia, -3); eq(s.eff.furiaCinerea, 3);
    const c2 = ctx({ liv: 5, dadi: [15, 3, 4, 1] }); lancia("tocco_avvizzente", s, c2); eq(s.bilancia, -3, "bloccata"); eq(s.pv, 80 - 8, "3d6: Velo e Furia aggiungono un dado ciascuno"); eq(c2.curato, 4);
    const c3 = ctx({ liv: 5, dadi: [15, 3] }); lancia("dardo_luce", s, c3); eq(s.bilancia, -3); eq(c3.mana, 0, "niente Crepuscolo mentre è bloccata");
  });
  caso("Accecato e Manto d'Ombra: l'attacco del nemico tira 2d20 e tiene il peggiore", () => {
    let s = scontro({ eff: { accecato: 2 } }); let r = C.tiroAttaccoNem(s, ctx({ dadi: [15, 4] })); eq(r.d, 4);
    s = scontro(); lancia("manto_ombra", s, ctx()); r = C.tiroAttaccoNem(s, ctx({ dadi: [18, 9] })); eq(r.d, 9); r = C.tiroAttaccoNem(s, ctx({ dadi: [18] })); eq(r.d, 18, "il manto vale una volta");
    r = C.tiroAttaccoNem(scontro(), ctx({ dadi: [11] })); eq(r.d, 11);
  });
  caso("Avvizzito: 1d6 dove indicato sostituisce 1d4; sui boss dura al massimo 3 turni", () => {
    const s = scontro(), c = ctx({ liv: 5, boss: true }); C.metti(s, c, "avvizzito", 5); eq(s.eff.avvizzito, 3);
  });
  caso("Combo: etichette e avvisi «combo pronta» (Ferite, Copie, Bilancia)", () => {
    const tg = (id) => M.etichette(inc(id)).join("|");
    vero(/Incide Ferite/.test(tg("stilo_cremisi"))); vero(/Detona le Ferite/.test(tg("cuore_spezzato"))); vero(/Mana o salute/.test(tg("stilo_cremisi")));
    vero(/Crea Copie/.test(tg("riflessi"))); vero(/Detona le Copie/.test(tg("frantumare"))); vero(/Non consuma l'azione/.test(tg("condensazione")));
    vero(/Vita \+1/.test(tg("dardo_luce"))); vero(/Negromanzia \+1/.test(tg("tocco_avvizzente"))); vero(/→ 0/.test(tg("giudizio"))); vero(/Difesa/.test(tg("passo_sfasato")));
    eq(M.comboPronta(inc("ebollizione"), scontro(), ctx({ liv: 2 })).ok, false, "senza Ferite solo il colpo");
    vero(/al massimo/.test(M.comboPronta(inc("ebollizione"), scontro({ sigilli: 3 }), ctx({ liv: 2 })).t));
    eq(M.comboPronta(inc("stilo_cremisi"), scontro({ sigilli: 3 }), ctx({ liv: 2 })).ok, false, "Ferite nuove perse");
    eq(M.comboPronta(inc("frantumare"), scontro(), ctx()).ok, false); vero(/Frastornato/.test(M.comboPronta(inc("frantumare"), scontro({ copie: 3 }), ctx()).t));
    eq(M.comboPronta(inc("riflessi"), scontro({ copie: 3 }), ctx()).ok, false, "Copie al massimo");
    vero(/Crepuscolo/.test(M.comboPronta(inc("tocco_avvizzente"), scontro({ bilancia: 3 }), ctx()).t));
    vero(/Crepuscolo/.test(M.comboPronta(inc("dardo_luce"), scontro({ bilancia: -3 }), ctx()).t));
    eq(M.comboPronta(inc("dardo_luce"), scontro({ bilancia: -3, eff: { furiaCinerea: 2 } }), ctx()), null, "Furia Cinerea blocca la Bilancia");
    eq(M.comboPronta(inc("dardo_luce"), scontro(), ctx()), null);
  });

  caso("04/11: potenziamenti della via (la via è la scuola)", () => {
    eq(M.scuolaDellaVia("Sapiente", "guendalina"), "illusione"); eq(M.scuolaDellaVia("Sapiente", "aldo"), "sangue"); /* 04/11 sera */
    eq(M.scuolaDellaVia("Accolito", "guendalina"), "luce"); eq(M.scuolaDellaVia("Accolito", "aldo"), "ombra");
    eq(M.scuolaDellaVia("Soldato", "aldo"), null); eq(M.scuolaDellaVia("Sapiente", null), null);
    eq(Object.keys(M.POTENZIAMENTI_VIA).sort(), ["illusione", "luce", "ombra", "sangue"]);
    /* Brace: Rigenerazione 4 turni */
    const s3 = scontro(); lancia("voto_luce", s3, ctx({ liv: 3, scuolaVia: "luce" })); eq(s3.eff.rigen, 4);
    const s4 = scontro(); lancia("voto_luce", s4, ctx({ liv: 3 })); eq(s4.eff.rigen, 3);
    /* Cenere: Avvizzito 1d6 al posto di 1d4 */
    const s5 = scontro(); lancia("avvizzire", s5, ctx({ liv: 3, scuolaVia: "ombra", dadi: [2] })); eq(s5.avvizzitoDado, 6);
    const s6 = scontro(); lancia("avvizzire", s6, ctx({ liv: 3, dadi: [2] })); eq(s6.avvizzitoDado, 4);
  });

  function esegui() {
    return casi.map(({ nome, fn }) => { try { fn(); return { nome, ok: true }; } catch (e) { return { nome, ok: false, errore: e.message }; } });
  }
  root.TestMagiaCombattimento = { esegui, casi };
  if (inNode && require.main === module) {
    const esiti = esegui();
    esiti.forEach(e => console.log(`${e.ok ? "OK    " : "ERRORE"} ${e.nome}${e.ok ? "" : "\n       → " + e.errore}`));
    const ko = esiti.filter(e => !e.ok).length;
    console.log(`\n${esiti.length - ko} / ${esiti.length} superati`);
    process.exit(ko ? 1 : 0);
  }
})(typeof window !== "undefined" ? window : globalThis);
