/* =====================================================================
   SPECIALIZZAZIONI — catalogo dei poteri del nuovo combattimento (dati, niente regole).
   Contratto: docs/riscrittura_meccaniche.md (sezioni 0, 3-7) e docs/schema_classi.md. La logica di ogni potere è in js/scontro.js.
   Classi con le chiavi interne di Regole (Soldato = Guerriero, Forestiero = Sciamano, Sapiente = Arcanista, Accolito = Monaco).

   Riscritto il 15/11/2026 sulle decisioni del 10-14/11:
   - una specializzazione offensiva e una difensiva per classe: Berserker / Paladino, Funghi / Legno, Realtà / Illusione, Sangue / Ossa;
     il Purificatore non esiste più (il fuoco sacro resta per oggetti e pergamene);
   - catalogo di 11 poteri per specializzazione: 3 a volontà, 4 per scontro, 4 giornalieri (il finale arriva da solo);
   - scala 2-1-1 / 3-1-1 / 3-2-2 / 3-3-2 / 3-3-3; privilegi di classe ai livelli 1, 3 e 5; via di prestigio al livello 2.

   Ogni potere: { nome, tipo: "volonta" | "scontro" | "giornaliero", ruolo? (a volontà: offesa / controllo / difesa), rapida?, testo }
   Ogni specializzazione: { nome, ruolo: "offensiva" | "difensiva", descr, regola?, volonta: [3: offesa, controllo, difesa],
     scontro: [3 di base], giornalieri: [2 di base], fissi: { giornaliero (in scelta dal 3), scontro (in scelta dal 4), finale (arriva al 5) } }
   ===================================================================== */
