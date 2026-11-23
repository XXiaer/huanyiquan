import { creditLevelOf } from "../../components/desktop/credit.js";
import { clayIcon, navIcon } from "../../components/desktop/icons.js";
import { shell } from "../../components/desktop/shell.js";
import { toast } from "../../components/desktop/toast.js";
import { desktopRuntime, state } from "../../router/desktop/state.js";
import { api, readToken } from "../../utils/desktop/api.js";
import { $, esc, safeRoute } from "../../utils/desktop/dom.js";
import { cashPrice, firstImage } from "../../utils/desktop/format.js";
import { loadDesktopNoticeList, refreshNoticeCount } from "./notices-desktop.js";

var imPollBusy = false;

var imSelectSeq = 0;

function updateImBottomPill() {
    var st = $('#tb-chat-stream');
    var pill = $('#tb-chat-stream .tb-bottom-pill');
    if (!st || !pill) return;
    pill.hidden = st.scrollHeight <= st.clientHeight + 24;
}

function formatImRealMsg(m) {
    var mine = state.me && m.senderId === state.me.id;
    var nick = mine ? ('我（' + esc((state.me && state.me.nickname) || '移通同学') + '）') : esc(m.nickname || '校内同学');
    var tStr = esc(String(m.createdAt || '').replace('T', ' ').slice(5, 16));
    var inner = m.kind === 'image' && m.image
        ? '<a href="' + esc(m.image) + '" target="_blank" rel="noopener"><img class="tb-chat-img" src="' + esc(m.image) + '" alt="聊天图片"></a>'
        : '';
    if (m.content) inner += (inner ? '<div style="margin-top:6px">' : '') + esc(m.content) + (inner ? '</div>' : '');
    return '<div class="tb-msg-group ' + (mine ? 'is-mine' : '') + '">'
        + '<div class="tb-msg-sender">' + (mine ? '' : '<img src="/assets/brand/mascot-wave-320.webp" alt="">')
        + '<span>' + nick + '</span><time>' + tStr + '</time></div>'
        + '<div class="tb-text-bubble ' + (mine ? 'is-mine' : '') + '">' + inner + '</div>'
        + '</div>';
}

function buildImContactsHtml(notices, conversations, activeKey) {
    var unreadNoticeCount = (notices || []).filter(function (n) { return !n.read; }).length;
    var latestNotice = (notices && notices[0]) ? notices[0].title : '提案、面交与审核提醒';
    var noticeRow = '<button type="button" class="conversation-row tb-contact-item ' + (activeKey === 'notices' ? 'on' : '') + '" data-act="im-select" data-key="notices">'
        + '<span class="tb-contact-ava tone-notice">通</span>'
        + '<div class="tb-contact-meta">'
        + '<div class="tb-contact-top"><b>系统与交易通知</b><time>' + (notices && notices[0] ? esc(String(notices[0].createdAt || '').replace('T', ' ').slice(5, 10)) : '置顶') + '</time></div>'
        + '<div class="tb-contact-sub"><p>' + esc(latestNotice) + '</p>' + (unreadNoticeCount ? '<em class="tb-unread-dot">' + unreadNoticeCount + '</em>' : '') + '</div>'
        + '</div></button>';

    var unreadChats = new Map();
    (notices || []).forEach(function (notice) {
        if (!notice.read && /^#\/chat\/\d+$/.test(notice.target || '')) {
            unreadChats.set(notice.target, (unreadChats.get(notice.target) || 0) + 1);
        }
    });
    var realConvRows = (conversations || []).map(function (c) {
        var id = Number(c.id);
        var key = 'real:' + id;
        var unread = activeKey === key ? 0 : unreadChats.get('#/chat/' + id);
        return '<div class="tb-conv-entry" data-conv="' + id + '" data-pinned="' + Boolean(c.pinned) + '">'
            + '<div class="tb-conv-actions" id="tb-conv-actions-' + id + '">'
            + '<button type="button" data-act="im-pin">' + (c.pinned ? '取消置顶' : '置顶') + '</button>'
            + '<button type="button" data-act="im-read">标为已读</button>'
            + '<button type="button" data-act="im-delete">删除</button></div>'
            + '<div class="tb-conv-face"><button type="button" class="conversation-row tb-contact-item ' + (activeKey === key ? 'on' : '') + '" data-act="im-select" data-key="' + key + '">'
            + '<span class="tb-contact-ava tone-emerald">' + esc((c.peer || '同').slice(0, 1)) + '</span>'
            + '<div class="tb-contact-meta">'
            + '<div class="tb-contact-top"><b>' + esc(c.peer || '校内同学') + '</b>' + (c.pinned ? '<time>置顶</time>' : '') + '</div>'
            + '<div class="tb-contact-sub"><p>' + esc(c.lastText || c.title || '点击查看私聊记录') + '</p>'
            + (unread ? '<em class="tb-unread-dot">' + unread + '</em>' : '') + '</div>'
            + '</div></button><button type="button" class="tb-conv-more" data-act="im-more" aria-label="会话操作" aria-expanded="false" aria-controls="tb-conv-actions-' + id + '">⋯</button></div></div>';
    }).join('');

    return noticeRow + realConvRows;
}

