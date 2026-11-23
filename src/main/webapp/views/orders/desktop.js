import { clayIcon, navIcon } from "../../components/desktop/icons.js";
import { openSheet } from "../../components/desktop/sheet.js";
import {
    loading,
    markJdWorkspaceBusy,
    renderJdWorkspace,
    shell,
} from "../../components/desktop/shell.js";
import { desktopRuntime, state } from "../../router/desktop/state.js";
import { api } from "../../utils/desktop/api.js";
import { CAMPUS_SPOTS } from "../../utils/desktop/catalog.js";
import { $, esc } from "../../utils/desktop/dom.js";
import { cashPrice, fmtDate, thumb } from "../../utils/desktop/format.js";
import { fmtAuctionEnd } from "../market/auction-desktop.js";

var OFFER_STATUS = {
    0: ['待响应', 'accent'],
    1: ['已接受', 'success'],
    2: ['已拒绝', ''],
    3: ['已失效', ''],
    4: ['已撤回', ''],
    5: ['已还价', 'brand']
};

function stepsHtml(exchange) {
    var status = exchange.status;
    var firstStep = window.exchangeNeedsConfirmation(exchange) ? 1 : 2;
    var labels = ['待确认', '待交付', '已完成'];
    if (status >= 4) {
        return '<div class="steps"><div class="step" style="flex:1">'
            + '<span style="color:var(--danger-600);font-weight:600">'
            + (status === 4 ? '已失效' : '已超时关闭') + '</span></div></div>';
    }
    var html = '<div class="steps" aria-label="交换进度">';
    for (var step = firstStep; step <= labels.length; step++) {
        var cls = step < status ? 'done' : (step === status ? 'now' : '');
        html += '<div class="step ' + cls + '"' + (step === status ? ' aria-current="step"' : '') + '>' + labels[step - 1] + '</div>';
    }
    return html + '</div>';
}

