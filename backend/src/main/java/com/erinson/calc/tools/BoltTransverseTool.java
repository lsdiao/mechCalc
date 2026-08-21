package com.erinson.calc.tools;

import com.erinson.calc.common.CalcResult;
import com.erinson.calc.common.CalcResult.Row;
import com.erinson.calc.common.CalcResult.Section;
import org.springframework.stereotype.Component;

import static com.erinson.calc.common.CalcResult.row;
import static com.erinson.calc.common.CalcResult.section;
import static com.erinson.calc.common.CalcResult.verdict;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

/**
 * 横向载荷-紧螺栓连接强度校核（bolt-transverse）。
 * <p>
 * 迁移自 `js/tools/connection.js` 工具 3「受横向载荷-紧螺栓连接」，逐值对齐。
 */
@Component
public class BoltTransverseTool implements CalcTool {

    @Override
    public String id() {
        return "bolt-transverse";
    }

    @Override
    public CalcResult compute(Map<String, Object> v) {
        double F = CalcResult.num(v.get("F")) * 1000;
        double Kf = CalcResult.num(v.get("Kf"));
        double m = CalcResult.num(v.get("m"));
        double f = CalcResult.num(v.get("f"));
        double S = CalcResult.num(v.get("S"));
        if (!(F > 0)) return CalcResult.fail("请输入横向载荷 F（kN）");
        if (!(Kf >= 1)) return CalcResult.fail("可靠性系数 Kf 应≥1");
        if (!(m >= 1)) return CalcResult.fail("接合面数 m 应≥1");
        if (!(f > 0)) return CalcResult.fail("请输入摩擦因数 f");
        if (!(S > 0)) return CalcResult.fail("请输入安全系数 S");

        double ss = ConnShared.gradeData(v)[0];
        double sigmaAllow = ss / S;
        double Fp = Kf * F / (m * f);

        if ("design".equals(CalcResult.str(v.get("mode")))) {
            double needD1 = Math.sqrt(4 * 1.3 * Fp / (Math.PI * sigmaAllow));
            String recD = ConnShared.pickThread(needD1);
            List<Row> rows = Arrays.asList(
                row("所需预紧力 F′=Kf·F/(m·f)", Fp, "N", null).hl(),
                row("所需螺纹小径 d₁≥", needD1, "mm", 3).hl(),
                recD != null
                    ? ConnShared.htmlRow("推荐公称直径", "M" + recD + "（d₁=" + ConnShared.THREAD_D1.get(recD) + "mm）")
                    : ConnShared.htmlRow("推荐公称直径", "超出数据范围"),
                row("许用应力 [σ]=σs/S", sigmaAllow, "MPa", null)
            );
            CalcResult r = CalcResult.empty();
            r.setSections(Arrays.asList(section("设计计算结果", rows)));
            r.setVerdict(verdict("ok", "需预紧力 F′ = " + ConnShared.fmt(Fp) + " N，所需 d₁ ≥ "
                + ConnShared.fmt(needD1, 3) + " mm，推荐 M" + (recD == null ? "--" : recD), null));
            r.setNotes(Arrays.asList("横向载荷紧螺栓连接靠摩擦力平衡，预紧力通常较大，可能导致螺栓尺寸偏大。必要时可采用铰制孔螺栓或减载装置。"));
            return r;
        }

        Double d1 = ConnShared.THREAD_D1.get(CalcResult.str(v.get("d")));
        if (d1 == null) return CalcResult.fail("未找到所选螺栓的小径数据");
        double A = Math.PI * d1 * d1 / 4;
        double sigma = 1.3 * Fp / A;
        boolean ok = sigma <= sigmaAllow;
        double Tmax = 0.5 * sigmaAllow * A / 1.3 * m * f / Kf / 1000;

        List<Row> sec1 = Arrays.asList(
            row("所需预紧力 F′=Kf·F/(m·f)", Fp, "N", null).hl(),
            row("可靠性系数 Kf", Kf, "", null),
            row("接合面数 m", m, "", null),
            row("摩擦因数 f", f, "", null)
        );
        List<Row> sec2 = Arrays.asList(
            row("螺纹小径 d₁", d1, "mm", null),
            row("危险截面积 A", A, "mm²", 2),
            row("计算应力 σca=1.3F′/A", sigma, "MPa", null).hl(),
            row("许用应力 [σ]=σs/S", sigmaAllow, "MPa", null).hl(),
            row("屈服强度 σs", ss, "MPa", null),
            row("强度裕度", sigmaAllow / sigma, "", 2),
            row("允许最大横向载荷", Tmax, "kN", 2)
        );
        CalcResult r = CalcResult.empty();
        r.setSections(Arrays.asList(section("预紧力计算", sec1), section("强度校核", sec2)));
        r.setVerdict(verdict(
            ok ? "ok" : "bad",
            ok ? "校核通过：σca = " + ConnShared.fmt(sigma) + " MPa ≤ [σ] = " + ConnShared.fmt(sigmaAllow) + " MPa"
               : "校核不通过：σca = " + ConnShared.fmt(sigma) + " MPa > [σ] = " + ConnShared.fmt(sigmaAllow) + " MPa",
            null));
        r.setNotes(Arrays.asList(
            "预紧力 F′ = Kf·F/(m·f)，其中 Kf 取 1.1~1.3（防滑可靠性系数），m 为接合面数，f 为摩擦因数。",
            "1.3 为拧紧力矩引起的扭转切应力折算系数。",
            "若强度不足，可：① 增大螺栓直径 ② 提高等级 ③ 增加接合面数 ④ 采用铰制孔螺栓"));
        return r;
    }
}
