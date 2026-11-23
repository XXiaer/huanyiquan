(() => {
    const target = new URL(location.href);
    if (target.searchParams.get('view') === 'desktop') return;
    if (/^\/(?:auctions\/(?:create|mine)|listings\/published\/\d+|account\/(?:email|auctions|campus-auctions|wishes|channels|appraise|vouchers|quota|credit|relay|arcade|security|notices))\/?$/.test(target.pathname)) return;

    const narrow = matchMedia('(max-width: 767px)');
    function routeToMobile() {
        const mobileDevice = navigator.userAgentData?.mobile === true
            || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
            || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        if (target.searchParams.get('view') !== 'mobile' && !mobileDevice && !narrow.matches) return;
        if (target.pathname === '/index.html' || target.hash.startsWith('#/')) {
            const path = siteRoutes.url(target.hash) || '/';
            const next = new URL(path, target);
            next.searchParams.set('view', 'mobile');
            location.replace(next.href);
        } else if (target.searchParams.get('view') !== 'mobile') {
            target.searchParams.set('view','mobile');
            location.replace(target.href);
        }
    }
    narrow.addEventListener('change', routeToMobile);
    routeToMobile();
})();
