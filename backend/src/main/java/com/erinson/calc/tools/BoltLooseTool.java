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
 * 松螺栓连接强度校核（bolt-loose）。
 * <p>
 * 迁移自 `js/tools/connection.js` 工具 1「松螺栓连接（受轴向载荷）」，逐值对齐。
 */
@Component
public class BoltLooseTool implements CalcTool {

    @Override
    public String id() {
        return "bolt-loose";
    }

    @Override
    public CalcResult compute(Map<String, Object> v) {
        double F = CalcResult.num(v.get("F")) * 1000;
        double S = CalcResult.num(v.get("S"));
        if (!(F > 0)) return CalcResult.fail("请输入轴向工作载荷 F（kN）");
        if (!(S > 0)) return CalcResult.fail("请输入安全系数 S");
        double ss = ConnShared.gradeData(v)[0];
        double sigmaAllow = ss / S;

        if ("design".equals(CalcResult.str(v.get("mode")))) {
            double needD1 = Math.sqrt(4 * F / (Math.PI * sigmaAllow));
            String recD = ConnShared.pickThread(needD1);
            List<Row> rows = Arrays.asList(
                row("所需螺纹小径 d₁≥", needD1, "mm", 3).hl(),
                recD != null
                    ? ConnShared.htmlRow("推荐公称直径", "M" + recD + "（d₁=" + ConnShared.THREAD_D1.get(recD) + "mm）")
                    : ConnShared.htmlRow("推荐公称直径", "超出数据范围"),
                row("许用应力 [σ]=σs/S", sigmaAllow, "MPa", null).hl(),
                row("屈服强度 σs", ss, "MPa", null)
            );
            CalcResult r = CalcResult.empty();
            r.setSections(Arrays.asList(section("设计计算结果", rows)));
            r.setVerdict(verdict("ok", "所需小径 d₁ ≥ " + ConnShared.fmt(needD1, 3) + " mm，推荐选用 M" + recD, null));
            r.setNotes(Arrays.asList("松螺栓连接仅承受轴向拉伸（无预紧力），无需考虑 1.3 扭转系数。"));
            return r;
        }

        Double d1 = ConnShared.THREAD_D1.get(CalcResult.str(v.get("d")));
        if (d1 == null) return CalcResult.fail("未找到所选螺栓的小径数据");
        double A = Math.PI * d1 * d1 / 4;
        double sigma = F / A;
        boolean ok = sigma <= sigmaAllow;

        List<Row> rows = Arrays.asList(
            row("螺纹小径 d₁", d1, "mm", null),
            row("危险截面积 A", A, "mm²", 2),
            row("拉伸应力 σ=F/A", sigma, "MPa", null).hl(),
            row("许用应力 [σ]=σs/S", sigmaAllow, "MPa", null).hl(),
            row("屈服强度 σs", ss, "MPa", null),
            row("强度裕度", sigmaAllow / sigma, "", 2)
        );
        CalcResult r = CalcResult.empty();
        r.setSections(Arrays.asList(section("强度校核", rows)));
        r.setVerdict(verdict(
            ok ? "ok" : "bad",
            ok ? "校核通过：σ = " + ConnShared.fmt(sigma) + " MPa ≤ [σ] = " + ConnShared.fmt(sigmaAllow) + " MPa"
               : "校核不通过：σ = " + ConnShared.fmt(sigma) + " MPa > [σ] = " + ConnShared.fmt(sigmaAllow) + " MPa，请增大螺栓直径或提高等级",
            null));
        r.setNotes(Arrays.asList("松螺栓连接仅承受轴向拉伸，危险截面为螺纹小径处。"));
        return r;
    }
}
