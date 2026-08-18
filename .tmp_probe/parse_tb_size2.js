// Full parse of tb_size.html: 节线长系列 + 宽度bs系列
var fs = require('fs');
var s = fs.readFileSync('/workspace/.tmp_probe/tb_size.html', 'utf8');
function strip(h) { return h.replace(/<[^>]+>/g, '\u0001').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'); }
var tables = s.match(/<table[\s\S]*?<\/table>/g) || [];
tables.forEach(function(t, i) {
  var rows = t.match(/<tr[\s\S]*?<\/tr>/g) || [];
  var out = [];
  rows.forEach(function(r) {
    var cells = r.match(/<t[dh][\s\S]*?<\/t[dh]>/g) || [];
    var cs = cells.map(function(c) {
      var x = strip(c).replace(/\u0001/g, '').replace(/\s+/g, ' ').trim();
      return x;
    });
    if (cs.length) out.push(cs.join(' | '));
  });
  var head = out.slice(0, 3).join(' ; ');
  if (/节线长系列/.test(out.join(' ')) || /宽度bs/.test(head) || out.join(' ').indexOf('尺寸系列') >= 0) {
    console.log('==== TABLE ' + i + ' rows=' + out.length + ' ====');
    out.forEach(function(r) { console.log(r); });
    console.log();
  }
});
