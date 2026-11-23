import {
    amzGoldAuctionCard,
    amzGoldItemCard,
    amzGoldRelayCard,
    amzGoldWishCard,
    pCard,
} from "../../components/desktop/catalog-cards.js";
import { navIcon } from "../../components/desktop/icons.js";
import { openSheet } from "../../components/desktop/sheet.js";
import { emptyState, shell, topnavSection } from "../../components/desktop/shell.js";
import { desktopRuntime, state } from "../../router/desktop/state.js";
import { api, readToken } from "../../utils/desktop/api.js";
import { CAMPUS_SPOTS, CATS, CONDS } from "../../utils/desktop/catalog.js";
import { $, esc } from "../../utils/desktop/dom.js";
import { firstImage } from "../../utils/desktop/format.js";
import { DEMO_WISHES } from "./wishes-desktop.js";

function campusServices(useClay) {
    var services = [
        ['door','校内配送','campus-search','校内可送','按关键词搜索'],
        ['trade','以物换物','home-feed',''],
        ['appraise','好物估价','estimate',''],
        ['book','教材专区','f-cat','教材'],
        ['grad','毕业季闲置','campus-search','毕业','按关键词搜索'],
        ['lost','失物招领','lost-found','','去社区发帖']
    ];
    return '<nav class="campus-services" aria-label="校园服务">'+services.map(function(service, index) {
        var icon=useClay?'<img src="/assets/brand/service-'+(27+index)+'.png" width="38" height="38" alt="">':navIcon(service[0]);
        return '<button type="button" data-act="'+service[2]+'" data-v="'+service[3]+'"><span class="campus-service-icon">'+icon+'</span><span>'+service[1]+'</span>'+(service[4]?'<small>'+service[4]+'</small>':'')+'</button>';
    }).join('')+'</nav>';
}

function searchHistory() {
    try { var list=JSON.parse(localStorage.getItem('hq.searchHistory')||'[]');return Array.isArray(list)?list.filter(function(term){return typeof term==='string';}):[]; }
    catch(e){return [];}
}

function rememberSearch(term) {
    if(!term)return;
    try{localStorage.setItem('hq.searchHistory',JSON.stringify([term].concat(searchHistory().filter(function(old){return old!==term;})).slice(0,12)));}catch(e){}
}

function renderSearchPage(results) {
    var term=state.home.keyword;
    var history=searchHistory();
    var suggestions=(history.length?history:['高数教材','宿舍收纳','羽毛球拍','机械键盘']).map(function(word){
        return '<button type="button" data-act="search-term" data-v="'+esc(word)+'">'+esc(word)+'</button>';
    }).join('');
    var form='<form class="mobile-search search-page-form" data-form="search"><span class="mobile-search-icon">'+navIcon('search')+'</span><input name="keyword" type="search" aria-label="搜索校园闲置" placeholder="搜索校园闲置" value="'+esc(term)+'"><button type="submit">搜索</button></form>';
    var landing='<section class="search-suggestions"><div class="redesign-heading"><h2>'+(history.length?'搜索历史':'试试这些关键词')+'</h2>'+(history.length?'<button class="link-btn" data-act="search-clear-history">清空历史</button>':'')+'</div><div class="search-terms">'+suggestions+'</div></section>';
    $('#app').innerHTML=shell('market','<section class="redesign-page search-page"><header class="redesign-heading"><a class="icon-action" href="#/home" aria-label="返回首页">'+navIcon('back')+'</a><h1>搜索闲置</h1>'+(term?'<button class="link-btn" data-act="search-term" data-v="">清除关键词</button>':'')+'</header>'+form+(term?results:landing)+'</section>');
}

