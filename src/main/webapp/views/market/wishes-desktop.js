import { shell } from "../../components/desktop/shell.js";
import { go } from "../../router/desktop/navigation.js";
import { desktopRuntime, state } from "../../router/desktop/state.js";
import { api, readToken } from "../../utils/desktop/api.js";
import { CATS } from "../../utils/desktop/catalog.js";
import { $, esc } from "../../utils/desktop/dom.js";

async function renderWishCreate() {
    const myItems = await api('/item/mine?status=1').catch(() => []);
    var offerOptions = myItems.map(function (item) {
        return '<option value="' + Number(item.id) + '">' + esc(item.title) + '</option>';
    }).join('');
    $('#app').innerHTML = shell('wishes', '<main class="redesign-page"><h1>发布求换心愿</h1>'
        + '<form data-form="wish-new" style="margin-top:12px">'
        + '<div class="field"><label class="label">我想换</label><input class="input" name="title" maxlength="100" placeholder="高数习题集 / 罗技鼠标" required></div>'
        + '<div class="field"><label class="label">分类</label><select class="select" name="category"><option value="">全部类别</option>' + CATS.map(function (c) { return '<option>' + esc(c) + '</option>'; }).join('') + '</select></div>'
        + '<div class="field"><label class="label">我拿什么换（选填）</label><select class="select" name="offeredItemId"><option value="">不关联在架物品</option>' + offerOptions + '</select></div>'
        + '<div class="field"><label class="label">备注</label><input class="input" name="content" maxlength="500" placeholder="成色要求或交接书院（选填）"></div>'
        + '<button class="btn btn-primary btn-block" type="submit">发布求换心愿</button>'
        + '</form></main>');
}

var DEMO_WISHES = [
    {id: 701, isDemo: true, state: 'active', category: '数码', title: '【急求】求换一套罗技 GPW 无线鼠标或 68 键茶轴机械键盘，可拿 iPad 电容笔或耳机换', content: '北山书院随时可当面试手感，成色九成新以上即可，差价可协商贴补。', nickname: '北山电竞阿泽', campus: '北山书院', stage: '数码急求', budget: 240, offerText: '提供：电容笔/降噪耳机', views: 1420, replyCount: 9, image: '/assets/amz/quad-digital-compact.webp'},
    {id: 702, isDemo: true, state: 'active', category: '教材', title: '【考研刚需】求换 2026 张宇考研数学 1000 题 + 同济高数第七版上下册（带笔记更佳）', content: '南山书院或图书馆一楼交接，手里有全套六级真题、C语言教材或瑞幸咖啡券可换。', nickname: '南山学妹小林', campus: '南山书院', stage: '教材求换', budget: 45, offerText: '提供：六级真题/饮品券', views: 1180, replyCount: 14, image: '/assets/amz/quad-books-compact.webp'},
    {id: 703, isDemo: true, state: 'active', category: '运动', title: '【球场约球】求换一把尤尼克斯或胜利羽毛球拍（24磅左右），拿斯伯丁篮球或滑板换', content: '风雨球场当场试拍，拍框无裂痕即可，送两筒全新羽毛球。', nickname: '风雨球场阿杰', campus: '松格书院', stage: '运动互换', budget: 110, offerText: '提供：斯伯丁7号篮球', views: 960, replyCount: 7, image: '/assets/amz/quad-sports-compact.webp'},
    {id: 704, isDemo: true, state: 'active', category: '生活', title: '【宿舍改造】求换米家充电长臂护眼台灯 + 寝室床上小桌板，拿复古火漆印章礼盒换', content: '竹逸书院楼下自提，希望台灯续航正常，桌面书立也可一起打包换。', nickname: '竹逸桌搭糖糖', campus: '竹逸书院', stage: '宿舍神器', budget: 55, offerText: '提供：火漆印章全套礼盒', views: 850, replyCount: 6, image: '/assets/amz/quad-dorm-compact.webp'},
    {id: 705, isDemo: true, state: 'active', category: '数码', title: '【摄影心愿】求换富士 Instax mini11/mini12 拍立得相机，拿漫步者头戴降噪耳机等价换', content: '社团外拍活动急用，菊轩书院或芳华书院当面验机，相纸可另外折算。', nickname: '菊轩摄影小鹿', campus: '菊轩书院', stage: '等价互换', budget: 290, offerText: '提供：漫步者W820NB耳机', views: 1890, replyCount: 16, image: '/assets/amz/quad-auction-compact.webp'},
    {id: 706, isDemo: true, state: 'active', category: '教材', title: '【期末必备】求换卡西欧 fx-991CN X 中文函数计算器 + 工程制图尺规套盒', content: '大一工科萌新期末急需，支持北山斋或第一食堂当面交接。', nickname: '智能工程萌新', campus: '北山书院', stage: '期末急求', budget: 50, offerText: '提供：全新移动电源/课外书', views: 1090, replyCount: 11, image: '/assets/amz/quad-grad-compact.webp'},
    {id: 707, isDemo: true, state: 'active', category: '其他', title: '【潮玩手办】求换泡泡玛特 SKULLPANDA 温度系列盲盒或动漫桌面手办，可多换一', content: '爱莲书院一楼大厅面交，有拆盒未拆袋重复款可互换补齐图鉴。', nickname: '爱莲盲盒控', campus: '爱莲书院', stage: '同好互换', budget: 69, offerText: '提供：同系列隐藏/热门款', views: 1310, replyCount: 12, image: '/assets/amz/quad-wishes-compact.webp'},
    {id: 708, isDemo: true, state: 'active', category: '生活', title: '【毕业收纳】求换大容量牛津布衣物收纳箱×2 或 24 寸拉杆行李箱，拿桌面显示器支架换', content: '下周搬寝室急用，轮子顺滑无破损即可，松格书院可帮忙下楼搬运。', nickname: '松格大四学长', campus: '松格书院', stage: '急求好物', budget: 75, offerText: '提供：铝合金显示器增高架', views: 790, replyCount: 5, image: '/assets/amz/quad-delivery-compact.webp'},
    {id: 709, isDemo: true, state: 'settled', category: '数码', title: '【已达成心愿】求换 Keychron K2 无线双模机械键盘，已与大数据学院同学完成互换', content: '图书馆一楼大厅当面试轴交接完毕，换一圈匹配速度超快！', nickname: '南山极客阿伟', campus: '图书馆大厅', stage: '已达成', budget: 165, offerText: '已用：索尼SRS便携音箱交换', views: 2040, replyCount: 19, image: '/assets/amz/quad-swap-compact.webp'},
    {id: 710, isDemo: true, state: 'active', category: '绿植', title: '【阳台绿植】求换宿舍好养活的多肉拼盘、龟背竹或郁金香种球，拿手冲咖啡壶套装换', content: '梅若书院向阳阳台养护，希望带陶瓷花盆一起交换。', nickname: '梅若园艺社', campus: '梅若书院', stage: '绿植互换', budget: 35, offerText: '提供：法压壶+咖啡豆礼盒', views: 670, replyCount: 8, image: '/assets/amz/quad-community-compact.webp'}
];

