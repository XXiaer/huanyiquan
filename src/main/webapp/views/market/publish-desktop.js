import { CAT_ICON, navIcon } from "../../components/desktop/icons.js";
import { shell } from "../../components/desktop/shell.js";
import { toast } from "../../components/desktop/toast.js";
import { desktopRuntime, readSavedCampusSpot, state } from "../../router/desktop/state.js";
import { ApiError, api } from "../../utils/desktop/api.js";
import { CAMPUS_SPOTS, CATS, CONDS } from "../../utils/desktop/catalog.js";
import { $, esc } from "../../utils/desktop/dom.js";

function renderPublishEntry() {
    $('#app').innerHTML=shell('publish','<nav class="amz-breadcrumb" aria-label="面包屑"><a href="#/home">首页</a><span>›</span><b>发布中心</b></nav>'
        +'<section class="redesign-page publish-entry amz-seller-hub"><header class="amz-hub-head"><div><h1>发布中心</h1><p>让闲置在同学之间流转。发布换物、拍卖或心愿单。</p></div><img src="/assets/brand/mascot-box.png" width="88" height="88" alt=""></header>'
        +'<div class="amz-hub-grid">'
        +'<a class="amz-hub-card amz-hub-main" href="#/publish/edit"><span class="amz-hub-ico">'+navIcon('box')+'</span><div><strong>发布闲置物品</strong><small>支持以物换物、标价流转与三方换物接力</small></div><span class="btn btn-primary btn-sm">立即发布</span></a>'
        +'<a class="amz-hub-card" href="#/auction/new"><span class="amz-hub-ico">'+navIcon('auction')+'</span><div><strong>发起校园拍卖</strong><small>设置起拍价与竞拍时长，价高者得</small></div><span class="btn btn-ghost btn-sm">去发起</span></a>'
        +'<a class="amz-hub-card" href="#/wishes"><span class="amz-hub-ico">'+navIcon('wish')+'</span><div><strong>发布求换心愿</strong><small>写下想换的物品，匹配自动提醒</small></div><span class="btn btn-ghost btn-sm">去发布</span></a>'
        +'<button type="button" class="amz-hub-card" data-act="estimate"><span class="amz-hub-ico">'+navIcon('appraise')+'</span><div><strong>AI 好物估价</strong><small>拍照或填参数，智能评估参考价格</small></div><span class="btn btn-ghost btn-sm">去估价</span></button>'
        +'</div></section>');
}

