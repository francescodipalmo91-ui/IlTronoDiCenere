/* =====================================================================
   VOLUME — controllo condiviso da gioco.html e tutorial.html
   Un pulsante con l'icona dell'altoparlante: cliccandolo si apre un piccolo pannello
   con il cursore del volume (0–100) e il tasto per silenziare.
   Le scelte restano salvate nel browser e valgono per tutte le pagine:
     localStorage "audio"        = "off" quando è silenziato (stessa chiave usata prima)
     localStorage "audio_volume" = livello da 0 a 1
   Le pagine leggono Volume.muto / Volume.livello e si registrano con Volume.onCambio(fn).
   ===================================================================== */
window.Volume = (() => {
  const K_MUTO = "audio", K_LIV = "audio_volume";
  let muto = false, livello = 0.8;
  try {
    muto = localStorage.getItem(K_MUTO) === "off";
    const v = parseFloat(localStorage.getItem(K_LIV));
    if (Number.isFinite(v)) livello = Math.min(1, Math.max(0, v));
  } catch (e) {}
  const ascoltatori = [];
  const salva = () => { try { localStorage.setItem(K_MUTO, muto ? "off" : "on"); localStorage.setItem(K_LIV, String(livello)); } catch (e) {} };
  const notifica = () => { salva(); ascoltatori.forEach(f => { try { f(); } catch (e) {} }); disegna(); };

  const lingua = () => (window.Lingua && Lingua.get && Lingua.get() === "en") ? "en" : "it";
  const TX = {
    it: { volume: "Volume", apri: "Regola il volume", silenzia: "Silenzia", riattiva: "Riattiva", muto: "Audio disattivato" },
    en: { volume: "Volume", apri: "Adjust the volume", silenzia: "Mute", riattiva: "Unmute", muto: "Sound off" }
  };

  /* icona dell'altoparlante: le onde seguono il livello, una X quando è silenziato */
  const icona = (m, l) => {
    const onde = m || l === 0 ? '<path d="M16 9l5 6M21 9l-5 6"/>'
      : (l < 0.5 ? '<path d="M15.5 9.5a3.5 3.5 0 0 1 0 5"/>' : '<path d="M15.5 9.5a3.5 3.5 0 0 1 0 5"/><path d="M18.5 6.5a7.5 7.5 0 0 1 0 11"/>');
    return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" fill="currentColor" fill-opacity="0.15"/>${onde}</svg>`;
  };

  let btn = null, pannello = null, cursore = null, valore = null, tastoMuto = null;
  function disegna() {
    if (!btn) return;
    const t = TX[lingua()], spento = muto || livello === 0;
    btn.innerHTML = icona(muto, livello);
    btn.title = spento ? t.muto : `${t.volume} ${Math.round(livello * 100)}%`;
    btn.setAttribute("aria-label", t.apri + " — " + btn.title);
    cursore.value = Math.round(livello * 100);
    cursore.style.setProperty("--pieno", (muto ? 0 : livello * 100) + "%");
    cursore.classList.toggle("spento", muto);
    valore.textContent = muto ? "—" : Math.round(livello * 100) + "%";
    tastoMuto.textContent = muto ? t.riattiva : t.silenzia;
    tastoMuto.setAttribute("aria-pressed", String(muto));
  }

  const STILE = `
    .volume { position: relative; display: inline-flex; }
    .volume-pannello { position: absolute; top: calc(100% + 0.5rem); right: 0; z-index: 20; width: 15rem;
      padding: 0.85rem 1rem; border-radius: 0.6rem; background: var(--bg); color: var(--text);
      border: 1px solid var(--line); box-shadow: 0 10px 28px rgba(0,0,0,0.28); }
    .volume-pannello[hidden] { display: none; }
    .volume-riga { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; font-size: 0.95rem; }
    .volume-riga b { font-weight: 600; }
    .volume-valore { color: var(--muted); font-variant-numeric: tabular-nums; min-width: 3ch; text-align: right; }
    .volume-cursore { -webkit-appearance: none; appearance: none; width: 100%; height: 0.4rem; margin: 0.8rem 0 0.9rem; border-radius: 1rem; cursor: pointer;
      background: linear-gradient(to right, var(--accent) var(--pieno, 80%), var(--line) var(--pieno, 80%)); }
    .volume-cursore.spento { opacity: 0.5; }
    .volume-cursore::-webkit-slider-thumb { -webkit-appearance: none; width: 1.1rem; height: 1.1rem; border-radius: 50%; background: var(--accent); border: 2px solid var(--bg); box-shadow: 0 0 0 1px var(--accent); }
    .volume-cursore::-moz-range-thumb { width: 1rem; height: 1rem; border-radius: 50%; background: var(--accent); border: 2px solid var(--bg); }
    .volume-cursore:focus-visible { outline: 3px solid var(--accent); outline-offset: 4px; }
    .volume-muto { font: inherit; font-size: 0.9rem; width: 100%; padding: 0.4rem 0.6rem; border-radius: 0.4rem; cursor: pointer;
      background: transparent; color: var(--text); border: 1px solid var(--line); }
    .volume-muto:hover { border-color: var(--accent); }
    .volume-muto[aria-pressed="true"] { border-color: var(--accent); color: var(--accent); }
  `;

  /* monta il controllo sul pulsante esistente (id="audio") */
  function monta(b) {
    if (!b || btn) return;
    const st = document.createElement("style"); st.textContent = STILE; document.head.append(st);
    btn = b;
    const box = document.createElement("div"); box.className = "volume";
    btn.replaceWith(box); box.append(btn);
    btn.setAttribute("aria-haspopup", "true"); btn.setAttribute("aria-expanded", "false"); btn.removeAttribute("aria-pressed");
    pannello = document.createElement("div"); pannello.className = "volume-pannello"; pannello.hidden = true;
    pannello.id = "volume-pannello"; btn.setAttribute("aria-controls", pannello.id);
    const t = TX[lingua()];
    pannello.innerHTML = `<div class="volume-riga"><b>${t.volume}</b><span class="volume-valore"></span></div>` +
      `<input class="volume-cursore" type="range" min="0" max="100" step="1" aria-label="${t.volume}">` +
      `<button type="button" class="volume-muto"></button>`;
    box.append(pannello);
    cursore = pannello.querySelector(".volume-cursore");
    valore = pannello.querySelector(".volume-valore");
    tastoMuto = pannello.querySelector(".volume-muto");

    const apri = (si) => { pannello.hidden = !si; btn.setAttribute("aria-expanded", String(si)); if (si) cursore.focus({ preventScroll: true }); };
    btn.addEventListener("click", (e) => { e.stopPropagation(); apri(pannello.hidden); });
    cursore.addEventListener("input", () => { livello = Number(cursore.value) / 100; muto = livello === 0; notifica(); });
    tastoMuto.addEventListener("click", () => { muto = !muto; if (!muto && livello === 0) livello = 0.5; notifica(); });
    document.addEventListener("click", (e) => { if (!pannello.hidden && !box.contains(e.target)) apri(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !pannello.hidden) { apri(false); btn.focus(); } });
    disegna();
  }

  return {
    get muto() { return muto; },
    set muto(v) { muto = !!v; notifica(); },
    get livello() { return livello; },
    onCambio(fn) { ascoltatori.push(fn); },
    monta
  };
})();
