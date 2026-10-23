/* =====================================================================
   CLOUD — salvataggi condivisi tra PC e telefono (Firebase: accesso Google + Firestore)

   FINCHÉ CONFIG È null IL GIOCO FUNZIONA COME PRIMA, SOLO IN LOCALE.

   Configurazione (una volta sola):
   1. https://console.firebase.google.com → "Aggiungi progetto" (Analytics non serve).
   2. Build → Authentication → Inizia → Metodo di accesso: attiva "Google".
      Impostazioni → Domini autorizzati → aggiungi  francescodipalmo91-ui.github.io
   3. Build → Firestore Database → Crea database (modalità produzione, regione europe-west).
      Scheda "Regole": incolla queste e pubblica:

        rules_version = '2';
        service cloud.firestore {
          match /databases/{db}/documents {
            match /utenti/{uid}/{doc=**} {
              allow read, write: if request.auth != null && request.auth.uid == uid;
            }
          }
        }

   4. Impostazioni progetto → Le tue app → icona Web (</>) → registra l'app →
      copia l'oggetto firebaseConfig qui sotto al posto di null.
      La apiKey di Firebase non è un segreto: la protezione sono le regole del punto 3.

   Dati nel cloud:  utenti/{uid}                 → { tutorial_completato }
                    utenti/{uid}/posti/{1|2|3}   → { aggiornato, dati (JSON del posto), dispositivo, eliminato }
   In locale, per ogni posto:  sync_base{n} = "aggiornato" dell'ultima versione allineata col cloud
                               sync_elim{n} = posto eliminato qui ma non ancora comunicato al cloud
   Con queste due informazioni si capisce chi ha cambiato cosa:
   - è cambiato solo il locale  → si carica nel cloud
   - è cambiato solo il cloud   → si scarica
   - sono cambiati entrambi     → CONFLITTO: sceglie il giocatore dalla pagina iniziale (mai in silenzio)
   ===================================================================== */
