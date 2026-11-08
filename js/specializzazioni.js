/* =====================================================================
   SPECIALIZZAZIONI — catalogo dei poteri del nuovo combattimento (dati, niente regole).
   Contratto: docs/riscrittura_meccaniche.md, sezioni 0 e 3-6. La logica di ogni potere è in js/scontro.js.
   Classi con le chiavi interne di Regole (Soldato = Guerriero, Forestiero = Sciamano, Sapiente = Arcanista, Accolito = Monaco).

   Ogni potere: { nome, tipo: "volonta" | "scontro" | "giornaliero", liv, testo }
   Ogni specializzazione: { nome, volonta: [3 fissi], scontro: [3, se ne scelgono 2], giornalieri: [2, se ne sceglie 1],
                            livelli: { 3: giornaliero, 4: per scontro, 5: giornaliero finale } }
   Blocco 2 (08/11/2026): Guerriero. Le altre classi entrano con i loro poteri, una alla volta.
   ===================================================================== */
(function (root) {
  const POTERI = {
    /* ---- Guerriero: in comune ---- */
    secondo_vento: { nome: "Secondo vento", tipo: "scontro", liv: 1, testo: "Costa l'azione: ti curi di 1/4 della salute massima." },
    colpo_di_mestiere: { nome: "Colpo di mestiere", tipo: "volonta", liv: 1, testo: "Solo il dado dell'arma; applica lo stato dell'arma." },

    /* ---- Guerriero Esecutore ---- */
    colpo_poderoso: { nome: "Colpo poderoso", tipo: "volonta", liv: 1, testo: "Dado dell'arma + Vigore; +2 danni se il bersaglio ha già uno stato." },
    guardia_feroce: { nome: "Guardia feroce", tipo: "volonta", liv: 1, testo: "+2 CA fino al tuo turno; se il nemico ti manca, contrattacco con il dado dell'arma che applica lo stato dell'arma." },
    spezza_guardia: { nome: "Spezza-guardia", tipo: "scontro", liv: 1, testo: "Attacco con un dado in più; se colpisce, Esposto." },
    colpo_crudele: { nome: "Colpo crudele", tipo: "scontro", liv: 1, testo: "Attacco con un dado in più; aggrava lo stato dell'arma." },
    caccia_al_ferito: { nome: "Caccia al ferito", tipo: "scontro", liv: 1, testo: "Attacco con un dado in più; se il bersaglio è Vacillante, un altro dado in più e non può caricare un colpo nel suo prossimo turno." },
    assalto_implacabile: { nome: "Assalto implacabile", tipo: "giornaliero", liv: 1, testo: "Due attacchi: il primo applica lo stato dell'arma, il secondo lo aggrava." },
    colpo_del_boia: { nome: "Colpo del boia", tipo: "giornaliero", liv: 1, testo: "Doppio dei dadi; critico automatico se il bersaglio è Vacillante." },
    marchio_della_preda: { nome: "Marchio della preda", tipo: "giornaliero", liv: 3, testo: "Il bersaglio è marchiato per lo scontro: +1d4 a tutti i tuoi attacchi contro di lui." },
    ferita_riaperta: { nome: "Ferita riaperta", tipo: "scontro", liv: 4, testo: "Se il bersaglio ha lo stato dell'arma: +1 dado per ogni turno che gli resta, poi lo stato finisce." },
    sentenza: { nome: "Sentenza", tipo: "giornaliero", liv: 5, testo: "Tre attacchi; se il bersaglio è Vacillante, sono tutti critici." },

    /* ---- Guerriero Sentinella ---- */
    colpo_di_guardia: { nome: "Colpo di guardia", tipo: "volonta", liv: 1, testo: "Dado dell'arma + Vigore; +2 danni se il nemico ti ha colpito nel suo ultimo turno." },
    in_guardia: { nome: "In guardia", tipo: "volonta", liv: 1, testo: "+2 CA fino al tuo turno (+4 con lo scudo); se il nemico ti manca, contrattacco con il dado dell'arma." },
    ritorsione: { nome: "Ritorsione", tipo: "scontro", liv: 1, testo: "Costa l'azione: il primo colpo che subisci fa 0; contrattacco a danno pieno che aggrava lo stato dell'arma." },
    rintocco: { nome: "Rintocco", tipo: "scontro", liv: 1, testo: "Attacco; se colpisce, applica lo stato dell'arma (o lo aggrava) e Indebolito; +2 CA fino al tuo turno." },
    rappresaglia: { nome: "Rappresaglia", tipo: "scontro", liv: 1, testo: "Costa l'azione: fino al tuo turno, ogni volta che il nemico ti colpisce, contrattacchi con il dado dell'arma e applichi lo stato dell'arma." },
    veglia_di_ferro: { nome: "Veglia di ferro", tipo: "giornaliero", liv: 1, testo: "Per 3 turni +2 CA e +4 ai tiri salvezza; In guardia contrattacca anche se vieni colpito, e il contrattacco aggrava lo stato dell'arma." },
    rivalsa: { nome: "Rivalsa", tipo: "giornaliero", liv: 1, testo: "Attacco + metà del danno subito dall'ultimo turno del nemico (tutto se sei Vacillante); aggrava lo stato dell'arma." },
    ultimo_baluardo: { nome: "Ultimo baluardo", tipo: "giornaliero", liv: 3, testo: "Per 3 turni, la prima volta che un colpo ti porterebbe a 0 resti a 1; ogni colpo che subisci dà +1 dado al tuo prossimo attacco (massimo 3)." },
    spezza_carica: { nome: "Spezza-carica", tipo: "scontro", liv: 4, testo: "Attacco con un dado in più; se il nemico ha un colpo caricato o un attacco speciale pronto, lo perde e diventa Indebolito; altrimenti aggrava lo stato dell'arma." },
    silenzio_della_casa: { nome: "Silenzio della casa", tipo: "giornaliero", liv: 5, testo: "Attacco con due dadi in più che aggrava lo stato dell'arma; per 2 turni il nemico non può caricare né usare attacchi speciali; per 3 turni +2 CA." }
  };

  const SPEC = {
    Soldato: {
      classe: { potere: "secondo_vento", tratti: { 1: "mente_incrollabile", 4: "furia" } },
      esecutore: {
        nome: "Esecutore", volonta: ["colpo_poderoso", "colpo_di_mestiere", "guardia_feroce"],
        scontro: ["spezza_guardia", "colpo_crudele", "caccia_al_ferito"], giornalieri: ["assalto_implacabile", "colpo_del_boia"],
        livelli: { 3: "marchio_della_preda", 4: "ferita_riaperta", 5: "sentenza" }
      },
      sentinella: {
        nome: "Sentinella", volonta: ["colpo_di_guardia", "colpo_di_mestiere", "in_guardia"],
        scontro: ["ritorsione", "rintocco", "rappresaglia"], giornalieri: ["veglia_di_ferro", "rivalsa"],
        livelli: { 3: "ultimo_baluardo", 4: "spezza_carica", 5: "silenzio_della_casa" }
      }
    }
  };

  /* scelta di creazione: 2 per scontro su 3, 1 giornaliero su 2, dentro la propria specializzazione */
  function sceltaValida(classe, spec, scelti) {
    const s = SPEC[classe] && SPEC[classe][spec]; if (!s) return { ok: false, motivo: "specializzazione" };
    const sc = (scelti || []).filter(id => s.scontro.includes(id)), gi = (scelti || []).filter(id => s.giornalieri.includes(id));
    const estranei = (scelti || []).filter(id => !s.scontro.includes(id) && !s.giornalieri.includes(id));
    if (estranei.length) return { ok: false, motivo: "estranei", estranei };
    if (new Set(sc).size !== 2) return { ok: false, motivo: "scontro" };
    if (new Set(gi).size !== 1) return { ok: false, motivo: "giornalieri" };
    return { ok: true };
  }
  /* i poteri che il personaggio ha a un livello: a volontà, i suoi scelti, i fissi dei livelli 3-5 e il potere di classe */
  function poteriAlLivello(classe, spec, scelti, liv) {
    const c = SPEC[classe], s = c && c[spec]; if (!s) return [];
    const fissi = [3, 4, 5].filter(l => l <= liv).map(l => s.livelli[l]);
    return [...s.volonta, ...(scelti || []), ...fissi, c.classe.potere];
  }
  const trattiAlLivello = (classe, liv) => { const t = (SPEC[classe] && SPEC[classe].classe.tratti) || {}; return Object.keys(t).filter(l => +l <= liv).map(l => t[l]); };

  const API = { POTERI, SPEC, sceltaValida, poteriAlLivello, trattiAlLivello };
  root.SPECIALIZZAZIONI = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof window !== "undefined" ? window : globalThis);
