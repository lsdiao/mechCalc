/* Probe P1f(n1,df) and K(n1) structure for polyvPrFormula */
var pv = require('./pvfast.js');
var fs = require('fs');
var out = {};

function prf(bs, n1, de1, dE, i) {
  var r = pv.post('polyvPrFormula', { beltSize: bs, n1: n1, de1: de1, deltaE: dE, i: i, kL: 1, kAlpha: 1 });
  return r.flag ? r.resultData : null;
}
function pq(bs, n1, de1, i) {
  var r = pv.post('polyvP1Query', { beltSize: bs, n1: n1, de1: de1, i: i });
  return r.flag ? r.resultData : null;
}

/* P1f vs n1 at df=20 (PJ), i=1 */
out.p1f_n1 = [];
[100, 200, 400, 700, 1000, 1200, 1400, 1460, 1600, 1800, 2000, 2400, 2850, 3200, 3600, 4000, 4500, 5000, 5500, 6000, 7000, 8000, 9000, 10000].forEach(function (n) {
  out.p1f_n1.push([n, prf('PJ', n, 20, 0, 1), pq('PJ', n, 20, 1) ? pq('PJ', n, 20, 1).p1 : null]);
});

/* P1f vs df at n1=1460 (PJ) via deltaE on de1=20 */
out.p1f_df = [];
[0, 0.5, 1, 1.5, 2, 3, 5, 8, 12, 17, 25, 40, 60, 90, 130, 190, 280].forEach(function (e) {
  var df = 20 + 2 * e;
  out.p1f_df.push([df, prf('PJ', 1460, 20, e, 1)]);
});

/* K vs n1 (PJ, de=20): K = (Pr - P1f)/(1-1/1.3) */
out.k_n1 = [];
[200, 400, 700, 1000, 1200, 1400, 1460, 1600, 1800, 2000, 2400, 2850, 3200, 3600, 4000, 4500, 5000, 5500, 6000, 7000].forEach(function (n) {
  var p1 = prf('PJ', n, 20, 0, 1), pr = prf('PJ', n, 20, 0, 1.3);
  out.k_n1.push([n, p1, pr, p1 !== null && pr !== null ? (pr - p1) / (1 - 1 / 1.3) : null]);
});

/* K & P1f for PK/PL/PM at several n1 */
out.belt_struct = [];
[['PK', 45, 1000], ['PK', 45, 1460], ['PK', 45, 3000], ['PL', 75, 1000], ['PL', 75, 1460], ['PL', 75, 3000], ['PM', 180, 500], ['PM', 180, 1000], ['PM', 180, 2000]].forEach(function (s) {
  var p1 = prf(s[0], s[2], s[1], 0, 1), pr = prf(s[0], s[2], s[1], 0, 1.3), pr2 = prf(s[0], s[2], s[1], 0, 2);
  out.belt_struct.push([s[0], s[1], s[2], p1, pr, pr2]);
});

/* i threshold refine */
out.ithresh = [];
[1.55, 1.554, 1.555, 1.556, 1.559, 1.56].forEach(function (i) {
  out.ithresh.push([i, prf('PJ', 1460, 20, 0, i)]);
});

/* table band8 vs 9 vs 10 at high n1 (PJ de=20): do they differ? */
out.band_high = [];
[3000, 4000, 5000, 6000, 7000].forEach(function (n) {
  var b7 = pq('PJ', n, 20, 1.5), b8 = pq('PJ', n, 20, 1.7), b9 = pq('PJ', n, 20, 2.5), b10 = pq('PJ', n, 20, 4);
  var f8 = prf('PJ', n, 20, 0, 1.7), f4 = prf('PJ', n, 20, 0, 4);
  out.band_high.push([n, b7 && b7.deltaP1, b8 && b8.deltaP1, b9 && b9.deltaP1, b10 && b10.deltaP1, f8, f4]);
});

fs.writeFileSync('/workspace/.tmp_probe/pv_p1f.json', JSON.stringify(out, null, 1));
console.log('saved');
