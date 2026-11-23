import { reportSheet } from "../../components/mobile/report.js";

const PAGES = window.PAGES;

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
    if (route === location.hash) view.__notices = notifs;
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
      (!c.pinned && now - t > 30 * 86400 * 1000 ? older : recent).push(c);
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
            <img class="conv__pic" src="${esc(window.catalogThumbnail(api.firstPic({ images: c.images })))}" alt="" loading="lazy" decoding="async">
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
              const results = await Promise.allSettled(read.map(c => api.del('/api/conversation/' + c.id)));
              const failed = results.filter(result => result.status === 'rejected').length;
              toast(failed ? `已清理 ${read.length - failed} 个，${failed} 个未删除，请重试` : '已清理');
              if (location.hash === route) renderRoute();
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
          conv.style.transform = `translateX(${Math.max(-168, dx)}px)`;
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
      wrap.addEventListener('touchcancel', () => {
        swiping = false;
        conv.style.transition = '';
        conv.style.transform = '';
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
                try {
                  await api.del('/api/conversation/' + cid);
                  toast('已删除会话');
                  if (location.hash === route) {
                    wrap.remove();
                    renderRoute();
                  }
                } catch (err) {
                  toast(err.message || '删除失败，请重试');
                }
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
    const meetingReady = Boolean(order?.confirmedArrangement || order?.confirmedArrangementId);
    const price = api.yuan(item.price);
    const svc = isService(conv);
    const primaryText = order && order.status === 3 ? '去评价'
      : order && order.status === 2 ? (meetingReady ? '查看收货安排' : '安排面交')
      : order && order.status === 1 ? '确认交换'
      : item.status === 3 ? '去评价'
      : item.tradeMode === 2 ? '发起交换' : '去看看';
    const orderStateText = order
      ? (order.status === 3 ? '交易成功' : order.status === 2 ? '交换中' : order.status === 1 ? '待确认' : order.statusText)
      : conv.itemStatusText;

    view.innerHTML = `
      <div class="chat-page">
        <div class="chat-head">
          <button class="topbar__back" aria-label="返回" onclick="smartBack('#/messages')">${icon('back', 22)}</button>
          <div class="chat-head__main">
            <div class="chat-head__name">
              ${esc(conv.peer)}
              ${!svc && conv.peerSellerCredit != null ? `<span class="badge">卖家信用${creditLevel(conv.peerSellerCredit)}</span>` : ''}
              ${svc ? '<span class="badge badge--gray">服务号</span>' : ''}
            </div>
            <div class="chat-head__sub">${esc(item.title || (svc ? '官方服务账号' : '校园同学'))}</div>
          </div>
          <button id="chatMore" aria-label="会话选项">${icon('more', 22)}</button>
        </div>

        <div class="chat-thread" id="chatThread">
        <div class="chat-item" id="chatItem">
          <img class="chat-item__pic" src="${esc(window.catalogThumbnail(api.firstPic(item)))}" alt="" decoding="async">
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

        ${order && order.status === 2 && meetingReady ? `
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

        <div class="chat-proposal" hidden></div>
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

    const proposal = view.querySelector('.chat-proposal');
    let currentProposal;
    function updateProposal(next) {
        if (!proposal.isConnected) return;
        if (!next) { proposal.hidden = true; return; }
        if (currentProposal?.id === next.id && currentProposal.status === next.status && proposal.dataset.state === String(next.expireTime ? new Date(next.expireTime).getTime() > Date.now() : true)) return;
        proposal.dataset.state = String(next.expireTime ? new Date(next.expireTime).getTime() > Date.now() : true);
        currentProposal = next;
        const incoming = Number(next.toUser) === Number(myId);
        const pending = Number(next.status) === 0 && (!next.expireTime || new Date(next.expireTime).getTime() > Date.now());
        const status = pending ? (incoming ? '等你回应' : '等对方回应')
          : ['已过期','已接受','已拒绝','已过期','已撤回','已被新提案替代'][Number(next.status)] || '已处理';
        proposal.hidden = false;
        proposal.innerHTML = `<header><b>${next.amountCents ? '面交出价' : next.parentId ? '换物反提案' : '换物提案'}</b><span>${status}</span></header>
            ${next.amountCents
            ? `<p>${esc(next.targetTitle || item.title)} | 面交价 ¥${api.yuan(next.amountCents)}</p>`
            : `<p>你给：${esc((incoming ? next.targetTitle : next.myTitle) || '物品')}</p>
                 <p>你收：${esc((incoming ? next.myTitle : next.targetTitle) || '物品')}</p>`}
            ${next.message ? `<p>${esc(next.message)}</p>` : ''}
            ${pending ? (incoming ? '<button data-proposal-action="reject">拒绝</button><button data-proposal-action="counter">修改提案</button><button data-proposal-action="accept">接受</button>' : '<button data-proposal-action="cancel">撤回</button>') : ''}
            <button type="button" data-proposal-action="history">查看历史</button>
            ${next.exchangeId ? `<a href="#/exchange/${Number(next.exchangeId)}">查看交换单</a>` : ''}
            <a href="#/offers">全部提案</a>`;
    }
    const refreshProposal = async () => {
      try {
        const latest = await api.get('/api/conversation/' + conv.id);
        updateProposal(latest.offer);
      } catch (error) { /* The current proposal stays visible on a connection failure. */ }
    };
    proposal.addEventListener('click', async event => {
      const button = event.target.closest('[data-proposal-action]');
      const offer = currentProposal;
      if (!button || !offer || button.disabled) return;
      const action = button.dataset.proposalAction;
      const submit = async () => {
        if (button.disabled) return;
        button.disabled = true;
        try {
          const result = await api.post('/api/offer/handle',{offerId:offer.id,action});
          if (action === 'accept' && result?.exchangeId) location.hash = '#/exchange/' + Number(result.exchangeId);
          else refreshProposal();
        } catch (error) { toast(error.message); refreshProposal(); }
        finally { button.disabled = false; }
      };
      if (action === 'history') {
        try {
          const chain = await api.get('/api/offer/' + offer.id + '/history');
          openSheet('提案协商历史', (chain || []).map(n => `
              <div style="padding:10px 12px;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:8px;background:${n.isLatest ? '#f4faf8' : '#fff'}">
                <div style="display:flex;justify-content:space-between;font-size:12px;color:#475569"><b>${esc(n.label)}（${esc(n.fromNickname || '同学')} → ${esc(n.toNickname || '同学')}）</b><span>${esc(n.statusText || '')}</span></div>
                ${n.diffSummary ? `<div style="margin-top:4px;font-size:12px;color:#0c7263;font-weight:700">${esc(n.diffSummary)}</div>` : ''}
                <div style="margin-top:5px;font-size:13px">${n.amountCents ? '面交价 ¥' + api.yuan(n.amountCents) : `用「<b>${esc(n.myTitle || '物品')}</b>」换「<b>${esc(n.targetTitle || '物品')}</b>」`}</div>
                ${n.message ? `<div style="margin-top:3px;font-size:12px;color:#64748b">${esc(n.message)}</div>` : ''}
              </div>`).join('') || '<div class="empty">暂无历史记录</div>');
        } catch (error) { toast(error.message); }
      } else if (action === 'counter') {
        if (offer.amountCents) {
          window.openCashProposal({title:'修改面交出价', description:offer.targetTitle, initial:offer.amountCents,
            async onSend(amountCents) {
              await api.post('/api/offer/handle', {offerId:offer.id, action:'counter', amountCents});
              await refreshProposal();
            }});
          return;
        }
        try {
          const mine = (await api.get('/api/item/mine') || []).filter(row => row.status === 1 && !row.isDemo);
          if (!proposal.isConnected) return;
          if (!mine.length) { toast('请先发布一件在架物品'); return; }
          window.openTradeProposal({title:'修改提案',receive:{title:offer.myTitle,images:''},items:mine,sendLabel:'发送反提案',
            async onSend(myItemId) {
              await api.post('/api/offer/handle',{offerId:offer.id,action:'counter',myItemId});
              refreshProposal();
            }});
        } catch (error) { toast(error.message); }
      } else if (action === 'accept') {
        const decision = offer.amountCents ? '确认按 ¥' + api.yuan(offer.amountCents) + ' 校园面交？验货后现场结算。'
          : '确认用「' + offer.targetTitle + '」换「' + offer.myTitle + '」？接受后物品将锁定。';
        confirmSheet('接受这版提案',esc(decision),'接受并查看交换单',submit);
      } else submit();
    });
    updateProposal(conv.offer);

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
      if (card) { location.hash = '#/exchange/' + card.dataset.ex; return; }
      const itemCard = e.target.closest('[data-item]');
      if (itemCard && Number(itemCard.dataset.item) > 0) { location.hash = '#/item/' + itemCard.dataset.item; return; }
      const copyBtn = e.target.closest('[data-copy]');
      if (copyBtn) {
        const val = copyBtn.dataset.copy || '';
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(val).then(() => toast('已复制：' + val)).catch(() => toast(val));
        } else { toast('地点：' + val); }
        return;
      }
      const mapBtn = e.target.closest('[data-map]');
      if (mapBtn) {
        const loc = mapBtn.dataset.map || '校内公共点位';
        openSheet('校内面交点位', `<div style="padding:4px 0 8px;line-height:1.7">
            <p style="font-size:16px;font-weight:700;color:var(--ink-900)">${esc(loc)}</p>
            <p style="margin-top:8px;color:var(--ink-500);font-size:13px">重庆移通学院校内公共面交点位建议在白天或人流较多时段碰面，当面验货后再确认交付。</p>
            <button class="btn btn--block" style="margin-top:16px" id="locCopyGo">复制地点名称</button>
          </div>`, {
          onMount(sheet, close) {
            sheet.querySelector('#locCopyGo').addEventListener('click', () => {
              if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(loc).catch(() => {});
              toast('已复制：' + loc);
              close();
            });
          },
        });
      }
    });

    function renderMessage(m, mineId, peerObj, meObj) {
      const mine = m.senderId === mineId;
      const peerAv = `<span onclick="event.stopPropagation();location.hash='#/user/${peerObj.id}'">${avatar(peerObj, 36)}</span>`;
      const card = (html) => mine
        ? `<div class="bubble-row bubble-row--me">${avatar(meObj || '我', 36)}<div class="bubble-wrap">${html}</div></div>`
        : `<div class="bubble-row">${peerAv}<div class="bubble-wrap">${html}</div></div>`;
      if (m.kind === 'image') {
        const imgUrl = safeMediaUrl(m.image, 'assets/brand/placeholder.png');
        return card(`<img src="${esc(imgUrl)}" style="max-width:210px;border-radius:12px" alt="">`);
      }
      if (m.kind === 'voice') {
        const audioUrl = safeMediaUrl(m.image);
        return card(`<div class="bubble" style="padding:8px 12px">${audioUrl ? `<audio controls src="${esc(audioUrl)}" style="height:32px;max-width:200px"></audio>` : '语音消息暂不可播放'}</div>`);
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
      if (m.kind === 'location') {
        let ex = {};
        try { ex = JSON.parse(m.extra || '{}'); } catch (e) { /* 忽略 */ }
        const locName = ex.place || m.content || '校内公共点位';
        return `<div class="meet-card">
            <div class="hd">${icon('location', 16)}校内位置</div>
            <div class="main">${esc(locName)}</div>
            <div class="sub">${esc(ex.note || '重庆移通学院 · 校内面交参考位置')}</div>
            <div class="acts">
              <button data-copy="${esc(locName)}">复制地点</button>
              <button data-map="${esc(locName)}">看看位置</button>
            </div>
          </div>`;
      }
      if (m.kind === 'card') {
        let ex = {};
        try { ex = JSON.parse(m.extra || '{}'); } catch (e) { /* 忽略 */ }
        if (!ex.title) return card(`<div class="bubble">${esc(m.content)}</div>`);
        const cardPic = safeMediaUrl(ex.image || api.firstPic({ images: ex.images }), 'assets/brand/placeholder.png');
        return card(`<div class="bubble" data-item="${Number(ex.itemId || 0)}" style="padding:9px;width:220px;cursor:pointer">
            <img src="${esc(cardPic)}" style="width:100%;height:130px;object-fit:cover;border-radius:8px" alt="">
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
        const result = await api.get('/api/conversation/' + conv.id);
        if (!body.isConnected) return;
        updateProposal(result.offer);
        const updates = (result.messages || []).filter(m => Number(m.id) > latestId);
        if (!updates.length) return;
        const nearEnd = thread.scrollHeight - thread.scrollTop - thread.clientHeight < 140;
        body.insertAdjacentHTML('beforeend', updates.map(m => renderMessage(m, myId, peer, me)).join(''));
        latestId = Number(updates.at(-1).id);
        if (force || nearEnd) scrollToLatest();
      } catch (e) { /* Keep the current messages while the connection is unavailable. */ }
      finally { refreshing = false; }
    }
    const chatTimer = setInterval(() => refreshMessages(), 5000);
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
            input.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0;width:1px;height:1px';
            chatPage.append(input);
            input.addEventListener('change', () => {
              const file = input.files && input.files[0];
              input.remove();
              if (file) { toast('正在发送图片...'); uploadAndSend(file); }
            }, {once: true});
            input.addEventListener('cancel', () => input.remove(), {once: true});
            input.click();
          } else if (k === '发送位置') {
            const spots = ['图书馆门口', '缤果大街', '北山书院大厅', '紫荆 3 号楼', '紫荆 5 号楼', '紫藤 2 号楼', '体育馆', '行政楼'];
            openSheet('发送校内位置', `<div class="label">选择校内常用点位</div>
                <div class="pe-chips" id="locPlaces">${spots.map((p, i) => `<span class="chip${i === 0 ? ' on' : ''}" data-v="${p}">${p}</span>`).join('')}</div>
                <div class="label" style="margin-top:14px">补充位置说明（选填）</div>
                <input id="locCustom" style="width:100%;height:40px;padding:0 12px;border:1px solid var(--line);border-radius:10px;box-sizing:border-box" maxlength="60" placeholder="例如 一楼东侧大厅或台阶旁">
                <button class="btn btn--block" style="margin-top:18px" id="locSendGo">发送位置</button>`, {
              onMount(sheet, close) {
                sheet.querySelectorAll('#locPlaces .chip').forEach((c) => c.addEventListener('click', () => {
                  sheet.querySelectorAll('#locPlaces .chip').forEach((x) => x.classList.remove('on'));
                  c.classList.add('on');
                }));
                sheet.querySelector('#locSendGo').addEventListener('click', () => {
                  const place = sheet.querySelector('#locPlaces .chip.on').dataset.v;
                  const note = (sheet.querySelector('#locCustom')?.value || '').trim();
                  close();
                  send('校内位置：' + place + (note ? '（' + note + '）' : ''), 'location', '', JSON.stringify({ place, note: note || '重庆移通学院 · 校内当面交接点位' }));
                });
              },
            });
          } else if (k === '约面交') {
            openSheet('约个面交', `<div class="label">地点</div>
                <div class="pe-chips" id="meetPlaces">${['图书馆门口', '缤果大街', '紫荆 3 号楼', '紫荆 5 号楼', '体育馆']
                .map((p, i) => `<span class="chip${i === 0 ? ' on' : ''}" data-v="${p}">${p}</span>`).join('')}</div>
                <div class="label" style="margin-top:14px">时间</div>
                <div class="pe-chips" id="meetTimes">${['今天 18:30', '明天 12:30', '明天 18:30', '周末 10:00']
                .map((p, i) => `<span class="chip${i === 1 ? ' on' : ''}" data-v="${p}">${p}</span>`).join('')}</div>
                <input id="meetCustomPlace" style="width:100%;height:38px;margin-top:12px;padding:0 12px;border:1px solid var(--line);border-radius:10px;box-sizing:border-box" maxlength="40" placeholder="或输入自定义校内地点（选填）">
                <button class="btn btn--block" style="margin-top:18px" id="meetGo">发送面交约定</button>`, {
              onMount(sheet, close) {
                ['meetPlaces', 'meetTimes'].forEach((id) => {
                  sheet.querySelectorAll('#' + id + ' .chip').forEach((c) => c.addEventListener('click', () => {
                    sheet.querySelectorAll('#' + id + ' .chip').forEach((x) => x.classList.remove('on'));
                    c.classList.add('on');
                  }));
                });
                sheet.querySelector('#meetGo').addEventListener('click', () => {
                  const custom = (sheet.querySelector('#meetCustomPlace')?.value || '').trim();
                  const place = custom || sheet.querySelector('#meetPlaces .chip.on').dataset.v;
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
                    <img src="${esc(window.catalogThumbnail(api.firstPic(i)))}" alt="" loading="lazy" decoding="async">
                    <div class="main"><b>${esc(i.title)}</b><p>${api.yuan(i.price) ? '¥' + api.yuan(i.price) : '想换'}</p></div>
                    ${icon('right', 16)}
                  </div>`).join('') : '<div class="empty">你还没有在架的宝贝<div style="margin-top:14px"><a class="btn" href="#/publish/edit/idle">去发布一件</a></div></div>', {
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
            const startProposal = async (targetItem) => {
              const list = await api.get('/api/item/mine');
              const mine = (list || []).filter(i => i.status === 1 && !i.isDemo && i.id !== targetItem.id);
              if (!mine.length) { toast('请先发布一件在架物品'); return; }
              window.openTradeProposal({title:'提案交换', receive:targetItem, items:mine, sendLabel:'发出提案', note:true,
                async onSend(myItemId,message) {
                  await api.post('/api/offer', {itemId:targetItem.id,myItemId,message});
                  toast('提案已发出');
                  refreshProposal();
                }});
            };
            if (item && item.id) {
              startProposal(item).catch(e => toast(e.message));
            } else {
              api.get('/api/user/' + peer.id).then((u) => {
                const peerItems = (u && u.items || []).filter(i => i.status === 1);
                if (!peerItems.length) { toast('对方暂无在架的可交换物品'); return; }
                if (peerItems.length === 1) { startProposal(peerItems[0]).catch(e => toast(e.message)); return; }
                openSheet('选择想换对方的哪件物品', peerItems.map((i) => `
                    <div class="list-block" data-peer-item="${i.id}" style="margin:0 -18px;padding-left:18px;padding-right:18px">
                      <img src="${esc(window.catalogThumbnail(api.firstPic(i)))}" alt="" loading="lazy" decoding="async">
                      <div class="main"><b>${esc(i.title)}</b><p>${api.yuan(i.price) ? '¥' + api.yuan(i.price) : '以物换物'}</p></div>
                      ${icon('right', 16)}
                    </div>`).join(''), {
                  onMount(sheet, close) {
                    sheet.querySelectorAll('[data-peer-item]').forEach((row) => row.addEventListener('click', () => {
                      const picked = peerItems.find(x => String(x.id) === row.dataset.peerItem);
                      close();
                      if (picked) startProposal(picked).catch(e => toast(e.message));
                    }));
                  },
                });
              }).catch(e => toast(e.message));
            }
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
      if (order && order.status === 2) { location.hash = '#/exchange/' + Number(order.exchangeId || order.id); return; }
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
    if (confirmBtn) confirmBtn.addEventListener('click', () => confirmSheet(
      '确认已收到物品', '请先核对物品。双方均确认后，这笔交易将完成，不能撤回。', '已收到并验货', confirmReceipt));
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
