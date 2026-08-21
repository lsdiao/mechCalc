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
 * 渐开线花键连接强度校核（key-spline-inv，静/动连接）。
 * <p>
 * 迁移自 `js/tools/connection.js` 工具「渐开线花键连接强度校核」，逐值对齐。
 */
@Component
public class KeySplineInvTool implements CalcTool {

    @Override
    public String id() {
        return "key-spline-inv";
    }

    @Override
    public CalcResult compute(Map<String, Object> v) {
        double T = ConnShared.numNaN(v.get("T")) * 1000;
        if (!(T > 0)) return CalcResult.fail("请输入传递转矩 T");

        double m = ConnShared.numNaN(v.get("modulus"));
        double z = ConnShared.numNaN(v.get("teethNo"));
        double L = ConnShared.numNaN(v.get("keyLength"));
        double h = ConnShared.numNaN(v.get("keyHeight"));
        double phi = ConnShared.numNaN(v.get("phi"));
        double d = ConnShared.numNaN(v.get("diameter")) > 0 ? ConnShared.numNaN(v.get("diameter")) : m * z;
        if (!(z > 0) || !(L > 0) || !(h > 0) || !(phi > 0)) {
            return CalcResult.fail("请完整输入齿数、键长、工作高度与 φ");
        }

        boolean dynLoaded = "dynamic".equals(CalcResult.str(v.get("connType")))
            && "载荷作用下移动".equals(CalcResult.str(v.get("workingWay")));
        boolean heat = "yes".equals(CalcResult.str(v.get("heatTreatment")));
        String rangeStr = dynLoaded
            ? ConnShared.RECT_P_DYN_LOADED.getOrDefault(CalcResult.str(v.get("workingCondition")), "5~15")
            : (heat ? ConnShared.RECT_P_STATIC_HEAT : ConnShared.RECT_P_STATIC_NOHEAT)
                .getOrDefault(CalcResult.str(v.get("workingCondition")), "100~140");
        String[] rng = rangeStr.split("~");
        double r0 = ConnShared.numNaN(rng.length > 0 ? rng[0] : null);
        double r1 = ConnShared.numNaN(rng.length > 1 ? rng[1] : null);
        double allow = ConnShared.numNaN(v.get("allowableStress")) > 0
            ? ConnShared.numNaN(v.get("allowableStress")) : (r0 + r1) / 2;
        double sig = 2 * T / (phi * z * h * d * L);
        boolean ok = sig <= allow;
        double dEE = "30".equals(CalcResult.str(v.get("angle"))) ? m * (z + 1) : m * (z + 0.8);
        double maxT = allow * phi * z * h * d * L / 2000;

        List<Row> sec1 = Arrays.asList(
            row("模数 m", m, "mm", 2),
            row("花键压力角 α", ConnShared.numNaN(v.get("angle")), "°", null),
            row("齿数 z", z, null, null),
            row("分度圆直径 d=m·z", d, "mm", 2).hl(),
            row("花键轴大径 D<sub>ee</sub>", dEE, "mm", 2),
            row("键齿工作高度 h", h, "mm", 2),
            row("键的长度 L", L, "mm", null),
            row("载荷不均系数 φ", phi, null, 2)
        );
        List<Row> sec2 = Arrays.asList(
            ConnShared.htmlRow("许用应力范围", rangeStr + " MPa"),
            row("许用应力 [p]", allow, "MPa", null).hl(),
            row("计算应力 p=2T/(φzhdL)", sig, "MPa", 3).hl(),
            row("连接允许最大转矩", maxT, "N·m", 1)
        );
        CalcResult r = CalcResult.empty();
        r.setSections(Arrays.asList(section("花键参数", sec1), section("校核结果", sec2)));
        r.setVerdict(verdict(
            ok ? "ok" : "bad",
            ok ? "校核通过：p = " + ConnShared.fmt(sig, 2) + " MPa ≤ [p] = " + ConnShared.numStr(allow) + " MPa"
               : "校核不通过：p = " + ConnShared.fmt(sig, 2) + " MPa > [p] = " + ConnShared.numStr(allow) + " MPa",
            "不满足时可：① 增加键长 ② 增大模数/齿数 ③ 齿面淬火 ④ 改善制造与使用情况"));
        r.setNotes(Arrays.asList(
            "30° 压力角渐开线花键 h=m；45°（代替矩形花键/轻载）h=0.8m。",
            "与 原站《渐开线花键连接校核计算》1:1 一致。"));
        return r;
    }
}
