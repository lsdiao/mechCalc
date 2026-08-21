package com.erinson.calc.tools;

import java.util.Locale;

/**
 * 前端 `App.fmt` 的 Java 复刻（js/app.js），用于 verdict 等展示文本的数字格式化。
 * <ul>
 *   <li>NaN / 无穷：分别返回 "--" / "∞"</li>
 *   <li>未指定小数位时按量级自动取位（与前端一致）</li>
 *   <li>去尾零、-0 归零</li>
 * </ul>
 */
public final class Fmt {

    private Fmt() {}

    public static String fmt(double v) {
        return fmt(v, -1);
    }

    public static String fmt(double v, int d) {
        if (Double.isNaN(v) || Double.isInfinite(v)) return Double.isInfinite(v) ? "∞" : "--";
        double av = Math.abs(v);
        if (d < 0) {
            d = av >= 100000 ? 0 : av >= 100 ? 1 : av >= 1 ? 2 : av >= 0.01 ? 4 : 6;
        }
        String s = String.format(Locale.US, "%." + d + "f", v);
        if (s.contains(".")) {
            s = s.replaceAll("0+$", "").replaceAll("\\.$", "");
        }
        if ("-0".equals(s)) s = "0";
        return s;
    }
}
