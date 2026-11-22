/* =====================================================================
   SCONTRO — attacchi, turni, reazioni e poteri delle specializzazioni sul motore nuovo (js/poteri.js).
   Blocco 2 (08/11/2026), riscritto il 15/11/2026 sulle decisioni del 10-14/11: specializzazioni offensiva / difensiva
   (Berserker, Paladino, Funghi, Legno, Realtà, Illusione, Sangue, Ossa), privilegi ai livelli 1/3/5, vie al 2-4,
   azione rapida, due armi, scudi di PF, colpo gratuito, stati del sovrano.
   Contratto: docs/riscrittura_meccaniche.md e docs/decisioni_14_novembre.md. Nessuna risorsa: a volontà / per scontro / giornalieri.

   Combattente (oltre ai campi di Poteri): { caBase, modClasse, modAtt?, modDanno?, arma: { dado, n, tipo, bonus, critDa }, scudo,
     armi?: [arma, arma] (al massimo due), focus?: { dado, bonus }, spec, via, liv,
     poteri: [id], tratti: [id], usati: { scontro: {}, giorno: {} }, buff: {} }
   I nemici possono dare modAtt / modDanno a parte (es. «+2 / 1d6 + 1»); altrimenti vale modClasse.
   ctx = { tira(d) }.  Gli eventi sono dati; i testi li scrive chi li mostra.
   ===================================================================== */
