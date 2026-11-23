import { loading, shell } from "../../components/desktop/shell.js";
import { go } from "../../router/desktop/navigation.js";
import { desktopRuntime, state } from "../../router/desktop/state.js";
import { api } from "../../utils/desktop/api.js";
import { $, esc } from "../../utils/desktop/dom.js";
import { firstImage } from "../../utils/desktop/format.js";
import { renderImagePreview } from "./publish-desktop.js";
import { openAuthPopup } from "../users/auth-desktop.js";

function auctionCard(a, mode) {
    var labels={active:'正在进行',cancelled:'已撤回',pending:'待审核',rejected:'审核未通过',settled:'已成交',ended:a.bidCount ? '待结算' : '已流拍'};
    var fallbackImgs=['/assets/amz/quad-auction-compact.webp','/assets/amz/quad-digital-compact.webp','/assets/amz/quad-books-compact.webp','/assets/amz/quad-dorm-compact.webp','/assets/amz/quad-sports-compact.webp'];
    var image=firstImage(a.image) || fallbackImgs[Math.abs(Number(a.id || 0)) % fallbackImgs.length];
    var priceVal = a.state==='settled' ? (a.selectedAmount || a.currentPrice) : a.currentPrice;
    var actHtml = '';
    if (mode==='admin'&&a.state==='pending') {
        actHtml = '<button class="clean-act-btn is-red" data-act="review-listing" data-kind="auctions" data-do="approve" data-id="'+a.id+'">通过</button>';
    } else if (mode==='mine'&&(a.state==='active'||a.state==='ended')&&a.bidCount&&!a.isDemo) {
        actHtml = '<button class="clean-act-btn is-red" data-act="auction-bids" data-id="'+a.id+'">结算</button>';
    } else if (mode==='public'&&a.state==='active') {
        actHtml = '<button class="clean-act-btn is-red" data-act="auction-detail" data-id="'+a.id+'">'+'出价'+'</button>';
    } else if (a.state!=='active') {
        actHtml = '<button class="clean-act-btn is-muted" data-act="auction-detail" data-id="'+a.id+'">看详情</button>';
    }
    return '<article class="ali-auction-card">'
        + '<div class="clean-card-media" style="cursor:pointer" data-act="auction-detail" data-id="'+a.id+'">'
        + '<img src="'+esc(image)+'" onerror="this.onerror=null;this.src=\'/assets/amz/quad-auction-compact.webp\'" alt="'+esc(a.title)+'" loading="lazy" decoding="async">'
        + (a.state!=='active'?'<span class="clean-state-tag is-done">'+esc(labels[a.state] || '已结束')+'</span>':'')
        + '</div>'
        + '<div class="clean-card-body">'
        + '<h2 class="clean-card-title" title="'+esc(a.title)+'">'+esc(a.title)+'</h2>'
        + '<div class="clean-card-meta-row">'
        + '<span class="amz-price"><em>¥</em><b>'+esc(priceVal)+'</b></span>'
        + actHtml
        + '</div>'
        + '</div>'
        + '</article>';
}

