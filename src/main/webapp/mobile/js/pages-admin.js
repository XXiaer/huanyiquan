/* 页面：管理后台（审核、拍卖、举报、用户、看板） */
(function () {
  const PAGES = window.PAGES || {};

  PAGES.admin = {
    noTab: true,
    async render(view, params) {
      let me = window.__me;
      if (!me) { try { me = await api.get('/api/user/me'); window.__me = me; } catch (e) { me = null; } }
      if (!me || me.role !== 1) {
        view.innerHTML = `<div class="admin-denied">
          <img src="assets/brand/mascot-wave-320.webp" alt="">
          <h2>需要管理员权限</h2>
          <p>请使用管理员账号登录后，再回到这一页。</p>
          <a class="btn" href="#/login">去登录</a>
        </div>`;
        return;
      }
      const tab = params.tab || 'items';
      let dash = {};
      try { dash = await api.get('/api/admin/dashboard') || {}; } catch (e) { /* 忽略 */ }

      let body = '<div class="empty">加载中…</div>';
      view.innerHTML = `
      <div class="admin-page">
        <div class="admin-hero">
          <div class="admin-hero__top">
            <span class="admin-hero__badge">${icon('shield', 16)}管理后台</span>
            <a href="#/me" style="color:rgba(255,255,255,.8);font-size:12px">返回我的</a>
          </div>
          <h1>换一圈 | 运营台</h1>
          <p>${esc(me.nickname)}，今天也辛苦啦</p>
          <div class="admin-stats">
            <div><b>${dash.userCount || 0}</b><span>用户</span></div>
            <div><b>${dash.onShelfCount || 0}</b><span>在架</span></div>
            <div><b>${dash.dealCount || 0}</b><span>成交</span></div>
            <div><b>${dash.pendingReport || 0}</b><span>待处理举报</span></div>
          </div>
        </div>

        <div class="admin-tabs hscroll">
          ${[['items', '待审核物品'], ['auctions', '拍卖'], ['reports', '举报'], ['users', '用户']].map(([k, n]) =>
            `<a class="${tab === k ? 'on' : ''}" href="#/admin/${k}">${n}</a>`).join('')}
        </div>
        <div id="adminBody">${body}</div>
      </div>`;

      const bodyEl = document.getElementById('adminBody');
      try {
        if (tab === 'items') {
          const list = await api.get('/api/admin/items') || [];
          bodyEl.innerHTML = list.length ? list.map((it) => `
            <div class="admin-card">
              <img src="${api.firstPic(it)}" alt="">
              <div class="main">
                <b>${esc(it.title)}</b>
                <p>${esc(it.category)} | ${esc(it.conditionLevel)} | ${api.yuan(it.price) ? '¥' + api.yuan(it.price) : '想换'}</p>
                <p>${esc(it.ownerNickname || '同学')} | ${fmtTime(it.createTime)}</p>
              </div>
              <div class="acts">
                <button class="chip on" data-item-ok="${it.id}">通过</button>
                <button class="chip" data-item-no="${it.id}">拒绝</button>
              </div>
            </div>`).join('') : '<div class="empty">没有待审核的物品</div>';
          bodyEl.querySelectorAll('[data-item-ok]').forEach((b) => b.addEventListener('click', async () => {
            try { await api.post('/api/admin/items/' + b.dataset.itemOk + '/approve', {}); toast('已通过'); renderRoute(); } catch (e) { toast(e.message); }
          }));
          bodyEl.querySelectorAll('[data-item-no]').forEach((b) => b.addEventListener('click', async () => {
            try { await api.post('/api/admin/items/' + b.dataset.itemNo + '/reject', {}); toast('已拒绝'); renderRoute(); } catch (e) { toast(e.message); }
          }));
        } else if (tab === 'auctions') {
          const list = (await api.get('/api/admin/auctions') || []).filter((a) => a.state === 'pending' || a.state === 'active');
          bodyEl.innerHTML = list.length ? list.map((a) => `
            <div class="admin-card">
              <img src="${a.image}" alt="">
              <div class="main">
                <b>${esc(a.title)}</b>
                <p>起拍 ¥${Number(a.startPrice).toFixed(0)} | 当前 ¥${Number(a.currentPrice).toFixed(0)} | ${a.bidCount} 次出价</p>
                <p>${esc(a.seller)} | ${a.state === 'pending' ? '待审核' : '进行中'}</p>
              </div>
              <div class="acts">
                ${a.state === 'pending' ? `<button class="chip on" data-auc-ok="${a.id}">开始</button>
                <button class="chip" data-auc-no="${a.id}">拒绝</button>` : `<button class="chip" data-auc-cancel="${a.id}">下架</button>`}
              </div>
            </div>`).join('') : '<div class="empty">没有拍卖</div>';
          bodyEl.querySelectorAll('[data-auc-ok]').forEach((b) => b.addEventListener('click', async () => {
            try { await api.post('/api/admin/auctions/' + b.dataset.aucOk + '/approve', {}); toast('拍卖已开始'); renderRoute(); } catch (e) { toast(e.message); }
          }));
          bodyEl.querySelectorAll('[data-auc-no]').forEach((b) => b.addEventListener('click', async () => {
            try { await api.post('/api/admin/auctions/' + b.dataset.aucNo + '/reject', {}); toast('已拒绝'); renderRoute(); } catch (e) { toast(e.message); }
          }));
          bodyEl.querySelectorAll('[data-auc-cancel]').forEach((b) => b.addEventListener('click', async () => {
            try { await api.post('/api/admin/auctions/' + b.dataset.aucCancel + '/cancel', {}); toast('已下架'); renderRoute(); } catch (e) { toast(e.message); }
          }));
        } else if (tab === 'reports') {
          const list = await api.get('/api/admin/report', { status: 0 }) || [];
          bodyEl.innerHTML = list.length ? list.map((r) => `
            <div class="admin-card">
              <div class="main" style="margin-left:0">
                <b>${r.targetType === 1 ? '物品举报' : '用户举报'} #${r.id}</b>
                <p>${esc(r.reason || '')}</p>
                <p>${fmtTime(r.createTime)}</p>
              </div>
              <div class="acts">
                <button class="chip on" data-rep-ok="${r.id}">认定违规</button>
                <button class="chip" data-rep-no="${r.id}">驳回</button>
              </div>
            </div>`).join('') : '<div class="empty">没有待处理的举报</div>';
          bodyEl.querySelectorAll('[data-rep-ok]').forEach((b) => b.addEventListener('click', () => handleReport(b.dataset.repOk, 'approve')));
          bodyEl.querySelectorAll('[data-rep-no]').forEach((b) => b.addEventListener('click', () => handleReport(b.dataset.repNo, 'reject')));
        } else if (tab === 'users') {
          const list = await api.get('/api/admin/users') || [];
          bodyEl.innerHTML = list.length ? list.map((u) => `
            <div class="admin-card">
              ${avatar({ nickname: u.nickname, id: u.id, avatar: u.avatar }, 44)}
              <div class="main">
                <b>${esc(u.nickname)} ${u.role === 1 ? '<span class="badge badge--gold">管理员</span>' : ''}</b>
                <p>${esc(u.studentNo)} | ${esc(u.college || '')} | 信用 ${u.credit}</p>
                <p>${u.status === 1 ? '状态正常' : '已封禁'}</p>
              </div>
              <div class="acts">
                ${u.role === 1 ? '' : (u.status === 1
                  ? `<button class="chip" data-ban="${u.id}">封禁</button>`
                  : `<button class="chip on" data-unban="${u.id}">解封</button>`)}
              </div>
            </div>`).join('') : '<div class="empty">没有用户</div>';
          bodyEl.querySelectorAll('[data-ban]').forEach((b) => b.addEventListener('click', async () => {
            try { await api.post('/api/admin/users/' + b.dataset.ban + '/ban', {}); toast('已封禁'); renderRoute(); } catch (e) { toast(e.message); }
          }));
          bodyEl.querySelectorAll('[data-unban]').forEach((b) => b.addEventListener('click', async () => {
            try { await api.post('/api/admin/users/' + b.dataset.unban + '/unban', {}); toast('已解封'); renderRoute(); } catch (e) { toast(e.message); }
          }));
        }
      } catch (e) {
        bodyEl.innerHTML = `<div class="empty">${esc(e.message)}</div>`;
      }

      function handleReport(id, action) {
        openSheet(action === 'approve' ? '认定违规' : '驳回举报', `
          <textarea class="field field--area" id="repNote" placeholder="处理备注（选填）"></textarea>
          <button class="btn btn--block" style="margin-top:14px" id="repGo">确认</button>`, {
          onMount(sheet, close) {
            sheet.querySelector('#repGo').addEventListener('click', async () => {
              try {
                await api.post('/api/admin/report/handle', { reportId: Number(id), action, note: sheet.querySelector('#repNote').value.trim() });
                close(); toast(action === 'approve' ? '已处理' : '已驳回'); renderRoute();
              } catch (e) { toast(e.message); }
            });
          },
        });
      }
    },
  };

  window.PAGES = PAGES;
})();
