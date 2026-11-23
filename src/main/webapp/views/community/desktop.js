import { clayIcon } from "../../components/desktop/icons.js";
import { openSheet } from "../../components/desktop/sheet.js";
import { shell } from "../../components/desktop/shell.js";
import { toast } from "../../components/desktop/toast.js";
import { desktopRuntime, state } from "../../router/desktop/state.js";
import { api } from "../../utils/desktop/api.js";
import { $, esc } from "../../utils/desktop/dom.js";
import { firstImage } from "../../utils/desktop/format.js";

var communityLoading = false;

function communityMessage(m) {
    var time=String(m.createdAt || '').replace('T',' ').slice(5,16);
    var body = m.kind==='image' ? '<a href="'+esc(m.image)+'" target="_blank" rel="noopener"><img class="chat-image" src="'+esc(m.image)+'" alt="社区图片"></a>' : '';
    if(m.kind==='item') { var img=firstImage(m.itemImages); body += m.itemAvailable ? '<button class="chat-item" data-act="go" data-to="#/item/'+m.itemId+'">'+(img?'<img src="'+esc(img)+'" alt="">':'')+'<span><small>分享的物品</small><b>'+esc(m.itemTitle)+'</b>查看详情 →</span></button>' : '<div class="chat-item-unavailable">分享的物品已下架</div>'; }
    if(m.content) body += '<p class="chat-text">'+esc(m.content)+'</p>';
    return '<article class="chat-message '+(state.me && state.me.id===m.userId?'is-mine':'')+'"><div class="chat-avatar">'+esc((m.nickname || '?').slice(0,1))+'</div><div class="chat-message-body"><div class="chat-meta"><b>'+esc(m.nickname)+'</b><time>'+esc(time)+'</time></div><div class="chat-bubble">'+body+'</div></div></article>';
}

async function refreshCommunity(force) {
    var box=$('#chat-messages');
    if (communityLoading || desktopRuntime.currentView.name!=='community' || !box) return;
    communityLoading=true;
    try {
        var messages=await api('/community', {optionalAuth:true});
        box=$('#chat-messages'); if(!box || desktopRuntime.currentView.name!=='community') return;
        var signature=messages.map(function(m){return [m.id,m.itemAvailable,m.itemTitle].join(':');}).join('|');
        if(box.dataset.signature!==signature) {var near=box.scrollHeight-box.scrollTop-box.clientHeight<100;box.innerHTML=messages.length?messages.map(communityMessage).join(''):'<div class="chat-empty">还没有消息，来打个招呼吧。</div>';box.dataset.signature=signature;if(near||force)box.scrollTop=box.scrollHeight;}
    } catch(e){
        if (e && e.code === 401 && $('#chat-messages')) {
            $('#chat-messages').innerHTML='<div class="chat-empty">登录后即可参与全校实时聊天互动 <a href="#/login" class="btn btn-primary btn-sm" style="margin-left:8px">去登录</a></div>';
        } else if(force) toast(e.message || '消息加载失败','err');
    } finally { communityLoading=false; }
}

var TIEBA_ROOMS = [
    {id: 'hall', name: '综合闲置吹水吧', icon: 'fire', cat: '综合', desc: '全校闲置晒单、每日捡漏情报与校园日常讨论', members: 1286, img: '/assets/amz/quad-community-compact.webp', badge: 'LIVE'},
    {id: 'digital', name: '北山数码外设吧', icon: 'ai', cat: '数码', desc: '键鼠耳机显示器验机评测、平价数码互换专场', members: 842, img: '/assets/amz/quad-digital-compact.webp', badge: '99+'},
    {id: 'books', name: '南山考研教材吧', icon: 'order', cat: '教材', desc: '高数真题笔记漂流、各院系专业课二手教材互换', members: 965, img: '/assets/amz/quad-books-compact.webp', badge: '64'},
    {id: 'dorm', name: '松格宿舍好物吧', icon: 'star', cat: '生活', desc: '护眼台灯收纳箱桌搭安利，寝室生活实用好物分享', members: 614, img: '/assets/amz/quad-dorm-compact.webp', badge: '42'},
    {id: 'sports', name: '风雨球场运动吧', icon: 'swap', cat: '运动', desc: '羽毛球拍篮球骑行装备约战，当面试拍换器材', members: 538, img: '/assets/amz/quad-sports-compact.webp', badge: '约球'},
    {id: 'photo', name: '拍立得与潮玩吧', icon: 'auction', cat: '其他', desc: '相机拍立得相纸流转、盲盒手办端盒拆封互换', members: 472, img: '/assets/amz/quad-auction-compact.webp', badge: '热'},
    {id: 'lost', name: '失物招领互助吧', icon: 'pin', cat: '互助', desc: '校园卡雨伞耳机寻主，各书院爱心接力归还', members: 719, img: '/assets/amz/quad-delivery-compact.webp', badge: '置顶'},
    {id: 'game', name: 'ScrapArena街机吧', icon: 'game', cat: '娱乐', desc: '双人同屏格斗约战大厅、战绩晒图与校园排行榜', members: 390, img: '/assets/brand/mascot-box.png', badge: 'PK'}
];

