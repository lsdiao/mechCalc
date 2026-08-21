/* =========================================================
 * 渐开线函数 / 冲击载荷 / 平板临界载荷（1:1 复刻 原站）
 * 表源/公式：
 *  - 渐开线与反渐开线函数：invαk=tan(αk)-αk（αk 弧度），反解牛顿迭代
 *    
 *  - 冲击载荷（纵向冲击两场景）：上端固定等截面直杆自由落体 / 滑轮骤停
 *    
 *  - 平板临界载荷（7 场景）：σc=κ·π²E/(12(1-ν²))·(t/b)²
 *    
 * ========================================================= */
(function () {
  'use strict';
  var fmt = App.fmt || function (x, d) { return Number(x).toFixed(d); };

  /* ---------- 角度/弧度与渐开线 ---------- */
  function deg2rad(a) { return a * Math.PI / 180; }
  function inv(a_deg) {
    var r = deg2rad(a_deg);
    return Math.tan(r) - r;            // 渐开线函数 invα = tanα - α
  }
  /* 反解：求 α 使 tanα-α=invVal（牛顿迭代，弧度域求解，返回角度度） */
  function invInverse(invVal) {
    if (invVal < 0 || !isFinite(invVal)) return NaN;
    if (invVal === 0) return 0;
    var x = Math.cbrt(3 * invVal);      // 弧度初值：小角度 tanx-x≈x³/3
    for (var i = 0; i < 200; i++) {
      var c = Math.cos(x);
      if (Math.abs(c) < 1e-9) break;    // 接近 π/2 应已收敛
      var f = Math.tan(x) - x - invVal;
      var df = 1 / (c * c) - 1;         // d(tanx-x)/dx = sec²x-1
      var x2 = x - f / df;
      if (Math.abs(x2 - x) < 1e-14) { x = x2; break; }
      x = x2;
    }
    return x * 180 / Math.PI;           // 弧度转角度
  }

  /* =========================================================
   * 1. 渐开线和反渐开线函数计算
   * ========================================================= */
  App.registerTool({
    id: 'involute-function',
    name: '渐开线和反渐开线函数计算',
    category: 'trans',
    keywords: '渐开线 反渐开线 invα 齿轮 函数 啮合 展开角',
    brief: '渐开线函数 invα=tanα-α 正算与反解，齿轮几何计算常用。',
    doc: '输入压力角(度·分)得渐开线函数值；或输入 inv 值反解压力角。公式 invα=tanα-α（α 用弧度）。',
    inputs: [
      { key: 'mode', type: 'segment', label: '计算方向', options: [
        { v: 'inv', t: '正算：角度→invα' },
        { v: 'back', t: '反解：invα→角度' }
      ], default: 'inv' },
      { key: 'degree', type: 'number', label: '压力角 α(度)', unit: '°', default: 20, step: 0.5 },
      { key: 'minute', type: 'number', label: '角分', unit: "'", default: 0, step: 1 },
      { key: 'invVal', type: 'number', label: 'invα 值', default: 0.0149, step: 1e-5 }
    ],
    compute: function (v) {
      var rows = [], notes = [];
      if (v.mode === 'inv') {
        var a = (v.degree || 0) + (v.minute || 0) / 60;
        var iv = inv(a);
        rows.push({ label: '压力角 α=' + a + '°', value: a, unit: '°', d: 4 });
        rows.push({ label: '渐开线函数 invα = tanα − α', value: iv, unit: '', d: 8, hl: true });
        notes.push('深色行为最终结果。角度换算为弧度后计算：invα=tan(α·π/180)−α·π/180。');
      } else {
        var deg = invInverse(Number(v.invVal));
        rows.push({ label: '输入渐开线函数 invα', value: Number(v.invVal), unit: '', d: 8 });
        rows.push({ label: '反解压力角 α（牛顿迭代）', value: deg, unit: '°', d: 6, hl: true });
        var dg = Math.floor(deg), mi = (deg - dg) * 60;
        if (!isNaN(deg)) rows.push({ label: '可表示为', value: dg + '°' + mi.toFixed(2) + "'", unit: '', d: 2 });
        notes.push('反解采用牛顿迭代法求 tanα−α=invα 的根，收敛误差 1e-12°。');
      }
      return { sections: [{ title: v.mode === 'inv' ? '渐开线函数正算' : '反渐开线函数反解', rows: rows }], verdict: null, notes: notes };
    },
    reference: 'JB/T 5983 / GB/T 齿轮几何，公式源自 www.原站 渐开线函数页',
    internals: { '公式': 'invα=tanα-α; 反解为牛顿迭代' }
  });

  /* =========================================================
   * 2. 冲击载荷计算（纵向冲击两场景）
   * ========================================================= */
  App.registerTool({
    id: 'impact-load',
    name: '冲击载荷计算',
    category: 'common',
    keywords: '冲击 动荷系数 Kd 自由落体 滑轮 冲击应力 冲击变形 纵向冲击',
    brief: '纵向冲击动荷系数 Kd、最大冲击变形 δk 与最大冲击应力 σk。',
    doc: '自由落体冲击或滑轮骤停冲击下端固定的等截面直杆。Kd=1+√(1+2HEA/(Ql)) 或 Kd=1+√(v²EA/(gQl))。',
    inputs: [
      { key: 'scene', type: 'segment', label: '冲击场景', options: [
        { v: 'fall', t: '自由落体冲击' },
        { v: 'pulley', t: '滑轮骤停冲击' }
      ], default: 'fall' },
      { key: 'Q', type: 'number', label: '重物重量 Q', unit: 'N', default: 1000, step: 10 },
      { key: 'l', type: 'number', label: '杆长 l', unit: 'm', default: 1, step: 0.1 },
      { key: 'E', type: 'number', label: '弹性模量 E', unit: 'MPa', default: 200000, step: 1000 },
      { key: 'A', type: 'number', label: '杆截面积 A', unit: 'm²', default: 0.25, step: 0.01 },
      { key: 'H', type: 'number', label: '冲击高度 H', unit: 'm', default: 0.4, step: 0.1 },
      { key: 'R', type: 'number', label: '滑轮半径 R', unit: 'm', default: 0.2, step: 0.05 },
      { key: 'omega', type: 'number', label: '滑轮角速度 ω', unit: 'rad/s', default: 0.5, step: 0.1 }
    ],
    compute: function (v) {
      var rows = [], notes = [];
      var Q = +v.Q, l = +v.l, E = +v.E, A = +v.A;
      if (!(Q > 0) || !(l > 0) || !(E > 0) || !(A > 0)) {
        return { sections: [], verdict: { level: 'bad', text: '参数无效', note: '请确认 Q、l、E、A 均大于 0' }, notes: [] };
      }
      var ds = Q * l / (E * A);               // 最大静变形 δs = Ql/(EA)  (N·m/(MPa·m²)=N·m/(N/m²·m²)=m)
      var Kd, vfall;
      if (v.scene === 'fall') {
        var H = +v.H; if (!(H >= 0)) return { sections: [], verdict: { level: 'bad', text: '参数无效', note: '冲击高度 H 需 ≥0' }, notes: [] };
        Kd = 1 + Math.sqrt(1 + 2 * H * E * A / (Q * l));   // 动荷系数（自由落体）
        notes.push('自由落体冲击动荷系数：Kd=1+√(1+2HEA/(Ql))。');
      } else {
        var R = +v.R, W = +v.omega;
        if (!(R > 0)) return { sections: [], verdict: { level: 'bad', text: '参数无效', note: '滑轮半径 R 需 >0' }, notes: [] };
        vfall = R * W;                                  // v=R·ω
        Kd = 1 + Math.sqrt(vfall * vfall * E * A / (9.80665 * Q * l));  // Kd=1+√(v²EA/(gQl))
        rows.push({ label: '重物下落速度 v=R·ω', value: vfall, unit: 'm/s', d: 3 });
        notes.push('滑轮骤停冲击动荷系数：Kd=1+√(v²EA/(g·Q·l))，g=9.80665 m/s²。');
      }
      var dk = ds * Kd;                                // 最大冲击变形 δk=δs·Kd
      var sigk = Q * Kd / A;                           // 最大冲击应力 σk=Q·Kd/A (N/m²=Pa)
      rows.push({ label: '最大静变形 δs = Ql/(EA)', value: ds, unit: 'm', d: 6 });
      rows.push({ label: '动荷系数 Kd', value: Kd, unit: '', d: 4, hl: true });
      rows.push({ label: '最大冲击变形 δk = δs·Kd', value: dk, unit: 'm', d: 6 });
      rows.push({ label: '最大冲击应力 σk = Q·Kd/A', value: sigk, unit: 'Pa', d: 2, hl: true });
      return { sections: [{ title: '纵向冲击计算结果', rows: rows }], verdict: null, notes: notes };
    },
    reference: '材料力学冲击动荷计算；公式源自 www.原站 冲击载荷计算页',
    internals: { '公式1': 'Kd=1+√(1+2HEA/(Ql))', '公式2': 'Kd=1+√(v²EA/(gQl))' }
  });

  /* =========================================================
   * 3. 平板临界载荷（屈曲临界应力 7 场景）
   * ========================================================= */
  var PLATE_SCENES = [
    { id: 1, t: '四边简支，均匀受压，m 可调（计算屈曲系数 κ）', computeK: true, m: 1, kdef: null },
    { id: 2, t: '四边简支，轴向受压，β=3（κ 已按 β/m 最小化给出）', computeK: false, kdef: 7.07 },
    { id: 3, t: '两边简支两边自由，轴向受压（β=0.5）', computeK: false, kdef: 6.85 },
    { id: 4, t: '四边简支，纯剪（β=2）', computeK: false, kdef: 0.669 },
    { id: 5, t: '四边简支，受剪（β=2）', computeK: false, kdef: 1.34 },
    { id: 6, t: '四边简支，加筋板，轴向受压', computeK: false, kdef: 7.38 },
    { id: 7, t: '三边简支一边自由，轴向受压', computeK: false, kdef: null }
  ];
  App.registerTool({
    id: 'plate-critical-load',
    name: '平板临界载荷计算',
    category: 'common',
    keywords: '平板 临界载荷 屈曲 临界应力 屈曲系数 板 加筋板 减缩应力',
    brief: '平板屈曲临界应力计算：四边简支/自由支承受压或受剪等 7 种工况。',
    doc: 'σc=κ·π²·E/(12(1-ν²))·(t/b)²。场景 1 自动计算屈曲系数 κ=(β/m+m/β)²，其余直接输入 κ。',
    inputs: [
      { key: 'scene', type: 'select', label: '受力工况', options: PLATE_SCENES.map(function (s) { return { v: String(s.id), t: s.t }; }), default: '1' },
      { key: 'a', type: 'number', label: '板长 a', unit: 'mm', default: 1000, step: 50 },
      { key: 'b', type: 'number', label: '板宽 b', unit: 'mm', default: 500, step: 50 },
      { key: 't', type: 'number', label: '板厚 t', unit: 'mm', default: 10, step: 1 },
      { key: 'E', type: 'number', label: '弹性模量 E', unit: 'MPa', default: 206000, step: 1000 },
      { key: 'nu', type: 'number', label: '泊松比 ν', unit: '', default: 0.3, step: 0.05 },
      { key: 'm', type: 'number', label: '屈曲半波数 m', unit: '', default: 1, step: 1 },
      { key: 'kappa', type: 'number', label: '屈曲系数 κ', unit: '', default: 4, step: 0.1 }
    ],
    compute: function (v) {
      var sc = PLATE_SCENES.filter(function (s) { return String(s.id) === String(v.scene); })[0] || PLATE_SCENES[0];
      var rows = [], notes = [];
      var a = +v.a, b = +v.b, t = +v.t, E = +v.E, nu = +v.nu;
      if (!(b > 0) || !(t > 0) || !(E > 0)) {
        return { sections: [], verdict: { level: 'bad', text: '参数无效', note: '请确认 b、t、E 均大于 0' }, notes: [] };
      }
      var kappa;
      if (sc.computeK) {
        var beta = a / b;
        var m = Math.max(1, Math.round(+v.m));
        kappa = Math.pow(beta / m + m / beta, 2);   // κ=(β/m+m/β)²
        rows.push({ label: '板长宽比 β=a/b', value: beta, unit: '', d: 4 });
        rows.push({ label: '屈曲系数 κ=(β/m+m/β)²', value: kappa, unit: '', d: 4, hl: true });
        notes.push('场景采用 β/m+m/β 最小化确定 κ，可试算不同 m 取最小 σc。');
      } else {
        kappa = (sc.kdef !== null) ? sc.kdef : +v.kappa;
        if (!(kappa > 0)) return { sections: [], verdict: { level: 'bad', text: '参数无效', note: '屈曲系数 κ 需 >0' }, notes: [] };
        rows.push({ label: '输入屈曲系数 κ', value: kappa, unit: '', d: 4 });
      }
      var sigma = kappa * Math.PI * Math.PI * E / (12 * (1 - nu * nu)) * Math.pow(t / b, 2);  // 临界应力 MPa
      rows.push({ label: '临界应力 σc = κ·π²E/(12(1−ν²))·(t/b)²', value: sigma, unit: 'MPa', d: 3, hl: true });
      return { sections: [{ title: '平板屈曲临界应力（场景 ' + sc.id + '）', rows: rows }], verdict: null, notes: notes };
    },
    reference: '板壳屈曲理论 / 机械设计手册；公式源自 www.原站 平板临界载荷页',
    internals: { '公式': 'σc=κ·π²E/(12(1-ν²))·(t/b)²' }
  });
})();