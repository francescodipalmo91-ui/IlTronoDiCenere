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
  const mAtt = (b) => (b.modAtt != null ? b.modAtt : b.modClasse || 0) + ((b.arma && b.arma.bonus) || 0);
  const mDanno = (b) => (b.modDanno != null ? b.modDanno : b.modClasse || 0) + ((b.arma && b.arma.bonus) || 0);
  const buffCA = (b) => Object.values(b.buff || {}).reduce((t, x) => t + (Number(x.ca) || 0), 0);
  const ca = (b) => (b.caBase || 10) + buffCA(b) - P.malusCA(b);
  const tiraDadi = (ctx, n, d) => Array.from({ length: n }, () => ctx.tira(d));
  const somma = (a) => a.reduce((x, y) => x + y, 0);

  /* ---------- Applicare lo stato dell'arma ---------- */
  /* esito: { ok } condiviso dentro lo stesso potere (un TS solo per potere) */
  function statoSu(att, dif, modo, ctx, id, esito) {
    const k = id || statoArma(att); if (!k) return [];
    return (modo === "aggrava" ? P.aggrava : P.applica)(dif, k, { fonte: fonteDi(att), tira: ctx.tira, esito, turni: durataDi(att, k) });
  }
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
    const d = auto ? null : ctx.tira(20);
    const tot = auto ? null : d + mAtt(att) - P.malusColpire(att);
    const soglia = Math.min(o.critDa || 20, critBaseArma(att), P.sogliaCritContro(dif));
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
    const dado = (att.arma && att.arma.dado) || 4;
    const base = ((att.arma && att.arma.n) || 1) * (o.doppiDadi ? 2 : 1) + (o.piuDadi || 0) + (att.prossimiDadi || 0);
    if (att.prossimiDadi) { ev.dadiBaluardo = att.prossimiDadi; att.prossimiDadi = 0; }
    const nd = base * (ev.crit ? 2 : 1), tiri = tiraDadi(ctx, nd, dado);
    let lordo = somma(tiri) + (o.soloDado ? 0 : mDanno(att)) + (o.bonusDanno || 0);
    if (dif.marchio && att.marchia) { const x = ctx.tira(4); lordo += x; ev.marchio = x; }                /* Marchio della preda */
    if ((att.tratti || []).includes("furia") && P.vacillante(att)) { lordo += 2; ev.furia = 2; }        /* Furia: da Vacillante +2 */
    if ((att.tratti || []).includes("radici_profonde") && P.grave(dif, "intossicato")) { const x = ctx.tira(4); lordo += x; ev.radici = x; } /* Radici profonde */
    Object.assign(ev, { nd, dado, tiri });
    E.push(...danneggia(dif, Math.max(1, lordo), o.tipo || (att.arma && att.arma.tipo), ev, ctx));
    /* Muffa che dilaga: ogni colpo a segno applica Intossicato, o allunga di 1 turno il veleno in corso */
    if (att.buff.muffa && !o.contrattacco && dif.pv > 0) E.push(...(P.ha(dif, "intossicato") ? [P.allunga(dif, "intossicato", 1)] : statoSu(att, dif, "applica", ctx, "intossicato")));
    if (dif.pv > 0) E.push(...reazioneColpito(att, dif, ctx));
    return { ok: true, crit: ev.crit, eventi: E, ev };
  }

  /* il danno passa per le vulnerabilità e per le protezioni del difensore (Ultimo baluardo) */
  function danneggia(dif, lordo, tipo, ev, ctx) {
    const E = [];
    let n = P.modificaDanno(dif, tipo, lordo).danno;
    const bal = dif.buff.baluardo;
    if (bal && !bal.salvato && n >= dif.pv && dif.pv > 0) { bal.salvato = true; n = dif.pv - 1; E.push({ k: "baluardo" }); }
    const r = P.subisci(dif, n, null); /* il tipo è già stato contato */
    if (ev) { ev.danno = r.danno; ev.tipo = tipo; if (n !== lordo) ev.lordo = lordo; }
    dif.dannoSubitoTurno = (dif.dannoSubitoTurno || 0) + r.danno;
    if (bal && r.danno > 0) { dif.prossimiDadi = Math.min(3, (dif.prossimiDadi || 0) + 1); }
    if (r.vacillanteOra) E.push({ k: "vacillante", chi: dif.nome });
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
    if (avv) { pronto(avv); avv.colpitoUltimo = false; avv.dannoSubitoTurno = 0; }
    const E = P.inizioTurno(b, ctx.tira);
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
    return E;
  }
  function fineTurno(b) {
    pronto(b);
    if (b.nonCarica > 0) b.nonCarica--;
    if (b.velenoPerenne) b.pestilenzaTurni = (b.pestilenzaTurni || 0) + 1; /* turni passati dall'inizio di Pestilenza */
    return P.fineTurno(b);
  }
  /* fine scontro: tornano i poteri per scontro, spariscono effetti e stati; il riposo ricarica i giornalieri */
  function fineScontro(b) { pronto(b); b.usati.scontro = {}; b.buff = {}; b.stati = {}; b.prossimiDadi = 0; b.marchio = false; b.marchia = false; b.immStordito = 0; b.nonCarica = 0; b.pronto = null;
    b.bulbo = null; b.velenoPerenne = false; b.pestilenzaTurni = 0;
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
    return { ok: true };
  }

  const cura = (b, n) => { const prima = b.pv; b.pv = Math.min(b.pvMax, b.pv + n); return { k: "cura", chi: b.nome, n: b.pv - prima }; };
  const buff = (b, id, x) => { b.buff[id] = x; return { k: "buff", id, ...x }; };

  /* ---------- I poteri ---------- */
  function usa(att, dif, id, ctx) {
    pronto(att); pronto(dif);
    const disp = disponibile(att, id);
    if (!disp.ok) return { eventi: [{ k: disp.motivo, potere: id }], rifiutato: true };
    const p = potere(id), E = [];
    if (p.tipo === "scontro") att.usati.scontro[id] = true;
    if (p.tipo === "giornaliero") att.usati.giorno[id] = true;
    E.push({ k: "potere", id, nome: p.nome, tipo: p.tipo });
    const atk = (o) => { const r = attacco(att, dif, { nome: id, ...o }, ctx); E.push(...r.eventi); return r; };
    const esito = {}; /* un TS solo per potere */
    const stato = (modo, k) => E.push(...statoSu(att, dif, modo, ctx, k, esito));
    const vivo = () => dif.pv > 0;
    const vac = P.vacillante(dif);
    let r;
    switch (id) {
      /* ---- in comune ---- */
      case "colpo_di_mestiere": r = atk({ soloDado: true }); if (r.ok && vivo()) stato("applica"); break;
      case "secondo_vento": E.push(cura(att, Math.max(1, Math.floor(att.pvMax / ((att.via === "guendalina" && att.liv >= 4) ? 3 : 4))))); break;

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
        const sub = att.dannoSubitoTurno || 0, extra = P.vacillante(att) ? sub : Math.floor(sub / 2);
        r = atk({ bonusDanno: extra }); if (r.ok && vivo()) stato("aggrava");
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
