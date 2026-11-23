import { clayIcon, navIcon } from "../../components/desktop/icons.js";
import { renderJdWorkspace } from "../../components/desktop/shell.js";
import { toast } from "../../components/desktop/toast.js";
import { esc } from "../../utils/desktop/dom.js";
import { cashPrice, firstDisplayImage } from "../../utils/desktop/format.js";

function shelfRead(key) {
    try { var data=JSON.parse(localStorage.getItem('hq.shelf.'+key)||'[]');return Array.isArray(data)?data:[]; }catch(e){return [];}
}

function shelfWrite(key,items) {
    try { localStorage.setItem('hq.shelf.'+key,JSON.stringify(items.slice(0,100)));return true; }catch(e){toast('浏览器无法保存记录','err');return false;}
}

function shelfRemember(key,it) {
    return shelfWrite(key,[{id:Number(it.id),title:it.title,category:it.category,images:it.images,
        price:it.price, tradeMode:it.tradeMode, isDemo:!!it.isDemo}].concat(shelfRead(key).filter(function(x){return x.id!==Number(it.id);})));
}

function shelfCard(it, key) {
    var id = Number(it.id);
    var href = '#/item/' + id;
    var img = firstDisplayImage(it.images);
    var title = it.title || '校园好物';
    var label = it.isDemo ? '仅展示' : (Number(it.price) > 0 ? cashPrice(it.price) : it.tradeMode === 2 ? '以物换物' : '');
    return '<article class="jd-history-card"><div class="jd-h-media"><a href="' + href + '" class="jd-h-img-link">'
        + (img ? '<img src="' + esc(window.catalogThumbnail(img)) + '" alt="" loading="lazy" decoding="async">'
            : '<span class="shelf-no-image">' + navIcon('box') + '<span>暂无实拍图</span></span>')
        + '</a>'
        + (key ? '<button type="button" class="jd-h-del" data-act="shelf-remove" data-key="' + key + '" data-id="' + id + '" title="移出记录">✕</button>' : '')
        + '</div><div class="jd-h-body"><a href="' + href + '" class="jd-h-title">' + esc(title) + '</a>'
        + '<div class="jd-h-price-row"><strong class="jd-h-price">' + esc(label) + '</strong>'
        + '<a href="' + href + '" class="jd-h-plus" aria-label="查看详情">+</a></div></div></article>';
}

function renderShelf() {
    var key = siteRoutes.current() === '#/history' ? 'history' : 'favorites';
    var savedItems = shelfRead(key);
    var displayList = savedItems;
    var cards = displayList.map(function (it) { return shelfCard(it, key); }).join('');

    var mainHtml = '<div class="jd-order-main jd-footprint-main">'
        + '<header class="jd-footprint-head">'
        + '<div class="jd-footprint-brand">'
        + '<img src="/assets/brand/mascot-search.png" alt="">'
        + '<b>换一圈</b>'
        + '<span class="jd-fp-div">|</span>'
        + '<h1>' + (key === 'favorites' ? '商品收藏' : '我的足迹') + '</h1>'
        + '<nav class="jd-fp-tabs" aria-label="收藏与足迹切换">'
        + '<a href="#/history" class="' + (key === 'history' ? 'on' : '') + '">我的足迹 (' + shelfRead('history').length + ')</a>'
        + '<a href="#/favorites" class="' + (key === 'favorites' ? 'on' : '') + '">商品收藏 (' + shelfRead('favorites').length + ') <i>有降价</i></a>'
        + '</nav>'
        + '</div>'
        + '<form class="jd-fp-search" data-form="search">'
        + '<input name="keyword" placeholder="搜索足迹与校内同款好物…" aria-label="搜索商品">'
        + '<a href="#/appraise" class="jd-fp-ai-toggle" title="AI 好物估价">AI 估价 <i></i></a>'
        + '<button type="submit">搜索</button>'
        + '</form>'
        + '</header>'
        + '<div class="jd-fp-date-bar">'
        + '<div class="jd-fp-date-left"><b>' + (key === 'favorites' ? '我的收藏' : '浏览足迹') + '</b><span>' + displayList.length + ' 件</span></div>'
        + '<button type="button" class="jd-fp-clear-btn" data-act="shelf-clear" data-key="' + key + '">' + clayIcon('order', '清空', 'is-sm') + ' 全部清空</button>'
        + '</div>'
        + '<div class="jd-history-grid">' + cards + '</div>'
        + '<p class="jd-fp-end"><img src="/assets/brand/mascot-wave-320.webp" alt=""> 没有更多' + (key === 'favorites' ? '收藏商品' : '浏览记录') + '啦~</p>'
        + '</div>';

    renderJdWorkspace('me', key, mainHtml, true);
}

export { renderShelf, shelfCard, shelfRead, shelfRemember, shelfWrite };
