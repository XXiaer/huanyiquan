import { closeSheet, openSheet } from "../../components/desktop/sheet.js";
import { toast } from "../../components/desktop/toast.js";
import { go, render } from "../../router/desktop/navigation.js";
import { desktopRuntime, state } from "../../router/desktop/state.js";
import { ApiError, api, readToken } from "../../utils/desktop/api.js";
import { $, esc, withBusy } from "../../utils/desktop/dom.js";
import { thumb } from "../../utils/desktop/format.js";
import { renderAdmin } from "../admin/desktop.js";
import { openEstimate } from "./appraise-desktop.js";
import { renderAuctionDetail, renderAuctions } from "./auction-desktop.js";
import {
    ensureIdleTabData,
    homeLoadToken,
    loadHome,
    moreItemsObserver,
    openFilterSheet,
    rememberSearch,
    renderHome,
    renderSearchPage,
} from "./desktop.js";
import { markMultiWant, savePublishDraft, syncPublishTradeMode } from "./publish-desktop.js";
import { DEMO_WISHES, openWishCreateSheet, renderWishes } from "./wishes-desktop.js";
import { renderRelay } from "../orders/relay-desktop.js";
import { openAuthPopup } from "../users/auth-desktop.js";
import { shelfRead, shelfRemember, shelfWrite } from "../users/saved-desktop.js";

