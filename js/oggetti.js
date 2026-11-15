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
    bastone_da_cartografo: A("Bastone da cartografo", { dado: 8, tipo: "contundente", bonus: 2, dueMani: true, eFocus: true, rarita: "Raro", da: "Cartografo rinnegato", potere: { id: "segno_sulla_mappa", tipo: "scontro" } }),
    falce: A("Falce", { dado: 10, tipo: "taglio", bonus: 3, dueMani: true, rarita: "Leggendario", da: "Atena", potere: { id: "raccolto", tipo: "giornaliero" } }),
    clava_di_radice: A("Clava di radice", { dado: 10, tipo: "contundente", bonus: 3, dueMani: true, rarita: "Leggendario", da: "Troll delle radici", potere: { id: "albero_caduto", tipo: "giornaliero" } }),
    stocco: A("Stocco", { dado: 10, tipo: "perforante", bonus: 3, rarita: "Leggendario", da: "Dafne", potere: { id: "doppia_stoccata", tipo: "giornaliero" } }),
    verga_di_cenere: A("Verga di cenere", { dado: 10, tipo: "fuoco", bonus: 3, eFocus: true, rarita: "Leggendario", da: "Profeta della cenere", potere: { id: "pioggia_di_braci", tipo: "giornaliero" } })
  };
  const POTERI_ARMA = {
    danza_delle_lame: { nome: "Danza delle lame", testo: "Su un colpo a segno, un colpo gratuito (dado dell'arma); se il bersaglio è già Sanguinante, lo aggrava in Emorragia." },
    colpo_del_giuramento: { nome: "Colpo del Giuramento", testo: "Su un colpo a segno, un dado in più e lo stato della faccia attiva: maglio Stordito (poi Commosso), ascia Sanguinante (poi Emorragia)." },
    punta_nella_piaga: { nome: "Punta nella piaga", testo: "Su un colpo a segno applica Esposto; se è già Esposto, Scoperto. Nessun dado in più." },
    segno_sulla_mappa: { nome: "Segno sulla mappa", testo: "Si dichiara insieme a un potere di classe che applica uno stato: quello stato entra senza tiro salvezza, solo per quel colpo." },
    raccolto: { nome: "Raccolto", testo: "Su un colpo a segno, due dadi in più e aggrava lo stato dell'arma; se il bersaglio è Vacillante, critico." },
    albero_caduto: { nome: "Albero caduto", testo: "Su un colpo a segno, due dadi in più; il bersaglio è Stordito senza TS e subito Commosso (un boss: Indebolito 3 turni senza TS)." },
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
    elmo_del_penitente: E_("Elmo del Penitente", { slot: "elmo", rarita: "Raro", potere: { id: "elmo_del_penitente", tipo: "scontro", testo: "Carica: il prossimo TS contro Impaurito o Esposto riesce da solo." } }),
    guanti_del_cartografo: E_("Guanti del Cartografo", { slot: "guanti", rarita: "Raro", potere: { id: "studio_del_bersaglio", tipo: "scontro", testo: "Studio del bersaglio. Carica: il prossimo attacco fa un dado in più se il bersaglio è vulnerabile al suo tipo di danno (altrimenti la carica va persa)." } }),
    calzari_del_pellegrino: E_("Calzari del Pellegrino", { slot: "stivali", rarita: "Raro", tsStato: { indebolito: 2, stordito: 2 } }),
    mantello_del_penitente: E_("Mantello del Penitente", { slot: "mantello", rarita: "Raro", potere: { id: "mantello_del_penitente", tipo: "scontro", testo: "Carica: il prossimo colpo subito è dimezzato (non con la Maglia sullo stesso colpo)." } }),
    amuleto_della_veglia: E_("Amuleto della veglia", { slot: "amuleto", rarita: "Raro", potere: { id: "amuleto_della_veglia", tipo: "scontro", testo: "Carica: il prossimo nemico che ti colpisce subisce 1d6 + livello." } }),
    cinturone_del_cacciatore: E_("Cinturone del Cacciatore", { slot: "cintura", rarita: "Raro", cinturone: true }),
    talismano_di_ferro_freddo: E_("Talismano di ferro freddo", { slot: "amuleto", rarita: "Non comune", tsStato: { scottato: 1 } }),
    stivali_della_lunga_caccia: E_("Stivali della lunga caccia", { slot: "stivali", rarita: "Leggendario", immuni: ["stordito"], potere: { id: "piede_fermo", tipo: "giornaliero", testo: "Piede fermo (da riconfermare). Carica: il prossimo TS ha +4." } }),
    anello_della_resina: E_("Anello della resina", { slot: "anello", rarita: "Leggendario", potere: { id: "anello_della_resina", tipo: "giornaliero", scegliStato: true, testo: "Scegli uno stato: sei immune per tutto lo scontro." } })
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
    b.immuni = [...new Set([...(b.immuni || []), ...b.immuniEquip])];
    return b;
  }
  /* i poteri dell'equipaggiamento indossato, per la barra */
  const poteriEquip = (b) => (b.equip || []).map(id => EQUIP[id].potere && { ...EQUIP[id].potere, oggetto: id, nomeOggetto: EQUIP[id].nome }).filter(Boolean);
  const arma = (id, o) => (ARMI[id] ? { ...ARMI[id], id, ...(o || {}) } : null);

  const API = { ARMI, POTERI_ARMA, EQUIP, SLOT_UNICI, indossa, poteriEquip, arma };
  root.Oggetti = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof window !== "undefined" ? window : globalThis);
