package com.erinson.calc.tools;

import com.erinson.calc.common.CalcResult;
import com.erinson.calc.common.CalcResult.Row;
import com.erinson.calc.common.CalcResult.Section;
import com.erinson.calc.common.CalcResult.Verdict;
import org.springframework.stereotype.Component;

import static com.erinson.calc.common.CalcResult.row;
import static com.erinson.calc.common.CalcResult.section;
import static com.erinson.calc.common.CalcResult.verdict;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * 液压泵计算（hydraulic-pump）。
 * <p>
 * 迁移自 `js/tools/fluid2.js` 工具 2：流量/排量/电机功率/总效率四种求解方式。
 */
@Component
public class HydraulicPumpTool implements CalcTool {

    @Override
    public String id() {
        return "hydraulic-pump";
    }

    @Override
    public CalcResult compute(Map<String, Object> v) {
        double V = CalcResult.num(v.get("V"));
        double N = CalcResult.num(v.get("N"));
        double Q = CalcResult.num(v.get("Q"));
        double p = CalcResult.num(v.get("p"));
        double etav = CalcResult.num(v.get("etav"));
        double etam = CalcResult.num(v.get("etam"));
        double fv = etav / 100, fm = etam / 100;
        String calc = CalcResult.str(v.get("calc"));

        String title = "泵流量";
        List<Row> rows = new ArrayList<>();
        Verdict verdict = verdict("ok", "", "");

        if ("流量".equals(calc)) {
            if (!(V > 0) || !(N > 0) || !(fv > 0)) return CalcResult.fail("流量需 排量V、转速n、容积效率ηv");
            double Qo = V * N * fv / 60;                    // L/min
            double Po = V * N / 60 / fv;                    // 理论流量（忽略容积效率）
            title = "泵流量";
            rows = Arrays.asList(
                row("实际流量 Q=V·n·ηv/60", Qo, "L/min", 3).hl(),
                row("理论流量（无泄漏）", Po, "L/min", 3),
                row("容积参数 V·n", V * N, "mL/min", 0)
            );
            verdict = verdict("ok", "泵实际流量 Q = " + Fmt.fmt(Qo, 3) + " L/min",
                "V=50mL/rev、n=1000rpm、ηv=90% 时 Q=750 L/min。");
        } else if ("排量".equals(calc)) {
            if (!(Q > 0) || !(N > 0) || !(fv > 0)) return CalcResult.fail("排量需 流量Q、转速n、容积效率ηv");
            double Vo = Q * 60 / (N * fv);                  // mL/rev
            title = "泵排量";
            rows = Arrays.asList(
                row("排量 V=Q·60/(n·ηv)", Vo, "mL/rev", 3).hl(),
                row("需泵每分钟扫过的容积", Q * 1000 / fv, "mm³/rev", 0)
            );
            verdict = verdict("ok",
                "所需排量 V = " + Fmt.fmt(Vo, 3) + " mL/rev (Q=" + Fmt.fmt(Q) + " L/min, n=" + Fmt.fmt(N)
                    + " rpm, ηv=" + Fmt.fmt(fv * 100) + "%)", "");
        } else if ("电机功率".equals(calc)) {
            // 若给定 V、n 且未给 Q，则由 V、n 求 Q
            if ((Q <= 0 || Double.isNaN(Q)) && V > 0 && N > 0 && fv > 0) Q = V * N * fv / 60;
            if (!(Q > 0) || !(p > 0)) return CalcResult.fail("电机功率需 压力p 与 流量Q");
            if (!(fv > 0) || !(fm > 0)) return CalcResult.fail("电机功率需 容积效率与机械效率");
            double Pw = p * Q * 1000 / (60 * fv * fm);      // W
            title = "驱动电机功率";
            rows = Arrays.asList(
                row("有效输出功率（理论）", p * Q / 60, "kW", 3),
                row("电机功率 P=p·Q/(60·ηv·ηm)", Pw / 1000, "kW", 3).hl(),
                row("电机功率 P", Pw, "W", 1).hl()
            );
            verdict = verdict("ok", "驱动电机功率 P = " + Fmt.fmt(Pw / 1000, 3) + " kW",
                "工程经验通常再留 1.1~1.25 倍裕量选电机。");
        } else if ("总效率".equals(calc)) {
            if (!(etav > 0) || !(etam > 0)) return CalcResult.fail("总效率需 容积效率与机械效率");
            double eta = (etav * etam) / 100;               // %
            title = "泵总效率";
            rows = Arrays.asList(
                row("容积效率 ηv", etav, "%", 2),
                row("机械效率 ηm", etam, "%", 2),
                row("总效率 η=ηv·ηm", eta, "%", 2).hl()
            );
            verdict = verdict("ok", "泵总效率 η = " + Fmt.fmt(eta, 2) + " %",
                "总效率为容积与机械效率之积，实际还应计入液压冲击与元件损耗。");
        }

        List<Section> secs;
        if (rows.isEmpty()) {
            secs = Collections.emptyList();
        } else {
            secs = Collections.singletonList(section(title, rows));
        }
        CalcResult r = CalcResult.empty();
        r.setSections(secs);
        r.setVerdict(verdict);
        r.setNotes(Collections.<String>emptyList());
        return r;
    }
}
