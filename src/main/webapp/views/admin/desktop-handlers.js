import { closeSheet, openSheet } from "../../components/desktop/sheet.js";
import { toast } from "../../components/desktop/toast.js";
import { render } from "../../router/desktop/navigation.js";
import { state } from "../../router/desktop/state.js";
import { api } from "../../utils/desktop/api.js";
import { $, esc, withBusy } from "../../utils/desktop/dom.js";
import { renderAdmin } from "./desktop.js";

const adminActions = {
    "dispute-review": async ({ element: el }) => {
        var disputeId = Number(el.dataset.id);
        var exchange = await api('/admin/exchange-disputes/' + disputeId, {noCache:true});
        var meeting = exchange.confirmedArrangement;
        var handoffs = (exchange.details || []).map(function (person) {
            return '<li>' + esc(person.nickname || '参与者') + ' | 给出 ' + esc(person.giveTitle || '物品')
                + ' | ' + (person.delivered ? '已确认收货' : '未确认收货') + '</li>';
        }).join('');
        openSheet('<h3>交换单 #' + disputeId + '</h3>'
            + '<p>已确认面交安排：' + (meeting ? esc([meeting.place,meeting.startTime,meeting.note].filter(Boolean).join(' | ')) : '暂无') + '</p>'
            + '<ul>' + handoffs + '</ul>' + window.exchangeDisputeTimeline(exchange, esc)
            + (exchange.status !== 6 ? '' :
            '<label for="dispute-resolution-note">裁决理由（交易参与者可见）</label><textarea id="dispute-resolution-note" class="textarea" maxlength="1000"></textarea>'
            + '<button class="btn" data-act="dispute-resolve" data-id="' + disputeId + '" data-outcome="cancel">取消交易并解锁</button>'
            + '<button class="btn" data-act="dispute-resolve" data-id="' + disputeId + '" data-outcome="complete">确认交换完成</button>'));
        return;
    },
    "dispute-resolve": async ({ element: el }) => {
        if (el.dataset.outcome === 'cancel' && !confirm('请确认双方已归还已交付物品，再取消交易并重新上架。')) return;
        var note = $('#dispute-resolution-note').value.trim();
        if (!note) { toast('请填写裁决理由', 'err'); return; }
        await withBusy(el, async function () {
            await api('/admin/exchange-disputes/' + Number(el.dataset.id), {
                method:'POST', body:{outcome:el.dataset.outcome, note:note}
            });
            closeSheet();
            await renderAdmin();
        });
        return;
    },
    "review-listing": async ({ element: el }) => { await withBusy(el, async function(){ await api('/admin/'+el.dataset.kind+'/'+el.dataset.id+'/'+el.dataset.do,{method:'POST'}); toast(el.dataset.do==='approve'?'审核通过':'已驳回'); await renderAdmin(); }); return; },
    "admin-refresh": async ({ element: el, action: act }) => {
        if (act === 'admin-report-status') state.adminReportStatus = Number(el.dataset.v);
        await withBusy(el, renderAdmin);
        return;
    },
    "admin-user-status": async ({ element: el }) => {
        var action = el.dataset.do;
        if (!confirm(action === 'suspend' ? '确认停用该账号？该用户将无法登录。' : '确认恢复该账号？')) return;
        await withBusy(el, async function () {
            await api('/admin/users/'+el.dataset.id+'/'+action, {method:'POST'});
            toast(action === 'suspend' ? '账号已停用' : '账号已恢复', 'ok');
            await renderAdmin();
        });
        return;
    },
    "report-act": async ({ element: el }) => {
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
    },
    "seed-demo": async ({ element: el, action: act }) => {
        var demoPath = act === 'reset-demo' ? '/admin/demo/reset' : '/admin/demo';
        if (act === 'reset-demo' && prompt('此操作会清空物品、交换单、评价与举报。输入「重置」确认。') !== '重置') return;
        await withBusy(el, async function () {
            await api(demoPath, {method: 'POST'});
            toast('演示数据已重置，去集市看看', 'ok');
            state.home.category = '';
            state.home.keyword = '';
            await render();
        });
        return;
    },
};
adminActions["admin-report-status"] = adminActions["admin-refresh"];
adminActions["reset-demo"] = adminActions["seed-demo"];

const adminForms = {
    "admin-user-search": async ({ data: fd }) => {
        state.adminUserQuery = (fd.get('q') || '').trim();
        await renderAdmin();
    },
};

export { adminActions, adminForms };
