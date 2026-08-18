// 手工公式验证 vs API 探针值
function calc(a0, z1, z2, p, n2, P, f1, dA, f5) {
  var X0 = 2*a0 + (z1+z2)/2 + Math.pow(z2-z1,2)/(4*Math.PI*Math.PI*a0);
  var X = Math.ceil(X0); if (X%2) X++;
  var L = X*p/1000;
  var v = z2*n2*p/60000;
  var half = X - (z1+z2)/2;
  var D = half*half - 8*Math.pow((z2-z1)/(2*Math.PI),2);
  var a = p/4*(half + Math.sqrt(D));
  var aAct = a*(1-dA);
  var ap = a/p;
  var alpha1 = 180 - 57.3*(z2-z1)/(Math.PI*ap);
  var F = 1000*P/v;
  var FQ = f5*f1*F;
  return {chainNoX0:+X0.toFixed(2), chainNoX:X, chainLen:+L.toFixed(3), chainSpeed:+v.toFixed(2),
    centerDistanceMax:+a.toFixed(2), actualCenterDistance:+aAct.toFixed(2), alpha1:+alpha1.toFixed(2),
    circularForce:+F.toFixed(2), pullForceOnShaft:+FQ.toFixed(2)};
}
var cases = [
  [{actualCenterDistance:129.1,alpha1:128.18,centerDistanceMax:129.62,chainLen:0.711,chainNoX:56,chainNoX0:54.74,chainSpeed:1.08,circularForce:2321.35,pullForceOnShaft:2785.62}, calc(9.5,19,48,12.7,106,2.5,1,0.004,1.2)],
  [{actualCenterDistance:262.3,alpha1:154.49,centerDistanceMax:263.35,chainLen:0.965,chainNoX:76,chainNoX0:74.57,chainSpeed:1.08,circularForce:2321.35,pullForceOnShaft:2785.62}, calc(20,19,48,12.7,106,2.5,1,0.004,1.2)],
  [{actualCenterDistance:631.19,alpha1:146.34,centerDistanceMax:633.09,chainLen:2.438,chainNoX:96,chainNoX0:94.23,chainSpeed:4.25,circularForce:1762.84,pullForceOnShaft:2908.68}, calc(24,21,67,25.4,150,7.5,1.5,0.003,1.1)],
  [{actualCenterDistance:476.39,alpha1:160.59,centerDistanceMax:477.34,chainLen:1.619,chainNoX:102,chainNoX0:101.86,chainSpeed:3.02,circularForce:1657.69,pullForceOnShaft:2262.74}, calc(30,25,57,15.875,200,5,1.3,0.002,1.05)],
  [{actualCenterDistance:1283.93,alpha1:142.71,centerDistanceMax:1289.08,chainLen:4.572,chainNoX:144,chainNoX0:142.86,chainSpeed:4.76,circularForce:4199.48,pullForceOnShaft:9070.87}, calc(40,17,100,31.75,90,20,1.8,0.004,1.2)],
  [{actualCenterDistance:3849.35,alpha1:174.6,centerDistanceMax:3862.87,chainLen:15.545,chainNoX:204,chainNoX0:202.61,chainSpeed:4.19,circularForce:11930.33,pullForceOnShaft:13719.88}, calc(50,95,110,76.2,30,50,1,0.0035,1.15)]
];
var ok=0, bad=0;
cases.forEach(function(c,i){
  var api=c[0], mine=c[1], fail=[];
  Object.keys(api).forEach(function(k){
    if (Math.abs(api[k]-mine[k])>1e-9) fail.push(k+': api='+api[k]+' mine='+mine[k]);
  });
  if (fail.length){bad++;console.log('CASE',i+1,'FAIL:',fail.join(' | '));} else {ok++;console.log('CASE',i+1,'PASS');}
});
console.log('pass',ok,'fail',bad);
