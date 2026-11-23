import { topbar } from "../../components/mobile/topbar.js";
import { homeTabs } from "../home/mobile.js";

const PAGES = window.PAGES;

const CAMPUS_CIRCLES = [
  { id: 'all', name: '广场', img: 'assets/brand/mascot-logo.png', bg: '#e6f6f2', tag: '全校热门' },
  { id: '教材', name: '教材考研圈', img: 'assets/brand/illustrated-book.png', bg: '#eef7f4', tag: '笔记资料接力' },
  { id: '数码', name: '数码外设圈', img: 'assets/brand/illustrated-headset.png', bg: '#edf4ff', tag: '键盘耳机好物' },
  { id: '生活', name: '宿舍好物圈', img: 'assets/brand/illustrated-light.png', bg: '#fff5e4', tag: '台灯收纳好物' },
  { id: '运动', name: '运动户外圈', img: 'assets/brand/illustrated-swapRing.png', bg: '#e8f9f1', tag: '球拍滑板同行' },
  { id: '衣物', name: '穿搭好物圈', img: 'assets/brand/illustrated-bag.png', bg: '#fdeef2', tag: '闲置衣帽流转' },
  { id: '绿植', name: '绿植手办圈', img: 'assets/brand/illustrated-wishBox.png', bg: '#f3efff', tag: '桌面治愈小物' },
];

