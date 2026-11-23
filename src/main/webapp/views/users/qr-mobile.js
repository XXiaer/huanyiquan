/* 手机端扫一扫与扫码登录桌面端授权确认 */
(function () {
  const PAGES = window.PAGES || {};

  function extractQrValue(raw) {
    const t = String(raw || '').trim();
    if (!t) return '';
    const m = t.match(/[?&#]qr=([A-Za-z0-9_-]{12,64})/);
    if (m) return m[1];
    if (t.startsWith('HYQ_QR:')) return t.slice(7).trim();
    return t;
  }

  function isDesktopLoginQr(raw) {
    const t = String(raw || '').trim();
    return /[?&#]qr=[A-Za-z0-9_-]{12,64}/.test(t) || t.startsWith('HYQ_QR:') || /^[0-9]{6}$/.test(t);
  }
  window.isDesktopLoginQr = isDesktopLoginQr;

  let qrFallback;
  function loadQrFallback() {
    if (typeof window.jsQR === 'function') return Promise.resolve(window.jsQR);
    if (!qrFallback) {
      qrFallback = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = '/assets/vendor/jsQR.js?v=2.2.0';
        script.onload = () => resolve(window.jsQR);
        script.onerror = () => { script.remove(); reject(new Error('扫码组件加载失败')); };
        document.head.append(script);
      }).catch(() => { qrFallback = null; return null; });
    }
    return qrFallback;
  }

  async function decodeCanvasQr(canvas, imgOrVideo) {
    if ('BarcodeDetector' in window) {
      try {
        const detector = new BarcodeDetector({ formats: ['qr_code'] });
        const hits = await detector.detect(imgOrVideo || canvas);
        if (hits && hits.length && hits[0].rawValue) {
          return hits[0].rawValue.trim();
        }
      } catch (ignore) {}
    }
    const decoder = await loadQrFallback();
    if (typeof decoder === 'function') {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx && canvas.width > 0 && canvas.height > 0) {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = decoder(imgData.data, imgData.width, imgData.height, { inversionAttempts: 'attemptBoth' });
        if (code && code.data) return code.data.trim();
      }
    }
    return '';
  }
  window.decodeCanvasQr = decodeCanvasQr;

  function topbar(title, onBack) {
    return `<div class="topbar">
      <button class="topbar__back" type="button" onclick="${onBack || "smartBack('#/me')"}">${icon('back', 22)}</button>
      <div class="topbar__spacer"></div>
      <div class="topbar__title">${esc(title)}</div>
      <div class="topbar__spacer"></div>
    </div>`;
  }

  /* ============================================================ 扫一扫 */
  PAGES.scan = {
    noTab: true,
    async render(view) {
      view.innerHTML = `<div class="qr-scan-page">
        ${topbar('扫一扫')}
        <div class="qr-scan-body">
          <div class="qr-cam-box" id="qrCamBox">
            <video id="qrVideo" playsinline webkit-playsinline="true" muted autoplay></video>
            <div class="qr-reticle" id="qrReticle">
              <i class="c tl"></i><i class="c tr"></i><i class="c bl"></i><i class="c br"></i>
              <div class="qr-scan-line"></div>
            </div>
            <div class="qr-cam-tools">
              <button type="button" class="qr-cam-pill" id="qrSwitchCam" hidden>切换镜头</button>
              <button type="button" class="qr-cam-pill" id="qrRetryCam" hidden>开启相机</button>
            </div>
            <div class="qr-cam-fallback" id="qrCamHint">点击开启相机，扫描换一圈二维码</div>
          </div>

          <div class="qr-actions-card">
            <label class="qr-pick-btn">
              <input id="qrImgFile" type="file" accept="image/*" capture="environment" hidden>
              ${icon('camera', 18)}
              <span>拍照识别</span>
            </label>

            <label class="qr-pick-btn"><input id="qrGalleryFile" type="file" accept="image/*" hidden>从相册识别</label>
            <form class="qr-pair-form" id="qrPairForm">
              <input id="qrPairInput" inputmode="numeric" maxlength="6" pattern="[0-9]{6}" placeholder="或输入电脑端 6 位配对码" aria-label="6位配对码" required>
              <button class="btn btn--sm" type="submit">配对登录</button>
            </form>
            <p class="qr-hint-line" id="qrScanMsg">将换一圈桌面端登录二维码放入框内即可自动识别。</p>
          </div>
        </div>
      </div>`;

      const video = document.getElementById('qrVideo');
      const hint = document.getElementById('qrCamHint');
      const msgEl = document.getElementById('qrScanMsg');
      const retryBtn = document.getElementById('qrRetryCam');
      const switchBtn = document.getElementById('qrSwitchCam');
      const fileInput = document.getElementById('qrImgFile');
      const pairForm = document.getElementById('qrPairForm');
      const workCanvas = document.createElement('canvas');

      const galleryInput = document.getElementById('qrGalleryFile');
      let generation = 0;
      let decoding = false;
      let stream = null;
      let timer = null;
      let handled = false;
      let facingMode = 'environment';

      function stopCamera() {
        generation++;
        if (timer) { clearInterval(timer); timer = null; }
        if (stream) {
          stream.getTracks().forEach((t) => { try { t.stop(); } catch (ignore) {} });
          stream = null;
        }
        if (video) {
          try { video.srcObject = null; } catch (ignore) {}
          video.classList.remove('is-live');
        }
      }

      window.__cleanup = stopCamera;

      function handleDecoded(rawValue) {
        if (handled || !rawValue) return;
        handled = true;
        stopCamera();
        if (isDesktopLoginQr(rawValue)) {
          const qrVal = extractQrValue(rawValue);
          location.hash = '#/qr-confirm?qr=' + encodeURIComponent(qrVal);
        } else {
          location.hash = '#/search/' + encodeURIComponent(rawValue);
        }
      }

      async function startCamera() {
        stopCamera();
        const request = generation;
        retryBtn.hidden = true;
        if (!window.isSecureContext || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          hint.style.display = 'block';
          hint.textContent = window.isSecureContext
            ? '当前浏览器未提供相机接口，请点击下方「拍照或从相册选择二维码」或输入 6 位配对码'
            : '相机直连需在 HTTPS 域名下使用（如 huanyiquan.me）；当前环境可使用下方拍照选图或 6 位配对码';
          retryBtn.hidden = true;
          return;
        }
        hint.style.display = 'block';
        hint.textContent = '正在请求摄像头权限…';
        try {
          const opened = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false,
          });
          if (!video.isConnected || request !== generation) { opened.getTracks().forEach(track => track.stop()); return; }
          stream = opened;
          video.srcObject = stream;
          await video.play();
          if (!video.isConnected || request !== generation) return;
          video.classList.add('is-live');
          hint.style.display = 'none';
          retryBtn.hidden = true;
          switchBtn.hidden = false;

          timer = setInterval(async () => {
            if (decoding || handled || !video.isConnected || video.readyState < 2 || !video.videoWidth) return;
            const scale = Math.min(1, 720 / video.videoWidth);
            workCanvas.width = Math.round(video.videoWidth * scale);
            workCanvas.height = Math.round(video.videoHeight * scale);
            const ctx = workCanvas.getContext('2d', { willReadFrequently: true });
            ctx.drawImage(video, 0, 0, workCanvas.width, workCanvas.height);
            decoding = true;
            try {
              const val = await decodeCanvasQr(workCanvas, video);
              if (request === generation && val) handleDecoded(val);
            } catch (error) { /* keep scanning subsequent frames */ }
            finally { decoding = false; }
          }, 220);
        } catch (err) {
          if (request !== generation) return;
          stopCamera();
          retryBtn.hidden = false;
          switchBtn.hidden = true;
          hint.style.display = 'block';
          if (err && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
            hint.textContent = '相机权限未开启：请在浏览器地址栏允许访问摄像头，然后点击右上角「开启相机」重试';
          } else {
            hint.textContent = '未检测到可用摄像头或被系统拦截，可点击「开启相机」重试，或用下方拍照选图 / 配对码';
          }
        }
      }

      retryBtn.addEventListener('click', () => startCamera());
      switchBtn.addEventListener('click', () => {
        facingMode = facingMode === 'environment' ? 'user' : 'environment';
        startCamera();
      });

      async function decodeFile(event) {
        const input = event.currentTarget;
        const file = input.files?.[0];
        input.value = '';
        if (!file) return;
        msgEl.textContent = '正在识别图片中的二维码…';
        try {
          const url = URL.createObjectURL(file);
          const img = new Image();
          try {
            await new Promise((resolve,reject) => {
              img.onload = resolve;
              img.onerror = () => reject(new Error('无法读取图片，请选择 JPEG 或 PNG'));
              img.src = url;
            });
          } finally { URL.revokeObjectURL(url); }
          if (!video.isConnected || handled) return;
          const scale = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
          const photoCanvas = document.createElement('canvas');
          photoCanvas.width = Math.round(img.naturalWidth * scale);
          photoCanvas.height = Math.round(img.naturalHeight * scale);
          const ctx = photoCanvas.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(img, 0, 0, photoCanvas.width, photoCanvas.height);
          const val = await decodeCanvasQr(photoCanvas, photoCanvas);
          if (!video.isConnected || handled) return;
          if (!val) {
            msgEl.textContent = '未在图片中检测到二维码，请对准桌面端重新拍摄或输入 6 位配对码';
            return;
          }
          handleDecoded(val);
        } catch (e) {
          msgEl.textContent = e.message || '图片识别失败';
        }
      }
      fileInput.addEventListener('change', decodeFile);
      galleryInput.addEventListener('change', decodeFile);

      pairForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const code = (document.getElementById('qrPairInput').value || '').trim();
        if (!/^[0-9]{6}$/.test(code)) {
          toast('请输入 6 位数字配对码');
          return;
        }
        handleDecoded(code);
      });

      hint.textContent = window.isSecureContext ? '点击开启相机，扫描换一圈二维码' : '实时扫码请在 HTTPS 主站打开，也可拍照识别。';
      retryBtn.hidden = !window.isSecureContext;
    },
  };

  /* ============================================================ 桌面端扫码确认授权 */
  PAGES.qrConfirm = {
    noTab: true,
    async render(view) {
      const hash = location.hash || '';
      const qIdx = hash.indexOf('?');
      const qs = qIdx >= 0 ? new URLSearchParams(hash.slice(qIdx + 1)) : new URLSearchParams();
      const rawQr = qs.get('qr') || sessionStorage.getItem('hq.pendingQr') || '';

      if (!rawQr) {
        view.innerHTML = `<div class="qr-confirm-page">${topbar('扫码登录')}
          <div class="qr-confirm-card">
            <img src="assets/brand/mascot-wave-320.webp" width="96" height="96" alt="">
            <h2>无效的二维码</h2>
            <p>未检测到有效登录码，请重新扫描桌面端二维码。</p>
            <a class="btn btn--block" href="#/scan">重新扫码</a>
          </div></div>`;
        return;
      }

      view.innerHTML = `<div class="qr-confirm-page">${topbar('确认登录桌面端')}
        <div class="qr-confirm-card"><p>正在核验登录状态与二维码…</p></div></div>`;

      try {
        await api.get('/api/user/me');
      } catch (e) {
        sessionStorage.setItem('hq.pendingQr', rawQr);
        toast('请先在手机端登录，再授权桌面端');
        location.hash = '#/login';
        return;
      }

      sessionStorage.removeItem('hq.pendingQr');

      let scanInfo;
      try {
        scanInfo = await api.post('/api/auth/qr/scan', { qr: rawQr });
      } catch (err) {
        view.innerHTML = `<div class="qr-confirm-page">${topbar('扫码登录')}
          <div class="qr-confirm-card">
            <img src="assets/brand/mascot-wave-320.webp" width="96" height="96" alt="">
            <h2>二维码已失效</h2>
            <p>${esc(err.message || '请刷新桌面端二维码后重新扫描')}</p>
            <a class="btn btn--block" href="#/scan">重新扫码</a>
          </div></div>`;
        return;
      }

      view.innerHTML = `<div class="qr-confirm-page">${topbar('确认登录桌面端')}
        <div class="qr-confirm-card">
          <img src="assets/brand/mascot-success.png" width="104" height="104" alt="">
          <h2>确认登录换一圈桌面端</h2>
          <p class="qr-confirm-acct">授权账号：<b>${esc(scanInfo.nickname || '当前账号')}</b></p>
          <p class="qr-confirm-dev">目标设备：${esc(scanInfo.deviceHint || '桌面端浏览器')}（${esc(scanInfo.clientIp || '')}）</p>
          <div class="qr-confirm-btns">
            <button type="button" class="btn btn--block" id="qrConfirmOk">确认登录</button>
            <button type="button" class="btn btn--block btn--ghost" id="qrConfirmCancel">取消登录</button>
          </div>
        </div>
      </div>`;

      const okBtn = document.getElementById('qrConfirmOk');
      const cancelBtn = document.getElementById('qrConfirmCancel');

      okBtn.addEventListener('click', async () => {
        okBtn.disabled = true;
        cancelBtn.disabled = true;
        try {
          await api.post('/api/auth/qr/confirm', { qrId: scanInfo.qrId, action: 'confirm' });
          toast('已授权桌面端登录');
          location.hash = '#/me';
        } catch (err) {
          toast(err.message || '确认失败');
          okBtn.disabled = false;
          cancelBtn.disabled = false;
        }
      });

      cancelBtn.addEventListener('click', async () => {
        try {
          await api.post('/api/auth/qr/confirm', { qrId: scanInfo.qrId, action: 'cancel' });
        } catch (ignore) {}
        toast('已取消桌面端登录');
        location.hash = '#/me';
      });
    },
  };

  window.PAGES = PAGES;
})();
