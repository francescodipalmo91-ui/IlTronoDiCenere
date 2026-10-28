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
  const log = await page.innerText("#svLog"); vero(!/Soffio Infuocato|Presa:/.test(log), "il mastino ha usato un attacco speciale"); vero(/Inibito/.test(await page.innerText("#svNem")), "scheda nemico senza lo stato");
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
  eq(dopo.pv, prima.pv, "salute"); eq(dopo.ira, prima.ira - 7, "ira: solo il costo"); eq(dopo.sang, 2, "sanguinamento 3 → 2 dopo il turno (28/10: durata comune 3)"); await chiudi();
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
  eq(await page.evaluate(() => pg.risorsaUsata), 3, "ira spesa"); eq(await page.evaluate(() => scontro.eff.sanguina), 3, "durata comune");
  vero(/Sanguinamento/.test(await page.innerText("#schedaNem")), "scheda nemico senza Sanguinamento");
  vero(/sanguina: 1d4 danni per 3 turni/i.test(await diario(page)), "manca il testo nel diario");
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
  eq(dopo.df, prima.df, "danni subiti"); eq(dopo.ira, prima.ira + 7, "ira: solo il costo"); eq(dopo.sang, 2, "sanguinamento 3 → 2"); eq(dopo.parata, false);
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
/* Arcanista con le scuole di js/magia.js: scuola principale Arcano, un incantesimo di Forza */
const ARC = (o) => PG(Object.assign({ classe: "Sapiente", scuola: "arcano", statistiche: { Vigore: 10, "Agilità": 12, Mente: 16, Spirito: 12 }, statisticheBase: { Vigore: 10, "Agilità": 12, Mente: 16, Spirito: 12 },
  modificatori: { Vigore: 0, "Agilità": 1, Mente: 3, Spirito: 1 }, tiroDado: { dado: 6, valore: 4 }, mana: 13, risorsa: null, tecniche: [], incantesimi: ["dardo_arcano", "scopri_carte", "pugno_forza"],
  equipaggiamento: { arma: "Bastone", armaDanno: "1d6", armaTipoDanno: "Contundente", armaMani: 2, armatura: "Armatura leggera", armaturaCA: 2, malusAgilita: 0, scudo: null, dotazione: [] } }, o || {}));