async function buildImRightAndCenter(activeKey, notices) {
    if (activeKey === 'notices') {
        var noticeListHtml = (notices || []).map(function (n) {
            var target = safeRoute(n.target, '#/notifications');
            return '<a class="notice-row tb-notice-card ' + (n.read ? '' : 'is-unread') + '" href="' + esc(target) + '" data-act="notice-open" data-id="' + Number(n.id) + '" data-to="' + esc(target) + '">'
                + '<span class="notice-dot"></span>'
                + '<div class="notice-body"><b>' + esc(n.title) + '</b><span>' + esc(n.content) + '</span></div>'
                + '<time>' + esc(String(n.createdAt || '').replace('T', ' ').slice(0, 16)) + '</time>'
                + '</a>';
        }).join('');
        return {
            headerHtml: '<div class="tb-chat-peer"><b>系统与交易通知</b><span class="tb-online-tag"><i class="qq-live-dot" aria-hidden="true"></i>实时同步</span></div>'
                + '<div class="tb-chat-top-btns">'
                + '<a href="#/followers" class="tb-top-chip">谁关注了我</a>'
                + '<a href="#/offers" class="tb-top-chip">提案与出价</a>'
                + '<button type="button" class="tb-top-chip primary" data-act="notice-read">全部标为已读</button>'
                + '</div>',
            streamHtml: '<div class="tb-real-notices"><div class="tb-stream-divider"><span>' + clayIcon('chat', '通知', 'is-sm') + ' 最新系统与交易通知（点击直达）</span></div>'
                + (noticeListHtml || '<div class="tb-im-empty-tip">暂无系统或交易通知，请在左侧选择同学继续私聊~</div>')
                + '</div><button type="button" class="tb-bottom-pill" data-act="im-scroll-bottom" hidden>回到底部 ∨</button>',
            shopCardHtml: '<div class="tb-shop-top">'
                + '<img src="/assets/brand/mascot-wave-320.webp" alt="">'
                + '<div><b>换一圈通知助手</b><a href="#/me" class="tb-enter-shop">个人中心</a></div>'
                + '</div>'
                + '<div class="tb-shop-stats">'
                + '<div><span>未读提醒</span><b>' + (notices || []).filter(function (n) { return !n.read; }).length + ' 条</b></div>'
                + '<div><span>担保方式</span><b>校内面交</b></div>'
                + '<div><span>覆盖书院</span><b>全校区</b></div>'
                + '</div>',
            placeholder: '当前为系统通知只读频道，请点击左侧同学名字开启私聊',
            readOnly: true
        };
    }

    if (activeKey.indexOf('real:') === 0) {
        var convId = Number(activeKey.slice(5));
        var thread = await api('/conversation/' + convId, { noCache: true });
        var isSeller = state.me && thread.sellerId === state.me.id;
        var peerId = isSeller ? thread.buyerId : thread.sellerId;
        var peerName = (isSeller ? thread.buyer : thread.seller) || '校内同学';
        var peerProfile = peerId ? await api('/user/' + peerId, { optionalAuth: true }).catch(function () { return null; }) : null;
        var itemImg = window.catalogThumbnail(firstImage(thread.images) || '/assets/amz/quad-swap-compact.webp');
        var messages = Array.isArray(thread.messages) ? thread.messages : [];
        var msgSig = messages.map(function (m) { return m.id; }).join(',');
        var creditScore = peerProfile && peerProfile.credit != null ? Number(peerProfile.credit) : 80;
        var creditText = creditScore + ' ' + creditLevelOf(creditScore).text;
        var campusText = (peerProfile && (peerProfile.building || peerProfile.college)) ? (peerProfile.building || peerProfile.college) : '移通学院';

        var proposalHtml = '';
        if (state.me && peerId && thread.itemId) {
            var lists = await Promise.all(['/offer/sent','/offer/received'].map(function(path){
                return api(path,{noCache:true,optionalAuth:true}).catch(function(){return [];});
            }));
            var pair = lists.flat().filter(function(o){
                return [Number(o.fromUser),Number(o.toUser)].includes(Number(state.me.id))
                    && [Number(o.fromUser),Number(o.toUser)].includes(Number(peerId));
            });
            var related = new Set(pair.filter(function(o){
                return o.conversationId != null
                    ? Number(o.conversationId) === convId
                    : [Number(o.itemId),Number(o.myItemId)].includes(Number(thread.itemId));
            }).map(function(o){return Number(o.id);}));
            for(var size=-1;size!==related.size;){
                size=related.size;
                pair.forEach(function(o){if(related.has(Number(o.parentId)))related.add(Number(o.id));});
            }
            var proposal = pair.filter(function(o){return related.has(Number(o.id));}).sort(function(a,b){return b.id-a.id;})[0];
            if(proposal){
                var incoming=Number(proposal.toUser)===Number(state.me.id);
                var pending=Number(proposal.status)===0 && (!proposal.expireTime || new Date(proposal.expireTime).getTime()>Date.now());
                var label=pending?(incoming?'等你回应':'等对方回应'):(Number(proposal.status)===0?'已过期':proposal.statusText||'已处理');
                var cash=Number(proposal.amountCents || 0);
                var controls=pending?(incoming?[['reject','拒绝'],['counter',cash?'还价':'修改提案'],['accept','接受']]:[['cancel','撤回']]):[];
                proposalHtml='<div class="tb-order-card"><h4>'+(cash?'面交出价':proposal.parentId?'换物反提案':'换物提案')+' <small>'+esc(label)+'</small></h4>'
                    +(cash?'<p>'+cashPrice(cash)+' 面交「'+esc(proposal.targetTitle || thread.title)+'」</p>'
                        : '<p>你给：'+esc(incoming?proposal.targetTitle:proposal.myTitle)+'</p><p>你收：'+esc(incoming?proposal.myTitle:proposal.targetTitle)+'</p>')
                    +(proposal.message?'<p>'+esc(proposal.message)+'</p>':'')
                    +'<div class="tb-chat-top-btns">'+controls.map(function(action){return '<button type="button" class="tb-top-chip" data-act="offer-act" data-id="'+Number(proposal.id)+'" data-do="'+action[0]+'" data-cash="'+cash+'">'+action[1]+'</button>';}).join('')+'<button type="button" class="tb-top-chip" data-act="offer-history" data-id="'+Number(proposal.id)+'">查看历史</button></div></div>';
            }
        }

        var itemCardHtml = '<div class="tb-msg-group">'
            + '<div class="tb-order-card tb-real-item-card">'
            + '<h4>面交请选校内公共地点，确认物品状态后再交付</h4>'
            + '<div class="tb-order-item-box">'
            + '<img src="' + esc(itemImg) + '" onerror="this.onerror=null;this.src=\'/assets/amz/quad-swap-compact.webp\'" alt="">'
            + '<div class="tb-order-item-info"><p>' + esc(thread.title || '校园闲置好物') + '</p><small>与 ' + esc(peerName) + ' 的专属私聊会话</small></div>'
            + '</div>'
            + '<a href="#/item/' + Number(thread.itemId) + '" class="tb-order-orange-btn">查看物品详情</a>'
            + '</div></div>';

        var msgsHtml = '<div class="tb-chat-msgs" id="tb-real-msgs" data-conv="' + convId + '" data-sig="' + esc(msgSig) + '">'
            + (messages.length ? messages.map(formatImRealMsg).join('') : '<div class="tb-im-empty-tip">还没有聊天记录，在下方发消息和 TA 打个招呼吧~</div>')
            + '</div>';

        return {
            headerHtml: '<div class="tb-chat-peer"><b>' + esc(peerName) + '</b><span class="tb-online-tag">' + esc(thread.title || '校园私聊') + '</span></div>'
                + '<div class="tb-chat-top-btns">'
                + '<a href="#/user/' + Number(peerId) + '" class="tb-top-chip">TA的主页</a>'
                + '<a href="#/item/' + Number(thread.itemId) + '" class="tb-top-chip">查看物品</a>'
                + '<a href="#/offers" class="tb-top-chip">提案与出价</a>'
                + '<button type="button" class="tb-top-chip primary" data-act="notice-read">全部标为已读</button>'
                + '</div>',
            streamHtml: itemCardHtml + proposalHtml + msgsHtml + '<button type="button" class="tb-bottom-pill" data-act="im-scroll-bottom" hidden>回到底部 ∨</button>',
            shopCardHtml: '<div class="tb-shop-top">'
                + '<img src="' + esc(itemImg) + '" onerror="this.onerror=null;this.src=\'/assets/amz/quad-swap-compact.webp\'" alt="">'
                + '<div><b>' + esc(peerName) + '</b><a href="#/user/' + Number(peerId) + '" class="tb-enter-shop">进入主页</a></div>'
                + '</div>'
                + '<div class="tb-shop-stats">'
                + '<div><span>校园信用</span><b>' + esc(creditText) + '</b></div>'
                + '<div><span>累计成交</span><b>' + (peerProfile && peerProfile.dealCount != null ? Number(peerProfile.dealCount) + ' 单' : '校内认证') + '</b></div>'
                + '<div><span>常驻书院</span><b>' + esc(campusText) + '</b></div>'
                + '</div>',
            placeholder: '请输入消息给 ' + peerName + '，按 Enter 键 或 点击发送',
            readOnly: false,
            peerName: peerName,
            lastMsgText: messages.length ? (messages[messages.length - 1].kind === 'image' ? '[图片]' : messages[messages.length - 1].content) : ''
        };
    }

    return buildImRightAndCenter('notices', notices);
}

