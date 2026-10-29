/* REGOLE FIRESTORE — prova firestore.rules sull'emulatore locale di Firebase (nessun dato vero).
   Uso:  npm run test:firestore      (avvia l'emulatore, lancia questo file, spegne l'emulatore; serve Java)
   Ogni caso imita una scrittura vera di js/cloud.js oppure un tentativo che le regole devono fermare. */
import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";

const env = await initializeTestEnvironment({
  projectId: "demo-trono",
  firestore: { rules: readFileSync(new URL("../firestore.rules", import.meta.url), "utf8"), host: "127.0.0.1", port: 8080 }
});
const io = env.authenticatedContext("francesco").firestore();
const altro = env.authenticatedContext("intruso").firestore();
const anonimo = env.unauthenticatedContext().firestore();
const posto = (db, uid, n) => db.collection("utenti").doc(uid).collection("posti").doc(String(n));
const SALVA = { aggiornato: Date.now(), dati: JSON.stringify({ pg: { nome: "Prova" }, partita: {} }), dispositivo: "telefono", eliminato: false };

const casi = [
  ["salvo nel mio posto 1 (come cloud.js)", () => assertSucceeds(posto(io, "francesco", 1).set(SALVA))],
  ["rileggo il mio posto", () => assertSucceeds(posto(io, "francesco", 1).get())],
  ["segno eliminato il mio posto 2 (come cloud.js)", () => assertSucceeds(posto(io, "francesco", 2).set({ aggiornato: Date.now(), dati: null, dispositivo: "computer", eliminato: true }))],
  ["tutorial completato nel profilo (merge, come cloud.js)", () => assertSucceeds(io.collection("utenti").doc("francesco").set({ tutorial_completato: true }, { merge: true }))],
  ["transazione di salvataggio (come inviaSlot)", () => assertSucceeds(io.runTransaction(async tx => { const r = posto(io, "francesco", 3); await tx.get(r); tx.set(r, SALVA); }))],
  ["un altro utente NON legge il mio posto", () => assertFails(posto(altro, "francesco", 1).get())],
  ["un altro utente NON scrive nel mio posto", () => assertFails(posto(altro, "francesco", 1).set(SALVA))],
  ["senza accesso NON si legge niente", () => assertFails(posto(anonimo, "francesco", 1).get())],
  ["posto 4 rifiutato", () => assertFails(posto(io, "francesco", 4).set(SALVA))],
  ["campo estraneo rifiutato", () => assertFails(posto(io, "francesco", 1).set({ ...SALVA, admin: true }))],
  ["salvataggio oltre 1 MB rifiutato", () => assertFails(posto(io, "francesco", 1).set({ ...SALVA, dati: "x".repeat(1000001) }))],
  ["dispositivo inventato rifiutato", () => assertFails(posto(io, "francesco", 1).set({ ...SALVA, dispositivo: "tostapane" }))],
  ["cancellazione dal client rifiutata", () => assertFails(posto(io, "francesco", 1).delete())],
  ["profilo con campi estranei rifiutato", () => assertFails(io.collection("utenti").doc("francesco").set({ ruolo: "admin" }, { merge: true }))]
];

let ko = 0;
for (const [nome, fn] of casi) {
  try { await fn(); console.log("OK     " + nome); } catch (e) { ko++; console.log("FALLITO " + nome + " — " + (e.message || e).split("\n")[0]); }
}
await env.cleanup();
console.log(`\n${casi.length - ko} / ${casi.length} superati`);
process.exit(ko ? 1 : 0);
