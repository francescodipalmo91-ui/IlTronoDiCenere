/* =====================================================================
   RACCONTO — trasforma gli eventi del motore nuovo (poteri.js, scontro.js, nemici.js) in righe di testo italiane.
   Lo usano la sala di prova (prova.html) e il gioco (gioco.html): lo scontro si racconta allo stesso modo ovunque.
   Racconto.racconta(evento) → [testo, classe]   classe: "pg" (tu), "nem" (il nemico), "bene", "sis", "turno", con «esito» per le righe forti.
   Il giocatore si chiama sempre «Tu» negli eventi (nome del combattente).
   ===================================================================== */
(function (root) {
  const P = root.Poteri, SP = root.SPECIALIZZAZIONI, N = root.Nemici;
  const RES = { vuln: "✓ vulnerabile", res: "✗ resistente", imm: "⛔ immune" };
  const NOMI_DANNO = { taglio: "taglio", contundente: "contundente", perforante: "perforante", forza: "forza", psichico: "psichico", sangue: "sangue", fuoco: "fuoco", fuoco_sacro: "fuoco sacro", ossa: "ossa", veleno: "veleno" };
  const NOMI_BUFF = { guardiaFeroce: "Guardia feroce", inGuardia: "In guardia", ritorsione: "Ritorsione", rintocco: "Rintocco", rappresaglia: "Rappresaglia", veglia: "Veglia di ferro",
    baluardo: "Ultimo baluardo", silenzio: "Silenzio della casa", pelle: "Pelle di micelio", muffa: "Muffa che dilaga", sciame: "Sciame putrido", cisti: "Cisti parassita",
    ghianda: "Ghianda esplosiva", radici: "Radici avvolgenti", corazza: "Corazza di quercia", rami: "Pioggia di rami", radiceMadre: "Radice madre", foresta: "Foresta che avanza",
    campo: "Campo di peso", collasso: "Collasso gravitazionale", crosta: "Crosta", piena: "Sangue in piena", vincolo: "Vincolo di sangue", costellazione: "Costellazione rossa", riflessi: "Riflessi", sdoppiamento: "Sdoppiamento", teatro: "Teatro di specchi",
    armaturaOssa: "Armatura d'ossa", sepolcro: "Armatura del sepolcro",
    spezzata: "Armatura spezzata", eredita: "Eredità del sepolcro", soglia: "La soglia di casa", ceneri: "Ceneri sul pelo",
    schiva: "«L'ho già vista» (schiva con 17+)", guardiaBoss: "Guardia", scovata: "Scovata" };
  const ICONA = { attacco: "🗡️ ", carica: "🗡️ ", difesa: "🛡️ " }; /* 15/11: la spada caricata vibra nella pagina (classe ico-carica) */
  const lato = (nome) => (nome === "Tu" ? "pg" : "nem");
  const dadiTesto = (t, m) => (t && t.length ? ` (${t.join(" + ")}${m ? (m > 0 ? " + " : " − ") + Math.abs(m) : ""})` : "");
  const turni = (n) => (n >= 99 ? "fino a fine scontro" : n === 1 ? "1 turno" : `${n} turni`);
  const danno = (e) => `${e.danno} ${e.danno === 1 ? "danno" : "danni"}${e.tipo ? " di " + (NOMI_DANNO[e.tipo] || e.tipo) : ""}${e.lordo != null && e.lordo !== e.danno ? ` (da ${e.lordo})` : ""}${e.res ? ` [${RES[e.res]}]` : ""}${e.odore ? ` — Odore di Casa −${e.odore}` : ""}`;
  const a = (nome) => (nome === "Tu" ? "a te" : `a ${nome}`);
  function racconta(e) {
    const su = e.su, sul = su === "Tu" ? "Sei" : `${su} è`;
    switch (e.k) {
      case "potere": return [`${e.chi === "Tu" ? "Usi" : e.chi + " usa"} ${e.nome}${e.gratis ? " (gratis)" : ""}.`, lato(e.chi)];
      case "poterNemico": return [`${ICONA[e.icona] || ""}${e.chi}: ${e.nome}.`, "nem" + (e.icona ? " ico-" + e.icona : "")];
      case "attacco": {
        const chi = e.da === "Tu" ? "Tu" : e.da, pre = e.contrattacco ? "Contrattacco: " : "";
        if (e.d == null) return [`${pre}${chi} → colpo sicuro e critico: ${danno(e)}${dadiTesto(e.tiri, e.mod)}.`, lato(e.da)];
        const esito = e.ok ? (e.crit ? "CRITICO" : "colpisce") : "manca";
        const note = [e.annullato ? "annullato da Ritorsione" : "", e.copie ? `colpisce una Copia (ne restano ${e.copie.restano})` : "", e.placca ? `una placca assorbe ${e.placca.riduce}` : "", e.assorbito ? `lo scudo assorbe ${e.assorbito}` : "", e.mantello ? "il Mantello del Penitente dimezza" : "", e.maglia ? "la Maglia della Veglia toglie 4" : "", e.ignoraRes ? "resistenza spezzata" : "", e.eredita ? "Eredità del sepolcro dimezza" : "", e.soglia ? "La soglia di casa dimezza" : "",
          e.marchio ? `marchio +${e.marchio}` : "", e.radici ? `radici +${e.radici}` : "", e.extra ? `+${e.extra}` : "", e.frattura ? "Frattura +2" : "", e.furente ? "Furente +2" : "", e.furia ? "Furia +2" : ""].filter(Boolean).join(", ");
        return [`${pre}${chi} → d20 ${e.d} = ${e.tot} contro CA ${e.ca}: ${esito}${e.ok && !e.annullato ? `, ${danno(e)}${dadiTesto(e.tiri, e.mod)}` : ""}${note ? ` — ${note}` : ""}.`, lato(e.da)];
      }
      case "ts": if (e.auto) return [`${su === "Tu" ? "Il tuo" : "Di " + su + ", il"} tiro salvezza riesce da solo (${e.auto}).`, "bene"];
        return [`${su === "Tu" ? "Il tuo" : "Di " + su + ", il"} tiro salvezza su ${e.attr}: d20 ${e.d} + ${e.m} = ${e.tot} contro CD ${e.cd} → ${e.ok ? "resiste" : "fallisce"}.`, "sis"];
      case "stato": return [`${sul} ${e.nome} (${turni(e.turni)})${e.rinnovato ? ", rinnovato" : ""}.`, su === "Tu" ? "nem" : "bene"];
      case "aggravato": return [`Lo stato peggiora: ${e.nome}.`, su === "Tu" ? "nem" : "bene"];
      case "resiste": return [`${su === "Tu" ? "Resisti" : su + " resiste"}${e.giaTirato ? " (stesso tiro salvezza)" : ""}.`, "sis"];
      case "immune": return [`${sul} immune a ${P.nomeStato(e.stato, 1)}${e.motivo === "dopoStordimento" ? " (appena stordito)" : ""}.`, "sis"];
      case "convertito": return [`Sui boss lo stordimento diventa Indebolito.`, "sis"];
      case "tick": return [`${su === "Tu" ? "Subisci" : su + " subisce"} ${e.nome}: ${danno(e)}${dadiTesto(e.tiri)}.`, su === "Tu" ? "nem" : "bene"];
      case "perdeAzione": return [`${(e.chi || e.su) === "Tu" ? "Sei stordito: perdi il turno" : (e.chi || e.su) + " è stordito e perde il turno"}.`, "sis"];
      case "scade": return [`${su === "Tu" ? "Su di te" : "Su " + su} finisce ${e.nome}.`, "sis"];
      case "buff": return [`Effetto attivo: ${NOMI_BUFF[e.id] || e.id}${e.ca ? ` (+${e.ca} CA)` : ""}.`, "sis"];
      case "cura": case "pozzo": case "ultimoServizio": case "elisir": case "pozione":
        return [`${e.chi === "Tu" ? "Ti curi" : e.chi + " si cura"} di ${e.n}${{ pozzo: " (Pozzo arcano)", ultimoServizio: " (Ultimo servizio: resti in piedi)", elisir: " (elisir)", pozione: " (pozione)" }[e.k] || ""}${dadiTesto(e.tiri)}${e.ridotta ? (e.ridotta === "condannato" ? " — Condannato: niente cure" : " — Maledetto: cura dimezzata") : ""}.`, "bene"];
      case "vacillante": return [`${e.chi === "Tu" ? "Sei Vacillante" : e.chi + " è Vacillante"}!`, "esito " + (e.chi === "Tu" ? "nem" : "bene")];
      case "abbattuto": return [`${e.chi === "Tu" ? "Cadi" : e.chi + " cade"}.`, "esito " + (e.chi === "Tu" ? "nem" : "bene")];
      case "dannoFisso": return [`${e.su} subisce ${danno(e)}${dadiTesto([...(e.tiri || []), ...(e.tiriPiu || [])], e.mod)}${e.frattura ? ", Frattura +2" : ""}, senza tiro per colpire.`, lato(e.su === "Tu" ? "x" : "Tu")];
      case "colpoGratuito": return [`Colpo gratuito${e.nome === "senza_scampo" ? " (Senza scampo)" : ""}: ${e.su} subisce ${danno(e)}${dadiTesto(e.tiri)}.`, e.su === "Tu" ? "nem" : "bene"];
      case "scudo": return [`Scudo di ${SP.POTERI[e.nome] ? SP.POTERI[e.nome].nome : e.nome}: ${e.pf} PF.`, "pg"];
      case "scudoRifiutato": return [`Hai già uno scudo attivo: uno alla volta.`, "sis"];
      case "assorbe": return [`Lo scudo assorbe ${e.n} (restano ${e.resta} PF).`, "sis"];
      case "scudoFinito": return [`Lo scudo di corteccia si sfalda.`, "sis"];
      case "scorzaViva": return [`Scorza viva: lo scudo recupera ${e.n} (${e.pf} PF).`, "bene"];
      case "scudoPieno": return [`Lo scudo torna al massimo (${e.pf} PF).`, "bene"];
      case "cortecciaRegge": return [`La corteccia regge il colpo intero.`, "bene"];
      case "spento": return [`${e.su === "Tu" ? "Si spegne il tuo potere" : e.su + " perde"} ${SP.POTERI[e.potere] ? SP.POTERI[e.potere].nome : e.potere} fino a fine scontro.`, e.su === "Tu" ? "nem esito" : "bene"];
      case "rapida": return [`Azione rapida.`, "sis"];
      case "elisirStato": return [`${e.chi === "Tu" ? "Bevi" : e.chi + " beve"} un elisir ${e.raro ? "raro" : "comune"} contro ${P && P.nomeStato ? P.nomeStato(e.fam, 1) : e.fam}${e.raro ? ": curato e immune per 3 turni" : ": curato"}.`, "buono"];
      case "elisirDebole": return [`L'elisir comune non basta contro la forma grave.`, "sis"];
      case "poterSet": return [{ sguardo_della_casa: "Sguardo della Casa: il nemico marchiato ha −2 a colpirti per tutto lo scontro.", voce_del_sangue: "Voce del sangue: il prossimo tiro per colpire mancato si rilancia." }[e.id] || e.id, "buono"];
      case "voceDelSangue": return [`Voce del sangue: ${e.prima} si rilancia → ${e.d}.`, "buono"];
      case "ultimaGuardia": return [`Ultima Guardia: ${e.chi} si rialza con ${e.pv} di salute!`, "buono"];
      case "rapidaUsata": return [`Hai già usato l'azione rapida in questo turno.`, "sis"];
      case "arma": return [`Impugni ${e.nome}${e.senzaFocus ? " (a due mani: niente focus)" : ""}.`, "pg"];
      case "puntoDiRottura": return [`Punto di rottura: l'Esposto non scadrà.`, "pg"];
      case "soffio": return [`Il soffio ti investe: ${danno(e)}${dadiTesto(e.tiri)}, senza tiro per colpire.`, "nem"];
      case "sciame": case "sfera": case "rami": case "collasso": case "campoDiPeso": case "copiaEsplode": case "specchioRotto": case "placcaSpezzata": case "vincolo":
        return [`${{ sciame: "Lo sciame", sfera: "Una sfera della costellazione", rami: "La pioggia di rami", collasso: "Il collasso gravitazionale", campoDiPeso: "Il campo di peso", copiaEsplode: "La Copia esplode", specchioRotto: "Lo specchio rotto rimanda il colpo", placcaSpezzata: "La placca spezzata ferisce", vincolo: "Il vincolo di sangue" }[e.k]}: ${e.su} subisce ${danno(e)}${dadiTesto(e.tiri)}.`, e.su === "Tu" ? "nem" : "bene"];
      case "annuncio": return [`${ICONA.carica}${e.chi} prepara ${e.nome}: colpirà al prossimo turno.`, "nem esito ico-carica"];
      case "runaSpenta": return [`Una runa si spegne.`, "sis"];
      case "caricaSpezzata": return [`Il colpo preparato è spezzato!`, "bene esito"];
      case "nonCarica": return [`Il nemico non può caricare al prossimo turno.`, "bene"];
      case "fuga": return [`${e.chi} fugge.`, "sis esito"];
      case "schiva": return [e.ok ? `${e.chi} schiva il colpo (${e.d}).` : `${e.chi} prova a schivare (${e.d}), non basta.`, e.ok ? "nem" : "bene"];
      case "intoccabile": return [`${e.chi} è fuori portata: il colpo non la tocca.`, "sis"];
      case "rialzato": return [`Le tombe dei suoi uomini rialzano ${e.chi}: torna in piedi con ${e.pv} di salute.`, "nem esito"];
      case "faseBoss": return [`— ${e.chi}: ${e.nome} —`, "nem esito"];
      case "cerca": return [`Cerchi tra i pini: ${e.d} → ${e.tot} contro ${e.cd}. ${e.ok ? "La trovi!" : "Niente."}`, e.ok ? "bene" : "sis"];
      case "escoAlloScoperto": return [`${e.chi} esce allo scoperto.`, "nem"];
      case "evoca": return [`${e.chi} suona il corno: arriva un mastino infernale (sparisce in ${e.turni} turni).`, "nem esito"];
      case "stacco": return [`${e.chi} arretra e riprende fiato, fuori portata.`, "sis"];
      case "conteggio": return [`«${["Uno", "Due", "Tre", "Quattro", "Cinque"][e.n - 1]}.»${e.n === 1 ? "" : ""}`, "nem"];
      case "dannoMentale": return [`Il vuoto ti entra nella mente: ${e.n} danni mentali.`, "nem"];
      case "sparisce": return [`${e.chi} si sfalda in cenere.`, "sis esito"];
      case "attaccoBase": return [`Attacchi con ${e.arma}.`, "pg"];
      case "potereArma": return [`Potere dell'arma: ${e.nome}.`, "pg"];
      case "potereOggetto": return [`${e.nome}: ${e.testo}`, "pg"];
      case "carica": return [`Carica pronta.`, "sis"];
      case "risata": return [`La risata di Darius: l'attacco di ${e.su} va a vuoto.`, "bene"];
      case "studio": return [e.ok ? "Studio del bersaglio: un dado in più sul punto debole." : "Studio del bersaglio: nessun punto debole, la carica va persa.", e.ok ? "bene" : "sis"];
      case "amuletoVeglia": return [`L'amuleto della veglia brucia chi ti ha colpito: ${e.su} subisce ${danno(e)}${dadiTesto(e.tiri)}.`, "bene"];
      case "braci": return [`La pioggia di braci: ${e.su} subisce ${danno(e)}${dadiTesto(e.tiri)}.`, "bene"];
      case "faccia": return [`Giri il Giuramento: ora colpisci di ${e.nome} (${e.tipo}).`, "pg"];
      case "resina": return [`Anello della resina: immune a ${P.nomeStato(e.stato, 1)} per lo scontro.`, "bene"];
      case "segnoConPotere": return [`Segno sulla mappa si dichiara insieme a un potere di classe.`, "sis"];
      case "senzaPotere": return [`Quest'arma non ha poteri.`, "sis"];
      case "nonNascosta": return [`Non c'è nessuno da cercare.`, "sis"];
      case "trappola": return [`Scatta la trappola: ${SP.POTERI[e.id].nome}!${e.tiri ? " " + e.tiri.join(" + ") + " danni." : ""}`, "bene"];
      case "copia": return [`Copie: ${e.tot}.`, "pg"];
      case "copieConsumate": return [`Consumi ${e.n} Copie.`, "pg"];
      case "placche": return [`Placche d'ossa: ${e.tot}.`, "pg"];
      case "placcheSpese": return [`Spendi ${e.n} placche.`, "pg"];
      case "sangueVersato": return [e.costo ? `Sangue versato: paghi ${e.costo} salute per un dado in più.` : `Sangue versato: da Vacillante il dado in più è gratis.`, "pg"];
      case "occhioDelCacciatore": return [`Occhio del cacciatore: il doppio dei dadi.`, "pg"];
      case "senzaScampo": return [`Senza scampo!`, "pg esito"];
      case "sogliaDiCasa": return [`La soglia di casa: il colpo fa metà danno, +2 CA per 2 turni.`, "bene"];
      case "ultimaScintilla": return [`Ultima scintilla: ${SP.POTERI[e.potere].nome} torna disponibile.`, "bene"];
      case "baluardo": return [`Ultimo baluardo: resti a 1.`, "bene"];
      case "ritorsione": return [`Ritorsione: il colpo non fa nulla.`, "bene"];
      case "gabbia": return [`Gabbia d'ossa!`, "pg"];
      case "marchio": return [`Il bersaglio è marchiato per lo scontro.`, "pg"];
      case "svantaggio": return [`Il nemico tira due d20 e tiene il peggiore per ${turni(e.turni)}.`, "pg"];
      case "pestilenza": return [`Pestilenza: il veleno non scadrà.`, "pg"];
      case "marea": return [`Il veleno tira il doppio dei dadi per ${turni(e.turni)}.`, "pg"];
      case "cuoreTossina": return [`Il veleno colpisce ${e.turni} volte.`, "pg"];
      case "barricata": return [`Il prossimo attacco del nemico ha −2.`, "pg"];
      case "allungato": return [`${P.nomeStato(e.stato, 1)} dura ${e.n} turno in più (${e.turni}).`, "sis"];
      case "tolto": return [`${su === "Tu" ? "Ti liberi di" : su + " perde"} ${P.nomeStato(e.stato, 1)}.`, "sis"];
      case "rinnovato": return [`${P.nomeStato(e.stato, 2)} rinnovato.`, "sis"];
      default: return [`(${e.k})`, "sis"];
    }
  }

  const API = { racconta, RES, NOMI_DANNO, NOMI_BUFF, turni };
  root.Racconto = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof window !== "undefined" ? window : globalThis);
