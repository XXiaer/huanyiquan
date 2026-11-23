import { closeSheet, openSheet } from "../../components/desktop/sheet.js";
import { toast } from "../../components/desktop/toast.js";
import { go } from "../../router/desktop/navigation.js";
import { desktopRuntime, state } from "../../router/desktop/state.js";
import { ApiError, api } from "../../utils/desktop/api.js";
import { esc, withBusy } from "../../utils/desktop/dom.js";
import { thumb } from "../../utils/desktop/format.js";
import {
    getAllRooms,
    getRoomFollows,
    openCreateRoomSheet,
    refreshCommunity,
    renderCommunity,
    setRoomFollows,
} from "./desktop.js";
import { refreshRoom } from "../messages/room-desktop.js";
import { renderMeSub } from "../users/account-desktop.js";

const communityActions = {
    "comm-room": async ({ element: el }) => {
        siteRoutes.go('#/community?room=' + encodeURIComponent(el.dataset.room || 'hall'), {newTab:true});
    },
    "comm-tab": async ({ element: el }) => {
        const params = new URLSearchParams({room: state.commRoom || 'hall', section: el.dataset.v || 'posts'});
        siteRoutes.go('#/community?' + params);
    },
    "open-room": async ({ element: el }) => {
        siteRoutes.go('#/community?room=' + encodeURIComponent(el.dataset.room || 'hall'), {newTab:true});
    },
    "toggle-follow-room": async ({ element: el }) => {
        var rId = el.dataset.room;
        if (!rId) return;
        var fl = getRoomFollows().slice();
        var pos = fl.indexOf(rId);
        if (pos >= 0) { fl.splice(pos, 1); toast('已取消关注该贴吧'); }
        else { fl.push(rId); toast('已关注该贴吧'); }
        setRoomFollows(fl);
        if (desktopRuntime.currentView.name === 'meSub') await renderMeSub('channels');
        else await renderCommunity();
        return;
    },
    "open-create-room": async () => {
        openCreateRoomSheet();
        return;
    },
    "delete-custom-room": async ({ element: el }) => {
        var delId = el.dataset.room;
        if (!delId || !confirm('确定删除这个自建聊天室吗？')) return;
        var curCustom = [];
        try { curCustom = JSON.parse(localStorage.getItem('hq.customRooms') || '[]'); } catch (e) { curCustom = []; }
        curCustom = (Array.isArray(curCustom) ? curCustom : []).filter(function (r) { return r.id !== delId; });
        try { localStorage.setItem('hq.customRooms', JSON.stringify(curCustom)); } catch (e) {}
        if (state.commRoom === delId) state.commRoom = 'hall';
        toast('已删除自建聊天室');
        await renderCommunity();
        return;
    },
    "tieba-like": async ({ element: el }) => {
        var postId = el.dataset.id;
        if (!postId) return;
        var likesMap = {};
        try { likesMap = JSON.parse(localStorage.getItem('hq.tiebaLikes') || '{}') || {}; } catch (e) { likesMap = {}; }
        var lkKey = 'u_' + postId;
        likesMap[lkKey] = !likesMap[lkKey];
        try { localStorage.setItem('hq.tiebaLikes', JSON.stringify(likesMap)); } catch (e) {}
        await renderCommunity();
        return;
    },
    "tieba-toggle-comments": async ({ element: el }) => {
        var cPid = el.dataset.id;
        if (!cPid) return;
        var opened = !state.tiebaOpenComments[cPid];
        state.tiebaOpenComments[cPid] = opened;
        el.classList.toggle('on', opened);
        var cardEl = el.closest('.tieba-post-card');
        var cBox = cardEl && cardEl.querySelector('.tieba-comments');
        if (cBox) cBox.hidden = !opened;
        return;
    },
    "tieba-delete-post": async ({ element: el }) => {
        var dpId = el.dataset.id;
        if (!dpId || !confirm('确定删除这条帖子？')) return;
        var postsArr = [];
        try { postsArr = JSON.parse(localStorage.getItem('hq.tiebaPosts') || '[]'); } catch (e) { postsArr = []; }
        postsArr = (Array.isArray(postsArr) ? postsArr : []).filter(function (p) { return p.id !== dpId; });
        try { localStorage.setItem('hq.tiebaPosts', JSON.stringify(postsArr)); } catch (e) {}
        toast('帖子已删除');
        await renderCommunity();
        return;
    },
    "tieba-clear-img": async () => {
        var tDraft = document.querySelector('[data-form="tieba-post"] input[name="title"]')?.value || '';
        var bDraft = document.querySelector('[data-form="tieba-post"] textarea[name="body"]')?.value || '';
        state.tiebaPostImg = '';
        await renderCommunity();
        var tIn = document.querySelector('[data-form="tieba-post"] input[name="title"]');
        var bIn = document.querySelector('[data-form="tieba-post"] textarea[name="body"]');
        if (tIn && tDraft) tIn.value = tDraft;
        if (bIn && bDraft) bIn.value = bDraft;
        return;
    },
    "lost-found": async () => {
        sessionStorage.setItem('hq.communityDraft','【失物招领】物品：　地点：　时间：');
        go('#/community');return;
    },
    "community-share": async ({ element: el }) => { await withBusy(el,async function(){var items=await api('/item/mine?status=1'); openSheet('<h3>分享我的物品</h3><p class="sub">选择一件已上架的物品分享到公共聊天室。</p>'+(items.length?items.map(function(it){return '<button class="chat-share-option" data-act="community-share-send" data-id="'+it.id+'">'+thumb(it)+'<span>'+esc(it.title)+'</span></button>';}).join(''):'<p>你还没有已上架的物品。</p>')); });return; },
    "community-share-send": async ({ element: el }) => { await withBusy(el,async function(){await api('/community',{method:'POST',body:{kind:'item',itemId:Number(el.dataset.id)}});closeSheet();await refreshCommunity(true);});return; },
};

