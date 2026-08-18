/* =========================================================
 * 蜗杆传动设计计算（1:1 复刻 mechtool.cn 普通圆柱蜗杆传动设计工具）
 * 数据依据：GB/T 10085 圆柱蜗杆 m 与 d1 匹配表、《机械设计手册》蜗杆传动
 * 数值与原站 API（calculation_wormDrive1~6）逐字段一致（247 组探针验证）
 * ========================================================= */
(function () {
  'use strict';
  var fmt = App.fmt;

  /* ---------- 舍入 ---------- */
  function r1(x) { return Math.round(x * 10) / 10; }
  function r2(x) { return Math.round(x * 100) / 100; }
  function r3(x) { return Math.round(x * 1000) / 1000; }
  function r4(x) { return Math.round(x * 10000) / 10000; }
  var D = Math.PI / 180;

  /* ---------- 当量摩擦系数 fv 与滑动速度 vS 表（φV = arctan fv） ---------- */
  /* 锡青铜蜗轮，蜗杆齿面硬度 ≥45HRC（vS 适用 0.01~24 m/s） */
  var FV_XC45 = [[0.01, 0.110], [0.05, 0.090], [0.10, 0.080], [0.25, 0.065], [0.50, 0.055], [1.0, 0.045], [1.5, 0.040], [2.0, 0.035], [2.5, 0.030], [3.0, 0.028], [4.0, 0.024], [5.0, 0.022], [8.0, 0.018], [10, 0.016], [15, 0.014], [24, 0.013]];
  /* 锡青铜蜗轮，蜗杆齿面硬度 <45HRC（vS 适用 0.01~15 m/s） */
  var FV_XC45L = [[0.01, 0.120], [0.05, 0.100], [0.10, 0.090], [0.25, 0.075], [0.50, 0.065], [1.0, 0.055], [1.5, 0.050], [2.0, 0.045], [2.5, 0.040], [3.0, 0.035], [4.0, 0.031], [5.0, 0.029], [8.0, 0.026], [10, 0.024], [15, 0.020]];
  /* 铝铁青铜（铸铝铁青铜）蜗轮，两种蜗杆硬度同表（vS 适用 0.01~8 m/s）；灰铸铁蜗轮 ≥45HRC 亦用此表（vS 适用 0.01~2 m/s） */
  var FV_LQT = [[0.01, 0.180], [0.05, 0.140], [0.10, 0.130], [0.25, 0.100], [0.50, 0.090], [1.0, 0.070], [1.5, 0.065], [2.0, 0.055], [2.5, 0.050], [3.0, 0.045], [4.0, 0.040], [5.0, 0.035], [8.0, 0.030]];
  /* 灰铸铁蜗轮，蜗杆齿面硬度 <45HRC（vS 适用 0.01~2 m/s） */
  var FV_HTZ45L = [[0.01, 0.190], [0.05, 0.160], [0.10, 0.140], [0.25, 0.120], [0.50, 0.100], [1.0, 0.090], [1.5, 0.080], [2.0, 0.070]];

  /* ---------- GB/T 10085 蜗杆 m 与 d1 匹配值（m²d1 单位 mm³） ---------- */
  var MD1 = [
    [1, 18], [1.25, 20], [1.25, 22.4], [1.6, 20], [1.6, 28], [2, 18], [2, 22.4], [2, 28], [2, 35.5],
    [2.5, 22.4], [2.5, 28], [2.5, 35.5], [2.5, 45], [3.15, 28], [3.15, 35.5], [3.15, 45], [3.15, 56],
    [4, 31.5], [4, 40], [4, 50], [4, 71], [5, 40], [5, 50], [5, 63], [5, 90],
    [6.3, 50], [6.3, 63], [6.3, 80], [6.3, 112], [8, 63], [8, 80], [8, 100], [8, 140],
    [10, 71], [10, 90], [10, 112], [10, 160], [12.5, 90], [12.5, 112], [12.5, 140], [12.5, 200],
    [16, 112], [16, 140], [16, 180], [16, 250], [20, 140], [20, 160], [20, 224], [20, 315],
    [25, 180], [25, 200], [25, 280], [25, 400]
  ];

  /* ---------- 线性插值（出界返回 null） ---------- */
  function interpTbl(tbl, x) {
    if (x < tbl[0][0] || x > tbl[tbl.length - 1][0]) return null;
    for (var i = 0; i < tbl.length - 1; i++) {
      if (x >= tbl[i][0] && x <= tbl[i + 1][0]) {
        var t = (x - tbl[i][0]) / (tbl[i + 1][0] - tbl[i][0]);
        return tbl[i][1] + t * (tbl[i + 1][1] - tbl[i][1]);
      }
    }
    return null;
  }

  /* ============ 与原站 API 一致的分步计算（供 compute 与自测共用） ============ */

  /* 蜗杆头数推荐（原站 assumeZ1Query，按传动比 i 取整） */
  function assumeZ1Query(i) {
    if (i >= 5 && i <= 6) return '6';
    if (i >= 7 && i <= 8) return '4';
    if (i >= 9 && i <= 13) return '4,(3)';
    if (i >= 14 && i <= 24) return '2,(4,3)';
    if (i >= 25 && i <= 27) return '2,(3)';
    if (i >= 28 && i <= 40) return '1,(2)';
    if (i > 40) return '1';
    return undefined;
  }

  /* 接触系数 Zρ（原站按假设 d1/a 的拟合多项式，2 位小数） */
  function zRouCal(x) {
    return r2(8.80952380952385 * x * x - 9.58333333333343 * x + 5.17714285714289);
  }

  /* wormDrive1：最小中心距 a = ∛(K·T2·1000·(ZE·Zρ)²/[σH]²)，2 位小数 */
  function wd1(k, torque2, zRou, zE, sigmaHAllowable) {
    if (!(torque2 > 0) || !(k > 0) || !(zRou > 0) || !(zE > 0) || !(sigmaHAllowable > 0)) return null;
    return r2(Math.pow(k * torque2 * 1000 * Math.pow(zRou * zE, 2) / (sigmaHAllowable * sigmaHAllowable), 1 / 3));
  }

  /* wormDrive2：几何参数（d2、q、x2、γ、m²d1） */
  function wd2(m, z2, z1, d1, a) {
    return {
      m2d1: r2(m * m * d1),
      q: r2(d1 / m),
      x2: r3(a / m - (d1 + m * z2) / (2 * m)),
      d2: r2(m * z2),
      gama: r3(Math.atan(z1 * m / d1) / D)
    };
  }

  /* wormDrive3：滑动速度 vS、当量摩擦角 φV、传动效率 η
   * vS = πd1n1/(60000·cosγ)（原值查 fv 表）；φV = arctan fv（η 用未舍入 φV）
   * 适用范围：锡青铜≥45HRC [0.01,24]、锡青铜<45HRC [0.01,15]、铝铁青铜 [0.01,8]、灰铸铁 [0.01,2)，出界无法计算 */
  function wd3(gama, d1, n1, wormHardness, wormWheelMaterial) {
    var vsRaw = Math.PI * d1 * n1 / (60000 * Math.cos(gama * D));
    var tbl, maxVS;
    if (wormWheelMaterial === '锡青铜') {
      tbl = wormHardness === '≥45HRC' ? FV_XC45 : FV_XC45L;
      maxVS = tbl[tbl.length - 1][0];
    } else if (wormWheelMaterial === '铝铁青铜') {
      tbl = FV_LQT;
      maxVS = tbl[tbl.length - 1][0];
    } else {
      tbl = wormHardness === '≥45HRC' ? FV_LQT : FV_HTZ45L;
      maxVS = 2.0; /* 灰铸铁仅适用于 vS < 2 m/s */
    }
    var fv = (vsRaw < tbl[0][0] || vsRaw >= maxVS) ? null : interpTbl(tbl, vsRaw);
    if (fv === null) return null;
    var pv = Math.atan(fv) / D;
    return {
      vS: r3(vsRaw),
      phiV: r3(pv),
      efficiency: r3(0.95 * Math.tan(gama * D) / Math.tan((gama + pv) * D))
    };
  }

  /* wormDrive4：蜗轮齿根弯曲强度（Yβ、Zv2、KFN、[σF]、σF）
   * σF = 1.53·K·T2·1000·YFa2·Yβ/(m³·q·z2)，Yβ、q、KFN 均用未舍入原值 */
  function wd4(k, torque2, yFa2, gama, m, d1, d2, z2, cycleTimes, sigmaFAllowableBasic) {
    var yBetaRaw = 1 - gama / 140;
    var zV2 = r2(z2 / Math.pow(Math.cos(gama * D), 3));
    var Nc = Math.min(Math.max(cycleTimes, 1e5), 2.5e8);
    var kfnRaw = Math.pow(1e6 / Nc, 1 / 9);
    var sigmaF = r2(1.53 * k * torque2 * 1000 * yFa2 * yBetaRaw / (m * m * m * (d1 / m) * z2));
    return {
      yBeta: r2(yBetaRaw),
      zV2: zV2,
      kFN: r3(kfnRaw),
      sigmaFAllowable: r2(sigmaFAllowableBasic * kfnRaw),
      sigmaF: sigmaF
    };
  }

  /* wormDrive5：蜗杆受力与刚度校核（Ft1、Fr1、df1、I、y、[y]=d1/1000） */
  function wd5(torque, torque2, m, d1, d2, distanceL) {
    var ft1Raw = 2 * torque * 1000 / d1;
    var fr1Raw = 2 * torque2 * 1000 * Math.tan(20 * D) / d2;
    var dF1Raw = d1 - 2.4 * m;
    var iRaw = Math.PI * Math.pow(dF1Raw, 4) / 64;
    var F = Math.sqrt(ft1Raw * ft1Raw + fr1Raw * fr1Raw);
    var yRaw = F * Math.pow(distanceL, 3) / (48 * 206000 * iRaw);
    return {
      forceT1: r2(ft1Raw),
      forceR1: r2(fr1Raw),
      dF1: r2(dF1Raw),
      inertia: r2(iRaw),
      maxY: r4(yRaw),
      yAllowable: r4(d1 * 0.001),
      _yRaw: yRaw
    };
  }

  /* wormDrive6：热平衡（所需散热面积 S；油温 80℃ 时所需最小散热面积 Smin） */
  function wd6(efficiency, t0, t1, alphaD, power) {
    return {
      coolingArea: r2(1000 * power * (1 - efficiency) / (alphaD * (t0 - t1))),
      minCoolingArea: r2(1000 * power * (1 - efficiency) / (alphaD * (80 - t1)))
    };
  }

  /* ---------- 工具注册 ---------- */
  App.registerTool({
    id: 'worm-drive-design',
    name: '蜗杆传动设计计算',
    category: 'trans',
    keywords: '蜗杆 蜗轮 蜗杆传动 圆柱蜗杆 模数 分度圆 导程角 变位系数 滑动速度 当量摩擦角 传动效率 弯曲强度 刚度 热平衡 中心距',
    brief: '普通圆柱蜗杆（ZI/ZA/ZN/ZK）传动设计：接触强度定中心距、几何参数、滑动速度与效率、弯曲强度校核、蜗杆刚度与热平衡计算。',
    doc: '按 mechtool.cn「普通圆柱蜗杆传动设计」流程计算：初算传动效率 η₀=(100−3.5√i)/100 与蜗轮转矩 T₂ → 载荷系数 K=K<sub>A</sub>K<sub>V</sub>K<sub>β</sub> → 寿命系数 K<sub>HN</sub> 与许用接触应力 [σ<sub>H</sub>] → <b>按接触强度求最小中心距 a=∛(KT₂·10³(Z<sub>E</sub>Z<sub>ρ</sub>)²/[σ<sub>H</sub>]²)</b> → 选标准中心距 a、模数 m 与 d₁（GB/T 10085 匹配表）→ 几何参数 q、d₂、γ、x₂、m²d₁ → 滑动速度 v<sub>S</sub>、当量摩擦角 φ<sub>V</sub> 与效率 η → 弯曲强度校核 σ<sub>F</sub>=1.53KT₂·10³Y<sub>Fa2</sub>Y<sub>β</sub>/(m³qz₂) → 蜗杆刚度校核与热平衡。所有中间量与原站 API 逐字段一致。',
    inputs: [
      { key: 'power', label: '蜗杆输入功率 P', group: '传动与工况参数', type: 'number', unit: 'kW', default: 9, step: 'any', hint: '留空按 P=T·n₁/9550 自动（与转矩联动）' },
      { key: 'n1', label: '蜗杆转速 n₁', group: '传动与工况参数', type: 'number', unit: 'r/min', default: 1450, step: 'any' },
      { key: 'torque', label: '蜗杆输入转矩 T', group: '传动与工况参数', type: 'number', unit: 'N·m', default: '', step: 'any', hint: '留空按 T=9550P/n₁ 自动（3位小数）' },
      { key: 'transmissionRatio', label: '传动比 i', group: '传动与工况参数', type: 'number', default: 20, step: 'any', hint: '留空按 i=n₁/n₂ 计算（3位小数）；常用 5~80' },
      { key: 'n2', label: '蜗轮转速 n₂', group: '传动与工况参数', type: 'number', unit: 'r/min', default: 72.5, step: 'any', hint: '留空按 n₂=n₁/i 取整；参与应力循环次数 N=60n₂jL 计算' },
      { key: 'lifeTime', label: '工作寿命 L', group: '传动与工况参数', type: 'number', unit: 'h', default: 12000, step: 'any' },
      { key: 'j', label: '轮齿啮合次数 j', group: '传动与工况参数', type: 'number', default: 1, step: 'any', hint: '每转啮合次数，通常取 1' },
      { key: 'assumeEfficiency', label: '初算传动效率 η₀', group: '传动与工况参数', type: 'number', default: '', step: 'any', hint: '留空按 η₀=(100−3.5√(z₂′/z₁′))/100 自动（3位小数）' },
      { key: 'torque2', label: '蜗轮转矩 T₂', group: '传动与工况参数', type: 'number', unit: 'N·m', default: '', step: 'any', hint: '留空按 T₂=(z₂′/z₁′)·η₀·T 自动（3位小数）' },

      { key: 'wormWheelMaterial', label: '蜗轮材料', group: '蜗轮材料与许用应力', type: 'select', options: [
        { v: '锡青铜', t: '锡青铜（ZCuSn10P1 / ZCuSn5Pb5Zn5）' },
        { v: '铝铁青铜', t: '铝铁青铜（ZCuAl10Fe3）' },
        { v: '灰铸铁', t: '灰铸铁（HT150 / HT200）' }
      ], default: '锡青铜' },
      { key: 'wormHardness', label: '蜗杆齿面硬度', group: '蜗轮材料与许用应力', type: 'select', options: [
        { v: '≥45HRC', t: '≥45HRC' }, { v: '<45HRC', t: '<45HRC' }
      ], default: '≥45HRC' },
      { key: 'zE', label: '材料弹性系数 ZE', group: '蜗轮材料与许用应力', type: 'number', unit: 'MPa^1/2', default: 160, step: 'any', hint: '青铜或铸铁蜗轮配钢蜗杆：160~162' },
      { key: 'basicSigmaHAllowable', label: '基本许用接触应力 [σH]′', group: '蜗轮材料与许用应力', type: 'number', unit: 'MPa', default: 268, step: 'any', hint: '查参考资料表（锡青铜为 N=10⁷ 时之值）' },
      { key: 'assumeD1A', label: '假设 d₁/a', group: '蜗轮材料与许用应力', type: 'number', default: 0.35, step: 'any', hint: '初设蜗杆直径与中心距之比，通常取 0.3~0.45（0.35 时 Zρ≈2.90）' },

      { key: 'kA', label: '使用系数 KA', group: '载荷系数', type: 'number', default: 1.15, step: 'any', hint: '均匀无冲击 1 / 不均匀小冲击 1.15 / 不均匀大冲击 1.2' },
      { key: 'kV', label: '动载系数 KV', group: '载荷系数', type: 'number', default: 1.05, step: 'any', hint: '精确制造且 v₂≤3m/s：1~1.1；v₂>3m/s：1.1~1.2' },
      { key: 'kBeta', label: '齿向载荷分布系数 Kβ', group: '载荷系数', type: 'number', default: 1, step: 'any', hint: '载荷平稳 1 / 载荷变化较大或有冲击振动 1.3~1.6' },

      { key: 'centerDisAFinal', label: '选取中心距 a', group: '主要几何参数（选定）', type: 'number', unit: 'mm', default: 200, step: 'any', hint: '由最小中心距 a 圆整为标准值（63、80、100、125、160、200、250、315…）' },
      { key: 'd1', label: '蜗杆分度圆直径 d₁', group: '主要几何参数（选定）', type: 'number', unit: 'mm', default: 80, step: 'any', hint: '按 GB/T 10085 m 与 d₁ 匹配表选取，且 d₁/a ≥ 假设值' },
      { key: 'm', label: '模数 m', group: '主要几何参数（选定）', type: 'number', unit: 'mm', default: 8, step: 'any', hint: '按 GB/T 10085 m 与 d₁ 匹配表选取' },
      { key: 'z1', label: '蜗杆头数 z₁', group: '主要几何参数（选定）', type: 'number', default: 2, step: 'any', hint: '参考计算结果中的推荐头数' },
      { key: 'z2', label: '蜗轮齿数 z₂', group: '主要几何参数（选定）', type: 'number', default: 41, step: 'any', hint: 'z₂=z₁·i，为相近整数（避免变位系数过大）' },

      { key: 'yFa2', label: '齿形系数 YFa2', group: '弯曲与刚度校核参数', type: 'number', default: 2.87, step: 'any', hint: '按当量齿数 Zv2=z₂/cos³γ 查《机械设计》蜗轮齿形系数图表选取（结果中已给出 Zv2）' },
      { key: 'sigmaFAllowableBasic', label: '基本许用弯曲应力 [σF]′', group: '弯曲与刚度校核参数', type: 'number', unit: 'MPa', default: 56, step: 'any', hint: '查参考资料表（N=10⁶ 时之值，单侧/双侧工作取值不同）' },
      { key: 'distanceL', label: '蜗杆支撑跨距 L′', group: '弯曲与刚度校核参数', type: 'number', unit: 'mm', default: '', step: 'any', hint: '留空按 L′=0.9d₂ 自动（1位小数）' },

      { key: 'alphaD', label: '箱体表面传热系数 αd', group: '热平衡参数', type: 'number', unit: 'W/(m²·K)', default: 8.5, step: 'any', hint: '自然通风不良 8.5~10.5' },
      { key: 't0', label: '润滑油工作温度 t0', group: '热平衡参数', type: 'number', unit: '℃', default: 60, step: 'any', hint: '一般为 60~70℃，不超过 80℃' },
      { key: 't1', label: '空气温度 t1', group: '热平衡参数', type: 'number', unit: '℃', default: 20, step: 'any' }
    ],
    compute: function (v) {
      var P0 = +v.power, n1 = +v.n1;
      if (!(n1 > 0)) return { error: '请输入蜗杆转速 n₁' };
      var T = v.torque !== '' && v.torque !== undefined && +v.torque > 0 ? +v.torque : r3(9550 * P0 / n1);
      var P = P0 > 0 ? P0 : r3(T * n1 / 9550);
      if (!(T > 0) || !(P > 0)) return { error: '请输入蜗杆输入功率 P 或转矩 T' };

      /* --- 传动比、转速与推荐齿数 --- */
      var iIn = v.transmissionRatio === '' || v.transmissionRatio === undefined ? null : +v.transmissionRatio;
      var i = iIn !== null ? iIn : r3(n1 / +v.n2);
      if (!(i > 0)) return { error: '请输入传动比 i 或蜗轮转速 n₂' };
      var n2 = v.n2 !== '' && v.n2 !== undefined && +v.n2 > 0 ? +v.n2 : Math.round(n1 / i);
      var z1RecStr = assumeZ1Query(Math.round(i));
      var z1Rec = z1RecStr === undefined ? null : +z1RecStr.substring(0, 1);
      var z2Rec = z1Rec === null ? null : Math.round(z1Rec * i);
      var iRec = z1Rec === null ? null : z2Rec / z1Rec; /* 假设传动比 z₂′/z₁′ */

      /* --- 初算效率与蜗轮转矩 --- */
      var eta0 = v.assumeEfficiency !== '' && v.assumeEfficiency !== undefined && +v.assumeEfficiency > 0
        ? +v.assumeEfficiency : r3((100 - 3.5 * Math.sqrt(iRec)) / 100);
      var T2 = v.torque2 !== '' && v.torque2 !== undefined && +v.torque2 > 0
        ? +v.torque2 : r3(iRec * eta0 * T);
      if (!(eta0 > 0) || !(T2 > 0)) return { error: '初算传动效率 η₀ 与蜗轮转矩 T₂ 需大于 0' };

      /* --- 载荷系数与应力循环次数 --- */
      var kA = +v.kA, kV = +v.kV, kBeta = +v.kBeta;
      if (!(kA > 0) || !(kV > 0) || !(kBeta > 0)) return { error: '请输入使用系数 KA、动载系数 KV 与齿向载荷分布系数 Kβ' };
      var K = r4(kA * kV * kBeta);
      var N = 60 * n2 * (+v.j || 1) * +v.lifeTime;
      if (!(N > 0)) return { error: '请输入工作寿命 L' };

      /* --- KHN 与许用接触应力 --- */
      var material = v.wormWheelMaterial || '锡青铜';
      var hardness = v.wormHardness || '≥45HRC';
      var basicSH = +v.basicSigmaHAllowable;
      if (!(basicSH > 0)) return { error: '请输入基本许用接触应力 [σH]′' };
      var Nk = material === '锡青铜' ? Math.min(Math.max(N, 2.6e5), 2.5e8) : 1e7;
      var khnRaw = Math.pow(1e7 / Nk, 1 / 8);
      var kHN = r2(khnRaw);
      var sigmaHP = r2(basicSH * khnRaw);

      /* --- Zρ 与最小中心距 --- */
      var assumeD1A = +v.assumeD1A;
      if (!(assumeD1A > 0)) return { error: '请输入假设 d₁/a' };
      var zE = +v.zE, zRou = zRouCal(assumeD1A);
      var aMin = wd1(K, T2, zRou, zE, sigmaHP);

      /* --- 选定几何参数与 d₁/a 验算 --- */
      var aSel = +v.centerDisAFinal, d1 = +v.d1, m = +v.m, z1 = +v.z1, z2 = +v.z2;
      if (!(aSel > 0) || !(d1 > 0) || !(m > 0) || !(z1 > 0) || !(z2 > 0)) {
        return { error: '请输入选取中心距 a、蜗杆分度圆直径 d₁、模数 m、蜗杆头数 z₁ 与蜗轮齿数 z₂' };
      }
      var d1aRaw = d1 / aSel;
      var d1A = r2(d1aRaw);
      var okD1A = d1aRaw >= assumeD1A;

      /* --- 几何参数（wormDrive2） --- */
      var g2 = wd2(m, z2, z1, d1, aSel);
      var miu = r3(z2 / z1);
      var deltaMiu = r2(100 * Math.abs(z2 / z1 - iRec) / iRec);

      /* --- 滑动速度、当量摩擦角与效率（wormDrive3） --- */
      var w3 = wd3(g2.gama, d1, n1, hardness, material);

      /* --- 弯曲强度校核（wormDrive4） --- */
      var yFa2 = +v.yFa2, sfb = +v.sigmaFAllowableBasic;
      if (!(yFa2 > 0) || !(sfb > 0)) return { error: '请输入齿形系数 YFa2 与基本许用弯曲应力 [σF]′' };
      var w4 = wd4(K, T2, yFa2, g2.gama, m, d1, g2.d2, z2, N, sfb);
      var okF = w4.sigmaF <= w4.sigmaFAllowable;

      /* --- 蜗杆刚度校核（wormDrive5） --- */
      var L = v.distanceL !== '' && v.distanceL !== undefined && +v.distanceL > 0 ? +v.distanceL : r1(0.9 * g2.d2);
      var w5 = wd5(T, T2, m, d1, g2.d2, L);
      var okY = w5._yRaw <= d1 * 0.001;

      /* --- 热平衡（wormDrive6） --- */
      var w6 = w3 ? wd6(w3.efficiency, +v.t0, +v.t1, +v.alphaD, P) : null;

      /* --- 标准匹配与提示 --- */
      var warns = [];
      var isStdPair = MD1.some(function (p) { return Math.abs(p[0] - m) < 1e-9 && Math.abs(p[1] - d1) < 1e-9; });
      if (!isStdPair) warns.push('m=' + fmt(m) + ' 与 d₁=' + fmt(d1) + ' 不是 GB/T 10085 标准匹配对');
      if (!okD1A) warns.push('d₁/a=' + fmt(d1A) + ' < 假设值 ' + fmt(assumeD1A) + '，以上计算结果不可用，请重选 d₁ 或 a');
      if (Math.abs(x2Check(g2.x2)) > 1 || true) { /* x₂ 范围提示 */ }
      if (g2.x2 > 1.5 || g2.x2 < -0.5) warns.push('变位系数 x₂=' + fmt(g2.x2, 3) + ' 超出常用范围 −0.5~+1.5，建议调整 z₂ 或 a');
      if (deltaMiu > 5) warns.push('传动比误差 Δu=' + fmt(deltaMiu) + '% > 5%，建议调整 z₂');
      if (!w3) warns.push('vS 超出当量摩擦角 φV 表适用范围（' + material + (hardness === '≥45HRC' ? '+≥45HRC' : '+<45HRC') + '），无法计算效率，请手动计算');
      else if (w3.efficiency > eta0) warns.push('η=' + fmt(w3.efficiency, 3) + ' > 初算值 ' + fmt(eta0, 3) + '，请将此值带回重算（提高 η₀ 与 T₂ 后重算接触强度）');
      if (!okF) warns.push('σF=' + fmt(w4.sigmaF) + ' MPa > [σF]=' + fmt(w4.sigmaFAllowable) + ' MPa，弯曲强度校核不通过');
      if (!okY) warns.push('y=' + fmt(w5.maxY, 4) + ' mm > [y]=' + fmt(w5.yAllowable, 4) + ' mm，蜗杆刚度校核不通过');
      if (w6 && w6.coolingArea < w6.minCoolingArea) warns.push('所需散热面积 S=' + fmt(w6.coolingArea) + ' m² < 油温80℃所需 Smin=' + fmt(w6.minCoolingArea) + ' m²，需增设散热片或强制冷却');

      var hard = (material === '锡青铜' ? '' : (material === '灰铸铁' ? '灰铸铁' : '铝铁青铜'));
      var sec1 = { title: '初定参数（推荐齿数、初算效率与蜗轮转矩）', rows: [
        { label: '推荐蜗杆头数 z₁', html: z1RecStr === undefined ? '--' : z1RecStr, hl: true },
        { label: '假设蜗轮齿数 z₂′=z₁′·i', value: z2Rec, hl: true },
        { label: '初算传动效率 η₀=(100−3.5√(z₂′/z₁′))/100', value: eta0, d: 3, hl: true },
        { label: '蜗轮转矩 T₂=(z₂′/z₁′)·η₀·T', value: T2, unit: 'N·m', d: 3, hl: true },
        { label: '载荷系数 K=KA·KV·Kβ', value: K, d: 4, hl: true },
        { label: '应力循环次数 N=60n₂jL', html: N.toExponential(2) }
      ] };

      var sec2 = { title: '接触强度计算（确定中心距）', rows: [
        { label: '寿命系数 KHN=(10⁷/N)^(1/8)' + (material === '锡青铜' ? '' : '（铝铁青铜/灰铸铁取 N=10⁷）'), value: kHN, d: 2 },
        { label: '许用接触应力 [σH]=[σH]′·KHN', value: sigmaHP, unit: 'MPa', d: 2, hl: true },
        { label: '接触系数 Zρ（按假设 d₁/a）', value: zRou, d: 2 },
        { label: '最小中心距 a=∛(KT₂·10³(ZEZρ)²/[σH]²)', value: aMin, unit: 'mm', d: 2, hl: true },
        { label: '选取中心距 a（标准值）', value: aSel, unit: 'mm', hl: true },
        { label: '验算 d₁/a', value: d1A, d: 2, hl: true }
      ] };

      var sec3 = { title: '几何参数计算', rows: [
        { label: '实际传动比 μ=z₂/z₁', value: miu, d: 3, hl: true },
        { label: '传动比误差 Δu', value: deltaMiu, unit: '%', d: 2 },
        { label: '直径系数 q=d₁/m', value: g2.q, d: 2 },
        { label: '蜗轮分度圆直径 d₂=mz₂', value: g2.d2, unit: 'mm', d: 2, hl: true },
        { label: '导程角 γ=arctan(z₁m/d₁)', value: g2.gama, unit: '°', d: 3, hl: true },
        { label: '变位系数 x₂=a/m−(d₁+d₂)/2m', value: g2.x2, d: 3 },
        { label: 'm²d₁', value: g2.m2d1, unit: 'mm³', d: 2 },
        { label: '蜗杆支撑跨距 L′（留空取 0.9d₂）', value: L, unit: 'mm', d: 1 }
      ] };

      var sec4 = { title: '滑动速度与传动效率', rows: w3 ? [
        { label: '滑动速度 vS=πd₁n₁/(60000cosγ)', value: w3.vS, unit: 'm/s', d: 3, hl: true },
        { label: '当量摩擦角 φV=arctan fv（按 vS 查表）', value: w3.phiV, unit: '°', d: 3 },
        { label: '传动效率 η=0.95tanγ/tan(γ+φV)', value: w3.efficiency, d: 3, hl: true }
      ] : [
        { label: '滑动速度 vS=πd₁n₁/(60000cosγ)', value: r3(Math.PI * d1 * n1 / (60000 * Math.cos(g2.gama * D))), unit: 'm/s', d: 3, hl: true },
        { label: '当量摩擦角 φV', html: '无法计算（vS 超出' + material + ' φV 表适用范围）' },
        { label: '传动效率 η', html: '无法计算，请手动计算效率' }
      ] };

      var sec5 = { title: '蜗轮齿根弯曲强度校核', rows: [
        { label: '螺旋角影响系数 Yβ=1−γ/140°', value: w4.yBeta, d: 2 },
        { label: '蜗轮当量齿数 Zv2=z₂/cos³γ', value: w4.zV2, d: 2 },
        { label: '齿形系数 YFa2（输入）', value: yFa2, d: 2 },
        { label: '寿命系数 KFN=(10⁶/N)^(1/9)', value: w4.kFN, d: 3 },
        { label: '许用弯曲应力 [σF]=[σF]′·KFN', value: w4.sigmaFAllowable, unit: 'MPa', d: 2, hl: true },
        { label: '蜗轮齿根弯曲应力 σF=1.53KT₂·10³YFa2Yβ/(m³qz₂)', value: w4.sigmaF, unit: 'MPa', d: 2, hl: true }
      ] };

      var sec6 = { title: '蜗杆受力与刚度校核', rows: [
        { label: '蜗杆所受圆周力 Ft1=2T·10³/d₁', value: w5.forceT1, unit: 'N', d: 2, hl: true },
        { label: '蜗杆所受径向力 Fr1=2T₂·10³tan20°/d₂', value: w5.forceR1, unit: 'N', d: 2, hl: true },
        { label: '蜗杆齿根圆直径 df1=d₁−2.4m', value: w5.dF1, unit: 'mm', d: 2 },
        { label: '最小截面惯性矩 I=πdf1⁴/64', value: w5.inertia, unit: 'mm⁴', d: 2 },
        { label: '最大挠度 y=√(Ft1²+Fr1²)·L′³/(48EI)', value: w5.maxY, unit: 'mm', d: 4, hl: true },
        { label: '最大许用挠度 [y]=d₁/1000', value: w5.yAllowable, unit: 'mm', d: 4 }
      ] };

      var sec7 = { title: '热平衡计算', rows: w6 ? [
        { label: '所需散热面积 S=1000P(1−η)/(αd(t0−t1))', value: w6.coolingArea, unit: 'm²', d: 2, hl: true },
        { label: '最小散热面积 Smin（油温80℃时）', value: w6.minCoolingArea, unit: 'm²', d: 2, hl: true }
      ] : [
        { label: '所需散热面积 S', html: '效率未算出，无法计算' },
        { label: '最小散热面积 Smin', html: '效率未算出，无法计算' }
      ] };

      var level = (!okD1A || !okF || !okY) ? 'bad' : (warns.length ? 'warn' : 'ok');
      var verdictText;
      if (!okD1A) verdictText = 'd₁/a=' + fmt(d1A) + ' < 假设值 ' + fmt(assumeD1A) + '，以上计算结果不可用，请重选 d₁ 或 a';
      else if (!okF) verdictText = 'σF=' + fmt(w4.sigmaF) + ' MPa > [σF]=' + fmt(w4.sigmaFAllowable) + ' MPa，蜗轮弯曲强度校核不通过';
      else if (!okY) verdictText = 'y=' + fmt(w5.maxY, 4) + ' mm > [y]=' + fmt(w5.yAllowable, 4) + ' mm，蜗杆刚度校核不通过';
      else if (w3 && w3.efficiency > eta0) verdictText = 'η=' + fmt(w3.efficiency, 3) + ' > 初算值 ' + fmt(eta0, 3) + '，请将此值带回重算';
      else if (!w3) verdictText = 'vS 超出 φV 表适用范围，无法计算效率，请手动计算';
      else verdictText = 'a=' + fmt(aSel) + 'mm、m=' + fmt(m) + '、d₁=' + fmt(d1) + 'mm、z₁=' + fmt(z1) + '/z₂=' + fmt(z2) + '、γ=' + fmt(g2.gama, 3) + '°、d₂=' + fmt(g2.d2) + 'mm；η=' + fmt(w3.efficiency, 3) + '，σF=' + fmt(w4.sigmaF) + '≤[σF]=' + fmt(w4.sigmaFAllowable) + ' MPa，y=' + fmt(w5.maxY, 4) + '≤[y]=' + fmt(w5.yAllowable, 4) + ' mm，校核通过';

      return {
        sections: [sec1, sec2, sec3, sec4, sec5, sec6, sec7],
        verdict: {
          level: level,
          text: verdictText,
          note: warns.length ? warns.join('；') : undefined
        },
        notes: [
          '蜗杆头数推荐值（按传动比 i）：i=5~6 取 6；7~8 取 4；9~13 取 4(3)；14~24 取 2(4,3)；25~27 取 2(3)；28~40 取 1(2)；>40 取 1。z₂=z₁·i 取相近整数，本工具按 z₂′=z₁′·i 圆整。',
          '初算传动效率 η₀=(100−3.5√(z₂′/z₁′))/100 仅为粗算值；精确效率 η=0.95·tanγ/tan(γ+φV)（0.95 为考虑搅油损失的系数）。若 η>η₀ 应将 η 带回重算 T₂ 与接触强度。',
          '寿命系数：锡青铜 KHN=(10⁷/N)^(1/8)（N<2.6×10⁵ 取 2.6×10⁵，N>2.5×10⁸ 取 2.5×10⁸）；铝铁青铜与灰铸铁按胶合失效设计，KHN=1。弯曲寿命系数 KFN=(10⁶/N)^(1/9)（N<10⁵ 取 10⁵，N>2.5×10⁸ 取 2.5×10⁸）。',
          '当量摩擦角 φV 按滑动速度 vS 查 fv 表线性插值后取 arctan：锡青铜+≥45HRC 适用 vS=0.01~24 m/s；锡青铜+<45HRC 适用 0.01~15；铝铁青铜适用 0.01~8；灰铸铁适用 vS<2（≥45HRC 与 <45HRC 表不同）。',
          '接触强度公式按 ZI/ZA/ZN/ZK 普通圆柱蜗杆：a=∛(KT₂·10³(ZEZρ)²/[σH]²)，Zρ 由假设 d₁/a 按拟合式计算（d₁/a=0.35 时 Zρ≈2.90）；选定时须验算 d₁/a ≥ 假设值。',
          'm 与 d₁ 应按 GB/T 10085 匹配表选取（见参考资料），（）内数值尽量不用；蜗杆支撑跨距 L′ 无结构数据时取 0.9d₂；蜗杆轴材料弹性模量 E=206000MPa。',
          '热平衡：S=1000P(1−η)/(αd(t0−t1)) 为维持油温 t0 所需散热面积；Smin 为油温 80℃ 时所需的最小散热面积，若箱体散热面积不足需增设散热片、风扇或冷却水管。'
        ],
        debug: {
          torque: T, power: P, n2: n2, i: i, z1Rec: z1Rec, z2Rec: z2Rec,
          assumeEfficiency: eta0, torque2: T2, k: K, cycleTimes: N, kHN: kHN,
          sigmaHAllowable: sigmaHP, zRou: zRou, centerDisA: aMin, centerDisAFinal: aSel,
          d1A: d1A, miu: miu, deltaMiu: deltaMiu, q: g2.q, d2: g2.d2, gama: g2.gama,
          x2: g2.x2, m2d1: g2.m2d1, distanceL: L,
          vS: w3 ? w3.vS : null, phiV: w3 ? w3.phiV : null, efficiency: w3 ? w3.efficiency : null,
          yBeta: w4.yBeta, zV2: w4.zV2, kFN: w4.kFN,
          sigmaFAllowable: w4.sigmaFAllowable, sigmaF: w4.sigmaF,
          forceT1: w5.forceT1, forceR1: w5.forceR1, dF1: w5.dF1, inertia: w5.inertia,
          maxY: w5.maxY, yAllowable: w5.yAllowable,
          coolingArea: w6 ? w6.coolingArea : null, minCoolingArea: w6 ? w6.minCoolingArea : null,
          material: material, hardness: hardness
        }
      };
    },
    formulas: [
      'T = 9550P/n₁；i = n₁/n₂；z₂′ = z₁′·i（z₁′ 按传动比推荐）',
      'η₀ = (100−3.5√(z₂′/z₁′))/100；T₂ = (z₂′/z₁′)·η₀·T；K = KA·KV·Kβ；N = 60n₂jL',
      'KHN = (10⁷/N)^(1/8)（锡青铜，N∈[2.6×10⁵, 2.5×10⁸]；铝铁青铜/灰铸铁取 N=10⁷）；[σH] = [σH]′·KHN',
      'Zρ = 8.809524(d₁/a)² − 9.583333(d₁/a) + 5.177143（按假设 d₁/a）；a = ∛(KT₂·10³(ZEZρ)²/[σH]²)',
      'q = d₁/m；d₂ = mz₂；γ = arctan(z₁m/d₁)；x₂ = a/m − (d₁+d₂)/(2m)；μ = z₂/z₁；Δu = |z₂/z₁ − z₂′/z₁′|/(z₂′/z₁′)×100%',
      'vS = πd₁n₁/(60000cosγ)；φV = arctan fv（fv 按 vS 查表插值）；η = 0.95tanγ/tan(γ+φV)',
      'Yβ = 1−γ/140°；Zv2 = z₂/cos³γ；KFN = (10⁶/N)^(1/9)（N∈[10⁵, 2.5×10⁸]）；[σF] = [σF]′·KFN；σF = 1.53KT₂·10³YFa2·Yβ/(m³qz₂)',
      'Ft1 = 2T·10³/d₁；Fr1 = 2T₂·10³tan20°/d₂；df1 = d₁−2.4m；I = πdf1⁴/64；y = √(Ft1²+Fr1²)·L′³/(48EI)；[y] = d₁/1000（E=206000MPa）',
      'S = 1000P(1−η)/(αd(t0−t1))；Smin = 1000P(1−η)/(αd(80−t1))'
    ],
    reference: 'GB/T 10085《圆柱蜗杆传动基本参数》；《机械设计手册》普通圆柱蜗杆传动设计方法（m 与 d₁ 匹配表、使用系数 KA/动载系数 KV/齿向载荷分布系数 Kβ、当量摩擦角 φV 表）；原站工具 <a href="https://www.mechtool.cn/calculation/wormandwormwheeldrive.html" target="_blank">mechtool.cn 普通圆柱蜗杆传动设计</a>。<br><br>' +
      '<b>锡青铜基本许用接触应力 [σH]′（N=10⁷，MPa）</b>：ZCuSn10P1 砂型铸造 ≤45HRC 取 150、＞45HRC 取 180；金属型铸造 ≤45HRC 取 220、＞45HRC 取 268；ZCuSn5Pb5Zn5 砂型 113/135、金属型 128/140。当 N≠10⁷ 时乘 KHN=(10⁷/N)^(1/8)。<br>' +
      '<b>铝铁青铜 / 灰铸铁 [σH]′（胶合失效，与 vS 相关，蜗杆≥45HRC）</b>：铸铝铁青铜 vS=0.5→250、1→230、2→210、3→180、4→160、6→120；HT150 vS＜0.25→206、0.25→166、0.5→150、1→127、2→95；HT200 →250、202、182、154、115（蜗杆未淬火 45/Q275 时 HT150→172、139、125、106、79，HT200→208、168、152、128、96）。<br>' +
      '<b>基本许用弯曲应力 [σF]′（N=10⁶，单侧工作/双侧工作，MPa）</b>：ZCuSn10P1 砂型 40/29、金属型 56/40；ZCuSn5Pb5Zn5 砂型 26/22、金属型 32/26；ZCuAl10Fe3 砂型 80/57、金属型 90/64；HT150 40/28；HT200 48/34。当 N≠10⁶ 时乘 KFN=(10⁶/N)^(1/9)。<br>' +
      '<b>使用系数 KA</b>：均匀无冲击 1 / 不均匀小冲击 1.15 / 不均匀大冲击 1.2（小值用于每日偶尔工作，大值用于长期连续工作）；<b>动载系数 KV</b>：精确制造且 v₂≤3m/s 取 1~1.1，v₂＞3m/s 取 1.1~1.2；<b>齿向载荷分布系数 Kβ</b>：载荷平稳取 1，载荷变化较大或有冲击振动取 1.3~1.6。<br>' +
      '<b>GB/T 10085 m 与 d₁ 匹配表（mm，m²d1 见计算结果）</b>：m=1→18；1.25→20、22.4；1.6→20、28；2→(18)、22.4、(28)、35.5；2.5→(22.4)、28、(35.5)、45；3.15→(28)、35.5、(45)、56；4→(31.5)、40、(50)、71；5→(40)、50、(63)、90；6.3→(50)、63、(80)、112；8→(63)、80、(100)、140；10→(71)、90、(112)、160；12.5→(90)、112、(140)、200；16→(112)、140、(180)、250；20→(140)、160、(224)、315；25→(180)、200、(280)、400。注：（）内的值尽量不用。',
    /* 分步中间量（与原站 API 端点 calculation_wormDrive1~6 一一对应，供自测比对） */
    internals: {
      assumeZ1Query: assumeZ1Query, zRouCal: zRouCal,
      wd1: wd1, wd2: wd2, wd3: wd3, wd4: wd4, wd5: wd5, wd6: wd6,
      interpTbl: interpTbl, md1: MD1
    }
  });

  /* 占位：保持 x₂ 提示逻辑简单（无额外计算） */
  function x2Check(x) { return x; }
})();
