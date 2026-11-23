import { searchSuggestion } from "../home/mobile.js";

const PAGES = window.PAGES;

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
        <span class="back" onclick="smartBack('#/home')">${icon('back', 22)}</span>
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
        .map(searchSuggestion).join('')}
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
        <a class="on" href="#/search">我常换的</a>
        <a href="#/category/%E6%95%99%E6%9D%90">教材</a>
        <a href="#/category/%E6%95%B0%E7%A0%81">数码</a>
        <a href="#/category/%E8%BF%90%E5%8A%A8">运动</a>
        <a href="#/category/%E7%94%9F%E6%B4%BB">生活</a>
      </div>
      <div class="s-bought">
        ${items.slice(0, 6).map((it) => `
          <a href="#/item/${it.id}">
            <img src="${esc(window.catalogThumbnail(api.firstPic(it)))}" alt="" loading="lazy" decoding="async">
            <b>${esc(it.title)}</b>
            <span>${api.yuan(it.price) ? '¥' + api.yuan(it.price) : '想换'}</span>
          </a>`).join('')}
      </div>

      ${cats.map((c) => groups[c] ? `
        <div class="s-history-head"><h2>${c}</h2></div>
        <div class="s-cats">
          ${groups[c].slice(0, 4).map((it) => `
            <a href="#/item/${it.id}">
              <img src="${esc(window.catalogThumbnail(api.firstPic(it)))}" alt="" loading="lazy" decoding="async">
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
      siteRoutes.go('#/search/' + encodeURIComponent(kw));
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
      document.getElementById('guessChips').innerHTML = pick.map(searchSuggestion).join('');
    });
    view.querySelectorAll('.s-tabrow a').forEach((a) => a.addEventListener('click', () => {
      const t = a.textContent.trim();
      view.querySelectorAll('.s-tabrow a').forEach((x) => x.classList.remove('on'));
      a.classList.add('on');
      if (t !== '我常换的') siteRoutes.go('#/category/' + encodeURIComponent(t));
    }));
  },
};

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
      const query = { page: 1, size: 40, category: filter.category, conditionLevel: filter.condition,
        tradeMode: filter.tradeMode, building: filter.area };
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
      if (tab === 'personal') list = list.filter(i => !window.campusExchange.isDemoListing(i));
      if (filter.area) list = list.filter(i => i.ownerBuilding === filter.area || (i.place || '').includes(filter.area));
      if (filter.tradeMode) list = list.filter(i => window.campusExchange.supports(i, filter.tradeMode));
      if (filter.meet) list = list.filter((i) => (i.delivery || '仅面交') === '仅面交');
      if (sort === 'price_asc') list = list.slice().sort((a, b) => (a.price || 0) - (b.price || 0));
      if (sort === 'price_desc') list = list.slice().sort((a, b) => (b.price || 0) - (a.price || 0));
      if (sort === 'new') list = list.slice().sort((a, b) => String(b.createTime).localeCompare(String(a.createTime)));
      if (sort === 'drop') list = list.slice().sort((a, b) => ((b.originalPrice || 0) - (b.price || 0)) - ((a.originalPrice || 0) - (a.price || 0)));
      if (tab !== 'personal') {
        list.sort((a, b) => Number(window.campusExchange.isDemoListing(a)) - Number(window.campusExchange.isDemoListing(b)));
      }
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
      bodyHtml = `<div class="r-feed-wrap">${list.length ? waterfallWith(list, resultCard) : mascotEmpty('暂无符合条件的「' + esc(kw) + '」', 'assets/brand/mascot-wave-320.webp', {href: '#/publish/edit/wish?want=' + encodeURIComponent(kw), text: '发布求换心愿'})}</div>`;
    }

    view.innerHTML = `
      <div class="search-head">
        <span class="back" onclick="smartBack('#/home')">${icon('back', 22)}</span>
        <div class="search-box">
          <input class="txt" id="rInput" value="${esc(kw)}" autocomplete="off">
          <span class="clr" id="rClear">${icon('close', 11)}</span>
          <span class="cam">${icon('camera', 19)}</span>
        </div>
        <button class="search-sub" id="rSub">${icon('star', 19)}订阅</button>
      </div>

      <div class="r-tabs">
        <a class="${tabCls('all')}" data-tab="all" href="#/search">全部</a>
        <a class="${tabCls('personal')}" data-tab="personal" href="#/search">个人闲置</a>
        <a class="${tabCls('users')}" data-tab="users" href="#/search">用户</a>
      </div>

      <div class="sortbar">
        <a class="${sort === '' ? 'on' : ''}" data-sort="" href="#/search">综合 ${icon('down', 13)}</a>
        <a class="${sort === 'price_asc' || sort === 'price_desc' ? 'on' : ''}" data-sort="price" href="#/search">价格 ${icon('sortPrice', 13)}</a>
        <a class="${sort === 'drop' ? 'on' : ''}" data-sort="drop" href="#/search">降价</a>
        <a class="${sort === 'new' ? 'on' : ''}" data-sort="new" href="#/search">新发</a>
        <a data-sort="area" href="#/search">区域 ${icon('down', 13)}</a>
        <a class="flt" id="rFilter" href="#/search">${icon('filter', 14)}筛选</a>
      </div>

      <div class="r-chips">
        <span class="chip" id="chipPersonal">${icon('user', 14)}个人闲置</span>
        <span class="chip" id="chipCond">成色 ${icon('down', 12)}</span>
        <span class="chip" id="chipCat">分类 ${icon('down', 12)}</span>
        ${filter.tradeMode ? '<span class="chip on">只看以物换物</span>' : ''}
        ${filter.meet ? '<span class="chip on">只看可面交</span>' : ''}
      </div>

      ${conditions.length ? `<div class="r-chips" aria-label="已识别搜索条件">${conditions.map(label => `<span class="chip on">${esc(label)}</span>`).join('')}</div>` : ''}
      ${!list.length && conditions.length ? '<p class="r-chips">没有商品同时满足这些条件，可修改搜索词放宽条件。</p>' : ''}
      ${bodyHtml}`;

    view.querySelectorAll('[data-tab]').forEach((a) => a.addEventListener('click', (e) => {
      e.preventDefault();
      window.__searchTab = a.dataset.tab; renderRoute();
    }));
    view.querySelectorAll('[data-sort]').forEach((a) => a.addEventListener('click', (e) => {
      e.preventDefault();
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

    document.getElementById('chipPersonal')?.addEventListener('click', () => {
      window.__searchTab = 'personal';
      renderRoute();
    });
    document.getElementById('chipCond')?.addEventListener('click', () => document.getElementById('rFilter')?.click());
    document.getElementById('chipCat')?.addEventListener('click', () => document.getElementById('rFilter')?.click());
    document.getElementById('rClear').addEventListener('click', () => { document.getElementById('rInput').value = ''; });
    document.getElementById('rInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') siteRoutes.go('#/search/' + encodeURIComponent(e.target.value.trim()));
    });
    document.getElementById('rSub').addEventListener('click', () => {
      const subs = JSON.parse(localStorage.getItem('searchSubs') || '[]');
      if (subs.indexOf(kw) < 0) subs.push(kw);
      localStorage.setItem('searchSubs', JSON.stringify(subs));
      toast('已订阅「' + kw + '」，有新上架会通知你');
    });
    document.getElementById('rFilter').addEventListener('click', (e) => {
      e.preventDefault();
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
