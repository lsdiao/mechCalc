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
 * 真空吸盘与真空发生器选型（vacuum-suction）。
 * <p>
 * 迁移自 `js/tools/fluid3.js` 工具 4：按运动方式（顶吸/侧吸/平移）计算吸附力、
 * 吸盘直径，并由吸盘体积与反应时间反算真空发生器流量。
 * <p>
 * 注意：前端 `+undefined` 产生 NaN（空参时结果行序列化为 null），这里用
 * {@link #numN} 复刻该行为，保证空参快照与 golden 的 value=null 对齐。
 */
@Component
public class VacuumSuctionTool implements CalcTool {

    @Override
    public String id() {
        return "vacuum-suction";
    }

    /** 复刻 JS `+v.xxx`：缺失/非法输入返回 NaN（而非 0） */
    private static double numN(Object o) {
        if (o == null) return Double.NaN;
        if (o instanceof Number) return ((Number) o).doubleValue();
        try { return Double.parseDouble(String.valueOf(o).trim()); }
        catch (NumberFormatException e) { return Double.NaN; }
    }

    @Override
    public CalcResult compute(Map<String, Object> v) {
        double m = numN(v.get("workpieceMass"));
        double a = numN(v.get("acceleration"));
        double S = numN(v.get("safetyFactor"));
        String mode = CalcResult.str(v.get("motionStyle"));
        if (mode.isEmpty()) mode = "顶吸提升";
        double n = numN(v.get("suctionCupsNo"));
        if (Double.isNaN(n) || n <= 0) n = 1;
        double mu = numN(v.get("miu"));
        if (Double.isNaN(mu) || mu <= 0) mu = 0.15;
        double pV = numN(v.get("vacuum"));
        if (Double.isNaN(pV) || pV <= 0) pV = 70;
        double g = 9.81;
        double forceH, singleForceH;
        String formulaName;
        if ("侧吸提升".equals(mode)) {
            formulaName = "F=m(g+a)·S/(n·μ)";
            forceH = m * (g + a) * S / mu;              // 总吸附力
        } else if ("顶吸平移".equals(mode)) {
            formulaName = "F=m·(g+a/μ)·S";
            forceH = m * (g + a / mu) * S;
        } else {
            formulaName = "F=m(g+a)·S/n";
            forceH = m * (g + a) * S;
        }
        singleForceH = forceH / n;                      // 单个吸盘所需吸附力
        // 吸盘直径 D=√(4F/(π·p))，pV 单位 kPa → N/m²
        double cupDia = Math.sqrt(4 * singleForceH / (Math.PI * pV * 1000)) * 1000; // mm
        double cupSize = Math.PI / 4 * Math.pow(cupDia / 10, 2);                    // 有效面积 cm²
        // 真空发生器：由吸盘体积+配管体积与反应时间算流量
        double hoseDia = numN(v.get("hoseDia"));
        double hoseLen = numN(v.get("hoseLen"));
        double hoseV1 = Math.PI / 4 * Math.pow(hoseDia, 2) * (hoseLen * 1000) / 1e6; // 配管容积 L
        double cupV2 = numN(v.get("cupV2"));
        double totalV = hoseV1 + (Double.isNaN(cupV2) ? 0 : cupV2) * n;              // 总容积 L
        double cupDiameterS = numN(v.get("cupDiameterS"));
        double pWorking = singleForceH / (Math.PI / 4 * Math.pow(cupDiameterS, 2)) * 1000; // kPa 到达压力
        double r = Math.max(0, Math.min(0.99, pWorking / pV));                       // 压力比
        double tT1 = -Math.log(1 - r);                                               // 吸附时间比
        double T = numN(v.get("responseTime"));
        if (Double.isNaN(T) || T <= 0) T = 1;
        double q1 = 60 * totalV * tT1 / T;                                           // 所需流量 L/min
        double qMax = 2 * q1;                                                        // 发生器最大流量

        CalcResult res = CalcResult.empty();
        res.setSections(Arrays.asList(
            section("吸盘吸附力", Arrays.asList(
                row("总吸附力 " + formulaName, forceH, "N", null).hl(),
                row("单吸盘所需吸附力", singleForceH, "N", null).hl(),
                row("计算吸盘直径 D=√(4F/(π·p))", cupDia, "mm", 1),
                row("吸盘有效面积", cupSize, "cm²", 2)
            )),
            section("真空发生器流量", Arrays.asList(
                row("配管容积 V1", hoseV1, "L", 4),
                row("总容积 V=V1+n·V2", totalV, "L", 4),
                row("吸附时间比 tT1", tT1, "", 3),
                row("所需流量 Q1=60·V·tT1/T", q1, "L/min", 2).hl(),
                row("发生器最大流量 Qmax=2·Q1", qMax, "L/min", 2).hl()
            ))
        ));
        res.setVerdict(verdict("ok",
            mode + "：总吸附力 " + Fmt.fmt(forceH, 1) + " N，单吸盘 " + Fmt.fmt(singleForceH, 1)
                + " N，吸盘直径约 " + Fmt.fmt(cupDia, 1) + " mm；发生器需流量 " + Fmt.fmt(q1, 1) + " L/min",
            "发生器额定吸气量建议取 Qmax（2·Q1）以上，保证反应时间 T=" + Fmt.fmt(T, 1) + " s 内完成吸附。"));
        res.setNotes(Arrays.asList(
            "顶吸提升 F=m(g+a)·S；侧吸提升 F=m(g+a)·S/μ；顶吸平移 F=m·(g+a/μ)·S；g=9.81 m/s²。",
            "吸盘直径 D=√(4F/(π·p))，F 单盘吸附力(N)，p 真空度(Pa)。",
            "本工具公式与默认值依 原站 真空吸盘与真空发生器页（vacuumSuctionCupCal / vacuumGeneratorCal）。"));
        return res;
    }
}
