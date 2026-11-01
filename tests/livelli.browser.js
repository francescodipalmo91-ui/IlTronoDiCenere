/* Test nel browser della crescita di livello (01/11/2026): il livello arriva con i PE ma si applica al primo riposo,
   con 2 punti attributo da distribuire; le CD delle prove salgono con il livello applicato.
   Uso: python3 -m http.server 8765 --bind 127.0.0.1, poi node tests/livelli.browser.js */
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
  classeArmatura: 14, mana: null, risorsa: { id: "furia", max: 13 }, incantesimi: [], tecniche: ["polso", "morso_acciaio"],
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
      sessionStorage.setItem("inizializzato", "1"); localStorage.clear(); localStorage.setItem("trono_ritmo", "veloce");
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



caso("Livelli: con i PE arriva l'annuncio, ma il livello resta 1 fino al riposo", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG({ esperienza: 350 }), PARTITA({ esperienza: 350, diario: [{ tipo: "narra", stanza: "cucina", righe: ["x"] }] }));
  await page.evaluate(() => controllaLivello());
  eq(await page.evaluate(() => [pg.livello || 1, livelloMaturato(), livelliPronti(), cdProva(10)]), [1, 2, 1, 10], "prima del riposo");
  vero((await diario(page)).includes("livello 2"), "annuncio del livello");
  eq(errori, [], "errori in console"); await chiudi();
});

caso("Livelli: al riposo si distribuiscono 2 punti (tetto 20), poi salute e risorse crescono e la CD sale di 1", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG({ esperienza: 350 }), PARTITA({ esperienza: 350, diario: [{ tipo: "narra", stanza: "cucina", righe: ["x"] }] }));
  await page.evaluate(() => { controllaLivello(); riposa(); });
  await page.waitForSelector("#finestraPrep:not([hidden]) .riga-attr");
  const conferma = page.locator("#finestraPrep .azioni button.primario");
  eq(await conferma.isDisabled(), true, "conferma bloccata finché restano punti");
  const piu = page.locator("#finestraPrep .riga-attr").first().locator("button").nth(1);
  await piu.click(); await piu.click();
  eq(await piu.isDisabled(), true, "finiti i punti, il + si blocca");
  const prima = await page.evaluate(() => saluteMaxPg());
  await conferma.click(); await page.waitForTimeout(200);
  eq(await page.evaluate(() => [pg.livello, pg.statistiche.Vigore, livelliPronti(), cdProva(10)]), [2, 18, 0, 11], "dopo il riposo");
  /* Vigore 18 → mod +4: crescita = metà del d10 + 1 + 4 = 10 */
  eq(await page.evaluate(() => saluteMaxPg()) - prima, 10, "salute calcolata con il nuovo modificatore");
  eq(errori, [], "errori in console"); await chiudi();
});

caso("Livelli: due livelli in attesa → due finestre di fila; un attributo a 20 non sale", async (b) => {
  const st = { Vigore: 20, "Agilità": 12, Mente: 10, Spirito: 12 };
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG({ esperienza: 1100, statistiche: st, statisticheBase: st }), PARTITA({ esperienza: 1100, diario: [{ tipo: "narra", stanza: "cucina", righe: ["x"] }] }));
  await page.evaluate(() => { controllaLivello(); riposa(); });
  for (let k = 0; k < 2; k++) {
    await page.waitForSelector("#finestraPrep:not([hidden]) .riga-attr");
    const righe = page.locator("#finestraPrep .riga-attr");
    eq(await righe.first().locator("button").nth(1).isDisabled(), true, "Vigore a 20");
    const piuAg = righe.nth(1).locator("button").nth(1); await piuAg.click(); await piuAg.click();
    await page.locator("#finestraPrep .azioni button.primario").click(); await page.waitForTimeout(250);
  }
  eq(await page.evaluate(() => [pg.livello, pg.statistiche["Agilità"], pg.statistiche.Vigore]), [3, 16, 20]);
  eq(errori, [], "errori in console"); await chiudi();
});

(async () => {
  const browser = await chromium.launch();
  let ko = 0;
  for (const { nome, fn } of casi) {
    try { await fn(browser); console.log("OK     " + nome); }
    catch (e) { ko++; console.log("ERRORE " + nome + "\n       → " + e.message); }
  }
  await browser.close();
  console.log(`\n${casi.length - ko} / ${casi.length} superati`);
  process.exit(ko ? 1 : 0);
})();
