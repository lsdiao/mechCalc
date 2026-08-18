/* Auto: wait for network, complete node-discovery scans, fetch full P1 grid + dP1.
 * Incremental; writes pv_grid2.json (p1) + pv_nodes2.json (node sets) + pv_dp1v2.json.
 */
var cp = require('child_process');
var fs = require('fs');
var pv = require('./pvlib.js');

var OUT_P1 = '/workspace/.tmp_probe/pv_grid2.json';
var OUT_DP1 = '/workspace/.tmp_probe/pv_dp1v2.json';
var OUT_NODES = '/workspace/.tmp_probe/pv_nodes2.json';

function load(f, d) { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return d; } }
function saveAll() {
  fs.writeFileSync(OUT_P1, JSON.stringify(dbP1));
  fs.writeFileSync(OUT_DP1, JSON.stringify(dbDp1));
  fs.writeFileSync(OUT_NODES, JSON.stringify(nodes));
}

/* ---------- lightweight ping (short timeout, no retry) ---------- */
function ping() {
  try {
    var out = cp.execSync(
      "curl -s -m 12 -X POST 'https://www.mechtool.cn/calculation/polyvP1Query' " +
      "-d 'beltSize=PJ&n1=1460&de1=20&i=1' -H 'X-Requested-With: XMLHttpRequest'",
      { encoding: 'utf8', timeout: 15000 });
    var j = JSON.parse(out);
    return j.flag === true;
  } catch (e) { return false; }
}

function waitNet() {
  var ok = 0, tries = 0;
  while (ok < 2) {
    tries++;
    if (ping()) ok++; else ok = 0;
    if (ok < 2) cp.execSync('sleep 25');
  }
  console.log('NET UP after', tries, 'pings', new Date().toISOString());
}

/* ---------- rate-limit aware post ---------- */
function q(ep, params) {
  for (var att = 0; att < 6; att++) {
    var r = pv.post(ep, params);
    if (r && r.flag) { cp.execSync('sleep 0.1'); return r.resultData; }
    var raw = String(r && r.raw || '');
    if (raw.indexOf('403') >= 0 || raw === '') { cp.execSync('sleep ' + (20 + att * 20)); continue; }
    return null;
  }
  return null;
}

/* ---------- breakpoint scan over a range ---------- */
function scan(bs, de, from, to, step, tag) {
  var key = tag;
  if (scanDone[key]) return scanDone[key];
  var rows = [];
  for (var n = from; n <= to; n += step) {
    var d = q('polyvP1Query', { beltSize: bs, n1: n, de1: de, i: 1 });
    rows.push([n, d ? d.p1 : null]);
    cp.execSync('sleep 0.08');
  }
  scanDone[key] = rows;
  saveAll();
  return rows;
}

/* robust segment extraction -> breakpoints (node candidates) */
function breakpoints(rows, tol) {
  tol = tol || 3e-7;
  var pts = rows.filter(function (r) { return r[1] !== null && isFinite(r[1]); });
  var bps = [pts[0][0]];
  var a = pts[0], b = pts[1];
  for (var i = 2; i < pts.length; i++) {
    var c = pts[i];
    var pred = b[1] + (c[0] - b[0]) * (b[1] - a[1]) / (b[0] - a[0]);
    if (Math.abs(pred - c[1]) > tol) { bps.push(c[0]); a = b; }
    b = c;
  }
  bps.push(pts[pts.length - 1][0]);
  return bps;
}

/* ---------- config ---------- */
var DE = {
  PJ: [20, 22.4, 25, 28, 31.5, 33.5, 35.5, 37.5, 40, 42.5, 45, 47.5, 50, 53, 56, 60, 63, 71, 75, 80, 90, 95, 100, 106, 112, 118, 125, 132, 140, 150, 160, 170, 180, 200, 212, 224, 236, 250, 265, 280, 300],
  PK: [45, 47.5, 50, 53, 56, 60, 63, 71, 75, 80, 90, 95, 100, 106, 112, 118, 125, 132, 140, 150, 160, 170, 180, 200, 212, 224, 236, 250, 265, 280, 300, 315, 335, 355],
  PL: [75, 80, 90, 95, 100, 106, 112, 118, 125, 132, 140, 150, 160, 170, 180, 200, 212, 224, 236, 250, 265, 280, 300, 315, 355, 375, 400, 425, 450, 470, 500, 560, 600, 630, 710, 750],
  PM: [180, 200, 212, 224, 236, 250, 265, 280, 300, 315, 355, 375, 400, 425, 475, 500, 560, 600, 630, 710, 750, 800, 850, 900, 950, 1000, 1060, 1120]
};
/* known node seeds from previous successful scans */
var SEED = {
  PJ: [200, 300, 400, 500, 600, 700, 800, 900, 950, 1000, 1420, 1700, 1940, 2200, 2400, 2600, 2840, 3000, 3200, 3440, 3600, 3800, 4000, 4200],
  PK: [200, 300, 400, 500, 620, 700, 900, 1060, 1200, 1420, 1600, 1760, 1960, 2200, 2400, 2600, 2800, 3000, 3200, 3400, 3460, 3600, 3800, 4000, 4200, 4300, 4500, 4780, 4900, 5000, 5500, 6000, 6480, 6520, 6800],
  PL: [100, 200, 300, 400, 500, 540, 575, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000, 2100, 2200, 2300, 2400, 2500, 2600, 2700, 2800, 2900, 3000, 3100, 3200, 3300, 3400, 3500, 3600, 3700, 3800, 3900, 4000, 4100, 4200, 4300, 4400],
  PM: [100, 200, 300, 400, 500, 540, 575, 600, 675, 700, 800, 870, 900, 1000, 1100, 1150, 1160, 1200, 1300, 1400, 1500, 1600, 1700, 1750, 1800, 1900, 2000, 2100, 2200, 2300, 2400, 2500, 2600, 2900, 3000, 3100, 3400, 3800, 4000]
};
/* ranges still needing node discovery: [from, to] at scan de */
var GAPS = {
  PJ: { de: 150, ranges: [[4200, 7000]] },           /* low range known from pv_grid_disc */
  PK: { de: 100, ranges: [[100, 200], [6800, 8000]] },
  PL: { de: 150, ranges: [[100, 2400], [4400, 6000]] },
  PM: { de: 250, ranges: [[100, 1900], [2600, 4000]] }
};
var SCAN_DE2 = { PJ: 100, PK: 300, PL: 75, PM: 180 }; /* consistency spot-check column */
var REF_DE = { PJ: 20, PK: 100, PL: 150, PM: 250 };
var I_BANDS = [1.03, 1.08, 1.15, 1.22, 1.32, 1.45, 1.7, 2.5, 4];

