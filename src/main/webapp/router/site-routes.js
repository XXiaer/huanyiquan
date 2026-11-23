(() => {
    const mobile = document.documentElement.dataset.interface === 'mobile';
    const named = {
        '': '/', home: '/', market: '/market', idle: '/market', search: '/search',
        auctions: '/auctions', auction: '/auctions', 'auction/new': '/auctions/create', 'auction/mine': '/auctions/mine',
        wishes: '/wishes', wish: '/wishes', appraise: '/appraisals', relay: '/exchange-relays',
        community: '/community', 'community/game': '/community/arcade', 'community/city-wheel': '/community/city-wheel',
        publish: '/listings/create', 'publish/edit': '/listings/create/idle',
        offers: '/offers', trade: '/offers', exchange: '/exchanges',
        messages: '/messages', chats: '/messages', notifications: '/notifications',
        user: '/users', users: '/users', me: '/account', settings: '/account/settings',
        email: '/account/email', login: '/login', register: '/register',
        collection: '/account/favorites', favorites: '/account/favorites', history: '/account/history',
        followers: '/account/followers', follows: '/account/following', admin: '/admin',
        help: '/help', door: '/services/campus-delivery', lost: '/community/lost-and-found',
        quote: '/market/quotes', refresh: '/market/discover',
        scan: '/scan', 'qr-confirm': '/login/qr-confirm',
    };
    const labels = {
        '': '首页', market: '集市', item: '商品详情', search: '搜索', auctions: '校园拍卖',
        wishes: '心愿单', appraisals: '好物估价', 'exchange-relays': '换物接力',
        community: '校园社区', listings: '发布闲置', offers: '我的报价', exchanges: '交换单',
        messages: '消息', notifications: '通知', users: '用户主页', account: '我的账户',
        login: '登录', register: '注册', admin: '运营后台', help: '帮助中心', scan: '扫一扫',
    };

    function appendQuery(path, params) {
        const query = params.toString();
        return query ? path + '?' + query : path;
    }

    function url(route) {
        if (typeof route !== 'string' || !route.startsWith('#/') || route.startsWith('#//')) return null;
        const index = route.indexOf('?');
        const old = route.slice(2, index < 0 ? undefined : index);
        const params = new URLSearchParams(index < 0 ? '' : route.slice(index + 1));
        let path = Object.hasOwn(named, old) ? named[old] : '';
        let match;
        if (path === '/market' && params.get('cat')) {
            params.set('category', params.get('cat'));
            params.delete('cat');
        }
        if (!path && (match = old.match(/^search\/(.+)$/))) {
            path = '/search';
            try { params.set('q', decodeURIComponent(match[1])); } catch { return null; }
        }
        if (!path && (match = old.match(/^(?:idle\/)?category\/(.+)$/))) {
            path = '/market';
            try { params.set('category', decodeURIComponent(match[1])); } catch { return null; }
        }
        if (!path && (match = old.match(/^market\/(all|sale|swap)(?:\/([^/]+))?$/))) {
            path = '/market';
            params.set('mode', match[1]);
            if (match[2]) {
                try { params.set('category', decodeURIComponent(match[2])); } catch { return null; }
            }
        }
        if (!path && (match = old.match(/^(item|auction|exchange|chat|ring|cycle|user|credit|wishes)\/(\d+(?:\/[a-z-]+)?)$/))) {
            const family = { item:'item', auction:'auctions', exchange:'exchanges', chat:'messages/conversations',
                ring:'exchange-relays/conversations', cycle:'exchange-relays/matches', user:'users', credit:'users/credit', wishes:'wishes' };
            path = '/' + family[match[1]] + '/' + match[2];
        }
        if (!path && (match = old.match(/^publish\/(edit\/[a-z-]+|success\/\d+)$/))) {
            path = '/listings/' + match[1].replace('edit/', 'create/').replace('success/', 'published/');
        }
        if (!path && (match = old.match(/^(me|settings|admin|notifications)\/([a-z][a-z-]*)$/))) {
            const family = {me:'account', settings:'account/settings', admin:'admin', notifications:'notifications'};
            const section = {onshelf:'listings', items:'listings', sold:'sold-items', exchange:'exchanges'};
            path = '/' + family[match[1]] + '/' + (match[1] === 'me' && Object.hasOwn(section, match[2]) ? section[match[2]] : match[2]);
        }
        if (!path && (match = old.match(/^users\/(.+)$/))) {
            path = '/users';
            try { params.set('q', decodeURIComponent(match[1])); } catch { return null; }
        }
        return path ? appendQuery(path, params) : null;
    }

    function current(value = location.href) {
        const target = new URL(value, location.href);
        if (target.hash.startsWith('#/') && url(target.hash)) return target.hash;
        const path = target.pathname.replace(/\/$/, '') || '/';
        const params = target.searchParams;
        params.delete('view');
        let match;
        if (path === '/' || path === '/index.html' || path === '/mobile/index.html' || path === '/mobile') return '#/home';
        if (path === '/search') {
            const keyword = params.get('q');
            return mobile && keyword ? '#/search/' + encodeURIComponent(keyword) : '#'+appendQuery('/search', params);
        }
        if (path === '/market') {
            const category = params.get('category');
            const mode = params.get('mode');
            if (mobile) {
                const tab = params.get('tab');
                if (tab === 'auctions') return '#/auction';
                if (tab === 'relay') return '#/relay';
                if (tab === 'wishes') return '#/wish';
                return '#/market' + (mode || category ? '/' + (mode || 'all') : '') + (category ? '/' + encodeURIComponent(category) : '');
            }
            if (category) params.set('cat', category);
            params.delete('category');
            return '#'+appendQuery('/idle', params);
        }
        if (path === '/auctions') return mobile ? '#/auction' : '#/auctions';
        if (path === '/wishes') return mobile ? '#/wish' : '#'+appendQuery('/wishes', params);
        if (mobile && /^\/wishes\/\d+$/.test(path)) return '#/wish';
        if (path === '/messages') return mobile ? '#/messages' : '#/chats';
        if (path === '/account/followers') return '#/followers';
        if (path === '/account/following') return '#/follows';
        if (path === '/account/history') return '#/history';
        if (path === '/account/email') return '#/email';
        if (path === '/account/favorites') return mobile ? '#/collection' : '#/favorites';
        if (path === '/users') return '#/users' + (params.get('q') ? '/' + encodeURIComponent(params.get('q')) : '');
        if (path === '/listings/create/idle' && !mobile) return '#'+appendQuery('/publish/edit', params);
        if ((match = path.match(/^\/(item|auctions|exchanges|messages\/conversations|exchange-relays\/conversations|exchange-relays\/matches|users\/credit|users|wishes)\/(\d+(?:\/[a-z-]+)?)$/))) {
            const family = {item:'item',auctions:'auction',exchanges:'exchange','messages/conversations':'chat',
                'exchange-relays/conversations':'ring','exchange-relays/matches':'cycle','users/credit':'credit',users:'user',wishes:'wishes'};
            return '#/'+family[match[1]]+'/'+match[2];
        }
        if ((match = path.match(/^\/listings\/(create\/[a-z-]+|published\/\d+)$/))) {
            return '#'+appendQuery('/publish/'+match[1].replace('create/', 'edit/').replace('published/', 'success/'), params);
        }
        if ((match = path.match(/^\/(account\/settings|account|admin|notifications)\/([a-z][a-z-]*)$/))) {
            const family = {'account/settings':'settings',account:'me',admin:'admin',notifications:'notifications'};
            const section = {listings:mobile?'onshelf':'items','sold-items':'sold',exchanges:'exchange'};
            return '#/' + family[match[1]] + '/' + (match[1] === 'account' && Object.hasOwn(section,match[2]) ? section[match[2]] : match[2]);
        }
        const direct = Object.keys(named).find(key => named[key] === path);
        return direct ? '#' + appendQuery('/' + direct, params) : null;
    }

    function destination(route) {
        const path = url(route);
        if (path) return path;
        if (typeof route === 'string' && route.startsWith('/') && !route.startsWith('//') && current(route)) return route;
        return null;
    }

    function withInterface(path) {
        const result = new URL(path, location.href);
        const view = new URL(location.href).searchParams.get('view');
        if (view === 'desktop' || view === 'mobile') result.searchParams.set('view', view);
        return result.pathname + result.search;
    }

    function go(route, { newTab = false, replace = false } = {}) {
        const path = destination(route);
        if (!path) return false;
        const target = withInterface(path);
        if (newTab) window.open(target, '_blank', 'noopener');
        else if (replace) location.replace(target);
        else location.assign(target);
        return true;
    }

    function replaceState(route) {
        const path = destination(route);
        if (path) history.replaceState(history.state, '', withInterface(path));
    }

    function canonicalize() {
        if (!location.hash.startsWith('#/')) return false;
        const path = destination(location.hash);
        if (!path) return false;
        const target = new URL(withInterface(path), location.href);
        for (const [key,value] of new URL(location.href).searchParams) {
            if (!target.searchParams.has(key)) target.searchParams.append(key,value);
        }
        if (mobile && !target.searchParams.has('view')) target.searchParams.set('view','mobile');
        location.replace(target.pathname+target.search);
        return true;
    }

    function rewriteLink(link) {
        const old = link.getAttribute('href');
        const path = url(old);
        if (!path) return;
        link.dataset.pageRoute = old;
        link.href = withInterface(path);
        const inFlow = link.closest('dialog, #modal, #sheetHost') || link.matches('.topbar__back, [data-same-tab]') || /^返回/.test(link.textContent.trim());
        if (!inFlow && !link.hasAttribute('target')) link.target = '_blank';
        if (link.target === '_blank') link.relList.add('noopener');
    }

    function watchLinks() {
        function visit(node) {
            if (node.nodeType !== Node.ELEMENT_NODE) return;
            if (node.matches('a[href^="#/"]')) rewriteLink(node);
            node.querySelectorAll('a[href^="#/"]').forEach(rewriteLink);
        }
        visit(document.body);
        new MutationObserver(records => {
            for (const entry of records) {
                if (entry.type === 'attributes') {
                    if (entry.target.matches('a[href^="#/"]')) rewriteLink(entry.target);
                } else entry.addedNodes.forEach(visit);
            }
        }).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['href']});
    }

    function title() {
        const parts = location.pathname.split('/').filter(Boolean);
        const special = {'city-wheel':'城市转盘', arcade:'街机', settings:'账户设置',
            conversations:'私聊', 'exchange-relays':'换物接力', favorites:'我的收藏',
            history:'浏览足迹', followers:'关注我的', following:'我的关注',
            listings:'我发布的闲置', 'sold-items':'我卖出的闲置', reviews:'评价',
            'lost-and-found':'失物招领', 'qr-confirm':'扫码登录确认'};
        const section = parts.at(-1);
        const label = Object.hasOwn(special,section) ? special[section] : (labels[parts[0] || ''] || '校园服务');
        document.title = label + ' | 换一圈';
    }

    window.siteRoutes = { url, current, go, replace: route => go(route,{replace:true}), replaceState, canonicalize, watchLinks, title };
})();
