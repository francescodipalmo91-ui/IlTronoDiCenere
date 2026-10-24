/* =====================================================================
   COMBATTIMENTO — regole delle tecniche del Guerriero, senza interfaccia.
   Lo usano gioco.html, la sala di prova (tutorial.html?prova) e i test (tests/combattimento.test.js):
   una regola cambiata qui cambia ovunque, e i test provano lo stesso codice che gira in partita.

   Uso: Combattimento.usa(tecnica, s, ctx) → { eventi, costo } dove
     s   = stato dello scontro: { pv, pvMax, eff: {}, effMax: {}, sangueDado, prossimo, marchio, sconto, parata, guardiaVal }
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
  const TETTO_BOSS = { debole: 2, sbilanciato: 2 };    /* durata massima sui boss */

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
    let crit = d >= (o.critDa || 20), ok = crit || tot > ca;
    if (ok && o.sempreCrit) crit = true;
    const ev = { k: "colpo", d, mA, tot, ca, crit, ok, danno: 0 };
    if (ok) {
      const dado = o.dado || ctx.dado, nd = (crit ? 2 : 1) * (1 + (o.piuDadi || 0) + (pre.piuDadi || 0)), tiri = tiraDadi(ctx, nd, dado), mm = o.conMod === false ? 0 : ctx.modDanno;
      let danno = Math.max(1, somma(tiri) + mm);
      Object.assign(ev, { nd, dado, tiri, mm });
      if (o.base && marchiato(s)) { const x = ctx.tira(4); danno += x; ev.marchio = x; }
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
        E.push(guardia(s, 2, 3)); s.eff.incrollabile = Math.max(s.eff.incrollabile || 0, 3); s.effMax.incrollabile = Math.max(s.effMax.incrollabile || 0, 3); E.push({ k: "incrollabile", turni: 3 });
        break;

      /* ---- contundenti (invariate) ---- */
      case "spezzatendini": r = hit({ conMod: false }); if (r.ok && vivo(s)) conTSn({ silenzio: 2 }); break;
      case "schiacciaossa": r = hit(); if (r.ok && vivo(s)) conTSn({ debole: 2 }); break;
      case "clava": r = hit(); if (r.ok) fx("sbilanciato", 1); break;
      case "frantumaelmo": r = hit(); if (r.ok && vivo(s)) conTSn({ frastornato: 1 }); break;
      case "contusione": r = hit(); if (r.ok && vivo(s)) conTSn({ silenzio: 2 }); break;
      case "rimbalzo": hit({ piuDadi: ctx.ca() >= 13 ? 2 : 1 }); break;
      /* ---- perforanti (invariate) ---- */
      case "cuore": hit({ bonus: 2, critDa: 19 }); break;
      case "plesso": r = hit(); if (r.ok && vivo(s)) conTSn({ silenzio: 1 }); break;
      case "spillo": r = hit({ conMod: false }); if (r.ok) { s.prossimo = { bonus: 2 }; E.push({ k: "prossimo", bonus: 2 }); } break;
      case "giuntura": r = hit(); if (r.ok) { s.prossimo = { piuDadi: 1 }; E.push({ k: "prossimo", piuDadi: 1 }); } break;
      case "zanzara": for (let i = 0; i < 4 && vivo(s); i++) { const z = hit({ bonus: -2, dado: 4, conMod: false }); if (z.ok) { if (ctx.iraPiu) ctx.iraPiu(1); E.push({ k: "ira", n: 1 }); } } break;
      case "stoccata_lat": r = hit(); if (r.ok) sang(4, 2); break;
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
  const critNemPossibile = (s) => !attivo(s, "frastornato");
  /* un attacco del nemico che va a segno: la Parata lo annulla e contrattacca; altrimenti cresce l'ira */
  function colpoSubito(s, ctx, crit) {
    if (s.parata) {
      s.parata = false;
      const E = [{ k: "parataRiuscita" }], dado = ctx.dado, tiri = tiraDadi(ctx, 1, dado), danno = Math.max(1, somma(tiri) + ctx.modDanno);
      s.pv -= danno; E.push({ k: "contrattacco", dado, tiri, mm: ctx.modDanno, danno });
      if (vivo(s)) E.push(sanguina(s, ctx, 4, 2));
      return { annullato: true, ira: 0, eventi: E };
    }
    return { annullato: false, ira: iraPerColpo(ctx.liv, crit), eventi: [] };
  }
  const inizioTurnoPg = (s) => { s.parata = false; }; /* la Parata vale solo fino al tuo turno successivo */
  /* fine del turno del nemico: gli effetti scalano di un turno; finito il sanguinamento finisce anche il marchio */
  function fineTurnoNemico(s) {
    const finiti = [];
    Object.keys(s.eff).forEach(k => { if (s.eff[k] > 0 && --s.eff[k] === 0) finiti.push(k); });
    if (!attivo(s, "sanguina")) s.marchio = false;
    return finiti;
  }
  function tickSangue(s, ctx) { if (!attivo(s, "sanguina")) return null; const d = ctx.tira(Number(s.sangueDado) || 4); s.pv -= d; return { k: "sangue", d, dado: Number(s.sangueDado) || 4 }; }

  const API = {
    SCELTE_PER_LIVELLO, CONTROLLI, TETTO_BOSS,
    crescitaIra, iraMax, iraPerColpo, slotTecniche, sceltaValida, sceltaPredefinita,
    attivo, marchiato, metti, sanguina, guardia, colpo, ts, costo, usa,
    modAttaccoNem, critNemPossibile, colpoSubito, inizioTurnoPg, fineTurnoNemico, tickSangue
  };
  root.Combattimento = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof window !== "undefined" ? window : globalThis);