async function renderExchanges() {
    if (!markJdWorkspaceBusy()) $('#app').innerHTML = shell('exchange', loading());
    var list = await api('/exchange/mine', {noCache:true});
    var q = String(state.offersQuery || '').trim().toLowerCase();
    var filtered = (list || []).filter(function (e) {
        if (!q) return true;
        return [e.id, e.place, e.statusText].join(' ').toLowerCase().indexOf(q) >= 0;
    });
    var rows = filtered.map(function (e) {
        var st = e.status === 3 ? 'success' : (e.status >= 4 ? 'ghost' : (e.status === 2 ? 'accent' : 'brand'));
        return '<article class="jd-order-item">'
            + '<header class="jd-item-head">'
            + '<span class="jd-item-time">校内实名担保交易</span>'
            + '<span class="jd-item-no">交换单号：<b>#EX' + (200000 + Number(e.id || 0)) + '</b></span>'
            + '<a href="#/notifications" class="jd-item-shop">' + (e.type === 3 ? '三方换物接力成环' : '一对一当面交换') + ' <i class="jd-chat-dot">' + clayIcon('chat', '联系同学', 'is-sm') + '</i></a>'
            + '<span class="jd-item-credit">面交点位：' + esc(e.place || '待双方约定') + '</span>'
            + '</header>'
            + '<div class="jd-item-row">'
            + '<div class="jd-col-goods">'
            + '<div class="jd-goods-thumb"><img src="/assets/amz/quad-relay-compact.webp" alt=""></div>'
            + '<div class="jd-goods-info">'
            + stepsHtml(e)
            + '<p class="jd-goods-note">' + (window.exchangeNeedsConfirmation(e) ? '已确认 ' + (e.confirmedCount || 0) + '/' + (e.needConfirm || 2) + ' ' : '')
            + '已交付 ' + (e.deliveredCount || 0) + '/' + (e.needConfirm || 2) + '</p>'
            + '</div>'
            + '<span class="jd-goods-qty">x1</span>'
            + '<div class="jd-goods-repair"><a href="#/exchange/' + e.id + '">进度追踪</a></div>'
            + '</div>'
            + '<div class="jd-col-buyer"><span class="jd-buyer-name">校内同学</span></div>'
            + '<div class="jd-col-amount"><b>当面交接</b><small>' + (e.type === 3 ? '三方接力' : '双人互换') + '</small></div>'
            + '<div class="jd-col-status"><span class="amz-status-txt ' + st + '">' + esc(e.statusText) + '</span><a href="#/exchange/' + e.id + '">订单详情</a></div>'
            + '<div class="jd-col-ops"><button class="jd-btn-rebuy" data-act="go" data-to="#/exchange/' + e.id + '">查看详情与操作</button></div>'
            + '</div></article>';
    }).join('');

    var mainHtml = '<div class="jd-order-main">'
        + '<div class="jd-order-title-bar"><h2>我的交换单</h2>' + '<button type="button" class="btn btn-ghost btn-sm" data-act="trade-refresh">刷新状态</button>' + (q ? '<span>筛选：“' + esc(q) + '”</span>' : '') + '</div>'
        + '<div class="jd-order-panel">'
        + '<div class="jd-order-tabs-row">'
        + '<div class="jd-order-tabs">'
        + '<a href="#/offers">收到的报价</a>'
        + '<a href="#/exchange" class="on">我的交换单</a>'
        + '<a href="#/relay">三方换物接力</a>'
        + '<a href="#/me/reviews">待评价</a>'
        + '</div>'
        + '<form class="jd-order-search" data-form="orders-search">'
        + '<input name="q" type="search" value="' + esc(state.offersQuery || '') + '" placeholder="商品名称/交换单号/面交点位" aria-label="交换单搜索">'
        + '<button type="submit">搜索</button>'
        + '</form>'
        + '</div>'
        + '<div class="jd-table-head">'
        + '<span class="col-goods">交换单详情</span>'
        + '<span class="col-buyer">交易伙伴</span>'
        + '<span class="col-amount">交易模式</span>'
        + '<span class="col-status">全部状态 ▾</span>'
        + '<span class="col-ops">操作</span>'
        + '</div>'
        + (rows ? '<div class="jd-order-list">' + rows + '</div>'
            : '<div class="jd-empty-order-box">'
                + '<img src="/assets/brand/mascot-box.png" alt="小唤">'
                + '<div class="jd-empty-order-copy">'
                + '<p>' + (q ? '未找到匹配“' + esc(q) + '”的交换单' : '暂无进行中的交换单') + '</p>'
                + '<div class="jd-empty-btns">'
                + '<button type="button" class="jd-btn-red" data-act="go" data-to="#/offers">查看报价</button>'
                + '<button type="button" class="jd-btn-outline" data-act="go" data-to="#/home">去首页</button>'
                + '</div></div></div>')
        + '</div></div>';

    renderJdWorkspace('trade', 'exchange', mainHtml, true);
}

