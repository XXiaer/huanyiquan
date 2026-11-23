import { pCard } from "../../components/desktop/catalog-cards.js";
import { CAT_ICON, navIcon } from "../../components/desktop/icons.js";
import { loading, shell } from "../../components/desktop/shell.js";
import { desktopRuntime } from "../../router/desktop/state.js";
import { api } from "../../utils/desktop/api.js";
import { $, esc } from "../../utils/desktop/dom.js";
import { cashPrice, firstDisplayImage, fmtRel } from "../../utils/desktop/format.js";
import { shelfRead, shelfRemember } from "../users/saved-desktop.js";

async function renderItem(id) {
    $('#app').innerHTML = shell('home', loading());
    var d = await api('/item/' + id);
    if (desktopRuntime.currentView.name!=='item' || desktopRuntime.currentView.arg!==id) return;
    var it = d.item;
    shelfRemember('history',it);
    var imgs = String(it.images || '').split(',').map(function (url) { return url.trim(); }).filter(firstDisplayImage);
    var img = imgs[0] || '';
    var thumbRail = imgs.length ? '<div class="amz-thumbs-col">' + imgs.map(function (src, idx) {
        return '<button type="button" class="amz-thumb-btn' + (idx === 0 ? ' on' : '') + '" data-act="amz-thumb" data-src="' + esc(src) + '" aria-label="查看第 ' + (idx + 1) + ' 张图片"><img src="' + esc(window.catalogThumbnail(src)) + '" alt=""></button>';
    }).join('') + '</div>' : '';
    var hero = img ? '<div class="amz-gallery">' + thumbRail + '<div class="hero amz-hero-zoom-wrap" data-act="zoom-image" data-src="' + esc(img) + '" title="点击查看大图"><img id="amz-main-img" src="' + esc(img) + '" alt="' + esc(it.title) + '"><span class="amz-zoom-pill">' + navIcon('zoom') + ' 点击看大图</span></div></div>'
        : '<div class="hero hero-no-image" data-cat="' + esc(it.category) + '">' + (CAT_ICON[it.category] || navIcon('box')) + '<span>暂无实拍图</span></div>';

    var mode = window.campusExchange.mode(it);
    var supportsPrice = window.campusExchange.supports(it, 1) && Number(it.price) > 0;
    var supportsSwap = window.campusExchange.supports(it, 2);

    var demo = window.campusExchange.isDemoListing(it);
    var actions;
    var reportBtn = '';
    if (demo) {
        actions = '<div class="card card-pad">这是平台演示样品，仅供浏览。</div>';
    } else if (d.isMine) {
        if (it.status === 4) {
            actions = '<button class="btn btn-primary btn-block" data-act="toggle-item" data-id="'
                + it.id + '" data-status="1">重新提交审核</button>';
        } else if (it.status === 1) {
            actions = (it.allowCycle ? '<button class="btn btn-accent btn-block" data-act="cycle" data-id="' + it.id + '">给我找换法</button>' : '')
                + '<button class="btn btn-ghost btn-block" data-act="toggle-item" data-id="' + it.id + '" data-status="4">下架</button>';
        } else if (it.status===5||it.status===6) { actions = '<button class="btn btn-ghost btn-block" data-act="go" data-to="#/item/'+it.id+'/edit">编辑并重新提交</button>'; } else { actions='<div class="card card-pad">'+esc(it.statusText||'当前不可操作')+'</div>'; }
    } else if (it.status === 1) {
        var buyBtn = supportsPrice ? '<button class="btn ' + (supportsSwap ? 'btn-ghost' : 'btn-primary')
            + ' btn-block" data-act="open-cash-offer" data-id="' + it.id + '" data-price="' + Number(it.price)
            + '" data-bargain="' + (it.allowBargain ? '1' : '0') + '">' + cashPrice(it.price)
            + (it.allowBargain ? ' 出价或议价' : ' 约面交购买') + '</button>' : '';
        var swapBtn = supportsSwap ? '<button class="btn btn-primary btn-block" data-act="open-offer" data-id="' + it.id + '">发换物提案</button>' : '';
        actions = swapBtn + buyBtn + '<button class="btn btn-ghost btn-block" data-act="chat-start" data-id="' + it.id + '">私聊发布者</button>';
        reportBtn = '<button class="amz-report-link" data-act="open-report" data-type="1" data-id="' + it.id + '">' + navIcon('flag') + ' 举报该商品信息</button>';
    } else {
        actions = '<button class="btn btn-ghost btn-block" disabled>这件物品' + esc(it.statusText || '已下架') + '</button>';
    }

    var want = d.want || {};
    var saved = shelfRead('favorites').some(function(x){return x.id===id;});
    var priceText = supportsPrice
        ? ('¥' + (Number(it.price) / 100).toFixed(2))
        : (mode === 3 ? '拍卖竞价' : '以物换物');
    var origPriceVal = Number(it.originalPrice || 0);
    var origPriceHtml = supportsPrice && origPriceVal > Number(it.price)
        ? '<s class="amz-detail-orig">原价 ¥' + (origPriceVal / 100).toFixed(2) + '</s>'
        : '';
    var modeBadgeText = mode === 4 ? '可买可换' : (mode === 1 ? '明码标价' : (mode === 3 ? '拍卖竞价' : '以物换物'));
    var credit = it.ownerCredit === undefined || it.ownerCredit === null ? 80 : Number(it.ownerCredit);
    var stars = credit >= 90 ? 5 : credit >= 75 ? 4 : 3;

    var breadcrumb = '<nav class="amz-breadcrumb" aria-label="面包屑"><a href="#/home">首页</a><span>›</span><a href="#/idle">' + esc(it.category || '校园好物') + '</a><span>›</span><b>' + esc(it.title) + '</b></nav>';

    var centerCol = '<div class="item-detail-info">'
        + '<h1 class="detail-title">' + esc(it.title) + '</h1>'
        + '<div class="amz-detail-seller"><button class="link-btn" data-act="go" data-to="#/user/' + it.ownerId + '">访问 ' + esc(it.ownerNickname || '校园同学') + ' 的主页</button>'
        + '<span class="amz-stars">' + '★'.repeat(stars) + '☆'.repeat(5 - stars) + '</span>'
        + '<span class="amz-rating-num">信用分 ' + credit + '</span>'
        + '<span class="amz-view-num">' + (it.viewCount || 0) + ' 次浏览</span></div>'
        + '<hr class="amz-hr">'
        + '<div class="amz-detail-price-block"><div class="amz-price-row"><span class="amz-price-k">流转方式：</span><span class="amz-detail-price">' + esc(priceText) + '</span>' + origPriceHtml + '</div>'
        + '<p class="amz-free-ship">校内公共点位当面交接' + (it.allowBargain ? ' · 支持小刀议价' : '') + '</p>'
        + '<div class="detail-meta detail-meta-clean">'
        + '<span>' + modeBadgeText + '</span><i>·</i>'
        + '<span>' + esc(it.category) + '</span><i>·</i>'
        + '<span>' + esc(it.conditionLevel) + '</span>'
        + (demo ? '<span>仅演示</span>' : it.statusText ? '<span>' + esc(it.statusText) + '</span>' : '')
        + '</div></div>'
        + '<hr class="amz-hr">'
        + '<div class="amz-specs">'
        + '<div class="kv"><span class="k">新旧成色</span><span class="v">' + esc(it.conditionLevel || '-') + '</span></div>'
        + '<div class="kv"><span class="k">交易地点</span><span class="v">' + esc(it.place || it.ownerBuilding || '重庆移通学院') + '</span></div>'
        + '<div class="kv"><span class="k">发布时间</span><span class="v">' + fmtRel(it.createTime) + '</span></div>'
        + (supportsSwap ? '<div class="kv"><span class="k">期望交换</span><span class="v">'
        + esc(it.wantText || ((want.wantCategories || []).join('、') || want.wantCategory || '不限类别') + (want.expectDesc ? '，' + want.expectDesc : '')) + '</span></div>' : '')
        + '</div>'
        + '<hr class="amz-hr">'
        + '<div class="amz-bullets"><h3>关于此好物</h3><ul>'
        + (it.description ? '<li>' + esc(it.description) + '</li>' : '')
        + '<li>面交请约在校内公共区域，到场后先验货，再确认收货。</li>'
        + (d.tip ? '<li>' + esc(d.tip) + '</li>' : '')
        + '</ul></div>'
        + '<hr class="amz-hr">'
        + '<div class="amz-trust-strip">'
        + '<div><span>' + navIcon('shield') + '</span><b>校内公共点位交接</b></div>'
        + '<div><span>' + navIcon('truck') + '</span><b>当面验货交接</b></div>'
        + '<div><span>' + navIcon('star') + '</span><b>有问题可在交换单反馈</b></div>'
        + '</div>'
        + '</div>';

    var buyBox = '<aside class="amz-buybox">'
        + '<div class="amz-buybox-price">' + esc(priceText) + origPriceHtml + '</div>'
        + '<p class="amz-buybox-ship">校内免配送费 <strong>' + esc(it.place || it.ownerBuilding || '校园公共区域面交') + '</strong></p>'
        + '<p class="amz-buybox-stock">' + (it.status === 1 ? '在架中' : esc(it.statusText || '当前不可交易')) + '</p>'
        + '<div class="action-bar amz-buybox-actions">' + actions + '</div>'
        + '<div class="amz-buybox-meta">'
        + '<div><span>交接方式</span><b>校内公共点位面交</b></div>'
        + '<div><span>物主</span><button class="link-btn" data-act="go" data-to="#/user/' + it.ownerId + '">' + esc(it.ownerNickname || '同学') + '</button></div>'
        + '<div><span>交易保障</span><b>' + navIcon('shield') + ' 校园信用担保</b></div>'
        + '</div>'
        + '<hr class="amz-hr">'
        + '<button class="amz-list-btn" data-act="shelf-toggle" data-id="' + id + '" aria-pressed="' + saved + '">' + (saved ? '✓ 已加入收藏夹' : '加入收藏夹') + '</button>'
        + reportBtn
        + '</aside>';

    var relatedWrap = '<section class="amz-pdp-related" id="amz-pdp-related"></section>';
    $('#app').innerHTML = shell('home', breadcrumb + '<section class="item-detail amz-detail-3col"><div class="item-detail-media">' + hero + '</div>' + centerCol + buyBox + '</section>' + relatedWrap);

    try {
        var rel = await api('/item/list?page=1&size=5&category=' + encodeURIComponent(it.category || ''));
        if (desktopRuntime.currentView.name !== 'item' || desktopRuntime.currentView.arg !== id) return;
        var relItems = ((rel && rel.list) || []).filter(function (x) { return Number(x.id) !== Number(id); }).slice(0, 4);
        var box = $('#amz-pdp-related');
        if (box && relItems.length) {
            box.innerHTML = '<div class="amz-related-card"><div class="amz-related-head"><h2>同分类校园好物推荐</h2><a href="#/idle">查看更多 ›</a></div><div class="pgrid">' + relItems.map(pCard).join('') + '</div></div>';
        }
    } catch (ignore) {}
}

export { renderItem };