function wishAuctionCard(w) {
    var isSettled = w.state === 'settled';
    var isMine = state.me && w.userId === state.me.id;
    var fallbackImgs = ['/assets/amz/quad-wishes-compact.webp', '/assets/amz/quad-books-compact.webp', '/assets/amz/quad-digital-compact.webp', '/assets/amz/quad-dorm-compact.webp', '/assets/amz/quad-sports-compact.webp'];
    var img = w.image || fallbackImgs[Math.abs(Number(w.id || 0)) % fallbackImgs.length];
    var swapLabel = w.offerText ? String(w.offerText).replace(/^提供：/, '拿 ').replace(/^已用：/, '已用 ') : ('心理价 ¥' + (w.budget || 50));
    var btnHtml = isMine
        ? '<button type="button" class="clean-act-btn is-muted" data-act="wish-close" data-id="' + w.id + '">关闭</button>'
        : '<button type="button" class="clean-act-btn is-amber ' + (isSettled ? 'is-muted' : '') + '" data-act="wish-respond" data-id="' + w.id + '">' + (isSettled ? '查看详情' : (w.isDemo ? '去响应' : '响应')) + '</button>';
    return '<article class="wish-card-clean">'
        + '<div class="clean-card-media" style="cursor:pointer" data-act="wish-respond" data-id="' + w.id + '">'
        + '<img src="' + esc(img) + '" onerror="this.onerror=null;this.src=\'/assets/amz/quad-wishes-compact.webp\'" alt="' + esc(w.title) + '" loading="lazy">'
        + (isSettled ? '<span class="clean-state-tag is-done">已达成</span>' : '')
        + '</div>'
        + '<div class="clean-card-body">'
        + '<h2 class="clean-card-title" title="' + esc(w.title) + '">' + esc(w.title) + '</h2>'
        + '<div class="clean-card-meta-row">'
        + '<span class="wish-swap-line" title="' + esc(swapLabel) + '">' + esc(swapLabel) + '</span>'
        + btnHtml
        + '</div>'
        + '</div>'
        + '</article>';
}