function getAllRooms() {
    var custom = [];
    try { custom = JSON.parse(localStorage.getItem('hq.customRooms') || '[]'); } catch (e) { custom = []; }
    return TIEBA_ROOMS.concat(Array.isArray(custom) ? custom : []);
}

function getRoomFollows() {
    try {
        var arr = JSON.parse(localStorage.getItem('hq.followedRooms') || 'null');
        if (Array.isArray(arr)) return arr;
    } catch (e) {}
    return ['hall', 'digital', 'books'];
}

function setRoomFollows(arr) {
    try { localStorage.setItem('hq.followedRooms', JSON.stringify(arr)); } catch (e) {}
}

function openCreateRoomSheet() {
    var iconOpts = [['fire','热门'],['chat','交流'],['ai','智能'],['order','教材'],['swap','互换'],['auction','潮玩'],['pin','校内'],['game','街机'],['star','种草'],['user','社团']];
    openSheet('<h3>创建我的校园贴吧 / 聊天室</h3>'
        + '<p class="sub">输入吧名与主题后即刻生成专属聊天室，支持同学们发帖晒单与实时聊天。</p>'
        + '<form data-form="create-room" class="tieba-create-form">'
        + '<div class="field"><label class="label">聊天室名称 *</label><input class="input" name="name" maxlength="20" placeholder="如：北山考研资料吧 / 宿舍羽毛球群" required></div>'
        + '<div class="field" style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'
        + '<div><label class="label">所属分类</label><select class="select" name="cat"><option value="综合">综合闲置</option><option value="数码">数码外设</option><option value="教材">考研教材</option><option value="生活">宿舍生活</option><option value="运动">运动户外</option><option value="互助">校园互助</option><option value="娱乐">兴趣街机</option></select></div>'
        + '<div><label class="label">角标徽章（选填）</label><input class="input" name="badge" maxlength="6" placeholder="如：新建 / 热门"></div>'
        + '</div>'
        + '<div class="field"><label class="label">选择小唤图标</label><div class="tieba-icon-picker">'
        + iconOpts.map(function (o, i) {
            return '<label class="tieba-ico-opt"><input type="radio" name="icon" value="' + o[0] + '"' + (i === 0 ? ' checked' : '') + '>' + clayIcon(o[0], o[1]) + '<span>' + o[1] + '</span></label>';
        }).join('')
        + '</div></div>'
        + '<div class="field"><label class="label">吧规与简介</label><textarea class="input" name="desc" rows="2" maxlength="80" placeholder="一句话介绍本聊天室的交流话题或换物规则…"></textarea></div>'
        + '<button type="submit" class="btn btn-primary btn-block">立即创建并进入聊天室</button>'
        + '</form>');
}

