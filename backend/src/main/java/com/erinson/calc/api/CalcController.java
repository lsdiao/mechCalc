package com.erinson.calc.api;

import com.erinson.calc.common.CalcResult;
import com.erinson.calc.tools.CalcToolRegistry;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 计算接口。
 * <p>
 * 统一入口：POST /erinson/calc/{toolId}
 * body: JSON 对象，键为前端表单字段 key，值为字符串/数值。
 * 返回：{@link CalcResult}（与前端 renderResult 契约一致）。
 */
@RestController
@RequestMapping("/erinson/calc")
public class CalcController {

    private final CalcToolRegistry registry;

    public CalcController(CalcToolRegistry registry) {
        this.registry = registry;
    }

    /** 执行指定工具的计算 */
    @PostMapping("/{toolId}")
    public CalcResult calculate(@PathVariable String toolId,
                                @RequestBody(required = false) Map<String, Object> params) {
        var tool = registry.get(toolId);
        if (tool == null) {
            return CalcResult.fail("未找到工具: " + toolId + "（后端尚未迁移该工具）");
        }
        return tool.compute(params == null ? Map.of() : params);
    }

    /** 已迁移工具 id 列表（前端可选用于降级提示） */
    @GetMapping("/registry")
    public Map<String, Object> registry() {
        return Map.of("total", registry.size(), "ids", registry.ids());
    }
}