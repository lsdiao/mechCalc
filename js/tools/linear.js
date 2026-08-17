/* =========================================================
 * 直线运动类工具
 * 1. 直线轴承选型计算（参照 THK 选型方法）
 * 2. 滚珠丝杆副设计计算
 * 3. 拖链长度计算
 * 依据：THK/MiSUMi 技术手册、GB/T 17587 滚珠丝杠副
 * ========================================================= */
(function () {
  'use strict';
  var fmt = App.fmt;

  /* 硬度系数表（光轴硬度 HRC → fH），分段线性插值，数据源 THK 图表近似 */
  var FH_TABLE = [[40, 0.35], [45, 0.47], [50, 0.63], [55, 0.87], [58, 1.0], [64, 1.0]];
  function hardnessFactor(hrc) {
    if (hrc >= 58) return 1.0;
    if (hrc <= 40) return 0.35;
    for (var i = 0; i < FH_TABLE.length - 1; i++) {
      var a = FH_TABLE[i], b = FH_TABLE[i + 1];
      if (hrc >= a[0] && hrc <= b[0]) return a[1] + (b[1] - a[1]) * (hrc - a[0]) / (b[0] - a[0]);
    }
    return 0.35;
  }
  /* 温度系数 */
  function tempFactor(T) {
    if (T <= 100) return 1.0;
    if (T >= 200) return 0.75;
    return 1.0 - (T - 100) * (1.0 - 0.75) / 100;
  }
  /* 接触系数：单根轴上轴承数 → fc */
  var FC_TABLE = { 1: 1.0, 2: 0.81, 3: 0.72, 4: 0.66, 5: 0.62, 6: 0.6 };

  /* ============ 1. 直线轴承选型 ============ */
  App.registerTool({
    id: 'linear-bearing',
    name: '直线轴承选型计算',
    category: 'linear',
    keywords: '直线轴承 直线衬套 滚珠 轴承寿命 动载荷 静载荷 THK',
    brief: '按寿命与静强度要求计算直线轴承所需额定动载荷 C 与额定静载荷 C0，用于选型。',
    doc: '根据行程、往复次数与设计寿命计算<b>行走距离寿命</b>，结合载荷系数、硬度系数、温度系数与接触系数求出所需的<b>实际动载荷 C</b> 与<b>实际静载荷 C0</b>——所选直线轴承样本的额定值必须大于计算值。',
    inputs: [
      { key: 'body', label: '滚动体类型', group: '输入初始参数', type: 'segment', options: [
        { v: 'ball', t: '滚珠（ε=3）' }, { v: 'roller', t: '滚柱（ε=10/3）' }
      ] },
      { key: 'Pc', label: '平均工作载荷 Pc', group: '输入初始参数', type: 'number', unit: 'N', default: 300, step: 'any' },
      { key: 'P', label: '最大工作载荷 P', group: '输入初始参数', type: 'number', unit: 'N', default: 500, step: 'any' },
      { key: 'S', label: '运行行程（单程）S', group: '输入初始参数', type: 'number', unit: 'mm', default: 500, step: 'any' },
      { key: 'n1', label: '每分钟往复次数 n₁', group: '输入初始参数', type: 'number', unit: '次/min', default: 20, step: 'any' },
      { key: 'Lh', label: '设计寿命 Lh', group: '输入初始参数', type: 'number', unit: 'h', default: 10000, step: 'any' },
      { key: 'fs', label: '静安全系数 fs', group: '静载荷 C0 计算', type: 'select', options: [
        { v: '1', t: '1.0~1.3 运转平稳、冲击小' }, { v: '1.5', t: '1.5~2.0 普通运转条件' }, { v: '2.5', t: '2.0~3.0 承受冲击载荷' }
      ], default: '1.5' },
      { key: 'v', label: '平均速度 v', group: '动载荷 C 计算', type: 'number', unit: 'm/min', default: 20, step: 'any', hint: 'v = 2×S×n₁/1000' },
      { key: 'fw', label: '负载条件系数 fw', group: '动载荷 C 计算', type: 'select', options: [
        { v: '1.1', t: '1.0~1.2 平稳无冲击（v≤15m/min）' },
        { v: '1.45', t: '1.3~1.6 普通条件（v 15~60m/min）' },
        { v: '2.0', t: '1.6~3.0 有冲击振动（v＞60m/min）' }
      ], default: '1.45' },
      { key: 'HRC', label: '光轴硬度', group: '动载荷 C 计算', type: 'number', unit: 'HRC', default: 60, step: 'any', hint: '标准硬度 HRC58~60，低于 58 额定值下降' },
      { key: 'T', label: '导轨温度', group: '动载荷 C 计算', type: 'number', unit: '℃', default: 40, step: 'any', hint: '超过 100℃ 需计入温度系数' },
      { key: 'nBearing', label: '单根轴上轴承数目', group: '动载荷 C 计算', type: 'select', options: [1, 2, 3, 4, 5, 6].map(function (n) { return { v: n, t: n + ' 个' }; }), default: '2' }
    ],
    compute: function (v) {
      var Pc = +v.Pc, P = +v.P, S = +v.S, n1 = +v.n1, Lh = +v.Lh;
      if (!(Pc > 0) || !(P > 0) || !(S > 0) || !(n1 > 0) || !(Lh > 0)) return { error: '请完整输入载荷、行程、往复次数与设计寿命' };
      var eps = v.body === 'ball' ? 3 : 10 / 3;
      var C0 = (+v.fs) * P;                         // 实际静载荷需求
      var L = 2 * S * n1 * Lh * 60 / 1e6;           // 行走距离寿命 km
      var vCalc = 2 * S * n1 / 1000;                // 理论平均速度 m/min
      var fH = hardnessFactor(+v.HRC);
      var fT = tempFactor(+v.T);
      var fc = FC_TABLE[+v.nBearing] || 0.6;
      var fw = +v.fw;
      var C = fw * Pc * Math.pow(L / 50, 1 / eps) / (fH * fT * fc);
      var hardWarn = +v.HRC < 58;
      return {
        sections: [
          { title: '静载荷计算', rows: [
            { label: '静安全系数 fs', value: +v.fs, d: 1 },
            { label: '实际静载荷 C₀=fs·P', value: C0, unit: 'N', hl: true }
          ] },
          { title: '寿命与系数', rows: [
            { label: '行走距离寿命 L', value: L, unit: 'km', hl: true },
            { label: '理论平均速度 v=2S·n₁', value: vCalc, unit: 'm/min' },
            { label: '硬度系数 fH', value: fH, d: 3, unit: '' },
            { label: '温度系数 fT', value: fT, d: 3, unit: '' },
            { label: '接触系数 fc', value: fc, d: 2, unit: '' },
            { label: '负载条件系数 fw', value: fw, d: 2, unit: '' }
          ] },
          { title: '动载荷计算（选型依据）', rows: [
            { label: '寿命指数 ε', value: eps, d: 2, unit: '' },
            { label: '实际动载荷 C', value: C, unit: 'N', hl: true },
            { label: '所选样本需满足', html: 'C<sub>额定</sub> ≥ ' + fmt(C) + ' N 且 C<sub>0额定</sub> ≥ ' + fmt(C0) + ' N', hl: true }
          ] }
        ],
        verdict: {
          level: hardWarn ? 'warn' : 'ok',
          text: hardWarn ? '光轴硬度低于 HRC58，额定载荷将显著下降，建议光轴硬度 HRC58~60'
                         : '计算完成，请对照样本选择额定动载荷≥C 且额定静载荷≥C₀ 的型号'
        },
        notes: [
          '行走寿命 L = 2·S·n₁·Lh·60/10⁶（km），单程行程 S 每往复一次行走 2S。',
          '寿命公式：L = (C·fH·fT·fc/(fw·Pc))^ε × 50 km；滚珠 ε=3，滚柱 ε=10/3。',
          '为使承载能力最佳，导轨（光轴）硬度应达 HRC58~60；环境温度高于 100℃ 需计入 fT。',
          '选型时还需校核：允许转速、光轴挠度（跨距与载荷下）、安装空间尺寸。'
        ]
      };
    },
    formulas: [
      'C₀ = fs·P（fs：平稳 1.0~1.3 / 普通 1.5~2.0 / 冲击 2.0~3.0）',
      'L = 2·S·n₁·Lh·60/10⁶（km）',
      'C = fw·Pc·(L/50)^(1/ε) / (fH·fT·fc)'
    ],
    reference: 'THK《直线运动系统综合产品手册》（寿命计算章节）；MiSUMi 直线轴承选型样本；《机械设计手册》第5版 轴承篇。'
  });

  /* ============ 2. 滚珠丝杆副计算 ============ */
  App.registerTool({
    id: 'ball-screw',
    name: '滚珠丝杆副计算',
    category: 'linear',
    keywords: '滚珠丝杠 丝杆 动载荷 寿命 驱动转矩 DmN 选型',
    brief: '按寿命要求计算滚珠丝杆所需基本额定动载荷 Ca、当量转速、驱动转矩与电机功率。',
    doc: '由轴向载荷、转速与设计寿命计算<b>所需基本额定动载荷 Ca</b>（选型核心参数），同时给出驱动转矩、电机功率、线速度与 DmN 值校核，适用于定位/传动用滚珠丝杆副的初步选型。',
    inputs: [
      { key: 'F', label: '当量轴向载荷 Fm', group: '载荷与转速', type: 'number', unit: 'N', default: 800, step: 'any', hint: '变载荷工况按 Fm=(ΣFi³ti/Σti)^(1/3) 折算' },
      { key: 'n', label: '当量转速 n', group: '载荷与转速', type: 'number', unit: 'r/min', default: 300, step: 'any' },
      { key: 'Lh', label: '设计寿命 Lh', group: '载荷与转速', type: 'number', unit: 'h', default: 20000, step: 'any', hint: '一般机床 20000h，自动机械 5000~10000h' },
      { key: 'Ph', label: '导程 Ph', group: '丝杆参数', type: 'number', unit: 'mm', default: 10, step: 'any' },
      { key: 'Dm', label: '滚珠中心圆直径 Dm', group: '丝杆参数', type: 'number', unit: 'mm', default: 25, step: 'any', hint: '≈公称直径，选型后按样本复核' },
      { key: 'eta', label: '传动效率 η', group: '丝杆参数', type: 'number', default: 0.92, step: 'any', hint: '滚珠丝杆 η≈0.90~0.95' },
      { key: 'fw', label: '载荷系数 fw', group: '系数', type: 'select', options: [
        { v: '1.1', t: '1.0~1.2 平稳（研磨级、均匀载荷）' },
        { v: '1.3', t: '1.2~1.5 轻微冲击（一般机械）' },
        { v: '1.7', t: '1.5~2.0 冲击振动（高速、往复冲击）' }
      ], default: '1.3' },
      { key: 'fH', label: '硬度系数 fH', group: '系数', type: 'number', default: 1.0, step: 'any', hint: 'HRC58 以上取 1.0' }
    ],
    compute: function (v) {
      var F = +v.F, n = +v.n, Lh = +v.Lh, Ph = +v.Ph, Dm = +v.Dm, eta = +v.eta;
      if (!(F > 0) || !(n > 0) || !(Lh > 0) || !(Ph > 0)) return { error: '请完整输入载荷、转速、寿命与导程' };
      var fw = +v.fw, fH = +v.fH;
      var revs = 60 * n * Lh;                       // 总转数
      var Ca = fw * F * Math.pow(revs / 1e6, 1 / 3) / fH; // 额定动载荷需求
      var T = F * Ph / (2 * Math.PI * eta);         // 驱动转矩 N·mm
      var PkW = T * n / 9550000;                    // kW（T 为 N·mm：P=T·n/9.55×10⁶）
      var vel = Ph * n / 60;                        // 线速度 mm/s
      var DmN = Dm * n;                             // DmN 值
      var DmNAllow = 70000;                         // 常规允许值（精密研磨级）
      return {
        sections: [
          { title: '寿命与动载荷', rows: [
            { label: '寿命期内总转数', value: revs, unit: '转', d: 0 },
            { label: 'L10 寿命（10⁶转计）', value: revs / 1e6, unit: '×10⁶ 转', d: 2 },
            { label: '所需额定动载荷 Ca', value: Ca, unit: 'N', hl: true },
            { label: '载荷系数 fw', value: fw, d: 1, unit: '' }
          ] },
          { title: '运动与驱动参数', rows: [
            { label: '线速度 v=Ph·n/60', value: vel, unit: 'mm/s', d: 1 },
            { label: '驱动转矩 T=F·Ph/(2πη)', value: T, unit: 'N·mm', d: 1, hl: true },
            { label: '驱动转矩 T', value: T / 1000, unit: 'N·m', d: 3 },
            { label: '所需驱动功率 P', value: PkW, unit: 'kW', d: 3, hl: true }
          ] },
          { title: '极限校核', rows: [
            { label: 'DmN 值', value: DmN, unit: 'mm·r/min', d: 0, hl: true },
            { label: 'DmN 允许值（常规）', value: DmNAllow, unit: 'mm·r/min', d: 0 }
          ] }
        ],
        verdict: {
          level: DmN <= DmNAllow ? 'ok' : 'warn',
          text: DmN <= DmNAllow
            ? '选型依据：样本 Ca ≥ ' + fmt(Ca) + ' N；DmN=' + fmt(DmN) + ' 在常规允许范围内'
            : 'DmN=' + fmt(DmN) + ' 超过常规允许值 70000，需提高精度等级或降低转速',
          note: '高速工况还应校核临界转速（与丝杠支承方式、长径比有关）及压杆稳定性。'
        },
        notes: [
          '额定寿命：L10 = (Ca·fH/(fw·Fm))³ × 10⁶ 转，反推 Ca = fw·Fm·(L10/10⁶)^(1/3)/fH。',
          '驱动转矩未计入预紧力矩与摩擦副（导轨、轴承）附加摩擦，电机选型建议再加 20%~30% 裕度。',
          'DmN 允许值：冷轧级约 50000，精密研磨级可达 70000~150000，以厂商样本为准。'
        ]
      };
    },
    formulas: [
      'Ca = fw·Fm·(60·n·Lh/10⁶)^(1/3)/fH',
      'T = F·Ph/(2π·η)，P(kW) = T·n/9.55×10⁶（T:N·mm）',
      'DmN = Dm·n ≤ [DmN]'
    ],
    reference: 'GB/T 17587《滚珠丝杠副》；THK/NSK/银泰（PMI）滚珠丝杠技术手册寿命计算章节。'
  });

  /* ============ 3. 拖链长度计算 ============ */
  App.registerTool({
    id: 'cable-chain',
    name: '拖链长度计算',
    category: 'linear',
    keywords: '拖链 电缆链 长度 行程 弯曲半径 固定点',
    brief: '按行程、弯曲半径与固定点位置计算拖链所需长度与安装高度。',
    doc: '拖链总长 L = 固定点侧移动补偿 + 弯曲部分展开长（πR）+ 安装余量。<b>固定点位于行程中央</b>时最省拖链；固定点偏离中央时长度增加偏离量 d。',
    inputs: [
      { key: 'S', label: '行程 S', group: '安装参数', type: 'number', unit: 'mm', default: 2000, step: 'any' },
      { key: 'R', label: '弯曲半径 R', group: '安装参数', type: 'number', unit: 'mm', default: 150, step: 'any', hint: '按拖链规格与最大电缆直径选取，一般≥电缆外径的8~10倍' },
      { key: 'fix', label: '固定点位置', group: '安装参数', type: 'segment', options: [
        { v: 'mid', t: '行程中央（推荐）' }, { v: 'end', t: '行程末端' }
      ] },
      { key: 'margin', label: '固定端安装余量', group: '安装参数', type: 'number', unit: 'mm', default: 200, step: 'any', hint: '含两端固定安装预留，建议 100~300mm' },
      { key: 'rise', label: '滑行槽补偿量', group: '安装参数', type: 'number', unit: 'mm', default: 0, step: 'any', hint: '上下叠层滑行时的额外补偿，一般可取 0' }
    ],
    compute: function (v) {
      var S = +v.S, R = +v.R, margin = +v.margin, rise = +v.rise || 0;
      if (!(S > 0) || !(R > 0)) return { error: '请输入行程 S 与弯曲半径 R' };
      var bend = Math.PI * R;                 // 弯曲部分展开长度
      var Lmid = S / 2 + bend + margin + rise;      // 固定点在行程中央
      var Lend = S + bend + margin + rise;          // 固定点在行程末端
      var L = v.fix === 'mid' ? Lmid : Lend;
      var H = R + Math.PI * R / 2 + 50;       // 拖链竖立总高近似（R + 半圆弯曲高）
      var Hmin = R * 2 + 100;                 // 简化安装高度参考
      return {
        sections: [
          { title: '长度计算', rows: [
            { label: '弯曲部分展开长 πR', value: bend, unit: 'mm', d: 1 },
            { label: '所需拖链长度 L', value: L, unit: 'mm', hl: true },
            { label: '折合米数', value: L / 1000, unit: 'm', d: 2, hl: true },
            { label: '与中央固定方案对比', value: (Lend - Lmid) / 1000, unit: 'm 更长（末端固定时）', d: 2 }
          ] },
          { title: '安装空间', rows: [
            { label: '拖链弯曲后总高（估算）', value: H, unit: 'mm', d: 0 },
            { label: '建议最小安装高度', value: Hmin, unit: 'mm', d: 0 },
            { label: '拖链每端空载长度', value: (v.fix === 'mid' ? S / 4 : S / 2), unit: 'mm', d: 0 }
          ] }
        ],
        verdict: {
          level: 'ok',
          text: v.fix === 'mid'
            ? '固定点在行程中央：L = S/2 + πR + 余量 = ' + fmt(L) + ' mm'
            : '固定点在行程末端：L = S + πR + 余量 = ' + fmt(L) + ' mm，比中央固定多 ' + fmt((Lend - Lmid) / 1000, 2) + ' m',
          note: '订购时按厂商节距圆整至整数链节数（通常取偶数节）。'
        },
        notes: [
          '通用公式：L = S/2 + πR + K（K 为固定端余量）；固定点偏离中央 d 时 L = S/2 + πR + d + K。',
          '固定点位于行程中央可获得最短拖链、最低成本与最佳运行稳定性。',
          '重叠运行（滑行槽）工况请按厂商规范追加补偿量并校核滑行磨损。'
        ]
      };
    },
    formulas: [
      '固定点在行程中央：L = S/2 + π·R + 余量',
      '固定点在行程末端：L = S + π·R + 余量',
      '弯曲段展开长 = π·R（半圆上下两层各 πR/2 已含）'
    ],
    reference: 'igus《拖链系统设计指南》、GURR/汉达（HET）等拖链厂商选型样本通用计算方法。'
  });
})();
