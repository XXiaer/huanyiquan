import { topbar as renderTopbar } from "../../components/mobile/topbar.js";

const PAGES = window.PAGES;

function topbar(title, options) {
  return renderTopbar(title, { ...options, parent: options?.parent || "#/me" });
}

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
