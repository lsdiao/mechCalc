package com.erinson.calc.tools;

import com.erinson.calc.common.CalcResult;
import com.erinson.calc.common.CalcResult.Row;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 连接与校核类工具共享数据与工具函数。
 * <p>
 * 迁移自 `js/tools/connection.js` 顶部的共享数据段：
 * 螺纹小径表、性能等级表、不锈钢等级表、安全系数、键连接推荐表、
 * 花键许用应力表、弹簧钢丝数据等。供 connection 系列 11 个工具复用。
 */
public final class ConnShared {

    private ConnShared() {}

    /* ==================== 螺栓：螺纹小径 / 性能等级 ==================== */

    // 普通螺纹小径 GB/T 196-2003（mm）
    public static final Map<String, Double> THREAD_D1 = new LinkedHashMap<>();
    public static final List<String> THREAD_SIZES = new ArrayList<>();
    static {
        String[][] data = {
            {"1", "0.693"}, {"1.2", "0.857"}, {"1.6", "1.171"}, {"2", "1.509"}, {"2.5", "1.948"},
            {"3", "2.387"}, {"4", "3.242"}, {"5", "4.134"}, {"6", "4.917"}, {"8", "6.647"},
            {"10", "8.376"}, {"12", "10.106"}, {"14", "11.835"}, {"16", "13.835"}, {"18", "15.294"},
            {"20", "17.294"}, {"22", "19.294"}, {"24", "20.752"}, {"27", "23.752"}, {"30", "26.211"},
            {"33", "29.211"}, {"36", "31.670"}, {"39", "34.670"}, {"42", "37.129"}, {"45", "40.129"},
            {"48", "42.587"}, {"56", "50.046"}, {"64", "57.505"}
        };
        for (String[] d : data) THREAD_D1.put(d[0], Double.parseDouble(d[1]));
        THREAD_SIZES.addAll(THREAD_D1.keySet());
    }

    // 螺栓动载荷-设计推荐序列（不含 M14/M18/M22/M27/M33/M39/M45）
    public static final List<String> MT_SIZES = new ArrayList<>();
    static {
        for (String s : new String[]{"1", "1.2", "1.6", "2", "2.5", "3", "4", "5", "6", "8", "10", "12",
                "16", "20", "24", "30", "36", "42", "48", "56", "64"}) MT_SIZES.add(s);
    }

    // 性能等级 → 屈服强度 σs MPa
    public static final Map<String, Integer> GRADE_SS = new LinkedHashMap<>();
    // 性能等级 → 抗拉强度 σB MPa
    public static final Map<String, Integer> GRADE_SB = new LinkedHashMap<>();
    static {
        String[][] ss = {
            {"3.6", "180"}, {"4.6", "240"}, {"4.8", "320"}, {"5.6", "300"}, {"5.8", "400"},
            {"6.8", "480"}, {"8.8", "640"}, {"9.8", "720"}, {"10.9", "900"}, {"12.9", "1080"}, {"14.9", "1260"}
        };
        String[][] sb = {
            {"3.6", "300"}, {"4.6", "400"}, {"4.8", "400"}, {"5.6", "500"}, {"5.8", "500"},
            {"6.8", "600"}, {"8.8", "800"}, {"9.8", "900"}, {"10.9", "1000"}, {"12.9", "1200"}, {"14.9", "1400"}
        };
        for (String[] d : ss) GRADE_SS.put(d[0], Integer.parseInt(d[1]));
        for (String[] d : sb) GRADE_SB.put(d[0], Integer.parseInt(d[1]));
    }

