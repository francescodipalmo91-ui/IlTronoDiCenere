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
caso("Sala di prova: si apre con ?prova e i 103 test del modulo passano anche nel browser", async (b) => {
  const { page, errori, chiudi } = await apri(b, "tutorial.html?prova");
  vero(await page.$(".sala"), "manca la sala"); await page.click("#svTestBtn");
  const esiti = await page.evaluate(() => window.esitiTestCombattimento);
  const ko = esiti.filter(e => !e.ok); eq(ko, [], "test falliti"); vero(esiti.length >= 103, "pochi test: " + esiti.length);
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

/* ---------- Sala di prova: scudo ---------- */
caso("Sala di prova: con lo scudo compaiono le 15 tecniche di scudo e, con la serie dello scudo, le abilità della via dello scudo", async (b) => {
  const { page, errori, chiudi } = await apri(b, "tutorial.html?prova");
  await page.selectOption("#pLiv", "5"); await page.check("#pScudo"); await page.selectOption("#pVia", "aldo");
  const ids = await page.$$eval("#svTec [data-tec]", bs => bs.map(x => x.dataset.tec));
  ["assorbimento", "postura_salda", "muro", "onda_ritorno", "mare_profondo", "egida"].forEach(id => vero(ids.includes(id), "manca " + id));
  vero(ids.includes("marchio") && !ids.includes("marea_elastica"), "serie dell'arma: abilità del taglio");
  await page.selectOption("#pSerie", "scudo");
  const via = await page.$$eval("#svTec [data-tec]", bs => bs.map(x => x.dataset.tec));
  vero(via.includes("marea_elastica") && via.includes("onda_rimbalzo") && via.includes("tsunami") && !via.includes("marchio"), "serie dello scudo");
  eq(errori, [], "errori"); await chiudi();
});
caso("Sala di prova: Muro di Assorbimento inghiotte il morso (0 danni, niente ira), 3 Cariche; il turno dopo niente Postura Salda", async (b) => {
  const { page, errori, chiudi } = await apri(b, "tutorial.html?prova");
  await page.selectOption("#pLiv", "2"); await page.check("#pScudo"); await page.check("#nMorso"); await page.evaluate(() => { Math.random = () => 0.99; }); await page.click("#svNuovo");
  const prima = await page.evaluate(() => ({ pv: SalaProva.stato().pg.pv, ira: SalaProva.stato().pg.ira }));
  await page.evaluate(() => SalaProva.accoda(/* nemico: */ 19, 4)); await page.click('[data-tec="muro"]');
  const dopo = await page.evaluate(() => ({ pv: SalaProva.stato().pg.pv, ira: SalaProva.stato().pg.ira, c: SalaProva.stato().s.cariche }));
  eq(dopo.pv, prima.pv, "salute"); eq(dopo.ira, prima.ira - 5, "ira: solo il costo"); eq(dopo.c, 3, "cariche");
  vero(/Carica Cinetica/.test(await page.innerText("#svPg")), "scheda senza Cariche");
  vero(await page.$eval('[data-tec="postura_salda"]', x => x.disabled), "difesa due turni di fila");
  vero(!(await page.$eval('[data-tec="assorbimento"]', x => x.disabled)), "un colpo di scudo resta libero");
  eq(errori, [], "errori"); await chiudi();
});
caso("Sala di prova: Egida del Vuoto assorbe il colpo e all'inizio del tuo turno rilascia l'onda", async (b) => {
  const { page, errori, chiudi } = await apri(b, "tutorial.html?prova");
  await page.selectOption("#pLiv", "5"); await page.check("#pScudo"); await page.check("#nMorso"); await page.evaluate(() => { Math.random = () => 0.99; });
  await page.fill("#nPv", "100"); await page.dispatchEvent("#nPv", "change"); await page.click("#svNuovo");
  await page.evaluate(() => SalaProva.accoda(/* nemico */ 19, 4, /* onda: 2d6 per 1 Carica */ 6, 6));
  await page.click('[data-tec="egida"]');
  const st = await page.evaluate(() => ({ pv: SalaProva.stato().s.pv, c: SalaProva.stato().s.cariche, pg: SalaProva.stato().pg }));
  eq(st.c, 0, "cariche spese"); eq(st.pv, 100 - (12 + st.pg.modV), "onda 2d6 + Vigore"); eq(st.pg.pv, st.pg.pvMax, "nessun danno subito");
  vero(/Onda dell'Egida/.test(await page.innerText("#svLog")), "manca l'onda nel diario"); eq(errori, [], "errori"); await chiudi();
});

/* ---------- Sala di prova: contundenti ---------- */
caso("Sala di prova: col martello compaiono le 15 contundenti e la via di Aldo contundente", async (b) => {
  const { page, errori, chiudi } = await apri(b, "tutorial.html?prova");
  await page.selectOption("#pLiv", "5"); await page.selectOption("#pArma", "3"); await page.selectOption("#pVia", "aldo");
  const ids = await page.$$eval("#svTec [data-tec]", bs => bs.map(x => x.dataset.tec));
  ["maglio", "mento", "sbilanciante", "frantumascudo", "tremante", "costole", "sismica", "demolitore", "coma", "ginocchia", "demolizione", "controschiaccio", "cateratta_roccia", "impatto_cataclisma", "sentenza_maglio", "sigillo", "crollo", "martello"].forEach(id => vero(ids.includes(id), "manca " + id));
  vero(!ids.includes("polso") && !ids.includes("marchio"), "compaiono tecniche del taglio"); eq(errori, [], "errori"); await chiudi();
});
caso("Sala di prova: Incrinatura abbassa la CA nella scheda e si ferma a 2 cariche su un boss", async (b) => {
  const { page, errori, chiudi } = await apri(b, "tutorial.html?prova");
  await page.selectOption("#pLiv", "5"); await page.selectOption("#pArma", "3"); await page.selectOption("#nTipo", "manichino"); await page.click("#svNuovo");
  await page.evaluate(() => SalaProva.accoda(15, 2, 2)); await page.click('[data-tec="impatto_cataclisma"]');
  eq(await page.evaluate(() => SalaProva.stato().s.crepe), 3); vero(/CA\s*7/.test(await page.innerText("#svNem")), "CA attesa 12 − 3 (Incrinatura) − 2 (Sbilanciato) = 7");
  vero(/Incrinatura[\s\S]*3\/3 cariche/.test(await page.innerText("#svNem")), "manca l'Incrinatura nella scheda");
  await page.check("#nBoss"); await page.click("#svNuovo"); await page.evaluate(() => SalaProva.accoda(15, 2, 2)); await page.click('[data-tec="impatto_cataclisma"]');
  eq(await page.evaluate(() => SalaProva.stato().s.crepe), 2, "boss: 2 cariche"); eq(errori, [], "errori"); await chiudi();
});
caso("Sala di prova: Frattura colpisce il mastino prima del suo attacco", async (b) => {
  const { page, errori, chiudi } = await apri(b, "tutorial.html?prova");
  await page.selectOption("#pLiv", "2"); await page.selectOption("#pArma", "3"); await page.check("#nMorso"); await page.evaluate(() => { Math.random = () => 0.99; });
  await page.fill("#nPv", "60"); await page.dispatchEvent("#nPv", "change"); await page.click("#svNuovo");
  await page.evaluate(() => SalaProva.accoda(15, 2, 2, /* frattura */ 3, /* morso mancato */ 1)); await page.click('[data-tec="costole"]');
  vero(/Frattura: 3 danni prima di attaccare/.test(await page.innerText("#svLog")), "manca la frattura");
  eq(await page.evaluate(() => SalaProva.stato().s.pv), 60 - 7 - 3); eq(errori, [], "errori"); await chiudi();
});
caso("Sala di prova: Contro-Schiacciamento annulla il morso, niente ira, contrattacco e 1 carica di Incrinatura", async (b) => {
  const { page, chiudi } = await apri(b, "tutorial.html?prova");
  await page.selectOption("#pLiv", "4"); await page.selectOption("#pArma", "3"); await page.check("#nMorso"); await page.evaluate(() => { Math.random = () => 0.99; }); await page.click("#svNuovo");
  await page.evaluate(() => SalaProva.accoda(/* nemico: */ 19, /* contrattacco */ 5));
  const prima = await page.evaluate(() => ({ pv: SalaProva.stato().pg.pv, ira: SalaProva.stato().pg.ira }));
  await page.click('[data-tec="controschiaccio"]');
  const dopo = await page.evaluate(() => ({ pv: SalaProva.stato().pg.pv, ira: SalaProva.stato().pg.ira, crepe: SalaProva.stato().s.crepe, sang: SalaProva.stato().s.eff.sanguina || 0 }));
  eq(dopo.pv, prima.pv, "salute"); eq(dopo.ira, prima.ira - 7, "ira: solo il costo"); eq([dopo.crepe, dopo.sang], [1, 0]); await chiudi();
});

/* ---------- Sala di prova: perforanti ---------- */
caso("Sala di prova: con la mazza chiodata compaiono le 15 perforanti e la via di Aldo perforante", async (b) => {
  const { page, errori, chiudi } = await apri(b, "tutorial.html?prova");
  await page.selectOption("#pLiv", "5"); await page.selectOption("#pArma", "4"); await page.selectOption("#pVia", "aldo");
  const ids = await page.$$eval("#svTec [data-tec]", bs => bs.map(x => x.dataset.tec));
  ["cuore", "spillo", "varco", "giuntura", "trafittura", "fianco", "doppia_punta", "perforazione", "mirato", "ferita_profonda", "guardia_punta", "grazia", "tempesta", "celeste", "colpo_perfetto", "segno", "trapasso", "foro"].forEach(id => vero(ids.includes(id), "manca " + id));
  vero(!ids.includes("plesso") && !ids.includes("zanzara") && !ids.includes("maglio") && !ids.includes("marchio"), "compaiono tecniche tolte o di altri rami"); eq(errori, [], "errori"); await chiudi();
});
caso("Sala di prova: Mirare al Varco rende il nemico Esposto e un 19 dell'attacco normale diventa critico", async (b) => {
  const { page, errori, chiudi } = await apri(b, "tutorial.html?prova");
  await page.selectOption("#pArma", "4"); await page.selectOption("#nTipo", "manichino"); await page.click("#svNuovo");
  await page.evaluate(() => SalaProva.accoda(15, 2)); await page.click('[data-tec="varco"]');
  eq(await page.evaluate(() => SalaProva.stato().s.eff.esposto), 1, "2 turni, uno già passato"); vero(/Esposto/.test(await page.innerText("#svNem")), "scheda senza Esposto");
  await page.evaluate(() => SalaProva.accoda(19, 1, 1)); await page.click("#svAttacca");
  vero(/CRITICO: d20 19[^\n]*critico da 19/.test(await page.innerText("#svLog")), "il 19 doveva essere critico"); eq(errori, [], "errori"); await chiudi();
});
caso("Sala di prova: Guardia di Punta annulla il morso, niente ira, contrattacco critico con 18 ed Esposto", async (b) => {
  const { page, chiudi } = await apri(b, "tutorial.html?prova");
  await page.selectOption("#pLiv", "4"); await page.selectOption("#pArma", "4"); await page.check("#nMorso"); await page.evaluate(() => { Math.random = () => 0.99; });
  await page.fill("#nPv", "60"); await page.dispatchEvent("#nPv", "change"); await page.click("#svNuovo");
  await page.evaluate(() => SalaProva.accoda(/* nemico */ 19, /* critico */ 18, 2, 3));
  const prima = await page.evaluate(() => ({ pv: SalaProva.stato().pg.pv, ira: SalaProva.stato().pg.ira }));
  await page.click('[data-tec="guardia_punta"]');
  const dopo = await page.evaluate(() => ({ pv: SalaProva.stato().pg.pv, ira: SalaProva.stato().pg.ira, esp: SalaProva.stato().s.eff.esposto, pvN: SalaProva.stato().s.pv }));
  eq(dopo.pv, prima.pv, "salute"); eq(dopo.ira, prima.ira - 7, "ira: solo il costo"); eq([dopo.esp, dopo.pvN], [1, 60 - 2 - 3 - 3]);
  vero(/critico 18-20: d20 18 → CRITICO/.test(await page.innerText("#svLog")), "manca il critico del contrattacco"); await chiudi();
});
caso("Sala di prova: Il Colpo Perfetto una volta per riposo, poi di nuovo dopo il riposo", async (b) => {
  const { page, chiudi } = await apri(b, "tutorial.html?prova");
  await page.selectOption("#pLiv", "5"); await page.selectOption("#pArma", "4"); await page.selectOption("#nTipo", "manichino"); await page.fill("#nPv", "200"); await page.dispatchEvent("#nPv", "change"); await page.click("#svNuovo");
  await page.evaluate(() => SalaProva.accoda(15, 1, 1, 1, 1, 15, 1)); await page.click('[data-tec="colpo_perfetto"]');
  vero(await page.evaluate(() => SalaProva.stato().perRiposo.colpo_perfetto), "non segnata");
  vero(await page.$eval('[data-tec="colpo_perfetto"]', b => b.disabled), "il pulsante deve spegnersi");
  await page.click("#svRiposa"); vero(!(await page.$eval('[data-tec="colpo_perfetto"]', b => b.disabled)), "dopo il riposo torna"); await chiudi();
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

caso("Gioco: Veglia Inflessibile dà +2 CA e +4 ai tiri salvezza per 3 turni (vale sul Soffio)", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG(), PARTITA({ livello: 5, usate: { riposo: "sbloccato", tecPreparate: [], via: "guendalina" } }));
  await page.evaluate(() => avviaScontro("mastino", { primo: "pg" })); await aspettaTurnoPg(page);
  await page.evaluate(() => { scontro.pv = 90; scontro.pvMax = 90; });
  await accoda(page, [R(1, 20)], [0.1]); /* manchi; il mastino soffia */
  await page.evaluate(() => usaTecnica(TECNICHE.find(t => t.id === "veglia_inflessibile")));
  eq(await page.evaluate(() => [scontro.eff.furore, scontro.eff.guardia, scontro.guardiaVal]), [3, 3, 2]);
  vero(/Furore inarrestabile/.test(await page.textContent("#schedaPg")), "manca l'effetto nella scheda");
  await page.waitForSelector("#azioni button", { state: "visible", timeout: 10000 });
  vero(/\+5/.test(await page.textContent("#azioni")), "tiro salvezza senza il +4 (Agilità +1 + 4)");
  eq(errori, [], "errori"); await chiudi();
});

/* ---------- Partita vera: contundenti ---------- */
const MARTELLO = { arma: "Martello da battaglia", armaDanno: "1d8", armaTipoDanno: "Contundente", armaMani: 1, armatura: "Armatura media", armaturaCA: 4, malusAgilita: 0, scudo: null, dotazione: [] };
const PREPC = ["maglio", "mento", "tremante", "costole", "sismica", "ginocchia"];
caso("Gioco: Guerriero col martello — Incrinatura nella scheda del nemico, CA ridotta, testo nel diario", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG({ tecniche: ["maglio", "mento"], equipaggiamento: MARTELLO }), PARTITA({ livello: 4, usate: { riposo: "sbloccato", tecPreparate: PREPC } }));
  await page.evaluate(() => avviaScontro("mastino", { primo: "pg", soffioScarico: true })); await aspettaTurnoPg(page);
  await page.evaluate(() => { scontro.pv = 80; scontro.pvMax = 80; });
  const ca0 = await page.evaluate(() => caNem());
  await accoda(page, [R(18, 20), R(2, 8)]);
  await page.evaluate(() => usaTecnica(TECNICHE.find(t => t.id === "maglio")));
  eq(await page.evaluate(() => scontro.crepe), 1); eq(await page.evaluate(() => caNem()), ca0 - 1, "CA −1");
  vero(/Incrinatura/.test(await page.innerText("#schedaNem")), "scheda nemico senza Incrinatura");
  vero(/armatura si incrina/.test(await diario(page)), "manca il testo nel diario"); eq(errori, [], "errori"); await chiudi();
});
caso("Gioco: Frattura ferisce il mastino prima del suo attacco e può ucciderlo", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG({ tecniche: ["maglio", "mento"], equipaggiamento: MARTELLO }), PARTITA({ livello: 4, usate: { riposo: "sbloccato", tecPreparate: PREPC } }));
  await page.evaluate(() => avviaScontro("mastino", { primo: "pg", soffioScarico: true })); await aspettaTurnoPg(page);
  await page.evaluate(() => { scontro.pv = 13; scontro.pvMax = 40; });
  /* Spezza-Costole: 2d8 = 1 + 1 + 3 = 5 → 8; nemico: ricarica 1, frattura 4 → 4; poi morso mancato */
  await accoda(page, [R(18, 20), R(1, 8), R(1, 8), R(1, 6), R(4, 4), R(1, 20)], [0.9]);
  await page.evaluate(() => usaTecnica(TECNICHE.find(t => t.id === "costole"))); await aspettaTurnoPg(page);
  eq(await page.evaluate(() => scontro.pv), 4); vero(/frattura cede mentre attacca: 4 danni/.test(await diario(page)), "manca il testo della frattura");
  await page.evaluate(() => { scontro.pv = 2; });
  await accoda(page, [R(1, 20), R(1, 6), R(4, 4)], [0.9]); /* manchi; ricarica; frattura 4 lo uccide */
  await page.evaluate(() => attaccoPgScontro(false)); await aspettaFineScontro(page);
  eq(errori, [], "errori"); await chiudi();
});
caso("Gioco: Percossa al Mento — il 20 del mastino non è critico nel turno successivo", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG({ tecniche: ["maglio", "mento"], equipaggiamento: MARTELLO }), PARTITA({ livello: 4, usate: { riposo: "sbloccato", tecPreparate: PREPC } }));
  await page.evaluate(() => avviaScontro("mastino", { primo: "pg", soffioScarico: true })); await aspettaTurnoPg(page);
  await page.evaluate(() => { scontro.pv = 80; scontro.pvMax = 80; });
  await accoda(page, [R(18, 20), R(2, 8), /* nemico: ricarica 1, zampata 20, danno 1 */ R(1, 6), R(20, 20), R(1, 4)], [0.9]);
  await page.evaluate(() => usaTecnica(TECNICHE.find(t => t.id === "mento"))); await aspettaTurnoPg(page);
  const d = await diario(page);
  vero(/Intontito/.test(d), "manca lo stato"); vero(/Zampata: Colpito/.test(d), "il 20 doveva colpire senza critico"); vero(!/Zampata: COLPO CRITICO/.test(d), "il colpo non deve essere critico");
  eq(errori, [], "errori"); await chiudi();
});
caso("Gioco: via di Aldo col martello — Sigillo e Crollo al livello 4, il sigillo aggiunge 1d4 con le cariche piene", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG({ tecniche: ["maglio", "mento"], equipaggiamento: MARTELLO }), PARTITA({ livello: 4, usate: { riposo: "sbloccato", tecPreparate: PREPC, via: "aldo" } }));
  eq(await page.evaluate(() => tecnicheDelPg().filter(x => x.via).map(x => x.t.id)), ["sigillo", "crollo"]);
  await page.evaluate(() => avviaScontro("mastino", { primo: "pg", soffioScarico: true })); await aspettaTurnoPg(page);
  await page.evaluate(() => { scontro.pv = 90; scontro.pvMax = 90; scontro.crepe = 1; });
  await accoda(page, [R(18, 20), R(2, 8), /* nemico: ricarica 1, zampata mancata */ R(1, 6), R(1, 20)], [0.9]);
  await page.evaluate(() => usaTecnica(TECNICHE.find(t => t.id === "sigillo"))); await aspettaTurnoPg(page);
  eq(await page.evaluate(() => [scontro.crepe, scontro.sigillo]), [3, true]); vero(/sigillo/.test(await page.innerText("#schedaNem")), "la scheda non mostra il sigillo");
  await accoda(page, [R(18, 20), R(2, 8), R(3, 4)]);
  await page.evaluate(() => attaccoPgScontro(false));
  vero(/Sigillo: \+3 danni/.test(await diario(page)), "manca il bonus del sigillo"); eq(errori, [], "errori"); await chiudi();
});
caso("Gioco: scelta della via col martello mostra le abilità contundenti", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG({ equipaggiamento: MARTELLO }), PARTITA({ livello: 3, usate: { riposo: "sbloccato", tecPreparate: [] } }));
  await page.evaluate(() => apriSceltaVia());
  const t = await page.textContent("#prepBox"); vero(/Sigillo del Demolitore/.test(t) && /Rintocco/.test(t), "mancano le abilità contundenti"); vero(!/Marchio del Guardiano/.test(t), "compare il taglio");
  eq(errori, [], "errori"); await chiudi();
});
caso("Gioco: contro Ettore (boss) Colpo del Coma non stordisce ma indebolisce, senza tiro salvezza", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG({ equipaggiamento: MARTELLO }), PARTITA({ livello: 4, usate: { riposo: "sbloccato", tecPreparate: ["maglio", "mento", "tremante", "costole", "coma", "ginocchia"] } }));
  await page.evaluate(() => avviaScontro("esploratore", { ctx: "ettore", testi: "esploratore", primo: "pg" })); await aspettaTurnoPg(page);
  await page.evaluate(() => { scontro.pv = 90; scontro.pvMax = 90; });
  await accoda(page, [R(19, 20), R(1, 8)]);
  await page.evaluate(() => usaTecnica(TECNICHE.find(t => t.id === "coma")));
  eq(await page.evaluate(() => [scontro.eff.bloccato || 0, scontro.eff.debole]), [0, 2]);
  vero(/troppo potente/.test(await diario(page)), "manca il messaggio dei boss"); eq(errori, [], "errori"); await chiudi();
});
caso("Gioco: un salvataggio con le vecchie tecniche contundenti lascia i posti vuoti", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG({ tecniche: ["spezzatendini", "clava"], equipaggiamento: MARTELLO }), PARTITA({ livello: 2, usate: { riposo: "sbloccato", tecPreparate: ["spezzatendini", "clava", "frantumaelmo"] } }));
  eq(await page.evaluate(() => tecnichePreparate().length), 0); eq(await page.evaluate(() => postiLiberi()), 4); eq(errori, [], "errori"); await chiudi();
});

