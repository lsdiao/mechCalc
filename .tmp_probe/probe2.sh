#!/bin/bash
B='https://www.mechtool.cn/calculation'
H='-H X-Requested-With:XMLHttpRequest'
post(){ echo "### $1 :: $2"; curl -s -m 20 -X POST "$B/$1" -d "$2" $H; echo; sleep 1.0; }
BASE='powerD=6&beltSize=H&beltVelocity=5.475&kZ=1&n1=1440&z1=18&kA=1.5&alpha1=164.15&zM=8'
# 因子依赖性排查
post timingbelt2 "$BASE&beltLen=1447.8"
post timingbelt2 "$BASE&beltLen=1524"
post timingbelt2 "$BASE&beltLen=1295.4"
post timingbelt2 "$BASE&beltLen=2540"
post timingbelt2 "powerD=6&beltSize=H&beltVelocity=5.475&kZ=1&n1=1440&beltLen=1447.8&z1=18&kA=1.5&alpha1=170&zM=8"
post timingbelt2 "powerD=6&beltSize=H&beltVelocity=5.475&kZ=1&n1=1440&beltLen=1447.8&z1=20&kA=1.5&alpha1=164.15&zM=8"
post timingbelt2 "powerD=6&beltSize=H&beltVelocity=5.475&kZ=1&n1=1000&beltLen=1447.8&z1=18&kA=1.5&alpha1=164.15&zM=8"
post timingbelt2 "powerD=6&beltSize=H&beltVelocity=5.475&kZ=1&n1=1440&beltLen=1447.8&z1=18&kA=2&alpha1=164.15&zM=8"
post timingbelt2 "powerD=6&beltSize=H&beltVelocity=5.475&kZ=1&n1=1440&beltLen=1447.8&z1=18&kA=1.5&alpha1=164.15&zM=10"
post timingbelt2 "powerD=6&beltSize=H&beltVelocity=5.475&kZ=0.8&n1=1440&beltLen=1447.8&z1=18&kA=1.5&alpha1=164.15&zM=5"
post timingbelt2 "powerD=6&beltSize=H&beltVelocity=5.475&kZ=0.6&n1=1440&beltLen=1447.8&z1=18&kA=1.5&alpha1=164.15&zM=4"
post timingbelt2 "powerD=6&beltSize=H&beltVelocity=6&kZ=1&n1=1440&beltLen=1447.8&z1=18&kA=1.5&alpha1=164.15&zM=8"
post timingbelt2 "powerD=12&beltSize=H&beltVelocity=5.475&kZ=1&n1=1440&beltLen=1447.8&z1=18&kA=1.5&alpha1=164.15&zM=8"
# MXL/XXL/T 型
post timingbelt2 'powerD=0.5&beltSize=MXL&beltVelocity=1&kZ=1&n1=3000&beltLen=508&z1=20&kA=1.5&alpha1=170&zM=8'
post timingbelt2 'powerD=0.5&beltSize=XXL&beltVelocity=1&kZ=1&n1=3000&beltLen=508&z1=20&kA=1.5&alpha1=170&zM=8'
post z1MinQuery 'beltSize=T5&n1=1000'
post timingbelt1 'z1=20&z2=40&a0=400&beltSize=T5'
post timingbelt2 'powerD=1&beltSize=T5&beltVelocity=2&kZ=1&n1=1000&beltLen=1000&z1=20&kA=1.5&alpha1=170&zM=8'
# beltLen 选择机制扫描: H 型 z1=18 z2=52 扫 a0
for a0 in 100 150 200 250 300 350 450 550 650 750 850 950 1100 1300 1500; do
  post timingbelt1 "z1=18&z2=52&a0=$a0&beltSize=H"
done
# L 型与 XH 型扫描
for a0 in 200 350 500 700 900 1200 1500 1800; do
  post timingbelt1 "z1=16&z2=48&a0=$a0&beltSize=L"
done
for a0 in 200 400 600 800 1000 1300 1600 2000; do
  post timingbelt1 "z1=24&z2=48&a0=$a0&beltSize=XH"
done