var SEEDED_TIEBA_POSTS = [
    {
        id: 1001, roomId: 'hall', tag: '置顶精华', author: '北山书院 电竞阿泽', ava: '北', time: '15 分钟前',
        title: '【晒单互换】大三升级桌面，出九五新罗技 GPW 二代 + 68键机械键盘，或者换 iPad 电容笔',
        body: '成色自己看图，微动清脆盒子和原装伞绳线都在，北山书院一楼大厅可当场连接笔记本试手感，支持三方接力环补差价。',
        imgs: ['/assets/amz/quad-digital-compact.webp', '/assets/amz/quad-swap-compact.webp', '/assets/amz/quad-appraise-compact.webp'],
        likes: 128, cat: '数码',
        comments: [
            {author: '松格小陈', time: '12 分钟前', text: 'GPW 二代白色超耐看！我有一支全新未拆二代电容笔，方便去私聊看看吗？'},
            {author: '南山阿杰', time: '8 分钟前', text: '帮顶好贴，键盘是什么轴体的呀？'}
        ]
    },
    {
        id: 1002, roomId: 'books', tag: '精华资料', author: '南山书院 上岸学姐小林', ava: '南', time: '42 分钟前',
        title: '【考研飘流】整理全套同济高数+张宇1000题手写笔记，欢迎拿宿舍好物或文具来换',
        body: '成功上岸来还愿啦！笔记分章标注了高频考题型，无乱涂乱画，附送整本英语六级高频词册，图书馆一楼随时交接。',
        imgs: ['/assets/amz/quad-books-compact.webp', '/assets/amz/quad-grad-compact.webp'],
        likes: 94, cat: '教材',
        comments: [
            {author: '大二考研党', time: '30 分钟前', text: '沾沾学姐上岸喜气！我有一个米家便携榨汁杯和全新荧光笔套装能换吗？'}
        ]
    },
    {
        id: 1003, roomId: 'digital', tag: '验机评测', author: '菊轩极客老林', ava: '菊', time: '1 小时前',
        title: '【避坑经验】校内面交二手耳机/键盘必看的 4 个检查步骤（实测有效）',
        body: '1. 先让小唤 AI 估价测个基准区间；2. 耳机当场试降噪和左右耳电量均衡；3. 键盘打开在线轴体测试网页全键按一遍；4. 走换一圈平台记录保信用担保！',
        imgs: ['/assets/amz/quad-appraise-compact.webp'],
        likes: 76, cat: '数码',
        comments: [
            {author: '北山萌新', time: '48 分钟前', text: '收藏了！昨晚刚用这招顺利换到漫步者降噪耳机，超稳。'}
        ]
    },
    {
        id: 1004, roomId: 'dorm', tag: '晒单安利', author: '松格桌搭糖糖', ava: '松', time: '2 小时前',
        title: '【宿舍改造】花零元靠以物换物凑齐了护眼台灯+桌面绿植+牛津布收纳箱',
        body: '拿自己闲置的两本专业课书+复古火漆印章礼盒在换一圈换了三件宿舍神器，同寝室友已经全被我安利入坑了。',
        imgs: ['/assets/amz/quad-dorm-compact.webp', '/assets/amz/quad-wishes-compact.webp'],
        likes: 65, cat: '生活',
        comments: []
    },
    {
        id: 1005, roomId: 'sports', tag: '约战换拍', author: '风雨球场科比', ava: '风', time: '3 小时前',
        title: '【今晚7点半】风雨球场3号场约双打，顺便试打这把24磅胜利大鬼斩球拍看谁想换',
        body: '最近换了新拍子，旧的这把手感依然弹，刚换了新吸汗带还送两筒耐打王。球场上边打边试，中意直接发起换物报价！',
        imgs: ['/assets/amz/quad-sports-compact.webp'],
        likes: 58, cat: '运动',
        comments: [
            {author: '竹逸羽球社', time: '2 小时前', text: '算我一个！我带斯伯丁篮球下来，咱们当场交流~'}
        ]
    },
    {
        id: 1006, roomId: 'photo', tag: '同好互换', author: '爱莲摄影小鹿', ava: '爱', time: '昨天',
        title: '富士 Instax mini11 拍立得换漫步者头戴耳机，额外再塞半盒全新相纸',
        body: '机身完全无划痕，欢迎周末一起在学校樱花大道试拍几张直接成环！',
        imgs: ['/assets/amz/quad-auction-compact.webp'],
        likes: 49, cat: '其他',
        comments: []
    },
    {
        id: 1007, roomId: 'lost', tag: '失物招领', author: '图书馆值班同学', ava: '图', time: '今天 11:20',
        title: '【招领】一楼自习区靠窗桌面捡到一把黑色全自动晴雨伞 + 绿色校园卡套',
        body: '已经放在图书馆一楼服务台旁边的蓝框里，失主同学可以直接在本贴留言确认特征来认领~',
        imgs: ['/assets/amz/quad-delivery-compact.webp'],
        likes: 112, cat: '生活',
        comments: []
    },
    {
        id: 1008, roomId: 'game', tag: '约战PK', author: 'Scrap街机冠军', ava: '游', time: '4 小时前',
        title: '【街机约战】来试试新上线的 Scrap Arena 双人同屏格斗！顺便赌一瓶冰可乐换贴纸',
        body: 'P1 用 WASD+JKL，P2 用方向键+123，点右侧“开始对战”就能直接双人同屏切磋，看谁连招最强！',
        imgs: ['/assets/brand/mascot-box.png'],
        likes: 63, cat: '其他',
        comments: []
    }
];

function getTiebaPosts() {
    var custom = [];
    try { custom = JSON.parse(localStorage.getItem('hq.tiebaPosts') || '[]'); } catch (e) { custom = []; }
    var repliesMap = {};
    try { repliesMap = JSON.parse(localStorage.getItem('hq.tiebaReplies') || '{}') || {}; } catch (e) { repliesMap = {}; }
    var likesMap = {};
    try { likesMap = JSON.parse(localStorage.getItem('hq.tiebaLikes') || '{}') || {}; } catch (e) { likesMap = {}; }
    return (Array.isArray(custom) ? custom : []).concat(SEEDED_TIEBA_POSTS).map(function (p) {
        var extraReplies = Array.isArray(repliesMap[p.id]) ? repliesMap[p.id] : [];
        var liked = !!likesMap['u_' + p.id];
        return Object.assign({}, p, {
            liked: liked,
            likesCount: Number(p.likes || 0) + (liked ? 1 : 0),
            allComments: (p.comments || []).concat(extraReplies)
        });
    });
}

