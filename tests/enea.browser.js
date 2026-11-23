/* Test nel browser di Enea, il guardiano d'argento (22/11/2026; storia_enea.md, riscrittura_meccaniche.md 8d).
   Solo motore nuovo: caccia d'argento dalla bacheca, cimitero, scontro col motore (Nemici.BOSS.enea), rivelazione (gentile/brusco),
   scelta (finirlo/risparmiarlo), fermaglio ad Aldo, sconfitta senza morte, oggetti dei suoi uomini nella foresta.
   Uso: python3 -m http.server 8765 --bind 127.0.0.1, poi node tests/enea.browser.js */
const { chromium } = require("playwright");
const BASE = process.env.BASE || "http://127.0.0.1:8765/";
const casi = [];
const caso = (nome, fn) => casi.push({ nome, fn });
const eq = (a, b, msg) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${msg || "atteso"}: ${JSON.stringify(b)}, ottenuto ${JSON.stringify(a)}`); };
const vero = (x, msg) => { if (!x) throw new Error(msg || "atteso vero"); };

const PG = () => ({
  nome: "Prova", razza: "Umano", classe: "Soldato", livello: 3, immagine: null, motore: 2, spec: "berserker",
  scelte: ["colpo_poderoso", "colpo_di_mestiere", "spezza_guardia", "assalto_implacabile", "colpo_crudele", "colpo_del_boia"],
  statisticheBase: { Vigore: 16, "Agilità": 12, Mente: 12, Spirito: 12 }, statistiche: { Vigore: 16, "Agilità": 12, Mente: 12, Spirito: 12 },
  modificatori: { Vigore: 3, "Agilità": 1, Mente: 1, Spirito: 1 }, tiroDado: { dado: 10, valore: 10 }, puntiVita: 35, saluteMentale: 33,
  classeArmatura: 14, mana: null, risorsa: null, incantesimi: [], tecniche: [], modalita: "facile", idPartita: "test",
  abilita: [{ nome: "Atletica", attributo: "Vigore", valore: 5 }, { nome: "Sopravvivenza", attributo: "Spirito", valore: 3 }],
  equipaggiamento: { arma: "Spada corta", armaDanno: "1d6", armaTipoDanno: "Tagliente", armaMani: 1, armatura: "Armatura media", armaturaCA: 4, malusAgilita: 0, scudo: null, dotazione: [] }
});
const PARTITA = (o) => Object.assign({
  usate: { riposo: "sbloccato", fermaglio: "bronzo", q4: "completata", udienze: ["bronzo"], portone_aperto: true, ettore: "morto", q1: "completata" },
  diario: [{ tipo: "narra", stanza: "sala_caccia", righe: ["x"] }], luogo: "sala_caccia", livello: 3,
  crescita: { salute: 0, mente: 0, risorsa: 0 }, risorsaUsata: 0, ora: Date.now(), zaino: []
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
/* dalla sala della caccia fino a Enea sconfitto (la seconda caduta si simula chiudendo lo scontro con una vittoria) */
async function finoAllaCaduta(page) {
  await page.evaluate(() => accettaArgento());
  await page.evaluate(() => vai("cimitero"));
  await premi(page, "Impugno l'arma");
  const s = await page.evaluate(() => ({ id: scontro && scontro.N.nem.id, boss: scontro && scontro.N.nem.boss, nome: CB.nome, fuga: puoFuggire(), ctx: scontro && scontro.ctx, enea: usate.enea }));
  await page.evaluate(() => { scontro.N.nem.pv = 0; scontro.pv = 0; vittoriaScontro(); });
  return s;
}

caso("Bacheca: la caccia d'argento si accetta al livello 3 dopo il bronzo (missione q5)", async (b) => {
  const { page, errori, chiudi } = await apri(b, PG(), PARTITA());
  const r = await page.evaluate(() => { const st = statoCaccia(1); accettaArgento(); return { st, q5: usate.q5, mis: document.getElementById("missioni").textContent }; });
  eq(r.st, "pronta"); eq(r.q5, "accettata"); vero(/Preda del Cimitero/.test(r.mis), "missione nel riquadro");
  eq(errori, [], "errori nella pagina"); await chiudi();
});

caso("Cimitero: Enea parla, poi lo scontro col motore (boss, niente fuga); seconda caduta → rivelazione brusca → lo finisci", async (b) => {
  const { page, errori, chiudi } = await apri(b, PG(), PARTITA());
  const s = await finoAllaCaduta(page);
  eq(s.id, "enea"); eq(s.nome, "Enea"); eq(s.ctx, "enea"); eq(s.fuga, false); eq(s.enea, "scontro");
  await premi(page, "Dimmi solo quello che serve");
  await premi(page, "Lo finisco");
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => ({ enea: usate.enea, q5: usate.q5, tono: usate.enea_tono, uomini: usate.enea_uomini, z: zaino.map(x => x.id) }));
  eq(r.enea, "morto"); eq(r.q5, "prova"); eq(r.tono, "brusco"); eq(r.uomini, ["darius", "caius", "magnus"]);
  vero(r.z.includes("fermaglio_argento") && r.z.includes("giuramento_rettore"), "fermaglio e Giuramento: " + r.z);
  /* Aldo: fermaglio d'argento, silenzio freddo */
  await page.evaluate(() => vai("sala_caccia"));
  await page.waitForTimeout(2500);
  const a = await page.evaluate(() => ({ f: usate.fermaglio, q5: usate.q5, z: zaino.some(x => x.id === "fermaglio_argento"), aldo: diario.filter(e => e.chi === "Aldo").map(e => e.righe.join(" ")).pop() }));
  eq(a.f, "argento"); eq(a.q5, "completata"); eq(a.z, false); vero(/silenzio/i.test(a.aldo || ""), "Aldo, silenzio freddo: " + a.aldo);
  eq(errori, [], "errori nella pagina"); await chiudi();
});

caso("Rivelazione gentile: si chiede dei tre compagni, poi lo risparmi (niente Giuramento; Aldo: «scarto»)", async (b) => {
  const { page, errori, chiudi } = await apri(b, PG(), PARTITA());
  await finoAllaCaduta(page);
  await premi(page, "Lo lascio parlare");
  await premi(page, "Chiedo di Darius");
  await premi(page, "Chiedo di Magnus");
  await premi(page, "Ho sentito abbastanza");
  await premi(page, "Lo risparmio");
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => ({ enea: usate.enea, tono: usate.enea_tono, uomini: usate.enea_uomini, z: zaino.map(x => x.id), img: imgStanza("cimitero") }));
  eq(r.enea, "risparmiato"); eq(r.tono, "gentile"); eq(r.uomini, ["darius", "magnus"]);
  vero(r.z.includes("fermaglio_argento") && !r.z.includes("giuramento_rettore"), "solo il fermaglio: " + r.z);
  vero(!/enea/.test(r.img || ""), "il cimitero senza Enea: " + r.img);
  await page.evaluate(() => vai("sala_caccia"));
  await page.waitForTimeout(2500);
  const a = await page.evaluate(() => diario.filter(e => e.chi === "Aldo").map(e => e.righe.join(" ")).pop());
  vero(/scarto/i.test(a || ""), "Aldo: " + a);
  eq(errori, [], "errori nella pagina"); await chiudi();
});

caso("Sconfitta contro Enea: non si muore, risveglio nella sala della caccia; al ritorno Enea combatte subito", async (b) => {
  const { page, errori, chiudi } = await apri(b, PG(), PARTITA());
  await page.evaluate(() => accettaArgento());
  await page.evaluate(() => vai("cimitero"));
  await premi(page, "Impugno l'arma");
  await page.evaluate(() => sconfittaScontro());
  await page.waitForTimeout(3500);
  const r = await page.evaluate(() => ({ luogo, enea: usate.enea, scontro: !!scontro }));
  eq(r, { luogo: "sala_caccia", enea: "rivincita", scontro: false });
  await page.evaluate(() => { usate.caccia_rimprovero = false; vai("cimitero"); });
  for (let i = 0; i < 120 && !(await page.evaluate(() => !!scontro)); i++) { await page.evaluate(() => document.getElementById("diario").click()); await page.waitForTimeout(250); }
  const s = await page.evaluate(() => ({ id: scontro && scontro.N.nem.id, enea: usate.enea }));
  eq(s, { id: "enea", enea: "scontro" });
  eq(errori, [], "errori nella pagina"); await chiudi();
});

caso("Foresta: dopo la rivelazione si cercano le cose dei suoi uomini (Sopravvivenza; scudo di Darius a nord)", async (b) => {
  const { page, errori, chiudi } = await apri(b, PG(), PARTITA({ usate: { riposo: "sbloccato", fermaglio: "argento", q4: "completata", q5: "completata", udienze: ["bronzo", "argento"], enea: "morto", enea_tono: "gentile", enea_uomini: ["darius"] } }));
  await page.evaluate(() => vai("pineta"));
  await page.waitForTimeout(2000);
  await page.evaluate(() => { if (scontro) { scontro.N.nem.pv = 0; scontro.pv = 0; vittoriaScontro(); } }); /* un animale nuovo al primo ingresso: dopo lo scontro la ricerca si offre lo stesso */
  await premi(page, "Cerco lo scudo di Darius");
  await page.evaluate(() => { window.__R = Math.random; });
  await page.evaluate(() => { Math.random = () => 0.99; }); /* 20 naturale */
  await page.locator("#azioni button").first().click();
  await page.waitForTimeout(800);
  const r = await page.evaluate(() => { Math.random = window.__R; return { z: zaino.map(x => x.id), trovati: usate.enea_trovati }; });
  vero(r.z.includes("scudo_darius"), "scudo nello zaino: " + r.z); eq(r.trovati, ["darius"]);
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
