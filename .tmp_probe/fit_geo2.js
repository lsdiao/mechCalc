// 验证 timingbelt1 / timingbeltLenChange 几何公式 v2：精确带长公式 + 数值反解 a
var PI = Math.PI;
var PB = { MXL: 2.032, XXL: 3.175, XL: 5.08, L: 9.525, H: 12.7, XH: 22.225, XXH: 31.75, T5: 5 };

var T1 = [
  [18,18,500,'H',{a:501.65,zM:9,zB:97,beltLen:1231.9,calBeltLen:1228.6,kZ:1,alpha1:180.0}],
  [18,52,500,'H',{a:496.89,zM:8,zB:114,beltLen:1447.8,calBeltLen:1453.96,kZ:1,alpha1:164.15}],
  [18,52,400,'H',{a:394.042,zM:8,zB:98,beltLen:1244.6,calBeltLen:1256.34,kZ:1,alpha1:160.01}],
  [10,30,300,'XL',{a:299.283,zM:4,zB:138,beltLen:701.04,calBeltLen:702.47,kZ:0.6,alpha1:173.81}],
  [24,48,600,'L',{a:589.427,zM:11,zB:160,beltLen:1524.0,calBeltLen:1545.11,kZ:1,alpha1:172.93}],
  [22,44,800,'XH',{a:796.297,zM:10,zB:105,beltLen:2333.63,calBeltLen:2341.0,kZ:1,alpha1:168.8}],
  [22,66,1000,'XXH',{a:1056.006,zM:9,zB:112,beltLen:3556.0,calBeltLen:3446.64,kZ:1,alpha1:155.87}],
  [18,52,100,'H',{a:94.246,zM:4,zB:54,beltLen:685.8,calBeltLen:693.93,kZ:0.6,alpha1:96.44}],
  [18,52,150,'H',{a:156.058,zM:6,zB:62,beltLen:787.4,calBeltLen:776.57,kZ:1,alpha1:129.53}],
  [18,52,200,'H',{a:197.466,zM:7,zB:68,beltLen:863.6,calBeltLen:868.36,kZ:1,alpha1:140.12}],
  [18,52,250,'H',{a:250.877,zM:7,zB:76,beltLen:965.2,calBeltLen:963.51,kZ:1,alpha1:148.61}],
  [18,52,300,'H',{a:303.331,zM:7,zB:84,beltLen:1066.8,calBeltLen:1060.31,kZ:1,alpha1:154.04}],
  [18,52,350,'H',{a:348.808,zM:7,zB:91,beltLen:1155.7,calBeltLen:1158.04,kZ:1,alpha1:157.42}],
  [18,52,450,'H',{a:451.965,zM:8,zB:107,beltLen:1358.9,calBeltLen:1355.02,kZ:1,alpha1:162.57}],
  [18,52,550,'H',{a:541.735,zM:8,zB:121,beltLen:1536.7,calBeltLen:1553.1,kZ:1,alpha1:165.46}],
  [18,52,650,'H',{a:650.416,zM:8,zB:138,beltLen:1752.6,calBeltLen:1751.77,kZ:1,alpha1:167.89}],
  [18,52,750,'H',{a:752.51,zM:8,zB:154,beltLen:1955.8,calBeltLen:1950.8,kZ:1,alpha1:169.53}],
  [18,52,850,'H',{a:854.485,zM:8,zB:170,beltLen:2159.0,calBeltLen:2150.06,kZ:1,alpha1:170.78}],
  [18,52,950,'H',{a:943.646,zM:8,zB:184,beltLen:2336.8,calBeltLen:2349.47,kZ:1,alpha1:171.65}],
  [18,52,1100,'H',{a:1109.12,zM:8,zB:210,beltLen:2667.0,calBeltLen:2648.79,kZ:1,alpha1:172.9}],
  [18,52,1300,'H',{a:1299.933,zM:8,zB:240,beltLen:3048.0,calBeltLen:3048.13,kZ:1,alpha1:173.94}],
  [18,52,1500,'H',{a:1503.379,zM:8,zB:272,beltLen:3454.4,calBeltLen:3447.65,kZ:1,alpha1:174.76}],
  [16,48,200,'L',{a:198.843,zM:6,zB:75.001,beltLen:714.38,calBeltLen:716.63,kZ:1,alpha1:152.04}],
  [16,48,350,'L',{a:349.049,zM:7,zB:106,beltLen:1009.65,calBeltLen:1011.53,kZ:1,alpha1:164.07}],
  [16,48,500,'L',{a:502.482,zM:7,zB:138,beltLen:1314.45,calBeltLen:1309.51,kZ:1,alpha1:168.94}],
  [16,48,700,'L',{a:684.079,zM:7,zB:176,beltLen:1676.4,calBeltLen:1708.16,kZ:1,alpha1:171.87}],
  [16,48,900,'L',{a:913.111,zM:7,zB:224,beltLen:2133.6,calBeltLen:2107.42,kZ:1,alpha1:173.91}],
  [16,48,1200,'L',{a:1151.503,zM:7,zB:274,beltLen:2609.85,calBeltLen:2706.76,kZ:1,alpha1:175.17}],
  [16,48,1500,'L',{a:1632.819,zM:7,zB:375.001,beltLen:3571.88,calBeltLen:3306.37,kZ:1,alpha1:176.6}],
  [16,48,1800,'L',{a:1647.111,zM:7,zB:378,beltLen:3600.45,calBeltLen:3906.11,kZ:1,alpha1:176.62}],
  [24,48,200,'XH',{a:228.517,zM:9,zB:58,beltLen:1289.05,calBeltLen:1236.71,kZ:1,alpha1:137.43}],
  [24,48,400,'XH',{a:390.792,zM:10,zB:72,beltLen:1600.2,calBeltLen:1618.19,kZ:1,alpha1:155.11}],
  [24,48,600,'XH',{a:605.226,zM:10,zB:91,beltLen:2022.48,calBeltLen:2012.13,kZ:1,alpha1:163.93}],
  [24,48,800,'XH',{a:773.21,zM:11,zB:106,beltLen:2355.85,calBeltLen:2409.12,kZ:1,alpha1:167.42}],
  [24,48,1000,'XH',{a:1018.811,zM:11,zB:128,beltLen:2844.8,calBeltLen:2807.31,kZ:1,alpha1:170.45}],
  [24,48,1300,'XH',{a:1375.329,zM:11,zB:160,beltLen:3556.0,calBeltLen:3405.65,kZ:1,alpha1:172.93}],
  [24,48,1600,'XH',{a:1597.944,zM:11,zB:180,beltLen:4000.5,calBeltLen:4004.61,kZ:1,alpha1:173.91}],
  [24,48,2000,'XH',{a:1976.201,zM:11,zB:214,beltLen:4756.15,calBeltLen:4803.7,kZ:1,alpha1:175.08}],
  [20,40,400,'T5',{a:394.679,zM:9,zB:188,beltLen:940.0,calBeltLen:950.63,kZ:1,alpha1:175.38}]
];
var LC = [
  [18,52,12.7,1524,{a:535.333,zM:8,zB:120,kZ:1,alpha1:165.29}],
  [18,52,12.7,1371.6,{a:458.389,zM:8,zB:108,kZ:1,alpha1:162.82}],
  [10,30,5.08,508,{a:202.554,zM:4,zB:100,kZ:0.6,alpha1:170.85}],
  [24,48,9.525,1219.2,{a:436.633,zM:11,zB:128,kZ:1,alpha1:170.45}]
];

