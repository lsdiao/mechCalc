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
 * 油箱热平衡计算（oil-tank-balance）。
 * <p>
 * 迁移自 `js/tools/fluid2.js` 工具 5：油质量、散热面积、油箱冷却功率、
 * 热平衡温度与温升时间。
 */
@Component
public class OilTankBalanceTool implements CalcTool {

    @Override
    public String id() {
        return "oil-tank-balance";
    }

    @Override
    public CalcResult compute(Map<String, Object> v) {
        double V = CalcResult.num(v.get("V"));
        double H = CalcResult.num(v.get("H"));
        double k = CalcResult.num(v.get("k"));
        double Ph = CalcResult.num(v.get("Ph"));
        double c = CalcResult.num(v.get("c"));
        double Pc = CalcResult.num(v.get("Pc"));
        double TA = CalcResult.num(v.get("TA"));
        double T = CalcResult.num(v.get("T"));
        if (!(V > 0) || !(k > 0) || !(c > 0)) return CalcResult.fail("请输入有效的油箱体积、传热系数与比热容");

        double m = 0.72 * V;                            // kg（油密度 0.72 kg/L）
        double A = Math.pow(V, 2.0 / 3.0) / 15;         // m²
        double net = H + Ph - Pc;                       // 净发热功率 kW
        double Tb = TA + net * 1000 / (k * A);          // 热平衡温度 ℃
        double Pct = k * A * (T - TA) / 1000;           // 油箱冷却功率 kW
        double t;
        if (T >= Tb) {
            t = 0;
        } else {
            t = (m * c / (k * A)) * Math.log((Tb - TA) / (Tb - T)) / 60; // s
        }
        boolean overTem = Tb > 70;

        CalcResult r = CalcResult.empty();
        r.setSections(Arrays.asList(
            section("油量与散热面积", Arrays.asList(
                row("油质量 m=0.72·V", m, "kg", 1).hl(),
                row("油箱散热面积 A=V^(2/3)/15", A, "m²", 2).hl(),
                row("净发热功率 H+Ph-Pc", net, "kW", 2)
            )),
            section("热平衡结果", Arrays.asList(
                row("热平衡温度 Tb=TA+(H+Ph-Pc)·1000/(k·A)", Tb, "℃", 1).hl(),
                row("油箱冷却功率 Pct=k·A·(T-TA)/1000", Pct, "kW", 2).hl(),
                row("设定油温温升 ΔT=T-T₀", T - TA, "℃", 1),
                row("温升时间 t", t, "s", 1),
                row("温升时间 t", t / 60, "min", 2)
            ))
        ));
        r.setVerdict(overTem
            ? verdict("warn",
                "热平衡温度 " + Fmt.fmt(Tb, 1) + " ℃ 偏高（＞70℃），散热面积不足，建议增大油箱或加装冷却器",
                "液压油长期高于 70℃ 会加速氧化、降低粘度与寿命。")
            : verdict("ok",
                "热平衡温度 " + Fmt.fmt(Tb, 1) + " ℃，油量 " + Fmt.fmt(m) + " kg，散热面积 " + Fmt.fmt(A, 2) + " m²",
                "温升时间按一阶热惯性模型（指数上升）估算，用于评估系统达到设定油温的快慢。"));
        r.setNotes(Arrays.asList(
            "油质量 m=0.72V（V:L，油液密度取 0.72 kg/L）。",
            "散热面积经验式 A=V^(2/3)/15（V:L，A:m²），见原站油箱热平衡说明。",
            "热平衡温度 Tb=TA+(H+Ph-Pc)·1000/(k·A)；油箱冷却功率 Pct=k·A·(T-TA)/1000。",
            "温升时间 t=mc/(kA)·ln((Tb-TA)/(Tb-T))/60(s)；当设定油温 T≥Tb 时系统达不到该温度，t 计为 0。"));
        return r;
    }
}
