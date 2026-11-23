import { openReportSheet } from "./report.js";
import { closeSheet, openSheet } from "./sheet.js";
import { toast } from "./toast.js";
import { go } from "../../router/desktop/navigation.js";
import { desktopRuntime, readSavedCampusSpot, state } from "../../router/desktop/state.js";
import { api } from "../../utils/desktop/api.js";
import { CAMPUS_SPOTS } from "../../utils/desktop/catalog.js";
import { $, esc } from "../../utils/desktop/dom.js";
import { loadHome, renderHome } from "../../views/market/desktop.js";

const shellActions = {
    "scroll-top": async () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    },
    "skip-main": async ({ event: ev }) => {ev.preventDefault();$('#main-content')?.focus();return;},
    "open-campus-picker": async () => {
        var curSpot = state.home.campusSpot || readSavedCampusSpot() || '';
        var spotBtns = '<button type="button" class="chip ' + (!curSpot ? 'on' : '') + '" data-act="pick-campus-spot" data-v="">全校公共区域（不限点位）</button>'
            + CAMPUS_SPOTS.map(function (s) {
                return '<button type="button" class="chip ' + (curSpot === s ? 'on' : '') + '" data-act="pick-campus-spot" data-v="' + esc(s) + '">' + esc(s) + '</button>';
            }).join('');
        openSheet('<h3>选择常用校内面交点</h3><p class="sub">重庆移通学院校内公共安全交接点位，选定后将自动记忆并优先匹配同区好物。</p>'
            + '<div class="chips" style="margin-top:10px">' + spotBtns + '</div>');
        return;
    },
    "pick-campus-spot": async ({ element: el }) => {
        var chosenSpot = el.dataset.v || '';
        state.home.campusSpot = chosenSpot;
        try {
            if (chosenSpot) localStorage.setItem('hq.campusSpot', chosenSpot);
            else localStorage.removeItem('hq.campusSpot');
        } catch (e) {}
        var lbl = document.getElementById('amz-campus-label');
        if (lbl) lbl.textContent = chosenSpot || '重庆移通学院';
        closeSheet();
        toast(chosenSpot ? '已切换面交点为「' + chosenSpot + '」' : '已切换为全校公共区域', 'ok');
        if (desktopRuntime.currentView.name === 'home') {
            if (await loadHome(true)) renderHome();
        }
        return;
    },
    "zoom-image": async ({ element: el }) => {
        var imgSrc = el.dataset.src || (el.querySelector('img') && el.querySelector('img').getAttribute('src')) || '';
        if (!imgSrc) return;
        openSheet('<div class="amz-lightbox"><img src="' + esc(imgSrc) + '" alt="商品大图"></div>');
        return;
    },
    "sheet-close": async () => { closeSheet();return; },
    "mask-close": async ({ event: ev, element: el }) => {
        if (ev.target === el) closeSheet();
        return;
    },
    "go": async ({ event: ev, element: el }) => {
        ev.preventDefault();
        if (/^返回/.test(el.textContent.trim())) siteRoutes.go(el.dataset.to);
        else siteRoutes.go(el.dataset.to, { newTab: true });
        return;
    },
    "open-report": async ({ element: el }) => {
        openReportSheet(el.dataset.type, el.dataset.id);
        return;
    },
};

const shellForms = {
    "report": async ({ data: fd }) => {
        var rr = await api('/report', {method: 'POST', body: {
            targetType: Number(fd.get('targetType')),
            targetId: Number(fd.get('targetId')),
            reason: fd.get('reason')
        }});
        closeSheet();
        toast(rr.msg || '已提交', 'ok');
    },
};

export { shellActions, shellForms };
