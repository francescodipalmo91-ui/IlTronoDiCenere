/* =====================================================================
   MAGIA IN COMBATTIMENTO — gli incantesimi dell'Arcanista (Sangue e Illusione, dal 04/11 sera; prima Arcano e Forza) e del Monaco, senza interfaccia.
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
   - attacco magico = d20 + mod Mente contro la CA; dal 28/10 il danno aggiunge il modificatore (ctx.modDanno), come le armi il Vigore; critico = doppio dei dadi
   - tiro salvezza del nemico: d20 + suo Vigore contro 8 + Mente + livello; i boss ignorano i controlli e usano il ripiego del testo
   - 04/11 sera, SANGUE (docs/incantesimi_arcanista_monaco.md, 2bis): Ferite sul nemico (campo s.sigilli, massimi di Combattimento.sigilliMax: 3, 2 sui boss,
     pieni con la via Vena). Si paga in mana o in salute 1 a 1 (ctx.versato: lo decide e lo paga chi chiama, solo restando sopra metà salute: puoVersare).
     Versato = +1 dado; Sangue che chiama (sotto metà salute, ctx.pvPg / ctx.pvMaxPg) = +1 dado; Risucchio: un quarto del danno del Sangue ti cura;
     Coagulo (in Combattimento.colpoSubito): dopo aver versato sangue, ogni colpo subito ti rende un quarto del danno. Detonazioni: Ebollizione, Cuore Spezzato, Ultima Goccia.
   - ILLUSIONE: Copie sul personaggio (s.copie, Combattimento.copie/copieMax: 3, 4 con Velo); Frantumare le fa esplodere e rende 1 mana per Copia;
     i boss «smascherano»: a inizio turno TS di Mente, se riesce distrugge 1 Copia (Velo: −2). Combo: ogni Copia distrutta incide 1 Ferita.
   - le difese che consumano l'azione non si usano due turni di fila
   - potenziamenti della via (ctx.scuolaVia = scuola potenziata, dal livello 3; vedi scuolaDellaVia): Vena (Sangue): Ferite piene sui boss, Ebollizione cura 3 per Ferita;
     Velo (Illusione): 4 Copie, i boss smascherano con −2; Brace (Vita): la Rigenerazione dura 1 turno in più; Cenere (Negromanzia): Avvizzito con un dado più grande
   ===================================================================== */
