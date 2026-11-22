/* Misure del bilanciamento sul motore nuovo (22/11/2026): usa la simulazione della sala di prova (prova.html, js/cervello.js).
   Per ogni specializzazione e boss: % di vittorie al livello del boss (sovrano contro il livello 5), pezzi di set della storia
   per il nemico scelto (casella predefinita), resto dei valori predefiniti della sala.
   Uso: python3 -m http.server 8765 --bind 127.0.0.1, poi  N=400 node strumenti/misure_prova.js
   Arma comune +1 / +2 / +3 / +3 dal livello 2 al 5, via di Guendalina dal livello 2 (VIA=aldo per l'altra), 2 elisir rari per famiglia, 2 pozioni.
   Opzioni: PORT, CHROME (percorso di Chrome), SET_CLASSE=1 (aggiunge i 3 pezzi del set di classe), SOLO=berserker,ossa, BOSS=ettore,atena */
const { chromium } = require("playwright");
const N = Number(process.env.N || 400);
const BOSS = (process.env.BOSS || "ettore:2,enea:3,dafne:4,atena:5,sovrano:5").split(",").map(x => x.split(":")).map(([id, liv]) => ({ id, liv: liv || { ettore: 2, enea: 3, dafne: 4, atena: 5, sovrano: 5 }[id] }));
const SET = { Soldato: [["guanti", "guanti_del_valoroso"], ["stivali", "stivali_del_valoroso"], ["cintura", "cintura_del_valoroso"]],
  Sapiente: [["guanti", "guanti_del_sapiente"], ["elmo", "cappello_del_sapiente"], ["armatura", "tunica_del_sapiente"]],
  Accolito: [["mantello", "mantello_del_penitente"]], Forestiero: [["anello", "anello_del_pellegrino"], ["amuleto", "collana_del_pellegrino"]] };
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME, args: ["--no-sandbox"] } : {});
  const p = await b.newPage(); const err = []; p.on("pageerror", e => err.push(e.message));
  await p.route(/^(?!http:\/\/127\.0\.0\.1)/, r => r.abort());
  await p.goto(`http://127.0.0.1:${process.env.PORT || 8765}/prova.html`); await p.waitForTimeout(800);
  const specs = await p.evaluate(() => { const out = []; for (const o of document.getElementById("classe").options) { const c = o.value; document.getElementById("classe").value = c; document.getElementById("classe").dispatchEvent(new Event("change"));
    for (const s of document.getElementById("spec").options) out.push([c, s.value, s.textContent]); } return out; });
  const solo = process.env.SOLO ? process.env.SOLO.split(",") : null;
  const righe = [];
  for (const [classe, spec, nome] of specs) {
    if (solo && !solo.includes(spec)) continue;
    const r = [nome];
    for (const { id, liv } of BOSS) {
      const pct = await p.evaluate(async ([classe, spec, id, liv, N, set, process_via]) => {
        const $ = (x) => document.getElementById(x), ev = (x) => x.dispatchEvent(new Event("change"));
        $("classe").value = classe; ev($("classe")); $("spec").value = spec; ev($("spec")); $("liv").value = String(liv); ev($("liv"));
        $("nemico").value = id; ev($("nemico"));
        $("armaBonus").value = String({ 1: 0, 2: 1, 3: 2, 4: 3, 5: 3 }[liv]); ev($("armaBonus")); /* arma del momento: +1 / +2 / +3 / +3 */
        $("via").value = liv >= 2 ? (process_via || "guendalina") : ""; ev($("via"));
        document.querySelectorAll(".eqSlot").forEach(s => { s.value = ""; ev(s); });
        for (const [posto, v] of set || []) { const s = document.querySelector(`.eqSlot[data-posto="${posto}"]`); if (s) { s.value = v; ev(s); } }
        if (set && (classe === "Accolito" || classe === "Forestiero")) { /* mazzafrusto o focus del set */
          if (classe === "Accolito") { const a = $("arma"); const i = [...a.options].findIndex(o => /Mazzafrusto del Penitente/.test(o.textContent)); if (i >= 0) { a.selectedIndex = i; ev(a); } }
          const f = document.querySelector("input[name=mano2][value=focus]"); if (f) { f.checked = true; ev(f); }
          $("focusTipo").value = classe === "Accolito" ? "focus_del_penitente" : "focus_del_pellegrino"; ev($("focusTipo"));
        }
        $("simN").value = N; $("simula").click(); await new Promise(r => setTimeout(r, 50));
        const m = /vittorie\s+(\d+)%/.exec($("simEsito").textContent); return m ? +m[1] : null;
      }, [classe, spec, id, liv, N, process.env.SET_CLASSE ? SET[classe] : null, process.env.VIA || ""]);
      r.push(pct);
    }
    righe.push(r); console.log(r.join("\t"));
  }
  const medie = BOSS.map((_, i) => Math.round(righe.reduce((t, r) => t + r[i + 1], 0) / righe.length));
  console.log(["media", ...medie].join("\t"));
  if (err.length) console.log("errori:", err);
  await b.close();
})();
