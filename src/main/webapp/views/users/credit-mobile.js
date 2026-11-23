import { topbar as renderTopbar } from "../../components/mobile/topbar.js";

const PAGES = window.PAGES;

function topbar(title, options) {
  return renderTopbar(title, { ...options, parent: options?.parent || "#/me" });
}

PAGES.creditCenter = {
  async render(view, params) {
    const id = params.id || (window.__me ? window.__me.id : 0);
    let logs = [];
    let u = null;
    try {
      const r = await Promise.all([
        api.get('/api/user/' + id + '/credit').catch(() => []),
        api.get('/api/user/' + id).catch(() => null),
      ]);
      logs = r[0] || [];
      u = r[1];
    } catch (e) { /* 忽略 */ }
    const credit = u ? u.credit : 0;
    const lv = creditLevel(credit);
    view.innerHTML = `
        ${topbar('信用中心')}
        <div style="padding:0 13px 20px">
          <div class="credit-hero">
            <div style="font-size:13px;color:var(--ink-500)">${esc(u ? u.nickname : '')} 的信用分</div>
            <div class="num">${credit}</div>
            <div class="lv">${esc(lv)} | 买家权限 ${u ? (Number(u.credit) >= 60 ? '正常' : '受限') : '暂不可用'} / 卖家权限 ${u ? (Number(u.credit) >= 60 ? '正常' : '受限') : '暂不可用'}</div>
            ${u && Number(u.credit) < 60 ? '<p class="hint exchange-danger">信用分低于 60 分，暂不能发提案或发布商品。</p>' : ''}
            <div class="tip">初始 80 分 | 完成一次交换 +2 | 好评加分 | 违约 −5</div>
          </div>
          <div class="sect-title" style="padding:4px 0 10px"><h2 style="font-size:16px">信用变动</h2></div>
          <div class="set-card">
            ${logs.length ? logs.map((l) => {
            const m = String(l.remark || '').match(/([+\-−]\s*\d+)/);
            const delta = m ? Number(m[1].replace(/\s/g, '').replace('−', '-')) : 0;
            return `
              <div class="set-row" style="height:auto;padding:14px 15px;align-items:flex-start">
                <div style="flex:1;min-width:0">
                  <div style="font-size:14px">${esc(l.remark || '信用变动')}</div>
                  <div style="font-size:11px;color:var(--ink-500);margin-top:4px">${fmtTime(l.createTime)}</div>
                </div>
                <span style="font-size:17px;font-weight:700;color:${delta >= 0 ? 'var(--green-700)' : 'var(--red-500)'}">
                  ${delta >= 0 ? '+' : ''}${delta}
                </span>
              </div>`;
          }).join('') : '<div class="empty" style="padding:34px 0">还没有信用变动记录</div>'}
          </div>
        </div>`;
  },
};
