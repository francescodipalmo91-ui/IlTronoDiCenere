/* =====================================================================
   SPECIALIZZAZIONI — catalogo dei poteri del nuovo combattimento (dati, niente regole).
   Contratto: docs/riscrittura_meccaniche.md, sezioni 0 e 3-6. La logica di ogni potere è in js/scontro.js.
   Classi con le chiavi interne di Regole (Soldato = Guerriero, Forestiero = Sciamano, Sapiente = Arcanista, Accolito = Monaco).

   Ogni potere: { nome, tipo: "volonta" | "scontro" | "giornaliero", liv, testo }
   Ogni specializzazione: { nome, volonta: [3], scontro: [3, se ne sceglie 1, poi un secondo al livello 3], giornalieri: [2, se ne sceglie 1],
                            volontaDopo: l'a volontà che arriva al livello 2, fissi: { giornaliero, scontro (livello 4), finale (livello 5) } }
   Blocco 2 (08/11/2026): tutte e quattro le classi, otto specializzazioni.
   ===================================================================== */
(function (root) {
  const POTERI = {
    /* ---- Guerriero: in comune ---- */
    secondo_vento: { nome: "Secondo vento", tipo: "scontro", liv: 1, testo: "Costa l'azione: ti curi di 1/4 della salute massima." },
    colpo_di_mestiere: { nome: "Colpo di mestiere", tipo: "volonta", liv: 1, testo: "Solo il dado dell'arma; applica lo stato dell'arma." },

    /* ---- Guerriero Esecutore ---- */
    colpo_poderoso: { nome: "Colpo poderoso", tipo: "volonta", liv: 1, testo: "Dado dell'arma + Vigore; +2 danni se il bersaglio ha già uno stato." },
    guardia_feroce: { nome: "Guardia feroce", tipo: "volonta", liv: 2, testo: "+2 CA fino al tuo turno; se il nemico ti manca, contrattacco con il dado dell'arma che applica lo stato dell'arma." },
    spezza_guardia: { nome: "Spezza-guardia", tipo: "scontro", liv: 1, testo: "Attacco con un dado in più; se colpisce, Esposto." },
    colpo_crudele: { nome: "Colpo crudele", tipo: "scontro", liv: 1, testo: "Attacco con un dado in più; aggrava lo stato dell'arma." },
    caccia_al_ferito: { nome: "Caccia al ferito", tipo: "scontro", liv: 1, testo: "Attacco con un dado in più; se il bersaglio è Vacillante, un altro dado in più e non può caricare un colpo nel suo prossimo turno." },
    assalto_implacabile: { nome: "Assalto implacabile", tipo: "giornaliero", liv: 1, testo: "Due attacchi: il primo applica lo stato dell'arma, il secondo lo aggrava." },
    colpo_del_boia: { nome: "Colpo del boia", tipo: "giornaliero", liv: 1, testo: "Doppio dei dadi; critico automatico se il bersaglio è Vacillante." },
    marchio_della_preda: { nome: "Marchio della preda", tipo: "giornaliero", liv: 4, testo: "Il bersaglio è marchiato per lo scontro: +1d4 a tutti i tuoi attacchi contro di lui." },
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
    ultimo_baluardo: { nome: "Ultimo baluardo", tipo: "giornaliero", liv: 4, testo: "Per 3 turni, la prima volta che un colpo ti porterebbe a 0 resti a 1; ogni colpo che subisci dà +1 dado al tuo prossimo attacco (massimo 3)." },
    spezza_carica: { nome: "Spezza-carica", tipo: "scontro", liv: 4, testo: "Attacco con un dado in più; se il nemico ha un colpo caricato o un attacco speciale pronto, lo perde e diventa Indebolito; altrimenti aggrava lo stato dell'arma." },
    silenzio_della_casa: { nome: "Silenzio della casa", tipo: "giornaliero", liv: 5, testo: "Attacco con due dadi in più che aggrava lo stato dell'arma; per 2 turni il nemico non può caricare né usare attacchi speciali; per 3 turni +2 CA." },
    /* ---- Sciamano: in comune ---- */
    bevi_elisir: { nome: "Bevi un elisir (Infuso)", tipo: "volonta", liv: 1, testo: "Costa l'azione: bevi un elisir preparato al riposo e ti curi (PROVVISORIO: 1/4 della salute massima)." },
    puntura_di_mandragora: { nome: "Puntura di mandragora", tipo: "volonta", liv: 1, testo: "Dado dell'arma + Agilità, applica Intossicato." },
    tappeto_di_micelio: { nome: "Tappeto di micelio", tipo: "volonta", liv: 1, testo: "Solo il dado dell'arma, applica Indebolito; se il bersaglio è Intossicato, il veleno dura 1 turno in più." },

    /* ---- Sciamano delle Spore ---- */
    pelle_di_corteccia: { nome: "Pelle di corteccia", tipo: "volonta", liv: 2, testo: "+2 CA fino al tuo turno; chi ti colpisce diventa Intossicato." },
    spore_del_morbo: { nome: "Spore del morbo", tipo: "scontro", liv: 1, testo: "Attacco con un dado in più, aggrava il veleno." },
    muffa_che_dilaga: { nome: "Muffa che dilaga", tipo: "scontro", liv: 1, testo: "Per 3 turni ogni tuo colpo a segno applica Intossicato e allunga di 1 turno il veleno in corso." },
    esalazione: { nome: "Esalazione", tipo: "scontro", liv: 1, testo: "Senza tiro per colpire: TS Vigore → Indebolito e Stordito (sui boss Indebolito); applica Intossicato in ogni caso." },
    cuore_di_tossina: { nome: "Cuore di tossina", tipo: "giornaliero", liv: 1, testo: "Aggrava il veleno, poi il bersaglio subisce subito tutti i turni che gli restano; il veleno riparte da capo, grave. Con Pestilenza: tanti turni quanti ne sono passati dal suo inizio, massimo 5." },
    sciame_putrido: { nome: "Sciame putrido", tipo: "giornaliero", liv: 1, testo: "Per i tuoi 3 turni successivi, all'inizio del turno uno sciame fa 1d6 senza tiro per colpire e applica il veleno (o lo aggrava)." },
    pestilenza: { nome: "Pestilenza", tipo: "giornaliero", liv: 4, testo: "Per lo scontro il veleno sul bersaglio non scade." },
    cisti_parassita: { nome: "Cisti parassita", tipo: "scontro", liv: 4, testo: "Trappola: al prossimo attacco del nemico, aggrava il veleno e gli fa subito un turno di veleno." },
    marea_di_putrefazione: { nome: "Marea di putrefazione", tipo: "giornaliero", liv: 5, testo: "Aggrava il veleno; per 3 turni fa il doppio dei dadi (4 turni se il bersaglio è Vacillante)." },

    /* ---- Sciamano della Linfa ---- */
    corteccia_viva: { nome: "Corteccia viva", tipo: "volonta", liv: 2, testo: "+2 CA fino al tuo turno; se il nemico ti manca, il veleno su di lui torna a durata piena." },
    baccello_esplosivo: { nome: "Baccello esplosivo", tipo: "scontro", liv: 1, testo: "Trappola: al prossimo attacco del nemico scoppia, aggrava il veleno ed Esposto." },
    linfa_amara: { nome: "Linfa amara", tipo: "scontro", liv: 1, testo: "Attacco con un dado in più, aggrava il veleno." },
    radici_avvolgenti: { nome: "Radici avvolgenti", tipo: "scontro", liv: 1, testo: "Costa l'azione: il nemico diventa Indebolito, il veleno su di lui dura 1 turno in più e +2 CA fino al tuo turno." },
    fioritura_del_parassita: { nome: "Fioritura del parassita", tipo: "giornaliero", liv: 1, testo: "Bulbo per 3 turni: 1d6 a ogni turno del nemico, oltre al veleno; al terzo turno esplode per 2d6 e aggrava il veleno." },
    cuore_di_linfa: { nome: "Cuore di linfa", tipo: "giornaliero", liv: 1, testo: "Aggrava il veleno; per 3 turni il Balsamo cura il doppio." },
    linfa_perenne: { nome: "Linfa perenne", tipo: "giornaliero", liv: 4, testo: "Per lo scontro, ogni volta che il Balsamo ti cura, il veleno sul nemico dura 1 turno in più (massimo 3 volte)." },
    purga: { nome: "Purga", tipo: "scontro", liv: 4, testo: "Aggrava il veleno e togli tutti i tuoi stati." },
    rinascita_del_sottobosco: { nome: "Rinascita del sottobosco", tipo: "giornaliero", liv: 5, testo: "Aggrava il veleno e lo riporta a durata piena; togli tutti i tuoi stati e ti curi di un dado del veleno per ogni turno rimasto." },
    /* ---- Arcanista: in comune ---- */
    coagulo: { nome: "Coagulo", tipo: "scontro", liv: 1, testo: "Costa l'azione: ti curi di 1/4 della salute massima, +1d6 se il nemico ha uno stato." },

    /* ---- Arcanista del Sangue (Sangue versato: sopra il 50%, una volta per turno, 3 salute per +1 dado; da Vacillante gratis) ---- */
    stilo_cremisi: { nome: "Stilo cremisi", tipo: "volonta", liv: 1, testo: "Dado del focus + Mente, applica Sanguinante." },
    frusta_cremisi: { nome: "Frusta cremisi", tipo: "volonta", liv: 1, testo: "Solo 1d4 senza tiro per colpire, applica Indebolito; se il bersaglio è Sanguinante, il sanguinamento dura 1 turno in più." },
    crosta: { nome: "Crosta", tipo: "volonta", liv: 2, testo: "+2 CA fino al tuo turno; chi ti colpisce diventa Sanguinante." },
    ebollizione: { nome: "Ebollizione", tipo: "scontro", liv: 1, testo: "Attacco con un dado in più, aggrava il sanguinamento; se è già Emorragia, ti curi 1d6." },
    meteora_di_sangue: { nome: "Meteora di sangue", tipo: "scontro", liv: 1, testo: "Attacco con un dado in più, Esposto; critico con 19-20 se il bersaglio sanguina." },
    ali_cremisi: { nome: "Ali cremisi", tipo: "scontro", liv: 1, testo: "Costa l'azione: fino al tuo turno ogni colpo che subisci fa metà danno e aggrava il sanguinamento di chi ti colpisce." },
    cuore_spezzato: { nome: "Cuore spezzato", tipo: "giornaliero", liv: 1, testo: "Aggrava il sanguinamento, poi il bersaglio subisce subito il doppio dei turni che gli restano e lo stato finisce; ti curi della metà del danno." },
    sangue_in_piena: { nome: "Sangue in piena", tipo: "giornaliero", liv: 1, testo: "Per 3 turni i tuoi attacchi fanno un dado in più e ogni colpo a segno aggrava il sanguinamento; ogni volta che il nemico subisce l'Emorragia ti curi 1." },
    vincolo_di_sangue: { nome: "Vincolo di sangue", tipo: "giornaliero", liv: 4, testo: "TS Spirito → per 3 turni il bersaglio subisce anche la metà del danno che subisci tu (escluso Sangue versato)." },
    costellazione_rossa: { nome: "Costellazione rossa", tipo: "scontro", liv: 4, testo: "Per i tuoi 3 turni successivi, all'inizio del turno una sfera fa 1d6 e applica Sanguinante; la terza aggrava." },
    marea_cremisi: { nome: "Marea cremisi", tipo: "giornaliero", liv: 5, testo: "4d8 + Mente senza tiro per colpire, aggrava il sanguinamento; se è già Emorragia, la durata raddoppia (6 turni)." },

    /* ---- Arcanista dell'Illusione (Copie: massimo 3; un colpo su di te colpisce una Copia: metà danno, la Copia svanisce, chi l'ha colpita è Indebolito) ---- */
    dardo_fantasma: { nome: "Dardo fantasma", tipo: "volonta", liv: 1, testo: "Dado del focus + Mente; +1d4 se hai almeno una Copia." },
    sussurro_illusorio: { nome: "Sussurro illusorio", tipo: "volonta", liv: 1, testo: "Solo 1d6, applica Indebolito; se il bersaglio era già Indebolito, nasce una Copia." },
    riflessi: { nome: "Riflessi", tipo: "volonta", liv: 2, testo: "+2 CA fino al tuo turno; se il nemico ti manca, nasce una Copia." },
    frantumare: { nome: "Frantumare", tipo: "scontro", liv: 1, testo: "Consumi tutte le Copie: 1d8 + Mente per Copia, senza tiro per colpire; con 3 Copie anche Esposto." },
    labirinto: { nome: "Labirinto", tipo: "scontro", liv: 1, testo: "TS Mente → Stordito (sui boss Indebolito); nasce una Copia." },
    sdoppiamento: { nome: "Sdoppiamento", tipo: "scontro", liv: 1, testo: "Costa l'azione: nascono 2 Copie e +2 CA fino al tuo turno." },
    incubo: { nome: "Incubo", tipo: "giornaliero", liv: 1, testo: "2d8 + Mente, +1d8 per Copia senza consumarle; TS Spirito → Impaurito." },
    dado_truccato: { nome: "Dado truccato", tipo: "giornaliero", liv: 1, testo: "Per 3 turni il nemico tira due d20 per colpire e tiene il peggiore (2 turni sui boss)." },
    teatro_di_specchi: { nome: "Teatro di specchi", tipo: "giornaliero", liv: 4, testo: "Copie al massimo; per 3 turni ogni Copia distrutta esplode con 1d6 su chi l'ha colpita." },
    specchio_rotto: { nome: "Specchio rotto", tipo: "scontro", liv: 4, testo: "Nasce una Copia; la prossima Copia distrutta rimanda al nemico il danno pieno del colpo (metà sui boss)." },
    grande_inganno: { nome: "Il Grande Inganno", tipo: "giornaliero", liv: 5, testo: "Consumi tutte le Copie (almeno 1): 2d10 + Mente per Copia, senza tiro per colpire; per 2 turni il nemico tira due d20 per colpire e tiene il peggiore." },
    /* ---- Monaco: in comune ---- */
    tocco_lenitivo: { nome: "Tocco lenitivo", tipo: "scontro", liv: 1, testo: "Costa l'azione: ti curi di 1/4 della salute massima e togli uno stato." },

    /* ---- Monaco Purificatore (il fuoco sacro brucia la maledizione: ignora le resistenze al fuoco) ---- */
    colpo_consacrato: { nome: "Colpo consacrato", tipo: "volonta", liv: 1, testo: "Dado dell'arma + Spirito; applica Scottato al posto dello stato dell'arma; +1d4 contro i nemici maledetti." },
    marchio_del_rogo: { nome: "Marchio del rogo", tipo: "volonta", liv: 1, testo: "Solo 1d6, applica Indebolito; se il bersaglio è Scottato, la bruciatura dura 1 turno in più." },
    aura_purificante: { nome: "Aura purificante", tipo: "volonta", liv: 2, testo: "+2 CA fino al tuo turno; il primo stato che subiresti viene bruciato via." },
    rogo: { nome: "Rogo", tipo: "scontro", liv: 1, testo: "Attacco con un dado in più, aggrava la bruciatura." },
    arma_benedetta: { nome: "Arma benedetta", tipo: "scontro", liv: 1, testo: "Per 3 turni la tua arma fa +1d4 e ogni colpo a segno applica Scottato, oltre allo stato dell'arma." },
    fiamma_calda: { nome: "Fiamma calda", tipo: "scontro", liv: 1, testo: "Costa l'azione: ti curi 1d8 + Spirito; fino al tuo turno chi ti colpisce diventa Scottato." },
    pira: { nome: "Pira", tipo: "giornaliero", liv: 1, testo: "3d8 + Spirito, aggrava la bruciatura; se era già Ustionato, Esposto per 3 turni." },
    fuoco_che_cura: { nome: "Fuoco che cura", tipo: "giornaliero", liv: 1, testo: "Ti curi 3d8 + Spirito; la cura in eccesso colpisce il nemico come danno di fuoco sacro (l'eco di Adele)." },
    consacrazione: { nome: "Consacrazione", tipo: "giornaliero", liv: 4, testo: "Per 3 turni non subisci stati; ogni stato che il nemico ti applicherebbe gli si ritorce contro come Scottato (se è già Scottato, aggrava)." },
    martello_del_giudizio: { nome: "Martello del giudizio", tipo: "scontro", liv: 4, testo: "Attacco con l'arma con un dado in più; aggrava insieme la bruciatura e lo stato dell'arma." },
    rogo_purificatore: { nome: "Rogo purificatore", tipo: "giornaliero", liv: 5, testo: "4d8 + Spirito senza tiro per colpire, aggrava la bruciatura e bruci via tutti i tuoi stati; se il bersaglio era già Ustionato, la bruciatura dura fino a fine scontro." },

    /* ---- Monaco Ossomante (placche d'ossa: massimo 3, ognuna assorbe 3 + 1 per livello oltre il primo; Gabbia d'ossa su 19-20) ---- */
    lancia_d_ossa: { nome: "Lancia d'ossa", tipo: "volonta", liv: 1, testo: "Dado del focus + Spirito; critico con 19-20." },
    spine_d_ossa: { nome: "Spine d'ossa", tipo: "volonta", liv: 1, testo: "Solo 1d6, applica Indebolito; nasce una placca." },
    armatura_d_ossa: { nome: "Armatura d'ossa", tipo: "volonta", liv: 2, testo: "Strappi le ossa al nemico: 1d4 senza tiro per colpire, +2 CA fino al tuo turno, nasce una placca." },
    spirito_d_ossa: { nome: "Spirito d'ossa", tipo: "scontro", liv: 1, testo: "Spendi tutte le placche (almeno 1): 1d8 + Spirito per placca, senza tiro per colpire." },
    lama_d_osso: { nome: "Lama d'osso", tipo: "scontro", liv: 1, testo: "Spendi 1 placca: attacco con l'arma con due dadi in più; se colpisce, la placca torna." },
    barricata_di_costole: { nome: "Barricata di costole", tipo: "scontro", liv: 1, testo: "Costa l'azione: placche al massimo; il prossimo attacco del nemico ha −2 per colpire." },
    prigione_d_ossa: { nome: "Prigione d'ossa", tipo: "giornaliero", liv: 1, testo: "TS Vigore → Stordito (sui boss Indebolito); in ogni caso Esposto per 3 turni." },
    armatura_del_sepolcro: { nome: "Armatura del sepolcro", tipo: "giornaliero", liv: 1, testo: "Per 3 turni, all'inizio di ogni tuo turno, placche al massimo." },
    armatura_spezzata: { nome: "Armatura spezzata", tipo: "giornaliero", liv: 4, testo: "Per lo scontro, ogni placca che si spezza fa 1d6 a chi l'ha colpita." },
    decrepitezza: { nome: "Decrepitezza", tipo: "scontro", liv: 4, testo: "TS Vigore → Indebolito ed Esposto insieme; nasce una placca." },
    armata_dei_morti: { nome: "Armata dei morti", tipo: "giornaliero", liv: 5, testo: "Le ossa dei morti di Casa Vespera si sollevano: 4d8 + Spirito senza tiro per colpire, +1d8 per ogni placca (consumate); Stordito (sui boss Indebolito)." }
  };

  const SPEC = {
    Soldato: {
      classe: { potere: "secondo_vento", tratti: { 1: "mente_incrollabile", 2: "furia" } },
      esecutore: {
        nome: "Esecutore", volontaDopo: "guardia_feroce", volonta: ["colpo_poderoso", "colpo_di_mestiere", "guardia_feroce"],
        scontro: ["spezza_guardia", "colpo_crudele", "caccia_al_ferito"], giornalieri: ["assalto_implacabile", "colpo_del_boia"],
        fissi: { giornaliero: "marchio_della_preda", scontro: "ferita_riaperta", finale: "sentenza" }
      },
      sentinella: {
        nome: "Sentinella", volontaDopo: "colpo_di_mestiere", volonta: ["colpo_di_guardia", "colpo_di_mestiere", "in_guardia"],
        scontro: ["ritorsione", "rintocco", "rappresaglia"], giornalieri: ["veglia_di_ferro", "rivalsa"],
        fissi: { giornaliero: "ultimo_baluardo", scontro: "spezza_carica", finale: "silenzio_della_casa" }
      }
    },
    Forestiero: {
      classe: { potere: "bevi_elisir", tratti: { 1: "legame_sottobosco", 2: "radici_profonde" } },
      spore: {
        nome: "Spore", volontaDopo: "pelle_di_corteccia", volonta: ["puntura_di_mandragora", "tappeto_di_micelio", "pelle_di_corteccia"],
        scontro: ["spore_del_morbo", "muffa_che_dilaga", "esalazione"], giornalieri: ["cuore_di_tossina", "sciame_putrido"],
        fissi: { giornaliero: "pestilenza", scontro: "cisti_parassita", finale: "marea_di_putrefazione" }
      },
      linfa: {
        nome: "Linfa", volontaDopo: "corteccia_viva", volonta: ["puntura_di_mandragora", "tappeto_di_micelio", "corteccia_viva"],
        scontro: ["baccello_esplosivo", "linfa_amara", "radici_avvolgenti"], giornalieri: ["fioritura_del_parassita", "cuore_di_linfa"],
        fissi: { giornaliero: "linfa_perenne", scontro: "purga", finale: "rinascita_del_sottobosco" }
      }
    },
    Sapiente: {
      classe: { potere: "coagulo", tratti: { 1: "pozzo_arcano", 2: "ultima_scintilla" } },
      sangue: {
        nome: "Sangue", volontaDopo: "crosta", volonta: ["stilo_cremisi", "frusta_cremisi", "crosta"],
        scontro: ["ebollizione", "meteora_di_sangue", "ali_cremisi"], giornalieri: ["cuore_spezzato", "sangue_in_piena"],
        fissi: { giornaliero: "vincolo_di_sangue", scontro: "costellazione_rossa", finale: "marea_cremisi" }
      },
      illusione: {
        nome: "Illusione", volontaDopo: "riflessi", volonta: ["dardo_fantasma", "sussurro_illusorio", "riflessi"],
        scontro: ["frantumare", "labirinto", "sdoppiamento"], giornalieri: ["incubo", "dado_truccato"],
        fissi: { giornaliero: "teatro_di_specchi", scontro: "specchio_rotto", finale: "grande_inganno" }
      }
    },
    Accolito: {
      classe: { potere: "tocco_lenitivo", tratti: { 1: "ultimo_servizio", 2: "eredita_sepolcro" } },
      purificatore: {
        nome: "Purificatore", volontaDopo: "aura_purificante", volonta: ["colpo_consacrato", "marchio_del_rogo", "aura_purificante"],
        scontro: ["rogo", "arma_benedetta", "fiamma_calda"], giornalieri: ["pira", "fuoco_che_cura"],
        fissi: { giornaliero: "consacrazione", scontro: "martello_del_giudizio", finale: "rogo_purificatore" }
      },
      ossomante: {
        nome: "Ossomante", volontaDopo: "armatura_d_ossa", volonta: ["lancia_d_ossa", "spine_d_ossa", "armatura_d_ossa"],
        scontro: ["spirito_d_ossa", "lama_d_osso", "barricata_di_costole"], giornalieri: ["prigione_d_ossa", "armatura_del_sepolcro"],
        fissi: { giornaliero: "armatura_spezzata", scontro: "decrepitezza", finale: "armata_dei_morti" }
      }
    }
  };

  /* SCALA DEI POTERI (decisa l'08/11/2026): a volontà / per scontro / giornalieri a ogni livello.
     1: 2-1-1 (due a volontà, 1 per scontro scelto su 3, 1 giornaliero scelto su 2) · 2: 3-1-1 (arriva il terzo a volontà, volontaDopo)
     3: 3-2-1 (il secondo per scontro, scelto tra i due rimasti) · 4: 3-3-2 (per scontro fisso + giornaliero fisso) · 5: 3-3-3 (giornaliero finale).
     Tratto I al livello 1, tratto II al livello 2. Oltre il 5 nessun potere nuovo. */
  const SCALA = { 1: [2, 1, 1], 2: [3, 1, 1], 3: [3, 2, 1], 4: [3, 3, 2], 5: [3, 3, 3] };
  const LIV = { terzoVolonta: 2, secondoScontro: 3, fissi: 4, finale: 5 };
  const quantiScontroScelti = (liv) => (liv >= LIV.secondoScontro ? 2 : 1);

  /* scelta dei poteri: 1 per scontro su 3 (2 dal livello 3) e 1 giornaliero su 2, dentro la propria specializzazione */
  function sceltaValida(classe, spec, scelti, liv) {
    const s = SPEC[classe] && SPEC[classe][spec]; if (!s) return { ok: false, motivo: "specializzazione" };
    const sc = (scelti || []).filter(id => s.scontro.includes(id)), gi = (scelti || []).filter(id => s.giornalieri.includes(id));
    const estranei = (scelti || []).filter(id => !s.scontro.includes(id) && !s.giornalieri.includes(id));
    if (estranei.length) return { ok: false, motivo: "estranei", estranei };
    if (new Set(sc).size !== quantiScontroScelti(liv || 1)) return { ok: false, motivo: "scontro", servono: quantiScontroScelti(liv || 1) };
    if (new Set(gi).size !== 1) return { ok: false, motivo: "giornalieri" };
    return { ok: true };
  }
  /* i poteri che il personaggio ha a un livello: a volontà (il terzo dal 2), i suoi scelti, i fissi del 4 e del 5, il potere di classe */
  function poteriAlLivello(classe, spec, scelti, liv) {
    const c = SPEC[classe], s = c && c[spec]; if (!s) return [];
    const volonta = s.volonta.filter(id => id !== s.volontaDopo || liv >= LIV.terzoVolonta);
    const fissi = [...(liv >= LIV.fissi ? [s.fissi.scontro, s.fissi.giornaliero] : []), ...(liv >= LIV.finale ? [s.fissi.finale] : [])];
    return [...volonta, ...(scelti || []), ...fissi, c.classe.potere];
  }
  const trattiAlLivello = (classe, liv) => { const t = (SPEC[classe] && SPEC[classe].classe.tratti) || {}; return Object.keys(t).filter(l => +l <= liv).map(l => t[l]); };
  /* il livello a cui un potere arriva in QUELLA specializzazione (Colpo di mestiere: 1 per l'Esecutore, 2 per la Sentinella) */
  function livelloDi(classe, spec, id) {
    const s = SPEC[classe] && SPEC[classe][spec]; if (!s) return null;
    if (id === s.volontaDopo) return LIV.terzoVolonta;
    if (id === s.fissi.scontro || id === s.fissi.giornaliero) return LIV.fissi;
    if (id === s.fissi.finale) return LIV.finale;
    return 1;
  }
  /* tutti i poteri di una specializzazione (per i controlli) */
  const tuttiDi = (s) => [...s.volonta, ...s.scontro, ...s.giornalieri, s.fissi.giornaliero, s.fissi.scontro, s.fissi.finale];

  const API = { POTERI, SPEC, SCALA, LIV, quantiScontroScelti, sceltaValida, poteriAlLivello, trattiAlLivello, tuttiDi, livelloDi };
  root.SPECIALIZZAZIONI = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof window !== "undefined" ? window : globalThis);
