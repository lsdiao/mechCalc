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
 * 气动回路计算（pneumatic-circuit）。
 * <p>
 * 迁移自 `js/tools/fluid3.js` 工具 3：气缸前进/后退推力、标准状态耗气量、
 * 管路压降（Darcy-Weisbach 可压缩流近似）与压缩机功率估算。
 */
@Component
public class PneumaticCircuitTool implements CalcTool {

    /** 标准大气压 MPa */
    private static final double P_ATM = 0.101325;

    @Override
    public String id() {
        return "pneumatic-circuit";
    }

    @Override
    public CalcResult compute(Map<String, Object> v) {
        String stdBore = CalcResult.str(v.get("stdBore"));
        double D;
        if ("custom".equals(stdBore)) {
            double bd = CalcResult.num(v.get("boreDia"));
            D = bd != 0 ? bd : CalcResult.num(v.get("stdBore")); // +v.boreDia || +v.stdBore
        } else {
            D = CalcResult.num(v.get("stdBore"));
        }
        double d = CalcResult.num(v.get("rodDia"));
        double S = CalcResult.num(v.get("stroke"));
        double P = CalcResult.num(v.get("pressure"));
        double eta = (CalcResult.num(v.get("efficiency")) != 0 ? CalcResult.num(v.get("efficiency")) : 85) / 100;
        double cycles = CalcResult.num(v.get("cycles"));
        double cnt = CalcResult.num(v.get("cylCount")) != 0 ? CalcResult.num(v.get("cylCount")) : 1;
        double pipeDia = CalcResult.num(v.get("pipeDia")) != 0 ? CalcResult.num(v.get("pipeDia")) : 10;
        double pipeLen = CalcResult.num(v.get("pipeLen")) != 0 ? CalcResult.num(v.get("pipeLen")) : 5;
        if (!(D > 0) || !(P > 0)) return CalcResult.fail("请输入有效缸径与供气压力");

        double P_abs = P + P_ATM;                                       // MPa 绝对压力
        double A_bore = Math.PI / 4 * D * D;                            // 缸径侧面积 mm²
        double A_rod = Math.PI / 4 * (D * D - d * d);                   // 杆侧面积 mm²
        double F_advT = A_bore * P, F_retT = A_rod * P;                 // 理论推力 N（MPa·mm²=N）
        double F_adv = A_bore * P * eta, F_ret = A_rod * P * eta;       // 实际推力 N
        double q_adv = (P_abs / P_ATM) * A_bore * S * 1e-6;             // 前进耗气 NL/行程
        double q_ret = (P_abs / P_ATM) * A_rod * S * 1e-6;              // 后退耗气 NL/行程
        double q_cycle = q_adv + q_ret;                                 // 单循环 NL
        double q_total = q_cycle * cycles * cnt;                        // NL/min
        double P_comp = q_total * P / 100;                              // kW
        // 管路流速与压降（Darcy-Weisbach, f=0.02, ρstd=1.2 kg/m³）
        double Ap = Math.PI / 4 * Math.pow(0.001 * pipeDia, 2);         // 管路截面积 m²
        double v_pipe = Ap > 0 ? q_total / 60 * 0.001 * (P_ATM / P_abs) / Ap : 0; // m/s
        double pipeDPa = (pipeLen / (0.001 * pipeDia)) * 0.02
            * ((P_abs / P_ATM) * 1.2 * v_pipe * v_pipe / 2);            // Pa
        double dp_kPa = pipeDPa / 1000;                                 // kPa

        CalcResult r = CalcResult.empty();
        r.setSections(Arrays.asList(
            section("气缸推力", Arrays.asList(
                row("前进推力 F=πD²/4·P·η（实际）", F_adv, "N", null).hl(),
                row("前进推力（理论）", F_advT, "N", 1),
                row("后退推力 F=π(D²-d²)/4·P·η（实际）", F_ret, "N", 1),
                row("后退推力（理论）", F_retT, "N", 1),
                row("缸径侧受压面积", A_bore / 100, "cm²", 3),
                row("杆侧受压面积", A_rod / 100, "cm²", 3)
            )),
            section("耗气量", Arrays.asList(
                row("单次行程耗气（前进）", q_adv, "NL", 4),
                row("单次行程耗气（后退）", q_ret, "NL", 4),
                row("单次循环总耗气", q_cycle, "NL", 3),
                row("全部气缸所需流量", q_total, "NL/min", 2).hl()
            )),
            section("管路与功率", Arrays.asList(
                row("管路流速（估算）", v_pipe, "m/s", 2),
                row("管路压降 ΔP=f·L/d·ρv²/2", dp_kPa, "kPa", 3),
                row("压缩机功率 P=Q·P/100", P_comp, "kW", 3).hl()
            ))
        ));
        r.setVerdict(verdict(v_pipe <= 20 ? "ok" : "warn",
            "前进推力 " + Fmt.fmt(F_adv) + " N（实际），系统需流量 " + Fmt.fmt(q_total, 1)
                + " NL/min，压缩机约 " + Fmt.fmt(P_comp, 2) + " kW",
            "主管路流速建议控制在 5~10 m/s 以下；空压机选型建议留 1.5~2.0 倍安全余量。"));
        r.setNotes(Arrays.asList(
            "推力 F=πD²/4·P·η（前进），F=π(D²-d²)/4·P·η（后退），P 为表压。",
            "标准耗气量 Q=(P_abs/P_atm)·V，折算到 101.3 kPa 标准大气压。",
            "本工具公式与默认值依 原站 气动回路计算页（pneumaticCircuit / pipeFlowAndPressureCal）。"));
        return r;
    }
}
