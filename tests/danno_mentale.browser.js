/* Test nel browser: niente danno mentale da diari di Adele e flashback (27/11/2026, decisioni_27_novembre.md sez. 2).
   Uso: python3 -m http.server 8765 --bind 127.0.0.1, poi node tests/danno_mentale.browser.js */
const { chromium } = require("playwright");
const BASE = process.env.BASE || "http://127.0.0.1:8765/";
const casi = [];
const caso = (nome, fn) => casi.push({ nome, fn });
const eq = (a, b, msg) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${msg || "atteso"}: ${JSON.stringify(b)}, ottenuto ${JSON.stringify(a)}`); };
const vero = (x, msg) => { if (!x) throw new Error(msg || "atteso vero"); };

const PG = () => ({
  nome: "Prova", razza: "Umano", classe: "Soldato", livello: 1, immagine: null, motore: 2, spec: "berserker",
  statisticheBase: { Vigore: 16, "Agilità": 12, Mente: 10, Spirito: 12 }, statistiche: { Vigore: 16, "Agilità": 12, Mente: 10, Spirito: 12 },
  modificatori: { Vigore: 3, "Agilità": 1, Mente: 0, Spirito: 1 }, tiroDado: { dado: 10, valore: 10 }, puntiVita: 23, saluteMentale: 21,
  classeArmatura: 14, mana: null, risorsa: { id: "furia", max: 13 }, incantesimi: [], tecniche: ["polso", "morso_acciaio"],
  abilita: [{ nome: "Atletica", attributo: "Vigore", valore: 4 }],
  equipaggiamento: { arma: "Spada corta", armaDanno: "1d6", armaTipoDanno: "Tagliente", armaMani: 1, armatura: "Armatura media", armaturaCA: 4, malusAgilita: 0, scudo: null, dotazione: [] }
});
const arma = (id, nome) => ({ id, nome, tipo: "arma", danno: "1d6", tipoDanno: "Perforante", mani: 1 });
const PARTITA = (o) => Object.assign({
  usate: { riposo: "sbloccato" }, diario: [{ tipo: "narra", stanza: "cucina", righe: ["x"] }], luogo: "cucina", livello: 1,
  crescita: { salute: 0, mente: 0, risorsa: 0 }, risorsaUsata: 0, ora: Date.now(),
  zaino: [
    arma("pugnale1", "Pugnale"),
    { id: "siero", nome: "Siero", tipo: "consumabile", usi: 2, effetto: "pozCura" },
    { id: "diario_figlio", nome: "Diario del figlio maggiore", tipo: "reperto", alias: ["diario"] }
  ]
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
  await page.evaluate(() => document.querySelectorAll(".avviso-vecchio").forEach(e => e.remove())); /* il personaggio di prova è «vecchio»: qui conta solo l'inventario */
  return { page, errori, chiudi: () => ctx.close() };
}

const testo = (page) => page.evaluate(() => document.getElementById("diario").textContent);

caso("Diario di Adele: leggere una pagina non fa danno mentale", async (b) => {
  const { page, errori, chiudi } = await apri(b, PG(), PARTITA());
  await page.evaluate(() => { for (let n = 1; n <= PAGINE_ADELE(); n++) trovaPagina(n); });
  await page.waitForTimeout(300);
  eq(await page.evaluate(() => pg.dannoMentale || 0), 0, "danno mentale dopo tutte le pagine");
  vero(!/danni mentali|mental damage/i.test(await testo(page)), "nessuna frase sul danno mentale");
  eq(await page.evaluate(() => pagineTrovate().length), await page.evaluate(() => PAGINE_ADELE()), "pagine prese");
  eq(errori, [], "errori in console"); await chiudi();
});

caso("Anello del Primo Vespera: la visione del funerale parte da sola, una volta, senza danno", async (b) => {
  const { page, errori, chiudi } = await apri(b, PG(), PARTITA({ luogo: "cripta" }));
  await page.evaluate(() => sarcofago(true)); await page.waitForTimeout(300);
  eq(await page.evaluate(() => [usate.flash_anello, pg.dannoMentale || 0]), [true, 0]);
  vero(await page.evaluate(() => document.getElementById("diario").textContent.includes(A2.anello.visione[3])), "la visione è nel diario");
  vero(!/danni mentali|mental damage/i.test(await testo(page)), "nessuna frase sul danno mentale");
  await page.evaluate(() => sarcofago(true)); await page.waitForTimeout(200);
  eq(await page.evaluate(() => pg.dannoMentale || 0), 0, "la seconda volta niente di nuovo");
  eq(errori, [], "errori in console"); await chiudi();
});

caso("Scale dell'atrio: il primo tocco mostra la visione del giardino senza danno", async (b) => {
  const { page, errori, chiudi } = await apri(b, PG(), PARTITA({ luogo: "atrio" }));
  await page.evaluate(() => primoTocco()); await page.waitForTimeout(300);
  eq(await page.evaluate(() => [usate.scale, usate.scale_visione, pg.dannoMentale || 0]), ["attesa", true, 0]);
  vero(await page.evaluate(() => document.getElementById("diario").textContent.includes(SCALE.respinto[0].slice(0, 40))), "la visione è nel diario");
  vero(!/danni mentali|mental damage/i.test(await testo(page)), "nessuna frase sul danno mentale");
  eq(errori, [], "errori in console"); await chiudi();
});

(async () => {
  const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME, args: ["--no-sandbox"] } : {});
  let ko = 0;
  const scelti = process.env.SOLO ? casi.filter(c => c.nome.includes(process.env.SOLO)) : casi;
  for (const { nome, fn } of scelti) {
    try { await fn(browser); console.log("OK     " + nome); }
    catch (e) { ko++; console.log("ERRORE " + nome + "\n       → " + e.message.split("\n")[0]); }
  }
  await browser.close();
  console.log(`\n${scelti.length - ko} / ${scelti.length} superati`);
  process.exit(ko ? 1 : 0);
})();
