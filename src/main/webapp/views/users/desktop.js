import { pCard } from "../../components/desktop/catalog-cards.js";
import { creditBadge, creditLevelOf } from "../../components/desktop/credit.js";
import { clayIcon, navIcon } from "../../components/desktop/icons.js";
import { openSheet } from "../../components/desktop/sheet.js";
import {
    emptyState,
    loading,
    markJdWorkspaceBusy,
    renderJdWorkspace,
    shell,
} from "../../components/desktop/shell.js";
import { toast } from "../../components/desktop/toast.js";
import { desktopRuntime, state } from "../../router/desktop/state.js";
import { api, readToken } from "../../utils/desktop/api.js";
import { $, esc } from "../../utils/desktop/dom.js";
import { fmtDate, thumb } from "../../utils/desktop/format.js";
import { shelfCard, shelfRead } from "./saved-desktop.js";

var THEME_DEFAULT = '#00baae';

var THEME_PALETTE = ["00baae", "e1f8f6", "006e67", "007c74", "008d84", "ddf8f5", "eefaf9", "ccebe8", "a4dcd7", "123a37", "285b57", "4f7773", "006f68", "e7f9f7", "007e76", "e3f7f5", "ceece9", "d5efec", "00a99e", "008e85", "ccf2ee", "103f3b", "397772", "007f76", "d6f5f1", "e3f8f6", "007e75", "e4f5f3", "e8f9f7", "3a746e", "e0f6f4", "00867d", "d8efed", "e2f7f5", "c7eeea", "dce9e7", "738380", "1c302e", "758783", "607b77", "eaf8f6", "00877e", "5b7772", "153d39", "173d39", "e7f8f5", "00645e", "102321", "536966", "687977", "4a5d5b", "71817f", "526663"];

