# MechCalc 复刻进度与后续任务

> 截至 2026-08-18。复刻流程见技能 `.trae/skills/mechtool-replicate/SKILL.md`。

## 一、已完成（已推送 main）

### 连接校核模块
- 螺栓连接（普通/紧螺栓、动载荷）、键连接设计校核、销连接等 6 项 —— `js/tools/connection.js`

### 机械传动模块（第二轮，1:1 复刻自 mechtool.cn）
| 工具 | 文件 | 对应原站 | 依据标准 |
|------|------|----------|----------|
| 滚子链传动设计 | `js/tools/trans2_chain.js` | calculation_chaindrive | GB/T 18150-2000、GB/T 1243 |
| 梯形齿同步带设计 | `js/tools/trans2_timing.js` | calculation_timingbeltdrive | GB/T 11362-1989（P0 表、zmin 表、Kz 表均已内置） |
| 普通平带/尼龙片复合平带设计 | `js/tools/trans2_flat.js` | calculation_flatbelt | GB/T 524-2007、手册表 13-1-68~76 |
| 蜗杆传动设计 | `js/tools/trans2_worm.js` | calculation_wormgear（gd_worm） | GB/T 10085 蜗杆基本参数、滑动速度-效率公式 |
| 凸轮分度器选型 | `js/tools/trans2_cam.js` | calculation_camindexer1 | 潭子样本：Am/Vm/Qm 运动特性系数 |

- 全部注册进 `index.html`；回归测试 `node tests/run-tests.js` 共 136 项断言全部通过。
- 原站逆向素材（混淆 JS 解密脚本、表单 dump、文档页 HTML）保留在 `.tmp_probe/`，复刻时逐值比对过 API 端点返回。

## 二、待完成：多楔带传动设计（唯一缺口）

### 现状（素材已备齐，可直接开工）
- **页面已抓**：`.tmp_probe/polyvbeltdesign.html`（工具页）、`beltdrive_designandcalculationofmulti-ribbedbelttransmission.html`（JB/T 5983-2017 文档页）
- **JS 已解密**：`.tmp_probe/belt.decoded.x9.js`（含全部 pv_ 前缀逻辑）
- **表单字段已 dump**：`.tmp_probe/dump_polyv_form.js` 运行结果在 `out_polybelt.txt`

### 已确认的关键计算逻辑（来自解密 JS）
1. **双计算路径**：
   - 查表法：`POST polyvP1Query {beltSize, n1, de1, i}` → 返回 `p1`（额定功率）与 `deltaP1`（功率增量）
   - 公式法：`POST polyvPrFormula {beltSize, n1, de1, deltaE, i, kL, kAlpha}` → 返回 power1
2. **带长换算**：`POST polyvBeltLenChange {de1, de2, calBeltLen, beltLen}` → 返回 `a`（中心距）、`alpha1`（小轮包角）、`kAlpha`、`kL`、`kr`
3. **前端合成公式**：`power1 = (rawP1 + deltaP1) × kAlpha × kL`；楔数 `z = ceil(powerD / power1)` 后按带型查楔数系列取标准值
4. **大带轮直径**：`de2Cal = i × (de1 + 2ΔE) × (1 − ε) / (2ΔE)`，ΔE 为带轮有效直径与节径差、ε 为弹性滑动率，然后向带型标准直径系列取最近值（PK/PL/PM/… 系列数组在解密 JS 中为 `_0x105176`/`_0x16db6c`/`_0x39e0b8`/`_0x199565` 四个数组，需要进一步还原）

### 卡点：核心系数表是 31 张图片
- P1（各型带额定功率）、ΔP1、KL（带长修正）、Kr（楔数修正）四张表在 mechdoc.cn 上为图片：
  `https://www.mechdoc.cn/images/beltdrive/lg-img/JBT 5983-2017/3.png ~ 31.png`（清单见 `.tmp_probe/poly_text.txt`）
- 原站 API（polyvP1Query 等）需登录且此前探测已 404/断连，**离线复刻无法直接拿数值**。

### 建议路线（按优先级）
1. **首选**：人工读图转录 JB/T 5983-2017 的 P1/ΔP1/KL/Kr 四表（图已可访问时可逐张下载核对；图不可访问时改查 JB/T 5983-2017 标准原文或《机械设计手册》第 13 篇对应表），录入为 JS 数据表。
2. **替代**：公式法路径可先实现——解密 JS 中 polyvPrFormula 的输入输出关系已完整，配合标准中给出的 P1 经验公式（P1 = (n1/1000)·(a·de1^b)·… 型幂函数拟合式）补齐系数。
3. **楔数/直径系列**：从解密 JS 还原 PK/PL/PM 系列数组（混淆名见上），或直接查 JB/T 5983 表 4 有效直径系列。
4. 实现文件命名沿用 `js/tools/trans2_ribbed.js`，注册进 `index.html` 与 `tests/run-tests.js`，公式/取值/圆整规则逐项对照解密 JS。

## 三、后续可选（非本次范围）
- trans2 五工具的逐值回归断言目前只有默认参数运行检查；建议后续从原站再采 2~3 组典型工况做数值快照断言（原站 API 恢复可达时）。
- 机械传动其余原站工具（如 V 带已有简化版 `transmission.js`，可对照原站 upgrade 成 1:1 版）。
