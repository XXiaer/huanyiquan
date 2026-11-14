/* 接口封装：同源、带 cookie。所有错误统一抛出，由调用方决定怎么提示。 */
(function () {
  const BASE = '';
  const getCache = new Map();
  const inFlight = new Map();
  const CACHE_TTL = 12000;

  function isCacheable(method, path) {
    return method === 'GET' && !path.startsWith('/api/notification') && !path.startsWith('/api/chat');
  }

  function qs(params) {
    if (!params) return '';
    const p = new URLSearchParams();
    Object.keys(params).forEach((k) => {
      const v = params[k];
      if (v === undefined || v === null || v === '') return;
      p.append(k, v);
    });
    const s = p.toString();
    return s ? '?' + s : '';
  }

  async function request(method, path, { params, body } = {}) {
    const url = BASE + path + qs(params);
    if (isCacheable(method, path)) {
      const cached = getCache.get(url);
      if (cached && cached.exp > Date.now()) return cached.data;
      if (inFlight.has(url)) return inFlight.get(url);
    } else if (method !== 'GET') {
      getCache.clear();
    }

    const opt = {
      method,
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
    };
    if (body !== undefined) opt.body = JSON.stringify(body);
    const run = (async () => {
      const res = await fetch(url, opt);
      let json;
      try {
        json = await res.json();
      } catch (e) {
        throw new Error('服务返回了非 JSON 内容，状态码 ' + res.status);
      }
      if (json.code !== 0) {
        const err = new Error(json.msg || '请求失败');
        err.code = json.code;
        throw err;
      }
      if (isCacheable(method, path)) {
        getCache.set(url, { data: json.data, exp: Date.now() + CACHE_TTL });
      }
      return json.data;
    })();

    if (isCacheable(method, path)) {
      inFlight.set(url, run);
      try { return await run; } finally { inFlight.delete(url); }
    }
    return run;
  }

  window.api = {
    get: (p, params) => request('GET', p, { params }),
    post: (p, body) => request('POST', p, { body: body || {} }),
    put: (p, body) => request('PUT', p, { body: body || {} }),
    del: (p) => request('DELETE', p, {}),
    async upload(file) {
      const fd = new FormData();
      fd.append('file', await window.prepareUploadImage(file));
      return fetch('/api/upload', { method: 'POST', body: fd, credentials: 'same-origin' })
        .then((r) => r.json())
        .then((j) => { if (j.code !== 0) throw new Error(j.msg || '上传失败'); return j.data; });
    },

    /* 图片字段可能是逗号拼接的多张 */
    pics(item) {
      if (!item || !item.images) return [];
      return String(item.images).split(',').map((s) => s.trim()).filter(Boolean);
    },
    firstPic(item) {
      const list = this.pics(item);
      if (list.length) return list[0];
      return 'assets/brand/placeholder.png';
    },

    /* 分转元，去掉多余的 .00 */
    yuan(cents) {
      if (cents === null || cents === undefined || cents === '') return '';
      const n = Number(cents) / 100;
      return Number.isInteger(n) ? String(n) : n.toFixed(2);
    },
  };
})();
