package com.erinson.calc.tools;

import org.springframework.stereotype.Component;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 计算工具注册表（单例）。
 * <p>
 * 启动时自动收集所有 {@link CalcTool} 实现（Spring Bean 注入），
 * 提供按 id 查找与全量列表能力。后续每迁移一个工具，只需把对应 Java 类
 * 用 `@Component` 标注并实现 {@link CalcTool}，即自动注册，无需改任何路由。
 */
@Component
public class CalcToolRegistry {

    private final Map<String, CalcTool> tools = new LinkedHashMap<>();

    public CalcToolRegistry(List<CalcTool> toolBeans) {
        for (CalcTool t : toolBeans) {
            tools.put(t.id(), t);
        }
    }

    /** 按 id 取工具；不存在返回 null */
    public CalcTool get(String id) {
        return tools.get(id);
    }

    /** 是否已实现该工具 */
    public boolean has(String id) {
        return tools.containsKey(id);
    }

    /** 当前已注册工具 id 列表 */
    public java.util.Set<String> ids() {
        return tools.keySet();
    }

    public int size() {
        return tools.size();
    }
}