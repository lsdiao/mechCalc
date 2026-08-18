# 普通圆柱蜗杆传动设计计算 — mechtool.cn 1:1 复刻探针记录

页面：https://www.mechtool.cn/calculation/wormandwormwheeldrive.html
JS：/dist/js/mechtool/wormandwormwheeldrive.min.js（美化件 worm_drive.pretty.js）
端点：`POST https://www.mechtool.cn/calculation/cal/calculation_wormDrive{1..6}`（表单编码 + `X-Requested-With: XMLHttpRequest`，返回 JSON `{flag, resultData}`）

## 端点清单

| 端点 | 参数 | 返回 resultData |
|---|---|---|
| wormDrive1 | k, torque2, zRou, zE, sigmaHAllowable | 最小中心距 a（数值，2位小数） |
| wormDrive2 | m, z2, z1, d1, a | {m2d1, q, x2, d2, gama}（q/x2/d2/gama 2~3位小数） |
| wormDrive3 | gama, d1, n1, wormHardness(≥45HRC/<45HRC), wormWheelMaterial(锡青铜/铝铁青铜/灰铸铁) | {phiV, efficiency, vS}（3位小数；vS 超表适用范围 flag:false） |
| wormDrive4 | k, torque2, yFa2, gama, m, d1, d2, z2, cycleTimes, sigmaFAllowableBasic | {yBeta, zV2, kFN, sigmaFAllowable, sigmaF} |
| wormDrive5 | torque, torque2, m, d1, d2, distanceL | {forceT1, forceR1, dF1, inertia, maxY, yAllowable} |
| wormDrive6 | efficiency, t0, t1, alphaD, power | {coolingArea, minCoolingArea}（2位小数） |

## 由探针反推的服务端公式（共 247 组单元验证 + 9 组全链验证）

- wormDrive1：`a = ∛(K·T₂·10³·(ZE·Zρ)²/[σH]²)` → round2
- wormDrive2：`m²d1=m²·d1`、`q=d1/m`、`d2=m·z2`（round2）；`x2=a/m−(d1+m·z2)/(2m)`（round3）；`γ=arctan(z1·m/d1)`（round3）
- wormDrive3：`vS=πd1·n1/(60000·cosγ)`（原值查表）；fv 按 vS 在当量摩擦系数表中**线性插值**（φV=arctan fv）；`η=0.95·tanγ/tan(γ+φV)`（**η 用未舍入 φV**，vS/φV/η 均 round3）。fv 表（vS 节点→fv）：
  - 锡青铜+≥45HRC：0.01→0.110、0.05→0.090、0.10→0.080、0.25→0.065、0.50→0.055、1.0→0.045、1.5→0.040、2.0→0.035、2.5→0.030、3.0→0.028、4.0→0.024、5.0→0.022、8.0→0.018、10→0.016、15→0.014、24→0.013（vS∈(0.01,24)）
  - 锡青铜+<45HRC：0.01→0.120、0.05→0.100、0.10→0.090、0.25→0.075、0.50→0.065、1.0→0.055、1.5→0.050、2.0→0.045、2.5→0.040、3.0→0.035、4.0→0.031、5.0→0.029、8.0→0.026、10→0.024、15→0.020（vS∈(0.01,15)）
  - 铸铝铁青铜（两种硬度同表）：0.01→0.180、0.05→0.140、0.10→0.130、0.25→0.100、0.50→0.090、1.0→0.070、1.5→0.065、2.0→0.055、2.5→0.050、3.0→0.045、4.0→0.040、5.0→0.035、8.0→0.030（vS∈(0.01,8)；灰铸铁+≥45HRC 亦用此表但仅 vS∈(0.01,2)）
  - 灰铸铁+<45HRC：0.01→0.190、0.05→0.160、0.10→0.140、0.25→0.120、0.50→0.100、1.0→0.090、1.5→0.080、2.0→0.070（仅 vS∈(0.01,2)）