caso("Gioco: anche il mana dell'Arcanista cresce di mod Mente + livello, senza dado", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", ARC(), PARTITA());
  await page.evaluate(() => { guadagnaPE(5000); controllaLivello(); });
  eq(await page.evaluate(() => livelloPg()), 5, "fino al livello 5");
  eq(await page.evaluate(() => manaMax()), 39, "13, 18, 24, 31, 39 come l'ira");
  vero(/mod\. Mente \+3 \+ livello 3 → \+6/.test(await diario(page)), "manca la riga del mana"); eq(errori, [], "errori"); await chiudi();
});
caso("Gioco: Arcanista — capacità di classe, posti per livello e quote per scuola nella preparazione", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", ARC(), PARTITA({ livello: 3, usate: { riposo: "sbloccato" } }));
  eq(await page.evaluate(() => listaIncantesimi().map(i => i.id)), ["luce", "dardo_arcano", "scopri_carte", "pugno_forza"], "la Luce non occupa posti");
  eq(await page.evaluate(() => [incTotale(), incLiberi()]), [6, 3], "5 + 1 posti, 3 liberi");
  await page.evaluate(() => apriPreparazione(false));
  const box = '#prepBox input[name="inc"]';
  vero(await page.$eval(`${box}[value="spinta"]`, c => c.disabled), "l'altra scuola ha un solo posto: la seconda è bloccata");
  vero(await page.$eval("#prepBox button.primario", c => c.disabled), "non si conferma con posti vuoti");
  for (const id of ["marchio_arcano", "stasi", "specchio_rune"]) await page.check(`${box}[value="${id}"]`);
  vero(await page.$eval(`${box}[value="runa_arma"]`, c => c.disabled), "la scuola principale ha 5 posti: la sesta è bloccata");
  vero(await page.$$eval(`${box}[value="implosione"]`, l => l.length) === 1 && await page.$eval(`${box}[value="implosione"]`, c => c.disabled), "tutta la Forza resta bloccata");
  vero(!(await page.$eval("#prepBox button.primario", c => c.disabled)), "6 scelte: si conferma"); await page.click("#prepBox button.primario");
  eq((await page.evaluate(() => usate.incPreparati)).length, 6); eq(await page.evaluate(() => incLiberi()), 0); eq(errori, [], "errori"); await chiudi();
});
caso("Gioco: Arcanista — un posto nuovo si riempie subito, i posti già pieni restano fissi", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", ARC(), PARTITA({ livello: 2, usate: { riposo: "sbloccato" } }));
  eq(await page.evaluate(() => incLiberi()), 2, "livello 2: 4 + 1 posti, 3 pieni");
  await page.evaluate(() => apriPreparazione(true));
  const box = '#prepBox input[name="inc"]';
  vero(await page.$eval(`${box}[value="dardo_arcano"]`, c => c.disabled), "fuori dal riposo i posti pieni non si toccano");
  await page.check(`${box}[value="marchio_arcano"]`); await page.check(`${box}[value="stasi"]`);
  await page.click("#prepBox button.primario");
  eq((await page.evaluate(() => usate.incPreparati)).slice().sort(), ["dardo_arcano", "marchio_arcano", "pugno_forza", "scopri_carte", "stasi"], "i tre vecchi restano e i due nuovi si aggiungono");
  eq(await page.evaluate(() => incLiberi()), 0); eq(errori, [], "errori"); await chiudi();
});
caso("Gioco: Arcanista — via di prestigio (Frattura o Sutura) scelta una sola volta, con le sue tre abilità", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", ARC(), PARTITA({ livello: 5, usate: { riposo: "sbloccato" } }));
  await page.evaluate(() => apriSceltaVia()); await page.check('#prepBox input[value="guendalina"]'); await page.click("#prepBox button.primario");
  eq(await page.evaluate(() => usate.via), "guendalina"); eq(await page.evaluate(() => sceglieVia("aldo")), false, "non si cambia");
  const nomi = await page.$$eval("#incantesimi .nome-btn", l => l.map(x => x.textContent));
  for (const n of ["Filo di Rune", "Ricamo di Rune", "Quiete Assoluta"]) vero(nomi.includes(n), "manca " + n);
  eq(errori, [], "errori"); await chiudi();
});
caso("Gioco: Arcanista — in combattimento la Luce non serve e non costa mana", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", ARC(), PARTITA());
  await page.evaluate(() => avviaScontro("mastino", { primo: "pg", soffioScarico: true })); await aspettaTurnoPg(page);
  await page.evaluate(() => lanciaIncantesimo(incantesimoLuce()));
  eq(await page.evaluate(() => manaAttuale()), 13, "nessun mana speso"); eq(await page.evaluate(() => scontro.tuoTurno), true, "il turno resta tuo");
  eq(errori, [], "errori"); await chiudi();
});
caso("Gioco: nel buio del dungeon la Luce (capacità di classe) costa 1 mana e illumina", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", ARC(), PARTITA());
  eq(await page.evaluate(() => incantesimoLuce() && incantesimoLuce().id), "luce", "la capacità è riconosciuta come Luce");
  await page.evaluate(() => entraBuio()); eq(await page.evaluate(() => luogo), "buio", "entrato nel buio");
  await page.evaluate(() => lanciaIncantesimo(incantesimoLuce()));
  eq(await page.evaluate(() => manaAttuale()), 12, "1 mana speso"); eq(await page.evaluate(() => luogo), "atrio", "il dungeon si illumina: atrio");
  eq(errori, [], "errori"); await chiudi();
});
caso("Gioco: un Arcanista creato con il vecchio sistema (senza scuola) torna alla pagina iniziale", async (b) => {
  const { page, chiudi } = await apri(b, "gioco.html", ARC({ scuola: undefined, incantesimi: [{ id: "luce", nome: { it: "Luce", en: "Light" }, costo: 1 }] }), PARTITA());
  await page.waitForURL(/index\.html/, { timeout: 5000 }); await chiudi();
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
const danniMorso = (page, v) => page.evaluate((v) => { const D = NEMICI[scontro.id]; return Math.max(1, v + (D.dannoBonus != null ? D.dannoBonus : modNem("Lotta") + (Number(D.attacco) || 0) + (Number(scontro.bonusAtt) || 0))); }, v); /* 28/10: danno = dado + dannoBonus */
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
  const nomi = await page.$$eval('#lista-tecniche input[name="tecnica"]:not(:disabled)', cs => cs.map(c => c.value)); eq(nomi, ["polso", "morso_acciaio", "pomolo"]);
  eq(errori, [], "errori"); await chiudi();
});
caso("Creazione: il Guerriero col martello vede le 3 contundenti di livello 1", async (b) => {
  const { page, errori, chiudi } = await apri(b, "creazione.html");
  await page.check('input[name="classe"][value="Soldato"]', { force: true });
  await page.check('input[name="arma"][value="3"]', { force: true });
  eq(await page.$$eval('#lista-tecniche input[name="tecnica"]:not(:disabled)', cs => cs.map(c => c.value)), ["maglio", "mento", "sbilanciante"]);
  eq(errori, [], "errori"); await chiudi();
});
caso("Creazione: il Guerriero con la mazza chiodata vede le 3 perforanti di livello 1", async (b) => {
  const { page, errori, chiudi } = await apri(b, "creazione.html");
  await page.check('input[name="classe"][value="Soldato"]', { force: true });
  await page.check('input[name="arma"][value="4"]', { force: true });
  eq(await page.$$eval('#lista-tecniche input[name="tecnica"]:not(:disabled)', cs => cs.map(c => c.value)), ["cuore", "spillo", "varco"]);
  eq(errori, [], "errori"); await chiudi();
});
caso("Creazione: il Guerriero con spada e scudo vede anche le 3 tecniche di scudo di livello 1", async (b) => {
  const { page, errori, chiudi } = await apri(b, "creazione.html");
  await page.check('input[name="classe"][value="Soldato"]', { force: true });
  await page.check('input[name="arma"][value="0"]', { force: true }); await page.check('input[name="scudo"]', { force: true });
  eq(await page.$$eval('#lista-tecniche input[name="tecnica"]:not(:disabled)', cs => cs.map(c => c.value)), ["polso", "morso_acciaio", "pomolo", "assorbimento", "postura_salda", "rimbalzo_marea"]);
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
caso("Regolamento: classi, scuole di magia, stati ed esempi in italiano e in inglese", async (b) => {
  const { page, errori, chiudi } = await apri(b, "regolamento.html");
  /* indice a tendine: Parti › Capitoli › voci */
  const parti = await page.$$eval("#sezioni > details.parte > summary", s => s.map(x => x.textContent));
  eq(parti.length, 4, "quattro parti"); vero(/Parte 1/.test(parti[0]) && /Parte 4/.test(parti[3]), "numerazione delle parti");
  const titoli = await page.$$eval("#sezioni details.cap > summary .tt", s => s.map(x => x.textContent));
  eq(titoli.length, 14, "quattordici capitoli");
  ["Abilità", "Guerriero", "Sciamano", "Arcanista", "Monaco", "Esempi di combattimento"].forEach(x => vero(titoli.some(t => t.endsWith(": " + x)), "manca la sezione: " + x));
  eq(await page.$$eval("#sezioni details.parte[open]", l => l.length), 4, "le parti sono aperte all'inizio");
  eq(await page.$$eval("#sezioni details.cap[open]", l => l.length), 0, "i capitoli sono chiusi all'inizio");
  eq(await page.$$eval("#sezioni h3", l => l.length), 0, "ogni titoletto è diventato una tendina");
  await page.click("#apriTutto"); eq(await page.$$eval("#sezioni details:not([open])", l => l.length), 0, "Apri tutto"); await page.click("#chiudiTutto");
  eq(await page.$$eval("#sezioni details[open]", l => l.length), 4, "Comprimi lascia aperte solo le parti");
  const t = await page.textContent("body");
  ["Sigilli", "Detonazione", "Bilancia", "Nadir", "Crepuscolo", "Accecato", "Avvizzito", "Lume Arcano", "Via della Frattura", "Via della Brace", "Via della Lama", "Via dello Scoglio", "Dardo Arcano", "Abbraccio del Vuoto", "Turno 3.", "Punta di Mandragora", "Avvelenato", "Quando serve", "Indagare o Percezione", "Malus alle abilità di Agilità"].forEach(x => vero(t.includes(x), "manca: " + x)); /* lo Sciamano non è più «in preparazione» */
  /* 60 incantesimi e 12 abilità delle vie, tutte le tecniche del Guerriero in tabella */
  const righe = await page.$$eval("table tr", r => r.length);
  vero(righe > 60 + 12 + 85, "tabelle incomplete: " + righe);
  vero(!/Aldo|Guendalina/.test((await page.textContent("#sezioni")).replace(/«parlo con Guendalina»/g, "")), "il regolamento nomina i PNG delle vie");
  await page.evaluate(() => { localStorage.setItem("lingua", "en"); }); await page.reload();
  const e = await page.textContent("body");
  ["Seals", "Detonation", "Balance", "Twilight", "Blinded", "Withered", "Arcane Glow", "Path of the Fracture", "Path of the Ember", "Combat examples", "Shadow Monk", "When it helps", "Agility skill penalty"].forEach(x => vero(e.includes(x), "missing: " + x));
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

/* ======================= Arcanista: incantesimi in combattimento ======================= */
const INC_LANCIA = (id) => `lanciaIncantesimo(listaIncantesimi().find(i => i.id === "${id}"))`;
caso("Sala di prova: Arcanista — Dardo Arcano incide un Sigillo, Pugno di Forza lo fa detonare e restituisce mana", async (b) => {
  const { page, errori, chiudi } = await apri(b, "tutorial.html?prova");
  await page.selectOption("#pClasse", "arcanista"); await page.selectOption("#nTipo", "manichino"); await page.fill("#nPv", "200"); await page.dispatchEvent("#nPv", "change");
  await page.click("#svNuovo");
  vero(await page.$('[data-inc="dardo_arcano"]'), "manca il pulsante del Dardo"); eq(await page.$('[data-inc="ariete"]'), null, "l'Ariete è di livello 2");
  await page.evaluate(() => SalaProva.accoda(15, 5)); await page.click('[data-inc="dardo_arcano"]');
  let st = await page.evaluate(() => SalaProva.stato()); eq(st.s.sigilli, 1, "un Sigillo"); eq(st.pg.ira, st.pg.iraMax - 2, "mana −2");
  await page.evaluate(() => SalaProva.accoda(15, 4, 3)); await page.click('[data-inc="pugno_forza"]');
  st = await page.evaluate(() => SalaProva.stato()); eq(st.s.sigilli, 0, "Sigilli esplosi"); eq(st.pg.ira, st.pg.iraMax - 2 - 2 + 1, "−2 e +1 di Detonazione");
  vero(/Detonazione/.test(await page.textContent("#svLog")), "manca la Detonazione nel diario"); eq(errori, [], "errori"); await chiudi();
});
caso("Sala di prova: Arcanista — Sigilli sul nemico e difese (Specchio di Rune) fino al nemico che attacca", async (b) => {
  const { page, errori, chiudi } = await apri(b, "tutorial.html?prova");
  await page.selectOption("#pClasse", "arcanista"); await page.selectOption("#pLiv", "2"); await page.check("#nMorso"); await page.evaluate(() => { Math.random = () => 0.99; });
  await page.fill("#nPv", "200"); await page.dispatchEvent("#nPv", "change"); await page.click("#svNuovo");
  await page.evaluate(() => SalaProva.accoda(12, 20, 5)); await page.click('[data-inc="specchio_rune"]'); /* ricarica soffio, attacco 20 = critico: due dadi */
  const d = await page.textContent("#svLog"); vero(/Specchio di Rune/.test(d), "manca il lancio");
  const st = await page.evaluate(() => SalaProva.stato()); eq(st.s.sigilli, 1, "il colpo preso incide un Sigillo"); eq(await page.isDisabled('[data-inc="specchio_rune"]'), true, "non due turni di fila");
  eq(errori, [], "errori"); await chiudi();
});
caso("Sala di prova: i test del motore degli incantesimi girano anche nel browser", async (b) => {
  const { page, errori, chiudi } = await apri(b, "tutorial.html?prova"); await page.click("#svTestBtn");
  const esiti = await page.evaluate(() => window.esitiTestCombattimento); eq(esiti.filter(e => !e.ok), [], "test falliti"); vero(esiti.some(e => /Detonazione/.test(e.nome)), "mancano i test della magia");
  eq(errori, [], "errori"); await chiudi();
});
caso("Gioco: Arcanista lancia in scontro — Sigillo, costo, Detonazione e mana recuperato", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", ARC(), PARTITA());
  await page.evaluate(() => avviaScontro("mastino", { primo: "pg", soffioScarico: true })); await aspettaTurnoPg(page);
  await accoda(page, [R(15, 20), R(5, 8)]); await page.evaluate(() => lanciaIncantesimo(listaIncantesimi().find(i => i.id === "dardo_arcano")));
  eq(await page.evaluate(() => scontro.sigilli), 1, "un Sigillo"); eq(await page.evaluate(() => manaAttuale()), 11, "13 − 2");
  vero((await page.$$eval(".eff-nome", e => e.map(x => x.textContent))).some(t => /Sigilli/.test(t)), "i Sigilli non compaiono nella scheda del nemico");
  await accoda(page, [R(1, 6), R(1, 20)], [0.1]); await aspettaTurnoPg(page);
  const pv = await page.evaluate(() => scontro.pv);
  await accoda(page, [R(15, 20), R(5, 10), R(3, 6)]); await page.evaluate(() => lanciaIncantesimo(listaIncantesimi().find(i => i.id === "pugno_forza")));
  eq(await page.evaluate(() => scontro.sigilli), 0, "Sigillo esploso"); eq(await page.evaluate(() => manaAttuale()), 10, "11 − 2 + 1");
  eq(pv - (await page.evaluate(() => scontro.pv)), 5 + 3 + 3, "1d10 + mod Mente 3 (28/10) + 1d6 di Detonazione");
  vero(/Detonazione/.test(await diario(page)), "manca la Detonazione nel diario"); eq(errori, [], "errori"); await chiudi();
});
caso("Gioco: un incantesimo senza mana non parte e non spende nulla", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", ARC(), PARTITA({ risorsaUsata: 0 }));
  await page.evaluate(() => { pg.manaUsato = 12; avviaScontro("mastino", { primo: "pg", soffioScarico: true }); }); await aspettaTurnoPg(page);
  await page.evaluate(() => lanciaIncantesimo(listaIncantesimi().find(i => i.id === "dardo_arcano")));
  eq(await page.evaluate(() => manaAttuale()), 1, "nessuna spesa"); eq(await page.evaluate(() => scontro.tuoTurno), true, "il turno è ancora tuo"); eq(errori, [], "errori"); await chiudi();
});
caso("Gioco: Arcanista di livello 3 con la via Sutura — Filo di Rune compare nell'elenco e incide 2 Sigilli", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", ARC(), PARTITA({ livello: 3, usate: { riposo: "sbloccato", via: "guendalina" } }));
  vero(await page.evaluate(() => listaIncantesimi().some(i => i.id === "filo_rune")), "l'abilità della via deve essere lanciabile");
  await page.evaluate(() => avviaScontro("mastino", { primo: "pg", soffioScarico: true })); await aspettaTurnoPg(page);
  await page.evaluate(() => lanciaIncantesimo(listaIncantesimi().find(i => i.id === "filo_rune")));
  eq(await page.evaluate(() => scontro.sigilli), 2, "2 Sigilli"); eq(await page.evaluate(() => scontro.filo), true); eq(errori, [], "errori"); await chiudi();
});
caso("Gioco in inglese: la Detonazione si legge in inglese", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", ARC(), PARTITA());
  await page.evaluate(() => localStorage.setItem("lingua", "en")); await page.reload(); await page.waitForTimeout(500);
  await page.evaluate(() => { avviaScontro("mastino", { primo: "pg", soffioScarico: true }); scontro.sigilli = 2; }); await aspettaTurnoPg(page);
  await accoda(page, [R(15, 20), R(5, 10), R(3, 6), R(2, 6)]); await page.evaluate(() => lanciaIncantesimo(listaIncantesimi().find(i => i.id === "pugno_forza")));
  vero(/Detonation/.test(await diario(page)), "manca il testo inglese"); eq(await page.evaluate(() => manaAttuale()), 12, "13 − 2 + 1"); eq(errori, [], "errori"); await chiudi();
});

