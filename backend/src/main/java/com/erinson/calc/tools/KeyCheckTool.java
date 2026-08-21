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
 * 平键连接强度校核（key-check）。
 * <p>
 * 迁移自 `js/tools/connection.js` 工具 6「平键连接强度校核（静/动连接）」，逐值对齐。
 */
@Component
public class KeyCheckTool implements CalcTool {

    @Override
    public String id() {
        return "key-check";
    }

    @Override
    public CalcResult compute(Map<String, Object> v) {
        double T = ConnShared.numNaN(v.get("T")) * 1000;
        double d = ConnShared.numNaN(v.get("d"));
        if (!(T > 0)) return CalcResult.fail("请输入传递转矩 T");
        if (!(d > 0)) return CalcResult.fail("请输入轴的直径 d");

        String[] parts = CalcResult.str(v.get("keySize")).split("x");
        double b = ConnShared.numNaN(parts.length > 0 ? parts[0] : null);
        double h = ConnShared.numNaN(parts.length > 1 ? parts[1] : null);
        double L = ConnShared.numNaN(v.get("keyLength"));
        double l = ConnShared.effLen(CalcResult.str(v.get("keyType")), L, b);
        if (!(l > 0)) return CalcResult.fail("有效长度 l≤0：请检查键长 L 与键宽 b（A 型 l=L−b）");
        double k = 0.4 * h;
        double n = ConnShared.nKeys(v.get("keyNumber"));
        double allow;
        if (ConnShared.numNaN(v.get("allowableStress")) > 0) {
            allow = ConnShared.numNaN(v.get("allowableStress"));
        } else {
            allow = "dynamic".equals(CalcResult.str(v.get("connType")))
                ? ConnShared.P_DYN.getOrDefault(CalcResult.str(v.get("loadType")), 0)
                : ConnShared.SIGP_FLAT.getOrDefault(CalcResult.str(v.get("material")),
                    ConnShared.SIGP_FLAT.get("钢")).getOrDefault(CalcResult.str(v.get("loadType")), 0);
        }
        double sigmaP = 2 * T / (d * k * l * n);
        boolean ok = sigmaP <= allow;
        double[] rec = ConnShared.flatRec(d);

        List<Row> sec1 = Arrays.asList(
            ConnShared.htmlRow("键的类型 sType", CalcResult.str(v.get("keyType"))),
            ConnShared.htmlRow("键的截面尺寸 b×h", ConnShared.numStr(b) + "×" + ConnShared.numStr(h)),
            row("键的长度 L", L, "mm", null),
            row("键的有效长度 l", l, "mm", 2).hl(),
            row("接触高度 k=0.4h", k, "mm", 2),
            ConnShared.htmlRow("键的个数", CalcResult.str(v.get("keyNumber"))
                + (n > 1 ? "（承载按 " + ConnShared.numStr(n) + " 倍计）" : "")),
            ConnShared.htmlRow("按轴径推荐", "b×h=" + ConnShared.numStr(rec[1]) + "x" + ConnShared.numStr(rec[2])
                + "，L=" + ConnShared.numStr(rec[3]) + "（当前 d=" + ConnShared.numStr(d) + "）")
        );
        List<Row> sec2 = Arrays.asList(
            row("许用应力 [σ<sub>p</sub>]", allow, "MPa", null).hl(),
            row("计算应力 σ<sub>p</sub>=2T/(dkl)", sigmaP, "MPa", 3).hl(),
            row("连接允许最大转矩", allow * d * k * l * n / 2000, "N·m", 1)
        );
        CalcResult r = CalcResult.empty();
        r.setSections(Arrays.asList(section("输入参数", sec1), section("校核结果", sec2)));
        r.setVerdict(verdict(
            ok ? "ok" : "bad",
            ok ? "校核通过：σ<sub>p</sub> = " + ConnShared.fmt(sigmaP, 2) + " MPa ≤ [σ<sub>p</sub>] = " + ConnShared.numStr(allow) + " MPa"
               : "校核不通过：σ<sub>p</sub> = " + ConnShared.fmt(sigmaP, 2) + " MPa > [σ<sub>p</sub>] = " + ConnShared.numStr(allow) + " MPa",
            "若不满足，可：① 增加键长 ② 改用双键（相隔180°，按1.5倍承载）③ 改用花键 ④ 提高轮毂材料"));
        r.setNotes(Arrays.asList(
            "静连接按挤压应力校核，动连接（导向平键/滑键）按工作面压强 p 校核，公式相同、许用值不同。",
            "A 型（圆头）l=L−b，B 型（方头）l=L，C 型（单圆头）l=L−b/2；接触高度 k≈0.4h。",
            "与 原站《平键连接校核计算》1:1 一致。"));
        return r;
    }
}
