# 普通平带传动设计计算 — mechtool.cn 1:1 复刻探针记录

页面：https://www.mechtool.cn/calculation/calculation_flatbelt.html
JS：/dist/js/mechtool/beltdrivedesign.min.js（解混淆件 belt.pretty.x9.js）
注意：任务给的 `/calculation/cal/calculation_<名>` 返回 404；实际端点为 `https://www.mechtool.cn/calculation/<名>`（$.post 相对当前路径解析），已用 curl -X POST -H 'X-Requested-With: XMLHttpRequest' 验证。

## 端点清单（均 POST，表单编码，返回 JSON {flag, resultData}）

| 端点 | 参数 | 返回 |
|---|---|---|
| flatbelt1 | d1,d2,a0,transmissionType(open/cross/halfCross) | {a, calBeltLen, alpha1, kAlpha} |
| flatbeltAlpha1 | d1,d2,a,transmissionType | {alpha1, kAlpha} |
| flatbeltP0Query | ordinary: beltCategory,d1OverDelta,velocity,sigma0；nylon: beltCategory,nylonBeltType,velocity | P0 数值（ordinary 保留 3 位小数，nylon 原始精度） |
| flatbeltKAlphaQuery | alpha1 | kAlpha 数值（3 位小数） |
| flatbelt2 | Pd,P0,kAlpha,kBeta,beltCategory,delta,alpha1,sigma0 | {A, b, Fr}（均 2 位小数；nylon 无 A） |

## 由探针反推的服务端公式（全部经数值验证）

- flatbelt1：
  - L0(calBeltLen)：open `2a0+π/2(d1+d2)+(d2−d1)²/(4a0)`；cross `…+(d1+d2)²/(4a0)`；halfCross `…+(d1²+d2²)/(4a0)` → round2
  - α1：open `180−(d2−d1)/a0×57.3`；cross `180+(d1+d2)/a0×57.3`；halfCross `180+d1/a0×57.3` → round2（a 直接回显 a0）
  - Kα：表13-1-71 线性插值（α∈[120,220]，出界 flag=false）→ round3
- flatbeltP0Query ordinary：表13-1-70（F4）双线性插值（d1/δ∈[30,100]、v∈[5,30]，出界 flag=false）× `(1+0.39(σ0−1.8))` → round3（σ0=1.6→−7.8%、2.0→+7.8% 线性外推，σ0=1.2 时 2.1×0.766=1.6086→1.609 验证线性）
- flatbeltP0Query nylon：表13-1-76 按 v 节点 [10,15,20,25,30,35,40,45,50,57.5,65,70]（"55~60"档按 57.5 插值节点，经 v=55/57.5/60 三点验证）线性插值，v∈[10,70]，返回未舍入值；单位 kW/mm
- flatbelt2 ordinary：`A=Pd/(P0·Kα·Kβ)`（cm²）、`b=100A/δ`（mm，A 取 cm²；A=3.81、δ=6 → b=63.46 已验证）、`Fr=2σ0·A·100·sin(α1/2)`（N），A/b/Fr 均 round2，且 b、Fr 用 A 的未舍入值、α1 用 2 位小数舍入值
- flatbelt2 nylon：`b=Pd/(P0·Kα·Kβ)`（mm，P0 单位 kW/mm）、`Fr=2σ0·b·δ·sin(α1/2)`，round2
- 前端（belt.pretty.x9.js）：d1Cal=C·∛(P/n1)（C=1100~1350）；d2Cal=d1·i·(1−ε)；v=πd1n1/60000（3位）；a0min=1.5(d1+d2)、a0max=5(d1+d2)；Li=L0−πδ；选标准 Li 后 L=Li+πδ、a=a0+(L−L0)/2；y=1000mv/L0；d1/δ 保留 1 位；Kβ={autoTension:1/1/1, simpleOpen:1/0.9/0.8, cross:0.9/0.8/0.7, halfCross:0.8/0.7/0.6}×β角(0~60/60~80/80~90)；bStd=[16,20,25,32,40,50,63,71,80,90,100,112,125,140,160,180,200,224,250,280,315,355,400,450,500] 中首个 ≥b；Frmax=1.5Fr；Pd=round3(KA·P)；δ 推荐 d1/40~d1/30，自动取标准系列中首个 ≥d1/40 者

