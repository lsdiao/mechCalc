package com.erinson.calc.tools;

import com.erinson.calc.common.CalcResult;
import com.erinson.calc.common.CalcResult.Row;
import org.springframework.stereotype.Component;

import static com.erinson.calc.common.CalcResult.row;
import static com.erinson.calc.common.CalcResult.section;
import static com.erinson.calc.common.CalcResult.verdict;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

/**
 * 气缸最小缸径计算（pneumatic-cylinder）。
 * <p>
 * 迁移自 `js/tools/fluid.js` 工具 2：按负载力、气压与负载率计算气缸最小缸径
 * 并圆整到标准缸径，附耗气量估算。
 */
@Component
public class PneumaticCylinderTool implements CalcTool {

    /* 气缸标准缸径系列 */
    private static final double[] PNEU_BORE = {32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 320};

    @Override
    public String id() {
        return "pneumatic-cylinder";
    }

    @Override
    public CalcResult compute(Map<String, Object> v) {
        double F = CalcResult.num(v.get("F"));
        double p = CalcResult.num(v.get("p"));
        double eta = CalcResult.num(v.get("load"));
        double rodRatio = CalcResult.num(v.get("rodRatio"));
        if (!(F > 0)) return CalcResult.fail("请输入负载力 F");
        if (!(p > 0.05)) return CalcResult.fail("工作气压过低（最低约 0.1 MPa）");

        double F0 = F / eta;                             // 所需理论输出力
        double dCalc;
        if ("push".equals(CalcResult.str(v.get("dir")))) {
            dCalc = Math.sqrt(4 * F0 / (Math.PI * p * 1e6)) * 1000; // mm
        } else {
            dCalc = Math.sqrt(4 * F0 / (Math.PI * p * 1e6 * (1 - rodRatio * rodRatio))) * 1000;
        }
        double bore = 0;
        for (double b : PNEU_BORE) {
            if (b >= dCalc) { bore = b; break; }
        }
        if (bore == 0) bore = Math.ceil(dCalc / 50) * 50;
        double rod = Math.round(bore * rodRatio);
        double A1 = Math.PI * bore * bore / 4;
        double A2 = Math.PI * (bore * bore - rod * rod) / 4;
        double Ause = "push".equals(CalcResult.str(v.get("dir"))) ? A1 : A2;
        double Fout = p * Ause * eta;                    // 实际输出力
        double margin = Fout / F;
        double stroke = CalcResult.num(v.get("stroke"));
        double n = CalcResult.num(v.get("n"));
        double qFree = (A1 + A2) * stroke / 1e6 * n * (p + 0.1013) / 0.1013; // L/min

        List<Row> sec1 = Arrays.asList(
            row("所需理论输出力 F₀=F/η", F0, "N", null).hl(),
            row("计算最小缸径", dCalc, "mm", 2).hl(),
            row("圆整标准缸径", bore, "mm", null).hl(),
            row("活塞杆直径 d", rod, "mm", null)
        );
        List<Row> sec2 = Arrays.asList(
            row("push".equals(CalcResult.str(v.get("dir"))) ? "作用面积 A₁" : "作用面积 A₂", Ause, "mm²", 1),
            row("实际输出力", Fout, "N", null).hl(),
            row("力裕度 Fout/F", margin, null, 2).hl(),
            row("无杆腔面积 A₁", A1, "mm²", 1),
            row("有杆腔面积 A₂", A2, "mm²", 1)
        );
        List<Row> sec3 = Arrays.asList(
            row("每往复一次耗气", (A1 + A2) * stroke / 1e6 * (p + 0.1013) / 0.1013, "L", 3),
            row("每分钟耗气量", qFree, "L/min", 2),
            row("折合 m³/h", qFree * 60 / 1000, "m³/h", 3)
        );

        CalcResult r = CalcResult.empty();
        r.setSections(Arrays.asList(section("理论力需求", sec1), section("实际输出校验", sec2),
                section("耗气量估算（标准状态）", sec3)));
        boolean ok = margin >= 1.15;
        r.setVerdict(verdict(ok ? "ok" : "warn",
            ok ? "选缸径 φ" + Math.round(bore) + " mm：输出力 " + Fmt.fmt(Fout) + " N，裕度 "
                    + Fmt.fmt(margin, 2) + "，满足要求"
               : "选缸径 φ" + Math.round(bore) + " mm 裕度仅 " + Fmt.fmt(margin, 2) + "，建议加大一档缸径或提高气压",
            "一般建议裕度 ≥ 1.15~1.3，供气压力波动与摩擦损耗会吃掉部分理论力。"));
        r.setNotes(Arrays.asList(
            "气缸负载率（效率）η：静载夹紧 0.65~0.75、一般运动 0.4~0.5、高速冲击 0.3~0.4。",
            "耗气量按理想气体折算到标准大气压状态，供气系统按最大耗气量×同期系数配置气源。",
            "气缸速度需由节流阀控制；要求精确低速平稳时建议选带液压缓冲器或低速气缸。"));
        return r;
    }
}
