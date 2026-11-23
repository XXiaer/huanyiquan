import { topbar as renderTopbar } from "../../components/mobile/topbar.js";

const PAGES = window.PAGES;

function topbar(title, options) {
  return renderTopbar(title, { ...options, parent: options?.parent || "#/me" });
}

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