    // 不锈钢等级 → [σs, σB, σ-1t, Kσ]（与 原站 数据 1:1 一致）
    public static final Map<String, double[]> SS_DATA = new LinkedHashMap<>();
    static {
        SS_DATA.put("A*-50", new double[]{210, 500, 175, 3.9});
        SS_DATA.put("A*-70", new double[]{450, 700, 245, 4.8});
        SS_DATA.put("A*-80", new double[]{600, 800, 280, 4.8});
        SS_DATA.put("C*-50", new double[]{250, 500, 175, 3.9});
        SS_DATA.put("C*-70", new double[]{410, 700, 245, 4.8});
        SS_DATA.put("C*-80", new double[]{640, 800, 280, 4.8});
        SS_DATA.put("C*-110", new double[]{820, 1100, 385, 5.2});
        SS_DATA.put("F1-45", new double[]{250, 450, 158, 3.9});
        SS_DATA.put("F1-60", new double[]{410, 600, 210, 3.9});
    }

    // 等级 → 抗压疲劳强度 σ-1t（MPa）
    public static final Map<String, Integer> GRADE_S1T = new LinkedHashMap<>();
    static {
        String[][] d = {
            {"3.6", "105"}, {"4.6", "140"}, {"4.8", "140"}, {"5.6", "175"}, {"5.8", "175"},
            {"6.8", "210"}, {"8.8", "280"}, {"9.8", "315"}, {"10.9", "350"}, {"12.9", "420"}, {"14.9", "490"}
        };
        for (String[] x : d) GRADE_S1T.put(x[0], Integer.parseInt(x[1]));
    }

    /** 统一取等级数据：返回 {ss, sb}（钢按 grade，不锈钢按 gradeSS） */
    public static double[] gradeData(Map<String, Object> v) {
        if ("ss".equals(CalcResult.str(v.get("matType")))) {
            double[] g = SS_DATA.getOrDefault(CalcResult.str(v.get("gradeSS")), SS_DATA.get("A*-70"));
            return new double[]{g[0], g[1]};
        }
        return new double[]{
            GRADE_SS.getOrDefault(CalcResult.str(v.get("grade")), 320),
            GRADE_SB.getOrDefault(CalcResult.str(v.get("grade")), 400)
        };
    }

    /** 按 σB 分段取缺口应力集中因数 Kσ（原站 逻辑） */
    public static double ksBySb(double sb) {
        return sb <= 400 ? 3 : sb <= 600 ? 3.9 : sb <= 800 ? 4.8 : 5.2;
    }

    /** 尺寸因数 ε（表2，d≤12 取 1，非标准档就近向下取） */
    public static double sizeFactor(double d) {
        if (!(d > 0)) return 1;
        if (d <= 12) return 1;
        if (d <= 16) return 0.87;
        if (d <= 20) return 0.8;
        if (d <= 24) return 0.74;
        if (d <= 30) return 0.65;
        if (d <= 36) return 0.64;
        if (d <= 42) return 0.6;
        if (d <= 48) return 0.57;
        if (d <= 56) return 0.54;
        return 0.53;
    }

    /** 设计计算：按 THREAD_D1 找第一个 >= need 的公称直径，找不到返回 null */
    public static String pickThread(double need) {
        for (String k : THREAD_SIZES) {
            if (THREAD_D1.get(k) >= need) return k;
        }
        return null;
    }

    /** 动载荷设计：按 MT_SIZES 序列找第一个 >= need 的公称直径 */
    public static String pickMTSize(double need) {
        for (String k : MT_SIZES) {
            if (THREAD_D1.get(k) >= need) return k;
        }
        return null;
    }

    /* ==================== 键连接：平键 / 楔键 ==================== */

    // 按轴径推荐 平键/楔键 截面与长度
    public static final double[][] FLAT_REC = {
        {8, 2, 2, 6}, {10, 3, 3, 6}, {12, 4, 4, 8}, {16, 5, 5, 10}, {22, 6, 6, 14},
        {28, 8, 7, 18}, {36, 10, 8, 22}, {40, 12, 8, 28}, {50, 14, 9, 36}, {56, 16, 10, 45},
        {63, 18, 11, 50}, {75, 20, 12, 56}, {85, 22, 14, 63}, {95, 25, 14, 70}, {110, 28, 16, 80},
        {120, 32, 18, 90}
    }; // {max, b, h, L}

