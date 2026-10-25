/* =====================================================================
   MAGIA IN COMBATTIMENTO — gli incantesimi dell'Arcanista (Arcano e Forza), senza interfaccia.
   Lo usano gioco.html, la sala di prova (tutorial.html?prova) e i test (tests/magia_combattimento.test.js).
   Stessa filosofia di js/combattimento.js: i dati sono in js/magia.js, le regole stanno qui, i testi li mostra chi disegna.

   Uso: MagiaCombattimento.lancia(inc, s, ctx) → { eventi, costo, rifiutata? }
     inc = voce di MAGIA.INCANTESIMI o MAGIA.VIE
     s   = stato dello scontro (lo stesso di Combattimento): pv, pvMax, eff, effMax, sigilli, assorbe, difesaUsata, difesaBloccata, svelata, soffioPronto…
     ctx = ambiente: { tira(d), liv, modAtt (mod Mente), ca(), boss, cd (8 + Mente + livello), modTs (mod Vigore del nemico),
                       manaPiu(n) → recuperato, dannoMente(n), usataPerRiposo(id), segnaPerRiposo(id) }
   Il Monaco (Luce e Ombra, punti fede, Spirito) usa lo stesso motore: la Bilancia va da Luce 3 (+3) a Ombra 3 (−3), parte da 0 a ogni scontro e
   ogni incantesimo di Luce/Ombra la sposta di 1 (Aureola, Velo, Zenit, Nadir, Crepuscolo: vedi lancia()).
   Regole (docs/incantesimi_arcanista_monaco.md):
   - attacco magico = d20 + mod Mente contro la CA; i dadi del danno non aggiungono il modificatore; critico = doppio dei dadi
   - tiro salvezza del nemico: d20 + suo Vigore contro 8 + Mente + livello; i boss ignorano i controlli e usano il ripiego del testo
   - Sigilli (Arcano): massimo 3, 2 sui boss, per tutto lo scontro
   - Detonazione (Forza): consuma tutti i Sigilli, +1d6 per Sigillo; recupero di mana per Detonazione = 1/1/2/2/3 per livello,
     doppio se si consuma il massimo dei Sigilli; senza Sigilli non c'è niente da far esplodere (né danno né recupero)
   - un critico con un incantesimo di Forza incide 1 Sigillo (dopo l'eventuale Detonazione)
   - le difese che consumano l'azione non si usano due turni di fila
   ===================================================================== */
