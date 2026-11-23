(function () {
  if (window.openDesktopAuthModal) return;

  const CODE_COOLDOWN_SEC = 90;
  const cooldowns = {};

  function escHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async function reqJson(url, opts) {
    const res = await fetch(url, Object.assign({
      credentials: 'same-origin',
      headers: Object.assign({ 'Content-Type': 'application/json' }, (opts && opts.headers) || {})
    }, opts || {}));
    const json = await res.json();
    if (!json || json.code !== 0) {
      const err = new Error((json && json.msg) || '请求失败');
      err.code = json ? json.code : res.status;
      throw err;
    }
    return json.data;
  }

  let qrLibraryPromise;
  function loadQrLibrary() {
    if (typeof window.qrcode === 'function') return Promise.resolve();
    if (!qrLibraryPromise) {
      qrLibraryPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = '/assets/vendor/qrcode.js?v=2.2.0';
        script.onload = resolve;
        script.onerror = () => {
          script.remove();
          reject(new Error('二维码组件加载失败'));
        };
        document.head.appendChild(script);
      }).catch((error) => {
        qrLibraryPromise = null;
        throw error;
      });
    }
    return qrLibraryPromise;
  }

  async function renderQrInto(container, payloadText) {
    if (!container) return;
    try { await loadQrLibrary(); } catch (ignore) { /* The pairing code is still available. */ }
    if (!container.isConnected) return;
    if (typeof window.qrcode === 'function') {
      const qr = window.qrcode(0, 'M');
      qr.addData(payloadText);
      qr.make();
      container.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
      const svg = container.querySelector('svg');
      if (svg) {
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
      }
    } else {
      container.innerHTML = '<div style="font-size:12px;color:#64748b">请使用配对码登录</div>';
    }
  }

  function bindCooldown(btn, key, idleText) {
    if (!btn || !key) return;
    const rec = cooldowns[key] || (cooldowns[key] = { until: 0, timer: null });
    if (rec.timer) { clearInterval(rec.timer); rec.timer = null; }
    const paint = () => {
      const left = Math.ceil((rec.until - Date.now()) / 1000);
      if (left > 0) {
        btn.disabled = true;
        btn.textContent = left + 's 后重发';
        return true;
      }
      btn.disabled = false;
      btn.textContent = idleText;
      return false;
    };
    if (paint()) {
      rec.timer = setInterval(() => {
        if (!btn.isConnected || !paint()) {
          clearInterval(rec.timer);
          rec.timer = null;
        }
      }, 250);
    }
  }

  function startCooldown(btn, key, idleText) {
    if (!cooldowns[key]) cooldowns[key] = { until: 0, timer: null };
    cooldowns[key].until = Date.now() + CODE_COOLDOWN_SEC * 1000;
    bindCooldown(btn, key, idleText);
  }

  /**
   * 桌面端双栏登录/注册弹窗（含扫码登录 + 密码/邮箱验证码登录 + 滑块人机验证）。
   * options: { mode?: 'login'|'register', method?: 'password'|'code', onSuccess?: (user) => void }
   */
  window.openDesktopAuthModal = function openDesktopAuthModal(options) {
    const opts = options || {};
    const existing = document.querySelector('.hq-auth-mask');
    if (existing) existing.remove();

    let mode = opts.mode === 'register' ? 'register' : 'login';
    let loginTab = opts.method === 'code' ? 'code' : 'password';
    let showPwd = false;
    let pollTimer = null;
    let qrState = null;
    let closed = false;
    let submitting = false;

    const mask = document.createElement('div');
    mask.className = 'hq-auth-mask';
    mask.setAttribute('role', 'dialog');
    mask.setAttribute('aria-modal', 'true');
    mask.setAttribute('aria-label', '账号登录');
    document.body.appendChild(mask);

    function closeModal() {
      if (closed) return;
      closed = true;
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
      document.removeEventListener('keydown', onKeyDown);
      mask.remove();
      if (typeof opts.onClose === 'function') opts.onClose();
    }

    function onKeyDown(e) {
      if (e.key === 'Escape' && !document.querySelector('.hq-cap-mask')) {
        closeModal();
      }
    }
    document.addEventListener('keydown', onKeyDown);

    function buildRightHtml() {
      if (mode === 'register') {
        return '' +
          '<div class="hq-auth-tabs">' +
            '<button type="button" class="hq-auth-tab on">注册新账号</button>' +
            '<span class="hq-auth-tab-sep"></span>' +
            '<button type="button" class="hq-auth-tab" data-m-mode="login">返回登录</button>' +
          '</div>' +
          '<form id="hqModalRegForm" class="hq-auth-reg-grid">' +
            '<input class="hq-auth-reg-input" name="studentNo" maxlength="10" inputmode="numeric" placeholder="学号（10 位数字）" required>' +
            '<input class="hq-auth-reg-input" name="nickname" maxlength="20" placeholder="昵称" required>' +
            '<input class="hq-auth-reg-input hq-auth-field-full" name="password" type="password" minlength="6" maxlength="20" placeholder="设置密码（6-20 位）" autocomplete="new-password" required>' +
            '<input class="hq-auth-reg-input hq-auth-field-full" name="email" type="email" placeholder="绑定邮箱（用于接收验证码）" autocomplete="email" required>' +
            '<div class="hq-auth-reg-code hq-auth-field-full">' +
              '<input class="hq-auth-reg-input" name="code" maxlength="6" inputmode="numeric" pattern="[0-9]{6}" placeholder="6 位邮箱验证码" required>' +
              '<button type="button" class="hq-auth-reg-send" id="hqModalRegSend">获取验证码</button>' +
            '</div>' +
            '<input class="hq-auth-reg-input" name="college" placeholder="院系（选填）">' +
            '<input class="hq-auth-reg-input" name="building" placeholder="宿舍楼（选填）">' +
            '<div class="hq-auth-err hq-auth-field-full" id="hqModalErr"></div>' +
            '<div class="hq-auth-btns hq-auth-field-full" style="margin-top:4px">' +
              '<button type="button" class="hq-auth-btn-sub" data-m-mode="login">已有账号</button>' +
              '<button type="submit" class="hq-auth-btn-main">注册并登录</button>' +
            '</div>' +
          '</form>';
      }

      return '' +
        '<div class="hq-auth-tabs">' +
          '<button type="button" class="hq-auth-tab ' + (loginTab === 'password' ? 'on' : '') + '" data-m-tab="password">密码登录</button>' +
          '<span class="hq-auth-tab-sep"></span>' +
          '<button type="button" class="hq-auth-tab ' + (loginTab === 'code' ? 'on' : '') + '" data-m-tab="code">邮箱验证码登录</button>' +
        '</div>' +
        '<form id="hqModalLoginForm">' +
          '<div class="hq-auth-group">' +
            (loginTab === 'password'
              ? '<div class="hq-auth-row"><label for="hqAccount">账号</label><input id="hqAccount" name="account" autocomplete="username" placeholder="请输入 10 位学号或已绑定邮箱" required></div>' +
                '<div class="hq-auth-row"><label for="hqPwd">密码</label><input id="hqPwd" name="password" type="' + (showPwd ? 'text' : 'password') + '" autocomplete="current-password" placeholder="请输入密码" required>' +
                '<button type="button" class="hq-auth-eye" id="hqTogglePwd" aria-label="显示或隐藏密码">' + (showPwd ? '隐藏' : '显示') + '</button></div>'
              : '<div class="hq-auth-row"><label for="hqEmail">邮箱</label><input id="hqEmail" name="email" type="email" autocomplete="username" placeholder="请输入已绑定的邮箱" required></div>' +
                '<div class="hq-auth-row"><label for="hqCode">验证码</label><input id="hqCode" name="code" maxlength="6" inputmode="numeric" pattern="[0-9]{6}" placeholder="6 位邮箱验证码" required>' +
                '<button type="button" class="hq-auth-inline-btn" id="hqModalLoginSend">获取验证码</button></div>') +
          '</div>' +
          '<div class="hq-auth-err" id="hqModalErr"></div>' +
          '<div class="hq-auth-btns">' +
            '<button type="button" class="hq-auth-btn-sub" data-m-mode="register">注册</button>' +
            '<button type="submit" class="hq-auth-btn-main">登录</button>' +
          '</div>' +
        '</form>';
    }

    function paint() {
      mask.innerHTML = '' +
        '<div class="hq-auth-dialog">' +
          '<button type="button" class="hq-auth-close" id="hqAuthClose" aria-label="关闭登录框">×</button>' +
          '<div class="hq-auth-grid">' +
            '<div class="hq-auth-qr-col">' +
              '<h2 class="hq-auth-qr-title">扫描二维码登录</h2>' +
              '<div class="hq-auth-qr-box">' +
                '<div id="hqQrCanvas" style="width:100%;height:100%"></div>' +
                '<div class="hq-auth-qr-overlay" id="hqQrOverlay" style="display:none"></div>' +
              '</div>' +
              '<div class="hq-auth-pair-code">手机扫一扫或输入配对码 <b id="hqQrPairCode">------</b></div>' +
              '<p class="hq-auth-qr-tip">请使用 <strong>换一圈手机端</strong><br>扫码登录桌面端</p>' +
            '</div>' +
            '<div class="hq-auth-divider" aria-hidden="true"></div>' +
            '<div class="hq-auth-form-col" id="hqModalRight">' + buildRightHtml() + '</div>' +
          '</div>' +
          '<p class="hq-auth-foot">登录或完成注册即代表你同意 <span>重庆移通学院校园换物平台公约</span> 与 <span>隐私保护规范</span></p>' +
          '<img class="hq-auth-mascot left" src="/assets/brand/mascot-wave.png" alt="">' +
          '<img class="hq-auth-mascot right" src="/assets/brand/mascot-box.png" alt="">' +
        '</div>';

      mask.querySelector('#hqAuthClose').addEventListener('click', closeModal);
      mask.addEventListener('click', (e) => { if (e.target === mask) closeModal(); });
      bindRightEvents();
    }

    function finishLogin(user) {
      if (closed) return;
      closeModal();
      if (typeof opts.onSuccess === 'function') {
        opts.onSuccess(user);
      }
    }

    function updateQrVisual(status, extra) {
      const overlay = mask.querySelector('#hqQrOverlay');
      if (!overlay) return;
      if (status === 'PENDING') {
        overlay.style.display = 'none';
        overlay.className = 'hq-auth-qr-overlay';
        overlay.innerHTML = '';
        return;
      }
      overlay.style.display = 'flex';
      if (status === 'SCANNED') {
        overlay.className = 'hq-auth-qr-overlay is-ok';
        overlay.innerHTML = '<div class="hq-auth-qr-badge">✓</div><b>已扫描</b><small>' +
          escHtml((extra && extra.nickname ? extra.nickname + '，' : '') + '请在手机端点击确认登录') + '</small>';
        return;
      }
      const msg = status === 'CANCELLED' ? '手机端已取消登录' : '二维码已失效';
      overlay.className = 'hq-auth-qr-overlay';
      overlay.innerHTML = '<b>' + msg + '</b><button type="button" class="hq-auth-qr-refresh" id="hqQrRefreshBtn">点击刷新</button>';
      overlay.querySelector('#hqQrRefreshBtn')?.addEventListener('click', initQrSession);
    }

    async function initQrSession() {
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
      const box = mask.querySelector('#hqQrCanvas');
      const pairEl = mask.querySelector('#hqQrPairCode');
      updateQrVisual('PENDING');
      try {
        const data = await reqJson('/api/auth/qr/create', { method: 'POST', body: '{}' });
        if (closed) return;
        qrState = data;
        if (pairEl) pairEl.textContent = data.pairCode || '------';
        const qrUrl = location.origin + '/login/qr-confirm?qr=' + encodeURIComponent(data.qrId);
        renderQrInto(box, qrUrl);

        pollTimer = setInterval(async () => {
          if (closed || !qrState) return;
          try {
            const st = await reqJson('/api/auth/qr/status?qrId=' + encodeURIComponent(qrState.qrId) + '&pollSecret=' + encodeURIComponent(qrState.pollSecret), { method: 'GET' });
            if (closed) return;
            if (st.status === 'SCANNED') {
              updateQrVisual('SCANNED', st);
            } else if (st.status === 'CONFIRMED') {
              clearInterval(pollTimer);
              pollTimer = null;
              const user = await reqJson('/api/auth/qr/exchange', {
                method: 'POST',
                body: JSON.stringify({ qrId: qrState.qrId, pollSecret: qrState.pollSecret })
              });
              finishLogin(user);
            } else if (st.status === 'EXPIRED' || st.status === 'CANCELLED') {
              clearInterval(pollTimer);
              pollTimer = null;
              updateQrVisual(st.status);
            }
          } catch (ignore) {}
        }, 1400);
      } catch (e) {
        updateQrVisual('EXPIRED');
      }
    }

    function setErr(msg) {
      const box = mask.querySelector('#hqModalErr');
      if (box) box.textContent = msg || '';
    }

    function bindRightEvents() {
      const rightCol = mask.querySelector('#hqModalRight');
      if (!rightCol) return;

      rightCol.querySelectorAll('[data-m-tab]').forEach((btn) => {
        btn.addEventListener('click', () => {
          loginTab = btn.dataset.mTab;
          rightCol.innerHTML = buildRightHtml();
          bindRightEvents();
        });
      });

      rightCol.querySelectorAll('[data-m-mode]').forEach((btn) => {
        btn.addEventListener('click', () => {
          mode = btn.dataset.mMode;
          rightCol.innerHTML = buildRightHtml();
          bindRightEvents();
        });
      });

      const eyeBtn = rightCol.querySelector('#hqTogglePwd');
      if (eyeBtn) {
        eyeBtn.addEventListener('click', () => {
          showPwd = !showPwd;
          const pwd = rightCol.querySelector('#hqPwd');
          if (pwd) pwd.type = showPwd ? 'text' : 'password';
          eyeBtn.textContent = showPwd ? '隐藏' : '显示';
        });
      }

      const loginSendBtn = rightCol.querySelector('#hqModalLoginSend');
      if (loginSendBtn) {
        bindCooldown(loginSendBtn, 'modal-login-email', '获取验证码');
        loginSendBtn.addEventListener('click', async () => {
          const emailEl = rightCol.querySelector('#hqEmail');
          if (!emailEl || !emailEl.reportValidity()) return;
          setErr('');
          const cap = await window.openHumanCaptcha('安全验证 · 发送登录验证码');
          if (!cap) return;
          loginSendBtn.disabled = true;
          loginSendBtn.textContent = '发送中…';
          try {
            await reqJson('/api/user/login/email/send', {
              method: 'POST',
              body: JSON.stringify({ email: emailEl.value.trim(), captchaToken: cap })
            });
            startCooldown(loginSendBtn, 'modal-login-email', '获取验证码');
            rightCol.querySelector('#hqCode')?.focus();
          } catch (err) {
            loginSendBtn.disabled = false;
            loginSendBtn.textContent = '获取验证码';
            setErr(err.message);
          }
        });
      }

      const regSendBtn = rightCol.querySelector('#hqModalRegSend');
      if (regSendBtn) {
        bindCooldown(regSendBtn, 'modal-reg-email', '获取验证码');
        regSendBtn.addEventListener('click', async () => {
          const form = rightCol.querySelector('#hqModalRegForm');
          const no = (form.elements.studentNo.value || '').trim();
          const emailEl = form.elements.email;
          if (!/^[0-9]{10}$/.test(no)) { setErr('请输入 10 位学号'); return; }
          if (!emailEl.reportValidity()) return;
          setErr('');
          const cap = await window.openHumanCaptcha('安全验证 · 发送注册验证码');
          if (!cap) return;
          regSendBtn.disabled = true;
          regSendBtn.textContent = '发送中…';
          try {
            await reqJson('/api/user/register/email/send', {
              method: 'POST',
              body: JSON.stringify({ studentNo: no, email: emailEl.value.trim(), captchaToken: cap })
            });
            startCooldown(regSendBtn, 'modal-reg-email', '获取验证码');
            form.elements.code?.focus();
          } catch (err) {
            regSendBtn.disabled = false;
            regSendBtn.textContent = '获取验证码';
            setErr(err.message);
          }
        });
      }

      const loginForm = rightCol.querySelector('#hqModalLoginForm');
      if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          if (submitting) return;
          setErr('');
          const submitBtn = loginForm.querySelector('[type="submit"]');
          let path = '/api/user/login';
          let payload = {};
          if (loginTab === 'password') {
            const account = (loginForm.elements.account.value || '').trim();
            const password = loginForm.elements.password.value || '';
            if (!account) { setErr('请输入学号或邮箱'); return; }
            if (account.includes('@')) {
              path = '/api/user/login/email/password';
              payload = { email: account, password: password };
            } else {
              if (!/^\d{10}$/.test(account) && account !== 'admin') {
                setErr('学号为 10 位数字（或请输入绑定的邮箱）');
                return;
              }
              path = '/api/user/login';
              payload = { studentNo: account, password: password };
            }
          } else {
            path = '/api/user/login/email/code';
            payload = {
              email: (loginForm.elements.email.value || '').trim(),
              code: (loginForm.elements.code.value || '').trim()
            };
          }

          const cap = await window.openHumanCaptcha('登录安全验证');
          if (!cap) return;
          payload.captchaToken = cap;
          submitting = true;
          if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '登录中…'; }
          try {
            const user = await reqJson(path, { method: 'POST', body: JSON.stringify(payload) });
            finishLogin(user);
          } catch (err) {
            setErr(err.message);
          } finally {
            submitting = false;
            if (submitBtn && submitBtn.isConnected) { submitBtn.disabled = false; submitBtn.textContent = '登录'; }
          }
        });
      }

      const regForm = rightCol.querySelector('#hqModalRegForm');
      if (regForm) {
        regForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          if (submitting) return;
          setErr('');
          const fd = new FormData(regForm);
          const studentNo = String(fd.get('studentNo') || '').trim();
          if (!/^\d{10}$/.test(studentNo)) { setErr('学号是 10 位数字，例如 2021210001'); return; }
          const cap = await window.openHumanCaptcha('注册安全验证');
          if (!cap) return;
          const submitBtn = regForm.querySelector('[type="submit"]');
          submitting = true;
          if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '提交中…'; }
          try {
            const user = await reqJson('/api/user/register', {
              method: 'POST',
              body: JSON.stringify({
                studentNo: studentNo,
                nickname: String(fd.get('nickname') || '').trim(),
                password: String(fd.get('password') || ''),
                email: String(fd.get('email') || '').trim(),
                code: String(fd.get('code') || '').trim(),
                college: String(fd.get('college') || '').trim(),
                building: String(fd.get('building') || '').trim(),
                captchaToken: cap
              })
            });
            finishLogin(user);
          } catch (err) {
            setErr(err.message);
          } finally {
            submitting = false;
            if (submitBtn && submitBtn.isConnected) { submitBtn.disabled = false; submitBtn.textContent = '注册并登录'; }
          }
        });
      }
    }

    paint();
    initQrSession();
    return { close: closeModal };
  };
})();
