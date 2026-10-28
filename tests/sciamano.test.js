/* Test delle regole dello Sciamano (js/sciamano.js) con dadi programmati: niente caso, risultati certi.
   Uso:  node tests/sciamano.test.js   → stampa OK/ERRORE per ogni caso, esce con 1 se qualcosa fallisce.
   Lo stesso file gira anche nel browser, nella sala di prova (tutorial.html?prova → «Esegui i test»). */
(function (root) {
  const inNode = typeof module !== "undefined" && module.exports && typeof require === "function";
  if (inNode) {
    root.window = root;
    require("../js/regole.js"); require("../js/tecniche.js"); require("../js/combattimento.js"); require("../js/sciamano.js");
  }
  const C = root.Combattimento, S = root.Sciamano, T = root.TECNICHE;
  const tec = (id) => { const t = T.find(x => x.id === id); if (!t) throw new Error("tecnica mancante: " + id); return t; };

  function dadi(seq) {
    const q = [...seq];
    const f = (d) => { if (!q.length) throw new Error(`tiro in più (d${d}) non previsto`); const v = q.shift(); if (v < 1 || v > d) throw new Error(`valore ${v} impossibile su d${d}`); return v; };
    f.resto = () => q.length;
    return f;
  }
  /* ambiente di prova: attacco +3, danno +3, d6, CA 12, CD 12, tiro salvezza del nemico +0; natura, cure e danni contati */
  function ctx(o) {
    o = o || {};
    const c = { liv: 1, modAtt: 3, modDanno: 3, dado: 6, caBase: 12, boss: false, cd: 12, modTs: 0, modSpirito: 0, cura: 0, danni: 0, natura: 0, pieno: false, usate: {} };
    Object.assign(c, o);
    c.tira = dadi(o.dadi || []);
    c.ca = () => c.caBase - (c.s ? C.malusCA(c.s) : 0);
    c.curaPg = (n) => { c.cura += n; };
    c.dannoPg = (n) => { c.danni += n; };
    c.naturaPiu = (n) => { if (c.pieno) return 0; c.natura += n; return n; };
    c.usataPerRiposo = (id) => !!c.usate[id];
    c.segnaPerRiposo = (id) => { c.usate[id] = true; };
    return c;
  }
  const nuovi = (c, seq) => { c.tira = dadi(seq); return c; };
  const scontro = (o) => Object.assign({ pv: 40, pvMax: 40, eff: {}, effMax: {} }, o || {});
  const prova = (s, c, id) => { c.s = s; return S.usa(tec(id), s, c); };
  const ev = (r, k) => (Array.isArray(r) ? r : r.eventi).filter(e => e.k === k);

  const casi = [];
  const caso = (nome, fn) => casi.push({ nome, fn });
  const eq = (a, b, msg) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${msg || "atteso"}: ${JSON.stringify(b)}, ottenuto ${JSON.stringify(a)}`); };
  const vero = (x, msg) => { if (!x) throw new Error(msg || "atteso vero"); };

  /* ================= 1. Rivestimenti ================= */
  caso("1a. Punta di Mandragora: attacco, l'arma resta rivestita 3 turni e il colpo avvelena (1d4 per 3 turni, durata comune)", () => {
    const s = scontro(), c = ctx({ dadi: [15, 4] });
    const r = prova(s, c, "mandragora");
    eq(r.costo, 2, "costo"); eq(s.pv, 33, "danno 4 + 3"); eq(s.eff.avvelenato, 3); eq(s.velenoDado, 4);
    eq(s.rivest, "mandragora"); eq(s.eff.rivest, 3); eq(c.natura, 0, "il colpo d'arma non dà natura");
  });
  caso("1b. Il rivestimento vale anche sugli attacchi normali; uno nuovo sostituisce il vecchio", () => {
    const s = scontro(), c = ctx({ dadi: [15, 4] });
    prova(s, c, "mandragora"); s.eff.avvelenato = 1;
    S.suColpo(s, c, { ok: true, danno: 5 }); eq(s.eff.avvelenato, 3, "l'attacco normale rinnova il veleno");
    nuovi(c, [15, 2]); c.liv = 2; prova(s, c, "muffa");
    eq(s.rivest, "muffa"); eq(s.eff.sbilanciato, 2, "la muffa vale già sul suo colpo");
    s.eff.avvelenato = 1; S.suColpo(s, c, { ok: true, danno: 3 }); eq(s.eff.avvelenato, 1, "la mandragora non c'è più");
  });
  caso("1c. Un colpo mancato non porta l'effetto del rivestimento e la natura è spesa", () => {
    const s = scontro(), c = ctx({ dadi: [2] });
    const r = prova(s, c, "mandragora"); eq(r.costo, 2); eq(s.eff.avvelenato || 0, 0); eq(s.eff.rivest, 3, "l'arma resta rivestita");
  });
  caso("1d. Spore Paralizzanti: Indebolito a ogni colpo, il tiro salvezza solo al primo colpo a segno", () => {
    const s = scontro(), c = ctx({ liv: 3, dadi: [15, 2, 5] });
    const r = prova(s, c, "spore_paralizzanti");
    eq(s.eff.debole, 2); eq(s.eff.bloccato, 1, "Stordito"); eq(ev(r, "ts").length, 1); eq(c.natura, 2, "tiro salvezza fallito: evento di recupero (liv 3)");
    nuovi(c, []); s.eff.debole = 0; S.suColpo(s, c, { ok: true, danno: 3 }); eq(s.eff.debole, 2, "nessun nuovo tiro salvezza");
  });
  caso("1e. Spore Paralizzanti su un boss: niente tiro, Indebolito 2", () => {
    const s = scontro(), c = ctx({ liv: 3, boss: true, dadi: [15, 2] });
    const r = prova(s, c, "spore_paralizzanti"); eq(s.eff.bloccato || 0, 0); eq(s.eff.debole, 2); eq(ev(r, "ts").length, 0); eq(ev(r, "immune").length, 1);
  });
  caso("1f. Spore del Morbo: le cariche restano per tutto lo scontro, alla terza Frastornato", () => {
    const s = scontro({ morbo: 1 }), c = ctx({ liv: 3 });
    S.scaduti(s, ["rivest"], c); eq(s.morbo, 1, "il rivestimento finisce, le cariche no");
    nuovi(c, [15, 2]); prova(s, c, "morbo"); eq(s.morbo, 2);
    S.suColpo(s, c, { ok: true, danno: 3 }); eq(s.eff.frastornato, 1); eq(s.morbo, 0, "si azzerano");
  });
  caso("1g. Spore del Morbo su un boss: Indebolito 2 al posto del Frastornato", () => {
    const s = scontro({ morbo: 2 }), c = ctx({ liv: 3, boss: true, dadi: [15, 2] });
    prova(s, c, "morbo"); eq(s.eff.frastornato || 0, 0); eq(s.eff.debole, 2);
  });
  caso("1h. Miasma Corrosivo: un dado in più, Avvelenato e Sbilanciato", () => {
    const s = scontro(), c = ctx({ liv: 4, dadi: [15, 2, 3] });
    prova(s, c, "miasma"); eq(s.pv, 32, "2 + 3 + 3"); eq(s.eff.avvelenato, 3); eq(s.eff.sbilanciato, 2);
  });

  /* ================= 2. Veleno, Tossina, resistenza ================= */
  caso("2a. Il veleno fa 1d4 all'inizio del turno del nemico e dà natura (1 al livello 1)", () => {
    const s = scontro({ eff: { avvelenato: 2 }, velenoDado: 4 }), c = ctx({ dadi: [3] });
    const E = S.tickNemico(s, c); eq(s.pv, 37); eq(c.natura, 1); eq(ev(E, "natura")[0].n, 1);
  });
  caso("2b. Al massimo un recupero per turno del nemico, poi riparte", () => {
    const s = scontro({ eff: { avvelenato: 2, marea: 2 }, velenoDado: 4 }), c = ctx({ dadi: [3, 2] });
    S.tickNemico(s, c); eq(s.pv, 35, "veleno 3 + acido 2"); eq(c.natura, 1, "un solo recupero");
    const e = S.difesa(s, nuovi(c, []), 0); eq(e.eventi.length, 0);
    nuovi(c, [1, 1]); S.tickNemico(s, c); eq(c.natura, 2, "nuovo turno del nemico: nuovo recupero");
  });
  caso("2c. Cuore di Tossina: sul nemico avvelenato il veleno diventa Tossina 1d6 per 3 turni, e la natura raddoppia", () => {
    const s = scontro({ eff: { avvelenato: 1 }, velenoDado: 4 }), c = ctx({ liv: 5, dadi: [15, 3, 3] });
    const r = prova(s, c, "cuore_tossina"); eq(r.costo, 9); eq(s.velenoDado, 6); eq(s.eff.avvelenato, 3); eq(s.eff.debole, 2);
    nuovi(c, [5]); const E = S.tickNemico(s, c); eq(ev(E, "velenoTick")[0].dado, 6); eq(c.natura, 6, "3 al livello 5, doppio con la Tossina"); vero(ev(E, "natura")[0].doppio);
  });
  caso("2d. Cuore di Tossina senza veleno: solo Avvelenato", () => {
    const s = scontro(), c = ctx({ liv: 5, dadi: [15, 3, 3] });
    prova(s, c, "cuore_tossina"); eq(s.velenoDado, 4); eq(s.eff.avvelenato, 3); eq(s.eff.debole || 0, 0);
  });
  caso("2e. Resistenza al veleno (Dafne, il sovrano): metà danno per difetto, e niente natura se fa 0", () => {
    const s = scontro({ eff: { avvelenato: 3 }, velenoDado: 4 }), c = ctx({ resisteVeleno: true, dadi: [3] });
    let E = S.tickNemico(s, c); eq(s.pv, 39); eq(ev(E, "velenoTick")[0].dimezzato, true); eq(c.natura, 1, "il veleno dimezzato fa danno: dà natura");
    nuovi(c, [1]); E = S.tickNemico(s, c); eq(s.pv, 39, "1 → 0"); eq(c.natura, 1, "nessun danno, nessun recupero");
  });
  caso("2f. Sui boss Avvelenato e Tossina durano 3 turni come per tutti (28/10: niente tetto)", () => {
    const s = scontro({ eff: { avvelenato: 1 }, velenoDado: 4 }), c = ctx({ liv: 5, boss: true, dadi: [15, 3, 3] });
    const r = prova(s, c, "cuore_tossina"); eq(s.eff.avvelenato, 3); vero(!ev(r, "veleno")[0].ridotto, "non ridotto"); eq(s.eff.debole, 2);
  });
  caso("2g. Il veleno si rinnova senza sommarsi", () => {
    const s = scontro({ eff: { avvelenato: 1 }, velenoDado: 4 }), c = ctx();
    S.veleno(s, c, 4, 2); eq(s.eff.avvelenato, 3, "3, non 4");
  });

  /* ================= 3. Trappole ================= */
  caso("3a. Baccello Esplosivo: attacco e trappola; scatta al prossimo attacco: Accecato 2 e natura", () => {
    const s = scontro(), c = ctx({ liv: 2, dadi: [15, 2] });
    const r = prova(s, c, "baccello"); eq(s.pv, 35, "è anche un attacco"); eq(s.trappola, "baccello"); eq(ev(r, "trappolaPronta").length, 1);
    nuovi(c, []); const E = S.scattaTrappola(s, c); eq(s.eff.accecato, 2); eq(c.natura, 1); eq(s.trappola, null); vero(s.trappolaColpito);
    eq(S.scattaTrappola(s, c).length, 0, "scatta una volta sola"); eq(ev(E, "trappolaScatta").length, 1);
  });
  caso("3b. Botola di Spore: tiro salvezza fallito → Frastornato 2; superato → Accecato 2; boss → Accecato senza tiro", () => {
    let s = scontro({ trappola: "botola" }), c = ctx({ liv: 4, dadi: [5] });
    S.scattaTrappola(s, c); eq(s.eff.frastornato, 2); eq(c.natura, 2, "un recupero (la trappola), non due");
    s = scontro({ trappola: "botola" }); c = ctx({ liv: 4, dadi: [14] }); S.scattaTrappola(s, c); eq(s.eff.frastornato || 0, 0); eq(s.eff.accecato, 2);
    s = scontro({ trappola: "botola" }); c = ctx({ liv: 4, boss: true }); S.scattaTrappola(s, c); eq(s.eff.accecato, 2);
  });
  caso("3c. Cisti Parassita: Sbilanciato 2 e Tossina per 3 turni", () => {
    const s = scontro({ trappola: "cisti" }), c = ctx({ liv: 4 });
    S.scattaTrappola(s, c); eq(s.eff.sbilanciato, 2); eq(s.velenoDado, 6); eq(s.eff.avvelenato, 3);
  });
  caso("3d. Una nuova trappola sostituisce la vecchia", () => {
    const s = scontro({ trappola: "baccello" }), c = ctx({ liv: 4, dadi: [15, 2] });
    prova(s, c, "botola"); eq(s.trappola, "botola");
  });

  /* ================= 4. Radici, Fumo, Abbraccio ================= */
  caso("4a. Radici Strangolatrici: senza tiro per colpire; tiro salvezza fallito → Sbilanciato e senza attacchi speciali 2, e natura", () => {
    const s = scontro(), c = ctx({ liv: 3, dadi: [5] });
    const r = prova(s, c, "radici"); eq(ev(r, "colpo").length, 0); eq(s.eff.sbilanciato, 2); eq(s.eff.silenzio, 2); eq(c.natura, 2);
  });
  caso("4b. Radici: se resiste Sbilanciato 1 e niente natura; su un boss Sbilanciato 2 senza tiro", () => {
    let s = scontro(), c = ctx({ liv: 3, dadi: [14] });
    prova(s, c, "radici"); eq(s.eff.sbilanciato, 1); eq(s.eff.silenzio || 0, 0); eq(c.natura, 0);
    s = scontro(); c = ctx({ liv: 3, boss: true }); prova(s, c, "radici"); eq(s.eff.sbilanciato, 2); eq(s.eff.silenzio || 0, 0);
  });
  caso("4c. Fumo della Palude: Accecato 2 e +2 alla Classe armatura per 2 turni, senza attacco", () => {
    const s = scontro(), c = ctx({ liv: 3 });
    const r = prova(s, c, "fumo"); eq(ev(r, "colpo").length, 0); eq(s.eff.accecato, 2); eq(s.eff.guardia, 2); eq(s.guardiaVal, 2);
  });
  caso("4d. Abbraccio della Foresta su un boss: Sbilanciato e Indebolito 2, nessun tiro, +2 CA per 3 turni", () => {
    const s = scontro(), c = ctx({ liv: 5, boss: true, dadi: [15, 2, 2] });
    const r = prova(s, c, "abbraccio"); eq(ev(r, "ts").length, 0); eq(s.eff.sbilanciato, 2); eq(s.eff.debole, 2); eq(s.eff.silenzio || 0, 0); eq(s.eff.guardia, 3);
  });
  caso("4e. Tappeto di Micelio: Indebolito 2 se colpisce", () => {
    const s = scontro(), c = ctx({ dadi: [15, 2] });
    prova(s, c, "micelio"); eq(s.eff.debole, 2);
  });

  /* ================= 5. Difese: Pelle di Corteccia e Scudo di Corteccia ================= */
  caso("5a. Pelle di Corteccia: il primo colpo fa metà danni, l'acido brucia l'aggressore e dà natura", () => {
    const s = scontro(), c = ctx({ liv: 2, dadi: [15, 2] });
    prova(s, c, "corteccia"); eq(s.eff.pelle, 1); const pv = s.pv;
    const d = S.difesa(s, nuovi(c, [3]), 9); eq(d.danno, 4); eq(s.pv, pv - 3); eq(c.natura, 1);
    eq(S.difesa(s, nuovi(c, []), 9).danno, 9, "solo il primo colpo");
  });
  caso("5b. Balsamo: metà del danno torna al nemico e diventa Scudo di Corteccia (e natura)", () => {
    const s = scontro(), c = ctx({ liv: 3, dadi: [15, 5] });
    prova(s, c, "balsamo"); eq(s.pv, 36, "8 di danno, 4 restituiti"); eq(s.corteccia, 4); eq(c.natura, 2);
  });
  caso("5c. Lo Scudo di Corteccia non supera 5 + livello", () => {
    const s = scontro({ corteccia: 7 }), c = ctx({ liv: 3, dadi: [15, 5] });
    const r = prova(s, c, "balsamo"); eq(s.corteccia, 8); eq(ev(r, "scudoCorteccia")[0].n, 1);
  });
  caso("5d. Lo Scudo di Corteccia assorbe i danni prima della salute ed è un evento di recupero", () => {
    const s = scontro({ corteccia: 3 }), c = ctx({ liv: 3 });
    const d = S.difesa(s, c, 5); eq(d.danno, 2); eq(s.corteccia, 0); eq(c.natura, 2);
  });

  /* ================= 6. Cure ================= */
  caso("6a. Infuso di Linfa Vitale: 1d4 subito e all'inizio dei 2 turni successivi", () => {
    const s = scontro(), c = ctx({ dadi: [3] });
    prova(s, c, "infuso"); eq(c.cura, 3); eq(s.eff.infuso, 2);
    S.cureFineTurno(s, nuovi(c, [2])); C.fineTurnoNemico(s);
    S.cureFineTurno(s, nuovi(c, [4])); C.fineTurnoNemico(s);
    eq(S.cureFineTurno(s, nuovi(c, [])).length, 0, "finito"); eq(c.cura, 9);
  });
  caso("6b. Linfa Rigeneratrice (passiva del Custode): le cure nel tempo durano un turno in più", () => {
    let s = scontro(), c = ctx({ linfaRigeneratrice: true, dadi: [1] }); prova(s, c, "infuso"); eq(s.eff.infuso, 3);
    s = scontro(); c = ctx({ liv: 4, linfaRigeneratrice: true }); prova(s, c, "aura"); eq(s.eff.aura, 4);
  });
  caso("6c. Rinascita del Sottobosco: non consuma l'azione, 2d6 + livello, poi 1d4 e 1 punto natura a turno anche oltre il limite", () => {
    vero(tec("rinascita").gratuita, "gratuita");
    const s = scontro(), c = ctx({ liv: 5, dadi: [3, 4] });
    prova(s, c, "rinascita"); eq(c.cura, 12); eq(s.eff.rinascita, 2);
    s.naturaPresa = true; S.cureFineTurno(s, nuovi(c, [2])); eq(c.cura, 14); eq(c.natura, 1);
    eq(prova(s, nuovi(c, []), "rinascita").rifiutata, true, "una volta per riposo");
  });

  /* ================= 7. Linfa Furiosa ================= */
  caso("7a. Linfa Furiosa: un attacco in più col solo dado anche nel turno in cui la usi", () => {
    const s = scontro(), c = ctx({ liv: 4, dadi: [15, 2, 15, 3] });
    const r = prova(s, c, "linfa_furiosa"); eq(ev(r, "colpo").length, 2); eq(s.pv, 32, "5 + 3 (senza modificatore)"); eq(s.eff.linfaFuria, 3);
    nuovi(c, [15, 2, 15, 2]); prova(s, c, "micelio"); eq(s.pv, 25, "dopo un'altra tecnica d'attacco: 5 + 2");
  });
  caso("7b. Linfa Furiosa: alla fine subisci 1d6", () => {
    const s = scontro({ eff: {} }), c = ctx({ dadi: [4] });
    const E = S.scaduti(s, ["linfaFuria"], c); eq(c.danni, 4); eq(ev(E, "furiaFine")[0].d, 4);
  });
  caso("7c. Linfa Furiosa non attacca dopo una tecnica senza attacco", () => {
    const s = scontro({ eff: { linfaFuria: 2 } }), c = ctx({ liv: 3 });
    const r = prova(s, c, "fumo"); eq(ev(r, "colpo").length, 0);
  });

  /* ================= 8. Fioritura e Marea ================= */
  caso("8a. Fioritura: una per riposo, tre turni di veleno, cura a ogni turno ed esplosione al terzo", () => {
    const s = scontro({ pv: 60, pvMax: 60 }), c = ctx({ liv: 5, modSpirito: 2 });
    prova(s, c, "fioritura"); eq(s.eff.bulbo, 3); eq(prova(s, c, "fioritura").rifiutata, true, "una per riposo");
    S.tickNemico(s, nuovi(c, [4])); eq(s.pv, 56); eq(s.eff.avvelenato, 3); eq(s.eff.sbilanciato, 2); eq(c.natura, 3);
    S.cureFineTurno(s, nuovi(c, [2])); C.fineTurnoNemico(s);
    S.tickNemico(s, nuovi(c, [1, 3])); eq(s.pv, 52, "veleno 1 + bulbo 3"); eq(c.natura, 6, "un solo recupero nel turno");
    S.cureFineTurno(s, nuovi(c, [2])); C.fineTurnoNemico(s);
    const E = S.tickNemico(s, nuovi(c, [1, 1, 3, 4, 5]));
    eq(ev(E, "bulboEsplode")[0].danno, 9, "2d6 3+4 + Spirito 2"); eq(s.eff.bloccato, 1, "Stordito");
    S.cureFineTurno(s, nuovi(c, [2])); C.fineTurnoNemico(s); eq(s.eff.bulbo, 0); eq(c.cura, 6, "tre cure");
    eq(S.tickNemico(s, nuovi(c, [1])).filter(e => e.k === "bulboTick").length, 0, "il bulbo non c'è più");
  });
  caso("8b. Marea di Putrefazione: 1d6 di acido per 3 turni (non dimezzato dalla resistenza), Sbilanciato per tutto lo scontro", () => {
    const s = scontro(), c = ctx({ liv: 5, resisteVeleno: true });
    prova(s, c, "marea_putrefazione"); eq(s.eff.marea, 3); vero(C.perScontro(s.eff.sbilanciato));
    S.tickNemico(s, nuovi(c, [5])); eq(s.pv, 35); eq(c.natura, 3);
  });
  caso("8c. Marea di Putrefazione su un boss: Sbilanciato 2 turni", () => {
    const s = scontro(), c = ctx({ liv: 5, boss: true });
    prova(s, c, "marea_putrefazione"); eq(s.eff.sbilanciato, 2);
  });

  /* ================= 9. Natura, passive, Fame del Parassita ================= */
  caso("9a. Con i punti natura al massimo il recupero non aggiunge nulla", () => {
    const s = scontro({ eff: { avvelenato: 1 }, velenoDado: 4 }), c = ctx({ pieno: true, dadi: [2] });
    const E = S.tickNemico(s, c); eq(ev(E, "natura")[0].preso, 0);
  });
  caso("9b. Le passive non si usano e non costano", () => {
    ["fame_parassita", "linfa_rigeneratrice"].forEach(id => { const r = prova(scontro(), ctx(), id); eq(r.rifiutata, true); eq(r.costo, 0); });
  });
  caso("9c. Fame del Parassita: vale se il nemico muore Avvelenato o dopo una trappola", () => {
    eq(S.fame(scontro()), false); eq(S.fame(scontro({ eff: { avvelenato: 1 } })), true); eq(S.fame(scontro({ trappolaColpito: true })), true);
  });
  caso("9d. Recupero per livello: 1, 1, 2, 2, 3", () => {
    eq([1, 2, 3, 4, 5].map(l => S.recupero({ liv: l }, false)), [1, 1, 2, 2, 3]);
  });

  /* ================= 10. Dati ================= */
  const SC = () => T.filter(t => t.classe === "Forestiero");
  caso("10a. Lo Sciamano ha 15 tecniche (3 per livello), 6 abilità delle vie e 2 passive", () => {
    const base = SC().filter(t => !t.via), vie = SC().filter(t => t.via && !t.passiva);
    eq(base.length, 15); [1, 2, 3, 4, 5].forEach(l => eq(base.filter(t => t.liv === l).length, 3, "livello " + l));
    eq(vie.map(t => t.via + t.liv).sort(), ["aldo3", "aldo4", "aldo5", "guendalina3", "guendalina4", "guendalina5"]);
    eq(SC().filter(t => t.passiva).map(t => t.via).sort(), ["aldo", "guendalina"]);
    eq(new Set(T.map(t => t.id)).size, T.length, "id unici");
  });
  caso("10b. Tutte le tecniche dello Sciamano sono riconosciute e hanno l'inglese", () => {
    SC().filter(t => !t.passiva).forEach(t => {
      const s = scontro({ morbo: 0 }), c = ctx({ liv: 5 }); c.tira = (d) => (d === 20 ? 15 : 1); c.s = s;
      const r = S.usa(t, s, c); vero(!ev(r, "sconosciuta").length, t.id); vero(t.nome.en && t.effetto.en && t.desc.en, t.id + ": manca l'inglese");
      r.eventi.forEach(e => { if (!["colpo", "ts", "stato", "immune", "resiste", "guardia"].includes(e.k)) vero(S.testo(e), `${t.id}: evento senza testo (${e.k})`); });
    });
  });
  caso("10c. Costi coerenti con il livello (vie: 5-6, 8, 10)", () => {
    SC().filter(t => !t.via).forEach(t => { const [lo, hi] = [[2, 3], [4, 5], [5, 6], [7, 8], [9, 10]][t.liv - 1]; vero(t.costo >= lo && t.costo <= hi, `${t.id}: ${t.costo}`); });
    SC().filter(t => t.via && !t.passiva).forEach(t => { const [lo, hi] = { 3: [5, 6], 4: [8, 8], 5: [10, 10] }[t.liv]; vero(t.costo >= lo && t.costo <= hi, `${t.id}: ${t.costo}`); });
  });
  caso("10d. Ogni evento dei turni del nemico ha il suo testo, in italiano e in inglese", () => {
    const eventi = [
      { k: "velenoTick", d: 3, dado: 4, danno: 3 }, { k: "velenoTick", d: 3, dado: 4, danno: 1, dimezzato: true }, { k: "natura", n: 2, preso: 2, doppio: true }, { k: "natura", n: 1, preso: 0 },
      { k: "trappolaScatta", id: "baccello" }, { k: "pelleColpo", prima: 8, dopo: 4, acido: 2 }, { k: "scudoAssorbe", prima: 5, dopo: 2, assorbiti: 3, resta: 0 },
      { k: "curaTurno", n: 2, fonte: "aura" }, { k: "naturaRinascita", n: 1, preso: 1 }, { k: "furiaFine", d: 3 }, { k: "rivestFine", id: "muffa" },
      { k: "bulboTick", d: 4, danno: 4 }, { k: "bulboEsplode", tiri: [3, 4], m: 2, danno: 9 }, { k: "mareaTick", d: 5 }, { k: "fame", preso: 3 }
    ];
    eventi.forEach(e => vero(S.testo(e), e.k));
  });

  function esegui() {
    return casi.map(({ nome, fn }) => { try { fn(); return { nome, ok: true }; } catch (e) { return { nome, ok: false, errore: e.message }; } });
  }
  root.TestSciamano = { esegui, casi };
  if (inNode && require.main === module) {
    const esiti = esegui();
    esiti.forEach(e => console.log(`${e.ok ? "OK    " : "ERRORE"} ${e.nome}${e.ok ? "" : "\n       → " + e.errore}`));
    const ko = esiti.filter(e => !e.ok).length;
    console.log(`\n${esiti.length - ko} / ${esiti.length} superati`);
    process.exit(ko ? 1 : 0);
  }
})(typeof window !== "undefined" ? window : globalThis);
