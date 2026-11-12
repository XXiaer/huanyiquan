/* Shared unread count and dismissible top-of-screen notifications. */
(function () {
  let previous = new Map();
  let pending = false;
  let queued = false;
  let timer;
  let unread = 0;

  function dismiss() {
    clearTimeout(timer);
    document.getElementById('messagePopup')?.remove();
  }

  window.updateUnreadBadge = function () {
    const link = document.querySelector('#tabbar a[href="#/messages"]');
    if (!link) return;
    link.querySelector('.tabbar__badge')?.remove();
    link.setAttribute('aria-label', unread ? '消息，' + unread + ' 条未读' : '消息');
    if (unread) {
      const badge = document.createElement('i');
      badge.className = 'tabbar__badge';
      badge.textContent = unread > 99 ? '99+' : String(unread);
      link.append(badge);
    }
  };

  function show(alert) {
    dismiss();
    const popup = document.createElement('aside');
    popup.id = 'messagePopup';
    popup.dataset.alertKey = alert.key;
    popup.className = 'message-popup';
    popup.innerHTML = `<span class="message-popup__icon">${icon('message', 21)}</span>
      <div role="status"><strong></strong><span></span></div>
      <a>查看</a><button type="button" aria-label="关闭消息提醒">${icon('close', 18)}</button>`;
    popup.querySelector('strong').textContent = alert.title;
    popup.querySelector('div > span').textContent = alert.text;
    const link = popup.querySelector('a');
    link.href = alert.href;
    link.addEventListener('click', dismiss);
    popup.querySelector('button').addEventListener('click', dismiss);
    document.body.append(popup);
    timer = setTimeout(dismiss, 8000);
  }

  window.refreshMessageAlerts = async function () {
    if (document.hidden) return;
    if (pending) { queued = true; return; }
    pending = true;
    try {
      const notices = await api.get('/api/notification');
      const active = location.hash;
      const system = (Array.isArray(notices) ? notices : []).filter(n => !n.read);
      unread = system.length;
      updateUnreadBadge();
      const alerts = system.map(n => ({
        key: 'notice:' + n.id, version: String(n.id), date: n.createdAt || '',
        title: n.title || '新通知', text: n.content || '',
        href: /^#\/chat\/\d+$/.test(n.target || '') ? n.target : '#/notifications',
      }));
      const newest = alerts.filter(a => previous.get(a.key) !== a.version && a.href !== active)
        .sort((a, b) => b.date.localeCompare(a.date))[0];
      previous = new Map(alerts.map(a => [a.key, a.version]));
      if (newest && active !== '#/messages' && !active.startsWith('#/notifications')) show(newest);
      else if (!alerts.some(a => a.key === document.getElementById("messagePopup")?.dataset.alertKey)) dismiss();
    } catch (e) {
      if (e.code === 401) {
        previous.clear();
        unread = 0;
        updateUnreadBadge();
        dismiss();
      }
    } finally {
      pending = false;
      if (queued) { queued = false; refreshMessageAlerts(); }
    }
  };

  window.addEventListener('hashchange', dismiss);
  document.addEventListener('visibilitychange', refreshMessageAlerts);
  setInterval(refreshMessageAlerts, 5000);
})();
