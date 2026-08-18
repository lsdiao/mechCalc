/* jsdom 全链路测试：渲染公差查询工具 → 点击键盘按钮 → 校验填充与计算 */
'use strict';
var fs = require('fs');
var path = require('path');
var JSDOM = require('jsdom').JSDOM;

var ROOT = '/workspace';
var html = '<!doctype html><html><body><input id="globalSearch"><div id="searchDrops"></div><div id="sidebar"></div><div id="main"></div></body></html>';
var dom = new JSDOM(html, { runScripts: 'outside-only', url: 'http://localhost/' });
var w = dom.window;

/* app.js 可能引用的 DOM API 补齐 */
w.scrollTo = function () {};
global.window = w;
global.document = w.document;
global.location = w.location;

var vm = require('vm');
var ctx = dom.getInternalVMContext();
function load(f) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
}
load('js/app.js');
['js/tools/connection.js', 'js/tools/linear.js', 'js/tools/transmission.js', 'js/tools/fluid.js', 'js/tools/selection.js', 'js/tools/common.js', 'js/tools/toldata.js', 'js/tools/tolerance.js'].forEach(load);

/* 直接渲染工具页（走真实 route 逻辑） */
w.location.hash = '#tool/tolerance-query';
var App = w.App;
var main = w.document.getElementById('main');
/* 手动 boot（index.html 中由 DOMContentLoaded 触发） */
App.boot();

console.log('页面标题:', (main.querySelector('h1') || {}).textContent);
console.log('键盘面板数:', main.querySelectorAll('.kb-panel').length);
console.log('孔键盘按钮数:', main.querySelectorAll('.kb-panel [data-targets*="holeCode"] .kb-btn').length);

/* 点击 K7 */
var k7 = null;
main.querySelectorAll('.kb-btn').forEach(function (b) {
  if (b.textContent === 'K7') k7 = b;
});
console.log('K7 按钮 data-set:', k7 && k7.getAttribute('data-set'));
var holeCode = main.querySelector('[data-key="holeCode"]');
var holeGrade = main.querySelector('[data-key="holeGrade"]');
console.log('点击前 resultBox:', main.querySelector('#resultBox').textContent.replace(/\s+/g, ' ').slice(0, 60));
k7.click();
console.log('点击后 holeCode =', holeCode.value, ', holeGrade =', holeGrade.value);
/* 页面上所有 data-key 元素与值 */
main.querySelectorAll('[data-key]').forEach(function (el) {
  console.log('  [data-key=' + el.getAttribute('data-key') + '] tag=' + el.tagName + ' val=' + JSON.stringify(el.value) + ' display=' + (el.style.display || ''));
});
console.log('点击后 resultBox:', main.querySelector('#resultBox').textContent.replace(/\s+/g, ' ').slice(0, 60));
console.log('结果含 φ40 K7:', /φ40 K7|40 K7/.test(main.querySelector('#resultBox').textContent));

/* 切换轴 → 点击 f6（jsdom 中直接点 radio input） */
main.querySelectorAll('input[type="radio"][data-key="obj"]').forEach(function (r) {
  if (r.value === 'shaft') { r.click(); r.checked = true; }
});
main.dispatchEvent(new w.Event('change'));
var f6 = null;
main.querySelectorAll('.kb-btn').forEach(function (b) { if (b.textContent === 'f6') f6 = b; });
console.log('f6 按钮 data-set:', f6 && f6.getAttribute('data-set'));
f6.click();
console.log('轴结果片段:', main.querySelector('#resultBox').textContent.replace(/\s+/g, ' ').slice(0, 100));
