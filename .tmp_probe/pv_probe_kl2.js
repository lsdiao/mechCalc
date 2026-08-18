/* Probe server belt-length round-off behavior + kL per belt type.
 * de1=de2=d, Le0=2a0+pi*d -> a0=(Le-pi*d)/2 ; recover LeChosen = Le0+2*(a-a0)
 */
var pv = require('./pvlib.js');
var conf = {
  PJ: { d: 20, lens: [300, 330, 350, 375, 400, 425, 450, 475, 500, 560, 630, 710, 750, 800, 850, 900, 950, 1000, 1060, 1120, 1250, 1320, 1400, 1500, 1600, 1700, 1800, 1900, 2000, 2120, 2240, 2360, 2500] },
  PK: { d: 45, lens: [450, 475, 500, 560, 600, 630, 660, 710, 800, 850, 875, 900, 950, 975, 1000, 1060, 1120, 1200, 1250, 1320, 1400, 1600, 1755, 1800, 2000, 2120, 2360, 2500, 2510, 2690, 2800, 2920, 3120] },
  PL: { d: 75, lens: [1000, 1060, 1120, 1200, 1250, 1320, 1400, 1500, 1600, 1700, 1800, 1900, 2000, 2120, 2240, 2360, 2500, 2650, 2800, 3000, 3150, 3350, 3550, 3750, 4000, 4250, 4500, 4750, 5000, 5300, 5600, 6000] },
  PM: { d: 180, lens: [2000, 2120, 2240, 2360, 2500, 2650, 2800, 3000, 3150, 3350, 3550, 3750, 4000, 4250, 4500, 5000, 5600, 6300, 6676, 7500, 8500, 9000, 10000, 10600, 11200, 12500, 13200, 14000, 15000, 16000] }
};
var DE = { PJ: 1.1, PK: 1.6, PL: 2, PM: 2.5 };
var out = {};
Object.keys(conf).forEach(function (bs) {
  out[bs] = [];
  conf[bs].lens.forEach(function (Le) {
    var a0 = Math.round(((Le - Math.PI * conf[bs].d) / 2) * 100) / 100;
    var r = pv.post('polyv1', { de1: conf[bs].d, de2: conf[bs].d, deltaE: DE[bs], a0: a0, beltSize: bs });
    if (r.flag) {
      var le0 = r.resultData.calBeltLen;
      var chosen = Math.round((le0 + 2 * (r.resultData.a - a0)) * 10) / 10;
      out[bs].push([Le, chosen, r.resultData.kL, r.resultData.a, a0, le0]);
    } else out[bs].push([Le, 'ERR', r.raw || '']);
    pv.sleep(330);
  });
});
require('fs').writeFileSync('/workspace/.tmp_probe/pv_kl_probe.json', JSON.stringify(out));
Object.keys(out).forEach(function (bs) {
  console.log('==', bs);
  out[bs].forEach(function (r) { console.log(r.join(' | ')); });
});
