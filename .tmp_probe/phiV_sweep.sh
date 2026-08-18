#!/bin/bash
# phiV sweep: gama=10, d1=100, n1 = vS*60000*cos(10deg)/(pi*100)
B='https://www.mechtool.cn/calculation/cal/calculation_wormDrive3'
MAT="$1"; HARD="$2"
declare -a VS=(0.01 0.03 0.05 0.08 0.1 0.15 0.25 0.35 0.5 0.75 0.9 1.0 1.1 1.25 1.5 1.75 2.0 2.25 2.5 2.75 3.0 3.5 4.0 4.5 5.0 5.5 6.0 7.0 8.0 9.0 10 12 15 20 25)
for v in "${VS[@]}"; do
  n1=$(awk -v v="$v" 'BEGIN{printf "%.6f", v*60000*cos(10*3.14159265358979/180)/(3.14159265358979*100)}')
  R=$(curl -s -X POST "$B" -H 'X-Requested-With: XMLHttpRequest' \
    --data-urlencode "gama=10" --data-urlencode "d1=100" --data-urlencode "n1=$n1" \
    --data-urlencode "wormHardness=$HARD" --data-urlencode "wormWheelMaterial=$MAT")
  echo "vS_req=$v n1=$n1 => $R"
  sleep 0.35
done