caso("Gioco: Pressione schiaccia il nemico all'inizio del suo turno; Muro di Forza alza la CA di 3", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", ARC({ incantesimi: ["pressione", "muro_forza", "specchio_rune"] }), PARTITA({ livello: 3 }));
  await page.evaluate(() => avviaScontro("mastino", { primo: "pg", soffioScarico: true })); await aspettaTurnoPg(page);
  const ca0 = await page.evaluate(() => caScontro());
  await accoda(page, [R(3, 20)]); await page.evaluate(() => lanciaIncantesimo(listaIncantesimi().find(i => i.id === "pressione")));
  eq(await page.evaluate(() => [scontro.eff.pressione, scontro.eff.debole]), [2, 2], "Pressione e Indebolito");
  const pv = await page.evaluate(() => scontro.pv);
  await accoda(page, [R(4, 6), R(1, 6), R(1, 20)], [0.1]); await aspettaTurnoPg(page);
  eq(pv - (await page.evaluate(() => scontro.pv)), 4, "1d6 della pressione");
  await accoda(page, [R(1, 6), R(1, 20)], [0.1]); await page.evaluate(() => lanciaIncantesimo(listaIncantesimi().find(i => i.id === "muro_forza")));
  eq(await page.evaluate(() => caScontro()), ca0 + 3, "+3 CA"); await aspettaTurnoPg(page); eq(errori, [], "errori"); await chiudi();
});
caso("Gioco: Specchio di Rune dimezza il primo colpo e incide un Sigillo sul mastino", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", ARC({ incantesimi: ["pressione", "muro_forza", "specchio_rune"] }), PARTITA({ livello: 3 }));
  await page.evaluate(() => avviaScontro("mastino", { primo: "pg", soffioScarico: true })); await aspettaTurnoPg(page);
  await accoda(page, [R(1, 6), R(20, 20), R(4, 4)], [0.1, 0.99]); /* ricarica, attacco 20 (critico), morso 1d4 ×2 */
  const pv0 = await page.evaluate(() => pvPg());
  await page.evaluate(() => lanciaIncantesimo(listaIncantesimi().find(i => i.id === "specchio_rune"))); await aspettaTurnoPg(page);
  eq(await page.evaluate(() => scontro.sigilli), 1, "1 Sigillo sul mastino");
  vero(await page.evaluate(() => pvPg()) > pv0 - 8, "il danno è dimezzato"); eq(errori, [], "errori"); await chiudi();
});

/* ======================= Monaco: incantesimi in combattimento ======================= */
const MON = (o) => PG(Object.assign({ classe: "Accolito", scuola: "luce", statistiche: { Vigore: 10, "Agilità": 12, Mente: 10, Spirito: 16 }, statisticheBase: { Vigore: 10, "Agilità": 12, Mente: 10, Spirito: 16 },
  modificatori: { Vigore: 0, "Agilità": 1, Mente: 0, Spirito: 3 }, tiroDado: { dado: 8, valore: 5 }, mana: 13, risorsa: null, tecniche: [], incantesimi: ["dardo_luce", "tocco_lenitivo", "tocco_avvizzente"],
  equipaggiamento: { arma: "Bastone", armaDanno: "1d6", armaTipoDanno: "Contundente", armaMani: 2, armatura: "Armatura leggera", armaturaCA: 2, malusAgilita: 0, scudo: null, dotazione: [] } }, o || {}));