(function (root) {
  const P = (nome, tipo, testo, o) => ({ nome, tipo, testo, ...(o || {}) });
  const V = (nome, ruolo, testo) => P(nome, "volonta", testo, { ruolo });
  const POTERI = {
    /* ---- privilegi di classe del livello 5 (poteri attivi) ---- */
    secondo_vento: P("Secondo vento", "scontro", "Costa l'azione: ti curi di 1/4 della salute massima."),
    bevi_elisir: P("Bevi un elisir (Infuso)", "volonta", "Azione rapida: bevi un elisir preparato al riposo e ti curi di 1/4 della salute massima.", { rapida: true }),
    coagulo: P("Coagulo", "scontro", "Costa l'azione: ti curi di 1/4 della salute massima, +1d6 se il nemico ha uno stato."),
    tocco_lenitivo: P("Tocco lenitivo", "scontro", "Costa l'azione: ti curi di 1/4 della salute massima e togli uno stato."),

    /* ================= GUERRIERO (Vigore): l'arma decide lo stato ================= */
    colpo_di_mestiere: V("Colpo di mestiere", "controllo", "Solo il dado dell'arma; applica lo stato dell'arma."),
    /* ---- Berserker (offensiva, ex Esecutore) ---- */
    colpo_poderoso: V("Colpo poderoso", "offesa", "Dado dell'arma + Vigore; +2 danni se il bersaglio ha già uno stato."),
    guardia_feroce: V("Guardia feroce", "difesa", "+2 CA fino al tuo turno; se il nemico ti manca, contrattacco con il dado dell'arma che applica lo stato dell'arma."),
    spezza_guardia: P("Spezza-guardia", "scontro", "Attacco con un dado in più; se colpisce, Esposto."),
    colpo_crudele: P("Colpo crudele", "scontro", "Attacco con un dado in più; aggrava lo stato dell'arma."),
    caccia_al_ferito: P("Caccia al ferito", "scontro", "Attacco con un dado in più; se il bersaglio è Vacillante, un altro dado in più e non può caricare un colpo nel suo prossimo turno."),
    ferita_riaperta: P("Ferita riaperta", "scontro", "Se il bersaglio ha lo stato dell'arma: +1 dado per ogni turno che gli resta, poi lo stato finisce."),
    assalto_implacabile: P("Assalto implacabile", "giornaliero", "Due attacchi: il primo applica lo stato dell'arma, il secondo lo aggrava."),
    colpo_del_boia: P("Colpo del boia", "giornaliero", "Doppio dei dadi; critico automatico se il bersaglio è Vacillante."),
    marchio_della_preda: P("Marchio della preda", "giornaliero", "Il bersaglio è marchiato per lo scontro: +1d4 a tutti i tuoi attacchi contro di lui."),
    sentenza: P("Sentenza", "giornaliero", "Tre attacchi; se il bersaglio è Vacillante, sono tutti critici."),
    /* ---- Paladino (difensiva, ex Difensore / Sentinella) ---- */
    colpo_di_guardia: V("Colpo di guardia", "offesa", "Dado dell'arma + Vigore; +2 danni se il nemico ti ha colpito nel suo ultimo turno."),
    in_guardia: V("In guardia", "difesa", "+2 CA fino al tuo turno (+4 con lo scudo); se il nemico ti manca, contrattacco con il dado dell'arma."),
    ritorsione: P("Ritorsione", "scontro", "Costa l'azione: il primo colpo che subisci fa 0; contrattacco a danno pieno che aggrava lo stato dell'arma."),
    rintocco: P("Rintocco", "scontro", "Attacco; se colpisce, applica lo stato dell'arma (o lo aggrava) e Indebolito; +2 CA fino al tuo turno."),
    rappresaglia: P("Rappresaglia", "scontro", "Costa l'azione: fino al tuo turno, ogni volta che il nemico ti colpisce, contrattacchi con il dado dell'arma e applichi lo stato dell'arma."),
    spezza_carica: P("Spezza-carica", "scontro", "Attacco con un dado in più; se il nemico ha un colpo caricato o un attacco speciale pronto, lo perde e diventa Indebolito; altrimenti aggrava lo stato dell'arma."),
    veglia_di_ferro: P("Veglia di ferro", "giornaliero", "Per 3 turni +2 CA e +4 ai tiri salvezza; In guardia contrattacca anche se vieni colpito, e il contrattacco aggrava lo stato dell'arma."),
    rivalsa: P("Rivalsa", "giornaliero", "Attacco + metà del danno subito dall'ultimo turno del nemico (tutto se sei Vacillante); aggrava lo stato dell'arma."),
    ultimo_baluardo: P("Ultimo baluardo", "giornaliero", "Per 3 turni, la prima volta che un colpo ti porterebbe a 0 resti a 1; ogni colpo che subisci dà +1 dado al tuo prossimo attacco (massimo 3)."),
    silenzio_della_casa: P("Silenzio della casa", "giornaliero", "Attacco con due dadi in più che aggrava lo stato dell'arma; per 2 turni il nemico non può caricare né usare attacchi speciali; per 3 turni +2 CA."),

    /* ================= SCIAMANO (Agilità) ================= */
    /* ---- Funghi (offensiva, ex Spore): il veleno ---- */
    puntura_di_mandragora: V("Puntura di mandragora", "offesa", "Dado dell'arma + Agilità, applica Intossicato."),
    tappeto_di_micelio: V("Tappeto di micelio", "controllo", "Solo il dado dell'arma, applica Indebolito; se il bersaglio è Intossicato, il veleno dura 1 turno in più."),
    pelle_di_micelio: V("Pelle di micelio", "difesa", "+2 CA fino al tuo turno; chi ti colpisce diventa Intossicato."),
    spore_del_morbo: P("Spore del morbo", "scontro", "Attacco con un dado in più, aggrava il veleno."),
    muffa_che_dilaga: P("Muffa che dilaga", "scontro", "Per 3 turni ogni tuo colpo a segno applica Intossicato e allunga di 1 turno il veleno in corso."),
    esalazione: P("Esalazione", "scontro", "Senza tiro per colpire: TS Vigore → Indebolito e Stordito (sui boss Indebolito); applica Intossicato in ogni caso."),
    cisti_parassita: P("Cisti parassita", "scontro", "Trappola: al prossimo attacco del nemico, aggrava il veleno e gli fa subito un turno di veleno."),
    cuore_di_tossina: P("Cuore di tossina", "giornaliero", "Aggrava il veleno, poi il bersaglio subisce subito tutti i turni che gli restano; il veleno riparte da capo, grave. Con Pestilenza: tanti turni quanti ne sono passati dal suo inizio, massimo 5."),
    sciame_putrido: P("Sciame putrido", "giornaliero", "Per i tuoi 3 turni successivi, all'inizio del turno uno sciame fa 1d6 senza tiro per colpire e applica il veleno (o lo aggrava)."),
    pestilenza: P("Pestilenza", "giornaliero", "Per lo scontro il veleno sul bersaglio non scade."),
    marea_di_putrefazione: P("Marea di putrefazione", "giornaliero", "Aggrava il veleno; per 3 turni fa il doppio dei dadi (4 turni se il bersaglio è Vacillante)."),
    /* ---- Legno (difensiva, nuova): contundente e scudi di PF; pool = 5 + k × livello (k: 1 a volontà, 2 per scontro, 3 giornaliero) ---- */
    colpo_di_nodo: V("Colpo di nodo", "offesa", "Dado dell'arma + Agilità, contundente; applica Stordito."),
    radice_inchiodante: V("Radice inchiodante", "controllo", "Solo il dado dell'arma, contundente; applica Indebolito; se il bersaglio è Commosso, dura 1 turno in più."),
    corteccia_viva: V("Corteccia viva", "difesa", "Scudo di 5 + livello PF fino al tuo turno; se assorbe per intero un colpo, chi ti ha colpito è Indebolito."),
    pugno_di_quercia: P("Pugno di quercia", "scontro", "Attacco con un dado in più, contundente; aggrava lo stato contundente."),
    radici_avvolgenti: P("Radici avvolgenti", "scontro", "Costa l'azione: scudo di 5 + 2 × livello PF per 3 turni e +2 CA; il nemico è Indebolito."),
    ghianda_esplosiva: P("Ghianda esplosiva", "scontro", "Trappola: al prossimo attacco del nemico scoppia, 1d6 senza tiro per colpire e aggrava lo stato contundente."),
    corteccia_nuova: P("Corteccia nuova", "scontro", "Costa l'azione: lo scudo attivo torna al massimo (o nasce quello a volontà); il nemico che ti ha colpito per ultimo è Indebolito."),
    corazza_di_quercia: P("Corazza di quercia", "giornaliero", "Aggrava lo stato contundente; scudo di 5 + 3 × livello PF e +2 CA per tutto lo scontro."),
    pioggia_di_rami: P("Pioggia di rami", "giornaliero", "Per i tuoi 3 turni successivi, all'inizio del turno 1d6 senza tiro per colpire, applica o aggrava lo stato contundente."),
    radice_madre: P("Radice madre", "giornaliero", "Per lo scontro Scorza viva recupera 4 PF invece di 2."),
    foresta_che_avanza: P("Foresta che avanza", "giornaliero", "Attacco con due dadi in più, aggrava lo stato contundente; per 3 turni lo scudo torna al massimo a ogni tuo turno."),

    /* ================= ARCANISTA (Mente) ================= */
    /* ---- Realtà (offensiva, nuova): danno di forza, Esposto / Scoperto; Frattura +2 danni su Esposto o Scoperto ---- */
    colpo_di_forza: V("Colpo di forza", "offesa", "Dado dell'arma (o del focus, se più alto) + Mente, forza; applica Esposto."),
    gravita: V("Gravità", "controllo", "1d6 di forza senza tiro per colpire, applica Indebolito; se il bersaglio è Esposto, dura 1 turno in più."),
    campo_di_peso: V("Campo di peso", "difesa", "+2 CA fino al tuo turno; se il nemico ti manca, 1d4 di forza senza tiro per colpire."),
    schianto: P("Schianto", "scontro", "Attacco con un dado in più, aggrava l'Esposto."),
    lancia_di_realta: P("Lancia di realtà", "scontro", "Attacco con due dadi in più, applica Esposto."),
    spezzare_la_materia: P("Spezzare la materia", "scontro", "Attacco con un dado in più; ignora le resistenze del bersaglio (non le immunità)."),
    doppia_frattura: P("Doppia frattura", "scontro", "Attacco; se il bersaglio è già Scoperto, due dadi in più."),
    sovraccarico: P("Sovraccarico", "giornaliero", "2d8 + Mente di forza, senza tiro per colpire; aggrava l'Esposto."),
    collasso_gravitazionale: P("Collasso gravitazionale", "giornaliero", "Per i tuoi 3 turni successivi, all'inizio del turno 1d8 di forza senza tiro per colpire, applica o aggrava l'Esposto."),
    punto_di_rottura: P("Punto di rottura", "giornaliero", "Per lo scontro l'Esposto o lo Scoperto sul bersaglio non scade."),
    annullamento: P("Annullamento", "giornaliero", "4d8 + Mente di forza senza tiro per colpire, aggrava l'Esposto; se il bersaglio è già Scoperto, 2 dadi in più."),
    /* ---- Illusione (difensiva): danno psichico, Copie deterministiche ---- */
    dardo_fantasma: V("Dardo fantasma", "offesa", "Dado dell'arma (o del focus, se più alto) + Mente, psichico; +1d4 se hai almeno una Copia."),
    sussurro_illusorio: V("Sussurro illusorio", "controllo", "Solo 1d6 psichico, applica Indebolito; se colpisce, nasce una Copia."),
    riflessi: V("Riflessi", "difesa", "+2 CA fino al tuo turno; se il nemico ti manca, nasce una Copia."),
    frantumare: P("Frantumare", "scontro", "Consumi tutte le Copie: 1d6 per Copia + Mente (una volta), senza tiro per colpire; con 3 Copie anche Esposto."),
    labirinto: P("Labirinto", "scontro", "TS Mente → Stordito (sui boss Indebolito); nasce una Copia."),
    sdoppiamento: P("Sdoppiamento", "scontro", "Costa l'azione: nascono 2 Copie e +2 CA fino al tuo turno."),
    specchio_rotto: P("Specchio rotto", "scontro", "Nasce una Copia; la prossima Copia distrutta rimanda al nemico il danno pieno del colpo (metà sui boss)."),
    incubo: P("Incubo", "giornaliero", "2d8 + Mente, +1d6 per Copia senza consumarle; TS Spirito → Impaurito."),
    dado_truccato: P("Dado truccato", "giornaliero", "Per 3 turni il nemico tira due d20 per colpire e tiene il peggiore (2 turni sui boss)."),
    teatro_di_specchi: P("Teatro di specchi", "giornaliero", "Copie al massimo; per 3 turni ogni Copia distrutta esplode con 1d6 su chi l'ha colpita."),
    grande_inganno: P("Il Grande Inganno", "giornaliero", "Consumi tutte le Copie (almeno 1): 2d8 per Copia + Mente (una volta), senza tiro per colpire; per 2 turni il nemico tira due d20 per colpire e tiene il peggiore."),

    /* ================= MONACO (Spirito) ================= */
    /* ---- Sangue (offensiva, dall'Arcanista): Sangue versato al 10% della salute massima, niente cure ---- */
    dardo_di_sangue: V("Dardo di sangue", "offesa", "Dado dell'arma (o del focus, se più alto) + Spirito, sangue; applica Sanguinante."),
    frusta_cremisi: V("Frusta cremisi", "controllo", "Solo 1d4 senza tiro per colpire, applica Indebolito; se il bersaglio è Sanguinante, il sanguinamento dura 1 turno in più."),
    crosta: V("Crosta", "difesa", "+2 CA fino al tuo turno; chi ti colpisce diventa Sanguinante."),
    ebollizione: P("Ebollizione", "scontro", "Attacco con un dado in più, aggrava il sanguinamento."),
    meteora_di_sangue: P("Meteora di sangue", "scontro", "Attacco con un dado in più, Esposto; critico con 19-20 se il bersaglio sanguina."),
    lancia_di_sangue: P("Lancia di sangue", "scontro", "Attacco con due dadi in più (con Sangue versato, tre)."),
    costellazione_rossa: P("Costellazione rossa", "scontro", "Per i tuoi 3 turni successivi, all'inizio del turno una sfera fa 1d6 e applica Sanguinante; la terza aggrava."),
    cuore_spezzato: P("Cuore spezzato", "giornaliero", "Aggrava il sanguinamento, poi il bersaglio subisce subito il doppio dei turni che gli restano e lo stato finisce."),
    sangue_in_piena: P("Sangue in piena", "giornaliero", "Per 3 turni i tuoi attacchi fanno un dado in più e ogni colpo a segno aggrava il sanguinamento."),
    vincolo_di_sangue: P("Vincolo di sangue", "giornaliero", "TS Spirito → per 3 turni il bersaglio subisce anche la metà del danno che subisci tu (escluso Sangue versato)."),
    marea_cremisi: P("Marea cremisi", "giornaliero", "4d8 + Spirito senza tiro per colpire, aggrava il sanguinamento; se è già Emorragia, la durata raddoppia (6 turni)."),
    /* ---- Ossa (difensiva, ex Ossomante): placche d'ossa, massimo 3, ognuna riduce 3 + 1 per livello oltre il primo ---- */
    lancia_d_ossa: V("Lancia d'ossa", "offesa", "Dado dell'arma (o del focus, se più alto) + Spirito, ossa; critico con 19-20."),
    spine_d_ossa: V("Spine d'ossa", "controllo", "Solo 1d6, applica Indebolito; nasce una placca."),
    armatura_d_ossa: V("Armatura d'ossa", "difesa", "Strappi le ossa al nemico: 1d4 senza tiro per colpire, +2 CA fino al tuo turno, nasce una placca."),
    spirito_d_ossa: P("Spirito d'ossa", "scontro", "Spendi tutte le placche (almeno 1): 1d8 per placca + Spirito (una volta), senza tiro per colpire."),
    lama_d_osso: P("Lama d'osso", "scontro", "Spendi 1 placca: attacco con l'arma con due dadi in più; se colpisce, la placca torna."),
    barricata_di_costole: P("Barricata di costole", "scontro", "Costa l'azione: placche al massimo; il prossimo attacco del nemico ha −2 per colpire."),
    decrepitezza: P("Decrepitezza", "scontro", "TS Vigore → Indebolito ed Esposto insieme; nasce una placca."),
    prigione_d_ossa: P("Prigione d'ossa", "giornaliero", "TS Vigore → Stordito (sui boss Indebolito); in ogni caso Esposto per 3 turni."),
    armatura_del_sepolcro: P("Armatura del sepolcro", "giornaliero", "Per 3 turni, all'inizio di ogni tuo turno, placche al massimo."),
    armatura_spezzata: P("Armatura spezzata", "giornaliero", "Per lo scontro, ogni placca che si spezza fa 1d6 a chi l'ha colpita."),
    armata_dei_morti: P("Armata dei morti", "giornaliero", "Le ossa dei morti di Casa Vespera si sollevano: 4d8 + Spirito senza tiro per colpire, senza consumare le placche; Stordito (sui boss Indebolito).")
  };

  /* privilegi di classe passivi (livelli 1 e 3); quello del livello 5 è un potere (POTERI) */
  const TRATTI = {
    furia: { nome: "Furia", testo: "Da Vacillante i tuoi attacchi fanno +2 danni." },
    mente_incrollabile: { nome: "Mente incrollabile", testo: "Una volta al giorno annulli il danno mentale di una prova fallita." },
    radici_profonde: { nome: "Radici profonde", testo: "Se il bersaglio ha uno stato, i tuoi attacchi fanno +1d4." },
    legame_sottobosco: { nome: "Legame del sottobosco", testo: "Gli stati che applichi durano 4 turni; +1 erba quando raccogli." },
    ultima_scintilla: { nome: "Ultima scintilla", testo: "Una volta per scontro, quando diventi Vacillante, recuperi un potere per scontro già usato." },
    pozzo_arcano: { nome: "Pozzo arcano", testo: "La prima volta per turno nemico che vieni colpito recuperi 1 salute (2 dal livello 4)." },
    eredita_sepolcro: { nome: "Eredità del sepolcro", testo: "Dopo un potere giornaliero, fino al tuo turno dimezzi i danni che subisci." },
    ultimo_servizio: { nome: "Ultimo servizio", testo: "Una volta al giorno, quando scendi a 0 salute, resti a 1 e ti curi 1d6 + Spirito." }
  };

  /* vie di prestigio (livello 2, uguali per tutte le classi): tre poteri passivi ai livelli 2, 3 e 4 */
  const VIE = {
    aldo: { nome: "Via di Aldo — la caccia", poteri: {
      2: { id: "occhio_del_cacciatore", nome: "Occhio del cacciatore", testo: "Il primo potere che fa danno nello scontro tira il doppio dei dadi. Fuori dallo scontro +2 alla furtività contro i guardiani." },
      3: { id: "odore_del_sangue", nome: "Odore del sangue", testo: "Contro i nemici Vacillanti i tuoi poteri a volontà fanno un dado in più." },
      4: { id: "senza_scampo", nome: "Senza scampo", testo: "La prima volta per scontro che il nemico diventa Vacillante, attacco gratuito con un potere a volontà, senza stati." } } },
    guendalina: { nome: "Via di Guendalina — il focolare", poteri: {
      2: { id: "la_lanterna", nome: "La lanterna", testo: "Immune a Impaurito; +2 a tutti i tiri salvezza; il riposo dà 3 punti mentali invece di 2." },
      3: { id: "mani_che_curano", nome: "Mani che curano", testo: "Pozioni ed elisir di salute curano il 50% in più (per eccesso)." },
      4: { id: "la_soglia_di_casa", nome: "La soglia di casa", testo: "Una volta per scontro il colpo che ti renderebbe Vacillante fa metà danno, e per 2 turni +2 CA." } } }
  };
  const LIV_VIA = 2;

  const S = (nome, ruolo, descr, volonta, scontro, giornalieri, fissi, regola) => ({ nome, ruolo, descr, volonta, scontro, giornalieri, fissi, ...(regola ? { regola } : {}) });
  const SPEC = {
    Soldato: {
      classe: { privilegi: { 1: "furia", 3: "mente_incrollabile", 5: "secondo_vento" } },
      berserker: S("Berserker", "offensiva", "Logora con lo stato dell'arma e finisce i nemici Vacillanti.",
        ["colpo_poderoso", "colpo_di_mestiere", "guardia_feroce"], ["spezza_guardia", "colpo_crudele", "caccia_al_ferito"], ["assalto_implacabile", "colpo_del_boia"],
        { giornaliero: "marchio_della_preda", scontro: "ferita_riaperta", finale: "sentenza" }),
      paladino: S("Paladino", "difensiva", "Incassa, contrattacca e toglie al nemico i suoi colpi migliori.",
        ["colpo_di_guardia", "colpo_di_mestiere", "in_guardia"], ["ritorsione", "rintocco", "rappresaglia"], ["veglia_di_ferro", "rivalsa"],
        { giornaliero: "ultimo_baluardo", scontro: "spezza_carica", finale: "silenzio_della_casa" })
    },
    Forestiero: {
      classe: { privilegi: { 1: "radici_profonde", 3: "legame_sottobosco", 5: "bevi_elisir" } },
      funghi: S("Funghi", "offensiva", "Il veleno che uccide: logoramento puro, il veleno diventa danno.",
        ["puntura_di_mandragora", "tappeto_di_micelio", "pelle_di_micelio"], ["spore_del_morbo", "muffa_che_dilaga", "esalazione"], ["cuore_di_tossina", "sciame_putrido"],
        { giornaliero: "pestilenza", scontro: "cisti_parassita", finale: "marea_di_putrefazione" }),
      legno: S("Legno", "difensiva", "La corteccia che assorbe e il contundente del legno; niente cure.",
        ["colpo_di_nodo", "radice_inchiodante", "corteccia_viva"], ["pugno_di_quercia", "radici_avvolgenti", "ghianda_esplosiva"], ["corazza_di_quercia", "pioggia_di_rami"],
        { giornaliero: "radice_madre", scontro: "corteccia_nuova", finale: "foresta_che_avanza" },
        "Scudi di PF: il danno riduce prima lo scudo, poi la salute; un solo scudo alla volta. Scorza viva: lo scudo che dura più turni recupera 2 PF all'inizio del tuo turno.")
    },
    Sapiente: {
      classe: { privilegi: { 1: "ultima_scintilla", 3: "pozzo_arcano", 5: "coagulo" } },
      realta: S("Realtà", "offensiva", "La realtà si incrina e si spezza: la forza applica Esposto e lo sfrutta.",
        ["colpo_di_forza", "gravita", "campo_di_peso"], ["schianto", "lancia_di_realta", "spezzare_la_materia"], ["sovraccarico", "collasso_gravitazionale"],
        { giornaliero: "punto_di_rottura", scontro: "doppia_frattura", finale: "annullamento" },
        "Frattura: i tuoi poteri fanno +2 danni a un bersaglio Esposto o Scoperto."),
      illusione: S("Illusione", "difensiva", "Inganna il nemico con le Copie, che alla fine diventano danno psichico.",
        ["dardo_fantasma", "sussurro_illusorio", "riflessi"], ["frantumare", "labirinto", "sdoppiamento"], ["incubo", "dado_truccato"],
        { giornaliero: "teatro_di_specchi", scontro: "specchio_rotto", finale: "grande_inganno" },
        "Copie: massimo 3. Un colpo su di te colpisce una Copia: metà danno, la Copia svanisce, chi l'ha colpita è Indebolito.")
    },
    Accolito: {
      classe: { privilegi: { 1: "eredita_sepolcro", 3: "ultimo_servizio", 5: "tocco_lenitivo" } },
      sangue: S("Sangue", "offensiva", "Dardi e lance di sangue; non si cura.",
        ["dardo_di_sangue", "frusta_cremisi", "crosta"], ["ebollizione", "meteora_di_sangue", "lancia_di_sangue"], ["cuore_spezzato", "sangue_in_piena"],
        { giornaliero: "vincolo_di_sangue", scontro: "costellazione_rossa", finale: "marea_cremisi" },
        "Sangue versato: sopra il 50% della salute, una volta per turno, paghi il 10% della salute massima (per eccesso) per un dado in più; da Vacillante il dado è gratis."),
      ossa: S("Ossa", "difensiva", "Accumula placche d'ossa attorno all'armatura e le scarica come armi.",
        ["lancia_d_ossa", "spine_d_ossa", "armatura_d_ossa"], ["spirito_d_ossa", "lama_d_osso", "barricata_di_costole"], ["prigione_d_ossa", "armatura_del_sepolcro"],
        { giornaliero: "armatura_spezzata", scontro: "decrepitezza", finale: "armata_dei_morti" },
        "Placche d'ossa: massimo 3; un colpo subito ne spezza una e riduce il danno di 3 + 1 per livello oltre il primo.")
    }
  };
  /* i nomi delle specializzazioni prima dell'11/11 (vecchi salvataggi della sala di prova) */
  const ALIAS = { esecutore: "berserker", difensore: "paladino", sentinella: "paladino", spore: "funghi", linfa: "legno", ossomante: "ossa" };

  /* SCALA DEI POTERI (10/11/2026, dal diagramma): a volontà / per scontro / giornalieri conosciuti, in totale */
  const SCALA = { 1: [2, 1, 1], 2: [3, 1, 1], 3: [3, 2, 2], 4: [3, 3, 2], 5: [3, 3, 3] };
  const LIV = { terzoVolonta: 2, via: LIV_VIA, terzoGiornaliero: 3, quartoScontro: 4, finale: 5 };

  /* SCELTE (definitive; cambio libero solo nella sala di prova):
       1 (creazione): 2 a volontà su 3 · per scontro 1 su 3 · giornaliero 1 su 2
       2: nessuna scelta di poteri (arriva da solo l'a volontà lasciato; la scelta è la via)
       3: per scontro, una delle due carte rimaste · giornaliero, quello rimasto o il terzo del catalogo
       4: per scontro, quello rimasto o il quarto del catalogo
       5: nessuna scelta, arriva il finale
     Un per scontro e un giornaliero restano fuori per sempre. */
  const specDi = (classe, spec) => (SPEC[classe] && SPEC[classe][ALIAS[spec] || spec]) || null;
  function opzioniLivello(classe, spec, scelti, liv) {
    const s = specDi(classe, spec); if (!s) return [];
    const presi = new Set(scelti || []), resto = (lista) => lista.filter(id => !presi.has(id));
    if (liv === 1) {
      const v = resto(s.volonta), voltaV = Math.max(0, 2 - s.volonta.filter(id => presi.has(id)).length);
      return [...Array.from({ length: voltaV }, () => ({ livello: 1, tipo: "volonta", opzioni: v })),
        { livello: 1, tipo: "scontro", opzioni: [...s.scontro] }, { livello: 1, tipo: "giornaliero", opzioni: [...s.giornalieri] }];
    }
    if (liv === 3) return [{ livello: 3, tipo: "scontro", opzioni: resto(s.scontro) }, { livello: 3, tipo: "giornaliero", opzioni: [...resto(s.giornalieri), s.fissi.giornaliero] }];
    if (liv === 4) return [{ livello: 4, tipo: "scontro", opzioni: [...resto(s.scontro), s.fissi.scontro] }];
    return [];
  }
  /* rigioca le scelte livello per livello: valida se a ogni scelta c'è esattamente un potere tra le opzioni di quel momento.
     scelti: l'elenco piatto (l'ordine non conta tra livelli diversi) oppure { 1: {…}, 3: {…}, 4: {…} } */
  function sceltaValida(classe, spec, scelti, liv) {
    const s = specDi(classe, spec); if (!s) return { ok: false, motivo: "specializzazione" };
    liv = liv || 1;
    const lista = Array.isArray(scelti) ? scelti : Object.keys(scelti || {}).sort().flatMap(l => Object.values(scelti[l]).flat());
    const ammessi = new Set([...s.volonta, ...s.scontro, ...s.giornalieri, s.fissi.scontro, s.fissi.giornaliero]);
    const estranei = lista.filter(id => !ammessi.has(id));
    if (estranei.length) return { ok: false, motivo: "estranei", estranei };
    if (new Set(lista).size !== lista.length) return { ok: false, motivo: "doppione" };
    const presi = [], restano = [...lista];
    for (let l = 1; l <= liv; l++) {
      for (const o of opzioniLivello(classe, spec, presi, l)) {
        const k = restano.findIndex(id => o.opzioni.includes(id));
        if (k < 0) return { ok: false, motivo: "manca", livello: l, tipo: o.tipo, opzioni: o.opzioni };
        presi.push(restano[k]); restano.splice(k, 1);
      }
    }
    if (restano.length) return { ok: false, motivo: "inAnticipo", poteri: restano };
    return { ok: true, scelti: presi };
  }
  /* l'a volontà che arriva da solo al livello 2: quello lasciato in creazione */
  const terzoVolonta = (classe, spec, scelti) => { const s = specDi(classe, spec); return s ? s.volonta.find(id => !(scelti || []).includes(id)) || null : null; };
  /* i poteri che il personaggio ha a un livello: le sue scelte, il terzo a volontà dal 2, il finale e il privilegio attivo al 5 */
  function poteriAlLivello(classe, spec, scelti, liv) {
    const c = SPEC[classe], s = specDi(classe, spec); if (!s) return [];
    const lista = Array.isArray(scelti) ? scelti : Object.values(scelti || {}).flatMap(x => Object.values(x).flat());
    const terzo = liv >= LIV.terzoVolonta ? terzoVolonta(classe, spec, lista) : null;
    return [...lista, ...(terzo ? [terzo] : []), ...(liv >= LIV.finale ? [s.fissi.finale, c.classe.privilegi[5]] : [])];
  }
  /* privilegi passivi (livelli 1 e 3) */
  const trattiAlLivello = (classe, liv) => { const t = (SPEC[classe] && SPEC[classe].classe.privilegi) || {}; return [1, 3].filter(l => l <= liv && TRATTI[t[l]]).map(l => t[l]); };
  /* poteri della via al livello (id) */
  const viaAlLivello = (via, liv) => (VIE[via] ? [2, 3, 4].filter(l => l <= liv).map(l => VIE[via].poteri[l].id) : []);
  /* il livello in cui un potere entra in scelta (1 = creazione) */
  function livelloDi(classe, spec, id) {
    const s = specDi(classe, spec); if (!s) return null;
    if (id === s.fissi.giornaliero) return LIV.terzoGiornaliero;
    if (id === s.fissi.scontro) return LIV.quartoScontro;
    if (id === s.fissi.finale) return LIV.finale;
    if (SPEC[classe] && id === SPEC[classe].classe.privilegi[5]) return LIV.finale;
    return 1;
  }
  const tuttiDi = (s) => [...s.volonta, ...s.scontro, ...s.giornalieri, s.fissi.giornaliero, s.fissi.scontro, s.fissi.finale];
  /* chiave della classe di una specializzazione */
  const classeDi = (spec) => { const k = ALIAS[spec] || spec; return Object.keys(SPEC).find(c => SPEC[c][k]) || null; };

  const API = { POTERI, SPEC, TRATTI, VIE, ALIAS, SCALA, LIV, specDi, classeDi, opzioniLivello, sceltaValida, terzoVolonta, poteriAlLivello, trattiAlLivello, viaAlLivello, tuttiDi, livelloDi };
  root.SPECIALIZZAZIONI = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof window !== "undefined" ? window : globalThis);
