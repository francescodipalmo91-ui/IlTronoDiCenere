/* =====================================================================
   SALA DI PROVA DEL COMBATTIMENTO — tutorial.html?prova
   Strumento di sviluppo (solo italiano): prova tecniche, stati, furia, posti, vie e boss
   con le stesse regole della partita (js/combattimento.js), senza entrare in gioco.
   - Personaggio: livello, Vigore, Agilità, CA, arma, scudo, via e serie della via (arma o scudo).
   - Nemico: mastino comune, Ettore (boss), Enea (boss, argento) o manichino; boss forzabile; PV e CA modificabili.
   - Enea (30/10, rivisto il 02/11: barbaro nano): mani nude veloci o arma a doppia faccia (lato del maglio: colpo caricato con
     «Mi difendo» e interruzione, carica in guardia, finta con Intuizione; lato dell'ascia: Sanguinamento), Spinta,
     Furia del becchino alla prima caduta, vulnerabile a forza, luce e sottobosco (Sciamano), sdegno del cavaliere.
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
    { nome: "Spada corta", dado: 6, tipo: "Tagliente", mani: 1 }, { nome: "Ascia da battaglia", dado: 8, tipo: "Tagliente", mani: 2 },
    { nome: "Bastone", dado: 6, tipo: "Contundente", mani: 2 }, { nome: "Martello da battaglia", dado: 8, tipo: "Contundente", mani: 1 },
    { nome: "Mazza chiodata", dado: 6, tipo: "Perforante", mani: 1 }, { nome: "Piccone da battaglia", dado: 8, tipo: "Perforante", mani: 2 },
    { nome: "Retaggio del Padrone", dado: 10, tipo: "Tagliente", mani: 1, retaggio: true } /* 03/11: la spada dell'armatura, 1d10 + caratteristica di classe come in gioco (nessun bonus di livello) */
  ];
  /* 03/11: limiti di classe come in creazione.html. Le armi «da battaglia» solo al Guerriero; armature per classe; lo scudo occupa una mano */
  const ARMATURE_OK = { guerriero: ["nessuna", "leggera", "media", "pesante"], sciamano: ["nessuna", "leggera", "media"], arcanista: ["nessuna", "leggera"], monaco: ["nessuna", "leggera", "media"] };
  const armaOk = (classe, i) => classe === "guerriero" || !/da battaglia/.test(ARMI[i].nome);
  /* incantesimi preparati: posti come le tecniche (2, 4, 5, 6, 7) più 1, come in gioco (04/11: liberi tra le due scuole, niente scuola principale) */
  const preparatiInc = new Set();
  const postiPrincInc = (liv) => [2, 2, 1, 1, 1].slice(0, Math.max(1, Math.min(5, liv))).reduce((a, b) => a + b, 0);
  /* gli stessi valori di NEMICI in gioco.html */
  const NEMICI = {
    mastino: { nome: "Mastino infernale (comune)", ca: 10, dadoVita: 6, dannoDado: 4, attacco: 1, boss: false, probPresa: 0.6, probSoffio: 0.4, soffio: { cd: 12, dadi: 2, dado: 6, ricarica: 5 }, arma: false },
    /* 01/11: caratteristica primaria dei guardiani (attacco): Ettore Mente con Spirito volutamente basso, Enea Spirito */
    /* 02/11: Ettore ladro, due pugnali 1d4 + 1 (in gioco anche il conteggio, Lama nel fianco e «L'ho già vista»; qui solo i due attacchi) */
    ettore: { nome: "Ettore (boss)", ca: 13, pv: 30, vigore: 10, stat: { Vigore: 10, "Agilità": 13, Mente: 13, Spirito: 8 }, primaria: "Mente", dadoVita: 8, dannoDado: 4, dannoBonus: 1, attacchi: 2, nomeArma: "Pugnale", attacco: 1, boss: true, probPresa: 0, probSoffio: 0, soffio: null, arma: true, resa: true, vuln: ["Contundente", "Arcano", "Ombra"] /* 04/11: Arcano al posto di Forza */ },
    /* 30/10, PROPOSTA: bilanciamento_nemici_oggetti.md, sezione 5c */
    /* 02/11: barbaro nano, primaria Vigore; «Sottobosco»: con lo Sciamano gli stati durano 1 turno in più, in furia il veleno ha un dado in più */
    enea: { nome: "Enea (boss, argento)", ca: 13, pv: 32, vigore: 14, stat: { Vigore: 14, "Agilità": 10, Mente: 10, Spirito: 12 }, primaria: "Vigore", attaccoFisso: 4 /* Vigore 14 (+2) + 2 */, pa: 9, boss: true, enea: true, arma: true, vuln: ["Perforante", "Arcano", "Luce", "Sottobosco"] },
    manichino: { nome: "Manichino (non attacca)", ca: 12, pv: 60, boss: false, passivo: true, arma: false }
  };
  const NOMI_EFF = { sanguina: "Sanguinamento", frattura: "Frattura", intontito: "Intontito", debole: "Indebolito", sbilanciato: "Sbilanciato", silenzio: "Inibito", frastornato: "Frastornato", bloccato: "Stordito", guardia: "Guardia alzata", furore: "Furore inarrestabile", esposto: "Esposto", precisione: "Mille Soli", baluardo: "Baluardo d'Acciaio", fortezza: "Fortezza Eterna", runa: "Runa sull'arma", occhio: "Occhio del Tomo", tomo: "Tomo Proibito", quiete: "Quiete Assoluta", muro: "Muro di forza", scudo: "Scudo", invuln: "Invulnerabilità", pressione: "Pressione", parola: "Parola Vera", santuario: "Santuario", voto: "Voto di Vita", rigen: "Rigenerazione", gemella: "Spirito Servitore", cerchio: "Cerchio del Focolare", fiamma: "Fiamma Calda", notte: "Notte dei Morti", furiaCinerea: "Furia Cinerea", manto: "Velo degli Spiriti", seconda: "Seconda Vita", accecato: "Accecato", avvizzito: "Avvizzito", paura: "Terrore", corona: "Aura Vitale",
    avvelenato: "Avvelenato", marea: "Marea di Putrefazione", rivest: "Arma rivestita", linfaFuria: "Linfa Furiosa", pelle: "Pelle di Corteccia", infuso: "Infuso di Linfa Vitale", aura: "Aura di Purificazione", rinascita: "Rinascita del Sottobosco", bulbo: "Bulbo primordiale" };
  const DESC_EFF = { frattura: "1d4 danni a ogni suo attacco", intontito: "niente critici", debole: "−2 per colpire", sbilanciato: "−2 alla Classe armatura", silenzio: "niente Presa né Soffio", frastornato: "−4 per colpire, niente critici", bloccato: "salta il prossimo turno", furore: "+4 ai tiri salvezza e alle prove contrapposte", esposto: "i tuoi attacchi fanno critico con un numero in meno, mai sotto 18", precisione: "i tuoi attacchi fanno critico da 18 a 20" };
  const EFF_PG = ["guardia", "baluardo", "fortezza", "furore", "precisione", "scudo", "muro", "invuln", "runa", "occhio", "tomo", "quiete", "santuario", "voto", "rigen", "gemella", "cerchio", "fiamma", "notte", "furiaCinerea", "manto", "seconda", "rivest", "linfaFuria", "pelle", "infuso", "aura", "rinascita", "bulbo"];
  const arcanista = () => !!pg && (pg.classe === "arcanista" || pg.classe === "monaco"); /* incantatori: mana o punti fede */
  const monaco = () => !!pg && pg.classe === "monaco";
  const sciamano = () => !!pg && pg.classe === "sciamano" && !!S; /* tecniche della natura e punti natura */
  const risorsa = () => (arcanista() ? (monaco() ? "fede" : "mana") : sciamano() ? "natura" : "furia");
  const SCUOLE = () => (monaco() ? ["luce", "ombra"] : ["arcano", "forza"]);
  const scuolaPrinc = () => { const v = $("pScuola") && $("pScuola").value; return SCUOLE().includes(v) ? v : SCUOLE()[0]; }; /* 04/11: scuola preferita della preparazione automatica (non è più una regola) */
  const scuolaVia = () => (pg && pg.via && arcanista() ? M.scuolaDellaVia(monaco() ? "Accolito" : "Sapiente", pg.via) : null); /* 04/11: scuola potenziata dalla via */

  /* ---------- dadi: coda truccata, poi caso ---------- */
  const coda = [];
  const tira = (d) => { if (coda.length) { const v = coda.shift(); mostraCoda(); return Math.max(1, Math.min(d, v)); } return 1 + Math.floor(Math.random() * d); };

  /* ---------- stato ---------- */
  let pg = null, nem = null, s = null, turnoPg = false, finito = true, nTurno = 0, tipoAzione = null; /* tipo del colpo in corso: arma o scuola (vulnerabilità) */
  const preparate = new Set(); let perRiposo = {};

  function leggiPg() {
    const p = leggiPgBase();
    p.classe = $("pClasse") ? $("pClasse").value : "guerriero";
    /* test.html ha Mente e Spirito separati: Arcanista usa Mente, Monaco lo Spirito */
    const valMen = () => ($("pMente") ? Number(p.classe === "arcanista" ? $("pMente").value : $("pSpi").value) : Number($("pMen").value));
    if (p.classe === "arcanista" || p.classe === "monaco") { p.mente = valMen(); p.modM = mod(p.mente); p.furiaMax = C.furiaMax(p.modM, p.liv); } /* il mana cresce come la furia: 10 + Mente, poi Mente + livello a ogni salita */
    if (p.classe === "sciamano") { p.modS = mod(Number($("pAgi").value)); p.furiaMax = C.furiaMax(p.modS, p.liv); } /* 01/11: punti natura, attacchi e tecniche su Agilità */
    return p;
  }
  function leggiPgBase() {
    const liv = Number($("pLiv").value), vig = Number($("pVig").value), agi = Number($("pAgi").value), arma = ARMI[Number($("pArma").value)];
    const modV = mod(vig);
    const pvMax = Number($("pPv").value) || (20 + modV + (liv - 1) * Math.max(1, 6 + modV));
    return { liv, vig, modV, modAgi: mod(agi), ca: Number($("pCa").value) || 14, arma, scudo: $("pScudo").checked, via: liv >= 3 ? $("pVia").value || null : null, serie: $("pSerie").value === "scudo" ? "scudo" : "arma", pvMax, furiaMax: C.furiaMax(modV, liv) };
  }
  const caPg = () => pg.ca + (s && C.attivo(s, "guardia") ? Number(s.guardiaVal) || 0 : 0) + (s && C.attivo(s, "scudo") ? 2 : 0) + (s && C.attivo(s, "muro") ? 3 : 0) + (s && C.attivo(s, "cerchio") ? 2 : 0);
  /* 01/11: caratteristiche del nemico della sala di prova; chi non le ha usa il Vigore tirato e 10 per il resto */
  const statNem = (a) => (nem && nem.stat && nem.stat[a]) || (a === "Vigore" ? nem.vigore : a === "Agilità" ? nem.agilita : 10);
  const modTsSala = (a) => mod(statNem(a)) + pg.liv;
  const caNem = () => nem.ca - (s ? C.malusCA(s) : 0) + (s && nem.enea && s.carica && s.inGuardia ? 2 : 0); /* Sbilanciato e Incrinatura; Enea carica in guardia dopo la prima interruzione */
  const tipoOk = (t) => t.tipo === "Utilita" || t.tipo === "Natura" || (t.tipo === "Scudo" ? pg.scudo : t.tipo === pg.arma.tipo);
  const opzioni = () => sciamano() ? TEC.filter(t => t.classe === "Forestiero" && !t.via && t.liv <= pg.liv) : TEC.filter(t => t.tipo !== "Utilita" && !t.via && t.liv <= pg.liv && (t.tipo === pg.arma.tipo || (t.tipo === "Scudo" && pg.scudo)));
  const utilita = () => (sciamano() ? [] : TEC.filter(t => t.tipo === "Utilita" && t.liv <= pg.liv));
  const tipoVia = () => (pg.serie === "scudo" ? "Scudo" : pg.arma.tipo); /* serie della via preparata al riposo: arma o scudo */
  const dellaVia = () => pg.via ? TEC.filter(t => t.via === pg.via && t.tipo === (sciamano() ? "Natura" : tipoVia()) && t.liv <= pg.liv) : [];
  const scudoPosti = () => !sciamano() && pg.scudo;
  const ignoraPosti = () => !window.LAYOUT_TEST && !!$("pIgnora") && $("pIgnora").checked; /* 03/11: la pagina di test usa sempre i posti */
  const prepT = () => [...preparate].map(id => TEC.find(t => t.id === id)).filter(Boolean);

  const passoDado = (d) => (d >= 12 ? 12 : d + 2); /* Runa sull'Arma: 1d6 → 1d8 → 1d10 → 1d12 */
  function ctx() {
    const c = ctxBase();
    if (arcanista()) Object.assign(c, {
      pozzo: monaco() ? 0 : M.gradoPozzo(pg.liv), /* 03/11: Pozzo Arcano, tratto dell'Arcanista */
      respiro: monaco() ? M.gradoTratto(pg.liv) : 0, via: pg.via, scuolaVia: scuolaVia(), /* 04/11: potenziamento della via */ /* 03/11: Respiro dell'Equilibrio, tratto del Monaco */
      modAtt: pg.modM, modDanno: pg.modM, cd: 8 + pg.modM + pg.liv, attrTs: monaco() ? "Spirito" : "Mente", modTs: modTsSala(monaco() ? "Spirito" : "Mente"), /* 01/11: TS contro Mente (Arcanista) o Spirito (Monaco) */ dado: s && C.attivo(s, "runa") ? passoDado(pg.arma.dado) : pg.arma.dado,
      manaPiu: (n) => { const r = Math.min(n, pg.furiaMax - pg.furia); pg.furia += r; return r; }, dannoMente: (n) => n,
      cura: (n) => { const f = Math.min(n, pg.pvMax - pg.pv); pg.pv += f; return f; }, pvMancanti: () => pg.pvMax - pg.pv, dannoCorpo: (n) => { const f = Math.min(n, pg.pv - 1); pg.pv -= f; return f; }
    });
    if (sciamano()) Object.assign(c, {
      modAtt: pg.modS, modDanno: pg.modS, cd: 8 + pg.modS + pg.liv, /* 01/11: caratteristica di classe = Agilità */
      sottobosco: !!(nem.vuln && nem.vuln.includes("Sottobosco")), /* 02/11: Enea, gli stati dello Sciamano durano 1 turno in più */
      modSpirito: pg.modS, resisteVeleno: window.LAYOUT_TEST ? !!(nem.resiste && nem.resiste.includes("veleno")) : !!($("nResiste") && $("nResiste").checked), /* 03/11: nella pagina di test vale solo per chi resiste davvero */ linfaRigeneratrice: pg.via === "guendalina",
      naturaPiu: (n) => { const r = Math.min(n, pg.furiaMax - pg.furia); pg.furia += r; return r; }, dannoPg: (n) => { pg.pv -= n; }
    });
    return c;
  }
  function ctxBase() {
    return {
      tira, liv: pg.liv, modAtt: pg.modV, modDanno: pg.modV, dado: pg.arma.dado, ca: caNem, boss: nem.boss,
      piuDadiVuln: nem.vuln && tipoAzione && nem.vuln.includes(tipoAzione) ? 1 : 0, vulnVeleno: !!(nem.vuln && (nem.vuln.includes("Veleno") || (nem.vuln.includes("Sottobosco") && s && s.furiaB))),
      svantaggio: !!(s && s.spinta && turnoPg), /* Spinta di Enea: il tuo prossimo attacco ha svantaggio */
      cd: 8 + pg.modV + pg.liv, attrTs: "Vigore", modTs: modTsSala("Vigore"), modTsDi: modTsSala, /* 01/11: d20 + caratteristica che si oppone + livello (il nemico della sala di prova ha il livello del personaggio) */
      curaPg: (n) => { pg.pv = Math.min(pg.pvMax, pg.pv + n); },
      furiaPiu: (n) => { pg.furia = Math.min(pg.furiaMax, pg.furia + n); },
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
    const r = []; let dopoImmune = false; /* 03/11: dopo un'immunità da boss, lo stato che segue è il ripiego */
    eventi.forEach(e => {
      if (dopoImmune && e.k === "stato") { dopoImmune = false; r.push("Al suo posto, effetto ridotto per i boss:"); }
      switch (e.k) {
        case "_testo": r.push(e.t); break;
        case "colpo":
          if (!e.ok) { r.push(`Mancato: d20 ${e.d} ${fmt(e.mA)} = ${e.tot} contro CA ${e.ca}.`); break; }
          r.push(`${e.crit ? "CRITICO" : "Colpito"}: d20 ${e.d} ${fmt(e.mA)} = ${e.tot} contro CA ${e.ca}${e.critDa ? ` (critico da ${e.critDa})` : ""}. Danno ${e.nd}d${e.dado} [${e.tiri.join("+")}] ${fmt(e.mm)}${e.marchio ? ` + marchio ${e.marchio}` : ""}${e.sigillo ? ` + sigillo ${e.sigillo}` : ""}${e.segno ? ` + segno ${e.segno}` : ""} = ${e.danno}.`); break;
        case "stato": r.push(e.s === "sanguina" ? `${e.dado === 6 ? "Emorragia" : "Sanguinamento"} 1d${e.dado} per ${durata(e.turni)}.` : `${NOMI_EFF[e.s] || e.s} per ${C.perScontro(e.turni) ? "tutto lo scontro" : durata(e.turni)}${DESC_EFF[e.s] ? ` (${DESC_EFF[e.s]})` : ""}.`); if (e.ridotto) r.push(`Boss: durata ridotta a ${durata(e.turni)}.`); break;
        case "immune": r.push(e.creatura ? `${nem.nome.replace(/ \(.*\)/, "")} è immune a «${NOMI_EFF[e.s]}».` : `«${NOMI_EFF[e.s]}» non funziona sui boss: niente tiro salvezza, non attecchisce mai.`); dopoImmune = !e.creatura; break;
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
        case "sconto": r.push(`La prossima tecnica costa ${e.n} furia in meno.`); break;
        case "scontoUsato": r.push(`Sconto: −${e.n} furia.`); break;
        case "furore": r.push(`+4 ai tiri salvezza e alle prove contrapposte per ${durata(e.turni)}.`); break;
        case "furia": r.push(`+${e.n} furia.`); break;
        case "giaUsataRiposo": r.push("Già usata in questo riposo."); break;
        /* scudo */
        case "assorbePronto": r.push({ meta: "Scudo pronto: il primo colpo fa metà danni", rimbalzo: "Scudo pronto: metà del primo colpo torna al nemico", zero: "Scudo pronto: il primo colpo fa 0 danni", zeroFuria: "Scudo pronto: il primo colpo fa 0 danni ma dà la furia", tutti: "Scudo pronto: ogni colpo fino al tuo turno fa 0 danni" }[e.tipo] + (e.cariche ? ` (+${e.cariche} Cariche)` : "") + (e.onda ? `, poi onda (${e.onda === "mare" ? "1d6 + Vigore per colpo" : "2d6 per Carica + Vigore"})` : "") + "."); break;
        case "cariche": r.push(e.n > 0 ? `Carica Cinetica +${e.n} (${e.tot}/${e.max})${e.perse ? `, ${e.perse} oltre il massimo perse` : ""}.` : `Cariche già al massimo (${e.tot}/${e.max}).`); break;
        case "caricheSpese": r.push(`Cariche spese: ${e.n}.`); break;
        case "caricaResta": r.push("Resta 1 Carica."); break;
        case "onda": r.push(`Onda senza tiro: ${e.n}d${e.dado} [${e.tiri.join("+")}]${e.nExtra ? ` + ${e.nExtra}d${e.dadoExtra} [${e.tiriExtra.join("+")}]` : ""} ${fmt(e.mm)} = ${e.danno}.`); break;
        case "postura": r.push("Postura: la Presa non ti afferra; se ti manca, 1 Carica."); break;
        case "posturaRegge": r.push("La postura regge."); break;
        case "vendetta": r.push("Vendetta: il nemico ti ha colpito nel suo ultimo turno."); break;
        case "baluardo": r.push(`Baluardo per ${durata(e.turni)}: furia doppia e 1 Carica per colpo subito.`); break;
        case "baluardoColpo": r.push("Baluardo: furia doppia."); break;
        case "elastica": r.push("Marea Elastica attiva: con almeno 2 Cariche, ogni colpo subito restituisce 1d4."); break;
        case "elasticaColpo": r.push(`Marea Elastica: ${e.d} danni al nemico.`); break;
        case "drenaggio": r.push("Drenaggio: se ti manca, +1 furia e 1 Carica."); break;
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
    pg = leggiPg(); pg.pv = pg.pvMax; pg.furia = pg.furiaMax;
    const D = NEMICI[$("nTipo").value];
    const nVal = (id) => ($(id) && Number($(id).value)) || 0; /* test.html: statistiche fisse del nemico */
    const vigore = nVal("nVig") || D.vigore || 10 + tira(6), agilita = nVal("nAgi") || 10 + tira(6);
    const pvMax = Number($("nPv").value) || D.pv || (10 + tira(D.dadoVita) + mod(vigore));
    nem = { ...D, id: $("nTipo").value, vigore, agilita, pvMax, ca: (Number($("nCa").value) || D.ca) + ($("nScudo") && $("nScudo").checked ? 1 : 0), boss: $("nBoss").checked || D.boss };
    s = { pv: pvMax, pvMax, eff: {}, effMax: {}, soffioPronto: true, presaUsata: false };
    finito = false; nTurno = 0; tipoAzione = null;
    $("svLog").replaceChildren();
    if (nem.enea) iniziaEnea();
    log(`Nuovo scontro: livello ${pg.liv}, ${pg.arma.nome} (1d${pg.arma.dado} ${pg.arma.tipo.toLowerCase()})${pg.scudo ? " e scudo" : ""}, Vigore ${fmt(pg.modV)}, furia ${pg.furia}/${pg.furiaMax}. Contro: ${nem.nome}${nem.boss ? " — BOSS" : ""}, PV ${pvMax}, CA ${nem.ca}, Vigore ${fmt(mod(vigore))}.`, "sis");
    log("Agisci per primo (nella sala di prova l'iniziativa è sempre tua).", "sis");
    inizioTurno();
  }
  function inizioTurno() {
    nTurno++; turnoPg = true; if (s) s.pvInizioTurno = s.pv;
    if (s && s.sangue > 0 && pg.pv > 0) { /* 02/11: Sanguinamento dell'ascia di Enea sul personaggio, 1d4 per 3 turni */
      const x = tira(4); pg.pv -= x; s.sangue--;
      blocco("Sanguini", [`Sanguinamento: ${x} danni${s.sangue ? `, ancora ${s.sangue} turni` : ", la ferita si chiude"}.`], "nem");
      if (controllaFine()) { turnoPg = false; return disegna(); }
    }
    const ril = C.inizioTurnoPg(s, ctx()); /* Mare Profondo ed Egida rilasciano l'onda */
    if (s && arcanista() && !monaco()) M.inizioTurnoPozzo(s, ctx()).forEach(e => ril.push({ k: "_testo", t: M.testo(e) })); /* 03/11: Pozzo Arcano */
    if (s && monaco()) M.inizioTurnoMonaco(s, ctx()).forEach(e => ril.push({ k: "_testo", t: M.testo(e) })); /* 03/11: Rigenerazione e Spirito Servitore */
    if (s && sciamano() && pg.liv >= 4 && C.attivo(s, "avvelenato") && pg.pv < pg.pvMax) { pg.pv += 1; ril.push({ k: "_testo", t: "Linfa che ritorna: il veleno nel nemico ti torna come linfa, ti curi di 1." }); } /* 03/11 */
    if (ril.length) { blocco("Inizio del tuo turno", testoEventi(ril), "mia"); if (controllaFine()) { turnoPg = false; return disegna(); } }
    disegna();
  }
  /* danni al personaggio: la Fortezza Eterna può lasciarti a 1 */
  function ferisci(dn, righe) {
    if (C.attivo(s, "invuln")) { righe.push("Invulnerabilità: nessun danno."); return 0; }
    const f = C.fortezza(s, dn, pg.pv), sv = M ? M.secondaVita(s, f.danno, pg.pv, ctx()) : { danno: f.danno, eventi: [] };
    const prima = pg.pv;
    if (!arcanista() && !sciamano() && pg.liv >= 4 && pg.pv - sv.danno <= 0 && pg.pv > 0 && !perRiposo.ultimo_cadere) { /* 03/11: Ultimo a cadere (Guerriero), una volta per riposo */
      perRiposo.ultimo_cadere = true; sv.danno = pg.pv - 1; pg.furia = Math.min(pg.furiaMax, pg.furia + 3);
      righe.push("Ultimo a cadere: il colpo doveva atterrarti, ma resti in piedi con 1 di salute (+3 furia).");
    }
    pg.pv -= sv.danno; righe.push(...testoEventi(f.eventi), ...testoEventi(sv.eventi));
    if (sv.cura) pg.pv = Math.min(pg.pvMax, pg.pv + sv.cura);
    if (monaco() && M) righe.push(...M.sottoMetaMonaco(s, ctx(), prima, pg.pv, pg.pvMax).map(e => M.testo(e))); /* 03/11: Respiro dell'Equilibrio, grado III */
    return sv.danno;
  }
  function dopoAzione() {
    turnoPg = false; tipoAzione = null;
    if (nem.enea) dopoAzioneEnea();
    if (controllaFine()) return disegna();
    turnoNemico();
    if (controllaFine()) return disegna();
    inizioTurno();
  }
  function controllaFine() {
    if (finito) return true;
    if (s.pv <= 0 && nem.enea && !s.risorto) { risurrezione(); return false; }
    if (s.pv <= 0 && nem.enea) { finito = true; log("Enea cade per la seconda volta. In gioco, qui scegli se risparmiarlo o ucciderlo.", "ok"); return true; }
    if (s.pv <= 0) { finito = true; log(`${nem.nome} è sconfitto.`, "ok"); return true; }
    if (nem.resa && s.pv <= Math.ceil(s.pvMax / 3)) { finito = true; log("Ettore si arrende (in gioco succede a un terzo della salute).", "ok"); return true; }
    if (pg.pv <= 0) { finito = true; log("Sei a terra: sconfitta.", "ko"); return true; }
    return false;
  }
  function attaccoNormale() {
    if (!turnoPg || finito) return;
    const pre = s.prossimo || {}; s.prossimo = null;
    tipoAzione = pg.arma.tipo;
    const c = ctx(), ombraR = monaco() && (Number(s.bilancia) || 0) < 0; if (ombraR) c.modDanno += 1; /* 03/11: Respiro dell'Equilibrio, Bilancia in Negromanzia */
    const e = C.colpo(s, c, { base: true, bonus: pre.bonus || 0, piuDadi: pre.piuDadi || 0 });
    if (ombraR && e.ok) e.respiro = true;
    if (e.crit && !arcanista() && !sciamano()) c.furiaPiu(2);
    const runa = e.ok && arcanista() && C.attivo(s, "runa") ? testoEventi([C.incidi(s, c, 1)]) : [];
    if (sciamano()) { if (e.ok) runa.push(...testoEventi(S.suColpo(s, c, e))); runa.push(...testoEventi(S.attaccoFuria(s, c))); } /* rivestimento e Linfa Furiosa */
    if (e.ok && arcanista() && C.attivo(s, "voto")) { const x = tira(4); s.pv -= x; runa.push(M.testo({ k: "votoColpo", d: x })); } /* 03/11: niente più «cura 1», ora c'è la Rigenerazione */
    blocco("Attacco normale", [...testoEventi([e]), ...(e.respiro ? [M.testo({ k: "respiroOmbra" })] : []), ...runa, e.crit && !arcanista() && !sciamano() ? "Tuo critico: +2 furia." : ""], e.ok ? "mia" : "");
    dopoAzione();
  }
  function usaTecnica(t) {
    if (!turnoPg || finito) return;
    if (!ignoraPosti() && !t.via && t.tipo !== "Utilita" && !preparate.has(t.id)) return log(`${t.nome.it}: non è tra le tecniche preparate.`, "ko");
    const c = ctx();
    if (t.unaPerRiposo && c.usataPerRiposo(t.id)) return log(`${t.nome.it}: già usata in questo riposo.`, "ko");
    const disp = C.disponibile(t, s); if (!disp.ok) return log(`${t.nome.it}: ${testoEventi([{ k: disp.motivo }])[0]}`, "ko");
    if (t.passiva) return log(`${t.nome.it}: è una passiva, sempre attiva.`, "ko");
    const costo = sciamano() ? t.costo : C.costo(t, s);
    if (pg.furia < costo) return log(`${t.nome.it}: servono ${costo} ${risorsa()}, ne hai ${pg.furia}.`, "ko");
    pg.furia -= costo; tipoAzione = pg.arma.tipo;
    const r = sciamano() ? S.usa(t, s, ctx()) : C.usa(t, s, ctx());
    const crit = sciamano() ? 0 : r.eventi.filter(e => e.k === "colpo" && e.crit).length;
    for (let i = 0; i < crit; i++) c.furiaPiu(2);
    blocco(`${t.nome.it} (−${costo} ${risorsa()})`, [...testoEventi(r.eventi), crit ? `Tuo critico: +${2 * crit} furia.` : "", `${sciamano() ? "Natura" : "Furia"}: ${pg.furia}/${pg.furiaMax}.`], "mia");
    if (t.gratuita) return disegna(); /* Rinascita: non consuma l'azione */
    dopoAzione();
  }
  function usaIncantesimo(inc) {
    if (!turnoPg || finito || !arcanista()) return;
    if (window.LAYOUT_TEST && !inc.via && !preparatiInc.has(inc.id)) return log(`${inc.nome.it}: non è tra gli incantesimi preparati.`, "ko");
    const c = ctx();
    const disp = M.disponibile(inc, s, c); if (!disp.ok) return log(`${inc.nome.it}: ${M.testo({ k: disp.motivo })}`, "ko");
    const costo = M.costo(inc, s, c);
    if (pg.furia < costo) return log(`${inc.nome.it}: servono ${costo} mana, ne hai ${pg.furia}.`, "ko");
    pg.furia -= costo; tipoAzione = { arcano: "Arcano", forza: "Forza", luce: "Luce", ombra: "Ombra" }[inc.scuola] || null; /* 03/11: anche Arcano, come in gioco */ /* le armi non contano negli incantesimi */
    const r = M.lancia(inc, s, ctx());
    blocco(`${inc.nome.it} (−${costo} ${monaco() ? "fede" : "mana"})`, [...testoEventi(r.eventi), `${monaco() ? "Fede" : "Mana"}: ${pg.furia}/${pg.furiaMax}.`], "mia");
    dopoAzione();
  }
  function turnoNemico() {
    tipoAzione = null;
    const c = ctx(), righe = [];
    const t = C.tickSangue(s, c); if (t) righe.push(`Sanguinamento: ${t.d} danni (d${t.dado}).`);
    if (M && M.haTick(s)) M.inizioTurnoNemico(s, c).forEach(e => righe.push(M.testo(e)));
    if (sciamano()) righe.push(...testoEventi(S.tickNemico(s, c))); /* veleno, bulbo, marea; riparte il recupero del turno */
    if (s.pv <= 0) { blocco("Turno del nemico", righe, "nem"); return; }
    const difesa = (dn) => { if (!sciamano()) return dn; const r = S.difesa(s, c, dn); righe.push(...testoEventi(r.eventi)); return r.danno; }; /* Pelle e Scudo di Corteccia */
    const furia = () => !arcanista() && !sciamano();
    /* Frattura: 1d4 prima di ogni attacco del nemico (anche Presa e Soffio) */
    const frattura = () => { const f = C.frattura(s, c); if (f) righe.push(`Frattura: ${f.d} danni prima di attaccare.`); return s.pv <= 0; };
    if (nem.passivo) righe.push("Il manichino non attacca.");
    else if (C.attivo(s, "bloccato")) { righe.push("Stordito: salta il turno."); if (nem.enea && s.carica) { s.carica = null; s.dopoCarica = true; righe.push("Il maglio gli ricade a terra: la carica è persa."); } }
    else if (frattura()) { blocco("Turno del nemico", righe, "nem"); return; }
    else if (nem.enea) turnoEnea(c, righe, difesa);
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
          const g = furia() ? C.furiaPerColpo(pg.liv, false) : 0; pg.furia = Math.min(pg.furiaMax, pg.furia + g);
          righe.push(`Soffio Infuocato: tiro salvezza d20 ${d} ${fmt(m)} = ${tot} contro CD ${nem.soffio.cd} → preso, ${dn} danni [${tiri.join("+")}].${g ? ` +${g} furia.` : ""}`);
          const dd = difesa(dn); if (dd > 0) ferisci(dd, righe);
        }
      }
      for (let k = 0; !fatto && k < (nem.attacchi || 1) && pg.pv > 0; k++) { /* 02/11: più attacchi per turno (Ettore) */
        const morso = nem.arma ? false : Math.random() < 0.5 || $("nMorso").checked, nome = nem.arma ? (nem.nomeArma || "Spada") : morso ? "Morso" : "Zampata";
        const m = mod(statNem(nem.primaria || "Vigore")) + (nem.attacco || 0) + C.modAttaccoNem(s), /* 01/11: caratteristica primaria */ at = C.tiroAttaccoNem(s, c), d = at.d, tot = d + m, ca = caPg(), crit = d === 20 && C.critNemPossibile(s), ok = crit || tot > ca, bD = nem.dannoBonus != null ? nem.dannoBonus : m;
        if (at.tiri) righe.push(`Due d20, tiene il peggiore: ${at.tiri[0]} e ${at.tiri[1]}.`);
        if (!ok) { righe.push(`${nome}: mancato (d20 ${d} ${fmt(m)} = ${tot} contro la tua CA ${ca}). Nessuna furia.`); righe.push(...testoEventi(C.colpoMancato(s, c))); }
        else if (!s.parata) { /* scudo, Baluardo, Marea Elastica: il danno si tira prima */
          const nd = crit ? 2 : 1, tiri = Array.from({ length: nd }, () => tira(nem.dannoDado)), pieno = Math.max(1, tiri.reduce((a, b) => a + b, 0) + bD);
          const sub = C.colpoSubito(s, c, crit, pieno);
          righe.push(`${nome}: ${crit ? "CRITICO" : "colpito"} (d20 ${d} ${fmt(m)} = ${tot} contro CA ${ca}), ${pieno} danni [${tiri.join("+")}].`, ...testoEventi(sub.eventi));
          const dd = difesa(sub.danno), fatto = dd > 0 ? ferisci(dd, righe) : 0;
          if (furia()) pg.furia = Math.min(pg.furiaMax, pg.furia + sub.furia);
          righe.push(`Subisci ${fatto} danni.${furia() ? ` +${sub.furia} furia.` : ""}`);
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
          if (sub.annullato) righe.push(`${nome}: colpirebbe (d20 ${d} ${fmt(m)} = ${tot} contro CA ${ca}), ma la Parata lo annulla: 0 danni, nessuna furia.`, ...testoEventi(sub.eventi.filter(e => e.k === "stato" || e.k === "crepe")), ...sub.eventi.filter(e => e.k === "contrattacco").map(e => `Contrattacco${e.dCrit ? ` (critico 18-20: d20 ${e.dCrit} → ${e.crit ? "CRITICO" : "no"})` : ""}: ${e.tiri.length}d${e.dado} [${e.tiri.join("+")}] ${fmt(e.mm)} = ${e.danno} danni.`));
          else {
            const nd = crit ? 2 : 1, tiri = Array.from({ length: nd }, () => tira(nem.dannoDado)), dn = Math.max(1, tiri.reduce((a, b) => a + b, 0) + bD);
            pg.pv -= dn; if (!arcanista()) pg.furia = Math.min(pg.furiaMax, pg.furia + sub.furia);
            righe.push(`${nome}: ${crit ? "CRITICO" : "colpito"} (d20 ${d} ${fmt(m)} = ${tot} contro CA ${ca}), ${dn} danni [${tiri.join("+")}]. +${sub.furia} furia.`);
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

  /* ---------- Enea, guardiano d'argento (30/10, PROPOSTA: numeri in bilanciamento 5c) ----------
     Mani nude: 2 pugni da 1d4 (senza Vigore), Spinta (1 PA). Maglio: 1d8 + 1 + 3; Colpo caricato (3 PA): annunciato,
     2d8 + 4 il turno dopo, mai due cariche di fila; «Mi difendo» dimezza; colpirlo mentre carica lo fa andare a vuoto;
     dopo la prima interruzione carica in guardia (+2 CA); Finta (2 PA): annuncia la carica e colpisce di lato
     ignorando la difesa; Intuizione gratuita per smascherarla. Risurrezione una volta: 1d4 + 3. */
  const eneaOpz = () => ({ fermaglio: $("nFermaglio").checked, spada: window.LAYOUT_TEST ? !!(pg && pg.arma && pg.arma.retaggio) : $("nSpada").checked, socialita: $("nSocialita").checked, mossa: $("nEneaMossa").value, lato: $("nEneaLato") ? $("nEneaLato").value : "casuale" });
  const sdegno = () => (eneaOpz().spada && !eneaOpz().socialita ? 1 : 0);
  function iniziaEnea() {
    const o = eneaOpz();
    s.pa = nem.pa; s.maglio = o.fermaglio || o.spada; s.carica = null; s.dopoCarica = false; s.inGuardia = false; s.risorto = false; s.spinta = false; s.furiaB = false; s.sangue = 0; s.lato = "maglio";
    log(s.maglio ? (o.spada ? "Enea vede la spada del Signore nelle tue mani e impugna il maglio." : "Enea vede il fermaglio di bronzo sul tuo petto e impugna il maglio: sei venuto a prendere il suo posto.") : "Il fermaglio è nascosto: Enea ti prende per l'ennesimo sperduto e si fa avanti a mani nude.", "sis");
    if (s.maglio) log("Enea ti mostra il lato del maglio: a ogni turno girerà l'arma, e la scheda ti dice quale lato vedrai.", "sis");
    if (o.spada) log(o.socialita ? "Gli spieghi che ti sei inginocchiato e che la spada ti ha scelto: lo sdegno svanisce, Enea è turbato." : "Sdegno del cavaliere: un estraneo ha osato toccare la spada del suo re (+1 per colpire).", "sis");
  }
  function risurrezione() {
    const x = tira(4), pv = x + 3;
    s.risorto = true; s.pv = pv; s.carica = null; s.dopoCarica = false; s.furiaB = true; s.inGuardia = false; s.inGuardiaDopo = false;
    const prima = s.maglio; s.maglio = true;
    blocco("Enea cade… e si rialza nella furia", ["Le tombe dei suoi uomini lo rimettono in piedi. Non prega più: ringhia.", `Furia del becchino: 1d4 ${x} + 3 = ${pv} salute; niente più finte né carica in guardia.`, prima ? "" : "Ora impugna l'arma a doppia faccia."], "nem");
  }
  /* dopo la tua azione: se Enea stava caricando e lo hai colpito, la carica va a vuoto */
  function dopoAzioneEnea() {
    if (s.carica === "vera" && s.pv < s.pvInizioTurno && !s.caricaRotta) {
      s.caricaRotta = true;
      log(`Lo colpisci mentre solleva il maglio: perde l'equilibrio, il colpo andrà a vuoto.${s.inGuardia ? "" : " Da ora in poi caricherà in guardia (+2 CA durante la carica)."}`, "ok");
      s.inGuardiaDopo = true;
    }
    s.spinta = false;
  }
  function difendoEnea() {
    if (!turnoPg || finito || !nem || !nem.enea || !s.carica) return;
    s.difeso = true;
    blocco("Mi difendo", ["Ti pianti sui piedi e alzi la guardia: il colpo caricato ti arriverà dimezzato."], "mia");
    dopoAzione();
  }
  function osservaEnea() {
    if (!turnoPg || finito || !nem || !nem.enea || !s.carica || s.osservato) return;
    s.osservato = true;
    const b = Number($("pInt").value) || 0, d = tira(20), tot = d + b, ok = tot >= 12;
    blocco("Osservi Enea (Intuizione, gratuita)", [`d20 ${d} ${fmt(b)} = ${tot} contro CD 12 → ${ok ? "riuscita" : "fallita"}.`, ok ? (s.carica === "vera" ? "Il peso è tutto sul maglio: la carica è vera." : "Il peso resta sui piedi: è una finta, colpirà di lato.") : "Non riesci a capire se la carica è vera."], ok ? "mia" : "");
    disegna();
  }
  /* un colpo di Enea: tiro, Parata, scudo, difese dello Sciamano, furia; o.dimezza: «Mi difendo»; o.ignora: la finta aggira la difesa */
  function colpoEnea(c, righe, difesa, nome, nd0, dado, bonus, o) {
    o = o || {}; /* 03/11: la Furia del becchino non dà più +2 ai danni (taratura di Enea) */
    if (o.ignora) { if (s.parata || s.assorbe || s.difeso) righe.push("La finta aggira la tua difesa."); s.parata = false; s.parataCrepe = false; s.parataPunta = false; s.assorbe = null; }
    const furia = !arcanista() && !sciamano();
    const m = nem.attaccoFisso + sdegno() + C.modAttaccoNem(s), at = C.tiroAttaccoNem(s, c), d = at.d, tot = d + m, ca = caPg(), crit = d === 20 && C.critNemPossibile(s), ok = crit || tot > ca;
    if (at.tiri) righe.push(`Due d20, tiene il peggiore: ${at.tiri[0]} e ${at.tiri[1]}.`);
    if (!ok && o.ascia) s.asciaOk = false;
    if (!ok) { righe.push(`${nome}: mancato (d20 ${d} ${fmt(m)} = ${tot} contro la tua CA ${ca}).`); righe.push(...testoEventi(C.colpoMancato(s, c))); return false; }
    const n = (crit ? 2 : 1) * nd0, tiri = Array.from({ length: n }, () => tira(dado)), pieno0 = Math.max(1, tiri.reduce((a, b) => a + b, 0) + bonus), pieno = o.dimezza ? Math.max(1, Math.floor(pieno0 / 2)) : pieno0;
    const testa = `${nome}: ${crit ? "CRITICO" : "colpito"} (d20 ${d} ${fmt(m)} = ${tot} contro CA ${ca}), ${pieno0} danni [${tiri.join("+")}${bonus ? ` ${fmt(bonus)}` : ""}]${o.dimezza ? ` → dimezzati dalla tua guardia: ${pieno}` : ""}.`;
    if (!s.parata) {
      const sub = C.colpoSubito(s, c, crit, pieno);
      righe.push(testa, ...testoEventi(sub.eventi));
      const dd = difesa(sub.danno), fatto = dd > 0 ? ferisci(dd, righe) : 0;
      if (furia) pg.furia = Math.min(pg.furiaMax, pg.furia + sub.furia);
      righe.push(`Subisci ${fatto} danni.${furia ? ` +${sub.furia} furia.` : ""}`);
      if (o.ascia) s.asciaOk = fatto > 0;
    } else {
      const sub = C.colpoSubito(s, c, crit);
      if (sub.annullato) righe.push(`${nome}: colpirebbe (d20 ${d} ${fmt(m)} = ${tot} contro CA ${ca}), ma la Parata lo annulla: 0 danni.`, ...sub.eventi.filter(e => e.k === "contrattacco").map(e => `Contrattacco: ${e.tiri.length}d${e.dado} [${e.tiri.join("+")}] ${fmt(e.mm)} = ${e.danno} danni.`));
      else { pg.pv -= pieno; if (furia) pg.furia = Math.min(pg.furiaMax, pg.furia + sub.furia); righe.push(testa, `Subisci ${pieno} danni.`); }
    }
    return true;
  }
  function turnoEnea(c, righe, difesa) {
    const o = eneaOpz();
    if (!s.maglio && s.pv <= Math.floor(s.pvMax / 2)) { s.maglio = true; righe.push("Il fermaglio di bronzo ti scivola dal mantello. Enea lo riconosce, e impugna il maglio."); }
    if (s.carica) { /* risolve la carica annunciata nel turno prima */
      const tipo = s.carica, difeso = !!s.difeso;
      if (tipo === "vera") {
        if (s.caricaRotta) righe.push("Il maglio ricade fuori misura: la carica va a vuoto.");
        else colpoEnea(c, righe, difesa, "Colpo caricato", 2, 8, 1 + 3, { dimezza: difeso });
      } else colpoEnea(c, righe, difesa, "Finta: colpo di lato", 1, 8, 1 + 3, { ignora: true });
      if (s.inGuardiaDopo && !s.furiaB) s.inGuardia = true; /* in furia niente carica in guardia */
      s.lato = Math.random() < 0.5 ? "maglio" : "ascia"; if (o.lato === "maglio" || o.lato === "ascia") s.lato = o.lato;
      righe.push(s.lato === "ascia" ? "Enea gira l'arma: ora ti mostra il lato dell'ascia." : "Enea gira l'arma: ora ti mostra il lato del maglio.");
      s.carica = null; s.caricaRotta = false; s.difeso = false; s.osservato = false; s.dopoCarica = true;
      return;
    }
    if (s.maglio) {
      /* 02/11: arma a doppia faccia. Il lato si annuncia alla fine del turno prima (lo leggi nella scheda) */
      const lato = s.lato || "maglio";
      const prossimo = () => { s.lato = o.lato === "maglio" || o.lato === "ascia" ? o.lato : Math.random() < 0.5 ? "maglio" : "ascia"; righe.push(s.lato === "ascia" ? "Enea gira l'arma: ora ti mostra il lato dell'ascia." : "Enea gira l'arma: ora ti mostra il lato del maglio."); };
      if (lato === "ascia") {
        s.dopoCarica = false;
        const ok = colpoEnea(c, righe, difesa, "Ascia", 1, 8, 4, { ascia: true });
        if (ok && s.asciaOk && s.furiaB && pg.pv > 0 && s.pa >= 2 && !s.sangue) { /* 02/11: lo Squarcio solo in Furia del becchino */
          s.pa -= 2;
          const cd = 13 /* 8 + Vigore di Enea (+2) + il suo livello (3) */, d = tira(20), tot = d + pg.modV;
          righe.push(`Squarcio (−2 PA): tiro salvezza sul Vigore d20 ${d} ${fmt(pg.modV)} = ${tot} contro CD ${cd} → ${tot >= cd ? "la ferita si chiude" : "sanguini, 1d4 per 3 turni"}.`);
          if (tot < cd) s.sangue = 3;
        }
        prossimo(); return;
      }
      const puo = !s.dopoCarica, vuole = o.mossa === "carica" || o.mossa === "finta" || (o.mossa === "casuale" && Math.random() < 0.55);
      const finta = !s.furiaB && (o.mossa === "finta" || (o.mossa === "casuale" && s.inGuardia && Math.random() < 0.4)); /* in furia niente finte */
      s.dopoCarica = false;
      if (puo && vuole && finta && s.pa >= 2) { s.pa -= 2; s.carica = "finta"; righe.push("Enea solleva il maglio sopra la testa (−2 PA). Il prossimo colpo sarà devastante… o forse no."); return; }
      if (puo && vuole && s.pa >= 3) { s.pa -= 3; s.carica = "vera"; righe.push(`Enea solleva il maglio sopra la testa (−3 PA)${s.inGuardia ? ", in guardia (+2 CA)" : ""}. Il prossimo colpo sarà devastante.`); return; }
      colpoEnea(c, righe, difesa, "Maglio", 1, 8, 1 + 3);
      prossimo(); return;
    }
    /* mani nude: due pugni, oppure Spinta e un pugno */
    if (s.pa >= 1 && (o.mossa === "spinta" || (o.mossa === "casuale" && Math.random() < 0.35))) {
      s.pa -= 1;
      const m = nem.attaccoFisso + sdegno() + C.modAttaccoNem(s), d = tira(20), tot = d + m, ok = d === 20 || tot > caPg();
      righe.push(`Spinta (−1 PA): d20 ${d} ${fmt(m)} = ${tot} contro la tua CA ${caPg()} → ${ok ? "ti sbilancia, il tuo prossimo attacco ha svantaggio" : "resti in piedi"}.`);
      if (ok) s.spinta = true;
      colpoEnea(c, righe, difesa, "Pugno", 1, 4, 0);
      return;
    }
    colpoEnea(c, righe, difesa, "Pugno", 1, 4, 0);
    if (pg.pv > 0) colpoEnea(c, righe, difesa, "Secondo pugno", 1, 4, 0);
  }
  function riposa() {
    if (!pg) pg = leggiPg();
    perRiposo = {}; pg.furia = pg.furiaMax; pg.pv = pg.pvMax;
    log("Riposo: " + risorsa() + " e salute piene, le tecniche «una volta per riposo» tornano disponibili.", "sis"); disegna();
  }

  /* ---------- interfaccia ---------- */
  function scheda(box, voci) { box.replaceChildren(); voci.forEach(([k, v]) => box.append(el("dt", { text: k }), el("dd", { text: v }))); }
  function effetti(chiavi) {
    const att = chiavi.filter(k => s && s.eff[k] > 0);
    return att.map(k => [k === "sanguina" ? (Number(s.sangueDado) === 6 ? "Emorragia 1d6" : "Sanguinamento 1d4") + (s.marchio ? " · marchiato" : "") : k === "avvelenato" ? (Number(s.velenoDado) === 6 ? "Tossina 1d6" : "Avvelenato 1d4") : NOMI_EFF[k] + (k === "esposto" && s.segno ? " · segnato" : "") + (k === "rivest" && s.rivest ? " · " + s.rivest : ""), C.perScontro(s.eff[k]) ? "tutto lo scontro" : durata(s.eff[k])]);
  }
  const bilanciaTesto = () => { const v = (s && s.bilancia) || 0; return v === 0 ? "equilibrio" : v > 0 ? `Vita ${v}${v === 3 ? " · Zenit" : v === 2 ? " · Aureola" : ""}` : `Negromanzia ${-v}${v === -3 ? " · Nadir" : v === -2 ? " · Coro" : ""}`; };
  const sigilliNem = () => { if (!s || !C.sigilli(s)) return []; const n = C.sigilli(s), max = C.sigilliMax({ boss: nem.boss, liv: pg.liv, scuolaVia: scuolaVia() }); return [["Sigilli (tutto lo scontro)", `${"◆".repeat(n)}${"◇".repeat(Math.max(0, max - n))} ${n} su ${max}${n >= max ? " · al massimo: Detonazione doppia" : ""}`]]; }; /* 03/11 */
  const crepeNem = () => { if (!s || !C.crepe(s)) return []; const max = C.crepeMax({ boss: nem.boss }); return [["Incrinatura" + (s.sigillo && C.crepe(s) >= max ? " · sigillo" : ""), `${C.crepe(s)}/${max} cariche (−${C.crepe(s)} CA)`]]; };
  function disegna() {
    if (!pg) pg = leggiPg();
    const st = pg.pv != null ? pg : { ...pg, pv: pg.pvMax, furia: pg.furiaMax };
    scheda($("svPg"), [["Salute", `${st.pv} / ${pg.pvMax}`], [arcanista() ? (monaco() ? "Punti fede" : "Mana") : sciamano() ? "Punti natura" : "Furia", `${st.furia} / ${pg.furiaMax}`], ["CA", String(s ? caPg() : pg.ca)], ["CD dei tuoi effetti", String(8 + (arcanista() ? pg.modM : pg.modV) + pg.liv)], ...(sciamano() ? [["Natura per evento", `${S.recupero({ liv: pg.liv }, false)} (doppio con la Tossina), uno per turno del nemico`], ...(s && s.corteccia ? [["Scudo di Corteccia", `${s.corteccia}/${S.scudoMax({ liv: pg.liv })}`]] : []), ...(s && s.trappola ? [["Trappola", s.trappola]] : [])] : arcanista() ? (monaco() ? [["Fede per Crepuscolo", `${M.recupero(pg.liv)} (doppio da Nadir)`], ["Bilancia", bilanciaTesto()]] : [["Mana per Detonazione", `${M.recupero(pg.liv)} (doppio con i Sigilli al massimo)`]]) : [["Furia per colpo subito", `${C.furiaPerColpo(pg.liv, false)} (critico ${C.furiaPerColpo(pg.liv, true)})`]]), ...effetti(EFF_PG), ...(s && s.parata ? [["Parata", "pronta"]] : []), ...(s && C.cariche(s) ? [["Carica Cinetica", `${C.cariche(s)}/${C.CARICHE_MAX}${s.elastica && C.cariche(s) >= 2 ? " · elastica" : ""}`]] : []), ...(s && s.assorbe ? [["Scudo", `pronto (${s.assorbe.tipo})`]] : []), ...(s && s.difesaBloccata ? [["Difesa dello scudo", "non questo turno"]] : []), ...(s && s.sconto ? [["Sconto", `−${s.sconto} furia`]] : []), ...(s && s.spinta ? [["Spinta di Enea", "il tuo prossimo attacco ha svantaggio"]] : []), ...(s && s.difeso ? [["Guardia", "il colpo caricato ti arriverà dimezzato"]] : [])]);
    if (nem) scheda($("svNem"), [["Nemico", nem.nome + (nem.boss ? " — BOSS" : "")], ["Salute", `${Math.max(0, s.pv)} / ${s.pvMax}`], ["CA", String(caNem())], ...(nem.soffio ? [["Soffio", s.soffioPronto ? "carico" : "scarico"]] : []), ...(nem.enea ? [["Arma", s.maglio ? `doppia faccia, lato ${s.lato === "ascia" ? "dell'ascia (1d8 + 4" + (s.furiaB ? ", Squarcio" : "") + ")" : "del maglio (1d8 + 4, colpo caricato)"}${s.furiaB ? " · +2 furia" : ""}` : "mani nude (2 × 1d4)"], ...(s.sangue ? [["Ti fa sanguinare", `${s.sangue} turni`]] : []), ["Punti abilità", `${s.pa} / ${nem.pa}`], ["Carica", s.carica ? (s.caricaRotta ? "spezzata: andrà a vuoto" : "annunciata" + (s.inGuardia ? " · in guardia" : "")) : s.inGuardia ? "nessuna · ora carica in guardia" : "nessuna"], ["Furia del becchino", s.risorto ? "attiva" : "pronta"], ["Vulnerabile a", "forza, luce, sottobosco (Sciamano)"], ...(sdegno() ? [["Sdegno del cavaliere", "+1 per colpire"]] : [])] : []), ...crepeNem(), ...sigilliNem(), ...(s && s.caMeno ? [["Spezzato", `CA −${s.caMeno} per tutto lo scontro`]] : []), ...(s && s.filo ? [["Filo di Rune", C.sigilli(s) ? `attivo: −${C.sigilli(s)} a colpirti (1 per Sigillo)` : "nessun Sigillo: nessun effetto"]] : []), ...(s && s.demolitore ? [["Demolitore", "ogni Detonazione fa Sbilanciato 1"]] : []), ...(s && s.morbo ? [["Morbo", `${s.morbo}/3`]] : []), ...effetti(["sanguina", "frattura", "esposto", "debole", "sbilanciato", "silenzio", "frastornato", "intontito", "bloccato", "pressione", "parola", "accecato", "avvizzito", "paura", "corona", "avvelenato", "marea"])]);
    else scheda($("svNem"), [["Nemico", "—"]]);
    /* posti e tecniche */
    const prep = prepT().filter(t => sciamano() === (t.classe === "Forestiero")), max = C.slotTecniche(pg.liv, scudoPosti());
    if (window.LAYOUT_TEST) barreTest();
    $("svPosti").textContent = `Posti: ${prep.filter(tipoOk).length} / ${max} (quote: 2 di livello 1, 2 di livello 2, 1 per i livelli 3, 4, 5${scudoPosti() ? "; +1 di qualsiasi livello con lo scudo" : ""}).`;
    const lista = $("svTec"); lista.replaceChildren();
    const riga = (t, gruppo) => {
      const inPosto = gruppo !== "base" || preparate.has(t.id);
      const usabile = !t.passiva && !finito && turnoPg && tipoOk(t) && (inPosto || ignoraPosti()) && !(t.unaPerRiposo && perRiposo[t.id]) && pg.furia >= (sciamano() ? t.costo : C.costo(t, s)) && C.disponibile(t, s).ok;
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
    if (arcanista()) { /* classica: tutti gli incantesimi sbloccati; pagina di test: posti come in gioco (04/11: liberi tra le due scuole) */
      const prepInc = !!window.LAYOUT_TEST, maxP = postiPrincInc(pg.liv);
      $("svPosti").textContent = prepInc ? `Incantesimi preparati: ${preparatiInc.size} / ${maxP + 1} (liberi tra le due scuole; si cambiano al riposo). Il costo si paga in ${monaco() ? "punti fede" : "mana"}.` : "Tutti gli incantesimi sbloccati sono usabili (la preparazione ai posti non si prova qui). Il costo si paga in " + (monaco() ? "punti fede" : "mana") + ".";
      lista.replaceChildren();
      const sc2 = SCUOLE(), sblocc = MG.INCANTESIMI.filter(i => sc2.includes(i.scuola) && i.liv <= pg.liv), NS = { arcano: "Arcano", forza: "Forza", luce: "Vita", ombra: "Negromanzia" };
      const rigaInc = (inc, etichetta) => {
        const costoR = s ? M.costo(inc, s, ctx()) : inc.costo;
        const usata = M.UNA_PER_RIPOSO.includes(inc.id) && perRiposo[inc.id];
        const prep = !prepInc || etichetta === "via" || preparatiInc.has(inc.id);
        const ok = prep && !finito && turnoPg && s && pg.furia >= costoR && !usata && M.disponibile(inc, s, ctx()).ok;
        const b = el("button", { type: "button", class: "mini", "data-inc": inc.id, onclick: () => usaIncantesimo(inc) }, "Lancia");
        b.disabled = !ok;
        let chkI = null;
        if (prepInc && etichetta !== "via") {
          chkI = el("input", { type: "checkbox", title: "Prepara", onchange: (e) => { if (e.target.checked) preparatiInc.add(inc.id); else preparatiInc.delete(inc.id); disegna(); } });
          chkI.checked = preparatiInc.has(inc.id); chkI.disabled = !chkI.checked && preparatiInc.size >= maxP + 1;
        }
        const tg = M.etichette ? M.etichette(inc) : [], cp = s && M.comboPronta ? M.comboPronta(inc, s, ctx()) : null; /* 03/11: combo */
        lista.append(el("div", { class: "tec" + (prep ? "" : " spenta") }, el("span", { class: "sx" }, chkI, el("b", { text: inc.nome.it }), el("small", { text: ` liv. ${inc.liv} · ${costoR} ${monaco() ? "fede" : "mana"}${M.UNA_PER_RIPOSO.includes(inc.id) ? " · una per riposo" : ""}${etichetta ? " · " + etichetta : ""}` })), b,
          tg.length || cp ? el("p", { class: "combo" }, tg.length ? el("span", { class: "tag", text: tg.join(" · ") }) : null, cp ? el("span", { class: cp.ok ? "pronta" : "inutile", text: (tg.length ? " — " : "") + cp.t }) : null) : null,
          el("p", { class: "eff", text: inc.effetto.it })));
      };
      sc2.forEach((sc) => { lista.append(el("h4", { text: NS[sc] + (sc === scuolaVia() ? ` — potenziata dalla via: ${M.POTENZIAMENTI_VIA[sc].it}` : "") })); sblocc.filter(i => i.scuola === sc).forEach(i => rigaInc(i)); });
      if (pg.liv >= 3) {
        lista.append(el("h4", { text: pg.via ? `Via ${monaco() ? (pg.via === "aldo" ? "Cenere (Negromanzia)" : "Brace (Vita)") : (pg.via === "aldo" ? "Frattura (Forza)" : "Sutura (Arcano)")}` : "Via di prestigio: sceglila nel pannello a sinistra" }));
        if (pg.via) MG.VIE.filter(v => v.via === pg.via && sc2.includes(v.scuola) && v.liv <= pg.liv).forEach(i => rigaInc(i, "via"));
      }
    }
    $("svAttacca").disabled = finito || !turnoPg;
    const caricaOra = !finito && turnoPg && nem && nem.enea && s && s.carica;
    $("svDifendo").hidden = !caricaOra; $("svDifendo").disabled = !caricaOra;
    $("svOsserva").hidden = !caricaOra; $("svOsserva").disabled = !caricaOra || !!s.osservato;
    $("pVia").disabled = Number($("pLiv").value) < 3; $("pSerie").disabled = Number($("pLiv").value) < 3 || (!!window.LAYOUT_TEST && !(pg && pg.classe === "guerriero" && pg.scudo));
  }
  function mostraCoda() { const c = $("svCodaVis"); if (c) c.textContent = coda.length ? `In coda: ${coda.join(", ")}` : "Coda vuota: i dadi tirano a caso."; }
  function eseguiTest() {
    const esiti = window.TestCombattimento.esegui().concat(window.TestMagiaCombattimento ? window.TestMagiaCombattimento.esegui() : [], window.TestSciamano ? window.TestSciamano.esegui() : []), ko = esiti.filter(e => !e.ok);
    const box = $("svTest"); box.replaceChildren(el("p", { class: ko.length ? "ko" : "ok", text: `${esiti.length - ko.length} / ${esiti.length} test superati` }));
    const ul = el("ul"); esiti.forEach(e => ul.append(el("li", { class: e.ok ? "ok" : "ko", text: `${e.ok ? "OK" : "ERRORE"} — ${e.nome}${e.ok ? "" : " → " + e.errore}` }))); box.append(ul);
    window.esitiTestCombattimento = esiti;
  }

  function costruisci() {
    if (window.LAYOUT_TEST) return costruisciTest();
    document.title = "Sala di prova — combattimento";
    document.body.classList.add("prova");
    const sel = (id, opz, val) => { const x = el("select", { id }); opz.forEach(([v, t]) => x.append(el("option", { value: v, text: t }))); x.value = String(val); return x; };
    const num = (id, val, min, max) => el("input", { id, type: "number", value: val, min, max });
    const campo = (et, c) => el("label", { class: "campo" }, el("span", { text: et }), c);
    const chk = (id, et, on) => { const c = el("input", { id, type: "checkbox" }); c.checked = !!on; return el("label", { class: "campo chk" }, c, el("span", { text: et })); };
    const app = el("div", { class: "sala" },
      el("header", {}, el("h1", { text: "Sala di prova — combattimento" }), el("a", { href: "tutorial.html", text: "Torna al tutorial" })),
      el("section", { class: "pannello" }, el("h2", { text: "Personaggio" }),
        campo("Classe", sel("pClasse", [["guerriero", "Guerriero (tecniche e furia)"], ["arcanista", "Arcanista (incantesimi, Sigilli e mana)"], ["monaco", "Monaco (Vita e Negromanzia, Bilancia e punti fede)"], ["sciamano", "Sciamano (natura, veleni e trappole)"]], "guerriero")), campo("Mente (Arcanista) o Spirito (Monaco, Sciamano)", num("pMen", 16, 8, 20)),
        campo("Livello", sel("pLiv", [1, 2, 3, 4, 5].map(n => [n, n]), 1)), campo("Vigore", num("pVig", 16, 8, 20)), campo("Agilità", num("pAgi", 12, 8, 20)),
        campo("Classe armatura", num("pCa", 14, 8, 25)), campo("Salute (vuoto = calcolata)", num("pPv", "", 1, 200)), campo("Intuizione (bonus, per smascherare la finta di Enea)", num("pInt", 0, -5, 15)),
        campo("Arma", sel("pArma", ARMI.map((a, i) => [i, `${a.nome} · 1d${a.dado} ${a.tipo.toLowerCase()}`]), 0)), chk("pScudo", "Scudo imbracciato"),
        campo("Via di prestigio (dal livello 3)", sel("pVia", [["", "nessuna"], ["aldo", "Aldo — Lama del Guardiano (Arcanista: Frattura · Monaco: Cenere)"], ["guendalina", "Guendalina — Veglia (Arcanista: Sutura · Monaco: Brace)"]], "")),
        campo("Serie della via (si sceglie al riposo)", sel("pSerie", [["arma", "dell'arma"], ["scudo", "dello scudo"]], "arma")),
        chk("pIgnora", "Ignora i posti (usa qualsiasi tecnica sbloccata)", true),
        el("h2", { text: "Nemico" }),
        campo("Tipo", sel("nTipo", Object.entries(NEMICI).map(([k, d]) => [k, d.nome]), "mastino")), chk("nBoss", "Trattalo come boss"),
        campo("Salute (vuoto = tirata)", num("nPv", "", 1, 300)), campo("Classe armatura (vuoto = sua)", num("nCa", "", 5, 25)),
        chk("nFermaglio", "Enea: fermaglio di bronzo indossato (arma da subito)", true), chk("nSpada", "Enea: spada del Retaggio impugnata (sdegno, arma da subito)"), chk("nSocialita", "Enea: Socialità riuscita con la spada (niente sdegno)"),
        campo("Enea: mossa", sel("nEneaMossa", [["casuale", "casuale"], ["carica", "carica sempre quando può"], ["finta", "finta sempre quando può"], ["spinta", "Spinta sempre a mani nude"]], "casuale")),
        campo("Enea: lato dell'arma", sel("nEneaLato", [["casuale", "casuale"], ["maglio", "sempre il maglio"], ["ascia", "sempre l'ascia"]], "casuale")),
        chk("nResiste", "Resiste al veleno (come Dafne e il sovrano)"), chk("nSoffio", "Forza il Soffio quando è carico"), chk("nMorso", "Il mastino morde sempre"), chk("nPresa", "Forza la Presa dopo un morso"),
        el("div", { class: "azioni" }, el("button", { type: "button", id: "svNuovo", class: "primario", onclick: nuovoScontro }, "Nuovo scontro"), el("button", { type: "button", id: "svRiposa", onclick: riposa }, "Riposa")),
        el("h2", { text: "Dadi truccati" }),
        el("p", { class: "nota", text: "Valori separati da virgole, usati in ordine dai prossimi tiri (d20, dadi di danno, tiri salvezza, ricarica…)." }),
        el("div", { class: "azioni" }, el("input", { id: "svCoda", type: "text", placeholder: "es. 20, 6, 3" }), el("button", { type: "button", id: "svAccoda", onclick: () => { $("svCoda").value.split(/[ ,;]+/).map(Number).filter(n => n > 0).forEach(n => coda.push(n)); $("svCoda").value = ""; mostraCoda(); } }, "Accoda"), el("button", { type: "button", onclick: () => { coda.length = 0; mostraCoda(); } }, "Svuota")),
        el("p", { class: "nota", id: "svCodaVis" })),
      el("section", { class: "centro" },
        el("div", { class: "azioni" }, el("button", { type: "button", id: "svAttacca", class: "primario", onclick: attaccoNormale }, "Attacco normale"), el("button", { type: "button", id: "svDifendo", onclick: difendoEnea, hidden: true }, "Mi difendo"), el("button", { type: "button", id: "svOsserva", onclick: osservaEnea, hidden: true }, "Osservo Enea (Intuizione)")),
        el("div", { id: "svLog", class: "log", "aria-live": "polite" }),
        el("h2", { text: "Test automatici" }), el("div", { class: "azioni" }, el("button", { type: "button", id: "svTestBtn", onclick: eseguiTest }, "Esegui i test")), el("div", { id: "svTest" })),
      el("section", { class: "pannello" }, el("h2", { text: "Tu" }), el("dl", { id: "svPg" }), el("h2", { text: "Nemico" }), el("dl", { id: "svNem" }),
        el("h2", { text: "Tecniche" }), el("p", { class: "nota", id: "svPosti" }), el("div", { id: "svTec" })));
    document.body.replaceChildren(app);
    ["pClasse", "pMen", "pLiv", "pVig", "pAgi", "pCa", "pPv", "pArma", "pScudo", "pVia", "pSerie", "pIgnora"].forEach(id => $(id).addEventListener("change", () => {
      const vecchio = pg; pg = leggiPg();
      if (vecchio && s && !finito) { pg.pv = Math.min(vecchio.pv, pg.pvMax); pg.furia = Math.min(vecchio.furia, pg.furiaMax); log("Personaggio cambiato a scontro in corso: valido dal prossimo tiro.", "sis"); }
      [...preparate].forEach(id => { const t = TEC.find(x => x.id === id); if (!t || t.liv > pg.liv) preparate.delete(id); });
      disegna();
    }));
    mostraCoda(); pg = leggiPg(); disegna();
  }
  /* ---------- test.html: metà alta Personaggio | Nemico, metà bassa azioni e diario ---------- */
  const NOME_RIS = { furia: "Punti furia", natura: "Punti natura", mana: "Mana", fede: "Punti fede" };
  function barra(id, v, max) {
    const b = $(id); if (!b) return;
    const pc = max > 0 ? Math.max(0, Math.min(100, Math.round(v / max * 100))) : 0;
    b.querySelector(".riemp").style.width = pc + "%";
    b.querySelector(".val").textContent = max > 0 ? `${v} / ${max}` : "—";
    b.dataset.livello = pc > 50 ? "alta" : pc > 25 ? "media" : "bassa";
  }
  function barreTest() {
    const st = pg.pv != null ? pg : { ...pg, pv: pg.pvMax, furia: pg.furiaMax };
    barra("bPgPv", st.pv, pg.pvMax);
    const r = risorsa(); barra("bPgRis", st.furia, pg.furiaMax); $("bPgRis").dataset.risorsa = r; $("lPgRis").textContent = NOME_RIS[r];
    if (nem && s) { barra("bNemPv", Math.max(0, s.pv), s.pvMax); } else barra("bNemPv", 0, 0);
    const pa = nem && s && nem.enea; $("rNemPa").hidden = !pa; if (pa) barra("bNemPa", s.pa, nem.pa);
    [["pVig", "mVig"], ["pAgi", "mAgi"], ["pMente", "mMente"], ["pSpi", "mSpi"], ["nVig", "mnVig"], ["nAgi", "mnAgi"], ["nMen", "mnMen"], ["nSpi", "mnSpi"]].forEach(([i, m]) => { if ($(i) && $(m)) $(m).textContent = fmt(mod($(i).value)); });
    const t = $("tTurno");
    t.textContent = !nem ? "Nessuno scontro: premi «Nuovo scontro»" : finito ? "Scontro finito" : turnoPg ? `Turno ${nTurno} · tocca a te` : "Turno del nemico";
    t.dataset.stato = !nem || finito ? "fermo" : turnoPg ? "mio" : "nem";
  }
  function costruisciTest() {
    const P = window.PresetTest;
    document.title = "Pagina di test — Il Trono di Cenere";
    document.body.classList.add("test");
    const sel = (id, opz, val) => { const x = el("select", { id }); opz.forEach(([v, t]) => x.append(el("option", { value: v, text: t }))); x.value = String(val); return x; };
    const num = (id, val, min, max) => el("input", { id, type: "number", value: val, min, max });
    const campo = (et, c, cls) => el("label", { class: "campo" + (cls ? " " + cls : "") }, el("span", { text: et }), c);
    const chk = (id, et, on) => { const c = el("input", { id, type: "checkbox" }); c.checked = !!on; return el("label", { class: "campo chk" }, c, el("span", { text: et })); };
    const attr = (id, et, val, idMod, nota) => el("div", { class: "attr" }, el("span", { class: "nome-attr", text: et }), num(id, val, 1, 30), el("span", { class: "mod", id: idMod }), nota ? el("small", { text: nota }) : null);
    const gruppo = (titolo, ...figli) => el("div", { class: "gruppo" }, el("h3", { text: titolo }), ...figli);
    const barraEl = (id, et, idEt) => el("div", { class: "riga-barra", id: "r" + id.slice(1) }, el("span", { class: "et", id: idEt || null, text: et }), el("div", { class: "barra", id }, el("span", { class: "riemp" }), el("span", { class: "val" })));

    const lato = (cls, titolo, sotto, preset, ...figli) => el("section", { class: "lato " + cls },
      el("div", { class: "testa" }, el("h2", { text: titolo }), el("span", { class: "sotto", id: sotto }), el("button", { type: "button", class: "mini", onclick: preset, title: "Rimette i valori di default" }, "Ripristina preset")),
      ...figli);

    const cardPg = lato("pg", "Personaggio", "tPgSotto", () => { applicaPresetPg(true); aggiornaPg(); },
      el("div", { class: "stato" }, el("h3", { text: "In scontro" }), barraEl("bPgPv", "Salute"), barraEl("bPgRis", "Risorsa", "lPgRis"), el("dl", { id: "svPg" })),
      el("div", { class: "griglia" },
        gruppo("Classe e livello",
          campo("Classe", sel("pClasse", [["guerriero", "Guerriero"], ["sciamano", "Sciamano"], ["arcanista", "Arcanista"], ["monaco", "Monaco"]], "guerriero")),
          campo("Livello", sel("pLiv", [1, 2, 3, 4, 5].map(n => [n, n]), 1)),
          campo("Razza", sel("pRazza", P.RAZZE.map(r => [r, r]), "Umano")),
          el("p", { class: "nota", id: "tRazza" })),
        gruppo("Statistiche",
          el("div", { class: "attrs" }, attr("pVig", "Vigore", 16, "mVig"), attr("pAgi", "Agilità", 13, "mAgi"), attr("pMente", "Mente", 10, "mMente"), attr("pSpi", "Spirito", 12, "mSpi"))),
        gruppo("Arma e difesa",
          campo("Arma", sel("pArma", ARMI.map((a, i) => [i, `${a.nome} · 1d${a.dado} ${a.tipo.toLowerCase()}`]), 0)),
          campo("Scudo", el("span", { class: "sino" }, chk("pScudo", "sì, imbracciato", true))),
          campo("Armatura", sel("pArmatura", Object.entries(P.ARMATURE).map(([k, a]) => [k, a.nome + (a.ca ? ` (+${a.ca})` : "")]), "pesante")),
          campo("Classe armatura", num("pCa", 15, 5, 30)),
          campo("Salute massima", num("pPv", 23, 1, 300))),
        gruppo("Opzioni di prova",
          campo("Intuizione (bonus)", num("pInt", 1, -5, 15)),
          campo("Via di prestigio (liv. 3+)", sel("pVia", [["", "nessuna"], ["aldo", "Aldo"], ["guendalina", "Guendalina"]], "")),
          campo("Serie della via (Guerriero con scudo)", sel("pSerie", [["arma", "dell'arma"], ["scudo", "dello scudo"]], "arma")),
          el("div", { id: "rScuola" }, campo("Scuola preferita (preparazione automatica)", sel("pScuola", [["arcano", "Arcano"], ["forza", "Forza"]], "forza"))))));

    const cardNem = lato("nem", "Nemico", "tNemSotto", () => { applicaPresetNem(); aggiornaPg(); },
      el("div", { class: "stato" }, el("h3", { text: "In scontro" }), barraEl("bNemPv", "Salute"), barraEl("bNemPa", "Punti abilità"), el("dl", { id: "svNem" })),
      el("div", { class: "griglia" },
        gruppo("Tipo e livello",
          campo("Tipo", sel("nTipo", Object.entries(NEMICI).map(([k, d]) => [k, d.nome]), "mastino")),
          campo("Livello", num("nLiv", 1, 1, 10)),
          campo("Classe", el("span", { class: "fisso", id: "tNemClasse" })),
          chk("nBoss", "Trattalo come boss")),
        gruppo("Statistiche",
          el("div", { class: "attrs" }, attr("nVig", "Vigore", 12, "mnVig"), attr("nAgi", "Agilità", 12, "mnAgi"), attr("nMen", "Mente", 6, "mnMen", "solo scheda"), attr("nSpi", "Spirito", 10, "mnSpi", "solo scheda"))),
        gruppo("Arma e difesa",
          campo("Arma", el("span", { class: "fisso", id: "tNemArma" }), "lungo"),
          campo("Scudo", el("span", { class: "sino" }, chk("nScudo", "sì (+1 CA)", false))),
          campo("Classe armatura", num("nCa", 10, 5, 30)),
          campo("Salute massima", num("nPv", 13, 1, 300))),
        gruppo("Opzioni di prova",
          el("div", { id: "oEnea" }, chk("nFermaglio", "Fermaglio di bronzo indossato (arma da subito)", true), chk("nSpada", "Spada del Retaggio impugnata: si sceglie come arma del personaggio (sdegno)"), chk("nSocialita", "Socialità riuscita con la spada"),
            campo("Mossa", sel("nEneaMossa", [["casuale", "casuale"], ["carica", "carica sempre"], ["finta", "finta sempre"], ["spinta", "Spinta sempre (mani nude)"]], "casuale")),
            campo("Lato dell'arma", sel("nEneaLato", [["casuale", "casuale"], ["maglio", "sempre il maglio"], ["ascia", "sempre l'ascia"]], "casuale"))), /* 02/11: arma a doppia faccia */
          el("div", { id: "oMastino" }, chk("nSoffio", "Forza il Soffio quando è carico"), chk("nMorso", "Morde sempre"), chk("nPresa", "Forza la Presa dopo un morso")),
          el("p", { class: "nota", id: "tResiste" }))));

    const basso = el("div", { class: "basso" },
      el("section", { class: "comandi" },
        el("div", { class: "turno", id: "tTurno" }),
        el("div", { class: "azioni" },
          el("button", { type: "button", id: "svNuovo", class: "primario", onclick: nuovoScontro }, "Nuovo scontro"),
          el("button", { type: "button", id: "svRiposa", onclick: riposa }, "Riposa"),
          el("button", { type: "button", id: "svAttacca", class: "attacco", onclick: attaccoNormale }, "Attacco normale"),
          el("button", { type: "button", id: "svDifendo", onclick: difendoEnea, hidden: true }, "Mi difendo"),
          el("button", { type: "button", id: "svOsserva", onclick: osservaEnea, hidden: true }, "Osservo Enea (Intuizione)")),
        el("h3", { text: "Tecniche e incantesimi" }), el("p", { class: "nota", id: "svPosti" }), el("div", { id: "svTec" })),
      el("section", { class: "diario" },
        el("div", { class: "testa-diario" }, el("h3", { text: "Diario dello scontro" }),
          el("span", { class: "legenda" }, el("i", { class: "l-mia", text: "tu" }), el("i", { class: "l-nem", text: "nemico" }), el("i", { class: "l-ok", text: "esito buono" }), el("i", { class: "l-ko", text: "esito cattivo" }), el("i", { class: "l-sis", text: "sistema" }))),
        el("div", { id: "svLog", class: "log", "aria-live": "polite" }),
        el("details", {}, el("summary", { text: "Dadi truccati" }),
          el("p", { class: "nota", text: "Valori separati da virgole, usati in ordine dai prossimi tiri (d20, danni, tiri salvezza, ricarica…)." }),
          el("div", { class: "azioni" }, el("input", { id: "svCoda", type: "text", placeholder: "es. 20, 6, 3" }), el("button", { type: "button", id: "svAccoda", onclick: () => { $("svCoda").value.split(/[ ,;]+/).map(Number).filter(n => n > 0).forEach(n => coda.push(n)); $("svCoda").value = ""; mostraCoda(); } }, "Accoda"), el("button", { type: "button", onclick: () => { coda.length = 0; mostraCoda(); } }, "Svuota")),
          el("p", { class: "nota", id: "svCodaVis" })),
        el("details", {}, el("summary", { text: "Test automatici" }), el("div", { class: "azioni" }, el("button", { type: "button", id: "svTestBtn", onclick: eseguiTest }, "Esegui i test")), el("div", { id: "svTest" }))));

    const app = el("div", { class: "pagina-test" },
      el("header", {}, el("h1", { text: "Pagina di test" }), el("span", { class: "nota", text: "Preset fissi per classe e livello (js/preset_test.js) · non tocca i salvataggi" }), el("a", { href: "index.html", text: "Torna alla home" })),
      el("div", { class: "alto" }, cardPg, cardNem), basso);
    document.body.replaceChildren(app);

    /* preset: classe → tutto; livello o Vigore → salute; armatura, Agilità o scudo → CA */
    function applicaPresetPg(tutto) {
      const x = P.pg($("pClasse").value, Number($("pLiv").value), $("pRazza").value);
      $("tRazza").textContent = `Bonus di razza: ${P.testoBonus(x.razza, x.classe)}`;
      if (tutto) { $("pVig").value = x.vig; $("pAgi").value = x.agi; $("pMente").value = x.men; $("pSpi").value = x.spi; $("pArma").value = x.arma; $("pScudo").checked = x.scudo; $("pArmatura").value = x.armatura; $("pInt").value = x.intuizione; }
      ricalcolaPv(); ricalcolaCa();
    }
    const ricalcolaPv = () => {
      const b = P.PG[$("pClasse").value], liv = Number($("pLiv").value);
      $("pPv").value = P.salute(b.dado, $("pVig").value, liv);
      $("tPgSotto").textContent = `${$("pRazza").value} ${b.nome} · livello ${liv} · d${b.dado} · ${b.risorsa}`;
    };
    const ricalcolaCa = () => { $("pCa").value = P.ca($("pArmatura").value, $("pAgi").value, $("pScudo").checked); };
    function applicaPresetNem() {
      const k = $("nTipo").value, x = P.NEMICI[k];
      $("nLiv").value = x.liv; $("nVig").value = x.vig; $("nAgi").value = x.agi; $("nMen").value = x.men; $("nSpi").value = x.spi; $("nCa").value = x.ca; $("nPv").value = x.pv; $("nScudo").checked = x.scudo;
      $("nBoss").checked = !!NEMICI[k].boss; $("tNemClasse").textContent = x.classe; $("tNemArma").textContent = x.arma;
      $("oEnea").hidden = k !== "enea"; $("oMastino").hidden = k !== "mastino";
      $("tNemSotto").textContent = `${NEMICI[k].nome.replace(/ \(.*\)/, "")} · livello ${x.liv}${NEMICI[k].vuln ? " · vulnerabile a " + NEMICI[k].vuln.join(", ").toLowerCase() : ""}`;
    }
    /* 03/11: limiti di classe sull'equipaggiamento e preparazione predefinita, come in creazione e in gioco */
    function applicaLimiti() {
      const cl = $("pClasse").value;
      [...$("pArma").options].forEach(o => { o.disabled = !armaOk(cl, Number(o.value)); });
      if (!armaOk(cl, Number($("pArma").value))) $("pArma").value = String([0, 2, 4].find(i => armaOk(cl, i)));
      [...$("pArmatura").options].forEach(o => { o.disabled = !ARMATURE_OK[cl].includes(o.value); });
      if (!ARMATURE_OK[cl].includes($("pArmatura").value)) $("pArmatura").value = ARMATURE_OK[cl][ARMATURE_OK[cl].length - 1];
      const ret = !!ARMI[Number($("pArma").value)].retaggio;
      $("nSpada").checked = ret; $("nSpada").disabled = true; /* la spada si impugna scegliendola come arma */
      const N = NEMICI[$("nTipo").value] || {}, res = (N.resiste || []).includes("veleno");
      $("tResiste").textContent = res ? "Resiste al veleno: il veleno dello Sciamano fa metà danni." : "";
      const dueMani = ARMI[Number($("pArma").value)].mani === 2;
      $("pScudo").disabled = dueMani; if (dueMani) $("pScudo").checked = false;
      const inc = cl === "arcanista" || cl === "monaco";
      $("rScuola").hidden = !inc;
      if (inc) {
        const sc = cl === "monaco" ? ["luce", "ombra"] : ["arcano", "forza"], NS = { arcano: "Arcano", forza: "Forza", luce: "Vita", ombra: "Negromanzia" };
        if (!sc.includes($("pScuola").value)) { $("pScuola").replaceChildren(...sc.map(k => el("option", { value: k, text: NS[k] }))); $("pScuola").value = (P.PG[cl] && P.PG[cl].scuola) || sc[0]; }
      }
      $("pSerie").disabled = !(cl === "guerriero" && $("pScudo").checked && Number($("pLiv").value) >= 3); if ($("pSerie").disabled) $("pSerie").value = "arma"; /* la serie dello scudo esiste solo per il Guerriero con lo scudo */
      ricalcolaCa();
    }
    function preparaPredefiniti(casuale) {
      const mescola = (a) => casuale ? a.map(x => [Math.random(), x]).sort((x, y) => x[0] - y[0]).map(x => x[1]) : a;
      preparate.clear(); preparatiInc.clear();
      if (!pg) return;
      if (arcanista()) {
        const princ = scuolaPrinc(), altra = SCUOLE().find(x => x !== princ), sb = (sc) => mescola(MG.INCANTESIMI.filter(i => i.scuola === sc && i.liv <= pg.liv).sort((a, b) => casuale ? 0 : b.liv - a.liv));
        if (casuale === "combo" && window.PREP_MISTO) { /* 04/11: giocatore «misto» — scuole libere: alterna gli incantesimi che fanno danno delle due scuole, poi una difesa */
          const danno = (i) => /\dd\d/.test(i.effetto.it) && !/[Cc]ura|ti curi/.test(i.effetto.it), tot = postiPrincInc(pg.liv) + 1;
          const per = (sc) => MG.INCANTESIMI.filter(i => i.scuola === sc && i.liv <= pg.liv && danno(i)).sort((a, b) => b.liv - a.liv || Math.random() - 0.5);
          const a1 = per(princ), a2 = per(altra), dif = MG.INCANTESIMI.filter(i => SCUOLE().includes(i.scuola) && i.liv <= pg.liv && M.DIFESE.includes(i.id)).sort((a, b) => a.costo - b.costo)[0];
          const lista = []; for (let k = 0; lista.length < tot - (dif && tot > 3 ? 1 : 0) && (a1[k] || a2[k]); k++) { if (a1[k]) lista.push(a1[k]); if (a2[k]) lista.push(a2[k]); }
          lista.slice(0, tot - (dif && tot > 3 ? 1 : 0)).forEach(i => preparatiInc.add(i.id)); if (dif && tot > 3) preparatiInc.add(dif.id);
          return;
        }
        if (casuale === "combo" && window.PREP_CONTROLLO && princ === "arcano") { /* 04/11, PROVA punto 1: Arcano puro «di controllo» — Stasi e Sigillo del Silenzio se sbloccati, poi gli incantesimi d'Arcano che fanno danno; 1 posto di Forza */
          const danno = (i) => /\dd\d/.test(i.effetto.it), tot = postiPrincInc(pg.liv);
          const ctr = MG.INCANTESIMI.filter(i => ["stasi", "sigillo_silenzio", "prigione_rune"].includes(i.id) && i.liv <= pg.liv).sort((a, b) => b.liv - a.liv).slice(0, Math.max(1, tot - 3));
          const off = MG.INCANTESIMI.filter(i => i.scuola === "arcano" && i.liv <= pg.liv && danno(i) && !ctr.includes(i)).sort((a, b) => b.liv - a.liv);
          [...ctr, ...off].slice(0, tot).forEach(i => preparatiInc.add(i.id));
          const alD = MG.INCANTESIMI.filter(i => i.scuola === altra && i.liv <= pg.liv && danno(i)).sort((a, b) => a.costo - b.costo); alD.slice(0, 1).forEach(i => preparatiInc.add(i.id));
          return;
        }
        if (casuale === "combo") { /* 03/11: come un giocatore medio — nella scuola principale gli incantesimi che fanno danno e una difesa, nell'altra il più economico che fa danno (serve alle combo) */
          const danno = (i) => /\dd\d/.test(i.effetto.it) && !/[Cc]ura|ti curi/.test(i.effetto.it), lista = MG.INCANTESIMI.filter(i => i.scuola === princ && i.liv <= pg.liv);
          const dif = lista.filter(i => M.DIFESE.includes(i.id)).sort((a, b) => a.costo - b.costo)[0];
          const off = lista.filter(i => danno(i) && i !== dif).sort((a, b) => b.liv - a.liv), resto = lista.filter(i => i !== dif && !off.includes(i)).sort((a, b) => b.liv - a.liv);
          [...off.slice(0, Math.max(1, postiPrincInc(pg.liv) - 1)), ...(dif ? [dif] : []), ...off.slice(Math.max(1, postiPrincInc(pg.liv) - 1)), ...resto].slice(0, postiPrincInc(pg.liv)).forEach(i => preparatiInc.add(i.id));
          const al = MG.INCANTESIMI.filter(i => i.scuola === altra && i.liv <= pg.liv), alD = al.filter(danno).sort((a, b) => a.costo - b.costo);
          (alD.length ? alD : al).slice(0, 1).forEach(i => preparatiInc.add(i.id));
          return;
        }
        sb(princ).slice(0, postiPrincInc(pg.liv)).forEach(i => preparatiInc.add(i.id));
        sb(altra).slice(0, 1).forEach(i => preparatiInc.add(i.id));
      } else {
        const opz = mescola(opzioni()), max = C.slotTecniche(pg.liv, scudoPosti());
        C.sceltaPredefinita(opz, pg.liv, scudoPosti()).slice(0, max).forEach(t => preparate.add(t.id));
      }
    }
    window.SalaProvaPrepara = (casuale) => { pg = leggiPg(); preparaPredefiniti(casuale); disegna(); };
    function aggiornaPg() {
      applicaLimiti();
      const vecchio = pg; pg = leggiPg();
      const chiave = [pg.classe, pg.liv, pg.arma.nome, pg.scudo, $("pScuola").value].join("|");
      if (chiave !== costruisciTest.chiave) { costruisciTest.chiave = chiave; preparaPredefiniti(false); } /* cambia la scelta: si riparte dai preparati predefiniti */
      if (vecchio && s && !finito) { pg.pv = Math.min(vecchio.pv, pg.pvMax); pg.furia = Math.min(vecchio.furia, pg.furiaMax); log("Personaggio cambiato a scontro in corso: valido dal prossimo tiro.", "sis"); }
      [...preparate].forEach(id => { const t = TEC.find(x => x.id === id); if (!t || t.liv > pg.liv) preparate.delete(id); });
      disegna();
    }
    const su = (ids, prima) => ids.forEach(id => $(id).addEventListener("change", () => { if (prima) prima(); aggiornaPg(); }));
    su(["pClasse", "pRazza"], () => applicaPresetPg(true));
    su(["pLiv", "pVig"], ricalcolaPv);
    su(["pArmatura", "pAgi", "pScudo"], ricalcolaCa);
    su(["pMente", "pSpi", "pCa", "pPv", "pArma", "pVia", "pSerie", "pInt", "pScuola"]);
    su(["nTipo"], applicaPresetNem);
    su(["nVig", "nAgi", "nMen", "nSpi", "nLiv", "nCa", "nPv", "nScudo"]);
    applicaPresetPg(true); applicaPresetNem(); aggiornaPg();
    mostraCoda(); pg = leggiPg(); disegna();
  }
  /* comandi per i test automatici del browser (Playwright): window.SalaProva */
  window.SalaProva = { accoda: (...v) => { coda.push(...v); mostraCoda(); }, stato: () => ({ pg, nem, s, turnoPg, finito, nTurno, preparate: [...preparate], perRiposo }), nuovoScontro, attaccoNormale, difendo: () => difendoEnea(), osserva: () => osservaEnea(), usa: (id) => usaTecnica(TEC.find(t => t.id === id)), incanta: (id) => usaIncantesimo(MG.INCANTESIMI.concat(MG.VIE).find(i => i.id === id)), riposa, eseguiTest };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", costruisci); else costruisci();
})();
