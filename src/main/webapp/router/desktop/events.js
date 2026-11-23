import { bindDesktopControls } from "../../components/desktop/page-controls.js";
import { shellActions, shellForms } from "../../components/desktop/handlers.js";
import { closeSheet } from "../../components/desktop/sheet.js";
import { toast } from "../../components/desktop/toast.js";
import { go } from "./navigation.js";
import { state } from "./state.js";
import { ApiError } from "../../utils/desktop/api.js";
import { $ } from "../../utils/desktop/dom.js";
import { adminActions, adminForms } from "../../views/admin/desktop-handlers.js";
import { communityActions, communityForms } from "../../views/community/desktop-handlers.js";
import { homeActions } from "../../views/home/desktop-handlers.js";
import { marketActions, marketForms } from "../../views/market/desktop-handlers.js";
import { messagesActions } from "../../views/messages/desktop-handlers.js";
import { ordersActions, ordersForms } from "../../views/orders/desktop-handlers.js";
import { checkChain, openAuthPopup } from "../../views/users/auth-desktop.js";
import { usersActions, usersForms } from "../../views/users/desktop-handlers.js";

function bindSheetKeys() {
    document.addEventListener('keydown',function(ev){
        var panel=$('#modal .sheet');
        if(!panel)return;
        if(ev.key==='Escape'){ev.preventDefault();closeSheet();return;}
        if(ev.key!=='Tab')return;
        var elements=Array.from(panel.querySelectorAll('a[href],button,input,select,textarea,summary')).filter(function(el){return !el.disabled&&el.getClientRects().length;});
        if(!elements.length){ev.preventDefault();return;}
        var first=elements[0],last=elements[elements.length-1],active=document.activeElement;
        if(ev.shiftKey&&(active===first||active===panel)){ev.preventDefault();last.focus();}
        else if(!ev.shiftKey&&active===last){ev.preventDefault();first.focus();}
    });
}

function bindLandingKeys() {
    document.addEventListener('keydown', function (ev) {
        if (ev.key === 'Escape') {
            var drawer = $('#landing-menu');
            if (drawer && !drawer.hidden) { drawer.hidden = true; $('.land-scrim').hidden = true; $('.land-menu-toggle').setAttribute('aria-expanded', 'false'); $('.land-menu-toggle').focus(); }
        }
    });
}

const clickHandlers = new Map(Object.entries(Object.assign({}, ordersActions, adminActions, shellActions, marketActions, messagesActions, communityActions, usersActions, homeActions)));

const formHandlers = new Map(Object.entries(Object.assign({}, ordersForms, communityForms, marketForms, usersForms, shellForms, adminForms)));

async function handleDesktopClick(ev) {
    var authLink = ev.target.closest('a[href="#/login"], a[href="#/register"]');
    if (authLink && window.innerWidth >= 768 && typeof window.openDesktopAuthModal === 'function') {
        ev.preventDefault();
        openAuthPopup(authLink.getAttribute('href') === '#/register' ? 'register' : 'login');
        return;
    }
    var jdLink = ev.target.closest('.jd-side-nav a[href^="#/"]');
    if (jdLink) {
        var sideEl = jdLink.closest('.jd-side-nav');
        state._jdPendingScroll = { winY: window.scrollY, sideY: sideEl ? sideEl.scrollTop : 0 };
        ev.preventDefault();
        go(jdLink.getAttribute('href'));
        return;
    }
    var el = ev.target.closest('[data-act]');
    if (!el) return;
    var act = el.dataset.act;
    const handle = clickHandlers.get(act);
    if (handle) await handle({ event: ev, element: el, action: act });
}

async function handleDesktopSubmit(ev) {
    var form = ev.target.closest('[data-form]');
    if (!form) return;
    ev.preventDefault();
    var kind = form.dataset.form;
    var fd = new FormData(form);
    var btn = ev.submitter || form.querySelector('button[type=submit]');
    var publishError=form.querySelector('.publish-error');
    if(publishError){publishError.hidden=true;publishError.textContent='';}

    async function run() {
        if (kind === 'register' || (kind === 'login' && (!state.loginMethod || state.loginMethod === 'student'))) {
            var no = String(fd.get('studentNo') || '').trim();
            if (!/^\d{10}$/.test(no) && !(kind === 'login' && no === 'admin')) {
                throw new ApiError('学号是 10 位数字，例如 2021210001');
            }
        }
        const handle = formHandlers.get(kind);
        if (handle) await handle({ form, data: fd, button: btn, kind, event: ev });
    }
    if (btn) btn.disabled = true;
    var errBox = document.querySelector('#form-error');
    if (errBox) {
        errBox.classList.remove('show');
    }
    try {
        await run();
    } catch (e) {
        var msg = e.message || '操作失败';
        if ((kind === 'login' || kind === 'register') && errBox) {
            if (msg.indexOf('数据库') >= 0) {
                msg = '数据库连不上：确认 MySQL 已启动，且 db.properties 里的账号密码正确';
            }
            errBox.textContent = msg;
            errBox.classList.add('show');
            checkChain();
        } else if(publishError){
            publishError.textContent=msg;publishError.hidden=false;publishError.focus();
        } else {
            toast(msg, 'err');
        }
    } finally {
        if (btn) btn.disabled = false;
    }
}

function bindDesktopInteractions() {
    document.addEventListener("click", handleDesktopClick);
    document.addEventListener("submit", handleDesktopSubmit);
    bindDesktopControls();
    bindSheetKeys();
    bindLandingKeys();
}

export { bindDesktopInteractions };
