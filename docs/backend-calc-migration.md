# ErinsonCalc 后端计算迁移清单 / 计划

> 目标：把前端 66 个计算工具的 `compute()` 从浏览器 JS 迁移到 JeecgBoot 后端 Java（单例模式），
> 前端保留静态 UI + 异步调用后端 `POST /erinson/calc/{toolId}`。
>
> 当前进度：**骨架已搭**，参考实现 `bolt-check` 完成，其余 65 个处于「待迁移」状态。

## 一、架构

```
浏览器(静态前端: js/app.js + js/tools/*.js)
   │  仅做表单、路由、展示；App.calc() 异步
   ▼  CALC_MODE='remote' 时
POST /erinson/calc/{toolId}   body: {字段key: 值}
   ▼
JeecgBoot 单体后端(backend/)
   CalcController → CalcToolRegistry → CalcTool 实现(Java)
   ▼
CalcResult { sections[], verdict, notes, error }   ← 与前端 renderResult 契约一致
```

- 后端框架：JeecgBoot v3.9.x last（Spring Boot 3.2 + Java 17），单例（单体）部署。
- 搭建方式：先以 `spring-boot-starter-web` 搭计算引擎（本骨架，`backend/` 可独立 `mvn compile`），
  后续按需引入 jeecg-boot-base-core、Sa-Token、代码生成等 Jeecg 业务能力。

## 二、接口契约

- **入参**：`POST /erinson/calc/{toolId}`，body 为 JSON 对象，键 = 前端表单字段 key，值 = 字符串/数值。
  segment/select 字段传 `${`option.value`}` 字符串；number 字段传数值（可传字符串，后端用 `CalcResult.num` 安全转换）。
- **返回** `CalcResult`：
  ```json
  {
    "sections": [ { "title": "载荷计算", "rows": [
        { "label": "螺栓总拉力 F₀", "value": 5200, "unit": "N", "d": null, "hl": true }
    ]}],
    "verdict": { "level": "ok|bad|warn", "text": "...", "note": "..." },
    "notes": ["..."],
    "error": null
  }
  ```
- `hl` 前端渲染高亮；`d` 为小数位数（缺省由前端按数值自动定）。
- 字段 `visible` 联动规则由前端处理，后端只收可见字段的最终值。

## 三、迁移范本

参考实现：[`backend/src/main/java/com/erinson/calc/tools/BoltCheckTool.java`](../backend/src/main/java/com/erinson/calc/tools/BoltCheckTool.java)
- 一个工具一个类，`@Component` + 实现 `CalcTool`（`id()` + `compute(Map)`）。
- `CalcToolRegistry` 自动收集所有 Bean 并注册，无需改路由。
- 数值用 `CalcResult.num(obj)`、字符串用 `CalcResult.str(obj)` 安全取值；返回用 `CalcResult.row/section/verdict` 与 `CalcResult.fail`（错误）。

## 四、66 个工具迁移清单

状态标记：✅ 已完成 | ⬜ 待迁移（迁移时把 ⬜ 改为 ✅，并在 [backend](../backend) 中新建对应 `XxxTool.java`）。

### 连接与校核（connect）
| id | 来源文件 | 状态 |
|----|----------|------|
| bolt-loose | connection.js | ⬜ |
| bolt-reamed | connection.js | ⬜ |
| bolt-transverse | connection.js | ⬜ |
| bolt-check | connection.js | ✅（参考范式） |
| bolt-dynamic | connection.js | ⬜ |
| key-check | connection.js | ⬜ |
| key-half | connection.js | ⬜ |
| key-wedge | connection.js | ⬜ |
| key-tangent | connection.js | ⬜ |
| key-spline-rect | connection.js | ⬜ |
| key-spline-inv | connection.js | ⬜ |
| spring-design | connection.js | ⬜ |
| tension-spring | other1.js | ⬜ |
| rolling-bearing | bearing.js | ⬜ |
| deep-groove-bearing | bearing.js | ⬜ |
| angular-contact-bearing | bearing.js | ⬜ |
| thrust-ball-bearing | bearing.js | ⬜ |
| tapered-roller-bearing | bearing.js | ⬜ |
| shaft-design | bearing.js | ⬜ |
| sealing-o-ring | fluid4.js | ⬜ |