## 单元探针记录（原始返回）

### flatbelt1
| 参数 | 返回 |
|---|---|
| d1=224,d2=800,a0=1600,open | {a:1600.0, calBeltLen:4860.34, kAlpha:0.938, alpha1:159.37} |
| d1=224,d2=800,a0=1600,cross | {a:1600.0, calBeltLen:4972.34, kAlpha:1.183, alpha1:216.67} |
| d1=224,d2=800,a0=1600,halfCross | {a:1600.0, calBeltLen:4916.34, kAlpha:1.04, alpha1:188.02} |
| d1=200,d2=630,a0=1245,cross | {a:1245.0, calBeltLen:3932.09, kAlpha:1.191, alpha1:218.2} |

### flatbeltAlpha1
| 参数 | 返回 |
|---|---|
| d1=224,d2=800,a=1627.95,open | {kAlpha:0.939, alpha1:159.73} |
| d1=224,d2=800,a=1627.95,cross | {kAlpha:1.18, alpha1:216.04} |
| d1=100,d2=355,a=800,halfCross | {kAlpha:1.036, alpha1:187.16} |

### flatbeltKAlphaQuery（有效域 [120,220]）
| alpha1 | 返回 |
|---|---|
| 159.37 | 0.938 |
| 200 | 1.1 |
| 121 | 0.823 |
| 135 | 0.865 |
| 219.9 | 1.2 |
| 220 | 1.2 |
| 120 | 0.82 |
| 190 | 1.05 |
| 119 / 220.5 / 95 | flag=false（出界） |

### flatbeltP0Query ordinary（有效域 d1/δ∈[30,100]、v∈[5,30]）
| d1OverDelta,velocity,sigma0 | 返回 |
|---|---|
| 30,10,1.8 | 2.1 |
| 33,10,1.8 | 2.16 |
| 30,10.5,1.8 | 2.2 |
| 42.5,17.2,1.8 | 3.465 |
| 45,12.34,1.8 | 2.668 |
| 30,10,1.6 | 1.936 |
| 30,10,2.0 | 2.264 |
| 30,10,2.2 | 2.428 |
| 30,10,1.2 | 1.609 |
| 20 或 150（d1/δ 出界） | flag=false |
| v=3 或 35（v 出界） | flag=false |

### flatbeltP0Query nylon（有效域 v∈[10,70]，"55~60"节点=57.5）
| nylonBeltType,velocity | 返回 |
|---|---|
| EL,10 | 0.06 |
| EL,12.5 | 0.0745 |
| EH,20 | 0.543 |
| EEH,42 | 1.3992 |
| H,55 | 0.774 |
| H,57.5 | 0.781 |
| H,60 | 0.7763333333333333 |
| M,62.5 | 0.5403333333333333 |
| L,67.5 | 0.374 |
| M,25 | 0.333 |
| EL,8 / EL,75 | flag=false |

### flatbelt2
| 参数 | 返回 |
|---|---|
| Pd=7.5,P0=2.1,kAlpha=0.938,kBeta=1,ordinary,δ=6,α1=159.37,σ0=1.8 | {A:3.81, b:63.46, Fr:1348.54} |
| 同上 kBeta=0.9 | {A:4.23, b:70.51, Fr:1498.38} |
| Pd=12.75,P0=3.465,kAlpha=1.04,kBeta=1,ordinary,δ=9.6,α1=188.02,σ0=2.0 | {A:3.54, b:36.86, Fr:1411.79} |
| Pd=7.5,P0=0.543,kAlpha=0.938,kBeta=1,nylon,δ=4.8,α1=159.37,σ0=3 | {b:14.73, Fr:417.23} |
| Pd=5.4,P0=0.2,kAlpha=1.15,kBeta=0.8,nylon,δ=2.4,α1=210.5,σ0=3 | {b:29.35, Fr:407.73} |

