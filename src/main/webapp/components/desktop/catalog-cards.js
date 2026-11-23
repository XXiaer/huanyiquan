import { CAT_ICON } from "./icons.js";
import { state } from "../../router/desktop/state.js";
import { esc } from "../../utils/desktop/dom.js";
import { firstDisplayImage, firstImage } from "../../utils/desktop/format.js";
import { shelfRead } from "../../views/users/saved-desktop.js";

function demoReferencePrice(item) {
    return Number(item && item.price) > 0 ? '¥' + (Number(item.price) / 100).toFixed(2) : '';
}

function pCard(it, index) {
    var locked = it.status && it.status !== 1, img = firstDisplayImage(it.images);
    var face = img ? '<img src="' + esc(window.catalogThumbnail(img)) + '" alt="" width="300" height="300" loading="' + (index === 0 ? 'eager' : 'lazy') + '" fetchpriority="' + (index === 0 ? 'high' : 'auto') + '" decoding="async">' : (CAT_ICON[it.category] || CAT_ICON['其他']);
    var mode = window.campusExchange.mode(it);
    var hasPrice = window.campusExchange.supports(it, 1) && Number(it.price) > 0;
    var hasSwap = window.campusExchange.supports(it, 2);
    var priceHtml;
    if (hasPrice) {
        var parts = (Number(it.price) / 100).toFixed(2).split('.');
        var orig = Number(it.originalPrice || 0);
        var origHtml = orig > Number(it.price) ? '<s class="amz-orig-price">¥' + (orig / 100).toFixed(0) + '</s>' : '';
        priceHtml = '<span class="amz-price"><em>¥</em><b>' + parts[0] + '</b><sup>.' + parts[1] + '</sup></span>' + origHtml + (mode === 4 ? '<span class="amz-dual-txt"> · 可换</span>' : '');
    } else {
        var wantHint = it.wantText || it.wantCategory;
        priceHtml = '<span class="swap-label">' + (mode === 3 && !it.isDemo ? '拍卖竞价' : (wantHint ? '想换 ' + esc(wantHint) : '以物换物')) + '</span>';
    }
    return '<button class="pcard ' + (locked ? 'locked' : '') + '" data-act="go" data-to="#/item/' + it.id + '"><div class="pimg" data-cat="' + esc(it.category) + '">' + face
        + (window.campusExchange.isDemoListing(it) ? '<span class="pbadge">仅展示</span>' : locked ? '<span class="pbadge">' + esc(it.statusText || '已换出') + '</span>' : '') + '</div>'
        + '<div class="pbody"><p class="ptitle">' + esc(it.title) + '</p>'
        + '<div class="pcard-bottom">' + priceHtml
        + '<span class="pcard-seller"><i aria-hidden="true">' + esc((it.ownerNickname || '同学').slice(0, 1)) + '</i>'
        + '<span>' + esc(it.ownerNickname || '同学') + '</span></span></div></div></button>';
}

function amzGoldItemCard(it) {
    var locked = it.status && it.status !== 1, img = firstDisplayImage(it.images);
    var face = img ? '<img src="' + esc(window.catalogThumbnail(img)) + '" alt="" width="300" height="300" loading="lazy" decoding="async">' : (CAT_ICON[it.category] || CAT_ICON['其他']);
    var mode = window.campusExchange.mode(it);
    var hasPrice = window.campusExchange.supports(it, 1) && Number(it.price) > 0;
    var orig = Number(it.originalPrice || 0);
    var favs = shelfRead('favorites');
    var isFav = favs.some(function (x) { return Number(x.id) === Number(it.id); });
    var badgeText = window.campusExchange.isDemoListing(it) ? '平台示例，仅展示' : locked ? (it.statusText || '已换出') : (mode === 4 ? '可买可换' : (mode === 2 ? '以物换物' : (orig > Number(it.price) ? Math.max(1, Math.round((Number(it.price) / orig) * 10)) + '折优惠' : '校内好物')));
    var subNote = it.allowBargain ? '支持小刀' : (it.building || it.conditionLevel || '校内当面换');
    var priceLine;
    if (hasPrice) {
        var parts = (Number(it.price) / 100).toFixed(2).split('.');
        priceLine = '<span class="amz-gb-price"><em>¥</em><b>' + parts[0] + '</b><sup>' + parts[1] + '</sup></span>'
            + (orig > Number(it.price) ? '<span class="amz-gb-orig">参考价：<s>¥' + (orig / 100).toFixed(2) + '</s></span>' : '');
    } else {
        var wantHint = it.wantText || it.wantCategory;
        priceLine = '<span class="amz-gb-swap">' + (wantHint ? '想换：' + esc(wantHint) : '以物换物') + '</span>';
    }
    var credit = it.ownerCredit === undefined || it.ownerCredit === null ? 80 : Number(it.ownerCredit);
    var stars = credit >= 90 ? 5 : (credit >= 75 ? 4 : 3);
    return '<article class="amz-gb-card' + (locked ? ' is-locked' : '') + '">'
        + '<div class="amz-gb-img" data-cat="' + esc(it.category) + '">'
        + '<a href="#/item/' + Number(it.id) + '" class="amz-gb-img-link">' + face + '</a>'
        + '<button type="button" class="amz-gb-plus' + (isFav ? ' is-fav' : '') + '" data-act="idle-quick-fav" data-id="' + Number(it.id) + '" title="' + (isFav ? '已收藏' : '加入收藏夹') + '" aria-label="收藏">' + (isFav ? '✓' : '+') + '</button>'
        + '</div>'
        + '<div class="amz-gb-badge-row"><span class="amz-gb-red-pill' + (locked ? ' is-muted' : '') + '">' + esc(badgeText) + '</span><span class="amz-gb-red-txt">' + esc(subNote) + '</span></div>'
        + '<div class="amz-gb-price-row">' + priceLine + '</div>'
        + '<a class="amz-gb-title" href="#/item/' + Number(it.id) + '" title="' + esc(it.title) + '">' + esc(it.title) + '</a>'
        + '<div class="amz-gb-rating"><span class="amz-stars">' + '★'.repeat(stars) + '☆'.repeat(5 - stars) + '</span><span>' + esc(it.conditionLevel || '九成新') + '</span></div>'
        + '</article>';
}

