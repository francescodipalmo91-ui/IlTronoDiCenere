/* =====================================================================
   NEMICI — i nemici comuni sul motore nuovo: dati, poteri e scelta del potere a ogni turno.
   Blocco 3 (08/11/2026). Contratto: docs/riscrittura_meccaniche.md, sezioni 8a-8c (gruppi 1-4).
   Guardiani, sovrano e cacce comuni (gruppo 5, poteri ancora da decidere) arrivano dopo.

   Ogni nemico: salute / CA / attacco / danno (n, dado, bonus); poteri a volontà e per scontro; res (vulnerabilità);
   maledetto (fiamma azzurra: Colpo consacrato +1d4). Le statistiche sono quelle approvate; quelle «da misurare» sono segnate.
   ===================================================================== */
(function (root) {
  const P = root.Poteri || (typeof require === "function" ? require("./poteri.js") : null);
  const S = root.Scontro || (typeof require === "function" ? require("./scontro.js") : null);

  /* Poteri dei nemici, descritti con pochi ingredienti:
     attacco: tiro per colpire (soloDado = solo il dado; piuDadi); poi applica / aggrava gli stati elencati (un TS solo per potere)
     soffio: danno senza tiro per colpire (n dadi da dado), poi gli stati
     ts: niente danno, solo lo stato con il suo tiro salvezza (Ululato, Ringhio)
     difesa: un effetto su di sé fino al suo turno (Ceneri sul pelo)
     fuga: il nemico scappa (cervo) */
  const A = (nome, o) => ({ nome, k: "attacco", ...(o || {}) });
  const POTERI = {
    morso: A("Morso"), beccata: A("Beccata"), zannata: A("Zannata"), incornata: A("Incornata"),
    morso_sporco: A("Morso sporco", { soloDado: true, applica: ["intossicato"] }),
    morso_infetto: A("Morso infetto", { aggrava: ["intossicato"] }),
    becco_a_uncino: A("Becco a uncino", { soloDado: true, applica: ["sanguinante"] }),
    picchiata_agli_occhi: A("Picchiata agli occhi", { applica: ["indebolito"] }),
    morso_lacerante: A("Morso lacerante", { soloDado: true, applica: ["sanguinante"] }),
    azzannare: A("Azzannare e trascinare", { aggrava: ["sanguinante"] }),
    spallata: A("Spallata", { soloDado: true, applica: ["indebolito"] }),
    carica: A("Carica", { piuDadi: 1, applica: ["stordito"] }),
    fuga: { nome: "Fuga", k: "fuga" },
    morso_velenoso: A("Morso velenoso", { soloDado: true, applica: ["intossicato"] }),
    veleno_concentrato: A("Veleno concentrato", { aggrava: ["intossicato"] }),
    /* infernali */
    nube_di_cenere: A("Nube di cenere", { soloDado: true, applica: ["indebolito"] }),
    morso_di_cenere_ratto: A("Morso di cenere", { piuDadi: 1, applica: ["esposto"] }),
    becco_ardente: A("Becco ardente", { soloDado: true, applica: ["scottato"] }),
    picchiata_in_fiamme: A("Picchiata in fiamme", { aggrava: ["scottato"] }),
    morso_ardente: A("Morso ardente", { soloDado: true, applica: ["scottato"] }),
    veleno_rovente: A("Veleno rovente", { aggrava: ["scottato"], applica: ["intossicato"] }),
    scrollata_di_cenere: A("Scrollata di cenere", { soloDado: true, applica: ["indebolito"] }),
    carica_di_cenere: A("Carica di cenere", { piuDadi: 1, applica: ["stordito"] }),
    zanne_roventi: A("Zanne roventi", { soloDado: true, applica: ["scottato"] }),
    carica_rovente: A("Carica rovente", { piuDadi: 1, aggrava: ["scottato"] }),
    morso_di_cenere_lupo: A("Morso di cenere", { soloDado: true, applica: ["indebolito"] }),
    ululato: { nome: "Ululato", k: "ts", applica: ["impaurito"] },
    /* mastini */
    presa: A("Presa", { soloDado: true, applica: ["indebolito"] }),
    soffio_infuocato: { nome: "Soffio infuocato", k: "soffio", n: 1, dado: 6, aggrava: ["scottato"] },
    soffio_infuocato_2: { nome: "Soffio infuocato", k: "soffio", n: 2, dado: 6, aggrava: ["scottato"] },
    ceneri_sul_pelo: { nome: "Ceneri sul pelo", k: "difesa", buff: "ceneri" },
    soffio_di_cenere: { nome: "Soffio di cenere", k: "soffio", n: 2, dado: 6, applica: ["indebolito", "scottato"] },
    ringhio_della_soglia: { nome: "Ringhio della soglia", k: "ts", applica: ["impaurito"] },
    spallata_corazzata: A("Spallata corazzata", { soloDado: true, applica: ["indebolito"] }),
    carica_di_ferro: A("Carica di ferro", { piuDadi: 1, applica: ["stordito"], carica: true })
  };

  const CENERE = { fuoco: "res", contundente: "vuln" }, BRACE = { fuoco: "res", perforante: "vuln" };
  const MASTINO = { fuoco: "imm", fuoco_sacro: "vuln" };
  /* salute, CA, attacco, danno [n, dado, bonus]; volonta: [attacco base, stato, (terzo)]; scontro: [per scontro] */
  const N = (o) => o;
  const NEMICI = {
    /* gruppo 1, animali normali: neutri a tutto */
    ratto: N({ nome: "Ratto", liv: 1, pv: 5, ca: 10, att: 0, danno: [1, 3, 0], volonta: ["morso", "morso_sporco"], scontro: ["morso_infetto"] }),
    corvo: N({ nome: "Corvo", liv: 1, pv: 4, ca: 12, att: 1, danno: [1, 3, 0], volonta: ["beccata", "becco_a_uncino"], scontro: ["picchiata_agli_occhi"] }),
    lupo: N({ nome: "Lupo", liv: 1, pv: 10, ca: 12, att: 2, danno: [1, 6, 0], volonta: ["morso", "morso_lacerante"], scontro: ["azzannare"] }),
    cinghiale: N({ nome: "Cinghiale", liv: 1, pv: 12, ca: 11, att: 2, danno: [1, 6, 1], volonta: ["zannata", "spallata"], scontro: ["carica"] }),
    cervo: N({ nome: "Cervo", liv: 1, pv: 9, ca: 11, att: 0, danno: [1, 4, 0], volonta: ["incornata"], scontro: [], fuggeAlTurno: 2 }), /* come oggi in gioco.html */
    vipera: N({ nome: "Vipera", liv: 1, pv: 5, ca: 13, att: 3, danno: [1, 3, 0], volonta: ["morso", "morso_velenoso"], scontro: ["veleno_concentrato"] }),
    /* gruppo 2, infernali (maledetti): Cenere e Brace */
    ratto_di_cenere: N({ nome: "Ratto di cenere", liv: 1, pv: 8, ca: 10, att: 1, danno: [1, 4, 1], volonta: ["morso", "nube_di_cenere"], scontro: ["morso_di_cenere_ratto"], res: CENERE, resStati: { sanguinante: "res" }, maledetto: true }),
    corvo_di_brace: N({ nome: "Corvo di brace", liv: 1, pv: 8, ca: 11, att: 2, danno: [1, 4, 1], volonta: ["beccata", "becco_ardente"], scontro: ["picchiata_in_fiamme"], res: BRACE, maledetto: true }),
    vipera_di_brace: N({ nome: "Vipera di brace", liv: 1, pv: 8, ca: 13, att: 3, danno: [1, 4, 1], volonta: ["morso", "morso_ardente"], scontro: ["veleno_rovente"], res: BRACE, maledetto: true }),
    cervo_di_cenere: N({ nome: "Cervo di cenere", liv: 1, pv: 12, ca: 11, att: 2, danno: [1, 6, 0], volonta: ["incornata", "scrollata_di_cenere"], scontro: ["carica_di_cenere"], res: CENERE, resStati: { sanguinante: "res" }, maledetto: true }),
    cinghiale_di_brace: N({ nome: "Cinghiale di brace", liv: 2, pv: 14, ca: 11, att: 2, danno: [1, 6, 1], volonta: ["zannata", "zanne_roventi"], scontro: ["carica_rovente"], res: BRACE, maledetto: true }),
    lupo_di_cenere: N({ nome: "Lupo di cenere", liv: 2, pv: 14, ca: 12, att: 3, danno: [1, 6, 1], volonta: ["morso", "morso_di_cenere_lupo"], scontro: ["ululato"], res: CENERE, resStati: { sanguinante: "res" }, maledetto: true }),
    /* gruppo 3, mastini (maledetti, dentro casa): fuoco comune ⛔, fuoco sacro ✓ */
    mastino: N({ nome: "Mastino", liv: 1, pv: 13, ca: 10, att: 2, danno: [1, 4, 1], volonta: ["morso", "presa"], scontro: ["soffio_infuocato"], res: MASTINO, maledetto: true }),
    mastino_secondo_piano: N({ nome: "Mastino del secondo piano", liv: 2, pv: 18, ca: 11, att: 3, danno: [1, 6, 1], volonta: ["morso", "presa"], scontro: ["soffio_infuocato_2"], res: MASTINO, maledetto: true, daMisurare: "statistiche proposte" }),
    /* gruppo 4, élite: annunciano i poteri per scontro un turno prima */
    mastino_della_soglia: N({ nome: "Mastino della soglia di Adele", liv: 4, pv: 30, ca: 13, att: 5, danno: [1, 6, 2], volonta: ["morso", "presa", "ceneri_sul_pelo"],
      scontro: ["soffio_di_cenere", "ringhio_della_soglia"], res: { ...MASTINO, illusione: "vuln" }, maledetto: true, elite: true, daMisurare: "statistiche stimate (10-20% di sconfitte)" }),
    mastino_corazzato: N({ nome: "Mastino corazzato", liv: 5, pv: 40, ca: 15, caVacillante: 13, att: 6, danno: [1, 8, 3], volonta: ["morso", "presa", "spallata_corazzata"],
      scontro: ["soffio_infuocato_2", "carica_di_ferro"], res: { ...MASTINO, taglio: "res", perforante: "vuln" }, maledetto: true, elite: true, rune: true, daMisurare: "statistiche stimate (10-20% di sconfitte)" })
  };

  /* un nemico pronto per lo scontro. ASSUNZIONI: caratteristiche a +0 (TS = d20 + livello); la CD dei suoi stati è 8 + attacco + livello */
  function crea(id, o) {
    const d = NEMICI[id]; if (!d) throw new Error("nemico sconosciuto: " + id);
    return S.preparaScontro(Object.assign({
      id, nome: d.nome, liv: d.liv, pv: d.pv, pvMax: d.pv, caBase: d.ca, caVacillante: d.caVacillante, modAtt: d.att, modDanno: d.danno[2], modClasse: d.att,
      arma: { n: d.danno[0], dado: d.danno[1], tipo: null }, mod: {}, res: d.res || {}, resStati: d.resStati, maledetto: !!d.maledetto, boss: false,
      volonta: d.volonta, scontro: d.scontro, elite: !!d.elite, fuggeAlTurno: d.fuggeAlTurno || 0,
      rune: !!d.rune, turno: 0, stati: {}, buff: {}
    }, o || {}));
  }

  /* lo stato principale che il nemico cerca di mettere (quello del suo secondo a volontà) */
  const statoFirma = (n) => { const p = POTERI[n.volonta[1]]; return p && (p.applica || p.aggrava || [])[0]; };
  const usato = (n, id) => !!(n.usati && n.usati.scontro[id]);

  /* Scelta del potere (8c): primo turno lo stato; poi il per scontro quando lo stato è attivo; poi alternano gli a volontà.
     Gli élite annunciano il per scontro un turno prima (la runa pulsa) e quel turno attaccano con un a volontà.
     Impaurito: solo a volontà. Caccia al ferito / Silenzio della casa (nonCarica): niente per scontro né annunci. */
  function scegli(n, pg) {
    const t = n.turno;
    if (n.fuggeAlTurno && t >= n.fuggeAlTurno) return { id: "fuga" };
    const libero = !P.soloAVolonta(n) && !(n.nonCarica > 0);
    if (n.pronto && libero) return { id: n.pronto, eseguiAnnunciato: true };
    const sf = statoFirma(n);
    const disponibili = n.scontro.filter(id => !usato(n, id));
    const alterna = () => n.volonta[(t - 1) % n.volonta.length];
    if (t === 1 && n.volonta[1]) return { id: n.volonta[1] };
    if (libero && disponibili.length) {
      const attivo = !sf || P.ha(pg, sf) || n.elite;
      if (attivo) return n.elite ? { id: alterna(), annuncia: disponibili[0] } : { id: disponibili[0] };
    }
    return { id: alterna() };
  }

  /* il turno del nemico: sceglie, annuncia, esegue. Chi gestisce lo scontro chiama prima Scontro.inizioTurno(n, pg, ctx) */
  function agisci(n, pg, ctx) {
    S.preparaScontro(n);
    n.turno = (n.turno || 0) + 1;
    if (!P.puoAgire(n)) return { eventi: [{ k: "perdeAzione", chi: n.nome }] };
    const sc = scegli(n, pg), E = [];
    if (sc.annuncia) { n.pronto = sc.annuncia; n.usati.scontro[sc.annuncia] = true; E.push({ k: "annuncio", chi: n.nome, potere: sc.annuncia, nome: POTERI[sc.annuncia].nome }); }
    if (sc.eseguiAnnunciato) n.pronto = null;
    n.ultimo = sc.id;
    E.push(...esegui(n, pg, sc.id, ctx));
    return { eventi: E, scelta: sc };
  }

  function esegui(n, pg, id, ctx) {
    const p = POTERI[id]; if (!p) throw new Error("potere sconosciuto: " + id);
    const E = [{ k: "poterNemico", chi: n.nome, id, nome: p.nome }];
    if (n.scontro.includes(id)) {
      n.usati.scontro[id] = true;
      if (n.rune) E.push({ k: "runaSpenta", potere: id });
    }
    const esito = {}, stati = () => {
      (p.aggrava || []).forEach(k => { if (pg.pv > 0) E.push(...S.statoSu(n, pg, "aggrava", ctx, k, esito)); });
      (p.applica || []).forEach(k => { if (pg.pv > 0) E.push(...S.statoSu(n, pg, "applica", ctx, k, esito)); });
    };
    switch (p.k) {
      case "attacco": { const r = S.attacco(n, pg, { nome: id, soloDado: p.soloDado, piuDadi: p.piuDadi, carica: p.carica }, ctx); E.push(...r.eventi); if (r.ok && !r.annullato) stati(); break; }
      case "soffio": {
        const t = Array.from({ length: p.n }, () => ctx.tira(p.dado)), e = { k: "soffio", tiri: t };
        E.push(e, ...S.danneggia(pg, t.reduce((a, x) => a + x, 0), "fuoco", e, ctx)); stati(); break;
      }
      case "ts": stati(); break;
      case "difesa": n.buff[p.buff] = { finoAlTurno: true }; E.push({ k: "buff", id: p.buff }); break;
      case "fuga": n.fuggito = true; E.push({ k: "fuga", chi: n.nome }); break;
    }
    return E;
  }

  /* rune del mastino corazzato, per la scheda: due per i poteri per scontro, la terza (petto) si spegne da Vacillante; pulsa = sta per scattare */
  function statoRune(n) {
    if (!n.rune) return null;
    /* accesa finché il potere non è usato; annunciato = accesa e pulsa veloce; spezzato (Spezza-carica) = spenta */
    return [...n.scontro.map(id => ({ potere: id, accesa: !usato(n, id) || n.pronto === id, pulsaVeloce: n.pronto === id })),
      { potere: "armatura", accesa: !P.vacillante(n), pulsaVeloce: false }];
  }

  /* Descrizione di un potere ricavata dai dati (stessa fonte del codice: non può andare fuori sincrono).
     n = il nemico creato (per i numeri veri: attacco, danno, CD); senza n la descrizione resta generica. */
  const ATTR_TS = (k) => (P.STATI[k] || {}).ts || "Vigore";
  function descrivi(id, n) {
    const p = POTERI[id]; if (!p) return "";
    const cd = n ? `CD ${P.cd({ liv: n.liv, modClasse: n.modClasse })}` : "CD del nemico";
    const dado = n ? `${n.arma.n}d${n.arma.dado}` : "il suo dado";
    const parti = [];
    if (p.k === "attacco") {
      const nd = p.piuDadi ? (n ? `${n.arma.n + p.piuDadi}d${n.arma.dado}` : "un dado in più") : dado;
      parti.push(`Attacco (d20 ${n ? "+ " + n.modAtt : ""} contro la tua CA): ${nd}${p.soloDado ? " (solo il dado)" : n && n.modDanno ? " + " + n.modDanno : ""}.`);
    }
    if (p.k === "soffio") parti.push(`Senza tiro per colpire: ${p.n}d${p.dado} di fuoco.`);
    if (p.k === "ts") parti.push("Nessun danno.");
    if (p.k === "difesa") parti.push("Fino al suo prossimo turno, chi lo colpisce in mischia diventa Scottato (tuo TS Agilità). Gli incantesimi con il focus no.");
    if (p.k === "fuga") parti.push("Scappa: lo scontro finisce senza vincitore.");
    const se = p.k === "attacco" ? "Se colpisce, " : "";
    (p.aggrava || []).forEach(k => parti.push(`${se ? se + "aggrava" : "Aggrava"} ${P.nomeStato(k, 1)}: se ce l'hai già diventa ${P.nomeStato(k, 2)} (senza tiro salvezza), altrimenti te lo applica (TS ${ATTR_TS(k)}, ${cd}).`));
    const ap = p.applica || [];
    if (ap.length) parti.push(`${p.aggrava ? "Poi " : se}applica ${ap.map(k => P.nomeStato(k, 1) + (k === "stordito" ? " (perdi l'azione)" : "")).join(" e ")} (tuo TS ${ATTR_TS(ap[0])}, ${cd}${ap.length > 1 || (p.aggrava || []).length ? ", un tiro solo per tutto il potere" : ""}).`);
    if (p.carica) parti.push("Colpo caricato: distrugge tutte le Copie dell'Illusione.");
    return parti.join(" ");
  }
  /* la regola con cui sceglie, in parole (8c) */
  const REGOLA_SCELTA = "Primo turno: il suo secondo a volontà (lo stato). Poi il per scontro, quando lo stato è già su di te; altrimenti alterna gli a volontà. Gli élite annunciano il per scontro un turno prima e quel turno attaccano comunque. Impaurito: solo a volontà. Caccia al ferito e Silenzio della casa gli impediscono di caricare.";

  const API = { POTERI, NEMICI, crea, scegli, agisci, esegui, statoRune, descrivi, REGOLA_SCELTA };
  root.Nemici = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof window !== "undefined" ? window : globalThis);
