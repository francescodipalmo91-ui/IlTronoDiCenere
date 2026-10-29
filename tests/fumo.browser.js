/* TEST DI FUMO — «si accende senza fumo?»: ogni pagina, su PC e su telefono (formato Pixel 9a).
   Per ciascuna controlla: errori JavaScript, file locali che non si caricano (404), pagina più larga dello schermo,
   pulsanti troppo piccoli da toccare (solo telefono) e accessibilità con axe-core (contrasto, etichette, ruoli).
   In gioco.html scrive anche un comando e controlla che il diario risponda.
   Uso:  python3 -m http.server 8765 --bind 127.0.0.1   (dalla cartella del gioco, in un altro terminale)
         node tests/fumo.browser.js                     (serve Playwright: npm i)
   Esce con 1 solo per errori veri (JS, 404, pagina che sborda, comando senza risposta);
   tocco e accessibilità sono AVVISI, con il dettaglio in tests/fumo_report.json. */
const { chromium, devices } = require("playwright");
const fs = require("fs"), path = require("path");
const BASE = process.env.BASE || "http://127.0.0.1:8765/";
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

const PG = {
  nome: "Fumo", razza: "Nano", classe: "Soldato", livello: 1, immagine: null,
  statisticheBase: { Vigore: 15, "Agilità": 12, Mente: 10, Spirito: 13 }, statistiche: { Vigore: 17, "Agilità": 12, Mente: 10, Spirito: 14 },
  modificatori: { Vigore: 3, "Agilità": 1, Mente: 0, Spirito: 2 }, tiroDado: { dado: 10, valore: 10 }, puntiVita: 23, saluteMentale: 22,
  classeArmatura: 15, mana: null, risorsa: { id: "ira", max: 13 }, incantesimi: [], tecniche: ["polso", "morso_acciaio"],
  abilita: [{ nome: "Atletica", attributo: "Vigore", valore: 4 }, { nome: "Percezione", attributo: "Mente", valore: 1 }],
  equipaggiamento: { arma: "Spada corta", armaDanno: "1d6", armaTipoDanno: "Tagliente", armaMani: 1, armatura: "Armatura media", armaturaCA: 4, malusAgilita: 0, scudo: null, dotazione: ["Torcia"] }
};

const VISTE = {
  pc: { viewport: { width: 1440, height: 900 } },
  telefono: { ...devices["Pixel 7"], viewport: { width: 412, height: 915 } } /* Pixel 9a: 412×915 CSS px */
};
const PAGINE = [
  { url: "index.html" },
  { url: "creazione.html" },
  { url: "tutorial.html" },
  { url: "regolamento.html" },
  { url: "gioco.html", pg: PG, comando: "guardo intorno" }
];

