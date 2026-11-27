/* Test nel browser: la creazione del personaggio non ha più incantesimi, tecniche né mana (pulizia del vecchio motore, 27/11/2026).
   Uso: python3 -m http.server 8765 --bind 127.0.0.1, poi node tests/creazione.browser.js */
const { chromium } = require("playwright");
const BASE = process.env.BASE || "http://127.0.0.1:8765/";
const casi = [];
const caso = (nome, fn) => casi.push({ nome, fn });
const eq = (a, b, msg) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${msg || "atteso"}: ${JSON.stringify(b)}, ottenuto ${JSON.stringify(a)}`); };
const vero = (x, msg) => { if (!x) throw new Error(msg || "atteso vero"); };

async function apri(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  const errori = [];
  page.on("pageerror", e => errori.push(e.message));
  page.on("console", m => { if (m.type() === "error" && !/Failed to load resource|ERR_|net::|firebase|gstatic|googleapis/i.test(m.text())) errori.push(m.text()); });
  await ctx.route(/^(?!http:\/\/127\.0\.0\.1)/, r => r.abort());
  await page.addInitScript(() => { if (!sessionStorage.getItem("inizializzato")) { sessionStorage.setItem("inizializzato", "1"); localStorage.clear(); } });
  await page.goto(BASE + "creazione.html");
  return { page, errori, chiudi: () => ctx.close() };
}

for (const classe of ["Soldato", "Forestiero", "Sapiente", "Accolito"]) {
  caso(`Creazione ${classe}: scelta classe e arma senza errori, niente incantesimi né tecniche né mana, specializzazioni presenti`, async (b) => {
    const { page, errori, chiudi } = await apri(b);
    await page.$eval(`input[name="classe"][value="${classe}"]`, e => e.click());
    await page.$eval('input[name="arma"][value="0"]', e => e.click());
    eq(await page.$$eval('input[name="incantesimo"], input[name="tecnica"]', e => e.length), 0, "vecchie liste");
    eq(await page.$("#mana-box"), null, "riquadro mana");
    vero((await page.$$eval('#lista-spec input[name="spec"], #lista-spec input', e => e.length)) > 0, "specializzazioni");
    eq(errori, [], "errori"); await chiudi();
  });
}

(async () => {
  const b = await chromium.launch();
  let ok = 0;
  for (const c of casi) {
    try { await c.fn(b); ok++; console.log("OK    ", c.nome); } catch (e) { console.log("FALLITO", c.nome, "\n      ", e.message); }
  }
  await b.close();
  console.log(`\n${ok} / ${casi.length} superati`);
  process.exit(ok === casi.length ? 0 : 1);
})();
