const PAGES = window.PAGES;

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
      siteRoutes.go(v ? '#/users/' + encodeURIComponent(v) : '#/users');
    };
    document.getElementById('uGo').addEventListener('click', go);
    document.getElementById('uInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
  },
};