function r2(x){ return Math.round(x*100)/100; }
function r3(x){ return Math.round(x*1000)/1000; }

/* 精确开口传动带长 */
function beltL(d1,d2,a){
  var dl=(d2-d1)/2;
  if(Math.abs(dl)>=a) return NaN;
  var th=Math.asin(dl/a);
  return 2*Math.sqrt(a*a-dl*dl)+(PI-2*th)*d1/2+(PI+2*th)*d2/2;
}
/* 数值反解 a: beltL(a)=L */
function solveA(d1,d2,L){
  var lo=1e-6, hi=20000;
  for(var i=0;i<200;i++){
    var m=(lo+hi)/2;
    if(beltL(d1,d2,m)<L) lo=m; else hi=m;
  }
  return (lo+hi)/2;
}
function geo(z1,z2,pb,beltLen){
  var d1=z1*pb/PI, d2=z2*pb/PI;
  var a=solveA(d1,d2,beltLen);
  var zM=Math.floor(z1/2 - z1*(d2-d1)/(2*PI*a) + 1e-9);
  var alpha1=180-(d2-d1)/a*57.3;
  var kZ=zM>=6?1:zM===5?0.8:zM===4?0.6:0.4;
  return {a:a,zM:zM,zB:r3(beltLen/pb),kZ:kZ,alpha1:alpha1};
}

console.log('==== timingbelt1 ====');
var bad=0;
T1.forEach(function(c){
  var z1=c[0],z2=c[1],a0=c[2],bs=c[3],R=c[4];
  var pb=PB[bs];
  var d1=z1*pb/PI,d2=z2*pb/PI;
  var cal=beltL(d1,d2,a0);
  var g=geo(z1,z2,pb,R.beltLen);
  var bf=[];
  if(r2(cal)!==R.calBeltLen) bf.push('calBeltLen '+r2(cal)+' vs '+R.calBeltLen);
  if(r3(g.a)!==R.a) bf.push('a '+r3(g.a)+' vs '+R.a);
  if(g.zM!==R.zM) bf.push('zM '+g.zM+' vs '+R.zM);
  if(g.zB!==R.zB) bf.push('zB '+g.zB+' vs '+R.zB);
  if(g.kZ!==R.kZ) bf.push('kZ '+g.kZ+' vs '+R.kZ);
  if(r2(g.alpha1)!==R.alpha1) bf.push('alpha1 '+r2(g.alpha1)+' vs '+R.alpha1);
  if(bf.length){bad++;console.log('BAD '+bs+' '+z1+'/'+z2+' a0='+a0+' :: '+bf.join(' | '));}
});
console.log('==== timingbeltLenChange ====');
LC.forEach(function(c){
  var z1=c[0],z2=c[1],pb=c[2],L=c[3],R=c[4];
  var g=geo(z1,z2,pb,L);
  var bf=[];
  if(r3(g.a)!==R.a) bf.push('a '+r3(g.a)+' vs '+R.a);
  if(g.zM!==R.zM) bf.push('zM '+g.zM+' vs '+R.zM);
  if(g.zB!==R.zB) bf.push('zB '+g.zB+' vs '+R.zB);
  if(g.kZ!==R.kZ) bf.push('kZ '+g.kZ+' vs '+R.kZ);
  if(r2(g.alpha1)!==R.alpha1) bf.push('alpha1 '+r2(g.alpha1)+' vs '+R.alpha1);
  if(bf.length){bad++;console.log('BAD LC '+z1+'/'+z2+' L='+L+' :: '+bf.join(' | '));}
});
console.log(bad?('TOTAL BAD='+bad):'ALL GEOMETRY OK');
