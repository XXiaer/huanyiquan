package com.huanyiquan.common;

/** 字符串小工具。少写一点 if，让校验代码短一些。 */
public final class Str {

    private Str() {
    }

    public static boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    public static boolean hasText(String s) {
        return !isBlank(s);
    }

    public static String trim(String s) {
        return s == null ? null : s.trim();
    }

    /** 超长截断，用于评价、留言这类字段。 */
    public static String cut(String s, int max) {
        if (s == null) {
            return null;
        }
        String t = s.trim();
        return t.length() <= max ? t : t.substring(0, max);
    }

    public static boolean isDigits(String s) {
        if (isBlank(s)) {
            return false;
        }
        for (int i = 0; i < s.length(); i++) {
            if (!Character.isDigit(s.charAt(i))) {
                return false;
            }
        }
        return true;
    }
}