var dbP1 = load(OUT_P1, {});
var dbDp1 = load(OUT_DP1, {});
var nodes = load(OUT_NODES, {});
var scanDone = load('/workspace/.tmp_probe/pv_scans.json', {});

function skey(tag, i) { return tag + '#' + i; }

/* ============ MAIN ============ */
waitNet();

/* Phase A: gap scans -> node sets */
['PJ', 'PK', 'PL', 'PM'].forEach(function (bs) {
  if (nodes[bs] && nodes[bs].final) return;
  var set = {};
  SEED[bs].forEach(function (n) { set[n] = 1; });
  GAPS[bs].ranges.forEach(function (rg, gi) {
    var rows = scan(bs, GAPS[bs].de, rg[0], rg[1], 20, bs + '_' + gi);
    breakpoints(rows).forEach(function (n) { set[Math.round(n)] = 1; });
  });
  nodes[bs] = { cand: Object.keys(set).map(Number).sort(function (a, b) { return a - b; }) };
  saveAll();
  console.log(bs, 'node candidates:', JSON.stringify(nodes[bs].cand));
});

/* Phase B: fetch P1 grid at candidates x all DE */
var t0 = Date.now(), cnt = 0;
['PJ', 'PK', 'PL', 'PM'].forEach(function (bs) {
  var cand = nodes[bs].cand;
  DE[bs].forEach(function (de) {
    cand.forEach(function (n) {
      var k = bs + '|' + de + '|' + n;
      if (dbP1[k] !== undefined) return;
      var d = q('polyvP1Query', { beltSize: bs, n1: n, de1: de, i: 1 });
      dbP1[k] = d ? d.p1 : null;
      cnt++;
      if (cnt % 25 === 0) { saveAll(); console.log(((Date.now() - t0) / 1000) + 's B ' + k + '=' + dbP1[k]); }
    });
  });
  saveAll();
  console.log('=== P1 grid done', bs, ((Date.now() - t0) / 1000) + 's');
});
saveAll();

/* Phase C: dP1 bands at REF_DE */
cnt = 0;
['PJ', 'PK', 'PL', 'PM'].forEach(function (bs) {
  var cand = nodes[bs].cand;
  cand.forEach(function (n) {
    var d0 = q('polyvP1Query', { beltSize: bs, n1: n, de1: REF_DE[bs], i: 1 });
    I_BANDS.forEach(function (ib) {
      var k = bs + '|' + n + '|' + ib;
      if (dbDp1[k] !== undefined) return;
      var d = q('polyvP1Query', { beltSize: bs, n1: n, de1: REF_DE[bs], i: ib });
      dbDp1[k] = d && d.deltaP1 !== undefined ? d.deltaP1 : (d && d.p1 !== null && d.p1 !== undefined ? d.p1 - (d0 ? d0.p1 : 0) : null);
      cnt++;
      if (cnt % 25 === 0) { saveAll(); console.log(((Date.now() - t0) / 1000) + 's C ' + k + '=' + dbDp1[k]); }
    });
  });
  saveAll();
  console.log('=== dP1 done', bs, ((Date.now() - t0) / 1000) + 's');
});

/* Phase D: dP1 de-independence spot checks */
cnt = 0;
['PJ', 'PK', 'PL', 'PM'].forEach(function (bs) {
  var de2 = SCAN_DE2[bs];
  var cand = nodes[bs].cand;
  [3, 10, 18, 25].forEach(function (idx) {
    var n = cand[Math.min(idx, cand.length - 1)];
    I_BANDS.slice(0, 4).forEach(function (ib) {
      var k = 'CHK|' + bs + '|' + de2 + '|' + n + '|' + ib;
      if (dbDp1[k] !== undefined) return;
      var d = q('polyvP1Query', { beltSize: bs, n1: n, de1: de2, i: ib });
      dbDp1[k] = d && d.deltaP1 !== undefined ? d.deltaP1 : null;
      cnt++;
    });
  });
});
saveAll();
console.log('ALL DONE', ((Date.now() - t0) / 1000) + 's', new Date().toISOString());
