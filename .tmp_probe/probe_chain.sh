#!/bin/bash
# mechtool.cn 滚子链传动 API 探针
UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
B1='https://www.mechtool.cn/calculation/cal/calculation_rollerChain1'
B2='https://www.mechtool.cn/calculation/cal/calculation_rollerChain2'
run1(){ echo "== rollerChain1: $1"; curl -s -m 20 -X POST "$B1" -d "$1" -H 'X-Requested-With: XMLHttpRequest' -H "User-Agent: $UA"; echo; sleep 1.5; }
run2(){ echo "== rollerChain2: $1"; curl -s -m 20 -X POST "$B2" -d "$1" -H 'X-Requested-With: XMLHttpRequest' -H "User-Agent: $UA"; echo; sleep 1.5; }

run1 'km=1&f1=1&f2=1&power=2.5'
run1 'km=1.75&f1=1&f2=1&power=2.5'
run1 'km=1&f1=1.5&f2=1&power=2.5'
run1 'km=1&f1=1&f2=0.85&power=2.5'
run1 'km=2.5&f1=1.7&f2=1.24&power=10'
run1 'km=1&f1=2.1&f2=0.79&power=100.5'

run2 'a0=9.5&z1=19&z2=48&chainPitch=12.7&n2=106&power=2.5&f1=1&deltaA=0.004&inputFactorF5=1.2'
run2 'a0=20&z1=19&z2=48&chainPitch=12.7&n2=106&power=2.5&f1=1&deltaA=0.004&inputFactorF5=1.2'
run2 'a0=24&z1=21&z2=67&chainPitch=25.4&n2=150&power=7.5&f1=1.5&deltaA=0.003&inputFactorF5=1.1'
run2 'a0=30&z1=25&z2=57&chainPitch=15.875&n2=200&power=5&f1=1.3&deltaA=0.002&inputFactorF5=1.05'
run2 'a0=40&z1=17&z2=100&chainPitch=31.75&n2=90&power=20&f1=1.8&deltaA=0.004&inputFactorF5=1.2'
run2 'a0=50&z1=95&z2=110&chainPitch=76.2&n2=30&power=50&f1=1&deltaA=0.0035&inputFactorF5=1.15'