async function renderWishes() {
    var prevWishY = window.scrollY;
    var existingWishRoot = $('.wish-bounty-page');
    if (existingWishRoot) existingWishRoot.setAttribute('aria-busy', 'true');
    var offered = (await api('/item/mine?status=1', {optionalAuth: true}).catch(function () { return []; })).filter(function (item) { return item.allowCycle && !item.isDemo; });
    var offerOptions = offered.map(function (item) { return '<option value="' + Number(item.id) + '">' + esc(item.title) + '</option>'; }).join('');
    var matched = desktopRuntime.currentView.name === 'wishes' ? desktopRuntime.currentView.arg : null;
    var wishes = await api('/wish' + (matched ? '/' + matched : ''), {optionalAuth: true}).catch(function () { return []; });
    var displayList = (wishes || []).concat(DEMO_WISHES);

    var wCat = state.wishCat || '全部';
    var wShown = wCat === '全部' ? displayList : displayList.filter(function (w) {
        return w.category === wCat || String(w.title + ' ' + (w.offerText || '')).indexOf(wCat) >= 0;
    });
    var wishGridInner = wShown.length
        ? wShown.map(wishAuctionCard).join('')
        : '<div class="card card-pad" style="grid-column:1/-1;text-align:center">当前分类暂无求换心愿 <button type="button" class="btn btn-sm btn-primary" data-act="wish-cat" data-v="全部">查看全部</button></div>';

    var wishRoot = $('.wish-bounty-page');
    if (wishRoot && wishRoot.querySelector('.wish-bounty-grid')) {
        wishRoot.removeAttribute('aria-busy');
        wishRoot.querySelectorAll('[data-act="wish-cat"]').forEach(function (btn) {
            btn.classList.toggle('on', (btn.dataset.v || '全部') === wCat);
        });
        var allWishBtn = wishRoot.querySelector('.wish-banner-cats [data-act="wish-cat"][data-v="全部"]');
        if (allWishBtn) allWishBtn.textContent = '全部 (' + displayList.length + ')';
        wishRoot.querySelector('.wish-bounty-grid').innerHTML = wishGridInner;
        window.scrollTo(window.scrollX, prevWishY);
        return;
    }

    var content = '<div class="wish-bounty-page">'
        + '<header class="wish-top-banner">'
        + '<div class="wish-banner-left">'
        + '<img src="/assets/brand/mascot-wave-320.webp" alt="小唤">'
        + '<div><h1>求换心愿专区</h1></div>'
        + '</div>'
        + '<nav class="wish-banner-cats" aria-label="求换分类">'
        + [['全部', '全部 (' + displayList.length + ')'], ['数码', '数码外设'], ['教材', '考研教材'], ['运动', '运动户外'], ['生活', '宿舍生活']].map(function (c) {
            return '<button type="button" class="' + (wCat === c[0] ? 'on' : '') + '" data-act="wish-cat" data-v="' + c[0] + '">' + c[1] + '</button>';
        }).join('')
        + '<a href="#/relay">换物接力</a>'
        + '<a href="#/auctions">校园拍卖</a>'
        + '</nav>'
        + '</header>'

        + '<div class="wish-workbench">'
        + '<aside class="wish-sidebar">'
        + '<form id="ali-wish-composer" class="wish-composer-card wish-form" data-form="wish-new">'
        + '<h2>发布求换心愿</h2>'
        + '<div class="field"><label class="label">我想换</label><input class="input" name="title" maxlength="100" placeholder="高数习题集 / 罗技鼠标" required></div>'
        + '<div class="field"><label class="label">分类</label><select class="select" name="category"><option value="">全部类别</option>' + CATS.map(function (c) { return '<option>' + esc(c) + '</option>'; }).join('') + '</select></div>'
        + '<div class="field"><label class="label">我拿什么换</label><select class="select" id="wish-offer" name="offeredItemId"><option value="">不关联在架物品</option>' + offerOptions + '</select></div>'
        + '<div class="field"><label class="label">备注</label><input class="input" name="content" maxlength="500" placeholder="成色要求或交接书院（选填）"></div>'
        + '<button class="btn wish-submit-btn btn-block" type="submit">发布求换</button>'
        + '</form>'
        + '</aside>'

        + '<main class="wish-main">'
        + '<div class="wish-bounty-grid">'
        + wishGridInner
        + '</div>'
        + '</main>'
        + '</div>'
        + '</div>';

    $('#app').innerHTML = shell('wishes', content);
}

export { DEMO_WISHES, renderWishCreate, renderWishes, wishAuctionCard };
