import { clayIcon, navIcon } from "./icons.js";
import { readSavedCampusSpot, state } from "../../router/desktop/state.js";
import { readToken } from "../../utils/desktop/api.js";
import { CATS } from "../../utils/desktop/catalog.js";
import { $, esc } from "../../utils/desktop/dom.js";
import {
    applyNoticeCountDom,
    noticeTracker,
    refreshNoticeCount,
} from "../../views/messages/notices-desktop.js";
import { shelfRead } from "../../views/users/saved-desktop.js";

function renderJdWorkspace(shellTab, sideKey, mainOuterHtml, preserveScroll) {
    var wrap = $('.jd-center-wrap');
    var side = wrap && wrap.querySelector('.jd-side-nav');
    var oldMain = wrap && (wrap.querySelector('.jd-order-main') || wrap.querySelector('.jd-me-main'));
    var saved = state._jdPendingScroll;
    state._jdPendingScroll = null;
    if (wrap && side && oldMain) {
        var winY = saved ? saved.winY : window.scrollY;
        var sideY = saved ? saved.sideY : side.scrollTop;
        oldMain.outerHTML = mainOuterHtml;
        var navAlias = { 'campus-auctions': 'campus-auctions', offers: 'offers', exchange: 'exchange', me: 'me' }[sideKey] || sideKey;
        side.querySelectorAll('a[href]').forEach(function (a) {
            var href = a.getAttribute('href') || '';
            var hit = (navAlias === 'me' && href === '#/me')
                || (navAlias === 'offers' && href === '#/offers')
                || (navAlias === 'exchange' && href === '#/exchange')
                || (navAlias === 'history' && href === '#/history')
                || (navAlias === 'favorites' && href === '#/favorites')
                || (href === '#/me/' + navAlias);
            a.classList.toggle('on', hit);
        });
        var topKey = shellTab === 'offers' || shellTab === 'exchange' ? 'trade' : shellTab;
        document.querySelectorAll('.topnav a').forEach(function (a) {
            var on = (a.getAttribute('href') || '') === '#/' + topKey;
            a.classList.toggle('on', on);
            if (on) a.setAttribute('aria-current', 'page');
            else a.removeAttribute('aria-current');
        });
        side.scrollTop = sideY;
        if (preserveScroll) window.scrollTo(window.scrollX, winY);
        return;
    }
    $('#app').innerHTML = shell(shellTab, '<div class="jd-center-wrap">' + jdSideNav(sideKey) + mainOuterHtml + '</div>');
}

function markJdWorkspaceBusy() {
    var wrap = $('.jd-center-wrap');
    var side = wrap && wrap.querySelector('.jd-side-nav');
    var oldMain = wrap && (wrap.querySelector('.jd-order-main') || wrap.querySelector('.jd-me-main'));
    if (oldMain) {
        if (!state._jdPendingScroll) {
            state._jdPendingScroll = { winY: window.scrollY, sideY: side ? side.scrollTop : 0 };
        }
        oldMain.setAttribute('aria-busy', 'true');
        return true;
    }
    return false;
}

function tabbar(active) {
    if(active==='home')active='market';if(active==='offers'||active==='exchange')active='trade';
    function t(key,icon,label){
        var selected=active===key;
        return '<button class="tab '+(selected?'on':'')+'"'+(selected?' aria-current="page"':'')+' data-act="go" data-to="#/'+key+'"><span class="ico">'+navIcon(icon)+(key==='notifications'?'<span class="notice-count" hidden></span>':'')+'</span><span>'+label+'</span></button>';
    }
    return '<nav class="tabbar" aria-label="主导航">'+t('market','market','首页')+t('community','community','社区')
        +'<button class="tab tab-fab'+(active==='publish'?' on':'')+'"'+(active==='publish'?' aria-current="page"':'')+' data-act="go" data-to="#/publish"><span class="fab">'+navIcon('add')+'</span><span>发布</span></button>'
        +t('notifications','notice','消息')+t('me','me','我的')+'</nav>';
}

function topnavSection(active) {
    if(active==='home')active='market';
    if(active==='idle'){
        var t = state.idleTab || 'all';
        active = t === 'auctions' ? 'auctions' : (t === 'relay' ? 'relay' : (t === 'wishes' ? 'wishes' : 'idle'));
    }
    if(active==='offers'||active==='exchange')active='trade';
    return active;
}

