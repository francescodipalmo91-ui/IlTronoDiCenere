/* Test nel browser delle cacce comuni (01/11/2026): finestre tra un fermaglio e l'altro, studio di Aldo (★ e ★★),
   studio del giocatore (★★★: guardare, studiare, avvicinarsi), resistenze e i quattro stati nuovi del personaggio.
   Uso: python3 -m http.server 8765 --bind 127.0.0.1, poi node tests/cacce.browser.js */
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



const U0 = (o) => Object.assign({ riposo: "sbloccato", q4: "completata", udienze: ["bronzo"], portone_aperto: true }, o || {});
const bottone = (page, testo) => page.locator("#azioni button", { hasText: testo }).first();

caso("Cacce: finestre per fermaglio; ★ con lo studio di Aldo nel diario e nelle Missioni; una finestra chiusa non si accetta", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG(), PARTITA({ luogo: "sala_caccia", diario: [{ tipo: "narra", stanza: "sala_caccia", righe: ["x"] }], usate: U0({ fermaglio: "argento" }) }));
  eq(await page.evaluate(() => [0, 1, 2, 3].map(finestraAperta)), [true, true, false, false], "argento: aperte le prime due finestre");
  eq(await page.evaluate(() => CacceComuni.ids.length), 8, "otto cacce");
  await page.evaluate(() => accettaCaccia("troll"));
  eq(await page.evaluate(() => usate.cc_stato || ""), "", "il troll è dopo l'oro");
  await page.evaluate(() => accettaCaccia("bruto"));
  eq(await page.evaluate(() => [usate.cc_stato, usate.cc_preda]), ["attiva", "bruto"]);
  await page.waitForFunction(() => document.getElementById("diario").textContent.includes("Studio di Aldo"), null, { timeout: 15000 });
  vero((await diario(page)).includes("vulnerabile a illusione; resistente a contundente"), "nota di Aldo");
  vero((await page.evaluate(() => document.getElementById("missioni").textContent)).includes("Studio di Aldo"), "nota nelle Missioni");
  eq(await page.evaluate(() => [cacciaQui("giardino"), cacciaQui("pineta")]), [true, false], "★ in giardino");
  eq(errori, [], "errori in console"); await chiudi();
});

caso("Cacce ★★★: Aldo è cieco; guardare con un tiro alto rivela tre voci, avvicinarsi fallito fa partire lo scontro con la preda per prima", async (b) => {
  const st = { Vigore: 12, "Agilità": 12, Mente: 18, Spirito: 12 };
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG({ statistiche: st, statisticheBase: st }), PARTITA({ luogo: "pineta", diario: [{ tipo: "narra", stanza: "pineta", righe: ["x"] }], usate: U0({ fermaglio: "oro", cc_stato: "attiva", cc_preda: "troll", cc_grado: 3, cc_info: {}, cc_studio: {} }) }));
  eq(await page.evaluate(() => [aldoSa("troll"), cacciaQui("pineta"), cacciaQui("giardino")]), [false, true, false]);
  await page.evaluate(() => imboscataCaccia());
  await bottone(page, "Percezione").click();
  await accoda(page, [R(20, 20)]);
  await bottone(page, "d20").click(); await page.waitForTimeout(400);
  eq(await page.evaluate(() => Object.keys(usate.cc_info).sort()), ["aspetto", "danno", "primaria"], "20 + 4 = 24 ≥ 12 + 10: tutte e tre le voci viste");
  vero((await page.evaluate(() => document.getElementById("missioni").textContent)).includes("Hai scoperto"), "le voci nelle Missioni");
  await page.waitForSelector("#azioni:not([hidden]) button");
  await bottone(page, "Furtività").click();
  await accoda(page, [R(1, 20), R(20, 20)]);
  await bottone(page, "d20").click();
  await page.waitForFunction(() => typeof scontro !== "undefined" && scontro && scontro.id === "troll", null, { timeout: 10000 });
  eq(await page.evaluate(() => [scontro.primo, !!scontro.scoperto]), ["nem", true], "scoperto: agisce lui e tu −2 CA");
  eq(errori, [], "errori in console"); await chiudi();
});

caso("Cacce: resistenze e vulnerabilità del troll; Sapienza da vicino con 20 naturale scopre la scheda", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG(), PARTITA({ luogo: "pineta", diario: [{ tipo: "narra", stanza: "pineta", righe: ["x"] }], usate: U0({ fermaglio: "oro", cc_stato: "attiva", cc_preda: "troll", cc_grado: 3, cc_info: {}, cc_studio: { vicino: true, avvicina: true, guarda: true } }) }));
  await page.evaluate(() => imboscataCaccia());
  await bottone(page, "Sapienza").click();
  await accoda(page, [R(20, 20), R(3, 20)]);
  await bottone(page, "d20").click(); await page.waitForTimeout(400);
  vero(await page.evaluate(() => !!usate.cc_info.tutto), "20 naturale da vicino: tutto");
  vero((await diario(page)).includes("Vantaggio: due d20"), "vantaggio mostrato");
  await page.waitForSelector("#azioni:not([hidden]) button");
  await bottone(page, "Attacco").click();
  await page.waitForFunction(() => typeof scontro !== "undefined" && scontro && scontro.id === "troll", null, { timeout: 10000 });
  eq(await page.evaluate(() => [scontro.svelata, scontro.primo, !!scontro.sorpreso]), [true, "pg", true], "scheda scoperta e sorpresa");
  eq(await page.evaluate(() => [resisteA("Perforante"), resisteA("Tagliente"), dadiVuln("Tagliente"), ctxTecnica().dimezza]), [true, false, 1, false], "spada corta: niente resistenza, +1 dado");
  eq(errori, [], "errori in console"); await chiudi();
});

caso("Stati nuovi del personaggio: Sbilanciato −2 CA, Frastornato −4 e niente critici, Inibito blocca le tecniche, Stordito salta il turno", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", PG(), PARTITA({ luogo: "giardino", diario: [{ tipo: "narra", stanza: "giardino", righe: ["x"] }], usate: U0({ fermaglio: "bronzo" }) }));
  await page.evaluate(() => { avviaScontro("bruto", { ctx: "caccia", testi: "bruto", primo: "pg", sorpresa: "x" }); });
  await page.waitForFunction(() => scontro && scontro.tuoTurno, null, { timeout: 10000 });
  await page.evaluate(() => { applicaStatoPg("sbilanciato"); applicaStatoPg("frastornato"); applicaStatoPg("inibito"); });
  eq(await page.evaluate(() => [malusStatoCA(), malusStatoAtt(), ctxTecnica().noCrit]), [-2, -4, true]);
  await page.evaluate(() => usaTecnica(TEC.find(t => t.id === "polso") || TEC[0]));
  vero((await diario(page)).includes("Sei Inibito"), "Inibito blocca la tecnica");
  await page.evaluate(() => { applicaStatoPg("stordito"); scontro.tuoTurno = false; turnoPgScontro(); });
  vero((await diario(page)).includes("perdi il turno"), "Stordito: turno saltato");
  eq(await page.evaluate(() => [haStato("stordito"), scontro.tuoTurno]), [false, false], "lo stato se ne va e il turno passa");
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
