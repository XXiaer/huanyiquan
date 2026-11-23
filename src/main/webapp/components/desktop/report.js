import { openSheet } from "./sheet.js";

function openReportSheet(type, id) {
    openSheet('<h3>举报</h3><p class="sub">写清楚问题，管理员会尽快处理。恶意举报会被追责。</p>'
        + '<form data-form="report"><input type="hidden" name="targetType" value="' + type + '">'
        + '<input type="hidden" name="targetId" value="' + id + '">'
        + '<div class="field"><label class="label">原因</label>'
        + '<textarea class="textarea" name="reason" maxlength="200" placeholder="例如 描述与实物严重不符" required></textarea></div>'
        + '<button class="btn btn-danger btn-block" type="submit">提交举报</button></form>');
}

export { openReportSheet };