const marketActions = {
    "idle-pill": async ({ element: el }) => {
        var channel = el.dataset.v;
        var target = {all: '#/idle', auctions: '#/auctions', relay: '#/relay', wishes: '#/wishes'}[channel];
        if (target) {
            state.home.category = '';
            go(target);
        }
        return;
    },
    "open-wish-modal": async () => {
        await ensureIdleTabData('wishes');
        openWishCreateSheet();
        return;
    },
    "idle-quick-fav": async ({ element: el }) => {
        var qId = Number(el.dataset.id);
        var favItems = shelfRead('favorites');
        var wasSaved = favItems.some(function (x) { return Number(x.id) === qId; });
        var itemObj = (state.home.items || []).find(function (x) { return Number(x.id) === qId; });
        var qOk = wasSaved
            ? shelfWrite('favorites', favItems.filter(function (x) { return Number(x.id) !== qId; }))
            : (itemObj ? shelfRemember('favorites', itemObj) : shelfRemember('favorites', (await api('/item/' + qId)).item));
        if (qOk) {
            var nowFav = !wasSaved;
            el.classList.toggle('is-fav', nowFav);
            el.textContent = nowFav ? '✓' : '+';
            el.title = nowFav ? '已收藏' : '加入收藏夹';
            var cNum = $('.amz-cart-num');
            if (cNum) cNum.textContent = String(shelfRead('favorites').length);
            toast(nowFav ? '已加入收藏夹' : '已移出收藏夹');
        }
        return;
    },
    "f-credit": async ({ element: el }) => {
        var nextCredit = Number(el.dataset.v || 0);
        state.home.minCredit = state.home.minCredit === nextCredit ? 0 : nextCredit;
        if (state.home.items && state.home.items.length) {
            renderHome();
        } else if (await loadHome(true)) {
            renderHome();
        }
        return;
    },
    "relay-cat": async ({ element: el }) => {
        state.relayCat = el.dataset.v || '全部';
        await renderRelay();
        return;
    },
    "auction-cat": async ({ element: el }) => {
        state.auctionCat = state.auctionCat === el.dataset.v ? '全部' : (el.dataset.v || '全部');
        if ($('.amz-goldbox-page')) { renderHome(); return; }
        await renderAuctions(desktopRuntime.currentView.name === 'auctionMine');
        return;
    },
    "auction-state": async ({ element: el }) => {
        state.auctionState = el.dataset.v || 'all';
        if ($('.amz-goldbox-page')) { renderHome(); return; }
        await renderAuctions(desktopRuntime.currentView.name === 'auctionMine');
        return;
    },
    "auction-sort": async ({ element: el }) => {
        state.auctionSort = el.dataset.v || 'default';
        if ($('.amz-goldbox-page')) { renderHome(); return; }
        await renderAuctions(desktopRuntime.currentView.name === 'auctionMine');
        return;
    },
    "auction-reset": async () => {
        state.auctionCat = '全部';
        if ($('.amz-goldbox-page')) {
            state.auctionState = '全部';
            state.auctionSort = 'default';
            renderHome();
            return;
        }
        state.auctionState = 'all';
        state.auctionSort = 'default';
        await renderAuctions(desktopRuntime.currentView.name === 'auctionMine');
        return;
    },
    "wish-cat": async ({ element: el }) => {
        state.wishCat = el.dataset.v || '全部';
        await renderWishes();
        return;
    },
    "amz-thumb": async ({ element: el }) => {
        var mainImg = $('#amz-main-img');
        if (mainImg && el.dataset.src) mainImg.src = el.dataset.src;
        document.querySelectorAll('.amz-thumb-btn').forEach(function (b) { b.classList.toggle('on', b === el); });
        return;
    },
    "publish-template": async ({ element: el }) => {
        var description=el.form.elements.description;
        var insertion=(description.value?'\n':'')+el.dataset.v;
        if(description.value.length+insertion.length>description.maxLength){toast('描述已接近字数上限','err');return;}
        description.value+=insertion;
        description.dispatchEvent(new Event('input',{bubbles:true}));
        description.focus();
        return;
    },
    "search-clear-history": async () => {
        if(!confirm('清空本机搜索历史？'))return;
        try{localStorage.removeItem('hq.searchHistory');}catch(e){}
        renderSearchPage('');return;
    },
    "search-term": async ({ element: el }) => {
        state.home.keyword=el.dataset.v;
        rememberSearch(state.home.keyword);
        if(await loadHome(true))renderHome();
        return;
    },
    "estimate": async () => { openEstimate();return; },
    "campus-search": async ({ element: el }) => {
        state.home.keyword=el.dataset.v;
        state.home.category='';
        state.home.condition='';
        go('#/search');
        return;
    },
    "home-feed": async ({ event: ev }) => {
        ev.preventDefault();
        (document.querySelector('.market-feed') || document.querySelector('.amz-shelf-wrap'))?.scrollIntoView({block:'start'});
        return;
    },
    "wish-close": async ({ element: el }) => { if(!confirm('关闭这条求换信息？'))return;await withBusy(el,async function(){await api('/wish/'+el.dataset.id+'/close',{method:'POST'}); if ($('.amz-goldbox-page')) { await ensureIdleTabData('wishes', true); renderHome(); } else { await renderWishes(); }});return; },
    "ai-pick-cat": async ({ element: el, action: act }) => {
        el.parentElement.querySelectorAll('.ai-chip').forEach(function (b) { b.classList.remove('on'); });
        el.classList.add('on');
        var hidden = document.getElementById(act === 'ai-pick-cat' ? 'ai-cat-input' : 'estimate-condition');
        if (hidden) hidden.value = el.dataset.v || '';
        return;
    },
    "ai-fill-bench": async ({ element: el }) => {
        var estTitle = document.getElementById('estimate-title');
        var estPrice = document.getElementById('estimate-price');
        var estForm = document.querySelector('[data-form=estimate]');
        if (estTitle) estTitle.value = el.dataset.name || '';
        if (estPrice) estPrice.value = el.dataset.orig || '';
        if (estForm && estForm.requestSubmit) estForm.requestSubmit();
        return;
    },
    "appraise-to-publish": async ({ element: el }) => {
        var prefill = {
            title: el.dataset.title || '',
            category: el.dataset.cat || '',
            conditionLevel: el.dataset.cond || '九成新',
            priceYuan: el.dataset.price || '',
            originalPriceYuan: el.dataset.orig || '',
            tradeMode: 4
        };
        try { sessionStorage.setItem('hq.appraisePrefill', JSON.stringify(prefill)); } catch (e) {}
        go('#/publish');
        return;
    },
    "auction-detail": async ({ element: el }) => {
        go('#/auction/' + Number(el.dataset.id));
        return;
    },
    "copy-auction-link": async () => {
        try { await navigator.clipboard.writeText(location.href); toast('已复制拍品链接', 'ok'); }
        catch (error) { prompt('复制这条拍品链接', location.href); }
        return;
    },
    "fill-bid-amt": async ({ element: el }) => {
        var bidInput = document.getElementById('modal-bid-amt');
        if (bidInput) bidInput.value = el.dataset.v || '';
        return;
    },
    "wish-respond": async ({ element: el }) => {
        var wid = Number(el.dataset.id);
        var wish = DEMO_WISHES.find(function (x) { return Number(x.id) === wid; });
        if (!wish) {
            var wList = await api('/wish', {optionalAuth: true}).catch(function () { return []; });
            wish = (Array.isArray(wList) ? wList : []).find(function (x) { return Number(x.id) === wid; });
        }
        if (!wish) { toast('未找到该求换心愿', 'err'); return; }
        var myItems = (readToken() || state.me) ? await api('/item/mine?status=1', {optionalAuth: true}).catch(function () { return []; }) : [];
        var myPickHtml = (myItems && myItems.length)
            ? '<div class="field" style="margin-top:12px"><label class="label">选择我的在架物品来匹配响应</label><div class="offer-pick-list">'
              + myItems.slice(0, 6).map(function (it) {
                  return '<button type="button" class="item-card" style="margin-bottom:8px" data-act="wish-match-pick" data-wid="' + wid + '" data-uid="' + (wish.userId || 0) + '" data-demo="' + (wish.isDemo ? '1' : '0') + '" data-cat="' + esc(wish.category || '') + '" data-title="' + esc(it.title) + '">'
                      + thumb(it) + '<div class="item-main"><h3 class="item-title">' + esc(it.title) + '</h3>'
                      + '<div class="item-foot"><span class="tag brand">' + esc(it.category) + '</span><span class="tag">' + esc(it.conditionLevel) + '</span></div></div></button>';
              }).join('') + '</div></div>'
            : '<p class="sub" style="margin-top:10px">你当前暂无在架物品，可以直接发布一件同类闲置来响应。</p>';
        openSheet('<div class="wish-modal-box">'
            + '<h3>响应同学求换心愿</h3>'
            + '<div class="auc-modal-top" style="margin-top:8px"><img src="' + esc(wish.image || '/assets/amz/quad-wishes-compact.webp') + '" alt=""><div>'
            + '<h4>' + esc(wish.title) + '</h4>'
            + '<p class="auc-modal-meta">发布人：' + esc(wish.nickname || '校园同学') + ' · 面交：' + esc(wish.campus || '重庆移通学院') + (wish.offerText ? ' · ' + esc(wish.offerText) : '') + '</p></div></div>'
            + (wish.content ? '<p class="auc-modal-desc">' + esc(wish.content) + '</p>' : '')
            + (wish.state === 'settled' ? '<p class="hint">该心愿已完成交换。</p>' : myPickHtml)
            + '<div class="btn-row" style="margin-top:12px">'
            + '<button type="button" class="btn btn-primary" data-act="relay-prefill-publish" data-cat="' + esc(wish.category || '其他') + '">发布符合该心愿的闲置</button>'
            + '<button type="button" class="btn btn-ghost" data-act="go" data-to="#/idle?cat=' + encodeURIComponent(wish.category || '') + '">逛同类好物</button>'
            + '</div></div>');
        return;
    },
    "wish-match-pick": async ({ element: el }) => {
        var wIsDemo = el.dataset.demo === '1';
        var wUid = Number(el.dataset.uid || 0);
        closeSheet();
        if (wIsDemo || !wUid) {
            toast('已向「' + (el.dataset.title || '你的物品') + '」生成心愿匹配意向，可在换物接力或集市继续配对', 'ok');
        } else {
            toast('已选定「' + (el.dataset.title || '') + '」去与发布人沟通互换', 'ok');
            go('#/user/' + wUid);
        }
        return;
    },
    "auction-bid": async ({ element: el }) => {
        if (!readToken() && !state.me) {
            if (!openAuthPopup('login', '#/auctions')) {
                sessionStorage.setItem('hq.returnTo', '#/auctions');
                go('#/login');
            }
            return;
        }
        openSheet('<h3>参与竞拍</h3><p class="sub">人民币出价，平台不提供支付。请遵守线下交易约定。</p><form data-form="auction-bid"><input type="hidden" name="id" value="' + esc(el.dataset.id) + '"><div class="field"><label class="label">出价（元）</label><input class="input" name="amount" type="number" min="0.01" step="0.01" required></div><button class="btn btn-primary btn-block" type="submit">确认出价</button></form>'); return;
    },
    "auction-bids": async ({ element: el }) => { await withBusy(el, async function(){ var bids=await api('/auction/'+el.dataset.id+'/bids'); openSheet('<h3>选择报价结算</h3><p class="sub">可选择任意报价；确认后拍卖结束，双方线下交易。</p>'+(bids.length?bids.map(function(b){return '<div class="bid-row"><span>'+esc(b.bidder)+' | ¥'+esc(b.amount)+'</span><button class="btn btn-sm" data-act="auction-settle" data-id="'+el.dataset.id+'" data-bid="'+b.id+'">选择成交</button></div>';}).join(''):'<p>暂无报价</p>')); }); return; },
    "auction-settle": async ({ element: el }) => { if(!confirm('确认选择该报价成交？拍卖将结束，不能撤销。'))return; await withBusy(el,async function(){await api('/auction/'+el.dataset.id+'/settle',{method:'POST',body:{bidId:el.dataset.bid}});closeSheet();toast('已结算');if (desktopRuntime.currentView.name === 'auctionDetail') await renderAuctionDetail(Number(el.dataset.id)); else await renderAuctions(true);});return; },
    "auction-cancel": async ({ element: el }) => { if (!confirm('确定取消这场拍卖？已有出价将失效。')) return; await withBusy(el, async function () { await api('/admin/auctions/' + el.dataset.id + '/cancel', {method:'POST'}); toast('拍卖已取消'); await renderAdmin(); }); return; },
    "f-cat": async ({ element: el, action: act }) => {
        var key = { 'f-cat': 'category', 'f-cond': 'condition', 'f-trademode': 'tradeMode', 'f-sort': 'sort', 'f-spot': 'campusSpot' }[act];
        var previous = state.home[key];
        var nextVal = act === 'f-trademode' ? Number(el.dataset.v || 0) : (el.dataset.v || '');
        if (act === 'f-spot' && state.home.campusSpot === nextVal && nextVal) nextVal = '';
        state.home[key] = nextVal;
        if ($('.amz-goldbox-page') && state.idleTab && state.idleTab !== 'all' && (act === 'f-cat' || act === 'f-cond' || act === 'f-spot')) {
            renderHome();
            return;
        }
        var feed = $('.market-feed');
        if (feed) {
            feed.setAttribute('aria-busy', 'true');
            var count = feed.querySelector('.feed-count');
            if (count) count.textContent = '正在筛选…';
        }
        var request = loadHome(true);
        var filterToken = homeLoadToken;
        try {
            if (await request) { renderHome(); if ($('#modal').innerHTML) openFilterSheet(); }
        } catch (error) {
            if (filterToken === homeLoadToken && desktopRuntime.currentView.name === 'home') {
                state.home[key] = previous;
                var count = feed?.querySelector('.feed-count');
                if (count) count.textContent = '筛选失败';
                toast(error.message || '筛选失败，请重试', 'err');
            }
        } finally {
            if (filterToken === homeLoadToken && feed?.isConnected) feed.removeAttribute('aria-busy');
        }
        return;
    },
    "open-filter": async () => {
        openFilterSheet();
        return;
    },
    "load-more": async ({ element: el }) => {
        if (desktopRuntime.loadingMoreItems || !state.home.hasMore || desktopRuntime.currentView.name !== 'home') return;
        if (moreItemsObserver) moreItemsObserver.disconnect();
        var previousPage = state.home.page;
        var moreRoute = location.hash;
        desktopRuntime.loadingMoreItems = true;
        state.home.page += 1;
        var nextPage = loadHome(false);
        var moreToken = homeLoadToken;
        await withBusy(el, async function () {
            try {
                if (await nextPage && location.hash === moreRoute) {
                    var scrollY = window.scrollY;
                    renderHome();
                    window.scrollTo(window.scrollX, scrollY);
                }
            } catch (error) {
                if (moreToken === homeLoadToken && location.hash === moreRoute) state.home.page = previousPage;
                throw error;
            } finally {
                desktopRuntime.loadingMoreItems = false;
            }
        });
        return;
    },
    "p-trademode": async ({ element: el }) => {
        syncPublishTradeMode(el.dataset.v);
        savePublishDraft(el.closest("form"));
        return;
    },
    "p-want": async ({ element: el }) => { var choices=state.publish.wantCategory ? state.publish.wantCategory.split(',') : []; var at=choices.indexOf(el.dataset.v); if(at>=0)choices.splice(at,1);else choices.push(el.dataset.v); state.publish.wantCategory=choices.join(',');markMultiWant(state.publish.wantCategory);savePublishDraft(el.closest("form"));return; },
    "p-cat": async ({ element: el, action: act }) => {
        var group = act === 'p-cat' ? 'category' : (act === 'p-cond' ? 'conditionLevel' : 'wantCategory');
        state.publish[group] = el.dataset.v;
        var wrap = el.parentNode;
        Array.prototype.forEach.call(wrap.children, function (c) {
            c.classList.toggle('on', c === el);
        });
        var hidden = wrap.parentNode.querySelector('input[type=hidden]');
        if (hidden) hidden.value = el.dataset.v;
        savePublishDraft(el.closest("form"));
        return;
    },
    "toggle-item": async ({ element: el }) => {
        await withBusy(el, async function () {
            await api('/item/' + el.dataset.id, {method: 'PUT', body: {status: Number(el.dataset.status)}});
            toast('已更新', 'ok');
            await render();
        });
        return;
    },
};
marketActions["ai-pick-cond"] = marketActions["ai-pick-cat"];
marketActions["f-cond"] = marketActions["f-cat"];
marketActions["f-trademode"] = marketActions["f-cat"];
marketActions["f-sort"] = marketActions["f-cat"];
marketActions["f-spot"] = marketActions["f-cat"];
marketActions["p-cond"] = marketActions["p-cat"];

