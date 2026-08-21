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
 * 矩形花键连接强度校核（key-spline-rect，静/动连接）。
 * <p>
 * 迁移自 `js/tools/connection.js` 工具「矩形花键连接强度校核」，逐值对齐。
 */
@Component
public class KeySplineRectTool implements CalcTool {

    @Override
    public String id() {
        return "key-spline-rect";
    }

    @Override
    public CalcResult compute(Map<String, Object> v) {
        double T = ConnShared.numNaN(v.get("T")) * 1000;
        if (!(T > 0)) return CalcResult.fail("请输入传递转矩 T");

        String[] p = CalcResult.str(v.get("keySize")).split("×");
        double N = ConnShared.numNaN(p.length > 0 ? p[0] : null);
        double dd = ConnShared.numNaN(p.length > 1 ? p[1] : null);
        double D = ConnShared.numNaN(p.length > 2 ? p[2] : null);
        double L = ConnShared.numNaN(v.get("keyLength"));
        double c = ConnShared.numNaN(v.get("keyCorner"));
        double phi = ConnShared.numNaN(v.get("phi"));
        if (!(phi > 0)) return CalcResult.fail("请输入载荷不均系数 φ");

        double dm = (D + dd) / 2;
        double h = (D - dd) / 2 - 2 * c;
        if (!(h > 0)) return CalcResult.fail("键齿工作高度 h≤0：请减小倒角 c");

        boolean heat = "yes".equals(CalcResult.str(v.get("heatTreatment")));
        String rangeStr;
        if ("static".equals(CalcResult.str(v.get("connType")))) {
            rangeStr = (heat
                ? ConnShared.RECT_P_STATIC_HEAT : ConnShared.RECT_P_STATIC_NOHEAT)
                .getOrDefault(CalcResult.str(v.get("workingCondition")), "100~140");
        } else if ("载荷作用下移动".equals(CalcResult.str(v.get("workingWay")))) {
            rangeStr = ConnShared.RECT_P_DYN_LOADED.getOrDefault(CalcResult.str(v.get("workingCondition")), "5~15");
        } else {
            rangeStr = (heat
                ? ConnShared.RECT_P_DYN_UNLOAD_HEAT : ConnShared.RECT_P_DYN_UNLOAD_NOHEAT)
                .getOrDefault(CalcResult.str(v.get("workingCondition")), "30~60");
        }
        String[] rng = rangeStr.split("~");
        double r0 = ConnShared.numNaN(rng.length > 0 ? rng[0] : null);
        double r1 = ConnShared.numNaN(rng.length > 1 ? rng[1] : null);
        double allow = ConnShared.numNaN(v.get("allowableStress")) > 0
            ? ConnShared.numNaN(v.get("allowableStress")) : (r0 + r1) / 2;
        double sig = 2 * T / (phi * N * h * dm * L);
        boolean ok = sig <= allow;
        double maxT = allow * phi * N * h * dm * L / 2000;

        List<Row> sec1 = Arrays.asList(
            ConnShared.htmlRow("花键规格 N×d×D×B", CalcResult.str(v.get("keySize"))),
            ConnShared.htmlRow("键系列", CalcResult.str(v.get("keySeries"))),
            row("键的长度 L", L, "mm", null),
            row("键的倒角 c", c, "mm", 2),
            row("平均直径 d<sub>m</sub>=(D+d)/2", dm, "mm", 2),
            row("键齿工作高度 h", h, "mm", 2).hl(),
            row("载荷不均系数 φ", phi, null, 2)
        );
        List<Row> sec2 = Arrays.asList(
            ConnShared.htmlRow("许用应力范围", rangeStr + " MPa（" + (heat ? "齿面经热处理" : "齿面未经热处理") + "）"),
            row("许用应力 [p]", allow, "MPa", null).hl(),
            row("计算应力 p=2T/(φNhd<sub>m</sub>L)", sig, "MPa", 3).hl(),
            row("连接允许最大转矩", maxT, "N·m", 1)
        );
        CalcResult r = CalcResult.empty();
        r.setSections(Arrays.asList(section("花键参数", sec1), section("校核结果", sec2)));
        r.setVerdict(verdict(
            ok ? "ok" : "bad",
            ok ? "校核通过：p = " + ConnShared.fmt(sig, 2) + " MPa ≤ [p] = " + ConnShared.numStr(allow) + " MPa"
               : "校核不通过：p = " + ConnShared.fmt(sig, 2) + " MPa > [p] = " + ConnShared.numStr(allow) + " MPa",
            "不满足时可：① 增加键长 L ② 选用更大规格系列 ③ 齿面淬火提高 [p] ④ 改善制造/使用情况"));
        r.setNotes(Arrays.asList(
            "静连接按挤压（p≤[p]）校核；动连接（移动的花键）按工作面磨损（压强）校核。",
            "[p] 范围：静/热处理 40~70、100~140、120~200；静/未处理 35~50、60~100、80~120；动·载荷下移动 3~10、5~15、10~20；动·空载移动/热处理 20~35、30~60、40~70；动·空载/未处理 15~20、20~30、25~40 MPa（不良/中等/良好）。",
            "与 原站《矩形花键连接校核计算》1:1 一致。"));
        return r;
    }
}
