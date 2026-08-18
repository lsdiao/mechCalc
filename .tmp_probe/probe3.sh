#!/bin/bash
B='https://www.mechtool.cn/calculation'
H='-H X-Requested-With:XMLHttpRequest'
post(){ echo "### $1 :: $2"; curl -s -m 20 -X POST "$B/$1" -d "$2" $H; echo; sleep 0.8; }
# XH 基例: powerD=20 v=10 kZ=1 n1=800 beltLen=1778 z1=24 kA=1.5 alpha1=170 zM=8 -> powerR=28.06
BASE='powerD=20&beltSize=XH&beltVelocity=10&kZ=1&n1=800&beltLen=1778&z1=24&kA=1.5&alpha1=170&zM=8'
post timingbelt2 "$BASE"
post timingbelt2 "${BASE/beltLen=1778/beltLen=2133.6}"
post timingbelt2 "${BASE/beltLen=2000}"
post timingbelt2 "${BASE/n1=800/n1=900}"
post timingbelt2 "${BASE/n1=800/n1=700}"
post timingbelt2 "${BASE/z1=24/z1=26}"
post timingbelt2 "${BASE/zM=8/zM=6}"
post timingbelt2 "${BASE/alpha1=170/alpha1=150}"
post timingbelt2 "${BASE/beltVelocity=10/beltVelocity=9}"
post timingbelt2 "${BASE/beltVelocity=10/beltVelocity=11}"
post timingbelt2 "${BASE/beltVelocity=10/beltVelocity=12}"
# H 基例复测 powerR（kZ=0.8, ratio=1）→ 9.13
post timingbelt2 'powerD=6&beltSize=H&beltVelocity=5.475&kZ=0.8&n1=1440&beltLen=1447.8&z1=18&kA=1.5&alpha1=164.15&zM=5'
# H v 精确节点 5.4936 (自洽 v) 看是否影响
post timingbelt2 'powerD=6&beltSize=H&beltVelocity=5.4936&kZ=1&n1=1440&beltLen=1447.8&z1=18&kA=1.5&alpha1=164.15&zM=8'
