/* 解析 mechtool 基本偏差表（GB/T 1800.3）→ js/tools/toldata.js（rowspan/colspan 感知） */
'use strict';
var fs = require('fs');

/* 通用 HTML 表格 → 二维网格（处理 rowspan/colspan） */
function grid(html) {
  var trs = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/g) || [];
  var g = [];
  var pending = {}; // "r,c" -> {val, untilRow}
  trs.forEach(function (tr, ri) {
    if (!g[ri]) g[ri] = [];
    var tds = tr.match(/<t[dh][^>]*>[\s\S]*?<\/t[dh]>/g) || [];
    var c = 0;
    /* 先补上前面行挂下来的格子（仅限目标行是当前行的） */
    Object.keys(pending).forEach(function (k) {
      var p = k.split(',').map(Number);
      if (p[0] === ri) g[ri][p[1]] = pending[k].val;
    });
    tds.forEach(function (td) {
      while (g[ri][c] !== undefined) c++;
      var tag = td.match(/^<t[dh][^>]*>/)[0];
      var rs = +(tag.match(/rowspan="?(\d+)?/i) || [])[1] || 1;
      var cs = +(tag.match(/colspan="?(\d+)?/i) || [])[1] || 1;
      var val = td.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, '').trim();
      for (var i = 0; i < rs; i++) {
        for (var j = 0; j < cs; j++) {
          if (i === 0) g[ri][c + j] = val;
          else pending[(ri + i) + ',' + (c + j)] = { val: val, until: ri + rs - 1 };
        }
      }
      c += cs;
    });
  });
  /* 应用 pending 到所有行 */
  Object.keys(pending).forEach(function (k) {
    var p = k.split(',').map(Number);
    for (var r = p[0]; r <= pending[k].until; r++) {
      if (g[r]) g[r][p[1]] = pending[k].val;
    }
  });
  return g;
}

function rows(file) {
  var s = fs.readFileSync(file, 'utf8');
  return s.match(/<table[\s\S]*?<\/table>/g).map(grid);
}

function num(x) {
  if (x === '' || x === undefined) return null;
  if (x === 'O' || x === 'o') return 0; // OCR 噪声
  var m = String(x).match(/^([+-]?\d+(?:\.\d+)?)\+&?Delta;?$/i); // "-2+Δ"
  if (m) return [+(m[1] === undefined ? NaN : m[1]), 1];
  return /^[+-]?\d+(\.\d+)?$/.test(x) ? +x : x;
}

/* ---------- 轴 ---------- */
var st = rows('.ref-tmp/dev-shaft.html');
var sES = st[0], sEI = st[1];
var S = { segs: [], es: {}, ei: {} };
sES.slice(2).forEach(function (r) {
  if (!r[1] || +r[1] > 500) return;
  S.segs.push([+r[0] || 0, +r[1]]);
  ['a', 'b', 'c', 'cd', 'd', 'e', 'ef', 'f', 'fg', 'g', 'h'].forEach(function (c, i) {
    (S.es[c] = S.es[c] || []).push(num(r[2 + i]));
  });
  ['j_it56', 'j_it7', 'j_it8'].forEach(function (k, i) {
    (S.es[k] = S.es[k] || []).push(num(r[13 + i]));
  });
  ['k_it47', 'k_other'].forEach(function (k, i) {
    (S.ei[k] = S.ei[k] || []).push(num(r[16 + i]));
  });
});
sEI.slice(2).forEach(function (r) {
  if (!r[1] || +r[1] > 500) return;
  ['m', 'n', 'p', 'r', 's', 't', 'u', 'v', 'x', 'y', 'z'].forEach(function (c, i) {
    (S.ei[c] = S.ei[c] || []).push(num(r[2 + i]));
  });
});

/* ---------- 孔 ---------- */
var ht = rows('.ref-tmp/dev-hole.html');
var hEI = ht[0], hK = ht[1], hP = ht[2];
var H = { segs: [], ei: {}, es: {}, delta: [] };
hEI.slice(2).forEach(function (r) {
  if (!r[1] || +r[1] > 500) return;
  H.segs.push([+r[0] || 0, +r[1]]);
  ['A', 'B', 'C', 'CD', 'D', 'E', 'EF', 'F', 'FG', 'G', 'H'].forEach(function (c, i) {
    (H.ei[c] = H.ei[c] || []).push(num(r[2 + i]));
  });
});
hK.slice(2).forEach(function (r) {
  if (!r[1] || +r[1] > 500) return;
  ['J6', 'J7', 'J8'].forEach(function (k, i) {
    (H.es[k] = H.es[k] || []).push(num(r[2 + i]));
  });
  ['K', 'M', 'N'].forEach(function (c, i) {
    (H.es[c + '_le8'] = H.es[c + '_le8'] || []).push(num(r[5 + i * 2]));
    (H.es[c + '_gt8'] = H.es[c + '_gt8'] || []).push(num(r[6 + i * 2]));
  });
  H.delta.push([num(r[11]), num(r[12]), num(r[13]), num(r[14]), num(r[15]), num(r[16])]);
});
hP.slice(2).forEach(function (r) {
  if (!r[1] || +r[1] > 500) return;
  ['P', 'R', 'S', 'T', 'U', 'V', 'X', 'Y', 'Z'].forEach(function (c, i) {
    (H.es[c] = H.es[c] || []).push(num(r[3 + i]));
  });
});

/* ---------- 标准公差 IT（GB/T 1800.1，13 段，IT1~IT18）---------- */
var IT = {
  1: [0.8, 1, 1, 1.2, 1.5, 1.5, 2, 2.5, 3.5, 4.5, 6, 7, 8],
  2: [1.2, 1.5, 1.5, 2, 2.5, 2.5, 3, 4, 5, 7, 8, 9, 10],
  3: [2, 2.5, 2.5, 3, 4, 4, 5, 6, 8, 10, 12, 13, 15],
  4: [3, 4, 4, 5, 6, 7, 8, 10, 12, 14, 16, 18, 20],
  5: [4, 5, 6, 8, 9, 11, 13, 15, 18, 20, 23, 25, 27],
  6: [6, 8, 9, 11, 13, 16, 19, 22, 25, 29, 32, 36, 40],
  7: [10, 12, 15, 18, 21, 25, 30, 35, 40, 46, 52, 57, 63],
  8: [14, 18, 22, 27, 33, 39, 46, 54, 63, 72, 81, 89, 97],
  9: [25, 30, 36, 43, 52, 62, 74, 87, 100, 115, 130, 140, 155],
  10: [40, 48, 58, 70, 84, 100, 120, 140, 160, 185, 210, 230, 250],
  11: [60, 75, 90, 110, 130, 160, 190, 220, 250, 290, 320, 360, 400],
  12: [100, 120, 150, 180, 210, 250, 300, 350, 400, 460, 520, 570, 630],
  13: [140, 180, 220, 270, 330, 390, 460, 540, 630, 720, 810, 890, 970],
  14: [250, 300, 360, 430, 520, 620, 740, 870, 1000, 1150, 1300, 1400, 1550],
  15: [400, 480, 580, 700, 840, 1000, 1200, 1400, 1600, 1850, 2100, 2300, 2500],
  16: [600, 750, 900, 1100, 1300, 1600, 1900, 2200, 2500, 2900, 3200, 3600, 4000],
  17: [1000, 1200, 1500, 1800, 2100, 2500, 3000, 3500, 4000, 4600, 5200, 5700, 6300],
  18: [1400, 1800, 2200, 2700, 3300, 3900, 4600, 5400, 6300, 7200, 8100, 8900, 9700]
};

var data = {
  segs25: S.segs, segs13: [3, 6, 10, 18, 30, 50, 80, 120, 180, 250, 315, 400, 500],
  IT: IT, shaft: { es: S.es, ei: S.ei }, hole: { ei: H.ei, es: H.es, delta: H.delta }
};
var out = '/* GB/T 1800.1/1800.3 数据（≤500mm，25 段基本偏差 + 13 段标准公差）\n' +
  ' * shaft.es{a..h,j_it56/j_it7/j_it8} 上偏差 / shaft.ei{k_it47/k_other,m..z} 下偏差\n' +
  ' * hole.ei{A..H} 下偏差 / hole.es{J6..J8,K/M/N_le8/_gt8,P..Z} 上偏差 / hole.delta Δ3..Δ8\n */\n' +
  'window.TOLDATA = ' + JSON.stringify(data) + ';\n';
fs.writeFileSync('js/tools/toldata.js', out);
console.log('written js/tools/toldata.js', out.length, 'bytes');
console.log('segs25:', S.segs.length, '| f>10-14:', S.es.f[3], '| s>18-24:', S.ei.s[5], '| s>24-30:', S.ei.s[6]);
console.log('r>14-18:', S.ei.r[4], '| t>24-30:', S.ei.t[6], '| F>50-65:', H.ei.F[9], '| P>50-65:', H.es.P[9], '| Δ7>50-65:', H.delta[9][4]);
console.log('K>30-40 le8:', H.es.K_le8[7], 'gt8:', H.es.K_gt8[7], '| N>30-40 gt8:', H.es.N_gt8[7]);
