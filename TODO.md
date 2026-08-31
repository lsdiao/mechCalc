# ErinsonCalc 复刻进度与后续任务

> 截至 2026-08-21。复刻流程见技能 `.trae/skills/原站-replicate/SKILL.md`。

## 一、已完成（已推送 main）

### 连接校核模块
- 螺栓连接（普通/紧螺栓、动载荷）、键连接设计校核、销连接等 6 项 —— `js/tools/connection.js`

### 机械传动模块（第二轮，1:1 复刻自 原站）
| 工具 | 文件 | 对应原站 | 依据标准 |
|------|------|----------|----------|
| 滚子链传动设计 | `js/tools/trans2_chain.js` | calculation_chaindrive | GB/T 18150-2000、GB/T 1243 |
| 梯形齿同步带设计 | `js/tools/trans2_timing.js` | calculation_timingbeltdrive | GB/T 11362-1989（P0 表、zmin 表、Kz 表均已内置） |
| 普通平带/尼龙片复合平带设计 | `js/tools/trans2_flat.js` | calculation_flatbelt | GB/T 524-2007、手册表 13-1-68~76 |
| 蜗杆传动设计 | `js/tools/trans2_worm.js` | calculation_wormgear（gd_worm） | GB/T 10085 蜗杆基本参数、滑动速度-效率公式 |
| 凸轮分度器选型 | `js/tools/trans2_cam.js` | calculation_camindexer1 | 潭子样本：Am/Vm/Qm 运动特性系数 |
| 多楔带传动设计 | `js/tools/trans2_ribbed.js` | calculation_multi-ribbedbelttransmission（polyv1/polyv2） | JB/T 5983-2017 / JB/T 5983-1992（P1/ΔP1/KL/Kr 已内置） |

- 全部注册进 `index.html`；回归测试 `node tests/run-tests.js` 共 169 项断言全部通过。
- 原站逆向素材（混淆 JS 解密脚本、表单 dump、文档页 HTML）保留在 `.tmp_probe/`，复刻时逐值比对过 API 端点返回。

### 第三轮：补齐剩余 31 个缺口计算工具（1:1/标准实现，已推送）
针对线上 原站 "常用设计计算工具"清单做差异盘点，补齐本地缺失的 30 个计算工具 + 1 个信息页工具。由并发子代理批量开发，逐项自测后由主会话集成注册。

| 新文件 | 工具（id） |
|--------|-----------|
| `js/tools/fluid2.js` | hydraulic-pipe-loss、hydraulic-pump、hydraulic-motor、hydraulic-jack、oil-tank-balance |
| `js/tools/fluid3.js` | pneumatic-finger、cylinder-consumption、pneumatic-circuit、vacuum-suction、hydraulic-buffer（select）、cheli-air（信息页） |
| `js/tools/fluid4.js` | sealing-o-ring（connect）、water-pump |
| `js/tools/bearing.js` | rolling-bearing、deep-groove-bearing、angular-contact-bearing、thrust-ball-bearing、tapered-roller-bearing、shaft-design |
| `js/tools/other1.js` | tension-spring、linear-guide、screw-transmission |
| `js/tools/trans2_extra.js` | double-speed-chain、gear-thickness |
| `js/tools/common2.js` | beam-calculator、fastener-calculator、material-weight、plate-bending、shell-stress、mechanism-force |

- 注册进 `index.html`；`js/app.js` SUBMENUS 新增"轴承设计/轴与密封/缓冲器选型/结构与梁板/紧固件"等分组。
- 回归测试 `node tests/run-tests.js` 现共 **231 项断言全部通过、0 失败**（63 个工具默认可算 + 各模块公式/表格/变工况断言）。
- 注：sealingsolutions / watersystemcalculation / deflectioapp / fastener 等原站页面为第三方外链聚合（无本地上公式）或已 404，按《机械设计手册》/ISO 3601 标准方法实现并注释来源，非逐值 1:1。

## 二、多楔带传动设计：实现备忘（已完成，见上表）

### 素材（保留在 `.tmp_probe/`）
- **页面已抓**：`.tmp_probe/polyvbeltdesign.html`（工具页）、`beltdrive_designandcalculationofmulti-ribbedbelttransmission.html`（JB/T 5983-2017 文档页）
- **JS 已解密**：`.tmp_probe/belt.decoded.x9.js`（含全部 pv_ 前缀逻辑）
- **表单字段已 dump**：`.tmp_probe/dump_polyv_form.js` 运行结果在 `out_polybelt.txt`
- **核心系数表实测**：polyv1/polyv2 API（apizta.com）重新可达后，现场采网格数据写入 `pv_geo_ka.json`、`pv_grid_all.js`、`pv_p1_dense.json` 等，P1/ΔP1 取实测，Kα/KL/Kr 同理逐值对齐并线性插值。

### 已确认的关键计算逻辑（来自解密 JS）
1. **双计算路径**：
   - 查表法：`POST polyvP1Query {beltSize, n1, de1, i}` → 返回 `p1`（额定功率）与 `deltaP1`（功率增量）
   - 公式法：`POST polyvPrFormula {beltSize, n1, de1, deltaE, i, kL, kAlpha}` → 返回 power1
2. **带长换算**：`POST polyvBeltLenChange {de1, de2, calBeltLen, beltLen}` → 返回 `a`（中心距）、`alpha1`（小轮包角）、`kAlpha`、`kL`、`kr`
3. **前端合成公式**：`power1 = (rawP1 + deltaP1) × kAlpha × kL`；楔数 `z = ceil(powerD / power1)` 后按带型查楔数系列取标准值
4. **大带轮直径**：`de2Cal = i × (de1 + 2ΔE) × (1 − ε) / (2ΔE)`，ΔE 为带轮有效直径与节径差、ε 为弹性滑动率，然后向带型标准直径系列取最近值（系列数组已由解密 JS `_0x105176`/`_0x16db6c`/`_0x39e0b8`/`_0x199565` 完整还原为 `DIA`）。

### 已解决的原卡点
- 原卡点“核心系数表是 31 张图片”已解除：polyv1/polyv2 API 恢复可达后，直接现场采 P1/ΔP1/Kα/KL/Kr 网格数据并对齐，见 `trans2_ribbed.js` 内置常量表（Kα/KL/Kr 线性插值、ΔP1 阶梯 i 表、每楔 P1 双线性插值）。
- 带型（PJ/PK/PL/PM）有效直径/有效长度/楔数系列、中心距调整量均已由解密 JS 的系列数组还原，见 `WEDGE_STD`/`DIA`/`LE_STD`/`ADJ`。

## 三、后续可选（非本次范围）
- trans2 六工具的逐值回归断言目前以默认参数+若干典型工况为主；建议后续从原站再采 2~3 组工况做数值快照断言（原站 API 可达时）。
- 机械传动其余原站工具（如 V 带已有简化版 `transmission.js`，可对照原站 upgrade 成 1:1 版）。
