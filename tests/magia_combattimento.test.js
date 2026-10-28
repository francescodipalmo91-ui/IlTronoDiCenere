/* Test degli incantesimi dell'Arcanista (js/magia_combattimento.js) con dadi programmati.
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

  caso("Ogni incantesimo di Arcano, Forza e delle due vie è gestito dal motore", () => {
    const ids = [...MG.INCANTESIMI.filter(i => ["arcano", "forza"].includes(i.scuola)), ...MG.VIE.filter(v => ["arcano", "forza"].includes(v.scuola))];
    eq(ids.length, 30 + 6, "30 incantesimi + 6 abilità di via");
    ids.forEach(i => {
      const s = scontro({ sigilli: 3 }), c = ctx({ liv: 5 }); c.tira = (d) => (d === 20 ? 15 : 1); c.s = s;
      const r = M.lancia(i, s, c); vero(!ev(r, "sconosciuta").length, i.id);
    });
  });
  caso("Ogni incantesimo di Arcano e Forza ha il testo inglese", () => {
    MG.INCANTESIMI.concat(MG.VIE).filter(i => ["arcano", "forza"].includes(i.scuola)).forEach(i => vero(i.nome.en && i.effetto.en, i.id));
  });

  /* ================= Sigilli ================= */
  caso("Dardo Arcano: colpisce, 1d8 e 1 Sigillo; manca, nessun Sigillo", () => {
    let s = scontro(), c = ctx({ dadi: [15, 5] }); /* 15+3 = 18 contro CA 12 */
    let r = lancia("dardo_arcano", s, c); eq(r.costo, 2); eq(s.pv, 75, "5 danni senza modificatore"); eq(s.sigilli, 1);
    s = scontro(); c = ctx({ dadi: [2] }); r = lancia("dardo_arcano", s, c); eq(s.pv, 80); eq(s.sigilli || 0, 0);
  });
  caso("28/10: l'attacco magico aggiunge il modificatore al danno (Dardo Arcano 1d8 + 3)", () => {
    const s = scontro(), c = ctx({ dadi: [15, 5], modDanno: 3 });
    lancia("dardo_arcano", s, c); eq(s.pv, 72, "5 + 3 danni");
  });
  caso("I Sigilli si fermano a 3, a 2 sui boss; il resto va perso", () => {
    const s = scontro({ sigilli: 2 }), c = ctx({ dadi: [15, 4] });
    lancia("dardo_arcano", s, c); eq(s.sigilli, 3);
    lancia("scopri_carte", s, ctx()); eq(s.sigilli, 3, "restano 3");
    const b = scontro({ sigilli: 1 }); lancia("scopri_carte", b, ctx({ boss: true })); eq(b.sigilli, 2);
    lancia("scopri_carte", b, ctx({ boss: true })); eq(b.sigilli, 2, "boss: massimo 2");
  });
  caso("Scopri Carte: apre la scheda e incide 1 Sigillo senza tiro", () => {
    const s = scontro(), c = ctx(); const r = lancia("scopri_carte", s, c);
    eq(s.svelata, true); eq(s.sigilli, 1); eq(r.costo, 1); eq(ev(r, "colpo").length, 0);
  });
  caso("Runa sull'Arma: 3 turni di runa", () => {
    const s = scontro(), c = ctx(); lancia("runa_arma", s, c); eq(s.eff.runa, 3);
  });
  caso("Marchio Arcano: Esposto 2 se fallisce il tiro; 1 Sigillo in ogni caso", () => {
    let s = scontro(), c = ctx({ dadi: [3] }); lancia("marchio_arcano", s, c); eq(s.eff.esposto, 2); eq(s.sigilli, 1);
    s = scontro(); c = ctx({ dadi: [18] }); const r = lancia("marchio_arcano", s, c); eq(s.eff.esposto || 0, 0); eq(s.sigilli, 1); vero(ev(r, "resiste").length);
  });
  caso("Marchio Arcano su un boss: Esposto dura al massimo 2", () => {
    const s = scontro(), c = ctx({ dadi: [3], boss: true }); lancia("marchio_arcano", s, c); eq(s.eff.esposto, 2);
  });
  caso("Stasi: Bloccato 1 se fallisce; resiste se supera; sui boss 2 Sigilli e nessun tiro", () => {
    let s = scontro(), c = ctx({ dadi: [3] }); lancia("stasi", s, c); eq(s.eff.bloccato, 1); eq(s.sigilli || 0, 0);
    s = scontro(); c = ctx({ dadi: [18] }); lancia("stasi", s, c); eq(s.eff.bloccato || 0, 0);
    s = scontro(); c = ctx({ boss: true }); const r = lancia("stasi", s, c); eq(s.eff.bloccato || 0, 0); eq(s.sigilli, 2); eq(ev(r, "ts").length, 0, "i boss non tirano");
  });
  caso("Specchio di Rune: consuma l'azione; il primo colpo fa metà e incide 1 Sigillo; non due turni di fila", () => {
    const s = scontro(), c = ctx(); lancia("specchio_rune", s, c); eq(s.assorbe.tipo, "specchio"); eq(s.difesaUsata, true);
    const sub = C.colpoSubito(s, c, false, 9); eq(sub.danno, 4, "metà arrotondata per difetto"); eq(s.sigilli, 1); eq(s.assorbe, null, "vale una volta");
    C.inizioTurnoPg(s, c); /* il turno dopo la difesa è bloccata */
    eq(M.disponibile(inc("specchio_rune"), s, c).ok, false, "di fila no"); eq(M.disponibile(inc("specchio_rune"), s, c).motivo, "difesaDiFila");
    C.inizioTurnoPg(s, c); eq(M.disponibile(inc("specchio_rune"), s, c).ok, true, "dopo un turno sì");
  });
  caso("Catena di Glifi: 2d6 e 2 Sigilli se colpisce", () => {
    const s = scontro(), c = ctx({ dadi: [15, 3, 4] }); lancia("catena_glifi", s, c); eq(s.pv, 73); eq(s.sigilli, 2);
  });
  caso("Sigillo del Silenzio: Senza attacchi speciali 2; sui boss Indebolito 2; 1 Sigillo sempre", () => {
    let s = scontro(), c = ctx({ dadi: [3] }); lancia("sigillo_silenzio", s, c); eq(s.eff.silenzio, 2); eq(s.sigilli, 1);
    s = scontro(); c = ctx({ boss: true }); lancia("sigillo_silenzio", s, c); eq(s.eff.silenzio || 0, 0); eq(s.eff.debole, 2); eq(s.sigilli, 1);
  });
  caso("Disfare: scarica il Soffio pronto, scioglie la Presa, 1 Sigillo", () => {
    const s = scontro(), c = ctx(); lancia("disfare", s, c); eq(s.soffioPronto, false); eq(s.presaUsata, true); eq(s.sigilli, 1);
  });
  caso("Risonanza: 2d8 + 1d8 per Sigillo, i Sigilli restano; critico raddoppia i dadi", () => {
    let s = scontro({ sigilli: 2 }), c = ctx({ dadi: [15, 4, 5, 6, 2] }); lancia("risonanza", s, c); eq(s.pv, 80 - 9 - 8); eq(s.sigilli, 2);
    s = scontro({ sigilli: 1 }); c = ctx({ dadi: [20, 1, 1, 1, 1, 2, 3] }); lancia("risonanza", s, c); /* critico: 4d8 + 2d8 */ eq(s.pv, 80 - 4 - 5, "critico"); eq(s.sigilli, 1);
  });
  caso("Prigione di Rune: Bloccato 2 se fallisce; sui boss Sbilanciato 2 e 1 Sigillo", () => {
    let s = scontro(), c = ctx({ dadi: [3] }); lancia("prigione_rune", s, c); eq(s.eff.bloccato, 2);
    s = scontro(); c = ctx({ boss: true }); lancia("prigione_rune", s, c); eq(s.eff.sbilanciato, 2); eq(s.sigilli, 1); eq(s.eff.bloccato || 0, 0);
  });
  caso("Occhio del Tomo: critico con 19-20 e ogni critico incide 2 Sigilli", () => {
    const s = scontro(), c = ctx({ dadi: [] }); lancia("occhio_tomo", s, c); eq(s.eff.occhio, 3);
    const c2 = ctx({ dadi: [19, 1, 1, 1] }); const r = lancia("dardo_arcano", s, c2); /* 19: critico, 2d8 */ eq(ev(r, "colpo")[0].crit, true);
    eq(s.sigilli, 1 + 2, "1 del dardo + 2 del critico");
  });
  caso("Parola Vera: 4d8 senza tiro, una volta per riposo, −4 ai tiri salvezza del nemico", () => {
    const s = scontro(), c = ctx({ dadi: [2, 3, 4, 5, 7] }); /* 14 danni, poi salvezza 7 contro CD 12 */
    lancia("parola_vera", s, c); eq(s.pv, 66); eq(s.eff.parola, 2); eq(c.usate.parola_vera, true);
    eq(M.disponibile(inc("parola_vera"), s, c).motivo, "giaUsataRiposo");
    const c2 = ctx({ dadi: [9], modTs: 0, cd: 12 }); lancia("marchio_arcano", s, c2); /* 9 − 4 = 5: fallisce anche se tirerebbe 9+3? CD 12, 9+0 = 9 comunque */
    eq(s.eff.esposto, 2);
    const s2 = scontro({ eff: { parola: 2 } }), c3 = ctx({ dadi: [14], cd: 12 }); lancia("marchio_arcano", s2, c3); eq(s2.eff.esposto, 2, "14 −4 = 10 < 12: fallisce");
    const s3 = scontro(), c4 = ctx({ dadi: [14], cd: 12 }); lancia("marchio_arcano", s3, c4); eq(s3.eff.esposto || 0, 0, "senza Parola 14 supera");
  });
  caso("Tomo Proibito: −1 salute mentale, Arcano a −2 (minimo 1) e 1 Sigillo in più", () => {
    const s = scontro(), c = ctx(); const r = lancia("tomo_proibito", s, c); eq(s.eff.tomo, 3); eq(c.mente, 1); eq(r.costo, 8);
    eq(M.costo(inc("catena_glifi"), s), 3, "5 − 2"); eq(M.costo(inc("scopri_carte"), s), 1, "minimo 1"); eq(M.costo(inc("pugno_forza"), s), 2, "la Forza non cambia");
    lancia("scopri_carte", s, ctx()); eq(s.sigilli, 2, "1 + 1 extra");
    const s2 = scontro({ eff: { tomo: 3 } }); lancia("pugno_forza", s2, ctx({ dadi: [15, 4] })); eq(s2.sigilli || 0, 0, "la Forza non incide in più");
  });
  caso("Sigillo Assoluto: Sigilli al massimo e Bloccato 2; sui boss Indebolito e Sbilanciato 2", () => {
    let s = scontro(), c = ctx({ dadi: [3] }); lancia("sigillo_assoluto", s, c); eq(s.sigilli, 3); eq(s.eff.bloccato, 2);
    s = scontro(); c = ctx({ boss: true }); lancia("sigillo_assoluto", s, c); eq(s.sigilli, 2); eq(s.eff.debole, 2); eq(s.eff.sbilanciato, 2);
  });

  /* ================= Detonazione ================= */
  caso("Detonazione: +1d6 per Sigillo, consuma i Sigilli, recupera 1 mana al livello 1 (doppio con 3)", () => {
    let s = scontro({ sigilli: 2 }), c = ctx({ dadi: [15, 6, 4, 2] }); /* pugno 1d10 = 6, poi 2d6 = 4+2 */
    const r = lancia("pugno_forza", s, c); eq(s.pv, 80 - 6 - 6); eq(s.sigilli, 0); eq(c.mana, 1);
    eq(ev(r, "detona")[0].bonus, 6);
    s = scontro({ sigilli: 3 }); c = ctx({ dadi: [15, 6, 1, 1, 1] }); lancia("pugno_forza", s, c); eq(c.mana, 2, "massimo: doppio");
  });
  caso("Detonazione sui boss: il massimo è 2 Sigilli", () => {
    const s = scontro({ sigilli: 2 }), c = ctx({ boss: true, dadi: [15, 6, 1, 1] }); lancia("pugno_forza", s, c); eq(c.mana, 2, "2 Sigilli su un boss = massimo");
  });
  caso("Il recupero cresce con il livello: 1/1/2/2/3", () => {
    [1, 2, 3, 4, 5].forEach((liv, i) => {
      const s = scontro({ sigilli: 1 }), c = ctx({ liv, dadi: [15, 6, 3] }); lancia("pugno_forza", s, c); eq(c.mana, [1, 1, 2, 2, 3][i], "livello " + liv);
    });
  });
  caso("Senza Sigilli non c'è Detonazione: né danno né mana", () => {
    const s = scontro(), c = ctx({ dadi: [15, 6] }); const r = lancia("pugno_forza", s, c); eq(c.mana, 0); eq(s.pv, 74); eq(ev(r, "detonaVuota").length, 1);
  });
  caso("Un attacco mancato non fa detonare", () => {
    const s = scontro({ sigilli: 2 }), c = ctx({ dadi: [2] }); lancia("pugno_forza", s, c); eq(s.sigilli, 2); eq(c.mana, 0);
  });
  caso("Il critico di un incantesimo di Forza incide 1 Sigillo dopo la Detonazione", () => {
    const s = scontro({ sigilli: 2 }), c = ctx({ dadi: [20, 6, 2, 1, 1] }); /* critico: 2d10 = 6+2, poi 2d6 */
    lancia("pugno_forza", s, c); eq(s.sigilli, 1, "esplosi i 2, poi 1 nuovo");
  });
  caso("Spinta: 1d6 senza tiro, Sbilanciato 1 se fallisce il tiro, Detonazione comunque", () => {
    const s = scontro({ sigilli: 1 }), c = ctx({ dadi: [4, 3, 5] }); lancia("spinta", s, c); /* 4 danni, salvezza 3, detonazione 5 */
    eq(s.pv, 80 - 4 - 5); eq(s.eff.sbilanciato, 1); eq(c.mana, 1);
    const s2 = scontro({ sigilli: 1 }), c2 = ctx({ dadi: [4, 18, 5] }); lancia("spinta", s2, c2); eq(s2.eff.sbilanciato || 0, 0); eq(c2.mana, 1, "detona anche se resiste");
  });
  caso("Scudo: +2 CA per 2 turni (effetto 'scudo')", () => { const s = scontro(), c = ctx(); lancia("scudo", s, c); eq(s.eff.scudo, 2); });
  caso("Ariete: 2d6, Sbilanciato 2 se colpisce, Detonazione", () => {
    const s = scontro({ sigilli: 1 }), c = ctx({ dadi: [15, 2, 3, 6] }); lancia("ariete", s, c); eq(s.eff.sbilanciato, 2); eq(s.pv, 80 - 5 - 6);
  });
  caso("Onda d'Urto: 2d4, il Soffio pronto si perde se fallisce il tiro, Detonazione", () => {
    const s = scontro({ sigilli: 1 }), c = ctx({ dadi: [2, 3, 4, 3] }); lancia("onda_urto", s, c); eq(s.soffioPronto, false); eq(s.pv, 80 - 5 - 3);
    const s2 = scontro({ soffioPronto: true }), c2 = ctx({ dadi: [1, 1, 18] }); lancia("onda_urto", s2, c2); eq(s2.soffioPronto, true, "resiste");
  });
  caso("Barriera Cinetica: 0 danni e 1d6 forza a chi colpisce; vale una volta", () => {
    const s = scontro(), c = ctx({ dadi: [5, 4] }); lancia("barriera_cinetica", s, c);
    const sub = C.colpoSubito(s, c, false, 9); eq(sub.danno, 0); eq(sub.annullato, true); eq(s.pv, 75, "1d6 = 5 al nemico");
    const sub2 = C.colpoSubito(s, c, false, 9); eq(sub2.danno, 9, "il secondo colpo passa");
  });
  caso("Implosione: serve almeno 1 Sigillo; 2d6 per Sigillo; recupero della tabella, doppio col massimo", () => {
    const s0 = scontro(); eq(M.disponibile(inc("implosione"), s0, ctx()).motivo, "senzaSigilli");
    const s = scontro({ sigilli: 2 }), c = ctx({ liv: 3, dadi: [1, 2, 3, 4] }); const r = lancia("implosione", s, c); eq(s.pv, 70); eq(s.sigilli, 0); eq(c.mana, 2, "livello 3: 2");
    const s3 = scontro({ sigilli: 3 }), c3 = ctx({ liv: 3, dadi: [1, 1, 1, 1, 1, 1] }); lancia("implosione", s3, c3); eq(c3.mana, 4, "massimo: doppio");
  });
  caso("Pressione: Indebolito 2 e 1d6 forza all'inizio dei suoi turni", () => {
    const s = scontro({ sigilli: 0 }), c = ctx({ dadi: [3] }); lancia("pressione", s, c); eq(s.eff.debole, 2); eq(s.eff.pressione, 2);
    const t = M.inizioTurnoNemico(s, ctx({ dadi: [4] })); eq(s.pv, 76); eq(t[0].k, "pressioneTick");
    C.fineTurnoNemico(s); M.inizioTurnoNemico(s, ctx({ dadi: [2] })); eq(s.pv, 74); C.fineTurnoNemico(s); eq(M.inizioTurnoNemico(s, ctx()).length, 0, "finita");
  });
  caso("Muro di Forza: 2 turni", () => { const s = scontro(), c = ctx(); lancia("muro_forza", s, c); eq(s.eff.muro, 2); });
  caso("Maglio Invisibile: 3d8, critico 19-20, Detonazione", () => {
    const s = scontro({ sigilli: 1 }), c = ctx({ dadi: [19, 1, 2, 3, 4, 5, 6, 1, 2, 3] }); /* 19 critico: 6d8 poi 1d6 */
    lancia("maglio_invisibile", s, c); eq(s.pv, 80 - 21 - 1, "6 dadi + detonazione");
  });
  caso("Gravità: Bloccato 1 e Sbilanciato 2 se fallisce; sui boss Sbilanciato 2 e Indebolito 1", () => {
    let s = scontro(), c = ctx({ dadi: [3] }); lancia("gravita", s, c); eq(s.eff.bloccato, 1); eq(s.eff.sbilanciato, 2);
    s = scontro(); c = ctx({ boss: true }); lancia("gravita", s, c); eq(s.eff.bloccato || 0, 0); eq(s.eff.sbilanciato, 2); eq(s.eff.debole, 2, "durata comune");
  });
  caso("Respingere: ogni colpo fa 0 e torna 1d6, fino al tuo turno", () => {
    const s = scontro(), c = ctx({ dadi: [3, 2] }); lancia("respingere", s, c);
    eq(C.colpoSubito(s, c, false, 8).danno, 0); eq(C.colpoSubito(s, c, false, 8).danno, 0); eq(s.pv, 75);
    C.inizioTurnoPg(s, c); eq(s.assorbe, null);
  });
  caso("Singolarità: una volta per riposo, 3d6 per Sigillo + Mente, sempre doppia", () => {
    const s = scontro({ sigilli: 1 }), c = ctx({ liv: 5, dadi: [2, 3, 4] }); lancia("singolarita", s, c); eq(s.pv, 80 - 9 - 3); eq(c.mana, 6, "3 × 2");
    eq(M.disponibile(inc("singolarita"), scontro({ sigilli: 1 }), c).motivo, "giaUsataRiposo");
  });
  caso("Invulnerabilità: una volta per riposo, dura fino al tuo turno", () => {
    const s = scontro(), c = ctx(); lancia("invulnerabilita", s, c); eq(s.eff.invuln, 1); eq(M.disponibile(inc("invulnerabilita"), s, c).ok, false);
  });
  caso("Cataclisma: 3 colpi 1d8, ognuno fa detonare 1 Sigillo, una sola Detonazione per il mana", () => {
    const s = scontro({ sigilli: 2 }), c = ctx({ liv: 5, dadi: [15, 4, 6, 15, 3, 5, 15, 2] }); /* 3 colpi a segno; Sigilli: solo 2 */
    lancia("cataclisma", s, c); eq(s.pv, 80 - (4 + 6) - (3 + 5) - 2); eq(s.sigilli, 0); eq(c.mana, 3, "una Detonazione, non doppia (2 Sigilli su 3)");
    const s2 = scontro({ sigilli: 3 }), c2 = ctx({ liv: 5, dadi: [15, 1, 1, 15, 1, 1, 15, 1, 1] }); lancia("cataclisma", s2, c2); eq(c2.mana, 6, "3 Sigilli: doppia");
  });

  /* ================= Vie ================= */
  caso("Colpo Demolitore: 2d8, Detonazione con 1d8 per Sigillo, poi ogni Detonazione fa Sbilanciato 1", () => {
    const s = scontro({ sigilli: 1 }), c = ctx({ liv: 3, dadi: [15, 3, 4, 8, 15, 2] }); /* 2d8 = 7, poi 1d8 = 8 */
    lancia("colpo_demolitore", s, c); eq(s.pv, 80 - 7 - 8); eq(s.demolitore, true); eq(s.eff.sbilanciato, 1);
    s.eff.sbilanciato = 0; s.sigilli = 1; lancia("pugno_forza", s, ctx({ dadi: [15, 2, 3] })); eq(s.eff.sbilanciato, 1, "ogni Detonazione, anche delle altre");
  });
  caso("Spezzare il Vincolo: Indebolito 3 e CA −2 per tutto lo scontro se fallisce; boss: Indebolito 2", () => {
    let s = scontro(), c = ctx({ dadi: [3] }); lancia("spezzare_vincolo", s, c); eq(s.eff.debole, 2, "durata comune"); eq(s.caMeno, 2); eq(C.malusCA(s), 2);
    s = scontro(); c = ctx({ dadi: [3], boss: true }); lancia("spezzare_vincolo", s, c); eq(s.eff.debole, 2, "tetto boss");
    s = scontro(); c = ctx({ dadi: [18] }); lancia("spezzare_vincolo", s, c); eq(s.caMeno || 0, 0);
  });
  caso("Crollo Arcano: serve un Sigillo; 2d10 per Sigillo; se il nemico cade recuperi il mana speso", () => {
    eq(M.disponibile(inc("crollo_arcano"), scontro(), ctx()).motivo, "senzaSigilli");
    const s = scontro({ sigilli: 2, pv: 20 }), c = ctx({ liv: 5, dadi: [10, 9, 8, 7] }); const r = lancia("crollo_arcano", s, c); eq(s.pv <= 0, true); eq(c.mana, 9, "rimborso del costo");
    const s2 = scontro({ sigilli: 1 }), c2 = ctx({ liv: 5, dadi: [1, 1] }); lancia("crollo_arcano", s2, c2); eq(c2.mana, 0, "il nemico vive: nessun rimborso");
  });
  caso("Filo di Rune: 2 Sigilli; con almeno 2 Sigilli il nemico ha −2 per colpirti", () => {
    const s = scontro(), c = ctx(); lancia("filo_rune", s, c); eq(s.sigilli, 2); eq(C.modAttaccoNem(s), -2);
    s.sigilli = 1; eq(C.modAttaccoNem(s), 0, "con meno di 2 no");
  });
  caso("Ricamo di Rune: Senza attacchi speciali + Esposto 2; il prossimo incantesimo costa 2 in meno", () => {
    let s = scontro(), c = ctx({ dadi: [3] }); lancia("ricamo_rune", s, c); eq(s.eff.silenzio, 2); eq(s.eff.esposto, 2); eq(s.scontoInc, 2);
    eq(M.costo(inc("pugno_forza"), s), 1, "2 − 2, minimo 1"); const r = lancia("pugno_forza", s, ctx({ dadi: [2] })); eq(r.costo, 1); eq(s.scontoInc, 0, "usato");
    s = scontro(); c = ctx({ boss: true }); lancia("ricamo_rune", s, c); eq(s.eff.silenzio || 0, 0); eq(s.eff.debole, 2); eq(s.eff.esposto, 2);
  });
  caso("Quiete Assoluta: gli incantesimi d'Arcano costano un Sigillo invece del mana; senza Sigilli si paga", () => {
    const s = scontro({ sigilli: 2 }), c = ctx(); lancia("quiete_assoluta", s, c); eq(s.eff.quiete, 3);
    eq(M.costo(inc("catena_glifi"), s), 0); const r = lancia("catena_glifi", s, ctx({ dadi: [15, 1, 1] })); eq(r.costo, 0); eq(s.sigilli, 2 - 1 + 2 > 3 ? 3 : 2 - 1 + 2, "spende 1 e ne incide 2");
    const v = scontro({ eff: { quiete: 3 } }); eq(M.costo(inc("catena_glifi"), v), 5, "senza Sigilli si paga");
    eq(M.costo(inc("pugno_forza"), s), 2, "la Forza paga sempre");
  });

  /* ================= Cose trasversali ================= */
  caso("Un incantesimo costa il suo mana; il critico raddoppia i dadi", () => {
    const s = scontro(), c = ctx({ dadi: [20, 3, 4] }); const r = lancia("dardo_arcano", s, c); eq(r.costo, 2); eq(s.pv, 80 - 7);
  });
  caso("Esposto allarga il critico degli incantesimi (19-20)", () => {
    const s = scontro({ eff: { esposto: 2 } }), c = ctx({ dadi: [19, 2, 3] }); const r = lancia("dardo_arcano", s, c); eq(ev(r, "colpo")[0].crit, true);
  });
  caso("Sbilanciato abbassa la CA del nemico per gli attacchi magici", () => {
    const s = scontro({ eff: { sbilanciato: 2 }, }), c = ctx({ dadi: [8, 1], caBase: 12 }); /* 8+3 = 11 contro CA 10 */
    const r = lancia("dardo_arcano", s, c); eq(ev(r, "colpo")[0].ok, true);
  });
  caso("Ogni evento che i testi devono mostrare ha un testo", () => {
    const s = scontro({ sigilli: 3 });
    ["dardo_arcano", "scopri_carte", "runa_arma", "marchio_arcano", "stasi", "specchio_rune", "catena_glifi", "sigillo_silenzio", "disfare", "risonanza", "prigione_rune", "occhio_tomo", "parola_vera", "tomo_proibito", "sigillo_assoluto",
      "pugno_forza", "spinta", "scudo", "ariete", "onda_urto", "barriera_cinetica", "implosione", "pressione", "muro_forza", "maglio_invisibile", "gravita", "respingere", "singolarita", "invulnerabilita", "cataclisma",
      "colpo_demolitore", "spezzare_vincolo", "crollo_arcano", "filo_rune", "ricamo_rune", "quiete_assoluta"].forEach(id => {
      const st = scontro({ sigilli: 3 }), c = ctx({ liv: 5 }); c.tira = (d) => (d === 20 ? 15 : 2); c.s = st;
      const r = M.lancia(inc(id), st, c);
      r.eventi.filter(e => !["colpo", "ts", "stato", "immune", "resiste"].includes(e.k)).forEach(e => vero(M.testo(e) !== null || e.k === "scontoInc", `${id}: evento senza testo: ${e.k}`));
    });
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
  caso("Grazia: 2d8 + Spirito e +2 CA per 2 turni", () => {
    const s = scontro(), c = ctx({ dadi: [4, 5] }); lancia("grazia", s, c); eq(c.curato, 12); eq(s.eff.scudo, 2);
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
  caso("Ombra Gemella: ogni incantesimo a segno fa +1d6 necrotico", () => {
    const s = scontro(), c = ctx({ liv: 4 }); lancia("ombra_gemella", s, c);
    lancia("dardo_luce", s, ctx({ dadi: [15, 4, 5] })); eq(s.pv, 80 - 4 - 5);
    lancia("dardo_luce", s, ctx({ dadi: [2] })); eq(s.pv, 71, "mancato: niente");
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
    s = scontro({ bilancia: 1 }); c = ctx({ liv: 5 }); lancia("furia_cinerea", s, c); eq(s.bilancia, -3); eq(s.eff.furia, 3);
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
