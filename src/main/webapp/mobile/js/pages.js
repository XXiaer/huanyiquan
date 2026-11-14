/* 页面：首页、消息、私聊、社区、集市、拍卖、商品详情、搜索 */
(function () {
  const PAGES = {};

  function topbar(title, opts) {
    const o = opts || {};
    return `<div class="topbar${o.white ? ' topbar--white' : ''}">
      <button class="topbar__back" onclick="${o.onBack || 'history.back()'}">${icon('back', 22)}</button>
      <div class="topbar__spacer"></div>
      <div class="topbar__title">${esc(title)}</div>
      <div class="topbar__spacer"></div>
      ${o.right || ''}
    </div>`;
  }

  /* ============================================================ 首页 */
  const homeTabs = (section = "home") => `<nav class="home-top-tabs" aria-label="校园导航">
    <a href="#/home" ${section === 'home' ? 'aria-current="page"' : ''}>首页</a>
    <a href="#/idle" ${section === 'idle' ? 'aria-current="page"' : ''}>校园闲置</a>
    <a href="#/community" ${section === 'community' ? 'aria-current="page"' : ''}>集市</a>
    <a href="#/relay" ${section === 'relay' ? 'aria-current="page"' : ''}>换物接力</a>
  </nav>`;
  window.renderRelayTabs = () => homeTabs("relay");
  const HOME_CATEGORIES = ['教材', '数码', '运动', '生活', '衣物', '绿植', '其他'];
  const HOME_SEARCH_TOPICS = ['小家电', '考研资料'];
  const SERVICES = [
    { name: '同楼闲置', href: '#/door' },
    { name: '以物换物', href: '#/home' },
    { name: '好物估价', href: '#/appraise' },
    { name: '教材专区', href: '#/category/教材' },
    { name: '毕业好物', href: '#/search/' + encodeURIComponent('毕业'), resetSearch: true },
    { name: '寻物启事', href: '#/lost' },
  ];
  window.__homeChannel = window.__homeChannel || '推荐';

  PAGES.home = {
    tab: 'home',
    async render(view) {
      let list = [];
      let deals = [];
      let batch;
      const load = page => api.get('/api/item/list', {page, size:40});
      const route = location.hash;
      try {
        const [d, dd] = await Promise.all([
          window.campusExchange.browse(load, 2),
          api.get('/api/item/deals', { size: 8 }).catch(() => []),
        ]);
        batch = d;
        list = d.rows;
        deals = (dd || []).filter(window.campusExchange.isSwapOnly);
      } catch (e) { toast(e.message); }

      let followedItems = null;
      if (window.__homeChannel === '关注') {
        try {
          const fs = await api.get('/api/social/follow') || [];
          const ids = new Set(fs.map((u) => u.id));
          followedItems = list.filter((i) => ids.has(i.ownerId));
        } catch (e) { followedItems = []; }
      }
      const feed = followedItems || (window.__homeChannel === '新发'
        ? list.slice().sort((a, b) => String(b.createTime).localeCompare(String(a.createTime)))
        : list);

      if (location.hash !== route) return;
      view.innerHTML = `
      <main class="mobile-home"><div class="home-head">
        <div class="home-guest-nav">
          ${homeTabs()}
          <a class="home-guest-login" href="#/login" hidden>登录</a>
        </div>
        <form class="home-search" role="search">
          ${icon('scan', 20)}
          <input name="keyword" type="search" aria-label="搜索校园闲置" placeholder="搜索校园里的好物" maxlength="200">
          <button type="submit" aria-label="搜索">${icon('search', 21)}</button>
        </form>
        <div class="channels hscroll" id="homeChannels">
          ${['关注', '推荐', '新发', '心愿单', ...HOME_CATEGORIES, ...HOME_SEARCH_TOPICS].map((c) => {
            const isOn = c === window.__homeChannel || (c === '推荐' && window.__homeChannel === '推荐');
            return `<a class="${isOn ? 'on' : ''}" data-ch="${c}" href="javascript:void 0">${c}</a>`;
          }).join('')}
          
        </div>
        <div class="services" aria-label="校园服务">
          ${SERVICES.map((s, i) => `<a href="${s.href}" ${s.resetSearch ? 'data-reset-search' : ''}><i><img src="assets/brand/illustrated-${['door', 'swapRing', 'appraise', 'book', 'grad', 'lost'][i]}.png" width="36" height="36" alt=""></i><span>${s.name}</span></a>`).join('')}
        </div>
      </div>

      <section class="home-feed" aria-label="以物换物"><h1 class="swap-feed-title"><img src="assets/brand/swap-wordmark.webp" width="48" height="12" alt="以物换物"></h1>
        <div data-swap-results>${feed.length ? waterfall(feed) : mascotEmpty('暂时没有可交换的物品', 'assets/brand/mascot-wave-320.webp')}</div>
        ${batch?.hasMore && window.__homeChannel !== '关注' ? '<button class="campus-more" data-swap-more>加载更多</button>' : ''}
      </section>
      ${deals.length ? `<div class="deal-ticker">
        <span class="label">${icon('fire', 12)}成交动态</span>
        <div class="rail" id="dealTicker"></div>
      </div>` : ''}</main>`;

      bindBrowseMore(view, load, 2, batch, window.__homeChannel === '新发');
      const login = view.querySelector('.home-guest-login');
      api.get('/api/user/me').catch(error => {
        if (error.code === 401) login.hidden = false;
      });

      /* 成交动态轮播 */
      const ticker = document.getElementById('dealTicker');
      let ti = 0;
      const renderTicker = () => {
        if (!ticker || !document.body.contains(ticker)) return;
        const it = deals[ti % deals.length];
        ticker.innerHTML = `<div><span>同校成交</span><b>${esc(it.title)}</b><em>${api.yuan(it.price) ? '¥' + api.yuan(it.price) : '换物达成'}</em><span>${fmtTimeShort(it.updateTime)}</span></div>`;
        ti++;
      };
      renderTicker();
      if (ticker && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const tickTimer = setInterval(renderTicker, 3000);
        window.__cleanup = () => clearInterval(tickTimer);
      }

      view.querySelector('[data-reset-search]').addEventListener('click', () => {
        window.__searchTab = 'all';
        window.__searchSort = '';
        window.__searchFilter = {};
      });
      view.querySelector('.home-search').addEventListener('submit', (event) => {
        event.preventDefault();
        const keyword = event.currentTarget.elements.keyword.value.trim();
        window.__searchTab = 'all';
        window.__searchSort = '';
        window.__searchFilter = {};
        location.hash = keyword ? '#/search/' + encodeURIComponent(keyword) : '#/search';
      });

      view.querySelectorAll('[data-ch]').forEach((a) => {
        a.addEventListener('click', () => {
          const c = a.dataset.ch;
          if (c === '心愿单') { location.hash = '#/wish'; return; }
          if (HOME_SEARCH_TOPICS.includes(c)) {
            const form = view.querySelector('.home-search');
            form.elements.keyword.value = c;
            form.requestSubmit();
            return;
          }
          if (HOME_CATEGORIES.includes(c)) { location.hash = '#/category/' + encodeURIComponent(c); return; }
          window.__homeChannel = c;
          renderRoute();
        });
      });

    },
  };

  /* ============================================================ 消息列表 */
  function convBadge(c) {
    if (c.itemStatus === 3) return `<span class="badge badge--green">${icon('checkCircle', 12)}交易成功</span>`;
    if (c.itemStatus === 2) return `<span class="badge badge--orange">待确认</span>`;
    return '';
  }
  function isService(c) {
    return c.peerId === 10 || c.peerId === 11 || String(c.peer || '').indexOf('小助手') >= 0 || String(c.peer || '').indexOf('小管家') >= 0;
  }

  PAGES.messages = {
    tab: 'message',
    async render(view) {
      const route = location.hash;
      let notifs = [];
      let convs = [];
      let summary = { trade: 0, notice: 0, follow: 0, total: 0 };
      const r = await Promise.all([
        api.get('/api/notification'),
        api.get('/api/conversation'),
      ]);
      notifs = r[0] || [];
      convs = r[1] || [];
      notifs.filter(n => !n.read && !String(n.target || '').startsWith('#/chat/')).forEach(n => {
        const category = n.category || 'notice';
        summary[category] = (summary[category] || 0) + 1;
      });
      const chatCounts = new Map();
      notifs.filter(n => !n.read && /^#\/chat\/\d+$/.test(n.target || '')).forEach(n => {
        chatCounts.set(n.target, (chatCounts.get(n.target) || 0) + 1);
      });
      convs = convs.map(c => ({...c, unread: chatCounts.get('#/chat/' + c.id) || 0}));
      summary.total = notifs.filter(n => !n.read).length;
      const blocked = JSON.parse(localStorage.getItem('blocked') || '[]').map((x) => Number(x.id));
      if (blocked.length) convs = convs.filter((c) => blocked.indexOf(Number(c.peerId)) < 0);
      if (route !== location.hash) return;
      const unreadDot = count => '<i class="msg-unread-dot" role="img" aria-label="有未读消息"' + (count ? '' : ' hidden') + '></i>';

      const byCat = (c) => notifs.filter(n => (n.category || 'notice') === c && !String(n.target || '').startsWith('#/chat/'));
      const tradeNew = byCat('trade')[0];
      const noticeNew = byCat('notice')[0];
      const followNew = byCat('follow')[0];
      const now = Date.now();
      const recent = [];
      const older = [];
      convs.forEach((c) => {
        const t = c.lastAt ? new Date(String(c.lastAt).replace('T', ' ').replace(/-/g, '/')).getTime() : 0;
        (now - t > 30 * 86400 * 1000 ? older : recent).push(c);
      });

      view.innerHTML = `
      <div class="msg-page">
        <div class="topbar topbar--white">
          <div class="topbar__title topbar__title--lg">消息</div>
          <div class="topbar__spacer"></div>
          <div class="topbar__acts">
            <button id="msgSearch" aria-label="搜索">${icon('search', 23)}</button>
            <button id="msgManage" aria-label="消息管理">${icon('list', 23)}</button>
            <button id="msgSet" aria-label="消息设置">${icon('gear', 23)}</button>
          </div>
        </div>

        <div class="msg-sys">
          <div class="msg-row" data-message-category="trade" data-go="#/notifications/trade">
            <div class="msg-row__ico msg-row__ico--a">${icon('bag', 23)}</div>
            <div class="msg-row__main">
              <div class="msg-row__title">交易消息</div>
              <div class="msg-row__sub">${esc(tradeNew ? tradeNew.content : '出价、交换与交付状态变化都在这')}</div>
              <div class="msg-row__time">${tradeNew ? fmtTime(tradeNew.createdAt) : ''}</div>
            </div>
            <div class="msg-row__right">${unreadDot(summary.trade)}</div>
          </div>
          <div class="msg-row" data-message-category="notice" data-go="#/notifications/notice">
            <div class="msg-row__ico msg-row__ico--b">${icon('gift', 23)}</div>
            <div class="msg-row__main">
              <div class="msg-row__title">通知消息</div>
              <div class="msg-row__sub">${esc(noticeNew ? noticeNew.content : '系统通知与互动提醒')}</div>
              <div class="msg-row__time">${noticeNew ? fmtTime(noticeNew.createdAt) : ''}</div>
            </div>
            <div class="msg-row__right">${unreadDot(summary.notice)}</div>
          </div>
          <div class="msg-row" data-message-category="follow" data-go="#/notifications/follow">
            <div class="msg-row__ico msg-row__ico--c">${icon('eye', 23)}</div>
            <div class="msg-row__main">
              <div class="msg-row__title">关注上新</div>
              <div class="msg-row__sub">${esc(followNew ? followNew.content : '关注的同学发布了新闲置会出现在这里')}</div>
              <div class="msg-row__time">${followNew ? fmtTime(followNew.createdAt) : ''}</div>
            </div>
            <div class="msg-row__right">${unreadDot(summary.follow)}</div>
          </div>
        </div>

        <a class="msg-followers-link" href="#/followers">谁关注了我 ${icon('right', 16)}</a>
        ${recent.length ? `<div class="msg-group">${icon('clock', 15)}<span>最近的消息</span></div>${recent.map(convRow).join('')}` : ''}
        ${older.length ? `<div class="msg-group">${icon('clock', 15)}<span>1 个月以前的消息</span></div>${older.map(convRow).join('')}` : ''}
        ${!convs.length ? mascotEmpty('还没有会话，去商品页跟同学聊聊', 'assets/brand/mascot-wave-320.webp', { href: '#/market', text: '去集市看看' }) : ''}
      </div>`;

      function convRow(c) {
        const svc = isService(c);
        return `<div class="conv-wrap" data-cid="${c.id}">
          <div class="conv__actions">
            <button class="a-pin" data-act="pin">${icon('pin', 19)}${c.pinned ? '取消置顶' : '置顶'}</button>
            <button class="a-read" data-act="read">${icon('checkCircle', 19)}标为已读</button>
            <button class="a-del" data-act="del">${icon('trash', 19)}删除</button>
          </div>
          <a class="conv" href="#/chat/${c.id}">
            ${avatar({ nickname: c.peer, id: c.peerId, avatar: c.peerAvatar }, 48)}
            <div class="conv__main">
              <div class="conv__top">
                <span class="conv__name">${esc(c.peer)}</span>
                ${svc ? '<span class="badge badge--gray">服务号</span>' : ''}
                ${svc ? '' : convBadge(c)}
                ${c.pinned ? `<span class="conv__pin">${icon('pin', 14)}</span>` : ''}
                ${c.muted ? `<span class="conv__mute">${icon('mute', 14)}</span>` : ''}
              </div>
              <div class="conv__text">${esc(c.lastText || '开始聊聊这件宝贝吧')}</div>
              <div class="conv__time">${fmtTime(c.lastAt)}</div>
            </div>
            ${c.unread ? `<span class="conv__badge">${c.unread > 99 ? '99+' : c.unread}</span>` : ''}
            <img class="conv__pic" src="${api.firstPic({ images: c.images })}" alt="">
          </a>
        </div>`;
      }

      window.__unread = summary.total || 0;
      renderTabbar('message', window.__unread);

      view.querySelectorAll('[data-go]').forEach((row) => {
        row.addEventListener('click', () => { location.hash = row.dataset.go; });
      });
      document.getElementById('msgSearch').addEventListener('click', () => {
        openSheet('搜索消息', `<input class="field" id="convSearch" placeholder="搜昵称或消息关键词" autocomplete="off">
          <div id="convResults" style="margin-top:8px"></div>`, {
          onMount(sheet, close) {
            const box = sheet.querySelector('#convResults');
            const draw = (kw) => {
              const k = (kw || '').trim().toLowerCase();
              const hits = convs.filter((c) => !k || String(c.peer).toLowerCase().indexOf(k) >= 0 || String(c.lastText || '').toLowerCase().indexOf(k) >= 0);
              box.innerHTML = hits.length ? hits.map((c) => `
                <div class="list-block" data-c="${c.id}" style="margin:0 -18px;padding-left:18px;padding-right:18px">
                  ${avatar({ nickname: c.peer, id: c.peerId, avatar: c.peerAvatar }, 40)}
                  <div class="main"><b>${esc(c.peer)}</b><p>${esc(c.lastText || '')}</p></div>
                  ${icon('right', 16)}
                </div>`).join('') : '<div class="empty" style="padding:26px 0">没有匹配的会话</div>';
              box.querySelectorAll('[data-c]').forEach((row) => row.addEventListener('click', () => {
                close(); location.hash = '#/chat/' + row.dataset.c;
              }));
            };
            draw('');
            sheet.querySelector('#convSearch').addEventListener('input', (e) => draw(e.target.value));
          },
        });
      });
      document.getElementById('msgSet').addEventListener('click', () => { location.hash = '#/settings/notify'; });
      document.getElementById('msgManage').addEventListener('click', () => {
        openSheet('消息管理', `<div class="set-card">
          <div class="set-row" data-m="read">全部标为已读<span class="set-row__arrow">${icon('checkCircle', 18)}</span></div>
          <div class="set-row" data-m="clear">清理已读会话<span class="set-row__arrow">${icon('trash', 18)}</span></div>
          <div class="set-row" data-m="settings">消息通知设置<span class="set-row__arrow">${icon('right', 16)}</span></div>
        </div>`, {
          onMount(sheet, close) {
            sheet.querySelector('[data-m="read"]').addEventListener('click', async () => {
              try { await api.post('/api/notification/read', {}); toast('已全部标为已读'); close(); renderRoute(); } catch (e) { toast(e.message); }
            });
            sheet.querySelector('[data-m="clear"]').addEventListener('click', () => {
              close();
              const read = convs.filter((c) => !c.unread && !c.pinned);
              if (!read.length) { toast('没有可清理的会话'); return; }
              confirmSheet('清理已读会话', `将删除 ${read.length} 个已读会话（置顶会话保留）。`, '清理', async () => {
                for (const c of read) { try { await api.del('/api/conversation/' + c.id); } catch (e) { /* 忽略 */ } }
                toast('已清理'); renderRoute();
              });
            });
            sheet.querySelector('[data-m="settings"]').addEventListener('click', () => { close(); location.hash = '#/settings/notify'; });
          },
        });
      });

      /* 左滑 */
      view.querySelectorAll('.conv-wrap').forEach((wrap) => {
        let sx = 0, sy = 0, swiping = false, moved = false;
        const conv = wrap.querySelector('.conv');
        wrap.addEventListener('touchstart', (e) => {
          sx = e.touches[0].clientX; sy = e.touches[0].clientY; swiping = true; moved = false;
        }, { passive: true });
        wrap.addEventListener('touchmove', (e) => {
          if (!swiping) return;
          const dx = e.touches[0].clientX - sx;
          const dy = e.touches[0].clientY - sy;
          if (Math.abs(dy) > Math.abs(dx) && !moved) { swiping = false; return; }
          if (dx < -8) {
            moved = true;
            conv.style.transition = 'none';
            conv.style.transform = `translateX(${Math.max(-204, dx)}px)`;
          }
        }, { passive: true });
        wrap.addEventListener('touchend', (e) => {
          if (!moved) return;
          const dx = e.changedTouches[0].clientX - sx;
          conv.style.transition = '';
          conv.style.transform = '';
          if (dx < -58) {
            view.querySelectorAll('.conv-wrap.open').forEach((w) => { if (w !== wrap) w.classList.remove('open'); });
            wrap.classList.add('open');
          } else wrap.classList.remove('open');
        });
        wrap.querySelectorAll('[data-act]').forEach((btn) => {
          btn.addEventListener('click', async (e) => {
            e.preventDefault(); e.stopPropagation();
            const cid = wrap.dataset.cid;
            const act = btn.dataset.act;
            try {
              if (act === 'pin') { await api.post('/api/conversation/' + cid + '/pin', { pinned: !wrap.querySelector('.conv__pin') }); toast('已更新置顶'); }
              if (act === 'read') { await api.post('/api/conversation/' + cid + '/read', {}); toast('已标为已读'); }
              if (act === 'del') {
                confirmSheet('删除会话', '删除后只会从你的列表消失，对方仍保留聊天记录。', '删除', async () => {
                  await api.del('/api/conversation/' + cid);
                  toast('已删除'); renderRoute();
                });
                return;
              }
              renderRoute();
            } catch (err) { toast(err.message); }
          });
        });
      });
    },
  };

  /* ============================================================ 私聊 */
  PAGES.chat = {
    noTab: true,
    async render(view, params) {
      let conv;
      try {
        conv = await api.get('/api/conversation/' + params.id);
      } catch (e) {
        view.innerHTML = mascotEmpty(esc(e.message), 'assets/brand/mascot-wave-320.webp');
        return;
      }
      const me = window.__me || (window.__me = await api.get('/api/user/me').catch(() => null));
      const myId = me ? me.id : 0;
      const peer = { nickname: conv.peer, id: conv.peerId, avatar: conv.peerAvatar };
      const item = {
        id: conv.itemId, title: conv.title, images: conv.images, price: conv.price,
        tradeMode: conv.tradeMode, status: conv.itemStatus,
      };
      const order = conv.order;
      const price = api.yuan(item.price);
      const svc = isService(conv);
      const primaryText = order && order.status === 3 ? '去评价'
        : order && order.status === 2 ? '确认收货'
        : order && order.status === 1 ? '确认交换'
        : item.status === 3 ? '去评价'
        : item.tradeMode === 2 ? '发起交换' : '去看看';
      const orderStateText = order
        ? (order.status === 3 ? '交易成功' : order.status === 2 ? '交换中' : order.status === 1 ? '待确认' : order.statusText)
        : conv.itemStatusText;

      view.innerHTML = `
      <div class="chat-page">
        <div class="chat-head">
          <button class="topbar__back" aria-label="返回" onclick="history.back()">${icon('back', 22)}</button>
          <div class="chat-head__main">
            <div class="chat-head__name">
              ${esc(conv.peer)}
              ${!svc && conv.peerSellerCredit != null ? `<span class="badge">卖家信用${creditLevel(conv.peerSellerCredit)}</span>` : ''}
              ${svc ? '<span class="badge badge--gray">服务号</span>' : ''}
            </div>
            <div class="chat-head__sub">会员名：${svc ? '官方账号' : String(conv.peer).slice(0, 1) + '***' + String(conv.peerId).slice(-2)}</div>
          </div>
          <button id="chatMore" aria-label="会话选项">${icon('more', 22)}</button>
        </div>

        <div class="chat-thread" id="chatThread">
        <div class="chat-item" id="chatItem">
          <img class="chat-item__pic" src="${api.firstPic(item)}" alt="">
          <div class="chat-item__main">
            <div class="chat-item__title">${esc(item.title || '关联物品')}</div>
            <div class="chat-item__meta">${[item.tradeMode === 2 ? '以物换物' : price ? '¥' + price : '', orderStateText].filter(Boolean).map(esc).join(' | ')}</div>
          </div>
          <div class="chat-item__act">
            <button class="chat-item__btn" id="chatPrimary">${primaryText}</button>
            <button class="chat-item__more" id="chatExpand" aria-label="交易详情" aria-controls="chatDetail" aria-expanded="false">${icon('down', 18)}</button>
          </div>
        </div>
        <div class="chat-item__detail" id="chatDetail" hidden>
          <div><span>交易方式</span><b>${item.tradeMode === 2 ? '以物换物' : item.tradeMode === 3 ? '拍卖' : '出售'}</b></div>
          <div><span>面交地点</span><b>${esc((order && order.place) || '待约定')}</b></div>
          <div><span>约定时间</span><b>${esc((order && order.dealTime) || '待约定')}</b></div>
          <div><span>订单状态</span><b>${order ? order.statusText : '暂未生成交换单'}</b></div>
        </div>

        <p class="chat-safety">建议在校园公共地点面交，验货后再确认。</p>

        ${order && order.status === 2 ? `
          <div class="chat-card" id="confirmCard">
            <h4>确认收货</h4>
            <p>请仔细检查商品信息与成色，确认无误后再点确认收货。</p>
            <div style="display:flex;justify-content:flex-end;margin-top:10px">
              <button class="btn btn--sm" id="confirmReceipt">确认收货</button>
            </div>
          </div>` : ''}
        ${order && order.status === 3 ? `
          <div class="chat-card chat-card--row">
            <div class="main">
              <h4>快给 ta 一个评价吧～</h4>
              <p>交易体验还满意吗？评价能帮更多同学放心交换。</p>
            </div>
            <button class="btn btn--sm" id="goReview">去评价</button>
          </div>` : ''}

        <div class="chat-body" id="chatBody">
          <div class="time-pill">${conv.messages.length ? fmtTimeShort(conv.messages[0].createdAt) : '刚刚'}</div>
          ${conv.messages.map((m) => renderMessage(m, myId, peer, me)).join('')}
        </div>

        </div>
        <div class="chat-bottom">
          <form class="chat-input" id="chatCompose">
            <button class="chat-input__round" id="btnVoice" type="button" aria-label="录制语音">${icon('mic', 25)}</button>
            <div class="chat-input__box">
              <input id="chatText" aria-label="消息内容" placeholder="输入消息" autocomplete="off" enterkeyhint="send">
            </div>
            <button class="chat-input__round" id="btnEmoji" type="button" aria-label="插入表情">${icon('emoji', 25)}</button>
            <button class="chat-input__round" id="btnPlus" type="button" aria-label="更多消息选项">${icon('plus', 25)}</button>
            <button class="chat-send" type="submit">发送</button>
          </form>
          <div id="panelHost"></div>
        </div>
      </div>`;

      const body = document.getElementById('chatBody');
      const thread = document.getElementById('chatThread');
      const chatPage = thread.closest('.chat-page');
      const viewport = window.visualViewport;
      const scrollToLatest = () => { thread.scrollTop = thread.scrollHeight; };
      const syncViewport = () => {
        const nearEnd = thread.scrollHeight - thread.scrollTop - thread.clientHeight < 140;
        chatPage.style.setProperty('--chat-viewport', (viewport?.height || window.innerHeight) + 'px');
        if (nearEnd) scrollToLatest();
      };
      viewport?.addEventListener('resize', syncViewport);
      window.addEventListener('resize', syncViewport);
      syncViewport();
      scrollToLatest();
      body.addEventListener('click', (e) => {
        const card = e.target.closest('[data-ex]');
        if (card) location.hash = '#/exchange/' + card.dataset.ex;
      });

      function renderMessage(m, mineId, peerObj, meObj) {
        const mine = m.senderId === mineId;
        const peerAv = `<span onclick="event.stopPropagation();location.hash='#/user/${peerObj.id}'">${avatar(peerObj, 36)}</span>`;
        const card = (html) => mine
          ? `<div class="bubble-row bubble-row--me">${avatar(meObj || '我', 36)}<div class="bubble-wrap">${html}</div></div>`
          : `<div class="bubble-row">${peerAv}<div class="bubble-wrap">${html}</div></div>`;
        if (m.kind === 'image') {
          return card(`<img src="${m.image}" style="max-width:210px;border-radius:12px" alt="">`);
        }
        if (m.kind === 'voice') {
          return card(`<div class="bubble" style="padding:8px 12px"><audio controls src="${m.image}" style="height:32px;max-width:200px"></audio></div>`);
        }
        if (m.kind === 'meet') {
          let ex = {};
          try { ex = JSON.parse(m.extra || '{}'); } catch (e) { /* 忽略 */ }
          return `<div class="meet-card">
            <div class="hd">${icon('meet', 16)}面交约定</div>
            <div class="main">${esc(ex.place || m.content)}</div>
            <div class="sub">${esc(ex.time || '时间待确认')} | 请准时到约定地点</div>
            <div class="acts">
              <button data-copy="${esc(ex.place || m.content)}">复制地点</button>
              <button data-map="${esc(ex.place || m.content)}">看看位置</button>
            </div>
          </div>`;
        }
        if (m.kind === 'exchange') {
          let ex = {};
          try { ex = JSON.parse(m.extra || '{}'); } catch (e) { /* 忽略 */ }
          return `<div class="exchange-card" ${ex.exchangeId ? `data-ex="${ex.exchangeId}" style="cursor:pointer"` : ''}>
            <div class="hd">${icon('exchange', 20)}交换达成</div>
            <div class="items">${esc(ex.give || '你的闲置')}<span>⇄</span>${esc(ex.get || '对方的宝贝')}</div>
            <div class="foot"><span>双方已确认，按约定面交</span>${icon('right', 14)}</div>
          </div>`;
        }
        if (m.kind === 'card') {
          let ex = {};
          try { ex = JSON.parse(m.extra || '{}'); } catch (e) { /* 忽略 */ }
          if (!ex.title) return card(`<div class="bubble">${esc(m.content)}</div>`);
          return card(`<div class="bubble" style="padding:9px;width:220px">
            <img src="${ex.image || api.firstPic({ images: ex.images })}" style="width:100%;height:130px;object-fit:cover;border-radius:8px" alt="">
            <div style="margin-top:7px;font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(ex.title)}</div>
            <div class="price" style="font-size:16px;margin-top:3px"><em>¥</em><b>${api.yuan(ex.price) || '想换'}</b></div>
          </div>`);
        }
        return card(`<div class="bubble">${esc(m.content)}</div>`);
      }

      let latestId = Number(conv.messages?.at(-1)?.id) || 0;
      let refreshing = false;
      let sending = false;
      async function refreshMessages(force = false) {
        if (refreshing || !body.isConnected || (!force && (sending || document.hidden))) return;
        refreshing = true;
        try {
          const thread = await api.get('/api/conversation/' + conv.id);
          if (!body.isConnected) return;
          window.refreshMessageAlerts?.();
          const updates = (thread.messages || []).filter(m => Number(m.id) > latestId);
          if (!updates.length) return;
          const nearEnd = thread.scrollHeight - thread.scrollTop - thread.clientHeight < 140;
          body.insertAdjacentHTML('beforeend', updates.map(m => renderMessage(m, myId, peer, me)).join(''));
          latestId = Number(updates.at(-1).id);
          if (force || nearEnd) scrollToLatest();
        } catch (e) { /* Keep the current messages while the connection is unavailable. */ }
        finally { refreshing = false; }
      }
      const chatTimer = setInterval(refreshMessages, 5000);
      window.__cleanup = () => {
        clearInterval(chatTimer);
        viewport?.removeEventListener('resize', syncViewport);
        window.removeEventListener('resize', syncViewport);
      };

      const composer = document.getElementById('chatCompose');
      const input = composer.querySelector('input');
      const sendButton = composer.querySelector('[type=submit]');
      const send = async (text, kind, image, extra) => {
        const t = (text || '').trim();
        if (sending || (!t && !image && !extra)) return;
        sending = true;
        sendButton.disabled = true;
        try {
          await api.post('/api/conversation/' + conv.id, { kind: kind || 'text', content: t, image: image || '', extra: extra || '' });
          await refreshMessages(true);
          if ((!kind || kind === 'text') && !image && !extra && input.value.trim() === t) input.value = '';
        } catch (e) { toast(e.message); }
        finally { sending = false; sendButton.disabled = false; }
      };

      composer.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!uploadingPhoto) send(input.value);
      });

      let uploadingPhoto = false;
      const uploadAndSend = async (file) => {
        if (!file || uploadingPhoto || sending) return;
        uploadingPhoto = true;
        sendButton.disabled = true;
        try {
          const uploaded = await api.upload(file);
          if (body.isConnected) await send('', 'image', uploaded.url, '');
        } catch (error) {
          toast('发送失败：' + error.message);
        } finally {
          uploadingPhoto = false;
          sendButton.disabled = false;
        }
      };

      const panel = () => {
        const host = document.getElementById('panelHost');
        const close = host.dataset.mode === 'attachments';
        host.dataset.mode = close ? '' : 'attachments';
        if (close) { host.innerHTML = ''; return; }
        host.innerHTML = `<div class="chat-panel">
          <a data-p="相册"><i>${icon('image', 24)}</i>相册</a>
          <a data-p="拍摄"><i>${icon('camera', 24)}</i>拍摄</a>
          <a data-p="发送位置"><i>${icon('location', 24)}</i>发送位置</a>
          <a data-p="发送宝贝"><i>${icon('bag', 24)}</i>发送宝贝</a>
          <a data-p="约面交"><i>${icon('meet', 24)}</i>约面交</a>
          <a data-p="发起交换"><i>${icon('swapRing', 24)}</i>发起交换</a>
        </div>`;
        host.querySelectorAll('[data-p]').forEach((a) => {
          a.addEventListener('click', () => {
            const k = a.dataset.p;
            host.innerHTML = '';
            host.dataset.mode = '';
            if (k === '相册' || k === '拍摄') {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              if (k === '拍摄') input.setAttribute('capture', 'environment');
              input.hidden = true;
              chatPage.append(input);
              input.addEventListener('change', () => {
                const file = input.files[0];
                input.remove();
                uploadAndSend(file);
              }, {once: true});
              input.addEventListener('cancel', () => input.remove(), {once: true});
              input.click();
            } else if (k === '发送位置') {
              send('重庆移通学院 | 缤果大街', 'text');
            } else if (k === '约面交') {
              openSheet('约个面交', `<div class="label">地点</div>
                <div class="pe-chips" id="meetPlaces">${['图书馆门口', '缤果大街', '紫荆 3 号楼', '紫荆 5 号楼', '体育馆']
                  .map((p, i) => `<span class="chip${i === 0 ? ' on' : ''}" data-v="${p}">${p}</span>`).join('')}</div>
                <div class="label" style="margin-top:16px">时间</div>
                <div class="pe-chips" id="meetTimes">${['今天 18:30', '明天 12:30', '明天 18:30', '周末 10:00']
                  .map((p, i) => `<span class="chip${i === 1 ? ' on' : ''}" data-v="${p}">${p}</span>`).join('')}</div>
                <button class="btn btn--block" style="margin-top:22px" id="meetGo">发给她</button>`, {
                onMount(sheet, close) {
                  ['meetPlaces', 'meetTimes'].forEach((id) => {
                    sheet.querySelectorAll('#' + id + ' .chip').forEach((c) => c.addEventListener('click', () => {
                      sheet.querySelectorAll('#' + id + ' .chip').forEach((x) => x.classList.remove('on'));
                      c.classList.add('on');
                    }));
                  });
                  sheet.querySelector('#meetGo').addEventListener('click', () => {
                    const place = sheet.querySelector('#meetPlaces .chip.on').dataset.v;
                    const time = sheet.querySelector('#meetTimes .chip.on').dataset.v;
                    close();
                    send(time + ' | ' + place, 'meet', '', JSON.stringify({ place, time }));
                  });
                },
              });
            } else if (k === '发送宝贝') {
              api.get('/api/item/mine').then((list) => {
                const mine = (list || []).filter((i) => i.status === 1);
                openSheet('发送我的宝贝', mine.length ? mine.map((i) => `
                  <div class="list-block" data-send="${i.id}" style="margin:0 -18px;padding-left:18px;padding-right:18px">
                    <img src="${api.firstPic(i)}" alt="">
                    <div class="main"><b>${esc(i.title)}</b><p>${api.yuan(i.price) ? '¥' + api.yuan(i.price) : '想换'}</p></div>
                    ${icon('right', 16)}
                  </div>`).join('') : '<div class="empty">你还没有在架的宝贝</div>', {
                  onMount(sheet, close) {
                    sheet.querySelectorAll('[data-send]').forEach((row) => row.addEventListener('click', async () => {
                      const it = mine.find((x) => String(x.id) === row.dataset.send);
                      close();
                      await send('看看这件：' + it.title, 'card', '', JSON.stringify({ itemId: it.id, title: it.title, images: it.images, price: it.price }));
                    }));
                  },
                });
              }).catch((e) => toast(e.message));
            } else if (k === '发起交换') {
              api.get('/api/item/mine').then((list) => {
                const mine = (list || []).filter((i) => i.status === 1);
                openSheet('拿哪件来换', mine.length ? mine.map((i) => `
                  <div class="list-block" data-offer="${i.id}" style="margin:0 -18px;padding-left:18px;padding-right:18px">
                    <img src="${api.firstPic(i)}" alt="">
                    <div class="main"><b>${esc(i.title)}</b><p>${api.yuan(i.price) ? '¥' + api.yuan(i.price) : '想换'}</p></div>
                    ${icon('right', 16)}
                  </div>`).join('') : '<div class="empty">先在「我的发布」里发一件闲置，才能发起交换</div>', {
                  onMount(sheet, close) {
                    sheet.querySelectorAll('[data-offer]').forEach((row) => row.addEventListener('click', async () => {
                      close();
                      try {
                        await api.post('/api/offer', { itemId: item.id, myItemId: Number(row.dataset.offer), message: '想用这件跟你换' });
                        toast('交换意向已发出，等对方回应');
                      } catch (e) { toast(e.message); }
                    }));
                  },
                });
              }).catch((e) => toast(e.message));
            }
          });
        });
      };
      document.getElementById('btnPlus').addEventListener('click', panel);

      const EMOJIS = ['\u{1F600}','\u{1F604}','\u{1F60A}','\u{1F642}','\u{1F609}','\u{1F60D}','\u{1F914}','\u{1F605}','\u{1F602}','\u{1F979}','\u{1F62D}','\u{1F634}','\u{1F44D}','\u{1F44C}','\u{1F64F}','\u{1F4AA}','\u{1F389}','❤️','\u{1F525}','✨','\u{1F4DA}','\u{1F3A7}','\u{1F6B2}','\u{1F9FA}','\u{1F35C}','☕','\u{1F324}️','\u{1F4CD}'];
      document.getElementById('btnEmoji').addEventListener('click', () => {
        const host = document.getElementById('panelHost');
        if (host.dataset.mode === 'emoji') { host.innerHTML = ''; host.dataset.mode = ''; return; }
        host.dataset.mode = 'emoji';
        host.innerHTML = '<div class="chat-panel chat-panel--emoji">' + EMOJIS.map((e) => '<button data-emoji="' + e + '">' + e + '</button>').join('') + '</div>';
        host.querySelectorAll('[data-emoji]').forEach((b) => b.addEventListener('click', () => {
          const input = document.getElementById('chatText');
          input.value += b.dataset.emoji; input.focus();
        }));
      });

      let recorder = null, chunks = [], recStart = 0;
      document.getElementById('btnVoice').addEventListener('click', async () => {
        if (recorder && recorder.state === 'recording') { recorder.stop(); return; }
        if (!navigator.mediaDevices || !window.MediaRecorder) { toast('这个浏览器不支持录音，换 Chrome 试试'); return; }
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          chunks = []; recorder = new MediaRecorder(stream); recStart = Date.now();
          recorder.ondataavailable = (ev) => { if (ev.data.size) chunks.push(ev.data); };
          recorder.onstop = async () => {
            stream.getTracks().forEach((t) => t.stop());
            const secs = Math.max(1, Math.round((Date.now() - recStart) / 1000));
            const blob = new Blob(chunks, { type: 'audio/webm' });
            document.getElementById('btnVoice').style.color = '';
            if (blob.size < 800) { toast('太短了，再按一次说久一点'); return; }
            const fd = new FormData();
            fd.append('file', new File([blob], 'voice.webm', { type: 'audio/webm' }));
            try {
              const res = await fetch('/api/upload', { method: 'POST', body: fd, credentials: 'same-origin' });
              const j = await res.json();
              if (j.code !== 0) throw new Error(j.msg);
              await send(String(secs), 'voice', j.data.url, '');
              toast('语音已发送');
            } catch (e) { toast('发送失败：' + e.message); }
          };
          recorder.start();
          document.getElementById('btnVoice').style.color = 'var(--red-500)';
          toast('正在录音，再按一次结束');
        } catch (e) { toast('没有拿到麦克风权限'); }
      });

      document.getElementById('chatExpand').addEventListener('click', () => {
        const d = document.getElementById('chatDetail');
        const expanded = d.hidden;
        d.hidden = !expanded;
        d.classList.toggle('open', expanded);
        document.getElementById('chatExpand').setAttribute('aria-expanded', String(expanded));
      });

      document.getElementById('chatPrimary').addEventListener('click', async () => {
        if (order && order.status === 3) { location.hash = '#/user/' + conv.peerId + '/review'; return; }
        if (order && order.status === 2) { await confirmReceipt(); return; }
        if (order && order.status === 1) {
          try { await api.post('/api/exchange/' + order.exchangeId + '/confirm', {}); toast('已确认交换，等待对方确认'); renderRoute(); }
          catch (e) { toast(e.message); }
          return;
        }
        if (item.status === 3) { location.hash = '#/user/' + conv.peerId + '/review'; return; }
        location.hash = '#/item/' + item.id;
      });
      const confirmBtn = document.getElementById('confirmReceipt');
      const confirmReceipt = async () => {
        if (!order) return;
        try {
          await api.post('/api/exchange/' + order.exchangeId + '/done', {});
          await renderRoute();
          successSheet('交换完成', '双方已确认交付，信用分已结算。去给对方一个评价吧。', {
            text: '去评价',
            onClick: () => { location.hash = '#/user/' + conv.peerId + '/review'; },
          });
        } catch (e) { toast(e.message); }
      };
      if (confirmBtn) confirmBtn.addEventListener('click', confirmReceipt);
      const goReview = document.getElementById('goReview');
      if (goReview) goReview.addEventListener('click', () => { location.hash = '#/user/' + conv.peerId + '/review'; });

      document.getElementById('chatMore').addEventListener('click', () => {
        openSheet('聊天设置', `<div class="set-card">
          <div class="set-row" data-m="profile">查看对方主页<span class="set-row__arrow">${icon('right', 16)}</span></div>
          <div class="set-row" data-m="mute">${conv.muted ? '取消免打扰' : '消息免打扰'}<span class="set-row__arrow">${icon(conv.muted ? 'unmute' : 'mute', 18)}</span></div>
          <div class="set-row" data-m="report">举报<span class="set-row__arrow">${icon('right', 16)}</span></div>
        </div>`, {
          onMount(sheet, close) {
            sheet.querySelector('[data-m="profile"]').addEventListener('click', () => { close(); location.hash = '#/user/' + conv.peerId; });
            sheet.querySelector('[data-m="mute"]').addEventListener('click', async () => {
              try { await api.post('/api/conversation/' + conv.id + '/mute', { muted: !conv.muted }); close(); toast(!conv.muted ? '已开启免打扰' : '已取消免打扰'); renderRoute(); } catch (e) { toast(e.message); }
            });
            sheet.querySelector('[data-m="report"]').addEventListener('click', () => { close(); reportSheet(conv.peerId, 'user'); });
          },
        });
      });

      view.querySelectorAll('[data-copy]').forEach((b) => b.addEventListener('click', () => {
        navigator.clipboard.writeText(b.dataset.copy).then(() => toast('地点已复制')).catch(() => toast(b.dataset.copy));
      }));
      view.querySelectorAll('[data-map]').forEach((b) => b.addEventListener('click', () => {
        toast('面交点：' + b.dataset.map + '（校内地图开发中）');
      }));
    },
  };

  function reportSheet(targetId, type) {    openSheet('举报', `<div class="pe-chips" id="reportReasons">${['虚假信息', '违禁物品', '骚扰辱骂', '交易纠纷', '其他']
      .map((r) => `<span class="chip" data-v="${r}">${r}</span>`).join('')}</div>
      <textarea class="field field--area" id="reportText" style="margin-top:14px" placeholder="补充说明（选填）"></textarea>
      <button class="btn btn--block" style="margin-top:16px" id="reportGo">提交举报</button>`, {
      onMount(sheet, close) {
        let picked = '';
        sheet.querySelectorAll('#reportReasons .chip').forEach((c) => c.addEventListener('click', () => {
          sheet.querySelectorAll('#reportReasons .chip').forEach((x) => x.classList.remove('on'));
          c.classList.add('on'); picked = c.dataset.v;
        }));
        sheet.querySelector('#reportGo').addEventListener('click', async () => {
          if (!picked) { toast('选一个举报原因'); return; }
          const text = sheet.querySelector('#reportText').value.trim();
          try {
            await api.post('/api/report', { targetType: type === 'user' ? 2 : 1, targetId, reason: picked + (text ? '：' + text : '') });
            close(); toast('举报已提交，管理员会尽快处理');
          } catch (e) { toast(e.message); }
        });
      },
    });
  }
  window.reportSheet = reportSheet;

  /* ============================================================ 社区 */
  PAGES.community = {
    tab: 'community',
    async render(view) {
      let list = [];
      let me = window.__me;
      if (!me) { try { me = await api.get('/api/user/me'); window.__me = me; } catch (e) { me = null; } }
      try { list = await api.get('/api/community') || []; } catch (e) { /* 忽略 */ }
      const renderCommunityPosts = (rows) => rows.length ? rows.map((m) => `
          <div class="community-card">
            <div class="hd">
              ${avatar({ nickname: m.nickname, id: m.userId, avatar: m.avatar }, 38)}
              <div><b>${esc(m.nickname || '同学')}</b><span>${fmtTime(m.createdAt || m.createTime)}</span></div>
            </div>
            ${m.content ? `<p>${esc(m.content)}</p>` : ''}
            ${m.image ? `<img class="pic" src="${esc(m.image)}" alt="动态图片">` : ''}
            ${m.kind === 'item' ? (m.itemAvailable
              ? `<a class="community-share" href="#/item/${Number(m.itemId)}"><img src="${esc(api.pics({ images: m.itemImages })[0] || 'assets/brand/placeholder.png')}" alt=""><b>${esc(m.itemTitle)}</b>${icon('right', 16)}</a>`
              : '<p>该物品已下架</p>') : ''}
          </div>`).join('') : mascotEmpty('社区还没人发言，来说两句', 'assets/brand/mascot-wave-320.webp');
      view.innerHTML = `
        ${homeTabs('community')}
      <div class="market-community">
      <a class="community-arcade" href="#/community/game">
        ${serviceIcon('game', 40)}
        <span><b>Scrap Arena</b><small>同屏双人对战</small></span>
        ${icon('right', 18)}
      </a>
      <div class="mini-composer" id="composerWrap">
        <div class="mini-composer__avatar">${avatar(me || '我', 36)}</div>
        <div class="mini-composer__box" id="openComposer">分享你的换物日常…</div>
        <button id="communityNew" aria-label="发动态">${icon('edit', 22)}</button>
      </div>
      <div id="communityPosts" style="padding:2px 0 10px">
        ${renderCommunityPosts(list)}
      </div></div>`;
      const open = () => openComposer();
      document.getElementById('openComposer').addEventListener('click', open);
      document.getElementById('communityNew').addEventListener('click', open);
      const feed = document.getElementById('communityPosts');
      let previous = JSON.stringify(list);
      let refreshing = false;
      const timer = setInterval(async () => {
        if (refreshing || document.hidden || !me || !feed.isConnected) return;
        refreshing = true;
        try {
          const rows = await api.get('/api/community') || [];
          const next = JSON.stringify(rows);
          if (feed.isConnected && next !== previous) {
            feed.innerHTML = renderCommunityPosts(rows);
            previous = next;
          }
        } catch (e) { /* Keep the last loaded feed during a connection failure. */ }
        finally { refreshing = false; }
      }, 5000);
      window.__cleanup = () => clearInterval(timer);
    },
  };

  PAGES.communityGame = {
    noTab: true,
    render(view) {
      view.innerHTML = `${topbar('Scrap Arena', { onBack: "location.replace('#/community')" })}
        <section class="arcade-page">
          <iframe src="/scrap-arena/index.html" title="Scrap Arena" allow="fullscreen"></iframe>
          <p>同屏双人键盘对战。点击游戏画面后按 Enter 开始。</p>
          <a class="btn btn--ghost" href="/scrap-arena/index.html" target="_blank" rel="noopener">在新窗口打开</a>
        </section>`;
    },
  };

  function openComposer() {
    openSheet('发一条动态', `<form id="communityPost">
      <textarea class="field field--area" name="content" maxlength="500" placeholder="分享你的换物日常"></textarea>
      <div class="community-attachments">
        <label class="btn btn--ghost btn--sm">添加图片<input name="photo" type="file" accept="image/*" hidden></label>
        <button type="button" class="btn btn--ghost btn--sm" id="postItems">分享物品</button>
      </div>
      <select class="field" name="item" hidden aria-label="选择在架物品"></select>
      <p id="postAttachment" aria-live="polite"></p>
      <button class="btn btn--block" type="submit">发布</button>
    </form>`, {
      onMount(sheet, close) {
        const form = sheet.querySelector('form');
        const { content, photo } = form.elements;
        const item = form.elements.namedItem('item');
        const summary = sheet.querySelector('#postAttachment');
        const picker = sheet.querySelector('#postItems');
        photo.addEventListener('change', () => {
          if (photo.files.length) item.value = '';
          summary.textContent = photo.files[0]?.name || '';
        });
        item.addEventListener('change', () => {
          if (item.value) photo.value = '';
          summary.textContent = '';
        });
        picker.addEventListener('click', async () => {
          picker.disabled = true;
          try {
            const items = await api.get('/api/item/mine', { status: 1 });
            if (!items.length) { toast('还没有在架物品'); return; }
            item.replaceChildren(new Option('选择在架物品', ''), ...items.map(row => new Option(row.title, row.id)));
            item.hidden = false;
            item.focus();
          } catch (e) { toast(e.message); }
          finally { picker.disabled = false; }
        });
        form.addEventListener('submit', async (event) => {
          event.preventDefault();
          const text = content.value.trim();
          const file = photo.files[0];
          const itemId = Number(item.value);
          if (!text && !file && !itemId) { toast('请填写内容或添加附件'); return; }
          const submit = form.querySelector('[type="submit"]');
          submit.disabled = true;
          try {
            const image = file ? (await api.upload(file)).url : '';
            await api.post('/api/community', { kind: image ? 'image' : itemId ? 'item' : 'text', content: text, image, itemId: itemId || null });
            close(); toast('已发布'); renderRoute();
          } catch (e) { toast(e.message); }
          finally { submit.disabled = false; }
        });
      },
    });
  }

  /* ============================================================ 集市 / 分类 */
  function bindBrowseMore(view, load, mode, batch, newest = false) {
    const button = view.querySelector('[data-swap-more]');
    const results = view.querySelector('[data-swap-results]');
    if (!button) return;
    let rows = batch.rows.slice();
    button.onclick = async () => {
      button.disabled = true;
      try {
        batch = await window.campusExchange.browse(load, mode, batch.page + 1);
        if (!results.isConnected) return;
        rows = rows.concat(batch.rows);
        if (newest) rows.sort((a,b) => String(b.createTime).localeCompare(String(a.createTime)));
        results.innerHTML = waterfall(rows);
        button.hidden = !batch.hasMore;
      } catch (error) { toast(error.message); }
      finally { button.disabled = false; }
    };
  }

  PAGES.market = {
    tab: 'home',
    async render(view, params) {
      const route = location.hash;
      const mode = params.idle ? 1 : 2;
      const load = page => api.get('/api/item/list', { category: params.category, page, size:40 });
      let batch;
      try { batch = await window.campusExchange.browse(load, mode); }
      catch (error) { toast(error.message); }
      if (route !== location.hash) return;
      const prefix = params.idle ? '#/idle/category/' : '#/category/';
      view.innerHTML = `
        ${homeTabs(params.idle ? 'idle' : 'home')}
        <h1 class="swap-feed-title">${params.idle ? '校园闲置' : '以物换物'}</h1>
        <div class="r-chips">
          ${['全部', ...HOME_CATEGORIES].map(c =>
            `<a class="chip${(params.category || '全部') === c ? ' on' : ''}" href="${prefix + encodeURIComponent(c === '全部' ? '' : c)}">${c}</a>`).join('')}
        </div>
        <div data-swap-results>${batch?.rows.length ? waterfall(batch.rows) : mascotEmpty('这个分类暂时没有物品', 'assets/brand/mascot-wave-320.webp')}</div>
        ${batch?.hasMore ? '<button class="campus-more" data-swap-more>加载更多</button>' : ''}`;
      bindBrowseMore(view, load, mode, batch);
    },
  };

  /* ============================================================ 拍卖 */
  PAGES.auction = {
    tab: 'auction',
    async render(view) {
      let list = [];
      try { list = await api.get('/api/auction') || []; } catch (e) { /* 忽略 */ }
      list = list.filter((a) => a.state === 'active' || a.state === 'ended');
      view.innerHTML = `
      <div class="topbar">
        <div class="topbar__title topbar__title--lg">拍卖</div>
        <div class="topbar__spacer"></div>
        <a class="btn btn--ghost btn--sm" href="#/publish/edit/auction">${icon('auction', 15)}发起拍卖</a>
      </div>
      <div class="auction-feed">
        ${list.length ? list.map((a) => `
          <div class="auction-card">
            <img src="${esc(a.image || 'assets/brand/placeholder.png')}" alt="" loading="lazy">
            <div class="main">
              <h3>${esc(a.title)}</h3>
              <div class="now"><b>¥${Number(a.currentPrice).toFixed(0)}</b><span>当前价 | ${a.bidCount} 次出价</span></div>
              <div class="foot">
                <span class="time">${a.state === 'active' ? '剩余 ' + remainText(a.endsAt) : '已结束'}</span>
                ${a.state === 'active'
                  ? `<button class="chip on" data-bid="${a.id}" data-cur="${a.currentPrice}" data-title="${esc(a.title)}">出价</button>`
                  : `<a class="chip" href="${a.itemId ? '#/item/' + a.itemId : '#/auction'}">看看</a>`}
              </div>
            </div>
          </div>`).join('') : mascotEmpty('还没有正在进行的拍卖', 'assets/brand/mascot-wave-320.webp', { href: '#/publish/edit/auction', text: '发起一场' })}
      </div>`;
      view.querySelectorAll('[data-bid]').forEach((btn) => btn.addEventListener('click', () => {
        const aid = btn.dataset.bid, cur = btn.dataset.cur;
        openSheet('出价', `<div style="font-size:14px;color:var(--ink-500);margin-bottom:10px">${esc(btn.dataset.title)} | 当前价 ¥${Number(cur).toFixed(0)}</div>
          <div style="display:flex;align-items:center;gap:8px;border-bottom:1px solid var(--line);padding-bottom:10px">
            <span style="font-size:22px;color:var(--orange-700);font-weight:800">¥</span>
            <input id="bidIn" type="number" min="${Number(cur) + 1}" value="${Number(cur) + 10}" style="border:0;outline:none;font-size:24px;font-weight:700;width:100%">
          </div>
          <button class="btn btn--block" style="margin-top:18px" id="bidGo">确认出价</button>`, {
          onMount(sheet, close) {
            sheet.querySelector('#bidGo').addEventListener('click', async () => {
              const amount = sheet.querySelector('#bidIn').value;
              try {
                await api.post('/api/auction/' + aid + '/bid', { amount });
                close(); toast('出价成功'); renderRoute();
              } catch (e) { toast(e.message); }
            });
          },
        });
      }));
    },
  };

  /* ============================================================ 商品详情 */
  PAGES.item = {
    noTab: true,
    async render(view, params) {
      let data;
      let auction = null;
      try {
        data = await api.get('/api/item/' + params.id);
        if (data.item && data.item.tradeMode === 3) {
          const list = await api.get('/api/auction').catch(() => []);
          auction = (list || []).find((a) => Number(a.itemId) === Number(params.id)) || null;
        }
      } catch (e) {
        view.innerHTML = mascotEmpty(esc(e.message), 'assets/brand/mascot-wave-320.webp');
        return;
      }
      const it = data.item;
      const pics = api.pics(it);
      const price = it.isDemo && !window.campusExchange.supports(it,1) ? '' : api.yuan(it.price);
      const wants = data.want || {};
      const wantText = it.wantText || wants.expectDesc || it.expectDesc || (wants.wantCategories || []).join("、") || wants.wantCategory || "不限类别";
      const isSwap = it.tradeMode === 2 || (!it.tradeMode && !price);
      const credit = creditLabel(it.ownerSellerCredit || it.ownerCredit);

      view.innerHTML = `
      <div class="item-page">
        <header class="item-detail-top">
          <button type="button" aria-label="返回" onclick="history.back()">${icon('back', 21)}</button>
          <a href="#/search">${icon('search', 17)}<span>搜索校园闲置</span></a>
          <button type="button" aria-label="更多操作" id="itemMore">${icon('more', 21)}</button>
        </header>
        <div class="item-price">
          <div class="item-price__row">
            ${price ? `<span class="price"><em>¥</em><b>${price}</b></span>` : `<span class="price item-want"><small>想换</small><b>${esc(wantText)}</b></span>`}
            ${price && it.originalPrice && it.originalPrice > it.price ? `<s>¥${api.yuan(it.originalPrice)}</s>` : ''}
            ${it.isDemo && price ? '<span class="badge badge--gray">官网参考价</span>' : ''}
            ${auction ? `<span class="badge badge--orange">拍卖中 | 当前 ¥${Number(auction.currentPrice).toFixed(0)}</span>` : ''}
          </div>
          ${it.isDemo && price && window.campusExchange.supports(it,2) ? `<p class="item-price__meta">想换：${esc(wantText)}</p>` : ''}
          <div class="item-price__meta">
            <span>${it.viewCount || 0} 浏览</span>
            <span>${it.offerCount || 0} 人想要</span>
            <span>${esc(it.conditionLevel)}</span>
            ${it.allowBargain ? '<span>可小刀</span>' : ''}
          </div>
        </div>
        <div class="item-block">
          <h1>${displayItemTitle(it)}</h1>
          <p>${esc(it.description || '同学没写描述，可以直接问问。')}</p>
          <div class="item-tags">
            <span class="badge badge--gray">${esc(it.category)}</span>
            <span class="badge badge--gray">${it.isDemo ? window.campusExchange.demoLabel(it) : isSwap ? '以物换物' : it.tradeMode === 3 ? '拍卖' : '出售'}</span>
            ${it.brand ? `<span class="badge badge--gray">${esc(it.brand)}</span>` : ''}
            ${it.isDemo ? '' : `<span class="badge badge--green">${esc(it.delivery || '仅面交')}</span>`}
          </div>
        </div>
        ${auction ? `<div class="item-block">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <div>
              <div style="font-size:13px;color:var(--ink-500)">拍卖剩余 ${remainText(auction.endsAt)}</div>
              <div class="price" style="font-size:24px;margin-top:4px"><em>¥</em><b>${Number(auction.currentPrice).toFixed(0)}</b></div>
            </div>
            <button class="btn btn--sm" id="itemBid">出价</button>
          </div>
        </div>` : ''}

        <div class="item-detail-photos" aria-label="商品图片">
          ${(pics.length ? pics : ['assets/brand/placeholder.png']).map((pic, i) =>
            `<img src="${esc(pic)}" alt="${pics.length ? '商品图片 ' + (i + 1) : '暂无商品照片'}" ${i ? 'loading="lazy"' : ''}>`).join('')}
        </div>
        ${it.isDemo ? '' : `<div class="item-block">
          <div class="item-owner">
            <span onclick="location.hash='#/user/${it.ownerId}'">${avatar({ nickname: it.ownerNickname, id: it.ownerId, avatar: it.ownerAvatar }, 44)}</span>
            <div class="item-owner__main">
              <div class="item-owner__name">${esc(it.ownerNickname || '同学')}
                ${credit ? `<span class="badge badge--orange">${credit.text}</span>` : ''}
              </div>
              <div class="item-owner__meta">${esc(it.ownerBuilding || '重庆移通学院')} | ${esc(it.place || '校园面交')}</div>
            </div>
            <a href="#/user/${it.ownerId}" class="chip">主页</a>
          </div>
          <div class="item-seller-list"></div>
        </div>`}

        <div class="item-related"></div>
        <div class="item-bar">
          <a class="ic" href="#/home">${icon('home', 22)}<span>首页</span></a>
          <button class="ic" id="itemFav">${icon('star', 22)}<span>收藏</span></button>
          ${it.isDemo ? '<span class="badge badge--gray">仅供展示</span>' : `<button class="btn btn--alt" id="itemWant">${isSwap ? '发起交换' : '想要'}</button>
          <button class="btn" id="itemChat">聊一聊</button>`}
        </div>
      </div>`;

      const sellerList = view.querySelector('.item-seller-list');
      if (sellerList && it.ownerId) {
        api.get('/api/item/user/' + it.ownerId).then((items) => {
          const other = (items || []).filter((row) => Number(row.id) !== Number(it.id)).slice(0, 8);
          if (!sellerList.isConnected || !other.length) return;
          sellerList.innerHTML = `<h2>发布者的在架物品</h2><div class="item-seller-rail">${other.map((row) =>
            `<a href="#/item/${Number(row.id)}"><img src="${esc(api.firstPic(row))}" alt="" loading="lazy"><span>${displayItemTitle(row)}</span></a>`).join('')}</div>`;
        }).catch(() => {});
      }
      const related = view.querySelector('.item-related');
      api.get('/api/item/list', { category: it.category, page: 1, size: 12 }).then((result) => {
        const items = (result.list || []).filter((row) => Number(row.id) !== Number(it.id)
          && Number(row.ownerId) !== Number(it.ownerId)).slice(0, 6);
        if (related.isConnected && items.length) related.innerHTML = '<h2>推荐商品</h2>' + waterfall(items);
      }).catch(() => {});

      api.post('/api/social/history', { itemId: it.id }).catch(() => {});
      document.getElementById('itemMore').addEventListener('click', () => {
        openSheet('更多操作', `<div class="set-card">
          <div class="set-row" data-m="share">分享给同学<span class="set-row__arrow">${icon('share', 17)}</span></div>
          <div class="set-row" data-m="report">举报这件宝贝<span class="set-row__arrow">${icon('right', 16)}</span></div>
        </div>`, {
          onMount(sheet, close) {
            sheet.querySelector('[data-m="share"]').addEventListener('click', async () => {
              const url = location.origin + '/#/item/' + it.id;
              try { await navigator.clipboard.writeText(url); close(); toast('宝贝链接已复制'); } catch (e) { close(); toast(url); }
            });
            sheet.querySelector('[data-m="report"]').addEventListener('click', () => { close(); reportSheet(it.id, 'item'); });
          },
        });
      });
      const favBtn = document.getElementById('itemFav');
      let favored = false;
      api.get('/api/social/favorite/check', { itemId: it.id }).then((r) => {
        favored = !!(r && r.favorited);
        if (favored) favBtn.classList.add('on');
      }).catch(() => {});
      favBtn.addEventListener('click', async () => {
        try {
          const r = await api.post('/api/social/favorite', { itemId: it.id });
          favored = !!(r && r.favorited);
          favBtn.classList.toggle('on', favored);
          toast(favored ? '已加入收藏' : '已取消收藏');
        } catch (e) { toast(e.message); }
      });

      if (it.isDemo) return;

      const startChat = async () => {
        try {
          const r = await api.post('/api/conversation/start', { itemId: it.id });
          location.hash = '#/chat/' + r.id;
        } catch (e) { toast(e.message); }
      };
      document.getElementById('itemChat').addEventListener('click', startChat);

      document.getElementById('itemWant').addEventListener('click', () => {
        api.get('/api/item/mine').then((list) => {
          const mine = (list || []).filter((i) => i.status === 1 && i.id !== it.id);
          if (!mine.length) { toast('先发布一件自己的闲置，再来发起交换'); return; }
          openSheet(it.tradeMode === 2 ? '拿哪件来换' : '想要这件', mine.map((i) => `
            <div class="list-block" data-my="${i.id}" style="margin:0 -18px;padding-left:18px;padding-right:18px">
              <img src="${api.firstPic(i)}" alt="">
              <div class="main"><b>${esc(i.title)}</b><p>${api.yuan(i.price) ? '¥' + api.yuan(i.price) : '想换'}</p></div>
              ${icon('right', 16)}
            </div>`).join(''), {
            onMount(sheet, close) {
              sheet.querySelectorAll('[data-my]').forEach((row) => row.addEventListener('click', async () => {
                close();
                try {
                  await api.post('/api/offer', { itemId: it.id, myItemId: Number(row.dataset.my), message: '想用这件跟你换' });
                  toast('意向已发出，等对方回应');
                } catch (e) { toast(e.message); }
              }));
            },
          });
        }).catch((e) => toast(e.message));
      });

      if (auction) {
        document.getElementById('itemBid').addEventListener('click', () => {
          openSheet('出价', `<div style="font-size:14px;color:var(--ink-500);margin-bottom:10px">当前价 ¥${Number(auction.currentPrice).toFixed(0)}</div>
            <div style="display:flex;align-items:center;gap:8px;border-bottom:1px solid var(--line);padding-bottom:10px">
              <span style="font-size:22px;color:var(--orange-700);font-weight:800">¥</span>
              <input id="bidIn" type="number" value="${Number(auction.currentPrice) + 10}" style="border:0;outline:none;font-size:24px;font-weight:700;width:100%">
            </div>
            <button class="btn btn--block" style="margin-top:18px" id="bidGo">确认出价</button>`, {
            onMount(sheet, close) {
              sheet.querySelector('#bidGo').addEventListener('click', async () => {
                try {
                  await api.post('/api/auction/' + auction.id + '/bid', { amount: sheet.querySelector('#bidIn').value });
                  close(); toast('出价成功'); renderRoute();
                } catch (e) { toast(e.message); }
              });
            },
          });
        });
      }
    },
  };

  /* ============================================================ 搜索落地页 */
  PAGES.searchLanding = {
    noTab: true,
    async render(view) {
      let items = [];
      try {
        const d = await api.get('/api/item/list', { page: 1, size: 60 });
        items = d.list || [];
      } catch (e) { /* 忽略 */ }

      const hist = JSON.parse(localStorage.getItem('searchHistory') || '[]');
      const history = hist.length ? hist : ['高数教材', '宿舍小冰箱', '羽毛球拍', '四六级真题', '收纳箱', '台灯', '机械键盘', '自行车'];
      const hot = items.slice().sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)).slice(0, 8);
      const groups = {};
      items.forEach((it) => { (groups[it.category || '其他'] = groups[it.category || '其他'] || []).push(it); });
      const cats = ['教材', '数码', '运动', '生活'];

      view.innerHTML = `
      <div class="search-head">
        <span class="back" onclick="history.back()">${icon('back', 22)}</span>
        <div class="search-box">
          <input class="txt" id="sInput" placeholder="搜校园好物" autocomplete="off">
          <span class="cam">${icon('camera', 19)}</span>
        </div>
        <button class="search-go" id="sGo">搜索</button>
      </div>

      <div class="s-history-head">
        <h2>历史搜索</h2>
        <div class="acts">
          <button id="clearHist">${icon('trash', 19)}</button>
          <span class="all" id="allHist">全部 ${icon('right', 12)}</span>
        </div>
      </div>
      <div class="s-chips" id="histChips">
        ${history.slice(0, 12).map((h) => `<a class="chip" href="#/search/${encodeURIComponent(h)}">${esc(h)}</a>`).join('')}
        <span class="chip chip--fold">${icon('down', 13)}</span>
      </div>

      <div class="s-history-head">
        <h2>猜你可能在找</h2>
        <div class="acts"><button id="refreshGuess">${icon('refresh', 19)}</button></div>
      </div>
      <div class="s-chips" id="guessChips">
        ${['教材', '数码', '运动', '生活', '绿植', '宿舍神器', '换季衣物', '考研资料', '运动装备', '二手书', '小家电']
          .map((c) => `<a class="chip" href="#/category/${encodeURIComponent(c)}">${c}</a>`).join('')}
      </div>

      <div class="s-history-head"><h2>热搜榜</h2></div>
      <div class="s-rank">
        ${hot.map((it, i) => `<a class="s-rank__row" href="#/item/${it.id}">
          <span class="s-rank__no ${i < 3 ? 'top' : ''}">${i + 1}</span>
          <span class="s-rank__word">${esc(it.title)}</span>
          <span class="s-rank__hot">${it.viewCount || 0} 热度</span>
        </a>`).join('')}
      </div>

      <div class="s-tabrow">
        <a class="on" href="javascript:void 0">我常换的</a>
        <a href="javascript:void 0">教材</a>
        <a href="javascript:void 0">数码</a>
        <a href="javascript:void 0">运动</a>
        <a href="javascript:void 0">生活</a>
      </div>
      <div class="s-bought">
        ${items.slice(0, 6).map((it) => `
          <a href="#/item/${it.id}">
            <img src="${api.firstPic(it)}" alt="">
            <b>${esc(it.title)}</b>
            <span>${api.yuan(it.price) ? '¥' + api.yuan(it.price) : '想换'}</span>
          </a>`).join('')}
      </div>

      ${cats.map((c) => groups[c] ? `
        <div class="s-history-head"><h2>${c}</h2></div>
        <div class="s-cats">
          ${groups[c].slice(0, 4).map((it) => `
            <a href="#/item/${it.id}">
              <img src="${api.firstPic(it)}" alt="">
              <b>${esc(it.title.length > 6 ? it.title.slice(0, 6) : it.title)}</b>
              <span>${it.viewCount || 0} 人在搜</span>
            </a>`).join('')}
        </div>` : '').join('')}
      `;

      const go = () => {
        const kw = document.getElementById('sInput').value.trim();
        if (!kw) return;
        const h = JSON.parse(localStorage.getItem('searchHistory') || '[]');
        h.unshift(kw);
        localStorage.setItem('searchHistory', JSON.stringify([...new Set(h)].slice(0, 12)));
        location.hash = '#/search/' + encodeURIComponent(kw);
      };
      document.getElementById('sGo').addEventListener('click', go);
      document.getElementById('sInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
      document.getElementById('clearHist').addEventListener('click', () => {
        localStorage.removeItem('searchHistory'); toast('历史搜索已清空'); renderRoute();
      });
      document.getElementById('allHist').addEventListener('click', () => {
        document.getElementById('histChips').querySelectorAll('.chip--fold').forEach((x) => x.remove());
      });
      document.getElementById('refreshGuess').addEventListener('click', () => {
        const pool = ['教材', '数码', '运动', '生活', '绿植', '宿舍神器', '运动装备', '二手书'];
        const pick = pool.sort(() => Math.random() - 0.5).slice(0, 8);
        document.getElementById('guessChips').innerHTML = pick.map((c) => `<a class="chip" href="#/category/${encodeURIComponent(c)}">${c}</a>`).join('');
      });
      view.querySelectorAll('.s-tabrow a').forEach((a) => a.addEventListener('click', () => {
        const t = a.textContent.trim();
        view.querySelectorAll('.s-tabrow a').forEach((x) => x.classList.remove('on'));
        a.classList.add('on');
        if (t !== '我常换的') location.hash = '#/category/' + encodeURIComponent(t);
      }));
    },
  };

  /* ============================================================ 搜索结果 */
  window.__searchTab = window.__searchTab || 'all';
  window.__searchSort = window.__searchSort || '';

  PAGES.searchResult = {
    noTab: true,
    async render(view, params) {
      const kw = params.kw || '';
      const tab = window.__searchTab;
      const sort = window.__searchSort;
      const filter = window.__searchFilter || {};
      let list = [];
      let users = [];
      let conditions = [];

      if (tab !== 'users') {
        const query = { page: 1, size: 40, category: filter.category, conditionLevel: filter.condition };
        try {
          const d = await api.get('/api/item/search', { ...query, q: kw });
          list = d.list || [];
          conditions = d.conditions || [];
        } catch (e) {
          try {
            const d = await api.get('/api/item/list', { ...query, keyword: kw, sort });
            list = d.list || [];
          } catch (e2) { toast(e2.message); }
        }
        if (tab === 'personal') list = list.filter(i => !i.isDemo);
        if (filter.area) list = list.filter(i => (i.place || i.ownerBuilding || '').includes(filter.area));
        if (filter.tradeMode) list = list.filter((i) => i.tradeMode === filter.tradeMode);
        if (filter.meet) list = list.filter((i) => (i.delivery || '仅面交') === '仅面交');
        if (sort === 'price_asc') list = list.slice().sort((a, b) => (a.price || 0) - (b.price || 0));
        if (sort === 'price_desc') list = list.slice().sort((a, b) => (b.price || 0) - (a.price || 0));
        if (sort === 'new') list = list.slice().sort((a, b) => String(b.createTime).localeCompare(String(a.createTime)));
        if (sort === 'drop') list = list.slice().sort((a, b) => ((b.originalPrice || 0) - (b.price || 0)) - ((a.originalPrice || 0) - (a.price || 0)));
      } else {
        try { users = await api.get('/api/social/users', { q: kw }) || []; } catch (e) { /* 忽略 */ }
      }

      const tabCls = (k) => (tab === k ? 'on' : '');
      let bodyHtml = '';
      if (tab === 'users') {
        bodyHtml = users.length ? users.map((u) => `
          <a class="conv" href="#/user/${u.id}" style="padding:12px 14px;background:#fff;margin-bottom:1px">
            ${avatar({ nickname: u.nickname, id: u.id, avatar: u.avatar }, 48)}
            <div class="conv__main">
              <div class="conv__top"><span class="conv__name">${esc(u.nickname)}</span>
                ${creditLabel(u.credit) ? `<span class="badge badge--orange">卖家信用${creditLevel(u.credit)}</span>` : ''}
              </div>
              <div class="conv__text">${esc(u.college || '重庆移通学院')} | ${esc(u.building || '缤果大街')}</div>
            </div>
            ${icon('right', 16)}
          </a>`).join('') : mascotEmpty('没找到这个同学', 'assets/brand/mascot-wave-320.webp');
      } else {
        bodyHtml = `<div class="r-feed-wrap">${list.length ? waterfallWith(list, resultCard) : mascotEmpty('没找到「' + esc(kw) + '」，换个说法试试', 'assets/brand/mascot-wave-320.webp')}</div>`;
      }

      view.innerHTML = `
      <div class="search-head">
        <span class="back" onclick="history.back()">${icon('back', 22)}</span>
        <div class="search-box">
          <input class="txt" id="rInput" value="${esc(kw)}" autocomplete="off">
          <span class="clr" id="rClear">${icon('close', 11)}</span>
          <span class="cam">${icon('camera', 19)}</span>
        </div>
        <button class="search-sub" id="rSub">${icon('star', 19)}订阅</button>
      </div>

      <div class="r-tabs">
        <a class="${tabCls('all')}" data-tab="all" href="javascript:void 0">全部</a>
        <a class="${tabCls('personal')}" data-tab="personal" href="javascript:void 0">个人闲置</a>
        <a class="${tabCls('users')}" data-tab="users" href="javascript:void 0">用户</a>
      </div>

      <div class="sortbar">
        <a class="${sort === '' ? 'on' : ''}" data-sort="" href="javascript:void 0">综合 ${icon('down', 13)}</a>
        <a class="${sort === 'price_asc' || sort === 'price_desc' ? 'on' : ''}" data-sort="price" href="javascript:void 0">价格 ${icon('sortPrice', 13)}</a>
        <a class="${sort === 'drop' ? 'on' : ''}" data-sort="drop" href="javascript:void 0">降价</a>
        <a class="${sort === 'new' ? 'on' : ''}" data-sort="new" href="javascript:void 0">新发</a>
        <a data-sort="area" href="javascript:void 0">区域 ${icon('down', 13)}</a>
        <a class="flt" id="rFilter" href="javascript:void 0">${icon('filter', 14)}筛选</a>
      </div>

      <div class="r-chips">
        <span class="chip">${icon('user', 14)}个人闲置</span>
        <span class="chip" id="chipCond">成色 ${icon('down', 12)}</span>
        <span class="chip" id="chipCat">分类 ${icon('down', 12)}</span>
        ${filter.tradeMode ? '<span class="chip on">只看以物换物</span>' : ''}
        ${filter.meet ? '<span class="chip on">只看可面交</span>' : ''}
      </div>

      ${conditions.length ? `<div class="r-chips" aria-label="已识别搜索条件">${conditions.map(label => `<span class="chip on">${esc(label)}</span>`).join('')}</div>` : ''}
      ${!list.length && conditions.length ? '<p class="r-chips">没有商品同时满足这些条件，可修改搜索词放宽条件。</p>' : ''}
      ${bodyHtml}`;

      view.querySelectorAll('[data-tab]').forEach((a) => a.addEventListener('click', () => {
        window.__searchTab = a.dataset.tab; renderRoute();
      }));
      view.querySelectorAll('[data-sort]').forEach((a) => a.addEventListener('click', () => {
        const k = a.dataset.sort;
        if (k === 'area') {
          openSheet('选区域', `<div class="pe-chips">${['缤果大街', '紫荆 3 号楼', '紫荆 5 号楼', '图书馆', '体育馆']
            .map((x) => `<span class="chip">${x}</span>`).join('')}</div>`, {
            onMount(sheet, close) {
              sheet.querySelectorAll('.chip').forEach((c) => c.addEventListener('click', () => {
                close(); window.__searchFilter = { ...filter, area: c.textContent.trim() }; renderRoute();
              }));
            },
          });
          return;
        }
        if (k === 'price') window.__searchSort = window.__searchSort === 'price_asc' ? 'price_desc' : 'price_asc';
        else window.__searchSort = k;
        renderRoute();
      }));

      document.getElementById('rClear').addEventListener('click', () => { document.getElementById('rInput').value = ''; });
      document.getElementById('rInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') location.hash = '#/search/' + encodeURIComponent(e.target.value.trim());
      });
      document.getElementById('rSub').addEventListener('click', () => {
        const subs = JSON.parse(localStorage.getItem('searchSubs') || '[]');
        if (subs.indexOf(kw) < 0) subs.push(kw);
        localStorage.setItem('searchSubs', JSON.stringify(subs));
        toast('已订阅「' + kw + '」，有新上架会通知你');
      });
      document.getElementById('rFilter').addEventListener('click', () => {
        openSheet('筛选', `
          <div class="label">分类</div>
          <div class="pe-chips" id="fCat">${['教材', '数码', '运动', '生活', '衣物', '其他']
            .map((c) => `<span class="chip${filter.category === c ? ' on' : ''}" data-v="${c}">${c}</span>`).join('')}</div>
          <div class="label" style="margin-top:16px">成色</div>
          <div class="pe-chips" id="fCond">${['全新', '九成新', '七成新', '有使用痕迹']
            .map((c) => `<span class="chip${filter.condition === c ? ' on' : ''}" data-v="${c}">${c}</span>`).join('')}</div>
          <div class="label" style="margin-top:16px">交易</div>
          <div class="pe-chips" id="fTrade"><span class="chip${filter.tradeMode ? ' on' : ''}" data-v="2">只看以物换物</span><span class="chip${filter.meet ? ' on' : ''}" data-v="meet">只看可面交</span></div>
          <button class="btn btn--block" style="margin-top:22px" id="fGo">应用筛选</button>`, {
          onMount(sheet, close) {
            ['fCat', 'fCond'].forEach((id) => {
              sheet.querySelectorAll('#' + id + ' .chip').forEach((c) => c.addEventListener('click', () => {
                const on = c.classList.contains('on');
                sheet.querySelectorAll('#' + id + ' .chip').forEach((x) => x.classList.remove('on'));
                if (!on) c.classList.add('on');
              }));
            });
            sheet.querySelectorAll('#fTrade .chip').forEach((c) => c.addEventListener('click', () => c.classList.toggle('on')));
            sheet.querySelector('#fGo').addEventListener('click', () => {
              const cat = sheet.querySelector('#fCat .chip.on');
              const cond = sheet.querySelector('#fCond .chip.on');
              const trade = sheet.querySelector('#fTrade .chip.on');
              window.__searchFilter = {
                category: cat ? cat.dataset.v : '',
                condition: cond ? cond.dataset.v : '',
                area: filter.area,
                tradeMode: trade && trade.dataset.v === '2' ? 2 : null,
                meet: trade && trade.dataset.v === 'meet' ? true : null,
              };
              close(); renderRoute();
            });
          },
        });
      });
    },
  };

  window.PAGES = PAGES;
})();
