// 提取 HTML 内嵌表格与 select 选项
const fs = require('fs');
const html = fs.readFileSync(process.argv[2], 'utf8');

// 提取所有 table（带 id）
const tables = [...html.matchAll(/<table[^>]*id="([^"]*)"[^>]*>([\s\S]*?)<\/table>/g)];
for (const [, id, body] of tables) {
  console.log(`\n===== TABLE ${id} =====`);
  const rows = [...body.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)];
  for (const [, r] of rows) {
    const datav = (r.match(/data-value="([^"]*)"/) || [])[1];
    const cells = [...r.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map(c => c[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim());
    console.log((datav !== undefined ? `[data-value=${datav}] ` : '') + cells.join(' | '));
  }
}

// 提取 select 选项
const selects = [...html.matchAll(/<select[^>]*id="([^"]*)"[^>]*>([\s\S]*?)<\/select>/g)];
for (const [, id, body] of selects) {
  if (/searchform|navbar/i.test(id)) continue;
  const opts = [...body.matchAll(/<option[^>]*value="([^"]*)"[^>]*>([^<]*)/g)].map(o => `${o[1]}:${o[2].trim()}`);
  const opts2 = opts.length ? opts : [...body.matchAll(/<option[^>]*>([^<]*)/g)].map(o => `=${o[1].trim()}`);
  console.log(`\n===== SELECT ${id} ===== ${opts2.join(', ')}`);
}
