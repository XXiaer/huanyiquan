import { clayIcon } from "../../components/desktop/icons.js";
import { emptyState, loading, shell } from "../../components/desktop/shell.js";
import { desktopRuntime, state } from "../../router/desktop/state.js";
import { api } from "../../utils/desktop/api.js";
import { $, esc } from "../../utils/desktop/dom.js";
import { firstDisplayImage, firstImage, thumb } from "../../utils/desktop/format.js";

function relayCard(r) {
    var isSettled = r.state === 'settled';
    var actAttr = 'data-act="go" data-to="#/cycle/' + Number(r.id) + '"';
    return '<article class="relay-card-clean">'
        + '<div class="clean-card-media" style="cursor:pointer" ' + actAttr + '>'
        + '<img src="' + esc(r.image || '/assets/amz/quad-relay-compact.webp') + '" onerror="this.onerror=null;this.src=\'/assets/amz/quad-relay-compact.webp\'" alt="' + esc(r.title) + '" loading="lazy">'
        + (isSettled ? '<span class="clean-state-tag is-done">已闭环</span>' : '')
        + '</div>'
        + '<div class="clean-card-body">'
        + '<h2 class="clean-card-title" title="' + esc(r.title) + '">' + esc(r.title) + '</h2>'
        + '<div class="clean-card-meta-row">'
        + '<span class="relay-want-line" title="想换 ' + esc(r.want || '校园好物') + '">想换 ' + esc(r.want || '任意好物') + '</span>'
        + '<button type="button" class="clean-act-btn is-teal ' + (isSettled ? 'is-muted' : '') + '" ' + actAttr + '>'
        + (r.isDemo ? (isSettled ? '查看闭环' : '去加环') : '搜闭环')
        + '</button>'
        + '</div>'
        + '</div>'
        + '</article>';
}

async function renderRelay() {
    var items = [];
    var authHint = '';
    try {
        items = (await api('/item/mine?status=1', {optionalAuth:true})).filter(function(item) { return item.allowCycle && !item.isDemo; });
    } catch (error) {
        authHint = error.code === 401 ? '登录后可一键匹配我的闲置闭环' : esc(error.message);
    }
    if (desktopRuntime.currentView.name !== 'relay') return;

    var myRelayCards = items.map(function (it) {
        return {
            id: Number(it.id),
            cat: it.category || '其他',
            isDemo: false,
            state: 'active',
            title: it.title,
            want: it.wantCategory || '任意好物',
            image: firstImage(it.images) || '/assets/amz/quad-relay-compact.webp'
        };
    });
    var fullList = myRelayCards;
    var activeCat = state.relayCat || '全部';
    var displayList = activeCat === '全部' ? fullList : fullList.filter(function (r) {
        return r.cat === activeCat || String(r.title + ' ' + r.want).indexOf(activeCat) >= 0;
    });
    var myQuickLinks = items.length
        ? '<div class="relay-my-strip"><b>我的接力物品：</b>'
          + items.map(function (item) {
              return '<a class="relay-pill-link" href="#/cycle/' + Number(item.id) + '">' + clayIcon('swap', '接力', 'is-sm') + ' ' + esc(item.title) + ' ›</a>';
          }).join('') + '</div>'
        : '<div class="relay-my-strip"><span>' + (authHint || '发布支持接力的闲置即可参与三方成环') + '</span><a class="relay-pill-link" href="#/publish">+ 发布接力闲置 ›</a></div>';

    var content = '<div class="relay-eco-page">'
        + '<header class="relay-topo-hero">'
        + '<div class="relay-hero-left">'
        + '<span class="relay-hero-badge">三方接力匹配</span>'
        + '<h1>换物接力广场</h1>'
        + '<div class="relay-nav-tabs">'
        + '<a href="#/relay" class="on">接力池 (' + fullList.length + ')</a>'
        + '<a href="#/wishes">求换专区</a>'
        + '<a href="#/auctions">校园拍卖</a>'
        + '<a href="#/exchange">我的交换单</a>'
        + '</div>'
        + '</div>'
        + '<div class="relay-chain-diagram" aria-label="三方换物闭环示意图">'
        + '<div class="relay-node"><b>甲同学</b><span>出 A 换 B</span></div>'
        + '<span class="relay-arrow">➔</span>'
        + '<div class="relay-node"><b>乙同学</b><span>出 B 换 C</span></div>'
        + '<span class="relay-arrow">➔</span>'
        + '<div class="relay-node"><b>丙同学</b><span>出 C 换 A</span></div>'
        + '<span class="relay-arrow is-loop">↺ 成环</span>'
        + '</div>'
        + '<div class="relay-hero-mascot">'
        + '<img src="/assets/brand/mascot-wave-320.webp" alt="小唤">'
        + '<a class="btn btn-primary btn-sm" href="#/publish">+ 参与接力</a>'
        + '</div>'
        + '</header>'

        + myQuickLinks

        + '<div class="relay-filter-bar">'
        + '<div class="relay-cat-pills">'
        + [['全部', '全部标的 (' + fullList.length + ')'], ['数码', '数码外设'], ['教材', '考研教材'], ['运动', '运动户外'], ['生活', '宿舍生活']].map(function (c) {
            return '<button type="button" class="' + (activeCat === c[0] ? 'on' : '') + '" data-act="relay-cat" data-v="' + c[0] + '">' + c[1] + '</button>';
        }).join('')
        + '</div>'
        + '<a class="relay-ai-link" href="#/appraise">拿不准估值？找小唤算算 ›</a>'
        + '</div>'

        + '<div class="relay-eco-grid">'
        + (displayList.length ? displayList.map(relayCard).join('') : '<div class="card card-pad" style="grid-column:1/-1;text-align:center">当前分类暂无接力标的 <button type="button" class="btn btn-sm btn-primary" data-act="relay-cat" data-v="全部">查看全部</button></div>')
        + '</div>'
        + '</div>';

    var prevRelayY = window.scrollY;
    var relayRoot = $('.relay-eco-page');
    if (relayRoot) {
        relayRoot.outerHTML = content;
        window.scrollTo(window.scrollX, prevRelayY);
    } else {
        $('#app').innerHTML = shell('relay', content);
    }
}

