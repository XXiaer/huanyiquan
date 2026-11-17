/* 页面：管理后台（审核、拍卖、举报、用户、看板） */
(function () {
  const PAGES = window.PAGES || {};

  const tabs = [['overview','概览'], ['items','物品审核'], ['auctions','拍卖'],
    ['reports','举报'], ['users','用户'], ['disputes','争议'], ['exchanges','交换记录'], ['activity','操作日志']];
  let reportStatus = 0;
  let userQuery = '';

  PAGES.admin = {
    noTab: true,
    async render(view, params) {
      const route = location.hash;
      let me = window.__me;
      if (!me) { try { me = await api.get('/api/user/me'); window.__me = me; } catch (e) { me = null; } }
      if (location.hash !== route) return;
      if (!me || Number(me.role) !== 1) {
        view.innerHTML = `<div class="admin-denied">
          <img src="assets/brand/mascot-wave-320.webp" alt="">
          <h2>需要管理员权限</h2>
          <p>请使用管理员账号登录后，再回到这一页。</p>
          ${me ? '<a class="btn btn--ghost" href="#/me">返回我的</a>' : ''}
          <a class="btn" id="adminLogin" href="#/login">${me ? '切换账号' : '去登录'}</a>
        </div>`;
        view.querySelector('#adminLogin').onclick = () => {
          sessionStorage.setItem('hq.mobileReturnTo', route || '#/admin');
        };
        return;
      }
      const tab = tabs.some(([key]) => key === params.tab) ? params.tab : 'overview';
      view.innerHTML = `<main class="admin-page">
        <header class="admin-header"><div><a href="#/me">返回我的</a><h1>运营后台</h1></div>
          <button class="btn" data-refresh>刷新</button></header>
        <nav class="admin-tabs hscroll" aria-label="后台功能">
          ${tabs.map(([key, label]) => `<a ${tab === key ? 'aria-current="page" class="on"' : ''} href="#/admin/${key}">${label}</a>`).join('')}
        </nav>
        <h2 class="admin-section-title">${tabs.find(([key]) => key === tab)[1]}</h2>
        <section id="adminBody" aria-live="polite"><p class="empty">加载中…</p></section>
      </main>`;
      const bodyEl = view.querySelector('#adminBody');
      view.querySelector('[data-refresh]').onclick = () => renderRoute();
      const card = (html) => `<article class="admin-card"><div class="main">${html}</div></article>`;
      const empty = '<p class="empty">暂无记录</p>';
      try {
        if (tab === 'overview') {
          const data = await api.get('/api/admin/dashboard');
          bodyEl.innerHTML = `<div class="admin-metrics">${[
            ['用户','userCount'], ['在架','onShelfCount'], ['成交','dealCount'], ['待处理举报','pendingReport'],
          ].map(([label,key]) => card(`<b>${Number(data[key] || 0)}</b><p>${label}</p>`)).join('')}</div>`;
        } else if (tab === 'exchanges') {
          const rows = await api.get('/api/admin/exchanges');
          const statuses = ['','待确认','待交付','已完成','已失效','已超时关闭','争议处理中'];
          bodyEl.innerHTML = rows.map(e => card(`<b>交换单 #${Number(e.id)}</b>
            <p>${e.type === 3 ? '三方成环' : '一对一'} | ${statuses[e.status] || '未知'}</p>
            <p>${esc(e.place || '待约定')} | ${esc(e.createTime || '')}</p>`)).join('') || empty;
        } else if (tab === 'activity') {
          const rows = await api.get('/api/admin/activity');
          bodyEl.innerHTML = rows.map(entry => card(`<b>${esc(entry.remark || '操作记录')}</b>
            <p>${entry.actor == null ? '系统' : '账号 #' + Number(entry.actor)} | ${esc(entry.type)} #${Number(entry.target)}</p>
            <p>${esc(entry.createTime || '')}</p>`)).join('') || empty;
        } else if (tab === 'disputes') {
          const rows = await api.get('/api/admin/exchange-disputes');
          bodyEl.innerHTML = rows.map(row => card(`<b>交换单 #${Number(row.exchangeId)}</b>
            <p>${row.resolution ? '已裁决' : '待处理'} | ${esc(row.reason)}</p>
            <button class="btn" data-dispute="${Number(row.exchangeId)}">查看争议</button>`)).join('') || empty;
          bodyEl.querySelectorAll('[data-dispute]').forEach(button => button.onclick = async () => {
            button.disabled = true;
            try {
              const id = Number(button.dataset.dispute);
              const exchange = await api.get('/api/admin/exchange-disputes/' + id);
              if (!button.isConnected || location.hash !== route) return;
              const meeting = exchange.confirmedArrangement;
              openSheet('交换单 #' + id, `
                <p>面交约定：${meeting ? esc([meeting.place, meeting.startTime, meeting.note].filter(Boolean).join(' | ')) : '暂无'}</p>
                <ul>${(exchange.details || []).map(person => `<li>${esc(person.nickname || '参与者')} | 给出 ${esc(person.giveTitle || '物品')} | ${person.delivered ? '已确认收货' : '未确认收货'}</li>`).join('')}</ul>
                ${window.exchangeDisputeTimeline(exchange, esc)}
                ${exchange.status === 6 ? `<label for="adminDecision">裁决理由（参与者可见）</label>
                  <textarea id="adminDecision" class="field field--area" maxlength="1000"></textarea>
                  <div class="admin-decisions"><button class="btn" data-outcome="complete">确认交换完成</button>
                  <button class="btn btn--ghost" data-outcome="cancel">取消并解锁</button></div>` : ''}`, {
                onMount(sheet, close) {
                  sheet.querySelectorAll('[data-outcome]').forEach(action => action.onclick = async () => {
                    const note = sheet.querySelector('#adminDecision').value.trim();
                    if (!note) { toast('请填写裁决理由'); return; }
                    const outcome = action.dataset.outcome;
                    const consequence = outcome === 'cancel'
                      ? '请核实物品已归还。裁决后交换单将取消，物品会恢复可交换。'
                      : '请核实各方物品已交付。裁决后交换单将标记完成。';
                    if (!confirm(consequence + '\n确认提交裁决？')) return;
                    const controls = sheet.querySelectorAll('[data-outcome]');
                    controls.forEach(control => control.disabled = true);
                    try {
                      await api.post('/api/admin/exchange-disputes/' + id, {outcome, note});
                      close(); toast('裁决已提交');
                      if (location.hash === route) renderRoute();
                    } catch (error) { toast(error.message); }
                    finally { controls.forEach(control => control.disabled = false); }
                  });
                },
              });
            } catch (error) { toast(error.message); }
            finally { button.disabled = false; }
          });
        } else if (tab === 'items') {
          const list = await api.get('/api/admin/items') || [];
          bodyEl.innerHTML = list.length ? list.map((it) => `
            <div class="admin-card">
              <img src="${esc(api.firstPic(it))}" alt="">
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
              <img src="${esc(a.image || "")}" alt="">
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
            if (!confirm('确认执行此操作？')) return;
            try { await api.post('/api/admin/auctions/' + b.dataset.aucCancel + '/cancel', {}); toast('已下架'); renderRoute(); } catch (e) { toast(e.message); }
          }));
        } else if (tab === 'reports') {
          const list = await api.get('/api/admin/report', { status: reportStatus }) || [];
          const filters = `<div class="admin-filters">${['待处理','已认定','已驳回'].map((label,index) =>
            `<button class="btn btn--ghost" data-report-status="${index}" aria-pressed="${index === reportStatus}">${label}</button>`).join('')}</div>`;
          bodyEl.innerHTML = filters + (list.length ? list.map((r) => `
            <div class="admin-card">
              <div class="main" style="margin-left:0">
                <b>${r.targetType === 1 ? '物品举报' : '用户举报'} #${r.id}</b>
                <p>举报对象 <a href="#/${r.targetType === 1 ? 'item' : 'user'}/${Number(r.targetId)}">${esc(r.targetTitle || (r.targetType === 1 ? '物品' : '账号') + ' #' + Number(r.targetId))}</a></p>
                <p>举报人 ${esc(r.reporterNickname || '账号 #' + Number(r.reporterId))}</p>
                <p>${esc(r.reason || '')}</p>
                <p>${fmtTime(r.createTime)}</p>
              </div>
              ${reportStatus === 0 ? `<div class="acts">
                <button class="chip on" data-rep-ok="${r.id}">认定违规</button>
                <button class="chip" data-rep-no="${r.id}">驳回</button>
              </div>` : `<p>${esc(r.handleNote || "")}</p>`}
            </div>`).join('') : '<div class="empty">此状态暂无举报</div>');
          bodyEl.querySelectorAll('[data-report-status]').forEach(button => button.onclick = () => { reportStatus = Number(button.dataset.reportStatus); renderRoute(); });
          bodyEl.querySelectorAll('[data-rep-ok]').forEach((b) => b.addEventListener('click', () => handleReport(b.dataset.repOk, 'approve')));
          bodyEl.querySelectorAll('[data-rep-no]').forEach((b) => b.addEventListener('click', () => handleReport(b.dataset.repNo, 'reject')));
        } else if (tab === 'users') {
          const list = await api.get('/api/admin/users', {q:userQuery}) || [];
          const search = `<form class="admin-filters"><input name="q" aria-label="搜索用户" placeholder="学号或昵称" value="${esc(userQuery)}"><button class="btn">搜索</button></form>`;
          bodyEl.innerHTML = search + (list.length ? list.map((u) => `
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
            </div>`).join('') : '<div class="empty">没有匹配的用户</div>');
          bodyEl.querySelector('form').onsubmit = event => { event.preventDefault(); userQuery = event.target.elements.q.value.trim(); renderRoute(); };
          bodyEl.querySelectorAll('[data-ban]').forEach((b) => b.addEventListener('click', async () => {
            if (!confirm('确认执行此操作？')) return;
            try { await api.post('/api/admin/users/' + b.dataset.ban + '/ban', {}); toast('已封禁'); renderRoute(); } catch (e) { toast(e.message); }
          }));
          bodyEl.querySelectorAll('[data-unban]').forEach((b) => b.addEventListener('click', async () => {
            if (!confirm('确认执行此操作？')) return;
            try { await api.post('/api/admin/users/' + b.dataset.unban + '/unban', {}); toast('已解封'); renderRoute(); } catch (e) { toast(e.message); }
          }));
        }
      } catch (e) {
        bodyEl.innerHTML = `<div class="empty" role="alert">${esc(e.message)}</div>`;
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