async function renderAuctions(mine) {
    var aucRoot = $('.ali-auction-page');
    var prevAucY = window.scrollY;
    if (aucRoot) aucRoot.setAttribute('aria-busy', 'true');
    else $('#app').innerHTML = shell('auctions', loading());
    var auctions=[];
    var loadError='';
    try {
        var res=await api(mine?'/auction/mine':'/auction', { optionalAuth: !mine });
        auctions=Array.isArray(res)?res:(res&&Array.isArray(res.list)?res.list:[]);
    } catch (e) {
        if (mine && e && e.code === 401) {
            if (!openAuthPopup('login', '#/auction/mine')) {
                sessionStorage.setItem('hq.returnTo', '#/auction/mine');
                go('#/login');
            }
            return;
        }
        loadError=(e && e.message) || '';
    }
    var rawList = auctions;
    var aCat = state.auctionCat || '全部';
    var aSt = state.auctionState || '全部';
    var aSort = state.auctionSort || 'default';
    var displayList = rawList.filter(function (a) {
        if (aCat !== '全部') {
            var hitCat = a.cat === aCat || String(a.title + ' ' + (a.description || '')).indexOf(aCat) >= 0;
            if (!hitCat) return false;
        }
        if (aSt === '正在进行' && a.state !== 'active') return false;
        if (aSt === '一拍专场' && a.stage !== '一拍') return false;
        if (aSt === '毕业变卖' && a.stage !== '变卖' && String(a.title).indexOf('毕业') < 0) return false;
        return true;
    }).slice();
    if (aSort === 'price-asc') displayList.sort(function (a, b) { return Number(a.currentPrice || 0) - Number(b.currentPrice || 0); });
    else if (aSort === 'price-desc') displayList.sort(function (a, b) { return Number(b.currentPrice || 0) - Number(a.currentPrice || 0); });
    else if (aSort === 'bids') displayList.sort(function (a, b) { return Number(b.bidCount || 0) - Number(a.bidCount || 0); });

    var resultsInnerHtml = (loadError && mine ? '<div class="card card-pad"><p>' + esc(loadError) + '</p></div>' : '')
        + (displayList.length
            ? '<div class="ali-auction-grid">' + displayList.map(function (a) { return auctionCard(a, mine ? 'mine' : 'public'); }).join('') + '</div>'
            : '<div class="card card-pad"><p>暂无符合筛选条件的拍品 <button type="button" class="btn btn-sm btn-primary" data-act="auction-reset">重置筛选</button></p></div>');

    var nextAucRoot = $('.ali-auction-page');
    if (nextAucRoot && nextAucRoot.dataset.mine === String(!!mine) && nextAucRoot.querySelector('.ali-auction-results')) {
        nextAucRoot.removeAttribute('aria-busy');
        nextAucRoot.querySelectorAll('[data-act="auction-cat"]').forEach(function (btn) {
            btn.classList.toggle('on', btn.dataset.v === aCat);
        });
        nextAucRoot.querySelectorAll('[data-act="auction-state"]').forEach(function (btn) {
            btn.classList.toggle('on', btn.dataset.v === aSt);
        });
        nextAucRoot.querySelectorAll('[data-act="auction-sort"]').forEach(function (btn) {
            var dv = btn.dataset.v || '';
            if (dv === 'default') btn.classList.toggle('on', aSort === 'default');
            else if (dv === 'bids') btn.classList.toggle('on', aSort === 'bids');
            else {
                btn.classList.toggle('on', aSort === 'price-asc' || aSort === 'price-desc');
                btn.dataset.v = aSort === 'price-desc' ? 'price-asc' : 'price-desc';
                btn.textContent = '当前价 ' + (aSort === 'price-asc' ? '▴' : '▾');
            }
        });
        var cntHint = nextAucRoot.querySelector('.ali-sort-toolbar .hint');
        if (cntHint) cntHint.textContent = '当前展示 ' + displayList.length + ' 件拍品';
        nextAucRoot.querySelector('.ali-auction-results').innerHTML = resultsInnerHtml;
        window.scrollTo(window.scrollX, prevAucY);
    } else {
        var content = '<div class="ali-auction-page" data-mine="' + (!!mine) + '">'
            + '<header class="ali-sub-header">'
            + '<div class="ali-sub-brand">'
            + '<span class="ali-brand-main">校园拍卖专场</span>'
            + '</div>'
            + '<nav class="ali-sub-nav" aria-label="拍卖导航">'
            + '<a href="#/auctions" class="' + (!mine ? 'on' : '') + '">全部拍品</a>'
            + '<button type="button" data-act="auction-cat" data-v="数码" class="' + (aCat === '数码' ? 'on' : '') + '">数码外设</button>'
            + '<button type="button" data-act="auction-cat" data-v="教材" class="' + (aCat === '教材' ? 'on' : '') + '">考研教材</button>'
            + '<a href="#/auction/mine" class="' + (mine ? 'on' : '') + '">我的拍卖</a>'
            + '</nav>'
            + '<div class="ali-sub-actions">'
            + '<a class="btn btn-ghost btn-sm" href="' + (mine ? '#/auctions' : '#/auction/mine') + '">' + (mine ? '返回大厅' : '我的拍卖') + '</a>'
            + '<a class="btn btn-primary btn-sm" href="#/auction/new">+ 发起拍卖</a>'
            + '</div>'
            + '</header>'

            + '<section class="ali-filter-box" aria-label="拍品筛选">'
            + '<div class="ali-filter-row"><span class="ali-filter-k">分类：</span><div class="ali-filter-v">'
            + [['全部', '全部'], ['数码', '电脑数码'], ['教材', '考研教材'], ['生活', '宿舍生活'], ['运动', '运动户外'], ['其他', '手办周边']].map(function (c) {
                return '<button type="button" class="' + (aCat === c[0] ? 'on' : '') + '" data-act="auction-cat" data-v="' + c[0] + '">' + c[1] + '</button>';
            }).join('')
            + '</div></div>'
            + '<div class="ali-filter-row"><span class="ali-filter-k">状态：</span><div class="ali-filter-v">'
            + [['全部', '全部 (' + rawList.length + ')'], ['正在进行', '正在进行'], ['一拍专场', '一拍专场'], ['毕业变卖', '毕业变卖']].map(function (s) {
                return '<button type="button" class="' + (aSt === s[0] ? 'on' : '') + '" data-act="auction-state" data-v="' + s[0] + '">' + s[1] + '</button>';
            }).join('')
            + '</div></div>'
            + '</section>'

            + '<div class="ali-sort-toolbar">'
            + '<div class="ali-sort-links">'
            + '<button type="button" class="' + (aSort === 'default' ? 'on' : '') + '" data-act="auction-sort" data-v="default">默认排序</button>'
            + '<button type="button" class="' + (aSort === 'price-asc' || aSort === 'price-desc' ? 'on' : '') + '" data-act="auction-sort" data-v="' + (aSort === 'price-desc' ? 'price-asc' : 'price-desc') + '">当前价 ' + (aSort === 'price-asc' ? '▴' : '▾') + '</button>'
            + '<button type="button" class="' + (aSort === 'bids' ? 'on' : '') + '" data-act="auction-sort" data-v="bids">出价次数 ▾</button>'
            + '<img src="/assets/brand/mascot-success.png" alt="小唤" class="ali-toolbar-mascot">'
            + '</div>'
            + '<span class="hint">当前展示 ' + displayList.length + ' 件拍品</span>'
            + '</div>'

            + '<div class="ali-auction-results">' + resultsInnerHtml + '</div>'
            + '</div>';
        $('#app').innerHTML = shell('auctions', content);
    }
}

