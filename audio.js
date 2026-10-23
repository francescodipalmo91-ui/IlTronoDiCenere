/* =====================================================================
   AUDIO — musica ed effetti condivisi da index, tutorial e gioco (howler.js, lib/howler.core.min.js)

   Perché howler.js:
   - sblocca l'audio da solo al primo tocco (Android, iPhone, Chrome) e fa ripartire
     da sé ciò che il browser aveva bloccato;
   - un solo contesto audio per tutto il gioco: anche il fuoco generato del camino passa
     dal volume generale;
   - volume e silenziamento applicati in un punto solo (Howler.volume / Howler.mute),
     collegati al cursore di volume.js;
   - dissolvenze, errori di caricamento (file mancante) e blocchi dell'autoplay gestiti
     dalla libreria invece che a mano in ogni pagina.

   Uso:
     const m = Sonoro.traccia("audio/intro.mp3", { loop: true, volume: 0.6 });
     m.suona(800);          // parte (o riprende) con dissolvenza in entrata di 800 ms
     m.ferma(600, poi);     // dissolvenza in uscita, poi pausa (riprende da lì)
     m.riavvolgi();         // la prossima volta riparte dall'inizio
     m.inPausa();           // true se non sta suonando
     m.onErrore(tipo => …); // "carico" = file mancante/illeggibile, "bloccato" = serve un gesto
     Sonoro.effetto("audio/porta.mp3", 0.9).suona().then(() => …);   // suono breve, promessa alla fine
     Sonoro.contesto();     // { ctx, uscita } per suoni generati (Web Audio) che rispettano il volume generale
     Sonoro.scala();        // moltiplicatore da applicare ai suoni generati (1 con howler: ci pensa il volume generale)

   Se lib/howler.core.min.js non si carica il gioco funziona lo stesso, senza musica né effetti
   (il fuoco generato del camino continua a suonare con un contesto audio proprio).
   ===================================================================== */
window.Sonoro = (() => {
  const H = typeof window.Howl === "function" && typeof window.Howler === "object";
  const vol = () => (window.Volume ? Volume.livello : 1);
  const muto = () => !!(window.Volume && (Volume.muto || Volume.livello === 0));

  /* volume generale: un punto solo, collegato al cursore */
  if (H && window.Volume) {
    const applica = () => { Howler.volume(vol()); Howler.mute(muto()); };
    applica(); Volume.onCambio(applica);
  }

  /* ---------- traccia lunga (musica, ambiente): streaming html5, non si decodifica tutta in memoria ---------- */
  function tracciaHowler(src, opz) {
    const base = opz.volume == null ? 1 : opz.volume;
    /* parte da 0: il volume giusto (o la dissolvenza) si applica all'evento "play" */
    const h = new Howl({ src: [src], html5: true, loop: !!opz.loop, volume: 0, preload: opz.preload !== false });
    const ascolta = [];
    let id = null, gen = 0, vuole = false, rotto = false;
    const avvisa = (tipo) => ascolta.forEach(f => { try { f(tipo); } catch (e) {} });
    /* ATTENZIONE howler 2.2.4: volume(), fade(), pause() e stop() chiamati mentre una traccia html5 sta
       ancora partendo finiscono in una coda che non riparte più. Si agisce solo a traccia "libera",
       altrimenti si aspetta l'evento "play". */
    const libera = () => h.state() === "loaded" && !h._playLock;
    h.on("loaderror", () => { rotto = true; vuole = false; avvisa("carico"); });
    h.on("playerror", () => {
      avvisa("bloccato");
      h.once("unlock", () => { if (vuole && !rotto) t.suona(0); }); /* ripartirà al primo tocco */
    });
    const t = {
      suona(ms = 0) {
        if (rotto) return false;
        vuole = true; const g = ++gen;
        const alza = () => { if (g !== gen) return; if (ms) h.fade(h.volume(id), base, ms, id); else h.volume(base, id); };
        if (id !== null && h.playing(id)) { if (libera()) alza(); else h.once("play", alza, id); return true; }
        if (id !== null && libera()) h.volume(0, id); /* riprende in silenzio, poi sale */
        id = h.play(id === null ? undefined : id);
        h.once("play", alza, id);
        return true;
      },
      ferma(ms = 0, poi) {
        vuole = false; const g = ++gen;
        if (id === null) { if (poi) poi(); return; }
        const esegui = () => {
          if (g !== gen) return;
          if (!h.playing(id)) { if (poi) poi(); return; }
          if (!ms) { h.pause(id); if (poi) poi(); return; }
          h.fade(h.volume(id), 0, ms, id);
          setTimeout(() => { if (g === gen) { h.pause(id); if (poi) poi(); } }, ms + 30);
        };
        if (libera()) esegui(); else h.once("play", esegui, id); /* sta ancora partendo: la si ferma appena parte */
      },
      riavvolgi() { if (id !== null && libera()) h.stop(id); },
      inPausa: () => id === null || !h.playing(id),
      rotta: () => rotto,
      onErrore(fn) { ascolta.push(fn); return t; }
    };
    return t;
  }

  /* senza howler (file non caricato) il gioco resta giocabile, solo muto */
  const muta = () => { const t = { suona: () => false, ferma: (ms, poi) => { if (poi) poi(); }, riavvolgi() {}, inPausa: () => true, rotta: () => true, onErrore: () => t }; return t; };

  /* ---------- suono breve: con howler è decodificato in anticipo, parte senza ritardo ---------- */
  function effetto(src, volume = 1) {
    if (!H) return { suona: () => Promise.resolve(false) };
    const h = new Howl({ src: [src], volume, preload: true });
    return { suona: () => new Promise(fine => { if (muto()) return fine(false); const id = h.play(); h.once("end", () => fine(true), id); h.once("playerror", () => fine(false), id); h.once("loaderror", () => fine(false)); }) };
  }

  /* ---------- contesto per i suoni generati (fuoco del camino) ---------- */
  let proprio = null;
  function contesto() {
    if (H && Howler.usingWebAudio) {
      if (!Howler.ctx) Howler.volume(vol()); /* crea il contesto di howler */
      if (Howler.ctx && Howler.masterGain) {
        if (Howler.ctx.state === "suspended") Howler.ctx.resume().catch(() => {});
        return { ctx: Howler.ctx, uscita: Howler.masterGain };
      }
    }
    try { proprio = proprio || new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
    if (proprio.state === "suspended") proprio.resume().catch(() => {});
    return { ctx: proprio, uscita: proprio.destination };
  }
  /* howler sospende il contesto dopo 30 s senza suoni suoi: con un suono generato in corso non deve farlo */
  function trattieni(si) { if (H) Howler.autoSuspend = !si; }

  return {
    conHowler: H,
    traccia: (src, opz = {}) => (H ? tracciaHowler(src, opz) : muta()),
    effetto, contesto, trattieni,
    scala: () => (H && Howler.usingWebAudio && Howler.masterGain ? 1 : vol())
  };
})();