PAGES.community = {
  tab: 'community',
  async render(view) {
    let list = [];
    let hotItems = [];
    let me = window.__me;
    if (!me) { try { me = await api.get('/api/user/me'); window.__me = me; } catch (e) { me = null; } }
    try {
      const [posts, itemsRes] = await Promise.all([
        api.get('/api/community').catch(() => []),
        api.get('/api/item/list', { page: 1, size: 12 }).catch(() => ({ list: [] })),
      ]);
      list = posts || [];
      hotItems = (itemsRes && itemsRes.list) || [];
    } catch (e) { /* 忽略 */ }

    const joined = new Set(JSON.parse(localStorage.getItem('hq.circles') || '["教材","数码"]'));
    const todayKey = new Date().toISOString().slice(0, 10);
    let checkedIn = localStorage.getItem('hq.circleCheckin') === todayKey;
    let activeCircle = window.__activeCircle || 'all';

    const renderCommunityPosts = (rows) => {
      const filtered = activeCircle === 'all' ? rows : rows.filter(r =>
        String(r.content || '').includes(activeCircle) || String(r.itemTitle || '').includes(activeCircle)
      );
      return filtered.length ? filtered.map((m) => `
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
          </div>`).join('') : mascotEmpty('这个圈子还没人发言，来说两句', 'assets/brand/mascot-wave-320.webp');
    };

    const promoGifts = [
      { circle: '教材考研圈', img: 'assets/brand/illustrated-book.png', title: '教材圈徽章' },
      { circle: '数码外设圈', img: 'assets/brand/illustrated-headset.png', title: '数码圈贴纸' },
      { circle: '宿舍好物圈', img: 'assets/brand/illustrated-light.png', title: '擦亮特权卡' },
    ];
    const hotPicks = hotItems.slice(0, 2);

    view.innerHTML = `
      <main class="circle-market">
        <div class="circle-head">
          <div class="home-guest-nav">
            ${homeTabs('community')}
            <button type="button" class="circle-checkin-pill ${checkedIn ? 'done' : ''}" id="circleTopCheck">
              <img src="assets/brand/mascot-logo.png" width="22" height="22" alt="">
              <span>${checkedIn ? '已签' : '签到'}</span>
            </button>
          </div>

          <form class="home-search circle-search" role="search">
            <button type="button" class="scan-btn" aria-label="扫码或拍照搜">${icon('scan', 20)}</button>
            <input name="keyword" type="search" aria-label="搜索校内好物" placeholder="搜索圈内好物" maxlength="200">
            <button type="button" class="cam-btn" aria-label="拍照识物">${icon('camera', 19)}</button>
            <button type="submit" aria-label="搜索">${icon('search', 20)}</button>
          </form>

          <div class="circle-rail hscroll" id="circleRail">
            ${CAMPUS_CIRCLES.map((c) => `
              <button type="button" class="circle-rail__item ${activeCircle === c.id ? 'on' : ''}" data-circle="${c.id}">
                <span class="circle-rail__avt" style="background:${c.bg}">
                  <img src="${c.img}" alt="">
                  ${c.id !== 'all' ? `<i class="${joined.has(c.id) ? 'joined' : ''}" data-join-icon="${c.id}">${joined.has(c.id) ? '✓' : '+'}</i>` : ''}
                </span>
                <b>${c.name}</b>
              </button>`).join('')}
          </div>
        </div>

        <div class="circle-body">
          <button type="button" class="city-wheel-entry" data-city-wheel aria-haspopup="dialog" aria-label="城市转盘"><span class="city-wheel-entry-icon" aria-hidden="true"></span><span><b>城市转盘</b><small>随机抽一座城市</small></span></button>
          <div class="circle-promo-grid">
            <section class="circle-promo circle-promo--pink">
              <div class="circle-promo__hd">
                <span class="circle-promo__dot">${icon('fire', 13)}</span>
                <b>圈友签到免费领</b>
              </div>
              <div class="circle-promo__items">
                ${promoGifts.map(g => `
                  <div class="circle-gift">
                    <span class="circle-gift__tag">${g.circle}</span>
                    <div class="circle-gift__img"><img src="${g.img}" alt=""></div>
                    <b>${g.title}</b>
                    <button type="button" class="circle-gift__btn ${checkedIn ? 'done' : ''}" data-checkin>${checkedIn ? '已签到' : '去签到'}</button>
                  </div>`).join('')}
              </div>
            </section>

            <section class="circle-promo circle-promo--mint">
              <div class="circle-promo__hd">
                <span class="circle-promo__dot circle-promo__dot--mint">${icon('heart', 13)}</span>
                <b>圈友都在换</b>
              </div>
              <div class="circle-promo__picks">
                ${hotPicks.length ? hotPicks.map(it => `
                  <a class="circle-pick" href="#/item/${it.id}">
                    <span class="circle-gift__tag">${esc(it.category || '校园')}</span>
                    <img src="${esc(window.catalogThumbnail(api.firstPic(it)))}" alt="">
                    <b>${esc(it.title)}</b>
                    <em>${api.yuan(it.price) ? '¥' + api.yuan(it.price) : '以物换物'}</em>
                  </a>`).join('') : '<div class="circle-pick-empty">去逛好物</div>'}
              </div>
            </section>
          </div>

          <section class="circle-rec-card">
            <div class="circle-rec-card__top">
              <div>
                <div class="circle-rec-card__meta">
                  <span class="circle-mini-avts"><i></i><i></i><i></i></span>
                  <span>移通同学都在这</span>
                </div>
                <h2>把热爱一点点缝进校园生活里</h2>
              </div>
              <img class="circle-rec-card__mascot" src="assets/brand/mascot-wave-320.webp" alt="">
            </div>
            <div class="circle-rec-list">
              ${CAMPUS_CIRCLES.slice(1, 4).map(c => `
                <div class="circle-rec-row">
                  <img src="${c.img}" style="background:${c.bg}" alt="">
                  <div class="circle-rec-row__info">
                    <b>${c.name}</b>
                    <span>${c.tag}</span>
                  </div>
                  <button type="button" class="circle-join-btn ${joined.has(c.id) ? 'on' : ''}" data-join="${c.id}">${joined.has(c.id) ? '已加圈' : '+加圈'}</button>
                </div>`).join('')}
            </div>
          </section>

          <div class="market-community" style="padding:0">
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
            </div>
          </div>
        </div>
      </main>`;

    view.querySelector('.circle-search .scan-btn')?.addEventListener('click', () => window.openScanSearch());
    view.querySelector('.circle-search .cam-btn')?.addEventListener('click', () => window.openScanSearch());
    view.querySelector('.circle-search')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const kw = e.currentTarget.elements.keyword.value.trim();
      location.hash = kw ? '#/search/' + encodeURIComponent(kw) : '#/search';
    });

    const doCheckin = () => {
      if (checkedIn) { toast('今天已经签到过了'); return; }
      checkedIn = true;
      localStorage.setItem('hq.circleCheckin', todayKey);
      view.querySelectorAll('[data-checkin], #circleTopCheck').forEach(b => {
        b.classList.add('done');
        if (b.id === 'circleTopCheck') b.querySelector('span').textContent = '已签';
        else b.textContent = '已签到';
      });
      toast('签到成功');
    };
    view.querySelector('#circleTopCheck')?.addEventListener('click', doCheckin);
    view.querySelectorAll('[data-checkin]').forEach(b => b.addEventListener('click', doCheckin));

    const toggleJoin = (id) => {
      if (joined.has(id)) joined.delete(id); else joined.add(id);
      localStorage.setItem('hq.circles', JSON.stringify([...joined]));
      view.querySelectorAll(`[data-join="${id}"]`).forEach(btn => {
        btn.classList.toggle('on', joined.has(id));
        btn.textContent = joined.has(id) ? '已加圈' : '+加圈';
      });
      view.querySelectorAll(`[data-join-icon="${id}"]`).forEach(ic => {
        ic.classList.toggle('joined', joined.has(id));
        ic.textContent = joined.has(id) ? '✓' : '+';
      });
      toast(joined.has(id) ? '已加入圈子' : '已退出圈子');
    };
    view.querySelectorAll('[data-join]').forEach(b => b.addEventListener('click', () => toggleJoin(b.dataset.join)));

    view.querySelectorAll('[data-circle]').forEach(b => b.addEventListener('click', () => {
      activeCircle = b.dataset.circle;
      window.__activeCircle = activeCircle;
      view.querySelectorAll('[data-circle]').forEach(x => x.classList.toggle('on', x.dataset.circle === activeCircle));
      document.getElementById('communityPosts').innerHTML = renderCommunityPosts(list);
    }));

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
      } catch (e) { /* 忽略 */ }
      finally { refreshing = false; }
    }, 10000);
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