(function (root) {
  const C = root.Combattimento || (typeof require === "function" ? require("./combattimento.js") : null);
  const R = root.Regole || {};
  const RECUPERO = R.IRA_PER_COLPO || [1, 1, 2, 2, 3];
  const UNA_PER_RIPOSO = ["ultima_goccia", "nessuno_qui", "marea_cremisi", "grande_inganno", "alba_eterna", "notte_senza_fine"];
  const DIFESE = ["passo_sfasato", "ali_cremisi", "santuario"];       /* consumano l'azione: mai due turni di fila */
  const SERVONO_SIGILLI = ["cuore_spezzato", "ultima_goccia"];     /* senza Ferite non hanno niente da consumare (nome storico: i Sigilli sono diventati le Ferite) */
  const SERVONO_COPIE = ["frantumare", "miraggio", "scambio", "grande_inganno"];
  const GRATUITE = ["condensazione"];                  /* non consumano l'azione (una per turno) */
  const RISUCCHIO_NO = ["cuore_spezzato"];             /* cura già la metà del danno: niente Risucchio in più */

  const tiraDadi = (ctx, n, d) => Array.from({ length: n }, () => ctx.tira(d));
  const somma = (a) => a.reduce((x, y) => x + y, 0);
  const recupero = (liv) => RECUPERO[Math.max(1, Math.min(5, Number(liv) || 1)) - 1];
  const attivo = (s, k) => !!(s && s.eff && s.eff[k] > 0);

  /* costo reale adesso: Tomo Proibito −2 (minimo 1) e Ricamo di Rune −2 sul prossimo; Quiete Assoluta: un Sigillo al posto del mana */
  /* 03/11: tratto di classe dell'Arcanista, «Pozzo Arcano» (ctx.pozzo = grado 0-3: 1 dal livello 1, 2 dal 2, 3 dal 4).
     I: se in un tuo turno non lanci incantesimi, all'inizio del turno dopo recuperi 1 mana.
     II: la difesa dell'Arcanista (dal 04/11 sera Passo Sfasato) costa 1 in meno.
     III: il primo incantesimo di ogni scontro non costa mana. */
  const POZZO_SCONTO = ["passo_sfasato"];
  const gradoPozzo = (liv) => (liv >= 4 ? 3 : liv >= 2 ? 2 : 1);
  function costo(inc, s, ctx) {
    const pozzo = Number(ctx && ctx.pozzo) || 0;
    let c = Number(inc.costo) || 0;
    if (pozzo >= 2 && POZZO_SCONTO.includes(inc.id)) c = Math.max(1, c - 1);
    if (pozzo >= 3 && s && !s.pozzoGratis) return 0;
    if (inc.scuola === "ombra" && attivo(s, "notte")) c = Math.max(1, c - 2); /* Notte Senza Fine */
    return c;
  }
  /* 04/11 sera: si può pagare in salute? Solo il Sangue, solo restando sopra metà della salute massima (ctx.pvPg / ctx.pvMaxPg) */
  function puoVersare(inc, s, ctx) {
    if (!inc || inc.scuola !== "sangue" || !ctx || !(Number(ctx.pvMaxPg) > 0)) return false;
    const c = costo(inc, s, ctx);
    return c > 0 && Number(ctx.pvPg) - c > Number(ctx.pvMaxPg) / 2;
  }
  /* si può lanciare adesso? (prima di spendere il mana) */
  function disponibile(inc, s, ctx) {
    if (UNA_PER_RIPOSO.includes(inc.id) && ctx && ctx.usataPerRiposo && ctx.usataPerRiposo(inc.id)) return { ok: false, motivo: "giaUsataRiposo" };
    if (DIFESE.includes(inc.id) && s && s.difesaBloccata) return { ok: false, motivo: "difesaDiFila" };
    if (inc.id === "seconda_vita" && s && s.secondaUsata) return { ok: false, motivo: "giaUsataScontro" };
    if (SERVONO_SIGILLI.includes(inc.id) && C.sigilli(s) < 1) return { ok: false, motivo: "senzaSigilli" };
    if (SERVONO_COPIE.includes(inc.id) && C.copie(s) < 1) return { ok: false, motivo: "senzaCopie" };
    if (GRATUITE.includes(inc.id) && s && s.condensOra) return { ok: false, motivo: "unaPerTurno" };
    return { ok: true };
  }

  function lancia(inc, s, ctx) {
    s.eff = s.eff || {}; s.effMax = s.effMax || {};
    const disp = disponibile(inc, s, ctx);
    if (!disp.ok) return { eventi: [{ k: disp.motivo }], costo: 0, rifiutata: true };
    s.incQuestoTurno = true; /* Pozzo Arcano, grado I */
    if ((Number(ctx && ctx.pozzo) || 0) >= 3) s.pozzoGratis = true; /* grado III: il primo dello scontro era gratis */
    const E = [], sang = inc.scuola === "sangue", illu = inc.scuola === "illusione";
    const c = costo(inc, s, ctx);
    /* ---- Monaco: la Bilancia (+ Luce, − Ombra) ---- */
    const luce = inc.scuola === "luce", ombra = inc.scuola === "ombra", mon = luce || ombra;
    const bil = Number(s.bilancia) || 0, bloccata = attivo(s, "furiaCinerea");
    const crep = mon && !bloccata && ((ombra && bil === 3) || (luce && bil === -3));   /* Zenit / Nadir: l'incantesimo opposto è un Crepuscolo */
    const velo = ombra && bil <= -2, nadir = ombra && bil === -3 && !s.lutto, aureola = mon && bil >= 2;
    const piu = crep ? 1 : 0;                                                          /* +1 dado di danno o cura */
    const piuD = piu + (velo ? 1 : 0) + (ombra && attivo(s, "furiaCinerea") ? 1 : 0);          /* sul danno: anche Velo e Furia Cinerea */
    const pv0 = s.pv;
    /* ---- Sangue: dadi in più (versato o già ferito, Condensazione) ---- */
    const versato = sang && !!ctx.versato, chiama = sang && !versato && Number(ctx.pvMaxPg) > 0 && Number(ctx.pvPg) < Number(ctx.pvMaxPg) / 2;
    if (versato) { s.versato = true; E.push({ k: "versato", n: c }); }
    else if (chiama) E.push({ k: "sangueChiama" });
    const condens = sang && inc.id !== "condensazione" && Number(s.condens) > 0 ? Number(s.condens) : 0;
    if (condens) { s.condens = 0; E.push({ k: "condensUsata", n: condens }); }
    const piuS = (versato || chiama ? 1 : 0) + condens;                               /* dadi in più sul danno del Sangue */
    let crits = 0, rimborso = false;
    if (DIFESE.includes(inc.id)) s.difesaUsata = true;
    if (UNA_PER_RIPOSO.includes(inc.id) && ctx.segnaPerRiposo) ctx.segnaPerRiposo(inc.id);

    /* ---- strumenti ---- */
    const sigMax = C.sigilliMax(ctx);
    const ink = (n) => { const e = C.incidi(s, ctx, n); E.push(e); return e; };
    const fx = (k, n) => E.push(C.metti(s, ctx, k, n));
    const vivo = () => s.pv > 0;
    const hit = (o) => {
      const fort = !!s.fortuna; if (fort) s.fortuna = false; /* Colpo di Fortuna: il prossimo attacco magico */
      const dest = attivo(s, "destino");
      const r = C.colpo(s, ctx, { ...o, scuola: inc.scuola, vantaggio: fort || (o && o.vantaggio), critDa: dest ? Math.min(18, (o && o.critDa) || 20) : o && o.critDa });
      if (r.crit && (fort || dest)) crea(1); /* sul critico, 1 Copia */
      E.push(r); if (r.crit) crits++;
      if (r.ok && vivo() && attivo(s, "doppio") && C.copie(s) >= 2) { const x = ctx.tira(6); s.pv -= x; E.push({ k: "doppioColpo", d: x }); } /* Il Doppio (Velo) */
      return r;
    };
    /* Illusione: Copie sul personaggio */
    const copieMax = C.copieMax(ctx);
    const crea = (n) => { const prima = C.copie(s), dopo = Math.min(copieMax, prima + n); s.copie = dopo; E.push({ k: "copie", n: dopo - prima, perse: n - (dopo - prima), tot: dopo, max: copieMax }); };
    /* Sangue: Detonazione delle Ferite con cura (Ebollizione), Sete della via Vena */
    const sete = () => { if (s.sete && ctx.cura) { const d = ctx.tira(4), f = ctx.cura(d); E.push({ k: "seteCura", d, fatto: f }); } };
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
      n += ctx.piuDadiVuln || 0; /* 29/10: la vulnerabilità vale anche senza tiro, solo sul dado base */
      const tiri = tiraDadi(ctx, n, dado), pieno = Math.max(1, somma(tiri) + (extra || 0)), danno = ctx.dimezza ? Math.max(1, Math.floor(pieno / 2)) : pieno; /* 01/11: resistenza alla scuola */
      s.pv -= danno; E.push({ k: "diretto", n, dado, tiri, mm: extra || 0, danno, ...(ctx.dimezza ? { meta: true } : {}) }); return danno;
    };
    const recuperaMana = (mana) => (ctx.manaPiu ? ctx.manaPiu(mana) : mana);
    const dopoColpo = (r, fn) => { if (r.ok) { fn(); } return r; };
    /* ---- strumenti del Monaco ---- */
    const dannoMente = (n) => (ctx.dannoMente ? ctx.dannoMente(n) : n);
    const fede = (n) => recuperaMana(n);
    const guarisci = (n, dado, bonus, extra) => { /* cura n dadi + bonus (+2 con l'Aureola) */
      const tiri = tiraDadi(ctx, n + piu, dado), tot = Math.max(1, somma(tiri) + (bonus || 0) + (aureola ? 2 : 0) + (extra || 0));
      const mancano = ctx.pvMancanti ? ctx.pvMancanti() : tot, fatto = ctx.cura ? ctx.cura(tot) : tot;
      E.push({ k: "guarigione", n: n + piu, dado, tiri, mm: (bonus || 0) + (aureola ? 2 : 0) + (extra || 0), tot, fatto }); return { tot, fatto, eccesso: Math.max(0, tot - mancano) };
    };
    const rigenTurni = () => 3 + (ctx.scuolaVia === "luce" ? 1 : 0); /* 04/11: Brace, la Rigenerazione dura 1 turno in più */
    const curaFissa = (tot) => { const fatto = ctx.cura ? ctx.cura(tot) : tot; E.push({ k: "guarigione", n: 0, dado: 0, tiri: [], mm: 0, tot, fatto }); return fatto; };
    const dannoSpirito = (n, dado) => diretto(n + piuD, dado, 0);
    const avvizzisci = (dado, turni) => { /* Avvizzito: 1d4 (1d6 dove indicato) all'inizio del turno del nemico */
      const gia = attivo(s, "avvizzito");
      if (ctx.scuolaVia === "ombra") dado = Math.min(12, dado + 2); /* 04/11: Cenere */
      s.avvizzitoDado = gia ? Math.max(Number(s.avvizzitoDado) || 4, dado) : dado;
      const e = C.metti(s, ctx, "avvizzito", turni); e.dado = s.avvizzitoDado; E.push(e);
    };

    switch (inc.id) {
      /* ================= Sangue (04/11 sera) ================= */
      case "stilo_cremisi": dopoColpo(hit({ dado: 8, piuDadi: piuS }), () => ink(1)); break;
      case "frusta_cremisi": { diretto(1 + piuS, 4, 0); if (vivo()) { const z = salva(); E.push(z); if (z.ok) E.push({ k: "resiste" }); else E.push(C.sanguina(s, ctx, 4, 2)); } ink(1); break; } /* Sanguinamento con la durata standard del gioco */
      case "lama_coagulata": s.eff.lama = 3; s.effMax.lama = 3; E.push({ k: "lama", turni: 3 }); break;
      case "ebollizione": {
        const r = hit({ dado: 6, piuDadi: 1 + piuS }), n = C.sigilli(s);
        if (r.ok && n > 0) {
          const tiri = tiraDadi(ctx, n, 6), bonus = somma(tiri); s.pv -= bonus; s.sigilli = 0;
          const per = ctx.scuolaVia === "sangue" ? 3 : 2, f = ctx.cura ? ctx.cura(per * n) : per * n;
          E.push({ k: "ebolle", n, tiri, bonus, per, fatto: f }); sete();
        } else if (r.ok) E.push({ k: "detonaVuota" });
        break;
      }
      case "condensazione": s.condens = 2; s.condensOra = true; E.push({ k: "condensazione", n: 2 }); break;
      case "sangue_in_piena": s.eff.piena = 3; s.effMax.piena = 3; E.push({ k: "piena", turni: 3 }); break;
      case "cuore_spezzato": case "ultima_goccia": {
        const n = C.sigilli(s), nd = inc.id === "cuore_spezzato" ? 2 : 3, dado = inc.id === "cuore_spezzato" ? 8 : 10;
        const tiri = tiraDadi(ctx, nd * n + piuS + (ctx.piuDadiVuln || 0), dado), pieno = Math.max(1, somma(tiri)), danno = ctx.dimezza ? Math.max(1, Math.floor(pieno / 2)) : pieno;
        s.pv -= danno; s.sigilli = 0;
        E.push({ k: "consumo", n, nd, dado, tiri, mm: 0, danno, mana: 0, ferite: true });
        if (inc.id === "cuore_spezzato") curaFissa(Math.floor(danno / 2));
        sete();
        break;
      }
      case "crosta": { const t = 3; s.eff.scudo = Math.max(Number(s.eff.scudo) || 0, t); s.effMax.scudo = Math.max(Number(s.effMax.scudo) || 0, t); s.eff.crosta = t; s.effMax.crosta = t; E.push({ k: "crosta", turni: t }); break; }
      case "meteora_sangue": dopoColpo(hit({ dado: 6, piuDadi: 1 + piuS, critDa: C.sigilli(s) >= 2 ? 19 : undefined }), () => { if (vivo()) fx("sbilanciato", 1); }); break;
      case "costellazione_rossa": s.eff.costellazione = 3; s.effMax.costellazione = 3; E.push({ k: "costellazione", turni: 3 }); break;
      case "sangue_velenoso": { const z = salva(); E.push(z); if (z.ok) E.push({ k: "resiste" }); else { s.velenoArc = C.sigilli(s) >= 2 ? 6 : 4; const e = C.metti(s, ctx, "avvelenato", 3); e.dado = s.velenoArc; E.push(e); } break; }
      case "emorragia": s.eff.emorragia = 3; s.effMax.emorragia = 3; E.push({ k: "emorragia", turni: 3 }); break;
      case "ali_cremisi": s.assorbe = { tipo: "ali", n: 0 }; E.push({ k: "difesaPronta", tipo: "ali" }); break;
      case "vincolo_sangue": { const z = salva(); E.push(z); if (z.ok) E.push({ k: "resiste" }); else { s.eff.vincolo = 3; s.effMax.vincolo = 3; E.push({ k: "vincolo", turni: 3 }); } break; }
      case "marea_cremisi": diretto(4 + piuS, 8, 0); if (vivo()) ink(sigMax); break;
      /* ================= Via Vena (Aldo): Sangue ================= */
      case "fiume_rosso": ink(2); break;
      case "sete": s.sete = true; E.push({ k: "sete" }); break;

      /* ================= Illusione (04/11 sera) ================= */
      case "riflessi": crea(2); break;
      case "dardo_fantasma": dopoColpo(hit({ dado: 8 }), () => crea(1)); break;
      case "passo_sfasato": s.assorbe = { tipo: "passo", n: 0 }; E.push({ k: "difesaPronta", tipo: "passo" }); break;
      case "frantumare": {
        const n = C.copie(s); s.copie = 0;
        diretto(n, 8, 0);
        const mana = recuperaMana(n); E.push({ k: "frantuma", n, mana });
        if (n >= 3 && vivo()) { if (ctx.boss) fx("sbilanciato", 1); else fx("frastornato", 1); }
        break;
      }
      case "dado_truccato": { const t = ctx.boss ? 2 : 3; s.eff.truccato = t; s.effMax.truccato = t; E.push({ k: "truccato", turni: t }); break; }
      case "terrore_illusorio": {
        const tiri = tiraDadi(ctx, 2 + (ctx.piuDadiVuln || 0), 8), pieno = somma(tiri), z = salva(); E.push(z);
        let danno = Math.max(1, z.ok ? Math.floor(pieno / 2) : pieno); if (ctx.dimezza) danno = Math.max(1, Math.floor(danno / 2));
        s.pv -= danno; E.push({ k: "diretto", n: 2 + (ctx.piuDadiVuln || 0), dado: 8, tiri, mm: 0, danno, meta: z.ok });
        if (!z.ok && vivo()) fx("paura", 2); else if (z.ok) E.push({ k: "resiste" });
        break;
      }
      case "teatro_specchi": crea(copieMax); s.eff.teatro = 3; s.effMax.teatro = 3; E.push({ k: "teatro", turni: 3 }); break;
      case "colpo_fortuna": s.fortuna = true; E.push({ k: "fortuna" }); break;
      case "miraggio": diretto(C.copie(s), 8, 0); break;
      case "scambio": s.copie = C.copie(s) - 1; s.soffioPronto = false; s.presaUsata = true; E.push({ k: "scambio", restano: s.copie }); break;
      case "specchio_rotto": s.specchioRotto = true; E.push({ k: "specchioRotto" }); break;
      case "labirinto": controlloORipiego({ bloccato: 1 }, () => { fx("sbilanciato", 2); s.eff.labirinto = 2; s.effMax.labirinto = 2; E.push({ k: "labirinto", turni: 2 }); }); crea(1); break;
      case "destino_segnato": s.eff.destino = 3; s.effMax.destino = 3; E.push({ k: "destino", turni: 3 }); break;
      case "incubo": diretto(3 + C.copie(s), 8, 0); if (vivo()) { const z = salva(); E.push(z); if (z.ok) E.push({ k: "resiste" }); else fx("paura", 2); } break;
      case "grande_inganno": {
        const n = C.copie(s); s.copie = 0; diretto(2 * n, 10, 0);
        const mana = recuperaMana(n); E.push({ k: "frantuma", n, mana });
        s.eff.truccato = Math.max(Number(s.eff.truccato) || 0, 2); s.effMax.truccato = Math.max(Number(s.effMax.truccato) || 0, 2); E.push({ k: "truccato", turni: 2 });
        break;
      }
      /* ================= Via Velo (Guendalina): Illusione ================= */
      case "il_doppio": s.eff.doppio = 3; s.effMax.doppio = 3; E.push({ k: "doppio", turni: 3 }); break;
      case "sala_specchi": crea(1); s.salaSpecchi = true; E.push({ k: "salaSpecchi" }); break;
      case "nessuno_qui": crea(copieMax); s.eff.nessuno = 2; s.effMax.nessuno = 2; E.push({ k: "nessuno", turni: 2 }); break;

      /* ================= Luce ================= */
      case "dardo_luce": { const r = hit({ dado: 8, piuDadi: piu }); if (r.ok) { if (r.crit && vivo()) fx("accecato", 1); } break; }
      case "tocco_lenitivo": guarisci(1, 8, ctx.modAtt); break;
      case "scudo_fede": s.eff.scudo = 3; s.effMax.scudo = 3; E.push({ k: "scudoMagico", turni: 3 }); break; /* 03/11: da 2 a 3 turni */
      case "accecare": conTS({ accecato: 2 }); break;
      case "folgore_sacra": {
        const r = hit({ dado: 6, piuDadi: 1 + piu });
        if (r.ok) { if (vivo()) { if (ctx.boss) diretto(1, 6, 0); else conTS({ frastornato: 1 }); } }
        break;
      }
      case "voto_luce": s.eff.voto = 3; s.effMax.voto = 3; s.eff.rigen = s.effMax.rigen = rigenTurni(); E.push({ k: "voto", turni: 3 }); break; /* 03/11: Voto di Vita, Rigenerazione al posto di «cura 1 per colpo» */
      case "raggio_mattino": {
        const tiri = tiraDadi(ctx, 2 + piu, 8), pieno = somma(tiri), z = salva(); E.push(z);
        const danno = Math.max(1, z.ok ? Math.floor(pieno / 2) : pieno); s.pv -= danno; 
        E.push({ k: "diretto", n: 2 + piu, dado: 8, tiri, mm: 0, danno, meta: z.ok }); break;
      }
      case "santuario": s.eff.santuario = 2; s.effMax.santuario = 2; s.santColpo = false; E.push({ k: "santuario", turni: 2 }); break;
      case "purificazione": s.presaUsata = true; E.push({ k: "liberato" }); guarisci(1, 6, 0); break;
      case "lancia_sole": { const r = hit({ dado: 8, piuDadi: 2 + piu }); if (r.ok) { if (vivo()) conTS({ accecato: 2 }); } break; }
      case "corona_raggi": s.eff.corona = 3; s.effMax.corona = 3; E.push({ k: "corona", turni: 3 }); break;
      case "grazia": guarisci(1, 8, ctx.modAtt); s.eff.rigen = s.effMax.rigen = rigenTurni(); E.push({ k: "rigenInizia", turni: rigenTurni() }); s.eff.scudo = 2; s.effMax.scudo = 2; E.push({ k: "scudoMagico", turni: 2 }); break; /* 03/11: cura spalmata */
      case "alba_eterna": {
        diretto(4 + piu, 8, 0); fx("accecato", 2);
        curaFissa(Math.floor((pv0 - s.pv) / 2)); break;
      }
      case "seconda_vita": s.eff.seconda = C.PER_SCONTRO; s.effMax.seconda = C.PER_SCONTRO; s.secondaUsata = true; E.push({ k: "seconda" }); break;
      case "giudizio": {
        const l = Math.max(0, bil), r = hit({ dado: 10, piuDadi: 1 + piu + l });
        if (r.ok) 
        E.push({ k: "giudizio", luce: l }); break; /* la Bilancia torna a 0 dopo l'incantesimo */
      }
      case "fiamma_calda": guarisci(2, 6, ctx.modAtt); s.eff.fiamma = 2; s.effMax.fiamma = 2; E.push({ k: "fiamma", turni: 2 }); break;
      case "cerchio_focolare": s.eff.cerchio = 3; s.effMax.cerchio = 3; E.push({ k: "cerchio", turni: 3 }); break;
      case "fuoco_cura": {
        const g = guarisci(4, 8, ctx.modAtt);
        if (g.eccesso > 0) { s.pv -= g.eccesso; E.push({ k: "eccesso", n: g.eccesso }); }
        break;
      }

      /* ================= Ombra ================= */
      case "tocco_avvizzente": dopoColpo(hit({ dado: 6, piuDadi: piuD }), () => {}); break;
      case "sussurro_paura": controlloORipiego({ silenzio: 1 }, () => fx("debole", 1)); break;
      case "manto_ombra": s.eff.manto = 1; s.effMax.manto = 1; E.push({ k: "manto" }); break;
      case "avvizzire": if (conTS({})) { /* il tiro è fallito */ } else break; avvizzisci(4, 3); break;
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
      case "eclisse": conTS({ accecato: 2, debole: 2 }); break;
      case "ombra_gemella": s.eff.gemella = 3; s.effMax.gemella = 3; E.push({ k: "gemella", turni: 3 }); break;
      case "terrore": {
        if (ctx.boss) { E.push({ k: "immune", s: "frastornato" }); fx("debole", 2); fx("paura", 2); }
        else conTS({ frastornato: 2 });
        break;
      }
      case "mietitura": {
        dannoSpirito(3, 6); 
        if (s.pv < s.pvMax / 2) E.push({ k: "fede", n: fede(2) });
        break;
      }
      case "notte_senza_fine": {
        fx("accecato", 3); avvizzisci(6, 3); 
        s.eff.notte = 3; s.effMax.notte = 3; E.push({ k: "notte", turni: 3, mente: dannoMente(ctx.tira(4)) }); break;
      }
      case "nome_taciuto": controlloORipiego({ bloccato: 2 }, () => { fx("debole", 2); fx("sbilanciato", 2); }); break;
      case "abbraccio_vuoto": dopoColpo(hit({ dado: 8, piuDadi: 3 + piuD }), () => {}); break;
      case "rancore": { const n = Math.min(3, Number(s.colpiSubiti) || 0); dopoColpo(hit({ dado: 6, piuDadi: 1 + piuD + n }), () => {}); if (n) E.push({ k: "rancore", n }); break; }
      case "lutto": s.lutto = true; if (conTS({ debole: 2 })) { avvizzisci(6, 3); } E.push({ k: "lutto" }); break;
      case "furia_cinerea": s.eff.furiaCinerea = 3; s.effMax.furiaCinerea = 3; s.bilancia = -3; E.push({ k: "furiaCinerea", turni: 3 }); break;

      default: E.push({ k: "sconosciuta" });
    }

    /* ---- dopo l'incantesimo del Monaco ---- */
    if (mon) {
      /* 03/11: lo Spirito Servitore colpisce da solo a inizio turno (inizioTurnoMonaco), non più sugli incantesimi a segno */
      const drenato = Math.max(0, pv0 - s.pv);
      if (ombra && s.fameOmbra && drenato > 0 && inc.id !== "furia_cinerea") { s.fameOmbra = false; E.push({ k: "fameOmbraScatta" }); curaFissa(drenato); } /* 03/11: Fame dell'Ombra (Monaco, via Cenere, grado III) */
      else if (inc.id === "tocco_avvizzente" && drenato > 0) curaFissa(Math.floor(drenato / 2));
      else if (inc.id === "abbraccio_vuoto" && drenato > 0) curaFissa(drenato);
      else if (ombra && attivo(s, "furiaCinerea") && drenato > 0 && inc.id !== "furia_cinerea") curaFissa(Math.floor(drenato / 2));
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
      if (Number(ctx.respiro) >= 2 && Math.abs(nuova) === 3 && Math.abs(bil) !== 3) { /* 03/11: Respiro dell'Alba, grado II */
        const t = ctx.tira(4), n = t + (Number(ctx.liv) || 1), fatto = ctx.cura ? ctx.cura(n) : n;
        E.push({ k: "respiroAlba", zenit: nuova > 0, d: t, n, fatto });
      }
    }
    /* 04/11 sera, Risucchio del Sangue: un quarto del danno inflitto (per eccesso) ti cura */
    if (sang && !RISUCCHIO_NO.includes(inc.id) && pv0 - s.pv > 0 && ctx.cura) { const n = Math.ceil((pv0 - s.pv) / 4), f = ctx.cura(n); if (f > 0) E.push({ k: "risucchio", n, fatto: f }); }
    return { eventi: E, costo: c, rimborso, gratuita: GRATUITE.includes(inc.id) };
  }

  /* inizio del turno del nemico: Aura Vitale, Avvizzito; 04/11 sera: i boss smascherano le Copie (TS di Mente, Velo −2) */
  function inizioTurnoNemico(s, ctx) {
    const E = [];
    if (ctx && ctx.boss && C.copie(s) > 0) {
      const z = C.ts({ ...ctx, attrTs: "Mente", modTs: (ctx.modTsDi ? ctx.modTsDi("Mente") : ctx.modTs) - (ctx.scuolaVia === "illusione" ? 2 : 0) - (attivo(s, "labirinto") ? 2 : 0) }); E.push(z);
      if (z.ok) { s.copie = C.copie(s) - 1; E.push({ k: "smascherata", restano: s.copie }); } else E.push({ k: "nonSmaschera" });
    }
    if (attivo(s, "pressione")) { const d = ctx.tira(6); s.pv -= d; E.push({ k: "pressioneTick", d }); }
    if (attivo(s, "corona")) { const d = ctx.tira(6); s.pv -= d; E.push({ k: "coronaTick", d }); }
    if (attivo(s, "avvizzito")) { const dado = Number(s.avvizzitoDado) || 4, d = ctx.tira(dado); s.pv -= d; E.push({ k: "avvizzitoTick", d, dado }); }
    if (attivo(s, "emorragia") && C.sigilli(s) > 0) { const n = C.sigilli(s), tiri = tiraDadi(ctx, n, 4), d = somma(tiri); s.pv -= d; E.push({ k: "emorragiaTick", n, tiri, d }); } /* 04/11 sera */
    if (attivo(s, "avvelenato") && s.velenoArc) { const d = ctx.tira(s.velenoArc); s.pv -= d; E.push({ k: "velenoArcTick", d, dado: s.velenoArc }); } /* Sangue Velenoso (lo Sciamano ha il suo veleno) */
    return E;
  }
  const haTick = (s) => attivo(s, "pressione") || attivo(s, "corona") || attivo(s, "avvizzito") || C.copie(s) > 0 || attivo(s, "emorragia") || (attivo(s, "avvelenato") && !!s.velenoArc);
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

  /* 03/11: etichette delle combo, per leggere a colpo d'occhio cosa prepara cosa (gioco e pagina di test) */
  function etichette(inc) {
    const e = (inc.effetto && inc.effetto.it) || "", t = [];
    const consuma = SERVONO_SIGILLI.includes(inc.id) || /[Cc]onsuma (tutte )?le Ferite/.test(e);
    if (consuma) t.push(T("Detona le Ferite", "Bursts the Wounds"));
    else if (/Ferit/.test(e)) t.push(T("Incide Ferite", "Carves Wounds"));
    if (SERVONO_COPIE.includes(inc.id)) t.push(T("Detona le Copie", "Bursts the Copies"));
    else if (/Copi/.test(e) && inc.scuola === "illusione") t.push(T("Crea Copie", "Creates Copies"));
    if (inc.scuola === "sangue") t.push(T("Mana o salute", "Mana or health"));
    if (GRATUITE.includes(inc.id)) t.push(T("Non consuma l'azione", "Does not use your action"));
    if (inc.scuola === "luce" || inc.scuola === "ombra") {
      if (inc.id === "giudizio") t.push(T("Bilancia → 0", "Balance → 0"));
      else if (inc.id === "abbraccio_vuoto" || inc.id === "furia_cinerea") t.push(T("Bilancia → Negromanzia 3", "Balance → Necromancy 3"));
      else t.push(inc.scuola === "luce" ? T("Bilancia: Vita +1", "Balance: Life +1") : T("Bilancia: Negromanzia +1", "Balance: Necromancy +1"));
    }
    if (DIFESE.includes(inc.id)) t.push(T("Difesa, consuma l'azione", "Defence, uses your action"));
    return t;
  }
  /* combo pronta adesso (o il motivo per cui non serve): testo breve, oppure null */
  function comboPronta(inc, s, ctx) {
    if (!s || !inc || !inc.scuola) return null;
    const sig = C.sigilli(s), max = C.sigilliMax(ctx), e = (inc.effetto && inc.effetto.it) || "";
    /* Sangue: le Ferite */
    if (inc.scuola === "sangue") {
      const detona = SERVONO_SIGILLI.includes(inc.id) || inc.id === "ebollizione";
      if (detona) {
        if (sig <= 0) return SERVONO_SIGILLI.includes(inc.id) ? { ok: false, t: T("Serve almeno 1 Ferita: prima incidi", "Needs at least 1 Wound: carve first") } : { ok: false, t: T("Nessuna Ferita: solo il colpo", "No Wound: just the hit") };
        if (sig >= max) return { ok: true, t: T(`Combo pronta: Ferite al massimo (${sig})`, `Combo ready: Wounds at the maximum (${sig})`) };
        return { ok: true, t: T(`${sig} ${sig === 1 ? "Ferita" : "Ferite"} da far scoppiare`, `${sig} ${sig === 1 ? "Wound" : "Wounds"} to burst`) };
      }
      if (inc.id === "stilo_cremisi" && Number(s.condens) > 0) return { ok: true, t: T("Combo pronta: colpo a piena pressione (+2 dadi)", "Combo ready: full-pressure shot (+2 dice)") };
      if (/Ferit/.test(e) && sig >= max) return { ok: false, t: T("Ferite già al massimo: quelle nuove vanno perse", "Wounds already at the maximum: new ones are lost") };
      return null;
    }
    /* Illusione: le Copie */
    if (inc.scuola === "illusione") {
      const cp = C.copie(s), cmax = C.copieMax(ctx);
      if (SERVONO_COPIE.includes(inc.id)) return cp <= 0 ? { ok: false, t: T("Serve almeno 1 Copia: prima creale", "Needs at least 1 Copy: create them first") } : cp >= 3 ? { ok: true, t: T(`Combo pronta: ${cp} Copie, ${cp} mana e Frastornato`, `Combo ready: ${cp} Copies, ${cp} mana and Dazed`) } : { ok: true, t: T(`${cp} ${cp === 1 ? "Copia" : "Copie"} da far esplodere`, `${cp} ${cp === 1 ? "Copy" : "Copies"} to burst`) };
      if (/Copi/.test(e) && inc.id !== "il_doppio" && cp >= cmax) return { ok: false, t: T("Copie già al massimo", "Copies already at the maximum") };
      return null;
    }
    const bil = Number(s.bilancia) || 0, ferma = attivo(s, "furiaCinerea");
    if (!ferma && inc.scuola === "ombra" && bil === 3) return { ok: true, t: T("Combo pronta: dallo Zenit è un Crepuscolo (+1 dado, recuperi fede)", "Combo ready: from Zenith it is a Twilight (+1 die, you recover faith)") };
    if (!ferma && inc.scuola === "luce" && bil === -3) return { ok: true, t: T("Combo pronta: dal Nadir è un Crepuscolo (+1 dado, fede doppia)", "Combo ready: from Nadir it is a Twilight (+1 die, double faith)") };
    if (ferma && (inc.scuola === "luce" || inc.scuola === "ombra")) return null;
    if (inc.scuola === "luce" && bil === 2 && inc.id !== "giudizio") return { ok: true, t: T("Porta la Bilancia allo Zenit", "Takes the Balance to Zenith") };
    if (inc.scuola === "ombra" && bil === -2 && inc.id !== "abbraccio_vuoto") return { ok: true, t: T("Porta la Bilancia al Nadir (costa 1 punto mentale)", "Takes the Balance to Nadir (costs 1 mental point)") };
    if (inc.id === "giudizio" && bil > 0) return { ok: true, t: T(`Giudizio con Vita ${bil}: +${bil}d10`, `Judgement with Life ${bil}: +${bil}d10`) };
    return null;
  }
  /* 03/11: Respiro dell'Equilibrio, grado III. Da chiamare dopo ogni danno al Monaco: la prima volta sotto metà salute.
     Via Brace (guendalina): la Bilancia torna a 0 e ti curi di 1d6 + mod. Spirito. Via Cenere (aldo): il prossimo incantesimo di Negromanzia cura tutto il danno inflitto. */
  function sottoMetaMonaco(s, ctx, prima, dopo, max) {
    if (Number(ctx && ctx.respiro) < 3 || s.respiroUsato || !(prima >= max / 2 && dopo < max / 2 && dopo > 0)) return [];
    s.respiroUsato = true;
    if (ctx.via === "guendalina") { s.bilancia = 0; const t = ctx.tira(6), n = t + (Number(ctx.modDanno) || 0), fatto = ctx.cura ? ctx.cura(n) : n; return [{ k: "equilibrioRitrovato", d: t, n, fatto }]; }
    if (ctx.via === "aldo") { s.fameOmbra = true; return [{ k: "fameOmbra" }]; }
    return [];
  }
  /* 03/11, Monaco: da chiamare all'inizio di ogni tuo turno. Rigenerazione (Vita): cura 1d4. Spirito Servitore (Negromanzia): 1d6 necrotico al nemico, senza tiro */
  function inizioTurnoMonaco(s, ctx) {
    const E = [];
    if (!s) return E;
    if (attivo(s, "rigen") && ctx.cura) { const d = ctx.tira(4), fatto = ctx.cura(d); E.push({ k: "rigenera", d, fatto }); }
    if (attivo(s, "gemella") && s.pv > 0) { const d = ctx.tira(6); s.pv -= d; E.push({ k: "gemellaDanno", d }); }
    return E;
  }
  /* Pozzo Arcano, grado I: da chiamare all'inizio di ogni tuo turno (dopo il primo) */
  function inizioTurnoPozzo(s, ctx) {
    const pozzo = Number(ctx && ctx.pozzo) || 0, E = [];
    if (pozzo >= 1 && s.pozzoTurni > 0 && !s.incQuestoTurno && ctx.manaPiu) { const n = ctx.manaPiu(1); if (n > 0) E.push({ k: "pozzo", n }); }
    if (attivo(s, "costellazione") && s.pv > 0) { const d = ctx.tira(6); s.pv -= d; E.push({ k: "costellazioneScoppio", d }, C.incidi(s, ctx, 1)); } /* 04/11 sera: Costellazione Rossa */
    s.pozzoTurni = (Number(s.pozzoTurni) || 0) + 1; s.incQuestoTurno = false; s.condensOra = false; /* 04/11 sera: la Condensazione torna disponibile */
    return E;
  }
  /* ---------- testi (IT/EN): una riga per evento. I colpi, i tiri salvezza e gli stati li scrive già chi mostra lo scontro ---------- */
  const T = (it, en) => (root.Lingua && typeof root.Lingua.t === "function" ? root.Lingua.t({ it, en }) : it);
  const dadi = (e) => `${e.nd ? e.nd * Math.max(1, e.n) : e.n}d${e.dado} [${e.tiri.join("+")}]${e.mm ? (e.mm > 0 ? "+" : "−") + Math.abs(e.mm) : ""}`;
  const rombi = (n, max) => "◆".repeat(Math.max(0, Math.min(n, max))) + "◇".repeat(Math.max(0, max - n)); /* 03/11: Sigilli leggibili a colpo d'occhio */
  function testo(e) {
    switch (e.k) {
      case "sigilli": /* 04/11 sera: i Sigilli sono diventati le Ferite del Sangue */
        if (e.n <= 0 && e.perse > 0) return T(`Ferite già al massimo: ${rombi(e.tot, e.max)} ${e.tot} su ${e.max}, quella nuova va persa.`, `Wounds already at the maximum: ${rombi(e.tot, e.max)} ${e.tot} of ${e.max}, the new one is lost.`);
        return T(`Il tuo sangue entra nel nemico: ${e.n === 1 ? "1 Ferita" : e.n + " Ferite"}, ${rombi(e.tot, e.max)} ${e.tot} su ${e.max}.`, `Your blood enters the enemy: ${e.n === 1 ? "1 Wound" : e.n + " Wounds"}, ${rombi(e.tot, e.max)} ${e.tot} of ${e.max}.`)
          + (e.tot >= e.max ? T(" Ferite al massimo: falle scoppiare.", " Wounds at the maximum: burst them.") : "") + (e.perse > 0 ? T(" Il resto va perso.", " The rest is lost.") : "");
      case "copie":
        if (e.n <= 0) return T(`Copie già al massimo (${e.tot} su ${e.max}).`, `Copies already at the maximum (${e.tot} of ${e.max}).`);
        return T(`${e.n === 1 ? "Una Copia di te prende forma" : e.n + " Copie di te prendono forma"}: ${rombi(e.tot, e.max)} ${e.tot} su ${e.max}.`, `${e.n === 1 ? "A Copy of you takes shape" : e.n + " Copies of you take shape"}: ${rombi(e.tot, e.max)} ${e.tot} of ${e.max}.`);
      case "versato": return T(`Paghi col tuo sangue: −${e.n} salute, +1 dado.`, `You pay with your blood: −${e.n} health, +1 die.`);
      case "sangueChiama": return T("Il sangue chiama: sei sotto metà salute, +1 dado.", "Blood calls: you are below half health, +1 die.");
      case "condensazione": return T(`Condensi il sangue: il prossimo incantesimo di Sangue fa +${e.n} dadi.`, `You condense your blood: your next Blood spell deals +${e.n} dice.`);
      case "condensUsata": return T(`Sangue condensato: +${e.n} dadi.`, `Condensed blood: +${e.n} dice.`);
      case "lama": return T(`Il sangue si indurisce sulla lama per ${e.turni} turni: +1d4 e ogni colpo a segno incide 1 Ferita.`, `Blood hardens on the blade for ${e.turni} turns: +1d4 and every hit carves 1 Wound.`);
      case "lamaColpo": return T(`Lama coagulata: +${e.d} danni.`, `Clotted blade: +${e.d} damage.`);
      case "ebolle": return T(`Il sangue ribolle: ${e.n} ${e.n === 1 ? "Ferita scoppia" : "Ferite scoppiano"}, +${e.n}d6 [${e.tiri.join("+")}] = ${e.bonus} danni; ti curi di ${e.fatto} (${e.per} per Ferita).`, `The blood boils: ${e.n} ${e.n === 1 ? "Wound bursts" : "Wounds burst"}, +${e.n}d6 [${e.tiri.join("+")}] = ${e.bonus} damage; you heal ${e.fatto} (${e.per} per Wound).`);
      case "piena": return T(`Per ${e.turni} turni +2 a colpire e ai danni con l'arma e con il Sangue; il Coagulo cura metà del colpo.`, `For ${e.turni} turns +2 to hit and damage with your weapon and with Blood; Clotting heals half the blow.`);
      case "sete": return T("Per tutto lo scontro ogni Detonazione di Sangue ti cura anche 1d4.", "For the whole fight every Blood Detonation also heals you 1d4.");
      case "seteCura": return T(`Sete: 1d4 [${e.d}], ti curi di ${e.fatto}.`, `Thirst: 1d4 [${e.d}], you heal ${e.fatto}.`);
      case "risucchio": return T(`Risucchio: ti curi di ${e.fatto}.`, `Drain: you heal ${e.fatto}.`);
      case "coagulo": return T(`Coagulo: la ferita si chiude, recuperi ${e.fatto} salute.`, `Clotting: the wound closes, you recover ${e.fatto} health.`);
      case "frantuma": return T(`Frantumi ${e.n} ${e.n === 1 ? "Copia" : "Copie"}.${e.mana ? ` Recuperi ${e.mana} mana.` : ""}`, `You shatter ${e.n} ${e.n === 1 ? "Copy" : "Copies"}.${e.mana ? ` You recover ${e.mana} mana.` : ""}`);
      case "truccato": return T(`Per ${e.turni} turni il nemico tira due d20 per colpirti e tiene il peggiore.`, `For ${e.turni} turns the enemy rolls two d20 to hit you and keeps the worse.`);
      case "teatro": return T(`Per ${e.turni} turni ogni Copia distrutta esplode su chi l'ha colpita.`, `For ${e.turni} turns every destroyed Copy bursts on whoever struck it.`);
      case "teatroScoppio": return T(`La Copia esplode: ${e.d} danni psichici.`, `The Copy bursts: ${e.d} psychic damage.`);
      case "doppio": return T(`Per ${e.turni} turni, con almeno 2 Copie, i tuoi attacchi magici a segno fanno +1d6 psichico.`, `For ${e.turni} turns, with at least 2 Copies, your spell attacks that hit deal +1d6 psychic.`);
      case "doppioColpo": return T(`Il tuo doppio colpisce con te: +${e.d} psichici.`, `Your double strikes with you: +${e.d} psychic.`);
      case "salaSpecchi": return T("Per tutto lo scontro il nemico ha −1 per colpirti per ogni Copia.", "For the whole fight the enemy has −1 to hit you for every Copy.");
      case "nessuno": return T(`Per ${e.turni} turni nessun colpo ti raggiunge (il Soffio sì).`, `For ${e.turni} turns no blow reaches you (the Breath does).`);
      case "nessunoQui": return T("Nessuno è qui: il colpo trova solo aria.", "No one is here: the blow finds only air.");
      case "copiaColpita": return T(`Colpisce una Copia (d${e.n + 1}: ${e.d}): svanisce, ${e.restano === 1 ? "ne resta 1" : "ne restano " + e.restano}.`, `It strikes a Copy (d${e.n + 1}: ${e.d}): it vanishes, ${e.restano} left.`);
      case "copiaMancata": return T(`Tra le Copie trova te (d${e.n + 1}: 1).`, `Among the Copies it finds you (d${e.n + 1}: 1).`);
      case "passoSfasato": return T(`Passo Sfasato: il colpo ti attraversa, resta una Copia dove eri (${e.copie}).`, `Phase Step: the blow passes through you, a Copy stays where you were (${e.copie}).`);
      case "smascherata": return T(`Il nemico smaschera una Copia: ${e.restano === 1 ? "ne resta 1" : "ne restano " + e.restano}.`, `The enemy sees through a Copy: ${e.restano} left.`);
      case "nonSmaschera": return T("Il nemico non distingue le Copie da te.", "The enemy cannot tell the Copies from you.");
      case "senzaCopie": return T("Serve almeno 1 Copia.", "You need at least 1 Copy.");
      case "unaPerTurno": return T("Una sola volta per turno.", "Only once per turn.");
      case "crosta": return T(`Il sangue si rapprende in una crosta per ${e.turni} turni: +2 alla Classe armatura, e chi ti ferisce prende 1 Ferita.`, `Your blood hardens into a scab for ${e.turni} turns: +2 Armor Class, and whoever wounds you takes 1 Wound.`);
      case "crostaColpo": return T("La crosta si spacca e il tuo sangue schizza addosso al nemico.", "The scab cracks and your blood splashes the enemy.");
      case "costellazione": return T(`Tre sfere di sangue ti girano attorno: all'inizio dei tuoi ${e.turni} turni successivi ne esplode una.`, `Three spheres of blood circle you: one bursts at the start of each of your next ${e.turni} turns.`);
      case "costellazioneScoppio": return T(`Una sfera di sangue esplode: ${e.d} danni.`, `A sphere of blood bursts: ${e.d} damage.`);
      case "emorragia": return T(`Per ${e.turni} turni le Ferite sanguinano all'inizio del turno del nemico.`, `For ${e.turni} turns the Wounds bleed at the start of the enemy's turn.`);
      case "emorragiaTick": return T(`Emorragia: ${e.n}d4 [${e.tiri.join("+")}] = ${e.d} danni.`, `Haemorrhage: ${e.n}d4 [${e.tiri.join("+")}] = ${e.d} damage.`);
      case "velenoArcTick": return T(`Il sangue velenoso lo consuma: ${e.d} danni (d${e.dado}).`, `The poisoned blood eats at it: ${e.d} damage (d${e.dado}).`);
      case "vincolo": return T(`Per ${e.turni} turni il nemico subisce metà del danno che subisci tu.`, `For ${e.turni} turns the enemy takes half the damage you take.`);
      case "vincoloColpo": return T(`Il vincolo di sangue gli restituisce ${e.d} danni.`, `The blood bond deals ${e.d} damage back to it.`);
      case "fortuna": return T("Il tuo prossimo attacco magico tira due d20 e tiene il migliore.", "Your next spell attack rolls two d20 and keeps the better.");
      case "scambio": return T(`Ti scambi con una Copia: sei libero dalla Presa e il nemico perde l'attacco speciale pronto (Copie: ${e.restano}).`, `You swap with a Copy: you are free of the Grab and the enemy loses its readied special attack (Copies: ${e.restano}).`);
      case "specchioRotto": return T("La prossima Copia distrutta rimanderà il colpo al nemico.", "The next destroyed Copy will send the blow back to the enemy.");
      case "specchioRottoScatta": return T(`Lo specchio si rompe e il colpo torna indietro: ${e.d} danni al nemico.`, `The mirror breaks and the blow comes back: ${e.d} damage to the enemy.`);
      case "labirinto": return T(`Per ${e.turni} turni il nemico smaschera le Copie con −2.`, `For ${e.turni} turns the enemy sees through Copies at −2.`);
      case "destino": return T(`Per ${e.turni} turni i tuoi attacchi magici fanno critico con 18-20 e ogni critico crea 1 Copia.`, `For ${e.turni} turns your spell attacks crit on 18-20 and every critical creates 1 Copy.`);
      case "diretto": return T(`Danno senza tiro: ${dadi(e)} = ${e.danno}${e.meta ? " (dimezzato)" : ""}.`, `Damage with no roll: ${dadi(e)} = ${e.danno}${e.meta ? " (halved)" : ""}.`);
      case "detona":
        return T(`Detonazione: ${e.n} ${e.n === 1 ? "Sigillo" : "Sigilli"} esplodono, +${e.n}d${e.dado} [${e.tiri.join("+")}] = ${e.bonus} danni.`, `Detonation: ${e.n} ${e.n === 1 ? "Seal" : "Seals"} burst, +${e.n}d${e.dado} [${e.tiri.join("+")}] = ${e.bonus} damage.`)
          + (e.mana ? T(` Recuperi ${e.mana} mana.`, ` You recover ${e.mana} mana.`) : "");
      case "detonaVuota": return T("Nessuna Ferita da far scoppiare: solo il colpo.", "No Wound to burst: just the hit.");
      case "detonaUno": return T(`Un Sigillo esplode: +1d6 [${e.d}] (ne restano ${e.restano}).`, `A Seal bursts: +1d6 [${e.d}] (${e.restano} left).`);
      case "detonaTotale": return T(`I tre colpi contano come una Detonazione: ${e.n} Sigilli, ${e.bonus} danni in più.` + (e.mana ? ` Recuperi ${e.mana} mana.` : ""), `The three blows count as one Detonation: ${e.n} Seals, ${e.bonus} extra damage.` + (e.mana ? ` You recover ${e.mana} mana.` : ""));
      case "consumo":
        return T(`Fai scoppiare ${e.n} ${e.n === 1 ? "Ferita" : "Ferite"}: ${e.tiri.length}d${e.dado} [${e.tiri.join("+")}] = ${e.danno} danni.`, `You burst ${e.n} ${e.n === 1 ? "Wound" : "Wounds"}: ${e.tiri.length}d${e.dado} [${e.tiri.join("+")}] = ${e.danno} damage.`) + (e.mana ? T(` Recuperi ${e.mana} mana.`, ` You recover ${e.mana} mana.`) : "");
      case "risonanza": return T(`Risonanza: +${e.n}d8 [${e.tiri.join("+")}] = ${e.danno} danni, i Sigilli restano.`, `Resonance: +${e.n}d8 [${e.tiri.join("+")}] = ${e.danno} damage, the Seals remain.`);
      case "svelata": return T("La scheda del nemico si apre davanti a te.", "The enemy's sheet opens before you.");
      case "runa": return T(`Una runa corre sull'arma per ${e.turni} turni: il dado sale di un passo e ogni colpo a segno incide 1 Sigillo.`, `A rune runs along the weapon for ${e.turni} turns: the die goes up a step and every hit carves 1 Seal.`);
      case "occhio": return T(`Per ${e.turni} turni i tuoi attacchi magici fanno critico con 19-20 e ogni critico incide 2 Sigilli.`, `For ${e.turni} turns your spell attacks crit on 19-20 and every crit carves 2 Seals.`);
      case "parola": return T(`Il nemico ha −4 ai tiri salvezza per ${e.turni} turni.`, `The enemy has −4 on saving throws for ${e.turni} turns.`);
      case "tomo": return T(`Il Tomo ti costa ${e.mente} di salute mentale (non letale). Per ${e.turni} turni gli incantesimi d'Arcano costano 2 in meno (minimo 1) e incidono 1 Sigillo in più.`, `The Tome costs you ${e.mente} mental health (non-lethal). For ${e.turni} turns Arcane spells cost 2 less (minimum 1) and carve 1 extra Seal.`);
      case "difesaPronta": return {
        ali: T("Ali di sangue ti avvolgono: fino al tuo turno ogni colpo farà metà danni e inciderà 1 Ferita su chi ti colpisce.", "Wings of blood wrap around you: until your turn every blow will deal half damage and carve 1 Wound on the attacker."),
        passo: T("Il prossimo colpo che ti andrebbe a segno ti attraverserà, e lascerà al tuo posto una Copia.", "The next blow that would hit you will pass through you, leaving a Copy in your place."),
        specchio: T("Il primo colpo che ti va a segno, anche più avanti nello scontro, farà metà danni e inciderà 1 Sigillo su chi ti ha colpito.", "The first blow that hits you, even later in the fight, does half damage and carves 1 Seal on whoever hit you."),
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
      case "respiroLuce": return T(`Respiro dell'Equilibrio: con la Bilancia in Vita il colpo fa 1 danno in meno (${e.prima} → ${e.dopo}).`, `Breath of Balance: with the Balance on Life the blow deals 1 less damage (${e.prima} → ${e.dopo}).`);
      case "respiroOmbra": return T("Respiro dell'Equilibrio: con la Bilancia in Negromanzia il tuo colpo fa 1 danno in più.", "Breath of Balance: with the Balance on Necromancy your blow deals 1 extra damage.");
      case "respiroAlba": return T(`Respiro dell'Alba: la Bilancia tocca ${e.zenit ? "lo Zenit" : "il Nadir"}, ti curi di 1d4 [${e.d}] + livello = ${e.fatto}.`, `Breath of Dawn: the Balance reaches ${e.zenit ? "Zenith" : "Nadir"}, you heal 1d4 [${e.d}] + level = ${e.fatto}.`);
      case "equilibrioRitrovato": return T(`Equilibrio ritrovato: sotto metà salute la Bilancia torna a 0 e ti curi di 1d6 [${e.d}] + Spirito = ${e.fatto}.`, `Balance Regained: below half health the Balance returns to 0 and you heal 1d6 [${e.d}] + Spirit = ${e.fatto}.`);
      case "fameOmbra": return T("Fame dei Morti: sotto metà salute, il tuo prossimo incantesimo di Negromanzia ti curerà di tutto il danno che infligge.", "Hunger of the Dead: below half health, your next Necromancy spell will heal you for all the damage it deals.");
      case "fameOmbraScatta": return T("Fame dei Morti: i morti ti restituiscono tutto ciò che strappano.", "Hunger of the Dead: the dead give back all they tear away.");
      case "pozzo": return T(`Pozzo Arcano: nel turno passato non hai lanciato incantesimi, recuperi ${e.n} mana.`, `Arcane Well: you cast no spell last turn, you recover ${e.n} mana.`);
      case "filo": return T("Per tutto lo scontro il nemico ha −1 per colpirti per ogni Sigillo che porta.", "For the whole fight the enemy has −1 to hit you for every Seal it carries.");
      case "prossimoSconto": return T(`Il prossimo incantesimo costerà ${e.n} in meno.`, `Your next spell will cost ${e.n} less.`);
      case "scontoInc": return e.n > 0 ? T(`Il ricamo alleggerisce l'incantesimo: costa ${e.n} in meno.`, `The embroidery lightens the spell: it costs ${e.n} less.`) : null;
      case "quiete": return T(`Per ${e.turni} turni gli incantesimi d'Arcano non costano mana: ognuno spende 1 Sigillo (senza Sigilli paghi il costo).`, `For ${e.turni} turns Arcane spells cost no mana: each spends 1 Seal (with no Seals you pay the cost).`);
      case "quieteSigillo": return T(`La quiete consuma 1 Sigillo al posto del mana (ne restano ${e.tot}).`, `The stillness spends 1 Seal instead of mana (${e.tot} left).`);
      case "pressioneTick": return T(`La pressione schiaccia il nemico: ${e.d} danni da forza.`, `The pressure crushes the enemy: ${e.d} force damage.`);
      case "guarigione": return e.n ? T(`Cura: ${dadi(e)} = ${e.tot}${e.fatto < e.tot ? ` (recuperi ${e.fatto})` : ""}.`, `Healing: ${dadi(e)} = ${e.tot}${e.fatto < e.tot ? ` (you recover ${e.fatto})` : ""}.`) : T(`Ti curi di ${e.fatto}.`, `You heal ${e.fatto}.`);
      case "fede": return T(`Recuperi ${e.n} ${e.n === 1 ? "punto" : "punti"} fede.`, `You recover ${e.n} faith.`);
      case "divora": return T(`Divori l'Avvizzito: ${e.n}d${e.dado} [${e.tiri.join("+")}] = ${e.tot} danni subito.`, `You devour the Withering: ${e.n}d${e.dado} [${e.tiri.join("+")}] = ${e.tot} damage at once.`);
      case "patto": return T(`Patto: perdi ${e.d} salute e recuperi ${e.fede} fede.`, `Pact: you lose ${e.d} health and recover ${e.fede} faith.`);
      case "nadir": return T(`I morti chiedono il loro prezzo: ${e.mente} salute mentale (non letale).`, `The dead take their price: ${e.mente} mental health (non-lethal).`);
      case "crepuscolo": return T(`Crepuscolo (${e.da === "nadir" ? "da Nadir" : "da Zenit"}): +1 dado${e.mana ? `, recuperi ${e.mana} fede` : ""}. La Bilancia torna a 0.`, `Twilight (${e.da === "nadir" ? "from Nadir" : "from Zenith"}): +1 die${e.mana ? `, you recover ${e.mana} faith` : ""}. The Balance returns to 0.`);
      case "bilancia": {
        const nome = (v) => (v === 0 ? T("equilibrio", "even") : v > 0 ? T(`Vita ${v}`, `Life ${v}`) : T(`Negromanzia ${-v}`, `Necromancy ${-v}`));
        const base = e.da === e.a ? T(`Bilancia: ${nome(e.a)}.`, `Balance: ${nome(e.a)}.`) : T(`Bilancia: ${nome(e.da)} → ${nome(e.a)}.`, `Balance: ${nome(e.da)} → ${nome(e.a)}.`);
        /* 03/11: avviso della combo pronta */
        const pronta = e.da !== e.a && e.a === 3 ? T(" Zenit: il prossimo incantesimo di Negromanzia è un Crepuscolo.", " Zenith: your next Necromancy spell is a Twilight.")
          : e.da !== e.a && e.a === -3 ? T(" Nadir: il prossimo incantesimo di Vita è un Crepuscolo (fede doppia).", " Nadir: your next Life spell is a Twilight (double faith).") : "";
        return base + pronta;
      }
      case "giudizio": return e.luce ? T(`Il Giudizio pesa ${e.luce} ${e.luce === 1 ? "punto" : "punti"} di Vita: +${e.luce}d10.`, `Judgment weighs ${e.luce} Life: +${e.luce}d10.`) : null;
      case "eccesso": return T(`La cura in eccesso ferisce il nemico: ${e.n} danni vitali.`, `The excess healing wounds the enemy: ${e.n} life damage.`);
      case "santuario": return T(`Per ${e.turni} turni il primo colpo di ogni turno fa metà danni; alla fine ti curi.`, `For ${e.turni} turns the first blow of each turn does half damage; you heal at the end.`);
      case "santuarioFine": return T(`Il santuario si dissolve e ti cura di ${e.fatto}.`, `The sanctuary fades and heals you for ${e.fatto}.`);
      case "corona": return T(`Per ${e.turni} turni il nemico subisce 1d6 vitale a inizio turno; se ti colpisce, resta Accecato 1.`, `For ${e.turni} turns the enemy takes 1d6 life at the start of its turn; if it hits you it is Blinded 1.`);
      case "coronaTick": return T(`L'aura vitale brucia il nemico: ${e.d} danni vitali.`, `The vital aura burns the enemy: ${e.d} life damage.`);
      case "avvizzitoTick": return T(`L'Avvizzito consuma il nemico: ${e.d} danni necrotici (d${e.dado}).`, `The Withering consumes the enemy: ${e.d} necrotic damage (d${e.dado}).`);
      case "voto": return T(`Per ${e.turni} turni ogni colpo d'arma a segno fa +1d4 vitale, e la Rigenerazione ti cura 1d4 all'inizio di ogni tuo turno.`, `For ${e.turni} turns every weapon hit deals +1d4 life, and Regeneration heals you 1d4 at the start of each of your turns.`);
      case "rigenInizia": return T(`Rigenerazione: per ${e.turni} turni ti curi di 1d4 all'inizio del tuo turno.`, `Regeneration: for ${e.turni} turns you heal 1d4 at the start of your turn.`);
      case "rigenera": return T(`Rigenerazione: la vita ti scorre dentro, 1d4 [${e.d}] → ti curi di ${e.fatto}.`, `Regeneration: life flows through you, 1d4 [${e.d}] → you heal ${e.fatto}.`);
      case "votoColpo": return T(`Il voto di vita colpisce: +${e.d} vitali.`, `The vow of life strikes: +${e.d} life.`);
      case "fiamma": return T(`Per ${e.turni} turni chi ti colpisce subisce 1d4 di fuoco sacro.`, `For ${e.turni} turns whoever hits you takes 1d4 sacred fire.`);
      case "fiammaColpo": return T(`La fiamma ti protegge: ${e.d} danni di fuoco sacro al nemico.`, `The flame protects you: ${e.d} sacred fire damage to the enemy.`);
      case "cerchio": return T(`Per ${e.turni} turni +2 alla Classe armatura e ai tiri salvezza; il Soffio ti fa metà danni.`, `For ${e.turni} turns +2 Armor Class and saving throws; the Breath does half damage to you.`);
      case "manto": return T("Il prossimo attacco del nemico tira 2d20 e tiene il peggiore.", "The enemy's next attack rolls 2d20 and keeps the worse.");
      case "gemella": return T(`Per ${e.turni} turni uno spirito evocato ti segue: all'inizio di ogni tuo turno colpisce da solo, 1d6 necrotico.`, `For ${e.turni} turns every spell of yours that lands deals +1d6 necrotic.`);
      case "gemellaDanno": return T(`Lo spirito servitore colpisce: ${e.d} necrotici.`, `The servant spirit strikes: ${e.d} necrotic.`);
      case "notte": return T(`Per ${e.turni} turni: nemico Accecato e Avvizzito, gli incantesimi di Negromanzia costano 2 in meno. Perdi ${e.mente} salute mentale (non letale).`, `For ${e.turni} turns: enemy Blinded and Withered, Necromancy spells cost 2 less. You lose ${e.mente} mental health (non-lethal).`);
      case "furiaCinerea": return T(`Per ${e.turni} turni gli incantesimi di Negromanzia hanno +1 dado e ti curano della metà dei danni; la Bilancia resta a Negromanzia 3.`, `For ${e.turni} turns Necromancy spells have +1 die and heal you for half the damage; the Balance stays at Necromancy 3.`);
      case "lutto": return T("Per tutto lo scontro Nadir non ti costa salute mentale.", "For the whole fight Nadir costs you no mental health.");
      case "rancore": return T(`Rancore: +${e.n}d6 per i colpi subiti.`, `Grudge: +${e.n}d6 for the blows taken.`);
      case "seconda": return T("Il prossimo colpo che ti porterebbe a 0 ti lascia a 1 e ti cura.", "The next blow that would take you to 0 leaves you at 1 and heals you.");
      case "secondaVitaUsata": return T(`Seconda Vita: resti a 1 (${e.evitato} danni evitati) e ti curi di ${e.cura}.`, `Second Life: you stay at 1 (${e.evitato} damage avoided) and heal ${e.cura}.`);
      case "liberato": return T("Sei libero dalla Presa: il nemico non può più afferrarti.", "You are free of the Grab: the enemy can no longer seize you.");
      case "giaUsataScontro": return T("Già usato in questo scontro.", "Already used in this fight.");
      case "giaUsataRiposo": return T("Già usato dall'ultimo riposo.", "Already used since the last rest.");
      case "difesaDiFila": return T("Non puoi usare due turni di fila un incantesimo che consuma l'azione.", "You cannot use a spell that takes your action two turns in a row.");
      case "runeBruciano": return T(`Le rune bruciano: +${e.n} ${e.n === 1 ? "danno" : "danni"} (Sutura).`, `The runes burn: +${e.n} damage (Suture).`);
      case "senzaSigilli": return T("Serve almeno 1 Ferita sul nemico.", "You need at least 1 Wound on the enemy.");
      default: return null;
    }
  }

  /* 04/11: la via di prestigio è la scuola. classe = "Sapiente" | "Accolito", via = "aldo" | "guendalina" → scuola potenziata (o null).
     Si legge dalle abilità della via in MAGIA.VIE: Aldo → Sangue / Negromanzia, Guendalina → Illusione / Vita. */
  const POTENZIAMENTI_VIA = {
    sangue: { it: "Ferite piene anche sui boss; l'Ebollizione cura 3 per Ferita invece di 2", en: "Full Wounds even on bosses; Boiling Blood heals 3 per Wound instead of 2" },
    illusione: { it: "fino a 4 Copie; i boss smascherano con −2", en: "up to 4 Copies; bosses see through them at −2" },
    luce: { it: "la Rigenerazione dura 1 turno in più", en: "Regeneration lasts 1 more turn" },
    ombra: { it: "Avvizzito con un dado più grande (1d4 → 1d6)", en: "Withered with a bigger die (1d4 → 1d6)" }
  };
  function scuolaDellaVia(classe, via) {
    const MG = root.MAGIA; if (!MG || !via || !MG.CLASSI[classe]) return null;
    const v = MG.VIE.find(x => x.via === via && MG.CLASSI[classe].includes(x.scuola));
    return v ? v.scuola : null;
  }
  /* 04/11 sera: colpi d'arma con la Lama Coagulata (+1d4 e 1 Ferita); da chiamare dopo un colpo d'arma a segno */
  function suColpoArma(s, ctx) {
    if (!attivo(s, "lama") || !(s.pv > 0)) return [];
    const d = ctx.tira(4); s.pv -= d; return [{ k: "lamaColpo", d }, C.incidi(s, ctx, 1)];
  }
  /* 04/11 sera: Coagulo, da chiamare dopo che il danno del colpo è stato applicato (solo se il personaggio è in piedi) */
  function coagula(n, ctx) { if (!(n > 0) || !ctx || !ctx.cura) return []; const f = ctx.cura(n); return f > 0 ? [{ k: "coagulo", n, fatto: f }] : []; }
  /* 04/11 sera: a inizio del tuo turno la Condensazione torna disponibile */
  function inizioTurnoArcanista(s) { if (s) s.condensOra = false; }
  const API = { POTENZIAMENTI_VIA, scuolaDellaVia, UNA_PER_RIPOSO, DIFESE, SERVONO_SIGILLI, SERVONO_COPIE, GRATUITE, POZZO_SCONTO, puoVersare, suColpoArma, coagula, inizioTurnoArcanista, etichette, comboPronta, gradoPozzo, gradoTratto: gradoPozzo, inizioTurnoPozzo, inizioTurnoMonaco, sottoMetaMonaco, recupero, costo, disponibile, lancia, inizioTurnoNemico, haTick, bonusTsPg, secondaVita, scaduti, testo };
  root.MagiaCombattimento = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof window !== "undefined" ? window : globalThis);