async function patchImRightPanel(activeKey, opts) {
    opts = opts || {};
    var seq = ++imSelectSeq;
    var win = $('.tb-im-window');
    if (!win) {
        await renderNotifications();
        return;
    }
    var winY = window.scrollY;
    var contactList = $('.tb-contact-list');
    var leftScroll = contactList ? contactList.scrollTop : 0;

    if (contactList) {
        contactList.querySelectorAll('.tb-contact-item').forEach(function (btn) {
            var hit = btn.dataset.key === activeKey;
            btn.classList.toggle('on', hit);
            if (hit) {
                var dot = btn.querySelector('.tb-unread-dot');
                if (dot) dot.remove();
            }
        });
    }

    var centerBox = $('.tb-im-center');
    if (centerBox) centerBox.setAttribute('aria-busy', 'true');
    var notices = opts.notices || (activeKey === 'notices' ? await loadDesktopNoticeList(readToken()).catch(function () { return []; }) : []);
    var panels;
    try {
        panels = await buildImRightAndCenter(activeKey, notices);
    } catch (err) {
        if (centerBox) centerBox.removeAttribute('aria-busy');
        toast((err && err.message) || '会话加载失败', 'err');
        return;
    }
    if (seq !== imSelectSeq || !$('.tb-im-window')) return;
    if (centerBox) centerBox.removeAttribute('aria-busy');

    var hdr = $('.tb-chat-header');
    var stream = $('#tb-chat-stream');
    var shopCard = $('#tb-shop-card');
    var compose = $('.tb-chat-compose');
    var input = $('#tb-im-input');

    if (hdr) hdr.innerHTML = panels.headerHtml;
    if (stream) {
        stream.innerHTML = panels.streamHtml;
        stream.scrollTop = opts.scrollBottom ? stream.scrollHeight : 0;
    }
    if (shopCard) shopCard.innerHTML = panels.shopCardHtml;
    if (compose) compose.classList.toggle('is-readonly', !!panels.readOnly);
    if (input) {
        input.placeholder = panels.placeholder || '请输入消息…';
        input.readOnly = !!panels.readOnly;
    }
    if (opts.previewText && contactList) {
        var activeRowP = contactList.querySelector('.tb-contact-item[data-key="' + activeKey + '"] .tb-contact-sub p');
        if (activeRowP) activeRowP.textContent = opts.previewText;
    }
    if (contactList) contactList.scrollTop = leftScroll;
    updateImBottomPill();
    window.scrollTo(window.scrollX, winY);
    if (activeKey.indexOf('real:') === 0) refreshNoticeCount();
}

