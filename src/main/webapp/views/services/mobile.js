import { topbar as renderTopbar } from "../../components/mobile/topbar.js";

const PAGES = window.PAGES;

function topbar(title, options) {
  return renderTopbar(title, { ...options, parent: options?.parent || "#/me" });
}

PAGES.helpCenter = {
  async render(view) {
    const FAQ = [
      ['怎么发起交换', '在商品页点「聊一聊」或「发起交换」，选择自己的一件闲置作为交换物。对方接受后生成交换单，双方按约定面交并互相确认。'],
      ['为什么发布后没上架', '发布要先过审核与违禁词校验。通过后自动上架；不通过会在「我发布的」里提示原因。'],
      ['信用分怎么算', '初始 80 分。完成一次交换 +2，收到好评按星级加分，超时未交付或举报成立会扣分。低于 60 分不能发布。'],
      ['面交地点选哪里', '建议图书馆门口、缤果大街、宿舍楼下等人多的地方。发布时可以保存常用地点。'],
      ['在哪里举报', '商品页和私聊页右上角都有举报入口，管理员会在 24 小时内处理。'],
    ];
    view.innerHTML = `
        ${topbar('帮助与客服')}
        <div style="padding:0 13px 24px">
          <div class="community-card" style="margin:0 0 10px;display:flex;align-items:center;gap:12px;padding:16px">
            <img src="assets/brand/mascot-logo.png" style="width:52px;height:52px" alt="">
            <div>
              <div style="font-size:16px;font-weight:700">换一圈小管家</div>
              <div style="font-size:12px;color:var(--ink-500);margin-top:3px">工作日 9:00–18:00 在线</div>
            </div>
            <button class="btn btn--sm" id="helpChat" style="margin-left:auto">咨询</button>
          </div>
          <div class="sect-title" style="padding:6px 0 10px"><h2 style="font-size:16px">常见问题</h2></div>
          <div class="set-card">
            ${FAQ.map((f, i) => `
              <div class="set-row" data-faq="${i}" style="height:auto;padding:14px 15px">
                <span style="flex:1;font-size:14px">${f[0]}</span>
                <span class="set-row__arrow">${icon('down', 15)}</span>
              </div>
              <div data-ans="${i}" style="display:none;padding:0 15px 14px;font-size:13px;line-height:1.7;color:var(--ink-500)">${f[1]}</div>`).join('')}
          </div>
          <div class="sect-title" style="padding:18px 0 10px"><h2 style="font-size:16px">联系我们</h2></div>
          <div class="set-card">
            <div class="set-row" id="helpMail">发邮件给学生工作处<span class="set-row__arrow">${icon('right', 16)}</span></div>
            <div class="set-row" id="helpOffer">提交产品建议<span class="set-row__arrow">${icon('right', 16)}</span></div>
          </div>
        </div>`;
    view.querySelectorAll('[data-faq]').forEach((row) => row.addEventListener('click', () => {
      const ans = view.querySelector(`[data-ans="${row.dataset.faq}"]`);
      const open = ans.style.display !== 'none';
      ans.style.display = open ? 'none' : 'block';
      row.querySelector('.set-row__arrow').style.transform = open ? '' : 'rotate(180deg)';
    }));
    document.getElementById('helpMail').addEventListener('click', () => { location.href = 'mailto:xsc@cqytxy.edu.cn?subject=换一圈使用问题'; });
    document.getElementById('helpOffer').addEventListener('click', () => {
      openSheet('提交产品建议', `<textarea class="field field--area" id="ideaText" placeholder="希望换一圈增加什么功能？"></textarea>
          <button class="btn btn--block" style="margin-top:14px" id="ideaGo">提交</button>`, {
        onMount(sheet, close) {
          sheet.querySelector('#ideaGo').addEventListener('click', () => {
            const t = sheet.querySelector('#ideaText').value.trim();
            if (!t) { toast('写点建议'); return; }
            localStorage.setItem('idea:' + Date.now(), t); close(); toast('建议已记录，谢谢你');
          });
        },
      });
    });
    document.getElementById('helpChat').addEventListener('click', async () => {
      try {
        const r = await api.post('/api/conversation/start', { itemId: 37 });
        siteRoutes.go('#/chat/' + r.id);
      } catch (e) { toast(e.message); }
    });
  },
};

