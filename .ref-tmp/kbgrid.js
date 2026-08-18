var fs = require('fs');
function grids(file) {
  var h = fs.readFileSync(file, 'utf8');
  var tables = h.match(/<table[\s\S]*?<\/table>/g) || [];
  tables.forEach(function (t, idx) {
    var trs = t.match(/<tr[^>]*>[\s\S]*?<\/tr>/g) || [];
    console.log('=== ' + file.split('/').pop() + ' table' + idx + ' ===');
    trs.forEach(function (tr) {
      var tds = tr.match(/<t[hd][^>]*>[\s\S]*?<\/t[hd]>/g) || [];
      var cells = [];
      var col = 0;
      tds.forEach(function (td) {
        var span = (td.match(/colspan="(\d+)"/) || [0, 1])[1] - 0;
        var rs = (td.match(/rowspan="(\d+)"/) || [0, 1])[1] - 0;
        var txt = td.replace(/<[^>]+>/g, '').trim();
        var btn = td.match(/<button[^>]*class="([^"]*)"[^>]*>([^<]*)<\/button>/);
        var cell;
        if (btn) cell = '"' + btn[2] + '":"' + (btn[1].indexOf('blue') >= 0 ? 'B' : 'Y') + '"';
        else if (txt) cell = 'H[' + txt + ']' + (span > 1 ? 'x' + span : '') + (rs > 1 ? '/rs' + rs : '');
        else cell = '·';
        for (var s = 0; s < span; s++) cells.push(s === 0 ? cell : '↔');
      });
      console.log(cells.join(' '));
    });
  });
}
grids('/workspace/.ref-tmp/tol.html');
grids('/workspace/.ref-tmp/fit.html');
