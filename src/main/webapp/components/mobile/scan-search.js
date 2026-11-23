import { compressImageFile } from "../../utils/mobile/images.js";

window.openScanSearch = function () {
  openSheet('扫码或拍照搜好物', `
      <div class="scan-sheet">
        <a class="btn btn--ghost btn--block" href="#/scan" id="goScanLogin">${icon('qr', 18)} 扫一扫登录电脑端 ›</a>
        <label class="scan-sheet__pick">
          <input id="scanFile" type="file" accept="image/*" capture="environment" hidden>
          <img src="assets/brand/mascot-search.png" width="64" height="64" alt="">
          <b>拍照或选择物品图片</b>
        </label>
        <div id="scanStatus" class="scan-sheet__status"></div>
      </div>`, {
    onMount(sheet, close) {
      sheet.querySelector('#goScanLogin')?.addEventListener('click', () => close());
      const input = sheet.querySelector('#scanFile');
      const status = sheet.querySelector('#scanStatus');
      input.addEventListener('change', async () => {
        const file = input.files && input.files[0];
        if (!file) return;
        status.textContent = '正在识别…';
        try {
          const { dataUrl, img } = await compressImageFile(file, 768);
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          await window.ensureMobilePage('scan');
          const decoded = await window.decodeCanvasQr(canvas, img);
          if (decoded) {
            close();
            if (typeof window.isDesktopLoginQr === 'function' && window.isDesktopLoginQr(decoded)) {
              const m = decoded.match(/[?&#]qr=([A-Za-z0-9_-]{12,64})/);
              const qVal = m ? m[1] : decoded;
              siteRoutes.go('#/qr-confirm?qr=' + encodeURIComponent(qVal));
            } else {
              siteRoutes.go('#/search/' + encodeURIComponent(decoded));
            }
            return;
          }
          const res = await api.post('/api/ai/scan-search', { image: dataUrl });
          const kw = (res && res.keyword) || '';
          if (!kw) throw new Error('未能识别出物品');
          close();
          siteRoutes.go('#/search/' + encodeURIComponent(kw));
        } catch (e) {
          status.textContent = e.message || '识别失败，请重试';
        }
      });
    },
  });
};
