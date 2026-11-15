/* Analisi dei log degli scontri giocati a mano (04/11): js/registro_scontri.js li scrive, questo li riassume in poche righe.
   Serve a leggere COME gioca una persona senza aprire i file uno per uno (che costano tempo e token).
   Uso: node strumenti/analisi_log.mjs [cartella o file .jsonl]   (predefinita: log_scontri)
   Opzioni: TUTTI=1 conta anche le prove mirate e quelle coi dadi truccati; DA=2026-11-04 solo dai log di quel giorno in poi;
            CLASSE=arcanista; NEMICO=enea; DETTAGLIO=<id del log> stampa le azioni di un solo scontro. */
import fs from "node:fs";
import path from "node:path";

const dove = process.argv[2] || "log_scontri";
const E = process.env;
function carica() {
  if (!fs.existsSync(dove)) { console.log(`Nessun log: ${dove} non esiste.`); process.exit(0); }
  const file = fs.statSync(dove).isDirectory() ? fs.readdirSync(dove).filter(f => /\.jsonl?$/.test(f)).map(f => path.join(dove, f)) : [dove];
  const tutti = new Map();
  for (const f of file) {
    const testo = fs.readFileSync(f, "utf8");
    const righe = f.endsWith(".jsonl") ? testo.split("\n").filter(Boolean) : [testo];
    for (const r of righe) { try { const x = JSON.parse(r); if (x && x.id) tutti.set(x.id, x); } catch { console.log(`File illeggibile, saltato: ${path.basename(f)}`); } }
  }
  return [...tutti.values()].sort((a, b) => a.inizio.localeCompare(b.inizio));
}
const pc = (a, b) => (b ? Math.round((100 * a) / b) + "%" : "—");
const media = (xs) => (xs.length ? (xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1) : "—");
const conta = (xs) => xs.reduce((m, x) => m.set(x, (m.get(x) || 0) + 1), new Map());
const top = (m, n) => [...m].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `${k} ${v}`).join(", ");
const nomeAz = (z) => (z.id ? z.id + (z.sangue ? "+sangue" : "") : z.a);
const DETONA = ["ebollizione", "cuore_spezzato", "ultima_goccia", "frantumare"];

let log = carica();
const tot = log.length;
if (E.DA) log = log.filter(x => x.inizio >= E.DA);
if (E.CLASSE) log = log.filter(x => x.pg.classe === E.CLASSE);
if (E.NEMICO) log = log.filter(x => x.nem.tipo === E.NEMICO);

if (E.DETTAGLIO) {
  const x = log.find(l => l.id === E.DETTAGLIO); if (!x) { console.log("Log non trovato."); process.exit(1); }
  console.log(`${x.pg.classe} ${x.pg.liv} contro ${x.nem.nome} · ${x.esito} in ${x.turni} turni · nota: ${x.nota || "—"}`);
  x.azioni.forEach(z => { const p = z.prima; console.log(`T${z.t} ${nomeAz(z)} | pv ${p.pv}/${p.pvMax} ris ${p.ris} nem ${p.nPv}/${p.nPvMax}${p.fer ? " fer " + p.fer : ""}${p.cop ? " cop " + p.cop : ""}${p.carica ? " carica " + p.carica + (p.osservato ? " (osservata)" : "") : ""}${z.scelte.pronte ? " | pronte: " + z.scelte.pronte.join(",") : ""}`); });
  process.exit(0);
}

const scartati = { abbandonato: 0, mirata: 0, truccati: 0 };
const veri = log.filter(x => {
  if (x.esito === "abbandonato") { scartati.abbandonato++; return false; }
  if (E.TUTTI) return true;
  if (x.mirata) { scartati.mirata++; return false; }
  if (x.truccati) { scartati.truccati++; return false; }
  return true;
});
console.log(`Log: ${tot} in tutto, ${veri.length} analizzati (esclusi: ${scartati.abbandonato} abbandonati, ${scartati.mirata} prove mirate, ${scartati.truccati} coi dadi truccati${E.TUTTI ? "; TUTTI=1: mirate e truccate incluse" : ""}).`);
if (!veri.length) process.exit(0);

