#!/bin/bash
# 同步带 API 探针
B='https://www.mechtool.cn/calculation'
H='-H X-Requested-With:XMLHttpRequest'
post(){ echo "### $1 :: $2"; curl -s -m 20 -X POST "$B/$1" -d "$2" $H; echo; sleep 1.2; }

# z1MinQuery 边界
for n1 in 899 900 901 1199 1200 1201 1799 1800 1801 3599 3600 3601 4799 4800 5000; do
  post z1MinQuery "beltSize=H&n1=$n1"
done
for n1 in 100 1500 5000; do
  post z1MinQuery "beltSize=XL&n1=$n1"
  post z1MinQuery "beltSize=XXH&n1=$n1"
  post z1MinQuery "beltSize=XH&n1=$n1"
  post z1MinQuery "beltSize=L&n1=$n1"
  post z1MinQuery "beltSize=MXL&n1=$n1"
  post z1MinQuery "beltSize=XXL&n1=$n1"
done

# timingbelt1 公式逆向
post timingbelt1 'z1=18&z2=18&a0=500&beltSize=H'
post timingbelt1 'z1=18&z2=52&a0=500&beltSize=H'
post timingbelt1 'z1=18&z2=52&a0=400&beltSize=H'
post timingbelt1 'z1=10&z2=30&a0=300&beltSize=XL'
post timingbelt1 'z1=24&z2=48&a0=600&beltSize=L'
post timingbelt1 'z1=22&z2=44&a0=800&beltSize=XH'
post timingbelt1 'z1=22&z2=66&a0=1000&beltSize=XXH'

# timingbeltLenChange
post timingbeltLenChange 'z1=18&z2=52&pitchB=12.7&beltLen=1524'
post timingbeltLenChange 'z1=18&z2=52&pitchB=12.7&beltLen=1371.6'
post timingbeltLenChange 'z1=10&z2=30&pitchB=5.08&beltLen=508'
post timingbeltLenChange 'z1=24&z2=48&pitchB=9.525&beltLen=1219.2'

# timingbelt2
post timingbelt2 'powerD=6&beltSize=H&beltVelocity=5.475&kZ=1&n1=1440&beltLen=1447.8&z1=18&kA=1.5&alpha1=164.15&zM=8'
post timingbelt2 'powerD=6&beltSize=H&beltVelocity=5.475&kZ=1&n1=1440&beltLen=1447.8&z1=18&kA=1.5&alpha1=164.15&zM=5'
post timingbelt2 'powerD=6&beltSize=H&beltVelocity=5.475&kZ=1&n1=1440&beltLen=1447.8&z1=18&kA=1.5&alpha1=164.15&zM=4'
post timingbelt2 'powerD=10&beltSize=H&beltVelocity=5.475&kZ=1&n1=1440&beltLen=1447.8&z1=18&kA=1.5&alpha1=164.15&zM=8'
post timingbelt2 'powerD=6&beltSize=XL&beltVelocity=3.02&kZ=1&n1=1440&beltLen=508&z1=15&kA=1.5&alpha1=170&zM=8'
post timingbelt2 'powerD=6&beltSize=L&beltVelocity=5.8&kZ=1&n1=1440&beltLen=1219.2&z1=16&kA=1.5&alpha1=170&zM=8'
post timingbelt2 'powerD=20&beltSize=XH&beltVelocity=10&kZ=1&n1=800&beltLen=1778&z1=24&kA=1.5&alpha1=170&zM=8'
post timingbelt2 'powerD=40&beltSize=XXH&beltVelocity=10&kZ=1&n1=800&beltLen=2032&z1=24&kA=1.5&alpha1=170&zM=8'
