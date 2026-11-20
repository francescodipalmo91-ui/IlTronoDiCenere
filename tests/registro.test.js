/* Test del registro delle partite (js/registro.js, 20/11/2026): forma degli eventi, consenso, coda offline, lotti, scadenza.
   Uso: node tests/registro.test.js  (nessun Firebase: lo scrittore è finto) */
(async function () {
  const mem = {};
  globalThis.localStorage = { getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: (k) => { delete mem[k]; } };
  globalThis.window = globalThis;
  const R = require("../js/registro.js");
  const casi = [];
  const caso = (nome, fn) => casi.push({ nome, fn });
  const eq = (a, b, msg) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${msg || "atteso"}: ${JSON.stringify(b)}, ottenuto ${JSON.stringify(a)}`); };
  const vero = (x, msg) => { if (!x) throw new Error(msg || "atteso vero"); };
  const azzera = () => { Object.keys(mem).forEach(k => delete mem[k]); };
  let scritti = [], fallisce = false;
  R.avvia({ idPartita: () => "partita1", scrittore: async (id, lista) => { if (fallisce) return false; scritti.push(...lista.map(e => ({ id, ...e }))); return true; } });

  caso("Senza consenso (mai chiesto o «No, grazie») non si registra e non si scrive nulla", async () => {
    azzera(); scritti = [];
    eq(R.evento("prova", { ok: true }), null, "consenso non chiesto");
    R.impostaConsenso(false); eq(R.evento("prova", { ok: true }), null, "consenso negato");
    await R.scrivi(); eq(scritti.length, 0); eq(R.coda().length, 0);
  });
  caso("Forma dell'evento: i campi che le regole di Firestore accettano, dati in JSON, scadenza a 30 giorni", async () => {
    azzera(); scritti = []; R.impostaConsenso(true);
    const e = R.crea("movimento", { luogo: "cucina" }, 1000);
    eq(Object.keys(e).sort(), ["dati", "dispositivo", "n", "partita", "scade", "sessione", "t", "tipo", "versione"]);
    eq(JSON.parse(e.dati), { luogo: "cucina" }); eq(e.partita, "partita1"); eq(e.scade - e.t, 30 * 86400000);
    vero(["computer", "telefono"].includes(e.dispositivo)); vero(Number.isInteger(e.n));
    eq(R.crea("inventato", {}), null, "tipo sconosciuto");
  });
  caso("Gli eventi importanti si scrivono subito; gli altri aspettano in coda", async () => {
    azzera(); scritti = []; R.impostaConsenso(true);
    R.evento("movimento", { luogo: "atrio" }); eq(R.coda().length, 1); eq(scritti.length, 0);
    R.evento("prova", { ok: false }); await new Promise(r => setTimeout(r, 10));
    eq(scritti.map(e => e.tipo), ["movimento", "prova"]); eq(R.coda().length, 0);
  });
  caso("Offline: la coda resta (anche in localStorage) e si svuota al primo invio riuscito", async () => {
    azzera(); scritti = []; R.impostaConsenso(true); fallisce = true;
    R.evento("riposo", { giorno: 2 }); await new Promise(r => setTimeout(r, 10));
    eq(scritti.length, 0); eq(R.coda().length, 1); vero(mem.log_coda, "coda salvata");
    fallisce = false; await R.scrivi(); eq(scritti.length, 1); eq(R.coda().length, 0);
  });
  caso("Dati enormi: troncati, mai oltre il limite delle regole", async () => {
    azzera(); R.impostaConsenso(true);
    const e = R.crea("scontro", { registro: "x".repeat(300000) });
    vero(e.dati.length < 200000); eq(JSON.parse(e.dati).troncato, true);
  });
  caso("Numeri progressivi crescenti nella stessa partita", async () => {
    azzera(); R.impostaConsenso(true);
    const a = R.crea("prova", {}), b = R.crea("prova", {}); eq(b.n, a.n + 1);
  });

  let ko = 0;
  for (const { nome, fn } of casi) { try { await fn(); console.log("OK     " + nome); } catch (e) { ko++; console.log("ERRORE " + nome + "\n       → " + e.message); } }
  console.log(`\n${casi.length - ko} / ${casi.length} superati`);
  if (ko) process.exitCode = 1;
})();
