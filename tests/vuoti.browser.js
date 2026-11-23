/* Test nel browser dei vuoti negli agguati (22/11/2026): vuoti.md, diari_vuoti.md, mondo_e_incontri.md sez. 4.
   Col motore nuovo: agguati fin dall'inizio (anche prima del bronzo), fascia dal fermaglio, prova di agguato,
   diario sempre (gli otto con nome una volta sola), niente resa. Il vecchio motore resta com'era.
   Uso: python3 -m http.server 8765 --bind 127.0.0.1, poi node tests/vuoti.browser.js */
const { chromium } = require("playwright");
const BASE = process.env.BASE || "http://127.0.0.1:8765/";
const casi = [];
const caso = (nome, fn) => casi.push({ nome, fn });
const eq = (a, b, msg) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${msg || "atteso"}: ${JSON.stringify(b)}, ottenuto ${JSON.stringify(a)}`); };
const vero = (x, msg) => { if (!x) throw new Error(msg || "atteso vero"); };

const PG = () => ({
  nome: "Prova", razza: "Umano", classe: "Soldato", livello: 1, immagine: null, motore: 2, spec: "berserker",
  scelte: ["colpo_poderoso", "colpo_di_mestiere", "spezza_guardia", "assalto_implacabile"],
  statisticheBase: { Vigore: 16, "Agilità": 12, Mente: 12, Spirito: 12 }, statistiche: { Vigore: 16, "Agilità": 12, Mente: 12, Spirito: 12 },
  modificatori: { Vigore: 3, "Agilità": 1, Mente: 1, Spirito: 1 }, tiroDado: { dado: 10, valore: 10 }, puntiVita: 23, saluteMentale: 21,
  classeArmatura: 14, mana: null, risorsa: null, incantesimi: [], tecniche: [], modalita: "facile", idPartita: "test",
  abilita: [{ nome: "Atletica", attributo: "Vigore", valore: 4 }, { nome: "Percezione", attributo: "Mente", valore: 2 }],
  equipaggiamento: { arma: "Spada corta", armaDanno: "1d6", armaTipoDanno: "Tagliente", armaMani: 1, armatura: "Armatura media", armaturaCA: 4, malusAgilita: 0, scudo: null, dotazione: [] }
});
const PARTITA = (o) => Object.assign({
  usate: { riposo: "sbloccato" }, diario: [{ tipo: "narra", stanza: "giardino", righe: ["x"] }], luogo: "giardino", livello: 1,
  crescita: { salute: 0, mente: 0, risorsa: 0 }, risorsaUsata: 0, esperienza: 0, ora: Date.now(), zaino: []
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
  return { page, errori, chiudi: () => ctx.close() };
}
/* fa partire un vuoto e lo chiude con una vittoria; restituisce ciò che serve ai controlli */
const vuotoVinto = (page, tiri) => page.evaluate(async (tiri) => {
  const P0 = Nemici.provaAgguato; /* i due d20 della prova: prima il giocatore, poi il vuoto */
  if (tiri) Nemici.provaAgguato = (n, p, bo, c, o) => { const t = [...tiri]; return P0(n, p, bo, { tira: () => t.shift() }, o); };
  avviaVuoto();
  const N = scontro.N.nem, info = { id: N.id, nome: N.nome, fascia: N.fascia, vuoto: N.vuoto, maledetto: N.maledetto, primo: scontro.primo,
    vu: scontro.vuoto, sorpresoNem: !!(N.buff && N.buff.sorpreso), sorpresoPg: !!(scontro.N.pg.buff && scontro.N.pg.buff.sorpreso),
    prova: diario.filter(e => e.tipo === "prova").map(e => e.titolo).find(t => /Agguato/.test(t)) || "" };
  Nemici.provaAgguato = P0;
  await new Promise(r => setTimeout(r, 50));
  scontro.N.nem.pv = 0; scontro.pv = 0; vittoriaScontro();
  await new Promise(r => setTimeout(r, 50));
  info.visti = usate.vuoti_visti || [];
  info.diari = zaino.filter(x => /^diario_vuoto_/.test(x.id)).map(x => [x.id, x.tipo, !!x.testo]);
  info.scontro = !!scontro;
  return info;
}, tiri || null);

caso("Agguato col motore nuovo: prima del bronzo esce un vuoto di fascia 0 (non un goblin)", async (b) => {
  const { page, errori, chiudi } = await apri(b, PG(), PARTITA());
  const r = await page.evaluate(() => {
    const seq = [0.0, 0.99, 0.99]; const R = Math.random; Math.random = () => (seq.length ? seq.shift() : R()); /* incontro sì, poi agguato */
    usate.ultimo_luogo_visto = "giardino"; incontroZona(false);
    Math.random = R;
    return scontro ? { id: scontro.id, nem: scontro.N && scontro.N.nem.id, ctx: scontro.ctx } : null;
  });
  vero(r, "nessuno scontro partito");
  eq(r.id, "vuoto"); eq(r.ctx, "agguato"); vero(/^vuoto:0:/.test(r.nem), "fascia 0: " + r.nem);
  eq(errori, [], "errori nella pagina"); await chiudi();
});

caso("Prova di agguato riuscita: agisci per primo e il vuoto ha −2 CA; diario nello zaino", async (b) => {
  const { page, errori, chiudi } = await apri(b, PG(), PARTITA());
  const r = await vuotoVinto(page, [20, 1]);
  eq(r.vuoto, true); eq(r.maledetto, true); eq(r.fascia, 0); eq(r.primo, "pg"); eq(r.sorpresoNem, true); eq(r.sorpresoPg, false);
  vero(/Agguato/.test(r.prova), "riga della prova: " + r.prova);
  eq(r.visti.length, 1); eq(r.diari.length, 1); eq(r.diari[0][1], "nota"); eq(r.diari[0][2], true);
  eq(r.scontro, false);
  eq(errori, [], "errori nella pagina"); await chiudi();
});

caso("Prova di agguato fallita: il vuoto agisce per primo e tu hai −2 CA", async (b) => {
  const { page, errori, chiudi } = await apri(b, PG(), PARTITA());
  const r = await page.evaluate(() => {
    const P0 = Nemici.provaAgguato; Nemici.provaAgguato = (n, p, bo, c, o) => P0(n, p, bo, { tira: (() => { const t = [1, 20]; return () => t.shift(); })() }, o);
    avviaVuoto(); Nemici.provaAgguato = P0;
    return { primo: scontro.primo, pg: !!scontro.N.pg.buff.sorpreso, nem: !!scontro.N.nem.buff.sorpreso };
  });
  eq(r, { primo: "nem", pg: true, nem: false });
  await page.waitForTimeout(300);
  eq(errori, [], "errori nella pagina"); await chiudi();
});

caso("Fascia dal fermaglio: argento → fascia 2 (32 salute); platino → fascia 4", async (b) => {
  const { page, errori, chiudi } = await apri(b, PG(), PARTITA({ usate: { riposo: "sbloccato", fermaglio: "argento" } }));
  const r = await vuotoVinto(page, [20, 1]);
  eq(r.fascia, 2);
  const f4 = await page.evaluate(() => { usate.fermaglio = "platino"; avviaVuoto(); const n = scontro.N.nem; const x = [n.fascia, n.pvMax, n.caBase]; scontro.N.nem.pv = 0; scontro.pv = 0; vittoriaScontro(); return x; });
  eq(f4, [4, 44, 15]);
  eq(errori, [], "errori nella pagina"); await chiudi();
});

caso("I vuoti con nome escono una volta sola; poi vuoti senza nome, senza diario", async (b) => {
  const { page, errori, chiudi } = await apri(b, PG(), PARTITA());
  const tot = await page.evaluate(() => VUOTI_AGGUATO.length);
  eq(tot, 16, "vuoti con nome");
  let nomi = [];
  for (let i = 0; i < tot; i++) { const r = await vuotoVinto(page, [20, 1]); nomi.push(r.nome); }
  eq(new Set(nomi).size, tot, "nomi diversi: " + nomi.join(", "));
  const r9 = await vuotoVinto(page, [20, 1]);
  eq(r9.nome, "Vuoto"); eq(r9.visti.length, tot); eq(r9.diari.length, tot);
  eq(errori, [], "errori nella pagina"); await chiudi();
});

caso("Bottino: con la scorta piena (8 posti) l'equipaggiamento resta sul corpo; il diario entra comunque", async (b) => {
  const piena = Array.from({ length: 8 }, (_, i) => ({ id: "s" + i, nome: "Armatura leggera", tipo: "armatura", ca: 1 }));
  const { page, errori, chiudi } = await apri(b, PG(), PARTITA({ zaino: piena }));
  const r = await page.evaluate(() => {
    const R = Math.random; Math.random = () => 0.01; /* tutto cade */
    bottinoVuoto({ id: "tancredi", arch: "carica", fascia: 0 }); Math.random = R;
    return { scorta: postiScorta(), diario: zaino.some(x => x.id === "diario_vuoto_tancredi"), msg: diario.slice(-1)[0].righe.join(" ") };
  });
  eq(r.scorta, 8); eq(r.diario, true); vero(/resta sul corpo/.test(r.msg), r.msg);
  eq(errori, [], "errori nella pagina"); await chiudi();
});

caso("Caccia col motore nuovo: la preda è il vuoto élite (Gualtiero), nota di Aldo dal motore, diario alla vittoria", async (b) => {
  const { page, errori, chiudi } = await apri(b, PG(), PARTITA({ usate: { riposo: "sbloccato", fermaglio: "bronzo", q4: "completata", cc_stato: "attiva", cc_preda: "bruto", cc_grado: 1 } }));
  const r = await page.evaluate(async () => {
    const nota = notaAldo("bruto");
    avviaScontro("bruto", { ctx: "caccia", testi: "bruto" });
    const N = scontro.N.nem, info = { id: N.id, nome: N.nome, caccia: N.caccia, pv: N.pvMax, scheda: CB.nome, nota };
    await new Promise(r => setTimeout(r, 50));
    scontro.N.nem.pv = 0; scontro.pv = 0; vittoriaScontro();
    await new Promise(r => setTimeout(r, 50));
    info.diario = zaino.some(x => x.id === "diario_vuoto_gualtiero"); info.trofeo = zaino.some(x => x.id === "trofeo_caccia"); info.stato = usate.cc_stato;
    info.studio = vociStudio("troll", "studia").map(v => v[1]); info.guarda = vociStudio("troll", "guarda").map(v => v[1]);
    return info;
  });
  eq(r.id, "caccia:gualtiero"); eq(r.caccia, true); eq(r.nome, "Gualtiero Pietrafenda"); eq(r.scheda, "Gualtiero Pietrafenda"); eq(r.pv, 39);
  vero(/psichico/.test(r.nota) && /contundente/.test(r.nota), "nota di Aldo: " + r.nota);
  eq(r.diario, true); eq(r.trofeo, true); eq(r.stato, "trofeo");
  vero(/forza/.test(r.studio[0]) && /perforante/.test(r.studio[1]), "studio di Brunilde: " + r.studio.join(" | "));
  vero(/taglio/.test(r.guarda[2]), "danno di Brunilde (Trappolista): " + r.guarda[2]);
  eq(errori, [], "errori nella pagina"); await chiudi();
});

caso("Il vuoto non si arrende (niente resa a un terzo della salute)", async (b) => {
  const { page, errori, chiudi } = await apri(b, PG(), PARTITA());
  const r = await page.evaluate(() => { avviaVuoto(); scontro.pv = 1; return typeof resaPossibile === "undefined" && !scontro.resa; });
  eq(r, true, "la resa dei vecchi agguati non esiste più e il vuoto non ha resa");
  eq(errori, [], "errori nella pagina"); await chiudi();
});

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ["--no-sandbox"] });
  let ok = 0;
  for (const c of casi) {
    try { await c.fn(browser); ok++; console.log("✓ " + c.nome); }
    catch (e) { console.log("✗ " + c.nome + "\n   " + e.message); }
  }
  await browser.close();
  console.log(`\n${ok}/${casi.length} superati`);
  process.exit(ok === casi.length ? 0 : 1);
})();
