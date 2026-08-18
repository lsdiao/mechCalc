// 提取说明文章区（article/td[id^=desc]等）所有表格
const fs = require('fs');
const html = fs.readFileSync(process.argv[2], 'utf8');
const tables = [...html.matchAll(/<table[^>]*>([\s\S]*?)<\/table>/g)];
let n = 0;
for (const [, body] of tables) {
  const rows = [...body.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)];
  const parsed = rows.map(([, r]) => [...r.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map(c => c[1].replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()).join(' | ')).filter(x => x.replace(/\|/g, '').trim());
  const flat = parsed.join(' ; ');
  if (/Kα|Kβ|包角|布置|σ0|P0|功率|直径|带长|kN\/m|拉伸/i.test(flat)) {
    console.log(`\n===== TABLE #${n} =====`);
    parsed.forEach(r => console.log(r));
  }
  n++;
}
