#!/bin/bash
URL="https://www.mechtool.cn/calculation/cal/calculation_camindexer1"
for c in '变形梯形曲线(M.T)' '变形等速曲线(M.C.V)' '三共变形正弦(SMS-3)' '三共变形等速(SMCV-3)'; do
  echo "== 默认参数 × [$c]"
  curl -s -m 25 -X POST "$URL" \
    -H "Content-Type: application/x-www-form-urlencoded; charset=UTF-8" \
    -H "X-Requested-With: XMLHttpRequest" \
    -H "Referer: https://www.mechtool.cn/calculation/camindexerselection.html" \
    --data-urlencode "divisions=6" --data-urlencode "indexAngle=270" \
    --data-urlencode "w1=11.026" --data-urlencode "w2=3" --data-urlencode "w3=0.25" \
    --data-urlencode "turntableDia=300" --data-urlencode "centerDis=200" \
    --data-urlencode "supportRadius=100" --data-urlencode "miu=0.15" \
    --data-urlencode "factorC=2" --data-urlencode "efficiency=0.6" \
    --data-urlencode "inputShaftSpeed=80" --data-urlencode "torqueW=0" \
    --data-urlencode "torqueCa=0" --data-urlencode "camCurveType=$c"
  echo
done
