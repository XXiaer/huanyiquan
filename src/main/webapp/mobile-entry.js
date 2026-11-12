(() => {
  const preference = new URLSearchParams(location.search).get('view');
  if (preference === 'desktop') return;

  const narrow = matchMedia('(max-width: 767px)');
  const openMobile = () => {
    if (preference === 'mobile' || narrow.matches) {
      const hash = !location.hash || location.hash === '#/market' ? '#/home' : location.hash;
      location.replace('/mobile/index.html' + hash);
    }
  };
  narrow.addEventListener('change', openMobile);
  openMobile();
})();
