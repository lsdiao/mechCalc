// timingbelt2 全数据公式拟合：powerR / bsMin / power0 / forceQ / bs
var TA = {MXL:27, XXL:31, XL:50.17, L:244.46, H:2100.85, XH:4048.9, XXH:6398.03};
var MM = {MXL:0.007, XXL:0.01, XL:0.022, L:0.095, H:0.448, XH:1.484, XXH:2.473};
var BS0 = {MXL:6.4, XXL:6.4, XL:9.5, L:25.4, H:76.2, XH:101.6, XXH:127};
// [Pd, type, v, kZ, R:{bs,power0,forceQ,bsMin,m,bs0,powerR}]
var C = [
[6,'H',5.475,1,{bs:50.8,power0:11.43,forceQ:1095.89,bsMin:43.299,m:0.448,bs0:76.2,powerR:7.2}],
[6,'H',5.475,1,{bs:50.8,power0:11.43,forceQ:1095.89,bsMin:43.299,m:0.448,bs0:76.2,powerR:7.2}],
[10,'H',5.475,1,{bs:76.2,power0:11.43,forceQ:1826.48,bsMin:67.777,m:0.448,bs0:76.2,powerR:11.43}],
[6,'XL',3.02,1,{bs:0.0,power0:0.15,forceQ:1986.75,bsMin:240.293,m:0.022,bs0:9.5,powerR:0.0}],
[6,'L',5.8,1,{bs:0.0,power0:1.4,forceQ:1034.48,bsMin:91.08,m:0.095,bs0:25.4,powerR:0.0}],
[20,'XH',10,1,{bs:76.2,power0:39.01,forceQ:2000.0,bsMin:56.549,m:1.484,bs0:101.6,powerR:28.06}],
[40,'XXH',10,1,{bs:101.6,power0:61.51,forceQ:4000.0,bsMin:87.073,m:2.473,bs0:127.0,powerR:47.63}],
[6,'H',5.475,0.8,{bs:76.2,power0:11.43,forceQ:1095.89,bsMin:52.661,m:0.448,bs0:76.2,powerR:9.13}],
[6,'H',5.475,0.6,{bs:76.2,power0:11.43,forceQ:1095.89,bsMin:67.777,m:0.448,bs0:76.2,powerR:6.83}],
[6,'H',6,1,{bs:50.8,power0:12.51,forceQ:1000.0,bsMin:40.003,m:0.448,bs0:76.2,powerR:7.88}],
[12,'H',5.475,1,{bs:0.0,power0:11.43,forceQ:2191.78,bsMin:79.532,m:0.448,bs0:76.2,powerR:0.0}],
[0.5,'MXL',1,1,{bs:0.0,power0:0.03,forceQ:500.0,bsMin:82.835,m:0.007,bs0:6.4,powerR:0.0}],
[0.5,'XXL',1,1,{bs:0.0,power0:0.03,forceQ:500.0,bsMin:73.385,m:0.01,bs0:6.4,powerR:0.0}],
[20,'XH',11,1,{bs:76.2,power0:42.56,forceQ:1818.18,bsMin:52.381,m:1.484,bs0:101.6,powerR:30.6}],
[20,'XH',12,1,{bs:50.8,power0:46.02,forceQ:1666.67,bsMin:48.911,m:1.484,bs0:101.6,powerR:20.76}],
[20,'XH',5,1,{bs:101.6,power0:20.06,forceQ:4000.0,bsMin:101.338,m:1.484,bs0:101.6,powerR:20.06}],
[40,'XXH',9,1,{bs:101.6,power0:55.78,forceQ:4444.44,bsMin:94.869,m:2.473,bs0:127.0,powerR:43.21}],
[40,'XXH',11,1,{bs:101.6,power0:67.09,forceQ:3636.36,bsMin:80.688,m:2.473,bs0:127.0,powerR:51.94}],
[40,'XXH',12,1,{bs:76.2,power0:72.5,forceQ:3333.33,bsMin:75.375,m:2.473,bs0:127.0,powerR:40.32}],
[0.5,'L',5.8,1,{bs:12.7,power0:1.4,forceQ:86.21,bsMin:10.298,m:0.095,bs0:25.4,powerR:0.63}],
[0.05,'XL',3.02,1,{bs:6.4,power0:0.15,forceQ:16.56,bsMin:3.605,m:0.022,bs0:9.5,powerR:0.1}],
[0.01,'MXL',1,1,{bs:3.0,power0:0.03,forceQ:10.0,bsMin:2.678,m:0.007,bs0:6.4,powerR:0.01}],
[6,'H',6,0.8,{bs:50.8,power0:12.51,forceQ:1000.0,bsMin:48.652,m:0.448,bs0:76.2,powerR:6.29}],
[34,'XH',10,1,{bs:101.6,power0:39.01,forceQ:3400.0,bsMin:90.069,m:1.484,bs0:101.6,powerR:39.01}],
[50,'XXH',10,1,{bs:127.0,power0:61.51,forceQ:5000.0,bsMin:105.9,m:2.473,bs0:127.0,powerR:61.51}],
[55,'XXH',11,1,{bs:127.0,power0:67.09,forceQ:5000.0,bsMin:106.69,m:2.473,bs0:127.0,powerR:67.09}],
[60,'XXH',12,1,{bs:127.0,power0:72.5,forceQ:5000.0,bsMin:107.571,m:2.473,bs0:127.0,powerR:72.5}],
[20,'XXH',10,1,{bs:50.8,power0:61.51,forceQ:2000.0,bsMin:47.405,m:2.473,bs0:127.0,powerR:21.52}],
[35,'XXH',12,1,{bs:76.2,power0:72.5,forceQ:2916.67,bsMin:67.044,m:2.473,bs0:127.0,powerR:40.32}],
[20,'XH',8,1,{bs:76.2,power0:31.63,forceQ:2500.0,bsMin:67.96,m:1.484,bs0:101.6,powerR:22.76}],
[20,'XH',10,0.8,{bs:76.2,power0:39.01,forceQ:2000.0,bsMin:68.776,m:1.484,bs0:101.6,powerR:22.22}]
];
function r2(x){return Math.round(x*100)/100;}
function r3(x){return Math.round(x*1000)/1000;}
var WIDTHS={MXL:[3.0,4.8,6.4],XXL:[3.0,4.8,6.4],XL:[6.4,7.9,9.5],L:[12.7,19.1,25.4,38.1],H:[19.1,25.4,38.1,50.8,76.2],XH:[50.8,76.2,101.6],XXH:[50.8,76.2,101.6,127]};

