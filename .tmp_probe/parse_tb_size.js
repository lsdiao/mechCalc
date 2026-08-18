// 解析 tb_size.html 中 节线长系列 及 宽度bs系列 表
var fs = require('fs');
var s = fs.readFileSync('/workspace/.tmp_probe/tb_size.html', 'utf8');
// strip tags -> cell arrays per table
function strip(h) { return h.replace(/<[^>]+>/g, '\u0001').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, function(m){return m.indexOf('\u0001')>=0?m:' ';}); }
var tables = s.match(/<table[\s\S]*?<\/table>/g) || [];
tables.forEach(function(t, i) {
  var txt = strip(t).replace(/\u0001+/g, '|').replace(/\s*\|\s*/g, '|');
  if (/节线长系列|宽度bs|基准宽度/.test(txt) || /5080|10160|15240/.test(txt)) {
    console.log('==== TABLE ' + i + ' ====');
    console.log(txt.slice(0, 4000));
    console.log();
  }
});
