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
        home: {category: '', condition: '', keyword: '', page: 1, items: [], total: 0, hasMore: false},
        publishImages: [],
        offersTab: 'received',
        meFilter: 'all',
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
                subsidy: key === 'favorites' ? '收藏降价提醒 · 校内面交' : '校内实名验货 · 信用担保',
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
                + '<div class="jd-h-substrip">'
                + '<span class="jd-h-subprice"><small>换物参考价 ¥</small><b>' + esc(priceParts[0]) + '</b></span>'
                + '<span class="jd-h-subtag">' + esc(it.subsidy || '校园认证好物') + '</span>'
                + '</div>'
                + '</a>'
                + (it.isSaved ? '<button type="button" class="jd-h-del" data-act="shelf-remove" data-key="' + key + '" data-id="' + Number(it.id) + '" title="移出记录">✕</button>' : '<span class="jd-h-corner">' + (key === 'favorites' ? '有降价' : '常看') + '</span>')
                + '</div>'
                + '<div class="jd-h-body">'
                + '<a href="' + href + '" class="jd-h-title"><span class="jd-self-badge">自营认证</span>' + esc(it.title) + '</a>'
                + '<div class="jd-h-price-row">'
                + '<div class="jd-h-price"><em>¥</em><b>' + esc(priceParts[0]) + '</b><sup>.' + esc(priceParts[1] || '00') + '</sup><del>到手价 ¥' + esc(it.origPrice || '199.00') + '</del></div>'
                + '<a href="' + href + '" class="jd-h-plus" aria-label="查看或发起交换" title="发起换物">+</a>'
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
            + '<div class="jd-fp-date-left"><b>11月15日 · 今天</b><span>' + (key === 'favorites' ? '已收藏 ' : '看过 ') + displayList.length + ' 件商品</span></div>'
            + '<button type="button" class="jd-fp-clear-btn" data-act="shelf-clear" data-key="' + key + '">🗑 全部清空</button>'
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
            + '<div class="amz-footer-base"><div class="amz-footer-brand">' + logoMarkup() + '<span>换一圈</span></div><p>重庆移通学院 · 校园以物换物平台 · 校内面交更安心</p></div>'
            + '</footer>';
    }
    function shell(active,content) {
        setTimeout(refreshNoticeCount,0);
        var me=state.me;
        var account=me?'<button class="avatar" data-act="go" data-to="#/me" title="'+esc(me.nickname)+'">'+esc(me.nickname.slice(0,1))+'</button>':(readToken()?'<a class="header-account" href="#/me">个人中心</a>':'<a class="header-account" href="#/login">登录 / 注册</a>');
        var popCta = me
            ? '<div class="amz-pop-top"><a class="amz-pop-btn" href="#/me">进入个人中心</a><p>当前账号：<b>'+esc(me.nickname)+'</b>（信用 '+me.credit+'）· <button type="button" class="link-btn" data-act="logout">退出</button></p></div>'
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
            +'<a class="amz-lang" href="#/settings" title="语言与偏好设置"><span class="amz-flag-cn">CN</span><b>ZH</b><span class="amz-caret-sm">▾</span></a>'
            +amzAccount
            +'<a class="amz-nav-item" href="#/exchange"><small>退换与</small><b>我的订单</b></a>'
            +'<a class="notice-link amz-nav-item" href="#/notifications" aria-label="消息通知"><small>消息</small><b>通知中心</b><span class="notice-count" hidden></span></a>'
            +'<a class="settings-link" href="#/settings" aria-label="设置" title="设置">'+navIcon('settings')+'</a>'
            +'<a class="settings-link shelf-link amz-cart" href="#/favorites" aria-label="收藏与历史" title="收藏夹"><span class="amz-cart-ico">'+amzCartSvg+'<span class="amz-cart-num">'+favCount+'</span></span><b class="amz-cart-label">收藏夹</b></a>'
            +'<a class="amz-msg-top'+(active==='notifications'?' on':'')+'" href="#/notifications" aria-label="消息中心" title="消息中心"><span class="amz-msg-ico"><img src="/assets/amz/nav-msg-icon.jpg" alt="消息"><span class="notice-count" hidden></span></span><span class="amz-msg-txt"><small>实时互动</small><b>消息</b></span></a>'
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
        var face=img?'<img src="'+esc(window.catalogThumbnail(img))+'" alt="'+esc(it.title)+'" width="300" height="225" loading="lazy" decoding="async">':(CAT_ICON[it.category]||CAT_ICON['其他']);
        var mode = window.campusExchange.mode(it);
        var hasPrice = (it.isDemo && window.campusExchange.supports(it,1) && Number(it.price) > 0) || (!it.isDemo && mode === 1 && Number(it.price) > 0);
        var priceHtml;
        if (hasPrice) {
            var parts = (Number(it.price) / 100).toFixed(2).split('.');
            priceHtml = '<span class="amz-price"><em>¥</em><b>' + parts[0] + '</b><sup>.' + parts[1] + '</sup></span>';
        } else {
            priceHtml = '<span class="swap-label">' + (mode === 3 && !it.isDemo ? '拍卖竞价' : '以物换物') + '</span>';
        }
        var credit = it.ownerCredit === undefined || it.ownerCredit === null ? 80 : Number(it.ownerCredit);
        var stars = credit >= 90 ? 5 : credit >= 75 ? 4 : 3;
        return '<button class="pcard '+(locked?'locked':'')+'" data-act="go" data-to="#/item/'+it.id+'"><div class="pimg" data-cat="'+esc(it.category)+'">'+face
            +'<span class="pbadge">'+esc(it.isDemo?window.campusExchange.demoLabel(it):(locked?(it.statusText||'已换出'):it.conditionLevel))+'</span></div>'
            +'<div class="pbody"><p class="ptitle">'+esc(it.title)+'</p>'
            +'<div class="amz-rating"><span class="amz-stars">'+'★'.repeat(stars)+'☆'.repeat(5-stars)+'</span><span class="amz-rating-num">信用 '+credit+'</span></div>'
            +'<div class="pcard-bottom">'+priceHtml+'<span class="pcard-category">'+esc(it.category)+'</span></div>'
            +'<div class="pcard-owner"><span class="pcard-owner-avatar">'+esc((it.ownerNickname||'同').slice(0,1))+'</span><span>'+esc(it.ownerNickname||'校园同学')+'</span><span class="amz-prime-tag">校内面交</span></div></div></button>';
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
        var idle=location.hash==='#/idle';
        var isSearch=location.hash==='#/search';
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
        var desktopCats=categories.map(function(c){return '<button class="desk-category '+(h.category===c[0]?'on':'')+'" data-act="f-cat" data-v="'+esc(c[0])+'"><span class="desk-category-icon">'+(c[0]?(CAT_ICON[c[0]]||CAT_ICON['其他']):navIcon('market'))+'</span><span class="desk-cat-main"><b>'+esc(c[1])+'</b><small>'+esc(c[2])+'</small></span><span class="desk-category-arrow">'+navIcon('next')+'</span></button>';}).join('');
        var condSidebar='<div class="amz-side-group"><h3>新旧成色</h3>'+[['','不限成色'],['全新','全新未拆'],['九成新','九成新'],['七成新','七成新'],['有使用痕迹','有使用痕迹']].map(function(c){
            var checked = h.condition===c[0];
            return '<button class="desk-category amz-check-row '+(checked?'on':'')+'" data-act="f-cond" data-v="'+esc(c[0])+'"><span class="amz-radio-dot '+(checked?'on':'')+'"></span><span>'+esc(c[1])+'</span></button>';
        }).join('')+'</div>';
        var creditSidebar='<div class="amz-side-group"><h3>物主信用评级</h3>'
            +'<button class="desk-category amz-star-filter" data-act="f-cond" data-v=""><span class="amz-stars">★★★★★</span><span>90分以上 · 极好</span></button>'
            +'<button class="desk-category amz-star-filter" data-act="f-cond" data-v=""><span class="amz-stars">★★★★☆</span><span>80分以上 · 优秀</span></button>'
            +'<button class="desk-category amz-star-filter" data-act="f-cond" data-v=""><span class="amz-stars">★★★☆☆</span><span>60分以上 · 良好</span></button>'
            +'</div>';
        var spotSidebar='<div class="amz-side-group"><h3>热门校内面交点</h3><div class="amz-side-tags">'
            +['北山斋宿舍','南山书院','图书馆正门','第一食堂','菜鸟驿站','双栀书院'].map(function(s){
                return '<button type="button" class="amz-side-tag" data-act="campus-search" data-v="'+s+'">📍 '+s+'</button>';
            }).join('')+'</div></div>';
        var mobileCats=categories.map(function(c){return '<button class="mobile-category '+(h.category===c[0]?'on':'')+'" data-act="f-cat" data-v="'+esc(c[0])+'"><b>'+esc(c[1])+'</b></button>';}).join('');
        var mobileSearch='<form class="mobile-search" data-form="search"><a class="mobile-search-icon" href="#/search" aria-label="打开搜索页">'+navIcon('search')+'</a><input name="keyword" aria-label="搜索校园闲置" placeholder="搜搜校园里的闲置好物" value="'+esc(h.keyword)+'"><button type="submit">搜索</button></form>';
        var mascotImage='<img src="/assets/brand/mascot-wave-320.webp" width="320" height="320" alt="挥手的换一圈吉祥物猫猫" decoding="async">';
        var shortcuts=[['#/offers','trade','我的报价'],['#/exchange','trade','我的交换'],['#/favorites','heart','收藏与历史']].map(function(link){
            return '<a class="desk-category" href="'+link[0]+'"><span class="desk-category-icon">'+navIcon(link[1])+'</span>'+link[2]+'</a>';
        }).join('');

        // 5列彩色大图入口卡片条（参照 Amazon 节日/频道竖幅海报）
        var posterStrip = '<section class="amz-poster-strip" aria-label="特色频道海报">'
            + '<div class="amz-poster-head"><h2>探索校园特色频道</h2><span>点击海报直达专场 ›</span></div>'
            + '<div class="amz-poster-row">'
            + '<a class="amz-poster-card poster-orange" href="#/auctions"><div class="amz-poster-copy"><h3>校园限时拍卖<br>低至 1 元起拍</h3><span>立即参与竞拍 ›</span></div><div class="amz-poster-collage"><span class="p-frame f1"><img src="/assets/amz/quad-auction.jpg" alt=""></span><span class="p-frame f2"><img src="/assets/amz/quad-digital.jpg" alt=""></span><span class="p-frame f3"><img src="/assets/amz/quad-books.jpg" alt=""></span><span class="p-frame f4"><img src="/assets/brand/mascot-box.png" alt=""></span></div></a>'
            + '<button type="button" class="amz-poster-card poster-sage" data-act="estimate"><div class="amz-poster-copy"><h3>AI 智能好物估价<br>秒算参考行情</h3></div><div class="amz-poster-art"><img src="/assets/amz/quad-appraise.jpg" alt="AI好物估价"></div></button>'
            + '<a class="amz-poster-card poster-peach" href="#/relay"><div class="amz-poster-copy"><h3>三方换物接力<br>自动匹配成环</h3></div><div class="amz-poster-art"><img src="/assets/amz/quad-relay.jpg" alt="三方换物接力"></div></a>'
            + '<a class="amz-poster-card poster-sand" href="#/idle"><div class="amz-poster-copy"><h3>学长学姐毕业季<br>宿舍好物出清</h3></div><div class="amz-poster-art"><img src="/assets/amz/quad-grad.jpg" alt="毕业季好物"></div></a>'
            + '<a class="amz-poster-card poster-sky" href="#/community"><div class="amz-poster-copy"><h3>校园频道与街机<br>边聊边玩更热闹</h3></div><div class="amz-poster-art"><img src="/assets/amz/quad-community.jpg" alt="校园社区"></div></a>'
            + '</div></section>';

        // 亚马逊首页：紧凑 1/4 高森林绿横幅 + 整体上移的 4 列白卡矩阵（吉祥物融入第四张信用分框） + 5 列视觉海报条
        var amzHomeTop = '<section class="desktop-market amz-home-stage">'
            + '<div class="amz-hero amz-hero-compact">'
            + '<div class="amz-hero-inner">'
            + '<div class="amz-hero-copy">'
            + '<span class="amz-hero-kicker">重庆移通学院 · 校园闲置集市</span>'
            + '<h1>好东西，再转一圈。</h1>'
            + '<p>校内面对面交易，以物换物、闲置转让、限时拍卖一站逛齐。</p>'
            + '</div>'
            + '<div class="amz-hero-btns"><a class="btn amz-btn-orange" href="#/idle">逛校园闲置</a><a class="btn amz-btn-outline" href="#/publish">发布我的闲置</a><a class="btn amz-btn-outline" href="#/appraise">AI 好物估价</a></div>'
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
                  + '<div class="amz-credit-art"><img src="/assets/amz/mascot-credit-card.png" alt="换一圈吉祥物信用认证"></div>'
                  + '<div class="amz-credit-info">'
                  + '<div class="amz-credit-score-row"><b>信用分 ' + me.credit + '</b><span class="amz-credit-pill">★ 信用极好</span></div>'
                  + '<p class="amz-credit-desc">实名学号已核验 · 尊享校内免押金当面换物与极速审核</p>'
                  + '<div class="amz-credit-quick">'
                  + '<a href="#/me">在架管理</a><a href="#/offers">报价记录</a><a href="#/favorites">收藏足迹</a>'
                  + '</div></div></div>'
                  + '<a class="btn amz-btn-orange btn-block" href="#/publish">立即发布闲置</a><a class="amz-quad-more" href="#/me">进入个人中心</a>'
                  : '<h2>登录获得完整体验</h2>'
                  + '<div class="amz-acct-mini amz-credit-mascot-box">'
                  + '<div class="amz-credit-art"><img src="/assets/amz/mascot-credit-card.png" alt="换一圈吉祥物信用认证"></div>'
                  + '<div class="amz-credit-info">'
                  + '<div class="amz-credit-score-row"><b>初始信用 80 分</b><span class="amz-credit-pill">★ 移通认证</span></div>'
                  + '<p class="amz-credit-desc">登录解锁发布闲置、1元竞拍、三方接力与私聊面交</p>'
                  + '<div class="amz-credit-quick">'
                  + '<a href="#/login">学号登录</a><a href="#/appraise">AI估价</a><a href="#/auctions">逛拍卖</a>'
                  + '</div></div></div>'
                  + '<a class="btn amz-btn-orange btn-block" href="#/login">安全登录</a><a class="amz-quad-more" href="#/login">新同学？立即注册</a>')
            + '</div></div>'
            + posterStrip
            + '</section>';

        var desktopSidebar='<aside class="category-panel desktop-market amz-rich-sidebar" aria-label="集市侧栏">'
            +'<div class="amz-side-hero"><img src="/assets/brand/mascot-wave-320.webp" width="52" height="52" alt=""><div><b>移通校园严选</b><small>实名认证 · 当面验货</small></div></div>'
            +'<h2 class="category-panel-title">商品部门与分类</h2>'+desktopCats
            + condSidebar
            + creditSidebar
            + spotSidebar
            +'<nav class="desktop-market-shortcuts" aria-label="快捷入口"><h2 class="category-panel-title">快捷入口</h2>'+shortcuts+'</nav>'
            +'<div class="amz-side-promo"><img src="/assets/brand/mascot-search.png" width="56" height="56" alt=""><div><b>不确定定多少价？</b><small>用 AI 估价秒算参考区间</small><button type="button" class="btn btn-primary btn-sm btn-block" data-act="estimate">立即 AI 估价</button></div></div>'
            +'</aside>';

        var mobile='<section class="mobile-market"><nav class="home-channels" aria-label="首页频道"><a aria-current="page" href="#/home">首页</a><a href="#/market" data-act="home-feed">集市</a><a href="#/community">社区</a><a href="#/auctions">拍卖</a></nav>'+mobileSearch+campusServices()+'<section class="mobile-story mascot-mobile" aria-label="换一圈校园伙伴"><div class="mascot-copy"><h1>好东西，<br>再转一圈。</h1><button data-act="go" data-to="#/publish">发布闲置 ↗</button></div><figure class="mascot-portrait">'+mascotImage+'</figure></section><div class="mobile-categories">'+mobileCats+'</div><div class="mobile-tools"><button data-act="go" data-to="#/auctions"><span>'+navIcon('auction')+'</span><b>校园拍卖</b><small>查看竞拍</small></button><button data-act="go" data-to="#/wishes"><span>'+navIcon('wish')+'</span><b>求换专区</b><small>找想要的</small></button><button data-act="go" data-to="#/community"><span>'+navIcon('community')+'</span><b>校园社区</b><small>聊聊近况</small></button><button data-act="go" data-to="#/trade"><span>'+navIcon('trade')+'</span><b>我的交易</b><small>换物进度</small></button></div></section>';
        var results='<section class="market-feed"><div class="feed-heading"><div><h2>'+(isSearch?'搜索结果':idle?'校园闲置':'为你推荐 · 校园好物')+'</h2><p>'+(isSearch?'“'+esc(h.keyword)+'” 的匹配商品':idle?'标价出售 · 校内面交':'支持以物换物与校园流转')+'</p></div><div class="feed-actions"><span class="feed-count">'+(isSearch?'显示 1–'+h.items.length+' 条，共 '+h.total+' 件':'已展示 '+h.items.length+' 件')+'</span><button class="feed-filter" data-act="open-filter">'+navIcon('filter')+' 筛选</button><button class="feed-publish" data-act="go" data-to="#/publish">'+navIcon('add')+' 发布</button></div></div>'
            +((h.category||h.condition)?'<div class="active-filter'+(h.condition?'':' category-only')+'" aria-label="已选筛选">'
                +(h.category?'<button class="chip on desktop-filter-category" data-act="f-cat" data-v="" aria-label="清除类别筛选">类别：'+esc(h.category)+' ×</button>':'')
                +(h.condition?'<button class="chip on" data-act="f-cond" data-v="" aria-label="清除成色筛选">成色：'+esc(h.condition)+' ×</button>':'')+'</div>':'')
            +(h.items.length?'<div class="pgrid">'+h.items.map(pCard).join('')+'</div>':emptyState(isSearch?'<img class="search-empty-mascot" src="/assets/brand/mascot-search.png" width="110" height="110" alt="">':navIcon('search'),'暂时没有找到好物',isSearch && h.searchConditions?.length ? '没有商品同时满足这些条件，可修改搜索词放宽条件。':'换个搜索词或筛选条件试试','<button class="btn btn-primary btn-sm" data-act="go" data-to="#/publish">发布闲置</button>'))
            +(h.hasMore?'<div class="feed-more"><button class="btn btn-ghost" data-act="load-more">加载更多</button></div>':'')+'</section>';
        if(isSearch){
            var conditions=(h.searchConditions||[]).map(function(label){return '<span class="chip on">'+esc(label)+'</span>';}).join('');
            renderSearchPage('<div class="market-home amz-browse-layout">'+desktopSidebar+'<div class="amz-browse-main">'+(conditions ? '<div class="active-filter" aria-label="已识别搜索条件">'+conditions+'</div>' : '')+results+'</div></div>');
            return;
        }
        if(idle || h.category || h.condition){
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
        if (location.hash !== '#/search') {
            try {
                var targetMode = location.hash === '#/idle' ? 1 : 2;
                var batch = await window.campusExchange.browse(
                    function (page) { return api('/item/list' + params.replace(/page=\d+/, 'page=' + page), options); },
                    targetMode, h.page);
                if (token !== homeLoadToken || currentView.name !== 'home') return false;
                if (location.hash === '#/idle' && h.page === 1 && (!batch.rows || !batch.rows.length)) {
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
            + '<p class="amz-free-ship">校园免费自提 · 校内公共点位面对面验货交接</p>'
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
            + '<p class="amz-buybox-stock">' + (it.status === 1 ? '校内可换 · 在架中' : esc(it.statusText || '当前不可交易')) + '</p>'
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
            + '<div class="jd-nav-group"><h4>👤 我的换一圈</h4>'
            + '<a href="#/me" class="' + (activeKey === 'me' ? 'on' : '') + '">个人中心主页</a>'
            + '</div>'
            + '<div class="jd-nav-group"><h4>🧾 订单中心</h4>'
            + '<a href="#/offers" class="' + (activeKey === 'offers' ? 'on' : '') + '">我的订单</a>'
            + '<a href="#/exchange" class="' + (activeKey === 'exchange' ? 'on' : '') + '">我的交换单</a>'
            + '<a href="#/auction/mine">我的竞拍活动</a>'
            + '<a href="#/me">评价晒单</a>'
            + '</div>'
            + '<div class="jd-nav-group"><h4>☆ 足迹收藏</h4>'
            + '<a href="#/history" class="' + (activeKey === 'history' ? 'on' : '') + '">我的足迹</a>'
            + '<a href="#/favorites" class="' + (activeKey === 'favorites' ? 'on' : '') + '">商品收藏 <em class="jd-nav-badge">有降价</em></a>'
            + '<a href="#/wishes">求换心愿单</a>'
            + '<a href="#/community">关注的频道</a>'
            + '</div>'
            + '<div class="jd-nav-group"><h4>💳 资产中心</h4>'
            + '<a href="#/appraise" class="' + (activeKey === 'appraise' ? 'on' : '') + '">AI 好物估价</a>'
            + '<a href="#/relay">三方换物凭证</a>'
            + '<a href="#/publish">闲置上架额度</a>'
            + '<a href="#/me">校园信用分</a>'
            + '</div>'
            + '<div class="jd-nav-group"><h4>🚀 特色业务</h4>'
            + '<a href="#/auctions">司法级校园拍卖</a>'
            + '<a href="#/relay">换物接力大厅</a>'
            + '<a href="#/community/game">Scrap Arena 街机</a>'
            + '</div>'
            + '<div class="jd-nav-group"><h4>⚙ 账户设置</h4>'
            + '<a href="#/settings">个人信息与安全</a>'
            + '<a href="#/notifications">消息通知中心</a>'
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
                title: '罗技 GPW 二代无线游戏鼠标 + 68键热插拔机械键盘套装（九成新·盒说全）',
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
        return demoOrders.map(function (d) {
            return '<article class="jd-order-item">'
                + '<header class="jd-item-head">'
                + '<span class="jd-item-time">' + d.time + '</span>'
                + '<span class="jd-item-no">订单号：<b>' + d.no + '</b></span>'
                + '<span class="jd-item-shop">' + d.shop + ' <i class="jd-chat-dot" title="联系同学">💬</i></span>'
                + '<button type="button" class="jd-item-trash" data-act="go" data-to="' + d.to + '" title="查看同类">🗑</button>'
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
                + '<div class="jd-col-buyer"><span class="jd-buyer-name">' + esc(d.user) + ' <i>👤</i></span></div>'
                + '<div class="jd-col-amount"><b>' + d.price + '</b><small>' + d.payType + '</small></div>'
                + '<div class="jd-col-status"><span class="jd-st-done">' + d.status + '</span><a href="' + d.to + '">订单详情</a></div>'
                + '<div class="jd-col-ops">'
                + '<a class="jd-op-link" href="#/me">评价 | 晒单</a>'
                + '<button type="button" class="jd-btn-rebuy" data-act="go" data-to="' + d.to + '">再次换购</button>'
                + '</div>'
                + '</div></article>';
        }).join('');
    }

    async function renderOffers() {
        $('#app').innerHTML = shell('offers', loading());
        var tab = state.offersTab;
        var list = await api(tab === 'received' ? '/offer/received' : '/offer/sent');
        var rows = (list || []).map(function (o) {
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
                + '<span class="jd-item-shop">重庆移通学院 · 校内当面换物 <i class="jd-chat-dot">💬</i></span>'
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
                + '<div class="jd-col-buyer"><span class="jd-buyer-name">' + esc(other) + ' <i>👤</i></span></div>'
                + '<div class="jd-col-amount"><b>等价互换</b><small>免服务费</small></div>'
                + '<div class="jd-col-status"><span class="tag ' + st[1] + '">' + st[0] + '</span><small style="display:block;margin-top:4px;color:#888">' + (o.status === 0 ? '24h内有效' : fmtRel(o.handleTime)) + '</small></div>'
                + '<div class="jd-col-ops">' + actions + '</div>'
                + '</div></article>';
        }).join('');

        var content = '<div class="jd-center-wrap">'
            + jdSideNav('offers')
            + '<div class="jd-order-main">'
            + '<div class="jd-order-title-bar"><h2>我的订单</h2><span>报价单与校内换物交易记录</span></div>'
            + '<div class="jd-order-panel">'
            + '<div class="jd-order-tabs-row">'
            + '<div class="jd-order-tabs">'
            + '<button type="button" class="' + (tab === 'received' ? 'on' : '') + '" data-act="offers-tab" data-v="received">全部订单 / 收到的报价</button>'
            + '<button type="button" class="' + (tab === 'sent' ? 'on' : '') + '" data-act="offers-tab" data-v="sent">我发出的报价</button>'
            + '<a href="#/exchange">待面交交换单</a>'
            + '<a href="#/me">待评价</a>'
            + '<a href="#/favorites" class="jd-tab-emph">我的常换商品</a>'
            + '<a href="#/auction/mine" class="jd-tab-emph">我的竞拍单</a>'
            + '</div>'
            + '<div class="jd-order-search">'
            + '<input type="search" placeholder="商品名称/商品编号/订单号" aria-label="订单搜索">'
            + '<button type="button" data-act="go" data-to="#/idle">搜索</button>'
            + '<button type="button" class="jd-btn-adv" data-act="go" data-to="#/exchange">高级 ▾</button>'
            + '</div>'
            + '</div>'
            + '<div class="jd-order-notice">☀ 换一圈不会以任何理由要求您点击任何校外网址链接进行退款或脱离平台转账，谨防诈骗！校内面交推荐选择书院大厅或图书馆前广场。</div>'
            + '<div class="jd-table-head">'
            + '<span class="col-goods">近三个月订单 ▾ &nbsp;&nbsp;&nbsp;&nbsp; 订单详情</span>'
            + '<span class="col-buyer">交易同学</span>'
            + '<span class="col-amount">金额 / 方式</span>'
            + '<span class="col-status">全部状态 ▾</span>'
            + '<span class="col-ops">操作</span>'
            + '</div>'
            + (rows ? '<div class="jd-order-list">' + rows + '</div>'
                : '<div class="jd-empty-order-box">'
                    + '<img src="/assets/brand/mascot-box.png" alt="">'
                    + '<div class="jd-empty-order-copy">'
                    + '<p>' + (tab === 'received' ? '最近还没有收到新的换物报价哦~' : '最近还没有发出过换物报价哦~') + '</p>'
                    + '<div class="jd-empty-btns">'
                    + '<button type="button" class="jd-btn-red" data-act="go" data-to="#/exchange">查看交换单</button>'
                    + '<button type="button" class="jd-btn-outline" data-act="go" data-to="#/home">去首页看看</button>'
                    + '</div></div></div>')
            + '<div class="jd-demo-divider"><span>近期校园成交订单实例（京东订单样式展示）</span><a href="#/idle">去集市挑好物 ›</a></div>'
            + '<div class="jd-order-list">' + jdShowcaseOrderRows() + '</div>'
            + '</div></div></div>';

        $('#app').innerHTML = shell('trade', content);
    }

    // ------------------------------------------------------------------ 三方环

    var DEMO_RELAYS = [
        {id: 801, isDemo: true, state: 'active', title: '【三方闭环】出罗技 GPW 二代无线鼠标 → 求换 iPad 二代电容笔 → 闭环贴补 ¥0', campus: '北山→南山→松格', stage: 'A→B→C 接力', value: 260, want: '数码外设', seller: '北山电竞阿泽', ringCount: 4, views: 1620, image: '/assets/amz/quad-relay.jpg'},
        {id: 802, isDemo: true, state: 'active', title: '【跨书院成环】出2026张宇考研数学全套 → 求换漫步者头戴耳机 → 图书馆同场交接', campus: '南山→竹逸→图书馆', stage: '差1人闭环', value: 110, want: '耳机/数码', seller: '南山学姐小林', ringCount: 3, views: 1280, image: '/assets/amz/quad-books.jpg'},
        {id: 803, isDemo: true, state: 'active', title: '【摄影接力环】出富士 mini11 拍立得相机 → 求换 Switch 卡带2张 → 已匹配2组环', campus: '菊轩→北山→梅若', stage: '高匹配度', value: 310, want: '游戏/潮玩', seller: '菊轩摄影糖糖', ringCount: 5, views: 2190, image: '/assets/amz/quad-auction.jpg'},
        {id: 804, isDemo: true, state: 'active', title: '【宿舍神器环】出米家长臂护眼台灯 1S → 求换尤尼克斯羽毛球拍 → 顺路寝室互送', campus: '松格→爱莲→北山', stage: 'A→B→C 接力', value: 85, want: '球拍/运动', seller: '松格机电老王', ringCount: 2, views: 940, image: '/assets/amz/quad-dorm.jpg'},
        {id: 805, isDemo: true, state: 'active', title: '【运动外设环】出斯伯丁7号吸湿篮球+球包 → 求换68键机械键盘 → 风雨球场验货', campus: '北山→南山→竹逸', stage: '随时成环', value: 135, want: '键盘/数码', seller: '球场科比阿杰', ringCount: 4, views: 1430, image: '/assets/amz/quad-sports.jpg'},
        {id: 806, isDemo: true, state: 'active', title: '【工科教材环】出卡西欧 fx-991CN X 计算器 → 求换大物实验报告指导书+尺规', campus: '南山→松格→北山', stage: '同院系接力', value: 65, want: '教材/工具', seller: '智能工程学长', ringCount: 6, views: 1750, image: '/assets/amz/quad-grad.jpg'},
        {id: 807, isDemo: true, state: 'active', title: '【音频数码环】出漫步者 W820NB 降噪耳机 → 求换小米手环8 Pro → 等价零差价', campus: '图书馆→菊轩→南山', stage: 'A→B→C 接力', value: 150, want: '智能穿戴', seller: '图书馆常驻生', ringCount: 3, views: 1560, image: '/assets/amz/quad-appraise.jpg'},
        {id: 808, isDemo: true, state: 'active', title: '【手作周边环】出复古火漆印章礼盒全套 → 求换泡泡玛特盲盒或桌面绿植盆栽', campus: '爱莲→梅若→菊轩', stage: '女生书院环', value: 55, want: '绿植/潮玩', seller: '爱莲手作小鹿', ringCount: 2, views: 890, image: '/assets/amz/quad-wishes.jpg'},
        {id: 809, isDemo: true, state: 'settled', title: '【已成环示范】Keychron K2 机械键盘 → 富士相纸礼盒 → 考研英语黄皮书三方交接', campus: '图书馆一楼大厅', stage: '已闭环交接', value: 180, want: '三方各得所需', seller: '大数据极客阿伟', ringCount: 1, views: 2310, image: '/assets/amz/quad-swap.jpg'},
        {id: 810, isDemo: true, state: 'active', title: '【毕业收纳环】出宜家感牛津布收纳箱×2+书立 → 求换滑板或哑铃一对', campus: '北山→松格→南山', stage: 'A→B→C 接力', value: 49, want: '运动器材', seller: '北山收纳达人', ringCount: 3, views: 1020, image: '/assets/amz/quad-delivery.jpg'}
    ];

    function relayCard(r) {
        var isSettled = r.state === 'settled';
        var href = r.isDemo ? '#/publish' : '#/cycle/' + Number(r.id);
        return '<article class="ali-auction-card">'
            + '<div class="ali-card-media">'
            + '<img class="ali-card-img" src="' + esc(r.image || '/assets/amz/quad-relay.jpg') + '" onerror="this.onerror=null;this.src=\'/assets/amz/quad-relay.jpg\'" alt="' + esc(r.title) + '" loading="lazy">'
            + '<span class="ali-stage-badge">' + esc(r.campus || '跨书院接力') + ' | ' + esc(r.stage || 'A→B→C') + '</span>'
            + '<span class="ali-status-corner ' + (isSettled ? 'is-done' : 'is-live') + '">' + (isSettled ? '已完成闭环' : '正在配对中') + '</span>'
            + '</div>'
            + '<div class="ali-card-body">'
            + '<h2 class="ali-card-title" title="' + esc(r.title) + '">' + esc(r.title) + '</h2>'
            + '<div class="ali-price-row">'
            + '<span class="ali-price-k">等价估值</span>'
            + '<b class="ali-price-v">¥' + esc(r.value || 99) + '</b>'
            + '<span class="ali-price-orig">求换：' + esc(r.want || '不限品类') + '</span>'
            + '</div>'
            + '<div class="ali-time-row"><span>接力模式</span><time>A → B → C 三方闭环</time></div>'
            + '<div class="ali-seller-row"><span>发起：' + esc(r.seller || '校内同学') + '</span><span>候选环：' + (r.ringCount || 2) + ' 组</span></div>'
            + '<div class="ali-card-actions">'
            + '<button type="button" class="ali-bid-btn ' + (isSettled ? 'is-muted' : '') + '" data-act="go" data-to="' + href + '">'
            + (r.isDemo ? (isSettled ? '查看同类接力好物' : '带我的闲置加入此环') : '立即搜索三方闭环方案')
            + '</button>'
            + '</div>'
            + '</div>'
            + '<footer class="ali-card-foot">'
            + '<span><b>' + (r.views || 1200) + '</b> 次围观</span>'
            + '<span><b>' + (r.ringCount || 3) + '</b> 组可成环</span>'
            + '</footer>'
            + '</article>';
    }

    async function renderRelay() {
        var items = [];
        var authHint = '';
        try {
            items = (await api('/item/mine?status=1', {optionalAuth:true})).filter(function(item) { return item.allowCycle && !item.isDemo; });
        } catch (error) {
            authHint = error.code === 401 ? '登录后可一键检测自己名下闲置的三方闭环方案' : esc(error.message);
        }
        if (currentView.name !== 'relay') return;

        var myRelayCards = items.map(function (it, idx) {
            return {
                id: Number(it.id),
                isDemo: false,
                state: 'active',
                title: '【我的在架可接力】' + it.title + ' → 期望换入：' + (it.wantCategory || '校园好物'),
                campus: '我的在架物品',
                stage: '可立即搜环',
                value: 120 + idx * 30,
                want: it.wantCategory || '任意等价物',
                seller: (state.me && state.me.nickname) || '我',
                ringCount: 3,
                views: 680 + idx * 95,
                image: firstImage(it.images) || '/assets/amz/quad-relay.jpg'
            };
        });
        var displayList = myRelayCards.concat(DEMO_RELAYS);
        var myQuickLinks = items.length
            ? '<div class="ali-my-relay-strip"><b>📦 我的可接力在架物品（点击立即计算 A→B→C 闭环）：</b>'
              + items.map(function (item) {
                  return '<a class="ali-my-relay-pill" href="#/cycle/' + Number(item.id) + '">🔄 ' + esc(item.title) + ' · 查看换法 ›</a>';
              }).join('') + '</div>'
            : '<div class="ali-my-relay-strip"><b>💡 什么是三方换物接力？</b><span>你有 A 想换 B、乙有 B 想换 C、丙有 C 想换 A —— 系统自动将三人匹配成环，当面同时交接！' + (authHint ? '（' + authHint + '）' : '') + '</span><a class="ali-my-relay-pill" href="#/publish">+ 发布支持接力的物品 ›</a></div>';

        var content = '<div class="ali-auction-page">'
            + '<header class="ali-sub-header">'
            + '<div class="ali-sub-brand">'
            + '<span class="ali-brand-main">换一圈 · 三方换物接力大厅</span>'
            + '<span class="ali-brand-sub">CAMPUS BARTER RELAY · A → B → C 智能跨书院成环引擎</span>'
            + '</div>'
            + '<nav class="ali-sub-nav" aria-label="接力导航">'
            + '<a href="#/relay" class="on">全部接力池 (' + displayList.length + ')</a>'
            + '<a href="#/wishes">求换心愿单</a>'
            + '<a href="#/auctions">校园限时拍卖</a>'
            + '<a href="#/exchange">已成环交换单</a>'
            + '</nav>'
            + '<div class="ali-sub-actions">'
            + '<a class="btn btn-ghost btn-sm" href="#/wishes">去发求换心愿</a>'
            + '<a class="btn btn-primary btn-sm" href="#/publish">+ 发布接力闲置</a>'
            + '</div>'
            + '</header>'

            + '<section class="ali-filter-box" aria-label="换物接力多维筛选">'
            + '<div class="ali-filter-row"><span class="ali-filter-k">提供物品分类：</span><div class="ali-filter-v">'
            + '<button type="button" class="on">全部标的</button>'
            + '<button type="button" data-act="go" data-to="#/idle?cat=数码">数码与外设</button>'
            + '<button type="button" data-act="go" data-to="#/idle?cat=教材">考研与教材</button>'
            + '<button type="button" data-act="go" data-to="#/idle?cat=运动">球拍与运动</button>'
            + '<button type="button" data-act="go" data-to="#/idle?cat=生活">宿舍神器</button>'
            + '<button type="button" data-act="go" data-to="#/appraise">AI 等价估值标的</button>'
            + '</div></div>'
            + '<div class="ali-filter-row"><span class="ali-filter-k">接力交接书院：</span><div class="ali-filter-v">'
            + '<button type="button" class="on">全校跨书院通换</button>'
            + '<button type="button">北山书院环线</button>'
            + '<button type="button">南山书院环线</button>'
            + '<button type="button">松格书院环线</button>'
            + '<button type="button">竹逸书院环线</button>'
            + '<button type="button">菊轩书院环线</button>'
            + '<button type="button">图书馆一楼圆桌点</button>'
            + '</div></div>'
            + '<div class="ali-filter-row"><span class="ali-filter-k">成环匹配状态：</span><div class="ali-filter-v">'
            + '<button type="button" class="on">全部接力 (' + displayList.length + ')</button>'
            + '<button type="button">差1人即可闭环</button>'
            + '<button type="button">零差价等价环</button>'
            + '<button type="button">已促成闭环示范</button>'
            + '</div></div>'
            + '</section>'

            + myQuickLinks

            + '<div class="ali-sort-toolbar">'
            + '<div class="ali-sort-checks">'
            + '<label><input type="checkbox" checked readonly> 开启 A→B→C 自动拓扑搜环</label>'
            + '<label><input type="checkbox" checked readonly> 支持书院大厅三方同场验货</label>'
            + '<label><input type="checkbox" checked readonly> 实名学号信用保障</label>'
            + '</div>'
            + '<div class="ali-sort-links">'
            + '<span class="on">成环概率排序</span>'
            + '<span>估值区间 ▾</span>'
            + '<span>围观热度 ▾</span>'
            + '<span>最新加入 ▾</span>'
            + '<img src="/assets/brand/mascot-wave-320.webp" alt="" class="ali-toolbar-mascot">'
            + '</div>'
            + '</div>'

            + '<div class="ali-auction-grid">'
            + displayList.map(relayCard).join('')
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
                + emptyState('♻', '没有找到闭合的换法', '可以再发一件物品，或者等别人补上新意向',
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
        var rows = (list || []).map(function (e) {
            var st = e.status === 3 ? 'success' : (e.status >= 4 ? 'ghost' : (e.status === 2 ? 'accent' : 'brand'));
            return '<article class="jd-order-item">'
                + '<header class="jd-item-head">'
                + '<span class="jd-item-time">校内实名担保交易</span>'
                + '<span class="jd-item-no">交换单号：<b>#EX' + (200000 + Number(e.id || 0)) + '</b></span>'
                + '<span class="jd-item-shop">' + (e.type === 3 ? '三方换物接力成环' : '一对一当面交换') + ' <i class="jd-chat-dot">💬</i></span>'
                + '<span class="jd-item-credit">面交点位：' + esc(e.place || '待双方约定') + '</span>'
                + '</header>'
                + '<div class="jd-item-row">'
                + '<div class="jd-col-goods">'
                + '<div class="jd-goods-thumb"><img src="/assets/amz/quad-relay.jpg" alt=""></div>'
                + '<div class="jd-goods-info">'
                + stepsHtml(e)
                + '<p class="jd-goods-note">' + (window.exchangeNeedsConfirmation(e) ? '已确认 ' + (e.confirmedCount || 0) + '/' + (e.needConfirm || 2) + ' · ' : '')
                + '已交付 ' + (e.deliveredCount || 0) + '/' + (e.needConfirm || 2) + '</p>'
                + '</div>'
                + '<span class="jd-goods-qty">x1</span>'
                + '<div class="jd-goods-repair"><a href="#/exchange/' + e.id + '">进度追踪</a></div>'
                + '</div>'
                + '<div class="jd-col-buyer"><span class="jd-buyer-name">校内同学 <i>👤</i></span></div>'
                + '<div class="jd-col-amount"><b>当面交接</b><small>' + (e.type === 3 ? '三方接力' : '双人互换') + '</small></div>'
                + '<div class="jd-col-status"><span class="tag ' + st + '">' + esc(e.statusText) + '</span><a href="#/exchange/' + e.id + '">订单详情</a></div>'
                + '<div class="jd-col-ops"><button class="jd-btn-rebuy" data-act="go" data-to="#/exchange/' + e.id + '">查看详情与操作</button></div>'
                + '</div></article>';
        }).join('');

        var content = '<div class="jd-center-wrap">'
            + jdSideNav('exchange')
            + '<div class="jd-order-main">'
            + '<div class="jd-order-title-bar"><h2>我的交换单</h2><span>线下当面验货与三方接力履约中心</span></div>'
            + '<div class="jd-order-panel">'
            + '<div class="jd-order-tabs-row">'
            + '<div class="jd-order-tabs">'
            + '<a href="#/offers">收到的报价</a>'
            + '<a href="#/exchange" class="on">我的交换单</a>'
            + '<a href="#/relay">三方换物接力</a>'
            + '<a href="#/me">待评价</a>'
            + '</div>'
            + '<div class="jd-order-search">'
            + '<input type="search" placeholder="商品名称/交换单号/面交点位" aria-label="交换单搜索">'
            + '<button type="button" data-act="go" data-to="#/idle">搜索</button>'
            + '</div>'
            + '</div>'
            + '<div class="jd-order-notice">☀ 面交时请当场核对物品成色与功能，双方在页面点击「确认收货」后自动结算信用分。</div>'
            + '<div class="jd-table-head">'
            + '<span class="col-goods">近三个月交换单 ▾ &nbsp;&nbsp;&nbsp;&nbsp; 订单详情</span>'
            + '<span class="col-buyer">交易伙伴</span>'
            + '<span class="col-amount">交易模式</span>'
            + '<span class="col-status">全部状态 ▾</span>'
            + '<span class="col-ops">操作</span>'
            + '</div>'
            + (rows ? '<div class="jd-order-list">' + rows + '</div>'
                : '<div class="jd-empty-order-box">'
                    + '<img src="/assets/brand/mascot-box.png" alt="">'
                    + '<div class="jd-empty-order-copy">'
                    + '<p>最近没有正在进行的交换单哦~</p>'
                    + '<div class="jd-empty-btns">'
                    + '<button type="button" class="jd-btn-red" data-act="go" data-to="#/offers">查看全部报价</button>'
                    + '<button type="button" class="jd-btn-outline" data-act="go" data-to="#/home">去首页看看</button>'
                    + '</div></div></div>')
            + '<div class="jd-demo-divider"><span>近期校园成交订单实例</span><a href="#/idle">去集市逛逛 ›</a></div>'
            + '<div class="jd-order-list">' + jdShowcaseOrderRows() + '</div>'
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
            + '<p>' + esc(me.college || '重庆移通学院') + ' · ' + esc(me.building || '北山书院') + '</p>'
            + '<div class="jd-me-user-links">'
            + '<button type="button" class="link-btn" data-act="open-profile">改资料</button>'
            + '<a href="#/settings">账号安全</a>'
            + (me.role === 1 ? '<button type="button" class="link-btn" data-act="go" data-to="#/admin">管理后台</button>' : '')
            + '<button type="button" class="link-btn" data-act="logout">退出</button>'
            + '</div></div></div>'
            + '<div class="jd-me-plus-bar">'
            + '<div><b>PLUS 唤唤会员</b><span>尊享校内优先匹配 & 免费 AI 估价特权</span></div>'
            + '<a href="#/appraise">立即体验 ›</a>'
            + '</div></div>'
            + '<div class="jd-me-assets-grid">'
            + '<div class="jd-asset-col"><b>' + me.credit + '</b><span>校园信用分</span><button type="button" class="jd-asset-act" data-act="credit-rule">信用规则</button></div>'
            + '<div class="jd-asset-col"><b>' + onShelf.length + '</b><span>在架闲置</span><a class="jd-asset-act" href="#/publish">继续发布</a></div>'
            + '<div class="jd-asset-col"><b>' + (me.dealCount || 0) + '</b><span>累计成交单</span><a class="jd-asset-act" href="#/exchange">查看履约</a></div>'
            + '<div class="jd-asset-col"><b>' + (me.reviewCount || 0) + '</b><span>收到评价</span><a class="jd-asset-act" href="#/user/' + Number(me.id) + '">查看主页</a></div>'
            + '<div class="jd-asset-col"><b>' + (me.avgScore ? me.avgScore : '5.0') + '</b><span>综合好评分</span>'
            + (pending.length ? '<button type="button" class="jd-asset-act accent" data-act="pending-review">' + pending.length + '单待评</button>' : '<a class="jd-asset-act" href="#/offers">报价中心</a>')
            + '</div></div>'
            + '<a class="jd-me-recycle-card" href="#/appraise">'
            + '<div class="jd-recycle-copy">'
            + '<span class="jd-recycle-tag">换一圈 AI 实验室</span>'
            + '<h4>闲置好物 · 秒出估值</h4>'
            + '<p>拍照上传自动分析成色与校内行情</p>'
            + '<b>去估价 ›</b>'
            + '</div>'
            + '<img src="/assets/brand/mascot-search.png" alt="">'
            + '</a>'
            + '</section>'

            + '<section class="jd-me-mid-grid">'
            + '<div class="jd-me-card jd-me-orders-card">'
            + '<header class="jd-card-head"><h3>我的订单</h3><a href="#/offers">查看全部订单 ›</a></header>'
            + '<div class="jd-order-quick-icons">'
            + '<a href="#/offers"><i>📥</i><span>收到报价</span></a>'
            + '<a href="#/exchange"><i>🤝</i><span>待面交交换</span></a>'
            + '<a href="#/me"><i>💬</i><span>待评价' + (pending.length ? ' (' + pending.length + ')' : '') + '</span></a>'
            + '<a href="#/relay"><i>🔄</i><span>三方接力环</span></a>'
            + '<a href="#/auction/mine"><i>🔨</i><span>我的竞拍</span></a>'
            + '</div>'
            + '<div class="jd-order-mini-preview">'
            + '<img src="/assets/brand/mascot-box.png" alt="">'
            + '<div><p>随时查看您的校内换物报价与线下交接进度</p><a href="#/offers">进入京东式订单中心查看明细 ›</a></div>'
            + '</div></div>'
            + '<div class="jd-me-card jd-me-fav-card">'
            + '<div class="jd-fav-stats">'
            + '<a href="#/favorites"><b>' + shelfRead('favorites').length + '</b><span>我的收藏</span></a>'
            + '<a href="#/history"><b>' + shelfRead('history').length + '</b><span>浏览足迹</span></a>'
            + '<a href="#/wishes"><b>' + (items || []).length + '</b><span>发布记录</span></a>'
            + '</div>'
            + '<a class="jd-fav-banner" href="#/auctions">'
            + '<div><b>校园限时拍卖专场</b><span>数码外设·考研教材 1 元起拍捡漏</span></div>'
            + '<em>立即进入 ›</em>'
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
            + '<a href="#/idle?cat=生活"><img src="/assets/amz/quad-dorm.jpg" alt=""><span>宿舍神器</span></a>'
            + '</div></div>'
            + '<div class="jd-me-3posters">'
            + '<a class="jd-poster-tile tone-peach" href="#/community"><h4>逛频道社区 ›</h4><p>失物招领·日常吹水</p><img src="/assets/amz/quad-community.jpg" alt=""></a>'
            + '<a class="jd-poster-tile tone-blue" href="#/relay"><h4>换物接力厅 ›</h4><p>A→B→C 跨书院成环</p><img src="/assets/amz/quad-relay.jpg" alt=""></a>'
            + '<a class="jd-poster-tile tone-mint" href="#/community/game"><h4>Scrap Arena ›</h4><p>下课双人同屏格斗</p><img src="/assets/brand/mascot-wave-320.webp" alt=""></a>'
            + '</div>'
            + '</section>'

            + '<section class="jd-me-card jd-me-footprint-embed">'
            + '<header class="jd-card-head">'
            + '<div class="jd-fp-embed-title"><h3>☆ 我的足迹与商品收藏</h3><span>11月15日 · 看过与收藏的校园好物</span></div>'
            + '<div class="jd-fp-embed-links"><a href="#/history" class="on">我的足迹 (' + shelfRead('history').length + ')</a><a href="#/favorites">商品收藏 (' + shelfRead('favorites').length + ') <em class="jd-nav-badge">有降价</em></a><a href="#/history">查看全部与管理 ›</a></div>'
            + '</header>'
            + '<div class="jd-history-grid">'
            + (shelfRead('favorites').concat(shelfRead('history')).slice(0, 4).map(function (it, idx) {
                return {
                    id: Number(it.id),
                    isDemo: false,
                    title: it.title || '校园好物',
                    category: it.category || '数码',
                    price: (59 + idx * 35) + '.90',
                    origPrice: (129 + idx * 50) + '.00',
                    subsidy: '校内实名认证 · 当面验货',
                    images: firstImage(it.images) || DEMO_SHELF_ITEMS[idx % DEMO_SHELF_ITEMS.length].images
                };
            }).concat(DEMO_SHELF_ITEMS).slice(0, 4).map(function (it) {
                var href = it.isDemo ? '#/idle?cat=' + encodeURIComponent(it.category) : '#/item/' + Number(it.id);
                var priceParts = String(it.price || '68.00').split('.');
                return '<article class="jd-history-card">'
                    + '<div class="jd-h-media">'
                    + '<a href="' + href + '" class="jd-h-img-link">'
                    + '<img src="' + esc(it.images) + '" onerror="this.onerror=null;this.src=\'/assets/amz/quad-digital.jpg\'" alt="' + esc(it.title) + '" loading="lazy">'
                    + '<div class="jd-h-substrip">'
                    + '<span class="jd-h-subprice"><small>换物参考价 ¥</small><b>' + esc(priceParts[0]) + '</b></span>'
                    + '<span class="jd-h-subtag">' + esc(it.subsidy || '校园认证好物') + '</span>'
                    + '</div></a></div>'
                    + '<div class="jd-h-body">'
                    + '<a href="' + href + '" class="jd-h-title"><span class="jd-self-badge">自营认证</span>' + esc(it.title) + '</a>'
                    + '<div class="jd-h-price-row">'
                    + '<div class="jd-h-price"><em>¥</em><b>' + esc(priceParts[0]) + '</b><sup>.' + esc(priceParts[1] || '00') + '</sup><del>到手价 ¥' + esc(it.origPrice || '199.00') + '</del></div>'
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
                : emptyState('⭐', '还没有评价', ''))
            + '</section>'
            + '</div></div>';

        $('#app').innerHTML = shell('me', content);
    }

    var DEMO_AUCTIONS = [
        {id: 901, isDemo: true, state: 'active', title: '【北山斋当面验货】罗技 G Pro X Superlight 无线鼠标 白色95新 盒说配件全', description: '大三换新鼠标出手，微动清脆无双击，续航两周以上，北山书院一楼大厅随时面交。', currentPrice: 265, marketPrice: 499, endsAt: '2026-11-18 21:00', seller: '北山电竞阿泽', bidCount: 18, views: 1840, bidder: '松格小陈', campus: '北山书院', stage: '一拍', image: '/assets/amz/quad-digital.jpg'},
        {id: 902, isDemo: true, state: 'active', title: '【考研上岸出】2026考研数学张宇1000题+同济高数第七版上下册+全套手写笔记', description: '成功上岸重庆理工，书本干净字迹工整，附赠英一真题黄皮书。', currentPrice: 38, marketPrice: 128, endsAt: '2026-11-17 19:30', seller: '南山学姐小林', bidCount: 11, views: 1320, bidder: '竹逸阿杰', campus: '南山书院', stage: '一拍', image: '/assets/amz/quad-books.jpg'},
        {id: 903, isDemo: true, state: 'active', title: '【毕业急出】富士 Instax mini11 拍立得相机 冰晶白 含半盒相纸与透明保护壳', description: '社团活动抽奖所得，仅拍过两盒相纸，镜头无划痕，支持校内试拍验机。', currentPrice: 290, marketPrice: 520, endsAt: '2026-11-19 20:00', seller: '菊轩摄影社糖糖', bidCount: 24, views: 2690, bidder: '梅若小鹿', campus: '菊轩书院', stage: '变卖', image: '/assets/amz/quad-auction.jpg'},
        {id: 904, isDemo: true, state: 'active', title: '【宿舍神器】米家智能LED长臂护眼台灯 1S 支持米家App调光 宿舍不断电可用', description: '灯光柔和不刺眼，底座稳固，送Type-C转接线，松格书院楼下自提。', currentPrice: 52, marketPrice: 149, endsAt: '2026-11-16 22:00', seller: '松格机电老王', bidCount: 9, views: 980, bidder: '爱莲小周', campus: '松格书院', stage: '一拍', image: '/assets/amz/quad-dorm.jpg'},
        {id: 905, isDemo: true, state: 'active', title: '【球场实战】斯伯丁 Spalding 7号PU吸湿防滑篮球 + 尤尼克斯羽毛球拍双拍包', description: '大四实习没空打球，球胆不漏气，球拍已拉24磅BG65线，送两筒耐打王。', currentPrice: 88, marketPrice: 230, endsAt: '2026-11-18 18:00', seller: '风雨球场科比', bidCount: 15, views: 1510, bidder: '北山体育生', campus: '北山书院', stage: '一拍', image: '/assets/amz/quad-sports.jpg'},
        {id: 906, isDemo: true, state: 'active', title: '【学长毕业礼包】九成新卡西欧 fx-991CN X 中文函数计算器 + 工程制图尺规全套', description: '工科期末考试必备神器，考场合规型号，太阳能+电池双供电，字迹清晰。', currentPrice: 46, marketPrice: 135, endsAt: '2026-11-20 12:00', seller: '智能工程学院学长', bidCount: 13, views: 1190, bidder: '大一萌新', campus: '南山书院', stage: '一拍', image: '/assets/amz/quad-grad.jpg'},
        {id: 907, isDemo: true, state: 'active', title: '【满电秒发】漫步者 W820NB 双金标主动降噪头戴式蓝牙耳机 云岩白 图书馆神器', description: '耳罩柔软不夹头，开启深度降噪在图书馆背书超安静，充一次电用一周。', currentPrice: 135, marketPrice: 299, endsAt: '2026-11-19 21:30', seller: '图书馆常驻选手', bidCount: 21, views: 2150, bidder: '竹逸小吴', campus: '图书馆大厅', stage: '二拍', image: '/assets/amz/quad-appraise.jpg'},
        {id: 908, isDemo: true, state: 'active', title: '【支持换物抵扣】复古火漆印章礼盒 + 手账胶带钢笔套装 生日伴手礼盒全新未拆', description: '多买了一套送室友，包装丝带完好，可直接竞拍也可拿课外小说等价抵扣。', currentPrice: 29, marketPrice: 89, endsAt: '2026-11-17 20:00', seller: '爱莲手作铺', bidCount: 7, views: 760, bidder: '菊轩小晴', campus: '爱莲书院', stage: '一拍', image: '/assets/amz/quad-wishes.jpg'},
        {id: 909, isDemo: true, state: 'settled', selectedAmount: 160, winner: '南山书院阿伟', title: '【已成交示范】Keychron K2 无线蓝牙双模机械键盘 茶轴RGB背光 Mac/Win双系统键帽', description: '茶轴手感柔和不吵室友，支持三台设备一键切换，已完成图书馆一楼当面交接。', currentPrice: 160, marketPrice: 368, endsAt: '2026-11-14 20:00', seller: '大数据学院极客', bidCount: 19, views: 2430, bidder: '南山书院阿伟', campus: '图书馆大厅', stage: '一拍', image: '/assets/amz/quad-swap.jpg'},
        {id: 910, isDemo: true, state: 'active', title: '【宿舍收纳整箱】宜家感牛津布衣物收纳箱×2 + 桌面书立架 + 寝室门后挂钩套装', description: '换宿舍整理出的全新闲置，打包1元起拍，支持北山斋至南山书院顺路送达。', currentPrice: 19, marketPrice: 75, endsAt: '2026-11-18 22:30', seller: '北山收纳达人', bidCount: 14, views: 1080, bidder: '梅若小张', campus: '北山书院', stage: '变卖', image: '/assets/amz/quad-delivery.jpg'}
    ];

    function auctionCard(a, mode) {
        var labels={active:'正在进行',cancelled:'已撤回',pending:'待审核',rejected:'审核未通过',settled:'已成交',ended:a.bidCount ? '待卖家结算' : '已流拍'};
        var end=String(a.endsAt || '2026-11-18 20:00').replace('T',' ').slice(0,16);
        var fallbackImgs=['/assets/amz/quad-auction.jpg','/assets/amz/quad-digital.jpg','/assets/amz/quad-books.jpg','/assets/amz/quad-dorm.jpg','/assets/amz/quad-sports.jpg'];
        var image=firstImage(a.image) || fallbackImgs[Math.abs(Number(a.id || 0)) % fallbackImgs.length];
        var views = a.views || (Number(a.id || 1) * 137 + Number(a.bidCount || 3) * 42);
        var stage = a.stage || '一拍';
        var campus = a.campus || '校内书院面交';
        var marketPrice = a.marketPrice || Math.round((Number(a.currentPrice) || 50) * 1.8);
        var statusCls = a.state === 'active' ? 'is-live' : (a.state === 'settled' ? 'is-done' : 'is-end');
        return '<article class="ali-auction-card">'
            + '<div class="ali-card-media">'
            + '<img class="ali-card-img" src="'+esc(image)+'" onerror="this.onerror=null;this.src=\'/assets/amz/quad-auction.jpg\'" alt="'+esc(a.title)+'" loading="lazy" decoding="async">'
            + '<span class="ali-stage-badge">'+esc(campus)+' | '+esc(stage)+'</span>'
            + '<span class="ali-status-corner '+statusCls+'">'+esc(labels[a.state] || '正在进行')+'</span>'
            + '</div>'
            + '<div class="ali-card-body">'
            + '<h2 class="ali-card-title" title="'+esc(a.title)+'">'+esc(a.title)+'</h2>'
            + '<div class="ali-price-row">'
            + '<span class="ali-price-k">'+(a.state==='settled'?'成交价':(a.bidCount?'当前价':'起拍价'))+'</span>'
            + '<b class="ali-price-v">¥'+esc(a.state==='settled'&&(a.selectedAmount||a.currentPrice)?(a.selectedAmount||a.currentPrice):a.currentPrice)+'</b>'
            + '<span class="ali-price-orig">参考价 ¥'+esc(marketPrice)+'</span>'
            + '</div>'
            + '<div class="ali-time-row"><span>结束时间</span><time>'+esc(end)+'</time></div>'
            + '<div class="ali-seller-row"><span>发布：'+esc(a.seller || '校内同学')+'</span>'+(a.bidder?'<span>领先：'+esc(a.bidder)+'</span>':'')+'</div>'
            + (a.state==='settled'?'<p class="ali-settled-tip">成交同学：'+esc(a.winner || a.bidder || '校内同学')+' · 线下当面交付</p>':'')
            + '<div class="ali-card-actions">'
            + (mode==='admin'&&a.state==='pending'?'<button class="btn btn-sm btn-primary" data-act="review-listing" data-kind="auctions" data-do="approve" data-id="'+a.id+'">通过</button><button class="btn btn-sm" data-act="review-listing" data-kind="auctions" data-do="reject" data-id="'+a.id+'">驳回</button>':'')
            + (mode==='admin'&&(a.state==='active'||a.state==='ended')&&!a.isDemo?'<button class="btn btn-sm" data-act="auction-cancel" data-id="'+a.id+'">取消拍卖</button>':'')
            + (mode==='mine'&&(a.state==='active'||a.state==='ended')&&a.bidCount&&!a.isDemo?'<button class="btn btn-primary btn-sm" data-act="auction-bids" data-id="'+a.id+'">查看报价并结算</button>':'')
            + (mode==='public'&&a.state==='active'?(a.isDemo
                ? '<button class="ali-bid-btn" data-act="go" data-to="#/auction/new">参与竞拍 / 发起同款</button>'
                : '<button class="ali-bid-btn" data-act="auction-bid" data-id="'+a.id+'">立即出价竞拍</button>'):'')
            + (mode==='public'&&a.state!=='active'?'<button class="ali-bid-btn is-muted" data-act="go" data-to="#/idle">查看同类在架好物</button>':'')
            + '</div>'
            + '</div>'
            + '<footer class="ali-card-foot">'
            + '<span><b>'+views+'</b> 次围观</span>'
            + '<span><b>'+(a.bidCount || 0)+'</b> 次出价</span>'
            + '</footer>'
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
        var displayList = mine ? auctions : auctions.concat(DEMO_AUCTIONS);
        var content = '<div class="ali-auction-page">'
            + '<header class="ali-sub-header">'
            + '<div class="ali-sub-brand">'
            + '<span class="ali-brand-main">换一圈资产 · 校园拍卖</span>'
            + '<span class="ali-brand-sub">CAMPUS AUCTION · 校内实名竞价与闲置变卖平台</span>'
            + '</div>'
            + '<nav class="ali-sub-nav" aria-label="拍卖导航">'
            + '<a href="#/auctions" class="' + (!mine ? 'on' : '') + '">全部标的物</a>'
            + '<a href="#/auctions">数码外设专场</a>'
            + '<a href="#/auctions">考研教材专场</a>'
            + '<a href="#/auctions">毕业清仓变卖</a>'
            + '<a href="#/auction/mine" class="' + (mine ? 'on' : '') + '">我的竞拍管理</a>'
            + '</nav>'
            + '<div class="ali-sub-actions">'
            + '<a class="btn btn-ghost btn-sm" href="' + (mine ? '#/auctions' : '#/auction/mine') + '">' + (mine ? '返回拍卖大厅' : '我的拍卖') + '</a>'
            + '<a class="btn btn-primary btn-sm" href="#/auction/new">+ 发起校园拍卖</a>'
            + '</div>'
            + '</header>'

            + '<section class="ali-filter-box" aria-label="拍品多维筛选">'
            + '<div class="ali-filter-row"><span class="ali-filter-k">标的物分类：</span><div class="ali-filter-v">'
            + '<button type="button" class="on" data-act="go" data-to="#/auctions">全部</button>'
            + '<button type="button" data-act="go" data-to="#/idle?cat=数码">电脑数码</button>'
            + '<button type="button" data-act="go" data-to="#/idle?cat=教材">考研与教材</button>'
            + '<button type="button" data-act="go" data-to="#/idle?cat=生活">宿舍电器与生活</button>'
            + '<button type="button" data-act="go" data-to="#/idle?cat=运动">运动户外与球拍</button>'
            + '<button type="button" data-act="go" data-to="#/idle?cat=其他">手办乐器与周边</button>'
            + '<button type="button" data-act="go" data-to="#/appraise">AI 估价认证标的</button>'
            + '</div></div>'
            + '<div class="ali-filter-row"><span class="ali-filter-k">交接书院点位：</span><div class="ali-filter-v">'
            + '<button type="button" class="on">全部重庆移通校区</button>'
            + '<button type="button">北山书院</button>'
            + '<button type="button">南山书院</button>'
            + '<button type="button">松格书院</button>'
            + '<button type="button">竹逸书院</button>'
            + '<button type="button">菊轩书院</button>'
            + '<button type="button">梅若书院</button>'
            + '<button type="button">爱莲书院</button>'
            + '<button type="button">图书馆一楼大厅</button>'
            + '</div></div>'
            + '<div class="ali-filter-row"><span class="ali-filter-k">拍品状态与阶段：</span><div class="ali-filter-v">'
            + '<button type="button" class="on">全部状态 (' + displayList.length + ')</button>'
            + '<button type="button">正在进行</button>'
            + '<button type="button">即将结拍</button>'
            + '<button type="button">已成交公示</button>'
            + '<button type="button">一拍专场</button>'
            + '<button type="button">二拍捡漏</button>'
            + '<button type="button">毕业变卖</button>'
            + '</div></div>'
            + '</section>'

            + '<div class="ali-sort-toolbar">'
            + '<div class="ali-sort-checks">'
            + '<label><input type="checkbox" checked readonly> 全部拍品</label>'
            + '<label><input type="checkbox" checked readonly> 支持校内当面验货</label>'
            + '<label><input type="checkbox" checked readonly> 实名信用担保</label>'
            + '<label><input type="checkbox"> 接受以物抵扣</label>'
            + '</div>'
            + '<div class="ali-sort-links">'
            + '<span class="on">默认排序</span>'
            + '<span>当前价 ▾</span>'
            + '<span>围观热度 ▾</span>'
            + '<span>结拍时间 ▾</span>'
            + '<span>出价次数 ▾</span>'
            + '<img src="/assets/brand/mascot-success.png" alt="" class="ali-toolbar-mascot">'
            + '</div>'
            + '</div>'

            + (loadError && mine ? '<div class="card card-pad"><p>' + esc(loadError) + '</p></div>' : '')
            + (displayList.length
                ? '<div class="ali-auction-grid">' + displayList.map(function (a) { return auctionCard(a, mine ? 'mine' : 'public'); }).join('') + '</div>'
                : '<div class="card card-pad"><p>您还没有发起过拍卖，点击右上角「+ 发起校园拍卖」即可上架拍品。</p></div>')
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

        var demoContacts = [
            {ava: '宏', tone: 'tone-blue', name: '北山羽毛球穿线社', date: '2026/11/15', msg: '亲，您有一笔换物报价待确认哦', unread: 1, active: true, to: '#/offers'},
            {ava: '诺', tone: 'tone-navy', name: '一诺体育器材流转', date: '2026/11/14', msg: '请确认北山书院一楼大厅面交点位', unread: 1, active: false, to: '#/exchange'},
            {ava: '烁', tone: 'tone-teal', name: '烁羽球拍与外设铺', date: '2026/11/13', msg: '罗技 GPW 二代已充好电随时可试', unread: 0, active: false, to: '#/idle?cat=数码'},
            {ava: '琪', tone: 'tone-orange', name: '琪琪电竞外设学长', date: '2026/11/12', msg: '快领取，您的专属同院系换物礼券', unread: 1, active: false, to: '#/auctions'},
            {ava: '青', tone: 'tone-green', name: '青禾考研资料漂流', date: '2026/11/10', msg: '——免费附送同济高数期末真题笔记——', unread: 0, active: false, to: '#/idle?cat=教材'},
            {ava: '纯', tone: 'tone-pink', name: '小纯桌搭与拍立得', date: '2026/11/09', msg: '下课10分钟左右到图书馆一楼大厅交接', unread: 0, active: false, to: '#/wishes'},
            {ava: '浩', tone: 'tone-red', name: '浩迪数卡与计算器', date: '2026/11/08', msg: '卡西欧 fx-991CN X 中文版考场可用', unread: 1, active: false, to: '#/appraise'},
            {ava: '国', tone: 'tone-brown', name: '移通严选宿舍好物', date: '2026/11/06', msg: '米家护眼灯支持三方换物接力成环', unread: 1, active: false, to: '#/relay'}
        ].map(function (c) {
            return '<a class="conversation-row tb-contact-item ' + (c.active ? 'on' : '') + '" href="' + c.to + '">'
                + '<span class="tb-contact-ava ' + c.tone + '">' + c.ava + '</span>'
                + '<div class="tb-contact-meta">'
                + '<div class="tb-contact-top"><b>' + esc(c.name) + '</b><time>' + c.date + '</time></div>'
                + '<div class="tb-contact-sub"><p>' + esc(c.msg) + '</p>' + (c.unread ? '<em class="tb-unread-dot">' + c.unread + '</em>' : '') + '</div>'
                + '</div></a>';
        }).join('');

        var content = '<section class="messages-page tb-im-backdrop" aria-label="消息与聊天窗口">'
            + '<div class="tb-im-window">'
            + '<aside class="tb-im-left">'
            + '<div class="tb-left-head">'
            + '<span class="tb-left-title">💬 聊天列表</span>'
            + '<button type="button" class="tb-read-btn" data-act="notice-read">全部已读</button>'
            + '</div>'
            + '<div class="tb-left-search">'
            + '<input type="search" id="message-filter" placeholder="🔍 搜索最近联系人" aria-label="搜索消息联系人">'
            + '</div>'
            + '<div class="tb-contact-list conversation-list">'
            + realConvRows
            + demoContacts
            + '</div>'
            + '</aside>'

            + '<div class="tb-im-center">'
            + '<header class="tb-chat-header">'
            + '<div class="tb-chat-peer"><b>北山羽毛球穿线社 · 宏羽运动体育</b><span class="tb-online-tag">● 校内实名在线</span></div>'
            + '<div class="tb-chat-top-btns">'
            + '<a href="#/followers" class="tb-top-chip">谁关注了我</a>'
            + '<a href="#/offers" class="tb-top-chip">报价单中心</a>'
            + '<button type="button" class="tb-top-chip primary" data-act="notice-read">全部标为已读</button>'
            + '</div>'
            + '</header>'

            + '<div class="tb-chat-stream">'
            + (realNoticeRows ? '<div class="tb-real-notices"><div class="tb-stream-divider"><span>🔔 最新系统与交易通知（点击直达）</span></div>' + realNoticeRows + '</div>' : '')

            + '<div class="tb-msg-group">'
            + '<div class="tb-msg-sender"><img src="/assets/brand/mascot-wave-320.webp" alt=""><span>cghcous:小绿花</span><time>2026-11-15 15:16:40</time></div>'
            + '<div class="tb-order-card">'
            + '<h4>亲，您有一笔校园换物单待确认哦</h4>'
            + '<div class="tb-order-item-box">'
            + '<img src="/assets/amz/quad-sports.jpg" alt="">'
            + '<div class="tb-order-item-info"><p>正品VICTOR威克多 胜利大鬼斩羽毛球拍 24磅</p><small>支持以物换物 / 书院当面验拍</small></div>'
            + '<div class="tb-order-item-price"><b>¥102.0</b><span>共1件</span></div>'
            + '</div>'
            + '<a href="#/offers" class="tb-order-orange-btn">去确认报价</a>'
            + '</div>'
            + '</div>'

            + '<div class="tb-msg-group">'
            + '<div class="tb-msg-sender"><img src="/assets/brand/mascot-wave-320.webp" alt=""><span>cghcous:小绿花</span><time>2026-11-15 15:20:16</time></div>'
            + '<div class="tb-text-bubble">'
            + '亲，您有一笔换物订单待确认面交点位，如您换的羽毛球拍已拉好24磅BG65线，北山书院一楼大厅可当场试挥验货，满意再点确认收货哦~'
            + '</div>'
            + '</div>'

            + '<div class="tb-msg-group">'
            + '<div class="tb-msg-sender"><img src="/assets/brand/mascot-wave-320.webp" alt=""><span>cghcous:小绿花</span><time>2026-11-15 15:22:05</time></div>'
            + '<div class="tb-order-card">'
            + '<h4>亲，您有一笔三方接力环待锁定哦</h4>'
            + '<div class="tb-order-item-box">'
            + '<img src="/assets/amz/quad-digital.jpg" alt="">'
            + '<div class="tb-order-item-info"><p>罗技 GPW 二代无线鼠标 ⇄ 2026考研高数全套笔记</p><small>A→B→C 三方闭环匹配成功</small></div>'
            + '<div class="tb-order-item-price"><b>等价换</b><span>共1组</span></div>'
            + '</div>'
            + '<a href="#/relay" class="tb-order-orange-btn">去查看接力环</a>'
            + '</div>'
            + '<a href="#/offers" class="tb-bottom-pill">回到底部 ∨</a>'
            + '</div>'
            + '</div>'

            + '<div class="tb-chat-compose">'
            + '<div class="tb-compose-toolbar">'
            + '<div class="tb-tool-icons">'
            + '<button type="button" title="表情" onclick="var t=document.getElementById(\'tb-im-input\');if(t)t.value+=\'😊 \'">😊</button>'
            + '<button type="button" title="发送图片" data-act="go" data-to="#/community">🖼</button>'
            + '<button type="button" title="核对订单" data-act="go" data-to="#/offers">📦</button>'
            + '<button type="button" title="AI估价" data-act="go" data-to="#/appraise">✂</button>'
            + '</div>'
            + '<span class="tb-char-count">0 / 500</span>'
            + '</div>'
            + '<textarea id="tb-im-input" rows="3" placeholder="请输入消息，按 Enter 键 或 点击发送按钮发送"></textarea>'
            + '<div class="tb-compose-foot">'
            + '<button type="button" class="tb-send-btn" onclick="var t=document.getElementById(\'tb-im-input\');if(t&&t.value.trim()){t.value=\'\';this.innerHTML=\'已发送 ✓\';}">发送 <span>| ▾</span></button>'
            + '</div>'
            + '</div>'
            + '</div>'

            + '<aside class="tb-im-right">'
            + '<div class="tb-shop-card">'
            + '<div class="tb-shop-top">'
            + '<img src="/assets/amz/quad-sports.jpg" alt="">'
            + '<div><b>宏羽运动体育</b><a href="#/idle?cat=运动" class="tb-enter-shop">进入主页</a></div>'
            + '</div>'
            + '<div class="tb-shop-stats">'
            + '<div><span>校园信用</span><b>96 极好</b></div>'
            + '<div><span>平均响应</span><b>3 分钟</b></div>'
            + '<div><span>常驻书院</span><b>北山书院</b></div>'
            + '</div>'
            + '</div>'
            + '<div class="tb-mascot-helper">'
            + '<img src="/assets/amz/mascot-credit-card.png" alt="换一圈吉祥物小助手">'
            + '<h5>换一圈安全面交贴士</h5>'
            + '<p>校内换物推荐约定书院一楼大厅或图书馆前广场，当面验货无误后再点击确认收货。</p>'
            + '<a href="#/appraise" class="tb-helper-link">🤖 拿不准价格？去 AI 估价 ›</a>'
            + '</div>'
            + '</aside>'
            + '</div>'

            + '<div class="tb-float-dock">'
            + '<a href="#/settings">⚙<span>消息设置</span></a>'
            + '<a href="#/community">📝<span>反馈</span></a>'
            + '</div>'
            + '</section>';

        $('#app').innerHTML = shell('notifications', content);
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
        var campus = w.campus || '校内书院面交';
        var stage = w.stage || (w.category ? w.category + '求换' : '心愿求换');
        var budget = w.budget || (45 + (Math.abs(Number(w.id || 1)) * 19) % 160);
        var offerText = w.offerText || (w.content ? String(w.content).slice(0, 14) : '支持等价好物互换');
        var views = w.views || (620 + Math.abs(Number(w.id || 1)) * 47);
        var replies = w.replyCount || (3 + (Math.abs(Number(w.id || 1)) % 9));
        return '<article class="ali-auction-card wish-card">'
            + '<div class="ali-card-media">'
            + '<img class="ali-card-img" src="' + esc(img) + '" onerror="this.onerror=null;this.src=\'/assets/amz/quad-wishes.jpg\'" alt="' + esc(w.title) + '" loading="lazy">'
            + '<span class="ali-stage-badge">' + esc(campus) + ' | ' + esc(stage) + '</span>'
            + '<span class="ali-status-corner ' + (isSettled ? 'is-done' : 'is-live') + '">' + (isSettled ? '心愿已达成' : '急求响应中') + '</span>'
            + '</div>'
            + '<div class="ali-card-body">'
            + '<h2 class="ali-card-title" title="' + esc(w.title) + '">' + esc(w.title) + '</h2>'
            + '<div class="ali-price-row">'
            + '<span class="ali-price-k">心理估值</span>'
            + '<b class="ali-price-v">¥' + esc(budget) + '</b>'
            + '<span class="ali-price-orig">' + esc(offerText) + '</span>'
            + '</div>'
            + '<div class="ali-time-row"><span>求换分类</span><time>' + esc(w.category || '全品类好物') + '</time></div>'
            + '<div class="ali-seller-row"><span>许愿同学：' + esc(w.nickname || '移通同学') + '</span><span>信用极好</span></div>'
            + '<div class="ali-card-actions">'
            + (isMine
                ? '<button type="button" class="ali-bid-btn is-muted" data-act="wish-close" data-id="' + w.id + '">关闭我的求换</button>'
                : (w.isDemo
                    ? '<button type="button" class="ali-bid-btn ' + (isSettled ? 'is-muted' : '') + '" data-act="go" data-to="#/idle' + (w.category ? '?cat=' + encodeURIComponent(w.category) : '') + '">' + (isSettled ? '查看同类在架好物' : '我有同款 · 去响应交换') + '</button>'
                    : '<button type="button" class="ali-bid-btn" data-act="go" data-to="#/user/' + w.userId + '">联系发布者响应心愿</button>'))
            + '</div>'
            + '</div>'
            + '<footer class="ali-card-foot">'
            + '<span><b>' + views + '</b> 次围观</span>'
            + '<span><b>' + replies + '</b> 人有同款</span>'
            + '</footer>'
            + '</article>';
    }

    async function renderWishes() {
        var offered = (await api('/item/mine?status=1', {optionalAuth: true}).catch(function () { return []; })).filter(function (item) { return item.allowCycle && !item.isDemo; });
        var offerOptions = offered.map(function (item) { return '<option value="' + Number(item.id) + '">' + esc(item.title) + '</option>'; }).join('');
        var matched = currentView.name === 'wishes' ? currentView.arg : null;
        var wishes = await api('/wish' + (matched ? '/' + matched : ''), {optionalAuth: true}).catch(function () { return []; });
        var displayList = (wishes || []).concat(DEMO_WISHES);

        var content = '<div class="ali-auction-page">'
            + '<header class="ali-sub-header">'
            + '<div class="ali-sub-brand">'
            + '<span class="ali-brand-main">换一圈 · 校园求换心愿大厅</span>'
            + '<span class="ali-brand-sub">CAMPUS WISH & BOUNTY HALL · 发心愿 · 找同款 · 极速配对</span>'
            + '</div>'
            + '<nav class="ali-sub-nav" aria-label="求换专区导航">'
            + '<a href="#/wishes" class="on">全部求换心愿 (' + displayList.length + ')</a>'
            + '<a href="#/relay">三方换物接力</a>'
            + '<a href="#/auctions">校园限时拍卖</a>'
            + '<a href="#/community">去社区频道喊话</a>'
            + '</nav>'
            + '<div class="ali-sub-actions">'
            + '<button type="button" class="btn btn-primary btn-sm" onclick="var el=document.getElementById(\'ali-wish-composer\');if(el){el.scrollIntoView({behavior:\'smooth\'});el.querySelector(\'input\')?.focus();}">+ 发布求换心愿</button>'
            + '</div>'
            + '</header>'

            + '<form id="ali-wish-composer" class="ali-wish-bar wish-form" data-form="wish-new">'
            + '<div class="ali-wish-bar-head"><img src="/assets/brand/mascot-wave-320.webp" alt=""><div><b>✨ 发起我的求换心愿</b><span>写下你想换的物品，系统自动匹配全校在架好物并通知双方</span></div></div>'
            + '<div class="ali-wish-bar-fields">'
            + '<input class="input" name="title" maxlength="100" placeholder="我想要：例如 一本高数习题集 / 罗技无线鼠标" aria-label="我想要" required>'
            + '<select class="select" name="category" aria-label="类别"><option value="">全部类别</option>' + CATS.map(function (c) { return '<option>' + esc(c) + '</option>'; }).join('') + '</select>'
            + '<select class="select" id="wish-offer" name="offeredItemId" aria-label="我拿什么换"><option value="">不关联物品（普通心愿）</option>' + offerOptions + '</select>'
            + '<input class="input" name="content" maxlength="500" placeholder="补充说明：成色要求、可交接书院等（选填）" aria-label="补充说明">'
            + '<button class="btn btn-primary" type="submit">立即发布求换</button>'
            + '</div>'
            + '</form>'

            + '<section class="ali-filter-box" aria-label="求换心愿多维筛选">'
            + '<div class="ali-filter-row"><span class="ali-filter-k">求换目标分类：</span><div class="ali-filter-v">'
            + '<button type="button" class="on">全部心愿</button>'
            + '<button type="button" data-act="go" data-to="#/idle?cat=数码">电脑数码与外设</button>'
            + '<button type="button" data-act="go" data-to="#/idle?cat=教材">考研与期末教材</button>'
            + '<button type="button" data-act="go" data-to="#/idle?cat=运动">羽毛球拍与运动</button>'
            + '<button type="button" data-act="go" data-to="#/idle?cat=生活">宿舍神器与灯具</button>'
            + '<button type="button" data-act="go" data-to="#/idle?cat=其他">潮玩手办与绿植</button>'
            + '</div></div>'
            + '<div class="ali-filter-row"><span class="ali-filter-k">期望交接书院：</span><div class="ali-filter-v">'
            + '<button type="button" class="on">全校书院通用</button>'
            + '<button type="button">北山书院</button>'
            + '<button type="button">南山书院</button>'
            + '<button type="button">松格书院</button>'
            + '<button type="button">竹逸书院</button>'
            + '<button type="button">菊轩书院</button>'
            + '<button type="button">爱莲书院</button>'
            + '<button type="button">图书馆一楼大厅</button>'
            + '</div></div>'
            + '<div class="ali-filter-row"><span class="ali-filter-k">交换方式偏好：</span><div class="ali-filter-v">'
            + '<button type="button" class="on">全部方式 (' + displayList.length + ')</button>'
            + '<button type="button">一对一等价互换</button>'
            + '<button type="button">可补差价换入</button>'
            + '<button type="button">支持 A→B→C 三方接力</button>'
            + '<button type="button">近期已达成心愿</button>'
            + '</div></div>'
            + '</section>'

            + '<div class="ali-sort-toolbar">'
            + '<div class="ali-sort-checks">'
            + '<label><input type="checkbox" checked readonly> 全部求换心愿</label>'
            + '<label><input type="checkbox" checked readonly> 已关联在架可换物</label>'
            + '<label><input type="checkbox" checked readonly> 支持书院当面验货</label>'
            + '</div>'
            + '<div class="ali-sort-links">'
            + '<span class="on">最新发布</span>'
            + '<span>急求热度 ▾</span>'
            + '<span>心理估值 ▾</span>'
            + '<span>同款响应数 ▾</span>'
            + '<img src="/assets/brand/mascot-empty.png" alt="" class="ali-toolbar-mascot">'
            + '</div>'
            + '</div>'

            + '<div class="ali-auction-grid wish-grid">'
            + displayList.map(wishAuctionCard).join('')
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
        if (communityLoading || currentView.name!=='community') return;
        communityLoading=true;
        try { var messages=await api('/community'); var box=$('#chat-messages'); if(!box || currentView.name!=='community') return;
            var signature=messages.map(function(m){return [m.id,m.itemAvailable,m.itemTitle].join(':');}).join('|');
            if(box.dataset.signature!==signature) {var near=box.scrollHeight-box.scrollTop-box.clientHeight<100;box.innerHTML=messages.length?messages.map(communityMessage).join(''):'<div class="chat-empty">还没有消息，来打个招呼吧。</div>';box.dataset.signature=signature;if(near||force)box.scrollTop=box.scrollHeight;}
        } catch(e){ if(force) toast(e.message || '消息加载失败','err'); } finally { communityLoading=false; }
    }
    async function renderCommunity() {
        $('#app').innerHTML=shell('community',
            '<div class="qq-channel-shell">'
            + '<aside class="qq-chan-left" aria-label="社区频道列表">'
            + '<div class="qq-guild-head">'
            + '<img src="/assets/brand/mascot-wave-320.webp" alt="">'
            + '<div><b>换一圈校园频道</b><span>● 1,286 位同学在线</span></div>'
            + '</div>'
            + '<div class="qq-chan-group">'
            + '<a href="#/community" class="qq-chan-item on"><i>🔥</i><span>发现热门动态</span><em class="qq-badge-hot">热</em></a>'
            + '<a href="#/wishes" class="qq-chan-item"><i>📢</i><span>全校求换心愿榜</span></a>'
            + '<a href="#/appraise" class="qq-chan-item"><i>🤖</i><span>AI 估价讨论室</span></a>'
            + '</div>'
            + '<div class="qq-chan-group"><div class="qq-group-title">▾ 闲置与换物子频道</div>'
            + '<a href="#/community" class="qq-chan-item sub on"><i>#</i><span>综合闲置吹水池</span><small>LIVE</small></a>'
            + '<a href="#/idle?cat=数码" class="qq-chan-item sub"><i>#</i><span>数码外设发烧友</span><small>99+</small></a>'
            + '<a href="#/idle?cat=教材" class="qq-chan-item sub"><i>#</i><span>考研教材漂流站</span><small>64</small></a>'
            + '<a href="#/idle?cat=生活" class="qq-chan-item sub"><i>#</i><span>宿舍好物安利墙</span><small>42</small></a>'
            + '<a href="#/auctions" class="qq-chan-item sub"><i>#</i><span>校园1元起拍情报</span><small>热</small></a>'
            + '</div>'
            + '<div class="qq-chan-group"><div class="qq-group-title">▾ 书院与同城玩乐</div>'
            + '<a href="#/relay" class="qq-chan-item sub"><i>🔄</i><span>三方换物接力大厅</span></a>'
            + '<a href="#/community/game" class="qq-chan-item sub"><i>🎮</i><span>Scrap Arena 约战房</span></a>'
            + '<a href="#/idle?cat=运动" class="qq-chan-item sub"><i>🏀</i><span>风雨球场约球换拍</span></a>'
            + '</div>'
            + '<div class="qq-left-promo">'
            + '<img src="/assets/brand/mascot-box.png" alt="">'
            + '<div><b>换一圈 · 移通频道</b><p>校内实名认证 · 当面0邮费秒换</p></div>'
            + '</div>'
            + '</aside>'

            + '<main class="qq-chan-center">'
            + '<div class="qq-hero-banner">'
            + '<div class="qq-hero-copy">'
            + '<div class="qq-hero-title-row">'
            + '<span class="qq-official-tag">官方认证频道</span>'
            + '<h1>重庆移通学院 · 校园生活与闲置总频道</h1>'
            + '</div>'
            + '<p>分享闲置好物、失物招领、期末教材互助、下课同屏开黑，3,840 位移通同学在这里实时互动。</p>'
            + '<div class="qq-hero-stats"><span>今日发帖 <b>286</b></span><span>在架好物 <b>1,420</b></span><span>换物成功率 <b>98.4%</b></span></div>'
            + '</div>'
            + '<img class="qq-hero-mascot" src="/assets/brand/mascot-wave-320.webp" alt="">'
            + '</div>'

            + '<form class="qq-compose-box chat-compose" data-form="community-text">'
            + '<div class="qq-compose-top">'
            + '<img class="qq-compose-avatar" src="/assets/brand/mascot-wave-320.webp" alt="">'
            + '<textarea name="content" maxlength="500" rows="2" placeholder="在 #综合闲置吹水池 分享今天的新鲜事、求购或晒出你的好物…" aria-label="消息内容" required></textarea>'
            + '</div>'
            + '<div class="chat-tools qq-compose-bar">'
            + '<div class="qq-tool-btns">'
            + '<label class="chat-tool">🖼 发送图片<input type="file" accept="image/png,image/jpeg" data-act="community-image" hidden></label>'
            + '<button type="button" class="chat-tool" data-act="community-share">📦 晒出我的在架闲置</button>'
            + '<button type="button" class="chat-tool" data-act="go" data-to="#/wishes">✨ 发起求换心愿</button>'
            + '</div>'
            + '<button type="submit" class="btn btn-primary btn-sm">发布到频道</button>'
            + '</div>'
            + '</form>'

            + '<div class="qq-feed-tabs">'
            + '<span class="on">全部动态</span>'
            + '<span>实时聊天室</span>'
            + '<a href="#/idle">好物晒单</a>'
            + '<a href="#/wishes">求换悬赏</a>'
            + '<a href="#/auctions">拍卖播报</a>'
            + '<span class="qq-live-pill">● 频道实时同步中</span>'
            + '</div>'

            + '<section class="qq-realtime-card">'
            + '<div class="qq-realtime-head"><b>💬 频道实时公共聊天流</b><span>发送文字、图片或分享闲置立即全校可见</span></div>'
            + '<div class="chat-messages" id="chat-messages" aria-live="polite"></div>'
            + '</section>'

            + '<div class="qq-featured-feed">'
            + '<article class="qq-post-card">'
            + '<header class="qq-post-head"><span class="qq-post-avatar">北</span><div><b>北山书院 · 电竞阿泽</b><span>15 分钟前 · 来自 #数码外设发烧友</span></div><a class="qq-post-tag" href="#/idle?cat=数码">#数码外设置换</a></header>'
            + '<h3>大三升级桌面，出九五新罗技 GPW 二代 + 68键机械键盘，或者换个 iPad 电容笔！</h3>'
            + '<p>平时都在寝室接显示器用，成色超级新，无双击无掉漆，包装盒和接收器延长线都在。支持北山书院一楼大厅当面插电脑试手感，想换的同学直接点我头像或者去闲置大厅报价~</p>'
            + '<div class="qq-post-imgs"><img src="/assets/amz/quad-digital.jpg" alt=""><img src="/assets/amz/quad-swap.jpg" alt=""><img src="/assets/amz/quad-appraise.jpg" alt=""></div>'
            + '<footer class="qq-post-foot"><span>🔥 128 热度</span><span>👍 36 赞</span><a href="#/idle?cat=数码">💬 去集市看同款 ›</a></footer>'
            + '</article>'
            + '<article class="qq-post-card">'
            + '<header class="qq-post-head"><span class="qq-post-avatar">南</span><div><b>南山书院 · 上岸学姐小林</b><span>42 分钟前 · 来自 #考研教材漂流站</span></div><a class="qq-post-tag" href="#/idle?cat=教材">#考研资料漂流</a></header>'
            + '<h3>整理了全套同济高数+张宇1000题+六级真题手写笔记，半卖半送或者换两杯瑞幸生椰拿铁☕</h3>'
            + '<p>重点章节全部用荧光笔标好考点了，祝学弟学妹们期末和考研高分过关！南山书院或图书馆门口均可自提。</p>'
            + '<div class="qq-post-imgs"><img src="/assets/amz/quad-books.jpg" alt=""><img src="/assets/amz/quad-grad.jpg" alt=""></div>'
            + '<footer class="qq-post-foot"><span>🔥 94 热度</span><span>👍 52 赞</span><a href="#/idle?cat=教材">💬 立即联系换书 ›</a></footer>'
            + '</article>'
            + '</div>'
            + '</main>'

            + '<aside class="qq-chan-right" aria-label="频道侧栏">'
            + '<div class="qq-side-card">'
            + '<h4>📌 频道官方公告</h4>'
            + '<p>1. 校内当面交易建议选择各书院大厅、图书馆一楼等公共点位；<br>2. 拿不准价格可先用「AI 好物估价」测算合理换物区间；<br>3. 严禁发布违规代考或校外引流广告。</p>'
            + '</div>'
            + '<div class="qq-side-card qq-arcade-box">'
            + '<span class="tag">ARCADE · 频道小游戏</span>'
            + '<h3>下课无聊？<br>来一局 Scrap Arena！</h3>'
            + '<p>双人同屏格斗街机 · 键盘即开即玩</p>'
            + '<img src="/assets/brand/mascot-wave-320.webp" alt="">'
            + '<button class="btn btn-primary" data-act="go" data-to="#/community/game">开始双人对战 ' + navIcon('external') + '</button>'
            + '</div>'
            + '<div class="qq-side-card">'
            + '<h4>🏆 本周换物活跃书院榜</h4>'
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
        var communityDraft=sessionStorage.getItem('hq.communityDraft');
        if(communityDraft){
            sessionStorage.removeItem('hq.communityDraft');
            var compose=$('[data-form="community-text"] textarea');
            if(compose){
                compose.insertAdjacentHTML('beforebegin','<p class="community-draft-note">失物招领草稿。补充物品、地点和时间后，可发到校园公共聊天室。</p>');
                compose.value=communityDraft;
                compose.focus();
            }
        }
        await refreshCommunity(true); if(currentView.name==='community') communityTimer=setInterval(function(){refreshCommunity(false);},5000);
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
            {name: '罗技 GPW 二代无线游戏鼠标', cat: '数码', orig: 599, est: '260 ~ 320', cond: 'light', hot: '极高 · 平均2小时换出', img: '/assets/amz/quad-digital.jpg'},
            {name: '2026同济高数+张宇1000题全套', cat: '教材', orig: 128, est: '35 ~ 55', cond: 'light', hot: '极高 · 考研刚需', img: '/assets/amz/quad-books.jpg'},
            {name: '富士 Instax mini11 拍立得相机', cat: '数码', orig: 520, est: '280 ~ 350', cond: 'new', hot: '高 · 社团热宠', img: '/assets/amz/quad-auction.jpg'},
            {name: '米家智能LED长臂护眼台灯 1S', cat: '生活', orig: 149, est: '55 ~ 80', cond: 'light', hot: '高 · 宿舍神器', img: '/assets/amz/quad-dorm.jpg'},
            {name: '尤尼克斯 24磅碳素羽毛球拍', cat: '运动', orig: 260, est: '110 ~ 145', cond: 'light', hot: '中 · 球场约球', img: '/assets/amz/quad-sports.jpg'},
            {name: '卡西欧 fx-991CN X 函数计算器', cat: '教材', orig: 135, est: '50 ~ 75', cond: 'new', hot: '高 · 期末必备', img: '/assets/amz/quad-grad.jpg'}
        ].map(function (b) {
            return '<div class="ai-bench-row">'
                + '<img src="' + b.img + '" alt="">'
                + '<div class="ai-bench-info"><b>' + esc(b.name) + '</b><span>原价 ¥' + b.orig + ' · ' + b.hot + '</span></div>'
                + '<div class="ai-bench-price"><b>¥' + b.est + '</b><button type="button" onclick="document.getElementById(\'estimate-title\').value=\'' + esc(b.name) + '\';document.getElementById(\'estimate-price\').value=\'' + b.orig + '\';document.querySelector(\'[data-form=estimate]\').requestSubmit();">填入测算</button></div>'
                + '</div>';
        }).join('');

        var content = '<div class="ali-auction-page ai-appraise-page">'
            + '<header class="ali-sub-header">'
            + '<div class="ali-sub-brand">'
            + '<span class="ali-brand-main">换一圈 AI 实验室 · 智能好物估价中心</span>'
            + '<span class="ali-brand-sub">CAMPUS AI VALUATION LAB · 基于重庆移通学院 12,800+ 笔历史成交与换物大数据</span>'
            + '</div>'
            + '<nav class="ali-sub-nav" aria-label="AI估价导航">'
            + '<a href="#/appraise" class="on">AI 智能估价工作台</a>'
            + '<a href="#/idle">去集市比价</a>'
            + '<a href="#/auctions">1元起拍测试行情</a>'
            + '<a href="#/relay">等价三方换物</a>'
            + '</nav>'
            + '<div class="ali-sub-actions">'
            + '<a class="btn btn-ghost btn-sm" href="#/idle">浏览同款在架</a>'
            + '<a class="btn btn-primary btn-sm" href="#/publish">+ 带估值去发布</a>'
            + '</div>'
            + '</header>'

            + '<div class="ai-workbench-grid">'
            + '<section class="ai-main-card">'
            + '<div class="ai-card-head">'
            + '<div><h2>🤖 AI 视觉与多维成色估价器</h2><p>上传物品实拍图或输入入手原价，AI 吉祥物小助手为您秒算公允换物与转让区间</p></div>'
            + '<span class="ai-badge-live">● AI 模型 v3.2 在线</span>'
            + '</div>'

            + '<form class="estimate-form ai-form-body" data-form="estimate">'
            + '<label class="ai-upload-zone" for="ai-photo-input">'
            + '<input id="ai-photo-input" type="file" accept="image/*" hidden onchange="var f=this.files&&this.files[0];if(f){var u=URL.createObjectURL(f);var p=document.getElementById(\'ai-photo-preview\');p.innerHTML=\'<img src=&quot;\'+u+\'&quot; alt=&quot;预览&quot;><span>✓ 已载入实拍图，AI 将结合成色特征综合估值</span>\';}">'
            + '<span class="ai-corner tl"></span><span class="ai-corner tr"></span><span class="ai-corner bl"></span><span class="ai-corner br"></span>'
            + '<div id="ai-photo-preview" class="ai-upload-inner">'
            + '<span class="ai-cam-ico">' + navIcon('camera') + '</span>'
            + '<b>拍照或上传物品实拍图（选填）</b>'
            + '<small>支持 JPG / PNG · 自动识别边角磨损与配件完整度</small>'
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
            + '<button class="btn btn-primary ai-submit-btn" type="submit">✨ 立即开始 AI 智能估价</button>'
            + '</div>'

            + '<div id="ai-mascot-Evaluating" class="ai-evaluating-box" hidden>'
            + '<img src="/assets/brand/mascot-search.png" alt="正在估价中的吉祥物" class="ai-eval-mascot">'
            + '<div><b>换一圈 AI 吉祥物正在为您扫描校内成交库…</b><span>正在比对北山/南山书院近 90 天同品类换物溢价率</span></div>'
            + '</div>'

            + '<div id="estimate-result" class="ai-result-panel" role="status">'
            + '<div class="ai-result-placeholder">'
            + '<img src="/assets/brand/mascot-wave-320.webp" alt="">'
            + '<div><b>等待输入物品参数…</b><p>输入入手原价并点击上方按钮（或点击右侧热门样本「填入测算」），即可生成专属校内估值报告。</p></div>'
            + '</div>'
            + '</div>'
            + '</form>'
            + '</section>'

            + '<aside class="ai-side-col">'
            + '<div class="ai-mascot-hero-card">'
            + '<div class="ai-mascot-art-wrap"><img src="/assets/amz/mascot-credit-card.png" alt="AI估价吉祥物顾问"></div>'
            + '<div class="ai-mascot-copy">'
            + '<span class="ai-advisor-tag">★ 换一圈官方吉祥物估价师</span>'
            + '<h3>“拿不准定什么价？让小圈帮你算！”</h3>'
            + '<p>综合考量期末/毕业季供需波动、书院面交零邮费优势，给出最容易成交的黄金价格带。</p>'
            + '<div class="ai-mascot-perks">'
            + '<span>✓ 12,800+ 校内样本</span>'
            + '<span>✓ 支持等价换物匹配</span>'
            + '<span>✓ 估完一键带价发布</span>'
            + '</div>'
            + '</div>'
            + '</div>'

            + '<div class="ai-bench-card">'
            + '<div class="ai-bench-head"><h3>📊 本周移通校园热换行情参考榜</h3><span>点击一键测算</span></div>'
            + '<div class="ai-bench-list">' + sampleBenchmarks + '</div>'
            + '</div>'
            + '</aside>'
            + '</div>'
            + '</div>';

        $('#app').innerHTML = shell('market', content);
    }

    // ------------------------------------------------------------------ 路由

    var routes = [
        [/^#\/appraise$/, function () { return 'appraise'; }],
        [/^#\/followers$/, function () { return 'followers'; }],
        [/^#\/home$/, function () { return 'home'; }],
        [/^#\/(?:market|idle|search)$/, function () { return 'home'; }],
        [/^#\/auctions$/, function () { return 'auctions'; }],
        [/^#\/community$/, function () { return 'community'; }],
        [/^#\/notifications$/, function () { return 'notifications'; }],
        [/^#\/chats$/, function () { return 'chats'; }],
        [/^#\/chat\/(\d+)$/, function () { return 'chat'; }],
        [/^#\/ring\/(\d+)$/, function () { return 'ringChat'; }],
        [/^#\/wishes(?:\/(\d+))?$/, function () { return 'wishes'; }],
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
        [/^#\/relay$/, function () { return 'relay'; }],
        [/^#\/cycle\/(\d+)$/, function (m) { return 'cycle'; }],
        [/^#\/exchange$/, function () { return 'exchange'; }],
        [/^#\/exchange\/(\d+)$/, function (m) { return 'exchangeDetail'; }],
        [/^#\/user\/(\d+)$/, function () { return 'user'; }],
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
        for (var i = 0; i < routes.length; i++) {
            var m = hash.match(routes[i][0]);
            if (m) return {name: routes[i][1](m), arg: m[1] ? Number(m[1]) : null};
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
        if (!state.me && view.name !== 'home' && view.name !== 'relay' && view.name !== 'settings' && view.name !== 'auctions' && view.name !== 'item' && view.name !== 'user') {
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
        }

        try {
            if (view.name === 'email') { await renderEmail(); } else if (view.name === 'settings') {
                renderSettings();
            } else if (view.name === 'home') {
                if(location.hash==='#/search'&&!state.home.keyword){renderSearchPage('');}
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
                        + '<img src="/assets/brand/mascot-success.png" alt="估价完成吉祥物" class="ai-report-mascot">'
                        + '<div class="ai-report-main">'
                        + '<span class="ai-report-kicker">✓ AI 估价完成 · ' + esc(itemCat) + '品类校内行情报告</span>'
                        + '<h3>「' + esc(itemTitle) + '」参考区间 <b>¥' + low + '–' + high + '</b></h3>'
                        + '<p>秒出建议价：<b>¥' + fastPrice + '</b>（较入手价 ¥' + price + ' 保值率约 ' + Math.round(range[1] * 100) + '%，支持等价换物或校内面交）</p>'
                        + '</div>'
                        + '<div class="ai-report-actions">'
                        + '<a class="btn btn-primary btn-sm" href="#/publish">带此估值去发布 ›</a>'
                        + '<a class="btn btn-ghost btn-sm" href="#/auction/new">1元起拍测热度</a>'
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

    document.addEventListener('change', async function (ev) {
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
    document.addEventListener('input', function (ev) { if (ev.target.id === 'theme-color') applyTheme(ev.target.value, true); });

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