function topnav(active) {
    active = topnavSection(active);
    var items=[
        ['#/market','market','首页'],
        ['#/idle','idle','集市'],
        ['#/wishes','wishes','心愿单'],
        ['#/appraise','appraise','AI 估价'],
        ['#/community','community','校园社区'],
        ['#/publish','publish','发布闲置'],
        ['#/trade','trade','我的交易']
    ];
    if (state.me && state.me.role === 1) items.push(['#/admin','admin','管理后台']);
    var html = items.map(function (item) {
        var selected = active === item[1];
        return '<a href="' + item[0] + '"' + (selected ? ' class="on" aria-current="page"' : '') + '>' + item[2] + '</a>';
    }).join('');
    return '<nav class="topnav" aria-label="网站导航">'+html+'</nav>';
}

function logoMarkup() {
    return '<img class="brand-logo" src="/assets/brand/brand-mascot-logo.png" alt="" width="48" height="48">';
}

function amzFooter() {
    return '<footer class="amz-footer">'
        + '<button type="button" class="amz-back-top" data-act="scroll-top">返回顶部</button>'
        + '<div class="amz-footer-cols"><div>'
        + '<div><h3>了解换一圈</h3><a href="#/home">关于校园换物</a><a href="#/relay">换物接力原理</a><a href="#/community">校园社区公约</a></div>'
        + '<div><h3>校园服务</h3><a href="#/idle">校园闲置</a><a href="#/auctions">校园拍卖</a><a href="#/wishes">求换专区</a><a href="#/publish">发布闲置</a></div>'
        + '<div><h3>交易保障</h3><a href="#/offers">我的报价</a><a href="#/exchange">我的交换单</a><a href="#/favorites">收藏与历史</a></div>'
        + '<div><h3>账户与帮助</h3><a href="#/me">个人中心</a><a href="#/settings">账号设置</a><a href="#/notifications">消息通知</a></div>'
        + '</div></div>'
        + '<div class="amz-footer-base"><div class="amz-footer-brand"><span>换一圈</span></div><p>重庆移通学院 校园闲置流转平台</p></div>'
        + '</footer>';
}

