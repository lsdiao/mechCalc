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
 * 油压缓冲器选型（hydraulic-buffer）。
 * <p>
 * 迁移自 `js/tools/fluid3.js` 工具 5：计算运动体动能、驱动能、总吸收能量、
 * 每小时吸收能量与等效质量，支持直线与旋转运动。
 */
@Component
public class HydraulicBufferTool implements CalcTool {

    @Override
    public String id() {
        return "hydraulic-buffer";
    }

    @Override
    public CalcResult compute(Map<String, Object> v) {
        String mode = CalcResult.str(v.get("motionSituation"));
        if (mode.isEmpty()) mode = "直线运动时";
        double N = CalcResult.num(v.get("hitTimes")) > 0
            ? CalcResult.num(v.get("hitTimes")) : ("旋转或摇摆运动时".equals(mode) ? 900 : 1800);
        double g = 9.81;
        double eK, eD, eT, eTC, equivMass, vImp;
        if ("旋转或摇摆运动时".equals(mode)) {
            double J = CalcResult.num(v.get("inertiaJ"));
            double w = CalcResult.num(v.get("angularVelocity"));
            double M = CalcResult.num(v.get("torque"));
            double R = CalcResult.num(v.get("distanceR")) > 0 ? CalcResult.num(v.get("distanceR")) : 0.4;
            double S = CalcResult.num(v.get("bufferStrokeS")) != 0 ? CalcResult.num(v.get("bufferStrokeS")) : 20;
            vImp = R * w;                                   // 缓冲点冲击速度 m/s
            eK = 0.5 * J * w * w;                           // 动能 0.5·J·ω²
            double theta = (S / 1000) / R;                  // 缓冲行程角 rad
            eD = M * theta;                                 // 驱动力矩做功
            eT = eK + eD;
            eTC = eT * N;
            equivMass = (J / (R * R)) * (eT / eK);          // 等效质量（旋转）
        } else {
            double m = CalcResult.num(v.get("workpieceMass"));
            double v2 = CalcResult.num(v.get("impactVelocity"));
            double S = CalcResult.num(v.get("bufferStrokeS")) != 0 ? CalcResult.num(v.get("bufferStrokeS")) : 40;
            double ang = CalcResult.num(v.get("bevelAngle"));
            double F = CalcResult.num(v.get("axialLoad"));
            vImp = v2;
            eK = 0.5 * m * v2 * v2;                         // 动能
            eD = m * g * (S / 1000) * Math.sin(ang * Math.PI / 180) + F * (S / 1000); // 重力分力+驱动力做功
            eT = eK + eD;
            eTC = eT * N;
            equivMass = m * (eT / eK);                      // 等效质量（直线）
        }

        CalcResult r = CalcResult.empty();
        r.setSections(Arrays.asList(
            section("能量计算", Arrays.asList(
                row("冲击速度 v", vImp, "m/s", 2),
                row("动能 E1=½·M·v²", eK, "J", null).hl(),
                row("驱动能 E2", eD, "J", 1),
                row("总吸收能量 E=E1+E2", eT, "J", null).hl()
            )),
            section("选型校核", Arrays.asList(
                row("每小时吸收能量 ETC", eTC, "J/h", null).hl(),
                row("等效质量 me", equivMass, "kg", 2)
            ))
        ));
        r.setVerdict(verdict("ok",
            "总吸收能量 " + Fmt.fmt(eT, 1) + " J，每小时 " + Fmt.fmt(eTC) + " J/h，等效质量 " + Fmt.fmt(equivMass, 2) + " kg",
            "所选缓冲器须满足：最大吸收能量 ≥ E、最高冲击速度 ≥ v、等效质量在允许范围内；转速过快留 30% 以上余量。"));
        r.setNotes(Arrays.asList(
            "直线：E1=½mv²，E2=mg·S·sinθ+F·S；旋转：E1=½Jω²，E2=M·(S/R)。",
            "等效质量 直线 me=m·E/E1；旋转 me=(J/R²)·(E/E1)。",
            "本工具公式与默认值依 原站 油压缓冲器选型页（hydraulicBufferCal）。"));
        return r;
    }
}
