/* Misure dei vuoti degli agguati e delle cacce (22/11/2026) nella simulazione della sala di prova: per ogni nemico media, minimo e massimo delle 8 specializzazioni.
   Livello del giocatore = fascia + 1 (cacce: livello del momento), arma +0/+1/+2/+3/+3, via di Guendalina dal livello 2.
   Uso: python3 -m http.server 8765 --bind 127.0.0.1, poi  N=300 node strumenti/misure_vuoti.js   (NEM=caccia:gualtiero,vuoto:2:fuoco per scegliere; FILA=2 per due agguati di fila senza riposo) */
const { chromium } = require("playwright");
const N = +(process.env.N || 300);
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME, args: ["--no-sandbox"] } : {}); const p = await b.newPage(); const err = [];
  p.on("pageerror", e => err.push(e.message)); await p.route(/^(?!http:\/\/127\.0\.0\.1)/, r => r.abort());
  await p.goto(`http://127.0.0.1:${process.env.PORT || 8765}/prova.html`); await p.waitForTimeout(800);
  const specs = await p.evaluate(() => { const out = []; for (const o of document.getElementById("classe").options) { document.getElementById("classe").value = o.value; document.getElementById("classe").dispatchEvent(new Event("change")); for (const s of document.getElementById("spec").options) out.push([o.value, s.value, s.textContent]); } return out; });
  const nemici = (process.env.NEM || "").split(",").filter(Boolean);
  const cols = nemici.length ? nemici : [0, 1, 2, 3, 4].flatMap(f => ["carica", "imboscata", "trappolista", "finto", "veleni", "fuoco"].map(a => `vuoto:${f}:${a}`));
  const tab = {};
  for (const [classe, spec, nome] of specs) for (const id of cols) {
    const liv = id.startsWith("caccia:") ? { gualtiero: 2, fiammetta: 2, baldassarre: 3, ottilia: 3, brunilde: 4, ysolde: 4, corvino: 5, ezechiele: 5 }[id.slice(7)] : Number(id.split(":")[1]) + 1;
    const pct = await p.evaluate(async ([classe, spec, id, liv, N, fila]) => { const $ = (x) => document.getElementById(x), ev = (x) => x.dispatchEvent(new Event("change"));
      $("classe").value = classe; ev($("classe")); $("spec").value = spec; ev($("spec")); $("liv").value = String(liv); ev($("liv")); $("nemico").value = id; ev($("nemico"));
      $("armaBonus").value = String({ 1: 0, 2: 1, 3: 2, 4: 3, 5: 3 }[liv]); ev($("armaBonus")); $("via").value = liv >= 2 ? "guendalina" : ""; ev($("via"));
      if ($("simFila")) $("simFila").value = String(fila); $("simN").value = N; $("simula").click(); await new Promise(r => setTimeout(r, 30));
      const m = /vittorie\s+(\d+)%/.exec($("simEsito").textContent); return m ? +m[1] : null; }, [classe, spec, id, liv, N, Number(process.env.FILA || 1)]);
    (tab[id] = tab[id] || []).push([nome, pct]);
  }
  for (const [id, xs] of Object.entries(tab)) console.log(id.padEnd(22), "media", Math.round(xs.reduce((t, x) => t + x[1], 0) / xs.length), " min", Math.min(...xs.map(x => x[1])), xs.find(x => x[1] === Math.min(...xs.map(y => y[1])))[0], " max", Math.max(...xs.map(x => x[1])));
  if (err.length) console.log(err); await b.close();
})();