(function (root) {
  const C = root.Combattimento || (typeof require === "function" ? require("./combattimento.js") : null);
  const R = root.Regole || {};
  const RECUPERO = R.IRA_PER_COLPO || [1, 1, 2, 2, 3];
  const UNA_PER_RIPOSO = ["parola_vera", "singolarita", "invulnerabilita", "alba_eterna", "notte_senza_fine"];
  const DIFESE = ["specchio_rune", "barriera_cinetica", "respingere", "santuario"];       /* consumano l'azione: mai due turni di fila */
  const SERVONO_SIGILLI = ["implosione", "singolarita", "crollo_arcano"];     /* senza Sigilli non hanno niente da consumare */

  const tiraDadi = (ctx, n, d) => Array.from({ length: n }, () => ctx.tira(d));
  const somma = (a) => a.reduce((x, y) => x + y, 0);
  const recupero = (liv) => RECUPERO[Math.max(1, Math.min(5, Number(liv) || 1)) - 1];
  const attivo = (s, k) => !!(s && s.eff && s.eff[k] > 0);

  /* costo reale adesso: Tomo Proibito −2 (minimo 1) e Ricamo di Rune −2 sul prossimo; Quiete Assoluta: un Sigillo al posto del mana */
  function costo(inc, s) {
    const arc = inc.scuola === "arcano";
    let c = Number(inc.costo) || 0;
    if (arc && attivo(s, "tomo")) c = Math.max(1, c - 2);
    if (s && s.scontoInc) c = Math.max(1, c - s.scontoInc);
    if (arc && attivo(s, "quiete") && C.sigilli(s) > 0) c = 0;
    if (inc.scuola === "ombra" && attivo(s, "notte")) c = Math.max(1, c - 2); /* Notte Senza Fine */
    return c;
  }
  /* si può lanciare adesso? (prima di spendere il mana) */
  function disponibile(inc, s, ctx) {
    if (UNA_PER_RIPOSO.includes(inc.id) && ctx && ctx.usataPerRiposo && ctx.usataPerRiposo(inc.id)) return { ok: false, motivo: "giaUsataRiposo" };
    if (DIFESE.includes(inc.id) && s && s.difesaBloccata) return { ok: false, motivo: "difesaDiFila" };
    if (inc.id === "seconda_vita" && s && s.secondaUsata) return { ok: false, motivo: "giaUsataScontro" };
    if (SERVONO_SIGILLI.includes(inc.id) && C.sigilli(s) < 1) return { ok: false, motivo: "senzaSigilli" };
    return { ok: true };
  }

  function lancia(inc, s, ctx) {
    s.eff = s.eff || {}; s.effMax = s.effMax || {};
    const disp = disponibile(inc, s, ctx);
    if (!disp.ok) return { eventi: [{ k: disp.motivo }], costo: 0, rifiutata: true };
    const E = [], arc = inc.scuola === "arcano", forza = inc.scuola === "forza";
    const c = costo(inc, s), tomoAttivo = arc && attivo(s, "tomo");
    /* ---- Monaco: la Bilancia (+ Luce, − Ombra) ---- */
    const luce = inc.scuola === "luce", ombra = inc.scuola === "ombra", mon = luce || ombra;
    const bil = Number(s.bilancia) || 0, bloccata = attivo(s, "furia");
    const crep = mon && !bloccata && ((ombra && bil === 3) || (luce && bil === -3));   /* Zenit / Nadir: l'incantesimo opposto è un Crepuscolo */
    const velo = ombra && bil <= -2, nadir = ombra && bil === -3 && !s.lutto, aureola = mon && bil >= 2;
    const piu = crep ? 1 : 0;                                                          /* +1 dado di danno o cura */
    const piuD = piu + (velo ? 1 : 0) + (ombra && attivo(s, "furia") ? 1 : 0);          /* sul danno: anche Velo e Furia Cinerea */
    const pv0 = s.pv;
    let segno = false;                                                                  /* l'incantesimo è andato a segno (Ombra Gemella) */
    const occhio = attivo(s, "occhio");
    let crits = 0, rimborso = false;

    if (s.scontoInc) { E.push({ k: "scontoInc", n: Number(inc.costo) - c }); s.scontoInc = 0; }
    if (arc && attivo(s, "quiete") && c === 0 && Number(inc.costo) > 0) { s.sigilli = C.sigilli(s) - 1; E.push({ k: "quieteSigillo", tot: s.sigilli }); }
    if (DIFESE.includes(inc.id)) s.difesaUsata = true;
    if (UNA_PER_RIPOSO.includes(inc.id) && ctx.segnaPerRiposo) ctx.segnaPerRiposo(inc.id);

    /* ---- strumenti ---- */
    const sigMax = C.sigilliMax(ctx);
    const ink = (n) => { const e = C.incidi(s, ctx, n); E.push(e); return e; };
    const fx = (k, n) => E.push(C.metti(s, ctx, k, n));
    const vivo = () => s.pv > 0;
    const hit = (o) => {
      const r = C.colpo(s, ctx, { conMod: false, ...o, critDa: (o && o.critDa) || (occhio ? 19 : undefined) });
      E.push(r); if (r.crit) crits++; return r;
    };
    /* tiro salvezza: la Parola Vera toglie 4 ai tiri del nemico */
    const salva = () => C.ts({ ...ctx, modTs: ctx.modTs - (attivo(s, "parola") ? 4 : 0) - (attivo(s, "paura") ? 2 : 0) });
    /* effetti con tiro salvezza; sui boss i controlli non si tirano nemmeno (e si usa il ripiego) */
    const conTS = (mappa) => {
      const stati = Object.keys(mappa);
      const z = salva(); E.push(z);
      if (z.ok) { E.push({ k: "resiste" }); return false; }
      stati.forEach(k => fx(k, mappa[k])); return true;
    };
    const controlloORipiego = (mappa, ripiego) => {
      if (ctx.boss && Object.keys(mappa).every(k => C.CONTROLLI.includes(k))) { Object.keys(mappa).forEach(k => E.push({ k: "immune", s: k })); ripiego(); return false; }
      return conTS(mappa);
    };
    const diretto = (n, dado, extra) => { /* danno senza tiro per colpire */
      const tiri = tiraDadi(ctx, n, dado), danno = Math.max(1, somma(tiri) + (extra || 0));
      s.pv -= danno; E.push({ k: "diretto", n, dado, tiri, mm: extra || 0, danno }); return danno;
    };
    const recuperaMana = (mana) => (ctx.manaPiu ? ctx.manaPiu(mana) : mana);
    /* Detonazione: consuma tutti i Sigilli, +dado per Sigillo, recupero della tabella (doppio con il massimo) */
    const detona = (o) => {
      o = o || {};
      const n = C.sigilli(s);
      if (n < 1) { E.push({ k: "detonaVuota" }); return 0; }
      const dado = o.dado || 6, tiri = tiraDadi(ctx, n, dado), bonus = somma(tiri), max = n >= sigMax;
      s.pv -= bonus; s.sigilli = 0;
      const mana = recuperaMana(recupero(ctx.liv) * (max || o.doppia ? 2 : 1));
      E.push({ k: "detona", n, dado, tiri, bonus, max, mana });
      if (s.demolitore) fx("sbilanciato", 1);
      return n;
    };
    const dopoColpo = (r, fn) => { if (r.ok) { segno = true; fn(); } return r; };
    /* ---- strumenti del Monaco ---- */
    const dannoMente = (n) => (ctx.dannoMente ? ctx.dannoMente(n) : n);
    const fede = (n) => recuperaMana(n);
    const guarisci = (n, dado, bonus, extra) => { /* cura n dadi + bonus (+2 con l'Aureola) */
      const tiri = tiraDadi(ctx, n + piu, dado), tot = Math.max(1, somma(tiri) + (bonus || 0) + (aureola ? 2 : 0) + (extra || 0));
      const mancano = ctx.pvMancanti ? ctx.pvMancanti() : tot, fatto = ctx.cura ? ctx.cura(tot) : tot;
      E.push({ k: "guarigione", n: n + piu, dado, tiri, mm: (bonus || 0) + (aureola ? 2 : 0) + (extra || 0), tot, fatto }); return { tot, fatto, eccesso: Math.max(0, tot - mancano) };
    };
    const curaFissa = (tot) => { const fatto = ctx.cura ? ctx.cura(tot) : tot; E.push({ k: "guarigione", n: 0, dado: 0, tiri: [], mm: 0, tot, fatto }); return fatto; };
    const dannoSpirito = (n, dado) => diretto(n + piuD, dado, 0);
    const avvizzisci = (dado, turni) => { /* Avvizzito: 1d4 (1d6 dove indicato) all'inizio del turno del nemico */
      const gia = attivo(s, "avvizzito");
      s.avvizzitoDado = gia ? Math.max(Number(s.avvizzitoDado) || 4, dado) : dado;
      const e = C.metti(s, ctx, "avvizzito", turni); e.dado = s.avvizzitoDado; E.push(e);
    };

    switch (inc.id) {
      /* ================= Arcano ================= */
      case "dardo_arcano": dopoColpo(hit({ dado: 8 }), () => ink(1)); break;
      case "scopri_carte": s.svelata = true; E.push({ k: "svelata" }); ink(1); break;
      case "runa_arma": s.eff.runa = 3; s.effMax.runa = 3; E.push({ k: "runa", turni: 3 }); break;
      case "marchio_arcano": conTS({ esposto: 2 }); ink(1); break;
      case "stasi": controlloORipiego({ bloccato: 1 }, () => ink(2)); break;
      case "specchio_rune": s.assorbe = { tipo: "specchio", n: 0 }; E.push({ k: "difesaPronta", tipo: "specchio" }); break;
      case "catena_glifi": dopoColpo(hit({ dado: 6, piuDadi: 1 }), () => ink(2)); break;
      case "sigillo_silenzio": controlloORipiego({ silenzio: 2 }, () => fx("debole", 2)); ink(1); break;
      case "disfare": s.soffioPronto = false; s.presaUsata = true; E.push({ k: "disfatto" }); ink(1); break;
      case "risonanza": {
        const n = C.sigilli(s), r = hit({ dado: 8, piuDadi: 1 });
        if (r.ok && n > 0) { const tiri = tiraDadi(ctx, n * (r.crit ? 2 : 1), 8), danno = somma(tiri); s.pv -= danno; E.push({ k: "risonanza", n, tiri, danno }); }
        break;
      }
      case "prigione_rune": controlloORipiego({ bloccato: 2 }, () => { fx("sbilanciato", 2); ink(1); }); break;
      case "occhio_tomo": s.eff.occhio = 3; s.effMax.occhio = 3; E.push({ k: "occhio", turni: 3 }); break;
      case "parola_vera": {
        diretto(4, 8, 0);
        s.eff.parola = 2; s.effMax.parola = 2; E.push({ k: "parola", turni: 2 });
        break;
      }
      case "tomo_proibito": {
        s.eff.tomo = 3; s.effMax.tomo = 3;
        const d = ctx.dannoMente ? ctx.dannoMente(1) : 1;
        E.push({ k: "tomo", turni: 3, mente: d });
        break;
      }
      case "sigillo_assoluto": {
        ink(sigMax);
        controlloORipiego({ bloccato: 2 }, () => { fx("debole", 2); fx("sbilanciato", 2); });
        break;
      }

      /* ================= Forza ================= */
      case "pugno_forza": dopoColpo(hit({ dado: 10 }), () => detona()); break;
      case "spinta": diretto(1, 6, 0); conTS({ sbilanciato: 1 }); detona(); break;
      case "scudo": s.eff.scudo = 2; s.effMax.scudo = 2; E.push({ k: "scudoMagico", turni: 2 }); break;
      case "ariete": dopoColpo(hit({ dado: 6, piuDadi: 1 }), () => { fx("sbilanciato", 2); detona(); }); break;
      case "onda_urto": {
        diretto(2, 4, 0);
        const z = salva(); E.push(z);
        if (z.ok) E.push({ k: "resiste" }); else { s.soffioPronto = false; E.push({ k: "soffioPerso" }); }
        detona();
        break;
      }
      case "barriera_cinetica": s.assorbe = { tipo: "barriera", n: 0 }; E.push({ k: "difesaPronta", tipo: "barriera" }); break;
      case "implosione": {
        const n = C.sigilli(s), tiri = tiraDadi(ctx, 2 * n, 6), danno = somma(tiri);
        s.pv -= danno; s.sigilli = 0;
        const mana = recuperaMana(recupero(ctx.liv) * (n >= sigMax ? 2 : 1));
        E.push({ k: "consumo", n, nd: 2, dado: 6, tiri, mm: 0, danno, mana });
        if (s.demolitore) fx("sbilanciato", 1);
        break;
      }
      case "pressione": if (conTS({ debole: 2, pressione: 2 })) { /* gli stati sono già applicati */ } detona(); break;
      case "muro_forza": s.eff.muro = 2; s.effMax.muro = 2; E.push({ k: "muro", turni: 2 }); break;
      case "maglio_invisibile": dopoColpo(hit({ dado: 8, piuDadi: 2, critDa: 19 }), () => detona()); break;
      case "gravita": {
        if (ctx.boss) { E.push({ k: "immune", s: "bloccato" }); fx("sbilanciato", 2); fx("debole", 1); }
        else conTS({ bloccato: 1, sbilanciato: 2 });
        break;
      }
      case "respingere": s.assorbe = { tipo: "respingere", n: 0 }; E.push({ k: "difesaPronta", tipo: "respingere" }); break;
      case "singolarita": {
        const n = C.sigilli(s), tiri = tiraDadi(ctx, 3 * n, 6), danno = Math.max(1, somma(tiri) + ctx.modAtt);
        s.pv -= danno; s.sigilli = 0;
        const mana = recuperaMana(recupero(ctx.liv) * 2);
        E.push({ k: "consumo", n, nd: 3, dado: 6, tiri, mm: ctx.modAtt, danno, mana });
        if (s.demolitore) fx("sbilanciato", 1);
        break;
      }
      case "invulnerabilita": s.eff.invuln = 1; s.effMax.invuln = 1; E.push({ k: "invuln" }); break;
      case "cataclisma": {
        let consumati = 0, bonus = 0;
        for (let i = 0; i < 3 && vivo(); i++) {
          const r = hit({ dado: 8 });
          if (r.ok && C.sigilli(s) > 0) { const t = ctx.tira(6); s.sigilli -= 1; consumati++; bonus += t; s.pv -= t; E.push({ k: "detonaUno", d: t, restano: s.sigilli }); }
        }
        if (consumati > 0) {
          const mana = recuperaMana(recupero(ctx.liv) * (consumati >= sigMax ? 2 : 1));
          E.push({ k: "detonaTotale", n: consumati, bonus, mana });
          if (s.demolitore) fx("sbilanciato", 1);
        }
        break;
      }

      /* ================= Via Frattura (Aldo): Forza ================= */
      case "colpo_demolitore": dopoColpo(hit({ dado: 8, piuDadi: 1 }), () => { s.demolitore = true; E.push({ k: "demolitore" }); detona({ dado: 8 }); }); break;
      case "spezzare_vincolo": if (conTS({ debole: 3 })) { s.caMeno = 2; E.push({ k: "caMeno", n: 2 }); } break;
      case "crollo_arcano": {
        const n = C.sigilli(s), tiri = tiraDadi(ctx, 2 * n, 10), danno = somma(tiri);
        s.pv -= danno; s.sigilli = 0;
        E.push({ k: "consumo", n, nd: 2, dado: 10, tiri, mm: 0, danno, mana: 0 });
        if (s.pv <= 0) { const m = recuperaMana(Number(inc.costo) || 0); rimborso = true; E.push({ k: "rimborso", mana: m }); }
        break;
      }

      /* ================= Via Sutura (Guendalina): Arcano ================= */
      case "filo_rune": ink(2); s.filo = true; E.push({ k: "filo" }); break;
      case "ricamo_rune":
        if (ctx.boss) { E.push({ k: "immune", s: "silenzio" }); fx("debole", 2); fx("esposto", 2); } /* sui boss niente tiro: Indebolito ed Esposto */
        else conTS({ silenzio: 2, esposto: 2 });
        s.scontoInc = 2; E.push({ k: "prossimoSconto", n: 2 });
        break;
      case "quiete_assoluta": s.eff.quiete = 3; s.effMax.quiete = 3; E.push({ k: "quiete", turni: 3 }); break;

      /* ================= Luce ================= */
      case "dardo_luce": { const r = hit({ dado: 8, piuDadi: piu }); if (r.ok) { segno = true; if (r.crit && vivo()) fx("accecato", 1); } break; }
      case "tocco_lenitivo": guarisci(1, 8, ctx.modAtt); break;
      case "scudo_fede": s.eff.scudo = 2; s.effMax.scudo = 2; E.push({ k: "scudoMagico", turni: 2 }); break;
      case "accecare": if (conTS({ accecato: 2 })) segno = true; break;
      case "folgore_sacra": {
        const r = hit({ dado: 6, piuDadi: 1 + piu });
        if (r.ok) { segno = true; if (vivo()) { if (ctx.boss) diretto(1, 6, 0); else conTS({ frastornato: 1 }); } }
        break;
      }
      case "voto_luce": s.eff.voto = 3; s.effMax.voto = 3; E.push({ k: "voto", turni: 3 }); break;
      case "raggio_mattino": {
        const tiri = tiraDadi(ctx, 2 + piu, 8), pieno = somma(tiri), z = salva(); E.push(z);
        const danno = Math.max(1, z.ok ? Math.floor(pieno / 2) : pieno); s.pv -= danno; segno = true;
        E.push({ k: "diretto", n: 2 + piu, dado: 8, tiri, mm: 0, danno, meta: z.ok }); break;
      }
      case "santuario": s.eff.santuario = 2; s.effMax.santuario = 2; s.santColpo = false; E.push({ k: "santuario", turni: 2 }); break;
      case "purificazione": s.presaUsata = true; E.push({ k: "liberato" }); guarisci(1, 6, 0); break;
      case "lancia_sole": { const r = hit({ dado: 8, piuDadi: 2 + piu }); if (r.ok) { segno = true; if (vivo()) conTS({ accecato: 2 }); } break; }
      case "corona_raggi": s.eff.corona = 3; s.effMax.corona = 3; E.push({ k: "corona", turni: 3 }); break;
      case "grazia": guarisci(2, 8, ctx.modAtt); s.eff.scudo = 2; s.effMax.scudo = 2; E.push({ k: "scudoMagico", turni: 2 }); break;
      case "alba_eterna": {
        diretto(4 + piu, 8, 0); segno = true; fx("accecato", 2);
        curaFissa(Math.floor((pv0 - s.pv) / 2)); break;
      }
      case "seconda_vita": s.eff.seconda = C.PER_SCONTRO; s.effMax.seconda = C.PER_SCONTRO; s.secondaUsata = true; E.push({ k: "seconda" }); break;
      case "giudizio": {
        const l = Math.max(0, bil), r = hit({ dado: 10, piuDadi: 1 + piu + l });
        if (r.ok) segno = true;
        E.push({ k: "giudizio", luce: l }); break; /* la Bilancia torna a 0 dopo l'incantesimo */
      }
      case "fiamma_calda": guarisci(2, 6, ctx.modAtt); s.eff.fiamma = 2; s.effMax.fiamma = 2; E.push({ k: "fiamma", turni: 2 }); break;
      case "cerchio_focolare": s.eff.cerchio = 3; s.effMax.cerchio = 3; E.push({ k: "cerchio", turni: 3 }); break;
      case "fuoco_cura": {
        const g = guarisci(4, 8, ctx.modAtt);
        if (g.eccesso > 0) { s.pv -= g.eccesso; segno = true; E.push({ k: "eccesso", n: g.eccesso }); }
        break;
      }

      /* ================= Ombra ================= */
      case "tocco_avvizzente": dopoColpo(hit({ dado: 6, piuDadi: piuD }), () => {}); break;
      case "sussurro_paura": controlloORipiego({ silenzio: 1 }, () => fx("debole", 1)); break;
      case "manto_ombra": s.eff.manto = 1; s.effMax.manto = 1; E.push({ k: "manto" }); break;
      case "avvizzire": if (conTS({})) { /* il tiro è fallito */ } else break; avvizzisci(4, 3); segno = true; break;
      case "sete_tenebra": dopoColpo(hit({ dado: 6, piuDadi: 1 + piuD }), () => E.push({ k: "fede", n: fede(1) })); break;
      case "catene_ombra": controlloORipiego({ bloccato: 1 }, () => fx("sbilanciato", 2)); break;
      case "divorare": {
        const avv = attivo(s, "avvizzito"), r = hit({ dado: 8, piuDadi: 1 + piuD });
        if (r.ok && avv && attivo(s, "avvizzito")) {
          const n = s.eff.avvizzito, dado = Number(s.avvizzitoDado) || 4, tiri = tiraDadi(ctx, n, dado), tot = somma(tiri);
          s.pv -= tot; s.eff.avvizzito = 0; E.push({ k: "divora", n, dado, tiri, tot }); curaFissa(tot);
        }
        break;
      }
      case "patto_ombra": {
        const d = ctx.tira(4), f = ctx.dannoCorpo ? ctx.dannoCorpo(d) : d, r = fede(ctx.tira(4) + ctx.liv);
        E.push({ k: "patto", d: f, fede: r }); break;
      }
      case "eclisse": if (conTS({ accecato: 2, debole: 2 })) segno = true; break;
      case "ombra_gemella": s.eff.gemella = 3; s.effMax.gemella = 3; E.push({ k: "gemella", turni: 3 }); break;
      case "terrore": {
        if (ctx.boss) { E.push({ k: "immune", s: "frastornato" }); fx("debole", 2); fx("paura", 2); }
        else if (conTS({ frastornato: 2 })) segno = true;
        break;
      }
      case "mietitura": {
        dannoSpirito(3, 6); segno = true;
        if (s.pv < s.pvMax / 2) E.push({ k: "fede", n: fede(2) });
        break;
      }
      case "notte_senza_fine": {
        fx("accecato", 3); avvizzisci(6, 3); segno = true;
        s.eff.notte = 3; s.effMax.notte = 3; E.push({ k: "notte", turni: 3, mente: dannoMente(ctx.tira(4)) }); break;
      }
      case "nome_taciuto": controlloORipiego({ bloccato: 2 }, () => { fx("debole", 2); fx("sbilanciato", 2); }); break;
      case "abbraccio_vuoto": dopoColpo(hit({ dado: 8, piuDadi: 3 + piuD }), () => {}); break;
      case "rancore": { const n = Math.min(3, Number(s.colpiSubiti) || 0); dopoColpo(hit({ dado: 6, piuDadi: 1 + piuD + n }), () => {}); if (n) E.push({ k: "rancore", n }); break; }
      case "lutto": s.lutto = true; if (conTS({ debole: 2 })) { avvizzisci(6, 3); segno = true; } E.push({ k: "lutto" }); break;
      case "furia_cinerea": s.eff.furia = 3; s.effMax.furia = 3; s.bilancia = -3; E.push({ k: "furia", turni: 3 }); break;

      default: E.push({ k: "sconosciuta" });
    }

    /* ---- dopo l'incantesimo del Monaco ---- */
    if (mon) {
      const inflitto = Math.max(0, pv0 - s.pv);
      if (segno && attivo(s, "gemella") && inc.id !== "ombra_gemella" && vivo()) { const d = ctx.tira(6); s.pv -= d; E.push({ k: "gemellaDanno", d }); }
      const drenato = Math.max(0, pv0 - s.pv);
      if (inc.id === "tocco_avvizzente" && drenato > 0) curaFissa(Math.floor(drenato / 2));
      else if (inc.id === "abbraccio_vuoto" && drenato > 0) curaFissa(drenato);
      else if (ombra && attivo(s, "furia") && drenato > 0 && inc.id !== "furia_cinerea") curaFissa(Math.floor(drenato / 2));
      if (nadir) E.push({ k: "nadir", mente: dannoMente(1) });
      else if (inc.id === "eclisse") E.push({ k: "nadir", mente: dannoMente(1) });
      if (crep) { const mana = fede(recupero(ctx.liv) * (luce ? 2 : 1)); E.push({ k: "crepuscolo", da: luce ? "nadir" : "zenit", dadi: piu, mana }); }
      /* la Bilancia: Crepuscolo e Giudizio la azzerano, Abbraccio del Vuoto la porta a Ombra 3, Furia Cinerea la blocca; altrimenti 1 passo */
      let nuova = bil;
      if (inc.id === "furia_cinerea") nuova = -3;
      else if (inc.id === "abbraccio_vuoto") nuova = -3;
      else if (bloccata) nuova = -3;
      else if (crep || inc.id === "giudizio") nuova = 0;
      else nuova = Math.max(-3, Math.min(3, bil + (luce ? 1 : -1)));
      s.bilancia = nuova;
      E.push({ k: "bilancia", da: bil, a: nuova });
    }
    /* Sigilli che arrivano dopo l'incantesimo: critico di Forza (1), Occhio del Tomo (2 per critico), Tomo Proibito (1 sull'Arcano) */
    const dopo = crits * ((forza ? 1 : 0) + (occhio ? 2 : 0));
    if (dopo > 0) ink(dopo);
    if (tomoAttivo && inc.id !== "tomo_proibito") ink(1);
    return { eventi: E, costo: c, rimborso };
  }

  /* inizio del turno del nemico: Pressione (1d6 forza) */
  function inizioTurnoNemico(s, ctx) {
    const E = [];
    if (attivo(s, "pressione")) { const d = ctx.tira(6); s.pv -= d; E.push({ k: "pressioneTick", d }); }
    if (attivo(s, "corona")) { const d = ctx.tira(6); s.pv -= d; E.push({ k: "coronaTick", d }); }
    if (attivo(s, "avvizzito")) { const dado = Number(s.avvizzitoDado) || 4, d = ctx.tira(dado); s.pv -= d; E.push({ k: "avvizzitoTick", d, dado }); }
    return E;
  }
  const haTick = (s) => attivo(s, "pressione") || attivo(s, "corona") || attivo(s, "avvizzito");
  /* bonus ai tuoi tiri salvezza (Soffio): Aureola +1, Cerchio del Focolare +2 */
  const bonusTsPg = (s) => ((Number(s && s.bilancia) || 0) >= 2 ? 1 : 0) + (attivo(s, "cerchio") ? 2 : 0);
  /* Seconda Vita: il primo colpo che ti porterebbe a 0 ti lascia a 1 e ti cura 2d6 (la cura la applica chi chiama, dopo il danno) */
  function secondaVita(s, danno, pv, ctx) {
    if (!attivo(s, "seconda") || !(pv > 0) || danno < pv) return { danno, eventi: [] };
    s.eff.seconda = 0;
    const tiri = tiraDadi(ctx, 2, 6), cura = somma(tiri);
    return { danno: pv - 1, cura, eventi: [{ k: "secondaVitaUsata", evitato: danno - (pv - 1), tiri, cura }] };
  }
  /* effetti scaduti: Santuario cura 1d6 alla fine */
  function scaduti(s, finiti, ctx) {
    const E = [];
    if (finiti.includes("santuario")) { const d = ctx.tira(6), fatto = ctx.cura ? ctx.cura(d) : d; E.push({ k: "santuarioFine", d, fatto }); }
    return E;
  }

  /* ---------- testi (IT/EN): una riga per evento. I colpi, i tiri salvezza e gli stati li scrive già chi mostra lo scontro ---------- */
  const T = (it, en) => (root.Lingua && typeof root.Lingua.t === "function" ? root.Lingua.t({ it, en }) : it);
  const dadi = (e) => `${e.nd ? e.nd * Math.max(1, e.n) : e.n}d${e.dado} [${e.tiri.join("+")}]${e.mm ? (e.mm > 0 ? "+" : "−") + Math.abs(e.mm) : ""}`;
  function testo(e) {
    switch (e.k) {
      case "sigilli":
        if (e.n <= 0 && e.perse > 0) return T(`Sigilli già al massimo (${e.tot}/${e.max}).`, `Seals already at the maximum (${e.tot}/${e.max}).`);
        return T(`Incidi ${e.n === 1 ? "1 Sigillo" : e.n + " Sigilli"} sul nemico (${e.tot}/${e.max}).`, `You carve ${e.n === 1 ? "1 Seal" : e.n + " Seals"} on the enemy (${e.tot}/${e.max}).`) + (e.perse > 0 ? T(" Il resto va perso.", " The rest is lost.") : "");
      case "diretto": return T(`Danno senza tiro: ${dadi(e)} = ${e.danno}${e.meta ? " (dimezzato)" : ""}.`, `Damage with no roll: ${dadi(e)} = ${e.danno}${e.meta ? " (halved)" : ""}.`);
      case "detona":
        return T(`Detonazione: ${e.n} ${e.n === 1 ? "Sigillo" : "Sigilli"} esplodono, +${e.n}d${e.dado} [${e.tiri.join("+")}] = ${e.bonus} danni.`, `Detonation: ${e.n} ${e.n === 1 ? "Seal" : "Seals"} burst, +${e.n}d${e.dado} [${e.tiri.join("+")}] = ${e.bonus} damage.`)
          + (e.mana ? T(` Recuperi ${e.mana} mana${e.max ? " (Sigilli al massimo: doppio)" : ""}.`, ` You recover ${e.mana} mana${e.max ? " (Seals at the maximum: double)" : ""}.`) : "");
      case "detonaVuota": return T("Nessun Sigillo da far esplodere: niente Detonazione.", "No Seal to burst: no Detonation.");
      case "detonaUno": return T(`Un Sigillo esplode: +1d6 [${e.d}] (ne restano ${e.restano}).`, `A Seal bursts: +1d6 [${e.d}] (${e.restano} left).`);
      case "detonaTotale": return T(`I tre colpi contano come una Detonazione: ${e.n} Sigilli, ${e.bonus} danni in più.` + (e.mana ? ` Recuperi ${e.mana} mana.` : ""), `The three blows count as one Detonation: ${e.n} Seals, ${e.bonus} extra damage.` + (e.mana ? ` You recover ${e.mana} mana.` : ""));
      case "consumo":
        return T(`Consumi ${e.n} ${e.n === 1 ? "Sigillo" : "Sigilli"}: ${dadi(e)} = ${e.danno} danni.`, `You spend ${e.n} ${e.n === 1 ? "Seal" : "Seals"}: ${dadi(e)} = ${e.danno} damage.`) + (e.mana ? T(` Recuperi ${e.mana} mana.`, ` You recover ${e.mana} mana.`) : "");
      case "risonanza": return T(`Risonanza: +${e.n}d8 [${e.tiri.join("+")}] = ${e.danno} danni, i Sigilli restano.`, `Resonance: +${e.n}d8 [${e.tiri.join("+")}] = ${e.danno} damage, the Seals remain.`);
      case "svelata": return T("La scheda del nemico si apre davanti a te.", "The enemy's sheet opens before you.");
      case "runa": return T(`Una runa corre sull'arma per ${e.turni} turni: il dado sale di un passo e ogni colpo a segno incide 1 Sigillo.`, `A rune runs along the weapon for ${e.turni} turns: the die goes up a step and every hit carves 1 Seal.`);
      case "occhio": return T(`Per ${e.turni} turni i tuoi attacchi magici fanno critico con 19-20 e ogni critico incide 2 Sigilli.`, `For ${e.turni} turns your spell attacks crit on 19-20 and every crit carves 2 Seals.`);
      case "parola": return T(`Il nemico ha −4 ai tiri salvezza per ${e.turni} turni.`, `The enemy has −4 on saving throws for ${e.turni} turns.`);
      case "tomo": return T(`Il Tomo ti costa ${e.mente} di salute mentale (non letale). Per ${e.turni} turni gli incantesimi d'Arcano costano 2 in meno (minimo 1) e incidono 1 Sigillo in più.`, `The Tome costs you ${e.mente} mental health (non-lethal). For ${e.turni} turns Arcane spells cost 2 less (minimum 1) and carve 1 extra Seal.`);
      case "difesaPronta": return {
        specchio: T("Il primo colpo che subisci farà metà danni e inciderà 1 Sigillo su chi ti ha colpito.", "The first blow you take does half damage and carves 1 Seal on whoever hit you."),
        barriera: T("Il primo colpo che subisci farà 0 danni e chi ti colpisce subirà 1d6 forza.", "The first blow you take does 0 damage and whoever hits you takes 1d6 force."),
        respingere: T("Fino al tuo turno ogni colpo fa 0 danni e restituisce 1d6 forza.", "Until your turn every blow does 0 damage and returns 1d6 force.")
      }[e.tipo];
      case "riflesso": return T(`Il colpo si ritorce contro il nemico: ${e.d} danni da forza.`, `The blow turns back on the enemy: ${e.d} force damage.`);
      case "scudoMagico": return T(`Uno scudo di forza: +2 alla Classe armatura per ${e.turni} turni.`, `A shield of force: +2 Armor Class for ${e.turni} turns.`);
      case "muro": return T(`Un muro di forza: +3 alla Classe armatura per ${e.turni} turni e la Presa non ti tiene.`, `A wall of force: +3 Armor Class for ${e.turni} turns and a Grab cannot hold you.`);
      case "invuln": return T("Fino al tuo prossimo turno nulla può ferirti, nemmeno il Soffio.", "Until your next turn nothing can harm you, not even the Breath.");
      case "disfatto": return T("Sciogli la Presa e scarichi l'attacco speciale pronto del nemico.", "You undo the Grab and discharge the enemy's readied special attack.");
      case "soffioPerso": return T("Il nemico perde l'attacco speciale pronto.", "The enemy loses its readied special attack.");
      case "demolitore": return T("Per tutto lo scontro ogni tua Detonazione fa anche Sbilanciato 1.", "For the whole fight every Detonation of yours also causes Off-balance 1.");
      case "caMeno": return T(`Per tutto lo scontro la Classe armatura del nemico scende di ${e.n}.`, `For the whole fight the enemy's Armor Class drops by ${e.n}.`);
      case "rimborso": return T(`Il nemico cade: recuperi il mana speso (${e.mana}).`, `The enemy falls: you recover the mana spent (${e.mana}).`);
      case "filo": return T("Finché il nemico ha almeno 2 Sigilli, ha −2 per colpirti.", "While the enemy has at least 2 Seals, it has −2 to hit you.");
      case "prossimoSconto": return T(`Il prossimo incantesimo costerà ${e.n} in meno.`, `Your next spell will cost ${e.n} less.`);
      case "scontoInc": return e.n > 0 ? T(`Il ricamo alleggerisce l'incantesimo: costa ${e.n} in meno.`, `The embroidery lightens the spell: it costs ${e.n} less.`) : null;
      case "quiete": return T(`Per ${e.turni} turni gli incantesimi d'Arcano non costano mana: ognuno spende 1 Sigillo (senza Sigilli paghi il costo).`, `For ${e.turni} turns Arcane spells cost no mana: each spends 1 Seal (with no Seals you pay the cost).`);
      case "quieteSigillo": return T(`La quiete consuma 1 Sigillo al posto del mana (ne restano ${e.tot}).`, `The stillness spends 1 Seal instead of mana (${e.tot} left).`);
      case "pressioneTick": return T(`La pressione schiaccia il nemico: ${e.d} danni da forza.`, `The pressure crushes the enemy: ${e.d} force damage.`);
      case "guarigione": return e.n ? T(`Cura: ${dadi(e)} = ${e.tot}${e.fatto < e.tot ? ` (recuperi ${e.fatto})` : ""}.`, `Healing: ${dadi(e)} = ${e.tot}${e.fatto < e.tot ? ` (you recover ${e.fatto})` : ""}.`) : T(`Ti curi di ${e.fatto}.`, `You heal ${e.fatto}.`);
      case "fede": return T(`Recuperi ${e.n} ${e.n === 1 ? "punto" : "punti"} fede.`, `You recover ${e.n} faith.`);
      case "divora": return T(`Divori l'Avvizzito: ${e.n}d${e.dado} [${e.tiri.join("+")}] = ${e.tot} danni subito.`, `You devour the Withering: ${e.n}d${e.dado} [${e.tiri.join("+")}] = ${e.tot} damage at once.`);
      case "patto": return T(`Patto: perdi ${e.d} salute e recuperi ${e.fede} fede.`, `Pact: you lose ${e.d} health and recover ${e.fede} faith.`);
      case "nadir": return T(`L'Ombra chiede il suo prezzo: ${e.mente} salute mentale (non letale).`, `The Shadow takes its price: ${e.mente} mental health (non-lethal).`);
      case "crepuscolo": return T(`Crepuscolo (${e.da === "nadir" ? "da Nadir" : "da Zenit"}): +1 dado${e.mana ? `, recuperi ${e.mana} fede` : ""}. La Bilancia torna a 0.`, `Twilight (${e.da === "nadir" ? "from Nadir" : "from Zenith"}): +1 die${e.mana ? `, you recover ${e.mana} faith` : ""}. The Balance returns to 0.`);
      case "bilancia": {
        const nome = (v) => (v === 0 ? T("equilibrio", "even") : v > 0 ? T(`Luce ${v}`, `Light ${v}`) : T(`Ombra ${-v}`, `Shadow ${-v}`));
        return e.da === e.a ? T(`Bilancia: ${nome(e.a)}.`, `Balance: ${nome(e.a)}.`) : T(`Bilancia: ${nome(e.da)} → ${nome(e.a)}.`, `Balance: ${nome(e.da)} → ${nome(e.a)}.`);
      }
      case "giudizio": return e.luce ? T(`Il Giudizio pesa ${e.luce} ${e.luce === 1 ? "punto" : "punti"} di Luce: +${e.luce}d10.`, `Judgment weighs ${e.luce} Light: +${e.luce}d10.`) : null;
      case "eccesso": return T(`La cura in eccesso ferisce il nemico: ${e.n} danni radianti.`, `The excess healing wounds the enemy: ${e.n} radiant damage.`);
      case "santuario": return T(`Per ${e.turni} turni il primo colpo di ogni turno fa metà danni; alla fine ti curi.`, `For ${e.turni} turns the first blow of each turn does half damage; you heal at the end.`);
      case "santuarioFine": return T(`Il santuario si dissolve e ti cura di ${e.fatto}.`, `The sanctuary fades and heals you for ${e.fatto}.`);
      case "corona": return T(`Per ${e.turni} turni il nemico subisce 1d6 radiante a inizio turno; se ti colpisce, resta Accecato 1.`, `For ${e.turni} turns the enemy takes 1d6 radiant at the start of its turn; if it hits you it is Blinded 1.`);
      case "coronaTick": return T(`La corona di raggi brucia il nemico: ${e.d} danni radianti.`, `The crown of rays burns the enemy: ${e.d} radiant damage.`);
      case "avvizzitoTick": return T(`L'Avvizzito consuma il nemico: ${e.d} danni necrotici (d${e.dado}).`, `The Withering consumes the enemy: ${e.d} necrotic damage (d${e.dado}).`);
      case "voto": return T(`Per ${e.turni} turni ogni colpo d'arma a segno fa +1d4 radiante e ti cura 1.`, `For ${e.turni} turns every weapon hit deals +1d4 radiant and heals you 1.`);
      case "votoColpo": return T(`Il voto di luce brucia: +${e.d} radianti${e.cura ? " e ti cura 1" : ""}.`, `The vow of light burns: +${e.d} radiant${e.cura ? " and heals you 1" : ""}.`);
      case "fiamma": return T(`Per ${e.turni} turni chi ti colpisce subisce 1d4 di fuoco sacro.`, `For ${e.turni} turns whoever hits you takes 1d4 sacred fire.`);
      case "fiammaColpo": return T(`La fiamma ti protegge: ${e.d} danni di fuoco sacro al nemico.`, `The flame protects you: ${e.d} sacred fire damage to the enemy.`);
      case "cerchio": return T(`Per ${e.turni} turni +2 alla Classe armatura e ai tiri salvezza; il Soffio ti fa metà danni.`, `For ${e.turni} turns +2 Armor Class and saving throws; the Breath does half damage to you.`);
      case "manto": return T("Il prossimo attacco del nemico tira 2d20 e tiene il peggiore.", "The enemy's next attack rolls 2d20 and keeps the worse.");
      case "gemella": return T(`Per ${e.turni} turni ogni tuo incantesimo a segno fa +1d6 necrotico.`, `For ${e.turni} turns every spell of yours that lands deals +1d6 necrotic.`);
      case "gemellaDanno": return T(`L'ombra gemella colpisce: +${e.d} necrotici.`, `The twin shadow strikes: +${e.d} necrotic.`);
      case "notte": return T(`Per ${e.turni} turni: nemico Accecato e Avvizzito, gli incantesimi d'Ombra costano 2 in meno. Perdi ${e.mente} salute mentale (non letale).`, `For ${e.turni} turns: enemy Blinded and Withered, Shadow spells cost 2 less. You lose ${e.mente} mental health (non-lethal).`);
      case "furia": return T(`Per ${e.turni} turni gli incantesimi d'Ombra hanno +1 dado e ti curano della metà dei danni; la Bilancia resta a Ombra 3.`, `For ${e.turni} turns Shadow spells have +1 die and heal you for half the damage; the Balance stays at Shadow 3.`);
      case "lutto": return T("Per tutto lo scontro Nadir non ti costa salute mentale.", "For the whole fight Nadir costs you no mental health.");
      case "rancore": return T(`Rancore: +${e.n}d6 per i colpi subiti.`, `Grudge: +${e.n}d6 for the blows taken.`);
      case "seconda": return T("Il prossimo colpo che ti porterebbe a 0 ti lascia a 1 e ti cura.", "The next blow that would take you to 0 leaves you at 1 and heals you.");
      case "secondaVitaUsata": return T(`Seconda Vita: resti a 1 (${e.evitato} danni evitati) e ti curi di ${e.cura}.`, `Second Life: you stay at 1 (${e.evitato} damage avoided) and heal ${e.cura}.`);
      case "liberato": return T("Sei libero dalla Presa: il nemico non può più afferrarti.", "You are free of the Grab: the enemy can no longer seize you.");
      case "giaUsataScontro": return T("Già usato in questo scontro.", "Already used in this fight.");
      case "giaUsataRiposo": return T("Già usato dall'ultimo riposo.", "Already used since the last rest.");
      case "difesaDiFila": return T("Non puoi usare due turni di fila un incantesimo che consuma l'azione.", "You cannot use a spell that takes your action two turns in a row.");
      case "senzaSigilli": return T("Servono almeno 1 Sigillo sul nemico.", "You need at least 1 Seal on the enemy.");
      default: return null;
    }
  }

  const API = { UNA_PER_RIPOSO, DIFESE, SERVONO_SIGILLI, recupero, costo, disponibile, lancia, inizioTurnoNemico, haTick, bonusTsPg, secondaVita, scaduti, testo };
  root.MagiaCombattimento = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof window !== "undefined" ? window : globalThis);