async function ensureIdleTabData(tab, forceRefresh) {
    if (tab === 'auctions') {
        if (!state.idleCache.auctions || forceRefresh) {
            var aucRes = await api('/auction', {optionalAuth: true}).catch(function () { return []; });
            state.idleCache.auctions = Array.isArray(aucRes) ? aucRes : (aucRes && Array.isArray(aucRes.list) ? aucRes.list : []);
        }
    } else if (tab === 'relay') {
        if (!state.idleCache.myRelay || forceRefresh) {
            var mineRelay = (readToken() || state.me)
                ? await api('/item/mine?status=1', {optionalAuth: true}).catch(function () { return []; })
                : [];
            state.idleCache.myRelay = (mineRelay || []).filter(function (item) { return item.allowCycle && !item.isDemo; });
        }
    } else if (tab === 'wishes') {
        if (!state.idleCache.wishes || forceRefresh) {
            var wRes = await Promise.all([
                api('/wish', {optionalAuth: true}).catch(function () { return []; }),
                (readToken() || state.me) ? api('/item/mine?status=1', {optionalAuth: true}).catch(function () { return []; }) : Promise.resolve([])
            ]);
            state.idleCache.wishes = Array.isArray(wRes[0]) ? wRes[0] : [];
            state.idleCache.myShelf = (wRes[1] || []).filter(function (item) { return item.allowCycle && !item.isDemo; });
        }
    }
}

