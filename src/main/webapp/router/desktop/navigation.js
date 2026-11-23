import { routes } from "./routes.js";
import { shell } from "../../components/desktop/shell.js";
import { toast } from "../../components/desktop/toast.js";
import { desktopRuntime, state } from "./state.js";
import { ApiError, api, readToken } from "../../utils/desktop/api.js";
import { $, esc } from "../../utils/desktop/dom.js";
import { renderAdmin } from "../../views/admin/desktop.js";
import { renderCommunity, renderCommunityGame } from "../../views/community/desktop.js";
import { renderLanding } from "../../views/home/landing-desktop.js";
import { renderAppraise } from "../../views/market/appraise-desktop.js";
import {
    renderAuctionDetail,
    renderAuctionNew,
    renderAuctions,
} from "../../views/market/auction-desktop.js";
import {
    ensureIdleTabData,
    loadHome,
    moreItemsObserver,
    renderHome,
    renderSearchPage,
} from "../../views/market/desktop.js";
import { renderItem } from "../../views/market/item-desktop.js";
import {
    renderItemEdit,
    renderPublish,
    renderPublishEntry,
} from "../../views/market/publish-desktop.js";
import { renderWishCreate, renderWishes } from "../../views/market/wishes-desktop.js";
import { imSwipe, renderNotifications } from "../../views/messages/desktop.js";
import {
    closeNoticePopup,
    noticeTracker,
    refreshNoticeCount,
} from "../../views/messages/notices-desktop.js";
import { renderRoom } from "../../views/messages/room-desktop.js";
import { renderExchangeDetail, renderExchanges } from "../../views/orders/desktop.js";
import { renderOffers } from "../../views/orders/offers-desktop.js";
import { renderCycle, renderRelay } from "../../views/orders/relay-desktop.js";
import { renderMeSub } from "../../views/users/account-desktop.js";
import { renderEmail, renderLogin } from "../../views/users/auth-desktop.js";
import { renderFollowers, renderMe, renderSettings, renderUser } from "../../views/users/desktop.js";
import { renderShelf } from "../../views/users/saved-desktop.js";

function go(hash) {
    if (siteRoutes.current() === hash) {
        render();
    } else {
        siteRoutes.go(hash);
    }
}

function parseRoute() {
    var hash = siteRoutes.current() || '#/home';
    var qIdx = hash.indexOf('?');
    var base = qIdx >= 0 ? hash.slice(0, qIdx) : hash;
    var prevHash = state._lastHash || '';
    if (hash !== prevHash) {
        state._lastHash = hash;
        var qs = qIdx >= 0 ? new URLSearchParams(hash.slice(qIdx + 1)) : null;
        if (['#/home', '#/market'].includes(base) && !qs && !['#/home', '#/market'].includes(prevHash)) {
            Object.assign(state.home, {category: '', condition: '', tradeMode: 0, sort: '', minCredit: 0, maxPrice: 2000});
        }
        if (qs && qs.has('cat')) {
            state.home.category = qs.get('cat') || '';
            state.home.minCredit = 0;
        } else if (base === '#/idle' && prevHash.indexOf('cat=') >= 0) {
            state.home.category = '';
        }
        if (qs && qs.has('tab')) {
            state.idleTab = qs.get('tab') || 'all';
        } else if (['#/idle', '#/search', '#/home', '#/market'].includes(base)) {
            state.idleTab = 'all';
        }
        if (base === '#/search' && qs && qs.has('q')) state.home.keyword = qs.get('q').trim();
        if (base === '#/community') {
            state.commRoom = qs?.get('room') || 'hall';
            state.commTab = qs?.get('section') === 'chat' ? 'chat' : 'posts';
        }
    }
    for (var i = 0; i < routes.length; i++) {
        var m = hash.match(routes[i][0]);
        if (m) {
            var vName = routes[i][1](m);
            var arg = vName === 'meSub' ? (m[1] || 'notices') : (m[1] ? Number(m[1]) : null);
            return {name: vName, arg: arg};
        }
    }
    return {name: 'home', arg: null};
}

