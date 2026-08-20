/* Probe polyv1 to determine kr as a function of alpha1 / geometry */
var pv = require('./pvlib.js');
function g1(o) {
  var p = { de1: 60, de2: 118, deltaE: 1.1, a0: 400, beltSize: 'PJ' };
  Object.keys(o).forEach(function (k) { p[k] = o[k]; });
  var r = pv.post('polyv1', p);
  return r.flag ? r.resultData : { ERR: r.raw };
}
var out = {};
// vary a0 to change alpha1
[200, 250, 300, 350, 400, 450, 500, 600, 800, 1000].forEach(function (a) {
  out['a' + a] = g1({ a0: a });
  pv.sleep(400);
});
// vary de2
[90, 118, 150, 200, 250].forEach(function (d2) {
  out['de2' + d2] = g1({ de2: d2 });
  pv.sleep(400);
});
console.log(JSON.stringify(out, null, 1));
require('fs').writeFileSync('/workspace/.tmp_probe/pv_kr_map.json', JSON.stringify(out, null, 1));