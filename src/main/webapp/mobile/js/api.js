/* 接口封装：同源、带 cookie。所有错误统一抛出，由调用方决定怎么提示。 */
(function () {
  const BASE = '';

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
    const opt = {
      method,
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
    };
    if (body !== undefined) opt.body = JSON.stringify(body);
    const res = await fetch(BASE + path + qs(params), opt);
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
    return json.data;
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
