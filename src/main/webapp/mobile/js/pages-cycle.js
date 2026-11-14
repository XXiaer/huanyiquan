(function () {
  const PAGES = window.PAGES;
  PAGES.relay = {
    tab: 'home',
    async render(view) {
      const route = location.hash;
      let items = [];
      let fallback = '<p>还没有可接力的在架物品。</p><a href="#/publish/edit/idle">去发布物品</a>';
      try { items = (await api.get('/api/item/mine', {status:1})).filter(item => item.allowCycle && !item.isDemo); }
      catch (error) {
        fallback = error.code === 401 ? '<p>登录后可查看自己的接力物品。</p><a href="#/login">去登录</a>' : `<p role="status">${esc(error.message)}</p>`;
      }
      if (location.hash !== route) return;
      const rows = items.map(item => `<a href="#/cycle/${Number(item.id)}"><b>${esc(item.title)}</b><span>查看换法</span></a>`).join('');
      view.innerHTML = window.renderRelayTabs() + window.campusExchange.relay({wish:'#/publish/edit/wish', rows, fallback});
    },
  };
  PAGES.cycle = {
    noTab: true,
    async render(view, params) {
      let rings;
      try { rings = await api.get('/api/cycle/' + params.id); }
      catch (error) { view.innerHTML = `<div class="topbar"><a class="topbar__back" href="#/me/onshelf">${icon('back',22)}</a><div class="set-topbar-title">寻找换物环</div></div><div class="empty">${esc(error.message)}</div>`; return; }
      view.innerHTML = `<div class="topbar"><a class="topbar__back" href="#/me/onshelf">${icon('back',22)}</a><div class="set-topbar-title">寻找换物环</div></div>
        <div style="padding:12px 14px">${rings.length ? rings.map((r, n) => `<div class="community-card" style="margin-bottom:12px"><h3>换法 ${n + 1}</h3><p style="margin:12px 0;line-height:1.7">${esc(r.flow || '')}</p><div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">${(r.items || []).map(i => `<span class="chip">${esc(i.title)}</span>`).join('')}</div><button class="btn btn--block" data-ring="${n}">选择这组换法</button></div>`).join('') : mascotEmpty('暂时没有找到合适的换法', 'assets/brand/mascot-wave-320.webp', { href: '#/market', text: '去逛逛' })}</div>`;
      view.querySelectorAll('[data-ring]').forEach(btn => btn.addEventListener('click', () => {
        const ring = rings[Number(btn.dataset.ring)];
        confirmSheet('发起三方交换', '发起后物品将锁定，等待三方确认。', '确认发起', async () => {
          try { const result = await api.post('/api/cycle/' + params.id + '/create', { itemIds: ring.itemIds }); location.hash = '#/exchange/' + result.exchangeId; }
          catch (error) { toast(error.message); }
        });
      }));
    },
  };
  PAGES.ringChat = {
    noTab: true,
    async render(view, params) {
      view.innerHTML = `<div class="topbar"><a class="topbar__back" href="#/exchange/${params.id}">${icon('back',22)}</a><div class="set-topbar-title">三方协商</div></div><div id="ringMessages" style="padding:16px;min-height:55vh"></div><form id="ringForm" style="display:flex;gap:8px;padding:16px"><input id="ringText" maxlength="500" required placeholder="说点什么" style="flex:1;min-width:0;border:1px solid var(--line);border-radius:12px;padding:10px"><button class="btn" type="submit">发送</button></form>`;
      const box = document.getElementById('ringMessages');
      const load = async () => { try { const rows = await api.get('/api/conversation/ring/' + params.id); if (!document.body.contains(box)) return; box.innerHTML = rows.length ? rows.map(m => `<div class="community-card" style="margin-bottom:8px"><b>${esc(m.nickname)}</b><p style="margin-top:6px;white-space:pre-wrap">${esc(m.content)}</p></div>`).join('') : '<div class="empty">还没有消息</div>'; } catch(e) { toast(e.message); } };
      await load();
      document.getElementById('ringForm').addEventListener('submit', async e => { e.preventDefault(); const input=document.getElementById('ringText'); const content=input.value.trim(); if(!content)return; try { await api.post('/api/conversation/ring/' + params.id,{content}); input.value=''; await load(); } catch(err){toast(err.message);} });
      const timer=setInterval(load, 5000); window.__cleanup=()=>clearInterval(timer);
    },
  };
})();
