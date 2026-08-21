/* =========================================================
 * 机械传动类工具 —— 1:1 复刻 mechtool.cn 两个工具
 * 1. 倍速滚子链选型（id=double-speed-chain）
 *    源码页：/calculation/calculation_double-speedrollerchainselection.html
 * 2. 渐开线圆柱齿轮齿厚/公法线长度计算（id=gear-thickness）
 *    源码页：/geardrive/geardrive_commonnormallengthcalculation.html
 * 依据：JB/T 7364-2004《倍速输送链和链轮》；MiSUMi《倍速链条的选型方法》
 *       《机械设计手册》渐开线圆柱齿轮公法线长度公式
 * 说明：倍速链 fMax/G 与 链轮 n/d/T/P 均经 mechtool.cn 服务端接口逐值校验。
 * ========================================================= */
(function () {
  'use strict';
  var fmt = App.fmt;
  var G = 9.80665; /* 重力加速度 m/s²（原站 API 取值，校验一致） */

  /* ============ 1. 倍速滚子链选型 ============ */
  App.registerTool({
    id: 'double-speed-chain',
    name: '倍速滚子链选型',
    category: 'trans',
    keywords: '倍速链 滚子链 倍速滚子链 输送链 自由流动 链条 最大拉力 滚子负荷 摩擦系数 选型',
    brief: '倍速（自由流动）滚子链输送机的链条最大拉力与滚子负荷计算，并给出链轮转速、分度圆直径、驱动转矩与功率。',
    doc: '按 MiSUMi《倍速链条的选型方法》与 JB/T 7364-2004 计算<b>链条最大拉力 F</b> 与<b>滚子负荷 G</b>：输送段由链条与轨道摩擦 f1 产生张力、堆积段由物料与链条摩擦 f2 及导轨与链条摩擦 f3 产生张力，F 已计入速度系数 Kv；滚子负荷 G = M1·g/1000 (kN/m)，须≤所选链条容许滚子负荷。再按链轮齿数 z 与节距 p 计算<b>链轮转速 n、分度圆直径 d、驱动转矩 T、驱动功率 P</b>，用于链条选型。各结果字段与原站逐值一致。',
    inputs: [
      /* ---- 原站「输入初始参数」 ---- */
      { key: 'unitMass1', label: '输送物料单重 M1', group: '输入初始参数', type: 'number', unit: 'kg/m', default: 60, step: 1 },
      { key: 'unitMass2', label: '堆积物料单重 M2', group: '输入初始参数', type: 'number', unit: 'kg/m', default: 60, step: 1 },
      { key: 'length', label: '输送总长度 L', group: '输入初始参数', type: 'number', unit: 'm', default: 2.5, step: 0.1 },
      { key: 'length2', label: '物料堆积长度 L2', group: '输入初始参数', type: 'number', unit: 'm', default: 0.8, step: 0.1 },
      { key: 'chainMass', label: '链条单重 C', group: '输入初始参数', type: 'number', unit: 'kg/m', default: 1.4, step: 0.1 },
      { key: 'loadSpeed', label: '负载速度 v', group: '输入初始参数', type: 'number', unit: 'mm/s', default: 200, step: 1 },
      { key: 'chainRate', label: '链条倍率', group: '输入初始参数', type: 'number', default: 2.5, step: 0.1, hint: '链速 = 负载速度 / 链条倍率' },

      /* ---- 原站「计算链条最大拉力」 ---- */
      { key: 'kV', label: '速度系数 Kv', group: '计算链条最大拉力', type: 'number', default: 1, step: 0.1 },
      { key: 'rollerMaterial', label: '滚子材料', group: '计算链条最大拉力', type: 'select', options: [
        { v: '钢制滚子', t: '钢制滚子' }, { v: 'A·C·UA', t: 'A·C·UA' }, { v: 'B·D·UB', t: 'B·D·UB' }
      ], default: '钢制滚子', hint: '查椿本/国标倍速链容许参数表用，不参与计算' },
      { key: 'f1', label: '摩擦系数 f1', group: '计算链条最大拉力', type: 'number', default: 0.05, step: 0.1, hint: '输送时链条与轨道摩擦系数 μ1' },
      { key: 'f2', label: '摩擦系数 f2', group: '计算链条最大拉力', type: 'number', default: 0.1, step: 0.1, hint: '堆积时物料与链条摩擦系数 μ2' },
      { key: 'f3', label: '摩擦系数 f3', group: '计算链条最大拉力', type: 'number', default: 0.1, step: 0.1, hint: '堆积时导轨与链条摩擦系数 μ3' },

      /* ---- 原站「计算链轮转速和所需扭矩/功率」 ---- */
      { key: 'z', label: '链轮齿数 Z', group: '计算链轮转速和所需扭矩/功率', type: 'select', options: [
        { v: '8', t: '8' }, { v: '9', t: '9' }, { v: '10', t: '10' },
        { v: '11', t: '11' }, { v: '12', t: '12' }, { v: '13', t: '13' }
      ], default: '10' },
      { key: 'pitch', label: '节距 p', group: '计算链轮转速和所需扭矩/功率', type: 'select', unit: 'mm', options: [
        { v: '19.05', t: '19.05' }, { v: '25.4', t: '25.4' }, { v: '31.75', t: '31.75' },
        { v: '38.1', t: '38.1' }, { v: '50.8', t: '50.8' }
      ], default: '19.05' }
    ],

    compute: function (v) {
      var M1 = +v.unitMass1, M2 = +v.unitMass2;
      var L = +v.length, L2 = +v.length2;
      var C = +v.chainMass;
      var loadSpeed = +v.loadSpeed, chainRate = +v.chainRate;
      if (!(L > 0) || L > 100) return { error: '请输入0-100之间的数（输送总长度 L）' };
      if (!(L2 > 0) || L2 > 100) return { error: '请输入0-100之间的数（物料堆积长度 L2）' };
      if (M1 < 0 || M1 > 1000 || isNaN(M1)) return { error: '请输入0-1000之间的数（输送物料单重 M1）' };
      if (M2 < 0 || M2 > 1000 || isNaN(M2)) return { error: '请输入0-1000之间的数（堆积物料单重 M2）' };

      /* 链条速度 v = 负载速度/链条倍率（m/s） */
      var vs = loadSpeed / 1000 / chainRate;
      if (!(vs > 0)) return { error: '链条速度计算异常，请检查负载速度与链条倍率' };

      /* 最大拉力 F（kN），已含速度系数 Kv
       * 送段：链条与轨道摩擦 f1，负载 (M1+C)·(L−L2)＋链条自重 C·L
       * 堆积段：物料与链条摩擦 f2（M2·L2）＋导轨与链条摩擦 f3（(M2+C)·L2） */
      var kV = +v.kV;
      if (!(kV > 0)) return { error: '请输入合理的速度系数 Kv' };
      var f1 = +v.f1, f2 = +v.f2, f3 = +v.f3;
      var fMax = kV * G / 1000 * (
        f1 * ((M1 + C) * (L - L2) + C * L) +
        f2 * M2 * L2 +
        f3 * (M2 + C) * L2
      );

      /* 滚子负荷 G（kN/m）：取输送物料单重 M1 之重力 */
      var rollerLoad = G / 1000 * M1;

      /* 链轮转速 n、分度圆直径 d、驱动转矩 T、驱动功率 P */
      var z = +v.z, p = +v.pitch;
      var n = 60000 * vs / (p * z);               /* r/min，n=60·v/(p·z)，v m/s、p mm */
      var d = p / Math.sin(Math.PI / z);          /* 分度圆直径 d=p/sin(180°/z) mm */
      var torque = fMax * d / 2;                  /* 驱动转矩 T=F·d/2，F kN→N，d mm→m */
      var power = fMax * vs;                      /* 驱动功率 P=F·v（kN·m/s=kW） */

      var warns = [];
      if (loadSpeed > 30000) warns.push('负载速度偏高，需复核速度系数 Kv');
      if (L2 >= L) warns.push('物料堆积长度 L2 不小于输送总长度 L，请检查输入');

      return {
        sections: [
          { title: '链条速度', rows: [
            { label: '链条速度 v = 负载速度/链条倍率', value: vs, unit: 'm/s', d: 3, hl: true }
          ] },
          { title: '链条最大拉力', rows: [
            { label: '输送段摩擦 f1：(M1+C)(L−L2)+C·L', html: '（系数 f1=' + fmt(f1, 2) + '）' },
            { label: '堆积段摩擦 f2：M2·L2', html: '（系数 f2=' + fmt(f2, 2) + '）' },
            { label: '堆积段摩擦 f3：(M2+C)·L2', html: '（系数 f3=' + fmt(f3, 2) + '）' },
            { label: '最大拉力 F（含速度系数 Kv）', value: fMax, unit: 'kN', d: 3, hl: true },
            { label: '滚子负荷 G = M1·g/1000', value: rollerLoad, unit: 'kN/m', d: 3, hl: true },
            { label: '单根链拉力（双链并列取 0.6F）', value: 0.6 * fMax, unit: 'kN', d: 3 }
          ] },
          { title: '链轮转速与驱动', rows: [
            { label: '链轮转速 n = 60·v/(p·z)', value: n, unit: 'r/min', d: 2, hl: true },
            { label: '分度圆直径 d = p/sin(180°/z)', value: d, unit: 'mm', d: 3 },
            { label: '驱动转矩 T = F·d/2', value: torque, unit: 'N·m', d: 3, hl: true },
            { label: '驱动功率 P = F·v', value: power, unit: 'kW', d: 4, hl: true }
          ] }
        ],
        verdict: {
          level: warns.length ? 'warn' : 'ok',
          text: warns.length ? warns.join('；')
            : '最大拉力 F=' + fmt(fMax, 3) + ' kN（含 Kv），滚子负荷 G=' + fmt(rollerLoad, 3) + ' kN/m，链轮转速 n=' + fmt(n, 2) + ' r/min，驱动功率 P=' + fmt(power, 4) + ' kW',
          note: '选型校核：单根链(0.6F)或双链(F)须≤所选链条最大容许张力；G 须≤所选链条容许滚子负荷；实际所需功率≈1.1·P/η（η 为机械传动效率）。'
        },
        notes: [
          '最大拉力模型：输送段链条与轨道摩擦 f1，负载 (M1+C)·(L−L2)＋链条自重 C·L；堆积段物料与链条摩擦 f2（M2·L2）＋导轨与链条摩擦 f3（(M2+C)·L2）。F = Kv·g/1000·Σ(负载×摩擦系数·长度)（kN）。',
          'F 值为链条最大拉力乘以速度系数 Kv 后的结果；两根链条并列使用时计算值 F 为两根链条的最大拉力，单根链条拉力取 0.6F。',
          '滚子负荷 G = M1·g/1000，须 ≤ 所选链条的容许滚子负荷（表中容许负荷指每 2 条链条的容许载荷）。',
          '链轮转速 n=60·v/(p·z)；分度圆直径 d=p/sin(180°/z)；驱动转矩 T=F·d/2；驱动功率 P=F·v=T·n/9549；选型所需功率≈1.1·P/η。',
          '滚子材料下拉（钢制滚子 / A·C·UA / B·D·UB）仅用于查阅椿本/国标倍速链容许参数表，不参与公式计算。'
        ]
      };
    },

    formulas: [
      'v_chain = 负载速度/链条倍率（m/s）',
      'F = Kv · g/1000 · [ f1·((M1+C)(L−L2)+C·L) + f2·M2·L2 + f3·(M2+C)·L2 ] (kN)',
      'G = M1·g/1000 (kN/m)；单根链 F_单 = 0.6·F',
      'n = 60·v/(p·z)；d = p/sin(180°/z)；T = F·d/2 (N·m)；P = F·v (kW)'
    ],
    reference: '1:1 复刻任 mechtool.cn 倍速滚子链选型：https://www.mechtool.cn/calculation/calculation_double-speedrollerchainselection.html；公式依据 MiSUMi《倍速链条的选型方法》、JB/T 7364-2004《倍速输送链和链轮》。'
  });

  /* ============ 2. 渐开线圆柱齿轮齿厚 / 公法线长度计算 ============ */
  function inv(x) { return Math.tan(x) - x; } /* 渐开线函数，x 为弧度 */

  App.registerTool({
    id: 'gear-thickness',
    name: '渐开线圆柱齿轮齿厚计算公式',
    category: 'trans',
    keywords: '齿轮 渐开线 圆柱齿轮 齿厚 公法线 公法线长度 跨测齿数 基圆齿距 直齿轮 斜齿轮',
    brief: '标准/变位直齿与斜齿圆柱齿轮的公法线长度 W（跨测齿数 k）、分度圆齿厚 s 与基圆齿距等尺寸计算。',
    doc: '按《机械设计手册》计算度量渐开线圆柱齿轮齿厚的尺寸：<b>公法线长度 W</b> 与<b>跨测齿数 k</b>（Wk = m·cosα·[π(k−0.5)+z·invα]+2x·m·sinα，斜齿轮取端面渐开线函数与假想齿数），并给出<b>分度圆齿厚 s</b>、<b>基圆齿距 pb</b> 及分度圆/基圆直径。',
    inputs: [
      { key: 'gearType', label: '齿轮类型', group: '齿轮参数', type: 'select', options: [
        { v: 'straight', t: '直齿轮' }, { v: 'helical', t: '斜齿轮' }
      ], default: 'straight' },
      { key: 'm', label: '模数 m（法面 mn）', group: '齿轮参数', type: 'number', unit: 'mm', default: 2, step: 'any' },
      { key: 'z', label: '齿数 z', group: '齿轮参数', type: 'number', default: 20, step: 1 },
      { key: 'alpha', label: '压力角 α（法面 αn）', group: '齿轮参数', type: 'number', unit: '°', default: 20, step: 'any' },
      { key: 'beta', label: '螺旋角 β', group: '齿轮参数', type: 'number', unit: '°', default: 0, step: 'any', hint: '斜齿轮专用；0 为直齿轮' },
      { key: 'x', label: '变位系数 x', group: '齿轮参数', type: 'number', default: 0, step: 'any', hint: '标准齿轮取 0' }
    ],
    compute: function (v) {
      var m = +v.m, z = Math.round(+v.z);
      var alpha = +v.alpha, beta = +v.beta, x = +v.x || 0;
      if (!(m > 0)) return { error: '请输入模数 m' };
      if (!(z >= 3)) return { error: '齿数过小（请输入不小于 3 的整数齿数）' };
      if (!(alpha > 0) || alpha >= 90) return { error: '压力角须为 0~90° 之间' };

      var alphaN = alpha * Math.PI / 180;
      var betaR = beta * Math.PI / 180;
      var has = Math.abs(+v.beta) > 0.01; /* 斜齿轮判断 */
      var isHelical = v.gearType === 'helical' || has;

      var mt = m / Math.cos(betaR);                        /* 端面模数 */
      var alphaT = Math.atan(Math.tan(alphaN) / Math.cos(betaR)); /* 端面压力角 */
      var invAt = inv(alphaT), invAn = inv(alphaN);
      var d = mt * z;                                      /* 分度圆直径 */
      var db = d * Math.cos(alphaT);                       /* 基圆直径 */

      var k, W, s;
      if (isHelical) {
        var zv = z * invAt / invAn;                        /* 假想齿数 */
        k = Math.round(zv * alpha / 180 + 0.5 + 2 * x * (Math.cos(alphaN) / Math.sin(alphaN)) / Math.PI);
        W = m * Math.cos(alphaN) * (Math.PI * (k - 0.5) + z * invAt) + 2 * x * m * Math.sin(alphaN);
        s = m * (Math.PI / 2 + 2 * x * Math.tan(alphaN));  /* 法面分度圆齿厚 */
      } else {
        var ax = alphaN;
        if (Math.abs(x) > 1e-9) ax = Math.acos(Math.min(1, z * Math.cos(alphaN) / (z + 2 * x)));
        k = Math.round(z * ax * 180 / Math.PI / 180 + 0.5);
        W = m * Math.cos(alphaN) * (Math.PI * (k - 0.5) + z * invAn) + 2 * x * m * Math.sin(alphaN);
        s = m * (Math.PI / 2 + 2 * x * Math.tan(alphaN));  /* 分度圆齿厚 */
      }
      var pb = Math.PI * db / z;                           /* 基圆齿距 pb=π·m·cosα */

      var rows1 = [
        { label: '跨测齿数 k', value: k, unit: '齿', hl: true },
        { label: '公法线长度 W', value: W, unit: 'mm', d: 4, hl: true }
      ];
      var rows2 = [
        { label: '分度圆齿厚 s', value: s, unit: 'mm', d: 4, hl: true },
        { label: '基圆齿距 pb = π·m·cosα', value: pb, unit: 'mm', d: 4 },
        { label: '分度圆直径 d', value: d, unit: 'mm', d: 3 },
        { label: '基圆直径 db', value: db, unit: 'mm', d: 3 }
      ];
      if (isHelical) {
        rows2.splice(2, 0,
          { label: '端面压力角 αt', value: alphaT * 180 / Math.PI, unit: '°', d: 3 },
          { label: '端面模数 mt', value: mt, unit: 'mm', d: 4 }
        );
      }

      return {
        sections: [
          { title: '公法线长度（测量尺寸）', rows: rows1 },
          { title: '齿厚与基圆齿距', rows: rows2 }
        ],
        verdict: {
          level: 'ok',
          text: (isHelical ? '斜' : '直') + '齿轮：公法线 W=' + fmt(W, 4) + ' mm（跨 ' + k + ' 齿），分度圆齿厚 s=' + fmt(s, 4) + ' mm，基圆齿距 pb=' + fmt(pb, 4) + ' mm'
        },
        notes: [
          '公法线长度 W = m·cosαn·[π(k−0.5)+z·invαt]+2x·m·sinαn（直齿轮 invαt=invαn）；跨测齿数 k 按 1/2 圆整。',
          '斜齿轮以假想齿数 zv = z·invαt/invαn 计算跨测齿数，公法线取法面模数 mn 与法面压力角。',
          '分度圆齿厚 s = m·(π/2 + 2x·tanαn)；基圆齿距 pb = π·m·cosα（斜齿轮 pb=π·mt·cosαt，此处以 pb=π·db/z 表示）。',
          '变位时跨测齿数增加 2x·cotαn/π 修正项后圆整；cosαx = z·cosαn/(z+2x)（直齿轮）。'
        ]
      };
    },

    formulas: [
      'W = m·cosα·[π(k−0.5)+z·invα]+2x·m·sinα；k ≈ z′·α/180°+0.5',
      '直齿：invα = tanα−α；斜齿：αt=atan(tanαn/cosβ)，invαt=tanαt−αt，z′ = z·invαt/invαn',
      's = m·(π/2 + 2x·tanα)；pb = π·m·cosα'
    ],
    reference: '1:1 复刻任 mechtool.cn 公法线长度计算：https://www.mechtool.cn/geardrive/geardrive_commonnormallengthcalculation.html；公式依据《机械设计手册》渐开线圆柱齿轮齿厚测量与计算、《机械设计》第九版。'
  });
})();