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
 * 电机（减速机）选型计算（motor-select）。
 * <p>
 * 迁移自 `js/tools/selection.js`：由负载转矩 T、负载转速 n、减速比 i 与传动效率 η，
 * 计入安全系数 K 计算所需电机功率并圆整到标准功率等级，同时给出电机侧转速要求与转矩。
 */
@Component
public class MotorSelectTool implements CalcTool {

    /** 三相异步电机常用功率等级 kW（Y2/YE3 系列） */
    private static final double[] MOTOR_KW = {
        0.12, 0.18, 0.25, 0.37, 0.55, 0.75, 1.1, 1.5, 2.2, 3, 4, 5.5, 7.5, 11, 15,
        18.5, 22, 30, 37, 45, 55, 75, 90, 110, 132, 160, 200, 250
    };

    /** 电机常用同步转速 r/min */
    private static final double[] MOTOR_SPEED = {3000, 1500, 1000, 750};

    @Override
    public String id() {
        return "motor-select";
    }

    @Override
    public CalcResult compute(Map<String, Object> v) {
        double T = CalcResult.num(v.get("T"));
        double n = CalcResult.num(v.get("n"));
        double i = CalcResult.num(v.get("i"));
        double eta = CalcResult.num(v.get("eta"));
        double K = CalcResult.num(v.get("K"));
        if (!(T > 0) || !(n > 0)) return CalcResult.fail("请输入负载转矩与负载转速");
        if (!(i > 0) || !(eta > 0 && eta <= 1)) return CalcResult.fail("减速比或效率输入有误（0＜η≤1）");

        double Pload = T * n / 9550;                    // 负载功率 kW
        double Pneed = Pload * K / eta;                 // 所需电机功率
        double Psel = 0;
        for (double m : MOTOR_KW) {
            if (m >= Pneed) { Psel = m; break; }
        }
        if (Psel == 0) Psel = Math.ceil(Pneed);
        double nMotor = n * i;                          // 电机转速需求
        double Tmotor = T / (i * eta) * K;              // 电机轴所需转矩 N·m
        boolean speedOK = true;
        String speedHint = "";
        double bestSync = MOTOR_SPEED[0];
        for (double s : MOTOR_SPEED) {
            if (s >= nMotor) { bestSync = s; break; }
            bestSync = s;
        }
        if (nMotor > 3000) {
            speedOK = false;
            speedHint = "电机转速需求 " + Fmt.fmt(nMotor) + " r/min 超出普通三相异步电机范围（≤3000），请减小减速比或选用高速电机";
        }

        String text;
        if (speedOK) {
            text = "建议选用 " + Fmt.fmt(Psel) + " kW 电机" + (i > 1 ? " + 减速比 " + Fmt.fmt(i) + " 减速机" : "（电机直联）");
        } else {
            text = speedHint;
        }

        CalcResult r = CalcResult.empty();
        r.setSections(Arrays.asList(
            section("功率计算", Arrays.asList(
                row("负载功率 P=T·n/9550", Pload, "kW", 3).hl(),
                row("所需电机功率 Pd=K·P/η", Pneed, "kW", 3).hl(),
                row("圆整标准电机功率", Psel, "kW", null).hl(),
                row("功率裕度", Psel / Pneed, null, 2)
            )),
            section("转速与转矩", Arrays.asList(
                row("电机侧转速需求", nMotor, "r/min", 1).hl(),
                row("建议同步转速", bestSync, "r/min", 0),
                row("电机轴所需转矩", Tmotor, "N·m", 2).hl(),
                row("所选电机额定转矩", Psel * 9550 / nMotor, "N·m", 2)
            ))
        ));
        r.setVerdict(verdict(speedOK ? "ok" : "warn", text,
            "变频驱动时按恒转矩特性校核低速散热；伺服电机还需校核惯量比 JL/i²/JM ≤ 5~10。"));
        r.setNotes(Arrays.asList(
            "Pd = K·T·n/(9550·η)，K 为安全系数（工况越恶劣取越大）。",
            "选择减速比时兼顾：电机额定转速（4极≈1440r/min、2极≈2900r/min）÷ 负载转速。",
            "伺服/步进系统还需校核：① 折算惯量比 JL/i²/JM ≤ 5~10 ② 矩频特性 ③ 起动转矩裕度。",
            "风机泵类负载功率随转速三次方增长，调速时按 P∝n³ 校核。"));
        return r;
    }
}
