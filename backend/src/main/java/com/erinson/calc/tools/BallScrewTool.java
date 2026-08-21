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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 滚珠丝杆副计算（ball-screw）。
 * <p>
 * 迁移自 `js/tools/linear.js` 工具 2「滚珠丝杆副设计计算」，逐值对齐 golden。
 */
@Component
public class BallScrewTool implements CalcTool {

    private static final Map<String, Double> LAM2 = new LinkedHashMap<>();
    private static final Map<String, Double> ETA1 = new LinkedHashMap<>();
    static {
        LAM2.put("ff", 21.9); LAM2.put("fs", 15.1); LAM2.put("ss", 9.7); LAM2.put("fk", 3.4);
        ETA1.put("ff", 4.0); ETA1.put("fs", 2.0); ETA1.put("ss", 1.0); ETA1.put("fk", 0.25);
    }

    @Override
    public String id() {
        return "ball-screw";
    }

    @Override
    public CalcResult compute(Map<String, Object> v) {
        double F = ConnShared.numNaN(v.get("F"));
        double n = ConnShared.numNaN(v.get("n"));
        double Lh = ConnShared.numNaN(v.get("Lh"));
        double Ph = ConnShared.numNaN(v.get("Ph"));
        double Dm = ConnShared.numNaN(v.get("Dm"));
        double eta = ConnShared.numNaN(v.get("eta"));
        if (!(F > 0) || !(n > 0) || !(Lh > 0) || !(Ph > 0))
            return CalcResult.fail("请完整输入载荷、转速、寿命与导程");

        double fw = ConnShared.numNaN(v.get("fw"));
        double fH = ConnShared.numNaN(v.get("fH"));
        double revs = 60 * n * Lh;                                // 总转数
        double Ca = fw * F * Math.pow(revs / 1e6, 1.0 / 3) / fH;  // 额定动载荷需求
        double T = F * Ph / (2 * Math.PI * eta);                  // 驱动转矩 N·mm
        double PkW = T * n / 9550000;                             // kW
        double vel = Ph * n / 60;                                 // 线速度 mm/s
        double DmN = Dm * n;                                      // DmN 值
        double DmNAllow = 70000;                                  // 常规允许值（精密研磨级）

        String sup = CalcResult.str(v.get("support"));
        double lam2 = LAM2.getOrDefault(sup, 0.0);
        double eta1 = ETA1.getOrDefault(sup, 0.0);
        double dk = ConnShared.numNaN(v.get("dk"));
        double Lb = ConnShared.numNaN(v.get("Lb"));
        double La = ConnShared.numNaN(v.get("La"));
        double nc = lam2 * dk / (Lb * Lb) * 1e7;                  // 临界转速 r/min
        double ncAllow = 0.8 * nc;                                // 安全转速
        double Ix = Math.PI * Math.pow(dk, 4) / 64;               // 底径截面惯性矩 mm⁴
        double Pk = 0.5 * eta1 * Math.PI * Math.PI * 2.06e5 * Ix / (La * La); // 压杆临界载荷 N
        double PkAllow = Pk / 3;                                  // 安全压缩载荷（安全系数 3）

        List<String> warns = new ArrayList<>();
        if (DmN > DmNAllow) warns.add("DmN=" + Fmt.fmt(DmN) + " 超过常规允许值 " + Fmt.fmt(DmNAllow));
        if (n > ncAllow) warns.add("工作转速 " + Fmt.fmt(n) + " 超过安全临界转速 " + Fmt.fmt(ncAllow) + " r/min（0.8nc）");
        if (F > PkAllow) warns.add("轴向载荷 " + Fmt.fmt(F) + " N 超过安全压缩载荷 " + Fmt.fmt(PkAllow) + " N（Pk/3），需加大底径/缩短受压长度/改善支承");

        List<Row> sec1 = Arrays.asList(
            row("寿命期内总转数", nn(revs), "转", 0),
            row("L10 寿命（10⁶转计）", nn(revs / 1e6), "×10⁶ 转", 2),
            row("所需额定动载荷 Ca", nn(Ca), "N", null).hl(),
            row("载荷系数 fw", nn(fw), "", 1)
        );
        List<Row> sec2 = Arrays.asList(
            row("线速度 v=Ph·n/60", nn(vel), "mm/s", 1),
            row("驱动转矩 T=F·Ph/(2πη)", nn(T), "N·mm", 1).hl(),
            row("驱动转矩 T", nn(T / 1000), "N·m", 3),
            row("所需驱动功率 P", nn(PkW), "kW", 3).hl()
        );
        List<Row> sec3 = Arrays.asList(
            row("支承系数 λ₂", nn(lam2), "", 1),
            row("临界转速 nc=λ₂·dk/Lb²×10⁷", nn(nc), "r/min", 0).hl(),
            row("安全转速 0.8nc", nn(ncAllow), "r/min", 0).hl(),
            row("DmN 值", nn(DmN), "mm·r/min", 0),
            row("DmN 允许值（常规）", nn(DmNAllow), "mm·r/min", 0)
        );
        List<Row> sec4 = Arrays.asList(
            row("支承系数 η₁", nn(eta1), "", 2),
            row("底径截面惯性矩 I", nn(Ix), "mm⁴", 0),
            row("压杆临界载荷 Pk=0.5η₁π²EI/La²", nn(Pk), "N", 0).hl(),
            row("安全压缩载荷 Pk/3", nn(PkAllow), "N", 0).hl()
        );
        CalcResult r = CalcResult.empty();
        r.setSections(Arrays.asList(
            section("寿命与动载荷", sec1),
            section("运动与驱动参数", sec2),
            section("临界转速校核", sec3),
            section("压杆稳定性校核", sec4)
        ));
        r.setVerdict(verdict(
            warns.isEmpty() ? "ok" : "warn",
            warns.isEmpty()
                ? "选型依据：样本 Ca ≥ " + Fmt.fmt(Ca) + " N；nc=" + Fmt.fmt(nc) + " r/min、Pk=" + Fmt.fmt(Pk)
                    + " N，转速与受压载荷均在安全范围内"
                : String.join("；", warns) + "，请调整参数或支承方式",
            "高速工况还需按厂商样本复核 dn 值与温升；受压工况优先选用固定-固定或固定-支承方式。"));
        r.setNotes(Arrays.asList(
            "额定寿命：L10 = (Ca·fH/(fw·Fm))³ × 10⁶ 转，反推 Ca = fw·Fm·(L10/10⁶)^(1/3)/fH。",
            "驱动转矩未计入预紧力矩与摩擦副（导轨、轴承）附加摩擦，电机选型建议再加 20%~30% 裕度。",
            "DmN 允许值：冷轧级约 50000，精密研磨级可达 70000~150000，以厂商样本为准。",
            "临界转速 nc = λ₂·dk/Lb²×10⁷：固定-固定 21.9、固定-支承 15.1、支承-支承 9.7、固定-自由 3.4；工作转速应 ≤0.8nc。",
            "压杆临界载荷 Pk = 0.5·η₁·π²·E·I/La²（E=2.06×10⁵MPa，I=πdk⁴/64）：η₁ 固定-固定 4.0、固定-支承 2.0、支承-支承 1.0、固定-自由 0.25；轴向载荷应 ≤Pk/3。"));
        return r;
    }

    /** 与前端 JSON.stringify(NaN)=null 对齐：NaN/∞ 时行值输出 null */
    private static Object nn(double x) {
        return (Double.isNaN(x) || Double.isInfinite(x)) ? null : x;
    }
}
