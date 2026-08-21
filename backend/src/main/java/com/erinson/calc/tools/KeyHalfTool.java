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
 * 半圆键连接强度校核（key-half）。
 * <p>
 * 迁移自 `js/tools/connection.js` 工具「半圆键连接强度校核」，逐值对齐。
 */
@Component
public class KeyHalfTool implements CalcTool {

    @Override
    public String id() {
        return "key-half";
    }

    @Override
    public CalcResult compute(Map<String, Object> v) {
        double T = ConnShared.numNaN(v.get("T")) * 1000;
        double d = ConnShared.numNaN(v.get("d"));
        if (!(T > 0)) return CalcResult.fail("请输入传递转矩 T");
        if (!(d > 0)) return CalcResult.fail("请输入轴的直径 d");

        String[] p = CalcResult.str(v.get("keySize")).split("x");
        double b = ConnShared.numNaN(p.length > 0 ? p[0] : null);
        double h = ConnShared.numNaN(p.length > 1 ? p[1] : null);
        double D = ConnShared.numNaN(p.length > 2 ? p[2] : null);
        double L = ConnShared.numNaN(p.length > 3 ? p[3] : null);
        double k = ConnShared.numNaN(p.length > 4 ? p[4] : null);
        double n = ConnShared.nKeys(v.get("keyNumber"));
        double allow;
        if (ConnShared.numNaN(v.get("allowableStress")) > 0) {
            allow = ConnShared.numNaN(v.get("allowableStress"));
        } else if ("钢".equals(CalcResult.str(v.get("material")))) {
            allow = keyAllow("钢", CalcResult.str(v.get("loadType")));
        } else {
            allow = keyAllow("铸铁", CalcResult.str(v.get("loadType")));
        }
        double sigmaP = 2 * T / (d * k * L * n);
        boolean ok = sigmaP <= allow;
        boolean pos = "定位用".equals(CalcResult.str(v.get("forUse")));
        String rec = ConnShared.halfRec(d, pos);

        List<Row> sec1 = Arrays.asList(
            ConnShared.htmlRow("键尺寸 b×h×D",
                ConnShared.numStr(b) + "×" + ConnShared.numStr(h) + "×" + ConnShared.numStr(D)),
            row("键的长度 L", L, "mm", null),
            row("接触高度 k", k, "mm", 2),
            ConnShared.htmlRow("键的个数", CalcResult.str(v.get("keyNumber"))
                + (n > 1 ? "（承载按 " + ConnShared.numStr(n) + " 倍计）" : "")),
            ConnShared.htmlRow("按轴径推荐（" + CalcResult.str(v.get("forUse")) + "）",
                rec != null ? rec : "超出推荐范围")
        );
        List<Row> sec2 = Arrays.asList(
            row("许用应力 [σ<sub>p</sub>]", allow, "MPa", null).hl(),
            row("计算应力 σ<sub>p</sub>=2T/(dkL)", sigmaP, "MPa", 3).hl()
        );
        CalcResult r = CalcResult.empty();
        r.setSections(Arrays.asList(section("输入参数", sec1), section("校核结果", sec2)));
        r.setVerdict(verdict(
            ok ? "ok" : "bad",
            ok ? "校核通过：σ<sub>p</sub> = " + ConnShared.fmt(sigmaP, 2) + " MPa ≤ [σ<sub>p</sub>] = " + ConnShared.numStr(allow) + " MPa"
               : "校核不通过：σ<sub>p</sub> = " + ConnShared.fmt(sigmaP, 2) + " MPa > [σ<sub>p</sub>] = " + ConnShared.numStr(allow) + " MPa",
            "半圆键常用于锥形轴端与定位，承载较低；不满足时可加大轴径或改用平键/花键。"));
        r.setNotes(Arrays.asList("半圆键能在轴槽中摆动自位，装配方便；k、L 直接取自规格表，与 原站 一致。"));
        return r;
    }

    /** 半圆键许用应力 [σp]：钢 135/110/75、铸铁 75/55/37（静/轻微冲击/冲击） */
    private static double keyAllow(String mat, String load) {
        if ("钢".equals(mat)) {
            return "静载荷".equals(load) ? 135 : "轻微冲击载荷".equals(load) ? 110 : 75;
        }
        return "静载荷".equals(load) ? 75 : "轻微冲击载荷".equals(load) ? 55 : 37;
    }
}
