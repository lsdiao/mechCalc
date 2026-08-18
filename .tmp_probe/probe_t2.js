// timingbelt2 探针（exec curl 走代理，带重试）
var { execFileSync } = require('child_process');
function post(body){
  try{
    return execFileSync('curl', ['-s','-m','20','-X','POST','https://www.mechtool.cn/calculation/timingbelt2',
      '-d', body, '-H','X-Requested-With: XMLHttpRequest'], {encoding:'utf8', timeout: 25000});
  }catch(e){ return 'ERR'; }
}
var qs = [
  ['XH v11','powerD=20&beltSize=XH&beltVelocity=11&kZ=1&n1=800&beltLen=1778&z1=24&kA=1.5&alpha1=170&zM=8'],
  ['XH v12','powerD=20&beltSize=XH&beltVelocity=12&kZ=1&n1=800&beltLen=1778&z1=24&kA=1.5&alpha1=170&zM=8'],
  ['XH v5','powerD=20&beltSize=XH&beltVelocity=5&kZ=1&n1=800&beltLen=1778&z1=24&kA=1.5&alpha1=170&zM=8'],
  ['XH v10 kZ0.8','powerD=20&beltSize=XH&beltVelocity=10&kZ=0.8&n1=800&beltLen=1778&z1=24&kA=1.5&alpha1=170&zM=5'],
  ['XXH v9','powerD=40&beltSize=XXH&beltVelocity=9&kZ=1&n1=800&beltLen=2032&z1=24&kA=1.5&alpha1=170&zM=8'],
  ['XXH v11','powerD=40&beltSize=XXH&beltVelocity=11&kZ=1&n1=800&beltLen=2032&z1=24&kA=1.5&alpha1=170&zM=8'],
  ['XXH v12','powerD=40&beltSize=XXH&beltVelocity=12&kZ=1&n1=800&beltLen=2032&z1=24&kA=1.5&alpha1=170&zM=8'],
  ['L bs12.7','powerD=0.5&beltSize=L&beltVelocity=5.8&kZ=1&n1=1440&beltLen=1219.2&z1=16&kA=1.5&alpha1=170&zM=8'],
  ['XL bs4.8','powerD=0.05&beltSize=XL&beltVelocity=3.02&kZ=1&n1=1440&beltLen=508&z1=15&kA=1.5&alpha1=170&zM=8'],
  ['MXL bs3.0','powerD=0.01&beltSize=MXL&beltVelocity=1&kZ=1&n1=3000&beltLen=508&z1=20&kA=1.5&alpha1=170&zM=8'],
  ['XXL bs3.0','powerD=0.01&beltSize=XXL&beltVelocity=1&kZ=1&n1=3000&beltLen=508&z1=20&kA=1.5&alpha1=170&zM=8'],
  ['H v6 Pd6','powerD=6&beltSize=H&beltVelocity=6&kZ=1&n1=1440&beltLen=1447.8&z1=18&kA=1.5&alpha1=164.15&zM=8'],
  ['H v6 kZ0.8','powerD=6&beltSize=H&beltVelocity=6&kZ=0.8&n1=1440&beltLen=1447.8&z1=18&kA=1.5&alpha1=164.15&zM=5'],
];
qs.forEach(function(q){
  var r='';
  for (var t=0;t<4 && (!r || r[0]!=='{');t++){
    r = post(q[1]);
    if (r[0] !== '{'){ execFileSync('sleep',['1.5']); }
  }
  console.log('### '+q[0]+'\n'+q[1]+'\n'+r);
  try{ execFileSync('sleep',['1.2']); }catch(e){}
});
