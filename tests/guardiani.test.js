/* Test dei guardiani e del sovrano (8d, 8e): fasi, sequenze, annunci, eventi. Uso: node tests/guardiani.test.js */
(function (root) {
  const inNode = typeof module !== "undefined" && module.exports && typeof require === "function";
  if (inNode) { root.window = root; require("../js/poteri.js"); require("../js/specializzazioni.js"); require("../js/scontro.js"); require("../js/nemici.js"); }
  const P = root.Poteri, S = root.Scontro, N = root.Nemici;
  function dadi(seq) {
    const q = [...seq];
    const f = (d) => { if (!q.length) throw new Error(`tiro in più (d${d}) non previsto`); const v = q.shift(); if (v < 1 || v > d) throw new Error(`valore ${v} impossibile su d${d}`); return v; };
    f.resto = () => q.length; return f;
  }
  const ctx = (seq) => ({ tira: dadi(seq) });
  const fine = (c) => { if (c.tira.resto()) throw new Error(`dadi avanzati: ${c.tira.resto()}`); };
  const fisso = (v) => ({ tira: (d) => Math.min(d, v) }); /* tutti i dadi a v: con 2 il boss manca sempre */
  const pg = (o) => S.preparaScontro(Object.assign({ nome: "Tu", liv: 3, pv: 200, pvMax: 200, modClasse: 3, mod: { Vigore: 3, "Agilità": 1, Mente: 0, Spirito: 0 }, caBase: 30,
    arma: { dado: 6, tipo: "taglio" }, tratti: [], spec: "berserker", poteri: ["colpo_poderoso", "colpo_di_mestiere", "spezza_guardia", "spezza_carica", "colpo_del_boia"] }, o || {}));
  const ev = (r, k) => (r.eventi || r).filter(e => e && e.k === k);
  const mosse = (n, p, t, c) => Array.from({ length: t }, () => { S.inizioTurno(n, p, c || fisso(2)); const r = N.agisci(n, p, c || fisso(2)); S.fineTurno(n); return r; });
  const sequenzaFinita = (n) => { n.coda = []; n.recupero = false; }; /* per provare una fase senza giocare tutta la precedente */
  const casi = [], caso = (nome, fn) => casi.push({ nome, fn });
  const eq = (a, b, msg) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${msg || "atteso"}: ${JSON.stringify(b)}, ottenuto ${JSON.stringify(a)}`); };
  const vero = (x, msg) => { if (!x) throw new Error(msg || "atteso vero"); };

  caso("Ettore, fase 1: Pugnalata (annuncia Lama nel fianco) → Lama → «L'ho già vista» → Doppio pugnale, poi il ciclo senza Lama", () => {
    const e = N.crea("ettore"), p = pg(); eq([e.pvMax, e.caBase, e.modAtt], [42, 12, 4]);
    const r = mosse(e, p, 7);
    eq(r.map(x => x.scelta.id), ["pugnalata", "lama_nel_fianco", "lho_gia_vista", "doppio_pugnale", "pugnalata", "lho_gia_vista", "doppio_pugnale"]);
    eq(ev(r[0], "annuncio")[0].potere, "lama_nel_fianco"); eq(ev(r[3], "attacco").length, 2, "due attacchi");
  });
  caso("Ettore, al 50%: «Undici» (annunciato) → «Alla dodicesima» per 3 turni con due Pugnalate, poi il ciclo", () => {
    const e = N.crea("ettore"), p = pg(); e.pv = 17; sequenzaFinita(e);
    const r = mosse(e, p, 7);
    eq(r.map(x => x.scelta.id), ["pugnalata", "undici", "alla_dodicesima", "dodicesima_colpo", "dodicesima_colpo", "pugnalata", "lho_gia_vista"]);
    eq(ev(r[0], "annuncio")[0].potere, "undici"); eq(ev(r[1], "annuncio")[0].potere, "alla_dodicesima");
    eq(ev(r[2], "attacco").length, 2);
  });
  caso("Ettore: «L'ho già vista» schiva con 17 o più; i poteri senza tiro passano; il conteggio ricomincia dopo cinque", () => {
    const e = N.crea("ettore"), p = pg(); e.buff.schiva = { finoAlTurno: true, soglia: 17 };
    const r = S.attacco(p, e, {}, ctx([17])); vero(r.schivato); eq(e.pv, 42);
    const r2 = S.attacco(p, e, {}, ctx([16, 15, 4])); vero(r2.ok); eq(e.pv, 42 - Math.ceil((4 + 3) * 1.5), "taglio ✓");
    const e2 = N.crea("ettore"); const nn = mosse(e2, pg(), 7).flatMap(x => ev(x, "conteggio").map(c => c.n)); eq(nn, [1, 2, 3, 4, 5, 1, 2]);
  });
  caso("Ettore: Esposto con TS di Agilità alta (+3)", () => {
    const e = N.crea("ettore"), z = P.tiroSalvezza(e, "esposto", { liv: 3, modClasse: 3 }, dadi([8])); eq([z.attr, z.tot, z.ok], ["Agilità", 8 + 3 + 2, false]);
  });
  caso("Enea: ascia (Colpo → Squarcio → Mietitura → intervallo), al 50% finisce la sequenza dell'ascia, poi intervallo e maglio", () => {
    const e = N.crea("enea"), p = pg();
    const r = mosse(e, p, 2); eq(r.map(x => x.scelta.id), ["colpo_d_ascia", "squarcio"]);
    e.pv = 20; const r2 = mosse(e, p, 7);
    eq(r2.map(x => x.scelta.id), ["mietitura_del_becchino", "guardia_del_becchino", "colpo_semplice", "guardia_del_becchino", "colpo_semplice", "colpo_del_maglio", "frantumaossa"],
      "15/11 (opzione B): finisce la sequenza dell'ascia, poi intervallo e maglio");
    eq(ev(r2[0], "faseBoss").length, 0); eq(ev(r2[3], "faseBoss")[0].nome, "Il maglio"); eq(e.arma.tipo, "contundente");
  });
  caso("Enea: alla prima caduta si rialza con 1d4 + 3 (una volta); la seconda è la caduta vera", () => {
    const e = N.crea("enea"), p = pg(); const c = ctx([3]); const E = S.danneggia(e, 99, "contundente", {}, c); fine(c);
    eq(ev(E, "rialzato").length, 1); eq(e.pv, 6);
    S.danneggia(e, 99, "contundente", {}, ctx([])); eq(e.pv <= 0, true);
  });
  caso("Enea: Spezza-carica toglie il colpo annunciato, che non torna", () => {
    const e = N.crea("enea"), p = pg(); mosse(e, p, 1); eq(e.pronto, "squarcio");
    const c = ctx([18, 1, 1, 1]); S.usa(p, e, "spezza_carica", c); eq(e.pronto, null);
    const r = mosse(e, p, 2); eq(r.map(x => x.scelta.id), ["colpo_d_ascia", "mietitura_del_becchino"], "Squarcio salta: riempitivo e annuncio della Mietitura");
    vero(!r.some(x => x.scelta.id === "squarcio"));
  });
  caso("Dafne nascosta: non si può colpire; trovarla (Percezione CD 12) porta allo stacco e al mastino", () => {
    const d = N.crea("dafne"), p = pg();
    const c = ctx([18, 4]); const r = S.attacco(p, d, {}, c); eq(d.pv, 72); vero(ev(r.eventi, "intoccabile").length); fine(c);
    eq(N.cercaDafne(d, 1, ctx([10]))[0].ok, false);
    const E = N.cercaDafne(d, 1, ctx([11])); eq(ev(E, "evoca")[0].id, "mastino_di_dafne"); eq(N.agisci(d, p, ctx([])).eventi.some(x => x.k === "stacco"), true);
    N.fineStacco(d, 3); eq(d.faseDafne, 2); eq(d.intoccabile, false);
    const r2 = mosse(d, p, 5); eq(r2.map(x => x.scelta.id), ["scatto_tra_i_pini", "stoccata_avvelenata", "veleno_del_drow", "pioggia_di_stoccate", "stoccata_avvelenata"]);
  });
  caso("Dafne: se la serie a distanza finisce, esce allo scoperto; il giornaliero usato con l'arco non torna con lo stocco", () => {
    const d = N.crea("dafne"), p = pg();
    const r = mosse(d, p, 4); eq(r.slice(0, 3).map(x => x.scelta.id), ["tiro_dell_arco", "preda_segnata", "pioggia_di_frecce"]); vero(ev(r[3], "escoAlloScoperto").length);
    N.fineStacco(d, 3); const r2 = mosse(d, p, 5); vero(!r2.some(x => x.scelta.id === "pioggia_di_stoccate"));
  });
  caso("Dafne scovata con la Furtività: niente fase nascosta, −2 CA nel primo turno", () => {
    const d = N.crea("dafne", { scovata: true }); eq([d.faseDafne, S.ca(d), d.intoccabile], [2, 13, false]);
  });
  caso("Atena: tre fasi per terzi di salute; Morsa di ghiaccio su un Gelato aggiunge lo Stordito (TS Vigore)", () => {
    const a = N.crea("atena"), p = pg({ caBase: 10 });
    a.pv = 40; sequenzaFinita(a); const r = mosse(a, p, 1); eq(ev(r[0], "faseBoss")[0].nome, "Il gelo");
    const p2 = pg({ caBase: 10, stati: { gelo: { liv: 1, turni: 3 } } }); a.pronto = "morsa_di_ghiaccio"; a.coda = ["morsa_di_ghiaccio"];
    const c = ctx([15, 1, 1, 2]); S.inizioTurno(a, p2, ctx([])); N.agisci(a, p2, c);
    eq(P.nomeStato("gelo", p2.stati.gelo.liv), "Congelato"); vero(P.ha(p2, "stordito")); eq(P.malusColpire(p2), 2);
    a.pv = 20; sequenzaFinita(a); const r3 = mosse(a, pg(), 1); eq(ev(r3[0], "faseBoss")[0].nome, "L'ombra");
  });
  caso("Sovrano: due barre (70 + 40), CA 16 / 15 / 14 / 13, mappa della cenere e della carne", () => {
    const s = N.crea("sovrano"), p = pg();
    eq([s.pv, S.ca(s), s.res.sangue, s.res.contundente, s.statiCorti], [110, 16, "imm", "vuln", true]);
    eq(N.barreSovrano(s), { cenere: 70, cenereMax: 70, carne: 40, carneMax: 40 });
    s.pv = 75; sequenzaFinita(s); mosse(s, p, 1); eq([S.ca(s) - (s.buff.guardiaBoss ? 3 : 0), s.statiCorti], [15, false]);
    s.pv = 50; sequenzaFinita(s); mosse(s, p, 1); eq(S.ca(s) - (s.buff.guardiaBoss ? 3 : 0), 14);
    s.pv = 30; sequenzaFinita(s); mosse(s, p, 1); sequenzaFinita(s); mosse(s, p, 1); eq([s.caBase, s.res.taglio, s.res.sangue], [13, "vuln", "vuln"]);
  });
  caso("Sovrano: immune al Sanguinante con l'armatura integra o incrinata; integra = stati di 1 turno; Collera del re lo rende Furente", () => {
    const s = N.crea("sovrano"), p = pg();
    eq(ev(S.statoSu(p, s, "applica", ctx([]), "sanguinante"), "immune").length, 1);
    S.statoSu(p, s, "applica", ctx([2]), "esposto"); eq(s.stati.esposto.turni, 1);
    const c = ctx([20, 12, 1, 12, 20]); s.coda = ["collera_del_re"]; s.pronto = "collera_del_re"; S.inizioTurno(s, p, ctx([])); N.agisci(s, p, c);
    vero(P.ha(s, "furente"));
  });
  caso("Sovrano: fasi Rabbia → Maledetto → Vuoto con intervallo, nessuna saltata; la carne colpisce senza stati né annunci", () => {
    const s = N.crea("sovrano"), p = pg();
    const r = mosse(s, p, 3); eq(r.map(x => x.scelta.id), ["fendente_di_rabbia", "collera_del_re", "scure_della_collera"]);
    s.pv = 75; const r2 = mosse(s, p, 3); eq(r2.map(x => x.scelta.id), ["difesa_del_re", "colpo_semplice", "colpo_maledetto"]);
    s.pv = 20; const r3 = mosse(s, p, 2); eq(r3.map(x => x.scelta.id), ["condanna_maledetta", "giudizio_della_casa"], "opzione B: il Maledetto finisce la sua sequenza");
    const rv = mosse(s, p, 5); eq(rv.map(x => x.scelta.id), ["difesa_del_re", "colpo_semplice", "colpo_di_vuoto", "vuoto_che_divora", "scure_del_vuoto"], "poi tutto il Vuoto");
    eq(ev(rv[0], "faseBoss")[0].nome, "Vuoto (armatura caduta)");
    const r4 = mosse(s, p, 3); eq(r4.map(x => x.scelta.id), ["colpo_senza_armatura", "colpo_senza_armatura", "colpo_senza_armatura"], "infine la carne");
    vero(!r4.some(x => ev(x, "annuncio").length));
  });
  caso("Atena: un colpo enorme non salta fasi; il danno resta tutto; ogni fase gioca la sua sequenza prima della successiva (15/11, opzione B)", () => {
    const a = N.crea("atena"), p = pg(); mosse(a, p, 1); eq(a.pronto, "mietitura");
    a.pv = 19; const r = mosse(a, p, 7);
    eq(r.map(x => x.scelta.id), ["mietitura", "falce_dell_angelo", "difesa_di_atena", "colpo_semplice", "soffio_di_gelo", "morsa_di_ghiaccio", "tempesta"], "prima finisce la falce, poi tutto il gelo");
    eq(ev(r[2], "faseBoss")[0].nome, "Il gelo"); eq(a.pv, 19);
    const r2 = mosse(a, p, 1); eq(ev(r2[0], "faseBoss")[0].nome, "L'ombra");
  });
  caso("Impaurito: il boss non carica; il colpo forte salta e fa il riempitivo", () => {
    const e = N.crea("enea"), p = pg(); e.stati.impaurito = { liv: 1, turni: 2 };
    const r = mosse(e, p, 2); eq(r.map(x => x.scelta.id), ["colpo_d_ascia", "colpo_d_ascia"]); vero(!r.some(x => ev(x, "annuncio").length));
  });

  function esegui() { return casi.map(({ nome, fn }) => { try { fn(); return { nome, ok: true }; } catch (e) { return { nome, ok: false, errore: e.message }; } }); }
  root.TestGuardiani = { esegui, casi };
  if (inNode && require.main === module) {
    const esiti = esegui();
    esiti.forEach(e => console.log(`${e.ok ? "OK    " : "ERRORE"} ${e.nome}${e.ok ? "" : "\n       → " + e.errore}`));
    const ko = esiti.filter(e => !e.ok).length;
    console.log(`\n${esiti.length - ko} / ${esiti.length} superati`);
    if (ko) process.exitCode = 1;
  }
})(typeof window !== "undefined" ? window : globalThis);