function renderHome() {
    var h = state.home;
    var baseHash = (location.hash || '#/home').split('?')[0];
    var idle = baseHash === '#/idle' || baseHash === '#/auctions' || baseHash === '#/relay' || baseHash === '#/wishes';
    var isSearch = baseHash === '#/search';
    var minCredit = Number(h.minCredit || 0);
    var maxPrice = Number(h.maxPrice === undefined ? 2000 : h.maxPrice);
    var activeTab = state.idleTab || 'all';
    var tmVal = Number(h.tradeMode || 0);
    var sortVal = h.sort || '';

    var visibleItems = h.items.filter(function (it) {
        if (!idle && !isSearch && !h.category && !window.campusExchange.isLiveSwap(it)) return false;
        if (minCredit > 0) {
            var c = it.ownerCredit === undefined || it.ownerCredit === null ? 80 : Number(it.ownerCredit);
            if (c < minCredit) return false;
        }
        if (maxPrice > 0 && maxPrice < 2000) {
            var yuan = Number(it.price || 0) / 100;
            if (yuan > maxPrice) return false;
        }
        return true;
    });

    var me = state.me;
    var categories = [
        ['', '全部好物'],
        ['教材', '图书教材'],
        ['数码', '数码设备'],
        ['生活', '宿舍生活'],
        ['运动', '运动户外'],
        ['衣物', '服饰穿搭'],
        ['绿植', '绿植花卉'],
        ['其他', '其他闲置']
    ];


    var amzHomeTop = '<section class="hq-home-intro" aria-label="校园换物入口">'
        + '<a class="hq-home-hero" href="#/relay">'
        + '<div class="hq-home-hero-copy"><h1>三人成环</h1><p>三位同学，各换到想要的闲置。</p>'
        + '<span class="hq-home-hero-action">找我的换物环' + navIcon('next') + '</span></div>'
        + '<img src="/assets/amz/home-spotlight-relay-scene.webp" width="580" height="290" alt="" decoding="async"></a>'
        + '<nav class="hq-home-links" aria-label="快捷入口">'
        + [
            ['#/idle', '逛集市', 'market', '发现校园闲置'],
            ['#/auctions', '校园拍卖', 'auction', '出价竞拍好物'],
            ['#/wishes', '心愿单', 'wishes', '发布求换需求']
        ].map(function (entry) {
            return '<a class="hq-home-link" href="' + entry[0] + '">'
                + '<img src="/assets/amz/home-spotlight-' + entry[2] + '.webp" width="144" height="144" alt="" decoding="async">'
                + '<strong>' + entry[1] + '</strong><small>' + entry[3] + '</small></a>';
        }).join('')
        + '</nav></section>';

    var homeRecommend = '<section class="market-feed"><div class="feed-heading"><div><h2>以物换物</h2></div><div class="feed-actions"><a class="amz-quad-more" href="#/idle">查看全部商品 ›</a></div></div>'
        + (visibleItems.length ? '<div class="pgrid">' + visibleItems.map(pCard).join('') + '</div>' : emptyState(navIcon('search'), '暂时没有找到好物', '', '<button class="btn btn-primary btn-sm" data-act="go" data-to="#/publish">发布闲置</button>'))
        + (h.hasMore ? '<div class="feed-more"><button class="btn btn-ghost" data-act="load-more">加载更多</button></div>' : '') + '</section>';

    var inIdleBrowse = idle || isSearch || h.category || h.condition || tmVal || sortVal || h.campusSpot || minCredit || (maxPrice > 0 && maxPrice < 2000);
    if (inIdleBrowse) {
        var channelsHtml = '<nav class="market-channels" aria-label="集市频道">'
            + [['all', '全部商品'], ['auctions', '校园拍卖'], ['relay', '换物接力'], ['wishes', '心愿单']].map(function (tab) {
                var selected = activeTab === tab[0];
                return '<button type="button" data-act="idle-pill" data-kind="tab" data-v="' + tab[0]
                    + '" aria-pressed="' + selected + '">' + tab[1] + '</button>';
            }).join('') + '</nav>';
        var categoriesHtml = '<div class="market-categories" aria-label="商品分类"><strong>分类</strong>'
            + categories.map(function (category) {
                return '<button type="button" data-act="f-cat" data-v="' + esc(category[0]) + '" aria-pressed="'
                    + (h.category === category[0]) + '">' + esc(category[1]) + '</button>';
            }).join('') + '</div>';
        var filtersHtml = '<details class="market-advanced"' + ($('.market-advanced[open]') ? ' open' : '') + '><summary>筛选条件</summary><div class="market-filter-panel">'
            + (activeTab === 'all'
                ? '<div class="amz-gs-group"><h3>交易方式</h3>'
                  + [[0, '全部方式'], [1, '明码标价'], [2, '以物换物'], [4, '可买可换']].map(function (t) {
                      var on = tmVal === t[0];
                      return '<button type="button" class="amz-gs-radio' + (on ? ' on' : '') + '" data-act="f-trademode" data-v="' + t[0] + '"><i class="amz-gs-dot"></i><span>' + t[1] + '</span></button>';
                  }).join('') + '</div>'
                : '')
            + (activeTab === 'auctions'
                ? '<div class="amz-gs-group"><h3>拍品状态</h3>'
                  + [['全部', '全部拍品'], ['正在进行', '正在进行'], ['一拍专场', '一拍专场'], ['毕业变卖', '毕业变卖']].map(function (st) {
                      var on = (state.auctionState || '全部') === st[0];
                      return '<button type="button" class="amz-gs-radio' + (on ? ' on' : '') + '" data-act="auction-state" data-v="' + st[0] + '"><i class="amz-gs-dot"></i><span>' + st[1] + '</span></button>';
                  }).join('') + '</div>'
                : '<div class="amz-gs-group"><h3>新旧成色</h3>'
                  + [['', '不限成色'], ['全新', '全新未拆'], ['九成新', '九成新'], ['七成新', '七成新'], ['有使用痕迹', '有使用痕迹']].map(function (c) {
                      var on = h.condition === c[0];
                      return '<button type="button" class="amz-gs-radio' + (on ? ' on' : '') + '" data-act="f-cond" data-v="' + esc(c[0]) + '"><i class="amz-gs-dot"></i><span>' + esc(c[1]) + '</span></button>';
                  }).join('') + '</div>')
            + '<div class="amz-gs-group"><h3>物主评价与信用</h3>'
            + [[0, '全部信用', ''], [90, '★★★★★', '90分以上'], [80, '★★★★☆', '80分以上'], [60, '★★★☆☆', '60分以上']].map(function (row) {
                var on = minCredit === row[0];
                return '<button type="button" class="amz-gs-radio' + (on ? ' on' : '') + '" data-act="f-credit" data-v="' + row[0] + '"><i class="amz-gs-dot"></i>'
                    + (row[2] ? '<span class="amz-stars">' + row[1] + '</span><span>' + row[2] + '</span>' : '<span>' + row[1] + '</span>')
                    + '</button>';
            }).join('')
            + '</div>'
            + '<div class="amz-gs-group"><h3>价格 / 估值上限</h3>'
            + '<div class="amz-gs-price-val" id="amz-price-readout">¥0 – ' + (maxPrice >= 2000 ? '¥2000+' : '¥' + maxPrice) + '</div>'
            + '<input type="range" class="amz-price-slider" id="amz-price-range" min="0" max="2000" step="20" value="' + maxPrice + '" aria-label="价格筛选上限">'
            + '</div>'
            + '<div class="amz-gs-group"><h3>校内面交点</h3>'
            + [['', '全部书院点位']].concat(CAMPUS_SPOTS.slice(0, 5).map(function (s) { return [s, s]; })).map(function (sp) {
                var on = (h.campusSpot || '') === sp[0];
                return '<button type="button" class="amz-gs-radio' + (on ? ' on' : '') + '" data-act="f-spot" data-v="' + esc(sp[0]) + '"><i class="amz-gs-dot"></i><span>' + esc(sp[1]) + '</span></button>';
            }).join('')
            + '</div>'
            + '</div></details>';

        // 计算当前专场卡片列表
        var gridToolbarHtml = '';
        var cardsHtml = '';
        var moreHtml = '';
        var filterCat = h.category || '';
        var filterSpot = h.campusSpot || '';

        if (activeTab === 'auctions') {
            var rawAuc = state.idleCache.auctions || [];
            var aSt = state.auctionState || '全部';
            var aSort = state.auctionSort || 'default';
            var listAuc = rawAuc.filter(function (a) {
                if (filterCat && a.cat !== filterCat && String(a.title + ' ' + (a.description || '')).indexOf(filterCat) < 0) return false;
                if (aSt === '正在进行' && a.state !== 'active') return false;
                if (aSt === '一拍专场' && a.stage !== '一拍') return false;
                if (aSt === '毕业变卖' && a.stage !== '变卖' && String(a.title).indexOf('毕业') < 0) return false;
                if (filterSpot && String(a.campus || '').indexOf(filterSpot.slice(0, 2)) < 0) return false;
                if (maxPrice > 0 && maxPrice < 2000 && Number(a.currentPrice || 0) > maxPrice) return false;
                return true;
            }).slice();
            if (aSort === 'price-asc') listAuc.sort(function (a, b) { return Number(a.currentPrice || 0) - Number(b.currentPrice || 0); });
            else if (aSort === 'price-desc') listAuc.sort(function (a, b) { return Number(b.currentPrice || 0) - Number(a.currentPrice || 0); });
            else if (aSort === 'bids') listAuc.sort(function (a, b) { return Number(b.bidCount || 0) - Number(a.bidCount || 0); });

            gridToolbarHtml = '<div class="amz-gb-toolbar">'
                + '<span class="amz-gb-count">校园拍卖 · 共 ' + listAuc.length + ' 件拍品</span>'
                + '<div class="amz-gb-actions">'
                + '<button type="button" class="' + (aSort === 'default' ? 'on' : '') + '" data-act="auction-sort" data-v="default">综合</button>'
                + '<button type="button" class="' + (aSort === 'price-asc' || aSort === 'price-desc' ? 'on' : '') + '" data-act="auction-sort" data-v="' + (aSort === 'price-desc' ? 'price-asc' : 'price-desc') + '">当前价' + (aSort === 'price-asc' ? '↑' : '↓') + '</button>'
                + '<button type="button" class="' + (aSort === 'bids' ? 'on' : '') + '" data-act="auction-sort" data-v="bids">出价最多</button>'
                + '<a href="#/auction/mine" class="amz-gb-cta-link">我的拍卖</a>'
                + '<a href="#/auction/new" class="amz-gb-cta-btn">+ 发起拍卖</a>'
                + '</div></div>';
            cardsHtml = listAuc.length
                ? listAuc.map(amzGoldAuctionCard).join('')
                : '<div class="amz-gb-empty">暂无符合条件拍品 <button type="button" class="link-btn" data-act="auction-reset">重置筛选</button></div>';
        } else if (activeTab === 'relay') {
            var myRelays = (state.idleCache.myRelay || []).map(function (it) {
                return { id: Number(it.id), cat: it.category || '其他', isDemo: false, state: 'active', title: it.title, want: it.wantCategory || '任意好物', value: Math.round(Number(it.price || 10000) / 100), image: firstImage(it.images) || '/assets/amz/quad-relay-compact.webp' };
            });
            var listRelay = myRelays.filter(function (r) {
                if (filterCat && r.cat !== filterCat && String(r.title + ' ' + r.want).indexOf(filterCat) < 0) return false;
                if (filterSpot && String(r.campus || '').indexOf(filterSpot.slice(0, 2)) < 0) return false;
                if (maxPrice > 0 && maxPrice < 2000 && Number(r.value || 0) > maxPrice) return false;
                return true;
            });
            gridToolbarHtml = '<div class="amz-gb-toolbar">'
                + '<span class="amz-gb-count">换物接力 · 共 ' + listRelay.length + ' 组可闭环标的</span>'
                + '<div class="amz-gb-actions">'
                + (myRelays.length ? myRelays.slice(0, 2).map(function (mr) { return '<a href="#/cycle/' + mr.id + '" class="amz-gb-cta-link">查「' + esc(mr.title.slice(0, 8)) + '」闭环 ›</a>'; }).join('') : '')
                + '<a href="#/publish" class="amz-gb-cta-btn">+ 发布接力闲置</a>'
                + '</div></div>';
            cardsHtml = listRelay.length
                ? listRelay.map(amzGoldRelayCard).join('')
                : '<div class="amz-gb-empty">当前分类暂无接力标的 <button type="button" class="link-btn" data-act="f-cat" data-v="">查看全部</button></div>';
        } else if (activeTab === 'wishes') {
            var rawWishes = (state.idleCache.wishes || []).concat(DEMO_WISHES);
            var listWishes = rawWishes.filter(function (w) {
                if (filterCat && w.category !== filterCat && String(w.title + ' ' + (w.offerText || '')).indexOf(filterCat) < 0) return false;
                if (filterSpot && String(w.campus || '').indexOf(filterSpot.slice(0, 2)) < 0) return false;
                if (maxPrice > 0 && maxPrice < 2000 && Number(w.budget || 0) > maxPrice) return false;
                return true;
            });
            gridToolbarHtml = '<div class="amz-gb-toolbar">'
                + '<span class="amz-gb-count">求换专区 · 共 ' + listWishes.length + ' 条心愿</span>'
                + '<div class="amz-gb-actions">'
                + '<button type="button" class="amz-gb-cta-btn" data-act="open-wish-modal">+ 发布求换心愿</button>'
                + '</div></div>';
            cardsHtml = listWishes.length
                ? listWishes.map(amzGoldWishCard).join('')
                : '<div class="amz-gb-empty">暂无求换心愿 <button type="button" class="link-btn" data-act="f-cat" data-v="">查看全部</button></div>';
        } else {
            gridToolbarHtml = '<div class="amz-gb-toolbar">'
                + '<span class="amz-gb-count">' + (isSearch && !minCredit ? '共 ' + h.total + ' 件搜索结果' : '校园闲置 · 共 ' + visibleItems.length + ' 件好物') + '</span>'
                + '<div class="amz-gb-actions">'
                + [['', '综合'], ['latest', '最新'], ['price_asc', '价格↑'], ['price_desc', '价格↓']].map(function (s) {
                    return '<button type="button" class="' + (sortVal === s[0] ? 'on' : '') + '" data-act="f-sort" data-v="' + s[0] + '">' + s[1] + '</button>';
                }).join('')
                + '<a href="#/publish" class="amz-gb-cta-btn">+ 发布闲置</a>'
                + '</div></div>';
            cardsHtml = visibleItems.length
                ? visibleItems.map(amzGoldItemCard).join('')
                : emptyState(isSearch ? '<img class="search-empty-mascot" src="/assets/brand/mascot-search.png" width="110" height="110" alt="">' : navIcon('search'), '暂时没有找到好物', '换个搜索词或调整筛选条件试试', '<button class="btn btn-primary btn-sm" data-act="go" data-to="#/publish">发布闲置</button>');
            moreHtml = h.hasMore ? '<div class="feed-more"><button class="btn btn-ghost" data-act="load-more">加载更多</button></div>' : '';
        }

        var mainContentHtml = '<div class="amz-gold-main">'
            + '<div class="market-controls">' + gridToolbarHtml + filtersHtml + '</div>'
            + '<div class="amz-gold-grid">' + cardsHtml + '</div>'
            + moreHtml
            + '</div>';

        var goldShellHtml = '<div class="amz-goldbox-page desktop-market">'
            + channelsHtml + categoriesHtml
            + '<div class="amz-gold-body">' + mainContentHtml + '</div>'
            + '</div>';

        if (isSearch) {
            renderSearchPage(goldShellHtml);
            watchMoreItems();
            return;
        }
        var prevBrowseY = window.scrollY;
        var prevGoldPage = $('.amz-goldbox-page');
        if (prevGoldPage && $('.shell')) {
            prevGoldPage.outerHTML = goldShellHtml;
            var activeHref = '#/' + topnavSection('idle');
            document.querySelectorAll('.topnav a').forEach(function (link) {
                var selected = link.getAttribute('href') === activeHref;
                link.classList.toggle('on', selected);
                if (selected) link.setAttribute('aria-current', 'page');
                else link.removeAttribute('aria-current');
            });
            window.scrollTo(window.scrollX, prevBrowseY);
        } else {
            $('#app').innerHTML = shell('idle', goldShellHtml);
        }
        watchMoreItems();
        return;
    }
    $('#app').innerHTML = shell('market', '<div class="market-home amz-home-layout">' + amzHomeTop + '<div class="amz-shelf-wrap">' + homeRecommend + '</div></div>');
    watchMoreItems();
}

