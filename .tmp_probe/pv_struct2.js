/* Clean structural probe: PrFormula vs P1Query, polyv2 kr/alpha, polyv1 */
var pv = require('./pvfast.js');
var out = {};

function prf(bs, n1, de1, dE, i, kL, kA) {
  return pv.post('polyvPrFormula', { beltSize: bs, n1: n1, de1: de1, deltaE: dE || 0, i: i, kL: kL === undefined ? 1 : kL, kAlpha: kA === undefined ? 1 : kA });
}
function pq(bs, n1, de1, i) {
  return pv.post('polyvP1Query', { beltSize: bs, n1: n1, de1: de1, i: i });
}

/* --- 1. PrFormula vs P1Query, PJ n1=1460 de=20, i sweep --- */
out.pr_i = [];
[1, 1.01, 1.02, 1.05, 1.06, 1.1, 1.11, 1.12, 1.18, 1.19, 1.25, 1.26, 1.3, 1.38, 1.39, 1.5, 1.55, 1.56, 1.57, 1.58, 1.7, 1.94, 1.95, 2.5, 3.38, 3.39, 4].forEach(function (i) {
  var a = prf('PJ', 1460, 20, 0, i), b = pq('PJ', 1460, 20, i);
  out.pr_i.push([i, a.flag ? a.resultData : null, b.flag ? b.resultData : null]);
});

/* --- 2. same at de=50, de=100 --- */
out.pr_i_d50 = [];
[1, 1.05, 1.2, 1.5, 1.56, 1.6, 2, 3].forEach(function (i) {
  var a = prf('PJ', 1460, 50, 0, i), b = pq('PJ', 1460, 50, i);
  out.pr_i_d50.push([i, a.flag ? a.resultData : null, b.flag ? b.resultData : null]);
});

/* --- 3. PrFormula kL/kAlpha linearity + deltaE effect --- */
out.pr_klka = [];
[[1, 1], [0.91, 0.9], [2, 3]].forEach(function (s) {
  var a = prf('PJ', 1460, 20, 0, 1.3, s[0], s[1]);
  out.pr_klka.push([s[0], s[1], a.flag ? a.resultData : null]);
});
out.pr_dE = [];
[0, 0.5, 1.1, 2].forEach(function (e) {
  var a = prf('PJ', 1460, 20, e, 1);
  var b = prf('PJ', 1460, 20, e, 1.3);
  var c = pq('PJ', 1460, 20 + 2 * e, 1);
  out.pr_dE.push([e, a.flag ? a.resultData : null, b.flag ? b.resultData : null, c.flag ? c.resultData.p1 : null]);
});

/* --- 4. PrFormula n1 curve at de=20 i=1 (P1f) vs table --- */
out.pr_n1 = [];
[200, 400, 700, 1000, 1200, 1400, 1460, 1600, 1800, 2000, 2400, 2850, 3200, 3600, 4000, 5000, 6000].forEach(function (n) {
  var a = prf('PJ', n, 20, 0, 1), b = pq('PJ', n, 20, 1);
  out.pr_n1.push([n, a.flag ? a.resultData : null, b.flag ? b.resultData.p1 : null]);
});

/* --- 5. polyv2 kr sweep --- */
function f2(o) {
  var base = { power1: 0.02, deltaP1: 0, kAlpha: 0.9, powerD: 3, kL: 0.91, beltVelocity: 1.5, alpha1: 160, kr: 4.18, z: 16, beltSize: 'PJ' };
  Object.keys(o).forEach(function (k) { base[k] = o[k]; });
  var r = pv.post('polyv2', base);
  return r.flag ? r.resultData : { ERR: r.raw };
}
out.f2_kr = [];
[1, 1.5, 2, 2.5, 3, 3.5, 4, 4.18, 4.5, 5, 5.5, 6].forEach(function (k) {
  out.f2_kr.push([k, f2({ kr: k })]);
});
out.f2_alpha = [];
[90, 120, 140, 160, 170, 179, 180].forEach(function (a) {
  out.f2_alpha.push([a, f2({ alpha1: a })]);
});

/* --- 6. polyv1 checks --- */
out.pv1 = [];
[['PJ', 20, 40, 1.1, 300], ['PL', 75, 200, 2, 500], ['PM', 180, 400, 2.5, 800], ['PK', 45, 90, 1.6, 400]].forEach(function (s) {
  var r = pv.post('polyv1', { de1: s[1], de2: s[2], deltaE: s[3], a0: s[4], beltSize: s[0] });
  out.pv1.push([s.join('|'), r.flag ? r.resultData : r]);
});

require('fs').writeFileSync('/workspace/.tmp_probe/pv_struct2.json', JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1).slice(0, 3000));
