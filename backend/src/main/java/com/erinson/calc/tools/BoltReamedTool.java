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
 * 铰制孔螺栓连接强度校核（bolt-reamed）。
 * <p>
 * 迁移自 `js/tools/connection.js` 工具 2「铰制孔螺栓连接（受横向载荷）」，逐值对齐。
 */
@Component
public class BoltReamedTool implements CalcTool {

    @Override
    public String id() {
        return "bolt-reamed";
    }

    @Override
    public CalcResult compute(Map<String, Object> v) {
        double dynFactor = "yes".equals(CalcResult.str(v.get("dyn")))
            ? (validNum(v.get("dynFactor")) ? ConnShared.numNaN(v.get("dynFactor")) : 0.7) : 1;
        double F = CalcResult.num(v.get("F")) * 1000;
        double Sp = CalcResult.num(v.get("Sp"));
        double St = CalcResult.num(v.get("St"));
        double h = CalcResult.num(v.get("h"));
        double m = CalcResult.num(v.get("m"));
        if (!(F > 0)) return CalcResult.fail("请输入横向载荷 F（kN）");
        if (!(Sp > 0) || !(St > 0)) return CalcResult.fail("请输入挤压/抗剪安全系数");
        if (!(h > 0)) return CalcResult.fail("请输入受挤压高度 h（mm）");
        if (!(m >= 1)) return CalcResult.fail("受剪面数 m 应≥1");

        double[] gd = ConnShared.gradeData(v);
        double ss = gd[0], sb = gd[1];
        double sigmaPAllow = ss / Sp * dynFactor;
        double tauAllow = ss / St;

        if ("design".equals(CalcResult.str(v.get("mode")))) {
            double dMinP = F / (h * sigmaPAllow);
            double dMinT = Math.sqrt(4 * F / (m * Math.PI * tauAllow));
            double dMin = Math.max(dMinP, dMinT);
            String recD = ConnShared.pickThread(dMin);
            List<Row> rows = Arrays.asList(
                row("挤压所需 d₁≥", dMinP, "mm", 3),
                row("剪切所需 d₁≥", dMinT, "mm", 3),
                row("所需最小 d₁", dMin, "mm", 3).hl(),
                recD != null
                    ? ConnShared.htmlRow("推荐公称直径", "M" + recD + "（d₁=" + ConnShared.THREAD_D1.get(recD) + "mm）")
                    : ConnShared.htmlRow("推荐公称直径", "超出数据范围"),
                row("许用挤压应力 [σp]=σs/Sp", sigmaPAllow, "MPa", null),
                row("许用剪应力 [τ]=σs/St", tauAllow, "MPa", null)
            );
            CalcResult r = CalcResult.empty();
            r.setSections(Arrays.asList(section("设计计算结果", rows)));
            r.setVerdict(verdict("ok", "所需 d₁ ≥ " + ConnShared.fmt(dMin, 3) + " mm，推荐选用 M" + (recD == null ? "--" : recD), null));
            r.setNotes(Arrays.asList("设计计算中 d₀ 按受剪直径要求确定，由 d₀ 反推所需螺纹小径 d₁，再推荐公称直径。"));
            return r;
        }

        Double d1 = ConnShared.THREAD_D1.get(CalcResult.str(v.get("d")));
        if (d1 == null) return CalcResult.fail("未找到所选螺栓的小径数据");
        double d0 = validNum(v.get("d0")) ? ConnShared.numNaN(v.get("d0")) : ConnShared.numNaN(v.get("d"));
        if (Double.isNaN(d0) || d0 == 0) d0 = ConnShared.numNaN(v.get("d")); // +v.d0 || +v.d
        double A = Math.PI * d0 * d0 / 4;
        double sigmaP = F / (d0 * h);
        double tau = F / (m * A);
        boolean okP = sigmaP <= sigmaPAllow;
        boolean okT = tau <= tauAllow;
        boolean ok = okP && okT;

        List<Row> sec1 = Arrays.asList(
            row("挤压应力 σp=F/(d₀·h)", sigmaP, "MPa", null).hl(),
            row("许用挤压应力 [σp]=σs/Sp", sigmaPAllow, "MPa", null).hl(),
            row("受剪直径 d₀", d0, "mm", null),
            row("受挤压高度 h", h, "mm", null),
            row("挤压裕度", sigmaPAllow / sigmaP, "", 2)
        );
        List<Row> sec2 = Arrays.asList(
            row("剪切应力 τ=F/(m·A)", tau, "MPa", null).hl(),
            row("许用剪应力 [τ]=σs/St", tauAllow, "MPa", null).hl(),
            row("受剪面数 m", m, "", null),
            row("受剪截面积 A", A, "mm²", 2),
            row("剪切裕度", tauAllow / tau, "", 2)
        );
        CalcResult r = CalcResult.empty();
        r.setSections(Arrays.asList(section("挤压强度校核", sec1), section("抗剪强度校核", sec2)));
        r.setVerdict(verdict(
            ok ? "ok" : "bad",
            (okP ? "挤压满足" : "挤压不满足") + "，" + (okT ? "剪切满足" : "剪切不满足")
                + "；" + (ok ? "校核通过" : "校核不通过，请增大螺栓直径或提高等级"),
            ok ? "" : "若不满足：① 增大螺栓直径 ② 提高性能等级 ③ 增加受剪面数 ④ 增大挤压高度"));
        r.setNotes(Arrays.asList(
            "铰制孔螺栓的受剪直径 d₀ 为螺栓杆（光杆）直径，由用户输入；默认取公称直径。",
            "动载荷时仅对挤压许用应力进行折减，即 [σp] = σs/Sp × 系数；剪切许用应力 [τ] = σs/St 不变。"));
        return r;
    }

    /** 数值合法（非 NaN 非 0）：模拟 JS 真值判断 */
    private static boolean validNum(Object o) {
        double x = ConnShared.numNaN(o);
        return !Double.isNaN(x) && x != 0;
    }
}
