import { toast } from "../../components/desktop/toast.js";

function $(sel, root) {
    return (root || document).querySelector(sel);
}

function esc(s) {
    return String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, function (c) {
        return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c];
    });
}

function safeRoute(raw, fallback) {
    var val = String(raw || '').trim();
    return /^#\/[a-z0-9/_-]+(?:\?[a-z0-9_=&%-]*)?$/i.test(val) ? val : (fallback || '#/notifications');
}

function safeStoreSet(key, val, warnMsg) {
    try {
        localStorage.setItem(key, val);
        return true;
    } catch (e) {
        if (warnMsg) toast(warnMsg, 'err');
        return false;
    }
}

async function withBusy(btn, fn) {
    if (btn) {
        btn.disabled = true;
        btn.dataset.text = btn.textContent;
    }
    try {
        return await fn();
    } catch (e) {
        toast(e.message || '操作失败', 'err');
        return null;
    } finally {
        if (btn) {
            btn.disabled = false;
        }
    }
}

export { $, esc, safeRoute, safeStoreSet, withBusy };
