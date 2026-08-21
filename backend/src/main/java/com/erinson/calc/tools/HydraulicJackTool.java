package com.erinson.calc.tools;

import com.erinson.calc.common.CalcResult;
import org.springframework.stereotype.Component;

import static com.erinson.calc.common.CalcResult.row;
import static com.erinson.calc.common.CalcResult.section;
import static com.erinson.calc.common.CalcResult.verdict;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

/**
 * 液压千斤顶计算（hydraulic-jack）。
 * <p>
 * 迁移自 `js/tools/fluid2.js` 工具 4：基于帕斯卡原理计算力放大倍率、输出力、
 * 工作压力、输出行程、流量与泵功率，并校核工作压力是否超过上限。
 */
@Component
public class HydraulicJackTool implements CalcTool {

    @Override
    public String id() {
        return "hydraulic-jack";
    }

    @Override
    public CalcResult compute(Map<String, Object> v) {
        double d1 = CalcResult.num(v.get("d1"));
        double f1 = CalcResult.num(v.get("f1"));
        double s1 = CalcResult.num(v.get("s1"));
        double d2 = CalcResult.num(v.get("d2"));
        double plim = CalcResult.num(v.get("plim"));
        double tCycle = CalcResult.num(v.get("tCycle"));
        if (!(d1 > 0) || !(d2 > 0) || !(f1 > 0)) return CalcResult.fail("请输入有效的小/大活塞直径与输入力");

        double A1 = Math.PI * Math.pow(d1 / 1000, 2) / 4;   // m²
        double A2 = Math.PI * Math.pow(d2 / 1000, 2) / 4;   // m²
        double amp = A2 / A1;
        double PPa = f1 / A1;                               // Pa
        double PMPa = PPa / 1e6;
        double F2 = PPa * A2;                               // N
        double s2 = (s1 / 1000) * (A1 / A2) * 1000;         // mm
        double Q = A1 * s1 * 60 / tCycle;                   // L/min
        double pow = f1 * s1 / (1000 * tCycle);             // W
        boolean over = PMPa > plim;

        CalcResult r = CalcResult.empty();
        r.setSections(Arrays.asList(
            section("面积与倍率", Arrays.asList(
                row("小活塞面积 A₁=πd₁²/4", A1, "m²", 6).hl(),
                row("大活塞面积 A₂=πd₂²/4", A2, "m²", 6),
                row("面积比（力放大倍率）", amp, "倍", 1).hl(),
                row("输出/输入行程比", A1 / A2, null, 4)
            )),
            section("输出能力", Arrays.asList(
                row("工作压力 P=F₁/A₁", PMPa, "MPa", 3).hl(),
                row("输出力 F₂=P·A₂", F2, "N", null).hl(),
                row("输出力 F₂", F2 / 1000, "kN", 2),
                row("输出行程 s₂=s₁·(A₁/A₂)", s2, "mm", 2).hl()
            )),
            section("流量与泵功率", Arrays.asList(
                row("所需流量 Q=A₁·s₁·60/t", Q, "L/min", 3).hl(),
                row("泵功率 P=F₁·s₁/t", pow, "W", 2).hl()
            ))
        ));
        r.setVerdict(over
            ? verdict("warn",
                "工作压力 " + Fmt.fmt(PMPa, 2) + " MPa 超过设定上限 " + Fmt.fmt(plim) + " MPa，请增大活塞直径或降低输入力",
                "超压易导致元件泄漏或损坏；工程上作业压力通常控制在 25~30 MPa 内。")
            : verdict("ok",
                "力放大 " + Fmt.fmt(amp, 1) + " 倍，输出力 " + Fmt.fmt(F2) + " N，工作压力 " + Fmt.fmt(PMPa, 3) + " MPa",
                "需要大输出力时应优先增大活塞直径而非盲目提高压力。"));
        r.setNotes(Arrays.asList(
            "帕斯卡原理：压力在连通容器内处处等值，F₂=F₁·(A₂/A₁)=F₁·(d₂/d₁)²。",
            "体积守恒：输入行程 s₁ 对应输出行程 s₂=s₁·(A₁/A₂)，活塞越大行程越小。",
            "流量 Q(单行程) = A₁·s₁·60/t；泵功率 = 输入力×输入速度 = F₁·s₁/t（W）。"));
        return r;
    }
}
