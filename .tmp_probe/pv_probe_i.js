/* dense i sweep via PrFormula at two (n1,de1); plus PK support test */
var pv = require('./pvlib.js');
function pr(bs, n1, de1, dE, i) { return pv.post('polyvPrFormula', { beltSize: bs, n1: n1, de1: de1, deltaE: dE, i: i, kL: 1, kAlpha: 1 }).resultData; }
function p1q(bs, n1, de1, i) { return pv.post('polyvP1Query', { beltSize: bs, n1: n1, de1: de1, i: i }).resultData; }
var out = { pr_de20: [], pr_de50: [], p1_de50: [], pk: [], pl: [], pm: [] };
for (var i = 1; i <= 4.51; i += 0.05) {
  i = Math.round(i * 100) / 100;
  out.pr_de20.push([i, pr('PJ', 1460, 20, 1.1, i)]);
  pv.sleep(280);
}
[1, 1.05, 1.2, 1.5, 2, 3, 3.65, 4].forEach(function (i) {
  out.pr_de50.push([i, pr('PJ', 1460, 50, 1.1, i)]);
  pv.sleep(280);
  out.p1_de50.push([i, p1q('PJ', 1460, 50, i)]);
  pv.sleep(280);
});
// other belt types
[['PK', 45, 1.6], ['PL', 75, 2], ['PM', 180, 2.5]].forEach(function (c) {
  [1, 1.5, 3.65].forEach(function (i) {
    out[c[0] === 'PK' ? 'pk' : c[0] === 'PL' ? 'pl' : 'pm'].push([i, pr(c[0], 1460, c[1], c[2], i), p1q(c[0], 1460, c[1], i)]);
    pv.sleep(280);
  });
});
require('fs').writeFileSync('/workspace/.tmp_probe/pv_i_sweep.json', JSON.stringify(out));
console.log(JSON.stringify(out, null, 1).slice(0, 4000));
