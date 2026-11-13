(() => {
  const target = new URL(location.href);
  const preference = target.searchParams.get('view');
  if (preference === 'desktop') return;

  const mobileDevice = navigator.userAgentData?.mobile === true
    || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const touchViewport = matchMedia('(max-width: 767px) and (pointer: coarse)').matches;
  if (preference !== 'mobile' && !mobileDevice && !touchViewport) return;

  target.pathname = '/mobile/index.html';
  if (!target.hash || target.hash === '#/market') target.hash = '#/home';
  location.replace(target.href);
})();
