/* 页面：我的、设置与设置子页、登录、注册 */
(function () {
  const PAGES = window.PAGES || {};
  const CODE_COOLDOWN_SEC = 90;
  const codeCooldowns = {};

  function bindMobileCodeCountdown(btn, key, idleText) {
    if (!btn || !key) return;
    const label = idleText || btn.dataset.idleText || btn.textContent.trim() || '发送验证码';
    btn.dataset.idleText = label;
    let rec = codeCooldowns[key];
    if (!rec) { rec = { until: 0, timer: null }; codeCooldowns[key] = rec; }
    if (rec.timer) { clearInterval(rec.timer); rec.timer = null; }
    const paint = () => {
      const left = Math.ceil((rec.until - Date.now()) / 1000);
      if (left > 0) {
        btn.disabled = true;
        btn.textContent = `${left}s 后重发`;
        return true;
      }
      btn.disabled = false;
      btn.textContent = label;
      if (rec.timer) { clearInterval(rec.timer); rec.timer = null; }
      return false;
    };
    if (paint()) {
      rec.timer = setInterval(() => {
        if (!btn.isConnected || !paint()) {
          clearInterval(rec.timer);
          rec.timer = null;
        }
      }, 250);
    }
  }

  function startMobileCodeCountdown(btn, key, idleText) {
    if (!codeCooldowns[key]) codeCooldowns[key] = { until: 0, timer: null };
    codeCooldowns[key].until = Date.now() + CODE_COOLDOWN_SEC * 1000;
    bindMobileCodeCountdown(btn, key, idleText);
  }

  async function runMobileCodeSend(btn, key, reqFn, onSuccess, idleText) {
    if (!btn || btn.disabled) return;
    const label = idleText || btn.dataset.idleText || btn.textContent.trim() || '发送验证码';
    btn.dataset.idleText = label;
    btn.disabled = true;
    btn.textContent = '发送中…';
    try {
      const res = await reqFn();
      startMobileCodeCountdown(btn, key, label);
      onSuccess?.(res);
    } catch (e) {
      btn.disabled = false;
      btn.textContent = label;
      toast(e.message);
    }
  }

  function topbar(title, opts) {
    const o = opts || {};
    return `<div class="topbar${o.white ? ' topbar--white' : ''}">
      <button class="topbar__back" onclick="${o.onBack || `smartBack('${o.parent || '#/me'}')`}">${icon('back', 22)}</button>
      <div class="topbar__spacer"></div>
      <div class="topbar__title">${esc(title)}</div>
      <div class="topbar__spacer"></div>
      ${o.right || ''}
    </div>`;
  }

  function parseSettings(s) {
    try { return JSON.parse(s || '{}'); } catch (e) { return {}; }
  }

  async function loadSettings() {
    try {
      const r = await api.get('/api/user/settings');
      return parseSettings(r && r.json);
    } catch (e) { return parseSettings(localStorage.getItem('settings')); }
  }

  async function saveSettings(obj) {
    localStorage.setItem('settings', JSON.stringify(obj));
    try { await api.put('/api/user/settings', { json: JSON.stringify(obj) }); } catch (e) { /* 离线也保留本机 */ }
  }

  /* ============================================================ 我的 */
  PAGES.me = {
    tab: 'me',
    async render(view) {
      let me = null;
      let mine = [];
      let wishes = [];
      let feed = [];
      let stats = { favorite: 0, history: 0, follow: 0, wish: 0 };
      try {
        const r = await Promise.all([
          api.get('/api/user/me'),
          api.get('/api/item/mine').catch(() => []),
          api.get('/api/wish').catch(() => []),
          api.get('/api/item/list', { page: 1, size: 20 }).catch(() => ({ list: [] })),
          api.get('/api/social/stats').catch(() => null),
        ]);
        me = r[0];
        mine = r[1] || [];
        wishes = (r[2] || []).filter((w) => me && Number(w.userId) === Number(me.id));
        feed = (r[3] && r[3].list) || [];
        if (r[4]) stats = r[4];
      } catch (e) {
        view.innerHTML = `<section class="me-unauth">
          <img src="/assets/brand/mascot-wave-320.webp" width="132" height="132" alt="换一圈吉祥物" decoding="async">
          <h2>欢迎来到换一圈</h2>
          <p>登录后即可查看你的收藏、交换进度、校园心愿与信用评分。</p>
          <div class="me-unauth__acts">
            <a class="btn btn--sm" href="#/login">去登录</a>
            <a class="btn btn--sm btn--ghost" href="#/home">逛逛闲置</a>
          </div>
        </section>`;
        renderTabbar('me', 0);
        return;
      }
      window.__me = me;

      const onShelf = mine.filter((i) => i.status === 1 || i.status === 5).length;
      const sold = mine.filter((i) => i.status === 3).length;
      const sample = mine.find((i) => i.status === 1) || feed[0];

      view.innerHTML = `
      <div class="me-page">
        <div class="me-top">
          <div class="me-id">
            <a href="#/user/${me.id}">${avatar(me, 58)}</a>
            <div class="me-id__main">
              <a class="me-id__name" href="#/user/${me.id}">${esc(me.nickname)}${icon('right', 18)}</a>
              <span class="me-credit">${icon('shield', 12)}信用值 ${displayCredit(me)}</span>
            </div>
          </div>
          <div class="me-top__acts">
            <a href="#/scan" aria-label="扫一扫"><span style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px">${icon('scan', 22)}</span><span>扫一扫</span></a>
            <a href="#/help">${serviceIcon('headset', 36)}<span>帮助与客服</span></a>
            <a href="#/settings">${serviceIcon('gear', 36)}<span>设置</span></a>
          </div>
        </div>

        <section class="member-panel">
          <div class="member-banner"><img class="member-banner__art" src="assets/brand/member-title-art.png?v=2.0.0" alt="换一圈会员"><h2>换一圈会员</h2></div>
        <div class="me-stats">
          <a href="#/collection"><b>${stats.favorite || 0}</b><span>我的收藏</span></a>
          <a href="#/history"><b>${stats.history || 0}</b><span>历史浏览</span></a>
          <a href="#/follows"><b>${stats.follow || 0}</b><span>我的关注</span></a>
          <a href="#/wish"><b>${wishes.length || stats.wish || 0}</b><span>我的心愿</span></a>
        </div>

        </section>

        <div class="me-card">
          <div class="me-card__head">
            <h3>我的交易</h3>
            <span>累计成交 ${me.dealCount || 0} 笔 | 好评率 ${me.goodRate == null ? '—' : me.goodRate + '%'}</span>
          </div>
          <div class="me-deal">
            <a href="#/me/offers"><i>${serviceIcon('swap', 32)}</i><span>我的提案</span></a>
            <a href="#/me/exchange"><i>${serviceIcon('exchange', 32)}</i><span>我的交换</span></a>
            <a href="#/me/onshelf"><i>${serviceIcon('bag', 32)}</i><span>我发布的</span>${onShelf ? `<em>${onShelf}</em>` : ''}</a>
            <a href="#/me/sold"><i>${serviceIcon('checkCircle', 32)}</i><span>我卖出的</span>${sold ? `<em>${sold}</em>` : ''}</a>
          </div>
        </div>

        <div class="me-appraise" id="meAppraise">
          <div class="me-appraise__left">
            ${sample ? `<img class="me-appraise__pic" src="${api.firstPic(sample)}" alt="">` : serviceIcon("appraise", 48)}
            <div class="me-appraise__main">
              <div class="me-appraise__t">宿舍好物估价</div>
              
            </div>
          </div>
          <div class="me-appraise__right">
            <img src="assets/brand/mascot-wave-320.webp" alt="">
            <div><b>猜你想换</b></div>
          </div>
          <span class="me-appraise__arrow">${icon('right', 18)}</span>
        </div>

        <div class="me-tools">
          <a href="#/scan"><i class="c4">${icon('qr', 22)}</i><span>扫码登电脑</span></a>
          <a href="#/refresh"><i class="c1">${serviceIcon('light', 36)}</i><span>一键擦亮</span></a>
          <a href="#/appraise"><i class="c2">${serviceIcon('appraise', 28)}</i><span>闲置估价</span></a>
          <a href="#/credit/${me.id}"><i class="c3">${serviceIcon('shield', 36)}</i><span>信用中心</span></a>
          <a href="#/settings/pact"><i class="c4">${serviceIcon('book', 28)}</i><span>平台公约</span></a>
          <a href="#/help"><i class="c5">${serviceIcon('headset', 36)}</i><span>帮助与反馈</span></a>
          ${me.role === 1 ? `<a href="#/admin"><i class="c6">${serviceIcon('grid', 36)}</i><span>管理后台</span></a>` : ''}
        </div>

        <div class="sect-title"><h2>猜你喜欢</h2><a class="more" href="#/market">去集市 ${icon('right', 14)}</a></div>
        ${feed.length ? waterfall(feed) : mascotEmpty('还没有推荐的宝贝', 'assets/brand/mascot-wave-320.webp')}
      </div>`;

      document.getElementById('meAppraise').addEventListener('click', () => { location.hash = '#/appraise'; });
    },
  };

  /* ============================================================ 设置 */
  const SET_GROUPS = [
    { name: '个人', rows: [
      { t: '个人资料', href: '#/settings/profile' },
      { t: '面交地址管理', href: '#/settings/address' },
      { t: '账号与安全', href: '#/settings/security' },
    ] },
    { name: '交易', rows: [
      { t: '消息通知', href: '#/settings/notify', v: '已开启' },
      { t: '面交偏好', href: '#/settings/meet' },
      { t: '我收到的评价', href: '#/settings/reviews' },
    ] },
    { name: '通用', rows: [
      { t: '图片质量', href: '#/settings/quality', v: '高清' },
      { t: '清除缓存', href: '#/settings/cache' },
      { t: '青少年模式', href: '#/settings/teen', sw: false },
    ] },
    { name: '隐私', rows: [
      { t: '隐私设置', href: '#/settings/privacy' },
      { t: '黑名单', href: '#/settings/block' },
      { t: '个人信息采集清单', href: '#/settings/collect' },
      { t: '个人信息共享清单', href: '#/settings/share' },
    ] },
    { name: '关于', rows: [
      { t: '关于换一圈', href: '#/settings/about' },
      { t: '把换一圈推荐给朋友', href: '#/settings/invite' },
      { t: '平台公约', href: '#/settings/pact' },
    ] },
  ];

  PAGES.settings = {
    noTab: true,
    async render(view, params) {
      const sub = params.sub || '';
      if (sub === 'reviews') {
        await window.ensureMobilePage('mineList');
        return PAGES.mineList.render(view, { kind: 'reviews', fromSettings: true });
      }
      if (sub) return renderSub(view, sub);
      const s = await loadSettings();
      view.innerHTML = `
      <div class="set-page">
        <div class="topbar">
          <button class="topbar__back" onclick="location.replace('#/me')">${icon('back', 22)}</button>
          <div class="set-topbar-title">设置</div>
          <div style="width:28px"></div>
        </div>
        ${SET_GROUPS.map((g) => `
          <div class="set-group__title">${g.name}</div>
          <div class="set-group">
            <div class="set-card">
              ${g.rows.map((r) => {
                let val = r.v || '';
                if (r.t === '图片质量') val = s.quality || '高清';
                if (r.t === '消息通知') val = s.notify === false ? '已关闭' : '已开启';
                if (r.t === '青少年模式') val = s.teen ? '已开启' : '未开启';
                return `<div class="set-row" data-href="${r.href}">
                  ${r.t}
                  ${r.sw !== undefined
                    ? `<span class="switch${s.teen ? ' on' : ''}" data-teen></span>`
                    : `<span class="set-row__val">${val}</span><span class="set-row__arrow">${icon('right', 16)}</span>`}
                </div>`;
              }).join('')}
            </div>
          </div>`).join('')}
        <div class="set-foot"><div class="set-row set-row--danger" id="logout">退出登录</div></div>
        <div style="height:30px"></div>
      </div>`;

      view.querySelectorAll('[data-href]').forEach((row) => {
        row.addEventListener('click', () => { location.hash = row.dataset.href;
          history.replaceState({ settingsParent: true }, ''); });
      });
      const sw = view.querySelector('[data-teen]');
      if (sw) sw.addEventListener('click', (e) => {
        e.stopPropagation();
        const s2 = Object.assign({}, s, { teen: !s.teen });
        sw.classList.toggle('on');
        saveSettings(s2);
        toast(s2.teen ? '青少年模式已开启' : '已关闭青少年模式');
      });
      document.getElementById('logout').addEventListener('click', () => {
        confirmSheet('退出登录', '退出后需要重新用学号登录。', '退出', async () => {
          try { await api.post('/api/user/logout'); window.__me = null; toast('已退出登录'); setTimeout(() => { location.hash = '#/login'; }, 400); } catch (e) { toast(e.message); }
        });
      });
    },
  };

  window.returnToSettings = function () {
    location.replace('#/settings');
  };

  function subHead(title) {
    return `<div class="topbar">
      <button class="topbar__back" onclick="returnToSettings()">${icon('back', 22)}</button>
      <div class="set-topbar-title">${title}</div>
      <div style="width:28px"></div>
    </div>`;
  }

  async function renderSub(view, sub) {
    const me = window.__me || await api.get('/api/user/me').catch(() => null);
    const s = await loadSettings();

    if (sub === 'profile') {
      view.innerHTML = `<div class="set-page">${subHead('个人资料')}
        <div class="set-sub">
          <div style="display:flex;justify-content:center;padding:10px 0 20px">
            <label style="position:relative" for="avatarFile">
              ${avatar(me || '我', 84)}
              <span style="position:absolute;right:-2px;bottom:0;width:26px;height:26px;border-radius:50%;background:var(--green-600);color:#fff;display:flex;align-items:center;justify-content:center;border:2px solid #F1F4F2">${icon('camera', 14)}</span>
            </label>
            <input type="file" id="avatarFile" accept="image/*" hidden>
          </div>
          <div class="set-sub__card">
            <div class="label" style="margin-top:14px">昵称</div>
            <input class="field" id="pfNick" value="${esc(me ? me.nickname : '')}" maxlength="20">
            <div class="label">学院</div>
            <input class="field" id="pfCollege" value="${esc(me ? me.college || '' : '')}">
            <div class="label">书院 / 宿舍楼</div>
            <input class="field" id="pfBuilding" value="${esc(me ? me.building || '' : '')}">
            <div class="label">个人简介</div>
            <textarea class="field field--area" id="pfBio" maxlength="200" placeholder="介绍一下自己，让同学更快认识你">${esc(me ? me.bio || '' : '')}</textarea>
            <div class="label">学号</div>
            <div style="height:50px;display:flex;align-items:center;color:var(--ink-500);font-size:15px">${esc(me ? me.studentNo : '')} <span style="margin-left:8px;font-size:11px">仅自己可见</span></div>
          </div>
          <button class="btn btn--block" id="pfSave" style="margin-top:18px">保存资料</button>
          <div class="set-sub__tip">头像与简介会在你的个人主页、商品卡和私聊页展示；学号不会对外显示。</div>
        </div></div>`;
      let avatarUrl = me ? me.avatar || '' : '';
      const file = document.getElementById('avatarFile');
      file.addEventListener('change', async () => {
        if (!file.files[0]) return;
        try { const r = await api.upload(file.files[0]); avatarUrl = r.url; toast('头像已上传，点保存生效'); } catch (e) { toast(e.message); }
      });
      document.getElementById('pfSave').addEventListener('click', async () => {
        const nickname = document.getElementById('pfNick').value.trim();
        if (!nickname) { toast('昵称不能为空'); return; }
        try {
          const u = await api.put('/api/user/me', {
            nickname,
            college: document.getElementById('pfCollege').value.trim(),
            building: document.getElementById('pfBuilding').value.trim(),
            bio: document.getElementById('pfBio').value.trim(),
            avatar: avatarUrl,
          });
          window.__me = u;
          toast('资料已更新');
          returnToSettings();
        } catch (e) { toast(e.message); }
      });
      return;
    }

    if (sub === 'address') {
      const places = JSON.parse(localStorage.getItem('meetPlaces') || '["图书馆门口","缤果大街"]');
      view.innerHTML = `<div class="set-page">${subHead('面交地址管理')}
        <div class="set-sub">
          <div class="set-sub__card" style="padding:4px 15px" id="placeList">
            ${places.map((p, i) => `<div class="set-row" style="padding:0"><span style="flex:1">${esc(p)}</span>
              ${i === 0 ? '<span class="badge badge--green">默认</span>' : `<button data-set="${i}" style="font-size:12px;color:var(--green-700)">设为默认</button>`}
              <button data-del="${i}" style="margin-left:12px;color:var(--ink-500)">${icon('trash', 16)}</button></div>`).join('') || '<div class="empty" style="padding:26px 0">还没有保存的面交点</div>'}
          </div>
          <div class="label" style="margin-top:18px">新增常用面交点</div>
          <div style="display:flex;gap:8px">
            <input class="field" id="newPlace" placeholder="如：紫荆 3 号楼门口" style="flex:1">
            <button class="btn" id="addPlace" style="height:50px;padding:0 18px">添加</button>
          </div>
          <div class="set-sub__tip">面交点只在校内选择，建议选图书馆、食堂、宿舍楼下等人多的地方。保存后发布闲置和约面交时可以直接选。</div>
        </div></div>`;
      const save = (arr) => { localStorage.setItem('meetPlaces', JSON.stringify(arr)); renderSub(view, 'address'); };
      document.getElementById('addPlace').addEventListener('click', () => {
        const v = document.getElementById('newPlace').value.trim();
        if (!v) { toast('写个地点'); return; }
        const arr = JSON.parse(localStorage.getItem('meetPlaces') || '[]');
        if (arr.indexOf(v) >= 0) { toast('这个地点已经在了'); return; }
        arr.push(v); save(arr);
      });
      view.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => {
        const arr = JSON.parse(localStorage.getItem('meetPlaces') || '[]'); arr.splice(Number(b.dataset.del), 1); save(arr);
      }));
      view.querySelectorAll('[data-set]').forEach((b) => b.addEventListener('click', () => {
        const arr = JSON.parse(localStorage.getItem('meetPlaces') || '[]');
        const [x] = arr.splice(Number(b.dataset.set), 1); arr.unshift(x); save(arr);
      }));
      return;
    }

    if (sub === 'security') {
      let emailState = null;
      try { emailState = await api.get('/api/user/email'); } catch (e) { emailState = null; }
      view.innerHTML = `<div class="set-page">${subHead('账号与安全')}
        <div class="set-sub">
          <div class="set-sub__card" style="padding:4px 15px">
            <div class="set-row" style="padding:0"><span style="flex:1">登录学号</span><span class="set-row__val">${esc(me ? me.studentNo : '')}</span></div>
            <div class="set-row" style="padding:0"><span style="flex:1">绑定邮箱</span><span class="set-row__val">${esc(emailState && emailState.verified ? emailState.email : '未绑定')}</span></div>
          </div>
          <div class="label" style="margin-top:18px">绑定 / 验证邮箱</div>
          <input class="field" id="emailIn" placeholder="name@example.com" value="${esc(emailState && emailState.email ? emailState.email : '')}">
          <div style="display:flex;gap:8px;margin-top:8px">
            <input class="field" id="codeIn" placeholder="邮箱验证码" style="flex:1">
            <button class="btn" id="sendCode" style="height:50px;padding:0 14px;font-size:13px">发验证码</button>
          </div>
          <button class="btn btn--block" id="verifyEmail" style="margin-top:10px">验证邮箱</button>
          <div class="label" style="margin-top:22px">修改密码</div>
          <input class="field" id="oldPwd" type="password" placeholder="原密码">
          <input class="field" id="newPwd" type="password" placeholder="新密码（6-20 位）" style="margin-top:8px">
          <button class="btn btn--block" id="pwdGo" style="margin-top:10px">修改密码</button>
          <div class="set-sub__tip">邮箱用于找回密码和接收重要交易通知。验证码会发送到你的邮箱，10 分钟内有效。</div>
        </div></div>`;
      const sendCodeBtn = document.getElementById('sendCode');
      bindMobileCodeCountdown(sendCodeBtn, 'bind-email', '发验证码');
      sendCodeBtn.addEventListener('click', async () => {
        const email = document.getElementById('emailIn').value.trim();
        if (!email) { toast('先填邮箱'); return; }
        await runMobileCodeSend(
          sendCodeBtn,
          'bind-email',
          () => api.post('/api/user/email/send', { email }),
          (r) => {
            if (r && r.devCode) {
              document.getElementById('codeIn').value = r.devCode;
              toast('本地演示验证码：' + r.devCode + '（已自动填入）', 3200);
            } else toast('验证码已发送，请查收邮箱');
          },
          '发验证码'
        );
      });
      document.getElementById('verifyEmail').addEventListener('click', async () => {
        const code = document.getElementById('codeIn').value.trim();
        if (!code) { toast('填一下验证码'); return; }
        try { await api.post('/api/user/email/verify', { code }); toast('邮箱验证成功'); } catch (e) { toast(e.message); }
      });
      document.getElementById('pwdGo').addEventListener('click', async () => {
        const oldPassword = document.getElementById('oldPwd').value;
        const newPassword = document.getElementById('newPwd').value;
        try { await api.post('/api/user/password', { oldPassword, newPassword }); toast('密码已修改，下次登录用新密码'); } catch (e) { toast(e.message); }
      });
      return;
    }

    if (sub === 'notify') {
      view.innerHTML = `<div class="set-page">${subHead('消息设置')}
        <div class="set-sub">
          <div class="set-sub__card">
            <div class="set-row notify-setting"><span>接收消息通知</span><button class="switch${s.notify !== false ? ' on' : ''}" role="switch" aria-label="接收消息通知" aria-checked="${s.notify !== false}" data-k="notify"></button></div>
          </div>
          <h2 class="set-group__title">消息通知设置</h2>
          <div class="set-sub__card">
            ${[['trade', '交易状态提醒', '报价与交换进度'], ['social', '互动与社区提醒', '社区互动消息'], ['follow', '关注上新提醒', '关注同学发布的闲置']].map(([key, title, detail]) =>
              `<div class="set-row notify-setting"><div><b>${title}</b><small>${detail}</small></div>
              <button class="switch${s[key] !== false ? ' on' : ''}" role="switch" aria-label="${title}" aria-checked="${s[key] !== false}" data-k="${key}"></button></div>`).join('')}
          </div>
          <div class="label" style="margin-top:18px">回复草稿</div>
          <p class="set-sub__tip">保存后可复制使用，消息需要手动发送。</p>
          <textarea class="field field--area" id="autoReply" placeholder="填写回复草稿">${esc(s.reply || '')}</textarea>
          <button class="btn btn--block" id="notifySave" style="margin-top:14px">保存设置</button>
        </div></div>`;
      const next = Object.assign({}, s);
      view.querySelectorAll('[data-k]').forEach((sw) => sw.addEventListener('click', () => {
        const enabled = sw.classList.toggle('on'); next[sw.dataset.k] = enabled; sw.setAttribute('aria-checked', String(enabled));
      }));
      document.getElementById('notifySave').addEventListener('click', async () => {
        next.reply = document.getElementById('autoReply').value.trim();
        await saveSettings(next); toast('通知设置已保存');
      });
      return;
    }

    if (sub === 'meet') {
      const places = JSON.parse(localStorage.getItem('meetPlaces') || '["图书馆门口","缤果大街"]');
      view.innerHTML = `<div class="set-page">${subHead('面交偏好')}
        <div class="set-sub">
          <div class="label">默认面交点</div>
          <div class="pe-chips" id="meetPref">${places.map((p) => `<span class="chip${(s.meet || places[0]) === p ? ' on' : ''}" data-v="${esc(p)}">${esc(p)}</span>`).join('')}</div>
          <div class="label" style="margin-top:18px">默认送达方式</div>
          <div class="pe-chips" id="deliverPref">${['仅面交', '校内可送'].map((p) => `<span class="chip${(s.delivery || '仅面交') === p ? ' on' : ''}" data-v="${p}">${p}</span>`).join('')}</div>
          <div class="label" style="margin-top:18px">面交安全提醒</div>
          <div class="set-sub__card" style="padding:14px 15px;font-size:13px;line-height:1.75;color:var(--ink-700)">
            面交优先选图书馆门口、食堂、宿舍楼下等人多的地方；贵重物品当面验货再确认；不要提前转账，也不要脱离平台沟通。
          </div>
          <button class="btn btn--block" id="meetSave" style="margin-top:18px">保存偏好</button>
        </div></div>`;
      let meet = s.meet || places[0], delivery = s.delivery || '仅面交';
      ['meetPref', 'deliverPref'].forEach((id) => {
        view.querySelectorAll('#' + id + ' .chip').forEach((c) => c.addEventListener('click', () => {
          view.querySelectorAll('#' + id + ' .chip').forEach((x) => x.classList.remove('on'));
          c.classList.add('on');
          if (id === 'meetPref') meet = c.dataset.v; else delivery = c.dataset.v;
        }));
      });
      document.getElementById('meetSave').addEventListener('click', async () => {
        await saveSettings(Object.assign({}, s, { meet, delivery }));
        toast('面交偏好已保存');
      });
      return;
    }

    if (sub === 'quality') {
      const cur = s.quality || '高清';
      view.innerHTML = `<div class="set-page">${subHead('图片质量')}
        <div class="set-sub"><div class="set-sub__card" style="padding:4px 15px">
          ${['高清', '标准', '省流'].map((q) => `<div class="set-row" data-q="${q}" style="padding:0">
            <span style="flex:1">${q}</span>${cur === q ? `<span style="color:var(--green-600)">${icon('check', 18)}</span>` : ''}
          </div>`).join('')}
        </div>
        <div class="set-sub__tip">${cur === '高清' ? '上传原图，商品细节更清楚，适合发布贵重物品。' : cur === '标准' ? '在清晰度和流量之间平衡，日常发布够用。' : '压缩更明显，适合网络较慢时使用。'}</div>
        </div></div>`;
      view.querySelectorAll('[data-q]').forEach((row) => row.addEventListener('click', async () => {
        await saveSettings(Object.assign({}, s, { quality: row.dataset.q }));
        toast('已切换为' + row.dataset.q); renderSub(view, 'quality');
      }));
      return;
    }

    if (sub === 'cache') {
      let used = 0;
      try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); used += (k.length + String(localStorage.getItem(k)).length) * 2; } } catch (e) { /* 忽略 */ }
      view.innerHTML = `<div class="set-page">${subHead('清除缓存')}
        <div class="set-sub"><div class="set-sub__card" style="padding:18px 15px">
          <div style="font-size:14px;color:var(--ink-500)">当前缓存占用</div>
          <div style="font-size:28px;font-weight:800;margin-top:4px">${(used / 1024).toFixed(1)} KB</div>
          <div style="font-size:12px;color:var(--ink-500);margin-top:6px">包含历史搜索、草稿、图片缓存和本机设置</div>
        </div>
        <button class="btn btn--block" id="cacheGo" style="margin-top:16px">清除缓存</button>
        <div class="set-sub__tip">清除后不会退出登录。草稿、历史搜索和本机设置会一并清空。</div>
        </div></div>`;
      document.getElementById('cacheGo').addEventListener('click', () => {
        confirmSheet('清除缓存', '将清空本机草稿、历史搜索和设置缓存，账号数据不受影响。', '清除', () => {
          const keep = [];
          try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.indexOf('draft:') === 0 || k.indexOf('searchHistory') === 0) keep.push(k); } } catch (e) { /* 忽略 */ }
          keep.forEach((k) => localStorage.removeItem(k));
          localStorage.removeItem('settings'); localStorage.removeItem('meetPlaces');
          toast('缓存已清除'); renderSub(view, 'cache');
        });
      });
      return;
    }

    if (sub === 'teen') {
      view.innerHTML = `<div class="set-page">${subHead('青少年模式')}
        <div class="set-sub"><div class="set-sub__card" style="padding:18px 15px;display:flex;align-items:center">
          <div style="flex:1"><div style="font-size:16px;font-weight:600">开启青少年模式</div>
          <div style="font-size:12px;color:var(--ink-500);margin-top:5px">关闭私聊中的链接访问，限制单日交易次数</div></div>
          <span class="switch${s.teen ? ' on' : ''}" id="teenSw"></span>
        </div>
        <div class="set-sub__tip">青少年模式只影响本机使用体验，不会修改账号信息。开启后部分推广内容会被隐藏。</div>
        </div></div>`;
      document.getElementById('teenSw').addEventListener('click', async () => {
        const on = !document.getElementById('teenSw').classList.contains('on');
        document.getElementById('teenSw').classList.toggle('on', on);
        await saveSettings(Object.assign({}, s, { teen: on }));
        toast(on ? '青少年模式已开启' : '已关闭青少年模式');
      });
      return;
    }

    if (sub === 'privacy') {
      const p = s.privacy || {};
      view.innerHTML = `<div class="set-page">${subHead('隐私设置')}
        <div class="set-sub"><div class="set-sub__card" style="padding:4px 15px">
          <div class="set-row" style="padding:0"><span style="flex:1">公开我的浏览记录</span><span class="switch${p.showHistory ? ' on' : ''}" data-p="showHistory"></span></div>
          <div class="set-row" style="padding:0"><span style="flex:1">允许通过学号找到我</span><span class="switch${p.showJoin !== false ? ' on' : ''}" data-p="showJoin"></span></div>
          <div class="set-row" style="padding:0"><span style="flex:1">展示我的书院与宿舍楼</span><span class="switch${p.showBuilding !== false ? ' on' : ''}" data-p="showBuilding"></span></div>
          <div class="set-row" style="padding:0"><span style="flex:1">允许陌生人私聊</span><span class="switch${p.allowStranger !== false ? ' on' : ''}" data-p="allowStranger"></span></div>
        </div>
        <button class="btn btn--block" id="privacySave" style="margin-top:16px">保存隐私设置</button>
        <div class="set-sub__tip">关闭「允许陌生人私聊」后，只有与你有交换单或关注关系的同学能给你发消息。</div>
        </div></div>`;
      const next = Object.assign({}, p);
      view.querySelectorAll('[data-p]').forEach((sw) => sw.addEventListener('click', () => {
        sw.classList.toggle('on'); next[sw.dataset.p] = sw.classList.contains('on');
      }));
      document.getElementById('privacySave').addEventListener('click', async () => {
        await saveSettings(Object.assign({}, s, { privacy: next }));
        toast('隐私设置已保存');
      });
      return;
    }

    if (sub === 'block') {
      const blocks = JSON.parse(localStorage.getItem('blocked') || '[]');
      view.innerHTML = `<div class="set-page">${subHead('黑名单')}
        <div class="set-sub"><div class="set-sub__card" id="blockList" style="padding:4px 15px">
          ${blocks.length ? blocks.map((b) => `<div class="set-row" style="padding:0">
            ${avatar({ nickname: b.nickname, id: b.id, avatar: b.avatar }, 34)}
            <span style="flex:1;margin-left:10px">${esc(b.nickname)}</span>
            <button data-unblock="${b.id}" style="font-size:12px;color:var(--green-700)">解除</button>
          </div>`).join('') : '<div class="empty" style="padding:26px 0">黑名单是空的</div>'}
        </div>
        <button class="btn btn--block btn--ghost" id="addBlock" style="margin-top:16px">从关注列表添加</button>
        <div class="set-sub__tip">被加入黑名单的同学不会出现在你的消息列表里，也无法再给你发新消息。</div>
        </div></div>`;
      document.getElementById('addBlock').addEventListener('click', async () => {
        try {
          const list = await api.get('/api/social/follow') || [];
          openSheet('选择要屏蔽的同学', list.length ? list.map((u) => `<div class="list-block" data-b="${u.id}" style="margin:0 -18px;padding-left:18px;padding-right:18px">
            ${avatar({ nickname: u.nickname, id: u.id, avatar: u.avatar }, 44)}
            <div class="main"><b>${esc(u.nickname)}</b><p>${esc(u.college || '')}</p></div>${icon('right', 16)}</div>`).join('') : '<div class="empty">关注列表是空的</div>', {
            onMount(sheet, close) {
              sheet.querySelectorAll('[data-b]').forEach((row) => row.addEventListener('click', () => {
                const u = list.find((x) => String(x.id) === row.dataset.b);
                const arr = JSON.parse(localStorage.getItem('blocked') || '[]');
                if (!arr.find((x) => x.id === u.id)) arr.push({ id: u.id, nickname: u.nickname, avatar: u.avatar });
                localStorage.setItem('blocked', JSON.stringify(arr));
                close(); toast('已加入黑名单'); renderSub(view, 'block');
              }));
            },
          });
        } catch (e) { toast(e.message); }
      });
      view.querySelectorAll('[data-unblock]').forEach((b) => b.addEventListener('click', () => {
        const arr = JSON.parse(localStorage.getItem('blocked') || '[]').filter((x) => String(x.id) !== b.dataset.unblock);
        localStorage.setItem('blocked', JSON.stringify(arr));
        toast('已解除'); renderSub(view, 'block');
      }));
      return;
    }

    if (sub === 'collect' || sub === 'share' || sub === 'about' || sub === 'pact' || sub === 'invite') {
      const content = {
        collect: ['个人信息采集清单', `我们采集的信息及用途：\n\n- 学号：用于登录与身份识别，不对外展示\n- 昵称、头像、简介：用于个人主页和商品展示\n- 书院、宿舍楼：用于就近面交与区域筛选\n- 信用分与评价：用于交易可信度展示\n- 商品图片与描述：你主动发布的内容\n\n我们不采集通讯录、精确位置轨迹、相册以外的文件。`],
        share: ['个人信息共享清单', `这些信息会对其他同学可见：\n\n- 昵称、头像、个人简介\n- 书院与宿舍楼（可在隐私设置中关闭）\n- 信用分、买家/卖家信用等级\n- 你发布的商品、评价与社区动态\n\n学号、邮箱、登录凭证不会共享给任何人。管理员仅在处理举报与纠纷时查看必要信息。`],
        about: ['关于换一圈', `换一圈是重庆移通学院的校园以物换物平台。\n\n我们把「以物换物」做成了一件更轻松的事：发布闲置、提出交换、三方凑成换物环、校内面交、双向评价。\n\n联系方式：学生工作处`],
        pact: ['平台公约', `一、真实发布\n商品描述、成色、价格必须真实，图片应为本人实拍。\n\n二、校内面交\n优先选择图书馆、食堂、宿舍楼下等人多的地方，贵重物品当面验货。\n\n三、友善沟通\n不骚扰、不辱骂、不诱导脱离平台交易。\n\n四、禁止内容\n违禁物品、代写代考、刷单套现、虚假信息一律下架并扣除信用分。\n\n五、纠纷处理\n可在私聊页或商品页举报，管理员会在 24 小时内处理。`],
        invite: ['推荐给朋友', `把换一圈分享给同学，一起把闲置盘活。\n\n点击下方按钮复制你的邀请链接。`],
      }[sub];
      view.innerHTML = `<div class="set-page">${subHead(content[0])}
        <div class="set-sub"><div class="set-sub__card" style="padding:18px 16px;font-size:14px;line-height:1.85;color:var(--ink-700);white-space:pre-wrap">${content[1]}</div>
        ${sub === 'invite' ? `<button class="btn btn--block" id="copyInvite" style="margin-top:16px">复制邀请链接</button>` : ''}
        ${sub === 'about' ? `<div style="display:flex;justify-content:center;padding:20px 0"><img src="assets/brand/mascot-logo.png" style="width:80px" alt=""></div>` : ''}
        </div></div>`;
      if (sub === 'invite') {
        document.getElementById('copyInvite').addEventListener('click', () => {
          const url = location.origin + '/#/home?from=' + (me ? me.id : '');
          navigator.clipboard.writeText(url).then(() => toast('邀请链接已复制')).catch(() => toast(url));
        });
      }
      return;
    }

    view.innerHTML = `<div class="set-page">${subHead('设置')}<div class="empty">这个设置项不存在</div></div>`;
  }

  /* ============================================================ 登录 */
  PAGES.login = {
    noTab: true,
    async render(view) {
      const methods = {
        student: ['账号密码', '/api/user/login'],
        email: ['邮箱密码', '/api/user/login/email/password'],
        code: ['邮箱验证码', '/api/user/login/email/code'],
      };
      let method = '';
      let email = '';
      let submitting = false;
      function render() {
        const icons = {student:'me', email:'message'};
        view.innerHTML = `
          <main class="mobile-login">
            <header class="mobile-login__top">
              ${method ? '<button type="button" id="lgBack" aria-label="返回登录方式">' + icon('back', 22) + '</button>' : ''}
              <a href="#/home">先逛逛</a>
            </header>
            <div class="mobile-login__brand">
              <img src="assets/brand/mascot-logo.png" alt="">
              <span>换一圈</span>
            </div>
            <section class="mobile-login__actions" aria-label="登录换一圈">
              ${!method ? `
                <h1>登录换一圈</h1>
                <div class="mobile-login__choices" role="group" aria-label="登录方式">
                  ${['code', 'email', 'student'].map(key => `<button class="${key === 'code' ? 'primary' : ''}" type="button" data-method="${key}">${key === 'code' ? '' : icon(icons[key], 19)}${methods[key][0]}登录</button>`).join('')}
                  <a href="#/register">注册账号</a>
                </div>` : `
                <h1>${methods[method][0]}登录</h1>
            <form id="lgForm">
              <div class="login-card">
                ${method === 'student'
                  ? '<input name="studentNo" placeholder="学号（10 位数字）" aria-label="学号" autocomplete="username" required>'
                  : '<input name="email" type="email" placeholder="已绑定的邮箱" aria-label="邮箱" autocomplete="username" required>'}
                ${method === 'code'
                  ? '<div class="entry-code"><input name="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}" placeholder="6 位邮箱验证码" aria-label="邮箱验证码" required><button class="btn btn--ghost" id="lgSend" type="button">发送验证码</button></div>'
                  : '<input name="password" type="password" placeholder="密码" aria-label="密码" autocomplete="current-password" required>'}
              </div>
              <button class="btn btn--block" type="submit">登录</button>
            </form>
            <p class="entry-switch">还没有账号？<a href="#/register">注册账号</a></p>
            `}
          </section></main>`;
        if (!method) {
          view.querySelectorAll('[data-method]').forEach(button => {
            button.onclick = () => {
              method = button.dataset.method;
              render();
              view.querySelector('input')?.focus();
            };
          });
          return;
        }
        const form = view.querySelector('#lgForm');
        const emailInput = form.elements.namedItem('email');
        if (emailInput) emailInput.value = email;
        view.querySelector('#lgBack').onclick = () => {
          if (submitting) return;
          if (emailInput) email = emailInput.value;
          method = '';
          render();
        };
        const send = view.querySelector('#lgSend');
        if (send) {
          bindMobileCodeCountdown(send, 'login-email', '发送验证码');
          send.onclick = async () => {
            if (!emailInput.reportValidity()) return;
            const captchaToken = await window.openHumanCaptcha('安全验证 · 发送登录验证码');
            if (!captchaToken) return;
            await runMobileCodeSend(
              send,
              'login-email',
              () => api.post('/api/user/login/email/send', { email: emailInput.value.trim(), captchaToken }),
              () => {
                toast('如果该邮箱已绑定账号，请查收验证码');
                form.elements.namedItem('code').focus();
              },
              '发送验证码'
            );
          };
        }
        const doLogin = async (data) => {
          if (submitting) return;
          const captchaToken = await window.openHumanCaptcha('登录安全验证');
          if (!captchaToken) return;
          submitting = true;
          const submit = form.querySelector('[type="submit"]');
          submit.disabled = true;
          try {
            await api.post(methods[method][1], Object.assign({}, data, { captchaToken }));
            window.__me = null;
            toast('登录成功');
            const pendingQr = sessionStorage.getItem('hq.pendingQr');
            const returnTo = sessionStorage.getItem('hq.mobileReturnTo');
            sessionStorage.removeItem('hq.mobileReturnTo');
            location.hash = pendingQr ? ('#/qr-confirm?qr=' + encodeURIComponent(pendingQr)) : (returnTo || '#/home');
          } catch (e) { toast(e.message); }
          finally { submitting = false; submit.disabled = false; }
        };
        form.onsubmit = e => {
          e.preventDefault();
          doLogin(Object.fromEntries(new FormData(form)));
        };
      }
      render();
    },
  };

  /* ============================================================ 注册 */
  PAGES.register = {
    noTab: true,
    async render(view) {
      view.innerHTML = `
      <main class="entry-screen"><div class="entry-brand"><img src="/assets/brand/brand-mascot-logo.png" alt=""><span>换一圈</span></div><div class="entry-panel"><div class="entry-art"><div class="entry-portrait"><img src="/assets/brand/mascot-box.png" alt="抱着箱子的换一圈吉祥物"></div><p>校园闲置，让好物流转</p></div><section class="entry-content">
        <h1>注册账号</h1>
        <p class="entry-intro">使用学号和邮箱创建校园账号</p>
        <div class="login-card">
          <input id="rgNo" aria-label="学号" placeholder="学号（10 位数字）" maxlength="10">
          <input id="rgNick" aria-label="昵称" placeholder="昵称" maxlength="20">
          <input id="rgPwd" aria-label="密码" type="password" placeholder="密码（6-20 位）" maxlength="20">
          <input id="rgEmail" aria-label="邮箱" type="email" autocomplete="email" placeholder="邮箱" required>
          <div class="entry-code"><input id="rgCode" aria-label="邮箱验证码" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="6 位邮箱验证码">
          <button class="btn btn--ghost" id="rgSend" type="button">发送验证码</button></div>
          <input id="rgCollege" aria-label="学院（选填）" placeholder="学院（如：通信与信息工程学院）">
          <input id="rgBuilding" aria-label="书院或宿舍楼（选填）" placeholder="书院 / 宿舍楼（如：缤果大街）">
        </div>
        <button class="btn btn--block" id="rgGo">注册并登录</button>
        <p class="entry-switch">已有账号？<a href="#/login">直接登录</a></p>
      </section></div></main>`;
      const send = document.getElementById('rgSend');
      bindMobileCodeCountdown(send, 'register-email', '发送验证码');
      send.addEventListener('click', async () => {
        const studentNo = document.getElementById('rgNo').value.trim();
        const email = document.getElementById('rgEmail');
        if (!/^[0-9]{10}$/.test(studentNo)) { toast('请输入 10 位学号'); return; }
        if (!email.reportValidity()) return;
        const captchaToken = await window.openHumanCaptcha('安全验证 · 发送注册验证码');
        if (!captchaToken) return;
        await runMobileCodeSend(
          send,
          'register-email',
          () => api.post('/api/user/register/email/send', { studentNo, email: email.value.trim(), captchaToken }),
          () => {
            toast('验证码已发送，请查收邮箱');
            document.getElementById('rgCode')?.focus();
          },
          '发送验证码'
        );
      });
      document.getElementById('rgGo').addEventListener('click', async () => {
        const studentNo = document.getElementById('rgNo').value.trim();
        const nickname = document.getElementById('rgNick').value.trim();
        const password = document.getElementById('rgPwd').value;
        if (!/^\d{10}$/.test(studentNo)) { toast('学号是 10 位数字'); return; }
        if (!nickname) { toast('起个昵称'); return; }
        if (password.length < 6) { toast('密码至少 6 位'); return; }
        const email = document.getElementById('rgEmail');
        const code = document.getElementById('rgCode').value.trim();
        if (!email.reportValidity()) return;
        if (!/^[0-9]{6}$/.test(code)) { toast('请输入 6 位邮箱验证码'); return; }
        const captchaToken = await window.openHumanCaptcha('注册安全验证');
        if (!captchaToken) return;
        const submit = document.getElementById('rgGo');
        submit.disabled = true;
        try {
          await api.post('/api/user/register', {
            studentNo, nickname, password, email:email.value.trim(), code, captchaToken,
            college: document.getElementById('rgCollege').value.trim(),
            building: document.getElementById('rgBuilding').value.trim(),
          });
          window.__me = null;
          toast('注册成功，已登录');
          const pendingQr = sessionStorage.getItem('hq.pendingQr');
          setTimeout(() => { location.hash = pendingQr ? ('#/qr-confirm?qr=' + encodeURIComponent(pendingQr)) : '#/home'; }, 400);
        } catch (e) { toast(e.message); }
        finally { submit.disabled = false; }
      });
    },
  };

  window.PAGES = PAGES;
})();