    /** 平键/楔键 按轴径推荐（返回 {max,b,h,L}，找不到返回最后一行） */
    public static double[] flatRec(double d) {
        for (double[] r : FLAT_REC) if (d <= r[0]) return r;
        return FLAT_REC[FLAT_REC.length - 1];
    }

    // 平键/半圆键 许用挤压应力 [σp]（MPa）
    public static final Map<String, Map<String, Integer>> SIGP_FLAT = new LinkedHashMap<>();
    static {
        Map<String, Integer> steel = new LinkedHashMap<>();
        steel.put("静载荷", 135); steel.put("轻微冲击载荷", 101); steel.put("冲击载荷", 68);
        Map<String, Integer> iron = new LinkedHashMap<>();
        iron.put("静载荷", 75); iron.put("轻微冲击载荷", 56); iron.put("冲击载荷", 38);
        SIGP_FLAT.put("钢", steel);
        SIGP_FLAT.put("铸铁", iron);
    }
    // 平键动连接 [p]（钢）
    public static final Map<String, Integer> P_DYN = new LinkedHashMap<>();
    static {
        P_DYN.put("静载荷", 50); P_DYN.put("轻微冲击载荷", 40); P_DYN.put("冲击载荷", 30);
    }

    /** 平键/楔键 有效长度：A型 L-b，B型 L，C型 L-b/2 */
    public static double effLen(String keyType, double L, double b) {
        if ("B型".equals(keyType)) return L;
        if ("C型".equals(keyType)) return L - b / 2;
        return L - b; // A型
    }

    /** 双键承载系数：单键 1，双键 1.5 */
    public static double nKeys(Object keyNumber) {
        return "双键".equals(CalcResult.str(keyNumber)) ? 1.5 : 1;
    }

    /* ==================== 半圆键 ==================== */

    // 按轴径推荐半圆键（传递载荷用）
    public static final String[][] HALF_REC_LOAD = {
        {"6", "2x2.6x7x6.8x0.97"}, {"8", "2.5x3.7x10x9.7x1.2"}, {"10", "3x5x13x12.7x1.43"},
        {"12", "3x6.5x16x15.7x1.4"}, {"14", "4x6.5x16x15.7x1.8"}, {"16", "4x7.5x19x18.6x1.75"},
        {"18", "5x6.5x16x15.7x2.35"}, {"20", "5x7.5x19x18.6x2.32"}, {"22", "5x9x22x21.6x2.29"},
        {"25", "6x9x22x21.6x2.87"}, {"28", "6x10x25x24.5x2.83"}, {"32", "8x11x28x27.4x3.51"}
    };
    // 按轴径推荐半圆键（定位用）
    public static final String[][] HALF_REC_POS = {
        {"6", "1.5x2.6x7x6.8x0.72"}, {"8", "2x2.6x7x6.8x0.97"}, {"10", "2x3.7x10x9.7x0.95"},
        {"12", "2.5x3.7x10x9.7x1.2"}, {"14", "3x5x13x12.7x1.43"}, {"16", "3x6.5x16x15.7x1.4"},
        {"18", "3x6.5x16x15.7x1.4"}, {"20", "4x6.5x16x15.7x1.8"}, {"22", "4x7.5x19x18.6x1.75"},
        {"25", "5x6.5x16x15.7x2.35"}
    };

    /** 半圆键 按轴径推荐（返回规格串，找不到返回 null） */
    public static String halfRec(double d, boolean pos) {
        String[][] tab = pos ? HALF_REC_POS : HALF_REC_LOAD;
        for (String[] r : tab) if (d <= Double.parseDouble(r[0])) return r[1];
        return null;
    }

    /* ==================== 切向键 ==================== */

    // 按轴径推荐切向键：{max, t, c}
    public static final double[][] TAN_REC = {
        {70, 7, 0.7}, {90, 8, 0.7}, {110, 9, 0.7}, {130, 10, 1.1},
        {150, 11, 1.1}, {180, 12, 1.1}, {200, 14, 1.1}, {230, 16, 1.8}
    };

    /** 切向键 按轴径推荐（返回 {max,t,c}，找不到返回 null） */
    public static double[] tanRec(double d) {
        for (double[] r : TAN_REC) if (d <= r[0]) return r;
        return null;
    }

