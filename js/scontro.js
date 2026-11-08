/* =====================================================================
   SCONTRO — attacchi, turni, reazioni e poteri delle specializzazioni sul motore nuovo (js/poteri.js).
   Blocco 2 (08/11/2026): Guerriero (Esecutore, Sentinella), potere di classe e tratti.
   Contratto: docs/riscrittura_meccaniche.md, sezioni 2-3. Nessuna risorsa: a volontà / per scontro / giornalieri.

   Combattente (oltre ai campi di Poteri): { caBase, modClasse, modAtt?, modDanno?, arma: { dado, n, tipo, bonus, critDa }, scudo,
     poteri: [id], tratti: [id], usati: { scontro: {}, giorno: {} }, buff: {} }
   I nemici possono dare modAtt / modDanno a parte (es. «+2 / 1d6 + 1»); altrimenti vale modClasse.
   ctx = { tira(d) }.  Gli eventi sono dati; i testi li scrive chi li mostra.
   ===================================================================== */
(function (root) {
  const P = root.Poteri || (typeof require === "function" ? require("./poteri.js") : null);

  /* lo stato che l'arma applica: taglio logora, contundente controlla, perforante prepara il critico */
  const STATO_ARMA = { taglio: "sanguinante", contundente: "stordito", perforante: "esposto" };
  const statoArma = (b) => STATO_ARMA[b.arma && b.arma.tipo] || null;
  const critBaseArma = (b) => (b.arma && b.arma.critDa) || (b.arma && b.arma.tipo === "perforante" ? 19 : 20);

  const pronto = (b) => { b.buff = b.buff || {}; b.usati = b.usati || { scontro: {}, giorno: {} }; b.stati = b.stati || {}; return b; };
  const fonteDi = (b) => ({ liv: b.liv, modClasse: b.modClasse || 0 });
  /* il bonus +N è dell'arma, o del focus per gli incantesimi che lo usano (Stilo cremisi, Dardo fantasma, Lancia d'ossa…) */
  const bonusEq = (b, o) => (o && o.focus ? (b.focus && b.focus.bonus) || 0 : (b.arma && b.arma.bonus) || 0);
  const mAtt = (b, o) => (b.modAtt != null ? b.modAtt : b.modClasse || 0) + bonusEq(b, o);
  const mDanno = (b, o) => (b.modDanno != null ? b.modDanno : b.modClasse || 0) + bonusEq(b, o);
  const meta = (n) => Math.ceil(n / 2); /* le metà si arrotondano per eccesso, come le resistenze */
  const COPIE_MAX = 3;
  const buffCA = (b) => Object.values(b.buff || {}).reduce((t, x) => t + (Number(x.ca) || 0), 0);
  const ca = (b) => (b.caBase || 10) + buffCA(b) - P.malusCA(b);
  const tiraDadi = (ctx, n, d) => Array.from({ length: n }, () => ctx.tira(d));
  const somma = (a) => a.reduce((x, y) => x + y, 0);

  /* ---------- Applicare lo stato dell'arma ---------- */
  /* esito: { ok } condiviso dentro lo stesso potere (un TS solo per potere) */
  function statoSu(att, dif, modo, ctx, id, esito, extra) {
    const k = id || statoArma(att); if (!k) return [];
    pronto(dif);
    /* Consacrazione (Purificatore): niente stati; ogni stato ti ritorna contro come Scottato (aggrava se c'è già) */
    if (dif.buff.consacrazione && att !== dif) {
      return [{ k: "consacrato", stato: k }, ...(att.pv > 0 ? P.aggrava(att, "scottato", { fonte: fonteDi(dif), tira: ctx.tira, tipo: "fuoco_sacro" }) : [])];
    }
    /* Aura purificante: il primo stato che subiresti brucia via */
    if (dif.buff.aura && att !== dif) { delete dif.buff.aura; return [{ k: "purificato", stato: k }]; }
    return (modo === "aggrava" ? P.aggrava : P.applica)(dif, k, { fonte: fonteDi(att), tira: ctx.tira, esito, turni: durataDi(att, k), tipo: tipoStato(att, k), ...(extra || {}) });
  }
  /* il sanguinamento dell'Arcanista del Sangue è di tipo sangue (vale per le vulnerabilità) */
  const tipoStato = (att, k) => (k === "sanguinante" && att.spec === "sangue" ? "sangue" : k === "scottato" && att.spec === "purificatore" ? "fuoco_sacro" : undefined);
  const PLACCHE_MAX = 3;
  const riduzionePlacca = (b) => 3 + Math.max(0, (b.liv || 1) - 1);
  /* Legame del sottobosco (Sciamano, tratto I): i veleni durano 4 turni */
  const durataDi = (att, k) => (k === "intossicato" && (att.tratti || []).includes("legame_sottobosco") ? 4 : undefined);
  const durataPiena = (att, k) => durataDi(att, k) || P.durataBase(k);

  /* ---------- L'attacco ----------
     o: { piuDadi, soloDado, doppiDadi, autoCrit, bonusDanno, tipo, critDa, nome, contrattacco }
     Le reazioni del difensore scattano qui (contrattacchi, Ritorsione, Ultimo baluardo): valgono per giocatore e nemici. */
  function attacco(att, dif, o, ctx) {
    pronto(att); pronto(dif); o = o || {};
    const E = [];
    if (!o.contrattacco) { E.push(...scattaTrappole(att, dif, ctx)); if (att.pv <= 0) return { ok: false, crit: false, eventi: E, ev: null }; }
    const auto = !!o.autoCrit;
    /* Dado truccato / Il Grande Inganno: chi attacca tira due d20 e tiene il peggiore */
    const d = auto ? null : att.svantaggio > 0 ? Math.min(ctx.tira(20), ctx.tira(20)) : ctx.tira(20);
    const malusBarr = !o.contrattacco && att.malusProssimo ? att.malusProssimo : 0; if (malusBarr) att.malusProssimo = 0; /* Barricata di costole */
    const tot = auto ? null : d + mAtt(att, o) - P.malusColpire(att) - malusBarr;
    const soglia = Math.min(o.critDa || 20, o.focus ? 20 : critBaseArma(att), P.sogliaCritContro(dif));
    const crit = auto || d >= soglia, ok = auto || d >= soglia || tot > ca(dif); /* come nel gioco: il totale deve superare la CA */
    const ev = { k: "attacco", da: att.nome, a: dif.nome, nome: o.nome || null, d, tot, ca: ca(dif), crit: ok && crit, ok, danno: 0 };
    if (o.contrattacco) ev.contrattacco = true;
    E.push(ev);
    if (!ok) { E.push(...reazioneMancato(att, dif, ctx)); return { ok: false, crit: false, eventi: E, ev }; }
    /* Ritorsione: il primo colpo che subisci fa 0, poi contrattacchi a danno pieno e aggravi lo stato dell'arma */
    if (dif.buff.ritorsione) {
      delete dif.buff.ritorsione; ev.annullato = true;
      E.push({ k: "ritorsione" });
      const c = attacco(dif, att, { contrattacco: true, nome: "ritorsione" }, ctx); E.push(...c.eventi);
      if (c.ok && att.pv > 0) E.push(...statoSu(dif, att, "aggrava", ctx));
      return { ok: true, crit: ev.crit, eventi: E, ev, annullato: true };
    }
    const piena = att.buff.piena && !o.contrattacco ? 1 : 0; /* Sangue in piena: un dado in più */
    const dado = o.dado || (o.focus ? (att.focus && att.focus.dado) || 8 : (att.arma && att.arma.dado) || 4);
    const nBase = o.n || (o.focus ? 1 : (att.arma && att.arma.n) || 1);
    const base = nBase * (o.doppiDadi ? 2 : 1) + (o.piuDadi || 0) + (att.prossimiDadi || 0) + piena;
    if (att.prossimiDadi) { ev.dadiBaluardo = att.prossimiDadi; att.prossimiDadi = 0; }
    const nd = base * (ev.crit ? 2 : 1), tiri = tiraDadi(ctx, nd, dado);
    let lordo = somma(tiri) + (o.soloDado ? 0 : mDanno(att, o)) + (o.bonusDanno || 0);
    if (o.dadoExtra) { const x = ctx.tira(o.dadoExtra); lordo += x; ev.extra = x; } /* es. Dardo fantasma: +1d4 con una Copia, solo se colpisce */
    if (att.buff.benedetta && !o.focus && !o.contrattacco) { const x = ctx.tira(4); lordo += x; ev.benedetta = x; } /* Arma benedetta */
    if (dif.marchio && att.marchia) { const x = ctx.tira(4); lordo += x; ev.marchio = x; }                /* Marchio della preda */
    if ((att.tratti || []).includes("furia") && P.vacillante(att)) { lordo += 2; ev.furia = 2; }        /* Furia: da Vacillante +2 */
    if ((att.tratti || []).includes("radici_profonde") && P.grave(dif, "intossicato")) { const x = ctx.tira(4); lordo += x; ev.radici = x; } /* Radici profonde */
    Object.assign(ev, { nd, dado, tiri });
    const dopo = [];
    lordo = difese(att, dif, Math.max(1, lordo), o, ctx, ev, dopo);
    E.push(...danneggia(dif, lordo, o.tipo || (att.arma && att.arma.tipo), ev, ctx));
    dopo.forEach(f => { if (att.pv > 0) E.push(...f()); });
    if (piena && dif.pv > 0) E.push(...statoSu(att, dif, "aggrava", ctx, "sanguinante"));
    if (att.buff.benedetta && !o.focus && !o.contrattacco && dif.pv > 0) E.push(...statoSu(att, dif, "applica", ctx, "scottato"));
    /* Gabbia d'ossa: 19-20 naturale con Lancia o Spine d'ossa → Stordito (sui boss Indebolito) */
    if (o.gabbia && d >= 19 && dif.pv > 0) { E.push({ k: "gabbia" }); E.push(...statoSu(att, dif, "applica", ctx, "stordito")); }
    /* Muffa che dilaga: ogni colpo a segno applica Intossicato, o allunga di 1 turno il veleno in corso */
    if (att.buff.muffa && !o.contrattacco && dif.pv > 0) E.push(...(P.ha(dif, "intossicato") ? [P.allunga(dif, "intossicato", 1)] : statoSu(att, dif, "applica", ctx, "intossicato")));
    if (dif.pv > 0) E.push(...reazioneColpito(att, dif, ctx));
    return { ok: true, crit: ev.crit, eventi: E, ev };
  }

  /* Copie dell'Illusione e Ali cremisi: cambiano il danno di un colpo a segno; i loro effetti sull'attaccante vengono dopo il danno */
  function difese(att, dif, lordo, o, ctx, ev, dopo) {
    if (dif.copie > 0) {
      const tutte = !!(o.carica || o.area), n = tutte ? dif.copie : 1, pieno = lordo;
      dif.copie -= n; lordo = meta(lordo); ev.copie = { distrutte: n, restano: dif.copie };
      if (!tutte) dopo.push(() => statoSu(dif, att, "applica", ctx, "indebolito"));      /* chi colpisce una Copia è Indebolito */
      if (dif.buff.teatro) dopo.push(() => { const t = tiraDadi(ctx, n, 6), e = { k: "copiaEsplode", tiri: t }; return [e, ...danneggia(att, somma(t), "illusione", e, ctx)]; });
      if (dif.specchio) { const x = att.boss ? meta(pieno) : pieno; dif.specchio = false; /* il colpo pieno (prima della metà) torna indietro */
        dopo.push(() => { const e = { k: "specchioRotto" }; return [e, ...danneggia(att, x, "illusione", e, ctx)]; }); }
    }
    if (dif.buff.ali) { lordo = meta(lordo); ev.ali = true; dopo.push(() => statoSu(dif, att, "aggrava", ctx, "sanguinante")); }
    if (dif.buff.eredita) { lordo = meta(lordo); ev.eredita = true; } /* Eredità del sepolcro */
    /* Placche d'ossa: una si spezza e riduce il danno di 3 + 1 per livello oltre il primo */
    if (dif.placche > 0) {
      dif.placche--; const r = riduzionePlacca(dif); lordo = Math.max(0, lordo - r); ev.placca = { riduce: r, restano: dif.placche };
      if (dif.buff.spezzata) dopo.push(() => { const x = ctx.tira(6), e = { k: "placcaSpezzata", tiri: [x] }; return [e, ...danneggia(att, x, "ossa", e, ctx)]; });
    }
    return lordo;
  }
  /* il danno passa per le vulnerabilità e per le protezioni del difensore (Ultimo baluardo) */
  function danneggia(dif, lordo, tipo, ev, ctx) {
    const E = [];
    let n = P.modificaDanno(dif, tipo, lordo).danno;
    const bal = dif.buff.baluardo;
    if (bal && !bal.salvato && n >= dif.pv && dif.pv > 0) { bal.salvato = true; n = dif.pv - 1; E.push({ k: "baluardo" }); }
    /* Ultimo servizio (Monaco, tratto I): una volta al giorno, a 0 resti a 1 e ti curi 1d6 + Spirito */
    let servizio = false;
    if (n >= dif.pv && dif.pv > 0 && (dif.tratti || []).includes("ultimo_servizio") && !dif.usati.giorno.ultimo_servizio) {
      dif.usati.giorno.ultimo_servizio = true; n = dif.pv - 1; servizio = true;
    }
    const r = P.subisci(dif, n, null); /* il tipo è già stato contato */
    if (ev) { ev.danno = r.danno; ev.tipo = tipo; if (n !== lordo) ev.lordo = lordo; }
    dif.dannoSubitoTurno = (dif.dannoSubitoTurno || 0) + r.danno;
    if (bal && r.danno > 0) { dif.prossimiDadi = Math.min(3, (dif.prossimiDadi || 0) + 1); }
    if (servizio) { const x = ctx.tira(6) + ((dif.mod && dif.mod.Spirito) || 0); E.push({ ...cura(dif, x), k: "ultimoServizio" }); }
    /* Vincolo di sangue: il bersaglio vincolato subisce anche la metà del danno che subisci tu */
    const vi = dif.buff.vincolo;
    if (vi && r.danno > 0 && vi.su.pv > 0) { const e = { k: "vincolo" }; E.push(e, ...danneggia(vi.su, meta(r.danno), null, e, ctx)); }
    if (r.vacillanteOra) {
      E.push({ k: "vacillante", chi: dif.nome });
      /* Ultima scintilla: una volta per scontro, diventando Vacillante recuperi un potere per scontro già usato */
      if ((dif.tratti || []).includes("ultima_scintilla") && !dif.scintillaUsata) {
        const id = Object.keys(dif.usati.scontro).find(k => dif.usati.scontro[k]);
        if (id) { dif.scintillaUsata = true; delete dif.usati.scontro[id]; E.push({ k: "ultimaScintilla", potere: id }); }
      }
    }
    if (r.abbattuto) E.push({ k: "abbattuto", chi: dif.nome });
    return E;
  }

  /* contrattacco «con il dado dell'arma»: un attacco vero (tiro per colpire), solo il dado */
  function contrattacco(dif, att, ctx, modo) {
    const c = attacco(dif, att, { soloDado: true, contrattacco: true }, ctx), E = c.eventi;
    if (c.ok && att.pv > 0 && modo) E.push(...statoSu(dif, att, modo, ctx));
    return E;
  }
  /* trappole dello Sciamano: scattano al prossimo attacco del nemico, prima del tiro */
  function scattaTrappole(att, dif, ctx) {
    const E = [];
    if (dif.buff.cisti) { /* Cisti parassita: aggrava il veleno e gli fa subito un turno di veleno */
      delete dif.buff.cisti; E.push({ k: "trappola", id: "cisti_parassita" });
      E.push(...statoSu(dif, att, "aggrava", ctx, "intossicato"));
      const t = P.tick(att, "intossicato", ctx.tira); if (t) E.push(t);
    }
    if (dif.buff.baccello && att.pv > 0) { /* Baccello esplosivo: aggrava il veleno ed Esposto (un TS solo) */
      delete dif.buff.baccello; E.push({ k: "trappola", id: "baccello_esplosivo" });
      const esito = {}; E.push(...statoSu(dif, att, "aggrava", ctx, "intossicato", esito), ...statoSu(dif, att, "applica", ctx, "esposto", esito));
    }
    return E;
  }
  function reazioneMancato(att, dif, ctx) {
    const E = [];
    if (dif.buff.riflessi) { dif.copie = Math.min(COPIE_MAX, (dif.copie || 0) + 1); E.push({ k: "copia", tot: dif.copie }); } /* Riflessi */
    if (dif.buff.cortecciaViva && P.ha(att, "intossicato")) { /* Corteccia viva: il veleno torna a durata piena */
      att.stati.intossicato.turni = Math.max(att.stati.intossicato.turni, durataPiena(dif, "intossicato")); E.push({ k: "rinnovato", stato: "intossicato" });
    }
    if (dif.buff.guardiaFeroce) E.push(...contrattacco(dif, att, ctx, "applica"));
    else if (dif.buff.inGuardia) E.push(...contrattacco(dif, att, ctx, dif.buff.veglia ? "aggrava" : null));
    return E;
  }
  function reazioneColpito(att, dif, ctx) {
    const E = [];
    dif.colpitoUltimo = true;
    if (dif.buff.pelle) E.push(...statoSu(dif, att, "applica", ctx, "intossicato")); /* Pelle di corteccia */
    if (dif.buff.crosta) E.push(...statoSu(dif, att, "applica", ctx, "sanguinante")); /* Crosta */
    if (dif.buff.fiammaCalda) E.push(...statoSu(dif, att, "applica", ctx, "scottato")); /* Fiamma calda */
    /* Pozzo arcano: la prima volta per turno nemico che vieni colpito recuperi 1 salute (2 dal livello 4) */
    if ((dif.tratti || []).includes("pozzo_arcano") && !dif.pozzoUsato) { dif.pozzoUsato = true; E.push({ ...cura(dif, dif.liv >= 4 ? 2 : 1), k: "pozzo" }); }
    if (dif.buff.rappresaglia) E.push(...contrattacco(dif, att, ctx, "applica"));
    else if (dif.buff.inGuardia && dif.buff.veglia) E.push(...contrattacco(dif, att, ctx, "aggrava"));
    return E;
  }

  /* ---------- Turni ---------- */
  /* inizio del tuo turno: danni continuativi, scadono le difese «fino al tuo turno»; l'avversario dimentica cosa ti ha fatto */
  /* Gli effetti «per N turni» scendono all'inizio del tuo turno: turni = N copre N turni del nemico.
     Quelli che contano i TUOI turni successivi (Muffa che dilaga) partono da N + 1. */
  function inizioTurno(b, avv, ctx) {
    pronto(b);
    Object.keys(b.buff).forEach(k => { const x = b.buff[k]; if (x.finoAlTurno || (x.turni > 0 && --x.turni === 0)) delete b.buff[k]; });
    if (!b.buff.veglia && b.bonusTsBase != null) { b.bonusTs = b.bonusTsBase; delete b.bonusTsBase; }
    if (avv) { pronto(avv); avv.colpitoUltimo = false; avv.dannoSubitoTurno = 0; avv.pozzoUsato = false; }
    b.sangueVersatoTurno = false;
    const E = P.inizioTurno(b, ctx.tira);
    /* Sangue in piena: ogni volta che il nemico subisce l'Emorragia ti curi 1 */
    E.filter(e => e.k === "tick" && e.stato === "sanguinante" && e.nome === "Emorragia").forEach(() => { if (avv && avv.buff.piena && avv.pv > 0) E.push({ ...cura(avv, 1), k: "piena" }); });
    /* Balsamo della linfa: ogni turno di veleno sul nemico cura lo Sciamano della Linfa (1, 2 se Avvelenato; doppio con Cuore di linfa) */
    E.filter(e => e.k === "tick" && e.stato === "intossicato").forEach(t => {
      if (!avv || avv.spec !== "linfa" || avv.pv <= 0) return;
      const n = (P.grave(b, "intossicato") ? 2 : 1) * (avv.buff.cuoreLinfa ? 2 : 1);
      E.push({ ...cura(avv, n), k: "balsamo" });
      const lp = avv.buff.linfaPerenne; /* Linfa perenne: il veleno dura 1 turno in più, massimo 3 volte */
      if (lp && lp.usi < 3 && P.ha(b, "intossicato")) { lp.usi++; E.push(P.allunga(b, "intossicato", 1)); }
    });
    /* Fioritura del parassita: 1d6 a ogni turno del nemico; al terzo esplode per 2d6 e aggrava il veleno */
    if (b.bulbo && b.pv > 0) {
      const bu = b.bulbo; bu.n++;
      const d = ctx.tira(6), ev = { k: "bulbo", n: bu.n, tiri: [d] }; E.push(ev, ...danneggia(b, d, "veleno", ev, ctx));
      if (bu.n >= 3 && b.pv > 0) {
        const t = [ctx.tira(6), ctx.tira(6)], ev2 = { k: "bulboEsplode", tiri: t };
        E.push(ev2, ...danneggia(b, somma(t), "veleno", ev2, ctx));
        if (b.pv > 0) E.push(...statoSu(bu.da, b, "aggrava", ctx, "intossicato"));
        b.bulbo = null;
      }
    }
    /* Sciame putrido: all'inizio dei tuoi 3 turni successivi, 1d6 senza tiro e il veleno applicato (o aggravato) */
    if (b.buff.sciame && avv && avv.pv > 0) {
      const sc = b.buff.sciame, d = ctx.tira(6), ev = { k: "sciame", tiri: [d] };
      E.push(ev, ...danneggia(avv, d, "veleno", ev, ctx));
      if (avv.pv > 0) E.push(...statoSu(b, avv, "aggrava", ctx, "intossicato"));
      if (--sc.cariche <= 0) delete b.buff.sciame;
    }
    /* Armatura del sepolcro: all'inizio dei tuoi 3 turni, placche al massimo */
    if (b.buff.sepolcro) { b.placche = PLACCHE_MAX; E.push({ k: "placche", tot: b.placche }); if (--b.buff.sepolcro.cariche <= 0) delete b.buff.sepolcro; }
    /* Costellazione rossa: all'inizio dei tuoi 3 turni una sfera fa 1d6 e applica Sanguinante; la terza aggrava */
    if (b.buff.costellazione && avv && avv.pv > 0) {
      const co = b.buff.costellazione, d = ctx.tira(6), ev = { k: "sfera", n: 4 - co.cariche, tiri: [d] };
      E.push(ev, ...danneggia(avv, d, "sangue", ev, ctx));
      if (avv.pv > 0) E.push(...statoSu(b, avv, co.cariche === 1 ? "aggrava" : "applica", ctx, "sanguinante"));
      if (--co.cariche <= 0) delete b.buff.costellazione;
    }
    return E;
  }
  function fineTurno(b) {
    pronto(b);
    if (b.svantaggio > 0) b.svantaggio--;
    if (b.nonCarica > 0) b.nonCarica--;
    if (b.velenoPerenne) b.pestilenzaTurni = (b.pestilenzaTurni || 0) + 1; /* turni passati dall'inizio di Pestilenza */
    return P.fineTurno(b);
  }
  /* fine scontro: tornano i poteri per scontro, spariscono effetti e stati; il riposo ricarica i giornalieri */
  function fineScontro(b) { pronto(b); b.usati.scontro = {}; b.buff = {}; b.stati = {}; b.prossimiDadi = 0; b.marchio = false; b.marchia = false; b.immStordito = 0; b.nonCarica = 0; b.pronto = null;
    b.bulbo = null; b.velenoPerenne = false; b.pestilenzaTurni = 0; b.copie = 0; b.specchio = false; b.svantaggio = 0; b.scintillaUsata = false; b.placche = 0; b.malusProssimo = 0;
    if (b.bonusTsBase != null) { b.bonusTs = b.bonusTsBase; delete b.bonusTsBase; } }
  function riposo(b) { pronto(b); b.usati.giorno = {}; }

  /* ---------- Catalogo ---------- */
  /* tipo: "volonta" | "scontro" | "giornaliero". liv: livello in cui arriva (1 = scelta di creazione). scelta: fa parte della scelta 2 su 3 / 1 su 2 */
  const CATALOGO = root.SPECIALIZZAZIONI || (typeof require === "function" ? require("./specializzazioni.js") : {});
  const potere = (id) => CATALOGO.POTERI && CATALOGO.POTERI[id];

  function disponibile(b, id) {
    pronto(b); const p = potere(id);
    if (!p) return { ok: false, motivo: "sconosciuto" };
    if (b.poteri && !b.poteri.includes(id)) return { ok: false, motivo: "nonPreparato" };
    if (p.tipo !== "volonta" && P.soloAVolonta(b)) return { ok: false, motivo: "impaurito" };
    if (p.tipo === "scontro" && b.usati.scontro[id]) return { ok: false, motivo: "giaUsatoScontro" };
    if (p.tipo === "giornaliero" && b.usati.giorno[id]) return { ok: false, motivo: "giaUsatoGiorno" };
    if (id === "bevi_elisir" && !(b.elisir > 0)) return { ok: false, motivo: "senzaElisir" };
    if (id === "grande_inganno" && !(b.copie > 0)) return { ok: false, motivo: "senzaCopie" };
    if ((id === "spirito_d_ossa" || id === "lama_d_osso") && !(b.placche > 0)) return { ok: false, motivo: "senzaPlacche" };
    return { ok: true };
  }

  const cura = (b, n) => { const prima = b.pv; b.pv = Math.min(b.pvMax, b.pv + n); return { k: "cura", chi: b.nome, n: b.pv - prima }; };
  const buff = (b, id, x) => { b.buff[id] = x; return { k: "buff", id, ...x }; };
  /* potere di classe: 1/4 della salute; Mani che curano (via di Guendalina dal 4) 1/3 e toglie uno stato */
  function curaDiClasse(b) {
    const mani = b.via === "guendalina" && b.liv >= 4, E = [cura(b, Math.max(1, Math.floor(b.pvMax / (mani ? 3 : 4))))];
    if (mani) { const k = Object.keys(b.stati).find(x => P.ha(b, x)); if (k) E.push(P.togli(b, k)); }
    return E;
  }
  /* poteri dell'Arcanista del Sangue che fanno danno (Sangue versato) */
  const SANGUE_DANNO = ["stilo_cremisi", "frusta_cremisi", "ebollizione", "meteora_di_sangue", "marea_cremisi"];

  /* ---------- I poteri ---------- */
  /* opz: { sangueVersato: true } per pagare 3 salute e avere un dado in più (Arcanista del Sangue, sopra il 50%) */
  function usa(att, dif, id, ctx, opz) {
    pronto(att); pronto(dif); opz = opz || {};
    const disp = disponibile(att, id);
    if (!disp.ok) return { eventi: [{ k: disp.motivo, potere: id }], rifiutato: true };
    const p = potere(id), E = [];
    if (p.tipo === "scontro") att.usati.scontro[id] = true;
    if (p.tipo === "giornaliero") att.usati.giorno[id] = true;
    E.push({ k: "potere", id, nome: p.nome, tipo: p.tipo });
    /* Eredità del sepolcro (Monaco, tratto II): dopo un giornaliero, fino al tuo turno dimezzi i danni che subisci */
    if (p.tipo === "giornaliero" && (att.tratti || []).includes("eredita_sepolcro")) E.push(buff(att, "eredita", { finoAlTurno: true }));
    /* Sangue versato: sopra il 50%, una volta per turno, 3 salute per +1 dado; da Vacillante il dado è gratis */
    let extra = 0;
    if (att.spec === "sangue" && SANGUE_DANNO.includes(id)) {
      if (P.vacillante(att)) { extra = 1; E.push({ k: "sangueVersato", costo: 0 }); }
      else if (opz.sangueVersato && att.pv > att.pvMax / 2 && !att.sangueVersatoTurno) { att.pv -= 3; att.sangueVersatoTurno = true; extra = 1; E.push({ k: "sangueVersato", costo: 3 }); }
    }
    const prendiExtra = () => { const x = extra; extra = 0; return x; };
    const atk = (o) => { const r = attacco(att, dif, { nome: id, ...o, piuDadi: ((o && o.piuDadi) || 0) + prendiExtra() }, ctx); E.push(...r.eventi); return r; };
    /* danno senza tiro per colpire: n dadi (+ dado extra) + modificatore */
    /* conMod: quante volte si somma il modificatore (Frantumare e Il Grande Inganno: una per Copia) */
    const fisso = (n, dado, conMod, tipo) => {
      const t = tiraDadi(ctx, n + prendiExtra(), dado), e = { k: "dannoFisso", nome: id, tiri: t, dado };
      E.push(e, ...danneggia(dif, Math.max(1, somma(t) + Number(conMod || 0) * mDanno(att, { focus: true })), tipo, e, ctx)); return e;
    };
    const placca = (n) => { att.placche = Math.min(PLACCHE_MAX, (att.placche || 0) + n); E.push({ k: "placche", tot: att.placche }); };
    const copia = (n) => { att.copie = Math.min(COPIE_MAX, (att.copie || 0) + n); E.push({ k: "copia", tot: att.copie }); };
    const esito = {}; /* un TS solo per potere */
    const stato = (modo, k, extra2) => E.push(...statoSu(att, dif, modo, ctx, k, esito, extra2));
    const vivo = () => dif.pv > 0;
    const vac = P.vacillante(dif);
    let r;
    switch (id) {
      /* ---- in comune ---- */
      case "colpo_di_mestiere": r = atk({ soloDado: true }); if (r.ok && vivo()) stato("applica"); break;
      case "secondo_vento": E.push(...curaDiClasse(att)); break;

      /* ---- Esecutore ---- */
      case "colpo_poderoso": atk({ bonusDanno: Object.keys(dif.stati || {}).some(k => P.ha(dif, k)) ? 2 : 0 }); break;
      case "guardia_feroce": E.push(buff(att, "guardiaFeroce", { ca: 2, finoAlTurno: true })); break;
      case "spezza_guardia": r = atk({ piuDadi: 1 }); if (r.ok && vivo()) stato("applica", "esposto"); break;
      case "colpo_crudele": r = atk({ piuDadi: 1 }); if (r.ok && vivo()) stato("aggrava"); break;
      case "caccia_al_ferito": r = atk({ piuDadi: vac ? 2 : 1 }); if (r.ok && vac) { dif.nonCarica = 1; E.push({ k: "nonCarica", turni: 1 }); } break;
      case "assalto_implacabile":
        r = atk({}); if (r.ok && vivo()) stato("applica");
        if (vivo()) { r = atk({}); if (r.ok && vivo()) stato("aggrava"); }
        break;
      case "colpo_del_boia": atk({ doppiDadi: true, autoCrit: vac }); break;
      case "marchio_della_preda": dif.marchio = true; att.marchia = true; E.push({ k: "marchio" }); break;
      case "ferita_riaperta": {
        const k = statoArma(att), s = k && dif.stati[k] && dif.stati[k].turni > 0 ? dif.stati[k].turni : 0;
        r = atk({ piuDadi: s }); if (r.ok && s) E.push(P.togli(dif, k));
        break;
      }
      case "sentenza": for (let i = 0; i < 3 && vivo(); i++) atk({ autoCrit: vac }); break;

      /* ---- Sentinella ---- */
      case "colpo_di_guardia": atk({ bonusDanno: att.colpitoUltimo ? 2 : 0 }); break;
      case "in_guardia": E.push(buff(att, "inGuardia", { ca: att.scudo ? 4 : 2, finoAlTurno: true })); break;
      case "ritorsione": E.push(buff(att, "ritorsione", { finoAlTurno: true })); break;
      case "rintocco": {
        r = atk({});
        if (r.ok && vivo()) { const k = statoArma(att); stato(k && P.ha(dif, k) ? "aggrava" : "applica"); if (vivo()) stato("applica", "indebolito"); }
        E.push(buff(att, "rintocco", { ca: 2, finoAlTurno: true }));
        break;
      }
      case "rappresaglia": E.push(buff(att, "rappresaglia", { finoAlTurno: true })); break;
      case "veglia_di_ferro":
        E.push(buff(att, "veglia", { ca: 2, turni: 3 }));
        att.bonusTsBase = att.bonusTsBase != null ? att.bonusTsBase : (att.bonusTs || 0);
        att.bonusTs = att.bonusTsBase + 4; att.buff.veglia.ts = 4;
        break;
      case "rivalsa": {
        const sub = att.dannoSubitoTurno || 0, piu = P.vacillante(att) ? sub : meta(sub);
        r = atk({ bonusDanno: piu }); if (r.ok && vivo()) stato("aggrava");
        break;
      }
      case "ultimo_baluardo": E.push(buff(att, "baluardo", { turni: 3 })); break;
      case "spezza_carica":
        r = atk({ piuDadi: 1 });
        if (r.ok && vivo()) {
          if (dif.pronto) { E.push({ k: "caricaSpezzata", cosa: dif.pronto }); dif.pronto = null; stato("applica", "indebolito"); }
          else stato("aggrava");
        }
        break;
      case "silenzio_della_casa":
        r = atk({ piuDadi: 2 }); if (r.ok && vivo()) stato("aggrava");
        dif.nonCarica = Math.max(dif.nonCarica || 0, 2); if (dif.pronto) { E.push({ k: "caricaSpezzata", cosa: dif.pronto }); dif.pronto = null; }
        E.push(buff(att, "silenzio", { ca: 2, turni: 3 }));
        break;
      /* ---- Sciamano: in comune ---- */
      case "bevi_elisir": att.elisir--; E.push(cura(att, Math.max(1, Math.floor(att.pvMax / 4)))); break; /* PROVVISORIO: 1/4 della salute */
      case "puntura_di_mandragora": r = atk({}); if (r.ok && vivo()) stato("applica", "intossicato"); break;
      case "tappeto_di_micelio":
        r = atk({ soloDado: true });
        if (r.ok && vivo()) { stato("applica", "indebolito"); if (P.ha(dif, "intossicato")) E.push(P.allunga(dif, "intossicato", 1)); }
        break;

      /* ---- Sciamano delle Spore ---- */
      case "pelle_di_corteccia": E.push(buff(att, "pelle", { ca: 2, finoAlTurno: true })); break;
      case "spore_del_morbo": case "linfa_amara": r = atk({ piuDadi: 1 }); if (r.ok && vivo()) stato("aggrava", "intossicato"); break;
      case "muffa_che_dilaga": E.push(buff(att, "muffa", { turni: 4 })); break; /* i tuoi 3 turni successivi */
      case "esalazione": /* senza tiro per colpire: un TS Vigore → Indebolito e Stordito (sui boss Indebolito); Intossicato in ogni caso */
        stato("applica", "indebolito"); stato("applica", "stordito");
        E.push(...P.applica(dif, "intossicato", { senzaTs: true, turni: durataDi(att, "intossicato") }));
        break;
      case "cuore_di_tossina": {
        stato("aggrava", "intossicato");
        if (P.ha(dif, "intossicato")) {
          const n = dif.velenoPerenne ? Math.min(5, dif.pestilenzaTurni || 0) : dif.stati.intossicato.turni;
          E.push({ k: "cuoreTossina", turni: n });
          for (let i = 0; i < n && vivo(); i++) { const t = P.tick(dif, "intossicato", ctx.tira); if (t) E.push(t); }
          if (vivo()) { dif.stati.intossicato.liv = 2; dif.stati.intossicato.turni = durataPiena(att, "intossicato"); }
        }
        break;
      }
      case "sciame_putrido": E.push(buff(att, "sciame", { cariche: 3 })); break;
      case "pestilenza": dif.velenoPerenne = true; dif.pestilenzaTurni = 0; E.push({ k: "pestilenza" }); break;
      case "cisti_parassita": E.push(buff(att, "cisti", {})); break;
      case "marea_di_putrefazione":
        stato("aggrava", "intossicato");
        if (P.ha(dif, "intossicato")) { dif.stati.intossicato.doppio = vac ? 4 : 3; E.push({ k: "marea", turni: dif.stati.intossicato.doppio }); }
        break;

      /* ---- Sciamano della Linfa ---- */
      case "corteccia_viva": E.push(buff(att, "cortecciaViva", { ca: 2, finoAlTurno: true })); break;
      case "baccello_esplosivo": E.push(buff(att, "baccello", {})); break;
      case "radici_avvolgenti":
        stato("applica", "indebolito"); if (P.ha(dif, "intossicato")) E.push(P.allunga(dif, "intossicato", 1));
        E.push(buff(att, "radici", { ca: 2, finoAlTurno: true }));
        break;
      case "fioritura_del_parassita": dif.bulbo = { n: 0, da: att }; E.push({ k: "bulboPiantato" }); break;
      case "cuore_di_linfa": stato("aggrava", "intossicato"); E.push(buff(att, "cuoreLinfa", { turni: 3 })); break;
      case "linfa_perenne": E.push(buff(att, "linfaPerenne", { usi: 0 })); break;
      case "purga": stato("aggrava", "intossicato"); E.push(...P.togliTutti(att)); break;
      case "rinascita_del_sottobosco": {
        stato("aggrava", "intossicato"); E.push(...P.togliTutti(att));
        if (P.ha(dif, "intossicato")) {
          const s0 = dif.stati.intossicato; s0.turni = Math.max(s0.turni, durataPiena(att, "intossicato"));
          const dado = P.STATI.intossicato.dado[s0.liv - 1], t = tiraDadi(ctx, s0.turni, dado);
          E.push({ ...cura(att, somma(t)), tiri: t });
        }
        break;
      }
      /* ---- Arcanista: in comune ---- */
      case "coagulo": E.push(...curaDiClasse(att)); if (Object.keys(dif.stati).some(k => P.ha(dif, k))) { const x = ctx.tira(6); E.push(cura(att, x)); } break;

      /* ---- Arcanista del Sangue ---- */
      case "stilo_cremisi": r = atk({ focus: true, tipo: "sangue" }); if (r.ok && vivo()) stato("applica", "sanguinante"); break;
      case "frusta_cremisi": fisso(1, 4, false, "sangue"); if (vivo()) { stato("applica", "indebolito"); if (P.ha(dif, "sanguinante")) E.push(P.allunga(dif, "sanguinante", 1)); } break;
      case "crosta": E.push(buff(att, "crosta", { ca: 2, finoAlTurno: true })); break;
      case "ebollizione": {
        const era = P.grave(dif, "sanguinante");
        r = atk({ focus: true, tipo: "sangue", piuDadi: 1 });
        if (r.ok && vivo()) { stato("aggrava", "sanguinante"); if (era) { const x = ctx.tira(6); E.push(cura(att, x)); } }
        break;
      }
      case "meteora_di_sangue": r = atk({ focus: true, tipo: "sangue", piuDadi: 1, critDa: P.ha(dif, "sanguinante") ? 19 : 20 }); if (r.ok && vivo()) stato("applica", "esposto"); break;
      case "ali_cremisi": E.push(buff(att, "ali", { finoAlTurno: true })); break;
      case "cuore_spezzato": {
        stato("aggrava", "sanguinante");
        if (P.ha(dif, "sanguinante")) {
          const n = dif.stati.sanguinante.turni * 2; let tot = 0;
          for (let i = 0; i < n && vivo(); i++) { const t = P.tick(dif, "sanguinante", ctx.tira); if (t) { E.push(t); tot += t.danno; } }
          E.push(P.togli(dif, "sanguinante") || { k: "tolto", stato: "sanguinante" }); E.push(cura(att, meta(tot)));
        }
        break;
      }
      case "sangue_in_piena": E.push(buff(att, "piena", { turni: 4 })); break; /* i tuoi 3 turni successivi */
      case "vincolo_di_sangue": {
        const z = P.tiroSalvezza(dif, null, fonteDi(att), ctx.tira, "Spirito"); E.push(z);
        if (!z.ok) E.push(buff(att, "vincolo", { turni: 3, su: dif })); else E.push({ k: "resiste" });
        break;
      }
      case "costellazione_rossa": E.push(buff(att, "costellazione", { cariche: 3 })); break;
      case "marea_cremisi": {
        const era = P.grave(dif, "sanguinante");
        fisso(4, 8, true, "sangue"); if (vivo()) { stato("aggrava", "sanguinante"); if (era && P.ha(dif, "sanguinante")) dif.stati.sanguinante.turni = 6; }
        break;
      }

      /* ---- Arcanista dell'Illusione ---- */
      case "dardo_fantasma": atk({ focus: true, tipo: "illusione", dadoExtra: att.copie > 0 ? 4 : 0 }); break;
      case "sussurro_illusorio": {
        const era = P.ha(dif, "indebolito");
        r = atk({ focus: true, dado: 6, soloDado: true, tipo: "illusione" });
        if (r.ok && vivo()) { stato("applica", "indebolito"); if (era) copia(1); }
        break;
      }
      case "riflessi": E.push(buff(att, "riflessi", { ca: 2, finoAlTurno: true })); break;
      case "frantumare": {
        const n = att.copie || 0; att.copie = 0; E.push({ k: "copieConsumate", n });
        if (n) { fisso(n, 8, n, "illusione"); if (n >= 3 && vivo()) stato("applica", "esposto"); }
        break;
      }
      case "labirinto": stato("applica", "stordito", { attr: "Mente" }); copia(1); break;
      case "sdoppiamento": copia(2); E.push(buff(att, "sdoppiamento", { ca: 2, finoAlTurno: true })); break;
      case "incubo": fisso(2 + (att.copie || 0), 8, true, "illusione"); if (vivo()) stato("applica", "impaurito"); break;
      case "dado_truccato": dif.svantaggio = Math.max(dif.svantaggio || 0, dif.boss ? 2 : 3); E.push({ k: "svantaggio", turni: dif.svantaggio }); break;
      case "teatro_di_specchi": att.copie = COPIE_MAX; E.push({ k: "copia", tot: att.copie }, buff(att, "teatro", { turni: 3 })); break;
      case "specchio_rotto": copia(1); att.specchio = true; break;
      case "grande_inganno": {
        const n = att.copie; att.copie = 0; E.push({ k: "copieConsumate", n });
        fisso(2 * n, 10, n, "illusione");
        dif.svantaggio = Math.max(dif.svantaggio || 0, 2); E.push({ k: "svantaggio", turni: dif.svantaggio });
        break;
      }
      /* ---- Monaco: in comune ---- */
      case "tocco_lenitivo": { E.push(...curaDiClasse(att)); const k = Object.keys(att.stati).find(x => P.ha(att, x)); if (k) E.push(P.togli(att, k)); break; }

      /* ---- Monaco Purificatore (fuoco sacro) ---- */
      case "colpo_consacrato": r = atk({ dadoExtra: dif.maledetto ? 4 : 0 }); if (r.ok && vivo()) stato("applica", "scottato"); break;
      case "marchio_del_rogo": {
        r = atk({ dado: 6, n: 1, soloDado: true, tipo: "fuoco_sacro" });
        if (r.ok && vivo()) { stato("applica", "indebolito"); if (P.ha(dif, "scottato")) E.push(P.allunga(dif, "scottato", 1)); }
        break;
      }
      case "aura_purificante": E.push(buff(att, "aura", { ca: 2, finoAlTurno: true })); break;
      case "rogo": r = atk({ piuDadi: 1 }); if (r.ok && vivo()) stato("aggrava", "scottato"); break;
      case "arma_benedetta": E.push(buff(att, "benedetta", { turni: 4 })); break; /* i tuoi 3 turni successivi */
      case "fiamma_calda": E.push(cura(att, ctx.tira(8) + (att.modClasse || 0)), buff(att, "fiammaCalda", { finoAlTurno: true })); break;
      case "pira": { const era = P.grave(dif, "scottato"); fisso(3, 8, 1, "fuoco_sacro"); if (vivo()) { stato("aggrava", "scottato"); if (era) stato("applica", "esposto"); } break; }
      case "fuoco_che_cura": {
        const t = tiraDadi(ctx, 3, 8), tot = somma(t) + (att.modClasse || 0), c = cura(att, tot), eccesso = tot - c.n;
        E.push({ ...c, tiri: t });
        if (eccesso > 0) { const e = { k: "ecoDiAdele", eccesso }; E.push(e, ...danneggia(dif, eccesso, "fuoco_sacro", e, ctx)); }
        break;
      }
      case "consacrazione": E.push(buff(att, "consacrazione", { turni: 3 })); break;
      case "martello_del_giudizio": r = atk({ piuDadi: 1 }); if (r.ok && vivo()) { stato("aggrava", "scottato"); if (vivo()) stato("aggrava"); } break;
      case "rogo_purificatore": {
        const era = P.grave(dif, "scottato");
        fisso(4, 8, 1, "fuoco_sacro"); E.push(...P.togliTutti(att));
        if (vivo()) { stato("aggrava", "scottato"); if (era && P.ha(dif, "scottato")) { dif.stati.scottato.turni = 99; E.push({ k: "finoAFineScontro", stato: "scottato" }); } }
        break;
      }

      /* ---- Monaco Ossomante (placche d'ossa) ---- */
      case "lancia_d_ossa": atk({ focus: true, tipo: "ossa", critDa: 19, gabbia: true }); break;
      case "spine_d_ossa": r = atk({ focus: true, dado: 6, soloDado: true, tipo: "ossa", gabbia: true }); if (r.ok && vivo()) stato("applica", "indebolito"); placca(1); break;
      case "armatura_d_ossa": fisso(1, 4, 0, "ossa"); E.push(buff(att, "armaturaOssa", { ca: 2, finoAlTurno: true })); placca(1); break;
      case "spirito_d_ossa": { const n = att.placche; att.placche = 0; E.push({ k: "placcheSpese", n }); fisso(n, 8, n, "ossa"); break; }
      case "lama_d_osso": att.placche--; r = atk({ piuDadi: 2 }); if (r.ok) placca(1); break;
      case "barricata_di_costole": att.placche = PLACCHE_MAX; dif.malusProssimo = 2; E.push({ k: "placche", tot: att.placche }, { k: "barricata" }); break;
      case "prigione_d_ossa": stato("applica", "stordito"); if (vivo()) E.push(...P.applica(dif, "esposto", { senzaTs: true })); break;
      case "armatura_del_sepolcro": E.push(buff(att, "sepolcro", { cariche: 3 })); break;
      case "armatura_spezzata": E.push(buff(att, "spezzata", {})); break;
      case "decrepitezza": stato("applica", "indebolito"); stato("applica", "esposto"); placca(1); break;
      case "armata_dei_morti": {
        const n = att.placche || 0; att.placche = 0; E.push({ k: "placcheSpese", n });
        fisso(4 + n, 8, 1, "ossa"); if (vivo()) stato("applica", "stordito");
        break;
      }
      default: E.push({ k: "nonImplementato", id });
    }
      return { eventi: E };
  }
  /* Infuso (Sciamano, al riposo): un elisir di salute, massimo 2 portati (3 con Mani che curano, via di Guendalina dal 4) */
  function preparaInfuso(b) { const max = b.via === "guendalina" && b.liv >= 4 ? 3 : 2; b.elisir = Math.min(max, (b.elisir || 0) + 1); return b.elisir; }

  const API = { STATO_ARMA, statoArma, ca, attacco, usa, disponibile, inizioTurno, fineTurno, fineScontro, riposo, preparaInfuso };
  root.Scontro = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof window !== "undefined" ? window : globalThis);
