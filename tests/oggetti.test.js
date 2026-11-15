/* Test dei poteri di armi, armature e accessori (decisioni del 14/11/2026). Uso: node tests/oggetti.test.js */
(function (root) {
  const inNode = typeof module !== "undefined" && module.exports && typeof require === "function";
  if (inNode) { root.window = root; require("../js/poteri.js"); require("../js/specializzazioni.js"); require("../js/oggetti.js"); require("../js/scontro.js"); }
  const P = root.Poteri, S = root.Scontro, O = root.Oggetti;
  function dadi(seq) {
    const q = [...seq];
    const f = (d) => { if (!q.length) throw new Error(`tiro in più (d${d}) non previsto`); const v = q.shift(); if (v < 1 || v > d) throw new Error(`valore ${v} impossibile su d${d}`); return v; };
    f.resto = () => q.length; return f;
  }
  const ctx = (seq) => ({ tira: dadi(seq) });
  const fine = (c) => { if (c.tira.resto()) throw new Error(`dadi avanzati: ${c.tira.resto()}`); };
  const pg = (o) => S.preparaScontro(Object.assign({ nome: "Tu", liv: 2, pv: 30, pvMax: 30, modClasse: 3, mod: { Vigore: 3, "Agilità": 0, Mente: 0, Spirito: 0 }, caBase: 15,
    arma: { dado: 6, tipo: "taglio" }, tratti: [], spec: "berserker", poteri: ["colpo_poderoso", "colpo_di_mestiere", "spezza_guardia", "colpo_del_boia"] }, o || {}));
  const nemico = (o) => S.preparaScontro(Object.assign({ nome: "nem", liv: 1, pv: 40, pvMax: 40, modAtt: 2, modDanno: 1, modClasse: 2, mod: {}, caBase: 12, arma: { dado: 6, tipo: "taglio" } }, o || {}));
  const ev = (r, k) => (r.eventi || r).filter(e => e && e.k === k);
  const casi = [], caso = (nome, fn) => casi.push({ nome, fn });
  const eq = (a, b, msg) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${msg || "atteso"}: ${JSON.stringify(b)}, ottenuto ${JSON.stringify(a)}`); };
  const vero = (x, msg) => { if (!x) throw new Error(msg || "atteso vero"); };

  caso("Attacco base: dado dell'arma + bonus, senza stati; il potere dell'arma si consuma anche se manca", () => {
    const g = pg({ arma: O.arma("due_lame") }), n = nemico(), c = ctx([10, 4]); S.attaccoBase(g, n, c); eq(n.pv, 31); vero(!P.ha(n, "sanguinante")); fine(c);
    S.attaccoBase(g, n, ctx([1]), { poterArma: true }); eq(S.disponibileArma(g).motivo, "giaUsatoScontro");
  });
  caso("Danza delle lame: a segno, colpo gratuito (solo il dado); su un Sanguinante lo aggrava", () => {
    const g = pg({ arma: O.arma("due_lame") }), n = nemico({ stati: { sanguinante: { liv: 1, turni: 2 } } }), c = ctx([10, 4, 3]);
    const r = S.attaccoBase(g, n, c, { poterArma: true }); eq(n.pv, 40 - 9 - 3); eq(n.stati.sanguinante.liv, 2); eq(ev(r, "colpoGratuito").length, 1); fine(c);
    const g2 = pg({ arma: O.arma("due_lame") }), m = nemico(), c2 = ctx([2]); const r2 = S.attaccoBase(g2, m, c2, { poterArma: true }); eq(ev(r2, "colpoGratuito").length, 0, "solo se il colpo principale va a segno"); fine(c2);
  });
  caso("Giuramento del Rettore: due facce (cambio = azione rapida); il Colpo applica lo stato della faccia attiva con un dado in più", () => {
    const g = pg({ arma: O.arma("giuramento_del_rettore") }), n = nemico({ pv: 60, pvMax: 60 }), c = ctx([10, 4, 4, 2]);
    S.attaccoBase(g, n, c, { poterArma: true }); eq(n.pv, 60 - (8 + 5)); vero(P.ha(n, "stordito")); fine(c);
    eq(S.cambiaFaccia(g).ok, true); eq(g.arma.tipo, "taglio"); eq(S.cambiaFaccia(g).ok, false, "una rapida per turno");
  });
  caso("Punta nella piaga: Esposto, poi Scoperto, nessun dado in più", () => {
    const g = pg({ arma: O.arma("flagello_chiodato") }), n = nemico({ stati: { esposto: { liv: 1, turni: 2 } } }), c = ctx([10, 3]);
    S.attaccoBase(g, n, c, { poterArma: true }); eq([n.pv, n.stati.esposto.liv], [32, 2]); fine(c);
  });
  caso("Segno sulla mappa: dichiarato con un potere di classe, lo stato entra senza TS; da solo non si usa", () => {
    const a = pg({ spec: "realta", arma: O.arma("bastone_da_cartografo"), focus: null, poteri: ["colpo_di_forza"] }), n = nemico(), c = ctx([10, 4]);
    S.usa(a, n, "colpo_di_forza", c, { segno: true }); vero(P.ha(n, "esposto")); fine(c);
    eq(S.attaccoBase(a, nemico(), ctx([]), { poterArma: true }).rifiutato, true);
    const c2 = ctx([10, 4, 1]); S.usa(a, nemico(), "colpo_di_forza", c2, { segno: true }); fine(c2); /* già usato: torna il TS */
  });
  caso("Raccolto: due dadi in più, aggrava; critico su un Vacillante", () => {
    const g = pg({ arma: O.arma("falce") }), n = nemico({ pv: 15, pvMax: 40 }), c = ctx([1, 1, 1, 1, 1, 1, 2]);
    const r = S.attaccoBase(g, n, c, { poterArma: true }); vero(ev(r, "attacco")[0].crit); vero(P.ha(n, "sanguinante")); fine(c);
  });
  caso("Albero caduto: Stordito senza TS e subito Commosso; un boss solo Indebolito 3 turni", () => {
    const g = pg({ arma: O.arma("clava_di_radice") }), n = nemico({ pv: 60, pvMax: 60 }), c = ctx([10, 1, 1, 1]);
    S.attaccoBase(g, n, c, { poterArma: true }); eq(n.stati.stordito.liv, 2); fine(c);
    const b = nemico({ pv: 60, pvMax: 60, boss: true }), c2 = ctx([10, 1, 1, 1]); S.attaccoBase(pg({ arma: O.arma("clava_di_radice") }), b, c2, { poterArma: true });
    eq(b.stati.indebolito.turni, 3); vero(!P.ha(b, "stordito")); fine(c2);
  });
  caso("Doppia stoccata: due attacchi indipendenti, Esposto poi Scoperto senza TS; se il primo manca entra solo Esposto", () => {
    const g = pg({ arma: O.arma("stocco") }), n = nemico({ pv: 60, pvMax: 60 }), c = ctx([10, 2, 15, 2]);
    S.attaccoBase(g, n, c, { poterArma: true }); eq(n.stati.esposto.liv, 2); fine(c);
    const m = nemico({ pv: 60, pvMax: 60 }), c2 = ctx([1, 15, 2]); S.attaccoBase(pg({ arma: O.arma("stocco") }), m, c2, { poterArma: true }); eq(m.stati.esposto.liv, 1); fine(c2);
  });
  caso("Pioggia di braci: 3 turni di 1d6 di fuoco senza tiro, applica poi aggrava Scottato", () => {
    const g = pg({ arma: O.arma("verga_di_cenere") }), n = nemico(); S.attaccoBase(g, n, ctx([1]), { poterArma: true });
    const c = ctx([3, 2, 3, 3]); S.inizioTurno(g, n, c); S.inizioTurno(g, n, c); S.inizioTurno(g, n, c); eq(n.stati.scottato.liv, 2); vero(!g.buff.braci); fine(c);
  });
  caso("Armature: CA indossata; Cuoio dell'Ombra +4 fino al tuo turno; Maglia −4 e Mantello metà, mai insieme", () => {
    const g = O.indossa(pg(), ["cuoio_dell_ombra"]); eq(g.caBase, 17); S.usaOggetto(g, "cuoio_dell_ombra", ctx([])); eq(S.ca(g), 21);
    const h = O.indossa(pg(), ["maglia_della_veglia", "mantello_del_penitente"]); S.usaOggetto(h, "maglia_della_veglia", ctx([])); S.inizioTurno(h, null, ctx([])); S.usaOggetto(h, "mantello_del_penitente", ctx([]));
    const c = ctx([20, 6, 6]); S.attacco(nemico(), h, {}, c); eq(h.pv, 30 - Math.ceil(13 / 2)); vero(h.cariche.maglia, "la Maglia resta per il colpo dopo"); fine(c);
  });
  caso("Piastre, Elmo, Piede fermo: il prossimo TS riesce da solo o ha +4; Calzari +2 contro Indebolito", () => {
    const g = O.indossa(pg(), ["piastre_del_rettore"]); S.usaOggetto(g, "piastre_del_rettore", ctx([]));
    const z = P.tiroSalvezza(g, "sanguinante", { liv: 5, modClasse: 5 }, dadi([])); vero(z.ok && z.auto);
    const e = O.indossa(pg(), ["elmo_del_penitente"]); S.usaOggetto(e, "elmo_del_penitente", ctx([]));
    vero(!P.tiroSalvezza(e, "sanguinante", { liv: 5, modClasse: 5 }, dadi([1])).auto); vero(P.tiroSalvezza(e, "esposto", { liv: 5, modClasse: 5 }, dadi([])).auto);
    const s = O.indossa(pg(), ["stivali_della_lunga_caccia"]); vero(s.immuni.includes("stordito")); S.usaOggetto(s, "piede_fermo", ctx([]));
    eq(P.tiroSalvezza(s, "sanguinante", { liv: 1, modClasse: 0 }, dadi([1])).m, 3 + 2 + 4);
    eq(P.tiroSalvezza(O.indossa(pg(), ["calzari_del_pellegrino"]), "indebolito", { liv: 1, modClasse: 0 }, dadi([1])).m, 3 + 2 + 2);
  });
  caso("La risata di Darius annulla il prossimo attacco, anche di un boss; Amuleto della veglia: 1d6 + livello a chi ti colpisce", () => {
    const g = O.indossa(pg(), ["scudo_di_darius"]); S.usaOggetto(g, "risata_di_darius", ctx([]));
    const r = S.attacco(nemico({ boss: true }), g, { carica: true }, ctx([])); vero(r.annullato); eq(g.pv, 30);
    const h = O.indossa(pg(), ["amuleto_della_veglia"]), n = nemico(); S.usaOggetto(h, "amuleto_della_veglia", ctx([]));
    const c = ctx([18, 2, 4]); S.attacco(n, h, {}, c); eq(n.pv, 40 - 6); fine(c);
  });
  caso("Guanti del Cartografo: un dado in più sul vulnerabile, altrimenti la carica si perde", () => {
    const g = O.indossa(pg(), ["guanti_del_cartografo"]); S.usaOggetto(g, "studio_del_bersaglio", ctx([]));
    const n = nemico({ res: { taglio: "vuln" } }), c = ctx([10, 1, 1]); S.attaccoBase(g, n, c); eq(n.pv, 40 - Math.ceil(5 * 1.5)); fine(c);
    const h = O.indossa(pg(), ["guanti_del_cartografo"]); S.usaOggetto(h, "studio_del_bersaglio", ctx([])); const m = nemico(), c2 = ctx([10, 1]); S.attaccoBase(h, m, c2); eq(m.pv, 36); vero(!h.cariche.studio); fine(c2);
  });
  caso("Cinturone del Cacciatore: una volta per scontro un'azione rapida in più; Anello della resina: immune allo stato scelto per lo scontro", () => {
    const g = O.indossa(pg({ pv: 10 }), ["cinturone_del_cacciatore", "anello_della_resina"]);
    eq(S.beviPozione(g, 5).ok, true); eq(S.beviPozione(g, 5).ok, true, "la seconda col Cinturone"); eq(S.beviPozione(g, 5).ok, false);
    S.inizioTurno(g, null, ctx([])); S.usaOggetto(g, "anello_della_resina", ctx([]), { stato: "impaurito" }); vero(g.immuni.includes("impaurito"));
    S.fineScontro(g); vero(!g.immuni.includes("impaurito")); eq(S.disponibileOggetto(g, "anello_della_resina").motivo, "giaUsatoGiorno");
  });

  function esegui() { return casi.map(({ nome, fn }) => { try { fn(); return { nome, ok: true }; } catch (e) { return { nome, ok: false, errore: e.message }; } }); }
  root.TestOggetti = { esegui, casi };
  if (inNode && require.main === module) {
    const esiti = esegui();
    esiti.forEach(e => console.log(`${e.ok ? "OK    " : "ERRORE"} ${e.nome}${e.ok ? "" : "\n       → " + e.errore}`));
    const ko = esiti.filter(e => !e.ok).length;
    console.log(`\n${esiti.length - ko} / ${esiti.length} superati`);
    if (ko) process.exitCode = 1;
  }
})(typeof window !== "undefined" ? window : globalThis);
