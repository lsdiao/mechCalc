/* Probe n1-dependence of p1 / C / dP1-table (PJ), and p1 vs de1 for all types */
var pv = require('./pvlib.js');
function pr(bs, n1, de1, dE, i) { return pv.post('polyvPrFormula', { beltSize: bs, n1: n1, de1: de1, deltaE: dE, i: i, kL: 1, kAlpha: 1 }).resultData; }
function p1q(bs, n1, de1, i) { return pv.post('polyvP1Query', { beltSize: bs, n1: n1, de1: de1, i: i }).resultData; }
var out = { n1: [], bands980: [], bands2900: [], de_pj: [], de_pk: [], de_pl: [], de_pm: [] };
// A) n1 sweep PJ de20
for (var n1 = 200; n1 <= 6000; n1 += 100) {
  var q = p1q('PJ', n1, 20, 1.5), r = pr('PJ', n1, 20, 1.1, 1.5);
  out.n1.push([n1, q && q.p1, q && q.deltaP1, r]);
  pv.sleep(300);
}
// B) bands at 980 / 2900
var ilist = [1.005, 1.03, 1.08, 1.15, 1.22, 1.32, 1.48, 1.7, 2.5, 4];
[980, 2900].forEach(function (n1) {
  ilist.forEach(function (i) {
    out[n1 === 980 ? 'bands980' : 'bands2900'].push([i, p1q('PJ', n1, 20, i)]);
    pv.sleep(300);
  });
});
// C) de sweeps at n1=1460 i=1
var lists = {
  de_pj: ['PJ', 1.1, [20, 22.4, 25, 28, 31.5, 33.5, 35.5, 37.5, 40, 42.5, 45, 47.5, 50, 53, 56, 60, 63, 71, 75, 80, 90, 95, 100, 106, 112, 118, 125, 132, 140, 150, 160, 170, 180, 200, 212, 224, 236, 250, 265, 280, 300]],
  de_pk: ['PK', 1.6, [45, 47.5, 50, 53, 56, 60, 63, 71, 75, 80, 90, 95, 100, 106, 112, 118, 125, 132, 140, 150, 160, 170, 180, 200, 212, 224, 236, 250, 265, 280, 300, 315, 335, 355]],
  de_pl: ['PL', 2, [75, 80, 90, 95, 100, 106, 112, 118, 125, 132, 140, 150, 160, 170, 180, 200, 212, 224, 236, 250, 265, 280, 300, 315, 355, 375, 400, 425, 450, 470, 500, 560, 600, 630, 710, 750]],
  de_pm: ['PM', 2.5, [180, 200, 212, 224, 236, 250, 265, 280, 300, 315, 355, 375, 400, 425, 450, 475, 500, 560, 600, 630, 710, 750, 800, 850, 900, 950, 1000, 1060, 1120]]
};
Object.keys(lists).forEach(function (k) {
  var c = lists[k];
  c[2].forEach(function (de) {
    out[k].push([de, p1q(c[0], 1460, de, 1)]);
    pv.sleep(300);
  });
});
require('fs').writeFileSync('/workspace/.tmp_probe/pv_grid1.json', JSON.stringify(out));
console.log('saved. n1 rows:', out.n1.length, 'de_pj:', out.de_pj.length, 'de_pk:', out.de_pk.length, 'de_pl:', out.de_pl.length, 'de_pm:', out.de_pm.length);
