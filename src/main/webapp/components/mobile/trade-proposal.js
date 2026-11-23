window.openTradeProposal = function ({title, receive, items, sendLabel, note, onSend}) {
  const photo = item => esc(window.catalogThumbnail(api.firstPic(item)));
  openSheet(title, `
      <form class="proposal-form">
        <p><b>我想收到</b></p>
        <div class="proposal-item"><img src="${photo(receive)}" alt="" width="48" height="48"><span>${esc(receive.title)}</span></div>
        <fieldset><legend>我愿意给</legend>
          ${items.map(item => `<label class="proposal-item">
            <input type="radio" name="offered" value="${Number(item.id)}" required>
            <img src="${photo(item)}" alt="" width="48" height="48">
            <span>${esc(item.title)}</span>
          </label>`).join('')}
        </fieldset>
        ${note ? '<label>留言（选填）<textarea name="message" maxlength="50" rows="2" placeholder="补充成色、面交时间或交换意向"></textarea></label>' : ''}
        <p class="proposal-status" role="status">请选择一件物品，再确认发送。</p>
        <button class="btn btn--block" type="submit" disabled>${esc(sendLabel)}</button>
      </form>`, {onMount(sheet, close) {
      const form = sheet.querySelector('.proposal-form');
      const submit = form.querySelector('[type="submit"]');
      const status = form.querySelector('.proposal-status');
      let sending = false;
      form.addEventListener('change', () => {
        const item = items.find(row => Number(row.id) === Number(form.elements.offered.value));
        if (!item) return;
        status.textContent = '用「' + item.title + '」换「' + receive.title + '」';
        submit.disabled = sending;
      });
      form.addEventListener('submit', async event => {
        event.preventDefault();
        if (sending || submit.disabled) return;
        const data = new FormData(form);
        sending = true;
        submit.disabled = true;
        try {
          await onSend(Number(data.get('offered')), String(data.get('message') || '').trim());
          close();
        } catch (error) {
          status.textContent = error.message;
          sending = false;
          submit.disabled = false;
        }
      });
    }});
};

window.openCashProposal = function ({title, description, initial, fixed = false, note = false, onSend}) {
  openSheet(title, `<form class="proposal-form">
      <p>${esc(description || '校园面交')}，当面验货后现场结算。</p>
      <label>面交金额（元）<input name="amount" type="number" min="0.01" max="100000" step="0.01"
        value="${api.yuan(initial)}" ${fixed ? 'readonly' : 'required'}></label>
      ${note ? '<label>留言（选填）<textarea name="message" maxlength="50" rows="2" placeholder="例如 我晚上在图书馆"></textarea></label>' : ''}
      <p class="proposal-status" role="status"></p>
      <button class="btn btn--block" type="submit">${fixed ? '发送面交邀请' : '发送出价'}</button>
    </form>`, {onMount(sheet, close) {
    const form = sheet.querySelector('form');
    const submit = form.querySelector('[type=submit]');
    form.onsubmit = async event => {
      event.preventDefault();
      if (submit.disabled) return;
      const amountCents = Math.round(Number(form.elements.amount.value) * 100);
      if (!Number.isSafeInteger(amountCents) || amountCents <= 0) return;
      submit.disabled = true;
      try {
        await onSend(amountCents, (form.elements.message?.value || '').trim());
        close();
      } catch (error) {
        form.querySelector('[role=status]').textContent = error.message;
        submit.disabled = false;
      }
    };
  }});
};
