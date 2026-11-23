import { bindBrowseMore } from "../market/mobile.js";

const PAGES = window.PAGES;

const homeTabs = () => '';

const HOME_CATEGORIES = ['教材', '数码', '运动', '生活', '衣物', '绿植', '其他'];

const HOME_SEARCH_TOPICS = ['小家电', '考研资料'];

const HOME_WISH_FILTERS = [['all', '全部'], ['relay', '可接力'], ...HOME_CATEGORIES.map(category => [category, category])];

function searchSuggestion(label) {
  const route = HOME_CATEGORIES.includes(label) ? 'category' : 'search';
  return `<a class="chip" href="#/${route}/${encodeURIComponent(label)}">${esc(label)}</a>`;
}

function homeWishCard(wish) {
  const nickname = wish.nickname || '同学';
  const category = wish.category === '全部' ? '' : wish.category;
  const created = wish.createdAt || wish.createTime;
  const dateLabel = fmtTime(created);
  const author = `${avatar({ nickname, id: wish.userId, avatar: wish.avatar }, 17)}<span class="mobile-wish__nickname">${esc(nickname)}</span>`;
  return `<article class="mobile-wish">
      <div class="home-wish__labels">
        <span class="mobile-wish__kind">求换</span>
        ${category ? `<span class="home-wish__category">${esc(category)}</span>` : ''}
      </div>
      <h3>${esc(wish.title || '求换好物')}</h3>
      ${wish.content ? `<p class="mobile-wish__description">${esc(wish.content)}</p>` : ''}
      <div class="mobile-wish__exchange"><span>期望交换</span>
        ${wish.offeredItemId ? `<strong>三方接力</strong><a class="home-wish__swap" href="#/item/${Number(wish.offeredItemId)}">换这个</a>` : '<strong>物品互换</strong>'}
      </div>
      <footer class="mobile-wish__footer">
        ${wish.userId ? `<a class="home-wish__author" href="#/user/${Number(wish.userId)}">${author}</a>` : `<span class="home-wish__author">${author}</span>`}
        ${dateLabel ? `<time datetime="${esc(created)}">${esc(dateLabel)}</time>` : ''}
      </footer>
    </article>`;
}

const PRIMARY_SERVICES = [
  { name: '以物换物', href: '#/market/swap', art: 'swap', note: '拿闲置换好物' },
  { name: '校园拍卖', href: '#/auction', art: 'auction', note: '为心仪物品出价' },
  { name: '换物接力', href: '#/relay', art: 'swapRing-loop-v1', note: '三人成环，互换闲置' },
];

function serviceLink(service, size) {
  return `<a href="${service.href}"><i><img src="assets/brand/illustrated-${service.art}-home.webp" width="${size}" height="${size}" alt=""></i><span>${service.name}</span><small>${service.note}</small></a>`;
}

window.__homeChannel = window.__homeChannel || '推荐';

