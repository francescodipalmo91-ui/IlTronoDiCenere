/* PULIZIA SETTIMANALE — un REPORT sullo stato del codice, non una correzione automatica.
   Gira ogni lunedì su GitHub (workflow «Pulizia settimanale») e aggiorna un'unica Issue con il report
   e la differenza rispetto alla settimana prima. Non cambia mai i file del gioco.

   Cosa cerca (tutte cose che i test a ogni push NON vedono, perché non rompono niente oggi):
     1. file orfani      immagini, audio e script che nessuna pagina usa più
     2. peso             immagini e audio troppo pesanti per il telefono, doppioni png/webp
     3. duplicati        blocchi di codice copiati e incollati (CSS e JS)
     4. codice morto     funzioni dichiarate e mai chiamate
     5. funzioni lunghe  funzioni sopra le 150 righe (difficili da modificare senza rompere)
     6. residui          console.log, debugger, TODO/FIXME/PROVVISORIO, blocchi di codice commentato
     7. dimensioni       righe per file, per vedere se gioco.html continua a crescere
     8. dipendenze       pacchetti npm vecchi o con vulnerabilità note (solo con --npm)

   Uso:  node strumenti/pulizia_settimanale.mjs                       report a video
         node strumenti/pulizia_settimanale.mjs --npm                 anche npm outdated / npm audit (serve la rete)
         node strumenti/pulizia_settimanale.mjs --md report.md --json metriche.json [--precedente vecchie.json]
   Esce sempre con 0: è un promemoria, non un cancello. Le soglie stanno in SOGLIE, le eccezioni in IGNORA. */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, extname, basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import * as espree from "espree";

const R = join(dirname(fileURLToPath(import.meta.url)), "..");
const arg = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : null; };
const CON_NPM = process.argv.includes("--npm");

