/* Test di cloud.js con un Firestore finto (niente rete, niente account).
   Uso:  node tests/cloud.test.js        → stampa OK/ERRORE per ogni caso, esce con 1 se qualcosa fallisce.
   Copre: la tabella di sincronizza() (chi carica, chi scarica, quando è conflitto),
          i dati del cloud illeggibili e la coda degli invii (due salvataggi ravvicinati). */
const fs = require("fs");
const path = require("path");
const assert = require("assert");

function ambiente() {
  const remoto = {}; /* "1" → documento del posto */
  const ls = {};
  global.localStorage = {
    getItem: (k) => (k in ls ? ls[k] : null),
    setItem: (k, v) => { ls[k] = String(v); },
    removeItem: (k) => { delete ls[k]; }
  };
  global.navigator = { userAgent: "test" };
  global.window = {};
  global.document = { createElement: () => ({}), head: { append: (s) => setTimeout(s.onload, 0) } };
  const ritardo = () => new Promise(r => setTimeout(r, 5));
  const doc = (n) => ({
    get: async () => { await ritardo(); return { exists: n in remoto, data: () => remoto[n] }; },
    set: async (v) => { await ritardo(); remoto[n] = { ...v }; },
    _n: n
  });
  const db = {
    collection: () => ({ doc: () => ({ collection: () => ({ doc: (n) => doc(String(n)) }), get: async () => ({ exists: false, data: () => ({}) }), set: async () => {} }) }),
    /* transazione ottimistica come Firestore: se il documento cambia nel frattempo, si riprova */
    runTransaction: async (fn) => {
      for (let tentativo = 0; tentativo < 5; tentativo++) {
        const letti = {}; const scritture = [];
        const tx = {
          get: async (ref) => { const d = await ref.get(); letti[ref._n] = JSON.stringify(remoto[ref._n] || null); return d; },
          set: (ref, v) => scritture.push([ref._n, v])
        };
        const esito = await fn(tx);
        await ritardo();
        if (Object.entries(letti).some(([n, v]) => JSON.stringify(remoto[n] || null) !== v)) continue; /* contesa: riprova */
        scritture.forEach(([n, v]) => { remoto[n] = { ...v }; });
        return esito;
      }
      throw new Error("troppe contese");
    }
  };
  const utente = { uid: "u1", displayName: "Test", email: "t@example.com" };
  global.firebase = {
    initializeApp: () => {},
    auth: Object.assign(() => ({ currentUser: utente, getRedirectResult: async () => null, onAuthStateChanged: (cb) => cb(utente) }), { GoogleAuthProvider: function () {} }),
    firestore: () => db
  };
  const sorgente = fs.readFileSync(path.join(__dirname, "..", "js", "cloud.js"), "utf8");
  new Function(sorgente)();
  return { Cloud: global.window.Cloud, remoto, ls };
}

const posto = (nome, ora) => JSON.stringify({ pg: { nome }, partita: null, aggiornato: ora });
const casi = [];
const caso = (nome, fn) => casi.push([nome, fn]);

caso("solo il locale è cambiato → si carica nel cloud", async () => {
  const { Cloud, remoto, ls } = ambiente();
  ls.slot1 = posto("Locale", 200); ls.sync_base1 = "100"; remoto["1"] = { aggiornato: 100, dati: posto("Vecchio", 100), eliminato: false };
  const r = await Cloud.sincronizza();
  assert.deepStrictEqual(r.conflitti, []);
  assert.strictEqual(JSON.parse(remoto["1"].dati).pg.nome, "Locale");
  assert.strictEqual(ls.sync_base1, "200");
});
caso("solo il cloud è cambiato → si scarica", async () => {
  const { Cloud, remoto, ls } = ambiente();
  ls.slot1 = posto("Vecchio", 100); ls.sync_base1 = "100"; remoto["1"] = { aggiornato: 300, dati: posto("Telefono", 300), eliminato: false };
  await Cloud.sincronizza();
  assert.strictEqual(JSON.parse(ls.slot1).pg.nome, "Telefono");
  assert.strictEqual(ls.sync_base1, "300");
});
caso("cambiati entrambi → conflitto, nessuno sovrascrive l'altro", async () => {
  const { Cloud, remoto, ls } = ambiente();
  ls.slot1 = posto("PC", 200); ls.sync_base1 = "100"; remoto["1"] = { aggiornato: 300, dati: posto("Telefono", 300), eliminato: false };
  const r = await Cloud.sincronizza();
  assert.strictEqual(r.conflitti.length, 1);
  assert.strictEqual(JSON.parse(ls.slot1).pg.nome, "PC");
  assert.strictEqual(JSON.parse(remoto["1"].dati).pg.nome, "Telefono");
});
caso("eliminato qui e non toccato nel cloud → l'eliminazione arriva al cloud", async () => {
  const { Cloud, remoto, ls } = ambiente();
  ls.sync_base1 = "100"; ls.sync_elim1 = "150"; remoto["1"] = { aggiornato: 100, dati: posto("Vecchio", 100), eliminato: false };
  await Cloud.sincronizza();
  assert.strictEqual(remoto["1"].eliminato, true);
  assert.strictEqual(localStorage.getItem("sync_elim1"), null);
});
caso("eliminato nel cloud e non toccato qui → sparisce anche qui", async () => {
  const { Cloud, remoto, ls } = ambiente();
  ls.slot1 = posto("Vecchio", 100); ls.sync_base1 = "100"; remoto["1"] = { aggiornato: 400, dati: null, eliminato: true };
  await Cloud.sincronizza();
  assert.strictEqual(localStorage.getItem("slot1"), null);
});
caso("uguali da entrambe le parti → nessun conflitto, solo allineamento", async () => {
  const { Cloud, remoto, ls } = ambiente();
  ls.slot1 = posto("Uguale", 500); ls.sync_base1 = "100"; remoto["1"] = { aggiornato: 500, dati: posto("Uguale", 500), eliminato: false };
  const r = await Cloud.sincronizza();
  assert.deepStrictEqual(r.conflitti, []);
  assert.strictEqual(ls.sync_base1, "500");
});
caso("dati del cloud illeggibili → il salvataggio locale resta", async () => {
  const { Cloud, remoto, ls } = ambiente();
  ls.slot1 = posto("Locale", 100); ls.sync_base1 = "100"; remoto["1"] = { aggiornato: 600, dati: "<img src=x onerror=alert(1)>", eliminato: false };
  await Cloud.sincronizza();
  assert.strictEqual(JSON.parse(ls.slot1).pg.nome, "Locale");
});
caso("due salvataggi ravvicinati → entrambi «ok», nessun falso conflitto", async () => {
  const { Cloud, remoto, ls } = ambiente();
  ls.slot1 = posto("Primo", 700); ls.sync_base1 = "0";
  const a = Cloud.inviaSlot(1);
  ls.slot1 = posto("Secondo", 701);
  const b = Cloud.inviaSlot(1);
  assert.deepStrictEqual(await Promise.all([a, b]), ["ok", "ok"]);
  assert.strictEqual(JSON.parse(remoto["1"].dati).pg.nome, "Secondo");
});

(async () => {
  let ko = 0;
  for (const [nome, fn] of casi) {
    try { await fn(); console.log("OK      " + nome); }
    catch (e) { ko++; console.log("ERRORE  " + nome + "\n        " + e.message); }
  }
  console.log(`\n${casi.length - ko}/${casi.length} casi superati`);
  process.exit(ko ? 1 : 0);
})();
