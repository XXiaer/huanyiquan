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
      view.innerHTML = window.renderRelayTabs() + window.campusExchange.relay({wish:'#/publish/edit/wish?relay=1', rows, fallback});
    },
  };
  PAGES.cycle = {
    noTab: true,
    async render(view, params) {
      const route = location.hash;
      const top = `<div class="topbar"><button type="button" aria-label="返回" class="topbar__back" onclick="smartBack('#/relay')">${icon('back',22)}</button><div class="set-topbar-title">寻找换物环</div></div>`;
      view.innerHTML = top + '<p class="hint cycle-mobile" role="status">正在查找可用组合…</p>';
      let rings;
      try { rings = await api.get('/api/cycle/' + params.id) || []; }
      catch (error) {
        if (route !== location.hash) return;
        view.innerHTML = top + `<div class="cycle-mobile"><p role="alert">${esc(error.message)}</p><button class="btn btn--ghost" data-cycle-retry>重试</button></div>`;
        view.querySelector('[data-cycle-retry]').onclick = renderRoute;
        return;
      }
      if (route !== location.hash) return;
      const countHelp = rings.length > 1 ? '比较每组的物品与参与者，再选一组。' : '目前只有一组满足三人的想换条件。';
      view.innerHTML = top + `<main class="cycle-mobile">
        ${rings.length ? `<p class="cycle-note"><strong>找到 ${rings.length} 组换法</strong>，${countHelp}</p>` : ''}
        ${rings.length ? rings.map((ring, n) => {
          const users = ring.users || [];
          const items = ring.items || [];
          const name = i => i === 0 ? '我' : users[i]?.nickname || '同学';
          return `<section class="community-card cycle-option">
            <h2>换法 ${n + 1}</h2>
            <div class="cycle-duties"><span>我给出<strong>${esc(items[0]?.title || '物品')}</strong></span><span>我收到<strong>${esc(items[2]?.title || '物品')}</strong></span></div>
            <div class="cycle-graph" aria-label="三方换物方向">
              ${[0,1,2].map(i => `<div class="cycle-node">${avatar(users[i] || {nickname:name(i)},32)}
                <b>${esc(name(i))}</b><small>${esc(items[i]?.title || '物品')}</small></div>`).join('')}
              <span class="cycle-return" aria-hidden="true">第三位同学把物品交回给我</span>
            </div>
            <ol class="cycle-flow">${[0,1,2].map(i => {
              const who = users[i] || {};
              const meta = [who.building, who.credit != null ? '信用 ' + who.credit : ''].filter(Boolean).join(' | ');
              return `<li>${avatar(who,32)}<div><b>${esc(name(i))} 将「${esc(items[i]?.title || '物品')}」交给${i === 2 ? '我' : ' ' + esc(name(i+1))}</b>
                ${meta ? `<small>${esc(meta)}</small>` : ''}</div></li>`;
            }).join('')}</ol>
            <p class="cycle-note">发起后物品暂锁，三人须在 ${Number(ring.confirmationHours) || 24} 小时内确认，随后再约面交。</p>
            <button type="button" class="btn btn--block" data-ring="${n}">选择这组换法</button></section>`;
        }).join('') : mascotEmpty('暂时没有匹配。可以调整想换类别，或保留当前意向。', 'assets/brand/mascot-wave-320.webp', { href: '#/item/' + Number(params.id) + '/edit', text: '调整想换条件' }) + '<p style="text-align:center"><a href="#/relay">返回接力，保留当前意向</a></p>'}</main>`;
      view.querySelectorAll('[data-ring]').forEach(btn => btn.addEventListener('click', () => {
        const ring = rings[Number(btn.dataset.ring)];
        confirmSheet('发起三方交换', '发起后物品将暂时锁定。未在规定时间内获得三人确认，物品会重新上架。', '确认发起', async () => {
          if (btn.disabled) return;
          btn.disabled = true;
          try { const result = await api.post('/api/cycle/' + params.id + '/create', { itemIds: ring.itemIds }); location.hash = '#/exchange/' + result.exchangeId; }
          catch (error) { toast(error.message); }
          finally { btn.disabled = false; }
        });
      }));
    },
  };
  PAGES.ringChat = {
    noTab: true,
    async render(view, params) {
      view.innerHTML = `<div class="topbar"><button type="button" class="topbar__back" onclick="smartBack('#/exchange/${params.id}')">${icon('back',22)}</button><div class="set-topbar-title">三方协商</div></div><div id="ringMessages" style="padding:16px;min-height:55vh"></div><form id="ringForm" style="display:flex;gap:8px;padding:16px"><input id="ringText" maxlength="500" required placeholder="说点什么" style="flex:1;min-width:0;border:1px solid var(--line);border-radius:12px;padding:10px"><button class="btn" type="submit">发送</button></form>`;
      const box = document.getElementById('ringMessages');
      const load = async () => { try { const rows = await api.get('/api/conversation/ring/' + params.id); if (!document.body.contains(box)) return; box.innerHTML = rows.length ? rows.map(m => `<div class="community-card" style="margin-bottom:8px"><b>${esc(m.nickname)}</b><p style="margin-top:6px;white-space:pre-wrap">${esc(m.content)}</p></div>`).join('') : '<div class="empty">还没有消息</div>'; } catch(e) { toast(e.message); } };
      await load();
      document.getElementById('ringForm').addEventListener('submit', async e => { e.preventDefault(); const input=document.getElementById('ringText'); const content=input.value.trim(); if(!content)return; try { await api.post('/api/conversation/ring/' + params.id,{content}); input.value=''; await load(); } catch(err){toast(err.message);} });
      const timer=setInterval(load, 5000); window.__cleanup=()=>clearInterval(timer);
    },
  };
})();
