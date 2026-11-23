import { navIcon } from "../../components/desktop/icons.js";
import { shell } from "../../components/desktop/shell.js";
import { toast } from "../../components/desktop/toast.js";
import { desktopRuntime, state } from "../../router/desktop/state.js";
import { api } from "../../utils/desktop/api.js";
import { $, esc } from "../../utils/desktop/dom.js";
import { thumb } from "../../utils/desktop/format.js";
import { renderNotifications } from "./desktop.js";

var roomBusy=false;

function conversationRows(list) {
    return list.map(function(c){
        return '<a class="conversation-row" href="#/chat/'+c.id+'"><span class="conversation-avatar">'+esc((c.peer||'同').slice(0,1))+'</span><span><b>'+esc(c.peer)+'</b><small>'+esc(c.lastText||'暂无文字消息')+'</small><small>'+esc(c.title)+'</small></span>'+navIcon('next')+'</a>';
    }).join('')||'<div class="card card-pad">还没有私聊。</div>';
}

async function renderChats() {
    await renderNotifications();
}

function roomMessage(m) {
    var mine=state.me&&m.senderId===state.me.id;var img=m.kind==='image'?'<a href="'+esc(m.image)+'" target="_blank" rel="noopener"><img class="chat-image" src="'+esc(m.image)+'" alt="私聊图片"></a>':'';
    return '<article class="chat-message '+(mine?'is-mine':'')+'"><a class="chat-avatar" href="#/user/'+Number(m.senderId)+'" aria-label="查看'+esc(m.nickname||'同学')+'的主页">'+esc((m.nickname||'?').slice(0,1))+'</a><div class="chat-message-body"><div class="chat-meta"><b>'+esc(m.nickname)+'</b><time>'+esc(String(m.createdAt).replace('T',' ').slice(5,16))+'</time></div><div class="chat-bubble">'+img+(m.content?'<p class="chat-text">'+esc(m.content)+'</p>':'')+'</div></div></article>';
}

async function refreshRoom(force) {
    if(roomBusy||!['chat','ringChat'].includes(desktopRuntime.currentView.name))return;roomBusy=true;
    try {var ring=desktopRuntime.currentView.name==='ringChat',id=desktopRuntime.currentView.arg,result=await api('/conversation/'+(ring?'ring/':'')+id),messages=ring?result:result.messages;var box=$('#room-messages');if(!box||desktopRuntime.currentView.arg!==id)return;
        var sig=messages.map(function(m){return m.id;}).join(',');if(box.dataset.signature!==sig){var near=box.scrollHeight-box.scrollTop-box.clientHeight<100;box.innerHTML=messages.length?messages.map(roomMessage).join(''):'<div class="chat-empty">还没有消息，来打个招呼吧。</div>';box.dataset.signature=sig;if(near||force)box.scrollTop=box.scrollHeight;}
    }catch(e){if(force)toast(e.message||'加载失败','err');}finally{roomBusy=false;}
}

async function renderRoom(id,ring) {
    var title='三方协商房间', back='#/exchange/'+id, product='';
    if(!ring){
        var thread=await api('/conversation/'+id);
        var peer=thread.sellerId===state.me.id?thread.buyerId:thread.sellerId;
        title=thread.sellerId===state.me.id?thread.buyer:thread.seller;
        back='#/notifications';
        product='<a class="room-product" href="#/item/'+Number(thread.itemId)+'">'+thumb({title:thread.title,images:thread.images})+'<span><strong>'+esc(thread.title)+'</strong><small>查看物品详情</small></span>'+navIcon('next')+'</a>';
    }
    if(desktopRuntime.currentView.arg!==id||desktopRuntime.currentView.name!==(ring?'ringChat':'chat'))return;
    var tools=ring?'':'<details class="room-attachments"><summary aria-label="打开附件面板">'+navIcon('add')+'</summary><div><label class="chat-tool">相册<input type="file" accept="image/png,image/jpeg" data-act="room-image"></label><label class="chat-tool">拍摄<input type="file" accept="image/*" capture="environment" data-act="room-image"></label><a class="chat-tool" href="#/item/'+Number(thread.itemId)+'">查看物品</a></div></details>';
    var name=ring?esc(title):'<a href="#/user/'+Number(peer)+'">'+esc(title)+'</a>';
    $('#app').innerHTML=shell('notifications','<section class="redesign-page room-redesign"><header class="redesign-heading"><button type="button" class="icon-action" onclick="if(history.length>1)history.back();else siteRoutes.replace(\''+esc(back)+'\');" aria-label="返回">'+navIcon('back')+'</button><h1>'+name+'</h1></header>'+product+'<p class="room-safety">'+(ring?'仅本次闭环的三位参与者可见。':'面交时请选校内公共地点，确认物品状态后再交付。')+'</p><section class="chat-panel room-panel"><div class="chat-messages" id="room-messages" aria-live="polite"></div><form class="chat-compose" data-form="room-text"><div class="room-input"><textarea name="content" maxlength="500" rows="2" placeholder="想跟 TA 说点什么" aria-label="消息内容" required></textarea><button type="submit" class="btn btn-primary btn-sm">发送</button></div>'+tools+'</form></section></section>');
    await refreshRoom(true);
    if(desktopRuntime.currentView.arg===id&&['chat','ringChat'].includes(desktopRuntime.currentView.name))desktopRuntime.roomTimer=setInterval(function(){refreshRoom(false);},5000);
}

export { conversationRows, refreshRoom, renderRoom };
