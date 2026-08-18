# 梯形齿同步带传动设计 — API 探针记录与 1:1 复刻验证（spec_timing.md）

- 产出工具文件：`/workspace/js/tools/trans2_timing.js`（id: `timing-belt-design`，name: 梯形齿同步带传动设计，category: `trans`）
- 自测脚本：`/workspace/.tmp_probe/test_timing.js`（Node 模拟浏览器加载 `js/app.js` + 工具文件）
- 原站页面：mechtool.cn「带传动设计-梯形齿同步带传动设计」（HTML 存档 `timingbeltdrive.html` / `beltdrive_designcalculationoftrapezoidaltoothsynchronousbelttransmission.html`，解码 JS `belt.pretty.x9.js`）

---

## 1. API 端点（均 POST，头 `X-Requested-With: XMLHttpRequest`）

| 端点 `/calculation/<名>` | 参数 | 返回 resultData 字段 |
|---|---|---|
| `z1MinQuery` | `beltSize, n1` | zmin（数值；超范围 flag=false） |
| `timingbelt1` | `z1, z2, a0, beltSize` | `a, zM, zB, beltLen, calBeltLen, kZ, alpha1` |
| `timingbeltLenChange` | `z1, z2, pitchB, beltLen` | `a, zM, zB, kZ, alpha1` |
| `timingbelt2` | `powerD, beltSize, beltVelocity, kZ, n1, beltLen, z1, kA, alpha1, zM` | `bs, power0, forceQ, bsMin, m, bs0, powerR` |

调用示例：
```bash
curl -s -X POST 'https://www.mechtool.cn/calculation/timingbelt1' \
  -d 'z1=18&z2=52&a0=500.0&beltSize=H' -H 'X-Requested-With: XMLHttpRequest'
```

## 2. 探针记录汇总（140 组，源文件 probe_out1~5.txt、out_timingbelt.txt）

覆盖带型 MXL/XXL/XL/L/H/XH/XXH、kZ∈{1,0.8,0.6}、边界（a0 极小、z1=zmin、bs 超系列、n1 超表上限）与单参数扰动。

### 2.1 z1MinQuery（40 组，probe_out1.txt）
节选（H 型 n1 边界扫描，其余 6 种带型各 6 组见源文件）：
```
beltSize=H&n1=899   → 14     beltSize=H&n1=900   → 16    beltSize=H&n1=1199 → 16
beltSize=H&n1=1200  → 18     beltSize=H&n1=1799  → 18    beltSize=H&n1=1800 → 20
beltSize=H&n1=3600  → 22     beltSize=H&n1=4799  → 22    beltSize=H&n1=4800 → flag=false（超表）
beltSize=XL&n1=100  → 10     beltSize=L&n1=100   → 12    beltSize=XXH&n1=1500 → 26
```
结论：与页面文本表 T7（小带轮最小齿数 zmin）一致，按 n1 分档查表，n1≥4800 全部 flag=false。

### 2.2 timingbelt1 / timingbeltLenChange（38+4 组，probe_out1/2.txt）
节选（每带型至少 1 组，完整 38 组在 test_timing.js 的 T1 数组）：
```
z1=18&z2=18&a0=500&beltSize=H  → a=501.65  zM=9  zB=97  beltLen=1231.9  calBeltLen=1228.6  kZ=1    alpha1=180.0
z1=18&z2=52&a0=500&beltSize=H  → a=496.89  zM=8  zB=114 beltLen=1447.8  calBeltLen=1453.96 kZ=1    alpha1=164.15
z1=10&z2=30&a0=300&beltSize=XL → a=299.283 zM=4  zB=138 beltLen=701.04  calBeltLen=702.47  kZ=0.6  alpha1=173.81
z1=24&z2=48&a0=600&beltSize=L  → a=589.427 zM=11 zB=160 beltLen=1524.0  calBeltLen=1545.11 kZ=1    alpha1=172.93
z1=22&z2=44&a0=800&beltSize=XH → a=796.297 zM=10 zB=105 beltLen=2333.63 calBeltLen=2341.0  kZ=1    alpha1=168.8
z1=22&z2=66&a0=1000&beltSize=XXH→a=1056.006 zM=9 zB=112 beltLen=3556.0 calBeltLen=3446.64 kZ=1    alpha1=155.87
z1=18&z2=52&a0=100&beltSize=H  → a=94.246  zM=4  zB=54  beltLen=685.8   calBeltLen=693.93  kZ=0.6  alpha1=96.44
LenChange: z1=18&z2=52&pitchB=12.7&beltLen=1524  → a=535.333 zM=8 zB=120 kZ=1 alpha1=165.29
LenChange: z1=10&z2=30&pitchB=5.08&beltLen=508   → a=202.554 zM=4 zB=100 kZ=0.6 alpha1=170.85
```

