/* 路由与启动 */
(function () {
  const ROUTES = [
    [/^\/?$/, 'home', () => ({})],
    [/^\/home$/, 'home', () => ({})],
    [/^\/messages$/, 'messages', () => ({})],
    [/^\/chat\/(\d+)$/, 'chat', (m) => ({ id: Number(m[1]) })],
    [/^\/me$/, 'me', () => ({})],
    [/^\/settings$/, 'settings', () => ({ sub: '' })],
    [/^\/settings\/([\w-]+)$/, 'settings', (m) => ({ sub: m[1] })],
    [/^\/user\/(\d+)$/, 'profile', (m) => ({ id: Number(m[1]), tab: 'items' })],
    [/^\/user\/(\d+)\/([\w-]+)$/, 'profile', (m) => ({ id: Number(m[1]), tab: m[2] })],
    [/^\/search$/, 'searchLanding', () => ({})],
    [/^\/search\/(.+)$/, 'searchResult', (m) => ({ kw: decodeURIComponent(m[1]) })],
    [/^\/publish$/, 'publishEntry', () => ({})],
    [/^\/publish\/edit\/(\w+)$/, 'publishEdit', (m) => ({ kind: m[1] })],
    [/^\/item\/(\d+)\/edit$/, 'publishEdit', (m) => ({ kind: 'idle', itemId: Number(m[1]) })],
    [/^\/item\/(\d+)$/, 'item', (m) => ({ id: Number(m[1]) })],
    [/^\/ring\/(\d+)$/, 'ringChat', (m) => ({ id: Number(m[1]) })],
    [/^\/relay$/, 'relay', () => ({})],
    [/^\/cycle\/(\d+)$/, 'cycle', (m) => ({ id: Number(m[1]) })],
    [/^\/exchange\/(\d+)$/, 'exchangeDetail', (m) => ({ id: Number(m[1]) })],
    [/^\/idle$/, 'market', () => ({ idle: true })],
    [/^\/idle\/category\/(.*)$/, 'market', m => ({ idle: true, category: decodeURIComponent(m[1]) })],
    [/^\/market$/, 'market', () => ({})],
    [/^\/community$/, 'community', () => ({})],
    [/^\/community\/game$/, 'communityGame', () => ({})],
    [/^\/auction$/, 'auction', () => ({})],
    [/^\/category\/(.*)$/, 'market', (m) => ({ category: m[1] ? decodeURIComponent(m[1]) : '' })],
    [/^\/wish$/, 'wish', () => ({})],
    [/^\/notifications$/, 'notifications', () => ({ cat: '' })],
    [/^\/notifications\/(\w+)$/, 'notifications', (m) => ({ cat: m[1] })],
    [/^\/appraise$/, 'appraise', () => ({})],
    [/^\/login$/, 'login', () => ({})],
    [/^\/register$/, 'register', () => ({})],
    [/^\/offers$/, 'mineList', () => ({ kind: 'offers' })],
    [/^\/exchange$/, 'mineList', () => ({ kind: 'exchange' })],
    [/^\/me\/(onshelf|sold|offers|exchange|reviews)$/, 'mineList', (m) => ({ kind: m[1] })],
    [/^\/door$/, 'doorService', () => ({})],
    [/^\/lost$/, 'lostFound', () => ({})],
    [/^\/collection$/, 'collection', () => ({})],
    [/^\/history$/, 'history', () => ({})],
    [/^\/followers$/, 'follows', () => ({ followers:true })],
    [/^\/follows$/, 'follows', () => ({})],
    [/^\/credit\/(\d+)$/, 'creditCenter', (m) => ({ id: Number(m[1]) })],
    [/^\/help$/, 'helpCenter', () => ({})],
    [/^\/quote$/, 'marketQuote', () => ({})],
    [/^\/users$/, 'users', () => ({ kw: '' })],
    [/^\/users\/(.+)$/, 'users', (m) => ({ kw: decodeURIComponent(m[1]) })],
    [/^\/refresh$/, 'refreshPick', () => ({})],
    [/^\/admin$/, 'admin', () => ({ tab: 'items' })],
    [/^\/admin\/(\w+)$/, 'admin', (m) => ({ tab: m[1] })],
  ];

  let current = null;

  function resolve() {
    const hash = location.hash.replace(/^#/, '') || '/home';
    for (const [re, name, arg] of ROUTES) {
      const m = hash.match(re);
      if (m) return { name, params: arg(m), hash };
    }
    return { name: 'home', params: {}, hash };
  }

  async function renderRoute() {
    const { name, params, hash } = resolve();
    const view = document.getElementById('view');
    const page = window.PAGES[name];

    document.getElementById('sheetHost').innerHTML = '';
    window.__cleanup && window.__cleanup();
    window.__cleanup = null;


    if (!page) {
      view.innerHTML = `<div class="empty">
        <div class="mascot-slot"><img src="assets/brand/mascot-wave-320.webp" alt=""></div>
        <p>这一页走丢了，回首页看看吧</p>
        <a class="btn btn--ghost btn--sm" href="#/home">回首页</a>
      </div>`;
      renderTabbar(null, 0);
      current = name;
      return;
    }

    current = name;
    if (page.before) page.before(params);
    try {
      await page.render(view, params);
    } catch (e) {
      if (hash !== resolve().hash) return;
      if (e.code === 401 && ['messages','notifications','follows'].includes(name)) {
        location.replace('#/login');
        return;
      }
      console.error(e);
      view.innerHTML = `<div class="empty">加载失败：${esc(e.message)}</div>`;
    }
    if (hash !== resolve().hash) return;
    renderTabbar(page.noTab ? false : (page.tab || null), window.__unread || 0);
    view.style.paddingBottom = page.noTab ? '0' : '';
    if (!page.keepScroll) window.scrollTo(0, 0);
    if (page.after) page.after(params);
    updateUnreadBadge();
    refreshMessageAlerts();
  }

  window.renderRoute = renderRoute;
  window.addEventListener('hashchange', renderRoute);
  window.addEventListener('DOMContentLoaded', () => {
    if (!location.hash) location.hash = '#/home';
    renderRoute();
  });
})();