async function render() {
    if (moreItemsObserver) moreItemsObserver.disconnect();
    if (desktopRuntime.communityTimer) { clearInterval(desktopRuntime.communityTimer); desktopRuntime.communityTimer = null; }
    if (desktopRuntime.roomTimer) { clearInterval(desktopRuntime.roomTimer); desktopRuntime.roomTimer = null; }
    if (desktopRuntime.imPollTimer) { clearInterval(desktopRuntime.imPollTimer); desktopRuntime.imPollTimer = null; }
    var view = parseRoute();
    desktopRuntime.currentView = view;

    if (view.name === 'cityWheel') {
        $('#app').innerHTML = shell('community', '<main id="city-wheel-page"></main>');
        window.renderCityWheelPage($('#city-wheel-page'));
        return;
    }
    if (view.name === 'shelf') { renderShelf();return; }
    if (view.name === 'appraise') { renderAppraise(); return; }
    if (view.name === 'landing') { renderLanding(); return; }
    if (view.name === 'login' || view.name === 'register') {
        renderLogin(view.name === 'register' ? 'register' : (state.loginMode || 'login'));
        return;
    }
    if (!state.me && view.name !== 'home' && view.name !== 'relay' && view.name !== 'settings' && view.name !== 'auctions' && view.name !== 'auctionDetail' && view.name !== 'item' && view.name !== 'user' && view.name !== 'community' && view.name !== 'wishes') {
        try {
            state.me = await api('/user/me');
        } catch (e) {
            if (!(e instanceof ApiError) || e.code !== 401) {
                $('#app').innerHTML = '<div class="auth-wrap"><div class="auth-card">'
                    + '<h1>连不上后端</h1><p class="lead">' + esc(e.message || '') + '</p>'
                    + '<p class="hint">确认后端已在 8080 端口启动。命令：<br><code>mvn exec:java</code></p>'
                    + '</div></div>';
            }
            return;
        }
    } else if (!state.me && readToken()) {
        try { state.me = await api('/user/me', {optionalAuth: true}); } catch (e) {}
    }

    try {
        if (view.name === 'email') { await renderEmail(); } else if (view.name === 'settings') {
            renderSettings();
        } else if (view.name === 'home') {
            var browseRoute = siteRoutes.current();
            if ((siteRoutes.current() || '').split('?')[0] === '#/search' && !state.home.keyword) { renderSearchPage(''); }
            else {
                await ensureIdleTabData(state.idleTab || 'all');
                if (siteRoutes.current() === browseRoute && await loadHome(true) && siteRoutes.current() === browseRoute) renderHome();
            }
        } else if (view.name === 'auctions' || view.name === 'relay' || view.name === 'wishes') {
            if (window.innerWidth >= 900) {
                var targetIdleTab = view.name;
                state.idleTab = targetIdleTab;
                desktopRuntime.currentView = { name: 'home', arg: null };
                var channelRoute = siteRoutes.current();
                await ensureIdleTabData(targetIdleTab);
                if (siteRoutes.current() === channelRoute) renderHome();
            } else {
                if (view.name === 'auctions') await renderAuctions();
                else if (view.name === 'relay') await renderRelay();
                else await renderWishes();
            }
        } else if (view.name === 'auctionMine') {
            await renderAuctions(true);
        } else if (view.name === 'followers') {
            await renderFollowers();
        } else if (view.name === 'notifications') {
            await renderNotifications();
        } else if (view.name === 'chats') { await renderNotifications();
        } else if (view.name === 'chat') { await renderNotifications(view.arg);
        } else if (view.name === 'ringChat') { await renderRoom(view.arg,true);
        } else if (view.name === 'community') {
            await renderCommunity();
        } else if (view.name === 'communityGame') {
            renderCommunityGame();
        } else if (view.name === 'auctionDetail') {
            await renderAuctionDetail(view.arg);
        } else if (view.name === 'auctionNew') {
            renderAuctionNew();
        } else if (view.name === 'item') {
            await renderItem(view.arg);
        } else if (view.name === 'itemEdit') {
            await renderItemEdit(view.arg);
        } else if (view.name === 'publishSuccess') {
            $('#app').innerHTML=shell('publish','<section class="redesign-page publish-success"><img src="/assets/brand/mascot-success.png" width="144" height="144" alt=""><h1>已提交审核</h1><p>通过后会出现在集市。</p><div class="btn-row"><a class="btn btn-primary" href="#/publish/edit">再发一件</a><a class="btn btn-ghost" href="#/me/items">查看审核进度</a></div></section>');
        } else if (view.name === 'publishEntry') {
            renderPublishEntry();
        } else if (view.name === 'wishCreate') {
            await renderWishCreate();
        } else if (view.name === 'publish') {
            renderPublish();
        } else if (view.name === 'offers') {
            await renderOffers();
        } else if (view.name === 'relay') {
            await renderRelay();
        } else if (view.name === 'cycle') {
            await renderCycle(view.arg);
        } else if (view.name === 'exchange') {
            await renderExchanges();
        } else if (view.name === 'exchangeDetail') {
            await renderExchangeDetail(view.arg);
        } else if (view.name === 'user') {
            await renderUser(view.arg);
        } else if (view.name === 'meSub') {
            await renderMeSub(view.arg);
        } else if (view.name === 'me') {
            await renderMe();
        } else if (view.name === 'admin') {
            if (!state.me || state.me.role !== 1) {
                toast('只有管理员能进后台', 'err');
                go('#/me');
                return;
            }
            await renderAdmin();
        }
    } catch (e) {
        if (e && e.code === 401) return;
        $('#app').innerHTML = shell('home', '<div class="page-head"><h1>出了点问题</h1><p>'
            + esc(e.message || '未知错误') + '</p></div>'
            + '<button class="btn btn-ghost" data-act="go" data-to="#/home">回集市</button>');
    }
    setupDesktopLivePoll(view);
}

