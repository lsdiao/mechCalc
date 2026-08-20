/* Fit force0 = f(Ft, z, kr) exactly. alpha/v/kAlpha constant, vary one axis */
var pv = require('./pvlib.js');
var base = { power1: 0.0273, deltaP1: 0.0076, kAlpha: 0.9, powerD: 3, kL: 0.91, beltVelocity: 1.5, alpha1: 160, kr: 4.18, z: 16, beltSize: 'PJ' };
function f2(o) {
  var p = {}; Object.keys(base).forEach(function (k) { p[k] = o[k] !== undefined ? o[k] : base[k]; });
  var r = pv.post('polyv2', p);
  return r.flag ? r.resultData : { ERR: r.raw };
}
var out = {};
// vary z keeping Ft (via powerD/v) constant
[[8],[12],[20],[24],[32]].forEach(function (z) {
  out['z'+z] = f2({ z: z });
  pv.sleep(350);
});
// vary Ft via powerD (alpha fixed)
out['pd1'] = f2({ powerD: 1 });
out['pd6'] = f2({ powerD: 6 });
// vary v keeping Ft fixed (powerD scales) -- check v dependence again rigorously
out['v3fix'] = f2({ beltVelocity: 3, powerD: 6 });
console.log(JSON.stringify(out, null, 1));
require('fs').writeFileSync('/workspace/.tmp_probe/pv_f0fit.json', JSON.stringify(out, null, 1));