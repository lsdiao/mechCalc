package com.erinson.calc.tools;

import com.erinson.calc.common.CalcResult;
import org.springframework.stereotype.Component;

import static com.erinson.calc.common.CalcResult.row;
import static com.erinson.calc.common.CalcResult.section;
import static com.erinson.calc.common.CalcResult.verdict;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

/**
 * O形圈计算器（sealing-o-ring）。
 * <p>
 * 迁移自 `js/tools/fluid4.js` 工具 1：按沟槽尺寸计算 O 形圈压缩量、压缩率与
 * 适用密封压力，校核沟槽填充率（ISO 3601-2 / GB/T 3452.1 沟槽设计原则）。
 */
@Component
public class SealingORingTool implements CalcTool {

    /** 密封形式 -> 推荐压缩率范围 %（《机械设计手册》密封篇 / ISO 3601 沟槽设计） */
    private static final String[][] ORING_RANGE = {
        // {key, min, max, rec, desc}
        {"static", "15", "25", "15%~25%", "静密封"},
        {"recip", "8", "15", "8%~15%", "往复动密封"},
        {"rotary", "5", "10", "5%~10%", "旋转动密封"}
    };

    /** 压缩率 -> 可耐受密封压力（静密封经验表） */
    private static final double[][] ORING_PRESSURE = {
        {22, 35}, {18, 25}, {12, 16}, {8, 8}, {-999, 5}
    };

    /** 压缩率下限 -> 许用压力 MPa（ratingFloor 经验近似） */
    private static double ratingFloor(double eps) {
        if (eps >= 22) return 35;
        if (eps >= 18) return 25;
        if (eps >= 12) return 16;
        if (eps >= 8) return 8;
        return 5;
    }

    @Override
    public String id() {
        return "sealing-o-ring";
    }

    @Override
    public CalcResult compute(Map<String, Object> v) {
        double d0 = CalcResult.num(v.get("d0"));
        double h = CalcResult.num(v.get("h"));
        double b = CalcResult.num(v.get("b"));
        double p = CalcResult.num(v.get("p"));
        if (!(d0 > 0) || !(h > 0)) return CalcResult.fail("请输入有效的线径与沟槽深度");
        if (h >= d0) return CalcResult.fail("沟槽深度 h 不得大于等于线径 d₀，否则无压缩量");

        double delta = d0 - h;                  // 压缩量 mm
        double eps = delta / d0 * 100;          // 压缩率 %
        double Aring = Math.PI * d0 * d0 / 4;   // O形圈截面面积 mm²
        double Agroove = b * h;                 // 沟槽截面面积 mm²
        double fill = Aring / Agroove * 100;    // 填充率 %

        String sealType = CalcResult.str(v.get("sealType"));
        if (sealType.isEmpty()) sealType = "static";
        double min = 15, max = 25;
        String rec = "15%~25%", desc = "静密封";
        for (String[] rg : ORING_RANGE) {
            if (rg[0].equals(sealType)) {
                min = Double.parseDouble(rg[1]);
                max = Double.parseDouble(rg[2]);
                rec = rg[3];
                desc = rg[4];
                break;
            }
        }

        // 压缩率 -> 适用密封压力
        String rated = "";
        for (double[] row : ORING_PRESSURE) {
            if (eps >= row[0]) {
                double pv = row[1];
                rated = pv >= 35 ? "≤ 35 MPa（高压密封，建议加装挡圈/支承环）"
                    : pv >= 25 ? "≤ 25 MPa（中高压）"
                    : pv >= 16 ? "≤ 16 MPa（一般密封压力）"
                    : pv >= 8 ? "≤ 8 MPa（轻微密封，仅适宜低压）"
                    : "< 5 MPa（压缩不足，密封不可靠）";
                break;
            }
        }

        // 压缩率判定
        String level = (eps >= min - 1e-9 && eps <= max + 1e-9) ? "ok" : (eps < min ? "warn" : "bad");
        double marginMax = d0 - (max / 100) * d0;   // 满足上限所需的沟槽深度下限
        boolean pOk = p <= ratingFloor(eps);

        CalcResult r = CalcResult.empty();
        r.setSections(Arrays.asList(
            section("压缩量", Arrays.asList(
                row("压缩量 δ=d₀-h", delta, "mm", 2).hl(),
                row("压缩率 ε=δ/d₀", eps, "%", 2).hl(),
                row("该密封形式推荐压缩率", rec, "", null).hl()
            )),
            section("适用密封压力", Arrays.asList(
                row("由压缩率确定的适用压力", rated, "", 0).hl(),
                row("输入工作压力 p", p, "MPa", null),
                row("压力校核", pOk ? "满足" : "不足，需提高压缩率", "", 0).hl()
            )),
            section("沟槽校核", Arrays.asList(
                row("O形圈截面面积 πd₀²/4", Aring, "mm²", 2),
                row("沟槽截面面积 b·h", Agroove, "mm²", 2),
                row("填充率 Aring/(b·h)", fill, "%", 2).hl(),
                row("填充率判定", fill > 95 ? "过大，易挤出或损坏" : (fill > 85 ? "偏大，建议加大槽宽" : "合适（留有余量）"), "", 0)
            ))
        ));

        String text;
        if ("ok".equals(level)) {
            text = "压缩率 " + Fmt.fmt(eps, 2) + "% 处于" + desc + "推荐区间 " + rec + "，密封设计合理";
        } else if (eps < min) {
            text = "压缩率 " + Fmt.fmt(eps, 2) + "% 低于" + desc + "下限，密封不可靠，建议沟槽深度 ≤ " + Fmt.fmt(marginMax, 2) + " mm";
        } else {
            text = "压缩率 " + Fmt.fmt(eps, 2) + "% 超过" + desc + "上限 " + rec + "，压缩过大易使 O 形圈应力松弛/切断，应加深沟槽";
        }
        r.setVerdict(verdict(level, text,
            "高压（≥16 MPa）或存在脉冲时应加装挡圈/支承环；动密封还应保证 1~2 圈的润滑油膜。"));
        r.setNotes(Arrays.asList(
            "压缩量 δ = d₀ - h；压缩率 ε = δ/d₀ × 100%。",
            "推荐压缩率：静密封 15~25%，往复动密封 8~15%，旋转动密封 5~10%（《机械设计手册》密封篇）。",
            "槽宽 b 取槽底宽度（含圆角后的名义宽）；轴向密封时 b 为槽宽、h 为沿轴向的槽深。",
            "填充率 = O形圈截面面积 / 沟槽截面面积，一般 ≤ 85%~90%，否则易被挤出（extrusion）。",
            "适用密封压力随压缩率提高而增大，同时需兼顾 O 形圈材料硬度（~邵氏 70A）与工作温度。"));
        return r;
    }
}
