#!/bin/bash
# 用法: scan2.sh TYPE T_START T_END   → 输出 /workspace/.tmp_probe/scan2_TYPE.txt (每行: t zB)
TYPE=$1; TS=$2; TE=$3
OUT=/workspace/.tmp_probe/scan2_${TYPE}_${TS}_${TE}.txt
rm -f "$OUT"
node -e '
var PB={MXL:2.032,XXL:3.175,XL:5.08,L:9.525,H:12.7,XH:22.225,XXH:31.75};
var PI=Math.PI,pb=PB[process.argv[1]],d1=18*pb/PI,d2=20*pb/PI;
function beltL(d1,d2,a){var dl=(d2-d1)/2,th=Math.asin(dl/a);return 2*Math.sqrt(a*a-dl*dl)+(Math.PI-2*th)*d1/2+(Math.PI+2*th)*d2/2;}
function solveA(L){var lo=Math.abs((d2-d1)/2)+1e-4,hi=30000;for(var i=0;i<160;i++){var m=(lo+hi)/2;if(beltL(d1,d2,m)<L)lo=m;else hi=m;}return (lo+hi)/2;}
var out=[];for(var t=+process.argv[2];t<=+process.argv[3];t++)out.push(t+" "+solveA(t*pb).toFixed(9));
console.log(out.join("\n"));
' "$TYPE" "$TS" "$TE" > /tmp/jobs_${TYPE}_${TS}_${TE}.txt
cat /tmp/jobs_${TYPE}_${TS}_${TE}.txt | xargs -P 6 -L 1 bash -c '
  t=$0; a0=$1;
  for k in 1 2 3 4; do
    r=$(curl -s -m 20 -X POST "https://www.mechtool.cn/calculation/timingbelt1" \
      -d "z1=18&z2=20&a0=$a0&beltSize='$TYPE'" -H "X-Requested-With: XMLHttpRequest")
    if [[ "$r" == \{* ]]; then
      zb=$(echo "$r" | node -e "var s=require(\"fs\").readFileSync(0,\"utf8\");try{var j=JSON.parse(s);console.log(j.flag?Math.round(j.resultData.zB):\"FLAG0\")}catch(e){console.log(\"PARSE\")}")
      if [ "$zb" != "PARSE" ]; then echo "$t $zb" >> "'$OUT'"; exit 0; fi
    fi
    sleep 0.3
  done
  echo "$t FAIL" >> "'$OUT'"
'
echo "=== $TYPE $TS..$TE DONE: $(wc -l < $OUT) rows, FAIL=$(grep -c FAIL $OUT || true) ==="