function shell(active,content) {
    setTimeout(function(){
        if (noticeTracker.initialized) applyNoticeCountDom(noticeTracker.count);
        if (!noticeTracker.initialized || readToken() !== noticeTracker.token) refreshNoticeCount();
    },0);
    var me=state.me;
    var account=me?'<button class="avatar" data-act="go" data-to="#/me" title="'+esc(me.nickname)+'">'+esc(me.nickname.slice(0,1))+'</button>':(readToken()?'<a class="header-account" href="#/me">个人中心</a>':'<a class="header-account" href="#/login">登录 / 注册</a>');
    var popCta = me
        ? '<div class="amz-pop-top"><a class="amz-pop-btn" href="#/me">进入个人中心</a><p><b>'+esc(me.nickname)+'</b>（信用 '+me.credit+'）<button type="button" class="link-btn" data-act="logout">退出</button></p></div>'
        : '<div class="amz-pop-top"><a class="amz-pop-btn" href="#/login">立即登录</a><p>新同学？<a href="#/register">点此免费注册</a></p></div>';
    var amzAccount='<div class="amz-acct-wrap">'
        +'<a class="amz-nav-item amz-acct-trigger" href="'+(me?'#/me':'#/login')+'"><small>你好，'+(me?esc(me.nickname):'请登录')+'</small><b>账户与列表 <span class="amz-caret-sm">▾</span></b></a>'
        +'<div class="amz-acct-dropdown" role="menu"><span class="amz-pop-arrow"></span>'+popCta
        +'<div class="amz-pop-cols">'
        +'<div><h4>我的列表</h4><a href="#/favorites">我的收藏夹</a><a href="#/history">浏览足迹</a><a href="#/wishes">求换心愿单</a><a href="#/relay">三方换物接力</a><button type="button" class="amz-pop-link" data-act="estimate">AI 好物估价</button></div>'
        +'<div><h4>我的账户</h4><a href="#/me">我的主页</a><a href="#/me/items">我发布的闲置</a><a href="#/exchange">我的交换单</a><a href="#/offers">收发报价记录</a><a href="#/auction/mine">我的校园拍卖</a><a href="#/notifications">消息通知中心</a><a href="#/settings">账号与偏好设置</a></div>'
        +'</div></div></div>';
    var catOpts='<option value="">全部</option>'+CATS.map(function(c){return '<option value="'+esc(c)+'"'+(state.home.category===c?' selected':'')+'>'+esc(c)+'</option>';}).join('');
    var search='<form class="header-search amz-search" data-form="search"><select class="amz-search-cat" name="category" aria-label="选择分类">'+catOpts+'</select><input name="keyword" aria-label="搜索闲置" placeholder="搜索换一圈校园好物..." value="'+esc(state.home.keyword)+'"><button type="submit" aria-label="搜索">'+navIcon('search')+'<span>搜索</span></button></form>';
    var favCount=shelfRead('favorites').length;
    var currentSpot=state.home.campusSpot || readSavedCampusSpot() || '重庆移通学院';
    return '<a class="skip-link" href="#main-content" data-act="skip-main">跳到主要内容</a><div class="site-utility"><div><span>重庆移通学院 | 校园换物社区</span><span><a href="#/notifications">消息通知</a><a href="#/me">个人中心</a></span></div></div>'
        +'<header class="appbar"><div class="appbar-inner">'
        +'<a class="brand" href="#/market">'+logoMarkup()+'<span class="brand-word"><span class="brand-name">换一圈</span><svg class="brand-smile" viewBox="0 0 80 14" fill="none"><path d="M4 3c20 10 50 10 70 0" stroke="#f08c1a" stroke-width="2.8" stroke-linecap="round"/><path d="M68 1l7 2-4 6" stroke="#f08c1a" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span></a>'
        +'<button type="button" class="amz-deliver" data-act="open-campus-picker" title="选择校内常去面交点">'+navIcon('pin')+'<span><small>面交至</small><b id="amz-campus-label">'+esc(currentSpot)+'</b></span></button>'
        +search
        +'<div class="header-actions">'
        +amzAccount
        +'<a class="amz-nav-item amz-orders-link" href="#/exchange"><b>我的交换单</b></a>'
        +'<a class="notice-link amz-nav-item" href="#/notifications" aria-label="消息通知"><small>消息</small><b>与通知</b><span class="notice-count" hidden></span></a>'
        +'<a class="settings-link" href="#/settings" aria-label="设置" title="设置">'+navIcon('settings')+'</a>'
        +'<a class="shelf-link amz-cart" href="#/favorites" aria-label="收藏与历史" title="收藏夹"><span class="amz-cart-ico amz-fav-ico">'+navIcon('bookmark')+'<span class="amz-cart-num">'+favCount+'</span></span><b class="amz-cart-label">收藏夹</b></a>'
        +account+'</div></div>'
        +'<div class="header-nav-wrap">'+topnav(active)+'</div></header>'
        +'<main id="main-content" tabindex="-1" class="shell '  + (active==='admin'?'shell-admin ':'') + (active==='market'||active==='home'||active==='idle'?'shell-market':'')+'">'+content+'</main>'+(active==='admin'?'':amzFooter()+tabbar(active));
}

function tradeTabs(active){
    return '<nav class="amz-breadcrumb" aria-label="面包屑"><a href="#/me">您的账户</a><span>›</span><b>我的交易</b></nav>'
        + '<div class="trade-top amz-orders-head"><h1>我的交易</h1>'
        + '<nav class="trade-sections amz-tabs" aria-label="交易分类">'
        + '<a class="'+(active==='offers'?'on':'')+'" href="#/offers">报价记录</a>'
        + '<a class="'+(active==='exchange'?'on':'')+'" href="#/exchange">交换单</a>'
        + '</nav></div>';
}

function emptyState(icon, title, sub, actionHtml) {
    return '<div class="empty"><div class="ico">' + icon + '</div><p>' + esc(title) + '</p>'
        + (sub ? '<div class="sub">' + esc(sub) + '</div>' : '')
        + (actionHtml ? '<div style="margin-top:16px">' + actionHtml + '</div>' : '')
        + '</div>';
}

