// 提取三个 HTML 中所有 input/select 的 id、label、单位、默认值、readOnly
const fs = require('fs');
const files = {
  tp: '/workspace/.tmp_probe/timingbeltdrive.html',
  pv: '/workspace/.tmp_probe/polyvbeltdesign.html',
  fb: '/workspace/.tmp_probe/flatbelt.html'
};
for (const [k, f] of Object.entries(files)) {
  const html = fs.readFileSync(f, 'utf8');
  console.log(`\n########## ${k}: ${f.split('/').pop()} ##########`);
  // form-group 块
  const blocks = html.split(/<div class="(?:form-group|col-[^"]*)"/);
  const re = /<(input|select)[^>]*\bid="([^"]+)"[^>]*>/g;
  let m;
  const seen = new Set();
  while ((m = re.exec(html))) {
    const id = m[2];
    if (seen.has(id)) continue;
    seen.add(id);
    // 向前找 300 字符内的 label
    const before = html.slice(Math.max(0, m.index - 400), m.index);
    const labels = [...before.matchAll(/<label[^>]*>([\s\S]*?)<\/label>/g)];
    const lab = labels.length ? labels[labels.length - 1][1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() : '?';
    const tag = m[0];
    const val = (tag.match(/value="([^"]*)"/) || [])[1] || '';
    const ro = /readonly/i.test(tag) ? ' [RO]' : '';
    const ph = (tag.match(/placeholder="([^"]*)"/) || [])[1] || '';
    console.log(`${id} | ${lab} | def=${val}${ph ? ' ph=' + ph : ''}${ro}`);
  }
  // 单独找 label-for 模式
  const re2 = /<label[^>]*for="([^"]+)"[^>]*>([\s\S]*?)<\/label>/g;
  const map2 = {};
  while ((m = re2.exec(html))) {
    map2[m[1]] = m[2].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
  console.log('--- label[for] map ---');
  for (const [id, l] of Object.entries(map2)) console.log(`${id} => ${l}`);
}
