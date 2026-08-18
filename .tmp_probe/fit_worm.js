// Fit worm drive formulas against API probe results
var R2 = function(x){ return Math.round(x*100)/100; };
var R3 = function(x){ return Math.round(x*1000)/1000; };
var R4 = function(x){ return Math.round(x*10000)/10000; };
var rad = function(d){ return d*Math.PI/180; };

console.log('==== wormDrive1: a = cbrt(K*T2*1000*(ZE*Zp)^2/sig^2) ====');
[[1.2075,948.4,2.9,160,217.98,173.13],
 [1.0,1000,3.0,160,200,179.26],
 [1.5,2500.5,2.5,155,180.5,258.56],
 [2.05,123.456,3.1,160,130,154.45],
 [1.2075,948.4,2.9,160,217.985,173.12]].forEach(function(c){
  var a = Math.pow(c[0]*c[1]*1000*Math.pow(c[2]*c[3],2)/(c[4]*c[4]), 1/3);
  console.log('calc r2='+R2(a)+' r3='+R3(a)+' raw='+a+' api='+c[5]);
});

console.log('==== wormDrive2 ====');
[[8,41,2,80,200],[10,31,4,90,250],[5,71,1,50,200],[3.15,53,2,35.5,125],[12.5,29,6,112,250],[2,40,1,22.4,63]].forEach(function(c){
  var m=c[0],z2=c[1],z1=c[2],d1=c[3],a=c[4];
  var d2=m*z2, q=d1/m, x2=a/m-(d1+d2)/2/m, gama=Math.atan(z1*m/d1)/Math.PI*180, m2d1=m*m*d1;
  console.log('m='+m+' d2='+R2(d2)+' q='+R3(q)+' x2='+R3(x2)+' gama='+R3(gama)+' m2d1='+R2(m2d1));
});

console.log('==== wormDrive3: vS, phiV, eta ====');
var xc45=[[0.01,0.11],[0.05,0.09],[0.10,0.08],[0.25,0.065],[0.50,0.055],[1.0,0.045],[1.5,0.040],[2.0,0.035],[2.5,0.030],[3.0,0.028],[4.0,0.024],[5.0,0.022],[8.0,0.018],[10.0,0.016],[15.0,0.014],[24.0,0.013]];
function interp(tbl,x){
  if(x<tbl[0][0]||x>tbl[tbl.length-1][0]) return null;
  for(var i=0;i<tbl.length-1;i++){
    if(x>=tbl[i][0]&&x<=tbl[i+1][0]){
      var t=(x-tbl[i][0])/(tbl[i+1][0]-tbl[i][0]);
      return tbl[i][1]+t*(tbl[i+1][1]-tbl[i][1]);
    }
  }
  return null;
}
function phiV(tbl,vS){ var f=interp(tbl,vS); return Math.atan(f)*180/Math.PI; }
[[11.31,80,1450,'xc45',1.169,0.859,6.194],
 [18.435,45,2900,'lqt45',1.794,0.859,7.203],
 [10,100,333,'xc45',2.136,0.779,1.77]].forEach(function(c){
  var g=c[0],d1=c[1],n1=c[2];
  var vS=Math.PI*d1*n1/(60000*Math.cos(rad(g)));
  var vSr=R3(vS);
  var tbl = c[3]==='xc45'?xc45:[[0.01,0.18],[0.05,0.14],[0.1,0.13],[0.25,0.10],[0.5,0.09],[1.0,0.07],[1.5,0.065],[2.0,0.055],[2.5,0.05],[3.0,0.045],[4.0,0.04],[5.0,0.035],[8.0,0.03]];
  var pRaw=phiV(tbl,vS), pR=phiV(tbl,vSr);
  var etaRaw=0.95*Math.tan(rad(g))/Math.tan(rad(g+pRaw));
  var etaR=0.95*Math.tan(rad(g))/Math.tan(rad(g+pR));
  console.log('vS='+vSr+'(api '+c[6]+') phiV rawVs='+R3(pRaw)+' rVs='+R3(pR)+'(api '+c[4]+') eta rawVs='+R3(etaRaw)+' rVs='+R3(etaR)+'(api '+c[5]+')');
});