function renderPublish() {
    var catChips = CATS.map(function (c) {
        return '<button type="button" class="chip" data-act="p-cat" data-v="' + esc(c) + '">'
            + (CAT_ICON[c] || '') + ' ' + c + '</button>';
    }).join('');
    var condChips = CONDS.map(function (c) {
        return '<button type="button" class="chip" data-act="p-cond" data-v="' + esc(c) + '">' + c + '</button>';
    }).join('');
    var wantChips = CATS.map(function (c) {
        return '<button type="button" class="chip" data-act="p-want" data-v="' + esc(c) + '">' + c + '</button>';
    }).join('');

    var content = '<nav class="amz-breadcrumb" aria-label="面包屑"><a href="#/home">首页</a><span>›</span><a href="#/publish">发布中心</a><span>›</span><b>发布闲置物品</b></nav>'
        + '<section class="redesign-page publish-editor amz-form-layout"><div class="page-head"><h1>发布闲置物品</h1>'
        + '<p>上传图片并提交审核，约 1 分钟未处理将自动极速通过。</p></div>'
        + '<div class="amz-form-grid"><form id="publish-form" data-form="publish" class="card card-pad"><p class="publish-error" role="alert" tabindex="-1" hidden></p>'
        + '<div class="field"><label class="label">图片 <span class="opt">最多 3 张，每张 ≤2MB</span></label>'
        + '<div class="chips" id="img-preview" style="margin-top:8px"></div><p class="hint">第一张会用作商品封面。</p></div>'
        + '<div class="field"><label class="label">名称 <span class="opt">≤30 字</span></label>'
        + '<input class="input" name="title" aria-label="物品名称" maxlength="30" placeholder="例如 机械键盘 87 键红轴" required></div>'
        + '<div class="field"><label class="label">类别</label><div class="chips" id="cat-chips">' + catChips + '</div>'
        + '<input type="hidden" name="category"></div>'
        + '<div class="field"><label class="label">成色</label><div class="chips" id="cond-chips">' + condChips + '</div>'
        + '<input type="hidden" name="conditionLevel"></div>'
        + '<div class="field"><label class="label">交易方式</label>'
        + '<div class="chips" id="trademode-chips">'
        + '<button type="button" class="chip on" data-act="p-trademode" data-v="4">可买可换（双轨）</button>'
        + '<button type="button" class="chip" data-act="p-trademode" data-v="1">仅明码标价</button>'
        + '<button type="button" class="chip" data-act="p-trademode" data-v="2">仅以物换物</button>'
        + '</div><input type="hidden" name="tradeMode" value="4"></div>'
        + '<div class="field pub-price-group" id="pub-price-row">'
        + '<div class="pub-price-cols">'
        + '<div><label class="label">转让价格（元）<span class="opt" id="pub-price-req">必填</span></label><input class="input" name="priceYuan" type="number" min="0.01" max="99999" step="0.01" placeholder="如 120"></div>'
        + '<div><label class="label">入手原价（元）<span class="opt">选填</span></label><input class="input" name="originalPriceYuan" type="number" min="0" max="99999" step="0.01" placeholder="如 299"></div>'
        + '</div>'
        + '<label class="pub-bargain-chk"><input type="checkbox" name="allowBargain" value="1" checked> 允许买方小刀议价</label>'
        + '</div>'
        + '<div class="field"><label class="label">校内面交点</label>'
        + '<select class="select" name="place">'
        + '<option value="">优先校内公共点位（选填）</option>'
        + CAMPUS_SPOTS.map(function (s) { return '<option value="' + esc(s) + '">' + esc(s) + '</option>'; }).join('')
        + '</select></div>'
        + '<div class="field"><label class="label">描述 <span class="opt">≤300 字</span></label>'
        + '<textarea class="textarea" name="description" aria-label="物品描述" maxlength="300" data-counter="desc" '
        + 'placeholder="哪里旧了、配件齐不齐、能不能自提"></textarea>'
        + '<div class="hint" style="display:flex;justify-content:space-between">'
        + '<span>说清楚瑕疵，换得更快</span><span class="counter" id="desc-counter">0 / 300</span></div><div class="chips publish-templates"><button type="button" class="chip" data-act="publish-template" data-v="成色与瑕疵：">成色说明</button><button type="button" class="chip" data-act="publish-template" data-v="入手来源：">入手来源</button><button type="button" class="chip" data-act="publish-template" data-v="转出原因：">转出原因</button></div></div>'
        + '<div class="field" id="pub-want-section"><label class="label">想换什么 <span class="opt" id="pub-want-req">换物必选</span></label><div class="chips" id="want-chips">' + wantChips + '</div>'
        + '<input type="hidden" name="wantCategory">'
        + '<div class="hint">可多选。纯明码标价可不填；勾选想换类别可同时加入三方换物闭环。</div></div>'
        + '<div class="field"><label class="label">交换模式</label><select class="select" name="matchMode" aria-label="交换模式"><option value="passive">参与闭环 | 等待自动匹配提醒</option><option value="active">参与闭环 | 仅主动找环</option><option value="one">仅一对一交换</option></select></div>'
        + '<div class="field"><label class="label">期望说明 <span class="opt">选填，≤100 字</span></label>'
        + '<input class="input" name="expectDesc" aria-label="期望说明" maxlength="100" placeholder="例如 想换一副羽毛球拍，成色差不多就行"></div>'
        + '<button class="btn btn-primary btn-block" type="submit">提交审核</button>'
        + '</form><aside class="card card-pad amz-form-aside"><img src="/assets/brand/mascot-box.png" width="76" height="76" alt=""><h3>发布与匹配指南</h3><ul><li>支持「明码标价 + 以物换物」双轨流转，填写价格与想换物品可显著提升成交率。</li><li>最多上传 3 张实拍图，第一张将作为商品主图。</li><li>拿不准定价？先点下方 AI 好物估价一键回填参考价。</li></ul><button class="btn btn-ghost btn-block" type="button" data-act="estimate">使用 AI 好物估价</button></aside></div></section>';

    state.publishImages = [];
    state.publish = {category: '', conditionLevel: '', wantCategory: '', tradeMode: 4};
    $('#app').innerHTML = shell('publish', content);
    renderImagePreview();
    restorePublishDraft();
    applyPublishPrefill();
}

