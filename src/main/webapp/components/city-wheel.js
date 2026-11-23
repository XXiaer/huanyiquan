(() => {
    'use strict';

    const duration = 3250;
    const random = new Uint32Array(1);
    let catalogRequest;
    let dialog;
    let opener;
    let frame;
    let session = 0;
    let angle = 0;

    function pickIndex(size) {
        // Reject the incomplete interval so each city has the same chance.
        const limit = Math.floor(0x100000000 / size) * size;
        do { crypto.getRandomValues(random); } while (random[0] >= limit);
        return random[0] % size;
    }

    function loadCatalog() {
        if (!catalogRequest) {
            catalogRequest = fetch('/assets/data/china-cities.json?v=2')
                .then(response => {
                    if (!response.ok) throw new Error('City catalog unavailable');
                    return response.json();
                })
                .then(({cities}) => {
                    if (!Array.isArray(cities) || !cities.length) throw new Error('City catalog is empty');
                    return cities;
                })
                .catch(error => {
                    catalogRequest = null;
                    throw error;
                });
        }
        return catalogRequest;
    }

    function createDialog(host) {
        const element = document.createElement('dialog');
        element.className = 'city-wheel-dialog';
        element.setAttribute('aria-labelledby', 'city-wheel-title');
        element.innerHTML = `
            <div class="city-wheel-panel">
                <header class="city-wheel-head">
                    <div><h2 id="city-wheel-title">城市转盘</h2>
                    <p data-wheel-count>正在加载城市名单…</p></div>
                    <button class="city-wheel-close" type="button" aria-label="关闭转盘" autofocus></button>
                </header>
                <div class="city-wheel-visual">
                    <canvas width="640" height="640" aria-hidden="true"></canvas>
                    <span class="city-wheel-pointer" aria-hidden="true"></span>
                    <div class="city-wheel-face" aria-hidden="true">
                        <span data-wheel-region>全国城市</span>
                        <strong data-wheel-city>下一站？</strong>
                    </div>
                </div>
                <div class="city-wheel-footer">
                    <p class="city-wheel-status" role="status" aria-atomic="true"></p>
                    <button type="button" class="city-wheel-spin" disabled>转一次</button>
                </div>
            </div>`;
        element.querySelector('.city-wheel-close').addEventListener('click', () => element.close());
        element.addEventListener('click', event => {
            if (event.target === element) element.close();
        });
        element.addEventListener('close', () => {
            if (element.open) return;
            session += 1;
            cancelAnimationFrame(frame);
            if (opener?.isConnected) opener.focus({preventScroll: true});
        });
        if (host) {
            element.classList.add('city-wheel-standalone-dial');
            element.querySelector('.city-wheel-close').hidden = true;
            host.append(element);
        } else document.body.append(element);
        return element;
    }

    function paint(canvas, count) {
        const cx = canvas.width / 2;
        const ctx = canvas.getContext('2d');
        const step = 2 * Math.PI / count;
        const colors = ['#0a5c51', '#176e60', '#306d68', '#365c58', '#8e6540', '#a7794e'];
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const bands = 24;
        for (let i = 0; i < bands; i += 1) {
            const start = i * 2 * Math.PI / bands - Math.PI / 2;
            const end = start + 2 * Math.PI / bands;
            ctx.beginPath();
            ctx.arc(cx, cx, cx - 2, start, end);
            ctx.arc(cx, cx, cx * .67, end, start, true);
            ctx.closePath();
            ctx.fillStyle = colors[i % colors.length];
            ctx.fill();
        }
        ctx.beginPath();
        ctx.lineWidth = .9;
        ctx.strokeStyle = 'rgba(255,250,231,.35)';
        for (let i = 0; i < count; i += 1) {
            const bearing = i * step - Math.PI / 2;
            const x = Math.cos(bearing);
            const y = Math.sin(bearing);
            ctx.moveTo(cx + x * (cx - 21), cx + y * (cx - 21));
            ctx.lineTo(cx + x * (cx - 5), cx + y * (cx - 5));
        }
        ctx.stroke();
    }

    async function open(button, host) {
        if (!dialog) dialog = createDialog(host);
        if (dialog.open) return;
        opener = button;
        const ticket = ++session;
        const canvas = dialog.querySelector('canvas');
        const count = dialog.querySelector('[data-wheel-count]');
        const region = dialog.querySelector('[data-wheel-region]');
        const city = dialog.querySelector('[data-wheel-city]');
        const status = dialog.querySelector('.city-wheel-status');
        const spin = dialog.querySelector('.city-wheel-spin');
        if (host) dialog.show();
        else dialog.showModal();
        count.textContent = '正在加载城市名单…';
        region.textContent = '全国城市';
        city.textContent = '下一站？';
        status.textContent = '';
        spin.textContent = '转一次';
        spin.disabled = true;

        let cities;
        try {
            cities = await loadCatalog();
        } catch {
            if (ticket !== session || !dialog.open) return;
            count.textContent = '城市名单加载失败';
            status.textContent = '城市名单加载失败，请重新加载。';
            spin.textContent = '重新加载';
            spin.disabled = false;
            spin.onclick = () => {
                const trigger = opener;
                dialog.close();
                open(trigger, host);
            };
            return;
        }
        if (ticket !== session || !dialog.open) return;

        count.textContent = `${cities.length} 个抽选选项`;
        paint(canvas, cities.length);
        spin.disabled = false;
        spin.onclick = () => {
            spin.disabled = true;
            spin.textContent = '转动中…';
            status.textContent = '';
            const winner = pickIndex(cities.length);
            const step = 360 / cities.length;
            const start = angle;
            const stop = (360 - (winner + .5) * step + 360) % 360;
            const travel = 360 * 5 + (stop - start % 360 + 360) % 360;
            const show = index => {
                const [name, province] = cities[index];
                region.textContent = province;
                city.textContent = name;
            };
            const finish = () => {
                angle = stop;
                canvas.style.transform = `rotate(${angle}deg)`;
                show(winner);
                status.textContent = `抽中：${city.textContent}（${region.textContent}）`;
                spin.textContent = '再转一次';
                spin.disabled = false;
                if (document.activeElement === dialog || document.activeElement === document.body) {
                    spin.focus({preventScroll: true});
                }
            };
            if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
                finish();
                return;
            }
            const startTime = performance.now();
            let lastLabel = -Infinity;
            const tick = now => {
                if (!dialog.open || ticket !== session) return;
                const progress = Math.max(0, Math.min(1, (now - startTime) / duration));
                if (progress === 1) {
                    finish();
                    return;
                }
                angle = start + travel * (1 - (1 - progress) ** 4);
                canvas.style.transform = `rotate(${angle}deg)`;
                if (now - lastLabel >= 65) {
                    show(Math.floor((360 - angle % 360) % 360 / step));
                    lastLabel = now;
                }
                frame = requestAnimationFrame(tick);
            };
            frame = requestAnimationFrame(tick);
        };
    }

    window.renderCityWheelPage = host => {
        host.classList.add('city-wheel-standalone');
        host.innerHTML = '<a href="#/community" data-same-tab class="city-wheel-back">返回校园社区</a>';
        open(host.querySelector('a'), host);
    };

    document.addEventListener('click', event => {
        const button = event.target.closest('[data-city-wheel]');
        if (button) open(button);
    });
    window.addEventListener('hashchange', () => {
        if (dialog?.open) dialog.close();
    });
})();
