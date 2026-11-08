/* =====================================================================
   RACCONTO — trasforma gli eventi del motore nuovo (poteri.js, scontro.js, nemici.js) in righe di testo italiane.
   Lo usano la sala di prova (prova.html) e il gioco (gioco.html): lo scontro si racconta allo stesso modo ovunque.
   Racconto.racconta(evento) → [testo, classe]   classe: "pg" (tu), "nem" (il nemico), "bene", "sis", "turno", con «esito» per le righe forti.
   Il giocatore si chiama sempre «Tu» negli eventi (nome del combattente).
   ===================================================================== */
(function (root) {
  const P = root.Poteri, SP = root.SPECIALIZZAZIONI, N = root.Nemici;
  const RES = { vuln: "✓ vulnerabile", res: "✗ resistente", imm: "⛔ immune" };
  const NOMI_DANNO = { taglio: "taglio", contundente: "contundente", perforante: "perforante", sangue: "sangue", illusione: "illusione", fuoco: "fuoco", fuoco_sacro: "fuoco sacro", ossa: "ossa", veleno: "veleno" };
  const NOMI_BUFF = { guardiaFeroce: "Guardia feroce", inGuardia: "In guardia", ritorsione: "Ritorsione", rintocco: "Rintocco", rappresaglia: "Rappresaglia", veglia: "Veglia di ferro",
    baluardo: "Ultimo baluardo", silenzio: "Silenzio della casa", pelle: "Pelle di corteccia", muffa: "Muffa che dilaga", sciame: "Sciame putrido", cisti: "Cisti parassita",
    cortecciaViva: "Corteccia viva", baccello: "Baccello esplosivo", radici: "Radici avvolgenti", cuoreLinfa: "Cuore di linfa", linfaPerenne: "Linfa perenne", crosta: "Crosta",
    ali: "Ali cremisi", piena: "Sangue in piena", vincolo: "Vincolo di sangue", costellazione: "Costellazione rossa", riflessi: "Riflessi", sdoppiamento: "Sdoppiamento", teatro: "Teatro di specchi",
    aura: "Aura purificante", benedetta: "Arma benedetta", fiammaCalda: "Fiamma calda", consacrazione: "Consacrazione", armaturaOssa: "Armatura d'ossa", sepolcro: "Armatura del sepolcro",
    spezzata: "Armatura spezzata", eredita: "Eredità del sepolcro", soglia: "La soglia di casa", ceneri: "Ceneri sul pelo" };
  const lato = (nome) => (nome === "Tu" ? "pg" : "nem");
  const dadiTesto = (t) => (t && t.length ? ` (${t.join(" + ")})` : "");
  const turni = (n) => (n >= 99 ? "fino a fine scontro" : n === 1 ? "1 turno" : `${n} turni`);
  const danno = (e) => `${e.danno} ${e.danno === 1 ? "danno" : "danni"}${e.tipo ? " di " + (NOMI_DANNO[e.tipo] || e.tipo) : ""}${e.lordo != null && e.lordo !== e.danno ? ` (da ${e.lordo})` : ""}${e.res ? ` [${RES[e.res]}]` : ""}`;
  const a = (nome) => (nome === "Tu" ? "a te" : `a ${nome}`);
  function racconta(e) {
    const su = e.su, sul = su === "Tu" ? "Sei" : `${su} è`;
    switch (e.k) {
      case "potere": return [`${e.chi === "Tu" ? "Usi" : e.chi + " usa"} ${e.nome}${e.gratis ? " (gratis)" : ""}.`, lato(e.chi)];
      case "poterNemico": return [`${e.chi}: ${e.nome}.`, "nem"];
      case "attacco": {
        const chi = e.da === "Tu" ? "Tu" : e.da, pre = e.contrattacco ? "Contrattacco: " : "";
        if (e.d == null) return [`${pre}${chi} → colpo sicuro e critico: ${danno(e)}${dadiTesto(e.tiri)}.`, lato(e.da)];
        const esito = e.ok ? (e.crit ? "CRITICO" : "colpisce") : "manca";
        const note = [e.annullato ? "annullato da Ritorsione" : "", e.copie ? `colpisce una Copia (ne restano ${e.copie.restano})` : "", e.placca ? `una placca assorbe ${e.placca.riduce}` : "", e.ali ? "Ali cremisi dimezzano" : "", e.eredita ? "Eredità del sepolcro dimezza" : "", e.soglia ? "La soglia di casa dimezza" : "",
          e.marchio ? `marchio +${e.marchio}` : "", e.radici ? `radici +${e.radici}` : "", e.extra ? `+${e.extra}` : "", e.benedetta ? `benedetta +${e.benedetta}` : "", e.furia ? "Furia +2" : ""].filter(Boolean).join(", ");
        return [`${pre}${chi} → d20 ${e.d} = ${e.tot} contro CA ${e.ca}: ${esito}${e.ok && !e.annullato ? `, ${danno(e)}${dadiTesto(e.tiri)}` : ""}${note ? ` — ${note}` : ""}.`, lato(e.da)];
      }
      case "ts": return [`${su === "Tu" ? "Il tuo" : "Di " + su + ", il"} tiro salvezza su ${e.attr}: d20 ${e.d} + ${e.m} = ${e.tot} contro CD ${e.cd} → ${e.ok ? "resiste" : "fallisce"}.`, "sis"];
      case "stato": return [`${sul} ${e.nome} (${turni(e.turni)})${e.rinnovato ? ", rinnovato" : ""}.`, su === "Tu" ? "nem" : "bene"];
      case "aggravato": return [`Lo stato peggiora: ${e.nome}.`, su === "Tu" ? "nem" : "bene"];
      case "resiste": return [`${su === "Tu" ? "Resisti" : su + " resiste"}${e.giaTirato ? " (stesso tiro salvezza)" : ""}.`, "sis"];
      case "immune": return [`${sul} immune a ${P.nomeStato(e.stato, 1)}${e.motivo === "dopoStordimento" ? " (appena stordito)" : ""}.`, "sis"];
      case "convertito": return [`Sui boss lo stordimento diventa Indebolito.`, "sis"];
      case "tick": return [`${su === "Tu" ? "Subisci" : su + " subisce"} ${e.nome}: ${danno(e)}${dadiTesto(e.tiri)}.`, su === "Tu" ? "nem" : "bene"];
      case "perdeAzione": return [`${(e.chi || e.su) === "Tu" ? "Sei stordito: perdi il turno" : (e.chi || e.su) + " è stordito e perde il turno"}.`, "sis"];
      case "scade": return [`${su === "Tu" ? "Su di te" : "Su " + su} finisce ${e.nome}.`, "sis"];
      case "buff": return [`Effetto attivo: ${NOMI_BUFF[e.id] || e.id}${e.ca ? ` (+${e.ca} CA)` : ""}.`, "sis"];
      case "cura": case "balsamo": case "piena": case "pozzo": case "ultimoServizio":
        return [`${e.chi === "Tu" ? "Ti curi" : e.chi + " si cura"} di ${e.n}${{ balsamo: " (Balsamo della linfa)", piena: " (Sangue in piena)", pozzo: " (Pozzo arcano)", ultimoServizio: " (Ultimo servizio: resti in piedi)" }[e.k] || ""}${dadiTesto(e.tiri)}.`, "bene"];
      case "vacillante": return [`${e.chi === "Tu" ? "Sei Vacillante" : e.chi + " è Vacillante"}!`, "esito " + (e.chi === "Tu" ? "nem" : "bene")];
      case "abbattuto": return [`${e.chi === "Tu" ? "Cadi" : e.chi + " cade"}.`, "esito " + (e.chi === "Tu" ? "nem" : "bene")];
      case "dannoFisso": return [`${e.su} subisce ${danno(e)}${dadiTesto(e.tiri)}, senza tiro per colpire.`, lato(e.su === "Tu" ? "x" : "Tu")];
      case "soffio": return [`Il soffio ti investe: ${danno(e)}${dadiTesto(e.tiri)}, senza tiro per colpire.`, "nem"];
      case "sciame": case "sfera": case "bulbo": case "bulboEsplode": case "copiaEsplode": case "specchioRotto": case "placcaSpezzata": case "vincolo": case "ecoDiAdele":
        return [`${{ sciame: "Lo sciame", sfera: "Una sfera della costellazione", bulbo: "Il bulbo", bulboEsplode: "Il bulbo esplode", copiaEsplode: "La Copia esplode", specchioRotto: "Lo specchio rotto rimanda il colpo", placcaSpezzata: "La placca spezzata ferisce", vincolo: "Il vincolo di sangue", ecoDiAdele: "L'eco di Adele (cura in eccesso)" }[e.k]}: ${e.su} subisce ${danno(e)}${dadiTesto(e.tiri)}.`, e.su === "Tu" ? "nem" : "bene"];
      case "annuncio": return [`⚠ ${e.chi} prepara ${e.nome}: colpirà al prossimo turno.`, "nem esito"];
      case "runaSpenta": return [`Una runa si spegne.`, "sis"];
      case "caricaSpezzata": return [`Il colpo preparato è spezzato!`, "bene esito"];
      case "nonCarica": return [`Il nemico non può caricare al prossimo turno.`, "bene"];
      case "fuga": return [`${e.chi} fugge.`, "sis esito"];
      case "trappola": return [`Scatta la trappola: ${SP.POTERI[e.id].nome}!`, "bene"];
      case "copia": return [`Copie: ${e.tot}.`, "pg"];
      case "copieConsumate": return [`Consumi ${e.n} Copie.`, "pg"];
      case "placche": return [`Placche d'ossa: ${e.tot}.`, "pg"];
      case "placcheSpese": return [`Spendi ${e.n} placche.`, "pg"];
      case "sangueVersato": return [e.costo ? `Sangue versato: paghi 3 salute per un dado in più.` : `Sangue versato: da Vacillante il dado in più è gratis.`, "pg"];
      case "occhioDelCacciatore": return [`Occhio del cacciatore: il doppio dei dadi.`, "pg"];
      case "senzaScampo": return [`Senza scampo: attacco gratuito!`, "pg esito"];
      case "sogliaDiCasa": return [`La soglia di casa: il colpo fa metà danno, +2 CA per 2 turni.`, "bene"];
      case "ultimaScintilla": return [`Ultima scintilla: ${SP.POTERI[e.potere].nome} torna disponibile.`, "bene"];
      case "baluardo": return [`Ultimo baluardo: resti a 1.`, "bene"];
      case "ritorsione": return [`Ritorsione: il colpo non fa nulla.`, "bene"];
      case "purificato": return [`L'aura brucia via ${P.nomeStato(e.stato, 1)}.`, "bene"];
      case "consacrato": return [`Consacrazione: ${P.nomeStato(e.stato, 1)} ti scivola via e si ritorce contro.`, "bene"];
      case "gabbia": return [`Gabbia d'ossa!`, "pg"];
      case "marchio": return [`Il bersaglio è marchiato per lo scontro.`, "pg"];
      case "svantaggio": return [`Il nemico tira due d20 e tiene il peggiore per ${turni(e.turni)}.`, "pg"];
      case "pestilenza": return [`Pestilenza: il veleno non scadrà.`, "pg"];
      case "marea": return [`Il veleno tira il doppio dei dadi per ${turni(e.turni)}.`, "pg"];
      case "cuoreTossina": return [`Il veleno colpisce ${e.turni} volte.`, "pg"];
      case "bulboPiantato": return [`Un bulbo germoglia sul nemico.`, "pg"];
      case "barricata": return [`Il prossimo attacco del nemico ha −2.`, "pg"];
      case "allungato": return [`${P.nomeStato(e.stato, 1)} dura ${e.n} turno in più (${e.turni}).`, "sis"];
      case "tolto": return [`${su === "Tu" ? "Ti liberi di" : su + " perde"} ${P.nomeStato(e.stato, 1)}.`, "sis"];
      case "rinnovato": return [`${P.nomeStato(e.stato, 2)} rinnovato.`, "sis"];
      case "finoAFineScontro": return [`La bruciatura durerà fino a fine scontro.`, "pg"];
      default: return [`(${e.k})`, "sis"];
    }
  }

  const API = { racconta, RES, NOMI_DANNO, NOMI_BUFF, turni };
  root.Racconto = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof window !== "undefined" ? window : globalThis);
