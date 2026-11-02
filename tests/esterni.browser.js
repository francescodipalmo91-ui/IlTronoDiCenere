/* Test nel browser della nuova conformazione dell'esterno (30/10/2026).
   Uso: python3 -m http.server 8765 --bind 127.0.0.1, poi node tests/esterni.browser.js */
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


/* 30/10: fuori casa il giardino è il crocevia (nord cimitero, est cappella, ovest serra, a sud la foresta riporta indietro) e la foresta è a settori */
const FUORI = () => PARTITA({ luogo: "giardino", diario: [{ tipo: "narra", stanza: "giardino", righe: ["x"] }], usate: { riposo: "sbloccato", luce: "ok", chiave_portone: "presa", q4: "prova", giardino_visto: "si" } });
const prep = (page) => page.evaluate(() => { window.incontroZona = () => {}; });
const vai_ = async (page, t) => { await page.evaluate(x => gestisci(x), t); await page.waitForTimeout(250); return page.evaluate(() => luogo); };

caso("Esterni: punti cardinali dal giardino e ritorno", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG(), FUORI()); await prep(page);
  eq(await vai_(page, "vado a nord"), "cimitero");
  eq(await vai_(page, "torno indietro"), "giardino", "dal cimitero si torna da dove si è venuti");
  eq(await vai_(page, "vado a est"), "cappella");
  eq(await vai_(page, "vado al cimitero"), "cimitero", "porticina");
  eq(await vai_(page, "torno indietro"), "cappella", "torna alla cappella se si è passati dalla porticina");
  eq(await vai_(page, "torno in giardino"), "giardino");
  eq(await vai_(page, "ovest"), "serra");
  eq(await vai_(page, "torno alla fontana"), "giardino");
  eq(await vai_(page, "vado verso sud"), "giardino", "a sud non c'è un ingresso: la foresta riporta indietro");
  eq(await vai_(page, "vado all'orto"), "serra");
  eq(await vai_(page, "torno indietro"), "giardino");
  eq(errori, [], "errori"); await chiudi();
});

caso("Esterni: la foresta a settori, ingresso dal luogo confinante", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG(), FUORI()); await prep(page);
  await vai_(page, "vado nella foresta");
  vero((await diario(page)).includes("cimitero (nord)"), "dal giardino la foresta non è raggiungibile direttamente");
  await vai_(page, "vado alla serra");
  eq(await vai_(page, "vado nella foresta"), "pineta_ovest");
  eq(await vai_(page, "vado a nord"), "pineta");
  eq(await vai_(page, "vado a est"), "pineta_est");
  eq(await vai_(page, "vado a sud"), "pineta_est", "a sud della foresta est il bosco riporta indietro");
  eq(await vai_(page, "torno indietro"), "cappella");
  eq(await vai_(page, "vado nella foresta"), "pineta_est");
  eq(await page.evaluate(() => [zonaDi("pineta_est"), zonaDi("serra"), vista("pineta_ovest").titolo]), ["foresta", "fuori", "Foresta dei pini, ovest"]);
  eq(await page.evaluate(() => PROVE_DICHIARATE.pineta_est.Sopravvivenza), "pineta_erbe");
  eq(errori, [], "errori"); await chiudi();
});

caso("Esterni: la foresta che riporta indietro, senza costo (niente ingresso principale)", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG(), FUORI()); await prep(page);
  const prima = await page.evaluate(() => pg.dannoMentale || 0);
  eq(await vai_(page, "vado a sud"), "giardino");
  eq(await vai_(page, "scappo oltre le siepi"), "giardino");
  eq(await page.evaluate(() => typeof STANZE.ingresso), "undefined", "il luogo ingresso non deve esistere");
  await vai_(page, "vado alla serra"); await vai_(page, "vado nella foresta");
  eq(await vai_(page, "vado a ovest"), "pineta_ovest", "oltre il settore ovest si torna al limitare");
  eq(await vai_(page, "mi allontano dalla casa"), "pineta_ovest");
  vero((await diario(page)).includes("non c'è un'uscita"), "manca il testo del bosco che gira in tondo");
  eq(await page.evaluate(() => pg.dannoMentale || 0), prima, "allontanarsi non costa punti mentali");
  eq(errori, [], "errori"); await chiudi();
});

caso("Esterni: immagine del cimitero, con Enea finché è lì", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG(), FUORI());
  const img = () => page.evaluate(() => vista("cimitero").img.src);
  eq(await img(), "immagini/house/cimitero.webp");
  await page.evaluate(() => { usate.enea = "incontrato"; }); eq(await img(), "immagini/house/cimitero_enea.webp");
  await page.evaluate(() => { usate.enea = "risparmiato"; }); eq(await img(), "immagini/house/cimitero_enea.webp", "risparmiato resta al cimitero");
  await page.evaluate(() => { usate.enea = "morto"; }); eq(await img(), "immagini/house/cimitero.webp");
  eq(await page.evaluate(() => DIM_IMMAGINI.cimitero), [2848, 1600]);
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
