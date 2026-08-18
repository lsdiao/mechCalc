#!/bin/bash
B='https://www.mechtool.cn/calculation/cal/calculation_wormDrive'
H='X-Requested-With: XMLHttpRequest'
q(){ # endpoint, data...
  local ep="$1"; shift
  echo "--- $ep $*"
  curl -s -X POST "$B$ep" -H "$H" "$@"
  echo
  sleep 0.3
}
echo "===== WORMDRIVE1 (centerDisA) ====="
q 1 -d 'k=1.2075' -d 'torque2=948.4' -d 'zRou=2.9' -d 'zE=160' -d 'sigmaHAllowable=217.98'
q 1 -d 'k=1.0' -d 'torque2=1000' -d 'zRou=3.0' -d 'zE=160' -d 'sigmaHAllowable=200'
q 1 -d 'k=1.5' -d 'torque2=2500.5' -d 'zRou=2.5' -d 'zE=155' -d 'sigmaHAllowable=180.5'
q 1 -d 'k=2.05' -d 'torque2=123.456' -d 'zRou=3.1' -d 'zE=160' -d 'sigmaHAllowable=130'
q 1 -d 'k=1.2075' -d 'torque2=948.4' -d 'zRou=2.9' -d 'zE=160' -d 'sigmaHAllowable=217.985'
echo "===== WORMDRIVE2 (gama,m2d1,x2,d2,q) ====="
q 2 -d 'm=8' -d 'z2=41' -d 'z1=2' -d 'd1=80' -d 'a=200'
q 2 -d 'm=10' -d 'z2=31' -d 'z1=4' -d 'd1=90' -d 'a=250'
q 2 -d 'm=5' -d 'z2=71' -d 'z1=1' -d 'd1=50' -d 'a=200'
q 2 -d 'm=3.15' -d 'z2=53' -d 'z1=2' -d 'd1=35.5' -d 'a=125'
q 2 -d 'm=12.5' -d 'z2=29' -d 'z1=6' -d 'd1=112' -d 'a=250'
q 2 -d 'm=2' -d 'z2=40' -d 'z1=1' -d 'd1=22.4' -d 'a=63'
echo "===== WORMDRIVE3 decimals (vS rounding, gamma variants) ====="
q 3 -d 'gama=11.31' -d 'd1=80' -d 'n1=1450' -d 'wormHardness=≥45HRC' -d 'wormWheelMaterial=锡青铜'
q 3 -d 'gama=5.5' -d 'd1=63' -d 'n1=960' -d 'wormHardness=<45HRC' -d 'wormWheelMaterial=灰铸铁'
q 3 -d 'gama=18.435' -d 'd1=45' -d 'n1=2900' -d 'wormHardness=≥45HRC' -d 'wormWheelMaterial=铝铁青铜'
q 3 -d 'gama=10' -d 'd1=100' -d 'n1=333' -d 'wormHardness=≥45HRC' -d 'wormWheelMaterial=锡青铜'
echo "===== WORMDRIVE4 (yBeta,zV2,kFN,sigmaFAllowable,sigmaF) ====="
q 4 -d 'k=1.2075' -d 'torque2=948.4' -d 'yFa2=2.87' -d 'gama=11.31' -d 'm=8' -d 'd1=80' -d 'd2=328' -d 'z2=41' -d 'cycleTimes=52200000' -d 'sigmaFAllowableBasic=56'
q 4 -d 'k=1.0' -d 'torque2=1000' -d 'yFa2=2.0' -d 'gama=5' -d 'm=5' -d 'd1=50' -d 'd2=300' -d 'z2=60' -d 'cycleTimes=1000000' -d 'sigmaFAllowableBasic=40'
q 4 -d 'k=1.6' -d 'torque2=3333.3' -d 'yFa2=3.0' -d 'gama=15' -d 'm=10' -d 'd1=90' -d 'd2=310' -d 'z2=31' -d 'cycleTimes=2500000000' -d 'sigmaFAllowableBasic=80'
q 4 -d 'k=1.15' -d 'torque2=555.55' -d 'yFa2=2.5' -d 'gama=8' -d 'm=6.3' -d 'd1=63' -d 'd2=371.7' -d 'z2=59' -d 'cycleTimes=50000' -d 'sigmaFAllowableBasic=64'
q 4 -d 'k=1.2075' -d 'torque2=948.4' -d 'yFa2=2.87' -d 'gama=11.31' -d 'm=8' -d 'd1=80' -d 'd2=328' -d 'z2=41' -d 'cycleTimes=10000000' -d 'sigmaFAllowableBasic=56'
echo "===== WORMDRIVE5 (forceT1,forceR1,dF1,inertia,maxY,yAllowable) ====="
q 5 -d 'torque=59.27' -d 'torque2=948.4' -d 'm=8' -d 'd1=80' -d 'd2=328' -d 'distanceL=295.2'
q 5 -d 'torque=100' -d 'torque2=2000' -d 'm=10' -d 'd1=90' -d 'd2=310' -d 'distanceL=280'
q 5 -d 'torque=12.5' -d 'torque2=250.25' -d 'm=4' -d 'd1=40' -d 'd2=280' -d 'distanceL=250'
q 5 -d 'torque=33.33' -d 'torque2=666.66' -d 'm=6.3' -d 'd1=63' -d 'd2=371.7' -d 'distanceL=334.5'
echo "===== WORMDRIVE6 (coolingArea,minCoolingArea) ====="
q 6 -d 'efficiency=0.87' -d 't0=60' -d 't1=20' -d 'alphaD=8.5' -d 'power=9'
q 6 -d 'efficiency=0.75' -d 't0=70' -d 't1=30' -d 'alphaD=12' -d 'power=5.5'
q 6 -d 'efficiency=0.596' -d 't0=65' -d 't1=25' -d 'alphaD=10' -d 'power=2.2'
q 6 -d 'efficiency=0.8' -d 't0=60' -d 't1=20' -d 'alphaD=15' -d 'power=100'
