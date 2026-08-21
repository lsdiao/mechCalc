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
 * 水泵选型（water-pump）。
 * <p>
 * 迁移自 `js/tools/fluid4.js` 工具 2：由流量 Q、扬程 H 求轴功率 P=ρgQH/η，
 * 乘储备系数后圆整标准电机功率，并给出比转速与泵型建议。
 */
@Component
public class WaterPumpTool implements CalcTool {

    /** 配套电机标准功率等级 kW */
    private static final double[] PUMP_MOTOR_KW = {
        0.37, 0.55, 0.75, 1.1, 1.5, 2.2, 3, 4, 5.5, 7.5, 11, 15, 18.5, 22, 30,
        37, 45, 55, 75, 90, 110, 132, 160, 185, 200, 250, 315, 355
    };

    /** 轴功率 -> 配套电机功率储备系数 K（《机械设计手册》泵篇） */
    private static double pumpK(double PkW) {
        if (PkW < 1) return 1.5;
        if (PkW < 5) return 1.25;
        if (PkW < 50) return 1.15;
        return 1.1;
    }

    @Override
    public String id() {
        return "water-pump";
    }

    @Override
    public CalcResult compute(Map<String, Object> v) {
        double Q = CalcResult.num(v.get("Q"));
        double H = CalcResult.num(v.get("H"));
        double rho = CalcResult.num(v.get("rho"));
        double eta = CalcResult.num(v.get("eta"));
        double n = CalcResult.num(v.get("n"));
        if (!(Q > 0) || !(H > 0)) return CalcResult.fail("请输入有效的流量与扬程");
        if (!(eta > 0 && eta <= 1)) return CalcResult.fail("泵效率 η 应在 (0,1] 之间");

        double g = 9.81;
        double Qs = Q / 3600;                       // m³/h -> m³/s
        double Pw = rho * g * Qs * H / eta;         // 轴功率 W
        double PkW = Pw / 1000;                     // 轴功率 kW
        double K = pumpK(PkW);                      // 储备系数
        double Pmotor = PkW * K;                    // 所需电机功率
        double sel = 0;
        for (double m : PUMP_MOTOR_KW) {
            if (m >= Pmotor - 1e-9) { sel = m; break; }
        }
        if (sel == 0) sel = Math.ceil(Pmotor);
        // 比转速 ns = 3.65·n√Q / H^(3/4)
        double ns = n > 0 ? 3.65 * n * Math.sqrt(Qs) / Math.pow(H, 0.75) : 0;
        String pumpType = ns < 30 ? "容积/高扬程小流量类"
            : ns < 80 ? "低速离心泵"
            : ns < 150 ? "正常转速离心泵"
            : ns < 300 ? "高速/混流式" : "轴流式";

        CalcResult r = CalcResult.empty();
        r.setSections(Arrays.asList(
            section("水力参数", Arrays.asList(
                row("体积流量 Q", Q, "m³/h", null).hl(),
                row("扬程 H", H, "m", null).hl(),
                row("质量流量 qm=ρQ", rho * Qs, "kg/s", 2)
            )),
            section("功率计算", Arrays.asList(
                row("轴功率 P=ρgQH/η", PkW, "kW", 3).hl(),
                row("储备系数 K", K, null, 2),
                row("所需配套功率 P·K", Pmotor, "kW", 3).hl(),
                row("圆整标准电机功率", sel, "kW", null).hl()
            )),
            section("泵型与比转速", Arrays.asList(
                row("比转速 n_s=3.65n√Q/H^¾", ns, null, 1).hl(),
                row("泵型判断", pumpType, null, 0)
            ))
        ));
        r.setVerdict(verdict(PkW > 0 ? "ok" : "bad",
            "选配 " + Fmt.fmt(sel) + " kW 电机（轴功率 " + Fmt.fmt(PkW, 3) + " kW，储备 " + Fmt.fmt(K, 2)
                + "），泵型倾向：" + pumpType,
            "实际选型应校核流量-扬程匹配工作点；比转速偏大（>300）宜选轴流泵，偏小（<30）建议容积泵。"));
        r.setNotes(Arrays.asList(
            "轴功率 P = ρgQH/η（Q:m³/s，P:W）；界面 Q 以 m³/h 输入，换算 Q(m³/s)=Q(m³/h)/3600。",
            "配套电机功率 = 轴功率 × 储备系数 K（小泵 K=1.25~1.5，大泵 K=1.1~1.15）。",
            "比转速 n_s=3.65n√Q/H^¾，用于判断泵型与最高效率区（离心<150、混流150~300、轴流>300）。",
            "管路系统应计入吸上高度、管路沿程/局部阻力损失，扬程取系统总需要扬程。"));
        return r;
    }
}