/* ---------- Partita vera: perforanti ---------- */
const MAZZA = { arma: "Mazza chiodata", armaDanno: "1d6", armaTipoDanno: "Perforante", armaMani: 1, armatura: "Armatura media", armaturaCA: 4, malusAgilita: 0, scudo: null, dotazione: [] };
const PREPP = ["cuore", "varco", "giuntura", "trafittura", "perforazione", "ferita_profonda"];
caso("Gioco: Guerriero con la mazza — Mirare al Varco, Esposto nella scheda e attacco normale critico con 19", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG({ tecniche: ["cuore", "varco"], equipaggiamento: MAZZA }), PARTITA({ livello: 4, usate: { riposo: "sbloccato", tecPreparate: PREPP } }));
  await page.evaluate(() => avviaScontro("mastino", { primo: "pg", soffioScarico: true })); await aspettaTurnoPg(page);
  await page.evaluate(() => { scontro.pv = 80; scontro.pvMax = 80; });
  await accoda(page, [R(18, 20), R(2, 6), /* nemico: ricarica 1, zampata mancata */ R(1, 6), R(1, 20)], [0.9]);
  await page.evaluate(() => usaTecnica(TECNICHE.find(t => t.id === "varco"))); await aspettaTurnoPg(page);
  eq(await page.evaluate(() => scontro.eff.esposto), 1); vero(/Esposto/.test(await page.innerText("#schedaNem")), "scheda nemico senza Esposto");
  vero(/critico con un numero in meno/.test(await diario(page)), "manca il testo di Esposto");
  await accoda(page, [R(19, 20), R(1, 6), R(1, 6)]);
  await page.evaluate(() => attaccoPgScontro(false));
  vero(/critico con 19, colpisce sempre/.test(await diario(page)), "il 19 doveva essere critico"); eq(errori, [], "errori"); await chiudi();
});
caso("Gioco: via di Aldo con la mazza — Segno e Trapasso al livello 4, il segno aggiunge 1d4 finché è Esposto", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG({ tecniche: ["cuore", "varco"], equipaggiamento: MAZZA }), PARTITA({ livello: 4, usate: { riposo: "sbloccato", tecPreparate: PREPP, via: "aldo" } }));
  eq(await page.evaluate(() => tecnicheDelPg().filter(x => x.via).map(x => x.t.id)), ["segno", "trapasso"]);
  await page.evaluate(() => avviaScontro("mastino", { primo: "pg", soffioScarico: true })); await aspettaTurnoPg(page);
  await page.evaluate(() => { scontro.pv = 90; scontro.pvMax = 90; });
  await accoda(page, [R(18, 20), R(2, 6), R(1, 6), R(1, 20)], [0.9]);
  await page.evaluate(() => usaTecnica(TECNICHE.find(t => t.id === "segno"))); await aspettaTurnoPg(page);
  eq(await page.evaluate(() => [scontro.eff.esposto, scontro.segno]), [2, true]); vero(/segnato/.test(await page.innerText("#schedaNem")), "la scheda non mostra il segno");
  await accoda(page, [R(15, 20), R(2, 6), R(3, 4)]);
  await page.evaluate(() => attaccoPgScontro(false));
  vero(/Segno: \+3 danni/.test(await diario(page)), "manca il bonus del segno"); eq(errori, [], "errori"); await chiudi();
});
caso("Gioco: Guardia di Punta annulla il morso, contrattacco critico con 18 ed Esposto", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG({ equipaggiamento: MAZZA }), PARTITA({ livello: 4, usate: { riposo: "sbloccato", tecPreparate: ["cuore", "varco", "giuntura", "trafittura", "perforazione", "guardia_punta"] } }));
  await page.evaluate(() => avviaScontro("mastino", { primo: "pg", soffioScarico: true })); await aspettaTurnoPg(page);
  await page.evaluate(() => { scontro.pv = 60; scontro.pvMax = 60; });
  const prima = await page.evaluate(() => ({ df: pg.dannoFisico || 0, ira: pg.risorsaUsata || 0 }));
  await accoda(page, [R(1, 6), R(19, 20), R(18, 20), R(2, 6), R(3, 6)], [0.1]);
  await page.evaluate(() => usaTecnica(TECNICHE.find(t => t.id === "guardia_punta"))); await aspettaTurnoPg(page);
  const dopo = await page.evaluate(() => ({ df: pg.dannoFisico || 0, ira: pg.risorsaUsata || 0, esp: scontro.eff.esposto, pv: scontro.pv }));
  eq(dopo.df, prima.df, "danni subiti"); eq(dopo.ira, prima.ira + 7, "ira: solo il costo"); eq([dopo.esp, dopo.pv], [1, 60 - 8]);
  vero(/Critico \(18-20\): d20 18, critico!/.test(await diario(page)), "manca il critico del contrattacco"); eq(errori, [], "errori"); await chiudi();
});
caso("Gioco: contro Ettore (boss) Ferita Profonda lascia l'Esposto a 2 turni", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG({ equipaggiamento: MAZZA }), PARTITA({ livello: 4, usate: { riposo: "sbloccato", tecPreparate: PREPP } }));
  await page.evaluate(() => avviaScontro("esploratore", { ctx: "ettore", testi: "esploratore", primo: "pg" })); await aspettaTurnoPg(page);
  await page.evaluate(() => { scontro.pv = 90; scontro.pvMax = 90; });
  await accoda(page, [R(15, 20), R(1, 6), R(1, 6)]);
  await page.evaluate(() => usaTecnica(TECNICHE.find(t => t.id === "ferita_profonda")));
  eq(await page.evaluate(() => [scontro.eff.esposto, scontro.eff.debole]), [2, 2]);
  vero(/dura al massimo 2 turni/.test(await diario(page)), "manca il messaggio dei boss"); eq(errori, [], "errori"); await chiudi();
});
caso("Gioco: scelta della via con la mazza mostra le abilità perforanti", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG({ equipaggiamento: MAZZA }), PARTITA({ livello: 3, usate: { riposo: "sbloccato", tecPreparate: [] } }));
  await page.evaluate(() => apriSceltaVia());
  const t = await page.textContent("#prepBox"); vero(/Segno del Cacciatore/.test(t) && /Occhio Vigile/.test(t), "mancano le abilità perforanti"); vero(!/Sigillo del Demolitore/.test(t), "compare il contundente");
  eq(errori, [], "errori"); await chiudi();
});
caso("Gioco: un salvataggio con le perforanti tolte lascia i posti vuoti e tiene quelle rimaste", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG({ tecniche: ["plesso", "cuore"], equipaggiamento: MAZZA }), PARTITA({ livello: 2, usate: { riposo: "sbloccato", tecPreparate: ["plesso", "cuore", "zanzara", "stoccata_lat"] } }));
  eq(await page.evaluate(() => tecnichePreparate().map(t => t.id)), ["cuore"]); eq(await page.evaluate(() => postiLiberi()), 3); eq(errori, [], "errori"); await chiudi();
});

