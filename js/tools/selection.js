/* =========================================================
 * 选型计算类工具
 * 1. 电动机（减速机）选型计算
 * 依据：电机功率等级 GB/T 4826、常用选型方法
 * ========================================================= */
(function () {
  'use strict';
  var fmt = App.fmt;

  /* 三相异步电机常用功率等级 kW（Y2/YE3 系列；国标 Y 系列自 0.55 起，无 3.7 档） */
  var MOTOR_KW = [0.12, 0.18, 0.25, 0.37, 0.55, 0.75, 1.1, 1.5, 2.2, 3, 4, 5.5, 7.5, 11, 15, 18.5, 22, 30, 37, 45, 55, 75, 90, 110, 132, 160, 200, 250];
  /* 电机常用同步转速 r/min */
  var MOTOR_SPEED = [3000, 1500, 1000, 750];

  App.registerTool({
    id: 'motor-select',
    name: '电机（减速机）选型计算',
    category: 'select',
    keywords: '电机 减速机 马达 选型 功率 转矩 转速 安全系数',
    brief: '由负载转矩与转速计算所需电机功率与减速比，圆整到标准电机功率等级。',
    doc: '根据负载转矩 T、负载转速 n、减速比与传动效率，计入安全系数后计算<b>所需电机功率</b>与<b>电机轴转矩</b>，并圆整到标准电机功率等级；同时给出电机侧转速要求与惯量匹配提示（伺服/步进场合）。',
    inputs: [
      { key: 'T', label: '负载转矩 T', group: '负载参数', type: 'number', unit: 'N·m', default: 50, step: 'any' },
      { key: 'n', label: '负载转速 n', group: '负载参数', type: 'number', unit: 'r/min', default: 60, step: 'any' },
      { key: 'loadType', label: '负载类型提示', group: '负载参数', type: 'select', options: [
        { v: 'const', t: '恒转矩负载（输送、提升）' },
        { v: 'fan', t: '风机泵类（转矩随转速²增）' },
        { v: 'inertia', t: '大惯量起动（转盘、飞轮）' }
      ], default: 'const' },
      { key: 'i', label: '减速比 i（减速机）', group: '传动参数', type: 'number', default: 20, step: 'any', hint: '电机直联负载时填 1' },
      { key: 'eta', label: '传动系统总效率 η', group: '传动参数', type: 'number', default: 0.85, step: 'any', hint: '一级齿轮0.97、蜗杆0.7~0.8、丝杆0.9（连乘）' },
      { key: 'K', label: '安全系数 K', group: '传动参数', type: 'select', options: [
        { v: '1.5', t: '1.3~1.6 载荷平稳（风机、传送带）' },
        { v: '2', t: '1.8~2.2 中等冲击（机床、包装机）' },
        { v: '2.8', t: '2.5~3.0 重冲击（破碎、冲床、起重机）' }
      ], default: '2' }
    ],
    compute: function (v) {
      var T = +v.T, n = +v.n, i = +v.i, eta = +v.eta, K = +v.K;
      if (!(T > 0) || !(n > 0)) return { error: '请输入负载转矩与负载转速' };
      if (!(i > 0) || !(eta > 0 && eta <= 1)) return { error: '减速比或效率输入有误（0＜η≤1）' };
      var Pload = T * n / 9550;                    // 负载功率 kW
      var Pneed = Pload * K / eta;                 // 所需电机功率
      var Psel = null;
      for (var k = 0; k < MOTOR_KW.length; k++) if (MOTOR_KW[k] >= Pneed) { Psel = MOTOR_KW[k]; break; }
      if (Psel === null) Psel = Math.ceil(Pneed);
      var nMotor = n * i;                          // 电机转速需求
      var Tmotor = T / (i * eta) * K;              // 电机轴所需转矩 N·m
      var speedOK = true, speedHint = '';
      var bestSync = MOTOR_SPEED[0];
      for (var s = 0; s < MOTOR_SPEED.length; s++) { if (MOTOR_SPEED[s] >= nMotor) { bestSync = MOTOR_SPEED[s]; break; } bestSync = MOTOR_SPEED[s]; }
      if (nMotor > 3000) { speedOK = false; speedHint = '电机转速需求 ' + fmt(nMotor) + ' r/min 超出普通三相异步电机范围（≤3000），请减小减速比或选用高速电机'; }
      return {
        sections: [
          { title: '功率计算', rows: [
            { label: '负载功率 P=T·n/9550', value: Pload, unit: 'kW', d: 3, hl: true },
            { label: '所需电机功率 Pd=K·P/η', value: Pneed, unit: 'kW', d: 3, hl: true },
            { label: '圆整标准电机功率', value: Psel, unit: 'kW', hl: true },
            { label: '功率裕度', value: Psel / Pneed, d: 2 }
          ] },
          { title: '转速与转矩', rows: [
            { label: '电机侧转速需求', value: nMotor, unit: 'r/min', d: 1, hl: true },
            { label: '建议同步转速', value: bestSync, unit: 'r/min', d: 0 },
            { label: '电机轴所需转矩', value: Tmotor, unit: 'N·m', d: 2, hl: true },
            { label: '所选电机额定转矩', value: Psel * 9550 / nMotor, unit: 'N·m', d: 2 }
          ] }
        ],
        verdict: {
          level: speedOK ? 'ok' : 'warn',
          text: speedOK
            ? '建议选用 ' + fmt(Psel) + ' kW 电机' + (i > 1 ? ' + 减速比 ' + fmt(i) + ' 减速机' : '（电机直联）')
            : speedHint,
          note: '变频驱动时按恒转矩特性校核低速散热；伺服电机还需校核惯量比 JL/i²/JM ≤ 5~10。'
        },
        notes: [
          'Pd = K·T·n/(9550·η)，K 为安全系数（工况越恶劣取越大）。',
          '选择减速比时兼顾：电机额定转速（4极≈1440r/min、2极≈2900r/min）÷ 负载转速。',
          '伺服/步进系统还需校核：① 折算惯量比 JL/i²/JM ≤ 5~10 ② 矩频特性 ③ 起动转矩裕度。',
          '风机泵类负载功率随转速三次方增长，调速时按 P∝n³ 校核。'
        ]
      };
    },
    formulas: [
      'Pd = K·T·n/(9550·η)（kW）',
      'n电机 = n负载 × i；T电机 = K·T/(i·η)',
      '校核：P电机额定 ≥ Pd'
    ],
    reference: '《机械设计手册》电动机与传动装置选型章节；SEW/NORD 减速电机选型样本。'
  });
})();
