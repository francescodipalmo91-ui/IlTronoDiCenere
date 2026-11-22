/* Test nel browser di Dafne, la guardiana d'oro (22/11/2026; riscrittura_meccaniche.md 8d, storia_retaggio_e_set.md «Corno»).
   Solo motore nuovo: caccia d'oro dalla bacheca, foresta (attacca a vista), Furtività d'apertura, fase nascosta («Cerco Dafne»),
   stacco col mastino, dialogo a 0 (Gentile/Minaccioso) e morte, stocco + corno + fermaglio d'oro, Aldo senza il corno, sconfitta senza morte.
   Uso: python3 -m http.server 8765 --bind 127.0.0.1, poi node tests/dafne.browser.js */
const { chromium } = require("playwright");
const BASE = process.env.BASE || "http://127.0.0.1:8765/";
const casi = [];
const caso = (nome, fn) => casi.push({ nome, fn });
const eq = (a, b, msg) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${msg || "atteso"}: ${JSON.stringify(b)}, ottenuto ${JSON.stringify(a)}`); };
const vero = (x, msg) => { if (!x) throw new Error(msg || "atteso vero"); };

const PG = () => ({
  nome: "Prova", razza: "Umano", classe: "Soldato", livello: 4, immagine: null, motore: 2, spec: "berserker",
  scelte: ["colpo_poderoso", "colpo_di_mestiere", "spezza_guardia", "assalto_implacabile", "colpo_crudele", "colpo_del_boia"],
  statisticheBase: { Vigore: 16, "Agilità": 12, Mente: 12, Spirito: 12 }, statistiche: { Vigore: 16, "Agilità": 12, Mente: 12, Spirito: 12 },
  modificatori: { Vigore: 3, "Agilità": 1, Mente: 1, Spirito: 1 }, tiroDado: { dado: 10, valore: 10 }, puntiVita: 35, saluteMentale: 33,
  classeArmatura: 14, mana: null, risorsa: null, incantesimi: [], tecniche: [], modalita: "facile", idPartita: "test",
  abilita: [{ nome: "Atletica", attributo: "Vigore", valore: 5 }, { nome: "Sopravvivenza", attributo: "Spirito", valore: 3 }],
  equipaggiamento: { arma: "Spada corta", armaDanno: "1d6", armaTipoDanno: "Tagliente", armaMani: 1, armatura: "Armatura media", armaturaCA: 4, malusAgilita: 0, scudo: null, dotazione: [] }
});
const PARTITA = (o) => Object.assign({
  usate: { riposo: "sbloccato", fermaglio: "argento", q4: "completata", q5: "completata", udienze: ["bronzo", "argento"], portone_aperto: true, ettore: "morto", enea: "morto", q1: "completata" },
  diario: [{ tipo: "narra", stanza: "sala_caccia", righe: ["x"] }], luogo: "sala_caccia", livello: 4,
  crescita: { salute: 0, mente: 0, risorsa: 0 }, risorsaUsata: 0, esperienza: 3000, ora: Date.now(), zaino: []
}, o || {});

async function apri(browser, pg, partita) {
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
      localStorage.setItem("personaggio", JSON.stringify(pg)); localStorage.setItem("partita", JSON.stringify(partita));
    }
  }, [pg, partita]);
  await page.goto(BASE + "gioco.html");
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(800);
  return { page, errori, chiudi: () => ctx.close() };
}
/* aspetta un pulsante di scelta che contiene il testo e lo preme */
async function premi(page, testo, ms = 60000) { /* intanto clicca sul diario: salta la scrittura a macchina */
  const b = page.locator("#azioni button", { hasText: testo }).first(), fine = Date.now() + ms;
  while (Date.now() < fine) {
    if (await b.isVisible().catch(() => false) && await b.isEnabled().catch(() => false)) return b.click();
    await page.evaluate(() => document.getElementById("diario").click()).catch(() => {});
    await page.waitForTimeout(250);
  }
  throw new Error("pulsante non comparso: " + testo);
}
/* dadi pilotati: i prossimi valori di Math.random, poi di nuovo casuali */
const dadi = (page, q) => page.evaluate((q) => { const R = window.__R || (window.__R = Math.random); window.__q = [...q]; Math.random = () => window.__q.length ? window.__q.shift() : R(); }, q);
/* entra nella foresta e aspetta l'inizio dello scontro con Dafne */
async function nellaForesta(page, q) {
  await dadi(page, q);
  await page.evaluate(() => vai("pineta"));
  for (let i = 0; i < 80 && !(await page.evaluate(() => !!scontro)); i++) await page.waitForTimeout(150);
  return page.evaluate(() => scontro && ({ id: scontro.N.nem.id, fase: scontro.N.nem.faseDafne, nascosta: !!scontro.N.nem.nascosta, primo: scontro.primo, scovata: !!(scontro.N.nem.buff && scontro.N.nem.buff.scovata), ctx: scontro.ctx, fuga: puoFuggire(), nome: CB.nome }));
}
const tuoTurno = async (page) => { for (let i = 0; i < 120 && !(await page.evaluate(() => !!(scontro && scontro.tuoTurno))); i++) { await page.evaluate(() => document.getElementById("diario").click()); await page.waitForTimeout(150); } };

caso("Bacheca: la caccia d'oro si accetta al livello 4 dopo l'argento (missione q6)", async (b) => {
  const { page, errori, chiudi } = await apri(b, PG(), PARTITA());
  const r = await page.evaluate(() => { const st = statoCaccia(2); accettaOro(); return { st, q6: usate.q6, mis: document.getElementById("missioni").textContent, aldo: diario.filter(e => e.chi === "Aldo").map(e => e.righe[0]).pop() }; });
  eq(r.st, "pronta"); eq(r.q6, "accettata"); vero(/Preda della Foresta/.test(r.mis), "missione nel riquadro");
  vero(/^📖 /.test(r.aldo || ""), "testo provvisorio segnato: " + r.aldo);
  eq(errori, [], "errori nella pagina"); await chiudi();
});

caso("Furtività riuscita: Dafne scovata (fase dello stocco, −2 CA, agisci per primo), niente fuga", async (b) => {
  const { page, errori, chiudi } = await apri(b, PG(), PARTITA());
  await page.evaluate(() => accettaOro());
  const s = await nellaForesta(page, [0.99, 0, 0]);
  eq(s, { id: "dafne", fase: 2, nascosta: false, primo: "pg", scovata: true, ctx: "dafne", fuga: false, nome: "Dafne" });
  eq(errori, [], "errori nella pagina"); await chiudi();
});

caso("Furtività fallita: nascosta; «Cerco Dafne» → stacco col mastino; mastino abbattuto → torna Dafne con lo stocco", async (b) => {
  const { page, errori, chiudi } = await apri(b, PG(), PARTITA());
  await page.evaluate(() => accettaOro());
  const s = await nellaForesta(page, [0, 0.99, 0.99]);
  eq([s.fase, s.nascosta, s.primo], [0, true, "nem"]);
  await tuoTurno(page);
  const bt = page.locator("#barraScontro button", { hasText: "Cerco Dafne" });
  vero(await bt.isVisible(), "pulsante «Cerco Dafne»");
  await dadi(page, [0.99]);
  await bt.click();
  await tuoTurno(page);
  const m = await page.evaluate(() => ({ id: scontro.N.nem.id, riserva: scontro.riserva && scontro.riserva.id, turni: scontro.staccoTurni, nome: CB.nome, nota: document.getElementById("barraScontro").textContent }));
  eq([m.id, m.riserva, m.turni], ["mastino_di_dafne", "dafne", 1]);
  vero(m.nome !== "Dafne", "scheda del mastino: " + m.nome); vero(/stacco: turno 1 di 3/.test(m.nota), "nota dello stacco");
  await page.evaluate(() => { scontro.N.nem.pv = 0; scontro.pv = 0; fineAzioneNuovo(); });
  const d = await page.evaluate(() => ({ id: scontro.N.nem.id, fase: scontro.N.nem.faseDafne, riserva: scontro.riserva, nome: CB.nome, pv: scontro.pv > 0 }));
  eq(d, { id: "dafne", fase: 2, riserva: null, nome: "Dafne", pv: true });
  eq(errori, [], "errori nella pagina"); await chiudi();
});

caso("Stacco: il mastino resta in piedi e dopo 3 turni sparisce; Dafne torna", async (b) => {
  const { page, errori, chiudi } = await apri(b, PG(), PARTITA());
  await page.evaluate(() => accettaOro());
  await nellaForesta(page, [0, 0.99, 0.99]);
  await tuoTurno(page);
  await dadi(page, [0.99]);
  await page.evaluate(() => cercaDafneNuovo());
  for (let k = 0; k < 4; k++) { await tuoTurno(page); if (await page.evaluate(() => !scontro.riserva)) break; await page.evaluate(() => { scontro.N.pg.pv = scontro.N.pg.pvMax; usaPotereNuovo(scontro.N.pg.poteri.find(id => MotS.disponibile(scontro.N.pg, id).ok && MotSP.POTERI[id].tipo === "volonta")); scontro.N.nem.pv = Math.max(scontro.N.nem.pv, 5); }); }
  await tuoTurno(page);
  const d = await page.evaluate(() => ({ id: scontro.N.nem.id, fase: scontro.N.nem.faseDafne, riserva: scontro.riserva }));
  eq(d, { id: "dafne", fase: 2, riserva: null });
  eq(errori, [], "errori nella pagina"); await chiudi();
});

caso("A 0 parla: tono Gentile, muore; stocco, corno (visione di Francesco senza 📖) e fermaglio d'oro; Aldo lo riceve senza il corno", async (b) => {
  const { page, errori, chiudi } = await apri(b, PG(), PARTITA());
  await page.evaluate(() => accettaOro());
  await nellaForesta(page, [0.99, 0, 0]);
  await page.evaluate(() => { scontro.N.nem.pv = 0; scontro.pv = 0; vittoriaScontro(); });
  await premi(page, "Riposa");
  for (let i = 0; i < 80 && !(await page.evaluate(() => usate.dafne === "morta")); i++) { await page.evaluate(() => document.getElementById("diario").click()); await page.waitForTimeout(250); }
  const r = await page.evaluate(() => ({ dafne: usate.dafne, q6: usate.q6, tono: usate.dafne_tono, z: zaino.map(x => x.id),
    vis: diario.map(e => (e.righe || []).join(" ")).find(t => /Sei Aldo/.test(t)) || "", parla: diario.filter(e => e.chi === "Dafne").map(e => e.righe[0]) }));
  eq(r.dafne, "morta"); eq(r.q6, "prova"); eq(r.tono, "gentile");
  vero(["stocco_dafne", "corno_signore", "fermaglio_oro"].every(k => r.z.includes(k)), "bottino: " + r.z);
  vero(r.vis && !/📖/.test(r.vis), "visione del corno, senza segno"); vero(r.parla.length && r.parla.every(t => /^📖 /.test(t)), "dialoghi di Dafne segnati: " + r.parla);
  await page.evaluate(() => vai("sala_caccia"));
  await page.waitForTimeout(2500);
  const a = await page.evaluate(() => ({ f: usate.fermaglio, q6: usate.q6, oro: zaino.some(x => x.id === "fermaglio_oro"), corno: zaino.some(x => x.id === "corno_signore"), aldo: diario.filter(e => e.chi === "Aldo").map(e => e.righe.join(" ")).pop() }));
  eq([a.f, a.q6, a.oro, a.corno], ["oro", "completata", false, true]); vero(/corno/i.test(a.aldo || ""), "Aldo e il corno: " + a.aldo);
  eq(errori, [], "errori nella pagina"); await chiudi();
});

caso("Sconfitta contro Dafne: non si muore, risveglio nella sala della caccia; nella foresta lei ti ritrova", async (b) => {
  const { page, errori, chiudi } = await apri(b, PG(), PARTITA());
  await page.evaluate(() => accettaOro());
  await nellaForesta(page, [0.99, 0, 0]);
  await page.evaluate(() => sconfittaScontro());
  await page.waitForTimeout(3500);
  const r = await page.evaluate(() => ({ luogo, dafne: usate.dafne, scontro: !!scontro }));
  eq(r, { luogo: "sala_caccia", dafne: "rivincita", scontro: false });
  await page.evaluate(() => { usate.caccia_rimprovero = false; });
  const s = await nellaForesta(page, [0.99, 0, 0]);
  eq([s && s.id, await page.evaluate(() => usate.dafne)], ["dafne", "scontro"]);
  eq(errori, [], "errori nella pagina"); await chiudi();
});

caso("Vecchio motore: niente caccia d'oro, Dafne non compare", async (b) => {
  const pg = PG(); delete pg.motore;
  const { page, errori, chiudi } = await apri(b, pg, PARTITA());
  const r = await page.evaluate(() => { accettaOro(); return { q6: usate.q6 || null, presente: dafnePresente() }; });
  eq(r, { q6: null, presente: false });
  eq(errori, [], "errori nella pagina"); await chiudi();
});

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ["--no-sandbox"] });
  let ok = 0;
  for (const c of casi) {
    try { await c.fn(browser); ok++; console.log("✓ " + c.nome); }
    catch (e) { console.log("✗ " + c.nome + "\n   " + e.message); }
  }
  await browser.close();
  console.log(`\n${ok}/${casi.length} superati`);
  process.exit(ok === casi.length ? 0 : 1);
})();