(async () => {
  const browser = await chromium.launch();
  const report = [];
  let gravi = 0, avvisi = 0;
  for (const [vista, opz] of Object.entries(VISTE)) {
    for (const p of PAGINE) {
      const ctx = await browser.newContext(opz);
      await ctx.route(/^(?!http:\/\/127\.0\.0\.1)/, r => r.abort()); /* niente Firebase né rete esterna */
      const page = await ctx.newPage();
      const r = { pagina: p.url, vista, errori: [], mancanti: [], sborda: null, piccoli: [], axe: [] };
      page.on("pageerror", e => r.errori.push(e.message));
      page.on("console", m => { if (m.type() === "error" && !/Failed to load resource|net::|firebase|gstatic|googleapis/i.test(m.text())) r.errori.push(m.text()); });
      page.on("response", res => { if (res.url().startsWith(BASE) && res.status() >= 400) r.mancanti.push(`${res.status()} ${res.url().slice(BASE.length)}`); });
      await page.addInitScript((pg) => {
        if (sessionStorage.getItem("fumo")) return;
        sessionStorage.setItem("fumo", "1"); localStorage.clear();
        if (pg) localStorage.setItem("personaggio", JSON.stringify(pg));
      }, p.pg || null);
      await page.goto(BASE + p.url);
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.waitForTimeout(600);

      if (!page.url().endsWith(p.url)) r.errori.push(`la pagina ha rimandato a ${page.url().slice(BASE.length)}`);

      /* comando in gioco: il diario deve crescere */
      if (p.comando) {
        const prima = await page.evaluate(() => (document.getElementById("diario") || {}).textContent?.length || 0);
        await page.fill("#testo", p.comando); await page.press("#testo", "Enter"); await page.waitForTimeout(900);
        const dopo = await page.evaluate(() => (document.getElementById("diario") || {}).textContent?.length || 0);
        if (dopo <= prima) r.errori.push(`il comando «${p.comando}» non ha prodotto niente nel diario`);
      }

      /* pagina più larga dello schermo = scorrimento orizzontale sul telefono */
      const larg = await page.evaluate(() => ({ doc: document.documentElement.scrollWidth, vista: window.innerWidth }));
      if (larg.doc > larg.vista + 1) r.sborda = `${larg.doc}px su ${larg.vista}px`;

      /* bersagli di tocco: Google consiglia 48dp, sotto i 32px si sbaglia spesso il tocco */
      if (vista === "telefono") {
        r.piccoli = await page.evaluate(() => [...document.querySelectorAll("button, a[href], input, select, summary, [role=button]")]
          .filter(e => { const b = e.getBoundingClientRect(), s = getComputedStyle(e); return b.width >= 4 && b.height >= 4 && /* sotto i 4px è un input nascosto, si tocca la sua etichetta */ s.visibility !== "hidden" && (b.height < 32 || b.width < 32); })
          .slice(0, 15).map(e => { const b = e.getBoundingClientRect(); return `${e.tagName.toLowerCase()}${e.id ? "#" + e.id : ""}${e.className && typeof e.className === "string" ? "." + e.className.split(" ")[0] : ""} «${(e.textContent || e.value || e.getAttribute("aria-label") || "").trim().slice(0, 20)}» ${Math.round(b.width)}×${Math.round(b.height)}`; }));
      }

      /* accessibilità */
      await page.addScriptTag({ content: AXE });
      const ris = await page.evaluate(async () => (await axe.run(document, { runOnly: ["wcag2a", "wcag2aa"], resultTypes: ["violations"] })).violations
        .map(v => ({ regola: v.id, impatto: v.impact, quanti: v.nodes.length, descrizione: v.help, esempio: (v.nodes[0] && v.nodes[0].target.join(" ")) || "" })));
      r.axe = ris.filter(v => v.impatto === "critical" || v.impatto === "serious");

      const grave = r.errori.length + r.mancanti.length + (r.sborda ? 1 : 0);
      const avv = (r.piccoli.length ? 1 : 0) + r.axe.length;
      gravi += grave; avvisi += avv;
      console.log(`${grave ? "KO" : "OK"}  ${vista.padEnd(9)} ${p.url.padEnd(17)}` +
        (r.errori.length ? `  errori JS: ${r.errori.slice(0, 2).join(" | ")}` : "") +
        (r.mancanti.length ? `  file mancanti: ${r.mancanti.join(", ")}` : "") +
        (r.sborda ? `  sborda: ${r.sborda}` : "") +
        (r.piccoli.length ? `  ⚠ tocco piccolo: ${r.piccoli.length}` : "") +
        (r.axe.length ? `  ⚠ accessibilità: ${r.axe.map(v => `${v.regola}×${v.quanti}`).join(", ")}` : ""));
      report.push(r);
      await ctx.close();
    }
  }
  await browser.close();
  fs.writeFileSync(path.join(__dirname, "fumo_report.json"), JSON.stringify(report, null, 2));
  console.log(`\nFumo: ${gravi} problemi gravi, ${avvisi} avvisi (dettagli in tests/fumo_report.json)`);
  process.exit(gravi ? 1 : 0);
})();