function fmtAuctionEnd(raw) {
    var date = new Date(raw);
    if (!raw || isNaN(date.getTime())) return '待审核通过';
    var today = new Date();
    var tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    var clock = new Intl.DateTimeFormat('zh-CN', {hour:'2-digit', minute:'2-digit', hour12:false}).format(date);
    if (date.toDateString() === today.toDateString()) return '今天 ' + clock;
    if (date.toDateString() === tomorrow.toDateString()) return '明天 ' + clock;
    return date.getFullYear() + '年' + (date.getMonth() + 1) + '月' + date.getDate() + '日 ' + clock;
}

async function renderAuctionDetail(id) {
    if (!$('.hq-auction-detail[data-id="' + id + '"]')) $('#app').innerHTML = shell('auctions', loading());
    var a = await api('/auction/' + id, {optionalAuth:true, noCache:true});
    if (desktopRuntime.currentView.name !== 'auctionDetail' || desktopRuntime.currentView.arg !== id) return;
    var mine = state.me && Number(state.me.id) === Number(a.sellerId);
    var bidCount = Number(a.bidCount || 0);
    var current = Number(a.selectedAmount || a.currentPrice || a.startPrice || 0);
    var minimum = window.campusExchange.minBid(current, bidCount);
    var priceLabel = a.state === 'settled' ? '成交价' : (bidCount ? '当前价' : '起拍价');
    var labels = {active:'正在竞拍', pending:'待审核', rejected:'审核未通过', cancelled:'已撤回', settled:'已成交', ended:bidCount?'待结算':'已流拍'};
    var img = firstImage(a.image);
    var action = a.state === 'active' && !mine
        ? '<form data-form="auction-bid"><input type="hidden" name="id" value="' + id + '">'
            + '<label class="label" for="modal-bid-amt">出价金额（元）</label>'
            + '<div class="btn-row"><input class="input" id="modal-bid-amt" name="amount" type="number" min="' + minimum
            + '" step="0.01" value="' + minimum + '" required><button class="btn btn-primary" type="submit">确认出价</button></div>'
            + '<p class="hint">最低 ¥' + minimum + '。出价成功后请留意站内通知，成交后校内面交。</p></form>'
        : (mine && bidCount && ['active','ended'].includes(a.state)
            ? '<button type="button" class="btn btn-primary" data-act="auction-bids" data-id="' + id + '">查看出价并结算</button>'
            : '');
    var html = '<nav class="amz-breadcrumb" aria-label="面包屑"><a href="#/auctions">校园拍卖</a><span>›</span><b>拍品详情</b></nav>'
        + '<article class="hq-auction-detail card card-pad" data-id="' + id + '">'
        + (img ? '<img class="hq-auction-cover" src="' + esc(img) + '" alt="拍品图片">' : '<div class="hq-auction-cover">暂无实拍图</div>')
        + '<div><span class="tag ' + (a.state === 'active' ? 'brand' : 'ghost') + '">' + esc(labels[a.state] || '拍卖已结束') + '</span>'
        + '<h1>' + esc(a.title) + '</h1><p>' + esc(a.description || '') + '</p>'
        + '<p class="hint">发布者 ' + esc(a.seller || '同学') + ' | 截止 ' + esc(fmtAuctionEnd(a.endsAt)) + '</p>'
        + '<p>' + priceLabel + ' <b class="amz-price">¥' + current.toFixed(2) + '</b> | ' + bidCount + ' 次出价</p>'
        + action + '<button type="button" class="btn btn-ghost btn-sm" data-act="copy-auction-link">复制拍品链接</button></div></article>';
    var main = $('#main-content');
    if ($('.hq-auction-detail') && main) main.innerHTML = html;
    else $('#app').innerHTML = shell('auctions', html);
}

