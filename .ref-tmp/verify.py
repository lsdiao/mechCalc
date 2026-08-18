from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    errors = []
    page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)

    # --- 工具1：公差查询 ---
    page.goto('http://localhost:8080/#tool/tolerance-query')
    page.wait_for_load_state('networkidle')
    print('title:', page.title())

    sel_hole = page.locator('[data-key="holeCode"]')
    print('holeCode before:', sel_hole.input_value())
    page.locator('.kb-panel', has_text='孔公差带键盘').locator('button', has_text='K7').first.click()
    page.wait_for_timeout(300)
    print('holeCode after K7 click:', sel_hole.input_value())
    print('holeGrade after:', page.locator('[data-key="holeGrade"]').input_value())
    res = page.locator('#resultBox').inner_text()[:120].replace('\n', ' | ')
    print('result:', res)

    # 切换到轴查询
    page.locator('.seg-btn', has_text='轴公差查询').click()
    page.wait_for_timeout(300)
    shaft_kb = page.locator('.kb-panel', has_text='轴公差带键盘')
    print('shaft kb visible:', shaft_kb.is_visible())
    shaft_kb.locator('button', has_text='f6').first.click()
    page.wait_for_timeout(300)
    print('shaftCode after f6 click:', page.locator('[data-key="shaftCode"]').input_value())
    print('shaftGrade after:', page.locator('[data-key="shaftGrade"]').input_value())
    res2 = page.locator('#resultBox').inner_text()[:120].replace('\n', ' | ')
    print('result2:', res2)
    page.screenshot(path='/data/tool/browser_snapshots/tol-query.png', full_page=True)

    # --- 工具2：配合查询 ---
    page.goto('http://localhost:8080/#tool/tolerance-fit-query')
    page.wait_for_load_state('networkidle')
    page.locator('.kb-panel', has_text='基孔制优先配合键盘').locator('button', has_text='k6').first.click()
    page.wait_for_timeout(300)
    print('fit hole/shaft:', page.locator('[data-key="holeCode"]').input_value(), page.locator('[data-key="shaftCode"]').input_value())
    res3 = page.locator('#resultBox').inner_text()[:150].replace('\n', ' | ')
    print('result3:', res3)

    print('JS errors:', errors if errors else 'none')
    browser.close()
