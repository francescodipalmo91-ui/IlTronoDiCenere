/* =====================================================================
   REGISTRO — log anonimo delle partite dei tester (20/11/2026; progetto in docs/logging_partite.md)

   Il gioco chiama solo Registro.evento(tipo, dati). Gli eventi vanno in una coda (anche in localStorage,
   così non si perdono se si chiude la pagina o si è offline) e si scrivono su Firestore a lotti:
   a fine scontro, alla prova, al riposo, ogni 30 secondi e quando la pagina passa in secondo piano.
   - Niente richieste al giocatore durante il gioco: il consenso si chiede una volta (pagina iniziale).
     Con «No, grazie» non parte nessuna scrittura. Senza Firebase (js/cloud.js) il registro resta muto.
   - Nessun dato personale: niente nome, niente email. L'uid è quello di Firebase (anonimo se non c'è l'accesso Google).
   - Ogni evento: tipo, dati (JSON in una stringa), versione del gioco, id della partita, numero progressivo,
     sessione, data e ora, dispositivo, scadenza (30 giorni: la cancellazione la fa strumenti/scarica_log.mjs).
   ===================================================================== */
(function (root) {
  const VERSIONE = "2026-11-20";           /* cambiarla quando cambia il bilanciamento, per non mescolare le partite */
  const TIPI = ["inizio", "scontro", "prova", "livello", "riposo", "morte", "guardiano", "movimento", "inventario", "dialogo", "uscita", "fine"];
  const SUBITO = new Set(["scontro", "prova", "riposo", "livello", "morte", "fine", "uscita"]); /* dopo questi si scrive subito */
  const MAX_DATI = 200000, MAX_CODA = 500, GIORNI = 30;
  const K_CONSENSO = "log_consenso", K_CODA = "log_coda", K_N = "log_n";

  const ls = {
    get: (k) => { try { return root.localStorage ? root.localStorage.getItem(k) : null; } catch (e) { return null; } },
    set: (k, v) => { try { if (root.localStorage) { if (v == null) root.localStorage.removeItem(k); else root.localStorage.setItem(k, v); } } catch (e) {} }
  };
  const casuale = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  const sessione = casuale();
  let idPartitaFn = () => null, scrittore = null, inVolo = false, timer = null;

  /* consenso: "si" | "no" | null (non ancora chiesto) */
  const consenso = () => ls.get(K_CONSENSO);
  const attivo = () => consenso() === "si";
  function impostaConsenso(si) { ls.set(K_CONSENSO, si ? "si" : "no"); if (!si) ls.set(K_CODA, null); }

  const leggiCoda = () => { try { const c = JSON.parse(ls.get(K_CODA) || "[]"); return Array.isArray(c) ? c : []; } catch (e) { return []; } };
  const salvaCoda = (c) => ls.set(K_CODA, c.length ? JSON.stringify(c.slice(-MAX_CODA)) : null);
  const prossimoN = () => { const n = (Number(ls.get(K_N)) || 0) + 1; ls.set(K_N, String(n)); return n; };
  const dispositivo = () => (root.Cloud && root.Cloud.dispositivo) || (/Android|iPhone|iPad|Mobile/i.test((root.navigator || {}).userAgent || "") ? "telefono" : "computer");

  /* forma di un evento (la stessa che controllano le regole di Firestore e i test) */
  function crea(tipo, dati, ora) {
    if (!TIPI.includes(tipo)) return null;
    let json; try { json = JSON.stringify(dati == null ? {} : dati); } catch (e) { json = "{}"; }
    if (json.length > MAX_DATI) json = JSON.stringify({ troncato: true, lunghezza: json.length });
    const t = ora || Date.now();
    return { tipo, dati: json, versione: VERSIONE, partita: idPartitaFn() || "senza_partita", n: prossimoN(), sessione, t, dispositivo: dispositivo(), scade: t + GIORNI * 86400000 };
  }

  function evento(tipo, dati) {
    if (!attivo()) return null;
    const e = crea(tipo, dati);
    if (!e) return null;
    const c = leggiCoda(); c.push(e); salvaCoda(c);
    if (SUBITO.has(tipo)) scrivi();
    return e;
  }

  /* scrive la coda, raggruppata per partita, al più 400 eventi per lotto (limite di Firestore: 500) */
  async function scrivi() {
    if (!attivo() || inVolo) return false;
    const w = scrittore || (root.Cloud && root.Cloud.attivo && root.Cloud.scriviLog ? root.Cloud.scriviLog : null);
    if (!w) return false;
    const coda = leggiCoda(); if (!coda.length) return true;
    inVolo = true;
    try {
      const lotto = coda.slice(0, 400), perPartita = {};
      lotto.forEach(e => { (perPartita[e.partita] = perPartita[e.partita] || []).push(e); });
      for (const [id, lista] of Object.entries(perPartita)) { if (!await w(id, lista)) throw new Error("non scritto"); }
      const scritti = new Set(lotto.map(e => e.n + "_" + e.sessione));
      salvaCoda(leggiCoda().filter(e => !scritti.has(e.n + "_" + e.sessione)));
      return true;
    } catch (e) { return false; } /* offline o regole non pubblicate: la coda resta, si riprova più tardi */
    finally { inVolo = false; }
  }

  function avvia(opz) {
    opz = opz || {};
    if (opz.idPartita) idPartitaFn = opz.idPartita;
    if (opz.scrittore) scrittore = opz.scrittore;
    if (timer || !root.setInterval) return;
    timer = root.setInterval(scrivi, 30000);
    if (timer && timer.unref) timer.unref(); /* in Node (test) non tiene vivo il processo */
    if (root.document && root.document.addEventListener) root.document.addEventListener("visibilitychange", () => { if (root.document.visibilityState === "hidden") scrivi(); });
  }

  root.Registro = { evento, scrivi, avvia, consenso, impostaConsenso, attivo, crea, nuovoId: casuale, coda: leggiCoda, TIPI, VERSIONE };
  if (typeof module !== "undefined" && module.exports) module.exports = root.Registro;
})(typeof window !== "undefined" ? window : globalThis);
