/* Explore P1(n1, de1) structure for polyvP1Query across belt types */
var cp = require('child_process');
var fs = require('fs');

function postOne(ep, params) {
  var d = Object.keys(params).map(function (k) { return k + '=' + encodeURIComponent(params[k]); }).join('&');
  var cmd = "curl -s -X POST 'https://www.mechtool.cn/calculation/" + ep + "' -d '" + d + "' -H 'X-Requested-With: XMLHttpRequest' --max-time 15";
  try {
    var out = cp.execSync(cmd, { encoding: 'utf8', timeout: 20000 });
    var o = JSON.parse(out);
    return o.flag ? o.resultData : null;
  } catch (e) { return null; }
}
function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

/* diameter series per belt (decoded from pretty JS) */
var DE = {
  PJ: [20, 22.4, 25, 28, 31.5, 33.5, 35.5, 37.5, 40, 42.5, 45, 47.5, 50, 53, 56, 60, 63, 71, 75, 80, 90, 95, 100, 106, 112, 118, 125, 132, 140, 150, 160, 170, 180, 200, 212, 224, 236, 250, 265, 280, 300],
  PK: [45, 47.5, 50, 53, 56, 60, 63, 71, 75, 80, 90, 95, 100, 106, 112, 118, 125, 132, 140, 150, 160, 170, 180, 200, 212, 224, 236, 250, 265, 280, 300, 315, 335, 355],
  PL: [75, 80, 90, 95, 100, 106, 112, 118, 125, 132, 140, 150, 160, 170, 180, 200, 212, 224, 236, 250, 265, 280, 300, 315, 355, 375, 400, 425, 450, 470, 500, 560, 600, 630, 710, 750],
  PM: [180, 200, 212, 224, 236, 250, 265, 280, 300, 315, 355, 375, 400, 425, 450, 475, 500, 560, 600, 630, 710, 750, 800, 850, 900, 950, 1000, 1060, 1120]
};

function n1nodes(bs) {
  // dense n1 range appropriate per belt
  var max = { PJ: 10000, PK: 6000, PL: 3000, PM: 1500 }[bs];
  var arr = [];
  for (var n = 50; n <= max; n += 50) arr.push(n);
  return arr;
}

(async function () {
  var out = {};
  for (var bI = 0; bI < ['PJ','PK','PM'].length; bI++) {
    var bs = ['PJ','PK','PM'][bI];
    var dels = DE[bs];
    // pick a few de1 samples to see P1-vs-n1 and P1-vs-de1 structure
    var samp = dels.filter(function (_, i) { return i % Math.max(1, Math.floor(dels.length / 6)) === 0; });
    out[bs] = {};
    for (var s = 0; s < samp.length; s++) {
      var de1 = samp[s];
      var curve = [];
      var nodes = n1nodes(bs);
      for (var k = 0; k < nodes.length; k++) {
        curve.push([nodes[k], postOne('polyvP1Query', { beltSize: bs, n1: nodes[k], de1: de1, i: 1 })]);
        if (k % 20 === 19) await sleep(150);
      }
      out[bs]['de' + de1] = curve;
      console.log('done ' + bs + ' de=' + de1);
    }
  }
  fs.writeFileSync('/workspace/.tmp_probe/pv_p1_structure.json', JSON.stringify(out, null, 0));
  console.log('SAVED');
})();