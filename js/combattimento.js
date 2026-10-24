/* =====================================================================
   COMBATTIMENTO — regole delle tecniche del Guerriero, senza interfaccia.
   Lo usano gioco.html, la sala di prova (tutorial.html?prova) e i test (tests/combattimento.test.js):
   una regola cambiata qui cambia ovunque, e i test provano lo stesso codice che gira in partita.

   Uso: Combattimento.usa(tecnica, s, ctx) → { eventi, costo } dove
     s   = stato dello scontro: { pv, pvMax, eff: {}, effMax: {}, sangueDado, prossimo, marchio, sconto, parata, parataCrepe, parataPunta, guardiaVal, crepe, sigillo, segno }
     ctx = ambiente: { tira(d), liv, modAtt, modDanno, dado, ca(), boss, haArma, cd, modTs,
                       curaPg(n), iraPiu(n), usataPerRiposo(id), segnaPerRiposo(id) }
   Gli eventi sono dati ({ k: "colpo", … }): i testi li scrive chi li mostra.
   ===================================================================== */
(function (root) {
  /* ---------- Ira, slot, recupero ---------- */
  const R = root.Regole || {};
  const SCELTE_PER_LIVELLO = R.TECNICHE_PER_LIVELLO || [2, 2, 1, 1, 1]; /* tecniche da scegliere a ogni livello (1..5) */
  const IRA_PER_COLPO = R.IRA_PER_COLPO || [1, 1, 2, 2, 3];              /* ira per colpo subito, per livello */
  const CONTROLLI = ["frastornato", "bloccato", "silenzio"]; /* i boss non li subiscono mai */
  const TETTO_BOSS = { debole: 2, sbilanciato: 2, esposto: 2 }; /* durata massima sui boss */
  const CREPE_MAX = 3, CREPE_MAX_BOSS = 2;             /* Incrinatura: cariche massime (comuni / boss) */
  const PER_SCONTRO = 99;                              /* durata «per tutto lo scontro» (Frattura della Sentenza e del Martello) */
  const CRIT_MIN = 18;                                 /* tetto dell'intervallo di critico: mai sotto 18-20 */

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
  /* malus alla CA del nemico: Sbilanciato (−2) più le cariche di Incrinatura (al massimo −5, −4 su un boss) */
  const malusCA = (s) => (attivo(s, "sbilanciato") ? 2 : 0) + crepe(s);
  /* Frattura: 1d4 al nemico ogni volta che attacca (anche Presa e Soffio), prima del tiro. Non scatta se è stordito, perché non attacca */
  function frattura(s, ctx) { if (!attivo(s, "frattura")) return null; const d = ctx.tira(4); s.pv -= d; return { k: "frattura", d }; }
  const perScontro = (n) => n >= PER_SCONTRO;
  function guardia(s, val, turni) { /* +val alla CA del personaggio */
    s.guardiaVal = attivo(s, "guardia") ? Math.max(Number(s.guardiaVal) || 0, val) : val;
    s.eff.guardia = Math.max(s.eff.guardia || 0, turni);
    s.effMax = s.effMax || {}; s.effMax.guardia = Math.max(s.effMax.guardia || 0, s.eff.guardia);
    return { k: "guardia", val: s.guardiaVal, turni: s.eff.guardia };
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
      /* ---- scudo (invariate) ---- */
      case "carica": r = hit({ dado: 4 }); if (r.ok && vivo(s) && conTSn({ silenzio: 1 })) { s.soffioPronto = false; E.push({ k: "soffioPerso" }); } break;
      case "schiaffo": r = hit({ dado: 4 }); if (r.ok && vivo(s)) conTSn({ bloccato: 1 }); break;
      case "frontale": E.push(guardia(s, 3, 1)); break;
      case "balzo": r = hit({ dado: 6 }); if (r.ok && vivo(s)) conTSn({ sbilanciato: 1, debole: 1 }); break;
      case "scagliata": hit({ bonus: 2, dado: 8 }); break;
      case "guardia": hit({ dado: 4 }); E.push(guardia(s, 2, 1)); break;
      default: E.push({ k: "sconosciuta" });
    }
    return { eventi: E, costo: c };
  }

  /* ---------- Turno del nemico: modificatori, parata, ira ---------- */
  const modAttaccoNem = (s) => (attivo(s, "debole") ? -2 : 0) + (attivo(s, "frastornato") ? -4 : 0);
  const critNemPossibile = (s) => !attivo(s, "frastornato") && !attivo(s, "intontito"); /* Intontito: Percossa al Mento */
  /* un attacco del nemico che va a segno: la Parata (o il Contro-Schiacciamento) lo annulla e contrattacca; altrimenti cresce l'ira */
  function colpoSubito(s, ctx, crit) {
    if (s.parata) {
      const conCrepe = !!s.parataCrepe, conPunta = !!s.parataPunta; s.parata = false; s.parataCrepe = false; s.parataPunta = false;
      const E = [{ k: "parataRiuscita" }], dado = ctx.dado;
      /* Guardia di Punta: il contrattacco è critico con 18-20 (d20 tirato solo per il critico) */
      let crit = false, dCrit = null;
      if (conPunta) { dCrit = ctx.tira(20); crit = dCrit >= CRIT_MIN; }
      const tiri = tiraDadi(ctx, crit ? 2 : 1, dado), danno = Math.max(1, somma(tiri) + ctx.modDanno);
      s.pv -= danno; E.push({ k: "contrattacco", dado, tiri, mm: ctx.modDanno, danno, ...(conPunta ? { dCrit, crit } : {}) });
      if (vivo(s)) E.push(conPunta ? metti(s, ctx, "esposto", 2) : conCrepe ? incrina(s, ctx, 1) : sanguina(s, ctx, 4, 2));
      return { annullato: true, ira: 0, eventi: E };
    }
    return { annullato: false, ira: iraPerColpo(ctx.liv, crit), eventi: [] };
  }
  const inizioTurnoPg = (s) => { s.parata = false; s.parataCrepe = false; s.parataPunta = false; }; /* la Parata vale solo fino al tuo turno successivo */
  /* fine del turno del nemico: gli effetti scalano di un turno; finito il sanguinamento finisce anche il marchio */
  function fineTurnoNemico(s) {
    const finiti = [];
    Object.keys(s.eff).forEach(k => { if (s.eff[k] > 0 && --s.eff[k] === 0) finiti.push(k); });
    if (!attivo(s, "sanguina")) s.marchio = false;
    if (!attivo(s, "esposto")) s.segno = false;
    return finiti;
  }
  function tickSangue(s, ctx) { if (!attivo(s, "sanguina")) return null; const d = ctx.tira(Number(s.sangueDado) || 4); s.pv -= d; return { k: "sangue", d, dado: Number(s.sangueDado) || 4 }; }

  const API = {
    SCELTE_PER_LIVELLO, CONTROLLI, TETTO_BOSS, CREPE_MAX, CREPE_MAX_BOSS, PER_SCONTRO, CRIT_MIN,
    crescitaIra, iraMax, iraPerColpo, slotTecniche, sceltaValida, sceltaPredefinita,
    attivo, marchiato, segnato, sogliaCrit, metti, sanguina, guardia, colpo, ts, costo, usa,
    crepe, crepeMax, crepePiene, incrina, malusCA, frattura, perScontro,
    modAttaccoNem, critNemPossibile, colpoSubito, inizioTurnoPg, fineTurnoNemico, tickSangue
  };
  root.Combattimento = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof window !== "undefined" ? window : globalThis);
