/* =========================================================
 * 工程常用类工具
 * 1. 公差与配合查询（GB/T 1800）
 * 2. 硬度换算（GB/T 1172 近似）
 * 3. 钢材重量计算
 * 4. 转动惯量计算
 * ========================================================= */
(function () {
  'use strict';
  var fmt = App.fmt;

  /* =====================================================
   * 1. 公差与配合查询（GB/T 1800.1-2009 常用值）
   * 尺寸段（≤3,>3~6,...,>400~500）共 13 段
   * ===================================================== */
  var SEG_NAMES = ['≤3', '>3~6', '>6~10', '>10~18', '>18~30', '>30~50', '>50~80', '>80~120', '>120~180', '>180~250', '>250~315', '>315~400', '>400~500'];
  var SEG_MAX = [3, 6, 10, 18, 30, 50, 80, 120, 180, 250, 315, 400, 500];
  // 标准公差 IT（μm）
  var IT = {
    5: [4, 5, 6, 8, 9, 11, 13, 15, 18, 20, 23, 25, 27],
    6: [6, 8, 9, 11, 13, 16, 19, 22, 25, 29, 32, 36, 40],
    7: [10, 12, 15, 18, 21, 25, 30, 35, 40, 46, 52, 57, 63],
    8: [14, 18, 22, 27, 33, 39, 46, 54, 63, 72, 81, 89, 97],
    9: [25, 30, 36, 43, 52, 62, 74, 87, 100, 115, 130, 140, 155],
    10: [40, 48, 58, 70, 84, 100, 120, 140, 160, 185, 210, 230, 250],
    11: [60, 75, 90, 110, 130, 160, 190, 220, 250, 290, 320, 360, 400],
    12: [100, 120, 150, 180, 210, 250, 300, 350, 400, 460, 520, 570, 630]
  };
  // 轴基本偏差（μm）：a~h 为上偏差 es（负值），k~s 为下偏差 ei（正值）
  var SHAFT = {
    c: [-60, -70, -80, -95, -110, -130, -155, -180, -200, -230, -260, -290, -330],
    d: [-20, -30, -40, -50, -65, -80, -100, -120, -145, -170, -190, -210, -230],
    e: [-14, -20, -25, -32, -40, -50, -60, -72, -85, -100, -110, -125, -135],
    f: [-6, -10, -13, -16, -20, -25, -30, -36, -43, -50, -56, -62, -68],
    g: [-2, -4, -5, -6, -7, -9, -10, -12, -14, -15, -17, -18, -20],
    h: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    k: [0, 1, 1, 1, 2, 2, 2, 3, 3, 4, 4, 4, 5],
    m: [2, 4, 6, 7, 8, 9, 11, 13, 15, 17, 20, 21, 23],
    n: [4, 8, 10, 12, 15, 17, 20, 23, 27, 31, 34, 37, 40],
    p: [6, 12, 15, 18, 22, 26, 32, 37, 43, 50, 56, 62, 68],
    r: [10, 13, 15, 19, 28, 34, 42, 52, 65, 80, 96, 111, 129],
    s: [14, 19, 23, 28, 35, 43, 56, 75, 100, 140, 174, 211, 263]
  };
  // 孔基本偏差（μm）：F~H 为下偏差 EI（正值），K~S 为上偏差 ES（特殊规则计算）
  var HOLE = {
    E: [14, 20, 25, 32, 40, 50, 60, 72, 85, 100, 110, 125, 135],
    F: [6, 10, 13, 16, 20, 25, 30, 36, 43, 50, 56, 62, 68],
    G: [2, 4, 5, 6, 7, 9, 10, 12, 14, 15, 17, 18, 20],
    H: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  };
  function segIdx(d) {
    for (var i = 0; i < SEG_MAX.length; i++) if (d <= SEG_MAX[i]) return i;
    return SEG_MAX.length - 1;
  }
  function devStr(um) {
    var v = um / 1000;
    return (v >= 0 ? '+' : '') + fmt(v, 3);
  }
  /* 计算轴上/下偏差 */
  function shaftDev(letter, grade, idx) {
    var it = IT[grade][idx], base = SHAFT[letter][idx];
    var lower = letter <= 'h'; // a~h：es=base, ei=es-it；k~s：ei=base, es=ei+it
    if (lower) return { es: base, ei: base - it };
    return { ei: base, es: base + it };
  }
  /* 计算孔上/下偏差 */
  function holeDev(letter, grade, idx) {
    var it = IT[grade][idx];
    if (letter >= 'A' && letter <= 'H') {
      var ei = HOLE[letter] ? HOLE[letter][idx] : 0;
      return { EI: ei, ES: ei + it };
    }
    // K~S 特殊规则（7级孔）：ES = -ei(同名轴) + Δ，Δ = IT7 - IT6
    var eiShaft = SHAFT[letter.toLowerCase()][idx];
    var delta = IT[grade][idx] - IT[grade - 1][idx];
    var ES = -eiShaft + delta;
    return { ES: ES, EI: ES - it };
  }

  /* 常用配合选项：基孔制 H7/轴 与 基轴制 孔/h6 */
  var FITS = {
    hb: [
      { v: 'H7/g6', t: 'H7/g6 间隙（小，精密滑动）' },
      { v: 'H7/f7', t: 'H7/f7 间隙（中等，一般转动）' },
      { v: 'H7/e7', t: 'H7/e7 间隙（较大，高速转动）' },
      { v: 'H7/d8', t: 'H7/d8 间隙（大，松转动）' },
      { v: 'H7/h6', t: 'H7/h6 间隙（极小，定位配合）' },
      { v: 'H7/k6', t: 'H7/k6 过渡（精密定位）' },
      { v: 'H7/n6', t: 'H7/n6 过渡（更紧定位）' },
      { v: 'H7/p6', t: 'H7/p6 过盈（轻压入，定位）' },
      { v: 'H7/r6', t: 'H7/r6 过盈（中压入，半永久）' },
      { v: 'H7/s6', t: 'H7/s6 过盈（压入，永久装配）' }
    ],
    hs: [
      { v: 'G7/h6', t: 'G7/h6 间隙（小，精密滑动）' },
      { v: 'F7/h6', t: 'F7/h6 间隙（中等转动）' },
      { v: 'E8/h6', t: 'E8/h6 间隙（较大转动）' },
      { v: 'H7/h6', t: 'H7/h6 间隙（极小，定位）' },
      { v: 'K7/h6', t: 'K7/h6 过渡（精密定位）' },
      { v: 'N7/h6', t: 'N7/h6 过渡（更紧定位）' },
      { v: 'P7/h6', t: 'P7/h6 过盈（轻压入）' },
      { v: 'R7/h6', t: 'R7/h6 过盈（中压入）' },
      { v: 'S7/h6', t: 'S7/h6 过盈（压入，永久）' }
    ]
  };

  App.registerTool({
    id: 'tolerance-fit',
    name: '公差与配合查询',
    category: 'common',
    keywords: '公差 配合 偏差 基孔制 基轴制 间隙 过盈 极限尺寸',
    brief: '按 GB/T 1800 查询孔、轴上下偏差与配合性质（间隙/过盈），支持基孔制与基轴制常用配合。',
    doc: '输入基本尺寸并选择配合代号，按 GB/T 1800.1-2009 计算孔、轴的<b>上下偏差与极限尺寸</b>，并判定配合性质（间隙/过渡/过盈）及最大、最小间隙（过盈）。含基孔制（H7 系列）与基轴制（h6 系列）常用配合。',
    inputs: [
      { key: 'D', label: '基本尺寸 D', group: '查询条件', type: 'number', unit: 'mm', default: 40, step: 'any', hint: '范围 ≤500mm（常用尺寸段）' },
      { key: 'basis', label: '基准制', group: '查询条件', type: 'segment', options: [
        { v: 'hb', t: '基孔制（H7 孔）' }, { v: 'hs', t: '基轴制（h6 轴）' }
      ] },
      { key: 'fit', label: '配合代号（基孔制 H7 系列）', group: '查询条件', type: 'select', options: FITS.hb, default: 'H7/k6' },
      { key: 'fit2', label: '配合代号（基轴制 h6 系列）', group: '查询条件', type: 'select', options: FITS.hs, default: 'H7/h6' }
    ],
    compute: function (v) {
      var D = +v.D;
      if (!(D > 0 && D <= 500)) return { error: '基本尺寸应在 1~500mm 范围内（本工具数据段）' };
      var idx = segIdx(D);
      var segName = SEG_NAMES[idx];
      // 按基准制显式选择配合代号
      var fitStr = v.basis === 'hs' ? (v.fit2 || 'H7/h6') : (v.fit || 'H7/k6');
      var fit = fitStr.split('/');
      var holePart = fit[0], shaftPart = fit[1];
      var holeLetter = holePart[0], holeGrade = +holePart.slice(1);
      var shaftLetter = shaftPart[0], shaftGrade = +shaftPart.slice(1);

      var hole = holeDev(holeLetter, holeGrade, idx);
      var shaft = shaftDev(shaftLetter.toLowerCase(), shaftGrade, idx);
      var holeMax = D + hole.ES / 1000, holeMin = D + hole.EI / 1000;
      var shaftMax = D + shaft.es / 1000, shaftMin = D + shaft.ei / 1000;
      var Xmax = hole.ES - shaft.ei;   // 最大间隙 μm
      var Ymax = shaft.es - hole.EI;   // 最大过盈 μm
      var fitType, Xmin, detail = '';
      if (Xmax >= 0 && Ymax <= 0) {
        fitType = '间隙配合';
        Xmin = hole.EI - shaft.es;
        detail = 'Xmax=' + Xmax + 'μm, Xmin=' + Xmin + 'μm';
      } else if (Xmax <= 0 && Ymax >= 0) {
        fitType = '过盈配合';
        detail = 'Ymax=' + Ymax + 'μm, Ymin=' + (-Xmax) + 'μm';
      } else {
        fitType = '过渡配合';
        detail = 'Xmax=' + Xmax + 'μm, Ymax=' + Ymax + 'μm';
      }
      return {
        sections: [
          { title: '尺寸段信息', rows: [
            { label: '所属尺寸段', value: segName, unit: 'mm' },
            { label: '孔公差 IT' + holeGrade, value: IT[holeGrade][idx], unit: 'μm' },
            { label: '轴公差 IT' + shaftGrade, value: IT[shaftGrade][idx], unit: 'μm' }
          ] },
          { title: '孔（' + holePart + '）', rows: [
            { label: '上偏差 ES', value: devStr(hole.ES), unit: 'mm', hl: true },
            { label: '下偏差 EI', value: devStr(hole.EI), unit: 'mm' },
            { label: '最大极限尺寸', value: holeMax, unit: 'mm', d: 3 },
            { label: '最小极限尺寸', value: holeMin, unit: 'mm', d: 3 }
          ] },
          { title: '轴（' + shaftPart + '）', rows: [
            { label: '上偏差 es', value: devStr(shaft.es), unit: 'mm', hl: true },
            { label: '下偏差 ei', value: devStr(shaft.ei), unit: 'mm' },
            { label: '最大极限尺寸', value: shaftMax, unit: 'mm', d: 3 },
            { label: '最小极限尺寸', value: shaftMin, unit: 'mm', d: 3 }
          ] },
          { title: '配合性质', rows: [
            { label: '配合类型', value: fitType, hl: true },
            { label: '最大间隙 Xmax', value: Xmax / 1000, unit: 'mm', d: 3 },
            { label: '最大过盈 Ymax', value: Ymax / 1000, unit: 'mm', d: 3 },
            { label: '配合公差 Tf', value: (IT[holeGrade][idx] + IT[shaftGrade][idx]) / 1000, unit: 'mm', d: 3 }
          ] }
        ],
        verdict: {
          level: 'ok',
          text: 'φ' + fmt(D) + ' ' + holePart + '/' + shaftPart + ' 为' + fitType + '：' + detail.replace(/μm/g, ' μm'),
          note: '孔（' + devStr(hole.EI) + '~' + devStr(hole.ES) + '），轴（' + devStr(shaft.ei) + '~' + devStr(shaft.es) + '）'
        },
        notes: [
          '数据按 GB/T 1800.1-2009《产品几何技术规范(GPS) 线性尺寸公差ISO代号体系》常用值。',
          '孔 K~S 段按特殊规则换算：ES = -ei(同名轴偏差) + Δ，Δ = IT7 - IT6（7 级孔）。',
          '过盈量较大（>0.001D）的压入配合装配时需校核装配应力，请参考 GB/T 5371。'
        ]
      };
    },
    formulas: [
      '孔：A~H 段 EI=基本偏差，ES=EI+IT；K~ZC 段（≤IT8）ES=-ei+Δ',
      '轴：a~h 段 es=基本偏差，ei=es-IT；k~zc 段 ei=基本偏差，es=ei+IT',
      'Xmax=ES-ei；Ymax=es-EI；Tf=IT孔+IT轴'
    ],
    reference: 'GB/T 1800.1-2009、GB/T 1800.2-2021《线性尺寸公差》；《机械设计手册》极限与配合篇。'
  });

  /* =====================================================
   * 2. 硬度换算（GB/T 1172 近似表）
   * ===================================================== */
  var HARD_HRC = [
    [20, 238, 226], [22, 253, 240], [25, 266, 253], [28, 281, 269], [30, 296, 286],
    [32, 312, 301], [35, 331, 325], [38, 353, 348], [40, 372, 371], [42, 396, 392],
    [45, 446, 432], [48, 480, 460], [50, 513, 481], [52, 548, 512], [55, 595, 543],
    [58, 654, 600], [60, 697, 653], [62, 766, 710], [65, 856, 790], [68, 940, 872]
  ]; // [HRC, HV, HBW]
  var HARD_HRB = [
    [60, 105, 107], [65, 114, 116], [70, 125, 128], [75, 137, 140], [80, 150, 150],
    [85, 167, 167], [90, 187, 185], [95, 210, 210], [100, 233, 240]
  ]; // [HRB, HV, HBW]
  function interpT(tab, x, col, colX) {
    var n = tab.length;
    if (x <= tab[0][colX]) return tab[0][col];
    if (x >= tab[n - 1][colX]) return tab[n - 1][col];
    for (var i = 0; i < n - 1; i++) {
      var a = tab[i], b = tab[i + 1];
      if (x >= a[colX] && x <= b[colX]) return a[col] + (x - a[colX]) / (b[colX] - a[colX]) * (b[col] - a[col]);
    }
    return tab[n - 1][col];
  }
  App.registerTool({
    id: 'hardness-convert',
    name: '硬度换算工具',
    category: 'common',
    keywords: '硬度 洛氏 布氏 维氏 HRC HRB HV HB 换算表',
    brief: 'HRC/HRB 洛氏、HV 维氏、HBW 布氏硬度相互近似换算（GB/T 1172）。',
    doc: '输入任一硬度值，换算其他标尺。换算关系按 GB/T 1172《黑色金属硬度及强度换算值》常用段线性插值，属<b>近似值</b>——不同材料组织状态下换算存在差异，仲裁检验应以相应硬度试验法实测为准。',
    inputs: [
      { key: 'scale', label: '输入硬度标尺', group: '换算', type: 'segment', options: [
        { v: 'HRC', t: 'HRC' }, { v: 'HRB', t: 'HRB' }, { v: 'HV', t: 'HV' }, { v: 'HBW', t: 'HBW' }
      ] },
      { key: 'val', label: '硬度值', group: '换算', type: 'number', default: 45, step: 'any', hint: 'HRC 20~68 / HRB 60~100 / HV 105~940 / HBW 107~872' }
    ],
    compute: function (v) {
      var val = +v.val;
      if (!(val > 0)) return { error: '请输入硬度值' };
      var hrc, hrb, hv, hbw, range;
      if (v.scale === 'HRC') {
        if (val < 20 || val > 68) return { error: 'HRC 换算范围 20~68' };
        hrc = val; hv = interpT(HARD_HRC, val, 1, 0); hbw = interpT(HARD_HRC, val, 2, 0);
        hrb = hv >= 240 ? null : interpT(HARD_HRB, hv, 0, 1);
        range = 'HRC ' + fmt(hrc);
      } else if (v.scale === 'HRB') {
        if (val < 60 || val > 100) return { error: 'HRB 换算范围 60~100' };
        hrb = val; hv = interpT(HARD_HRB, val, 1, 0); hbw = interpT(HARD_HRB, val, 2, 0);
        hrc = hv >= 238 ? interpT(HARD_HRC, hv, 0, 1) : null;
        range = 'HRB ' + fmt(hrb);
      } else if (v.scale === 'HV') {
        if (val < 105 || val > 940) return { error: 'HV 换算范围 105~940' };
        hv = val;
        hrc = hv >= 238 ? interpT(HARD_HRC, hv, 0, 1) : null;
        hrb = hv <= 233 ? interpT(HARD_HRB, hv, 0, 1) : null;
        hbw = interpT(HARD_HRC, hv, 2, 1);
        if (hbw < 107) hbw = interpT(HARD_HRB, hv, 2, 1);
        range = 'HV ' + fmt(hv);
      } else {
        if (val < 107 || val > 872) return { error: 'HBW 换算范围 107~872' };
        hbw = val;
        hrc = hbw >= 226 ? interpT(HARD_HRC, hbw, 0, 2) : null;
        hv = hbw >= 226 ? interpT(HARD_HRC, hbw, 1, 2) : interpT(HARD_HRB, hbw, 1, 2);
        hrb = hbw <= 240 ? interpT(HARD_HRB, hbw, 0, 2) : null;
        range = 'HBW ' + fmt(hbw);
      }
      return {
        sections: [
          { title: '换算结果（输入 ' + range + '）', rows: [
            { label: '洛氏硬度 HRC', html: hrc ? fmt(hrc, 1) : '超出换算范围', hl: true },
            { label: '洛氏硬度 HRB', html: hrb ? fmt(hrb, 1) : '超出换算范围', hl: true },
            { label: '维氏硬度 HV', html: hv ? fmt(hv, 0) : '--', hl: true },
            { label: '布氏硬度 HBW', html: hbw ? fmt(hbw, 0) : '超出换算范围', hl: true }
          ] }
        ],
        verdict: {
          level: 'warn',
          text: '换算值为近似值，材料组织差异可带来 ±(1~3) 单位偏差，仲裁以实测为准'
        },
        notes: [
          'HRC 适用淬火钢等硬材料（20~68），HRB 适用退火钢、铜合金等较软材料（60~100）。',
          'HBW 为硬质合金压头布氏硬度（旧符号 HB 的现行标示）。',
          '低碳钢近似抗拉强度：σb≈3.6×HBW（MPa），仅作数量级参考。'
        ]
      };
    },
    formulas: [
      '换算依据 GB/T 1172《黑色金属硬度及强度换算值》常用段线性插值',
      'σb ≈ 3.6·HBW（MPa，碳钢近似）'
    ],
    reference: 'GB/T 1172-1999《黑色金属硬度及强度换算值》、GB/T 231.1 布氏硬度试验。'
  });

  /* =====================================================
   * 3. 钢材重量计算
   * ===================================================== */
  var DENSITY = [
    { v: '7.85', t: '碳钢 / 低合金钢（7.85 g/cm³）' },
    { v: '7.93', t: '不锈钢 304（7.93）' },
    { v: '7.98', t: '不锈钢 316（7.98）' },
    { v: '8.9', t: '紫铜（8.9）' },
    { v: '8.4', t: '黄铜（8.4~8.5）' },
    { v: '2.7', t: '铝（2.7）' },
    { v: '4.5', t: '钛（4.5）' }
  ];
  App.registerTool({
    id: 'steel-weight',
    name: '钢材重量计算',
    category: 'common',
   keywords: '钢材 重量 圆钢 钢板 钢管 方钢 六角钢 角钢 理论重量',
    brief: '按截面形状与尺寸计算圆钢、钢板、钢管、方钢、六角钢、角钢的理论重量。',
    doc: '由截面面积×长度×密度计算<b>理论重量</b>。型材截面取理论（无圆角）近似值，与国标理论重量表可能有 1%~3% 差异，结算交货重量以标准理论重量表为准。',
    inputs: [
      { key: 'shape', label: '截面形状', group: '材料参数', type: 'select', options: [
        { v: 'bar', t: '圆钢 / 棒料' }, { v: 'plate', t: '钢板 / 扁钢' },
        { v: 'pipe', t: '圆管（无缝/焊管）' }, { v: 'square', t: '方钢 / 方管' },
        { v: 'hex', t: '六角钢' }, { v: 'angle', t: '等边角钢（近似）' }
      ], default: 'bar' },
      { key: 'p1', label: '主要尺寸 1', group: '材料参数', type: 'number', unit: 'mm', default: 50, step: 'any' },
      { key: 'p2', label: '主要尺寸 2', group: '材料参数', type: 'number', unit: 'mm', default: 0, step: 'any', hint: '圆钢/六角钢/角钢可填 0（不用）' },
      { key: 'p3', label: '主要尺寸 3', group: '材料参数', type: 'number', unit: 'mm', default: 0, step: 'any', hint: '方管的内宽（仅方管用）' },
      { key: 'L', label: '长度 L', group: '材料参数', type: 'number', unit: 'm', default: 6, step: 'any' },
      { key: 'rho', label: '材料密度', group: '材料参数', type: 'select', options: DENSITY, default: '7.85' },
      { key: 'qty', label: '数量', group: '材料参数', type: 'number', default: 1, step: 'any' }
    ],
    compute: function (v) {
      var p1 = +v.p1, p2 = +v.p2, p3 = +v.p3, L = +v.L, rho = +v.rho, qty = Math.max(1, Math.round(+v.qty || 1));
      if (!(L > 0) || !(p1 > 0)) return { error: '请输入有效尺寸与长度' };
      var A = 0, name = '', dimDesc = '';
      switch (v.shape) {
        case 'bar':
          A = Math.PI * p1 * p1 / 4; name = '圆钢 φ' + fmt(p1); break;
        case 'plate':
          if (!(p2 > 0)) return { error: '钢板需要厚度（尺寸1）×宽度（尺寸2）' };
          A = p1 * p2; name = '钢板 ' + fmt(p1) + '×' + fmt(p2); break;
        case 'pipe':
          if (!(p2 > 0) || p2 >= p1) return { error: '圆管需外径（尺寸1）＞内径（尺寸2）' };
          A = Math.PI * (p1 * p1 - p2 * p2) / 4; name = '圆管 φ' + fmt(p1) + '×' + fmt(p2); break;
        case 'square':
          if (p3 > 0) {
            if (p3 >= p1) return { error: '方管外宽（尺寸1）需＞内宽（尺寸3）' };
            A = p1 * p1 - p3 * p3; name = '方管 ' + fmt(p1) + '×' + fmt(p3); // 壁厚按对边计
          } else { A = p1 * p1; name = '方钢 ' + fmt(p1) + '×' + fmt(p1); }
          break;
        case 'hex':
          A = 2.598 * p1 * p1; // (3√3/2)·S²，S 为对边距离
          name = '六角钢 对边' + fmt(p1); break;
        case 'angle':
          if (!(p2 > 0)) return { error: '等边角钢需要边宽（尺寸1）与厚度（尺寸2）' };
          A = (2 * p1 - p2) * p2; // 近似理论面积（忽略圆角）
          name = '角钢 ' + fmt(p1) + '×' + fmt(p1) + '×' + fmt(p2); break;
      }
      var wPerM = A * rho / 1000; // 每米重量：A(mm²)×ρ(g/cm³)/1000 = kg/m
      var total = wPerM * L * qty;
      return {
        sections: [
          { title: '截面参数', rows: [
            { label: '截面形状', value: name },
            { label: '截面积 A', value: A, unit: 'mm²', d: 1, hl: true },
            { label: '密度 ρ', value: rho, unit: 'g/cm³', d: 2 }
          ] },
          { title: '重量结果', rows: [
            { label: '每米理论重量', value: wPerM, unit: 'kg/m', d: 3, hl: true },
            { label: '单件重量', value: wPerM * L, unit: 'kg', d: 2, hl: true },
            { label: '总重量（' + qty + ' 件）', value: total, unit: 'kg', d: 2, hl: true },
            { label: '总重量', value: total / 1000, unit: 't', d: 4 }
          ] }
        ],
        verdict: { level: 'ok', text: name + ' × ' + fmt(L) + ' m：单件 ' + fmt(wPerM * L, 2) + ' kg，共 ' + fmt(total, 2) + ' kg' },
        notes: [
          '理论重量 = 截面积(mm²) × 长度(m) × 密度(g/cm³) / 1000。',
          '角钢、方管为无圆角理论截面近似；工字钢/H型钢/槽钢请直接查 GB/T 理论重量表。',
          '不锈钢、铜、铝等密度不同，注意选择材料。'
        ]
      };
    },
    formulas: [
      '圆钢 A=πd²/4；钢板 A=t·b；圆管 A=π(D²-d²)/4',
      '方钢 A=a²；六角 A≈2.598S²（S 对边距）；角钢 A≈(2b-t)t',
      'W = A·L·ρ/1000（kg）'
    ],
    reference: 'GB/T 702 热轧圆钢和方钢尺寸、GB/T 9787 热轧等边角钢；各型材理论重量表。'
  });

  /* =====================================================
   * 4. 转动惯量计算
   * ===================================================== */
  var INERTIA_DENS = DENSITY;
  App.registerTool({
    id: 'moment-inertia',
    name: '转动惯量计算',
    category: 'common',
    keywords: '转动惯量 飞轮矩 回转半径 圆柱 圆盘 转矩 惯量 折算',
    brief: '常用几何体绕指定轴的转动惯量、飞轮矩 GD² 与回转半径计算，支持质量或尺寸输入。',
    doc: '计算实心/空心圆柱（盘）、矩形块、细长杆等常用构件绕参考轴的<b>转动惯量 J</b>、<b>飞轮矩 GD²</b> 与<b>回转半径</b>，输入方式可选“按质量”或“按尺寸+密度”。电机选型时按 J折算=J负载/i² 将负载惯量折算到电机轴。',
    inputs: [
      { key: 'shape', label: '构件形状', group: '构件参数', type: 'select', options: [
        { v: 'solid', t: '实心圆柱 / 圆盘（绕轴线）' },
        { v: 'hollow', t: '空心圆柱（绕轴线）' },
        { v: 'rect', t: '矩形块（绕垂直中心轴）' },
        { v: 'rodC', t: '细长杆（绕中心，垂直杆）' },
        { v: 'rodE', t: '细长杆（绕端部，垂直杆）' }
      ], default: 'solid' },
      { key: 'mode', label: '输入方式', group: '构件参数', type: 'segment', options: [
        { v: 'mass', t: '按质量' }, { v: 'dim', t: '按尺寸+密度' }
      ] },
      { key: 'm', label: '质量 m', group: '构件参数', type: 'number', unit: 'kg', default: 10, step: 'any', hint: '按质量输入时使用' },
      { key: 'D', label: '外径 D', group: '尺寸（按尺寸输入）', type: 'number', unit: 'mm', default: 100, step: 'any' },
      { key: 'd', label: '内径 d（空心用）', group: '尺寸（按尺寸输入）', type: 'number', unit: 'mm', default: 50, step: 'any' },
      { key: 'Lb', label: '长度 L（圆柱/杆）', group: '尺寸（按尺寸输入）', type: 'number', unit: 'mm', default: 200, step: 'any' },
      { key: 'a', label: '矩形宽 a', group: '尺寸（按尺寸输入）', type: 'number', unit: 'mm', default: 100, step: 'any' },
      { key: 'b', label: '矩形高 b', group: '尺寸（按尺寸输入）', type: 'number', unit: 'mm', default: 50, step: 'any' },
      { key: 'rho', label: '材料密度', group: '尺寸（按尺寸输入）', type: 'select', options: INERTIA_DENS, default: '7.85' }
    ],
    compute: function (v) {
      var g = 9.81;
      var J = null, m = null, shapeName = '';
      var massCalc;
      if (v.mode === 'mass') {
        m = +v.m;
        if (!(m > 0)) return { error: '请输入质量' };
        var D = +v.D, d = +v.d, a = +v.a, b = +v.b, Lb = +v.Lb;
        switch (v.shape) {
          case 'solid': J = m * D * D / 8 / 1e6; shapeName = '实心圆柱/圆盘（质量输入）'; break;    // mm²→m²
          case 'hollow':
            if (!(D > d)) return { error: '空心圆柱需 D＞d' };
            J = m * (D * D + d * d) / 8 / 1e6; shapeName = '空心圆柱（质量输入）'; break;
          case 'rect':
            J = m * (a * a + b * b) / 12 / 1e6; shapeName = '矩形块（质量输入）'; break;
          case 'rodC':
            J = m * Lb * Lb / 12 / 1e6; shapeName = '细长杆绕中心（质量输入）'; break;
          case 'rodE':
            J = m * Lb * Lb / 3 / 1e6; shapeName = '细长杆绕端部（质量输入）'; break;
        }
      } else {
        var D2 = +v.D, d2 = +v.d, a2 = +v.a, b2 = +v.b, L2 = +v.Lb, rho = +v.rho;
        if (!(D2 > 0) || !(L2 > 0)) return { error: '请输入有效尺寸（外径与长度）' };
        var Amm2 = 0, kr = 0; // kr: 回转半径平方(mm²)
        switch (v.shape) {
          case 'solid':
            Amm2 = Math.PI * D2 * D2 / 4; kr = D2 * D2 / 8; shapeName = '实心圆柱/圆盘'; break;
          case 'hollow':
            if (!(D2 > d2)) return { error: '空心圆柱需 D＞d' };
            Amm2 = Math.PI * (D2 * D2 - d2 * d2) / 4; kr = (D2 * D2 + d2 * d2) / 8; shapeName = '空心圆柱'; break;
          case 'rect':
            Amm2 = a2 * b2; kr = (a2 * a2 + b2 * b2) / 12; shapeName = '矩形块'; break;
          case 'rodC':
            Amm2 = Math.PI * D2 * D2 / 4; kr = L2 * L2 / 12; shapeName = '细长杆绕中心'; break;
          case 'rodE':
            Amm2 = Math.PI * D2 * D2 / 4; kr = L2 * L2 / 3; shapeName = '细长杆绕端部'; break;
        }
        // 质量：A(mm²)·L(mm) = mm³ → ×10⁻³ = cm³；×ρ(g/cm³) = g；×10⁻³ = kg
        m = Amm2 * L2 * rho * 1e-6;
        J = m * kr / 1e6;
      }
      var GD2 = 4 * g * J;
      var kRadius = Math.sqrt(J / m);
      return {
        sections: [
          { title: '构件信息', rows: [
            { label: '形状', value: shapeName },
            { label: '输入方式', value: v.mode === 'mass' ? '按质量' : '按尺寸+密度' },
            { label: '质量 m', value: m, unit: 'kg', hl: true }
          ] },
          { title: '惯量结果', rows: [
            { label: '转动惯量 J', value: J, unit: 'kg·m²', d: 5, hl: true },
            { label: 'J', value: J * 1000, unit: '×10⁻³ kg·m²', d: 3 },
            { label: '飞轮矩 GD²', value: GD2, unit: 'N·m²', d: 4, hl: true },
            { label: '回转半径 k=√(J/m)', value: kRadius, unit: 'm', d: 4 }
          ] }
        ],
        verdict: {
          level: 'ok',
          text: 'J = ' + fmt(J * 1000, 3) + ' ×10⁻³ kg·m²，GD² = ' + fmt(GD2, 3) + ' N·m²',
          note: '折算到电机轴：J电机侧 = J/i²（i 为减速比）；伺服惯量匹配建议 J负载/i² / J电机 ≤ 5~10。'
        },
        notes: [
          '实心圆柱绕轴线 J=mD²/8；空心 J=m(D²+d²)/8；矩形块绕中心 J=m(a²+b²)/12。',
          '细长杆：绕中心 J=mL²/12，绕端部 J=mL²/3。',
          '按尺寸输入时细长杆质量按外径圆截面估算，若与实际质量差异大请改用质量输入。',
          '复合体总惯量为各部件绕同一轴惯量之和（必要时用平行轴定理 J=Jc+md²）。'
        ]
      };
    },
    formulas: [
      '实心圆柱 J=mD²/8；空心 J=m(D²+d²)/8',
      '矩形块（绕垂直中心轴）J=m(a²+b²)/12；细长杆 J=mL²/12（中）/mL²/3（端）',
      'GD²=4gJ；折算 J′=J/i²'
    ],
    reference: '《理论力学》惯量矩章节；《机械设计手册》飞轮矩与惯量折算。'
  });
})();
