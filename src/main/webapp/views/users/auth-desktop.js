import { logoMarkup, shell } from "../../components/desktop/shell.js";
import { toast } from "../../components/desktop/toast.js";
import { go, render } from "../../router/desktop/navigation.js";
import { desktopRuntime, state } from "../../router/desktop/state.js";
import { api, writeToken } from "../../utils/desktop/api.js";
import { $, esc } from "../../utils/desktop/dom.js";

async function renderEmail() {
    var data=await api('/user/email');
    if(desktopRuntime.currentView.name!=='email')return;
    $('#app').innerHTML=shell('settings','<div class="settings-page"><div class="settings-heading"><h1>邮箱认证</h1><p>验证后，邮箱会绑定到你的账号。</p></div><section class="settings-card"><h2>'+(data.email?'已认证':'尚未认证')+'</h2>'+(data.email?'<p>'+esc(data.email)+'</p>':'')+(data.available?'<form data-form="email-send"><label class="label" for="verify-email">邮箱地址</label><input class="input" id="verify-email" name="email" type="email" maxlength="254" required><button class="btn btn-sm" type="submit" data-code-key="bind-email" data-idle-text="发送验证码">发送验证码</button></form><form data-form="email-verify"><label class="label" for="verify-code">邮箱验证码</label><input class="input" id="verify-code" name="code" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" required><button class="btn btn-primary btn-sm" type="submit">确认认证</button></form>':'<p>邮箱发信服务尚未开通。</p>')+'</section></div>');
    syncCodeCountdowns();
}

var CODE_COOLDOWN_SEC = 90;

var codeCooldowns = {};

function bindCodeButton(btn, key, idleText) {
    if (!btn || !key) return;
    var label = idleText || btn.dataset.idleText || btn.textContent.trim() || '发送验证码';
    btn.dataset.idleText = label;
    var rec = codeCooldowns[key];
    if (!rec) { rec = { until: 0, timer: null }; codeCooldowns[key] = rec; }
    if (rec.timer) { clearInterval(rec.timer); rec.timer = null; }
    var paint = function () {
        var left = Math.ceil((rec.until - Date.now()) / 1000);
        if (left > 0) {
            btn.disabled = true;
            btn.textContent = left + 's 后重发';
            return true;
        }
        btn.disabled = false;
        btn.textContent = label;
        if (rec.timer) { clearInterval(rec.timer); rec.timer = null; }
        return false;
    };
    if (paint()) {
        rec.timer = setInterval(function () {
            if (!btn.isConnected || !paint()) {
                clearInterval(rec.timer);
                rec.timer = null;
            }
        }, 250);
    }
}

function startCodeCountdown(btn, key, idleText) {
    if (!codeCooldowns[key]) codeCooldowns[key] = { until: 0, timer: null };
    codeCooldowns[key].until = Date.now() + CODE_COOLDOWN_SEC * 1000;
    bindCodeButton(btn, key, idleText);
}

function syncCodeCountdowns() {
    document.querySelectorAll('[data-code-key]').forEach(function (btn) {
        bindCodeButton(btn, btn.dataset.codeKey, btn.dataset.idleText);
    });
}

async function sendEmailCodeWithCooldown(btn, key, reqFn, okMsg, okType, focusEl) {
    if (!btn || btn.disabled) return;
    var idleText = btn.dataset.idleText || btn.textContent.trim() || '发送验证码';
    btn.dataset.idleText = idleText;
    btn.disabled = true;
    btn.textContent = '发送中…';
    try {
        await reqFn();
        toast(okMsg, okType);
        focusEl?.focus();
        startCodeCountdown(btn, key, idleText);
    } catch (error) {
        btn.disabled = false;
        btn.textContent = idleText;
        toast(error.message, 'err');
    }
}