function renderAuctionNew() {
    state.publishImages=[];
    $('#app').innerHTML=shell('auctions','<nav class="amz-breadcrumb" aria-label="面包屑"><a href="#/home">首页</a><span>›</span><a href="#/auctions">校园拍卖</a><span>›</span><b>发起拍卖</b></nav><div class="auction-form amz-form-layout"><div class="page-head"><h1>发起校园拍卖</h1><p>提交后由管理员审核，约 1 分钟未处理将自动极速通过，通过后开始计时。</p></div><div class="amz-form-grid"><form class="card card-pad" data-form="auction-new"><div class="field"><label class="label">拍品名称</label><input class="input" name="title" maxlength="80" placeholder="例如 九成新机械键盘 / 拍立得相机" required></div><div class="field"><label class="label">拍品描述</label><textarea class="textarea" name="description" maxlength="500" placeholder="说明成色、配件、校内面交地点等"></textarea></div><div class="field"><label class="label">图片（必填，最多 3 张）</label><div class="chips" id="img-preview"></div></div><div class="field"><label class="label">起拍价（元）</label><input class="input" name="amount" type="number" min="0.01" max="1000000" step="0.01" required></div><div class="field"><label class="label">拍卖时长（小时，1–168）</label><input class="input" name="hours" type="number" value="24" min="1" max="168" required></div><button class="btn btn-primary btn-block" type="submit">提交审核并上架</button></form><aside class="card card-pad amz-form-aside"><img src="/assets/brand/mascot-box.png" width="76" height="76" alt=""><h3>拍卖上架须知</h3><ul><li>首张图片将作为拍卖专场封面展示。</li><li>提交后 1 分钟内未审核将自动通过上架。</li><li>竞拍结束后请在「我的拍卖」中确认结算。</li></ul></aside></div></div>');
    renderImagePreview();
}

export { auctionCard, fmtAuctionEnd, renderAuctionDetail, renderAuctionNew, renderAuctions };
