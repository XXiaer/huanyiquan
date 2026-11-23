import { topbar as renderTopbar } from "../../components/mobile/topbar.js";

const PAGES = window.PAGES;

function topbar(title, options) {
  return renderTopbar(title, { ...options, parent: options?.parent || "#/me" });
}

const MINE_MAP = {
  onshelf: { title: '我发布的' },
  sold: { title: '我卖出的' },
  offers: { title: '我的报价' },
  exchange: { title: '我的交换' },
  reviews: { title: '我收到的评价' },
};

function dealTabsHtml(active) {
  const items = [['onshelf', '我发布的'], ['sold', '我卖出的'], ['offers', '我的报价'], ['exchange', '我的交换']];
  return `<nav class="deal-tabs">${items.map(([k, label]) => `<a class="${active === k ? 'on' : ''}" href="#/me/${k}">${label}</a>`).join('')}</nav>`;
}

PAGES.mineList = {
  tab: 'me',
  async render(view, params) {
    const conf = MINE_MAP[params.kind] || MINE_MAP.onshelf;
    let me = window.__me;
    if (!me) { try { me = await api.get('/api/user/me'); window.__me = me; } catch (e) { /* 未登录 */ } }

    if (params.kind === 'onshelf' || params.kind === 'sold') {
      let list = [];
      try { list = await api.get('/api/item/mine') || []; } catch (e) { /* 未登录 */ }
      list = list.filter((i) => params.kind === 'sold' ? i.status === 3 : (i.status === 1 || i.status === 5));
      const drafts = params.kind === 'onshelf' ? ['idle', 'auction', 'wish'].map((k) => {
        const d = JSON.parse(localStorage.getItem('draft:' + k) || 'null');
        return d && (d.title || d.desc || d.content) ? { kind: k, d } : null;
      }).filter(Boolean) : [];
      view.innerHTML = `
          ${topbar(conf.title, { right: `<a href="#/publish/edit/idle" style="font-size:13px;font-weight:700;color:var(--green-700)">＋ 发布</a>` })}
          ${dealTabsHtml(params.kind)}
          <div class="m-subpage">
            ${drafts.length ? `<div class="deal-group-title">草稿箱</div>
              ${drafts.map(({ kind, d }) => `
                <div class="deal-card">
                  <div class="deal-card__body">
                    <div class="deal-card__info">
                      <div class="deal-card__head">
                        <b>${esc(d.title || d.content || '未命名草稿')}</b>
                        <span class="badge badge--orange">${kind === 'wish' ? '心愿草稿' : kind === 'auction' ? '拍卖草稿' : '闲置草稿'}</span>
                      </div>
                    </div>
                  </div>
                  <div class="deal-card__foot">
                    <button class="chip" data-draft="${kind}">删除</button>
                    <a class="chip on" href="#/publish/edit/${kind}">继续编辑</a>
                  </div>
                </div>`).join('')}
              <div class="deal-group-title">已发布</div>` : ''}
            ${list.length ? list.map((i) => `
              <div class="deal-card">
                <a class="deal-card__body" href="#/item/${i.id}">
                  <img class="deal-card__thumb" src="${api.firstPic(i)}" alt="">
                  <div class="deal-card__info">
                    <div class="deal-card__head">
                      <b>${esc(i.title)}</b>
                      <span class="badge ${i.status === 1 ? 'badge--green' : 'badge--gray'}">${esc(i.statusText)}</span>
                    </div>
                    <div class="deal-card__price">${api.yuan(i.price) ? '¥' + api.yuan(i.price) : '以物换物'}</div>
                    <div class="deal-card__meta">${esc(i.conditionLevel)} | ${i.viewCount || 0} 浏览 | ${fmtTime(i.updateTime)}</div>
                  </div>
                </a>
                <div class="deal-card__foot">
                  ${params.kind === 'onshelf'
                  ? `${i.tradeMode !== 3 ? `<a class="chip" href="#/item/${i.id}/edit">编辑</a>` : ''}
                       <button class="chip" data-off="${i.id}">下架</button>
                       <a class="chip" href="#/cycle/${i.id}">找环</a>
                       <button class="chip on" data-spark="${i.id}">擦亮</button>`
                  : `<a class="chip" href="#/item/${i.id}">查看详情</a>`}
                </div>
              </div>`).join('') : mascotEmpty(params.kind === 'sold' ? '还没有卖出的宝贝' : '还没有发布过闲置', 'assets/brand/mascot-wave-320.webp', { href: '#/publish/edit/idle', text: '去发布' })}
          </div>`;
      view.querySelectorAll('[data-off]').forEach((b) => b.addEventListener('click', () => {
        confirmSheet('下架宝贝', '下架后可在「我发布的」里重新上架。', '下架', async () => {
          try { await api.put('/api/item/' + b.dataset.off, { status: 4 }); toast('已下架'); renderRoute(); } catch (e) { toast(e.message); }
        });
      }));
      view.querySelectorAll('[data-spark]').forEach((b) => b.addEventListener('click', async () => {
        try { await api.post('/api/social/refresh', { itemId: Number(b.dataset.spark) }); b.textContent = '已擦亮'; b.disabled = true; toast('擦亮成功'); } catch (e) { toast(e.message); }
      }));
      view.querySelectorAll('[data-draft]').forEach((b) => b.addEventListener('click', () => {
        confirmSheet('删除草稿', '删除后无法恢复。', '删除', () => {
          localStorage.removeItem('draft:' + b.dataset.draft);
          toast('草稿已删除'); renderRoute();
        });
      }));
      return;
    }

    if (params.kind === 'reviews') {
      let reviews = [];
      let summary = { total: 0, good: 0, withImage: 0, fromBuyer: 0, fromSeller: 0, impressions: {} };
      try {
        if (me) {
          const r = await Promise.all([
            api.get('/api/review/user/' + me.id),
            api.get('/api/review/summary/' + me.id).catch(() => summary),
          ]);
          reviews = r[0] || [];
          summary = Object.assign(summary, r[1] || {});
        }
      } catch (e) { /* 忽略 */ }
      view.innerHTML = `
          ${topbar(conf.title, params.fromSettings ? { onBack: 'returnToSettings()' } : undefined)}
          <div class="pf-chips rev-filter">
            <span class="chip on">全部 ${summary.total || reviews.length}</span>
            <span class="chip">好评 ${summary.good || 0}</span>
            <span class="chip">来自买家 ${summary.fromBuyer || 0}</span>
            <span class="chip">来自卖家 ${summary.fromSeller || 0}</span>
          </div>
          <div style="background:#fff;border-radius:12px;margin:0 13px;overflow:hidden">
            ${reviews.length ? reviews.map(reviewRowSimple).join('') : '<div class="empty">还没有收到评价</div>'}
          </div>`;
      return;
    }

    /* 我买到的 / 我的交换 */
    let exchanges = [];
    let offers = [];
    try { exchanges = await api.get('/api/exchange/mine') || []; } catch (e) { /* 忽略 */ }
    if (params.kind === 'offers') { try { offers = await api.get('/api/offer/sent') || []; } catch (e) { /* 忽略 */ } }

    if (params.kind === 'offers') {
      let received = [];
      try { received = await api.get('/api/offer/received') || []; } catch (e) { toast(e.message); }
      const mode = window.__offersMode || 'received';
      const rows = mode === 'received' ? received : offers;
      const labels = ['待回应', '已接受', '已拒绝', '已过期', '已撤回', '已还价'];
      view.innerHTML = `${topbar('我的提案')}${dealTabsHtml('offers')}<div class="m-subpage">
          <div class="pf-chips"><button class="chip ${mode === 'received' ? 'on' : ''}" data-offer-tab="received">收到的</button><button class="chip ${mode === 'sent' ? 'on' : ''}" data-offer-tab="sent">发出的</button></div>
          ${rows.length ? rows.map(o => `
            <div class="deal-card">
              <div class="deal-card__head">
                <b>${o.amountCents ? esc(o.targetTitle || '物品') + ' | 面交价 ¥' + api.yuan(o.amountCents) : esc(o.myTitle || '闲置') + ' ⇄ ' + esc(o.targetTitle || '闲置')}</b>
                <span class="badge ${o.status === 1 ? 'badge--green' : o.status === 0 ? 'badge--orange' : 'badge--gray'}">${esc(labels[o.status] || '已处理')}</span>
              </div>
              ${o.message ? `<div class="deal-card__note">${esc(o.message)}</div>` : ''}
              ${o.status === 0 ? `<div class="deal-card__foot">${mode === 'received' ? `<button class="chip" data-offer-id="${o.id}" data-action="reject">拒绝</button><button class="chip" data-offer-id="${o.id}" data-action="counter">还价</button><button class="chip on" data-offer-id="${o.id}" data-action="accept">接受</button>` : `<button class="chip" data-offer-id="${o.id}" data-action="cancel">撤回</button>`}</div>` : ''}
            </div>`).join('') : mascotEmpty('这里还没有提案', 'assets/brand/mascot-wave-320.webp', {href:'#/market',text:'去集市看看'})}</div>`;
      view.querySelectorAll('[data-offer-tab]').forEach(b => b.addEventListener('click', () => { window.__offersMode = b.dataset.offerTab; renderRoute(); }));
      view.querySelectorAll('[data-offer-id]').forEach(b => b.addEventListener('click', async () => {
        if (b.dataset.action === 'counter') {
          const original = rows.find(row => Number(row.id) === Number(b.dataset.offerId));
          if (!original) return;
          if (original.amountCents) {
            window.openCashProposal({title:'修改面交出价',description:original.targetTitle,initial:original.amountCents,
              async onSend(amountCents) {
                await api.post('/api/offer/handle', {offerId:original.id,action:'counter',amountCents});
                toast('已发出新的面交出价');
                window.__offersMode = 'sent';
                renderRoute();
              }});
            return;
          }
          let items = []; try { items = await api.get('/api/item/mine') || []; } catch (e) { toast(e.message); return; }
          items = items.filter(i => i.status === 1 && !i.isDemo);
          if (!items.length) { toast('请先发布一件在架物品'); return; }
          window.openTradeProposal({title:'修改提案', receive:{title:original.myTitle || '对方的物品'},
            items, sendLabel:'发送反提案',
            async onSend(myItemId) {
              await api.post('/api/offer/handle', {offerId:Number(original.id), action:'counter', myItemId});
              toast('反提案已发出');
              window.__offersMode = 'sent';
              renderRoute();
            }});
          return;
        }
        const submit = async () => {
          if (b.disabled) return;
          b.disabled = true;
          try {
            const result = await api.post('/api/offer/handle', {offerId:Number(b.dataset.offerId),action:b.dataset.action});
            if (b.dataset.action === 'accept' && result?.exchangeId) location.hash = '#/exchange/' + Number(result.exchangeId);
            else { toast('操作成功'); renderRoute(); }
          } catch (error) { toast(error.message); }
          finally { b.disabled = false; }
        };
        if (b.dataset.action === 'accept') {
          const offer = rows.find(row => Number(row.id) === Number(b.dataset.offerId));
          if (!offer) return;
          const decision = offer.amountCents ? '确认按 ¥' + api.yuan(offer.amountCents) + ' 校园面交？验货后现场结算。'
            : '确认用「' + offer.targetTitle + '」换「' + offer.myTitle + '」？接受后物品将锁定。';
          confirmSheet('接受这版提案',esc(decision),'接受并查看交换单',submit);
        } else await submit();
      }));
      return;
    }

    view.innerHTML = `
        ${topbar('我的交换')}
        ${dealTabsHtml('exchange')}
        <div class="m-subpage">
          ${exchanges.length ? exchanges.map((e) => `
            <div class="deal-card">
              <div class="deal-card__head">
                <b>交换单 #${e.id}</b>
                <div style="display:flex;gap:6px;align-items:center">
                  <span class="badge badge--gray">${e.type === 3 ? '三方成环' : '一对一'}</span>
                  <span class="badge ${e.status === 3 ? 'badge--green' : e.status === 1 || e.status === 2 ? 'badge--orange' : 'badge--gray'}">${esc(e.statusText || '进行中')}</span>
                </div>
              </div>
              <div class="deal-card__kv">
                <span>${esc(e.place || '面交点待约定')}</span>
                <span>${esc(e.dealTime || '时间待约定')}</span>
              </div>
              <div class="deal-card__foot deal-card__foot--split">
                <span class="deal-card__meta">${e.status === 2 && e.mine?.delivered ? "你已确认收货 | " : e.status === 2 && !window.exchangeSummary(e).canReceive ? "面交安排待确认 | " : ""}${window.exchangeNeedsConfirmation(e) ? `确认 ${e.confirmedCount || 0}/${e.needConfirm || 0} | ` : ''}收货 ${e.deliveredCount || 0}/${e.needConfirm || 0}</span>
                <div style="display:flex;gap:6px">
                  ${window.exchangeSummary(e).canConfirm ? `<button class="chip on" data-confirm="${e.id}">确认参与</button>` : ''}
                  ${window.exchangeSummary(e).canReceive ? `<button class="chip on" data-done="${e.id}">确认收货</button>` : ''}
                  <a class="chip" href="#/exchange/${e.id}">详情</a>
                </div>
              </div>
            </div>`).join('') : mascotEmpty('还没有交换单', 'assets/brand/mascot-wave-320.webp', { href: '#/market', text: '去逛逛' })}
        </div>`;

    view.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => {
      const e = exchanges.find((x) => String(x.id) === b.dataset.view);
      if (!e) return;
      openSheet('交换单 #' + e.id, `<div class="set-card">
          <div class="set-row">类型<span class="set-row__val">${e.type === 3 ? '三方成环' : '一对一'}</span></div>
          <div class="set-row">状态<span class="set-row__val">${esc(e.statusText || '')}</span></div>
          <div class="set-row">面交点<span class="set-row__val">${esc(e.place || '待约定')}</span></div>
          <div class="set-row">约定时间<span class="set-row__val">${esc(e.dealTime || '待约定')}</span></div>
          ${window.exchangeNeedsConfirmation(e) ? `<div class="set-row">确认进度<span class="set-row__val">${e.confirmedCount || 0}/${e.needConfirm || 0}</span></div>` : ''}
          <div class="set-row">收货进度<span class="set-row__val">${e.deliveredCount || 0}/${e.needConfirm || 0}</span></div>
        </div>`, { closeText: '关闭' });
    }));
    view.querySelectorAll('[data-done]').forEach((b) => b.addEventListener('click', () => {
      confirmSheet('确认收货', '确认对方已交付、物品无误？确认后不可撤回。', '确认', async () => {
        try { await api.post('/api/exchange/' + b.dataset.done + '/done', {}); toast('已确认收货'); renderRoute(); } catch (e) { toast(e.message); }
      });
    }));
    view.querySelectorAll('[data-confirm]').forEach((b) => b.addEventListener('click', () => {
      confirmSheet('确认参与交换', '确认后等待其他参与者确认，全部确认后进入待交付。', '确认参与', async () => {
        try { await api.post('/api/exchange/' + b.dataset.confirm + '/confirm', {}); toast('已确认参与'); renderRoute(); } catch (e) { toast(e.message); }
      });
    }));
  },
};

function reviewRowSimple(r) {
  const good = (r.score || 0) >= 4;
  return `<div class="review-row">
      <div class="review-row__top">
        <span onclick="location.hash='#/user/${r.fromUser || 1}'">${avatar({ nickname: r.fromNickname || '同学', id: r.fromUser || 1, avatar: r.fromAvatar }, 34)}</span>
        <span class="badge badge--blue">${r.role === 'buyer' ? '买家' : '卖家'}</span>
        <span class="review-row__name">${esc(r.fromNickname || '同学')}</span>
        <span class="badge ${good ? 'badge--orange' : 'badge--gray'} review-row__result">${good ? '好评' : '中评'}</span>
      </div>
      <div class="review-row__text">${esc(r.content || '')}</div>
      ${r.image ? `<div class="review-row__imgs"><img src="${r.image}" alt=""></div>` : ''}
      <div class="review-row__meta">${fmtTime(r.createTime)}</div>
    </div>`;
}