- wormDrive4：`Yβ=1−γ/140`（round2，σF 用未舍入值）；`Zv2=z2/cos³γ`（round2）；`KFN=(10⁶/N)^(1/9)`（N∈[10⁵,2.5×10⁸] 截断，round3，许用应力用未舍入值）；`[σF]=[σF]′·KFN`、`σF=1.53KT₂·10³·YFa2·Yβ/(m³·q·z2)`（q=d1/m 用未舍入值，round2）
- wormDrive5：`Ft1=2T·10³/d1`、`Fr1=2T₂·10³·tan20°/d2`、`df1=d1−2.4m`、`I=πdf1⁴/64`、`y=√(Ft1²+Fr1²)·L′³/(48EI)`（E=206000MPa，全用未舍入原值）、`[y]=d1/1000`（round2；y/[y] round4）
- wormDrive6：`S=1000P(1−η)/(αd(t0−t1))`、`Smin=1000P(1−η)/(αd(80−t1))` → round2
- 前端链式规则（worm_drive.pretty.js）：`T=9550P/n1`（round3）、`i=n1/n2` 或直输、z1 推荐 i=5~6→6、7~8→4、9~13→4(3)、14~24→2(4,3)、25~27→2(3)、28~40→1(2)、>40→1；`z2′=round(z1′·i)`、`η0=(100−3.5√(z2′/z1′))/100`（round3）、`T2=(z2′/z1′)·η0·T`（round3）、`K=KA·KV·Kβ`（round4）、`N=60n2·j·L`、锡青铜 `KHN=(10⁷/N)^(1/8)`（N∈[2.6×10⁵,2.5×10⁸] 截断）、铝铁青铜/灰铸铁 N 取 10⁷（KHN=1）、`[σH]=[σH]′·KHN`（round2）、`Zρ=8.809524(d1/a)²−9.583333(d1/a)+5.177143`（round2）；选定后须验算 `d1/a ≥ 假设值`；`L′` 缺省取 `0.9·d2`（round1）

## 单元探针记录（原始返回，离线回归数据）

### wormDrive1（2位小数）
| k | torque2 | zRou | zE | sigmaHAllowable | 返回 resultData |
|---|---|---|---|---|---|
| 1.2075 | 948.4 | 2.9 | 160 | 217.98 | 173.13 |
| 1 | 1000 | 3 | 160 | 200 | 179.26 |
| 1.5 | 2500.5 | 2.5 | 155 | 180.5 | 258.56 |
| 2.05 | 123.456 | 3.1 | 160 | 130 | 154.45 |
| 1.2075 | 948.4 | 2.9 | 160 | 217.985 | 173.12 |
| 1.2075 | 948.416 | 2.9 | 160 | 217.98 | 173.13 |

### wormDrive2
| m | z2 | z1 | d1 | a | 返回 resultData |
|---|---|---|---|---|---|
| 8 | 41 | 2 | 80 | 200 | `{"m2d1":5120,"q":10,"x2":-0.5,"d2":328,"gama":11.31}` |
| 10 | 31 | 4 | 90 | 250 | `{"m2d1":9000,"q":9,"x2":5,"d2":310,"gama":23.962}` |
| 5 | 71 | 1 | 50 | 200 | `{"m2d1":1250,"q":10,"x2":-0.5,"d2":355,"gama":5.711}` |
| 3.15 | 53 | 2 | 35.5 | 125 | `{"m2d1":352.25,"q":11.27,"x2":7.548,"d2":166.95,"gama":10.063}` |
| 12.5 | 29 | 6 | 112 | 250 | `{"m2d1":17500,"q":8.96,"x2":1.02,"d2":362.5,"gama":33.808}` |
| 2 | 40 | 1 | 22.4 | 63 | `{"m2d1":89.6,"q":11.2,"x2":5.9,"d2":80,"gama":5.102}` |

### wormDrive3（定点）
| gama | d1 | n1 | wormHardness | wormWheelMaterial | 返回 resultData |
|---|---|---|---|---|---|
| 11.31 | 80 | 1450 | ≥45HRC | 锡青铜 | `{"phiV":1.169,"efficiency":0.859,"vS":6.194}` |
| 18.435 | 45 | 2900 | ≥45HRC | 铝铁青铜 | `{"phiV":1.794,"efficiency":0.859,"vS":7.203}` |
| 10 | 100 | 333 | ≥45HRC | 锡青铜 | `{"phiV":2.136,"efficiency":0.779,"vS":1.77}` |
| 33.808 | 112 | 960 | ≥45HRC | 锡青铜 | `{"phiV":1.125,"efficiency":0.911,"vS":6.775}` |
| 5.5 | 63 | 960 | <45HRC | 灰铸铁 | flag:false（vS≈3.17≥2 出界） |

### wormDrive3（φV 表全量扫描：gama=10、d1=100，vS=0.01~25，n1=vS·60000·cos10°/(π·100)）

原始返回见 `phiv_xc_45.txt`、`phiv_xc_45less.txt`、`phiv_lqt_45.txt`、`phiv_lqt_45less.txt`、`phiv_htz_45.txt`、`phiv_htz_45less.txt`（各 35 行，含出界 flag:false 行），插值模型逐行验证一致（247 组汇总于 fit_all_worm.js）。要点：

