#!/bin/bash
U="https://www.mechtool.cn/calculation/cal/calculation_wormDrive3"
U4="https://www.mechtool.cn/calculation/cal/calculation_wormDrive4"
scan() { # n1 hardness material
  curl -s -m 15 -X POST "$U" --data-urlencode "gama=11.31" --data-urlencode "d1=80" \
    --data-urlencode "n1=$1" --data-urlencode "wormHardness=$2" --data-urlencode "wormWheelMaterial=$3"
  echo " <- n1=$1 $2 $3"
}
# 精确节点：n1 = vS/0.0042718
scan 2.3408  "≥45HRC" "锡青铜"   # vS=0.01
scan 11.7038 "≥45HRC" "锡青铜"   # vS=0.05
scan 23.4076 "≥45HRC" "锡青铜"   # vS=0.1
scan 58.519  "≥45HRC" "锡青铜"   # vS=0.25
scan 117.038 "≥45HRC" "锡青铜"   # vS=0.5
scan 234.076 "≥45HRC" "锡青铜"   # vS=1
scan 351.114 "≥45HRC" "锡青铜"   # vS=1.5
scan 468.152 "≥45HRC" "锡青铜"   # vS=2
scan 585.190 "≥45HRC" "锡青铜"   # vS=2.5
scan 702.228 "≥45HRC" "锡青铜"   # vS=3
scan 936.304 "≥45HRC" "锡青铜"   # vS=4
scan 1170.380 "≥45HRC" "锡青铜"  # vS=5
scan 1872.608 "≥45HRC" "锡青铜"  # vS=8
scan 2340.760 "≥45HRC" "锡青铜"  # vS=10
scan 3511.140 "≥45HRC" "锡青铜"  # vS=15
scan 5851.900 "≥45HRC" "锡青铜"  # vS=25
scan 5851.9000 "≥45HRC" "锡青铜" # dup sanity
# <45HRC 锡青铜节点
for n1 in 11.7038 117.038 234.076 585.190 1170.380 1872.608; do
  scan $n1 "<45HRC" "锡青铜"
done
# 铝铁青铜节点
for n1 in 11.7038 117.038 234.076 585.190 1170.380 1872.608; do
  scan $n1 "≥45HRC" "铝铁青铜"
done
# 灰铸铁小 vS 测试
for n1 in 23.4076 117.038 234.076; do
  scan $n1 "≥45HRC" "灰铸铁"
done
# gama 变化验证 vS/zV2/yBeta（wd3 + wd4）
curl -s -m 15 -X POST "$U" --data-urlencode "gama=20" --data-urlencode "d1=80" --data-urlencode "n1=1450" --data-urlencode "wormHardness=≥45HRC" --data-urlencode "wormWheelMaterial=锡青铜"; echo " <- gama=20 wd3"
curl -s -m 15 -X POST "$U4" -d "k=1.2075&torque2=948.4&yFa2=2.87&gama=20&m=8&d1=80&d2=328&z2=41&cycleTimes=52200000&sigmaFAllowableBasic=56"; echo " <- gama=20 wd4"
curl -s -m 15 -X POST "$U4" -d "k=1.2075&torque2=948.4&yFa2=2.87&gama=5&m=8&d1=80&d2=328&z2=41&cycleTimes=52200000&sigmaFAllowableBasic=56"; echo " <- gama=5 wd4"
