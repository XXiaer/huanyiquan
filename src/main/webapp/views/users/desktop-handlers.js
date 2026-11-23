import { closeSheet, openSheet } from "../../components/desktop/sheet.js";
import { toast } from "../../components/desktop/toast.js";
import { go, render } from "../../router/desktop/navigation.js";
import { state } from "../../router/desktop/state.js";
import { ApiError, api, writeToken } from "../../utils/desktop/api.js";
import { $, esc, withBusy } from "../../utils/desktop/dom.js";
import { openReviewForm } from "../orders/desktop.js";
import {
    checkChain,
    openAuthPopup,
    renderEmail,
    renderLogin,
    sendEmailCodeWithCooldown,
} from "./auth-desktop.js";
import { THEME_DEFAULT, applyTheme, openProfileSheet } from "./desktop.js";
import { renderShelf, shelfRead, shelfRemember, shelfWrite } from "./saved-desktop.js";

const usersActions = {
    "register-email-send": async ({ element: el }) => {
        var email = el.form.elements.email;
        var studentNo = el.form.elements.studentNo.value.trim();
        if (!/^[0-9]{10}$/.test(studentNo)) { toast('请输入 10 位学号', 'err'); return; }
        if (!email.reportValidity()) return;
        var regCapToken = await window.openHumanCaptcha('安全验证 · 发送注册验证码');
        if (!regCapToken) return;
        await sendEmailCodeWithCooldown(el, 'register-email', function () {
            return api('/user/register/email/send', {method:'POST', body:{studentNo:studentNo,email:email.value.trim(),captchaToken:regCapToken}});
        }, '验证码已发送，请查收邮箱', 'ok', el.form?.elements.code);
        return;
    },
    "profile-tab": async ({ element: el }) => {
        var selected=el.dataset.v;
        document.querySelectorAll('[data-profile-panel]').forEach(function(panel){panel.hidden=panel.dataset.profilePanel!==selected;});
        document.querySelectorAll('[data-act="profile-tab"]').forEach(function(button){button.setAttribute('aria-pressed',String(button===el));});
        return;
    },
    "profile-share": async () => {
        if(navigator.share){try{await navigator.share({title:'换一圈个人主页',url:location.href});return;}catch(e){if(e.name==='AbortError')return;}}
        openSheet('<h3>分享个人主页</h3><label class="label" for="profile-link">主页链接</label><input class="input" id="profile-link" readonly value="'+esc(location.href)+'">');
        $('#profile-link')?.select();
        return;
    },
    "shelf-toggle": async ({ element: el }) => {
        var id=Number(el.dataset.id),items=shelfRead('favorites'),saved=items.some(function(x){return x.id===id;});
        await withBusy(el,async function(){
            var ok=saved?shelfWrite('favorites',items.filter(function(x){return x.id!==id;})):shelfRemember('favorites',(await api('/item/'+id)).item);
            if(ok){
                el.setAttribute('aria-pressed',String(!saved));
                el.textContent = saved ? '加入收藏夹' : '✓ 已加入收藏夹';
                var badge = $('.amz-cart-num');
                if (badge) badge.textContent = String(shelfRead('favorites').length);
            }
        });return;
    },
    "shelf-remove": async ({ element: el }) => {var key=el.dataset.key;if(shelfWrite(key,shelfRead(key).filter(function(x){return x.id!==Number(el.dataset.id); })))renderShelf();return;},
    "shelf-clear": async ({ element: el }) => {var cKey=el.dataset.key||'history';if(confirm('清空当前浏览器的'+(cKey==='favorites'?'收藏记录':'浏览历史')+'？')&&shelfWrite(cKey,[]))renderShelf();return;},
    "theme-select": async ({ element: el }) => { applyTheme(el.dataset.theme, true); return; },
    "theme-reset": async () => { applyTheme(THEME_DEFAULT, true); return; },
    "check-chain": async () => {
        await checkChain();
        return;
    },
    "login-method": async ({ element: el }) => {
        var previousEmail = $('#login-email')?.value;
        state.loginMethod = el.dataset.v;
        renderLogin('login');
        if (previousEmail && $('#login-email')) $('#login-email').value = previousEmail;
        return;
    },
    "login-email-send": async ({ element: el }) => {
        var loginEmail = $('#login-email');
        if (!loginEmail.reportValidity()) return;
        var lgCapToken = await window.openHumanCaptcha('安全验证 · 发送登录验证码');
        if (!lgCapToken) return;
        await sendEmailCodeWithCooldown(el, 'login-email', function () {
            return api('/user/login/email/send', {method:'POST', body:{email:loginEmail.value.trim(),captchaToken:lgCapToken}});
        }, '如果该邮箱已绑定账号，请查收验证码', undefined, $('#login-code'));
        return;
    },
    "auth-mode": async ({ element: el }) => {
        state.loginMode = el.dataset.mode;
        renderLogin(el.dataset.mode);
        return;
    },
    "logout": async () => {
        try { await api('/user/logout', {method: 'POST'}); } catch (ignore) {}
        writeToken('');
        state.me = null;
        toast('已退出');
        if (window.innerWidth >= 768 && typeof window.openDesktopAuthModal === 'function') {
            await render();
            openAuthPopup('login');
        } else {
            go('#/login');
        }
        return;
    },
    "me-filter": async ({ element: el }) => {
        state.meFilter = el.dataset.v;
        await render();
        return;
    },
    "user-review": async ({ element: el }) => {
        openReviewForm(Number(el.dataset.exchange), Number(el.dataset.id), el.dataset.nick);
        return;
    },
    "open-profile": async () => {
        openProfileSheet();
        return;
    },
};

