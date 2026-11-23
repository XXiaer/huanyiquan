function reportSheet(targetId, type) {    openSheet('举报', `<div class="pe-chips" id="reportReasons">${['虚假信息', '违禁物品', '骚扰辱骂', '交易纠纷', '其他']
    .map((r) => `<span class="chip" data-v="${r}">${r}</span>`).join('')}</div>
      <textarea class="field field--area" id="reportText" style="margin-top:14px" placeholder="补充说明（选填）"></textarea>
      <button class="btn btn--block" style="margin-top:16px" id="reportGo">提交举报</button>`, {
    onMount(sheet, close) {
      let picked = '';
      sheet.querySelectorAll('#reportReasons .chip').forEach((c) => c.addEventListener('click', () => {
        sheet.querySelectorAll('#reportReasons .chip').forEach((x) => x.classList.remove('on'));
        c.classList.add('on'); picked = c.dataset.v;
      }));
      sheet.querySelector('#reportGo').addEventListener('click', async () => {
        if (!picked) { toast('选一个举报原因'); return; }
        const text = sheet.querySelector('#reportText').value.trim();
        try {
          await api.post('/api/report', { targetType: type === 'user' ? 2 : 1, targetId, reason: picked + (text ? '：' + text : '') });
          close(); toast('举报已提交，管理员会尽快处理');
        } catch (e) { toast(e.message); }
      });
    },
  });
}

window.reportSheet = reportSheet;

export { reportSheet };