console.log('==== wormDrive4 ====');
[[1.2075,948.4,2.87,11.31,8,80,328,41,52200000,56,0.92,0.644,36.09,43.48,22.02],
 [1.0,1000,2.0,5,5,50,300,60,1000000,40,0.96,1.0,40.0,60.69,39.34],
 [1.6,3333.3,3.0,15,10,90,310,31,2500000000,80,0.89,0.541,43.32,34.4,78.34],
 [1.15,555.55,2.5,8,6.3,63,371.7,59,50000,64,0.94,1.292,82.66,60.76,15.62],
 [1.2075,948.4,2.87,11.31,8,80,328,41,10000000,56,0.92,0.774,43.36,43.48,22.02]].forEach(function(c){
  var k=c[0],T2=c[1],yFa2=c[2],g=c[3],m=c[4],d1=c[5],d2=c[6],z2=c[7],N=c[8],sfb=c[9];
  var yBetaRaw=1-g/140, zV2=z2/Math.pow(Math.cos(rad(g)),3);
  var Nc=Math.min(Math.max(N,1e5),2.5e8);
  var kFNRaw=Math.pow(1e6/Nc,1/9);
  var sfAll=sfb*kFNRaw;
  var q=d1/m;
  var base=k*T2*1000*yFa2*yBetaRaw/(m*m*m*q*z2);
  var A=c[14]/base;
  console.log('yBeta='+R2(yBetaRaw)+'('+c[10]+') zV2='+R2(zV2)+'('+c[13]+') kFN='+R3(kFNRaw)+'('+c[11]+') sfA='+R2(sfAll)+'('+c[12]+') base='+base+' A='+A);
});

console.log('==== wormDrive5 ====');
[[59.27,948.4,8,80,328,295.2,2104.81,0.08,1481.75,670786.35,0.01,60.8],
 [100,2000,10,90,310,280,4696.39,0.09,2222.22,931420.18,0.0124,66.0],
 [12.5,250.25,4,40,280,250,650.6,0.04,625.0,41924.15,0.034,30.4],
 [33.33,666.66,6.3,63,371.7,334.5,1305.59,0.063,1058.1,257980.25,0.0247,47.88]].forEach(function(c){
  var T1=c[0],T2=c[1],m=c[2],d1=c[3],d2=c[4],L=c[5];
  var ft1=2*T1*1000/d1, fr1=2*T2*1000*Math.tan(rad(20))/d2;
  var dF1=d1-2.4*m, I=Math.PI*Math.pow(dF1,4)/64;
  var F=Math.sqrt(ft1*ft1+fr1*fr1);
  var y=F*Math.pow(L,3)/(48*206000*I);
  console.log('ft1='+R2(ft1)+'('+c[8]+') fr1='+R2(fr1)+'('+c[6]+') dF1='+R2(dF1)+'('+c[11]+') I='+R2(I)+'('+c[9]+') y='+R4(y)+'('+c[10]+') yA='+R3(d1*0.001)+'('+c[7]+')');
});

console.log('==== wormDrive6 ====');
[[0.87,60,20,8.5,9,3.44,2.29],[0.75,70,30,12,5.5,2.86,2.29],[0.596,65,25,10,2.2,2.22,1.62],[0.8,60,20,15,100,33.33,22.22]].forEach(function(c){
  var e=c[0],t0=c[1],t1=c[2],ad=c[3],P=c[4];
  var S=1000*P*(1-e)/(ad*(t0-t1));
  var S2=1000*P*(1-e)/(ad*(80-t1));
  console.log('S='+R2(S)+'('+c[5]+') S2='+R2(S2)+'('+c[6]+')');
});
