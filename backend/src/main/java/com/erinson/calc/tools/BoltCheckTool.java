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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 螺栓连接强度校核（bolt-check）。
 * <p>
 * 迁移自 `js/tools/connection.js` 中工具 4「受轴向载荷-紧螺栓连接（静载荷）校核与设计」。
 * 与前端 `compute(v)` 逐值对齐，作为后续 65 个工具的迁移范式。
 */
@Component
public class BoltCheckTool implements CalcTool {

    @Override
    public String id() {
        return "bolt-check";
    }

    // 普通螺纹小径 GB/T 196-2003（mm）
    private static final Map<String, Double> THREAD_D1 = new LinkedHashMap<>();
    static {
        THREAD_D1.put("1", 0.693); THREAD_D1.put("1.2", 0.857); THREAD_D1.put("1.6", 1.171); THREAD_D1.put("2", 1.509);
        THREAD_D1.put("2.5", 1.948); THREAD_D1.put("3", 2.387); THREAD_D1.put("4", 3.242); THREAD_D1.put("5", 4.134);
        THREAD_D1.put("6", 4.917); THREAD_D1.put("8", 6.647); THREAD_D1.put("10", 8.376); THREAD_D1.put("12", 10.106);
        THREAD_D1.put("14", 11.835); THREAD_D1.put("16", 13.835); THREAD_D1.put("18", 15.294); THREAD_D1.put("20", 17.294);
        THREAD_D1.put("22", 19.294); THREAD_D1.put("24", 20.752); THREAD_D1.put("27", 23.752); THREAD_D1.put("30", 26.211);
        THREAD_D1.put("33", 29.211); THREAD_D1.put("36", 31.670); THREAD_D1.put("39", 34.670); THREAD_D1.put("42", 37.129);
        THREAD_D1.put("45", 40.129); THREAD_D1.put("48", 42.587); THREAD_D1.put("56", 50.046); THREAD_D1.put("64", 57.505);
    }
    private static final List<String> THREAD_SIZES = new ArrayList<>(THREAD_D1.keySet());

    // 性能等级 → 屈服强度 σs MPa（与 原站 1:1）
    private static final Map<String, Integer> GRADE_SS = new LinkedHashMap<>();
    static {
        GRADE_SS.put("3.6",180); GRADE_SS.put("4.6",240); GRADE_SS.put("4.8",320); GRADE_SS.put("5.6",300);
        GRADE_SS.put("5.8",400); GRADE_SS.put("6.8",480); GRADE_SS.put("8.8",640); GRADE_SS.put("9.8",720);
        GRADE_SS.put("10.9",900); GRADE_SS.put("12.9",1080); GRADE_SS.put("14.9",1260);
    }
    // 不锈钢等级 → [σs, σB]
    private static final Map<String, double[]> SS_DATA = new LinkedHashMap<>();
    static {
        SS_DATA.put("A*-50", new double[]{210,500}); SS_DATA.put("A*-70", new double[]{450,700});
        SS_DATA.put("A*-80", new double[]{600,800}); SS_DATA.put("C*-50", new double[]{250,500});
        SS_DATA.put("C*-70", new double[]{410,700}); SS_DATA.put("C*-80", new double[]{640,800});
        SS_DATA.put("C*-110", new double[]{820,1100}); SS_DATA.put("F1-45", new double[]{250,450});
        SS_DATA.put("F1-60", new double[]{410,600});
    }

    private static double gradeSs(Map<String, Object> v) {
        if ("ss".equals(CalcResult.str(v.get("matType")))) {
            double[] g = SS_DATA.getOrDefault(CalcResult.str(v.get("gradeSS")), SS_DATA.get("A*-70"));
            return g[0];
        }
        return GRADE_SS.getOrDefault(CalcResult.str(v.get("grade")), GRADE_SS.get("4.8"));
    }

