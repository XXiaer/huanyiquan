/* 页面：发布入口、发布编辑（闲置 / 拍卖 / 心愿） */
(function () {
  const PAGES = window.PAGES || {};

  /* ============================================================ 发布入口 */
  PAGES.publishEntry = {
    noTab: true,
    async render(view) {
      view.innerHTML = `
      <div class="pub-page">
        <div class="pub-hero">
          <h1>闲置别吃灰<br><em>换一圈</em>看看</h1>
          <img class="pub-hero__mascot" src="assets/brand/mascot-publish-box.png" alt="猫猫抱着箱子">
        </div>

        <div class="pub-sec">
          <h2>自己换</h2>
          <a class="pub-big" href="#/publish/edit/idle">
            ${serviceIcon('parcel', 60)}
            <div class="pub-big__main">
              <b>发闲置</b>
            </div>
            <span class="pub-big__arrow">${icon('right', 20)}</span>
          </a>
          <div class="pub-duo">
            <a href="#/publish/edit/auction">
              <i class="pub-ico">${serviceIcon('auction', 32)}</i>
              <div><b>发拍卖</b></div>
            </a>
            <a href="#/publish/edit/wish">
              <i class="pub-ico">${serviceIcon('wishBox', 32)}</i>
              <div><b>发心愿</b></div>
            </a>
          </div>
        </div>

        <div class="pub-sec">
          <h2>帮我处理</h2>
          <a class="pub-big pub-big--green" href="#/appraise">
            ${serviceIcon('appraise', 60)}
            <div class="pub-big__main">
              <b>好物估价</b>
            </div>
            <span class="pub-big__arrow">${icon('right', 20)}</span>
          </a>
        </div>

        <div class="pub-close">
          <button onclick="history.length > 1 ? history.back() : (location.hash='#/home')">${icon('close', 26)}</button>
        </div>
      </div>`;
    },
  };

  /* ============================================================ 发布编辑 */
  const KIND = {
    idle: { title: '发闲置', mode: 1 },
    auction: { title: '发拍卖', mode: 3 },
    wish: { title: '发心愿', mode: 2 },
  };
  const CATEGORIES = ['教材', '数码', '运动', '生活', '衣物', '绿植', '其他'];
  const CONDITIONS = ['全新', '九成新', '七成新', '有使用痕迹'];
  const PLACES = ['图书馆门口', '缤果大街', '紫荆 3 号楼', '紫荆 5 号楼', '紫藤 2 号楼', '体育馆', '行政楼'];
  const TEMPLATES = {
    成色说明: '成色：九成新，外观几乎无痕迹，功能一切正常。',
    入手来源: '入手渠道：去年在官方旗舰店买的，有购买记录。',
    出售原因: '出售原因：毕业搬宿舍，东西太多带不走。',
  };

  PAGES.publishEdit = {
    noTab: true,
    async render(view, params) {
      if (params.kind === 'wish') { renderWish(view); return; }
      const kind = KIND[params.kind] || KIND.idle;
      const itemId = params.itemId;
      const draftKey = itemId ? 'draft:item:' + itemId : 'draft:' + params.kind;
      let draft = JSON.parse(localStorage.getItem(draftKey) || '{}');
      let item;
      if (itemId) {
        const mine = await api.get('/api/item/mine');
        item = mine.find(row => row.id === itemId && row.tradeMode !== 3);
        if (!item) throw new Error('无法编辑这件闲置');
        draft = {
          pics: api.pics(item), title: item.title, desc: item.description, category: item.category,
          price: String((item.price || 0) / 100), originalPrice: item.originalPrice ? String(item.originalPrice / 100) : '',
          cond: item.conditionLevel, place: item.place, delivery: item.delivery,
          tradeMode: item.tradeMode, wantText: item.wantText, wantCategory: item.wantCategory,
          allowBargain: item.allowBargain !== false && item.allowBargain !== 0,
          ...draft,
        };
      }
      const settings = JSON.parse(localStorage.getItem('settings') || '{}');
      const myPlaces = JSON.parse(localStorage.getItem('meetPlaces') || '[]');

      const state = {
        pics: draft.pics || [],
        category: draft.category || '',
        price: draft.price || '',
        originalPrice: draft.originalPrice || '',
        allowBargain: draft.allowBargain !== false,
        tradeMode: draft.tradeMode || kind.mode,
        cond: draft.cond || '九成新',
        place: draft.place || settings.meet || myPlaces[0] || '图书馆门口',
        delivery: draft.delivery || settings.delivery || '仅面交',
        auctionHours: draft.auctionHours || 24,
        auctionStart: draft.auctionStart || '',
      };

      const tradeName = (m) => (m === 2 ? '以物换物' : m === 3 ? '拍卖' : '出售');

      const relayItems = kind.mode === 2
        ? (await api.get('/api/item/mine', {status: 1}).catch(() => [])).filter(item => item.allowCycle && !item.isDemo)
        : [];
      view.innerHTML = `
      <div class="pe-page">
        <div class="pe-head">
          <button class="x" onclick="closeEditor()">${icon('close', 24)}</button>
          <h1>${itemId ? '编辑闲置' : kind.title}</h1>
          <button class="pe-submit" id="peSubmit">${itemId ? '保存' : '发布'}</button>
        </div>
        <div class="pe-error" id="peError"></div>

        <div class="pe-card">
          <div class="pe-pics" id="pePics">
            <label class="pe-add" for="peFile" id="peAdd">
              <span>${icon('camera', 21)} 添加图片</span>
            </label>
            <input type="file" id="peFile" accept="image/*" multiple hidden>
          </div>
          <input class="pe-title-in" id="peTitle" maxlength="60" placeholder="${kind.mode === 2 ? '想要什么？写清品牌型号' : '标题：品牌型号 + 物品名'}" value="${esc(draft.title || '')}">
          ${kind.mode === 2 ? `<label class="label" for="wishOffer">我拿什么换</label>
            <select class="field" id="wishOffer"><option value="">不关联物品，发布普通心愿</option>
            ${relayItems.map(item => `<option value="${Number(item.id)}">${esc(item.title)}</option>`).join('')}</select>
            <p class="relay-hint">关联自己开启闭环交换的在架物品后，系统会自动寻找三方接力。</p>` : ''}
          <textarea class="pe-desc-in" id="peDesc" maxlength="500" placeholder="${kind.mode === 2 ? '想换什么、预算多少、成色要求，都可以写在这里' : '描述一下宝贝的品牌型号、货品来源、入手渠道、有没有瑕疵'}">${esc(draft.desc || '')}</textarea>
          <div class="pe-tpl">
            ${Object.keys(TEMPLATES).map((t) => `<span class="chip" data-tpl="${t}">${t}</span>`).join('')}
          </div>
        </div>

        <div class="pe-form">
          <div class="pe-row" id="peCate">
            <span>分类</span>
            <span class="pe-row__v ${state.category ? 'on' : 'err'}" id="cateVal">${esc(state.category || '请选择')}${icon('right', 16)}</span>
          </div>
          ${kind.mode !== 2 ? `
          <div class="pe-row" id="pePrice">
            <span>价格${kind.mode === 3 ? '（起拍价）' : ''}</span>
            <span class="pe-row__v ${state.price ? 'on' : ''}" id="priceVal" style="color:var(--red-500)">${state.price ? '¥' + state.price : '¥0.00'}${icon('right', 16)}</span>
          </div>
          <div class="pe-row" id="peOrig">
            <span>原价</span>
            <span class="pe-row__v ${state.originalPrice ? 'on' : ''}" id="origVal">${state.originalPrice ? '¥' + state.originalPrice : '选填'}${icon('right', 16)}</span>
          </div>` : ''}
          ${kind.mode === 1 ? `
          <div class="pe-row" id="peTrade">
            <span>交易方式</span>
            <span class="pe-row__v on" id="tradeVal">${tradeName(state.tradeMode)}${icon('right', 16)}</span>
          </div>
          <div class="pe-row" id="peWantRow" style="display:${state.tradeMode === 2 ? 'flex' : 'none'}">
            <span>想换什么</span>
            <input id="wantText" maxlength="60" placeholder="比如：篮球、台灯" value="${esc(draft.wantText || '')}"
              style="margin-left:auto;border:0;outline:none;text-align:right;font-size:15px;max-width:62%;color:var(--ink-900)">
          </div>
          <div class="pe-row" id="peWantCategoryRow" style="display:${state.tradeMode === 2 ? 'flex' : 'none'}">
            <span>期望物品分类</span><select id="wantCategory" style="margin-left:auto;border:0;background:transparent;color:var(--ink-700);font:inherit"><option value="">请选择</option>${CATEGORIES.map(c => `<option value="${c}"${draft.wantCategory === c ? ' selected' : ''}>${c}</option>`).join('')}</select>
          </div>` : ''}
          ${kind.mode === 3 ? `
          <div class="pe-row" id="peHours">
            <span>拍卖时长</span>
            <span class="pe-row__v on" id="hoursVal">${state.auctionHours} 小时${icon('right', 16)}</span>
          </div>` : ''}
          <div class="pe-row pe-row--col">
            <span class="lbl">成色</span>
            <div class="pe-chips" id="peCond">
              ${CONDITIONS.map((c) => `<span class="chip${c === state.cond ? ' on' : ''}" data-v="${c}">${c}</span>`).join('')}
            </div>
          </div>
          <div class="pe-row" id="pePlace">
            <span>面交地点</span>
            <span class="pe-row__v on" id="placeVal">${esc(state.place)}${icon('right', 16)}</span>
          </div>
          <div class="pe-row" id="peDeliver">
            <span>送达方式</span>
            <span class="pe-row__v on" id="deliverVal">${esc(state.delivery)}${icon('right', 16)}</span>
          </div>
          ${kind.mode !== 2 ? `<div class="pe-switch-row"><span>可小刀</span><span class="switch${state.allowBargain ? ' on' : ''}" id="bargainSw"></span></div>` : ''}
        </div>
        <div class="pe-hint">发布后先过审核与违禁词校验，通过即上架。草稿会自动保存，下次回来可以继续。</div>
      </div>`;

      window.closeEditor = () => {
        saveDraft();
        confirmSheet('退出编辑', '草稿已经保存，下次从「我的发布」可以继续编辑。', '退出', () => {
          history.length > 1 ? history.back() : (location.hash = '#/home');
        });
      };

      const saveDraft = () => {
        localStorage.setItem(draftKey, JSON.stringify({
          title: document.getElementById('peTitle').value,
          desc: document.getElementById('peDesc').value,
          pics: state.pics, category: state.category, price: state.price,
          originalPrice: state.originalPrice, allowBargain: state.allowBargain,
          tradeMode: state.tradeMode, cond: state.cond, place: state.place,
          delivery: state.delivery, auctionHours: state.auctionHours,
          wantText: (document.getElementById('wantText') || {}).value || '',
          wantCategory: (document.getElementById('wantCategory') || {}).value || '',
        }));
      };
      const showError = (msg) => {
        const el = document.getElementById('peError');
        if (!el) return;
        el.textContent = msg;
        el.classList.toggle('show', !!msg);
      };
      const clearError = () => showError('');
      ['peTitle', 'peDesc'].forEach((id) => document.getElementById(id).addEventListener('input', () => {
        clearError();
        document.getElementById(id).classList.remove('err');
        saveDraft();
      }));

      /* 图片 */
      const picsBox = document.getElementById('pePics');
      const addBtn = document.getElementById('peAdd');
      const renderPics = () => {
        picsBox.querySelectorAll('.pe-thumb-wrap').forEach((n) => n.remove());
        state.pics.forEach((p, i) => {
          const wrap = document.createElement('div');
          wrap.className = 'pe-thumb-wrap';
          wrap.draggable = true;
          wrap.dataset.i = i;
          wrap.innerHTML = `<img class="pe-thumb" src="${p}" alt="">
            <span class="x" data-del="${i}">${icon('close', 11)}</span>
            ${i === 0 ? '<span class="first">首图</span>' : ''}`;
          wrap.querySelector('[data-del]').addEventListener('click', (e) => {
            e.stopPropagation();
            state.pics.splice(i, 1); renderPics(); saveDraft();
          });
          wrap.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', String(i)); e.dataTransfer.effectAllowed = 'move'; });
          wrap.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
          wrap.addEventListener('drop', (e) => {
            e.preventDefault();
            const from = Number(e.dataTransfer.getData('text/plain'));
            if (isNaN(from) || from === i) return;
            const [m] = state.pics.splice(from, 1);
            state.pics.splice(i, 0, m);
            renderPics(); saveDraft();
          });
          picsBox.insertBefore(wrap, addBtn);
        });
        addBtn.style.display = state.pics.length >= 9 ? 'none' : 'flex';
      };
      renderPics();

      document.getElementById('peFile').addEventListener('change', async (e) => {
        const files = [...(e.target.files || [])];
        if (!files.length) return;
        for (const f of files) {
          if (state.pics.length >= 9) { toast('最多 9 张'); break; }
          try { const r = await api.upload(f); state.pics.push(r.url); } catch (err) { toast('上传失败：' + err.message); }
        }
        renderPics(); saveDraft(); e.target.value = '';
      });

      /* 模板 */
      view.querySelectorAll('[data-tpl]').forEach((c) => c.addEventListener('click', () => {
        const el = document.getElementById('peDesc');
        el.value = (el.value ? el.value.replace(/\s+$/, '') + '\n' : '') + TEMPLATES[c.dataset.tpl];
        saveDraft(); el.focus();
      }));

      /* 选择面板 */
      const pickSheet = (title, items, cur, cb) => {
        openSheet(title, `<div class="pe-chips">${items.map((x) =>
          `<span class="chip${x === cur ? ' on' : ''}" data-v="${esc(x)}">${esc(x)}</span>`).join('')}</div>`, {
          onMount(sheet, close) {
            sheet.querySelectorAll('.chip').forEach((c) => c.addEventListener('click', () => { cb(c.dataset.v); close(); }));
          },
        });
      };

      const cate = document.getElementById('peCate');
      cate.addEventListener('click', () => {
        pickSheet('选择分类', CATEGORIES, state.category, (v) => {
          state.category = v;
          const el = document.getElementById('cateVal');
          el.textContent = ''; el.insertAdjacentHTML('beforeend', v + icon('right', 16));
          el.classList.add('on'); el.classList.remove('err');
          saveDraft();
        });
      });

      const setPrice = (elId, key) => {
        openSheet(key === 'price' ? '设置价格' : '设置原价', `
          <div style="display:flex;align-items:center;gap:8px;border-bottom:1px solid var(--line);padding-bottom:10px">
            <span style="font-size:22px;color:var(--red-500);font-weight:800">¥</span>
            <input id="priceIn" type="number" min="0" step="0.01" value="${state[key] || ''}" placeholder="0.00" style="border:0;outline:none;font-size:24px;font-weight:700;width:100%">
          </div>
          <label style="display:flex;align-items:center;margin-top:16px;font-size:15px">可小刀
            <span class="switch${state.allowBargain ? ' on' : ''}" id="sheetBargain" style="margin-left:auto"></span></label>
          <button class="btn btn--block" style="margin-top:18px" id="priceGo">确定</button>`, {
          onMount(sheet, close) {
            const sw = sheet.querySelector('#sheetBargain');
            sw.addEventListener('click', () => sw.classList.toggle('on'));
            sheet.querySelector('#priceGo').addEventListener('click', () => {
              const v = sheet.querySelector('#priceIn').value;
              state[key] = v;
              if (key === 'price') {
                const el = document.getElementById('priceVal');
                el.textContent = ''; el.insertAdjacentHTML('beforeend', (v ? '¥' + v : '¥0.00') + icon('right', 16));
              } else {
                const el = document.getElementById('origVal');
                el.textContent = ''; el.insertAdjacentHTML('beforeend', (v ? '¥' + v : '选填') + icon('right', 16));
              }
              state.allowBargain = sw.classList.contains('on');
              const bs = document.getElementById('bargainSw');
              if (bs) bs.classList.toggle('on', state.allowBargain);
              saveDraft(); close();
            });
          },
        });
      };
      if (document.getElementById('pePrice')) document.getElementById('pePrice').addEventListener('click', () => setPrice('priceVal', 'price'));
      if (document.getElementById('peOrig')) document.getElementById('peOrig').addEventListener('click', () => setPrice('origVal', 'originalPrice'));

      const tradeRow = document.getElementById('peTrade');
      if (tradeRow) tradeRow.addEventListener('click', () => {
        openSheet('交易方式', `<div class="set-card">
          <div class="set-row" data-m="1">出售<span class="set-row__arrow">${icon('right', 16)}</span></div>
          <div class="set-row" data-m="2">以物换物<span class="set-row__arrow">${icon('right', 16)}</span></div>
          <div class="set-row" data-m="3">拍卖<span class="set-row__arrow">${icon('right', 16)}</span></div>
        </div>`, {
          onMount(sheet, close) {
            sheet.querySelectorAll('[data-m]').forEach((row) => row.addEventListener('click', () => {
              state.tradeMode = Number(row.dataset.m);
              document.getElementById('tradeVal').childNodes[0].nodeValue = tradeName(state.tradeMode);
              document.getElementById('peWantCategoryRow').style.display = state.tradeMode === 2 ? 'flex' : 'none';
          document.getElementById('peWantRow').style.display = state.tradeMode === 2 ? 'flex' : 'none';
              close(); saveDraft();
            }));
          },
        });
      });

      const hoursRow = document.getElementById('peHours');
      if (hoursRow) hoursRow.addEventListener('click', () => {
        pickSheet('拍卖时长', ['1 小时', '6 小时', '12 小时', '24 小时', '48 小时', '72 小时'], state.auctionHours + ' 小时', (v) => {
          state.auctionHours = Number(v.replace(' 小时', ''));
          document.getElementById('hoursVal').textContent = '';
          document.getElementById('hoursVal').insertAdjacentHTML('beforeend', state.auctionHours + ' 小时' + icon('right', 16));
          saveDraft();
        });
      });

      view.querySelectorAll('#peCond .chip').forEach((c) => c.addEventListener('click', () => {
        view.querySelectorAll('#peCond .chip').forEach((x) => x.classList.remove('on'));
        c.classList.add('on'); state.cond = c.dataset.v; saveDraft();
      }));

      document.getElementById('pePlace').addEventListener('click', () => {
        pickSheet('校内面交点', PLACES, state.place, (v) => {
          state.place = v;
          document.getElementById('placeVal').textContent = '';
          document.getElementById('placeVal').insertAdjacentHTML('beforeend', esc(v) + icon('right', 16));
          saveDraft();
        });
      });

      document.getElementById('peDeliver').addEventListener('click', () => {
        pickSheet('送达方式', ['仅面交', '校内可送'], state.delivery, (v) => {
          state.delivery = v;
          document.getElementById('deliverVal').textContent = '';
          document.getElementById('deliverVal').insertAdjacentHTML('beforeend', esc(v) + icon('right', 16));
          saveDraft();
        });
      });

      const bargain = document.getElementById('bargainSw');
      if (bargain) bargain.addEventListener('click', () => { bargain.classList.toggle('on'); state.allowBargain = bargain.classList.contains('on'); saveDraft(); });

      /* 发布 */
      document.getElementById('peSubmit').addEventListener('click', async () => {
        const title = document.getElementById('peTitle').value.trim();
        const desc = document.getElementById('peDesc').value.trim();
        const cateEl = document.getElementById('cateVal');
        const errs = [];
        clearError();
        document.getElementById('peTitle').classList.remove('err');
        cateEl.classList.remove('err');
        if (!title) {
          document.getElementById('peTitle').classList.add('err');
          errs.push('标题不能为空');
          document.getElementById('peTitle').focus();
        }
        if (!state.category) {
          cateEl.classList.add('err');
          errs.push('请选择分类');
        }
        if (kind.mode !== 2 && !state.price) errs.push('请填写价格');
        if (errs.length) { showError(errs.join('；')); return; }
        const btn = document.getElementById('peSubmit');
        btn.disabled = true;
        try {
          if (kind.mode === 2) {
            const offeredItemId = Number(document.getElementById('wishOffer').value) || null;
            await api.post('/api/wish', { title, content: desc, category: state.category, offeredItemId });
          } else {
            const priceCents = Math.round(Number(state.price) * 100);
            const origCents = state.originalPrice ? Math.round(Number(state.originalPrice) * 100) : null;
            const body = {
              title,
              category: state.category,
              conditionLevel: state.cond,
              brand: item?.brand || '',
              description: desc,
              images: state.pics.join(','),
              expectDesc: state.tradeMode === 2 ? ((document.getElementById('wantText') || {}).value || '想换同类好物') : '',
              wantText: state.tradeMode === 2 ? ((document.getElementById('wantText') || {}).value || '') : '',
              price: priceCents,
              originalPrice: origCents,
              tradeMode: state.tradeMode,
              place: state.place,
              delivery: state.delivery,
              allowBargain: state.allowBargain ? 1 : 0,
              wantCategory: state.tradeMode === 2 ? ((document.getElementById('wantCategory') || {}).value || state.category) : state.category,
              matchMode: item?.matchMode || 'passive',
            };
            if (itemId) {
              await api.put('/api/item/' + itemId, body);
              localStorage.removeItem(draftKey);
              toast('已保存');
              location.replace('#/me/onshelf');
              return;
            }
            const r = await api.post('/api/item', body);
            if (kind.mode === 3) {
              await api.post('/api/auction', {
                itemId: r.itemId,
                title,
                description: desc,
                amount: String(state.price),
                hours: state.auctionHours,
                image: state.pics[0] || '',
              });
            }
          }
          localStorage.removeItem(draftKey);
          view.innerHTML = `
            <div class="pe-success">
              <img src="assets/brand/mascot-check.png" alt="换一圈吉祥物">
              <h2>${kind.mode === 2 ? '心愿已发布' : '已提交审核'}</h2>
              <p>${kind.mode === 2 ? '有同学愿意换时，会第一时间通知你。' : '审核通过就上架，同校同学就能看到啦。'}</p>
              <div class="btns">
                <button class="btn btn--ghost" onclick="location.hash='#/publish/edit/${params.kind}'">再发一件</button>
                <button class="btn" onclick="location.hash='${kind.mode === 2 ? '#/wish' : '#/me/onshelf'}'">去看看</button>
              </div>
            </div>`;
        } catch (e) {
          showError(e.message || '发布失败，请稍后再试');
          btn.disabled = false;
        }
      });
    },
  };

  /* ============================================================ 发心愿 */
  function renderWish(view) {
    const draft = JSON.parse(localStorage.getItem('draft:wish') || '{}');
    view.innerHTML = `
      <div class="pe-page">
        <div class="pe-head">
          <button class="x" onclick="history.back()">${icon('close', 24)}</button>
          <h1>发心愿</h1>
          <button class="pe-submit" id="wishSubmit">发布</button>
        </div>
        <div class="pe-card">
          <div style="display:flex;align-items:center;gap:10px;padding:2px 0 10px">
            <img src="assets/brand/mascot-wave-320.webp" style="width:58px;height:58px;object-fit:contain" alt="">
            <div style="font-size:13px;color:var(--ink-500);line-height:1.5">把想要的东西挂出来，<br>有同学愿意换时会通知你。</div>
          </div>
          <input class="pe-title-in" id="wishTitle" maxlength="100" placeholder="想要什么？比如：一台宿舍静音小冰箱" value="${esc(draft.title || '')}">
          <textarea class="pe-desc-in" id="wishDesc" style="min-height:150px" maxlength="500" placeholder="补充预算、成色要求、你愿意拿什么换…">${esc(draft.content || '')}</textarea>
        </div>
        <div class="pe-form">
          <div class="pe-row" id="wishCate">
            <span>分类</span>
            <span class="pe-row__v ${draft.category ? 'on' : 'err'}" id="wishCateVal">${esc(draft.category || '请选择')}${icon('right', 16)}</span>
          </div>
        </div>
        <div class="pe-hint">心愿会展示在「我的心愿」里，也会参与平台的被动匹配。</div>
      </div>`;

    let category = draft.category || '';
    const save = () => localStorage.setItem('draft:wish', JSON.stringify({
      title: document.getElementById('wishTitle').value,
      content: document.getElementById('wishDesc').value,
      category,
    }));
    ['wishTitle', 'wishDesc'].forEach((id) => document.getElementById(id).addEventListener('input', save));
    document.getElementById('wishCate').addEventListener('click', () => {
      openSheet('选择分类', `<div class="pe-chips">${CATEGORIES.map((c) => `<span class="chip${c === category ? ' on' : ''}" data-v="${c}">${c}</span>`).join('')}</div>`, {
        onMount(sheet, close) {
          sheet.querySelectorAll('.chip').forEach((c) => c.addEventListener('click', () => {
            category = c.dataset.v;
            const el = document.getElementById('wishCateVal');
            el.textContent = ''; el.insertAdjacentHTML('beforeend', category + icon('right', 16));
            el.classList.add('on'); el.classList.remove('err');
            save(); close();
          }));
        },
      });
    });
    document.getElementById('wishSubmit').addEventListener('click', async () => {
      const title = document.getElementById('wishTitle').value.trim();
      const content = document.getElementById('wishDesc').value.trim();
      if (!title) { toast('写一下想要什么'); return; }
      if (!category) { toast('选个分类'); return; }
      try {
        await api.post('/api/wish', { title, content, category });
        localStorage.removeItem('draft:wish');
        view.innerHTML = `<div class="pe-success">
          <img src="assets/brand/mascot-wave-320.webp" alt="">
          <h2>心愿已发布</h2>
          <p>有同学愿意换时，会第一时间通知你。</p>
          <div class="btns">
            <button class="btn btn--ghost" onclick="location.hash='#/publish/edit/wish'">再发一个</button>
            <button class="btn" onclick="location.hash='#/wish'">去看看</button>
          </div></div>`;
      } catch (e) { toast(e.message); }
    });
  }

  window.PAGES = PAGES;
})();