const LANCIA = (id) => `lanciaIncantesimo(listaIncantesimi().find(i => i.id === "${id}"))`;
caso("Sala di prova: Monaco — la Bilancia si sposta e il Crepuscolo da Zenit restituisce fede", async (b) => {
  const { page, errori, chiudi } = await apri(b, "tutorial.html?prova");
  await page.selectOption("#pClasse", "monaco"); await page.selectOption("#nTipo", "manichino"); await page.fill("#nPv", "200"); await page.dispatchEvent("#nPv", "change");
  await page.click("#svNuovo");
  vero(await page.$('[data-inc="dardo_luce"]'), "manca il Dardo di Luce"); eq(await page.$('[data-inc="dardo_arcano"]'), null, "niente incantesimi dell'Arcanista");
  for (const id of ["scudo_fede", "scudo_fede", "scudo_fede"]) { await page.click(`[data-inc="${id}"]`); }
  let st = await page.evaluate(() => SalaProva.stato()); eq(st.s.bilancia, 3, "Luce 3");
  vero(/Zenit/.test(await page.textContent("#svNem, #svPg")), "la Bilancia deve mostrare Zenit");
  await page.evaluate(() => SalaProva.accoda(15, 3, 4)); await page.click('[data-inc="tocco_avvizzente"]');
  st = await page.evaluate(() => SalaProva.stato()); eq(st.s.bilancia, 0, "Crepuscolo: torna a 0"); eq(st.pg.ira, st.pg.iraMax - 1 - 1 - 1 - 2 + 1, "−1 −1 −1 e −2 del tocco, +1 di Crepuscolo");
  vero(/Crepuscolo/.test(await page.textContent("#svLog")), "manca il Crepuscolo nel diario"); eq(errori, [], "errori"); await chiudi();
});
caso("Sala di prova: Monaco — Avvizzire e il suo tic a inizio turno del nemico", async (b) => {
  const { page, errori, chiudi } = await apri(b, "tutorial.html?prova");
  await page.selectOption("#pClasse", "monaco"); await page.selectOption("#pLiv", "2"); await page.check("#nMorso"); await page.evaluate(() => { Math.random = () => 0.99; });
  await page.fill("#nPv", "200"); await page.dispatchEvent("#nPv", "change"); await page.click("#svNuovo");
  await page.evaluate(() => SalaProva.accoda(2, 3, 1, 1)); await page.click('[data-inc="avvizzire"]'); /* salvezza 2 fallita; tic 3; attacco 1 */
  const st = await page.evaluate(() => SalaProva.stato()); eq(st.s.eff.avvizzito, 2, "3 turni, uno già passato"); eq(st.s.pv, 200 - 3, "1d4 = 3");
  eq(errori, [], "errori"); await chiudi();
});
caso("Gioco: Monaco lancia — Dardo di Luce, costo in punti fede, Bilancia e Crepuscolo", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", MON(), PARTITA());
  await page.evaluate(() => avviaScontro("mastino", { primo: "pg", soffioScarico: true })); await aspettaTurnoPg(page);
  await accoda(page, [R(15, 20), R(6, 8)]); await page.evaluate((c) => eval(c), LANCIA("dardo_luce"));
  eq(await page.evaluate(() => manaAttuale()), 11, "13 − 2"); eq(await page.evaluate(() => scontro.bilancia), 1, "Luce 1");
  vero(/Bilancia: equilibrio → Luce 1/.test(await page.evaluate(() => document.getElementById("diario").textContent)), "manca la Bilancia nel diario");
  eq(errori, [], "errori"); await chiudi();
});
caso("Gioco: Monaco — da Nadir il Dardo di Luce è un Crepuscolo e la Bilancia torna a 0", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", MON(), PARTITA());
  await page.evaluate(() => { avviaScontro("mastino", { primo: "pg", soffioScarico: true }); scontro.bilancia = -3; }); await aspettaTurnoPg(page);
  await accoda(page, [R(15, 20), R(6, 8), R(2, 8)]); await page.evaluate((c) => eval(c), LANCIA("dardo_luce"));
  eq(await page.evaluate(() => scontro.bilancia), 0); eq(await page.evaluate(() => manaAttuale()), 13 - 2 + 2, "recupero doppio a livello 1");
  vero(/Crepuscolo/.test(await diario(page)), "manca il Crepuscolo"); eq(errori, [], "errori"); await chiudi();
});
caso("Gioco: Monaco — Tocco Lenitivo cura e Avvizzito fa male al nemico a inizio turno", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", MON({ incantesimi: ["tocco_lenitivo", "avvizzire", "tocco_avvizzente"] }), PARTITA({ livello: 2 }));
  await page.evaluate(() => { avviaScontro("mastino", { primo: "pg", soffioScarico: true }); pg.dannoFisico = 8; disegnaVitali(); }); await aspettaTurnoPg(page);
  const pv0 = await page.evaluate(() => pvPg());
  await accoda(page, [R(4, 8), R(1, 6), R(1, 20)], [0.1]); await page.evaluate((c) => eval(c), LANCIA("tocco_lenitivo")); await aspettaTurnoPg(page);
  eq(await page.evaluate(() => pvPg()) - pv0, 4 + 3, "1d8 + Spirito");
  await accoda(page, [R(2, 20)]); await page.evaluate((c) => eval(c), LANCIA("avvizzire")); eq(await page.evaluate(() => scontro.eff.avvizzito), 3, "Avvizzito 3");
  const pv = await page.evaluate(() => scontro.pv); await accoda(page, [R(3, 4), R(1, 6), R(1, 20)], [0.1]); await aspettaTurnoPg(page);
  eq(pv - (await page.evaluate(() => scontro.pv)), 3, "1d4 a inizio turno"); eq(errori, [], "errori"); await chiudi();
});
caso("Gioco: Monaco di livello 3 con la via Brace — Fiamma Calda è lanciabile e cura", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", MON(), PARTITA({ livello: 3, usate: { riposo: "sbloccato", via: "guendalina" } }));
  vero(await page.evaluate(() => listaIncantesimi().some(i => i.id === "fiamma_calda")), "l'abilità della via deve comparire");
  await page.evaluate(() => { avviaScontro("mastino", { primo: "pg", soffioScarico: true }); pg.dannoFisico = 10; disegnaVitali(); }); await aspettaTurnoPg(page);
  await accoda(page, [R(3, 6), R(4, 6)]); await page.evaluate((c) => eval(c), LANCIA("fiamma_calda"));
  eq(await page.evaluate(() => scontro.eff.fiamma), 2); eq(await page.evaluate(() => pvPg()) > 0, true); eq(errori, [], "errori"); await chiudi();
});
caso("Gioco in inglese: la Bilancia e il Crepuscolo si leggono in inglese", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", MON(), PARTITA());
  await page.evaluate(() => localStorage.setItem("lingua", "en")); await page.reload(); await page.waitForTimeout(500);
  await page.evaluate(() => { avviaScontro("mastino", { primo: "pg", soffioScarico: true }); scontro.bilancia = -3; }); await aspettaTurnoPg(page);
  await accoda(page, [R(15, 20), R(6, 8), R(2, 8)]); await page.evaluate((c) => eval(c), LANCIA("dardo_luce"));
  vero(/Twilight/.test(await diario(page)), "manca il testo inglese"); eq(errori, [], "errori"); await chiudi();
});

