import { CAT_ICON } from "./icons.js";
import { toast } from "./toast.js";
import { desktopRuntime, state } from "../../router/desktop/state.js";
import { api } from "../../utils/desktop/api.js";
import { $ } from "../../utils/desktop/dom.js";
import { readOrUploadLocalImage } from "../../utils/desktop/uploads.js";
import { refreshCommunity, renderCommunity } from "../../views/community/desktop.js";
import { renderHome } from "../../views/market/desktop.js";
import { renderImagePreview, savePublishDraft } from "../../views/market/publish-desktop.js";
import { patchImRightPanel } from "../../views/messages/desktop.js";
import { refreshRoom } from "../../views/messages/room-desktop.js";
import { applyTheme } from "../../views/users/desktop.js";

function bindDesktopControls() {
    document.addEventListener('input', function (ev) {
        if (ev.target.dataset.counter === 'desc') {
            var n = ev.target.value.length;
            var c = $('#desc-counter');
            if (c) {
                c.textContent = n + ' / 300';
                c.classList.toggle('warn', n > 270);
            }
        }
    });
    document.addEventListener('change', async function (ev) {
        if (ev.target.dataset.act === 'im-image') {
            var imFile = ev.target.files && ev.target.files[0];
            if (!imFile) return;
            var imgKey = state.activeImKey || 'notices';
            if (!imgKey.startsWith('real:')) { toast('请先在左侧选择私聊对象', 'err'); ev.target.value = ''; return; }
            try {
                if (imgKey.indexOf('real:') === 0) {
                    var convImgId = Number(imgKey.slice(5));
                    var imgBody = new FormData();
                    imgBody.append('file', await window.prepareUploadImage(imFile));
                    var upRes = await api('/upload', { method: 'POST', form: imgBody });
                    await api('/conversation/' + convImgId, { method: 'POST', body: { kind: 'image', image: upRes.url } });
                    await patchImRightPanel(imgKey, { scrollBottom: true, previewText: '[图片]' });
                }
            } catch (err) { toast(err.message || '图片发送失败', 'err'); }
            finally { ev.target.value = ''; }
            return;
        }
        if (ev.target.dataset.act === 'tieba-post-image') {
            var tbFile = ev.target.files && ev.target.files[0];
            if (!tbFile) return;
            try {
                var tDraft = document.querySelector('[data-form="tieba-post"] input[name="title"]')?.value || '';
                var bDraft = document.querySelector('[data-form="tieba-post"] textarea[name="body"]')?.value || '';
                state.tiebaPostImg = await readOrUploadLocalImage(tbFile);
                await renderCommunity();
                var tIn = document.querySelector('[data-form="tieba-post"] input[name="title"]');
                var bIn = document.querySelector('[data-form="tieba-post"] textarea[name="body"]');
                if (tIn && tDraft) tIn.value = tDraft;
                if (bIn && bDraft) bIn.value = bDraft;
            } catch (err) { toast(err.message || '配图加载失败', 'err'); }
            finally { ev.target.value = ''; }
            return;
        }
        if (ev.target.dataset.act === 'room-chat-image') {
            var rcFile = ev.target.files && ev.target.files[0];
            if (!rcFile) return;
            var rmKey = ev.target.dataset.room || state.commRoom || 'hall';
            try {
                var rcUrl = await readOrUploadLocalImage(rcFile);
                var cMap = {};
                try { cMap = JSON.parse(localStorage.getItem('hq.roomChats') || '{}') || {}; } catch (e) { cMap = {}; }
                if (!Array.isArray(cMap[rmKey])) cMap[rmKey] = [];
                var nowR = new Date();
                cMap[rmKey].push({
                    nick: (state.me && state.me.nickname) || '移通同学',
                    time: String(nowR.getHours()).padStart(2, '0') + ':' + String(nowR.getMinutes()).padStart(2, '0'),
                    image: rcUrl
                });
                try { localStorage.setItem('hq.roomChats', JSON.stringify(cMap)); } catch (e) {}
                await renderCommunity();
            } catch (err) { toast(err.message || '图片发送失败', 'err'); }
            finally { ev.target.value = ''; }
            return;
        }
        if (ev.target.dataset.act === 'room-image') {
            var input = ev.target, file = input.files && input.files[0], conversationId = desktopRuntime.currentView.arg;
            if (!file) return;
            input.disabled = true;
            try {
                var body = new FormData();
                body.append('file', await window.prepareUploadImage(file));
                var uploaded = await api('/upload', {method:'POST', form:body});
                if (desktopRuntime.currentView.name !== 'chat' || desktopRuntime.currentView.arg !== conversationId) return;
                await api('/conversation/' + conversationId, {method:'POST', body:{kind:'image', image:uploaded.url}});
                await refreshRoom(true);
            } catch (e) { toast(e.message || '发送失败', 'err'); }
            finally { input.disabled = false; input.value = ''; }
            return;
        }
        if (ev.target.dataset.act === 'community-image') {
            var input=ev.target, file=input.files && input.files[0]; if(!file)return;
            if(file.size>2*1024*1024){toast('图片不能超过 2MB','err');input.value='';return;}
            var body=new FormData();body.append('file',file);input.disabled=true;
            try {var uploaded=await api('/upload',{method:'POST',form:body});await api('/community',{method:'POST',body:{kind:'image',image:uploaded.url}});await refreshCommunity(true);} catch(e){toast(e.message||'发送失败','err');} finally {input.disabled=false;input.value='';}return;
        }
        if (ev.target.dataset.act === 'ai-photo') {
            var aiFile = ev.target.files && ev.target.files[0];
            var preview = document.getElementById('ai-photo-preview');
            if (aiFile && preview) {
                if (preview.dataset.previewUrl) {
                    try { URL.revokeObjectURL(preview.dataset.previewUrl); } catch (ignore) {}
                }
                var url = URL.createObjectURL(aiFile);
                preview.dataset.previewUrl = url;
                preview.innerHTML = '';
                var imgEl = document.createElement('img');
                imgEl.src = url;
                imgEl.alt = '预览';
                var spanEl = document.createElement('span');
                spanEl.textContent = '已上传';
                preview.appendChild(imgEl);
                preview.appendChild(spanEl);
            }
            return;
        }
        if (ev.target.dataset.act === 'pick-image') {
            var files = Array.prototype.slice.call(ev.target.files || []);
            for (var i = 0; i < files.length; i++) {
                if (state.publishImages.length >= 3) {
                    toast('最多 3 张', 'err');
                    break;
                }
                var f = files[i];
                try {
                    var form = new FormData();
                    form.append('file', await window.prepareUploadImage(f));
                    var r = await api('/upload', {method: 'POST', form: form});
                    state.publishImages.push(r.url);
                    renderImagePreview();
                    savePublishDraft(document.querySelector('form[data-form=publish]'));
                } catch (e) {
                    toast(e.message || '上传失败', 'err');
                }
            }
            ev.target.value = '';
        }
    });
    document.addEventListener('click', function (ev) {
        var el = ev.target.closest('[data-act="rm-image"]');
        if (!el) return;
        state.publishImages.splice(Number(el.dataset.i), 1);
        renderImagePreview();
        savePublishDraft(document.querySelector('form[data-form=publish]'));
    });
    document.addEventListener('error',function(ev){
        var img=ev.target;
        if(img.tagName!=='IMG'||!img.parentElement?.matches('.pcard .pimg'))return;
        img.outerHTML=CAT_ICON[img.parentElement.dataset.cat]||CAT_ICON['其他'];
    },true);
    document.addEventListener('input', function (ev) {
        if(ev.target.form?.dataset.form==='publish')savePublishDraft(ev.target.form);
        if(ev.target.id==='message-filter'){
            var query=ev.target.value.trim().toLowerCase();
            document.querySelectorAll('.messages-page .conversation-row').forEach(function(row){row.hidden=!row.textContent.toLowerCase().includes(query);});
        }
    });
    document.addEventListener('input', function (ev) {
        if (ev.target.id === 'theme-color') applyTheme(ev.target.value, true);
        if (ev.target.id === 'tb-im-input') {
            var cnt = $('#tb-char-count');
            if (cnt) cnt.textContent = String(ev.target.value.length) + ' / 500';
        }
        if (ev.target.id === 'amz-price-range') {
            var pv = Number(ev.target.value);
            var outEl = $('#amz-price-readout');
            if (outEl) outEl.textContent = '¥0 – ' + (pv >= 2000 ? '¥2000+' : '¥' + pv);
        }
    });
    document.addEventListener('change', function (ev) {
        if (ev.target.id === 'amz-price-range') {
            state.home.maxPrice = Number(ev.target.value);
            renderHome();
        }
    });
    document.addEventListener('keydown', function (ev) {
        if (ev.target && ev.target.id === 'tb-im-input' && ev.key === 'Enter' && !ev.shiftKey) {
            ev.preventDefault();
            document.querySelector('[data-act="im-send"]')?.click();
        }
    });
}

export { bindDesktopControls };
