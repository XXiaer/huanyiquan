import { state } from "../../router/desktop/state.js";
import { openAuthPopup } from "../../views/users/auth-desktop.js";

var BASE = (function () {
    var saved = localStorage.getItem('huanyiquan.api');
    if (saved) return saved.replace(/\/$/, '');
    // 由后端托管时同源，不需要前缀
    if (location.protocol === 'http:' || location.protocol === 'https:') return '';
    return 'http://localhost:8080';
})();

function ApiError(msg, code) {
    this.message = msg;
    this.code = code;
}

var _apiCache = new Map();

var _apiInFlight = new Map();

function _isCacheableGet(method, path, opt) {
    return method === 'GET' && !opt.noCache && path.indexOf('/notification') !== 0 && path.indexOf('/chat') !== 0;
}

async function api(path, opt) {
    opt = opt || {};
    var method = (opt.method || 'GET').toUpperCase();
    if (_isCacheableGet(method, path, opt)) {
        var hit = _apiCache.get(path);
        if (hit && hit.exp > Date.now()) return hit.data;
        if (_apiInFlight.has(path)) return _apiInFlight.get(path);
    } else if (method !== 'GET') {
        _apiCache.clear();
    }
    var run = (async function () {
    var init = {method: method, credentials: 'include', headers: {}, signal: opt.signal};
    if (opt.form) {
        init.body = opt.form;
    } else if (opt.body !== undefined) {
        init.headers['Content-Type'] = 'application/json';
        init.body = JSON.stringify(opt.body);
    }
    // 凭证放请求头，不依赖浏览器是否允许写 cookie
    var token = readToken();
    if (token) {
        init.headers['X-Token'] = token;
    }
    var res;
    try {
        res = await fetch(BASE + '/api' + path, init);
    } catch (e) {
        if (e.name === 'AbortError') throw e;
        throw new ApiError('连不上服务器，确认后端已经在 8080 端口启动', 0);
    }
    var issued = res.headers.get('X-Token');
    if (issued) {
        writeToken(issued);
    }
    var data = null;
    try {
        data = await res.json();
    } catch (e) {
        // 忽略非 JSON 响应
    }
    if (res.status === 401 || (data && data.code === 401)) {
        state.me = null;
        writeToken('');
        if (opt.optionalAuth) throw new ApiError((data && data.msg) || '请先登录', 401);
        if (window.innerWidth >= 768 && typeof window.openDesktopAuthModal === 'function') {
            if (location.hash && location.hash !== '#/login' && location.hash !== '#/register') {
                sessionStorage.setItem('hq.returnTo', location.hash);
            }
            openAuthPopup('login');
            throw new ApiError((data && data.msg) || '请先登录', 401);
        }
        // 记下当前页面，重新登录后跳回来
        if (location.hash && location.hash !== '#/login') {
            sessionStorage.setItem('hq.returnTo', location.hash);
        }
        if (location.hash !== '#/login') {
            location.hash = '#/login';
        }
        throw new ApiError((data && data.msg) || '登录状态已失效，请重新登录', 401);
    }
    if (!res.ok || (data && data.code !== 0)) {
        throw new ApiError((data && data.msg) || '请求失败（' + res.status + '）', (data && data.code) || res.status);
    }
    var out = data ? data.data : null;
    if (_isCacheableGet(method, path, opt)) {
        _apiCache.set(path, { data: out, exp: Date.now() + 12000 });
    }
    return out;
    })();
    if (_isCacheableGet(method, path, opt)) {
        _apiInFlight.set(path, run);
        try { return await run; } finally { _apiInFlight.delete(path); }
    }
    return run;
}

function readToken() {
    if (state.token) {
        return state.token;
    }
    try {
        return localStorage.getItem('hq.token') || '';
    } catch (e) {
        return '';
    }
}

function writeToken(v) {
    state.token = v || '';
    try {
        if (v) {
            localStorage.setItem('hq.token', v);
        } else {
            localStorage.removeItem('hq.token');
        }
    } catch (e) {
        // 无痕模式下可能写不进去，忽略
    }
}

export { ApiError, BASE, api, readToken, writeToken };
