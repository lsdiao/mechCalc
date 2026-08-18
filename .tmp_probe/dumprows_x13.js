// 按表格行提取：label（同 td 或前一个 td）、单位（input 后的 span）
const fs = require('fs');
const files = {
  tp: '/workspace/.tmp_probe/timingbeltdrive.html',
  pv: '/workspace/.tmp_probe/polyvbeltdesign.html',
  fb: '/workspace/.tmp_probe/flatbelt.html'
};
const clean = s => s.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
for (const [k, f] of Object.entries(files)) {
  const html = fs.readFileSync(f, 'utf8');
  console.log(`\n########## ${k} ##########`);
  const rows = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)];
  for (const [, r] of rows) {
    const tds = [...r.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(x => x[1]);
    for (let i = 0; i < tds.length; i++) {
      const td = tds[i];
      const inputs = [...td.matchAll(/<(input|select)[^>]*>/g)];
      if (!inputs.length) continue;
      for (const im of inputs) {
        const tag = im[0];
        const id = (tag.match(/id="([^"]+)"/) || [])[1];
        if (!id) continue;
        const val = (tag.match(/value="([^"]*)"/) || [])[1] || '';
        const unit = clean((td.slice(im.index + tag.length).match(/<span[^>]*>([\s\S]*?)<\/span>/) || [])[1] || '');
        // label: 同 td 内 input 前的文字，否则前一个 td
        let lab = clean(td.slice(0, im.index));
        if (!lab && i > 0) lab = clean(tds[i - 1]);
        console.log(`${id} | ${lab} | ${unit} | def=${val}`);
      }
    }
  }
}
