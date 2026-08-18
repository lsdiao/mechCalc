#!/bin/bash
B='https://www.mechtool.cn/calculation'
H='-H X-Requested-With:XMLHttpRequest'
post(){ echo "### $2"; curl -s -m 20 -X POST "$B/timingbelt2" -d "$2" $H; echo; sleep 1.5; }
# XH 多 v 点 (kZ=1, Pd=20)
post 'powerD=20&beltSize=XH&beltVelocity=11&kZ=1&n1=800&beltLen=1778&z1=24&kA=1.5&alpha1=170&zM=8'
post 'powerD=20&beltSize=XH&beltVelocity=12&kZ=1&n1=800&beltLen=1778&z1=24&kA=1.5&alpha1=170&zM=8'
post 'powerD=20&beltSize=XH&beltVelocity=5&kZ=1&n1=800&beltLen=1778&z1=24&kA=1.5&alpha1=170&zM=8'
# XXH 多 v 点 (kZ=1, Pd=40)
post 'powerD=40&beltSize=XXH&beltVelocity=9&kZ=1&n1=800&beltLen=2032&z1=24&kA=1.5&alpha1=170&zM=8'
post 'powerD=40&beltSize=XXH&beltVelocity=11&kZ=1&n1=800&beltLen=2032&z1=24&kA=1.5&alpha1=170&zM=8'
# L 有 bs 例: Pd=0.5 v=5.8 -> bs=12.7
post 'powerD=0.5&beltSize=L&beltVelocity=5.8&kZ=1&n1=1440&beltLen=1219.2&z1=16&kA=1.5&alpha1=170&zM=8'
# XL 有 bs 例: Pd=0.05 v=3.02 -> bs=4.8
post 'powerD=0.05&beltSize=XL&beltVelocity=3.02&kZ=1&n1=1440&beltLen=508&z1=15&kA=1.5&alpha1=170&zM=8'
# MXL 有 bs 例: Pd=0.01 v=1 -> bs=3.0
post 'powerD=0.01&beltSize=MXL&beltVelocity=1&kZ=1&n1=3000&beltLen=508&z1=20&kA=1.5&alpha1=170&zM=8'
# XXL 有 bs 例: Pd=0.01 v=1 -> bs=3.0
post 'powerD=0.01&beltSize=XXL&beltVelocity=1&kZ=1&n1=3000&beltLen=508&z1=20&kA=1.5&alpha1=170&zM=8'
# H 有 bs 例: bsMin 82 -> bs=0? Pd=12 给 79.5->bs 0; 试 Pd=6 v=6 (bsMin 40.003 -> 50.8)
post 'powerD=6&beltSize=H&beltVelocity=6&kZ=1&n1=1440&beltLen=1447.8&z1=18&kA=1.5&alpha1=164.15&zM=8'
