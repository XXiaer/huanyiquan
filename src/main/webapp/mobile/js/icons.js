/* 换一圈图标系统：24 画布、1.8 描边、圆角端点与转折。一次定义，全站引用。 */
(function () {
  const S = 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
  const P = (d, extra) => `<path d="${d}" ${S}${extra || ''}/>`;

  const ICONS = {
    /* ---------------- 导航与通用 ---------------- */
    home: P('M4 10.3 12 4l8 6.3V19a1.5 1.5 0 0 1-1.5 1.5h-4.1v-5.4H9.6v5.4H5.5A1.5 1.5 0 0 1 4 19z'),
    homeFill: `<path d="M4 10.3 12 4l8 6.3V19a1.5 1.5 0 0 1-1.5 1.5h-4.1v-5.4H9.6v5.4H5.5A1.5 1.5 0 0 1 4 19z" fill="currentColor"/><path d="M9.6 14.4h4.8v6h-4.8z" fill="#fff"/>`,
    market: P('M3.8 9.2 5.2 4.6h13.6l1.4 4.6a2.6 2.6 0 0 1-5 1 2.6 2.6 0 0 1-5.2 0 2.6 2.6 0 0 1-5-1Z') + P('M5.4 11.4V19a1.4 1.4 0 0 0 1.4 1.4h10.4a1.4 1.4 0 0 0 1.4-1.4v-7.6') + P('M9.8 20.4v-5.2h4.4v5.2'),
    marketFill: `<path d="M3.8 9.2 5.2 4.6h13.6l1.4 4.6a2.6 2.6 0 0 1-5 1 2.6 2.6 0 0 1-5.2 0 2.6 2.6 0 0 1-5-1Z" fill="currentColor" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><path d="M5.2 12v7.2A1.4 1.4 0 0 0 6.6 20.6h10.8a1.4 1.4 0 0 0 1.4-1.4V12H5.2Z" fill="currentColor"/><path d="M9.8 20.6v-5.1h4.4v5.1z" fill="#fff"/>`,
    community: `<circle cx="12" cy="12" r="8.4" ${S}/>${P('M8.2 12.4c1 1.6 2.3 2.4 3.8 2.4s2.8-.8 3.8-2.4')}`,
    communityFill: `<circle cx="12" cy="12" r="8.4" fill="currentColor"/><path d="M8.2 12.2c1 1.5 2.3 2.3 3.8 2.3s2.8-.8 3.8-2.3" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/><circle cx="9.1" cy="9.8" r="1" fill="#fff"/><circle cx="14.9" cy="9.8" r="1" fill="#fff"/>`,
    publish: `<rect x="3.2" y="7" width="17.6" height="13.2" rx="3.4" ${S}/><circle cx="12" cy="13.6" r="3.5" ${S}/>${P('M8.5 7l1.2-2.4h4.6L15.5 7')}${P('M18.4 3v3.2M16.8 4.6h3.2')}`,
    message: P('M4.2 11.7c0-4 3.5-7.2 7.8-7.2s7.8 3.2 7.8 7.2-3.5 7.2-7.8 7.2c-.9 0-1.8-.1-2.6-.4L5.2 20.3l.7-3.5a6.8 6.8 0 0 1-1.7-5.1Z'),
    messageFill: `<path d="M4.2 11.7c0-4 3.5-7.2 7.8-7.2s7.8 3.2 7.8 7.2-3.5 7.2-7.8 7.2c-.9 0-1.8-.1-2.6-.4L5.2 20.3l.7-3.5a6.8 6.8 0 0 1-1.7-5.1Z" fill="currentColor"/><circle cx="8.7" cy="11.7" r="1.05" fill="#fff"/><circle cx="12" cy="11.7" r="1.05" fill="#fff"/><circle cx="15.3" cy="11.7" r="1.05" fill="#fff"/>`,
    me: `<circle cx="12" cy="12" r="8.5" ${S}/>${P('M8.4 12.5c.9 1.5 2.1 2.3 3.6 2.3s2.7-.8 3.6-2.3')}`,
    meFill: `<circle cx="12" cy="12" r="8.5" fill="currentColor"/><path d="M8.4 12.4c.9 1.5 2.1 2.3 3.6 2.3s2.7-.8 3.6-2.3" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/><circle cx="9.3" cy="9.9" r=".95" fill="#fff"/><circle cx="14.7" cy="9.9" r=".95" fill="#fff"/>`,

    search: `<circle cx="10.8" cy="10.8" r="6.4" ${S}/>${P('m15.6 15.6 4.2 4.2')}`,
    camera: `<rect x="3.2" y="7" width="17.6" height="12.8" rx="3.2" ${S}/><circle cx="12" cy="13.3" r="3.5" ${S}/>${P('M8.6 7l1.1-2.3h4.6L15.4 7')}`,
    scan: P('M4 8.5V6a2 2 0 0 1 2-2h2.5M15.5 4H18a2 2 0 0 1 2 2v2.5M20 15.5V18a2 2 0 0 1-2 2h-2.5M8.5 20H6a2 2 0 0 1-2-2v-2.5') + P('M4 12h16'),
    back: P('m14.6 5-7 7 7 7'),
    right: P('m9.4 5 7 7-7 7'),
    down: P('m5 9.4 7 7 7-7'),
    up: P('m5 14.6 7-7 7 7'),
    close: P('M6 6l12 12M18 6 6 18'),
    more: `<circle cx="5" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="19" cy="12" r="1.5" fill="currentColor"/>`,
    clock: `<circle cx="12" cy="12" r="8.4" ${S}/>${P('M12 7.5V12l3 1.8')}`,
    mute: P('M5 9.6h2.6L12 6v12L7.6 14.4H5z') + P('m16 9.8 4.4 4.4M20.4 9.8 16 14.2'),
    unmute: P('M5 9.6h2.6L12 6v12L7.6 14.4H5z') + P('M15.6 9.4a3.8 3.8 0 0 1 0 5.2M18.2 7a7.2 7.2 0 0 1 0 10'),
    headset: P('M4.4 14.5v-2.1a7.6 7.6 0 0 1 15.2 0v2.1') + `<rect x="2.8" y="13.4" width="4" height="6" rx="2" ${S}/><rect x="17.2" y="13.4" width="4" height="6" rx="2" ${S}/>`,
    gear: P('M12 3.4 13.9 5l2.3-.4 1 2.1 2.1 1-.4 2.3 1.6 1.9-1.6 1.9.4 2.3-2.1 1-1 2.1-2.3-.4L12 20.6 10.1 19l-2.3.4-1-2.1-2.1-1 .4-2.3L3.5 12l1.6-1.9-.4-2.3 2.1-1 1-2.1 2.3.4z') + `<circle cx="12" cy="12" r="3.1" ${S}/>`,
    trash: P('M4.6 7h14.8M9.4 7V5.2h5.2V7M6.4 7l.9 12.2h9.4L17.6 7') + P('M10.4 10.6v5.4M13.6 10.6v5.4'),
    refresh: P('M19.4 12a7.4 7.4 0 1 1-2.2-5.2') + P('M19.8 4.6v4.6h-4.6'),
    eye: P('M2.6 12S6 6.4 12 6.4 21.4 12 21.4 12 18 17.6 12 17.6 2.6 12 2.6 12Z') + `<circle cx="12" cy="12" r="2.7" ${S}/>`,
    star: P('m12 4 2.5 5.1 5.6.8-4.1 3.9 1 5.5-5-2.7-5 2.7 1-5.5-4.1-3.9 5.6-.8z'),
    starFill: `<path d="m12 4 2.5 5.1 5.6.8-4.1 3.9 1 5.5-5-2.7-5 2.7 1-5.5-4.1-3.9 5.6-.8z" fill="currentColor"/>`,
    share: P('M12 3.6 8.5 7.1M12 3.6l3.5 3.5M12 3.6v10.8') + P('M5.4 11.4v7.2a1.8 1.8 0 0 0 1.8 1.8h9.6a1.8 1.8 0 0 0 1.8-1.8v-7.2'),
    mic: `<rect x="9.2" y="3.4" width="5.6" height="10.2" rx="2.8" ${S}/>` + P('M5.8 11.4a6.2 6.2 0 0 0 12.4 0M12 17.6V21'),
    emoji: `<circle cx="12" cy="12" r="8.6" ${S}/><circle cx="9" cy="10.1" r="1.05" fill="currentColor"/><circle cx="15" cy="10.1" r="1.05" fill="currentColor"/>` + P('M8.4 14.1c.9 1.5 2.1 2.3 3.6 2.3s2.7-.8 3.6-2.3'),
    plus: P('M12 5v14M5 12h14'),
    image: `<rect x="3.4" y="5" width="17.2" height="14" rx="2.8" ${S}/><circle cx="9" cy="10" r="1.6" fill="currentColor"/>` + P('m4.8 17.2 4.9-4.9 4.2 4.2 2.5-2.4 3.2 3.2'),
    shoot: `<circle cx="12" cy="12" r="8.6" ${S}/><circle cx="12" cy="12" r="3.4" fill="currentColor"/>`,
    phone: P('M6.6 3.8h3l1.6 4-2 1.4a11.4 11.4 0 0 0 5.6 5.6l1.4-2 4 1.6v3a1.8 1.8 0 0 1-2 1.8C11.4 18.8 5.2 12.6 4.8 5.8a1.8 1.8 0 0 1 1.8-2Z'),
    video: `<rect x="2.8" y="6.4" width="13" height="11.2" rx="2.6" ${S}/>` + P('m16.4 11 4.8-2.8v7.6L16.4 13z'),
    money: `<rect x="2.8" y="5.6" width="18.4" height="12.8" rx="2.4" ${S}/><circle cx="12" cy="12" r="2.8" ${S}/>`,
    bag: P('M4.6 8h14.8l-1 12H5.6z') + P('M8.8 8V6.4a3.2 3.2 0 0 1 6.4 0V8'),
    check: P('m5 12.6 4.6 4.6L19 7.4'),
    checkCircle: `<circle cx="12" cy="12" r="8.6" ${S}/>` + P('m8 12.2 2.6 2.6L16.4 9'),
    swap: P('M4.4 9.2h13.2l-3-3M19.6 14.8H6.4l3 3'),
    filter: P('M4 6h16l-6.2 7.2v5.4l-3.6 1.8v-7.2z'),
    sortPrice: P('M8 5v11m0 0 2.6-2.6M8 16l-2.6-2.6M16 16V5m0 0 2.6 2.6M16 5l-2.6 2.6'),
    user: `<circle cx="12" cy="8.2" r="3.8" ${S}/>` + P('M4.6 20.2c.6-3.6 3.7-5.6 7.4-5.6s6.8 2 7.4 5.6'),
    info: `<circle cx="12" cy="12" r="8.6" ${S}/>` + P('M12 11v5.4') + `<circle cx="12" cy="8" r="1.05" fill="currentColor"/>`,
    warn: P('M12 3.6 21 19.4H3z') + P('M12 9.4v4.2') + `<circle cx="12" cy="16.6" r="1" fill="currentColor"/>`,
    gift: `<rect x="3.4" y="9" width="17.2" height="11.4" rx="2" ${S}/>` + P('M3.4 13.4h17.2M12 9v11.4') + P('M8.6 9c-2 0-3.2-1-3.2-2.4S6.4 4 7.8 4c1.9 0 4.2 3 4.2 5') + P('M15.4 9c2 0 3.2-1 3.2-2.4S16.6 4 15.2 4c-1.9 0-4.2 3-4.2 5'),
    edit: P('M4.6 19.4h4l10-10a2.2 2.2 0 0 0-3.1-3.1l-10 10z') + P('m14.6 7.6 3.1 3.1'),
    logout: P('M14 4.6H6.4A1.8 1.8 0 0 0 4.6 6.4v11.2a1.8 1.8 0 0 0 1.8 1.8H14') + P('M16.6 8.4 20.6 12l-4 3.6M10.6 12h10'),
    pin: `<circle cx="12" cy="10" r="7" ${S}/><circle cx="12" cy="10" r="2.3" fill="currentColor"/>`,
    pin2: P('M12 21c4-4.6 6-7.6 6-10a6 6 0 1 0-12 0c0 2.4 2 5.4 6 10Z') + `<circle cx="12" cy="11" r="2.2" ${S}/>`,
    location: P('M12 21c4-4.6 6-7.6 6-10a6 6 0 1 0-12 0c0 2.4 2 5.4 6 10Z') + `<circle cx="12" cy="11" r="2.2" ${S}/>`,
    send: P('M4.4 11.6 20 4l-7.6 15.6-2-6.4z') + P('m10.4 13.2 4.2-4.2'),
    heart: P('M12 20s-7.6-4.5-7.6-9.6A4.4 4.4 0 0 1 12 7.4a4.4 4.4 0 0 1 7.6 3c0 5.1-7.6 9.6-7.6 9.6Z'),
    shield: P('M12 3.2 19 6v5.2c0 4.4-3 8-7 9.6-4-1.6-7-5.2-7-9.6V6z') + P('m8.8 12 2.2 2.2 4.3-4.4'),
    wallet: `<rect x="3" y="6.2" width="18" height="13" rx="3" ${S}/>` + P('M3 9.4h18') + `<circle cx="16.6" cy="14.4" r="1.2" fill="currentColor"/>`,
    grid: `<rect x="3.4" y="3.4" width="7" height="7" rx="1.6" ${S}/><rect x="13.6" y="3.4" width="7" height="7" rx="1.6" ${S}/><rect x="3.4" y="13.6" width="7" height="7" rx="1.6" ${S}/><rect x="13.6" y="13.6" width="7" height="7" rx="1.6" ${S}/>`,
    list: P('M8.4 6.4h11.2M8.4 12h11.2M8.4 17.6h11.2') + `<circle cx="4.6" cy="6.4" r="1" fill="currentColor"/><circle cx="4.6" cy="12" r="1" fill="currentColor"/><circle cx="4.6" cy="17.6" r="1" fill="currentColor"/>`,
    qr: `<rect x="3.6" y="3.6" width="6.4" height="6.4" rx="1.4" ${S}/><rect x="14" y="3.6" width="6.4" height="6.4" rx="1.4" ${S}/><rect x="3.6" y="14" width="6.4" height="6.4" rx="1.4" ${S}/>` + P('M14 14h2.6v2.6H14zM17.8 17.8h2.6v2.6h-2.6zM14 20.4h1.4M20.4 14h-1.4'),
    crown: P('M4 17.2 5.6 7l4 4L12 5l2.4 6 4-4L20 17.2z') + P('M4 20h16'),
    leaf: P('M19.6 4.4c0 8-4.4 12.4-11.2 12.4H5.6C5.6 9.2 10 4.4 19.6 4.4Z') + P('M5.6 20c1.4-5 4.4-8 9-9.6'),
    fire: P('M12 21c4 0 6.4-2.6 6.4-6 0-3.2-2.4-5.4-4-8.4-1 2-2 2.8-3 3.4C11 7.4 10.4 5 10.4 3 7.6 5.6 5.6 9 5.6 15c0 3.4 2.4 6 6.4 6Z'),
    spark: P('M12 3.4 13.4 9 19 10.4 13.4 11.8 12 17.4 10.6 11.8 5 10.4 10.6 9z') + P('M18.4 15.6l.6 2.4 2.4.6-2.4.6-.6 2.4-.6-2.4-2.4-.6 2.4-.6z'),
    light: `<circle cx="12" cy="12" r="4" ${S}/>` + P('M12 2.6v2M12 19.4v2M2.6 12h2M19.4 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4'),

    /* ---------------- 服务与功能（招牌图标） ---------------- */
    door: `<path d="M5 20.2V6.4A2.4 2.4 0 0 1 7.4 4H14a2.4 2.4 0 0 1 2.4 2.4v3.2" ${S}/>` + P('M8.4 20.2V13l5-1.6') + P('M5 20.2h6.8M9.2 11.6v2') + P('M18.4 9.4c1.8 0 3.2 1.4 3.2 3.2 0 2.4-3.2 5.2-3.2 5.2s-3.2-2.8-3.2-5.2c0-1.8 1.4-3.2 3.2-3.2Z') + `<circle cx="18.4" cy="12.7" r=".9" fill="currentColor"/>`,
    swapRing: P('M4.8 12a7.2 7.2 0 0 1 12-5.6M19.2 12a7.2 7.2 0 0 1-12 5.6') + P('M16.8 3.6v3.6h-3.6M7.2 20.4v-3.6h3.6') + `<rect x="9.2" y="9.6" width="5.6" height="4.8" rx="1" ${S}/>` + P('M12 9.6V8.2') + P('M10.4 11.8h3.2'),
    appraise: `<circle cx="10.8" cy="10.8" r="6.2" ${S}/>` + P('m15.4 15.4 4.4 4.4') + P('M8.2 9.2h5.2v3l-2.6 1.8-2.6-1.8z') + `<circle cx="10.8" cy="10.4" r=".55" fill="currentColor"/>`,
    book: `<path d="M5 5.2A2.2 2.2 0 0 1 7.2 3H19v18H7.2A2.2 2.2 0 0 1 5 18.8z" ${S}/>` + P('M5 17.6h14') + P('M15.2 3v7l-1.8-1.4L11.6 10V3'),
    grad: P('M3.2 9.4 12 5l8.8 4.4L12 13.8z') + P('M6.8 11.4v5.2c2.8 2.2 7.6 2.2 10.4 0v-5.2') + P('M20.8 9.4v5.6'),
    lost: `<circle cx="8.2" cy="8.2" r="3.8" ${S}/>` + P('M10.9 10.9 18 18M15.4 15.4l1.6-1.6M18 18l1.8-1.8') + P('M19.4 3.6c1.4 0 2.6 1.2 2.6 2.6 0 2-2.6 4.2-2.6 4.2s-2.6-2.2-2.6-4.2c0-1.4 1.2-2.6 2.6-2.6Z') + `<circle cx="19.4" cy="6.2" r=".75" fill="currentColor"/>`,
    semantic: `<circle cx="10.4" cy="10.4" r="6" ${S}/>` + P('m14.8 14.8 4.8 4.8') + P('M17.6 3.4l.8 2.4 2.4.8-2.4.8-.8 2.4-.8-2.4-2.4-.8 2.4-.8z'),
    auction: `<g transform="rotate(-42 12 9.5)"><rect x="7.4" y="5.6" width="2.2" height="7.8" rx="1.1" ${S}/><rect x="9.6" y="6.6" width="4.8" height="5.8" rx=".8" ${S}/><rect x="14.4" y="5.6" width="2.2" height="7.8" rx="1.1" ${S}/><path d="M12 12.4v7.8" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"/></g><path d="M3.2 21h9.6M4.6 21v-1.6a1.1 1.1 0 0 1 1.1-1.1h4.6a1.1 1.1 0 0 1 1.1 1.1V21" ${S}/>`,
    wishBox: P('M4 12h16v7.6H4z') + P('M4 12l2.4-3.2h11.2L20 12') + P('M12 8.8V5M10 6.8l2-2 2 2') + P('M9.6 15.2l1.3 1.3 1.3-1.3 1.3 1.3 1.3-1.3'),
    meet: P('M4.2 9.6a3.2 3.2 0 1 1 6.4 0c0 2.4-3.2 5.2-3.2 5.2s-3.2-2.8-3.2-5.2Z') + `<circle cx="7.4" cy="9.6" r="1" fill="currentColor"/>` + P('M13.4 16.4a3.2 3.2 0 1 1 6.4 0c0 2.4-3.2 5.2-3.2 5.2s-3.2-2.8-3.2-5.2Z') + `<circle cx="16.6" cy="16.4" r="1" fill="currentColor"/>` + P('M10.6 8.4c2.8 0 2.8 7 5.6 7', ' stroke-dasharray="2.6 2.6"'),
    exchange: `<rect x="3.6" y="7" width="5.6" height="4.8" rx="1" ${S}/><rect x="14.8" y="12.2" width="5.6" height="4.8" rx="1" ${S}/>` + P('M10.4 9.4h5.2l-1.8-1.8M13.6 14.6H8.4l1.8 1.8'),
  };

  const illustratedIcons = new Set('door swapRing appraise book grad lost parcel auction wishBox bag checkCircle swap exchange light shield headset grid game'.split(' '));
  window.serviceIcon = function (name, size = 32) {
    if (name === 'gear') {
      return `<svg class="illustrated-icon" viewBox="0 0 36 36" width="${size}" height="${size}" aria-hidden="true">
        <path fill="#0E5759" d="M15 4h6l1 4 3 2 4-1 3 5-3 3v3l3 3-3 5-4-1-3 2-1 4h-6l-1-4-3-2-4 1-3-5 3-3v-3l-3-3 3-5 4 1 3-2z"/>
        <circle cx="18" cy="18.5" r="8" fill="#A9DED0"/>
        <circle cx="18" cy="18.5" r="3.6" fill="#F6C550"/>
      </svg>`;
    }
    return illustratedIcons.has(name)
      ? `<img class="illustrated-icon" src="assets/brand/illustrated-${name}.png" width="${size}" height="${size}" alt="">`
      : icon(name, size);
  };

  const navigation = {
    home: P('m3.5 10 7.2-5.7a2 2 0 0 1 2.6 0l7.2 5.7M5.5 9v9.5a1.5 1.5 0 0 0 1.5 1.5h10a1.5 1.5 0 0 0 1.5-1.5V9M10 20v-5h4v5'),
    community: P('M5 11a5 5 0 0 1 5-5h3a5 5 0 0 1 0 10H9l-4 3v-8M17 9a4 4 0 0 1 3 4v6l-3-2'),
    message: `<rect x="4" y="5.5" width="16" height="13" rx="3" ${S}/>` + P('m5 7 7 6 7-6'),
    me: `<circle cx="12" cy="8" r="3.5" ${S}/>` + P('M5 20v-1a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v1'),
  };
  for (const [name, path] of Object.entries(navigation)) {
    ICONS[name] = path;
    ICONS[name + 'Fill'] = path;
  }
  ICONS.camera = P('M5.5 7.5h2.2l1.5-2h5.6l1.5 2h2.2A2.5 2.5 0 0 1 21 10v7a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17v-7a2.5 2.5 0 0 1 2.5-2.5Z') + `<circle cx="12" cy="13.4" r="3.1" ${S}/>`;
  ICONS.filter = P('M4 7h4m4 0h8M4 12h10m4 0h2M4 17h6m4 0h6M8 5v4m10 1v4m-8 1v4');
  ICONS.publish = P('M12 5v14M5 12h14');
  window.icon = function (name, size, cls) {
    const body = ICONS[name] || ICONS.info;
    const s = size || 24;
    return `<svg class="${cls || ''}" viewBox="0 0 24 24" width="${s}" height="${s}" aria-hidden="true">${body}</svg>`;
  };
  window.hasIcon = (n) => !!ICONS[n];
})();