### 2.3 timingbelt2（37 组，probe_out1~5.txt；拟合脚本 fit_pr2.js）
节选（跨带型与 kZ）：
```
powerD=6 &H  &v=5.475&kZ=1 &n1=1440&beltLen=1447.8&z1=18&kA=1.5&alpha1=164.15&zM=8 → bs=50.8 power0=11.43 forceQ=1095.89 bsMin=43.299 m=0.448 bs0=76.2  powerR=7.2
powerD=6 &XL &v=3.02 &kZ=1 &n1=1440&beltLen=508&z1=15&kA=1.5&alpha1=170&zM=8      → bs=0    power0=0.15  forceQ=1986.75 bsMin=240.293 m=0.022 bs0=9.5   powerR=0    （bs 超系列）
powerD=6 &L  &v=5.8  &kZ=1 &n1=1440&beltLen=1219.2&z1=16&kA=1.5&alpha1=170&zM=8  → bs=0    power0=1.4   forceQ=1034.48 bsMin=91.08  m=0.095 bs0=25.4  powerR=0    （bs 超系列）
powerD=20&XH &v=10  &kZ=1 &n1=800 &beltLen=1778&z1=24&kA=1.5&alpha1=170&zM=8      → bs=76.2 power0=39.01 forceQ=2000.0  bsMin=56.549 m=1.484 bs0=101.6 powerR=28.06
powerD=40&XXH&v=10  &kZ=1 &n1=800 &beltLen=2032&z1=24&kA=1.5&alpha1=170&zM=8      → bs=101.6 power0=61.51 forceQ=4000.0 bsMin=87.073 m=2.473 bs0=127.0 powerR=47.63
powerD=40&XXH&v=12  &kZ=1 &n1=800 &beltLen=2032&z1=24&kA=1.5&alpha1=170&zM=8      → bs=76.2 power0=72.5  forceQ=3333.33 bsMin=75.375 m=2.473 bs0=127.0 powerR=40.32
```
单参数扰动结论（probe_out2/3/5 各 13 组）：`n1/z1/kA/alpha1/zM/beltLen` 对 resultData 无影响（服务端不使用）；`powerD→forceQ=1000·powerD/v`、`bsMin`、`bs`、`powerR` 均随 `powerD/v/kZ` 变化，与公式完全吻合。

## 3. 逆向所得计算链（已全部在工具中实现并经探针验证）

1. **设计功率** `Pd = KA·P`（r3）。
2. **zmin 查表**（内嵌 T7 表，按带型×n1 分档；n1≥4800 → 报错，同 API flag=false）。z1 可输入，缺省 zmin+4；z1<zmin 报错。
3. **传动比/齿数** `i = n1/n2`（或直输，r3 显示）；`z2Cal = r2(i·z1)`；`z2 = round(i·z1)`（可覆写）。
4. **节圆直径** `d1 = r2(z1·pb/π)`、`d2 = r2(z2·pb/π)`（原站解码 JS 第 1428 行：`Math.round(pb*z1/π*100)/100` 写入 #d1/#d2 字段）。
5. **带速**（关键发现，解码 JS 第 1251-1257/1471-1479 行）：原站用**表单字段里的圆整后 d1** 计算
   `v = (π·d1·n1/60000).toFixed(3)`，例如 H z18 n1440 → d1=72.77 → v=5.487（非精确值 5.486）。
6. **初定轴间距范围** `a0min = r1(0.7(d1+d2))`、`a0max = r1(2(d1+d2))`（解码 JS 第 1482-1484 行同式）。
7. **计算带长**（精确带长公式，非近似式）：
   `calBeltLen = 2√(a²−Δ²) + (π−2θ)d1/2 + (π+2θ)d2/2`，`Δ=(d2−d1)/2`，`θ=asin(Δ/a)`（r2；几何用精确 d1e/d2e）。
