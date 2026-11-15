package com.huanyiquan.common;

/**
 * 业务异常。Service 校验不通过时直接抛，由 BaseServlet 统一转成返回体。
 */
public class BizException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    private final int code;

    public BizException(String message) {
        this(Const.CODE_BAD_REQUEST, message);
    }

    public BizException(int code, String message) {
        super(message);
        this.code = code;
    }

    public int getCode() {
        return code;
    }

    public static BizException badRequest(String msg) {
        return new BizException(Const.CODE_BAD_REQUEST, msg);
    }

    public static BizException unauthorized(String msg) {
        return new BizException(Const.CODE_UNAUTHORIZED, msg);
    }

    public static BizException forbidden(String msg) {
        return new BizException(Const.CODE_FORBIDDEN, msg);
    }

    public static BizException notFound(String msg) {
        return new BizException(Const.CODE_NOT_FOUND, msg);
    }
}