(function (root) {
  const O = () => root.Oggetti || (typeof require === "function" ? require("./oggetti.js") : null);
  const P = root.Poteri || (typeof require === "function" ? require("./poteri.js") : null);

  /* lo stato che l'arma applica: taglio logora, contundente controlla, perforante prepara il critico */
  const STATO_ARMA = { taglio: "sanguinante", contundente: "stordito", perforante: "esposto" };
  const statoArma = (b) => STATO_ARMA[b.arma && b.arma.tipo] || null;
  const critBaseArma = (b) => (b.arma && b.arma.critDa) || (b.arma && b.arma.tipo === "perforante" ? 19 : 20);

  const pronto = (b) => { b.buff = b.buff || {}; b.usati = b.usati || { scontro: {}, giorno: {} }; b.stati = b.stati || {}; return b; };
  /* set di classe (set_di_classe.md): pezzi addosso e poteri attivi */
  const pezziClasse = (b, id) => (O() ? O().pezziSet(b, id) : 0);
  const fonteDi = (b) => ({ liv: b.liv, modClasse: b.modClasse || 0, cdBonus: (pezziClasse(b, "sapiente") >= 2 ? 1 : 0) + (b.lampoAttivo ? 2 : 0) });
  /* il bonus +N è dell'arma; i poteri degli incantatori (o.focus) prendono dall'arma dado e bonus, e il focus aggiunge il suo
     (ASSUNZIONE 15/11: i due bonus si sommano, es. Focus rinforzato +1). «Una spada è sempre una spada». */
  const focusOk = (b) => !!b.focus && !(b.arma && b.arma.dueMani && !b.arma.eFocus); /* un'arma a due mani toglie il focus (il bastone è entrambi) */
  const bonusEq = (b, o) => ((b.arma && b.arma.bonus) || 0) + (o && o.focus && focusOk(b) ? (b.focus.bonus || 0) : 0);
  /* dado dei poteri degli incantatori: il dado dell'arma, oppure quello del focus se è più alto (10/11/2026).
     19/11: il focus ha due forme, normale d8 e scudo d6 (un gradino sotto): il suo dado è b.focus.dado (d8 se manca, come prima). */
  const dadoIncanto = (b) => { const d = (b.arma && b.arma.dado) || 6; return focusOk(b) ? Math.max(d, Number(b.focus.dado) || 8) : d; };
  const mAtt = (b, o) => (b.modAtt != null ? b.modAtt : b.modClasse || 0) + bonusEq(b, o);
  const mDanno = (b, o) => (b.modDanno != null ? b.modDanno : b.modClasse || 0) + bonusEq(b, o);
  const meta = (n) => Math.ceil(n / 2); /* le metà si arrotondano per eccesso, come le resistenze */
  const COPIE_MAX = 3;
  const buffCA = (b) => Object.values(b.buff || {}).reduce((t, x) => t + (Number(x.ca) || 0), 0);
  /* caVacillante: armatura che cede da Vacillante (mastino corazzato: la runa del petto si spegne, 15 → 13) */
  const ca = (b) => (P.vacillante(b) && b.caVacillante != null ? b.caVacillante : (b.caBase || 10)) + buffCA(b) - P.malusCA(b);
  const tiraDadi = (ctx, n, d) => Array.from({ length: n }, () => ctx.tira(d));
  const somma = (a) => a.reduce((x, y) => x + y, 0);

  /* ---------- Applicare lo stato dell'arma ---------- */
  /* esito: { ok } condiviso dentro lo stesso potere (un TS solo per potere) */
  function statoSu(att, dif, modo, ctx, id, esito, extra) {
    const k = id || statoArma(att); if (!k) return [];
    pronto(dif);
    if (att.senzaStati) return []; /* colpo gratuito (Senza scampo): non applica stati */
    if (dif.intoccabile) return [{ k: "intoccabile", chi: dif.nome }];
    /* armatura integra del sovrano: gli stati durano 1 turno e non si aggravano (8e) */
    if (dif.statiCorti) modo = "applica";
    const segno = att.segnoAttivo && att !== dif ? { senzaTs: true } : {}; /* Segno sulla mappa: lo stato entra senza TS, solo per quel colpo */
    const E = (modo === "aggrava" ? P.aggrava : P.applica)(dif, k, { fonte: fonteDi(att), tira: ctx.tira, esito, turni: dif.statiCorti ? 1 : durataDi(att, k), tipo: tipoStato(att, k), ...(extra || {}), ...segno });
    /* Radice che resta (Pellegrino, 3 pezzi): il primo stato applicato nel turno dura 1 turno in più */
    if (att.radice && att !== dif && E.some(e => e.k === "stato" && e.stato === k) && P.ha(dif, k)) { att.radice = false; E.push(P.allunga(dif, k, 1)); }
    /* Svuotato / Prosciugato (Vuoto del sovrano): si spegne un per scontro non usato; aggravato, anche un giornaliero */
    if (k === "vuoto") E.filter(e => e.k === "stato" && e.stato === "vuoto").forEach(e => {
      E.push(...spegni(dif, "scontro")); if (e.liv === 2) E.push(...spegni(dif, "giornaliero"));
    });
    return E;
  }
  /* Enea, prima caduta: le tombe dei suoi uomini lo rialzano una volta con 1d4 + 3 salute (evento, non potere) */
  function rialzo(b, ctx) {
    if (!(b.pv <= 0 && b.rialzo > 0)) return [];
    b.rialzo--; const x = ctx.tira(4); b.pv = Math.min(b.pvMax, x + 3);
    return [{ k: "rialzato", chi: b.nome, pv: b.pv, tiri: [x] }];
  }
  /* il primo potere non ancora usato di quel tipo si spegne fino a fine scontro */
  function spegni(b, tipo) {
    b.spenti = b.spenti || {};
    const usati = tipo === "scontro" ? b.usati.scontro : b.usati.giorno;
    const id = (b.poteri || []).find(x => { const p = potere(x); return p && p.tipo === tipo && !usati[x] && !b.spenti[x]; });
    if (!id) return [];
    b.spenti[id] = true; return [{ k: "spento", potere: id, su: b.nome }];
  }
  /* il sanguinamento del Monaco del Sangue è di tipo sangue (vale per le vulnerabilità) */
  const tipoStato = (att, k) => (k === "sanguinante" && att.spec === "sangue" ? "sangue" : undefined);
  const PLACCHE_MAX = 3;
  const riduzionePlacca = (b) => 3 + Math.max(0, (b.liv || 1) - 1);
  /* Legame del sottobosco (Sciamano, privilegio del livello 3, 11/11): gli stati che applichi durano 4 turni.
     ASSUNZIONE 15/11: vale per gli stati da 3 turni (non allunga Stordito né Impaurito) */
  const durataDi = (att, k) => ((att.tratti || []).includes("legame_sottobosco") && P.durataBase(k) === P.DURATA ? 4 : undefined);
  const durataPiena = (att, k) => durataDi(att, k) || P.durataBase(k);

  /* ---------- L'attacco ----------
     o: { piuDadi, soloDado, doppiDadi, autoCrit, bonusDanno, tipo, critDa, nome, contrattacco }
     Le reazioni del difensore scattano qui (contrattacchi, Ritorsione, Ultimo baluardo): valgono per giocatore e nemici. */
  function attacco(att, dif, o, ctx) {
    pronto(att); pronto(dif); o = o || {};
    const E = [];
    if (!o.contrattacco) { E.push(...scattaTrappole(att, dif, ctx)); if (att.pv <= 0) return { ok: false, crit: false, eventi: E, ev: null }; }
    const auto = !!o.autoCrit;
    /* La risata di Darius (carica): annulla il prossimo attacco del nemico, boss e colpi annunciati compresi */
    if (dif.cariche && dif.cariche.risata && !o.contrattacco) { delete dif.cariche.risata; E.push({ k: "risata", chi: dif.nome, su: att.nome }); return { ok: false, crit: false, eventi: E, ev: null, annullato: true }; }
    /* Studio del bersaglio (Guanti del Cartografo, carica): un dado in più se il bersaglio è vulnerabile al tipo di danno */
    let studio = 0;
    if (att.cariche && att.cariche.studio && !o.contrattacco) {
      delete att.cariche.studio; const tp = o.tipo || (att.arma && att.arma.tipo);
      studio = dif.res && dif.res[tp] === "vuln" ? 1 : 0; E.push({ k: "studio", ok: !!studio });
    }
    /* «L'ho già vista» (Ettore): fino al suo turno, prima di ogni attacco con tiro per colpire tira un d20; con 17 o più schiva */
    if (dif.buff.schiva && !o.contrattacco) {
      const x = ctx.tira(20), ev0 = { k: "schiva", chi: dif.nome, d: x, ok: x >= dif.buff.schiva.soglia };
      E.push(ev0); if (ev0.ok) return { ok: false, crit: false, eventi: E, ev: null, schivato: true };
    }
    /* Dado truccato / Il Grande Inganno: chi attacca tira due d20 e tiene il peggiore */
    const tiraD20 = () => (att.svantaggio > 0 ? Math.min(ctx.tira(20), ctx.tira(20)) : ctx.tira(20));
    let d = auto ? null : tiraD20();
    const malusBarr = !o.contrattacco && att.malusProssimo ? att.malusProssimo : 0; if (malusBarr) att.malusProssimo = 0; /* Barricata di costole */
    const malusSguardo = att.sguardoCasa && dif.set ? 2 : 0; /* Sguardo della Casa (set di carne, 4 pezzi): il nemico marchiato ha −2 a colpirti */
    /* Slancio (Valoroso, 2 pezzi): +1 a colpire sul primo attacco con tiro dopo un colpo a segno del turno prima */
    const slancio = !auto && !o.contrattacco && att.slancio ? 1 : 0; if (slancio) att.slancio = false;
    const bc = Number(o.bonusColpire) || 0; /* vuoti: Colpo alle spalle (+2), Furia cieca (secondo −2) */
    let tot = auto ? null : d + mAtt(att, o) + slancio + bc - P.malusColpire(att) - malusBarr - malusSguardo;
    const soglia = Math.min(o.critDa || 20, o.focus ? 20 : critBaseArma(att), P.sogliaCritContro(dif));
    /* Voce del sangue (set di cenere, 4 pezzi, carica): il primo tiro per colpire mancato si rilancia */
    if (!auto && !o.contrattacco && att.cariche && att.cariche.voce && d < soglia && tot <= ca(dif)) {
      delete att.cariche.voce; const prima = d; d = tiraD20(); tot = d + mAtt(att, o) + slancio + bc - P.malusColpire(att) - malusBarr - malusSguardo;
      E.push({ k: "voceDelSangue", chi: att.nome, prima, d });
    }
    const crit = auto || d >= soglia, ok = auto || d >= soglia || tot > ca(dif); /* come nel gioco: il totale deve superare la CA */
    const ev = { k: "attacco", da: att.nome, a: dif.nome, nome: o.nome || null, d, tot, ca: ca(dif), crit: ok && crit, ok, danno: 0 };
    if (o.contrattacco) ev.contrattacco = true;
    if (slancio) ev.slancio = 1;
    if (!o.contrattacco) att.ultimoMancato = !ok; /* Ferita finta dei vuoti: «se hai mancato il tuo ultimo attacco» */
    if (ok && !auto && !o.contrattacco && pezziClasse(att, "valoroso") >= 2) att.slancioProssimo = true;
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
    const dado = o.dado || (o.focus ? dadoIncanto(att) : (att.arma && att.arma.dado) || 4);
    const nBase = o.n || (o.focus ? 1 : (att.arma && att.arma.n) || 1);
    const base = nBase * (o.doppiDadi ? 2 : 1) + (o.piuDadi || 0) + (att.prossimiDadi || 0) + piena + studio;
    if (att.prossimiDadi) { ev.dadiBaluardo = att.prossimiDadi; att.prossimiDadi = 0; }
    const nd = base * (ev.crit ? 2 : 1), tiri = tiraDadi(ctx, nd, dado);
    let lordo = somma(tiri) + (o.soloDado ? 0 : mDanno(att, o)) + (o.bonusDanno || 0);
    ev.mod = (o.soloDado ? 0 : mDanno(att, o)) + (o.bonusDanno || 0); /* 15/11: nel registro i dadi e il bonus, così il conto si legge */
    if (o.dadoExtra) { const x = ctx.tira(o.dadoExtra); lordo += x; ev.extra = x; } /* es. Dardo fantasma: +1d4 con una Copia, solo se colpisce */
    if (dif.marchio && att.marchia) { const x = ctx.tira(4); lordo += x; ev.marchio = x; }                /* Marchio della preda */
    if ((att.tratti || []).includes("furia") && P.vacillante(att)) { lordo += 2; ev.furia = 2; }        /* Furia: da Vacillante +2 */
    if ((att.tratti || []).includes("radici_profonde") && haStato(dif)) { const x = ctx.tira(4); lordo += x; ev.radici = x; } /* Radici profonde: qualsiasi stato (11/11) */
    if (P.ha(att, "furente")) { lordo += 2; ev.furente = 2; }
    const grido = Object.values(att.buff || {}).reduce((t, x) => t + (Number(x.danni) || 0), 0); if (grido && !o.soloDado) { lordo += grido; ev.grido = grido; } /* Grido del valoroso */
    if (!o.contrattacco && pezziClasse(att, "pellegrino") >= 2 && haStato(dif)) { lordo += 1; ev.pellegrino = 1; }        /* Passo del pellegrino */                                           /* Furente (sovrano): +2 danni */
    if (o.potere && !o.contrattacco && frattura(att, dif)) { lordo += 2; ev.frattura = 2; }             /* Frattura (Realtà): +2 su Esposto o Scoperto */
    Object.assign(ev, { nd, dado, tiri });
    const dopo = [];
    lordo = difese(att, dif, Math.max(1, lordo), o, ctx, ev, dopo);
    E.push(...danneggia(dif, lordo, o.tipo || (att.arma && att.arma.tipo), ev, ctx, { ignoraRes: o.ignoraRes }));
    /* Corteccia viva: se lo scudo assorbe per intero il colpo, chi ti ha colpito è Indebolito */
    if (ev.assorbito && ev.danno === 0 && ev.scudo === "corteccia_viva" && att.pv > 0) E.push({ k: "cortecciaRegge" }, ...statoSu(dif, att, "applica", ctx, "indebolito"));
    dopo.forEach(f => { if (att.pv > 0) E.push(...f()); });
    if (piena && dif.pv > 0) E.push(...statoSu(att, dif, "aggrava", ctx, "sanguinante"));
    /* Gabbia d'ossa: 19-20 naturale con Lancia o Spine d'ossa → Stordito (sui boss Indebolito) */
    if (o.gabbia && d >= 19 && dif.pv > 0) { E.push({ k: "gabbia" }); E.push(...statoSu(att, dif, "applica", ctx, "stordito")); }
    /* Muffa che dilaga: ogni colpo a segno applica Intossicato, o allunga di 1 turno il veleno in corso */
    if (att.buff.muffa && !o.contrattacco && dif.pv > 0) E.push(...(P.ha(dif, "intossicato") ? [P.allunga(dif, "intossicato", 1)] : statoSu(att, dif, "applica", ctx, "intossicato")));
    if (dif.pv > 0) E.push(...reazioneColpito(att, dif, ctx, o));
    return { ok: true, crit: ev.crit, eventi: E, ev };
  }

  /* Copie dell'Illusione e Ali cremisi: cambiano il danno di un colpo a segno; i loro effetti sull'attaccante vengono dopo il danno */
  function difese(att, dif, lordo, o, ctx, ev, dopo) {
    if (dif.copie > 0) {
      const tutte = !!(o.carica || o.area), n = tutte ? dif.copie : 1, pieno = lordo;
      dif.copie -= n; lordo = meta(lordo); ev.copie = { distrutte: n, restano: dif.copie };
      if (!tutte) dopo.push(() => statoSu(dif, att, "applica", ctx, "indebolito"));      /* chi colpisce una Copia è Indebolito */
      if (dif.buff.teatro) dopo.push(() => { const t = tiraDadi(ctx, n, 6), e = { k: "copiaEsplode", tiri: t }; return [e, ...danneggia(att, somma(t), "psichico", e, ctx)]; });
      if (dif.specchio) { const x = att.boss ? meta(pieno) : pieno; dif.specchio = false; /* il colpo pieno (prima della metà) torna indietro */
        dopo.push(() => { const e = { k: "specchioRotto" }; return [e, ...danneggia(att, x, "psichico", e, ctx)]; }); }
    }
    if (dif.buff.eredita) { lordo = meta(lordo); ev.eredita = true; } /* Eredità del sepolcro */
    /* Mantello del Fuggiasco (carica, metà) o, se non c'è, Maglia della Veglia (carica, −4): mai tutte e due sullo stesso colpo */
    const c = dif.cariche || {};
    if (c.mantello) { delete c.mantello; lordo = meta(lordo); ev.mantello = true; }
    else if (c.maglia) { delete c.maglia; lordo = Math.max(0, lordo - 4); ev.maglia = 4; }
    /* Placche d'ossa: una si spezza e riduce il danno di 3 + 1 per livello oltre il primo */
    if (dif.placche > 0) {
      dif.placche--; const r = riduzionePlacca(dif); lordo = Math.max(0, lordo - r); ev.placca = { riduce: r, restano: dif.placche };
      if (dif.buff.spezzata) dopo.push(() => { const x = ctx.tira(6), e = { k: "placcaSpezzata", tiri: [x] }; return [e, ...danneggia(att, x, "ossa", e, ctx)]; });
    }
    return lordo;
  }
  /* il danno passa per le vulnerabilità e per le protezioni del difensore (Ultimo baluardo) */
  function danneggia(dif, lordo, tipo, ev, ctx, o) {
    pronto(dif);
    const E = [];
    /* Dafne nascosta o nello stacco: non si può colpire */
    if (dif.intoccabile) { if (ev) ev.danno = 0; return [{ k: "intoccabile", chi: dif.nome }]; }
    /* Spezzare la materia: le resistenze non contano (le immunità sì) */
    const mod = P.modificaDanno(dif, tipo, lordo);
    let n = o && o.ignoraRes && mod.res === "res" ? lordo : mod.danno;
    /* Odore di Casa (set di carne, 2 pezzi): −1 a ogni colpo fisico subito (solo colpi, non gli stati che bruciano; era −2, 15/11) */
    if (dif.set && dif.set.carne >= 2 && n > 0 && ev && (ev.k === "attacco" || ev.k === "colpoGratuito") && [null, undefined, "taglio", "contundente", "perforante"].includes(tipo)) {
      const x = Math.min(1, n); n -= x; ev.odore = x;
    }
    if (o && o.ignoraRes && mod.res === "res" && ev) ev.ignoraRes = true;
    /* scudo di PF (Legno): assorbe prima della salute; il danno assorbito non conta come danno subito */
    const sc = P.scudoAttivo(dif), ass = P.assorbi(dif, n);
    if (ass) { n -= ass; if (ev) { ev.assorbito = ass; ev.scudo = sc.nome; } E.push({ k: "assorbe", scudo: sc.nome, n: ass, resta: P.scudoAttivo(dif) ? dif.scudoPF.pf : 0 }); }
    const bal = dif.buff.baluardo;
    if (bal && !bal.salvato && n >= dif.pv && dif.pv > 0) { bal.salvato = true; n = dif.pv - 1; E.push({ k: "baluardo" }); }
    /* La soglia di casa (via di Guendalina, livello 4): una volta per scontro il colpo che ti renderebbe Vacillante fa metà danno, +2 CA per 2 turni */
    if (dif.via === "guendalina" && dif.liv >= 4 && !dif.sogliaUsata && !P.vacillante(dif) && dif.pv - n > 0 && dif.pv - n < dif.pvMax / 2) {
      dif.sogliaUsata = true; n = meta(n); dif.buff.soglia = { ca: 2, turni: 2 }; E.push({ k: "sogliaDiCasa" });
      if (ev) ev.soglia = true;
    }
    /* Ultimo servizio (Monaco, privilegio del livello 3): una volta al giorno, a 0 resti a 1 e ti curi 1d6 + Spirito */
    let servizio = false;
    if (n >= dif.pv && dif.pv > 0 && (dif.tratti || []).includes("ultimo_servizio") && !dif.usati.giorno.ultimo_servizio) {
      dif.usati.giorno.ultimo_servizio = true; n = dif.pv - 1; servizio = true;
    }
    const r = P.subisci(dif, n, null, { giaAssorbito: true }); /* il tipo e lo scudo sono già stati contati */
    E.push(...rialzo(dif, ctx));
    /* Ultima Guardia (set di carne, 5 pezzi, giornaliero): a 0 ti rialzi con il 10% della salute massima (per eccesso, minimo 1) */
    if (dif.pv <= 0 && dif.set && dif.set.carne >= 5 && !dif.usati.giorno.ultima_guardia) {
      dif.usati.giorno.ultima_guardia = true; dif.pv = Math.max(1, Math.ceil(dif.pvMax / 10)); E.push({ k: "ultimaGuardia", chi: dif.nome, pv: dif.pv });
    }
    if (ev) { ev.danno = r.danno; ev.tipo = tipo; ev.su = dif.nome; if (n !== lordo) ev.lordo = lordo; }
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
    if (dif.buff.ghianda && att.pv > 0) { /* Ghianda esplosiva: 1d6 senza tiro per colpire e aggrava lo stato contundente */
      delete dif.buff.ghianda; const x = ctx.tira(6), e = { k: "trappola", id: "ghianda_esplosiva", tiri: [x] };
      E.push(e, ...danneggia(att, x, "contundente", e, ctx));
      if (att.pv > 0) E.push(...statoSu(dif, att, "aggrava", ctx, "stordito"));
    }
    return E;
  }
  function reazioneMancato(att, dif, ctx) {
    const E = [];
    if (dif.buff.riflessi) { dif.copie = Math.min(COPIE_MAX, (dif.copie || 0) + 1); E.push({ k: "copia", tot: dif.copie }); } /* Riflessi */
    if (dif.buff.campo && att.pv > 0) { const x = ctx.tira(4), e = { k: "campoDiPeso", tiri: [x] }; E.push(e, ...danneggia(att, x, "forza", e, ctx)); } /* Campo di peso */
    if (dif.buff.guardiaFeroce) E.push(...contrattacco(dif, att, ctx, "applica"));
    else if (dif.buff.inGuardia) E.push(...contrattacco(dif, att, ctx, dif.buff.veglia ? "aggrava" : null));
    return E;
  }
  function reazioneColpito(att, dif, ctx, o) {
    const E = [];
    if (dif.buff.ceneri && !(o && o.focus)) E.push(...statoSu(dif, att, "applica", ctx, "scottato")); /* Ceneri sul pelo: chi lo colpisce in mischia */
    dif.colpitoUltimo = true;
    /* Amuleto della veglia (carica): il prossimo nemico che ti colpisce subisce 1d6 + livello */
    if (dif.cariche && dif.cariche.amuleto && att.pv > 0) { delete dif.cariche.amuleto; const x = ctx.tira(6), e = { k: "amuletoVeglia", tiri: [x] }; E.push(e, ...danneggia(att, x + (dif.liv || 1), null, e, ctx)); }
    if (dif.buff.pelle) E.push(...statoSu(dif, att, "applica", ctx, "intossicato")); /* Pelle di micelio */
    if (dif.buff.crosta) E.push(...statoSu(dif, att, "applica", ctx, "sanguinante")); /* Crosta */
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
    b.sangueVersatoTurno = false; b.rapidaUsata = false;
    if (b.rapidaPersa) { b.rapidaUsata = true; b.rapidaPersa = false; } /* Buca del trappolista: perdi l'azione rapida di questo turno */
    if (b.slancioProssimo) { b.slancio = true; b.slancioProssimo = false; }  /* Slancio: vale dal turno successivo */
    b.riduciTick = pezziClasse(b, "penitente") >= 2 ? 1 : 0;              /* Carne domata */
    if (b.immuniTemp) for (const k of Object.keys(b.immuniTemp)) if (--b.immuniTemp[k] <= 0) { delete b.immuniTemp[k]; if (!(b.immuniEquip || []).includes(k)) b.immuni = (b.immuni || []).filter(x => x !== k); }
    const E = P.inizioTurno(b, ctx.tira);
    E.push(...rialzo(b, ctx)); /* un danno continuativo può abbattere Enea: si rialza anche così */
    E.push(...turnoScudo(b));
    /* Sciame putrido: all'inizio dei tuoi 3 turni successivi, 1d6 senza tiro e il veleno applicato (o aggravato) */
    if (b.buff.sciame && avv && avv.pv > 0) {
      const sc = b.buff.sciame, d = ctx.tira(6), ev = { k: "sciame", tiri: [d] };
      E.push(ev, ...danneggia(avv, d, "veleno", ev, ctx));
      if (avv.pv > 0) E.push(...statoSu(b, avv, "aggrava", ctx, "intossicato"));
      if (--sc.cariche <= 0) delete b.buff.sciame;
    }
    /* Pioggia di braci (Verga di cenere): all'inizio dei tuoi 3 turni 1d6 di fuoco senza tiro, applica o aggrava Scottato */
    if (b.buff.braci && avv && avv.pv > 0) {
      const d = ctx.tira(6), ev = { k: "braci", tiri: [d] };
      E.push(ev, ...danneggia(avv, d, "fuoco", ev, ctx));
      if (avv.pv > 0) E.push(...statoSu(b, avv, "aggrava", ctx, "scottato"));
      if (--b.buff.braci.cariche <= 0) delete b.buff.braci;
    }
    /* Pioggia di rami: all'inizio dei tuoi 3 turni 1d6 contundente senza tiro, applica o aggrava lo stato contundente */
    if (b.buff.rami && avv && avv.pv > 0) {
      const d = ctx.tira(6), ev = { k: "rami", tiri: [d] };
      E.push(ev, ...danneggia(avv, d, "contundente", ev, ctx));
      if (avv.pv > 0) E.push(...statoSu(b, avv, "aggrava", ctx, "stordito"));
      if (--b.buff.rami.cariche <= 0) delete b.buff.rami;
    }
    /* Collasso gravitazionale: all'inizio dei tuoi 3 turni 1d8 di forza senza tiro (+2 di Frattura), applica o aggrava l'Esposto */
    if (b.buff.collasso && avv && avv.pv > 0) {
      const d = ctx.tira(8), fr = frattura(b, avv) ? 2 : 0, ev = { k: "collasso", tiri: [d], ...(fr ? { frattura: fr } : {}) };
      E.push(ev, ...danneggia(avv, d + fr, "forza", ev, ctx));
      if (avv.pv > 0) E.push(...statoSu(b, avv, "aggrava", ctx, "esposto"));
      if (--b.buff.collasso.cariche <= 0) delete b.buff.collasso;
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
  /* scudo di PF all'inizio del tuo turno: quello «fino al tuo turno» finisce, quello a turni scende;
     Scorza viva (Legno): lo scudo che dura più turni recupera 2 PF (4 con Radice madre); Foresta che avanza: torna al massimo */
  function turnoScudo(b) {
    const s = P.scudoAttivo(b), E = []; if (!s) { b.scudoPF = null; return E; }
    if (s.turni === null && !s.scontro) { b.scudoPF = null; return [{ k: "scudoFinito", scudo: s.nome }]; }
    if (!s.scontro && s.turni > 0 && --s.turni <= 0) { b.scudoPF = null; return [{ k: "scudoFinito", scudo: s.nome }]; }
    if (b.buff.foresta) { s.pf = s.max; E.push({ k: "scudoPieno", scudo: s.nome, pf: s.pf }); if (--b.buff.foresta.cariche <= 0) delete b.buff.foresta; }
    else if (b.spec === "legno") {
      const n = Math.min(s.max - s.pf, b.buff.radiceMadre ? 4 : 2);
      if (n > 0) { s.pf += n; E.push({ k: "scorzaViva", scudo: s.nome, n, pf: s.pf }); }
    }
    return E;
  }
  function fineTurno(b) {
    pronto(b);
    if (b.svantaggio > 0) b.svantaggio--;
    if (b.nonCarica > 0) b.nonCarica--;
    b.lampo = false; b.radice = false; /* Lampo di intuizione e Radice che resta valgono solo nel turno */
    if (b.velenoPerenne) b.pestilenzaTurni = (b.pestilenzaTurni || 0) + 1; /* turni passati dall'inizio di Pestilenza */
    return P.fineTurno(b);
  }
  /* fine scontro: tornano i poteri per scontro, spariscono effetti e stati; il riposo ricarica i giornalieri */
  function fineScontro(b) { pronto(b); b.usati.scontro = {}; b.buff = {}; b.stati = {}; b.prossimiDadi = 0; b.marchio = false; b.marchia = false; b.immStordito = 0; b.nonCarica = 0; b.pronto = null;
    b.scudoPF = null; b.spenti = {}; b.espostoPerenne = false; b.rapidaUsata = false; b.velenoPerenne = false;
    b.cariche = {}; b.cinturoneUsato = false; b.segnoAttivo = false;
    b.slancio = false; b.slancioProssimo = false; b.lampo = false; b.lampoAttivo = false; b.radice = false; b.riduciTick = 0;
    if (b.immuniTemp) { for (const k of Object.keys(b.immuniTemp)) if (!(b.immuniEquip || []).includes(k)) b.immuni = (b.immuni || []).filter(x => x !== k); b.immuniTemp = {}; }
    if (b.immuniScontro) { b.immuni = (b.immuni || []).filter(k => !b.immuniScontro.includes(k) || (b.immuniEquip || []).includes(k)); b.immuniScontro = []; }
    b.pestilenzaTurni = 0; b.copie = 0; b.specchio = false; b.svantaggio = 0; b.scintillaUsata = false; b.placche = 0; b.malusProssimo = 0; b.occhioUsato = false; b.senzaScampoUsato = false; b.sogliaUsata = false;
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
    if (b.spenti && b.spenti[id]) return { ok: false, motivo: "spento" };                       /* Svuotato / Prosciugato */
    if (p.tipo !== "volonta" && P.soloAVolonta(b)) return { ok: false, motivo: "impaurito" };
    if (p.tipo === "scontro" && b.usati.scontro[id]) return { ok: false, motivo: "giaUsatoScontro" };
    if (p.tipo === "giornaliero" && b.usati.giorno[id]) return { ok: false, motivo: "giaUsatoGiorno" };
    if (p.rapida && !rapidaLibera(b)) return { ok: false, motivo: "rapidaUsata" };
    if (id === "bevi_elisir" && !(b.elisir > 0)) return { ok: false, motivo: "senzaElisir" };
    if (id === "grande_inganno" && !(b.copie > 0)) return { ok: false, motivo: "senzaCopie" };
    if ((id === "spirito_d_ossa" || id === "lama_d_osso") && !(b.placche > 0)) return { ok: false, motivo: "senzaPlacche" };
    return { ok: true };
  }

  /* le cure passano per Maledetto (metà, per eccesso) e Condannato (niente) */
  const cura = (b, n) => { const f = P.fattoreCure(b), m = f === 1 ? n : Math.ceil(n * f), prima = b.pv; b.pv = Math.min(b.pvMax, b.pv + m);
    return { k: "cura", chi: b.nome, n: b.pv - prima, ...(f < 1 ? { ridotta: f === 0 ? "condannato" : "maledetto" } : {}) }; };
  const buff = (b, id, x) => { b.buff[id] = x; return { k: "buff", id, ...x }; };
  const haStato = (b) => Object.keys(b.stati || {}).some(k => P.ha(b, k));
  const frattura = (att, dif) => att.spec === "realta" && P.ha(dif, "esposto");
  /* privilegi del livello 5 che curano: 1/4 della salute massima (Mani che curano vale solo per pozioni ed elisir, 10/11) */
  const curaDiClasse = (b) => [cura(b, Math.max(1, Math.floor(b.pvMax / 4)))];
  /* Mani che curano (via di Guendalina, livello 3): pozioni ed elisir di salute curano il 50% in più, per eccesso */
  const conMani = (b, n) => (b.via === "guendalina" && b.liv >= 3 ? Math.ceil(n * 1.5) : n);

  /* ---------- Azione rapida (11/11/2026): una per turno, oltre all'azione standard ---------- */
  /* vale per cambiare arma (al massimo due con sé), equipaggiare un oggetto, bere una pozione o un elisir (Infuso).
     Lo stordimento toglie anche la rapida. */
  /* Cinturone del Cacciatore: una volta per scontro un'azione rapida in più, di qualsiasi tipo */
  const rapidaLibera = (b) => P.puoAzioneRapida(b) && (!b.rapidaUsata || (b.cinturone && !b.cinturoneUsato));
  function usaRapida(b, cosa) {
    if (!P.puoAzioneRapida(b)) return { ok: false, eventi: [{ k: "stordito", cosa }] };
    if (b.rapidaUsata && b.cinturone && !b.cinturoneUsato) { b.cinturoneUsato = true; return { ok: true, eventi: [{ k: "rapida", chi: b.nome, cosa, cinturone: true }] }; }
    if (b.rapidaUsata) return { ok: false, eventi: [{ k: "rapidaUsata", cosa }] };
    b.rapidaUsata = true; return { ok: true, eventi: [{ k: "rapida", chi: b.nome, cosa }] };
  }
  /* Giuramento del Rettore: cambiare faccia (maglio ↔ ascia) è l'azione rapida */
  function cambiaFaccia(b) {
    pronto(b); const a = b.arma; if (!a || !a.facce) return { ok: false, eventi: [{ k: "senzaFacce" }] };
    const r = usaRapida(b, "cambiaFaccia"); if (!r.ok) return r;
    a.faccia = ((a.faccia || 0) + 1) % a.facce.length; a.tipo = a.facce[a.faccia].tipo;
    r.eventi.push({ k: "faccia", nome: a.facce[a.faccia].nome, tipo: a.tipo }); return r;
  }

  /* ---------- Poteri di armature e accessori (14/11): azione rapida, «fino al tuo prossimo turno» o «carica» ---------- */
  const CARICHE = { maglia_della_veglia: "maglia", mantello_del_fuggiasco: "mantello", piastre_del_rettore: "piastre", elmo_della_sentinella: "elmo",
    risata_di_darius: "risata", amuleto_della_veglia: "amuleto", studio_del_bersaglio: "studio", piede_fermo: "piede" };
  function disponibileOggetto(b, id) {
    const pe = (O() ? O().poteriEquip(b) : []).find(x => x.id === id);
    if (!pe) return { ok: false, motivo: "nonIndossato" };
    if (pe.automatico) return { ok: false, motivo: "automatico" }; /* Primo passo: parte da solo (primoPasso) */
    if ((pe.tipo === "scontro" ? b.usati.scontro : b.usati.giorno)["ogg:" + id]) return { ok: false, motivo: pe.tipo === "scontro" ? "giaUsatoScontro" : "giaUsatoGiorno" };
    if (!rapidaLibera(b)) return { ok: false, motivo: "rapidaUsata" };
    return { ok: true, potere: pe };
  }
  /* opz.stato: lo stato scelto per l'Anello della resina */
  function usaOggetto(b, id, ctx, opz) {
    pronto(b); opz = opz || {};
    const d = disponibileOggetto(b, id); if (!d.ok) return { eventi: [{ k: d.motivo, potere: id }], rifiutato: true };
    const r = usaRapida(b, "oggetto"), E = r.eventi;
    (d.potere.tipo === "scontro" ? b.usati.scontro : b.usati.giorno)["ogg:" + id] = true; /* consumato alla dichiarazione */
    E.push({ k: "potereOggetto", id, nome: d.potere.nomeOggetto, testo: d.potere.testo });
    if (CARICHE[id]) { b.cariche = b.cariche || {}; b.cariche[CARICHE[id]] = true; E.push({ k: "carica", id: CARICHE[id] }); }
    else if (id === "cuoio_dell_ombra") E.push(buff(b, "ombra", { ca: 4, finoAlTurno: true }));
    else if (id === "anello_della_resina") { const k = opz.stato || "stordito"; b.immuniScontro = [...(b.immuniScontro || []), k]; if (!b.immuni.includes(k)) b.immuni.push(k); E.push({ k: "resina", stato: k }); }
    return { eventi: E };
  }

  /* ---------- Primo passo (Stivali dell'Ultimo passo, 16/11 sez. 5) ----------
     All'inizio del primo turno del giocatore, prima della sua azione: un attacco extra classico (attacco base) o un potere a volontà,
     con d20 e bonus completi. opz.potere: id del potere a volontà (assente = attacco base). opz.primo: il giocatore agisce per primo
     (agguato o Furtività riusciti, o nessuna sorpresa): solo allora il nemico ha −2 CA nel primo round, sommato agli altri −2. */
  const haPrimoPasso = (b) => !!(O() && O().poteriEquip(b).some(x => x.id === "primo_passo")) && !(b.usati && b.usati.giorno["ogg:primo_passo"]);
  function primoPasso(att, dif, ctx, opz) {
    pronto(att); pronto(dif); opz = opz || {};
    if (!haPrimoPasso(att)) return { eventi: [], rifiutato: true };
    const pv = opz.potere && potere(opz.potere);
    if (opz.potere && (!pv || pv.tipo !== "volonta" || !disponibile(att, opz.potere).ok)) return { eventi: [{ k: "soloAVolonta", potere: opz.potere }], rifiutato: true };
    att.usati.giorno["ogg:primo_passo"] = true;
    const E = [{ k: "potereOggetto", id: "primo_passo", nome: "Stivali dell'Ultimo passo", testo: "Primo passo" }];
    if (opz.primo !== false) E.push(buff(dif, "primoPasso", { ca: -2, turni: 1 }));
    E.push(...(pv ? usa(att, dif, opz.potere, ctx, { gratis: true }) : attaccoBase(att, dif, ctx)).eventi);
    return { eventi: E };
  }

  /* ---------- Attacco con l'arma (attacco base) e poteri delle armi (14/11) ----------
     L'attacco base non applica stati né attiva le sinergie della specializzazione. opz.poterArma: dichiara il potere dell'arma
     (si consuma subito, anche se manca). Segno sulla mappa si dichiara invece con un potere di classe (usa, opz.segno). */
  /* il potere dell'arma in mano o, se manca, quello del focus (Sfera armillare: Segno sulla mappa) */
  const potereArma = (b) => (b.arma && b.arma.potere) || (focusOk(b) && b.focus && b.focus.potere) || null;
  function disponibileArma(b) {
    const p = potereArma(b); if (!p) return { ok: false, motivo: "senzaPotere" };
    if ((p.tipo === "scontro" ? b.usati.scontro : b.usati.giorno)["arma:" + p.id]) return { ok: false, motivo: p.tipo === "scontro" ? "giaUsatoScontro" : "giaUsatoGiorno" };
    if (P.soloAVolonta(b)) return { ok: false, motivo: "impaurito" };
    return { ok: true, potere: p };
  }
  function attaccoBase(att, dif, ctx, opz) {
    pronto(att); pronto(dif); opz = opz || {};
    const E = [{ k: "attaccoBase", chi: att.nome, arma: (att.arma && att.arma.nome) || "arma" }];
    let p = null;
    if (opz.poterArma) {
      const d = disponibileArma(att); if (!d.ok) return { eventi: [{ k: d.motivo, potere: "arma" }], rifiutato: true };
      p = d.potere; if (p.id === "segno_sulla_mappa") return { eventi: [{ k: "segnoConPotere" }], rifiutato: true };
      (p.tipo === "scontro" ? att.usati.scontro : att.usati.giorno)["arma:" + p.id] = true;
      E.push({ k: "potereArma", id: p.id, nome: O() ? O().POTERI_ARMA[p.id].nome : p.id });
    }
    const k = statoArma(att), senza = (modo, st) => (dif.pv > 0 ? statoSu(att, dif, modo, ctx, st, null, { senzaTs: true }) : []);
    const vac = P.vacillante(dif);
    const colpo = (o) => { const r = attacco(att, dif, { nome: "attacco_base", ...(o || {}) }, ctx); E.push(...r.eventi); return r; };
    const id = p && p.id;
    let r;
    if (id === "doppia_stoccata") { /* due attacchi indipendenti: Esposto poi Scoperto, senza TS */
      const r1 = colpo(); if (r1.ok) E.push(...senza("applica", "esposto"));
      if (dif.pv > 0) { const r2 = colpo(); if (r2.ok) E.push(...senza(r1.ok ? "aggrava" : "applica", "esposto")); }
    } else if (id === "pioggia_di_braci") { E.push(buff(att, "braci", { cariche: 3 })); colpo(); }
    else {
      r = colpo(id === "colpo_del_giuramento" ? { piuDadi: 1 } : id === "raccolto" ? { piuDadi: 2, autoCrit: vac } : id === "albero_caduto" ? { piuDadi: 2 } : {});
      if (r.ok && !r.annullato && dif.pv > 0) {
        if (id === "danza_delle_lame") { E.push(...colpoGratuito(att, dif, ctx, { nome: "danza_delle_lame" })); if (dif.pv > 0 && P.ha(dif, "sanguinante") && !P.grave(dif, "sanguinante")) E.push(...statoSu(att, dif, "aggrava", ctx, "sanguinante")); }
        if (id === "colpo_del_giuramento") E.push(...statoSu(att, dif, k && P.ha(dif, k) ? "aggrava" : "applica", ctx, k));
        if (id === "punta_nella_piaga") E.push(...statoSu(att, dif, P.ha(dif, "esposto") ? "aggrava" : "applica", ctx, "esposto"));
        if (id === "raccolto") E.push(...statoSu(att, dif, "aggrava", ctx, k));
        if (id === "albero_caduto") {
          if (dif.boss) E.push(...P.applica(dif, "indebolito", { senzaTs: true, turni: P.DURATA }));
          else { E.push(...P.applica(dif, "stordito", { senzaTs: true })); if (dif.pv > 0) E.push(...P.aggrava(dif, "stordito", {})); }
        }
      }
    }
    return { eventi: E };
  }
  /* cambiare arma: b.armi = [arma, arma] (il Giuramento del Rettore conta come una) */
  function cambiaArma(b, i) {
    pronto(b);
    const a = (b.armi || [])[i]; if (!a) return { ok: false, eventi: [{ k: "armaAssente", i }] };
    if (a === b.arma) return { ok: false, eventi: [{ k: "giaInMano", arma: a.nome }] };
    const r = usaRapida(b, "cambiaArma"); if (!r.ok) return r;
    b.arma = a; r.eventi.push({ k: "arma", nome: a.nome || a.tipo, tipo: a.tipo, ...(a.dueMani && !a.eFocus && b.focus ? { senzaFocus: true } : {}) });
    return r;
  }
  /* bere una pozione di salute (n = la sua cura) */
  /* ---------- Elisir di stato (elisir_e_bottino 1, 9/11): azione rapida, al massimo 2 per famiglia ----------
     Comune: cura lo stato lieve della famiglia. Raro: cura lieve e grave e dà 3 turni di immunità alla famiglia.
     b.borsa = { sanguinante: { comune: n, raro: n }, ... } */
  const FAMIGLIE_ELISIR = ["sanguinante", "scottato", "intossicato", "esposto", "indebolito", "impaurito"];
  function beviElisirStato(b, fam, raro) {
    pronto(b); const q = b.borsa && b.borsa[fam], tipo = raro ? "raro" : "comune";
    if (!FAMIGLIE_ELISIR.includes(fam) || !q || !(q[tipo] > 0)) return { ok: false, eventi: [{ k: "senzaElisir", fam, tipo }] };
    if (!raro && P.grave(b, fam)) return { ok: false, eventi: [{ k: "elisirDebole", fam }] };
    const r = usaRapida(b, "elisir"); if (!r.ok) return r;
    q[tipo]--; P.togli(b, fam);
    if (raro) { b.immuniTemp = b.immuniTemp || {}; b.immuniTemp[fam] = 3; /* 3 turni del nemico */ if (!(b.immuni || []).includes(fam)) b.immuni = [...(b.immuni || []), fam]; }
    r.eventi.push({ k: "elisirStato", chi: b.nome, fam, raro: !!raro }); return r;
  }
  /* ---------- Poteri dei set (storia_retaggio_e_set 7c): non occupano slot di potere ----------
     b.set = { carne: pezzi, cenere: pezzi }. Passivi: Odore di Casa (carne 2), Ultima Guardia (carne 5), clausole sul sovrano (cenere).
     Per scontro, con l'azione rapida (niente reazioni, 14/11): Sguardo della Casa (carne 4) e Voce del sangue (cenere 4, carica). */
  const POTERI_SET = { sguardo_della_casa: { set: "carne", pezzi: 4 }, voce_del_sangue: { set: "cenere", pezzi: 4 },
    /* set di classe, 3 pezzi (set_di_classe.md) */
    grido_del_valoroso: { classe: "valoroso", pezzi: 3 }, lampo_di_intuizione: { classe: "sapiente", pezzi: 3 },
    fede_incrollabile: { classe: "penitente", pezzi: 3 }, radice_che_resta: { classe: "pellegrino", pezzi: 3 } };
  function disponibileSet(b, id) {
    pronto(b); const d = POTERI_SET[id];
    if (!d || !(d.classe ? pezziClasse(b, d.classe) >= d.pezzi : b.set && b.set[d.set] >= d.pezzi)) return { ok: false, motivo: "senzaSet" };
    if (b.usati.scontro[id]) return { ok: false, motivo: "giaUsatoScontro" };
    return { ok: true };
  }
  function usaSet(b, id, dif) {
    const v = disponibileSet(b, id); if (!v.ok) return { ok: false, eventi: [{ k: "nonDisponibile", id, motivo: v.motivo }] };
    const r = usaRapida(b, id); if (!r.ok) return r;
    b.usati.scontro[id] = true;
    if (id === "sguardo_della_casa" && dif) { pronto(dif); dif.sguardoCasa = true; }
    if (id === "voce_del_sangue") { b.cariche = b.cariche || {}; b.cariche.voce = true; }
    if (id === "grido_del_valoroso") r.eventi.push(buff(b, "grido", { ca: 2, danni: 2, finoAlTurno: true }));
    if (id === "fede_incrollabile") r.eventi.push(buff(b, "fede", { tsStati: 3, finoAlTurno: true }));
    if (id === "lampo_di_intuizione") b.lampo = true;
    if (id === "radice_che_resta") b.radice = true;
    r.eventi.push({ k: "poterSet", chi: b.nome, id }); return r;
  }
  function beviPozione(b, n) {
    pronto(b); const r = usaRapida(b, "pozione"); if (!r.ok) return r;
    r.eventi.push({ ...cura(b, conMani(b, n)), k: "pozione" }); return r;
  }

  /* ---------- Colpo gratuito (14/11/2026) ----------
     Va a segno da solo, fa solo il dado dell'arma (nessun bonus, nessun critico), solo dopo un colpo principale a segno.
     Resistenze e vulnerabilità valgono. Non applica stati salvo dove il potere lo dice (Senza scampo: mai). */
  function colpoGratuito(att, dif, ctx, o) {
    pronto(att); pronto(dif); o = o || {};
    const dado = (att.arma && att.arma.dado) || 4, t = ctx.tira(dado);
    const ev = { k: "colpoGratuito", da: att.nome, a: dif.nome, nome: o.nome || null, dado, tiri: [t] };
    return [ev, ...danneggia(dif, t, o.tipo || (att.arma && att.arma.tipo), ev, ctx)];
  }

  /* poteri del Monaco del Sangue che fanno danno (Sangue versato) */
  const SANGUE_DANNO = ["dardo_di_sangue", "frusta_cremisi", "ebollizione", "meteora_di_sangue", "lancia_di_sangue", "marea_cremisi"];
  /* pool degli scudi del Legno: 5 + k × livello */
  const pool = (b, k) => 5 + k * (b.liv || 1);

  /* ---------- I poteri ---------- */
  /* opz: { sangueVersato: true } per pagare il 10% della salute massima e avere un dado in più (Monaco del Sangue, sopra il 50%).
     I poteri per scontro e giornalieri si consumano alla dichiarazione, anche se l'attacco manca (14/11). */
  function usa(att, dif, id, ctx, opz) {
    pronto(att); pronto(dif); opz = opz || {};
    const disp = disponibile(att, id);
    if (!disp.ok) return { eventi: [{ k: disp.motivo, potere: id }], rifiutato: true };
    const p = potere(id), E = [];
    if (p.tipo === "scontro") att.usati.scontro[id] = true;
    if (p.tipo === "giornaliero") att.usati.giorno[id] = true;
    if (p.rapida) att.rapidaUsata = true;
    /* Segno sulla mappa (Sfera armillare): dichiarato con un potere di classe, lo stato entra senza TS per questo colpo */
    if (opz.segno) {
      const d = disponibileArma(att);
      if (d.ok && d.potere.id === "segno_sulla_mappa") { att.usati.scontro["arma:segno_sulla_mappa"] = true; att.segnoAttivo = true; E.push({ k: "potereArma", id: "segno_sulla_mappa", nome: "Segno sulla mappa" }); }
    }
    E.push({ k: "potere", chi: att.nome, id, nome: p.nome, tipo: p.tipo, ...(opz.gratis ? { gratis: true } : {}), ...(p.rapida ? { rapida: true } : {}) });
    /* Eredità del sepolcro (Monaco, privilegio del livello 1): dopo un giornaliero, fino al tuo turno dimezzi i danni che subisci */
    if (p.tipo === "giornaliero" && (att.tratti || []).includes("eredita_sepolcro")) E.push(buff(att, "eredita", { finoAlTurno: true }));
    /* Sangue versato: sopra il 50%, una volta per turno, 10% della salute massima (per eccesso) per +1 dado; da Vacillante gratis */
    let extra = 0;
    if (att.lampo && !p.rapida) { att.lampo = false; att.lampoAttivo = true; extra = 1; E.push({ k: "lampo" }); } /* Lampo di intuizione: +2 CD e un dado */
    if (att.spec === "sangue" && SANGUE_DANNO.includes(id)) {
      const costo = Math.ceil(att.pvMax / 10);
      if (P.vacillante(att)) { extra = 1; E.push({ k: "sangueVersato", costo: 0 }); }
      else if (opz.sangueVersato && att.pv > att.pvMax / 2 && !att.sangueVersatoTurno) { att.pv -= costo; att.sangueVersatoTurno = true; extra = 1; E.push({ k: "sangueVersato", costo }); }
    }
    /* Via di Aldo: Occhio del cacciatore (livello 2) = il primo potere che fa danno nello scontro tira il doppio dei dadi;
       Odore del sangue (livello 3) = contro un Vacillante i poteri a volontà fanno un dado in più */
    const aldo = att.via === "aldo";
    const occhio = () => { if (aldo && att.liv >= 2 && !att.occhioUsato) { att.occhioUsato = true; E.push({ k: "occhioDelCacciatore" }); return true; } return false; };
    const odore = () => (aldo && att.liv >= 3 && p.tipo === "volonta" && P.vacillante(dif) ? 1 : 0);
    const prendiExtra = () => { const x = extra + odore(); extra = 0; return x; };
    const atk = (o) => { const doppio = occhio() || (o && o.doppiDadi); const r = attacco(att, dif, { nome: id, potere: true, ...o, doppiDadi: doppio, piuDadi: ((o && o.piuDadi) || 0) + prendiExtra() }, ctx); E.push(...r.eventi); return r; };
    /* danno senza tiro per colpire: n dadi + modificatore (15/11, Francesco: la caratteristica una volta per attacco, mai per dado: conMod 0 o 1).
       dadiPiu: dadi di un altro tipo nello stesso colpo (Incubo: +1d6 per Copia). Frattura vale anche qui. */
    /* danno senza tiro per colpire (regola 16/11): mai critico, nessun bonus di caratteristica o di oggetto; conMod resta 0 per tutti i poteri */
    const fisso = (n, dado, conMod, tipo, dadiPiu) => {
      const k2 = occhio() ? 2 : 1, t = tiraDadi(ctx, (n + prendiExtra()) * k2, dado), t2 = dadiPiu ? tiraDadi(ctx, dadiPiu.n * k2, dadiPiu.dado) : [];
      const fr = frattura(att, dif) ? 2 : 0, m = conMod ? mDanno(att, { focus: true }) : 0;
      const e = { k: "dannoFisso", nome: id, tiri: t, dado, mod: m, ...(t2.length ? { tiriPiu: t2 } : {}), ...(fr ? { frattura: fr } : {}) };
      E.push(e, ...danneggia(dif, Math.max(1, somma(t) + somma(t2) + fr + m), tipo, e, ctx)); return e;
    };
    const placca = (n) => { att.placche = Math.min(PLACCHE_MAX, (att.placche || 0) + n); E.push({ k: "placche", tot: att.placche }); };
    const copia = (n) => { att.copie = Math.min(COPIE_MAX, (att.copie || 0) + n); E.push({ k: "copia", tot: att.copie }); };
    const scudo = (k, o) => { const e = P.creaScudo(att, id, pool(att, k), o); E.push(e); return e; };
    const esito = {}; /* un TS solo per potere */
    const stato = (modo, k, extra2) => E.push(...statoSu(att, dif, modo, ctx, k, esito, extra2));
    const vivo = () => dif.pv > 0;
    const vac = P.vacillante(dif);
    const I = { focus: true }; /* poteri degli incantatori: dado dell'arma (o del focus, se più alto) e tipo del potere */
    let r;
    switch (id) {
      /* ---- privilegi del livello 5 ---- */
      case "secondo_vento": E.push(...curaDiClasse(att)); break;
      case "bevi_elisir": att.elisir--; E.push({ ...cura(att, conMani(att, Math.max(1, Math.floor(att.pvMax / 4)))), k: "elisir" }); break;
      case "coagulo": E.push(...curaDiClasse(att)); if (haStato(dif)) { const x = ctx.tira(6); E.push(cura(att, x)); } break;
      case "tocco_lenitivo": { E.push(...curaDiClasse(att)); const k = Object.keys(att.stati).find(x => P.ha(att, x)); if (k) E.push(P.togli(att, k)); break; }

      /* ---- Guerriero ---- */
      case "colpo_di_mestiere": r = atk({ soloDado: true }); if (r.ok && vivo()) stato("applica"); break;
      /* Berserker */
      case "colpo_poderoso": atk({ bonusDanno: haStato(dif) ? 2 : 0 }); break;
      case "guardia_feroce": E.push(buff(att, "guardiaFeroce", { ca: 2, finoAlTurno: true })); break;
      case "spezza_guardia": r = atk({ piuDadi: 1 }); if (r.ok && vivo()) stato("applica", "esposto"); break;
      case "colpo_crudele": r = atk({ piuDadi: 1 }); if (r.ok && vivo()) stato("aggrava"); break;
      case "caccia_al_ferito": r = atk({ piuDadi: vac ? 2 : 1 }); if (r.ok && vac) { dif.nonCarica = 1; E.push({ k: "nonCarica", turni: 1 }); } break;
      case "assalto_implacabile": /* due attacchi indipendenti */
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
      case "resa_dei_conti": for (let i = 0; i < 3 && vivo(); i++) atk({ autoCrit: vac }); break;
      /* Paladino */
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

      /* ---- Sciamano dei Funghi: il tipo di danno è il veleno (gli incantatori tengono il tipo dei poteri, 11/11) ---- */
      case "puntura_di_mandragora": r = atk({ tipo: "veleno" }); if (r.ok && vivo()) stato("applica", "intossicato"); break;
      case "tappeto_di_micelio":
        r = atk({ soloDado: true, tipo: "veleno" });
        if (r.ok && vivo()) { stato("applica", "indebolito"); if (P.ha(dif, "intossicato")) E.push(P.allunga(dif, "intossicato", 1)); }
        break;
      case "pelle_di_micelio": E.push(buff(att, "pelle", { ca: 2, finoAlTurno: true })); break;
      case "spore_del_morbo": r = atk({ piuDadi: 1, tipo: "veleno" }); if (r.ok && vivo()) stato("aggrava", "intossicato"); break;
      case "muffa_che_dilaga": E.push(buff(att, "muffa", { turni: 4 })); break; /* i tuoi 3 turni successivi */
      case "esalazione": /* senza tiro per colpire: un TS Vigore → Indebolito e Stordito (sui boss Indebolito); Intossicato in ogni caso */
        stato("applica", "indebolito"); stato("applica", "stordito");
        E.push(...P.applica(dif, "intossicato", { senzaTs: true, turni: durataDi(att, "intossicato") }));
        break;
      case "cisti_parassita": E.push(buff(att, "cisti", {})); break;
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
      case "marea_di_putrefazione":
        stato("aggrava", "intossicato");
        if (P.ha(dif, "intossicato")) { dif.stati.intossicato.doppio = vac ? 4 : 3; E.push({ k: "marea", turni: dif.stati.intossicato.doppio }); }
        break;

      /* ---- Sciamano del Legno: contundente (Stordito / Commosso) e scudi di PF ---- */
      case "colpo_di_nodo": r = atk({ tipo: "contundente" }); if (r.ok && vivo()) stato("applica", "stordito"); break;
      case "radice_inchiodante":
        r = atk({ soloDado: true, tipo: "contundente" });
        if (r.ok && vivo()) { const com = P.grave(dif, "stordito"); stato("applica", "indebolito"); if (com && P.ha(dif, "indebolito")) E.push(P.allunga(dif, "indebolito", 1)); }
        break;
      case "corteccia_viva": scudo(1); break;                                               /* fino al tuo turno */
      case "pugno_di_quercia": r = atk({ piuDadi: 1, tipo: "contundente" }); if (r.ok && vivo()) stato("aggrava", "stordito"); break;
      case "radici_avvolgenti": scudo(2, { turni: 3 }); E.push(buff(att, "radici", { ca: 2, turni: 3 })); stato("applica", "indebolito"); break;
      case "ghianda_esplosiva": E.push(buff(att, "ghianda", {})); break;
      case "corteccia_nuova": {
        const s0 = P.scudoAttivo(att);
        if (s0) { s0.pf = s0.max; E.push({ k: "scudoPieno", scudo: s0.nome, pf: s0.pf }); }
        else E.push(P.creaScudo(att, "corteccia_viva", pool(att, 1)));
        if (att.colpitoUltimo) stato("applica", "indebolito");
        break;
      }
      case "corazza_di_quercia": stato("aggrava", "stordito"); scudo(3, { scontro: true, sostituisci: true }); E.push(buff(att, "corazza", { ca: 2, turni: 999 })); break;
      case "pioggia_di_rami": E.push(buff(att, "rami", { cariche: 3 })); break;
      case "radice_madre": E.push(buff(att, "radiceMadre", { turni: 999 })); break;
      case "foresta_che_avanza": r = atk({ piuDadi: 2, tipo: "contundente" }); if (r.ok && vivo()) stato("aggrava", "stordito"); E.push(buff(att, "foresta", { cariche: 3 })); break;

      /* ---- Arcanista della Realtà: forza, Esposto / Scoperto, Frattura (+2) ---- */
      case "colpo_di_forza": r = atk({ ...I, tipo: "forza" }); if (r.ok && vivo()) stato("applica", "esposto"); break;
      case "gravita": { fisso(1, 6, 0, "forza"); if (vivo()) { const esp = P.ha(dif, "esposto"); stato("applica", "indebolito"); if (esp && P.ha(dif, "indebolito")) E.push(P.allunga(dif, "indebolito", 1)); } break; }
      case "campo_di_peso": E.push(buff(att, "campo", { ca: 2, finoAlTurno: true })); break;
      case "schianto": r = atk({ ...I, tipo: "forza", piuDadi: 1 }); if (r.ok && vivo()) stato("aggrava", "esposto"); break;
      case "lancia_di_realta": r = atk({ ...I, tipo: "forza", piuDadi: 2 }); if (r.ok && vivo()) stato("applica", "esposto"); break;
      case "spezzare_la_materia": atk({ ...I, tipo: "forza", piuDadi: 1, ignoraRes: true }); break;
      case "doppia_frattura": atk({ ...I, tipo: "forza", piuDadi: P.grave(dif, "esposto") ? 2 : 0 }); break;
      case "sovraccarico": fisso(2, 8, 0, "forza"); if (vivo()) stato("aggrava", "esposto"); break;
      case "collasso_gravitazionale": E.push(buff(att, "collasso", { cariche: 3 })); break;
      case "punto_di_rottura": dif.espostoPerenne = true; E.push({ k: "puntoDiRottura" }); break;
      case "annullamento": fisso(P.grave(dif, "esposto") ? 6 : 4, 8, 0, "forza"); /* 15/11: Scoperto = +2 dadi (era il doppio) */ if (vivo()) stato("aggrava", "esposto"); break;

      /* ---- Arcanista dell'Illusione: psichico, Copie ---- */
      case "dardo_fantasma": atk({ ...I, tipo: "psichico", dadoExtra: att.copie > 0 ? 4 : 0 }); break;
      case "sussurro_illusorio": {
        r = atk({ ...I, dado: 6, soloDado: true, tipo: "psichico" });
        if (r.ok && vivo()) { stato("applica", "indebolito"); copia(1); } /* 15/11: la Copia nasce a ogni colpo a segno (era solo su un Indebolito) */
        break;
      }
      case "riflessi": E.push(buff(att, "riflessi", { ca: 2, finoAlTurno: true })); break;
      case "frantumare": {
        const n = att.copie || 0; att.copie = 0; E.push({ k: "copieConsumate", n });
        if (n) { fisso(n, 6, 0, "psichico"); if (n >= 3 && vivo()) stato("applica", "esposto"); }
        break;
      }
      case "labirinto": stato("applica", "stordito", { attr: "Mente" }); copia(1); break;
      case "sdoppiamento": copia(2); E.push(buff(att, "sdoppiamento", { ca: 2, finoAlTurno: true })); break;
      case "specchio_rotto": copia(1); att.specchio = true; break;
      case "incubo": fisso(2, 8, 0, "psichico", att.copie > 0 ? { n: att.copie, dado: 6 } : null); if (vivo()) stato("applica", "impaurito"); break;
      case "dado_truccato": dif.svantaggio = Math.max(dif.svantaggio || 0, dif.boss ? 2 : 3); E.push({ k: "svantaggio", turni: dif.svantaggio }); break;
      case "teatro_di_specchi": att.copie = COPIE_MAX; E.push({ k: "copia", tot: att.copie }, buff(att, "teatro", { turni: 3 })); break;
      case "grande_inganno": {
        const n = att.copie; att.copie = 0; E.push({ k: "copieConsumate", n });
        fisso(2 * n, 8, 0, "psichico");
        dif.svantaggio = Math.max(dif.svantaggio || 0, 2); E.push({ k: "svantaggio", turni: dif.svantaggio });
        break;
      }

      /* ---- Monaco del Sangue: sangue, Sanguinante, niente cure ---- */
      case "dardo_di_sangue": r = atk({ ...I, tipo: "sangue" }); if (r.ok && vivo()) stato("applica", "sanguinante"); break;
      case "frusta_cremisi": fisso(1, 4, 0, "sangue"); if (vivo()) { stato("applica", "indebolito"); if (P.ha(dif, "sanguinante")) E.push(P.allunga(dif, "sanguinante", 1)); } break;
      case "crosta": E.push(buff(att, "crosta", { ca: 2, finoAlTurno: true })); break;
      case "ebollizione": r = atk({ ...I, tipo: "sangue", piuDadi: 1 }); if (r.ok && vivo()) stato("aggrava", "sanguinante"); break;
      case "meteora_di_sangue": r = atk({ ...I, tipo: "sangue", piuDadi: 1, critDa: P.ha(dif, "sanguinante") ? 19 : 20 }); if (r.ok && vivo()) stato("applica", "esposto"); break;
      case "lancia_di_sangue": atk({ ...I, tipo: "sangue", piuDadi: 2 }); break;
      case "costellazione_rossa": E.push(buff(att, "costellazione", { cariche: 3 })); break;
      case "cuore_spezzato": {
        stato("aggrava", "sanguinante");
        if (P.ha(dif, "sanguinante")) {
          const n = dif.stati.sanguinante.turni * 2;
          for (let i = 0; i < n && vivo(); i++) { const t = P.tick(dif, "sanguinante", ctx.tira); if (t) E.push(t); }
          E.push(P.togli(dif, "sanguinante") || { k: "tolto", stato: "sanguinante" });
        }
        break;
      }
      case "sangue_in_piena": E.push(buff(att, "piena", { turni: 4 })); break; /* i tuoi 3 turni successivi */
      case "vincolo_di_sangue": {
        const z = P.tiroSalvezza(dif, null, fonteDi(att), ctx.tira, "Spirito"); E.push(z);
        if (!z.ok) E.push(buff(att, "vincolo", { turni: 3, su: dif })); else E.push({ k: "resiste" });
        break;
      }
      case "marea_cremisi": {
        const era = P.grave(dif, "sanguinante");
        fisso(4, 8, 0, "sangue"); if (vivo()) { stato("aggrava", "sanguinante"); if (era && P.ha(dif, "sanguinante")) dif.stati.sanguinante.turni = 6; }
        break;
      }

      /* ---- Monaco delle Ossa: ossa, placche ---- */
      case "lancia_d_ossa": atk({ ...I, tipo: "ossa", critDa: 19, gabbia: true }); break;
      case "spine_d_ossa": r = atk({ ...I, dado: 6, soloDado: true, tipo: "ossa", gabbia: true }); if (r.ok && vivo()) stato("applica", "indebolito"); placca(1); break;
      case "armatura_d_ossa": fisso(1, 4, 0, "ossa"); E.push(buff(att, "armaturaOssa", { ca: 2, finoAlTurno: true })); placca(1); break;
      case "spirito_d_ossa": { const n = att.placche; att.placche = 0; E.push({ k: "placcheSpese", n }); fisso(n, 8, 0, "ossa"); break; } /* 22/11: d8 per placca, senza Spirito (regola 16/11) */
      case "lama_d_osso": att.placche--; r = atk({ piuDadi: 2 }); if (r.ok) placca(1); break;
      case "barricata_di_costole": att.placche = PLACCHE_MAX; dif.malusProssimo = 2; E.push({ k: "placche", tot: att.placche }, { k: "barricata" }); break;
      case "decrepitezza": stato("applica", "indebolito"); stato("applica", "esposto"); placca(1); break;
      case "prigione_d_ossa": stato("applica", "stordito"); if (vivo()) E.push(...P.applica(dif, "esposto", { senzaTs: true })); break;
      case "armatura_del_sepolcro": E.push(buff(att, "sepolcro", { cariche: 3 })); break;
      case "armatura_spezzata": E.push(buff(att, "spezzata", {})); break;
      case "armata_dei_morti": fisso(4, 8, 0, "ossa"); if (vivo()) stato("applica", "stordito"); break; /* senza consumare le placche (11/11) */
      /* Ultimo colpo (Lascito di Dafne): garantito, dado dell'arma + 2 dadi, niente bonus né critico; Esposto poi Scoperto senza TS */
      case "ultimo_colpo": {
        const dado = (att.arma && att.arma.dado) || 4, t = tiraDadi(ctx, 3 * (occhio() ? 2 : 1), dado);
        const e = { k: "dannoFisso", nome: id, tiri: t, dado, mod: 0 };
        E.push(e, ...danneggia(dif, somma(t), (att.arma && att.arma.tipo) || null, e, ctx));
        if (vivo()) { E.push(...statoSu(att, dif, "applica", ctx, "esposto", null, { senzaTs: true })); if (vivo()) E.push(...statoSu(att, dif, "aggrava", ctx, "esposto", null, { senzaTs: true })); }
        break;
      }
      default: E.push({ k: "nonImplementato", id });
    }
    att.segnoAttivo = false; att.lampoAttivo = false;
    /* Senza scampo (via di Aldo, livello 4): la prima volta nello scontro che il nemico diventa Vacillante, un colpo gratuito
       (regola del 14/11: va a segno, solo il dado dell'arma, niente bonus né critico né stati) */
    if (!vac && P.vacillante(dif) && dif.pv > 0 && aldo && att.liv >= 4 && !att.senzaScampoUsato && !opz.gratis) {
      att.senzaScampoUsato = true; E.push({ k: "senzaScampo" }, ...colpoGratuito(att, dif, ctx, { nome: "senza_scampo" }));
    }
    return { eventi: E };
  }
  /* il potere a volontà di offesa (il primo della specializzazione) */
  function offesaDi(b) { const s = CATALOGO.specDi && CATALOGO.specDi(CATALOGO.classeDi(b.spec), b.spec); return s ? s.volonta[0] : null; }
  /* inizio scontro: La lanterna (via di Guendalina, livello 2) = immune a Impaurito e +2 a tutti i tiri salvezza */
  function preparaScontro(b) {
    pronto(b); b.immuni = b.immuni || [];
    if (b.via === "guendalina" && b.liv >= 2) { if (!b.immuni.includes("impaurito")) b.immuni.push("impaurito"); b.bonusTs = Math.max(b.bonusTs || 0, 2); }
    return b;
  }
  /* Infuso (Sciamano, privilegio del livello 5, al riposo): un elisir di salute, massimo 2 portati */
  function preparaInfuso(b) { b.elisir = Math.min(2, (b.elisir || 0) + 1); return b.elisir; }

  const API = { STATO_ARMA, statoArma, ca, attacco, usa, disponibile, inizioTurno, fineTurno, fineScontro, riposo, preparaInfuso, preparaScontro, offesaDi, statoSu, danneggia, fonteDi,
    usaRapida, rapidaLibera, cambiaArma, cambiaFaccia, beviPozione, colpoGratuito, spegni, cura, dadoIncanto,
    attaccoBase, disponibileArma, potereArma, usaOggetto, disponibileOggetto, primoPasso, haPrimoPasso, FAMIGLIE_ELISIR, beviElisirStato, POTERI_SET, disponibileSet, usaSet };
  root.Scontro = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof window !== "undefined" ? window : globalThis);
