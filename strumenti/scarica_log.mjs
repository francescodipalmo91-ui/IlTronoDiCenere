/* SCARICA LOG — porta sul PC i log anonimi delle partite e pulisce Firestore (20/11/2026; docs/logging_partite.md).
   1. Scarica tutti gli eventi da Firestore (log/{partita}/eventi/{n}) e li salva in log_partite/<partita>.jsonl
      (un evento per riga; gli eventi già salvati non si duplicano). Sul PC i dati restano.
   2. Cancella da Firestore gli eventi più vecchi di 30 giorni (campo «scade»), SOLO dopo averli salvati.
   3. Stampa un riassunto: partite, eventi per tipo, scontri per nemico, prove fallite, morti, dove si smette di giocare.
   Scrive un registro di ogni esecuzione in log_partite/esecuzioni.txt.

   Serve una chiave di servizio di Firebase (console → Impostazioni progetto → Account di servizio → Genera nuova chiave privata),
   salvata come strumenti/chiave_firebase.json. La chiave resta SOLO sul PC: è nel .gitignore, mai su GitHub.
   Uso:  node strumenti/scarica_log.mjs            (scarica, pulisce, riassume)
         SOLO_RIASSUNTO=1 node strumenti/scarica_log.mjs   (non tocca Firestore: riassume ciò che c'è già sul PC)
   Pianificato ogni 30 giorni con strumenti/scarica_log.bat (istruzioni dentro il file). */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const qui = path.dirname(fileURLToPath(import.meta.url)), radice = path.join(qui, "..");
const CARTELLA = path.join(radice, "log_partite"), CHIAVE = process.env.CHIAVE_FIREBASE || path.join(qui, "chiave_firebase.json");
fs.mkdirSync(CARTELLA, { recursive: true });
const annota = (riga) => fs.appendFileSync(path.join(CARTELLA, "esecuzioni.txt"), `${new Date().toISOString()}  ${riga}\n`);

/* eventi già salvati sul PC: chiave = id del documento */
function leggiLocali() {
  const per = new Map();
  for (const f of fs.readdirSync(CARTELLA).filter(f => f.endsWith(".jsonl"))) {
    const m = new Map();
    for (const r of fs.readFileSync(path.join(CARTELLA, f), "utf8").split("\n").filter(Boolean)) { try { const e = JSON.parse(r); m.set(e._id, e); } catch {} }
    per.set(f.replace(/\.jsonl$/, ""), m);
  }
  return per;
}
function salvaLocali(per) {
  for (const [partita, m] of per) {
    const righe = [...m.values()].sort((a, b) => a.t - b.t || a.n - b.n).map(e => JSON.stringify(e));
    fs.writeFileSync(path.join(CARTELLA, partita.replace(/[^\w-]/g, "_") + ".jsonl"), righe.join("\n") + "\n");
  }
}

async function scarica(per) {
  if (!fs.existsSync(CHIAVE)) { console.log(`Manca la chiave di servizio: ${CHIAVE}\nVedi le istruzioni in cima a questo file.`); annota("ERRORE: chiave mancante"); process.exit(1); }
  const { initializeApp, cert } = await import("firebase-admin/app");
  const { getFirestore } = await import("firebase-admin/firestore");
  initializeApp({ credential: cert(JSON.parse(fs.readFileSync(CHIAVE, "utf8"))) });
  const db = getFirestore();
  const snap = await db.collectionGroup("eventi").get();
  let nuovi = 0; const vecchi = [];
  for (const d of snap.docs) {
    const e = d.data(), partita = d.ref.parent.parent ? d.ref.parent.parent.id : (e.partita || "senza_partita");
    if (!per.has(partita)) per.set(partita, new Map());
    const m = per.get(partita);
    if (!m.has(d.id)) { m.set(d.id, { _id: d.id, ...e, dati: (() => { try { return JSON.parse(e.dati); } catch { return e.dati; } })() }); nuovi++; }
    if (Number(e.scade) < Date.now()) vecchi.push(d.ref);
  }
  salvaLocali(per); /* prima si salva, poi si cancella */
  for (let i = 0; i < vecchi.length; i += 400) { const b = db.batch(); vecchi.slice(i, i + 400).forEach(r => b.delete(r)); await b.commit(); }
  annota(`scaricati ${snap.size} eventi (${nuovi} nuovi), cancellati da Firestore ${vecchi.length} più vecchi di 30 giorni`);
  console.log(`Firestore: ${snap.size} eventi letti, ${nuovi} nuovi salvati in log_partite/, ${vecchi.length} vecchi cancellati.`);
}

