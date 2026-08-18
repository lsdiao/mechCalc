#!/bin/bash
B='https://www.mechtool.cn/calculation/cal/calculation_wormDrive'
H='X-Requested-With: XMLHttpRequest'
q(){ local ep="$1"; shift; echo "--- $ep $*"; for t in 1 2 3 4; do R=$(curl -s --max-time 20 -X POST "$B$ep" -H "$H" "$@"); [ -n "$R" ] && break; sleep 2; done; echo "$R"; sleep 2; }

echo "== A: wormDrive4 q rounding (m=3.15 d1=35.5 q=11.2698 vs 11.27) =="
q 4 -d 'k=1.2' -d 'torque2=800' -d 'yFa2=2.5' -d 'gama=10' -d 'm=3.15' -d 'd1=35.5' -d 'd2=166.95' -d 'z2=53' -d 'cycleTimes=1000000' -d 'sigmaFAllowableBasic=64'

echo "== B: wormDrive5 intermediate rounding (odd values) =="
q 5 -d 'torque=59.273' -d 'torque2=800.137' -d 'm=3.15' -d 'd1=35.5' -d 'd2=166.95' -d 'distanceL=150.26'

echo "== C: wormDrive3 high gama 33.808 =="
q 3 -d 'gama=33.808' -d 'd1=112' -d 'n1=960' -d 'wormHardness=≥45HRC' -d 'wormWheelMaterial=锡青铜'

echo "== D: wormDrive4 with yBeta/zV2 odd gama 18.435 =="
q 4 -d 'k=1.35' -d 'torque2=1234.5' -d 'yFa2=2.66' -d 'gama=18.435' -d 'm=6.3' -d 'd1=63' -d 'd2=371.7' -d 'z2=59' -d 'cycleTimes=8760000' -d 'sigmaFAllowableBasic=73'

echo "== E: wormDrive1 default-ish =="
q 1 -d 'k=1.2075' -d 'torque2=948.416' -d 'zRou=2.9' -d 'zE=160' -d 'sigmaHAllowable=217.98'