window.Cloud = (() => {
  const CONFIG = {
    apiKey: "AIzaSyBW7A89PiQTyxFTaojXQbAfGIutn8OLiDI",
    authDomain: "iltronodicenere.firebaseapp.com",
    projectId: "iltronodicenere",
    storageBucket: "iltronodicenere.firebasestorage.app",
    messagingSenderId: "1075905478925",
    appId: "1:1075905478925:web:c1367573f94d9513c53044"
  };

  const VER = "10.12.2", POSTI = [1, 2, 3], LIMITE = 1000000; /* byte: Firestore accetta documenti fino a 1 MiB */
  const DISP = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent) ? "telefono" : "computer";
  const stato = { attivo: !!CONFIG, pronto: false, utente: null };
  const ascoltatori = [];
  const notifica = () => ascoltatori.forEach(f => { try { f(stato); } catch (e) {} });

  const leggi = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
  const scrivi = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v)); } catch (e) {} };
  const base = (n) => Number(localStorage.getItem("sync_base" + n)) || 0;
  const setBase = (n, v) => scrivi("sync_base" + n, v ? String(v) : null);
  const elim = (n) => Number(localStorage.getItem("sync_elim" + n)) || 0;
  const conTimeout = (p, ms) => Promise.race([p, new Promise((_, ko) => setTimeout(() => ko(new Error("timeout")), ms))]);

  let auth = null, db = null, avvio = null;
  const carica = (src) => new Promise((ok, ko) => {
    const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = () => ko(new Error("script " + src)); document.head.append(s);
  });

  /* carica Firebase solo se configurato; si risolve quando si sa se l'utente ha già fatto l'accesso */
  function avvia() {
    if (!CONFIG) return Promise.resolve(false);
    if (avvio) return avvio;
    avvio = (async () => {
      const b = `https://www.gstatic.com/firebasejs/${VER}/`;
      await carica(b + "firebase-app-compat.js");
      await Promise.all([carica(b + "firebase-auth-compat.js"), carica(b + "firebase-firestore-compat.js")]);
      firebase.initializeApp(CONFIG);
      auth = firebase.auth(); db = firebase.firestore();
      try { await auth.getRedirectResult(); } catch (e) { stato.erroreAccesso = e && e.code; } /* ritorno da un accesso con redirect */
      await new Promise(primo => {
        let fatto = false;
        auth.onAuthStateChanged(u => {
          stato.utente = u ? { nome: u.displayName || u.email || "", email: u.email || "" } : null;
          stato.pronto = true; notifica();
          if (!fatto) { fatto = true; primo(); }
        });
      });
      return true;
    })().catch((e) => { stato.erroreAvvio = (e && (e.code || e.message)) || "avvio"; stato.pronto = true; notifica(); return false; });
    return avvio;
  }
  const connesso = async () => (await avvia()) && auth && auth.currentUser;
  const docPosto = (n) => db.collection("utenti").doc(auth.currentUser.uid).collection("posti").doc(String(n));
  const docProfilo = () => db.collection("utenti").doc(auth.currentUser.uid);
  const pesante = (json) => new TextEncoder().encode(json).length > LIMITE;

  async function accedi() {
    if (!await avvia()) return false;
    const p = new firebase.auth.GoogleAuthProvider();
    p.setCustomParameters({ prompt: "select_account" });
    try { await auth.signInWithPopup(p); } /* popup: il redirect su domini diversi da firebaseapp.com è inaffidabile nei browser moderni */
    catch (e) { /* popup bloccato (succede spesso sul telefono): si ripiega sul redirect, che ricarica la pagina */
      if (e && (e.code === "auth/popup-blocked" || e.code === "auth/operation-not-supported-in-this-environment")) { await auth.signInWithRedirect(p); return false; }
      throw e;
    }
    return true;
  }
  async function esci() {
    if (auth) await auth.signOut();
    POSTI.forEach(n => setBase(n, 0)); /* un altro account non ha nulla in comune con questi salvataggi */
  }

  /* scrive nel cloud la versione locale del posto (o la sua eliminazione) */
  async function carica_su(n) {
    const sl = leggi("slot" + n);
    if (sl) {
      const json = JSON.stringify(sl);
      if (pesante(json)) return "troppo";
      const ora = Number(sl.aggiornato) || Date.now();
      await docPosto(n).set({ aggiornato: ora, dati: json, dispositivo: DISP, eliminato: false });
      setBase(n, ora);
    } else {
      const ora = elim(n) || Date.now();
      await docPosto(n).set({ aggiornato: ora, dati: null, dispositivo: DISP, eliminato: true });
      setBase(n, ora);
    }
    scrivi("sync_elim" + n, null);
    return "ok";
  }
  /* un posto scaricato dal cloud è valido solo se è un JSON con un personaggio dentro */
  const valido = (json) => { try { const o = JSON.parse(json); return !!(o && typeof o === "object" && o.pg && typeof o.pg === "object"); } catch (e) { return false; } };
  /* sostituisce il posto locale con quello del cloud (dati illeggibili o manomessi: il locale resta com'è) */
  function scarica(n, R) {
    if (R && !R.eliminato && R.dati && !valido(R.dati)) return;
    if (!R || R.eliminato || !R.dati) {
      scrivi("slot" + n, null);
      if (localStorage.getItem("slot_attivo") === String(n)) ["slot_attivo", "personaggio", "partita"].forEach(k => scrivi(k, null));
    } else scrivi("slot" + n, R.dati);
    setBase(n, R ? Number(R.aggiornato) || 0 : 0);
    scrivi("sync_elim" + n, null);
  }

  /* Chiamato dal gioco dopo «Salva partita». Esiti: ok | locale | conflitto | troppo | errore */
  async function inviaSlot(n) {
    try {
      if (!await connesso()) return "locale";
      const sl = leggi("slot" + n);
      if (!sl) return "locale";
      const json = JSON.stringify(sl);
      if (pesante(json)) return "troppo";
      const ref = docPosto(n), ora = Number(sl.aggiornato) || Date.now();
      const esito = await conTimeout(db.runTransaction(async tx => {
        const d = await tx.get(ref), r = d.exists ? d.data() : null;
        if (r && Number(r.aggiornato) !== base(n)) return "conflitto"; /* nel frattempo ha salvato un altro dispositivo */
        tx.set(ref, { aggiornato: ora, dati: json, dispositivo: DISP, eliminato: false });
        return "ok";
      }), 10000);
      if (esito === "ok") setBase(n, ora);
      return esito;
    } catch (e) { return "errore"; }
  }

  /* Chiamato dalla pagina iniziale quando il giocatore elimina un personaggio */
  function eliminaSlot(n) {
    if (base(n)) scrivi("sync_elim" + n, String(Date.now())); /* vale anche offline: lo si comunica alla prossima sincronizzazione */
    return (async () => {
      try { if (await connesso() && elim(n)) await conTimeout(carica_su(n), 8000); } catch (e) {}
    })();
  }

  /* Allinea i tre posti e il tutorial. Restituisce { ok, conflitti: [{ n, locale, remoto, remotoDisp, remotoOra }] } */
  async function sincronizza() {
    if (!await connesso()) return { ok: false, conflitti: [] };
    const conflitti = [];
    const remoti = await conTimeout(Promise.all(POSTI.map(n => docPosto(n).get())), 10000);
    for (const [i, n] of POSTI.entries()) {
      const R = remoti[i].exists ? remoti[i].data() : null;
      const L = leggi("slot" + n), b = base(n);
      const ra = R ? Number(R.aggiornato) || 0 : 0, la = L ? Number(L.aggiornato) || 0 : 0;
      const remotoCambiato = ra !== b;
      const localeCambiato = L ? la !== b : (b !== 0 && !!elim(n));
      if (!remotoCambiato && !localeCambiato) continue;
      if (!remotoCambiato) { if (L || elim(n)) await carica_su(n); continue; }
      if (!localeCambiato) { scarica(n, R); continue; }
      const rVuoto = !R || R.eliminato || !R.dati;
      if ((!L && rVuoto) || (L && !rVuoto && la === ra)) { setBase(n, ra); scrivi("sync_elim" + n, null); continue; } /* stessa situazione da entrambe le parti */
      let remoto = null; try { remoto = rVuoto ? null : JSON.parse(R.dati); } catch (e) {}
      conflitti.push({ n, locale: L, remoto, remotoDisp: R ? R.dispositivo : null, remotoOra: ra });
    }
    try { /* tutorial: basta averlo completato su un dispositivo */
      const p = await docProfilo().get(), rp = p.exists ? p.data() : {};
      const lt = localStorage.getItem("tutorial_completato") === "1";
      if (rp.tutorial_completato && !lt) scrivi("tutorial_completato", "1");
      if (lt && !rp.tutorial_completato) await docProfilo().set({ tutorial_completato: true }, { merge: true });
    } catch (e) {}
    return { ok: true, conflitti };
  }

  /* scelta del giocatore su un conflitto: "locale" tiene questo dispositivo, "remoto" tiene il cloud */
  async function risolvi(n, scelta) {
    if (!await connesso()) return false;
    if (scelta === "locale") { await conTimeout(carica_su(n), 10000); return true; }
    const d = await conTimeout(docPosto(n).get(), 10000);
    scarica(n, d.exists ? d.data() : null);
    return true;
  }

  return {
    get attivo() { return stato.attivo; },
    get pronto() { return stato.pronto; },
    utente: () => stato.utente,
    erroreAvvio: () => stato.erroreAvvio || null,
    erroreAccesso: () => stato.erroreAccesso || null,
    onStato(fn) { ascoltatori.push(fn); },
    avvia, accedi, esci, inviaSlot, eliminaSlot, sincronizza, risolvi
  };
})();