function syncPublishTradeMode(modeVal) {
    var m = Number(modeVal || 4);
    state.publish.tradeMode = m;
    var hidden = document.querySelector('#publish-form input[name=tradeMode]');
    if (hidden) hidden.value = String(m);
    var wrap = document.getElementById('trademode-chips');
    if (wrap) {
        Array.prototype.forEach.call(wrap.children, function (c) {
            c.classList.toggle('on', Number(c.dataset.v) === m);
        });
    }
    var priceRow = document.getElementById('pub-price-row');
    if (priceRow) priceRow.hidden = (m === 2);
    var wantReq = document.getElementById('pub-want-req');
    if (wantReq) wantReq.textContent = m === 1 ? '选填（可不选）' : '换物必选';
}

function applyPublishPrefill() {
    var raw = sessionStorage.getItem('hq.appraisePrefill');
    if (!raw) return;
    sessionStorage.removeItem('hq.appraisePrefill');
    var p;
    try { p = JSON.parse(raw); } catch (e) { return; }
    var form = document.querySelector('form[data-form=publish]');
    if (!form) return;
    if (p.title) form.querySelector('[name=title]').value = String(p.title).slice(0, 30);
    if (p.category) { state.publish.category = p.category; markChip('#cat-chips', p.category); }
    if (p.conditionLevel) { state.publish.conditionLevel = p.conditionLevel; markChip('#cond-chips', p.conditionLevel); }
    if (p.priceYuan) form.querySelector('[name=priceYuan]').value = p.priceYuan;
    if (p.originalPriceYuan) form.querySelector('[name=originalPriceYuan]').value = p.originalPriceYuan;
    if (p.wantCategory) { state.publish.wantCategory = p.wantCategory; markMultiWant(p.wantCategory); }
    if (p.tradeMode) syncPublishTradeMode(p.tradeMode);
    var savedSpot = state.home.campusSpot || readSavedCampusSpot();
    if (savedSpot && form.querySelector('[name=place]')) form.querySelector('[name=place]').value = savedSpot;
    savePublishDraft(form);
    toast('已为你自动带入参数，可直接补充实拍图后提交', 'ok');
}

async function renderItemEdit(id) {
    var d=await api('/item/'+id); if(!d.isMine) throw new ApiError('只能编辑自己的物品');
    var it=d.item, want=d.want || {}; renderPublish();
    var form=document.querySelector('[data-form="publish"]'); form.dataset.editId=id;
    form.querySelector('[name="title"]').value=it.title || '';
    form.querySelector('[name="description"]').value=it.description || '';
    form.querySelector('[name="expectDesc"]').value=it.expectDesc || '';
    var tm = Number(it.tradeMode || 4);
    if (Number(it.price) > 0) form.querySelector('[name="priceYuan"]').value = (Number(it.price) / 100).toFixed(2).replace(/\.00$/, '');
    if (Number(it.originalPrice) > 0) form.querySelector('[name="originalPriceYuan"]').value = (Number(it.originalPrice) / 100).toFixed(2).replace(/\.00$/, '');
    if (it.place && form.querySelector('[name="place"]')) form.querySelector('[name="place"]').value = it.place;
    if (form.querySelector('[name="allowBargain"]')) form.querySelector('[name="allowBargain"]').checked = it.allowBargain !== false;
    state.publish={category:it.category, conditionLevel:it.conditionLevel, tradeMode:tm, wantCategory:(want.wantCategories || [want.wantCategory]).filter(Boolean).join(',')};
    form.querySelector('[name=matchMode]').value=it.allowCycle ? (it.autoMatch?'passive':'active') : 'one';
    state.publishImages=it.images?it.images.split(',').filter(Boolean):[];
    syncPublishTradeMode(tm);
    markChip('#cat-chips',state.publish.category); markChip('#cond-chips',state.publish.conditionLevel); markMultiWant(state.publish.wantCategory); renderImagePreview();
    document.querySelector('.page-head h1').textContent='编辑物品';
}

function markMultiWant(value) { var chosen=(value||'').split(','); document.querySelectorAll('#want-chips [data-v]').forEach(function(el){el.classList.toggle('on',chosen.indexOf(el.dataset.v)>=0);}); }