async function renderExchangeDetail(id) {
    var view = desktopRuntime.currentView;
    if (view.name !== 'exchangeDetail' || view.arg !== id) return;
    var main = $('#main-content');
    var keepPage = main && main.querySelector('.exchange-detail[data-exchange-id="' + id + '"]');
    if (!keepPage) $('#app').innerHTML = shell('exchange', loading());
    var e = await api('/exchange/' + id, {noCache:true});
    if (desktopRuntime.currentView !== view) return;
    var summary = window.exchangeSummary(e);
    var mine = summary.mine;
    var details = summary.people;
    var closed = e.status === 4 || e.status === 5;
    var cash = e.type === 4;
    var pay = cashPrice(e.amountCents);

    var rows = details.map(function (d) {
        var isMe = summary.isMe(d);
        var recipient = summary.recipientFor(d);
        return '<div class="list-row" style="cursor:default">'
            + '<div class="avatar" style="width:32px;height:32px;border-radius:11px">'
            + esc((d.nickname || '同').slice(0, 1)) + '</div>'
            + '<div class="row-main">'
            + '<p class="row-title" style="font-size:14px">'
            + (isMe
                ? esc(d.nickname || '同学') + ' <span class="exchange-self">我</span>'
                : '<button class="name-link" data-act="go" data-to="#/user/' + d.userId + '">'
                  + esc(d.nickname || '同学') + '</button>')
            + '</p>'
            + '<p class="row-sub">给出「' + esc(cash && Number(d.userId) === Number(e.cashBuyerId) ? pay : d.giveTitle || '物品') + '」'
            + (recipient ? '给 ' + esc(summary.isMe(recipient) ? '我' : recipient.nickname || '同学') : '')
            + ' | 收到「' + esc(cash && Number(d.userId) !== Number(e.cashBuyerId) ? pay : d.getTitle || '物品') + '」</p>'
            + '</div>'
            + '<div class="exchange-person-status">'
            + (!closed && summary.needsConfirmation ? '<div>' + (d.confirmed ? '<span style="color:var(--success-600)">已确认</span>' : '待确认') + '</div>' : '')
            + (!closed ? '<div>' + (d.delivered ? '<span style="color:var(--success-600)">已确认交接</span>' : '待确认交接') + '</div>' : '')
            + '</div></div>';
    }).join('');

    var confArr = e.confirmedArrangement || null;
    var pendArr = e.pendingArrangement || null;
    var actions = '';
    if (summary.canConfirm) {
        actions = '<button class="btn btn-primary" data-act="ex-confirm" data-id="' + e.id + '">确认参与</button>';
    } else if (summary.canReceive) {
        actions = '<button class="btn btn-ghost" data-act="ex-done" data-id="' + e.id + '">' + esc(summary.receiptLabel || (cash ? '确认已面交结清' : '确认收货')) + '</button>';
    } else if (e.status === 3) {
        actions = '<button class="btn btn-primary" data-act="open-review" data-id="' + e.id + '">评价参与者</button>'
            + '<a class="btn btn-ghost" href="#/market">返回主页面</a>';
    } else if (closed) {
        actions = e.type === 3 ? '<a class="btn btn-primary" href="' + (mine && mine.giveItemId ? '#/cycle/' + Number(mine.giveItemId) : '#/relay') + '">重新找换法</a>'
            : '<a class="btn btn-ghost" href="#/idle">返回集市</a>';
    }
    if (summary.active) {
        if (pendArr && !pendArr.confirmedByMe) {
            actions += '<button class="btn btn-primary" data-act="arr-confirm" data-id="' + e.id + '" data-ver="' + Number(pendArr.version) + '">同意安排</button>';
        }
        actions += '<button class="btn btn-ghost" data-act="open-place" data-id="' + e.id + '">' + (pendArr || confArr ? '修改提议' : '提议时间和地点') + '</button>'
            + '<button class="btn btn-ghost exchange-cancel" data-act="ex-cancel" data-id="' + e.id + '">取消交换</button>';
    }

    var meetPlace = confArr ? confArr.place : (e.place || (e.status === 3 ? '未记录' : '待约定'));
    var meetTime = confArr ? [confArr.startTime, confArr.endTime].filter(Boolean).join(' - ') : (e.dealTime || (e.status === 3 ? '未记录' : '待约定'));
    var meetBadge = closed ? '<span class="tag">已关闭</span>' : confArr ? '<span class="tag brand">已约好</span>' : (pendArr ? '<span class="tag">' + (pendArr.confirmedByMe ? '已提议，待对方确认' : '已提议，待你确认') + '（' + pendArr.confirmedCount + '/' + pendArr.needCount + '）</span>' : '<span class="tag">' + (e.status === 3 ? '自行约定面交' : '待约面交') + '</span>');
    var pendingHtml = !closed && pendArr ? ('<div class="exchange-pending-box" style="margin-top:10px;padding:10px 12px;border-radius:8px;background:#f4faf8;border:1px solid #cce7e0;font-size:13px">'
        + '<b>' + (confArr ? '改期提议 v' : '待确认提议 v') + Number(pendArr.version) + '</b>（由 ' + esc(pendArr.proposerName || '同学') + ' 提出 · ' + pendArr.confirmedCount + '/' + pendArr.needCount + ' 已确认）'
        + '<div style="margin-top:4px">地点：' + esc(pendArr.place) + (pendArr.startTime ? ' ｜ 时间：' + esc([pendArr.startTime, pendArr.endTime].filter(Boolean).join(' - ')) : '') + '</div>'
        + (pendArr.note ? '<div style="margin-top:2px;color:#475569">备注：' + esc(pendArr.note) + '</div>' : '')
        + '</div>') : '';

    var handoff = mine ? '<section class="exchange-handoff" aria-label="我的物品交接">'
        + '<div><span>我给出</span><strong>' + esc(cash && Number(mine.userId) === Number(e.cashBuyerId) ? pay : mine.giveTitle || '物品') + '</strong>'
        + (summary.recipient ? '<small>交给 ' + esc(summary.recipient.nickname || '同学') + '</small>' : '') + '</div>'
        + '<div><span>我收到</span><strong>' + esc(cash && Number(mine.userId) !== Number(e.cashBuyerId) ? pay : mine.getTitle || '物品') + '</strong>'
        + (summary.sender ? '<small>来自 ' + esc(summary.sender.nickname || '同学') + '</small>' : '') + '</div></section>' : '';
    var content = '<nav class="amz-breadcrumb" aria-label="面包屑"><a href="#/home">首页</a><span>›</span><a href="#/exchange">我的交换单</a><span>›</span><b>交换单 #' + e.id + '</b></nav>'
        + '<article class="exchange-detail" data-exchange-id="' + id + '"><header class="exchange-heading">'
        + '<p class="hint">#' + e.id + ' | ' + (cash ? '校内标价面交' : e.type === 3 ? '三方成环' : '一对一交换')
        + (e.createTime ? ' | 创建于 ' + fmtDate(e.createTime) : '') + '</p>'
        + '<h1>' + esc(e.statusText) + '</h1><p class="exchange-next">' + esc(summary.next) + '</p>'
        + '<button type="button" class="btn btn-ghost btn-sm" data-act="trade-refresh">刷新状态</button>'
        + stepsHtml(e)
        + (!closed && e.confirmExpiresAt && e.status === 1 ? '<p class="hint">确认截止：' + esc(fmtAuctionEnd(e.confirmExpiresAt)) + '</p>' : '')
        + (closed ? '' : '<p class="exchange-counts">' + (summary.needsConfirmation
            ? '已确认 ' + (e.confirmedCount || 0) + '/' + (e.needConfirm || details.length) + ' | ' : '')
        + '已确认交接 ' + (e.deliveredCount || 0) + '/' + (e.needConfirm || details.length) + '</p>') + '</header>'
        + handoff
        + '<div class="exchange-detail-grid"><section class="exchange-people"><h2>参与者</h2>' + rows
        + (!closed && e.type === 3 ? '<a class="btn btn-ghost" href="#/ring/' + e.id + '">进入三方协商房间</a>' : '') + '</section>'
        + '<section class="exchange-meet"><h2>面交安排 ' + meetBadge + '</h2>'
        + (closed || (pendArr && !confArr) ? '' : '<div class="kv"><span class="k">' + (confArr ? '已定地点' : '地点') + '</span><span class="v">' + esc(meetPlace) + '</span></div>'
        + '<div class="kv"><span class="k">' + (confArr ? '已定时间' : '时间') + '</span><span class="v">' + esc(meetTime || '待约定') + '</span></div>'
        + (confArr && confArr.note ? '<div class="kv"><span class="k">备注</span><span class="v">' + esc(confArr.note) + '</span></div>' : ''))
        + pendingHtml
        + window.exchangeDisputeTimeline(e, esc)
        + (summary.active || e.status === 6 ? '<button class="btn btn-ghost" data-act="exchange-dispute" data-id="'
            + Number(e.id) + '">' + (e.status === 6 ? '补充情况' : '提交面交争议') + '</button>' : '')
        + (actions ? '<div class="exchange-actions">' + actions + '</div>' : '') + '</section></div></article>';

    if (keepPage) {
        main.innerHTML = content;
    } else {
        $('#app').innerHTML = shell('trade', content);
    }
}

