#!/bin/bash
B='https://www.mechtool.cn/calculation/cal/calculation_wormDrive3'
# args: material hardness vS_list
MAT="$1"; HARD="$2"
shift 2
for v in "$@"; do
  n1=$(awk -v v="$v" 'BEGIN{printf "%.9f", v*60000*cos(10*3.14159265358979/180)/(3.14159265358979*100)}')
  R=$(curl -s -X POST "$B" -H 'X-Requested-With: XMLHttpRequest' \
    --data-urlencode "gama=10" --data-urlencode "d1=100" --data-urlencode "n1=$n1" \
    --data-urlencode "wormHardness=$HARD" --data-urlencode "wormWheelMaterial=$MAT")
  echo "$MAT|$HARD|vS=$v => $R"
  sleep 0.3
done