function amzGoldAuctionCard(a) {
    var fallbackImgs = ['/assets/amz/quad-auction-compact.webp', '/assets/amz/quad-digital-compact.webp', '/assets/amz/quad-books-compact.webp', '/assets/amz/quad-dorm-compact.webp', '/assets/amz/quad-sports-compact.webp'];
    var img = firstImage(a.image) || fallbackImgs[Math.abs(Number(a.id || 0)) % fallbackImgs.length];
    var priceVal = Number(a.state === 'settled' ? (a.selectedAmount || a.currentPrice) : a.currentPrice);
    var marketPrice = Number(a.marketPrice || 0);
    var bids = Number(a.bidCount || 0);
    var parts = priceVal.toFixed(2).split('.');
    var activeAuc = a.state === 'active';
    var labels = { active: '拍卖中', cancelled: '已撤回', pending: '待审核', rejected: '未通过', settled: '已成交', ended: bids ? '待结算' : '已流拍' };
    var disc = marketPrice > priceVal ? Math.max(1, Math.round((priceVal / marketPrice) * 10)) + '折起拍' : (labels[a.state] || '拍卖中');
    return '<article class="amz-gb-card">'
        + '<div class="amz-gb-img">'
        + '<button type="button" class="amz-gb-img-link" data-act="auction-detail" data-id="' + Number(a.id) + '"><img src="' + esc(img) + '" onerror="this.onerror=null;this.src=\'/assets/amz/quad-auction-compact.webp\'" alt="' + esc(a.title) + '" loading="lazy"></button>'
        + '<button type="button" class="amz-gb-plus" data-act="auction-detail" data-id="' + Number(a.id) + '" title="' + (activeAuc ? '立即出价' : '查看拍品') + '">+</button>'
        + '</div>'
        + '<div class="amz-gb-badge-row"><span class="amz-gb-red-pill' + (!activeAuc ? ' is-muted' : '') + '">' + esc(disc) + '</span><span class="amz-gb-red-txt">' + (activeAuc ? (bids + ' 次出价') : esc(labels[a.state] || '已结束')) + '</span></div>'
        + '<div class="amz-gb-price-row"><span class="amz-gb-price"><em>¥</em><b>' + parts[0] + '</b><sup>' + parts[1] + '</sup></span>' + (marketPrice > priceVal ? '<span class="amz-gb-orig">原价：<s>¥' + marketPrice.toFixed(2) + '</s></span>' : '') + '</div>'
        + '<button type="button" class="amz-gb-title" data-act="auction-detail" data-id="' + Number(a.id) + '" title="' + esc(a.title) + '">' + esc(a.title) + '</button>'
        + '<div class="amz-gb-rating"><span class="amz-stars">★★★★★</span><span>' + esc(a.campus || '校内面交') + '</span></div>'
        + '<button type="button" class="amz-gb-link" data-act="auction-detail" data-id="' + Number(a.id) + '">' + (activeAuc ? '立即参与竞拍' : '查看拍卖详情') + '</button>'
        + '</article>';
}

