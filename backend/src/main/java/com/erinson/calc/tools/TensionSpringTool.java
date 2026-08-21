package com.erinson.calc.tools;

import com.erinson.calc.common.CalcResult;
import com.erinson.calc.common.CalcResult.Row;
import com.erinson.calc.common.CalcResult.Section;
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
 * 拉伸弹簧设计计算（tension-spring）。
 * <p>
 * 迁移自 `js/tools/other1.js` 工具 1，逐值对齐 golden。
 */
@Component
public class TensionSpringTool implements CalcTool {

    // 弹簧钢丝材料库：代号 → [G, σb]（原站 springsdesign.min.js 解混淆确认）
    private static final Map<String, String> MAT_NAME = new LinkedHashMap<>();
    private static final Map<String, double[]> MAT_DATA = new LinkedHashMap<>();
    static {
        putMat("GB4359", "阀门用油淬火回火碳素弹簧钢丝(GB4359)", 79000, 1373);
        putMat("GB4360A", "油淬火回火碳素弹簧钢丝(GB4360)A类", 79000, 1470);
        putMat("GB4360B", "油淬火回火碳素弹簧钢丝(GB4360)B类", 79000, 1570);
        putMat("GB4361A", "油淬火回火硅锰合金弹簧钢丝(GB4361)A类", 79000, 1765);
        putMat("GB4361B", "油淬火回火硅锰合金弹簧钢丝(GB4361)B类", 79000, 1765);
        putMat("GB4361C", "油淬火回火硅锰合金弹簧钢丝(GB4361)C类", 79000, 1765);
        putMat("GB4362", "阀门用油淬火回火铬硅合金弹簧钢丝(GB4362)", 79000, 1570);
        putMat("GB2271", "阀门用油淬火回火铬钒合金弹簧钢丝(GB2271)", 79000, 1470);
        putMat("GB4357B", "碳素弹簧钢丝(GB4357)B级", 79000, 1373);
        putMat("GB4357C", "碳素弹簧钢丝(GB4357)C级", 79000, 1470);
        putMat("GB4357D", "碳素弹簧钢丝(GB4357)D级", 79000, 1570);
        putMat("GB4358G1", "琴钢丝(GB4358)G1组", 79000, 2550);
        putMat("GB4358G2", "琴钢丝(GB4358)G2组", 79000, 2450);
        putMat("GB4358F", "琴钢丝(GB4358)F组", 79000, 2060);
        putMat("YB(T)11A", "弹簧用不锈钢丝YB(T)11A组", 71000, 1275);
        putMat("YB(T)11B", "弹簧用不锈钢丝YB(T)11B组", 71000, 1373);
        putMat("YB(T)11C", "弹簧用不锈钢丝YB(T)11C组", 71000, 1470);
    }
    private static void putMat(String key, String name, double g, double sb) {
        MAT_NAME.put(key, name);
        MAT_DATA.put(key, new double[]{g, sb});
    }

    // 许用切应力 [τ]=CLASS_TAU·σb（III/II/I 类，拉伸弹簧含初拉力折减）
    private static final Map<String, Double> CLASS_TAU = new LinkedHashMap<>();
    // 疲劳极限系数 FATIGUE_K·σb（变载）
    private static final Map<String, Double> FATIGUE_K = new LinkedHashMap<>();
    static {
        CLASS_TAU.put("c3", 0.40); CLASS_TAU.put("c2", 0.33); CLASS_TAU.put("c1", 0.25);
        FATIGUE_K.put("c1", 0.30); FATIGUE_K.put("c2", 0.35); FATIGUE_K.put("c3", 0.45);
    }
    private static final double TAU_FRAC = 0.8;   // 试验切应力 τs≈0.8σb

    @Override
    public String id() {
        return "tension-spring";
    }

