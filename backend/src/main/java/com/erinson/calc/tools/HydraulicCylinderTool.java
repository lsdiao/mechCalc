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
 * 液压油缸计算（hydraulic-cylinder）。
 * <p>
 * 迁移自 `js/tools/fluid.js` 工具 1：按 GB/T 2348 缸径/杆径系列计算液压缸
 * 无杆腔推力与有杆腔拉力（计及背压与机械效率）、双方向运行速度、所需流量与液压功率。
 */
@Component
public class HydraulicCylinderTool implements CalcTool {

    @Override
    public String id() {
        return "hydraulic-cylinder";
    }

    @Override
    public CalcResult compute(Map<String, Object> v) {
        double D = CalcResult.num(v.get("D"));
        double p1 = CalcResult.num(v.get("p1"));
        double p2 = CalcResult.num(v.get("p2"));
        double Q = CalcResult.num(v.get("Q"));
        double etaM = CalcResult.num(v.get("etaM"));
        double etaV = CalcResult.num(v.get("etaV"));
        double stroke = CalcResult.num(v.get("stroke"));
        if (!(D > 0) || !(p1 > 0) || !(Q > 0)) return CalcResult.fail("请输入有效缸径、压力与流量");

        double rodMan = CalcResult.num(v.get("rodMan"));
        double rodType = CalcResult.num(v.get("rodType"));
        double d = (rodMan > 0) ? rodMan : Math.round(D * rodType);
        double A1 = Math.PI * D * D / 4;               // 无杆腔面积
        double A2 = Math.PI * (D * D - d * d) / 4;     // 有杆腔面积
        double F1 = (p1 * A1 - p2 * A2) * etaM;        // 推力 N (MPa·mm²=N)
        double F2 = (p1 * A2 - p2 * A1) * etaM;        // 拉力 N
        double v1 = Q * 1e6 / 60 / A1 * etaV;          // 伸出速度 mm/s
        double v2 = Q * 1e6 / 60 / A2 * etaV;          // 缩回速度 mm/s
        double phi = A1 / A2;                          // 速比
        double t1 = stroke / v1, t2 = stroke / v2;     // 动作时间 s
        double PkW = p1 * Q / 60 / etaM;               // 液压功率 kW
        double strokeVol = A1 * stroke / 1e6;          // 无杆腔容积 L
        double rodSideVol = A2 * stroke / 1e6;

        List<Row> sec1 = Arrays.asList(
            row("无杆腔面积 A₁=πD²/4", A1, "mm²", 1),
            row("有杆腔面积 A₂=π(D²-d²)/4", A2, "mm²", 1),
            row("活塞杆直径 d", d, "mm", null).hl(),
            row("面积比（速比φ）", phi, null, 3)
        );
        List<Row> sec2 = Arrays.asList(
            row("推力（无杆腔进油）F₁", F1, "N", null).hl(),
            row("推力 F₁", F1 / 1000, "kN", 3).hl(),
            row("拉力（有杆腔进油）F₂", F2, "N", 1),
            row("拉力 F₂", F2 / 1000, "kN", 3)
        );
        List<Row> sec3 = Arrays.asList(
            row("伸出速度 v₁", v1, "mm/s", 2).hl(),
            row("缩回速度 v₂", v2, "mm/s", 2),
            row("伸出时间（全行程）", t1, "s", 2),
            row("缩回时间（全行程）", t2, "s", 2),
            row("无杆腔行程容积", strokeVol, "L", 3),
            row("有杆腔行程容积", rodSideVol, "L", 3)
        );
        List<Row> sec4 = Arrays.asList(
            row("液压输入功率 P=p₁Q/60ηm", PkW, "kW", 3).hl(),
            row("伸出方向输出功率", F1 * v1 / 1000, "W", 1)
        );

        CalcResult r = CalcResult.empty();
        r.setSections(Arrays.asList(section("面积与几何", sec1), section("输出力", sec2),
                section("速度与流量", sec3), section("功率", sec4)));
        r.setVerdict(verdict("ok",
            "φ" + Fmt.fmt(D) + "×" + Fmt.fmt(d) + " 油缸：推力 " + Fmt.fmt(F1 / 1000) + " kN，拉力 "
                + Fmt.fmt(F2 / 1000) + " kN，伸出速度 " + Fmt.fmt(v1) + " mm/s",
            "活塞杆受压且行程较长时，需按欧拉公式校核活塞杆稳定性。"));
        r.setNotes(Arrays.asList(
            "推力 F₁ = (p₁A₁ - p₂A₂)·ηm；拉力 F₂ = (p₁A₂ - p₂A₁)·ηm。",
            "杆径系列 GB/T 2348：速比 1.33 取 d≈0.5D，速比 2 取 d≈0.7D，耐压反靠时取大杆径。",
            "长行程（L＞10D）受压活塞杆需校核纵向弯曲稳定性（欧拉载荷或雅辛斯基公式）。"));
        return r;
    }
}