- 各表 vS 下界 0.01 处 flag:false（排他下界）；锡青铜≥45HRC 上界 24、<45HRC 上界 15、铝铁青铜上界 8、灰铸铁上界 2（vS≥上界 flag:false，灰铸铁实测 1.99 可算、2.0 起 false）
- 铝铁青铜两种硬度返回完全相同（同表）；灰铸铁+≥45HRC 用铝铁青铜表但值域截断到 vS<2

### wormDrive4
| k | torque2 | yFa2 | gama | m | d1 | d2 | z2 | cycleTimes | sigmaFAllowableBasic | 返回 resultData |
|---|---|---|---|---|---|---|---|---|---|---|
| 1.2075 | 948.4 | 2.87 | 11.31 | 8 | 80 | 328 | 41 | 52200000 | 56 | `{"yBeta":0.92,"kFN":0.644,"sigmaFAllowable":36.09,"sigmaF":22.02,"zV2":43.48}` |
| 1 | 1000 | 2 | 5 | 5 | 50 | 300 | 60 | 1000000 | 40 | `{"yBeta":0.96,"kFN":1,"sigmaFAllowable":40,"sigmaF":39.34,"zV2":60.69}` |
| 1.6 | 3333.3 | 3 | 15 | 10 | 90 | 310 | 31 | 2500000000 | 80 | `{"yBeta":0.89,"kFN":0.541,"sigmaFAllowable":43.32,"sigmaF":78.34,"zV2":34.4}` |
| 1.15 | 555.55 | 2.5 | 8 | 6.3 | 63 | 371.7 | 59 | 50000 | 64 | `{"yBeta":0.94,"kFN":1.292,"sigmaFAllowable":82.66,"sigmaF":15.62,"zV2":60.76}` |
| 1.2075 | 948.4 | 2.87 | 11.31 | 8 | 80 | 328 | 41 | 10000000 | 56 | `{"yBeta":0.92,"kFN":0.774,"sigmaFAllowable":43.36,"sigmaF":22.02,"zV2":43.48}` |
| 1.2 | 800 | 2.5 | 10 | 3.15 | 35.5 | 166.95 | 53 | 1000000 | 64 | `{"yBeta":0.93,"kFN":1,"sigmaFAllowable":64,"sigmaF":182.64,"zV2":55.49}` |
| 1.35 | 1234.5 | 2.66 | 18.435 | 6.3 | 63 | 371.7 | 59 | 8760000 | 73 | `{"yBeta":0.87,"kFN":0.786,"sigmaFAllowable":57.36,"sigmaF":39.92,"zV2":69.1}` |

### wormDrive5
| torque | torque2 | m | d1 | d2 | distanceL | 返回 resultData |
|---|---|---|---|---|---|---|
| 59.27 | 948.4 | 8 | 80 | 328 | 295.2 | `{"forceT1":1481.75,"forceR1":2104.81,"dF1":60.8,"inertia":670786.35,"maxY":0.01,"yAllowable":0.08}` |
| 100 | 2000 | 10 | 90 | 310 | 280 | `{"forceT1":2222.22,"forceR1":4696.39,"dF1":66,"inertia":931420.18,"maxY":0.0124,"yAllowable":0.09}` |
| 12.5 | 250.25 | 4 | 40 | 280 | 250 | `{"forceT1":625,"forceR1":650.6,"dF1":30.4,"inertia":41924.15,"maxY":0.034,"yAllowable":0.04}` |
| 33.33 | 666.66 | 6.3 | 63 | 371.7 | 334.5 | `{"forceT1":1058.1,"forceR1":1305.59,"dF1":47.88,"inertia":257980.25,"maxY":0.0247,"yAllowable":0.063}` |
| 59.273 | 800.137 | 3.15 | 35.5 | 166.95 | 150.26 | `{"forceT1":3339.32,"forceR1":3488.78,"dF1":27.94,"inertia":29914.07,"maxY":0.0554,"yAllowable":0.0355}` |

### wormDrive6
| efficiency | t0 | t1 | alphaD | power | 返回 resultData |
|---|---|---|---|---|---|
| 0.87 | 60 | 20 | 8.5 | 9 | `{"coolingArea":3.44,"minCoolingArea":2.29}` |
| 0.75 | 70 | 30 | 12 | 5.5 | `{"coolingArea":2.86,"minCoolingArea":2.29}` |
| 0.596 | 65 | 25 | 10 | 2.2 | `{"coolingArea":2.22,"minCoolingArea":1.62}` |
| 0.8 | 60 | 20 | 15 | 100 | `{"coolingArea":33.33,"minCoolingArea":22.22}` |