function renderLogin(mode) {
    mode = mode || 'login';
    var isReg = mode === 'register';
    var method = isReg ? 'student' : (state.loginMethod || 'student');
    var methods = {student:'账号密码', email:'邮箱密码', code:'邮箱验证码'};
    var body = '<div class="auth-wrap"><div class="auth-card">'
        + '<div class="auth-logo" aria-label="换一圈">' + logoMarkup() + '</div>'
        + '<div class="auth-school">重庆移通学院 | 校园换物</div>'
        + '<h1>' + (isReg ? '注册新账号' : '欢迎回来') + '</h1>'
        + '<p class="lead">' + (isReg
            ? '用学号注册，初始信用分 80。发一件闲置，就能开始找换法。'
            : '校园里最缺的那件东西，可能正躺在别人的柜子里。') + '</p>'
        + '<form data-form="' + (isReg ? 'register' : 'login') + '">'
        + (isReg ? '' : '<div class="auth-methods" role="group" aria-label="登录方式">' + Object.keys(methods).map(function (key) {
            return '<button type="button" class="btn ' + (key === method ? 'btn-primary' : 'btn-ghost') + '" data-act="login-method" data-v="' + key + '" aria-pressed="' + (key === method) + '">' + methods[key] + '</button>';
        }).join('') + '</div>')
        + (method === 'student' ? '<div class="field"><label class="label">学号 <span class="opt">10 位数字</span></label>'
        + '<input class="input" name="studentNo" autocomplete="username" inputmode="numeric" '
        + 'maxlength="10" placeholder="例如 2021210001" required></div>'
            : '<div class="field"><label class="label" for="login-email">邮箱</label><input class="input" id="login-email" type="email" name="email" autocomplete="username" placeholder="已绑定的邮箱" required></div>')
        + (isReg ? '<div class="field"><label class="label">昵称</label>'
            + '<input class="input" name="nickname" placeholder="别人看到的名字" maxlength="20" required></div>' : '')
        + (method === 'code'
            ? '<div class="field"><label class="label" for="login-code">验证码</label><div class="auth-code"><input class="input" id="login-code" name="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}" placeholder="6 位数字" required><button type="button" class="btn btn-ghost" data-act="login-email-send" data-code-key="login-email" data-idle-text="发送验证码">发送验证码</button></div></div>'
            : '<div class="field"><label class="label">密码</label>'
        + '<input class="input" type="password" name="password" autocomplete="' + (isReg ? 'new-password' : 'current-password') + '" placeholder="6-20 位" required></div>')
        + (isReg ? '<div class="field"><label class="label" for="register-email">邮箱</label>'
            + '<input class="input" id="register-email" type="email" name="email" autocomplete="email" placeholder="用于接收验证码" required></div>'
            + '<div class="field"><label class="label" for="register-code">邮箱验证码</label>'
            + '<div class="auth-code"><input class="input" id="register-code" name="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}" placeholder="6 位数字" required>'
            + '<button class="btn btn-ghost" type="button" data-act="register-email-send" data-code-key="register-email" data-idle-text="发送验证码">发送验证码</button></div></div>'
            + '<div class="field"><label class="label">院系 <span class="opt">选填</span></label>'
            + '<input class="input" name="college" placeholder="例如 计算机学院"></div>'
            + '<div class="field"><label class="label">宿舍楼 <span class="opt">选填，用于就近面交</span></label>'
            + '<input class="input" name="building" placeholder="例如 紫荆 3 号楼"></div>' : '')
        + '<div class="form-error" id="form-error"></div>'
        + '<button class="btn btn-primary btn-block" type="submit" style="margin-top:6px">'
        + (isReg ? '注册' : '登录') + '</button>'
        + '</form>'
        + '<div class="auth-switch">' + (isReg ? '已有账号？' : '还没有账号？')
        + '<button type="button" data-act="auth-mode" data-mode="' + (isReg ? 'login' : 'register') + '">'
        + (isReg ? '去登录' : '去注册') + '</button></div>'
        + '<div class="chain" id="chain-status"></div>'
        + '</div></div>';
    $('#app').innerHTML = body;
    syncCodeCountdowns();
    checkChain();
}

async function checkChain() {
    var box = $('#chain-status');
    if (!box) return;
    box.innerHTML = '<div class="row"><span class="dot"></span>正在检测后端与数据库…</div>';

    var server = false, db = false, onShelf = 0, err = '';
    try {
        var d = await api('/meta/status');
        server = true;
        db = !!d.db;
        onShelf = d.onShelf || 0;
        err = d.dbError || '';
    } catch (e) {
        server = false;
    }

    var html = '<div class="row"><span class="dot ' + (server ? 'ok' : 'bad') + '"></span>'
        + '<b>后端</b>' + (server ? '已连接' : '未启动 | 双击 start.bat')
        + '</div>'
        + '<div class="row"><span class="dot ' + (db ? 'ok' : 'bad') + '"></span>'
        + '<b>数据库</b>' + (db ? '正常 | 在架 ' + onShelf + ' 件'
            : '连不上 | 检查 MySQL 与 db.properties')
        + '</div>';
    if (server && !db && err) {
        html += '<div class="row" style="color:var(--ink-400);font-size:11px">' + esc(err) + '</div>';
    }
    html += '<button class="chain-retry" type="button" data-act="check-chain">重新检测</button>';
    box.innerHTML = html;
}

function openAuthPopup(mode, returnTo) {
    if (returnTo) sessionStorage.setItem('hq.returnTo', returnTo);
    if (typeof window.openDesktopAuthModal === 'function' && window.innerWidth >= 768) {
        window.openDesktopAuthModal({
            mode: mode === 'register' ? 'register' : 'login',
            onSuccess: async function (user) {
                if (user && user.token) writeToken(user.token);
                state.me = user || null;
                try {
                    var fresh = await api('/user/me', { optionalAuth: true });
                    if (fresh) state.me = fresh;
                } catch (ignore) {}
                toast('欢迎回来，' + (state.me && state.me.nickname ? state.me.nickname : '同学'), 'ok');
                var back = sessionStorage.getItem('hq.returnTo');
                sessionStorage.removeItem('hq.returnTo');
                if (back && back !== '#/login' && back !== '#/register' && back !== location.hash) {
                    go(back);
                } else if (location.hash === '#/login' || location.hash === '#/register') {
                    history.replaceState(null, '', '#/home');
                    await render();
                } else {
                    await render();
                }
            }
        });
        return true;
    }
    return false;
}

export {
    checkChain,
    openAuthPopup,
    renderEmail,
    renderLogin,
    sendEmailCodeWithCooldown,
    syncCodeCountdowns,
};
