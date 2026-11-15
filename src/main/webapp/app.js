/* =========================================================================
   换一圈 | 前端应用
   原生 JS，hash 路由，无构建步骤。接口全部走同源 /api。
   ========================================================================= */
(function () {
    'use strict';

    // ------------------------------------------------------------------ 常量

    var CATS = ['教材', '数码', '运动', '生活', '衣物', '绿植', '其他'];
    var CONDS = ['全新', '九成新', '七成新', '有使用痕迹'];
    // Amazon-grade crisp monochrome vector icons (colored via CSS currentColor).
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
        menu: path('M3 6h18') + path('M3 12h18') + path('M3 18h18')
    };
    var CAT_ICON = {教材:navIcon('book'),数码:navIcon('device'),运动:navIcon('sports'),
        生活:navIcon('life'),衣物:navIcon('clothes'),绿植:navIcon('plant'),其他:navIcon('box')};
    var CLAY_ICONS = ['ai', 'auction', 'chat', 'fire', 'game', 'order', 'pin', 'settings', 'star', 'swap', 'user', 'wallet'];
    function clayIcon(name, alt, cls) {
        var key = CLAY_ICONS.indexOf(name) >= 0 ? name : 'star';
        return '<img class="clay-ico' + (cls ? ' ' + cls : '') + '" src="/assets/icons/' + key + '.jpg" alt="' + esc(alt || '') + '" loading="lazy" decoding="async">';
    }

    var OFFER_STATUS = {
        0: ['待响应', 'accent'],
        1: ['已接受', 'success'],
        2: ['已拒绝', ''],
        3: ['已失效', ''],
        4: ['已撤回', ''],
        5: ['已还价', 'brand']
    };

    var state = {
        me: null,
        token: '',
        home: {category: '', condition: '', minCredit: 0, keyword: '', page: 1, items: [], total: 0, hasMore: false},
        publishImages: [],
        offersTab: 'received',
        offersQuery: '',
        offersAdvOpen: false,
        offersStatusFilter: 'all',
        hiddenDemoOrders: [],
        meFilter: 'all',
        relayCat: '全部',
        auctionCat: '全部',
        auctionState: '全部',
        auctionSort: 'default',
        wishCat: '全部',
        activeNoticeIdx: 0,
        commRoom: 'hall',
        commTab: 'posts',
        tiebaPostImg: '',
        tiebaOpenComments: {},
        adminTab: 'dashboard', adminUserQuery: '', adminReportStatus: 0
    };

    // ------------------------------------------------------------------ 工具

    function $(sel, root) {
        return (root || document).querySelector(sel);
    }

    function esc(s) {
        return String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, function (c) {
            return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c];
        });
    }

    var THEME_DEFAULT = '#00baae';
    var THEME_PALETTE = ["00baae", "e1f8f6", "006e67", "007c74", "008d84", "ddf8f5", "eefaf9", "ccebe8", "a4dcd7", "123a37", "285b57", "4f7773", "006f68", "e7f9f7", "007e76", "e3f7f5", "ceece9", "d5efec", "00a99e", "008e85", "ccf2ee", "103f3b", "397772", "007f76", "d6f5f1", "e3f8f6", "007e75", "e4f5f3", "e8f9f7", "3a746e", "e0f6f4", "00867d", "d8efed", "e2f7f5", "c7eeea", "dce9e7", "738380", "1c302e", "758783", "607b77", "eaf8f6", "00877e", "5b7772", "153d39", "173d39", "e7f8f5", "00645e", "102321", "536966", "687977", "4a5d5b", "71817f", "526663"];
    function themeColor() {
        try { var value = localStorage.getItem('hq.themeColor'); return /^#[0-9a-f]{6}$/i.test(value || '') ? value.toLowerCase() : THEME_DEFAULT; }
        catch (e) { return THEME_DEFAULT; }
    }
    function applyTheme(value, persist) {
        if (!/^#[0-9a-f]{6}$/i.test(value || '')) return;
        value = value.toLowerCase();
        var rgb = [1,3,5].map(function (i) { return parseInt(value.slice(i,i+2),16); });
        function mix(target, amount) { return '#' + rgb.map(function (v) { return Math.round(v * (1-amount) + target * amount).toString(16).padStart(2,'0'); }).join(''); }
        var linear = rgb.map(function(v) { v /= 255; return v <= 0.04045 ? v/12.92 : Math.pow((v+0.055)/1.055,2.4); });
        var luminance = .2126*linear[0]+.7152*linear[1]+.0722*linear[2];
        var root = document.documentElement.style;
        root.setProperty('--theme-rgb', rgb.join(','));
        // Transfer each existing accent shade to the selected hue while retaining its lightness.
        function hsl(c) { var r=c[0]/255,g=c[1]/255,b=c[2]/255,max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min,l=(max+min)/2,h=0,sat=d ? d/(1-Math.abs(2*l-1)) : 0; if(d) { if(max===r)h=((g-b)/d)%6;else if(max===g)h=(b-r)/d+2;else h=(r-g)/d+4;h=(h*60+360)%360; } return [h,sat,l]; }
        function fromHsl(h,s,l) { var c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2,v=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];return '#'+v.map(function(q){return Math.round((q+m)*255).toString(16).padStart(2,'0');}).join(''); }
        var selectedHsl=hsl(rgb);
        THEME_PALETTE.forEach(function(hex) { var original=hsl([0,2,4].map(function(i){return parseInt(hex.slice(i,i+2),16);}));root.setProperty('--theme-p-'+hex,fromHsl(selectedHsl[0],original[1]*selectedHsl[1],original[2])); });
        root.setProperty('--theme-color', value);
        root.setProperty('--theme-soft', mix(255,.91));
        root.setProperty('--theme-ink', mix(0,.46));
        root.setProperty('--theme-on', luminance > .179 ? '#102321' : '#ffffff');
        if (persist) { try { localStorage.setItem('hq.themeColor', value); } catch (e) { toast('无法保存设置，请检查浏览器存储权限', 'err'); } }
        var picker = document.querySelector('#theme-color'); if (picker && picker.value !== value) picker.value = value;
        var code = document.querySelector('#theme-value'); if (code) code.textContent = value.toUpperCase();
        document.querySelectorAll('[data-theme]').forEach(function (button) { button.setAttribute('aria-pressed', String(button.dataset.theme === value)); });
    }
    applyTheme(themeColor(), false);
    function settingsGroup(title,links) {
        return '<section class="settings-group"><h2>'+title+'</h2><div>'+links.map(function(link){
            return '<a href="'+link[1]+'">'+link[0]+navIcon('next')+'</a>';
        }).join('')+'</div></section>';
    }

    function renderSettings() {
        var presets = [['青绿','#00baae'],['海蓝','#2878d4'],['紫罗兰','#7955c7'],['珊瑚','#d85b55'],['橙色','#cc7216'],['森林绿','#36865a']];
        var options = presets.map(function(p) { return '<button type="button" class="theme-swatch" data-act="theme-select" data-theme="'+p[1]+'" aria-label="'+p[0]+' '+p[1]+'" aria-pressed="'+String(themeColor()===p[1])+'"><span style="background:'+p[1]+'"></span><small>'+p[0]+'</small></button>'; }).join('');
        var account=settingsGroup('个人',[['个人资料','#/me'],['账号与安全','#/email']]);
        var trade=settingsGroup('交易',[['消息通知','#/notifications'],['我的交换','#/exchange']]);
        var local=settingsGroup('本机记录',[['收藏夹','#/favorites'],['浏览历史','#/history']]);
        var exit=readToken()?'<button class="settings-signout" type="button" data-act="logout">退出登录</button>':'';
        $('#app').innerHTML = shell('settings','<nav class="amz-breadcrumb" aria-label="面包屑"><a href="#/me">您的账户</a><span>›</span><b>账号与偏好设置</b></nav><div class="settings-page redesigned-settings amz-wide-page"><header class="redesign-heading"><h1>账号与偏好设置</h1></header><div class="amz-settings-grid">'+account+trade+local+'</div><section class="settings-card"><h2>主题颜色</h2><p>选择预设颜色，或自定义任意颜色。</p><div class="theme-options">'+options+'</div><div class="theme-custom"><div><b>自定义颜色</b><small>点击色块选择，立即生效</small></div><output id="theme-value">'+themeColor().toUpperCase()+'</output><input id="theme-color" type="color" value="'+themeColor()+'" aria-label="选择自定义主题颜色"></div><button class="theme-reset" type="button" data-act="theme-reset">恢复默认</button><p class="theme-hint">设置保存在当前浏览器，不需要登录。</p></section>'+exit+'</div>');
    }

    function shelfRead(key) {
        try { var data=JSON.parse(localStorage.getItem('hq.shelf.'+key)||'[]');return Array.isArray(data)?data:[]; }catch(e){return [];}
    }
    function shelfWrite(key,items) {
        try { localStorage.setItem('hq.shelf.'+key,JSON.stringify(items.slice(0,100)));return true; }catch(e){toast('浏览器无法保存记录','err');return false;}
    }
    function shelfRemember(key,it) {
        return shelfWrite(key,[{id:Number(it.id),title:it.title,category:it.category,images:it.images}].concat(shelfRead(key).filter(function(x){return x.id!==Number(it.id);})));
    }
    var DEMO_SHELF_ITEMS = [
        {id: 101, isDemo: true, title: '【校内自营】罗技 GPW 二代无线游戏鼠标 白色95新 传感器无暇 盒说配件全', category: '数码', price: '269.00', origPrice: '499.00', subsidy: '校园换物补贴立省15%', stockTag: '', images: '/assets/amz/quad-digital.jpg'},
        {id: 102, isDemo: true, title: '【考研上岸】2026同济高数第七版上下册 + 张宇1000题 + 六级真题全套笔记', category: '教材', price: '39.90', origPrice: '128.00', subsidy: '学长学姐直降补贴', stockTag: '', images: '/assets/amz/quad-books.jpg'},
        {id: 103, isDemo: true, title: '【宿舍神器】米家智能LED长臂护眼台灯 1S 支持米家App无极调光 宿舍不断电', category: '生活', price: '58.00', origPrice: '149.00', subsidy: '支持以物换物抵扣', stockTag: '', images: '/assets/amz/quad-dorm.jpg'},
        {id: 104, isDemo: true, title: '【球场实战】尤尼克斯 YONEX 超轻碳素羽毛球拍 已拉24磅BG65线 赠手胶球包', category: '运动', price: '115.60', origPrice: '260.00', subsidy: '北山书院当面验拍', stockTag: '', images: '/assets/amz/quad-sports.jpg'}
    ];

    function renderShelf() {
        var key = location.hash === '#/history' ? 'history' : 'favorites';
        var savedItems = shelfRead(key);
        var displayList = savedItems.map(function (it, idx) {
            return {
                id: Number(it.id),
                isSaved: true,
                title: it.title || '校园认证好物',
                category: it.category || '校园好物',
                price: it.price ? (Number(it.price) > 500 ? (Number(it.price) / 100).toFixed(2) : Number(it.price).toFixed(2)) : (48 + (idx * 37) % 180) + '.90',
                origPrice: (129 + (idx * 53) % 260) + '.00',
                subsidy: '',
                images: firstImage(it.images) || DEMO_SHELF_ITEMS[idx % DEMO_SHELF_ITEMS.length].images
            };
        });
        for (var i = 0; displayList.length < 4 && i < DEMO_SHELF_ITEMS.length; i++) {
            displayList.push(DEMO_SHELF_ITEMS[i]);
        }

        var cards = displayList.map(function (it) {
            var href = it.isDemo ? '#/idle?cat=' + encodeURIComponent(it.category) : '#/item/' + Number(it.id);
            var priceParts = String(it.price || '68.00').split('.');
            return '<article class="jd-history-card">'
                + '<div class="jd-h-media">'
                + '<a href="' + href + '" class="jd-h-img-link">'
                + '<img src="' + esc(it.images) + '" onerror="this.onerror=null;this.src=\'/assets/amz/quad-digital.jpg\'" alt="' + esc(it.title) + '" loading="lazy">'
                + '</a>'
                + (it.isSaved ? '<button type="button" class="jd-h-del" data-act="shelf-remove" data-key="' + key + '" data-id="' + Number(it.id) + '" title="移出记录">✕</button>' : '')
                + '</div>'
                + '<div class="jd-h-body">'
                + '<a href="' + href + '" class="jd-h-title">' + esc(it.title) + '</a>'
                + '<div class="jd-h-price-row">'
                + '<div class="jd-h-price"><em>¥</em><b>' + esc(priceParts[0]) + '</b><sup>.' + esc(priceParts[1] || '00') + '</sup></div>'
                + '<a href="' + href + '" class="jd-h-plus" aria-label="查看" title="查看">+</a>'
                + '</div>'
                + '</div>'
                + '</article>';
        }).join('');

        var content = '<div class="jd-center-wrap">'
            + jdSideNav(key)
            + '<div class="jd-order-main jd-footprint-main">'
            + '<header class="jd-footprint-head">'
            + '<div class="jd-footprint-brand">'
            + '<img src="/assets/brand/mascot-search.png" alt="">'
            + '<b>换一圈</b>'
            + '<span class="jd-fp-div">|</span>'
            + '<h1>' + (key === 'favorites' ? '商品收藏' : '我的足迹') + '</h1>'
            + '<nav class="jd-fp-tabs" aria-label="收藏与足迹切换">'
            + '<a href="#/history" class="' + (key === 'history' ? 'on' : '') + '">我的足迹 (' + shelfRead('history').length + ')</a>'
            + '<a href="#/favorites" class="' + (key === 'favorites' ? 'on' : '') + '">商品收藏 (' + shelfRead('favorites').length + ') <i>有降价</i></a>'
            + '</nav>'
            + '</div>'
            + '<form class="jd-fp-search" data-form="search">'
            + '<input name="keyword" placeholder="搜索足迹与校内同款好物…" aria-label="搜索商品">'
            + '<a href="#/appraise" class="jd-fp-ai-toggle" title="AI 好物估价">AI 估价 <i></i></a>'
            + '<button type="submit">搜索</button>'
            + '</form>'
            + '</header>'
            + '<div class="jd-fp-date-bar">'
            + '<div class="jd-fp-date-left"><b>' + (key === 'favorites' ? '我的收藏' : '浏览足迹') + '</b><span>' + displayList.length + ' 件</span></div>'
            + '<button type="button" class="jd-fp-clear-btn" data-act="shelf-clear" data-key="' + key + '">' + clayIcon('order', '清空', 'is-sm') + ' 全部清空</button>'
            + '</div>'
            + '<div class="jd-history-grid">' + cards + '</div>'
            + '<p class="jd-fp-end"><img src="/assets/brand/mascot-wave-320.webp" alt=""> 没有更多' + (key === 'favorites' ? '收藏商品' : '浏览记录') + '啦~</p>'
            + '</div></div>';

        $('#app').innerHTML = shell('me', content);
    }
    async function renderEmail() {
        var data=await api('/user/email');
        if(currentView.name!=='email')return;
        $('#app').innerHTML=shell('settings','<div class="settings-page"><div class="settings-heading"><h1>邮箱认证</h1><p>验证后，邮箱会绑定到你的账号。</p></div><section class="settings-card"><h2>'+(data.email?'已认证':'尚未认证')+'</h2>'+(data.email?'<p>'+esc(data.email)+'</p>':'')+(data.available?'<form data-form="email-send"><label class="label" for="verify-email">邮箱地址</label><input class="input" id="verify-email" name="email" type="email" maxlength="254" required><button class="btn btn-sm" type="submit">发送验证码</button></form><form data-form="email-verify"><label class="label" for="verify-code">邮箱验证码</label><input class="input" id="verify-code" name="code" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" required><button class="btn btn-primary btn-sm" type="submit">确认认证</button></form>':'<p>邮箱发信服务尚未开通。</p>')+'</section></div>');
    }

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
            ? '<img src="' + esc(img) + '" alt="' + esc(it.title) + '" loading="lazy" decoding="async">'
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

    function go(hash) {
        if (location.hash === hash) {
            render();
        } else {
            location.hash = hash;
        }
    }

    // ------------------------------------------------------------------ 接口

    var BASE = (function () {
        var saved = localStorage.getItem('huanyiquan.api');
        if (saved) return saved.replace(/\/$/, '');
        // 由后端托管时同源，不需要前缀
        if (location.protocol === 'http:' || location.protocol === 'https:') return '';
        return 'http://localhost:8080';
    })();

    function ApiError(msg, code) {
        this.message = msg;
        this.code = code;
    }

    var _apiCache = new Map();
    var _apiInFlight = new Map();
    function _isCacheableGet(method, path, opt) {
        return method === 'GET' && !opt.noCache && path.indexOf('/notification') !== 0 && path.indexOf('/chat') !== 0;
    }

    async function api(path, opt) {
        opt = opt || {};
        var method = (opt.method || 'GET').toUpperCase();
        if (_isCacheableGet(method, path, opt)) {
            var hit = _apiCache.get(path);
            if (hit && hit.exp > Date.now()) return hit.data;
            if (_apiInFlight.has(path)) return _apiInFlight.get(path);
        } else if (method !== 'GET') {
            _apiCache.clear();
        }
        var run = (async function () {
        var init = {method: method, credentials: 'include', headers: {}, signal: opt.signal};
        if (opt.form) {
            init.body = opt.form;
        } else if (opt.body !== undefined) {
            init.headers['Content-Type'] = 'application/json';
            init.body = JSON.stringify(opt.body);
        }
        // 凭证放请求头，不依赖浏览器是否允许写 cookie
        var token = readToken();
        if (token) {
            init.headers['X-Token'] = token;
        }
        var res;
        try {
            res = await fetch(BASE + '/api' + path, init);
        } catch (e) {
            if (e.name === 'AbortError') throw e;
            throw new ApiError('连不上服务器，确认后端已经在 8080 端口启动', 0);
        }
        var issued = res.headers.get('X-Token');
        if (issued) {
            writeToken(issued);
        }
        var data = null;
        try {
            data = await res.json();
        } catch (e) {
            // 忽略非 JSON 响应
        }
        if (res.status === 401 || (data && data.code === 401)) {
            state.me = null;
            writeToken('');
            if (opt.optionalAuth) throw new ApiError((data && data.msg) || '请先登录', 401);
            // 记下当前页面，重新登录后跳回来
            if (location.hash && location.hash !== '#/login') {
                sessionStorage.setItem('hq.returnTo', location.hash);
            }
            if (location.hash !== '#/login') {
                location.hash = '#/login';
            }
            throw new ApiError((data && data.msg) || '登录状态已失效，请重新登录', 401);
        }
        if (!res.ok || (data && data.code !== 0)) {
            throw new ApiError((data && data.msg) || '请求失败（' + res.status + '）', (data && data.code) || res.status);
        }
        var out = data ? data.data : null;
        if (_isCacheableGet(method, path, opt)) {
            _apiCache.set(path, { data: out, exp: Date.now() + 12000 });
        }
        return out;
        })();
        if (_isCacheableGet(method, path, opt)) {
            _apiInFlight.set(path, run);
            try { return await run; } finally { _apiInFlight.delete(path); }
        }
        return run;
    }

    function readToken() {
        if (state.token) {
            return state.token;
        }
        try {
            return localStorage.getItem('hq.token') || '';
        } catch (e) {
            return '';
        }
    }

    function writeToken(v) {
        state.token = v || '';
        try {
            if (v) {
                localStorage.setItem('hq.token', v);
            } else {
                localStorage.removeItem('hq.token');
            }
        } catch (e) {
            // 无痕模式下可能写不进去，忽略
        }
    }

    async function withBusy(btn, fn) {
        if (btn) {
            btn.disabled = true;
            btn.dataset.text = btn.textContent;
        }
        try {
            return await fn();
        } catch (e) {
            toast(e.message || '操作失败', 'err');
            return null;
        } finally {
            if (btn) {
                btn.disabled = false;
            }
        }
    }

    // ------------------------------------------------------------------ 骨架

    function navIcon(name) {
        return '<svg class="nav-icon line-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+ICONS[name]+'</svg>';
    }
    function tabbar(active) {
        if(active==='home')active='market';if(active==='offers'||active==='exchange')active='trade';
        function t(key,icon,label){
            var selected=active===key;
            return '<button class="tab '+(selected?'on':'')+'"'+(selected?' aria-current="page"':'')+' data-act="go" data-to="#/'+key+'"><span class="ico">'+navIcon(icon)+(key==='notifications'?'<span class="notice-count" hidden></span>':'')+'</span><span>'+label+'</span></button>';
        }
        return '<nav class="tabbar" aria-label="主导航">'+t('market','market','首页')+t('community','community','社区')
            +'<button class="tab tab-fab'+(active==='publish'?' on':'')+'"'+(active==='publish'?' aria-current="page"':'')+' data-act="go" data-to="#/publish"><span class="fab">'+navIcon('add')+'</span><span>发布</span></button>'
            +t('notifications','notice','消息')+t('me','me','我的')+'</nav>';
    }
    function topnav(active) {
        if(active==='home')active='market';if(active==='offers'||active==='exchange')active='trade';
        var items=[['market','首页'],['idle','校园闲置'],['community','社区'],['relay','换物接力'],['trade','我的交易'],['wishes','求换专区'],['auctions','拍卖']];
        if (state.me && state.me.role === 1) items.push(['admin','管理后台']);
        var html = items.map(function (item) {
            var selected = active === item[0];
            return '<a href="#/' + item[0] + '"' + (selected ? ' class="on" aria-current="page"' : '') + '>' + item[1] + '</a>';
        }).join('');
        return '<nav class="topnav" aria-label="网站导航">'+html+'</nav>';
    }
    function logoMarkup() {
        return '<img class="brand-logo" src="/assets/brand/brand-mascot-logo.png" alt="" width="48" height="48">';
    }
    function amzFooter() {
        return '<footer class="amz-footer">'
            + '<button type="button" class="amz-back-top" data-act="scroll-top">返回顶部</button>'
            + '<div class="amz-footer-cols"><div>'
            + '<div><h3>了解换一圈</h3><a href="#/home">关于校园换物</a><a href="#/relay">换物接力原理</a><a href="#/community">校园社区公约</a></div>'
            + '<div><h3>校园服务</h3><a href="#/idle">校园闲置</a><a href="#/auctions">校园拍卖</a><a href="#/wishes">求换专区</a><a href="#/publish">发布闲置</a></div>'
            + '<div><h3>交易保障</h3><a href="#/offers">我的报价</a><a href="#/exchange">我的交换单</a><a href="#/favorites">收藏与历史</a></div>'
            + '<div><h3>账户与帮助</h3><a href="#/me">个人中心</a><a href="#/settings">账号设置</a><a href="#/notifications">消息通知</a></div>'
            + '</div></div>'
            + '<div class="amz-footer-base"><div class="amz-footer-brand">' + logoMarkup() + '<span>换一圈</span></div><p>重庆移通学院 校园闲置流转平台</p></div>'
            + '</footer>';
    }
    function shell(active,content) {
        setTimeout(refreshNoticeCount,0);
        var me=state.me;
        var account=me?'<button class="avatar" data-act="go" data-to="#/me" title="'+esc(me.nickname)+'">'+esc(me.nickname.slice(0,1))+'</button>':(readToken()?'<a class="header-account" href="#/me">个人中心</a>':'<a class="header-account" href="#/login">登录 / 注册</a>');
        var popCta = me
            ? '<div class="amz-pop-top"><a class="amz-pop-btn" href="#/me">进入个人中心</a><p><b>'+esc(me.nickname)+'</b>（信用 '+me.credit+'）<button type="button" class="link-btn" data-act="logout">退出</button></p></div>'
            : '<div class="amz-pop-top"><a class="amz-pop-btn" href="#/login">立即登录</a><p>新同学？<a href="#/register">点此免费注册</a></p></div>';
        var amzAccount='<div class="amz-acct-wrap">'
            +'<a class="amz-nav-item amz-acct-trigger" href="'+(me?'#/me':'#/login')+'"><small>你好，'+(me?esc(me.nickname):'请登录')+'</small><b>账户与列表 <span class="amz-caret-sm">▾</span></b></a>'
            +'<div class="amz-acct-dropdown" role="menu"><span class="amz-pop-arrow"></span>'+popCta
            +'<div class="amz-pop-cols">'
            +'<div><h4>我的列表</h4><a href="#/favorites">我的收藏夹</a><a href="#/history">浏览足迹</a><a href="#/wishes">求换心愿单</a><a href="#/relay">三方换物接力</a><button type="button" class="amz-pop-link" data-act="estimate">AI 好物估价</button></div>'
            +'<div><h4>我的账户</h4><a href="#/me">我的主页</a><a href="#/exchange">我的交换单</a><a href="#/offers">收发报价记录</a><a href="#/auction/mine">我的校园拍卖</a><a href="#/notifications">消息通知中心</a><a href="#/settings">账号与偏好设置</a></div>'
            +'</div></div></div>';
        var catOpts='<option value="">全部</option>'+CATS.map(function(c){return '<option value="'+esc(c)+'"'+(state.home.category===c?' selected':'')+'>'+esc(c)+'</option>';}).join('');
        var search='<form class="header-search amz-search" data-form="search"><select class="amz-search-cat" name="category" aria-label="选择分类">'+catOpts+'</select><input name="keyword" aria-label="搜索闲置" placeholder="搜索换一圈校园好物..." value="'+esc(state.home.keyword)+'"><button type="submit" aria-label="搜索">'+navIcon('search')+'<span>搜索</span></button></form>';
        var favCount=shelfRead('favorites').length;
        var amzCartSvg = '<svg class="amz-cart-svg" viewBox="0 0 38 28" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h5l4.2 15.5h17.6L33 7H9"/><circle cx="13" cy="24" r="2.2" fill="currentColor"/><circle cx="27" cy="24" r="2.2" fill="currentColor"/></svg>';
        return '<a class="skip-link" href="#main-content" data-act="skip-main">跳到主要内容</a><div class="site-utility"><div><span>重庆移通学院 | 校园换物社区</span><span><a href="#/notifications">消息通知</a><a href="#/me">个人中心</a></span></div></div>'
            +'<header class="appbar"><div class="appbar-inner">'
            +'<a class="brand" href="#/market">'+logoMarkup()+'<span class="brand-word"><span class="brand-name">换一圈</span><svg class="brand-smile" viewBox="0 0 80 14" fill="none"><path d="M4 3c20 10 50 10 70 0" stroke="#f08c1a" stroke-width="2.8" stroke-linecap="round"/><path d="M68 1l7 2-4 6" stroke="#f08c1a" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span></a>'
            +'<a class="amz-deliver" href="#/idle">'+navIcon('pin')+'<span><small>面交至</small><b>重庆移通学院</b></span></a>'
            +search
            +'<div class="header-actions">'
            +amzAccount
            +'<a class="amz-nav-item amz-orders-link" href="#/exchange"><b>我的订单</b></a>'
            +'<a class="notice-link amz-nav-item" href="#/notifications" aria-label="消息通知"><b>通知</b><span class="notice-count" hidden></span></a>'
            +'<a class="settings-link" href="#/settings" aria-label="设置" title="设置">'+navIcon('settings')+'</a>'
            +'<a class="shelf-link amz-cart" href="#/favorites" aria-label="收藏与历史" title="收藏夹"><span class="amz-cart-ico">'+amzCartSvg+'<span class="amz-cart-num">'+favCount+'</span></span><b class="amz-cart-label">收藏夹</b></a>'
            +'<a class="amz-msg-top'+(active==='notifications'?' on':'')+'" href="#/notifications" aria-label="消息中心" title="消息中心"><span class="amz-msg-ico"><img src="/assets/amz/nav-msg-icon.jpg" alt="消息"><span class="notice-count" hidden></span></span><span class="amz-msg-txt"><b>消息</b></span></a>'
            +account+'</div></div>'
            +'<div class="header-nav-wrap"><a class="amz-all-btn" href="#/idle">'+navIcon('menu')+'<span>全部</span></a>'+topnav(active)
            +'<div class="amz-sub-right"><button type="button" class="amz-sub-link" data-act="estimate">AI 好物估价</button><a class="header-publish" href="#/publish">'+navIcon('add')+' 发布闲置</a></div></div></header>'
            +'<main id="main-content" tabindex="-1" class="shell '+(active==='market'||active==='home'||active==='idle'?'shell-market':'')+'">'+content+'</main>'+amzFooter()+tabbar(active);
    }
    function tradeTabs(active){
        return '<nav class="amz-breadcrumb" aria-label="面包屑"><a href="#/me">您的账户</a><span>›</span><b>我的交易</b></nav>'
            + '<div class="trade-top amz-orders-head"><h1>我的交易</h1>'
            + '<nav class="trade-sections amz-tabs" aria-label="交易分类">'
            + '<a class="'+(active==='offers'?'on':'')+'" href="#/offers">报价记录</a>'
            + '<a class="'+(active==='exchange'?'on':'')+'" href="#/exchange">交换单</a>'
            + '</nav></div>';
    }

    function emptyState(icon, title, sub, actionHtml) {
        return '<div class="empty"><div class="ico">' + icon + '</div><p>' + esc(title) + '</p>'
            + (sub ? '<div class="sub">' + esc(sub) + '</div>' : '')
            + (actionHtml ? '<div style="margin-top:16px">' + actionHtml + '</div>' : '')
            + '</div>';
    }

    function loading() {
        var one = '<div class="card" style="padding:10px;display:flex;gap:12px">'
            + '<div class="skeleton" style="width:92px;height:92px"></div>'
            + '<div style="flex:1"><div class="skeleton" style="height:16px;width:60%;margin-bottom:8px"></div>'
            + '<div class="skeleton" style="height:12px;width:90%;margin-bottom:8px"></div>'
            + '<div class="skeleton" style="height:12px;width:40%"></div></div></div>';
        return '<div class="grid">' + one + one + one + '</div>';
    }

    // ------------------------------------------------------------------ 组件

    // 两列商品卡：图片占满上半，标题两行，底部左侧信用分（红色强调）
    function demoReferencePrice(item) {
        return item.isDemo && Number(item.price) > 0 ? '参考价 ¥' + (Number(item.price) / 100).toFixed(2) : '';
    }

    function pCard(it) {
        var locked=it.status&&it.status!==1, img=firstImage(it.images);
        var face=img?'<img src="'+esc(window.catalogThumbnail(img))+'" alt="'+esc(it.title)+'" width="300" height="300" loading="lazy" decoding="async">':(CAT_ICON[it.category]||CAT_ICON['其他']);
        var mode = window.campusExchange.mode(it);
        var hasPrice = (it.isDemo && window.campusExchange.supports(it,1) && Number(it.price) > 0) || (!it.isDemo && mode === 1 && Number(it.price) > 0);
        var priceHtml;
        if (hasPrice) {
            var parts = (Number(it.price) / 100).toFixed(2).split('.');
            priceHtml = '<span class="amz-price"><em>¥</em><b>' + parts[0] + '</b><sup>.' + parts[1] + '</sup></span>';
        } else {
            var wantHint = it.wantText || it.wantCategory;
            priceHtml = '<span class="swap-label">' + (mode === 3 && !it.isDemo ? '拍卖竞价' : (wantHint ? '想换 ' + esc(wantHint) : '以物换物')) + '</span>';
        }
        var credit = it.ownerCredit === undefined || it.ownerCredit === null ? 80 : Number(it.ownerCredit);
        var stars = credit >= 90 ? 5 : credit >= 75 ? 4 : 3;
        return '<button class="pcard '+(locked?'locked':'')+'" data-act="go" data-to="#/item/'+it.id+'"><div class="pimg" data-cat="'+esc(it.category)+'">'+face
            +(locked?'<span class="pbadge">'+esc(it.statusText||'已换出')+'</span>':'')+'</div>'
            +'<div class="pbody"><p class="ptitle">'+esc(it.title)+'</p>'
            +'<div class="pcard-bottom">'+priceHtml+'</div></div></button>';
    }

    /** 信用分换算等级，和后端 UserService.creditLevel 的阈值保持一致 */
    function creditLevelOf(credit) {
        var c = credit === null || credit === undefined ? 0 : credit;
        if (c >= 90) return {text: '优秀', cls: 'success'};
        if (c >= 80) return {text: '良好', cls: 'brand'};
        if (c >= 70) return {text: '一般', cls: ''};
        if (c >= 60) return {text: '较低', cls: 'accent'};
        return {text: '受限', cls: 'accent'};
    }

    function creditBadge(u) {
        var v = u.credit === undefined || u.credit === null ? '-' : u.credit;
        return '<span class="credit ' + creditCls(u.credit) + '">信用 <b class="num">' + v + '</b></span>';
    }

    function stepsHtml(exchange) {
        var status = exchange.status;
        var firstStep = window.exchangeNeedsConfirmation(exchange) ? 1 : 2;
        var labels = ['待确认', '待交付', '已完成'];
        if (status >= 4) {
            return '<div class="steps"><div class="step" style="flex:1">'
                + '<span style="color:var(--danger-600);font-weight:600">'
                + (status === 4 ? '已失效' : '已超时关闭') + '</span></div></div>';
        }
        var html = '<div class="steps" aria-label="交换进度">';
        for (var step = firstStep; step <= labels.length; step++) {
            var cls = step < status ? 'done' : (step === status ? 'now' : '');
            html += '<div class="step ' + cls + '"' + (step === status ? ' aria-current="step"' : '') + '>' + labels[step - 1] + '</div>';
        }
        return html + '</div>';
    }

    // ------------------------------------------------------------------ 登录

    function renderLogin(mode) {
        mode = mode || 'login';
        var isReg = mode === 'register';
        var method = isReg ? 'student' : (state.loginMethod || 'student');
        var methods = {student:'账号密码', email:'邮箱密码', code:'邮箱验证码'};
        var body = '<main class="entry-screen"><div class="entry-brand"><img src="/assets/brand/brand-mascot-logo.png" alt=""><span>换一圈</span></div><div class="entry-panel"><div class="entry-art"><div class="entry-portrait"><img src="/assets/brand/mascot-box.png" alt="抱着箱子的换一圈吉祥物"></div><p>校园闲置，让好物流转</p></div><section class="entry-content">'
            + '<h1>' + (isReg ? '注册账号' : '欢迎回来') + '</h1>'
            + '<p class="entry-intro">' + (isReg ? '使用学号和邮箱创建校园账号' : '登录换一圈，继续逛校园好物') + '</p>'
            + '<form data-form="' + (isReg ? 'register' : 'login') + '">'
            + (isReg ? '' : '<div class="entry-methods" role="group" aria-label="登录方式">' + Object.keys(methods).map(function (key) {
                return '<button type="button" class="btn ' + (key === method ? 'btn-primary' : 'btn-ghost') + '" data-act="login-method" data-v="' + key + '" aria-pressed="' + (key === method) + '">' + methods[key] + '</button>';
            }).join('') + '</div>')
            + (method === 'student' ? '<div class="field"><label class="label">学号 <span class="opt">10 位数字</span></label>'
            + '<input class="input" name="studentNo" autocomplete="username" inputmode="numeric" '
            + 'maxlength="10" placeholder="例如 2021210001" required></div>'
                : '<div class="field"><label class="label" for="login-email">邮箱</label><input class="input" id="login-email" type="email" name="email" autocomplete="username" required></div>')
            + (isReg ? '<div class="field"><label class="label">昵称</label>'
                + '<input class="input" name="nickname" placeholder="别人看到的名字" maxlength="20" required></div>' : '')
            + (method === 'code'
                ? '<div class="field"><label class="label" for="login-code">验证码</label><div class="entry-code"><input class="input" id="login-code" name="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}" required><button type="button" class="btn btn-ghost" data-act="login-email-send">发送验证码</button></div></div>'
                : '<div class="field"><label class="label">密码</label>'
            + '<input class="input" type="password" name="password" autocomplete="' + (isReg ? 'new-password' : 'current-password') + '" placeholder="请输入密码" required></div>')
            + (isReg ? '<div class="field"><label class="label">院系 <span class="opt">选填</span></label>'
                + '<input class="input" name="college" placeholder="例如 计算机学院"></div>'
                + '<div class="field"><label class="label">宿舍楼 <span class="opt">选填，用于就近面交</span></label>'
                + '<input class="input" name="building" placeholder="例如 紫荆 3 号楼"></div>' : '')
            + (isReg ? '<div class="field"><label class="label" for="register-email">邮箱</label>'
                + '<input class="input" id="register-email" type="email" name="email" autocomplete="email" required></div>'
                + '<div class="field"><label class="label" for="register-code">邮箱验证码</label>'
                + '<div class="entry-code"><input class="input" id="register-code" name="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}" required>'
                + '<button class="btn btn-ghost" type="button" data-act="register-email-send">发送验证码</button></div></div>' : '')
            + '<div class="form-error" id="form-error"></div>'
            + '<button class="btn btn-primary btn-block" type="submit" style="margin-top:6px">'
            + (isReg ? '注册' : '登录') + '</button>'
            + '</form>'
            + '<div class="entry-switch">' + (isReg ? '已有账号？' : '还没有账号？')
            + '<button data-act="auth-mode" data-mode="' + (isReg ? 'login' : 'register') + '">'
            + (isReg ? '去登录' : '去注册') + '</button></div>'
            + '</section></div></main>';
        $('#app').innerHTML = body;
    }

    /** 打开登录页就探一次：后端通没通、数据库连没连 */
    async function checkChain() {
        var box = $('#chain-status');
        if (!box) return;
        box.innerHTML = '<div class="row"><span class="dot"></span>正在检测后端与数据库…</div>';

        var server = false, db = false, onShelf = 0, err = '';
        try {
            var d = await api('/meta/status');
            server = true;
            db = !!d.db;
            onShelf = d.onShelf || 0;
            err = d.dbError || '';
        } catch (e) {
            server = false;
        }

        var html = '<div class="row"><span class="dot ' + (server ? 'ok' : 'bad') + '"></span>'
            + '<b>后端</b>' + (server ? '已连接' : '未启动 | 双击 start.bat')
            + '</div>'
            + '<div class="row"><span class="dot ' + (db ? 'ok' : 'bad') + '"></span>'
            + '<b>数据库</b>' + (db ? '正常 | 在架 ' + onShelf + ' 件'
                : '连不上 | 检查 MySQL 与 db.properties')
            + '</div>';
        if (server && !db && err) {
            html += '<div class="row" style="color:var(--ink-400);font-size:11px">' + esc(err) + '</div>';
        }
        html += '<button class="chain-retry" type="button" data-act="check-chain">重新检测</button>';
        box.innerHTML = html;
    }

    // ------------------------------------------------------------------ 集市

    function campusServices(useClay) {
        var services = [
            ['door','校内配送','campus-search','校内可送','按关键词搜索'],
            ['trade','以物换物','home-feed',''],
            ['appraise','好物估价','estimate',''],
            ['book','教材专区','f-cat','教材'],
            ['grad','毕业季闲置','campus-search','毕业','按关键词搜索'],
            ['lost','失物招领','lost-found','','去社区发帖']
        ];
        return '<nav class="campus-services" aria-label="校园服务">'+services.map(function(service, index) {
            var icon=useClay?'<img src="/assets/brand/service-'+(27+index)+'.png" width="38" height="38" alt="">':navIcon(service[0]);
            return '<button type="button" data-act="'+service[2]+'" data-v="'+service[3]+'"><span class="campus-service-icon">'+icon+'</span><span>'+service[1]+'</span>'+(service[4]?'<small>'+service[4]+'</small>':'')+'</button>';
        }).join('')+'</nav>';
    }

    function openEstimate() {
        go('#/appraise');
    }

    function searchHistory() {
        try { var list=JSON.parse(localStorage.getItem('hq.searchHistory')||'[]');return Array.isArray(list)?list.filter(function(term){return typeof term==='string';}):[]; }
        catch(e){return [];}
    }

    function rememberSearch(term) {
        if(!term)return;
        try{localStorage.setItem('hq.searchHistory',JSON.stringify([term].concat(searchHistory().filter(function(old){return old!==term;})).slice(0,12)));}catch(e){}
    }

    function renderSearchPage(results) {
        var term=state.home.keyword;
        var history=searchHistory();
        var suggestions=(history.length?history:['高数教材','宿舍收纳','羽毛球拍','机械键盘']).map(function(word){
            return '<button type="button" data-act="search-term" data-v="'+esc(word)+'">'+esc(word)+'</button>';
        }).join('');
        var form='<form class="mobile-search search-page-form" data-form="search"><span class="mobile-search-icon">'+navIcon('search')+'</span><input name="keyword" type="search" aria-label="搜索校园闲置" placeholder="搜索校园闲置" value="'+esc(term)+'"><button type="submit">搜索</button></form>';
        var landing='<section class="search-suggestions"><div class="redesign-heading"><h2>'+(history.length?'搜索历史':'试试这些关键词')+'</h2>'+(history.length?'<button class="link-btn" data-act="search-clear-history">清空历史</button>':'')+'</div><div class="search-terms">'+suggestions+'</div></section>';
        $('#app').innerHTML=shell('market','<section class="redesign-page search-page"><header class="redesign-heading"><a class="icon-action" href="#/home" aria-label="返回首页">'+navIcon('back')+'</a><h1>搜索闲置</h1>'+(term?'<button class="link-btn" data-act="search-term" data-v="">清除关键词</button>':'')+'</header>'+form+(term?results:landing)+'</section>');
    }

    function renderHome() {
        var h=state.home;
        var baseHash=(location.hash||'#/home').split('?')[0];
        var idle=baseHash==='#/idle';
        var isSearch=baseHash==='#/search';
        var minCredit=Number(h.minCredit||0);
        var visibleItems=minCredit>0 ? h.items.filter(function(it){
            var c = it.ownerCredit===undefined||it.ownerCredit===null ? 80 : Number(it.ownerCredit);
            return c >= minCredit;
        }) : h.items;
        var me=state.me;
        var categories=[
            ['','全部好物','全站热换'],
            ['教材','图书教材','考研/课本'],
            ['数码','数码设备','键鼠/耳机'],
            ['运动','运动户外','球拍/器材'],
            ['生活','宿舍生活','台灯/收纳'],
            ['衣物','服饰穿搭','潮牌/外套'],
            ['绿植','绿植花卉','多肉/盆栽'],
            ['其他','兴趣好物','手办/乐器']
        ];
        var desktopCats=categories.map(function(c){return '<button class="desk-category '+(h.category===c[0]?'on':'')+'" data-act="f-cat" data-v="'+esc(c[0])+'"><span class="desk-category-icon">'+(c[0]?(CAT_ICON[c[0]]||CAT_ICON['其他']):navIcon('market'))+'</span><span class="desk-cat-main"><b>'+esc(c[1])+'</b></span><span class="desk-category-arrow">'+navIcon('next')+'</span></button>';}).join('');
        var condSidebar='<div class="amz-side-group"><h3>新旧成色</h3>'+[['','不限成色'],['全新','全新未拆'],['九成新','九成新'],['七成新','七成新'],['有使用痕迹','有使用痕迹']].map(function(c){
            var checked = h.condition===c[0];
            return '<button class="desk-category amz-check-row '+(checked?'on':'')+'" data-act="f-cond" data-v="'+esc(c[0])+'"><span class="amz-radio-dot '+(checked?'on':'')+'"></span><span>'+esc(c[1])+'</span></button>';
        }).join('')+'</div>';
        var creditSidebar='<div class="amz-side-group"><h3>物主信用</h3>'
            +[[90,'★★★★★','90分以上'],[80,'★★★★☆','80分以上'],[60,'★★★☆☆','60分以上']].map(function(row){
                var on = minCredit === row[0];
                return '<button type="button" class="desk-category amz-star-filter '+(on?'on':'')+'" data-act="f-credit" data-v="'+row[0]+'"><span class="amz-stars">'+row[1]+'</span><span class="amz-credit-val">'+row[2]+'</span></button>';
            }).join('')
            +'</div>';
        var spotSidebar='<div class="amz-side-group"><h3>热门校内面交点</h3><div class="amz-side-tags">'
            +['北山斋宿舍','南山书院','图书馆正门','第一食堂','菜鸟驿站','双栀书院'].map(function(s){
                return '<button type="button" class="amz-side-tag" data-act="campus-search" data-v="'+s+'">'+clayIcon('pin','定位','is-sm')+' '+s+'</button>';
            }).join('')+'</div></div>';
        var mobileCats=categories.map(function(c){return '<button class="mobile-category '+(h.category===c[0]?'on':'')+'" data-act="f-cat" data-v="'+esc(c[0])+'"><b>'+esc(c[1])+'</b></button>';}).join('');
        var mobileSearch='<form class="mobile-search" data-form="search"><a class="mobile-search-icon" href="#/search" aria-label="打开搜索页">'+navIcon('search')+'</a><input name="keyword" aria-label="搜索校园闲置" placeholder="搜搜校园里的闲置好物" value="'+esc(h.keyword)+'"><button type="submit">搜索</button></form>';
        var mascotImage='<img src="/assets/brand/mascot-wave-320.webp" width="320" height="320" alt="挥手的换一圈吉祥物猫猫" decoding="async">';
        var shortcuts=[['#/offers','trade','我的报价'],['#/exchange','trade','我的交换'],['#/favorites','heart','收藏与历史']].map(function(link){
            return '<a class="desk-category" href="'+link[0]+'"><span class="desk-category-icon">'+navIcon(link[1])+'</span>'+link[2]+'</a>';
        }).join('');

        // 5列彩色大图入口卡片条
        var posterStrip = '<section class="amz-poster-strip" aria-label="特色频道">'
            + '<div class="amz-poster-head"><h2>校园特色频道</h2></div>'
            + '<div class="amz-poster-row">'
            + '<a class="amz-poster-card poster-orange" href="#/auctions"><div class="amz-poster-copy"><h3>校园拍卖</h3><span>1元起拍 ›</span></div><div class="amz-poster-collage"><span class="p-frame f1"><img src="/assets/amz/quad-auction.jpg" alt=""></span><span class="p-frame f2"><img src="/assets/amz/quad-digital.jpg" alt=""></span><span class="p-frame f3"><img src="/assets/amz/quad-books.jpg" alt=""></span><span class="p-frame f4"><img src="/assets/brand/mascot-box.png" alt=""></span></div></a>'
            + '<button type="button" class="amz-poster-card poster-sage" data-act="estimate"><div class="amz-poster-copy"><h3>AI 好物估价</h3></div><div class="amz-poster-art"><img src="/assets/amz/quad-appraise.jpg" alt="AI好物估价"></div></button>'
            + '<a class="amz-poster-card poster-peach" href="#/relay"><div class="amz-poster-copy"><h3>换物接力</h3></div><div class="amz-poster-art"><img src="/assets/amz/quad-relay.jpg" alt="换物接力"></div></a>'
            + '<a class="amz-poster-card poster-sand" href="#/idle"><div class="amz-poster-copy"><h3>毕业好物</h3></div><div class="amz-poster-art"><img src="/assets/amz/quad-grad.jpg" alt="毕业好物"></div></a>'
            + '<a class="amz-poster-card poster-sky" href="#/community"><div class="amz-poster-copy"><h3>校园社区</h3></div><div class="amz-poster-art"><img src="/assets/amz/quad-community.jpg" alt="校园社区"></div></a>'
            + '</div></section>';

        // 亚马逊首页：紧凑 1/4 高森林绿横幅 + 4 列矩阵 + 5 列视觉海报条
        var amzHomeTop = '<section class="desktop-market amz-home-stage">'
            + '<div class="amz-hero amz-hero-compact">'
            + '<div class="amz-hero-inner">'
            + '<div class="amz-hero-copy">'
            + '<h1>好东西，再转一圈。</h1>'
            + '</div>'
            + '<div class="amz-hero-btns"><a class="btn amz-btn-orange" href="#/idle">逛校园闲置</a><a class="btn amz-btn-outline" href="#/publish">发布闲置</a><a class="btn amz-btn-outline" href="#/appraise">AI 估价</a></div>'
            + '</div></div>'
            + '<div class="amz-quad-grid">'
            + '<div class="amz-quad-card"><h2>热门校园分类</h2><div class="amz-quad-2x2 amz-quad-photos">'
            + '<button data-act="f-cat" data-v="教材"><span class="amz-q-photo"><img src="/assets/amz/quad-books.jpg" alt="图书教材" loading="lazy"></span><b>图书教材</b></button>'
            + '<button data-act="f-cat" data-v="数码"><span class="amz-q-photo"><img src="/assets/amz/quad-digital.jpg" alt="数码设备" loading="lazy"></span><b>数码设备</b></button>'
            + '<button data-act="f-cat" data-v="运动"><span class="amz-q-photo"><img src="/assets/amz/quad-sports.jpg" alt="运动户外" loading="lazy"></span><b>运动户外</b></button>'
            + '<button data-act="f-cat" data-v="生活"><span class="amz-q-photo"><img src="/assets/amz/quad-dorm.jpg" alt="宿舍生活" loading="lazy"></span><b>宿舍生活</b></button>'
            + '</div><a class="amz-quad-more" href="#/idle">查看全部分类</a></div>'
            + '<div class="amz-quad-card"><h2>校园服务直通车</h2><div class="amz-quad-2x2 amz-quad-photos">'
            + '<a href="#/idle"><span class="amz-q-photo"><img src="/assets/amz/quad-delivery.jpg" alt="校内可送" loading="lazy"></span><b>校内可送</b></a>'
            + '<a href="#/home"><span class="amz-q-photo"><img src="/assets/amz/quad-swap.jpg" alt="以物换物" loading="lazy"></span><b>以物换物</b></a>'
            + '<a href="#/appraise"><span class="amz-q-photo"><img src="/assets/amz/quad-appraise.jpg" alt="好物估价" loading="lazy"></span><b>好物估价</b></a>'
            + '<a href="#/auctions"><span class="amz-q-photo"><img src="/assets/amz/quad-grad.jpg" alt="毕业好物" loading="lazy"></span><b>毕业好物</b></a>'
            + '</div><a class="amz-quad-more" href="#/community">去校园社区看看</a></div>'
            + '<div class="amz-quad-card"><h2>拍卖与换物接力</h2><div class="amz-quad-2x2 amz-quad-photos">'
            + '<a href="#/auctions"><span class="amz-q-photo"><img src="/assets/amz/quad-auction.jpg" alt="校园拍卖" loading="lazy"></span><b>校园拍卖</b></a>'
            + '<a href="#/wishes"><span class="amz-q-photo"><img src="/assets/amz/quad-wishes.jpg" alt="求换专区" loading="lazy"></span><b>求换专区</b></a>'
            + '<a href="#/relay"><span class="amz-q-photo"><img src="/assets/amz/quad-relay.jpg" alt="换物接力" loading="lazy"></span><b>换物接力</b></a>'
            + '<a href="#/community"><span class="amz-q-photo"><img src="/assets/amz/quad-community.jpg" alt="校内圈子" loading="lazy"></span><b>校内圈子</b></a>'
            + '</div><a class="amz-quad-more" href="#/auctions">进入拍卖专场</a></div>'
            + '<div class="amz-quad-card amz-quad-account">'
            + (me ? '<h2>你好，' + esc(me.nickname) + '</h2>'
                  + '<div class="amz-acct-mini amz-credit-mascot-box">'
                  + '<div class="amz-credit-art"><img src="/assets/amz/mascot-credit-card.png" alt="小唤吉祥物"></div>'
                  + '<div class="amz-credit-info">'
                  + '<div class="amz-credit-score-row"><b>信用分 ' + me.credit + '</b><span class="amz-credit-pill">信用极好</span></div>'
                  + '<div class="amz-credit-quick">'
                  + '<a href="#/me">在架管理</a><a href="#/offers">报价记录</a><a href="#/favorites">收藏足迹</a>'
                  + '</div></div></div>'
                  + '<a class="btn amz-btn-orange btn-block" href="#/publish">立即发布闲置</a><a class="amz-quad-more" href="#/me">进入个人中心</a>'
                  : '<h2>登录获得完整体验</h2>'
                  + '<div class="amz-acct-mini amz-credit-mascot-box">'
                  + '<div class="amz-credit-art"><img src="/assets/amz/mascot-credit-card.png" alt="小唤吉祥物"></div>'
                  + '<div class="amz-credit-info">'
                  + '<div class="amz-credit-score-row"><b>信用分 80</b><span class="amz-credit-pill">移通认证</span></div>'
                  + '<div class="amz-credit-quick">'
                  + '<a href="#/login">学号登录</a><a href="#/appraise">AI估价</a><a href="#/auctions">逛拍卖</a>'
                  + '</div></div></div>'
                  + '<a class="btn amz-btn-orange btn-block" href="#/login">安全登录</a><a class="amz-quad-more" href="#/login">立即注册</a>')
            + '</div></div>'
            + posterStrip
            + '</section>';

        var desktopSidebar='<aside class="category-panel desktop-market amz-rich-sidebar" aria-label="集市侧栏">'
            +'<div class="amz-side-hero"><img src="/assets/brand/mascot-wave-320.webp" width="52" height="52" alt="小唤"><div><b>移通校园严选</b></div></div>'
            +'<h2 class="category-panel-title">商品分类</h2>'+desktopCats
            + condSidebar
            + creditSidebar
            + spotSidebar
            +'<nav class="desktop-market-shortcuts" aria-label="快捷入口"><h2 class="category-panel-title">快捷入口</h2>'+shortcuts+'</nav>'
            +'<div class="amz-side-promo"><img src="/assets/brand/mascot-search.png" width="56" height="56" alt="小唤"><div><b>拿不准定什么价？</b><button type="button" class="btn btn-primary btn-sm btn-block" data-act="estimate">让小唤 AI 估价</button></div></div>'
            +'</aside>';

        var mobile='<section class="mobile-market"><nav class="home-channels" aria-label="首页频道"><a aria-current="page" href="#/home">首页</a><a href="#/market" data-act="home-feed">集市</a><a href="#/community">社区</a><a href="#/auctions">拍卖</a></nav>'+mobileSearch+campusServices()+'<section class="mobile-story mascot-mobile" aria-label="换一圈小唤"><div class="mascot-copy"><h1>好东西，<br>再转一圈。</h1><button data-act="go" data-to="#/publish">发布闲置 ↗</button></div><figure class="mascot-portrait">'+mascotImage+'</figure></section><div class="mobile-categories">'+mobileCats+'</div><div class="mobile-tools"><button data-act="go" data-to="#/auctions"><span>'+navIcon('auction')+'</span><b>校园拍卖</b></button><button data-act="go" data-to="#/wishes"><span>'+navIcon('wish')+'</span><b>求换专区</b></button><button data-act="go" data-to="#/community"><span>'+navIcon('community')+'</span><b>校园社区</b></button><button data-act="go" data-to="#/trade"><span>'+navIcon('trade')+'</span><b>我的交易</b></button></div></section>';
        var results='<section class="market-feed"><div class="feed-heading"><div><h2>'+(isSearch?'搜索结果':idle?'校园闲置':'为你推荐')+'</h2></div><div class="feed-actions"><span class="feed-count">'+(isSearch&&!minCredit?'共 '+h.total+' 件':'共 '+visibleItems.length+' 件')+'</span><button class="feed-filter" data-act="open-filter">'+navIcon('filter')+' 筛选</button><button class="feed-publish" data-act="go" data-to="#/publish">'+navIcon('add')+' 发布</button></div></div>'
            +((h.category||h.condition||minCredit)?'<div class="active-filter'+(h.condition||minCredit?'':' category-only')+'" aria-label="已选筛选">'
                +(h.category?'<button class="chip on desktop-filter-category" data-act="f-cat" data-v="" aria-label="清除类别筛选">类别：'+esc(h.category)+' ×</button>':'')
                +(h.condition?'<button class="chip on" data-act="f-cond" data-v="" aria-label="清除成色筛选">成色：'+esc(h.condition)+' ×</button>':'')
                +(minCredit?'<button class="chip on" data-act="f-credit" data-v="0" aria-label="清除信用筛选">信用：≥'+minCredit+'分 ×</button>':'')+'</div>':'')
            +(visibleItems.length?'<div class="pgrid">'+visibleItems.map(pCard).join('')+'</div>':emptyState(isSearch?'<img class="search-empty-mascot" src="/assets/brand/mascot-search.png" width="110" height="110" alt="">':navIcon('search'),'暂时没有找到好物',isSearch && h.searchConditions?.length ? '没有商品同时满足这些条件，可修改搜索词放宽条件。':'换个搜索词或筛选条件试试','<button class="btn btn-primary btn-sm" data-act="go" data-to="#/publish">发布闲置</button>'))
            +(h.hasMore?'<div class="feed-more"><button class="btn btn-ghost" data-act="load-more">加载更多</button></div>':'')+'</section>';
        if(isSearch){
            var conditions=(h.searchConditions||[]).map(function(label){return '<span class="chip on">'+esc(label)+'</span>';}).join('');
            renderSearchPage('<div class="market-home amz-browse-layout">'+desktopSidebar+'<div class="amz-browse-main">'+(conditions ? '<div class="active-filter" aria-label="已识别搜索条件">'+conditions+'</div>' : '')+results+'</div></div>');
            return;
        }
        if(idle || h.category || h.condition || minCredit){
            $('#app').innerHTML=shell(idle?'idle':'market','<div class="market-home amz-browse-layout">'+desktopSidebar+mobile+'<div class="amz-browse-main">'+results+'</div></div>');
            return;
        }
        $('#app').innerHTML=shell('market','<div class="market-home amz-home-layout">'+amzHomeTop+mobile+'<div class="amz-shelf-wrap">'+results+'</div></div>');
    }

    function openFilterSheet() {
        var h = state.home;
        var cats = '<button class="chip ' + (h.category === '' ? 'on' : '') + '" data-act="f-cat" data-v="">全部</button>'
            + CATS.map(function (c) {
                return '<button class="chip ' + (h.category === c ? 'on' : '') + '" data-act="f-cat" data-v="'
                    + esc(c) + '">' + c + '</button>';
            }).join('');
        var conds = '<button class="chip ' + (h.condition === '' ? 'on' : '') + '" data-act="f-cond" data-v="">不限</button>'
            + CONDS.map(function (c) {
                return '<button class="chip ' + (h.condition === c ? 'on' : '') + '" data-act="f-cond" data-v="'
                    + esc(c) + '">' + c + '</button>';
            }).join('');
        openSheet('<h3>筛选</h3><p class="sub">选完立刻生效，点空白处关闭。</p>'
            + '<div class="field"><label class="label">类别</label><div class="chips">' + cats + '</div></div>'
            + '<div class="field" style="margin-bottom:6px"><label class="label">成色</label>'
            + '<div class="chips">' + conds + '</div></div>');
    }

    var homeLoadToken = 0;
    var homeRequest;
    async function loadHome(reset) {
        var token=++homeLoadToken;
        if (homeRequest) homeRequest.abort();
        homeRequest = new AbortController();
        var options = {signal: homeRequest.signal};
        var h = state.home;
        if (reset) {
            h.page = 1;
            h.items = [];
        }
        var params = '?page=' + h.page + '&size=20';
        if (h.category) params += '&category=' + encodeURIComponent(h.category);
        if (h.condition) params += '&conditionLevel=' + encodeURIComponent(h.condition);
        var baseLoadHash = (location.hash || '#/home').split('?')[0];
        if (baseLoadHash !== '#/search') {
            try {
                var targetMode = baseLoadHash === '#/idle' ? 1 : 2;
                var batch = await window.campusExchange.browse(
                    function (page) { return api('/item/list' + params.replace(/page=\d+/, 'page=' + page), options); },
                    targetMode, h.page);
                if (token !== homeLoadToken || currentView.name !== 'home') return false;
                if (baseLoadHash === '#/idle' && h.page === 1 && (!batch.rows || !batch.rows.length)) {
                    var fallback = await api('/item/list' + params, options);
                    if (token !== homeLoadToken || currentView.name !== 'home') return false;
                    batch = { page: 1, rows: fallback.list || [], hasMore: !!fallback.hasMore };
                }
                h.page = batch.page;
                h.items = h.items.concat(batch.rows);
                h.total = h.items.length;
                h.hasMore = batch.hasMore;
                return true;
            } catch (error) {
                if (error.name === 'AbortError') return false;
                throw error;
            }
        }
        var keyword = encodeURIComponent(h.keyword);
        var useKeyword = !!h.keyword && !reset && h.keywordFallback;
        var listPath = '/item/list' + params + (keyword ? '&keyword=' + keyword : '');
        var data;
        try {
            data = await api(keyword && !useKeyword ? '/item/search' + params + '&q=' + keyword : listPath, options);
        } catch (error) {
            if (error.name === 'AbortError') return false;
            if (!keyword || useKeyword || error.code !== 503) throw error;
            if (token !== homeLoadToken || currentView.name !== 'home') return false;
            if (!reset && h.page > 1) {
                h.page = 1;
                h.items = [];
                listPath = listPath.replace(/\?page=\d+/, '?page=1');
            }
            try { data = await api(listPath, options); }
            catch (fallbackError) {
                if (fallbackError.name === 'AbortError') return false;
                throw fallbackError;
            }
            useKeyword = true;
        }
        if (token !== homeLoadToken || currentView.name !== 'home') return false;
        h.keywordFallback = useKeyword;
        h.items = h.items.concat(data.list || []);
        h.total = data.total || 0;
        h.hasMore = !!data.hasMore;
        h.searchConditions = data.conditions || [];
        return true;
    }

    // ------------------------------------------------------------------ 物品详情

    async function renderItem(id) {
        $('#app').innerHTML = shell('home', loading());
        var d = await api('/item/' + id);
        if (currentView.name!=='item' || currentView.arg!==id) return;
        var it = d.item;
        shelfRemember('history',it);
        var imgs = String(it.images || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
        var img = imgs[0] || '';
        var thumbRail = imgs.length ? '<div class="amz-thumbs-col">' + imgs.map(function (src, idx) {
            return '<button type="button" class="amz-thumb-btn' + (idx === 0 ? ' on' : '') + '" data-act="amz-thumb" data-src="' + esc(src) + '" aria-label="查看第 ' + (idx + 1) + ' 张图片"><img src="' + esc(src) + '" alt=""></button>';
        }).join('') + '</div>' : '';
        var hero = img ? '<div class="amz-gallery">' + thumbRail + '<div class="hero"><img id="amz-main-img" src="' + esc(img) + '" alt="' + esc(it.title) + '"></div></div>'
            : '<div class="hero hero-no-image" data-cat="' + esc(it.category) + '">' + (CAT_ICON[it.category] || navIcon('box')) + '<span>暂无物品照片</span></div>';

        var actions;
        var reportBtn = '';
        if (it.isDemo) {
            actions = '<div class="card card-pad">这是平台演示样品，仅供浏览。</div>';
        } else if (d.isMine) {
            if (it.status === 4) {
                actions = '<button class="btn btn-primary btn-block" data-act="toggle-item" data-id="'
                    + it.id + '" data-status="1">重新提交审核</button>';
            } else if (it.status === 1) {
                actions = (it.allowCycle ? '<button class="btn btn-accent btn-block" data-act="cycle" data-id="' + it.id + '">给我找换法</button>' : '')
                    + '<button class="btn btn-ghost btn-block" data-act="toggle-item" data-id="' + it.id + '" data-status="4">下架</button>';
            } else if (it.status===5||it.status===6) { actions = '<button class="btn btn-ghost btn-block" data-act="go" data-to="#/item/'+it.id+'/edit">编辑并重新提交</button>'; } else { actions='<div class="card card-pad">'+esc(it.statusText||'当前不可操作')+'</div>'; }
        } else if (it.status === 1) {
            actions = '<button class="btn btn-primary btn-block" data-act="open-offer" data-id="' + it.id + '">用我的物品换</button>'
                + '<button class="btn btn-ghost btn-block" data-act="chat-start" data-id="'+it.id+'">私聊发布者</button>';
            reportBtn = '<button class="amz-report-link" data-act="open-report" data-type="1" data-id="' + it.id + '">' + navIcon('flag') + ' 举报该商品信息</button>';
        } else {
            actions = '<button class="btn btn-ghost btn-block" disabled>这件物品' + esc(it.statusText || '已下架') + '</button>';
        }

        var want = d.want || {};
        var saved = shelfRead('favorites').some(function(x){return x.id===id;});
        var mode = window.campusExchange.mode(it);
        var priceText = (demoReferencePrice(it) && window.campusExchange.supports(it,1))
            ? demoReferencePrice(it)
            : (mode === 1 && Number(it.price) > 0 ? '¥' + (Number(it.price) / 100).toFixed(2) : (mode === 3 ? '拍卖竞价' : '以物换物'));
        var credit = it.ownerCredit === undefined || it.ownerCredit === null ? 80 : Number(it.ownerCredit);
        var stars = credit >= 90 ? 5 : credit >= 75 ? 4 : 3;

        var breadcrumb = '<nav class="amz-breadcrumb" aria-label="面包屑"><a href="#/home">首页</a><span>›</span><a href="#/idle">' + esc(it.category || '校园好物') + '</a><span>›</span><b>' + esc(it.title) + '</b></nav>';

        var centerCol = '<div class="item-detail-info">'
            + '<h1 class="detail-title">' + esc(it.title) + '</h1>'
            + '<div class="amz-detail-seller"><button class="link-btn" data-act="go" data-to="#/user/' + it.ownerId + '">访问 ' + esc(it.ownerNickname || '校园同学') + ' 的主页</button>'
            + '<span class="amz-stars">' + '★'.repeat(stars) + '☆'.repeat(5 - stars) + '</span>'
            + '<span class="amz-rating-num">信用分 ' + credit + '</span>'
            + '<span class="amz-view-num">' + (it.viewCount || 0) + ' 次浏览</span></div>'
            + '<hr class="amz-hr">'
            + '<div class="amz-detail-price-block"><div class="amz-price-row"><span class="amz-price-k">交易方式：</span><span class="amz-detail-price">' + esc(priceText) + '</span></div>'
            + '<p class="amz-free-ship">校内公共点位当面交接</p>'
            + '<div class="detail-meta">'
            + (it.isDemo ? '<span class="tag brand">' + window.campusExchange.demoLabel(it) + '</span>' : '')
            + '<span class="tag brand">' + esc(it.category) + '</span>'
            + '<span class="tag">' + esc(it.conditionLevel) + '</span>'
            + '<span class="tag ghost">' + esc(it.statusText || '') + '</span>'
            + '</div></div>'
            + '<hr class="amz-hr">'
            + '<div class="amz-specs">'
            + '<div class="kv"><span class="k">新旧成色</span><span class="v">' + esc(it.conditionLevel || '-') + '</span></div>'
            + '<div class="kv"><span class="k">所在校区</span><span class="v">' + esc(it.ownerBuilding || '重庆移通学院') + '</span></div>'
            + '<div class="kv"><span class="k">发布时间</span><span class="v">' + fmtRel(it.createTime) + '</span></div>'
            + (!it.isDemo || window.campusExchange.supports(it,2) ? '<div class="kv"><span class="k">期望交换</span><span class="v">'
            + esc(it.isDemo ? (it.wantText || '同类校园好物') : ((want.wantCategories || []).join('、') || want.wantCategory || '不限类别') + (want.expectDesc ? '，' + want.expectDesc : '')) + '</span></div>' : '')
            + '</div>'
            + '<hr class="amz-hr">'
            + '<div class="amz-bullets"><h3>关于此好物</h3><ul>'
            + (it.description ? '<li>' + esc(it.description) + '</li>' : '')
            + '<li>支持校内公共区域当面验货交接，信用保障交易更放心。</li>'
            + (d.tip ? '<li>' + esc(d.tip) + '</li>' : '')
            + '</ul></div>'
            + '<hr class="amz-hr">'
            + '<div class="amz-trust-strip">'
            + '<div><span>' + navIcon('shield') + '</span><b>校内实名认证</b></div>'
            + '<div><span>' + navIcon('truck') + '</span><b>当面验货交接</b></div>'
            + '<div><span>' + navIcon('star') + '</span><b>信用分体系担保</b></div>'
            + '</div>'
            + '</div>';

        var buyBox = '<aside class="amz-buybox">'
            + '<div class="amz-buybox-price">' + esc(priceText) + '</div>'
            + '<p class="amz-buybox-ship">校内免配送费 <strong>' + esc(it.ownerBuilding || '校园公共区域面交') + '</strong></p>'
            + '<p class="amz-buybox-stock">' + (it.status === 1 ? '在架中' : esc(it.statusText || '当前不可交易')) + '</p>'
            + '<div class="action-bar amz-buybox-actions">' + actions + '</div>'
            + '<div class="amz-buybox-meta">'
            + '<div><span>交接方式</span><b>校内公共点位面交</b></div>'
            + '<div><span>物主</span><button class="link-btn" data-act="go" data-to="#/user/' + it.ownerId + '">' + esc(it.ownerNickname || '同学') + '</button></div>'
            + '<div><span>交易保障</span><b>' + navIcon('shield') + ' 校园信用担保</b></div>'
            + '</div>'
            + '<hr class="amz-hr">'
            + '<button class="amz-list-btn" data-act="shelf-toggle" data-id="' + id + '" aria-pressed="' + saved + '">' + (saved ? '✓ 已加入收藏夹' : '加入收藏夹') + '</button>'
            + reportBtn
            + '</aside>';

        var relatedWrap = '<section class="amz-pdp-related" id="amz-pdp-related"></section>';
        $('#app').innerHTML = shell('home', breadcrumb + '<section class="item-detail amz-detail-3col"><div class="item-detail-media">' + hero + '</div>' + centerCol + buyBox + '</section>' + relatedWrap);

        try {
            var rel = await api('/item/list?page=1&size=5&category=' + encodeURIComponent(it.category || ''));
            if (currentView.name !== 'item' || currentView.arg !== id) return;
            var relItems = ((rel && rel.list) || []).filter(function (x) { return Number(x.id) !== Number(id); }).slice(0, 4);
            var box = $('#amz-pdp-related');
            if (box && relItems.length) {
                box.innerHTML = '<div class="amz-related-card"><div class="amz-related-head"><h2>同分类校园好物推荐</h2><a href="#/idle">查看更多 ›</a></div><div class="pgrid">' + relItems.map(pCard).join('') + '</div></div>';
            }
        } catch (ignore) {}
    }

    // ------------------------------------------------------------------ 发布

    function renderPublishEntry() {
        $('#app').innerHTML=shell('publish','<nav class="amz-breadcrumb" aria-label="面包屑"><a href="#/home">首页</a><span>›</span><b>发布中心</b></nav>'
            +'<section class="redesign-page publish-entry amz-seller-hub"><header class="amz-hub-head"><div><h1>换一圈卖家与发布中心</h1><p>选择要发布的校园流转方式，支持闲置交换、限时拍卖、心愿求换与 AI 估价。</p></div><img src="/assets/brand/mascot-box.png" width="88" height="88" alt=""></header>'
            +'<div class="amz-hub-grid">'
            +'<a class="amz-hub-card amz-hub-main" href="#/publish/edit"><span class="amz-hub-ico">'+navIcon('box')+'</span><div><strong>发布闲置物品</strong><small>支持以物换物、标价流转与三方换物接力</small></div><span class="btn btn-primary btn-sm">立即发布</span></a>'
            +'<a class="amz-hub-card" href="#/auction/new"><span class="amz-hub-ico">'+navIcon('auction')+'</span><div><strong>发起校园拍卖</strong><small>设置起拍价与竞拍时长，价高者得</small></div><span class="btn btn-ghost btn-sm">去发起</span></a>'
            +'<a class="amz-hub-card" href="#/wishes"><span class="amz-hub-ico">'+navIcon('wish')+'</span><div><strong>发布求换心愿</strong><small>写下想换的物品，匹配自动提醒</small></div><span class="btn btn-ghost btn-sm">去发布</span></a>'
            +'<button type="button" class="amz-hub-card" data-act="estimate"><span class="amz-hub-ico">'+navIcon('appraise')+'</span><div><strong>AI 好物估价</strong><small>拍照或填参数，智能评估参考价格</small></div><span class="btn btn-ghost btn-sm">去估价</span></button>'
            +'</div></section>');
    }

    function renderPublish() {
        var catChips = CATS.map(function (c) {
            return '<button type="button" class="chip" data-act="p-cat" data-v="' + esc(c) + '">'
                + (CAT_ICON[c] || '') + ' ' + c + '</button>';
        }).join('');
        var condChips = CONDS.map(function (c) {
            return '<button type="button" class="chip" data-act="p-cond" data-v="' + esc(c) + '">' + c + '</button>';
        }).join('');
        var wantChips = CATS.map(function (c) {
            return '<button type="button" class="chip" data-act="p-want" data-v="' + esc(c) + '">' + c + '</button>';
        }).join('');

        var content = '<nav class="amz-breadcrumb" aria-label="面包屑"><a href="#/home">首页</a><span>›</span><a href="#/publish">发布中心</a><span>›</span><b>发布闲置物品</b></nav>'
            + '<section class="redesign-page publish-editor amz-form-layout"><div class="page-head"><div class="redesign-heading"><a class="icon-action" href="#/publish" aria-label="关闭编辑">'+navIcon('close')+'</a><h1>发布闲置物品</h1><button class="btn btn-primary btn-sm" form="publish-form" type="submit">提交审核</button></div>'
            + '<p>上传图片并提交审核，5 分钟未处理将自动通过。</p></div>'
            + '<div class="amz-form-grid"><form id="publish-form" data-form="publish" class="card card-pad"><p class="publish-error" role="alert" tabindex="-1" hidden></p>'
            + '<div class="field"><label class="label">图片 <span class="opt">最多 3 张，每张 ≤2MB</span></label>'
            + '<div class="chips" id="img-preview" style="margin-top:8px"></div><p class="hint">第一张会用作商品封面。</p></div>'
            + '<div class="field"><label class="label">名称 <span class="opt">≤30 字</span></label>'
            + '<input class="input" name="title" aria-label="物品名称" maxlength="30" placeholder="例如 机械键盘 87 键红轴" required></div>'
            + '<div class="field"><label class="label">类别</label><div class="chips" id="cat-chips">' + catChips + '</div>'
            + '<input type="hidden" name="category"></div>'
            + '<div class="field"><label class="label">成色</label><div class="chips" id="cond-chips">' + condChips + '</div>'
            + '<input type="hidden" name="conditionLevel"></div>'
            + '<div class="field"><label class="label">描述 <span class="opt">≤300 字</span></label>'
            + '<textarea class="textarea" name="description" aria-label="物品描述" maxlength="300" data-counter="desc" '
            + 'placeholder="哪里旧了、配件齐不齐、能不能自提"></textarea>'
            + '<div class="hint" style="display:flex;justify-content:space-between">'
            + '<span>说清楚瑕疵，换得更快</span><span class="counter" id="desc-counter">0 / 300</span></div><div class="chips publish-templates"><button type="button" class="chip" data-act="publish-template" data-v="成色与瑕疵：">成色说明</button><button type="button" class="chip" data-act="publish-template" data-v="入手来源：">入手来源</button><button type="button" class="chip" data-act="publish-template" data-v="转出原因：">转出原因</button></div></div>'
            + '<div class="field"><label class="label">想换什么</label><div class="chips" id="want-chips">' + wantChips + '</div>'
            + '<input type="hidden" name="wantCategory">'
            + '<div class="hint">可多选。</div>'
            + '<div class="hint">必选。这是环匹配的原料：写清楚类别，系统才能把三个人的意向接起来。</div></div>'
            + '<div class="field"><label class="label">交换模式</label><select class="select" name="matchMode" aria-label="交换模式"><option value="passive">参与闭环 | 等待自动匹配提醒</option><option value="active">参与闭环 | 仅主动找环</option><option value="one">仅一对一交换</option></select></div>'
            + '<div class="field"><label class="label">期望说明 <span class="opt">选填，≤100 字</span></label>'
            + '<input class="input" name="expectDesc" aria-label="期望说明" maxlength="100" placeholder="例如 想换一副羽毛球拍，成色差不多就行"></div>'
            + '<button class="btn btn-primary btn-block" type="submit">提交审核</button>'
            + '</form><aside class="card card-pad amz-form-aside"><img src="/assets/brand/mascot-box.png" width="76" height="76" alt=""><h3>发布与匹配指南</h3><ul><li>最多上传 3 张实拍图，第一张将作为商品主图。</li><li>勾选「想换什么」类别后，系统可自动为你匹配三方换物闭环。</li><li>提交后 5 分钟内自动审核上架，支持随时编辑或下架。</li></ul><button class="btn btn-ghost btn-block" type="button" data-act="estimate">使用 AI 好物估价</button></aside></div></section>';

        state.publishImages = [];
        state.publish = {category: '', conditionLevel: '', wantCategory: ''};
        $('#app').innerHTML = shell('publish', content);
        renderImagePreview();
        restorePublishDraft();
    }

    async function renderItemEdit(id) {
        var d=await api('/item/'+id); if(!d.isMine) throw new ApiError('只能编辑自己的物品');
        var it=d.item, want=d.want || {}; renderPublish();
        var form=document.querySelector('[data-form="publish"]'); form.dataset.editId=id;
        form.querySelector('[name="title"]').value=it.title || '';
        form.querySelector('[name="description"]').value=it.description || '';
        form.querySelector('[name="expectDesc"]').value=it.expectDesc || '';
        state.publish={category:it.category, conditionLevel:it.conditionLevel, wantCategory:(want.wantCategories || [want.wantCategory]).filter(Boolean).join(',')};
        form.querySelector('[name=matchMode]').value=it.allowCycle ? (it.autoMatch?'passive':'active') : 'one';
        state.publishImages=it.images?it.images.split(',').filter(Boolean):[];
        markChip('#cat-chips',state.publish.category); markChip('#cond-chips',state.publish.conditionLevel); markMultiWant(state.publish.wantCategory); renderImagePreview();
        document.querySelector('.page-head h1').textContent='编辑物品';
    }

    function markMultiWant(value) { var chosen=(value||'').split(','); document.querySelectorAll('#want-chips [data-v]').forEach(function(el){el.classList.toggle('on',chosen.indexOf(el.dataset.v)>=0);}); }
    function markChip(sel, val) {
        if (!val) return;
        var wrap = document.querySelector(sel);
        if (!wrap) return;
        Array.prototype.forEach.call(wrap.children, function (c) {
            c.classList.toggle('on', c.dataset.v === val);
        });
        var hidden = wrap.parentNode.querySelector('input[type=hidden]');
        if (hidden) hidden.value = val;
    }

    /** 上次没发完的内容还留着，别让用户白填一遍 */
    function savePublishDraft(form) {
        if(!form||form.dataset.editId||currentView.name!=='publish')return;
        var fields=new FormData(form);
        var draft={
            title:fields.get('title'),description:fields.get('description'),expectDesc:fields.get('expectDesc'),
            matchMode:fields.get('matchMode'),category:state.publish.category,
            conditionLevel:state.publish.conditionLevel,wantCategory:state.publish.wantCategory,
            images:state.publishImages.slice()
        };
        try{sessionStorage.setItem('hq.draft',JSON.stringify(draft));}catch(e){}
    }

    function restorePublishDraft() {
        var raw = sessionStorage.getItem('hq.draft');
        if (!raw) return;
        var d;
        try {
            d = JSON.parse(raw);
        } catch (e) {
            sessionStorage.removeItem('hq.draft');
            return;
        }
        var form = document.querySelector('form[data-form=publish]');
        if (!form) return;
        if (d.title) form.querySelector('input[name=title]').value = d.title;
        if (d.expectDesc) form.querySelector('input[name=expectDesc]').value = d.expectDesc;
        if (d.description) {
            var ta = form.querySelector('textarea[name=description]');
            ta.value = d.description;
            var c = document.querySelector('#desc-counter');
            if (c) c.textContent = d.description.length + ' / 300';
        }
        state.publish.category = d.category || '';
        state.publish.conditionLevel = d.conditionLevel || '';
        state.publish.wantCategory = d.wantCategory || '';
        markChip('#cat-chips', d.category);
        markChip('#cond-chips', d.conditionLevel);
        markMultiWant(d.wantCategory);
        if(d.matchMode)form.elements.matchMode.value=d.matchMode;
        if(Array.isArray(d.images)){state.publishImages=d.images.slice(0,3);renderImagePreview();}
        toast('已恢复上次没发完的内容');
    }

    // ------------------------------------------------------------------ 报价

    function jdSideNav(activeKey) {
        return '<aside class="jd-side-nav" aria-label="个人与订单导航">'
            + '<div class="jd-nav-group"><h4>' + clayIcon('user', '我的', 'is-sm') + ' 我的换一圈</h4>'
            + '<a href="#/me" class="' + (activeKey === 'me' ? 'on' : '') + '">个人中心主页</a>'
            + '</div>'
            + '<div class="jd-nav-group"><h4>' + clayIcon('order', '订单', 'is-sm') + ' 订单中心</h4>'
            + '<a href="#/offers" class="' + (activeKey === 'offers' ? 'on' : '') + '">我的订单</a>'
            + '<a href="#/exchange" class="' + (activeKey === 'exchange' ? 'on' : '') + '">我的交换单</a>'
            + '<a href="#/me/auctions" class="' + (activeKey === 'auctions' ? 'on' : '') + '">我的竞拍活动</a>'
            + '<a href="#/me/reviews" class="' + (activeKey === 'reviews' ? 'on' : '') + '">评价晒单</a>'
            + '</div>'
            + '<div class="jd-nav-group"><h4>' + clayIcon('star', '收藏', 'is-sm') + ' 足迹收藏</h4>'
            + '<a href="#/history" class="' + (activeKey === 'history' ? 'on' : '') + '">我的足迹</a>'
            + '<a href="#/favorites" class="' + (activeKey === 'favorites' ? 'on' : '') + '">商品收藏 <em class="jd-nav-badge">有降价</em></a>'
            + '<a href="#/me/wishes" class="' + (activeKey === 'wishes' ? 'on' : '') + '">求换心愿单</a>'
            + '<a href="#/me/channels" class="' + (activeKey === 'channels' ? 'on' : '') + '">关注的频道</a>'
            + '</div>'
            + '<div class="jd-nav-group"><h4>' + clayIcon('wallet', '资产', 'is-sm') + ' 资产中心</h4>'
            + '<a href="#/me/appraise" class="' + (activeKey === 'appraise' ? 'on' : '') + '">AI 好物估价</a>'
            + '<a href="#/me/vouchers" class="' + (activeKey === 'vouchers' ? 'on' : '') + '">三方换物凭证</a>'
            + '<a href="#/me/quota" class="' + (activeKey === 'quota' ? 'on' : '') + '">闲置上架额度</a>'
            + '<a href="#/me/credit" class="' + (activeKey === 'credit' ? 'on' : '') + '">校园信用分</a>'
            + '</div>'
            + '<div class="jd-nav-group"><h4>' + clayIcon('fire', '业务', 'is-sm') + ' 特色业务</h4>'
            + '<a href="#/me/campus-auctions" class="' + (activeKey === 'campus-auctions' ? 'on' : '') + '">校园拍卖</a>'
            + '<a href="#/me/relay" class="' + (activeKey === 'relay' ? 'on' : '') + '">换物接力大厅</a>'
            + '<a href="#/me/arcade" class="' + (activeKey === 'arcade' ? 'on' : '') + '">Scrap Arena 街机</a>'
            + '</div>'
            + '<div class="jd-nav-group"><h4>' + clayIcon('settings', '设置', 'is-sm') + ' 账户设置</h4>'
            + '<a href="#/me/security" class="' + (activeKey === 'security' ? 'on' : '') + '">个人信息与安全</a>'
            + '<a href="#/me/notices" class="' + (activeKey === 'notices' ? 'on' : '') + '">消息通知中心</a>'
            + '</div>'
            + '</aside>';
    }

    function jdShowcaseOrderRows() {
        var demoOrders = [
            {
                time: '2026-11-14 18:22:10',
                no: '339977041664',
                shop: '北山书院自营闲置站',
                img: '/assets/amz/quad-digital.jpg',
                title: '罗技 GPW 二代无线游戏鼠标 + 68键热插拔机械键盘套装（九成新 盒说全）',
                qty: 1,
                user: (state.me && state.me.nickname) || '肚皮一天都在饿',
                price: '¥269.00',
                payType: '以物换物 / 在线担保',
                status: '已完成',
                to: '#/idle?cat=数码'
            },
            {
                time: '2026-11-11 14:08:45',
                no: '339941829015',
                shop: '南山书院考研教材角',
                img: '/assets/amz/quad-books.jpg',
                title: '高等数学同济第七版上下册 + 英语六级真题词汇全套笔记（无缺页）',
                qty: 2,
                user: (state.me && state.me.nickname) || '肚皮一天都在饿',
                price: '¥45.00',
                payType: '等价互换',
                status: '待面交验货',
                to: '#/idle?cat=教材'
            },
            {
                time: '2026-11-06 20:15:03',
                no: '339810294811',
                shop: '松格书院生活好物馆',
                img: '/assets/amz/quad-dorm.jpg',
                title: '米家宿舍充电长臂护眼台灯 + 桌面绿植陶瓷杯收纳三件套',
                qty: 1,
                user: (state.me && state.me.nickname) || '肚皮一天都在饿',
                price: '¥68.00',
                payType: '校内直送',
                status: '已完成',
                to: '#/idle?cat=生活'
            }
        ];
        var q = String(state.offersQuery || '').trim().toLowerCase();
        var filtered = demoOrders.filter(function (d) {
            if (state.hiddenDemoOrders.indexOf(d.no) >= 0) return false;
            if (!q) return true;
            return (d.title + ' ' + d.no + ' ' + d.shop + ' ' + d.status).toLowerCase().indexOf(q) >= 0;
        });
        return filtered.map(function (d) {
            return '<article class="jd-order-item">'
                + '<header class="jd-item-head">'
                + '<span class="jd-item-time">' + d.time + '</span>'
                + '<span class="jd-item-no">订单号：<b>' + d.no + '</b></span>'
                + '<a href="#/notifications" class="jd-item-shop">' + d.shop + ' <i class="jd-chat-dot" title="联系同学">' + clayIcon('chat', '联系同学', 'is-sm') + '</i></a>'
                + '<button type="button" class="jd-item-trash" data-act="demo-order-hide" data-no="' + d.no + '" title="移出此示例订单">' + clayIcon('order', '移出', 'is-sm') + '</button>'
                + '</header>'
                + '<div class="jd-item-row">'
                + '<div class="jd-col-goods">'
                + '<a class="jd-goods-thumb" href="' + d.to + '"><img src="' + d.img + '" alt=""></a>'
                + '<div class="jd-goods-info">'
                + '<a class="jd-goods-title" href="' + d.to + '">' + esc(d.title) + '</a>'
                + '<div class="jd-goods-tags"><span>校内当面验货</span><span>信用担保</span></div>'
                + '</div>'
                + '<span class="jd-goods-qty">x' + d.qty + '</span>'
                + '<div class="jd-goods-repair"><a href="#/appraise">AI复估</a><a href="#/community">晒单圈子</a></div>'
                + '</div>'
                + '<div class="jd-col-buyer"><span class="jd-buyer-name">' + esc(d.user) + ' <i>' + clayIcon('user', '同学', 'is-sm') + '</i></span></div>'
                + '<div class="jd-col-amount"><b>' + d.price + '</b><small>' + d.payType + '</small></div>'
                + '<div class="jd-col-status"><span class="jd-st-done">' + d.status + '</span><a href="' + d.to + '">订单详情</a></div>'
                + '<div class="jd-col-ops">'
                + '<a class="jd-op-link" href="#/me/reviews">评价 | 晒单</a>'
                + '<button type="button" class="jd-btn-rebuy" data-act="go" data-to="' + d.to + '">再次换购</button>'
                + '</div>'
                + '</div></article>';
        }).join('');
    }

    async function renderOffers() {
        $('#app').innerHTML = shell('offers', loading());
        var tab = state.offersTab;
        var list = await api(tab === 'received' ? '/offer/received' : '/offer/sent');
        var q = String(state.offersQuery || '').trim().toLowerCase();
        var stFilter = state.offersStatusFilter || 'all';
        var filtered = (list || []).filter(function (o) {
            if (stFilter !== 'all' && String(o.status) !== String(stFilter)) return false;
            if (!q) return true;
            var txt = [o.id, o.myTitle, o.targetTitle, o.fromNickname, o.toNickname, o.message].join(' ').toLowerCase();
            return txt.indexOf(q) >= 0;
        });
        var rows = filtered.map(function (o) {
            var st = OFFER_STATUS[o.status] || ['未知', ''];
            var isReceived = tab === 'received';
            var other = isReceived ? (o.fromNickname || '校内同学') : (o.toNickname || '校内同学');
            var actions = '';
            if (o.status === 0) {
                if (isReceived) {
                    actions = '<button class="btn btn-sm btn-primary" data-act="offer-act" data-id="' + o.id + '" data-do="accept">接受报价</button>'
                        + '<button class="btn btn-sm btn-ghost" data-act="offer-act" data-id="' + o.id + '" data-do="counter">还价</button>'
                        + '<button class="btn btn-sm btn-ghost" data-act="offer-act" data-id="' + o.id + '" data-do="reject">拒绝</button>';
                } else {
                    actions = '<button class="btn btn-sm btn-ghost" data-act="offer-act" data-id="' + o.id + '" data-do="cancel">撤回报价</button>';
                }
            } else {
                actions = '<button type="button" class="jd-btn-rebuy" data-act="go" data-to="#/idle">再次逛集市</button>';
            }
            return '<article class="jd-order-item">'
                + '<header class="jd-item-head">'
                + '<span class="jd-item-time">' + fmtRel(o.createTime) + '</span>'
                + '<span class="jd-item-no">报价单号：<b>#OF' + (100000 + Number(o.id || 0)) + '</b></span>'
                + '<a href="#/notifications" class="jd-item-shop">校内当面换物 <i class="jd-chat-dot">' + clayIcon('chat', '联系同学', 'is-sm') + '</i></a>'
                + '<span class="jd-item-credit">对方信用：' + (o.fromCredit === undefined ? '80' : o.fromCredit) + ' 分</span>'
                + '</header>'
                + '<div class="jd-item-row">'
                + '<div class="jd-col-goods">'
                + '<div class="jd-goods-thumb"><img src="/assets/amz/quad-swap.jpg" alt=""></div>'
                + '<div class="jd-goods-info">'
                + '<p class="jd-goods-title"><b>' + esc(isReceived ? other : '我') + '</b> 提议用 <span class="tag brand">' + esc(o.myTitle || '闲置好物') + '</span> 交换 <span class="tag accent">' + esc(o.targetTitle || '目标好物') + '</span></p>'
                + (o.message ? '<p class="jd-goods-note">留言：「' + esc(o.message) + '」</p>' : '<p class="jd-goods-note">支持北山斋 / 南山书院线下验货交接</p>')
                + '</div>'
                + '<span class="jd-goods-qty">x1</span>'
                + '<div class="jd-goods-repair"><a href="#/appraise">AI估价</a></div>'
                + '</div>'
                + '<div class="jd-col-buyer"><span class="jd-buyer-name">' + esc(other) + ' <i>' + clayIcon('user', '同学', 'is-sm') + '</i></span></div>'
                + '<div class="jd-col-amount"><b>等价互换</b><small>免服务费</small></div>'
                + '<div class="jd-col-status"><span class="tag ' + st[1] + '">' + st[0] + '</span><small style="display:block;margin-top:4px;color:#888">' + (o.status === 0 ? '24h内有效' : fmtRel(o.handleTime)) + '</small></div>'
                + '<div class="jd-col-ops">' + actions + '</div>'
                + '</div></article>';
        }).join('');

        var advBar = state.offersAdvOpen
            ? '<div class="jd-adv-filter-bar"><span>状态筛选：</span>'
              + [['all', '全部'], ['0', '待响应'], ['1', '已接受'], ['5', '已还价'], ['2', '已拒绝']].map(function (st) {
                  return '<button type="button" class="chip ' + (String(stFilter) === st[0] ? 'on' : '') + '" data-act="offers-status" data-v="' + st[0] + '">' + st[1] + '</button>';
              }).join('')
              + (q || state.hiddenDemoOrders.length ? '<button type="button" class="chip" data-act="orders-reset">重置筛选与示例</button>' : '')
              + '</div>'
            : '';

        var content = '<div class="jd-center-wrap">'
            + jdSideNav('offers')
            + '<div class="jd-order-main">'
            + '<div class="jd-order-title-bar"><h2>我的订单</h2>' + (q ? '<span>筛选：“' + esc(q) + '”</span>' : '') + '</div>'
            + '<div class="jd-order-panel">'
            + '<div class="jd-order-tabs-row">'
            + '<div class="jd-order-tabs">'
            + '<button type="button" class="' + (tab === 'received' ? 'on' : '') + '" data-act="offers-tab" data-v="received">全部订单 / 收到的报价</button>'
            + '<button type="button" class="' + (tab === 'sent' ? 'on' : '') + '" data-act="offers-tab" data-v="sent">我发出的报价</button>'
            + '<a href="#/exchange">待面交交换单</a>'
            + '<a href="#/me/reviews">待评价</a>'
            + '<a href="#/favorites" class="jd-tab-emph">我的常换商品</a>'
            + '<a href="#/me/auctions" class="jd-tab-emph">我的竞拍单</a>'
            + '</div>'
            + '<form class="jd-order-search" data-form="orders-search">'
            + '<input name="q" type="search" value="' + esc(state.offersQuery || '') + '" placeholder="商品名称/商品编号/订单号" aria-label="订单搜索">'
            + '<button type="submit">搜索</button>'
            + '<button type="button" class="jd-btn-adv" data-act="orders-adv">高级 ▾</button>'
            + '</form>'
            + '</div>'
            + advBar
            + (rows ? '<div class="jd-order-list">' + rows + '</div>'
                : '<div class="jd-empty-order-box">'
                    + '<img src="/assets/brand/mascot-box.png" alt="小唤">'
                    + '<div class="jd-empty-order-copy">'
                    + '<p>' + (q ? '没有匹配“' + esc(q) + '”的报价单' : (tab === 'received' ? '暂无收到的换物报价' : '暂无发出的换物报价')) + '</p>'
                    + '<div class="jd-empty-btns">'
                    + '<button type="button" class="jd-btn-red" data-act="go" data-to="#/exchange">查看交换单</button>'
                    + '<button type="button" class="jd-btn-outline" data-act="go" data-to="#/home">去首页</button>'
                    + '</div></div></div>')
            + '<div class="jd-demo-divider"><span>近期订单示例</span><a href="#/idle">去集市 ›</a></div>'
            + '<div class="jd-order-list">' + (jdShowcaseOrderRows() || '<p class="hint" style="padding:12px">暂无匹配订单示例 <button type="button" class="link-btn" data-act="orders-reset">恢复全部</button></p>') + '</div>'
            + '</div></div></div>';

        $('#app').innerHTML = shell('trade', content);
    }

    // ------------------------------------------------------------------ 三方环

    var DEMO_RELAYS = [
        {id: 801, cat: '数码', isDemo: true, state: 'active', title: '【三方闭环】出罗技 GPW 二代无线鼠标 → 求换 iPad 二代电容笔 → 闭环贴补 ¥0', campus: '北山→南山→松格', stage: 'A→B→C 接力', value: 260, want: '数码外设', seller: '北山电竞阿泽', ringCount: 4, views: 1620, image: '/assets/amz/quad-relay.jpg'},
        {id: 802, cat: '教材', isDemo: true, state: 'active', title: '【跨书院成环】出2026张宇考研数学全套 → 求换漫步者头戴耳机 → 图书馆同场交接', campus: '南山→竹逸→图书馆', stage: '差1人闭环', value: 110, want: '耳机/数码', seller: '南山学姐小林', ringCount: 3, views: 1280, image: '/assets/amz/quad-books.jpg'},
        {id: 803, cat: '数码', isDemo: true, state: 'active', title: '【摄影接力环】出富士 mini11 拍立得相机 → 求换 Switch 卡带2张 → 已匹配2组环', campus: '菊轩→北山→梅若', stage: '高匹配度', value: 310, want: '游戏/潮玩', seller: '菊轩摄影糖糖', ringCount: 5, views: 2190, image: '/assets/amz/quad-auction.jpg'},
        {id: 804, cat: '生活', isDemo: true, state: 'active', title: '【宿舍神器环】出米家长臂护眼台灯 1S → 求换尤尼克斯羽毛球拍 → 顺路寝室互送', campus: '松格→爱莲→北山', stage: 'A→B→C 接力', value: 85, want: '球拍/运动', seller: '松格机电老王', ringCount: 2, views: 940, image: '/assets/amz/quad-dorm.jpg'},
        {id: 805, cat: '运动', isDemo: true, state: 'active', title: '【运动外设环】出斯伯丁7号吸湿篮球+球包 → 求换68键机械键盘 → 风雨球场验货', campus: '北山→南山→竹逸', stage: '随时成环', value: 135, want: '键盘/数码', seller: '球场科比阿杰', ringCount: 4, views: 1430, image: '/assets/amz/quad-sports.jpg'},
        {id: 806, cat: '教材', isDemo: true, state: 'active', title: '【工科教材环】出卡西欧 fx-991CN X 计算器 → 求换大物实验报告指导书+尺规', campus: '南山→松格→北山', stage: '同院系接力', value: 65, want: '教材/工具', seller: '智能工程学长', ringCount: 6, views: 1750, image: '/assets/amz/quad-grad.jpg'},
        {id: 807, cat: '数码', isDemo: true, state: 'active', title: '【音频数码环】出漫步者 W820NB 降噪耳机 → 求换小米手环8 Pro → 等价零差价', campus: '图书馆→菊轩→南山', stage: 'A→B→C 接力', value: 150, want: '智能穿戴', seller: '图书馆常驻生', ringCount: 3, views: 1560, image: '/assets/amz/quad-appraise.jpg'},
        {id: 808, cat: '生活', isDemo: true, state: 'active', title: '【手作周边环】出复古火漆印章礼盒全套 → 求换泡泡玛特盲盒或桌面绿植盆栽', campus: '爱莲→梅若→菊轩', stage: '女生书院环', value: 55, want: '绿植/潮玩', seller: '爱莲手作小鹿', ringCount: 2, views: 890, image: '/assets/amz/quad-wishes.jpg'},
        {id: 809, cat: '数码', isDemo: true, state: 'settled', title: '【已成环示范】Keychron K2 机械键盘 → 富士相纸礼盒 → 考研英语黄皮书三方交接', campus: '图书馆一楼大厅', stage: '已闭环交接', value: 180, want: '三方各得所需', seller: '大数据极客阿伟', ringCount: 1, views: 2310, image: '/assets/amz/quad-swap.jpg'},
        {id: 810, cat: '生活', isDemo: true, state: 'active', title: '【毕业收纳环】出宜家感牛津布收纳箱×2+书立 → 求换滑板或哑铃一对', campus: '北山→松格→南山', stage: 'A→B→C 接力', value: 49, want: '运动器材', seller: '北山收纳达人', ringCount: 3, views: 1020, image: '/assets/amz/quad-delivery.jpg'}
    ];

    function relayCard(r) {
        var isSettled = r.state === 'settled';
        var href = r.isDemo ? '#/publish' : '#/cycle/' + Number(r.id);
        return '<article class="relay-card-clean">'
            + '<a href="' + href + '" class="clean-card-media">'
            + '<img src="' + esc(r.image || '/assets/amz/quad-relay.jpg') + '" onerror="this.onerror=null;this.src=\'/assets/amz/quad-relay.jpg\'" alt="' + esc(r.title) + '" loading="lazy">'
            + (isSettled ? '<span class="clean-state-tag is-done">已闭环</span>' : '')
            + '</a>'
            + '<div class="clean-card-body">'
            + '<h2 class="clean-card-title" title="' + esc(r.title) + '">' + esc(r.title) + '</h2>'
            + '<div class="clean-card-meta-row">'
            + '<span class="relay-want-line" title="想换 ' + esc(r.want || '校园好物') + '">想换 ' + esc(r.want || '任意好物') + '</span>'
            + '<button type="button" class="clean-act-btn is-teal ' + (isSettled ? 'is-muted' : '') + '" data-act="go" data-to="' + href + '">'
            + (r.isDemo ? (isSettled ? '看同类' : '去加环') : '搜闭环')
            + '</button>'
            + '</div>'
            + '</div>'
            + '</article>';
    }

    async function renderRelay() {
        var items = [];
        var authHint = '';
        try {
            items = (await api('/item/mine?status=1', {optionalAuth:true})).filter(function(item) { return item.allowCycle && !item.isDemo; });
        } catch (error) {
            authHint = error.code === 401 ? '登录后可一键匹配我的闲置闭环' : esc(error.message);
        }
        if (currentView.name !== 'relay') return;

        var myRelayCards = items.map(function (it) {
            return {
                id: Number(it.id),
                cat: it.category || '其他',
                isDemo: false,
                state: 'active',
                title: it.title,
                want: it.wantCategory || '任意好物',
                image: firstImage(it.images) || '/assets/amz/quad-relay.jpg'
            };
        });
        var fullList = myRelayCards.concat(DEMO_RELAYS);
        var activeCat = state.relayCat || '全部';
        var displayList = activeCat === '全部' ? fullList : fullList.filter(function (r) {
            return r.cat === activeCat || String(r.title + ' ' + r.want).indexOf(activeCat) >= 0;
        });
        var myQuickLinks = items.length
            ? '<div class="relay-my-strip"><b>我的接力物品：</b>'
              + items.map(function (item) {
                  return '<a class="relay-pill-link" href="#/cycle/' + Number(item.id) + '">' + clayIcon('swap', '接力', 'is-sm') + ' ' + esc(item.title) + ' ›</a>';
              }).join('') + '</div>'
            : '<div class="relay-my-strip"><span>' + (authHint || '发布支持接力的闲置即可参与三方成环') + '</span><a class="relay-pill-link" href="#/publish">+ 发布接力闲置 ›</a></div>';

        var content = '<div class="relay-eco-page">'
            + '<header class="relay-topo-hero">'
            + '<div class="relay-hero-left">'
            + '<span class="relay-hero-badge">三方接力匹配</span>'
            + '<h1>换物接力广场</h1>'
            + '<div class="relay-nav-tabs">'
            + '<a href="#/relay" class="on">接力池 (' + fullList.length + ')</a>'
            + '<a href="#/wishes">求换专区</a>'
            + '<a href="#/auctions">校园拍卖</a>'
            + '<a href="#/exchange">我的交换单</a>'
            + '</div>'
            + '</div>'
            + '<div class="relay-chain-diagram" aria-label="三方换物闭环示意图">'
            + '<div class="relay-node"><b>甲同学</b><span>出 A 换 B</span></div>'
            + '<span class="relay-arrow">➔</span>'
            + '<div class="relay-node"><b>乙同学</b><span>出 B 换 C</span></div>'
            + '<span class="relay-arrow">➔</span>'
            + '<div class="relay-node"><b>丙同学</b><span>出 C 换 A</span></div>'
            + '<span class="relay-arrow is-loop">↺ 成环</span>'
            + '</div>'
            + '<div class="relay-hero-mascot">'
            + '<img src="/assets/brand/mascot-wave-320.webp" alt="小唤">'
            + '<a class="btn btn-primary btn-sm" href="#/publish">+ 参与接力</a>'
            + '</div>'
            + '</header>'

            + myQuickLinks

            + '<div class="relay-filter-bar">'
            + '<div class="relay-cat-pills">'
            + [['全部', '全部标的 (' + fullList.length + ')'], ['数码', '数码外设'], ['教材', '考研教材'], ['运动', '运动户外'], ['生活', '宿舍生活']].map(function (c) {
                return '<button type="button" class="' + (activeCat === c[0] ? 'on' : '') + '" data-act="relay-cat" data-v="' + c[0] + '">' + c[1] + '</button>';
            }).join('')
            + '</div>'
            + '<a class="relay-ai-link" href="#/appraise">拿不准估值？找小唤算算 ›</a>'
            + '</div>'

            + '<div class="relay-eco-grid">'
            + (displayList.length ? displayList.map(relayCard).join('') : '<div class="card card-pad" style="grid-column:1/-1;text-align:center">当前分类暂无接力标的 <button type="button" class="btn btn-sm btn-primary" data-act="relay-cat" data-v="全部">查看全部</button></div>')
            + '</div>'
            + '</div>';

        $('#app').innerHTML = shell('relay', content);
    }

    async function renderCycle(itemId) {
        $('#app').innerHTML = shell('home', loading());
        var rings = [];
        try {
            rings = await api('/cycle/' + itemId);
        } catch (e) {
            if (e && e.code === 401) return;
            $('#app').innerHTML = shell('home', '<div class="page-head"><h1>暂无法查找换物环</h1>'
                + '<p>' + esc((e && e.message) || '该物品暂不满足闭环条件') + '</p></div>'
                + '<div class="btn-row">'
                + '<a class="btn btn-primary btn-sm" href="#/item/' + encodeURIComponent(itemId) + '/edit">去编辑物品</a>'
                + '<a class="btn btn-ghost btn-sm" href="#/relay">返回换物接力</a>'
                + '</div>');
            return;
        }

        if (!rings || rings.length === 0) {
            $('#app').innerHTML = shell('home', '<div class="page-head"><h1>暂时凑不成环</h1>'
                + '<p>三个人的意向必须首尾相接。差一环的时候，缺的往往是别人的一件物品。</p></div>'
                + emptyState(clayIcon('swap', '换物环', 'is-lg'), '没有找到闭合的换法', '可以再发一件物品，或者等别人补上新意向',
                    '<button class="btn btn-primary btn-sm" data-act="go" data-to="#/publish">再发一件</button>'));
            return;
        }

        var cardHtml = rings.map(function (r, idx) {
            var items = r.items || [];
            var users = r.users || [];
            // 三个节点：0 在正上方，1 在右下，2 在左下。节点 = 物品 + 主人
            var pos = [
                {left: '50%', top: '17%'},
                {left: '79%', top: '68%'},
                {left: '21%', top: '68%'}
            ];
            var nodes = items.map(function (it, i) {
                return '<div class="ring-node" style="left:' + pos[i].left + ';top:' + pos[i].top + '">'
                    + thumb(it, 'thumb')
                    + '<div class="rn-title">' + esc(it.title) + '</div>'
                    + '<div class="rn-owner">' + esc(users[i] ? users[i].nickname : '') + '</div>'
                    + '</div>';
            }).join('');
            var svg = '<svg viewBox="0 0 300 300" aria-hidden="true">'
                + '<circle cx="150" cy="150" r="98" fill="none" stroke="var(--theme-soft)" stroke-width="2" stroke-dasharray="7 7"/>'
                + '<defs><marker id="ah' + idx + '" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">'
                + '<path d="M0,0 L6,3 L0,6 z" fill="var(--theme-ink)"/></marker></defs>'
                + '<path d="M262 106 A98 98 0 0 1 262 194" fill="none" stroke="var(--theme-color)" stroke-width="1.6" '
                + 'marker-end="url(#ah' + idx + ')"/>'
                + '<path d="M196 262 A98 98 0 0 1 104 262" fill="none" stroke="var(--theme-color)" stroke-width="1.6" '
                + 'marker-end="url(#ah' + idx + ')"/>'
                + '<path d="M38 194 A98 98 0 0 1 38 106" fill="none" stroke="var(--theme-color)" stroke-width="1.6" '
                + 'marker-end="url(#ah' + idx + ')"/>'
                + '</svg>';

            return '<div class="card card-pad" style="margin-bottom:14px">'
                + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">'
                + '<span class="tag success">第 ' + (idx + 1) + ' 组闭环</span>'
                + '<span class="tag ghost">三人各出一件</span></div>'
                + '<div class="ring">' + svg + nodes
                + '<div class="ring-center"><b>三方闭环</b><span>各得一件</span></div>'
                + '</div>'
                + '<p style="font-size:13px;line-height:1.75;color:var(--ink-700);margin:2px 0 6px">'
                + esc(r.flow) + '</p>'
                + '<p class="hint" style="margin:0 0 12px">' + esc(r.explain || '') + '</p>'
                // 主按钮放在建议面交之前，保证一屏之内看得到
                + '<button class="btn btn-accent btn-block" data-act="create-ring" data-id="'
                + itemId + '" data-ids="' + (r.itemIds || []).join(',') + '">就选这组，成环</button>'
                + '<div class="card" style="padding:10px 12px;margin-top:10px;background:var(--brand-50);'
                + 'border-color:var(--brand-100)">'
                + '<span style="font-size:12px;color:var(--brand-700)">' + esc(r.place || '') + '</span></div>'
                + '</div>';
        }).join('');

        $('#app').innerHTML = shell('home', '<div class="page-head"><h1>找到 ' + rings.length + ' 组换法</h1>'
            + '<p>选定一组后，三件物品会立刻锁定，等三方各自确认。</p></div>' + cardHtml);
    }

    // ------------------------------------------------------------------ 交换单

    async function renderExchanges() {
        $('#app').innerHTML = shell('exchange', loading());
        var list = await api('/exchange/mine');
        var q = String(state.offersQuery || '').trim().toLowerCase();
        var filtered = (list || []).filter(function (e) {
            if (!q) return true;
            return [e.id, e.place, e.statusText].join(' ').toLowerCase().indexOf(q) >= 0;
        });
        var rows = filtered.map(function (e) {
            var st = e.status === 3 ? 'success' : (e.status >= 4 ? 'ghost' : (e.status === 2 ? 'accent' : 'brand'));
            return '<article class="jd-order-item">'
                + '<header class="jd-item-head">'
                + '<span class="jd-item-time">校内实名担保交易</span>'
                + '<span class="jd-item-no">交换单号：<b>#EX' + (200000 + Number(e.id || 0)) + '</b></span>'
                + '<a href="#/notifications" class="jd-item-shop">' + (e.type === 3 ? '三方换物接力成环' : '一对一当面交换') + ' <i class="jd-chat-dot">' + clayIcon('chat', '联系同学', 'is-sm') + '</i></a>'
                + '<span class="jd-item-credit">面交点位：' + esc(e.place || '待双方约定') + '</span>'
                + '</header>'
                + '<div class="jd-item-row">'
                + '<div class="jd-col-goods">'
                + '<div class="jd-goods-thumb"><img src="/assets/amz/quad-relay.jpg" alt=""></div>'
                + '<div class="jd-goods-info">'
                + stepsHtml(e)
                + '<p class="jd-goods-note">' + (window.exchangeNeedsConfirmation(e) ? '已确认 ' + (e.confirmedCount || 0) + '/' + (e.needConfirm || 2) + ' ' : '')
                + '已交付 ' + (e.deliveredCount || 0) + '/' + (e.needConfirm || 2) + '</p>'
                + '</div>'
                + '<span class="jd-goods-qty">x1</span>'
                + '<div class="jd-goods-repair"><a href="#/exchange/' + e.id + '">进度追踪</a></div>'
                + '</div>'
                + '<div class="jd-col-buyer"><span class="jd-buyer-name">校内同学 <i>' + clayIcon('user', '同学', 'is-sm') + '</i></span></div>'
                + '<div class="jd-col-amount"><b>当面交接</b><small>' + (e.type === 3 ? '三方接力' : '双人互换') + '</small></div>'
                + '<div class="jd-col-status"><span class="tag ' + st + '">' + esc(e.statusText) + '</span><a href="#/exchange/' + e.id + '">订单详情</a></div>'
                + '<div class="jd-col-ops"><button class="jd-btn-rebuy" data-act="go" data-to="#/exchange/' + e.id + '">查看详情与操作</button></div>'
                + '</div></article>';
        }).join('');

        var content = '<div class="jd-center-wrap">'
            + jdSideNav('exchange')
            + '<div class="jd-order-main">'
            + '<div class="jd-order-title-bar"><h2>我的交换单</h2>' + (q ? '<span>筛选：“' + esc(q) + '”</span>' : '') + '</div>'
            + '<div class="jd-order-panel">'
            + '<div class="jd-order-tabs-row">'
            + '<div class="jd-order-tabs">'
            + '<a href="#/offers">收到的报价</a>'
            + '<a href="#/exchange" class="on">我的交换单</a>'
            + '<a href="#/relay">三方换物接力</a>'
            + '<a href="#/me/reviews">待评价</a>'
            + '</div>'
            + '<form class="jd-order-search" data-form="orders-search">'
            + '<input name="q" type="search" value="' + esc(state.offersQuery || '') + '" placeholder="商品名称/交换单号/面交点位" aria-label="交换单搜索">'
            + '<button type="submit">搜索</button>'
            + '</form>'
            + '</div>'
            + '<div class="jd-table-head">'
            + '<span class="col-goods">交换单详情</span>'
            + '<span class="col-buyer">交易伙伴</span>'
            + '<span class="col-amount">交易模式</span>'
            + '<span class="col-status">全部状态 ▾</span>'
            + '<span class="col-ops">操作</span>'
            + '</div>'
            + (rows ? '<div class="jd-order-list">' + rows + '</div>'
                : '<div class="jd-empty-order-box">'
                    + '<img src="/assets/brand/mascot-box.png" alt="小唤">'
                    + '<div class="jd-empty-order-copy">'
                    + '<p>' + (q ? '未找到匹配“' + esc(q) + '”的交换单' : '暂无进行中的交换单') + '</p>'
                    + '<div class="jd-empty-btns">'
                    + '<button type="button" class="jd-btn-red" data-act="go" data-to="#/offers">查看报价</button>'
                    + '<button type="button" class="jd-btn-outline" data-act="go" data-to="#/home">去首页</button>'
                    + '</div></div></div>')
            + '<div class="jd-demo-divider"><span>近期订单示例</span><a href="#/idle">去集市 ›</a></div>'
            + '<div class="jd-order-list">' + (jdShowcaseOrderRows() || '<p class="hint" style="padding:12px">暂无匹配订单示例 <button type="button" class="link-btn" data-act="orders-reset">恢复全部</button></p>') + '</div>'
            + '</div></div></div>';

        $('#app').innerHTML = shell('trade', content);
    }

    async function renderExchangeDetail(id) {
        $('#app').innerHTML = shell('exchange', loading());
        var e = await api('/exchange/' + id);
        if (currentView.name !== 'exchangeDetail' || currentView.arg !== id) return;
        var summary = window.exchangeSummary(e);
        var mine = summary.mine;
        var details = summary.people;

        var rows = details.map(function (d) {
            var isMe = summary.isMe(d);
            var recipient = summary.recipientFor(d);
            return '<div class="list-row" style="cursor:default">'
                + '<div class="avatar" style="width:32px;height:32px;border-radius:11px">'
                + esc((d.nickname || '同').slice(0, 1)) + '</div>'
                + '<div class="row-main">'
                + '<p class="row-title" style="font-size:14px">'
                + (isMe
                    ? esc(d.nickname || '同学') + ' <span class="exchange-self">我</span>'
                    : '<button class="name-link" data-act="go" data-to="#/user/' + d.userId + '">'
                      + esc(d.nickname || '同学') + '</button>')
                + '</p>'
                + '<p class="row-sub">给出「' + esc(d.giveTitle || '物品') + '」'
                + (recipient ? '给 ' + esc(summary.isMe(recipient) ? '我' : recipient.nickname || '同学') : '')
                + ' | 收到「' + esc(d.getTitle || '物品') + '」</p>'
                + '</div>'
                + '<div class="exchange-person-status">'
                + (summary.needsConfirmation ? '<div>' + (d.confirmed ? '<span style="color:var(--success-600)">已确认</span>' : '待确认') + '</div>' : '')
                + '<div>' + (d.delivered ? '<span style="color:var(--success-600)">已交付</span>' : '待交付') + '</div>'
                + '</div></div>';
        }).join('');

        var actions = '';
        if (summary.canConfirm) {
            actions = '<button class="btn btn-primary" data-act="ex-confirm" data-id="' + e.id + '">确认参与</button>';
        } else if (summary.canReceive) {
            actions = '<button class="btn btn-primary" data-act="ex-done" data-id="' + e.id + '">确认收货</button>';
        } else if (e.status === 3) {
            actions = '<button class="btn btn-primary" data-act="open-review" data-id="' + e.id + '">评价参与者</button>';
        }
        if (summary.active) {
            actions += '<button class="btn btn-ghost" data-act="open-place" data-id="' + e.id + '">约面交</button>'
                + '<button class="btn btn-ghost exchange-cancel" data-act="ex-cancel" data-id="' + e.id + '">取消交换</button>';
        }

        var handoff = mine ? '<section class="exchange-handoff" aria-label="我的物品交接">'
            + '<div><span>我给出</span><strong>' + esc(mine.giveTitle || '物品') + '</strong>'
            + (summary.recipient ? '<small>交给 ' + esc(summary.recipient.nickname || '同学') + '</small>' : '') + '</div>'
            + '<div><span>我收到</span><strong>' + esc(mine.getTitle || '物品') + '</strong>'
            + (summary.sender ? '<small>来自 ' + esc(summary.sender.nickname || '同学') + '</small>' : '') + '</div></section>' : '';
        var content = '<article class="exchange-detail"><header class="exchange-heading">'
            + '<a class="exchange-back" href="#/exchange">' + navIcon('back') + ' 返回交换单</a>'
            + '<p class="hint">#' + e.id + ' | ' + (e.type === 3 ? '三方成环' : '一对一交换')
            + (e.createTime ? ' | 创建于 ' + fmtDate(e.createTime) : '') + '</p>'
            + '<h1>' + esc(e.statusText) + '</h1><p class="exchange-next">' + esc(summary.next) + '</p>'
            + stepsHtml(e)
            + '<p class="exchange-counts">' + (summary.needsConfirmation
                ? '已确认 ' + (e.confirmedCount || 0) + '/' + (e.needConfirm || details.length) + ' | ' : '')
            + '已收货 ' + (e.deliveredCount || 0) + '/' + (e.needConfirm || details.length) + '</p></header>'
            + handoff
            + '<div class="exchange-detail-grid"><section class="exchange-people"><h2>参与者</h2>' + rows
            + (e.type === 3 ? '<a class="btn btn-ghost" href="#/ring/' + e.id + '">进入三方协商房间</a>' : '') + '</section>'
            + '<section class="exchange-meet"><h2>面交安排</h2>'
            + '<div class="kv"><span class="k">地点</span><span class="v">' + esc(e.place || '待约定') + '</span></div>'
            + '<div class="kv"><span class="k">时间</span><span class="v">' + esc(e.dealTime || '待约定') + '</span></div>'
            + (actions ? '<div class="exchange-actions">' + actions + '</div>' : '') + '</section></div></article>';

        $('#app').innerHTML = shell('trade', content);
    }

    // ------------------------------------------------------------------ 他人主页

    async function renderUser(id) {
        $('#app').innerHTML = shell('home', loading());

        var u, reviews, items, pending = [];
        try {
            var res = await Promise.all([
                api('/user/' + id),
                api('/review/user/' + id),
                api('/item/user/' + id)
            ]);
            u = res[0];
            reviews = res[1] || [];
            items = res[2] || [];
            try {
                pending = (await api('/review/pending')) || [];
            } catch (e) {
                pending = [];
            }
        } catch (e) {
            $('#app').innerHTML = shell('home', emptyState(navIcon('search'), '找不到这位同学',
                e.message || '主页链接可能已经失效',
                '<button class="btn btn-primary btn-sm" data-act="go" data-to="#/home">回集市</button>'));
            return;
        }

        var todo = (pending || []).filter(function (p) { return p.targetUserId === id; });
        var reviewBtn = todo.length
            ? '<button class="btn btn-primary btn-block" data-act="user-review" data-exchange="'
              + todo[0].exchangeId + '" data-id="' + id + '" data-nick="' + esc(u.nickname) + '">'
              + '评价 TA' + (todo.length > 1 ? '（还有 ' + todo.length + ' 单没评）' : '') + '</button>'
            : '';

        var lvl = u.creditLevel ? {text: u.creditLevel, cls: creditLevelOf(u.credit).cls} : creditLevelOf(u.credit);
        var rate = (u.goodRate === null || u.goodRate === undefined) ? '—' : u.goodRate + '%';
        var pct = Math.max(3, Math.min(100, u.credit || 0));

        var content = '<section class="redesign-page public-profile"><header class="redesign-heading"><a class="icon-action" href="#/home" aria-label="返回首页">'+navIcon('back')+'</a><h1>个人主页</h1><button type="button" class="link-btn" data-act="profile-share">分享</button></header><div class="card card-pad">'
            + '<div class="user-row">'
            + '<div class="avatar lg">' + esc((u.nickname || '同').slice(0, 1)) + '</div>'
            + '<div class="u-main"><p class="u-name" style="font-size:19px">' + esc(u.nickname)
            + ' <span class="tag ' + lvl.cls + '">' + esc(lvl.text) + '</span></p>'
            + '<p class="u-sub">重庆移通学院 | ' + esc(u.college || '未填院系')
            + ' | ' + esc(u.building || '未填宿舍楼') + '</p></div>'
            + creditBadge(u)
            + '</div>'
            + '<div class="credit-track"><div class="credit-fill" style="width:' + pct + '%"></div></div>'
            + '<div class="credit-scale"><span>0</span><span>60 受限线</span><span>100</span></div>'
            + '<div class="stats" style="margin-top:14px">'
            + '<div class="stat"><p class="k">成交</p><p class="v num">' + (u.dealCount || 0) + '<small>单</small></p></div>'
            + '<div class="stat"><p class="k">好评率</p><p class="v num">' + rate + '</p></div>'
            + '<div class="stat"><p class="k">平均分</p><p class="v num">'
            + (u.avgScore ? u.avgScore : '<span style="font-size:15px;color:var(--ink-400)">暂无</span>') + '</p></div>'
            + '<div class="stat"><p class="k">在架</p><p class="v num">' + (u.onShelfCount || 0) + '<small>件</small></p></div>'
            + '</div>'
            + (reviewBtn ? '<div style="margin-top:14px">' + reviewBtn + '</div>' : '')
            + '</div>'

            + '<div class="profile-switch" aria-label="个人主页内容"><button data-act="profile-tab" data-v="items" aria-pressed="true">宝贝 '+items.length+'</button><button data-act="profile-tab" data-v="reviews" aria-pressed="false">评价 '+reviews.length+'</button></div>'
            + '<section data-profile-panel="items"><div class="section-title"><h2>在架物品</h2>'
            + '<span class="more">' + (items || []).length + ' 件</span></div>'
            + (items.length
                ? '<div class="pgrid">' + items.map(pCard).join('') + '</div>'
                : '<div class="card card-pad"><p class="hint" style="margin:0">TA 现在没有在架的物品。</p></div>')

            + '</section><section data-profile-panel="reviews" hidden><div class="section-title"><h2>收到的评价</h2>'
            + '<span class="more">' + (u.reviewCount || 0) + ' 条</span></div>'
            + (reviews.length ? '<div class="grid">' + reviews.map(function (r) {
                return '<div class="card card-pad">'
                    + '<div style="display:flex;align-items:center;gap:10px">'
                    + '<div class="avatar" style="width:30px;height:30px;border-radius:10px;font-size:12px">'
                    + esc((r.fromNickname || '同').slice(0, 1)) + '</div>'
                    + '<div style="flex:1;min-width:0"><p style="font-size:14px;margin:0">'
                    + esc(r.fromNickname || '同学') + '</p>'
                    + '<p class="hint" style="margin:2px 0 0">' + fmtDate(r.createTime) + '</p></div>'
                    + '<span style="color:var(--theme-ink);font-size:13px;white-space:nowrap">' + navIcon('star').repeat(r.score) + '</span></div>'
                    + '<p style="font-size:13px;line-height:1.7;margin:10px 0 0;color:var(--ink-700)">'
                    + esc(r.content || '没有留文字') + '</p></div>';
            }).join('') + '</div>'
                : '<div class="card card-pad"><p class="hint" style="margin:0">'
                  + '还没有人评价 TA。完成一次交换后就可以互评。</p></div>');

        $('#app').innerHTML = shell(state.me?.id===id?'me':'profile', content+'</section></section>');
    }

    // ------------------------------------------------------------------ 我的

    async function renderMe() {
        $('#app').innerHTML = shell('me', loading());
        var me = await api('/user/me');
        state.me = me;
        var results = await Promise.all([
            api('/item/mine'),
            api('/review/user/' + me.id),
            api('/review/pending').catch(function () { return []; })
        ]);
        var items = results[0];
        var reviews = results[1];
        var pending = results[2] || [];
        state.pending = pending;

        var onShelf = (items || []).filter(function (i) {
            return i.status === 1;
        });
        var shown = (items || []).filter(function (it) {
            return state.meFilter === 'all' || String(it.status) === String(state.meFilter);
        });
        var itemRows = shown.map(function (it) {
            var st = it.status === 1 ? 'success' : (it.status === 2 ? 'accent' : 'ghost');
            return '<div class="card card-pad" style="display:flex;gap:12px;align-items:center">'
                + thumb(it)
                + '<div style="flex:1;min-width:0">'
                + '<p class="item-title">' + esc(it.title) + '</p>'
                + '<div class="item-foot" style="margin-top:6px"><span class="tag ' + st + '">'
                + esc(it.statusText) + '</span><span class="tag ghost">'
                + (it.offerCount > 0 ? it.offerCount + ' 报价' : '暂无报价') + '</span></div>'
                + '</div>'
                + '<div style="display:flex;flex-direction:column;gap:6px">'
                + ((it.status === 4 || it.status === 5 || it.status === 6) ? '<button class="btn btn-sm btn-ghost" data-act="go" data-to="#/item/'+it.id+'/edit">编辑</button>' : '')
                + (it.status === 1
                    ? '<button class="btn btn-sm btn-ghost" data-act="toggle-item" data-id="' + it.id + '" data-status="4">下架</button>'
                    : ((it.status === 4 || it.status === 6)
                        ? '<button class="btn btn-sm btn-ghost" data-act="toggle-item" data-id="' + it.id + '" data-status="1">重新提交审核</button>'
                        : ''))
                + (it.status === 1 && it.allowCycle
                    ? '<button class="btn btn-sm btn-primary" data-act="cycle" data-id="' + it.id + '">找环</button>' : '')
                + '</div></div>';
        }).join('');

        var reviewRows = (reviews || []).map(function (r) {
            return '<div class="list-row" style="cursor:default">'
                + '<div class="avatar" style="width:30px;height:30px;border-radius:10px;font-size:12px">'
                + esc((r.fromNickname || '同').slice(0, 1)) + '</div>'
                + '<div class="row-main"><p class="row-title" style="font-size:14px">'
                + '<button class="name-link" data-act="go" data-to="#/user/' + r.fromUser + '">'
                + esc(r.fromNickname || '同学') + '</button>'
                + ' <span style="color:var(--theme-ink)">' + navIcon('star').repeat(r.score) + '</span></p>'
                + '<p class="row-sub">' + esc(r.content || '没有留文字') + '</p></div>'
                + '<span class="hint">' + fmtDate(r.createTime) + '</span></div>';
        }).join('');

        var content = '<div class="jd-center-wrap">'
            + jdSideNav('me')
            + '<div class="jd-me-main">'
            + '<section class="jd-me-hero-card">'
            + '<div class="jd-me-user-box">'
            + '<div class="jd-me-user-top">'
            + '<a class="jd-me-avatar" href="#/user/' + Number(me.id) + '" aria-label="打开个人主页">'
            + '<img src="/assets/brand/mascot-wave-320.webp" alt="">'
            + '<span class="jd-vip-pill">VIP 会员</span>'
            + '</a>'
            + '<div class="jd-me-user-meta">'
            + '<h3>' + esc(me.nickname) + (me.role === 1 ? ' <span class="tag brand">管理员</span>' : '') + '</h3>'
            + '<p>' + esc(me.college || '重庆移通学院') + ' ' + esc(me.building || '北山书院') + '</p>'
            + '<div class="jd-me-user-links">'
            + '<button type="button" class="link-btn" data-act="open-profile">改资料</button>'
            + '<a href="#/settings">账号安全</a>'
            + (me.role === 1 ? '<button type="button" class="link-btn" data-act="go" data-to="#/admin">管理后台</button>' : '')
            + '<button type="button" class="link-btn" data-act="logout">退出</button>'
            + '</div></div></div>'
            + '<div class="jd-me-plus-bar">'
            + '<div><b>PLUS 小唤会员</b></div>'
            + '<a href="#/appraise">AI估价 ›</a>'
            + '</div></div>'
            + '<div class="jd-me-assets-grid">'
            + '<div class="jd-asset-col"><b>' + me.credit + '</b><span>校园信用分</span><button type="button" class="jd-asset-act" data-act="credit-rule">信用规则</button></div>'
            + '<div class="jd-asset-col"><b>' + onShelf.length + '</b><span>在架闲置</span><a class="jd-asset-act" href="#/publish">去发布</a></div>'
            + '<div class="jd-asset-col"><b>' + (me.dealCount || 0) + '</b><span>累计成交</span><a class="jd-asset-act" href="#/exchange">查看履约</a></div>'
            + '<div class="jd-asset-col"><b>' + (me.reviewCount || 0) + '</b><span>收到评价</span><a class="jd-asset-act" href="#/user/' + Number(me.id) + '">个人主页</a></div>'
            + '<div class="jd-asset-col"><b>' + (me.avgScore ? me.avgScore : '5.0') + '</b><span>好评分</span>'
            + (pending.length ? '<button type="button" class="jd-asset-act accent" data-act="pending-review">' + pending.length + '单待评</button>' : '<a class="jd-asset-act" href="#/offers">报价中心</a>')
            + '</div></div>'
            + '<a class="jd-me-recycle-card" href="#/appraise">'
            + '<div class="jd-recycle-copy">'
            + '<span class="jd-recycle-tag">小唤实验室</span>'
            + '<h4>AI 智能估价</h4>'
            + '<b>去估价 ›</b>'
            + '</div>'
            + '<img src="/assets/brand/mascot-search.png" alt="小唤">'
            + '</a>'
            + '</section>'

            + '<section class="jd-me-mid-grid">'
            + '<div class="jd-me-card jd-me-orders-card">'
            + '<header class="jd-card-head"><h3>我的订单</h3><a href="#/offers">全部订单 ›</a></header>'
            + '<div class="jd-order-quick-icons">'
            + '<a href="#/offers"><i>' + clayIcon('order', '收到报价', 'is-lg') + '</i><span>收到报价</span></a>'
            + '<a href="#/exchange"><i>' + clayIcon('swap', '待面交', 'is-lg') + '</i><span>待面交</span></a>'
            + '<a href="#/me/reviews"><i>' + clayIcon('chat', '待评价', 'is-lg') + '</i><span>待评价' + (pending.length ? ' (' + pending.length + ')' : '') + '</span></a>'
            + '<a href="#/relay"><i>' + clayIcon('fire', '换物接力', 'is-lg') + '</i><span>换物接力</span></a>'
            + '<a href="#/me/auctions"><i>' + clayIcon('auction', '我的竞拍', 'is-lg') + '</i><span>我的竞拍</span></a>'
            + '</div>'
            + '<div class="jd-order-mini-preview">'
            + '<img src="/assets/brand/mascot-box.png" alt="小唤">'
            + '<div><a href="#/offers">进入订单中心 ›</a></div>'
            + '</div></div>'
            + '<div class="jd-me-card jd-me-fav-card">'
            + '<div class="jd-fav-stats">'
            + '<a href="#/favorites"><b>' + shelfRead('favorites').length + '</b><span>我的收藏</span></a>'
            + '<a href="#/history"><b>' + shelfRead('history').length + '</b><span>浏览足迹</span></a>'
            + '<a href="#/wishes"><b>' + (items || []).length + '</b><span>发布记录</span></a>'
            + '</div>'
            + '<a class="jd-fav-banner" href="#/auctions">'
            + '<div><b>校园限时拍卖</b><span>1元起拍</span></div>'
            + '<em>进入 ›</em>'
            + '</a>'
            + '</div>'
            + '</section>'

            + '<section class="jd-me-service-grid">'
            + '<div class="jd-me-card jd-me-follow-card">'
            + '<header class="jd-card-head"><h3>常逛校园专区</h3><a href="#/idle">全部好物 ›</a></header>'
            + '<div class="jd-follow-tags">'
            + '<a href="#/idle?cat=教材"><img src="/assets/amz/quad-books.jpg" alt=""><span>考研与教材</span></a>'
            + '<a href="#/idle?cat=数码"><img src="/assets/amz/quad-digital.jpg" alt=""><span>数码与外设</span></a>'
            + '<a href="#/idle?cat=运动"><img src="/assets/amz/quad-sports.jpg" alt=""><span>球类与骑行</span></a>'
            + '<a href="#/idle?cat=生活"><img src="/assets/amz/quad-dorm.jpg" alt=""><span>宿舍生活</span></a>'
            + '</div></div>'
            + '<div class="jd-me-3posters">'
            + '<a class="jd-poster-tile tone-peach" href="#/community"><h4>逛频道社区 ›</h4><img src="/assets/amz/quad-community.jpg" alt=""></a>'
            + '<a class="jd-poster-tile tone-blue" href="#/relay"><h4>换物接力厅 ›</h4><img src="/assets/amz/quad-relay.jpg" alt=""></a>'
            + '<a class="jd-poster-tile tone-mint" href="#/community/game"><h4>Scrap Arena ›</h4><img src="/assets/brand/mascot-wave-320.webp" alt=""></a>'
            + '</div>'
            + '</section>'

            + '<section class="jd-me-card jd-me-footprint-embed">'
            + '<header class="jd-card-head">'
            + '<div class="jd-fp-embed-title"><h3>☆ 足迹与收藏</h3></div>'
            + '<div class="jd-fp-embed-links"><a href="#/history" class="on">足迹 (' + shelfRead('history').length + ')</a><a href="#/favorites">收藏 (' + shelfRead('favorites').length + ')</a><a href="#/history">全部 ›</a></div>'
            + '</header>'
            + '<div class="jd-history-grid">'
            + (shelfRead('favorites').concat(shelfRead('history')).slice(0, 4).map(function (it, idx) {
                return {
                    id: Number(it.id),
                    isDemo: false,
                    title: it.title || '校园好物',
                    category: it.category || '数码',
                    price: (59 + idx * 35) + '.90',
                    images: firstImage(it.images) || DEMO_SHELF_ITEMS[idx % DEMO_SHELF_ITEMS.length].images
                };
            }).concat(DEMO_SHELF_ITEMS).slice(0, 4).map(function (it) {
                var href = it.isDemo ? '#/idle?cat=' + encodeURIComponent(it.category) : '#/item/' + Number(it.id);
                var priceParts = String(it.price || '68.00').split('.');
                return '<article class="jd-history-card">'
                    + '<div class="jd-h-media">'
                    + '<a href="' + href + '" class="jd-h-img-link">'
                    + '<img src="' + esc(it.images) + '" onerror="this.onerror=null;this.src=\'/assets/amz/quad-digital.jpg\'" alt="' + esc(it.title) + '" loading="lazy">'
                    + '</a></div>'
                    + '<div class="jd-h-body">'
                    + '<a href="' + href + '" class="jd-h-title">' + esc(it.title) + '</a>'
                    + '<div class="jd-h-price-row">'
                    + '<div class="jd-h-price"><em>¥</em><b>' + esc(priceParts[0]) + '</b><sup>.' + esc(priceParts[1] || '00') + '</sup></div>'
                    + '<a href="' + href + '" class="jd-h-plus" aria-label="查看详情">+</a>'
                    + '</div></div></article>';
            }).join(''))
            + '</div>'
            + '</section>'

            + '<section class="jd-me-card jd-me-shelf-section">'
            + '<div class="desk-me-bar">'
            + '<h3>我的在架与发布物品</h3>'
            + '<div class="desk-me-bar-right">'
            + '<div class="segmented">'
            + [['all', '全部'], ['1', '在架'], ['4', '已下架'], ['3', '已换出']].map(function (t) {
                return '<button class="' + (String(state.meFilter) === t[0] ? 'on' : '')
                    + '" data-act="me-filter" data-v="' + t[0] + '">' + t[1] + '</button>';
            }).join('')
            + '</div>'
            + '<button class="btn btn-primary btn-sm" data-act="go" data-to="#/publish">发布闲置</button>'
            + '</div></div>'
            + (itemRows ? '<div class="desk-grid-2">' + itemRows + '</div>'
                : emptyState(navIcon('box'),
                    state.meFilter === 'all' ? '还没有发布过物品' : '暂无该状态物品',
                    '',
                    '<button class="btn btn-primary btn-sm" data-act="go" data-to="#/publish">去发布</button>'))
            + '<div class="section-title" style="margin-top:22px"><h2>收到的同学评价</h2></div>'
            + (reviewRows ? '<div class="desk-grid-2">' + reviewRows + '</div>'
                : emptyState(clayIcon('star', '评价', 'is-lg'), '还没有评价', ''))
            + '</section>'
            + '</div></div>';

        $('#app').innerHTML = shell('me', content);
    }

    async function renderMeSub(tab) {
        var me = state.me || {};
        $('#app').innerHTML = shell('me', loading());
        var panelTitle = '个人中心', panelSub = '', panelActions = '', bodyHtml = '';

        function wrapPanel() {
            return '<div class="jd-center-wrap">'
                + jdSideNav(tab)
                + '<div class="jd-order-main jd-me-subpanel">'
                + '<div class="jd-order-title-bar"><h2>' + esc(panelTitle) + '</h2>'
                + (panelSub ? '<span>' + esc(panelSub) + '</span>' : '')
                + (panelActions ? '<div class="jd-subbar-right">' + panelActions + '</div>' : '')
                + '</div>'
                + '<div class="jd-order-panel">' + bodyHtml + '</div>'
                + '</div></div>';
        }

        if (tab === 'auctions') {
            panelTitle = '我的竞拍活动';
            panelSub = '发布与参与的校园拍卖实时进度';
            panelActions = '<a class="btn btn-primary btn-sm" href="#/auction/new">+ 发起拍卖</a><a class="btn btn-ghost btn-sm" href="#/auctions">全部拍卖 ›</a>';
            var myAuctions = await api('/auction/mine').catch(function () { return []; });
            bodyHtml = (myAuctions && myAuctions.length)
                ? '<div class="ali-auction-grid jd-sub-grid">' + myAuctions.map(function (a) { return auctionCard(a, 'mine'); }).join('') + '</div>'
                : '<div class="jd-empty-order-box"><img src="/assets/brand/mascot-box.png" alt="小唤"><div class="jd-empty-order-copy"><p>暂未发布过个人拍卖</p><div class="jd-empty-btns"><a class="jd-btn-red" href="#/auction/new">立即发起拍卖</a><a class="jd-btn-outline" href="#/auctions">去竞拍大厅捡漏</a></div></div></div>';
            $('#app').innerHTML = shell('me', wrapPanel());
            return;
        }

        if (tab === 'reviews') {
            panelTitle = '评价晒单';
            panelSub = '管理待评价交换单与同学对你的口碑';
            panelActions = '<a class="btn btn-ghost btn-sm" href="#/exchange">我的交换单 ›</a>';
            var revRes = await Promise.all([
                api('/review/pending').catch(function () { return []; }),
                api('/review/user/' + Number(me.id || 0)).catch(function () { return []; })
            ]);
            var pendingList = revRes[0] || [], recReviews = revRes[1] || [];
            var pendingHtml = pendingList.length
                ? '<div class="jd-sub-block"><h3>' + clayIcon('chat', '待评价', 'is-sm') + ' 待评价交易 (' + pendingList.length + ')</h3><div class="jd-sub-cards">'
                  + pendingList.map(function (p) {
                      return '<div class="jd-sub-item-card"><div><b>与 ' + esc(p.nickname || '校内同学') + ' 的交换</b><small>交换单 #' + Number(p.exchangeId) + ' | 完成后可互相加信用分</small></div>'
                          + '<button type="button" class="btn btn-primary btn-sm" data-act="user-review" data-exchange="' + p.exchangeId + '" data-id="' + p.userId + '" data-nick="' + esc(p.nickname) + '">立即评价</button></div>';
                  }).join('') + '</div></div>'
                : '<div class="jd-sub-banner-tip">' + clayIcon('star', '评价', 'is-sm') + '<span>暂无待评价交换单，完成一次校园换物即可解锁评价奖励信用分。</span><a href="#/exchange" class="btn btn-sm btn-ghost">查看交换单</a></div>';
            var recHtml = recReviews.length
                ? '<div class="jd-sub-block"><h3>收到的同学评价 (' + recReviews.length + ')</h3><div class="desk-grid-2">'
                  + recReviews.map(function (r) {
                      return '<div class="list-row" style="cursor:default"><div class="avatar" style="width:32px;height:32px;border-radius:8px;font-size:12px">' + esc((r.fromNickname || '同').slice(0, 1)) + '</div>'
                          + '<div class="row-main"><p class="row-title"><button class="name-link" data-act="go" data-to="#/user/' + r.fromUser + '">' + esc(r.fromNickname || '同学') + '</button> '
                          + '<span class="amz-stars">' + '★'.repeat(Math.max(1, Number(r.score || 5))) + '</span></p><p class="row-sub">' + esc(r.content || '交易顺利，物超所值！') + '</p></div>'
                          + '<span class="hint">' + fmtDate(r.createTime) + '</span></div>';
                  }).join('') + '</div></div>'
                : '<div class="jd-sub-block"><h3>历史晒单示范</h3><div class="jd-sub-cards"><div class="jd-sub-item-card"><div><b>罗技 GPW 二代无线鼠标互换成功</b><span class="amz-stars">★★★★★</span><small>北山书院当面验货，成色和描述一模一样！</small></div><span class="tag success">+2 信用分</span></div></div></div>';
            bodyHtml = pendingHtml + recHtml;
            $('#app').innerHTML = shell('me', wrapPanel());
            return;
        }

        if (tab === 'wishes') {
            panelTitle = '求换心愿单';
            panelSub = '我发布的求换需求与高匹配校园心愿';
            panelActions = '<a class="btn btn-primary btn-sm" href="#/wishes">前往求换大厅 ›</a>';
            var allWishes = await api('/wish', {optionalAuth: true}).catch(function () { return []; });
            var myWishes = (allWishes || []).filter(function (w) { return me.id && w.userId === me.id; });
            var wishQuickForm = '<form class="jd-sub-inline-form" data-form="wish-new">'
                + '<input class="input" name="title" maxlength="80" placeholder="输入想换的宝贝，如：高数笔记本 / 机械键盘" required>'
                + '<select class="select" name="category"><option value="">选择分类</option>' + CATS.map(function (c) { return '<option>' + esc(c) + '</option>'; }).join('') + '</select>'
                + '<input class="input" name="content" maxlength="200" placeholder="可用来交换的物品/面交书院">'
                + '<button type="submit" class="btn btn-primary btn-sm">发布心愿</button>'
                + '</form>';
            var myWishHtml = myWishes.length
                ? myWishes.map(function (w) {
                    return '<div class="jd-sub-item-card"><div><b>' + esc(w.title) + '</b><small>' + esc(w.category || '全品类') + ' | ' + esc(w.content || '校内当面互换') + '</small></div>'
                        + '<button type="button" class="btn btn-sm btn-ghost" data-act="wish-close" data-id="' + w.id + '">关闭心愿</button></div>';
                }).join('')
                : '<p class="hint">你还没有发布求换心愿，可在上方直接提交，或浏览下方热门心愿快速响应。</p>';
            bodyHtml = '<div class="jd-sub-block"><h3>' + clayIcon('star', '心愿', 'is-sm') + ' 快速新增求换心愿</h3>' + wishQuickForm + '</div>'
                + '<div class="jd-sub-block"><h3>我的求换列表 (' + myWishes.length + ')</h3><div class="jd-sub-cards">' + myWishHtml + '</div></div>'
                + '<div class="jd-sub-block"><h3>校园热门求换推荐</h3><div class="wish-bounty-grid jd-sub-4col">' + DEMO_WISHES.slice(0, 4).map(wishAuctionCard).join('') + '</div></div>';
            $('#app').innerHTML = shell('me', wrapPanel());
            return;
        }

        if (tab === 'channels') {
            panelTitle = '关注的频道';
            panelSub = '我订阅的校园贴吧与实时聊天室';
            panelActions = '<button type="button" class="btn btn-primary btn-sm" data-act="open-create-room">+ 创建聊天室</button><a class="btn btn-ghost btn-sm" href="#/community">进入社区 ›</a>';
            var rooms = getAllRooms();
            var follows = getRoomFollows();
            bodyHtml = '<div class="jd-sub-cards jd-channel-cards">' + rooms.map(function (r) {
                var isFollowed = follows.indexOf(r.id) >= 0;
                return '<div class="jd-sub-item-card">'
                    + '<div class="jd-sub-ico-row">' + clayIcon(r.icon || 'fire', r.name, 'is-lg')
                    + '<div><b>' + esc(r.name) + '</b><small>' + esc(r.desc || '校园主题交流与闲置晒单贴吧') + ' | ' + (r.members || 320) + ' 人关注</small></div></div>'
                    + '<div class="jd-sub-btn-row">'
                    + '<button type="button" class="btn btn-sm ' + (isFollowed ? 'btn-ghost' : 'btn-primary') + '" data-act="toggle-follow-room" data-room="' + esc(r.id) + '">' + (isFollowed ? '已关注' : '+ 关注') + '</button>'
                    + '<button type="button" class="btn btn-sm btn-primary" data-act="open-room" data-room="' + esc(r.id) + '">进入贴吧</button>'
                    + '</div></div>';
            }).join('') + '</div>';
            $('#app').innerHTML = shell('me', wrapPanel());
            return;
        }

        if (tab === 'appraise') {
            panelTitle = '小唤 AI 好物估价';
            panelSub = '结合移通校园历史成交价，智能测算闲置参考区间';
            panelActions = '<a class="btn btn-ghost btn-sm" href="#/appraise">全屏估价台 ›</a>';
            bodyHtml = '<div class="jd-sub-ai-wrap">'
                + '<form class="estimate-form ai-form-body" data-form="estimate">'
                + '<div class="ai-input-row">'
                + '<div class="ai-field"><label class="label" for="estimate-title">物品名称</label><input class="input" id="estimate-title" name="title" placeholder="例如 罗技 GPW 二代 / 同济高数第七版"></div>'
                + '<div class="ai-field"><label class="label" for="estimate-price">入手原价（元）*</label><input class="input" id="estimate-price" name="price" type="number" min="1" max="100000" placeholder="¥ 请输入入手价，如 299" required></div>'
                + '</div>'
                + '<input type="hidden" id="ai-cat-input" name="category" value="数码">'
                + '<input type="hidden" id="estimate-condition" name="condition" value="light">'
                + '<div class="ai-chip-section"><span class="ai-sec-label">所属分类</span><div class="ai-chip-grid">'
                + CATS.map(function (c, i) { return '<button type="button" class="ai-chip ' + (i === 1 ? 'on' : '') + '" onclick="this.parentElement.querySelectorAll(\'.ai-chip\').forEach(function(b){b.classList.remove(\'on\')});this.classList.add(\'on\');document.getElementById(\'ai-cat-input\').value=\'' + esc(c) + '\'">' + esc(c) + '</button>'; }).join('')
                + '</div></div>'
                + '<div class="ai-chip-section"><span class="ai-sec-label">新旧成色</span><div class="ai-chip-grid cond-grid">'
                + [['new', '全新', '90%~95%'], ['light', '九成新', '65%~80%'], ['seven', '七成新', '45%~65%'], ['used', '有使用痕迹', '25%~45%']].map(function (c, i) {
                    return '<button type="button" class="ai-chip ' + (i === 1 ? 'on' : '') + '" onclick="this.parentElement.querySelectorAll(\'.ai-chip\').forEach(function(b){b.classList.remove(\'on\')});this.classList.add(\'on\');document.getElementById(\'estimate-condition\').value=\'' + c[0] + '\'"><b>' + c[1] + '</b><small>' + c[2] + '</small></button>';
                }).join('')
                + '</div></div>'
                + '<div class="ai-submit-row"><button class="btn btn-primary ai-submit-btn" type="submit">' + clayIcon('ai', 'AI', 'is-sm') + ' 立即开始 AI 智能估价</button></div>'
                + '<div id="ai-mascot-Evaluating" class="ai-evaluating-box" hidden><img src="/assets/brand/mascot-search.png" alt="小唤正在估价中" class="ai-eval-mascot"><div><b>小唤正在为您估价…</b></div></div>'
                + '<div id="estimate-result" class="ai-result-panel" role="status"><div class="ai-result-placeholder"><img src="/assets/brand/mascot-wave-320.webp" alt="小唤"><div><b>输入入手原价后点击上方按钮，“小唤”立即给出参考价</b></div></div></div>'
                + '</form>'
                + '</div>';
            $('#app').innerHTML = shell('me', wrapPanel());
            return;
        }

        if (tab === 'vouchers') {
            panelTitle = '三方换物凭证';
            panelSub = '校内面交核验码与多方闭环交易电子存证';
            panelActions = '<a class="btn btn-primary btn-sm" href="#/relay">发起新接力 ›</a>';
            var exList = await api('/exchange/mine').catch(function () { return []; });
            var realVouchers = (exList || []).map(function (e) {
                return '<div class="jd-voucher-card"><div class="jd-v-head"><b>存证编号 #HQ-EX-' + (200000 + Number(e.id || 0)) + '</b><span class="tag success">' + esc(e.statusText || '担保生效中') + '</span></div>'
                    + '<p>' + (e.type === 3 ? '三方闭环接力换物凭证' : '一对一校园面交凭证') + ' | 约定点位：' + esc(e.place || '北山书院一楼大厅') + '</p>'
                    + '<div class="jd-v-foot"><span>核验码：<b>YT-' + String(1000 + Number(e.id || 77) * 13).slice(-4) + '</b></span><a href="#/exchange/' + Number(e.id) + '" class="btn btn-sm btn-ghost">查看履约详情 ›</a></div></div>';
            }).join('');
            var demoVoucher = '<div class="jd-voucher-card is-demo"><div class="jd-v-head"><b>三方闭环示范凭证 #HQ-RING-809</b><span class="tag brand">已完成交接</span></div>'
                + '<p>罗技 GPW 二代无线鼠标 ➔ 张宇考研高数笔记 ➔ 拍立得相机礼盒（A→B→C 同城三方免差价闭环）</p>'
                + '<div class="jd-v-foot"><span>核验书院：图书馆一楼大厅</span><a href="#/relay" class="btn btn-sm btn-primary">去参与三方接力</a></div></div>';
            bodyHtml = '<div class="jd-sub-cards">' + (realVouchers || '') + demoVoucher + '</div>';
            $('#app').innerHTML = shell('me', wrapPanel());
            return;
        }

        if (tab === 'quota') {
            panelTitle = '闲置上架额度';
            panelSub = '校园信用分越高，可同时在架展示的闲置席位越多';
            panelActions = '<a class="btn btn-primary btn-sm" href="#/publish">+ 发布新闲置</a>';
            var myItems = await api('/item/mine').catch(function () { return []; });
            var activeCount = (myItems || []).filter(function (i) { return i.status === 1; }).length;
            var maxSlots = (me.credit || 80) >= 90 ? 15 : (me.credit || 80) >= 80 ? 10 : 6;
            var pct = Math.min(100, Math.round((activeCount / maxSlots) * 100));
            bodyHtml = '<div class="jd-quota-hero">'
                + '<div><b>当前已使用在架额度：<em>' + activeCount + '</em> / ' + maxSlots + ' 件</b><p>当前信用等级：' + esc(creditLevelOf(me.credit).text) + '（' + (me.credit || 80) + '分），完成面交与评价可解锁至最高 15 件席位</p></div>'
                + '<div class="jd-quota-bar"><i style="width:' + pct + '%"></i></div>'
                + '</div>'
                + '<div class="jd-sub-block"><h3>我的上架记录 (' + (myItems || []).length + ')</h3><div class="desk-grid-2">'
                + ((myItems || []).length ? myItems.map(function (it) {
                    return '<div class="card card-pad" style="display:flex;gap:12px;align-items:center">' + thumb(it)
                        + '<div style="flex:1;min-width:0"><p class="item-title">' + esc(it.title) + '</p><div class="item-foot"><span class="tag ghost">' + esc(it.statusText) + '</span></div></div>'
                        + (it.status === 1 ? '<button class="btn btn-sm btn-ghost" data-act="toggle-item" data-id="' + it.id + '" data-status="4">下架</button>'
                            : '<button class="btn btn-sm btn-primary" data-act="go" data-to="#/item/' + it.id + '">查看</button>')
                        + '</div>';
                }).join('') : '<p class="hint">暂无上架商品，点击右上角发布第一件闲置好物吧。</p>')
                + '</div></div>';
            $('#app').innerHTML = shell('me', wrapPanel());
            return;
        }

        if (tab === 'credit') {
            panelTitle = '校园信用分';
            panelSub = '重庆移通学院校内真实履约信用档案';
            panelActions = '<a class="btn btn-ghost btn-sm" href="#/me/quota">查看额度权益 ›</a>';
            var score = Number(me.credit || 80);
            var lvl = creditLevelOf(score);
            bodyHtml = '<div class="jd-credit-hero">'
                + '<div class="jd-credit-dial"><img src="/assets/amz/mascot-credit-card.png" alt="小唤"><div><strong>' + score + '</strong><span>信用等级：' + esc(lvl.text) + '</span></div></div>'
                + '<div class="jd-credit-perks">'
                + '<div>' + clayIcon('swap', '免押') + '<b>校内免押面交</b><small>双方实名学号信用担保</small></div>'
                + '<div>' + clayIcon('auction', '拍卖') + '<b>1元拍卖免门槛</b><small>信誉良好直接参与出价</small></div>'
                + '<div>' + clayIcon('wallet', '额度') + '<b>最高 ' + (score >= 90 ? 15 : 10) + ' 件上架席位</b><small>优质物主优先曝光推荐</small></div>'
                + '</div></div>'
                + '<div class="jd-sub-block"><h3>信用分加减明细规则</h3><div class="jd-credit-rules-grid">'
                + '<div class="jd-rule-box"><b>完成 1 次校内换物面交</b><span>+3 分</span></div>'
                + '<div class="jd-rule-box"><b>获得同学 5 星好评晒单</b><span>+2 分</span></div>'
                + '<div class="jd-rule-box"><b>完成学校官方邮箱认证</b><span>+5 分</span></div>'
                + '<div class="jd-rule-box is-warn"><b>爽约未面交或恶意出价</b><span>-10 分</span></div>'
                + '</div></div>';
            $('#app').innerHTML = shell('me', wrapPanel());
            return;
        }

        if (tab === 'campus-auctions') {
            panelTitle = '校园拍卖';
            panelSub = '热门校园1元起拍与毕业清仓专场（在个人中心内快速出价）';
            panelActions = '<a class="btn btn-primary btn-sm" href="#/auction/new">+ 发起拍卖</a><a class="btn btn-ghost btn-sm" href="#/auctions">全屏拍卖大厅 ›</a>';
            var aucRes = await api('/auction', {optionalAuth: true}).catch(function () { return []; });
            var aList = (Array.isArray(aucRes) ? aucRes : (aucRes && aucRes.list) || []).concat(DEMO_AUCTIONS);
            bodyHtml = '<div class="ali-auction-grid jd-sub-grid">' + aList.slice(0, 8).map(function (a) { return auctionCard(a, 'public'); }).join('') + '</div>';
            $('#app').innerHTML = shell('me', wrapPanel());
            return;
        }

        if (tab === 'relay') {
            panelTitle = '换物接力大厅';
            panelSub = '三方 A→B→C 智能匹配成环，换出你真正想要的好物';
            panelActions = '<a class="btn btn-primary btn-sm" href="#/publish">+ 发布接力闲置</a><a class="btn btn-ghost btn-sm" href="#/relay">全屏接力广场 ›</a>';
            var relayMine = (await api('/item/mine?status=1').catch(function () { return []; })).filter(function (i) { return i.allowCycle; });
            var rHtml = relayMine.map(function (it) {
                return relayCard({id: it.id, isDemo: false, state: 'active', title: it.title, want: it.wantCategory || '任意好物', image: firstImage(it.images) || '/assets/amz/quad-relay.jpg'});
            }).concat(DEMO_RELAYS.slice(0, 8).map(relayCard)).join('');
            bodyHtml = '<div class="relay-eco-grid jd-sub-4col">' + rHtml + '</div>';
            $('#app').innerHTML = shell('me', wrapPanel());
            return;
        }

        if (tab === 'arcade') {
            panelTitle = 'Scrap Arena 街机';
            panelSub = '移通同学双人同屏格斗休闲区 | 换物间隙松一口气';
            panelActions = '<a class="btn btn-primary btn-sm" href="/scrap-arena/index.html" target="_blank" rel="noopener">新窗口全屏</a><a class="btn btn-ghost btn-sm" href="#/community/game">全屏街机房 ›</a>';
            bodyHtml = '<div class="game-frame-wrap jd-arcade-embed"><iframe class="game-frame" src="/scrap-arena/index.html" title="Scrap Arena 游戏" allow="fullscreen; autoplay"></iframe></div>'
                + '<p class="game-note" style="margin-top:10px">操作提示：点击画面开始，P1：W/A/S/D + J/K/L；P2：方向键 + 1/2/3；按 Enter 开战。</p>';
            $('#app').innerHTML = shell('me', wrapPanel());
            return;
        }

        if (tab === 'security') {
            panelTitle = '个人信息与安全';
            panelSub = '学号实名档案、校园邮箱绑定与个性化主题配置';
            panelActions = '<a class="btn btn-ghost btn-sm" href="#/settings">更多偏好设置 ›</a>';
            var emailData = await api('/user/email').catch(function () { return {}; });
            bodyHtml = '<div class="jd-security-grid">'
                + '<form class="card card-pad" data-form="profile"><h3>基本资料</h3>'
                + '<div class="field"><label class="label">昵称</label><input class="input" name="nickname" maxlength="20" value="' + esc(me.nickname || '') + '" required></div>'
                + '<div class="field"><label class="label">学院</label><input class="input" name="college" maxlength="40" value="' + esc(me.college || '') + '" placeholder="如 大数据与软件学院"></div>'
                + '<div class="field"><label class="label">常驻书院/宿舍</label><input class="input" name="building" maxlength="30" value="' + esc(me.building || '') + '" placeholder="如 北山书院 / 松格"></div>'
                + '<button type="submit" class="btn btn-primary btn-sm">保存资料</button></form>'
                + '<div class="card card-pad"><h3>账号安全与邮箱认证</h3>'
                + '<p class="hint">登录学号：<b>' + esc(me.studentNo || '已认证同学') + '</b> | 邮箱状态：' + (emailData.email ? '<span class="tag success">已认证：' + esc(emailData.email) + '</span>' : '<span class="tag accent">待认证</span>') + '</p>'
                + (emailData.available
                    ? '<form data-form="email-send" style="margin-bottom:10px"><div class="field"><label class="label">绑定邮箱</label><input class="input" name="email" type="email" placeholder="name@example.com" required></div><button class="btn btn-sm btn-ghost" type="submit">发送验证码</button></form>'
                      + '<form data-form="email-verify"><div class="field"><label class="label">6位验证码</label><input class="input" name="code" maxlength="6" placeholder="输入邮件中的6位数字" required></div><button class="btn btn-sm btn-primary" type="submit">完成认证</button></form>'
                    : '<p class="hint">校内邮箱验证通道由管理员统一配置，当前学号登录已受本地加密凭证保护。</p>')
                + '<div style="margin-top:16px;padding-top:12px;border-top:1px solid #EEE;display:flex;gap:10px"><a href="#/settings" class="btn btn-sm btn-ghost">切换主题色</a><button type="button" class="btn btn-sm btn-ghost" data-act="logout">退出当前账号</button></div>'
                + '</div></div>';
            $('#app').innerHTML = shell('me', wrapPanel());
            return;
        }

        // default / notices
        panelTitle = '消息通知中心';
        panelSub = '报价提醒、面交变动与私聊会话同步预览';
        panelActions = '<button type="button" class="btn btn-ghost btn-sm" data-act="notice-read">全部标为已读</button><a class="btn btn-primary btn-sm" href="#/notifications">打开聊天窗口 ›</a>';
        var nRes = await Promise.all([
            api('/notification').catch(function () { return []; }),
            api('/conversation').catch(function () { return []; })
        ]);
        var noticeList = nRes[0] || [], convList = nRes[1] || [];
        bodyHtml = '<div class="jd-sub-block"><h3>系统与交易通知 (' + noticeList.length + ')</h3><div class="notice-list">'
            + (noticeList.length ? noticeList.map(function (n) {
                var target = n.target || '#/notifications';
                return '<a class="notice-row ' + (n.read ? '' : 'is-unread') + '" href="' + esc(target) + '" data-act="notice-open" data-id="' + n.id + '" data-to="' + esc(target) + '"><span class="notice-dot"></span><div class="notice-body"><b>' + esc(n.title) + '</b><span>' + esc(n.content) + '</span></div><time>' + esc(String(n.createdAt || '').slice(0, 16)) + '</time></a>';
            }).join('') : '<p class="hint">暂无未读系统通知，可在上方打开聊天窗口查看同学留言。</p>')
            + '</div></div>'
            + '<div class="jd-sub-block"><h3>最近私聊会话 (' + convList.length + ')</h3><div class="conversation-list">' + conversationRows(convList) + '</div></div>';
        $('#app').innerHTML = shell('me', wrapPanel());
    }

    var DEMO_AUCTIONS = [
        {id: 901, cat: '数码', isDemo: true, state: 'active', title: '【北山斋当面验货】罗技 G Pro X Superlight 无线鼠标 白色95新 盒说配件全', description: '大三换新鼠标出手，微动清脆无双击，续航两周以上，北山书院一楼大厅随时面交。', currentPrice: 265, marketPrice: 499, endsAt: '2026-11-18 21:00', seller: '北山电竞阿泽', bidCount: 18, views: 1840, bidder: '松格小陈', campus: '北山书院', stage: '一拍', image: '/assets/amz/quad-digital.jpg'},
        {id: 902, cat: '教材', isDemo: true, state: 'active', title: '【考研上岸出】2026考研数学张宇1000题+同济高数第七版上下册+全套手写笔记', description: '成功上岸重庆理工，书本干净字迹工整，附赠英一真题黄皮书。', currentPrice: 38, marketPrice: 128, endsAt: '2026-11-17 19:30', seller: '南山学姐小林', bidCount: 11, views: 1320, bidder: '竹逸阿杰', campus: '南山书院', stage: '一拍', image: '/assets/amz/quad-books.jpg'},
        {id: 903, cat: '数码', isDemo: true, state: 'active', title: '【毕业急出】富士 Instax mini11 拍立得相机 冰晶白 含半盒相纸与透明保护壳', description: '社团活动抽奖所得，仅拍过两盒相纸，镜头无划痕，支持校内试拍验机。', currentPrice: 290, marketPrice: 520, endsAt: '2026-11-19 20:00', seller: '菊轩摄影社糖糖', bidCount: 24, views: 2690, bidder: '梅若小鹿', campus: '菊轩书院', stage: '变卖', image: '/assets/amz/quad-auction.jpg'},
        {id: 904, cat: '生活', isDemo: true, state: 'active', title: '【宿舍神器】米家智能LED长臂护眼台灯 1S 支持米家App调光 宿舍不断电可用', description: '灯光柔和不刺眼，底座稳固，送Type-C转接线，松格书院楼下自提。', currentPrice: 52, marketPrice: 149, endsAt: '2026-11-16 22:00', seller: '松格机电老王', bidCount: 9, views: 980, bidder: '爱莲小周', campus: '松格书院', stage: '一拍', image: '/assets/amz/quad-dorm.jpg'},
        {id: 905, cat: '运动', isDemo: true, state: 'active', title: '【球场实战】斯伯丁 Spalding 7号PU吸湿防滑篮球 + 尤尼克斯羽毛球拍双拍包', description: '大四实习没空打球，球胆不漏气，球拍已拉24磅BG65线，送两筒耐打王。', currentPrice: 88, marketPrice: 230, endsAt: '2026-11-18 18:00', seller: '风雨球场科比', bidCount: 15, views: 1510, bidder: '北山体育生', campus: '北山书院', stage: '一拍', image: '/assets/amz/quad-sports.jpg'},
        {id: 906, cat: '教材', isDemo: true, state: 'active', title: '【学长毕业礼包】九成新卡西欧 fx-991CN X 中文函数计算器 + 工程制图尺规全套', description: '工科期末考试必备神器，考场合规型号，太阳能+电池双供电，字迹清晰。', currentPrice: 46, marketPrice: 135, endsAt: '2026-11-20 12:00', seller: '智能工程学院学长', bidCount: 13, views: 1190, bidder: '大一萌新', campus: '南山书院', stage: '一拍', image: '/assets/amz/quad-grad.jpg'},
        {id: 907, cat: '数码', isDemo: true, state: 'active', title: '【满电秒发】漫步者 W820NB 双金标主动降噪头戴式蓝牙耳机 云岩白 图书馆神器', description: '耳罩柔软不夹头，开启深度降噪在图书馆背书超安静，充一次电用一周。', currentPrice: 135, marketPrice: 299, endsAt: '2026-11-19 21:30', seller: '图书馆常驻选手', bidCount: 21, views: 2150, bidder: '竹逸小吴', campus: '图书馆大厅', stage: '二拍', image: '/assets/amz/quad-appraise.jpg'},
        {id: 908, cat: '其他', isDemo: true, state: 'active', title: '【支持换物抵扣】复古火漆印章礼盒 + 手账胶带钢笔套装 生日伴手礼盒全新未拆', description: '多买了一套送室友，包装丝带完好，可直接竞拍也可拿课外小说等价抵扣。', currentPrice: 29, marketPrice: 89, endsAt: '2026-11-17 20:00', seller: '爱莲手作铺', bidCount: 7, views: 760, bidder: '菊轩小晴', campus: '爱莲书院', stage: '一拍', image: '/assets/amz/quad-wishes.jpg'},
        {id: 909, cat: '数码', isDemo: true, state: 'settled', selectedAmount: 160, winner: '南山书院阿伟', title: '【已成交示范】Keychron K2 无线蓝牙双模机械键盘 茶轴RGB背光 Mac/Win双系统键帽', description: '茶轴手感柔和不吵室友，支持三台设备一键切换，已完成图书馆一楼当面交接。', currentPrice: 160, marketPrice: 368, endsAt: '2026-11-14 20:00', seller: '大数据学院极客', bidCount: 19, views: 2430, bidder: '南山书院阿伟', campus: '图书馆大厅', stage: '一拍', image: '/assets/amz/quad-swap.jpg'},
        {id: 910, cat: '生活', isDemo: true, state: 'active', title: '【宿舍收纳整箱】宜家感牛津布衣物收纳箱×2 + 桌面书立架 + 寝室门后挂钩套装', description: '换宿舍整理出的全新闲置，打包1元起拍，支持北山斋至南山书院顺路送达。', currentPrice: 19, marketPrice: 75, endsAt: '2026-11-18 22:30', seller: '北山收纳达人', bidCount: 14, views: 1080, bidder: '梅若小张', campus: '北山书院', stage: '变卖', image: '/assets/amz/quad-delivery.jpg'}
    ];

    function auctionCard(a, mode) {
        var labels={active:'正在进行',cancelled:'已撤回',pending:'待审核',rejected:'审核未通过',settled:'已成交',ended:a.bidCount ? '待结算' : '已流拍'};
        var fallbackImgs=['/assets/amz/quad-auction.jpg','/assets/amz/quad-digital.jpg','/assets/amz/quad-books.jpg','/assets/amz/quad-dorm.jpg','/assets/amz/quad-sports.jpg'];
        var image=firstImage(a.image) || fallbackImgs[Math.abs(Number(a.id || 0)) % fallbackImgs.length];
        var priceVal = a.state==='settled'&&(a.selectedAmount||a.currentPrice)?(a.selectedAmount||a.currentPrice):a.currentPrice;
        var actHtml = '';
        if (mode==='admin'&&a.state==='pending') {
            actHtml = '<button class="clean-act-btn is-red" data-act="review-listing" data-kind="auctions" data-do="approve" data-id="'+a.id+'">通过</button>';
        } else if (mode==='mine'&&(a.state==='active'||a.state==='ended')&&a.bidCount&&!a.isDemo) {
            actHtml = '<button class="clean-act-btn is-red" data-act="auction-bids" data-id="'+a.id+'">结算</button>';
        } else if (mode==='public'&&a.state==='active') {
            actHtml = a.isDemo
                ? '<button class="clean-act-btn is-red" data-act="go" data-to="#/auction/new">竞拍</button>'
                : '<button class="clean-act-btn is-red" data-act="auction-bid" data-id="'+a.id+'">出价</button>';
        } else if (a.state!=='active') {
            actHtml = '<button class="clean-act-btn is-muted" data-act="go" data-to="#/idle">看同类</button>';
        }
        return '<article class="ali-auction-card">'
            + '<div class="clean-card-media">'
            + '<img src="'+esc(image)+'" onerror="this.onerror=null;this.src=\'/assets/amz/quad-auction.jpg\'" alt="'+esc(a.title)+'" loading="lazy" decoding="async">'
            + (a.state!=='active'?'<span class="clean-state-tag is-done">'+esc(labels[a.state] || '已结束')+'</span>':'')
            + '</div>'
            + '<div class="clean-card-body">'
            + '<h2 class="clean-card-title" title="'+esc(a.title)+'">'+esc(a.title)+'</h2>'
            + '<div class="clean-card-meta-row">'
            + '<span class="amz-price"><em>¥</em><b>'+esc(priceVal)+'</b></span>'
            + actHtml
            + '</div>'
            + '</div>'
            + '</article>';
    }

    async function renderAuctions(mine) {
        $('#app').innerHTML=shell('auctions',loading());
        var auctions=[];
        var loadError='';
        try {
            var res=await api(mine?'/auction/mine':'/auction', { optionalAuth: !mine });
            auctions=Array.isArray(res)?res:(res&&Array.isArray(res.list)?res.list:[]);
        } catch (e) {
            if (mine && e && e.code === 401) {
                sessionStorage.setItem('hq.returnTo', '#/auction/mine');
                go('#/login');
                return;
            }
            loadError=(e && e.message) || '';
        }
        var rawList = mine ? auctions : auctions.concat(DEMO_AUCTIONS);
        var aCat = state.auctionCat || '全部';
        var aSt = state.auctionState || '全部';
        var aSort = state.auctionSort || 'default';
        var displayList = rawList.filter(function (a) {
            if (aCat !== '全部') {
                var hitCat = a.cat === aCat || String(a.title + ' ' + (a.description || '')).indexOf(aCat) >= 0;
                if (!hitCat) return false;
            }
            if (aSt === '正在进行' && a.state !== 'active') return false;
            if (aSt === '一拍专场' && a.stage !== '一拍') return false;
            if (aSt === '毕业变卖' && a.stage !== '变卖' && String(a.title).indexOf('毕业') < 0) return false;
            return true;
        }).slice();
        if (aSort === 'price-asc') displayList.sort(function (a, b) { return Number(a.currentPrice || 0) - Number(b.currentPrice || 0); });
        else if (aSort === 'price-desc') displayList.sort(function (a, b) { return Number(b.currentPrice || 0) - Number(a.currentPrice || 0); });
        else if (aSort === 'bids') displayList.sort(function (a, b) { return Number(b.bidCount || 0) - Number(a.bidCount || 0); });

        var content = '<div class="ali-auction-page">'
            + '<header class="ali-sub-header">'
            + '<div class="ali-sub-brand">'
            + '<span class="ali-brand-main">校园拍卖专场</span>'
            + '</div>'
            + '<nav class="ali-sub-nav" aria-label="拍卖导航">'
            + '<a href="#/auctions" class="' + (!mine ? 'on' : '') + '">全部拍品</a>'
            + '<button type="button" data-act="auction-cat" data-v="数码" class="' + (aCat === '数码' ? 'on' : '') + '">数码外设</button>'
            + '<button type="button" data-act="auction-cat" data-v="教材" class="' + (aCat === '教材' ? 'on' : '') + '">考研教材</button>'
            + '<a href="#/auction/mine" class="' + (mine ? 'on' : '') + '">我的拍卖</a>'
            + '</nav>'
            + '<div class="ali-sub-actions">'
            + '<a class="btn btn-ghost btn-sm" href="' + (mine ? '#/auctions' : '#/auction/mine') + '">' + (mine ? '返回大厅' : '我的拍卖') + '</a>'
            + '<a class="btn btn-primary btn-sm" href="#/auction/new">+ 发起拍卖</a>'
            + '</div>'
            + '</header>'

            + '<section class="ali-filter-box" aria-label="拍品筛选">'
            + '<div class="ali-filter-row"><span class="ali-filter-k">分类：</span><div class="ali-filter-v">'
            + [['全部', '全部'], ['数码', '电脑数码'], ['教材', '考研教材'], ['生活', '宿舍生活'], ['运动', '运动户外'], ['其他', '手办周边']].map(function (c) {
                return '<button type="button" class="' + (aCat === c[0] ? 'on' : '') + '" data-act="auction-cat" data-v="' + c[0] + '">' + c[1] + '</button>';
            }).join('')
            + '</div></div>'
            + '<div class="ali-filter-row"><span class="ali-filter-k">状态：</span><div class="ali-filter-v">'
            + [['全部', '全部 (' + rawList.length + ')'], ['正在进行', '正在进行'], ['一拍专场', '一拍专场'], ['毕业变卖', '毕业变卖']].map(function (s) {
                return '<button type="button" class="' + (aSt === s[0] ? 'on' : '') + '" data-act="auction-state" data-v="' + s[0] + '">' + s[1] + '</button>';
            }).join('')
            + '</div></div>'
            + '</section>'

            + '<div class="ali-sort-toolbar">'
            + '<div class="ali-sort-links">'
            + '<button type="button" class="' + (aSort === 'default' ? 'on' : '') + '" data-act="auction-sort" data-v="default">默认排序</button>'
            + '<button type="button" class="' + (aSort === 'price-asc' || aSort === 'price-desc' ? 'on' : '') + '" data-act="auction-sort" data-v="' + (aSort === 'price-desc' ? 'price-asc' : 'price-desc') + '">当前价 ' + (aSort === 'price-asc' ? '▴' : '▾') + '</button>'
            + '<button type="button" class="' + (aSort === 'bids' ? 'on' : '') + '" data-act="auction-sort" data-v="bids">出价次数 ▾</button>'
            + '<img src="/assets/brand/mascot-success.png" alt="小唤" class="ali-toolbar-mascot">'
            + '</div>'
            + '<span class="hint">当前展示 ' + displayList.length + ' 件拍品</span>'
            + '</div>'

            + (loadError && mine ? '<div class="card card-pad"><p>' + esc(loadError) + '</p></div>' : '')
            + (displayList.length
                ? '<div class="ali-auction-grid">' + displayList.map(function (a) { return auctionCard(a, mine ? 'mine' : 'public'); }).join('') + '</div>'
                : '<div class="card card-pad"><p>暂无符合筛选条件的拍品 <button type="button" class="btn btn-sm btn-primary" data-act="auction-reset">重置筛选</button></p></div>')
            + '</div>';
        $('#app').innerHTML=shell('auctions',content);
    }
    function renderAuctionNew() {
        state.publishImages=[];
        $('#app').innerHTML=shell('auctions','<nav class="amz-breadcrumb" aria-label="面包屑"><a href="#/home">首页</a><span>›</span><a href="#/auctions">校园拍卖</a><span>›</span><b>发起拍卖</b></nav><div class="auction-form amz-form-layout"><div class="page-head"><h1>发起校园拍卖</h1><p>提交后由管理员审核，5 分钟未处理将自动通过，通过后开始计时。</p></div><div class="amz-form-grid"><form class="card card-pad" data-form="auction-new"><div class="field"><label class="label">拍品名称</label><input class="input" name="title" maxlength="80" placeholder="例如 九成新机械键盘 / 拍立得相机" required></div><div class="field"><label class="label">拍品描述</label><textarea class="textarea" name="description" maxlength="500" placeholder="说明成色、配件、校内面交地点等"></textarea></div><div class="field"><label class="label">图片（必填，最多 3 张）</label><div class="chips" id="img-preview"></div></div><div class="field"><label class="label">起拍价（元）</label><input class="input" name="amount" type="number" min="0.01" max="1000000" step="0.01" required></div><div class="field"><label class="label">拍卖时长（小时，1–168）</label><input class="input" name="hours" type="number" value="24" min="1" max="168" required></div><button class="btn btn-primary btn-block" type="submit">提交审核并上架</button></form><aside class="card card-pad amz-form-aside"><img src="/assets/brand/mascot-box.png" width="76" height="76" alt=""><h3>拍卖上架须知</h3><ul><li>首张图片将作为拍卖专场封面展示。</li><li>提交后 5 分钟内未审核将自动通过上架。</li><li>竞拍结束后请在「我的拍卖」中确认结算。</li></ul></aside></div></div>');
        renderImagePreview();
    }

    var noticeTracker = { token:'', latest:0, count:0, initialized:false, request:0, pending:0, timer:null };
    function closeNoticePopup() {
        if (noticeTracker.timer) clearTimeout(noticeTracker.timer);
        noticeTracker.timer=null; var popup=document.getElementById('notice-popup'); if(popup)popup.remove();
    }
    function positionNoticePopup() {
        var popup=document.getElementById('notice-popup'), anchor=document.querySelector('.appbar .notice-link');
        if(!popup)return;
        if(window.innerWidth < 900) { popup.style.removeProperty('right');popup.style.removeProperty('top');return; }
        if(anchor) { var r=anchor.getBoundingClientRect(); popup.style.right=Math.max(12,window.innerWidth-r.right-12)+'px'; popup.style.top=Math.max(12,r.bottom+14)+'px'; }
    }
    function showNoticePopup(count, notice) {
        if(!count || location.hash==='#/notifications')return;
        if(document.hidden || !document.querySelector('.appbar .notice-link')) { noticeTracker.pending=count;noticeTracker.pendingNotice=notice;return; }
        noticeTracker.pending=0;closeNoticePopup();
        var popup=document.createElement('div');popup.id='notice-popup';popup.className='notice-popup';popup.setAttribute('role','status');popup.setAttribute('aria-live','polite');
        popup.innerHTML='<span class="notice-popup-icon" aria-hidden="true">'+navIcon('notice')+'</span><div class="notice-popup-content"><strong>您有 '+count+' 条未读消息</strong><span>有新动态，记得查收。</span><a href="#/notifications">查看消息 '+navIcon('arrow')+'</a></div><button type="button" class="notice-popup-close" aria-label="关闭消息提醒">'+navIcon('close')+'</button>';
        if(notice && notice.target==='#/followers'){
            popup.querySelector('strong').textContent=notice.title;
            popup.querySelector('.notice-popup-content > span').textContent=notice.content;
            popup.querySelector('a').href='#/followers';
        }
        document.body.appendChild(popup);positionNoticePopup();
        popup.querySelector('button').addEventListener('click',closeNoticePopup);
        popup.querySelector('a').addEventListener('click',function(){
            if(notice && notice.target==='#/followers'){
                api('/notification/'+Number(notice.id)+'/read',{method:'POST'}).then(refreshNoticeCount).catch(function(){});
            }
            closeNoticePopup();
        });
        noticeTracker.timer=setTimeout(closeNoticePopup,8000);
    }
    async function refreshNoticeCount() {
        var token=readToken();
        if(token!==noticeTracker.token){noticeTracker.token=token;noticeTracker.latest=0;noticeTracker.count=0;noticeTracker.initialized=false;noticeTracker.pending=0;closeNoticePopup();}
        if(!token)return;
        var request=++noticeTracker.request;
        try {
            var response=await fetch(BASE+'/api/notification/unread',{credentials:'include',headers:{'X-Token':token}});if(!response.ok)return;
            var payload=await response.json();if(payload.code!==0)return;var n=Math.max(0,Number(payload.data.count)||0),latest=0,latestNotice=null;
            if(n){try{var listResponse=await fetch(BASE+'/api/notification',{credentials:'include',headers:{'X-Token':token}});if(listResponse.ok){var listPayload=await listResponse.json();if(listPayload.code===0&&Array.isArray(listPayload.data)){listPayload.data.forEach(function(item){if(!item.read && Number(item.id)>latest){latest=Number(item.id);latestNotice=item;}});}}}catch(ignore){}}
            if(request!==noticeTracker.request || readToken()!==token)return;
            document.querySelectorAll('.notice-count').forEach(function(el){el.textContent=n>99?'99+':String(n);el.hidden=n===0;el.setAttribute('aria-label',n+' 条未读消息');});document.title=(n?'('+n+') ':'')+'换一圈 | 重庆移通学院校园换物';
            var isNew=n>0&&(!noticeTracker.initialized||(latest>noticeTracker.latest)||(latest===0&&n>noticeTracker.count));
            noticeTracker.initialized=true;noticeTracker.count=n;noticeTracker.latest=Math.max(noticeTracker.latest,latest);
            if(!n){noticeTracker.pending=0;closeNoticePopup();}else if(isNew || noticeTracker.pending)showNoticePopup(n,latestNotice || noticeTracker.pendingNotice);
        }catch(e){ /* 提醒服务暂时不可用时保留页面状态 */ }
    }
    window.addEventListener('resize',positionNoticePopup);
    window.addEventListener('scroll',positionNoticePopup,{passive:true});
    document.addEventListener('visibilitychange',function(){if(!document.hidden&&noticeTracker.pending)showNoticePopup(noticeTracker.pending,noticeTracker.pendingNotice);});
    async function renderFollowers() {
        var users = await api('/social/followers');
        if(currentView.name!=='followers')return;
        var rows=users.map(function(u){return '<a class="notice-row" href="#/user/'+Number(u.id)+'"><span class="notice-body"><b>'+esc(u.nickname)+'</b><span>'+esc(u.college || '重庆移通学院')+'</span></span></a>';}).join('');
        $('#app').innerHTML=shell('me','<section class="redesign-page"><header class="redesign-heading"><h1>谁关注了我</h1></header><div class="notice-list">'+(rows||'<p class="hint">还没有同学关注你。</p>')+'</div></section>');
    }

    async function renderNotifications() {
        var notices = await api('/notification').catch(function () { return []; });
        var conversations = await api('/conversation').catch(function () { return []; });
        if (currentView.name !== 'notifications') return;

        var realNoticeRows = (notices || []).map(function (n) {
            var target = /^#\/(offers|exchange(?:\/\d+)?|wishes(?:\/\d+)?|auctions|auction\/mine|chat\/\d+|followers|cycle\/\d+|item\/\d+)$/.test(n.target) ? n.target : '#/notifications';
            return '<a class="notice-row tb-notice-card ' + (n.read ? '' : 'is-unread') + '" href="' + esc(target) + '" data-act="notice-open" data-id="' + n.id + '" data-to="' + esc(target) + '">'
                + '<span class="notice-dot"></span>'
                + '<div class="notice-body"><b>' + esc(n.title) + '</b><span>' + esc(n.content) + '</span></div>'
                + '<time>' + esc(String(n.createdAt || '').replace('T', ' ').slice(0, 16)) + '</time>'
                + '</a>';
        }).join('');

        var realConvRows = (conversations || []).map(function (c) {
            return '<a class="conversation-row tb-contact-item" href="#/chat/' + c.id + '">'
                + '<span class="tb-contact-ava tone-emerald">' + esc((c.peer || '同').slice(0, 1)) + '</span>'
                + '<div class="tb-contact-meta"><div class="tb-contact-top"><b>' + esc(c.peer) + '</b><time>刚刚</time></div><p>' + esc(c.lastText || c.title || '点击进入私聊会话') + '</p></div>'
                + '</a>';
        }).join('');

        var IM_SEED_THREADS = [
            {
                ava: '宏', tone: 'tone-blue', name: '北山羽毛球穿线社', date: '2026/11/15', msg: '亲，您有一笔换物报价待确认哦', unread: 1, to: '#/offers',
                credit: '96 极好', campus: '北山书院', shopImg: '/assets/amz/quad-sports.jpg', shopLink: '#/idle?cat=运动',
                card: {title: '亲，您有一笔校园换物单待确认哦', img: '/assets/amz/quad-sports.jpg', goods: '正品VICTOR威克多 胜利大鬼斩羽毛球拍 24磅', sub: '支持以物换物 / 书院当面验拍', price: '¥102.0', qty: '共1件', btn: '去确认报价', to: '#/offers'},
                msgs: [
                    '亲，您有一笔换物订单待确认面交点位，如您换的羽毛球拍已拉好24磅BG65线，北山书院一楼大厅可当场试挥验货，满意再点确认收货哦~'
                ]
            },
            {
                ava: '诺', tone: 'tone-navy', name: '一诺体育器材流转', date: '2026/11/14', msg: '请确认北山书院一楼大厅面交点位', unread: 1, to: '#/exchange',
                credit: '94 优秀', campus: '松格书院', shopImg: '/assets/amz/quad-relay.jpg', shopLink: '#/relay',
                card: {title: '亲，您有一笔三方接力环待锁定哦', img: '/assets/amz/quad-digital.jpg', goods: '罗技 GPW 二代无线鼠标 ⇄ 2026考研高数全套笔记', sub: 'A→B→C 三方闭环匹配成功', price: '等价换', qty: '共1组', btn: '去查看接力环', to: '#/relay'},
                msgs: ['下午 16:30 图书馆东门可以吗？我把球包也一起带来给你看成色。']
            },
            {
                ava: '烁', tone: 'tone-teal', name: '烁羽球拍与外设铺', date: '2026/11/13', msg: '罗技 GPW 二代已充好电随时可试', unread: 0, to: '#/idle?cat=数码',
                credit: '92 优秀', campus: '北山书院', shopImg: '/assets/amz/quad-digital.jpg', shopLink: '#/idle?cat=数码',
                card: {title: '数码外设当面验机单', img: '/assets/amz/quad-digital.jpg', goods: '罗技 GPW 二代 白色 95新 盒说全', sub: '微动清脆无双击，支持以物换物', price: '¥265.0', qty: '共1件', btn: '查看数码专区', to: '#/idle?cat=数码'},
                msgs: ['鼠标盒说接收器都在，如果你那把机械键盘也是茶轴，咱们可以直接平换！']
            },
            {
                ava: '琪', tone: 'tone-orange', name: '琪琪电竞外设学长', date: '2026/11/12', msg: '富士拍立得还能参与今晚拍卖吗', unread: 1, to: '#/auctions',
                credit: '90 优秀', campus: '菊轩书院', shopImg: '/assets/amz/quad-auction.jpg', shopLink: '#/auctions',
                card: null,
                msgs: ['今晚 20:00 拍立得专场快截拍了，我准备再加 10 元冲一下~']
            },
            {
                ava: '青', tone: 'tone-green', name: '青禾考研资料漂流', date: '2026/11/10', msg: '——免费附送同济高数期末真题笔记——', unread: 0, to: '#/idle?cat=教材',
                credit: '95 极好', campus: '南山书院', shopImg: '/assets/amz/quad-books.jpg', shopLink: '#/idle?cat=教材',
                card: null,
                msgs: ['同济高数上下册我做了一整套错题本索引，一起打包换你的小台灯行吗？']
            },
            {
                ava: '纯', tone: 'tone-pink', name: '小纯桌搭与拍立得', date: '2026/11/09', msg: '下课10分钟左右到图书馆一楼大厅交接', unread: 0, to: '#/wishes',
                credit: '89 良好', campus: '竹逸书院', shopImg: '/assets/amz/quad-dorm.jpg', shopLink: '#/wishes',
                card: null,
                msgs: ['刚下课正在赶去图书馆一楼大厅，穿白色卫衣那个就是我~']
            },
            {
                ava: '浩', tone: 'tone-red', name: '浩迪数卡与计算器', date: '2026/11/08', msg: '卡西欧 fx-991CN X 中文版考场可用', unread: 1, to: '#/appraise',
                credit: '91 优秀', campus: '北山书院', shopImg: '/assets/amz/quad-grad.jpg', shopLink: '#/idle?cat=教材',
                card: null,
                msgs: ['我用小唤 AI 估价测了下，计算器+工程制图套装大概值 50~65 元，你看看想换啥？']
            },
            {
                ava: '国', tone: 'tone-brown', name: '移通严选宿舍好物', date: '2026/11/06', msg: '米家护眼灯支持三方换物接力成环', unread: 1, to: '#/relay',
                credit: '93 优秀', campus: '爱莲书院', shopImg: '/assets/amz/quad-dorm.jpg', shopLink: '#/relay',
                card: null,
                msgs: ['系统刚刚推了一条三方接力匹配给我们，点进去就能直接锁环！']
            }
        ];
        var customIm = {};
        try { customIm = JSON.parse(localStorage.getItem('hq.imThreads') || '{}') || {}; } catch (e) { customIm = {}; }
        var readIm = {};
        try { readIm = JSON.parse(localStorage.getItem('hq.imRead') || '{}') || {}; } catch (e) { readIm = {}; }
        var activeIdx = Math.max(0, Math.min(IM_SEED_THREADS.length - 1, Number(state.activeNoticeIdx || 0)));
        var activePeer = IM_SEED_THREADS[activeIdx];
        var extraMsgs = Array.isArray(customIm[activeIdx]) ? customIm[activeIdx] : [];

        var demoContacts = IM_SEED_THREADS.map(function (c, idx) {
            var isAct = idx === activeIdx;
            var unreadCount = (isAct || readIm[idx]) ? 0 : c.unread;
            var lastCustom = Array.isArray(customIm[idx]) && customIm[idx].length ? customIm[idx][customIm[idx].length - 1].text : c.msg;
            return '<button type="button" class="conversation-row tb-contact-item ' + (isAct ? 'on' : '') + '" data-act="im-select" data-idx="' + idx + '">'
                + '<span class="tb-contact-ava ' + c.tone + '">' + c.ava + '</span>'
                + '<div class="tb-contact-meta">'
                + '<div class="tb-contact-top"><b>' + esc(c.name) + '</b><time>' + c.date + '</time></div>'
                + '<div class="tb-contact-sub"><p>' + esc(lastCustom) + '</p>' + (unreadCount ? '<em class="tb-unread-dot">' + unreadCount + '</em>' : '') + '</div>'
                + '</div></button>';
        }).join('');

        var streamItemsHtml = ''
            + (activePeer.card ? '<div class="tb-msg-group"><div class="tb-msg-sender"><img src="/assets/brand/mascot-wave-320.webp" alt=""><span>' + esc(activePeer.name) + '</span><time>' + activePeer.date + ' 15:16</time></div><div class="tb-order-card"><h4>' + esc(activePeer.card.title) + '</h4><div class="tb-order-item-box"><img src="' + activePeer.card.img + '" alt=""><div class="tb-order-item-info"><p>' + esc(activePeer.card.goods) + '</p><small>' + esc(activePeer.card.sub) + '</small></div><div class="tb-order-item-price"><b>' + esc(activePeer.card.price) + '</b><span>' + esc(activePeer.card.qty) + '</span></div></div><a href="' + activePeer.card.to + '" class="tb-order-orange-btn">' + esc(activePeer.card.btn) + '</a></div></div>' : '')
            + activePeer.msgs.map(function (mTxt, mIdx) {
                return '<div class="tb-msg-group"><div class="tb-msg-sender"><img src="/assets/brand/mascot-wave-320.webp" alt=""><span>' + esc(activePeer.name) + '</span><time>' + activePeer.date + ' 15:' + (20 + mIdx) + '</time></div><div class="tb-text-bubble">' + esc(mTxt) + '</div></div>';
            }).join('')
            + extraMsgs.map(function (m) {
                if (m.kind === 'image') {
                    return '<div class="tb-msg-group is-mine"><div class="tb-msg-sender"><span>我（' + esc((state.me && state.me.nickname) || '移通同学') + '）</span><time>' + esc(m.time || '刚刚') + '</time></div><div class="tb-text-bubble is-mine"><img class="tb-chat-img" src="' + esc(m.image) + '" alt="聊天图片"></div></div>';
                }
                if (m.kind === 'card') {
                    return '<div class="tb-msg-group is-mine"><div class="tb-msg-sender"><span>我</span><time>' + esc(m.time || '刚刚') + '</time></div><div class="tb-order-card"><h4>' + esc(m.title) + '</h4><div class="tb-order-item-box"><img src="' + esc(m.img || '/assets/amz/quad-swap.jpg') + '" alt=""><div class="tb-order-item-info"><p>' + esc(m.text) + '</p><small>' + esc(m.sub || '点击查看详情') + '</small></div></div><a href="' + esc(m.to || '#/offers') + '" class="tb-order-orange-btn">立即查看</a></div></div>';
                }
                return '<div class="tb-msg-group is-mine"><div class="tb-msg-sender"><span>我（' + esc((state.me && state.me.nickname) || '移通同学') + '）</span><time>' + esc(m.time || '刚刚') + '</time></div><div class="tb-text-bubble is-mine">' + esc(m.text) + '</div></div>';
            }).join('');

        var content = '<section class="messages-page tb-im-backdrop" aria-label="消息与聊天窗口">'
            + '<div class="tb-im-window">'
            + '<aside class="tb-im-left">'
            + '<div class="tb-left-head">'
            + '<span class="tb-left-title">' + clayIcon('chat', '聊天', 'is-sm') + ' 聊天列表</span>'
            + '<button type="button" class="tb-read-btn" data-act="notice-read">全部已读</button>'
            + '</div>'
            + '<div class="tb-left-search">'
            + '<input type="search" id="message-filter" placeholder="搜索最近联系人" aria-label="搜索消息联系人">'
            + '</div>'
            + '<div class="tb-contact-list conversation-list">'
            + realConvRows
            + demoContacts
            + '</div>'
            + '</aside>'

            + '<div class="tb-im-center">'
            + '<header class="tb-chat-header">'
            + '<div class="tb-chat-peer"><b>' + esc(activePeer.name) + '</b><span class="tb-online-tag">● 在线</span></div>'
            + '<div class="tb-chat-top-btns">'
            + '<a href="#/followers" class="tb-top-chip">谁关注了我</a>'
            + '<a href="#/offers" class="tb-top-chip">报价单中心</a>'
            + '<button type="button" class="tb-top-chip primary" data-act="notice-read">全部标为已读</button>'
            + '</div>'
            + '</header>'

            + '<div class="tb-chat-stream" id="tb-chat-stream">'
            + (realNoticeRows ? '<div class="tb-real-notices"><div class="tb-stream-divider"><span>' + clayIcon('chat', '通知', 'is-sm') + ' 最新系统与交易通知（点击直达）</span></div>' + realNoticeRows + '</div>' : '')
            + streamItemsHtml
            + '<button type="button" class="tb-bottom-pill" data-act="im-scroll-bottom">回到底部 ∨</button>'
            + '</div>'

            + '<div class="tb-chat-compose">'
            + '<div class="tb-phrase-bar" id="tb-phrase-bar" hidden>'
            + ['方便在北山斋面交吗？', '可以看看成色细节图吗？', '我出一件数码外设互换如何？', '没问题，就约明天下午！'].map(function (ph) {
                return '<button type="button" data-act="im-phrase-pick" data-v="' + esc(ph) + '">' + esc(ph) + '</button>';
            }).join('')
            + '</div>'
            + '<div class="tb-compose-toolbar">'
            + '<div class="tb-tool-icons">'
            + '<button type="button" title="快捷常用语" data-act="im-phrase-menu">' + clayIcon('user', '常用语') + '</button>'
            + '<label class="tb-tool-lbl" title="发送图片">' + clayIcon('star', '发图片') + '<input type="file" accept="image/png,image/jpeg,image/webp" data-act="im-image" hidden></label>'
            + '<button type="button" title="发送交换卡片" data-act="im-insert-card">' + clayIcon('order', '订单卡片') + '</button>'
            + '<button type="button" title="插入AI估价建议" data-act="im-insert-ai">' + clayIcon('ai', 'AI估价') + '</button>'
            + '</div>'
            + '<span class="tb-char-count" id="tb-char-count">0 / 500</span>'
            + '</div>'
            + '<textarea id="tb-im-input" maxlength="500" rows="3" placeholder="请输入消息给 ' + esc(activePeer.name) + '，按 Enter 键 或 点击发送"></textarea>'
            + '<div class="tb-compose-foot">'
            + '<button type="button" class="tb-send-btn" data-act="im-send">发送 <span>| ▾</span></button>'
            + '</div>'
            + '</div>'
            + '</div>'

            + '<aside class="tb-im-right">'
            + '<div class="tb-shop-card">'
            + '<div class="tb-shop-top">'
            + '<img src="' + esc(activePeer.shopImg) + '" alt="">'
            + '<div><b>' + esc(activePeer.name) + '</b><a href="' + esc(activePeer.shopLink) + '" class="tb-enter-shop">进入主页</a></div>'
            + '</div>'
            + '<div class="tb-shop-stats">'
            + '<div><span>校园信用</span><b>' + esc(activePeer.credit) + '</b></div>'
            + '<div><span>平均响应</span><b>3 分钟</b></div>'
            + '<div><span>常驻书院</span><b>' + esc(activePeer.campus) + '</b></div>'
            + '</div>'
            + '</div>'
            + '<div class="tb-mascot-helper">'
            + '<img src="/assets/amz/mascot-credit-card.png" alt="小唤">'
            + '<h5>小唤提示</h5>'
            + '<a href="#/appraise" class="tb-helper-link">' + clayIcon('ai', '小唤AI', 'is-sm') + ' 让小唤帮你 AI 估价 ›</a>'
            + '</div>'
            + '</aside>'
            + '</div>'

            + '<div class="tb-float-dock">'
            + '<a href="#/me/security">' + clayIcon('settings', '设置', 'is-sm') + '<span>消息设置</span></a>'
            + '<a href="#/community">' + clayIcon('chat', '反馈', 'is-sm') + '<span>反馈</span></a>'
            + '</div>'
            + '</section>';

        $('#app').innerHTML = shell('notifications', content);
        var stream = document.getElementById('tb-chat-stream');
        if (stream) stream.scrollTop = stream.scrollHeight;
        refreshNoticeCount();
    }

    var roomTimer=null, roomBusy=false;
    function conversationRows(list) {
        return list.map(function(c){
            return '<a class="conversation-row" href="#/chat/'+c.id+'"><span class="conversation-avatar">'+esc((c.peer||'同').slice(0,1))+'</span><span><b>'+esc(c.peer)+'</b><small>'+esc(c.lastText||'暂无文字消息')+'</small><small>'+esc(c.title)+'</small></span>'+navIcon('next')+'</a>';
        }).join('')||'<div class="card card-pad">还没有私聊。</div>';
    }
    async function renderChats() {
        var list=await api('/conversation');
        if(currentView.name!=='chats')return;
        $('#app').innerHTML=shell('notifications','<section class="redesign-page"><header class="redesign-heading"><h1>私聊</h1><a href="#/notifications">返回消息</a></header><div class="conversation-list">'+conversationRows(list)+'</div></section>');
    }
    function roomMessage(m) {
        var mine=state.me&&m.senderId===state.me.id;var img=m.kind==='image'?'<a href="'+esc(m.image)+'" target="_blank" rel="noopener"><img class="chat-image" src="'+esc(m.image)+'" alt="私聊图片"></a>':'';
        return '<article class="chat-message '+(mine?'is-mine':'')+'"><a class="chat-avatar" href="#/user/'+Number(m.senderId)+'" aria-label="查看'+esc(m.nickname||'同学')+'的主页">'+esc((m.nickname||'?').slice(0,1))+'</a><div class="chat-message-body"><div class="chat-meta"><b>'+esc(m.nickname)+'</b><time>'+esc(String(m.createdAt).replace('T',' ').slice(5,16))+'</time></div><div class="chat-bubble">'+img+(m.content?'<p class="chat-text">'+esc(m.content)+'</p>':'')+'</div></div></article>';
    }
    async function refreshRoom(force) {
        if(roomBusy||!['chat','ringChat'].includes(currentView.name))return;roomBusy=true;
        try {var ring=currentView.name==='ringChat',id=currentView.arg,result=await api('/conversation/'+(ring?'ring/':'')+id),messages=ring?result:result.messages;var box=$('#room-messages');if(!box||currentView.arg!==id)return;
            var sig=messages.map(function(m){return m.id;}).join(',');if(box.dataset.signature!==sig){var near=box.scrollHeight-box.scrollTop-box.clientHeight<100;box.innerHTML=messages.length?messages.map(roomMessage).join(''):'<div class="chat-empty">还没有消息，来打个招呼吧。</div>';box.dataset.signature=sig;if(near||force)box.scrollTop=box.scrollHeight;}
        }catch(e){if(force)toast(e.message||'加载失败','err');}finally{roomBusy=false;}
    }
    async function renderRoom(id,ring) {
        var title='三方协商房间', back='#/exchange/'+id, product='';
        if(!ring){
            var thread=await api('/conversation/'+id);
            var peer=thread.sellerId===state.me.id?thread.buyerId:thread.sellerId;
            title=thread.sellerId===state.me.id?thread.buyer:thread.seller;
            back='#/notifications';
            product='<a class="room-product" href="#/item/'+Number(thread.itemId)+'">'+thumb({title:thread.title,images:thread.images})+'<span><strong>'+esc(thread.title)+'</strong><small>查看物品详情</small></span>'+navIcon('next')+'</a>';
        }
        if(currentView.arg!==id||currentView.name!==(ring?'ringChat':'chat'))return;
        var tools=ring?'':'<details class="room-attachments"><summary aria-label="打开附件面板">'+navIcon('add')+'</summary><div><label class="chat-tool">相册<input type="file" accept="image/png,image/jpeg" data-act="room-image"></label><label class="chat-tool">拍摄<input type="file" accept="image/*" capture="environment" data-act="room-image"></label><a class="chat-tool" href="#/item/'+Number(thread.itemId)+'">查看物品</a></div></details>';
        var name=ring?esc(title):'<a href="#/user/'+Number(peer)+'">'+esc(title)+'</a>';
        $('#app').innerHTML=shell('notifications','<section class="redesign-page room-redesign"><header class="redesign-heading"><a class="icon-action" href="'+esc(back)+'" aria-label="返回">'+navIcon('back')+'</a><h1>'+name+'</h1></header>'+product+'<p class="room-safety">'+(ring?'仅本次闭环的三位参与者可见。':'面交时请选校内公共地点，确认物品状态后再交付。')+'</p><section class="chat-panel room-panel"><div class="chat-messages" id="room-messages" aria-live="polite"></div><form class="chat-compose" data-form="room-text"><div class="room-input"><textarea name="content" maxlength="500" rows="2" placeholder="想跟 TA 说点什么" aria-label="消息内容" required></textarea><button type="submit" class="btn btn-primary btn-sm">发送</button></div>'+tools+'</form></section></section>');
        await refreshRoom(true);
        if(currentView.arg===id&&['chat','ringChat'].includes(currentView.name))roomTimer=setInterval(function(){refreshRoom(false);},5000);
    }
    var DEMO_WISHES = [
        {id: 701, isDemo: true, state: 'active', category: '数码', title: '【急求】求换一套罗技 GPW 无线鼠标或 68 键茶轴机械键盘，可拿 iPad 电容笔或耳机换', content: '北山书院随时可当面试手感，成色九成新以上即可，差价可协商贴补。', nickname: '北山电竞阿泽', campus: '北山书院', stage: '数码急求', budget: 240, offerText: '提供：电容笔/降噪耳机', views: 1420, replyCount: 9, image: '/assets/amz/quad-digital.jpg'},
        {id: 702, isDemo: true, state: 'active', category: '教材', title: '【考研刚需】求换 2026 张宇考研数学 1000 题 + 同济高数第七版上下册（带笔记更佳）', content: '南山书院或图书馆一楼交接，手里有全套六级真题、C语言教材或瑞幸咖啡券可换。', nickname: '南山学妹小林', campus: '南山书院', stage: '教材求换', budget: 45, offerText: '提供：六级真题/饮品券', views: 1180, replyCount: 14, image: '/assets/amz/quad-books.jpg'},
        {id: 703, isDemo: true, state: 'active', category: '运动', title: '【球场约球】求换一把尤尼克斯或胜利羽毛球拍（24磅左右），拿斯伯丁篮球或滑板换', content: '风雨球场当场试拍，拍框无裂痕即可，送两筒全新羽毛球。', nickname: '风雨球场阿杰', campus: '松格书院', stage: '运动互换', budget: 110, offerText: '提供：斯伯丁7号篮球', views: 960, replyCount: 7, image: '/assets/amz/quad-sports.jpg'},
        {id: 704, isDemo: true, state: 'active', category: '生活', title: '【宿舍改造】求换米家充电长臂护眼台灯 + 寝室床上小桌板，拿复古火漆印章礼盒换', content: '竹逸书院楼下自提，希望台灯续航正常，桌面书立也可一起打包换。', nickname: '竹逸桌搭糖糖', campus: '竹逸书院', stage: '宿舍神器', budget: 55, offerText: '提供：火漆印章全套礼盒', views: 850, replyCount: 6, image: '/assets/amz/quad-dorm.jpg'},
        {id: 705, isDemo: true, state: 'active', category: '数码', title: '【摄影心愿】求换富士 Instax mini11/mini12 拍立得相机，拿漫步者头戴降噪耳机等价换', content: '社团外拍活动急用，菊轩书院或芳华书院当面验机，相纸可另外折算。', nickname: '菊轩摄影小鹿', campus: '菊轩书院', stage: '等价互换', budget: 290, offerText: '提供：漫步者W820NB耳机', views: 1890, replyCount: 16, image: '/assets/amz/quad-auction.jpg'},
        {id: 706, isDemo: true, state: 'active', category: '教材', title: '【期末必备】求换卡西欧 fx-991CN X 中文函数计算器 + 工程制图尺规套盒', content: '大一工科萌新期末急需，支持北山斋或第一食堂当面交接。', nickname: '智能工程萌新', campus: '北山书院', stage: '期末急求', budget: 50, offerText: '提供：全新移动电源/课外书', views: 1090, replyCount: 11, image: '/assets/amz/quad-grad.jpg'},
        {id: 707, isDemo: true, state: 'active', category: '其他', title: '【潮玩手办】求换泡泡玛特 SKULLPANDA 温度系列盲盒或动漫桌面手办，可多换一', content: '爱莲书院一楼大厅面交，有拆盒未拆袋重复款可互换补齐图鉴。', nickname: '爱莲盲盒控', campus: '爱莲书院', stage: '同好互换', budget: 69, offerText: '提供：同系列隐藏/热门款', views: 1310, replyCount: 12, image: '/assets/amz/quad-wishes.jpg'},
        {id: 708, isDemo: true, state: 'active', category: '生活', title: '【毕业收纳】求换大容量牛津布衣物收纳箱×2 或 24 寸拉杆行李箱，拿桌面显示器支架换', content: '下周搬寝室急用，轮子顺滑无破损即可，松格书院可帮忙下楼搬运。', nickname: '松格大四学长', campus: '松格书院', stage: '急求好物', budget: 75, offerText: '提供：铝合金显示器增高架', views: 790, replyCount: 5, image: '/assets/amz/quad-delivery.jpg'},
        {id: 709, isDemo: true, state: 'settled', category: '数码', title: '【已达成心愿】求换 Keychron K2 无线双模机械键盘，已与大数据学院同学完成互换', content: '图书馆一楼大厅当面试轴交接完毕，换一圈匹配速度超快！', nickname: '南山极客阿伟', campus: '图书馆大厅', stage: '已达成', budget: 165, offerText: '已用：索尼SRS便携音箱交换', views: 2040, replyCount: 19, image: '/assets/amz/quad-swap.jpg'},
        {id: 710, isDemo: true, state: 'active', category: '绿植', title: '【阳台绿植】求换宿舍好养活的多肉拼盘、龟背竹或郁金香种球，拿手冲咖啡壶套装换', content: '梅若书院向阳阳台养护，希望带陶瓷花盆一起交换。', nickname: '梅若园艺社', campus: '梅若书院', stage: '绿植互换', budget: 35, offerText: '提供：法压壶+咖啡豆礼盒', views: 670, replyCount: 8, image: '/assets/amz/quad-community.jpg'}
    ];

    function wishAuctionCard(w) {
        var isSettled = w.state === 'settled';
        var isMine = state.me && w.userId === state.me.id;
        var fallbackImgs = ['/assets/amz/quad-wishes.jpg', '/assets/amz/quad-books.jpg', '/assets/amz/quad-digital.jpg', '/assets/amz/quad-dorm.jpg', '/assets/amz/quad-sports.jpg'];
        var img = w.image || fallbackImgs[Math.abs(Number(w.id || 0)) % fallbackImgs.length];
        var swapLabel = w.offerText ? String(w.offerText).replace(/^提供：/, '拿 ').replace(/^已用：/, '已用 ') : ('心理价 ¥' + (w.budget || 50));
        var btnHtml = isMine
            ? '<button type="button" class="clean-act-btn is-muted" data-act="wish-close" data-id="' + w.id + '">关闭</button>'
            : (w.isDemo
                ? '<button type="button" class="clean-act-btn is-amber ' + (isSettled ? 'is-muted' : '') + '" data-act="go" data-to="#/idle' + (w.category ? '?cat=' + encodeURIComponent(w.category) : '') + '">' + (isSettled ? '看同类' : '去响应') + '</button>'
                : '<button type="button" class="clean-act-btn is-amber" data-act="go" data-to="#/user/' + w.userId + '">响应</button>');
        return '<article class="wish-card-clean">'
            + '<div class="clean-card-media">'
            + '<img src="' + esc(img) + '" onerror="this.onerror=null;this.src=\'/assets/amz/quad-wishes.jpg\'" alt="' + esc(w.title) + '" loading="lazy">'
            + (isSettled ? '<span class="clean-state-tag is-done">已达成</span>' : '')
            + '</div>'
            + '<div class="clean-card-body">'
            + '<h2 class="clean-card-title" title="' + esc(w.title) + '">' + esc(w.title) + '</h2>'
            + '<div class="clean-card-meta-row">'
            + '<span class="wish-swap-line" title="' + esc(swapLabel) + '">' + esc(swapLabel) + '</span>'
            + btnHtml
            + '</div>'
            + '</div>'
            + '</article>';
    }

    async function renderWishes() {
        var offered = (await api('/item/mine?status=1', {optionalAuth: true}).catch(function () { return []; })).filter(function (item) { return item.allowCycle && !item.isDemo; });
        var offerOptions = offered.map(function (item) { return '<option value="' + Number(item.id) + '">' + esc(item.title) + '</option>'; }).join('');
        var matched = currentView.name === 'wishes' ? currentView.arg : null;
        var wishes = await api('/wish' + (matched ? '/' + matched : ''), {optionalAuth: true}).catch(function () { return []; });
        var displayList = (wishes || []).concat(DEMO_WISHES);

        var content = '<div class="wish-bounty-page">'
            + '<header class="wish-top-banner">'
            + '<div class="wish-banner-left">'
            + '<img src="/assets/brand/mascot-wave-320.webp" alt="小唤">'
            + '<div><h1>求换心愿专区</h1></div>'
            + '</div>'
            + '<nav class="wish-banner-cats" aria-label="求换分类">'
            + [['全部', '全部 (' + displayList.length + ')'], ['数码', '数码外设'], ['教材', '考研教材'], ['运动', '运动户外'], ['生活', '宿舍生活']].map(function (c) {
                return '<button type="button" class="' + ((state.wishCat || '全部') === c[0] ? 'on' : '') + '" data-act="wish-cat" data-v="' + c[0] + '">' + c[1] + '</button>';
            }).join('')
            + '<a href="#/relay">换物接力</a>'
            + '<a href="#/auctions">校园拍卖</a>'
            + '</nav>'
            + '</header>'

            + '<div class="wish-workbench">'
            + '<aside class="wish-sidebar">'
            + '<form id="ali-wish-composer" class="wish-composer-card wish-form" data-form="wish-new">'
            + '<h2>发布求换心愿</h2>'
            + '<div class="field"><label class="label">我想换</label><input class="input" name="title" maxlength="100" placeholder="高数习题集 / 罗技鼠标" required></div>'
            + '<div class="field"><label class="label">分类</label><select class="select" name="category"><option value="">全部类别</option>' + CATS.map(function (c) { return '<option>' + esc(c) + '</option>'; }).join('') + '</select></div>'
            + '<div class="field"><label class="label">我拿什么换</label><select class="select" id="wish-offer" name="offeredItemId"><option value="">不关联在架物品</option>' + offerOptions + '</select></div>'
            + '<div class="field"><label class="label">备注</label><input class="input" name="content" maxlength="500" placeholder="成色要求或交接书院（选填）"></div>'
            + '<button class="btn wish-submit-btn btn-block" type="submit">发布求换</button>'
            + '</form>'
            + '</aside>'

            + '<main class="wish-main">'
            + '<div class="wish-bounty-grid">'
            + (function () {
                var wCat = state.wishCat || '全部';
                var wShown = wCat === '全部' ? displayList : displayList.filter(function (w) {
                    return w.category === wCat || String(w.title + ' ' + (w.offerText || '')).indexOf(wCat) >= 0;
                });
                return wShown.length ? wShown.map(wishAuctionCard).join('') : '<div class="card card-pad" style="grid-column:1/-1;text-align:center">当前分类暂无求换心愿 <button type="button" class="btn btn-sm btn-primary" data-act="wish-cat" data-v="全部">查看全部</button></div>';
            })()
            + '</div>'
            + '</main>'
            + '</div>'
            + '</div>';

        $('#app').innerHTML = shell('wishes', content);
    }

    var communityTimer = null;
    var communityLoading = false;
    function communityMessage(m) {
        var time=String(m.createdAt || '').replace('T',' ').slice(5,16);
        var body = m.kind==='image' ? '<a href="'+esc(m.image)+'" target="_blank" rel="noopener"><img class="chat-image" src="'+esc(m.image)+'" alt="社区图片"></a>' : '';
        if(m.kind==='item') { var img=firstImage(m.itemImages); body += m.itemAvailable ? '<button class="chat-item" data-act="go" data-to="#/item/'+m.itemId+'">'+(img?'<img src="'+esc(img)+'" alt="">':'')+'<span><small>分享的物品</small><b>'+esc(m.itemTitle)+'</b>查看详情 →</span></button>' : '<div class="chat-item-unavailable">分享的物品已下架</div>'; }
        if(m.content) body += '<p class="chat-text">'+esc(m.content)+'</p>';
        return '<article class="chat-message '+(state.me && state.me.id===m.userId?'is-mine':'')+'"><div class="chat-avatar">'+esc((m.nickname || '?').slice(0,1))+'</div><div class="chat-message-body"><div class="chat-meta"><b>'+esc(m.nickname)+'</b><time>'+esc(time)+'</time></div><div class="chat-bubble">'+body+'</div></div></article>';
    }
    async function refreshCommunity(force) {
        var box=$('#chat-messages');
        if (communityLoading || currentView.name!=='community' || !box) return;
        communityLoading=true;
        try {
            var messages=await api('/community', {optionalAuth:true});
            box=$('#chat-messages'); if(!box || currentView.name!=='community') return;
            var signature=messages.map(function(m){return [m.id,m.itemAvailable,m.itemTitle].join(':');}).join('|');
            if(box.dataset.signature!==signature) {var near=box.scrollHeight-box.scrollTop-box.clientHeight<100;box.innerHTML=messages.length?messages.map(communityMessage).join(''):'<div class="chat-empty">还没有消息，来打个招呼吧。</div>';box.dataset.signature=signature;if(near||force)box.scrollTop=box.scrollHeight;}
        } catch(e){
            if (e && e.code === 401 && $('#chat-messages')) {
                $('#chat-messages').innerHTML='<div class="chat-empty">登录后即可参与全校实时聊天互动 <a href="#/login" class="btn btn-primary btn-sm" style="margin-left:8px">去登录</a></div>';
            } else if(force) toast(e.message || '消息加载失败','err');
        } finally { communityLoading=false; }
    }
    var TIEBA_ROOMS = [
        {id: 'hall', name: '综合闲置吹水吧', icon: 'fire', cat: '综合', desc: '全校闲置晒单、每日捡漏情报与校园日常讨论', members: 1286, img: '/assets/amz/quad-community.jpg', badge: 'LIVE'},
        {id: 'digital', name: '北山数码外设吧', icon: 'ai', cat: '数码', desc: '键鼠耳机显示器验机评测、平价数码互换专场', members: 842, img: '/assets/amz/quad-digital.jpg', badge: '99+'},
        {id: 'books', name: '南山考研教材吧', icon: 'order', cat: '教材', desc: '高数真题笔记漂流、各院系专业课二手教材互换', members: 965, img: '/assets/amz/quad-books.jpg', badge: '64'},
        {id: 'dorm', name: '松格宿舍好物吧', icon: 'star', cat: '生活', desc: '护眼台灯收纳箱桌搭安利，寝室生活实用好物分享', members: 614, img: '/assets/amz/quad-dorm.jpg', badge: '42'},
        {id: 'sports', name: '风雨球场运动吧', icon: 'swap', cat: '运动', desc: '羽毛球拍篮球骑行装备约战，当面试拍换器材', members: 538, img: '/assets/amz/quad-sports.jpg', badge: '约球'},
        {id: 'photo', name: '拍立得与潮玩吧', icon: 'auction', cat: '其他', desc: '相机拍立得相纸流转、盲盒手办端盒拆封互换', members: 472, img: '/assets/amz/quad-auction.jpg', badge: '热'},
        {id: 'lost', name: '失物招领互助吧', icon: 'pin', cat: '互助', desc: '校园卡雨伞耳机寻主，各书院爱心接力归还', members: 719, img: '/assets/amz/quad-delivery.jpg', badge: '置顶'},
        {id: 'game', name: 'ScrapArena街机吧', icon: 'game', cat: '娱乐', desc: '双人同屏格斗约战大厅、战绩晒图与校园排行榜', members: 390, img: '/assets/brand/mascot-box.png', badge: 'PK'}
    ];
    function getAllRooms() {
        var custom = [];
        try { custom = JSON.parse(localStorage.getItem('hq.customRooms') || '[]'); } catch (e) { custom = []; }
        return TIEBA_ROOMS.concat(Array.isArray(custom) ? custom : []);
    }
    function getRoomFollows() {
        try {
            var arr = JSON.parse(localStorage.getItem('hq.followedRooms') || 'null');
            if (Array.isArray(arr)) return arr;
        } catch (e) {}
        return ['hall', 'digital', 'books'];
    }
    function setRoomFollows(arr) {
        try { localStorage.setItem('hq.followedRooms', JSON.stringify(arr)); } catch (e) {}
    }
    function openCreateRoomSheet() {
        var iconOpts = [['fire','热门'],['chat','交流'],['ai','智能'],['order','教材'],['swap','互换'],['auction','潮玩'],['pin','校内'],['game','街机'],['star','种草'],['user','社团']];
        openSheet('<h3>创建我的校园贴吧 / 聊天室</h3>'
            + '<p class="sub">输入吧名与主题后即刻生成专属聊天室，支持同学们发帖晒单与实时聊天。</p>'
            + '<form data-form="create-room" class="tieba-create-form">'
            + '<div class="field"><label class="label">聊天室名称 *</label><input class="input" name="name" maxlength="20" placeholder="如：北山考研资料吧 / 宿舍羽毛球群" required></div>'
            + '<div class="field" style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'
            + '<div><label class="label">所属分类</label><select class="select" name="cat"><option value="综合">综合闲置</option><option value="数码">数码外设</option><option value="教材">考研教材</option><option value="生活">宿舍生活</option><option value="运动">运动户外</option><option value="互助">校园互助</option><option value="娱乐">兴趣街机</option></select></div>'
            + '<div><label class="label">角标徽章（选填）</label><input class="input" name="badge" maxlength="6" placeholder="如：新建 / 热门"></div>'
            + '</div>'
            + '<div class="field"><label class="label">选择小唤图标</label><div class="tieba-icon-picker">'
            + iconOpts.map(function (o, i) {
                return '<label class="tieba-ico-opt"><input type="radio" name="icon" value="' + o[0] + '"' + (i === 0 ? ' checked' : '') + '>' + clayIcon(o[0], o[1]) + '<span>' + o[1] + '</span></label>';
            }).join('')
            + '</div></div>'
            + '<div class="field"><label class="label">吧规与简介</label><textarea class="input" name="desc" rows="2" maxlength="80" placeholder="一句话介绍本聊天室的交流话题或换物规则…"></textarea></div>'
            + '<button type="submit" class="btn btn-primary btn-block">立即创建并进入聊天室</button>'
            + '</form>');
    }
    var SEEDED_TIEBA_POSTS = [
        {
            id: 1001, roomId: 'hall', tag: '置顶精华', author: '北山书院 电竞阿泽', ava: '北', time: '15 分钟前',
            title: '【晒单互换】大三升级桌面，出九五新罗技 GPW 二代 + 68键机械键盘，或者换 iPad 电容笔',
            body: '成色自己看图，微动清脆盒子和原装伞绳线都在，北山书院一楼大厅可当场连接笔记本试手感，支持三方接力环补差价。',
            imgs: ['/assets/amz/quad-digital.jpg', '/assets/amz/quad-swap.jpg', '/assets/amz/quad-appraise.jpg'],
            likes: 128, cat: '数码',
            comments: [
                {author: '松格小陈', time: '12 分钟前', text: 'GPW 二代白色超耐看！我有一支全新未拆二代电容笔，方便去私聊看看吗？'},
                {author: '南山阿杰', time: '8 分钟前', text: '帮顶好贴，键盘是什么轴体的呀？'}
            ]
        },
        {
            id: 1002, roomId: 'books', tag: '精华资料', author: '南山书院 上岸学姐小林', ava: '南', time: '42 分钟前',
            title: '【考研飘流】整理全套同济高数+张宇1000题手写笔记，欢迎拿宿舍好物或文具来换',
            body: '成功上岸来还愿啦！笔记分章标注了高频考题型，无乱涂乱画，附送整本英语六级高频词册，图书馆一楼随时交接。',
            imgs: ['/assets/amz/quad-books.jpg', '/assets/amz/quad-grad.jpg'],
            likes: 94, cat: '教材',
            comments: [
                {author: '大二考研党', time: '30 分钟前', text: '沾沾学姐上岸喜气！我有一个米家便携榨汁杯和全新荧光笔套装能换吗？'}
            ]
        },
        {
            id: 1003, roomId: 'digital', tag: '验机评测', author: '菊轩极客老林', ava: '菊', time: '1 小时前',
            title: '【避坑经验】校内面交二手耳机/键盘必看的 4 个检查步骤（实测有效）',
            body: '1. 先让小唤 AI 估价测个基准区间；2. 耳机当场试降噪和左右耳电量均衡；3. 键盘打开在线轴体测试网页全键按一遍；4. 走换一圈平台记录保信用担保！',
            imgs: ['/assets/amz/quad-appraise.jpg'],
            likes: 76, cat: '数码',
            comments: [
                {author: '北山萌新', time: '48 分钟前', text: '收藏了！昨晚刚用这招顺利换到漫步者降噪耳机，超稳。'}
            ]
        },
        {
            id: 1004, roomId: 'dorm', tag: '晒单安利', author: '松格桌搭糖糖', ava: '松', time: '2 小时前',
            title: '【宿舍改造】花零元靠以物换物凑齐了护眼台灯+桌面绿植+牛津布收纳箱',
            body: '拿自己闲置的两本专业课书+复古火漆印章礼盒在换一圈换了三件宿舍神器，同寝室友已经全被我安利入坑了。',
            imgs: ['/assets/amz/quad-dorm.jpg', '/assets/amz/quad-wishes.jpg'],
            likes: 65, cat: '生活',
            comments: []
        },
        {
            id: 1005, roomId: 'sports', tag: '约战换拍', author: '风雨球场科比', ava: '风', time: '3 小时前',
            title: '【今晚7点半】风雨球场3号场约双打，顺便试打这把24磅胜利大鬼斩球拍看谁想换',
            body: '最近换了新拍子，旧的这把手感依然弹，刚换了新吸汗带还送两筒耐打王。球场上边打边试，中意直接发起换物报价！',
            imgs: ['/assets/amz/quad-sports.jpg'],
            likes: 58, cat: '运动',
            comments: [
                {author: '竹逸羽球社', time: '2 小时前', text: '算我一个！我带斯伯丁篮球下来，咱们当场交流~'}
            ]
        },
        {
            id: 1006, roomId: 'photo', tag: '同好互换', author: '爱莲摄影小鹿', ava: '爱', time: '昨天',
            title: '富士 Instax mini11 拍立得换漫步者头戴耳机，额外再塞半盒全新相纸',
            body: '机身完全无划痕，欢迎周末一起在学校樱花大道试拍几张直接成环！',
            imgs: ['/assets/amz/quad-auction.jpg'],
            likes: 49, cat: '其他',
            comments: []
        },
        {
            id: 1007, roomId: 'lost', tag: '失物招领', author: '图书馆值班同学', ava: '图', time: '今天 11:20',
            title: '【招领】一楼自习区靠窗桌面捡到一把黑色全自动晴雨伞 + 绿色校园卡套',
            body: '已经放在图书馆一楼服务台旁边的蓝框里，失主同学可以直接在本贴留言确认特征来认领~',
            imgs: ['/assets/amz/quad-delivery.jpg'],
            likes: 112, cat: '生活',
            comments: []
        },
        {
            id: 1008, roomId: 'game', tag: '约战PK', author: 'Scrap街机冠军', ava: '游', time: '4 小时前',
            title: '【街机约战】来试试新上线的 Scrap Arena 双人同屏格斗！顺便赌一瓶冰可乐换贴纸',
            body: 'P1 用 WASD+JKL，P2 用方向键+123，点右侧“开始对战”就能直接双人同屏切磋，看谁连招最强！',
            imgs: ['/assets/brand/mascot-box.png'],
            likes: 63, cat: '其他',
            comments: []
        }
    ];
    function getTiebaPosts() {
        var custom = [];
        try { custom = JSON.parse(localStorage.getItem('hq.tiebaPosts') || '[]'); } catch (e) { custom = []; }
        var repliesMap = {};
        try { repliesMap = JSON.parse(localStorage.getItem('hq.tiebaReplies') || '{}') || {}; } catch (e) { repliesMap = {}; }
        var likesMap = {};
        try { likesMap = JSON.parse(localStorage.getItem('hq.tiebaLikes') || '{}') || {}; } catch (e) { likesMap = {}; }
        return (Array.isArray(custom) ? custom : []).concat(SEEDED_TIEBA_POSTS).map(function (p) {
            var extraReplies = Array.isArray(repliesMap[p.id]) ? repliesMap[p.id] : [];
            var liked = !!likesMap['u_' + p.id];
            return Object.assign({}, p, {
                liked: liked,
                likesCount: Number(p.likes || 0) + (liked ? 1 : 0),
                allComments: (p.comments || []).concat(extraReplies)
            });
        });
    }
    var SEEDED_ROOM_CHATS = {
        digital: [
            {nick: '北山电竞阿泽', time: '14:22', text: '今天有人出 68 键三模机械键盘吗？想拿罗技鼠标补一点换'},
            {nick: '菊轩极客老林', time: '14:25', text: '我刚在南山书院那看到同学挂了个 Keychron K2，成色贼新'}
        ],
        books: [
            {nick: '南山学姐小林', time: '10:15', text: '同济高数第七版上下册+张宇1000题还剩最后一套，需要的同学可直接发帖留言'},
            {nick: '智能工程大二生', time: '10:18', text: '求一套卡西欧 fx-991 计算器，下午在北山食堂交接！'}
        ],
        dorm: [
            {nick: '松格桌搭糖糖', time: '19:02', text: '米家护眼台灯 1S 夜间开暖光超舒服，熄灯后充着电也能用好久'}
        ],
        sports: [
            {nick: '风雨球场科比', time: '17:30', text: '7点半风雨球场有人一起试拍吗？顺便切磋两局~'}
        ],
        photo: [
            {nick: '爱莲摄影小鹿', time: '13:10', text: '手上有两盒未拆富士 mini 白边相纸，想换泡泡玛特盲盒或桌面手办'}
        ],
        lost: [
            {nick: '北山热心学长', time: '11:40', text: '在北山三食堂门口捡到一副白色蓝牙耳机盒，请在失物吧联系我核对型号'}
        ],
        game: [
            {nick: 'Scrap街机冠军', time: '20:10', text: '刚刚拿机器人打了 15 连击，谁来 Scrap Arena 挑战一下？'}
        ]
    };
    function getRoomChats(roomId) {
        var stored = {};
        try { stored = JSON.parse(localStorage.getItem('hq.roomChats') || '{}') || {}; } catch (e) { stored = {}; }
        var extra = Array.isArray(stored[roomId]) ? stored[roomId] : [];
        return (SEEDED_ROOM_CHATS[roomId] || [{nick: '小唤助手', time: '置顶', text: '欢迎来到本主题聊天室！可以直接发文字、图片或晒出在架闲置。'}]).concat(extra);
    }

    async function renderCommunity() {
        var rooms = getAllRooms();
        var activeRoomId = state.commRoom || 'hall';
        var activeRoom = rooms.find(function (r) { return r.id === activeRoomId; }) || rooms[0];
        activeRoomId = activeRoom.id;
        state.commRoom = activeRoomId;
        var follows = getRoomFollows();
        var isFollowed = follows.indexOf(activeRoomId) >= 0;
        var activeTab = state.commTab || 'posts';

        var allPosts = getTiebaPosts();
        var roomPosts = activeRoomId === 'hall' ? allPosts : allPosts.filter(function (p) { return p.roomId === activeRoomId; });
        var myShelfItems = state.me ? await api('/item/mine?status=1', {optionalAuth: true}).catch(function () { return []; }) : [];

        var roomNavHtml = rooms.map(function (r) {
            var on = r.id === activeRoomId;
            return '<div class="qq-chan-row">'
                + '<button type="button" class="qq-chan-item sub ' + (on ? 'on' : '') + '" data-act="comm-room" data-room="' + esc(r.id) + '">'
                + clayIcon(r.icon || 'fire', r.name, 'is-sm')
                + '<span>' + esc(r.name) + '</span>'
                + (r.badge ? '<small>' + esc(r.badge) + '</small>' : '')
                + '</button>'
                + (r.custom ? '<button type="button" class="qq-room-del" data-act="delete-custom-room" data-room="' + esc(r.id) + '" title="删除自建聊天室">×</button>' : '')
                + '</div>';
        }).join('');

        var composerBar = activeTab === 'posts'
            ? '<form class="qq-compose-box tieba-composer" data-form="tieba-post">'
              + '<div class="tieba-comp-head">'
              + '<b>' + clayIcon('order', '发帖', 'is-sm') + ' 在「' + esc(activeRoom.name) + '」发表新帖</b>'
              + '<select name="tag" aria-label="帖子标签" class="tieba-tag-select">'
              + '<option value="晒单安利">晒单安利</option><option value="求物互换">求物互换</option><option value="经验分享">经验分享</option><option value="失物招领">失物招领</option><option value="避坑指南">避坑指南</option>'
              + '</select>'
              + '</div>'
              + '<input class="tieba-title-input" name="title" maxlength="90" placeholder="填写帖子标题（例如：出95新机械键盘，或求换同济高数教材）" required>'
              + '<textarea name="body" maxlength="800" rows="3" placeholder="说说成色、期望交换的物品、方便面交的书院地点…" aria-label="帖子正文" required></textarea>'
              + (state.tiebaPostImg ? '<div class="tieba-img-preview"><img src="' + esc(state.tiebaPostImg) + '" alt="配图"><button type="button" data-act="tieba-clear-img">移除配图</button></div>' : '')
              + '<div class="chat-tools qq-compose-bar">'
              + '<div class="qq-tool-btns">'
              + '<label class="chat-tool">' + clayIcon('star', '配图', 'is-sm') + ' 添加配图<input type="file" accept="image/png,image/jpeg,image/webp" data-act="tieba-post-image" hidden></label>'
              + (myShelfItems && myShelfItems.length
                  ? '<select name="itemId" class="tieba-item-select" aria-label="关联我的闲置"><option value="">关联在架闲置（选填）</option>'
                    + myShelfItems.map(function (it) { return '<option value="' + Number(it.id) + '">' + esc(it.title) + '</option>'; }).join('') + '</select>'
                  : '<button type="button" class="chat-tool" data-act="go" data-to="#/publish">' + clayIcon('order', '发布', 'is-sm') + ' 先去发布闲置</button>')
              + '</div>'
              + '<button type="submit" class="btn btn-primary btn-sm">发表到贴吧</button>'
              + '</div></form>'
            : '';

        var postsFeedHtml = roomPosts.length ? roomPosts.map(function (p) {
            var commentsOpen = !!state.tiebaOpenComments[p.id];
            var floorListHtml = p.allComments.map(function (c, cIdx) {
                return '<div class="tieba-floor">'
                    + '<span class="tieba-floor-no">' + (cIdx + 1) + '楼</span>'
                    + '<b>' + esc(c.author || '移通同学') + '</b>'
                    + '<p>' + esc(c.text) + '</p>'
                    + '<time>' + esc(c.time || '刚刚') + '</time>'
                    + '</div>';
            }).join('');
            return '<article class="qq-post-card tieba-post-card">'
                + '<header class="qq-post-head">'
                + '<span class="qq-post-avatar">' + esc(p.ava || (p.author || '友').slice(0, 1)) + '</span>'
                + '<div><b>' + esc(p.author) + '</b><span>' + esc(p.time) + ' | ' + esc((rooms.find(function (r) { return r.id === p.roomId; }) || activeRoom).name) + '</span></div>'
                + '<span class="qq-post-tag">' + esc(p.tag || '讨论') + '</span>'
                + (p.isUserPost ? '<button type="button" class="tieba-del-btn" data-act="tieba-delete-post" data-id="' + esc(p.id) + '">删帖</button>' : '')
                + '</header>'
                + '<h3>' + esc(p.title) + '</h3>'
                + (p.body ? '<p class="tieba-post-body">' + esc(p.body) + '</p>' : '')
                + (p.imgs && p.imgs.length ? '<div class="qq-post-imgs">' + p.imgs.map(function (src) { return '<img src="' + esc(src) + '" alt="帖子配图" loading="lazy">'; }).join('') + '</div>' : '')
                + (p.itemId ? '<div class="tieba-linked-item"><a href="#/item/' + Number(p.itemId) + '" class="btn btn-sm btn-ghost">' + clayIcon('swap', '关联', 'is-sm') + ' 查看帖子关联闲置：' + esc(p.itemTitle || ('好物 #' + p.itemId)) + ' ›</a></div>' : '')
                + '<footer class="qq-post-foot">'
                + '<button type="button" class="tieba-act-btn ' + (p.liked ? 'on' : '') + '" data-act="tieba-like" data-id="' + esc(p.id) + '">' + clayIcon('fire', '点赞', 'is-sm') + ' <b>' + p.likesCount + '</b></button>'
                + '<button type="button" class="tieba-act-btn ' + (commentsOpen ? 'on' : '') + '" data-act="tieba-toggle-comments" data-id="' + esc(p.id) + '">' + clayIcon('chat', '评论', 'is-sm') + ' <b>' + p.allComments.length + ' 条回复</b></button>'
                + '<a href="#/idle' + (p.cat ? '?cat=' + encodeURIComponent(p.cat) : '') + '">逛同类闲置 ›</a>'
                + '</footer>'
                + '<div class="tieba-comments" ' + (commentsOpen ? '' : 'hidden') + '>'
                + (floorListHtml || '<p class="hint" style="margin:0 0 8px">还没有同学抢沙发，快来抢 1 楼吧~</p>')
                + '<form class="tieba-reply-form" data-form="tieba-reply" data-post-id="' + esc(p.id) + '">'
                + '<input name="reply" maxlength="300" placeholder="写下你的看法或换物意向，回帖占楼…" required>'
                + '<button type="submit" class="btn btn-primary btn-sm">回帖</button>'
                + '</form>'
                + '</div>'
                + '</article>';
        }).join('') : '<div class="card card-pad" style="text-align:center"><p>「' + esc(activeRoom.name) + '」还没有帖子，快在上方发第一帖抢占热帖吧！</p></div>';

        var roomChatHtml = '';
        if (activeTab === 'chat') {
            if (activeRoomId === 'hall') {
                roomChatHtml = '<form class="qq-compose-box chat-compose" data-form="community-text">'
                    + '<div class="qq-compose-top">'
                    + '<img class="qq-compose-avatar" src="/assets/brand/mascot-wave-320.webp" alt="">'
                    + '<textarea name="content" maxlength="500" rows="2" placeholder="在 #' + esc(activeRoom.name) + ' 实时冒泡、求物或分享宝贝…" aria-label="消息内容" required></textarea>'
                    + '</div>'
                    + '<div class="chat-tools qq-compose-bar">'
                    + '<div class="qq-tool-btns">'
                    + '<label class="chat-tool">' + clayIcon('star', '发图', 'is-sm') + ' 发送图片<input type="file" accept="image/png,image/jpeg" data-act="community-image" hidden></label>'
                    + '<button type="button" class="chat-tool" data-act="community-share">' + clayIcon('order', '晒单', 'is-sm') + ' 晒出我的在架闲置</button>'
                    + '<button type="button" class="chat-tool" data-act="go" data-to="#/wishes">' + clayIcon('ai', '心愿', 'is-sm') + ' 发起求换心愿</button>'
                    + '</div>'
                    + '<button type="submit" class="btn btn-primary btn-sm">发送到聊天室</button>'
                    + '</div></form>'
                    + '<section class="qq-realtime-card"><div class="qq-realtime-head"><b>' + clayIcon('chat', '聊天', 'is-sm') + ' #' + esc(activeRoom.name) + ' 实时聊天室</b><span>全校同步广播</span></div><div class="chat-messages" id="chat-messages" aria-live="polite"></div></section>';
            } else {
                var rChats = getRoomChats(activeRoomId);
                roomChatHtml = '<form class="qq-compose-box chat-compose" data-form="room-chat-msg" data-room="' + esc(activeRoomId) + '">'
                    + '<div class="qq-compose-top">'
                    + '<img class="qq-compose-avatar" src="/assets/brand/mascot-wave-320.webp" alt="">'
                    + '<textarea name="content" maxlength="400" rows="2" placeholder="在 #' + esc(activeRoom.name) + ' 聊天室发言…" aria-label="聊天内容" required></textarea>'
                    + '</div>'
                    + '<div class="chat-tools qq-compose-bar">'
                    + '<div class="qq-tool-btns">'
                    + '<label class="chat-tool">' + clayIcon('star', '图片', 'is-sm') + ' 发送图片<input type="file" accept="image/png,image/jpeg,image/webp" data-act="room-chat-image" data-room="' + esc(activeRoomId) + '" hidden></label>'
                    + '<button type="button" class="chat-tool" data-act="comm-tab" data-v="posts">' + clayIcon('order', '发帖', 'is-sm') + ' 去贴吧发长帖</button>'
                    + '</div>'
                    + '<button type="submit" class="btn btn-primary btn-sm">发送消息</button>'
                    + '</div></form>'
                    + '<section class="qq-realtime-card"><div class="qq-realtime-head"><b>' + clayIcon(activeRoom.icon || 'chat', '聊天', 'is-sm') + ' #' + esc(activeRoom.name) + ' 房间聊天室</b><span>' + rChats.length + ' 条活跃发言</span></div>'
                    + '<div class="chat-messages">' + rChats.map(function (m) {
                        var isMine = state.me && m.nick === state.me.nickname;
                        var bodyHtml = m.image ? '<img class="chat-image" src="' + esc(m.image) + '" alt="聊天图片">' : '';
                        if (m.text) bodyHtml += '<p class="chat-text">' + esc(m.text) + '</p>';
                        return '<article class="chat-message ' + (isMine ? 'is-mine' : '') + '"><div class="chat-avatar">' + esc((m.nick || '友').slice(0, 1)) + '</div><div class="chat-message-body"><div class="chat-meta"><b>' + esc(m.nick) + '</b><time>' + esc(m.time || '刚刚') + '</time></div><div class="chat-bubble">' + bodyHtml + '</div></div></article>';
                    }).join('') + '</div></section>';
            }
        }

        $('#app').innerHTML = shell('community',
            '<div class="qq-channel-shell">'
            + '<aside class="qq-chan-left" aria-label="校园贴吧与聊天室列表">'
            + '<div class="qq-guild-head">'
            + '<img src="/assets/brand/mascot-wave-320.webp" alt="小唤">'
            + '<div><b>换一圈校园贴吧</b><span>' + rooms.length + ' 个活跃聊天室</span></div>'
            + '</div>'
            + '<button type="button" class="btn btn-primary btn-sm btn-block tieba-create-btn" data-act="open-create-room">+ 创建我的聊天室</button>'
            + '<div class="qq-chan-group" style="margin-top:10px">'
            + '<button type="button" class="qq-chan-item ' + (activeRoomId === 'hall' ? 'on' : '') + '" data-act="comm-room" data-room="hall">' + clayIcon('fire', '热门', 'is-sm') + '<span>全校热帖广场</span><em class="qq-badge-hot">热</em></button>'
            + '<a href="#/wishes" class="qq-chan-item">' + clayIcon('swap', '心愿', 'is-sm') + '<span>全校求换心愿榜</span></a>'
            + '<a href="#/appraise" class="qq-chan-item">' + clayIcon('ai', 'AI', 'is-sm') + '<span>AI 估价讨论室</span></a>'
            + '</div>'
            + '<div class="qq-chan-group"><div class="qq-group-title">▾ 贴吧与专题聊天室</div>'
            + roomNavHtml
            + '</div>'
            + '<div class="qq-left-promo">'
            + '<img src="/assets/brand/mascot-box.png" alt="小唤">'
            + '<div><b>移通贴吧联盟</b></div>'
            + '</div>'
            + '</aside>'

            + '<main class="qq-chan-center">'
            + '<header class="tieba-bar-header">'
            + '<div class="tieba-bar-cover"><img src="' + esc(activeRoom.img || '/assets/amz/quad-community.jpg') + '" alt=""></div>'
            + '<div class="tieba-bar-meta">'
            + '<div class="tieba-bar-title-row">'
            + '<span class="qq-official-tag">' + (activeRoom.custom ? '同学自建吧' : '校园主题吧') + '</span>'
            + '<h1>' + esc(activeRoom.name) + '</h1>'
            + '<button type="button" class="btn btn-sm ' + (isFollowed ? 'btn-ghost' : 'btn-primary') + '" data-act="toggle-follow-room" data-room="' + esc(activeRoomId) + '">' + (isFollowed ? '已关注' : '+ 关注本吧') + '</button>'
            + '</div>'
            + '<p class="tieba-bar-desc">' + esc(activeRoom.desc || '移通同学自由交流与闲置互换专属空间') + '</p>'
            + '<div class="qq-hero-stats"><span>关注人数 <b>' + (Number(activeRoom.members || 100) + (isFollowed ? 1 : 0)) + '</b></span><span>贴子总数 <b>' + roomPosts.length + '</b></span></div>'
            + '</div>'
            + '</header>'

            + '<div class="qq-feed-tabs tieba-mode-tabs">'
            + '<button type="button" class="' + (activeTab === 'posts' ? 'on' : '') + '" data-act="comm-tab" data-v="posts">' + clayIcon('order', '看帖', 'is-sm') + ' 看帖与发帖 (' + roomPosts.length + ')</button>'
            + '<button type="button" class="' + (activeTab === 'chat' ? 'on' : '') + '" data-act="comm-tab" data-v="chat">' + clayIcon('chat', '聊天', 'is-sm') + ' 本吧实时聊天室</button>'
            + '<button type="button" class="tieba-tab-cta" data-act="open-create-room">+ 创建聊天室</button>'
            + '<span class="qq-live-pill">● 实时同步中</span>'
            + '</div>'

            + (activeTab === 'posts'
                ? composerBar + '<div class="qq-featured-feed">' + postsFeedHtml + '</div>'
                : roomChatHtml)
            + '</main>'

            + '<aside class="qq-chan-right" aria-label="频道侧栏">'
            + '<div class="qq-side-card qq-arcade-box">'
            + '<span class="tag">ARCADE</span>'
            + '<h3>Scrap Arena 街机</h3>'
            + '<img src="/assets/brand/mascot-wave-320.webp" alt="小唤">'
            + '<button class="btn btn-primary" data-act="go" data-to="#/community/game">' + clayIcon('game', '街机', 'is-sm') + ' 开始对战</button>'
            + '</div>'
            + '<div class="qq-side-card">'
            + '<h4>' + clayIcon('chat', '自建吧', 'is-sm') + ' 快速切换聊天室</h4>'
            + '<div class="tieba-side-pills">' + rooms.slice(0, 6).map(function (r) {
                return '<button type="button" class="chip ' + (r.id === activeRoomId ? 'on' : '') + '" data-act="comm-room" data-room="' + esc(r.id) + '">' + esc(r.name) + '</button>';
            }).join('') + '</div>'
            + '<button type="button" class="btn btn-ghost btn-sm btn-block" style="margin-top:10px" data-act="open-create-room">+ 新建专属聊天室</button>'
            + '</div>'
            + '<div class="qq-side-card">'
            + '<h4>' + clayIcon('fire', '排行榜', 'is-sm') + ' 本周换物活跃书院榜</h4>'
            + '<ul class="qq-rank-list">'
            + '<li><b>1</b><span>北山书院</span><em>428 单</em></li>'
            + '<li><b>2</b><span>南山书院</span><em>365 单</em></li>'
            + '<li><b>3</b><span>松格书院</span><em>290 单</em></li>'
            + '<li><b>4</b><span>竹逸书院</span><em>241 单</em></li>'
            + '<li><b>5</b><span>菊轩书院</span><em>198 单</em></li>'
            + '</ul>'
            + '</div>'
            + '</aside>'
            + '</div>'
        );

        var communityDraft = sessionStorage.getItem('hq.communityDraft');
        if (communityDraft) {
            sessionStorage.removeItem('hq.communityDraft');
            var compose = $('[data-form="tieba-post"] textarea, [data-form="community-text"] textarea');
            if (compose) {
                compose.insertAdjacentHTML('beforebegin', '<p class="community-draft-note">失物招领草稿。补充物品、地点和时间后即可发帖。</p>');
                compose.value = communityDraft;
                compose.focus();
            }
        }
        if (activeTab === 'chat' && activeRoomId === 'hall') {
            await refreshCommunity(true);
            if (currentView.name === 'community') communityTimer = setInterval(function () { refreshCommunity(false); }, 5000);
        }
    }
    function renderCommunityGame() {
        $('#app').innerHTML=shell('community','<div class="game-page-head"><div><span class="tag">COMMUNITY ARCADE</span><h1>Scrap Arena</h1><p>同一台设备，双人键盘对战。</p></div><div class="btn-row"><button class="btn" data-act="go" data-to="#/community">返回社区</button><a class="btn btn-primary" href="/scrap-arena/index.html" target="_blank" rel="noopener">新窗口打开</a></div></div><div class="game-frame-wrap"><iframe class="game-frame" src="/scrap-arena/index.html" title="Scrap Arena 游戏" allow="fullscreen; autoplay"></iframe></div><p class="game-note">点击游戏画面后开始操作。游戏需要键盘；首次加载资源可能需要几秒。P1：W / A / S / D + J / K / L；P2：方向键 + 1 / 2 / 3。按 Enter 开始。</p>');
    }

    // ------------------------------------------------------------------ 后台

    var adminSections = [
        ['dashboard','运营概览'], ['items','物品审核'], ['auctions','拍卖管理'],
        ['report','举报处理'], ['users','账号管理'], ['exchanges','交换记录'], ['activity','操作日志']
    ];
    var adminRenderVersion = 0;

    function adminTable(columns, rows) {
        if (!rows.length) return '<p class="admin-empty">暂无记录</p>';
        return '<div class="admin-table-wrap"><table class="admin-table"><thead><tr>'
            + columns.map(function (label) { return '<th scope="col">'+esc(label)+'</th>'; }).join('')
            + '</tr></thead><tbody>' + rows.map(function (row) {
                return '<tr>'+row.map(function (cell) { return '<td>'+cell+'</td>'; }).join('')+'</tr>';
            }).join('') + '</tbody></table></div>';
    }

    async function renderAdmin() {
        var version = ++adminRenderVersion;
        var tab = state.adminTab;
        var body = '';

        if (tab === 'report') {
            var reports = await api('/admin/report?status='+state.adminReportStatus);
            var rows = (reports || []).map(function (r) {
                return '<div class="card card-pad" style="margin-bottom:10px">'
                    + '<div style="display:flex;gap:6px;align-items:center;margin-bottom:6px">'
                    + '<span class="tag danger">' + (r.targetType === 1 ? '物品' : '用户') + ' #' + r.targetId + '</span>'
                    + '<span style="flex:1"></span><span class="hint" style="margin:0">' + fmtRel(r.createTime) + '</span></div>'
                    + '<p style="margin:0 0 4px;font-size:14px">' + esc(r.reason) + '</p>'
                    + '<p class="hint" style="margin:0">举报人 ' + esc(r.reporterNickname || '匿名')
                    + (r.targetTitle ? ' | 对象「' + esc(r.targetTitle) + '」' : '') + '</p>'
                    + (state.adminReportStatus === 0 ? '<div class="btn-row" style="margin-top:10px">'
                    + '<button class="btn btn-sm btn-primary" data-act="report-act" data-id="' + r.id + '" data-do="approve">认定违规</button>'
                    + '<button class="btn btn-sm btn-ghost" data-act="report-act" data-id="' + r.id + '" data-do="reject">驳回</button>'
                    + '</div>' : (r.handleNote ? '<p class="hint">'+esc(r.handleNote)+'</p>' : '')) + '</div>';
            }).join('');
            body = '<div class="admin-toolbar">' + ['待处理','已认定','已驳回'].map(function(label, index) {
                return '<button class="chip '+(state.adminReportStatus === index ? 'on' : '')+'" data-act="admin-report-status" data-v="'+index+'">'+label+'</button>';
            }).join('') + '</div>' + (rows || '<p class="admin-empty">此状态暂无举报</p>');
        } else if (tab === 'items') {
            var items = await api('/admin/items');
            body = items.length ? items.map(function(it) { var img=firstImage(it.images); return '<article class="auction-card">'+(img?'<img class="auction-image" src="'+esc(img)+'" alt="">':'')+'<h2>'+esc(it.title)+'</h2><p>'+esc(it.description || '')+'</p><p class="hint">发布者：'+esc(it.ownerNickname)+'</p><div class="btn-row"><button class="btn btn-sm btn-primary" data-act="review-listing" data-kind="items" data-do="approve" data-id="'+it.id+'">通过</button><button class="btn btn-sm" data-act="review-listing" data-kind="items" data-do="reject" data-id="'+it.id+'">驳回</button></div></article>'; }).join('') : '<div class="card card-pad">没有待审核物品</div>';
        } else if (tab === 'auctions') {
            var auctions = await api('/admin/auctions');
            body = auctions.length ? auctions.map(function(a) { return auctionCard(a, 'admin'); }).join('') : '<div class="card card-pad">暂无拍卖</div>';
        } else if (tab === 'users') {
            var users = await api('/admin/users?q='+encodeURIComponent(state.adminUserQuery));
            body = '<form class="admin-toolbar" data-form="admin-user-search"><input class="input" name="q" maxlength="60" aria-label="按学号或昵称查找" placeholder="输入学号或昵称" value="'+esc(state.adminUserQuery)+'"><button class="btn btn-primary">搜索</button></form>'
                + adminTable(['学号','昵称','信用分','身份','状态','操作'], users.map(function(u) {
                    var action = u.status === 1 ? 'suspend' : 'restore';
                    return [esc(u.studentNo), esc(u.nickname), u.credit, u.role === 1 ? '管理员' : '普通用户',
                        u.status === 1 ? '正常' : '已停用', u.role === 0
                            ? '<button class="btn btn-sm btn-ghost" data-act="admin-user-status" data-id="'+Number(u.id)+'" data-do="'+action+'">'+(action === 'suspend' ? '停用' : '恢复')+'</button>' : '—'];
                }));
        } else if (tab === 'exchanges') {
            var exchanges = await api('/admin/exchanges');
            var statuses = ['','待确认','待交付','已完成','已失效','已超时关闭'];
            body = adminTable(['交换单','类型','状态','面交地点','创建时间'], exchanges.map(function(e) {
                return ['#'+Number(e.id),e.type === 3 ? '三方成环' : '一对一', statuses[e.status] || '未知',esc(e.place || '待约定'),esc(e.createTime)];
            }));
        } else if (tab === 'activity') {
            var activity = await api('/admin/activity');
            var types = {ITEM:'物品', USER:'账号', OFFER:'报价', EXCHANGE:'交换单', REPORT:'举报'};
            body = adminTable(['时间','操作者','对象','记录'], activity.map(function(entry) {
                return [esc(entry.createTime),entry.actor == null ? '系统' : '#'+Number(entry.actor),
                    esc(types[entry.type] || entry.type)+' #'+Number(entry.target),esc(entry.remark)];
            }));
        } else {
            var d = await api('/admin/dashboard');
            var hot = (d.hotCategories || []).map(function (h, i) {
                var w = d.itemCount ? Math.round(h.total * 100 / d.itemCount) : 0;
                return '<div style="margin-bottom:10px">'
                    + '<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px">'
                    + '<span>' + esc(h.category) + '</span><span class="num" style="color:var(--ink-400)">'
                    + h.total + ' 件</span></div>'
                    + '<div style="height:8px;border-radius:4px;background:var(--bg);overflow:hidden">'
                    + '<div style="width:' + w + '%;height:100%;border-radius:4px;background:linear-gradient(90deg,var(--theme-color),var(--theme-ink))"></div>'
                    + '</div></div>';
            }).join('');
            body = '<div class="stats">'
                + '<div class="stat"><p class="k">成交数</p><p class="v num">' + d.dealCount + '</p></div>'
                + '<div class="stat"><p class="k">成环成功率</p><p class="v num">' + d.ringRate + '<small>%</small></p></div>'
                + '<div class="stat"><p class="k">在架物品</p><p class="v num">' + d.onShelfCount + '</p></div>'
                + '<div class="stat"><p class="k">用户数</p><p class="v num">' + d.userCount + '</p></div>'
                + '</div>'
                + '<div class="card card-pad" style="margin-top:14px">'
                + '<div class="section-title" style="margin:0 0 12px"><h2 style="font-size:16px">热门类别</h2>'
                + '<span class="more">共 ' + d.itemCount + ' 件</span></div>' + (hot || '<p class="hint">暂无数据</p>')
                + '</div>'
                + '<div class="card card-pad" style="margin-top:14px">'
                + '<p class="hint" style="margin:0 0 10px">三方环：进行 ' + d.ringTotal + ' 单，完成 ' + d.ringDone
                + ' 单。待处理举报 ' + d.pendingReport + ' 条。</p>'
                + '<button class="btn btn-ghost btn-sm" data-act="reset-demo">重置演示数据</button>'
                + '</div>';
        }

        if (version !== adminRenderVersion || currentView.name !== 'admin' || tab !== state.adminTab) return;
        var navigation = adminSections.map(function(section) {
            var selected = tab === section[0];
            return '<button class="'+(selected?'on':'')+'" aria-pressed="'+selected+'" data-act="admin-tab" data-v="'+section[0]+'">'+section[1]+'</button>';
        }).join('');
        var title = adminSections.find(function(section) { return section[0] === tab; })[1];
        var content = '<div class="admin-workspace"><nav class="admin-side" aria-label="运营后台"><h1>运营后台</h1>'+navigation
            +'</nav><section class="admin-main"><header class="admin-heading"><h2>'+title+'</h2>'
            +'<button class="btn btn-ghost btn-sm" data-act="admin-refresh">刷新</button></header>'+body+'</section></div>';

        $('#app').innerHTML = shell('admin', content);
    }

    // ------------------------------------------------------------------ 弹层

    var sheetTrigger=null;
    function openSheet(html) {
        if(!$('#modal .sheet'))sheetTrigger=document.activeElement;
        $('#modal').innerHTML='<div class="mask" data-act="mask-close"><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-heading" tabindex="-1"><div class="sheet-grip"></div><button class="sheet-close icon-action" type="button" data-act="sheet-close" aria-label="关闭">'+navIcon('close')+'</button>'+html+'</div></div>';
        var panel=$('#modal .sheet');
        var heading=panel.querySelector('h1,h2,h3');
        if(heading)heading.id='sheet-heading';
        else{panel.removeAttribute('aria-labelledby');panel.setAttribute('aria-label','操作面板');}
        panel.focus();
    }

    function closeSheet() {
        if(!$('#modal .sheet'))return;
        $('#modal').innerHTML='';
        if(sheetTrigger?.isConnected)sheetTrigger.focus();
        sheetTrigger=null;
    }

    async function openOfferSheet(itemId) {
        var mine = await api('/item/mine?status=1');
        if (!mine || mine.length === 0) {
            openSheet('<h3>先发布一件物品</h3><p class="sub">报价要用你的在架物品去换，你还没有在架的物品。</p>'
                + '<button class="btn btn-primary btn-block" data-act="go" data-to="#/publish">去发布</button>');
            return;
        }
        var options = mine.map(function (it) {
            return '<button class="item-card" style="margin-bottom:8px" data-act="pick-offer-item" data-id="' + it.id + '">'
                + thumb(it) + '<div class="item-main"><h3 class="item-title">' + esc(it.title) + '</h3>'
                + '<div class="item-foot"><span class="tag brand">' + esc(it.category) + '</span>'
                + '<span class="tag">' + esc(it.conditionLevel) + '</span></div></div></button>';
        }).join('');
        openSheet('<h3>用哪件去换</h3><p class="sub">选一件你的在架物品，24 小时内等对方回应。</p>'
            + options
            + '<div class="field" style="margin-top:12px"><label class="label">留言 <span class="opt">选填，≤50 字</span></label>'
            + '<input class="input" id="offer-msg" maxlength="50" placeholder="例如 我就在 5 号楼，随时可以面交"></div>'
            + '<input type="hidden" id="offer-target" value="' + itemId + '">');
    }

    async function openPlaceSheet(exchangeId) {
        openSheet('<h3>约个面交点</h3><p class="sub">优先选择校内公共点位，参与者都能看到。</p>'
            + '<form data-form="place"><input type="hidden" name="exchangeId" value="' + exchangeId + '">'
            + '<div class="field"><label class="label">地点</label>'
            + '<select class="select" name="place" required><option value="">请选择校内公共点位</option><option>图书馆门口</option><option>食堂门口</option><option>菜鸟驿站</option><option>校园服务中心</option></select></div>'
            + '<div class="field"><label class="label">时间 <span class="opt">选填</span></label>'
            + '<input class="input" name="dealTime" placeholder="例如 今日 18:00-19:00"></div>'
            + '<button class="btn btn-primary btn-block" type="submit">确定</button></form>');
    }

    function openPendingSheet() {
        var pending = state.pending || [];
        if (!pending.length) {
            toast('没有待评价的交换');
            return;
        }
        var rows = pending.map(function (p) {
            return '<button class="list-row" data-act="user-review" data-exchange="' + p.exchangeId
                + '" data-id="' + p.targetUserId + '" data-nick="' + esc(p.nickname) + '">'
                + '<div class="avatar" style="width:34px;height:34px;border-radius:11px">'
                + esc((p.nickname || '同').slice(0, 1)) + '</div>'
                + '<div class="row-main"><p class="row-title">' + esc(p.nickname) + '</p>'
                + '<p class="row-sub">你给出「' + esc(p.itemTitle || '') + '」</p></div>'
                + '<span class="chev">›</span></button>';
        }).join('');
        openSheet('<h3>待你评价</h3><p class="sub">交换已经完成，给对方留个评价，也能帮别人判断。</p>' + rows);
    }

    function openCreditRule() {
        openSheet('<h3>信用分怎么算</h3>'
            + '<p class="sub">初始 80 分，范围 0–100。低于 60 分不能发布、不能报价、不能凑换物环。</p>'
            + '<div class="rule-list">'
            + '<div class="rule"><span>完成一次交换</span><b class="up">+2</b></div>'
            + '<div class="rule"><span>收到 5 星评价</span><b class="up">+2</b></div>'
            + '<div class="rule"><span>收到 4 星评价</span><b class="up">+1</b></div>'
            + '<div class="rule"><span>收到 3 星评价</span><b>不变</b></div>'
            + '<div class="rule"><span>收到 2 星评价</span><b class="down">−1</b></div>'
            + '<div class="rule"><span>收到 1 星评价</span><b class="down">−2</b></div>'
            + '<div class="rule"><span>超时未确认交付</span><b class="down">−3</b></div>'
            + '<div class="rule"><span>物品被认定违规</span><b class="down">−5</b></div>'
            + '</div>'
            + '<p class="hint" style="margin-top:12px">等级：优秀 ≥ 90 | 良好 ≥ 80 | 一般 ≥ 70 | 较低 ≥ 60 | 受限 &lt; 60</p>'
            + '<p class="hint" style="margin:0">评价只在交换完成后开放，一单评一次，不能改。</p>');
    }

    function openReviewSheet(exchangeId, targets) {
        var list = targets.map(function (t) {
            return '<button class="item-card" style="margin-bottom:8px" data-act="pick-review-target" data-id="' + t.userId + '">'
                + '<div class="avatar" style="width:44px;height:44px;border-radius:14px">'
                + esc((t.nickname || '同').slice(0, 1)) + '</div>'
                + '<div class="item-main"><h3 class="item-title">' + esc(t.nickname || '同学') + '</h3>'
                + '<p class="item-desc">给出「' + esc(t.giveTitle || '') + '」</p></div>'
                + '<span class="chev" style="color:var(--ink-400)">›</span></button>';
        }).join('');
        openSheet('<h3>给谁打分</h3><p class="sub">评价一旦提交不能修改，如实写就好。</p>' + list
            + '<input type="hidden" id="review-exchange" value="' + exchangeId + '">');
    }

    function openReviewForm(exchangeId, targetUserId, nickname) {
        openSheet('<h3>评价 ' + esc(nickname) + '</h3><p class="sub">星级会按"分数 − 3"微调对方信用分。</p>'
            + '<form data-form="review"><input type="hidden" name="exchangeId" value="' + exchangeId + '">'
            + '<input type="hidden" name="targetUserId" value="' + targetUserId + '">'
            + '<input type="hidden" name="score" id="review-score" value="5">'
            + '<div class="stars" id="review-stars" role="radiogroup" aria-label="评分星级" style="margin-bottom:14px">'
            + [1, 2, 3, 4, 5].map(function (n) {
                return '<button type="button" class="star ' + (n <= 5 ? 'on' : '') + '" data-act="set-star" data-n="' + n + '" aria-label="评分 ' + n + ' 星">'+navIcon('star')+'</button>';
            }).join('') + '</div>'
            + '<div class="field"><label class="label">说两句 <span class="opt">选填，≤100 字</span></label>'
            + '<input class="input" name="content" maxlength="100" placeholder="守时、描述属实、沟通顺畅…"></div>'
            + '<button class="btn btn-primary btn-block" type="submit">提交评价</button></form>');
    }

    function openProfileSheet() {
        var me = state.me;
        openSheet('<h3>改资料</h3><p class="sub">宿舍楼会影响环匹配的推荐面交点。</p>'
            + '<form data-form="profile">'
            + '<div class="field"><label class="label">昵称</label>'
            + '<input class="input" name="nickname" maxlength="20" value="' + esc(me.nickname) + '"></div>'
            + '<div class="field"><label class="label">院系</label>'
            + '<input class="input" name="college" value="' + esc(me.college || '') + '"></div>'
            + '<div class="field"><label class="label">宿舍楼</label>'
            + '<input class="input" name="building" value="' + esc(me.building || '') + '"></div>'
            + '<button class="btn btn-primary btn-block" type="submit">保存</button></form>');
    }

    function openReportSheet(type, id) {
        openSheet('<h3>举报</h3><p class="sub">写清楚问题，管理员会尽快处理。恶意举报会被追责。</p>'
            + '<form data-form="report"><input type="hidden" name="targetType" value="' + type + '">'
            + '<input type="hidden" name="targetId" value="' + id + '">'
            + '<div class="field"><label class="label">原因</label>'
            + '<textarea class="textarea" name="reason" maxlength="200" placeholder="例如 描述与实物严重不符" required></textarea></div>'
            + '<button class="btn btn-danger btn-block" type="submit">提交举报</button></form>');
    }

    function renderLanding() {
        setTimeout(refreshNoticeCount, 0);
        var en = localStorage.getItem('hq.lang') === 'en';
        var w = en ? {
            menu:'Menu', close:'Close menu', home:'Home', market:'Marketplace', publish:'List an item', account:'Sign in', language:'Language',
            eyebrow:'A LITTLE MORE LIFE FOR EVERY THING', title:'Good things.<br>Another round.', sub:'Swap what you have for what you love.', explore:'Explore the marketplace', how:'How it works',
            feature1:'Pass it on.', desc1:'Give your unused things a new story.', feature2:'Find your match.', desc2:'Two people, or a circle of three.', feature3:'Meet on campus.', desc3:'Close by. Simple to exchange.', footer:'MADE FOR CAMPUS | MADE TO SHARE', langnote:'Language applies to this page.'
        } : {
            menu:'展开菜单', close:'关闭菜单', home:'首页', market:'逛逛集市', publish:'发布闲置', account:'登录 / 注册', language:'语言',
            eyebrow:'让好物，继续发光', title:'好东西，<br>再转一圈。', sub:'你暂时不用的，正是别人想要的。', explore:'逛逛集市', how:'了解换物',
            feature1:'闲置，出发。', desc1:'让好物开启下一段故事。', feature2:'换个可能。', desc2:'两人交换，或三人成环。', feature3:'就在校园。', desc3:'离得近，交换更简单。', footer:'校园换物 | 让分享发生', langnote:'语言切换适用于本页。'
        };
        document.documentElement.lang = en ? 'en' : 'zh-CN';
        $('#app').innerHTML = '<div class="landing"><header class="land-header"><button class="land-menu-toggle" type="button" data-act="landing-menu" aria-expanded="false" aria-controls="landing-menu" aria-label="'+w.menu+'">'+navIcon('menu')+'</button><a class="land-brand" href="#/home"><span class="land-brand-mark" aria-hidden="true">'+navIcon('trade')+'</span>换一圈<span class="land-brand-en">ROUND AGAIN</span></a><a class="land-header-link land-notices" href="#/notifications">'+(en?'Messages':'消息')+'<span class="notice-count" hidden></span></a><a class="land-header-link" href="#/market">'+w.market+' <span aria-hidden="true">'+navIcon('external')+'</span></a></header>'
        + '<div class="land-scrim" data-act="landing-menu-close" hidden></div><aside class="land-drawer" id="landing-menu" aria-label="'+w.menu+'" hidden><div class="land-drawer-top"><b>MENU / 菜单</b><button data-act="landing-menu-close" aria-label="'+w.close+'">×</button></div><nav><a href="#/home">'+w.home+'</a><a href="#/market">'+w.market+'</a><a href="#/publish">'+w.publish+'</a><a href="#/community">'+(en ? 'Community' : '校园社区')+'</a><a href="#/notifications">'+(en ? 'Notifications' : '消息通知')+' <span class="notice-count" hidden></span></a><a href="#/admin">'+(en ? 'Admin' : '管理后台')+'</a><a href="#/login">'+w.account+'</a></nav><div class="land-language"><span>'+w.language+'</span><div><button data-act="landing-lang" data-lang="zh" aria-pressed="'+(!en)+'">中文</button><button data-act="landing-lang" data-lang="en" aria-pressed="'+en+'">EN</button></div><small>'+w.langnote+'</small></div></aside>'
        + '<main><section class="land-hero"><div class="land-hero-copy"><p class="land-eyebrow">'+w.eyebrow+'</p><h1>'+w.title+'</h1><p class="land-sub">'+w.sub+'</p><div class="land-actions"><a class="land-primary" href="#/market">'+w.explore+' <span aria-hidden="true">'+navIcon('external')+'</span></a><button class="land-secondary" data-act="landing-how">'+w.how+' <span aria-hidden="true">'+navIcon('down')+'</span></button></div></div><div class="land-illustration" aria-hidden="true"><div class="land-orbit orbit-one"></div><div class="land-orbit orbit-two"></div><div class="land-art-card art-one">'+navIcon('book')+'</div><div class="land-art-card art-two">'+navIcon('life')+'</div><div class="land-art-card art-three">'+navIcon('clothes')+'</div><div class="land-art-center">'+navIcon('trade')+'</div><span class="land-art-label">GOOD THINGS<br>GO AROUND.</span></div></section><section class="land-features" id="landing-how"><div class="land-section-head"><span>01 / THE IDEA</span><h2>'+w.how+'<span>.</span></h2></div><div class="land-feature-grid"><article><span>01</span><h3>'+w.feature1+'</h3><p>'+w.desc1+'</p></article><article><span>02</span><h3>'+w.feature2+'</h3><p>'+w.desc2+'</p></article><article><span>03</span><h3>'+w.feature3+'</h3><p>'+w.desc3+'</p></article></div></section></main><footer class="land-footer"><b>换一圈</b><span>'+w.footer+'</span><a href="#/market">'+w.explore+' ↗</a></footer></div>';
    }

    function renderAppraise() {
        var catButtons = CATS.map(function (c, i) {
            return '<button type="button" class="ai-chip ' + (i === 1 ? 'on' : '') + '" onclick="this.parentElement.querySelectorAll(\'.ai-chip\').forEach(function(b){b.classList.remove(\'on\')});this.classList.add(\'on\');document.getElementById(\'ai-cat-input\').value=\'' + esc(c) + '\'">' + esc(c) + '</button>';
        }).join('');
        var condOptions = [
            ['new', '全新', '90%~95% 保值'],
            ['light', '九成新', '65%~80% 热换'],
            ['seven', '七成新', '45%~65% 性价比'],
            ['used', '有使用痕迹', '25%~45% 秒出']
        ].map(function (c, i) {
            return '<button type="button" class="ai-chip ' + (i === 1 ? 'on' : '') + '" onclick="this.parentElement.querySelectorAll(\'.ai-chip\').forEach(function(b){b.classList.remove(\'on\')});this.classList.add(\'on\');document.getElementById(\'estimate-condition\').value=\'' + c[0] + '\'"><b>' + c[1] + '</b><small>' + c[2] + '</small></button>';
        }).join('');

        var sampleBenchmarks = [
            {name: '罗技 GPW 二代无线游戏鼠标', cat: '数码', orig: 599, est: '260 ~ 320', cond: 'light', img: '/assets/amz/quad-digital.jpg'},
            {name: '2026同济高数+张宇1000题全套', cat: '教材', orig: 128, est: '35 ~ 55', cond: 'light', img: '/assets/amz/quad-books.jpg'},
            {name: '富士 Instax mini11 拍立得相机', cat: '数码', orig: 520, est: '280 ~ 350', cond: 'new', img: '/assets/amz/quad-auction.jpg'},
            {name: '米家智能LED长臂护眼台灯 1S', cat: '生活', orig: 149, est: '55 ~ 80', cond: 'light', img: '/assets/amz/quad-dorm.jpg'},
            {name: '尤尼克斯 24磅碳素羽毛球拍', cat: '运动', orig: 260, est: '110 ~ 145', cond: 'light', img: '/assets/amz/quad-sports.jpg'},
            {name: '卡西欧 fx-991CN X 函数计算器', cat: '教材', orig: 135, est: '50 ~ 75', cond: 'new', img: '/assets/amz/quad-grad.jpg'}
        ].map(function (b) {
            return '<div class="ai-bench-row">'
                + '<img src="' + b.img + '" alt="">'
                + '<div class="ai-bench-info"><b>' + esc(b.name) + '</b><span>原价 ¥' + b.orig + '</span></div>'
                + '<div class="ai-bench-price"><b>¥' + b.est + '</b><button type="button" onclick="document.getElementById(\'estimate-title\').value=\'' + esc(b.name) + '\';document.getElementById(\'estimate-price\').value=\'' + b.orig + '\';document.querySelector(\'[data-form=estimate]\').requestSubmit();">填入测算</button></div>'
                + '</div>';
        }).join('');

        var content = '<div class="ali-auction-page ai-appraise-page">'
            + '<header class="ali-sub-header">'
            + '<div class="ali-sub-brand">'
            + '<span class="ali-brand-main">小唤 AI 好物估价中心</span>'
            + '</div>'
            + '<nav class="ali-sub-nav" aria-label="AI估价导航">'
            + '<a href="#/appraise" class="on">AI 估价</a>'
            + '<a href="#/idle">去集市比价</a>'
            + '<a href="#/auctions">校园拍卖</a>'
            + '<a href="#/relay">换物接力</a>'
            + '</nav>'
            + '<div class="ali-sub-actions">'
            + '<a class="btn btn-primary btn-sm" href="#/publish">+ 去发布</a>'
            + '</div>'
            + '</header>'

            + '<div class="ai-workbench-grid">'
            + '<section class="ai-main-card">'
            + '<div class="ai-card-head">'
            + '<div><h2>AI 智能估价</h2></div>'
            + '</div>'

            + '<form class="estimate-form ai-form-body" data-form="estimate">'
            + '<label class="ai-upload-zone" for="ai-photo-input">'
            + '<input id="ai-photo-input" type="file" accept="image/*" hidden onchange="var f=this.files&&this.files[0];if(f){var u=URL.createObjectURL(f);var p=document.getElementById(\'ai-photo-preview\');p.innerHTML=\'<img src=&quot;\'+u+\'&quot; alt=&quot;预览&quot;><span>已上传</span>\';}">'
            + '<span class="ai-corner tl"></span><span class="ai-corner tr"></span><span class="ai-corner bl"></span><span class="ai-corner br"></span>'
            + '<div id="ai-photo-preview" class="ai-upload-inner">'
            + '<span class="ai-cam-ico">' + navIcon('camera') + '</span>'
            + '<b>上传物品图片（选填）</b>'
            + '</div>'
            + '</label>'

            + '<div class="ai-input-row">'
            + '<div class="ai-field">'
            + '<label class="label" for="estimate-title">物品名称</label>'
            + '<input class="input" id="estimate-title" name="title" placeholder="例如 罗技 GPW 二代 / 同济高数第七版">'
            + '</div>'
            + '<div class="ai-field">'
            + '<label class="label" for="estimate-price">入手原价（元）*</label>'
            + '<input class="input" id="estimate-price" name="price" type="number" min="1" max="100000" placeholder="¥ 请输入入手价，如 299" required>'
            + '</div>'
            + '</div>'

            + '<input type="hidden" id="ai-cat-input" name="category" value="数码">'
            + '<input type="hidden" id="estimate-condition" name="condition" value="light">'

            + '<div class="ai-chip-section">'
            + '<span class="ai-sec-label">所属分类</span>'
            + '<div class="ai-chip-grid">' + catButtons + '</div>'
            + '</div>'

            + '<div class="ai-chip-section">'
            + '<span class="ai-sec-label">新旧成色</span>'
            + '<div class="ai-chip-grid cond-grid">' + condOptions + '</div>'
            + '</div>'

            + '<div class="ai-submit-row">'
            + '<button class="btn btn-primary ai-submit-btn" type="submit">' + clayIcon('ai', 'AI', 'is-sm') + ' 立即开始 AI 智能估价</button>'
            + '</div>'

            + '<div id="ai-mascot-Evaluating" class="ai-evaluating-box" hidden>'
            + '<img src="/assets/brand/mascot-search.png" alt="小唤正在估价中" class="ai-eval-mascot">'
            + '<div><b>小唤正在为您估价…</b></div>'
            + '</div>'

            + '<div id="estimate-result" class="ai-result-panel" role="status">'
            + '<div class="ai-result-placeholder">'
            + '<img src="/assets/brand/mascot-wave-320.webp" alt="小唤">'
            + '<div><b>输入入手原价后点击上方按钮，小唤立即给出参考价</b></div>'
            + '</div>'
            + '</div>'
            + '</form>'
            + '</section>'

            + '<aside class="ai-side-col">'
            + '<div class="ai-mascot-hero-card">'
            + '<div class="ai-mascot-art-wrap"><img src="/assets/amz/mascot-credit-card.png" alt="小唤"></div>'
            + '<div class="ai-mascot-copy">'
            + '<span class="ai-advisor-tag">小唤估价助手</span>'
            + '<h3>“拿不准定什么价？让小唤帮你算！”</h3>'
            + '</div>'
            + '</div>'

            + '<div class="ai-bench-card">'
            + '<div class="ai-bench-head"><h3>热门估价参考</h3></div>'
            + '<div class="ai-bench-list">' + sampleBenchmarks + '</div>'
            + '</div>'
            + '</aside>'
            + '</div>'
            + '</div>';

        $('#app').innerHTML = shell('market', content);
    }

    // ------------------------------------------------------------------ 路由

    var routes = [
        [/^#\/appraise(?:\?.*)?$/, function () { return 'appraise'; }],
        [/^#\/followers$/, function () { return 'followers'; }],
        [/^#\/home(?:\?.*)?$/, function () { return 'home'; }],
        [/^#\/(?:market|idle|search)(?:\?.*)?$/, function () { return 'home'; }],
        [/^#\/auctions(?:\?.*)?$/, function () { return 'auctions'; }],
        [/^#\/community(?:\?.*)?$/, function () { return 'community'; }],
        [/^#\/notifications(?:\?.*)?$/, function () { return 'notifications'; }],
        [/^#\/chats$/, function () { return 'chats'; }],
        [/^#\/chat\/(\d+)$/, function () { return 'chat'; }],
        [/^#\/ring\/(\d+)$/, function () { return 'ringChat'; }],
        [/^#\/wishes(?:\/(\d+))?(?:\?.*)?$/, function () { return 'wishes'; }],
        [/^#\/community\/game$/, function () { return 'communityGame'; }],
        [/^#\/auction\/new$/, function () { return 'auctionNew'; }],
        [/^#\/auction\/mine$/, function () { return 'auctionMine'; }],
        [/^#\/item\/(\d+)$/, function (m) { return 'item'; }],
        [/^#\/item\/(\d+)\/edit$/, function (m) { return 'itemEdit'; }],
        [/^#\/publish$/, function () { return 'publishEntry'; }],
        [/^#\/publish\/success\/(\d+)$/, function () { return 'publishSuccess'; }],
        [/^#\/publish\/edit$/, function () { return 'publish'; }],
        [/^#\/offers$/, function () { return 'offers'; }],
        [/^#\/trade$/, function () { return 'offers'; }],
        [/^#\/relay(?:\?.*)?$/, function () { return 'relay'; }],
        [/^#\/cycle\/(\d+)$/, function (m) { return 'cycle'; }],
        [/^#\/exchange$/, function () { return 'exchange'; }],
        [/^#\/exchange\/(\d+)$/, function (m) { return 'exchangeDetail'; }],
        [/^#\/user\/(\d+)$/, function () { return 'user'; }],
        [/^#\/me\/([a-z-]+)$/, function () { return 'meSub'; }],
        [/^#\/me$/, function () { return 'me'; }],
        [/^#\/(?:favorites|history)$/, function () { return 'shelf'; }],
        [/^#\/email$/, function () { return 'email'; }],
        [/^#\/settings$/, function () { return 'settings'; }],
        [/^#\/admin$/, function () { return 'admin'; }],
        [/^#\/login$/, function () { return 'login'; }]
    ];

    var currentView = {name: 'home', arg: null};

    function parseRoute() {
        var hash = location.hash || '#/home';
        var qIdx = hash.indexOf('?');
        var base = qIdx >= 0 ? hash.slice(0, qIdx) : hash;
        var prevHash = state._lastHash || '';
        if (hash !== prevHash) {
            state._lastHash = hash;
            var qs = qIdx >= 0 ? new URLSearchParams(hash.slice(qIdx + 1)) : null;
            if (qs && qs.has('cat')) {
                state.home.category = qs.get('cat') || '';
                state.home.minCredit = 0;
            } else if (base === '#/idle' && prevHash.indexOf('cat=') >= 0) {
                state.home.category = '';
            }
            if (qs && qs.has('room')) {
                state.commRoom = qs.get('room') || 'hall';
            }
        }
        for (var i = 0; i < routes.length; i++) {
            var m = hash.match(routes[i][0]);
            if (m) {
                var vName = routes[i][1](m);
                var arg = vName === 'meSub' ? (m[1] || 'notices') : (m[1] ? Number(m[1]) : null);
                return {name: vName, arg: arg};
            }
        }
        return {name: 'home', arg: null};
    }

    async function render() {
        if (communityTimer) { clearInterval(communityTimer); communityTimer = null; }
        if (roomTimer) { clearInterval(roomTimer); roomTimer = null; }
        var view = parseRoute();
        currentView = view;
        setTimeout(refreshNoticeCount, 0);

        if (view.name === 'shelf') { renderShelf();return; }
        if (view.name === 'appraise') { renderAppraise(); return; }
        if (view.name === 'landing') { renderLanding(); return; }
        if (view.name === 'login') {
            renderLogin(state.loginMode || 'login');
            return;
        }
        if (!state.me && view.name !== 'home' && view.name !== 'relay' && view.name !== 'settings' && view.name !== 'auctions' && view.name !== 'item' && view.name !== 'user' && view.name !== 'community' && view.name !== 'wishes') {
            try {
                state.me = await api('/user/me');
            } catch (e) {
                if (!(e instanceof ApiError) || e.code !== 401) {
                    $('#app').innerHTML = '<div class="auth-wrap"><div class="auth-card">'
                        + '<h1>连不上后端</h1><p class="lead">' + esc(e.message || '') + '</p>'
                        + '<p class="hint">确认后端已在 8080 端口启动。命令：<br><code>mvn exec:java</code></p>'
                        + '</div></div>';
                }
                return;
            }
        } else if (!state.me && readToken()) {
            try { state.me = await api('/user/me', {optionalAuth: true}); } catch (e) {}
        }

        try {
            if (view.name === 'email') { await renderEmail(); } else if (view.name === 'settings') {
                renderSettings();
            } else if (view.name === 'home') {
                if((location.hash || '').split('?')[0]==='#/search'&&!state.home.keyword){renderSearchPage('');}
                else if(await loadHome(true))renderHome();
            } else if (view.name === 'auctions') {
                await renderAuctions();
            } else if (view.name === 'auctionMine') {
                await renderAuctions(true);
            } else if (view.name === 'followers') {
                await renderFollowers();
            } else if (view.name === 'notifications') {
                await renderNotifications();
            } else if (view.name === 'chats') { await renderChats();
            } else if (view.name === 'chat') { await renderRoom(view.arg,false);
            } else if (view.name === 'ringChat') { await renderRoom(view.arg,true);
            } else if (view.name === 'wishes') { await renderWishes();
            } else if (view.name === 'community') {
                await renderCommunity();
            } else if (view.name === 'communityGame') {
                renderCommunityGame();
            } else if (view.name === 'auctionNew') {
                renderAuctionNew();
            } else if (view.name === 'item') {
                await renderItem(view.arg);
            } else if (view.name === 'itemEdit') {
                await renderItemEdit(view.arg);
            } else if (view.name === 'publishSuccess') {
                $('#app').innerHTML=shell('publish','<section class="redesign-page publish-success"><img src="/assets/brand/mascot-success.png" width="144" height="144" alt=""><h1>已提交审核</h1><p>通过后会出现在集市。</p><div class="btn-row"><a class="btn btn-primary" href="#/publish/edit">再发一件</a><a class="btn btn-ghost" href="#/item/'+view.arg+'">去看看</a></div></section>');
            } else if (view.name === 'publishEntry') {
                renderPublishEntry();
            } else if (view.name === 'publish') {
                renderPublish();
            } else if (view.name === 'offers') {
                await renderOffers();
            } else if (view.name === 'relay') {
                await renderRelay();
            } else if (view.name === 'cycle') {
                await renderCycle(view.arg);
            } else if (view.name === 'exchange') {
                await renderExchanges();
            } else if (view.name === 'exchangeDetail') {
                await renderExchangeDetail(view.arg);
            } else if (view.name === 'user') {
                await renderUser(view.arg);
            } else if (view.name === 'meSub') {
                await renderMeSub(view.arg);
            } else if (view.name === 'me') {
                await renderMe();
            } else if (view.name === 'admin') {
                if (!state.me || state.me.role !== 1) {
                    toast('只有管理员能进后台', 'err');
                    go('#/me');
                    return;
                }
                await renderAdmin();
            }
        } catch (e) {
            if (e && e.code === 401) return;
            $('#app').innerHTML = shell('home', '<div class="page-head"><h1>出了点问题</h1><p>'
                + esc(e.message || '未知错误') + '</p></div>'
                + '<button class="btn btn-ghost" data-act="go" data-to="#/home">回集市</button>');
        }
    }

    // ------------------------------------------------------------------ 交互绑定

    document.addEventListener('click', async function (ev) {
        var el = ev.target.closest('[data-act]');
        if (!el) return;
        var act = el.dataset.act;

        if (act === 'scroll-top') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        if (act === 'f-credit') {
            var nextCredit = Number(el.dataset.v || 0);
            state.home.minCredit = state.home.minCredit === nextCredit ? 0 : nextCredit;
            if (state.home.items && state.home.items.length) {
                renderHome();
            } else if (await loadHome(true)) {
                renderHome();
            }
            return;
        }
        if (act === 'relay-cat') {
            state.relayCat = el.dataset.v || '全部';
            await renderRelay();
            return;
        }
        if (act === 'auction-cat') {
            state.auctionCat = state.auctionCat === el.dataset.v ? '全部' : (el.dataset.v || '全部');
            await renderAuctions(currentView.name === 'auctionMine');
            return;
        }
        if (act === 'auction-state') {
            state.auctionState = el.dataset.v || 'all';
            await renderAuctions(currentView.name === 'auctionMine');
            return;
        }
        if (act === 'auction-sort') {
            state.auctionSort = el.dataset.v || 'default';
            await renderAuctions(currentView.name === 'auctionMine');
            return;
        }
        if (act === 'auction-reset') {
            state.auctionCat = '全部';
            state.auctionState = 'all';
            state.auctionSort = 'default';
            await renderAuctions(currentView.name === 'auctionMine');
            return;
        }
        if (act === 'wish-cat') {
            state.wishCat = el.dataset.v || '全部';
            await renderWishes();
            return;
        }
        if (act === 'orders-adv') {
            state.offersAdvOpen = !state.offersAdvOpen;
            if (currentView.name === 'exchange') await renderExchanges();
            else await renderOffers();
            return;
        }
        if (act === 'offers-status') {
            state.offersStatusFilter = el.dataset.v || 'all';
            await renderOffers();
            return;
        }
        if (act === 'orders-reset') {
            state.offersQuery = '';
            state.offersStatusFilter = 'all';
            state.hiddenDemoOrders = [];
            if (currentView.name === 'exchange') await renderExchanges();
            else await renderOffers();
            return;
        }
        if (act === 'demo-order-hide') {
            var orderNo = el.dataset.no;
            if (orderNo && state.hiddenDemoOrders.indexOf(orderNo) < 0) state.hiddenDemoOrders.push(orderNo);
            toast('已移出此示例订单');
            if (currentView.name === 'exchange') await renderExchanges();
            else await renderOffers();
            return;
        }
        if (act === 'im-select') {
            var nextIdx = Number(el.dataset.idx || 0);
            state.activeNoticeIdx = nextIdx;
            try {
                var readMap = JSON.parse(localStorage.getItem('hq.imRead') || '{}') || {};
                readMap[nextIdx] = true;
                localStorage.setItem('hq.imRead', JSON.stringify(readMap));
            } catch (e) {}
            await renderNotifications();
            return;
        }
        if (act === 'im-phrase-menu') {
            var phraseBar = $('#tb-phrase-bar');
            if (phraseBar) phraseBar.hidden = !phraseBar.hidden;
            return;
        }
        if (act === 'im-phrase-pick') {
            var imIn = $('#tb-im-input');
            var pBar = $('#tb-phrase-bar');
            if (imIn) {
                imIn.value = el.dataset.v || '';
                var cEl = $('#tb-char-count');
                if (cEl) cEl.textContent = imIn.value.length + ' / 500';
                imIn.focus();
            }
            if (pBar) pBar.hidden = true;
            return;
        }
        if (act === 'im-insert-ai') {
            var aiIn = $('#tb-im-input');
            if (aiIn) {
                var tip = '【小唤AI估价建议】该类好物近期成交区间约 ¥120-165，支持等价互换或小额补差面交。';
                aiIn.value = aiIn.value ? (aiIn.value + ' ' + tip) : tip;
                var cntEl = $('#tb-char-count');
                if (cntEl) cntEl.textContent = aiIn.value.length + ' / 500';
                aiIn.focus();
            }
            return;
        }
        if (act === 'im-insert-card' || act === 'im-send') {
            var idx = Number(state.activeNoticeIdx || 0);
            var imMap = {};
            try { imMap = JSON.parse(localStorage.getItem('hq.imThreads') || '{}') || {}; } catch (e) { imMap = {}; }
            if (!Array.isArray(imMap[idx])) imMap[idx] = [];
            var nowD = new Date();
            var tStr = String(nowD.getHours()).padStart(2, '0') + ':' + String(nowD.getMinutes()).padStart(2, '0');
            if (act === 'im-insert-card') {
                imMap[idx].push({
                    kind: 'card',
                    title: '发起了校园闲置互换意向卡片',
                    text: '罗技 GPW 二代无线鼠标（95新）换物申请',
                    sub: '预约北山书院面交，点此查看报价',
                    img: '/assets/amz/quad-digital.jpg',
                    to: '#/offers',
                    time: tStr
                });
            } else {
                var boxIn = $('#tb-im-input');
                var txt = (boxIn && boxIn.value || '').trim();
                if (!txt) { toast('请输入要发送的消息内容', 'err'); return; }
                imMap[idx].push({kind: 'text', text: txt, time: tStr});
            }
            try { localStorage.setItem('hq.imThreads', JSON.stringify(imMap)); } catch (e) {}
            await renderNotifications();
            var streamBox = document.querySelector('.tb-chat-stream');
            if (streamBox) streamBox.scrollTop = streamBox.scrollHeight;
            return;
        }
        if (act === 'im-scroll-bottom') {
            var stEl = document.querySelector('.tb-chat-stream');
            if (stEl) stEl.scrollTo({ top: stEl.scrollHeight, behavior: 'smooth' });
            return;
        }
        if (act === 'comm-room') {
            state.commRoom = el.dataset.room || 'hall';
            await renderCommunity();
            return;
        }
        if (act === 'comm-tab') {
            state.commTab = el.dataset.v || 'posts';
            await renderCommunity();
            return;
        }
        if (act === 'open-room') {
            state.commRoom = el.dataset.room || 'hall';
            state.commTab = 'posts';
            go('#/community');
            return;
        }
        if (act === 'toggle-follow-room') {
            var rId = el.dataset.room;
            if (!rId) return;
            var fl = getRoomFollows().slice();
            var pos = fl.indexOf(rId);
            if (pos >= 0) { fl.splice(pos, 1); toast('已取消关注该贴吧'); }
            else { fl.push(rId); toast('已关注该贴吧'); }
            setRoomFollows(fl);
            if (currentView.name === 'meSub') await renderMeSub('channels');
            else await renderCommunity();
            return;
        }
        if (act === 'open-create-room') {
            openCreateRoomSheet();
            return;
        }
        if (act === 'delete-custom-room') {
            var delId = el.dataset.room;
            if (!delId || !confirm('确定删除这个自建聊天室吗？')) return;
            var curCustom = [];
            try { curCustom = JSON.parse(localStorage.getItem('hq.customRooms') || '[]'); } catch (e) { curCustom = []; }
            curCustom = (Array.isArray(curCustom) ? curCustom : []).filter(function (r) { return r.id !== delId; });
            try { localStorage.setItem('hq.customRooms', JSON.stringify(curCustom)); } catch (e) {}
            if (state.commRoom === delId) state.commRoom = 'hall';
            toast('已删除自建聊天室');
            await renderCommunity();
            return;
        }
        if (act === 'tieba-like') {
            var postId = el.dataset.id;
            if (!postId) return;
            var likesMap = {};
            try { likesMap = JSON.parse(localStorage.getItem('hq.tiebaLikes') || '{}') || {}; } catch (e) { likesMap = {}; }
            var lkKey = 'u_' + postId;
            likesMap[lkKey] = !likesMap[lkKey];
            try { localStorage.setItem('hq.tiebaLikes', JSON.stringify(likesMap)); } catch (e) {}
            await renderCommunity();
            return;
        }
        if (act === 'tieba-toggle-comments') {
            var cPid = el.dataset.id;
            if (!cPid) return;
            var opened = !state.tiebaOpenComments[cPid];
            state.tiebaOpenComments[cPid] = opened;
            el.classList.toggle('on', opened);
            var cardEl = el.closest('.tieba-post-card');
            var cBox = cardEl && cardEl.querySelector('.tieba-comments');
            if (cBox) cBox.hidden = !opened;
            return;
        }
        if (act === 'tieba-delete-post') {
            var dpId = el.dataset.id;
            if (!dpId || !confirm('确定删除这条帖子？')) return;
            var postsArr = [];
            try { postsArr = JSON.parse(localStorage.getItem('hq.tiebaPosts') || '[]'); } catch (e) { postsArr = []; }
            postsArr = (Array.isArray(postsArr) ? postsArr : []).filter(function (p) { return p.id !== dpId; });
            try { localStorage.setItem('hq.tiebaPosts', JSON.stringify(postsArr)); } catch (e) {}
            toast('帖子已删除');
            await renderCommunity();
            return;
        }
        if (act === 'tieba-clear-img') {
            var tDraft = document.querySelector('[data-form="tieba-post"] input[name="title"]')?.value || '';
            var bDraft = document.querySelector('[data-form="tieba-post"] textarea[name="body"]')?.value || '';
            state.tiebaPostImg = '';
            await renderCommunity();
            var tIn = document.querySelector('[data-form="tieba-post"] input[name="title"]');
            var bIn = document.querySelector('[data-form="tieba-post"] textarea[name="body"]');
            if (tIn && tDraft) tIn.value = tDraft;
            if (bIn && bDraft) bIn.value = bDraft;
            return;
        }
        if (act === 'amz-thumb') {
            var mainImg = $('#amz-main-img');
            if (mainImg && el.dataset.src) mainImg.src = el.dataset.src;
            document.querySelectorAll('.amz-thumb-btn').forEach(function (b) { b.classList.toggle('on', b === el); });
            return;
        }

        if (act === 'register-email-send') {
            var email = el.form.elements.email;
            var studentNo = el.form.elements.studentNo.value.trim();
            if (!/^[0-9]{10}$/.test(studentNo)) { toast('请输入 10 位学号', 'err'); return; }
            if (!email.reportValidity()) return;
            el.disabled = true;
            try {
                await api('/user/register/email/send', {method:'POST', body:{studentNo:studentNo,email:email.value.trim()}});
                toast('验证码已发送，请查收邮箱', 'ok');
                el.form?.elements.code.focus();
                setTimeout(function() { el.disabled = false; }, 60000);
            } catch (error) { el.disabled = false; toast(error.message, 'err'); }
            return;
        }

        if(act==='publish-template'){
            var description=el.form.elements.description;
            var insertion=(description.value?'\n':'')+el.dataset.v;
            if(description.value.length+insertion.length>description.maxLength){toast('描述已接近字数上限','err');return;}
            description.value+=insertion;
            description.dispatchEvent(new Event('input',{bubbles:true}));
            description.focus();
            return;
        }
        if(act==='skip-main'){ev.preventDefault();$('#main-content')?.focus();return;}
        if(act==='search-clear-history'){
            if(!confirm('清空本机搜索历史？'))return;
            try{localStorage.removeItem('hq.searchHistory');}catch(e){}
            renderSearchPage('');return;
        }
        if(act==='search-term'){
            state.home.keyword=el.dataset.v;
            rememberSearch(state.home.keyword);
            if(await loadHome(true))renderHome();
            return;
        }
        if(act==='profile-tab'){
            var selected=el.dataset.v;
            document.querySelectorAll('[data-profile-panel]').forEach(function(panel){panel.hidden=panel.dataset.profilePanel!==selected;});
            document.querySelectorAll('[data-act="profile-tab"]').forEach(function(button){button.setAttribute('aria-pressed',String(button===el));});
            return;
        }
        if(act==='profile-share'){
            if(navigator.share){try{await navigator.share({title:'换一圈个人主页',url:location.href});return;}catch(e){if(e.name==='AbortError')return;}}
            openSheet('<h3>分享个人主页</h3><label class="label" for="profile-link">主页链接</label><input class="input" id="profile-link" readonly value="'+esc(location.href)+'">');
            $('#profile-link')?.select();
            return;
        }
        if (act==='estimate') { openEstimate();return; }
        if (act==='lost-found') {
            sessionStorage.setItem('hq.communityDraft','【失物招领】物品：　地点：　时间：');
            go('#/community');return;
        }
        if (act==='campus-search') {
            state.home.keyword=el.dataset.v;
            state.home.category='';
            state.home.condition='';
            go('#/search');
            return;
        }
        if(act==='home-feed'){
            ev.preventDefault();
            document.querySelector('.market-feed')?.scrollIntoView({block:'start'});
            return;
        }
        if(act==='shelf-toggle'){
            var id=Number(el.dataset.id),items=shelfRead('favorites'),saved=items.some(function(x){return x.id===id;});
            await withBusy(el,async function(){
                var ok=saved?shelfWrite('favorites',items.filter(function(x){return x.id!==id;})):shelfRemember('favorites',(await api('/item/'+id)).item);
                if(ok){
                    el.setAttribute('aria-pressed',String(!saved));
                    el.textContent = saved ? '加入收藏夹' : '✓ 已加入收藏夹';
                    var badge = $('.amz-cart-num');
                    if (badge) badge.textContent = String(shelfRead('favorites').length);
                }
            });return;
        }
        if(act==='shelf-remove'){var key=el.dataset.key;if(shelfWrite(key,shelfRead(key).filter(function(x){return x.id!==Number(el.dataset.id); })))renderShelf();return;}
        if(act==='shelf-clear'){var cKey=el.dataset.key||'history';if(confirm('清空当前浏览器的'+(cKey==='favorites'?'收藏记录':'浏览历史')+'？')&&shelfWrite(cKey,[]))renderShelf();return;}
        if (act === 'theme-select') { applyTheme(el.dataset.theme, true); return; }
        if (act === 'theme-reset') { applyTheme(THEME_DEFAULT, true); return; }
        if (act === 'chat-start') { await withBusy(el,async function(){var t=await api('/conversation/start',{method:'POST',body:{itemId:Number(el.dataset.id)}});go('#/chat/'+t.id);});return; }
        if (act === 'wish-close') { if(!confirm('关闭这条求换信息？'))return;await withBusy(el,async function(){await api('/wish/'+el.dataset.id+'/close',{method:'POST'});await renderWishes();});return; }
        if (act === 'notice-open') { ev.preventDefault(); await withBusy(el,async function(){await api('/notification/'+el.dataset.id+'/read',{method:'POST'});await refreshNoticeCount();go(el.dataset.to);});return; }
        if (act === 'notice-read') { await withBusy(el,async function(){await api('/notification/read',{method:'POST'});await renderNotifications();toast('已全部标为已读');});return; }
        if (act === 'landing-menu' || act === 'landing-menu-close') {
            var drawer = $('#landing-menu'), scrim = $('.land-scrim'), toggle = $('.land-menu-toggle');
            var opening = act === 'landing-menu' && drawer.hidden;
            drawer.hidden = !opening; scrim.hidden = !opening; toggle.setAttribute('aria-expanded', String(opening));
            if (opening) { drawer.querySelector('button').focus(); refreshNoticeCount(); } else toggle.focus();
            return;
        }
        if (act === 'landing-how') { $('#landing-how').scrollIntoView({behavior:'smooth'}); return; }
        if (act === 'landing-lang') { localStorage.setItem('hq.lang', el.dataset.lang); renderLanding(); return; }
        if (act === 'community-share') { await withBusy(el,async function(){var items=await api('/item/mine?status=1'); openSheet('<h3>分享我的物品</h3><p class="sub">选择一件已上架的物品分享到公共聊天室。</p>'+(items.length?items.map(function(it){return '<button class="chat-share-option" data-act="community-share-send" data-id="'+it.id+'">'+thumb(it)+'<span>'+esc(it.title)+'</span></button>';}).join(''):'<p>你还没有已上架的物品。</p>')); });return; }
        if (act === 'community-share-send') { await withBusy(el,async function(){await api('/community',{method:'POST',body:{kind:'item',itemId:Number(el.dataset.id)}});closeSheet();await refreshCommunity(true);});return; }
        if (act === 'auction-bid') {
            if (!readToken() && !state.me) { sessionStorage.setItem('hq.returnTo', '#/auctions'); go('#/login'); return; }
            openSheet('<h3>参与竞拍</h3><p class="sub">人民币出价，平台不提供支付。请遵守线下交易约定。</p><form data-form="auction-bid"><input type="hidden" name="id" value="' + esc(el.dataset.id) + '"><div class="field"><label class="label">出价（元）</label><input class="input" name="amount" type="number" min="0.01" step="0.01" required></div><button class="btn btn-primary btn-block" type="submit">确认出价</button></form>'); return;
        }
        if (act === 'review-listing') { await withBusy(el, async function(){ await api('/admin/'+el.dataset.kind+'/'+el.dataset.id+'/'+el.dataset.do,{method:'POST'}); toast(el.dataset.do==='approve'?'审核通过':'已驳回'); await renderAdmin(); }); return; }
        if (act === 'auction-bids') { await withBusy(el, async function(){ var bids=await api('/auction/'+el.dataset.id+'/bids'); openSheet('<h3>选择报价结算</h3><p class="sub">可选择任意报价；确认后拍卖结束，双方线下交易。</p>'+(bids.length?bids.map(function(b){return '<div class="bid-row"><span>'+esc(b.bidder)+' | ¥'+esc(b.amount)+'</span><button class="btn btn-sm" data-act="auction-settle" data-id="'+el.dataset.id+'" data-bid="'+b.id+'">选择成交</button></div>';}).join(''):'<p>暂无报价</p>')); }); return; }
        if (act === 'auction-settle') { if(!confirm('确认选择该报价成交？拍卖将结束，不能撤销。'))return; await withBusy(el,async function(){await api('/auction/'+el.dataset.id+'/settle',{method:'POST',body:{bidId:el.dataset.bid}});closeSheet();toast('已结算');await renderAuctions(true);});return; }
        if (act === 'auction-cancel') { if (!confirm('确定取消这场拍卖？已有出价将失效。')) return; await withBusy(el, async function () { await api('/admin/auctions/' + el.dataset.id + '/cancel', {method:'POST'}); toast('拍卖已取消'); await renderAdmin(); }); return; }
        if (act === 'sheet-close') { closeSheet();return; }
        if (act === 'mask-close') {
            if (ev.target === el) closeSheet();
            return;
        }
        if (act === 'go') {
            ev.preventDefault();
            go(el.dataset.to);
            return;
        }
        if (act === 'check-chain') {
            await checkChain();
            return;
        }
        if (act === 'login-method') {
            var previousEmail = $('#login-email')?.value;
            state.loginMethod = el.dataset.v;
            renderLogin('login');
            if (previousEmail && $('#login-email')) $('#login-email').value = previousEmail;
            return;
        }
        if (act === 'login-email-send') {
            var loginEmail = $('#login-email');
            if (!loginEmail.reportValidity()) return;
            el.disabled = true;
            try {
                await api('/user/login/email/send', {method:'POST', body:{email:loginEmail.value.trim()}});
                toast('如果该邮箱已绑定账号，请查收验证码');
                $('#login-code')?.focus();
                setTimeout(function () { el.disabled = false; }, 60000);
            } catch (error) {
                el.disabled = false;
                toast(error.message, 'err');
            }
            return;
        }
        if (act === 'auth-mode') {
            state.loginMode = el.dataset.mode;
            renderLogin(el.dataset.mode);
            return;
        }
        if (act === 'logout') {
            await api('/user/logout', {method: 'POST'});
            writeToken('');
            state.me = null;
            toast('已退出');
            go('#/login');
            return;
        }
        if (act === 'f-cat' || act === 'f-cond') {
            var key = act === 'f-cat' ? 'category' : 'condition';
            var previous = state.home[key];
            var feed = $('.market-feed');
            state.home[key] = el.dataset.v;
            if (feed) {
                feed.setAttribute('aria-busy', 'true');
                feed.querySelector('.feed-count').textContent = '正在筛选…';
            }
            var request = loadHome(true);
            var filterToken = homeLoadToken;
            try {
                if (await request) { renderHome(); if ($('#modal').innerHTML) openFilterSheet(); }
            } catch (error) {
                if (filterToken === homeLoadToken && currentView.name === 'home') {
                    state.home[key] = previous;
                    if (feed?.isConnected) feed.querySelector('.feed-count').textContent = '筛选失败';
                    toast(error.message || '筛选失败，请重试', 'err');
                }
            } finally {
                if (filterToken === homeLoadToken && feed?.isConnected) feed.removeAttribute('aria-busy');
            }
            return;
        }
        if (act === 'open-filter') {
            openFilterSheet();
            return;
        }
        if (act === 'load-more') {
            state.home.page += 1;
            await withBusy(el, async function () {
                if(await loadHome(false)) renderHome();
            });
            return;
        }
        if (act === 'p-want') { var choices=state.publish.wantCategory ? state.publish.wantCategory.split(',') : []; var at=choices.indexOf(el.dataset.v); if(at>=0)choices.splice(at,1);else choices.push(el.dataset.v); state.publish.wantCategory=choices.join(',');markMultiWant(state.publish.wantCategory);savePublishDraft(el.closest("form"));return; }
        if (act === 'p-cat' || act === 'p-cond') {
            var group = act === 'p-cat' ? 'category' : (act === 'p-cond' ? 'conditionLevel' : 'wantCategory');
            state.publish[group] = el.dataset.v;
            var wrap = el.parentNode;
            Array.prototype.forEach.call(wrap.children, function (c) {
                c.classList.toggle('on', c === el);
            });
            var hidden = wrap.parentNode.querySelector('input[type=hidden]');
            if (hidden) hidden.value = el.dataset.v;
            savePublishDraft(el.closest("form"));
            return;
        }
        if (act === 'cycle') {
            go('#/cycle/' + el.dataset.id);
            return;
        }
        if (act === 'create-ring') {
            await withBusy(el, async function () {
                var ids = el.dataset.ids.split(',').map(Number);
                var r = await api('/cycle/' + el.dataset.id + '/create', {method: 'POST', body: {itemIds: ids}});
                toast('环成了，去交换单里确认');
                go('#/exchange/' + r.exchangeId);
            });
            return;
        }
        if (act === 'open-offer') {
            await withBusy(el, function () { return openOfferSheet(el.dataset.id); });
            return;
        }
        if (act === 'pick-offer-item') {
            Array.prototype.forEach.call(document.querySelectorAll('[data-act=pick-offer-item]'), function (c) {
                c.style.borderColor = c === el ? 'var(--brand-500)' : 'var(--line)';
                c.style.background = c === el ? 'var(--brand-50)' : 'var(--surface)';
            });
            el.dataset.picked = '1';
            var target = $('#offer-target').value;
            var msg = $('#offer-msg').value;
            closeSheet();
            await withBusy(null, async function () {
                await api('/offer', {method: 'POST', body: {itemId: Number(target), myItemId: Number(el.dataset.id), message: msg}});
                toast('报价已发出，等对方回应', 'ok');
                go('#/offers');
            });
            return;
        }
        if (act === 'offer-act') {
            var offerId = Number(el.dataset.id);
            var todo = el.dataset.do;
            if (todo === 'counter') {
                var mine = await api('/item/mine?status=1');
                var opts = (mine || []).map(function (it) {
                    return '<button class="item-card" style="margin-bottom:8px" data-act="do-counter" data-offer="' + offerId
                        + '" data-id="' + it.id + '">' + thumb(it)
                        + '<div class="item-main"><h3 class="item-title">' + esc(it.title) + '</h3>'
                        + '<div class="item-foot"><span class="tag brand">' + esc(it.category) + '</span></div></div></button>';
                }).join('');
                if (!opts) {
                    toast('你还没有在架物品，没法还价', 'err');
                    return;
                }
                openSheet('<h3>用你的哪件还价</h3><p class="sub">原来那条报价会关闭，生成一条反方向的新报价。</p>' + opts);
                return;
            }
            await withBusy(el, async function () {
                await api('/offer/handle', {method: 'POST', body: {offerId: offerId, action: todo}});
                toast(todo === 'accept' ? '已接受，物品锁定' : (todo === 'reject' ? '已拒绝' : '已撤回'), 'ok');
                await renderOffers();
            });
            return;
        }
        if (act === 'do-counter') {
            var oid = Number(el.dataset.offer);
            var iid = Number(el.dataset.id);
            closeSheet();
            await withBusy(null, async function () {
                await api('/offer/handle', {method: 'POST', body: {offerId: oid, action: 'counter', myItemId: iid}});
                toast('已还价', 'ok');
                await renderOffers();
            });
            return;
        }
        if (act === 'me-filter') {
            state.meFilter = el.dataset.v;
            await render();
            return;
        }
        if (act === 'admin-refresh' || act === 'admin-report-status') {
            if (act === 'admin-report-status') state.adminReportStatus = Number(el.dataset.v);
            await withBusy(el, renderAdmin);
            return;
        }
        if (act === 'admin-user-status') {
            var action = el.dataset.do;
            if (!confirm(action === 'suspend' ? '确认停用该账号？该用户将无法登录。' : '确认恢复该账号？')) return;
            await withBusy(el, async function () {
                await api('/admin/users/'+el.dataset.id+'/'+action, {method:'POST'});
                toast(action === 'suspend' ? '账号已停用' : '账号已恢复', 'ok');
                await renderAdmin();
            });
            return;
        }
        if (act === 'offers-tab' || act === 'admin-tab') {
            if (act === 'offers-tab') state.offersTab = el.dataset.v;
            else { state.adminTab = el.dataset.v; await withBusy(el, renderAdmin); return; }
            await render();
            return;
        }
        if (act === 'ex-confirm' || act === 'ex-done') {
            if (act === 'ex-done' && !confirm('确认已完成面交，收到的物品无误？确认后不可撤回。')) return;
            await withBusy(el, async function () {
                var r = await api('/exchange/' + el.dataset.id + (act === 'ex-confirm' ? '/confirm' : '/done'),
                    {method: 'POST'});
                toast(r && r.msg || '已确认', 'ok');
                await render();
            });
            return;
        }
        if (act === 'ex-cancel') {
            if (!confirm('取消后交换单将关闭，相关物品会回到在架状态。确定取消吗？')) return;
            await withBusy(el, async function () {
                await api('/exchange/' + el.dataset.id + '/cancel', {method: 'POST', body: {reason: '当事人取消'}});
                toast('已取消', 'ok');
                await render();
            });
            return;
        }
        if (act === 'open-place') {
            await openPlaceSheet(el.dataset.id);
            return;
        }
        if (act === 'open-review') {
            var e = await api('/exchange/' + el.dataset.id);
            var me = state.me;
            var targets = (e.details || []).filter(function (d) {
                return d.userId !== me.id;
            });
            openReviewSheet(el.dataset.id, targets);
            return;
        }
        if (act === 'pick-review-target') {
            var exId = $('#review-exchange').value;
            var nick = el.querySelector('.item-title').textContent;
            openReviewForm(exId, el.dataset.id, nick);
            return;
        }
        if (act === 'set-star') {
            var n = Number(el.dataset.n);
            $('#review-score').value = n;
            Array.prototype.forEach.call(document.querySelectorAll('#review-stars .star'), function (s) {
                s.classList.toggle('on', Number(s.dataset.n) <= n);
            });
            return;
        }
        if (act === 'user-review') {
            openReviewForm(Number(el.dataset.exchange), Number(el.dataset.id), el.dataset.nick);
            return;
        }
        if (act === 'pending-review') {
            openPendingSheet();
            return;
        }
        if (act === 'credit-rule') {
            openCreditRule();
            return;
        }
        if (act === 'toggle-item') {
            await withBusy(el, async function () {
                await api('/item/' + el.dataset.id, {method: 'PUT', body: {status: Number(el.dataset.status)}});
                toast('已更新', 'ok');
                await render();
            });
            return;
        }
        if (act === 'open-report') {
            openReportSheet(el.dataset.type, el.dataset.id);
            return;
        }
        if (act === 'report-act') {
            await withBusy(el, async function () {
                await api('/admin/report/handle', {method: 'POST', body: {
                    reportId: Number(el.dataset.id),
                    action: el.dataset.do,
                    note: el.dataset.do === 'approve' ? '管理员认定违规' : '证据不足，驳回'
                }});
                toast('已处理', 'ok');
                await render();
            });
            return;
        }
        if (act === 'seed-demo' || act === 'reset-demo') {
            var demoPath = act === 'reset-demo' ? '/admin/demo/reset' : '/admin/demo';
            if (act === 'reset-demo' && !confirm('会清空所有物品、交换单、评价、举报，只保留管理员的账号。确定吗？')) return;
            await withBusy(el, async function () {
                await api(demoPath, {method: 'POST'});
                toast('演示数据已重置，去集市看看', 'ok');
                state.home.category = '';
                state.home.keyword = '';
                await render();
            });
            return;
        }
        if (act === 'open-profile') {
            openProfileSheet();
            return;
        }
    });

    // 表单提交
    document.addEventListener('submit', async function (ev) {
        var form = ev.target.closest('[data-form]');
        if (!form) return;
        ev.preventDefault();
        var kind = form.dataset.form;
        var fd = new FormData(form);
        var btn = ev.submitter || form.querySelector('button[type=submit]');
        var publishError=form.querySelector('.publish-error');
        if(publishError){publishError.hidden=true;publishError.textContent='';}

        var run = async function () {
            if (kind === 'orders-search') {
                state.offersQuery = (fd.get('q') || '').trim();
                if (currentView.name === 'exchange') await renderExchanges();
                else await renderOffers();
                return;
            }
            if (kind === 'tieba-post') {
                var pTitle = (fd.get('title') || '').trim();
                var pBody = (fd.get('body') || '').trim();
                if (!pTitle || !pBody) throw new ApiError('请填写帖子标题和正文');
                var roomsNow = getAllRooms();
                var activeR = roomsNow.find(function (r) { return r.id === state.commRoom; }) || roomsNow[0];
                var selItemId = Number(fd.get('itemId') || 0) || null;
                var selEl = form.querySelector('select[name="itemId"]');
                var selItemTitle = selItemId && selEl && selEl.selectedIndex >= 0 ? selEl.options[selEl.selectedIndex].text : '';
                var nick = (state.me && state.me.nickname) || '移通同学';
                var posts = [];
                try { posts = JSON.parse(localStorage.getItem('hq.tiebaPosts') || '[]'); } catch (e) { posts = []; }
                if (!Array.isArray(posts)) posts = [];
                posts.unshift({
                    id: 'u_' + Date.now(),
                    isUserPost: true,
                    roomId: activeR.id,
                    cat: activeR.cat === '综合' ? '' : activeR.cat,
                    author: nick,
                    ava: nick.slice(0, 1),
                    time: '刚刚',
                    tag: fd.get('tag') || '讨论',
                    title: pTitle,
                    body: pBody,
                    imgs: state.tiebaPostImg ? [state.tiebaPostImg] : [],
                    itemId: selItemId,
                    itemTitle: selItemTitle,
                    likes: 0,
                    comments: []
                });
                try { localStorage.setItem('hq.tiebaPosts', JSON.stringify(posts)); } catch (e) {}
                state.tiebaPostImg = '';
                toast('发表成功，帖子已置顶展示在当前贴吧', 'ok');
                await renderCommunity();
                return;
            }
            if (kind === 'tieba-reply') {
                var rpId = form.dataset.postId;
                var rpText = (fd.get('reply') || '').trim();
                if (!rpId || !rpText) return;
                var rMap = {};
                try { rMap = JSON.parse(localStorage.getItem('hq.tiebaReplies') || '{}') || {}; } catch (e) { rMap = {}; }
                if (!Array.isArray(rMap[rpId])) rMap[rpId] = [];
                rMap[rpId].push({
                    author: (state.me && state.me.nickname) || '移通同学',
                    time: '刚刚',
                    text: rpText
                });
                try { localStorage.setItem('hq.tiebaReplies', JSON.stringify(rMap)); } catch (e) {}
                state.tiebaOpenComments[rpId] = true;
                toast('回帖成功', 'ok');
                await renderCommunity();
                return;
            }
            if (kind === 'create-room') {
                var rmName = (fd.get('name') || '').trim();
                if (!rmName) throw new ApiError('请填写聊天室名称');
                var rmId = 'custom_' + Date.now();
                var customArr = [];
                try { customArr = JSON.parse(localStorage.getItem('hq.customRooms') || '[]'); } catch (e) { customArr = []; }
                if (!Array.isArray(customArr)) customArr = [];
                customArr.push({
                    id: rmId,
                    name: rmName,
                    icon: fd.get('icon') || 'fire',
                    cat: fd.get('cat') || '综合',
                    badge: (fd.get('badge') || '').trim() || '新建',
                    desc: (fd.get('desc') || '').trim() || '同学们自主发起的校园兴趣贴吧与闲置交流室',
                    members: 1,
                    img: '/assets/amz/quad-community.jpg',
                    custom: true
                });
                try { localStorage.setItem('hq.customRooms', JSON.stringify(customArr)); } catch (e) {}
                var fArr = getRoomFollows().slice();
                if (fArr.indexOf(rmId) < 0) fArr.push(rmId);
                setRoomFollows(fArr);
                state.commRoom = rmId;
                state.commTab = 'posts';
                closeSheet();
                toast('聊天室创建成功', 'ok');
                if (currentView.name === 'community') await renderCommunity();
                else go('#/community');
                return;
            }
            if (kind === 'room-chat-msg') {
                var rmKey = form.dataset.room || state.commRoom || 'hall';
                var rmTxt = (fd.get('content') || '').trim();
                if (!rmTxt) return;
                var nowC = new Date();
                var tClock = String(nowC.getHours()).padStart(2, '0') + ':' + String(nowC.getMinutes()).padStart(2, '0');
                var cMap = {};
                try { cMap = JSON.parse(localStorage.getItem('hq.roomChats') || '{}') || {}; } catch (e) { cMap = {}; }
                if (!Array.isArray(cMap[rmKey])) cMap[rmKey] = [];
                cMap[rmKey].push({
                    nick: (state.me && state.me.nickname) || '移通同学',
                    time: tClock,
                    text: rmTxt
                });
                try { localStorage.setItem('hq.roomChats', JSON.stringify(cMap)); } catch (e) {}
                await renderCommunity();
                return;
            }
            if (kind === 'room-text') {var roomId=currentView.arg,ringRoom=currentView.name==='ringChat';await api('/conversation/'+(ringRoom?'ring/':'')+roomId,{method:'POST',body:{kind:'text',content:fd.get('content')}});form.reset();await refreshRoom(true);return;}
            if (kind === 'wish-new') {await api('/wish',{method:'POST',body:{title:fd.get('title'),category:fd.get('category'),content:fd.get('content'),offeredItemId:Number(fd.get('offeredItemId'))||null}});toast('求换已发布');await renderWishes();return;}
            if (kind === 'community-text') { await api('/community',{method:'POST',body:{kind:'text',content:fd.get('content')}}); form.reset(); form.querySelector('.community-draft-note')?.remove(); await refreshCommunity(true); return; }
            if (kind === 'auction-new') {
                if (!state.publishImages.length) throw new ApiError('请上传拍品图片'); await api('/auction', {method:'POST', body:{title:fd.get('title'), description:fd.get('description'), amount:fd.get('amount'), hours:fd.get('hours'), image:state.publishImages.join(',')}}); toast('已提交审核'); go('#/auction/mine'); return;
            }
            if (kind === 'estimate') {
                var price = Number(fd.get('price'));
                var condKey = fd.get('condition') || 'light';
                var range = {new: [0.75, 0.92], light: [0.55, 0.76], seven: [0.40, 0.60], used: [0.22, 0.45]}[condKey] || [0.50, 0.72];
                if (!Number.isFinite(price) || price < 1) throw new ApiError('请输入有效的入手价和成色');
                var low = Math.max(1, Math.round(price * range[0]));
                var high = Math.max(low + 1, Math.round(price * range[1]));
                var fastPrice = Math.round((low + high) / 2);
                var itemTitle = (fd.get('title') || '').trim() || '您的校园好物';
                var itemCat = fd.get('category') || '数码';
                var evalBox = document.getElementById('ai-mascot-Evaluating');
                var resBox = $('#estimate-result');
                if (evalBox) {
                    evalBox.hidden = false;
                    await new Promise(function (r) { setTimeout(r, 380); });
                    evalBox.hidden = true;
                }
                if (resBox) {
                    resBox.innerHTML = '<div class="ai-report-card">'
                        + '<img src="/assets/brand/mascot-success.png" alt="小唤" class="ai-report-mascot">'
                        + '<div class="ai-report-main">'
                        + '<span class="ai-report-kicker">✓ 小唤估值 ' + esc(itemCat) + '</span>'
                        + '<h3>「' + esc(itemTitle) + '」参考区间 <b>¥' + low + '–' + high + '</b></h3>'
                        + '<p>建议标价：<b>¥' + fastPrice + '</b>（入手价 ¥' + price + '，保值率约 ' + Math.round(range[1] * 100) + '%）</p>'
                        + '</div>'
                        + '<div class="ai-report-actions">'
                        + '<a class="btn btn-primary btn-sm" href="#/publish">带此估值去发布 ›</a>'
                        + '<a class="btn btn-ghost btn-sm" href="#/auction/new">去拍卖</a>'
                        + '</div>'
                        + '</div>';
                }
                return;
            }
            if (kind === 'email-send') { await api('/user/email/send',{method:'POST',body:{email:fd.get('email')}});toast('验证码已发送，请查收');$('#verify-code')?.focus();return; }
            if (kind === 'email-verify') { await api('/user/email/verify',{method:'POST',body:{code:fd.get('code')}});toast('邮箱认证成功');await renderEmail();return; }
            if (kind === 'auction-bid') {
                await api('/auction/' + encodeURIComponent(fd.get('id')) + '/bid', {method:'POST', body:{amount:fd.get('amount')}}); closeSheet(); toast('出价成功'); await renderAuctions(); return;
            }
            if (kind === 'register' || (kind === 'login' && (!state.loginMethod || state.loginMethod === 'student'))) {
                var no = String(fd.get('studentNo') || '').trim();
                if (!/^\d{10}$/.test(no) && !(kind === 'login' && no === 'admin')) {
                    throw new ApiError('学号是 10 位数字，例如 2021210001');
                }
            }
            if (kind === 'login') {
                var loginPath = {student:'/user/login', email:'/user/login/email/password', code:'/user/login/email/code'}[state.loginMethod || 'student'];
                var u = await api(loginPath, {method:'POST', body:Object.fromEntries(fd)});
                if (u.token) {
                    writeToken(u.token);
                }
                state.me = u;
                try {
                    await api('/user/me');
                } catch (e) {
                    if (e && e.code === 401) {
                        throw new ApiError('登录没有生效。请允许本站保存 Cookie 或本地存储后重试，'
                            + '或换一个普通窗口（不要用无痕模式）');
                    }
                    throw e;
                }
                toast('欢迎回来，' + u.nickname, 'ok');
                var back = sessionStorage.getItem('hq.returnTo') || '#/home';
                sessionStorage.removeItem('hq.returnTo');
                go(back);
            } else if (kind === 'register') {
                await api('/user/register', {method: 'POST', body: {
                    studentNo: fd.get('studentNo'), nickname: fd.get('nickname'),
                    password: fd.get('password'), college: fd.get('college'), building: fd.get('building'),
                    email: fd.get('email'), code: fd.get('code')
                }});
                toast('注册成功，请登录', 'ok');
                state.loginMode = 'login';
                renderLogin('login');
            } else if (kind === 'publish') {
                var body = {
                    title: fd.get('title'),
                    category: state.publish.category,
                    conditionLevel: state.publish.conditionLevel,
                    description: fd.get('description'),
                    wantCategory: state.publish.wantCategory,
                    matchMode: fd.get('matchMode'),
                    expectDesc: fd.get('expectDesc'),
                    images: state.publishImages.join(',')
                };
                if (!state.publishImages.length) throw new ApiError('请上传物品图片');
                if (!body.category) throw new ApiError('选一个类别');
                if (!body.conditionLevel) throw new ApiError('选一个成色');
                if (!body.wantCategory) throw new ApiError('写一下想换什么');
                // 先存草稿，万一登录失效重登后还能接着发
                sessionStorage.setItem('hq.draft', JSON.stringify(body));
                var editing = form.dataset.editId;
                var r = await api(editing ? '/item/'+editing : '/item', {method: editing ? 'PUT' : 'POST', body: body});
                sessionStorage.removeItem('hq.draft');
                toast('已提交审核', 'ok');
                go(editing?'#/item/'+editing:'#/publish/success/'+r.itemId);
            } else if (kind === 'place') {
                await api('/exchange/' + fd.get('exchangeId') + '/place', {method: 'PUT', body: {
                    place: fd.get('place'), dealTime: fd.get('dealTime')
                }});
                closeSheet();
                toast('面交点已更新', 'ok');
                await render();
            } else if (kind === 'review') {
                await api('/review', {method: 'POST', body: {
                    exchangeId: Number(fd.get('exchangeId')),
                    targetUserId: Number(fd.get('targetUserId')),
                    score: Number(fd.get('score')),
                    content: fd.get('content')
                }});
                closeSheet();
                toast('评价成功', 'ok');
                await render();
            } else if (kind === 'profile') {
                await api('/user/me', {method: 'PUT', body: {
                    nickname: fd.get('nickname'), college: fd.get('college'), building: fd.get('building')
                }});
                closeSheet();
                toast('资料已更新', 'ok');
                await render();
            } else if (kind === 'report') {
                var rr = await api('/report', {method: 'POST', body: {
                    targetType: Number(fd.get('targetType')),
                    targetId: Number(fd.get('targetId')),
                    reason: fd.get('reason')
                }});
                closeSheet();
                toast(rr.msg || '已提交', 'ok');
            } else if (kind === 'admin-user-search') {
                state.adminUserQuery = (fd.get('q') || '').trim();
                await renderAdmin();
            } else if (kind === 'search') {
                if (fd.has('category')) state.home.category = fd.get('category') || '';
                state.home.keyword = (fd.get('keyword') || '').trim();
                rememberSearch(state.home.keyword);
                if(location.hash!=='#/search'){go('#/search');}else if(await loadHome(true)){renderHome();}
            }
        };

        if (btn) btn.disabled = true;
        var errBox = document.querySelector('#form-error');
        if (errBox) {
            errBox.classList.remove('show');
        }
        try {
            await run();
        } catch (e) {
            var msg = e.message || '操作失败';
            if ((kind === 'login' || kind === 'register') && errBox) {
                if (msg.indexOf('数据库') >= 0) {
                    msg = '数据库连不上：确认 MySQL 已启动，且 db.properties 里的账号密码正确';
                }
                errBox.textContent = msg;
                errBox.classList.add('show');
                checkChain();
            } else if(publishError){
                publishError.textContent=msg;publishError.hidden=false;publishError.focus();
            } else {
                toast(msg, 'err');
            }
        } finally {
            if (btn) btn.disabled = false;
        }
    });

    // 字数计数 + 图片上传
    document.addEventListener('input', function (ev) {
        if (ev.target.dataset.counter === 'desc') {
            var n = ev.target.value.length;
            var c = $('#desc-counter');
            if (c) {
                c.textContent = n + ' / 300';
                c.classList.toggle('warn', n > 270);
            }
        }
    });

    async function readOrUploadLocalImage(file) {
        if (state.me || readToken()) {
            try {
                var fd = new FormData();
                fd.append('file', window.prepareUploadImage ? await window.prepareUploadImage(file) : file);
                var res = await api('/upload', {method: 'POST', form: fd, optionalAuth: true});
                if (res && res.url) return res.url;
            } catch (e) {}
        }
        return await new Promise(function (resolve, reject) {
            var reader = new FileReader();
            reader.onload = function () {
                var img = new Image();
                img.onload = function () {
                    var max = 720, scale = Math.min(1, max / Math.max(img.width || 1, img.height || 1));
                    var canvas = document.createElement('canvas');
                    canvas.width = Math.max(1, Math.round(img.width * scale));
                    canvas.height = Math.max(1, Math.round(img.height * scale));
                    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                    resolve(canvas.toDataURL('image/jpeg', 0.74));
                };
                img.onerror = function () { reject(new Error('图片读取失败')); };
                img.src = reader.result;
            };
            reader.onerror = function () { reject(new Error('图片读取失败')); };
            reader.readAsDataURL(file);
        });
    }

    document.addEventListener('change', async function (ev) {
        if (ev.target.dataset.act === 'im-image') {
            var imFile = ev.target.files && ev.target.files[0];
            if (!imFile) return;
            try {
                var imUrl = await readOrUploadLocalImage(imFile);
                var idx = Number(state.activeNoticeIdx || 0);
                var imMap = {};
                try { imMap = JSON.parse(localStorage.getItem('hq.imThreads') || '{}') || {}; } catch (e) { imMap = {}; }
                if (!Array.isArray(imMap[idx])) imMap[idx] = [];
                var nowD = new Date();
                imMap[idx].push({
                    kind: 'image',
                    image: imUrl,
                    text: '[图片]',
                    time: String(nowD.getHours()).padStart(2, '0') + ':' + String(nowD.getMinutes()).padStart(2, '0')
                });
                try { localStorage.setItem('hq.imThreads', JSON.stringify(imMap)); } catch (e) {}
                await renderNotifications();
                var st = document.querySelector('.tb-chat-stream');
                if (st) st.scrollTop = st.scrollHeight;
            } catch (err) { toast(err.message || '图片发送失败', 'err'); }
            finally { ev.target.value = ''; }
            return;
        }
        if (ev.target.dataset.act === 'tieba-post-image') {
            var tbFile = ev.target.files && ev.target.files[0];
            if (!tbFile) return;
            try {
                var tDraft = document.querySelector('[data-form="tieba-post"] input[name="title"]')?.value || '';
                var bDraft = document.querySelector('[data-form="tieba-post"] textarea[name="body"]')?.value || '';
                state.tiebaPostImg = await readOrUploadLocalImage(tbFile);
                await renderCommunity();
                var tIn = document.querySelector('[data-form="tieba-post"] input[name="title"]');
                var bIn = document.querySelector('[data-form="tieba-post"] textarea[name="body"]');
                if (tIn && tDraft) tIn.value = tDraft;
                if (bIn && bDraft) bIn.value = bDraft;
            } catch (err) { toast(err.message || '配图加载失败', 'err'); }
            finally { ev.target.value = ''; }
            return;
        }
        if (ev.target.dataset.act === 'room-chat-image') {
            var rcFile = ev.target.files && ev.target.files[0];
            if (!rcFile) return;
            var rmKey = ev.target.dataset.room || state.commRoom || 'hall';
            try {
                var rcUrl = await readOrUploadLocalImage(rcFile);
                var cMap = {};
                try { cMap = JSON.parse(localStorage.getItem('hq.roomChats') || '{}') || {}; } catch (e) { cMap = {}; }
                if (!Array.isArray(cMap[rmKey])) cMap[rmKey] = [];
                var nowR = new Date();
                cMap[rmKey].push({
                    nick: (state.me && state.me.nickname) || '移通同学',
                    time: String(nowR.getHours()).padStart(2, '0') + ':' + String(nowR.getMinutes()).padStart(2, '0'),
                    image: rcUrl
                });
                try { localStorage.setItem('hq.roomChats', JSON.stringify(cMap)); } catch (e) {}
                await renderCommunity();
            } catch (err) { toast(err.message || '图片发送失败', 'err'); }
            finally { ev.target.value = ''; }
            return;
        }
        if (ev.target.dataset.act === 'room-image') {
            var input = ev.target, file = input.files && input.files[0], conversationId = currentView.arg;
            if (!file) return;
            input.disabled = true;
            try {
                var body = new FormData();
                body.append('file', await window.prepareUploadImage(file));
                var uploaded = await api('/upload', {method:'POST', form:body});
                if (currentView.name !== 'chat' || currentView.arg !== conversationId) return;
                await api('/conversation/' + conversationId, {method:'POST', body:{kind:'image', image:uploaded.url}});
                await refreshRoom(true);
            } catch (e) { toast(e.message || '发送失败', 'err'); }
            finally { input.disabled = false; input.value = ''; }
            return;
        }
        if (ev.target.dataset.act === 'community-image') {
            var input=ev.target, file=input.files && input.files[0]; if(!file)return;
            if(file.size>2*1024*1024){toast('图片不能超过 2MB','err');input.value='';return;}
            var body=new FormData();body.append('file',file);input.disabled=true;
            try {var uploaded=await api('/upload',{method:'POST',form:body});await api('/community',{method:'POST',body:{kind:'image',image:uploaded.url}});await refreshCommunity(true);} catch(e){toast(e.message||'发送失败','err');} finally {input.disabled=false;input.value='';}return;
        }
        if (ev.target.dataset.act === 'pick-image') {
            var files = Array.prototype.slice.call(ev.target.files || []);
            for (var i = 0; i < files.length; i++) {
                if (state.publishImages.length >= 3) {
                    toast('最多 3 张', 'err');
                    break;
                }
                var f = files[i];
                try {
                    var form = new FormData();
                    form.append('file', await window.prepareUploadImage(f));
                    var r = await api('/upload', {method: 'POST', form: form});
                    state.publishImages.push(r.url);
                    renderImagePreview();
                    savePublishDraft(document.querySelector('form[data-form=publish]'));
                } catch (e) {
                    toast(e.message || '上传失败', 'err');
                }
            }
            ev.target.value = '';
        }
    });

    function renderImagePreview() {
        var wrap = $('#img-preview');
        if (!wrap) return;
        // 一张都没选的时候也要有「＋」框，否则页面上根本没有选图的入口
        var thumbs = state.publishImages.map(function (u, i) {
            return '<div class="thumb-sm"><img src="' + esc(u) + '" alt="">'
                + '<button type="button" data-act="rm-image" data-i="' + i + '">✕</button></div>';
        }).join('');
        var add = state.publishImages.length < 3
            ? '<label class="thumb-add">'+navIcon('camera')+'<input type="file" accept="image/png,image/jpeg" multiple '
              + 'data-act="pick-image" aria-label="添加物品图片"></label>'
            : '';
        wrap.innerHTML = thumbs + add;
    }

    document.addEventListener('click', function (ev) {
        var el = ev.target.closest('[data-act="rm-image"]');
        if (!el) return;
        state.publishImages.splice(Number(el.dataset.i), 1);
        renderImagePreview();
        savePublishDraft(document.querySelector('form[data-form=publish]'));
    });

    document.addEventListener('error',function(ev){
        var img=ev.target;
        if(img.tagName!=='IMG'||!img.parentElement?.matches('.pcard .pimg'))return;
        img.outerHTML=CAT_ICON[img.parentElement.dataset.cat]||CAT_ICON['其他'];
    },true);
    document.addEventListener('input', function (ev) {
        if(ev.target.form?.dataset.form==='publish')savePublishDraft(ev.target.form);
        if(ev.target.id==='message-filter'){
            var query=ev.target.value.trim().toLowerCase();
            document.querySelectorAll('.messages-page .conversation-row').forEach(function(row){row.hidden=!row.textContent.toLowerCase().includes(query);});
        }
    });
    document.addEventListener('input', function (ev) {
        if (ev.target.id === 'theme-color') applyTheme(ev.target.value, true);
        if (ev.target.id === 'tb-im-input') {
            var cnt = $('#tb-char-count');
            if (cnt) cnt.textContent = String(ev.target.value.length) + ' / 500';
        }
    });
    document.addEventListener('keydown', function (ev) {
        if (ev.target && ev.target.id === 'tb-im-input' && ev.key === 'Enter' && !ev.shiftKey) {
            ev.preventDefault();
            document.querySelector('[data-act="im-send"]')?.click();
        }
    });

    // ------------------------------------------------------------------ 启动

    document.addEventListener('keydown',function(ev){
        var panel=$('#modal .sheet');
        if(!panel)return;
        if(ev.key==='Escape'){ev.preventDefault();closeSheet();return;}
        if(ev.key!=='Tab')return;
        var elements=Array.from(panel.querySelectorAll('a[href],button,input,select,textarea,summary')).filter(function(el){return !el.disabled&&el.getClientRects().length;});
        if(!elements.length){ev.preventDefault();return;}
        var first=elements[0],last=elements[elements.length-1],active=document.activeElement;
        if(ev.shiftKey&&(active===first||active===panel)){ev.preventDefault();last.focus();}
        else if(!ev.shiftKey&&active===last){ev.preventDefault();first.focus();}
    });
    document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') { var drawer = $('#landing-menu'); if (drawer && !drawer.hidden) { drawer.hidden = true; $('.land-scrim').hidden = true; $('.land-menu-toggle').setAttribute('aria-expanded', 'false'); $('.land-menu-toggle').focus(); } } });
    window.addEventListener('hashchange', function () {
        if(location.hash==='#/notifications') { noticeTracker.pending=0;closeNoticePopup(); }
        window.scrollTo(0, 0);
        render();
    });

    setInterval(refreshNoticeCount,15000);
    (async function boot() {
        if (!location.hash) { location.hash = '#/home'; return; }
        await render();
    })();
})();
