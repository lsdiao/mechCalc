#!/bin/bash
# speed + parallelism test
URL='https://www.mechtool.cn/calculation/polyvP1Query'
t0=$(date +%s.%N)
for n in 200 300 400 500 600 700 800 900 1000; do
  curl -s -X POST "$URL" --data "beltSize=PJ&n1=$n&de1=20&i=1" -H 'X-Requested-With: XMLHttpRequest' --max-time 25 &
done
wait
echo
t1=$(date +%s.%N)
echo "9 parallel calls took: $(echo "$t1 - $t0" | bc)s"
t0=$(date +%s.%N)
for n in 1100 1200 1300; do
  curl -s -X POST "$URL" --data "beltSize=PJ&n1=$n&de1=20&i=1" -H 'X-Requested-With: XMLHttpRequest' --max-time 25
done
t1=$(date +%s.%N)
echo "3 serial calls took: $(echo "$t1 - $t0" | bc)s"
