import { clayIcon, navIcon } from "../../components/desktop/icons.js";
import { shell } from "../../components/desktop/shell.js";
import { go } from "../../router/desktop/navigation.js";
import { CATS } from "../../utils/desktop/catalog.js";
import { $, esc } from "../../utils/desktop/dom.js";

function openEstimate() {
    go('#/appraise');
}

function renderAppraise() {
    var catButtons = CATS.map(function (c, i) {
        return '<button type="button" class="ai-chip ' + (i === 1 ? 'on' : '') + '" data-act="ai-pick-cat" data-v="' + esc(c) + '">' + esc(c) + '</button>';
    }).join('');
    var condOptions = [
        ['new', '全新', '90%~95% 保值'],
        ['light', '九成新', '65%~80% 热换'],
        ['seven', '七成新', '45%~65% 性价比'],
        ['used', '有使用痕迹', '25%~45% 秒出']
    ].map(function (c, i) {
        return '<button type="button" class="ai-chip ' + (i === 1 ? 'on' : '') + '" data-act="ai-pick-cond" data-v="' + esc(c[0]) + '"><b>' + c[1] + '</b><small>' + c[2] + '</small></button>';
    }).join('');

    var sampleBenchmarks = [
        {name: '罗技 GPW 二代无线游戏鼠标', cat: '数码', orig: 599, est: '260 ~ 320', cond: 'light', img: '/assets/amz/quad-digital-compact.webp'},
        {name: '2026同济高数+张宇1000题全套', cat: '教材', orig: 128, est: '35 ~ 55', cond: 'light', img: '/assets/amz/quad-books-compact.webp'},
        {name: '富士 Instax mini11 拍立得相机', cat: '数码', orig: 520, est: '280 ~ 350', cond: 'new', img: '/assets/amz/quad-auction-compact.webp'},
        {name: '米家智能LED长臂护眼台灯 1S', cat: '生活', orig: 149, est: '55 ~ 80', cond: 'light', img: '/assets/amz/quad-dorm-compact.webp'},
        {name: '尤尼克斯 24磅碳素羽毛球拍', cat: '运动', orig: 260, est: '110 ~ 145', cond: 'light', img: '/assets/amz/quad-sports-compact.webp'},
        {name: '卡西欧 fx-991CN X 函数计算器', cat: '教材', orig: 135, est: '50 ~ 75', cond: 'new', img: '/assets/amz/quad-grad-compact.webp'}
    ].map(function (b) {
        return '<div class="ai-bench-row">'
            + '<img src="' + b.img + '" alt="">'
            + '<div class="ai-bench-info"><b>' + esc(b.name) + '</b><span>原价 ¥' + b.orig + '</span></div>'
            + '<div class="ai-bench-price"><b>¥' + b.est + '</b><button type="button" data-act="ai-fill-bench" data-name="' + esc(b.name) + '" data-orig="' + b.orig + '">填入测算</button></div>'
            + '</div>';
    }).join('');

    var content = '<nav class="amz-breadcrumb" aria-label="面包屑"><a href="#/home">首页</a><span>›</span><b>AI 好物估价</b></nav>'
        + '<div class="ali-auction-page ai-appraise-page">'
        + '<header class="amz-page-bar">'
        + '<h1>小唤 AI 好物估价中心</h1>'
        + '<div class="amz-page-bar-links">'
        + '<a href="#/idle">去集市比价</a>'
        + '<a href="#/idle?tab=auctions">校园拍卖</a>'
        + '<a href="#/idle?tab=relay">换物接力</a>'
        + '<a class="btn btn-primary btn-sm" href="#/publish">+ 发布闲置</a>'
        + '</div>'
        + '</header>'

        + '<div class="ai-workbench-grid">'
        + '<section class="ai-main-card">'
        + '<div class="ai-card-head">'
        + '<div><h2>AI 智能估价</h2></div>'
        + '</div>'

        + '<form class="estimate-form ai-form-body" data-form="estimate">'
        + '<label class="ai-upload-zone" for="ai-photo-input">'
        + '<input id="ai-photo-input" type="file" accept="image/*" hidden data-act="ai-photo">'
        + '<span class="ai-corner tl"></span><span class="ai-corner tr"></span><span class="ai-corner bl"></span><span class="ai-corner br"></span>'
        + '<div id="ai-photo-preview" class="ai-upload-inner">'
        + '<span class="ai-cam-ico">' + navIcon('camera') + '</span>'
        + '<b>上传物品图片（选填）</b>'
        + '</div>'
        + '</label>'

        + '<div class="ai-input-row">'
        + '<div class="ai-field">'
        + '<label class="label" for="estimate-title">物品名称</label>'
        + '<input class="input" id="estimate-title" name="title" placeholder="例如 罗技 GPW 二代 / 同济高数第七版">'
        + '</div>'
        + '<div class="ai-field">'
        + '<label class="label" for="estimate-price">入手原价（元）*</label>'
        + '<input class="input" id="estimate-price" name="price" type="number" min="1" max="100000" placeholder="¥ 请输入入手价，如 299" required>'
        + '</div>'
        + '</div>'

        + '<input type="hidden" id="ai-cat-input" name="category" value="数码">'
        + '<input type="hidden" id="estimate-condition" name="condition" value="light">'

        + '<div class="ai-chip-section">'
        + '<span class="ai-sec-label">所属分类</span>'
        + '<div class="ai-chip-grid">' + catButtons + '</div>'
        + '</div>'

        + '<div class="ai-chip-section">'
        + '<span class="ai-sec-label">新旧成色</span>'
        + '<div class="ai-chip-grid cond-grid">' + condOptions + '</div>'
        + '</div>'

        + '<div class="ai-submit-row">'
        + '<button class="btn btn-primary ai-submit-btn" type="submit">' + clayIcon('ai', 'AI', 'is-sm') + ' 立即开始 AI 智能估价</button>'
        + '</div>'

        + '<div id="ai-mascot-Evaluating" class="ai-evaluating-box" hidden>'
        + '<img src="/assets/brand/mascot-search.png" alt="小唤正在估价中" class="ai-eval-mascot">'
        + '<div><b>小唤正在为您估价…</b></div>'
        + '</div>'

        + '<div id="estimate-result" class="ai-result-panel" role="status">'
        + '<div class="ai-result-placeholder">'
        + '<img src="/assets/brand/mascot-wave-320.webp" alt="小唤">'
        + '<div><b>输入入手原价后点击上方按钮，小唤立即给出参考价</b></div>'
        + '</div>'
        + '</div>'
        + '</form>'
        + '</section>'

        + '<aside class="ai-side-col">'
        + '<div class="ai-mascot-hero-card">'
        + '<div class="ai-mascot-art-wrap"><img src="/assets/amz/mascot-credit-card.png" alt="小唤"></div>'
        + '<div class="ai-mascot-copy">'
        + '<span class="ai-advisor-tag">小唤估价助手</span>'
        + '<h3>“拿不准定什么价？让小唤帮你算！”</h3>'
        + '</div>'
        + '</div>'

        + '<div class="ai-bench-card">'
        + '<div class="ai-bench-head"><h3>热门估价参考</h3></div>'
        + '<div class="ai-bench-list">' + sampleBenchmarks + '</div>'
        + '</div>'
        + '</aside>'
        + '</div>'
        + '</div>';

    $('#app').innerHTML = shell('appraise', content);
}

export { openEstimate, renderAppraise };
