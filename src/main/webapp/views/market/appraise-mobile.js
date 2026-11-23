import { topbar as renderTopbar } from "../../components/mobile/topbar.js";

const PAGES = window.PAGES;

function topbar(title, options) {
  return renderTopbar(title, { ...options, parent: options?.parent || "#/me" });
}

PAGES.appraise = {
  noTab: true,
  async render(view) {
    view.innerHTML = `
      ${topbar('AI 好物估价', { parent: '#/home' })}
      <div class="ap-page">
        <label class="ap-hero-upload" id="apPhotoBox">
          <input id="apFile" type="file" accept="image/*" capture="environment" hidden>
          <img id="apPreview" class="ap-hero-upload__img" hidden alt="">
          <div class="ap-hero-upload__empty" id="apPhotoEmpty">
            <span class="ap-corner ap-corner--tl"></span>
            <span class="ap-corner ap-corner--tr"></span>
            <span class="ap-corner ap-corner--bl"></span>
            <span class="ap-corner ap-corner--br"></span>
            <div class="ap-hero-upload__icon">${icon('camera', 26)}</div>
            <b>拍照或上传物品图</b>
          </div>
          <button type="button" class="ap-hero-upload__clear" id="apClear" hidden>重选</button>
        </label>

        <div id="apResult" aria-live="polite"></div>

        <section class="ap-card">
          <div class="ap-row">
            <label for="apTitle">物品名称</label>
            <input id="apTitle" placeholder="例如 罗技GPW / 高数教材">
          </div>
          <div class="ap-row">
            <label for="apOrig">入手原价</label>
            <div class="ap-row__price"><em>¥</em><input id="apOrig" type="number" placeholder="选填"></div>
          </div>
        </section>

        <section class="ap-card">
          <div class="ap-card__title">分类</div>
          <div class="ap-grid-chips" id="apCate">${['教材', '数码', '运动', '生活', '衣物', '绿植', '其他']
          .map((c) => `<button type="button" class="ap-chip" data-v="${c}">${c}</button>`).join('')}</div>
          <div class="ap-card__title" style="margin-top:14px">成色</div>
          <div class="ap-grid-chips" id="apCond">${['全新', '九成新', '七成新', '有使用痕迹']
          .map((c) => `<button type="button" class="ap-chip" data-v="${c}">${c}</button>`).join('')}</div>
        </section>
      </div>
      <div class="ap-bottom-bar">
        <button class="btn btn--block" id="apGo" type="button">AI 估价</button>
      </div>`;
    let cate = '', cond = '', photoDataUrl = '';
    const fileInput = document.getElementById('apFile');
    const preview = document.getElementById('apPreview');
    const emptyBox = document.getElementById('apPhotoEmpty');
    const clearBtn = document.getElementById('apClear');
    fileInput.addEventListener('change', async () => {
      const f = fileInput.files && fileInput.files[0];
      if (!f) return;
      try {
        const { dataUrl } = await window.compressImageFile(f, 768);
        photoDataUrl = dataUrl;
        preview.src = dataUrl;
        preview.hidden = false;
        emptyBox.hidden = true;
        clearBtn.hidden = false;
      } catch (e) { toast(e.message); }
    });
    clearBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      photoDataUrl = '';
      fileInput.value = '';
      preview.hidden = true;
      emptyBox.hidden = false;
      clearBtn.hidden = true;
    });
    ['apCate', 'apCond'].forEach((id) => {
      view.querySelectorAll('#' + id + ' .ap-chip').forEach((c) => c.addEventListener('click', () => {
        view.querySelectorAll('#' + id + ' .ap-chip').forEach((x) => x.classList.remove('on'));
        c.classList.add('on');
        if (id === 'apCate') cate = c.dataset.v; else cond = c.dataset.v;
      }));
    });
    const goBtn = document.getElementById('apGo');
    const photoBox = document.getElementById('apPhotoBox');
    const resultBox = document.getElementById('apResult');
    goBtn.addEventListener('click', async () => {
      const title = document.getElementById('apTitle').value.trim();
      const orig = Number(document.getElementById('apOrig').value || 0);
      if (!photoDataUrl && !cate && !title) { toast('请拍照或选择分类'); return; }
      goBtn.disabled = true;
      goBtn.textContent = '正在估价中…';
      photoBox.classList.add('is-scanning');
      resultBox.innerHTML = `
          <div class="ap-loading">
            <div class="ap-loading__stage">
              <span class="ap-loading__ring"></span>
              <span class="ap-loading__ring ap-loading__ring--delay"></span>
              <img class="ap-loading__mascot" src="assets/brand/mascot-search.png" alt="正在估价中">
            </div>
            <div class="ap-loading__title">
              <span>正在估价中</span>
              <i class="ap-loading__dots"><b></b><b></b><b></b></i>
            </div>
          </div>`;
      resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      try {
        const res = await api.post('/api/ai/appraise', {
          image: photoDataUrl || '',
          category: cate,
          condition: cond,
          origPrice: orig > 0 ? Math.round(orig) : 0,
          title,
        });
        resultBox.innerHTML = `
            <div class="appraise-result-card">
              <div class="appraise-result-card__name">${esc(res.name || title || cate)}</div>
              <div class="appraise-result-card__price"><em>¥</em><b>${res.lowPrice} – ${res.highPrice}</b></div>
              <div class="appraise-result-card__tags">
                ${res.category ? `<span class="badge badge--green">${esc(res.category)}</span>` : ''}
                ${res.condition ? `<span class="badge badge--gray">${esc(res.condition)}</span>` : ''}
                ${(res.tags || []).map(t => `<span class="badge badge--orange">${esc(t)}</span>`).join('')}
              </div>
              <a class="btn btn--ghost btn--sm" href="#/publish/edit/idle">按此价发布</a>
            </div>`;
      } catch (e) {
        if (cate) {
          try {
            const d = await api.get('/api/item/list', { category: cate, page: 1, size: 50 });
            const list = (d.list || []).filter((i) => i.price);
            if (list.length) {
              const ps = list.map((i) => i.price).sort((a, b) => a - b);
              const lo = ps[Math.floor(ps.length * 0.25)];
              const hi = ps[Math.floor(ps.length * 0.75)];
              resultBox.innerHTML = `
                  <div class="appraise-result-card">
                    <div class="appraise-result-card__price"><em>¥</em><b>${api.yuan(lo)} – ${api.yuan(hi)}</b></div>
                    <div class="appraise-result-card__tags"><span class="badge badge--green">${list.length} 件样本</span></div>
                    <a class="btn btn--ghost btn--sm" href="#/publish/edit/idle">按此价发布</a>
                  </div>`;
              return;
            }
          } catch (ignore) {}
        }
        resultBox.innerHTML = '';
        toast(e.message || '估价失败，请重试');
      } finally {
        photoBox.classList.remove('is-scanning');
        goBtn.disabled = false;
        goBtn.textContent = 'AI 估价';
      }
    });
  },
};
