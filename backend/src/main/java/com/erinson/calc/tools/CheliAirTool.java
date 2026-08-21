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
 * 气动供应商在线计算工具（cheli-air，信息页）。
 * <p>
 * 迁移自 `js/tools/fluid3.js` 工具 6：纯信息页，汇总台湾气立、SMC、Festo 等
 * 气动厂商的在线选型与计算工具入口，本身不做本地计算。
 */
@Component
public class CheliAirTool implements CalcTool {

    @Override
    public String id() {
        return "cheli-air";
    }

    @Override
    public CalcResult compute(Map<String, Object> v) {
        CalcResult r = CalcResult.empty();
        r.setSections(Arrays.asList(
            section("收录的外部在线工具", Arrays.asList(
                row("台湾气立在线计算工具", "chelic.com（技术支援/计算公式）", null, null),
                row("SMC 选型与计算程序", "smc.com.cn/select（产品选型计算）", null, null),
                row("SMC 主管路压降/流量计算", "mssc.smcworld.com（压力降/建议流量）", null, null),
                row("SMC 流量特性计算软件", "mssc.smcworld.com/fccs（空气流量特性/合成计算）", null, null),
                row("Festo 工程设计软件", "festo.com.cn（自动化工程设计）", null, null)
            )),
            section("说明", Arrays.asList(
                row("工具性质", "本项为外部供应商计算工具入口，需跳转至对应官方网站使用", null, null)
            ))
        ));
        r.setVerdict(verdict("info",
            "此为外部工具入口集合，请选择对应厂商工具跳转使用",
            "各供应商在线工具以对应官网为准。"));
        r.setNotes(Arrays.asList(
            "SMC 压降/流量类工具还包括：气罐选型、气罐充放气、液/蒸汽/气体流量特性合成等。",
            "本页依 原站 气动供应商在线计算工具页（cheli-online-calculation）整理。"));
        return r;
    }
}
