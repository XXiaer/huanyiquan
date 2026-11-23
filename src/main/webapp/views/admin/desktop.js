import { shell } from "../../components/desktop/shell.js";
import { desktopRuntime, state } from "../../router/desktop/state.js";
import { api } from "../../utils/desktop/api.js";
import { $, esc } from "../../utils/desktop/dom.js";
import { firstImage, fmtRel } from "../../utils/desktop/format.js";
import { auctionCard } from "../market/auction-desktop.js";

var adminSections = [
    ['dashboard','运营概览'], ['items','物品审核'], ['auctions','拍卖管理'],
    ['disputes','面交争议'], ['report','举报处理'], ['users','账号管理'], ['exchanges','交换记录'], ['activity','操作日志']
];

var adminRenderVersion = 0;

function adminTable(columns, rows) {
    if (!rows.length) return '<p class="admin-empty">暂无记录</p>';
    return '<div class="admin-table-wrap"><table class="admin-table"><thead><tr>'
        + columns.map(function (label) { return '<th scope="col">'+esc(label)+'</th>'; }).join('')
        + '</tr></thead><tbody>' + rows.map(function (row) {
            return '<tr>'+row.map(function (cell) { return '<td>'+cell+'</td>'; }).join('')+'</tr>';
        }).join('') + '</tbody></table></div>';
}

