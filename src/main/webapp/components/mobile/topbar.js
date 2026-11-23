function topbar(title, opts) {
  const o = opts || {};
  return `<div class="topbar${o.white ? ' topbar--white' : ''}">
      <button class="topbar__back" onclick="${o.onBack || `smartBack('${o.parent || '#/home'}')`}">${icon('back', 22)}</button>
      <div class="topbar__spacer"></div>
      <div class="topbar__title">${esc(title)}</div>
      <div class="topbar__spacer"></div>
      ${o.right || ''}
    </div>`;
}

export { topbar };
