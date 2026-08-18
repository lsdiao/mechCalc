#!/bin/bash
# mechtool 凸轮分割器计算接口探针
URL="https://www.mechtool.cn/calculation/cal/calculation_camindexer1"
post() {
  desc="$1"; shift
  echo "== $desc"
  curl -s -m 25 -X POST "$URL" \
    -H "Content-Type: application/x-www-form-urlencoded; charset=UTF-8" \
    -H "X-Requested-With: XMLHttpRequest" \
    -H "Referer: https://www.mechtool.cn/calculation/camindexerselection.html" \
    "$@" | python3 -c "import sys,json;d=json.load(sys.stdin);print(json.dumps(d.get('resultData',d),ensure_ascii=False))"
  echo
}

P() { # 公共参数: S θh w1 w2 w3 D De R μ fc η n Tw Tca curve
  for c in '变形正弦曲线(M.S)' '变形梯形曲线(M.T)' '变形等速曲线(M.C.V)' '三共变形正弦(SMS-3)' '三共变形等速(SMCV-3)'; do
    post "曲线[$c] S=$1 θh=$2 n=$8" \
      --data-urlencode "divisions=$1" --data-urlencode "indexAngle=$2" \
      --data-urlencode "w1=$3" --data-urlencode "w2=$4" --data-urlencode "w3=$5" \
      --data-urlencode "turntableDia=$6" --data-urlencode "centerDis=$7" \
      --data-urlencode "supportRadius=1" --data-urlencode "miu=0.001" \
      --data-urlencode "factorC=1" --data-urlencode "efficiency=1" \
      --data-urlencode "inputShaftSpeed=$8" --data-urlencode "torqueW=0" \
      --data-urlencode "torqueCa=0" --data-urlencode "camCurveType=$c"
  done
}

# A. 反解各曲线 am 与 qm：S=2 θh=90 n=1000, w1=8 D=4000 → j1=16; j2=j3=0.005
#    X=(2π/2)*(360*1000/(60*90))²=13962.0776;  Tc=(360/(90*2))*qm*Te=2*qm*Te
P 2 90 8 1 1 4000 100 1000

# B. 反解 g 与 Tf 结构: w1=100,w2=w3=1e-6 → W≈100; Tf=μ*W*g*R/1000=100g (μ=1,R=1000)
post "g探针 μ=1 R=1000 W≈100" \
  --data-urlencode "divisions=2" --data-urlencode "indexAngle=90" \
  --data-urlencode "w1=100" --data-urlencode "w2=0.000001" --data-urlencode "w3=0.000001" \
  --data-urlencode "turntableDia=100" --data-urlencode "centerDis=100" \
  --data-urlencode "supportRadius=1000" --data-urlencode "miu=1" \
  --data-urlencode "factorC=1" --data-urlencode "efficiency=1" \
  --data-urlencode "inputShaftSpeed=10" --data-urlencode "torqueW=0" \
  --data-urlencode "torqueCa=0" --data-urlencode "camCurveType=变形正弦曲线(M.S)"

# C. W 组成验证: S=6,w1=1,w2=10,w3=20 → W=181 → Tf=181g
post "W组成 W=1+6*10+6*20=181" \
  --data-urlencode "divisions=6" --data-urlencode "indexAngle=90" \
  --data-urlencode "w1=1" --data-urlencode "w2=10" --data-urlencode "w3=20" \
  --data-urlencode "turntableDia=100" --data-urlencode "centerDis=100" \
  --data-urlencode "supportRadius=1000" --data-urlencode "miu=1" \
  --data-urlencode "factorC=1" --data-urlencode "efficiency=1" \
  --data-urlencode "inputShaftSpeed=10" --data-urlencode "torqueW=0" \
  --data-urlencode "torqueCa=0" --data-urlencode "camCurveType=变形正弦曲线(M.S)"

# D. R 线性验证: 同 C 但 R=500 → Tf 应减半
post "R线性 R=500" \
  --data-urlencode "divisions=6" --data-urlencode "indexAngle=90" \
  --data-urlencode "w1=1" --data-urlencode "w2=10" --data-urlencode "w3=20" \
  --data-urlencode "turntableDia=100" --data-urlencode "centerDis=100" \
  --data-urlencode "supportRadius=500" --data-urlencode "miu=1" \
  --data-urlencode "factorC=1" --data-urlencode "efficiency=1" \
  --data-urlencode "inputShaftSpeed=10" --data-urlencode "torqueW=0" \
  --data-urlencode "torqueCa=0" --data-urlencode "camCurveType=变形正弦曲线(M.S)"