    /* ==================== 花键许用应力表 ==================== */

    // 矩形花键 [p] 范围表（GB/T 1144，MPa，按工作状况不良/中等/良好）
    public static final Map<String, String> RECT_P_STATIC_HEAT = new LinkedHashMap<>();
    public static final Map<String, String> RECT_P_STATIC_NOHEAT = new LinkedHashMap<>();
    public static final Map<String, String> RECT_P_DYN_LOADED = new LinkedHashMap<>();
    public static final Map<String, String> RECT_P_DYN_UNLOAD_HEAT = new LinkedHashMap<>();
    public static final Map<String, String> RECT_P_DYN_UNLOAD_NOHEAT = new LinkedHashMap<>();
    static {
        RECT_P_STATIC_HEAT.put("不良", "40~70"); RECT_P_STATIC_HEAT.put("中等", "100~140"); RECT_P_STATIC_HEAT.put("良好", "120~200");
        RECT_P_STATIC_NOHEAT.put("不良", "35~50"); RECT_P_STATIC_NOHEAT.put("中等", "60~100"); RECT_P_STATIC_NOHEAT.put("良好", "80~120");
        RECT_P_DYN_LOADED.put("不良", "3~10"); RECT_P_DYN_LOADED.put("中等", "5~15"); RECT_P_DYN_LOADED.put("良好", "10~20");
        RECT_P_DYN_UNLOAD_HEAT.put("不良", "20~35"); RECT_P_DYN_UNLOAD_HEAT.put("中等", "30~60"); RECT_P_DYN_UNLOAD_HEAT.put("良好", "40~70");
        RECT_P_DYN_UNLOAD_NOHEAT.put("不良", "15~20"); RECT_P_DYN_UNLOAD_NOHEAT.put("中等", "20~30"); RECT_P_DYN_UNLOAD_NOHEAT.put("良好", "25~40");
    }

    /* ==================== 压缩弹簧 ==================== */

    // 碳素弹簧钢丝抗拉强度 σb（GB/T 4357-2009，MPa）：[直径, σb]
    public static final double[][] SB_B = {
        {1, 1660}, {1.2, 1620}, {1.6, 1580}, {2, 1520}, {2.5, 1460}, {3, 1410}, {3.5, 1370}, {4, 1320},
        {4.5, 1290}, {5, 1270}, {5.5, 1250}, {6, 1220}, {7, 1180}, {8, 1160}, {9, 1130}, {10, 1110},
        {11, 1090}, {12, 1070}, {13, 1050}, {14, 1030}, {16, 990}, {18, 960}, {20, 930}, {22, 900}, {25, 870}
    };
    public static final double[][] SB_C = {
        {1, 1960}, {1.2, 1910}, {1.6, 1850}, {2, 1810}, {2.5, 1760}, {3, 1710}, {3.5, 1660}, {4, 1620},
        {4.5, 1590}, {5, 1560}, {5.5, 1520}, {6, 1480}, {7, 1430}, {8, 1400}, {9, 1380}, {10, 1350},
        {11, 1320}, {12, 1300}, {13, 1280}
    };

    /** 线性插值查 σb：d ≤ 首档取首档，d ≥ 末档取末档 */
    public static double sbLookup(double[][] tab, double d) {
        if (d <= tab[0][0]) return tab[0][1];
        for (int i = 0; i < tab.length - 1; i++) {
            double a0 = tab[i][0], a1 = tab[i][1], b0 = tab[i + 1][0], b1 = tab[i + 1][1];
            if (d >= a0 && d <= b0) return a1 + (d - a0) / (b0 - a0) * (b1 - a1);
        }
        return tab[tab.length - 1][1];
    }

