/* FULL P1 grid + dP1 band fetch. Writes incrementally to pv_grid_full.json */
var fs = require('fs');
var pv = require('./pvlib.js');
var OUT = '/workspace/.tmp_probe/pv_grid_full.json';
var db = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};

var DE = {
  PJ: [20, 22.4, 25, 28, 31.5, 33.5, 35.5, 37.5, 40, 42.5, 45, 47.5, 50, 53, 56, 60, 63, 71, 75, 80, 90, 95, 100, 106, 112, 118, 125, 132, 140, 150, 160, 170, 180, 200, 212, 224, 236, 250, 265, 280, 300],
  PK: [45, 47.5, 50, 53, 56, 60, 63, 71, 75, 80, 90, 95, 100, 106, 112, 118, 125, 132, 140, 150, 160, 170, 180, 200, 212, 224, 236, 250, 265, 280, 300, 315, 335, 355],
  PL: [75, 80, 90, 95, 100, 106, 112, 118, 125, 132, 140, 150, 160, 170, 180, 200, 212, 224, 236, 250, 265, 280, 300, 315, 355, 375, 400, 425, 450, 470, 500, 560, 600, 630, 710, 750],
  PM: [180, 200, 212, 224, 236, 250, 265, 280, 300, 315, 355, 375, 400, 425, 475, 500, 560, 600, 630, 710, 750, 800, 850, 900, 950, 1000, 1060, 1120]
};
var N1 = {
  PJ: [200, 300, 400, 500, 600, 700, 800, 900, 950, 1000, 1420, 1425, 1430, 1700, 1920, 1940, 1960, 2000, 2100, 2200, 2300, 2400, 2500, 2600, 2700, 2800, 2850, 2860, 2900, 3000, 3100, 3200, 3300, 3400, 3420, 3440, 3460, 3500, 3600, 3700, 3800, 3900, 4000, 4100, 4200, 4300, 4400, 4500, 4600, 5000, 5500, 6000, 7000],
  PK: [100, 200, 300, 400, 500, 600, 620, 700, 800, 900, 950, 1000, 1040, 1060, 1100, 1160, 1200, 1300, 1400, 1420, 1425, 1430, 1500, 1600, 1700, 1750, 1760, 1800, 1900, 1950, 1960, 2000, 2100, 2200, 2300, 2400, 2500, 2600, 2700, 2800, 2900, 3000, 3100, 3200, 3300, 3400, 3450, 3460, 3500, 3600, 3700, 3800, 3900, 4000, 4100, 4200, 4300, 4400, 4500, 4600, 4700, 4780, 4800, 4900, 4950, 5000, 5100, 5500, 6000, 6480, 6500, 6520, 6600, 7000, 8000],
  PL: [100, 200, 300, 400, 500, 540, 575, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000, 2100, 2200, 2300, 2400, 2500, 2600, 2700, 2800, 2900, 3000, 3100, 3200, 3300, 3400, 3500, 3600, 3700, 3800, 3900, 4000, 4100, 4200, 4300, 4400, 4500, 4600, 4700, 5000],
  PM: [100, 200, 300, 400, 500, 540, 575, 600, 675, 700, 800, 870, 900, 1000, 1100, 1150, 1160, 1200, 1300, 1400, 1500, 1600, 1700, 1750, 1800, 1900, 2000, 2100, 2200, 2300, 2400, 2500, 2600, 2700, 2800, 2900, 3000, 3100, 3400, 3800, 4000]
};
var REF_DE = { PJ: 20, PK: 45, PL: 75, PM: 180 };
var FALLBACK_DE = { PJ: [20, 50, 100], PK: [45, 100, 150], PL: [75, 150, 250], PM: [180, 250, 400] };
var I_BANDS = [1.03, 1.08, 1.15, 1.22, 1.32, 1.45, 1.7, 2.5, 4]; // band1 (=0) comes with i=1

function save() { fs.writeFileSync(OUT, JSON.stringify(db)); }
function key(bs, de, n) { return bs + '|' + de + '|' + n; }

var total = 0, done = 0;
['PJ', 'PK', 'PL', 'PM'].forEach(function (bs) {
  total += DE[bs].length * N1[bs].length + N1[bs].length * I_BANDS.length;
});
console.log('total calls ~', total);

var t0 = Date.now();
['PJ', 'PK', 'PL', 'PM'].forEach(function (bs) {
  db[bs] = db[bs] || { p1: {}, dp1: {} };
  // Phase 1: p1 grid (i=1)
  DE[bs].forEach(function (de) {
    N1[bs].forEach(function (n) {
      var k = key(bs, de, n);
      if (db[bs].p1[k] !== undefined) { done++; return; }
      var r = pv.post('polyvP1Query', { beltSize: bs, n1: n, de1: de, i: 1 });
      if (r.flag) db[bs].p1[k] = r.resultData.p1;
      else db[bs].p1[k] = 'ERR';
      done++;
      if (done % 25 === 0) { save(); console.log((Date.now() - t0) / 1000 + 's ' + done + '/' + total + ' p1 ' + k + '=' + db[bs].p1[k]); }
      pv.sleep(90);
    });
  });
  save();
  console.log('=== P1 done for ' + bs + ' at ' + (Date.now() - t0) / 1000 + 's');
  // Phase 2: dp1 bands at ref de
  N1[bs].forEach(function (n) {
    I_BANDS.forEach(function (i) {
      var k = bs + '|' + n + '|' + i;
      if (db[bs].dp1[k] !== undefined) { done++; return; }
      var r = pv.post('polyvP1Query', { beltSize: bs, n1: n, de1: REF_DE[bs], i: i });
      if (r.flag) db[bs].dp1[k] = r.resultData.deltaP1;
      else db[bs].dp1[k] = 'ERR';
      done++;
      if (done % 50 === 0) { save(); console.log((Date.now() - t0) / 1000 + 's ' + done + '/' + total + ' dp1 ' + k + '=' + db[bs].dp1[k]); }
      pv.sleep(90);
    });
  });
  save();
  console.log('=== dP1 done for ' + bs + ' at ' + (Date.now() - t0) / 1000 + 's');
});
save();
console.log('ALL DONE', (Date.now() - t0) / 1000 + 's');
