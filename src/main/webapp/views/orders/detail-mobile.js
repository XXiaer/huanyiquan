import { topbar as renderTopbar } from "../../components/mobile/topbar.js";

const PAGES = window.PAGES;

function topbar(title, options) {
  return renderTopbar(title, { ...options, parent: options?.parent || "#/me" });
}

PAGES.exchangeDetail = {
  noTab: true,
  async render(view, params) {
    const me = window.__me || await api.get('/api/user/me').catch(() => null);
    let e;
    try { e = await api.get('/api/exchange/' + params.id); }
    catch (err) { view.innerHTML = mascotEmpty(esc(err.message), 'assets/brand/mascot-wave-320.webp'); return; }
    const summary = window.exchangeSummary(e);
    const { mine, people, recipient, sender } = summary;
    const closed = e.status === 4 || e.status === 5;
    const cash = e.type === 4;
    const deadline = e.confirmExpiresAt ? new Date(e.confirmExpiresAt) : null;
    const expires = deadline && !Number.isNaN(deadline.getTime())
      ? new Intl.DateTimeFormat('zh-CN',{month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(deadline) : '';
    const reviewTargets = people.filter((person) => !summary.isMe(person) && (!me || person.userId !== me.id));
    const steps = ['待确认', '待交付', '已完成'];
    const confArr = e.confirmedArrangement || null;
    const pendArr = e.pendingArrangement || null;
    const meetPlace = confArr?.place || pendArr?.place || e.place || '待约定';
    const shownArr = confArr || pendArr;
    const meetTime = shownArr ? [shownArr.startTime, shownArr.endTime].filter(Boolean).join(' - ') : (e.dealTime || '待约定');
    const meetHint = confArr ? '已约好'
      : pendArr ? `${pendArr.confirmedByMe ? '已提议，等对方确认' : '已有提议，待你确认'} | ${pendArr.confirmedCount}/${pendArr.needCount} 已确认`
      : e.status === 3 ? '自行约定面交' : '待约面交';

    view.innerHTML = `
        ${topbar('交换单 #' + e.id, { parent: '#/me/exchange', right: '<button class="btn btn--ghost btn--sm" data-refresh-exchange>刷新</button>' })}
        <main class="exchange-mobile">
          <header class="exchange-mobile__status">
            <p class="exchange-mobile__type">${e.type === 3 ? '三方成环' : cash ? '校园面交' : '一对一交换'}</p>
            <h1>${esc(e.statusText || '交换单')}</h1>
            <p>${esc(closed && e.closedByName ? e.closedByName + ' 已退出，本次交换已关闭。' : summary.next)}</p>
            ${expires && Number(e.status) === 1 ? `<p>确认截止 ${esc(expires)}，超时后物品会重新上架。</p>` : ''}
            ${cash ? `<p><strong>约定面交价 ¥${api.yuan(e.amountCents)}</strong> | 当面验货后现场结算</p>` : ''}
            ${e.status >= 1 && e.status <= 3 ? `<ol class="exchange-mobile__steps" aria-label="交换进度">
              ${steps.map((label, i) => i === 0 && !summary.needsConfirmation ? '' : `<li class="${e.status >= i + 1 ? 'reached' : ''}" ${e.status === i + 1 ? 'aria-current="step"' : ''}>${label}</li>`).join('')}
            </ol>` : ''}
            ${!closed ? `<p class="exchange-mobile__counts">${summary.needsConfirmation ? `已确认 ${e.confirmedCount || 0}/${e.needConfirm || people.length} | ` : ''}已交接 ${e.deliveredCount || 0}/${e.needConfirm || people.length}</p>` : ''}
          </header>

          ${mine && !cash ? `<section class="exchange-mobile__handoff" aria-label="我的物品交接">
            <div><span>我给出</span><strong>${esc(mine.giveTitle || '物品')}</strong>
              ${recipient ? `<small>交给 ${esc(recipient.nickname || '同学')}</small>` : ''}</div>
            <div><span>我收到</span><strong>${esc(mine.getTitle || '物品')}</strong>
              ${sender ? `<small>来自 ${esc(sender.nickname || '同学')}</small>` : ''}</div>
          </section>` : ''}

          ${closed ? `<section class="exchange-mobile__meet">
            <a class="btn" href="${e.type === 3 && mine?.giveItemId ? '#/cycle/' + Number(mine.giveItemId) : e.type === 3 ? '#/relay' : '#/market'}">${e.type === 3 ? '重新找环' : '返回集市'}</a>
          </section>` : `<section class="exchange-mobile__meet">
            <h2>面交安排 <small style="font-weight:600;color:#0c7263">${esc(meetHint)}</small></h2>
            <p class="exchange-next-step">${summary.canConfirm ? '先确认参与，等所有参与者同意后再交接。'
            : summary.canReceive ? '在校内公共地点核对物品，确认完成交接后再操作。'
            : e.status === 2 && mine?.delivered ? '你已确认收到，等待其他参与者确认。'
            : e.status === 3 ? '本次交换已完成。' : ''}</p>
            ${e.status !== 3 || confArr || e.place || e.dealTime ? `<dl><div><dt>${confArr ? '已定地点' : pendArr ? '提议地点' : '地点'}</dt><dd>${esc(meetPlace)}</dd></div>
              <div><dt>${confArr ? '已定时间' : pendArr ? '提议时间' : '时间'}</dt><dd>${esc(meetTime || '待约定')}</dd></div>
              ${confArr?.note ? `<div><dt>备注</dt><dd>${esc(confArr.note)}</dd></div>` : ''}</dl>` : ''}
            ${pendArr ? `<div style="margin:10px 0 12px;padding:10px 12px;border-radius:10px;background:#f0faf8;border:1px solid #cce7e0;font-size:13px;line-height:1.55">
              <b>${confArr ? '改期提议 v' : '待确认提议 v'}${Number(pendArr.version)}</b>（${esc(pendArr.proposerName || '同学')} 提出 | ${pendArr.confirmedCount}/${pendArr.needCount} 已确认）<br>
              地点：${esc(pendArr.place)}${pendArr.startTime ? ` ｜ 时间：${esc([pendArr.startTime, pendArr.endTime].filter(Boolean).join(' - '))}` : ''}
              ${pendArr.note ? `<br><span style="color:#475569">备注：${esc(pendArr.note)}</span>` : ''}
            </div>` : ''}
            <div class="exchange-mobile__actions">
              ${summary.canConfirm ? '<button class="btn" id="exConfirm">确认参与</button>' : ''}
              ${summary.canReceive ? `<button class="btn btn--ghost" id="exDone">${esc(summary.receiptLabel || '确认收货')}</button>` : ''}
              ${e.status === 3 && reviewTargets.length ? '<button class="btn" id="exReview">去评价</button>' : ''}
              ${(e.status === 3 || e.status === 4) ? '<a class="btn btn--ghost" href="#/home">返回主页面</a>' : ''}
              ${summary.active && pendArr && !pendArr.confirmedByMe ? `<button class="btn" id="exArrConfirm" data-ver="${Number(pendArr.version)}">同意安排</button>` : ''}
              ${summary.active ? `<button class="btn btn--ghost" id="exPlace">${pendArr || confArr ? '改个时间或地点' : '提议时间和地点'}</button><button class="exchange-mobile__cancel" id="exCancel">取消交换</button>` : ''}
            </div>
          </section>`}

          <section class="exchange-mobile__people">
            ${window.exchangeDisputeTimeline(e, esc)}
            ${summary.active || e.status === 6 ? `<button class="btn btn--ghost" id="exDispute">${e.status === 6 ? '补充情况' : '提交面交争议'}</button>` : ''}
            <h2>参与者</h2>
            ${people.map((d) => {
            const to = summary.recipientFor(d);
            return `
              <div class="ex-person">
                ${avatar({ nickname: d.nickname || '同学', id: d.userId, avatar: d.avatar }, 36)}
                <div class="main">
                  <b>${esc(d.nickname || '同学')}${summary.isMe(d) ? '（我）' : ''}</b>
                  <p>${cash ? (Number(d.userId) === Number(e.cashBuyerId) ? '买家' : '出售方') : `给出 ${esc(d.giveTitle || '物品')}${to ? ' 给 ' + esc(summary.isMe(to) ? '我' : to.nickname || '同学') : ''} | 收到 ${esc(d.getTitle || '物品')}`}</p>
                  ${!closed ? `<div class="flags">
                    ${summary.needsConfirmation ? `<span class="badge ${d.confirmed ? 'badge--green' : 'badge--gray'}">${d.confirmed ? '已确认参与' : '待确认参与'}</span>` : ''}
                    <span class="badge ${d.delivered ? 'badge--green' : 'badge--gray'}">${d.delivered ? '已确认收货' : '待确认收货'}</span>
                  </div>` : ''}
                </div>
              </div>`;
          }).join('')}
            ${e.type === 3 && !closed ? `<a class="btn btn--ghost" href="#/ring/${e.id}">进入三方协商房间</a>` : ''}
          </section>
        </main>`;

    const route = location.hash;
    const refresh = () => location.hash === route && PAGES.exchangeDetail.render(view, params);
    const disputeBtn = document.getElementById('exDispute');
    if (disputeBtn) disputeBtn.addEventListener('click', () => {
      openSheet('说明面交情况', `
          <p>${e.status === 6 ? '补充说明会显示在交换单。' : '提交后，交易将暂停并交由管理员处理。'}</p>
          <label for="exDisputeText">情况说明</label>
          <textarea id="exDisputeText" class="pe-desc-in" maxlength="1000"></textarea>
          <button class="btn btn--block" id="exDisputeSubmit">提交说明</button>`, {
        onMount(sheet, close) {
          const submit = sheet.querySelector('#exDisputeSubmit');
          submit.addEventListener('click', async () => {
            const statement = sheet.querySelector('#exDisputeText').value.trim();
            if (!statement) { toast('请填写情况说明'); return; }
            submit.disabled = true;
            try {
              await api.post('/api/exchange/' + e.id + '/dispute', { statement });
              close();
              toast('说明已提交');
              await refresh();
            } catch (err) { toast(err.message); }
            finally { submit.disabled = false; }
          });
        },
      });
    });
    const confirmBtn = document.getElementById('exConfirm');
    if (confirmBtn) confirmBtn.addEventListener('click', async () => {
      confirmBtn.disabled = true;
      try {
        await api.post('/api/exchange/' + e.id + '/confirm', {});
        toast('已确认参与');
        await refresh();
      } catch (err) { toast(err.message); }
      finally { confirmBtn.disabled = false; }
    });
    const doneBtn = document.getElementById('exDone');
    if (doneBtn) doneBtn.addEventListener('click', () => {
      const label = summary.receiptLabel || '确认收货';
      const check = cash && !summary.cashBuyer ? '请确认已在现场收到约定款项。' : '请先验货，并确认已在现场收到商品。';
      confirmSheet(label, check + '提交后不可撤回，双方确认后这笔交易完成。', label, async () => {
        doneBtn.disabled = true;
        try {
          await api.post('/api/exchange/' + e.id + '/done', {});
          toast('已确认收货');
          await refresh();
        } catch (err) { toast(err.message); }
        finally { doneBtn.disabled = false; }
      });
    });
    const reviewBtn = document.getElementById('exReview');
    if (reviewBtn) reviewBtn.addEventListener('click', () => {
      const review = async (target) => {
        try {
          await window.ensureMobilePage('profile');
          window.openReviewUser({ id: target.userId, nickname: target.nickname || '同学', avatar: target.avatar }, e.id);
        } catch (error) { toast(error.message); }
      };
      if (reviewTargets.length === 1) { review(reviewTargets[0]); return; }
      openSheet('选择评价对象', reviewTargets.map((target, i) =>
        `<button class="btn btn--block btn--ghost" data-review-target="${i}">${esc(target.nickname || '同学')}</button>`
      ).join(''), {
        onMount(sheet, close) {
          sheet.querySelectorAll('[data-review-target]').forEach((button) => button.addEventListener('click', () => {
            close();
            review(reviewTargets[Number(button.dataset.reviewTarget)]);
          }));
        },
      });
    });
    const cancelBtn = document.getElementById('exCancel');
    if (cancelBtn) cancelBtn.addEventListener('click', () => {
      openSheet('是否取消这笔交换？', '<p>确认后物品会重新上架，其他参与者会收到通知。</p>'
        + '<div class="exchange-mobile__actions"><button type="button" class="btn" data-continue>继续交换</button>'
        + '<button type="button" class="btn btn--ghost exchange-danger" data-cancel>确认取消这笔交换</button></div>', {
        closeText:'继续交换',
        onMount(sheet, close) {
          sheet.querySelector('[data-continue]').onclick = close;
          sheet.querySelector('[data-cancel]').onclick = async event => {
            const button = event.currentTarget;
            button.disabled = true;
            try {
              await api.post('/api/exchange/' + e.id + '/cancel', {reason:'参与者主动取消'});
              close(); toast('交换已取消'); await refresh();
            } catch (err) { toast(err.message); }
            finally { button.disabled = false; }
          };
        }
      });
    });
    const arrConfirmBtn = document.getElementById('exArrConfirm');
    if (arrConfirmBtn) arrConfirmBtn.addEventListener('click', async () => {
      arrConfirmBtn.disabled = true;
      try {
        await api.post('/api/exchange/' + e.id + '/arrangements/' + Number(arrConfirmBtn.dataset.ver) + '/confirm', {});
        toast('已同意面交安排');
        await refresh();
      } catch (err) { toast(err.message); await refresh(); }
      finally { arrConfirmBtn.disabled = false; }
    });

    document.getElementById('exPlace')?.addEventListener('click', () => {
      openSheet('提议时间和地点', `
          <div class="label">校内公共点位</div>
          <div class="pe-chips" id="exPlaces">${['图书馆门口', '缤果大街', '紫荆 3 号楼', '紫荆 5 号楼', '体育馆'].map((p, i) => `<span class="chip${i === 0 ? ' on' : ''}" data-v="${p}">${p}</span>`).join('')}</div>
          <div class="label" style="margin-top:16px">时间</div>
          <input type="datetime-local" id="exTimes" aria-label="面交日期和时间">
          <div class="label" style="margin-top:16px">备注（选填）</div>
          <input id="exArrNote" style="width:100%;height:40px;padding:0 12px;border:1px solid var(--line);border-radius:10px;box-sizing:border-box" maxlength="100" placeholder="例如 在北门台阶旁见">
          <button class="btn btn--block" style="margin-top:18px" id="exPlaceGo">提交并通知对方确认</button>`, {
        onMount(sheet, close) {
          ['exPlaces'].forEach((id) => sheet.querySelectorAll('#' + id + ' .chip').forEach((c) => c.addEventListener('click', () => {
            sheet.querySelectorAll('#' + id + ' .chip').forEach((x) => x.classList.remove('on')); c.classList.add('on');
          })));
          const submit = sheet.querySelector('#exPlaceGo');
          submit.addEventListener('click', async () => {
            const place = sheet.querySelector('#exPlaces .chip.on').dataset.v;
            const selected = sheet.querySelector('#exTimes').value;
            if (!selected) { toast('请选择面交日期和时间'); return; }
            const startTime = selected.replace('T', ' ') + ' ' + new Date(selected).toLocaleDateString('zh-CN', {weekday:'short'});
            const note = (sheet.querySelector('#exArrNote')?.value || '').trim();
            submit.disabled = true;
            submit.textContent = '提交中…';
            try {
              await api.post('/api/exchange/' + e.id + '/arrangements', { place, startTime, note });
              close();
              toast('已提交提议，等待对方确认');
              refresh();
            } catch (err) { toast(err.message); }
            finally { submit.disabled = false; submit.textContent = '提交并通知对方确认'; }
          });
        },
      });
    });
    view.querySelector('[data-refresh-exchange]')?.addEventListener('click', async event => {
      const button = event.currentTarget;
      button.disabled = true;
      try { await refresh(); } finally { button.disabled = false; }
    });
  },
};