PAGES.doorService = {
  async render(view) {
    let list = [];
    let error = '';
    const me = window.__me || await api.get('/api/user/me').catch(() => null);
    const building = me?.building?.trim();
    try {
      const data = await api.get('/api/item/list', { building, page: 1, size: 20 });
      list = data.list || [];
    } catch (e) { error = e.message; }
    view.innerHTML = `
        ${topbar('同楼闲置')}
        ${error ? `<div class="empty" role="status">${esc(error)} <button class="btn btn--ghost btn--sm" id="doorRetry">重试</button></div>`
        : list.length ? waterfall(list) : mascotEmpty(building ? '这栋楼暂时没有闲置' : '暂时没有在架闲置', 'assets/brand/mascot-wave-320.webp', { href: '#/market', text: '去集市看看' })}`;
    view.querySelector('#doorRetry')?.addEventListener('click', () => renderRoute());
  },
};

PAGES.lostFound = {
  tab: 'home',
  async render(view) {
    let list = [];
    let error = '';
    try { list = await api.get('/api/wish') || []; } catch (e) { error = e.message; }
    const lost = list.filter((w) => String(w.title || '').indexOf('【失物】') === 0);
    view.innerHTML = `
        ${topbar('寻物启事', { right: '<button class="campus-service-publish" id="lostNew">发布启事</button>' })}
        <div class="m-subpage">
          ${error ? `<div class="empty" role="status">${esc(error)} <button class="btn btn--ghost btn--sm" id="lostRetry">重试</button></div>` : lost.length ? lost.map((w) => `
            <div class="lost-card">
              <div class="lost-card__head">
                <span class="badge badge--orange">寻物</span>
                <span class="lost-card__time">${fmtTime(w.createdAt)}</span>
              </div>
              <div class="lost-card__title">${esc(String(w.title || '').replace('【失物】', ''))}</div>
              ${w.content ? `<div class="lost-card__desc">${esc(w.content)}</div>` : ''}
              <div class="lost-card__foot">
                ${avatar({ nickname: w.nickname || '同学', id: w.userId || 1, avatar: w.avatar }, 22)}
                <span>${esc(w.nickname || '同学')}</span>
              </div>
            </div>`).join('') : mascotEmpty('还没有失物信息', 'assets/brand/mascot-wave-320.webp')}
        </div>`;
    view.querySelector('#lostRetry')?.addEventListener('click', () => renderRoute());
    document.getElementById('lostNew').addEventListener('click', () => {
      openSheet('发布失物信息', `
          <label class="label" for="lostTitle">丢失物品</label><input class="field" id="lostTitle" maxlength="96" placeholder="例如蓝色雨伞">
          <label class="label" for="lostDesc" style="margin-top:10px">地点、时间和特征</label><textarea class="field field--area" id="lostDesc" maxlength="500"></textarea>
          <button class="btn btn--block" style="margin-top:14px" id="lostGo">发布</button>`, {
        onMount(sheet, close) {
          const submit = sheet.querySelector('#lostGo');
          submit.addEventListener('click', async () => {
            const t = sheet.querySelector('#lostTitle').value.trim();
            const d = sheet.querySelector('#lostDesc').value.trim();
            if (!t) { toast('写一下丢了什么'); return; }
            submit.disabled = true;
            try {
              await api.post('/api/wish', { title: '【失物】' + t, content: d || '帮忙留意一下', category: '其他' });
              close(); toast('已发布'); renderRoute();
            } catch (e) { toast(e.message); }
            finally { submit.disabled = false; }
          });
        },
      });
    });
  },
};