var fails={power0:0,forceQ:0,bsMin:0,bs:0,powerR_h1:0,powerR_h2:0};
C.forEach(function(c,i){
  var Pd=c[0],t=c[1],v=c[2],kZ=c[3],R=c[4];
  var Ta=TA[t],m=MM[t],bs0=BS0[t];
  var P0=(Ta-m*v*v)*v/1000;
  if(r2(P0)!==R.power0){fails.power0++;console.log(i,t,'P0',r2(P0),R.power0);}
  if(r2(1000*Pd/v)!==R.forceQ){fails.forceQ++;console.log(i,t,'Q',r2(1000*Pd/v),R.forceQ);}
  var bsMin=bs0*Math.pow(Pd/(kZ*P0),1/1.14);
  if(r3(bsMin)!==R.bsMin){fails.bsMin++;console.log(i,t,'bsMin',r3(bsMin),R.bsMin,'diff',(r3(bsMin)-R.bsMin).toFixed(4));}
  var bs=0, W=WIDTHS[t];
  for(var k=0;k<W.length;k++) if(W[k]>=bsMin){bs=W[k];break;}
  if(bs!==R.bs){fails.bs++;console.log(i,t,'bs',bs,R.bs);}
  var ratio=R.bs>0?R.bs/bs0:0;
  var h1=R.bs>0?r2(kZ*P0*Math.pow(ratio,1.14)):0;
  var h2=R.bs>0?r2(((kZ*Ta-m*v*v)*v/1000)*Math.pow(ratio,1.14)):0;
  var f1=h1!==R.powerR, f2=h2!==R.powerR;
  if(f1)fails.powerR_h1++;
  if(f2)fails.powerR_h2++;
  if(f1&&f2)console.log(i,t,'v='+v,'kZ='+kZ,'bs='+R.bs,'powerR api='+R.powerR,'h1='+h1,'h2='+h2,'P0='+P0.toFixed(6),'ratio='+ratio.toFixed(5),'e_needed='+(Math.log(R.powerR/(kZ*P0))/Math.log(ratio)).toFixed(6));
});
console.log(JSON.stringify(fails));
// 需要的等效指数（kZ=1 时）
console.log('--- XH/XXH kZ=1 等效指数 ---');
C.forEach(function(c){
  var Pd=c[0],t=c[1],v=c[2],kZ=c[3],R=c[4];
  if((t!=='XH'&&t!=='XXH')||kZ!==1||R.bs===0)return;
  var P0=(TA[t]-MM[t]*v*v)*v/1000;
  var e=Math.log(R.powerR/P0)/Math.log(R.bs/BS0[t]);
  console.log(t,'v='+v,'bs='+R.bs,'P0='+P0.toFixed(5),'e='+e.toFixed(6));
});
