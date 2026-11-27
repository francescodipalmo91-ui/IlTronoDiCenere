/* Test nel browser: sala d'allenamento (gioco.html?allenamento), 27/11/2026.
   Lo scontro di prova è il vero scontro col Mastino con un Guerriero fisso; il salvataggio reale non si tocca.
   Uso: python3 -m http.server 8765 --bind 127.0.0.1, poi node tests/allenamento.browser.js */
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
  await page.addInitScript(() => {
    if (!sessionStorage.getItem("inizializzato")) {
      sessionStorage.setItem("inizializzato", "1"); localStorage.clear(); localStorage.setItem("trono_ritmo", "veloce");
      localStorage.setItem("personaggio", "SALVATAGGIO-REALE"); localStorage.setItem("partita", "PARTITA-REALE");
    }
  });
  await page.goto(BASE + "gioco.html?allenamento");
  await page.waitForTimeout(800);
  return { page, errori, chiudi: () => ctx.close() };
}

caso("Allenamento: parte lo scontro col Mastino, il Guerriero è fisso e il salvataggio reale resta intatto", async (b) => {
  const { page, errori, chiudi } = await apri(b);
  vero(await page.evaluate(() => !!scontro && scontro.id === "mastino"), "scontro col mastino in corso");
  eq(await page.evaluate(() => pg.classe + "/" + pg.nome), "Soldato/Recluta");
  vero((await page.textContent("body")).includes("SALA D'ALLENAMENTO"), "introduzione");
  await page.evaluate(() => { salvaUsate(); });
  const altra = await page.context().newPage(); await altra.goto(BASE + "index.html");
  eq(await altra.evaluate(() => [localStorage.getItem("personaggio"), localStorage.getItem("partita")]), ["SALVATAGGIO-REALE", "PARTITA-REALE"], "salvataggio reale");
  eq(errori, [], "errori"); await chiudi();
});
caso("Allenamento: la vittoria segna il tutorial come completato e non tocca la partita reale", async (b) => {
  const { page, errori, chiudi } = await apri(b);
  await page.evaluate(() => vittoriaScontro());
  vero((await page.textContent("body")).includes("Addestramento completato"), "messaggio finale");
  const altra = await page.context().newPage(); await altra.goto(BASE + "index.html");
  eq(await altra.evaluate(() => localStorage.getItem("tutorial_completato")), "1");
  eq(await altra.evaluate(() => localStorage.getItem("partita")), "PARTITA-REALE");
  eq(errori, [], "errori"); await chiudi();
});

caso("Allenamento: giocando con comandi scritti lo scontro finisce (vittoria o sconfitta) con il messaggio finale", async (b) => {
  const { page, errori, chiudi } = await apri(b);
  for (let i = 0; i < 60; i++) {
    if (await page.evaluate(() => !scontro)) break;
    await page.waitForFunction(() => !scontro || !document.querySelector("#testo").disabled, null, { timeout: 15000 });
    if (await page.evaluate(() => !scontro)) break;
    await page.fill("#testo", "attacco il mastino"); await page.press("#testo", "Enter"); await page.waitForTimeout(200);
  }
  vero(await page.evaluate(() => !scontro), "lo scontro è finito");
  const t = await page.textContent("body");
  vero(t.includes("Addestramento completato") || t.includes("riprovare"), "messaggio finale");
  eq(errori, [], "errori"); await chiudi();
});

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
