package com.huanyiquan.common;

/**
 * 统一返回体：{code, msg, data}。
 * code = 0 表示成功；401 未登录；403 无权限；500 服务异常。
 */
public class Result {

    private int code;
    private String msg;
    private Object data;

    public Result() {
    }

    public Result(int code, String msg, Object data) {
        this.code = code;
        this.msg = msg;
        this.data = data;
    }

    public static Result ok(Object data) {
        return new Result(Const.CODE_OK, "success", data);
    }

    public static Result ok(String msg, Object data) {
        return new Result(Const.CODE_OK, msg, data);
    }

    public static Result fail(int code, String msg) {
        return new Result(code, msg, null);
    }

    public int getCode() {
        return code;
    }

    public void setCode(int code) {
        this.code = code;
    }

    public String getMsg() {
        return msg;
    }

    public void setMsg(String msg) {
        this.msg = msg;
    }

    public Object getData() {
        return data;
    }

    public void setData(Object data) {
        this.data = data;
    }
}
