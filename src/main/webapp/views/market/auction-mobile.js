import { topbar } from "../../components/mobile/topbar.js";

const PAGES = window.PAGES;

PAGES.auction = {
  tab: 'auction',
  async render(view) {
    const route = location.hash;
    let list = [];
    let loadError = '';
    try { list = await api.get('/api/auction') || []; } catch (e) { loadError = e.message; }
    if (location.hash !== route) return;
    const filters = this.filters || (this.filters = {keyword:'', state:'', sort:''});
    list = list.filter((a) => a.state === 'active' || a.state === 'ended');
    view.innerHTML = `
      <div class="topbar">
        <div class="topbar__title topbar__title--lg">拍卖</div>
        <div class="topbar__spacer"></div>
        <a class="btn btn--ghost btn--sm" href="#/publish/edit/auction">${icon('auction', 15)}发起拍卖</a>
      </div>
      <div class="auction-search-controls">
        <form class="home-search" role="search">
          ${icon('search', 19)}<input type="search" name="keyword" value="${esc(filters.keyword)}" placeholder="搜索拍品" aria-label="搜索拍品" maxlength="100">
          <button type="submit" aria-label="搜索">${icon('search', 20)}</button>
        </form>
        <div class="sortbar" role="group" aria-label="排序">
          ${[['','综合'],['ending','即将结束'],['low','价格从低到高'],['high','价格从高到低']].map(([key,label]) =>
          `<button type="button" data-auction-sort="${key}" aria-pressed="${filters.sort === key}">${label}</button>`).join('')}
        </div>
        <div class="r-chips" role="group" aria-label="拍卖状态">
          ${[['','全部'],['active','拍卖中'],['ended','已结束']].map(([key,label]) =>
          `<button class="chip" type="button" data-auction-state="${key}" aria-pressed="${filters.state === key}">${label}</button>`).join('')}
          <span class="auction-result-count" role="status"></span>
        </div>
      </div>
      <div class="auction-feed"></div>`;
    const feed = view.querySelector('.auction-feed');
    const form = view.querySelector('.auction-search-controls form');
    const count = view.querySelector('.auction-result-count');

    function renderResults() {
      const keyword = filters.keyword.trim().normalize('NFKC').toLocaleLowerCase();
      const matches = list.filter(a => (!filters.state || a.state === filters.state)
        && [a.title,a.description].filter(Boolean).join(' ').normalize('NFKC').toLocaleLowerCase().includes(keyword));
      if (filters.sort === 'ending') matches.sort((a,b) =>
        Number(b.state === 'active') - Number(a.state === 'active')
        || (Date.parse(a.endsAt) || Infinity) - (Date.parse(b.endsAt) || Infinity));
      if (filters.sort === 'low' || filters.sort === 'high') {
        const direction = filters.sort === 'low' ? 1 : -1;
        matches.sort((a,b) => direction * (Number(a.currentPrice) - Number(b.currentPrice)));
      }
      count.textContent = loadError ? '' : matches.length + ' 件拍品';
      feed.innerHTML = loadError ? `<p class="auction-empty" role="alert">${esc(loadError)} <button type="button" data-auction-retry>重试</button></p>`
        : matches.length ? matches.map((a) => `
          <div class="auction-card">
            <img src="${esc(window.catalogThumbnail(a.image || 'assets/brand/placeholder.png'))}" alt="" loading="lazy">
            <div class="main">
              <h3><a href="#/auction/${Number(a.id)}">${esc(a.title)}</a></h3>
              <div class="now"><b>¥${Number(a.currentPrice).toFixed(0)}</b><span>当前价 | ${a.bidCount} 次出价</span></div>
              <div class="foot">
                <span class="time">${a.state === 'active' ? '剩余 ' + remainText(a.endsAt) : '已结束'}</span>
                ${a.state === 'active'
                ? `<button class="chip on" data-bid="${a.id}" data-cur="${a.currentPrice}" data-count="${Number(a.bidCount)}" data-title="${esc(a.title)}">出价</button>`
                : `<a class="chip" href="#/auction/${Number(a.id)}">查看结果</a>`}
              </div>
            </div>
          </div>`).join('') : `<div class="auction-empty">
            <p>${list.length ? '没有符合条件的拍品' : '暂时没有拍品'}</p>
            ${list.length ? '<button type="button" data-auction-reset>清除筛选</button>' : '<a href="#/publish/edit/auction">发起拍卖</a>'}
          </div>`;
      view.querySelectorAll('[data-auction-sort], [data-auction-state]').forEach(button => {
        button.setAttribute('aria-pressed', String(button.hasAttribute('data-auction-sort')
          ? button.dataset.auctionSort === filters.sort : button.dataset.auctionState === filters.state));
      });
    }
    form.addEventListener('submit', event => {
      event.preventDefault();
      filters.keyword = form.elements.keyword.value;
      renderResults();
    });
    form.elements.keyword.addEventListener('input', () => {
      filters.keyword = form.elements.keyword.value;
      renderResults();
    });
    view.querySelector('.auction-search-controls').addEventListener('click', event => {
      const button = event.target.closest('[data-auction-sort], [data-auction-state]');
      if (!button) return;
      if (button.hasAttribute('data-auction-sort')) filters.sort = button.dataset.auctionSort;
      else filters.state = button.dataset.auctionState;
      renderResults();
    });
    renderResults();
    feed.addEventListener('click', event => {
      if (event.target.closest('[data-auction-retry]')) { renderRoute(); return; }
      if (event.target.closest('[data-auction-reset]')) {
        Object.assign(filters,{keyword:'',state:'',sort:''});
        form.reset();
        form.elements.keyword.value = '';
        renderResults();
        return;
      }
      const btn = event.target.closest('[data-bid]');
      if (!btn) return;
      const aid = btn.dataset.bid, cur = btn.dataset.cur;
      const minimum = window.campusExchange.minBid(cur, btn.dataset.count);
      openSheet('出价', `<div style="font-size:14px;color:var(--ink-500);margin-bottom:10px">${esc(btn.dataset.title)} | 当前价 ¥${Number(cur).toFixed(0)}</div>
          <div style="display:flex;align-items:center;gap:8px;border-bottom:1px solid var(--line);padding-bottom:10px">
            <span style="font-size:22px;color:var(--orange-700);font-weight:800">¥</span>
            <input id="bidIn" type="number" aria-label="出价金额" step="0.01" min="${minimum}" value="${minimum}" style="border:0;outline:none;font-size:24px;font-weight:700;width:100%">
          </div>
          <p class="hint">最低可出价 ¥${minimum}</p><button class="btn btn--block" style="margin-top:18px" id="bidGo">确认出价</button>`, {
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
    });
  },
};

PAGES.auctionDetail = {
  noTab: true,
  async render(view, params) {
    const route = location.hash;
    view.innerHTML = topbar('拍卖详情', {parent:'#/auction'}) + '<p class="auction-empty" role="status">正在加载拍品…</p>';
    let a;
    try { a = await api.get('/api/auction/' + params.id); }
    catch (error) {
      if (route === location.hash) {
        view.innerHTML = topbar('拍卖详情', {parent:'#/auction'}) + `<p class="auction-empty">${esc(error.message)} <button type="button" data-retry>重试</button></p>`;
        view.querySelector('[data-retry]').onclick = () => renderRoute();
      }
      return;
    }
    if (route !== location.hash) return;
    const active = a.state === 'active' && !(new Date(a.endsAt).getTime() < Date.now());
    const images = api.pics({images:a.image});
    const deadline = new Date(a.endsAt);
    const ends = Number.isNaN(deadline.getTime()) ? '待确认'
      : new Intl.DateTimeFormat('zh-CN', {month:'long', day:'numeric', hour:'2-digit',minute:'2-digit'}).format(deadline);
    view.innerHTML = topbar('拍卖详情', {parent:'#/auction', right:'<button type="button" class="topbar__back" data-share aria-label="分享拍品">' + icon('share',21) + '</button>'}) +
      `<article class="auction-detail">
          <h1>${esc(a.title)}</h1>
          <p><strong>¥${esc(String(a.currentPrice))}</strong> ${Number(a.bidCount) ? Number(a.bidCount) + ' 次出价' : '尚无人出价'}</p>
          <p>${active ? '截拍时间' : '拍卖截止'} ${esc(ends)}</p>
          <p>${esc(a.description || '暂无补充说明')}</p>
          ${active ? '<button type="button" class="btn btn--block" data-detail-bid>出价</button>' : '<p role="status">该拍品当前不能出价。</p>'}
          <div class="item-detail-photos">${images.length ? images.map((pic,i) => `<img src="${esc(safeMediaUrl(pic))}" alt="拍品图片 ${i + 1}" decoding="async">`).join('') : '<div class="item-photo-empty">暂无实拍图</div>'}</div>
        </article>`;
    view.querySelector('[data-share]').onclick = async () => {
      const url = location.origin + '/#/auction/' + Number(a.id);
      try { await navigator.clipboard.writeText(url); toast('拍品链接已复制'); }
      catch (error) { openSheet('分享拍品', `<input class="field" aria-label="拍品链接" value="${esc(url)}" readonly>`); }
    };
    view.querySelector('[data-detail-bid]')?.addEventListener('click', () => {
      const minimum = window.campusExchange.minBid(a.currentPrice, a.bidCount);
      openSheet('出价', `<form class="proposal-form"><label>出价金额（元）<input name="bid" type="number" min="${minimum}" value="${minimum}" step="0.01" required></label>
           <p>最低出价 ¥${minimum}</p><button type="submit" class="btn btn--block">确认出价</button></form>`,
        {onMount(sheet, close) {
          const form = sheet.querySelector('form');
          form.onsubmit = async event => {
            event.preventDefault();
            const button = form.querySelector('button');
            if (button.disabled) return;
            button.disabled = true;
            try { await api.post('/api/auction/' + Number(a.id) + '/bid', {amount:form.elements.bid.value}); close(); toast('出价成功'); renderRoute(); }
            catch (error) { toast(error.message); }
            finally { button.disabled = false; }
          };
        }});
    });
  },
};