/* ======================= Cacce comuni e rastrelliere ======================= */
const USATE_CC = (o) => Object.assign({ riposo: "sbloccato", q4: "completata", fermaglio: "bronzo", udienze: ["bronzo"], cantina_cane: "sconfitto" }, o || {});
caso("Cacce: le rastrelliere sono una tendina con 8 sotto-tendine (Elisir compresa) e gli speciali restano bloccati", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG(), PARTITA({ luogo: "sala_caccia", usate: USATE_CC({ armeria_scelte: 1, cc_fatte_lista: [] }) }));
  await page.evaluate(() => mostraArmeria()); await page.waitForTimeout(300);
  const nomi = await page.evaluate(() => [...document.querySelectorAll(".voce.arm details.gruppo.sotto > summary")].map(x => x.textContent));
  eq(nomi, ["Armi", "Armature", "Scudi", "Dotazione", "Armi speciali", "Armature speciali", "Scudi speciali", "Elisir"]);
  eq(await page.evaluate(() => document.querySelector(".voce.arm details.gruppo > summary").textContent), "Rastrelliere della sala della caccia");
  eq(await page.evaluate(() => ARMERIA.filter(o => o.sblocco).map(o => [o.id, o.sblocco, o.cat])), [["lama_cervo", 2, "armi_sp"], ["cotta_leone", 4, "armature_sp"], ["anello_brace", 6, "dotazione"]]);
  await page.evaluate(() => prendiDallaRastrelliera(ARMERIA.find(o => o.id === "lama_cervo")));
  eq(await page.evaluate(() => usate.armeria_scelte), 1, "bloccata: la scelta non si spende");
  await page.evaluate(() => { usate.cc_fatte_lista = ["ratto", "corvo"]; prendiDallaRastrelliera(ARMERIA.find(o => o.id === "lama_cervo")); });
  eq(await page.evaluate(() => usate.armeria_scelte), 0);
  vero(await page.evaluate(() => zaino.some(x => x.tipo === "arma" && /Cervo/.test(x.nome) && x.danno === "1d8")), "manca la lama nello zaino");
  eq(errori, [], "errori"); await chiudi();
});
caso("Cacce: accetto, la preda mi aspetta in giardino, la abbatto e consegno il trofeo ad Aldo", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG(), PARTITA({ luogo: "sala_caccia", usate: USATE_CC() }));
  await page.evaluate(() => vai("sala_caccia")); await page.waitForTimeout(300);
  await page.evaluate(() => { accettaCaccia(1); }); await page.waitForTimeout(200);
  eq(await page.evaluate(() => [usate.cc_stato, usate.cc_grado, usate.caccia_n]), ["attiva", 1, 1]);
  vero(["ratto", "corvo"].includes(await page.evaluate(() => usate.cc_preda)), "preda di grado 1");
  await page.evaluate(() => { usate.cc_preda = "ratto"; accettaCaccia(2); }); /* una sola caccia alla volta */
  eq(await page.evaluate(() => usate.cc_grado), 1);
  await page.evaluate(() => vai("giardino")); await aspettaTurnoPg(page).catch(() => {});
  await page.waitForFunction(() => typeof scontro !== "undefined" && scontro && scontro.id === "ratto", null, { timeout: 8000 });
  eq(await page.evaluate(() => scontro.ctx), "caccia");
  await page.waitForFunction(() => scontro.tuoTurno, null, { timeout: 8000 });
  await page.evaluate(() => { scontro.pv = 1; }); await accoda(page, [R(19, 20), R(4, 6)]);
  await page.evaluate(() => attaccoPgScontro(false)); await aspettaFineScontro(page);
  eq(await page.evaluate(() => [usate.cc_stato, zaino.some(x => x.id === "trofeo_caccia")]), ["trofeo", true]);
  await page.evaluate(() => vai("sala_caccia")); await page.waitForTimeout(500);
  await page.evaluate(() => consegnaCaccia());
  await page.waitForFunction(() => usate.cc_stato === "", null, { timeout: 8000 });
  eq(await page.evaluate(() => [usate.cc_fatte_lista, usate.armeria_scelte, zaino.some(x => x.id === "trofeo_caccia")]), [["ratto"], 1, false]);
  eq(errori, [], "errori"); await chiudi();
});
caso("Cacce: il branco è una sola creatura che attacca due volte per turno", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG(), PARTITA({ luogo: "giardino", usate: USATE_CC() }));
  await page.evaluate(() => { NEMICI.branco.abilita = []; avviaScontro("branco", { ctx: "caccia", testi: "branco", primo: "nem", soffioScarico: true }); }); /* senza abilità a punti: solo i due attacchi */
  await accoda(page, [R(1, 20), R(1, 20)], [0.1, 0.9]);
  await aspettaTurnoPg(page);
  eq(await page.evaluate(() => scontro.turno.parti.length), 2, "due attacchi nel turno del branco");
  vero(await page.evaluate(() => scontro.pvMax >= 8 && scontro.pvMax <= 8 + 6 + 2), "salute condivisa del branco");
  eq(await page.evaluate(() => CB.nome), "Branco di segugi di cenere");
  eq(errori, [], "errori"); await chiudi();
});
caso("Cacce: se la preda ti abbatte muori (28/10: Aldo salva solo contro i guardiani)", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG(), PARTITA({ luogo: "giardino", usate: USATE_CC({ cc_stato: "attiva", cc_grado: 2, cc_preda: "lupo" }) }));
  await page.evaluate(() => avviaScontro("lupo", { ctx: "caccia", testi: "lupo", primo: "pg" })); await aspettaTurnoPg(page);
  await page.evaluate(() => { pg.dannoFisico = 999; sconfittaScontro(); });
  await page.waitForFunction(() => finePartita === true, null, { timeout: 8000 });
  vero(/parte di Casa Vespera/.test(await diario(page)), "manca la morte");
  eq(errori, [], "errori"); await chiudi();
});
caso("Cacce in inglese: le prede e i loro testi esistono", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG(), PARTITA({ luogo: "giardino", usate: USATE_CC() }));
  await page.evaluate(() => localStorage.setItem("lingua", "en")); await page.reload(); await page.waitForTimeout(500);
  await page.evaluate(() => avviaScontro("sciame", { ctx: "caccia", testi: "sciame", primo: "pg" })); await aspettaTurnoPg(page);
  eq(await page.evaluate(() => CB.nome), "Swarm of Ember Crows");
  eq(errori, [], "errori"); await chiudi();
});

caso("Creazione: il Guerriero vede subito tutte le tecniche, armi separate dallo scudo, e si prendono solo quelle sbloccate", async (b) => {
  const { page, errori, chiudi } = await apri(b, "creazione.html");
  await page.check('input[name="classe"][value="Soldato"]', { force: true });
  eq(await page.$$eval('#lista-tecniche .gruppo-tec', e => e.map(x => x.textContent)), ["Armi da taglio", "Armi contundenti", "Armi perforanti", "Scudo"]);
  eq(await page.$$eval('#lista-tecniche input[name="tecnica"]', e => e.length), 12, "tutte le 12 di livello 1");
  eq(await page.$$eval('#lista-tecniche input[name="tecnica"]:not(:disabled)', e => e.length), 0, "senza arma nessuna è prendibile");
  await page.check('input[name="arma"][value="0"]', { force: true });
  eq(await page.$$eval('#lista-tecniche input[name="tecnica"]', e => e.length), 12);
  eq(await page.$$eval('#lista-tecniche input[name="tecnica"]:not(:disabled)', cs => cs.map(c => c.value)), ["polso", "morso_acciaio", "pomolo"]);
  eq(errori, [], "errori"); await chiudi();
});
caso("Creazione: l'Arcanista vede subito gli incantesimi di entrambe le scuole, non selezionabili finché non sceglie", async (b) => {
  const { page, errori, chiudi } = await apri(b, "creazione.html");
  await page.check('input[name="classe"][value="Sapiente"]', { force: true });
  const tot = await page.$$eval('input[name="incantesimo"]', e => e.length);
  vero(tot >= 6, "gli incantesimi devono essere visibili subito: " + tot);
  eq(await page.$$eval('input[name="incantesimo"]:not(:disabled)', e => e.length), 0);
  const primo = await page.$eval('input[name="scuola"]', e => e.value);
  await page.check(`input[name="scuola"][value="${primo}"]`, { force: true });
  vero(await page.$$eval('input[name="incantesimo"]:not(:disabled)', e => e.length) > 0, "dopo la scelta si sbloccano");
  eq(errori, [], "errori"); await chiudi();
});

