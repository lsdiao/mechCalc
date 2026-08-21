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
 * 压缩弹簧设计计算（spring-design）。
 * <p>
 * 迁移自 `js/tools/connection.js` 工具「压缩弹簧设计计算」，逐值对齐。
 */
@Component
public class SpringDesignTool implements CalcTool {

    @Override
    public String id() {
        return "spring-design";
    }

    @Override
    public CalcResult compute(Map<String, Object> v) {
        double F2 = ConnShared.numNaN(v.get("F2"));
        double lam2 = ConnShared.numNaN(v.get("lam2"));
        double F1 = ConnShared.numNaN(v.get("F1"));
        double C = ConnShared.numNaN(v.get("C"));
        if (!(F2 > 0) || !(lam2 > 0)) return CalcResult.fail("请输入最大工作载荷 F₂ 与最大变形量 λ₂");
        if (!(C >= 4 && C <= 16)) return CalcResult.fail("旋绕比 C 建议取 4~16");

        String matKey = CalcResult.str(v.get("mat"));
        String cls = CalcResult.str(v.get("cls"));
        double G = ConnShared.SPRING_G.getOrDefault(matKey, 79000.0);
        double[][] sbTable = ConnShared.SPRING_SB.get(matKey);
        double tau2 = ConnShared.SPRING_TAU2.getOrDefault(matKey, Double.NaN);

        double K = (4 * C - 1) / (4 * C - 4) + 0.615 / C;   // 曲度系数（Wahl）
        double d, dCalc, tauAllow = Double.NaN;
        if (sbTable != null) {
            /* 碳素钢丝：σb 随直径降低 → [τ]=比例·σb(d) 随选径迭代 */
            double frac = ConnShared.CARBON_CLASS.getOrDefault(cls, 0.4);
            d = Double.NaN;
            dCalc = 0;
            boolean found = false;
            for (double di : ConnShared.WIRE_SERIES) {
                double tauI = frac * ConnShared.sbLookup(sbTable, di);
                double need = 1.6 * Math.sqrt(K * C * F2 / tauI);
                if (di >= need) { d = di; tauAllow = tauI; dCalc = need; found = true; break; }
            }
            if (!found) {
                d = ConnShared.WIRE_SERIES[ConnShared.WIRE_SERIES.length - 1];
                tauAllow = frac * ConnShared.sbLookup(sbTable, d);
                dCalc = 1.6 * Math.sqrt(K * C * F2 / tauAllow);
            }
        } else {
            tauAllow = tau2 * ConnShared.SPRING_CLASS.getOrDefault(cls, 1.0);
            dCalc = 1.6 * Math.sqrt(K * C * F2 / tauAllow);
            d = Double.NaN;
            for (double w : ConnShared.WIRE_SERIES) {
                if (w >= dCalc) { d = w; break; }
            }
            if (Double.isNaN(d)) d = Math.ceil(dCalc);
        }
        double tauCheck = 8 * K * F2 * (C * d) / (Math.PI * Math.pow(d, 3));
        double D2 = C * d;                                   // 中径
        double D1 = D2 - d, Dd = D2 + d;                     // 内径/外径
        double k = F2 / lam2;                                // 刚度 N/mm
        double n = G * Math.pow(d, 4) / (8 * Math.pow(D2, 3) * k); // 有效圈数
        double nR = Math.max(2, Math.round(n * 0.5) / 0.5);   // 圈数取 0.5 圈尾数
        String endType = CalcResult.str(v.get("endType"));
        double nTotal = nR + ("2".equals(endType) ? 2 : "2.5".equals(endType) ? 2.5 : 2);
        double kReal = G * Math.pow(d, 4) / (8 * Math.pow(D2, 3) * nR);
        double delta = 0.1 * d;                              // 余隙
        double t = d + lam2 / nR + delta;                    // 节距 t = d + λ2/n + δ
        double H0 = nR * t + ("2x".equals(endType) ? 3 : 1.5) * d;
        double b = H0 / D2;                                  // 稳定性细长比
        double alpha = Math.atan(t / (Math.PI * D2)) * 180 / Math.PI;
        double lam1 = F1 / kReal;
        double Fmin = kReal * lam2;
        boolean stable = b <= 5.3;
        Double sbShow = sbTable != null ? ConnShared.sbLookup(sbTable, d) : null;

        List<Row> sec1 = Arrays.asList(
            row("钢丝抗拉强度 σb（GB/T 4357）", sbShow, "MPa", 0),
            row("材料许用切应力 [τ]", tauAllow, "MPa", 0).hl(),
            row("曲度系数 K", K, null, 3),
            row("试算簧丝直径", dCalc, "mm", 3),
            row("选用簧丝直径 d", d, "mm", null).hl(),
            row("校核切应力 τ=8K·F₂·D₂/(π·d³)", tauCheck, "MPa", null).hl()
        );
        List<Row> sec2 = Arrays.asList(
            row("弹簧中径 D₂=C·d", D2, "mm", null).hl(),
            row("弹簧内径 D₁", D1, "mm", null),
            row("弹簧外径 D", Dd, "mm", null),
            row("有效圈数 n", nR, "圈", null).hl(),
            row("总圈数 n₁", nTotal, "圈", null),
            row("节距 t≈d+λ₂/n+0.1d", t, "mm", 2),
            row("自由高度 H₀（估算）", H0, "mm", 1),
            row("螺旋角 α（5°~9°为宜）", alpha, "°", 2)
        );
        List<Row> sec3 = Arrays.asList(
            row("理论刚度 k=F₂/λ₂", k, "N/mm", 3),
            row("实际刚度（圆整圈数后）", kReal, "N/mm", 3).hl(),
            row("最小载荷变形 λ₁", lam1, "mm", 2),
            row("λ₂ 时实际载荷", Fmin, "N", 1),
            row("稳定性细长比 b=H₀/D₂", b, null, 2).hl()
        );
        CalcResult r = CalcResult.empty();
        r.setSections(Arrays.asList(
            section("材料与强度", sec1),
            section("几何参数", sec2),
            section("刚度与变形", sec3)));
        r.setVerdict(verdict(
            (stable && tauCheck <= tauAllow) ? "ok" : "warn",
            (tauCheck <= tauAllow ? "强度满足（τ=" + ConnShared.fmt(tauCheck, 1) + "≤[τ]）"
                                  : "强度不足（τ=" + ConnShared.fmt(tauCheck, 1) + "＞[τ]=" + ConnShared.fmt(tauAllow) + "）")
                + (stable ? "，稳定性 b=" + ConnShared.fmt(b, 2) + " ≤ 5.3"
                          : "；稳定性不足：b=" + ConnShared.fmt(b, 2) + " > 5.3，弹簧可能失稳"),
            "细长比许用值：两端固定 5.3、一端固定一端回转 3.7、两端回转 2.6；超限时应加导杆或导套。"));
        r.setNotes(Arrays.asList(
            "簧丝直径按 GB/T 1358 第一系列圆整；圈数尾数取 0.5 圈。",
            "节距 t 的估算采用 t = d + λ₂/n + δ（δ≈0.1d 余隙），并保证在最大压缩时仍有少量间隙。",
            "碳素弹簧钢丝（B/C级）σb 随直径增大而降低（GB/T 4357），许用切应力按 [τ]=0.5σb（III类）/0.4σb（II类）/0.3σb（I类）随选径自动取值；合金钢（60Si2Mn、50CrVA）油淬火后 [τ] 按类别系数取定值。"));
        return r;
    }
}
