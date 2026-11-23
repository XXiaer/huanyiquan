(function () {
  if (window.openHumanCaptcha) return;

  async function jsonReq(url, options) {
    const res = await fetch(url, Object.assign({ credentials: 'same-origin' }, options || {}));
    const json = await res.json();
    if (!json || json.code !== 0) {
      throw new Error((json && json.msg) || '验证请求失败');
    }
    return json.data;
  }

  /**
   * 弹出滑块拼图安全验证。
   * 返回 Promise<string>（一次性 captchaToken）；若用户主动关闭则返回 null。
   */
  window.openHumanCaptcha = function openHumanCaptcha(title) {
    return new Promise((resolve) => {
      const existing = document.querySelector('.hq-cap-mask');
      if (existing) existing.remove();

      const mask = document.createElement('div');
      mask.className = 'hq-cap-mask';
      mask.setAttribute('role', 'dialog');
      mask.setAttribute('aria-modal', 'true');
      mask.setAttribute('aria-label', title || '安全验证');
      mask.innerHTML =
        '<div class="hq-cap-dialog">' +
          '<div class="hq-cap-head">' +
            '<div class="hq-cap-title">' +
              '<span class="hq-cap-shield" aria-hidden="true">✓</span>' +
              '<span>' + (title || '安全验证') + '</span>' +
            '</div>' +
            '<div class="hq-cap-actions">' +
              '<button type="button" class="hq-cap-icon-btn" data-cap-refresh title="换一张" aria-label="刷新拼图">↻</button>' +
              '<button type="button" class="hq-cap-icon-btn" data-cap-close title="关闭" aria-label="关闭验证">✕</button>' +
            '</div>' +
          '</div>' +
          '<div class="hq-cap-stage">' +
            '<img class="hq-cap-bg" alt="拼图背景">' +
            '<img class="hq-cap-piece" alt="">' +
            '<div class="hq-cap-loading">正在生成安全拼图…</div>' +
            '<div class="hq-cap-tip"></div>' +
          '</div>' +
          '<div class="hq-cap-track">' +
            '<div class="hq-cap-fill"></div>' +
            '<span class="hq-cap-track-text">向右拖动滑块完成拼图</span>' +
            '<div class="hq-cap-knob" role="slider" tabindex="0" aria-label="向右拖动滑块完成拼图">→</div>' +
          '</div>' +
        '</div>';

      document.body.appendChild(mask);

      const stage = mask.querySelector('.hq-cap-stage');
      const bgImg = mask.querySelector('.hq-cap-bg');
      const pieceImg = mask.querySelector('.hq-cap-piece');
      const loadingEl = mask.querySelector('.hq-cap-loading');
      const tipEl = mask.querySelector('.hq-cap-tip');
      const track = mask.querySelector('.hq-cap-track');
      const fill = mask.querySelector('.hq-cap-fill');
      const trackText = mask.querySelector('.hq-cap-track-text');
      const knob = mask.querySelector('.hq-cap-knob');
      const refreshBtn = mask.querySelector('[data-cap-refresh]');
      const closeBtn = mask.querySelector('[data-cap-close]');

      let challenge = null;
      let dragging = false;
      let busy = false;
      let closed = false;
      let startX = 0;
      let startTime = 0;
      let currentOffset = 0;
      let tracks = [];
      let activePointerId = null;

      function closeWith(val) {
        if (closed) return;
        closed = true;
        document.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('pointermove', onWindowMove);
        window.removeEventListener('pointerup', onWindowUp);
        window.removeEventListener('pointercancel', onWindowCancel);
        mask.remove();
        resolve(val);
      }

      function onKeyDown(e) {
        if (e.key === 'Escape') closeWith(null);
      }
      document.addEventListener('keydown', onKeyDown);

      function showTip(text, type) {
        tipEl.textContent = text || '';
        tipEl.className = 'hq-cap-tip show ' + (type || 'err');
      }

      function hideTip() {
        tipEl.className = 'hq-cap-tip';
      }

      function setVisualPosition(px, maxTrackPx) {
        const clamped = Math.max(0, Math.min(px, maxTrackPx));
        const logicMax = challenge ? (challenge.width - challenge.pieceSize) : 240;
        currentOffset = maxTrackPx > 0 ? Math.round((clamped / maxTrackPx) * logicMax) : 0;
        knob.style.left = (2 + clamped) + 'px';
        fill.style.width = (clamped + 21) + 'px';
        if (challenge) {
          pieceImg.style.left = ((currentOffset / challenge.width) * 100) + '%';
        }
      }

      function resetSlider() {
        dragging = false;
        activePointerId = null;
        currentOffset = 0;
        track.classList.remove('err', 'ok');
        trackText.textContent = '向右拖动滑块完成拼图';
        knob.textContent = '→';
        knob.style.left = '2px';
        fill.style.width = '0px';
        pieceImg.style.left = '0%';
      }

      async function loadChallenge() {
        if (busy || closed) return;
        busy = true;
        resetSlider();
        hideTip();
        loadingEl.style.display = 'flex';
        loadingEl.textContent = '正在生成安全拼图…';
        try {
          challenge = await jsonReq('/api/captcha/new');
          bgImg.src = challenge.bgImage;
          pieceImg.src = challenge.pieceImage;
          pieceImg.style.width = ((challenge.pieceSize / challenge.width) * 100) + '%';
          pieceImg.style.top = ((challenge.y / challenge.height) * 100) + '%';
          pieceImg.style.left = '0%';
          loadingEl.style.display = 'none';
        } catch (err) {
          loadingEl.textContent = err.message || '加载失败，请点击右上角刷新';
        } finally {
          busy = false;
        }
      }

      function maxTrackDistance() {
        return Math.max(10, track.clientWidth - knob.offsetWidth - 4);
      }

      function onStart(clientX, pointerId) {
        if (busy || !challenge || closed) return;
        dragging = true;
        activePointerId = pointerId;
        startX = clientX;
        startTime = Date.now();
        tracks = [[0, 0, 0]];
        hideTip();
        track.classList.remove('err', 'ok');
        trackText.textContent = '';
      }

      function onMove(clientX, clientY) {
        if (!dragging || busy || !challenge) return;
        const maxDist = maxTrackDistance();
        const dx = clientX - startX;
        setVisualPosition(dx, maxDist);
        tracks.push([currentOffset, Math.round(clientY || 0), Date.now() - startTime]);
      }

      async function onEnd() {
        if (!dragging || busy || !challenge) return;
        dragging = false;
        activePointerId = null;
        const dur = Date.now() - startTime;
        if (currentOffset < 10) {
          resetSlider();
          return;
        }
        busy = true;
        try {
          const data = await jsonReq('/api/captcha/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              captchaId: challenge.captchaId,
              offsetX: currentOffset,
              durationMs: dur,
              tracks: tracks.slice(0, 60)
            })
          });
          track.classList.add('ok');
          knob.textContent = '✓';
          trackText.textContent = '验证通过';
          showTip('验证通过（耗时 ' + (dur / 1000).toFixed(1) + ' 秒）', 'ok');
          setTimeout(() => closeWith(data.captchaToken), 320);
        } catch (err) {
          track.classList.add('err');
          knob.textContent = '!';
          showTip(err.message || '拼图未对齐，请重试', 'err');
          setTimeout(() => {
            busy = false;
            loadChallenge();
          }, 560);
        }
      }

      knob.addEventListener('pointerdown', (e) => {
        if (e.button !== undefined && e.button !== 0) return;
        e.preventDefault();
        if (knob.setPointerCapture) {
          try { knob.setPointerCapture(e.pointerId); } catch (ignore) {}
        }
        onStart(e.clientX, e.pointerId);
      });

      function onWindowMove(e) {
        if (!dragging || (activePointerId !== null && e.pointerId !== activePointerId)) return;
        onMove(e.clientX, e.clientY);
      }
      function onWindowUp(e) {
        if (!dragging || (activePointerId !== null && e.pointerId !== activePointerId)) return;
        onEnd();
      }
      function onWindowCancel(e) {
        if (!dragging || (activePointerId !== null && e.pointerId !== activePointerId)) return;
        resetSlider();
      }

      window.addEventListener('pointermove', onWindowMove);
      window.addEventListener('pointerup', onWindowUp);
      window.addEventListener('pointercancel', onWindowCancel);

      refreshBtn.addEventListener('click', () => loadChallenge());
      closeBtn.addEventListener('click', () => closeWith(null));
      mask.addEventListener('click', (e) => {
        if (e.target === mask) closeWith(null);
      });

      loadChallenge();
    });
  };
})();
