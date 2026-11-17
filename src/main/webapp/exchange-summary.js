// Derive the handoff and current task from the exchange detail response.
window.exchangeNeedsConfirmation = (exchange) => exchange.type === 3 || exchange.status === 1;

window.exchangeSummary = function (exchange) {
    const people = exchange.details || [];
    const mine = exchange.mine;
    const active = exchange.status === 1 || exchange.status === 2;
    const isMe = (person) => !!mine && person.userId === mine.userId;
    const match = (field, id, userId) => id == null ? null : people.find(
        (person) => person.userId !== userId && person[field] === id
    );
    const recipientFor = (person) => match('getItemId', person.giveItemId, person.userId);
    const status = exchange.status;
    const field = status === 1 ? 'confirmed' : 'delivered';
    const pending = active ? people.filter((person) => !isMe(person) && !person[field]) : [];
    const pendingNames = pending.map((person) => person.nickname || '同学').join('、');
    const pendingFirstMeeting = Boolean(exchange.pendingArrangementId || exchange.pendingArrangement)
        && !(exchange.confirmedArrangementId || exchange.confirmedArrangement);
    let next = '';
    if (status === 2 && mine && !mine.delivered && pendingFirstMeeting) {
        next = '请先共同确认面交安排。';
    } else
        if (active && mine && !mine[field]) {
        next = status === 1 ? '请确认是否参与这次交换。' : '完成面交并验货后，请确认收货。';
    } else if (active) {
        const action = status === 1 ? '确认参与' : '确认收货';
        next = '等待' + (pendingNames ? ' ' + pendingNames + ' ' : '其他参与者') + action + '。';
    } else if (status === 6) {
        next = '交易已暂停。你可以补充情况，等待管理员处理。';
    } else if (status === 3) {
        next = '所有参与者已确认收货，可以互相评价。';
    } else {
        next = '这张交换单已关闭。';
    }
    return {
        people,
        mine,
        active,
        needsConfirmation: window.exchangeNeedsConfirmation(exchange),
        isMe,
        next,
        recipient: mine && recipientFor(mine),
        recipientFor,
        sender: mine && match('giveItemId', mine.getItemId, mine.userId),
        canConfirm: status === 1 && !!mine && !mine.confirmed,
        canReceive: status === 2 && !!mine && !mine.delivered && !pendingFirstMeeting
    };
};

window.exchangeDisputeTimeline = function (exchange, escapeHtml) {
    const dispute = exchange.dispute;
    if (!dispute) return '';
    const name = (id) => {
        if (id === 0) return '系统';
        const person = (exchange.details || []).find((row) => row.userId === id);
        return escapeHtml(person?.nickname || '参与者');
    };
    return '<section aria-label="面交争议"><h2>面交争议</h2><p>' + name(dispute.openedBy)
        + '：' + escapeHtml(dispute.reason) + '</p>'
        + (dispute.statements || []).map((entry) => '<p>' + name(entry.userId)
            + '：' + escapeHtml(entry.body) + '</p>').join('')
        + (dispute.resolution ? '<p>裁决：' + escapeHtml(dispute.resolution) + '</p>' : '') + '</section>';
};
