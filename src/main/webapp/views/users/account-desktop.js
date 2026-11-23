import { creditLevelOf } from "../../components/desktop/credit.js";
import { clayIcon } from "../../components/desktop/icons.js";
import {
    loading,
    markJdWorkspaceBusy,
    renderJdWorkspace,
    shell,
} from "../../components/desktop/shell.js";
import { state } from "../../router/desktop/state.js";
import { api } from "../../utils/desktop/api.js";
import { CATS } from "../../utils/desktop/catalog.js";
import { $, esc, safeRoute } from "../../utils/desktop/dom.js";
import { firstImage, fmtDate, thumb } from "../../utils/desktop/format.js";
import { getAllRooms, getRoomFollows } from "../community/desktop.js";
import { auctionCard } from "../market/auction-desktop.js";
import { DEMO_WISHES, wishAuctionCard } from "../market/wishes-desktop.js";
import { conversationRows } from "../messages/room-desktop.js";
import { relayCard } from "../orders/relay-desktop.js";
import { syncCodeCountdowns } from "./auth-desktop.js";

async function renderMeSub(tab) {
    var me = state.me || {};
    if (!markJdWorkspaceBusy()) $('#app').innerHTML = shell('me', loading());
    var panelTitle = '个人中心', panelSub = '', panelActions = '', bodyHtml = '';

    function wrapPanel() {
        return '<div class="jd-order-main jd-me-subpanel">'
            + '<div class="jd-order-title-bar"><h2>' + esc(panelTitle) + '</h2>'
            + (panelSub ? '<span>' + esc(panelSub) + '</span>' : '')
            + (panelActions ? '<div class="jd-subbar-right">' + panelActions + '</div>' : '')
            + '</div>'
            + '<div class="jd-order-panel">' + bodyHtml + '</div>'
            + '</div>';
    }

    if (tab === 'items') {
        panelTitle = '我发布的闲置';
        panelSub = '统一查看管理我发布的全部在架、待审核、已下架与已换出物品';
        panelActions = '<a class="btn btn-primary btn-sm" href="#/publish">+ 发布新闲置</a><a class="btn btn-ghost btn-sm" href="#/me">返回个人中心 ›</a>';
        var myAllItems = await api('/item/mine').catch(function () { return []; });
        var curFilter = String(state.meFilter || 'all');
        var filteredItems = (myAllItems || []).filter(function (it) {
            return curFilter === 'all' || String(it.status) === curFilter;
        });
        var filterTabs = [['all', '全部 (' + (myAllItems || []).length + ')'], ['1', '在架'], ['2', '待审核'], ['4', '已下架'], ['3', '已换出']].map(function (t) {
            return '<button type="button" class="' + (curFilter === t[0] ? 'on' : '') + '" data-act="me-filter" data-v="' + t[0] + '">' + t[1] + '</button>';
        }).join('');
        var listHtml = filteredItems.length ? '<div class="desk-grid-2">' + filteredItems.map(function (it) {
            var st = it.status === 1 ? 'success' : (it.status === 2 ? 'accent' : 'ghost');
            var priceLabel = it.tradeMode === 2 ? '仅以物换物' : (it.price ? '¥' + (Number(it.price) / 100).toFixed(2) : '面议');
            var modeLabel = it.matchMode === 'one' ? '仅一对一' : (it.matchMode === 'active' ? '闭环·主动找环' : '闭环·自动匹配');
            return '<div class="card card-pad" style="display:flex;gap:12px;align-items:center">'
                + '<a href="#/item/' + Number(it.id) + '" style="flex:none">' + thumb(it) + '</a>'
                + '<div style="flex:1;min-width:0">'
                + '<p class="item-title"><a href="#/item/' + Number(it.id) + '">' + esc(it.title) + '</a></p>'
                + '<div class="item-foot" style="margin-top:6px"><span class="amz-status-txt ' + st + '">' + esc(it.statusText || '在架') + '</span><span> · ' + esc(priceLabel) + ' · ' + esc(modeLabel) + ' · ' + (it.offerCount > 0 ? it.offerCount + ' 报价' : '暂无报价') + '</span></div>'
                + '</div>'
                + '<div style="display:flex;flex-direction:column;gap:6px;flex:none">'
                + '<a class="btn btn-sm btn-ghost" href="#/item/' + Number(it.id) + '">详情</a>'
                + ((it.status === 1 || it.status === 4 || it.status === 5 || it.status === 6) ? '<button class="btn btn-sm btn-ghost" data-act="go" data-to="#/item/' + it.id + '/edit">编辑</button>' : '')
                + (it.status === 1
                    ? '<button class="btn btn-sm btn-ghost" data-act="toggle-item" data-id="' + it.id + '" data-status="4">下架</button>'
                    : ((it.status === 4 || it.status === 6)
                        ? '<button class="btn btn-sm btn-ghost" data-act="toggle-item" data-id="' + it.id + '" data-status="1">上架</button>'
                        : ''))
                + (it.status === 1 && it.allowCycle ? '<button class="btn btn-sm btn-primary" data-act="cycle" data-id="' + it.id + '">找环</button>' : '')
                + '</div></div>';
        }).join('') + '</div>'
            : '<div class="jd-empty-order-box"><img src="/assets/brand/mascot-box.png" alt="小唤"><div class="jd-empty-order-copy"><p>' + (curFilter === 'all' ? '还没有发布过任何闲置物品' : '当前筛选状态下暂无物品') + '</p><div class="jd-empty-btns"><a class="jd-btn-red" href="#/publish">立即发布闲置</a></div></div></div>';
        bodyHtml = '<div class="desk-me-bar" style="margin-bottom:16px"><div class="segmented">' + filterTabs + '</div></div>' + listHtml;
        renderJdWorkspace('me', tab, wrapPanel(), true);
        return;
    }

    if (tab === 'auctions') {
        panelTitle = '我的竞拍活动';
        panelSub = '发布与参与的校园拍卖实时进度';
        panelActions = '<a class="btn btn-primary btn-sm" href="#/auction/new">+ 发起拍卖</a><a class="btn btn-ghost btn-sm" href="#/auctions">全部拍卖 ›</a>';
        var myAuctions = await api('/auction/mine').catch(function () { return []; });
        bodyHtml = (myAuctions && myAuctions.length)
            ? '<div class="ali-auction-grid jd-sub-grid">' + myAuctions.map(function (a) { return auctionCard(a, 'mine'); }).join('') + '</div>'
            : '<div class="jd-empty-order-box"><img src="/assets/brand/mascot-box.png" alt="小唤"><div class="jd-empty-order-copy"><p>暂未发布过个人拍卖</p><div class="jd-empty-btns"><a class="jd-btn-red" href="#/auction/new">立即发起拍卖</a><a class="jd-btn-outline" href="#/auctions">去竞拍大厅捡漏</a></div></div></div>';
        renderJdWorkspace('me', tab, wrapPanel(), true);
        return;
    }

    if (tab === 'reviews') {
        panelTitle = '评价晒单';
        panelSub = '管理待评价交换单与同学对你的口碑';
        panelActions = '<a class="btn btn-ghost btn-sm" href="#/exchange">我的交换单 ›</a>';
        var revRes = await Promise.all([
            api('/review/pending').catch(function () { return []; }),
            api('/review/user/' + Number(me.id || 0)).catch(function () { return []; })
        ]);
        var pendingList = revRes[0] || [], recReviews = revRes[1] || [];
        var pendingHtml = pendingList.length
            ? '<div class="jd-sub-block"><h3>' + clayIcon('chat', '待评价', 'is-sm') + ' 待评价交易 (' + pendingList.length + ')</h3><div class="jd-sub-cards">'
              + pendingList.map(function (p) {
                  return '<div class="jd-sub-item-card"><div><b>与 ' + esc(p.nickname || '校内同学') + ' 的交换</b><small>交换单 #' + Number(p.exchangeId) + ' | 完成后可互相加信用分</small></div>'
                      + '<button type="button" class="btn btn-primary btn-sm" data-act="user-review" data-exchange="' + p.exchangeId + '" data-id="' + p.userId + '" data-nick="' + esc(p.nickname) + '">立即评价</button></div>';
              }).join('') + '</div></div>'
            : '<div class="jd-sub-banner-tip">' + clayIcon('star', '评价', 'is-sm') + '<span>暂无待评价交换单，完成一次校园换物即可解锁评价奖励信用分。</span><a href="#/exchange" class="btn btn-sm btn-ghost">查看交换单</a></div>';
        var recHtml = recReviews.length
            ? '<div class="jd-sub-block"><h3>收到的同学评价 (' + recReviews.length + ')</h3><div class="desk-grid-2">'
              + recReviews.map(function (r) {
                  return '<div class="list-row" style="cursor:default"><div class="avatar" style="width:32px;height:32px;border-radius:8px;font-size:12px">' + esc((r.fromNickname || '同').slice(0, 1)) + '</div>'
                      + '<div class="row-main"><p class="row-title"><button class="name-link" data-act="go" data-to="#/user/' + r.fromUser + '">' + esc(r.fromNickname || '同学') + '</button> '
                      + '<span class="amz-stars">' + '★'.repeat(Math.max(1, Number(r.score || 5))) + '</span></p><p class="row-sub">' + esc(r.content || '交易顺利，物超所值！') + '</p></div>'
                      + '<span class="hint">' + fmtDate(r.createTime) + '</span></div>';
              }).join('') + '</div></div>'
            : '<div class="jd-sub-block"><h3>历史晒单示范</h3><div class="jd-sub-cards"><div class="jd-sub-item-card"><div><b>罗技 GPW 二代无线鼠标互换成功</b><span class="amz-stars">★★★★★</span><small>北山书院当面验货，成色和描述一模一样！</small></div><span class="tag success">+2 信用分</span></div></div></div>';
        bodyHtml = pendingHtml + recHtml;
        renderJdWorkspace('me', tab, wrapPanel(), true);
        return;
    }

    if (tab === 'wishes') {
        panelTitle = '求换心愿单';
        panelSub = '我发布的求换需求与高匹配校园心愿';
        panelActions = '<a class="btn btn-primary btn-sm" href="#/wishes">前往求换大厅 ›</a>';
        var allWishes = await api('/wish', {optionalAuth: true}).catch(function () { return []; });
        var myWishes = (allWishes || []).filter(function (w) { return me.id && w.userId === me.id; });
        var wishQuickForm = '<form class="jd-sub-inline-form" data-form="wish-new">'
            + '<input class="input" name="title" maxlength="80" placeholder="输入想换的宝贝，如：高数笔记本 / 机械键盘" required>'
            + '<select class="select" name="category"><option value="">选择分类</option>' + CATS.map(function (c) { return '<option>' + esc(c) + '</option>'; }).join('') + '</select>'
            + '<input class="input" name="content" maxlength="200" placeholder="可用来交换的物品/面交书院">'
            + '<button type="submit" class="btn btn-primary btn-sm">发布心愿</button>'
            + '</form>';
        var myWishHtml = myWishes.length
            ? myWishes.map(function (w) {
                return '<div class="jd-sub-item-card"><div><b>' + esc(w.title) + '</b><small>' + esc(w.category || '全品类') + ' | ' + esc(w.content || '校内当面互换') + '</small></div>'
                    + '<button type="button" class="btn btn-sm btn-ghost" data-act="wish-close" data-id="' + w.id + '">关闭心愿</button></div>';
            }).join('')
            : '<p class="hint">你还没有发布求换心愿，可在上方直接提交，或浏览下方热门心愿快速响应。</p>';
        bodyHtml = '<div class="jd-sub-block"><h3>' + clayIcon('star', '心愿', 'is-sm') + ' 快速新增求换心愿</h3>' + wishQuickForm + '</div>'
            + '<div class="jd-sub-block"><h3>我的求换列表 (' + myWishes.length + ')</h3><div class="jd-sub-cards">' + myWishHtml + '</div></div>'
            + '<div class="jd-sub-block"><h3>校园热门求换推荐</h3><div class="wish-bounty-grid jd-sub-4col">' + DEMO_WISHES.slice(0, 4).map(wishAuctionCard).join('') + '</div></div>';
        renderJdWorkspace('me', tab, wrapPanel(), true);
        return;
    }

    if (tab === 'channels') {
        panelTitle = '关注的频道';
        panelSub = '我订阅的校园贴吧与实时聊天室';
        panelActions = '<button type="button" class="btn btn-primary btn-sm" data-act="open-create-room">+ 创建聊天室</button><a class="btn btn-ghost btn-sm" href="#/community">进入社区 ›</a>';
        var rooms = getAllRooms();
        var follows = getRoomFollows();
        bodyHtml = '<div class="jd-sub-cards jd-channel-cards">' + rooms.map(function (r) {
            var isFollowed = follows.indexOf(r.id) >= 0;
            return '<div class="jd-sub-item-card">'
                + '<div class="jd-sub-ico-row">' + clayIcon(r.icon || 'fire', r.name, 'is-lg')
                + '<div><b>' + esc(r.name) + '</b><small>' + esc(r.desc || '校园主题交流与闲置晒单贴吧') + ' | ' + (r.members || 320) + ' 人关注</small></div></div>'
                + '<div class="jd-sub-btn-row">'
                + '<button type="button" class="btn btn-sm ' + (isFollowed ? 'btn-ghost' : 'btn-primary') + '" data-act="toggle-follow-room" data-room="' + esc(r.id) + '">' + (isFollowed ? '已关注' : '+ 关注') + '</button>'
                + '<button type="button" class="btn btn-sm btn-primary" data-act="open-room" data-room="' + esc(r.id) + '">进入贴吧</button>'
                + '</div></div>';
        }).join('') + '</div>';
        renderJdWorkspace('me', tab, wrapPanel(), true);
        return;
    }

    if (tab === 'appraise') {
        panelTitle = '小唤 AI 好物估价';
        panelSub = '结合移通校园历史成交价，智能测算闲置参考区间';
        panelActions = '<a class="btn btn-ghost btn-sm" href="#/appraise">全屏估价台 ›</a>';
        bodyHtml = '<div class="jd-sub-ai-wrap">'
            + '<form class="estimate-form ai-form-body" data-form="estimate">'
            + '<div class="ai-input-row">'
            + '<div class="ai-field"><label class="label" for="estimate-title">物品名称</label><input class="input" id="estimate-title" name="title" placeholder="例如 罗技 GPW 二代 / 同济高数第七版"></div>'
            + '<div class="ai-field"><label class="label" for="estimate-price">入手原价（元）*</label><input class="input" id="estimate-price" name="price" type="number" min="1" max="100000" placeholder="¥ 请输入入手价，如 299" required></div>'
            + '</div>'
            + '<input type="hidden" id="ai-cat-input" name="category" value="数码">'
            + '<input type="hidden" id="estimate-condition" name="condition" value="light">'
            + '<div class="ai-chip-section"><span class="ai-sec-label">所属分类</span><div class="ai-chip-grid">'
            + CATS.map(function (c, i) { return '<button type="button" class="ai-chip ' + (i === 1 ? 'on' : '') + '" data-act="ai-pick-cat" data-v="' + esc(c) + '">' + esc(c) + '</button>'; }).join('')
            + '</div></div>'
            + '<div class="ai-chip-section"><span class="ai-sec-label">新旧成色</span><div class="ai-chip-grid cond-grid">'
            + [['new', '全新', '90%~95%'], ['light', '九成新', '65%~80%'], ['seven', '七成新', '45%~65%'], ['used', '有使用痕迹', '25%~45%']].map(function (c, i) {
                return '<button type="button" class="ai-chip ' + (i === 1 ? 'on' : '') + '" data-act="ai-pick-cond" data-v="' + esc(c[0]) + '"><b>' + c[1] + '</b><small>' + c[2] + '</small></button>';
            }).join('')
            + '</div></div>'
            + '<div class="ai-submit-row"><button class="btn btn-primary ai-submit-btn" type="submit">' + clayIcon('ai', 'AI', 'is-sm') + ' 立即开始 AI 智能估价</button></div>'
            + '<div id="ai-mascot-Evaluating" class="ai-evaluating-box" hidden><img src="/assets/brand/mascot-search.png" alt="小唤正在估价中" class="ai-eval-mascot"><div><b>小唤正在为您估价…</b></div></div>'
            + '<div id="estimate-result" class="ai-result-panel" role="status"><div class="ai-result-placeholder"><img src="/assets/brand/mascot-wave-320.webp" alt="小唤"><div><b>输入入手原价后点击上方按钮，“小唤”立即给出参考价</b></div></div></div>'
            + '</form>'
            + '</div>';
        renderJdWorkspace('me', tab, wrapPanel(), true);
        return;
    }

    if (tab === 'vouchers') {
        panelTitle = '三方换物凭证';
        panelSub = '校内面交核验码与多方闭环交易电子存证';
        panelActions = '<a class="btn btn-primary btn-sm" href="#/relay">发起新接力 ›</a>';
        var exList = await api('/exchange/mine').catch(function () { return []; });
        var realVouchers = (exList || []).map(function (e) {
            return '<div class="jd-voucher-card"><div class="jd-v-head"><b>存证编号 #HQ-EX-' + (200000 + Number(e.id || 0)) + '</b><span class="tag success">' + esc(e.statusText || '担保生效中') + '</span></div>'
                + '<p>' + (e.type === 3 ? '三方闭环接力换物凭证' : '一对一校园面交凭证') + ' | 约定点位：' + esc(e.place || '北山书院一楼大厅') + '</p>'
                + '<div class="jd-v-foot"><span>核验码：<b>YT-' + String(1000 + Number(e.id || 77) * 13).slice(-4) + '</b></span><a href="#/exchange/' + Number(e.id) + '" class="btn btn-sm btn-ghost">查看履约详情 ›</a></div></div>';
        }).join('');
        var demoVoucher = '<div class="jd-voucher-card is-demo"><div class="jd-v-head"><b>三方闭环示范凭证 #HQ-RING-809</b><span class="tag brand">已完成交接</span></div>'
            + '<p>罗技 GPW 二代无线鼠标 ➔ 张宇考研高数笔记 ➔ 拍立得相机礼盒（A→B→C 同城三方免差价闭环）</p>'
            + '<div class="jd-v-foot"><span>核验书院：图书馆一楼大厅</span><a href="#/relay" class="btn btn-sm btn-primary">去参与三方接力</a></div></div>';
        bodyHtml = '<div class="jd-sub-cards">' + (realVouchers || '') + demoVoucher + '</div>';
        renderJdWorkspace('me', tab, wrapPanel(), true);
        return;
    }

    if (tab === 'quota') {
        panelTitle = '闲置上架额度';
        panelSub = '校园信用分越高，可同时在架展示的闲置席位越多';
        panelActions = '<a class="btn btn-primary btn-sm" href="#/publish">+ 发布新闲置</a>';
        var myItems = await api('/item/mine').catch(function () { return []; });
        var activeCount = (myItems || []).filter(function (i) { return i.status === 1; }).length;
        var maxSlots = (me.credit || 80) >= 90 ? 15 : (me.credit || 80) >= 80 ? 10 : 6;
        var pct = Math.min(100, Math.round((activeCount / maxSlots) * 100));
        bodyHtml = '<div class="jd-quota-hero">'
            + '<div><b>当前已使用在架额度：<em>' + activeCount + '</em> / ' + maxSlots + ' 件</b><p>当前信用等级：' + esc(creditLevelOf(me.credit).text) + '（' + (me.credit || 80) + '分），完成面交与评价可解锁至最高 15 件席位</p></div>'
            + '<div class="jd-quota-bar"><i style="width:' + pct + '%"></i></div>'
            + '</div>'
            + '<div class="jd-sub-block"><h3>我的上架记录 (' + (myItems || []).length + ')</h3><div class="desk-grid-2">'
            + ((myItems || []).length ? myItems.map(function (it) {
                return '<div class="card card-pad" style="display:flex;gap:12px;align-items:center">' + thumb(it)
                    + '<div style="flex:1;min-width:0"><p class="item-title">' + esc(it.title) + '</p><div class="item-foot"><span class="tag ghost">' + esc(it.statusText) + '</span></div></div>'
                    + (it.status === 1 ? '<button class="btn btn-sm btn-ghost" data-act="toggle-item" data-id="' + it.id + '" data-status="4">下架</button>'
                        : '<button class="btn btn-sm btn-primary" data-act="go" data-to="#/item/' + it.id + '">查看</button>')
                    + '</div>';
            }).join('') : '<p class="hint">暂无上架商品，点击右上角发布第一件闲置好物吧。</p>')
            + '</div></div>';
        renderJdWorkspace('me', tab, wrapPanel(), true);
        return;
    }

    if (tab === 'credit') {
        panelTitle = '校园信用分';
        panelSub = '重庆移通学院校内真实履约信用档案';
        panelActions = '<a class="btn btn-ghost btn-sm" href="#/me/quota">查看额度权益 ›</a>';
        var score = Number(me.credit || 80);
        var lvl = creditLevelOf(score);
        bodyHtml = '<div class="jd-credit-hero">'
            + '<div class="jd-credit-dial"><img src="/assets/amz/mascot-credit-card.png" alt="小唤"><div><strong>' + score + '</strong><span>信用等级：' + esc(lvl.text) + '</span></div></div>'
            + '<div class="jd-credit-perks">'
            + '<div>' + clayIcon('swap', '免押') + '<b>校内免押面交</b><small>双方实名学号信用担保</small></div>'
            + '<div>' + clayIcon('auction', '拍卖') + '<b>1元拍卖免门槛</b><small>信誉良好直接参与出价</small></div>'
            + '<div>' + clayIcon('wallet', '额度') + '<b>最高 ' + (score >= 90 ? 15 : 10) + ' 件上架席位</b><small>优质物主优先曝光推荐</small></div>'
            + '</div></div>'
            + '<div class="jd-sub-block"><h3>信用分加减明细规则</h3><div class="jd-credit-rules-grid">'
            + '<div class="jd-rule-box"><b>完成 1 次校内换物面交</b><span>+3 分</span></div>'
            + '<div class="jd-rule-box"><b>获得同学 5 星好评晒单</b><span>+2 分</span></div>'
            + '<div class="jd-rule-box"><b>完成学校官方邮箱认证</b><span>+5 分</span></div>'
            + '<div class="jd-rule-box is-warn"><b>爽约未面交或恶意出价</b><span>-10 分</span></div>'
            + '</div></div>';
        renderJdWorkspace('me', tab, wrapPanel(), true);
        return;
    }

    if (tab === 'campus-auctions') {
        panelTitle = '校园拍卖';
        panelSub = '热门校园1元起拍与毕业清仓专场（在个人中心内快速出价）';
        panelActions = '<a class="btn btn-primary btn-sm" href="#/auction/new">+ 发起拍卖</a><a class="btn btn-ghost btn-sm" href="#/auctions">全屏拍卖大厅 ›</a>';
        var aucRes = await api('/auction', {optionalAuth: true}).catch(function () { return []; });
        var aList = Array.isArray(aucRes) ? aucRes : (aucRes && aucRes.list) || [];
        bodyHtml = '<div class="ali-auction-grid jd-sub-grid">' + aList.slice(0, 8).map(function (a) { return auctionCard(a, 'public'); }).join('') + '</div>';
        renderJdWorkspace('me', tab, wrapPanel(), true);
        return;
    }

    if (tab === 'relay') {
        panelTitle = '换物接力大厅';
        panelSub = '三方 A→B→C 智能匹配成环，换出你真正想要的好物';
        panelActions = '<a class="btn btn-primary btn-sm" href="#/publish">+ 发布接力闲置</a><a class="btn btn-ghost btn-sm" href="#/relay">全屏接力广场 ›</a>';
        var relayMine = (await api('/item/mine?status=1').catch(function () { return []; })).filter(function (i) { return i.allowCycle; });
        var rHtml = relayMine.map(function (it) {
            return relayCard({id: it.id, isDemo: false, state: 'active', title: it.title, want: it.wantCategory || '任意好物', image: firstImage(it.images) || '/assets/amz/quad-relay-compact.webp'});
        }).join('');
        bodyHtml = '<div class="relay-eco-grid jd-sub-4col">' + rHtml + '</div>';
        renderJdWorkspace('me', tab, wrapPanel(), true);
        return;
    }

    if (tab === 'arcade') {
        panelTitle = 'Scrap Arena 街机';
        panelSub = '移通同学双人同屏格斗休闲区 | 换物间隙松一口气';
        panelActions = '<a class="btn btn-primary btn-sm" href="/scrap-arena/index.html" target="_blank" rel="noopener">新窗口全屏</a><a class="btn btn-ghost btn-sm" href="#/community/game">全屏街机房 ›</a>';
        bodyHtml = '<div class="game-frame-wrap jd-arcade-embed"><iframe class="game-frame" src="/scrap-arena/index.html" title="Scrap Arena 游戏" allow="fullscreen; autoplay"></iframe></div>'
            + '<p class="game-note" style="margin-top:10px">操作提示：点击画面开始，P1：W/A/S/D + J/K/L；P2：方向键 + 1/2/3；按 Enter 开战。</p>';
        renderJdWorkspace('me', tab, wrapPanel(), true);
        return;
    }

    if (tab === 'security') {
        panelTitle = '个人信息与安全';
        panelSub = '学号实名档案、校园邮箱绑定与个性化主题配置';
        panelActions = '<a class="btn btn-ghost btn-sm" href="#/settings">更多偏好设置 ›</a>';
        var emailData = await api('/user/email').catch(function () { return {}; });
        bodyHtml = '<div class="jd-security-grid">'
            + '<form class="card card-pad" data-form="profile"><h3>基本资料</h3>'
            + '<div class="field"><label class="label">昵称</label><input class="input" name="nickname" maxlength="20" value="' + esc(me.nickname || '') + '" required></div>'
            + '<div class="field"><label class="label">学院</label><input class="input" name="college" maxlength="40" value="' + esc(me.college || '') + '" placeholder="如 大数据与软件学院"></div>'
            + '<div class="field"><label class="label">常驻书院/宿舍</label><input class="input" name="building" maxlength="30" value="' + esc(me.building || '') + '" placeholder="如 北山书院 / 松格"></div>'
            + '<button type="submit" class="btn btn-primary btn-sm">保存资料</button></form>'
            + '<div class="card card-pad"><h3>账号安全与邮箱认证</h3>'
            + '<p class="hint">登录学号：<b>' + esc(me.studentNo || '已认证同学') + '</b> | 邮箱状态：' + (emailData.email ? '<span class="tag success">已认证：' + esc(emailData.email) + '</span>' : '<span class="tag accent">待认证</span>') + '</p>'
            + (emailData.available
                ? '<form data-form="email-send" style="margin-bottom:10px"><div class="field"><label class="label">绑定邮箱</label><input class="input" name="email" type="email" placeholder="name@example.com" required></div><button class="btn btn-sm btn-ghost" type="submit" data-code-key="bind-email" data-idle-text="发送验证码">发送验证码</button></form>'
                  + '<form data-form="email-verify"><div class="field"><label class="label">6位验证码</label><input class="input" name="code" maxlength="6" placeholder="输入邮件中的6位数字" required></div><button class="btn btn-sm btn-primary" type="submit">完成认证</button></form>'
                : '<p class="hint">校内邮箱验证通道由管理员统一配置，当前学号登录已受本地加密凭证保护。</p>')
            + '<div style="margin-top:16px;padding-top:12px;border-top:1px solid #EEE;display:flex;gap:10px"><a href="#/settings" class="btn btn-sm btn-ghost">切换主题色</a><button type="button" class="btn btn-sm btn-ghost" data-act="logout">退出当前账号</button></div>'
            + '</div></div>';
        renderJdWorkspace('me', tab, wrapPanel(), true);
        syncCodeCountdowns();
        return;
    }

    // default / notices
    panelTitle = '消息通知中心';
    panelSub = '报价提醒、面交变动与私聊会话同步预览';
    panelActions = '<button type="button" class="btn btn-ghost btn-sm" data-act="notice-read">全部标为已读</button><a class="btn btn-primary btn-sm" href="#/notifications">打开聊天窗口 ›</a>';
    var nRes = await Promise.all([
        api('/notification').catch(function () { return []; }),
        api('/conversation').catch(function () { return []; })
    ]);
    var noticeList = nRes[0] || [], convList = nRes[1] || [];
    bodyHtml = '<div class="jd-sub-block"><h3>系统与交易通知 (' + noticeList.length + ')</h3><div class="notice-list">'
        + (noticeList.length ? noticeList.map(function (n) {
            var target = safeRoute(n.target, '#/notifications');
            return '<a class="notice-row ' + (n.read ? '' : 'is-unread') + '" href="' + esc(target) + '" data-act="notice-open" data-id="' + Number(n.id) + '" data-to="' + esc(target) + '"><span class="notice-dot"></span><div class="notice-body"><b>' + esc(n.title) + '</b><span>' + esc(n.content) + '</span></div><time>' + esc(String(n.createdAt || '').slice(0, 16)) + '</time></a>';
        }).join('') : '<p class="hint">暂无未读系统通知，可在上方打开聊天窗口查看同学留言。</p>')
        + '</div></div>'
        + '<div class="jd-sub-block"><h3>最近私聊会话 (' + convList.length + ')</h3><div class="conversation-list">' + conversationRows(convList) + '</div></div>';
    renderJdWorkspace('me', tab, wrapPanel(), true);
}

export { renderMeSub };
