(() => {
  const target = new URL(location.href);
  const preference = target.searchParams.get('view');
  if (preference === 'desktop') return;

  const narrow = matchMedia('(max-width: 767px)');
  function routeToMobile() {
    const mobileDevice = navigator.userAgentData?.mobile === true
      || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
      || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (preference !== 'mobile' && !mobileDevice && !narrow.matches) return;

    const mobile = new URL(location.href);
    mobile.pathname = '/mobile/index.html';
    if (!mobile.hash || ['#/market', '#/'].includes(mobile.hash)) mobile.hash = '#/home';
    if (mobile.hash === '#/auctions' || mobile.hash === '#/idle?tab=auctions') mobile.hash = '#/auction';
    location.replace(mobile.href);
  }

  narrow.addEventListener('change', routeToMobile);
  routeToMobile();
})();
