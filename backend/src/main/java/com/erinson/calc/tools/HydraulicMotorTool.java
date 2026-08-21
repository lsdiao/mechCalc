package com.erinson.calc.tools;

import com.erinson.calc.common.CalcResult;
import com.erinson.calc.common.CalcResult.Row;
import com.erinson.calc.common.CalcResult.Verdict;
import org.springframework.stereotype.Component;

import static com.erinson.calc.common.CalcResult.row;
import static com.erinson.calc.common.CalcResult.section;
import static com.erinson.calc.common.CalcResult.verdict;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

/**
 * 液压马达计算（hydraulic-motor）。
 * <p>
 * 迁移自 `js/tools/fluid2.js` 工具 3：流量/压力/排量/速度/扭矩/功率六种求解方式。
 */
@Component
public class HydraulicMotorTool implements CalcTool {

    @Override
    public String id() {
        return "hydraulic-motor";
    }

    @Override
    public CalcResult compute(Map<String, Object> v) {
        double V = CalcResult.num(v.get("V"));
        double N = CalcResult.num(v.get("N"));
        double Q = CalcResult.num(v.get("Q"));
        double p = CalcResult.num(v.get("p"));
        double T = CalcResult.num(v.get("T"));
        double P = CalcResult.num(v.get("P"));
        double etav = CalcResult.num(v.get("etav"));
        double etam = CalcResult.num(v.get("etam"));
        double fv = etav / 100, fm = etam / 100;
        String calc = CalcResult.str(v.get("calc"));

        List<Row> rows;
        Verdict verdict;

        if ("流量".equals(calc)) {
            if (!(V > 0) || !(N > 0) || !(fv > 0)) return CalcResult.fail("流量需 排量V、转速n、容积效率ηv");
            double q = V * N / (60 * fv);
            rows = Arrays.asList(
                row("输入流量 Q=V·n/(60·ηv)", q, "L/min", 3).hl(),
                row("流量（理论）V·n/60", V * N / 60, "L/min", 3)
            );
            verdict = verdict("ok", "液压马达输入流量 Q = " + Fmt.fmt(q, 3) + " L/min", "");
        } else if ("压力".equals(calc)) {
            if (T > 0 && V > 0 && fm > 0) {
                double val = 2 * Math.PI * T / (V * fm);
                rows = Arrays.asList(row("压力差 p=2π·T/(V·ηm)", val, "MPa", 3).hl());
                verdict = verdict("ok", "马达进出口压力差 p = " + Fmt.fmt(val, 3) + " MPa", "");
            } else if (P > 0 && Q > 0 && fv > 0 && fm > 0) {
                double pk = P / 1000; // W→kW
                double val = pk / ((Q / 60) * fv * fm);
                rows = Arrays.asList(row("压力差 p=P/(Q/60·ηv·ηm)", val, "MPa", 3).hl());
                verdict = verdict("ok", "马达进出口压力差 p = " + Fmt.fmt(val, 3) + " MPa", "");
            } else return CalcResult.fail("压力需 扭矩+排量+机械效率 或 功率+流量+效率");
        } else if ("排量".equals(calc)) {
            if (Q > 0 && N > 0 && fv > 0) {
                double val = Q * 60 / (N * fv);
                rows = Arrays.asList(row("排量 V=Q·60/(n·ηv)", val, "mL/rev", 3).hl());
                verdict = verdict("ok", "马达排量 V = " + Fmt.fmt(val, 3) + " mL/rev", "");
            } else if (p > 0 && T > 0 && fm > 0) {
                double val = 2 * Math.PI * T / (p * fm);
                rows = Arrays.asList(row("排量 V=2π·T/(p·ηm)", val, "mL/rev", 3).hl());
                verdict = verdict("ok", "马达排量 V = " + Fmt.fmt(val, 3) + " mL/rev", "");
            } else return CalcResult.fail("排量需 流量+转速+容积效率 或 压力+扭矩+机械效率");
        } else if ("速度".equals(calc)) {
            if (Q > 0 && V > 0 && fv > 0) {
                double val = 60 * Q * fv / V;
                rows = Arrays.asList(row("转速 n=60·Q·ηv/V", val, "rpm", 3).hl());
                verdict = verdict("ok", "马达转速 n = " + Fmt.fmt(val, 3) + " rpm", "");
            } else return CalcResult.fail("速度需 流量Q、排量V、容积效率ηv");
        } else if ("扭矩".equals(calc)) {
            if (p > 0 && V > 0 && fm > 0) {
                double val = p * V * fm / (2 * Math.PI);
                rows = Arrays.asList(row("扭矩 T=p·V·ηm/(2π)", val, "N·m", 3).hl());
                verdict = verdict("ok", "马达输出扭矩 T = " + Fmt.fmt(val, 3) + " N·m", "");
            } else return CalcResult.fail("扭矩需 压力差p、排量V、机械效率ηm");
        } else if ("功率".equals(calc)) {
            double Pw;
            if (T > 0 && N > 0) {
                Pw = T * N / 9550 * 1000;                  // W
                rows = Arrays.asList(row("输出功率 P=T·n/9550", Pw / 1000, "kW", 3).hl());
            } else if (p > 0 && Q > 0 && fv > 0 && fm > 0) {
                Pw = (p * Q / 60) * fv * fm;               // kW
                rows = Arrays.asList(
                    row("输出功率 P=p·Q·ηv·ηm/60", Pw, "kW", 3).hl(),
                    row("输入液压功率 p·Q/60", p * Q / 60, "kW", 3)
                );
            } else return CalcResult.fail("功率需 扭矩+转速 或 压力+流量+效率");
            verdict = verdict("ok", "马达输出功率 P = " + Fmt.fmt(Pw, 3) + " kW", "");
        } else {
            rows = java.util.Collections.emptyList();
            verdict = verdict("ok", "", "");
        }

        CalcResult r = CalcResult.empty();
        r.setSections(Arrays.asList(section("马达计算（" + calc + "）", rows)));
        r.setVerdict(verdict);
        r.setNotes(Arrays.asList(
            "扭矩 T = p·V·ηm/(2π)（p:MPa，V:mL/rev，T:N·m）。",
            "输出功率 P = T·n/9550（kW）或 P = p·Q/60·ηv·ηm（kW）。",
            "输入流量 Q = V·n/(60·ηv)；容积效率与机械效率均为百分比输入。"));
        return r;
    }
}
