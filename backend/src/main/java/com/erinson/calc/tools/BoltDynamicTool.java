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
 * 螺栓连接动载荷校核（bolt-dynamic）。
 * <p>
 * 迁移自 `js/tools/connection.js` 工具 5「受轴向载荷-紧螺栓连接（动载荷）」，逐值对齐。
 */
@Component
public class BoltDynamicTool implements CalcTool {

    @Override
    public String id() {
        return "bolt-dynamic";
    }

    @Override
    public CalcResult compute(Map<String, Object> v) {
        double F = CalcResult.num(v.get("F")) * 1000;
        double lambda = CalcResult.num(v.get("lambda"));
        double S = CalcResult.num(v.get("Sa1"));
        if (!(F > 0)) return CalcResult.fail("请输入轴向工作载荷 F（kN）");
        if (!(S > 0)) return CalcResult.fail("请输入安全系数 Sa1");

        double[] gd = ConnShared.gradeData(v);
        double ss = gd[0], sb = gd[1];
        boolean isSS = "ss".equals(CalcResult.str(v.get("matType")));
        double s1tRec = isSS
            ? ConnShared.SS_DATA.getOrDefault(CalcResult.str(v.get("gradeSS")), ConnShared.SS_DATA.get("A*-70"))[2]
            : ConnShared.GRADE_S1T.getOrDefault(CalcResult.str(v.get("grade")), 140);
        double ksRec = ConnShared.ksBySb(sb);

        double ksigma = ConnShared.numNaN(v.get("Ksigma")) > 0 ? ConnShared.numNaN(v.get("Ksigma")) : ksRec;
        double Kt = "roll".equals(CalcResult.str(v.get("process"))) ? 1.25 : 1;
        double Ku = "tens".equals(CalcResult.str(v.get("nutType"))) ? 1.55 : 1;

        if ("design".equals(CalcResult.str(v.get("mode")))) {
            double epsilon = ConnShared.numNaN(v.get("epsilon")) > 0 ? ConnShared.numNaN(v.get("epsilon")) : 1;
            double sigmaAAllow = epsilon * Kt * Ku * s1tRec / (ksRec * S);
            double needD1 = Math.sqrt(2 * lambda * F / (Math.PI * sigmaAAllow));
            String recD = ConnShared.pickMTSize(needD1);
            List<Row> sec1 = Arrays.asList(
                row("螺栓抗拉强度 σB", sb, "MPa", null),
                row("螺栓屈服强度 σs", ss, "MPa", null),
                row("抗压疲劳强度 σ-1t", s1tRec, "MPa", null),
                row("尺寸因数 ε", epsilon, "", null),
                row("制造工艺因数 Kt", Kt, "", null),
                row("受力不均匀因数 Ku", Ku, "", null),
                row("缺口应力集中因数 Kσ", ksRec, "", null),
                row("安全系数 Sa1", S, "", null),
                row("许用应力幅 [σa]", sigmaAAllow, "MPa", 2).hl()
            );
            List<Row> sec2 = Arrays.asList(
                row("所需螺纹小径 d₁≥", needD1, "mm", 3).hl(),
                recD != null
                    ? ConnShared.htmlRow("应选用螺栓公称直径", "M" + recD)
                    : ConnShared.htmlRow("应选用螺栓公称直径", "超出数据范围"),
                recD != null
                    ? htmlRowUnit("螺栓小径 d₁", String.valueOf(ConnShared.THREAD_D1.get(recD)), "mm")
                    : htmlRowUnit("螺栓小径 d₁", "--", "")
            );
            CalcResult r = CalcResult.empty();
            r.setSections(Arrays.asList(section("材料与疲劳参数", sec1), section("设计结果", sec2)));
            r.setVerdict(verdict("ok", "按疲劳强度设计，所需 d₁ ≥ " + ConnShared.fmt(needD1, 3)
                + " mm，应选用 M" + (recD == null ? "--" : recD), null));
            r.setNotes(Arrays.asList(
                "设计模式下尺寸因数 ε 取 1（直径未定），与 原站 一致。",
                "动载荷设计后还应进行静强度校核（见静载荷工具）。"));
            return r;
        }

        Double d1 = ConnShared.THREAD_D1.get(CalcResult.str(v.get("d")));
        if (d1 == null) return CalcResult.fail("未找到所选螺栓的小径数据");
        double epsRec = ConnShared.sizeFactor(ConnShared.numNaN(v.get("d")));
        double epsilon = ConnShared.numNaN(v.get("epsilon")) > 0 ? ConnShared.numNaN(v.get("epsilon")) : epsRec;
        double A = Math.PI * d1 * d1 / 4;
        double sigmaA = lambda * F / (2 * A);
        double sigmaAAllow = epsilon * Kt * Ku * s1tRec / (ksigma * S);
        boolean ok = sigmaA <= sigmaAAllow;

        List<Row> sec1 = Arrays.asList(
            row("螺栓抗拉强度 σB", sb, "MPa", null),
            row("螺栓屈服强度 σs", ss, "MPa", null),
            row("抗压疲劳强度 σ-1t", s1tRec, "MPa", null),
            row("尺寸因数 ε", epsilon, "", null),
            row("制造工艺因数 Kt", Kt, "", null),
            row("受力不均匀因数 Ku", Ku, "", null),
            row("缺口应力集中因数 Kσ", ksigma, "", null),
            row("安全系数 Sa1", S, "", null),
            row("许用应力幅 [σa]", sigmaAAllow, "MPa", 2).hl()
        );
        List<Row> sec2 = Arrays.asList(
            ConnShared.htmlRow("螺栓公称直径", "M" + CalcResult.str(v.get("d"))),
            row("螺栓小径 d₁", d1, "mm", null),
            row("危险截面积 A", A, "mm²", 2),
            row("计算应力幅 σa=λF/(2A)", sigmaA, "MPa", 2).hl()
        );
        CalcResult r = CalcResult.empty();
        r.setSections(Arrays.asList(section("材料与疲劳参数", sec1), section("校核结果", sec2)));
        r.setVerdict(verdict(
            ok ? "ok" : "bad",
            ok ? "校核通过：σa = " + ConnShared.fmt(sigmaA, 2) + " MPa ≤ [σa] = " + ConnShared.fmt(sigmaAAllow, 2) + " MPa"
               : "校核不通过：σa = " + ConnShared.fmt(sigmaA, 2) + " MPa > [σa] = " + ConnShared.fmt(sigmaAAllow, 2) + " MPa",
            "若不满足，可：① 增大螺栓直径 ② 提高性能等级 ③ 降低相对刚度 ④ 采用滚制螺纹 ⑤ 采用受拉螺母"));
        r.setNotes(Arrays.asList(
            "应力幅 σa = λF/(2A)，工作载荷在 0~F 之间脉动变化。",
            "许用应力幅 [σa] = ε·Kt·Ku·σ-1t/(Kσ·Sa1)，与 原站 完全一致。",
            "抗压疲劳强度 σ-1t = 0.35σB（按等级数据表）。",
            "Kσ 按 σB 推荐：≤400→3，≤600→3.9，≤800→4.8，其余 5.2；ε 按公称直径查表。",
            "动载荷下还需进行静强度校核（见静载荷工具）。"));
        return r;
    }

    private static CalcResult.Row htmlRowUnit(String label, String html, String unit) {
        CalcResult.Row r = ConnShared.htmlRow(label, html);
        r.setUnit(unit);
        return r;
    }
}
