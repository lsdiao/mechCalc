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
 * 滑动螺旋传动计算（screw-transmission）。
 * <p>
 * 迁移自 `js/tools/other1.js` 工具 3，耐磨性→自锁/效率→螺杆强度→螺纹强度→稳定性逐项校核，逐值对齐 golden。
 */
@Component
public class ScrewTransmissionTool implements CalcTool {

    // 梯形螺纹标准（GB/T 5796）公称直径×螺距 → 中径 d₂=d-0.5P
    private static final double[][] TR_THREAD = {
        {10, 2}, {12, 3}, {16, 4}, {20, 4}, {24, 5}, {28, 5}, {32, 6}, {36, 6},
        {40, 7}, {44, 7}, {48, 8}, {52, 8}, {56, 8}, {60, 9}, {65, 9}, {70, 10},
        {80, 10}, {90, 12}, {100, 12}
    };
    // 端部结构 → 长度系数 μ
    private static final Map<String, Double> END_MU = new LinkedHashMap<>();
    // 螺杆材料 → 屈服强度 σs（MPa）
    private static final Map<String, Integer> REV_YIELD = new LinkedHashMap<>();
    static {
        END_MU.put("两端固定", 0.5);
        END_MU.put("两端铰支", 1.0);
        END_MU.put("一端固定，一端不完全固定", 0.6);
        END_MU.put("一端固定，一端铰支", 0.7);
        END_MU.put("一端固定，一端自由", 2.0);

        REV_YIELD.put("45号钢", 360); REV_YIELD.put("50号钢", 375); REV_YIELD.put("Y40Mn", 300);
        REV_YIELD.put("40Cr", 785); REV_YIELD.put("40CrMn", 835); REV_YIELD.put("65Mn", 432);
        REV_YIELD.put("T10", 630); REV_YIELD.put("T12", 785); REV_YIELD.put("20CrMnTi", 835);
        REV_YIELD.put("CrWMn", 930); REV_YIELD.put("9Mn2V", 740); REV_YIELD.put("38CrMoAl", 835);
        REV_YIELD.put("35号钢", 315); REV_YIELD.put("20CrMo", 685); REV_YIELD.put("42CrMo", 930);
        REV_YIELD.put("50Mn", 390); REV_YIELD.put("60Mn", 412); REV_YIELD.put("55号钢", 385);
        REV_YIELD.put("GCr15", 1667); REV_YIELD.put("GCr15SiMn", 1765); REV_YIELD.put("9Cr18", 552);
    }

    @Override
    public String id() {
        return "screw-transmission";
    }

