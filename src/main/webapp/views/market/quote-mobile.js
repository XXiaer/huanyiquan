import { topbar as renderTopbar } from "../../components/mobile/topbar.js";

const PAGES = window.PAGES;

function topbar(title, options) {
  return renderTopbar(title, { ...options, parent: options?.parent || "#/me" });
}

PAGES.marketQuote = {
  tab: 'home',
  async render(view) {
    let rows = [];
    try { rows = await api.get('/api/social/market') || []; } catch (e) { /* 忽略 */ }
    view.innerHTML = `
        ${topbar('行情')}
        <div style="padding:0 13px 20px">
          <div class="tool-card" style="padding:14px;font-size:12.5px;color:var(--ink-500);line-height:1.6">按分类统计当前在架商品的价格，数据来自本站真实挂单。</div>
          ${rows.map((r) => `
            <div class="tool-card" style="margin:0 0 10px;padding:15px">
              <div style="display:flex;align-items:baseline;justify-content:space-between">
                <div style="font-size:17px;font-weight:700">${esc(r.category)}</div>
                <div style="font-size:12px;color:var(--ink-500)">${r.total} 件在架</div>
              </div>
              <div style="display:flex;align-items:baseline;gap:6px;margin-top:10px">
                <span style="font-size:12px;color:var(--ink-500)">均价</span>
                <span class="price" style="font-size:24px"><em>¥</em><b>${api.yuan(r.avg)}</b></span>
              </div>
              <div style="margin-top:10px;height:6px;border-radius:3px;background:var(--green-50);position:relative">
                <div style="position:absolute;left:0;top:0;bottom:0;width:100%;border-radius:3px;background:linear-gradient(90deg,var(--green-100),var(--green-500))"></div>
              </div>
              <div style="display:flex;justify-content:space-between;margin-top:6px;font-size:11px;color:var(--ink-500)">
                <span>最低 ¥${api.yuan(r.min)}</span><span>最高 ¥${api.yuan(r.max)}</span>
              </div>
            </div>`).join('') || mascotEmpty('还没有足够的挂单价格', 'assets/brand/mascot-wave-320.webp')}
        </div>`;
  },
};
