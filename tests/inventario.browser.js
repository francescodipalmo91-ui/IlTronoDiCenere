/* Test nel browser dell'inventario (22/11/2026): getta (con conferma), posa nello sgabuzzino, riprendi.
   Regole: oggetti_per_rarita.md sez. 7 — zaino di scorta 8 posti, sgabuzzino 10 posti, solo in Casa e mai in scontro,
   pozioni ed elisir dello stesso tipo in un posto (×N, tetto 10). Gli oggetti di storia non si buttano né si posano.
   Uso: python3 -m http.server 8765 --bind 127.0.0.1, poi node tests/inventario.browser.js */
const { chromium } = require("playwright");
const BASE = process.env.BASE || "http://127.0.0.1:8765/";
const casi = [];
const caso = (nome, fn) => casi.push({ nome, fn });
const eq = (a, b, msg) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${msg || "atteso"}: ${JSON.stringify(b)}, ottenuto ${JSON.stringify(a)}`); };
const vero = (x, msg) => { if (!x) throw new Error(msg || "atteso vero"); };

const PG = () => ({
  nome: "Prova", razza: "Umano", classe: "Soldato", livello: 1, immagine: null, motore: 2, spec: "berserker",
  statisticheBase: { Vigore: 16, "Agilità": 12, Mente: 10, Spirito: 12 }, statistiche: { Vigore: 16, "Agilità": 12, Mente: 10, Spirito: 12 },
  modificatori: { Vigore: 3, "Agilità": 1, Mente: 0, Spirito: 1 }, tiroDado: { dado: 10, valore: 10 }, puntiVita: 23, saluteMentale: 21,
  classeArmatura: 14, mana: null, risorsa: { id: "furia", max: 13 }, incantesimi: [], tecniche: ["polso", "morso_acciaio"],
  abilita: [{ nome: "Atletica", attributo: "Vigore", valore: 4 }],
  equipaggiamento: { arma: "Spada corta", armaDanno: "1d6", armaTipoDanno: "Tagliente", armaMani: 1, armatura: "Armatura media", armaturaCA: 4, malusAgilita: 0, scudo: null, dotazione: [] }
});
const arma = (id, nome) => ({ id, nome, tipo: "arma", danno: "1d6", tipoDanno: "Perforante", mani: 1 });
const PARTITA = (o) => Object.assign({
  usate: { riposo: "sbloccato" }, diario: [{ tipo: "narra", stanza: "cucina", righe: ["x"] }], luogo: "cucina", livello: 1,
  crescita: { salute: 0, mente: 0, risorsa: 0 }, risorsaUsata: 0, ora: Date.now(),
  zaino: [
    arma("pugnale1", "Pugnale"),
    { id: "siero", nome: "Siero", tipo: "consumabile", usi: 2, effetto: "pozCura" },
    { id: "diario_figlio", nome: "Diario del figlio maggiore", tipo: "reperto", alias: ["diario"] }
  ]
}, o || {});

async function apri(browser, pg, partita) {
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  const errori = [];
  page.on("pageerror", e => errori.push(e.message));
  page.on("console", m => { if (m.type() === "error" && !/Failed to load resource|ERR_|net::|firebase|gstatic|googleapis/i.test(m.text())) errori.push(m.text()); });
  await ctx.route(/^(?!http:\/\/127\.0\.0\.1)/, r => r.abort());
  page.on("dialog", d => d.accept());
  await page.addInitScript(([pg, partita]) => {
    if (!sessionStorage.getItem("inizializzato")) {
      sessionStorage.setItem("inizializzato", "1"); localStorage.clear(); localStorage.setItem("trono_ritmo", "veloce");
      localStorage.setItem("personaggio", JSON.stringify(pg)); localStorage.setItem("partita", JSON.stringify(partita));
    }
  }, [pg, partita]);
  await page.goto(BASE + "gioco.html");
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.evaluate(() => document.querySelectorAll(".avviso-vecchio").forEach(e => e.remove())); /* il personaggio di prova è «vecchio»: qui conta solo l'inventario */
  return { page, errori, chiudi: () => ctx.close() };
}
const bottoni = (page, sel) => page.$$eval(sel + " .oggetto", els => els.map(e => ({ testo: e.querySelector(".testa > div").textContent.trim(), azioni: [...e.querySelectorAll("button.mini")].map(b => b.textContent.trim()) })));
const zainoIds = (page) => page.evaluate(() => zaino.map(x => x.id).filter(id => id !== "razioni_adele")); /* le razioni di Adele sono nello zaino di partenza */
const apriRiquadri = (page) => page.evaluate(() => { document.getElementById("zainoBox").open = true; document.getElementById("sgabuzzinoBox").open = true; });
const sgab = (page) => page.evaluate(() => (usate.sgabuzzino || []).map(x => [x.id, x.usi ?? x.qta ?? 1]));
const clicca = (page, sel, nome, etichetta) => page.locator(`${sel} .oggetto`).filter({ hasText: nome }).locator("button.mini", { hasText: etichetta }).first().click();

caso("Inventario: in Casa armi e consumabili hanno Posa e Getta; gli oggetti di storia nessuno dei due", async (b) => {
  const { page, errori, chiudi } = await apri(b, PG(), PARTITA());
  const z = await bottoni(page, "#zaino");
  const per = (n) => z.find(o => o.testo.includes(n)).azioni;
  eq(per("Pugnale"), ["Equipaggia", "Posa", "Getta"]);
  vero(per("Siero").includes("Posa") && per("Siero").includes("Getta"), "il siero si può posare e buttare");
  eq(per("Diario del figlio").filter(a => a === "Posa" || a === "Getta"), [], "un oggetto di storia non si butta né si posa");
  eq(errori, [], "errori in console"); await chiudi();
});

caso("Inventario: posa nello sgabuzzino e riprendi; il pannello compare solo in Casa", async (b) => {
  const { page, errori, chiudi } = await apri(b, PG(), PARTITA());
  vero(await page.isVisible("#sgabuzzinoBox"), "in cucina il pannello è visibile");
  await apriRiquadri(page);
  await clicca(page, "#zaino", "Pugnale", "Posa");
  eq(await sgab(page), [["pugnale1", 1]]); eq((await zainoIds(page)).includes("pugnale1"), false);
  eq((await bottoni(page, "#sgabuzzino")).map(o => o.azioni), [["Riprendi"]]);
  await clicca(page, "#sgabuzzino", "Pugnale", "Riprendi");
  eq(await sgab(page), []); vero((await zainoIds(page)).includes("pugnale1"), "il pugnale è tornato nello zaino");
  eq(errori, [], "errori in console"); await chiudi();
});

caso("Inventario: getta chiede conferma al primo clic e non si recupera", async (b) => {
  const { page, errori, chiudi } = await apri(b, PG(), PARTITA());
  await apriRiquadri(page);
  await clicca(page, "#zaino", "Pugnale", "Getta");
  vero((await zainoIds(page)).includes("pugnale1"), "il primo clic non butta");
  eq((await bottoni(page, "#zaino")).find(o => o.testo.includes("Pugnale")).azioni, ["Equipaggia", "Posa", "Sicuro?"]);
  await clicca(page, "#zaino", "Pugnale", "Sicuro?");
  eq((await zainoIds(page)).includes("pugnale1"), false, "il secondo clic butta");
  eq(await sgab(page), [], "non finisce nello sgabuzzino");
  eq(errori, [], "errori in console"); await chiudi();
});

caso("Inventario: fuori dalla Casa (foresta) niente sgabuzzino né Posa; Getta resta", async (b) => {
  const { page, errori, chiudi } = await apri(b, PG(), PARTITA({ luogo: "foresta", diario: [] }));
  eq(await page.isVisible("#sgabuzzinoBox"), false);
  const z = await bottoni(page, "#zaino");
  eq(z.find(o => o.testo.includes("Pugnale")).azioni, ["Equipaggia", "Getta"]);
  await page.evaluate(() => posaSgabuzzino("pugnale1")); /* anche chiamata a mano non fa nulla */
  eq(await sgab(page), []);
  eq(errori, [], "errori in console"); await chiudi();
});

caso("Inventario: in scontro lo sgabuzzino è chiuso", async (b) => {
  const { page, errori, chiudi } = await apri(b, PG(), PARTITA());
  await page.evaluate(() => { window.__inScontro = inScontroOra; inScontroOra = () => true; aggiornaZaino(); }); /* uno scontro vero si apre solo con tutto il motore: qui si prova la regola */
  eq(await page.isVisible("#sgabuzzinoBox"), false);
  eq((await bottoni(page, "#zaino")).find(o => o.testo.includes("Pugnale")).azioni.includes("Posa"), false);
  await page.evaluate(() => { inScontroOra = window.__inScontro; aggiornaZaino(); });
  vero(await page.isVisible("#sgabuzzinoBox"), "finito lo scontro torna visibile");
  eq(errori, [], "errori in console"); await chiudi();
});

caso("Inventario: 10 posti nello sgabuzzino e 8 di scorta nello zaino", async (b) => {
  const arm = Array.from({ length: 12 }, (_, i) => arma("a" + i, "Arma " + i));
  const { page, errori, chiudi } = await apri(b, PG(), PARTITA({ zaino: arm }));
  for (let i = 0; i < 12; i++) await page.evaluate((id) => posaSgabuzzino(id), "a" + i);
  eq((await sgab(page)).length, 10, "il posto 11 e 12 non entrano");
  eq((await zainoIds(page)), ["a10", "a11"]);
  /* mano vuota, zaino senza armi: si riprendono al massimo due armi (nessuna in mano + una di scorta... qui due di scorta) */
  await page.evaluate(() => { arma = { nome: "—" }; zaino = zaino.filter(x => x.tipo !== "arma"); riprendiSgabuzzino("a0"); riprendiSgabuzzino("a1"); riprendiSgabuzzino("a2"); });
  eq(await page.evaluate(() => zaino.filter(x => x.tipo === "arma").map(x => x.id)), ["a0", "a1"], "con due armi con te la terza resta nello sgabuzzino");
  await page.evaluate(() => { zaino = zaino.filter(x => x.tipo !== "arma"); for (let i = 0; i < 8; i++) zaino.push({ id: "s" + i, nome: "Scudo " + i, tipo: "scudo", ca: 1, malus: 0 }); riprendiSgabuzzino("a2"); });
  eq(await page.evaluate(() => zaino.filter(x => x.tipo === "arma").length), 0, "8 posti di scorta pieni: l'arma resta nello sgabuzzino");
  eq(errori, [], "errori in console"); await chiudi();
});

caso("Inventario: elisir dello stesso tipo in un posto (×N, tetto 10); in borsa 2 per tipo", async (b) => {
  const { page, errori, chiudi } = await apri(b, PG(), PARTITA({ zaino: [{ id: "siero", nome: "Siero", tipo: "consumabile", usi: 2, effetto: "cura_sanguinante" }] }));
  await page.evaluate(() => posaSgabuzzino("siero"));
  eq(await sgab(page), [["siero", 2]]); eq(await page.evaluate(() => zaino.filter(x => x.id === "siero").length), 0);
  await page.evaluate(() => { zaino.push({ id: "siero", nome: "Siero", tipo: "consumabile", usi: 2, effetto: "cura_sanguinante" }); posaSgabuzzino("siero"); });
  eq(await sgab(page), [["siero", 4]], "stesso tipo: un posto solo");
  await page.evaluate(() => riprendiSgabuzzino("siero"));
  const ritorno = await page.evaluate(() => [zaino.filter(x => x.id === "siero").reduce((n, x) => n + x.usi, 0), (usate.sgabuzzino || []).map(x => x.usi)]);
  vero(ritorno[0] <= 2, "in borsa al massimo 2 per tipo, trovati " + ritorno[0]);
  eq(ritorno[0] + ritorno[1].reduce((n, x) => n + x, 0), 4, "niente si perde");
  eq(errori, [], "errori in console"); await chiudi();
});

caso("Inventario: anche le pozioni (cura, essenza, serenità) stanno 2 per tipo in borsa; il laboratorio le ferma a 2", async (b) => {
  const { page, errori, chiudi } = await apri(b, PG(), PARTITA({ zaino: [{ id: "siero", nome: "Siero", tipo: "consumabile", usi: 3, effetto: "pozCura" }, { id: "acqua_benedetta", nome: "Acqua benedetta", tipo: "consumabile", usi: 2 }] }));
  await page.evaluate(() => { posaSgabuzzino("siero"); posaSgabuzzino("acqua_benedetta"); });
  eq(await sgab(page), [["siero", 3], ["acqua_benedetta", 2]]);
  await page.evaluate(() => { riprendiSgabuzzino("siero"); riprendiSgabuzzino("acqua_benedetta"); });
  eq(await page.evaluate(() => zaino.filter(x => x.id === "siero").map(x => x.usi)), [2], "2 pozioni in borsa");
  eq(await sgab(page), [["siero", 1]], "la terza resta nello sgabuzzino; l'acqua benedetta non ha tetto e torna intera");
  eq(await page.evaluate(() => zaino.filter(x => x.id === "acqua_benedetta").map(x => x.usi)), [2]);
  eq(await page.evaluate(() => [borsaPienaPer({ effetto: "pozCura" }), borsaPienaPer({ effetto: "pozMana" }), borsaPienaPer({ effetto: "serenita" })]), [true, false, false], "il laboratorio ferma solo il Siero");
  eq(errori, [], "errori in console"); await chiudi();
});

caso("Inventario: a comando si posa, si riprende e si getta (con conferma ripetendo); scartabili soltanto", async (b) => {
  const { page, errori, chiudi } = await apri(b, PG(), PARTITA());
  const scrivi = (t) => page.evaluate((t) => gestisci(t), t);
  await scrivi("poso il pugnale nello sgabuzzino");
  eq(await sgab(page), [["pugnale1", 1]]);
  eq((await zainoIds(page)).includes("pugnale1"), false);
  await scrivi("riprendo il pugnale dallo sgabuzzino");
  eq(await sgab(page), []);
  eq((await zainoIds(page)).includes("pugnale1"), true);
  await scrivi("getto il pugnale");
  eq((await zainoIds(page)).includes("pugnale1"), true, "il primo comando chiede solo conferma");
  await scrivi("getto il pugnale");
  eq((await zainoIds(page)).includes("pugnale1"), false, "ripetuto, lo getta");
  await scrivi("poso il pugnale nello sgabuzzino");
  eq(await sgab(page), [], "nulla da posare: non succede niente");
  await page.evaluate(() => { window.__inScontro = inScontroOra; inScontroOra = () => true; });
  await scrivi("poso il pugnale nello sgabuzzino");
  await page.evaluate(() => { inScontroOra = window.__inScontro; });
  eq(errori, [], "errori in console"); await chiudi();
});

caso("Dotazione nelle prove dei luoghi (22/11, A): +2 solo se la nomini e ce l'hai; suggerimento 3 volte; pulsante dopo il primo uso", async (b) => {
  const dot = (id, nome) => ({ id, nome, tipo: "dotazione", usi: null });
  const { page, errori, chiudi } = await apri(b, PG(), PARTITA({ zaino: [dot("dot0", "Piede di porco"), dot("dot2", "Lente")] }));
  /* prova con l'azione scritta t (null = lanciata da un pulsante): testo del riquadro e pulsanti offerti */
  const prova = (abilita, t) => page.evaluate(([abilita, t]) => { testoComando = t; const n0 = document.body.innerText.length;
    proponiProva("prova_test", { prova: { abilita, dado: 20, cd: 12 }, successo: ["s"], fallimento: ["f"], lascia: "l" });
    const testo = document.body.innerText.slice(n0), bottoni = [...document.querySelectorAll("button")].map(x => x.textContent).filter(x => /^(Lancia|Roll) d20/.test(x));
    chiudiScelte(); testoComando = null; return { testo, bottoni }; }, [abilita, t]);
  eq((await prova("Percezione", null)).bottoni.length, 1, "mai usata: un solo pulsante");
  vero(/Con la lente: \+2/.test((await prova("Percezione", "esamino la tomba con la lente")).testo), "nominata e posseduta: +2");
  vero(/Non hai la corda/.test((await prova("Acrobazia", "salto sulla trave con la corda")).testo), "nominata ma non posseduta");
  const sugg = []; for (let i = 0; i < 4; i++) sugg.push(/scrivi «con la lente»/.test((await prova("Indagare", "cerco nel cassetto")).testo));
  eq(sugg, [true, true, false, false], "suggerimento solo le prime 3 volte (la prima è andata alla prova da pulsante)");
  eq((await prova("Indagare", null)).bottoni, ["Lancia d20", "Lancia d20 con la lente (+2)"], "da pulsante, dopo il primo uso scritto");
  vero(!/\+2/.test((await prova("Persuasione", "lo convinco con la lente")).testo), "nessun oggetto vale per la Persuasione");
  eq(await page.evaluate(() => dotazioneProva({ abilita: "Atletica", dotazione: false })), null);
  await page.evaluate(() => { usate.flash_anello = true; dotInUso = "Piede di porco"; sarcofago(false); });
  vero(await page.evaluate(() => document.body.innerText.includes(A2.anello.ditaSalve)), "con il piede di porco il coperchio non costa le dita");
  eq(errori, [], "errori in console"); await chiudi();
});

caso("Inventario: lo sgabuzzino si salva con la partita e sopravvive a un ricaricamento", async (b) => {
  const { page, errori, chiudi } = await apri(b, PG(), PARTITA());
  await page.evaluate(() => { posaSgabuzzino("pugnale1"); salvaPartita(); });
  await page.reload(); await page.waitForLoadState("networkidle").catch(() => {});
  eq(await sgab(page), [["pugnale1", 1]]);
  eq((await zainoIds(page)).includes("pugnale1"), false);
  eq(errori, [], "errori in console"); await chiudi();
});

(async () => {
  const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME, args: ["--no-sandbox"] } : {});
  let ko = 0;
  const scelti = process.env.SOLO ? casi.filter(c => c.nome.includes(process.env.SOLO)) : casi;
  for (const { nome, fn } of scelti) {
    try { await fn(browser); console.log("OK     " + nome); }
    catch (e) { ko++; console.log("ERRORE " + nome + "\n       → " + e.message.split("\n")[0]); }
  }
  await browser.close();
  console.log(`\n${scelti.length - ko} / ${scelti.length} superati`);
  process.exit(ko ? 1 : 0);
})();
