/* =====================================================================
   POTERI — motore del nuovo combattimento (riscrittura del 05-06/11/2026), senza interfaccia.
   Blocco 1 (08/11/2026): stati, tiro salvezza simmetrico, applica / aggrava, Vacillante, vulnerabilità.
   Contratto: docs/riscrittura_meccaniche.md, sezione 2 («Stati») e 8b («Resistenze e vulnerabilità»).
   Non dipende dal vecchio motore (combattimento.js, magia_combattimento.js, sciamano.js): convivono finché il nuovo non lo sostituisce.

   Un combattente (giocatore o nemico, stesse regole: simmetria totale) è un oggetto:
     { nome, liv, pv, pvMax, mod: { Vigore, Agilità, Mente, Spirito }, boss, bonusTs, immuni: [id stato],
       res: { tipo: "vuln" | "res" | "imm" }, stati: {}, immStordito }
   Chi infligge uno stato è la «fonte»: { liv, modClasse } (CD = 8 + modClasse + liv).
   I dadi arrivano da fuori: tira(d) → 1..d (nei test sono programmati).
   Gli eventi sono dati ({ k: "ts", … }): i testi li scrive chi li mostra.
   ===================================================================== */
(function (root) {
  /* ---------- Costanti decise ---------- */
  const DURATA = 3;              /* tutti gli stati durano 3 turni… */
  const DURATA_IMPAURITO = 2;    /* …tranne Impaurito */
  const DURATA_STORDITO = 1;     /* Stordito fa perdere l'INTERO turno (azione standard e rapida, 11/11/2026), poi 2 turni di immunità */
  const IMMUNITA_STORDITO = 2;
  const CD_BASE = 8;
  const CONFIG = {
    scopertoCritSuiBoss: true    /* riscrittura 2: «sui boss, se pesa troppo: solo −4 CA» → basta mettere false */
  };

  /* Il catalogo: id = nome dello stato lieve. grave = nome dello stato grave (se c'è).
     dado = danno continuativo (lieve / grave). ts = caratteristica del tiro salvezza. tipo = tipo di danno predefinito del danno continuativo */
  const STATI = {
    sanguinante: { nome: "Sanguinante", grave: "Emorragia", dado: [4, 6], ts: "Vigore", tipo: "taglio" },
    scottato:    { nome: "Scottato", grave: "Ustionato", dado: [4, 6], ts: "Agilità", tipo: "fuoco" },
    intossicato: { nome: "Intossicato", grave: "Avvelenato", dado: [4, 6], ts: "Vigore", tipo: "veleno" },
    stordito:    { nome: "Stordito", grave: "Commosso", ts: "Vigore" },
    esposto:     { nome: "Esposto", grave: "Scoperto", ts: "Agilità" },   /* 14/11/2026: Agilità da qualunque fonte (era Mente) */
    indebolito:  { nome: "Indebolito", ts: "Vigore" },
    impaurito:   { nome: "Impaurito", ts: "Spirito" },
    /* stati del sovrano (8e, 11/11/2026): solo da boss, 3 turni, nessun elisir li cura */
    furente:     { nome: "Furente", boss: true },                                   /* sul sovrano: +2 danni (senza TS: se lo dà da solo) */
    maledizione: { nome: "Maledetto", grave: "Condannato", ts: "Spirito", boss: true }, /* cure dimezzate → niente cure */
    vuoto:       { nome: "Svuotato", grave: "Prosciugato", ts: "Mente", boss: true },   /* spegne un per scontro → anche un giornaliero */
    /* stato di Atena (8d, assunzione da misurare): Gelato = −2 per colpire per 3 turni; Congelato aggiunge lo Stordito (TS Vigore) */
    gelo:        { nome: "Gelato", grave: "Congelato", ts: "Vigore", boss: true }
  };
  /* tipi di danno della mappa (8b). Il fuoco sacro è un tipo a sé: le resistenze al fuoco comune non lo toccano */
  /* 11/11/2026: forza (Arcanista della Realtà) e psichico (ex «illusione», Arcanista dell'Illusione) */
  const TIPI = ["taglio", "contundente", "perforante", "forza", "psichico", "sangue", "fuoco", "fuoco_sacro", "ossa", "veleno"];

  const nomeStato = (id, liv) => { const c = STATI[id]; return !c ? id : liv === 2 && c.grave ? c.grave : c.nome; };
  const durataBase = (id) => (id === "impaurito" ? DURATA_IMPAURITO : id === "stordito" ? DURATA_STORDITO : DURATA);
  const st = (b, id) => (b && b.stati && b.stati[id] && b.stati[id].turni > 0 ? b.stati[id] : null);
  const ha = (b, id) => !!st(b, id);
  const grave = (b, id) => { const s = st(b, id); return !!s && s.liv === 2; };
  const mod = (b, attr) => Number(b && b.mod && b.mod[attr]) || 0;
  const prepara = (b) => { b.stati = b.stati || {}; b.immuni = b.immuni || []; return b; };

  /* ---------- Vacillante (sotto il 50% della salute) ---------- */
  const vacillante = (b) => b.pv > 0 && b.pv < b.pvMax / 2;

  /* ---------- Effetti derivati degli stati ---------- */
  /* Esposto −2 CA, Scoperto −4 CA */
  const malusCA = (b) => { const s = st(b, "esposto"); return s ? (s.liv === 2 ? 4 : 2) : 0; };
  /* Indebolito −2 per colpire; Commosso è Indebolito (non si sommano) */
  const malusColpire = (b) => (ha(b, "indebolito") || grave(b, "stordito") || ha(b, "gelo") ? 2 : 0); /* Gelato (Atena) vale come Indebolito: non si somma */
  /* contro uno Scoperto il critico parte da 19 (sui boss solo se CONFIG lo permette) */
  const sogliaCritContro = (b) => (grave(b, "esposto") && (!b.boss || CONFIG.scopertoCritSuiBoss) ? 19 : 20);
  /* Stordito (non Commosso) perde l'azione */
  const puoAgire = (b) => !(ha(b, "stordito") && !grave(b, "stordito"));
  const puoAzioneRapida = puoAgire; /* lo stordimento toglie anche l'azione rapida */
  /* Maledetto: cure dimezzate (per eccesso); Condannato: niente cure */
  const fattoreCure = (b) => (grave(b, "maledizione") ? 0 : ha(b, "maledizione") ? 0.5 : 1);
  /* Impaurito: solo poteri a volontà */
  const soloAVolonta = (b) => ha(b, "impaurito");
  const immuneStordito = (b) => !!(b.boss || (b.immStordito > 0) || (b.immuni || []).includes("stordito"));

  /* ---------- Tiro salvezza (simmetria totale) ---------- */
  const cd = (fonte) => CD_BASE + (Number(fonte && fonte.modClasse) || 0) + (Number(fonte && fonte.liv) || 0) + (Number(fonte && fonte.cdBonus) || 0); /* cdBonus: Mente lucida, Lampo di intuizione */
  /* attr: caratteristica imposta dal potere (Labirinto: Stordito con TS di Mente; Vincolo di sangue: Spirito) */
  function tiroSalvezza(b, id, fonte, tira, attrImposto) {
    const attr = attrImposto || (STATI[id] || {}).ts || "Vigore";
    const c = b.cariche || {};
    /* cariche dell'equipaggiamento (15/11): Piastre del Rettore = il prossimo TS contro uno stato riesce; Elmo della Sentinella = contro Impaurito o Esposto */
    if (id && c.piastre) { delete c.piastre; return { k: "ts", stato: id, attr, auto: "Piastre del Rettore", ok: true, cd: cd(fonte) }; }
    if ((id === "impaurito" || id === "esposto") && c.elmo) { delete c.elmo; return { k: "ts", stato: id, attr, auto: "Elmo della Sentinella", ok: true, cd: cd(fonte) }; }
    const piede = c.piede ? 4 : 0; if (piede) delete c.piede; /* Piede fermo: +4 al prossimo TS */
    const m = mod(b, attr) + (Number(b.liv) || 0) + (Number(b.bonusTs) || 0) + ((b.tsStato && b.tsStato[id]) || 0) + piede /* tsStato: Calzari, Talismano */
      + (id ? Object.values(b.buff || {}).reduce((t, x) => t + (Number(x.tsStati) || 0), 0) : 0); /* Fede incrollabile: +3 ai TS contro gli stati */
    const d = tira(20), tot = d + m, CD = cd(fonte);
    return { k: "ts", stato: id, attr, d, m, tot, cd: CD, ok: tot >= CD };
  }

  /* ---------- Applica / aggrava ---------- */
  /* metti senza tiro: lo stato entra (o si rinnova) al livello dato. La stessa fonte non si somma: rinnova la durata.
     Uno stato grave non torna lieve: riapplicare il lieve rinnova soltanto */
  function metti(b, id, liv, o) {
    o = o || {};
    const prima = b.stati[id], turni = o.turni || durataBase(id);
    const lv = Math.max(liv, prima && prima.turni > 0 ? prima.liv : 1);
    const tipo = o.tipo || (prima && prima.turni > 0 && prima.tipo) || (STATI[id] || {}).tipo;
    const extra = prima && prima.turni > 0 && prima.doppio > 0 ? { doppio: prima.doppio } : {}; /* Marea: il doppio dei dadi sopravvive al rinnovo */
    b.stati[id] = { liv: lv, turni: Math.max(turni, prima && prima.turni > 0 && prima.liv === lv ? prima.turni : 0), ...(tipo ? { tipo } : {}), ...extra };
    return { k: "stato", stato: id, nome: nomeStato(id, lv), liv: lv, turni: b.stati[id].turni, rinnovato: !!(prima && prima.turni > 0) };
  }

  /* applica: lo stato lieve, con tiro salvezza di chi lo subisce. o: { fonte, tira, turni, tipo, senzaTs } */
  function applica(b, id, o) {
    prepara(b); o = o || {};
    if (!STATI[id]) throw new Error("stato sconosciuto: " + id);
    const E = [];
    if (b.immuni.includes(id)) { E.push({ k: "immune", stato: id }); return E; }
    /* sui boss lo stordimento diventa Indebolito */
    if (id === "stordito" && b.boss) { E.push({ k: "convertito", da: "stordito", a: "indebolito" }); return E.concat(applica(b, "indebolito", { ...o, turni: undefined })); }
    if (id === "stordito" && immuneStordito(b)) { E.push({ k: "immune", stato: id, motivo: "dopoStordimento" }); return E; }
    /* un TS solo per potere: chi lo ha già tirato passa l'esito (o.esito = { ok }) e gli stati successivi lo riusano */
    if (!o.senzaTs) {
      if (o.esito && o.esito.ok != null) { if (o.esito.ok) { E.push({ k: "resiste", stato: id, giaTirato: true }); return E; } }
      else {
        const z = tiroSalvezza(b, id, o.fonte, o.tira, o.attr); E.push(z);
        if (o.esito) o.esito.ok = z.ok;
        if (z.ok) { E.push({ k: "resiste", stato: id }); return E; }
      }
    }
    E.push(metti(b, id, 1, o));
    return E;
  }

  /* aggrava: lieve → grave, automatico se il lieve c'è già (niente TS). Senza il lieve, mette solo il lieve (con TS).
     Eccezione: Commosso si mette anche se il bersaglio è immune allo stordimento (boss, immunità dei 2 turni). */
  function aggrava(b, id, o) {
    prepara(b); o = o || {};
    const c = STATI[id]; if (!c) throw new Error("stato sconosciuto: " + id);
    if (!c.grave) return applica(b, id, o);   /* Indebolito, Impaurito: niente grave, si applica (rinnova) */
    if (b.immuni.includes(id)) return [{ k: "immune", stato: id }];
    if (id === "stordito") {
      if (ha(b, "stordito") || immuneStordito(b)) {
        const e = metti(b, "stordito", 2, { turni: o.turni || DURATA });
        return [{ k: "aggravato", stato: id, nome: c.grave }, e];
      }
      return applica(b, id, o);
    }
    if (!ha(b, id)) return applica(b, id, o);
    const giaGrave = grave(b, id), e = metti(b, id, 2, { ...o, turni: o.turni || DURATA });
    return [{ k: giaGrave ? "rinnovato" : "aggravato", stato: id, nome: c.grave }, e];
  }

  /* «dura N turni in più» (Tappeto di micelio, Frusta cremisi, Marchio del rogo…). Niente se lo stato non c'è */
  function allunga(b, id, n) { const s = st(b, id); if (!s) return null; s.turni += n; return { k: "allungato", stato: id, n, turni: s.turni }; }
  function togli(b, id) { if (!ha(b, id)) return null; b.stati[id].turni = 0; return { k: "tolto", stato: id }; }
  function togliTutti(b) { return Object.keys(b.stati || {}).map(id => togli(b, id)).filter(Boolean); }

  /* ---------- Danno, vulnerabilità, Vacillante ---------- */
  /* vulnerabile +50%, resistente −50%: il risultato si arrotonda per eccesso (ASSUNZIONE su «per eccesso»); immune 0 */
  function modificaDanno(b, tipo, danno) {
    const r = tipo && b.res ? b.res[tipo] : null;
    if (r === "imm") return { danno: 0, res: r };
    if (r === "vuln") return { danno: Math.ceil(danno * 1.5), res: r };
    if (r === "res") return { danno: Math.ceil(danno / 2), res: r };
    return { danno, res: null };
  }
  /* il danno subito è la salute effettivamente persa, dopo riduzioni e dimezzamenti. Avvisa quando si diventa Vacillanti */
  /* ---------- Scudi di PF (Sciamano del Legno, 11/11/2026) ----------
     Il danno subito riduce prima lo scudo, poi la salute. Un solo scudo alla volta (o.sostituisci per Corteccia nuova).
     Il danno assorbito non conta come «danno subito». scudo: { nome, pf, max, turni (null = fino al tuo turno), ricarica } */
  const scudoAttivo = (b) => (b && b.scudoPF && b.scudoPF.pf > 0 ? b.scudoPF : null);
  function creaScudo(b, nome, pf, o) {
    o = o || {};
    if (scudoAttivo(b) && !o.sostituisci) return { k: "scudoRifiutato", nome, motivo: "unoAllaVolta" };
    b.scudoPF = { nome, pf, max: pf, turni: o.turni == null ? null : o.turni, scontro: !!o.scontro, ricarica: o.ricarica || 0 };
    return { k: "scudo", nome, pf, max: pf };
  }
  function assorbi(b, n) {
    const s = scudoAttivo(b); if (!s || n <= 0) return 0;
    const a = Math.min(s.pf, n); s.pf -= a; if (s.pf <= 0) b.scudoPF = null; return a;
  }
  function subisci(b, danno, tipo, o) {
    const prima = vacillante(b), m = modificaDanno(b, tipo, Math.max(0, danno));
    const assorbito = o && o.giaAssorbito ? 0 : assorbi(b, m.danno);
    const perso = Math.min(Math.max(0, b.pv), m.danno - assorbito);
    b.pv -= perso;
    const ev = { k: "danno", lordo: danno, danno: perso, tipo: tipo || null, ...(m.res ? { res: m.res } : {}), ...(assorbito ? { assorbito } : {}) };
    if (!prima && vacillante(b)) ev.vacillanteOra = true;
    if (b.pv <= 0) ev.abbattuto = true;
    return ev;
  }

  /* ---------- Turno di chi porta gli stati ---------- */
  /* inizio del turno: i danni continuativi (uno per famiglia; famiglie diverse si sommano) */
  /* un turno di danno continuativo (anche fuori dal turno: Cisti parassita, Cuore di tossina). doppio > 0 = il doppio dei dadi (Marea) */
  function tick(b, id, tira) {
    const s = st(b, id); if (!s || !STATI[id].dado) return null;
    const dado = STATI[id].dado[s.liv - 1], n = s.doppio > 0 ? 2 : 1, tiri = Array.from({ length: n }, () => tira(dado)), d = tiri.reduce((a, x) => a + x, 0);
    /* resStati: resistenza al solo danno continuativo di uno stato (es. creature di cenere: sanguinamento dimezzato) */
    let dd = b.resStati && b.resStati[id] === "res" ? Math.ceil(d / 2) : d;
    const rid = Number(b.riduciTick) || 0; if (rid && dd > 0) { dd = Math.max(0, dd - rid); b.riduciTick = 0; } /* Carne domata: −1 una volta per turno */
    const ev = subisci(b, dd, s.tipo);
    return { ...ev, k: "tick", stato: id, nome: nomeStato(id, s.liv), dado, d, ...(n > 1 ? { tiri } : {}) };
  }
  function inizioTurno(b, tira) {
    prepara(b);
    const E = [];
    ["sanguinante", "scottato", "intossicato"].forEach(id => { const e = tick(b, id, tira); if (e) E.push(e); });
    if (!puoAgire(b)) E.push({ k: "perdeAzione", stato: "stordito" });
    return E;
  }
  /* fine del turno: le durate scendono; finito uno stordimento, 2 turni di immunità */
  function fineTurno(b) {
    prepara(b);
    const E = [];
    if (b.immStordito > 0) b.immStordito--;
    Object.keys(b.stati).forEach(id => {
      const s = b.stati[id]; if (!(s.turni > 0)) return;
      if (s.doppio > 0) s.doppio--;
      if (id === "intossicato" && b.velenoPerenne) return; /* Pestilenza: il veleno non scade */
      if (id === "esposto" && b.espostoPerenne) return;   /* Punto di rottura: l'Esposto non scade */
      s.turni--;
      if (s.turni === 0) {
        E.push({ k: "scade", stato: id, nome: nomeStato(id, s.liv) });
        if (id === "stordito" && s.liv === 1) b.immStordito = IMMUNITA_STORDITO;
      }
    });
    return E;
  }

  /* ogni evento dice su chi cade (per il registro): giocatore e nemici usano le stesse funzioni */
  const conChi = (f) => (b, ...a) => { const r = f(b, ...a), seg = (e) => (e && typeof e === "object" && !e.su ? { su: b.nome, ...e } : e); return Array.isArray(r) ? r.map(seg) : seg(r); };

  const API = {
    DURATA, DURATA_IMPAURITO, DURATA_STORDITO, IMMUNITA_STORDITO, CD_BASE, CONFIG, STATI, TIPI,
    nomeStato, ha, grave, vacillante, malusCA, malusColpire, sogliaCritContro, puoAgire, puoAzioneRapida, soloAVolonta, immuneStordito, fattoreCure,
    cd, durataBase, modificaDanno, subisci, scudoAttivo, creaScudo, assorbi,
    tiroSalvezza: conChi(tiroSalvezza), applica: conChi(applica), aggrava: conChi(aggrava), tick: conChi(tick), allunga: conChi(allunga),
    togli: conChi(togli), togliTutti: conChi(togliTutti), inizioTurno: conChi(inizioTurno), fineTurno: conChi(fineTurno)
  };
  root.Poteri = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof window !== "undefined" ? window : globalThis);
