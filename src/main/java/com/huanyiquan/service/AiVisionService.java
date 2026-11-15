package com.huanyiquan.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.huanyiquan.common.BizException;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 基于 OpenCode Go (DeepSeek V4.1 Flash) 的多模态物品识别与估价服务。
 */
public class AiVisionService {

    private static final String ENDPOINT = "https://opencode.ai/inference/go/openai/v1/chat/completions";
    private static final String MODEL = "deepseek-v4.1-flash";
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final HttpClient CLIENT = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    private static String loadApiKey() {
        String env = System.getenv("OPENCODE_API_KEY");
        if (env != null && !env.trim().isEmpty()) {
            return env.trim();
        }
        String[] candidates = {
                "/opt/huanyiquan/ai.key",
                "ai.key",
                "c:\\Users\\25749\\Desktop\\shibie.txt"
        };
        for (String p : candidates) {
            try {
                Path path = Paths.get(p);
                if (Files.isRegularFile(path)) {
                    String k = Files.readString(path, StandardCharsets.UTF_8).trim();
                    if (!k.isEmpty()) return k;
                }
            } catch (IOException ignore) {
            }
        }
        throw new BizException(500, "AI 服务密钥未配置");
    }

    public static Map<String, Object> appraise(String imageDataUrl, String category, String condition,
                                               Integer origYuan, String titleHint) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("你是校园二手交易平台的专业估价师。请根据图片（若有）和用户提供的信息识别物品，并给出国内高校二手交易的合理人民币估价区间（单位：元，整数）。\n");
        if (titleHint != null && !titleHint.trim().isEmpty()) prompt.append("物品描述：").append(titleHint.trim()).append("\n");
        if (category != null && !category.trim().isEmpty()) prompt.append("分类：").append(category.trim()).append("\n");
        if (condition != null && !condition.trim().isEmpty()) prompt.append("成色：").append(condition.trim()).append("\n");
        if (origYuan != null && origYuan > 0) prompt.append("入手原价：").append(origYuan).append("元\n");
        prompt.append("只返回严格JSON，不要markdown代码块，格式为：")
              .append("{\"name\":\"物品简短名称\",\"category\":\"教材|数码|运动|生活|衣物|绿植|其他\",\"condition\":\"全新|九成新|七成新|有使用痕迹\",\"lowPrice\":整数,\"highPrice\":整数,\"tags\":[\"保值亮点1\",\"亮点2\"]}");

        String raw = callChat(prompt.toString(), imageDataUrl);
        JsonNode node = parseJson(raw);
        if (node == null) {
            throw new BizException(502, "AI 识别结果解析失败，请重试");
        }
        int lo = Math.max(1, node.path("lowPrice").asInt(10));
        int hi = Math.max(lo, node.path("highPrice").asInt(lo + 10));
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("name", node.path("name").asText(titleHint != null && !titleHint.isEmpty() ? titleHint : "校园好物"));
        res.put("category", node.path("category").asText(category != null && !category.isEmpty() ? category : "其他"));
        res.put("condition", node.path("condition").asText(condition != null && !condition.isEmpty() ? condition : "九成新"));
        res.put("lowPrice", lo);
        res.put("highPrice", hi);
        List<String> tags = new ArrayList<>();
        if (node.has("tags") && node.get("tags").isArray()) {
            for (JsonNode t : node.get("tags")) {
                String s = t.asText("").trim();
                if (!s.isEmpty() && tags.size() < 3) tags.add(s);
            }
        }
        res.put("tags", tags);
        return res;
    }

    public static Map<String, Object> identifyKeyword(String imageDataUrl) {
        if (imageDataUrl == null || imageDataUrl.trim().isEmpty()) {
            throw new BizException(400, "请先拍照或上传图片");
        }
        String prompt = "识别图片中最核心的物品名称，用于校园二手平台搜索。只返回严格JSON，不要markdown代码块：{\"keyword\":\"2到6字的通用物品名称\",\"category\":\"教材|数码|运动|生活|衣物|绿植|其他\"}";
        String raw = callChat(prompt, imageDataUrl);
        JsonNode node = parseJson(raw);
        if (node == null || node.path("keyword").asText("").trim().isEmpty()) {
            throw new BizException(502, "未能识别出清晰物品");
        }
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("keyword", node.path("keyword").asText().trim());
        res.put("category", node.path("category").asText("其他"));
        return res;
    }

    private static String callChat(String textPrompt, String imageDataUrl) {
        try {
            ObjectNode root = MAPPER.createObjectNode();
            root.put("model", MODEL);
            root.put("temperature", 0.2);
            root.put("max_tokens", 800);

            ArrayNode messages = root.putArray("messages");
            ObjectNode userMsg = messages.addObject();
            userMsg.put("role", "user");

            if (imageDataUrl != null && imageDataUrl.startsWith("data:image/")) {
                ArrayNode content = userMsg.putArray("content");
                ObjectNode textPart = content.addObject();
                textPart.put("type", "text");
                textPart.put("text", textPrompt);
                ObjectNode imgPart = content.addObject();
                imgPart.put("type", "image_url");
                imgPart.putObject("image_url").put("url", imageDataUrl);
            } else {
                userMsg.put("content", textPrompt);
            }

            String reqBody = MAPPER.writeValueAsString(root);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(ENDPOINT))
                    .timeout(Duration.ofSeconds(25))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + loadApiKey())
                    .header("x-opencode-session", "huanyiquan-ai-vision")
                    .POST(HttpRequest.BodyPublishers.ofString(reqBody, StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = CLIENT.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() >= 400) {
                throw new BizException(502, "AI 服务响应异常（" + response.statusCode() + "）");
            }
            JsonNode tree = MAPPER.readTree(response.body());
            JsonNode msg = tree.path("choices").path(0).path("message").path("content");
            return msg.asText("");
        } catch (BizException e) {
            throw e;
        } catch (Exception e) {
            throw new BizException(502, "AI 识别超时或连接失败");
        }
    }

    private static JsonNode parseJson(String raw) {
        if (raw == null) return null;
        String s = raw.trim();
        int start = s.indexOf('{');
        int end = s.lastIndexOf('}');
        if (start >= 0 && end > start) {
            s = s.substring(start, end + 1);
        }
        try {
            return MAPPER.readTree(s);
        } catch (Exception e) {
            return null;
        }
    }
}
