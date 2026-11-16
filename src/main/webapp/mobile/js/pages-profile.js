/* 页面：个人主页（宝贝 / 评价 / 动态）、评价提交 */
(function () {
  const PAGES = window.PAGES || {};

  const IMPRESSIONS = ['收货快', '下单爽快', '回复快', '沟通愉快'];

  PAGES.profile = {
    noTab: true,
    async render(view, params) {
      const id = params.id;
      const tab = params.tab || 'items';
      const isItems = tab === 'items';
      let u = null;
      let items = [];
      let reviews = [];
      let summary = { total: 0, good: 0, withImage: 0, fromBuyer: 0, fromSeller: 0, impressions: {} };
      let community = [];
      try {
        const r = await Promise.all([
          api.get('/api/user/' + id),
          api.get('/api/item/user/' + id).catch(() => []),
          api.get('/api/review/user/' + id).catch(() => []),
          api.get('/api/review/summary/' + id).catch(() => summary),
          api.get('/api/community').catch(() => []),
        ]);
        u = r[0];
        items = r[1] || [];
        reviews = r[2] || [];
        summary = Object.assign(summary, r[3] || {});
        community = (r[4] || []).filter((m) => Number(m.userId) === Number(id));
      } catch (e) {
        view.innerHTML = `<div class="empty">${esc(e.message)}</div>`;
        return;
      }
      let me = window.__me || null;
      if (!me) { try { me = await api.get('/api/user/me'); window.__me = me; } catch (e) { me = null; } }
      const isMe = me && me.id === u.id;

      let following = false;
      if (!isMe && me) {
        try { const r = await api.get('/api/social/follow/check', { userId: u.id }); following = !!(r && r.following); } catch (e) { /* 忽略 */ }
      }

      const buyerLevel = creditLevel(u.buyerCredit == null ? u.credit : u.buyerCredit);
      const sellerLevel = creditLevel(u.sellerCredit == null ? u.credit : u.sellerCredit);
      const visit = u.lastActive ? fmtTimeShort(u.lastActive) + '来过' : '刚刚来过';

      let body = '';
      if (tab === 'review') {
        body = renderReviews(reviews, summary);
      } else if (tab === 'dynamic') {
        body = community.length ? `<div style="padding:2px 0 10px">${community.map((m) => `
          <div class="community-card">
            <div class="hd">${avatar({ nickname: u.nickname, id: u.id, avatar: u.avatar }, 38)}
              <div><b>${esc(u.nickname)}</b><span>${fmtTime(m.createTime)}</span></div></div>
            <p>${esc(m.content || '')}</p>
            ${safeMediaUrl(m.image) ? `<img class="pic" src="${esc(safeMediaUrl(m.image))}" alt="">` : ''}
          </div>`).join('')}</div>` : mascotEmpty('还没有发过动态', 'assets/brand/mascot-wave-320.webp');
      } else {
        body = items.length ? `<div class="r-feed-wrap">${waterfall(items)}</div>`
          : mascotEmpty('这里还没有宝贝', 'assets/brand/mascot-wave-320.webp');
      }

      const heroHtml = `
      <div class="pf-hero">
        <div class="pf-hero__nav">
          <span class="ico" onclick="smartBack('#/messages')">${icon('back', 22)}</span>
          <span class="spacer"></span>
          ${isMe ? `<span class="pf-pill" id="pfEdit">${icon('edit', 13)}编辑资料</span>` : ''}
          <button type="button" class="ico" data-share-profile aria-label="分享主页">${icon('share', 21)}</button>
        </div>
        <div class="pf-id">
          <div class="pf-avt">${safeMediaUrl(u.avatar) ? `<img src="${esc(safeMediaUrl(u.avatar))}" alt="">` : esc((u.nickname || '?').slice(0, 1))}</div>
          <div class="pf-id__main">
            <div class="pf-name">${esc(u.nickname)}</div>
            <div class="pf-sub"><span><b>${u.fansCount || 0}</b> 粉丝</span><span><b>${u.followingCount || 0}</b> 关注</span><span>${visit}</span></div>
          </div>
        </div>
        <div class="pf-tags">
          <span class="pf-tag">${icon('pin2', 13)}${esc(u.college || '重庆移通学院')} | ${esc(u.building || '缤果大街')}</span>
          ${isMe ? '' : `<button class="pf-tag${following ? '' : ' pf-tag--follow'}" id="pfFollow">${following ? '已关注' : '关注 +'}</button>`}
          ${!isMe && me ? `<button class="pf-tag" id="pfReviewBtn">评价 TA</button>` : ''}
        </div>
        <div class="pf-bio">
          <p>${esc(u.bio || '这家伙很神秘，没有写个人简介。')}</p>
          <span class="more" id="pfBioMore">更多 ${icon('right', 13)}</span>
        </div>
        <div class="pf-credit" id="pfCredit">
          <span class="pf-credit__item">${icon('me', 18)}买家信用 <b>${buyerLevel}</b></span>
          <i class="pf-credit__sep"></i>
          <span class="pf-credit__item">${icon('shield', 18)}卖家信用 <b>${sellerLevel}</b></span>
          <span class="pf-credit__arrow">${icon('right', 15)}</span>
        </div>
      </div>`;

      const compactHtml = `
      <div class="pf-compact">
        <button class="topbar__back" onclick="smartBack('#/me')">${icon('back', 22)}</button>
        ${avatar({ nickname: u.nickname, id: u.id, avatar: u.avatar }, 30)}
        <span class="pf-compact__name">${esc(u.nickname)}</span>
        <span style="flex:1"></span>
        ${isMe ? `<button class="pf-compact__act" id="pfEdit">${icon('edit', 19)}</button>` : `<button class="pf-compact__act" data-share-profile aria-label="分享主页">${icon('share', 19)}</button>`}
      </div>`;

      view.innerHTML = `
      ${isItems ? heroHtml : compactHtml}

      ${isItems ? `<div class="pf-mini" id="pfMini">
        <button class="topbar__back" onclick="smartBack('#/me')">${icon('back', 22)}</button>
        ${avatar({ nickname: u.nickname, id: u.id, avatar: u.avatar }, 30)}
        <span class="pf-mini__name">${esc(u.nickname)}</span>
        <span class="spacer" style="flex:1"></span>
        <button type="button" class="ico" data-share-profile aria-label="分享主页" style="color:var(--ink-900)">${icon('share', 20)}</button>
      </div>` : ''}

      <div class="pf-body${isItems ? '' : ' pf-body--compact'}">
        <div class="pf-tabrow">
          <a class="${tab === 'items' ? 'on' : ''}" href="#/user/${id}">宝贝 ${items.length}</a>
          <a class="${tab === 'review' ? 'on' : ''}" href="#/user/${id}/review">评价 ${summary.total || reviews.length}</a>
          <a class="${tab === 'dynamic' ? 'on' : ''}" href="#/user/${id}/dynamic">动态 ${community.length}</a>
          <a class="srch" href="#/search">${icon('search', 21)}</a>
        </div>
        ${body}
      </div>

      ${isMe ? `<a class="pf-fab" href="#/publish/edit/idle">${icon('camera', 19)}<span>发闲置</span></a>` : ''}
      `;

      view.querySelectorAll('[data-share-profile]').forEach((btn) => btn.addEventListener('click', async () => {
        const url = location.origin + '/#/user/' + u.id;
        if (navigator.share) { try { await navigator.share({ title: u.nickname + ' 的换一圈主页', url }); return; } catch (e) { /* 取消 */ } }
        try { await navigator.clipboard.writeText(url); toast('主页链接已复制'); } catch (e) { toast('链接：' + url); }
      }));

      const followBtn = document.getElementById('pfFollow');
      if (followBtn) followBtn.addEventListener('click', async () => {
        try {
          const r = await api.post('/api/social/follow', { userId: u.id });
          following = !!(r && r.following);
          followBtn.textContent = following ? '已关注' : '关注 +';
          followBtn.classList.toggle('pf-tag--follow', !following);
          toast(following ? '已关注' : '已取消关注');
        } catch (e) { toast(e.message); }
      });

      const editBtn = document.getElementById('pfEdit');
      if (editBtn) editBtn.addEventListener('click', () => { location.hash = '#/settings/profile'; });

      const bioMore = document.getElementById('pfBioMore');
      if (bioMore) bioMore.addEventListener('click', () => {
        openSheet('个人简介', `<div style="font-size:14px;line-height:1.8;color:var(--ink-700);white-space:pre-wrap">${esc(u.bio || '这家伙很神秘，没有写个人简介。')}</div>
          <div class="set-card" style="margin-top:16px">
            <div class="set-row">学院<span class="set-row__val">${esc(u.college || '重庆移通学院')}</span></div>
            <div class="set-row">书院 / 宿舍楼<span class="set-row__val">${esc(u.building || '缤果大街')}</span></div>
            <div class="set-row">加入时间<span class="set-row__val">${fmtMonth(u.createTime)}</span></div>
            <div class="set-row">信用分<span class="set-row__val">${displayCredit(u)}</span></div>
          </div>`, { closeText: '关闭' });
      });

      const reviewBtn = document.getElementById('pfReviewBtn');
      if (reviewBtn) reviewBtn.addEventListener('click', () => openReview(u));

      const creditBar = document.getElementById('pfCredit');
      if (creditBar) creditBar.addEventListener('click', () => { location.hash = '#/credit/' + u.id; });

      const searchTab = view.querySelector('.pf-tabrow .srch');
      if (searchTab) searchTab.addEventListener('click', (event) => {
        event.preventDefault();
        openSheet('搜 TA 的宝贝', `<input class="field" id="pfSearchIn" placeholder="搜 ${esc(u.nickname)} 的宝贝">
          <div id="pfSearchList" style="margin-top:8px"></div>`, {
          onMount(sheet, close) {
            const box = sheet.querySelector('#pfSearchList');
            const draw = (kw) => {
              const k = (kw || '').trim().toLowerCase();
              const hits = items.filter((i) => !k || String(i.title).toLowerCase().indexOf(k) >= 0);
              box.innerHTML = hits.length ? hits.map((i) => `
                <div class="list-block" data-item="${i.id}" style="margin:0 -18px;padding-left:18px;padding-right:18px">
                  <img src="${api.firstPic(i)}" alt="">
                  <div class="main"><b>${esc(i.title)}</b><p>${api.yuan(i.price) ? '¥' + api.yuan(i.price) : '想换'} | ${esc(i.conditionLevel)}</p></div>
                  ${icon('right', 16)}
                </div>`).join('') : '<div class="empty" style="padding:26px 0">没有匹配的宝贝</div>';
              box.querySelectorAll('[data-item]').forEach((row) => row.addEventListener('click', () => { close(); location.hash = '#/item/' + row.dataset.item; }));
            };
            draw('');
            sheet.querySelector('#pfSearchIn').addEventListener('input', (e) => draw(e.target.value));
          },
        });
      });

      const mini = document.getElementById('pfMini');
      if (mini) {
        const onScroll = () => mini.classList.toggle('show', (window.scrollY || 0) > 150);
        window.addEventListener('scroll', onScroll, { passive: true });
        window.__cleanup = () => window.removeEventListener('scroll', onScroll);
        onScroll();
      }

      /* 评价筛选 */
      view.querySelectorAll('.rev-filter .chip').forEach((c) => {
        c.addEventListener('click', () => {
          view.querySelectorAll('.rev-filter .chip').forEach((x) => x.classList.remove('on'));
          c.classList.add('on');
          filterReviews(view, reviews, c.dataset.f, c.dataset.v);
        });
      });
    },
  };

  function renderReviews(reviews, summary) {
    return `
      <div class="pf-chips rev-filter" data-row="1">
        <span class="chip on" data-f="all">全部</span>
        <span class="chip" data-f="image">有图 <span class="n">${summary.withImage || 0}</span></span>
        <span class="chip" data-f="good">好评 <span class="n">${summary.good || 0}</span></span>
        <span class="chip" data-f="buyer">来自买家 <span class="n">${summary.fromBuyer || 0}</span></span>
        <span class="chip" data-f="seller">来自卖家 <span class="n">${summary.fromSeller || 0}</span></span>
      </div>
      <div class="pf-chips rev-filter" data-row="2" style="padding-top:0">
        ${IMPRESSIONS.map((k) => `<span class="chip" data-f="imp" data-v="${k}">${k} <span class="n">${(summary.impressions && summary.impressions[k]) || 0}</span></span>`).join('')}
      </div>
      <div style="background:#fff;border-radius:12px;margin:0 13px;overflow:hidden" id="reviewList">
        ${reviews.length ? reviews.map(reviewRow).join('') : '<div class="empty">还没有收到评价</div>'}
      </div>`;
  }

  function reviewRow(r) {
    const good = (r.score || 0) >= 4;
    return `<div class="review-row" data-role="${esc(r.role || '')}" data-score="${r.score}" data-img="${r.image ? '1' : ''}" data-imp="${esc(r.impression || '')}">
      <div class="review-row__top">
        <span onclick="location.hash='#/user/${r.fromUser || 1}'">${avatar({ nickname: r.fromNickname || '同学', id: r.fromUser || 1, avatar: r.fromAvatar }, 34)}</span>
        <span class="badge badge--blue">${r.role === 'buyer' ? '买家' : '卖家'}</span>
        <span class="review-row__name">${esc(r.fromNickname || '同学')}</span>
        <span class="badge ${good ? 'badge--orange' : 'badge--gray'} review-row__result">${icon(good ? 'me' : 'info', 12)}${good ? '好评' : '中评'}</span>
      </div>
      <div class="review-row__text">${esc(r.content || '交易顺利，谢谢同学。')}</div>
      ${r.image ? `<div class="review-row__imgs"><img src="${r.image}" alt=""></div>` : ''}
      ${r.itemTitle ? `<div class="review-row__item"><img src="${api.firstPic({ images: r.itemImage })}" alt=""><span>${esc(r.itemTitle)}</span></div>` : ''}
      <div class="review-row__meta">${fmtTime(r.createTime)}${r.fromBuilding ? ' | ' + esc(r.fromBuilding) : ''}</div>
    </div>`;
  }

  function filterReviews(view, reviews, f, v) {
    let list = reviews.slice();
    if (f === 'image') list = list.filter((r) => r.image);
    if (f === 'good') list = list.filter((r) => (r.score || 0) >= 4);
    if (f === 'buyer') list = list.filter((r) => r.role === 'buyer');
    if (f === 'seller') list = list.filter((r) => r.role === 'seller');
    if (f === 'imp') list = list.filter((r) => String(r.impression || '').indexOf(v) >= 0);
    const box = document.getElementById('reviewList');
    box.innerHTML = list.length ? list.map(reviewRow).join('') : '<div class="empty">这个筛选下还没有评价</div>';
  }

  function openReview(target, exchangeId) {
    api.get('/api/review/pending').then((list) => {
      const pending = (list || []).filter((x) => Number(x.targetUserId) === Number(target.id)
        && (exchangeId == null || Number(x.exchangeId) === Number(exchangeId)));
      if (!pending.length) {
        toast('你们还没有可评价的已完成交易');
        return;
      }
      const p = pending[0];
      let score = 5;
      let picked = [];
      openSheet('评价 ' + esc(target.nickname), `
        <div style="text-align:center;padding:4px 0 14px">
          ${avatar({ nickname: target.nickname, id: target.id, avatar: target.avatar }, 58)}
          <div style="margin-top:8px;font-size:15px;font-weight:600">${esc(target.nickname)}</div>
          <div style="font-size:12px;color:var(--ink-500);margin-top:3px">${esc(p.itemTitle || '交换单')}</div>
        </div>
        <div class="stars" id="starRow">
          ${[1, 2, 3, 4, 5].map((n) => `<button data-s="${n}" class="on">${icon('starFill', 28)}</button>`).join('')}
        </div>
        <div class="label" style="margin-top:16px">印象标签</div>
        <div class="pe-chips" id="impRow">${IMPRESSIONS.map((k) => `<span class="chip" data-v="${k}">${k}</span>`).join('')}</div>
        <div class="label" style="margin-top:16px">说点什么</div>
        <textarea class="field field--area" id="reviewText" maxlength="200" placeholder="交易体验怎么样？写下来帮更多同学判断"></textarea>
        <button class="btn btn--block" style="margin-top:16px" id="reviewGo">提交评价</button>`, {
        onMount(sheet, close) {
          const stars = sheet.querySelectorAll('#starRow button');
          const paint = () => stars.forEach((b, i) => b.classList.toggle('on', i < score));
          stars.forEach((b) => b.addEventListener('click', () => { score = Number(b.dataset.s); paint(); }));
          sheet.querySelectorAll('#impRow .chip').forEach((c) => c.addEventListener('click', () => {
            const i = picked.indexOf(c.dataset.v);
            if (i >= 0) { picked.splice(i, 1); c.classList.remove('on'); } else { picked.push(c.dataset.v); c.classList.add('on'); }
          }));
          sheet.querySelector('#reviewGo').addEventListener('click', async () => {
            try {
              await api.post('/api/review', {
                exchangeId: p.exchangeId, targetUserId: target.id, score,
                content: sheet.querySelector('#reviewText').value.trim(),
                impression: picked.join(','),
              });
              close(); toast('评价已提交，信用分已更新'); renderRoute();
            } catch (e) { toast(e.message); }
          });
        },
      });
    }).catch((e) => toast(e.message));
  }

  window.openReviewUser = openReview;
  window.PAGES = PAGES;
})();
