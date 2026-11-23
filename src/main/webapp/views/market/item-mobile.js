import { reportSheet } from "../../components/mobile/report.js";

const PAGES = window.PAGES;

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
    document.title = it.title + ' | 换一圈';
    const demo = window.campusExchange.isDemoListing(it);
    const pics = api.pics(it).filter(pic => !demo || window.realListingPhoto(pic));
    const available = !demo && !data.isMine && Number(it.status) === 1;
    const canBuy = available && window.campusExchange.supports(it,1);
    const canSwap = available && window.campusExchange.supports(it,2);
    const price = Number(it.price) > 0 && it.tradeMode !== 2 ? api.yuan(it.price) : '';
    const wants = data.want || {};
    const wantText = it.wantText || wants.expectDesc || it.expectDesc || (wants.wantCategories || []).join("、") || wants.wantCategory || "不限类别";
    const isSwap = it.tradeMode === 2 || (!it.tradeMode && !price);
    const credit = creditLabel(it.ownerSellerCredit || it.ownerCredit);

    view.innerHTML = `
      <div class="item-page">
        <header class="item-detail-top">
          <button type="button" aria-label="返回" onclick="smartBack('#/home')">${icon('back', 21)}</button>
          <a href="#/search">${icon('search', 17)}<span>搜索校园闲置</span></a>
          <button type="button" aria-label="更多操作" id="itemMore">${icon('more', 21)}</button>
        </header>
        <div class="item-price">
          <div class="item-price__row">
            ${price ? `<span class="price"><em>¥</em><b>${price}</b></span>` : `<span class="price item-want"><small>想换</small><b>${esc(wantText)}</b></span>`}
            ${price && it.originalPrice && it.originalPrice > it.price ? `<s>¥${api.yuan(it.originalPrice)}</s>` : ''}
            ${demo && price ? '<span class="badge badge--gray">官网参考价</span>' : ''}
            ${auction ? `<span class="badge badge--orange">拍卖中 | 当前 ¥${Number(auction.currentPrice).toFixed(0)}</span>` : ''}
          </div>
          ${demo && price && window.campusExchange.supports(it,2) ? `<p class="item-price__meta">想换：${esc(wantText)}</p>` : ''}
          <div class="item-price__meta">
            <span>${it.viewCount || 0} 浏览</span>
            <span>${it.offerCount || 0} 人想要</span>
            <span>${esc(it.conditionLevel)}</span>
            ${canBuy && it.allowBargain ? '<span>可议价</span>' : ''}
          </div>
        </div>
        <div class="item-block">
          <h1>${displayItemTitle(it)}</h1>
          <p>${esc(it.description || '同学没写描述，可以直接问问。')}</p>
          <div class="item-tags">
            <span class="badge badge--gray">${esc(it.category)}</span>
            <span class="badge badge--gray">${demo ? "仅演示" : isSwap ? '以物换物' : it.tradeMode === 3 ? '拍卖' : '出售'}</span>
            ${it.brand ? `<span class="badge badge--gray">${esc(it.brand)}</span>` : ''}
            ${demo ? '' : `<span class="badge badge--green">${esc(it.delivery || '仅面交')}</span>`}
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
          ${pics.length ? pics.map((pic, i) =>
          `<img src="${esc(pic)}" alt="商品图片 ${i + 1}" ${i ? 'loading="lazy"' : ''}>`).join('')
          : '<div class="item-photo-empty">暂无实拍图</div>'}
        </div>
        ${demo ? '' : `<div class="item-block">
          <div class="item-owner">
            <span onclick="siteRoutes.go('#/user/${it.ownerId}')">${avatar({ nickname: it.ownerNickname, id: it.ownerId, avatar: it.ownerAvatar }, 44)}</span>
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
          ${!demo && !data.isMine ? `<button class="ic" type="button" id="itemReport">${icon('more',22)}<span>举报</span></button>` : ''}
          ${available && canBuy ? `<button class="ic" type="button" id="itemCashChat">${icon('message',22)}<span>私聊</span></button>` : ''}
          <div class="item-bar-actions">
          ${demo ? '<span class="badge badge--gray">仅供展示</span>' : ''}
          ${data.isMine ? `<a class="btn" href="#/item/${Number(it.id)}/edit">编辑</a>` : ''}
          ${canSwap ? '<button class="btn btn--alt" id="itemWant">提案换物</button>' : ''}
          ${canBuy ? `<button class="btn" id="itemBuy">约面交 ¥${price}</button>
            ${it.allowBargain ? '<button class="btn btn--alt" id="itemOffer">出价</button>' : ''}` : ''}
          ${available && !canBuy ? '<button class="btn" id="itemChat">聊一聊</button>' : ''}
          </div>
        </div>
      </div>`;

    const sellerList = view.querySelector('.item-seller-list');
    if (sellerList && it.ownerId) {
      api.get('/api/item/user/' + it.ownerId).then((items) => {
        const other = (items || []).filter((row) => Number(row.id) !== Number(it.id)).slice(0, 8);
        if (!sellerList.isConnected || !other.length) return;
        sellerList.innerHTML = `<h2>发布者的在架物品</h2><div class="item-seller-rail">${other.map((row) =>
          `<a href="#/item/${Number(row.id)}"><img src="${esc(window.catalogThumbnail(api.firstPic(row)))}" alt="" loading="lazy" decoding="async"><span>${displayItemTitle(row)}</span></a>`).join('')}</div>`;
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
            const url = location.origin + '/item/' + it.id;
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

    view.querySelector('#itemReport')?.addEventListener('click', () => reportSheet(it.id, 'item'));
    if (!available) return;
    const sendTrade = async payload => {
      const result = await api.post('/api/offer', {itemId:it.id,...payload});
      toast('提案已发出，等待对方回应');
      window.__offersMode = 'sent';
      siteRoutes.go(result.conversationId ? '#/chat/' + Number(result.conversationId) : '#/offers');
    };
    const sendCash = fixed => {
      window.openCashProposal({title:fixed ? '按标价约面交' : '发出面交出价', description:it.title, initial:it.price, fixed, note:true,
        onSend:(amountCents,message) => sendTrade({amountCents,message})});
    };
    view.querySelector('#itemBuy')?.addEventListener('click', () => sendCash(true));
    view.querySelector('#itemOffer')?.addEventListener('click', () => sendCash(false));
    const startChat = async () => {
      try {
        const r = await api.post('/api/conversation/start', { itemId: it.id });
        siteRoutes.go('#/chat/' + r.id);
      } catch (e) { toast(e.message); }
    };
    document.getElementById('itemChat')?.addEventListener('click', startChat);
    document.getElementById('itemCashChat')?.addEventListener('click', startChat);

    document.getElementById('itemWant')?.addEventListener('click', async () => {
      const route = siteRoutes.current();
      try {
        const list = await api.get('/api/item/mine');
        if (route !== siteRoutes.current()) return;
        const mine = (list || []).filter(i => i.status === 1 && !i.isDemo && i.id !== it.id);
        if (!mine.length) {
          openSheet('提案交换', '<p>先发布一件物品，审核通过后就可以用它发提案。</p><a class="btn btn--block" href="#/publish/edit/idle" data-proposal-return>去发布</a>',
            {onMount(sheet, close) {
              sheet.querySelector('[data-proposal-return]').onclick = () => {
                sessionStorage.setItem('hq.proposalReturn', route);
                close();
              };
            }});
          return;
        }
        window.openTradeProposal({title:'提案交换', receive:it, items:mine, sendLabel:'发出提案', note:true,
          onSend:(myItemId,message) => sendTrade({myItemId,message})});
      } catch (error) {
        if (error.code === 401 && route === siteRoutes.current()) siteRoutes.go('#/login');
        else toast(error.message);
      }
    });

    if (auction) {
      document.getElementById('itemBid').addEventListener('click', () => {
        const minimum = window.campusExchange.minBid(auction.currentPrice, auction.bidCount);
        openSheet('出价', `<div style="font-size:14px;color:var(--ink-500);margin-bottom:10px">当前价 ¥${Number(auction.currentPrice).toFixed(0)}</div>
            <div style="display:flex;align-items:center;gap:8px;border-bottom:1px solid var(--line);padding-bottom:10px">
              <span style="font-size:22px;color:var(--orange-700);font-weight:800">¥</span>
              <input id="bidIn" type="number" aria-label="出价金额" step="0.01" min="${minimum}" value="${minimum}" style="border:0;outline:none;font-size:24px;font-weight:700;width:100%">
            </div>
            <p class="hint">最低可出价 ¥${minimum}</p><button class="btn btn--block" style="margin-top:18px" id="bidGo">确认出价</button>`, {
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
