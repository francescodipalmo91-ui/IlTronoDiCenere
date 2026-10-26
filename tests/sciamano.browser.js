/* Test nel browser dello Sciamano: partita vera, creazione e regolamento.
   Uso:  python3 -m http.server 8765 --bind 127.0.0.1   (dalla cartella del gioco, in un altro terminale)
         node tests/sciamano.browser.js                 (serve Playwright: npm i -g playwright)
   Gli aiuti (personaggio di prova, dadi truccati) sono gli stessi di tests/combattimento.browser.js. */
const { chromium } = require("playwright");
const BASE = process.env.BASE || "http://127.0.0.1:8765/";
const casi = [];
const caso = (nome, fn) => casi.push({ nome, fn });
const eq = (a, b, msg) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${msg || "atteso"}: ${JSON.stringify(b)}, ottenuto ${JSON.stringify(a)}`); };
const vero = (x, msg) => { if (!x) throw new Error(msg || "atteso vero"); };

/* ---------- personaggio e partita di prova ---------- */
const PG = (o) => Object.assign({
  nome: "Prova", razza: "Umano", classe: "Soldato", livello: 1, immagine: null,
  statisticheBase: { Vigore: 16, "Agilità": 12, Mente: 10, Spirito: 12 }, statistiche: { Vigore: 16, "Agilità": 12, Mente: 10, Spirito: 12 },
  modificatori: { Vigore: 3, "Agilità": 1, Mente: 0, Spirito: 1 }, tiroDado: { dado: 10, valore: 6 }, puntiVita: 19, saluteMentale: 17,
  classeArmatura: 14, mana: null, risorsa: { id: "ira", max: 13 }, incantesimi: [], tecniche: ["polso", "morso_acciaio"],
  abilita: [{ nome: "Atletica", attributo: "Vigore", valore: 4 }],
  equipaggiamento: { arma: "Spada corta", armaDanno: "1d6", armaTipoDanno: "Tagliente", armaMani: 1, armatura: "Armatura media", armaturaCA: 4, malusAgilita: 0, scudo: null, dotazione: [] }
}, o || {});
const PARTITA = (o) => Object.assign({ usate: { riposo: "sbloccato" }, diario: [], luogo: "cucina", livello: 1, crescita: { salute: 0, mente: 0, risorsa: 0 }, risorsaUsata: 0, esperienza: 0, ora: Date.now() }, o || {});

async function apri(browser, url, pg, partita) {
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  const errori = [];
  page.on("pageerror", e => errori.push(e.message));
  page.on("console", m => { if (m.type() === "error" && !/Failed to load resource|ERR_|net::|firebase|gstatic|googleapis/i.test(m.text())) errori.push(m.text()); });
  await ctx.route(/^(?!http:\/\/127\.0\.0\.1)/, r => r.abort()); /* niente rete esterna (Firebase) */
  await page.addInitScript(([pg, partita]) => {
    if (!sessionStorage.getItem("inizializzato")) { /* solo al primo caricamento: un reload tiene lingua e salvataggi */
      sessionStorage.setItem("inizializzato", "1"); localStorage.clear();
      if (pg) localStorage.setItem("personaggio", JSON.stringify(pg));
      if (partita) localStorage.setItem("partita", JSON.stringify(partita));
    }
    /* dadi truccati: __coda vale solo per tira() (i dadi), __caso per le altre probabilità del nemico (morso, soffio, presa);
       la scelta casuale dei testi (pesca, scegli) resta casuale */
    const orig = Math.random, q = [], c = [];
    window.__coda = q; window.__caso = c;
    Math.random = () => {
      const chi = (new Error().stack.split("\n")[2] || "");
      if (/\btira\b/.test(chi)) return q.length ? q.shift() : orig();
      if (/\b(pesca|scegli)\b/.test(chi)) return orig();
      return c.length ? c.shift() : orig();
    };
  }, [pg, partita]);
  await page.goto(BASE + url);
  await page.waitForLoadState("networkidle").catch(() => {});
  return { page, errori, chiudi: () => ctx.close() };
}
/* valore v su un dado d → numero per Math.random; "x" = valore grezzo (es. 0.99 per «no» alle probabilità) */
const R = (v, d) => (v - 1) / d + 0.5 / d;
const accoda = (page, dadi, caso) => page.evaluate(([d, c]) => { window.__coda.push(...d); window.__caso.push(...(c || [])); }, [dadi, caso]);
const aspettaTurnoPg = (page) => page.waitForFunction(() => typeof scontro !== "undefined" && scontro && scontro.tuoTurno, null, { timeout: 15000 });
const aspettaFineScontro = (page) => page.waitForFunction(() => typeof scontro !== "undefined" && !scontro, null, { timeout: 15000 });
const diario = (page) => page.evaluate(() => document.getElementById("diario").textContent); /* anche le tendine chiuse dei turni passati */


/* ---------- Sciamano di prova: Vigore 16 (+3), Spirito 12 (+1) → 11 punti natura ---------- */
const SC = (o) => PG(Object.assign({ classe: "Forestiero", risorsa: { id: "natura", max: 11 }, tecniche: ["mandragora", "micelio"], tiroDado: { dado: 8, valore: 5 } }, o || {}));
const PREP2 = ["mandragora", "micelio", "baccello", "corteccia"];
const PREP3 = ["mandragora", "micelio", "muffa", "baccello", "radici"];
const PREP4 = ["mandragora", "micelio", "muffa", "corteccia", "radici", "linfa_furiosa"];
const usaTec = (page, id) => page.evaluate((id) => usaTecnica(TECNICHE.find(t => t.id === id)), id);

caso("Sciamano: la scheda mostra le tecniche della natura in punti natura; il Guerriero non le vede", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", SC(), PARTITA({ livello: 2, usate: { riposo: "sbloccato", tecPreparate: PREP2 } }));
  eq(await page.evaluate(() => tecnichePreparate().map(t => t.id)), PREP2);
  const t = await page.innerText("#tecnicheBox");
  vero(/Punta di Mandragora/.test(t) && /Baccello Esplosivo/.test(t), "mancano le tecniche"); vero(/2 natura/.test(t), "costo in natura"); vero(!/ira/.test(t), "non deve parlare di ira");
  vero(!(await page.evaluate(() => opzioniTecniche().some(t => !t.classe))), "niente tecniche del Guerriero tra le opzioni");
  await chiudi();
  const g = await apri(b, "gioco.html", PG(), PARTITA({ livello: 5, usate: { riposo: "sbloccato" } }));
  vero(!(await g.page.evaluate(() => opzioniTecniche().some(t => t.classe === "Forestiero"))), "il Guerriero vede le tecniche dello Sciamano");
  eq(errori, [], "errori"); eq(g.errori, [], "errori del Guerriero"); await g.chiudi();
});
caso("Sciamano: Punta di Mandragora avvelena; il veleno al turno del nemico restituisce natura", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", SC(), PARTITA({ usate: { riposo: "sbloccato" } }));
  await page.evaluate(() => avviaScontro("mastino", { primo: "pg", soffioScarico: true })); await aspettaTurnoPg(page);
  await page.evaluate(() => { scontro.pv = 60; scontro.pvMax = 60; });
  /* colpo 18, danno 4; nemico: veleno 2, ricarica 1, zampata mancata */
  await accoda(page, [R(18, 20), R(4, 6), R(2, 4), R(1, 6), R(1, 20)], [0.9]);
  await usaTec(page, "mandragora");
  eq(await page.evaluate(() => pg.risorsaUsata), 2, "natura spesa"); vero(/Avvelenato/.test(await page.innerText("#schedaNem")), "scheda nemico senza Avvelenato");
  await aspettaTurnoPg(page);
  eq(await page.evaluate(() => [pg.risorsaUsata, scontro.eff.avvelenato, scontro.pv]), [1, 1, 60 - 7 - 2], "recupero, durata, danni");
  const d = await diario(page); vero(/Il veleno brucia: 2 danni/.test(d), "manca il tick"); vero(/Forza della natura: \+1 punti natura/.test(d), "manca il recupero");
  vero(/Arma rivestita/.test(await page.innerText("#schedaPg, body")), "manca l'arma rivestita nella scheda");
  eq(errori, [], "errori"); await chiudi();
});
caso("Sciamano: il rivestimento vale anche sull'attacco normale", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", SC(), PARTITA({ usate: { riposo: "sbloccato" } }));
  await page.evaluate(() => avviaScontro("mastino", { primo: "pg", soffioScarico: true })); await aspettaTurnoPg(page);
  await page.evaluate(() => { scontro.pv = 60; scontro.pvMax = 60; scontro.rivest = "mandragora"; scontro.eff.rivest = 3; });
  await accoda(page, [R(18, 20), R(2, 6)]);
  await page.evaluate(() => attaccoPgScontro(false));
  eq(await page.evaluate(() => scontro.eff.avvelenato), 2); eq(errori, [], "errori"); await chiudi();
});
caso("Sciamano: Baccello Esplosivo — la trappola scatta prima della zampata e il nemico tira due d20", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", SC(), PARTITA({ livello: 2, usate: { riposo: "sbloccato", tecPreparate: PREP2 } }));
  await page.evaluate(() => avviaScontro("mastino", { primo: "pg", soffioScarico: true })); await aspettaTurnoPg(page);
  await page.evaluate(() => { scontro.pv = 60; scontro.pvMax = 60; });
  await accoda(page, [R(18, 20), R(2, 6), /* nemico */ R(1, 6), R(1, 20), R(1, 20)], [0.9]);
  await usaTec(page, "baccello"); await aspettaTurnoPg(page);
  eq(await page.evaluate(() => [pg.risorsaUsata, scontro.eff.accecato, scontro.trappola]), [3, 1, null]);
  const d = await diario(page); vero(/La trappola scatta: Baccello Esplosivo/.test(d), "manca la trappola"); vero(/due d20/.test(d), "il nemico non ha tirato due d20");
  eq(errori, [], "errori"); await chiudi();
});
caso("Sciamano: Pelle di Corteccia — il morso fa metà danni e l'acido brucia il mastino", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", SC(), PARTITA({ livello: 2, usate: { riposo: "sbloccato", tecPreparate: PREP2 } }));
  await page.evaluate(() => avviaScontro("mastino", { primo: "pg", soffioScarico: true })); await aspettaTurnoPg(page);
  await page.evaluate(() => { scontro.pv = 60; scontro.pvMax = 60; });
  await accoda(page, [R(18, 20), R(1, 6), /* nemico: ricarica, morso 19, danno 4, acido 3 */ R(1, 6), R(19, 20), R(4, 4), R(3, 4)], [0.1, 0.99]);
  await usaTec(page, "corteccia"); await aspettaTurnoPg(page);
  const d = await diario(page), m = d.match(/La corteccia attutisce il colpo \((\d+) → (\d+) danni\)/);
  vero(m, "manca la Pelle di Corteccia"); eq(Number(m[2]), Math.floor(Number(m[1]) / 2), "metà danni");
  eq(await page.evaluate(() => [pg.dannoFisico, scontro.pv, pg.risorsaUsata]), [Number(m[2]), 60 - 4 - 3, 4], "danni, acido, natura");
  eq(errori, [], "errori"); await chiudi();
});
caso("Sciamano: Linfa Furiosa — attacco in più e alla fine 1d6 di danni", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", SC(), PARTITA({ livello: 4, usate: { riposo: "sbloccato", tecPreparate: PREP4 } }));
  await page.evaluate(() => avviaScontro("mastino", { primo: "pg", soffioScarico: true })); await aspettaTurnoPg(page);
  await page.evaluate(() => { scontro.pv = 60; scontro.pvMax = 60; scontro.eff.linfaFuria = 1; });
  await accoda(page, [R(1, 20), R(1, 20), /* nemico */ R(1, 6), R(1, 20), /* fine della linfa */ R(5, 6)], [0.9]);
  await page.evaluate(() => attaccoPgScontro(false)); await aspettaTurnoPg(page);
  const d = await diario(page); vero(/La linfa furiosa ti spinge a colpire ancora/.test(d), "manca l'attacco in più");
  vero(/La linfa furiosa si spegne e ti lascia svuotato: 5 danni/.test(d), "manca il conto della linfa"); eq(await page.evaluate(() => pg.dannoFisico), 5);
  eq(errori, [], "errori"); await chiudi();
});
caso("Sciamano: via di Aldo — la passiva senza pulsante, Spore del Morbo fuori dai posti; Fame del Parassita alla vittoria", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", SC(), PARTITA({ livello: 3, risorsaUsata: 6, usate: { riposo: "sbloccato", tecPreparate: PREP3, via: "aldo" } }));
  eq(await page.evaluate(() => tecnicheDelPg().filter(x => x.via).map(x => x.t.id)), ["fame_parassita", "morbo"]);
  eq(await page.evaluate(() => tecnichePreparate().length), 5, "i posti restano 5");
  vero(/Signore delle Spore Putride/.test(await page.textContent("#tecnicheBox")), "manca il nome della via");
  await page.evaluate(() => avviaScontro("mastino", { primo: "pg", soffioScarico: true })); await aspettaTurnoPg(page);
  await page.evaluate(() => { scontro.pv = 1; scontro.eff.avvelenato = 2; scontro.velenoDado = 4; });
  await accoda(page, [R(18, 20), R(1, 6)]);
  await page.evaluate(() => attaccoPgScontro(false)); await aspettaFineScontro(page);
  eq(await page.evaluate(() => pg.risorsaUsata), 3, "6 − 3"); vero(/Fame del Parassita: \+3/.test(await diario(page)), "manca la Fame del Parassita");
  eq(errori, [], "errori"); await chiudi();
});
caso("Sciamano: la via si sceglie con i nomi dello Sciamano e la passiva", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", SC(), PARTITA({ livello: 3, usate: { riposo: "sbloccato", tecPreparate: PREP3 } }));
  await page.evaluate(() => apriSceltaVia());
  const t = await page.innerText("#prepBox");
  vero(/Signore delle Spore Putride/.test(t) && /Custode dei Boschi Sacri/.test(t), "nomi delle vie"); vero(/Fame del Parassita/.test(t) && /Rinascita del Sottobosco/.test(t), "abilità delle vie");
  await page.check('#prepBox input[value="guendalina"]'); await page.click("#prepBox button.primario");
  eq(await page.evaluate(() => [usate.via, tecnicheVia().map(t => t.id)]), ["guendalina", ["linfa_rigeneratrice", "balsamo"]]);
  eq(errori, [], "errori"); await chiudi();
});
caso("Sciamano: preparazione al riposo tra le tecniche della natura, con le quote dei livelli", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", SC(), PARTITA({ livello: 2, usate: { riposo: "sbloccato", tecPreparate: PREP2 } }));
  await page.evaluate(() => apriPreparazione(false));
  const vals = await page.$$eval('#prepBox input[name="tec"]', cs => cs.map(c => c.value));
  eq(vals.sort(), ["baccello", "corteccia", "infuso", "mandragora", "micelio", "muffa"].sort());
  vero(/qualsiasi arma/.test(await page.innerText("#prepBox")), "guida dello Sciamano"); vero(!(await page.$('#prepBox input[name="serie"]')), "niente serie della via");
  eq(errori, [], "errori"); await chiudi();
});
caso("Sciamano: Borsa dei veleni — 1d4 + livello punti natura, vuota resta nello zaino, il riposo la riempie", async (b) => {
  const pg = SC(); pg.equipaggiamento.dotazione = [{ nome: "Borsa dei veleni", usi: 3, desc: "x" }];
  const { page, errori, chiudi } = await apri(b, "gioco.html", pg, PARTITA({ risorsaUsata: 8 }));
  const id = await page.evaluate(() => zaino.find(x => x.nome === "Borsa dei veleni").id);
  await accoda(page, [R(2, 4)]);
  await page.evaluate((id) => usa(id), id);
  eq(await page.evaluate(() => [pg.risorsaUsata, zaino.find(x => x.nome === "Borsa dei veleni").usi]), [5, 2], "+3 e una dose in meno");
  vero(/Dosi rimaste: 2\/3/.test(await diario(page)), "manca il testo");
  await page.evaluate((id) => { zaino.find(x => x.id === id).usi = 0; usa(id); }, id);
  vero(await page.evaluate(() => !!zaino.find(x => x.nome === "Borsa dei veleni")), "la borsa vuota è sparita"); vero(/borsa dei veleni è vuota/.test(await diario(page)), "manca l'avviso");
  await page.evaluate(() => offriPreparazione());
  eq(await page.evaluate(() => zaino.find(x => x.nome === "Borsa dei veleni").usi), 3, "piena dopo il riposo");
  eq(errori, [], "errori"); await chiudi();
});
caso("Sciamano: la Borsa dei veleni non serve al Guerriero", async (b) => {
  const pg = PG(); pg.equipaggiamento.dotazione = [{ nome: "Borsa dei veleni", usi: 3, desc: "x" }];
  const { page, errori, chiudi } = await apri(b, "gioco.html", pg, PARTITA({ risorsaUsata: 5 }));
  await page.evaluate(() => usa(zaino.find(x => x.nome === "Borsa dei veleni").id));
  eq(await page.evaluate(() => [pg.risorsaUsata, zaino.find(x => x.nome === "Borsa dei veleni").usi]), [5, 3]);
  vero(/Solo uno Sciamano/.test(await diario(page)), "manca l'avviso"); eq(errori, [], "errori"); await chiudi();
});
caso("Creazione: lo Sciamano vede le 3 tecniche della natura e ne sceglie 2; la Borsa dei veleni solo per lui", async (b) => {
  const { page, errori, chiudi } = await apri(b, "creazione.html");
  const borsaVisibile = () => page.$$eval('#dotazione label', ls => ls.filter(l => !l.hidden).map(l => l.textContent).some(t => /Borsa dei veleni/.test(t)));
  await page.check('input[name="classe"][value="Soldato"]', { force: true }); vero(!(await borsaVisibile()), "il Guerriero vede la borsa");
  await page.check('input[name="classe"][value="Forestiero"]', { force: true });
  eq(await page.$$eval('#lista-tecniche .gruppo-tec', e => e.map(x => x.textContent)), ["Tecniche della natura"]);
  eq(await page.$$eval('#lista-tecniche input[name="tecnica"]:not(:disabled)', cs => cs.map(c => c.value)), ["mandragora", "micelio", "infuso"], "si prendono senza scegliere l'arma");
  vero(await borsaVisibile(), "lo Sciamano non vede la borsa");
  await page.check('#lista-tecniche input[value="mandragora"]', { force: true }); await page.check('#lista-tecniche input[value="micelio"]', { force: true });
  vero(await page.$eval('#lista-tecniche input[value="infuso"]', c => c.disabled), "la terza deve bloccarsi");
  eq(errori, [], "errori"); await chiudi();
});
caso("Regolamento: la sezione dello Sciamano ha regole, tecniche e vie in italiano e in inglese", async (b) => {
  const { page, errori, chiudi } = await apri(b, "regolamento.html");
  const t = await page.textContent("body");
  ["Punta di Mandragora", "Fioritura del Parassita Colossale", "Signore delle Spore Putride", "Custode dei Boschi Sacri", "Fame del Parassita", "Scudo di Corteccia", "Borsa dei veleni", "Avvelenato", "Tossina", "al massimo una volta per turno del nemico"].forEach(x => vero(t.includes(x), "manca: " + x));
  vero(!t.includes("Le tecniche dello Sciamano sono in preparazione"), "resta l'avviso di preparazione");
  await page.evaluate(() => { localStorage.setItem("lingua", "en"); }); await page.reload();
  const e = await page.textContent("body");
  ["Mandrake Tip", "Bloom of the Colossal Parasite", "Lord of the Rotting Spores", "Keeper of the Sacred Woods", "Parasite's Hunger", "Bark Shield", "Poison pouch", "Poisoned", "Toxin"].forEach(x => vero(e.includes(x), "missing: " + x));
  eq(errori, [], "errori"); await chiudi();
});
caso("Sciamano in inglese: tecnica, veleno e recupero si leggono in inglese", async (b) => {
  const { page, errori, chiudi } = await apri(b, "gioco.html", SC(), PARTITA({ usate: { riposo: "sbloccato" } }));
  await page.evaluate(() => { localStorage.setItem("lingua", "en"); }); await page.reload(); await page.waitForLoadState("networkidle").catch(() => {});
  await page.evaluate(() => avviaScontro("mastino", { primo: "pg", soffioScarico: true })); await aspettaTurnoPg(page);
  await page.evaluate(() => { scontro.pv = 60; scontro.pvMax = 60; });
  await accoda(page, [R(18, 20), R(4, 6), R(2, 4), R(1, 6), R(1, 20)], [0.9]);
  await usaTec(page, "mandragora"); await aspettaTurnoPg(page);
  const d = await diario(page); vero(/The poison burns: 2 damage/.test(d), "manca il tick in inglese"); vero(/Force of nature/.test(d), "manca il recupero in inglese");
  eq(errori, [], "errori"); await chiudi();
});


/* ======================= Sala di prova ======================= */
caso("Sala di prova: lo Sciamano vede le tecniche della natura; Mandragora avvelena e il veleno restituisce natura", async (b) => {
  const { page, errori, chiudi } = await apri(b, "tutorial.html?prova");
  await page.selectOption("#pClasse", "sciamano"); await page.fill("#pMen", "12"); await page.dispatchEvent("#pMen", "change");
  await page.selectOption("#nTipo", "manichino"); await page.click("#svNuovo");
  const ids = await page.$$eval("#svTec [data-tec]", bs => bs.map(x => x.dataset.tec)); eq(ids, ["mandragora", "micelio", "infuso"]);
  eq(await page.evaluate(() => SalaProva.stato().pg.iraMax), 11, "10 + Spirito 1");
  await page.evaluate(() => SalaProva.accoda(15, 4, /* veleno */ 2));
  await page.click('[data-tec="mandragora"]');
  const st = await page.evaluate(() => ({ nat: SalaProva.stato().pg.ira, av: SalaProva.stato().s.eff.avvelenato, pv: SalaProva.stato().s.pv }));
  eq([st.nat, st.av, st.pv], [10, 1, 60 - 7 - 2], "11 − 2 + 1, veleno 2 → 1");
  vero(/Forza della natura/.test(await page.innerText("#svLog")), "manca il recupero"); vero(/Avvelenato 1d4/.test(await page.innerText("#svNem")), "scheda nemico");
  eq(errori, [], "errori"); await chiudi();
});
caso("Sala di prova: «Esegui i test» comprende anche i test dello Sciamano, tutti superati", async (b) => {
  const { page, errori, chiudi } = await apri(b, "tutorial.html?prova");
  await page.click("#svTestBtn");
  const esiti = await page.evaluate(() => window.esitiTestCombattimento);
  eq(esiti.filter(e => !e.ok), [], "test falliti"); vero(esiti.some(e => /Punta di Mandragora/.test(e.nome)), "mancano i test dello Sciamano");
  eq(errori, [], "errori"); await chiudi();
});

(async () => {
  const browser = await chromium.launch();
  let ko = 0;
  const scelti = process.env.SOLO ? casi.filter(c => c.nome.includes(process.env.SOLO)) : casi; /* SOLO="Scudo" per lanciarne solo alcuni */
  for (const { nome, fn } of scelti) {
    try { await fn(browser); console.log("OK     " + nome); }
    catch (e) { ko++; console.log("ERRORE " + nome + "\n       → " + e.message.split("\n")[0]); }
  }
  await browser.close();
  console.log(`\n${scelti.length - ko} / ${scelti.length} superati`);
  process.exit(ko ? 1 : 0);
})();
