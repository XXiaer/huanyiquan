const PAGES = window.PAGES;

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