    @Override
    public CalcResult compute(Map<String, Object> v) {
        double F = ConnShared.numNaN(v.get("F"));
        double psi = ConnShared.numNaN(v.get("psi"));
        double pAllow = ConnShared.numNaN(v.get("pAllow"));
        double L = ConnShared.numNaN(v.get("workLength"));
        double l = ConnShared.numNaN(v.get("supportDist"));
        if (!(F > 0) || !(psi > 0) || !(pAllow > 0))
            return CalcResult.fail("请完整输入轴向载荷、高径比与许用压强");

        boolean isTr = "梯形螺纹".equals(CalcResult.str(v.get("thread")));
        double mu = END_MU.getOrDefault(CalcResult.str(v.get("endStruct")), 0.5);
        double beta = isTr ? 15 : 3;                          // 半牙型角：梯形 15°、锯齿 3°

        // 1) 耐磨性：d₂≥kd·√(F/(ψ·[p]))（梯形 h=0.5P 用 0.8，锯齿 h=0.75P 用 0.65）
        double kd = isTr ? 0.8 : 0.65;
        double d2req = kd * Math.sqrt(F / (psi * pAllow));
        // 取标准梯形螺纹
        double[] sel = TR_THREAD[0];
        for (double[] row : TR_THREAD) {
            double dSel = row[0], pSel = row[1];
            if (dSel - 0.5 * pSel >= d2req) { sel = row; break; }
        }
        double d = sel[0], P = sel[1], d2 = d - 0.5 * P;
        double H1 = isTr ? 0.5 * P : 0.75 * P;                // 工作牙高
        double b = isTr ? 0.65 * P : 0.7 * P;                 // 牙根宽
        double d3 = isTr ? (d - P) : (d - 1.5 * P);           // 小径（螺杆底径）

        // 2) 耐磨性校核
        double H = psi * d2;                                  // 螺母高度
        double z = H / P;                                     // 旋合圈数
        double p = F / (Math.PI * d2 * H1 * z);               // 工作压强
        boolean wearOk = p <= pAllow;

        // 3) 导程、导程角、自锁与效率
        double nLines = ConnShared.numNaN(v.get("nLines"));
        double Slead = nLines * P;                            // 导程
        double gamma = Math.atan(Slead / (Math.PI * d2));     // 导程角 rad
        double f = ConnShared.numNaN(v.get("f"));
        double fv = f / Math.cos(beta * Math.PI / 180);       // 当量摩擦系数
        double rhoV = Math.atan(fv);                          // 当量摩擦角
        boolean selfLock = gamma < rhoV;
        double eta = Math.tan(gamma) / Math.tan(gamma + rhoV) * ConnShared.numNaN(v.get("eff"));
        double T = F * d2 / 2 * Math.tan(gamma + rhoV);       // 驱动力矩 N·mm

        // 4) 螺杆强度（第四强度理论）
        double A = Math.PI * d3 * d3 / 4;
        double sigma = F / A;
        double tauT = T / (0.2 * d3 * d3 * d3);
        double sigmaCa = Math.sqrt(sigma * sigma + 3 * tauT * tauT);
        double sigmaAllow = ConnShared.numNaN(v.get("sigmaAllow"));
        boolean screwOk = sigmaCa <= sigmaAllow;

        // 5) 螺纹强度（剪切+弯曲）
        double tauOut = F / (Math.PI * d * b * z);            // 螺杆剪应力
        double sigmaBendOut = 3 * F * H1 / (Math.PI * d * b * b * z); // 螺杆弯曲
        double tauIn = F / (Math.PI * d3 * b * z);            // 螺母（内螺纹）剪应力
        double sigmaBendIn = 3 * F * H1 / (Math.PI * d3 * b * b * z);
        boolean threadOk = tauOut <= ConnShared.numNaN(v.get("tauOut"))
                && sigmaBendOut <= ConnShared.numNaN(v.get("sigmaBendOut"))
                && tauIn <= ConnShared.numNaN(v.get("tauIn"))
                && sigmaBendIn <= ConnShared.numNaN(v.get("sigmaBendIn"));

        // 6) 稳定性（λ 法）：λ=μ·l/i，i=d3/4
        double irad = d3 / 4;
        double lambda = mu * l / irad;
        double E = 210000;
        double ss = REV_YIELD.getOrDefault(CalcResult.str(v.get("screwMat")), 360);
        double lam1 = 105, lam2 = 61, aC = 304, bC = 1.12;    // 45# 钢中柔度经验常数
        double sigmaCr;
        if (lambda > lam1) sigmaCr = Math.PI * Math.PI * E / (lambda * lambda); // 大柔度 Euler
        else if (lambda > lam2) sigmaCr = aC - bC * lambda;                     // 中柔度直线公式
        else sigmaCr = ss;                                                     // 小柔度 屈服
        double Fcr = sigmaCr * A;
        double Sst = Fcr / F;
        double stabilityS = ConnShared.numNaN(v.get("stabilityS"));
        boolean stOk = Sst >= stabilityS;

        List<String> issues = new ArrayList<>();
        if (!wearOk) issues.add("工作压强 p=" + Fmt.fmt(p, 2) + "MPa＞[p]=" + Fmt.fmt(pAllow) + "MPa，耐磨性不足");
        if (!selfLock) issues.add("γ=" + Fmt.fmt(gamma * 180 / Math.PI, 2) + "°≥ρᵥ=" + Fmt.fmt(rhoV * 180 / Math.PI, 2) + "°，不满足自锁条件");
        if (!screwOk) issues.add("螺杆当量应力 σ_ca=" + Fmt.fmt(sigmaCa, 1) + "MPa＞[σ]=" + Fmt.fmt(sigmaAllow) + "MPa");
        if (!threadOk) issues.add("螺纹剪切/弯曲强度不足（螺杆 τ=" + Fmt.fmt(tauOut, 1) + " 弯曲=" + Fmt.fmt(sigmaBendOut, 1) + "MPa）");
        if (!stOk) issues.add("压杆稳定性不足：S=" + Fmt.fmt(Sst, 2) + "＜[" + Fmt.fmt(stabilityS) + "]，需加大 d 或缩短支撑距离");

        List<Row> sec1 = Arrays.asList(
            row("计算中径 d₂=0.8√(F/(ψ[p]))", nn(d2req), "mm", null).hl(),
            row("选用标准梯形螺纹", numStr(d) + "×" + numStr(P), "mm", null).hl(),
            row("螺纹中径 d₂", nn(d2), "mm", null),
            row("螺母高度 H=ψ·d₂", nn(H), "mm", null),
            row("旋合圈数 z=H/P", nn(z), "圈", 1)
        );
        List<Row> sec2 = Arrays.asList(
            row("基本牙型高度 H₁", nn(H1), "mm", 2),
            row("工作压强 p=F/(π·d₂·H₁·z)", nn(p), "MPa", null).hl(),
            row("许用压强 [p]", nn(pAllow), "MPa", null),
            row("耐磨性", wearOk ? "满足" : "不满足", null, null).hl()
        );
        List<Row> sec3 = Arrays.asList(
            row("导程 S=线数·P", nn(Slead), "mm", 1).hl(),
            row("导程角 γ=atan(S/(π·d₂))", nn(gamma * 180 / Math.PI), "°", 2).hl(),
            row("当量摩擦角 ρᵥ", nn(rhoV * 180 / Math.PI), "°", 2).hl(),
            row("传动效率 η=tanγ/tan(γ+ρᵥ)", nn(eta), null, 3).hl()
        );
        List<Row> sec4 = Arrays.asList(
            row("导程角/当量摩擦角判据", selfLock ? "自锁满足（γ<ρᵥ）" : "不满足自锁", null, null).hl(),
            row("螺杆小径 d₃", nn(d3), "mm", 2),
            row("压应力 σ=F/A", nn(sigma), "MPa", 2),
            row("扭剪应力 τ=T/(0.2·d₃³)", nn(tauT), "MPa", 2),
            row("当量应力 σ_ca=√(σ²+3τ²)", nn(sigmaCa), "MPa", null).hl(),
            row("许用应力 [σ]", nn(sigmaAllow), "MPa", null)
        );
        List<Row> sec5 = Arrays.asList(
            row("螺杆剪应力 τ", nn(tauOut), "MPa", 2),
            row("螺杆弯曲应力 σb", nn(sigmaBendOut), "MPa", 2),
            row("螺母剪应力 τ", nn(tauIn), "MPa", 2),
            row("螺母弯曲应力 σb", nn(sigmaBendIn), "MPa", 2),
            row("牙根宽度 b", nn(b), "mm", 2),
            row("螺纹强度", threadOk ? "满足" : "不满足", null, null).hl()
        );
        List<Row> sec6 = Arrays.asList(
            row("长度系数 μ", nn(mu), "", 1),
            row("细长比 λ=μ·l/i", nn(lambda), null, 0).hl(),
            row("临界应力 σ_cr", nn(sigmaCr), "MPa", 1),
            row("临界载荷 F_cr=σ_cr·A", nn(Fcr), "N", null).hl(),
            row("稳定性安全系数 S=F_cr/F", nn(Sst), null, 2).hl(),
            row("稳定性判定", stOk ? "满足" : "不足", null, null).hl()
        );
        CalcResult r = CalcResult.empty();
        r.setSections(Arrays.asList(
            section("选型（耐磨性）", sec1),
            section("耐磨性校核", sec2),
            section("自锁与效率", sec3),
            section("螺杆强度校核", sec4),
            section("螺纹强度校核", sec5),
            section("稳定性校核", sec6)
        ));
        r.setVerdict(verdict(
            (wearOk && selfLock && screwOk && threadOk && stOk) ? "ok" : "warn",
            issues.isEmpty()
                ? "全部校核通过：耐磨 p=" + Fmt.fmt(p, 2) + "≤[p]、自锁、螺杆/螺纹强度与稳定性均满足"
                : String.join("；", issues),
            "中柔度细长比临界应力 σ_cr=a−bλ（a=304、b=1.12，45# 钢近似），大柔度用欧拉公式；稳定性安全系数一般取 2.5~4。"));
        r.setNotes(Arrays.asList(
            "耐磨性：d₂≥0.8√(F/(ψ[p]))（梯形 h=0.5P）或 0.65√(F/(ψ[p]))（锯齿 h=0.75P）。",
            "自锁条件：导程角 γ＜当量摩擦角 ρᵥ（fᵥ=f/cos(β)，梯形半角 β=15°）；单线螺纹通常满足。",
            "螺杆强度用第四强度理论 σ_ca=√(σ²+3τ²)，σ=F/A、τ=T/(0.2d₃³)。"));
        return r;
    }

    /** 整值输出为整数（10.0 → "10"），与前端 `d + '×' + P` 拼接一致 */
    private static String numStr(double x) {
        if (x == Math.floor(x) && Math.abs(x) < 1e15) return String.valueOf((long) x);
        return String.valueOf(x);
    }

    /** 与前端 JSON.stringify(NaN)=null 对齐：NaN/∞ 时行值输出 null */
    private static Object nn(double x) {
        return (Double.isNaN(x) || Double.isInfinite(x)) ? null : x;
    }
}
