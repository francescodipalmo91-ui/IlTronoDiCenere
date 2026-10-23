/* =====================================================================
   SICURO — protezione degli inserimenti HTML (DOMPurify, lib/purify.min.js)

   Ogni volta che una pagina costruisce HTML da una stringa usa Sicuro.html(elemento, markup)
   invece di elemento.innerHTML = markup: DOMPurify toglie script, gestori di eventi (onerror,
   onclick…) e link javascript:, lasciando intatto tutto il resto (tabelle, tendine, svg, input).
   Oggi le stringhe le scriviamo noi, ma i dati arrivano anche dai salvataggi e da Firestore:
   così un nome o un salvataggio manomesso non può mai eseguire codice nella pagina.

   Se lib/purify.min.js non si carica il gioco continua a funzionare (avviso in console).
   Sicuro.immagine(percorso) accetta solo immagini locali del gioco (cartella immagini/).
   ===================================================================== */
window.Sicuro = (() => {
  let avvisato = false;
  const pronto = () => !!(window.DOMPurify && DOMPurify.isSupported);

  function pulisci(markup) {
    const s = markup == null ? "" : String(markup);
    if (pronto()) return DOMPurify.sanitize(s);
    if (!avvisato) { avvisato = true; console.warn("Sicuro: DOMPurify non caricato, HTML inserito senza filtro"); }
    return s;
  }

  /* celle e righe di tabella fuori da una <table> verrebbero scartate dal parser:
     si puliscono dentro una tabella completa e poi si riprende solo il contenuto */
  const CONTESTO = {
    TR: ["<table><tbody><tr>", "</tr></tbody></table>", "tr"],
    TBODY: ["<table><tbody>", "</tbody></table>", "tbody"], THEAD: ["<table><thead>", "</thead></table>", "thead"],
    TFOOT: ["<table><tfoot>", "</tfoot></table>", "tfoot"], TABLE: ["<table>", "</table>", "table"]
  };

  return {
    pulisci,
    html(el, markup) {
      if (!el) return el;
      const c = CONTESTO[el.tagName];
      if (c && pronto()) {
        const tpl = document.createElement("template");
        tpl.innerHTML = DOMPurify.sanitize(c[0] + (markup == null ? "" : String(markup)) + c[1]);
        const dentro = tpl.content.querySelector(c[2]);
        el.innerHTML = dentro ? dentro.innerHTML : "";
      } else el.innerHTML = pulisci(markup);
      return el;
    },
    /* percorso di un ritratto/immagine salvato nei dati: solo file locali in immagini/, altrimenti null */
    immagine(percorso) {
      const p = String(percorso || "").replace(/^immagini\/(?!pg\/)/, "immagini/pg/"); /* vecchi salvataggi: ritratti spostati in immagini/pg/ */
      return /^immagini\/[\w\-\/.]+\.(webp|png|jpe?g|gif|avif)$/i.test(p) && !p.includes("..") ? p : null;
    }
  };
})();