function riassunto(per) {
  const tutti = [...per.values()].flatMap(m => [...m.values()]);
  const conta = (xs) => [...xs.reduce((m, x) => m.set(x, (m.get(x) || 0) + 1), new Map())].sort((a, b) => b[1] - a[1]);
  const pc = (a, b) => (b ? Math.round((100 * a) / b) + "%" : "—");
  console.log(`\nPartite: ${per.size} · eventi: ${tutti.length}`);
  console.log("Eventi per tipo: " + conta(tutti.map(e => e.tipo)).map(([k, v]) => `${k} ${v}`).join(", "));
  const inizi = tutti.filter(e => e.tipo === "inizio");
  console.log("Classi giocate: " + (conta(inizi.map(e => `${e.dati.classe}/${e.dati.spec}`)).map(([k, v]) => `${k} ${v}`).join(", ") || "—"));
  const sc = tutti.filter(e => e.tipo === "scontro");
  if (sc.length) {
    console.log("\nScontri per nemico (vinti / totale, turni medi):");
    const per2 = new Map(); sc.forEach(e => { const k = e.dati.nemico; if (!per2.has(k)) per2.set(k, []); per2.get(k).push(e.dati); });
    for (const [k, rs] of [...per2].sort((a, b) => b[1].length - a[1].length)) {
      const v = rs.filter(r => r.esito === "vinto").length, t = rs.reduce((s, r) => s + (r.turni || 0), 0) / rs.length;
      console.log(`   ${k}: ${v} / ${rs.length} (${pc(v, rs.length)}), turni ${t.toFixed(1)}, esiti: ${conta(rs.map(r => r.esito)).map(([a, b]) => `${a} ${b}`).join(", ")}`);
    }
  }
  const pr = tutti.filter(e => e.tipo === "prova");
  if (pr.length) {
    const ko = pr.filter(e => !e.dati.ok);
    console.log(`\nProve: ${pr.length}, fallite ${pc(ko.length, pr.length)}. Più fallite: ${conta(ko.map(e => `${e.dati.titolo || "?"} (${e.dati.luogo})`)).slice(0, 8).map(([k, v]) => `${k} ${v}`).join("; ")}`);
  }
  const morti = tutti.filter(e => e.tipo === "morte");
  if (morti.length) console.log(`Morti: ${morti.length} — ${conta(morti.map(e => `${e.dati.nemico || e.dati.luogo}`)).map(([k, v]) => `${k} ${v}`).join(", ")}`);
  const uscite = tutti.filter(e => e.tipo === "uscita");
  if (uscite.length) console.log(`Dove si smette di giocare: ${conta(uscite.map(e => e.dati.luogo)).slice(0, 8).map(([k, v]) => `${k} ${v}`).join(", ")}`);
  const mov = tutti.filter(e => e.tipo === "movimento" && e.dati.secondi > 0);
  if (mov.length) {
    const tempo = new Map(); mov.forEach(e => tempo.set(e.dati.da, (tempo.get(e.dati.da) || 0) + e.dati.secondi));
    console.log(`Luoghi dove si resta più a lungo (minuti in tutto): ${[...tempo].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k} ${Math.round(v / 60)}`).join(", ")}`);
  }
}

const per = leggiLocali();
try {
  if (!process.env.SOLO_RIASSUNTO) await scarica(per);
  riassunto(per);
} catch (e) {
  annota("ERRORE: " + (e && e.message || e)); console.error("Errore:", e && e.message || e); process.exitCode = 1;
}
