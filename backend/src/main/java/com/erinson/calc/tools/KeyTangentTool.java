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
 * 切向键连接强度校核（key-tangent）。
 * <p>
 * 迁移自 `js/tools/connection.js` 工具「切向键连接强度校核」，逐值对齐。
 */
@Component
public class KeyTangentTool implements CalcTool {

    @Override
    public String id() {
        return "key-tangent";
    }

    @Override
    public CalcResult compute(Map<String, Object> v) {
        double T = ConnShared.numNaN(v.get("T")) * 1000;
        double d = ConnShared.numNaN(v.get("d"));
        double t = ConnShared.numNaN(v.get("keyThickness"));
        double c = ConnShared.numNaN(v.get("keyCorner"));
        double l = ConnShared.numNaN(v.get("keyEffectiveLength"));
        double miu = ConnShared.numNaN(v.get("miu"));
        if (!(T > 0)) return CalcResult.fail("请输入传递转矩 T");
        if (!(d > 0)) return CalcResult.fail("请输入轴的直径 d");
        if (!(l > 0)) return CalcResult.fail("请输入键工作长度 l");
        if (!(miu > 0)) return CalcResult.fail("请输入摩擦系数 μ");
        if (t - c <= 0) return CalcResult.fail("键厚 t 需大于倒角 c");

        double allow;
        if (ConnShared.numNaN(v.get("allowableStress")) > 0) {
            allow = ConnShared.numNaN(v.get("allowableStress"));
        } else {
            allow = ConnShared.SIGP_FLAT.getOrDefault(CalcResult.str(v.get("material")),
                ConnShared.SIGP_FLAT.get("钢")).getOrDefault(CalcResult.str(v.get("loadType")), 0);
        }
        double sigmaP = 2 * T / (d * (t - c) * l * (0.9 + miu));
        boolean ok = sigmaP <= allow;
        double[] rec = ConnShared.tanRec(d);

        List<Row> sec1 = Arrays.asList(
            row("键的厚度 t", t, "mm", null),
            row("键的倒角 c", c, "mm", 2),
            row("键的宽度 b", ConnShared.numNaN(v.get("keyWidth")), "mm", 2),
            row("键工作长度 l", l, "mm", null).hl(),
            row("摩擦系数 μ", miu, null, 2),
            ConnShared.htmlRow("按轴径推荐", rec != null
                ? "t=" + ConnShared.numStr(rec[1]) + "，c=" + ConnShared.numStr(rec[2]) + "，l=1.5d=" + ConnShared.numStr(1.5 * d)
                : "超出推荐范围")
        );
        List<Row> sec2 = Arrays.asList(
            row("许用应力 [σ<sub>p</sub>]", allow, "MPa", null).hl(),
            row("计算应力 σ<sub>p</sub>", sigmaP, "MPa", 3).hl()
        );
        CalcResult r = CalcResult.empty();
        r.setSections(Arrays.asList(section("输入参数", sec1), section("校核结果", sec2)));
        r.setVerdict(verdict(
            ok ? "ok" : "bad",
            ok ? "校核通过：σ<sub>p</sub> = " + ConnShared.fmt(sigmaP, 2) + " MPa ≤ [σ<sub>p</sub>] = " + ConnShared.numStr(allow) + " MPa"
               : "校核不通过：σ<sub>p</sub> = " + ConnShared.fmt(sigmaP, 2) + " MPa > [σ<sub>p</sub>] = " + ConnShared.numStr(allow) + " MPa",
            "双向传动时采用两对切向键（互成 120°~135°），按单对分别校核。"));
        r.setNotes(Arrays.asList("与 原站《切向键连接校核计算》1:1 一致：σp = 2T/(d·(t−c)·l·(0.9+μ))。"));
        return r;
    }
}
