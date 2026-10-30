/* =====================================================================
   SCIAMANO IN COMBATTIMENTO — le tecniche della natura (classe interna "Forestiero"), senza interfaccia.
   Lo usano gioco.html, la sala di prova (tutorial.html?prova) e i test (tests/sciamano.test.js).
   Stessa filosofia di js/combattimento.js e js/magia_combattimento.js: i dati sono in js/tecniche.js (tipo "Natura"),
   le regole stanno qui, i testi (testo(e)) li mostra chi disegna. Regole: docs/tecniche_sciamano.md.

   Uso: Sciamano.usa(t, s, ctx) → { eventi, costo, rifiutata? }
     s   = stato dello scontro (lo stesso di Combattimento): pv, pvMax, eff, effMax, più
           velenoDado (4 Avvelenato, 6 Tossina), rivest (id del rivestimento attivo), rivestTs, trappola (id), trappolaColpito,
           morbo (cariche), corteccia (Scudo di Corteccia), naturaPresa (recupero già preso in questo turno del nemico)
     ctx = ambiente: { tira(d), liv, modAtt, modDanno, dado, ca(), boss, cd (8 + Vigore + livello), modTs (Vigore del nemico),
                       modSpirito, resisteVeleno, linfaRigeneratrice, curaPg(n), dannoPg(n), naturaPiu(n) → recuperati,
                       usataPerRiposo(id), segnaPerRiposo(id) }
   Turno del nemico (chi gestisce lo scontro):
     tickNemico(s, ctx)        all'inizio di ogni suo turno (azzera il recupero del turno; veleno, bulbo, marea)
     scattaTrappola(s, ctx)    prima di ogni suo attacco (anche Soffio e Presa), se non è stordito
     difesa(s, ctx, danno)     per ogni danno che ti arriva (Pelle di Corteccia, Scudo di Corteccia) → { danno, eventi }
     cureFineTurno(s, ctx)     alla fine del suo turno, prima che gli effetti scalino (cure «all'inizio del tuo turno»)
     scaduti(s, finiti, ctx)   dopo che gli effetti sono scalati (fine di Linfa Furiosa e del rivestimento)
   Attacchi normali del giocatore: suColpo(s, ctx, colpo) per ogni colpo a segno (rivestimento), attaccoFuria(s, ctx) dopo l'azione.
   ===================================================================== */