## 全链设计探针（9 组：compute() 链式中间量 → 6 端点逐字段比对）

### 案例 1：基准案例：锡青铜+≥45HRC，z1=2，i=20，n1=1450（蜗杆下置减速器，全默认）（全部一致 ✓）

表单输入（非默认项）：``

| 端点 | 请求参数 | API 原始返回 |
|---|---|---|
| calculation_wormDrive1 | k=1.2075, torque2=999.393, zRou=2.9, zE=160, sigmaHAllowable=217.98 | `{"dataList":null,"errorMsg":null,"flag":true,"resultData":176.17}` |
| calculation_wormDrive2 | m=8, z2=41, z1=2, d1=80, a=200 | `{"dataList":null,"errorMsg":null,"flag":true,"resultData":{"m2d1":5120,"q":10,"x2":-0.5,"d2":328,"gama":11.31}}` |
| calculation_wormDrive3 | gama=11.31, d1=80, n1=1450, wormHardness=≥45HRC, wormWheelMaterial=锡青铜 | `{"dataList":null,"errorMsg":null,"flag":true,"resultData":{"phiV":1.169,"efficiency":0.859,"vS":6.194}}` |
| calculation_wormDrive4 | k=1.2075, torque2=999.393, yFa2=2.87, gama=11.31, m=8, d1=80, d2=328, z2=41, cycleTimes=52200000, sigmaFAllowableBasic=56 | `{"dataList":null,"errorMsg":null,"flag":true,"resultData":{"yBeta":0.92,"kFN":0.644,"sigmaF":23.2,"sigmaFAllowable":36.09,"zV2":43.48}}` |
| calculation_wormDrive5 | torque=59.276, torque2=999.393, m=8, d1=80, d2=328, distanceL=295.2 | `{"dataList":null,"errorMsg":null,"flag":true,"resultData":{"forceR1":2217.98,"yAllowable":0.08,"forceT1":1481.9,"inertia":670786.35,"maxY":0.0103,"dF1":60.8}}` |
| calculation_wormDrive6 | efficiency=0.859, t0=60, t1=20, alphaD=8.5, power=9 | `{"dataList":null,"errorMsg":null,"flag":true,"resultData":{"coolingArea":3.73,"minCoolingArea":2.49}}` |

### 案例 2：锡青铜+<45HRC（砂型 ZCuSn10P1），z1=4，i=10，n1=2900 高速（全部一致 ✓）

表单输入（非默认项）：`power=5.5，n1=2900，transmissionRatio=10，n2=，wormHardness=<45HRC，basicSigmaHAllowable=150，kA=1，kV=1.1，centerDisAFinal=125，d1=50，m=5，z1=4，z2=40，yFa2=2.3，sigmaFAllowableBasic=40`

| 端点 | 请求参数 | API 原始返回 |
|---|---|---|
| calculation_wormDrive1 | k=1.1, torque2=161.016, zRou=2.9, zE=160, sigmaHAllowable=102.59 | `{"dataList":null,"errorMsg":null,"flag":true,"resultData":153.59}` |
| calculation_wormDrive2 | m=5, z2=40, z1=4, d1=50, a=125 | `{"dataList":null,"errorMsg":null,"flag":true,"resultData":{"m2d1":1250,"q":10,"x2":0,"d2":200,"gama":21.801}}` |
| calculation_wormDrive3 | gama=21.801, d1=50, n1=2900, wormHardness=<45HRC, wormWheelMaterial=锡青铜 | `{"dataList":null,"errorMsg":null,"flag":true,"resultData":{"phiV":1.479,"efficiency":0.883,"vS":8.177}}` |
| calculation_wormDrive4 | k=1.1, torque2=161.016, yFa2=2.3, gama=21.801, m=5, d1=50, d2=200, z2=40, cycleTimes=208800000, sigmaFAllowableBasic=40 | `{"dataList":null,"errorMsg":null,"flag":true,"resultData":{"yBeta":0.84,"kFN":0.552,"sigmaF":10.52,"sigmaFAllowable":22.1,"zV2":49.97}}` |
| calculation_wormDrive5 | torque=18.112, torque2=161.016, m=5, d1=50, d2=200, distanceL=180 | `{"dataList":null,"errorMsg":null,"flag":true,"resultData":{"forceR1":586.05,"yAllowable":0.05,"forceT1":724.48,"inertia":102353.87,"maxY":0.0054,"dF1":38}}` |
| calculation_wormDrive6 | efficiency=0.883, t0=60, t1=20, alphaD=8.5, power=5.5 | `{"dataList":null,"errorMsg":null,"flag":true,"resultData":{"coolingArea":1.89,"minCoolingArea":1.26}}` |