var moreItemsObserver;

function watchMoreItems() {
    if (moreItemsObserver) moreItemsObserver.disconnect();
    var button = $('[data-act="load-more"]');
    if (!button || !window.IntersectionObserver) return;
    var route = location.hash;
    moreItemsObserver = new IntersectionObserver(function (entries, observer) {
        if (!button.isConnected || location.hash !== route) {
            observer.disconnect();
            return;
        }
        if (!desktopRuntime.loadingMoreItems && entries.some(function (entry) { return entry.isIntersecting; })) {
            observer.disconnect();
            button.click();
        }
    }, {rootMargin: '0px 0px 100px 0px'});
    moreItemsObserver.observe(button);
}

function openFilterSheet() {
    var h = state.home;
    var tModes = [[0,'全部'],[1,'明码标价'],[2,'以物换物'],[4,'可买可换']].map(function(t){
        return '<button class="chip ' + (Number(h.tradeMode||0) === t[0] ? 'on' : '') + '" data-act="f-trademode" data-v="' + t[0] + '">' + t[1] + '</button>';
    }).join('');
    var cats = '<button class="chip ' + (h.category === '' ? 'on' : '') + '" data-act="f-cat" data-v="">全部</button>'
        + CATS.map(function (c) {
            return '<button class="chip ' + (h.category === c ? 'on' : '') + '" data-act="f-cat" data-v="'
                + esc(c) + '">' + c + '</button>';
        }).join('');
    var conds = '<button class="chip ' + (h.condition === '' ? 'on' : '') + '" data-act="f-cond" data-v="">不限</button>'
        + CONDS.map(function (c) {
            return '<button class="chip ' + (h.condition === c ? 'on' : '') + '" data-act="f-cond" data-v="'
                + esc(c) + '">' + c + '</button>';
        }).join('');
    openSheet('<h3>筛选</h3><p class="sub">选完立刻生效，点空白处关闭。</p>'
        + '<div class="field"><label class="label">交易方式</label><div class="chips">' + tModes + '</div></div>'
        + '<div class="field"><label class="label">类别</label><div class="chips">' + cats + '</div></div>'
        + '<div class="field" style="margin-bottom:6px"><label class="label">成色</label>'
        + '<div class="chips">' + conds + '</div></div>');
}

