import { navIcon } from "../../components/desktop/icons.js";
import { toast } from "../../components/desktop/toast.js";
import { state } from "../../router/desktop/state.js";
import { BASE, api, readToken } from "../../utils/desktop/api.js";
import { renderOffers } from "../orders/offers-desktop.js";

var noticeTracker = { token:'', latest:0, count:0, initialized:false, request:0, pending:0, timer:null };

function closeNoticePopup() {
    if (noticeTracker.timer) clearTimeout(noticeTracker.timer);
    noticeTracker.timer=null; var popup=document.getElementById('notice-popup'); if(popup)popup.remove();
}

function applyNoticeCountDom(n) {
    n = Math.max(0, Number(n) || 0);
    document.querySelectorAll('.notice-count').forEach(function(el){
        el.textContent=n>99?'99+':String(n);
        el.hidden=n===0;
        el.setAttribute('aria-label',n+' 条未读消息');
    });
    document.title=(n?'('+n+') ':'')+'换一圈 | 重庆移通学院校园换物';
}

function positionNoticePopup() {
    var popup=document.getElementById('notice-popup'), anchor=document.querySelector('.appbar .notice-link');
    var header=document.querySelector('.appbar');
    if(!popup)return;
    if(window.innerWidth < 900) { popup.style.removeProperty('right');popup.style.top=Math.max(64,header?.getBoundingClientRect().bottom || 0) + 12 + 'px';return; }
    if(anchor) {
        var r=anchor.getBoundingClientRect();
        if(r.width > 0 && r.height > 0) {
            popup.style.right=Math.max(12,window.innerWidth-r.right-12)+'px';
            popup.style.top=Math.max(12,(header ? header.getBoundingClientRect().bottom : r.bottom)+14)+'px';
            return;
        }
    }
    popup.style.right='24px';
    popup.style.top=Math.max(72,(header?.getBoundingClientRect().bottom || 0) + 14)+'px';
}

function showNoticePopup(count, notice) {
    if(!count || siteRoutes.current()==='#/notifications')return;
    if(document.hidden || !document.querySelector('.appbar .notice-link')) { noticeTracker.pending=count;noticeTracker.pendingNotice=notice;return; }
    noticeTracker.pending=0;closeNoticePopup();
    var popup=document.createElement('div');popup.id='notice-popup';popup.className='notice-popup';popup.setAttribute('role','status');popup.setAttribute('aria-live','polite');
    popup.innerHTML='<span class="notice-popup-icon" aria-hidden="true">'+navIcon('notice')+'</span><div class="notice-popup-content"><strong>您有 '+count+' 条未读消息</strong><span>有新动态，记得查收。</span><a href="#/notifications">查看消息 '+navIcon('arrow')+'</a></div><button type="button" class="notice-popup-close" aria-label="关闭消息提醒">'+navIcon('close')+'</button>';
    if(notice && ['#/followers','#/offers'].includes(notice.target)){
        popup.querySelector('strong').textContent=notice.title;
        popup.querySelector('.notice-popup-content > span').textContent=notice.content;
        popup.querySelector('a').href=notice.target;
    }
    document.body.appendChild(popup);positionNoticePopup();
    popup.querySelector('button').addEventListener('click',closeNoticePopup);
    popup.querySelector('a').addEventListener('click',function(){
        if(notice && ['#/followers','#/offers'].includes(notice.target)){
            api('/notification/'+Number(notice.id)+'/read',{method:'POST'}).then(refreshNoticeCount).catch(function(){});
            if (notice.target === '#/offers' && siteRoutes.current() === '#/offers') { state.offersTab = 'received'; renderOffers().catch(function(error) { toast(error.message, 'err'); }); }
        }
        closeNoticePopup();
    });
    noticeTracker.timer=setTimeout(closeNoticePopup,8000);
}

var desktopNoticeList = new Map();

function loadDesktopNoticeList(token) {
    var existing = desktopNoticeList.get(token);
    if (existing) return existing;
    var pending = api('/notification').finally(function () { desktopNoticeList.delete(token); });
    desktopNoticeList.set(token, pending);
    return pending;
}

var desktopUnreadRequest = null;

function refreshNoticeCount() {
    var token = readToken();
    if (desktopUnreadRequest && desktopUnreadRequest.token === token) return desktopUnreadRequest.pending;
    var request = {token: token};
    request.pending = fetchDesktopNoticeCount(token).finally(function () {
        if (desktopUnreadRequest === request) desktopUnreadRequest = null;
    });
    desktopUnreadRequest = request;
    return request.pending;
}

async function fetchDesktopNoticeCount(token) {
    if(token!==noticeTracker.token){noticeTracker.token=token;noticeTracker.latest=0;noticeTracker.count=0;noticeTracker.initialized=false;noticeTracker.pending=0;closeNoticePopup();}
    if(!token)return;
    var request=++noticeTracker.request;
    try {
        var response=await fetch(BASE+'/api/notification/unread',{credentials:'include',headers:{'X-Token':token}});if(!response.ok)return;
        var payload=await response.json();if(payload.code!==0)return;var n=Math.max(0,Number(payload.data.count)||0),latest=0,latestNotice=null;
        if (n) {
            try {
                var items = await loadDesktopNoticeList(token);
                (items || []).forEach(function (item) {
                    if (!item.read && Number(item.id) > latest) { latest = Number(item.id); latestNotice = item; }
                });
            } catch (ignore) { /* The unread badge remains accurate without the list. */ }
        }
        if(request!==noticeTracker.request || readToken()!==token)return;
        applyNoticeCountDom(n);
        var isNew=n>0&&(!noticeTracker.initialized||(latest>noticeTracker.latest)||(latest===0&&n>noticeTracker.count));
        noticeTracker.initialized=true;noticeTracker.count=n;noticeTracker.latest=Math.max(noticeTracker.latest,latest);
        if(!n){noticeTracker.pending=0;closeNoticePopup();}else if(isNew || noticeTracker.pending)showNoticePopup(n,latestNotice || noticeTracker.pendingNotice);
    }catch(e){ /* 提醒服务暂时不可用时保留页面状态 */ }
}

function bindNoticePopup() {
    document.addEventListener('pointerdown',function (ev) {
        if (!ev.target.closest('#notice-popup')) closeNoticePopup();
    });
    window.addEventListener('resize',positionNoticePopup);
    window.addEventListener('scroll',positionNoticePopup,{passive:true});
    document.addEventListener('visibilitychange',function(){if(!document.hidden&&noticeTracker.pending)showNoticePopup(noticeTracker.pending,noticeTracker.pendingNotice);});
}

export {
    applyNoticeCountDom,
    bindNoticePopup,
    closeNoticePopup,
    loadDesktopNoticeList,
    noticeTracker,
    refreshNoticeCount,
};