async function openOfferSheet(itemId) {
    state._pickedOfferItemId = 0;
    var target = (await api('/item/' + Number(itemId))).item;
    var mine = await api('/item/mine?status=1');
    if (!mine || mine.length === 0) {
        openSheet('<h3>先发布一件物品</h3><p class="sub">报价要用你的在架物品去换，你还没有在架的物品。</p>'
            + '<button class="btn btn-primary btn-block" data-act="go" data-to="#/publish">去发布</button>');
        return;
    }
    var options = mine.map(function (it) {
        return '<button type="button" class="item-card offer-pick-card" style="margin-bottom:8px" data-act="pick-offer-item" data-id="' + it.id + '" aria-pressed="false">'
            + thumb(it) + '<div class="item-main"><h3 class="item-title">' + esc(it.title) + '</h3>'
            + '<div class="item-foot"><span class="tag brand">' + esc(it.category) + '</span>'
            + '<span class="tag">' + esc(it.conditionLevel) + '</span></div></div></button>';
    }).join('');
    openSheet('<h3>提案交换</h3><p class="sub">我想收到：'+esc(target.title)+'</p><h4>我愿意给</h4>'
        + '<div class="offer-pick-list">' + options + '</div>'
        + '<div class="field" style="margin-top:12px"><label class="label">留言 <span class="opt">选填，≤50 字</span></label>'
        + '<input class="input" id="offer-msg" maxlength="50" placeholder="例如 我在北山书院，今天下午就能面交"></div>'
        + '<input type="hidden" id="offer-target" value="' + itemId + '">'
        + '<button type="button" class="btn btn-primary btn-block" id="submit-offer-btn" data-act="submit-offer" disabled style="margin-top:8px">请先点选上方一件物品</button>');
}