/* ======================= Decisioni di storia e di interfaccia ======================= */
caso("Atrio: «vado a destra» sul pianerottolo prende la rampa; «lancia lume arcano» al buio accende la luce", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG(), PARTITA());
  await page.evaluate(() => { usate.scale = "ok"; });
  eq(await page.evaluate(() => interpreta(norm("vado a destra"))), "rampa_dx");
  eq(await page.evaluate(() => interpreta(norm("vado a sinistra"))), "rampa_sx");
  eq(await page.evaluate(() => interpretaBuio(norm("lancia lume arcano"))), "lancia_luce");
  eq(await page.evaluate(() => interpretaBuio(norm("lancio luce"))), "lancia_luce");
  eq(errori, [], "errori"); await chiudi();
});
caso("Abilità: nove, Indagare e Percezione separate; chi aveva Investigazione è addestrato in entrambe", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG({ abilita: [{ nome: "Investigazione", attributo: "Mente", valore: 1 }] }), PARTITA());
  eq(await page.evaluate(() => Regole.ABILITA.length), 9);
  eq(await page.evaluate(() => Regole.ABILITA.filter(a => a[1] === "Mente").map(a => a[0])), ["Indagare", "Percezione", "Sapienza"]);
  eq(await page.evaluate(() => [addestrata("Indagare"), addestrata("Percezione"), addestrata("Sapienza")]), [true, true, false]);
  eq(errori, [], "errori"); await chiudi();
});
caso("Giardino: siepi (Sopravvivenza e Indagare col giocattolo), fontana a quattro strade, statue con Percezione", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG(), PARTITA({ luogo: "atrio" }));
  await page.evaluate(() => vai("giardino"));
  eq(await page.evaluate(() => [interpretaAltrove(norm("esamino la siepe")), interpretaAltrove(norm("indago sulla siepe")), interpretaAltrove(norm("prendo il giocattolo tra le siepi"))]),
    ["giardino_siepi_tracce", "giardino_siepi_indaga", "giocattolo_siepe"]);
  eq(await page.evaluate(() => [LUOGHI.giardino_siepi_tracce.prova.abilita, LUOGHI.giardino_siepi_tracce.prova.cd, LUOGHI.giardino_siepi_indaga.prova.abilita, LUOGHI.giardino_siepi_indaga.prova.cd, LUOGHI.giardino_statue.prova.abilita, LUOGHI.giardino_statue.prova.cd]),
    ["Sopravvivenza", 12, "Indagare", 10, "Percezione", 13]);
  eq(await page.evaluate(() => FONTANA_ABILITA), ["Indagare", "Sopravvivenza", "Sapienza", "Intuizione"]);
  await page.evaluate(() => esaminaFontana());
  eq(await page.$$eval("#azioni button, #scelte button", x => x.filter(b => b.offsetParent && /^\[/.test(b.textContent)).length), 4, "quattro strade per la fontana");
  await page.evaluate(() => { chiudiScelte(); trovaPagina(1, true); });
  eq(await page.evaluate(() => [pagineTrovate().includes(1), usate.pagine_non_lette]), [true, [1]], "pagina messa via senza leggerla");
  eq(errori, [], "errori"); await chiudi();
});
caso("Sconfitta con Ettore: risveglio con Aldo, sala della caccia bloccata, al ritorno Ettore combatte e non si arrende più", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG(), PARTITA({ luogo: "atrio", usate: { riposo: "sbloccato", q4: "accettata", ettore: "risparmiato" } }));
  await page.evaluate(() => { vai("cripta"); usate.ettore = "scontro"; avviaScontroEttore(); }); /* si entra senza dialogo, poi lo scontro */
  await page.waitForFunction(() => !!scontro, null, { timeout: 8000 }); /* lo scontro parte dopo la sua presentazione */
  await page.evaluate(() => sconfittaScontro());
  await page.waitForFunction(() => luogo === "sala_caccia", null, { timeout: 8000 });
  eq(await page.evaluate(() => [usate.ettore, usate.ettore_sconfitte, usate.caccia_rimprovero, aldoNellaSalaCaccia()]), ["rivincita", 1, true, true]);
  await page.evaluate(() => gestisci("vado nella sala dei trofei")); await page.waitForTimeout(300);
  eq(await page.evaluate(() => luogo), "sala_caccia", "Aldo blocca la sala dei trofei");
  await page.evaluate(() => scrittura); /* i comandi aspettano la fine della frase di Aldo */
  await page.evaluate(() => gestisci("torno nell'atrio")); await page.waitForTimeout(300);
  eq(await page.evaluate(() => [luogo, usate.caccia_rimprovero]), ["atrio", false], "uscire si può");
  eq(await page.evaluate(() => IMG_MASTINI_ALDO.map(x => x.split("/").pop())), ["Mastino_aldo_destra.webp", "Mastino_aldo_sinistra.webp"]);
  /* ferite della mente: −1 al massimo per sconfitta contro un guardiano, al massimo −3; si recupera vincendo o risparmiando */
  const base = await page.evaluate(() => maxMentali() + feriteMente());
  eq(await page.evaluate(() => [usate.ferite_mente.ettore, feriteMente()]), [1, 1], "prima sconfitta: −1");
  await page.evaluate(() => { feritaGuardiano("ettore", "Ettore"); feritaGuardiano("ettore", "Ettore"); feritaGuardiano("ettore", "Ettore"); });
  eq(await page.evaluate(() => [feriteMente(), maxMentali()]), [3, base - 3], "mai oltre −3");
  await page.evaluate(() => guarisciFerita("ettore", "Ettore"));
  eq(await page.evaluate(() => [feriteMente(), maxMentali()]), [0, base], "battuto o risparmiato: il massimo torna");
  eq(errori, [], "errori"); await chiudi();
});
caso("Pianerottolo: stanza a sé tra atrio, anticamera e corridoio; «torno indietro» dal primo piano porta qui", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG(), PARTITA({ luogo: "atrio" }));
  const g = async (t) => { await page.evaluate(x => gestisci(x), t); await page.waitForTimeout(300); return page.evaluate(() => luogo); };
  await page.evaluate(() => vai("atrio"));
  eq(await g("salgo le scale"), "pianerottolo", "atrio → pianerottolo");
  eq(await page.evaluate(() => document.getElementById("diario").textContent.includes(SCALE.domanda)), true, "la prima salita fa partire il richiamo");
  await page.evaluate(() => { usate.scale = "no"; chiudiScelte(); });
  eq(await g("prendo la rampa di sinistra"), "anticamera_trono");
  eq(await g("torno indietro"), "pianerottolo", "dall'anticamera si torna sul pianerottolo");
  eq(await g("vado a destra"), "corridoio_primo");
  eq(await g("torno indietro"), "pianerottolo", "dal corridoio si torna sul pianerottolo");
  eq(await g("torno nell'atrio"), "atrio");
  eq(errori, [], "errori"); await chiudi();
});
caso("Aldo: risposte nuove dalla porta principale, quelle di sempre dalla scala di servizio", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG(), PARTITA({ luogo: "atrio" }));
  const risposte = (ingr) => page.evaluate((ingr) => { usate.dialogo_aldo_ingresso = ingr; luogo = "sala_ballo"; mostraStanza("sala_ballo"); mostraRisposte("aldo", "inizio");
    return [...document.querySelectorAll("button")].filter(b => b.offsetParent && /^\[/.test(b.textContent)).map(b => b.textContent); }, ingr);
  const O = await page.evaluate(() => DLG_PROVE.it.aldo.ospiti);
  const osp = await risposte("ospiti"), ser = await risposte("servizio");
  eq(osp.length, 4); vero([O.osserva, O.gentile, O.duro, O.minaccia].every(f => osp.some(t => t.includes(f))), "porta principale: risposte nuove");
  eq(ser.length, 4); vero(!ser.some(t => t.includes(O.duro)), "porta di servizio: risposte di sempre");
  vero(await page.evaluate(() => !DLG().aldo.nodi.inizio.testo.ospiti.join(" ").includes("topo che ha trovato")), "tolta la frase del topo");
  eq(errori, [], "errori"); await chiudi();
});
caso("Spada del Retaggio: primo tocco con la visione, una chiamata per lacrima (Intuizione), poi il gesto", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG(), PARTITA({ luogo: "atrio" }));
  await page.evaluate(() => { usate.scale = "no"; usate.scale_visione = true; }); /* armatura già toccata */
  eq(await page.evaluate(() => { scale(); return document.getElementById("diario").textContent.includes(SCALE.attesa[0]); }), true, "senza lacrime la spada tace");
  await accoda(page, [R(1, 20)]);
  await page.evaluate(() => { usate.q3 = "completata"; provaRichiamo(); }); await page.click("#azioni button, #scelte button"); await page.waitForTimeout(300);
  eq(await page.evaluate(() => [usate.scale, usate.spada_chiamate, chiamateLibere()]), ["attesa", 1, 0], "prova fallita: chiamata consumata");
  await accoda(page, [R(20, 20)]);
  await page.evaluate(() => { usate.lacrima2 = true; provaRichiamo(); }); await page.click("#azioni button, #scelte button"); await page.waitForTimeout(300);
  eq(await page.evaluate(() => usate.scale), "gesto", "prova superata: si sceglie il gesto");
  await page.evaluate(() => { const b = [...document.querySelectorAll("#azioni button, #scelte button")].find(x => x.textContent === SCALE.gestoBtn.inginocchia); b.click(); });
  await page.waitForTimeout(300);
  eq(await page.evaluate(() => usate.scale), "ok", "inginocchiarsi apre la spada");
  await page.evaluate(() => { usate.scale = "attesa"; usate.spada_chiamate = 3; usate.lacrima3 = true; });
  eq(await page.evaluate(() => { scale(); return document.getElementById("diario").textContent.includes(SCALE.esaurita[0]); }), true, "tre chiamate fallite: la spada tace");
  eq(errori, [], "errori"); await chiudi();
});
caso("Anello del Primo Vespera: CD 12 e visione del funerale una sola volta", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG(), PARTITA({ luogo: "cripta" }));
  eq(await page.evaluate(() => LUOGHI.cripta_sarcofago.prova.cd), 12);
  await accoda(page, [R(2, 4)]);
  await page.evaluate(() => sarcofago(true)); await page.click("#azioni button, #scelte button"); await page.waitForTimeout(300);
  eq(await page.evaluate(() => [usate.flash_anello, document.getElementById("diario").textContent.includes(A2.anello.visione[3])]), [true, true]);
  eq(await page.evaluate(() => pg.dannoMentale || 0), 2, "1d4 mentale");
  eq(errori, [], "errori"); await chiudi();
});

