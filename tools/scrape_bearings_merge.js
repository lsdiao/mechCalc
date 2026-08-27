/* =========================================================
 * 轴承数据补全合并器
 * - 读取现有 data/bearings_seed.json
 * - 遍历 44 分类：拿第1页总条数/总页数；若该分类已抓条数不足，则全量翻页补抓（带重试）
 * - 去重合并后回写；打印每类 before/after 与缺失告警
 * 运行：node tools/scrape_bearings_merge.js
 * ========================================================= */
'use strict';
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

const CONC = Number(process.env.BK_CONC || 4);
const GAP = Number(process.env.BK_GAP || 90);
const OUT = path.join(__dirname, '..', 'data', 'bearings_seed.json');

const CLASSIDS = [];
for (let i = 1; i <= 43; i++) CLASSIDS.push(i);
CLASSIDS.push(44);
const BASE = 'https://c.zcwz.com/param';

function fetchHTML(url, tries = 3) {
  return new Promise((res) => {
    let err = true;
    (function attempt(n) {
      execFile('curl', ['-s', '-m', '25', url], { maxBuffer: 8 * 1024 * 1024 }, (e, out) => {
        if (!e && out && out.trim()) return res(out);
        if (n >= tries) return res('');
        setTimeout(attempt, 400 * n, n + 1);
      });
    })(1);
  });
}

const totalCountOf = (html) => {
  const m = html.match(/共\s*<b>\s*([0-9]+)/) || html.match(/共\s*([0-9]+)/);
  return m ? parseInt(m[1], 10) : 0;
};
const pageCountOf = (html, cid) => {
  const re = new RegExp('turn_x=(\\d+)&classid_x=' + cid + '"', 'g');
  let m, mx = 1;
  while ((m = re.exec(html))) mx = Math.max(mx, parseInt(m[1], 10));
  return mx;
};
function parseRows(html) {
  const rows = [];
  const trRe = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
  let t;
  while ((t = trRe.exec(html))) {
    const tr = t[1];
    if (!/class="sub"/.test(tr)) continue;
    const tdRe = /<td[^>]*>([\s\S]*?)<\/td>/g;
    const tds = [];
    let d;
    while ((d = tdRe.exec(tr))) tds.push(d[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim());
    if (tds.length < 11) continue;
    rows.push({ cat_name: tds[0], name: tds[1], old_name: tds[2], bore: tds[3], u_bore: tds[4], width: tds[5], cr: tds[6], cor: tds[7], grease_speed: tds[8], oil_speed: tds[9], weight: tds[10] });
  }
  return rows;
}
const keyOf = (r) => r.name + '|' + r.bore;

const map = new Map();
if (fs.existsSync(OUT)) {
  for (const r of JSON.parse(fs.readFileSync(OUT, 'utf8'))) map.set(keyOf(r), r);
}
console.log(`[载入] 现有 ${map.size} 条`);

(async () => {
  // 先探测所有分类的 总条数 / 总页数
  const meta = [];
  for (const cid of CLASSIDS) {
    const html = await fetchHTML(`${BASE}?mode_x=1&classid_x=${cid}`);
    if (html) meta.push({ cid, total: totalCountOf(html), pages: pageCountOf(html, cid), p1: html });
    else meta.push({ cid, total: -1, pages: -1, p1: '' });
  }

  // 判断每个分类是否已补齐：按 cat_name 统计 map 中记录数
  const catCount = {};
  for (const r of map.values()) catCount[r.cat_name] = (catCount[r.cat_name] || 0) + 1;

  const need = meta.filter((m) => m.total < 0 || catCount[cidName(m)] === undefined || (catCount[cidName(m)] || 0) < m.total);
  function cidName(m) { return m.p1 && /<td[^>]*>\s*<a[^>]*class="sub"[^>]*>([^<]+)</.exec(m.p1) ? RegExp.$1 : String(m.cid); }

  // 需要补抓的分类与页任务
  const jobs = [];
  const needMeta = meta.filter((m) => {
    const name = m.p1 ? /<a[^>]*class="sub"[^>]*>([^<]+)/.exec(m.p1) : null;
    const n = name ? name[1].trim() : '';
    const have = n ? (catCount[n] || 0) : 0;
    return m.pages >= 0 && have < m.total;
  });
  console.log(`[需要补抓的分类] ${needMeta.length} 个`);
  for (const m of needMeta) {
    const n = /<a[^>]*class="sub"[^>]*>([^<]+)/.exec(m.p1)[1].trim();
    console.log(`  #${m.cid} ${n}: 已有 ${catCount[n] || 0} / 应 ${m.total} -> 补 ${m.pages} 页`);
    jobs.push({ cid: m.cid, page: 1, html: m.p1 });
    for (let p = 2; p <= m.pages; p++) jobs.push({ cid: m.cid, page: p });
  }
  jobs.sort((a, b) => a.cid - b.cid);

  const TOTAL = jobs.length;
  console.log(`[开始补抓] 共 ${TOTAL} 页`);

  let done = 0, next = 0;
  const t0 = Date.now();
  async function worker() {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    while (true) {
      const i = next++;
      if (i >= TOTAL) break;
      const j = jobs[i];
      const html = j.page === 1 ? j.html : await fetchHTML(`${BASE}?mode_x=1&turn_x=${j.page}&classid_x=${j.cid}`);
      if (html) for (const r of parseRows(html)) if (!map.has(keyOf(r))) map.set(keyOf(r), r);
      done++;
      if (done % 50 === 0 || done === TOTAL) {
        const el = (Date.now() - t0) / 1000;
        console.log(`[补抓] ${done}/${TOTAL} 页 (${(done / TOTAL * 100).toFixed(1)}%) · 累计 ${map.size} 条 · 已用 ${(el / 60).toFixed(1)}min · 预计剩余 ${((el / done * (TOTAL - done)) / 60).toFixed(1)}min`);
      }
      if (GAP) await wait(GAP);
    }
  }
  await Promise.all(Array.from({ length: CONC }, () => worker()));

  const arr = Array.from(map.values());
  fs.writeFileSync(OUT, JSON.stringify(arr), 'utf8');
  const seen = {};
  for (const r of arr) seen[r.cat_name] = (seen[r.cat_name] || 0) + 1;
  console.log(`[完成] 合并后共 ${arr.length} 条、${Object.keys(seen).length} 个分类`);
  Object.entries(seen).sort((a, b) => b[1] - a[1]).forEach(([c, n]) => console.log(String(n).padStart(5), c));
  // 仍不足的分类告警
  for (const m of meta) {
    const n = m.p1 ? /<a[^>]*class="sub"[^>]*>([^<]+)/.exec(m.p1) : null;
    if (!n) { console.log(`[警告] 分类#${m.cid} 探测失败未补全`); continue; }
    const have = seen[n[1].trim()] || 0;
    if (have < m.total) console.log(`[不足] #${m.cid} ${n[1]} ${have}/${m.total}`);
  }
})().catch((e) => { console.error('[错误]', e); process.exit(1); });