var SEEDED_ROOM_CHATS = {
    digital: [
        {nick: '北山电竞阿泽', time: '14:22', text: '今天有人出 68 键三模机械键盘吗？想拿罗技鼠标补一点换'},
        {nick: '菊轩极客老林', time: '14:25', text: '我刚在南山书院那看到同学挂了个 Keychron K2，成色贼新'}
    ],
    books: [
        {nick: '南山学姐小林', time: '10:15', text: '同济高数第七版上下册+张宇1000题还剩最后一套，需要的同学可直接发帖留言'},
        {nick: '智能工程大二生', time: '10:18', text: '求一套卡西欧 fx-991 计算器，下午在北山食堂交接！'}
    ],
    dorm: [
        {nick: '松格桌搭糖糖', time: '19:02', text: '米家护眼台灯 1S 夜间开暖光超舒服，熄灯后充着电也能用好久'}
    ],
    sports: [
        {nick: '风雨球场科比', time: '17:30', text: '7点半风雨球场有人一起试拍吗？顺便切磋两局~'}
    ],
    photo: [
        {nick: '爱莲摄影小鹿', time: '13:10', text: '手上有两盒未拆富士 mini 白边相纸，想换泡泡玛特盲盒或桌面手办'}
    ],
    lost: [
        {nick: '北山热心学长', time: '11:40', text: '在北山三食堂门口捡到一副白色蓝牙耳机盒，请在失物吧联系我核对型号'}
    ],
    game: [
        {nick: 'Scrap街机冠军', time: '20:10', text: '刚刚拿机器人打了 15 连击，谁来 Scrap Arena 挑战一下？'}
    ]
};

function getRoomChats(roomId) {
    var stored = {};
    try { stored = JSON.parse(localStorage.getItem('hq.roomChats') || '{}') || {}; } catch (e) { stored = {}; }
    var extra = Array.isArray(stored[roomId]) ? stored[roomId] : [];
    return (SEEDED_ROOM_CHATS[roomId] || [{nick: '小唤助手', time: '置顶', text: '欢迎来到本主题聊天室！可以直接发文字、图片或晒出在架闲置。'}]).concat(extra);
}

