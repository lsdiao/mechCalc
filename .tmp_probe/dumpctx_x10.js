// 提取每个输入字段的上下文可见文本（label/单位）
const fs = require('fs');
const file = process.argv[2];
const ids = process.argv.slice(3);
const html = fs.readFileSync(file, 'utf8');
const strip = s => s.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

for (const id of ids) {
  // 找到包含该 id 的元素位置，取前后 400 字符的文本
  const re = new RegExp(`(id="${id}"|for="${id}")`);
  const m = html.search(re);
  if (m < 0) { console.log(`${id}: NOT_FOUND`); continue; }
  const ctx = html.slice(Math.max(0, m - 450), Math.min(html.length, m + 250));
  console.log(`--- ${id}: ${strip(ctx)}`);
}
