package com.erinson.calc.tools;

import com.erinson.calc.common.CalcResult;
import java.util.Map;

/**
 * 计算工具接口。
 * <p>
 * 每个工具实现一个 Java 类，`id()` 对应前端工具 id（如 "bolt-check"），
 * `compute(params)` 接收前端提交的键值对（字段 key → 值），返回统一 {@link CalcResult}。
 * <p>
 * 迁移自 `js/tools/*.js` 中对应工具的 `compute(v)`：
 * 字段级联（segment/select → 字符串，number → 数值）、verdict、notes 一一对应。
 */
public interface CalcTool {

    /** 工具唯一 id（与前端 App 工具 id 一致） */
    String id();

    /** 计算：params 为前端表单键值对（用 CalcResult.num/str 安全取值） */
    CalcResult compute(Map<String, Object> params);
}