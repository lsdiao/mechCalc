const fs = require('fs');

const files = {
  tp: '/workspace/.tmp_probe/timingbeltdrive.html',
  pv: '/workspace/.tmp_probe/polyvbeltdesign.html',
  fb: '/workspace/.tmp_probe/flatbelt.html'
};

for (const [tag, f] of Object.entries(files)) {
  const html = fs.readFileSync(f, 'utf8');
  console.log('\n########## ' + tag + ' ##########');
  // 找每个 id="xxx" 的 input/select，向前找最近的 <label> 或 <td> 文本
  const re = /\bid="([^"]*)"/g;
  let m;
  const ids = new Set();
  while ((m = re.exec(html))) ids.add(m[1]);
  for (const id of ids) {
    if (/^(showSidebar|errorInfo|btn_|tp_result|pv_error|fb_diameter|fb_beltLen|pv_p1Query|kLQuery)/.test(id)) continue;
    const idx = html.indexOf(`id="${id}"`);
    // 向前取 500 字符找 label
    const before = html.slice(Math.max(0, idx - 600), idx);
    const labels = [...before.matchAll(/<label[^>]*>([\s\S]*?)<\/label>/g)];
    let label = labels.length ? labels[labels.length - 1][1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() : '';
    // 向后取 200 字符找单位 span
    const after = html.slice(idx, idx + 300);
    const unitMatch = (after.match(/<\/(input|select)>?\s*(?:<[^>]*>)*\s*([^<>{]{0,20})/) || []);
    let unit = '';
    const um = after.match(/>\s*([mμ]m|kW|r\/min|N|mm\/s|°|N\/mm²|MPa|kN\/m)\s*</);
    if (um) unit = um[1];
    const isInput = /<input/.test(before.slice(-100)) || new RegExp(`<input[^>]*id="${id}"`).test(html);
    console.log(`#${id} | label: ${label} | unit: ${unit}`);
  }
}