/* ======================= Cripta (28/10): fuoco, buio, sarcofagi, discesa furtiva, conteggio ======================= */
const testoDiario = (page, espr) => page.evaluate((e) => document.getElementById("diario").textContent.includes(eval(e)), espr); /* espr: testo atteso, valutato nella pagina */
caso("Cripta: con Ettore vivo niente riposo né legna; poi un'ora di fuoco, il riposo brucia una fascina", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG(), PARTITA({ luogo: "cripta", usate: { riposo: "sbloccato", ettore: "incontrato", dialogo_ettore: "scelta" } }));
  await page.evaluate(() => { luogo = "cripta"; zaino.push({ id: "legna", nome: "Fascina di legna", tipo: "dotazione", usi: 3 }); zaino.push({ id: "razioni_adele", nome: "Razioni di Adele", tipo: "consumabile", qta: 6 }); pg.dannoFisico = 5; riposa(); });
  vero(await testoDiario(page, `A2.braciere.rifiuto[0].slice(0, 40)`), "Ettore deve rifiutare il riposo");
  await page.evaluate(() => alimentaFuoco());
  vero(await testoDiario(page, `A2.braciere.legnaEttore[0].slice(0, 30)`), "Ettore deve rifiutare la legna");
  eq(await page.evaluate(() => zaino.find(x => x.id === "legna").usi), 3, "la legna non si consuma");
  await page.evaluate(() => { usate.ettore = "morto"; fuocoDiEttoreLasciato(); });
  eq(await page.evaluate(() => braciereAcceso()), true, "il fuoco di Ettore resta un'ora");
  await page.evaluate(() => riposa()); await page.waitForTimeout(200);
  eq(await page.evaluate(() => [braciereAcceso(), usate.braciere_fine]), [false, 0], "il riposo brucia l'unica ora");
  await page.evaluate(() => { chiudiScelte(); alimentaFuoco(); alimentaFuoco(); alimentaFuoco(); });
  eq(await page.evaluate(() => [braciereAcceso(), Math.round((usate.braciere_fine - Date.now()) / ORA_FUOCO), zaino.some(x => x.id === "legna")]), [true, 3, false], "tre fascine, tre ore");
  await page.evaluate(() => { zaino.push({ id: "legna", nome: "Fascina di legna", tipo: "dotazione", usi: 3 }); alimentaFuoco(); alimentaFuoco(); alimentaFuoco(); });
  eq(await page.evaluate(() => [Math.round((usate.braciere_fine - Date.now()) / ORA_FUOCO), zaino.find(x => x.id === "legna").usi]), [5, 1], "al massimo cinque ore");
  vero(await testoDiario(page, `A2.braciere.pieno`), "braciere colmo");
  eq(errori, [], "errori"); await chiudi();
});
caso("Cripta: il buio arriva solo al rientro; torcia per vedere, fascina per riaccendere", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG(), PARTITA({ luogo: "cappella", usate: { riposo: "sbloccato", ettore: "risparmiato", visitate: { cripta: 1 } } }));
  await page.evaluate(() => { usate.braciere_fine = Date.now() + 1000; vai("cripta"); });
  eq(await page.evaluate(() => [usate.cripta_buia, !!document.querySelector("#diario img.scena.buia")]), [false, false], "fuoco acceso: la cripta si vede");
  await page.waitForTimeout(1200);
  eq(await page.evaluate(() => [braciereAcceso(), criptaBuia()]), [false, false], "spento mentre sei dentro: l'immagine non cambia");
  await page.evaluate(() => { vai("cappella"); vai("cripta"); });
  eq(await page.evaluate(() => [criptaBuia(), !!document.querySelector("#diario img.scena.buia")]), [true, true], "al rientro è buio");
  await page.fill("#testo", "esamino il sarcofago"); await page.press("#testo", "Enter"); await page.waitForTimeout(300);
  vero(await testoDiario(page, `A2.braciere.buioAzione[0]`), "al buio non si vede nulla");
  await page.evaluate(() => { zaino.push({ id: "torcia", nome: "Torcia", tipo: "dotazione", usi: 2 }); });
  await page.fill("#testo", "accendo la torcia"); await page.press("#testo", "Enter"); await page.waitForTimeout(300);
  eq(await page.evaluate(() => [criptaBuia(), braciereAcceso()]), [false, false], "la torcia fa luce ma non accende il braciere");
  await page.evaluate(() => riposa());
  vero(await testoDiario(page, `LUOGHI.cripta_braciere_spento.fisso[0].slice(0, 30)`), "senza braciere non si riposa");
  await page.evaluate(() => { vai("cappella"); vai("cripta"); zaino.push({ id: "legna", nome: "Fascina di legna", tipo: "dotazione", usi: 1 }); });
  await page.fill("#testo", "metto la legna nel braciere"); await page.press("#testo", "Enter"); await page.waitForTimeout(300);
  eq(await page.evaluate(() => [criptaBuia(), braciereAcceso()]), [false, true], "la fascina accende anche al buio");
  vero(await testoDiario(page, `A2.braciere.accesaBuio[0].slice(0, 30)`), "testo della fascina al buio");
  eq(errori, [], "errori"); await chiudi();
});
caso("Cripta: Indagare sul sarcofago di Rodolfo e Adele dà la pagina IV; il Primo dei Vespera aspetta il quaderno", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG(), PARTITA({ luogo: "cripta", usate: { riposo: "sbloccato", ettore: "morto", braciere_fine: Date.now() + 3600000, visitate: { cripta: 1 } } }));
  await page.evaluate(() => vai("cripta"));
  eq(await page.evaluate(() => interpretaAltrove(norm("indago il sarcofago di rodolfo e adele"))), "cripta_nicchie");
  eq(await page.evaluate(() => PROVE_DICHIARATE.cripta.Indagare), "cripta_nicchie");
  eq(await page.evaluate(() => { LUOGHI.cripta_nicchie.poi(true); return pagineTrovate().includes(4); }), true, "la pagina IV");
  eq(await page.evaluate(() => interpretaAltrove(norm("apro il sarcofago del primo dei vespera"))), "cripta_sarcofago");
  await page.evaluate(() => esamina("cripta_sarcofago"));
  vero(await testoDiario(page, `LUOGHI.cripta_primo_chiuso.fisso[0].slice(0, 40)`), "senza quaderno il coperchio resta sigillato");
  eq(await page.evaluate(() => !!document.querySelector("#azioni:not([hidden]) button")), false, "nessuna prova di Atletica");
  await page.evaluate(() => { usate.diario_aperto = true; esamina("cripta_sarcofago"); });
  eq(await page.evaluate(() => !!document.querySelector("#azioni:not([hidden]) button")), true, "con il quaderno aperto la prova c'è");
  eq(errori, [], "errori"); await chiudi();
});
caso("Cripta: discesa furtiva riuscita, scelta tra farsi avanti e colpire; il conteggio mostra il numero e a volte la frase", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG(), PARTITA({ luogo: "cappella", usate: { riposo: "sbloccato", q4: "accettata", ettore_tracce: "ko" } }));
  eq(await page.evaluate(() => { applicaTracce(); return LUOGHI.cripta_furtiva.prova.cd; }), 14, "tracce fallite: CD 14");
  await page.evaluate(() => { usate.ettore_tracce = true; applicaTracce(); usate.ettore_sorpreso = true; vai("cripta"); });
  vero(await testoDiario(page, `STANZE.cripta.introFurtiva[1].slice(0, 40)`), "descrizione della discesa furtiva");
  await page.waitForSelector("#azioni:not([hidden]) button, #scelte button", { timeout: 5000 });
  const bottoni = await page.evaluate(() => [...document.querySelectorAll("#azioni button, #scelte button")].map(x => x.textContent));
  const etich = await page.evaluate(() => [A2.furtivo.avanti, A2.furtivo.colpisci]);
  vero(bottoni.includes(etich[0]) && bottoni.includes(etich[1]), "mancano le due scelte: " + bottoni);
  await page.evaluate(() => [...document.querySelectorAll("#azioni button, #scelte button")].find(x => x.textContent === A2.furtivo.avanti).click());
  await page.waitForTimeout(500);
  eq(await page.evaluate(() => [usate.dialogo_ettore, usate.ettore_sorpresa_usata]), ["inizio_furtivo", true], "dialogo furtivo, sorpresa persa");
  const conta = await page.evaluate(() => { scontro = { conta: 0, pv: 30, pvMax: 30 }; const r = []; for (let i = 0; i < 12; i++) r.push(contaEttore()); scontro = null; return r; });
  eq([conta[0].riga, conta[1].riga, conta[3].riga, conta[9].riga, conta[10].riga, conta[10].dodici, conta[11].riga], await page.evaluate(() => [ET.conta[0], ET.numeri[1], ET.conta[3], ET.conta[9], ET.scontro.dodici, true, ET.conta[0]]), "numero, frasi e dodicesimo colpo all'undicesimo attacco");
  eq(errori, [], "errori"); await chiudi();
});

