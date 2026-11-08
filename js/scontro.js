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
  function statoSu(att, dif, modo, ctx, id) {
    const k = id || statoArma(att); if (!k) return [];
    return (modo === "aggrava" ? P.aggrava : P.applica)(dif, k, { fonte: fonteDi(att), tira: ctx.tira });
  }

  /* ---------- L'attacco ----------
     o: { piuDadi, soloDado, doppiDadi, autoCrit, bonusDanno, tipo, critDa, nome, contrattacco }
     Le reazioni del difensore scattano qui (contrattacchi, Ritorsione, Ultimo baluardo): valgono per giocatore e nemici. */
  function attacco(att, dif, o, ctx) {
    pronto(att); pronto(dif); o = o || {};
    const E = [];
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
    Object.assign(ev, { nd, dado, tiri });
    E.push(...danneggia(dif, Math.max(1, lordo), o.tipo || (att.arma && att.arma.tipo), ev, ctx));
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
  function reazioneMancato(att, dif, ctx) {
    const E = [];
    if (dif.buff.guardiaFeroce) E.push(...contrattacco(dif, att, ctx, "applica"));
    else if (dif.buff.inGuardia) E.push(...contrattacco(dif, att, ctx, dif.buff.veglia ? "aggrava" : null));
    return E;
  }
  function reazioneColpito(att, dif, ctx) {
    const E = [];
    dif.colpitoUltimo = true;
    if (dif.buff.rappresaglia) E.push(...contrattacco(dif, att, ctx, "applica"));
    else if (dif.buff.inGuardia && dif.buff.veglia) E.push(...contrattacco(dif, att, ctx, "aggrava"));
    return E;
  }

  /* ---------- Turni ---------- */
  /* inizio del tuo turno: danni continuativi, scadono le difese «fino al tuo turno»; l'avversario dimentica cosa ti ha fatto */
  function inizioTurno(b, avv, ctx) {
    pronto(b);
    Object.keys(b.buff).forEach(k => { if (b.buff[k].finoAlTurno) delete b.buff[k]; });
    if (avv) { avv.colpitoUltimo = false; avv.dannoSubitoTurno = 0; }
    return P.inizioTurno(b, ctx.tira);
  }
  function fineTurno(b) {
    pronto(b);
    Object.keys(b.buff).forEach(k => { const x = b.buff[k]; if (x.turni > 0 && --x.turni === 0) delete b.buff[k]; });
    if (b.nonCarica > 0) b.nonCarica--;
    return P.fineTurno(b);
  }
  /* fine scontro: tornano i poteri per scontro, spariscono effetti e stati; il riposo ricarica i giornalieri */
  function fineScontro(b) { pronto(b); b.usati.scontro = {}; b.buff = {}; b.stati = {}; b.prossimiDadi = 0; b.marchio = false; b.marchia = false; b.immStordito = 0; b.nonCarica = 0; b.pronto = null;
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
    const stato = (modo, k) => E.push(...statoSu(att, dif, modo, ctx, k));
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
      default: E.push({ k: "nonImplementato", id });
    }
    /* Veglia di ferro scaduta: il bonus ai TS torna quello di prima (lo gestisce fineTurno tramite pulisciTs) */
    return { eventi: E };
  }
  /* il bonus ai TS di Veglia dura quanto il buff */
  const _fine = fineTurno;
  function fineTurnoConTs(b) { const E = _fine(b); if (!b.buff.veglia && b.bonusTsBase != null) { b.bonusTs = b.bonusTsBase; delete b.bonusTsBase; } return E; }

  const API = { STATO_ARMA, statoArma, ca, attacco, usa, disponibile, inizioTurno, fineTurno: fineTurnoConTs, fineScontro, riposo };
  root.Scontro = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof window !== "undefined" ? window : globalThis);