async function renderCycle(itemId) {
    $('#app').innerHTML = shell('home', loading());
    var rings = [];
    try {
        rings = await api('/cycle/' + itemId);
    } catch (e) {
        if (e && e.code === 401) return;
        $('#app').innerHTML = shell('home', '<div class="page-head"><h1>暂无法查找换物环</h1>'
            + '<p>' + esc((e && e.message) || '该物品暂不满足闭环条件') + '</p></div>'
            + '<div class="btn-row">'
            + '<a class="btn btn-primary btn-sm" href="#/item/' + encodeURIComponent(itemId) + '/edit">去编辑物品</a>'
            + '<a class="btn btn-ghost btn-sm" href="#/relay">返回换物接力</a>'
            + '</div>');
        return;
    }

    if (!rings || rings.length === 0) {
        $('#app').innerHTML = shell('home', '<div class="page-head"><h1>暂时凑不成环</h1>'
            + '<p>三个人的意向必须首尾相接。差一环的时候，缺的往往是别人的一件物品。</p></div>'
            + emptyState(clayIcon('swap', '换物环', 'is-lg'), '没有找到闭合的换法', '可以再发一件物品，或者等别人补上新意向',
                '<button class="btn btn-primary btn-sm" data-act="go" data-to="#/publish">再发一件</button>'));
        return;
    }

    var cardHtml = rings.map(function (r, idx) {
        var items = r.items || [];
        var users = r.users || [];
        // 三个节点：0 在正上方，1 在右下，2 在左下。节点 = 物品 + 主人
        var pos = [
            {left: '50%', top: '17%'},
            {left: '79%', top: '68%'},
            {left: '21%', top: '68%'}
        ];
        var nodes = items.map(function (it, i) {
            return '<div class="ring-node" style="left:' + pos[i].left + ';top:' + pos[i].top + '">'
                + (firstDisplayImage(it.images) ? thumb(it, 'thumb') : '<div class="thumb ring-text-thumb" aria-hidden="true">' + esc((it.title || '物').slice(0, 1)) + '</div>')
                + '<div class="rn-title">' + esc(it.title) + '</div>'
                + '<div class="rn-owner">' + esc(i === 0 ? '我' : users[i]?.nickname || '同学')
                + (users[i] && users[i].credit != null ? ' | ' + Number(users[i].credit) + ' 信用分' : '')
                + (users[i]?.building ? '<br>' + esc(users[i].building) : '') + '</div>'
                + '</div>';
        }).join('');
        var svg = '<svg viewBox="0 0 300 300" aria-hidden="true">'
            + '<circle cx="150" cy="150" r="98" fill="none" stroke="var(--theme-soft)" stroke-width="2" stroke-dasharray="7 7"/>'
            + '<defs><marker id="ah' + idx + '" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">'
            + '<path d="M0,0 L6,3 L0,6 z" fill="var(--theme-ink)"/></marker></defs>'
            + '<path d="M262 106 A98 98 0 0 1 262 194" fill="none" stroke="var(--theme-color)" stroke-width="1.6" '
            + 'marker-end="url(#ah' + idx + ')"/>'
            + '<path d="M196 262 A98 98 0 0 1 104 262" fill="none" stroke="var(--theme-color)" stroke-width="1.6" '
            + 'marker-end="url(#ah' + idx + ')"/>'
            + '<path d="M38 194 A98 98 0 0 1 38 106" fill="none" stroke="var(--theme-color)" stroke-width="1.6" '
            + 'marker-end="url(#ah' + idx + ')"/>'
            + '</svg>';

        return '<article class="card card-pad hq-ring-option">'
            + '<div class="ring">' + svg + nodes
            + '<div class="ring-center"><b>三方闭环</b><span>各得一件</span></div>'
            + '</div><div class="hq-ring-copy"><h2>换法 ' + (idx + 1) + ' / ' + rings.length + '</h2>'
            + '<p><b>我给出：</b>' + esc(items[0]?.title || '待确定') + '</p>'
            + '<p><b>我收到：</b>' + esc(items[2]?.title || '待确定') + '</p>'
            + '<p class="hint">' + esc(r.flow) + '</p>'
            + '<p class="hint" style="margin:0 0 12px">' + esc(r.explain || '') + '</p>'
            + '<p class="hint">三件物品将锁定，三人需在 ' + (Number(r.confirmationHours) || 24) + ' 小时内确认。有人退出或超时则解锁。</p>'
            // 主按钮放在建议面交之前，保证一屏之内看得到
            + '<button class="btn btn-accent btn-block" data-act="create-ring" data-id="'
            + itemId + '" data-ids="' + (r.itemIds || []).join(',') + '">就选这组，成环</button>'
            + (r.place ? '<p class="hint">建议面交：' + esc(r.place) + '</p>' : '')
            + '</div></article>';
    }).join('');

    $('#app').innerHTML = shell('home', '<div class="page-head"><h1>找到 ' + rings.length + ' 组换法</h1>'
        + '<p>从下方候选换法中选择一组。</p></div>' + cardHtml);
}

export { relayCard, renderCycle, renderRelay };