(function (root) {
  const C = root.Combattimento || (typeof require === "function" ? require("./combattimento.js") : null);
  const R = root.Regole || {};
  const RECUPERO = R.IRA_PER_COLPO || [1, 1, 2, 2, 3]; /* stessa tabella dell'ira, per evento della natura */
  const SCUDO_BASE = 5;        /* Scudo di Corteccia: massimo 5 + livello */
  const FAME = 3;              /* Fame del Parassita: punti natura */
  const RIVESTIMENTO = 3;      /* turni di un rivestimento */
  const MORBO_MAX = 3;         /* cariche di Morbo che fanno scattare il Frastornato */

  const attivo = C.attivo;
  const tiraDadi = (ctx, n, d) => Array.from({ length: n }, () => ctx.tira(d));
  const somma = (a) => a.reduce((x, y) => x + y, 0);
  const liv = (ctx) => Math.max(1, Math.min(5, Number(ctx && ctx.liv) || 1));
  const tossina = (s) => attivo(s, "avvelenato") && Number(s.velenoDado) === 6;
  const scudoMax = (ctx) => SCUDO_BASE + liv(ctx);
  const recupero = (ctx, doppio) => RECUPERO[liv(ctx) - 1] * (doppio ? 2 : 1);

  /* ---------- Recupero di natura: dai danni della natura, al massimo uno per turno del nemico, doppio con Tossina ---------- */
  function natura(s, ctx, fonte) {
    if (s.naturaPresa) return null;
    s.naturaPresa = true;
    const doppio = tossina(s), n = recupero(ctx, doppio);
    const preso = ctx.naturaPiu ? ctx.naturaPiu(n) : n;
    return { k: "natura", n, preso: Number(preso) || 0, doppio, fonte };
  }

  /* ---------- Veleno: Avvelenato (1d4) o Tossina (1d6). Si rinnova, non si somma; la Tossina resta finché dura ---------- */
  function veleno(s, ctx, dado, turni) {
    const gia = attivo(s, "avvelenato");
    s.velenoDado = gia ? Math.max(Number(s.velenoDado) || 4, dado) : dado;
    const e = C.metti(s, ctx, "avvelenato", turni);
    return { k: "veleno", dado: s.velenoDado, turni: e.turni, ridotto: e.ridotto };
  }
  /* danno da veleno contro chi resiste (Dafne, il sovrano): metà, per difetto */
  const dimezza = (ctx, d) => (ctx && ctx.resisteVeleno ? Math.floor(d / 2) : d);

  /* ---------- Scudo di Corteccia: salute temporanea per tutto lo scontro, massimo 5 + livello ---------- */
  function scudo(s, ctx, n) {
    const max = scudoMax(ctx), prima = Number(s.corteccia) || 0, dopo = Math.min(max, prima + n);
    s.corteccia = dopo;
    const E = [{ k: "scudoCorteccia", n: dopo - prima, tot: dopo, max }];
    const nat = natura(s, ctx, "scudo"); if (nat) E.push(nat);
    return E;
  }

  /* tiro salvezza del nemico (sul corpo: d20 + suo Vigore); se lo fallisce è un evento di recupero */
  function tiro(s, ctx, E) {
    const z = C.ts(ctx); E.push(z);
    if (z.ok) { E.push({ k: "resiste" }); return false; }
    const nat = natura(s, ctx, "ts"); if (nat) E.push(nat);
    return true;
  }

  /* ---------- Rivestimento: l'effetto di ogni colpo a segno finché è attivo ---------- */
  function suColpo(s, ctx, ev) {
    const E = [];
    if (!ev || !ev.ok || !s.rivest || !attivo(s, "rivest")) return E;
    const vivo = () => s.pv > 0, fx = (k, n) => E.push(C.metti(s, ctx, k, n));
    switch (s.rivest) {
      case "mandragora": if (vivo()) E.push(veleno(s, ctx, 4, 2)); break;
      case "muffa": if (vivo()) fx("sbilanciato", 2); break;
      case "spore_paralizzanti":
        if (!vivo()) break;
        fx("debole", 1);
        if (!s.rivestTs) { /* il tiro salvezza vale per il primo colpo a segno del rivestimento */
          s.rivestTs = true;
          if (ctx.boss) { E.push({ k: "immune", s: "bloccato" }); fx("debole", 2); }
          else if (tiro(s, ctx, E)) fx("bloccato", 1);
        }
        break;
      case "miasma": if (vivo()) { E.push(veleno(s, ctx, 4, 2)); fx("sbilanciato", 2); } break;
      case "morbo":
        if (!vivo()) break;
        s.morbo = (Number(s.morbo) || 0) + 1; E.push({ k: "morbo", tot: Math.min(MORBO_MAX, s.morbo), max: MORBO_MAX });
        if (s.morbo >= MORBO_MAX) {
          s.morbo = 0;
          if (ctx.boss) { E.push({ k: "immune", s: "frastornato" }); fx("debole", 2); } else fx("frastornato", 1);
        }
        break;
      case "balsamo": { /* metà del colpo torna al nemico e diventa corteccia */
        const meta = Math.floor((Number(ev.danno) || 0) / 2);
        if (meta > 0) { s.pv += meta; E.push({ k: "balsamo", meta }); E.push(...scudo(s, ctx, meta)); }
        break;
      }
    }
    return E;
  }

  /* ---------- Linfa Furiosa: un attacco in più col solo dado dopo ogni azione d'attacco ---------- */
  function attaccoFuria(s, ctx) {
    if (!attivo(s, "linfaFuria") || !(s.pv > 0)) return [];
    const E = [{ k: "furiaAttacco" }], r = C.colpo(s, ctx, { conMod: false });
    E.push(r); if (r.ok) E.push(...suColpo(s, ctx, r));
    return E;
  }

  /* ---------- Le tecniche ---------- */
  function usa(t, s, ctx) {
    s.eff = s.eff || {}; s.effMax = s.effMax || {};
    if (t.passiva) return { eventi: [{ k: "passiva" }], costo: 0, rifiutata: true };
    if (t.unaPerRiposo && ctx.usataPerRiposo && ctx.usataPerRiposo(t.id)) return { eventi: [{ k: "giaUsataRiposo" }], costo: 0, rifiutata: true };
    if (t.unaPerRiposo && ctx.segnaPerRiposo) ctx.segnaPerRiposo(t.id);
    const E = [], vivo = () => s.pv > 0, piu = ctx.linfaRigeneratrice ? 1 : 0;
    let attacco = false;
    const hit = (o) => { attacco = true; const r = C.colpo(s, ctx, o); E.push(r); if (r.ok) E.push(...suColpo(s, ctx, r)); return r; };
    const fx = (k, n) => E.push(C.metti(s, ctx, k, n));
    const mio = (k, n) => { s.eff[k] = n; s.effMax[k] = Math.max(s.effMax[k] || 0, n); }; /* effetti sul personaggio: niente regole dei boss */
    const rivesti = (id) => { s.rivest = id; s.rivestTs = false; mio("rivest", RIVESTIMENTO); E.push({ k: "rivestimento", id, turni: RIVESTIMENTO }); };
    const trappola = (id) => { s.trappola = id; E.push({ k: "trappolaPronta", id }); };
    const cura = (n) => { if (ctx.curaPg) ctx.curaPg(n); };
    let r;
    switch (t.id) {
      /* ---- livello 1 ---- */
      case "mandragora": rivesti(t.id); hit(); break;
      case "micelio": r = hit(); if (r.ok && vivo()) fx("debole", 2); break;
      case "infuso": { const n = ctx.tira(4); cura(n); mio("infuso", 2 + piu); E.push({ k: "infuso", n, turni: 2 + piu }, { k: "purifica" }); break; }
      /* ---- livello 2 ---- */
      case "muffa": rivesti(t.id); hit(); break;
      case "baccello": hit(); trappola(t.id); break;
      case "corteccia": hit(); mio("pelle", 1); E.push({ k: "pelle" }); break;
      /* ---- livello 3 ---- */
      case "spore_paralizzanti": rivesti(t.id); hit(); break;
      case "radici":
        if (ctx.boss) { E.push({ k: "immune", s: "silenzio" }); fx("sbilanciato", 2); }
        else if (tiro(s, ctx, E)) { fx("sbilanciato", 2); fx("silenzio", 2); }
        else fx("sbilanciato", 1);
        break;
      case "fumo": fx("accecato", 2); E.push(C.guardia(s, 2, 2)); break;
      /* ---- livello 4 ---- */
      case "miasma": rivesti(t.id); hit({ piuDadi: 1 }); break;
      case "botola": hit(); trappola(t.id); break;
      case "linfa_furiosa": hit(); mio("linfaFuria", 3); E.push({ k: "furia", turni: 3 }); break;
      /* ---- livello 5 ---- */
      case "fioritura": mio("bulbo", 3); E.push({ k: "bulbo", turni: 3 }); break;
      case "cuore_tossina": {
        const era = attivo(s, "avvelenato");
        r = hit({ piuDadi: 1 });
        if (r.ok && vivo()) { if (era) { E.push(veleno(s, ctx, 6, 3)); fx("debole", 3); } else E.push(veleno(s, ctx, 4, 2)); }
        break;
      }
      case "abbraccio":
        r = hit({ piuDadi: 1 });
        if (r.ok && vivo()) {
          if (ctx.boss) { E.push({ k: "immune", s: "silenzio" }); fx("sbilanciato", 2); fx("debole", 2); }
          else if (tiro(s, ctx, E)) { fx("silenzio", 3); fx("sbilanciato", 3); }
        }
        E.push(C.guardia(s, 2, 3));
        break;
      /* ---- via di Aldo: Signore delle Spore Putride ---- */
      case "morbo": rivesti(t.id); hit(); break;
      case "cisti": hit(); trappola(t.id); break;
      case "marea_putrefazione": mio("marea", 3); E.push({ k: "marea", turni: 3 }); fx("sbilanciato", C.PER_SCONTRO); break;
      /* ---- via di Guendalina: Custode dei Boschi Sacri ---- */
      case "balsamo": rivesti(t.id); hit(); break;
      case "aura": mio("aura", 3 + piu); E.push({ k: "aura", turni: 3 + piu }, { k: "purifica" }); break;
      case "rinascita": {
        const tiri = tiraDadi(ctx, 2, 6), n = somma(tiri) + liv(ctx);
        cura(n); mio("rinascita", 2 + piu);
        E.push({ k: "purifica" }, { k: "rinascita", tiri, liv: liv(ctx), n, turni: 2 + piu });
        break;
      }
      default: E.push({ k: "sconosciuta" });
    }
    /* Linfa Furiosa: dopo ogni azione d'attacco, anche quella che la attiva */
    if (attacco && vivo()) E.push(...attaccoFuria(s, ctx));
    return { eventi: E, costo: t.costo };
  }

  /* ---------- Inizio del turno del nemico: veleno, bulbo, marea ---------- */
  const haTick = (s) => attivo(s, "avvelenato") || attivo(s, "bulbo") || attivo(s, "marea");
  function tickNemico(s, ctx) {
    s.eff = s.eff || {}; s.naturaPresa = false; /* da qui riparte il «massimo uno per turno» */
    const E = [], add = (e) => { if (e) E.push(e); };
    if (attivo(s, "avvelenato")) {
      const dado = Number(s.velenoDado) || 4, nd = ctx.vulnVeleno ? 2 : 1, tiri = tiraDadi(ctx, nd, dado), d = somma(tiri), danno = dimezza(ctx, d); /* 30/10: vulnerabile al veleno (Enea) → un dado in più */
      s.pv -= danno; E.push({ k: "velenoTick", d, dado, danno, dimezzato: !!ctx.resisteVeleno, ...(nd > 1 ? { vuln: true, tiri } : {}) });
      if (danno > 0) add(natura(s, ctx, "veleno"));
    }
    if (attivo(s, "bulbo") && s.pv > 0) {
      const d = ctx.tira(6), danno = dimezza(ctx, d);
      s.pv -= danno; E.push({ k: "bulboTick", d, danno, dimezzato: !!ctx.resisteVeleno });
      if (danno > 0) add(natura(s, ctx, "bulbo"));
      if (s.pv > 0) { E.push(veleno(s, ctx, 4, 2)); E.push(C.metti(s, ctx, "sbilanciato", 2)); }
      if (s.eff.bulbo === 1 && s.pv > 0) { /* terzo turno: esplode */
        const tiri = tiraDadi(ctx, 2, 6), m = Number(ctx.modSpirito) || 0, dn = Math.max(1, somma(tiri) + m);
        s.pv -= dn; E.push({ k: "bulboEsplode", tiri, m, danno: dn });
        if (s.pv > 0) {
          if (ctx.boss) { E.push({ k: "immune", s: "bloccato" }); E.push(C.metti(s, ctx, "debole", 2)); }
          else if (tiro(s, ctx, E)) E.push(C.metti(s, ctx, "bloccato", 1));
        }
      }
    }
    if (attivo(s, "marea") && s.pv > 0) {
      const d = ctx.tira(6); s.pv -= d; E.push({ k: "mareaTick", d });
      add(natura(s, ctx, "acido"));
    }
    return E;
  }

  /* ---------- La trappola scatta prima dell'attacco del nemico ---------- */
  function scattaTrappola(s, ctx) {
    if (!s.trappola) return [];
    const id = s.trappola; s.trappola = null; s.trappolaColpito = true;
    const E = [{ k: "trappolaScatta", id }], fx = (k, n) => E.push(C.metti(s, ctx, k, n));
    const nat = natura(s, ctx, "trappola"); if (nat) E.push(nat);
    switch (id) {
      case "baccello": fx("accecato", 2); break;
      case "botola":
        if (ctx.boss) { E.push({ k: "immune", s: "frastornato" }); fx("accecato", 2); break; }
        { const z = C.ts(ctx); E.push(z); if (z.ok) { E.push({ k: "resiste" }); fx("accecato", 2); } else fx("frastornato", 2); }
        break;
      case "cisti": fx("sbilanciato", 2); E.push(veleno(s, ctx, 6, 3)); break;
    }
    return E;
  }

  /* ---------- Danni al personaggio: Pelle di Corteccia (primo colpo a metà + acido), poi lo Scudo di Corteccia ---------- */
  function difesa(s, ctx, danno) {
    const E = []; let d = Number(danno) || 0;
    const add = (e) => { if (e) E.push(e); };
    if (d > 0 && attivo(s, "pelle")) {
      s.eff.pelle = 0;
      const prima = d; d = Math.floor(d / 2);
      const a = ctx.tira(4); s.pv -= a;
      E.push({ k: "pelleColpo", prima, dopo: d, acido: a });
      add(natura(s, ctx, "acido"));
    }
    if (d > 0 && (Number(s.corteccia) || 0) > 0) {
      const ass = Math.min(s.corteccia, d), prima = d;
      s.corteccia -= ass; d -= ass;
      E.push({ k: "scudoAssorbe", prima, dopo: d, assorbiti: ass, resta: s.corteccia });
      add(natura(s, ctx, "scudo"));
    }
    return { danno: d, eventi: E };
  }

  /* ---------- Fine del turno del nemico, prima che gli effetti scalino: le cure «all'inizio del tuo turno» ---------- */
  function cureFineTurno(s, ctx) {
    const E = [];
    const cura = (fonte) => { const n = ctx.tira(4); if (ctx.curaPg) ctx.curaPg(n); E.push({ k: "curaTurno", n, fonte }); };
    if (attivo(s, "infuso")) cura("infuso");
    if (attivo(s, "aura")) cura("aura");
    if (attivo(s, "bulbo")) cura("bulbo");
    if (attivo(s, "rinascita")) { /* il punto natura della Rinascita è a parte dal recupero normale */
      cura("rinascita");
      const p = ctx.naturaPiu ? ctx.naturaPiu(1) : 1;
      E.push({ k: "naturaRinascita", n: 1, preso: Number(p) || 0 });
    }
    return E;
  }
  /* dopo che gli effetti sono scalati: la Linfa Furiosa presenta il conto, il rivestimento si esaurisce */
  function scaduti(s, finiti, ctx) {
    const E = [];
    if (finiti.includes("linfaFuria")) { const d = ctx.tira(6); if (ctx.dannoPg) ctx.dannoPg(d); E.push({ k: "furiaFine", d }); }
    if (finiti.includes("rivest")) { E.push({ k: "rivestFine", id: s.rivest }); s.rivest = null; s.rivestTs = false; }
    return E;
  }
  /* Fame del Parassita: il nemico muore Avvelenato o dopo essere caduto in una trappola */
  const fame = (s) => !!s && (attivo(s, "avvelenato") || !!s.trappolaColpito);

  /* ---------- testi (IT/EN): una riga per evento. Colpi, tiri salvezza e stati comuni li scrive già chi mostra lo scontro ---------- */
  const T = (it, en) => (root.Lingua && typeof root.Lingua.t === "function" ? root.Lingua.t({ it, en }) : it);
  const nomeTec = (id) => { const t = (root.TECNICHE || []).find(x => x.id === id); return t ? T(t.nome.it, t.nome.en) : id; };
  const turni = (n) => T(n === 1 ? "1 turno" : `${n} turni`, n === 1 ? "1 turn" : `${n} turns`);
  const FONTI = { infuso: ["La linfa vitale", "The lifesap"], aura: ["L'aura", "The aura"], bulbo: ["Il bulbo", "The bulb"], rinascita: ["Il sottobosco", "The undergrowth"] };
  function testo(e) {
    switch (e.k) {
      case "veleno": return (e.dado === 6 ? T(`Tossina: 1d6 danni per ${turni(e.turni)}.`, `Toxin: 1d6 damage for ${turni(e.turni)}.`) : T(`Il nemico è Avvelenato: 1d4 danni per ${turni(e.turni)}.`, `The enemy is Poisoned: 1d4 damage for ${turni(e.turni)}.`))
        + (e.ridotto ? " " + T("Contro un avversario di questo calibro dura al massimo 2 turni.", "Against a foe of this calibre it lasts at most 2 turns.") : "");
      case "velenoTick": return e.dimezzato ? T(`Il veleno brucia, ma il nemico gli resiste: ${e.d} → ${e.danno} danni.`, `The poison burns, but the enemy resists it: ${e.d} → ${e.danno} damage.`) : e.vuln ? T(`Il veleno brucia, e il nemico non sa difendersene: ${e.tiri.join(" + ")} = ${e.danno} danni.`, `The poison burns, and the enemy has no defence against it: ${e.tiri.join(" + ")} = ${e.danno} damage.`) : T(`Il veleno brucia: ${e.danno} danni.`, `The poison burns: ${e.danno} damage.`);
      case "natura": return e.preso > 0 ? T(`Forza della natura: +${e.preso} punti natura${e.doppio ? " (doppio: Tossina)" : ""}.`, `Force of nature: +${e.preso} nature points${e.doppio ? " (doubled: Toxin)" : ""}.`) : T("Forza della natura: i tuoi punti natura sono già al massimo.", "Force of nature: your nature points are already full.");
      case "rivestimento": return T(`L'arma è rivestita (${nomeTec(e.id)}) per ${turni(e.turni)}: ogni colpo a segno ne porta l'effetto.`, `Your weapon is coated (${nomeTec(e.id)}) for ${turni(e.turni)}: every hit carries its effect.`);
      case "rivestFine": return T(`Il rivestimento si esaurisce (${nomeTec(e.id)}).`, `The coating wears off (${nomeTec(e.id)}).`);
      case "trappolaPronta": return T(`${nomeTec(e.id)}: la trappola è pronta e scatterà al prossimo attacco del nemico.`, `${nomeTec(e.id)}: the trap is set and will spring at the enemy's next attack.`);
      case "trappolaScatta": return T(`La trappola scatta: ${nomeTec(e.id)}!`, `The trap springs: ${nomeTec(e.id)}!`);
      case "morbo": return T(`Morbo: ${e.tot}/${e.max} cariche.`, `Blight: ${e.tot}/${e.max} charges.`);
      case "pelle": return T("La pelle si indurisce di corteccia e resina: il primo colpo che subirai farà metà danni.", "Your skin hardens with bark and resin: the first blow you take will deal half damage.");
      case "pelleColpo": return T(`La corteccia attutisce il colpo (${e.prima} → ${e.dopo} danni) e l'acido brucia l'aggressore: ${e.acido} danni.`, `The bark softens the blow (${e.prima} → ${e.dopo} damage) and the acid burns the attacker: ${e.acido} damage.`);
      case "scudoCorteccia": return e.n > 0 ? T(`Scudo di Corteccia: +${e.n} (${e.tot}/${e.max}).`, `Bark Shield: +${e.n} (${e.tot}/${e.max}).`) : T(`Lo Scudo di Corteccia è già al massimo (${e.tot}/${e.max}).`, `The Bark Shield is already full (${e.tot}/${e.max}).`);
      case "scudoAssorbe": return T(`Lo Scudo di Corteccia assorbe ${e.assorbiti} danni: ${e.prima} → ${e.dopo} (ne resta ${e.resta}).`, `The Bark Shield absorbs ${e.assorbiti} damage: ${e.prima} → ${e.dopo} (${e.resta} left).`);
      case "balsamo": return T(`Il balsamo trattiene metà del colpo (${e.meta}) e la trasforma in corteccia.`, `The balm holds back half the blow (${e.meta}) and turns it into bark.`);
      case "infuso": return T(`Recuperi ${e.n} punti di salute; la linfa continuerà a curarti per ${turni(e.turni)}.`, `You recover ${e.n} health; the sap will keep healing you for ${turni(e.turni)}.`);
      case "aura": return T(`L'Aura di Purificazione ti avvolge per ${turni(e.turni)}.`, `The Purifying Aura surrounds you for ${turni(e.turni)}.`);
      case "rinascita": return T(`Rinascita: 2d6 [${e.tiri.join(" + ")}] + ${e.liv} = ${e.n} punti di salute; per ${turni(e.turni)} il sottobosco continuerà a curarti.`, `Rebirth: 2d6 [${e.tiri.join(" + ")}] + ${e.liv} = ${e.n} health; for ${turni(e.turni)} the undergrowth will keep healing you.`);
      case "purifica": return T("Ogni stato che ti affliggeva svanisce.", "Every condition afflicting you fades away.");
      case "curaTurno": { const f = FONTI[e.fonte] || ["", ""]; return T(`${f[0]}: recuperi ${e.n} punti di salute.`, `${f[1]}: you recover ${e.n} health.`); }
      case "naturaRinascita": return T(`Il sottobosco ti restituisce ${e.preso} punto natura.`, `The undergrowth gives you back ${e.preso} nature point.`);
      case "furia": return T(`La linfa furiosa ti accende per ${turni(e.turni)}: dopo ogni attacco ne fai un altro.`, `The furious sap fires you up for ${turni(e.turni)}: after each attack you make another.`);
      case "furiaAttacco": return T("La linfa furiosa ti spinge a colpire ancora:", "The furious sap drives you to strike again:");
      case "furiaFine": return T(`La linfa furiosa si spegne e ti lascia svuotato: ${e.d} danni.`, `The furious sap burns out and leaves you drained: ${e.d} damage.`);
      case "bulbo": return T(`Il bulbo primordiale affonda le radici: vivrà ${turni(e.turni)}.`, `The primordial bulb sinks its roots: it will live ${turni(e.turni)}.`);
      case "bulboTick": return e.dimezzato ? T(`Il bulbo pulsa, ma il nemico resiste al veleno: ${e.d} → ${e.danno} danni.`, `The bulb pulses, but the enemy resists poison: ${e.d} → ${e.danno} damage.`) : T(`Il bulbo pulsa di spore: ${e.danno} danni da veleno.`, `The bulb pulses with spores: ${e.danno} poison damage.`);
      case "bulboEsplode": return T(`Il bulbo esplode: 2d6 [${e.tiri.join(" + ")}] ${e.m < 0 ? "−" : "+"} ${Math.abs(e.m)} = ${e.danno} danni.`, `The bulb bursts: 2d6 [${e.tiri.join(" + ")}] ${e.m < 0 ? "−" : "+"} ${Math.abs(e.m)} = ${e.danno} damage.`);
      case "marea": return T(`La marea di putrefazione ristagna per ${turni(e.turni)}.`, `The tide of rot lingers for ${turni(e.turni)}.`);
      case "mareaTick": return T(`L'aria corrosiva lo brucia: ${e.d} danni da acido.`, `The corrosive air burns it: ${e.d} acid damage.`);
      case "fame": return T(`Fame del Parassita: +${e.preso} punti natura.`, `Parasite's Hunger: +${e.preso} nature points.`);
      case "passiva": return T("È una capacità passiva: è sempre attiva.", "It is a passive ability: it is always active.");
      default: return null;
    }
  }

  const API = {
    RECUPERO, SCUDO_BASE, FAME, RIVESTIMENTO, MORBO_MAX,
    scudoMax, recupero, tossina, natura, veleno, scudo, suColpo, attaccoFuria, usa,
    haTick, tickNemico, scattaTrappola, difesa, cureFineTurno, scaduti, fame, testo
  };
  root.Sciamano = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof window !== "undefined" ? window : globalThis);