const marketForms = {
    "wish-new": async ({ data: fd }) => {await api('/wish',{method:'POST',body:{title:fd.get('title'),category:fd.get('category'),content:fd.get('content'),offeredItemId:Number(fd.get('offeredItemId'))||null}});closeSheet();toast('求换已发布');if($('.amz-goldbox-page')){await ensureIdleTabData('wishes',true);renderHome();}else{await renderWishes();}return;},
    "auction-new": async ({ data: fd }) => {
        if (!state.publishImages.length) throw new ApiError('请上传拍品图片'); await api('/auction', {method:'POST', body:{title:fd.get('title'), description:fd.get('description'), amount:fd.get('amount'), hours:fd.get('hours'), image:state.publishImages.join(',')}}); toast('已提交审核'); go('#/auction/mine'); return;
    },
    "estimate": async ({ data: fd }) => {
        var price = Number(fd.get('price'));
        var condKey = fd.get('condition') || 'light';
        var range = {new: [0.75, 0.92], light: [0.55, 0.76], seven: [0.40, 0.60], used: [0.22, 0.45]}[condKey] || [0.50, 0.72];
        if (!Number.isFinite(price) || price < 1) throw new ApiError('请输入有效的入手价和成色');
        var low = Math.max(1, Math.round(price * range[0]));
        var high = Math.max(low + 1, Math.round(price * range[1]));
        var fastPrice = Math.round((low + high) / 2);
        var itemTitle = (fd.get('title') || '').trim() || '您的校园好物';
        var itemCat = fd.get('category') || '数码';
        var evalBox = document.getElementById('ai-mascot-Evaluating');
        var resBox = $('#estimate-result');
        if (evalBox) {
            evalBox.hidden = false;
            await new Promise(function (r) { setTimeout(r, 380); });
            evalBox.hidden = true;
        }
        var condZh = {new: '全新', light: '九成新', seven: '七成新', used: '有使用痕迹'}[condKey] || '九成新';
        if (resBox) {
            resBox.innerHTML = '<div class="ai-report-card">'
                + '<img src="/assets/brand/mascot-success.png" alt="小唤" class="ai-report-mascot">'
                + '<div class="ai-report-main">'
                + '<span class="ai-report-kicker">✓ 小唤估值 ' + esc(itemCat) + '</span>'
                + '<h3>「' + esc(itemTitle) + '」参考区间 <b>¥' + low + '–' + high + '</b></h3>'
                + '<p>建议标价：<b>¥' + fastPrice + '</b>（入手价 ¥' + price + '，保值率约 ' + Math.round(range[1] * 100) + '%）</p>'
                + '</div>'
                + '<div class="ai-report-actions">'
                + '<button type="button" class="btn btn-primary btn-sm" data-act="appraise-to-publish" data-title="' + esc(itemTitle === '您的校园好物' ? '' : itemTitle) + '" data-cat="' + esc(itemCat) + '" data-cond="' + esc(condZh) + '" data-price="' + esc(fastPrice) + '" data-orig="' + esc(price) + '">带此估值去发布 ›</button>'
                + '<a class="btn btn-ghost btn-sm" href="#/auction/new">去拍卖</a>'
                + '</div>'
                + '</div>';
        }
        return;
    },
    "auction-bid": async ({ data: fd }) => {
        var bidId = Number(fd.get('id'));
        if (!readToken() && !state.me) {
            if (!openAuthPopup('login', '#/auction/' + bidId)) go('#/login');
            return;
        }
        await api('/auction/' + bidId + '/bid', {method:'POST', body:{amount:fd.get('amount')}});
        closeSheet();
        toast('出价成功', 'ok');
        if (desktopRuntime.currentView.name === 'auctionDetail') await renderAuctionDetail(bidId);
        else go('#/auction/' + bidId);
        return;
    },
    "publish": async ({ form, data: fd }) => {
        var tm = Number(fd.get('tradeMode') || state.publish.tradeMode || 4);
        var pYuan = String(fd.get('priceYuan') || '').trim();
        var oYuan = String(fd.get('originalPriceYuan') || '').trim();
        var priceCents = pYuan ? Math.round(Number(pYuan) * 100) : 0;
        var origCents = oYuan ? Math.round(Number(oYuan) * 100) : 0;
        var body = {
            title: fd.get('title'),
            category: state.publish.category,
            conditionLevel: state.publish.conditionLevel,
            tradeMode: tm,
            price: priceCents,
            originalPrice: origCents,
            place: fd.get('place') || '',
            allowBargain: fd.get('allowBargain') ? 1 : 0,
            description: fd.get('description'),
            wantCategory: state.publish.wantCategory,
            wantText: fd.get('expectDesc') || '',
            matchMode: fd.get('matchMode'),
            expectDesc: fd.get('expectDesc'),
            images: state.publishImages.join(',')
        };
        if (!state.publishImages.length) throw new ApiError('请上传物品图片');
        if (!body.category) throw new ApiError('选一个类别');
        if (!body.conditionLevel) throw new ApiError('选一个成色');
        if (tm !== 2 && (!Number.isFinite(priceCents) || priceCents <= 0)) throw new ApiError('请填写有效的转让价格');
        if (tm !== 1 && !body.wantCategory) throw new ApiError('请至少选择一个想换物品类别');
        savePublishDraft(form);
        var editing = form.dataset.editId;
        var r = await api(editing ? '/item/'+editing : '/item', {method: editing ? 'PUT' : 'POST', body: body});
        sessionStorage.removeItem('hq.draft');
        toast('已提交审核', 'ok');
        go(editing?'#/item/'+editing:'#/publish/success/'+r.itemId);
    },
    "search": async ({ data: fd }) => {
        if (fd.has('category')) state.home.category = fd.get('category') || '';
        state.home.keyword = (fd.get('keyword') || '').trim();
        rememberSearch(state.home.keyword);
        if(location.hash!=='#/search'){go('#/search');}else if(await loadHome(true)){renderHome();}
    },
};

export { marketActions, marketForms };
