/* =====================================================================
   COMBATTIMENTO — regole delle tecniche del Guerriero, senza interfaccia.
   Lo usano gioco.html, la sala di prova (tutorial.html?prova) e i test (tests/combattimento.test.js):
   una regola cambiata qui cambia ovunque, e i test provano lo stesso codice che gira in partita.

   Uso: Combattimento.usa(tecnica, s, ctx) → { eventi, costo } dove
     s   = stato dello scontro: { pv, pvMax, eff: {}, effMax: {}, sangueDado, prossimo, marchio, sconto, parata, parataCrepe, parataPunta, guardiaVal, crepe, sigillo, segno,
             scudo: cariche, assorbiti, assorbe, elastica, postura, drenaggio, fortezzaUsata, difesaUsata, difesaBloccata, colpitoOra, colpitoUltimo }
     ctx = ambiente: { tira(d), liv, modAtt, modDanno, dado, ca(), boss, haArma, cd, modTs,
                       curaPg(n), iraPiu(n), usataPerRiposo(id), segnaPerRiposo(id) }
   Turno del nemico (chi gestisce lo scontro): colpoSubito(s, ctx, crit, danno) per ogni attacco a segno, colpoMancato(s, ctx) per
   ogni attacco mancato, presaBloccata(s) prima della Presa, fortezza(s, danno, pvPg) prima di applicare qualsiasi danno al personaggio,
   inizioTurnoPg(s, ctx) all'inizio del tuo turno (può rilasciare l'onda del Mare Profondo e dell'Egida).
   Gli eventi sono dati ({ k: "colpo", … }): i testi li scrive chi li mostra.
   ===================================================================== */
