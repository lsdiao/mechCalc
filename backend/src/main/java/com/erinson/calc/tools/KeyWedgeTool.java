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
 * 楔键连接强度校核（key-wedge）。
 * <p>
 * 迁移自 `js/tools/connection.js` 工具「普通楔键连接强度校核」，逐值对齐。
 */
@Component
public class KeyWedgeTool implements CalcTool {

    @Override
    public String id() {
        return "key-wedge";
    }

    @Override
    public CalcResult compute(Map<String, Object> v) {
        double T = ConnShared.numNaN(v.get("T")) * 1000;
        double d = ConnShared.numNaN(v.get("d"));
        double miu = ConnShared.numNaN(v.get("miu"));
        if (!(T > 0)) return CalcResult.fail("请输入传递转矩 T");
        if (!(d > 0)) return CalcResult.fail("请输入轴的直径 d");
        if (!(miu > 0)) return CalcResult.fail("请输入摩擦系数 μ");

        String[] p = CalcResult.str(v.get("keySize")).split("x");
        double b = ConnShared.numNaN(p.length > 0 ? p[0] : null);
        double L = ConnShared.numNaN(v.get("keyLength"));
        double l = ConnShared.effLen(CalcResult.str(v.get("keyType")), L, b);
        if (!(l > 0)) return CalcResult.fail("有效长度 l≤0：请检查键长 L 与键宽 b");
        double n = ConnShared.nKeys(v.get("keyNumber"));
        double allow;
        if (ConnShared.numNaN(v.get("allowableStress")) > 0) {
            allow = ConnShared.numNaN(v.get("allowableStress"));
        } else {
            allow = ConnShared.SIGP_FLAT.getOrDefault(CalcResult.str(v.get("material")),
                ConnShared.SIGP_FLAT.get("钢")).getOrDefault(CalcResult.str(v.get("loadType")), 0);
        }
        double sigmaP = 12 * T / (b * l * (b + 6 * miu * d) * n);
        boolean ok = sigmaP <= allow;
        double[] rec = ConnShared.flatRec(d);

        List<Row> sec1 = Arrays.asList(
            ConnShared.htmlRow("键的类型 sType", CalcResult.str(v.get("keyType"))),
            ConnShared.htmlRow("键的截面尺寸 b×h",
                CalcResult.str(v.get("keySize")).replace("x", "×")),
            row("键的长度 L", L, "mm", null),
            row("键的有效长度 l", l, "mm", 2).hl(),
            row("摩擦系数 μ", miu, null, 2),
            ConnShared.htmlRow("键的个数", CalcResult.str(v.get("keyNumber"))
                + (n > 1 ? "（承载按 " + ConnShared.numStr(n) + " 倍计）" : "")),
            ConnShared.htmlRow("按轴径推荐", "b×h=" + ConnShared.numStr(rec[1]) + "x" + ConnShared.numStr(rec[2])
                + "，L=" + ConnShared.numStr(rec[3]))
        );
        List<Row> sec2 = Arrays.asList(
            row("许用应力 [σ<sub>p</sub>]", allow, "MPa", null).hl(),
            row("计算应力 σ<sub>p</sub>=12T/(bl(b+6μd))", sigmaP, "MPa", 3).hl()
        );
        CalcResult r = CalcResult.empty();
        r.setSections(Arrays.asList(section("输入参数", sec1), section("校核结果", sec2)));
        r.setVerdict(verdict(
            ok ? "ok" : "bad",
            ok ? "校核通过：σ<sub>p</sub> = " + ConnShared.fmt(sigmaP, 2) + " MPa ≤ [σ<sub>p</sub>] = " + ConnShared.numStr(allow) + " MPa"
               : "校核不通过：σ<sub>p</sub> = " + ConnShared.fmt(sigmaP, 2) + " MPa > [σ<sub>p</sub>] = " + ConnShared.numStr(allow) + " MPa",
            "楔键楔紧后轴与毂产生偏心，不宜用于高速、精密传动。"));
        r.setNotes(Arrays.asList("与 原站《普通楔键连接校核计算》1:1 一致：σp = 12T/(b·l·(b+6μd))。"));
        return r;
    }
}