    @Override
    public CalcResult compute(Map<String, Object> v) {
        double F = CalcResult.num(v.get("F")) * 1000;
        double S = CalcResult.num(v.get("S"));
        double kRes = CalcResult.num(v.get("resType"));
        double lambda = CalcResult.num(v.get("lambda"));
        if (F <= 0) return CalcResult.fail("请输入工作载荷 F（kN）");
        if (S <= 0) return CalcResult.fail("请输入安全系数 S");
        double ss = gradeSs(v);
        double sigmaAllow = ss / S;

        double F2 = kRes * F;                     // 残余预紧力
        double F0 = F2 + F;                       // 总拉力
        double Fp = F2 + (1 - lambda) * F;        // 预紧力

        if ("design".equals(CalcResult.str(v.get("mode")))) {
            double needD1 = Math.sqrt(4 * 1.3 * F0 / (Math.PI * sigmaAllow));
            String recD = null;
            for (String k : THREAD_SIZES) {
                if (THREAD_D1.get(k) >= needD1) { recD = k; break; }
            }
            List<Row> sec1 = Arrays.asList(
                row("残余预紧力 F″", F2, "N", null),
                row("螺栓预紧力 F′", Fp, "N", null),
                row("螺栓总拉力 F₀", F0, "N", null).hl()
            );
            List<Row> sec2 = Arrays.asList(
                row("所需螺纹小径 d₁≥", needD1, "mm", 3).hl(),
                recD != null
                    ? row("推荐公称直径", "M" + recD + "（d₁=" + THREAD_D1.get(recD) + "mm）", null, null)
                    : row("推荐公称直径", "超出数据范围", null, null),
                row("许用应力 [σ]=σs/S", sigmaAllow, "MPa", null).hl(),
                row("屈服强度 σs", ss, "MPa", null)
            );
            CalcResult r = CalcResult.empty();
            r.setSections(Arrays.asList(section("载荷计算", sec1), section("设计结果", sec2)));
            r.setVerdict(verdict("ok", "所需 d₁ ≥ " + fmt(needD1, 3) + " mm，推荐选用 M" + (recD == null ? "--" : recD), null));
            r.setNotes(Arrays.asList("设计计算取总拉力 F₀ = F″ + F，按 1.3 倍系数求所需小径。"));
            return r;
        }

        Double d1 = THREAD_D1.get(CalcResult.str(v.get("d")));
        if (d1 == null) return CalcResult.fail("未找到所选螺栓的小径数据");
        double A = Math.PI * d1 * d1 / 4;
        double sigma = 1.3 * F0 / A;
        boolean ok = sigma <= sigmaAllow;

        List<Row> sec1 = Arrays.asList(
            row("残余预紧力 F″", F2, "N", null),
            row("螺栓预紧力 F′", Fp, "N", null),
            row("螺栓总拉力 F₀", F0, "N", null).hl(),
            row("被连接件剩余预紧力", F2, "N", null)
        );
        List<Row> sec2 = Arrays.asList(
            row("螺纹小径 d₁", d1, "mm", null),
            row("危险截面积 A", A, "mm²", 2),
            row("计算应力 σca=1.3F₀/A", sigma, "MPa", null).hl(),
            row("许用应力 [σ]=σs/S", sigmaAllow, "MPa", null).hl(),
            row("屈服强度 σs", ss, "MPa", null),
            row("强度裕度", sigmaAllow / sigma, "", 2)
        );
        CalcResult r = CalcResult.empty();
        r.setSections(Arrays.asList(section("载荷计算", sec1), section("强度校核", sec2)));
        r.setVerdict(verdict(
            ok ? "ok" : "bad",
            ok ? "校核通过：σca = " + fmt(sigma, 0) + " MPa ≤ [σ] = " + fmt(sigmaAllow, 0) + " MPa"
               : "校核不通过：σca = " + fmt(sigma, 0) + " MPa > [σ] = " + fmt(sigmaAllow, 0) + " MPa，请增大大径或提高性能等级",
            "若不满足，可：① 增大螺栓直径 ② 提高性能等级 ③ 改用金属垫片降低相对刚度 ④ 改善预紧控制"));
        r.setNotes(Arrays.asList(
            "总拉力 F₀ = F″ + F（亦即 F′ + λF），其中 λ 为相对刚度系数。",
            "1.3 为考虑拧紧时螺纹副中扭转切应力的折算系数。",
            "不控制预紧力时安全系数与螺栓直径有关（M6~M16：1.6~3），此处由用户直接输入。"));
        return r;
    }

    /* ---- 前端 fmt 相同逻辑：v 非数字返回 '--'，-0 归一，去尾零 ---- */
    static double round1(double x) { return x; }
    private static String fmt(double v) { return fmt(v, -1); }
    private static String fmt(double v, int d) {
        if (Double.isNaN(v) || Double.isInfinite(v)) return Double.isInfinite(v) ? "∞" : "--";
        double av = Math.abs(v);
        if (d < 0) {
            d = av >= 100000 ? 0 : av >= 100 ? 1 : av >= 1 ? 2 : av >= 0.01 ? 4 : 6;
        }
        String s = String.format(java.util.Locale.US, "%." + d + "f", v);
        if (s.contains(".")) {
            s = s.replaceAll("0+$", "").replaceAll("\\.$", "");
        }
        if ("-0".equals(s)) s = "0";
        return s;
    }
}