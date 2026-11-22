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
    const a = pg({ spec: "realta", focus: O.focus("sfera_armillare"), poteri: ["colpo_di_forza"] }), n = nemico(), c = ctx([10, 4]);
    S.usa(a, n, "colpo_di_forza", c, { segno: true }); vero(P.ha(n, "esposto")); fine(c);
    eq(S.attaccoBase(a, nemico(), ctx([]), { poterArma: true }).rifiutato, true);
    const c2 = ctx([10, 4, 1]); S.usa(a, nemico(), "colpo_di_forza", c2, { segno: true }); fine(c2); /* già usato: torna il TS */
  });
  caso("Focus a due forme: stesso bonus, scudo un gradino di dado sotto con +1 CA; solo la Sfera armillare ha il potere", () => {
    eq(["focus_comune", "focus_rinforzato", "sfera_armillare"].map(id => [O.focus(id).dado, O.focus(id).bonus, O.focus(id).ca]), [[8, 0, 0], [8, 1, 0], [8, 2, 0]]);
    eq(["focus_comune", "focus_rinforzato", "sfera_armillare"].map(id => [O.focus(id, "scudo").dado, O.focus(id, "scudo").bonus, O.focus(id, "scudo").ca]), [[6, 0, 1], [6, 1, 1], [6, 2, 1]]);
    eq([!!O.focus("focus_rinforzato").potere, O.focus("sfera_armillare", "scudo").potere.id], [false, "segno_sulla_mappa"]);
    eq(["normale", "scudo"].map(fm => [O.focus("verga_di_cenere", fm).dado, O.focus("verga_di_cenere", fm).bonus, O.focus("verga_di_cenere", fm).ca]), [[10, 3, 0], [8, 3, 1]], "Verga di cenere: d10 / d8 con +1 CA, bonus +3");
    vero(!O.ARMI.verga_di_cenere, "la Verga non è più un'arma"); eq(O.focus("verga_di_cenere").potere.id, "pioggia_di_braci");
    eq(S.dadoIncanto(pg({ focus: O.focus("verga_di_cenere") })), 10);
    eq(S.dadoIncanto(pg({ focus: O.focus("focus_rinforzato", "scudo") })), 6, "d6 in forma scudo");
    eq(S.disponibileArma(pg({ focus: O.focus("focus_rinforzato") })).motivo, "senzaPotere");
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
    const g = pg({ focus: O.focus("verga_di_cenere") }), n = nemico(); S.attaccoBase(g, n, ctx([1]), { poterArma: true });
    const c = ctx([3, 2, 3, 3]); S.inizioTurno(g, n, c); S.inizioTurno(g, n, c); S.inizioTurno(g, n, c); eq(n.stati.scottato.liv, 2); vero(!g.buff.braci); fine(c);
  });
  caso("Primo passo (22/11): attacco extra con d20 all'inizio del primo turno; −2 CA al nemico solo se agisci per primo; giornaliero", () => {
    const g = O.indossa(pg(), ["stivali_dell_ultimo_passo"]), n = nemico();
    eq(S.disponibileOggetto(g, "primo_passo").motivo, "automatico", "non è un'azione rapida");
    const c = ctx([20, 4, 4]); const r = S.primoPasso(g, n, c, { primo: true });
    eq(S.ca(n), 10, "12 − 2"); vero(ev(r, "attaccoBase").length === 1); vero(n.pv < 40); fine(c);
    eq(S.primoPasso(g, nemico(), ctx([])).rifiutato, true, "una volta al giorno");
    S.inizioTurno(n, g, ctx([])); eq(S.ca(n), 12, "finito il primo round");
    const h = O.indossa(pg(), ["stivali_dell_ultimo_passo"]), m = nemico(); S.primoPasso(h, m, ctx([1]), { primo: false }); eq(S.ca(m), 12, "agguato perso: niente −2");
  });
  caso("Primo passo: si somma al −2 di Furtività o agguato riusciti (−4); solo a volontà; senza stivali non parte", () => {
    const g = O.indossa(pg(), ["stivali_dell_ultimo_passo"]), n = nemico(); n.buff.scovata = { ca: -2, turni: 1 };
    eq(S.primoPasso(g, n, ctx([]), { potere: "colpo_del_boia" }).rifiutato, true, "mai un giornaliero");
    eq(S.primoPasso(g, n, ctx([]), { potere: "spezza_guardia" }).rifiutato, true, "mai un per scontro");
    const c = ctx([1]); const r = S.primoPasso(g, n, c, { potere: "colpo_poderoso" }); eq(S.ca(n), 8, "12 − 2 − 2"); eq(ev(r, "potere")[0].id, "colpo_poderoso"); fine(c);
    eq(S.primoPasso(pg(), nemico(), ctx([])).rifiutato, true);
  });
  caso("Ultimo colpo (Lascito di Dafne, 22/11): senza tiro, dado dell'arma + 2 dadi, niente bonus; Esposto poi Scoperto senza TS", () => {
    eq(O.PERGAMENE.lascito_di_dafne.potere, "ultimo_colpo");
    const g = pg({ poteri: ["colpo_poderoso", "ultimo_colpo"] }), n = nemico(), c = ctx([1, 2, 3]); const r = S.usa(g, n, "ultimo_colpo", c);
    eq([n.pv, n.stati.esposto.liv], [34, 2], "40 − 6, Scoperto"); eq(ev(r, "ts").length, 0); fine(c);
    eq(S.disponibile(g, "ultimo_colpo").motivo, "giaUsatoGiorno");
  });
  /* ===== Set di classe (set_di_classe.md, 22/11) ===== */
  const conSet = (o, ids) => O.indossa(pg(o), ids);
  caso("Valoroso, 2 pezzi: Slancio = +1 a colpire sul primo attacco del turno dopo un colpo a segno; un pezzo solo non basta", () => {
    const g = conSet({}, ["guanti_del_valoroso", "stivali_del_valoroso"]), n = nemico({ pv: 99, pvMax: 99 });
    eq(O.pezziSet(g, "valoroso"), 2);
    S.attacco(g, n, {}, ctx([15, 1])); vero(g.slancioProssimo);
    const r0 = S.attacco(g, n, {}, ctx([15, 1])); eq(ev(r0, "attacco")[0].slancio, undefined, "nello stesso turno no");
    S.inizioTurno(g, n, ctx([])); const r = S.attacco(g, n, {}, ctx([5]));
    eq([ev(r, "attacco")[0].slancio, ev(r, "attacco")[0].tot], [1, 9], "5 + 3 + 1, consumato anche se manca"); vero(!g.slancio);
    const u = conSet({}, ["guanti_del_valoroso"]); S.attacco(u, nemico(), {}, ctx([15, 1])); vero(!u.slancioProssimo, "1 pezzo: niente");
  });
  caso("Valoroso, 3 pezzi: Grido del valoroso (per scontro, rapida) +2 CA e +2 ai danni fino al tuo turno", () => {
    const g = conSet({}, ["guanti_del_valoroso", "stivali_del_valoroso", "cintura_del_valoroso"]), n = nemico();
    eq(S.disponibileSet(conSet({}, ["guanti_del_valoroso", "stivali_del_valoroso"]), "grido_del_valoroso").motivo, "senzaSet");
    eq(S.usaSet(g, "grido_del_valoroso", n).ok, true); eq(S.ca(g), 17);
    const c = ctx([15, 1]); const r = S.attacco(g, n, {}, c); eq([n.pv, ev(r, "attacco")[0].grido], [34, 2], "1 + 3 + 2"); fine(c);
    eq(S.disponibileSet(g, "grido_del_valoroso").motivo, "giaUsatoScontro"); S.inizioTurno(g, n, ctx([])); eq(S.ca(g), 15);
  });
  caso("Sapiente: Mente lucida +1 CD (2 pezzi); Lampo di intuizione +2 CD e un dado sul prossimo potere del turno (3 pezzi); tunica +1 Vigore", () => {
    const a2 = conSet({}, ["guanti_del_sapiente", "cappello_del_sapiente"]); eq(S.fonteDi(a2).cdBonus, 1);
    const a = conSet({}, ["guanti_del_sapiente", "cappello_del_sapiente", "tunica_del_sapiente"]); eq(a.mod.Vigore, 4, "+1 Vigore dalla tunica");
    const conta = (b) => { const visti = []; S.usa(b, nemico({ pv: 99, pvMax: 99 }), "colpo_poderoso", { tira: (d) => { visti.push(d); return d === 20 ? 15 : 1; } }); return visti.length; };
    const senza = conta(conSet({}, [])); S.usaSet(a, "lampo_di_intuizione"); eq(conta(a), senza + 1, "un dado in più"); vero(!a.lampo && !a.lampoAttivo);
    const b = conSet({}, ["guanti_del_sapiente", "cappello_del_sapiente", "tunica_del_sapiente"]); S.usaSet(b, "lampo_di_intuizione"); S.fineTurno(b); vero(!b.lampo, "si perde a fine turno");
  });
  caso("Penitente: Carne domata −1 al danno nel tempo per turno (2 pezzi); Fede incrollabile +3 ai TS contro gli stati (3 pezzi)", () => {
    const m = conSet({ arma: O.arma("mazzafrusto_del_penitente"), stati: { sanguinante: { liv: 1, turni: 3 } } }, ["mantello_del_penitente"]);
    eq(O.pezziSet(m, "penitente"), 2); S.inizioTurno(m, null, ctx([3])); eq(m.pv, 28, "3 − 1");
    const f = conSet({ arma: O.arma("mazzafrusto_del_penitente"), focus: O.focus("focus_del_penitente") }, ["mantello_del_penitente"]);
    const t0 = P.tiroSalvezza(f, "stordito", { liv: 1, modClasse: 0 }, () => 10).tot;
    S.usaSet(f, "fede_incrollabile"); eq(P.tiroSalvezza(f, "stordito", { liv: 1, modClasse: 0 }, () => 10).tot, t0 + 3);
  });
  caso("Pellegrino: +1 ai danni contro chi ha uno stato (2 pezzi); Radice che resta: il prossimo stato del turno dura 1 turno in più (3 pezzi)", () => {
    const s = conSet({ focus: O.focus("focus_del_pellegrino") }, ["anello_del_pellegrino"]), n = nemico({ stati: { esposto: { liv: 1, turni: 2 } } });
    const r = S.attacco(s, n, {}, ctx([15, 1])); eq(ev(r, "attacco")[0].pellegrino, 1);
    const turni = (b) => { const x = nemico(); S.statoSu(b, x, "applica", ctx([1]), "stordito"); return x.stati.stordito.turni; };
    const base = turni(conSet({}, [])), t = conSet({ focus: O.focus("focus_del_pellegrino") }, ["anello_del_pellegrino", "collana_del_pellegrino"]);
    S.usaSet(t, "radice_che_resta"); eq(turni(t), base + 1); vero(!t.radice, "consumata");
  });
  caso("Vesti: armatura delle classi magiche (CA della leggera, niente malus); i Rari hanno un potere per scontro", () => {
    ["tonaca", "veste_runica", "veste_feticcio"].forEach(id => eq([O.EQUIP[id].armatura, O.EQUIP[id].ca, O.EQUIP[id].rarita], ["veste", 1, "Non comune"], id));
    ["paramenti", "cappa_di_viaggio", "abito_dello_spirito"].forEach(id => vero(O.EQUIP[id].ca === 2 && O.EQUIP[id].potere.tipo === "scontro", id));
    vero(["tonaca", "paramenti", "veste_runica", "cappa_di_viaggio", "veste_feticcio", "abito_dello_spirito"].every(id => !O.EQUIP[id].classi.includes("Soldato")), "mai il Guerriero");
    const v = O.indossa(pg(), ["cappa_di_viaggio"]); S.usaOggetto(v, "cuoio_dell_ombra", ctx([])); eq(S.ca(v), 15 + 2 + 4);
  });
  caso("Armature: CA indossata; Cuoio dell'Ombra +4 fino al tuo turno; Maglia −4 e Mantello metà, mai insieme", () => {
    const g = O.indossa(pg(), ["cuoio_dell_ombra"]); eq(g.caBase, 17); S.usaOggetto(g, "cuoio_dell_ombra", ctx([])); eq(S.ca(g), 21);
    const h = O.indossa(pg(), ["maglia_della_veglia", "mantello_del_fuggiasco"]); S.usaOggetto(h, "maglia_della_veglia", ctx([])); S.inizioTurno(h, null, ctx([])); S.usaOggetto(h, "mantello_del_fuggiasco", ctx([]));
    const c = ctx([20, 6, 6]); S.attacco(nemico(), h, {}, c); eq(h.pv, 30 - Math.ceil(13 / 2)); vero(h.cariche.maglia, "la Maglia resta per il colpo dopo"); fine(c);
  });
  caso("Piastre, Elmo, Piede fermo: il prossimo TS riesce da solo o ha +4; Calzari +2 contro Indebolito", () => {
    const g = O.indossa(pg(), ["piastre_del_rettore"]); S.usaOggetto(g, "piastre_del_rettore", ctx([]));
    const z = P.tiroSalvezza(g, "sanguinante", { liv: 5, modClasse: 5 }, dadi([])); vero(z.ok && z.auto);
    const e = O.indossa(pg(), ["elmo_della_sentinella"]); S.usaOggetto(e, "elmo_della_sentinella", ctx([]));
    vero(!P.tiroSalvezza(e, "sanguinante", { liv: 5, modClasse: 5 }, dadi([1])).auto); vero(P.tiroSalvezza(e, "esposto", { liv: 5, modClasse: 5 }, dadi([])).auto);
    const s = O.indossa(pg(), ["stivali_della_lunga_caccia"]); vero(s.immuni.includes("stordito")); S.usaOggetto(s, "piede_fermo", ctx([]));
    eq(P.tiroSalvezza(s, "sanguinante", { liv: 1, modClasse: 0 }, dadi([1])).m, 3 + 2 + 4);
    eq(P.tiroSalvezza(O.indossa(pg(), ["calzari_del_viandante"]), "indebolito", { liv: 1, modClasse: 0 }, dadi([1])).m, 3 + 2 + 2);
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
