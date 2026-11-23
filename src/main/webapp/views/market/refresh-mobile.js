import { topbar as renderTopbar } from "../../components/mobile/topbar.js";

const PAGES = window.PAGES;

function topbar(title, options) {
  return renderTopbar(title, { ...options, parent: options?.parent || "#/me" });
}

PAGES.refreshPick = {
  tab: 'me',
  async render(view) {
    let list = [];
    try { list = await api.get('/api/item/mine') || []; } catch (e) { /* 未登录 */ }
    const can = list.filter((i) => i.status === 1 || i.status === 5);
    view.innerHTML = `
        ${topbar('一键擦亮')}
        <div style="padding:0 13px 20px">
          <div class="tool-card" style="display:flex;align-items:center;gap:12px">
            <img src="assets/brand/mascot-wave-320.webp" style="width:60px;height:60px;object-fit:contain" alt="">
            <div>
              <div style="font-size:16px;font-weight:700">擦亮让宝贝排到前面</div>
              <div style="font-size:12.5px;color:var(--ink-500);margin-top:3px">每件每天可以擦亮一次</div>
            </div>
          </div>
          <div class="set-card">
            ${can.length ? can.map((i) => `
              <div class="set-row" style="height:auto;padding:12px 14px;gap:12px">
                <img src="${api.firstPic(i)}" style="width:46px;height:46px;border-radius:7px;object-fit:cover" alt="">
                <div style="flex:1;min-width:0">
                  <div style="font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(i.title)}</div>
                  <div style="font-size:11px;color:var(--ink-500);margin-top:3px">${fmtTime(i.updateTime)} 更新</div>
                </div>
                <button class="chip on" data-refresh="${i.id}">擦亮</button>
              </div>`).join('') : '<div class="empty" style="padding:34px 0">还没有在架的宝贝</div>'}
          </div>
        </div>`;
    view.querySelectorAll('[data-refresh]').forEach((btn) => btn.addEventListener('click', async () => {
      try {
        await api.post('/api/social/refresh', { itemId: Number(btn.dataset.refresh) });
        btn.textContent = '已擦亮'; btn.disabled = true; btn.style.opacity = '.5';
        toast('擦亮成功，排序已刷新');
      } catch (e) { toast(e.message); }
    }));
  },
};
