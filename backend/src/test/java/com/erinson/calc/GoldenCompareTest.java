package com.erinson.calc;

import com.erinson.calc.common.CalcResult;
import com.erinson.calc.tools.CalcTool;
import com.erinson.calc.tools.CalcToolRegistry;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.ClassPathResource;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 黄金值比对测试：用前端 JS 生成的 tests/golden.json 逐值驱动后端每个工具。
 * - 每个工具：默认参数 + 若干变工况快照
 * - 数值字段：容差比对（相对 1e-4，兼容 JS/Java 浮点细微差异）
 * - 字符串/verdict/error：精确比对
 */
@SpringBootTest
class GoldenCompareTest {

    @Autowired
    CalcToolRegistry registry;

    private final ObjectMapper om = new ObjectMapper();
    private int totalCases = 0;
    private final List<String> failures = new ArrayList<>();

    @Test
    void compareAllToolsAgainstGolden() throws Exception {
        JsonNode root = om.readTree(new ClassPathResource("golden.json").getInputStream());
        Iterator<Map.Entry<String, JsonNode>> it = root.fields();
        while (it.hasNext()) {
            Map.Entry<String, JsonNode> e = it.next();
            String toolId = e.getKey();
            CalcTool tool = registry.get(toolId);
            if (tool == null) {
                failures.add(toolId + ": 后端未实现");
                continue;
            }
            for (JsonNode snap : e.getValue()) {
                totalCases++;
                Map<String, Object> params = nodeToMap(snap.get("params"));
                CalcResult got = tool.compute(params);
                compareSnap(toolId, snap.get("result"), got);
            }
        }

        System.out.println("[golden] 用例总数=" + totalCases + ", 失败=" + failures.size());
        for (String f : failures) System.out.println("  FAIL " + f);
        // 未实现工具不判失败（迁移清单用），实现但比对失败才判失败
        long implFailures = failures.stream().filter(f -> !f.endsWith(": 后端未实现")).count();
        assertEquals(0, implFailures, "存在实现工具比对失败");
    }

    private void compareSnap(String toolId, JsonNode expect, CalcResult got) {
        if (expect.has("error")) {
            if (got.getError() == null) {
                failures.add(toolId + ": 期望 error 但成功返回");
            }
            return;
        }
        if (got.getError() != null) {
            failures.add(toolId + ": 后端返回 error=" + got.getError());
            return;
        }
        // verdict.level
        String expLevel = expect.has("verdict") && expect.get("verdict").has("level")
                ? expect.get("verdict").get("level").asText() : null;
        String gotLevel = got.getVerdict() == null ? null : got.getVerdict().getLevel();
        if (expLevel != null && !expLevel.equals(gotLevel)) {
            failures.add(toolId + ": verdict.level 期望=" + expLevel + " 实得=" + gotLevel);
            return;
        }
        // sections/rows：按 label 索引比对（value=null 表示「无值」，与期望 null 匹配）
        Map<String, Object> expByLabel = indexRows(expect);
        Map<String, Object> gotByLabel = indexRows(got);
        for (String label : expByLabel.keySet()) {
            if (!gotByLabel.containsKey(label)) {
                failures.add(toolId + ": 缺行 label=" + label);
                continue;
            }
            Object ev = expByLabel.get(label);
            Object gv = gotByLabel.get(label);
            if (ev == null && gv == null) continue;
            // 期望 null 与 实得 NaN 等价（JS 中 NaN 序列化为 JSON null）
            if (ev == null && gv instanceof Double && Double.isNaN((Double) gv)) continue;
            if (ev instanceof String && gv instanceof String) {
                if (!ev.equals(gv)) failures.add(toolId + ": label=" + label + " 期望=" + ev + " 实得=" + gv);
            } else if (ev instanceof Double && gv instanceof Double) {
                if (!near((Double) ev, (Double) gv)) {
                    failures.add(toolId + ": label=" + label + " 期望=" + ev + " 实得=" + gv);
                }
            } else {
                failures.add(toolId + ": label=" + label + " 期望=" + ev + " 实得=" + gv);
            }
        }
        // notes 数量
        if (expect.has("notes")) {
            int en = expect.get("notes").size();
            int gn = got.getNotes() == null ? 0 : got.getNotes().size();
            if (en != gn) failures.add(toolId + ": notes 数量 期望=" + en + " 实得=" + gn);
        }
    }

    private Map<String, Object> indexRows(JsonNode result) {
        Map<String, Object> map = new HashMap<>();
        if (result.has("sections")) {
            for (JsonNode sec : result.get("sections")) {
                for (JsonNode row : sec.get("rows")) {
                    String label = row.get("label").asText();
                    if (row.has("value")) {
                        JsonNode v = row.get("value");
                        if (v.isNull()) map.put(label, null);
                        else if (v.isNumber()) map.put(label, v.asDouble());
                        else map.put(label, v.asText());
                    } else if (row.has("html")) {
                        map.put(label, row.get("html").asText());
                    }
                }
            }
        }
        return map;
    }

    private Map<String, Object> indexRows(CalcResult r) {
        Map<String, Object> map = new HashMap<>();
        if (r.getSections() == null) return map;
        for (CalcResult.Section s : r.getSections()) {
            if (s.getRows() == null) continue;
            for (CalcResult.Row row : s.getRows()) {
                if (row.getLabel() == null) continue;
                Object v = row.getValue();
                if (v instanceof Number) map.put(row.getLabel(), ((Number) v).doubleValue());
                else if (v != null) map.put(row.getLabel(), String.valueOf(v));
                else if (row.getHtml() != null) map.put(row.getLabel(), row.getHtml());
                else map.put(row.getLabel(), null); // 显式无值（与期望 value=null 匹配）
            }
        }
        return map;
    }

    private Map<String, Object> nodeToMap(JsonNode n) {
        Map<String, Object> m = new HashMap<>();
        n.fields().forEachRemaining(en -> {
            JsonNode v = en.getValue();
            if (v.isNumber()) m.put(en.getKey(), v.asDouble());
            else m.put(en.getKey(), v.asText());
        });
        return m;
    }

    private boolean near(double a, double b) {
        if (Double.isNaN(a) && Double.isNaN(b)) return true;
        double tol = 1e-4 * Math.max(1, Math.max(Math.abs(a), Math.abs(b)));
        return Math.abs(a - b) <= tol;
    }
}