async function renderCommunity() {
    var prevCommY = window.scrollY;
    var rooms = getAllRooms();
    var activeRoomId = state.commRoom || 'hall';
    var activeRoom = rooms.find(function (r) { return r.id === activeRoomId; }) || rooms[0];
    activeRoomId = activeRoom.id;
    state.commRoom = activeRoomId;
    var follows = getRoomFollows();
    var isFollowed = follows.indexOf(activeRoomId) >= 0;
    var activeTab = state.commTab || 'posts';

    var allPosts = getTiebaPosts();
    var roomPosts = activeRoomId === 'hall' ? allPosts : allPosts.filter(function (p) { return p.roomId === activeRoomId; });
    var myShelfItems = state.me ? await api('/item/mine?status=1', {optionalAuth: true}).catch(function () { return []; }) : [];

    var roomNavHtml = rooms.map(function (r) {
        var on = r.id === activeRoomId;
        return '<div class="qq-chan-row">'
            + '<button type="button" class="qq-chan-item sub ' + (on ? 'on' : '') + '" data-act="comm-room" data-room="' + esc(r.id) + '">'
            + clayIcon(r.icon || 'fire', r.name, 'is-sm')
            + '<span>' + esc(r.name) + '</span>'
            + '</button>'
            + (r.custom ? '<button type="button" class="qq-room-del" data-act="delete-custom-room" data-room="' + esc(r.id) + '" title="删除自建聊天室">×</button>' : '')
            + '</div>';
    }).join('');

    var composerBar = activeTab === 'posts'
        ? '<form class="qq-compose-box tieba-composer" data-form="tieba-post">'
          + '<div class="tieba-comp-head">'
          + '<b>' + clayIcon('order', '发帖', 'is-sm') + ' 在「' + esc(activeRoom.name) + '」发表新帖</b>'
          + '<select name="tag" aria-label="帖子标签" class="tieba-tag-select">'
          + '<option value="晒单安利">晒单安利</option><option value="求物互换">求物互换</option><option value="经验分享">经验分享</option><option value="失物招领">失物招领</option><option value="避坑指南">避坑指南</option>'
          + '</select>'
          + '</div>'
          + '<input class="tieba-title-input" name="title" maxlength="90" placeholder="填写帖子标题（例如：出95新机械键盘，或求换同济高数教材）" required>'
          + '<textarea name="body" maxlength="800" rows="3" placeholder="说说成色、期望交换的物品、方便面交的书院地点…" aria-label="帖子正文" required></textarea>'
          + (state.tiebaPostImg ? '<div class="tieba-img-preview"><img src="' + esc(state.tiebaPostImg) + '" alt="配图"><button type="button" data-act="tieba-clear-img">移除配图</button></div>' : '')
          + '<div class="chat-tools qq-compose-bar">'
          + '<div class="qq-tool-btns">'
          + '<label class="chat-tool">' + clayIcon('star', '配图', 'is-sm') + ' 添加配图<input type="file" accept="image/png,image/jpeg,image/webp" data-act="tieba-post-image" hidden></label>'
          + (myShelfItems && myShelfItems.length
              ? '<select name="itemId" class="tieba-item-select" aria-label="关联我的闲置"><option value="">关联在架闲置（选填）</option>'
                + myShelfItems.map(function (it) { return '<option value="' + Number(it.id) + '">' + esc(it.title) + '</option>'; }).join('') + '</select>'
              : '<button type="button" class="chat-tool" data-act="go" data-to="#/publish">' + clayIcon('order', '发布', 'is-sm') + ' 先去发布闲置</button>')
          + '</div>'
          + '<button type="submit" class="btn btn-primary btn-sm">发表到贴吧</button>'
          + '</div></form>'
        : '';

    var postsFeedHtml = roomPosts.length ? roomPosts.map(function (p) {
        var commentsOpen = !!state.tiebaOpenComments[p.id];
        var floorListHtml = p.allComments.map(function (c, cIdx) {
            return '<div class="tieba-floor">'
                + '<span class="tieba-floor-no">' + (cIdx + 1) + '楼</span>'
                + '<b>' + esc(c.author || '移通同学') + '</b>'
                + '<p>' + esc(c.text) + '</p>'
                + '<time>' + esc(c.time || '刚刚') + '</time>'
                + '</div>';
        }).join('');
        return '<article class="qq-post-card tieba-post-card">'
            + '<header class="qq-post-head">'
            + '<span class="qq-post-avatar">' + esc(p.ava || (p.author || '友').slice(0, 1)) + '</span>'
            + '<div><b>' + esc(p.author) + '</b><span>' + esc(p.time) + ' | ' + esc((rooms.find(function (r) { return r.id === p.roomId; }) || activeRoom).name) + '</span></div>'
            + '<span class="qq-post-tag">' + esc(p.tag || '讨论') + '</span>'
            + (p.isUserPost ? '<button type="button" class="tieba-del-btn" data-act="tieba-delete-post" data-id="' + esc(p.id) + '">删帖</button>' : '')
            + '</header>'
            + '<h3>' + esc(p.title) + '</h3>'
            + (p.body ? '<p class="tieba-post-body">' + esc(p.body) + '</p>' : '')
            + (p.imgs && p.imgs.length ? '<div class="qq-post-imgs">' + p.imgs.map(function (src) { return '<img src="' + esc(src) + '" alt="帖子配图" loading="lazy">'; }).join('') + '</div>' : '')
            + (p.itemId ? '<div class="tieba-linked-item"><a href="#/item/' + Number(p.itemId) + '" class="btn btn-sm btn-ghost">' + clayIcon('swap', '关联', 'is-sm') + ' 查看帖子关联闲置：' + esc(p.itemTitle || ('好物 #' + p.itemId)) + ' ›</a></div>' : '')
            + '<footer class="qq-post-foot">'
            + '<button type="button" class="tieba-act-btn ' + (p.liked ? 'on' : '') + '" data-act="tieba-like" data-id="' + esc(p.id) + '">' + clayIcon('fire', '点赞', 'is-sm') + ' <b>' + p.likesCount + '</b></button>'
            + '<button type="button" class="tieba-act-btn ' + (commentsOpen ? 'on' : '') + '" data-act="tieba-toggle-comments" data-id="' + esc(p.id) + '">' + clayIcon('chat', '评论', 'is-sm') + ' <b>' + p.allComments.length + ' 条回复</b></button>'
            + '<a href="#/idle' + (p.cat ? '?cat=' + encodeURIComponent(p.cat) : '') + '">逛同类闲置 ›</a>'
            + '</footer>'
            + '<div class="tieba-comments" ' + (commentsOpen ? '' : 'hidden') + '>'
            + (floorListHtml || '<p class="hint" style="margin:0 0 8px">还没有同学抢沙发，快来抢 1 楼吧~</p>')
            + '<form class="tieba-reply-form" data-form="tieba-reply" data-post-id="' + esc(p.id) + '">'
            + '<input name="reply" maxlength="300" placeholder="写下你的看法或换物意向，回帖占楼…" required>'
            + '<button type="submit" class="btn btn-primary btn-sm">回帖</button>'
            + '</form>'
            + '</div>'
            + '</article>';
    }).join('') : '<div class="card card-pad" style="text-align:center"><p>「' + esc(activeRoom.name) + '」还没有帖子，快在上方发第一帖抢占热帖吧！</p></div>';

    var roomChatHtml = '';
    if (activeTab === 'chat') {
        if (activeRoomId === 'hall') {
            roomChatHtml = '<form class="qq-compose-box chat-compose" data-form="community-text">'
                + '<div class="qq-compose-top">'
                + '<img class="qq-compose-avatar" src="/assets/brand/mascot-wave-320.webp" alt="">'
                + '<textarea name="content" maxlength="500" rows="2" placeholder="在 #' + esc(activeRoom.name) + ' 实时冒泡、求物或分享宝贝…" aria-label="消息内容" required></textarea>'
                + '</div>'
                + '<div class="chat-tools qq-compose-bar">'
                + '<div class="qq-tool-btns">'
                + '<label class="chat-tool">' + clayIcon('star', '发图', 'is-sm') + ' 发送图片<input type="file" accept="image/png,image/jpeg" data-act="community-image" hidden></label>'
                + '<button type="button" class="chat-tool" data-act="community-share">' + clayIcon('order', '晒单', 'is-sm') + ' 晒出我的在架闲置</button>'
                + '<button type="button" class="chat-tool" data-act="go" data-to="#/wishes">' + clayIcon('ai', '心愿', 'is-sm') + ' 发起求换心愿</button>'
                + '</div>'
                + '<button type="submit" class="btn btn-primary btn-sm">发送到聊天室</button>'
                + '</div></form>'
                + '<section class="qq-realtime-card"><div class="qq-realtime-head"><b>' + clayIcon('chat', '聊天', 'is-sm') + ' #' + esc(activeRoom.name) + ' 实时聊天室</b><span>全校同步广播</span></div><div class="chat-messages" id="chat-messages" aria-live="polite"></div></section>';
        } else {
            var rChats = getRoomChats(activeRoomId);
            roomChatHtml = '<form class="qq-compose-box chat-compose" data-form="room-chat-msg" data-room="' + esc(activeRoomId) + '">'
                + '<div class="qq-compose-top">'
                + '<img class="qq-compose-avatar" src="/assets/brand/mascot-wave-320.webp" alt="">'
                + '<textarea name="content" maxlength="400" rows="2" placeholder="在 #' + esc(activeRoom.name) + ' 聊天室发言…" aria-label="聊天内容" required></textarea>'
                + '</div>'
                + '<div class="chat-tools qq-compose-bar">'
                + '<div class="qq-tool-btns">'
                + '<label class="chat-tool">' + clayIcon('star', '图片', 'is-sm') + ' 发送图片<input type="file" accept="image/png,image/jpeg,image/webp" data-act="room-chat-image" data-room="' + esc(activeRoomId) + '" hidden></label>'
                + '<button type="button" class="chat-tool" data-act="comm-tab" data-v="posts">' + clayIcon('order', '发帖', 'is-sm') + ' 去贴吧发长帖</button>'
                + '</div>'
                + '<button type="submit" class="btn btn-primary btn-sm">发送消息</button>'
                + '</div></form>'
                + '<section class="qq-realtime-card"><div class="qq-realtime-head"><b>' + clayIcon(activeRoom.icon || 'chat', '聊天', 'is-sm') + ' #' + esc(activeRoom.name) + ' 房间聊天室</b><span>' + rChats.length + ' 条活跃发言</span></div>'
                + '<div class="chat-messages">' + rChats.map(function (m) {
                    var isMine = state.me && m.nick === state.me.nickname;
                    var bodyHtml = m.image ? '<img class="chat-image" src="' + esc(m.image) + '" alt="聊天图片">' : '';
                    if (m.text) bodyHtml += '<p class="chat-text">' + esc(m.text) + '</p>';
                    return '<article class="chat-message ' + (isMine ? 'is-mine' : '') + '"><div class="chat-avatar">' + esc((m.nick || '友').slice(0, 1)) + '</div><div class="chat-message-body"><div class="chat-meta"><b>' + esc(m.nick) + '</b><time>' + esc(m.time || '刚刚') + '</time></div><div class="chat-bubble">' + bodyHtml + '</div></div></article>';
                }).join('') + '</div></section>';
        }
    }

    var tabBodyHtml = activeTab === 'posts'
        ? composerBar + '<div class="qq-featured-feed">' + postsFeedHtml + '</div>'
        : roomChatHtml;

    var centerInnerHtml = '<header class="tieba-bar-header">'
        + '<div class="tieba-bar-cover"><img src="' + esc(activeRoom.img || '/assets/amz/quad-community-compact.webp') + '" alt=""></div>'
        + '<div class="tieba-bar-meta">'
        + '<div class="tieba-bar-title-row">'
        + '<h1>' + esc(activeRoom.name) + '</h1>'
        + '<button type="button" class="btn btn-sm ' + (isFollowed ? 'btn-ghost' : 'btn-primary') + '" data-act="toggle-follow-room" data-room="' + esc(activeRoomId) + '">' + (isFollowed ? '已关注' : '+ 关注本吧') + '</button>'
        + '</div>'
        + '<div class="qq-hero-stats"><span>关注 ' + (Number(activeRoom.members || 100) + (isFollowed ? 1 : 0)) + '</span><span>帖子 ' + roomPosts.length + '</span></div>'
        + '</div>'
        + '</header>'

        + '<div class="qq-feed-tabs tieba-mode-tabs">'
        + '<button type="button" class="' + (activeTab === 'posts' ? 'on' : '') + '" data-act="comm-tab" data-v="posts">' + clayIcon('order', '看帖', 'is-sm') + ' 看帖与发帖 (' + roomPosts.length + ')</button>'
        + '<button type="button" class="' + (activeTab === 'chat' ? 'on' : '') + '" data-act="comm-tab" data-v="chat">' + clayIcon('chat', '聊天', 'is-sm') + ' 本吧实时聊天室</button>'
        + '<button type="button" class="tieba-tab-cta" data-act="open-create-room">+ 创建聊天室</button>'
        + '</div>'

        + '<div class="qq-tab-body">' + tabBodyHtml + '</div>';

    var commInner = '<aside class="qq-chan-left" aria-label="校园贴吧与聊天室列表">'
        + '<div class="qq-guild-head">'
        + '<img src="/assets/brand/mascot-wave-320.webp" alt="小唤">'
        + '<div><b>换一圈校园贴吧</b><span>' + rooms.length + ' 个聊天室</span></div>'
        + '</div>'
        + '<button type="button" class="btn btn-primary btn-sm btn-block tieba-create-btn" data-act="open-create-room">+ 创建聊天室</button>'
        + '<div class="qq-chan-group" style="margin-top:10px">'
        + '<button type="button" class="qq-chan-item ' + (activeRoomId === 'hall' ? 'on' : '') + '" data-act="comm-room" data-room="hall">' + clayIcon('fire', '热门', 'is-sm') + '<span>全校热帖广场</span></button>'
        + '<a href="#/idle?tab=wishes" class="qq-chan-item">' + clayIcon('swap', '心愿', 'is-sm') + '<span>全校求换心愿榜</span></a>'
        + '<a href="#/appraise" class="qq-chan-item">' + clayIcon('ai', 'AI', 'is-sm') + '<span>AI 估价讨论室</span></a>'
        + '</div>'
        + '<div class="qq-chan-group"><div class="qq-group-title">▾ 专题聊天室</div>'
        + roomNavHtml
        + '</div>'
        + '</aside>'

        + '<main class="qq-chan-center">' + centerInnerHtml + '</main>'

        + '<aside class="qq-chan-right" aria-label="频道侧栏">'
        + '<a href="#/community/city-wheel" class="city-wheel-entry" aria-label="城市转盘"><span class="city-wheel-entry-icon" aria-hidden="true"></span><span><b>城市转盘</b><small>随机抽一座城市</small></span></a>'
        + '<div class="qq-side-card qq-arcade-box">'
        + '<h3>Scrap Arena 街机</h3>'
        + '<img class="qq-arcade-mascot" src="/assets/brand/mascot-wave-320.webp" alt="小唤" width="96" height="96">'
        + '<button class="btn btn-primary" data-act="go" data-to="#/community/game">' + clayIcon('game', '街机', 'is-sm') + ' 开始对战</button>'
        + '</div>'
        + '<div class="qq-side-card">'
        + '<h4>' + clayIcon('fire', '排行榜', 'is-sm') + ' 活跃书院榜</h4>'
        + '<ul class="qq-rank-list">'
        + '<li><b>1</b><span>北山书院</span><em>428 单</em></li>'
        + '<li><b>2</b><span>南山书院</span><em>365 单</em></li>'
        + '<li><b>3</b><span>松格书院</span><em>290 单</em></li>'
        + '<li><b>4</b><span>竹逸书院</span><em>241 单</em></li>'
        + '<li><b>5</b><span>菊轩书院</span><em>198 单</em></li>'
        + '</ul>'
        + '</div>'
        + '</aside>';

    var roomsSig = rooms.map(function (r) { return r.id; }).join(',');
    var commShell = $('.qq-channel-shell');
    var hadCommShell = !!commShell;
    if (commShell && commShell.dataset.roomsSig === roomsSig) {
        var prevLeftY = ($('.qq-chan-left') && $('.qq-chan-left').scrollTop) || 0;
        var prevRightY = ($('.qq-chan-right') && $('.qq-chan-right').scrollTop) || 0;
        var centerEl = commShell.querySelector('.qq-chan-center');
        var tabBodyEl = commShell.querySelector('.qq-tab-body');
        if (centerEl && tabBodyEl && commShell.dataset.room === activeRoomId) {
            tabBodyEl.innerHTML = tabBodyHtml;
            commShell.querySelectorAll('[data-act="comm-tab"]').forEach(function (btn) {
                var on = btn.dataset.v === activeTab;
                btn.classList.toggle('on', on);
                if (btn.dataset.v === 'posts' && btn.closest('.tieba-mode-tabs')) {
                    btn.innerHTML = clayIcon('order', '看帖', 'is-sm') + ' 看帖与发帖 (' + roomPosts.length + ')';
                }
            });
            var followBtn = centerEl.querySelector('[data-act="toggle-follow-room"]');
            if (followBtn) {
                followBtn.className = 'btn btn-sm ' + (isFollowed ? 'btn-ghost' : 'btn-primary');
                followBtn.textContent = isFollowed ? '已关注' : '+ 关注本吧';
            }
            var statsEl = centerEl.querySelector('.qq-hero-stats');
            if (statsEl) {
                statsEl.innerHTML = '<span>关注人数 <b>' + (Number(activeRoom.members || 100) + (isFollowed ? 1 : 0)) + '</b></span><span>贴子总数 <b>' + roomPosts.length + '</b></span>';
            }
        } else if (centerEl) {
            centerEl.innerHTML = centerInnerHtml;
            commShell.dataset.room = activeRoomId;
            commShell.querySelectorAll('[data-act="comm-room"]').forEach(function (btn) {
                btn.classList.toggle('on', btn.dataset.room === activeRoomId);
            });
        } else {
            commShell.innerHTML = commInner;
            commShell.dataset.room = activeRoomId;
        }
        var newLeft = $('.qq-chan-left'), newRight = $('.qq-chan-right');
        if (newLeft) newLeft.scrollTop = prevLeftY;
        if (newRight) newRight.scrollTop = prevRightY;
        window.scrollTo(window.scrollX, prevCommY);
    } else if (commShell) {
        var prevLeftY2 = ($('.qq-chan-left') && $('.qq-chan-left').scrollTop) || 0;
        var prevRightY2 = ($('.qq-chan-right') && $('.qq-chan-right').scrollTop) || 0;
        commShell.innerHTML = commInner;
        commShell.dataset.room = activeRoomId;
        commShell.dataset.roomsSig = roomsSig;
        var newLeft2 = $('.qq-chan-left'), newRight2 = $('.qq-chan-right');
        if (newLeft2) newLeft2.scrollTop = prevLeftY2;
        if (newRight2) newRight2.scrollTop = prevRightY2;
        window.scrollTo(window.scrollX, prevCommY);
    } else {
        $('#app').innerHTML = shell('community', '<div class="qq-channel-shell" data-room="' + esc(activeRoomId) + '" data-rooms-sig="' + esc(roomsSig) + '">' + commInner + '</div>');
    }

    var communityDraft = sessionStorage.getItem('hq.communityDraft');
    if (communityDraft) {
        sessionStorage.removeItem('hq.communityDraft');
        var compose = $('[data-form="tieba-post"] textarea, [data-form="community-text"] textarea');
        if (compose) {
            compose.insertAdjacentHTML('beforebegin', '<p class="community-draft-note">失物招领草稿。补充物品、地点和时间后即可发帖。</p>');
            compose.value = communityDraft;
            compose.focus();
        }
    }
    if (activeTab === 'chat' && activeRoomId === 'hall') {
        await refreshCommunity(true);
        if (hadCommShell) window.scrollTo(window.scrollX, prevCommY);
        if (desktopRuntime.currentView.name === 'community') desktopRuntime.communityTimer = setInterval(function () { refreshCommunity(false); }, 5000);
    }
}

function renderCommunityGame() {
    $('#app').innerHTML=shell('community','<div class="game-page-head"><div><span class="tag">COMMUNITY ARCADE</span><h1>Scrap Arena</h1><p>同一台设备，双人键盘对战。</p></div><div class="btn-row"><button class="btn" data-act="go" data-to="#/community">返回社区</button><a class="btn btn-primary" href="/scrap-arena/index.html" target="_blank" rel="noopener">新窗口打开</a></div></div><div class="game-frame-wrap"><iframe class="game-frame" src="/scrap-arena/index.html" title="Scrap Arena 游戏" allow="fullscreen; autoplay"></iframe></div><p class="game-note">点击游戏画面后开始操作。游戏需要键盘；首次加载资源可能需要几秒。P1：W / A / S / D + J / K / L；P2：方向键 + 1 / 2 / 3。按 Enter 开始。</p>');
}

export {
    getAllRooms,
    getRoomFollows,
    openCreateRoomSheet,
    refreshCommunity,
    renderCommunity,
    renderCommunityGame,
    setRoomFollows,
};
