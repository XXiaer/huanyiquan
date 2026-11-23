import { closeSheet, openSheet } from "../../components/desktop/sheet.js";
import { toast } from "../../components/desktop/toast.js";
import { go, parseRoute } from "../../router/desktop/navigation.js";
import { desktopRuntime, state } from "../../router/desktop/state.js";
import { api } from "../../utils/desktop/api.js";
import { $, withBusy } from "../../utils/desktop/dom.js";
import { patchImRightPanel, renderNotifications, setImMenu } from "./desktop.js";
import { refreshNoticeCount } from "./notices-desktop.js";

const messagesActions = {
    "im-more": async ({ element: el }) => {
        var moreRow = el.closest('.tb-conv-entry');
        setImMenu(moreRow, !moreRow.classList.contains('is-open'));
        return;
    },
    "im-pin": async ({ element: el, action: act }) => {
        var actionRow = el.closest('.tb-conv-entry');
        var id = Number(actionRow ? actionRow.dataset.conv : el.dataset.id);
        if (act === 'im-delete') {
            openSheet('<h3>删除会话</h3><p class="sub">删除后会话会从你的列表消失，对方仍保留聊天记录。</p>'
                + '<button type="button" class="btn btn-primary" data-act="im-delete-confirm" data-id="' + id + '">删除</button>');
            return;
        }
        await withBusy(el, async function () {
            var path = '/conversation/' + id;
            var removedActive = false;
            if (act === 'im-delete-confirm') {
                await api(path, {method:'DELETE'});
                closeSheet();
                var deletedRow = $('.tb-conv-entry[data-conv="' + id + '"]');
                if (deletedRow) deletedRow.remove();
                removedActive = state.activeImKey === 'real:' + id;
                if (removedActive) state.activeImKey = 'notices';
                if (siteRoutes.current() === '#/chat/' + id) {
                    siteRoutes.replaceState('#/notifications');
                    desktopRuntime.currentView = parseRoute();
                }
                toast('已删除会话', 'ok');
            } else if (act === 'im-pin') {
                var pinned = actionRow.dataset.pinned !== 'true';
                await api(path + '/pin', {method:'POST', body:{pinned:pinned}});
                toast(pinned ? '已置顶' : '已取消置顶', 'ok');
            } else {
                await api(path + '/read', {method:'POST'});
                toast('已标为已读', 'ok');
            }
            if (['notifications', 'chat', 'chats'].includes(desktopRuntime.currentView.name)) {
                await renderNotifications(null, !removedActive);
                if (act !== 'im-pin') refreshNoticeCount();
            }
        });
        return;
    },
    "im-select": async ({ event: ev, element: el }) => {
        var clickedRow = el.closest('.tb-conv-entry');
        if (ev.detail && desktopRuntime.imDraggedRow && desktopRuntime.imDraggedRow === clickedRow) {
            desktopRuntime.imDraggedRow = null;
            return;
        }
        if (clickedRow && clickedRow.classList.contains('is-open')) {
            setImMenu(null, false);
            return;
        }
        setImMenu(null, false);
        var nextKey = el.dataset.key || 'notices';
        state.activeImKey = nextKey;
        await patchImRightPanel(nextKey, { scrollBottom: false });
        return;
    },
    "im-phrase-menu": async () => {
        var phraseBar = $('#tb-phrase-bar');
        if (phraseBar) phraseBar.hidden = !phraseBar.hidden;
        return;
    },
    "im-phrase-pick": async ({ element: el }) => {
        var imIn = $('#tb-im-input');
        var pBar = $('#tb-phrase-bar');
        if (imIn) {
            imIn.value = el.dataset.v || '';
            var cEl = $('#tb-char-count');
            if (cEl) cEl.textContent = imIn.value.length + ' / 500';
            imIn.focus();
        }
        if (pBar) pBar.hidden = true;
        return;
    },
    "im-insert-ai": async () => {
        var aiIn = $('#tb-im-input');
        if (aiIn) {
            var tip = '【小唤AI估价建议】该类好物近期成交区间约 ¥120-165，支持等价互换或小额补差面交。';
            aiIn.value = aiIn.value ? (aiIn.value + ' ' + tip) : tip;
            var cntEl = $('#tb-char-count');
            if (cntEl) cntEl.textContent = aiIn.value.length + ' / 500';
            aiIn.focus();
        }
        return;
    },
    "im-insert-card": async ({ element: el, action: act }) => {
        var curKey = state.activeImKey || 'notices';
        if (!curKey.startsWith('real:')) { toast('请先在左侧选择要私聊的同学', 'err'); return; }
        var boxIn = $('#tb-im-input');
        var txt = act === 'im-insert-card'
            ? '【校园换物意向】我有意交换这件宝贝，方便约在校内公共地点（北山斋/图书馆大厅）当面验货交接吗？'
            : (boxIn && boxIn.value || '').trim();
        if (!txt) { toast('请输入要发送的消息内容', 'err'); return; }

        if (curKey.indexOf('real:') === 0) {
            var convId = Number(curKey.slice(5));
            await withBusy(el, async function () {
                await api('/conversation/' + convId, { method: 'POST', body: { kind: 'text', content: txt } });
                if (boxIn && act === 'im-send') {
                    boxIn.value = '';
                    var cCount = $('#tb-char-count');
                    if (cCount) cCount.textContent = '0 / 500';
                }
                await patchImRightPanel(curKey, { scrollBottom: true, previewText: txt });
            });
            return;
        }

        return;
    },
    "im-scroll-bottom": async () => {
        var stEl = document.querySelector('.tb-chat-stream');
        if (stEl) stEl.scrollTo({ top: stEl.scrollHeight, behavior: 'smooth' });
        return;
    },
    "chat-start": async ({ element: el }) => { await withBusy(el,async function(){var t=await api('/conversation/start',{method:'POST',body:{itemId:Number(el.dataset.id)}});go('#/chat/'+t.id);});return; },
    "notice-open": async ({ event: ev, element: el }) => { ev.preventDefault(); await withBusy(el,async function(){await api('/notification/'+el.dataset.id+'/read',{method:'POST'});await refreshNoticeCount();go(el.dataset.to);});return; },
    "notice-read": async ({ element: el }) => { await withBusy(el,async function(){await api('/notification/read',{method:'POST'});await renderNotifications();toast('已全部标为已读');});return; },
};
messagesActions["im-read"] = messagesActions["im-pin"];
messagesActions["im-delete"] = messagesActions["im-pin"];
messagesActions["im-delete-confirm"] = messagesActions["im-pin"];
messagesActions["im-send"] = messagesActions["im-insert-card"];

export { messagesActions };
