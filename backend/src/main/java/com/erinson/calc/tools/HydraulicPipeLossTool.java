package com.erinson.calc.tools;

import com.erinson.calc.common.CalcResult;
import com.erinson.calc.common.CalcResult.Row;
import org.springframework.stereotype.Component;

import static com.erinson.calc.common.CalcResult.row;
import static com.erinson.calc.common.CalcResult.section;
import static com.erinson.calc.common.CalcResult.verdict;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

/**
 * 液压传动系统计算（阻力/压降）（hydraulic-pipe-loss）。
 * <p>
 * 迁移自 `js/tools/fluid2.js` 工具 1：沿程压力损失（雷诺数判别层流/湍流，
 * 水力光滑用 Blasius、粗糙管用 Swamee-Jain 求阻力系数 λ）与局部压力损失（ζ·ρv²/2）。
 */
@Component
public class HydraulicPipeLossTool implements CalcTool {

    @Override
    public String id() {
        return "hydraulic-pipe-loss";
    }

    @Override
    public CalcResult compute(Map<String, Object> v) {
        double Q = CalcResult.num(v.get("Q"));
        double d = CalcResult.num(v.get("d"));
        double rho = CalcResult.num(v.get("rho"));
        if (!(Q > 0) || !(d > 0) || !(rho > 0)) return CalcResult.fail("请输入有效的流量、内径与密度");

        double A = Math.PI * Math.pow(d / 1000, 2) / 4; // m²
        double vel = (Q / 60000) / A;                    // m/s

        if ("local".equals(CalcResult.str(v.get("mode")))) {
            double zeta = CalcResult.num(v.get("zeta"));
            double hlLocal = zeta * rho * vel * vel / 2 / 1e5; // bar
            List<Row> rows = Arrays.asList(
                row("平均流速 v=Q/A", vel, "m/s", 3).hl(),
                row("动态压力 ρv²/2", rho * vel * vel / 2, "Pa", 1),
                row("局部压降 Δp=ζ·ρv²/2", hlLocal, "bar", 4).hl(),
                row("局部压降 Δp", hlLocal * 1e5, "Pa", 0),
                row("局部压降 Δp", hlLocal / 10, "MPa", 5)
            );
            CalcResult r = CalcResult.empty();
            r.setSections(Arrays.asList(section("局部压力损失", rows)));
            r.setVerdict(verdict("ok",
                "局部压力损失 Δp = " + Fmt.fmt(hlLocal, 4) + " bar（ζ=" + Fmt.fmt(zeta) + "）",
                "局部阻力系数 ζ 随管件类型差异很大，弯头/接头/阀体可从手册或原站阻力系数表查取。"));
            r.setNotes(Arrays.asList(
                "局部压降 Δp = ζ·ρv²/2，v 取局部管件后过流断面平均流速。",
                "多个管件串联时局部压降相加；本项目同原站仅计算单个管件。"));
            return r;
        }

        double nu = CalcResult.num(v.get("nu"));
        double eps = CalcResult.num(v.get("eps"));
        double L = CalcResult.num(v.get("L"));
        if (!(nu > 0) || eps < 0 || !(L > 0)) return CalcResult.fail("请输入有效的粘度、粗糙度与长度");

        double nuM = nu * 1e-6;                          // cSt → m²/s
        double dm = d / 1000;
        double Re = vel * dm / nuM;                      // 雷诺数
        boolean laminar = Re < 2320;                     // 层流临界 Re=2320
        double lambda;
        if (laminar) {
            lambda = 64 / Re;
        } else if ((eps / d) * Re < 40) {
            lambda = 0.3164 / Math.pow(Re, 0.25);        // Blasius 公式
        } else {
            lambda = 0.25 / Math.pow(Math.log10(eps / (3.7 * d) + 5.74 / Math.pow(Re, 0.9)), 2); // Swamee-Jain
        }
        double hl = lambda * (L / dm) * rho * vel * vel / 2 / 1e5; // bar

        List<Row> sec1 = Arrays.asList(
            row("平均流速 v=Q/A", vel, "m/s", 3).hl(),
            row("雷诺数 Re=vd/ν", Re, null, 1).hl(),
            row("流态（Re<2320 层流）", laminar ? "层流" : "湍流", null, null).hl()
        );
        List<Row> sec2 = Arrays.asList(
            row("阻力系数 λ（Re<2320→64/Re，光滑→Blasius，粗糙→Swamee-Jain）", lambda, null, 4).hl(),
            row("沿程压降 Δp=λ·(l/d)·ρv²/2", hl, "bar", 4).hl(),
            row("沿程压降 Δp", hl * 1e5, "Pa", 0),
            row("沿程压降 Δp", hl / 10, "MPa", 5),
            row("管长直径比 l/d", L / dm, null, 1)
        );

        CalcResult r = CalcResult.empty();
        r.setSections(Arrays.asList(section("流动参数", sec1), section("阻力系数与压降", sec2)));
        String flow = laminar ? "层流" : "湍流";
        r.setVerdict(verdict(laminar ? "ok" : (hl > 10 ? "warn" : "ok"),
            flow + "流动，λ=" + Fmt.fmt(lambda, 4) + "，沿程压降 Δp=" + Fmt.fmt(hl, 4) + " bar",
            "湍流状态下阻力系数随雷诺数与相对粗糙度变化；ε/d 越大 λ 越大。局部损失需另外叠加。"));
        r.setNotes(Arrays.asList(
            "雷诺数 Re = v·d/ν（ν 为运动粘度，cSt→m²/s 乘 1e-6）。",
            "层流（Re<2320）λ=64/Re；水力光滑（ε/d·Re<40）用 Blasius λ=0.3164·Re^-0.25；粗糙管用 Swamee-Jain。",
            "沿程压降 Δp = λ·(l/d)·ρv²/2，输出单位 bar（1bar=1e5Pa）。",
            "本页同时适用于水系统（水系统计算见原站 water 系列页面）。"));
        return r;
    }
}