/* ---------- Gioco: scudo ---------- */
const SPADA_SCUDO = { arma: "Spada corta", armaDanno: "1d6", armaTipoDanno: "Tagliente", armaMani: 1, armatura: "Armatura media", armaturaCA: 4, malusAgilita: 0, scudo: { nome: "Scudo", ca: 1, malus: 1 }, dotazione: [] };
const danniMorso = (page, v) => page.evaluate((v) => Math.max(1, v + modNem("Lotta") + (Number(NEMICI[scontro.id].attacco) || 0) + (Number(scontro.bonusAtt) || 0)), v);
caso("Gioco: Assorbimento Minimale — il morso fa metà danni, 1 Carica nella scheda e testo nel diario", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG({ equipaggiamento: SPADA_SCUDO }), PARTITA({ livello: 1, usate: { riposo: "sbloccato", tecPreparate: ["polso", "morso_acciaio", "assorbimento"] } }));
  await page.evaluate(() => avviaScontro("mastino", { primo: "pg", soffioScarico: true })); await aspettaTurnoPg(page);
  await page.evaluate(() => { scontro.pv = 100; scontro.pvMax = 100; });
  const pieno = await danniMorso(page, 4);
  /* colpo di scudo mancato; nemico: ricarica 1, morso, d20 19, danno 4; presa: no */
  await accoda(page, [R(1, 20), R(1, 6), R(19, 20), R(4, 4)], [0.1, 0.99]);
  await page.evaluate(() => usaTecnica(TECNICHE.find(t => t.id === "assorbimento"))); await aspettaTurnoPg(page);
  eq(await page.evaluate(() => pg.dannoFisico || 0), Math.floor(pieno / 2), "metà danni");
  eq(await page.evaluate(() => scontro.cariche), 1);
  vero(/Carica Cinetica/.test(await page.innerText("#vitali")), "scheda senza la Carica"); vero(/assorbe metà del colpo/.test(await diario(page)), "manca il testo");
  eq(errori, [], "errori"); await chiudi();
});
caso("Gioco: dopo il Muro di Assorbimento la Postura Salda è rifiutata senza spendere ira", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG({ equipaggiamento: SPADA_SCUDO }), PARTITA({ livello: 2, usate: { riposo: "sbloccato", tecPreparate: ["polso", "postura_salda", "vipera", "muro", "batteria"] } }));
  await page.evaluate(() => avviaScontro("mastino", { primo: "pg", soffioScarico: true })); await aspettaTurnoPg(page);
  await accoda(page, [R(1, 6), R(19, 20), R(4, 4)], [0.1, 0.99]);
  await page.evaluate(() => usaTecnica(TECNICHE.find(t => t.id === "muro"))); await aspettaTurnoPg(page);
  eq(await page.evaluate(() => [pg.dannoFisico || 0, scontro.cariche]), [0, 3], "0 danni e 3 Cariche");
  const ira = await page.evaluate(() => pg.risorsaUsata);
  await page.evaluate(() => usaTecnica(TECNICHE.find(t => t.id === "postura_salda")));
  eq(await page.evaluate(() => pg.risorsaUsata), ira, "nessuna ira spesa"); eq(await page.evaluate(() => scontro.tuoTurno), true, "il turno resta tuo");
  vero(/due turni di fila/.test(await diario(page)), "manca l'avviso"); eq(errori, [], "errori"); await chiudi();
});
caso("Gioco: Postura Salda — il mastino manca, 1 Carica; se morde la Presa non scatta", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG({ equipaggiamento: SPADA_SCUDO }), PARTITA({ livello: 1, usate: { riposo: "sbloccato", tecPreparate: ["polso", "morso_acciaio", "postura_salda"] } }));
  await page.evaluate(() => avviaScontro("mastino", { primo: "pg", soffioScarico: true })); await aspettaTurnoPg(page);
  await accoda(page, [R(1, 6), R(1, 20)], [0.1]);
  await page.evaluate(() => usaTecnica(TECNICHE.find(t => t.id === "postura_salda"))); await aspettaTurnoPg(page);
  eq(await page.evaluate(() => scontro.cariche), 1, "Carica dal mancato");
  await page.evaluate(() => { scontro.difesaBloccata = false; }); /* solo per il test: un'altra Postura subito */
  await accoda(page, [R(1, 6), R(20, 20), R(1, 4), R(1, 4)], [0.1, 0.0]); /* morso critico, Presa forzata dal caso */
  await page.evaluate(() => usaTecnica(TECNICHE.find(t => t.id === "postura_salda"))); await aspettaTurnoPg(page);
  eq(await page.evaluate(() => scontro.presaUsata || false), false, "la Presa non deve partire"); eq(errori, [], "errori"); await chiudi();
});
caso("Gioco: Fortezza Eterna — il colpo mortale ti lascia a 1 di salute e dà 3 Cariche", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG({ equipaggiamento: SPADA_SCUDO }), PARTITA({ livello: 5, usate: { riposo: "sbloccato", tecPreparate: ["polso", "morso_acciaio"], via: "guendalina", viaSerie: "scudo" } }));
  eq(await page.evaluate(() => tecnicheDelPg().filter(x => x.via).map(x => x.t.id)), ["drenaggio", "sigillo_monolito", "fortezza_eterna"]);
  await page.evaluate(() => avviaScontro("mastino", { primo: "pg", soffioScarico: true })); await aspettaTurnoPg(page);
  await page.evaluate(() => { scontro.pv = 100; scontro.pvMax = 100; pg.dannoFisico = saluteMaxPg() - 2; disegnaVitali(); }); /* 2 di salute */
  await accoda(page, [R(19, 20), R(1, 6), R(1, 6), R(1, 6), R(19, 20), R(4, 4)], [0.1, 0.99]);
  await page.evaluate(() => usaTecnica(TECNICHE.find(t => t.id === "fortezza_eterna"))); await aspettaTurnoPg(page);
  eq(await page.evaluate(() => pvPg()), 1, "resta a 1"); eq(await page.evaluate(() => [scontro.cariche, scontro.fortezzaUsata]), [3, true]);
  vero(/Fortezza Eterna regge/.test(await diario(page)), "manca il testo"); eq(errori, [], "errori"); await chiudi();
});
caso("Gioco: al riposo si sceglie la serie della via (arma o scudo); senza scudo quelle dello scudo restano spente", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG({ equipaggiamento: SPADA_SCUDO }), PARTITA({ livello: 3, usate: { riposo: "sbloccato", tecPreparate: ["polso", "morso_acciaio", "vipera", "tendini", "eco"], via: "aldo" } }));
  eq(await page.evaluate(() => tecnicheDelPg().filter(x => x.via).map(x => x.t.id)), ["marchio"], "di partenza: serie dell'arma");
  await page.evaluate(() => apriPreparazione(false));
  vero(/Abilità della via/.test(await page.textContent("#prepBox")), "manca la scelta della serie");
  await page.check('#prepBox input[name="serie"][value="scudo"]'); await page.check('#prepBox input[name="tec"][value="assorbimento"]').catch(() => {});
  await page.click("#prepBox button.primario");
  eq(await page.evaluate(() => usate.viaSerie), "scudo"); eq(await page.evaluate(() => tecnicheDelPg().filter(x => x.via).map(x => [x.t.id, x.attiva])), [["marea_elastica", true]]);
  await page.evaluate(() => riponiScudo());
  eq(await page.evaluate(() => tecnicheDelPg().filter(x => x.via).map(x => [x.t.id, x.attiva])), [["marea_elastica", false]], "senza scudo: spenta");
  eq(errori, [], "errori"); await chiudi();
});
caso("Gioco: scelta della via mostra anche le abilità dello scudo", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG(), PARTITA({ livello: 3, usate: { riposo: "sbloccato", tecPreparate: [] } }));
  await page.evaluate(() => apriSceltaVia());
  const t = await page.textContent("#prepBox"); vero(/Marea Elastica/.test(t) && /Drenaggio d'Urto/.test(t), "mancano le abilità dello scudo"); vero(/Marchio del Guardiano/.test(t), "manca il taglio");
  eq(errori, [], "errori"); await chiudi();
});
caso("Gioco: un salvataggio con le vecchie tecniche di scudo lascia i posti vuoti", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG({ equipaggiamento: SPADA_SCUDO }), PARTITA({ livello: 2, usate: { riposo: "sbloccato", tecPreparate: ["polso", "morso_acciaio", "frontale", "vipera", "scagliata"] } }));
  eq(await page.evaluate(() => tecnichePreparate().map(t => t.id)), ["polso", "morso_acciaio", "vipera"]); eq(await page.evaluate(() => postiLiberi()), 2); eq(errori, [], "errori"); await chiudi();
});

