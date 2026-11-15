/* =====================================================================
   NEMICI — i nemici comuni sul motore nuovo: dati, poteri e scelta del potere a ogni turno.
   Blocco 3 (08/11/2026). Contratto: docs/riscrittura_meccaniche.md, sezioni 8a-8c (gruppi 1-4).
   15/11/2026: guardiani (Ettore, Enea, Dafne, Atena, 8d) e sovrano (8e) con fasi, sequenze e annunci.
   Le cacce comuni (gruppo 5, poteri ancora da decidere) restano nemici generici.

   Ogni nemico: salute / CA / attacco / danno (n, dado, bonus); poteri a volontà e per scontro; res (vulnerabilità);
   maledetto (fiamma azzurra). Le statistiche sono quelle approvate; quelle «da misurare» sono segnate.
   ===================================================================== */
(function (root) {
  const P = root.Poteri || (typeof require === "function" ? require("./poteri.js") : null);
  const S = root.Scontro || (typeof require === "function" ? require("./scontro.js") : null);

  /* Poteri dei nemici, descritti con pochi ingredienti:
     attacco: tiro per colpire (soloDado = solo il dado; piuDadi); poi applica / aggrava gli stati elencati (un TS solo per potere)
     soffio: danno senza tiro per colpire (n dadi da dado), poi gli stati
     ts: niente danno, solo lo stato con il suo tiro salvezza (Ululato, Ringhio)
     difesa: un effetto su di sé fino al suo turno (Ceneri sul pelo; ca: +N CA)
     fuga: il nemico scappa (cervo)
     boss: annuncia = si annuncia un turno prima; volte = più attacchi indipendenti; suSe = stati su di sé (Furente);
           mente = danni mentali (li applica chi gestisce lo scontro); serie = colpi ripetuti per più turni */
  const A = (nome, o) => ({ nome, k: "attacco", ...(o || {}) });
  const POTERI = {
    morso: A("Morso"), beccata: A("Beccata"), zannata: A("Zannata"), incornata: A("Incornata"),
    morso_sporco: A("Morso sporco", { soloDado: true, applica: ["intossicato"] }),
    morso_infetto: A("Morso infetto", { aggrava: ["intossicato"] }),
    becco_a_uncino: A("Becco a uncino", { soloDado: true, applica: ["sanguinante"] }),
    picchiata_agli_occhi: A("Picchiata agli occhi", { applica: ["indebolito"] }),
    morso_lacerante: A("Morso lacerante", { soloDado: true, applica: ["sanguinante"] }),
    azzannare: A("Azzannare e trascinare", { aggrava: ["sanguinante"] }),
    spallata: A("Spallata", { soloDado: true, applica: ["indebolito"] }),
    carica: A("Carica", { piuDadi: 1, applica: ["stordito"] }),
    fuga: { nome: "Fuga", k: "fuga" },
    morso_velenoso: A("Morso velenoso", { soloDado: true, applica: ["intossicato"] }),
    veleno_concentrato: A("Veleno concentrato", { aggrava: ["intossicato"] }),
    /* infernali */
    nube_di_cenere: A("Nube di cenere", { soloDado: true, applica: ["indebolito"] }),
    morso_di_cenere_ratto: A("Morso di cenere", { piuDadi: 1, applica: ["esposto"] }),
    becco_ardente: A("Becco ardente", { soloDado: true, applica: ["scottato"] }),
    picchiata_in_fiamme: A("Picchiata in fiamme", { aggrava: ["scottato"] }),
    morso_ardente: A("Morso ardente", { soloDado: true, applica: ["scottato"] }),
    veleno_rovente: A("Veleno rovente", { aggrava: ["scottato"], applica: ["intossicato"] }),
    scrollata_di_cenere: A("Scrollata di cenere", { soloDado: true, applica: ["indebolito"] }),
    carica_di_cenere: A("Carica di cenere", { piuDadi: 1, applica: ["stordito"] }),
    zanne_roventi: A("Zanne roventi", { soloDado: true, applica: ["scottato"] }),
    carica_rovente: A("Carica rovente", { piuDadi: 1, aggrava: ["scottato"] }),
    morso_di_cenere_lupo: A("Morso di cenere", { soloDado: true, applica: ["indebolito"] }),
    ululato: { nome: "Ululato", k: "ts", applica: ["impaurito"] },
    /* mastini */
    presa: A("Presa", { soloDado: true, applica: ["indebolito"] }),
    soffio_infuocato: { nome: "Soffio infuocato", k: "soffio", n: 1, dado: 6, aggrava: ["scottato"] },
    soffio_infuocato_2: { nome: "Soffio infuocato", k: "soffio", n: 2, dado: 6, aggrava: ["scottato"] },
    ceneri_sul_pelo: { nome: "Ceneri sul pelo", k: "difesa", buff: "ceneri" },
    soffio_di_cenere: { nome: "Soffio di cenere", k: "soffio", n: 2, dado: 6, applica: ["indebolito", "scottato"] },
    ringhio_della_soglia: { nome: "Ringhio della soglia", k: "ts", applica: ["impaurito"] },
    spallata_corazzata: A("Spallata corazzata", { soloDado: true, applica: ["indebolito"] }),
    carica_di_ferro: A("Carica di ferro", { piuDadi: 1, applica: ["stordito"], carica: true }),
    /* nemico generico (cacce comuni e avventurieri, finché non hanno i loro poteri): solo l'attacco base */
    attacco_base: A("Attacco"),
    /* attacco semplice dei boss (intervallo tra le fasi): dado dell'arma + bonus, senza stati */
    colpo_semplice: A("Attacco semplice"),

    /* ===== Ettore, bronzo (8d, 10/11/2026): due pugnali ===== */
    pugnalata: A("Pugnalata", { applica: ["sanguinante"] }),
    doppio_pugnale: A("Doppio pugnale", { volte: 2 }),
    lho_gia_vista: { nome: "«L'ho già vista»", k: "difesa", buff: "schiva", soglia: 17 },
    lama_nel_fianco: A("Lama nel fianco", { piuDadi: 1, aggrava: ["sanguinante"], annuncia: true }),
    undici: { nome: "«Undici. Come le mie cacce.»", k: "ts", applica: ["impaurito"], annuncia: true },
    alla_dodicesima: { nome: "«Alla dodicesima, la preda sono io.»", k: "serie", turni: 3, colpo: "pugnalata", annuncia: true },
    dodicesima_colpo: { nome: "«Alla dodicesima»", k: "serie", colpo: "pugnalata" },

    /* ===== Enea, argento (8d): ascia sopra il 50%, maglio sotto ===== */
    colpo_d_ascia: A("Colpo d'ascia", { applica: ["sanguinante"], tipo: "taglio" }),
    squarcio: A("Squarcio", { piuDadi: 1, aggrava: ["sanguinante"], tipo: "taglio", annuncia: true }),
    mietitura_del_becchino: A("Mietitura del becchino", { piuDadi: 2, tipo: "taglio", annuncia: true }),
    colpo_del_maglio: A("Colpo del maglio", { applica: ["stordito"], tipo: "contundente" }),
    frantumaossa: A("Frantumaossa", { piuDadi: 1, aggrava: ["stordito"], tipo: "contundente", annuncia: true }),
    furia_del_becchino: A("Furia del becchino", { piuDadi: 2, tipo: "contundente", annuncia: true }),
    guardia_del_becchino: { nome: "Guardia del becchino", k: "difesa", buff: "guardiaBoss", ca: 2 },

    /* ===== Dafne, oro (8d): arco nascosta, stacco con il mastino, stocco in mischia ===== */
    tiro_dell_arco: A("Tiro dell'arco", { applica: ["esposto"], tipo: "perforante" }),
    preda_segnata: A("Preda segnata", { piuDadi: 1, aggrava: ["esposto"], tipo: "perforante", annuncia: true }),
    pioggia_di_frecce: A("Pioggia di frecce", { piuDadi: 2, tipo: "perforante", annuncia: true, giornaliero: "pioggia" }),
    stoccata_avvelenata: A("Stoccata avvelenata", { applica: ["intossicato"], tipo: "veleno" }),
    veleno_del_drow: A("Veleno del drow", { piuDadi: 1, aggrava: ["intossicato"], tipo: "veleno", annuncia: true }),
    pioggia_di_stoccate: A("Pioggia di stoccate", { piuDadi: 2, tipo: "perforante", annuncia: true, giornaliero: "pioggia" }),
    scatto_tra_i_pini: { nome: "Scatto tra i pini", k: "difesa", buff: "guardiaBoss", ca: 3 },

    /* ===== Atena, platino (8d): falce, gelo, ombra ===== */
    colpo_di_falce: A("Colpo di falce", { applica: ["sanguinante"], tipo: "taglio" }),
    mietitura: A("Mietitura", { piuDadi: 1, aggrava: ["sanguinante"], tipo: "taglio", annuncia: true }),
    falce_dell_angelo: A("Falce dell'angelo", { piuDadi: 2, tipo: "taglio", annuncia: true }),
    soffio_di_gelo: A("Soffio di gelo", { applica: ["gelo"], tipo: "ghiaccio" }),
    morsa_di_ghiaccio: A("Morsa di ghiaccio", { piuDadi: 1, aggrava: ["gelo"], congela: true, tipo: "ghiaccio", annuncia: true }),
    tempesta: A("Tempesta", { piuDadi: 2, tipo: "ghiaccio", annuncia: true }),
    tocco_d_ombra: A("Tocco d'ombra", { applica: ["impaurito"], tipo: "ombra" }),
    velo_del_vuoto: A("Velo del vuoto", { piuDadi: 1, applica: ["impaurito"], mente: 4, tipo: "ombra", annuncia: true }),
    calata_della_notte: A("Calata della notte", { piuDadi: 2, tipo: "ombra", annuncia: true }),
    difesa_di_atena: { nome: "Ali chiuse", k: "difesa", buff: "guardiaBoss", ca: 3 },

    /* ===== Il sovrano (8e): ascia bipenne, solo taglio; dadi 1 / 1 / 2 ===== */
    fendente_di_rabbia: A("Fendente di rabbia", { applica: ["sanguinante"], tipo: "taglio" }),
    collera_del_re: A("Collera del re", { aggrava: ["sanguinante"], suSe: ["furente"], tipo: "taglio", annuncia: true }),
    scure_della_collera: A("Scure della collera", { piuDadi: 1, aggrava: ["sanguinante"], tipo: "taglio", annuncia: true }),
    colpo_maledetto: A("Colpo maledetto", { applica: ["maledizione"], tipo: "taglio" }),
    sentenza_maledetta: A("Sentenza maledetta", { aggrava: ["maledizione"], tipo: "taglio", annuncia: true }),
    giudizio_della_casa: A("Giudizio della Casa", { piuDadi: 1, aggrava: ["maledizione"], tipo: "taglio", annuncia: true }),
    colpo_di_vuoto: A("Colpo di vuoto", { applica: ["vuoto"], tipo: "taglio" }),
    vuoto_che_divora: A("Vuoto che divora", { aggrava: ["vuoto"], tipo: "taglio", annuncia: true }),
    scure_del_vuoto: A("Scure del vuoto", { piuDadi: 1, aggrava: ["vuoto"], tipo: "taglio", annuncia: true }),
    colpo_senza_armatura: A("Colpo senza armatura", { tipo: "taglio" }),
    difesa_del_re: { nome: "Il re si copre", k: "difesa", buff: "guardiaBoss", ca: 3 }
  };

  const CENERE = { fuoco: "res", contundente: "vuln" }, BRACE = { fuoco: "res", perforante: "vuln" };
  const MASTINO = { fuoco: "imm", fuoco_sacro: "vuln" };
  /* salute, CA, attacco, danno [n, dado, bonus]; volonta: [attacco base, stato, (terzo)]; scontro: [per scontro] */
  const N = (o) => o;
  const NEMICI = {
    /* gruppo 1, animali normali: neutri a tutto */
    ratto: N({ nome: "Ratto", liv: 1, pv: 5, ca: 10, att: 0, danno: [1, 3, 0], volonta: ["morso", "morso_sporco"], scontro: ["morso_infetto"] }),
    corvo: N({ nome: "Corvo", liv: 1, pv: 4, ca: 12, att: 1, danno: [1, 3, 0], volonta: ["beccata", "becco_a_uncino"], scontro: ["picchiata_agli_occhi"] }),
    lupo: N({ nome: "Lupo", liv: 1, pv: 10, ca: 12, att: 2, danno: [1, 6, 0], volonta: ["morso", "morso_lacerante"], scontro: ["azzannare"] }),
    cinghiale: N({ nome: "Cinghiale", liv: 1, pv: 12, ca: 11, att: 2, danno: [1, 6, 1], volonta: ["zannata", "spallata"], scontro: ["carica"] }),
    cervo: N({ nome: "Cervo", liv: 1, pv: 9, ca: 11, att: 0, danno: [1, 4, 0], volonta: ["incornata"], scontro: [], fuggeAlTurno: 2 }), /* come oggi in gioco.html */
    vipera: N({ nome: "Vipera", liv: 1, pv: 5, ca: 13, att: 3, danno: [1, 3, 0], volonta: ["morso", "morso_velenoso"], scontro: ["veleno_concentrato"] }),
    /* gruppo 2, infernali (maledetti): Cenere e Brace */
    ratto_di_cenere: N({ nome: "Ratto di cenere", liv: 1, pv: 8, ca: 10, att: 1, danno: [1, 4, 1], volonta: ["morso", "nube_di_cenere"], scontro: ["morso_di_cenere_ratto"], res: CENERE, resStati: { sanguinante: "res" }, maledetto: true }),
    corvo_di_brace: N({ nome: "Corvo di brace", liv: 1, pv: 8, ca: 11, att: 2, danno: [1, 4, 1], volonta: ["beccata", "becco_ardente"], scontro: ["picchiata_in_fiamme"], res: BRACE, maledetto: true }),
    vipera_di_brace: N({ nome: "Vipera di brace", liv: 1, pv: 8, ca: 13, att: 3, danno: [1, 4, 1], volonta: ["morso", "morso_ardente"], scontro: ["veleno_rovente"], res: BRACE, maledetto: true }),
    cervo_di_cenere: N({ nome: "Cervo di cenere", liv: 1, pv: 12, ca: 11, att: 2, danno: [1, 6, 0], volonta: ["incornata", "scrollata_di_cenere"], scontro: ["carica_di_cenere"], res: CENERE, resStati: { sanguinante: "res" }, maledetto: true }),
    cinghiale_di_brace: N({ nome: "Cinghiale di brace", liv: 2, pv: 14, ca: 11, att: 2, danno: [1, 6, 1], volonta: ["zannata", "zanne_roventi"], scontro: ["carica_rovente"], res: BRACE, maledetto: true }),
    lupo_di_cenere: N({ nome: "Lupo di cenere", liv: 2, pv: 14, ca: 12, att: 3, danno: [1, 6, 1], volonta: ["morso", "morso_di_cenere_lupo"], scontro: ["ululato"], res: CENERE, resStati: { sanguinante: "res" }, maledetto: true }),
    /* gruppo 3, mastini (maledetti, dentro casa): fuoco comune ⛔, fuoco sacro ✓ */
    mastino: N({ nome: "Mastino", liv: 1, pv: 13, ca: 10, att: 2, danno: [1, 4, 1], volonta: ["morso", "presa"], scontro: ["soffio_infuocato"], res: MASTINO, maledetto: true }),
    mastino_secondo_piano: N({ nome: "Mastino del secondo piano", liv: 2, pv: 18, ca: 11, att: 3, danno: [1, 6, 1], volonta: ["morso", "presa"], scontro: ["soffio_infuocato_2"], res: MASTINO, maledetto: true, daMisurare: "statistiche proposte" }),
    /* gruppo 4, élite: annunciano i poteri per scontro un turno prima */
    /* mastino infernale base evocato dal corno di Dafne: senza Soffio, sparisce in cenere dopo 3 turni */
    mastino_di_dafne: N({ nome: "Mastino infernale", liv: 1, pv: 13, ca: 10, att: 2, danno: [1, 4, 1], volonta: ["morso", "presa"], scontro: [], res: MASTINO, maledetto: true, sparisceDopo: 3 }),
    mastino_della_soglia: N({ nome: "Mastino della soglia di Adele", liv: 4, pv: 30, ca: 13, att: 5, danno: [1, 6, 2], volonta: ["morso", "presa", "ceneri_sul_pelo"],
      scontro: ["soffio_di_cenere", "ringhio_della_soglia"], res: { ...MASTINO, psichico: "vuln" }, maledetto: true, elite: true, daMisurare: "statistiche stimate (10-20% di sconfitte)" }),
    mastino_corazzato: N({ nome: "Mastino corazzato", liv: 5, pv: 40, ca: 15, caVacillante: 13, att: 6, danno: [1, 8, 3], volonta: ["morso", "presa", "spallata_corazzata"],
      scontro: ["soffio_infuocato_2", "carica_di_ferro"], res: { ...MASTINO, taglio: "res", perforante: "vuln" }, maledetto: true, elite: true, rune: true, daMisurare: "statistiche stimate (10-20% di sconfitte)" })
  };

  /* ===================== GUARDIANI E SOVRANO (8d, 8e; statistiche «da misurare») =====================
     Ogni fase: sequenza (a volontà → per scontro → giornaliero: il giornaliero esce solo dopo gli altri due), poi un ciclo che si ripete.
     I poteri con «annuncia» si annunciano un turno prima. Cambio di fase in qualunque punto: i poteri non usati della fase si perdono, tranne il colpo già annunciato (15/11);
     nessuna fase saltata: ogni fase gioca tutta la sua sequenza prima della successiva (15/11, opzione B);
     intervallo = difesa e attacco semplice (Enea, Atena, sovrano). fase(n) → indice della fase, dalla salute (Dafne: dagli eventi). */
  /* 15/11/2026: salute +25% circa, CA +1 a Dafne e Atena (misure con il cervello del giocatore automatico) */
  const BOSS = {
    ettore: { nome: "Ettore", liv: 2, pv: 42, ca: 12, att: 4, danno: [1, 4, 2], /* +3 e 1d4 + 1, più il +1 dei pugnali (ASSUNZIONE: vale per colpire e per i danni) */
      mod: { Vigore: 0, "Agilità": 3, Mente: 2, Spirito: -1 }, res: { taglio: "vuln", psichico: "vuln", veleno: "vuln" }, conteggio: true, risparmio: true,
      fase: (n) => (n.pv > n.pvMax / 2 ? 0 : 1),
      fasi: [
        { nome: "La caccia", sequenza: ["pugnalata", "lama_nel_fianco", "lho_gia_vista", "doppio_pugnale"], ciclo: ["pugnalata", "lho_gia_vista", "doppio_pugnale"], riempitivo: "pugnalata" },
        { nome: "La dodicesima", sequenza: ["undici", "alla_dodicesima"], ciclo: ["pugnalata", "lho_gia_vista", "doppio_pugnale"], riempitivo: "pugnalata" }
      ] },
    enea: { nome: "Enea", liv: 3, pv: 62, ca: 13, att: 6, danno: [1, 8, 2], mod: { Vigore: 2, "Agilità": 0, Mente: 0, Spirito: 1 },
      res: { contundente: "vuln", sangue: "vuln", fuoco_sacro: "vuln", taglio: "res", ossa: "res" }, rialzo: 1, risparmio: true,
      fase: (n) => (n.pv > n.pvMax / 2 ? 0 : 1),
      intervallo: ["guardia_del_becchino", "colpo_semplice"],
      fasi: [
        { nome: "L'ascia", arma: "taglio", sequenza: ["colpo_d_ascia", "squarcio", "mietitura_del_becchino", "guardia_del_becchino", "colpo_semplice"], ciclo: ["colpo_d_ascia", "guardia_del_becchino", "colpo_semplice"], riempitivo: "colpo_d_ascia" },
        { nome: "Il maglio", arma: "contundente", sequenza: ["colpo_del_maglio", "frantumaossa", "furia_del_becchino", "guardia_del_becchino", "colpo_semplice"], ciclo: ["colpo_del_maglio", "guardia_del_becchino", "colpo_semplice"], riempitivo: "colpo_del_maglio" }
      ] },
    dafne: { nome: "Dafne", liv: 4, pv: 72, ca: 15, att: 8, danno: [1, 8, 3], mod: { Vigore: 1, "Agilità": 4, Mente: 1, Spirito: 0 },
      res: { perforante: "vuln", psichico: "vuln", ossa: "vuln", veleno: "res", contundente: "res" }, risparmio: false, /* 15/11, Francesco: Dafne non si ritira, va uccisa */
      fase: (n) => n.faseDafne || 0, /* 0 nascosta (arco), 1 stacco (corno e mastino), 2 mischia (stocco) */
      fasi: [
        { nome: "Nascosta tra i pini", nascosta: true, sequenza: ["tiro_dell_arco", "preda_segnata", "pioggia_di_frecce"], ciclo: [], riempitivo: "tiro_dell_arco" },
        { nome: "Lo stacco", stacco: true, sequenza: [], ciclo: [] },
        { nome: "Lo stocco", sequenza: ["scatto_tra_i_pini", "stoccata_avvelenata", "veleno_del_drow", "pioggia_di_stoccate"], ciclo: ["stoccata_avvelenata", "scatto_tra_i_pini"], riempitivo: "stoccata_avvelenata" }
      ] },
    atena: { nome: "Atena", liv: 5, pv: 105, ca: 16, att: 10, danno: [1, 10, 4], mod: { Vigore: 2, "Agilità": 1, Mente: 1, Spirito: 4 },
      res: { perforante: "vuln", fuoco_sacro: "vuln", taglio: "res", ghiaccio: "res" }, /* 15/11: niente più vulnerabilità a sangue e veleno né resistenza al psichico */
      fase: (n) => (n.pv > n.pvMax * 2 / 3 ? 0 : n.pv > n.pvMax / 3 ? 1 : 2),
      intervallo: ["difesa_di_atena", "colpo_semplice"],
      fasi: [
        { nome: "La falce", sequenza: ["colpo_di_falce", "mietitura", "falce_dell_angelo"], ciclo: ["colpo_di_falce", "difesa_di_atena", "colpo_semplice"], riempitivo: "colpo_di_falce" },
        { nome: "Il gelo", sequenza: ["soffio_di_gelo", "morsa_di_ghiaccio", "tempesta"], ciclo: ["soffio_di_gelo", "difesa_di_atena", "colpo_semplice"], riempitivo: "soffio_di_gelo" },
        { nome: "L'ombra", sequenza: ["tocco_d_ombra", "velo_del_vuoto", "calata_della_notte"], ciclo: ["tocco_d_ombra", "difesa_di_atena", "colpo_semplice"], riempitivo: "tocco_d_ombra" }
      ] },
    /* due barre in una: cenere 55 PF (fasi 1-3) + carne 30 PF; il danno in eccesso della cenere passa alla carne */
    sovrano: { nome: "Il sovrano", liv: 6, pv: 110, ca: 16, att: 10, danno: [1, 12, 4], mod: { Vigore: 3, "Agilità": 0, Mente: 1, Spirito: 3 },
      cenere: 70, carne: 40, /* 15/11: cenere da 70 a 55 (con l'opzione B gioca tutte e tre le fasi) */
      fase: (n) => { const c = n.pv - 40; return c > 47 ? 0 : c > 23 ? 1 : c > 0 ? 2 : 3; },
      intervallo: ["difesa_del_re", "colpo_semplice"],
      fasi: [
        { nome: "Rabbia (armatura integra)", ca: 16, res: "cenere", immuni: ["sanguinante"], statiCorti: true,
          sequenza: ["fendente_di_rabbia", "collera_del_re", "scure_della_collera"], ciclo: ["fendente_di_rabbia", "difesa_del_re", "colpo_semplice"], riempitivo: "fendente_di_rabbia" },
        { nome: "Maledetto (armatura incrinata)", ca: 15, res: "cenere", immuni: ["sanguinante"],
          sequenza: ["colpo_maledetto", "sentenza_maledetta", "giudizio_della_casa"], ciclo: ["colpo_maledetto", "difesa_del_re", "colpo_semplice"], riempitivo: "colpo_maledetto" },
        { nome: "Vuoto (armatura caduta)", ca: 14, res: "cenere",
          sequenza: ["colpo_di_vuoto", "vuoto_che_divora", "scure_del_vuoto"], ciclo: ["colpo_di_vuoto", "difesa_del_re", "colpo_semplice"], riempitivo: "colpo_di_vuoto" },
        { nome: "La carne", ca: 13, res: "carne", sequenza: [], ciclo: ["colpo_senza_armatura"] }
      ],
      mappe: { /* forza: ancora da assegnare (neutra) */
        cenere: { taglio: "res", contundente: "vuln", perforante: "res", sangue: "imm", psichico: "imm", fuoco_sacro: "vuln", ossa: "res", veleno: "res" }, /* mappa originale; la aprono le clausole del set di cenere (clausoleCenere) */
        carne: { taglio: "vuln", sangue: "vuln", veleno: "vuln", psichico: "res" } } }
  };

  /* un guardiano o il sovrano pronto per lo scontro. o.liv: il livello (sempre uno sopra il giocatore ai livelli alti) */
  /* Clausole nascoste del set del sovrano di cenere sulla sua cenere (storia_retaggio_e_set 7c, 10/11; ripristinate il 15/11):
     2 pezzi: sangue e psichico da immuni a resistenti; 4: taglio, perforante e ossa da resistenti a neutri; 5: armatura azzerata (danno pieno) */
  function clausoleCenere(m, pezzi) {
    const r = { ...m };
    if (pezzi >= 2) { for (const k of ["sangue", "psichico"]) if (r[k] === "imm") r[k] = "res"; }
    if (pezzi >= 4) { for (const k of ["taglio", "perforante", "ossa"]) if (r[k] === "res") delete r[k]; }
    if (pezzi >= 5) { for (const k of Object.keys(r)) if (r[k] !== "vuln") delete r[k]; }
    return r;
  }
  function creaBoss(id, o) {
    const d = BOSS[id]; o = o || {};
    const n = S.preparaScontro({
      id, nome: d.nome, liv: d.liv, pv: d.pv, pvMax: d.pv, caBase: d.ca, modAtt: d.att, modDanno: d.danno[2], modClasse: d.att,
      arma: { n: d.danno[0], dado: d.danno[1], tipo: null }, mod: { ...d.mod }, res: { ...(d.res || {}) }, maledetto: true, boss: true,
      volonta: [], scontro: [], elite: false, fuggeAlTurno: 0, rune: false, turno: 0, stati: {}, buff: {},
      guardiano: true, fase: -1, coda: [], rialzo: d.rialzo || 0, conteggio: 0, ...o
    });
    if (id === "dafne") { n.faseDafne = o.scovata ? 2 : 0; if (o.scovata) n.buff.scovata = { ca: -2, turni: 1 }; } /* Furtività riuscita: salta nascosta e stacco, −2 CA nel primo turno */
    entraInFase(n, true);
    return n;
  }
  const defDi = (n) => BOSS[n.id];
  const faseCorrente = (n) => defDi(n).fasi[n.fase];
  /* entrare in una fase: proprietà (CA, mappa, immunità, armatura integra), coda della sequenza; i poteri non usati si perdono */
  function entraInFase(n, inizio) {
    const d = defDi(n); let f = d.fase(n); if (f === n.fase) return [];
    /* 15/11, Francesco: nessuna fase saltata. Anche dopo un danno enorme si entra solo nella fase successiva (il danno resta tutto)
       e da una fase si esce solo dopo averne giocato tutta la sequenza (n.recupero), anche dopo due colpi forti di fila: ogni fase mostra
       i suoi colpi. Il boss può morire in qualunque fase. Dafne passa di fase per eventi: non c'entra. */
    if (!inizio && n.id !== "dafne" && f > n.fase + 1) f = n.fase + 1;
    n.recupero = n.id !== "dafne"; /* opzione B (15/11): da ogni fase si esce solo dopo averne giocato tutta la sequenza */
    const prima = n.fase; n.fase = f; const F = d.fasi[f];
    /* 15/11: un colpo già annunciato non si perde al cambio di fase: arriva per primo (Dafne esclusa: nascosta e stacco) */
    const tenuto = !inizio && n.id !== "dafne" && n.pronto && POTERI[n.pronto] ? n.pronto : null;
    n.pronto = tenuto;
    if (F.ca != null) n.caBase = F.ca;
    if (F.res && d.mappe) n.res = F.res === "cenere" ? clausoleCenere(d.mappe.cenere, n.setCenere || 0) : { ...d.mappe[F.res] };
    n.immuni = [...(F.immuni || [])]; if (F.immuni) F.immuni.forEach(k => { if (n.stati[k]) delete n.stati[k]; });
    n.statiCorti = !!F.statiCorti;
    n.intoccabile = !!(F.nascosta || F.stacco); n.nascosta = !!F.nascosta;
    if (F.arma) n.arma.tipo = F.arma;
    n.coda = [...(tenuto ? [tenuto] : []), ...(!inizio && d.intervallo && F.sequenza.length ? d.intervallo : []), ...F.sequenza];
    return inizio ? [] : [{ k: "faseBoss", chi: n.nome, da: prima, a: f, nome: F.nome }];
  }
  /* Dafne: trovata (Percezione CD 12, un tentativo a turno) o finita la serie a distanza → stacco; dopo lo stacco → mischia */
  function cercaDafne(n, bonus, ctx) {
    if (n.id !== "dafne" || n.faseDafne !== 0) return [{ k: "nonNascosta" }];
    const d = ctx.tira(20), tot = d + (bonus || 0), ok = tot >= 12;
    const E = [{ k: "cerca", d, tot, cd: 12, ok }];
    if (ok) { n.faseDafne = 1; E.push(...entraInFase(n), { k: "evoca", chi: n.nome, id: "mastino_di_dafne", turni: 3 }); }
    return E;
  }
  /* fine dello stacco: il mastino è caduto o sono passati 3 turni; Dafne si è riposata (+1 salute a turno) */
  function fineStacco(n, turni) {
    if (n.id !== "dafne" || n.faseDafne !== 1) return [];
    const prima = n.pv; n.pv = Math.min(n.pvMax, n.pv + (turni || 0));
    n.faseDafne = 2; return [{ k: "cura", chi: n.nome, n: n.pv - prima }, ...entraInFase(n)];
  }
  /* il turno di un boss: fase, annuncio un turno prima, poi la mossa della coda (o del ciclo) */
  function agisciBoss(n, pg, ctx) {
    /* sequenza della fase non finita: niente cambio di fase */
    const E = [...(n.recupero && n.coda.length ? [] : entraInFase(n))], d = defDi(n);
    let F = faseCorrente(n);
    if (F.stacco) return { eventi: [...E, { k: "stacco", chi: n.nome }] };
    if (!P.puoAgire(n)) return { eventi: [...E, { k: "perdeAzione", chi: n.nome }] };
    const libero = !P.soloAVolonta(n) && !(n.nonCarica > 0);
    if (!n.coda.length) {
      if (n.id === "dafne" && n.faseDafne === 0) { n.faseDafne = 1; E.push(...entraInFase(n), { k: "escoAlloScoperto", chi: n.nome }, { k: "evoca", chi: n.nome, id: "mastino_di_dafne", turni: 3 }); return { eventi: E }; }
      n.coda = [...F.ciclo]; n.recupero = false; /* sequenza finita: ora la fase può cambiare */
    }
    n.annunciati = n.annunciati || {};
    const salta = (x) => x && ((POTERI[x].giornaliero && n.usati.giorno[POTERI[x].giornaliero]) /* Pioggia di frecce = di stoccate: un solo giornaliero */
      || (POTERI[x].annuncia && n.annunciati[x] && n.pronto !== x)); /* annunciato e spezzato (Spezza-carica, Silenzio della casa): perso */
    while (salta(n.coda[0])) n.coda.shift();
    if (!n.coda.length) { n.coda = [...F.ciclo]; n.recupero = false; }
    const id = n.coda[0], p = POTERI[id];
    const annuncia = (x) => { n.pronto = x; n.annunciati[x] = true; E.push({ k: "annuncio", chi: n.nome, potere: x, nome: POTERI[x].nome, icona: "carica" }); };
    let mossa = id;
    if (p.annuncia && n.pronto !== id) {
      /* il colpo forte non era annunciato: questo turno fa il riempitivo e lo annuncia; se non può caricare (Impaurito, Silenzio) il colpo salta */
      mossa = F.riempitivo || "colpo_semplice";
      if (libero) annuncia(id); else n.coda.shift();
    } else {
      n.coda.shift(); if (n.pronto === id) n.pronto = null;
      if (p.annuncia && !libero) mossa = F.riempitivo || "colpo_semplice";
      const prox = n.coda[0];
      if (prox && POTERI[prox].annuncia && libero && !salta(prox)) annuncia(prox); /* annuncio del prossimo colpo forte */
    }
    n.ultimo = mossa;
    E.push(...esegui(n, pg, mossa, ctx));
    return { eventi: E, scelta: { id: mossa } };
  }
  /* il numero di Ettore: ogni attacco ha la sua frase; dopo cinque ricomincia */
  function conta(n) { if (!defDi(n) || !defDi(n).conteggio) return []; n.conteggio = (n.conteggio % 5) + 1; return [{ k: "conteggio", chi: n.nome, n: n.conteggio }]; }

  /* un nemico pronto per lo scontro. ASSUNZIONI: caratteristiche a +0 (TS = d20 + livello); la CD dei suoi stati è 8 + attacco + livello */
  function crea(id, o) {
    if (BOSS[id]) return creaBoss(id, o);
    const d = NEMICI[id]; if (!d) throw new Error("nemico sconosciuto: " + id);
    return S.preparaScontro(Object.assign({
      id, nome: d.nome, liv: d.liv, pv: d.pv, pvMax: d.pv, caBase: d.ca, caVacillante: d.caVacillante, modAtt: d.att, modDanno: d.danno[2], modClasse: d.att,
      arma: { n: d.danno[0], dado: d.danno[1], tipo: null }, mod: {}, res: d.res || {}, resStati: d.resStati, maledetto: !!d.maledetto, boss: !!d.boss,
      volonta: d.volonta, scontro: d.scontro, elite: !!d.elite, fuggeAlTurno: d.fuggeAlTurno || 0,
      rune: !!d.rune, turno: 0, stati: {}, buff: {}
    }, o || {}));
  }

  /* nemico generico dalle statistiche del gioco (cacce comuni, avventurieri): solo l'attacco base, nessuno stato */
  function creaGenerico(o) {
    return S.preparaScontro({
      id: o.id || "generico", nome: o.nome || "Nemico", liv: o.liv || 1, pv: o.pv, pvMax: o.pv, caBase: o.ca || 10, modAtt: o.att || 0, modDanno: (o.danno && o.danno[2]) || 0, modClasse: o.att || 0,
      arma: { n: (o.danno && o.danno[0]) || 1, dado: (o.danno && o.danno[1]) || 4, tipo: null }, mod: {}, res: o.res || {}, maledetto: !!o.maledetto, boss: !!o.boss,
      volonta: ["attacco_base"], scontro: [], elite: false, fuggeAlTurno: 0, rune: false, turno: 0, stati: {}, buff: {}, generico: true
    });
  }
  /* lo stato principale che il nemico cerca di mettere (quello del suo secondo a volontà) */
  const statoFirma = (n) => { const p = POTERI[n.volonta[1]]; return p && (p.applica || p.aggrava || [])[0]; };
  const usato = (n, id) => !!(n.usati && n.usati.scontro[id]);

  /* Scelta del potere (8c): primo turno lo stato; poi il per scontro quando lo stato è attivo; poi alternano gli a volontà.
     Gli élite annunciano il per scontro un turno prima (la runa pulsa) e quel turno attaccano con un a volontà.
     Impaurito: solo a volontà. Caccia al ferito / Silenzio della casa (nonCarica): niente per scontro né annunci. */
  function scegli(n, pg) {
    const t = n.turno;
    if (n.fuggeAlTurno && t >= n.fuggeAlTurno) return { id: "fuga" };
    const libero = !P.soloAVolonta(n) && !(n.nonCarica > 0);
    if (n.pronto && libero) return { id: n.pronto, eseguiAnnunciato: true };
    const sf = statoFirma(n);
    const disponibili = n.scontro.filter(id => !usato(n, id));
    const alterna = () => n.volonta[(t - 1) % n.volonta.length];
    if (t === 1 && n.volonta[1]) return { id: n.volonta[1] };
    if (libero && disponibili.length) {
      const attivo = !sf || P.ha(pg, sf) || n.elite;
      if (attivo) return n.elite ? { id: alterna(), annuncia: disponibili[0] } : { id: disponibili[0] };
    }
    return { id: alterna() };
  }

  /* il turno del nemico: sceglie, annuncia, esegue. Chi gestisce lo scontro chiama prima Scontro.inizioTurno(n, pg, ctx) */
  function agisci(n, pg, ctx) {
    S.preparaScontro(n);
    n.turno = (n.turno || 0) + 1;
    if (n.guardiano) return agisciBoss(n, pg, ctx);
    if (n.sparisceDopo && n.turno > n.sparisceDopo) { n.fuggito = true; return { eventi: [{ k: "sparisce", chi: n.nome }] }; }
    if (!P.puoAgire(n)) return { eventi: [{ k: "perdeAzione", chi: n.nome }] };
    const sc = scegli(n, pg), E = [];
    if (sc.annuncia) { n.pronto = sc.annuncia; n.usati.scontro[sc.annuncia] = true; E.push({ k: "annuncio", chi: n.nome, potere: sc.annuncia, nome: POTERI[sc.annuncia].nome }); }
    if (sc.eseguiAnnunciato) n.pronto = null;
    n.ultimo = sc.id;
    E.push(...esegui(n, pg, sc.id, ctx));
    return { eventi: E, scelta: sc };
  }

  /* 15/11: icone delle mosse nemiche — spada (attacco), spada che vibra (colpo caricato o annunciato), scudo (difesa) */
  function iconaDi(id) {
    const p = POTERI[id]; if (!p) return null;
    if (p.k === "difesa") return "difesa";
    if (p.annuncia || p.carica) return "carica";
    return ["attacco", "serie", "soffio"].includes(p.k) ? "attacco" : null;
  }
  function esegui(n, pg, id, ctx) {
    const p = POTERI[id]; if (!p) throw new Error("potere sconosciuto: " + id);
    const E = [{ k: "poterNemico", chi: n.nome, id, nome: p.nome, icona: iconaDi(id) }];
    if (n.scontro.includes(id)) {
      n.usati.scontro[id] = true;
      if (n.rune) E.push({ k: "runaSpenta", potere: id });
    }
    if (p.giornaliero) n.usati.giorno[p.giornaliero] = true;
    const esito = {}, stati = () => {
      (p.aggrava || []).forEach(k => { if (pg.pv > 0) E.push(...S.statoSu(n, pg, "aggrava", ctx, k, esito)); });
      (p.applica || []).forEach(k => { if (pg.pv > 0) E.push(...S.statoSu(n, pg, "applica", ctx, k, esito)); });
    };
    switch (p.k) {
      case "attacco": {
        for (let i = 0; i < (p.volte || 1) && pg.pv > 0 && n.pv > 0; i++) {
          E.push(...conta(n));
          const r = S.attacco(n, pg, { nome: id, soloDado: p.soloDado, piuDadi: p.piuDadi, carica: p.carica || !!p.annuncia, tipo: p.tipo }, ctx); E.push(...r.eventi);
          if (r.ok && !r.annullato) {
            stati();
            if (p.congela && pg.pv > 0 && P.grave(pg, "gelo")) E.push(...P.applica(pg, "stordito", { fonte: S.fonteDi(n), tira: ctx.tira, nome: "Congelato" })); /* Congelato = Stordito, TS Vigore */
            if (p.mente) { const x = ctx.tira(p.mente); E.push({ k: "dannoMentale", chi: pg.nome, n: x }); pg.dannoMentale = (pg.dannoMentale || 0) + x; }
          }
        }
        (p.suSe || []).forEach(k => E.push(...P.applica(n, k, { senzaTs: true })));
        break;
      }
      case "serie": { /* Alla dodicesima: per 3 turni due Pugnalate a turno, il secondo colpo aggrava */
        if (p.turni) for (let i = 1; i < p.turni; i++) n.coda.splice(1 + (i - 1), 0, "dodicesima_colpo");
        const c = POTERI[p.colpo];
        for (let i = 0; i < 2 && pg.pv > 0 && n.pv > 0; i++) {
          E.push(...conta(n));
          const r = S.attacco(n, pg, { nome: p.colpo }, ctx); E.push(...r.eventi);
          if (r.ok && !r.annullato && pg.pv > 0) E.push(...S.statoSu(n, pg, i === 0 ? "applica" : "aggrava", ctx, c.applica[0]));
        }
        break;
      }
      case "soffio": {
        const t = Array.from({ length: p.n }, () => ctx.tira(p.dado)), e = { k: "soffio", tiri: t };
        E.push(e, ...S.danneggia(pg, t.reduce((a, x) => a + x, 0), "fuoco", e, ctx)); stati(); break;
      }
      case "ts": stati(); break;
      case "difesa": n.buff[p.buff] = { finoAlTurno: true, ...(p.ca ? { ca: p.ca } : {}), ...(p.soglia ? { soglia: p.soglia } : {}) }; E.push({ k: "buff", id: p.buff, chi: n.nome, ...(p.ca ? { ca: p.ca } : {}) }); break;
      case "fuga": n.fuggito = true; E.push({ k: "fuga", chi: n.nome }); break;
    }
    return E;
  }

  /* rune del mastino corazzato, per la scheda: due per i poteri per scontro, la terza (petto) si spegne da Vacillante; pulsa = sta per scattare */
  function statoRune(n) {
    if (!n.rune) return null;
    /* accesa finché il potere non è usato; annunciato = accesa e pulsa veloce; spezzato (Spezza-carica) = spenta */
    return [...n.scontro.map(id => ({ potere: id, accesa: !usato(n, id) || n.pronto === id, pulsaVeloce: n.pronto === id })),
      { potere: "armatura", accesa: !P.vacillante(n), pulsaVeloce: false }];
  }

  /* Descrizione di un potere ricavata dai dati (stessa fonte del codice: non può andare fuori sincrono).
     n = il nemico creato (per i numeri veri: attacco, danno, CD); senza n la descrizione resta generica. */
  const ATTR_TS = (k) => (P.STATI[k] || {}).ts || "Vigore";
  function descrivi(id, n) {
    const p = POTERI[id]; if (!p) return "";
    const cd = n ? `CD ${P.cd({ liv: n.liv, modClasse: n.modClasse })}` : "CD del nemico";
    const dado = n ? `${n.arma.n}d${n.arma.dado}` : "il suo dado";
    const parti = [];
    if (p.k === "attacco") {
      const nd = p.piuDadi ? (n ? `${n.arma.n + p.piuDadi}d${n.arma.dado}` : "un dado in più") : dado;
      parti.push(`Attacco (d20 ${n ? "+ " + n.modAtt : ""} contro la tua CA): ${nd}${p.soloDado ? " (solo il dado)" : n && n.modDanno ? " + " + n.modDanno : ""}.`);
    }
    if (p.k === "soffio") parti.push(`Senza tiro per colpire: ${p.n}d${p.dado} di fuoco.`);
    if (p.k === "ts") parti.push("Nessun danno.");
    if (p.k === "difesa") parti.push("Fino al suo prossimo turno, chi lo colpisce in mischia diventa Scottato (tuo TS Agilità). Gli incantesimi con il focus no.");
    if (p.k === "fuga") parti.push("Scappa: lo scontro finisce senza vincitore.");
    const se = p.k === "attacco" ? "Se colpisce, " : "";
    (p.aggrava || []).forEach(k => parti.push(`${se ? se + "aggrava" : "Aggrava"} ${P.nomeStato(k, 1)}: se ce l'hai già diventa ${P.nomeStato(k, 2)} (senza tiro salvezza), altrimenti te lo applica (TS ${ATTR_TS(k)}, ${cd}).`));
    const ap = p.applica || [];
    if (ap.length) parti.push(`${p.aggrava ? "Poi " : se}applica ${ap.map(k => P.nomeStato(k, 1) + (k === "stordito" ? " (perdi l'azione)" : "")).join(" e ")} (tuo TS ${ATTR_TS(ap[0])}, ${cd}${ap.length > 1 || (p.aggrava || []).length ? ", un tiro solo per tutto il potere" : ""}).`);
    if (p.carica) parti.push("Colpo caricato: distrugge tutte le Copie dell'Illusione.");
    return parti.join(" ");
  }
  /* la regola con cui sceglie, in parole (8c) */
  const REGOLA_SCELTA = "Primo turno: il suo secondo a volontà (lo stato). Poi il per scontro, quando lo stato è già su di te; altrimenti alterna gli a volontà. Gli élite annunciano il per scontro un turno prima e quel turno attaccano comunque. Impaurito: solo a volontà. Caccia al ferito e Silenzio della casa gli impediscono di caricare.";

  /* le due barre del sovrano, per la scheda */
  const barreSovrano = (n) => (n.id === "sovrano" ? { cenere: Math.max(0, n.pv - 40), cenereMax: 70, carne: Math.min(40, Math.max(0, n.pv)), carneMax: 40 } : null);
  const API = { clausoleCenere, iconaDi, POTERI, NEMICI, BOSS, crea, creaBoss, creaGenerico, scegli, agisci, esegui, statoRune, descrivi, REGOLA_SCELTA, cercaDafne, fineStacco, faseCorrente, barreSovrano };
  root.Nemici = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof window !== "undefined" ? window : globalThis);
