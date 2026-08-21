package com.erinson.calc.tools;

import com.erinson.calc.api.CalcController;
import com.erinson.calc.common.CalcResult;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * bolt-check 迁移对齐测试：与前端 tests/run-tests.js 同参数断言逐值一致。
 * 参考前端断言：M10 6.8级 F=2kN λ=0.25 → F0=5200N，σca≈130(kN)·1000 对齐。
 */
class BoltCheckToolTest {

    private final CalcTool tool = new BoltCheckTool();

    private Object val(CalcResult r, String label) {
        if (r.getSections() == null) return null;
        for (CalcResult.Section s : r.getSections()) {
            for (CalcResult.Row row : s.getRows()) {
                if (row.getLabel() != null && row.getLabel().startsWith(label)) return row.getValue();
            }
        }
        return null;
    }

    private Map<String, Object> params(Object... kv) {
        Map<String, Object> m = new HashMap<>();
        for (int i = 0; i < kv.length; i += 2) m.put(String.valueOf(kv[i]), kv[i + 1]);
        return m;
    }

    @Test
    void checkMode_MatchFrontEnd() {
        CalcResult r = tool.compute(params(
            "mode", "check", "matType", "steel", "grade", "6.8",
            "d", "10", "F", 2, "resType", 1.6, "lambda", 0.25, "S", 3));
        assertEquals("ok", r.getVerdict().getLevel());
        // F0 = 1.6*2000 + 2000 = 5200
        assertEquals(5200.0, ((Number) val(r, "螺栓总拉力")).doubleValue(), 1e-6);
        // σca = 1.3*5200 / (π*8.376²/4)
        double sigma = 1.3 * 5200 / (Math.PI * 8.376 * 8.376 / 4);
        assertEquals(sigma, ((Number) val(r, "计算应力")).doubleValue(), 1e-6);
    }

    @Test
    void designMode_RecommendsM() {
        CalcResult r = tool.compute(params(
            "mode", "design", "matType", "steel", "grade", "6.8",
            "F", 2, "resType", 1.6, "lambda", 0.25, "S", 3));
        assertEquals("ok", r.getVerdict().getLevel());
        assertNotNull(val(r, "推荐公称直径"));
    }

    @Test
    void missingLoad_ReturnsError() {
        CalcResult r = tool.compute(params("F", 0));
        assertNotNull(r.getError());
    }
}