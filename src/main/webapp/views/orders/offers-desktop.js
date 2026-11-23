import { clayIcon } from "../../components/desktop/icons.js";
import {
    loading,
    markJdWorkspaceBusy,
    renderJdWorkspace,
    shell,
} from "../../components/desktop/shell.js";
import { state } from "../../router/desktop/state.js";
import { api } from "../../utils/desktop/api.js";
import { $, esc } from "../../utils/desktop/dom.js";
import { cashPrice, fmtRel } from "../../utils/desktop/format.js";
import { OFFER_STATUS } from "./desktop.js";

async function renderOffers() {
    if (!markJdWorkspaceBusy()) $('#app').innerHTML = shell('offers', loading());
    var tab = state.offersTab;
    var list = await api(tab === 'received' ? '/offer/received' : '/offer/sent', {noCache: true});
    var q = String(state.offersQuery || '').trim().toLowerCase();
    var stFilter = state.offersStatusFilter || 'all';
    var filtered = (list || []).filter(function (o) {
        if (stFilter !== 'all' && String(o.status) !== String(stFilter)) return false;
        if (!q) return true;
        var txt = [o.id, o.myTitle, o.targetTitle, o.fromNickname, o.toNickname, o.message].join(' ').toLowerCase();
        return txt.indexOf(q) >= 0;
    });
    var rows = filtered.map(function (o) {
        var st = OFFER_STATUS[o.status] || ['未知', ''];
        var isReceived = tab === 'received';
        var cash = Number(o.amountCents || 0);
        var other = isReceived ? (o.fromNickname || '校内同学') : (o.toNickname || '校内同学');
        var actions = '';
        if (o.status === 0) {
            if (isReceived) {
                actions = '<button class="btn btn-sm btn-primary" data-act="offer-act" data-id="' + o.id + '" data-do="accept" data-cash="' + cash + '">' + (cash ? '接受出价' : '接受提案') + '</button>'
                    + '<button class="btn btn-sm btn-ghost" data-act="offer-act" data-id="' + o.id + '" data-do="counter" data-cash="' + cash + '">' + (cash ? '还价' : '修改提案') + '</button>'
                    + '<button class="btn btn-sm btn-ghost" data-act="offer-act" data-id="' + o.id + '" data-do="reject">拒绝</button>';
            } else {
                actions = '<button class="btn btn-sm btn-ghost" data-act="offer-act" data-id="' + o.id + '" data-do="cancel">撤回报价</button>';
            }
        } else {
            actions = '<button type="button" class="jd-btn-rebuy" data-act="go" data-to="#/idle">再次逛集市</button>';
        }
        return '<article class="jd-order-item">'
            + '<header class="jd-item-head">'
            + '<span class="jd-item-time">' + fmtRel(o.createTime) + '</span>'
            + '<span class="jd-item-no">报价单号：<b>#OF' + (100000 + Number(o.id || 0)) + '</b></span>'
            + '<a href="' + (o.conversationId ? '#/chat/' + Number(o.conversationId) : '#/notifications') + '" class="jd-item-shop">' + (cash ? '校内面交' : '校内换物') + ' <i class="jd-chat-dot">' + clayIcon('chat', '联系同学', 'is-sm') + '</i></a>'
            + '<span class="jd-item-credit">对方信用：' + (o.fromCredit === undefined ? '80' : o.fromCredit) + ' 分</span>'
            + '</header>'
            + '<div class="jd-item-row">'
            + '<div class="jd-col-goods">'
            + '<div class="jd-goods-thumb"><img src="/assets/amz/quad-swap-compact.webp" alt=""></div>'
            + '<div class="jd-goods-info">'
            + '<p class="jd-goods-title"><b>' + esc(isReceived ? other : '我') + '</b> ' + (cash ? '提议以 ' + cashPrice(cash) + ' 面交「<b>' + esc(o.targetTitle || '物品') + '</b>」'
                : '提议用 「<b>' + esc(o.myTitle || '闲置好物') + '</b>」交换「<b>' + esc(o.targetTitle || '目标好物') + '</b>」') + '</p>'
            + (o.message ? '<p class="jd-goods-note">留言：「' + esc(o.message) + '」</p>' : '<p class="jd-goods-note">支持校内线下验货交接</p>')
            + '</div>'
            + '<span class="jd-goods-qty">x1</span>'
            + '<div class="jd-goods-repair"><a href="#/appraise">AI估价</a></div>'
            + '</div>'
            + '<div class="jd-col-buyer"><span class="jd-buyer-name">' + esc(other) + '</span></div>'
            + '<div class="jd-col-amount"><b>' + (cash ? cashPrice(cash) : '以物换物') + '</b><small>线下面交</small></div>'
            + '<div class="jd-col-status"><span class="amz-status-txt ' + st[1] + '">' + st[0] + '</span><small style="display:block;margin-top:4px;color:#888">' + (o.status === 0 ? '24h内有效' : fmtRel(o.handleTime)) + '</small></div>'
            + '<div class="jd-col-ops">' + actions + '</div>'
            + '</div></article>';
    }).join('');

    var advBar = state.offersAdvOpen
        ? '<div class="jd-adv-filter-bar"><span>状态筛选：</span>'
          + [['all', '全部'], ['0', '待响应'], ['1', '已接受'], ['5', '已还价'], ['2', '已拒绝']].map(function (st) {
              return '<button type="button" class="chip ' + (String(stFilter) === st[0] ? 'on' : '') + '" data-act="offers-status" data-v="' + st[0] + '">' + st[1] + '</button>';
          }).join('')
          + (q || state.hiddenDemoOrders.length ? '<button type="button" class="chip" data-act="orders-reset">重置筛选与示例</button>' : '')
          + '</div>'
        : '';

    var mainHtml = '<div class="jd-order-main">'
        + '<div class="jd-order-title-bar"><h2>我的提案与出价</h2>' + '<button type="button" class="btn btn-ghost btn-sm" data-act="trade-refresh">刷新状态</button>' + (q ? '<span>筛选：“' + esc(q) + '”</span>' : '') + '</div>'
        + '<div class="jd-order-panel">'
        + '<div class="jd-order-tabs-row">'
        + '<div class="jd-order-tabs">'
        + '<button type="button" class="' + (tab === 'received' ? 'on' : '') + '" data-act="offers-tab" data-v="received">收到的提案与出价</button>'
        + '<button type="button" class="' + (tab === 'sent' ? 'on' : '') + '" data-act="offers-tab" data-v="sent">我发出的提案与出价</button>'
        + '<a href="#/exchange">待面交交换单</a>'
        + '<a href="#/me/reviews">待评价</a>'
        + '<a href="#/favorites" class="jd-tab-emph">我的常换商品</a>'
        + '<a href="#/me/auctions" class="jd-tab-emph">我的竞拍单</a>'
        + '</div>'
        + '<form class="jd-order-search" data-form="orders-search">'
        + '<input name="q" type="search" value="' + esc(state.offersQuery || '') + '" placeholder="商品名称/商品编号/订单号" aria-label="订单搜索">'
        + '<button type="submit">搜索</button>'
        + '<button type="button" class="jd-btn-adv" data-act="orders-adv">高级 ▾</button>'
        + '</form>'
        + '</div>'
        + advBar
        + (rows ? '<div class="jd-order-list">' + rows + '</div>'
            : '<div class="jd-empty-order-box">'
                + '<img src="/assets/brand/mascot-box.png" alt="小唤">'
                + '<div class="jd-empty-order-copy">'
                + '<p>' + (q ? '没有匹配“' + esc(q) + '”的报价单' : (tab === 'received' ? '暂无收到的换物报价' : '暂无发出的换物报价')) + '</p>'
                + '<div class="jd-empty-btns">'
                + '<button type="button" class="jd-btn-red" data-act="go" data-to="#/exchange">查看交换单</button>'
                + '<button type="button" class="jd-btn-outline" data-act="go" data-to="#/home">去首页</button>'
                + '</div></div></div>')
        + '</div></div>';

    renderJdWorkspace('trade', 'offers', mainHtml, true);
}

export { renderOffers };