PAGES.home = {
  tab: 'home',
  async render(view) {
    const route = location.hash;
    const allChannels = ['关注', '推荐', '新发', '心愿单', ...HOME_CATEGORIES, ...HOME_SEARCH_TOPICS];
    if (!allChannels.includes(window.__homeChannel)) window.__homeChannel = '推荐';

    view.innerHTML = `
      <main class="mobile-home"><div class="home-head">
        <div class="home-guest-nav">
          <b class="home-brand">换一圈</b>
          <a class="home-guest-login" href="#/login" hidden>登录</a>
        </div>
        <p class="home-purpose">校园闲置以物换物，换不上就找三方接力。</p>
        <form class="home-search" role="search">
          <button type="button" class="scan-btn" aria-label="扫码或拍照搜">${icon('scan', 20)}</button>
          <input name="keyword" type="search" aria-label="搜索校园闲置" placeholder="搜索校园里的好物" maxlength="200">
          <button type="submit" aria-label="搜索">${icon('search', 21)}</button>
        </form>
        <div class="channels hscroll" id="homeChannels">
          ${allChannels.map((c) => {
          const isOn = c === window.__homeChannel;
          return `<a class="${isOn ? 'on' : ''}" data-ch="${c}" href="javascript:void 0">${c}</a>`;
        }).join('')}
        </div>
      </div>
      <div id="homeDynamicBody"></div>
      </main>`;

    const login = view.querySelector('.home-guest-login');
    api.get('/api/user/me').catch(error => {
      if (error.code === 401 && login) login.hidden = false;
    });

    view.querySelector('.home-search').addEventListener('submit', (event) => {
      event.preventDefault();
      const keyword = event.currentTarget.elements.keyword.value.trim();
      window.__searchTab = 'all';
      window.__searchSort = '';
      window.__searchFilter = {};
      location.hash = keyword ? '#/search/' + encodeURIComponent(keyword) : '#/search';
    });

    const bodyEl = document.getElementById('homeDynamicBody');
    let tickTimer = null;
    let channelSeq = 0;
    const clearHomeTicker = () => {
      if (tickTimer) { clearInterval(tickTimer); tickTimer = null; }
    };
    window.__cleanup = clearHomeTicker;

    const renderChannelContent = async (channel) => {
      const seq = ++channelSeq;
      clearHomeTicker();
      view.querySelectorAll('#homeChannels [data-ch]').forEach((el) => {
        el.classList.toggle('on', el.dataset.ch === channel);
      });
      bodyEl.innerHTML = '<div style="padding:36px 16px;text-align:center;color:var(--ink-400);font-size:13px">正在加载内容...</div>';

      const isCategory = HOME_CATEGORIES.includes(channel);
      const isTopic = HOME_SEARCH_TOPICS.includes(channel);

      if (channel === '心愿单') {
        let wishes;
        let wishError;
        try { wishes = await api.get('/api/wish') || []; } catch (error) { wishError = error; }
        if (seq !== channelSeq || location.hash !== route || !bodyEl.isConnected) return;
        const needsLogin = wishError?.code === 401;
        const publishHref = needsLogin ? '#/login' : '#/publish/edit/wish';
        bodyEl.innerHTML = `
            <section class="mobile-wishes home-wishes" aria-labelledby="homeWishTitle">
              <header class="mobile-wishes__header">
                <div>
                  <h2 id="homeWishTitle">校园求换心愿单</h2>
                  <p>看看同学们都想换什么</p>
                </div>
                <a class="mobile-wishes__publish" href="${publishHref}">${needsLogin ? '登录后发布' : '发布求换心愿'}</a>
              </header>
              ${wishError ? '' : `<div class="mobile-wishes__filters" aria-label="筛选心愿">
                ${HOME_WISH_FILTERS.map(([key, label]) => `<button type="button" data-wish-filter="${key}" aria-pressed="${key === 'all'}">${label}</button>`).join('')}
              </div>`}
              <div class="mobile-wishes__feed" data-home-wishes></div>
            </section>`;
        const feed = bodyEl.querySelector('[data-home-wishes]');
        if (wishError) {
          feed.innerHTML = needsLogin
            ? '<div class="mobile-wishes__empty"><p>登录后查看同学们的心愿</p><a href="#/login">去登录</a></div>'
            : '<div class="mobile-wishes__empty"><p>心愿加载失败</p><button type="button">重新加载</button></div>';
          feed.querySelector('button')?.addEventListener('click', () => renderChannelContent(channel));
          return;
        }
        const filterButtons = bodyEl.querySelectorAll('[data-wish-filter]');
        const showWishes = (filter) => {
          filterButtons.forEach(button => button.setAttribute('aria-pressed', button.dataset.wishFilter === filter));
          const shown = wishes.filter(wish => filter === 'all' || (filter === 'relay' ? !!wish.offeredItemId : wish.category === filter));
          feed.innerHTML = shown.length ? shown.map(homeWishCard).join('') : filter === 'all'
            ? '<div class="mobile-wishes__empty"><p>还没有求换心愿</p><a href="#/publish/edit/wish">去发心愿</a></div>'
            : '<div class="mobile-wishes__empty"><p>这个分类还没有心愿</p><button type="button" data-show-all-wishes>查看全部</button></div>';
        };
        filterButtons.forEach(button => button.addEventListener('click', () => showWishes(button.dataset.wishFilter)));
        feed.addEventListener('click', event => {
          if (event.target.closest('[data-show-all-wishes]')) {
            showWishes('all');
            filterButtons[0].focus();
          }
        });
        showWishes('all');
        return;
      }

      const showServices = channel === '推荐';
      bodyEl.innerHTML = `
          ${showServices ? `<nav class="home-primary-services" aria-label="主要功能" style="margin:6px 12px 2px">
            ${PRIMARY_SERVICES.map(service => serviceLink(service, 48)).join('')}
          </nav>` : ''}
          <div class="home-feed" role="status">正在加载好物…</div>`;
      const feedHost = bodyEl.lastElementChild;

      const browseMode = isCategory || isTopic ? 0 : 2;
      const eligible = browseMode ? window.campusExchange.isLiveSwap
        : item => Number(item.tradeMode) !== 3 && (!isCategory || item.category === channel);
      const load = (page) => {
        const q = { page, size: 40 };
        if (isCategory) q.category = channel;
        if (isTopic) return api.get('/api/item/search', { ...q, q: channel });
        return api.get('/api/item/list', q);
      };

      let list = [];
      let batch;
      try {
        batch = await window.campusExchange.browse(load, browseMode, 1, eligible);
        list = batch.rows || [];
      } catch (e) { toast(e.message); }
      if (seq !== channelSeq || location.hash !== route || !bodyEl.isConnected) return;

      let feed = list;
      let followHint = '';
      if (channel === '关注') {
        try {
          const fs = await api.get('/api/social/follow') || [];
          const ids = new Set(fs.map((u) => u.id));
          feed = list.filter((i) => ids.has(i.ownerId));
          if (!fs.length) followHint = '你还没有关注同学，去商品页点关注后上新会第一时间出现在这里';
          else if (!feed.length) followHint = '关注的同学最近还没有发布新闲置';
        } catch (e) {
          feed = [];
          followHint = e && e.code === 401 ? '登录后即可查看关注同学的上新动态' : '暂无关注动态';
        }
        if (seq !== channelSeq || location.hash !== route || !bodyEl.isConnected) return;
      } else if (channel === '新发') {
        feed = list.slice().sort((a, b) => String(b.createTime).localeCompare(String(a.createTime)));
      }

      const emptyAction = channel === '关注'
        ? { href: '#/community', text: '去社区发现同学' }
        : (isCategory ? { href: '#/publish/edit/idle', text: '发布「' + channel + '」闲置' }
          : (isTopic ? { href: '#/publish/edit/wish?want=' + encodeURIComponent(channel), text: '发布求换心愿' } : null));

      feedHost.removeAttribute('role');
      feedHost.outerHTML = `
          <section class="home-feed" aria-label="${esc(channel)}">
            ${showServices
            ? '<h1 class="swap-feed-title"><img src="assets/brand/swap-wordmark.webp" width="48" height="12" alt="以物换物"></h1>'
            : `<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 4px 10px"><b style="font-size:15px;color:var(--ink-900)">${esc(channel)}</b><span style="font-size:12px;color:var(--ink-400)">共 ${feed.length} 件好物</span></div>`}
            <div data-swap-results>${feed.length ? waterfall(feed) : mascotEmpty(followHint || ('暂时没有「' + channel + '」相关好物'), 'assets/brand/mascot-wave-320.webp', emptyAction)}</div>
            ${batch?.hasMore && channel !== '关注' ? '<button class="campus-more" data-swap-more>加载更多</button>' : ''}
          </section>`;

      bindBrowseMore(bodyEl, load, browseMode, batch, channel === '新发', eligible);

      if (!showServices) return;
      const deals = (await api.get('/api/item/deals', { size: 8 }).catch(() => []) || [])
        .filter(window.campusExchange.isLiveSwap);
      if (seq !== channelSeq || location.hash !== route || !bodyEl.isConnected) return;
      if (deals.length) {
        bodyEl.insertAdjacentHTML('beforeend', `<div class="deal-ticker">
            <span class="label">${icon('fire', 12)}成交动态</span><div class="rail" id="dealTicker"></div>
          </div>`);
        const ticker = bodyEl.querySelector('#dealTicker');
        let ti = 0;
        const renderTicker = () => {
          if (!ticker || !document.body.contains(ticker)) return;
          const it = deals[ti % deals.length];
          ticker.innerHTML = `<div><span>同校成交</span><b>${esc(it.title)}</b><em>${api.yuan(it.price) ? '¥' + api.yuan(it.price) : '换物达成'}</em><span>${fmtTimeShort(it.updateTime)}</span></div>`;
          ti++;
        };
        renderTicker();
        if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
          tickTimer = setInterval(renderTicker, 3000);
        }
      }
    };

    view.querySelectorAll('#homeChannels [data-ch]').forEach((a) => {
      a.addEventListener('click', (ev) => {
        ev.preventDefault();
        const c = a.dataset.ch;
        if (!c || c === window.__homeChannel) return;
        window.__homeChannel = c;
        renderChannelContent(c);
      });
    });

    await renderChannelContent(window.__homeChannel);
  },
};

export { HOME_CATEGORIES, homeTabs, searchSuggestion };
