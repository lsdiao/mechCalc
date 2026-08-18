/* Probe 1: kAlpha / kr vs alpha1 sweep via polyv1
 * de1=20, de2=118 (diff 98), beltSize=PJ, deltaE=1.1, sweep a0.
 */
var pv = require('./pvlib.js');
var rows = [];
for (var a0 = 40; a0 <= 1300; a0 += 8) {
  var r = pv.post('polyv1', { de1: 20, de2: 118, deltaE: 1.1, a0: a0, beltSize: 'PJ' });
  if (r.flag) rows.push([a0, r.resultData.a, r.resultData.alpha1, r.resultData.kAlpha, r.resultData.kr, r.resultData.kL, r.resultData.calBeltLen]);
  else rows.push([a0, 'ERR', r.raw || '']);
  pv.sleep(320);
}
require('fs').writeFileSync('/workspace/.tmp_probe/pv_alpha_sweep.json', JSON.stringify(rows));
console.log('done', rows.length, 'first:', JSON.stringify(rows[0]), 'last:', JSON.stringify(rows[rows.length - 1]));
