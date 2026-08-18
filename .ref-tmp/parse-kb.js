/* 解析参考站公差键盘（无 table id，直接扫 tr） */
'use strict';
var fs = require('fs');
var html = fs.readFileSync('/workspace/.ref-tmp/ref-tol.html', 'utf8');

var rows = html.match(/<tr[\s\S]*?<\/tr>/g) || [];
var inKb = 0;
rows.forEach(function (tr) {
  var tds = tr.match(/<td[\s\S]*?<\/td>/g) || [];
  var hasBtn = tds.some(td => /kb-btn/.test(td));
  if (!hasBtn) return;
  var out = [], col = 0;
  tds.forEach(function (td) {
    var spanM = td.match(/colspan="(\d+)"/);
    var span = spanM ? +spanM[1] : 1;
    var btnM = td.match(/<button[^>]*>([^<]+)<\/button>/);
    if (btnM) {
      var cls = /blue/.test(td) ? 'B' : /yellow/.test(td) ? 'Y' : /gray|grey/.test(td) ? 'G' : '?';
      var code = (td.match(/data-code="([^"]+)"/) || [])[1];
      var grade = (td.match(/data-grade="([^"]+)"/) || [])[1];
      out.push([col + 1, btnM[1], cls]);
    }
    col += span;
  });
  var label = (tr.match(/<th[^>]*>([^<]*)<\/th>/) || [])[1] || '';
  console.log((label || '?') + ': ' + JSON.stringify(out) + ',');
});
/* 图例颜色 */
var dotRe = /legend-dot (legend-[a-z]+)/g, d, dots = [];
while ((d = dotRe.exec(html))) dots.push(d[1]);
console.log('LEGEND DOTS: ' + dots.join(','));
