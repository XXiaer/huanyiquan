import { closeSheet, openSheet } from "../../components/desktop/sheet.js";
import { toast } from "../../components/desktop/toast.js";
import { go, render } from "../../router/desktop/navigation.js";
import { desktopRuntime, state } from "../../router/desktop/state.js";
import { ApiError, api, readToken } from "../../utils/desktop/api.js";
import { $, esc, withBusy } from "../../utils/desktop/dom.js";
import { cashPrice, thumb } from "../../utils/desktop/format.js";
import { renderAdmin } from "../admin/desktop.js";
import { patchImRightPanel } from "../messages/desktop.js";
import {
    openOfferSheet,
    openPlaceSheet,
    openReviewForm,
    openReviewSheet,
    renderExchangeDetail,
    renderExchanges,
} from "./desktop.js";
import { renderOffers } from "./offers-desktop.js";
import { openAuthPopup } from "../users/auth-desktop.js";
import { openCreditRule, openPendingSheet } from "../users/desktop.js";

const ordersActions = {
    "trade-refresh": async ({ element: el }) => {
        await withBusy(el, async function () {
            if (desktopRuntime.currentView.name === 'exchangeDetail') await renderExchangeDetail(desktopRuntime.currentView.arg);
            else if (desktopRuntime.currentView.name === 'exchange') await renderExchanges();
            else if (desktopRuntime.currentView.name === 'offers') await renderOffers();
        });
        return;
    },
    "exchange-dispute": async ({ element: el }) => {
        openSheet('<h3>说明面交情况</h3><p>提交后，交易将暂停并交由管理员处理。</p>'
            + '<label for="dispute-statement">情况说明</label><textarea id="dispute-statement" class="textarea" maxlength="1000"></textarea>'
            + '<button class="btn btn-primary" data-act="submit-exchange-dispute" data-id="' + Number(el.dataset.id) + '">提交说明</button>');
        return;
    },
    "submit-exchange-dispute": async ({ element: el }) => {
        var statement = $('#dispute-statement').value.trim();
        if (!statement) { toast('请填写情况说明', 'err'); return; }
        await withBusy(el, async function () {
            await api('/exchange/' + Number(el.dataset.id) + '/dispute', {method:'POST', body:{statement:statement}});
            closeSheet();
            await renderExchangeDetail(Number(el.dataset.id));
        });
        return;
    },
    "orders-adv": async () => {
        state.offersAdvOpen = !state.offersAdvOpen;
        if (desktopRuntime.currentView.name === 'exchange') await renderExchanges();
        else await renderOffers();
        return;
    },
    "offers-status": async ({ element: el }) => {
        state.offersStatusFilter = el.dataset.v || 'all';
        await renderOffers();
        return;
    },
    "orders-reset": async () => {
        state.offersQuery = '';
        state.offersStatusFilter = 'all';
        state.hiddenDemoOrders = [];
        if (desktopRuntime.currentView.name === 'exchange') await renderExchanges();
        else await renderOffers();
        return;
    },
    "demo-order-hide": async ({ element: el }) => {
        var orderNo = el.dataset.no;
        if (orderNo && state.hiddenDemoOrders.indexOf(orderNo) < 0) state.hiddenDemoOrders.push(orderNo);
        toast('已移出此示例订单');
        if (desktopRuntime.currentView.name === 'exchange') await renderExchanges();
        else await renderOffers();
        return;
    },
    "cycle": async ({ element: el }) => {
        go('#/cycle/' + el.dataset.id);
        return;
    },
    "create-ring": async ({ element: el }) => {
        await withBusy(el, async function () {
            var ids = el.dataset.ids.split(',').map(Number);
            var r = await api('/cycle/' + el.dataset.id + '/create', {method: 'POST', body: {itemIds: ids}});
            toast('环成了，去交换单里确认');
            go('#/exchange/' + r.exchangeId);
        });
        return;
    },
    "open-cash-offer": async ({ element: el }) => {
        if (!readToken() && !state.me) {
            if (!openAuthPopup('login', siteRoutes.current())) go('#/login');
            return;
        }
        var price = Number(el.dataset.price);
        var bargain = el.dataset.bargain === '1';
        openSheet('<h3>' + (bargain ? '向同学出价' : '按标价约面交') + '</h3>'
            + '<p class="sub">对方同意后再约校内面交，验货后当面付款。</p>'
            + '<form data-form="cash-offer"><input type="hidden" name="itemId" value="' + Number(el.dataset.id) + '">'
            + '<label class="label" for="cash-offer-value">金额（元）</label>'
            + '<input class="input" id="cash-offer-value" name="amount" type="number" min="0.01" step="0.01" value="' + (price / 100).toFixed(2) + '" ' + (bargain ? '' : 'readonly') + ' required>'
            + '<label class="label" for="cash-offer-message">留言（选填）</label><input class="input" id="cash-offer-message" name="message" maxlength="50" placeholder="如：可以在图书馆大厅面交">'
            + '<button class="btn btn-primary btn-block" type="submit">发送出价</button></form>');
        return;
    },
    "open-offer": async ({ element: el }) => {
        await withBusy(el, function () { return openOfferSheet(el.dataset.id); });
        return;
    },
    "pick-offer-item": async ({ element: el }) => {
        var pickedId = Number(el.dataset.id || 0);
        state._pickedOfferItemId = pickedId;
        Array.prototype.forEach.call(document.querySelectorAll('[data-act=pick-offer-item]'), function (c) {
            var on = c === el;
            c.classList.toggle('is-picked', on);
            c.setAttribute('aria-pressed', String(on));
            c.style.borderColor = on ? 'var(--brand-500)' : 'var(--line)';
            c.style.background = on ? 'var(--brand-50)' : 'var(--surface)';
        });
        var submitOfferBtn = document.getElementById('submit-offer-btn');
        if (submitOfferBtn) {
            submitOfferBtn.disabled = !pickedId;
            submitOfferBtn.textContent = pickedId ? '确认发起报价' : '请先点选上方一件物品';
        }
        return;
    },
    "submit-offer": async ({ element: el }) => {
        var myPickedId = Number(state._pickedOfferItemId || 0);
        if (!myPickedId) { toast('请先选择一件你的在架物品', 'err'); return; }
        var target = Number(($('#offer-target') && $('#offer-target').value) || 0);
        var msg = ($('#offer-msg') && $('#offer-msg').value) || '';
        await withBusy(el, async function () {
            var offer = await api('/offer', {method: 'POST', body: {itemId: target, myItemId: myPickedId, message: msg}});
            closeSheet();
            toast('换物提案已发出，等待对方回应', 'ok');
            go(offer.conversationId ? '#/chat/' + Number(offer.conversationId) : '#/offers');
        });
        return;
    },
    "offer-act": async ({ element: el }) => {
        var offerId = Number(el.dataset.id);
        var todo = el.dataset.do;
        if (todo === 'counter') {
            if (Number(el.dataset.cash) > 0) {
                openSheet('<h3>修改出价</h3><p class="sub">对方可接受、拒绝或再次出价。</p>'
                    + '<form data-form="cash-offer-counter"><input type="hidden" name="offerId" value="' + offerId + '">'
                    + '<label class="label" for="cash-counter-value">新的金额（元）</label>'
                    + '<input class="input" id="cash-counter-value" name="amount" type="number" min="0.01" step="0.01" value="' + (Number(el.dataset.cash) / 100).toFixed(2) + '" required>'
                    + '<button class="btn btn-primary btn-block" type="submit">发送新出价</button></form>');
                return;
            }
            var mine = await api('/item/mine?status=1');
            var opts = (mine || []).map(function (it) {
                return '<button class="item-card" style="margin-bottom:8px" data-act="preview-counter" data-title="' + esc(it.title) + '" data-offer="' + offerId
                    + '" data-id="' + it.id + '">' + thumb(it)
                    + '<div class="item-main"><h3 class="item-title">' + esc(it.title) + '</h3>'
                    + '<div class="item-foot"><span class="tag brand">' + esc(it.category) + '</span></div></div></button>';
            }).join('');
            if (!opts) {
                toast('你还没有在架物品，没法还价', 'err');
                return;
            }
            openSheet('<h3>用你的哪件还价</h3><p class="sub">原来那条报价会关闭，生成一条反方向的新报价。</p>' + opts);
            return;
        }
        if (todo === 'accept' && !confirm(Number(el.dataset.cash) > 0 ? '接受后物品将锁定，双方需确认面交安排。接受这笔出价？' : '接受后双方物品将锁定。接受这份换物提案？')) return;
        await withBusy(el, async function () {
            var result=await api('/offer/handle', {method: 'POST', body: {offerId: offerId, action: todo}});
            if(todo==='accept' && result?.exchangeId){ go('#/exchange/'+Number(result.exchangeId)); return; }
            toast(todo === 'accept' ? '已接受，物品锁定' : (todo === 'reject' ? '已拒绝' : '已撤回'), 'ok');
            if(desktopRuntime.currentView.name==='chat'||desktopRuntime.currentView.name==='notifications') await patchImRightPanel(state.activeImKey,{scrollBottom:false});
            else await renderOffers();
        });
        return;
    },
    "preview-counter": async ({ element: el }) => {
        openSheet('<h3>确认反提案</h3><p>我愿意给：'+esc(el.dataset.title)+'</p>'
            + '<p class="sub">发出后，本轮原提案将被替代。</p><button class="btn btn-primary btn-block" data-act="do-counter" data-offer="'+Number(el.dataset.offer)+'" data-id="'+Number(el.dataset.id)+'">发送反提案</button>');
        return;
    },
    "do-counter": async ({ element: el }) => {
        var oid = Number(el.dataset.offer);
        var iid = Number(el.dataset.id);
        closeSheet();
        await withBusy(null, async function () {
            await api('/offer/handle', {method: 'POST', body: {offerId: oid, action: 'counter', myItemId: iid}});
            toast('反提案已发出', 'ok');
            if(desktopRuntime.currentView.name==='chat'||desktopRuntime.currentView.name==='notifications') await patchImRightPanel(state.activeImKey,{scrollBottom:false});
            else await renderOffers();
        });
        return;
    },
    "offers-tab": async ({ element: el, action: act }) => {
        if (act === 'offers-tab') state.offersTab = el.dataset.v;
        else { state.adminTab = el.dataset.v; await withBusy(el, renderAdmin); return; }
        await render();
        return;
    },
    "ex-confirm": async ({ element: el, action: act }) => {
        if (act === 'ex-done' && !confirm('请在当面验货并完成交接后再确认。双方都确认后交易结束，确认后不可撤回。')) return;
        await withBusy(el, async function () {
            var r = await api('/exchange/' + el.dataset.id + (act === 'ex-confirm' ? '/confirm' : '/done'),
                {method: 'POST'});
            toast(r && r.msg || '已确认', 'ok');
            await renderExchangeDetail(Number(el.dataset.id));
        });
        return;
    },
    "ex-cancel": async ({ element: el }) => {
        openSheet('<h3>取消这笔交换？</h3><p>取消后交换单将关闭，相关物品会重新上架。</p>'
            + '<div class="btn-row"><button type="button" class="btn btn-primary" data-act="sheet-close">继续交换</button>'
            + '<button type="button" class="btn btn-ghost exchange-cancel" data-act="ex-cancel-confirm" data-id="' + Number(el.dataset.id)
            + '">确认取消这笔交换</button></div>');
        return;
    },
    "ex-cancel-confirm": async ({ element: el }) => {
        await withBusy(el, async function () {
            await api('/exchange/' + el.dataset.id + '/cancel', {method: 'POST', body: {reason: '当事人取消'}});
            closeSheet();
            toast('已取消', 'ok');
            await renderExchangeDetail(Number(el.dataset.id));
        });
        return;
    },
    "offer-history": async ({ element: el }) => {
        var hid = Number(el.dataset.id);
        await withBusy(el, async function () {
            var chain = await api('/offer/' + hid + '/history');
            var timelineHtml = (chain || []).map(function (n) {
                return '<div style="padding:10px 12px;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:8px;background:' + (n.isLatest ? '#f4faf8' : '#fff') + '">'
                    + '<div style="display:flex;justify-content:space-between;font-size:12px;color:#475569"><b>' + esc(n.label) + '（' + esc(n.fromNickname || '同学') + ' → ' + esc(n.toNickname || '同学') + '）</b><span>' + esc(n.statusText || '') + '</span></div>'
                    + (n.diffSummary ? '<div style="margin-top:4px;font-size:12px;color:#0c7263;font-weight:600">' + esc(n.diffSummary) + '</div>' : '')
                    + '<div style="margin-top:6px;font-size:13px">' + (n.amountCents ? cashPrice(n.amountCents) + ' 面交「<b>' + esc(n.targetTitle || '物品') + '</b>」'
                        : '用「<b>' + esc(n.myTitle || '物品') + '</b>」换「<b>' + esc(n.targetTitle || '物品') + '</b>」') + '</div>'
                    + (n.message ? '<div style="margin-top:3px;font-size:12px;color:#64748b">' + esc(n.message) + '</div>' : '')
                    + '</div>';
            }).join('') || '<p class="sub">暂无历史记录</p>';
            openSheet('<h3>提案协商历史</h3><div style="max-height:56vh;overflow:auto;margin-top:10px">' + timelineHtml + '</div>');
        });
        return;
    },
    "arr-confirm": async ({ element: el }) => {
        var exId = Number(el.dataset.id);
        var ver = Number(el.dataset.ver);
        await withBusy(el, async function () {
            await api('/exchange/' + exId + '/arrangements/' + ver + '/confirm', { method: 'POST' });
            toast('已同意面交安排', 'ok');
            await renderExchangeDetail(exId);
        });
        return;
    },
    "open-place": async ({ element: el }) => {
        await openPlaceSheet(el.dataset.id);
        return;
    },
    "open-review": async ({ element: el }) => {
        var e = await api('/exchange/' + el.dataset.id);
        var me = state.me;
        var targets = (e.details || []).filter(function (d) {
            return d.userId !== me.id;
        });
        openReviewSheet(el.dataset.id, targets);
        return;
    },
    "pick-review-target": async ({ element: el }) => {
        var exId = $('#review-exchange').value;
        var nick = el.querySelector('.item-title').textContent;
        openReviewForm(exId, el.dataset.id, nick);
        return;
    },
    "set-star": async ({ element: el }) => {
        var n = Number(el.dataset.n);
        $('#review-score').value = n;
        Array.prototype.forEach.call(document.querySelectorAll('#review-stars .star'), function (s) {
            s.classList.toggle('on', Number(s.dataset.n) <= n);
        });
        return;
    },
    "pending-review": async () => {
        openPendingSheet();
        return;
    },
    "credit-rule": async () => {
        openCreditRule();
        return;
    },
};
ordersActions["admin-tab"] = ordersActions["offers-tab"];
ordersActions["ex-done"] = ordersActions["ex-confirm"];

