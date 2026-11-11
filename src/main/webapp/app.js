/* =========================================================================
   换一圈 | 前端应用
   原生 JS，hash 路由，无构建步骤。接口全部走同源 /api。
   ========================================================================= */
(function () {
    'use strict';

    // ------------------------------------------------------------------ 常量

    var CATS = ['教材', '数码', '运动', '生活', '衣物', '绿植', '其他'];
    var CONDS = ['全新', '九成新', '七成新', '有使用痕迹'];
    // IconPark SVG subset (Apache-2.0). See assets/licenses/iconpark.txt.
    var ICONS = {
    "market": "<path d=\"M9 18V42H39V18L24 6L9 18Z\" fill=\"var(--icon-fill, var(--theme-soft))\" stroke=\"currentColor\" stroke-width=\"3.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n<path d=\"M19 29V42H29V29H19Z\" fill=\"var(--icon-detail, var(--theme-soft))\" stroke=\"currentColor\" stroke-width=\"3.5\" stroke-linejoin=\"round\"/>\n<path d=\"M9 42H39\" stroke=\"currentColor\" stroke-width=\"3.5\" stroke-linecap=\"round\"/>",
    "community": "<path d=\"M33 38H22V30H36V22H44V38H39L36 41L33 38Z\" stroke=\"currentColor\" stroke-width=\"3.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n<path d=\"M4 6H36V30H17L13 34L9 30H4V6Z\" fill=\"var(--icon-fill, var(--theme-soft))\" stroke=\"currentColor\" stroke-width=\"3.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n<path d=\"M12 22H18\" stroke=\"currentColor\" stroke-width=\"3.5\" stroke-linecap=\"round\"/>\n<path d=\"M12 14H24\" stroke=\"currentColor\" stroke-width=\"3.5\" stroke-linecap=\"round\"/>",
    "trade": "<path d=\"M24 16H29V4L44 19L29 34V24H18V13L4 28L18 44V32H23\" stroke=\"currentColor\" stroke-width=\"3.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>",
    "me": "<circle cx=\"24\" cy=\"12\" r=\"8\" fill=\"var(--icon-fill, var(--theme-soft))\" stroke=\"currentColor\" stroke-width=\"3.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n<path d=\"M42 44C42 34.0589 33.9411 26 24 26C14.0589 26 6 34.0589 6 44\" stroke=\"currentColor\" stroke-width=\"3.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>",
    "notice": "<path d=\"M24 4C16.268 4 10 10.268 10 18V38H38V18C38 10.268 31.732 4 24 4Z\" fill=\"var(--icon-fill, var(--theme-soft))\"/>\n<path d=\"M10 38V18C10 10.268 16.268 4 24 4C31.732 4 38 10.268 38 18V38M4 38H44\" stroke=\"currentColor\" stroke-width=\"3.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n<path d=\"M24 44C26.7614 44 29 41.7614 29 39V38H19V39C19 41.7614 21.2386 44 24 44Z\" fill=\"var(--icon-fill, var(--theme-soft))\" stroke=\"currentColor\" stroke-width=\"3.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>",
    "search": "<path d=\"M21 38C30.3888 38 38 30.3888 38 21C38 11.6112 30.3888 4 21 4C11.6112 4 4 11.6112 4 21C4 30.3888 11.6112 38 21 38Z\" fill=\"var(--icon-fill, var(--theme-soft))\" stroke=\"currentColor\" stroke-width=\"3.5\" stroke-linejoin=\"round\"/>\n<path d=\"M26.657 14.3431C25.2093 12.8954 23.2093 12 21.0001 12C18.791 12 16.791 12.8954 15.3433 14.3431\" stroke=\"currentColor\" stroke-width=\"3.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n<path d=\"M33.2216 33.2217L41.7069 41.707\" stroke=\"currentColor\" stroke-width=\"3.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>",
    "heart": "<path d=\"M15 8C8.92487 8 4 12.9249 4 19C4 30 17 40 24 42.3262C31 40 44 30 44 19C44 12.9249 39.0751 8 33 8C29.2797 8 25.9907 9.8469 24 12.6738C22.0093 9.8469 18.7203 8 15 8Z\" fill=\"var(--icon-fill, var(--theme-soft))\" stroke=\"currentColor\" stroke-width=\"3.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>",
    "settings": "<path d=\"M34.0003 41L44 24L34.0003 7H14.0002L4 24L14.0002 41H34.0003Z\" fill=\"var(--icon-fill, var(--theme-soft))\" stroke=\"currentColor\" stroke-width=\"3.5\" stroke-linejoin=\"round\"/>\n<path d=\"M24 29C26.7614 29 29 26.7614 29 24C29 21.2386 26.7614 19 24 19C21.2386 19 19 21.2386 19 24C19 26.7614 21.2386 29 24 29Z\" fill=\"var(--icon-detail, var(--theme-soft))\" stroke=\"currentColor\" stroke-width=\"3.5\" stroke-linejoin=\"round\"/>",
    "book": "<path d=\"M5 7H16C20.4183 7 24 10.5817 24 15V42C24 38.6863 21.3137 36 18 36H5V7Z\" fill=\"var(--icon-fill, var(--theme-soft))\" stroke=\"currentColor\" stroke-width=\"3.5\" stroke-linejoin=\"round\"/>\n<path d=\"M43 7H32C27.5817 7 24 10.5817 24 15V42C24 38.6863 26.6863 36 30 36H43V7Z\" fill=\"var(--icon-fill, var(--theme-soft))\" stroke=\"currentColor\" stroke-width=\"3.5\" stroke-linejoin=\"round\"/>",
    "device": "<rect x=\"8\" y=\"8\" width=\"32\" height=\"20\" fill=\"var(--icon-fill, var(--theme-soft))\" stroke=\"currentColor\" stroke-width=\"3.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n<path d=\"M8 28L4 41H44L40 28\" stroke=\"currentColor\" stroke-width=\"3.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n<path d=\"M19.9 35H28.1L30 41H18L19.9 35Z\" fill=\"var(--icon-fill, var(--theme-soft))\" stroke=\"currentColor\" stroke-width=\"3.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>",
    "sports": "<path d=\"M24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44Z\" stroke=\"currentColor\" stroke-width=\"3.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n<path d=\"M8.5459 11.2727C12.7883 14.9091 14.9095 19.1515 14.9095 24C14.9095 28.8485 12.7883 33.0909 8.5459 36.7272\" stroke=\"currentColor\" stroke-width=\"3.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n<path d=\"M39.4545 36.7272C35.212 33.0909 33.0908 28.8485 33.0908 24C33.0908 19.1515 35.212 14.9091 39.4545 11.2727\" stroke=\"currentColor\" stroke-width=\"3.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n<path d=\"M4 24H44\" stroke=\"currentColor\" stroke-width=\"3.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n<path d=\"M24 4V44\" stroke=\"currentColor\" stroke-width=\"3.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>",
    "life": "<path d=\"M5 17H43L38.8 43H9.2L5 17Z\" fill=\"var(--icon-fill, var(--theme-soft))\" stroke=\"currentColor\" stroke-width=\"3.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n<path d=\"M35 17C35 10.3726 30.0751 5 24 5C17.9249 5 13 10.3726 13 17\" stroke=\"currentColor\" stroke-width=\"3.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n<circle cx=\"17\" cy=\"26\" r=\"2\" fill=\"currentColor\"/>\n<path d=\"M18 33C18 33 20 36 24 36C28 36 30 33 30 33\" stroke=\"currentColor\" stroke-width=\"3.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n<circle cx=\"31\" cy=\"26\" r=\"2\" fill=\"currentColor\"/>",
    "clothes": "<path d=\"M9 9L18 4H30L39 9L43 24L35 30V44H13V30L5 24L9 9Z\" fill=\"var(--icon-fill, var(--theme-soft))\" stroke=\"currentColor\" stroke-width=\"3.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n<path d=\"M13 31L13 24\" stroke=\"currentColor\" stroke-width=\"3.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n<path d=\"M35 31L35 24\" stroke=\"currentColor\" stroke-width=\"3.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>",
    "plant": "<path d=\"M37 24C37 38.0938 24 44 24 44C24 44 11 39.375 11 24C11 8.625 24 4 24 4C24 4 37 9.90625 37 24Z\" stroke=\"currentColor\" stroke-width=\"3.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n<path d=\"M24 36L29 31\" stroke=\"currentColor\" stroke-width=\"3.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n<path d=\"M24 29L19 24\" stroke=\"currentColor\" stroke-width=\"3.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n<path d=\"M24 23L29 18\" stroke=\"currentColor\" stroke-width=\"3.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n<path d=\"M24 44V14\" stroke=\"currentColor\" stroke-width=\"3.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>",
    "box": "<rect x=\"6\" y=\"12\" width=\"36\" height=\"30\" rx=\"2\" fill=\"var(--icon-fill, var(--theme-soft))\" stroke=\"currentColor\" stroke-width=\"3.5\" stroke-linejoin=\"round\"/>\n<path d=\"M17.9497 24.0083L29.9497 24.0083\" stroke=\"currentColor\" stroke-width=\"3.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n<path d=\"M6 13L13 5H35L42 13\" stroke=\"currentColor\" stroke-width=\"3.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>",
    "add": "<rect x=\"6\" y=\"6\" width=\"36\" height=\"36\" rx=\"3\" fill=\"var(--icon-fill, var(--theme-soft))\" stroke=\"currentColor\" stroke-width=\"3.5\" stroke-linejoin=\"round\"/>\n<path d=\"M24 16V32\" stroke=\"currentColor\" stroke-width=\"3.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n<path d=\"M16 24L32 24\" stroke=\"currentColor\" stroke-width=\"3.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>",
    "auction": "<path d=\"M11.0745 37.0792C7.68854 38.5409 6.03602 40.5241 5.36485 41.9094C5.09915 42.4578 5.54601 43 6.15537 43H27.3865C28.1288 43 28.5986 42.2236 28.1659 41.6205C26.4167 39.182 23.7818 37.6426 22.3887 37.0682C22.2756 37.0216 22.1547 37 22.0323 37H11.4615C11.3291 37 11.1962 37.0267 11.0745 37.0792Z\" fill=\"var(--icon-fill, var(--theme-soft))\" stroke=\"currentColor\" stroke-width=\"3.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n<rect x=\"14.7319\" y=\"18.8564\" width=\"10\" height=\"10\" transform=\"rotate(-60 14.7319 18.8564)\" fill=\"var(--icon-fill, var(--theme-soft))\" stroke=\"currentColor\" stroke-width=\"3.5\" stroke-linejoin=\"round\"/>\n<path d=\"M27.3921 16.9277L28.3921 15.1957C27.4355 14.6434 26.2123 14.9711 25.66 15.9277L27.3921 16.9277ZM24.3921 22.1239L22.66 21.1239C22.1078 22.0805 22.4355 23.3037 23.3921 23.8559L24.3921 22.1239ZM26.3921 18.6598L39.3825 26.1598L41.3825 22.6957L28.3921 15.1957L26.3921 18.6598ZM38.3825 27.8918L25.3921 20.3918L23.3921 23.8559L36.3825 31.3559L38.3825 27.8918ZM26.1241 23.1239L29.1241 17.9277L25.66 15.9277L22.66 21.1239L26.1241 23.1239ZM39.7485 27.5258C39.4724 28.0041 38.8608 28.168 38.3825 27.8918L36.3825 31.3559C38.7739 32.7366 41.8319 31.9173 43.2126 29.5258L39.7485 27.5258ZM39.3825 26.1598C39.8608 26.4359 40.0246 27.0475 39.7485 27.5258L43.2126 29.5258C44.5933 27.1343 43.7739 24.0764 41.3825 22.6957L39.3825 26.1598Z\" fill=\"currentColor\"/>\n<rect x=\"21\" y=\"4\" width=\"14\" height=\"6\" rx=\"3\" transform=\"rotate(30 21 4)\" fill=\"var(--icon-fill, var(--theme-soft))\" stroke=\"currentColor\" stroke-width=\"3.5\" stroke-linejoin=\"round\"/>\n<rect x=\"13\" y=\"17.8564\" width=\"14\" height=\"6\" rx=\"3\" transform=\"rotate(30 13 17.8564)\" fill=\"var(--icon-fill, var(--theme-soft))\" stroke=\"currentColor\" stroke-width=\"3.5\" stroke-linejoin=\"round\"/>",
    "wish": "<path d=\"M21.4172 18.5828C19.3962 19.5481 18 21.6109 18 23.9999C18 27.3136 20.6863 29.9999 24 29.9999C26.389 29.9999 28.4519 28.6037 29.4172 26.5828\" stroke=\"currentColor\" stroke-width=\"3.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n<path d=\"M28.2793 11.7207C26.9392 11.2538 25.4992 11 24 11C16.8203 11 11 16.8203 11 24C11 31.1797 16.8203 37 24 37C31.1797 37 37 31.1797 37 24C37 22.5008 36.7462 21.0608 36.2793 19.7207\" stroke=\"currentColor\" stroke-width=\"3.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n<path d=\"M33.5675 6.43255C30.7255 4.88151 27.4657 4 24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44C35.0457 44 44 35.0457 44 24C44 20.5343 43.1185 17.2745 41.5675 14.4325\" stroke=\"currentColor\" stroke-width=\"3.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n<path d=\"M44 4L24 24\" stroke=\"currentColor\" stroke-width=\"3.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>",
    "filter": "<path d=\"M6 9L20.4 25.8178V38.4444L27.6 42V25.8178L42 9H6Z\" fill=\"var(--icon-fill, var(--theme-soft))\" stroke=\"currentColor\" stroke-width=\"3.5\" stroke-linejoin=\"round\"/>",
    "next": "<path d=\"M19 12L31 24L19 36\" stroke=\"currentColor\" stroke-width=\"3.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>",
    "close": "<path d=\"M8 8L40 40\" stroke=\"currentColor\" stroke-width=\"3.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n<path d=\"M8 40L40 8\" stroke=\"currentColor\" stroke-width=\"3.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>"
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
        adminTab: 'items'
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
        $('#app').innerHTML = shell('settings','<div class="settings-page redesigned-settings"><header class="redesign-heading"><h1>设置</h1></header>'+account+trade+local+'<section class="settings-card"><h2>主题颜色</h2><p>选择预设颜色，或自定义任意颜色。</p><div class="theme-options">'+options+'</div><div class="theme-custom"><div><b>自定义颜色</b><small>点击色块选择，立即生效</small></div><output id="theme-value">'+themeColor().toUpperCase()+'</output><input id="theme-color" type="color" value="'+themeColor()+'" aria-label="选择自定义主题颜色"></div><button class="theme-reset" type="button" data-act="theme-reset">恢复默认</button><p class="theme-hint">设置保存在当前浏览器，不需要登录。</p></section>'+exit+'</div>');
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
    function renderShelf() {
        var key=location.hash==='#/history'?'history':'favorites';
        var items=shelfRead(key);
        var rows=items.map(function(it){return '<article class="card shelf-row"><a href="#/item/'+Number(it.id)+'">'+thumb(it)+'<span><b>'+esc(it.title)+'</b><small>'+esc(it.category)+'</small></span></a><button type="button" class="btn btn-ghost btn-sm" data-act="shelf-remove" data-key="'+key+'" data-id="'+Number(it.id)+'">移除</button></article>';}).join('');
        $('#app').innerHTML=shell('settings','<div class="settings-page"><div class="settings-heading"><h1>收藏与历史</h1><p>在当前浏览器找回收藏和最近浏览的物品。</p></div><nav class="trade-sections" aria-label="收藏与历史"><a class="'+(key==='favorites'?'on':'')+'" href="#/favorites">收藏夹</a><a class="'+(key==='history'?'on':'')+'" href="#/history">浏览历史</a></nav>'+(rows||'<div class="card card-pad">'+(key==='favorites'?'还没有收藏的物品。':'还没有浏览记录。')+'</div>')+(key==='history'&&items.length?'<button class="theme-reset" data-act="shelf-clear">清空浏览历史</button>':'')+'</div>');
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
            ? '<img src="' + esc(img) + '" alt="' + esc(it.title) + '">'
            : (CAT_ICON[it.category] || '<svg class="line-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true"><path d="M4 7l8-4 8 4v10l-8 4-8-4z M4 7l8 4 8-4 M12 11v10"/></svg>');
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

    async function api(path, opt) {
        opt = opt || {};
        var init = {method: opt.method || 'GET', credentials: 'include', headers: {}};
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
        return data ? data.data : null;
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
        return '<svg class="nav-icon line-icon" viewBox="0 0 48 48" fill="none" aria-hidden="true" focusable="false">'+ICONS[name]+'</svg>';
    }
    function tabbar(active) {
        if(active==='home')active='market';if(active==='offers'||active==='exchange')active='trade';
        function t(key,icon,label){return '<button class="tab '+(active===key?'on':'')+'" data-act="go" data-to="#/'+key+'"><span class="ico">'+navIcon(icon)+(key==='notifications'?'<span class="notice-count" hidden></span>':'')+'</span><span>'+label+'</span></button>';}
        return '<nav class="tabbar" aria-label="主导航">'+t('market','market','首页')+t('community','community','社区')
            +'<button class="tab tab-fab" data-act="go" data-to="#/publish"><span class="fab">'+navIcon('add')+'</span><span>发布</span></button>'
            +t('notifications','notice','消息')+t('me','me','我的')+'</nav>';
    }
    function topnav(active) {
        if(active==='home')active='market';if(active==='offers'||active==='exchange')active='trade';
        var items=[['market','首页'],['community','社区'],['trade','我的交易'],['wishes','求换专区'],['auctions','拍卖']];
        var html=items.map(function(i){return '<a href="#/'+i[0]+'" class="'+(active===i[0]?'on':'')+'">'+i[1]+'</a>';}).join('');
        if(state.me&&state.me.role===1)html+='<a href="#/admin">管理后台</a>';
        return '<nav class="topnav" aria-label="网站导航">'+html+'</nav>';
    }
    function logoMarkup() {
        return '<img class="brand-logo" src="/assets/brand/brand-mascot-logo.png" alt="" width="48" height="48">';
    }
    function shell(active,content) {
        setTimeout(refreshNoticeCount,0);
        var me=state.me;var account=me?'<button class="avatar" data-act="go" data-to="#/me" title="'+esc(me.nickname)+'">'+esc(me.nickname.slice(0,1))+'</button>':(readToken()?'<a class="header-account" href="#/me">个人中心</a>':'<a class="header-account" href="#/login">登录 / 注册</a>');
        var search='<form class="header-search" data-form="search"><a class="desktop-search-icon" href="#/search" aria-label="打开搜索页">'+navIcon('search')+'</a><input name="keyword" aria-label="搜索闲置" placeholder="搜索校园里的好物" value="'+esc(state.home.keyword)+'"><button type="submit">搜索</button></form>';
        return '<a class="skip-link" href="#main-content" data-act="skip-main">跳到主要内容</a><div class="site-utility"><div><span>重庆移通学院 | 校园换物社区</span><span><a href="#/notifications">消息通知</a><a href="#/me">个人中心</a></span></div></div>'
            +'<header class="appbar"><div class="appbar-inner"><a class="brand" href="#/market">'+logoMarkup()+'<span class="brand-name">换一圈<small>校园闲置 让好物流转</small></span></a>'
            +search+'<div class="header-actions"><a class="settings-link shelf-link" href="#/favorites" aria-label="收藏与历史" title="收藏与历史">'+navIcon('heart')+'</a><a class="settings-link" href="#/settings" aria-label="设置" title="设置">'+navIcon('settings')+'</a><a class="notice-link" href="#/notifications" aria-label="消息通知">'+navIcon('notice')+'<span class="notice-text">消息</span><span class="notice-count" hidden></span></a>'+account+'</div></div><div class="header-nav-wrap">'+topnav(active)+'<a class="header-publish" href="#/publish">＋ 发布闲置</a></div></header>'
            +'<main id="main-content" tabindex="-1" class="shell '+(active==='market'||active==='home'?'shell-market':'')+'">'+content+'</main>'+tabbar(active);
    }
    function tradeTabs(active){return '<div class="trade-top"><div><h1>我的交易</h1><p>报价和交换进度，都在这里。</p></div></div><nav class="trade-sections" aria-label="交易分类"><a class="'+(active==='offers'?'on':'')+'" href="#/offers">报价</a><a class="'+(active==='exchange'?'on':'')+'" href="#/exchange">交换单</a></nav>';}

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
    function pCard(it) {
        var locked=it.status&&it.status!==1, img=firstImage(it.images);
        var face=img?'<img src="'+esc(img)+'" alt="'+esc(it.title)+'" width="300" height="225" loading="lazy">':(CAT_ICON[it.category]||CAT_ICON['其他']);
        return '<button class="pcard '+(locked?'locked':'')+'" data-act="go" data-to="#/item/'+it.id+'"><div class="pimg" data-cat="'+esc(it.category)+'">'+face
            +'<span class="pbadge">'+esc(it.isDemo?'示例展示':(locked?(it.statusText||'已换出'):it.conditionLevel))+'</span></div>'
            +'<div class="pbody"><p class="ptitle">'+esc(it.title)+'</p><div class="pcard-bottom"><span class="swap-label">'+(it.isDemo?'仅供参考':'以物换物')+'</span><span class="pcard-category">'+esc(it.category)+'</span></div>'
            +'<div class="pcard-owner"><span class="pcard-owner-avatar">'+esc((it.ownerNickname||'同').slice(0,1))+'</span><span>'+esc(it.ownerNickname||'校园同学')+'</span><span class="pcard-credit">信用 '+(it.ownerCredit===undefined?'-':it.ownerCredit)+'</span></div></div></button>';
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

    function stepsHtml(status) {
        var map = [
            ['待确认', status === 1],
            ['待交付', status === 2],
            ['已完成', status === 3]
        ];
        if (status >= 4) {
            return '<div class="steps"><div class="step" style="flex:1">'
                + '<span style="color:var(--danger-600);font-weight:600">'
                + (status === 4 ? '已失效' : '已超时关闭') + '</span></div></div>';
        }
        var now = status === 1 ? 0 : (status === 2 ? 1 : 2);
        var html = '<div class="steps">';
        for (var i = 0; i < map.length; i++) {
            var cls = i < now ? 'done' : (i === now ? 'now' : '');
            html += '<div class="step ' + cls + '">' + map[i][0] + '</div>';
        }
        return html + '</div>';
    }

    // ------------------------------------------------------------------ 登录

    function renderLogin(mode) {
        mode = mode || 'login';
        var isReg = mode === 'register';
        var body = '<div class="auth-wrap"><div class="auth-card">'
            + '<div class="auth-logo" aria-label="换一圈">' + logoMarkup() + '</div>'
            + '<div class="auth-school">重庆移通学院 | 校园换物</div>'
            + '<h1>' + (isReg ? '注册新账号' : '欢迎回来') + '</h1>'
            + '<p class="lead">' + (isReg
                ? '用学号注册，初始信用分 80。发一件闲置，就能开始找换法。'
                : '校园里最缺的那件东西，可能正躺在别人的柜子里。') + '</p>'
            + '<form data-form="' + (isReg ? 'register' : 'login') + '">'
            + '<div class="field"><label class="label">学号 <span class="opt">10 位数字</span></label>'
            + '<input class="input" name="studentNo" autocomplete="username" inputmode="numeric" '
            + 'maxlength="10" placeholder="例如 2021210001" required></div>'
            + (isReg ? '<div class="field"><label class="label">昵称</label>'
                + '<input class="input" name="nickname" placeholder="别人看到的名字" maxlength="20" required></div>' : '')
            + '<div class="field"><label class="label">密码</label>'
            + '<input class="input" type="password" name="password" autocomplete="current-password" placeholder="6-20 位" required></div>'
            + (isReg ? '<div class="field"><label class="label">院系 <span class="opt">选填</span></label>'
                + '<input class="input" name="college" placeholder="例如 计算机学院"></div>'
                + '<div class="field"><label class="label">宿舍楼 <span class="opt">选填，用于就近面交</span></label>'
                + '<input class="input" name="building" placeholder="例如 紫荆 3 号楼"></div>' : '')
            + '<div class="form-error" id="form-error"></div>'
            + '<button class="btn btn-primary btn-block" type="submit" style="margin-top:6px">'
            + (isReg ? '注册' : '登录') + '</button>'
            + '</form>'
            + '<div class="auth-switch">' + (isReg ? '已有账号？' : '还没有账号？')
            + '<button data-act="auth-mode" data-mode="' + (isReg ? 'login' : 'register') + '">'
            + (isReg ? '去登录' : '去注册') + '</button></div>'
            + '<div class="chain" id="chain-status"></div>'
            + '</div></div>';
        $('#app').innerHTML = body;
        checkChain();
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

    function campusServices() {
        var services = [
            ['27','校内上门','campus-search','校内可送'],
            ['28','以物换物','home-feed',''],
            ['29','好物估价','estimate',''],
            ['30','教材专区','f-cat','教材'],
            ['31','毕业季专场','campus-search','毕业季闲置'],
            ['32','失物招领','lost-found','']
        ];
        return '<nav class="campus-services" aria-label="校园服务">'+services.map(function(service) {
            return '<button type="button" data-act="'+service[2]+'" data-v="'+service[3]+'"><img src="/assets/brand/service-'+service[0]+'.png" width="52" height="52" alt=""><span>'+service[1]+'</span></button>';
        }).join('')+'</nav>';
    }

    function openEstimate() {
        openSheet('<h3>好物估价</h3><p class="sub">根据入手价和成色计算参考区间。</p><form data-form="estimate"><label class="label" for="estimate-price">入手价（元）</label><input class="input" id="estimate-price" name="price" type="number" min="1" max="100000" required><label class="label" for="estimate-condition">成色</label><select id="estimate-condition" class="select" name="condition"><option value="new">全新</option><option value="light">轻微使用</option><option value="used">有使用痕迹</option></select><button class="btn btn-primary" type="submit">计算参考区间</button><p class="hint" id="estimate-result" role="status"></p></form>');
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
        $('#app').innerHTML=shell('market','<section class="redesign-page search-page"><header class="redesign-heading"><a class="icon-action" href="#/home" aria-label="返回首页">←</a><h1>搜索闲置</h1>'+(term?'<button class="link-btn" data-act="search-term" data-v="">清除关键词</button>':'')+'</header>'+form+(term?results:landing)+'</section>');
    }

    function renderHome() {
        var h=state.home;
        var categories=[['','全部好物'],['教材','图书教材'],['数码','数码设备'],['运动','运动户外'],['生活','宿舍生活'],['衣物','服饰穿搭'],['绿植','绿植花卉'],['其他','兴趣好物']];
        var desktopCats=categories.map(function(c){return '<button class="desk-category '+(h.category===c[0]?'on':'')+'" data-act="f-cat" data-v="'+esc(c[0])+'"><span class="desk-category-icon">'+(c[0]?(CAT_ICON[c[0]]||CAT_ICON['其他']):navIcon('market'))+'</span><span>'+esc(c[1])+'</span><span class="desk-category-arrow">'+navIcon('next')+'</span></button>';}).join('');
        var mobileCats=categories.map(function(c){return '<button class="mobile-category '+(h.category===c[0]?'on':'')+'" data-act="f-cat" data-v="'+esc(c[0])+'"><b>'+esc(c[1])+'</b></button>';}).join('');
        var mobileSearch='<form class="mobile-search" data-form="search"><a class="mobile-search-icon" href="#/search" aria-label="打开搜索页">'+navIcon('search')+'</a><input name="keyword" aria-label="搜索校园闲置" placeholder="搜搜校园里的闲置好物" value="'+esc(h.keyword)+'"><button type="submit">搜索</button></form>';
        var signed=!!readToken();
        var mascotImage='<img src="/assets/brand/mascot-wave-v2.png" width="1280" height="1280" alt="挥手的换一圈吉祥物猫猫" fetchpriority="high">';
        var desktop='<section class="desktop-market"><div class="desktop-market-layout"><aside class="category-panel"><div class="category-panel-title">逛分类 <small>发现校园好物</small></div>'+desktopCats+'</aside><div class="desktop-center"><div class="market-hero mascot-hero"><div class="mascot-copy"><h1>好东西，再转一圈。</h1><p>闲置不闲着，校园里总有人需要。</p><div class="hero-actions"><button data-act="go" data-to="#/publish">发布我的闲置 <span>↗</span></button><button class="hero-secondary" data-act="go" data-to="#/community">去社区逛逛</button></div></div><figure class="mascot-portrait">'+mascotImage+'<figcaption><span></span>换一圈 | 校园伙伴</figcaption></figure></div>'+campusServices()+'<div class="market-shortcuts"><button data-act="go" data-to="#/wishes"><b>想换什么？</b><span>去愿望池看看 →</span></button><button data-act="go" data-to="#/community"><b>校园社区</b><span>和同学聊聊 →</span></button><button data-act="go" data-to="#/trade"><b>换物进度</b><span>查看我的交易 →</span></button></div></div><aside class="market-account"><div class="account-avatar">'+(state.me?esc(state.me.nickname.slice(0,1)):'换')+'</div><h2>'+(signed?'欢迎回来':'你好，校园同学')+'</h2><p>让喜欢的东西继续发光</p><button class="account-main" data-act="go" data-to="'+(signed?'#/me':'#/login')+'">'+(signed?'进入个人中心':'登录 / 注册')+'</button><div class="account-links"><button data-act="go" data-to="#/trade"><b>交易</b><span>我的报价</span></button><button data-act="go" data-to="#/notifications"><b>消息</b><span>最新提醒</span></button></div><div class="account-tip"><b>安心换物小贴士</b><span>选择校园公共地点面交</span></div></aside></div></section>';
        var mobile='<section class="mobile-market"><nav class="home-channels" aria-label="首页频道"><a aria-current="page" href="#/home">首页</a><a href="#/market" data-act="home-feed">集市</a><a href="#/community">社区</a><a href="#/auctions">拍卖</a></nav>'+mobileSearch+campusServices()+'<section class="mobile-story mascot-mobile" aria-label="换一圈校园伙伴"><div class="mascot-copy"><h1>好东西，<br>再转一圈。</h1><button data-act="go" data-to="#/publish">发布闲置 ↗</button></div><figure class="mascot-portrait">'+mascotImage+'</figure></section><div class="mobile-categories">'+mobileCats+'</div><div class="mobile-tools"><button data-act="go" data-to="#/auctions"><span>'+navIcon('auction')+'</span><b>校园拍卖</b><small>查看竞拍</small></button><button data-act="go" data-to="#/wishes"><span>'+navIcon('wish')+'</span><b>求换专区</b><small>找想要的</small></button><button data-act="go" data-to="#/community"><span>'+navIcon('community')+'</span><b>校园社区</b><small>聊聊近况</small></button><button data-act="go" data-to="#/trade"><span>'+navIcon('trade')+'</span><b>我的交易</b><small>换物进度</small></button></div></section>';
        var results='<section class="market-feed"><div class="feed-heading"><div><h2>'+(h.keyword?'为你找到':'发现好物')+'</h2><p>'+(h.keyword?'“'+esc(h.keyword)+'” 的搜索结果':'校内同学发布的闲置')+'</p></div><div class="feed-actions"><span class="feed-count">'+(h.keyword?'匹配 ':'在架 ')+h.total+'</span><button class="feed-filter" data-act="open-filter">'+navIcon('filter')+' 筛选</button><button class="feed-publish" data-act="go" data-to="#/publish">＋ 发布</button></div></div>'
            +(h.condition?'<div class="active-filter"><button class="chip on" data-act="f-cond" data-v="">成色：'+esc(h.condition)+' ×</button></div>':'')
            +(h.items.length?'<div class="pgrid">'+h.items.map(pCard).join('')+'</div>':emptyState(navIcon('search'),'暂时没有找到好物','换个搜索词或筛选条件试试','<button class="btn btn-primary btn-sm" data-act="go" data-to="#/publish">发布闲置</button>'))
            +(h.hasMore?'<div class="feed-more"><button class="btn btn-ghost" data-act="load-more">加载更多</button></div>':'')+'</section>';
        if(location.hash==='#/search'){renderSearchPage(results);return;}
        $('#app').innerHTML=shell('market',desktop+mobile+results+'<footer class="market-footer"><b>换一圈</b><span>让闲置，遇见新的喜欢。</span><span>校园换物 | 理性交流 | 安心面交</span></footer>');
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
    async function loadHome(reset) {
        var token=++homeLoadToken;
        var h = state.home;
        if (reset) {
            h.page = 1;
            h.items = [];
        }
        var q = (h.keyword ? '/item/search' : '/item/list') + '?page=' + h.page + '&size=20';
        if (h.category) q += '&category=' + encodeURIComponent(h.category);
        if (h.condition) q += '&conditionLevel=' + encodeURIComponent(h.condition);
        if (h.keyword) q += '&q=' + encodeURIComponent(h.keyword);
        var data = await api(q);
        if(token!==homeLoadToken || currentView.name!=='home') return false;
        h.items = h.items.concat(data.list || []);
        h.total = data.total || 0;
        h.hasMore = !!data.hasMore;
        h.emptyTip = data.emptyTip;
        return true;
    }

    // ------------------------------------------------------------------ 物品详情

    async function renderItem(id) {
        $('#app').innerHTML = shell('home', loading());
        var d = await api('/item/' + id);
        if (currentView.name!=='item' || currentView.arg!==id) return;
        var it = d.item;
        shelfRemember('history',it);
        var img = firstImage(it.images);
        var hero = img ? '<div class="hero"><img src="' + esc(img) + '" alt=""></div>'
            : '<div class="hero" data-cat="' + esc(it.category) + '">' + (CAT_ICON[it.category] || '<svg class="line-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true"><path d="M4 7l8-4 8 4v10l-8 4-8-4z M4 7l8 4 8-4 M12 11v10"/></svg>') + '</div>';

        var actions;
        if (it.isDemo) {
            actions = '<div class="card card-pad">这是平台演示样品，仅供浏览，不参与交换。</div>';
        } else if (d.isMine) {
            if (it.status === 4) {
                // 已下架的物品，主人可以在详情页直接重新上架，不用绕回「我的」
                actions = '<button class="btn btn-primary btn-block" data-act="toggle-item" data-id="'
                    + it.id + '" data-status="1">重新提交审核</button>';
            } else if (it.status === 1) {
                actions = (it.allowCycle ? '<button class="btn btn-accent btn-block" data-act="cycle" data-id="' + it.id + '">给我找换法</button>' : '')
                    + (it.status === 1
                        ? '<button class="btn btn-ghost" data-act="toggle-item" data-id="' + it.id + '" data-status="4">下架</button>'
                        : '');
            } else if (it.status===5||it.status===6) { actions = '<button class="btn btn-ghost btn-block" data-act="go" data-to="#/item/'+it.id+'/edit">编辑并重新提交</button>'; } else { actions='<div class="card card-pad">'+esc(it.statusText||'当前不可操作')+'</div>'; }
        } else if (it.status === 1) {
            actions = '<button class="btn btn-primary btn-block" data-act="open-offer" data-id="' + it.id + '">用我的物品换</button>'
                + '<button class="btn btn-ghost btn-block" data-act="chat-start" data-id="'+it.id+'">私聊发布者</button>'
                + '<button class="btn btn-ghost" data-act="open-report" data-type="1" data-id="' + it.id + '">举报</button>';
        } else {
            actions = '<button class="btn btn-ghost btn-block" disabled>这件物品' + esc(it.statusText || '已下架') + '</button>';
        }

        var want = d.want || {};
        var content = hero
            + '<h1 class="detail-title">' + esc(it.title) + '</h1>'
            + '<div class="detail-meta">'
            + '<span class="tag brand">' + esc(it.category) + '</span>'
            + '<span class="tag">' + esc(it.conditionLevel) + '</span>'
            + '<span class="tag ghost">' + esc(it.statusText || '') + '</span>'
            + '<span class="tag ghost">' + (it.viewCount || 0) + ' 次浏览</span>'
            + '</div>'
            + '<div class="card card-pad" style="margin-top:12px">'
            + (it.description ? '<div class="kv"><span class="k">描述</span><span class="v">' + esc(it.description) + '</span></div>' : '')
            + '<div class="kv"><span class="k">想换</span><span class="v">'
            + esc((want.wantCategories || []).join('、') || want.wantCategory || '不限类别') + (want.expectDesc ? '，' + esc(want.expectDesc) : '') + '</span></div>'
            + '<div class="kv"><span class="k">发布</span><span class="v">' + fmtRel(it.createTime)
            + ' | ' + esc(it.ownerBuilding || '未填宿舍楼') + '</span></div>'
            + '</div>'
            + '<div class="card card-pad" style="margin-top:12px">'
            + '<button class="user-row as-link" data-act="go" data-to="#/user/' + it.ownerId + '">'
            + '<div class="avatar">' + esc((it.ownerNickname || '同').slice(0, 1)) + '</div>'
            + '<div class="u-main"><p class="u-name">' + esc(it.ownerNickname || '同学')
            + (it.ownerCredit >= 90
                ? ' <span class="tag success">靠谱</span>'
                : ' <span class="tag">信用良好</span>') + '</p>'
            + '<p class="u-sub">' + esc(it.ownerBuilding || '') + ' | 查看主页 ›</p></div>'
            + creditBadge({credit: it.ownerCredit})
            + '</button></div>'
            + '<p class="hint" style="margin-top:12px">' + esc(d.tip || '') + '</p>'
            + '<div class="action-bar">' + actions + '</div>';

        var saved=shelfRead('favorites').some(function(x){return x.id===id;});
        $('#app').innerHTML = shell('home','<div class="shelf-action"><button class="btn btn-ghost btn-sm" data-act="shelf-toggle" data-id="'+id+'" aria-pressed="'+saved+'">'+(saved?'♥ 已收藏':'♡ 收藏物品')+'</button></div>'+content);
    }

    // ------------------------------------------------------------------ 发布

    function renderPublishEntry() {
        $('#app').innerHTML=shell('publish','<section class="redesign-page publish-entry"><header class="redesign-heading"><h1>发布</h1><a class="icon-action" aria-label="关闭发布" href="#/home">'+navIcon('close')+'</a></header>'
            +'<a class="publish-choice publish-choice-main" href="#/publish/edit"><span><strong>发闲置</strong><small>拍张照片，找同学换点喜欢的</small></span><img src="/assets/brand/mascot-box.png" width="108" height="108" alt=""></a>'
            +'<div class="publish-choice-grid"><a class="publish-choice" href="#/auction/new"><span><strong>发拍卖</strong><small>设置起拍价</small></span></a><a class="publish-choice" href="#/wishes"><span><strong>发心愿</strong><small>发布想换的物品</small></span></a></div>'
            +'<button class="publish-choice" data-act="estimate"><span><strong>好物估价</strong><small>计算参考价格区间</small></span></button></section>');
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

        var content = '<div class="page-head"><a class="link-btn" href="#/publish">返回发布</a><h1>发闲置</h1>'
            + '<p>上传图片并提交审核，5 分钟未处理将自动通过。</p></div>'
            + '<form data-form="publish" class="card card-pad">'
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
            + '<span>说清楚瑕疵，换得更快</span><span class="counter" id="desc-counter">0 / 300</span></div></div>'
            + '<div class="field"><label class="label">想换什么</label><div class="chips" id="want-chips">' + wantChips + '</div>'
            + '<input type="hidden" name="wantCategory">'
            + '<div class="hint">可多选。</div>'
            + '<div class="hint">必选。这是环匹配的原料：写清楚类别，系统才能把三个人的意向接起来。</div></div>'
            + '<div class="field"><label class="label">交换模式</label><select class="select" name="matchMode" aria-label="交换模式"><option value="passive">参与闭环 | 等待自动匹配提醒</option><option value="active">参与闭环 | 仅主动找环</option><option value="one">仅一对一交换</option></select></div>'
            + '<div class="field"><label class="label">期望说明 <span class="opt">选填，≤100 字</span></label>'
            + '<input class="input" name="expectDesc" aria-label="期望说明" maxlength="100" placeholder="例如 想换一副羽毛球拍，成色差不多就行"></div>'
            + '<button class="btn btn-primary btn-block" type="submit">提交审核</button>'
            + '</form>';

        state.publishImages = [];
        state.publish = {category: '', conditionLevel: '', wantCategory: ''};
        $('#app').innerHTML = shell('home', content);
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

    async function renderOffers() {
        $('#app').innerHTML = shell('offers', loading());
        var tab = state.offersTab;
        var list = await api(tab === 'received' ? '/offer/received' : '/offer/sent');
        var rows = (list || []).map(function (o) {
            var st = OFFER_STATUS[o.status] || ['未知', ''];
            var isReceived = tab === 'received';
            var other = isReceived ? o.fromNickname : o.toNickname;
            var actions = '';
            if (o.status === 0) {
                if (isReceived) {
                    actions = '<div class="btn-row" style="margin-top:10px">'
                        + '<button class="btn btn-sm btn-primary" data-act="offer-act" data-id="' + o.id + '" data-do="accept">接受</button>'
                        + '<button class="btn btn-sm btn-ghost" data-act="offer-act" data-id="' + o.id + '" data-do="counter">还价</button>'
                        + '<button class="btn btn-sm btn-ghost" data-act="offer-act" data-id="' + o.id + '" data-do="reject">拒绝</button>'
                        + '</div>';
                } else {
                    actions = '<div class="btn-row" style="margin-top:10px">'
                        + '<button class="btn btn-sm btn-ghost" data-act="offer-act" data-id="' + o.id + '" data-do="cancel">撤回</button>'
                        + '</div>';
                }
            }
            return '<div class="card card-pad">'
                + '<div style="display:flex;gap:6px;align-items:center;margin-bottom:8px">'
                + '<span class="tag ' + st[1] + '">' + st[0] + '</span>'
                + '<span class="hint" style="margin:0">' + fmtRel(o.createTime) + '</span>'
                + '<span style="flex:1"></span>'
                + '<span class="credit ' + creditCls(o.fromCredit) + '">信用 <b class="num">'
                + (o.fromCredit === undefined ? '-' : o.fromCredit) + '</b></span>'
                + '</div>'
                + '<div style="font-size:15px;line-height:1.7">'
                + '<b>' + esc(isReceived ? (o.fromNickname || '同学') : '我') + '</b> 想用 '
                + '<span class="tag brand">' + esc(o.myTitle || '物品') + '</span> 换 '
                + '<span class="tag accent">' + esc(o.targetTitle || '物品') + '</span>'
                + '</div>'
                + (o.message ? '<p class="hint" style="margin-top:8px">「' + esc(o.message) + '」</p>' : '')
                + '<p class="hint" style="margin-top:4px">' + (o.status === 0
                    ? '24 小时内有效，还剩 ' + Math.max(0, Math.ceil((new Date(String(o.expireTime).replace(' ', 'T')) - Date.now()) / 3600000)) + ' 小时'
                    : '处理时间 ' + fmtRel(o.handleTime)) + '</p>'
                + actions
                + '</div>';
        }).join('');

        var content = tradeTabs('offers') + '<div class="page-head trade-page-head"><h1>报价</h1>'
            + '<p>对方接受后，两件物品会立刻锁定，进入待交付。</p></div>'
            + '<div class="segmented" style="margin-bottom:14px">'
            + '<button class="' + (tab === 'received' ? 'on' : '') + '" data-act="offers-tab" data-v="received">收到的</button>'
            + '<button class="' + (tab === 'sent' ? 'on' : '') + '" data-act="offers-tab" data-v="sent">我发出的</button>'
            + '</div>'
            + (rows ? '<div class="grid">' + rows + '</div>'
                : emptyState('✉', tab === 'received' ? '还没有人报价' : '你还没报过价',
                    tab === 'received' ? '把物品描述写清楚，报价会来的' : '去集市挑一件喜欢的，用你的闲置去换',
                    '<button class="btn btn-primary btn-sm" data-act="go" data-to="#/home">去集市逛逛</button>'));

        $('#app').innerHTML = shell('trade', content);
    }

    // ------------------------------------------------------------------ 三方环

    async function renderCycle(itemId) {
        $('#app').innerHTML = shell('home', loading());
        var rings = await api('/cycle/' + itemId);

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
            return '<button class="card card-pad" style="display:block;text-align:left;width:100%;cursor:pointer" '
                + 'data-act="go" data-to="#/exchange/' + e.id + '">'
                + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">'
                + '<span class="tag ' + st + '">' + esc(e.statusText) + '</span>'
                + '<span class="tag ghost">' + (e.type === 3 ? '三方环' : '一对一') + '</span>'
                + '<span style="flex:1"></span>'
                + '<span class="hint" style="margin:0">#' + e.id + '</span></div>'
                + stepsHtml(e.status)
                + '<p class="hint" style="margin:0">已确认 ' + (e.confirmedCount || 0) + '/' + (e.needConfirm || 2)
                + ' | 已交付 ' + (e.deliveredCount || 0) + '/' + (e.needConfirm || 2)
                + (e.place ? ' | ' + esc(e.place) : '') + '</p>'
                + '</button>';
        }).join('');

        var content = tradeTabs('exchange') + '<div class="page-head trade-page-head"><h1>交换单</h1>'
            + '<p>点进单子能看到谁给谁什么。到货后记得点「我已交换」。</p></div>'
            + (rows ? '<div class="grid">' + rows + '</div>'
                : emptyState('♻', '还没有交换单', '接受一个报价，或者凑成一个三方环，就会出现在这里',
                    '<button class="btn btn-primary btn-sm" data-act="go" data-to="#/home">去集市</button>'));

        $('#app').innerHTML = shell('trade', content);
    }

    async function renderExchangeDetail(id) {
        $('#app').innerHTML = shell('exchange', loading());
        var e = await api('/exchange/' + id);
        var mine = e.mine || {};
        var details = e.details || [];

        var rows = details.map(function (d) {
            var isMe = mine.userId === d.userId;
            return '<div class="list-row" style="cursor:default">'
                + '<div class="avatar" style="width:32px;height:32px;border-radius:11px">'
                + esc((d.nickname || '同').slice(0, 1)) + '</div>'
                + '<div class="row-main">'
                + '<p class="row-title" style="font-size:14px">'
                + (isMe
                    ? esc(d.nickname || '同学') + ' <span class="tag brand">我</span>'
                    : '<button class="name-link" data-act="go" data-to="#/user/' + d.userId + '">'
                      + esc(d.nickname || '同学') + '</button>')
                + '</p>'
                + '<p class="row-sub">给出「' + esc(d.giveTitle || '') + '」 | 得到「' + esc(d.getTitle || '') + '」</p>'
                + '</div>'
                + '<div style="text-align:right;font-size:11px;color:var(--ink-400);flex:none;white-space:nowrap">'
                + '<div>' + (d.confirmed ? '<span style="color:var(--success-600)">已确认</span>' : '待确认') + '</div>'
                + '<div>' + (d.delivered ? '<span style="color:var(--success-600)">已交付</span>' : '待交付') + '</div>'
                + '</div></div>';
        }).join('');

        var actions = '';
        if (e.status === 1) {
            actions = '<button class="btn btn-primary btn-block" data-act="ex-confirm" data-id="' + e.id + '">'
                + (mine.confirmed ? '已确认，等其他人' : '同意闭环交换') + '</button>';
        } else if (e.status === 2) {
            actions = '<button class="btn btn-primary btn-block" data-act="ex-done" data-id="' + e.id + '">'
                + (mine.delivered ? '已交换，等其他人' : '我已交换') + '</button>';
        } else if (e.status === 3) {
            actions = '<button class="btn btn-accent btn-block" data-act="open-review" data-id="' + e.id + '">给对方打个分</button>';
        }
        if (e.status === 1 || e.status === 2) {
            actions += '<button class="btn btn-ghost" data-act="open-place" data-id="' + e.id + '">约面交</button>'
                + '<button class="btn btn-ghost" data-act="ex-cancel" data-id="' + e.id + '">取消</button>';
        }

        var content = '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">'
            + '<button class="btn btn-sm btn-ghost" data-act="go" data-to="#/exchange">← 返回</button>'
            + '<span style="flex:1"></span><span class="hint">#' + e.id + ' | ' + (e.type === 3 ? '三方环' : '一对一') + '</span>'
            + '</div>'
            + '<div class="page-head" style="margin-bottom:10px"><h1>' + esc(e.statusText) + '</h1>'
            + '<p>创建于 ' + fmtDate(e.createTime)
            + ' | 已确认 ' + (e.confirmedCount || 0) + '/' + (e.needConfirm || 2)
            + ' | 已交付 ' + (e.deliveredCount || 0) + '/' + (e.needConfirm || 2) + '</p></div>'
            + stepsHtml(e.status)
            + '<div class="card" style="margin-top:6px">' + rows + '</div>'
            + (e.type===3 ? '<div class="ring-flow-list">'+details.map(function(d){var recipient=details.find(function(x){return x.getItemId===d.giveItemId;});return '<div><b>'+esc(d.nickname)+'</b> 的「'+esc(d.giveTitle)+'」<span aria-hidden="true"> → </span><b>'+esc(recipient?recipient.nickname:'待确认')+'</b></div>';}).join('')+'</div><button class="btn btn-ghost" data-act="go" data-to="#/ring/'+e.id+'">进入三方协商房间</button>' : '')
            + (e.place ? '<div class="card card-pad" style="margin-top:12px">'
                + '<div class="kv"><span class="k">面交点</span><span class="v">' + esc(e.place) + '</span></div>'
                + (e.dealTime ? '<div class="kv"><span class="k">时间</span><span class="v">' + esc(e.dealTime) + '</span></div>' : '')
                + '</div>' : '')
            + '<div class="action-bar" style="flex-wrap:wrap">' + actions + '</div>';

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
            $('#app').innerHTML = shell('home', emptyState('<svg class="line-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true"><path d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z M16 16l4 4"/></svg>', '找不到这位同学',
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

        var content = '<section class="redesign-page public-profile"><header class="redesign-heading"><a class="icon-action" href="#/home" aria-label="返回首页">←</a><h1>个人主页</h1><button type="button" class="link-btn" data-act="profile-share">分享</button></header><div class="card card-pad">'
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
                    + '<span style="color:var(--theme-ink);font-size:13px;white-space:nowrap">' + '★'.repeat(r.score) + '</span></div>'
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
        var items = await api('/item/mine');
        var reviews = await api('/review/user/' + me.id);
        var pending = [];
        try {
            pending = (await api('/review/pending')) || [];
        } catch (e) {
            pending = [];
        }
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
                + ' <span style="color:var(--theme-ink)">' + '★'.repeat(r.score) + '</span></p>'
                + '<p class="row-sub">' + esc(r.content || '没有留文字') + '</p></div>'
                + '<span class="hint">' + fmtDate(r.createTime) + '</span></div>';
        }).join('');

        var content = '<section class="redesign-page my-page"><header class="redesign-heading"><h1>我的</h1><a class="icon-action" aria-label="设置" href="#/settings">'+navIcon('settings')+'</a></header><div class="card card-pad" style="margin-bottom:14px">'
            + '<div class="user-row">'
            + '<a class="avatar lg" href="#/user/'+Number(me.id)+'" aria-label="打开个人主页">' + esc(me.nickname.slice(0, 1)) + '</a>'
            + '<div class="u-main"><p class="u-name" style="font-size:18px">' + esc(me.nickname)
            + (me.role === 1 ? ' <span class="tag brand">管理员</span>' : '') + '</p>'
            + '<p class="u-sub">重庆移通学院 | ' + esc(me.college || '未填院系')
            + ' | ' + esc(me.building || '未填宿舍楼') + '</p>'
            + '</div></div>'
            + '<div class="stats" style="margin-top:14px">'
            + '<div class="stat"><p class="k">信用分</p><p class="v num">' + me.credit
            + '<small>' + esc(creditLevelOf(me.credit).text) + '</small></p></div>'
            + '<div class="stat"><p class="k">成交</p><p class="v num">' + (me.dealCount || 0) + '<small>单</small></p></div>'
            + '<div class="stat"><p class="k">收到的评价</p><p class="v num">' + (me.reviewCount || 0) + '<small>条</small></p></div>'
            + '<div class="stat"><p class="k">平均分</p><p class="v num">'
            + (me.avgScore ? me.avgScore : '<span style="font-size:15px;color:var(--ink-400)">暂无</span>')
            + '</p></div>'
            + '</div>'
            + '<div class="credit-track"><div class="credit-fill" style="width:'
            + Math.max(3, Math.min(100, me.credit || 0)) + '%"></div></div>'
            + '<div class="credit-scale"><span>0</span><span>60 受限线</span><span>100</span></div>'
            + '<div class="credit-links">'
            + '<button class="link-btn" data-act="credit-rule">信用分怎么算 ›</button>'
            + (pending.length
                ? '<button class="link-btn accent" data-act="pending-review">有 ' + pending.length + ' 单待评价 ›</button>'
                : '<span class="hint" style="margin:0">没有待评价的交换</span>')
            + '</div>'
            + '<div class="btn-row" style="margin-top:14px">'
            + '<button class="btn btn-ghost btn-sm" data-act="open-profile">改资料</button>'
            + (me.role === 1 ? '<button class="btn btn-ghost btn-sm" data-act="go" data-to="#/admin">管理后台</button>' : '')
            + '<button class="btn btn-ghost btn-sm" data-act="logout">退出登录</button>'
            + '</div></div>'

            + '<div class="my-shortcuts"><a href="#/favorites"><b>'+shelfRead('favorites').length+'</b>我的收藏</a><a href="#/history"><b>'+shelfRead('history').length+'</b>浏览历史</a><a href="#/wishes">'+navIcon('wish')+'心愿单</a><a href="#/auction/mine">'+navIcon('auction')+'我的拍卖</a></div>'
            + '<section class="card card-pad my-trades"><h2>我的交易</h2><div class="my-shortcuts"><a href="#/offers">'+navIcon('trade')+'我的报价</a><a href="#/exchange">'+navIcon('box')+'我的交换</a><a href="#/publish">'+navIcon('add')+'发布闲置</a></div></section>'
            + '<div class="section-title"><h2>我的物品</h2>'
            + '<div class="title-actions">'
            + '<span class="more">共 ' + (items || []).length + ' 件，在架 ' + onShelf.length + '</span>'
            + '<button class="plus-link" data-act="go" data-to="#/publish">＋ 上架</button>'
            + '</div></div>'
            + '<div class="segmented" style="margin-bottom:10px">'
            + [['all', '全部'], ['1', '在架'], ['4', '已下架'], ['3', '已换出']].map(function (t) {
                return '<button class="' + (String(state.meFilter) === t[0] ? 'on' : '')
                    + '" data-act="me-filter" data-v="' + t[0] + '">' + t[1] + '</button>';
            }).join('')
            + '</div>'
            + (itemRows ? '<div class="grid">' + itemRows + '</div>'
                : emptyState('<svg class="line-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true"><path d="M4 7l8-4 8 4v10l-8 4-8-4z M4 7l8 4 8-4 M12 11v10"/></svg>',
                    state.meFilter === 'all' ? '还没有发布过物品' : '这个状态下没有物品',
                    state.meFilter === 'all' ? '先发一件，换物的第一步' : '切换上面的分类看看',
                    '<button class="btn btn-primary btn-sm" data-act="go" data-to="#/publish">去发布</button>'))

            + '<div class="section-title"><h2>收到的评价</h2></div>'
            + (reviewRows ? '<div class="list">' + reviewRows + '</div>'
                : emptyState('⭐', '还没有评价', '完成一次交换后，对方可以给你打分'));

        $('#app').innerHTML = shell('me', content+'</section>');
    }

    function auctionCard(a, mode) {
        var labels={active:'竞拍中',cancelled:'已取消',pending:'待审核',rejected:'审核未通过',settled:'已成交',ended:a.bidCount ? '等待卖家结算' : '已结束 | 无报价'};
        var end=String(a.endsAt || '').replace('T',' ').slice(0,16);
        var image=firstImage(a.image);
        return '<article class="auction-card">'+(image?'<img class="auction-image" src="'+esc(image)+'" alt="'+esc(a.title)+'">':'<div class="auction-image auction-image-empty">历史拍品暂无图片</div>')+'<div class="auction-card-head"><span class="tag">'+esc(labels[a.state] || '未知')+'</span>'+(a.state==='active'||a.state==='ended'?'<span class="hint">截止 '+esc(end)+'</span>':'')+'</div><h2>'+esc(a.title)+'</h2><p>'+esc(a.description || '暂无描述')+'</p><div class="auction-price"><span>'+(a.bidCount?'当前最高':'起拍价')+'</span><b>¥'+esc(a.currentPrice)+'</b></div><div class="auction-meta">发布者：'+esc(a.seller)+' | '+a.bidCount+' 次出价'+(a.bidder?' | 最高出价：'+esc(a.bidder):'')+'</div>'
         +(a.state==='settled'?'<p class="auction-result">已选报价：'+esc(a.winner)+' | ¥'+esc(a.selectedAmount)+'。请双方自行协商线下交付。</p>':'')
         +(mode==='admin'&&a.state==='pending'?'<div class="btn-row"><button class="btn btn-sm btn-primary" data-act="review-listing" data-kind="auctions" data-do="approve" data-id="'+a.id+'">通过</button><button class="btn btn-sm" data-act="review-listing" data-kind="auctions" data-do="reject" data-id="'+a.id+'">驳回</button></div>':'')
         +(mode==='admin'&&(a.state==='active'||a.state==='ended')?'<button class="btn btn-sm" data-act="auction-cancel" data-id="'+a.id+'">取消拍卖</button>':'')
         +(mode==='mine'&&(a.state==='active'||a.state==='ended')&&a.bidCount?'<button class="btn btn-primary btn-sm" data-act="auction-bids" data-id="'+a.id+'">查看报价并结算</button>':'')
         +(mode==='public'&&a.state==='active'?'<button class="btn btn-primary btn-sm" data-act="auction-bid" data-id="'+a.id+'">参与出价</button>':'')+'</article>';
    }
    async function renderAuctions(mine) {
        $('#app').innerHTML=shell('auctions',loading());
        var auctions=await api(mine?'/auction/mine':'/auction');
        var content='<div class="auction-page-head"><div><span class="tag">AUCTIONS</span><h1>'+(mine?'我的拍卖':'校园拍卖')+'</h1><p>人民币出价，成交后由双方线下协商交付。</p></div><div class="btn-row"><a class="btn btn-ghost" href="'+(mine?'#/auctions':'#/auction/mine')+'">'+(mine?'返回拍卖':'我的拍卖')+'</a><a class="btn btn-primary" href="#/auction/new">发起拍卖</a></div></div>'
          +(auctions.length?'<div class="auction-grid">'+auctions.map(function(a){return auctionCard(a,mine?'mine':'public');}).join('')+'</div>':'<div class="card card-pad">暂无拍卖。</div>');
        $('#app').innerHTML=shell('auctions',content);
    }
    function renderAuctionNew() {
        state.publishImages=[];
        $('#app').innerHTML=shell('auctions','<div class="auction-form"><div class="page-head"><h1>发起拍卖</h1><p>提交后由管理员审核，5 分钟未处理将自动通过，通过后开始计时。</p></div><form class="card card-pad" data-form="auction-new"><div class="field"><label class="label">拍品名称</label><input class="input" name="title" maxlength="80" required></div><div class="field"><label class="label">拍品描述</label><textarea class="textarea" name="description" maxlength="500"></textarea></div><div class="field"><label class="label">图片（必填，最多 3 张）</label><div class="chips" id="img-preview"></div></div><div class="field"><label class="label">起拍价（元）</label><input class="input" name="amount" type="number" min="0.01" max="1000000" step="0.01" required></div><div class="field"><label class="label">拍卖时长（小时，1–168）</label><input class="input" name="hours" type="number" value="24" min="1" max="168" required></div><button class="btn btn-primary" type="submit">提交审核</button></form></div>');
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
    function showNoticePopup(count) {
        if(!count || location.hash==='#/notifications')return;
        if(document.hidden || !document.querySelector('.appbar .notice-link')) { noticeTracker.pending=count;return; }
        noticeTracker.pending=0;closeNoticePopup();
        var popup=document.createElement('div');popup.id='notice-popup';popup.className='notice-popup';popup.setAttribute('role','status');popup.setAttribute('aria-live','polite');
        popup.innerHTML='<span class="notice-popup-icon" aria-hidden="true">'+navIcon('notice')+'</span><div class="notice-popup-content"><strong>您有 '+count+' 条未读消息</strong><span>有新动态，记得查收。</span><a href="#/notifications">查看消息 →</a></div><button type="button" class="notice-popup-close" aria-label="关闭消息提醒">×</button>';
        document.body.appendChild(popup);positionNoticePopup();
        popup.querySelector('button').addEventListener('click',closeNoticePopup);
        popup.querySelector('a').addEventListener('click',closeNoticePopup);
        noticeTracker.timer=setTimeout(closeNoticePopup,8000);
    }
    async function refreshNoticeCount() {
        var token=readToken();
        if(token!==noticeTracker.token){noticeTracker.token=token;noticeTracker.latest=0;noticeTracker.count=0;noticeTracker.initialized=false;noticeTracker.pending=0;closeNoticePopup();}
        if(!token)return;
        var request=++noticeTracker.request;
        try {
            var response=await fetch(BASE+'/api/notification/unread',{credentials:'include',headers:{'X-Token':token}});if(!response.ok)return;
            var payload=await response.json();if(payload.code!==0)return;var n=Math.max(0,Number(payload.data.count)||0),latest=0;
            if(n){try{var listResponse=await fetch(BASE+'/api/notification',{credentials:'include',headers:{'X-Token':token}});if(listResponse.ok){var listPayload=await listResponse.json();if(listPayload.code===0&&Array.isArray(listPayload.data)){listPayload.data.forEach(function(item){if(!item.read)latest=Math.max(latest,Number(item.id)||0);});}}}catch(ignore){}}
            if(request!==noticeTracker.request || readToken()!==token)return;
            document.querySelectorAll('.notice-count').forEach(function(el){el.textContent=n>99?'99+':String(n);el.hidden=n===0;el.setAttribute('aria-label',n+' 条未读消息');});document.title=(n?'('+n+') ':'')+'换一圈 | 重庆移通学院校园换物';
            var isNew=n>0&&(!noticeTracker.initialized||(latest>noticeTracker.latest)||(latest===0&&n>noticeTracker.count));
            noticeTracker.initialized=true;noticeTracker.count=n;noticeTracker.latest=Math.max(noticeTracker.latest,latest);
            if(!n){noticeTracker.pending=0;closeNoticePopup();}else if(isNew || noticeTracker.pending)showNoticePopup(n);
        }catch(e){ /* 提醒服务暂时不可用时保留页面状态 */ }
    }
    window.addEventListener('resize',positionNoticePopup);
    window.addEventListener('scroll',positionNoticePopup,{passive:true});
    document.addEventListener('visibilitychange',function(){if(!document.hidden&&noticeTracker.pending)showNoticePopup(noticeTracker.pending);});
    async function renderNotifications() {
        var notices=await api('/notification');
        var rows=notices.map(function(n){var target=/^#\/(offers|exchange(?:\/\d+)?|wishes(?:\/\d+)?|auctions|auction\/mine|chat\/\d+|cycle\/\d+|item\/\d+)$/.test(n.target)?n.target:'#/notifications';return '<a class="notice-row '+(n.read?'':'is-unread')+'" href="'+esc(target)+'" data-act="notice-open" data-id="'+n.id+'" data-to="'+esc(target)+'"><span class="notice-dot"></span><span class="notice-body"><b>'+esc(n.title)+'</b><span>'+esc(n.content)+'</span></span><time>'+esc(String(n.createdAt).replace('T',' ').slice(0,16))+'</time></a>';}).join('');
        var conversations=await api('/conversation').catch(function(){return null;});
        if(currentView.name!=='notifications')return;
        $('#app').innerHTML=shell('notifications','<section class="redesign-page messages-page"><header class="redesign-heading"><h1>消息</h1><a class="icon-action" aria-label="设置" href="#/settings">'+navIcon('settings')+'</a></header><div class="message-actions"><a class="btn btn-ghost" href="#/trade">交易消息</a><button class="btn btn-ghost" data-act="notice-read">全部标为已读</button></div><label class="label" for="message-filter">查找会话</label><input type="search" id="message-filter" class="input" placeholder="搜索同学昵称或物品"><h2>系统通知</h2><div class="notice-list">'+(rows||'<div class="card card-pad">暂时没有通知。</div>')+'</div><h2>私聊</h2><div class="conversation-list">'+(conversations?conversationRows(conversations):'<p class="hint">会话暂时加载失败，请刷新重试。</p>')+'</div></section>');refreshNoticeCount();
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
        return '<article class="chat-message '+(mine?'is-mine':'')+'"><div class="chat-avatar">'+esc((m.nickname||'?').slice(0,1))+'</div><div class="chat-message-body"><div class="chat-meta"><b>'+esc(m.nickname)+'</b><time>'+esc(String(m.createdAt).replace('T',' ').slice(5,16))+'</time></div><div class="chat-bubble">'+img+(m.content?'<p class="chat-text">'+esc(m.content)+'</p>':'')+'</div></div></article>';
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
        if(currentView.arg!==id)return;
        var tools=ring?'':'<details class="room-attachments"><summary aria-label="打开附件面板">'+navIcon('add')+'</summary><div><label class="chat-tool">相册<input type="file" accept="image/png,image/jpeg" data-act="room-image" hidden></label><label class="chat-tool">拍摄<input type="file" accept="image/*" capture="environment" data-act="room-image" hidden></label><a class="chat-tool" href="#/item/'+Number(thread.itemId)+'">查看物品</a></div></details>';
        var name=ring?esc(title):'<a href="#/user/'+Number(peer)+'">'+esc(title)+'</a>';
        $('#app').innerHTML=shell('notifications','<section class="redesign-page room-redesign"><header class="redesign-heading"><a class="icon-action" href="'+esc(back)+'" aria-label="返回">←</a><h1>'+name+'</h1></header>'+product+'<p class="room-safety">'+(ring?'仅本次闭环的三位参与者可见。':'面交时请选校内公共地点，确认物品状态后再交付。')+'</p><section class="chat-panel room-panel"><div class="chat-messages" id="room-messages" aria-live="polite"></div><form class="chat-compose" data-form="room-text"><div class="room-input"><textarea name="content" maxlength="500" rows="2" placeholder="想跟 TA 说点什么" aria-label="消息内容" required></textarea><button type="submit" class="btn btn-primary btn-sm">发送</button></div>'+tools+'</form></section></section>');
        await refreshRoom(true);
        if(currentView.arg===id&&['chat','ringChat'].includes(currentView.name))roomTimer=setInterval(function(){refreshRoom(false);},5000);
    }
    async function renderWishes() {
        var matched=currentView.name==='wishes'?currentView.arg:null;var wishes=await api('/wish'+(matched?'/'+matched:''));var rows=wishes.map(function(w){return '<article class="wish-card"><div><span class="tag">'+esc(w.category||'求换')+'</span><span class="hint"> '+esc(w.nickname)+'</span></div><h2>'+esc(w.title)+'</h2><p>'+esc(w.content||'')+'</p><div class="btn-row">'+(state.me&&w.userId===state.me.id?'<button class="btn btn-sm" data-act="wish-close" data-id="'+w.id+'">关闭求换</button>':'<button class="btn btn-sm" data-act="go" data-to="#/user/'+w.userId+'">查看发布者</button>')+'</div></article>';}).join('');
        $('#app').innerHTML=shell('community','<div class="community-head"><div><span class="tag">WISH POOL</span><h1>说说你想换什么。</h1><p>写下想换的物品，匹配到在架物品时双方都会收到通知。</p></div><button class="btn" data-act="go" data-to="#/community">返回社区</button></div><form class="card card-pad wish-form" data-form="wish-new"><label class="label">我想要</label><input class="input" name="title" maxlength="100" placeholder="例如：一本高数习题集" required><label class="label">类别（选填）</label><select class="select" name="category"><option value="">不限</option>'+CATS.map(function(c){return '<option>'+esc(c)+'</option>';}).join('')+'</select><label class="label">补充说明（选填）</label><textarea class="textarea" name="content" maxlength="500" placeholder="描述你想交换的物品或需求"></textarea><button class="btn btn-primary" type="submit">发布求换</button></form><div class="wish-grid">'+(rows||'<div class="card card-pad">暂无求换，来发布第一个愿望吧。</div>')+'</div>');
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
        $('#app').innerHTML=shell('community','<div class="community-head"><div><span class="tag">CAMPUS CLUB</span><h1>一起聊聊。</h1><p>分享闲置，也分享校园生活。</p></div><div class="btn-row"><button class="btn" data-act="go" data-to="#/wishes">求换专区</button><button class="btn btn-primary" data-act="go" data-to="#/community/game">进入 Scrap Arena</button></div></div><div class="community-layout"><section class="chat-panel"><div class="chat-head"><div><b>校园公共聊天室</b><span>全校可见 | 最近 100 条</span></div><span class="chat-live">● 在线交流</span></div><div class="chat-messages" id="chat-messages" aria-live="polite"></div><form class="chat-compose" data-form="community-text"><textarea name="content" maxlength="500" rows="2" placeholder="分享今天的新鲜事…" aria-label="消息内容" required></textarea><div class="chat-tools"><div><label class="chat-tool">发送图片<input type="file" accept="image/png,image/jpeg" data-act="community-image" hidden></label><button type="button" class="chat-tool" data-act="community-share">分享物品</button></div><button type="submit" class="btn btn-primary btn-sm">发送</button></div></form></section><aside class="community-side"><span class="tag">ARCADE</span><h2>下课，<br>来一局。</h2><p>Scrap Arena | 双人同屏格斗</p><button class="btn" data-act="go" data-to="#/community/game">开始游戏 ↗</button><small>键盘操作 | 同一设备双人对战</small></aside></div>');
        var communityDraft=sessionStorage.getItem('hq.communityDraft');
        if(communityDraft){
            sessionStorage.removeItem('hq.communityDraft');
            var compose=$('[data-form="community-text"] textarea');
            if(compose){compose.value=communityDraft;compose.focus();}
        }
        await refreshCommunity(true); if(currentView.name==='community') communityTimer=setInterval(function(){refreshCommunity(false);},5000);
    }
    function renderCommunityGame() {
        $('#app').innerHTML=shell('community','<div class="game-page-head"><div><span class="tag">COMMUNITY ARCADE</span><h1>Scrap Arena</h1><p>同一台设备，双人键盘对战。</p></div><div class="btn-row"><button class="btn" data-act="go" data-to="#/community">返回社区</button><a class="btn btn-primary" href="/scrap-arena/index.html" target="_blank" rel="noopener">新窗口打开</a></div></div><div class="game-frame-wrap"><iframe class="game-frame" src="/scrap-arena/index.html" title="Scrap Arena 游戏" allow="fullscreen; autoplay"></iframe></div><p class="game-note">点击游戏画面后开始操作。游戏需要键盘；首次加载资源可能需要几秒。P1：W / A / S / D + J / K / L；P2：方向键 + 1 / 2 / 3。按 Enter 开始。</p>');
    }

    // ------------------------------------------------------------------ 后台

    async function renderAdmin() {
        $('#app').innerHTML = shell('me', loading());
        var tab = state.adminTab;
        var body = '';

        if (tab === 'report') {
            var reports = await api('/admin/report?status=0');
            var rows = (reports || []).map(function (r) {
                return '<div class="card card-pad" style="margin-bottom:10px">'
                    + '<div style="display:flex;gap:6px;align-items:center;margin-bottom:6px">'
                    + '<span class="tag danger">' + (r.targetType === 1 ? '物品' : '用户') + ' #' + r.targetId + '</span>'
                    + '<span style="flex:1"></span><span class="hint" style="margin:0">' + fmtRel(r.createTime) + '</span></div>'
                    + '<p style="margin:0 0 4px;font-size:14px">' + esc(r.reason) + '</p>'
                    + '<p class="hint" style="margin:0">举报人 ' + esc(r.reporterNickname || '匿名')
                    + (r.targetTitle ? ' | 对象「' + esc(r.targetTitle) + '」' : '') + '</p>'
                    + '<div class="btn-row" style="margin-top:10px">'
                    + '<button class="btn btn-sm btn-primary" data-act="report-act" data-id="' + r.id + '" data-do="approve">认定违规</button>'
                    + '<button class="btn btn-sm btn-ghost" data-act="report-act" data-id="' + r.id + '" data-do="reject">驳回</button>'
                    + '</div></div>';
            }).join('');
            body = rows || emptyState('<svg class="line-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true"><path d="M12 3v18 M3 12h18 M6 6l12 12 M18 6L6 18"/></svg>', '没有待处理的举报', '平台挺干净的');
        } else if (tab === 'items') {
            var items = await api('/admin/items');
            body = items.length ? items.map(function(it) { var img=firstImage(it.images); return '<article class="auction-card">'+(img?'<img class="auction-image" src="'+esc(img)+'" alt="">':'')+'<h2>'+esc(it.title)+'</h2><p>'+esc(it.description || '')+'</p><p class="hint">发布者：'+esc(it.ownerNickname)+'</p><div class="btn-row"><button class="btn btn-sm btn-primary" data-act="review-listing" data-kind="items" data-do="approve" data-id="'+it.id+'">通过</button><button class="btn btn-sm" data-act="review-listing" data-kind="items" data-do="reject" data-id="'+it.id+'">驳回</button></div></article>'; }).join('') : '<div class="card card-pad">没有待审核物品</div>';
        } else if (tab === 'auctions') {
            var auctions = await api('/admin/auctions');
            body = auctions.length ? auctions.map(function(a) { return auctionCard(a, 'admin'); }).join('') : '<div class="card card-pad">暂无拍卖</div>';
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

        var content = '<div class="page-head"><h1>运营后台</h1><p>举报处理与平台数据。</p></div>'
            + '<div class="segmented" style="margin-bottom:14px">'
            + '<button class="' + (tab === 'report' ? 'on' : '') + '" data-act="admin-tab" data-v="report">举报</button>'
            + '<button class="' + (tab === 'dashboard' ? 'on' : '') + '" data-act="admin-tab" data-v="dashboard">看板</button>'
            + '<button class="' + (tab === 'items' ? 'on' : '') + '" data-act="admin-tab" data-v="items">物品审核</button>'
            + '<button class="' + (tab === 'auctions' ? 'on' : '') + '" data-act="admin-tab" data-v="auctions">拍卖管理</button>'
            + '</div>' + body;

        $('#app').innerHTML = shell('admin', content);
    }

    // ------------------------------------------------------------------ 弹层

    function openSheet(html) {
        $('#modal').innerHTML = '<div class="mask" data-act="mask-close"><div class="sheet">'
            + '<div class="sheet-grip"></div>' + html + '</div></div>';
    }

    function closeSheet() {
        $('#modal').innerHTML = '';
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
            + '<div class="stars" id="review-stars" style="margin-bottom:14px">'
            + [1, 2, 3, 4, 5].map(function (n) {
                return '<span class="star ' + (n <= 5 ? 'on' : '') + '" data-act="set-star" data-n="' + n + '">★</span>';
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
        $('#app').innerHTML = '<div class="landing"><header class="land-header"><button class="land-menu-toggle" type="button" data-act="landing-menu" aria-expanded="false" aria-controls="landing-menu" aria-label="'+w.menu+'"><span></span><span></span></button><a class="land-brand" href="#/home"><span class="land-brand-mark" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 8h16l-4-4M21 16H5l4 4"/></svg></span>换一圈<span class="land-brand-en">ROUND AGAIN</span></a><a class="land-header-link land-notices" href="#/notifications">'+(en?'Messages':'消息')+'<span class="notice-count" hidden></span></a><a class="land-header-link" href="#/market">'+w.market+' <span aria-hidden="true">↗</span></a></header>'
        + '<div class="land-scrim" data-act="landing-menu-close" hidden></div><aside class="land-drawer" id="landing-menu" aria-label="'+w.menu+'" hidden><div class="land-drawer-top"><b>MENU / 菜单</b><button data-act="landing-menu-close" aria-label="'+w.close+'">×</button></div><nav><a href="#/home">'+w.home+'</a><a href="#/market">'+w.market+'</a><a href="#/publish">'+w.publish+'</a><a href="#/community">'+(en ? 'Community' : '校园社区')+'</a><a href="#/notifications">'+(en ? 'Notifications' : '消息通知')+' <span class="notice-count" hidden></span></a><a href="#/admin">'+(en ? 'Admin' : '管理后台')+'</a><a href="#/login">'+w.account+'</a></nav><div class="land-language"><span>'+w.language+'</span><div><button data-act="landing-lang" data-lang="zh" aria-pressed="'+(!en)+'">中文</button><button data-act="landing-lang" data-lang="en" aria-pressed="'+en+'">EN</button></div><small>'+w.langnote+'</small></div></aside>'
        + '<main><section class="land-hero"><div class="land-hero-copy"><p class="land-eyebrow">'+w.eyebrow+'</p><h1>'+w.title+'</h1><p class="land-sub">'+w.sub+'</p><div class="land-actions"><a class="land-primary" href="#/market">'+w.explore+' <span aria-hidden="true">↗</span></a><button class="land-secondary" data-act="landing-how">'+w.how+' <span aria-hidden="true">↓</span></button></div></div><div class="land-illustration" aria-hidden="true"><div class="land-orbit orbit-one"></div><div class="land-orbit orbit-two"></div><div class="land-art-card art-one"><svg viewBox="0 0 100 100"><path d="M22 28h48v46H22zM30 20h48v46M34 41h24M34 52h24"/></svg></div><div class="land-art-card art-two"><svg viewBox="0 0 100 100"><path d="M20 38h60v38H20zM32 38v-8a18 18 0 0 1 36 0v8M35 52h30"/></svg></div><div class="land-art-card art-three"><svg viewBox="0 0 100 100"><path d="M25 40c4-18 15-25 25-25s21 7 25 25v30H25zM35 70v10m30-10v10M37 48h26"/></svg></div><div class="land-art-center"><svg viewBox="0 0 64 64"><path d="M12 24h39l-9-9M52 40H13l9 9"/></svg></div><span class="land-art-label">GOOD THINGS<br>GO AROUND.</span></div></section><section class="land-features" id="landing-how"><div class="land-section-head"><span>01 / THE IDEA</span><h2>'+w.how+'<span>.</span></h2></div><div class="land-feature-grid"><article><span>01</span><h3>'+w.feature1+'</h3><p>'+w.desc1+'</p></article><article><span>02</span><h3>'+w.feature2+'</h3><p>'+w.desc2+'</p></article><article><span>03</span><h3>'+w.feature3+'</h3><p>'+w.desc3+'</p></article></div></section></main><footer class="land-footer"><b>换一圈</b><span>'+w.footer+'</span><a href="#/market">'+w.explore+' ↗</a></footer></div>';
    }

    // ------------------------------------------------------------------ 路由

    var routes = [
        [/^#\/home$/, function () { return 'home'; }],
        [/^#\/(?:market|search)$/, function () { return 'home'; }],
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
        [/^#\/publish\/edit$/, function () { return 'publish'; }],
        [/^#\/offers$/, function () { return 'offers'; }],
        [/^#\/trade$/, function () { return 'offers'; }],
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
        if (view.name === 'landing') { renderLanding(); return; }
        if (view.name === 'login') {
            renderLogin(state.loginMode || 'login');
            return;
        }
        if (!state.me && view.name !== 'home' && view.name !== 'settings' && view.name !== 'auctions' && view.name !== 'item' && view.name !== 'user') {
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
            } else if (view.name === 'publishEntry') {
                renderPublishEntry();
            } else if (view.name === 'publish') {
                renderPublish();
            } else if (view.name === 'offers') {
                await renderOffers();
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

        if(act==='skip-main'){ev.preventDefault();$('#main-content')?.focus();return;}
        if(act==='search-clear-history'){
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
            if(await loadHome(true)){renderHome();document.querySelector('.market-feed')?.scrollIntoView();}
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
                if(ok){el.setAttribute('aria-pressed',String(!saved));el.textContent=saved?'♡ 收藏物品':'♥ 已收藏';}
            });return;
        }
        if(act==='shelf-remove'){var key=el.dataset.key;if(shelfWrite(key,shelfRead(key).filter(function(x){return x.id!==Number(el.dataset.id); })))renderShelf();return;}
        if(act==='shelf-clear'){if(confirm('清空当前浏览器的浏览历史？')&&shelfWrite('history',[]))renderShelf();return;}
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
            if (act === 'f-cat') state.home.category = el.dataset.v;
            else state.home.condition = el.dataset.v;
            if(await loadHome(true)) { renderHome(); if ($('#modal').innerHTML) openFilterSheet(); }
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
        if (act === 'offers-tab' || act === 'admin-tab') {
            if (act === 'offers-tab') state.offersTab = el.dataset.v;
            else state.adminTab = el.dataset.v;
            await render();
            return;
        }
        if (act === 'ex-confirm' || act === 'ex-done') {
            await withBusy(el, async function () {
                var r = await api('/exchange/' + el.dataset.id + (act === 'ex-confirm' ? '/confirm' : '/done'),
                    {method: 'POST'});
                toast(r.msg || '已确认', 'ok');
                await render();
            });
            return;
        }
        if (act === 'ex-cancel') {
            if (!confirm('取消后整单失效，三件物品解锁回在架。确定吗？')) return;
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
        var btn = form.querySelector('button[type=submit]');

        var run = async function () {
            if (kind === 'room-text') {var roomId=currentView.arg,ringRoom=currentView.name==='ringChat';await api('/conversation/'+(ringRoom?'ring/':'')+roomId,{method:'POST',body:{kind:'text',content:fd.get('content')}});form.reset();await refreshRoom(true);return;}
            if (kind === 'wish-new') {await api('/wish',{method:'POST',body:{title:fd.get('title'),category:fd.get('category'),content:fd.get('content')}});toast('求换已发布');await renderWishes();return;}
            if (kind === 'community-text') { await api('/community',{method:'POST',body:{kind:'text',content:fd.get('content')}}); form.reset(); await refreshCommunity(true); return; }
            if (kind === 'auction-new') {
                if (!state.publishImages.length) throw new ApiError('请上传拍品图片'); await api('/auction', {method:'POST', body:{title:fd.get('title'), description:fd.get('description'), amount:fd.get('amount'), hours:fd.get('hours'), image:state.publishImages.join(',')}}); toast('已提交审核'); go('#/auction/mine'); return;
            }
            if (kind === 'estimate') {
                var price=Number(fd.get('price')),range={new:[.70,.90],light:[.45,.70],used:[.20,.50]}[fd.get('condition')];
                if(!Number.isFinite(price)||price<1||!range)throw new ApiError('请输入有效的入手价和成色');
                $('#estimate-result').textContent='参考区间 ¥'+Math.round(price*range[0])+'–'+Math.round(price*range[1])+'，实际以双方协商为准。';
                return;
            }
            if (kind === 'email-send') { await api('/user/email/send',{method:'POST',body:{email:fd.get('email')}});toast('验证码已发送，请查收');$('#verify-code')?.focus();return; }
            if (kind === 'email-verify') { await api('/user/email/verify',{method:'POST',body:{code:fd.get('code')}});toast('邮箱认证成功');await renderEmail();return; }
            if (kind === 'auction-bid') {
                await api('/auction/' + encodeURIComponent(fd.get('id')) + '/bid', {method:'POST', body:{amount:fd.get('amount')}}); closeSheet(); toast('出价成功'); await renderAuctions(); return;
            }
            if (kind === 'login' || kind === 'register') {
                var no = String(fd.get('studentNo') || '').trim();
                if (!/^\d{10}$/.test(no) && !(kind === 'login' && no === 'admin')) {
                    throw new ApiError('学号是 10 位数字，例如 2021210001');
                }
            }
            if (kind === 'login') {
                var u = await api('/user/login', {method: 'POST', body: {
                    studentNo: fd.get('studentNo'), password: fd.get('password')
                }});
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
                    password: fd.get('password'), college: fd.get('college'), building: fd.get('building')
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
                go('#/item/' + (editing || r.itemId));
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
            } else if (kind === 'search') {
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
        if (ev.target.dataset.act === 'room-image') {var input=ev.target,file=input.files&&input.files[0];if(!file)return;if(file.size>2*1024*1024){toast('图片不能超过 2MB','err');input.value='';return;}var body=new FormData();body.append('file',file);input.disabled=true;try{var uploaded=await api('/upload',{method:'POST',form:body});await api('/conversation/'+currentView.arg,{method:'POST',body:{kind:'image',image:uploaded.url}});await refreshRoom(true);}catch(e){toast(e.message||'发送失败','err');}finally{input.disabled=false;input.value='';}return;}
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
                if (f.size > 2 * 1024 * 1024) {
                    toast('单张不能超过 2MB', 'err');
                    continue;
                }
                var form = new FormData();
                form.append('file', f);
                try {
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
            ? '<label class="thumb-add">＋<input type="file" accept="image/png,image/jpeg" multiple '
              + 'data-act="pick-image" aria-label="添加物品图片" hidden></label>'
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