/* ======================= Creazione e regolamento ======================= */
caso("Creazione: il Guerriero con la spada vede le 3 nuove tecniche di livello 1 e ne sceglie 2", async (b) => {
  const { page, errori, chiudi } = await apri(b, "creazione.html");
  await page.check('input[name="classe"][value="Soldato"]', { force: true });
  await page.check('input[name="arma"][value="0"]', { force: true });
  const nomi = await page.$$eval('#lista-tecniche input[name="tecnica"]', cs => cs.map(c => c.value)); eq(nomi, ["polso", "morso_acciaio", "pomolo"]);
  eq(errori, [], "errori"); await chiudi();
});
caso("Creazione: il Guerriero col martello vede le 3 contundenti di livello 1", async (b) => {
  const { page, errori, chiudi } = await apri(b, "creazione.html");
  await page.check('input[name="classe"][value="Soldato"]', { force: true });
  await page.check('input[name="arma"][value="3"]', { force: true });
  eq(await page.$$eval('#lista-tecniche input[name="tecnica"]', cs => cs.map(c => c.value)), ["maglio", "mento", "sbilanciante"]);
  eq(errori, [], "errori"); await chiudi();
});
caso("Creazione: il Guerriero con la mazza chiodata vede le 3 perforanti di livello 1", async (b) => {
  const { page, errori, chiudi } = await apri(b, "creazione.html");
  await page.check('input[name="classe"][value="Soldato"]', { force: true });
  await page.check('input[name="arma"][value="4"]', { force: true });
  eq(await page.$$eval('#lista-tecniche input[name="tecnica"]', cs => cs.map(c => c.value)), ["cuore", "spillo", "varco"]);
  eq(errori, [], "errori"); await chiudi();
});
caso("Creazione: il Guerriero con spada e scudo vede anche le 3 tecniche di scudo di livello 1", async (b) => {
  const { page, errori, chiudi } = await apri(b, "creazione.html");
  await page.check('input[name="classe"][value="Soldato"]', { force: true });
  await page.check('input[name="arma"][value="0"]', { force: true }); await page.check('input[name="scudo"]', { force: true });
  eq(await page.$$eval('#lista-tecniche input[name="tecnica"]', cs => cs.map(c => c.value)), ["polso", "morso_acciaio", "pomolo", "assorbimento", "postura_salda", "rimbalzo_marea"]);
  eq(errori, [], "errori"); await chiudi();
});
caso("Regolamento: posti, ira per livello, vie e boss in italiano e in inglese", async (b) => {
  const { page, errori, chiudi } = await apri(b, "regolamento.html");
  const t = await page.textContent("body");
  ["2 (livello 1), 4 (livello 2), 5 (livello 3), 6 (livello 4), 7 (livello 5)", "+1 ai livelli 1-2, +2 ai livelli 3-4, +3 al livello 5", "via di prestigio", "al massimo 2 turni", "Incrinatura", "Frattura", "Esposto", "18-20", "Carica Cinetica", "due turni di fila", "quale serie preparare"].forEach(x => vero(t.includes(x), "manca: " + x));
  await page.evaluate(() => { localStorage.setItem("lingua", "en"); }); await page.reload();
  const e = await page.textContent("body");
  ["2 (level 1), 4 (level 2)", "+1 at levels 1-2, +2 at levels 3-4, +3 at level 5", "prestige path", "Cracked", "Fractured", "Exposed", "18-20", "Kinetic Charge", "two turns in a row", "which set to prepare"].forEach(x => vero(e.includes(x), "manca: " + x));
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

caso("Gioco in inglese: Muro di Assorbimento con i testi inglesi dello scudo", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG({ equipaggiamento: SPADA_SCUDO }), PARTITA({ livello: 2, usate: { riposo: "sbloccato", tecPreparate: ["polso", "morso_acciaio", "vipera", "muro"] } }));
  await page.evaluate(() => localStorage.setItem("lingua", "en")); await page.reload(); await page.waitForTimeout(500);
  await page.evaluate(() => avviaScontro("mastino", { primo: "pg", soffioScarico: true })); await aspettaTurnoPg(page);
  await accoda(page, [R(1, 6), R(19, 20), R(4, 4)], [0.1, 0.99]);
  await page.evaluate(() => usaTecnica(TECNICHE.find(t => t.id === "muro"))); await aspettaTurnoPg(page);
  const d = await diario(page); vero(/swallows the blow/.test(d) && /Kinetic Charges/.test(d), "mancano i testi inglesi"); eq(errori, [], "errori"); await chiudi();
});

(async () => {
  const browser = await chromium.launch();
  let ko = 0;
  const scelti = process.env.SOLO ? casi.filter(c => c.nome.includes(process.env.SOLO)) : casi; /* SOLO="Scudo" per lanciarne solo alcuni */
  for (const { nome, fn } of scelti) {
    try { await fn(browser); console.log("OK     " + nome); }
    catch (e) { ko++; console.log("ERRORE " + nome + "\n       → " + e.message.split("\n")[0]); }
  }
  await browser.close();
  console.log(`\n${scelti.length - ko} / ${scelti.length} superati`);
  process.exit(ko ? 1 : 0);
})();
