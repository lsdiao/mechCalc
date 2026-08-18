#!/bin/bash
B='https://www.mechtool.cn/calculation/cal/calculation_wormDrive3'
q(){
  local n1=$(awk -v v="$2" 'BEGIN{printf "%.9f", v*60000*cos(10*3.14159265358979/180)/(3.14159265358979*100)}')
  for try in 1 2 3; do
    R=$(curl -s --max-time 15 -X POST "$B" -H 'X-Requested-With: XMLHttpRequest' \
      --data-urlencode "gama=10" --data-urlencode "d1=100" --data-urlencode "n1=$n1" \
      --data-urlencode "wormHardness=$3" --data-urlencode "wormWheelMaterial=$1")
    if [ -n "$R" ]; then break; fi
    sleep 3
  done
  echo "mat=$1 hard=$3 vS=$2 n1=$n1 => ${R:-EMPTY}"
  sleep 2.5
}
q 灰铸铁 1.9 "≥45HRC"
q 灰铸铁 1.9 "<45HRC"
q 锡青铜 14.5 "<45HRC"
q 锡青铜 23.5 "≥45HRC"
q 铝铁青铜 7.5 "≥45HRC"
