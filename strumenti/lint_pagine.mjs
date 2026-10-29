/* LINT DELLE PAGINE — ESLint su ogni pagina HTML come la vede il browser.
   Gli script del gioco sono "classici" (niente import/export) e condividono le variabili globali:
   per questo ogni pagina viene ricostruita unendo, nell'ordine di caricamento, i file js/ e gli
   script scritti dentro l'HTML. Così ESLint trova anche una funzione chiamata in gioco.html ma
   definita in un file che quella pagina non carica.
   Uso:  node strumenti/lint_pagine.mjs            (esce con 1 se ci sono errori)
         node strumenti/lint_pagine.mjs --tutto    (mostra anche gli avvisi) */
import { ESLint } from "eslint";
import globals from "globals";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RADICE = join(dirname(fileURLToPath(import.meta.url)), "..");
const PAGINE = ["index.html", "creazione.html", "gioco.html", "tutorial.html", "regolamento.html"];
const TUTTO = process.argv.includes("--tutto");

/* globali che arrivano da librerie esterne o da Firebase caricato al volo */
const ESTERNI = { Howl: "readonly", Howler: "readonly", DOMPurify: "readonly", firebase: "readonly",
  /* i file js/ e tests/ funzionano anche in Node, protetti da `typeof module !== "undefined"` */
  module: "readonly", require: "readonly", process: "readonly" };

const eslint = new ESLint({
  cwd: RADICE,
  overrideConfigFile: true,
  overrideConfig: {
    languageOptions: { ecmaVersion: "latest", sourceType: "script", globals: { ...globals.browser, ...ESTERNI } },
    rules: {
      "no-undef": "error",            /* variabile o funzione mai definita: errore sicuro a runtime */
      "no-dupe-keys": "error",        /* stessa chiave due volte in un oggetto: la prima si perde */
      "no-dupe-else-if": "error",
      "no-duplicate-case": "error",
      "no-unreachable": "error",
      "no-func-assign": "error",
      "no-const-assign": "error",
      "no-self-assign": "error",
      "no-self-compare": "error",
      "use-isnan": "error",
      "valid-typeof": "error",
      "no-unsafe-negation": "error",
      "no-redeclare": ["error", { builtinGlobals: false }],        /* due function con lo stesso nome tra file: vince l'ultima */
      "no-unused-vars": ["warn", { vars: "local", args: "none", caughtErrors: "none" }],
      "no-empty": ["warn", { allowEmptyCatch: true }],
      "no-constant-condition": ["warn", { checkLoops: false }]
    }
  }
});

/* ricostruisce una pagina: elenco di pezzi { nome, testo, riga } */
function pezzi(pagina) {
  const html = readFileSync(join(RADICE, pagina), "utf8");
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  const out = [];
  let m;
  while ((m = re.exec(html))) {
    const attr = m[1], src = /src\s*=\s*["']([^"']+)["']/i.exec(attr);
    if (/type\s*=\s*["'](module|application\/json|text\/template)/i.test(attr)) continue;
    if (src) {
      const p = src[1];
      if (/^https?:|^\/\//.test(p) || p.startsWith("lib/")) continue; /* librerie esterne/minificate */
      const file = join(RADICE, p);
      out.push(existsSync(file)
        ? { nome: p, testo: readFileSync(file, "utf8"), riga: 1 }
        : { nome: p, testo: `throw "FILE MANCANTE: ${p}";`, riga: 1, mancante: true });
    } else if (m[2].trim()) {
      out.push({ nome: pagina, testo: m[2], riga: html.slice(0, m.index).split("\n").length });
    }
  }
  return out;
}

let errori = 0, avvisi = 0;
const vistiFile = new Map(); /* lo stesso js/ caricato da più pagine: ogni messaggio una volta sola */
for (const pagina of PAGINE) {
  const parti = pezzi(pagina);
  for (const p of parti.filter(p => p.mancante)) { console.log(`✖ ${pagina}: carica ${p.nome}, che non esiste`); errori++; }
  /* un unico testo per pagina, con la mappa riga → (file, riga originale) */
  /* window.Nome = ... in un file caricato dalla pagina rende Nome una globale per quella pagina */
  const definiti = new Set();
  for (const p of parti) for (const m of p.testo.matchAll(/\b(?:window|root|globalThis|self)\.([A-Za-z_$][\w$]*)\s*=(?!=)/g)) definiti.add(m[1]);
  /* un nome che la pagina dichiara anche con const/let/var (es. un alias locale) non va nel commento global */
  for (const p of parti) for (const m of p.testo.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\b/g)) definiti.delete(m[1]);
  let testo = definiti.size ? `/* global ${[...definiti].join(", ")} */` : "", mappa = [];
  for (const p of parti) {
    const righe = p.testo.split("\n");
    righe.forEach((_, i) => mappa.push({ nome: p.nome, riga: p.riga + i }));
    testo += p.testo + "\n;\n"; mappa.push({ nome: p.nome, riga: 0 });
  }
  const [ris] = await eslint.lintText(testo, { filePath: join(RADICE, pagina + ".js") });
  for (const msg of ris.messages) {
    const dove = mappa[(msg.line || 1) - 1] || { nome: pagina, riga: msg.line };
    const chiave = `${dove.nome}:${dove.riga}:${msg.ruleId}:${msg.message}`;
    if (vistiFile.has(chiave)) continue;
    vistiFile.set(chiave, true);
    const grave = msg.severity === 2 || msg.fatal;
    if (grave) errori++; else avvisi++;
    if (grave || TUTTO) console.log(`${grave ? "✖" : "⚠"} ${dove.nome}:${dove.riga}  ${msg.message}  [${msg.ruleId || "sintassi"}] (pagina ${pagina})`);
  }
}
console.log(`\nLint: ${errori} errori, ${avvisi} avvisi${TUTTO ? "" : " (--tutto per vederli)"}`);
process.exit(errori ? 1 : 0);
