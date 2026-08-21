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
import java.util.List;
import java.util.Map;

/**
 * 直线导轨选型（linear-guide）。
 * <p>
 * 迁移自 `js/tools/other1.js` 工具 2，按 THK 选型方法实现，逐值对齐 golden。
 */
@Component
public class LinearGuideTool implements CalcTool {

    @Override
    public String id() {
        return "linear-guide";
    }

    @Override
    public CalcResult compute(Map<String, Object> v) {
        double P = ConnShared.numNaN(v.get("P"));
        double S = ConnShared.numNaN(v.get("S"));
        double n1 = ConnShared.numNaN(v.get("n1"));
        double Lh = ConnShared.numNaN(v.get("Lh"));
        if (!(P > 0) || !(S > 0) || !(n1 > 0) || !(Lh > 0))
            return CalcResult.fail("请完整输入载荷、行程、往复次数与要求寿命");

        double eps = "ball".equals(CalcResult.str(v.get("body"))) ? 3 : 10.0 / 3;
        double fs = ConnShared.numNaN(v.get("fs"));
        double fw = ConnShared.numNaN(v.get("fw"));
        double Lreq = 2 * S * n1 * Lh * 60 / 1e6;            // 要求行走寿命 km
        double hrc = ConnShared.numNaN(v.get("HRC"));
        double fH = hrc >= 58 ? 1.0 : Math.max(0.35, 0.35 + (58 - Math.min(hrc, 58)) * 0.035);
        double Creq = fw * P * Math.pow(Lreq / 50, 1 / eps) / fH; // 所需额定动载荷
        double C0req = fs * P;                                // 所需额定静载荷
        double C = ConnShared.numNaN(v.get("Csel"));
        double C0 = ConnShared.numNaN(v.get("C0sel"));
        double Lreal = 50 * Math.pow(C / P, eps);             // 实际寿命 km
        double LhReal = Lreal * 1e6 / (2 * S * n1 * 60);      // 实际寿命 h
        boolean okC = C >= Creq, okC0 = C0 >= C0req, okLife = LhReal >= Lh;
        List<String> issues = new ArrayList<>();
        if (!okC) issues.add("所选动额定 C=" + Fmt.fmt(C) + "N ＜所需 " + Fmt.fmt(Creq) + "N");
        if (!okC0) issues.add("所选静额定 C₀=" + Fmt.fmt(C0) + "N ＜所需 " + Fmt.fmt(C0req) + "N");
        if (!okLife) issues.add("实际寿命 " + Fmt.fmt(LhReal) + "h＜要求 " + Fmt.fmt(Lh) + "h");
        double marginC = C / Creq, marginC0 = C0 / C0req;

        List<Row> sec1 = Arrays.asList(
            row("要求行走寿命 L", nn(Lreq), "km", null).hl(),
            row("寿命指数 ε", nn(eps), null, 2),
            row("所需额定动载荷 C_req", nn(Creq), "N", null).hl(),
            row("静安全系数 fs", nn(fs), null, 1),
            row("所需额定静载荷 C₀=fs·P", nn(C0req), "N", null).hl()
        );
        List<Row> sec2 = Arrays.asList(
            row("所选额定动载荷 C", nn(C), "N", null).hl(),
            row("动载荷裕度 C/C_req", nn(marginC), null, 2),
            row("实际寿命 L=50·(C/P)^ε", nn(Lreal), "km", null).hl(),
            row("实际寿命 Lh", nn(LhReal), "h", null).hl(),
            row("所选额定静载荷 C₀", nn(C0), "N", null),
            row("静载荷裕度 C₀/C₀req", nn(marginC0), null, 2)
        );
        CalcResult r = CalcResult.empty();
        r.setSections(Arrays.asList(section("需求计算", sec1), section("所选导轨校核", sec2)));
        r.setVerdict(verdict(
            (okC && okC0 && okLife) ? "ok" : "bad",
            issues.isEmpty()
                ? "满足要求：C≥C_req、C₀≥C₀req、寿命 Lh=" + Fmt.fmt(LhReal) + "h≥" + Fmt.fmt(Lh) + "h"
                : String.join("；", issues),
            "实际寿命 L=50·(C/P)^ε km：滚珠 ε=3、滚柱 ε=10/3；滚珠按 100km 额定、滚柱按 50km 额定折算（THK 基准 50km 计已统一）。"));
        r.setNotes(Arrays.asList(
            "THK 额定寿命：L=(C/(fw·P))^ε ×50 km，滚珠 ε=3、滚柱 ε=10/3。",
            "实际寿命 Lh=L·10⁶/(2·S·n₁·60) h；单程 S 每往复行走 2S。",
            "静安全系数 fs：平稳 1.0~1.3、普通 1.5~2.0、冲击 2.0~3.0。"));
        return r;
    }

    /** 与前端 JSON.stringify(NaN)=null 对齐：NaN/∞ 时行值输出 null */
    private static Object nn(double x) {
        return (Double.isNaN(x) || Double.isInfinite(x)) ? null : x;
    }
}