### 案例 3：铝铁青铜 ZCuAl10Fe3+≥45HRC，z1=6，i=6，n1=720 多头大传动（全部一致 ✓）

表单输入（非默认项）：`power=15，n1=720，transmissionRatio=6，n2=，lifeTime=8000，wormWheelMaterial=铝铁青铜，basicSigmaHAllowable=160，kA=1.2，kBeta=1.3，centerDisAFinal=225，d1=90，m=10，z1=6，z2=36，yFa2=2.24，sigmaFAllowableBasic=90，alphaD=10，t0=65，t1=25`

| 端点 | 请求参数 | API 原始返回 |
|---|---|---|
| calculation_wormDrive1 | k=1.638, torque2=1091.086, zRou=2.9, zE=160, sigmaHAllowable=160 | `{"dataList":null,"errorMsg":null,"flag":true,"resultData":246.79}` |
| calculation_wormDrive2 | m=10, z2=36, z1=6, d1=90, a=225 | `{"dataList":null,"errorMsg":null,"flag":true,"resultData":{"m2d1":9000,"q":9,"x2":0,"d2":360,"gama":33.69}}` |
| calculation_wormDrive3 | gama=33.69, d1=90, n1=720, wormHardness=≥45HRC, wormWheelMaterial=铝铁青铜 | `{"dataList":null,"errorMsg":null,"flag":true,"resultData":{"phiV":2.268,"efficiency":0.873,"vS":4.078}}` |
| calculation_wormDrive4 | k=1.638, torque2=1091.086, yFa2=2.24, gama=33.69, m=10, d1=90, d2=360, z2=36, cycleTimes=57600000, sigmaFAllowableBasic=90 | `{"dataList":null,"errorMsg":null,"flag":true,"resultData":{"yBeta":0.76,"kFN":0.637,"sigmaF":14.36,"sigmaFAllowable":57.36,"zV2":62.5}}` |
| calculation_wormDrive5 | torque=198.958, torque2=1091.086, m=10, d1=90, d2=360, distanceL=324 | `{"dataList":null,"errorMsg":null,"flag":true,"resultData":{"forceR1":2206.24,"yAllowable":0.09,"forceT1":4421.29,"inertia":931420.18,"maxY":0.0182,"dF1":66}}` |
| calculation_wormDrive6 | efficiency=0.873, t0=65, t1=25, alphaD=10, power=15 | `{"dataList":null,"errorMsg":null,"flag":true,"resultData":{"coolingArea":4.76,"minCoolingArea":3.46}}` |

### 案例 4：灰铸铁 HT200+≥45HRC，z1=2，i=20，n1=730 低速（vS≈1.56<2）（全部一致 ✓）

表单输入（非默认项）：`power=2.2，n1=730，n2=，wormWheelMaterial=灰铸铁，basicSigmaHAllowable=154，kA=1，kV=1，centerDisAFinal=100，d1=40，m=4，z2=40，yFa2=2.47，sigmaFAllowableBasic=48，alphaD=12，t0=70，t1=25`

| 端点 | 请求参数 | API 原始返回 |
|---|---|---|
| calculation_wormDrive1 | k=1, torque2=485.248, zRou=2.9, zE=160, sigmaHAllowable=154 | `{"dataList":null,"errorMsg":null,"flag":true,"resultData":163.93}` |
| calculation_wormDrive2 | m=4, z2=40, z1=2, d1=40, a=100 | `{"dataList":null,"errorMsg":null,"flag":true,"resultData":{"m2d1":640,"q":10,"x2":0,"d2":160,"gama":11.31}}` |
| calculation_wormDrive3 | gama=11.31, d1=40, n1=730, wormHardness=≥45HRC, wormWheelMaterial=灰铸铁 | `{"dataList":null,"errorMsg":null,"flag":true,"resultData":{"phiV":3.651,"efficiency":0.711,"vS":1.559}}` |
| calculation_wormDrive4 | k=1, torque2=485.248, yFa2=2.47, gama=11.31, m=4, d1=40, d2=160, z2=40, cycleTimes=26640000, sigmaFAllowableBasic=48 | `{"dataList":null,"errorMsg":null,"flag":true,"resultData":{"yBeta":0.92,"kFN":0.694,"sigmaF":65.85,"sigmaFAllowable":33.33,"zV2":42.42}}` |
| calculation_wormDrive5 | torque=28.781, torque2=485.248, m=4, d1=40, d2=160, distanceL=144 | `{"dataList":null,"errorMsg":null,"flag":true,"resultData":{"forceR1":2207.7,"yAllowable":0.04,"forceT1":1439.05,"inertia":41924.15,"maxY":0.019,"dF1":30.4}}` |
| calculation_wormDrive6 | efficiency=0.711, t0=70, t1=25, alphaD=12, power=2.2 | `{"dataList":null,"errorMsg":null,"flag":true,"resultData":{"coolingArea":1.18,"minCoolingArea":0.96}}` |