const usersForms = {
    "email-send": async ({ form, data: fd, event: ev }) => {
        var sendBtn = ev.submitter || form.querySelector('[type="submit"]');
        await sendEmailCodeWithCooldown(sendBtn, 'bind-email', function () {
            return api('/user/email/send', {method:'POST', body:{email:fd.get('email')}});
        }, '验证码已发送，请查收', 'ok', form.parentElement?.querySelector('input[name="code"]') || $('#verify-code'));
        return;
    },
    "email-verify": async ({ data: fd }) => { await api('/user/email/verify',{method:'POST',body:{code:fd.get('code')}});toast('邮箱认证成功');await renderEmail();return; },
    "login": async ({ data: fd }) => {
        var loginPath = {student:'/user/login', email:'/user/login/email/password', code:'/user/login/email/code'}[state.loginMethod || 'student'];
        var loginBody = Object.fromEntries(fd);
        var loginCapToken = await window.openHumanCaptcha('登录安全验证');
        if (!loginCapToken) return;
        loginBody.captchaToken = loginCapToken;
        var u = await api(loginPath, {method:'POST', body:loginBody});
        if (u.token) {
            writeToken(u.token);
        }
        state.me = u;
        try {
            await api('/user/me');
        } catch (e) {
            if (e && e.code === 401) {
                throw new ApiError('登录没有生效。请允许本站保存 Cookie 或本地存储后重试，'
                    + '或换一个普通窗口（不要用无痕模式）');
            }
            throw e;
        }
        toast('欢迎回来，' + u.nickname, 'ok');
        var back = sessionStorage.getItem('hq.returnTo') || '#/home';
        sessionStorage.removeItem('hq.returnTo');
        go(back);
    },
    "register": async ({ data: fd }) => {
        var regCap = await window.openHumanCaptcha('注册安全验证');
        if (!regCap) return;
        var regUser = await api('/user/register', {method: 'POST', body: {
            studentNo: fd.get('studentNo'), nickname: fd.get('nickname'),
            password: fd.get('password'), college: fd.get('college'), building: fd.get('building'),
            email: fd.get('email'), code: fd.get('code'), captchaToken: regCap
        }});
        if (regUser && regUser.token) {
            writeToken(regUser.token);
            state.me = regUser;
            toast('注册成功，已自动登录', 'ok');
            go('#/home');
        } else {
            toast('注册成功，请登录', 'ok');
            state.loginMode = 'login';
            renderLogin('login');
        }
    },
    "profile": async ({ data: fd }) => {
        await api('/user/me', {method: 'PUT', body: {
            nickname: fd.get('nickname'), college: fd.get('college'), building: fd.get('building')
        }});
        closeSheet();
        toast('资料已更新', 'ok');
        await render();
    },
};

export { usersActions, usersForms };