async function openPlaceSheet(exchangeId) {
    openSheet('<h3>提议面交安排</h3><p class="sub">提交后将通知交换伙伴，需对方同意后才正式生效。</p>'
        + '<form data-form="place"><input type="hidden" name="exchangeId" value="' + exchangeId + '">'
        + '<div class="field"><label class="label">面交地点</label>'
        + '<select class="select" name="place" required><option value="">请选择校内公共点位</option>'
        + CAMPUS_SPOTS.map(function (s) { return '<option>' + esc(s) + '</option>'; }).join('')
        + '<option>校园服务中心</option></select></div>'
        + '<div class="field"><label class="label">约定时间</label>'
        + '<input class="input" type="datetime-local" name="startTime" aria-label="面交日期和时间" required></div>'
        + '<div class="field"><label class="label">补充备注 <span class="opt">选填</span></label>'
        + '<input class="input" name="note" maxlength="100" placeholder="例如 穿深色外套，正门台阶旁见"></div>'
        + '<button class="btn btn-primary btn-block" type="submit">提交并通知对方确认</button></form>');
}

function openReviewSheet(exchangeId, targets) {
    var list = targets.map(function (t) {
        return '<button class="item-card" style="margin-bottom:8px" data-act="pick-review-target" data-id="' + t.userId + '">'
            + '<div class="avatar" style="width:44px;height:44px;border-radius:14px">'
            + esc((t.nickname || '同').slice(0, 1)) + '</div>'
            + '<div class="item-main"><h3 class="item-title">' + esc(t.nickname || '同学') + '</h3>'
            + '<p class="item-desc">给出「' + esc(t.giveTitle || '') + '」</p></div>'
            + '<span class="chev" style="color:var(--ink-400)">›</span></button>';
    }).join('');
    openSheet('<h3>给谁打分</h3><p class="sub">评价一旦提交不能修改，如实写就好。</p>' + list
        + '<input type="hidden" id="review-exchange" value="' + exchangeId + '">');
}

function openReviewForm(exchangeId, targetUserId, nickname) {
    openSheet('<h3>评价 ' + esc(nickname) + '</h3><p class="sub">星级会按"分数 − 3"微调对方信用分。</p>'
        + '<form data-form="review"><input type="hidden" name="exchangeId" value="' + exchangeId + '">'
        + '<input type="hidden" name="targetUserId" value="' + targetUserId + '">'
        + '<input type="hidden" name="score" id="review-score" value="5">'
        + '<div class="stars" id="review-stars" role="radiogroup" aria-label="评分星级" style="margin-bottom:14px">'
        + [1, 2, 3, 4, 5].map(function (n) {
            return '<button type="button" class="star ' + (n <= 5 ? 'on' : '') + '" data-act="set-star" data-n="' + n + '" aria-label="评分 ' + n + ' 星">'+navIcon('star')+'</button>';
        }).join('') + '</div>'
        + '<div class="field"><label class="label">说两句 <span class="opt">选填，≤100 字</span></label>'
        + '<input class="input" name="content" maxlength="100" placeholder="守时、描述属实、沟通顺畅…"></div>'
        + '<button class="btn btn-primary btn-block" type="submit">提交评价</button></form>');
}

export {
    OFFER_STATUS,
    openOfferSheet,
    openPlaceSheet,
    openReviewForm,
    openReviewSheet,
    renderExchangeDetail,
    renderExchanges,
};
