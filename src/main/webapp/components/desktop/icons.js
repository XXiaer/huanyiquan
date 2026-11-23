import { esc } from "../../utils/desktop/dom.js";

var path = function (d, fill) { return '<path d="' + d + '" fill="' + (fill || 'none') + '"/>'; };

var circle = function (x, y, r, fill) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + (fill || 'none') + '"/>'; };

var rect = function (x, y, w, h, r, fill) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + r + '" fill="' + (fill || 'none') + '"/>'; };

var ICONS = {
    market: path('M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5.5v-6h-5v6H4a1 1 0 0 1-1-1Z'),
    community: path('M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8Z'),
    trade: path('M17 2l4 4-4 4') + path('M3 11V9a4 4 0 0 1 4-4h14') + path('M7 22l-4-4 4-4') + path('M21 13v2a4 4 0 0 1-4 4H3'),
    me: path('M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2') + circle(12, 7, 4),
    notice: path('M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9') + path('M13.73 21a2 2 0 0 1-3.46 0'),
    search: circle(11, 11, 7) + path('m21 21-4.35-4.35'),
    heart: path('M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z'),
    cart: path('M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z') + path('M3 6h18') + path('M16 10a4 4 0 0 1-8 0'),
    pin: path('M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z') + circle(12, 10, 3),
    shield: path('M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z') + path('m9 12 2 2 4-4'),
    truck: rect(1, 3, 15, 13, 1.5) + path('M16 8h4l3 3v5h-7V8Z') + circle(5.5, 18.5, 2.5) + circle(18.5, 18.5, 2.5),
    settings: circle(12, 12, 3) + path('M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z'),
    book: path('M4 19.5A2.5 2.5 0 0 1 6.5 17H20') + path('M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z'),
    device: rect(2, 3, 20, 14, 2) + path('M8 21h8') + path('M12 17v4'),
    sports: circle(12, 12, 9) + path('M3.6 9h16.8M3.6 15h16.8M11.5 3a17 17 0 0 0 0 18M12.5 3a17 17 0 0 1 0 18'),
    life: path('M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z') + path('M3 6h18') + path('M16 10a4 4 0 0 1-8 0'),
    clothes: path('M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23Z'),
    plant: path('M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z') + path('M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12'),
    box: path('M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z') + path('M3.27 6.96 12 12.01l8.73-5.05') + path('M12 22.08V12'),
    add: rect(3, 3, 18, 18, 4) + path('M12 8v8') + path('M8 12h8'),
    auction: path('m14 13-7.5 7.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L11 10') + path('m16 16 6-6') + path('m8 8 6-6') + path('m9 7 8 8') + path('m21 11-8-8'),
    wish: rect(2, 4, 20, 16, 2) + path('m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7'),
    filter: path('M22 3H2l8 9.46V19l4 2v-8.54L22 3z'),
    camera: path('M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z') + circle(12, 13, 4),
    back: path('m15 18-6-6 6-6'),
    next: path('m9 18 6-6-6-6'),
    close: path('M18 6 6 18') + path('m6 6 12 12'),
    door: path('M13 4h3a2 2 0 0 1 2 2v14') + path('M2 20h3') + path('M13 20h9') + path('M10 12v.01') + path('M13 4.562v16.157a1 1 0 0 1-1.242.97L5 20V5.562a2 2 0 0 1 1.515-1.94l4-1A2 2 0 0 1 13 4.561Z'),
    appraise: circle(11, 11, 8) + path('m21 21-4.35-4.35') + path('M11 8v6') + path('M8 11h6'),
    grad: path('M22 10v6M2 10l10-5 10 5-10 5z') + path('M6 12v5c3 3 9 3 12 0v-5'),
    lost: circle(7.5, 15.5, 5.5) + path('m21 2-9.6 9.6') + path('m15.5 7.5 3 3L22 7l-3-3'),
    star: path('M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z', 'currentColor'),
    flag: path('M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z') + path('M4 22v-7'),
    arrow: path('M5 12h14') + path('m12 5 7 7-7 7'),
    down: path('M12 5v14') + path('m19 12-7 7-7-7'),
    external: path('M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6') + path('M15 3h6v6') + path('M10 14 21 3'),
    menu: path('M3 6h18') + path('M3 12h18') + path('M3 18h18'),
    bookmark: path('M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z'),
    image: rect(3, 3, 18, 18, 2) + circle(8.5, 8.5, 1.5) + path('m21 15-5-5L5 21'),
    zoom: circle(11, 11, 7) + path('m21 21-4.35-4.35') + path('M11 8v6') + path('M8 11h6')
};

var CAT_ICON = {教材:navIcon('book'),数码:navIcon('device'),运动:navIcon('sports'),
    生活:navIcon('life'),衣物:navIcon('clothes'),绿植:navIcon('plant'),其他:navIcon('box')};

var CLAY_ICONS = ['ai', 'auction', 'chat', 'fire', 'game', 'order', 'pin', 'settings', 'star', 'swap', 'user', 'wallet'];

function clayIcon(name, alt, cls) {
    var key = CLAY_ICONS.indexOf(name) >= 0 ? name : 'star';
    var px = cls && cls.indexOf('is-lg') >= 0 ? 30 : (cls && cls.indexOf('is-sm') >= 0 ? 16 : 18);
    return '<img class="clay-ico' + (cls ? ' ' + cls : '') + '" src="/assets/icons/' + key + '.jpg" alt="' + esc(alt || '') + '" width="' + px + '" height="' + px + '" loading="eager" decoding="async">';
}

function navIcon(name) {
    return '<svg class="nav-icon line-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+ICONS[name]+'</svg>';
}

export { CAT_ICON, clayIcon, navIcon };
