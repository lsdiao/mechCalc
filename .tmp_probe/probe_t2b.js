var { execFileSync } = require('child_process');
function post(body){
  try{
    return execFileSync('curl', ['-s','-m','20','-X','POST','https://www.mechtool.cn/calculation/timingbelt2',
      '-d', body, '-H','X-Requested-With: XMLHttpRequest'], {encoding:'utf8', timeout: 25000});
  }catch(e){ return 'ERR'; }
}
var qs = [
  ['XH v10','powerD=20&beltSize=XH&beltVelocity=10&kZ=1&n1=800&beltLen=1778&z1=24&kA=1.5&alpha1=170&zM=8'],
  ['XH v11','powerD=20&beltSize=XH&beltVelocity=11&kZ=1&n1=800&beltLen=1778&z1=24&kA=1.5&alpha1=170&zM=8'],
  ['XH v12','powerD=20&beltSize=XH&beltVelocity=12&kZ=1&n1=800&beltLen=1778&z1=24&kA=1.5&alpha1=170&zM=8'],
  ['XXH v10','powerD=40&beltSize=XXH&beltVelocity=10&kZ=1&n1=800&beltLen=2032&z1=24&kA=1.5&alpha1=170&zM=8'],
  ['XXH v11','powerD=40&beltSize=XXH&beltVelocity=11&kZ=1&n1=800&beltLen=2032&z1=24&kA=1.5&alpha1=170&zM=8'],
  ['XXH v12','powerD=40&beltSize=XXH&beltVelocity=12&kZ=1&n1=800&beltLen=2032&z1=24&kA=1.5&alpha1=170&zM=8'],
  ['L Pd0.5','powerD=0.5&beltSize=L&beltVelocity=5.8&kZ=1&n1=1440&beltLen=1219.2&z1=16&kA=1.5&alpha1=170&zM=8'],
  ['H v6','powerD=6&beltSize=H&beltVelocity=6&kZ=1&n1=1440&beltLen=1447.8&z1=18&kA=1.5&alpha1=164.15&zM=8'],
];
qs.forEach(function(q){
  var r='';
  for (var t=0;t<5 && (!r || r[0]!=='{');t++){
    r = post(q[1]);
    if (r[0] !== '{'){ try{execFileSync('sleep',['2']);}catch(e){} }
  }
  console.log('### '+q[0]+' :: '+r);
  try{ execFileSync('sleep',['1.5']); }catch(e){}
});