/* ======================= Ettore in combattimento (28/10) ======================= */
caso("Ettore: livello 2 fisso (30 salute, 8 punti abilità, 400 PE), crescita oltre il livello 2, vulnerabile a contundente e forza", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG(), PARTITA({ luogo: "cripta", usate: { riposo: "sbloccato", ettore: "scontro" } }));
  await page.evaluate(() => { luogo = "cripta"; avviaScontro("esploratore", { ctx: "ettore", testi: "esploratore", primo: "pg" }); }); await aspettaTurnoPg(page);
  eq(await page.evaluate(() => [scontro.pvMax, scontro.paMax, scontro.stat.Vigore, scontro.stat.Spirito, NEMICI.esploratore.xp, dadiVuln("Contundente"), dadiVuln("Forza"), dadiVuln("Tagliente")]), [30, 8, 12, 8, 400, 1, 1, 0], "28/10: Vigore 12");
  vero(await page.evaluate(() => document.getElementById("vitaliNem").textContent.includes(ET.scontro.pa) || !scontro.svelata), "punti abilità nella scheda");
  await page.evaluate(() => { scontro.svelata = true; disegnaNemico(); });
  vero(await page.evaluate(() => document.getElementById("vitaliNem").textContent.includes("8 / 8") && document.getElementById("specNem").textContent.includes(ET.scontro.abilita[1][0])), "scheda con punti abilità e abilità");
  await page.evaluate(() => { chiudiScontro("vinto"); scontro = null; pg.livello = 3; avviaScontro("esploratore", { ctx: "ettore", testi: "esploratore", primo: "pg", conta: 3 }); }); await aspettaTurnoPg(page);
  eq(await page.evaluate(() => [scontro.pvMax, scontro.paMax, scontro.bonusAtt, scontro.conta]), [35, 9, 1, 3], "livello 3: +5 salute, +1 PA, +1 per colpire; rivincita da tre");
  eq(errori, [], "errori"); await chiudi();
});
caso("Ettore: fendente sporco e Sanguinamento, braci sotto metà salute, colpo basso dopo una difesa, la gamba, conto perso", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG(), PARTITA({ luogo: "cripta", usate: { riposo: "sbloccato", ettore: "scontro" } }));
  await page.evaluate(() => { luogo = "cripta"; avviaScontro("esploratore", { ctx: "ettore", testi: "esploratore", primo: "pg" }); }); await aspettaTurnoPg(page);
  await accoda(page, [R(18, 20), R(3, 6), R(1, 20)], [0.1]);
  await page.evaluate(() => { scontro.tuoTurno = false; attaccoNemScontro(); });
  eq(await page.evaluate(() => [scontro.pa, haStato("sangue")]), [6, true], "fendente: 2 PA e Sanguinamento");
  await page.waitForTimeout(3500); await aspettaTurnoPg(page);
  eq(await page.evaluate(() => [haStato("sangue"), document.getElementById("diario").textContent.includes(BT.stati.sangue.tick(1, 1, 1).split(":")[0])]), [true, true], "il sangue scorre all'inizio del tuo turno");
  await accoda(page, [R(1, 20), R(3, 4)]);
  eq(await page.evaluate(() => { scontro.pv = 14; const fine = abilitaEttorePrimaDiAttaccare(); return [fine, scontro.braciUsate, scontro.pa, haStato("ustione")]; }), [true, true, 3, true], "le braci");
  await page.waitForTimeout(3500); await aspettaTurnoPg(page);
  await accoda(page, [R(2, 4)]);
  eq(await page.evaluate(() => { pg.dannoFisico = 0; scontro.difesaUltima = true; const fine = abilitaEttorePrimaDiAttaccare(); return [fine, scontro.colpoBassoUsato, scontro.pa]; }), [false, true, 0], "colpo basso, poi l'attacco"); /* 28/10: gli stati sono letali, si riparte da salute piena */
  eq(await page.evaluate(() => { scontro.gamba = true; return [abilitaEttorePrimaDiAttaccare(), scontro.gamba]; }), [true, false], "la gamba: perde il turno");
  eq(await page.evaluate(() => { scontro.conta = 5; scontro.metaContata = false; return contaEttore().riga === ET.scontro.perso && scontro.conta === 1; }), true, "sotto metà salute perde il conto");
  await page.waitForTimeout(3000);
  await page.evaluate(() => { if (scontro) { chiudiScontro("vinto"); scontro = null; } });
  eq(await page.evaluate(() => haStato("sangue")), false, "il Sanguinamento finisce con lo scontro");
  eq(errori, [], "errori"); await chiudi();
});

(async () => {
  const browser = await chromium.launch();
  let ko = 0;
  const scelti = process.env.SOLO ? casi.filter(c => c.nome.includes(process.env.SOLO)) : casi; /* SOLO="Scudo" per lanciarne solo alcuni */
  if (process.env.PARTE) { const [i, n] = process.env.PARTE.split("/").map(Number); scelti.splice(0, scelti.length, ...scelti.filter((_, k) => k % n === i - 1)); } /* PARTE="2/4": un quarto dei casi, per i computer con poca memoria */
  for (const { nome, fn } of scelti) {
    try { await fn(browser); console.log("OK     " + nome); }
    catch (e) { ko++; console.log("ERRORE " + nome + "\n       → " + e.message.split("\n")[0]); }
  }
  await browser.close();
  console.log(`\n${scelti.length - ko} / ${scelti.length} superati`);
  process.exit(ko ? 1 : 0);
})();