### 直线运动（linear）
| id | 来源文件 | 状态 |
|----|----------|------|
| linear-bearing | linear.js | ⬜ |
| ball-screw | linear.js | ⬜ |
| cable-chain | linear.js | ⬜ |
| linear-guide | other1.js | ⬜ |
| screw-transmission | other1.js | ⬜ |

### 机械传动（trans）
| id | 来源文件 | 状态 |
|----|----------|------|
| v-belt | transmission.js | ⬜ |
| chain-drive-design | trans2_chain.js | ⬜ |
| double-speed-chain | trans2_extra.js | ⬜ |
| timing-belt-design | trans2_timing.js | ⬜ |
| flat-belt-design | trans2_flat.js | ⬜ |
| multi-ribbed-belt | trans2_ribbed.js | ⬜ |
| worm-drive-design | trans2_worm.js | ⬜ |
| cam-indexer-design | trans2_cam.js | ⬜ |
| involute-gear | transmission.js | ⬜ |
| gear-thickness | trans2_extra.js | ⬜ |
| involute-function | math3.js | ⬜ |

### 液压与气压（fluid）
| id | 来源文件 | 状态 |
|----|----------|------|
| hydraulic-cylinder | fluid.js | ⬜ |
| pneumatic-cylinder | fluid.js | ⬜ |
| hydraulic-pipe-loss | fluid2.js | ⬜ |
| hydraulic-pump | fluid2.js | ⬜ |
| hydraulic-motor | fluid2.js | ⬜ |
| hydraulic-jack | fluid2.js | ⬜ |
| oil-tank-balance | fluid2.js | ⬜ |
| pneumatic-finger | fluid3.js | ⬜ |
| cylinder-consumption | fluid3.js | ⬜ |
| pneumatic-circuit | fluid3.js | ⬜ |
| vacuum-suction | fluid3.js | ⬜ |
| water-pump | fluid4.js | ⬜ |

### 选型计算（select）
| id | 来源文件 | 状态 |
|----|----------|------|
| motor-select | selection.js | ⬜ |
| hydraulic-buffer | fluid3.js | ⬜ |

### 工程常用（common）
| id | 来源文件 | 状态 |
|----|----------|------|
| tolerance-query | tolerance.js | ⬜ |
| tolerance-fit-query | tolerance.js | ⬜ |
| shape-tolerance | gdttol.js | ⬜ |
| position-tolerance | gdttol.js | ⬜ |
| hardness-convert | common.js | ⬜ |
| steel-weight | common.js | ⬜ |
| material-weight | common2.js | ⬜ |
| moment-inertia | common.js | ⬜ |
| beam-calculator | common2.js | ⬜ |
| plate-bending | common2.js | ⬜ |
| shell-stress | common2.js | ⬜ |
| mechanism-force | common2.js | ⬜ |
| impact-load | math3.js | ⬜ |
| plate-critical-load | math3.js | ⬜ |
| fastener-calculator | common2.js | ⬜ |

### 信息页（无 compute）
| id | 来源文件 | 状态 |
|----|----------|------|
| cheli-air | fluid3.js | ⬜（信息页，仅展示，无需后端） |

> 注：`cheli-air` 为信息展示页（无计算），可跳过迁移。

## 五、验证方式

1. 后端单项：`cd backend && mvn -s .mvn-settings.xml compile`（骨架阶段）。
   完整工程后续：`mvn spring-boot:run`，端口 `8090`。
2. 前端切换远程：控制台 `App.setCalcBackend({ baseUrl: 'http://localhost:8090', mode: 'remote' })` 后刷新工具页。
3. 回归对齐：迁移一个工具后，用 `tests/run-tests.js` 里同参数断言复测后端返回值与前端 JS 一致。