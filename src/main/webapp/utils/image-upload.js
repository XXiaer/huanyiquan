
window.prepareUploadImage = async function (file) {
    const limit = 2 * 1024 * 1024;
    const standard = /\.(jpe?g|png)$/i.test(file.name);
    let bitmap;
    try {
        bitmap = await createImageBitmap(file);
    } catch (error) {
        if (standard && file.size <= limit) return file;
        throw new Error('无法读取这张照片，请选择 JPG 或 PNG 图片');
    }
    try {
        const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
        if (scale === 1 && standard && file.size <= 512 * 1024) return file;
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(bitmap.width * scale));
        canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        const ctx = canvas.getContext('2d', {alpha: false});
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        for (const quality of [.86, .72, .55]) {
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
            if (blob && blob.size <= limit) return new File([blob], 'photo.jpg', {type: 'image/jpeg'});
        }
        throw new Error('照片压缩后仍超过 2 MB，请换一张');
    } finally {
        bitmap.close();
    }
};

window.catalogThumbnail = function (url) {
    return /^\/api\/file\/[A-Za-z0-9]+\.(?:png|jpe?g)$/.test(url) ? url + '?thumb=1' : url;
};
