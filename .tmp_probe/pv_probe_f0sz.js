/* Probe polyv2 force calc: F0 dependence on kr, z, Ft, v, belt, sin */
var pv = require('./pvlib.js');
var base = { power1: 0.0273, deltaP1: 0.0076, kAlpha: 0.9, powerD: 3, kL: 0.91, beltVelocity: 1.5, alpha1: 160, kr: 4.18, z: 16, beltSize: 'PJ' };
function f2(o) {
  var p = {}; Object.keys(base).forEach(function (k) { p[k] = o[k] !== undefined ? o[k] : base[k]; });
  var r = pv.post('polyv2', p);
  return r.flag ? r.resultData : { ERR: r.raw };
}
var out = {};
// vary kr
[1, 1.5, 2, 2.5, 3, 3.5, 4, 4.18, 4.5, 5, 6, 8].forEach(function (kr) {
  out['kr' + kr] = f2({ kr: kr });
  pv.sleep(400);
});
// vary alpha1 at fixed kr
out['a120'] = f2({ alpha1: 120 });
out['a140'] = f2({ alpha1: 140 });
out['a180b'] = f2({ alpha1: 179 });
// vary v (keep Ft constant by adjusting powerD)
out['v3kak'] = f2({ beltVelocity: 3, powerD: 6 });
// vary belt size (mass differs)
out['pkB'] = f2({ beltSize: 'PK' });
out['plB'] = f2({ beltSize: 'PL' });
out['pmB'] = f2({ beltSize: 'PM' });
console.log(JSON.stringify(out, null, 1));
require('fs').writeFileSync('/workspace/.tmp_probe/pv_f0.json', JSON.stringify(out, null, 1));