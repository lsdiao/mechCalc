/* 提取参考站 GB/T 1184 公差表的表格数据并预览 */
'use strict';
var fs = require('fs');

function dumpFile(name, path) {
  var html = fs.readFileSync(path, 'utf8');
  var tables = html.match(/<table[\s\S]*?<\/table>/g) || [];
  console.log('\n===== ' + name + ' (' + tables.length + ' tables) =====');
  // 只看最大的表
  tables.sort(function (a, b) { return b.length - a.length; });
  var tab = tables[0];
  if (!tab) { console.log('NO TABLE'); return; }
  var rows = tab.match(/<tr[\s\S]*?<\/tr>/g) || [];
  rows.forEach(function (tr) {
    var cells = tr.match(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g) || [];
    var vals = cells.map(function (c) {
      var m = c.match(/^<t[hd][^>]*>[\s\S]*?<\/t[hd]>$/);
      var inner = c.replace(/<t[hd][^>]*>|<\/t[hd]>/g, '');
      inner = inner.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      return inner;
    });
    console.log(vals.join(' | '));
  });
}

dumpFile('直线度/平面度', '/workspace/.ref-tmp/ref-common-table.html');
dumpFile('圆度/圆柱度', '/workspace/.ref-tmp/tab-roundness.html');
dumpFile('平行度/垂直度/倾斜度', '/workspace/.ref-tmp/tab-parallel.html');
dumpFile('同轴度/对称度/圆跳动/全跳动', '/workspace/.ref-tmp/tab-coaxial.html');