    // 弹簧材料：name / G / (sb 表 或 tau2)
    public static final Map<String, String> SPRING_MAT_NAME = new LinkedHashMap<>();
    public static final Map<String, Double> SPRING_G = new LinkedHashMap<>();
    public static final Map<String, double[][]> SPRING_SB = new LinkedHashMap<>();
    public static final Map<String, Double> SPRING_TAU2 = new LinkedHashMap<>();
    static {
        SPRING_MAT_NAME.put("carbon", "碳素弹簧钢丝 B级（GB/T 4357）");
        SPRING_MAT_NAME.put("music", "碳素弹簧钢丝 C级·高强度（GB/T 4357）");
        SPRING_MAT_NAME.put("si", "60Si2Mn 硅锰弹簧钢（油淬火）");
        SPRING_MAT_NAME.put("crv", "50CrVA 铬钒弹簧钢（油淬火）");
        SPRING_MAT_NAME.put("sus", "不锈钢 304");
        SPRING_G.put("carbon", 79000.0); SPRING_G.put("music", 79000.0); SPRING_G.put("si", 79000.0);
        SPRING_G.put("crv", 79000.0); SPRING_G.put("sus", 71000.0);
        SPRING_SB.put("carbon", SB_B); SPRING_SB.put("music", SB_C);
        SPRING_TAU2.put("si", 640.0); SPRING_TAU2.put("crv", 610.0); SPRING_TAU2.put("sus", 440.0);
    }

    // 碳素钢丝许用切应力按载荷类别取 σb 的比例（III/II/I 类）
    public static final Map<String, Double> CARBON_CLASS = new LinkedHashMap<>();
    static {
        CARBON_CLASS.put("c3", 0.5); CARBON_CLASS.put("c2", 0.4); CARBON_CLASS.put("c1", 0.3);
    }
    // 合金钢许用切应力类别系数（III/II/I 类）
    public static final Map<String, Double> SPRING_CLASS = new LinkedHashMap<>();
    static {
        SPRING_CLASS.put("c3", 1.25); SPRING_CLASS.put("c2", 1.0); SPRING_CLASS.put("c1", 0.72);
    }
    // 钢丝直径优先系列（第1系列）
    public static final double[] WIRE_SERIES = {1, 1.2, 1.6, 2, 2.5, 3, 3.5, 4, 4.5, 5, 6, 8, 10, 12, 16, 20, 25, 30, 40};

    /* ==================== 通用工具函数 ==================== */

    /** 与前端 `+v` 一致的数值转换：非法/空返回 NaN（而非 0），用于需要 NaN 传播的场景 */
    public static double numNaN(Object o) {
        if (o == null) return Double.NaN;
        if (o instanceof Number) return ((Number) o).doubleValue();
        String s = String.valueOf(o).trim();
        if (s.isEmpty()) return Double.NaN;
        try { return Double.parseDouble(s); }
        catch (NumberFormatException e) { return Double.NaN; }
    }

    /** 构造 html 行（value 为 null，仅 html） */
    public static Row htmlRow(String label, String html) {
        Row r = CalcResult.row(label, null, null, null);
        r.setHtml(html);
        return r;
    }

    /** 与前端 App.fmt 相同的数值格式化：v 非数字返回 '--'，-0 归一，去尾零 */
    public static String fmt(double v) { return fmt(v, -1); }
    public static String fmt(double v, int d) {
        if (Double.isNaN(v)) return "--";
        if (Double.isInfinite(v)) return "∞";
        double av = Math.abs(v);
        if (d < 0) {
            d = av >= 100000 ? 0 : av >= 100 ? 1 : av >= 1 ? 2 : av >= 0.01 ? 4 : 6;
        }
        String s = String.format(java.util.Locale.US, "%." + d + "f", v);
        if (s.contains(".")) {
            s = s.replaceAll("0+$", "").replaceAll("\\.$", "");
        }
        if ("-0".equals(s)) s = "0";
        return s;
    }

    /** 数值转字符串：整值输出为整数（如 90.0 → "90"），其余原样 */
    public static String numStr(double x) {
        if (Double.isNaN(x) || Double.isInfinite(x)) return String.valueOf(x);
        if (x == Math.floor(x) && Math.abs(x) < 1e15) return String.valueOf((long) x);
        return String.valueOf(x);
    }
}
