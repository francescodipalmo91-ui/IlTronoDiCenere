/* COERENZA DOCUMENTI ↔ CODICE — controlla che i numeri decisi nei documenti di progetto siano quelli del gioco,
   e che ogni immagine e ogni audio citati nel codice esistano davvero (con le maiuscole giuste: GitHub Pages le distingue).
   Uso:  node strumenti/coerenza_docs.mjs        (esce con 1 se qualcosa diverge)
   Per aggiungere un controllo: una riga in CONTROLLI, con il valore letto dal documento e quello letto dal codice. */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const R = join(dirname(fileURLToPath(import.meta.url)), "..");
const leggi = (f) => readFileSync(join(R, f), "utf8");
const DOC = leggi("docs/bilanciamento_nemici_oggetti.md");
const GIOCO = leggi("gioco.html");

/* regole.js eseguito come nel browser */
const ctx = { window: {} }; vm.createContext(ctx); vm.runInContext(leggi("js/regole.js"), ctx);
const Regole = ctx.window.Regole;

/* un numero dal documento: prima corrispondenza dell'espressione, gruppo 1 */
const numDoc = (re) => { const m = re.exec(DOC); return m ? m.slice(1).map(Number) : null; };
/* le righe "id: { ... grado: N ... xp: N" di un blocco di gioco.html */
function voci(inizio) {
  const da = GIOCO.indexOf(inizio); if (da < 0) return {};
  const blocco = GIOCO.slice(da, GIOCO.indexOf("\n    };", da) + 1 || undefined);
  const out = {};
  const teste = [...blocco.matchAll(/^\s{6}(\w+): \{/gm)];
  teste.forEach((m, i) => { /* il corpo di una voce arriva fino all'inizio della successiva */
    const corpo = blocco.slice(m.index, i + 1 < teste.length ? teste[i + 1].index : undefined);
    const g = /\bgrado: (\d+)/.exec(corpo), x = /\bxp: (\d+)/.exec(corpo);
    if (x) out[m[1]] = { grado: g ? +g[1] : null, xp: +x[1] };
  });
  return out;
}
const NEMICI = voci("const NEMICI = {"), PREDE = voci("const PREDE = {"), ANIMALI = voci("const ANIMALI = {");

const CONTROLLI = [
  ["Soglie di livello (PE)", numDoc(/\| PE \| (\d+) \| (\d+) \| (\d+) \| (\d+) \|/), Regole.SOGLIE_PE.slice(1)],
  ["Mastini comuni (PE)", numDoc(/Mastini comuni \| (\d+)/), [NEMICI.mastino && NEMICI.mastino.xp]],
  ["Guardiano di bronzo, Ettore (PE)", numDoc(/bronzo (\d+), argento/), [NEMICI.esploratore && NEMICI.esploratore.xp]],
  ["Cacce comuni grado 1/2/3 (PE)", numDoc(/grado 1: (\d+), grado 2: (\d+), grado 3: (\d+)/),
    [1, 2, 3].map(g => { const v = [...new Set(Object.values(PREDE).filter(p => p.grado === g).map(p => p.xp))]; return v.length === 1 ? v[0] : v.join("/"); })]
];

let divergenze = 0;
const ok = (s) => console.log("OK      " + s), ko = (s) => { console.log("DIVERGE " + s); divergenze++; }, avviso = (s) => console.log("AVVISO  " + s);
for (const [nome, doc, cod] of CONTROLLI) {
  if (!doc) { ko(`${nome}: valore non trovato nel documento (la tabella è cambiata forma?)`); continue; }
  JSON.stringify(doc) === JSON.stringify(cod) ? ok(`${nome}: ${doc.join(" / ")}`) : ko(`${nome}: documento ${doc.join(" / ")}, codice ${cod.join(" / ")}`);
}

/* animali normali: il documento dice 50-75 PE */
const rng = numDoc(/Animali normali[^|]*\| (\d+)-(\d+)/);
if (rng) for (const [id, a] of Object.entries(ANIMALI)) if (a.xp < rng[0] || a.xp > rng[1]) avviso(`Animale «${id}»: ${a.xp} PE, fuori dall'intervallo ${rng[0]}-${rng[1]} del documento (voluto?)`);

/* costanti dichiarate ma mai usate che contengono numeri di bilanciamento: si leggono e confondono */
for (const m of GIOCO.matchAll(/const (\w*PE\w*|\w*XP\w*) = \{[^}]*\}/g)) {
  const usi = GIOCO.split(new RegExp(`\\b${m[1]}\\b`)).length - 1;
  if (usi === 1) avviso(`${m[1]} è dichiarata ma non usata: ${m[0].slice(0, 90)}…`);
}

/* immagini e audio citati nel codice */
const sorgenti = ["index.html", "creazione.html", "gioco.html", "tutorial.html", "regolamento.html", "tema.css",
  ...readdirSync(join(R, "js")).map(f => "js/" + f)];
const mancanti = new Map();
for (const f of sorgenti) {
  /* senza commenti: lì i percorsi sono solo esempi */
  const testo = leggi(f).replace(/\/\*[\s\S]*?\*\//g, "").replace(/<!--[\s\S]*?-->/g, "").replace(/(^|[^:"'`])\/\/[^\n]*/g, "$1");
  for (const m of testo.matchAll(/["'`(]((?:immagini|audio)\/[^"'`)\s${}]+\.(?:webp|png|jpe?g|gif|mp4|webm|mp3|ogg|wav|m4a))["'`)]/gi)) {
    if (!existsSync(join(R, m[1]))) mancanti.set(m[1], (mancanti.get(m[1]) || new Set()).add(f));
  }
}
/* GitHub Pages distingue le maiuscole: existsSync su Linux anche */
if (mancanti.size === 0) ok("Immagini e audio citati nel codice: tutti presenti");
for (const [p, dove] of mancanti) {
  const cartella = join(R, dirname(p)), nome = p.split("/").pop();
  const simile = existsSync(cartella) && readdirSync(cartella).find(x => x.toLowerCase() === nome.toLowerCase());
  ko(`${p} manca (citato in ${[...dove].join(", ")})${simile ? ` — esiste «${simile}»: maiuscole diverse, su GitHub Pages non si carica` : ""}`);
}

console.log(`\nCoerenza: ${divergenze ? divergenze + " divergenze" : "tutto allineato"}`);
process.exit(divergenze ? 1 : 0);
