/* Test delle vie di prestigio (Aldo: la caccia; Guendalina: il focolare) sul motore nuovo. Uso: node tests/scontro_vie.test.js */
(function (root) {
  const inNode = typeof module !== "undefined" && module.exports && typeof require === "function";
  if (inNode) { root.window = root; require("../js/poteri.js"); require("../js/specializzazioni.js"); require("../js/scontro.js"); }
  const P = root.Poteri, S = root.Scontro;

  function dadi(seq) {
    const q = [...seq];
    const f = (d) => { if (!q.length) throw new Error(`tiro in più (d${d}) non previsto`); const v = q.shift(); if (v < 1 || v > d) throw new Error(`valore ${v} impossibile su d${d}`); return v; };
    f.resto = () => q.length;
    return f;
  }
  const ctx = (seq) => ({ tira: dadi(seq) });
  const fine = (c) => { if (c.tira.resto()) throw new Error(`dadi avanzati: ${c.tira.resto()}`); };
  const guerriero = (o) => Object.assign({ nome: "pg", liv: 3, pv: 30, pvMax: 30, modClasse: 3, mod: { Vigore: 3, Spirito: 0 }, caBase: 16,
    arma: { dado: 6, tipo: "taglio" }, tratti: [], spec: "esecutore" }, o || {});
  const nemico = (o) => Object.assign({ nome: "nem", liv: 1, pv: 40, pvMax: 40, modAtt: 2, modDanno: 1, mod: {}, caBase: 12, arma: { dado: 6, tipo: "taglio" } }, o || {});
  const ev = (r, k) => (r.eventi || r).filter(e => e && e.k === k);

  const casi = [];
  const caso = (nome, fn) => casi.push({ nome, fn });
  const eq = (a, b, msg) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${msg || "atteso"}: ${JSON.stringify(b)}, ottenuto ${JSON.stringify(a)}`); };
  const vero = (x, msg) => { if (!x) throw new Error(msg || "atteso vero"); };

  /* ===== Aldo, la caccia ===== */
  caso("Occhio del cacciatore (3): il primo potere che fa danno tira il doppio dei dadi, una volta per scontro", () => {
    const g = guerriero({ via: "aldo" }), n = nemico(), c = ctx([10, 1, 1, 10, 1]);
    S.usa(g, n, "colpo_poderoso", c); eq(n.pv, 35); S.usa(g, n, "colpo_poderoso", c); eq(n.pv, 31); fine(c);
    S.fineScontro(g); vero(!g.occhioUsato, "torna a ogni scontro");
  });
  caso("Occhio del cacciatore: vale anche per il danno senza tiro (doppio dei dadi)", () => {
    const a = { nome: "pg", liv: 3, pv: 24, pvMax: 24, modClasse: 3, mod: { Mente: 3 }, caBase: 12, focus: { dado: 8 }, arma: { dado: 6, tipo: "contundente" }, spec: "illusione", via: "aldo", copie: 1 };
    const n = nemico(), c = ctx([1, 1]); S.usa(a, n, "frantumare", c); eq(n.pv, 35); fine(c);
  });
  caso("Odore del sangue (4): contro un Vacillante i poteri a volontà fanno un dado in più", () => {
    const g = guerriero({ via: "aldo", liv: 4, occhioUsato: true }), n = nemico({ pv: 19 }), c = ctx([10, 1, 1, 10, 1, 1, 15]);
    S.usa(g, n, "colpo_poderoso", c); eq(n.pv, 14); S.usa(g, n, "colpo_crudele", c); eq(n.pv, 9, "per scontro: niente dado in più"); fine(c);
  });
  caso("Senza scampo (5): diventato Vacillante, attacco gratuito con l'offesa a volontà, senza stati", () => {
    const g = guerriero({ via: "aldo", liv: 5, occhioUsato: true }), n = nemico({ pv: 22 }), c = ctx([10, 1, 2]);
    const r = S.usa(g, n, "colpo_di_mestiere", c); /* 22 − 1 = 21: non ancora Vacillante (sotto 20) */
    eq(ev(r, "senzaScampo").length, 0); fine(c);
    const g2 = guerriero({ via: "aldo", liv: 5, occhioUsato: true }), n2 = nemico({ pv: 22 }), c2 = ctx([10, 3, 10, 1, 1]);
    const r2 = S.usa(g2, n2, "colpo_poderoso", c2); /* 22 − 6 = 16: Vacillante → Colpo poderoso gratis; al 5 vale anche Odore del sangue: 2 dadi, 1 + 1 + 3 = 5 */
    eq(ev(r2, "senzaScampo").length, 1); eq(n2.pv, 11); vero(!P.ha(n2, "sanguinante")); fine(c2);
    const c3 = ctx([10, 1, 1]); eq(ev(S.usa(g2, n2, "colpo_poderoso", c3), "senzaScampo").length, 0, "una volta per scontro"); fine(c3);
  });

  /* ===== Guendalina, il focolare ===== */
  caso("La lanterna (3): immune a Impaurito e +2 a tutti i tiri salvezza", () => {
    const g = S.preparaScontro(guerriero({ via: "guendalina" }));
    eq(g.bonusTs, 2); eq(ev(P.applica(g, "impaurito", { fonte: { liv: 1, modClasse: 3 }, tira: dadi([]) }), "immune").length, 1);
    const z = P.tiroSalvezza(g, "sanguinante", { liv: 1, modClasse: 3 }, dadi([6])); eq(z.tot, 6 + 3 + 3 + 2);
  });
  caso("Mani che curano (4): il potere di classe cura 1/3 e toglie uno stato", () => {
    const g = guerriero({ via: "guendalina", liv: 4, pv: 10, stati: { esposto: { liv: 1, turni: 2 } } }); S.usa(g, nemico(), "secondo_vento", ctx([]));
    eq(g.pv, 20); vero(!P.ha(g, "esposto"));
  });
  caso("La soglia di casa (5): il colpo che ti renderebbe Vacillante fa metà danno, +2 CA per 2 turni", () => {
    const g = guerriero({ via: "guendalina", liv: 5, pv: 18 }), n = nemico({ modDanno: 5 }), c = ctx([18, 6]);
    S.attacco(n, g, {}, c); eq([g.pv, S.ca(g)], [12, 18]); fine(c);
    const c2 = ctx([18, 1]); S.attacco(n, g, {}, c2); eq(g.pv, 6, "una volta per scontro"); fine(c2);
  });

  function esegui() { return casi.map(({ nome, fn }) => { try { fn(); return { nome, ok: true }; } catch (e) { return { nome, ok: false, errore: e.message }; } }); }
  root.TestScontroVie = { esegui, casi };
  if (inNode && require.main === module) {
    const esiti = esegui();
    esiti.forEach(e => console.log(`${e.ok ? "OK    " : "ERRORE"} ${e.nome}${e.ok ? "" : "\n       → " + e.errore}`));
    const ko = esiti.filter(e => !e.ok).length;
    console.log(`\n${esiti.length - ko} / ${esiti.length} superati`);
    process.exit(ko ? 1 : 0);
  }
})(typeof window !== "undefined" ? window : globalThis);
