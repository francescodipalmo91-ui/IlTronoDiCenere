/* Test nel browser del bilanciamento del 28/10/2026: stati comuni, elisir, abilità dei nemici a punti, fauna con statistiche fisse,
   PE a scalare, fuga, morte e modalità, Ettore al livello 2.
   Uso:  python3 -m http.server 8765 --bind 127.0.0.1   (dalla cartella del gioco, in un altro terminale)
         node tests/bilanciamento.browser.js           (serve Playwright: npm i -g playwright) */
const { chromium } = require("playwright");
const BASE = process.env.BASE || "http://127.0.0.1:8765/";
const casi = [];
const caso = (nome, fn) => casi.push({ nome, fn });
const eq = (a, b, msg) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${msg || "atteso"}: ${JSON.stringify(b)}, ottenuto ${JSON.stringify(a)}`); };
const vero = (x, msg) => { if (!x) throw new Error(msg || "atteso vero"); };

const PG = (o) => Object.assign({
  nome: "Prova", razza: "Umano", classe: "Soldato", livello: 1, immagine: null,
  statisticheBase: { Vigore: 16, "Agilità": 12, Mente: 10, Spirito: 12 }, statistiche: { Vigore: 16, "Agilità": 12, Mente: 10, Spirito: 12 },
  modificatori: { Vigore: 3, "Agilità": 1, Mente: 0, Spirito: 1 }, tiroDado: { dado: 10, valore: 10 }, puntiVita: 23, saluteMentale: 21,
  classeArmatura: 14, mana: null, risorsa: { id: "ira", max: 13 }, incantesimi: [], tecniche: ["polso", "morso_acciaio"],
  abilita: [{ nome: "Atletica", attributo: "Vigore", valore: 4 }],
  equipaggiamento: { arma: "Spada corta", armaDanno: "1d6", armaTipoDanno: "Tagliente", armaMani: 1, armatura: "Armatura media", armaturaCA: 4, malusAgilita: 0, scudo: null, dotazione: [] }
}, o || {});
const PARTITA = (o) => Object.assign({ usate: { riposo: "sbloccato" }, diario: [], luogo: "cucina", livello: 1, crescita: { salute: 0, mente: 0, risorsa: 0 }, risorsaUsata: 0, esperienza: 0, ora: Date.now() }, o || {});

async function apri(browser, url, pg, partita) {
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  const errori = [];
  page.on("pageerror", e => errori.push(e.message));
  page.on("console", m => { if (m.type() === "error" && !/Failed to load resource|ERR_|net::|firebase|gstatic|googleapis/i.test(m.text())) errori.push(m.text()); });
  await ctx.route(/^(?!http:\/\/127\.0\.0\.1)/, r => r.abort());
  page.on("dialog", d => d.accept());
  await page.addInitScript(([pg, partita]) => {
    if (!sessionStorage.getItem("inizializzato")) {
      sessionStorage.setItem("inizializzato", "1"); localStorage.clear();
      if (pg) localStorage.setItem("personaggio", JSON.stringify(pg));
      if (partita) localStorage.setItem("partita", JSON.stringify(partita));
    }
    const orig = Math.random, q = [], c = [];
    window.__coda = q; window.__caso = c;
    Math.random = () => {
      const chi = (new Error().stack.split("\n")[2] || "");
      if (/\btira\b/.test(chi)) return q.length ? q.shift() : orig();
      if (/\b(pesca|scegli)\b/.test(chi)) return orig();
      return c.length ? c.shift() : orig();
    };
  }, [pg, partita]);
  await page.goto(BASE + url);
  await page.waitForLoadState("networkidle").catch(() => {});
  return { page, errori, chiudi: () => ctx.close() };
}
const R = (v, d) => (v - 1) / d + 0.5 / d;
const accoda = (page, dadi, caso) => page.evaluate(([d, c]) => { window.__coda.push(...d); window.__caso.push(...(c || [])); }, [dadi, caso]);
const aspettaTurnoPg = (page) => page.waitForFunction(() => typeof scontro !== "undefined" && scontro && scontro.tuoTurno, null, { timeout: 15000 });
const diario = (page) => page.evaluate(() => document.getElementById("diario").textContent);

caso("Regole: soglie 300/1000/2400/4400 e crescita fissa (metà del dado + 1 + mod)", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG(), PARTITA());
  eq(await page.evaluate(() => Regole.SOGLIE_PE), [0, 300, 1000, 2400, 4400]);
  eq(await page.evaluate(() => [Regole.CRESCITA_FISSA(10, 3), Regole.CRESCITA_FISSA(8, 1), Regole.CRESCITA_FISSA(6, 0)]), [9, 6, 4]);
  const prima = await page.evaluate(() => saluteMaxPg());
  await page.evaluate(() => { guadagnaPE(300); controllaLivello(); });
  eq(await page.evaluate(() => [livelloPg(), saluteMaxPg()]), [2, prima + 9], "Guerriero Vigore 16: +6 + 3");
  eq(errori, [], "errori"); await chiudi();
});
caso("Creazione: il dado vita vale il massimo e si sceglie la modalità", async (b) => {
  const { page, errori, chiudi } = await apri(b, "creazione.html");
  vero(await page.$('input[name="modalita"][value="difficile"]'), "manca la scelta della modalità");
  eq(await page.isHidden("#lancia"), true, "il bottone del tiro non serve più");
  eq(errori, [], "errori"); await chiudi();
});
caso("Mastino della cantina: statistiche fisse (13 salute, 3 PA, Vigore 12) e Soffio 1d6 con CD 11", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG(), PARTITA());
  await page.evaluate(() => avviaScontro("mastino", { primo: "pg" })); await aspettaTurnoPg(page);
  eq(await page.evaluate(() => [scontro.pvMax, scontro.paMax, scontro.stat.Vigore, NEMICI.mastino.soffio.cd, NEMICI.mastino.soffio.dadi]), [13, 3, 12, 11, 1]);
  eq(errori, [], "errori"); await chiudi();
});
caso("Ettore: Vigore 12, attacco +3, danno 1d6 + 3", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG({ livello: 2 }), PARTITA({ livello: 2 }));
  await page.evaluate(() => avviaScontro("esploratore", { ctx: "ettore", primo: "pg" })); await aspettaTurnoPg(page);
  eq(await page.evaluate(() => [scontro.stat.Vigore, mod(scontro.stat.Vigore) + NEMICI.esploratore.attacco, NEMICI.esploratore.dannoBonus, scontro.pvMax, scontro.paMax]), [12, 3, 3, 30, 8]);
  eq(errori, [], "errori"); await chiudi();
});
caso("Stati: Sanguinamento 1d4 per 3 turni, letale; i malus durano 2 turni; tutto finisce con lo scontro", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG(), PARTITA());
  await page.evaluate(() => avviaScontro("lupo_comune", { ctx: "fuori", primo: "nem" }));
  await page.evaluate(() => { const r = []; applicaStatoPg("sangue", r); applicaStatoPg("debole", r); });
  eq(await page.evaluate(() => usate.stati_pg), { sangue: 3, debole: 2 });
  await page.evaluate(() => { tickStatiPg(); fineTurnoPgStati(); });
  eq(await page.evaluate(() => usate.stati_pg), { sangue: 2, debole: 1 });
  await page.evaluate(() => { chiudiScontro("fuggito"); });
  eq(await page.evaluate(() => Object.keys(usate.stati_pg).length), 0, "finiti con lo scontro");
  eq(errori, [], "errori"); await chiudi();
});
caso("Stati letali: un Ustionato a inizio turno può uccidere (morte, modalità facile)", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG(), PARTITA());
  await page.evaluate(() => avviaScontro("lupo_comune", { ctx: "fuori", primo: "nem" }));
  await page.waitForFunction(() => scontro && !scontro.tuoTurno, null, { timeout: 15000 });
  await page.evaluate(() => { usate.stati_pg = { ustione: 3 }; usate.stati_dado = { ustione: 4 }; pg.dannoFisico = pvMaxPg() - 1; });
  await accoda(page, [R(4, 4)]);
  await page.evaluate(() => { scontro.tuoTurno = false; turnoPgScontro(); });
  await page.waitForFunction(() => finePartita === true, null, { timeout: 15000 });
  vero(/parte di Casa Vespera/.test(await diario(page)), "manca la schermata di morte");
  vero(/ultimo salvataggio/.test(await page.innerText("body")), "in facile si riparte dal salvataggio");
  eq(errori, [], "errori"); await chiudi();
});
caso("Morte in modalità difficile: il personaggio e il salvataggio si cancellano", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG({ modalita: "difficile" }), PARTITA());
  await page.evaluate(() => morteCasa());
  eq(await page.evaluate(() => [localStorage.getItem("personaggio"), localStorage.getItem("partita")]), [null, null]);
  vero(/permanente/.test(await diario(page)), "manca l'avviso della morte permanente");
  eq(errori, [], "errori"); await chiudi();
});
caso("Elisir comuni e rari (29/10): il comune cura soltanto; il raro, bevuto prima, rende immuni per tutto lo scontro; il nemico spreca il primo tentativo", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG(), PARTITA());
  await page.evaluate(() => { zaino.push({ id: "balsamo", nome: "Balsamo", tipo: "consumabile", usi: 1, effetto: "cura_ustione" }, { id: "balsamo_conc", nome: "Balsamo di brace", tipo: "consumabile", usi: 1, effetto: "conc_ustione" }); });
  const c = await page.evaluate(() => effettoBevanda(zaino.find(x => x.id === "balsamo")));
  vero(c.no, "il comune senza lo stato non serve");
  const r = await page.evaluate(() => effettoBevanda(zaino.find(x => x.id === "balsamo_conc")));
  vero(r.ok && /prossimo scontro/.test(r.ok), "testo della protezione");
  eq(await page.evaluate(() => usate.protezione), { stato: "ustione" });
  await page.evaluate(() => avviaScontro("mastino", { primo: "nem" }));
  eq(await page.evaluate(() => { const r = []; return applicaStatoPg("ustione", r); }), false, "non attecchisce");
  eq(await page.evaluate(() => [statoInutile("ustione"), haStato("ustione")]), [true, false]);
  await page.evaluate(() => chiudiScontro("vinto"));
  eq(await page.evaluate(() => usate.protezione), null, "consumata a fine scontro");
  eq(errori, [], "errori"); await chiudi();
});
caso("Elisir raro durante lo scontro: cura e rende immuni per tutto lo scontro; ricetta con la sola parte infernale; borsa a 2 per stato", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG(), PARTITA());
  await page.evaluate(() => avviaScontro("mastino", { primo: "nem" }));
  await page.evaluate(() => { const r = []; applicaStatoPg("ustione", r); zaino.push({ id: "balsamo_conc", nome: "Raro", tipo: "consumabile", usi: 1, effetto: "conc_ustione" }); });
  await page.evaluate(() => effettoBevanda(zaino.find(x => x.id === "balsamo_conc")));
  eq(await page.evaluate(() => [haStato("ustione"), protettoDa("ustione")]), [false, true]);
  eq(await page.evaluate(() => RICETTE_ANIMALI.find(r => r.id === "balsamo_conc").richiede), { grasso_brace: 1 });
  await page.evaluate(() => { zaino.push({ id: "balsamo", nome: "B", tipo: "consumabile", usi: 2, effetto: "cura_ustione" }); });
  eq(await page.evaluate(() => borsaPienaPer(RICETTE_ANIMALI.find(r => r.id === "balsamo"))), true, "2 per stato");
  eq(errori, [], "errori"); await chiudi();
});
caso("Erbe: la ricerca nel sottobosco dà prima le due erbe nuove", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG(), PARTITA());
  await page.evaluate(() => { raccogliErba(); raccogliErba(); });
  eq(await page.evaluate(() => [qtaMateriale("achillea"), qtaMateriale("eufrasia")]), [1, 1]);
  eq(errori, [], "errori"); await chiudi();
});
caso("Ratto di cenere: la Nube di cenere costa 2 punti e acceca chi fallisce il tiro salvezza", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG(), PARTITA());
  await page.evaluate(() => avviaScontro("ratto", { ctx: "fuori", primo: "pg" })); await aspettaTurnoPg(page);
  eq(await page.evaluate(() => [scontro.pvMax, scontro.paMax]), [8, 3]);
  await accoda(page, [R(2, 20)]);
  await page.evaluate(() => { scontro.tuoTurno = false; turnoNemScontro(); });
  await page.waitForFunction(() => haStato("cieco"), null, { timeout: 15000 });
  eq(await page.evaluate(() => scontro.pa), 1, "3 − 2");
  eq(errori, [], "errori"); await chiudi();
});
caso("Accecato: il tuo attacco tira due d20 e tiene il peggiore", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG(), PARTITA());
  await page.evaluate(() => avviaScontro("lupo_comune", { ctx: "fuori", primo: "pg" })); await aspettaTurnoPg(page);
  await page.evaluate(() => { usate.stati_pg = { cieco: 2 }; });
  await accoda(page, [R(19, 20), R(3, 20)]);
  await page.evaluate(() => attaccoPgScontro(false));
  vero(/tieni il peggiore: 19 e 3/.test(await diario(page)), "manca il tiro con svantaggio");
  eq(errori, [], "errori"); await chiudi();
});
caso("PE a scalare: animali pieni fino al livello 2, metà al 3, niente al 4; infernali un livello dopo", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG({ livello: 3 }), PARTITA({ livello: 3 }));
  eq(await page.evaluate(() => [xpScontro(NEMICI.lupo_comune, "fuori"), xpScontro(NEMICI.ratto, "fuori"), xpScontro(NEMICI.ratto, "caccia")]), [38, 75, 100]);
  eq(errori, [], "errori"); await chiudi();
});
caso("Fuga: riuscita, si torna nella stanza di prima; contro un guardiano non si fugge", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG(), PARTITA({ luogo: "cimitero", usate: { riposo: "sbloccato", luogo_prec: "cappella" } }));
  await page.evaluate(() => avviaScontro("lupo_comune", { ctx: "fuori", primo: "pg" })); await aspettaTurnoPg(page);
  await accoda(page, [R(20, 20)]);
  await page.evaluate(() => fugaScontro());
  await page.waitForFunction(() => !scontro && luogo === "cappella", null, { timeout: 15000 });
  await page.evaluate(() => avviaScontro("esploratore", { ctx: "ettore", primo: "pg" })); await aspettaTurnoPg(page);
  await page.evaluate(() => fugaScontro());
  vero(await page.evaluate(() => !!scontro), "da Ettore non si fugge");
  eq(errori, [], "errori"); await chiudi();
});
caso("Zone: fuori casa ratto, corvo, lupo e i doppi infernali; foresta lupo, cinghiale, cervo, vipera; niente coniglio", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG(), PARTITA());
  eq(await page.evaluate(() => ANIMALI_IDS("fuori").sort()), ["corvo_comune", "lupo_comune", "ratto_comune"]);
  eq(await page.evaluate(() => ANIMALI_IDS("foresta").sort()), ["cervo", "cinghiale_bosco", "lupo_comune", "vipera"]);
  eq(await page.evaluate(() => INFERNALI_IDS("fuori").sort()), ["corvo", "lupo", "ratto"]);
  eq(await page.evaluate(() => INFERNALI_IDS("foresta").sort()), ["cervo_cenere", "cinghiale", "lupo", "vipera_brace"]);
  eq(errori, [], "errori"); await chiudi();
});
caso("29/10: foresta con immagine e testo nuovi; cripta con Ettore e senza", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG(), PARTITA());
  eq(await page.evaluate(() => [vista("pineta").img.src, TX.stanze.pineta.intro.length]), ["immagini/house/foresta_pini.webp", 3]);
  eq(await page.evaluate(() => { usate.ettore = "scontro"; const a = vista("cripta").img.src; usate.ettore = "morto"; return [a, vista("cripta").img.src]; }), ["immagini/house/cripta_ettore.webp", "immagini/house/cripta.webp"]);
  eq(errori, [], "errori"); await chiudi();
});
caso("29/10: la vulnerabilità alla forza vale anche per la Spinta (senza tiro), solo sul dado base", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG(), PARTITA());
  const r = await page.evaluate(() => { const C = window.MagiaCombattimento, inc = MAGIA.INCANTESIMI.find(i => i.id === "spinta"), s = { pv: 50, pvMax: 50, eff: {}, effMax: {} };
    const q = [4, 5, 20]; const ctx = { tira: (d) => q.shift() || 1, liv: 1, modAtt: 3, modDanno: 3, boss: true, cd: 12, modTs: 0, ca: () => 10, piuDadiVuln: 1, manaPiu: () => 0, dannoMente: (n) => n };
    C.lancia(inc, s, ctx); return s.pv; });
  eq(r, 50 - 4 - 5, "2d6 invece di 1d6");
  eq(errori, [], "errori"); await chiudi();
});
caso("29/10: Ettore attaccato a sorpresa perde il primo turno a recuperare la spada; vulnerabile a luce e contundente", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG({ livello: 2 }), PARTITA({ livello: 2, luogo: "cripta", usate: { riposo: "sbloccato", ettore: "incontrato", ettore_sorpreso: true, ettore_disarmato: true } }));
  await page.evaluate(() => { luogo = "cripta"; avviaScontroEttore(); }); await aspettaTurnoPg(page);
  eq(await page.evaluate(() => [scontro.disarmato, usate.ettore_disarmato, dadiVuln("Luce"), dadiVuln("Forza")]), [true, false, 1, 0]);
  await page.evaluate(() => { scontro.tuoTurno = false; turnoNemScontro(); });
  await aspettaTurnoPg(page);
  vero(/recuperare l'arma/.test(await diario(page)), "manca il turno perso");
  eq(await page.evaluate(() => [scontro.disarmato, pg.dannoFisico || 0]), [false, 0], "nessun attacco nel turno perso");
  eq(errori, [], "errori"); await chiudi();
});

/* ---------- 29/10: agguati ---------- */
const BRONZO = (o) => PARTITA(Object.assign({ luogo: "cimitero", usate: { riposo: "sbloccato", fermaglio: "bronzo", giorno: 1 } }, o || {}));
const clicca = async (page, re) => { await page.waitForSelector("#azioni button", { state: "visible", timeout: 10000 }); const bs = await page.$$("#azioni button"); for (const x of bs) if (re.test(await x.textContent())) return x.click(); throw new Error("manca il pulsante " + re); };
caso("Agguati: fuori casa dopo il bronzo (fermaglio indossato 45:20:35; prima del bronzo mai); al livello 2 il goblin", async (b) => {
  let { page, errori, chiudi } = await apri(b, "gioco.html", PG({ livello: 2 }), PARTITA({ livello: 2, luogo: "cimitero", usate: { riposo: "sbloccato" } }));
  await accoda(page, [], [0.1, 0.9, 0.5, 0]); await page.evaluate(() => { luogo = "cimitero"; incontroZona(false); });
  eq(await page.evaluate(() => [!!scontro, !!(scontro && NEMICI[scontro.id].agguato)]), [true, false], "prima del bronzo: un infernale");
  await chiudi();
  ({ page, errori, chiudi } = await apri(b, "gioco.html", PG({ livello: 2 }), BRONZO({ livello: 2 })));
  await accoda(page, [], [0.1, 0.9, 0.5, 0]); await page.evaluate(() => { luogo = "cimitero"; incontroZona(false); });
  eq(await page.evaluate(() => [scontro.id, scontro.ctx]), ["goblin", "agguato"]);
  eq(await page.evaluate(() => [scegliAgguato.length, NEMICI.banda_goblin.attacchi, NEMICI.banda_orchi.attacchi]), [0, 2, 2]);
  eq(errori, [], "errori"); await chiudi();
});
/* ---------- 30/10: fermaglio e armature delle rastrelliere ---------- */
caso("Fermaglio: nascosto, gli agguati scendono (55:30:15: 0,7 è un infernale, indossato sarebbe un agguato)", async (b) => {
  let { page, errori, chiudi } = await apri(b, "gioco.html", PG({ livello: 2 }), BRONZO({ livello: 2 }));
  await accoda(page, [], [0.1, 0.7, 0.5, 0]); await page.evaluate(() => { luogo = "cimitero"; incontroZona(false); });
  eq(await page.evaluate(() => scontro && scontro.ctx), "agguato", "indossato: 0,7 ≥ 0,65");
  await chiudi();
  ({ page, errori, chiudi } = await apri(b, "gioco.html", PG({ livello: 2 }), BRONZO({ livello: 2, usate: { riposo: "sbloccato", fermaglio: "bronzo", fermaglio_nascosto: true, giorno: 1 } })));
  await accoda(page, [], [0.1, 0.7, 0.5, 0]); await page.evaluate(() => { luogo = "cimitero"; incontroZona(false); });
  eq(await page.evaluate(() => [!!scontro, !!(scontro && NEMICI[scontro.id].agguato)]), [true, false], "nascosto: 0,7 < 0,85, un infernale");
  eq(errori, [], "errori"); await chiudi();
});
caso("Fermaglio: si nasconde e si appunta (comando e pulsante); il titolo sotto il ritratto segue; +2 Furtività solo indossato", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG({ livello: 2 }), BRONZO({ livello: 2, luogo: "atrio" }));
  eq(await page.evaluate(() => [!document.getElementById("fermaglio").hidden, bonusFurtivitaPedinamento()]), [true, 2], "indossato");
  vero(/Fermaglio di bronzo/.test(await page.evaluate(() => document.getElementById("equip").textContent)), "manca il fermaglio nell'equipaggiamento");
  await page.fill("#testo", "nascondo il fermaglio"); await page.press("#testo", "Enter"); await page.waitForTimeout(400);
  eq(await page.evaluate(() => [usate.fermaglio_nascosto, document.getElementById("fermaglio").hidden, bonusFurtivitaPedinamento()]), [true, true, 0], "nascosto");
  vero(/nascosto/.test(await page.evaluate(() => document.getElementById("equip").textContent)), "l'equipaggiamento deve dire che è nascosto");
  await page.evaluate(() => { [...document.querySelectorAll("#equipAzioni button")].find(x => /Appunta/.test(x.textContent)).click(); });
  eq(await page.evaluate(() => [usate.fermaglio_nascosto, document.getElementById("fermaglio").hidden]), [false, false], "appuntato col pulsante");
  await page.evaluate(() => { scontro = { finto: true }; nascondiFermaglio(); scontro = null; });
  eq(await page.evaluate(() => usate.fermaglio_nascosto), false, "in combattimento non si tocca");
  eq(errori, [], "errori"); await chiudi();
});
caso("Rastrelliere: armature +1 (+2 dalla quinta caccia comune), scudi +1, fissati alla scelta", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG({ livello: 2 }), BRONZO({ livello: 2, luogo: "sala_caccia" }));
  const prendi = (nome, fatte) => page.evaluate(([n, f]) => { usate.armeria_scelte = 1; usate.cc_fatte_lista = Array.from({ length: f }, (_, i) => "c" + i); prendiDallaRastrelliera(ARMERIA.find(o => o.nome === n && !o.sp)); const it = zaino[zaino.length - 1]; return [it.nome, it.ca, it.bonus || 0]; }, [nome, fatte]);
  eq(await prendi("Armatura media", 0), ["Armatura media", 4, 1], "dal bronzo +1");
  eq(await prendi("Armatura pesante", 4), ["Armatura pesante", 5, 1], "gradi 1-2: +1");
  eq(await prendi("Armatura leggera", 5), ["Armatura leggera", 4, 2], "grado 3: +2");
  eq(await prendi("Scudo", 5), ["Scudo", 2, 1], "scudo +1");
  eq(errori, [], "errori"); await chiudi();
});
caso("Agguati: i cinque crescono con il personaggio (salute 15 + 3 per livello oltre il 2, danno + livello, CD 8 + livello, 6 PA)", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG({ livello: 3 }), BRONZO({ livello: 3, esperienza: 1000 }));
  await page.evaluate(() => avviaAgguato("brunilde")); await page.waitForFunction(() => scontro);
  eq(await page.evaluate(() => [livelloPg(), scontro.pvMax, scontro.paMax, NEMICI.brunilde.dannoBonus, NEMICI.brunilde.abilita[0].cd, NEMICI.brunilde.livello, dadiVuln("Ombra")]), [3, 16, 6, 3, 11, 3, 1]);
  await page.evaluate(() => { chiudiScontro("fuggito"); scontro = null; avviaAgguato("isotta"); }); await page.waitForFunction(() => scontro);
  eq(await page.evaluate(() => [scontro.pvMax, NEMICI.isotta.dannoBonus, NEMICI.isotta.attacchi]), [15, 1, 2], "Isotta: due pugnali da 1d4 + metà del livello");
  vero(/Fammela vedere/.test(await diario(page)), "manca la frase dell'agguato");
  eq(errori, [], "errori"); await chiudi();
});
caso("Agguati: la resa; finirlo costa 1 punto mentale e lascia il suo pezzo (+livello) e 100 PE", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG({ livello: 2 }), BRONZO({ livello: 2, esperienza: 300 }));
  await page.evaluate(() => avviaAgguato("brunilde")); await page.waitForFunction(() => scontro);
  const m0 = await page.evaluate(() => mentaliAttuali());
  await page.evaluate(() => { scontro.pv = 5; scontro.tuoTurno = true; fineAzionePgScontro(); });
  await clicca(page, /Finisci Brunilde/);
  await page.waitForFunction(() => !scontro);
  eq(await page.evaluate(() => [mentaliAttuali(), usate.avv.brunilde.stato, pg.esperienza]), [m0 - 1, "morto", 400]);
  const ascia = await page.evaluate(() => zaino.find(x => /Mezzaluna/.test(x.nome)));
  eq([ascia.bonus, ascia.danno, ascia.mani], [2, "1d8", 2]);
  vero(/cede come un'asse marcia/.test(await diario(page)), "manca il testo della casa che reclama");
  eq(await page.evaluate(() => avvDisponibile("brunilde")), false, "morto: non torna");
  eq(errori, [], "errori"); await chiudi();
});
caso("Agguati: risparmiato una volta; torna solo dopo un riposo, +1 livello, combatte fino alla fine e non dà PE", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG({ livello: 2 }), BRONZO({ livello: 2, esperienza: 300 }));
  await page.evaluate(() => avviaAgguato("corrado")); await page.waitForFunction(() => scontro);
  await page.evaluate(() => { scontro.pv = 5; scontro.tuoTurno = true; fineAzionePgScontro(); });
  await clicca(page, /Risparmi Corrado/);
  await page.waitForFunction(() => !scontro);
  eq(await page.evaluate(() => [usate.avv.corrado.stato, pg.esperienza, avvDisponibile("corrado")]), ["risparmiato", 400, false]);
  await page.evaluate(() => { usate.giorno = 2; });
  eq(await page.evaluate(() => avvDisponibile("corrado")), true, "dopo un riposo torna");
  await page.evaluate(() => avviaAgguato("corrado")); await page.waitForFunction(() => scontro);
  eq(await page.evaluate(() => [scontro.avv.ritorno, NEMICI.corrado.livello, scontro.pvMax]), [true, 3, 18]);
  vero(/catene più pesanti/.test(await diario(page)), "manca la frase del ritorno");
  await page.evaluate(() => { scontro.pv = 3; });
  eq(await page.evaluate(() => resaPossibile()), false, "al ritorno non si arrende");
  await page.evaluate(() => { scontro.pv = 0; vittoriaScontro(); });
  eq(await page.evaluate(() => [usate.avv.corrado.stato, pg.esperienza, !!zaino.find(x => x.nome === "Scudo di Vallerossa" && x.ca === 2)]), ["morto", 400, true]);
  eq(errori, [], "errori"); await chiudi();
});
caso("Agguati: Tobia scappa invece di arrendersi; se scappa conta come risparmiato, se lo afferri scegli tu", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG({ livello: 2 }), BRONZO({ livello: 2, esperienza: 300 }));
  await page.evaluate(() => avviaAgguato("tobia")); await page.waitForFunction(() => scontro);
  await accoda(page, [R(1, 20)]); await page.evaluate(() => { scontro.pv = 4; scontro.tuoTurno = true; fineAzionePgScontro(); });
  await page.waitForFunction(() => !scontro);
  eq(await page.evaluate(() => [usate.avv.tobia.stato, pg.esperienza]), ["risparmiato", 400]);
  vero(/fruscio di ingranaggi/.test(await diario(page)), "manca la fuga di Tobia");
  await page.evaluate(() => { usate.avv = {}; avviaAgguato("tobia"); }); await page.waitForFunction(() => scontro);
  await accoda(page, [R(20, 20)]); await page.evaluate(() => { scontro.pv = 4; scontro.tuoTurno = true; fineAzionePgScontro(); });
  await clicca(page, /Finisci Tobia/);
  await page.waitForFunction(() => !scontro);
  vero(/cercava solo di scappare/.test(await diario(page)), "finire chi scappa costa la mente");
  eq(await page.evaluate(() => ["Piede di porco", "Corda e rampino"].every(n => zaino.some(x => x.nome === n))), true, "la borsa degli attrezzi");
  eq(errori, [], "errori"); await chiudi();
});
caso("Agguati: Fra' Anselmo si cura una volta sotto metà salute (Preghiera, 2 PA)", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG({ livello: 2 }), BRONZO({ livello: 2 }));
  await page.evaluate(() => avviaAgguato("anselmo")); await page.waitForFunction(() => scontro);
  await accoda(page, [R(4, 6)]); await page.evaluate(() => { scontro.pv = 6; scontro.tuoTurno = false; turnoNemScontro(); });
  await aspettaTurnoPg(page);
  eq(await page.evaluate(() => [scontro.pv, scontro.pa, scontro.preghieraUsata]), [12, 4, true]);
  eq(errori, [], "errori"); await chiudi();
});
caso("Agguati: orchi e goblin lasciano un oggetto comune; PE a scalare (gruppi pieni fino al 4); arma del bottino +livello al danno", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG({ livello: 4 }), BRONZO({ livello: 4, esperienza: 2400 }));
  eq(await page.evaluate(() => [xpAgguato(NEMICI.goblin), xpAgguato(NEMICI.orco), xpAgguato(NEMICI.banda_goblin), xpAgguato(NEMICI.banda_orchi)]), [38, 50, 125, 150]);
  const n = await page.evaluate(() => zaino.length);
  await page.evaluate(() => avviaAgguato("orco")); await page.waitForFunction(() => scontro);
  await page.evaluate(() => { scontro.pv = 0; vittoriaScontro(); });
  eq(await page.evaluate(() => zaino.length), n + 1, "un oggetto");
  const m = await page.evaluate(() => { arma = { nome: "Spada corta", danno: "1d6", tipoDanno: "Tagliente", mani: 1, bonus: 4 }; return [ctxTecnica().modDanno, modLottaPg()]; });
  eq(m[0], m[1] + 4, "+livello al danno");
  eq(errori, [], "errori"); await chiudi();
});

caso("Agguati: la banda si muove come un gruppo (scena prima degli attacchi); il pugnale di Isotta è un'arma 1d4 + livello", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG({ livello: 4 }), BRONZO({ livello: 4, esperienza: 2400 }));
  await page.evaluate(() => { NEMICI.banda_orchi.abilita = []; avviaScontro("banda_orchi", { ctx: "agguato", testi: "banda_orchi", primo: "nem" }); });
  await aspettaTurnoPg(page);
  const d = await diario(page), sc = await page.evaluate(() => PREDE.banda_orchi.it.scene);
  vero(sc.some(x => d.includes(x)), "manca la scena di gruppo");
  eq(await page.evaluate(() => [scontro.pvMax, NEMICI.banda_goblin.pvFissi]), [28, 20]);
  await page.evaluate(() => { chiudiScontro("fuggito"); scontro = null; bottinoAgguato("isotta", { L: 4 }); });
  const p = await page.evaluate(() => zaino.find(x => x.nome === "Pugnale della Biscia"));
  eq([p.tipo, p.danno, p.bonus, p.mani], ["arma", "1d4", 4, 1]);
  eq(errori, [], "errori"); await chiudi();
});

(async () => {
  const browser = await chromium.launch();
  let ok = 0;
  for (const c of casi) {
    try { await c.fn(browser); ok++; console.log("OK     " + c.nome); }
    catch (e) { console.log("ERRORE " + c.nome + "\n       → " + e.message.split("\n")[0]); }
  }
  await browser.close();
  console.log(`\n${ok} / ${casi.length} superati`);
  process.exit(ok === casi.length ? 0 : 1);
})();
