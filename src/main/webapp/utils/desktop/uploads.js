import { state } from "../../router/desktop/state.js";
import { api, readToken } from "./api.js";

async function readOrUploadLocalImage(file) {
    if (state.me || readToken()) {
        try {
            var fd = new FormData();
            fd.append('file', window.prepareUploadImage ? await window.prepareUploadImage(file) : file);
            var res = await api('/upload', {method: 'POST', form: fd, optionalAuth: true});
            if (res && res.url) return res.url;
        } catch (e) {}
    }
    return await new Promise(function (resolve, reject) {
        var reader = new FileReader();
        reader.onload = function () {
            var img = new Image();
            img.onload = function () {
                var max = 720, scale = Math.min(1, max / Math.max(img.width || 1, img.height || 1));
                var canvas = document.createElement('canvas');
                canvas.width = Math.max(1, Math.round(img.width * scale));
                canvas.height = Math.max(1, Math.round(img.height * scale));
                canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.74));
            };
            img.onerror = function () { reject(new Error('图片读取失败')); };
            img.src = reader.result;
        };
        reader.onerror = function () { reject(new Error('图片读取失败')); };
        reader.readAsDataURL(file);
    });
}

export { readOrUploadLocalImage };