const SOGLIE = {
  immagineKB: 1024,      /* sopra 1 MB un'immagine rallenta il caricamento sul telefono */
  audioKB: 4096,
  righeFunzione: 150,
  righeDuplicato: 6,     /* blocchi identici di almeno 6 righe "vere" */
  righeCommentate: 5     /* almeno 5 righe di codice commentato di fila */
};
/* file usati con nomi costruiti al volo (non compaiono scritti per intero nel codice) */
const DINAMICI = [/^immagini\/pg\//];
/* funzioni chiamate da fuori (console, test, Firebase) che non vanno segnalate come morte */
const IGNORA_FUNZIONI = new Set([]);

/* ---------- raccolta file ---------- */
const SALTA = new Set(["node_modules", ".git", "archivio", "IDEE", "docs", ".github", ".impeccable"]);
function tutti(dir = R) {
  const out = [];
  for (const n of readdirSync(dir)) {
    if (SALTA.has(n)) continue;
    const p = join(dir, n), s = statSync(p);
    if (s.isDirectory()) out.push(...tutti(p)); else out.push(relative(R, p).split("\\").join("/"));
  }
  return out;
}
const FILE = tutti();
const leggi = (f) => readFileSync(join(R, f), "utf8");
const kb = (f) => Math.round(statSync(join(R, f)).size / 1024);
const CODICE = FILE.filter(f => /\.(html|js|mjs|css|json)$/.test(f) && !f.startsWith("lib/") && f !== "package-lock.json");
const GIOCO = CODICE.filter(f => !/^(tests|strumenti)\//.test(f) && f !== "package.json"); /* il gioco vero */
const TESTO = Object.fromEntries(CODICE.map(f => [f, leggi(f)]));
const testoGioco = GIOCO.map(f => TESTO[f]).join("\n");

/* pezzi di JavaScript: file js/ e script dentro gli HTML (con la riga di partenza) */
function pezziJS() {
  const out = [];
  for (const f of GIOCO) {
    if (f.endsWith(".js")) out.push({ f, testo: TESTO[f], riga: 1 });
    if (f.endsWith(".html")) for (const m of TESTO[f].matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
      if (/src=|type=["'](module|application\/json)/i.test(m[1]) || !m[2].trim()) continue;
      out.push({ f, testo: m[2], riga: TESTO[f].slice(0, m.index).split("\n").length });
    }
  }
  return out;
}
const JS = pezziJS();

/* ---------- 1. file orfani ---------- */
const MEDIA = FILE.filter(f => /^(immagini|audio|js|lib)\//.test(f) && !/\.(md|txt)$/.test(f));
const orfani = MEDIA.filter(f => {
  if (DINAMICI.some(re => re.test(f))) return false;
  if (testoGioco.includes(f)) return false;
  const nome = basename(f);  /* anche citato senza cartella, o senza estensione (es. scegliAudio("combat1")) */
  if (testoGioco.includes(nome)) return false;
  if (f.startsWith("lib/fonts/")) return !testoGioco.includes(nome.replace(extname(nome), ""));
  return !new RegExp(`["'\`/]${nome.replace(extname(nome), "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'\`.]`).test(testoGioco);
}).map(f => ({ f, kb: kb(f) }));

/* ---------- 2. peso ---------- */
const pesanti = FILE.filter(f => /^(immagini|audio)\//.test(f)).map(f => ({ f, kb: kb(f) }))
  .filter(x => /\.(png|jpe?g|webp|gif)$/i.test(x.f) ? x.kb > SOGLIE.immagineKB : /\.(mp3|ogg|wav|m4a)$/i.test(x.f) && x.kb > SOGLIE.audioKB)
  .sort((a, b) => b.kb - a.kb);
const doppioni = FILE.filter(f => /\.(png|jpe?g)$/i.test(f)).map(f => {
  const w = f.replace(/\.(png|jpe?g)$/i, ".webp");
  const w2 = FILE.find(x => x.toLowerCase() === w.toLowerCase() || basename(x).toLowerCase().replace(/_/g, "") === basename(w).toLowerCase().replace(/_/g, ""));
  return w2 && w2 !== f ? { f, webp: w2, kb: kb(f) } : null;
}).filter(Boolean);

/* ---------- 3. duplicati (finestre di righe identiche) ---------- */
function duplicati() {
  const banali = /^[\s{}()[\];,]*$|^\s*(\/\/|\/\*|\*)|^\s*<\/?(div|span|p|li|ul|section)>\s*$/;
  const righe = [];
  for (const f of GIOCO.filter(f => /\.(js|css|html)$/.test(f)))
    TESTO[f].split("\n").forEach((t, i) => { const n = t.trim().replace(/\s+/g, " "); if (n.length > 3 && !banali.test(t)) righe.push({ f, r: i + 1, n }); });
  const N = SOGLIE.righeDuplicato, viste = new Map();
  for (let i = 0; i + N <= righe.length; i++) {
    const fin = righe.slice(i, i + N);
    if (fin.some(x => x.f !== fin[0].f)) continue;
    const chiave = fin.map(x => x.n).join("\n");
    if (chiave.length < 150) continue; /* righe troppo corte: coincidenze, non copie */
    (viste.get(chiave) || viste.set(chiave, []).get(chiave)).push({ f: fin[0].f, r: fin[0].r, i });
  }
  /* fonde le finestre consecutive nello stesso blocco */
  const gruppi = [];
  let ultimo = null;
  for (const [k, pos] of viste) {
    if (pos.length < 2) continue;
    const firma = pos.map(p => p.f).join("|");
    if (ultimo && ultimo.firma === firma && pos.every((p, j) => p.i === ultimo.pos[j].i + ultimo.lung - N + 1)) { ultimo.lung++; ultimo.pos = pos.map((p, j) => ({ ...ultimo.pos[j], i: p.i })); continue; }
    ultimo = { firma, pos: pos.map(p => ({ ...p })), lung: N, inizio: pos.map(p => `${p.f}:${p.r}`), esempio: k.split("\n")[0] };
    gruppi.push(ultimo);
  }
  const righeDup = gruppi.reduce((s, g) => s + g.lung * (g.pos.length - 1), 0);
  return { gruppi: gruppi.sort((a, b) => b.lung * b.pos.length - a.lung * a.pos.length), righeDup, totali: righe.length };
}
const DUP = duplicati();

/* ---------- 4-5. funzioni morte e funzioni lunghe (albero sintattico con espree) ---------- */
const dichiarate = [], lunghe = [], nonLetti = [];
for (const p of JS) {
  let ast;
  try { ast = espree.parse(p.testo, { ecmaVersion: "latest", sourceType: "script", loc: true }); }
  catch (e) { nonLetti.push(`${p.f}:${p.riga + (e.lineNumber || 1) - 1} (${e.message})`); continue; }
  (function visita(n, nomeAttuale) {
    if (!n || typeof n.type !== "string") return;
    let nome = nomeAttuale;
    if (n.type === "FunctionDeclaration" && n.id) { nome = n.id.name; dichiarate.push({ nome, f: p.f, r: p.riga + n.loc.start.line - 1 }); }
    if (n.type === "VariableDeclarator" && n.id.type === "Identifier" && n.init && /Function|Arrow/.test(n.init.type)) nome = n.id.name;
    if (n.type === "Property" && n.key && (n.key.name || n.key.value) && n.value && /Function|Arrow/.test(n.value.type)) nome = n.key.name || n.key.value;
    if (n.type === "CallExpression" && /Function|Arrow/.test(n.callee.type)) n.callee.iife = true; /* (function(){…})(): è solo un contenitore */
    if (/Function/.test(n.type) && !n.iife) {
      const l = n.loc.end.line - n.loc.start.line + 1;
      if (l > SOGLIE.righeFunzione) lunghe.push({ nome: nome || "(anonima)", f: p.f, r: p.riga + n.loc.start.line - 1, righe: l });
    }
    for (const k in n) if (k !== "loc" && k !== "iife") {
      const v = n[k];
      if (Array.isArray(v)) v.forEach(x => visita(x, /Function/.test(n.type) ? null : nome)); else if (v && typeof v.type === "string") visita(v, /Function/.test(n.type) ? null : nome);
    }
  })(ast, null);
}
const conteggio = (nome) => (testoGioco.match(new RegExp(`(?<![\\w$])(?<![^.]\\.)${nome.replace(/\$/g, "\\$")}(?![\\w$])`, "g")) || []).length;
const morte = dichiarate.filter(d => !IGNORA_FUNZIONI.has(d.nome) && conteggio(d.nome) <= 1)
  .map(d => ({ ...d, nei_test: CODICE.filter(f => f.startsWith("tests/")).some(f => TESTO[f].includes(d.nome)) }));
lunghe.sort((a, b) => b.righe - a.righe);

/* ---------- 6. residui ---------- */
const residui = { console: [], debugger: [], segnaposto: [], commentato: [] };
for (const f of GIOCO.filter(f => /\.(js|html)$/.test(f))) {
  const righe = TESTO[f].split("\n");
  let fila = 0;
  righe.forEach((t, i) => {
    if (/\bconsole\.(log|debug)\(/.test(t) && !/^\s*\/\//.test(t)) residui.console.push(`${f}:${i + 1}`);
    if (/^\s*debugger\s*;?\s*$/.test(t)) residui.debugger.push(`${f}:${i + 1}`);
    if (/\b(TODO|FIXME|XXX|HACK|PROVVISORI[OA])\b/.test(t)) residui.segnaposto.push(`${f}:${i + 1}: ${t.trim().slice(0, 90)}`);
    /* codice commentato: // seguito da qualcosa che sembra codice (; { } = (  ) */
    if (/^\s*\/\/.*([;{}]\s*$|\b(const|let|var|function|return|if)\b.*[=({])/.test(t)) fila++;
    else { if (fila >= SOGLIE.righeCommentate) residui.commentato.push(`${f}:${i + 1 - fila} (${fila} righe)`); fila = 0; }
  });
}

/* ---------- 7. dimensioni ---------- */
const dimensioni = GIOCO.filter(f => /\.(html|js|css)$/.test(f)).map(f => ({ f, righe: TESTO[f].split("\n").length, kb: kb(f) })).sort((a, b) => b.righe - a.righe);

/* ---------- 8. dipendenze ---------- */
let npm = null;
if (CON_NPM) {
  const js = (c) => { try { return JSON.parse(execSync(c, { cwd: R, stdio: ["ignore", "pipe", "ignore"] }).toString() || "{}"); } catch (e) { try { return JSON.parse(e.stdout.toString() || "{}"); } catch { return null; } } };
  const out = js("npm outdated --json") || {}, aud = js("npm audit --json");
  npm = {
    vecchi: Object.entries(out).map(([n, v]) => ({ n, ora: v.current, ultima: v.latest, salto: (v.current || "").split(".")[0] !== (v.latest || "").split(".")[0] })),
    vuln: aud && aud.metadata ? aud.metadata.vulnerabilities : null
  };
}

/* ---------- metriche e confronto ---------- */
const M = {
  data: new Date().toISOString().slice(0, 10),
  orfani: orfani.length, orfaniKB: orfani.reduce((s, x) => s + x.kb, 0),
  pesanti: pesanti.length, pesantiKB: pesanti.reduce((s, x) => s + x.kb, 0), doppioni: doppioni.length,
  duplicati: DUP.gruppi.length, righeDuplicate: DUP.righeDup, percDuplicato: +(100 * DUP.righeDup / DUP.totali).toFixed(1),
  funzioniMorte: morte.length, funzioniLunghe: lunghe.length,
  console: residui.console.length, debugger: residui.debugger.length, segnaposto: residui.segnaposto.length, commentato: residui.commentato.length,
  righeTotali: dimensioni.reduce((s, x) => s + x.righe, 0), righeGioco: (dimensioni.find(x => x.f === "gioco.html") || {}).righe || 0,
  npmVecchi: npm ? npm.vecchi.length : null, npmVuln: npm && npm.vuln ? (npm.vuln.high || 0) + (npm.vuln.critical || 0) : null
};
let P = null;
const pf = arg("--precedente");
if (pf && existsSync(pf)) { try { P = JSON.parse(readFileSync(pf, "utf8")); } catch { P = null; } }
const delta = (k) => {
  if (!P || P[k] == null || M[k] == null) return "";
  const d = +(M[k] - P[k]).toFixed(1);
  return d === 0 ? " (=)" : d > 0 ? ` (▲ +${d})` : ` (▼ ${d})`;
};

/* ---------- report ---------- */
const L = [], elenco = (a, n = 10, fmt = (x) => x) => { a.slice(0, n).forEach(x => L.push(`- ${fmt(x)}`)); if (a.length > n) L.push(`- …e altri ${a.length - n}`); };
const MB = (k) => k >= 1024 ? `${(k / 1024).toFixed(1)} MB` : `${k} KB`;
L.push(`# Pulizia settimanale — ${M.data}`, "");
L.push(P ? `Confronto con il ${P.data}. ▲ = peggiorato o cresciuto, ▼ = migliorato.` : "Primo report: dalla prossima settimana compaiono le differenze.", "");
L.push("| Voce | Valore |", "|---|---|",
  `| File orfani | ${M.orfani} (${MB(M.orfaniKB)})${delta("orfani")} |`,
  `| Media pesanti | ${M.pesanti} (${MB(M.pesantiKB)})${delta("pesanti")} |`,
  `| Doppioni png accanto a webp | ${M.doppioni}${delta("doppioni")} |`,
  `| Codice duplicato | ${M.duplicati} blocchi, ${M.percDuplicato}%${delta("percDuplicato")} |`,
  `| Funzioni mai chiamate | ${M.funzioniMorte}${delta("funzioniMorte")} |`,
  `| Funzioni oltre ${SOGLIE.righeFunzione} righe | ${M.funzioniLunghe}${delta("funzioniLunghe")} |`,
  `| Residui (console.log / debugger / codice commentato) | ${M.console} / ${M.debugger} / ${M.commentato}${delta("commentato")} |`,
  `| Lavori aperti (PROVVISORIO / TODO) | ${M.segnaposto}${delta("segnaposto")} |`,
  `| Righe del gioco (gioco.html) | ${M.righeTotali} (${M.righeGioco})${delta("righeGioco")} |`,
  ...(npm ? [`| Pacchetti npm da aggiornare / vulnerabilità alte | ${M.npmVecchi} / ${M.npmVuln ?? "?"} |`] : []), "");

if (orfani.length) { L.push("## 1. File che nessuna pagina usa", "Da controllare a mano: se non servono vanno in `archivio/` (o cancellati). Se un file è usato con un nome costruito al volo, aggiungi la cartella a `DINAMICI`.", ""); elenco(orfani, 20, x => `\`${x.f}\` — ${MB(x.kb)}`); L.push(""); }
if (pesanti.length || doppioni.length) {
  L.push("## 2. Peso", `Soglie: immagini ${MB(SOGLIE.immagineKB)}, audio ${MB(SOGLIE.audioKB)}. Sul Pixel ogni MB è attesa al cambio stanza.`, "");
  elenco(pesanti, 15, x => `\`${x.f}\` — ${MB(x.kb)}`);
  if (doppioni.length) { L.push("", "Png con una versione webp accanto (il png è quasi sempre l'originale dimenticato):"); elenco(doppioni, 15, x => `\`${x.f}\` (${MB(x.kb)}) ↔ \`${x.webp}\``); }
  L.push("");
}
if (DUP.gruppi.length) { L.push("## 3. Codice duplicato", "Blocchi identici in più punti: se ne correggi uno, l'altro resta sbagliato.", ""); elenco(DUP.gruppi, 10, g => `${g.lung} righe × ${g.pos.length}: ${g.inizio.join(", ")} — \`${g.esempio.slice(0, 70)}\``); L.push(""); }
if (morte.length) { L.push("## 4. Funzioni dichiarate e mai chiamate", "Candidate, non certezze: una funzione chiamata solo da console o costruendone il nome al volo compare qui. Quelle da tenere vanno in `IGNORA_FUNZIONI`.", ""); elenco(morte, 25, d => `\`${d.nome}\` — ${d.f}:${d.r}${d.nei_test ? " (usata solo nei test)" : ""}`); L.push(""); }
if (lunghe.length) { L.push(`## 5. Funzioni oltre ${SOGLIE.righeFunzione} righe`, ""); elenco(lunghe, 10, x => `\`${x.nome}\` — ${x.f}:${x.r}, ${x.righe} righe`); L.push(""); }
if (M.console + M.debugger + M.segnaposto + M.commentato) {
  L.push("## 6. Residui e lavori aperti", "I PROVVISORIO non sono sporcizia: sono la lista delle cose da rifinire. Conta solo che il numero scenda nel tempo.", "");
  if (residui.console.length) { L.push("console.log:"); elenco(residui.console, 10); }
  if (residui.debugger.length) { L.push("debugger:"); elenco(residui.debugger, 10); }
  if (residui.commentato.length) { L.push("Codice commentato:"); elenco(residui.commentato, 10); }
  if (residui.segnaposto.length) { L.push("TODO / PROVVISORIO:"); elenco(residui.segnaposto, 15); }
  L.push("");
}
L.push("## 7. Dimensioni dei file", ""); elenco(dimensioni, 6, x => `\`${x.f}\` — ${x.righe} righe, ${MB(x.kb)}`); L.push("");
if (npm) {
  L.push("## 8. Dipendenze", npm.vuln ? `Vulnerabilità: ${Object.entries(npm.vuln).filter(([, v]) => v).map(([k, v]) => `${k} ${v}`).join(", ") || "nessuna"}` : "npm audit non disponibile", "");
  elenco(npm.vecchi, 15, x => `${x.n} ${x.ora} → ${x.ultima}${x.salto ? " ⚠️ versione maggiore: leggere le novità prima di aggiornare" : ""}`); L.push("");
}
if (nonLetti.length) { L.push("## Script non analizzati (errore di lettura)", ""); elenco(nonLetti, 5); L.push(""); }
L.push("---", "*Report automatico di `strumenti/pulizia_settimanale.mjs`. Non corregge niente: si sceglie cosa sistemare, una voce alla volta.*");

const md = L.join("\n");
if (arg("--md")) writeFileSync(arg("--md"), md); else console.log(md);
if (arg("--json")) writeFileSync(arg("--json"), JSON.stringify(M));
