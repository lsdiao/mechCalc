// 重新解析 tb_size.html 节线长表：展开 colspan/rowspan，输出每带型齿数系列
var fs = require('fs');
var s = fs.readFileSync('/workspace/.tmp_probe/tb_size.html', 'utf8');
function strip(h) {
  return h.replace(/<[^>]+>/g, '\u0001').replace(/&nbsp;|&#160;/g, ' ')
          .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}
var tables = s.match(/<table[\s\S]*?<\/table>/g) || [];
tables.forEach(function (t, i) {
  var rows = t.match(/<tr[\s\S]*?<\/tr>/g) || [];
  var flat = rows.map(function (r) {
    var cells = r.match(/<t[dh][\s\S]*?<\/t[dh]>/g) || [];
    var out = [];
    cells.forEach(function (c) {
      var txt = strip(c).replace(/\u0001/g, '').replace(/\s+/g, ' ').trim();
      var cs = /colspan\s*=\s*["']?(\d+)/i.exec(c);
      var n = cs ? +cs[1] : 1;
      for (var k = 0; k < n; k++) out.push(k === 0 ? txt : (txt || ''));
    });
    return out;
  });
  var joined = flat.map(function (c) { return c.join('|'); }).join('\n');
  if (joined.indexOf('91.44') >= 0) {
    console.log('TABLE idx=' + i + ' dataRows=' + flat.length);
    flat.forEach(function (c, ri) { console.log(ri + ': ' + c.join(' | ')); });
  }
});