## 全链 6 组对比（开口/交叉/半交叉 × 胶帆布/尼龙）

由 `.tmp_probe/test_flat.js` 生成：本地 compute 中间量逐字段调用上述端点比对，结果追加在下方。

## 验证结果（2026-08-18，最终）

- 实现：`/workspace/js/tools/trans2_flat.js`（id: flat-belt-design，category: trans，App.registerTool 注册）
- 自测：`node .tmp_probe/test_flat.js`（在线）→ **PASS=101 FAIL=0，在线全链 7 组全部逐字段一致，ALL TESTS PASSED**；`--offline` → PASS=48 FAIL=0
- 测试构成：
  - 离线单元 48 项：flatbeltKAlphaQuery 11 例、flatbeltP0Query ordinary 13 例、nylon 12 例、flatbelt1 4 例（含 cross/halfCross）、flatbeltAlpha1 3 例、flatbelt2 5 例，全部对照上方"单元探针记录"的 API 原始返回
  - 在线全链 7 组（超出要求的 6 组）：L1 开口×胶帆布（全默认）、L2 交叉×胶帆布(P=10,n1=960,n2=480,KA=1.3,a0=1300)、L3 半交叉×胶帆布、L4 开口×尼龙(EH,σ0=3)、L5 交叉×尼龙(EEH)、L6 半交叉×尼龙(M)、L7 开口×胶帆布(指定 d1=224/d2=800/a0=1600/δ=7.2)；每组比对 flatbelt1(calBeltLen,a) + flatbeltAlpha1(α1,Kα) + flatbeltP0Query(P0) + flatbelt2(A/b/Fr) 共 8 字段
- 代表性在线比对（本地值 vs API 值，全部一致）：
  | 组 | L₀ | α₁ | Kα | P0 | A cm² | b mm | Fr N |
  |---|---|---|---|---|---|---|---|
  | L1 开口×胶帆布 | 3744.01 | 157.09 | 0.931 | 2.864 | 2.81 | 58.6 | 992.44 |
  | L2 交叉×胶帆布 | 4055.16 | 217.49 | 1.187 | 2.9148 | 3.76 | 52.19 | 1280.91 |
  | L3 半交叉×胶帆布 | 5090.3 | 186.53 | 1.033 | 3.382906 | 3.22 | 53.66 | 1157.07 |
  | L4 开口×尼龙EH | 3744.01 | 157.08 | 0.931 | 0.382272 | — | 21.07 | 557.64 |
  | L5 交叉×尼龙EEH | 3860.48 | 204.44 | 1.122 | 0.450828 | — | 11.86 | 313.01 |
  | L6 半交叉×尼龙M | 4739.84 | 186.79 | 1.034 | 0.2103552 | — | 41.38 | 1288.73 |
  | L7 指定 d1/d2/δ | 4860.34 | 160.37 | 0.941 | 3.3468 | 2.38 | 33.08 | 844.77 |
- 环境说明：沙箱出口对 mechtool.cn 约 40~50% 的连接出现 `curl: (35) SSL_ERROR_SYSCALL`（纯环境抖动，非 API 限流，重试即成功），测试脚本 api() 已内置 6 次重试
- L2 用例修订记录：最初 n2=300/i=3.2 时 L₀≈6027mm 超出标准带长系列上限 5000mm，自动选 Li=5000 使实际轴间距缩短、交叉包角升至 ~225° 超出 Kα 表 [120,220]（与原站 flag=false 行为一致）；改为 n2=480、a0=1300 后落入有效域