async function refreshImActiveThread() {
    if (imPollBusy || !['notifications', 'chat', 'chats'].includes(desktopRuntime.currentView.name)) return;
    if (!state.activeImKey || state.activeImKey.indexOf('real:') !== 0) return;
    var box = $('#tb-real-msgs');
    var stream = $('#tb-chat-stream');
    if (!box || !stream) return;
    var convId = Number(state.activeImKey.slice(5));
    if (!convId || Number(box.dataset.conv) !== convId) return;
    imPollBusy = true;
    try {
        var thread = await api('/conversation/' + convId, { noCache: true });
        if (desktopRuntime.currentView.name !== 'notifications' && desktopRuntime.currentView.name !== 'chat' && desktopRuntime.currentView.name !== 'chats') return;
        box = $('#tb-real-msgs');
        stream = $('#tb-chat-stream');
        if (!box || !stream || state.activeImKey !== 'real:' + convId) return;
        var messages = Array.isArray(thread.messages) ? thread.messages : [];
        var sig = messages.map(function (m) { return m.id; }).join(',');
        if (box.dataset.sig !== sig) {
            var prevScroll = stream.scrollTop;
            var wasNearBottom = stream.scrollHeight - prevScroll - stream.clientHeight < 60;
            box.innerHTML = messages.length ? messages.map(formatImRealMsg).join('') : '<div class="tb-im-empty-tip">还没有聊天记录，在下方发消息和 TA 打个招呼吧~</div>';
            box.dataset.sig = sig;
            if (wasNearBottom) stream.scrollTop = stream.scrollHeight;
            else stream.scrollTop = prevScroll;
            updateImBottomPill();
            if (messages.length) {
                var lastM = messages[messages.length - 1];
                var previewEl = $('.tb-contact-item[data-key="real:' + convId + '"] .tb-contact-sub p');
                if (previewEl) previewEl.textContent = lastM.kind === 'image' ? '[图片]' : (lastM.content || '');
            }
        }
    } catch (ignore) {
    } finally {
        imPollBusy = false;
    }
}

