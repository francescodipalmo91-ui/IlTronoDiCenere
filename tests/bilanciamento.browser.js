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
caso("Elisir: senza lo stato protegge per lo scontro successivo; il nemico spreca il primo tentativo", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG(), PARTITA());
  await page.evaluate(() => { zaino.push({ id: "balsamo", nome: "Balsamo", tipo: "consumabile", usi: 1, effetto: "cura_ustione" }); });
  const r = await page.evaluate(() => effettoBevanda(zaino.find(x => x.id === "balsamo")));
  vero(r.ok && /prossimo scontro/.test(r.ok), "testo della protezione");
  eq(await page.evaluate(() => usate.protezione), { stato: "ustione", conc: false });
  await page.evaluate(() => avviaScontro("mastino", { primo: "nem" }));
  eq(await page.evaluate(() => { const r = []; return applicaStatoPg("ustione", r); }), false, "non attecchisce");
  eq(await page.evaluate(() => [statoInutile("ustione"), haStato("ustione")]), [true, false]);
  await page.evaluate(() => chiudiScontro("vinto"));
  eq(await page.evaluate(() => usate.protezione), null, "consumata a fine scontro");
  eq(errori, [], "errori"); await chiudi();
});
caso("Elisir: un concentrato cura e rende immuni per il resto dello scontro; la borsa ne tiene 2 per stato", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG(), PARTITA());
  await page.evaluate(() => avviaScontro("mastino", { primo: "nem" }));
  await page.evaluate(() => { const r = []; applicaStatoPg("ustione", r); zaino.push({ id: "balsamo_conc", nome: "Conc", tipo: "consumabile", usi: 1, effetto: "conc_ustione" }); });
  await page.evaluate(() => effettoBevanda(zaino.find(x => x.id === "balsamo_conc")));
  eq(await page.evaluate(() => [haStato("ustione"), protettoDa("ustione")]), [false, true]);
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
