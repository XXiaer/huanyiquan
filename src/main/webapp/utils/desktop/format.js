import { CAT_ICON, navIcon } from "../../components/desktop/icons.js";
import { esc } from "./dom.js";

function firstImage(images) {
    if (!images) return '';
    var arr = String(images).split(',');
    for (var i = 0; i < arr.length; i++) {
        if (arr[i].trim()) return arr[i].trim();
    }
    return '';
}

function thumb(it, cls) {
    var img = firstImage(it.images);
    var inner = img
        ? '<img src="' + esc(window.catalogThumbnail(img)) + '" alt="' + esc(it.title) + '" loading="lazy" decoding="async">'
        : (CAT_ICON[it.category] || navIcon('box'));
    return '<div class="' + (cls || 'thumb') + '" data-cat="' + esc(it.category) + '">' + inner + '</div>';
}

function fmtRel(s) {
    if (!s) return '';
    var d = new Date(String(s).replace(' ', 'T'));
    if (isNaN(d.getTime())) return '';
    var diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 0) return '刚刚';
    if (diff < 60) return '刚刚';
    if (diff < 3600) return Math.floor(diff / 60) + ' 分钟前';
    if (diff < 86400) return Math.floor(diff / 3600) + ' 小时前';
    if (diff < 86400 * 7) return Math.floor(diff / 86400) + ' 天前';
    return (d.getMonth() + 1) + '月' + d.getDate() + '日';
}

function firstDisplayImage(images) {
    return String(images || '').split(',').map(function (url) { return url.trim(); }).find(function (url) {
        return url && !/(?:^|\/)placeholder(?:[-_][^/.]+)?\.(?:webp|png|jpe?g)(?:[?#]|$)/i.test(url);
    }) || '';
}

function cashPrice(cents) {
    return '¥' + (Number(cents || 0) / 100).toFixed(2);
}

function fmtDate(s) {
    if (!s) return '';
    var d = new Date(String(s).replace(' ', 'T'));
    if (isNaN(d.getTime())) return '';
    var mm = ('0' + (d.getMonth() + 1)).slice(-2);
    var dd = ('0' + d.getDate()).slice(-2);
    return d.getFullYear() + '-' + mm + '-' + dd;
}

function creditCls(c) {
    if (c === null || c === undefined) return '';
    if (c >= 90) return '';
    if (c >= 60) return 'mid';
    return 'low';
}

export { cashPrice, creditCls, firstDisplayImage, firstImage, fmtDate, fmtRel, thumb };
