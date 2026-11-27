/* Test di js/sicuro.js senza DOMPurify: il markup non si inserisce mai, si mostra come testo.
   Uso: node tests/sicuro.test.js */
const assert = require("assert");
global.window = {};
global.document = {};
require("../js/sicuro.js");
const S = window.Sicuro;
const casi = [];
const caso = (n, f) => casi.push([n, f]);
caso("senza DOMPurify un nome con codice dentro resta testo", () => {
  const o = S.pulisci('<img src=x onerror="alert(1)">');
  assert.ok(!/<img/i.test(o), o);
  assert.ok(o.includes("&lt;img"), o);
});
caso("html() scrive il testo scappato nell'elemento", () => {
  const el = { tagName: "DIV", innerHTML: "" };
  S.html(el, "<script>x</script>");
  assert.ok(!/<script/i.test(el.innerHTML), el.innerHTML);
});
caso("immagine(): solo file locali in immagini/", () => {
  assert.strictEqual(S.immagine("http://x.it/a.png"), null);
  assert.strictEqual(S.immagine("immagini/../a.png"), null);
  assert.ok(S.immagine("immagini/pg/a.webp"));
});
let ko = 0;
for (const [n, f] of casi) { try { f(); console.log("OK      " + n); } catch (e) { ko++; console.log("ERRORE  " + n + "\n        " + e.message); } }
console.log(`\n${casi.length - ko}/${casi.length} casi superati`);
process.exit(ko ? 1 : 0);