/* 1. esiti per caso */
console.log("\nEsiti (classe livello · nemico: scontri, vittorie, turni medi, salute finale media nelle vittorie)");
const gruppi = new Map();
veri.forEach(x => { const k = `${x.pg.classe} ${x.pg.liv}${x.pg.via ? " " + x.pg.via : ""} · ${x.nem.tipo}`; if (!gruppi.has(k)) gruppi.set(k, []); gruppi.get(k).push(x); });
for (const [k, xs] of gruppi) {
  const v = xs.filter(x => x.esito === "vittoria");
  console.log(`  ${k}: ${xs.length}, ${pc(v.length, xs.length)}, ${media(xs.map(x => x.turni))} turni, ${v.length ? media(v.map(x => (100 * x.finale.pv) / x.pg.pvMax)) + "%" : "—"}`);
}

/* 2. cosa sceglie */
const azioni = veri.flatMap(x => x.azioni.map(z => ({ ...z, x })));
console.log(`\nAzioni: ${azioni.length} (${media(veri.map(x => x.azioni.length))} per scontro)`);
for (const [cl, zs] of conta(azioni.map(z => z.x.pg.classe))) console.log(`  ${cl}: ${top(conta(azioni.filter(z => z.x.pg.classe === cl).map(nomeAz)), 10)}`);

/* 3. comportamenti: le domande che i test automatici devono indovinare */
console.log("\nComportamenti");
const conPronta = azioni.filter(z => z.scelte.pronte && z.scelte.pronte.length);
if (conPronta.length) console.log(`  Combo pronta sul tavolo: presa ${pc(conPronta.filter(z => z.scelte.pronte.includes(z.id)).length, conPronta.length)} (${conPronta.length} volte). Lasciate: ${top(conta(conPronta.filter(z => !z.scelte.pronte.includes(z.id)).flatMap(z => z.scelte.pronte)), 5) || "—"}`);
const potevaSangue = azioni.filter(z => z.a === "incantesimo" && z.scelte.sangue && z.scelte.sangue.includes(z.id));
if (potevaSangue.length) {
  const fascia = (z) => { const r = z.prima.pv / z.prima.pvMax; return r > 0.85 ? "salute >85%" : r > 0.65 ? "65-85%" : "50-65%"; };
  const f = conta(potevaSangue.map(fascia)), s = conta(potevaSangue.filter(z => z.sangue).map(fascia));
  console.log(`  Paga col sangue quando può: ${pc(potevaSangue.filter(z => z.sangue).length, potevaSangue.length)} · ${[...f].map(([k, n]) => `${k} ${pc(s.get(k) || 0, n)}`).join(", ")}`);
}
const deton = azioni.filter(z => DETONA.includes(z.id));
if (deton.length) console.log(`  Detonazioni: ${deton.length}, con Ferite/Copie in media ${media(deton.map(z => (z.id === "frantumare" ? z.prima.cop : z.prima.fer) || 0))}; a vuoto ${deton.filter(z => !((z.id === "frantumare" ? z.prima.cop : z.prima.fer) > 0)).length}`);
const spreco = azioni.filter(z => z.scelte.alMax && z.scelte.alMax.includes(z.id));
if (spreco.length) console.log(`  Ferite/Copie sprecate (incantesimo lanciato col contatore al massimo): ${spreco.length} · ${top(conta(spreco.map(z => z.id)), 4)}`);
const inCarica = azioni.filter(z => z.prima.carica);
if (inCarica.length) {
  for (const tipo of ["vera", "finta"]) {
    const zs = inCarica.filter(z => z.prima.carica === tipo); if (!zs.length) continue;
    console.log(`  Enea carica (${tipo}): ${zs.length} decisioni · ${top(conta(zs.map(z => z.a === "osserva" ? "osserva" : z.a === "difendo" ? "difende" : "colpisce")), 3)}`);
  }
}
const basso = azioni.filter(z => z.prima.pv / z.prima.pvMax < 0.4);
if (basso.length) console.log(`  Sotto il 40% di salute (${basso.length} azioni): ${top(conta(basso.map(nomeAz)), 6)}`);
const primo = conta(veri.map(x => x.azioni[0] && nomeAz(x.azioni[0])).filter(Boolean));
console.log(`  Prima mossa: ${top(primo, 5)}`);

/* 4. le note: sono la cosa più preziosa */
const note = veri.concat(log.filter(x => x.mirata && !E.TUTTI)).filter(x => x.nota);
if (note.length) { console.log("\nNote"); note.forEach(x => console.log(`  [${x.id}] ${x.pg.classe} ${x.pg.liv} · ${x.nem.tipo} · ${x.esito}${x.mirata ? " (mirata)" : ""}: ${x.nota}`)); }
