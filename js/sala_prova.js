/* =====================================================================
   SALA DI PROVA DEL COMBATTIMENTO — tutorial.html?prova
   Strumento di sviluppo (solo italiano): prova tecniche, stati, ira, posti, vie e boss
   con le stesse regole della partita (js/combattimento.js), senza entrare in gioco.
   - Personaggio: livello, Vigore, Agilità, CA, arma, scudo, via e serie della via (arma o scudo).
   - Nemico: mastino comune, Ettore (boss) o manichino; boss forzabile; PV e CA modificabili.
   - Dadi truccati: una coda di valori usati dai prossimi tiri (qualsiasi dado), per risultati certi.
   - «Esegui i test»: gli stessi test di tests/combattimento.test.js, tests/magia_combattimento.test.js e tests/sciamano.test.js, nel browser.
   - Sciamano: tecniche della natura (js/sciamano.js), punti natura dallo Spirito, veleno, trappole, Scudo di Corteccia.
   Non tocca i personaggi e le partite salvate.
   ===================================================================== */
(function () {
  if (!window.MODALITA_PROVA) return;
  const C = window.Combattimento, M = window.MagiaCombattimento, MG = window.MAGIA, TEC = window.TECNICHE || [], R = window.Regole, S = window.Sciamano;
  const $ = (id) => document.getElementById(id);
  const mod = (v) => Math.floor((Number(v) - 10) / 2);
  const fmt = (n) => (n < 0 ? "−" : "+") + Math.abs(n);
  const el = (tag, attrs, ...figli) => {
    const e = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => { if (k === "class") e.className = v; else if (k === "text") e.textContent = v; else if (k.startsWith("on")) e.addEventListener(k.slice(2), v); else if (v !== false && v != null) e.setAttribute(k, v === true ? "" : v); });
    figli.flat().forEach(f => f != null && e.append(f));
    return e;
  };

  const ARMI = [
    { nome: "Spada corta", dado: 6, tipo: "Tagliente" }, { nome: "Ascia da battaglia", dado: 8, tipo: "Tagliente" },
    { nome: "Bastone", dado: 6, tipo: "Contundente" }, { nome: "Martello da battaglia", dado: 8, tipo: "Contundente" },
    { nome: "Mazza chiodata", dado: 6, tipo: "Perforante" }, { nome: "Piccone da battaglia", dado: 8, tipo: "Perforante" }
  ];
  /* gli stessi valori di NEMICI in gioco.html */
  const NEMICI = {
    mastino: { nome: "Mastino infernale (comune)", ca: 10, dadoVita: 6, dannoDado: 4, attacco: 1, boss: false, probPresa: 0.6, probSoffio: 0.4, soffio: { cd: 12, dadi: 2, dado: 6, ricarica: 5 }, arma: false },
    ettore: { nome: "Ettore (boss)", ca: 13, dadoVita: 8, dannoDado: 6, attacco: 1, boss: true, probPresa: 0, probSoffio: 0, soffio: null, arma: true, resa: true },
    manichino: { nome: "Manichino (non attacca)", ca: 12, pv: 60, boss: false, passivo: true, arma: false }
  };
  const NOMI_EFF = { sanguina: "Sanguinamento", frattura: "Frattura", intontito: "Intontito", debole: "Indebolito", sbilanciato: "Sbilanciato", silenzio: "Inibito", frastornato: "Frastornato", bloccato: "Stordito", guardia: "Guardia alzata", furore: "Furore inarrestabile", esposto: "Esposto", precisione: "Mille Soli", baluardo: "Baluardo d'Acciaio", fortezza: "Fortezza Eterna", runa: "Runa sull'arma", occhio: "Occhio del Tomo", tomo: "Tomo Proibito", quiete: "Quiete Assoluta", muro: "Muro di forza", scudo: "Scudo", invuln: "Invulnerabilità", pressione: "Pressione", parola: "Parola Vera", santuario: "Santuario", voto: "Voto di Luce", gemella: "Ombra Gemella", cerchio: "Cerchio del Focolare", fiamma: "Fiamma Calda", notte: "Notte Senza Fine", furia: "Furia Cinerea", manto: "Manto d'Ombra", seconda: "Seconda Vita", accecato: "Accecato", avvizzito: "Avvizzito", paura: "Terrore", corona: "Corona di Raggi",
    avvelenato: "Avvelenato", marea: "Marea di Putrefazione", rivest: "Arma rivestita", linfaFuria: "Linfa Furiosa", pelle: "Pelle di Corteccia", infuso: "Infuso di Linfa Vitale", aura: "Aura di Purificazione", rinascita: "Rinascita del Sottobosco", bulbo: "Bulbo primordiale" };
  const DESC_EFF = { frattura: "1d4 danni a ogni suo attacco", intontito: "niente critici", debole: "−2 per colpire", sbilanciato: "−2 alla Classe armatura", silenzio: "niente Presa né Soffio", frastornato: "−4 per colpire, niente critici", bloccato: "salta il prossimo turno", furore: "+4 ai tiri salvezza e alle prove contrapposte", esposto: "i tuoi attacchi fanno critico con un numero in meno, mai sotto 18", precisione: "i tuoi attacchi fanno critico da 18 a 20" };
  const EFF_PG = ["guardia", "baluardo", "fortezza", "furore", "precisione", "scudo", "muro", "invuln", "runa", "occhio", "tomo", "quiete", "santuario", "voto", "gemella", "cerchio", "fiamma", "notte", "furia", "manto", "seconda", "rivest", "linfaFuria", "pelle", "infuso", "aura", "rinascita", "bulbo"];
  const arcanista = () => !!pg && (pg.classe === "arcanista" || pg.classe === "monaco"); /* incantatori: mana o punti fede */
  const monaco = () => !!pg && pg.classe === "monaco";
  const sciamano = () => !!pg && pg.classe === "sciamano" && !!S; /* tecniche della natura e punti natura */
  const risorsa = () => (arcanista() ? (monaco() ? "fede" : "mana") : sciamano() ? "natura" : "ira");
  const SCUOLE = () => (monaco() ? ["luce", "ombra"] : ["arcano", "forza"]);

  /* ---------- dadi: coda truccata, poi caso ---------- */
  const coda = [];
  const tira = (d) => { if (coda.length) { const v = coda.shift(); mostraCoda(); return Math.max(1, Math.min(d, v)); } return 1 + Math.floor(Math.random() * d); };

  /* ---------- stato ---------- */
  let pg = null, nem = null, s = null, turnoPg = false, finito = true, nTurno = 0;
  const preparate = new Set(); let perRiposo = {};

  function leggiPg() {
    const p = leggiPgBase();
    p.classe = $("pClasse") ? $("pClasse").value : "guerriero";
    if (p.classe === "arcanista" || p.classe === "monaco") { p.mente = Number($("pMen").value); p.modM = mod(p.mente); p.iraMax = C.iraMax(p.modM, p.liv); } /* il mana cresce come l'ira: 10 + Mente, poi Mente + livello a ogni salita */
    if (p.classe === "sciamano") { p.modS = mod(Number($("pMen").value)); p.iraMax = C.iraMax(p.modS, p.liv); } /* punti natura: 10 + Spirito, poi Spirito + livello */
    return p;
  }
  function leggiPgBase() {
    const liv = Number($("pLiv").value), vig = Number($("pVig").value), agi = Number($("pAgi").value), arma = ARMI[Number($("pArma").value)];
    const modV = mod(vig);
    const pvMax = Number($("pPv").value) || (20 + modV + (liv - 1) * Math.max(1, 6 + modV));
    return { liv, vig, modV, modAgi: mod(agi), ca: Number($("pCa").value) || 14, arma, scudo: $("pScudo").checked, via: liv >= 3 ? $("pVia").value || null : null, serie: $("pSerie").value === "scudo" ? "scudo" : "arma", pvMax, iraMax: C.iraMax(modV, liv) };
  }
  const caPg = () => pg.ca + (s && C.attivo(s, "guardia") ? Number(s.guardiaVal) || 0 : 0) + (s && C.attivo(s, "scudo") ? 2 : 0) + (s && C.attivo(s, "muro") ? 3 : 0) + (s && C.attivo(s, "cerchio") ? 2 : 0);
  const caNem = () => nem.ca - (s ? C.malusCA(s) : 0); /* Sbilanciato e Incrinatura */
  const tipoOk = (t) => t.tipo === "Utilita" || t.tipo === "Natura" || (t.tipo === "Scudo" ? pg.scudo : t.tipo === pg.arma.tipo);
  const opzioni = () => sciamano() ? TEC.filter(t => t.classe === "Forestiero" && !t.via && t.liv <= pg.liv) : TEC.filter(t => t.tipo !== "Utilita" && !t.via && t.liv <= pg.liv && (t.tipo === pg.arma.tipo || (t.tipo === "Scudo" && pg.scudo)));
  const utilita = () => (sciamano() ? [] : TEC.filter(t => t.tipo === "Utilita" && t.liv <= pg.liv));
  const tipoVia = () => (pg.serie === "scudo" ? "Scudo" : pg.arma.tipo); /* serie della via preparata al riposo: arma o scudo */
  const dellaVia = () => pg.via ? TEC.filter(t => t.via === pg.via && t.tipo === (sciamano() ? "Natura" : tipoVia()) && t.liv <= pg.liv) : [];
  const scudoPosti = () => !sciamano() && pg.scudo;
  const ignoraPosti = () => $("pIgnora").checked;
  const prepT = () => [...preparate].map(id => TEC.find(t => t.id === id)).filter(Boolean);

  const passoDado = (d) => (d >= 12 ? 12 : d + 2); /* Runa sull'Arma: 1d6 → 1d8 → 1d10 → 1d12 */
  function ctx() {
    const c = ctxBase();
    if (arcanista()) Object.assign(c, {
      modAtt: pg.modM, modDanno: pg.modM, cd: 8 + pg.modM + pg.liv, dado: s && C.attivo(s, "runa") ? passoDado(pg.arma.dado) : pg.arma.dado,
      manaPiu: (n) => { const r = Math.min(n, pg.iraMax - pg.ira); pg.ira += r; return r; }, dannoMente: (n) => n,
      cura: (n) => { const f = Math.min(n, pg.pvMax - pg.pv); pg.pv += f; return f; }, pvMancanti: () => pg.pvMax - pg.pv, dannoCorpo: (n) => { const f = Math.min(n, pg.pv - 1); pg.pv -= f; return f; }
    });
    if (sciamano()) Object.assign(c, {
      modSpirito: pg.modS, resisteVeleno: !!($("nResiste") && $("nResiste").checked), linfaRigeneratrice: pg.via === "guendalina",
      naturaPiu: (n) => { const r = Math.min(n, pg.iraMax - pg.ira); pg.ira += r; return r; }, dannoPg: (n) => { pg.pv -= n; }
    });
    return c;
  }
  function ctxBase() {
    return {
      tira, liv: pg.liv, modAtt: pg.modV, modDanno: pg.modV, dado: pg.arma.dado, ca: caNem, boss: nem.boss,
      cd: 8 + pg.modV + pg.liv, modTs: mod(nem.vigore),
      curaPg: (n) => { pg.pv = Math.min(pg.pvMax, pg.pv + n); },
      iraPiu: (n) => { pg.ira = Math.min(pg.iraMax, pg.ira + n); },
      usataPerRiposo: (id) => !!perRiposo[id], segnaPerRiposo: (id) => { perRiposo[id] = true; }
    };
  }

  /* ---------- diario ---------- */
  function log(testo, cls) { const p = el("p", { class: "voce " + (cls || "") }); p.textContent = testo; $("svLog").append(p); $("svLog").scrollTop = $("svLog").scrollHeight; return p; }
  function blocco(titolo, righe, cls) {
    const d = el("div", { class: "voce riquadro " + (cls || "") }, el("b", { text: titolo }));
    righe.filter(Boolean).forEach(r => d.append(el("span", { class: "riga", text: r })));
    $("svLog").append(d); $("svLog").scrollTop = $("svLog").scrollHeight;
  }
  const durata = (n) => (n === 1 ? "1 turno" : `${n} turni`);
  function testoEventi(eventi) {
    const r = [];
    eventi.forEach(e => {
      switch (e.k) {
        case "colpo":
          if (!e.ok) { r.push(`Mancato: d20 ${e.d} ${fmt(e.mA)} = ${e.tot} contro CA ${e.ca}.`); break; }
          r.push(`${e.crit ? "CRITICO" : "Colpito"}: d20 ${e.d} ${fmt(e.mA)} = ${e.tot} contro CA ${e.ca}${e.critDa ? ` (critico da ${e.critDa})` : ""}. Danno ${e.nd}d${e.dado} [${e.tiri.join("+")}] ${fmt(e.mm)}${e.marchio ? ` + marchio ${e.marchio}` : ""}${e.sigillo ? ` + sigillo ${e.sigillo}` : ""}${e.segno ? ` + segno ${e.segno}` : ""} = ${e.danno}.`); break;
        case "stato": r.push(e.s === "sanguina" ? `${e.dado === 6 ? "Emorragia" : "Sanguinamento"} 1d${e.dado} per ${durata(e.turni)}.` : `${NOMI_EFF[e.s] || e.s} per ${C.perScontro(e.turni) ? "tutto lo scontro" : durata(e.turni)}${DESC_EFF[e.s] ? ` (${DESC_EFF[e.s]})` : ""}.`); if (e.ridotto) r.push(`Boss: durata ridotta a ${durata(e.turni)}.`); break;
        case "immune": r.push(`Boss: «${NOMI_EFF[e.s]}» non ha effetto.`); break;
        case "ts": r.push(`Tiro salvezza del nemico: d20 ${e.d} ${fmt(e.m)} = ${e.tot} contro CD ${e.cd} → ${e.ok ? "resiste" : "non resiste"}.`); break;
        case "resiste": break;
        case "sangueTutto": r.push(`La ferita si apre del tutto: ${e.n} × d${e.dado} [${e.tiri.join("+")}] = ${e.tot} danni; il sanguinamento finisce.`); break;
        case "cura": r.push(`Recuperi ${e.n} punti di salute.`); break;
        case "prossimo": r.push(e.bonus ? `Il tuo prossimo attacco avrà +${e.bonus} per colpire.` : "Il tuo prossimo attacco avrà un dado di danno in più."); break;
        case "guardia": r.push(`+${e.val} alla tua CA per ${durata(e.turni)}.`); break;
        case "esecuzione": r.push("Esecuzione: il nemico comune sotto un quarto della salute muore."); break;
        case "marchio": r.push("Il nemico è marchiato finché sanguina (+1d4 agli attacchi normali)."); break;
        case "crepe": r.push(`Incrinatura: +${e.n} (${e.tot}/${e.max}, −${e.tot} alla CA)${e.perse ? `, ${e.perse} oltre il massimo perse` : ""}.`); break;
        case "sigillo": r.push("Sigillo: con l'Incrinatura al massimo, +1d4 agli attacchi normali."); break;
        case "segno": r.push("Segno del Cacciatore: finché è Esposto, +1d4 agli attacchi normali."); break;
        case "espostoConsumato": r.push("Trapasso: l'Esposto si consuma."); break;
        case "precisione": r.push(`Per ${durata(e.turni)} i tuoi attacchi fanno critico da 18 a 20.`); break;
        case "crollo": r.push(`Crollo: ${e.n} cariche di Incrinatura consumate.`); break;
        case "parata": r.push("Parata pronta: il primo colpo che ti raggiungerebbe fa 0 danni."); break;
        case "attaccoGratuito": r.push("Attacco normale gratuito:"); break;
        case "soffioPerso": r.push("Il soffio pronto va perso."); break;
        case "sconto": r.push(`La prossima tecnica costa ${e.n} ira in meno.`); break;
        case "scontoUsato": r.push(`Sconto: −${e.n} ira.`); break;
        case "furore": r.push(`+4 ai tiri salvezza e alle prove contrapposte per ${durata(e.turni)}.`); break;
        case "ira": r.push(`+${e.n} ira.`); break;
        case "giaUsataRiposo": r.push("Già usata in questo riposo."); break;
        /* scudo */
        case "assorbePronto": r.push({ meta: "Scudo pronto: il primo colpo fa metà danni", rimbalzo: "Scudo pronto: metà del primo colpo torna al nemico", zero: "Scudo pronto: il primo colpo fa 0 danni", zeroIra: "Scudo pronto: il primo colpo fa 0 danni ma dà l'ira", tutti: "Scudo pronto: ogni colpo fino al tuo turno fa 0 danni" }[e.tipo] + (e.cariche ? ` (+${e.cariche} Cariche)` : "") + (e.onda ? `, poi onda (${e.onda === "mare" ? "1d6 + Vigore per colpo" : "2d6 per Carica + Vigore"})` : "") + "."); break;
        case "cariche": r.push(e.n > 0 ? `Carica Cinetica +${e.n} (${e.tot}/${e.max})${e.perse ? `, ${e.perse} oltre il massimo perse` : ""}.` : `Cariche già al massimo (${e.tot}/${e.max}).`); break;
        case "caricheSpese": r.push(`Cariche spese: ${e.n}.`); break;
        case "caricaResta": r.push("Resta 1 Carica."); break;
        case "onda": r.push(`Onda senza tiro: ${e.n}d${e.dado} [${e.tiri.join("+")}]${e.nExtra ? ` + ${e.nExtra}d${e.dadoExtra} [${e.tiriExtra.join("+")}]` : ""} ${fmt(e.mm)} = ${e.danno}.`); break;
        case "postura": r.push("Postura: la Presa non ti afferra; se ti manca, 1 Carica."); break;
        case "posturaRegge": r.push("La postura regge."); break;
        case "vendetta": r.push("Vendetta: il nemico ti ha colpito nel suo ultimo turno."); break;
        case "baluardo": r.push(`Baluardo per ${durata(e.turni)}: ira doppia e 1 Carica per colpo subito.`); break;
        case "baluardoColpo": r.push("Baluardo: ira doppia."); break;
        case "elastica": r.push("Marea Elastica attiva: con almeno 2 Cariche, ogni colpo subito restituisce 1d4."); break;
        case "elasticaColpo": r.push(`Marea Elastica: ${e.d} danni al nemico.`); break;
        case "drenaggio": r.push("Drenaggio: se ti manca, +1 ira e 1 Carica."); break;
        case "fortezzaPronta": r.push(`Fortezza pronta per ${durata(e.turni)} (una volta per scontro).`); break;
        case "fortezzaUsata": r.push("Fortezza già usata in questo scontro."); break;
        case "fortezza": r.push(`Fortezza Eterna: resti a 1 salute (${e.evitato} danni evitati).`); break;
        case "assorbito": r.push(`Scudo: ${e.prima} → ${e.dopo} danni.`); break;
        case "rimbalzo": r.push(`Rimbalzo: ${e.danno} danni al nemico.`); break;
        case "ondaMare": r.push("Onda del Mare Profondo:"); break;
        case "ondaEgida": r.push(`Onda dell'Egida (${e.cariche} Cariche):`); break;
        case "ondaVuota": r.push("Egida: nessuna Carica, nessuna onda."); break;
        case "difesaDiFila": r.push("Non puoi usare una difesa dello scudo due turni di fila."); break;
        case "senzaCariche": r.push("Servono Cariche Cinetiche."); break;
        default: r.push((S && S.testo(e)) || (M && M.testo(e)) || JSON.stringify(e));
      }
    });
    return r;
  }

  /* ---------- scontro ---------- */
  function nuovoScontro() {
    pg = leggiPg(); pg.pv = pg.pvMax; pg.ira = pg.iraMax;
    const D = NEMICI[$("nTipo").value];
    const vigore = 10 + tira(6), agilita = 10 + tira(6);
    const pvMax = Number($("nPv").value) || D.pv || (10 + tira(D.dadoVita) + mod(vigore));
    nem = { ...D, id: $("nTipo").value, vigore, agilita, pvMax, ca: Number($("nCa").value) || D.ca, boss: $("nBoss").checked || D.boss };
    s = { pv: pvMax, pvMax, eff: {}, effMax: {}, soffioPronto: true, presaUsata: false };
    finito = false; nTurno = 0;
    $("svLog").replaceChildren();
    log(`Nuovo scontro: livello ${pg.liv}, ${pg.arma.nome} (1d${pg.arma.dado} ${pg.arma.tipo.toLowerCase()})${pg.scudo ? " e scudo" : ""}, Vigore ${fmt(pg.modV)}, ira ${pg.ira}/${pg.iraMax}. Contro: ${nem.nome}${nem.boss ? " — BOSS" : ""}, PV ${pvMax}, CA ${nem.ca}, Vigore ${fmt(mod(vigore))}.`, "sis");
    log("Agisci per primo (nella sala di prova l'iniziativa è sempre tua).", "sis");
    inizioTurno();
  }
  function inizioTurno() {
    nTurno++; turnoPg = true;
    const ril = C.inizioTurnoPg(s, ctx()); /* Mare Profondo ed Egida rilasciano l'onda */
    if (ril.length) { blocco("Inizio del tuo turno", testoEventi(ril), "mia"); if (controllaFine()) { turnoPg = false; return disegna(); } }
    disegna();
  }
  /* danni al personaggio: la Fortezza Eterna può lasciarti a 1 */
  function ferisci(dn, righe) {
    if (C.attivo(s, "invuln")) { righe.push("Invulnerabilità: nessun danno."); return 0; }
    const f = C.fortezza(s, dn, pg.pv), sv = M ? M.secondaVita(s, f.danno, pg.pv, ctx()) : { danno: f.danno, eventi: [] };
    pg.pv -= sv.danno; righe.push(...testoEventi(f.eventi), ...testoEventi(sv.eventi));
    if (sv.cura) pg.pv = Math.min(pg.pvMax, pg.pv + sv.cura);
    return sv.danno;
  }
  function dopoAzione() {
    turnoPg = false;
    if (controllaFine()) return disegna();
    turnoNemico();
    if (controllaFine()) return disegna();
    inizioTurno();
  }
  function controllaFine() {
    if (finito) return true;
    if (s.pv <= 0) { finito = true; log(`${nem.nome} è sconfitto.`, "ok"); return true; }
    if (nem.resa && s.pv <= Math.ceil(s.pvMax / 3)) { finito = true; log("Ettore si arrende (in gioco succede a un terzo della salute).", "ok"); return true; }
    if (pg.pv <= 0) { finito = true; log("Sei a terra: sconfitta.", "ko"); return true; }
    return false;
  }
  function attaccoNormale() {
    if (!turnoPg || finito) return;
    const pre = s.prossimo || {}; s.prossimo = null;
    const c = ctx(), e = C.colpo(s, c, { base: true, bonus: pre.bonus || 0, piuDadi: pre.piuDadi || 0 });
    if (e.crit && !arcanista() && !sciamano()) c.iraPiu(2);
    const runa = e.ok && arcanista() && C.attivo(s, "runa") ? testoEventi([C.incidi(s, c, 1)]) : [];
    if (sciamano()) { if (e.ok) runa.push(...testoEventi(S.suColpo(s, c, e))); runa.push(...testoEventi(S.attaccoFuria(s, c))); } /* rivestimento e Linfa Furiosa */
    if (e.ok && arcanista() && C.attivo(s, "voto")) { const x = tira(4); s.pv -= x; pg.pv = Math.min(pg.pvMax, pg.pv + 1); runa.push(M.testo({ k: "votoColpo", d: x, cura: 1 })); }
    blocco("Attacco normale", [...testoEventi([e]), ...runa, e.crit && !arcanista() && !sciamano() ? "Tuo critico: +2 ira." : ""], e.ok ? "mia" : "");
    dopoAzione();
  }
  function usaTecnica(t) {
    if (!turnoPg || finito) return;
    const c = ctx();
    if (t.unaPerRiposo && c.usataPerRiposo(t.id)) return log(`${t.nome.it}: già usata in questo riposo.`, "ko");
    const disp = C.disponibile(t, s); if (!disp.ok) return log(`${t.nome.it}: ${testoEventi([{ k: disp.motivo }])[0]}`, "ko");
    if (t.passiva) return log(`${t.nome.it}: è una passiva, sempre attiva.`, "ko");
    const costo = sciamano() ? t.costo : C.costo(t, s);
    if (pg.ira < costo) return log(`${t.nome.it}: servono ${costo} ${risorsa()}, ne hai ${pg.ira}.`, "ko");
    pg.ira -= costo;
    const r = sciamano() ? S.usa(t, s, c) : C.usa(t, s, c);
    const crit = sciamano() ? 0 : r.eventi.filter(e => e.k === "colpo" && e.crit).length;
    for (let i = 0; i < crit; i++) c.iraPiu(2);
    blocco(`${t.nome.it} (−${costo} ${risorsa()})`, [...testoEventi(r.eventi), crit ? `Tuo critico: +${2 * crit} ira.` : "", `${sciamano() ? "Natura" : "Ira"}: ${pg.ira}/${pg.iraMax}.`], "mia");
    if (t.gratuita) return disegna(); /* Rinascita: non consuma l'azione */
    dopoAzione();
  }
  function usaIncantesimo(inc) {
    if (!turnoPg || finito || !arcanista()) return;
    const c = ctx();
    const disp = M.disponibile(inc, s, c); if (!disp.ok) return log(`${inc.nome.it}: ${M.testo({ k: disp.motivo })}`, "ko");
    const costo = M.costo(inc, s);
    if (pg.ira < costo) return log(`${inc.nome.it}: servono ${costo} mana, ne hai ${pg.ira}.`, "ko");
    pg.ira -= costo;
    const r = M.lancia(inc, s, c);
    blocco(`${inc.nome.it} (−${costo} ${monaco() ? "fede" : "mana"})`, [...testoEventi(r.eventi), `${monaco() ? "Fede" : "Mana"}: ${pg.ira}/${pg.iraMax}.`], "mia");
    dopoAzione();
  }
  function turnoNemico() {
    const c = ctx(), righe = [];
    const t = C.tickSangue(s, c); if (t) righe.push(`Sanguinamento: ${t.d} danni (d${t.dado}).`);
    if (M && M.haTick(s)) M.inizioTurnoNemico(s, c).forEach(e => righe.push(M.testo(e)));
    if (sciamano()) righe.push(...testoEventi(S.tickNemico(s, c))); /* veleno, bulbo, marea; riparte il recupero del turno */
    if (s.pv <= 0) { blocco("Turno del nemico", righe, "nem"); return; }
    const difesa = (dn) => { if (!sciamano()) return dn; const r = S.difesa(s, c, dn); righe.push(...testoEventi(r.eventi)); return r.danno; }; /* Pelle e Scudo di Corteccia */
    const ira = () => !arcanista() && !sciamano();
    /* Frattura: 1d4 prima di ogni attacco del nemico (anche Presa e Soffio) */
    const frattura = () => { const f = C.frattura(s, c); if (f) righe.push(`Frattura: ${f.d} danni prima di attaccare.`); return s.pv <= 0; };
    if (nem.passivo) righe.push("Il manichino non attacca.");
    else if (C.attivo(s, "bloccato")) righe.push("Stordito: salta il turno.");
    else if (frattura()) { blocco("Turno del nemico", righe, "nem"); return; }
    else {
      let fatto = false;
      if (nem.soffio && !s.soffioPronto) { const x = tira(6); s.soffioPronto = x >= nem.soffio.ricarica; righe.push(`Ricarica del soffio: d6 ${x} → ${s.soffioPronto ? "carico" : "scarico"}.`); }
      if (sciamano() && s.trappola) righe.push(...testoEventi(S.scattaTrappola(s, c))); /* la trappola scatta prima dell'attacco */
      if (nem.soffio && s.soffioPronto && !C.attivo(s, "silenzio") && (Math.random() < nem.probSoffio || $("nSoffio").checked)) {
        fatto = true; s.soffioPronto = false;
        const m = pg.modAgi + (C.attivo(s, "furore") ? 4 : 0) + (M ? M.bonusTsPg(s) : 0), d = tira(20), tot = d + m;
        if (tot >= nem.soffio.cd) righe.push(`Soffio Infuocato: tiro salvezza d20 ${d} ${fmt(m)} = ${tot} contro CD ${nem.soffio.cd} → schivato.`);
        else {
          const tiri = Array.from({ length: nem.soffio.dadi }, () => tira(nem.soffio.dado)), dn0 = tiri.reduce((a, b) => a + b, 0), dn = C.attivo(s, "cerchio") ? Math.floor(dn0 / 2) : dn0;
          const g = ira() ? C.iraPerColpo(pg.liv, false) : 0; pg.ira = Math.min(pg.iraMax, pg.ira + g);
          righe.push(`Soffio Infuocato: tiro salvezza d20 ${d} ${fmt(m)} = ${tot} contro CD ${nem.soffio.cd} → preso, ${dn} danni [${tiri.join("+")}].${g ? ` +${g} ira.` : ""}`);
          const dd = difesa(dn); if (dd > 0) ferisci(dd, righe);
        }
      }
      if (!fatto) {
        const morso = nem.arma ? false : Math.random() < 0.5 || $("nMorso").checked, nome = nem.arma ? "Spada" : morso ? "Morso" : "Zampata";
        const m = mod(nem.vigore) + (nem.attacco || 0) + C.modAttaccoNem(s), at = C.tiroAttaccoNem(s, c), d = at.d, tot = d + m, ca = caPg(), crit = d === 20 && C.critNemPossibile(s), ok = crit || tot > ca;
        if (at.tiri) righe.push(`Due d20, tiene il peggiore: ${at.tiri[0]} e ${at.tiri[1]}.`);
        if (!ok) { righe.push(`${nome}: mancato (d20 ${d} ${fmt(m)} = ${tot} contro la tua CA ${ca}). Nessuna ira.`); righe.push(...testoEventi(C.colpoMancato(s, c))); }
        else if (!s.parata) { /* scudo, Baluardo, Marea Elastica: il danno si tira prima */
          const nd = crit ? 2 : 1, tiri = Array.from({ length: nd }, () => tira(nem.dannoDado)), pieno = Math.max(1, tiri.reduce((a, b) => a + b, 0) + m);
          const sub = C.colpoSubito(s, c, crit, pieno);
          righe.push(`${nome}: ${crit ? "CRITICO" : "colpito"} (d20 ${d} ${fmt(m)} = ${tot} contro CA ${ca}), ${pieno} danni [${tiri.join("+")}].`, ...testoEventi(sub.eventi));
          const dd = difesa(sub.danno), fatto = dd > 0 ? ferisci(dd, righe) : 0;
          if (ira()) pg.ira = Math.min(pg.iraMax, pg.ira + sub.ira);
          righe.push(`Subisci ${fatto} danni.${ira() ? ` +${sub.ira} ira.` : ""}`);
          if (morso && !sub.annullato && !s.presaUsata && !C.attivo(s, "silenzio") && !C.presaBloccata(s) && !C.attivo(s, "muro") && (Math.random() < nem.probPresa || $("nPresa").checked)) {
            s.presaUsata = true;
            if (frattura()) { blocco("Turno del nemico", righe, "nem"); return; }
            const a = tira(20) + pg.modV + (C.attivo(s, "furore") ? 4 : 0), b = tira(20) + mod(nem.vigore);
            if (b > a) { const x = tira(4), dx = difesa(x); if (dx > 0) ferisci(dx, righe); righe.push(`Presa: ${b} contro il tuo ${a} → ti stringe, ${x} danni in più.`); }
            else righe.push(`Presa: ${b} contro il tuo ${a} → ti liberi.`);
          } else if (morso && C.presaBloccata(s)) righe.push("Postura Salda: la Presa non ti afferra.");
        }
        else {
          const sub = C.colpoSubito(s, c, crit);
          if (sub.annullato) righe.push(`${nome}: colpirebbe (d20 ${d} ${fmt(m)} = ${tot} contro CA ${ca}), ma la Parata lo annulla: 0 danni, nessuna ira.`, ...testoEventi(sub.eventi.filter(e => e.k === "stato" || e.k === "crepe")), ...sub.eventi.filter(e => e.k === "contrattacco").map(e => `Contrattacco${e.dCrit ? ` (critico 18-20: d20 ${e.dCrit} → ${e.crit ? "CRITICO" : "no"})` : ""}: ${e.tiri.length}d${e.dado} [${e.tiri.join("+")}] ${fmt(e.mm)} = ${e.danno} danni.`));
          else {
            const nd = crit ? 2 : 1, tiri = Array.from({ length: nd }, () => tira(nem.dannoDado)), dn = Math.max(1, tiri.reduce((a, b) => a + b, 0) + m);
            pg.pv -= dn; if (!arcanista()) pg.ira = Math.min(pg.iraMax, pg.ira + sub.ira);
            righe.push(`${nome}: ${crit ? "CRITICO" : "colpito"} (d20 ${d} ${fmt(m)} = ${tot} contro CA ${ca}), ${dn} danni [${tiri.join("+")}]. +${sub.ira} ira.`);
            if (morso && !s.presaUsata && !C.attivo(s, "silenzio") && !C.attivo(s, "muro") && (Math.random() < nem.probPresa || $("nPresa").checked)) {
              s.presaUsata = true;
              if (frattura()) { blocco("Turno del nemico", righe, "nem"); return; }
              const a = tira(20) + pg.modV + (C.attivo(s, "furore") ? 4 : 0), b = tira(20) + mod(nem.vigore);
              if (b > a) { const x = tira(4); pg.pv -= x; righe.push(`Presa: ${b} contro il tuo ${a} → ti stringe, ${x} danni in più.`); }
              else righe.push(`Presa: ${b} contro il tuo ${a} → ti liberi.`);
            }
          }
        }
      }
    }
    if (sciamano() && pg.pv > 0) righe.push(...testoEventi(S.cureFineTurno(s, c))); /* cure «all'inizio del tuo turno» */
    const scaduti = C.fineTurnoNemico(s);
    if (M) M.scaduti(s, scaduti, c).forEach(e => righe.push(M.testo(e)));
    if (sciamano()) righe.push(...testoEventi(S.scaduti(s, scaduti, c))); /* Linfa Furiosa, fine del rivestimento */
    if (scaduti.length) righe.push("Svaniscono: " + scaduti.map(k => NOMI_EFF[k] || k).join(", ") + ".");
    blocco("Turno del nemico", righe, "nem");
  }
  function riposa() {
    if (!pg) pg = leggiPg();
    perRiposo = {}; pg.ira = pg.iraMax; pg.pv = pg.pvMax;
    log("Riposo: " + risorsa() + " e salute piene, le tecniche «una volta per riposo» tornano disponibili.", "sis"); disegna();
  }

  /* ---------- interfaccia ---------- */
  function scheda(box, voci) { box.replaceChildren(); voci.forEach(([k, v]) => box.append(el("dt", { text: k }), el("dd", { text: v }))); }
  function effetti(chiavi) {
    const att = chiavi.filter(k => s && s.eff[k] > 0);
    return att.map(k => [k === "sanguina" ? (Number(s.sangueDado) === 6 ? "Emorragia 1d6" : "Sanguinamento 1d4") + (s.marchio ? " · marchiato" : "") : k === "avvelenato" ? (Number(s.velenoDado) === 6 ? "Tossina 1d6" : "Avvelenato 1d4") : NOMI_EFF[k] + (k === "esposto" && s.segno ? " · segnato" : "") + (k === "rivest" && s.rivest ? " · " + s.rivest : ""), C.perScontro(s.eff[k]) ? "tutto lo scontro" : durata(s.eff[k])]);
  }
  const bilanciaTesto = () => { const v = (s && s.bilancia) || 0; return v === 0 ? "equilibrio" : v > 0 ? `Luce ${v}${v === 3 ? " · Zenit" : v === 2 ? " · Aureola" : ""}` : `Ombra ${-v}${v === -3 ? " · Nadir" : v === -2 ? " · Velo" : ""}`; };
  const sigilliNem = () => (s && C.sigilli(s) ? [["Sigilli", `${C.sigilli(s)}/${C.sigilliMax({ boss: nem.boss })}`]] : []);
  const crepeNem = () => { if (!s || !C.crepe(s)) return []; const max = C.crepeMax({ boss: nem.boss }); return [["Incrinatura" + (s.sigillo && C.crepe(s) >= max ? " · sigillo" : ""), `${C.crepe(s)}/${max} cariche (−${C.crepe(s)} CA)`]]; };
  function disegna() {
    if (!pg) pg = leggiPg();
    const st = pg.pv != null ? pg : { ...pg, pv: pg.pvMax, ira: pg.iraMax };
    scheda($("svPg"), [["Salute", `${st.pv} / ${pg.pvMax}`], [arcanista() ? (monaco() ? "Punti fede" : "Mana") : sciamano() ? "Punti natura" : "Ira", `${st.ira} / ${pg.iraMax}`], ["CA", String(s ? caPg() : pg.ca)], ["CD dei tuoi effetti", String(8 + (arcanista() ? pg.modM : pg.modV) + pg.liv)], ...(sciamano() ? [["Natura per evento", `${S.recupero({ liv: pg.liv }, false)} (doppio con la Tossina), uno per turno del nemico`], ...(s && s.corteccia ? [["Scudo di Corteccia", `${s.corteccia}/${S.scudoMax({ liv: pg.liv })}`]] : []), ...(s && s.trappola ? [["Trappola", s.trappola]] : [])] : arcanista() ? (monaco() ? [["Fede per Crepuscolo", `${M.recupero(pg.liv)} (doppio da Nadir)`], ["Bilancia", bilanciaTesto()]] : [["Mana per Detonazione", `${M.recupero(pg.liv)} (doppio con i Sigilli al massimo)`]]) : [["Ira per colpo subito", `${C.iraPerColpo(pg.liv, false)} (critico ${C.iraPerColpo(pg.liv, true)})`]]), ...effetti(EFF_PG), ...(s && s.parata ? [["Parata", "pronta"]] : []), ...(s && C.cariche(s) ? [["Carica Cinetica", `${C.cariche(s)}/${C.CARICHE_MAX}${s.elastica && C.cariche(s) >= 2 ? " · elastica" : ""}`]] : []), ...(s && s.assorbe ? [["Scudo", `pronto (${s.assorbe.tipo})`]] : []), ...(s && s.difesaBloccata ? [["Difesa dello scudo", "non questo turno"]] : []), ...(s && s.sconto ? [["Sconto", `−${s.sconto} ira`]] : [])]);
    if (nem) scheda($("svNem"), [["Nemico", nem.nome + (nem.boss ? " — BOSS" : "")], ["Salute", `${Math.max(0, s.pv)} / ${s.pvMax}`], ["CA", String(caNem())], ...(nem.soffio ? [["Soffio", s.soffioPronto ? "carico" : "scarico"]] : []), ...crepeNem(), ...sigilliNem(), ...(s && s.caMeno ? [["Spezzato", `CA −${s.caMeno} per tutto lo scontro`]] : []), ...(s && s.filo ? [["Filo di Rune", C.sigilli(s) >= 2 ? "attivo: −2 a colpirti" : "in attesa di 2 Sigilli"]] : []), ...(s && s.demolitore ? [["Demolitore", "ogni Detonazione fa Sbilanciato 1"]] : []), ...(s && s.morbo ? [["Morbo", `${s.morbo}/3`]] : []), ...effetti(["sanguina", "frattura", "esposto", "debole", "sbilanciato", "silenzio", "frastornato", "intontito", "bloccato", "pressione", "parola", "accecato", "avvizzito", "paura", "corona", "avvelenato", "marea"])]);
    else scheda($("svNem"), [["Nemico", "—"]]);
    /* posti e tecniche */
    const prep = prepT().filter(t => sciamano() === (t.classe === "Forestiero")), max = C.slotTecniche(pg.liv, scudoPosti());
    $("svPosti").textContent = `Posti: ${prep.filter(tipoOk).length} / ${max} (quote: 2 di livello 1, 2 di livello 2, 1 per i livelli 3, 4, 5${scudoPosti() ? "; +1 di qualsiasi livello con lo scudo" : ""}).`;
    const lista = $("svTec"); lista.replaceChildren();
    const riga = (t, gruppo) => {
      const inPosto = gruppo !== "base" || preparate.has(t.id);
      const usabile = !t.passiva && !finito && turnoPg && tipoOk(t) && (inPosto || ignoraPosti()) && !(t.unaPerRiposo && perRiposo[t.id]) && pg.ira >= (sciamano() ? t.costo : C.costo(t, s)) && C.disponibile(t, s).ok;
      const chk = gruppo === "base" ? el("input", { type: "checkbox", title: "Prepara", onchange: (e) => { if (e.target.checked) preparate.add(t.id); else preparate.delete(t.id); disegna(); } }) : null;
      if (chk) { chk.checked = preparate.has(t.id); chk.disabled = !chk.checked && (prep.length >= max || !C.sceltaValida([...prep, t], pg.liv, scudoPosti()).ok); }
      const b = el("button", { type: "button", class: "mini", "data-tec": t.id, onclick: () => usaTecnica(t) }, "Usa");
      b.disabled = !usabile;
      lista.append(el("div", { class: "tec" + (tipoOk(t) ? "" : " spenta") },
        el("span", { class: "sx" }, chk, el("b", { text: t.nome.it }), el("small", { text: ` liv. ${t.liv} · ${t.passiva ? "passiva" : `${sciamano() ? t.costo : C.costo(t, s || {})} ${risorsa()}`}${t.gratuita ? " · non consuma l'azione" : ""}${t.unaPerRiposo ? " · una per riposo" : ""}${gruppo === "via" ? " · via" : ""}${gruppo === "util" ? " · classe" : ""}` })),
        b, el("p", { class: "eff", text: t.effetto.it })));
    };
    if (utilita().length) { lista.append(el("h4", { text: "Della classe (non occupano posti)" })); utilita().forEach(t => riga(t, "util")); }
    lista.append(el("h4", { text: sciamano() ? "Tecniche della natura sbloccate (con qualsiasi arma)" : `Tecniche sbloccate (${pg.arma.tipo.toLowerCase()}${pg.scudo ? " + scudo" : ""})` }));
    opzioni().forEach(t => riga(t, "base"));
    if (pg.liv >= 3) { lista.append(el("h4", { text: pg.via ? `Via di ${pg.via === "aldo" ? (sciamano() ? "Aldo — Signore delle Spore Putride" : "Aldo — Lama del Guardiano") : (sciamano() ? "Guendalina — Custode dei Boschi Sacri" : "Guendalina — Veglia")}, serie ${pg.serie === "scudo" ? "dello scudo" : "dell'arma"} (non occupa posti${dellaVia().length ? "" : "; nessuna abilità per quest'arma"})` : "Via di prestigio: nessuna scelta" })); dellaVia().forEach(t => riga(t, "via")); }
    if (arcanista()) { /* niente preparazione: tutti gli incantesimi sbloccati sono usabili */
      $("svPosti").textContent = "Tutti gli incantesimi sbloccati sono usabili (la preparazione ai posti non si prova qui). Il costo si paga in " + (monaco() ? "punti fede" : "mana") + ".";
      lista.replaceChildren();
      const sc2 = SCUOLE(), sblocc = MG.INCANTESIMI.filter(i => sc2.includes(i.scuola) && i.liv <= pg.liv), NS = { arcano: "Arcano", forza: "Forza", luce: "Luce", ombra: "Ombra" };
      const rigaInc = (inc, etichetta) => {
        const costoR = s ? M.costo(inc, s) : inc.costo;
        const usata = M.UNA_PER_RIPOSO.includes(inc.id) && perRiposo[inc.id];
        const ok = !finito && turnoPg && s && pg.ira >= costoR && !usata && M.disponibile(inc, s, ctx()).ok;
        const b = el("button", { type: "button", class: "mini", "data-inc": inc.id, onclick: () => usaIncantesimo(inc) }, "Lancia");
        b.disabled = !ok;
        lista.append(el("div", { class: "tec" }, el("span", { class: "sx" }, el("b", { text: inc.nome.it }), el("small", { text: ` liv. ${inc.liv} · ${costoR} ${monaco() ? "fede" : "mana"}${M.UNA_PER_RIPOSO.includes(inc.id) ? " · una per riposo" : ""}${etichetta ? " · " + etichetta : ""}` })), b, el("p", { class: "eff", text: inc.effetto.it })));
      };
      sc2.forEach(sc => { lista.append(el("h4", { text: NS[sc] })); sblocc.filter(i => i.scuola === sc).forEach(i => rigaInc(i)); });
      if (pg.liv >= 3) {
        lista.append(el("h4", { text: pg.via ? `Via ${monaco() ? (pg.via === "aldo" ? "Cenere (Ombra)" : "Brace (Luce)") : (pg.via === "aldo" ? "Frattura (Forza)" : "Sutura (Arcano)")}` : "Via di prestigio: sceglila nel pannello a sinistra" }));
        if (pg.via) MG.VIE.filter(v => v.via === pg.via && sc2.includes(v.scuola) && v.liv <= pg.liv).forEach(i => rigaInc(i, "via"));
      }
    }
    $("svAttacca").disabled = finito || !turnoPg;
    $("pVia").disabled = Number($("pLiv").value) < 3; $("pSerie").disabled = Number($("pLiv").value) < 3;
  }
  function mostraCoda() { const c = $("svCodaVis"); if (c) c.textContent = coda.length ? `In coda: ${coda.join(", ")}` : "Coda vuota: i dadi tirano a caso."; }
  function eseguiTest() {
    const esiti = window.TestCombattimento.esegui().concat(window.TestMagiaCombattimento ? window.TestMagiaCombattimento.esegui() : [], window.TestSciamano ? window.TestSciamano.esegui() : []), ko = esiti.filter(e => !e.ok);
    const box = $("svTest"); box.replaceChildren(el("p", { class: ko.length ? "ko" : "ok", text: `${esiti.length - ko.length} / ${esiti.length} test superati` }));
    const ul = el("ul"); esiti.forEach(e => ul.append(el("li", { class: e.ok ? "ok" : "ko", text: `${e.ok ? "OK" : "ERRORE"} — ${e.nome}${e.ok ? "" : " → " + e.errore}` }))); box.append(ul);
    window.esitiTestCombattimento = esiti;
  }

  function costruisci() {
    document.title = "Sala di prova — combattimento";
    document.body.classList.add("prova");
    const sel = (id, opz, val) => { const x = el("select", { id }); opz.forEach(([v, t]) => x.append(el("option", { value: v, text: t }))); x.value = String(val); return x; };
    const num = (id, val, min, max) => el("input", { id, type: "number", value: val, min, max });
    const campo = (et, c) => el("label", { class: "campo" }, el("span", { text: et }), c);
    const chk = (id, et, on) => { const c = el("input", { id, type: "checkbox" }); c.checked = !!on; return el("label", { class: "campo chk" }, c, el("span", { text: et })); };
    const app = el("div", { class: "sala" },
      el("header", {}, el("h1", { text: "Sala di prova — combattimento" }), el("a", { href: "tutorial.html", text: "Torna al tutorial" })),
      el("section", { class: "pannello" }, el("h2", { text: "Personaggio" }),
        campo("Classe", sel("pClasse", [["guerriero", "Guerriero (tecniche e ira)"], ["arcanista", "Arcanista (incantesimi, Sigilli e mana)"], ["monaco", "Monaco (Luce e Ombra, Bilancia e punti fede)"], ["sciamano", "Sciamano (natura, veleni e trappole)"]], "guerriero")), campo("Mente (Arcanista) o Spirito (Monaco, Sciamano)", num("pMen", 16, 8, 20)),
        campo("Livello", sel("pLiv", [1, 2, 3, 4, 5].map(n => [n, n]), 1)), campo("Vigore", num("pVig", 16, 8, 20)), campo("Agilità", num("pAgi", 12, 8, 20)),
        campo("Classe armatura", num("pCa", 14, 8, 25)), campo("Salute (vuoto = calcolata)", num("pPv", "", 1, 200)),
        campo("Arma", sel("pArma", ARMI.map((a, i) => [i, `${a.nome} · 1d${a.dado} ${a.tipo.toLowerCase()}`]), 0)), chk("pScudo", "Scudo imbracciato"),
        campo("Via di prestigio (dal livello 3)", sel("pVia", [["", "nessuna"], ["aldo", "Aldo — Lama del Guardiano (Arcanista: Frattura · Monaco: Cenere)"], ["guendalina", "Guendalina — Veglia (Arcanista: Sutura · Monaco: Brace)"]], "")),
        campo("Serie della via (si sceglie al riposo)", sel("pSerie", [["arma", "dell'arma"], ["scudo", "dello scudo"]], "arma")),
        chk("pIgnora", "Ignora i posti (usa qualsiasi tecnica sbloccata)", true),
        el("h2", { text: "Nemico" }),
        campo("Tipo", sel("nTipo", Object.entries(NEMICI).map(([k, d]) => [k, d.nome]), "mastino")), chk("nBoss", "Trattalo come boss"),
        campo("Salute (vuoto = tirata)", num("nPv", "", 1, 300)), campo("Classe armatura (vuoto = sua)", num("nCa", "", 5, 25)),
        chk("nResiste", "Resiste al veleno (come Dafne e il sovrano)"), chk("nSoffio", "Forza il Soffio quando è carico"), chk("nMorso", "Il mastino morde sempre"), chk("nPresa", "Forza la Presa dopo un morso"),
        el("div", { class: "azioni" }, el("button", { type: "button", id: "svNuovo", class: "primario", onclick: nuovoScontro }, "Nuovo scontro"), el("button", { type: "button", id: "svRiposa", onclick: riposa }, "Riposa")),
        el("h2", { text: "Dadi truccati" }),
        el("p", { class: "nota", text: "Valori separati da virgole, usati in ordine dai prossimi tiri (d20, dadi di danno, tiri salvezza, ricarica…)." }),
        el("div", { class: "azioni" }, el("input", { id: "svCoda", type: "text", placeholder: "es. 20, 6, 3" }), el("button", { type: "button", id: "svAccoda", onclick: () => { $("svCoda").value.split(/[ ,;]+/).map(Number).filter(n => n > 0).forEach(n => coda.push(n)); $("svCoda").value = ""; mostraCoda(); } }, "Accoda"), el("button", { type: "button", onclick: () => { coda.length = 0; mostraCoda(); } }, "Svuota")),
        el("p", { class: "nota", id: "svCodaVis" })),
      el("section", { class: "centro" },
        el("div", { class: "azioni" }, el("button", { type: "button", id: "svAttacca", class: "primario", onclick: attaccoNormale }, "Attacco normale")),
        el("div", { id: "svLog", class: "log", "aria-live": "polite" }),
        el("h2", { text: "Test automatici" }), el("div", { class: "azioni" }, el("button", { type: "button", id: "svTestBtn", onclick: eseguiTest }, "Esegui i test")), el("div", { id: "svTest" })),
      el("section", { class: "pannello" }, el("h2", { text: "Tu" }), el("dl", { id: "svPg" }), el("h2", { text: "Nemico" }), el("dl", { id: "svNem" }),
        el("h2", { text: "Tecniche" }), el("p", { class: "nota", id: "svPosti" }), el("div", { id: "svTec" })));
    document.body.replaceChildren(app);
    ["pClasse", "pMen", "pLiv", "pVig", "pAgi", "pCa", "pPv", "pArma", "pScudo", "pVia", "pSerie", "pIgnora"].forEach(id => $(id).addEventListener("change", () => {
      const vecchio = pg; pg = leggiPg();
      if (vecchio && s && !finito) { pg.pv = Math.min(vecchio.pv, pg.pvMax); pg.ira = Math.min(vecchio.ira, pg.iraMax); log("Personaggio cambiato a scontro in corso: valido dal prossimo tiro.", "sis"); }
      [...preparate].forEach(id => { const t = TEC.find(x => x.id === id); if (!t || t.liv > pg.liv) preparate.delete(id); });
      disegna();
    }));
    mostraCoda(); pg = leggiPg(); disegna();
  }
  /* comandi per i test automatici del browser (Playwright): window.SalaProva */
  window.SalaProva = { accoda: (...v) => { coda.push(...v); mostraCoda(); }, stato: () => ({ pg, nem, s, turnoPg, finito, preparate: [...preparate], perRiposo }), nuovoScontro, attaccoNormale, usa: (id) => usaTecnica(TEC.find(t => t.id === id)), incanta: (id) => usaIncantesimo(MG.INCANTESIMI.concat(MG.VIE).find(i => i.id === id)), riposa, eseguiTest };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", costruisci); else costruisci();
})();
