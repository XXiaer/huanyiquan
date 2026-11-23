import { HOME_CATEGORIES } from "../home/mobile.js";

const PAGES = window.PAGES;

function bindBrowseMore(view, load, mode, batch, newest = false, filter) {
  const button = view.querySelector('[data-swap-more]');
  const results = view.querySelector('[data-swap-results]');
  if (!button) return;
  let rows = batch.rows.slice();
  const observer = window.IntersectionObserver ? new IntersectionObserver((entries, watcher) => {
    if (!button.isConnected) { watcher.disconnect(); return; }
    if (!button.disabled && !button.hidden && entries.some(entry => entry.isIntersecting)) button.click();
  }, {rootMargin: '0px 0px 100px 0px'}) : null;
  const cleanup = window.__cleanup;
  window.__cleanup = () => { observer?.disconnect(); cleanup?.(); };
  button.onclick = async () => {
    if (button.disabled) return;
    observer?.unobserve(button);
    button.disabled = true;
    try {
      batch = await window.campusExchange.browse(load, mode, batch.page + 1, filter);
      if (!results.isConnected) return;
      rows = rows.concat(batch.rows);
      if (newest) rows.sort((a,b) => String(b.createTime).localeCompare(String(a.createTime)));
      results.innerHTML = waterfall(rows);
      button.hidden = !batch.hasMore;
      if (!button.hidden) observer?.observe(button);
    } catch (error) { toast(error.message); }
    finally { button.disabled = false; }
  };
  observer?.observe(button);
}

const marketCache = new Map();

PAGES.market = {
  tab: 'market',
  async render(view, params) {
    const route = siteRoutes.current();
    const category = params.category || '';
    const mode = params.mode || 'all';
    const key = mode + ':' + category;
    const path = (type, subject) => '#/market' + (type === 'all' && !subject ? '' : '/' + type
      + (subject ? '/' + encodeURIComponent(subject) : ''));
    view.innerHTML = `
        <div class="market-head">
          <div class="market-title"><h1>集市</h1><a href="#/community">校园社区</a></div>
          <form class="home-search" role="search">
            <button type="button" class="scan-btn" aria-label="扫码或拍照搜">${icon('scan',20)}</button>
            <input type="search" name="keyword" aria-label="搜索校园好物" placeholder="搜台灯、平板或其他校园好物" maxlength="200">
            <button type="submit" aria-label="搜索">${icon('search',21)}</button>
          </form>
          <div class="r-chips" aria-label="交易方式">
            ${[['all','全部'],['swap','换物'],['sale','出售']].map(([type,label]) =>
            `<a class="chip${mode === type ? ' on' : ''}" href="${path(type,category)}">${label}</a>`).join('')}
          </div>
          <div class="r-chips hscroll" aria-label="商品分类">
            ${['', ...HOME_CATEGORIES].map(c =>
            `<a class="chip${category === c ? ' on' : ''}" href="${path(mode,c)}">${c || '全部分类'}</a>`).join('')}
          </div>
        </div>
        <section class="market-results">
          <p class="market-feedback" role="status">正在加载好物…</p>
          <div data-market-results></div>
          <button class="campus-more" type="button" data-market-more hidden>加载更多</button>
        </section>`;
    const form = view.querySelector('form');
    form.addEventListener('submit', event => {
      event.preventDefault();
      window.__searchTab = 'all';
      window.__searchSort = '';
      window.__searchFilter = { category, tradeMode: mode === 'swap' ? 2 : mode === 'sale' ? 1 : null };
      const keyword = form.elements.keyword.value.trim();
      siteRoutes.go(keyword ? '#/search/' + encodeURIComponent(keyword) : '#/search');
    });
    form.querySelector('.scan-btn').onclick = window.openScanSearch;
    const results = view.querySelector('[data-market-results]');
    const feedback = view.querySelector('.market-feedback');
    const more = view.querySelector('[data-market-more]');
    const old = marketCache.get(key);
    let rows = old?.rows || [];
    function draw() {
      results.innerHTML = rows.length ? waterfall(rows)
        : mascotEmpty('这个分类暂时没有物品', 'assets/brand/mascot-wave-320.webp',
          {href: category || mode !== 'all' ? '#/market' : '#/publish/edit/idle', text: category || mode !== 'all' ? '查看全部' : '发布闲置'});
    }
    if (rows.length) draw();
    let page = 1;
    const observer = window.IntersectionObserver ? new IntersectionObserver((entries, watcher) => {
      if (!more.isConnected || siteRoutes.current() !== route) { watcher.disconnect(); return; }
      if (entries.some(entry => entry.isIntersecting) && !more.disabled && !more.hidden) {
        watcher.unobserve(more);
        load(true);
      }
    }, {rootMargin: '0px 0px 100px 0px'}) : null;
    window.__cleanup = () => observer?.disconnect();
    const load = async (append = false) => {
      if (more.disabled) return;
      observer?.unobserve(more);
      more.disabled = true;
      feedback.textContent = '正在加载好物…';
      try {
        let next = page, batch, hits;
        do {
          batch = await api.get('/api/item/list', {
            category, page: next, size: 30, tradeMode: mode === 'swap' ? 2 : mode === 'sale' ? 1 : null
          });
          if (route !== siteRoutes.current() || !results.isConnected) return;
          hits = (batch?.list || []).filter(item => Number(item.tradeMode) !== 3 &&
            (mode === 'all' || window.campusExchange.supports(item, mode === 'swap' ? 2 : 1)));
          next++;
        } while (!hits.length && batch?.hasMore && next - page < 3);
        rows = append ? [...rows, ...hits] : hits;
        page = next;
        marketCache.set(key, {rows});
        if (marketCache.size > 12) marketCache.delete(marketCache.keys().next().value);
        draw();
        feedback.textContent = '';
        more.hidden = !batch?.hasMore;
        if (!more.hidden) observer?.observe(more);
      } catch (error) {
        if (!results.isConnected) return;
        feedback.textContent = rows.length ? '连接失败，正在显示上次加载的物品。' : '网络不给力，没能加载集市。';
        const retry = document.createElement('button');
        retry.type = 'button';
        retry.textContent = '重试';
        retry.onclick = () => load(append);
        feedback.append(' ',retry);
      } finally { more.disabled = false; }
    };
    more.onclick = () => load(true);
    await load();
  },
};

export { bindBrowseMore };
