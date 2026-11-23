import { creditCls } from "../../utils/desktop/format.js";

function creditLevelOf(credit) {
    var c = credit === null || credit === undefined ? 0 : credit;
    if (c >= 90) return {text: '优秀', cls: 'success'};
    if (c >= 80) return {text: '良好', cls: 'brand'};
    if (c >= 70) return {text: '一般', cls: ''};
    if (c >= 60) return {text: '较低', cls: 'accent'};
    return {text: '受限', cls: 'accent'};
}

function creditBadge(u) {
    var v = u.credit === undefined || u.credit === null ? '-' : u.credit;
    return '<span class="credit ' + creditCls(u.credit) + '">信用 <b class="num">' + v + '</b></span>';
}

export { creditBadge, creditLevelOf };
