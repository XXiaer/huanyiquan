/* 页面：心愿、通知、估价、我的交易列表、收藏/历史/关注、信用、帮助、服务入口 */
(function () {
  const PAGES = window.PAGES || {};

  function topbar(title, opts) {
    const o = opts || {};
    return `<div class="topbar${o.white ? ' topbar--white' : ''}">
      <button class="topbar__back" onclick="${o.onBack || `smartBack('${o.parent || '#/me'}')`}">${icon('back', 22)}</button>
      <div class="topbar__spacer"></div>
      <div class="topbar__title">${esc(title)}</div>
      <div class="topbar__spacer"></div>
      ${o.right || ''}
    </div>`;
  }

  /* ============================================================ 心愿 */
  PAGES.wish = {
    tab: 'me',
    async render(view) {
      const route = location.hash;
      const me = window.__me || await api.get('/api/user/me').catch(error => {
        if (error.code === 401) return null;
        throw error;
      });
      if (location.hash !== route) return;
      if (me) window.__me = me;
      let wishes = me ? await api.get('/api/wish') || [] : [];
      if (location.hash !== route) return;
      let mineOnly = true;
      let filter = 'all';
      const filters = [['all', '全部'], ['relay', '可接力'], ['教材', '教材'], ['数码', '数码'], ['运动', '运动'], ['生活', '生活'], ['衣物', '衣物'], ['其他', '其他']];
      const owned = wish => me && Number(wish.userId) === Number(me.id);
      view.innerHTML = `
        <section class="mobile-wishes">
          <header class="mobile-wishes__header">
            <a class="mobile-wishes__back" href="#/me" aria-label="返回我的">${icon('back', 21)}</a>
            <h1>心愿单</h1>
            <a class="mobile-wishes__publish" href="${me ? '#/publish/edit/wish' : '#/login'}">${me ? '发布求换心愿' : '登录后发布'}</a>
            <p>写下想换的物品，等同学来找你</p>
          </header>
          <div class="mobile-wishes__toolbar" aria-label="心愿范围">
            <button type="button" data-wish-scope="mine" aria-pressed="true">我的心愿</button>
            <button type="button" data-wish-scope="all" aria-pressed="false">全部心愿</button>
          </div>
          <div class="mobile-wishes__filters" aria-label="筛选心愿">
            ${filters.map(([key, title]) => `<button type="button" data-wish-filter="${key}" aria-pressed="${key === filter}">${title}</button>`).join('')}
          </div>
          <div class="mobile-wishes__feed" data-wish-feed></div>
        </section>`;
      const feed = view.querySelector('[data-wish-feed]');
      function draw() {
        const shown = wishes.filter(wish => (!mineOnly || owned(wish)) &&
          (filter === 'all' || (filter === 'relay' ? !!wish.offeredItemId : wish.category === filter)));
        if (!shown.length) {
          const message = !me ? '登录后查看和发布心愿' : filter !== 'all' ? '这个分类还没有心愿' : mineOnly ? '你还没有发布心愿' : '现在还没有心愿';
          feed.innerHTML = `<div class="mobile-wishes__empty"><p>${message}</p>${!me ? '<a href="#/login">去登录</a>' : filter === 'all' ? '<a href="#/publish/edit/wish">发布求换心愿</a>' : '<button type="button" data-clear-wish-filter>查看全部</button>'}</div>`;
          return;
        }
        feed.innerHTML = shown.map(wish => `
          <article class="mobile-wish">
            <span class="mobile-wish__kind">求换</span>
            <h2>${esc(wish.title)}</h2>
            ${wish.content ? `<p class="mobile-wish__description">${esc(wish.content)}</p>` : ''}
            <div class="mobile-wish__exchange"><span>期望交换</span>
              ${wish.offeredItemId ? `<a href="#/item/${Number(wish.offeredItemId)}">三方接力 / 可换物品</a>` : '<strong>物品互换</strong>'}
            </div>
            <footer class="mobile-wish__footer">
              ${avatar({ nickname: wish.nickname || '同学', id: wish.userId, avatar: wish.avatar || (owned(wish) ? me.avatar : '') }, 17)}
              <span class="mobile-wish__nickname">${esc(wish.nickname || '同学')}</span>
              <time>${esc(fmtTime(wish.createdAt))}</time>
              ${owned(wish) ? `<button type="button" data-close-wish="${Number(wish.id)}">关闭心愿</button>` : ''}
            </footer>
          </article>`).join('');
      }
      function selectFilter(key) {
        filter = key;
        view.querySelectorAll('[data-wish-filter]').forEach(button => {
          button.setAttribute('aria-pressed', button.dataset.wishFilter === filter);
        });
        draw();
      }
      view.querySelectorAll('[data-wish-scope]').forEach(button => {
        button.addEventListener('click', () => {
          mineOnly = button.dataset.wishScope === 'mine';
          view.querySelectorAll('[data-wish-scope]').forEach(scope => {
            scope.setAttribute('aria-pressed', scope === button);
          });
          selectFilter('all');
        });
      });
      view.querySelectorAll('[data-wish-filter]').forEach(button => {
        button.addEventListener('click', () => selectFilter(button.dataset.wishFilter));
      });
      feed.addEventListener('click', async event => {
        if (event.target.closest('[data-clear-wish-filter]')) { selectFilter('all'); return; }
        const button = event.target.closest('[data-close-wish]');
        if (!button || button.disabled) return;
        button.disabled = true;
        const id = Number(button.dataset.closeWish);
        try {
          await api.post('/api/wish/' + id + '/close', {});
          if (!feed.isConnected || location.hash !== route) return;
          wishes = wishes.filter(wish => Number(wish.id) !== id);
          draw();
          toast('心愿已关闭');
        } catch (error) {
          button.disabled = false;
          if (feed.isConnected) toast(error.message);
        }
      });
      draw();
    },
  };

  /* ============================================================ 通知 */
  const CAT_NAME = { trade: '交易消息', notice: '通知消息', follow: '关注上新' };
  PAGES.notifications = {
    noTab: true,
    async render(view, params) {
      const cat = params.cat || '';
      const route = location.hash;
      let list = await api.get('/api/notification') || [];
      if (location.hash !== route) return;
      if (cat) list = list.filter((n) => (n.category || 'notice') === cat);
      view.innerHTML = `
      ${topbar(cat ? CAT_NAME[cat] || '通知' : '通知消息', { parent: '#/messages', white: true, right: `<button id="readAll" style="font-size:13px;color:var(--green-700)">全部已读</button>` })}
      ${cat ? '' : `<div class="r-chips" style="background:#fff">${['', 'trade', 'notice', 'follow'].map((c) =>
        `<a class="chip${!c ? ' on' : ''}" href="#/notifications${c ? '/' + c : ''}">${c ? CAT_NAME[c] : '全部'}</a>`).join('')}</div>`}
      <div style="padding:2px 13px 20px">
        ${list.length ? list.map((n) => `
          <div class="notice-card" data-id="${n.id}" data-target="${esc(n.target || '')}">
            <div class="ico">${serviceIcon(n.category === 'trade' ? (/审核|上架/.test(n.title) ? 'parcel' : 'exchange') : n.category === 'follow' ? 'light' : 'shield', 29)}</div>
            <div class="main">
              <b>${esc(n.title)}${n.read ? '' : '<i class="dot-red"></i>'}</b>
              <p>${esc(n.content)}</p>
              <time>${fmtTime(n.createdAt)}</time>
            </div>
          </div>`).join('') : mascotEmpty('这里还没有消息', 'assets/brand/mascot-wave-320.webp')}
      </div>`;
      document.getElementById('readAll').addEventListener('click', async () => {
        try { await api.post('/api/notification/read', cat ? { category: cat } : {}); toast('已全部标为已读'); renderRoute(); } catch (e) { toast(e.message); }
      });
      view.querySelectorAll('[data-id]').forEach((row) => row.addEventListener('click', async () => {
        const id = row.dataset.id;
        try { await api.post('/api/notification/' + id + '/read', {}); } catch (e) { /* 忽略 */ }
        const t = row.dataset.target;
        if (t && t !== location.hash) location.hash = t;
        else renderRoute();
      }));
      startLivePoll(() => renderRoute(), 6000);
    },
  };

  /* ============================================================ 估价 */
  PAGES.appraise = {
    noTab: true,
    async render(view) {
      view.innerHTML = `
      ${topbar('AI 好物估价', { parent: '#/home' })}
      <div class="ap-page">
        <label class="ap-hero-upload" id="apPhotoBox">
          <input id="apFile" type="file" accept="image/*" capture="environment" hidden>
          <img id="apPreview" class="ap-hero-upload__img" hidden alt="">
          <div class="ap-hero-upload__empty" id="apPhotoEmpty">
            <span class="ap-corner ap-corner--tl"></span>
            <span class="ap-corner ap-corner--tr"></span>
            <span class="ap-corner ap-corner--bl"></span>
            <span class="ap-corner ap-corner--br"></span>
            <div class="ap-hero-upload__icon">${icon('camera', 26)}</div>
            <b>拍照或上传物品图</b>
          </div>
          <button type="button" class="ap-hero-upload__clear" id="apClear" hidden>重选</button>
        </label>

        <div id="apResult" aria-live="polite"></div>

        <section class="ap-card">
          <div class="ap-row">
            <label for="apTitle">物品名称</label>
            <input id="apTitle" placeholder="例如 罗技GPW / 高数教材">
          </div>
          <div class="ap-row">
            <label for="apOrig">入手原价</label>
            <div class="ap-row__price"><em>¥</em><input id="apOrig" type="number" placeholder="选填"></div>
          </div>
        </section>

        <section class="ap-card">
          <div class="ap-card__title">分类</div>
          <div class="ap-grid-chips" id="apCate">${['教材', '数码', '运动', '生活', '衣物', '绿植', '其他']
            .map((c) => `<button type="button" class="ap-chip" data-v="${c}">${c}</button>`).join('')}</div>
          <div class="ap-card__title" style="margin-top:14px">成色</div>
          <div class="ap-grid-chips" id="apCond">${['全新', '九成新', '七成新', '有使用痕迹']
            .map((c) => `<button type="button" class="ap-chip" data-v="${c}">${c}</button>`).join('')}</div>
        </section>
      </div>
      <div class="ap-bottom-bar">
        <button class="btn btn--block" id="apGo" type="button">AI 估价</button>
      </div>`;
      let cate = '', cond = '', photoDataUrl = '';
      const fileInput = document.getElementById('apFile');
      const preview = document.getElementById('apPreview');
      const emptyBox = document.getElementById('apPhotoEmpty');
      const clearBtn = document.getElementById('apClear');
      fileInput.addEventListener('change', async () => {
        const f = fileInput.files && fileInput.files[0];
        if (!f) return;
        try {
          const { dataUrl } = await window.compressImageFile(f, 768);
          photoDataUrl = dataUrl;
          preview.src = dataUrl;
          preview.hidden = false;
          emptyBox.hidden = true;
          clearBtn.hidden = false;
        } catch (e) { toast(e.message); }
      });
      clearBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        photoDataUrl = '';
        fileInput.value = '';
        preview.hidden = true;
        emptyBox.hidden = false;
        clearBtn.hidden = true;
      });
      ['apCate', 'apCond'].forEach((id) => {
        view.querySelectorAll('#' + id + ' .ap-chip').forEach((c) => c.addEventListener('click', () => {
          view.querySelectorAll('#' + id + ' .ap-chip').forEach((x) => x.classList.remove('on'));
          c.classList.add('on');
          if (id === 'apCate') cate = c.dataset.v; else cond = c.dataset.v;
        }));
      });
      const goBtn = document.getElementById('apGo');
      const photoBox = document.getElementById('apPhotoBox');
      const resultBox = document.getElementById('apResult');
      goBtn.addEventListener('click', async () => {
        const title = document.getElementById('apTitle').value.trim();
        const orig = Number(document.getElementById('apOrig').value || 0);
        if (!photoDataUrl && !cate && !title) { toast('请拍照或选择分类'); return; }
        goBtn.disabled = true;
        goBtn.textContent = '正在估价中…';
        photoBox.classList.add('is-scanning');
        resultBox.innerHTML = `
          <div class="ap-loading">
            <div class="ap-loading__stage">
              <span class="ap-loading__ring"></span>
              <span class="ap-loading__ring ap-loading__ring--delay"></span>
              <img class="ap-loading__mascot" src="assets/brand/mascot-search.png" alt="正在估价中">
            </div>
            <div class="ap-loading__title">
              <span>正在估价中</span>
              <i class="ap-loading__dots"><b></b><b></b><b></b></i>
            </div>
          </div>`;
        resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        try {
          const res = await api.post('/api/ai/appraise', {
            image: photoDataUrl || '',
            category: cate,
            condition: cond,
            origPrice: orig > 0 ? Math.round(orig) : 0,
            title,
          });
          resultBox.innerHTML = `
            <div class="appraise-result-card">
              <div class="appraise-result-card__name">${esc(res.name || title || cate)}</div>
              <div class="appraise-result-card__price"><em>¥</em><b>${res.lowPrice} – ${res.highPrice}</b></div>
              <div class="appraise-result-card__tags">
                ${res.category ? `<span class="badge badge--green">${esc(res.category)}</span>` : ''}
                ${res.condition ? `<span class="badge badge--gray">${esc(res.condition)}</span>` : ''}
                ${(res.tags || []).map(t => `<span class="badge badge--orange">${esc(t)}</span>`).join('')}
              </div>
              <a class="btn btn--ghost btn--sm" href="#/publish/edit/idle">按此价发布</a>
            </div>`;
        } catch (e) {
          if (cate) {
            try {
              const d = await api.get('/api/item/list', { category: cate, page: 1, size: 50 });
              const list = (d.list || []).filter((i) => i.price);
              if (list.length) {
                const ps = list.map((i) => i.price).sort((a, b) => a - b);
                const lo = ps[Math.floor(ps.length * 0.25)];
                const hi = ps[Math.floor(ps.length * 0.75)];
                resultBox.innerHTML = `
                  <div class="appraise-result-card">
                    <div class="appraise-result-card__price"><em>¥</em><b>${api.yuan(lo)} – ${api.yuan(hi)}</b></div>
                    <div class="appraise-result-card__tags"><span class="badge badge--green">${list.length} 件样本</span></div>
                    <a class="btn btn--ghost btn--sm" href="#/publish/edit/idle">按此价发布</a>
                  </div>`;
                return;
              }
            } catch (ignore) {}
          }
          resultBox.innerHTML = '';
          toast(e.message || '估价失败，请重试');
        } finally {
          photoBox.classList.remove('is-scanning');
          goBtn.disabled = false;
          goBtn.textContent = 'AI 估价';
        }
      });
    },
  };

  /* ============================================================ 我的交易列表 */
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

  /* ============================================================ 收藏 / 历史 / 关注 */
  PAGES.collection = {
    tab: 'me',
    async render(view) {
      let list = [];
      try { list = await api.get('/api/social/favorite') || []; } catch (e) { /* 未登录 */ }
      view.innerHTML = `${topbar('我的收藏')}${list.length ? waterfall(list) : mascotEmpty('还没有收藏的宝贝', 'assets/brand/mascot-wave-320.webp', { href: '#/market', text: '去集市逛逛' })}`;
    },
  };
  PAGES.history = {
    tab: 'me',
    async render(view) {
      let list = [];
      try { list = await api.get('/api/social/history') || []; } catch (e) { /* 未登录 */ }
      view.innerHTML = `${topbar('历史浏览')}${list.length ? waterfall(list) : mascotEmpty('还没有浏览记录', 'assets/brand/mascot-wave-320.webp', { href: '#/home', text: '去首页看看' })}`;
    },
  };
  PAGES.follows = {
    tab: 'me',
    async render(view, params) {
      const followers = params.followers;
      const route = location.hash;
      const list = await api.get(followers ? '/api/social/followers' : '/api/social/follow') || [];
      if (location.hash !== route) return;
      view.innerHTML = `
        ${topbar(followers ? '谁关注了我' : '我的关注')}
        <nav class="r-chips" aria-label="关注列表"><a class="chip ${followers ? '' : 'on'}" href="#/follows">我的关注</a><a class="chip ${followers ? 'on' : ''}" href="#/followers">关注我的</a></nav>
        <div style="padding:4px 13px 0">
          ${list.length ? list.map((u) => `
            <a class="conv" href="#/user/${u.id}" style="padding:12px 0">
              ${avatar({ nickname: u.nickname, id: u.id, avatar: u.avatar }, 48)}
              <div class="conv__main">
                <div class="conv__top"><span class="conv__name">${esc(u.nickname)}</span>
                  ${creditLabel(u.credit) ? `<span class="badge badge--orange">卖家信用${creditLevel(u.credit)}</span>` : ''}
                </div>
                <div class="conv__text">${esc(u.college || '重庆移通学院')} | ${esc(u.building || '缤果大街')}</div>
              </div>
              ${icon('right', 16)}
            </a>`).join('') : mascotEmpty(followers ? '还没有同学关注你' : '还没有关注的同学', 'assets/brand/mascot-wave-320.webp')}
        </div>`;
    },
  };

  /* ============================================================ 信用中心 */
  PAGES.creditCenter = {
    async render(view, params) {
      const id = params.id || (window.__me ? window.__me.id : 0);
      let logs = [];
      let u = null;
      try {
        const r = await Promise.all([
          api.get('/api/user/' + id + '/credit').catch(() => []),
          api.get('/api/user/' + id).catch(() => null),
        ]);
        logs = r[0] || [];
        u = r[1];
      } catch (e) { /* 忽略 */ }
      const credit = u ? u.credit : 0;
      const lv = creditLevel(credit);
      view.innerHTML = `
        ${topbar('信用中心')}
        <div style="padding:0 13px 20px">
          <div class="credit-hero">
            <div style="font-size:13px;color:var(--ink-500)">${esc(u ? u.nickname : '')} 的信用分</div>
            <div class="num">${credit}</div>
            <div class="lv">${esc(lv)} | 买家权限 ${u ? (Number(u.credit) >= 60 ? '正常' : '受限') : '暂不可用'} / 卖家权限 ${u ? (Number(u.credit) >= 60 ? '正常' : '受限') : '暂不可用'}</div>
            ${u && Number(u.credit) < 60 ? '<p class="hint exchange-danger">信用分低于 60 分，暂不能发提案或发布商品。</p>' : ''}
            <div class="tip">初始 80 分 | 完成一次交换 +2 | 好评加分 | 违约 −5</div>
          </div>
          <div class="sect-title" style="padding:4px 0 10px"><h2 style="font-size:16px">信用变动</h2></div>
          <div class="set-card">
            ${logs.length ? logs.map((l) => {
              const m = String(l.remark || '').match(/([+\-−]\s*\d+)/);
              const delta = m ? Number(m[1].replace(/\s/g, '').replace('−', '-')) : 0;
              return `
              <div class="set-row" style="height:auto;padding:14px 15px;align-items:flex-start">
                <div style="flex:1;min-width:0">
                  <div style="font-size:14px">${esc(l.remark || '信用变动')}</div>
                  <div style="font-size:11px;color:var(--ink-500);margin-top:4px">${fmtTime(l.createTime)}</div>
                </div>
                <span style="font-size:17px;font-weight:700;color:${delta >= 0 ? 'var(--green-700)' : 'var(--red-500)'}">
                  ${delta >= 0 ? '+' : ''}${delta}
                </span>
              </div>`;
            }).join('') : '<div class="empty" style="padding:34px 0">还没有信用变动记录</div>'}
          </div>
        </div>`;
    },
  };

  /* ============================================================ 帮助与客服 */
  PAGES.helpCenter = {
    async render(view) {
      const FAQ = [
        ['怎么发起交换', '在商品页点「聊一聊」或「发起交换」，选择自己的一件闲置作为交换物。对方接受后生成交换单，双方按约定面交并互相确认。'],
        ['为什么发布后没上架', '发布要先过审核与违禁词校验。通过后自动上架；不通过会在「我发布的」里提示原因。'],
        ['信用分怎么算', '初始 80 分。完成一次交换 +2，收到好评按星级加分，超时未交付或举报成立会扣分。低于 60 分不能发布。'],
        ['面交地点选哪里', '建议图书馆门口、缤果大街、宿舍楼下等人多的地方。发布时可以保存常用地点。'],
        ['在哪里举报', '商品页和私聊页右上角都有举报入口，管理员会在 24 小时内处理。'],
      ];
      view.innerHTML = `
        ${topbar('帮助与客服')}
        <div style="padding:0 13px 24px">
          <div class="community-card" style="margin:0 0 10px;display:flex;align-items:center;gap:12px;padding:16px">
            <img src="assets/brand/mascot-logo.png" style="width:52px;height:52px" alt="">
            <div>
              <div style="font-size:16px;font-weight:700">换一圈小管家</div>
              <div style="font-size:12px;color:var(--ink-500);margin-top:3px">工作日 9:00–18:00 在线</div>
            </div>
            <button class="btn btn--sm" id="helpChat" style="margin-left:auto">咨询</button>
          </div>
          <div class="sect-title" style="padding:6px 0 10px"><h2 style="font-size:16px">常见问题</h2></div>
          <div class="set-card">
            ${FAQ.map((f, i) => `
              <div class="set-row" data-faq="${i}" style="height:auto;padding:14px 15px">
                <span style="flex:1;font-size:14px">${f[0]}</span>
                <span class="set-row__arrow">${icon('down', 15)}</span>
              </div>
              <div data-ans="${i}" style="display:none;padding:0 15px 14px;font-size:13px;line-height:1.7;color:var(--ink-500)">${f[1]}</div>`).join('')}
          </div>
          <div class="sect-title" style="padding:18px 0 10px"><h2 style="font-size:16px">联系我们</h2></div>
          <div class="set-card">
            <div class="set-row" id="helpMail">发邮件给学生工作处<span class="set-row__arrow">${icon('right', 16)}</span></div>
            <div class="set-row" id="helpOffer">提交产品建议<span class="set-row__arrow">${icon('right', 16)}</span></div>
          </div>
        </div>`;
      view.querySelectorAll('[data-faq]').forEach((row) => row.addEventListener('click', () => {
        const ans = view.querySelector(`[data-ans="${row.dataset.faq}"]`);
        const open = ans.style.display !== 'none';
        ans.style.display = open ? 'none' : 'block';
        row.querySelector('.set-row__arrow').style.transform = open ? '' : 'rotate(180deg)';
      }));
      document.getElementById('helpMail').addEventListener('click', () => { location.href = 'mailto:xsc@cqytxy.edu.cn?subject=换一圈使用问题'; });
      document.getElementById('helpOffer').addEventListener('click', () => {
        openSheet('提交产品建议', `<textarea class="field field--area" id="ideaText" placeholder="希望换一圈增加什么功能？"></textarea>
          <button class="btn btn--block" style="margin-top:14px" id="ideaGo">提交</button>`, {
          onMount(sheet, close) {
            sheet.querySelector('#ideaGo').addEventListener('click', () => {
              const t = sheet.querySelector('#ideaText').value.trim();
              if (!t) { toast('写点建议'); return; }
              localStorage.setItem('idea:' + Date.now(), t); close(); toast('建议已记录，谢谢你');
            });
          },
        });
      });
      document.getElementById('helpChat').addEventListener('click', async () => {
        try {
          const r = await api.post('/api/conversation/start', { itemId: 37 });
          location.hash = '#/chat/' + r.id;
        } catch (e) { toast(e.message); }
      });
    },
  };

  /* ============================================================ 校内上门 */
  PAGES.doorService = {
    async render(view) {
      let list = [];
      let error = '';
      const me = window.__me || await api.get('/api/user/me').catch(() => null);
      const building = me?.building?.trim();
      try {
        const data = await api.get('/api/item/list', { building, page: 1, size: 20 });
        list = data.list || [];
      } catch (e) { error = e.message; }
      view.innerHTML = `
        ${topbar('同楼闲置')}
        ${error ? `<div class="empty" role="status">${esc(error)} <button class="btn btn--ghost btn--sm" id="doorRetry">重试</button></div>`
          : list.length ? waterfall(list) : mascotEmpty(building ? '这栋楼暂时没有闲置' : '暂时没有在架闲置', 'assets/brand/mascot-wave-320.webp', { href: '#/market', text: '去集市看看' })}`;
      view.querySelector('#doorRetry')?.addEventListener('click', () => renderRoute());
    },
  };

  /* ============================================================ 失物招领 */
  PAGES.lostFound = {
    tab: 'home',
    async render(view) {
      let list = [];
      let error = '';
      try { list = await api.get('/api/wish') || []; } catch (e) { error = e.message; }
      const lost = list.filter((w) => String(w.title || '').indexOf('【失物】') === 0);
      view.innerHTML = `
        ${topbar('寻物启事', { right: '<button class="campus-service-publish" id="lostNew">发布启事</button>' })}
        <div class="m-subpage">
          ${error ? `<div class="empty" role="status">${esc(error)} <button class="btn btn--ghost btn--sm" id="lostRetry">重试</button></div>` : lost.length ? lost.map((w) => `
            <div class="lost-card">
              <div class="lost-card__head">
                <span class="badge badge--orange">寻物</span>
                <span class="lost-card__time">${fmtTime(w.createdAt)}</span>
              </div>
              <div class="lost-card__title">${esc(String(w.title || '').replace('【失物】', ''))}</div>
              ${w.content ? `<div class="lost-card__desc">${esc(w.content)}</div>` : ''}
              <div class="lost-card__foot">
                ${avatar({ nickname: w.nickname || '同学', id: w.userId || 1, avatar: w.avatar }, 22)}
                <span>${esc(w.nickname || '同学')}</span>
              </div>
            </div>`).join('') : mascotEmpty('还没有失物信息', 'assets/brand/mascot-wave-320.webp')}
        </div>`;
      view.querySelector('#lostRetry')?.addEventListener('click', () => renderRoute());
      document.getElementById('lostNew').addEventListener('click', () => {
        openSheet('发布失物信息', `
          <label class="label" for="lostTitle">丢失物品</label><input class="field" id="lostTitle" maxlength="96" placeholder="例如蓝色雨伞">
          <label class="label" for="lostDesc" style="margin-top:10px">地点、时间和特征</label><textarea class="field field--area" id="lostDesc" maxlength="500"></textarea>
          <button class="btn btn--block" style="margin-top:14px" id="lostGo">发布</button>`, {
          onMount(sheet, close) {
            const submit = sheet.querySelector('#lostGo');
            submit.addEventListener('click', async () => {
              const t = sheet.querySelector('#lostTitle').value.trim();
              const d = sheet.querySelector('#lostDesc').value.trim();
              if (!t) { toast('写一下丢了什么'); return; }
              submit.disabled = true;
              try {
                await api.post('/api/wish', { title: '【失物】' + t, content: d || '帮忙留意一下', category: '其他' });
                close(); toast('已发布'); renderRoute();
              } catch (e) { toast(e.message); }
              finally { submit.disabled = false; }
            });
          },
        });
      });
    },
  };

  /* ============================================================ 行情 */
  PAGES.marketQuote = {
    tab: 'home',
    async render(view) {
      let rows = [];
      try { rows = await api.get('/api/social/market') || []; } catch (e) { /* 忽略 */ }
      view.innerHTML = `
        ${topbar('行情')}
        <div style="padding:0 13px 20px">
          <div class="tool-card" style="padding:14px;font-size:12.5px;color:var(--ink-500);line-height:1.6">按分类统计当前在架商品的价格，数据来自本站真实挂单。</div>
          ${rows.map((r) => `
            <div class="tool-card" style="margin:0 0 10px;padding:15px">
              <div style="display:flex;align-items:baseline;justify-content:space-between">
                <div style="font-size:17px;font-weight:700">${esc(r.category)}</div>
                <div style="font-size:12px;color:var(--ink-500)">${r.total} 件在架</div>
              </div>
              <div style="display:flex;align-items:baseline;gap:6px;margin-top:10px">
                <span style="font-size:12px;color:var(--ink-500)">均价</span>
                <span class="price" style="font-size:24px"><em>¥</em><b>${api.yuan(r.avg)}</b></span>
              </div>
              <div style="margin-top:10px;height:6px;border-radius:3px;background:var(--green-50);position:relative">
                <div style="position:absolute;left:0;top:0;bottom:0;width:100%;border-radius:3px;background:linear-gradient(90deg,var(--green-100),var(--green-500))"></div>
              </div>
              <div style="display:flex;justify-content:space-between;margin-top:6px;font-size:11px;color:var(--ink-500)">
                <span>最低 ¥${api.yuan(r.min)}</span><span>最高 ¥${api.yuan(r.max)}</span>
              </div>
            </div>`).join('') || mascotEmpty('还没有足够的挂单价格', 'assets/brand/mascot-wave-320.webp')}
        </div>`;
    },
  };

  /* ============================================================ 用户搜索 */
  PAGES.users = {
    async render(view, params) {
      const kw = params.kw || '';
      let list = [];
      try { list = await api.get('/api/social/users', { q: kw }) || []; } catch (e) { /* 忽略 */ }
      view.innerHTML = `
        <div class="search-head">
          <span class="back" onclick="smartBack('#/community')">${icon('back', 22)}</span>
          <div class="search-box"><input class="txt" id="uInput" value="${esc(kw)}" placeholder="搜同学昵称、学院、宿舍楼"></div>
          <button class="search-go" id="uGo">搜索</button>
        </div>
        <div style="padding:4px 13px 0">
          ${list.length ? list.map((u) => `
            <a class="conv" href="#/user/${u.id}" style="padding:12px 0">
              ${avatar({ nickname: u.nickname, id: u.id, avatar: u.avatar }, 48)}
              <div class="conv__main">
                <div class="conv__top"><span class="conv__name">${esc(u.nickname)}</span>
                  ${creditLabel(u.credit) ? `<span class="badge badge--orange">卖家信用${creditLevel(u.credit)}</span>` : ''}
                </div>
                <div class="conv__text">${esc(u.college || '重庆移通学院')} | ${esc(u.building || '缤果大街')}</div>
              </div>
              ${icon('right', 16)}
            </a>`).join('') : mascotEmpty('没找到这个同学', 'assets/brand/mascot-wave-320.webp')}
        </div>`;
      const go = () => {
        const v = document.getElementById('uInput').value.trim();
        location.hash = v ? '#/users/' + encodeURIComponent(v) : '#/users';
      };
      document.getElementById('uGo').addEventListener('click', go);
      document.getElementById('uInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
    },
  };

  /* ============================================================ 交换单详情 */
  PAGES.exchangeDetail = {
    noTab: true,
    async render(view, params) {
      const me = window.__me || await api.get('/api/user/me').catch(() => null);
      let e;
      try { e = await api.get('/api/exchange/' + params.id); }
      catch (err) { view.innerHTML = mascotEmpty(esc(err.message), 'assets/brand/mascot-wave-320.webp'); return; }
      const summary = window.exchangeSummary(e);
      const { mine, people, recipient, sender } = summary;
      const closed = e.status === 4 || e.status === 5;
      const cash = e.type === 4;
      const deadline = e.confirmExpiresAt ? new Date(e.confirmExpiresAt) : null;
      const expires = deadline && !Number.isNaN(deadline.getTime())
        ? new Intl.DateTimeFormat('zh-CN',{month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(deadline) : '';
      const reviewTargets = people.filter((person) => !summary.isMe(person) && (!me || person.userId !== me.id));
      const steps = ['待确认', '待交付', '已完成'];
      const confArr = e.confirmedArrangement || null;
      const pendArr = e.pendingArrangement || null;
      const meetPlace = confArr?.place || pendArr?.place || e.place || '待约定';
      const shownArr = confArr || pendArr;
      const meetTime = shownArr ? [shownArr.startTime, shownArr.endTime].filter(Boolean).join(' - ') : (e.dealTime || '待约定');
      const meetHint = confArr ? '已约好'
        : pendArr ? `${pendArr.confirmedByMe ? '已提议，等对方确认' : '已有提议，待你确认'} | ${pendArr.confirmedCount}/${pendArr.needCount} 已确认`
        : e.status === 3 ? '自行约定面交' : '待约面交';

      view.innerHTML = `
        ${topbar('交换单 #' + e.id, { parent: '#/me/exchange', right: '<button class="btn btn--ghost btn--sm" data-refresh-exchange>刷新</button>' })}
        <main class="exchange-mobile">
          <header class="exchange-mobile__status">
            <p class="exchange-mobile__type">${e.type === 3 ? '三方成环' : cash ? '校园面交' : '一对一交换'}</p>
            <h1>${esc(e.statusText || '交换单')}</h1>
            <p>${esc(closed && e.closedByName ? e.closedByName + ' 已退出，本次交换已关闭。' : summary.next)}</p>
            ${expires && Number(e.status) === 1 ? `<p>确认截止 ${esc(expires)}，超时后物品会重新上架。</p>` : ''}
            ${cash ? `<p><strong>约定面交价 ¥${api.yuan(e.amountCents)}</strong> | 当面验货后现场结算</p>` : ''}
            ${e.status >= 1 && e.status <= 3 ? `<ol class="exchange-mobile__steps" aria-label="交换进度">
              ${steps.map((label, i) => i === 0 && !summary.needsConfirmation ? '' : `<li class="${e.status >= i + 1 ? 'reached' : ''}" ${e.status === i + 1 ? 'aria-current="step"' : ''}>${label}</li>`).join('')}
            </ol>` : ''}
            ${!closed ? `<p class="exchange-mobile__counts">${summary.needsConfirmation ? `已确认 ${e.confirmedCount || 0}/${e.needConfirm || people.length} | ` : ''}已交接 ${e.deliveredCount || 0}/${e.needConfirm || people.length}</p>` : ''}
          </header>

          ${mine && !cash ? `<section class="exchange-mobile__handoff" aria-label="我的物品交接">
            <div><span>我给出</span><strong>${esc(mine.giveTitle || '物品')}</strong>
              ${recipient ? `<small>交给 ${esc(recipient.nickname || '同学')}</small>` : ''}</div>
            <div><span>我收到</span><strong>${esc(mine.getTitle || '物品')}</strong>
              ${sender ? `<small>来自 ${esc(sender.nickname || '同学')}</small>` : ''}</div>
          </section>` : ''}

          ${closed ? `<section class="exchange-mobile__meet">
            <a class="btn" href="${e.type === 3 && mine?.giveItemId ? '#/cycle/' + Number(mine.giveItemId) : e.type === 3 ? '#/relay' : '#/market'}">${e.type === 3 ? '重新找环' : '返回集市'}</a>
          </section>` : `<section class="exchange-mobile__meet">
            <h2>面交安排 <small style="font-weight:600;color:#0c7263">${esc(meetHint)}</small></h2>
            <p class="exchange-next-step">${summary.canConfirm ? '先确认参与，等所有参与者同意后再交接。'
              : summary.canReceive ? '在校内公共地点核对物品，确认完成交接后再操作。'
              : e.status === 2 && mine?.delivered ? '你已确认收到，等待其他参与者确认。'
              : e.status === 3 ? '本次交换已完成。' : ''}</p>
            ${e.status !== 3 || confArr || e.place || e.dealTime ? `<dl><div><dt>${confArr ? '已定地点' : pendArr ? '提议地点' : '地点'}</dt><dd>${esc(meetPlace)}</dd></div>
              <div><dt>${confArr ? '已定时间' : pendArr ? '提议时间' : '时间'}</dt><dd>${esc(meetTime || '待约定')}</dd></div>
              ${confArr?.note ? `<div><dt>备注</dt><dd>${esc(confArr.note)}</dd></div>` : ''}</dl>` : ''}
            ${pendArr ? `<div style="margin:10px 0 12px;padding:10px 12px;border-radius:10px;background:#f0faf8;border:1px solid #cce7e0;font-size:13px;line-height:1.55">
              <b>${confArr ? '改期提议 v' : '待确认提议 v'}${Number(pendArr.version)}</b>（${esc(pendArr.proposerName || '同学')} 提出 | ${pendArr.confirmedCount}/${pendArr.needCount} 已确认）<br>
              地点：${esc(pendArr.place)}${pendArr.startTime ? ` ｜ 时间：${esc([pendArr.startTime, pendArr.endTime].filter(Boolean).join(' - '))}` : ''}
              ${pendArr.note ? `<br><span style="color:#475569">备注：${esc(pendArr.note)}</span>` : ''}
            </div>` : ''}
            <div class="exchange-mobile__actions">
              ${summary.canConfirm ? '<button class="btn" id="exConfirm">确认参与</button>' : ''}
              ${summary.canReceive ? `<button class="btn btn--ghost" id="exDone">${esc(summary.receiptLabel || '确认收货')}</button>` : ''}
              ${e.status === 3 && reviewTargets.length ? '<button class="btn" id="exReview">去评价</button>' : ''}
              ${(e.status === 3 || e.status === 4) ? '<a class="btn btn--ghost" href="#/home">返回主页面</a>' : ''}
              ${summary.active && pendArr && !pendArr.confirmedByMe ? `<button class="btn" id="exArrConfirm" data-ver="${Number(pendArr.version)}">同意安排</button>` : ''}
              ${summary.active ? `<button class="btn btn--ghost" id="exPlace">${pendArr || confArr ? '改个时间或地点' : '提议时间和地点'}</button><button class="exchange-mobile__cancel" id="exCancel">取消交换</button>` : ''}
            </div>
          </section>`}

          <section class="exchange-mobile__people">
            ${window.exchangeDisputeTimeline(e, esc)}
            ${summary.active || e.status === 6 ? `<button class="btn btn--ghost" id="exDispute">${e.status === 6 ? '补充情况' : '提交面交争议'}</button>` : ''}
            <h2>参与者</h2>
            ${people.map((d) => {
              const to = summary.recipientFor(d);
              return `
              <div class="ex-person">
                ${avatar({ nickname: d.nickname || '同学', id: d.userId, avatar: d.avatar }, 36)}
                <div class="main">
                  <b>${esc(d.nickname || '同学')}${summary.isMe(d) ? '（我）' : ''}</b>
                  <p>${cash ? (Number(d.userId) === Number(e.cashBuyerId) ? '买家' : '出售方') : `给出 ${esc(d.giveTitle || '物品')}${to ? ' 给 ' + esc(summary.isMe(to) ? '我' : to.nickname || '同学') : ''} | 收到 ${esc(d.getTitle || '物品')}`}</p>
                  ${!closed ? `<div class="flags">
                    ${summary.needsConfirmation ? `<span class="badge ${d.confirmed ? 'badge--green' : 'badge--gray'}">${d.confirmed ? '已确认参与' : '待确认参与'}</span>` : ''}
                    <span class="badge ${d.delivered ? 'badge--green' : 'badge--gray'}">${d.delivered ? '已确认收货' : '待确认收货'}</span>
                  </div>` : ''}
                </div>
              </div>`;
            }).join('')}
            ${e.type === 3 && !closed ? `<a class="btn btn--ghost" href="#/ring/${e.id}">进入三方协商房间</a>` : ''}
          </section>
        </main>`;

      const route = location.hash;
      const refresh = () => location.hash === route && PAGES.exchangeDetail.render(view, params);
      const disputeBtn = document.getElementById('exDispute');
      if (disputeBtn) disputeBtn.addEventListener('click', () => {
        openSheet('说明面交情况', `
          <p>${e.status === 6 ? '补充说明会显示在交换单。' : '提交后，交易将暂停并交由管理员处理。'}</p>
          <label for="exDisputeText">情况说明</label>
          <textarea id="exDisputeText" class="pe-desc-in" maxlength="1000"></textarea>
          <button class="btn btn--block" id="exDisputeSubmit">提交说明</button>`, {
          onMount(sheet, close) {
            const submit = sheet.querySelector('#exDisputeSubmit');
            submit.addEventListener('click', async () => {
              const statement = sheet.querySelector('#exDisputeText').value.trim();
              if (!statement) { toast('请填写情况说明'); return; }
              submit.disabled = true;
              try {
                await api.post('/api/exchange/' + e.id + '/dispute', { statement });
                close();
                toast('说明已提交');
                await refresh();
              } catch (err) { toast(err.message); }
              finally { submit.disabled = false; }
            });
          },
        });
      });
      const confirmBtn = document.getElementById('exConfirm');
      if (confirmBtn) confirmBtn.addEventListener('click', async () => {
        confirmBtn.disabled = true;
        try {
          await api.post('/api/exchange/' + e.id + '/confirm', {});
          toast('已确认参与');
          await refresh();
        } catch (err) { toast(err.message); }
        finally { confirmBtn.disabled = false; }
      });
      const doneBtn = document.getElementById('exDone');
      if (doneBtn) doneBtn.addEventListener('click', () => {
        const label = summary.receiptLabel || '确认收货';
        const check = cash && !summary.cashBuyer ? '请确认已在现场收到约定款项。' : '请先验货，并确认已在现场收到商品。';
        confirmSheet(label, check + '提交后不可撤回，双方确认后这笔交易完成。', label, async () => {
          doneBtn.disabled = true;
          try {
            await api.post('/api/exchange/' + e.id + '/done', {});
            toast('已确认收货');
            await refresh();
          } catch (err) { toast(err.message); }
          finally { doneBtn.disabled = false; }
        });
      });
      const reviewBtn = document.getElementById('exReview');
      if (reviewBtn) reviewBtn.addEventListener('click', () => {
        const review = async (target) => {
          try {
            await window.ensureMobilePage('profile');
            window.openReviewUser({ id: target.userId, nickname: target.nickname || '同学', avatar: target.avatar }, e.id);
          } catch (error) { toast(error.message); }
        };
        if (reviewTargets.length === 1) { review(reviewTargets[0]); return; }
        openSheet('选择评价对象', reviewTargets.map((target, i) =>
          `<button class="btn btn--block btn--ghost" data-review-target="${i}">${esc(target.nickname || '同学')}</button>`
        ).join(''), {
          onMount(sheet, close) {
            sheet.querySelectorAll('[data-review-target]').forEach((button) => button.addEventListener('click', () => {
              close();
              review(reviewTargets[Number(button.dataset.reviewTarget)]);
            }));
          },
        });
      });
      const cancelBtn = document.getElementById('exCancel');
      if (cancelBtn) cancelBtn.addEventListener('click', () => {
        openSheet('是否取消这笔交换？', '<p>确认后物品会重新上架，其他参与者会收到通知。</p>'
          + '<div class="exchange-mobile__actions"><button type="button" class="btn" data-continue>继续交换</button>'
          + '<button type="button" class="btn btn--ghost exchange-danger" data-cancel>确认取消这笔交换</button></div>', {
          closeText:'继续交换',
          onMount(sheet, close) {
            sheet.querySelector('[data-continue]').onclick = close;
            sheet.querySelector('[data-cancel]').onclick = async event => {
              const button = event.currentTarget;
              button.disabled = true;
              try {
                await api.post('/api/exchange/' + e.id + '/cancel', {reason:'参与者主动取消'});
                close(); toast('交换已取消'); await refresh();
              } catch (err) { toast(err.message); }
              finally { button.disabled = false; }
            };
          }
        });
      });
      const arrConfirmBtn = document.getElementById('exArrConfirm');
      if (arrConfirmBtn) arrConfirmBtn.addEventListener('click', async () => {
        arrConfirmBtn.disabled = true;
        try {
          await api.post('/api/exchange/' + e.id + '/arrangements/' + Number(arrConfirmBtn.dataset.ver) + '/confirm', {});
          toast('已同意面交安排');
          await refresh();
        } catch (err) { toast(err.message); await refresh(); }
        finally { arrConfirmBtn.disabled = false; }
      });

      document.getElementById('exPlace')?.addEventListener('click', () => {
        openSheet('提议时间和地点', `
          <div class="label">校内公共点位</div>
          <div class="pe-chips" id="exPlaces">${['图书馆门口', '缤果大街', '紫荆 3 号楼', '紫荆 5 号楼', '体育馆'].map((p, i) => `<span class="chip${i === 0 ? ' on' : ''}" data-v="${p}">${p}</span>`).join('')}</div>
          <div class="label" style="margin-top:16px">时间</div>
          <input type="datetime-local" id="exTimes" aria-label="面交日期和时间">
          <div class="label" style="margin-top:16px">备注（选填）</div>
          <input id="exArrNote" style="width:100%;height:40px;padding:0 12px;border:1px solid var(--line);border-radius:10px;box-sizing:border-box" maxlength="100" placeholder="例如 在北门台阶旁见">
          <button class="btn btn--block" style="margin-top:18px" id="exPlaceGo">提交并通知对方确认</button>`, {
          onMount(sheet, close) {
            ['exPlaces'].forEach((id) => sheet.querySelectorAll('#' + id + ' .chip').forEach((c) => c.addEventListener('click', () => {
              sheet.querySelectorAll('#' + id + ' .chip').forEach((x) => x.classList.remove('on')); c.classList.add('on');
            })));
            const submit = sheet.querySelector('#exPlaceGo');
            submit.addEventListener('click', async () => {
              const place = sheet.querySelector('#exPlaces .chip.on').dataset.v;
              const selected = sheet.querySelector('#exTimes').value;
              if (!selected) { toast('请选择面交日期和时间'); return; }
              const startTime = selected.replace('T', ' ') + ' ' + new Date(selected).toLocaleDateString('zh-CN', {weekday:'short'});
              const note = (sheet.querySelector('#exArrNote')?.value || '').trim();
              submit.disabled = true;
              submit.textContent = '提交中…';
              try {
                await api.post('/api/exchange/' + e.id + '/arrangements', { place, startTime, note });
                close();
                toast('已提交提议，等待对方确认');
                refresh();
              } catch (err) { toast(err.message); }
              finally { submit.disabled = false; submit.textContent = '提交并通知对方确认'; }
            });
          },
        });
      });
      view.querySelector('[data-refresh-exchange]')?.addEventListener('click', async event => {
        const button = event.currentTarget;
        button.disabled = true;
        try { await refresh(); } finally { button.disabled = false; }
      });
    },
  };

  /* ============================================================ 一键擦亮 */
  PAGES.refreshPick = {
    tab: 'me',
    async render(view) {
      let list = [];
      try { list = await api.get('/api/item/mine') || []; } catch (e) { /* 未登录 */ }
      const can = list.filter((i) => i.status === 1 || i.status === 5);
      view.innerHTML = `
        ${topbar('一键擦亮')}
        <div style="padding:0 13px 20px">
          <div class="tool-card" style="display:flex;align-items:center;gap:12px">
            <img src="assets/brand/mascot-wave-320.webp" style="width:60px;height:60px;object-fit:contain" alt="">
            <div>
              <div style="font-size:16px;font-weight:700">擦亮让宝贝排到前面</div>
              <div style="font-size:12.5px;color:var(--ink-500);margin-top:3px">每件每天可以擦亮一次</div>
            </div>
          </div>
          <div class="set-card">
            ${can.length ? can.map((i) => `
              <div class="set-row" style="height:auto;padding:12px 14px;gap:12px">
                <img src="${api.firstPic(i)}" style="width:46px;height:46px;border-radius:7px;object-fit:cover" alt="">
                <div style="flex:1;min-width:0">
                  <div style="font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(i.title)}</div>
                  <div style="font-size:11px;color:var(--ink-500);margin-top:3px">${fmtTime(i.updateTime)} 更新</div>
                </div>
                <button class="chip on" data-refresh="${i.id}">擦亮</button>
              </div>`).join('') : '<div class="empty" style="padding:34px 0">还没有在架的宝贝</div>'}
          </div>
        </div>`;
      view.querySelectorAll('[data-refresh]').forEach((btn) => btn.addEventListener('click', async () => {
        try {
          await api.post('/api/social/refresh', { itemId: Number(btn.dataset.refresh) });
          btn.textContent = '已擦亮'; btn.disabled = true; btn.style.opacity = '.5';
          toast('擦亮成功，排序已刷新');
        } catch (e) { toast(e.message); }
      }));
    },
  };

  window.PAGES = PAGES;
})();