8. **节线长系列就近选取**：`beltLen = r2(zB_sel·pb)`，zB_sel 为系列中与 calBeltLen 最近者（内嵌 SERIES=GB/T 11616 标准系列 ∪ API 实测扩展成员）。
9. **实际轴间距 a**：由 beltLen 数值反解（二分 160 次，与 API a 字段逐组一致，r3）。
10. **啮合齿数与包角**：`zM = floor(z1/2 − z1(d2−d1)/(2πa))`；`kZ: zM≥6→1, 5→0.8, 4→0.6, ≤3→0.4`（API 观测 zM=4→0.6、5→0.8）；`alpha1 = r2(180 − (d2−d1)/a·57.3)`；`zB = r3(beltLen/pb)`（beltLen 用 r2 值，如 L 型 75 齿→714.38→75.001）。
11. **基准额定功率** `P0 = power0 = (Ta − m·v²)·v/1000`（Ta、m 为带型常数，r2；与 API power0 逐组一致，含 XH/XXH）。
12. **最小带宽与选型** `bsMin = r3(bs0·(Pd/(kZ·P0))^(1/1.14))`；`bs` = 带宽系列中 ≥bsMin 的最小值，无则 0（bs 超系列，同 API bs=0）。
13. **额定功率** `powerR = r2((kZ·Ta·(bs/bs0)^1.14 − m·(bs/bs0)·v²)·v/1000)`（bs=0 时 powerR=0）。
14. **压轴力** `forceQ = r2(1000·Pd/v)`。

## 4. 内嵌数据表（全部在 trans2_timing.js 内）

- `PB` 节距（MXL 2.032 / XXL 3.175 / XL 5.08 / L 9.525 / H 12.7 / XH 22.225 / XXH 31.75）
- `BS0/TA/MM/VMAX` 基准宽度 bs0、许用工作拉力 Ta、单位长度质量 m、vmax（GB/T 11362-2008 表，与 API m/bs0 字段逐组一致）
- `ZMIN` 小带轮最小齿数表（T7；40 组 z1MinQuery 探针全对）
- `KZ_BY_ZM` 啮合齿数系数（T2）
- `SERIES` 各带型节线长齿数系列（GB/T 11616 标准 ∪ API 实测成员，逐项探针校验，注释含实测清单）
- `WIDTHS` 各带型带宽系列（bs 圆整依据）

## 5. 自测结果（test_timing.js）

- A. z1MinQuery：40/40 ✓
- B. timingbelt1（a/zM/zB/beltLen/calBeltLen/kZ/alpha1 逐字段）：38 组 ✓
- C. timingbeltLenChange：4 组 ✓
- D. timingbelt2（bs/power0/forceQ/bsMin/m/bs0/powerR 逐字段）：37 组 ✓
- E. E2E 全链路 7 场景（H/XL/L/XH/XXH，含 kZ=0.6、i=1、bs 超系列）：阶段 1-2（Pd/zmin/v/几何量）全部 ✓
- **合计 PASS=606 FAIL=0（2026-08-18 14:50）**

修复记录：E2E 中 4 个 beltVelocity 期望值（S3/S4/S5/S7）系早期手写笔误，已按原站解码 JS 实证算法
`v = π·r2(d1)·n1/60000 → toFixed(3)` 修正（S3: 5.485→5.487，S4: 7.115→7.112，S5: 9.307→9.313，S7: 3.657→3.658）。

## 6. 遗留事项（API 限流）

- 2026-08-18 ~12:30 起原站 API 对本沙箱限流（连接被重置），期间：
  - `walk2.js`（后台）：等待 API 恢复后用「跳跃探测法」补全各带型节线长系列 → `walk_out2.json`；
  - `probe_e2e.js`（后台）：等待恢复后用**工具自算中间量**调 timingbelt2 补 7 组 E2E 探针 → `e2e_out.json`（test_timing.js 阶段 3 自动读取比对 power0/bs0/bsMin/bs/m/powerR/forceQ）。
- 两脚本恢复后自动执行；届时重跑 `node .tmp_probe/test_timing.js` 确认阶段 3 通过。阶段 3 公式已在 D 组 37 探针中逐字段验证，预期一致。
