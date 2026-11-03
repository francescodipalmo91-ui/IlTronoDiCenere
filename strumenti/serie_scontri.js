/* Serie automatica di scontri nella pagina di test (stesso motore della sala di prova): percentuale di vittorie per classe e caso.
   Uso: python3 -m http.server 8765 --bind 127.0.0.1, poi  N=150 node strumenti/serie_scontri.js
   Opzioni: N (scontri per caso), SOLO_ENEA=1 (solo Enea col fermaglio), CLASSI=guerriero,monaco. Equipaggiamento e preparazione rispettano le regole di classe (03/11). Il giocatore automatico è pessimista: confronta le versioni, non leggere i numeri come assoluti. */
const { chromium } = require('playwright');
const N = Number(process.env.N || 300);
const CASI0 = [
  { nem: 'ettore', liv: 2 },
  { nem: 'enea', liv: 3, fermaglio: true, lato: 'casuale' },
  { nem: 'enea', liv: 3, fermaglio: false, lato: 'casuale' },
  { nem: 'enea', liv: 3, fermaglio: true, lato: 'maglio' },
];
const CASI = process.env.SOLO_ENEA ? [{ nem: 'enea', liv: 3, fermaglio: true, lato: 'casuale' }] : CASI0;
const CLASSI = process.env.CLASSI ? process.env.CLASSI.split(',') : ['guerriero', 'sciamano', 'arcanista', 'monaco'];
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); const err = [];
  p.on('pageerror', e => err.push(e.message));
  await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(800);
  const righe = [];
  for (const c of CASI) for (const cl of CLASSI) {
    await p.selectOption('#pLiv', String(c.liv)); await p.selectOption('#pClasse', cl);
    await p.selectOption('#nTipo', c.nem);
    if (c.nem === 'enea') { await p.setChecked('#nFermaglio', c.fermaglio); await p.selectOption('#nEneaLato', c.lato); await p.selectOption('#nEneaMossa', 'casuale'); }
    const r = await p.evaluate((N) => {
      const SP = window.SalaProva; let vinte = 0, pvRest = 0, turni = 0;
      const lista = (sel) => [...document.querySelectorAll(sel)].filter(x => !x.disabled);
      for (let i = 0; i < N; i++) {
        window.SalaProvaPrepara(true); SP.nuovoScontro(); let g = 0; /* 03/11: preparazione legale a caso (posti, quote, scuola principale) a ogni scontro */
        while (!SP.stato().finito && g++ < 200) {
          const st = SP.stato(); if (!st.turnoPg) break;
          const pg = st.pg, s = st.s, basso = pg.pv < pg.pvMax * 0.4;
          if (s && s.carica) { /* Enea carica: osserva, poi colpisci (interrompe) o difenditi se sei basso */
            if (!s.osservato) SP.osserva();
            if (basso && s.carica === 'vera') { SP.difendo(); continue; }
          }
          const prima = st.turnoPg; let fatto = false;
          const cure = lista('#svTec button[data-inc]').filter(x => /Cura|cura/.test(x.closest('.tec').textContent) && !/Patto/.test(x.closest('.tec').textContent));
          if (basso && cure.length) { cure[0].click(); fatto = !SP.stato().turnoPg || SP.stato().finito; }
          if (!fatto && Math.random() < 0.6) {
            const opz = lista('#svTec button[data-tec], #svTec button[data-inc]').filter(x => !/^Cura|Cura /.test(x.closest('.tec').querySelector('.eff') ? x.closest('.tec').querySelector('.eff').textContent : ''));
            for (let k = 0; k < 3 && !fatto && opz.length; k++) { const x = opz[Math.floor(Math.random() * opz.length)]; x.click(); fatto = !SP.stato().turnoPg || SP.stato().finito; }
          }
          if (!fatto) SP.attaccoNormale();
        }
        const st = SP.stato(); turni += g;
        if (st.pg.pv > 0) { vinte++; pvRest += st.pg.pv / st.pg.pvMax; }
        SP.riposa();
      }
      return { vinte, pvRest: vinte ? pvRest / vinte : 0, turni: turni / N };
    }, N);
    righe.push(`${(c.nem + (c.nem === 'enea' ? (c.fermaglio ? ' fermaglio' : ' nascosto') + ' ' + c.lato : '')).padEnd(26)} ${cl.padEnd(10)} ${Math.round(100 * r.vinte / N)}% vittorie · salute residua media ${Math.round(100 * r.pvRest)}% · ${r.turni.toFixed(1)} turni`);
  }
  console.log(righe.join('\n')); console.log('errori pagina:', err.length, err.slice(0, 3).join(' | '));
  await b.close();
})();