### 案例 5：灰铸铁 HT150+<45HRC（蜗杆未淬火），z1=1，i=40，n1=960 单头大传动比（全部一致 ✓）

表单输入（非默认项）：`power=1.5，n1=960，transmissionRatio=40，n2=，lifeTime=20000，wormWheelMaterial=灰铸铁，wormHardness=<45HRC，basicSigmaHAllowable=106，kV=1，centerDisAFinal=64，d1=28，m=2.5，z1=1，z2=40，yFa2=2.49，sigmaFAllowableBasic=40，alphaD=10，t0=65，t1=25`

| 端点 | 请求参数 | API 原始返回 |
|---|---|---|
| calculation_wormDrive1 | k=1.15, torque2=464.97, zRou=2.9, zE=160, sigmaHAllowable=106 | `{"dataList":null,"errorMsg":null,"flag":true,"resultData":217.19}` |
| calculation_wormDrive2 | m=2.5, z2=40, z1=1, d1=28, a=64 | `{"dataList":null,"errorMsg":null,"flag":true,"resultData":{"m2d1":175,"q":11.2,"x2":0,"d2":100,"gama":5.102}}` |
| calculation_wormDrive3 | gama=5.102, d1=28, n1=960, wormHardness=<45HRC, wormWheelMaterial=灰铸铁 | `{"dataList":null,"errorMsg":null,"flag":true,"resultData":{"phiV":4.673,"efficiency":0.492,"vS":1.413}}` |
| calculation_wormDrive4 | k=1.15, torque2=464.97, yFa2=2.49, gama=5.102, m=2.5, d1=28, d2=100, z2=40, cycleTimes=28800000, sigmaFAllowableBasic=40 | `{"dataList":null,"errorMsg":null,"flag":true,"resultData":{"yBeta":0.96,"kFN":0.688,"sigmaF":280.41,"sigmaFAllowable":27.54,"zV2":40.48}}` |
| calculation_wormDrive5 | torque=14.922, torque2=464.97, m=2.5, d1=28, d2=100, distanceL=90 | `{"dataList":null,"errorMsg":null,"flag":true,"resultData":{"forceR1":3384.7,"yAllowable":0.028,"forceT1":1065.86,"inertia":11499.01,"maxY":0.0228,"dF1":22}}` |
| calculation_wormDrive6 | efficiency=0.492, t0=65, t1=25, alphaD=10, power=1.5 | `{"dataList":null,"errorMsg":null,"flag":true,"resultData":{"coolingArea":1.91,"minCoolingArea":1.39}}` |

### 案例 6：锡青铜 ZCuSn10P1 金属型+≥45HRC，z1=2，i=15，n1=1470 大功率（P=30kW）（全部一致 ✓）

表单输入（非默认项）：`power=30，n1=1470，transmissionRatio=15，n2=，lifeTime=10000，kA=1.2，kV=1.1，kBeta=1.3，centerDisAFinal=250，d1=112，m=12.5，z2=30，yFa2=2.47`

| 端点 | 请求参数 | API 原始返回 |
|---|---|---|
| calculation_wormDrive1 | k=1.716, torque2=2525.878, zRou=2.9, zE=160, sigmaHAllowable=214.76 | `{"dataList":null,"errorMsg":null,"flag":true,"resultData":272.49}` |
| calculation_wormDrive2 | m=12.5, z2=30, z1=2, d1=112, a=250 | `{"dataList":null,"errorMsg":null,"flag":true,"resultData":{"m2d1":17500,"q":8.96,"x2":0.52,"d2":375,"gama":12.583}}` |
| calculation_wormDrive3 | gama=12.583, d1=112, n1=1470, wormHardness=≥45HRC, wormWheelMaterial=锡青铜 | `{"dataList":null,"errorMsg":null,"flag":true,"resultData":{"phiV":0.984,"efficiency":0.879,"vS":8.833}}` |
| calculation_wormDrive4 | k=1.716, torque2=2525.878, yFa2=2.47, gama=12.583, m=12.5, d1=112, d2=375, z2=30, cycleTimes=58800000, sigmaFAllowableBasic=56 | `{"dataList":null,"errorMsg":null,"flag":true,"resultData":{"yBeta":0.91,"kFN":0.636,"sigmaF":28.4,"sigmaFAllowable":35.61,"zV2":32.27}}` |
| calculation_wormDrive5 | torque=194.898, torque2=2525.878, m=12.5, d1=112, d2=375, distanceL=337.5 | `{"dataList":null,"errorMsg":null,"flag":true,"resultData":{"forceR1":4903.17,"yAllowable":0.112,"forceT1":3480.32,"inertia":2219347.5,"maxY":0.0105,"dF1":82}}` |
| calculation_wormDrive6 | efficiency=0.879, t0=60, t1=20, alphaD=8.5, power=30 | `{"dataList":null,"errorMsg":null,"flag":true,"resultData":{"coolingArea":10.68,"minCoolingArea":7.12}}` |

