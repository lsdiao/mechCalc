// 提取 input/select id 周边文本（label/单位）
const fs = require('fs');
const html = fs.readFileSync(process.argv[2], 'utf8').replace(/\n\s+/g, ' ');
const ids = process.argv.slice(3);
for (const id of ids) {
  const idx = html.indexOf(`id="${id}"`);
  if (idx < 0) { console.log(`### ${id}: NOT FOUND`); continue; }
  const start = Math.max(0, idx - 260), end = Math.min(html.length, idx + 200);
  let ctx = html.slice(start, end).replace(/<[^>]*>/g, '§').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
  console.log(`### ${id}:\n${ctx}\n`);
}