var desktopLiveTimer = null;

function setupDesktopLivePoll(view) {
    if (desktopLiveTimer) { clearInterval(desktopLiveTimer); desktopLiveTimer = null; }
    var liveNames = ['notifications', 'meSub', 'admin', 'me'];
    if (!view || liveNames.indexOf(view.name) < 0) return;
    if (view.name === 'meSub' && ['auctions', 'reviews'].includes(view.arg)) return;
    desktopLiveTimer = setInterval(function () {
        if (document.hidden || imSwipe || $('.tb-conv-entry.is-open')) return;
        var modal = document.getElementById('modal');
        if (modal && modal.innerHTML.trim()) return;
        var ae = document.activeElement;
        if (ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)) return;
        if (desktopRuntime.currentView && desktopRuntime.currentView.name === view.name && desktopRuntime.currentView.arg === view.arg) {
            render();
        }
    }, 6000);
}

function startDesktopRouter() {
    window.addEventListener('hashchange', function () {
        if (siteRoutes.canonicalize()) return;
        if (siteRoutes.current() === '#/notifications') { noticeTracker.pending = 0; closeNoticePopup(); }
        var prevViewName = desktopRuntime.currentView ? desktopRuntime.currentView.name : '';
        var nextView = parseRoute();
        var meGroup = ['me', 'meSub', 'offers', 'exchange', 'shelf'];
        var imGroup = ['notifications', 'chat', 'chats'];
        var staySameSection = (meGroup.indexOf(prevViewName) >= 0 && meGroup.indexOf(nextView.name) >= 0)
            || (imGroup.indexOf(prevViewName) >= 0 && imGroup.indexOf(nextView.name) >= 0)
            || (prevViewName === nextView.name && nextView.name !== 'item' && nextView.name !== 'user' && nextView.name !== 'exchangeDetail');
        if (!staySameSection) window.scrollTo(0, 0);
        render();
    });
    setInterval(refreshNoticeCount,15000);
    (async function boot() {
        if (!siteRoutes.current()) { $('#app').textContent = '找不到此页面'; return; }
        await render();
    })();
}

export { go, parseRoute, render, startDesktopRouter };