function markChip(sel, val) {
    if (!val) return;
    var wrap = document.querySelector(sel);
    if (!wrap) return;
    Array.prototype.forEach.call(wrap.children, function (c) {
        c.classList.toggle('on', c.dataset.v === val);
    });
    var hidden = wrap.parentNode.querySelector('input[type=hidden]');
    if (hidden) hidden.value = val;
}

function savePublishDraft(form) {
    if(!form||form.dataset.editId||desktopRuntime.currentView.name!=='publish')return;
    var fields=new FormData(form);
    var draft={
        title:fields.get('title'),description:fields.get('description'),expectDesc:fields.get('expectDesc'),
        priceYuan:fields.get('priceYuan'),originalPriceYuan:fields.get('originalPriceYuan'),
        tradeMode:state.publish.tradeMode||4,place:fields.get('place')||'',allowBargain:!!fields.get('allowBargain'),
        matchMode:fields.get('matchMode'),category:state.publish.category,
        conditionLevel:state.publish.conditionLevel,wantCategory:state.publish.wantCategory,
        images:state.publishImages.slice()
    };
    try{sessionStorage.setItem('hq.draft',JSON.stringify(draft));}catch(e){}
}

function restorePublishDraft() {
    var raw = sessionStorage.getItem('hq.draft');
    var form = document.querySelector('form[data-form=publish]');
    if (!form) return;
    var savedSpot = state.home.campusSpot || readSavedCampusSpot();
    if (savedSpot && form.querySelector('[name=place]')) form.querySelector('[name=place]').value = savedSpot;
    if (!raw) return;
    var d;
    try {
        d = JSON.parse(raw);
    } catch (e) {
        sessionStorage.removeItem('hq.draft');
        return;
    }
    if (d.title) form.querySelector('input[name=title]').value = d.title;
    if (d.expectDesc) form.querySelector('input[name=expectDesc]').value = d.expectDesc;
    if (d.priceYuan && form.querySelector('input[name=priceYuan]')) form.querySelector('input[name=priceYuan]').value = d.priceYuan;
    if (d.originalPriceYuan && form.querySelector('input[name=originalPriceYuan]')) form.querySelector('input[name=originalPriceYuan]').value = d.originalPriceYuan;
    if (d.place && form.querySelector('select[name=place]')) form.querySelector('select[name=place]').value = d.place;
    if (d.allowBargain !== undefined && form.querySelector('input[name=allowBargain]')) form.querySelector('input[name=allowBargain]').checked = !!d.allowBargain;
    if (d.description) {
        var ta = form.querySelector('textarea[name=description]');
        ta.value = d.description;
        var c = document.querySelector('#desc-counter');
        if (c) c.textContent = d.description.length + ' / 300';
    }
    state.publish.category = d.category || '';
    state.publish.conditionLevel = d.conditionLevel || '';
    state.publish.wantCategory = d.wantCategory || '';
    syncPublishTradeMode(d.tradeMode || 4);
    markChip('#cat-chips', d.category);
    markChip('#cond-chips', d.conditionLevel);
    markMultiWant(d.wantCategory);
    if(d.matchMode)form.elements.matchMode.value=d.matchMode;
    if(Array.isArray(d.images)){state.publishImages=d.images.slice(0,3);renderImagePreview();}
    if (!sessionStorage.getItem('hq.appraisePrefill')) toast('已恢复上次没发完的内容');
}

function renderImagePreview() {
    var wrap = $('#img-preview');
    if (!wrap) return;
    // 一张都没选的时候也要有「＋」框，否则页面上根本没有选图的入口
    var thumbs = state.publishImages.map(function (u, i) {
        return '<div class="thumb-sm"><img src="' + esc(u) + '" alt="">'
            + '<button type="button" data-act="rm-image" data-i="' + i + '">✕</button></div>';
    }).join('');
    var add = state.publishImages.length < 3
        ? '<label class="thumb-add">'+navIcon('camera')+'<input type="file" accept="image/png,image/jpeg" multiple '
          + 'data-act="pick-image" aria-label="添加物品图片"></label>'
        : '';
    wrap.innerHTML = thumbs + add;
}

export {
    markMultiWant,
    renderImagePreview,
    renderItemEdit,
    renderPublish,
    renderPublishEntry,
    savePublishDraft,
    syncPublishTradeMode,
};