### 案例 7：手动输入分支：T=25 N·m、η0=0.8、T2=650、L′=60，z1=1，i=31，n1=960（全部一致 ✓）

表单输入（非默认项）：`power=，n1=960，torque=25，transmissionRatio=31，n2=，lifeTime=15000，assumeEfficiency=0.8，torque2=650，basicSigmaHAllowable=180，kV=1，kBeta=1.3，centerDisAFinal=42.2，d1=22.4，m=2，z1=1，z2=31，yFa2=2.5，distanceL=60，alphaD=10，t0=65，t1=25`

| 端点 | 请求参数 | API 原始返回 |
|---|---|---|
| calculation_wormDrive1 | k=1.495, torque2=650, zRou=2.9, zE=160, sigmaHAllowable=158.33 | `{"dataList":null,"errorMsg":null,"flag":true,"resultData":202.84}` |
| calculation_wormDrive2 | m=2, z2=31, z1=1, d1=22.4, a=42.2 | `{"dataList":null,"errorMsg":null,"flag":true,"resultData":{"m2d1":89.6,"q":11.2,"x2":0,"d2":62,"gama":5.102}}` |
| calculation_wormDrive3 | gama=5.102, d1=22.4, n1=960, wormHardness=≥45HRC, wormWheelMaterial=锡青铜 | `{"dataList":null,"errorMsg":null,"flag":true,"resultData":{"phiV":2.502,"efficiency":0.635,"vS":1.13}}` |
| calculation_wormDrive4 | k=1.495, torque2=650, yFa2=2.5, gama=5.102, m=2, d1=22.4, d2=62, z2=31, cycleTimes=27900000, sigmaFAllowableBasic=56 | `{"dataList":null,"errorMsg":null,"flag":true,"resultData":{"yBeta":0.96,"kFN":0.691,"sigmaF":1289.42,"sigmaFAllowable":38.69,"zV2":31.37}}` |
| calculation_wormDrive5 | torque=25, torque2=650, m=2, d1=22.4, d2=62, distanceL=60 | `{"dataList":null,"errorMsg":null,"flag":true,"resultData":{"forceR1":7631.63,"yAllowable":0.0224,"forceT1":2232.14,"inertia":4710,"maxY":0.0369,"dF1":17.6}}` |
| calculation_wormDrive6 | efficiency=0.635, t0=65, t1=25, alphaD=10, power=2.513 | `{"dataList":null,"errorMsg":null,"flag":true,"resultData":{"coolingArea":2.29,"minCoolingArea":1.67}}` |

### 案例 8：铝铁青铜+<45HRC，z1=4，i=8，n1=2880（同表验证）（全部一致 ✓）

表单输入（非默认项）：`power=3，n1=2880，transmissionRatio=8，n2=，lifeTime=6000，wormWheelMaterial=铝铁青铜，wormHardness=<45HRC，basicSigmaHAllowable=210，kA=1，kV=1.2，kBeta=1.3，centerDisAFinal=84，d1=40，m=4，z1=4，z2=32，yFa2=2.2，sigmaFAllowableBasic=80，alphaD=15，t0=70，t1=30`