const ordersForms = {
    "orders-search": async ({ data: fd }) => {
        state.offersQuery = (fd.get('q') || '').trim();
        if (desktopRuntime.currentView.name === 'exchange') await renderExchanges();
        else await renderOffers();
        return;
    },
    "cash-offer": async ({ data: fd, kind }) => {
        var amountCents = Math.round(Number(fd.get('amount')) * 100);
        if (!Number.isSafeInteger(amountCents) || amountCents <= 0) throw new ApiError('请输入有效的金额');
        var counter = kind === 'cash-offer-counter';
        var quote = await api(counter ? '/offer/handle' : '/offer', {method:'POST', body:counter
            ? {offerId:Number(fd.get('offerId')), action:'counter', amountCents:amountCents}
            : {itemId:Number(fd.get('itemId')), amountCents:amountCents, message:fd.get('message')}});
        closeSheet();
        toast(counter ? '新出价已发送' : '出价已发送，等待对方回应', 'ok');
        if (counter && ['chat','notifications'].includes(desktopRuntime.currentView.name)) await patchImRightPanel(state.activeImKey, {scrollBottom:false});
        else if (counter && desktopRuntime.currentView.name === 'offers') await renderOffers();
        else go(quote && quote.conversationId ? '#/chat/' + Number(quote.conversationId) : '#/offers');
        return;
    },
    "place": async ({ data: fd }) => {
        await api('/exchange/' + fd.get('exchangeId') + '/arrangements', {method: 'POST', body: {
            place: fd.get('place'), startTime: fd.get('startTime').replace('T', ' ') + ' ' + new Date(fd.get('startTime')).toLocaleDateString('zh-CN', {weekday:'short'}), note: fd.get('note')
        }});
        closeSheet();
        toast('已提议面交安排，等待对方确认', 'ok');
        await renderExchangeDetail(Number(fd.get('exchangeId')));
    },
    "review": async ({ data: fd }) => {
        await api('/review', {method: 'POST', body: {
            exchangeId: Number(fd.get('exchangeId')),
            targetUserId: Number(fd.get('targetUserId')),
            score: Number(fd.get('score')),
            content: fd.get('content')
        }});
        closeSheet();
        toast('评价成功', 'ok');
        await renderExchangeDetail(Number(fd.get('exchangeId')));
    },
};
ordersForms["cash-offer-counter"] = ordersForms["cash-offer"];

export { ordersActions, ordersForms };
