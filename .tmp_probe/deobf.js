// 反混淆 chaindrivedesign.min.js：执行字符串数组+RC4解码函数，替换所有 _0xXXXX(0xNNN,'key') 调用为明文
const fs = require('fs');
const src = fs.readFileSync('/workspace/.tmp_probe/chaindrivedesign.min.js', 'utf8');

// ---- stub 浏览器环境，阻止 jQuery ready 回调执行 ----
const handler = new Proxy(function () { return stub; }, {
    apply() { return stub; }
});
const stub = new Proxy({}, {
    get(t, p) {
        if (p === 'val') return function () { return arguments.length ? stub : ''; };
        return function () { return stub; };
    }
});
global.$ = handler;
global.jQuery = handler;
global.bootstrap = { Modal: { getInstance: () => ({ hide() { } }), getOrCreateInstance: () => ({ hide() { } }) } };
global.document = {
    getElementById: () => ({}), querySelector: () => null,
    createElement: () => ({ parentNode: null }),
    getElementsByTagName: () => [{ parentNode: { insertBefore() { } } }]
};
global.window = global;

// ---- 执行原文件（旋转 IIFE + _0x5004 + _0x3243 定义会生效；jQuery 代码被 stub 吞掉）----
try { eval(src); } catch (e) { console.error('EVAL-ERR:', e.message); }

const decoder = (typeof _0x3243 === 'function') ? _0x3243 : (global._0x3243);
if (typeof decoder !== 'function') { console.error('decoder not found'); process.exit(1); }

// ---- 全局替换所有 _0xXXXX(0xNNN,'key') ----
const cache = new Map();
let okCount = 0, errCount = 0;
const out = src.replace(/_0x[0-9a-fA-F]{4,10}\(\s*(0x[0-9a-fA-F]+)\s*,\s*'([^']*)'\s*\)/g, (full, idx, key) => {
    const ck = idx + '|' + key;
    let dec;
    if (cache.has(ck)) dec = cache.get(ck);
    else {
        try { dec = decoder(parseInt(idx, 16), key); okCount++; }
        catch (e) { dec = null; errCount++; }
        cache.set(ck, dec);
    }
    if (dec === null || dec === undefined) return '/*DECODE-FAIL:' + full + '*/';
    return JSON.stringify(dec);
});

fs.writeFileSync('/workspace/.tmp_probe/decoded.js', out);
console.log('unique calls decoded:', okCount, 'failed:', errCount, 'total length:', out.length);
