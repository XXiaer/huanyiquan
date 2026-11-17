/* 路由与启动 */
(function () {
  function safeDecode(s) {
    try { return decodeURIComponent(s); } catch (e) { return s || ''; }
  }
  const ROUTES = [
    [/^\/?$/, 'home', () => ({})],
    [/^\/home$/, 'home', () => ({})],
    [/^\/scan$/, 'scan', () => ({})],
    [/^\/qr-confirm(?:\?.*)?$/, 'qrConfirm', () => ({})],
    [/^\/messages$/, 'messages', () => ({})],
    [/^\/chat\/(\d+)$/, 'chat', (m) => ({ id: Number(m[1]) })],
    [/^\/me$/, 'me', () => ({})],
    [/^\/settings$/, 'settings', () => ({ sub: '' })],
    [/^\/settings\/([\w-]+)$/, 'settings', (m) => ({ sub: m[1] })],
    [/^\/user\/(\d+)$/, 'profile', (m) => ({ id: Number(m[1]), tab: 'items' })],
    [/^\/user\/(\d+)\/([\w-]+)$/, 'profile', (m) => ({ id: Number(m[1]), tab: m[2] })],
    [/^\/search$/, 'searchLanding', () => ({})],
    [/^\/search\/(.+)$/, 'searchResult', (m) => ({ kw: safeDecode(m[1]) })],
    [/^\/publish$/, 'publishEntry', () => ({})],
    [/^\/publish\/edit\/(\w+)(?:\?(?:relay=1|want=[^#]*))?$/, 'publishEdit', (m) => ({ kind: m[1] })],
    [/^\/item\/(\d+)\/edit$/, 'publishEdit', (m) => ({ kind: 'idle', itemId: Number(m[1]) })],
    [/^\/item\/(\d+)$/, 'item', (m) => ({ id: Number(m[1]) })],
    [/^\/ring\/(\d+)$/, 'ringChat', (m) => ({ id: Number(m[1]) })],
    [/^\/relay$/, 'relay', () => ({})],
    [/^\/cycle\/(\d+)$/, 'cycle', (m) => ({ id: Number(m[1]) })],
    [/^\/exchange\/(\d+)$/, 'exchangeDetail', (m) => ({ id: Number(m[1]) })],
    [/^\/idle$/, 'market', () => ({ mode: 'sale' })],
    [/^\/idle\/category\/(.*)$/, 'market', m => ({ mode: 'sale', category: safeDecode(m[1]) })],
    [/^\/market(?:\/(all|swap|sale)(?:\/([^/]+))?)?$/, 'market', m => ({ mode: m[1], category: m[2] ? safeDecode(m[2]) : '' })],
    [/^\/community$/, 'community', () => ({})],
    [/^\/community\/game$/, 'communityGame', () => ({})],
    [/^\/auctions?$/, 'auction', () => ({})],
    [/^\/auction\/(\d+)$/, 'auctionDetail', m => ({id: Number(m[1])})],
    [/^\/category\/(.*)$/, 'market', (m) => ({ category: m[1] ? safeDecode(m[1]) : '' })],
    [/^\/wish(?:es)?$/, 'wish', () => ({})],
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
    [/^\/users\/(.+)$/, 'users', (m) => ({ kw: safeDecode(m[1]) })],
    [/^\/refresh$/, 'refreshPick', () => ({})],
    [/^\/admin$/, 'admin', () => ({ tab: 'overview' })],
    [/^\/admin\/(\w+)$/, 'admin', (m) => ({ tab: m[1] })],
  ];

  const routeScripts = new Map([
    ...['me','settings','login','register'].map(name => [name,'pages-me']),
    ...['profile'].map(name => [name,'pages-profile']),
    ...['publishEntry','publishEdit'].map(name => [name,'pages-publish']),
    ...['relay','cycle','ringChat'].map(name => [name,'pages-cycle']),
    ...['scan','qrConfirm'].map(name => [name,'pages-qr']),
    ...['wish','notifications','appraise','mineList','collection','history','follows','creditCenter',
      'helpCenter','doorService','lostFound','marketQuote','users','exchangeDetail','refreshPick'].map(name => [name,'pages-misc']),
    ['admin','pages-admin'],
  ]);
  const scripts = new Map();

  window.ensureMobilePage = function (name) {
    const file = routeScripts.get(name);
    if (!file || window.PAGES[name]) return Promise.resolve();
    if (!scripts.has(file)) {
      scripts.set(file, new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = '/mobile/js/' + file + '.js?v=3.0.0';
        script.onload = resolve;
        script.onerror = () => {
          scripts.delete(file);
          script.remove();
          reject(new Error('页面组件加载失败，请重试'));
        };
        document.head.append(script);
      }));
    }
    return scripts.get(file);
  };

  let current = null;
  let navigation = 0;

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
    const sequence = ++navigation;

    document.getElementById('sheetHost').innerHTML = '';
    delete view.__notices;
    window.__cleanup && window.__cleanup();
    window.__cleanup = null;

    if (routeScripts.has(name) && !window.PAGES[name]) {
      try { await window.ensureMobilePage(name); }
      catch (error) {
        if (sequence !== navigation) return;
        const state = document.createElement('div');
        state.className = 'empty';
        state.textContent = error.message;
        const retry = document.createElement('button');
        retry.className = 'btn btn--ghost';
        retry.textContent = '重试';
        retry.onclick = renderRoute;
        state.append(retry);
        view.replaceChildren(state);
        return;
      }
    }
    if (sequence !== navigation) return;
    const page = window.PAGES[name];
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
      if (sequence !== navigation || hash !== resolve().hash) return;
      if (e.code === 401 && ['messages','notifications','follows'].includes(name)) {
        location.replace('#/login');
        return;
      }
      console.error(e);
      view.innerHTML = `<div class="empty">加载失败：${esc(e.message)}</div>`;
    }
    if (sequence !== navigation || hash !== resolve().hash) return;
    renderTabbar(page.noTab ? false : (page.tab || null), window.__unread || 0);
    view.style.paddingBottom = page.noTab ? '0' : '';
    if (!page.keepScroll) window.scrollTo(0, 0);
    if (page.after) page.after(params);
    updateUnreadBadge();
    refreshMessageAlerts(view.__notices);
  }

  window.renderRoute = renderRoute;
  window.addEventListener('hashchange', renderRoute);
  window.addEventListener('DOMContentLoaded', () => {
    if (!location.hash) location.hash = '#/home';
    renderRoute();
  });
})();
