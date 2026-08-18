#!/bin/bash
# wd3 扫描：vS 由 n1 控制（d1=80, gama=11.31 → vS=0.0042718*n1）
U="https://www.mechtool.cn/calculation/cal/calculation_wormDrive3"
scan() { # $1=n1 $2=hardness $3=material
  curl -s -m 15 -X POST "$U" --data-urlencode "gama=11.31" --data-urlencode "d1=80" \
    --data-urlencode "n1=$1" --data-urlencode "wormHardness=$2" --data-urlencode "wormWheelMaterial=$3"
  echo " <- n1=$1 $2 $3"
}
for n1 in 3 12 23 59 117 234 351 468 585 702 936 1170 1404 1873 2341 3512; do
  scan $n1 "≥45HRC" "锡青铜"
done
# 材料组合检查（vS≈6.19）
scan 1450 "<45HRC" "锡青铜"
scan 1450 "≥45HRC" "铝铁青铜"
scan 1450 "<45HRC" "铝铁青铜"
scan 1450 "≥45HRC" "灰铸铁"
scan 1450 "<45HRC" "灰铸铁"
# 界点附近细扫（vS≈0.25 与 0.5 与 1 与 5 与 8）
for n1 in 57 58 60 115 116 230 231 232 1165 1166 1168 1869 1870 1871 1872; do
  scan $n1 "≥45HRC" "锡青铜"
done
