import { $ } from "../../utils/desktop/dom.js";

function toast(msg, type) {
    var wrap = $('#toasts');
    if (!wrap) return;
    // 同一条消息不重复堆叠，最多留三条
    for (var i = 0; i < wrap.children.length; i++) {
        if (wrap.children[i].dataset.msg === msg) {
            return;
        }
    }
    while (wrap.children.length >= 3) {
        wrap.removeChild(wrap.firstChild);
    }
    var el = document.createElement('div');
    el.dataset.msg = msg;
    el.className = 'toast ' + (type || '');
    el.textContent = msg;
    wrap.appendChild(el);
    setTimeout(function () {
        el.style.transition = 'opacity .25s, transform .25s';
        el.style.opacity = '0';
        el.style.transform = 'translateY(6px)';
        setTimeout(function () {
            el.remove();
        }, 260);
    }, 2400);
}

export { toast };
