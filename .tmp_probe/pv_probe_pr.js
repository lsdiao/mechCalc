/* Probe Pr/P1 structure */
var pv = require('./pvlib.js');
function pr(bs, n1, de1, dE, i, kL, kA) {
  return pv.post('polyvPrFormula', { beltSize: bs, n1: n1, de1: de1, deltaE: dE, i: i, kL: kL, kAlpha: kA });
}
function p1q(bs, n1, de1, i) {
  return pv.post('polyvP1Query', { beltSize: bs, n1: n1, de1: de1, i: i });
}
var log = [];
function T(name, v) { log.push([name, JSON.stringify(v)]); console.log(name, JSON.stringify(v)); pv.sleep(300); }

// 1. structure: Pr(1,1) vs p1+deltaP1 at several i
[1, 1.05, 1.5, 3.65, 4].forEach(function (i) {
  var a = pr('PJ', 1460, 20, 1.1, i, 1, 1), b = p1q('PJ', 1460, 20, i);
  T('i=' + i, { Pr: a.resultData, p1: b.resultData });
});
// 2. kL/kAlpha multiplicative
T('kL=0.5,kA=1', pr('PJ', 1460, 20, 1.1, 3.65, 0.5, 1).resultData);
T('kL=1,kA=0.8', pr('PJ', 1460, 20, 1.1, 3.65, 1, 0.8).resultData);
// 3. deltaE effect
T('dE=0', pr('PJ', 1460, 20, 0, 3.65, 1, 1).resultData);
T('dE=5', pr('PJ', 1460, 20, 5, 3.65, 1, 1).resultData);
// 4. i band sweep at fixed n1,de1 (deltaP1 behavior)
for (var i = 1.0; i <= 4.21; i += 0.048) {
  var b = p1q('PJ', 1460, 20, Math.round(i * 1000) / 1000);
  T('isweep ' + (Math.round(i * 1000) / 1000), b.resultData);
}
require('fs').writeFileSync('/workspace/.tmp_probe/pv_pr_struct.json', JSON.stringify(log));
