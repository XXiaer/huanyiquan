/* 通用 UI：toast、弹层、头像、商品卡、瀑布流、底部导航、格式化 */
(function () {
  /* ------------------------------------------------------------- toast */
  let toastTimer = null;
  window.toast = function (msg, ms) {
    let host = document.getElementById('toastHost');
    if (!host) { host = document.createElement('div'); host.id = 'toastHost'; document.body.appendChild(host); }
    host.innerHTML = `<div class="toast">${msg}</div>`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { host.innerHTML = ''; }, ms || 1800);
  };

  /* ------------------------------------------------------------- 弹层 */
  window.openSheet = function (title, bodyHtml, opts) {
    const host = document.getElementById('sheetHost');
    const o = opts || {};
    host.innerHTML = `
      <div class="sheet-mask">
        <div class="sheet">
          <div class="sheet__head">
            <h3>${title}</h3>
            <button data-close>${o.closeText || '取消'}</button>
          </div>
          <div class="sheet__body">${bodyHtml}</div>
        </div>
      </div>`;
    const mask = host.querySelector('.sheet-mask');
    const close = () => { host.innerHTML = ''; };
    mask.addEventListener('click', (e) => { if (e.target === mask) close(); });
    host.querySelector('[data-close]').addEventListener('click', close);
    if (o.onMount) o.onMount(host.querySelector('.sheet'), close);
    return close;
  };

  window.confirmSheet = function (title, text, okText, onOk) {
    openSheet(title, `<p style="font-size:15px;line-height:1.7;color:var(--ink-700);margin:2px 0 22px">${text}</p>
      <div style="display:flex;gap:10px"><button class="btn btn--ghost" style="flex:1" data-no>取消</button>
      <button class="btn" style="flex:1" data-yes>${okText || '确定'}</button></div>`, {
      onMount(sheet, close) {
        sheet.querySelector('[data-no]').addEventListener('click', close);
        sheet.querySelector('[data-yes]').addEventListener('click', () => { close(); onOk && onOk(); });
      },
    });
  };

  window.successSheet = function (title, text, action) {
    openSheet(title, `<div style="text-align:center;padding:14px 6px 6px">
      <img src="assets/brand/mascot-wave-complete.png" style="width:140px;margin:0 auto 14px" alt="">
      <div style="font-size:19px;font-weight:800">${title}</div>
      <p style="font-size:13px;color:var(--ink-500);line-height:1.65;margin-top:8px">${text}</p>
      ${action ? `<button class="btn btn--block" style="margin-top:18px" data-act>${action.text}</button>` : ''}
    </div>`, {
      closeText: '关闭',
      onMount(sheet, close) {
        const b = sheet.querySelector('[data-act]');
        if (b) b.addEventListener('click', () => { close(); action.onClick && action.onClick(); });
      },
    });
  };

  /* ------------------------------------------------------------- 头像 */
  const AV_COLORS = ['#CFE3D9', '#E8D5C4', '#D6DCF0', '#F0DCD2', '#DDE6D0', '#EAD9E4', '#D9E7EC'];
  window.avatar = function (user, size, cls) {
    const s = size || 36;
    const name = typeof user === 'string' ? user : (user && (user.nickname || user.peer || user.name)) || '同';
    const id = typeof user === 'object' && user ? (user.id || user.peerId || 0) : 0;
    const src = typeof user === 'object' && user ? (user.avatar || user.peerAvatar || user.fromAvatar || '') : '';
    if (src) {
      return `<img class="avt ${cls || ''}" style="width:${s}px;height:${s}px" src="${src}" alt="">`;
    }
    const ch = String(name).trim().slice(0, 1) || '同';
    const c = AV_COLORS[Math.abs(Number(id) || name.length) % AV_COLORS.length];
    return `<span class="avt ${cls || ''}" style="width:${s}px;height:${s}px;background:${c};font-size:${Math.round(s * 0.42)}px">${ch}</span>`;
  };

  /* ------------------------------------------------------------- 时间 */
  window.fmtTime = function (iso) {
    if (!iso) return '';
    const d = new Date(String(iso).replace('T', ' ').replace(/-/g, '/'));
    if (isNaN(d)) return '';
    const now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 60) return '刚刚';
    if (diff < 3600) return Math.floor(diff / 60) + '分钟前';
    if (diff < 86400 && d.getDate() === now.getDate()) return Math.floor(diff / 3600) + '小时前';
    const pad = (n) => String(n).padStart(2, '0');
    if (d.getFullYear() === now.getFullYear()) return pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  };

  window.fmtTimeShort = function (iso) {
    if (!iso) return '';
    const d = new Date(String(iso).replace('T', ' ').replace(/-/g, '/'));
    if (isNaN(d)) return '';
    const now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 3600) return Math.max(1, Math.floor(diff / 60)) + '分钟前';
    if (d.getDate() === now.getDate()) return Math.floor(diff / 3600) + '小时前';
    if (diff < 86400 * 2) return '昨天';
    return (d.getMonth() + 1) + '月' + d.getDate() + '日';
  };

  window.fmtMonth = function (iso) {
    if (!iso) return '';
    const d = new Date(String(iso).replace('T', ' ').replace(/-/g, '/'));
    if (isNaN(d)) return '';
    return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日';
  };

  /* ------------------------------------------------------------- 信用 */
  window.creditLevel = function (credit) {
    const c = Number(credit) || 0;
    if (c >= 90) return '极好';
    if (c >= 80) return '优秀';
    if (c >= 70) return '良好';
    if (c >= 60) return '一般';
    return '受限';
  };
  window.creditLabel = function (credit) {
    const c = Number(credit) || 0;
    if (c >= 60) return { text: '卖家信用' + creditLevel(c), cls: 'badge--orange' };
    return null;
  };
  window.displayCredit = function (u) {
    if (!u) return 0;
    return u.displayCredit || (600 + (Number(u.credit) || 0));
  };

  /* ------------------------------------------------------------- 热度 */
  const HEAT = {
    教材: '开学季都在找',
    数码: '数码党都在看',
    运动: '运动族都在看',
    生活: '宿舍刚需好物',
    衣物: '换季正当时',
    绿植: '给宿舍添点绿',
    其他: '同校同学在看',
  };
  window.heatText = (item) => HEAT[item.category] || '同校同学在看';

  /* ------------------------------------------------------------- 拍卖剩余 */
  window.remainText = function (endsAt) {
    if (!endsAt) return '';
    const d = new Date(String(endsAt).replace('T', ' ').replace(/-/g, '/'));
    if (isNaN(d)) return '';
    let s = Math.max(0, Math.floor((d - new Date()) / 1000));
    if (s <= 0) return '已结束';
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h >= 24) return Math.floor(h / 24) + '天' + (h % 24) + '小时';
    if (h > 0) return h + '小时' + m + '分';
    return m + '分钟';
  };

  /* ------------------------------------------------------------- 商品卡 */
  window.itemCard = function (item) {
    const pic = window.catalogThumbnail(api.firstPic(item));
    const price = api.yuan(item.price);
    const credit = creditLabel(item.ownerSellerCredit || item.ownerCredit);
    const want = (item.offerCount || 0) + '人想要';
    const sold = item.status === 3;
    const shownPrice = item.tradeMode === 3 && item.auctionCurrentPrice
      ? item.auctionCurrentPrice : item.price;
    const priceText = item.isDemo && !window.campusExchange.supports(item,1) ? '' : api.yuan(shownPrice);
    let tag = '';
    if (item.isDemo) {
      tag = `<span class="card__tag card__tag--swap">${window.campusExchange.demoLabel(item)}</span>`;
    } else if (item.tradeMode === 2) {
      tag = `<span class="card__tag card__tag--swap">${icon('swapRing', 12)}以物换物</span>`;
    } else if (item.tradeMode === 3) {
      tag = `<span class="card__tag card__tag--auction">${icon('auction', 12)}拍卖中${item.auctionEndsAt ? ' | ' + remainText(item.auctionEndsAt) : ''}</span>`;
    }
    const swapWant = window.campusExchange.supports(item,2) && (item.wantText || item.expectDesc)
      ? `<p class="card__want">想换：${esc(String(item.wantText || item.expectDesc).replace(/^想换[:：]?/, ''))}</p>` : '';
    return `
      <a class="card" href="#/item/${item.id}">
        <div class="card__pic">
          <img src="${esc(pic)}" alt="" loading="lazy" decoding="async">
          ${tag}
          ${sold ? `<span class="card__seal"><b>已换出</b><em>SWAPPED</em></span>` : ''}
        </div>
        <div class="card__body">
          <h3 class="card__title">${displayItemTitle(item)}</h3>
          <p class="card__heat">${item.isDemo ? (priceText ? '官网参考价' : '仅供浏览') : heatText(item)}</p>
          ${swapWant}
          <div class="card__price">
            ${priceText ? `<span class="price"><em>¥</em><b>${priceText}</b></span>` : `<span class="price"><b>想换</b></span>`}
            ${priceText && item.originalPrice && item.originalPrice > item.price ? `<s>¥${api.yuan(item.originalPrice)}</s>` : ''}
            <span class="card__wantnum">${item.tradeMode === 3 ? (item.auctionBidCount || 0) + ' 次出价' : want}</span>
          </div>
          <div class="card__seller">
            <span onclick="event.preventDefault();event.stopPropagation();location.hash='#/user/${item.ownerId}'">${avatar({ nickname: item.ownerNickname, id: item.ownerId, avatar: item.ownerAvatar }, 18)}</span>
            <span class="name">${esc(item.ownerNickname || '同学')}</span>
            ${credit ? `<span class="badge ${credit.cls}">${credit.text}</span>` : ''}
          </div>
        </div>
      </a>`;
  };

  /* 搜索结果卡：补充成色/品牌、降价、服务与属地 */
  window.resultCard = function (item) {
    const pic = window.catalogThumbnail(api.firstPic(item));
    const price = api.yuan(item.price);
    const credit = creditLabel(item.ownerSellerCredit || item.ownerCredit);
    const sold = item.status === 3;
    const drop = item.originalPrice && item.price && item.originalPrice > item.price
      ? Math.round((item.originalPrice - item.price) / 100) : 0;
    let tag = '';
    if (item.tradeMode === 2) tag = `<span class="card__tag card__tag--swap">${icon('swapRing', 12)}以物换物</span>`;
    else if (item.tradeMode === 3) tag = `<span class="card__tag card__tag--auction">${icon('auction', 12)}拍卖中</span>`;
    return `
      <a class="card" href="#/item/${item.id}">
        <div class="card__pic">
          <img src="${esc(pic)}" alt="" loading="lazy" decoding="async">
          ${tag}
          ${sold ? `<span class="card__seal"><b>已换出</b><em>SWAPPED</em></span>` : ''}
        </div>
        <div class="card__body">
          <h3 class="card__title">${displayItemTitle(item)}</h3>
          <p class="card__meta">${esc(item.conditionLevel)}${item.brand ? ' | ' + esc(item.brand) : ''}</p>
          <div class="card__price">
            ${price ? `<span class="price"><em>¥</em><b>${price}</b></span>` : `<span class="price"><b>想换</b></span>`}
            ${item.originalPrice && item.originalPrice > item.price ? `<s>¥${api.yuan(item.originalPrice)}</s>` : ''}
            ${drop ? `<span class="card__drop">已降 ${drop} 元</span>` : ''}
          </div>
          <div class="card__services">
            ${item.allowBargain === false ? '' : '<span>可小刀</span>'}
            ${(item.delivery || '仅面交') === '仅面交' ? '<span>同校面交</span>' : '<span>校内可送</span>'}
            <span>先验货再确认</span>
          </div>
          <div class="card__seller">
            <span onclick="event.preventDefault();event.stopPropagation();location.hash='#/user/${item.ownerId}'">${avatar({ nickname: item.ownerNickname, id: item.ownerId, avatar: item.ownerAvatar }, 18)}</span>
            <span class="name">${esc(item.ownerNickname || '同学')}</span>
            <span class="badge badge--gray">${esc(item.ownerBuilding || '校内')}</span>
            ${credit ? `<span class="badge ${credit.cls}">${credit.text}</span>` : ''}
          </div>
        </div>
      </a>`;
  };

  window.waterfallWith = function (items, render) {
    const cols = [[], []];
    const heights = [0, 0];
    items.forEach((it) => {
      const i = heights[0] <= heights[1] ? 0 : 1;
      cols[i].push(it);
      heights[i] += 340 + (String(it.title || '').length > 12 ? 30 : 0);
    });
    return `<div class="feed">
      <div class="feed__col">${cols[0].map(render).join('')}</div>
      <div class="feed__col">${cols[1].map(render).join('')}</div>
    </div>`;
  };

  /* 双列瀑布流 */
  window.waterfall = function (items) {
    const cols = [[], []];
    const heights = [0, 0];
    items.forEach((it) => {
      const i = heights[0] <= heights[1] ? 0 : 1;
      cols[i].push(it);
      heights[i] += 290 + (String(it.title || '').length > 12 ? 34 : 0);
    });
    return `<div class="feed">
      <div class="feed__col">${cols[0].map(itemCard).join('')}</div>
      <div class="feed__col">${cols[1].map(itemCard).join('')}</div>
    </div>`;
  };

  window.displayItemTitle = function (item) {
    return esc(item.isDemo ? String(item.title || '').replace(/\s*[·•・]\s*/g, ' ') : item.title);
  };

  window.esc = function (s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  };

  window.mascotEmpty = function (text, src, action) {
    return `<div class="empty">
      <div class="mascot-slot"><img src="${src || 'assets/brand/mascot-wave-complete.png'}" alt=""></div>
      <p>${text}</p>
      ${action ? `<a class="btn btn--ghost btn--sm" href="${action.href}">${action.text}</a>` : ''}
    </div>`;
  };

  /* ------------------------------------------------------------- 底部导航 */
  const NAV = [
    { key: 'home', label: '首页', icon: 'home', iconOn: 'homeFill', href: '#/home' },
    { key: 'auction', label: '拍卖', icon: 'auction', href: '#/auction' },
    { key: 'publish', label: '发布', icon: 'publish', href: '#/publish', center: true },
    { key: 'message', label: '消息', icon: 'message', iconOn: 'messageFill', href: '#/messages', badge: true },
    { key: 'me', label: '我的', icon: 'me', iconOn: 'meFill', href: '#/me' },
  ];

  window.renderTabbar = function (active, unread) {
    const bar = document.getElementById('tabbar');
    if (!bar) return;
    if (active === false) { bar.style.display = 'none'; bar.innerHTML = ''; return; }
    bar.style.display = 'flex';
    bar.innerHTML = NAV.map((n) => {
      if (n.center) {
        return `<div class="tabbar__publish">
          <button data-href="${n.href}" aria-label="发布">
            ${icon('publish', 26)}<em>${n.label}</em>
          </button>
        </div>`;
      }
      const on = active === n.key;
      const badge = n.badge && unread
        ? `<i class="tabbar__badge">${unread > 99 ? '99+' : unread}</i>` : '';
      return `<a class="tabbar__item${on ? ' on' : ''}" href="${n.href}">
        ${icon(on && n.iconOn ? n.iconOn : n.icon, 25)}<span>${n.label}</span>${badge}
      </a>`;
    }).join('');
    bar.querySelectorAll('[data-href]').forEach((b) => {
      b.addEventListener('click', () => { location.hash = b.dataset.href; });
    });
    bar.querySelectorAll('.tabbar__item').forEach((a) => {
      const svg = a.querySelector('svg');
      a.addEventListener('click', () => {
        if (!svg) return;
        svg.style.animation = 'none';
        void svg.offsetWidth;
        svg.style.animation = 'navBounce .3s ease';
      });
    });
  };
})();
