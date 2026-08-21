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
 * 拖链长度计算（cable-chain）。
 * <p>
 * 迁移自 `js/tools/linear.js` 工具 3「拖链长度计算」，逐值对齐 golden。
 */
@Component
public class CableChainTool implements CalcTool {

    @Override
    public String id() {
        return "cable-chain";
    }

    @Override
    public CalcResult compute(Map<String, Object> v) {
        double S = ConnShared.numNaN(v.get("S"));
        double R = ConnShared.numNaN(v.get("R"));
        double margin = ConnShared.numNaN(v.get("margin"));
        double rise = ConnShared.numNaN(v.get("rise"));
        if (Double.isNaN(rise)) rise = 0;   // +v.rise || 0
        if (!(S > 0) || !(R > 0)) return CalcResult.fail("请输入行程 S 与弯曲半径 R");

        double bend = Math.PI * R;                              // 弯曲部分展开长度
        double Lmid = S / 2 + bend + margin + rise;             // 固定点在行程中央
        double Lend = S + bend + margin + rise;                 // 固定点在行程末端
        boolean mid = "mid".equals(CalcResult.str(v.get("fix")));
        double L = mid ? Lmid : Lend;
        double H = R + Math.PI * R / 2 + 50;                    // 拖链竖立总高近似
        double Hmin = R * 2 + 100;                              // 简化安装高度参考
        double perEnd = mid ? S / 4 : S / 2;                    // 拖链每端空载长度

        List<Row> sec1 = Arrays.asList(
            row("弯曲部分展开长 πR", nn(bend), "mm", 1),
            row("所需拖链长度 L", nn(L), "mm", null).hl(),
            row("折合米数", nn(L / 1000), "m", 2).hl(),
            row("与中央固定方案对比", nn((Lend - Lmid) / 1000), "m 更长（末端固定时）", 2)
        );
        List<Row> sec2 = Arrays.asList(
            row("拖链弯曲后总高（估算）", nn(H), "mm", 0),
            row("建议最小安装高度", nn(Hmin), "mm", 0),
            row("拖链每端空载长度", nn(perEnd), "mm", 0)
        );
        CalcResult r = CalcResult.empty();
        r.setSections(Arrays.asList(section("长度计算", sec1), section("安装空间", sec2)));
        r.setVerdict(verdict(
            "ok",
            mid
                ? "固定点在行程中央：L = S/2 + πR + 余量 = " + Fmt.fmt(L) + " mm"
                : "固定点在行程末端：L = S + πR + 余量 = " + Fmt.fmt(L) + " mm，比中央固定多 "
                    + Fmt.fmt((Lend - Lmid) / 1000, 2) + " m",
            "订购时按厂商节距圆整至整数链节数（通常取偶数节）。"));
        r.setNotes(Arrays.asList(
            "通用公式：L = S/2 + πR + K（K 为固定端余量）；固定点偏离中央 d 时 L = S/2 + πR + d + K。",
            "固定点位于行程中央可获得最短拖链、最低成本与最佳运行稳定性。",
            "重叠运行（滑行槽）工况请按厂商规范追加补偿量并校核滑行磨损。"));
        return r;
    }

    /** 与前端 JSON.stringify(NaN)=null 对齐：NaN/∞ 时行值输出 null */
    private static Object nn(double x) {
        return (Double.isNaN(x) || Double.isInfinite(x)) ? null : x;
    }
}
