package com.huanyiquan.common;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.servlet.ServletInputStream;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.Map;

/** JSON 读写工具。全站只有这一处碰 ObjectMapper。 */
public final class JsonUtil {

    public static final ObjectMapper MAPPER = create();

    private JsonUtil() {
    }

    private static ObjectMapper create() {
        ObjectMapper m = new ObjectMapper();
        m.registerModule(new JavaTimeModule());
        m.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        m.disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);
        m.setSerializationInclusion(JsonInclude.Include.NON_NULL);
        return m;
    }

    /** 统一的出参出口。401 / 403 / 500 同时改 HTTP 状态，前端 axios 拦截器才能接住。 */
    public static void write(HttpServletResponse resp, Result result) {
        resp.setCharacterEncoding("UTF-8");
        resp.setContentType("application/json;charset=UTF-8");
        int code = result.getCode();
        if (code == Const.CODE_UNAUTHORIZED || code == Const.CODE_FORBIDDEN
                || code == Const.CODE_SERVER_ERROR) {
            resp.setStatus(code);
        } else {
            resp.setStatus(HttpServletResponse.SC_OK);
        }
        try {
            PrintWriter out = resp.getWriter();
            out.write(MAPPER.writeValueAsString(result));
            out.flush();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    /** 读请求体。不是 JSON 请求就返回空 Map，让调用方退回表单参数。 */
    public static Map<String, Object> bodyMap(HttpServletRequest req) throws IOException {
        String contentType = req.getContentType();
        if (contentType == null || !contentType.toLowerCase().contains("json")) {
            return Collections.emptyMap();
        }
        ServletInputStream in = req.getInputStream();
        ByteArrayOutputStream buf = new ByteArrayOutputStream();
        byte[] chunk = new byte[4096];
        int n;
        while ((n = in.read(chunk)) != -1) {
            buf.write(chunk, 0, n);
        }
        String text = new String(buf.toByteArray(), StandardCharsets.UTF_8).trim();
        if (text.isEmpty()) {
            return Collections.emptyMap();
        }
        return MAPPER.readValue(text, new TypeReference<Map<String, Object>>() {
        });
    }
}