async function renderAdmin() {
    var version = ++adminRenderVersion;
    var tab = state.adminTab;
    var body = '';

    if (tab === 'disputes') {
        var disputes = await api('/admin/exchange-disputes');
        body = disputes.map(function (d) {
            return '<section class="card card-pad"><h2>交换单 #' + Number(d.exchangeId) + '</h2>'
                + '<p>发起人 #' + Number(d.openedBy) + '：' + esc(d.reason) + '</p>'
                + (d.resolution ? '<p>裁决：' + esc(d.resolution) + '</p>' : '')
                + '<button class="btn btn-ghost" data-act="dispute-review" data-id="' + Number(d.exchangeId)
                + '" data-resolved="' + (d.resolution ? 1 : 0) + '">查看说明</button></section>';
        }).join('') || '<p class="admin-empty">暂无面交争议</p>';
    } else if (tab === 'report') {
        var reports = await api('/admin/report?status='+state.adminReportStatus);
        var rows = (reports || []).map(function (r) {
            return '<div class="card card-pad" style="margin-bottom:10px">'
                + '<div style="display:flex;gap:6px;align-items:center;margin-bottom:6px">'
                + '<span class="amz-status-txt danger">' + (r.targetType === 1 ? '物品' : '用户') + ' #' + r.targetId + '</span>'
                + '<span style="flex:1"></span><span class="hint" style="margin:0">' + fmtRel(r.createTime) + '</span></div>'
                + '<p style="margin:0 0 4px;font-size:14px">' + esc(r.reason) + '</p>'
                + '<p class="hint" style="margin:0">举报人 ' + esc(r.reporterNickname || '匿名')
                + (r.targetTitle ? ' | 对象「' + esc(r.targetTitle) + '」' : '') + '</p>'
                + (state.adminReportStatus === 0 ? '<div class="btn-row" style="margin-top:10px">'
                + '<button class="btn btn-sm btn-primary" data-act="report-act" data-id="' + r.id + '" data-do="approve">认定违规</button>'
                + '<button class="btn btn-sm btn-ghost" data-act="report-act" data-id="' + r.id + '" data-do="reject">驳回</button>'
                + '</div>' : (r.handleNote ? '<p class="hint">'+esc(r.handleNote)+'</p>' : '')) + '</div>';
        }).join('');
        body = '<div class="admin-toolbar">' + ['待处理','已认定','已驳回'].map(function(label, index) {
            return '<button class="chip '+(state.adminReportStatus === index ? 'on' : '')+'" data-act="admin-report-status" data-v="'+index+'">'+label+'</button>';
        }).join('') + '</div>' + (rows || '<p class="admin-empty">此状态暂无举报</p>');
    } else if (tab === 'items') {
        var items = await api('/admin/items');
        body = items.length ? items.map(function(it) { var img=firstImage(it.images); return '<article class="auction-card">'+(img?'<img class="auction-image" src="'+esc(img)+'" alt="">':'')+'<h2>'+esc(it.title)+'</h2><p>'+esc(it.description || '')+'</p><p class="hint">发布者：'+esc(it.ownerNickname)+'</p><div class="btn-row"><button class="btn btn-sm btn-primary" data-act="review-listing" data-kind="items" data-do="approve" data-id="'+it.id+'">通过</button><button class="btn btn-sm" data-act="review-listing" data-kind="items" data-do="reject" data-id="'+it.id+'">驳回</button></div></article>'; }).join('') : '<div class="card card-pad">没有待审核物品</div>';
    } else if (tab === 'auctions') {
        var auctions = await api('/admin/auctions');
        body = auctions.length ? auctions.map(function(a) { return auctionCard(a, 'admin'); }).join('') : '<div class="card card-pad">暂无拍卖</div>';
    } else if (tab === 'users') {
        var users = await api('/admin/users?q='+encodeURIComponent(state.adminUserQuery));
        body = '<form class="admin-toolbar" data-form="admin-user-search"><input class="input" name="q" maxlength="60" aria-label="按学号或昵称查找" placeholder="输入学号或昵称" value="'+esc(state.adminUserQuery)+'"><button class="btn btn-primary">搜索</button></form>'
            + adminTable(['学号','昵称','信用分','身份','状态','操作'], users.map(function(u) {
                var action = u.status === 1 ? 'suspend' : 'restore';
                return [esc(u.studentNo), esc(u.nickname), u.credit, u.role === 1 ? '管理员' : '普通用户',
                    u.status === 1 ? '正常' : '已停用', u.role === 0
                        ? '<button class="btn btn-sm btn-ghost" data-act="admin-user-status" data-id="'+Number(u.id)+'" data-do="'+action+'">'+(action === 'suspend' ? '停用' : '恢复')+'</button>' : '—'];
            }));
    } else if (tab === 'exchanges') {
        var exchanges = await api('/admin/exchanges');
        var statuses = ['','待确认','待交付','已完成','已失效','已超时关闭','争议处理中'];
        body = adminTable(['交换单','类型','状态','面交地点','创建时间'], exchanges.map(function(e) {
            return ['#'+Number(e.id),e.type === 3 ? '三方成环' : '一对一', statuses[e.status] || '未知',esc(e.place || '待约定'),esc(e.createTime)];
        }));
    } else if (tab === 'activity') {
        var activity = await api('/admin/activity');
        var types = {ITEM:'物品', USER:'账号', OFFER:'报价', EXCHANGE:'交换单', REPORT:'举报'};
        body = adminTable(['时间','操作者','对象','记录'], activity.map(function(entry) {
            return [esc(entry.createTime),entry.actor == null ? '系统' : '#'+Number(entry.actor),
                esc(types[entry.type] || entry.type)+' #'+Number(entry.target),esc(entry.remark)];
        }));
    } else {
        var d = await api('/admin/dashboard');
        var hot = (d.hotCategories || []).map(function (h, i) {
            var w = d.itemCount ? Math.round(h.total * 100 / d.itemCount) : 0;
            return '<div style="margin-bottom:10px">'
                + '<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px">'
                + '<span>' + esc(h.category) + '</span><span class="num" style="color:var(--ink-400)">'
                + h.total + ' 件</span></div>'
                + '<div style="height:8px;border-radius:4px;background:var(--bg);overflow:hidden">'
                + '<div style="width:' + w + '%;height:100%;border-radius:4px;background:linear-gradient(90deg,var(--theme-color),var(--theme-ink))"></div>'
                + '</div></div>';
        }).join('');
        body = '<div class="stats">'
            + '<div class="stat"><p class="k">成交数</p><p class="v num">' + d.dealCount + '</p></div>'
            + '<div class="stat"><p class="k">三方环完成率</p><p class="v num">' + d.ringRate + '%</p><p class="hint">' + d.ringDone + '/' + d.ringTotal + ' 单完成</p></div>'
            + '<div class="stat"><p class="k">在架物品</p><p class="v num">' + d.onShelfCount + '</p></div>'
            + '<div class="stat"><p class="k">用户数</p><p class="v num">' + d.userCount + '</p></div>'
            + '</div>'
            + '<div class="card card-pad" style="margin-top:14px">'
            + '<div class="section-title" style="margin:0 0 12px"><h2 style="font-size:16px">热门类别</h2>'
            + '<span class="more">共 ' + d.itemCount + ' 件</span></div>' + (hot || '<p class="hint">暂无数据</p>')
            + '</div>'
            + '<div class="card card-pad" style="margin-top:14px">'
            + '<p class="hint" style="margin:0 0 10px">三方环：共 ' + d.ringTotal + ' 单，完成 ' + d.ringDone
            + ' 单。待处理举报 ' + d.pendingReport + ' 条。</p>'
            + '<button class="btn btn-ghost btn-sm" data-act="reset-demo">重置演示数据</button>'
            + '</div>';
    }

    if (version !== adminRenderVersion || desktopRuntime.currentView.name !== 'admin' || tab !== state.adminTab) return;
    var navigation = adminSections.map(function(section) {
        var selected = tab === section[0];
        return '<button class="'+(selected?'on':'')+'" aria-pressed="'+selected+'" data-act="admin-tab" data-v="'+section[0]+'">'+section[1]+'</button>';
    }).join('');
    var title = adminSections.find(function(section) { return section[0] === tab; })[1];
    var adminInner = '<nav class="admin-side" aria-label="运营后台"><h1>运营后台</h1>' + navigation
        + '</nav><section class="admin-main"><header class="admin-heading"><h2>' + title + '</h2>'
        + '<button class="btn btn-ghost btn-sm" data-act="admin-refresh">刷新</button></header>' + body + '</section>';
    var adminRoot = $('.admin-workspace');
    if (adminRoot) {
        var prevAdminY = window.scrollY;
        var prevAdminSideY = ($('.admin-side') && $('.admin-side').scrollTop) || 0;
        adminRoot.innerHTML = adminInner;
        var nextAdminSide = $('.admin-side');
        if (nextAdminSide) nextAdminSide.scrollTop = prevAdminSideY;
        window.scrollTo(window.scrollX, prevAdminY);
    } else {
        $('#app').innerHTML = shell('admin', '<div class="admin-workspace">' + adminInner + '</div>');
    }
}

export { renderAdmin };
