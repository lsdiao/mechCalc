// timingbelt2 XH/XXH powerR 精确探针：隔离 ratio=1、不同 v、不同 bs
var { execFileSync } = require('child_process');
function post(body){
  try{
    return execFileSync('curl', ['-s','-m','20','-X','POST','https://www.mechtool.cn/calculation/timingbelt2',
      '-d', body, '-H','X-Requested-With: XMLHttpRequest'], {encoding:'utf8', timeout: 25000});
  }catch(e){ return 'ERR'; }
}
function q(name, body){
  var r='';
  for (var t=0;t<4 && (!r || r[0]!=='{');t++){
    r = post(body);
    if (!r || r[0] !== '{'){ try{execFileSync('sleep',['1.2']);}catch(e){} }
  }
  console.log('### '+name+'\n'+body+'\n'+r);
  execFileSync('sleep',['0.7']);
}
var B='&kZ=1&n1=800&z1=24&kA=1.5&alpha1=170&zM=8';
// XH ratio=1 (bs=101.6): Pd=34 使 bsMin∈(76.2,101.6]
q('XH r1 v10','powerD=34&beltSize=XH&beltVelocity=10'+B+'&beltLen=1778');
q('XH r1 v11','powerD=34&beltSize=XH&beltVelocity=11'+B+'&beltLen=1778');
q('XH r1 v12','powerD=34&beltSize=XH&beltVelocity=12'+B+'&beltLen=1778');
// XH ratio=0.5 (bs=50.8): Pd=15
q('XH r.5 v10','powerD=15&beltSize=XH&beltVelocity=10'+B+'&beltLen=1778');
// XH beltLen / n1 依赖性
q('XH v10 len2133','powerD=20&beltSize=XH&beltVelocity=10&kZ=1&n1=800&z1=24&kA=1.5&alpha1=170&zM=8&beltLen=2133.6');
q('XH v10 n1000','powerD=20&beltSize=XH&beltVelocity=10&kZ=1&n1=1000&z1=24&kA=1.5&alpha1=170&zM=8&beltLen=1778');
// XH 另一 v ratio 0.75
q('XH v8 Pd20','powerD=20&beltSize=XH&beltVelocity=8'+B+'&beltLen=1778');
q('XH v10 kZ0.8','powerD=20&beltSize=XH&beltVelocity=10&kZ=0.8&n1=800&z1=24&kA=1.5&alpha1=170&zM=5&beltLen=1778');
// XXH ratio=1 (bs=127)
q('XXH r1 v10','powerD=50&beltSize=XXH&beltVelocity=10'+B+'&beltLen=2032');
q('XXH r1 v11','powerD=55&beltSize=XXH&beltVelocity=11'+B+'&beltLen=2032');
q('XXH r1 v12','powerD=60&beltSize=XXH&beltVelocity=12'+B+'&beltLen=2032');
// XXH 其他 ratio
q('XXH r.4 v10','powerD=20&beltSize=XXH&beltVelocity=10'+B+'&beltLen=2032');
q('XXH r.6 v12','powerD=35&beltSize=XXH&beltVelocity=12'+B+'&beltLen=2032');
