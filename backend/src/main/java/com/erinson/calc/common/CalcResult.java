package com.erinson.calc.common;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;
import java.util.Map;

/**
 * 统一计算返回模型。
 * <p>
 * 结构镜像前端 `js/app.js` 的 `renderResult`：
 * <ul>
 *   <li>error   —— 可选，错误信息（非 0 字节时前端渲染 error）</li>
 *   <li>sections—— 结果分区，每区含标题 + 若干行</li>
 *   <li>verdict —— 可选，校核结论（level: ok / bad / warn）</li>
 *   <li>notes   —— 可选，说明列表</li>
 * </ul>
 * 该契约与前端零耦合，前端异步拿到后直接渲染，无需改动 UI/路由/表单。
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CalcResult {

    private String error;
    private List<Section> sections;
    private Verdict verdict;
    private List<String> notes;

    public static CalcResult ok(List<Section> sections) {
        CalcResult r = new CalcResult();
        r.sections = sections;
        return r;
    }

    public static CalcResult fail(String error) {
        CalcResult r = new CalcResult();
        r.error = error;
        return r;
    }

    public static CalcResult empty() {
        return new CalcResult();
    }

    /* 分区 */
    public static class Section {
        private String title;
        private List<Row> rows;

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public List<Row> getRows() { return rows; }
        public void setRows(List<Row> rows) { this.rows = rows; }
    }

    /* 路由表里的一行：value 优先，html 仅在前端需要自定义排版时传（后端一般不使用） */
    public static class Row {
        private String label;
        private Object value;      // Number 或 String
        private String html;       // 可选，自定义排版时使用
        private String unit;
        private Integer d;         // 小数位数
        private Boolean hl;        // 高亮

        public String getLabel() { return label; }
        public void setLabel(String label) { this.label = label; }
        public Object getValue() { return value; }
        public void setValue(Object value) { this.value = value; }
        public String getHtml() { return html; }
        public void setHtml(String html) { this.html = html; }
        public String getUnit() { return unit; }
        public void setUnit(String unit) { this.unit = unit; }
        public Integer getD() { return d; }
        public void setD(Integer d) { this.d = d; }
        public Boolean getHl() { return hl; }
        public void setHl(Boolean hl) { this.hl = hl; }

        /* 流式便捷：标记高亮 */
        public Row hl() { this.hl = true; return this; }
    }

    /* 校核结论（前端 v-mark：ok=✓，bad=✕，warn=!） */
    public static class Verdict {
        private String level; // ok / bad / warn
        private String text;
        private String note;

        public String getLevel() { return level; }
        public void setLevel(String level) { this.level = level; }
        public String getText() { return text; }
        public void setText(String text) { this.text = text; }
        public String getNote() { return note; }
        public void setNote(String note) { this.note = note; }
    }

    public String getError() { return error; }
    public void setError(String error) { this.error = error; }
    public List<Section> getSections() { return sections; }
    public void setSections(List<Section> sections) { this.sections = sections; }
    public Verdict getVerdict() { return verdict; }
    public void setVerdict(Verdict verdict) { this.verdict = verdict; }
    public List<String> getNotes() { return notes; }
    public void setNotes(List<String> notes) { this.notes = notes; }

    // 便捷工具：构造 Row / Section / Verdict
    public static Row row(String label, Object value, String unit, Integer d) {
        Row r = new Row();
        r.label = label; r.value = value; r.unit = unit; r.d = d;
        return r;
    }
    public static Section section(String title, List<Row> rows) {
        Section s = new Section();
        s.title = title; s.rows = rows;
        return s;
    }
    public static Verdict verdict(String level, String text, String note) {
        Verdict v = new Verdict();
        v.level = level; v.text = text; v.note = note;
        return v;
    }
    // 数值安全转换（兼容 number/string），供各工具实现使用
    public static double num(Object o) {
        if (o == null) return 0;
        if (o instanceof Number) return ((Number) o).doubleValue();
        try { return Double.parseDouble(String.valueOf(o).trim()); }
        catch (NumberFormatException e) { return 0; }
    }
    public static String str(Object o) {
        return o == null ? "" : String.valueOf(o);
    }
    /** 供工具实现构造（Map → Section），避免直接依赖 JSON；实际实现通常用 {#link CalcTool} */
    @SuppressWarnings("unused")
    public static Section sectionFromMap(Map<String, Object> m) {
        return (Section) m.get("section");
    }
}