function themeColor() {
    try { var value = localStorage.getItem('hq.themeColor'); return /^#[0-9a-f]{6}$/i.test(value || '') ? value.toLowerCase() : THEME_DEFAULT; }
    catch (e) { return THEME_DEFAULT; }
}

function applyTheme(value, persist) {
    if (!/^#[0-9a-f]{6}$/i.test(value || '')) return;
    value = value.toLowerCase();
    var rgb = [1,3,5].map(function (i) { return parseInt(value.slice(i,i+2),16); });
    function mix(target, amount) { return '#' + rgb.map(function (v) { return Math.round(v * (1-amount) + target * amount).toString(16).padStart(2,'0'); }).join(''); }
    var linear = rgb.map(function(v) { v /= 255; return v <= 0.04045 ? v/12.92 : Math.pow((v+0.055)/1.055,2.4); });
    var luminance = .2126*linear[0]+.7152*linear[1]+.0722*linear[2];
    var root = document.documentElement.style;
    root.setProperty('--theme-rgb', rgb.join(','));
    // Transfer each existing accent shade to the selected hue while retaining its lightness.
    function hsl(c) { var r=c[0]/255,g=c[1]/255,b=c[2]/255,max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min,l=(max+min)/2,h=0,sat=d ? d/(1-Math.abs(2*l-1)) : 0; if(d) { if(max===r)h=((g-b)/d)%6;else if(max===g)h=(b-r)/d+2;else h=(r-g)/d+4;h=(h*60+360)%360; } return [h,sat,l]; }
    function fromHsl(h,s,l) { var c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2,v=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];return '#'+v.map(function(q){return Math.round((q+m)*255).toString(16).padStart(2,'0');}).join(''); }
    var selectedHsl=hsl(rgb);
    THEME_PALETTE.forEach(function(hex) { var original=hsl([0,2,4].map(function(i){return parseInt(hex.slice(i,i+2),16);}));root.setProperty('--theme-p-'+hex,fromHsl(selectedHsl[0],original[1]*selectedHsl[1],original[2])); });
    root.setProperty('--theme-color', value);
    root.setProperty('--theme-soft', mix(255,.91));
    root.setProperty('--theme-ink', mix(0,.46));
    root.setProperty('--theme-on', luminance > .179 ? '#102321' : '#ffffff');
    if (persist) { try { localStorage.setItem('hq.themeColor', value); } catch (e) { toast('无法保存设置，请检查浏览器存储权限', 'err'); } }
    var picker = document.querySelector('#theme-color'); if (picker && picker.value !== value) picker.value = value;
    var code = document.querySelector('#theme-value'); if (code) code.textContent = value.toUpperCase();
    document.querySelectorAll('[data-theme]').forEach(function (button) { button.setAttribute('aria-pressed', String(button.dataset.theme === value)); });
}

function settingsGroup(title,links) {
    return '<section class="settings-group"><h2>'+title+'</h2><div>'+links.map(function(link){
        return '<a href="'+link[1]+'">'+link[0]+navIcon('next')+'</a>';
    }).join('')+'</div></section>';
}

function renderSettings() {
    var presets = [['青绿','#00baae'],['海蓝','#2878d4'],['紫罗兰','#7955c7'],['珊瑚','#d85b55'],['橙色','#cc7216'],['森林绿','#36865a']];
    var options = presets.map(function(p) { return '<button type="button" class="theme-swatch" data-act="theme-select" data-theme="'+p[1]+'" aria-label="'+p[0]+' '+p[1]+'" aria-pressed="'+String(themeColor()===p[1])+'"><span style="background:'+p[1]+'"></span><small>'+p[0]+'</small></button>'; }).join('');
    var account=settingsGroup('个人',[['个人资料','#/me'],['账号与安全','#/email']]);
    var trade=settingsGroup('交易',[['消息通知','#/notifications'],['我的交换','#/exchange']]);
    var local=settingsGroup('本机记录',[['收藏夹','#/favorites'],['浏览历史','#/history']]);
    var exit=readToken()?'<button class="settings-signout" type="button" data-act="logout">退出登录</button>':'';
    $('#app').innerHTML = shell('settings','<nav class="amz-breadcrumb" aria-label="面包屑"><a href="#/me">您的账户</a><span>›</span><b>账号与偏好设置</b></nav><div class="settings-page redesigned-settings amz-wide-page"><header class="redesign-heading"><h1>账号与偏好设置</h1></header><div class="amz-settings-grid">'+account+trade+local+'</div><section class="settings-card"><h2>主题颜色</h2><p>选择预设颜色，或自定义任意颜色。</p><div class="theme-options">'+options+'</div><div class="theme-custom"><div><b>自定义颜色</b><small>点击色块选择，立即生效</small></div><output id="theme-value">'+themeColor().toUpperCase()+'</output><input id="theme-color" type="color" value="'+themeColor()+'" aria-label="选择自定义主题颜色"></div><button class="theme-reset" type="button" data-act="theme-reset">恢复默认</button><p class="theme-hint">设置保存在当前浏览器，不需要登录。</p></section>'+exit+'</div>');
}

async function renderUser(id) {
    $('#app').innerHTML = shell('home', loading());

    var u, reviews, items, pending = [];
    try {
        var res = await Promise.all([
            api('/user/' + id),
            api('/review/user/' + id),
            api('/item/user/' + id)
        ]);
        u = res[0];
        reviews = res[1] || [];
        items = res[2] || [];
        try {
            pending = (await api('/review/pending')) || [];
        } catch (e) {
            pending = [];
        }
    } catch (e) {
        $('#app').innerHTML = shell('home', emptyState(navIcon('search'), '找不到这位同学',
            e.message || '主页链接可能已经失效',
            '<button class="btn btn-primary btn-sm" data-act="go" data-to="#/home">回集市</button>'));
        return;
    }

    var todo = (pending || []).filter(function (p) { return p.targetUserId === id; });
    var reviewBtn = todo.length
        ? '<button class="btn btn-primary btn-block" data-act="user-review" data-exchange="'
          + todo[0].exchangeId + '" data-id="' + id + '" data-nick="' + esc(u.nickname) + '">'
          + '评价 TA' + (todo.length > 1 ? '（还有 ' + todo.length + ' 单没评）' : '') + '</button>'
        : '';

    var lvl = u.creditLevel ? {text: u.creditLevel, cls: creditLevelOf(u.credit).cls} : creditLevelOf(u.credit);
    var rate = (u.goodRate === null || u.goodRate === undefined) ? '—' : u.goodRate + '%';
    var pct = Math.max(3, Math.min(100, u.credit || 0));

    var content = '<nav class="amz-breadcrumb" aria-label="面包屑"><a href="#/home">首页</a><span>›</span><b>' + esc(u.nickname) + ' 的主页</b></nav>'
        + '<section class="redesign-page public-profile"><header class="redesign-heading"><h1>' + esc(u.nickname) + ' 的个人主页</h1><button type="button" class="link-btn" data-act="profile-share">分享主页</button></header><div class="card card-pad">'
        + '<div class="user-row">'
        + '<div class="avatar lg">' + esc((u.nickname || '同').slice(0, 1)) + '</div>'
        + '<div class="u-main"><p class="u-name" style="font-size:19px">' + esc(u.nickname)
        + ' <span class="amz-status-txt ' + lvl.cls + '">· ' + esc(lvl.text) + '</span></p>'
        + '<p class="u-sub">重庆移通学院 | ' + esc(u.college || '未填院系')
        + ' | ' + esc(u.building || '未填宿舍楼') + '</p></div>'
        + creditBadge(u)
        + '</div>'
        + '<div class="credit-track"><div class="credit-fill" style="width:' + pct + '%"></div></div>'
        + '<div class="credit-scale"><span>0</span><span>60 受限线</span><span>100</span></div>'
        + '<div class="stats" style="margin-top:14px">'
        + '<div class="stat"><p class="k">成交</p><p class="v num">' + (u.dealCount || 0) + '<small>单</small></p></div>'
        + '<div class="stat"><p class="k">好评率</p><p class="v num">' + rate + '</p></div>'
        + '<div class="stat"><p class="k">平均分</p><p class="v num">'
        + (u.avgScore ? u.avgScore : '<span style="font-size:15px;color:var(--ink-400)">暂无</span>') + '</p></div>'
        + '<div class="stat"><p class="k">在架</p><p class="v num">' + (u.onShelfCount || 0) + '<small>件</small></p></div>'
        + '</div>'
        + (reviewBtn ? '<div style="margin-top:14px">' + reviewBtn + '</div>' : '')
        + '</div>'

        + '<div class="profile-switch" aria-label="个人主页内容"><button data-act="profile-tab" data-v="items" aria-pressed="true">宝贝 '+items.length+'</button><button data-act="profile-tab" data-v="reviews" aria-pressed="false">评价 '+reviews.length+'</button></div>'
        + '<section data-profile-panel="items"><div class="section-title"><h2>在架物品</h2>'
        + '<span class="more">' + (items || []).length + ' 件</span></div>'
        + (items.length
            ? '<div class="pgrid">' + items.map(pCard).join('') + '</div>'
            : '<div class="card card-pad"><p class="hint" style="margin:0">TA 现在没有在架的物品。</p></div>')

        + '</section><section data-profile-panel="reviews" hidden><div class="section-title"><h2>收到的评价</h2>'
        + '<span class="more">' + (u.reviewCount || 0) + ' 条</span></div>'
        + (reviews.length ? '<div class="grid">' + reviews.map(function (r) {
            return '<div class="card card-pad">'
                + '<div style="display:flex;align-items:center;gap:10px">'
                + '<div class="avatar" style="width:30px;height:30px;border-radius:10px;font-size:12px">'
                + esc((r.fromNickname || '同').slice(0, 1)) + '</div>'
                + '<div style="flex:1;min-width:0"><p style="font-size:14px;margin:0">'
                + esc(r.fromNickname || '同学') + '</p>'
                + '<p class="hint" style="margin:2px 0 0">' + fmtDate(r.createTime) + '</p></div>'
                + '<span style="color:var(--theme-ink);font-size:13px;white-space:nowrap">' + navIcon('star').repeat(r.score) + '</span></div>'
                + '<p style="font-size:13px;line-height:1.7;margin:10px 0 0;color:var(--ink-700)">'
                + esc(r.content || '没有留文字') + '</p></div>';
        }).join('') + '</div>'
            : '<div class="card card-pad"><p class="hint" style="margin:0">'
              + '还没有人评价 TA。完成一次交换后就可以互评。</p></div>');

    $('#app').innerHTML = shell(state.me?.id===id?'me':'profile', content+'</section></section>');
}

async function renderMe() {
    if (!markJdWorkspaceBusy()) $('#app').innerHTML = shell('me', loading());
    var me = await api('/user/me');
    state.me = me;
    var results = await Promise.all([
        api('/item/mine'),
        api('/review/user/' + me.id),
        api('/review/pending').catch(function () { return []; })
    ]);
    var items = results[0];
    var reviews = results[1];
    var pending = results[2] || [];
    state.pending = pending;

    var onShelf = (items || []).filter(function (i) {
        return i.status === 1;
    });
    var shown = (items || []).filter(function (it) {
        return state.meFilter === 'all' || String(it.status) === String(state.meFilter);
    });
    var itemRows = shown.map(function (it) {
        var st = it.status === 1 ? 'success' : (it.status === 2 ? 'accent' : 'ghost');
        return '<div class="card card-pad" style="display:flex;gap:12px;align-items:center">'
            + thumb(it)
            + '<div style="flex:1;min-width:0">'
            + '<p class="item-title">' + esc(it.title) + '</p>'
            + '<div class="item-foot" style="margin-top:6px"><span class="amz-status-txt ' + st + '">'
            + esc(it.statusText) + '</span><span> · '
            + (it.offerCount > 0 ? it.offerCount + ' 报价' : '暂无报价') + '</span></div>'
            + '</div>'
            + '<div style="display:flex;flex-direction:column;gap:6px">'
            + ((it.status === 4 || it.status === 5 || it.status === 6) ? '<button class="btn btn-sm btn-ghost" data-act="go" data-to="#/item/'+it.id+'/edit">编辑</button>' : '')
            + (it.status === 1
                ? '<button class="btn btn-sm btn-ghost" data-act="toggle-item" data-id="' + it.id + '" data-status="4">下架</button>'
                : ((it.status === 4 || it.status === 6)
                    ? '<button class="btn btn-sm btn-ghost" data-act="toggle-item" data-id="' + it.id + '" data-status="1">重新提交审核</button>'
                    : ''))
            + (it.status === 1 && it.allowCycle
                ? '<button class="btn btn-sm btn-primary" data-act="cycle" data-id="' + it.id + '">找环</button>' : '')
            + '</div></div>';
    }).join('');

    var reviewRows = (reviews || []).map(function (r) {
        return '<div class="list-row" style="cursor:default">'
            + '<div class="avatar" style="width:30px;height:30px;border-radius:10px;font-size:12px">'
            + esc((r.fromNickname || '同').slice(0, 1)) + '</div>'
            + '<div class="row-main"><p class="row-title" style="font-size:14px">'
            + '<button class="name-link" data-act="go" data-to="#/user/' + r.fromUser + '">'
            + esc(r.fromNickname || '同学') + '</button>'
            + ' <span style="color:var(--theme-ink)">' + navIcon('star').repeat(r.score) + '</span></p>'
            + '<p class="row-sub">' + esc(r.content || '没有留文字') + '</p></div>'
            + '<span class="hint">' + fmtDate(r.createTime) + '</span></div>';
    }).join('');

    var mainHtml = '<div class="jd-me-main">'
        + '<section class="jd-me-hero-card">'
        + '<div class="jd-me-user-box">'
        + '<div class="jd-me-user-top">'
        + '<a class="jd-me-avatar" href="#/user/' + Number(me.id) + '" aria-label="打开个人主页">'
        + '<img src="/assets/brand/mascot-wave-320.webp" alt="">'
        + '</a>'
        + '<div class="jd-me-user-meta">'
        + '<h3>' + esc(me.nickname) + (me.role === 1 ? ' · 管理员' : '') + '</h3>'
        + '<p>' + esc(me.college || '重庆移通学院') + ' ' + esc(me.building || '北山书院') + '</p>'
        + '<div class="jd-me-user-links">'
        + '<button type="button" class="link-btn" data-act="open-profile">改资料</button>'
        + '<a href="#/settings">账号安全</a>'
        + (me.role === 1 ? '<button type="button" class="link-btn" data-act="go" data-to="#/admin">管理后台</button>' : '')
        + '<button type="button" class="link-btn" data-act="logout">退出</button>'
        + '</div></div></div></div>'
        + '<div class="jd-me-assets-grid">'
        + '<div class="jd-asset-col"><b>' + me.credit + '</b><span>校园信用分</span><button type="button" class="jd-asset-act" data-act="credit-rule">信用规则</button></div>'
        + '<div class="jd-asset-col"><b>' + onShelf.length + '</b><span>在架闲置</span><a class="jd-asset-act" href="#/me/items">查看管理</a></div>'
        + '<div class="jd-asset-col"><b>' + (me.dealCount || 0) + '</b><span>累计成交</span><a class="jd-asset-act" href="#/exchange">查看履约</a></div>'
        + '<div class="jd-asset-col"><b>' + (me.reviewCount || 0) + '</b><span>收到评价</span><a class="jd-asset-act" href="#/user/' + Number(me.id) + '">个人主页</a></div>'
        + '<div class="jd-asset-col"><b>' + (me.avgScore ? me.avgScore : '5.0') + '</b><span>好评分</span>'
        + (pending.length ? '<button type="button" class="jd-asset-act accent" data-act="pending-review">' + pending.length + '单待评</button>' : '<a class="jd-asset-act" href="#/offers">报价中心</a>')
        + '</div></div>'
        + '<a class="jd-me-recycle-card" href="#/appraise">'
        + '<div class="jd-recycle-copy">'
        + '<h4>AI 智能估价</h4>'
        + '<b>去估价 ›</b>'
        + '</div>'
        + '<img src="/assets/brand/mascot-search.png" alt="小唤">'
        + '</a>'
        + '</section>'

        + '<section class="jd-me-mid-grid">'
        + '<div class="jd-me-card jd-me-orders-card">'
        + '<header class="jd-card-head"><h3>我的订单</h3><a href="#/offers">全部订单 ›</a></header>'
        + '<div class="jd-order-quick-icons">'
        + '<a href="#/offers"><i>' + clayIcon('order', '收到报价', 'is-lg') + '</i><span>收到报价</span></a>'
        + '<a href="#/exchange"><i>' + clayIcon('swap', '待面交', 'is-lg') + '</i><span>待面交</span></a>'
        + '<a href="#/me/reviews"><i>' + clayIcon('chat', '待评价', 'is-lg') + '</i><span>待评价' + (pending.length ? ' (' + pending.length + ')' : '') + '</span></a>'
        + '<a href="#/relay"><i>' + clayIcon('fire', '换物接力', 'is-lg') + '</i><span>换物接力</span></a>'
        + '<a href="#/me/auctions"><i>' + clayIcon('auction', '我的竞拍', 'is-lg') + '</i><span>我的竞拍</span></a>'
        + '</div>'
        + '<div class="jd-order-mini-preview">'
        + '<img src="/assets/brand/mascot-box.png" alt="小唤">'
        + '<div class="jd-order-mini-meta"><p>面交进度与报价流水一站管理</p><a href="#/offers">进入订单中心 ›</a></div>'
        + '</div></div>'
        + '<div class="jd-me-card jd-me-fav-card">'
        + '<div class="jd-fav-stats">'
        + '<a href="#/favorites"><b>' + shelfRead('favorites').length + '</b><span>我的收藏</span></a>'
        + '<a href="#/history"><b>' + shelfRead('history').length + '</b><span>浏览足迹</span></a>'
        + '<a href="#/me/items"><b>' + (items || []).length + '</b><span>发布记录</span></a>'
        + '</div>'
        + '<a class="jd-fav-banner" href="#/auctions">'
        + '<div><b>校园限时拍卖</b><span>1元起拍</span></div>'
        + '<em>进入 ›</em>'
        + '</a>'
        + '</div>'
        + '</section>'

        + '<section class="jd-me-service-grid">'
        + '<div class="jd-me-card jd-me-follow-card">'
        + '<header class="jd-card-head"><h3>常逛校园专区</h3><a href="#/idle">全部好物 ›</a></header>'
        + '<div class="jd-follow-tags">'
        + '<a href="#/idle?cat=教材"><img src="/assets/amz/quad-books-compact.webp" alt="考研与教材" loading="eager" onerror="this.onerror=null;this.src=\'/assets/brand/mascot-box.png\'"><span>考研与教材</span></a>'
        + '<a href="#/idle?cat=数码"><img src="/assets/amz/quad-digital-compact.webp" alt="数码与外设" loading="eager" onerror="this.onerror=null;this.src=\'/assets/brand/mascot-box.png\'"><span>数码与外设</span></a>'
        + '<a href="#/idle?cat=运动"><img src="/assets/amz/quad-sports-compact.webp" alt="球类与骑行" loading="eager" onerror="this.onerror=null;this.src=\'/assets/brand/mascot-box.png\'"><span>球类与骑行</span></a>'
        + '<a href="#/idle?cat=生活"><img src="/assets/amz/quad-dorm-compact.webp" alt="宿舍生活" loading="eager" onerror="this.onerror=null;this.src=\'/assets/brand/mascot-box.png\'"><span>宿舍生活</span></a>'
        + '</div></div>'
        + '<div class="jd-me-3posters">'
        + '<a class="jd-poster-tile tone-peach" href="#/community"><h4>逛频道社区 ›</h4><img src="/assets/amz/quad-community-compact.webp" alt="逛频道社区" loading="eager" onerror="this.onerror=null;this.src=\'/assets/brand/mascot-box.png\'"></a>'
        + '<a class="jd-poster-tile tone-blue" href="#/relay"><h4>换物接力厅 ›</h4><img src="/assets/amz/quad-relay-compact.webp" alt="换物接力厅" loading="eager" onerror="this.onerror=null;this.src=\'/assets/brand/mascot-box.png\'"></a>'
        + '<a class="jd-poster-tile tone-mint" href="#/community/game"><h4 class="amz-nowrap">Scrap Arena ›</h4><img src="/assets/brand/mascot-wave-320.webp" alt="Scrap Arena" loading="eager"></a>'
        + '</div>'
        + '</section>'

        + '<section class="jd-me-card jd-me-footprint-embed">'
        + '<header class="jd-card-head">'
        + '<div class="jd-fp-embed-title"><h3>☆ 足迹与收藏</h3></div>'
        + '<div class="jd-fp-embed-links"><a href="#/history" class="on">足迹 (' + shelfRead('history').length + ')</a><a href="#/favorites">收藏 (' + shelfRead('favorites').length + ')</a><a href="#/history">全部 ›</a></div>'
        + '</header>'
        + '<div class="jd-history-grid">'
        + (Array.from(new Map(shelfRead('history').concat(shelfRead('favorites')).map(function (it) { return [Number(it.id), it]; })).values())
            .slice(0, 4).map(function (it) { return shelfCard(it); }).join('') || '<p class="hint">浏览或收藏的商品会出现在这里。</p>')
        + '</div>'
        + '</section>'

        + '<section class="jd-me-card jd-me-shelf-section">'
        + '<div class="desk-me-bar">'
        + '<h3>我的在架与发布物品</h3>'
        + '<div class="desk-me-bar-right">'
        + '<div class="segmented">'
        + [['all', '全部'], ['1', '在架'], ['4', '已下架'], ['3', '已换出']].map(function (t) {
            return '<button class="' + (String(state.meFilter) === t[0] ? 'on' : '')
                + '" data-act="me-filter" data-v="' + t[0] + '">' + t[1] + '</button>';
        }).join('')
        + '</div>'
        + '<button class="btn btn-primary btn-sm" data-act="go" data-to="#/publish">发布闲置</button>'
        + '</div></div>'
        + (itemRows ? '<div class="desk-grid-2">' + itemRows + '</div>'
            : emptyState(navIcon('box'),
                state.meFilter === 'all' ? '还没有发布过物品' : '暂无该状态物品',
                '',
                '<button class="btn btn-primary btn-sm" data-act="go" data-to="#/publish">去发布</button>'))
        + '<div class="section-title" style="margin-top:22px"><h2>收到的同学评价</h2></div>'
        + (reviewRows ? '<div class="desk-grid-2">' + reviewRows + '</div>'
            : emptyState(clayIcon('star', '评价', 'is-lg'), '还没有评价', ''))
        + '</section>'
        + '</div>';

    renderJdWorkspace('me', 'me', mainHtml, true);
}

async function renderFollowers() {
    var users = await api('/social/followers');
    if(desktopRuntime.currentView.name!=='followers')return;
    var rows=users.map(function(u){return '<a class="notice-row" href="#/user/'+Number(u.id)+'"><span class="notice-body"><b>'+esc(u.nickname)+'</b><span>'+esc(u.college || '重庆移通学院')+'</span></span></a>';}).join('');
    $('#app').innerHTML=shell('me','<section class="redesign-page"><header class="redesign-heading"><h1>谁关注了我</h1></header><div class="notice-list">'+(rows||'<p class="hint">还没有同学关注你。</p>')+'</div></section>');
}

function openPendingSheet() {
    var pending = state.pending || [];
    if (!pending.length) {
        toast('没有待评价的交换');
        return;
    }
    var rows = pending.map(function (p) {
        return '<button class="list-row" data-act="user-review" data-exchange="' + p.exchangeId
            + '" data-id="' + p.targetUserId + '" data-nick="' + esc(p.nickname) + '">'
            + '<div class="avatar" style="width:34px;height:34px;border-radius:11px">'
            + esc((p.nickname || '同').slice(0, 1)) + '</div>'
            + '<div class="row-main"><p class="row-title">' + esc(p.nickname) + '</p>'
            + '<p class="row-sub">你给出「' + esc(p.itemTitle || '') + '」</p></div>'
            + '<span class="chev">›</span></button>';
    }).join('');
    openSheet('<h3>待你评价</h3><p class="sub">交换已经完成，给对方留个评价，也能帮别人判断。</p>' + rows);
}

function openCreditRule() {
    openSheet('<h3>信用分怎么算</h3>'
        + '<p class="sub">初始 80 分，范围 0–100。低于 60 分不能发布、不能报价、不能凑换物环。</p>'
        + '<div class="rule-list">'
        + '<div class="rule"><span>完成一次交换</span><b class="up">+2</b></div>'
        + '<div class="rule"><span>收到 5 星评价</span><b class="up">+2</b></div>'
        + '<div class="rule"><span>收到 4 星评价</span><b class="up">+1</b></div>'
        + '<div class="rule"><span>收到 3 星评价</span><b>不变</b></div>'
        + '<div class="rule"><span>收到 2 星评价</span><b class="down">−1</b></div>'
        + '<div class="rule"><span>收到 1 星评价</span><b class="down">−2</b></div>'
        + '<div class="rule"><span>超时未确认交付</span><b class="down">−3</b></div>'
        + '<div class="rule"><span>物品被认定违规</span><b class="down">−5</b></div>'
        + '</div>'
        + '<p class="hint" style="margin-top:12px">等级：优秀 ≥ 90 | 良好 ≥ 80 | 一般 ≥ 70 | 较低 ≥ 60 | 受限 &lt; 60</p>'
        + '<p class="hint" style="margin:0">评价只在交换完成后开放，一单评一次，不能改。</p>');
}

function openProfileSheet() {
    var me = state.me;
    openSheet('<h3>改资料</h3><p class="sub">宿舍楼会影响环匹配的推荐面交点。</p>'
        + '<form data-form="profile">'
        + '<div class="field"><label class="label">昵称</label>'
        + '<input class="input" name="nickname" maxlength="20" value="' + esc(me.nickname) + '"></div>'
        + '<div class="field"><label class="label">院系</label>'
        + '<input class="input" name="college" value="' + esc(me.college || '') + '"></div>'
        + '<div class="field"><label class="label">宿舍楼</label>'
        + '<input class="input" name="building" value="' + esc(me.building || '') + '"></div>'
        + '<button class="btn btn-primary btn-block" type="submit">保存</button></form>');
}

function initializeTheme() {
    applyTheme(themeColor(), false);
}

export {
    THEME_DEFAULT,
    applyTheme,
    initializeTheme,
    openCreditRule,
    openPendingSheet,
    openProfileSheet,
    renderFollowers,
    renderMe,
    renderSettings,
    renderUser,
};
