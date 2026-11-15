package com.huanyiquan.common;
import java.io.File;
import javax.imageio.ImageIO;
public final class ImageCheck {
    private ImageCheck() {}
    public static void requireImages(String value) {
        if (value == null || value.trim().isEmpty() || value.length() > 500) throw BizException.badRequest("请上传至少一张图片");
        String[] paths = value.split(",", -1);
        if (paths.length > 3) throw BizException.badRequest("最多上传三张图片");
        for (String path : paths) {
            if (!path.matches("/api/file/[a-f0-9]{32}\\.(jpg|jpeg|png)")) throw BizException.badRequest("请使用上传的图片");
            try {
                File f = new File("uploads", path.substring("/api/file/".length()));
                if (!f.isFile() || ImageIO.read(f) == null) throw BizException.badRequest("图片不存在或格式无效，请重新上传");
            } catch (java.io.IOException e) { throw BizException.badRequest("图片无法读取，请重新上传"); }
        }
    }
}