const communityForms = {
    "tieba-post": async ({ form, data: fd }) => {
        var pTitle = (fd.get('title') || '').trim();
        var pBody = (fd.get('body') || '').trim();
        if (!pTitle || !pBody) throw new ApiError('请填写帖子标题和正文');
        var roomsNow = getAllRooms();
        var activeR = roomsNow.find(function (r) { return r.id === state.commRoom; }) || roomsNow[0];
        var selItemId = Number(fd.get('itemId') || 0) || null;
        var selEl = form.querySelector('select[name="itemId"]');
        var selItemTitle = selItemId && selEl && selEl.selectedIndex >= 0 ? selEl.options[selEl.selectedIndex].text : '';
        var nick = (state.me && state.me.nickname) || '移通同学';
        var posts = [];
        try { posts = JSON.parse(localStorage.getItem('hq.tiebaPosts') || '[]'); } catch (e) { posts = []; }
        if (!Array.isArray(posts)) posts = [];
        posts.unshift({
            id: 'u_' + Date.now(),
            isUserPost: true,
            roomId: activeR.id,
            cat: activeR.cat === '综合' ? '' : activeR.cat,
            author: nick,
            ava: nick.slice(0, 1),
            time: '刚刚',
            tag: fd.get('tag') || '讨论',
            title: pTitle,
            body: pBody,
            imgs: state.tiebaPostImg ? [state.tiebaPostImg] : [],
            itemId: selItemId,
            itemTitle: selItemTitle,
            likes: 0,
            comments: []
        });
        try { localStorage.setItem('hq.tiebaPosts', JSON.stringify(posts)); } catch (e) {}
        state.tiebaPostImg = '';
        toast('发表成功，帖子已置顶展示在当前贴吧', 'ok');
        await renderCommunity();
        return;
    },
    "tieba-reply": async ({ form, data: fd }) => {
        var rpId = form.dataset.postId;
        var rpText = (fd.get('reply') || '').trim();
        if (!rpId || !rpText) return;
        var rMap = {};
        try { rMap = JSON.parse(localStorage.getItem('hq.tiebaReplies') || '{}') || {}; } catch (e) { rMap = {}; }
        if (!Array.isArray(rMap[rpId])) rMap[rpId] = [];
        rMap[rpId].push({
            author: (state.me && state.me.nickname) || '移通同学',
            time: '刚刚',
            text: rpText
        });
        try { localStorage.setItem('hq.tiebaReplies', JSON.stringify(rMap)); } catch (e) {}
        state.tiebaOpenComments[rpId] = true;
        toast('回帖成功', 'ok');
        await renderCommunity();
        return;
    },
    "create-room": async ({ data: fd }) => {
        var rmName = (fd.get('name') || '').trim();
        if (!rmName) throw new ApiError('请填写聊天室名称');
        var rmId = 'custom_' + Date.now();
        var customArr = [];
        try { customArr = JSON.parse(localStorage.getItem('hq.customRooms') || '[]'); } catch (e) { customArr = []; }
        if (!Array.isArray(customArr)) customArr = [];
        customArr.push({
            id: rmId,
            name: rmName,
            icon: fd.get('icon') || 'fire',
            cat: fd.get('cat') || '综合',
            badge: (fd.get('badge') || '').trim() || '新建',
            desc: (fd.get('desc') || '').trim() || '同学们自主发起的校园兴趣贴吧与闲置交流室',
            members: 1,
            img: '/assets/amz/quad-community-compact.webp',
            custom: true
        });
        try { localStorage.setItem('hq.customRooms', JSON.stringify(customArr)); } catch (e) {}
        var fArr = getRoomFollows().slice();
        if (fArr.indexOf(rmId) < 0) fArr.push(rmId);
        setRoomFollows(fArr);
        state.commRoom = rmId;
        state.commTab = 'posts';
        closeSheet();
        toast('聊天室创建成功', 'ok');
        if (desktopRuntime.currentView.name === 'community') await renderCommunity();
        else go('#/community');
        return;
    },
    "room-chat-msg": async ({ form, data: fd }) => {
        var rmKey = form.dataset.room || state.commRoom || 'hall';
        var rmTxt = (fd.get('content') || '').trim();
        if (!rmTxt) return;
        var nowC = new Date();
        var tClock = String(nowC.getHours()).padStart(2, '0') + ':' + String(nowC.getMinutes()).padStart(2, '0');
        var cMap = {};
        try { cMap = JSON.parse(localStorage.getItem('hq.roomChats') || '{}') || {}; } catch (e) { cMap = {}; }
        if (!Array.isArray(cMap[rmKey])) cMap[rmKey] = [];
        cMap[rmKey].push({
            nick: (state.me && state.me.nickname) || '移通同学',
            time: tClock,
            text: rmTxt
        });
        try { localStorage.setItem('hq.roomChats', JSON.stringify(cMap)); } catch (e) {}
        await renderCommunity();
        return;
    },
    "room-text": async ({ form, data: fd }) => {var roomId=desktopRuntime.currentView.arg,ringRoom=desktopRuntime.currentView.name==='ringChat';await api('/conversation/'+(ringRoom?'ring/':'')+roomId,{method:'POST',body:{kind:'text',content:fd.get('content')}});form.reset();await refreshRoom(true);return;},
    "community-text": async ({ form, data: fd }) => { await api('/community',{method:'POST',body:{kind:'text',content:fd.get('content')}}); form.reset(); form.querySelector('.community-draft-note')?.remove(); await refreshCommunity(true); return; },
};

export { communityActions, communityForms };