async function renderNotifications(forcedConvId, contactsOnly) {
    var existingWin = $('.tb-im-window');
    if (forcedConvId && existingWin) {
        state.activeImKey = 'real:' + Number(forcedConvId);
        await patchImRightPanel(state.activeImKey, { scrollBottom: false });
        return;
    }
    var notices = await loadDesktopNoticeList(readToken()).catch(function () { return []; });
    var conversations = await api('/conversation', { noCache: true }).catch(function () { return []; });
    if (!['notifications', 'chat', 'chats'].includes(desktopRuntime.currentView.name)) return;

    if (forcedConvId) {
        state.activeImKey = 'real:' + Number(forcedConvId);
    } else if (!state.activeImKey) {
        state.activeImKey = (conversations && conversations.length)
            ? ('real:' + Number(conversations[0].id))
            : 'notices';
    }

    if (existingWin) {
        var listEl = $('.tb-contact-list');
        var prevLeftY = listEl ? listEl.scrollTop : 0;
        if (listEl) {
            listEl.innerHTML = buildImContactsHtml(notices, conversations, state.activeImKey);
            listEl.scrollTop = prevLeftY;
        }
        if (!contactsOnly) await patchImRightPanel(state.activeImKey, { notices: notices, scrollBottom: false });
        return;
    }

    var panels;
    try {
        panels = await buildImRightAndCenter(state.activeImKey, notices);
    } catch (e) {
        state.activeImKey = 'notices';
        panels = await buildImRightAndCenter(state.activeImKey, notices);
    }
    if (!['notifications', 'chat', 'chats'].includes(desktopRuntime.currentView.name)) return;

    var contactsHtml = buildImContactsHtml(notices, conversations, state.activeImKey);
    var content = '<section class="messages-page tb-im-backdrop" aria-label="消息与聊天窗口">'
        + '<div class="tb-im-window">'
        + '<aside class="tb-im-left">'
        + '<div class="tb-left-head">'
        + '<span class="tb-left-title">' + clayIcon('chat', '聊天', 'is-sm') + ' 聊天列表</span>'
        + '<button type="button" class="tb-read-btn" data-act="notice-read">全部已读</button>'
        + '</div>'
        + '<div class="tb-left-search">'
        + '<input type="search" id="message-filter" placeholder="搜索最近联系人" aria-label="搜索消息联系人">'
        + '</div>'
        + '<div class="tb-contact-list conversation-list">'
        + contactsHtml
        + '</div>'
        + '</aside>'

        + '<div class="tb-im-center">'
        + '<header class="tb-chat-header">' + panels.headerHtml + '</header>'

        + '<div class="tb-chat-stream" id="tb-chat-stream">'
        + panels.streamHtml
        + '</div>'

        + '<div class="tb-chat-compose ' + (panels.readOnly ? 'is-readonly' : '') + '">'
        + '<div class="tb-phrase-bar" id="tb-phrase-bar" hidden>'
        + ['方便在北山斋面交吗？', '可以看看成色细节图吗？', '我出一件数码外设互换如何？', '没问题，就约明天下午！'].map(function (ph) {
            return '<button type="button" data-act="im-phrase-pick" data-v="' + esc(ph) + '">' + esc(ph) + '</button>';
        }).join('')
        + '</div>'
        + '<div class="tb-compose-toolbar">'
        + '<div class="tb-tool-icons">'
        + '<button type="button" class="tb-tool-pill" title="快捷常用语" data-act="im-phrase-menu">' + navIcon('community') + '<span>常用语</span></button>'
        + '<label class="tb-tool-lbl tb-tool-pill" title="发送图片">' + navIcon('image') + '<span>发图片</span><input type="file" accept="image/png,image/jpeg,image/webp" data-act="im-image" hidden></label>'
        + '<button type="button" class="tb-tool-pill" title="发送交换卡片" data-act="im-insert-card">' + navIcon('trade') + '<span>带好物</span></button>'
        + '<button type="button" class="tb-tool-pill" title="插入AI估价建议" data-act="im-insert-ai">' + navIcon('appraise') + '<span>估价</span></button>'
        + '</div>'
        + '<span class="tb-char-count" id="tb-char-count">0 / 500</span>'
        + '</div>'
        + '<textarea id="tb-im-input" maxlength="500" rows="3" ' + (panels.readOnly ? 'readonly ' : '') + 'placeholder="' + esc(panels.placeholder) + '"></textarea>'
        + '<div class="tb-compose-foot">'
        + '<button type="button" class="tb-send-btn" data-act="im-send">发送 <span>| ▾</span></button>'
        + '</div>'
        + '</div>'
        + '</div>'

        + '<aside class="tb-im-right">'
        + '<div class="tb-shop-card" id="tb-shop-card">' + panels.shopCardHtml + '</div>'
        + '<div class="tb-mascot-helper">'
        + '<img src="/assets/amz/mascot-credit-card.png" alt="小唤">'
        + '<h5>小唤提示</h5>'
        + '<a href="#/appraise" class="tb-helper-link">' + clayIcon('ai', '小唤AI', 'is-sm') + ' 让小唤帮你 AI 估价 ›</a>'
        + '</div>'
        + '<div class="tb-im-side-links">'
        + '<a href="#/me/security">' + navIcon('settings') + '<span>消息设置</span></a>'
        + '<a href="#/community">' + navIcon('community') + '<span>意见反馈</span></a>'
        + '</div>'
        + '</aside>'
        + '</div>'
        + '</section>';

    $('#app').innerHTML = shell('notifications', content);
    var stream = document.getElementById('tb-chat-stream');
    if (stream) stream.scrollTop = 0;
    updateImBottomPill();
    refreshNoticeCount();
    if (desktopRuntime.imPollTimer) clearInterval(desktopRuntime.imPollTimer);
    desktopRuntime.imPollTimer = setInterval(refreshImActiveThread, 5000);
}

