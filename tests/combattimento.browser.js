/* Test nel browser del combattimento del Guerriero: sala di prova, partita vera, creazione e regolamento.
   Uso:  python3 -m http.server 8765 --bind 127.0.0.1   (dalla cartella del gioco, in un altro terminale)
         node tests/combattimento.browser.js            (serve Playwright: npm i -g playwright)
   I dadi della partita si truccano sostituendo Math.random con una coda di valori. */
const { chromium } = require("playwright");
const BASE = process.env.BASE || "http://127.0.0.1:8765/";
const casi = [];
const caso = (nome, fn) => casi.push({ nome, fn });
const eq = (a, b, msg) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${msg || "atteso"}: ${JSON.stringify(b)}, ottenuto ${JSON.stringify(a)}`); };
const vero = (x, msg) => { if (!x) throw new Error(msg || "atteso vero"); };

/* ---------- personaggio e partita di prova ---------- */
const PG = (o) => Object.assign({
  nome: "Prova", razza: "Umano", classe: "Soldato", livello: 1, immagine: null,
  statisticheBase: { Vigore: 16, "Agilità": 12, Mente: 10, Spirito: 12 }, statistiche: { Vigore: 16, "Agilità": 12, Mente: 10, Spirito: 12 },
  modificatori: { Vigore: 3, "Agilità": 1, Mente: 0, Spirito: 1 }, tiroDado: { dado: 10, valore: 6 }, puntiVita: 19, saluteMentale: 17,
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
  await ctx.route(/^(?!http:\/\/127\.0\.0\.1)/, r => r.abort()); /* niente rete esterna (Firebase) */
  await page.addInitScript(([pg, partita]) => {
    if (!sessionStorage.getItem("inizializzato")) { /* solo al primo caricamento: un reload tiene lingua e salvataggi */
      sessionStorage.setItem("inizializzato", "1"); localStorage.clear();
      if (pg) localStorage.setItem("personaggio", JSON.stringify(pg));
      if (partita) localStorage.setItem("partita", JSON.stringify(partita));
    }
    /* dadi truccati: __coda vale solo per tira() (i dadi), __caso per le altre probabilità del nemico (morso, soffio, presa);
       la scelta casuale dei testi (pesca, scegli) resta casuale */
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
/* valore v su un dado d → numero per Math.random; "x" = valore grezzo (es. 0.99 per «no» alle probabilità) */
const R = (v, d) => (v - 1) / d + 0.5 / d;
const accoda = (page, dadi, caso) => page.evaluate(([d, c]) => { window.__coda.push(...d); window.__caso.push(...(c || [])); }, [dadi, caso]);
const aspettaTurnoPg = (page) => page.waitForFunction(() => typeof scontro !== "undefined" && scontro && scontro.tuoTurno, null, { timeout: 15000 });
const aspettaFineScontro = (page) => page.waitForFunction(() => typeof scontro !== "undefined" && !scontro, null, { timeout: 15000 });
const diario = (page) => page.evaluate(() => document.getElementById("diario").textContent); /* anche le tendine chiuse dei turni passati */

/* ======================= Sala di prova ======================= */
caso("Tutorial normale: parte come prima, senza la sala di prova e senza errori", async (b) => {
  const { page, errori, chiudi } = await apri(b, "tutorial.html");
  vero(await page.$("#diario"), "manca il diario del tutorial"); eq(await page.$(".sala"), null, "la sala non deve comparire");
  await page.waitForTimeout(800); eq(errori, [], "errori"); await chiudi();
});
caso("Sala di prova: si apre con ?prova e i 40 test del modulo passano anche nel browser", async (b) => {
  const { page, errori, chiudi } = await apri(b, "tutorial.html?prova");
  vero(await page.$(".sala"), "manca la sala"); await page.click("#svTestBtn");
  const esiti = await page.evaluate(() => window.esitiTestCombattimento);
  const ko = esiti.filter(e => !e.ok); eq(ko, [], "test falliti"); vero(esiti.length >= 40, "pochi test: " + esiti.length);
  eq(errori, [], "errori"); await chiudi();
});
caso("Sala di prova: Squarcia-Articolazioni su un mastino comune blocca Presa e Soffio (scheda e turno del nemico)", async (b) => {
  const { page, errori, chiudi } = await apri(b, "tutorial.html?prova");
  await page.selectOption("#pLiv", "4"); await page.evaluate(() => { Math.random = () => 0.99; }); /* niente soffio né presa casuali */
  await page.check("#nSoffio"); await page.check("#nMorso"); await page.check("#nPresa"); /* li forzerebbe: Squarcia deve impedirli */
  await page.click("#svNuovo");
  await page.evaluate(() => SalaProva.accoda(15, 3, 4, 2, /* nemico: */ 2));
  await page.click('[data-tec="squarcia"]');
  const st = await page.evaluate(() => SalaProva.stato().s.eff);
  eq(st.silenzio, 1, "silenzio dopo un turno nemico"); eq(st.frastornato, 1);
  const log = await page.innerText("#svLog"); vero(!/Soffio Infuocato|Presa:/.test(log), "il mastino ha usato un attacco speciale"); vero(/Senza attacchi speciali/.test(await page.innerText("#svNem")), "scheda nemico senza lo stato");
  eq(errori, [], "errori"); await chiudi();
});
caso("Sala di prova: un boss ignora lo stordimento di Eco del Metallo e resta Sbilanciato", async (b) => {
  const { page, chiudi } = await apri(b, "tutorial.html?prova");
  await page.selectOption("#pLiv", "3"); await page.selectOption("#nTipo", "manichino"); await page.check("#nBoss"); await page.click("#svNuovo");
  await page.evaluate(() => SalaProva.accoda(15, 3)); await page.click('[data-tec="eco"]');
  const s = await page.evaluate(() => SalaProva.stato().s);
  eq(s.eff.bloccato || 0, 0); vero(/non ha effetto/.test(await page.innerText("#svLog")), "manca il messaggio di immunità"); await chiudi();
});
caso("Sala di prova: Parata Mutilante annulla il morso, niente ira, contrattacco e sanguinamento", async (b) => {
  const { page, chiudi } = await apri(b, "tutorial.html?prova");
  await page.selectOption("#pLiv", "4"); await page.check("#nMorso"); await page.evaluate(() => { Math.random = () => 0.99; }); await page.click("#svNuovo");
  await page.evaluate(() => SalaProva.accoda(/* nemico: */ 19, /* contrattacco */ 5));
  const prima = await page.evaluate(() => ({ pv: SalaProva.stato().pg.pv, ira: SalaProva.stato().pg.ira }));
  await page.click('[data-tec="parata"]');
  const dopo = await page.evaluate(() => ({ pv: SalaProva.stato().pg.pv, ira: SalaProva.stato().pg.ira, sang: SalaProva.stato().s.eff.sanguina }));
  eq(dopo.pv, prima.pv, "salute"); eq(dopo.ira, prima.ira - 7, "ira: solo il costo"); eq(dopo.sang, 1, "sanguinamento 2 → 1 dopo il turno"); await chiudi();
});
caso("Sala di prova: colpo subito al livello 3 dà 2 ira, un critico 4; un mancato niente", async (b) => {
  const { page, chiudi } = await apri(b, "tutorial.html?prova");
  await page.selectOption("#pLiv", "3"); await page.check("#nMorso"); await page.evaluate(() => { Math.random = () => 0.99; }); await page.click("#svNuovo");
  const ira0 = await page.evaluate(() => { const st = SalaProva.stato(); st.pg.ira = 5; return 5; });
  await page.evaluate(() => SalaProva.accoda(1, /* nemico colpisce */ 19, 1)); await page.click("#svAttacca");
  eq(await page.evaluate(() => SalaProva.stato().pg.ira), ira0 + 2, "colpo normale");
  await page.evaluate(() => SalaProva.accoda(1, /* critico */ 20, 1, 1)); await page.click("#svAttacca");
  eq(await page.evaluate(() => SalaProva.stato().pg.ira), ira0 + 6, "critico");
  await page.evaluate(() => SalaProva.accoda(1, /* mancato */ 1)); await page.click("#svAttacca");
  eq(await page.evaluate(() => SalaProva.stato().pg.ira), ira0 + 6, "mancato"); await chiudi();
});
caso("Sala di prova: Cataclisma una volta per riposo, poi di nuovo dopo il riposo", async (b) => {
  const { page, chiudi } = await apri(b, "tutorial.html?prova");
  await page.selectOption("#pLiv", "5"); await page.selectOption("#nTipo", "manichino"); await page.fill("#nPv", "200"); await page.dispatchEvent("#nPv", "change"); await page.click("#svNuovo");
  await page.evaluate(() => SalaProva.accoda(15, 3, 3, 15, 4)); await page.click('[data-tec="cataclisma"]');
  vero(await page.evaluate(() => SalaProva.stato().perRiposo.cataclisma), "non segnata");
  vero(await page.$eval('[data-tec="cataclisma"]', b => b.disabled), "il pulsante deve spegnersi");
  await page.click("#svRiposa"); vero(!(await page.$eval('[data-tec="cataclisma"]', b => b.disabled)), "dopo il riposo torna"); await chiudi();
});
caso("Sala di prova: quote dei posti (2 di livello 1 al livello 1; la terza solo con lo scudo)", async (b) => {
  const { page, chiudi } = await apri(b, "tutorial.html?prova");
  await page.uncheck("#pIgnora");
  const box = (i) => page.locator('#svTec input[type=checkbox]').nth(i);
  await box(0).check(); await box(1).check();
  vero(await box(2).isDisabled(), "la terza deve essere bloccata");
  await page.check("#pScudo"); vero(!(await box(2).isDisabled()), "con lo scudo si sblocca"); await chiudi();
});

/* ======================= Partita vera (gioco.html) ======================= */
const PREP4 = ["polso", "morso_acciaio", "vipera", "tendini", "eco", "squarcia"];
caso("Gioco: tecnica a segno (Morso dell'Acciaio), ira spesa, Sanguinamento nella scheda del nemico", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG({ tecniche: PREP4.slice(0, 2) }), PARTITA({ livello: 4, usate: { riposo: "sbloccato", tecPreparate: PREP4 } }));
  await page.evaluate(() => { avviaScontro("mastino", { primo: "pg", soffioScarico: true }); });
  await aspettaTurnoPg(page);
  await accoda(page, [R(18, 20), R(4, 6)]);
  await page.evaluate(() => usaTecnica(TECNICHE.find(t => t.id === "morso_acciaio")));
  eq(await page.evaluate(() => pg.risorsaUsata), 3, "ira spesa"); eq(await page.evaluate(() => scontro.eff.sanguina), 2);
  vero(/Sanguinamento/.test(await page.innerText("#schedaNem")), "scheda nemico senza Sanguinamento");
  vero(/sanguina: 1d4 danni per 2 turni/i.test(await diario(page)), "manca il testo nel diario");
  eq(errori, [], "errori"); await chiudi();
});
caso("Gioco: tecnica mancata spende l'ira e non applica nulla", async (b) => {
  const { page, chiudi } = await apri(b, "gioco.html", PG(), PARTITA({ livello: 4, usate: { riposo: "sbloccato", tecPreparate: PREP4 } }));
  await page.evaluate(() => avviaScontro("mastino", { primo: "pg", soffioScarico: true })); await aspettaTurnoPg(page);
  await accoda(page, [R(1, 20)]);
  await page.evaluate(() => usaTecnica(TECNICHE.find(t => t.id === "squarcia")));
  eq(await page.evaluate(() => pg.risorsaUsata), 8); eq(await page.evaluate(() => scontro.eff.silenzio || 0), 0); await chiudi();
});
caso("Gioco: Parata Mutilante annulla il morso, niente danni né ira, contrattacco e sanguinamento", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG(), PARTITA({ livello: 4, usate: { riposo: "sbloccato", tecPreparate: ["polso", "morso_acciaio", "vipera", "tendini", "eco", "parata"] } }));
  await page.evaluate(() => avviaScontro("mastino", { primo: "pg", soffioScarico: true })); await aspettaTurnoPg(page);
  const prima = await page.evaluate(() => ({ df: pg.dannoFisico || 0, ira: pg.risorsaUsata || 0 }));
  /* nemico: ricarica soffio 1 (resta scarico), morso, d20 19, contrattacco 5 */
  await accoda(page, [R(1, 6), R(19, 20), R(5, 6)], [0.1]);
  await page.evaluate(() => usaTecnica(TECNICHE.find(t => t.id === "parata")));
  await aspettaTurnoPg(page);
  const dopo = await page.evaluate(() => ({ df: pg.dannoFisico || 0, ira: pg.risorsaUsata || 0, sang: scontro.eff.sanguina, parata: scontro.parata }));
  eq(dopo.df, prima.df, "danni subiti"); eq(dopo.ira, prima.ira + 7, "ira: solo il costo"); eq(dopo.sang, 1, "sanguinamento 2 → 1"); eq(dopo.parata, false);
  vero(/Pari il colpo/.test(await diario(page)), "manca il testo della parata"); eq(errori, [], "errori"); await chiudi();
});
caso("Gioco: un morso subito al livello 4 restituisce 2 ira (scala per livello)", async (b) => {
  const { page, chiudi } = await apri(b, "gioco.html", PG(), PARTITA({ livello: 4, risorsaUsata: 10, usate: { riposo: "sbloccato", tecPreparate: PREP4 } }));
  await page.evaluate(() => avviaScontro("mastino", { primo: "pg", soffioScarico: true })); await aspettaTurnoPg(page);
  /* attacco normale mancato; nemico: ricarica 1, morso, d20 19, danno 1; presa: no */
  await accoda(page, [R(1, 20), R(1, 6), R(19, 20), R(1, 4)], [0.1, 0.99]);
  await page.evaluate(() => attaccoPgScontro(false)); await aspettaTurnoPg(page);
  eq(await page.evaluate(() => pg.risorsaUsata), 8, "10 − 2"); await chiudi();
});
caso("Gioco: via di Aldo al livello 4 — Marchio e Ferita Riaperta fuori dai posti; il marchio aggiunge 1d4 all'attacco normale", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG(), PARTITA({ livello: 4, usate: { riposo: "sbloccato", tecPreparate: PREP4, via: "aldo" } }));
  const ids = await page.evaluate(() => tecnicheDelPg().filter(x => x.via).map(x => x.t.id)); eq(ids, ["marchio", "ferita_riaperta"]);
  eq(await page.evaluate(() => tecnichePreparate().length), 6, "i posti restano 6");
  await page.evaluate(() => avviaScontro("mastino", { primo: "pg", soffioScarico: true })); await aspettaTurnoPg(page);
  await page.evaluate(() => { scontro.pv = 80; scontro.pvMax = 80; });
  await accoda(page, [R(18, 20), R(2, 6), /* nemico: tick 1, ricarica 1, zampata mancata */ R(1, 4), R(1, 6), R(1, 20)], [0.9]);
  await page.evaluate(() => usaTecnica(TECNICHE.find(t => t.id === "marchio"))); await aspettaTurnoPg(page);
  vero(await page.evaluate(() => scontro.marchio), "non marchiato");
  vero(/marchiato/.test(await page.innerText("#schedaNem")), "la scheda non mostra il marchio");
  await accoda(page, [R(18, 20), R(2, 6), R(3, 4)]);
  await page.evaluate(() => attaccoPgScontro(false));
  vero(/Marchio: \+3 danni/.test(await diario(page)), "manca il bonus del marchio"); eq(errori, [], "errori"); await chiudi();
});
caso("Gioco: contro Ettore (boss) Eco del Metallo non stordisce e Fendente della Vipera non tira il salvataggio", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG(), PARTITA({ livello: 4, usate: { riposo: "sbloccato", tecPreparate: PREP4 } }));
  await page.evaluate(() => avviaScontro("esploratore", { ctx: "ettore", testi: "esploratore", primo: "pg" })); await aspettaTurnoPg(page);
  await page.evaluate(() => { scontro.pv = 90; scontro.pvMax = 90; });
  await accoda(page, [R(19, 20), R(1, 6)]);
  await page.evaluate(() => usaTecnica(TECNICHE.find(t => t.id === "eco")));
  eq(await page.evaluate(() => [scontro.eff.bloccato || 0, scontro.eff.sbilanciato]), [0, 1]);
  vero(/troppo potente/.test(await diario(page)), "manca il messaggio dei boss"); eq(errori, [], "errori"); await chiudi();
});
caso("Gioco: salita al livello 3 — ira + mod Vigore + livello e avviso della via", async (b) => {
  const { page, chiudi } = await apri(b, "gioco.html", PG(), PARTITA({ livello: 2, crescita: { salute: 5, mente: 5, risorsa: 5 }, usate: { riposo: "sbloccato" } }));
  const prima = await page.evaluate(() => risorsaPg().max); eq(prima, 18, "13 + 5");
  await page.evaluate(() => { guadagnaPE(5000); controllaLivello(); });
  eq(await page.evaluate(() => livelloPg()), 5, "fino al livello 5");
  eq(await page.evaluate(() => risorsaPg().max), 39, "13, 18, 24, 31, 39");
  const d = await diario(page); vero(/mod\. Vigore \+3 \+ livello 3 → \+6/.test(d), "manca la riga dell'ira"); vero(/scegliere una via di prestigio/.test(d), "manca l'avviso della via"); await chiudi();
});
caso("Gioco: scelta della via una volta sola e quote nella preparazione delle tecniche", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG(), PARTITA({ livello: 3, usate: { riposo: "sbloccato", tecPreparate: [] } }));
  await page.evaluate(() => apriSceltaVia()); await page.check('#prepBox input[value="guendalina"]'); await page.click("#prepBox button.primario");
  eq(await page.evaluate(() => usate.via), "guendalina"); eq(await page.evaluate(() => sceglieVia("aldo")), false, "non si cambia");
  eq(await page.evaluate(() => tecnicheDelPg().filter(x => x.via).map(x => x.t.id)), ["veglia_ferro"]);
  await page.evaluate(() => apriPreparazione(false));
  const box = '#prepBox input[name="tec"]';
  for (const id of ["polso", "morso_acciaio"]) await page.check(`${box}[value="${id}"]`);
  vero(await page.$eval(`${box}[value="pomolo"]`, c => c.disabled), "terza di livello 1 bloccata");
  for (const id of ["vipera", "tendini", "eco"]) await page.check(`${box}[value="${id}"]`);
  vero(await page.$eval(`${box}[value="arterie"]`, c => c.disabled), "seconda di livello 3 bloccata");
  vero(!(await page.$eval("#prepBox button.primario", c => c.disabled)), "5 scelte: si conferma"); await page.click("#prepBox button.primario");
  eq((await page.evaluate(() => usate.tecPreparate)).length, 5); eq(errori, [], "errori"); await chiudi();
});
caso("Gioco: Cataclisma una volta per riposo, il riposo lo rende di nuovo disponibile", async (b) => {
  const { page, chiudi } = await apri(b, "gioco.html", PG(), PARTITA({ livello: 5, usate: { riposo: "sbloccato", tecPreparate: ["polso", "morso_acciaio", "vipera", "tendini", "eco", "squarcia", "cataclisma"] } }));
  await page.evaluate(() => avviaScontro("mastino", { primo: "pg", soffioScarico: true })); await aspettaTurnoPg(page);
  await page.evaluate(() => { scontro.pv = 200; scontro.pvMax = 200; });
  await accoda(page, [R(1, 20), R(1, 20), /* nemico */ R(1, 6), R(1, 20)], [0.9]);
  await page.evaluate(() => usaTecnica(TECNICHE.find(t => t.id === "cataclisma"))); await aspettaTurnoPg(page);
  const ira = await page.evaluate(() => pg.risorsaUsata);
  await page.evaluate(() => usaTecnica(TECNICHE.find(t => t.id === "cataclisma")));
  eq(await page.evaluate(() => pg.risorsaUsata), ira, "la seconda non si paga"); vero(/una volta per riposo/.test(await diario(page)), "manca l'avviso");
  await page.evaluate(() => { scontro = null; offriPreparazione(); }); eq(await page.evaluate(() => usate.perRiposo), {}); await chiudi();
});

caso("Gioco: il Soffio Infuocato a segno conta come colpo subito (+2 ira al livello 4)", async (b) => {
  const { page, chiudi } = await apri(b, "gioco.html", PG(), PARTITA({ livello: 4, risorsaUsata: 10, usate: { riposo: "sbloccato", tecPreparate: PREP4 } }));
  await page.evaluate(() => avviaScontro("mastino", { primo: "pg" })); await aspettaTurnoPg(page);
  await accoda(page, [R(1, 20)], [0.1]); /* tu manchi; il mastino sceglie il soffio */
  await page.evaluate(() => attaccoPgScontro(false));
  await page.waitForSelector("#azioni button", { state: "visible", timeout: 10000 });
  await accoda(page, [R(1, 20), R(3, 6), R(3, 6)]); /* tiro salvezza fallito, 2d6 = 6 */
  await page.click("#azioni button"); await aspettaTurnoPg(page);
  eq(await page.evaluate(() => pg.risorsaUsata), 8, "10 − 2"); await chiudi();
});
caso("Gioco: Mutilazione giustizia un mastino comune e lo scontro si chiude con la vittoria", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG(), PARTITA({ livello: 4, usate: { riposo: "sbloccato", tecPreparate: ["polso", "morso_acciaio", "vipera", "tendini", "eco", "mutilazione"] } }));
  await page.evaluate(() => avviaScontro("mastino", { primo: "pg", soffioScarico: true })); await aspettaTurnoPg(page);
  await page.evaluate(() => { scontro.pv = 13; scontro.pvMax = 40; });
  await accoda(page, [R(18, 20), R(1, 6), R(1, 6)]); /* 1 + 1 + 3 = 5 → 8 < 10 */
  await page.evaluate(() => usaTecnica(TECNICHE.find(t => t.id === "mutilazione"))); await aspettaFineScontro(page);
  vero(/il nemico crolla/.test(await diario(page)), "manca l'esecuzione"); eq(errori, [], "errori"); await chiudi();
});
caso("Gioco: il contrattacco della Parata che uccide il mastino chiude lo scontro", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG(), PARTITA({ livello: 4, usate: { riposo: "sbloccato", tecPreparate: ["polso", "morso_acciaio", "vipera", "tendini", "eco", "parata"] } }));
  await page.evaluate(() => avviaScontro("mastino", { primo: "pg", soffioScarico: true })); await aspettaTurnoPg(page);
  await page.evaluate(() => { scontro.pv = 3; });
  await accoda(page, [R(1, 6), R(19, 20), R(5, 6)], [0.1]);
  await page.evaluate(() => usaTecnica(TECNICHE.find(t => t.id === "parata"))); await aspettaFineScontro(page);
  eq(await page.evaluate(() => usate.cantina_cane), "sconfitto"); eq(errori, [], "errori"); await chiudi();
});
caso("Gioco: un salvataggio con le vecchie tecniche del taglio lascia i posti vuoti da riempire", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG({ tecniche: ["squarcio", "arterioso"] }), PARTITA({ livello: 2, usate: { riposo: "sbloccato", tecPreparate: ["squarcio", "arterioso", "laterale"] } }));
  eq(await page.evaluate(() => tecnichePreparate().length), 0); eq(await page.evaluate(() => postiLiberi()), 4);
  vero(/posti? vuot|Scegli/i.test(await page.textContent("#tecniche")), "manca l'invito a scegliere"); eq(errori, [], "errori"); await chiudi();
});

/* ======================= Creazione e regolamento ======================= */
caso("Creazione: il Guerriero con la spada vede le 3 nuove tecniche di livello 1 e ne sceglie 2", async (b) => {
  const { page, errori, chiudi } = await apri(b, "creazione.html");
  await page.check('input[name="classe"][value="Soldato"]', { force: true });
  await page.check('input[name="arma"][value="0"]', { force: true });
  const nomi = await page.$$eval('#lista-tecniche input[name="tecnica"]', cs => cs.map(c => c.value)); eq(nomi, ["polso", "morso_acciaio", "pomolo"]);
  eq(errori, [], "errori"); await chiudi();
});
caso("Regolamento: posti, ira per livello, vie e boss in italiano e in inglese", async (b) => {
  const { page, errori, chiudi } = await apri(b, "regolamento.html");
  const t = await page.textContent("body");
  ["2 (livello 1), 4 (livello 2), 5 (livello 3), 6 (livello 4), 7 (livello 5)", "+1 ai livelli 1-2, +2 ai livelli 3-4, +3 al livello 5", "via di prestigio", "al massimo 2 turni"].forEach(x => vero(t.includes(x), "manca: " + x));
  await page.evaluate(() => { localStorage.setItem("lingua", "en"); }); await page.reload();
  const e = await page.textContent("body");
  ["2 (level 1), 4 (level 2)", "+1 at levels 1-2, +2 at levels 3-4, +3 at level 5", "prestige path"].forEach(x => vero(e.includes(x), "manca: " + x));
  eq(errori, [], "errori"); await chiudi();
});
caso("Gioco in inglese: una tecnica nuova si usa senza errori e con i testi inglesi", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG(), PARTITA({ livello: 4, usate: { riposo: "sbloccato", tecPreparate: PREP4, via: "aldo" } }));
  await page.evaluate(() => localStorage.setItem("lingua", "en")); await page.reload(); await page.waitForTimeout(500);
  await page.evaluate(() => avviaScontro("esploratore", { ctx: "ettore", testi: "esploratore", primo: "pg" })); await aspettaTurnoPg(page);
  await page.evaluate(() => { scontro.pv = 90; scontro.pvMax = 90; });
  await accoda(page, [R(19, 20), R(1, 6), R(1, 6)]);
  await page.evaluate(() => usaTecnica(TECNICHE.find(t => t.id === "squarcia")));
  vero(/too powerful/.test(await diario(page)), "manca il testo inglese dei boss"); eq(errori, [], "errori"); await chiudi();
});

(async () => {
  const browser = await chromium.launch();
  let ko = 0;
  for (const { nome, fn } of casi) {
    try { await fn(browser); console.log("OK     " + nome); }
    catch (e) { ko++; console.log("ERRORE " + nome + "\n       → " + e.message.split("\n")[0]); }
  }
  await browser.close();
  console.log(`\n${casi.length - ko} / ${casi.length} superati`);
  process.exit(ko ? 1 : 0);
})();
