const fs = require('fs');

const files = {
  tp: '/workspace/.tmp_probe/timingbeltdrive.html',
  pv: '/workspace/.tmp_probe/polyvbeltdesign.html',
  fb: '/workspace/.tmp_probe/flatbelt.html'
};

for (const [tag, f] of Object.entries(files)) {
  const html = fs.readFileSync(f, 'utf8');
  console.log('\n########## ' + tag + ' : ' + f + ' ##########');
  // 抓取 input/select 元素及其前面的 label 文本
  const re = /<div[^>]*class="[^"]*(?:form-group|col-[^"]*)[^"]*"[^>]*>([\s\S]*?)<\/div>/g;
  // 更直接：抓所有 <label>...<input id=...> 组合，宽松匹配 label 后跟元素
  const re2 = /<label[^>]*>([\s\S]*?)<\/label>([\s\S]{0,600}?)(<input|<select)[^>]*\bid="([^"]*)"[^>]*>/g;
  let m;
  const seen = new Set();
  while ((m = re2.exec(html))) {
    let label = m[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    const id = m[4];
    const tag2 = m[3];
    let attrs = m[0];
    let unit = (m[2].match(/<span[^>]*>([^<]*)<\/span>/) || [])[1] || '';
    const readonly = /readonly/.test(attrs) ? ' [readonly]' : '';
    const disabled = /disabled/.test(attrs) ? ' [disabled]' : '';
    if (!seen.has(id)) {
      seen.add(id);
      console.log(`${tag2} #${id}${readonly}${disabled} | label: ${label} | ctxUnit: ${unit.trim()}`);
    }
  }
}
