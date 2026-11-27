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
const DOC = leggi("docs/archivio/bilanciamento_nemici_oggetti.md");
const GIOCO = leggi("gioco.html");

/* regole.js eseguito come nel browser */
const ctx = { window: {} }; vm.createContext(ctx); vm.runInContext(leggi("js/regole.js"), ctx);

/* 23/11: niente più PE nel gioco, quindi nessun numero da confrontare con i documenti (restano i controlli su immagini e audio) */
const CONTROLLI = [];

let divergenze = 0;
const ok = (s) => console.log("OK      " + s), ko = (s) => { console.log("DIVERGE " + s); divergenze++; }, avviso = (s) => console.log("AVVISO  " + s);
for (const [nome, doc, cod] of CONTROLLI) {
  if (!doc) { ko(`${nome}: valore non trovato nel documento (la tabella è cambiata forma?)`); continue; }
  JSON.stringify(doc) === JSON.stringify(cod) ? ok(`${nome}: ${doc.join(" / ")}`) : ko(`${nome}: documento ${doc.join(" / ")}, codice ${cod.join(" / ")}`);
}

/* immagini e audio citati nel codice */
const sorgenti = ["index.html", "creazione.html", "gioco.html", "regolamento.html", "tema.css",
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
