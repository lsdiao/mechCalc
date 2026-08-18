/* poly-v probe helper: pvlib.js */
var cp = require('child_process');
var fs = require('fs');

function post(ep, params) {
  var d = Object.keys(params).map(function (k) { return k + '=' + encodeURIComponent(params[k]); }).join('&');
  var cmd = "curl -s -X POST 'https://www.mechtool.cn/calculation/" + ep + "' -d '" + d + "' -H 'X-Requested-With: XMLHttpRequest' --max-time 25";
  var out = '';
  for (var i = 0; i < 4; i++) {
    try { out = cp.execSync(cmd, { encoding: 'utf8' }); break; } catch (e) { cp.execSync('sleep 1.5'); }
  }
  try { return JSON.parse(out); } catch (e) { return { flag: false, raw: out.slice(0, 200) }; }
}

var sleep = function (ms) { cp.execSync('sleep ' + (ms / 1000)); };

module.exports = { post: post, sleep: sleep };