function loading() {
    var one = '<div class="card" style="padding:10px;display:flex;gap:12px">'
        + '<div class="skeleton" style="width:92px;height:92px"></div>'
        + '<div style="flex:1"><div class="skeleton" style="height:16px;width:60%;margin-bottom:8px"></div>'
        + '<div class="skeleton" style="height:12px;width:90%;margin-bottom:8px"></div>'
        + '<div class="skeleton" style="height:12px;width:40%"></div></div></div>';
    return '<div class="grid">' + one + one + one + '</div>';
}

function jdSideNav(activeKey) {
    return '<aside class="jd-side-nav" aria-label="个人与交易导航">'
        + '<div class="jd-nav-group"><h4>' + clayIcon('user', '我的', 'is-sm') + ' 我的换一圈</h4>'
        + '<a href="#/me" class="' + (activeKey === 'me' ? 'on' : '') + '">个人中心主页</a>'
        + '<a href="#/me/items" class="' + (activeKey === 'items' ? 'on' : '') + '">我发布的闲置</a>'
        + '</div>'
        + '<div class="jd-nav-group"><h4>' + clayIcon('order', '交易', 'is-sm') + ' 我的交易</h4>'
        + '<a href="#/offers" class="' + (activeKey === 'offers' ? 'on' : '') + '">我的提案与出价</a>'
        + '<a href="#/exchange" class="' + (activeKey === 'exchange' ? 'on' : '') + '">我的交换单</a>'
        + '<a href="#/me/auctions" class="' + (activeKey === 'auctions' ? 'on' : '') + '">我的拍卖</a>'
        + '<a href="#/me/reviews" class="' + (activeKey === 'reviews' ? 'on' : '') + '">交易评价</a>'
        + '</div>'
        + '<div class="jd-nav-group"><h4>' + clayIcon('star', '收藏', 'is-sm') + ' 足迹收藏</h4>'
        + '<a href="#/history" class="' + (activeKey === 'history' ? 'on' : '') + '">我的足迹</a>'
        + '<a href="#/favorites" class="' + (activeKey === 'favorites' ? 'on' : '') + '">商品收藏</a>'
        + '<a href="#/me/wishes" class="' + (activeKey === 'wishes' ? 'on' : '') + '">求换心愿单</a>'
        + '<a href="#/me/channels" class="' + (activeKey === 'channels' ? 'on' : '') + '">关注的频道</a>'
        + '</div>'
        + '<div class="jd-nav-group"><h4>' + clayIcon('wallet', '资产', 'is-sm') + ' 资产中心</h4>'
        + '<a href="#/me/appraise" class="' + (activeKey === 'appraise' ? 'on' : '') + '">AI 好物估价</a>'
        + '<a href="#/me/vouchers" class="' + (activeKey === 'vouchers' ? 'on' : '') + '">三方换物凭证</a>'
        + '<a href="#/me/credit" class="' + (activeKey === 'credit' ? 'on' : '') + '">校园信用分</a>'
        + '</div>'
        + '<div class="jd-nav-group"><h4>' + clayIcon('fire', '业务', 'is-sm') + ' 特色业务</h4>'
        + '<a href="#/me/campus-auctions" class="' + (activeKey === 'campus-auctions' ? 'on' : '') + '">校园拍卖</a>'
        + '<a href="#/me/relay" class="' + (activeKey === 'relay' ? 'on' : '') + '">换物接力大厅</a>'
        + '<a href="#/me/arcade" class="' + (activeKey === 'arcade' ? 'on' : '') + '">Scrap Arena 街机</a>'
        + '</div>'
        + '<div class="jd-nav-group"><h4>' + clayIcon('settings', '设置', 'is-sm') + ' 账户设置</h4>'
        + '<a href="#/me/security" class="' + (activeKey === 'security' ? 'on' : '') + '">个人信息与安全</a>'
        + '<a href="#/me/notices" class="' + (activeKey === 'notices' ? 'on' : '') + '">消息通知中心</a>'
        + '</div>'
        + '</aside>';
}

export { emptyState, loading, logoMarkup, markJdWorkspaceBusy, renderJdWorkspace, shell, topnavSection };
