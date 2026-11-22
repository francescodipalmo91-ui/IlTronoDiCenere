/* =====================================================================
   OGGETTI — armi speciali, armature e accessori con i loro poteri (dati). La logica è in js/scontro.js.
   Contratto: docs/oggetti_per_rarita.md (v5) e docs/decisioni_14_novembre.md (15/11/2026).

   Regole:
   - Rarità: Comune +0, Non comune +1, Raro +2 (potere per scontro), Leggendario +3 (potere giornaliero, dado 1d10).
   - Poteri delle armi: si dichiarano su un attacco con l'arma (attacco base) e scattano se colpisce; non si sommano a un potere
     di classe nello stesso colpo (eccezione: Segno sulla mappa). Si consumano alla dichiarazione, anche se l'attacco manca.
   - Poteri di armature e accessori: niente reazioni. Si dichiarano nel proprio turno con l'azione rapida; due modelli:
     «fino al tuo prossimo turno» e «carica» (scatta da sola sul prossimo evento utile, sprecata se non arriva).
   - Il potere si vede solo quando si ottiene l'oggetto (nel gioco); la sala di prova li mostra tutti.
   ===================================================================== */
(function (root) {
  const A = (nome, o) => ({ nome, ...o });
  /* armi: dado, tipo, bonus, mani; potere: { id, tipo: "scontro" | "giornaliero" } */
  const ARMI = {
    due_pugnali: A("Due pugnali", { dado: 6, tipo: "taglio", bonus: 1, rarita: "Non comune", da: "Ettore" }),
    maglio_da_cava: A("Maglio da cava", { dado: 8, tipo: "contundente", bonus: 1, dueMani: true, rarita: "Non comune", da: "Bruto delle cave" }),
    stiletto_rituale: A("Stiletto rituale", { dado: 6, tipo: "perforante", bonus: 1, rarita: "Non comune", da: "Ladra dei portali" }),
    due_lame: A("Due lame", { dado: 6, tipo: "taglio", bonus: 2, rarita: "Raro", da: "Lama gemella", potere: { id: "danza_delle_lame", tipo: "scontro" } }),
    giuramento_del_rettore: A("Giuramento del Rettore", { dado: 8, tipo: "contundente", bonus: 2, dueMani: true, rarita: "Raro", da: "Enea",
      facce: [{ nome: "maglio", tipo: "contundente" }, { nome: "ascia", tipo: "taglio" }], potere: { id: "colpo_del_giuramento", tipo: "scontro" } }),
    flagello_chiodato: A("Flagello chiodato", { dado: 6, tipo: "perforante", bonus: 2, rarita: "Raro", da: "Penitente flagellante", potere: { id: "punta_nella_piaga", tipo: "scontro" } }),
    falce: A("Falce", { dado: 10, tipo: "taglio", bonus: 3, dueMani: true, rarita: "Leggendario", da: "Atena", potere: { id: "raccolto", tipo: "giornaliero" } }),
    clava_di_radice: A("Clava di radice", { dado: 10, tipo: "contundente", bonus: 3, dueMani: true, rarita: "Leggendario", da: "Troll delle radici", potere: { id: "albero_caduto", tipo: "giornaliero" } }),
    /* set di classe (set_di_classe.md, 19/11): pezzo 1 del Penitente, dal guardiano; +2 a colpire e ai danni */
    mazzafrusto_del_penitente: A("Mazzafrusto del Penitente", { dado: 6, tipo: "contundente", bonus: 2, rarita: "Set", setClasse: "penitente" }),
    stocco: A("Stocco", { dado: 10, tipo: "perforante", bonus: 3, rarita: "Leggendario", da: "Dafne", potere: { id: "doppia_stoccata", tipo: "giornaliero" } })
  };
  /* FOCUS (19/11/2026): ogni focus è UN oggetto che prende la forma scelta in creazione.
     Forma normale: una mano, dado d8; forma scudo: un gradino di dado sotto (d6), +1 CA, nessun malus di Agilità.
     Il bonus N a colpire e ai danni è lo stesso nelle due forme. Il dado base è d8; un focus con `dadoBase` (la Verga di cenere, d10) scende di un gradino in forma scudo (d8). */
  const FOCUS = {
    focus_comune: { nome: "Focus", bonus: 0, rarita: "Comune" },
    focus_rinforzato: { nome: "Focus rinforzato", bonus: 1, rarita: "Non comune", da: "armeria di Aldo" },
    sfera_armillare: { nome: "Sfera armillare", bonus: 2, rarita: "Raro", da: "Baldassarre Tintaverde", potere: { id: "segno_sulla_mappa", tipo: "scontro" } },
    focus_del_penitente: { nome: "Focus del Penitente", bonus: 2, rarita: "Set", setClasse: "penitente" },
    focus_del_pellegrino: { nome: "Focus del Pellegrino", bonus: 2, rarita: "Set", setClasse: "pellegrino" },
    verga_di_cenere: { nome: "Verga di cenere", bonus: 3, dadoBase: 10, rarita: "Leggendario", da: "Profeta della cenere", potere: { id: "pioggia_di_braci", tipo: "giornaliero" } }
  };
  const FORME_FOCUS = { normale: { dado: 8, ca: 0 }, scudo: { dado: 6, ca: 1 } };
  /* il focus pronto per il combattente (b.focus): { id, nome, forma, dado, bonus, ca, potere? } */
  function focus(id, forma) {
    const f = FOCUS[id], fm = FORME_FOCUS[forma || "normale"]; if (!f || !fm) return null;
    return { id, nome: f.nome, forma: forma || "normale", dado: f.dadoBase ? f.dadoBase - (forma === "scudo" ? 2 : 0) : fm.dado, bonus: f.bonus, ca: fm.ca, ...(f.potere ? { potere: f.potere } : {}), ...(f.setClasse ? { setClasse: f.setClasse } : {}) };
  }
  const POTERI_ARMA = {
    danza_delle_lame: { nome: "Danza delle lame", testo: "Su un colpo a segno, un colpo gratuito (dado dell'arma); se il bersaglio è già Sanguinante, lo aggrava in Emorragia." },
    colpo_del_giuramento: { nome: "Colpo del Giuramento", testo: "Su un colpo a segno, un dado di danno in più e lo stato della faccia attiva: maglio Stordito (poi Commosso), ascia Sanguinante (poi Emorragia)." },
    punta_nella_piaga: { nome: "Punta nella piaga", testo: "Su un colpo a segno applica Esposto; se è già Esposto, Scoperto. Nessun dado di danno in più." },
    segno_sulla_mappa: { nome: "Segno sulla mappa", testo: "Si dichiara insieme a un potere di classe che applica uno stato: quello stato entra senza tiro salvezza, solo per quel colpo." },
    raccolto: { nome: "Raccolto", testo: "Su un colpo a segno, due dadi di danno in più e aggrava lo stato dell'arma; se il bersaglio è Vacillante, critico." },
    albero_caduto: { nome: "Albero caduto", testo: "Su un colpo a segno, due dadi di danno in più; il bersaglio è Stordito senza TS e subito Commosso (un boss: Indebolito 3 turni senza TS)." },
    doppia_stoccata: { nome: "Doppia stoccata", testo: "Due attacchi indipendenti; ogni colpo a segno applica il suo stato senza TS: il primo Esposto, il secondo Scoperto." },
    pioggia_di_braci: { nome: "Pioggia di braci", testo: "Per 3 turni, all'inizio del tuo turno 1d6 di fuoco senza tiro, applica o aggrava Scottato." }
  };

  /* armature, scudi, accessori: ca (solo armatura e scudo), tsStato (bonus ai TS per stato), immuni, potere (azione rapida) */
  const E_ = (nome, o) => ({ nome, ...o });
  const EQUIP = {
    cuoio_dell_ombra: E_("Cuoio dell'Ombra", { slot: "armatura", armatura: "leggera", ca: 2, rarita: "Raro", potere: { id: "cuoio_dell_ombra", tipo: "scontro", testo: "Fino al tuo prossimo turno, +4 CA." } }),
    maglia_della_veglia: E_("Maglia della Veglia", { slot: "armatura", armatura: "media", ca: 2, rarita: "Raro", potere: { id: "maglia_della_veglia", tipo: "scontro", testo: "Carica: il prossimo colpo subito è ridotto di 4." } }),
    piastre_del_rettore: E_("Piastre del Rettore", { slot: "armatura", armatura: "pesante", ca: 2, rarita: "Raro", potere: { id: "piastre_del_rettore", tipo: "scontro", testo: "Carica: il prossimo TS contro uno stato riesce da solo." } }),
    scudo_di_darius: E_("Scudo di Darius", { slot: "scudo", ca: 2, rarita: "Raro", potere: { id: "risata_di_darius", tipo: "scontro", testo: "La risata di Darius. Carica: annulla il prossimo attacco del nemico, boss e colpi annunciati compresi." } }),
    elmo_della_sentinella: E_("Elmo della Sentinella", { slot: "elmo", rarita: "Raro", potere: { id: "elmo_della_sentinella", tipo: "scontro", testo: "Carica: il prossimo TS contro Impaurito o Esposto riesce da solo." } }),
    guanti_del_cartografo: E_("Guanti del Cartografo", { slot: "guanti", rarita: "Raro", potere: { id: "studio_del_bersaglio", tipo: "scontro", testo: "Studio del bersaglio. Carica: il prossimo attacco fa un dado di danno in più se il bersaglio è vulnerabile al suo tipo di danno (altrimenti la carica va persa)." } }),
    calzari_del_viandante: E_("Calzari del Viandante", { slot: "stivali", rarita: "Raro", tsStato: { indebolito: 2, stordito: 2 } }),
    mantello_del_fuggiasco: E_("Mantello del Fuggiasco", { slot: "mantello", rarita: "Raro", potere: { id: "mantello_del_fuggiasco", tipo: "scontro", testo: "Carica: il prossimo colpo subito è dimezzato (non con la Maglia sullo stesso colpo)." } }),
    amuleto_della_veglia: E_("Amuleto della veglia", { slot: "amuleto", rarita: "Raro", potere: { id: "amuleto_della_veglia", tipo: "scontro", testo: "Carica: il prossimo nemico che ti colpisce subisce 1d6 + livello." } }),
    cinturone_del_cacciatore: E_("Cinturone del Cacciatore", { slot: "cintura", rarita: "Raro", cinturone: true }),
    talismano_di_ferro_freddo: E_("Talismano di ferro freddo", { slot: "amuleto", rarita: "Non comune", tsStato: { scottato: 1 } }),
    stivali_della_lunga_caccia: E_("Stivali della lunga caccia", { slot: "stivali", rarita: "Leggendario", immuni: ["stordito"], potere: { id: "piede_fermo", tipo: "giornaliero", testo: "Piede fermo (da riconfermare). Carica: il prossimo TS ha +4." } }),
    /* ---- set di classe (set_di_classe.md, 19/11): +2 a un'abilità; 2 pezzi = potere a volontà, 3 pezzi = per scontro (SET_CLASSE) ---- */
    guanti_del_valoroso: E_("Guanti del Valoroso", { slot: "guanti", rarita: "Set", setClasse: "valoroso", abilita: { Atletica: 2 } }),
    stivali_del_valoroso: E_("Stivali del Valoroso", { slot: "stivali", rarita: "Set", setClasse: "valoroso", abilita: { Acrobazia: 2 } }),
    cintura_del_valoroso: E_("Cintura del Valoroso", { slot: "cintura", rarita: "Set", setClasse: "valoroso", abilita: { Intuizione: 2 } }),
    guanti_del_sapiente: E_("Guanti del Sapiente", { slot: "guanti", rarita: "Set", setClasse: "sapiente", abilita: { Sapienza: 2 } }),
    cappello_del_sapiente: E_("Cappello del Sapiente", { slot: "elmo", rarita: "Set", setClasse: "sapiente", abilita: { Indagare: 2 } }),
    tunica_del_sapiente: E_("Tunica del Sapiente", { slot: "armatura", armatura: "leggera", ca: 0, rarita: "Set", setClasse: "sapiente", attributi: { Vigore: 1 } }),
    mantello_del_penitente: E_("Mantello del Penitente", { slot: "mantello", rarita: "Set", setClasse: "penitente", abilita: { Intuizione: 2 } }),
    anello_del_pellegrino: E_("Anello del Pellegrino", { slot: "anello", rarita: "Set", setClasse: "pellegrino", abilita: { Sopravvivenza: 2 } }),
    collana_del_pellegrino: E_("Collana del Pellegrino", { slot: "amuleto", rarita: "Set", setClasse: "pellegrino", abilita: { Percezione: 2 } }),
    /* ---- vesti delle classi magiche (oggetti_per_rarita 2b, 19/11): CA della leggera della stessa rarità, nessun malus,
       +1 / +2 a un'abilità o TS, potere per scontro ai Rari. Casuali nel bottino: questi sono esempi (⚠ nomi e bonus da approvare) ---- */
    tonaca: E_("Tonaca", { slot: "armatura", armatura: "veste", ca: 1, rarita: "Non comune", classi: ["Accolito"], abilita: { Intuizione: 1 } }),
    paramenti: E_("Paramenti", { slot: "armatura", armatura: "veste", ca: 2, rarita: "Raro", classi: ["Accolito"], tsStato: { impaurito: 2 }, potere: { id: "maglia_della_veglia", tipo: "scontro", testo: "Carica: il prossimo colpo subito è ridotto di 4." } }),
    veste_runica: E_("Veste runica", { slot: "armatura", armatura: "veste", ca: 1, rarita: "Non comune", classi: ["Sapiente"], abilita: { Sapienza: 1 } }),
    cappa_di_viaggio: E_("Cappa di viaggio", { slot: "armatura", armatura: "veste", ca: 2, rarita: "Raro", classi: ["Sapiente"], abilita: { Indagare: 2 }, potere: { id: "cuoio_dell_ombra", tipo: "scontro", testo: "Fino al tuo prossimo turno, +4 CA." } }),
    veste_feticcio: E_("Veste feticcio", { slot: "armatura", armatura: "veste", ca: 1, rarita: "Non comune", classi: ["Forestiero"], abilita: { Sopravvivenza: 1 } }),
    abito_dello_spirito: E_("Abito dello spirito", { slot: "armatura", armatura: "veste", ca: 2, rarita: "Raro", classi: ["Forestiero"], tsStato: { intossicato: 2 }, potere: { id: "piastre_del_rettore", tipo: "scontro", testo: "Carica: il prossimo TS contro uno stato riesce da solo." } }),
    /* 22/11 (decisioni_16_novembre sez. 5): Primo passo parte da solo all'inizio del tuo primo turno, non è un'azione rapida */
    stivali_dell_ultimo_passo: E_("Stivali dell'Ultimo passo", { slot: "stivali", rarita: "Leggendario", abilita: { "Furtività": 3 }, potere: { id: "primo_passo", tipo: "giornaliero", automatico: true, testo: "Primo passo. All'inizio del tuo primo turno un attacco extra (classico o a volontà, con d20 e bonus completi); se agisci per primo, il nemico ha −2 CA nel primo round." } }),
    anello_della_resina: E_("Anello della resina", { slot: "anello", rarita: "Leggendario", potere: { id: "anello_della_resina", tipo: "giornaliero", scegliStato: true, testo: "Scegli uno stato: sei immune per tutto lo scontro." } })
  };
  /* pergamene: si legano a uno slot di potere (il potere entra nella lista dei poteri del personaggio) */
  const PERGAMENE = {
    lascito_di_dafne: { nome: "Lascito di Dafne", rarita: "Leggendario", da: "Dafne", potere: "ultimo_colpo" }
  };
  /* set di classe: un set per classe, poteri a 2 pezzi (a volontà, passivo) e a 3 pezzi (per scontro, azione rapida) */
  const SET_CLASSE = {
    valoroso: { nome: "Valoroso", classe: "Soldato", volonta: { id: "slancio", nome: "Slancio", testo: "Dopo che un tuo attacco ha colpito, il prossimo attacco ha +1 a colpire (dal turno successivo; non si somma)." },
      scontro: { id: "grido_del_valoroso", nome: "Grido del valoroso", testo: "Azione rapida: fino al tuo prossimo turno +2 CA e +2 ai danni." } },
    sapiente: { nome: "Sapiente", classe: "Sapiente", volonta: { id: "mente_lucida", nome: "Mente lucida", testo: "+1 alla CD dei TS dei tuoi poteri." },
      scontro: { id: "lampo_di_intuizione", nome: "Lampo di intuizione", testo: "Azione rapida: il prossimo potere di questo turno ha +2 CD e un dado di danno in più; si perde se non ne dichiari uno." } },
    penitente: { nome: "Penitente", classe: "Accolito", volonta: { id: "carne_domata", nome: "Carne domata", testo: "I danni nel tempo che subisci sono ridotti di 1 per turno." },
      scontro: { id: "fede_incrollabile", nome: "Fede incrollabile", testo: "Azione rapida: fino al tuo prossimo turno +3 ai TS contro gli stati." } },
    pellegrino: { nome: "Pellegrino", classe: "Forestiero", volonta: { id: "passo_del_pellegrino", nome: "Passo del pellegrino", testo: "+1 ai danni dei tuoi attacchi contro i bersagli che hanno uno stato." },
      scontro: { id: "radice_che_resta", nome: "Radice che resta", testo: "Azione rapida: il prossimo stato che applichi in questo turno dura 1 turno in più; si perde se non ne applichi." } }
  };
  const SLOT_UNICI = ["armatura", "scudo", "elmo", "guanti", "stivali", "mantello", "amuleto", "cintura"]; /* anelli: due */

  /* indossare: CA, TS, immunità, Cinturone. b.equip = [id]; il bonus di CA si somma alla CA di base una volta sola */
  function indossa(b, ids) {
    b.equip = []; b.tsStato = {}; b.immuniEquip = [];
    const visti = {};
    (ids || []).forEach(id => {
      const e = EQUIP[id]; if (!e) return;
      const max = e.slot === "anello" ? 2 : 1; visti[e.slot] = (visti[e.slot] || 0) + 1; if (visti[e.slot] > max) return;
      b.equip.push(id);
      if (e.ca) b.caBase = (b.caBase || 10) + e.ca;
      Object.entries(e.tsStato || {}).forEach(([k, v]) => { b.tsStato[k] = Math.max(b.tsStato[k] || 0, v); });
      (e.immuni || []).forEach(k => b.immuniEquip.push(k));
      if (e.cinturone) b.cinturone = true;
    });
    /* bonus agli attributi (19/11: +1 al modificatore, mai sull'attributo principale): ricalcolati da capo a ogni indossa */
    if (b.mod) { b.modSenzaEquip = b.modSenzaEquip || { ...b.mod }; b.mod = { ...b.modSenzaEquip };
      b.equip.forEach(id => Object.entries(EQUIP[id].attributi || {}).forEach(([k, v]) => { b.mod[k] = (b.mod[k] || 0) + v; })); }
    b.immuni = [...new Set([...(b.immuni || []), ...b.immuniEquip])];
    return b;
  }
  /* i poteri dell'equipaggiamento indossato, per la barra */
  const poteriEquip = (b) => (b.equip || []).map(id => EQUIP[id].potere && { ...EQUIP[id].potere, oggetto: id, nomeOggetto: EQUIP[id].nome }).filter(Boolean);
  const arma = (id, o) => (ARMI[id] ? { ...ARMI[id], id, ...(o || {}) } : null);

  /* pezzi del set di classe che il combattente ha addosso: equipaggiamento, arma in mano e focus */
  const pezziSet = (b, id) => (b.equip || []).filter(e => EQUIP[e] && EQUIP[e].setClasse === id).length
    + (b.arma && b.arma.setClasse === id ? 1 : 0) + (b.focus && b.focus.setClasse === id ? 1 : 0);
  const API = { ARMI, FOCUS, FORME_FOCUS, focus, POTERI_ARMA, EQUIP, PERGAMENE, SET_CLASSE, pezziSet, SLOT_UNICI, indossa, poteriEquip, arma };
  root.Oggetti = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof window !== "undefined" ? window : globalThis);
