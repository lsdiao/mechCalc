/* kL for every belt-length series value, via polyvBeltLenChange (beltLen explicit) */
var fs = require('fs');
var pv = require('./pvlib.js');

var LEN = {
  PJ: [300, 330, 350, 375, 400, 425, 450, 475, 500, 560, 630, 710, 750, 800, 850, 900, 950, 1000, 1060, 1120, 1250, 1320, 1400, 1500, 1600, 1700, 1800, 1900, 2000, 2120, 2240, 2360, 2500],
  PK: [450, 475, 500, 560, 600, 630, 660, 710, 800, 850, 875, 900, 950, 975, 1000, 1060, 1120, 1200, 1250, 1320, 1400, 1600, 1755, 1800, 2000, 2120, 2360, 2500, 2510, 2690, 2800, 2920, 3120],
  PL: [1000, 1060, 1120, 1200, 1250, 1320, 1400, 1500, 1600, 1700, 1800, 1900, 2000, 2120, 2240, 2360, 2500, 2650, 2800, 3000, 3150, 3350, 3550, 3750, 4000, 4250, 4500, 4750, 5000, 5300, 5600, 6000, 6300],
  PM: [2000, 2120, 2240, 2360, 2500, 2650, 2800, 3000, 3150, 3350, 3550, 3750, 4000, 4250, 4500, 5000, 5600, 6300, 6700, 7500, 8500, 9000, 10000, 10600, 11200, 12500, 13200, 14000, 15000, 16000]
};
var DE = { PJ: 20, PK: 45, PL: 75, PM: 180 };
var DE2 = { PJ: 118, PK: 118, PL: 180, PM: 400 };

var out = {};
Object.keys(LEN).forEach(function (bs) {
  out[bs] = [];
  LEN[bs].forEach(function (le) {
    var r = pv.post('polyvBeltLenChange', { de1: DE[bs], de2: DE2[bs], calBeltLen: le, beltLen: le });
    out[bs].push([le, r.flag && r.resultData ? r.resultData.kL : 'ERR']);
    pv.sleep(120);
  });
});
fs.writeFileSync('/workspace/.tmp_probe/pv_kl_full.json', JSON.stringify(out));
console.log('done');
console.log(JSON.stringify(out));
