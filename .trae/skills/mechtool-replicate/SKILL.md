---
name: "mechtool-replicate"
description: "1:1 复刻 mechtool.cn 计算工具的完整工作流：抓页面、解混淆 JS 提公式、按本地 App.registerTool 模式实现、逐值对齐自测。当需要新增/复核机械设计计算工具（螺栓、键、带、链、齿轮、轴承、液压气动等）并要求结果与原站一致时调用。"
---

# mechtool.cn 计算工具 1:1 复刻工作流

目标：让本地工具的计算结果、默认值、推荐表、许用应力表与 mechtool.cn 对应页面**逐值一致**。

## 流程总览

```
① 页面发现 → ② 资源抓取 → ③ 表单提取 → ④ 公式提取（解混淆）→ ⑤ 实现 → ⑥ 对齐自测 → ⑦ 回归+提交
```

### ① 页面发现
- 站点首页可一次拿全所有计算页链接：
  `curl -s https://www.mechtool.cn/ | 提取 href="/calculation/calculation_*.html"`
- 原站无服务端计算 API（返回 404/HTML），全部计算在**前端混淆 JS** 内完成，不要浪费时间试 POST。

### ② 资源抓取
- 抓目标页 HTML，从 `<script src>` 中找出该页专属的 `.min.js`（通常按页面主题命名）。
- 限流注意：连续请求加 `sleep 1.5`，失败先重试一次再降速。
- 全部暂存到工作区临时目录（如 `.tmp_probe/`），**提交前删除**；若该目录曾被 git 跟踪，勿用 `DeleteFile` 直接删，先 `git status` 确认。

### ③ 表单提取（参数/默认值/系列表的唯一权威来源）
用 Node 脚本解析 HTML 内 `<form>`，输出每个 `select` 的 option 序列与 `input` 默认值：

```js
// formdump.js — node formdump.js <页面.html>
var s = require('fs').readFileSync(process.argv[2], 'utf8');
(s.match(/<form[\s\S]*?<\/form>/g) || []).forEach(function (f) {
  if (/searchform/.test(f)) return;
  (f.match(/<select[\s\S]*?<\/select>/g) || []).forEach(function (sel) {
    var nm = (sel.match(/name="([^"]+)"/) || [])[1];
    console.log('SELECT', nm, ':', (sel.match(/value="[^"]*"/g) || []).map(function (v) {
      return v.slice(7, -1);
    }).join(','));
  });
  (f.match(/<input[^>]*>/g) || []).forEach(function (inp) {
    var nm = (inp.match(/name="([^"]+)"/) || [])[1];
    if (nm) console.log('INPUT', nm, 'value=', (inp.match(/value="([^"]*)"/) || [])[1]);
  });
});
```

要点：
- option 的 `value` 顺序即原站下拉顺序，1:1 保留；
- `input value` 即原站默认输入，本地工具的 `default` 必须一致；
- 同一表单内隐藏依赖（如换材料自动改写许用应力框）在 JS 里，见④。

### ④ 公式提取（解混淆）
原站 JS 为 OB 系列_obfuscator 混淆：字符串数组 + 十六进制数字。经验：
- **数值常量**：`0x87`≠135 这类十六进制直接换算；用 `new RegExp('0x'+n.toString(16),'g')` 在源码中定位上下文；
- **分支表**：找 `case'载荷类型':` 这类字符串 switch，逐 case 换算十六进制得到映射表；
- **计算式**：混淆不改算术结构，在 submit 回调里找 `2000`（N·m→N·mm）、`0.4`、`Math.sqrt` 等特征定位公式主体；
- 提取后在本地用 JS 重算一组默认输入，与原站页面默认结果（HTML 里常有预填结果或用浏览器实测）对照。

### ⑤ 本地实现（App.registerTool 模式）
- 文件按分类放置（如 `js/tools/transmission.js`），结构：
  - `inputs`：`segment/select/number`，select 的 options 用③的 value 序列生成；`default` 与原站一致；
  - `compute(v)`：纯函数，返回 `{sections:[{title,rows:[{label,value|html,unit,d,hl}]}], verdict:{level,text,note}, notes}`；
  - 行数据可读性要求：label 带公式名（如 `计算应力 σp=2T/(dkl)`），关键行 `hl:true`；
  - 自动推荐逻辑（留空自动选许用应力/规格）复刻原站 switch 映射，映射表以模块级常量存放并注释来源；
- 单位约定：界面 N·m、内部 N·mm（×1000），输出注意 ÷1000 还原。
- 校核类 verdict：`ok/bad` 两级 + 改进建议 note。

### ⑥ 对齐自测
- 在 `tests/run-tests.js` 按模块新增断言组：
  - 默认参数整组跑通且 verdict 正确；
  - 每个公式至少 1 组手算期望值（near 断言）；
  - 每张映射表抽查边界档位（最大/最小/中间覆盖分支）；
  - 变工况（双键/不同材料/动 vs 静连接等）确认分支生效；
- `node tests/run-tests.js` 全绿后再提交。

### ⑦ 回归 + 提交
- 全量回归（历史模块不得回归）；
- 提交信息格式参考：`<模块> 1:1 复刻 mechtool.cn：<工具清单>`，正文列公式对齐点、表格来源、自测结论；
- 只提交源码与测试，`.tmp_probe/` 等临时目录不入库；push 到 main 前确认工作区干净。

## 常见坑
| 坑 | 解法 |
|---|---|
| 映射表键名与 select value 不一致（如 `steel` vs `钢`）导致 undefined 崩溃 | 映射表键必须直接用 select 的中文 value |
| 多表单共用一个 JS，同名 id 加数字后缀（`#torque1/#torque2`） | 按表单 id 区分哪组参数属于哪个工具 |
| 原站“半圆键”等特例在共用 switch 内做覆盖 | 提取时保留覆盖分支，不要只抄通用表 |
| 转矩单位混乱（页面 N·m、公式 N·mm） | 入口统一 ×1000，出口 ÷1000，测试断言锁定 |
| 抓取被 503 | 限速 1.5s/次 + 重试；UA 带完整 Chrome 串 |