var imSwipe = null;

function setImMenu(row, open) {
    document.querySelectorAll('.tb-conv-entry.is-open').forEach(function (other) {
        if (other === row && open) return;
        other.classList.remove('is-open');
        other.querySelector('.tb-conv-more').setAttribute('aria-expanded', 'false');
    });
    if (!row || !open) return;
    row.classList.add('is-open');
    row.querySelector('.tb-conv-more').setAttribute('aria-expanded', 'true');
}

function finishImSwipe(ev) {
    var swipe = imSwipe;
    if (!swipe || swipe.pointer !== ev.pointerId) return;
    imSwipe = null;
    if (!swipe.moved) return;
    swipe.row.classList.remove('is-dragging');
    swipe.row.style.removeProperty('--conv-shift');
    if (ev.type === 'pointercancel') return;
    desktopRuntime.imDraggedRow = swipe.row;
    var dx = ev.clientX - swipe.x;
    if (Math.abs(dx) >= 36) setImMenu(swipe.row, dx < 0);
}

function bindMessageGestures() {
    document.addEventListener('pointerdown', function (ev) {
        desktopRuntime.imDraggedRow = null;
        var row = ev.target.closest('.tb-conv-entry');
        if (!row) setImMenu(null, false);
        var face = ev.target.closest('.tb-conv-entry .tb-contact-item');
        if (!face || ev.button !== 0 || !ev.isPrimary) return;
        imSwipe = { row: row, face: face, x: ev.clientX, y: ev.clientY, pointer: ev.pointerId, moved: false };
    });
    document.addEventListener('pointermove', function (ev) {
        var swipe = imSwipe;
        if (!swipe || swipe.pointer !== ev.pointerId) return;
        var dx = ev.clientX - swipe.x;
        if (!swipe.moved) {
            if (Math.abs(ev.clientY - swipe.y) > 10 && Math.abs(ev.clientY - swipe.y) > Math.abs(dx)) {
                imSwipe = null;
                return;
            }
            if (Math.abs(dx) < 10) return;
            swipe.moved = true;
            swipe.face.setPointerCapture(ev.pointerId);
        }
        var width = swipe.row.querySelector('.tb-conv-actions').offsetWidth;
        var offset = (swipe.row.classList.contains('is-open') ? -width : 0) + dx;
        swipe.row.classList.add('is-dragging');
        swipe.row.style.setProperty('--conv-shift', Math.max(-width, Math.min(0, offset)) + 'px');
    });
    document.addEventListener('pointerup', finishImSwipe);
    document.addEventListener('pointercancel', finishImSwipe);
    document.addEventListener('keydown', function (ev) {
        if (ev.key !== 'Escape') return;
        var row = $('.tb-conv-entry.is-open');
        if (!row) return;
        if (row.contains(document.activeElement)) row.querySelector('.tb-conv-more').focus();
        setImMenu(null, false);
    });
}

export { bindMessageGestures, imSwipe, patchImRightPanel, renderNotifications, setImMenu };
