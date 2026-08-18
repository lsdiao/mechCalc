#!/bin/bash
URL="https://www.mechtool.cn/calculation/cal/calculation_camindexer1"
q() { # S θh n
  r=$(curl -s -m 25 -X POST "$URL" \
    -H "Content-Type: application/x-www-form-urlencoded; charset=UTF-8" \
    -H "X-Requested-With: XMLHttpRequest" \
    -H "Referer: https://www.mechtool.cn/calculation/camindexerselection.html" \
    --data-urlencode "divisions=$1" --data-urlencode "indexAngle=$2" \
    --data-urlencode "w1=1" --data-urlencode "w2=1" --data-urlencode "w3=1" \
    --data-urlencode "turntableDia=100" --data-urlencode "centerDis=100" \
    --data-urlencode "supportRadius=1" --data-urlencode "miu=0.001" \
    --data-urlencode "factorC=1" --data-urlencode "efficiency=1" \
    --data-urlencode "inputShaftSpeed=$3" --data-urlencode "torqueW=0" \
    --data-urlencode "torqueCa=0" --data-urlencode "camCurveType=变形正弦曲线(M.S)")
  echo "S=$1 θh=$2 n=$3 -> $(echo "$r" | python3 -c "import sys,json;d=json.load(sys.stdin)['resultData'];print('alpha=',d['alpha'],'Ti=',d['torqueI'],'jT=',d['jT'])")"
}
q 6 270 80
q 6 270 90
q 6 270 100
q 6 180 80
q 6 360 80
q 5 270 80
q 4 270 80
q 8 270 80
q 6 90 80
q 2 270 80
q 6 270 81
q 6 269 80
q 12 270 80
q 100 270 80
