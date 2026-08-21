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
 * 气动手指夹紧力计算（pneumatic-finger）。
 * <p>
 * 迁移自 `js/tools/fluid3.js` 工具 1：按工件质量、加速度与安全系数计算气动手指
 * 所需的最小夹紧力，支持机械锁紧/摩擦锁紧/V 形气爪复合工况。
 */
@Component
public class PneumaticFingerTool implements CalcTool {

    @Override
    public String id() {
        return "pneumatic-finger";
    }

    @Override
    public CalcResult compute(Map<String, Object> v) {
        double m = CalcResult.num(v.get("workpieceMass"));
        double a = CalcResult.num(v.get("acceleration"));
        double S = CalcResult.num(v.get("safetyFactor"));
        if (!(m > 0)) return CalcResult.fail("请输入工件质量 m");

        String cond = CalcResult.str(v.get("operatingCondition"));
        if (cond.isEmpty()) cond = "二爪机械锁紧";
        int n = cond.contains("三爪") ? 3 : 2;              // 夹爪爪数
        boolean isFriction = cond.contains("摩擦");          // 摩擦锁紧
        boolean isV = cond.contains("V形") || cond.contains("V 形"); // 带 V 形气爪夹具
        double g = 10;                                      // 原站取 g=10 m/s²
        double mu = CalcResult.num(v.get("miu")) > 0 ? CalcResult.num(v.get("miu")) : 0.2;
        double alphaDeg = CalcResult.num(v.get("alpha")) > 0 ? CalcResult.num(v.get("alpha")) : 60;
        double W = m * (g + a) * S;                         // 当量负载 N
        double F;
        if (isV) {
            // 机械锁紧带V形: W·tanα/n；摩擦锁紧带V形: W·tanα/(n·μ)
            F = isFriction
                ? W * Math.tan(alphaDeg * Math.PI / 180) / (n * mu)
                : W * Math.tan(alphaDeg * Math.PI / 180) / n;
        } else if (isFriction) {
            F = W / (n * mu);
        } else {
            F = W;
        }
        String forceClass = isFriction ? "摩擦锁紧" : "机械锁紧" + (isV ? "+V 形" : "");
        String formula = isFriction ? "W/(n·μ)" : (isV ? "W·tanα/n" : "W");

        CalcResult r = CalcResult.empty();
        r.setSections(Arrays.asList(
            section("当量负载", Arrays.asList(
                row("当量负载 W=m(g+a)", W, "N", null).hl(),
                row("加速度当量 (g+a)", g + a, "m/s²", 2),
                row("夹爪数 n", (double) n, "爪", null)
            )),
            section("夹紧力校核", Arrays.asList(
                row("所需最小夹紧力 F", F, "N", null).hl(),
                row("计算公式", formula, null, null),
                row("工况", forceClass, null, null)
            ))
        ));
        r.setVerdict(verdict("ok",
            "(" + Fmt.fmt(n) + " 爪 " + forceClass + ")所需最小夹紧力 " + Fmt.fmt(F, 1)
                + " N，选型应选用额定夹紧力 ≥ " + Fmt.fmt(F, 1) + " N 的气爪",
            "安全系数已计入 S=" + Fmt.fmt(S, 1) + "；若工件表面油污需取较大 μ 裕度。原站 g 取 10 m/s²。"));
        r.setNotes(Arrays.asList(
            "机械锁紧：F = m(g+a)·S；摩擦锁紧：F = m(g+a)·S/(n·μ)；V 形气爪：F = m(g+a)·S·tanα/n。",
            "摩擦锁紧对工件表面状态敏感，μ 取 0.1~0.2；加装 V 形气爪夹具可显著降低所需夹紧力。",
            "本工具公式与默认值依 原站 气动手指夹紧力计算页（airclawClampingForce）。"));
        return r;
    }
}