function amzGoldRelayCard(r) {
    var isSettled = r.state === 'settled';
    var actAttr = 'data-act="go" data-to="#/cycle/' + Number(r.id) + '"';
    var val = Number(r.value || 100);
    var parts = val.toFixed(2).split('.');
    return '<article class="amz-gb-card">'
        + '<div class="amz-gb-img">'
        + '<button type="button" class="amz-gb-img-link" ' + actAttr + '><img src="' + esc(r.image || '/assets/amz/quad-relay-compact.webp') + '" onerror="this.onerror=null;this.src=\'/assets/amz/quad-relay-compact.webp\'" alt="' + esc(r.title) + '" loading="lazy"></button>'
        + '<button type="button" class="amz-gb-plus" ' + actAttr + ' title="加入换物接力">+</button>'
        + '</div>'
        + '<div class="amz-gb-badge-row"><span class="amz-gb-red-pill' + (isSettled ? ' is-muted' : '') + '">' + (isSettled ? '已闭环' : '三方接力') + '</span><span class="amz-gb-red-txt">' + esc(r.stage || '可成环') + '</span></div>'
        + '<div class="amz-gb-price-row"><span class="amz-gb-price"><em>¥</em><b>' + parts[0] + '</b><sup>' + parts[1] + '</sup></span><span class="amz-gb-orig">换 · ' + esc(r.want || '校园好物') + '</span></div>'
        + '<button type="button" class="amz-gb-title" ' + actAttr + ' title="' + esc(r.title) + '">' + esc(r.title) + '</button>'
        + '<div class="amz-gb-rating"><span class="amz-stars">★★★★★</span><span>' + esc(r.campus || 'A→B→C 闭环') + '</span></div>'
        + '<button type="button" class="amz-gb-link" ' + actAttr + '>' + (r.isDemo ? (isSettled ? '查看闭环示范' : '去加入接力环') : '搜三方闭环') + '</button>'
        + '</article>';
}

function amzGoldWishCard(w) {
    var isSettled = w.state === 'settled';
    var isMine = state.me && w.userId === state.me.id;
    var fallbackImgs = ['/assets/amz/quad-wishes-compact.webp', '/assets/amz/quad-books-compact.webp', '/assets/amz/quad-digital-compact.webp', '/assets/amz/quad-dorm-compact.webp', '/assets/amz/quad-sports-compact.webp'];
    var img = w.image || fallbackImgs[Math.abs(Number(w.id || 0)) % fallbackImgs.length];
    var budget = Number(w.budget || 60);
    var parts = budget.toFixed(2).split('.');
    var actBtn = isMine
        ? '<button type="button" class="amz-gb-link" data-act="wish-close" data-id="' + w.id + '">关闭此求换</button>'
        : '<button type="button" class="amz-gb-link" data-act="wish-respond" data-id="' + w.id + '">' + (isSettled ? '查看详情' : '去响应求换') + '</button>';
    return '<article class="amz-gb-card">'
        + '<div class="amz-gb-img">'
        + '<button type="button" class="amz-gb-img-link" data-act="wish-respond" data-id="' + w.id + '"><img src="' + esc(img) + '" onerror="this.onerror=null;this.src=\'/assets/amz/quad-wishes-compact.webp\'" alt="' + esc(w.title) + '" loading="lazy"></button>'
        + '<button type="button" class="amz-gb-plus" data-act="wish-respond" data-id="' + w.id + '" title="响应求换心愿">+</button>'
        + '</div>'
        + '<div class="amz-gb-badge-row"><span class="amz-gb-red-pill' + (isSettled ? ' is-muted' : '') + '">' + (isSettled ? '已达成' : esc(w.stage || '求换心愿')) + '</span><span class="amz-gb-red-txt">' + Number(w.replyCount || 3) + ' 人响应</span></div>'
        + '<div class="amz-gb-price-row"><span class="amz-gb-price"><em>¥</em><b>' + parts[0] + '</b><sup>' + parts[1] + '</sup></span><span class="amz-gb-orig">' + esc(w.offerText || '等价互换') + '</span></div>'
        + '<button type="button" class="amz-gb-title" data-act="wish-respond" data-id="' + w.id + '" title="' + esc(w.title) + '">' + esc(w.title) + '</button>'
        + '<div class="amz-gb-rating"><span class="amz-stars">★★★★★</span><span>' + esc(w.campus || '校内面交') + '</span></div>'
        + actBtn
        + '</article>';
}

export { amzGoldAuctionCard, amzGoldItemCard, amzGoldRelayCard, amzGoldWishCard, pCard };
