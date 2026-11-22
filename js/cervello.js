/* =====================================================================
   CERVELLO — il giocatore automatico della sala di prova (15/11/2026).
   Gioca come un giocatore medio umano: prepara le combo della sua specializzazione
   (stato → potere che lo sfrutta), risponde ai colpi annunciati, si cura da Vacillante,
   usa i giornalieri nei momenti buoni invece di tenerli per sempre.

   Le regole sono scritte in italiano, una riga ciascuna, in ordine di priorità: vince la prima
   che vale ed è disponibile. È il «secondo cervello»: Francesco le può leggere e correggere
   (docs/cervello_bot.md le racconta per esteso). scegli() restituisce { id, perche }.
   ===================================================================== */
(function (root) {
  const P = root.Poteri || (typeof require === "function" ? require("./poteri.js") : null);
  const S = root.Scontro || (typeof require === "function" ? require("./scontro.js") : null);
  const SP = root.SPECIALIZZAZIONI || (typeof require === "function" ? require("./specializzazioni.js") : null);

  /* quello che un giocatore guarda prima di scegliere */
  function situazione(p, n, turno) {
    const sa = S.statoArma ? S.statoArma(p) : null, st = (k) => (n.stati && n.stati[k]) || null;
    return {
      p, n, turno: turno || 1,
      ha: (k) => P.ha(n, k), grave: (k) => P.grave(n, k), turni: (k) => (st(k) ? st(k).turni || 0 : 0),
      puo: (k) => !(n.immuni || []).includes(k), /* stato applicabile: il sovrano integro è immune al Sanguinante */
      sa, haSa: !!sa && P.ha(n, sa), graveSa: !!sa && P.grave(n, sa), puoSa: !!sa && !(n.immuni || []).includes(sa),
      vac: P.vacillante(n), ioVac: P.vacillante(p), pvPct: p.pv / p.pvMax,
      annuncio: !!n.pronto, boss: !!n.boss, placche: p.placche || 0, copie: p.copie || 0,
      scudo: P.scudoAttivo ? P.scudoAttivo(p) : null, colpitoUltimo: !!p.colpitoUltimo
    };
  }

  /* regole per specializzazione: [potere, quando, perché]. «sempre» = vale sempre */
  const sempre = () => true;
  const R = (id, quando, perche) => ({ id, quando, perche });
  const REGOLE = {
    berserker: [
      R("marchio_della_preda", (s) => s.boss && s.turno <= 2, "contro un boss il marchio rende per tutto lo scontro"),
      R("resa_dei_conti", (s) => s.vac, "Vacillante: tre critici"),
      R("colpo_del_boia", (s) => s.vac, "Vacillante: critico automatico"),
      R("caccia_al_ferito", (s) => s.vac || s.annuncio, "Vacillante o colpo annunciato: un dado di danno in più e niente carica"),
      R("assalto_implacabile", (s) => !s.haSa && s.puoSa, "applica e aggrava lo stato dell'arma in un colpo"),
      R("colpo_di_mestiere", (s) => !s.haSa && s.puoSa, "prima lo stato dell'arma"),
      R("colpo_crudele", (s) => s.haSa && !s.graveSa, "stato dell'arma presente: lo aggrava"),
      R("ferita_riaperta", (s) => s.haSa && s.turni(s.sa) >= 2, "stato lungo: lo incassa tutto subito"),
      R("spezza_guardia", (s) => !s.ha("esposto"), "Esposto: più facile colpire"),
      R("guardia_feroce", (s) => s.annuncio && s.ioVac, "colpo annunciato e poca salute: in difesa"),
      R("colpo_poderoso", sempre, "attacco base, +2 sugli stati")
    ],
    paladino: [
      R("spezza_carica", (s) => s.annuncio, "colpo annunciato: lo spezza"),
      R("silenzio_della_casa", (s) => s.annuncio, "colpo annunciato: lo spegne per 2 turni"),
      R("ritorsione", (s) => s.annuncio, "colpo annunciato: lo annulla e risponde"),
      R("veglia_di_ferro", (s) => s.boss && s.turno <= 2, "contro un boss: difesa per 3 turni"),
      R("ultimo_baluardo", (s) => s.pvPct < 0.6, "salute in calo: non può scendere a 0"),
      R("rivalsa", (s) => s.ioVac || s.colpitoUltimo, "è stato colpito: restituisce il danno"),
      R("rintocco", sempre, "stato dell'arma e Indebolito, +2 CA"),
      R("rappresaglia", (s) => s.ioVac, "poca salute: ogni colpo subito si paga"),
      R("in_guardia", (s) => s.annuncio, "colpo annunciato: in guardia"),
      R("colpo_di_mestiere", (s) => !s.haSa && s.puoSa, "prima lo stato dell'arma"),
      R("colpo_di_guardia", sempre, "attacco base, +2 se colpito")
    ],
    funghi: [
      R("esalazione", (s) => !s.ha("intossicato") && s.puo("intossicato"), "veleno e Indebolito senza tiro per colpire"),
      R("puntura_di_mandragora", (s) => !s.ha("intossicato"), "prima il veleno"),
      R("pestilenza", (s) => s.ha("intossicato"), "veleno addosso: non scade più"),
      R("muffa_che_dilaga", (s) => s.ha("intossicato"), "ogni colpo allunga il veleno"),
      R("sciame_putrido", (s) => s.boss, "danno ogni turno senza tiro"),
      R("spore_del_morbo", (s) => s.ha("intossicato") && !s.grave("intossicato"), "aggrava il veleno"),
      R("marea_di_putrefazione", (s) => s.grave("intossicato"), "veleno grave: doppio dei dadi"),
      R("cuore_di_tossina", (s) => s.grave("intossicato") && s.turni("intossicato") >= 2, "incassa tutto il veleno"),
      R("cisti_parassita", (s) => s.ha("intossicato"), "trappola: aggrava al prossimo attacco"),
      R("tappeto_di_micelio", (s) => s.ha("intossicato") && s.turni("intossicato") <= 1, "il veleno sta per scadere: lo allunga"),
      R("pelle_di_micelio", (s) => s.annuncio && s.ioVac, "colpo annunciato e poca salute"),
      R("puntura_di_mandragora", sempre, "attacco base")
    ],
    legno: [
      R("corazza_di_quercia", (s) => s.boss && s.turno <= 2, "scudo e CA per tutto lo scontro"),
      R("radici_avvolgenti", (s) => !s.scudo, "senza scudo: scudo grande e nemico Indebolito"),
      R("pioggia_di_rami", (s) => s.boss, "danno ogni turno senza tiro"),
      R("radice_madre", (s) => s.boss && s.turno <= 4, "lo scudo si ricarica di più"),
      R("corteccia_nuova", (s) => s.annuncio && (!s.scudo || s.scudo.pf < 6), "colpo annunciato e scudo basso"),
      R("ghianda_esplosiva", (s) => s.annuncio, "colpo annunciato: la trappola scoppia"),
      R("foresta_che_avanza", (s) => s.vac || s.turno >= 4, "grande attacco e scudo pieno per 3 turni"),
      R("pugno_di_quercia", (s) => s.ha("stordito") && !s.grave("stordito"), "aggrava lo stato contundente"),
      R("corteccia_viva", (s) => !s.scudo && s.annuncio, "colpo annunciato: scudo"),
      R("radice_inchiodante", (s) => s.grave("stordito") && !s.ha("indebolito"), "Commosso: Indebolito più lungo"),
      R("colpo_di_nodo", sempre, "attacco base")
    ],
    realta: [
      R("collasso_gravitazionale", (s) => s.boss && s.turno <= 2, "danno e Esposto per 3 turni"),
      R("lancia_di_realta", (s) => !s.ha("esposto"), "due dadi di danno in più e Esposto"),
      R("colpo_di_forza", (s) => !s.ha("esposto"), "prima l'Esposto"),
      R("punto_di_rottura", (s) => s.ha("esposto"), "l'Esposto non scade più"),
      R("schianto", (s) => s.ha("esposto") && !s.grave("esposto"), "aggrava: Scoperto"),
      R("annullamento", (s) => s.grave("esposto"), "Scoperto: 2 dadi di danno in più"),
      R("doppia_frattura", (s) => s.grave("esposto"), "Scoperto: due dadi di danno in più"),
      R("sovraccarico", (s) => s.ha("esposto"), "danno senza tiro, aggrava"),
      R("gravita", (s) => s.ha("esposto") && !s.ha("indebolito"), "Esposto: Indebolito più lungo, senza tiro"),
      R("spezzare_la_materia", (s) => s.n.res && s.n.res.forza === "res", "resiste alla forza"),
      R("campo_di_peso", (s) => s.annuncio && s.ioVac, "colpo annunciato e poca salute"),
      R("colpo_di_forza", sempre, "attacco base, tiene l'Esposto")
    ],
    illusione: [
      R("teatro_di_specchi", (s) => s.boss && s.turno <= 2, "Copie al massimo che esplodono"),
      R("grande_inganno", (s) => s.copie >= 3, "3 Copie: scarica tutto"),
      R("frantumare", (s) => s.copie >= 3 || (s.vac && s.copie >= 2), "Copie pronte: le fa esplodere"),
      R("dado_truccato", (s) => s.annuncio, "colpo annunciato: due d20, tiene il peggiore"),
      R("incubo", (s) => s.copie >= 2, "+1d6 per Copia senza consumarle"),
      R("sdoppiamento", (s) => s.copie <= 1, "due Copie e +2 CA"),
      R("specchio_rotto", (s) => s.copie < 3, "una Copia che rimanda il colpo"),
      R("labirinto", (s) => s.copie < 3, "Stordito (Indebolito sui boss) e una Copia"),
      R("sussurro_illusorio", (s) => s.copie < 3 && ["frantumare", "grande_inganno", "incubo"].some(s.disp), "Indebolito e una Copia per la scarica"),
      R("riflessi", (s) => s.annuncio && s.copie < 3, "colpo annunciato: se manca, nasce una Copia"),
      R("dardo_fantasma", sempre, "attacco base, +1d4 con le Copie")
    ],
    sangue: [
      R("sangue_in_piena", (s) => s.boss && s.turno <= 2, "un dado di danno in più per 3 turni, aggrava"),
      R("costellazione_rossa", (s) => s.boss, "sfere ogni turno"),
      R("dardo_di_sangue", (s) => !s.ha("sanguinante"), "prima il Sanguinante"),
      R("ebollizione", (s) => s.ha("sanguinante") && !s.grave("sanguinante"), "aggrava: Emorragia"),
      R("marea_cremisi", (s) => s.grave("sanguinante"), "Emorragia: durata doppia"),
      R("cuore_spezzato", (s) => s.grave("sanguinante") && s.turni("sanguinante") >= 2, "incassa il doppio dei turni"),
      R("meteora_di_sangue", (s) => s.ha("sanguinante"), "sanguina: critico con 19-20"),
      R("lancia_di_sangue", sempre, "due dadi di danno in più"),
      R("vincolo_di_sangue", (s) => s.boss && s.pvPct > 0.6, "il boss divide il danno che subisci"),
      R("frusta_cremisi", (s) => s.ha("sanguinante") && s.turni("sanguinante") <= 1, "il sanguinamento sta per scadere: lo allunga"),
      R("crosta", (s) => s.annuncio && s.ioVac, "colpo annunciato e poca salute"),
      R("dardo_di_sangue", sempre, "attacco base")
    ],
    ossa: [
      R("armatura_del_sepolcro", (s) => s.boss && s.turno <= 2, "placche al massimo per 3 turni"),
      R("armatura_spezzata", (s) => s.boss && s.placche >= 2, "ogni placca spezzata ferisce"),
      R("spirito_d_ossa", (s) => s.placche >= 3, "3 placche: le scarica"),
      R("barricata_di_costole", (s) => s.annuncio && s.placche < 3, "colpo annunciato: placche al massimo e −2"),
      R("prigione_d_ossa", (s) => !s.ha("esposto"), "Esposto per 3 turni"),
      R("decrepitezza", (s) => !s.ha("indebolito"), "Indebolito ed Esposto, una placca"),
      R("armata_dei_morti", (s) => s.vac || s.turno >= 4, "danno grande senza consumare placche"),
      R("lama_d_osso", (s) => s.placche >= 1 && s.placche < 3, "due dadi di danno in più, la placca torna"),
      R("armatura_d_ossa", (s) => s.placche < 3, "una placca e +2 CA"),
      R("spine_d_ossa", (s) => s.placche < 3, "una placca e Indebolito"),
      R("lancia_d_ossa", sempre, "attacco base")
    ]
  };
  const CURE = ["secondo_vento", "coagulo", "tocco_lenitivo"];

  /* la scelta del turno: { id, perche } (id null = nessun potere disponibile) */
  function scegli(p, n, turno) {
    const s = situazione(p, n, turno), mie = p.poteri || [], disp = (id) => mie.includes(id) && S.disponibile(p, id).ok;
    s.disp = disp; /* le regole possono chiedere se un potere è pronto (es. costruire Copie solo se c'è qualcosa che le spende) */
    const cura = CURE.find(disp);
    if (cura && (s.pvPct < 0.4 || (s.ioVac && s.annuncio))) return { id: cura, perche: "salute bassa: si cura" };
    if (disp("ultimo_colpo") && (s.vac || s.turno >= 3)) return { id: "ultimo_colpo", perche: "Lascito di Dafne: colpo garantito" };
    for (const r of REGOLE[p.spec] || []) if (disp(r.id) && r.quando(s)) return { id: r.id, perche: r.perche };
    const off = S.offesaDi(p); if (disp(off)) return { id: off, perche: "attacco base" };
    const q = mie.find(disp); return { id: q || null, perche: q ? "l'unico disponibile" : "niente da usare" };
  }

  /* l'azione rapida del turno (una sola): { tipo: "pozione" } | { tipo: "elisir", fam, raro } | { tipo: "set", id } | null
     Ordine: pozione da Vacillante; elisir contro lo stato che pesa di più; poi i poteri di set (Sguardo della Casa, Voce del sangue). */
  const PESO_STATO = { impaurito: 3, esposto: 2, sanguinante: 2, intossicato: 2, scottato: 2, indebolito: 1 };
  function sceltaRapida(p, n, turno) {
    if (!S.rapidaLibera(p)) return null;
    if (P.vacillante(p) && p.pozioni > 0) return { tipo: "pozione", perche: "Vacillante: pozione" };
    const borsa = p.borsa || {}, fams = (S.FAMIGLIE_ELISIR || []).filter(f => P.ha(p, f) && borsa[f]);
    const pesa = (f) => (PESO_STATO[f] || 1) + (P.grave(p, f) ? 2 : 0) + ((p.stati[f] && p.stati[f].turni) >= 2 ? 1 : 0);
    const f = fams.filter(x => pesa(x) >= 3).sort((a, b) => pesa(b) - pesa(a))[0];
    if (f) {
      const q = borsa[f], raro = q.raro > 0, ok = raro || (q.comune > 0 && !P.grave(p, f));
      if (ok) return { tipo: "elisir", fam: f, raro, perche: `${P.nomeStato(f, P.grave(p, f) ? 2 : 1)}: elisir ${raro ? "raro" : "comune"}` };
    }
    if (S.disponibileSet && n && n.boss !== undefined) {
      if (S.disponibileSet(p, "sguardo_della_casa").ok) return { tipo: "set", id: "sguardo_della_casa", perche: "set: Sguardo della Casa" };
      if (S.disponibileSet(p, "voce_del_sangue").ok) return { tipo: "set", id: "voce_del_sangue", perche: "set: Voce del sangue" };
      /* set di classe, 3 pezzi: Grido, Lampo e Radice appena possibile; Fede contro un colpo annunciato o da Vacillante */
      for (const id of ["grido_del_valoroso", "lampo_di_intuizione", "radice_che_resta"]) if (S.disponibileSet(p, id).ok) return { tipo: "set", id, perche: "set di classe" };
      if ((n.pronto || P.vacillante(p)) && S.disponibileSet(p, "fede_incrollabile").ok) return { tipo: "set", id: "fede_incrollabile", perche: "set di classe: Fede incrollabile" };
    }
    return null;
  }
  /* esegue la rapida scelta; restituisce gli eventi (vuoto se niente) */
  function rapida(p, n, turno) {
    const r = sceltaRapida(p, n, turno); if (!r) return { scelta: null, eventi: [] };
    let x;
    if (r.tipo === "pozione") { x = S.beviPozione(p, Math.max(1, Math.floor(p.pvMax / 4))); if (x.ok) p.pozioni--; }
    else if (r.tipo === "elisir") x = S.beviElisirStato(p, r.fam, r.raro);
    else x = S.usaSet(p, r.id, n);
    return { scelta: r, eventi: x.eventi || [] };
  }

  const API = { scegli, situazione, REGOLE, sceltaRapida, rapida };
  root.Cervello = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof window !== "undefined" ? window : globalThis);
