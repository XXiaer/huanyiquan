(() => {
  function mode(item) {
    return Number(item.tradeMode) || (Number(item.price) > 0 ? 1 : 2);
  }

  function supports(item, tradeMode) {
    const value = mode(item);
    return value === tradeMode || (item.isDemo && value === 4 && (tradeMode === 1 || tradeMode === 2));
  }

  function isSwapOnly(item) {
    // Demo prices are catalogue references, hidden on swap-only examples.
    return mode(item) === 2 && (item.isDemo || !(Number(item.price) > 0));
  }

  function demoLabel(item) {
    return {1:'示例出售', 2:'示例换物', 4:'可换可售'}[mode(item)] || '示例展示';
  }

  async function browse(load, tradeMode, page = 1) {
    for (;;) {
      const result = await load(page);
      const rows = (result.list || []).filter(item => tradeMode === 2 ? isSwapOnly(item) : supports(item, tradeMode));
      if (rows.length || !result.hasMore) return { rows, page, hasMore: Boolean(result.hasMore) };
      page += 1;
    }
  }

  function relay({ wish, rows, fallback }) {
    return `<section class="relay-layout">
      <header class="relay-intro">
        <div>
          <h1>换物接力</h1>
          <p>两个人换不到，就找第三位同学一起换。三件物品形成闭环后，系统会通知三方。</p>
          <a class="relay-primary" href="${wish}">发布接力心愿</a>
        </div>
        <img src="/assets/brand/mascot-box.png" alt="" width="160" height="160">
      </header>
      <ol class="relay-process" aria-label="接力流程">
        <li><b>选一件好物</b><span>关联愿意拿来交换的物品</span></li>
        <li><b>写下想换的</b><span>明确你希望收到什么</span></li>
        <li><b>等三方匹配</b><span>闭环后再一起确认</span></li>
      </ol>
      <section class="relay-inventory">
        <h2>我的接力物品</h2>
        ${rows ? `<div class="relay-inventory-list">${rows}</div>` : `<div class="relay-empty">${fallback}</div>`}
      </section>
    </section>`;
  }

  window.campusExchange = {mode, supports, isSwapOnly, demoLabel, browse, relay};
})();

