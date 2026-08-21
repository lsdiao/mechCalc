package com.erinson.calc.tools;

import com.erinson.calc.common.CalcResult;
import com.erinson.calc.common.CalcResult.Row;
import com.erinson.calc.common.CalcResult.Section;
import org.springframework.stereotype.Component;

import static com.erinson.calc.common.CalcResult.row;
import static com.erinson.calc.common.CalcResult.section;
import static com.erinson.calc.common.CalcResult.verdict;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 直线轴承选型计算（linear-bearing）。
 * <p>
 * 迁移自 `js/tools/linear.js` 工具 1「直线轴承选型计算（参照 THK 选型方法）」，逐值对齐 golden。
 */
@Component
public class LinearBearingTool implements CalcTool {

    // 硬度系数表（光轴硬度 HRC → fH），分段线性插值，数据源 THK 图表近似
    private static final double[][] FH_TABLE = {
        {40, 0.35}, {45, 0.47}, {50, 0.63}, {55, 0.87}, {58, 1.0}, {64, 1.0}
    };
    // 接触系数：单根轴上轴承数 → fc
    private static final Map<String, Double> FC_TABLE = new LinkedHashMap<>();
    static {
        FC_TABLE.put("1", 1.0); FC_TABLE.put("2", 0.81); FC_TABLE.put("3", 0.72);
        FC_TABLE.put("4", 0.66); FC_TABLE.put("5", 0.62); FC_TABLE.put("6", 0.6);
    }

    @Override
    public String id() {
        return "linear-bearing";
    }

    @Override
    public CalcResult compute(Map<String, Object> v) {
        double Pc = ConnShared.numNaN(v.get("Pc"));
        double P = ConnShared.numNaN(v.get("P"));
        double S = ConnShared.numNaN(v.get("S"));
        double n1 = ConnShared.numNaN(v.get("n1"));
        double Lh = ConnShared.numNaN(v.get("Lh"));
        if (!(Pc > 0) || !(P > 0) || !(S > 0) || !(n1 > 0) || !(Lh > 0))
            return CalcResult.fail("请完整输入载荷、行程、往复次数与设计寿命");

        double eps = "ball".equals(CalcResult.str(v.get("body"))) ? 3 : 10.0 / 3;
        double fs = ConnShared.numNaN(v.get("fs"));
        double C0 = fs * P;                                 // 实际静载荷需求
        double L = 2 * S * n1 * Lh * 60 / 1e6;              // 行走距离寿命 km
        double vCalc = 2 * S * n1 / 1000;                   // 理论平均速度 m/min
        double fH = hardnessFactor(ConnShared.numNaN(v.get("HRC")));
        double fT = tempFactor(ConnShared.numNaN(v.get("T")));
        double fc = FC_TABLE.getOrDefault(CalcResult.str(v.get("nBearing")), 0.6);
        double fw = ConnShared.numNaN(v.get("fw"));
        double C = fw * Pc * Math.pow(L / 50, 1 / eps) / (fH * fT * fc);
        boolean hardWarn = ConnShared.numNaN(v.get("HRC")) < 58;

        List<Row> sec1 = Arrays.asList(
            row("静安全系数 fs", nn(fs), null, 1),
            row("实际静载荷 C₀=fs·P", nn(C0), "N", null).hl()
        );
        List<Row> sec2 = Arrays.asList(
            row("行走距离寿命 L", nn(L), "km", null).hl(),
            row("理论平均速度 v=2S·n₁", nn(vCalc), "m/min", null),
            row("硬度系数 fH", nn(fH), "", 3),
            row("温度系数 fT", nn(fT), "", 3),
            row("接触系数 fc", nn(fc), "", 2),
            row("负载条件系数 fw", nn(fw), "", 2)
        );
        List<Row> sec3 = Arrays.asList(
            row("寿命指数 ε", nn(eps), "", 2),
            row("实际动载荷 C", nn(C), "N", null).hl(),
            ConnShared.htmlRow("所选样本需满足",
                "C<sub>额定</sub> ≥ " + Fmt.fmt(C) + " N 且 C<sub>0额定</sub> ≥ " + Fmt.fmt(C0) + " N").hl()
        );
        CalcResult r = CalcResult.empty();
        r.setSections(Arrays.asList(
            section("静载荷计算", sec1),
            section("寿命与系数", sec2),
            section("动载荷计算（选型依据）", sec3)
        ));
        r.setVerdict(verdict(
            hardWarn ? "warn" : "ok",
            hardWarn ? "光轴硬度低于 HRC58，额定载荷将显著下降，建议光轴硬度 HRC58~60"
                     : "计算完成，请对照样本选择额定动载荷≥C 且额定静载荷≥C₀ 的型号",
            null));
        r.setNotes(Arrays.asList(
            "行走寿命 L = 2·S·n₁·Lh·60/10⁶（km），单程行程 S 每往复一次行走 2S。",
            "寿命公式：L = (C·fH·fT·fc/(fw·Pc))^ε × 50 km；滚珠 ε=3，滚柱 ε=10/3。",
            "为使承载能力最佳，导轨（光轴）硬度应达 HRC58~60；环境温度高于 100℃ 需计入 fT。",
            "选型时还需校核：允许转速、光轴挠度（跨距与载荷下）、安装空间尺寸。"));
        return r;
    }

    private static double hardnessFactor(double hrc) {
        if (hrc >= 58) return 1.0;
        if (hrc <= 40) return 0.35;
        for (int i = 0; i < FH_TABLE.length - 1; i++) {
            double a0 = FH_TABLE[i][0], a1 = FH_TABLE[i][1];
            double b0 = FH_TABLE[i + 1][0], b1 = FH_TABLE[i + 1][1];
            if (hrc >= a0 && hrc <= b0) return a1 + (b1 - a1) * (hrc - a0) / (b0 - a0);
        }
        return 0.35;
    }

    private static double tempFactor(double T) {
        if (T <= 100) return 1.0;
        if (T >= 200) return 0.75;
        return 1.0 - (T - 100) * (1.0 - 0.75) / 100;
    }

    /** 与前端 JSON.stringify(NaN)=null 对齐：NaN/∞ 时行值输出 null */
    private static Object nn(double x) {
        return (Double.isNaN(x) || Double.isInfinite(x)) ? null : x;
    }
}