| 端点 | 请求参数 | API 原始返回 |
|---|---|---|
| calculation_wormDrive1 | k=1.56, torque2=71.705, zRou=2.9, zE=160, sigmaHAllowable=210 | `{"dataList":null,"errorMsg":null,"flag":true,"resultData":81.74}` |
| calculation_wormDrive2 | m=4, z2=32, z1=4, d1=40, a=84 | `{"dataList":null,"errorMsg":null,"flag":true,"resultData":{"m2d1":640,"q":10,"x2":0,"d2":128,"gama":21.801}}` |
| calculation_wormDrive3 | gama=21.801, d1=40, n1=2880, wormHardness=<45HRC, wormWheelMaterial=铝铁青铜 | `{"dataList":null,"errorMsg":null,"flag":true,"resultData":{"phiV":1.862,"efficiency":0.867,"vS":6.496}}` |
| calculation_wormDrive4 | k=1.56, torque2=71.705, yFa2=2.2, gama=21.801, m=4, d1=40, d2=128, z2=32, cycleTimes=129600000, sigmaFAllowableBasic=80 | `{"dataList":null,"errorMsg":null,"flag":true,"resultData":{"yBeta":0.84,"kFN":0.582,"sigmaF":15.52,"sigmaFAllowable":46.6,"zV2":39.98}}` |
| calculation_wormDrive5 | torque=9.948, torque2=71.705, m=4, d1=40, d2=128, distanceL=115.2 | `{"dataList":null,"errorMsg":null,"flag":true,"resultData":{"forceR1":407.79,"yAllowable":0.04,"forceT1":497.4,"inertia":41924.15,"maxY":0.0024,"dF1":30.4}}` |
| calculation_wormDrive6 | efficiency=0.867, t0=70, t1=30, alphaD=15, power=3 | `{"dataList":null,"errorMsg":null,"flag":true,"resultData":{"coolingArea":0.67,"minCoolingArea":0.53}}` |

### 案例 9：出界分支：灰铸铁+<45HRC，n1=2900 → vS≈6.19≥2，wormDrive3 应 flag:false（全部一致 ✓）

表单输入（非默认项）：`power=2.2，n1=2900，n2=，wormWheelMaterial=灰铸铁，wormHardness=<45HRC，basicSigmaHAllowable=106，centerDisAFinal=100，d1=40，m=4，z2=40，yFa2=2.47，sigmaFAllowableBasic=40`

| 端点 | 请求参数 | API 原始返回 |
|---|---|---|
| calculation_wormDrive1 | k=1.2075, torque2=122.151, zRou=2.9, zE=160, sigmaHAllowable=106 | `{"dataList":null,"errorMsg":null,"flag":true,"resultData":141.38}` |
| calculation_wormDrive2 | m=4, z2=40, z1=2, d1=40, a=100 | `{"dataList":null,"errorMsg":null,"flag":true,"resultData":{"m2d1":640,"q":10,"x2":0,"d2":160,"gama":11.31}}` |
| calculation_wormDrive3 | gama=11.31, d1=40, n1=2900, wormHardness=<45HRC, wormWheelMaterial=灰铸铁 | `{"dataList":null,"errorMsg":null,"flag":false,"resultData":null}` |
| calculation_wormDrive4 | k=1.2075, torque2=122.151, yFa2=2.47, gama=11.31, m=4, d1=40, d2=160, z2=40, cycleTimes=104400000, sigmaFAllowableBasic=40 | `{"dataList":null,"errorMsg":null,"flag":true,"resultData":{"yBeta":0.92,"kFN":0.597,"sigmaF":20.01,"sigmaFAllowable":23.86,"zV2":42.42}}` |
| calculation_wormDrive5 | torque=7.245, torque2=122.151, m=4, d1=40, d2=160, distanceL=144 | `{"dataList":null,"errorMsg":null,"flag":true,"resultData":{"forceR1":555.74,"yAllowable":0.04,"forceT1":362.25,"inertia":41924.15,"maxY":0.0048,"dF1":30.4}}` |

## 覆盖面说明

- 蜗杆头数 z1 ∈ {1, 2, 4, 6}；蜗轮材料×蜗杆硬度 6 组合（锡青铜/铝铁青铜/灰铸铁 × ≥45HRC/<45HRC）
- 传动比 i ∈ {6, 8, 10, 15, 20, 31, 40}；蜗杆转速 n1 ∈ {720, 730, 960, 1450, 1470, 2880, 2900} r/min
- 手动输入分支：蜗杆转矩 T、初算效率 η₀、蜗轮转矩 T₂、支撑跨距 L′；自动派生分支：P↔T 换算、n₂=n₁/i 取整、L′=0.9d₂、锡青铜 KHN 寿命系数与铝铁青铜/灰铸铁 N=10⁷（KHN=1）
- 出界分支：灰铸铁 vS≥2 m/s → wormDrive3 flag:false（效率无法计算，前端提示手动计算）
- 注：蜗杆传动无「蜗轮上/蜗杆上」布置选项（原站表单亦无此项），以材料副×硬度×头数组合覆盖同等差异面

（本文件由 test_worm.js 在线探针自动生成；生成时间：2026-08-18T11:48:51.602Z）