(function (root) {
  /* ---------- Ira, slot, recupero ---------- */
  const R = root.Regole || {};
  const SCELTE_PER_LIVELLO = R.TECNICHE_PER_LIVELLO || [2, 2, 1, 1, 1]; /* tecniche da scegliere a ogni livello (1..5) */
  const IRA_PER_COLPO = R.IRA_PER_COLPO || [1, 1, 2, 2, 3];              /* ira per colpo subito, per livello */
  const CONTROLLI = ["frastornato", "bloccato", "silenzio"]; /* i boss non li subiscono mai */
  const TETTO_BOSS = { debole: 2, sbilanciato: 2, esposto: 2, accecato: 2, avvizzito: 3 }; /* durata massima sui boss */
  const CREPE_MAX = 3, CREPE_MAX_BOSS = 2;             /* Incrinatura: cariche massime (comuni / boss) */
  const PER_SCONTRO = 99;                              /* durata «per tutto lo scontro» (Frattura della Sentenza e del Martello) */
  const CRIT_MIN = 18;                                 /* tetto dell'intervallo di critico: mai sotto 18-20 */
  const CARICHE_MAX = 3;                               /* Carica Cinetica dello scudo: massimo 3, anche contro i boss */
  const ASSORBITI_TSUNAMI = 3;                         /* Ritorno dello Tsunami: colpi assorbiti contati al massimo */

  const crescitaIra = (modV, nuovoLiv) => Math.max(1, modV + nuovoLiv);       /* a ogni salita: mod Vigore + livello raggiunto */
  const iraMax = (modV, liv) => { let m = 10 + modV; for (let l = 2; l <= liv; l++) m += crescitaIra(modV, l); return m; };
  const iraPerColpo = (liv, crit) => IRA_PER_COLPO[Math.max(1, Math.min(5, liv)) - 1] * (crit ? 2 : 1); /* colpo subito a segno, doppia sul critico */
  const slotTecniche = (liv, scudo) => SCELTE_PER_LIVELLO.slice(0, Math.max(1, Math.min(5, liv))).reduce((a, b) => a + b, 0) + (scudo ? 1 : 0);

  /* una scelta di tecniche è valida se ogni livello resta nella sua quota; lo scudo dà un posto in più, di qualsiasi livello */
  function sceltaValida(tecniche, liv, scudo) {
    const n = {}; tecniche.forEach(t => { n[t.liv] = (n[t.liv] || 0) + 1; });
    if (tecniche.some(t => t.liv > liv)) return { ok: false, motivo: "livello" };
    const eccesso = Object.keys(n).reduce((e, l) => e + Math.max(0, n[l] - (SCELTE_PER_LIVELLO[l - 1] || 0)), 0);
    const extra = scudo ? 1 : 0;
    if (eccesso > extra) return { ok: false, motivo: "quota" };
    if (tecniche.length > slotTecniche(liv, scudo)) return { ok: false, motivo: "posti" };
    return { ok: true };
  }
  /* le prime tecniche disponibili che rispettano le quote (personaggi creati prima delle quote) */
  function sceltaPredefinita(opzioni, liv, scudo) {
    const out = [];
    opzioni.forEach(t => { if (sceltaValida([...out, t], liv, scudo).ok) out.push(t); });
    return out;
  }

  /* ---------- Stati ---------- */
  const attivo = (s, k) => !!(s.eff && s.eff[k] > 0);
  const marchiato = (s) => !!s.marchio && attivo(s, "sanguina");
  const segnato = (s) => !!s.segno && attivo(s, "esposto"); /* Segno del Cacciatore: vale finché il nemico è Esposto */
  /* intervallo di critico: Esposto lo allarga di 1, l'Affondo dei Mille Soli lo porta a 18; mai sotto 18 */
  const sogliaCrit = (s, base) => Math.max(CRIT_MIN, attivo(s, "precisione") ? CRIT_MIN : (base || 20) - (attivo(s, "esposto") ? 1 : 0));
  function metti(s, ctx, k, turni) { /* applica uno stato al nemico rispettando le regole dei boss */
    if (ctx.boss && CONTROLLI.includes(k)) return { k: "immune", s: k };
    let n = turni, ridotto = false;
    if (ctx.boss && TETTO_BOSS[k] && n > TETTO_BOSS[k]) { n = TETTO_BOSS[k]; ridotto = true; }
    s.eff[k] = Math.max(s.eff[k] || 0, n);
    s.effMax = s.effMax || {}; s.effMax[k] = Math.max(s.effMax[k] || 0, s.eff[k]);
    return { k: "stato", s: k, turni: n, ridotto };
  }
  function sanguina(s, ctx, dado, turni) { /* Emorragia (1d6) sostituisce Sanguinamento (1d4) finché dura */
    const gia = attivo(s, "sanguina");
    s.sangueDado = gia ? Math.max(Number(s.sangueDado) || 4, dado) : dado;
    const e = metti(s, ctx, "sanguina", turni);
    e.dado = s.sangueDado; return e;
  }
  /* Incrinatura: −1 CA per carica, dura tutto lo scontro. È l'unico effetto che si somma; oltre il massimo le cariche vanno perse */
  const crepeMax = (ctx) => (ctx && ctx.boss ? CREPE_MAX_BOSS : CREPE_MAX);
  const crepe = (s) => Math.max(0, Number(s && s.crepe) || 0);
  const crepePiene = (s, ctx) => crepe(s) >= crepeMax(ctx);
  function incrina(s, ctx, n) {
    const prima = crepe(s), max = crepeMax(ctx), dopo = Math.min(max, prima + n);
    s.crepe = dopo;
    return { k: "crepe", n: dopo - prima, perse: n - (dopo - prima), tot: dopo, max };
  }
  /* Sigilli dell'Arcanista: incisi dall'Arcano, fatti esplodere dalla Forza. Durano tutto lo scontro; massimo 3 (2 sui boss) */
  const SIGILLI_MAX = 3, SIGILLI_MAX_BOSS = 2;
  const sigilliMax = (ctx) => (ctx && ctx.boss ? SIGILLI_MAX_BOSS : SIGILLI_MAX);
  const sigilli = (s) => Math.max(0, Number(s && s.sigilli) || 0);
  function incidi(s, ctx, n) {
    const prima = sigilli(s), max = sigilliMax(ctx), dopo = Math.min(max, prima + n);
    s.sigilli = dopo;
    return { k: "sigilli", n: dopo - prima, perse: n - (dopo - prima), tot: dopo, max };
  }
  /* malus alla CA del nemico: Sbilanciato (−2), cariche di Incrinatura (al massimo −5, −4 su un boss), Spezzare il Vincolo (−2 per tutto lo scontro) */
  const malusCA = (s) => (attivo(s, "sbilanciato") ? 2 : 0) + crepe(s) + (s && s.caMeno ? Number(s.caMeno) || 0 : 0);
  /* Frattura: 1d4 al nemico ogni volta che attacca (anche Presa e Soffio), prima del tiro. Non scatta se è stordito, perché non attacca */
  function frattura(s, ctx) { if (!attivo(s, "frattura")) return null; const d = ctx.tira(4); s.pv -= d; return { k: "frattura", d }; }
  const perScontro = (n) => n >= PER_SCONTRO;
  function guardia(s, val, turni) { /* +val alla CA del personaggio */
    s.guardiaVal = attivo(s, "guardia") ? Math.max(Number(s.guardiaVal) || 0, val) : val;
    s.eff.guardia = Math.max(s.eff.guardia || 0, turni);
    s.effMax = s.effMax || {}; s.effMax.guardia = Math.max(s.effMax.guardia || 0, s.eff.guardia);
    return { k: "guardia", val: s.guardiaVal, turni: s.eff.guardia };
  }

  /* ---------- Scudo: Carica Cinetica, assorbimento, difesa ---------- */
  const cariche = (s) => Math.max(0, Number(s && s.cariche) || 0);
  function carica(s, n) { /* aggiunge cariche fino al massimo; quelle oltre vanno perse */
    const prima = cariche(s), dopo = Math.min(CARICHE_MAX, prima + n);
    s.cariche = dopo;
    return { k: "cariche", n: dopo - prima, perse: n - (dopo - prima), tot: dopo, max: CARICHE_MAX };
  }
  /* tecniche di scudo che consumano l'azione: mai due turni di fila */
  const difesaDiFila = (t, s) => !!(t && t.difesa && s && s.difesaBloccata);
  /* una tecnica si può usare adesso? (prima di spendere l'ira) */
  function disponibile(t, s) {
    if (difesaDiFila(t, s)) return { ok: false, motivo: "difesaDiFila" };
    if (t && t.servonoCariche && cariche(s) < 1) return { ok: false, motivo: "senzaCariche" };
    return { ok: true };
  }
  const presaBloccata = (s) => !!(s && s.postura); /* Postura Salda: la Presa non ti afferra */
  /* Fortezza Eterna: una volta per scontro, il colpo che ti porterebbe a 0 ti lascia a 1 e ti dà le Cariche al massimo */
  function fortezza(s, danno, pv) {
    if (!s || !attivo(s, "fortezza") || s.fortezzaUsata || !(pv > 0) || danno < pv) return { danno, eventi: [] };
    s.fortezzaUsata = true; s.eff.fortezza = 0;
    return { danno: pv - 1, eventi: [{ k: "fortezza", evitato: danno - (pv - 1) }, carica(s, CARICHE_MAX)] };
  }
  /* onda senza tiro per colpire: n dadi + mod Vigore (una volta) */
  function onda(s, ctx, n, dado, extra) {
    const tiri = tiraDadi(ctx, n, dado), tiriExtra = extra ? tiraDadi(ctx, extra.n, extra.dado) : [];
    const danno = Math.max(1, somma(tiri) + somma(tiriExtra) + ctx.modDanno);
    s.pv -= danno;
    return { k: "onda", n, dado, tiri, ...(extra ? { nExtra: extra.n, dadoExtra: extra.dado, tiriExtra } : {}), mm: ctx.modDanno, danno };
  }

  /* ---------- Attacchi ---------- */
  const tiraDadi = (ctx, n, d) => Array.from({ length: n }, () => ctx.tira(d));
  const somma = (a) => a.reduce((x, y) => x + y, 0);
  /* o: { bonus, conMod, dado, piuDadi, critDa, base, sempreCrit } — base: è un attacco base (vale il marchio) */
  function colpo(s, ctx, o) {
    o = o || {};
    const pre = o.base ? {} : (s.prossimo || {}); if (!o.base) s.prossimo = null;
    const mA = ctx.modAtt + (o.bonus || 0) + (pre.bonus || 0), ca = ctx.ca(), d = ctx.tira(20), tot = d + mA;
    const soglia = sogliaCrit(s, o.critDa);
    let crit = d >= soglia, ok = crit || tot > ca;
    if (ok && o.sempreCrit) crit = true;
    const ev = { k: "colpo", d, mA, tot, ca, crit, ok, danno: 0 };
    if (soglia < 20) ev.critDa = soglia;
    if (ok) {
      const dado = o.dado || ctx.dado, nd = (crit ? 2 : 1) * (1 + (o.piuDadi || 0) + (pre.piuDadi || 0)), tiri = tiraDadi(ctx, nd, dado), mm = o.conMod === false ? 0 : ctx.modDanno;
      let danno = Math.max(1, somma(tiri) + mm);
      Object.assign(ev, { nd, dado, tiri, mm });
      if (o.base && marchiato(s)) { const x = ctx.tira(4); danno += x; ev.marchio = x; }
      if (o.base && s.sigillo && crepePiene(s, ctx)) { const x = ctx.tira(4); danno += x; ev.sigillo = x; } /* Sigillo del Demolitore */
      if (o.base && segnato(s)) { const x = ctx.tira(4); danno += x; ev.segno = x; } /* Segno del Cacciatore */
      ev.danno = danno; s.pv -= danno;
    }
    return ev;
  }
  /* tiro salvezza del nemico (d20 + suo Vigore contro 8 + Vigore + livello) */
  function ts(ctx) { const d = ctx.tira(20), tot = d + ctx.modTs; return { k: "ts", cd: ctx.cd, m: ctx.modTs, d, tot, ok: tot >= ctx.cd }; }

  const vivo = (s) => s.pv > 0;
  const costo = (t, s) => (s && s.sconto ? Math.max(1, t.costo - s.sconto) : t.costo);

  /* ---------- Le tecniche ---------- */
  function usa(t, s, ctx) {
    s.eff = s.eff || {}; s.effMax = s.effMax || {};
    const E = [], c = costo(t, s);
    if (t.unaPerRiposo && ctx.usataPerRiposo && ctx.usataPerRiposo(t.id)) return { eventi: [{ k: "giaUsataRiposo" }], costo: 0, rifiutata: true };
    const disp = disponibile(t, s); if (!disp.ok) return { eventi: [{ k: disp.motivo }], costo: 0, rifiutata: true };
    if (t.difesa) s.difesaUsata = true; /* il prossimo turno non potrai usare un'altra difesa dello scudo */
    if (s.sconto) { E.push({ k: "scontoUsato", n: t.costo - c }); s.sconto = 0; }
    const hit = (o) => { const r = colpo(s, ctx, o); E.push(r); return r; };
    const fx = (k, n) => E.push(metti(s, ctx, k, n));
    const sang = (d, n) => E.push(sanguina(s, ctx, d, n));
    /* effetti con tiro salvezza: { stato: turni }. I boss ignorano senza tirare gli effetti che sono solo di controllo */
    const conTSn = (mappa, alternativa) => {
      const stati = Object.keys(mappa);
      if (ctx.boss && stati.every(k => CONTROLLI.includes(k))) { stati.forEach(k => E.push({ k: "immune", s: k })); if (alternativa) alternativa(); return false; }
      const z = ts(ctx); E.push(z);
      if (z.ok) { E.push({ k: "resiste" }); if (alternativa) alternativa(); return false; }
      stati.forEach(k => fx(k, mappa[k])); return true;
    };
    const crp = (n) => E.push(incrina(s, ctx, n));
    /* lo scudo si prepara ad assorbire: il primo colpo a segno prima del tuo turno (o tutti, con «tutti») */
    const assorbi = (a) => { s.assorbe = { ...a, n: 0 }; E.push({ k: "assorbePronto", tipo: a.tipo, cariche: a.cariche || 0, onda: a.onda || null }); };
    /* controllo con tiro salvezza che sui boss ha un ripiego proprio (non quando il comune resiste) */
    const controlloORipiego = (mappa, ripiegoBoss) => {
      if (ctx.boss) { Object.keys(mappa).forEach(k => E.push({ k: "immune", s: k })); ripiegoBoss(); return false; }
      return conTSn(mappa);
    };
    const giaSanguina = attivo(s, "sanguina");
    let r;
    switch (t.id) {
      /* ---- utilità ---- */
      case "furore": fx("furore", 2); break;

      /* ---- taglio: livello 1 ---- */
      case "polso": r = hit(); if (r.ok) fx("debole", 2); break;
      case "morso_acciaio": r = hit(); if (r.ok) sang(4, 2); break;
      case "pomolo": r = hit(); if (r.ok) fx("sbilanciato", 1); break;
      /* ---- taglio: livello 2 ---- */
      case "vipera": r = hit(); if (r.ok && vivo(s)) conTSn({ frastornato: 1 }); break;
      case "tendini": r = hit(); if (r.ok) { sang(4, 2); fx("sbilanciato", 1); } break;
      case "cremisi": r = hit({ piuDadi: 1 }); if (r.ok && giaSanguina) { s.eff.sanguina = 0; sang(Number(s.sangueDado) || 4, 2); fx("debole", 2); } break;
      /* ---- taglio: livello 3 ---- */
      case "eco": r = hit(); if (r.ok && vivo(s)) conTSn({ bloccato: 1 }, () => fx("sbilanciato", 1)); break;
      case "arterie": r = hit(); if (r.ok) { sang(6, 3); const n = ctx.tira(4); if (ctx.curaPg) ctx.curaPg(n); E.push({ k: "cura", n }); } break;
      case "spezzaguardia": r = hit(); if (r.ok) { fx("sbilanciato", 2); s.prossimo = { bonus: 2 }; E.push({ k: "prossimo", bonus: 2 }); } break;
      /* ---- taglio: livello 4 ---- */
      case "squarcia": r = hit({ piuDadi: 1 }); if (r.ok && vivo(s)) conTSn({ frastornato: 2, silenzio: 2 }); break;
      case "mutilazione":
        r = hit({ piuDadi: 1 });
        if (r.ok) {
          fx("debole", 3); sang(4, 2);
          if (!ctx.boss && vivo(s) && s.pv < s.pvMax * 0.25) { s.pv = 0; E.push({ k: "esecuzione" }); }
        }
        break;
      case "parata": s.parata = true; E.push({ k: "parata" }); break;
      /* ---- taglio: livello 5 ---- */
      case "cateratta": {
        let aSegno = 0;
        for (let i = 0; i < 3 && vivo(s); i++) { const z = hit({ conMod: false }); if (z.ok) { aSegno++; if (vivo(s)) sang(Math.max(4, Number(s.sangueDado) || 4), 2); } }
        if (aSegno === 3 && vivo(s)) conTSn({ bloccato: 1 });
        break;
      }
      case "diluvio": r = hit({ piuDadi: 1 }); if (r.ok) { sang(6, 3); fx("debole", 3); } break;
      case "cataclisma":
        if (ctx.segnaPerRiposo) ctx.segnaPerRiposo(t.id);
        r = hit({ piuDadi: 1 });
        if (r.ok && vivo(s)) { fx("frastornato", 3); fx("sbilanciato", 3); }
        if (vivo(s)) { E.push({ k: "attaccoGratuito" }); hit({ base: true }); }
        break;

      /* ---- via di Aldo ---- */
      case "marchio": r = hit(); if (r.ok) { sang(4, 3); s.marchio = true; E.push({ k: "marchio" }); } break;
      case "ferita_riaperta":
        r = hit();
        if (r.ok && vivo(s)) {
          if (giaSanguina && attivo(s, "sanguina")) { const n = s.eff.sanguina, dado = Number(s.sangueDado) || 4, tiri = tiraDadi(ctx, n, dado), tot = somma(tiri); s.pv -= tot; s.eff.sanguina = 0; s.marchio = false; E.push({ k: "sangueTutto", n, dado, tiri, tot }); }
          else sang(4, 2);
        }
        break;
      case "sentenza": hit({ sempreCrit: giaSanguina }); break;
      /* ---- via di Guendalina ---- */
      case "veglia_ferro": r = hit(); if (r.ok) { fx("debole", 2); fx("sbilanciato", 2); } E.push(guardia(s, 2, 1)); break;
      case "ritmo": r = hit({ piuDadi: 1 }); if (r.ok) { fx("debole", 3); if (vivo(s)) conTSn({ frastornato: 1 }); } s.sconto = 2; E.push({ k: "sconto", n: 2 }); break;
      case "veglia_inflessibile":
        r = hit({ piuDadi: 1 }); if (r.ok) { fx("debole", 3); fx("sbilanciato", 3); }
        E.push(guardia(s, 2, 3)); s.eff.furore = Math.max(s.eff.furore || 0, 3); s.effMax.furore = Math.max(s.effMax.furore || 0, 3); E.push({ k: "furore", turni: 3 }); /* +4 ai tiri salvezza e alle prove contrapposte */
        break;

      /* ---- contundenti: livello 1 ---- */
      case "maglio": r = hit(); if (r.ok) crp(1); break;
      case "mento": r = hit(); if (r.ok) { fx("debole", 1); fx("intontito", 1); } break;
      case "sbilanciante": r = hit(); if (r.ok) { fx("sbilanciato", 1); fx("debole", 1); } break;
      /* ---- contundenti: livello 2 ---- */
      case "frantumascudo": r = hit(); if (r.ok) crp(2); break;
      case "tremante": r = hit(); if (r.ok && vivo(s)) conTSn({ frastornato: 1 }, () => fx("sbilanciato", 1)); break;
      case "costole": r = hit({ piuDadi: 1 }); if (r.ok) fx("frattura", 2); break;
      /* ---- contundenti: livello 3 ---- */
      case "sismica": r = hit(); if (r.ok) { crp(1); fx("sbilanciato", 2); } break;
      case "demolitore": r = hit({ piuDadi: 1 }); if (r.ok) crp(2); break;
      case "coma": r = hit(); if (r.ok && vivo(s)) conTSn({ bloccato: 1 }, () => fx("debole", 2)); break;
      /* ---- contundenti: livello 4 ---- */
      case "ginocchia": r = hit({ piuDadi: 1 }); if (r.ok) { fx("debole", 3); fx("sbilanciato", 3); } break;
      case "demolizione": {
        let aSegno = 0;
        for (let i = 0; i < 2 && vivo(s); i++) { const z = hit({ conMod: false }); if (z.ok) aSegno++; }
        if (aSegno === 2 && vivo(s)) { crp(2); controlloORipiego({ bloccato: 1 }, () => fx("sbilanciato", 2)); }
        break;
      }
      case "controschiaccio": s.parata = true; s.parataCrepe = true; E.push({ k: "parata" }); break;
      /* ---- contundenti: livello 5 ---- */
      case "cateratta_roccia": {
        let aSegno = 0;
        for (let i = 0; i < 3 && vivo(s); i++) { const z = hit({ conMod: false }); if (z.ok) { aSegno++; if (vivo(s)) crp(1); } }
        if (aSegno === 3 && vivo(s)) controlloORipiego({ bloccato: 1 }, () => fx("sbilanciato", 2));
        break;
      }
      case "impatto_cataclisma": r = hit({ piuDadi: 1 }); if (r.ok) { crp(3); fx("sbilanciato", 3); } break;
      case "sentenza_maglio":
        if (ctx.segnaPerRiposo) ctx.segnaPerRiposo(t.id);
        r = hit({ bonus: 5, piuDadi: 1 });
        if (r.ok && vivo(s)) { fx("frattura", PER_SCONTRO); conTSn({ bloccato: 1 }); }
        break;

      /* ---- via di Aldo (contundenti): Spezzare ---- */
      case "sigillo": r = hit(); if (r.ok) { crp(2); s.sigillo = true; E.push({ k: "sigillo" }); } break;
      case "crollo": {
        const n = crepe(s);
        r = hit({ piuDadi: n });
        if (r.ok) { if (n > 0) { s.crepe = 0; E.push({ k: "crollo", n }); } else if (vivo(s)) crp(2); }
        break;
      }
      case "martello": {
        const piene = crepePiene(s, ctx);
        r = hit({ sempreCrit: piene });
        if (r.ok && piene && vivo(s)) fx("frattura", PER_SCONTRO);
        break;
      }
      /* ---- via di Guendalina (contundenti): Controllo ---- */
      case "rintocco": r = hit(); if (r.ok && vivo(s)) controlloORipiego({ frastornato: 1 }, () => fx("debole", 2)); E.push(guardia(s, 2, 1)); break;
      case "cadenza": r = hit({ piuDadi: 1 }); if (r.ok && vivo(s)) controlloORipiego({ bloccato: 1 }, () => { fx("debole", 2); fx("sbilanciato", 2); }); s.sconto = 2; E.push({ k: "sconto", n: 2 }); break;
      case "silenzio_casa":
        r = hit({ piuDadi: 1 });
        if (r.ok) {
          fx("debole", 3); fx("sbilanciato", 3);
          if (ctx.boss) { E.push({ k: "immune", s: "silenzio" }); s.eff.furore = Math.max(s.eff.furore || 0, 3); s.effMax.furore = Math.max(s.effMax.furore || 0, 3); E.push({ k: "furore", turni: 3 }); }
          else fx("silenzio", 2);
        }
        E.push(guardia(s, 2, 3));
        break;

      /* ---- perforanti: livello 1 ---- */
      case "cuore": hit({ bonus: 2, critDa: 19 }); break;
      case "spillo": r = hit({ conMod: false }); if (r.ok) { s.prossimo = { bonus: 2 }; E.push({ k: "prossimo", bonus: 2 }); } break;
      case "varco": r = hit(); if (r.ok && vivo(s)) fx("esposto", 2); break;
      /* ---- perforanti: livello 2 ---- */
      case "giuntura": r = hit(); if (r.ok) { s.prossimo = { piuDadi: 1 }; E.push({ k: "prossimo", piuDadi: 1 }); } break;
      case "trafittura": hit({ bonus: 3, piuDadi: 1 }); break;
      case "fianco": r = hit({ critDa: 18 }); if (r.ok && r.crit && vivo(s)) fx("debole", 2); break;
      /* ---- perforanti: livello 3 ---- */
      case "doppia_punta": for (let i = 0; i < 2 && vivo(s); i++) hit({ conMod: false, critDa: 19 }); break;
      case "perforazione": r = hit({ bonus: 3, piuDadi: 1 }); if (r.ok && vivo(s)) fx("esposto", 2); break;
      case "mirato": hit({ sempreCrit: true }); break;
      /* ---- perforanti: livello 4 ---- */
      case "ferita_profonda": r = hit({ piuDadi: 1 }); if (r.ok && vivo(s)) { fx("esposto", 3); fx("debole", 2); } break;
      case "guardia_punta": s.parata = true; s.parataPunta = true; E.push({ k: "parata" }); break;
      case "grazia":
        r = hit({ piuDadi: 1, critDa: 19 });
        if (r.ok && !ctx.boss && vivo(s) && s.pv < s.pvMax * 0.25) { s.pv = 0; E.push({ k: "esecuzione" }); }
        break;
      /* ---- perforanti: livello 5 ---- */
      case "tempesta": {
        let aSegno = 0;
        for (let i = 0; i < 3 && vivo(s); i++) { const z = hit({ conMod: false, critDa: 18 }); if (z.ok) { aSegno++; if (z.crit && vivo(s)) fx("esposto", 2); } }
        if (aSegno === 3 && vivo(s)) controlloORipiego({ bloccato: 1 }, () => fx("debole", 2));
        break;
      }
      case "celeste": r = hit({ bonus: 5, piuDadi: 1 }); if (r.ok && vivo(s)) { fx("esposto", 3); fx("sbilanciato", 3); } break;
      case "colpo_perfetto":
        if (ctx.segnaPerRiposo) ctx.segnaPerRiposo(t.id);
        hit({ piuDadi: 1, sempreCrit: true });
        if (vivo(s)) { E.push({ k: "attaccoGratuito" }); hit({ base: true }); }
        break;

      /* ---- via di Aldo (perforanti): Penetrazione ---- */
      case "segno": r = hit(); if (r.ok && vivo(s)) { fx("esposto", 3); s.segno = true; E.push({ k: "segno" }); } break;
      case "trapasso": {
        const esp = attivo(s, "esposto");
        r = hit({ bonus: 5, piuDadi: esp ? 2 : 1 });
        if (r.ok && esp) { s.eff.esposto = 0; s.segno = false; E.push({ k: "espostoConsumato" }); }
        break;
      }
      case "foro": {
        const esp = attivo(s, "esposto");
        r = hit({ sempreCrit: esp });
        if (r.ok && esp && vivo(s)) fx("esposto", PER_SCONTRO);
        break;
      }
      /* ---- via di Guendalina (perforanti): Precisione ---- */
      case "occhio_vigile": hit({ critDa: 19 }); E.push(guardia(s, 2, 1)); break;
      case "specchio": r = hit({ piuDadi: 1, critDa: 18 }); if (r.ok && r.crit && vivo(s)) controlloORipiego({ frastornato: 1 }, () => fx("debole", 2)); s.sconto = 2; E.push({ k: "sconto", n: 2 }); break;
      case "mille_soli":
        r = hit({ piuDadi: 1 }); if (r.ok && vivo(s)) { fx("esposto", 3); fx("debole", 3); }
        E.push(guardia(s, 2, 3)); s.eff.precisione = Math.max(s.eff.precisione || 0, 3); s.effMax.precisione = Math.max(s.effMax.precisione || 0, 3); E.push({ k: "precisione", turni: 3 });
        break;
      /* ---- scudo: colpo di scudo 1d4 (o il dado indicato) + Vigore ---- */
      /* livello 1 */
      case "assorbimento": hit({ dado: 4 }); assorbi({ tipo: "meta", cariche: 1 }); break;
      case "postura_salda": E.push(guardia(s, 3, 1)); s.postura = true; E.push({ k: "postura" }); break;
      case "rimbalzo_marea": assorbi({ tipo: "rimbalzo", cariche: 1 }); break;
      /* livello 2 */
      case "batteria": assorbi({ tipo: "zeroIra", cariche: 1 }); break;
      case "spinta":
        r = hit({ dado: 6 });
        if (r.ok && vivo(s) && conTSn({ silenzio: 1 }, () => fx("sbilanciato", 1))) { s.soffioPronto = false; E.push({ k: "soffioPerso" }); }
        break;
      case "muro": assorbi({ tipo: "zero", cariche: 3 }); break;
      /* livello 3 */
      case "inversione": {
        const vendetta = !!s.colpitoUltimo;
        r = hit({ dado: 4, piuDadi: vendetta ? 1 : 0 });
        if (vendetta) { E.push({ k: "vendetta" }); E.push(guardia(s, 2, 2)); }
        break;
      }
      case "onda_ritorno": { const n = cariche(s); s.cariche = 0; E.push({ k: "caricheSpese", n }); E.push(onda(s, ctx, n, 6)); break; }
      case "baluardo": E.push(guardia(s, 2, 2)); s.eff.baluardo = Math.max(s.eff.baluardo || 0, 2); s.effMax.baluardo = Math.max(s.effMax.baluardo || 0, 2); E.push({ k: "baluardo", turni: 2 }); break;
      /* livello 4 */
      case "risucchio": r = hit({ dado: 6, piuDadi: 1 }); if (r.ok) { E.push(carica(s, 1)); const n = ctx.tira(4); if (ctx.iraPiu) ctx.iraPiu(n); E.push({ k: "ira", n }); } break;
      case "mare_profondo": assorbi({ tipo: "tutti", onda: "mare" }); break;
      case "frantumazione":
        r = hit({ dado: 6, piuDadi: 1 });
        if (r.ok && vivo(s)) { if (ctx.boss) { E.push({ k: "immune", s: "silenzio" }); fx("debole", 2); fx("sbilanciato", 2); } else conTSn({ silenzio: 2, debole: 2 }); }
        break;
      /* livello 5 */
      case "tempesta_risacca": {
        let aSegno = 0;
        for (let i = 0; i < 3 && vivo(s); i++) { const z = hit({ dado: 4, conMod: false }); if (z.ok) { aSegno++; E.push(carica(s, 1)); } }
        if (aSegno === 3 && vivo(s)) controlloORipiego({ bloccato: 1 }, () => fx("sbilanciato", 2));
        break;
      }
      case "ancoraggio":
        assorbi({ tipo: "zero", cariche: 0 }); E.push(carica(s, CARICHE_MAX));
        controlloORipiego({ silenzio: 3 }, () => fx("debole", 2));
        break;
      case "egida":
        if (ctx.segnaPerRiposo) ctx.segnaPerRiposo(t.id);
        assorbi({ tipo: "tutti", onda: "egida" });
        break;

      /* ---- via di Aldo (scudo): Risacca ---- */
      case "marea_elastica": hit({ dado: 4 }); assorbi({ tipo: "meta", cariche: 2 }); s.elastica = true; E.push({ k: "elastica" }); break;
      case "onda_rimbalzo": {
        const n = cariche(s);
        if (n > 0) { r = hit({ dado: 6, bonus: 3, piuDadi: n }); if (r.ok) { s.cariche = 0; E.push({ k: "caricheSpese", n }); } }
        else assorbi({ tipo: "meta", cariche: 2 });
        break;
      }
      case "tsunami": {
        const n = cariche(s), a = Math.min(ASSORBITI_TSUNAMI, Number(s.assorbiti) || 0);
        E.push({ k: "caricheSpese", n }); E.push(onda(s, ctx, n, 6, a ? { n: a, dado: 4 } : null));
        s.cariche = 1; E.push({ k: "caricaResta" });
        break;
      }
      /* ---- via di Guendalina (scudo): Postura ---- */
      case "drenaggio":
        r = hit({ dado: 4 }); if (r.ok && vivo(s)) controlloORipiego({ silenzio: 1 }, () => fx("debole", 2));
        E.push(guardia(s, 2, 1)); s.drenaggio = true; E.push({ k: "drenaggio" });
        break;
      case "sigillo_monolito":
        r = hit({ dado: 6, piuDadi: 1 }); if (r.ok && vivo(s)) controlloORipiego({ silenzio: 2 }, () => { fx("debole", 2); fx("sbilanciato", 2); });
        E.push(guardia(s, 2, 2)); s.sconto = 2; E.push({ k: "sconto", n: 2 });
        break;
      case "fortezza_eterna":
        r = hit({ dado: 6, piuDadi: 1 });
        if (r.ok && vivo(s)) { if (ctx.boss) { E.push({ k: "immune", s: "silenzio" }); fx("debole", 2); fx("sbilanciato", 2); } else { fx("silenzio", 3); fx("debole", 3); } }
        E.push(guardia(s, 2, 3));
        if (!s.fortezzaUsata) { s.eff.fortezza = Math.max(s.eff.fortezza || 0, 3); s.effMax.fortezza = Math.max(s.effMax.fortezza || 0, 3); E.push({ k: "fortezzaPronta", turni: 3 }); }
        else E.push({ k: "fortezzaUsata" });
        break;
      default: E.push({ k: "sconosciuta" });
    }
    return { eventi: E, costo: c };
  }

  /* ---------- Turno del nemico: modificatori, parata, ira ---------- */
  const modAttaccoNem = (s) => (attivo(s, "debole") ? -2 : 0) + (attivo(s, "frastornato") ? -4 : 0) + (s.filo && sigilli(s) >= 2 ? -2 : 0); /* Filo di Rune: con 2+ Sigilli sul nemico, −2 a colpirti */
  const critNemPossibile = (s) => !attivo(s, "frastornato") && !attivo(s, "intontito"); /* Intontito: Percossa al Mento */
  /* un attacco del nemico che va a segno.
     - Parata (Mutilante, Contro-Schiacciamento, Guardia di Punta): lo annulla e contrattacca, niente ira.
     - Scudo: metà danni (ira normale), Rimbalzo (metà torna al nemico), 0 danni (niente ira; Batteria sì), tutti i colpi (Mare Profondo, Egida).
     - Baluardo: ira doppia e 1 Carica. Marea Elastica: con almeno 2 Cariche, 1d4 torna al nemico.
     danno = danno pieno già tirato (se manca, si lavora solo su Parata e ira, come prima).
     → { annullato, danno, ira, eventi }: annullato = il colpo non ti fa nulla */
  function colpoSubito(s, ctx, crit, danno) {
    s.eff = s.eff || {};
    s.colpitoOra = true; /* Inversione della Marea: il nemico ti ha colpito in questo suo turno */
    s.colpiSubiti = (Number(s.colpiSubiti) || 0) + 1; /* Rancore: colpi subiti in questo scontro */
    const EM = []; /* effetti degli incantesimi che scattano quando il nemico ti colpisce */
    if (attivo(s, "fiamma")) { const d = ctx.tira(4); s.pv -= d; EM.push({ k: "fiammaColpo", d }); }          /* Fiamma Calda */
    if (attivo(s, "corona") && vivo(s)) EM.push(metti(s, ctx, "accecato", 1));                               /* Corona di Raggi */
    if (s.parata) {
      const conCrepe = !!s.parataCrepe, conPunta = !!s.parataPunta; s.parata = false; s.parataCrepe = false; s.parataPunta = false;
      const E = [{ k: "parataRiuscita" }], dado = ctx.dado;
      /* Guardia di Punta: il contrattacco è critico con 18-20 (d20 tirato solo per il critico) */
      let crit = false, dCrit = null;
      if (conPunta) { dCrit = ctx.tira(20); crit = dCrit >= CRIT_MIN; }
      const tiri = tiraDadi(ctx, crit ? 2 : 1, dado), danno = Math.max(1, somma(tiri) + ctx.modDanno);
      s.pv -= danno; E.push({ k: "contrattacco", dado, tiri, mm: ctx.modDanno, danno, ...(conPunta ? { dCrit, crit } : {}) });
      if (vivo(s)) E.push(conPunta ? metti(s, ctx, "esposto", 2) : conCrepe ? incrina(s, ctx, 1) : sanguina(s, ctx, 4, 2));
      return { annullato: true, danno: 0, ira: 0, eventi: E };
    }
    const E = [...EM], pieno = Number(danno) || 0;
    let ira = iraPerColpo(ctx.liv, crit), finale = pieno;
    const a = s.assorbe;
    if (a) {
      if (a.tipo !== "tutti" && a.tipo !== "respingere") s.assorbe = null; /* vale per il primo colpo; «tutti» e Respingere durano fino al tuo turno */
      s.assorbiti = (Number(s.assorbiti) || 0) + 1;
      if (a.tipo === "meta") { finale = Math.floor(pieno / 2); E.push({ k: "assorbito", tipo: a.tipo, prima: pieno, dopo: finale }); }
      else if (a.tipo === "rimbalzo") {
        finale = Math.floor(pieno / 2); const torna = pieno - finale;
        E.push({ k: "assorbito", tipo: a.tipo, prima: pieno, dopo: finale });
        if (torna > 0) { s.pv -= torna; E.push({ k: "rimbalzo", danno: torna }); }
      } else if (a.tipo === "zero") { finale = 0; ira = 0; E.push({ k: "assorbito", tipo: a.tipo, prima: pieno, dopo: 0 }); }
      else if (a.tipo === "zeroIra") { finale = 0; E.push({ k: "assorbito", tipo: a.tipo, prima: pieno, dopo: 0 }); }
      else if (a.tipo === "tutti") { finale = 0; ira = 0; a.n = (a.n || 0) + 1; E.push({ k: "assorbito", tipo: a.tipo, prima: pieno, dopo: 0 }); }
      /* difese degli incantesimi: Specchio di Rune (metà e 1 Sigillo), Barriera Cinetica (0 e 1d6 forza), Respingere (tutti i colpi: 0 e 1d6 forza) */
      else if (a.tipo === "specchio") { finale = Math.floor(pieno / 2); ira = 0; E.push({ k: "assorbito", tipo: "meta", prima: pieno, dopo: finale }, incidi(s, ctx, 1)); }
      else if (a.tipo === "barriera" || a.tipo === "respingere") {
        finale = 0; ira = 0; E.push({ k: "assorbito", tipo: "zero", prima: pieno, dopo: 0 });
        const d = ctx.tira(6); s.pv -= d; E.push({ k: "riflesso", d });
      }
      const nc = a.tipo === "tutti" ? 1 : (a.cariche || 0);
      if (nc) E.push(carica(s, nc));
    }
    if (attivo(s, "santuario") && !s.santColpo && finale > 0) { s.santColpo = true; const prima = finale; finale = Math.floor(finale / 2); E.push({ k: "assorbito", tipo: "meta", prima, dopo: finale }); } /* Santuario: il primo colpo di ogni turno fa metà */
    if (attivo(s, "baluardo")) { ira *= 2; E.push({ k: "baluardoColpo" }); E.push(carica(s, 1)); }
    if (s.elastica && cariche(s) >= 2 && vivo(s)) { const d = ctx.tira(4); s.pv -= d; E.push({ k: "elasticaColpo", d }); }
    return { annullato: !!a && finale === 0 && pieno > 0, danno: finale, ira, eventi: E };
  }
  /* un attacco del nemico che manca: Postura Salda dà 1 Carica, Drenaggio d'Urto +1 ira e 1 Carica */
  /* d20 d'attacco del nemico: Accecato e Manto d'Ombra fanno tirare 2d20 e tenere il peggiore (il manto vale per un solo attacco) */
  function tiroAttaccoNem(s, ctx) {
    s.eff = s.eff || {};
    const manto = attivo(s, "manto"); if (manto) s.eff.manto = 0;
    if (!manto && !attivo(s, "accecato")) return { d: ctx.tira(20) };
    const a = ctx.tira(20), b = ctx.tira(20);
    return { d: Math.min(a, b), tiri: [a, b] };
  }
  function colpoMancato(s, ctx) {
    const E = [];
    if (s.postura) E.push({ k: "posturaRegge" }, carica(s, 1));
    if (s.drenaggio) { if (ctx && ctx.iraPiu) ctx.iraPiu(1); E.push({ k: "ira", n: 1 }, carica(s, 1)); }
    return E;
  }
  /* inizio del tuo turno: Parata e difese dello scudo scadono; il Mare Profondo e l'Egida rilasciano l'onda */
  function inizioTurnoPg(s, ctx) {
    const E = [];
    s.parata = false; s.parataCrepe = false; s.parataPunta = false; /* la Parata vale solo fino al tuo turno successivo */
    const a = s.assorbe;
    if (a && a.onda && ctx && vivo(s)) {
      if (a.onda === "mare" && a.n > 0) {
        for (let i = 0; i < a.n && vivo(s); i++) E.push({ k: "ondaMare" }, onda(s, ctx, 1, 6));
      } else if (a.onda === "egida") {
        const n = cariche(s);
        if (n > 0) { E.push({ k: "ondaEgida", cariche: n }); E.push(onda(s, ctx, 2 * n, 6)); s.cariche = 0; }
        else E.push({ k: "ondaVuota" });
      }
    }
    s.assorbe = null; s.postura = false; s.drenaggio = false;
    s.difesaBloccata = !!s.difesaUsata; s.difesaUsata = false; /* niente difesa dello scudo due turni di fila */
    s.colpitoUltimo = !!s.colpitoOra; s.colpitoOra = false;
    return E;
  }
  /* fine del turno del nemico: gli effetti scalano di un turno; finito il sanguinamento finisce anche il marchio */
  function fineTurnoNemico(s) {
    const finiti = []; s.santColpo = false;
    Object.keys(s.eff).forEach(k => { if (s.eff[k] > 0 && --s.eff[k] === 0) finiti.push(k); });
    if (!attivo(s, "sanguina")) s.marchio = false;
    if (!attivo(s, "esposto")) s.segno = false;
    return finiti;
  }
  function tickSangue(s, ctx) { if (!attivo(s, "sanguina")) return null; const d = ctx.tira(Number(s.sangueDado) || 4); s.pv -= d; return { k: "sangue", d, dado: Number(s.sangueDado) || 4 }; }

  const API = {
    SCELTE_PER_LIVELLO, CONTROLLI, TETTO_BOSS, CREPE_MAX, CREPE_MAX_BOSS, PER_SCONTRO, CRIT_MIN, CARICHE_MAX, ASSORBITI_TSUNAMI,
    crescitaIra, iraMax, iraPerColpo, slotTecniche, sceltaValida, sceltaPredefinita,
    attivo, marchiato, segnato, sogliaCrit, metti, sanguina, guardia, colpo, ts, costo, usa,
    crepe, crepeMax, crepePiene, incrina, malusCA, frattura, perScontro,
    SIGILLI_MAX, SIGILLI_MAX_BOSS, sigilliMax, sigilli, incidi,
    cariche, carica, disponibile, difesaDiFila, presaBloccata, fortezza, onda,
    modAttaccoNem, critNemPossibile, tiroAttaccoNem, colpoSubito, colpoMancato, inizioTurnoPg, fineTurnoNemico, tickSangue
  };
  root.Combattimento = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof window !== "undefined" ? window : globalThis);
