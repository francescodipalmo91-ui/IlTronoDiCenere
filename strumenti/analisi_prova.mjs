/* Analisi dei log della sala di prova del motore nuovo (prova.html, formato v2, 08/11/2026).
   Riassume in poche righe COME si gioca: esiti, poteri scelti e lasciati, giornalieri, momenti (Vacillante, annunci).
   Uso:  node strumenti/analisi_prova.mjs [cartella o file .json/.jsonl]   (predefinita: log_scontri accanto a prova.html)
   Filtri: CLASSE=arcanista (o guerriero, sciamano, monaco)  SPEC=sangue  NEMICO=lupo  DA=2026-11-08
           TUTTI=1 conta anche gli scontri interrotti;  DETTAGLIO=<id> stampa il diario di uno scontro. */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

/* funziona sia dal repo (strumenti/) sia dalla cartella PROVA_riscrittura (accanto a prova.html) */
const qui = path.dirname(fileURLToPath(import.meta.url));
const dove = process.argv[2] || [path.join(qui, "log_scontri"), "log_scontri", path.join("PROVA_riscrittura", "log_scontri")].find(d => fs.existsSync(d)) || "log_scontri";
globalThis.window = globalThis;
const SP = createRequire(import.meta.url)([path.join(qui, "js", "specializzazioni.js"), path.join(qui, "..", "js", "specializzazioni.js")].find(f => fs.existsSync(f)));
const GIORNALIERI = new Set(Object.entries(SP.POTERI).filter(([, p]) => p.tipo === "giornaliero").map(([k]) => k));
const E = process.env;
function carica() {
  if (!fs.existsSync(dove)) { console.log(`Nessun log: ${dove} non esiste.`); process.exit(0); }
  const file = fs.statSync(dove).isDirectory() ? fs.readdirSync(dove).filter(f => /\.jsonl?$/.test(f)).map(f => path.join(dove, f)) : [dove];
  const tutti = new Map();
  for (const f of file) {
    const testo = fs.readFileSync(f, "utf8"), righe = f.endsWith(".jsonl") ? testo.split("\n").filter(Boolean) : [testo];
    for (const r of righe) { try { const x = JSON.parse(r); if (x && x.id && x.v === 2) tutti.set(x.id, x); } catch { console.log(`File illeggibile, saltato: ${path.basename(f)}`); } }
  }
  return [...tutti.values()].sort((a, b) => a.inizio.localeCompare(b.inizio));
}
const pc = (a, b) => (b ? Math.round((100 * a) / b) + "%" : "—");
const media = (xs) => (xs.length ? (xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1) : "—");
const conta = (xs) => xs.reduce((m, x) => m.set(x, (m.get(x) || 0) + 1), new Map());
const top = (m, n) => [...m].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `${k} ${v}`).join(", ") || "—";

let log = carica();
if (E.DETTAGLIO) {
  const r = log.find(x => x.id === E.DETTAGLIO); if (!r) { console.log("Scontro non trovato:", E.DETTAGLIO); process.exit(0); }
  console.log(r.diario.join("\n")); process.exit(0);
}
const tot = log.length;
if (!E.TUTTI) log = log.filter(r => r.esito !== "interrotto");
if (E.CLASSE) log = log.filter(r => (r.pg.nomeClasse || "").toLowerCase() === E.CLASSE.toLowerCase());
if (E.SPEC) log = log.filter(r => r.pg.spec === E.SPEC);
if (E.NEMICO) log = log.filter(r => r.nem.id === E.NEMICO);
if (E.DA) log = log.filter(r => r.inizio.slice(0, 10) >= E.DA);
console.log(`Log letti: ${tot} · analizzati: ${log.length}${E.TUTTI ? "" : " (esclusi gli interrotti; TUTTI=1 per contarli)"}`);
if (!log.length) process.exit(0);

/* 1. esiti per personaggio e nemico */
console.log("\n1. Esiti");
const gruppi = new Map();
log.forEach(r => { const k = `${r.pg.nomeClasse} ${r.pg.spec} liv. ${r.pg.liv}${r.pg.via ? " (" + r.pg.via + ")" : ""} contro ${r.nem.nome}`; if (!gruppi.has(k)) gruppi.set(k, []); gruppi.get(k).push(r); });
for (const [k, rs] of gruppi) {
  const v = rs.filter(r => r.esito === "vittoria");
  console.log(`   ${k}: ${rs.length} scontri, vittorie ${pc(v.length, rs.length)}, turni medi ${media(rs.map(r => r.turni))}, salute rimasta (vittorie) ${media(v.map(r => Math.round(100 * r.pvFinePg / r.pg.pvMax)))}%`);
}

/* 2. poteri: quante volte usati e quante volte erano disponibili ma lasciati */
console.log("\n2. Poteri (usati / disponibili nei turni)");
const usati = conta(log.flatMap(r => r.azioni.map(a => a.id)));
const disponibili = conta(log.flatMap(r => r.azioni.flatMap(a => a.scelte)));
[...disponibili].sort((a, b) => (usati.get(b[0]) || 0) - (usati.get(a[0]) || 0)).forEach(([id, n]) => console.log(`   ${id}: ${usati.get(id) || 0} / ${n} (${pc(usati.get(id) || 0, n)})`));
if (usati.get("passa")) console.log(`   passa il turno: ${usati.get("passa")}`);

/* 3. momenti */
console.log("\n3. Momenti");
const az = log.flatMap(r => r.azioni);
console.log(`   Primo turno: ${top(conta(log.map(r => r.azioni[0] && r.azioni[0].id).filter(Boolean)), 5)}`);
console.log(`   Con il nemico Vacillante: ${top(conta(az.filter(a => a.prima.vacNem).map(a => a.id)), 5)}`);
console.log(`   Quando sei Vacillante: ${top(conta(az.filter(a => a.prima.vacPg).map(a => a.id)), 5)}`);
console.log(`   Con un colpo annunciato dal nemico: ${top(conta(az.filter(a => a.prima.nemPronto).map(a => a.id)), 5)}`);
const sv = az.filter(a => a.sangueVersato).length; if (sv) console.log(`   Sangue versato pagato: ${sv} volte`);

/* 4. giornalieri: in che turno e in che situazione */
console.log("\n4. Giornalieri (scelta di creazione e livelli 3-5)");
const giorn = log.flatMap(r => r.azioni.filter(a => GIORNALIERI.has(a.id)).map(a => ({ ...a, r })));
if (!giorn.length) console.log("   nessun giornaliero usato");
for (const [id, n] of conta(giorn.map(a => a.id))) {
  const g = giorn.filter(a => a.id === id);
  console.log(`   ${id}: ${n} volte, turno medio ${media(g.map(a => a.t))}, col nemico Vacillante ${pc(g.filter(a => a.prima.vacNem).length, n)}`);
}
console.log("\nDettaglio di uno scontro: DETTAGLIO=<id>. Ultimi id: " + log.slice(-5).map(r => `${r.id} (${r.pg.nomeClasse} ${r.pg.spec} vs ${r.nem.id}, ${r.esito})`).join(", "));