    @Override
    public CalcResult compute(Map<String, Object> v) {
        double F1 = ConnShared.numNaN(v.get("F1"));
        double F2 = ConnShared.numNaN(v.get("F2"));
        double h = ConnShared.numNaN(v.get("h"));
        double d = ConnShared.numNaN(v.get("d"));
        double D = ConnShared.numNaN(v.get("D"));
        double n = ConnShared.numNaN(v.get("n"));
        double C = ConnShared.numNaN(v.get("C"));
        double Nc = ConnShared.numNaN(v.get("loadTimes"));
        if (!(F2 > 0) || !(h > 0) || !(d > 0) || !(D > 0) || !(n > 0) || !(C >= 4 && C <= 16))
            return CalcResult.fail("请完整输入载荷、行程与弹簧参数；旋绕比 C 建议 4~16");
        if (F2 <= F1) return CalcResult.fail("工作载荷 F₂ 必须大于安装载荷 F₁");

        String matKey = CalcResult.str(v.get("material"));
        double[] mat = MAT_DATA.getOrDefault(matKey, MAT_DATA.get("GB4359"));
        String matName = MAT_NAME.getOrDefault(matKey, MAT_NAME.get("GB4359"));
        double G = mat[0], sigmaB = mat[1];

        // 载荷分类：<1000=Ⅲ / ≤10⁶=Ⅱ / >10⁶=Ⅰ
        String cls = Nc < 1000 ? "c3" : (Nc <= 1000000 ? "c2" : "c1");
        String clsName = "c3".equals(cls) ? "Ⅲ类" : ("c2".equals(cls) ? "Ⅱ类" : "Ⅰ类");
        double K = (4 * C - 1) / (4 * C - 4) + 0.615 / C;   // 曲度系数 Wahl
        double D1 = D - d, Dd = D + d;                       // 内径 / 外径
        double tauAllow = CLASS_TAU.get(cls) * sigmaB;       // 许用切应力
        double force0 = ConnShared.numNaN(v.get("force0"));
        double F0 = force0 > 0 ? force0 : Math.PI * Math.pow(d, 3) * G / (8 * D * 1000); // 初拉力
        double F2s = F2 + F0, F1s = F1 + F0;                 // 计入初拉力的实际弹簧力
        double dCalc = 1.6 * Math.sqrt(K * C * F2s / tauAllow);   // 试算直径
        double tau2 = K * 8 * F2s * D / (Math.PI * Math.pow(d, 3)); // τ=K·8F·D/(πd³)
        double tau1 = K * 8 * F1s * D / (Math.PI * Math.pow(d, 3));
        double kReq = (F2 - F1) / h;                         // 要求刚度
        double kAct = G * Math.pow(d, 4) / (8 * Math.pow(D, 3) * n); // 实际刚度
        double err = (kAct - kReq) / kReq * 100;             // 刚度相对误差
        double f1 = (F1s - F0) / kAct, f2 = (F2s - F0) / kAct;       // 变形量
        double tauS = TAU_FRAC * sigmaB;                     // 试验切应力
        double Fs = tauS * Math.PI * Math.pow(d, 3) / (8 * K * D) - F0; // 试验载荷
        double rat = tau1 / tau2;                            // 切应力比 γ
        double Sf = FATIGUE_K.get(cls) * sigmaB / tau2;      // 疲劳安全系数

        boolean strengthOk = tau2 <= tauAllow;
        boolean fatigueOk = Sf >= 1.1;
        List<String> issues = new ArrayList<>();
        if (!strengthOk) issues.add("切应力 τ₂=τmax=" + Fmt.fmt(tau2, 1) + "MP 超过许用 " + Fmt.fmt(tauAllow) + "MPa，需加大钢丝直径 d");
        if (!fatigueOk) issues.add("疲劳安全系数 S=" + Fmt.fmt(Sf, 2) + "＜1.1，需增大 d 或 D 或降低 F₂");
        if (Math.abs(err) > 10) issues.add("刚度相对误差 |" + Fmt.fmt(err, 1) + "|% 超出 ±10%，需调 d、D 或 n");

        List<Row> sec1 = Arrays.asList(
            row("要求刚度 k₀=(F₂−F₁)/h", nn(kReq), "N/mm", 3).hl(),
            row("载荷作用次数 N", nn(Nc), null, 0),
            row("载荷类型", clsName, null, null),
            row("切变模量 G（" + matName + "）", nn(G), "MPa", 0),
            row("平均抗拉强度 σb", nn(sigmaB), "MPa", 0),
            row("许用切应力 [τ]", nn(tauAllow), "MPa", 0).hl()
        );
        List<Row> sec2 = Arrays.asList(
            row("曲度系数 K=(4C-1)/(4C-4)+0.615/C", nn(K), null, 3).hl(),
            row("旋绕比 C", nn(C), null, 1),
            row("试算钢丝直径 d'=1.6√(K·C·F/[τ])", nn(dCalc), "mm", 2),
            row("选用钢丝直径 d", nn(d), "mm", null).hl(),
            row("切应力 τ=K·8F₂·D/(π·d³)", nn(tau2), "MPa", null).hl(),
            row("强度判定", strengthOk ? "满足" : "不满足", null, null).hl()
        );
        List<Row> sec3 = Arrays.asList(
            row("实际刚度 k=G·d⁴/(8D³·n)", nn(kAct), "N/mm", 3).hl(),
            row("刚度相对误差", nn(err), "%", 2),
            row("弹簧内径 D₁", nn(D1), "mm", 1),
            row("弹簧外径 D₂=D+d", nn(Dd), "mm", 1),
            row("初拉力 F₀", nn(F0), "N", 1),
            row("安装变形量 f₁", nn(f1), "mm", 2),
            row("工作变形量 f₂", nn(f2), "mm", 2).hl()
        );
        List<Row> sec4 = Arrays.asList(
            row("切应力比 γ=τ₁/τ₂(=τ_min/τ_max)", nn(rat), null, 2),
            row("疲劳安全系数 S", nn(Sf), null, 2).hl(),
            row("试验载荷 Fs", nn(Fs), "N", 0),
            row("疲劳判定（S≥1.1）", fatigueOk ? "满足" : "不满足", null, null).hl()
        );
        CalcResult r = CalcResult.empty();
        r.setSections(Arrays.asList(
            section("设计要求与载荷", sec1),
            section("强度校核", sec2),
            section("刚度与变形", sec3),
            section("疲劳校核", sec4)
        ));
        r.setVerdict(verdict(
            (strengthOk && fatigueOk && Math.abs(err) <= 10) ? "ok" : "warn",
            issues.isEmpty()
                ? "强度满足（τmax=" + Fmt.fmt(tau2, 1) + "≤[τ]）、疲劳 S=" + Fmt.fmt(Sf, 2)
                    + "≥1.1、刚度误差 " + Fmt.fmt(Math.abs(err), 1) + "%"
                : String.join("；", issues),
            "疲劳安全 S≥1.1（Ⅱ/I 类变载）；试验变形 fs 用于弹簧特性校核（f/fs 宜在 0.2~0.8）。"));
        r.setNotes(Arrays.asList(
            "曲度系数（Wahl）：K=(4C-1)/(4C-4)+0.615/C；切应力 τ=K·8F·D/(π·d³)（D 为中径）。",
            "拉伸弹簧计入初拉力 F₀：实际弹簧力 F = F外 + F₀；当 F₀ 填 0 时系统按 F₀=π·d³·G/(8·D·1000) 估算（源自 springsdesign.min.js 的 force0Cal()）。",
            "刚度 k=G·d⁴/(8·D³·n)；载荷分类：<1000次=Ⅲ类、10³~10⁶=Ⅱ类、>10⁶=Ⅰ类。"));
        return r;
    }

    /** 与前端 JSON.stringify(NaN)=null 对齐：NaN/∞ 时行值输出 null */
    private static Object nn(double x) {
        return (Double.isNaN(x) || Double.isInfinite(x)) ? null : x;
    }
}
