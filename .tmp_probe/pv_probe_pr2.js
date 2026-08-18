/* Probe polyvPrFormula structure: C = (Pr - p1)/(1-1/i) as fn of n1, de1, dE, type */
var pv = require('./pvlib.js');
function pr(bs, n1, de1, dE, i) {
  var r = pv.post('polyvPrFormula', { beltSize: bs, n1: n1, de1: de1, deltaE: dE, i: i, kL: 1, kAlpha: 1 });
  return r.flag ? r.resultData : null;
}
function p1(bs, n1, de1) {
  var r = pv.post('polyvP1Query', { beltSize: bs, n1: n1, de1: de1, i: 1 });
  return r.flag ? r.resultData.p1 : null;
}
var out = {};
function rec(tag, bs, n1, de1, dE, i) {
  var P = pr(bs, n1, de1, dE, i), base = p1(bs, n1, de1);
  var C = P !== null ? (P - base) / (1 - 1 / i) : null;
  out[tag] = { Pr: P, p1: base, C: C !== null ? +C.toFixed(5) : null };
  pv.sleep(150);
}
rec('A_i1.2', 'PJ', 1460, 20, 1.1, 1.2);
rec('A_i1.05', 'PJ', 1460, 20, 1.1, 1.05);
rec('A_i1.1', 'PJ', 1460, 20, 1.1, 1.1);
rec('A_i1.3', 'PJ', 1460, 20, 1.1, 1.3);
rec('B_n1_700', 'PJ', 700, 20, 1.1, 1.2);
rec('B_n1_200', 'PJ', 200, 20, 1.1, 1.2);
rec('B_n1_2900', 'PJ', 2900, 20, 1.1, 1.2);
rec('B_n1_980', 'PJ', 980, 20, 1.1, 1.2);
rec('C_de50', 'PJ', 1460, 50, 1.1, 1.2);
rec('C_de100', 'PJ', 1460, 100, 1.1, 1.2);
rec('C_de25', 'PJ', 1460, 25, 1.1, 1.2);
rec('D_dE0', 'PJ', 1460, 20, 0, 1.2);
rec('D_dE3', 'PJ', 1460, 20, 3, 1.2);
rec('D_dE5', 'PJ', 1460, 20, 5, 1.2);
rec('E_pk', 'PK', 1460, 100, 1.6, 1.2);
rec('E_pl', 'PL', 1460, 150, 2, 1.2);
rec('E_pm', 'PM', 1460, 250, 2.5, 1.2);
rec('F_i1.57', 'PJ', 1460, 20, 1.1, 1.57);
rec('F_i1.58', 'PJ', 1460, 20, 1.1, 1.58);
rec('F_i1.9', 'PJ', 1460, 20, 1.1, 1.9);
rec('F_i4', 'PJ', 1460, 20, 1.1, 4);
console.log(JSON.stringify(out, null, 1));
require('fs').writeFileSync('/workspace/.tmp_probe/pv_pr2.json', JSON.stringify(out, null, 1));
