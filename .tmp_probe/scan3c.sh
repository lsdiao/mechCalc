#!/bin/bash
U="https://www.mechtool.cn/calculation/cal/calculation_wormDrive3"
scan() { curl -s -m 15 -X POST "$U" --data-urlencode "gama=11.31" --data-urlencode "d1=80" \
  --data-urlencode "n1=$1" --data-urlencode "wormHardness=$2" --data-urlencode "wormWheelMaterial=$3"; echo " <- n1=$1 $2 $3"; }
# 灰铸铁节点+上界
for n1 in 2.3408 11.7038 58.519 351.114 468.152 585.190 702.228 936.304 1170.380 1404.456; do
  scan $n1 "≥45HRC" "灰铸铁"
done
# 锡青铜 <45HRC 缺失节点
for n1 in 2.3408 23.4076 58.519 351.114 468.152 702.228 936.304 2340.760 3511.140; do
  scan $n1 "<45HRC" "锡青铜"
done
# 铝铁青铜缺失节点
for n1 in 2.3408 23.4076 58.519 351.114 468.152 702.228 936.304 2340.760 3511.140 4681.520; do
  scan $n1 "≥45HRC" "铝铁青铜"
done
