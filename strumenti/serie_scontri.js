/* Serie automatica di scontri nella pagina di test (stesso motore della sala di prova): percentuale di vittorie per classe e caso.
   Uso: python3 -m http.server 8765 --bind 127.0.0.1, poi  N=150 node strumenti/serie_scontri.js
   Opzioni: PORT (porta del server, predefinita 8765), MISTO=1 (04/11: prepara metà e metà tra le due scuole), VIA=scuola (04/11: incantatori con la via della loro scuola dal livello 3), N (scontri per caso), SOLO_ENEA=1 (solo Enea col fermaglio), CLASSI=guerriero,monaco. Equipaggiamento e preparazione rispettano le regole di classe (03/11). Il giocatore automatico è pessimista: confronta le versioni, non leggere i numeri come assoluti. */
const { chromium } = require('playwright');
const N = Number(process.env.N || 300);
const MEDIO = process.env.BOT !== 'vecchio'; /* 03/11: predefinito il giocatore medio che gioca le combo; BOT=vecchio per il confronto */
const CASI0 = [
  { nem: 'ettore', liv: 2 },
  { nem: 'enea', liv: 3, fermaglio: true, lato: 'casuale' },
  { nem: 'enea', liv: 3, fermaglio: false, lato: 'casuale' },
  { nem: 'enea', liv: 3, fermaglio: true, lato: 'maglio' },
];
const CASI = process.env.CASI ? process.env.CASI.split(',').map(x => { const [nem, liv] = x.split(':'); return { nem, liv: Number(liv) || 1 }; }) /* 04/11: CASI=mastino:2,mastino:3 */ : process.env.SOLO_ENEA ? [{ nem: 'enea', liv: 3, fermaglio: true, lato: 'casuale' }] : CASI0;
const CLASSI = process.env.CLASSI ? process.env.CLASSI.split(',') : ['guerriero', 'sciamano', 'arcanista', 'monaco'];
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); const err = [];
  p.on('pageerror', e => err.push(e.message));
  await p.goto(`http://127.0.0.1:${process.env.PORT || 8765}/test.html`); if (process.env.MISTO) await p.evaluate(() => { window.PREP_MISTO = true; }); /* 04/11: giocatore misto, metà e metà tra le scuole */ /* 03/11: PORT per più serie in parallelo (ognuna su una copia dei file, così le modifiche in corso non si mescolano) */ await p.waitForTimeout(800);
  const righe = [];
  for (const c of CASI) for (const cl of CLASSI) {
    await p.selectOption('#pLiv', String(c.liv)); await p.selectOption('#pClasse', cl); if (process.env.SCUOLA && (cl === 'arcanista' || cl === 'monaco')) await p.selectOption('#pScuola', process.env.SCUOLA.split(',')[cl === 'arcanista' ? 0 : 1] || process.env.SCUOLA);
    /* 04/11: VIA=scuola → dal livello 3 gli incantatori prendono la via della loro scuola preferita (Guendalina per Arcano e Vita, Aldo per Forza e Negromanzia) */
    if (process.env.VIA === 'scuola' && c.liv >= 3 && (cl === 'arcanista' || cl === 'monaco')) { const sc = await p.$eval('#pScuola', x => x.value); await p.selectOption('#pVia', sc === 'arcano' || sc === 'luce' ? 'guendalina' : 'aldo'); }
    else if (c.liv >= 3) await p.selectOption('#pVia', '');
    await p.selectOption('#nTipo', c.nem);
    if (c.nem === 'enea') { await p.setChecked('#nFermaglio', c.fermaglio); await p.selectOption('#nEneaLato', c.lato); await p.selectOption('#nEneaMossa', 'casuale'); }
    const r = await p.evaluate(([N, MEDIO]) => {
      const SP = window.SalaProva; let vinte = 0, pvRest = 0, turni = 0;
      const lista = (sel) => [...document.querySelectorAll(sel)].filter(x => !x.disabled);
      for (let i = 0; i < N; i++) {
        window.SalaProvaPrepara(MEDIO ? 'combo' : true); SP.nuovoScontro(); let g = 0; /* 03/11: preparazione legale a caso (posti, quote, scuola principale) a ogni scontro */
        while (!SP.stato().finito && g++ < 200) {
          const st = SP.stato(); if (!st.turnoPg) break;
          const pg = st.pg, s = st.s, basso = pg.pv < pg.pvMax * 0.4;
          if (s && s.carica) { /* Enea carica: osserva, poi colpisci (interrompe) o difenditi se sei basso */
            if (!s.osservato) SP.osserva();
            if (basso && s.carica === 'vera') { SP.difendo(); continue; }
          }
          let fatto = false;
          const t0 = st.nTurno, fine = () => SP.stato().nTurno !== t0 || SP.stato().finito; /* 03/11: un'azione è passata quando cambia il turno */
          const clicca = (xs) => { for (const x of xs) { if (x.disabled) continue; x.click(); if (fine()) return true; } return false; };
          if (MEDIO) { /* 03/11: giocatore medio — legge le etichette delle combo come farebbe una persona */
            const righe = lista('#svTec button[data-inc]').map(x => ({ x, r: x.closest('.tec'), c: (x.closest('.tec').querySelector('.combo') || { textContent: '' }).textContent }));
            const cura = righe.filter(o => /Cura|cura|ti curi/.test(o.r.querySelector('.eff').textContent) && !/Patto/.test(o.r.textContent));
            if (basso && clicca(cura.map(o => o.x))) continue;
            if (s && s.carica === 'vera' && clicca(righe.filter(o => /Difesa/.test(o.c)).map(o => o.x))) continue;
            if (clicca(righe.filter(o => /Combo pronta/.test(o.c)).map(o => o.x))) continue;
            const sig = Number(s && s.sigilli) || 0;
            if (sig >= 2 && clicca(righe.filter(o => /da far esplodere/.test(o.c)).map(o => o.x))) continue;
            if (clicca(righe.filter(o => /Incide/.test(o.c) && !/vanno persi|Difesa/.test(o.c)).sort((a, b) => /\dd\d/.test(b.r.querySelector('.eff').textContent) - /\dd\d/.test(a.r.querySelector('.eff').textContent) || Math.random() - 0.5).map(o => o.x))) continue; /* prima chi incide e fa danno */
            if (clicca(righe.filter(o => /Porta la Bilancia|Giudizio con/.test(o.c)).map(o => o.x))) continue;
            const altri = lista('#svTec button[data-tec]').concat(righe.filter(o => !/Difesa|Serve almeno|solo il colpo/.test(o.c) && !cura.includes(o)).map(o => o.x));
            if (clicca(altri.sort(() => Math.random() - 0.5).slice(0, 3))) continue;
            SP.attaccoNormale(); continue;
          }
          const cure = lista('#svTec button[data-inc]').filter(x => /Cura|cura/.test(x.closest('.tec').textContent) && !/Patto/.test(x.closest('.tec').textContent));
          if (basso && cure.length) { cure[0].click(); fatto = fine(); }
          if (!fatto && Math.random() < 0.6) {
            const opz = lista('#svTec button[data-tec], #svTec button[data-inc]').filter(x => !/^Cura|Cura /.test(x.closest('.tec').querySelector('.eff') ? x.closest('.tec').querySelector('.eff').textContent : ''));
            for (let k = 0; k < 3 && !fatto && opz.length; k++) { const x = opz[Math.floor(Math.random() * opz.length)]; x.click(); fatto = fine(); }
          }
          if (!fatto) SP.attaccoNormale();
        }
        const st = SP.stato(); turni += g;
        if (st.pg.pv > 0) { vinte++; pvRest += st.pg.pv / st.pg.pvMax; }
        SP.riposa();
      }
      return { vinte, pvRest: vinte ? pvRest / vinte : 0, turni: turni / N };
    }, [N, MEDIO]);
    righe.push(`${(c.nem + (c.nem === 'enea' ? (c.fermaglio ? ' fermaglio' : ' nascosto') + ' ' + c.lato : '')).padEnd(26)} ${cl.padEnd(10)} ${Math.round(100 * r.vinte / N)}% vittorie · salute residua media ${Math.round(100 * r.pvRest)}% · ${r.turni.toFixed(1)} turni`);
  }
  console.log(righe.join('\n')); console.log('errori pagina:', err.length, err.slice(0, 3).join(' | '));
  await b.close();
})();
