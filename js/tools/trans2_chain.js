/* =========================================================
 * 机械传动类工具 —— 滚子链传动设计计算
 * 1:1 复刻 mechtool.cn「链传动设计计算」工具（逐值一致，已 API 探针验证）
 * 依据：GB/T 18150-2000(2006)《滚子链传动选择指导》
 * 来源：https://www.mechtool.cn/calculation/calculation_chaindrive.html
 * ========================================================= */
(function () {
  'use strict';
  var fmt = App.fmt;

  /* ---------- 数据表 ---------- */
  /* 链号 → 节距 p /mm（GB/T 1243 A、B 系列；取值同原站 chainSize 联动表） */
  var PITCH = {
    '08A': 12.7, '10A': 15.875, '12A': 19.05, '16A': 25.4, '20A': 31.75, '24A': 38.1,
    '28A': 44.45, '32A': 50.8, '36A': 57.15, '40A': 63.5, '48A': 76.2,
    '05B': 8, '06B': 9.525, '08B': 12.7, '10B': 15.875, '12B': 19.05, '16B': 25.4,
    '20B': 31.75, '24B': 38.1, '28B': 44.45, '32B': 50.8, '40B': 63.5, '48B': 76.2
  };
  /* 工况系数 f1（GB/T 18150-2000）：[从动机械特性][主动机械特性]，同原站表 */
  var F1 = {
    '运转平稳': { '运转平稳': 1, '轻微冲击': 1.1, '中等冲击': 1.3 },
    '中等冲击': { '运转平稳': 1.4, '轻微冲击': 1.5, '中等冲击': 1.7 },
    '严重冲击': { '运转平稳': 1.8, '轻微冲击': 1.9, '中等冲击': 2.1 }
  };
  /* 多排链排数系数 km（原站 chainNumber 联动） */
  var KM = { '单排': 1, '双排': 1.75, '三排': 2.5 };

  function num(x) {
    if (x === undefined || x === null) return null;
    x = String(x).trim();
    return x === '' ? null : +x;
  }

  App.registerTool({
    id: 'chain-drive-design',
    name: '滚子链传动设计计算',
    category: 'trans',
    keywords: '链传动 滚子链 套筒滚子链 链号 节距 链长节数 中心距 包角 链速 圆周力 压轴力 工况系数 GB/T 18150',
    brief: '滚子链传动设计计算：设计功率、链长节数、中心距、小链轮包角、链速与压轴力，按 GB/T 18150 滚子链传动选择指导。',
    doc: '按 GB/T 18150《滚子链传动选择指导》完成滚子链传动设计全流程：输入功率、转速与主/从动机械特性，自动查得<b>工况系数 f1</b>、<b>齿数系数 f2=(19/z1)<sup>1.08</sup></b> 与多排链系数 km，计算设计功率 Pc=f1·f2·P/km，据此与小链轮转速 n1 查额定功率图选定链号（A/B 系列 08A~48A、05B~48B，节距自动带出）；再按初定中心距 a0 计算链长节数 X0 并<b>向上圆整为偶数 X</b>，反算理论中心距 a、实际中心距 a(1−Δa)、小链轮包角 α1、链速 v、有效圆周力 F 与压轴力 FQ=f5·f1·F。计算公式与结果字段与 mechtool.cn 原站逐值一致。',
    inputs: [
      /* ---- 原站「输入初始参数」 ---- */
      { key: 'power', label: '传动功率 P', group: '输入初始参数', type: 'number', unit: 'kW', default: 2.5, step: 'any' },
      { key: 'n1', label: '主动轴转速 n1', group: '输入初始参数', type: 'number', unit: 'r/min', default: 265, step: 'any' },
      { key: 'n2', label: '从动轴转速 n2', group: '输入初始参数', type: 'number', unit: 'r/min', default: '', step: 'any', hint: '留空按 n2=n1/i 计算；填写则按 i=n1/n2 反算传动比' },
      { key: 'velocity', label: '传动速度 v', group: '输入初始参数', type: 'select', unit: 'm/s', options: [
        { v: '0.6~3', t: '0.6~3' }, { v: '3~8', t: '3~8' }, { v: '>8', t: '>8' }
      ], default: '0.6~3', hint: '链速区间（润滑方式选择参考，不参与计算）' },
      { key: 'transmissionRatio', label: '传动比 i', group: '输入初始参数', type: 'number', default: 2.5, step: 'any', hint: 'i=n1/n2，0<i≤10' },
      { key: 'drivingMachine', label: '主动机工况', group: '输入初始参数', type: 'select', options: [
        { v: '运转平稳', t: '运转平稳' }, { v: '轻微冲击', t: '轻微冲击' }, { v: '中等冲击', t: '中等冲击' }
      ], default: '运转平稳' },
      { key: 'drivenMachine', label: '从动机工况', group: '输入初始参数', type: 'select', options: [
        { v: '运转平稳', t: '运转平稳' }, { v: '中等冲击', t: '中等冲击' }, { v: '严重冲击', t: '严重冲击' }
      ], default: '运转平稳' },
      { key: 'chainNumber', label: '链的排数', group: '输入初始参数', type: 'select', options: [
        { v: '单排', t: '单排（km=1）' }, { v: '双排', t: '双排（km=1.75）' }, { v: '三排', t: '三排（km=2.5）' }
      ], default: '单排' },
      { key: 'chainType', label: '链的类型', group: '输入初始参数', type: 'select', options: [
        { v: 'A型', t: 'A型（08A~48A）' }, { v: 'B型', t: 'B型（05B~48B）' }
      ], default: 'A型', hint: '链号下拉已同时列出 A、B 两个系列' },

      /* ---- 原站「链轮齿数及设计功率」（f1、km、Pc 为计算结果） ---- */
      { key: 'z1', label: '小链轮齿数 z1', group: '链轮齿数及设计功率', type: 'number', default: 19, step: 1, hint: '17~120，优先选用 17、19、21、23、25、38、57、76、95、114' },
      { key: 'z2', label: '大链轮齿数 z2', group: '链轮齿数及设计功率', type: 'number', default: '', step: 1, hint: '留空按 z2=z1·i 自动圆整（17~120）' },
      { key: 'f2', label: '主动链轮齿数系数 f2', group: '链轮齿数及设计功率', type: 'number', default: '', step: 'any', hint: '留空按 f2=(19/z1)^1.08 自动计算（2位小数）' },

      /* ---- 原站「链条节距及初定中心距」（chainPitch、a0min 为计算结果） ---- */
      { key: 'chainSize', label: '选择链号', group: '链条节距及初定中心距', type: 'select', options: [
        { v: '08A', t: '08A' }, { v: '10A', t: '10A' }, { v: '12A', t: '12A' }, { v: '16A', t: '16A' },
        { v: '20A', t: '20A' }, { v: '24A', t: '24A' }, { v: '28A', t: '28A' }, { v: '32A', t: '32A' },
        { v: '36A', t: '36A' }, { v: '40A', t: '40A' }, { v: '48A', t: '48A' },
        { v: '05B', t: '05B' }, { v: '06B', t: '06B' }, { v: '08B', t: '08B' }, { v: '10B', t: '10B' },
        { v: '12B', t: '12B' }, { v: '16B', t: '16B' }, { v: '20B', t: '20B' }, { v: '24B', t: '24B' },
        { v: '28B', t: '28B' }, { v: '32B', t: '32B' }, { v: '40B', t: '40B' }, { v: '48B', t: '48B' }
      ], default: '08A', hint: '按设计功率 Pc 与 n1 查滚子链额定功率图选定' },
      { key: 'a0', label: '中心距 a0', group: '链条节距及初定中心距', type: 'number', unit: 'p（节数）', default: 9.5, step: 'any', hint: '推荐 (30~50)p；留空取最小中心距 a0min' },
      { key: 'a0length', label: '中心距 a0（按毫米）', group: '链条节距及初定中心距', type: 'number', unit: 'mm', default: '', step: 'any', hint: '填写后优先按 a0=a0length/p 反算（对应原站 a0length 框）' },

      /* ---- 原站「计算链条参数」输入项 ---- */
      { key: 'deltaA', label: '选取 Δa', group: '计算链条参数', type: 'number', unit: 'a', default: 0.004, step: 0.001, hint: '0.002~0.004，用于中心距调整量' },
      { key: 'inputFactorF5', label: '输入系数 f5', group: '计算链条参数', type: 'number', default: 1.2, step: 'any', hint: '1.05~1.2，压轴力系数' }
    ],

    compute: function (v) {
      var P = num(v.power), n1 = num(v.n1);
      if (P === null || n1 === null) return { error: '请输入传动功率 P 与主动轴转速 n1' };
      if (!(P > 0) || P > 1000) return { error: '请输入0-1000之间的数（传动功率 P）' };
      if (!(n1 > 0) || n1 > 5000) return { error: '请输入0-5000之间的数（主动轴转速 n1）' };

      var n2in = num(v.n2);
      if (n2in !== null && (!(n2in > 0) || n2in > 5000)) return { error: '请输入0-5000之间的数（从动轴转速 n2）' };
      var i = n2in !== null ? n1 / n2in : num(v.transmissionRatio);
      if (i === null || !(i > 0)) return { error: '请输入传动比 i 或从动轴转速 n2' };
      if (i > 10) return { error: '请输入0-10之间的数（传动比 i）' };
      var n2 = n1 / i;

      var z1 = num(v.z1);
      if (z1 === null || z1 < 17 || z1 > 120 || z1 !== Math.round(z1)) return { error: '请输入17-120之间的数（小链轮齿数 z1）' };
      var z2 = num(v.z2);
      z2 = z2 === null ? Math.round(z1 * i) : Math.round(z2);
      if (z2 < 17 || z2 > 120) return { error: 'z2须为17-120之间的数' };

      var f1row = F1[v.drivenMachine];
      var f1 = f1row ? f1row[v.drivingMachine] : undefined;
      if (f1 === undefined) return { error: '请选择主动机工况与从动机工况' };
      var km = KM[v.chainNumber];
      if (km === undefined) return { error: '请选择链的排数' };
      var f2 = num(v.f2);
      if (f2 === null) f2 = +Math.pow(19 / z1, 1.08).toFixed(2); /* 原站字段按 2 位小数填入 */
      if (!(f2 > 0) || f2 > 3) return { error: '请输入0-3之间的数（系数 f2）' };

      var Pc = f1 * f2 * P / km;                         /* 设计功率 kW */

      var p = PITCH[v.chainSize];
      if (p === undefined) return { error: '请选择链号' };
      var a0min = i < 4 ? 0.2 * z1 * (i + 1) : 0.33 * z1 * (i - 1);  /* 最小中心距（节） */
      var a0mm = num(v.a0length);
      var a0 = a0mm !== null ? a0mm / p : num(v.a0);
      if (a0 === null) a0 = a0min;
      if (!(a0 > 0)) return { error: '请输入0-1000000之间的数（中心距 a0）' };

      /* 链长节数（a0 以节数计），X 向上圆整为偶数（避免过渡链节） */
      var X0 = 2 * a0 + (z1 + z2) / 2 + Math.pow(z2 - z1, 2) / (4 * Math.PI * Math.PI * a0);
      var X = Math.ceil(X0);
      if (X % 2) X += 1;
      var L = X * p / 1000;                              /* 链条长度 m */

      var vs = z2 * n2 * p / 60000;                      /* 链速 m/s（= z1·n1·p/60000） */
      if (!(vs > 0)) return { error: '链速计算异常，请检查输入参数' };

      /* 理论中心距（最大中心距）与实际中心距 */
      var half = X - (z1 + z2) / 2;
      var D = half * half - 8 * Math.pow((z2 - z1) / (2 * Math.PI), 2);
      if (D < 0) return { error: '中心距 a0 过小，链长无法闭合，请增大中心距 a0' };

      var dA = num(v.deltaA);
      if (dA === null || dA < 0.002 || dA > 0.004) return { error: '请输入0.002-0.004之间的数（Δa）' };
      var f5 = num(v.inputFactorF5);
      if (f5 === null || f5 < 1.05 || f5 > 1.2) return { error: '请输入1.05-1.2之间的数（系数 f5）' };

      var a = p / 4 * (half + Math.sqrt(D));             /* 理论中心距 mm */
      var aAct = a * (1 - dA);                           /* 实际中心距 mm */
      var alpha1 = 180 - 57.3 * (z2 - z1) / (Math.PI * (a / p));  /* 小链轮包角 ° */
      var F = 1000 * P / vs;                             /* 有效圆周力 N */
      var FQ = f5 * f1 * F;                              /* 作用于轴上的拉力 N */

      var warns = [];
      if (a0 < a0min) warns.push('中心距 a0=' + fmt(a0, 2) + 'p 小于最小中心距 a0min=' + fmt(a0min, 2) + 'p');
      if (alpha1 < 120) warns.push('小链轮包角 α1=' + fmt(alpha1, 2) + '° < 120°，应增大中心距或设张紧轮');

      return {
        sections: [
          { title: '传动参数', rows: [
            { label: '传动比 i = n1/n2', value: i, d: 3, hl: true },
            { label: '从动轴转速 n2 = n1/i', value: n2, unit: 'r/min', d: 3 }
          ] },
          { title: '链轮齿数及设计功率', rows: [
            { label: '小链轮齿数 z1', value: z1, d: 0 },
            { label: '大链轮齿数 z2（=z1·i 圆整）', value: z2, d: 0, hl: true },
            { label: '工况系数 f1（主/从动机工况查表）', value: f1, d: 2 },
            { label: '主动链轮齿数系数 f2', value: f2, d: 2 },
            { label: '多排链排数系数 km', value: km, d: 2 },
            { label: '设计功率 Pc = f1·f2·P/km', value: Pc, unit: 'kW', d: 2, hl: true },
            { label: '选链号依据（查额定功率图）', html: 'Pc=' + fmt(Pc, 2) + ' kW，n1=' + n1 + ' r/min' }
          ] },
          { title: '链条节距及初定中心距', rows: [
            { label: '链号', value: v.chainSize, hl: true },
            { label: '链条节距 p', value: p, unit: 'mm', hl: true },
            { label: '最小中心距 a0min', value: a0min, unit: 'p', d: 2 },
            { label: '初定中心距 a0', value: a0, unit: 'p', d: 2, hl: true },
            { label: '中心距 a0（换算毫米）', value: a0 * p, unit: 'mm', d: 2 }
          ] },
          { title: '链长与链速', rows: [
            { label: '链长节数 X0', value: X0, d: 2, hl: true },
            { label: '实际链长节数 X（向上取偶数）', value: X, d: 0, hl: true },
            { label: '链条长度 L = X·p', value: L, unit: 'm', d: 3 },
            { label: '链速 v = z2·n2·p/60000', value: vs, unit: 'm/s', d: 2, hl: true }
          ] },
          { title: '链轮中心距与小链轮包角', rows: [
            { label: '理论中心距 a', value: a, unit: 'mm', d: 2, hl: true },
            { label: '实际中心距 a·(1−Δa)', value: aAct, unit: 'mm', d: 2, hl: true },
            { label: '中心距调整量 Δa', value: dA, d: 3 },
            { label: '小链轮包角 α1', value: alpha1, unit: '°', d: 2, hl: true }
          ] },
          { title: '圆周力及轴上拉力', rows: [
            { label: '有效圆周力 F = 1000P/v', value: F, unit: 'N', d: 2, hl: true },
            { label: '输入系数 f5', value: f5, d: 2 },
            { label: '作用于轴上的拉力 FQ = f5·f1·F', value: FQ, unit: 'N', d: 2, hl: true }
          ] }
        ],
        verdict: {
          level: warns.length ? 'warn' : 'ok',
          text: warns.length ? warns.join('；')
            : '链号 ' + v.chainSize + '（p=' + p + 'mm）：链长 X=' + X + ' 节，实际中心距 ' + fmt(aAct, 2) + 'mm，链速 ' + fmt(vs, 2) + 'm/s，压轴力 FQ=' + fmt(FQ, 2) + 'N',
          note: '润滑方式按链号与链速由 GB/T 18150 润滑方式图选取：1 用油壶或油刷定期人工润滑；2 滴油润滑；3 油池润滑或油盘飞溅润滑；4 油泵压力供油润滑（带过滤器）。'
        },
        notes: [
          '链号需按设计功率 Pc 与小链轮转速 n1 由滚子链额定功率图表（GB/T 18150-2006，A 系列/B 系列）选定，选定后节距 p 按本工具内嵌链号表自动带出。',
          '工况系数 f1 由主动/从动机械特性查 GB/T 18150-2000 表（运转平稳/轻微冲击/中等冲击组合，1~2.1）；齿数系数 f2=(19/z1)^1.08；多排链排数系数 km：单排 1、双排 1.75、三排 2.5。',
          'z1 应为 17~120，优先选用数列 17、19、21、23、25、38、57、76、95、114；z2 = z1·i 并圆整（i=z2/z1=n1/n2）。',
          '初定中心距推荐 a0=(30~50)p，脉动载荷无张紧装置时 a0<25p；最小中心距 a0min=0.2·z1·(i+1)p（i<4）或 0.33·z1·(i−1)p（i≥4）。',
          '链长节数 X0 计算值向上圆整为偶数 X，以避免使用过渡链节；链条长度 L=X·p。',
          '为保证链条松边合理下垂，实际中心距取 a·(1−Δa)，Δa=0.002~0.004；作用于轴上的拉力 FQ=f5·f1·F，f5=1.05~1.2。'
        ]
      };
    },

    formulas: [
      'Pc = f1·f2·P / km；f2 = (19/z1)^1.08；km：单排 1、双排 1.75、三排 2.5',
      'a0min = 0.2·z1·(i+1)（i<4）或 a0min = 0.33·z1·(i−1)（i≥4），单位：节 p',
      'X0 = 2a0 + (z1+z2)/2 + (z2−z1)²/(4π²·a0)；X 为 X0 向上圆整的偶数；L = X·p/1000',
      'v = z1·n1·p/60000 = z2·n2·p/60000（m/s）',
      'a = p/4·[(X−(z1+z2)/2) + √((X−(z1+z2)/2)² − 8·((z2−z1)/(2π))²)]；实际中心距 = a·(1−Δa)',
      'α1 = 180° − 57.3·(z2−z1)/(π·a/p)',
      'F = 1000·P/v；FQ = f5·f1·F'
    ],
    reference: 'GB/T 18150-2000（2006确认）《滚子链传动选择指导》（工况系数 f1 表、额定功率图表、润滑方式选用）；GB/T 1243 传动用短节距精密滚子链（链号与节距系列）。1:1 复刻自 mechtool.cn 滚子链传动设计计算：https://www.mechtool.cn/calculation/calculation_chaindrive.html'
  });
})();
