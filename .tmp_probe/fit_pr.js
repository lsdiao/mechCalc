// 精确拟合 timingbelt2 的 bsMin / powerR / power0 公式
var TA = {MXL:27, XXL:31, XL:50.17, L:244.46, H:2100.85, XH:4048.9, XXH:6398.03};
var MM = {MXL:0.007, XXL:0.01, XL:0.022, L:0.095, H:0.448, XH:1.484, XXH:2.473};
var BS0 = {MXL:6.4, XXL:6.4, XL:9.5, L:25.4, H:76.2, XH:101.6, XXH:127};

// API 探针数据: [powerD, beltSize, v, kZ, n1, beltLen, z1, kA, alpha1, zM, {bs,power0,forceQ,bsMin,m,bs0,powerR}]
var cases = [
[6,'H',5.475,1,1440,1447.8,18,1.5,164.15,8,{bs:50.8,power0:11.43,forceQ:1095.89,bsMin:43.299,m:0.448,bs0:76.2,powerR:7.2}],
[10,'H',5.475,1,1440,1447.8,18,1.5,164.15,8,{bs:76.2,power0:11.43,forceQ:1826.48,bsMin:67.777,m:0.448,bs0:76.2,powerR:11.43}],
[6,'H',5.475,0.8,1440,1447.8,18,1.5,164.15,5,{bs:76.2,power0:11.43,forceQ:1095.89,bsMin:52.661,m:0.448,bs0:76.2,powerR:9.13}],
[6,'H',5.475,0.6,1440,1447.8,18,1.5,164.15,4,{bs:76.2,power0:11.43,forceQ:1095.89,bsMin:67.777,m:0.448,bs0:76.2,powerR:6.83}],
[6,'H',6,1,1440,1447.8,18,1.5,164.15,8,{bs:50.8,power0:12.51,forceQ:1000.0,bsMin:40.003,m:0.448,bs0:76.2,powerR:7.88}],
[12,'H',5.475,1,1440,1447.8,18,1.5,164.15,8,{bs:0.0,power0:11.43,forceQ:2191.78,bsMin:79.532,m:0.448,bs0:76.2,powerR:0.0}],
[6,'XL',3.02,1,1440,508,15,1.5,170,8,{bs:0.0,power0:0.15,forceQ:1986.75,bsMin:240.293,m:0.022,bs0:9.5,powerR:0.0}],
[6,'L',5.8,1,1440,1219.2,16,1.5,170,8,{bs:0.0,power0:1.4,forceQ:1034.48,bsMin:91.08,m:0.095,bs0:25.4,powerR:0.0}],
[20,'XH',10,1,800,1778,24,1.5,170,8,{bs:76.2,power0:39.01,forceQ:2000.0,bsMin:56.549,m:1.484,bs0:101.6,powerR:28.06}],
[40,'XXH',10,1,800,2032,24,1.5,170,8,{bs:101.6,power0:61.51,forceQ:4000.0,bsMin:87.073,m:2.473,bs0:127,powerR:47.63}],
[0.5,'MXL',1,1,3000,508,20,1.5,170,8,{bs:0.0,power0:0.03,forceQ:500.0,bsMin:82.835,m:0.007,bs0:6.4,powerR:0.0}],
[0.5,'XXL',1,1,3000,508,20,1.5,170,8,{bs:0.0,power0:0.03,forceQ:500.0,bsMin:73.385,m:0.01,bs0:6.4,powerR:0.0}],
];

cases.forEach(function(c,i){
  var Pd=c[0], bs=c[1], v=c[2], kZ=c[3], n1=c[4], z1=c[6], R=c[10];
  var Ta=TA[bs], m=MM[bs], bs0=BS0[bs];
  var P0 = (Ta - m*v*v)*v/1000;
  var bsMin = bs0*Math.pow(Pd/(kZ*P0), 1/1.14);
  var powerR = (R.bs>0)? kZ*P0*Math.pow(R.bs/bs0, 1.14) : 0;
  var fmt = function(x,d){ return (+x.toFixed(d)).toString(); };
  console.log('case'+i, bs, 'v='+v, 'kZ='+kZ, 'Pd='+Pd);
  console.log('  power0: api='+R.power0, 'theory='+fmt(P0,2), (fmt(P0,2)==fmt(R.power0,2))?'OK':'DIFF');
  console.log('  bsMin : api='+R.bsMin, 'theory='+bsMin.toFixed(3), (Math.abs(bsMin-R.bsMin)<0.0005)?'OK':'DIFF');
  console.log('  powerR: api='+R.powerR, 'theory='+(powerR?fmt(powerR, R.powerR<10?1:2):'0'), 'raw='+powerR.toFixed(4));
  console.log('  forceQ: api='+R.forceQ, 'theory='+ (1000*Pd/v).toFixed(2));
});
