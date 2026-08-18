/* Probe polyv2 force formulas + polyvPrFormula structure */
var pv = require('./pvlib.js');
var base = { power1: 0.0273, deltaP1: 0.0076, kAlpha: 0.9, powerD: 3, kL: 0.91, beltVelocity: 1.5, alpha1: 160, kr: 4.18, z: 16, beltSize: 'PJ' };
function f2(o) {
  var p = {}; Object.keys(base).forEach(function (k) { p[k] = o[k] !== undefined ? o[k] : base[k]; });
  var r = pv.post('polyv2', p);
  return r.flag ? r.resultData : { ERR: r.raw };
}
var out = { base: f2({}) };
out.z8 = f2({ z: 8 });
out.v3 = f2({ beltVelocity: 3 });
out.pd6 = f2({ powerD: 6 });
out.ka045 = f2({ kAlpha: 0.45 });
out.a90 = f2({ alpha1: 90 });
out.a180 = f2({ alpha1: 180 });
out.kr2 = f2({ kr: 2 });
out.p12 = f2({ power1: 0.0546 });
out.dp12 = f2({ deltaP1: 0.0152 });
out.kl2 = f2({ kL: 0.91, power1: 0.0273 });
out.pk = f2({ beltSize: 'PK' });
out.dp10 = f2({ deltaP1: 0 });
console.log(JSON.stringify(out, null, 1));
require('fs').writeFileSync('/workspace/.tmp_probe/pv_forces.json', JSON.stringify(out, null, 1));
