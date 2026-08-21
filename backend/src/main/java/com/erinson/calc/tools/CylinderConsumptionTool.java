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
 * 气缸耗气量计算（cylinder-consumption）。
 * <p>
 * 迁移自 `js/tools/fluid3.js` 工具 2：最大耗气量、Cv 值、阀有效截面积，
 * 以及计入活塞杆与配管的平均耗气量。
 */
@Component
public class CylinderConsumptionTool implements CalcTool {

    @Override
    public String id() {
        return "cylinder-consumption";
    }

    @Override
    public CalcResult compute(Map<String, Object> v) {
        double D = CalcResult.num(v.get("cylBore"));
        double d = CalcResult.num(v.get("cylRod"));
        double L = CalcResult.num(v.get("strokeS"));
        double p = CalcResult.num(v.get("workingPressure"));
        if (!(D > 0) || !(L > 0) || !(p > 0)) return CalcResult.fail("请输入有效缸径、行程与压力");

        double t = CalcResult.num(v.get("actTime")) > 0 ? CalcResult.num(v.get("actTime")) : 0.5;
        double freq = CalcResult.num(v.get("actFreq"));
        double hoseID = CalcResult.num(v.get("hoseID"));
        double hoseLen = CalcResult.num(v.get("hoseLen"));
        // 最大耗气量（依原站系数）：Qmax = K·D²·S·(p+0.102)/t，D/S 用 mm
        double qMax = 0.0004684 * D * D * L * (p + 0.102) / t;           // L/min
        double areaS = 8.0834e-6 * D * D * L * (p + 0.102) / t;          // 阀有效截面积 mm²
        double cV = areaS * 0.0589;                                      // 阀 Cv 值
        // 平均耗气量：计入活塞杆（有杆腔）与配管容积，折标态
        double A_b = Math.PI / 4 * D * D;                                // 无杆腔面积 mm²
        double A_rod = Math.PI / 4 * (D * D - d * d);                    // 有杆腔面积 mm²
        double A_hose = Math.PI / 4 * hoseID * hoseID;
        double V_line = A_hose * hoseLen;                                // mm³
        double V_total = (A_b + A_rod) * L + 2 * V_line;                 // 每往复总扫气 mm³
        double qCa = V_total / 1e6 * ((p + 0.1013) / 0.1013) * freq;     // L/min

        CalcResult r = CalcResult.empty();
        r.setSections(Arrays.asList(
            section("最大耗气量（选阀/配管）", Arrays.asList(
                row("最大耗气量 Qmax", qMax, "L/min", 2).hl(),
                row("阀 Cv 值", cV, "", 2),
                row("阀有效面积 S", areaS, "mm²", 3)
            )),
            section("平均耗气量（选空压机）", Arrays.asList(
                row("平均耗气量 Qca（标态）", qCa, "L/min", 2).hl(),
                row("单程扫气（前进）", A_b * L / 1e6, "L", 4),
                row("单程扫气（后退）", A_rod * L / 1e6, "L", 4),
                row("配管容积（往返）", 2 * V_line / 1e6, "L", 4)
            ))
        ));
        r.setVerdict(verdict("ok",
            "最大耗气量 " + Fmt.fmt(qMax, 1) + " L/min（Cv " + Fmt.fmt(cV, 2) + "），平均耗气量 " + Fmt.fmt(qCa, 1) + " L/min",
            "空压机容量按平均耗气量并留 1.5~2 倍余量；阀与配管按最大耗气量选。"));
        r.setNotes(Arrays.asList(
            "最大耗气量 Qmax ∝ D²·S·(p+0.102)/t；平均耗气量计入活塞杆面积与两端配管容积。",
            "本工具公式与默认值依 原站 气缸耗气量计算页（maxGasConsumption / avgGasConsumption）。"));
        return r;
    }
}