# E. Tca 加法验证: μ≈0 使 Tf≈0.00098, Tca=123.456
post "Tca加法 123.456" \
  --data-urlencode "divisions=2" --data-urlencode "indexAngle=90" \
  --data-urlencode "w1=100" --data-urlencode "w2=0.000001" --data-urlencode "w3=0.000001" \
  --data-urlencode "turntableDia=100" --data-urlencode "centerDis=100" \
  --data-urlencode "supportRadius=1000" --data-urlencode "miu=0.001" \
  --data-urlencode "factorC=1" --data-urlencode "efficiency=1" \
  --data-urlencode "inputShaftSpeed=10" --data-urlencode "torqueW=0" \
  --data-urlencode "torqueCa=123.456" --data-urlencode "camCurveType=变形正弦曲线(M.S)"

# F. Tw/Tt 结构: Tw=7.5 → Tt=Ti+Tf+7.5
post "Tw加法 7.5" \
  --data-urlencode "divisions=6" --data-urlencode "indexAngle=270" \
  --data-urlencode "w1=11.026" --data-urlencode "w2=3" --data-urlencode "w3=0.25" \
  --data-urlencode "turntableDia=300" --data-urlencode "centerDis=200" \
  --data-urlencode "supportRadius=100" --data-urlencode "miu=0.15" \
  --data-urlencode "factorC=2" --data-urlencode "efficiency=0.6" \
  --data-urlencode "inputShaftSpeed=80" --data-urlencode "torqueW=7.5" \
  --data-urlencode "torqueCa=0" --data-urlencode "camCurveType=变形正弦曲线(M.S)"

# G. η 对 Tc 无影响、P∝1/η: η=0.5
post "η=0.5" \
  --data-urlencode "divisions=6" --data-urlencode "indexAngle=270" \
  --data-urlencode "w1=11.026" --data-urlencode "w2=3" --data-urlencode "w3=0.25" \
  --data-urlencode "turntableDia=300" --data-urlencode "centerDis=200" \
  --data-urlencode "supportRadius=100" --data-urlencode "miu=0.15" \
  --data-urlencode "factorC=2" --data-urlencode "efficiency=0.5" \
  --data-urlencode "inputShaftSpeed=80" --data-urlencode "torqueW=0" \
  --data-urlencode "torqueCa=0" --data-urlencode "camCurveType=变形正弦曲线(M.S)"

# H. fc 作用: fc=3 → Te=3*Tt
post "fc=3" \
  --data-urlencode "divisions=6" --data-urlencode "indexAngle=270" \
  --data-urlencode "w1=11.026" --data-urlencode "w2=3" --data-urlencode "w3=0.25" \
  --data-urlencode "turntableDia=300" --data-urlencode "centerDis=200" \
  --data-urlencode "supportRadius=100" --data-urlencode "miu=0.15" \
  --data-urlencode "factorC=3" --data-urlencode "efficiency=0.6" \
  --data-urlencode "inputShaftSpeed=80" --data-urlencode "torqueW=0" \
  --data-urlencode "torqueCa=0" --data-urlencode "camCurveType=变形正弦曲线(M.S)"

# I. j2/j3 随 De²: De=100 (其余同默认) → j2=6*3*(0.05)²=0.045
post "De=100" \
  --data-urlencode "divisions=6" --data-urlencode "indexAngle=270" \
  --data-urlencode "w1=11.026" --data-urlencode "w2=3" --data-urlencode "w3=0.25" \
  --data-urlencode "turntableDia=300" --data-urlencode "centerDis=100" \
  --data-urlencode "supportRadius=100" --data-urlencode "miu=0.15" \
  --data-urlencode "factorC=2" --data-urlencode "efficiency=0.6" \
  --data-urlencode "inputShaftSpeed=80" --data-urlencode "torqueW=0" \
  --data-urlencode "torqueCa=0" --data-urlencode "camCurveType=变形正弦曲线(M.S)"

# J. α 随 S/n/θh 幂次: S=3, θh=180, n=400
post "α幂次 S=3 θh=180 n=400" \
  --data-urlencode "divisions=3" --data-urlencode "indexAngle=180" \
  --data-urlencode "w1=1" --data-urlencode "w2=1" --data-urlencode "w3=1" \
  --data-urlencode "turntableDia=100" --data-urlencode "centerDis=100" \
  --data-urlencode "supportRadius=1" --data-urlencode "miu=0.001" \
  --data-urlencode "factorC=1" --data-urlencode "efficiency=1" \
  --data-urlencode "inputShaftSpeed=400" --data-urlencode "torqueW=0" \
  --data-urlencode "torqueCa=0" --data-urlencode "camCurveType=变形正弦曲线(M.S)"