var homeLoadToken = 0;

var homeRequest;

async function loadHome(reset) {
    var token=++homeLoadToken;
    if (homeRequest) homeRequest.abort();
    homeRequest = new AbortController();
    var options = {signal: homeRequest.signal, noCache: true};
    var h = state.home;
    if (reset) {
        if (moreItemsObserver) moreItemsObserver.disconnect();
        h.hasMore = false;
        h.page = 1;
        h.items = [];
    }
    var params = '?page=' + h.page + '&size=24';
    if (h.category) params += '&category=' + encodeURIComponent(h.category);
    if (h.condition) params += '&conditionLevel=' + encodeURIComponent(h.condition);
    if (Number(h.tradeMode) > 0) params += '&tradeMode=' + Number(h.tradeMode);
    else if (!h.category && ['#/home', '#/market'].includes((location.hash || '#/home').split('?')[0])) params += '&tradeMode=2';
    if (h.sort) params += '&sort=' + encodeURIComponent(h.sort);
    if (h.campusSpot) params += '&building=' + encodeURIComponent(h.campusSpot);
    var baseLoadHash = (location.hash || '#/home').split('?')[0];
    if (baseLoadHash !== '#/search') {
        try {
            var dataList = await api('/item/list' + params, options);
            if (token !== homeLoadToken || desktopRuntime.currentView.name !== 'home') return false;
            var rows = (dataList && dataList.list) || [];
            if (h.page === 1 && !rows.length && h.campusSpot) {
                // 若该点位暂无专属记录，提示并回落全校好物列表，不让页面空窗
                dataList = await api('/item/list' + params.replace(/&building=[^&]*/, ''), options);
                if (token !== homeLoadToken || desktopRuntime.currentView.name !== 'home') return false;
                rows = (dataList && dataList.list) || [];
            }
            h.items = h.items.concat(rows);
            h.total = (dataList && dataList.total) || h.items.length;
            h.hasMore = !!(dataList && dataList.hasMore);
            return true;
        } catch (error) {
            if (error.name === 'AbortError') return false;
            throw error;
        }
    }
    var keyword = encodeURIComponent(h.keyword);
    var useKeyword = !!h.keyword && !reset && h.keywordFallback;
    var listPath = '/item/list' + params + (keyword ? '&keyword=' + keyword : '');
    var data;
    try {
        data = await api(keyword && !useKeyword ? '/item/search' + params + '&q=' + keyword : listPath, options);
    } catch (error) {
        if (error.name === 'AbortError') return false;
        if (!keyword || useKeyword || error.code !== 503) throw error;
        if (token !== homeLoadToken || desktopRuntime.currentView.name !== 'home') return false;
        if (!reset && h.page > 1) {
            h.page = 1;
            h.items = [];
            listPath = listPath.replace(/\?page=\d+/, '?page=1');
        }
        try { data = await api(listPath, options); }
        catch (fallbackError) {
            if (fallbackError.name === 'AbortError') return false;
            throw fallbackError;
        }
        useKeyword = true;
    }
    if (token !== homeLoadToken || desktopRuntime.currentView.name !== 'home') return false;
    h.keywordFallback = useKeyword;
    h.items = h.items.concat(data.list || []);
    h.total = data.total || 0;
    h.hasMore = !!data.hasMore;
    h.searchConditions = data.conditions || [];
    return true;
}

export {
    ensureIdleTabData,
    homeLoadToken,
    loadHome,
    moreItemsObserver,
    openFilterSheet,
    rememberSearch,
    renderHome,
    renderSearchPage,
};
