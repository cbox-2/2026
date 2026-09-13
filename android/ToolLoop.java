package com.seabox.engineer;

import org.json.JSONObject;
import org.json.JSONArray;
import java.io.*;
import java.net.*;
import java.util.*;
import java.util.regex.*;

public class ToolLoop {
    public interface LoopCallback {
        void onProgress(String status);
        void onToolCall(String tool, String permission);
        void onToolResult(String tool, String status);
        void onApprovalNeeded(String tool, String permission, ApprovalHandler handler);
        void onFinalAnswer(String answer);
        void onError(String error);
    }

    public interface ApprovalHandler {
        void approve();
        void deny();
    }

    private static final String SERVER = "http://34.61.70.211";
    private static final String TOKEN = "seabox-agent-2026";
    private static final int MAX_ITERATIONS = 4;

    public static void initialize(LoopCallback cb) {
        cb.onFinalAnswer("✅ SeaBox Engineer Pro - 109 أداة\n🔄 Multi-step Loop (4 iterations)");
    }

    public static void run(String sessionId, String userPrompt, List<String> history, LoopCallback cb) {
        new Thread(() -> {
            try {
                if (userPrompt == null || userPrompt.trim().isEmpty()) {
                    cb.onError("Empty prompt");
                    return;
                }

                StringBuilder context = new StringBuilder();
                context.append("المهمة: ").append(userPrompt).append("\n\n");

                context.append("🎯 الأدوات الأساسية:\n");
                context.append("- project-scan, production-readiness, code-generate\n");
                context.append("- security-audit, db-schema, health\n");
                context.append("- impact-analysis, dependency-graph, rollback\n\n");
                context.append("🔧 تنسيق:\nTOOL: اسم_الأداة\nARGS: {\"param\": \"value\"}\n\n");
                context.append("⚠️ قواعد:\n");
                context.append("1. استدعي 1-2 أدوات في كل رد\n");
                context.append("2. بعد ما تجمع المعلومات، اكتب: FINAL_REPORT: ثم التقرير\n");
                context.append("3. التقرير يجب أن يحتوي على: الكود المولّد، التحليل، التوصيات\n");

                StringBuilder fullAnswer = new StringBuilder();
                List<String> iterationLogs = new ArrayList<>();
                String lastQwenResponse = "";

                for (int iteration = 1; iteration <= MAX_ITERATIONS; iteration++) {
                    cb.onProgress("🔄 [" + iteration + "/" + MAX_ITERATIONS + "]");

                    String currentPrompt = context.toString();
                    if (!iterationLogs.isEmpty()) {
                        currentPrompt += "\n📊 نتائج سابقة:\n";
                        for (int i = 0; i < iterationLogs.size(); i++) {
                            String log = iterationLogs.get(i);
                            if (log.length() > 400) log = log.substring(0, 400) + "...";
                            currentPrompt += "Iter " + (i+1) + ": " + log + "\n";
                        }
                        currentPrompt += "\n";
                        if (iteration == MAX_ITERATIONS) {
                            currentPrompt += "⚠️ آخر iteration! اكتب FINAL_REPORT: الآن.\n";
                        }
                    }

                    if (iteration > 1) {
                        try { Thread.sleep(2000); } catch (InterruptedException e) {}
                    }

                    String aiResp = httpPost(SERVER + "/api/ai.php?token=" + TOKEN, "prompt=" + enc(currentPrompt));

                    JSONObject json;
                    try {
                        json = new JSONObject(aiResp);
                    } catch (Exception e) {
                        cb.onError("رد غير صالح");
                        return;
                    }

                    if (!json.optBoolean("success")) {
                        String err = json.optString("error", "");
                        if (err.contains("Rate Limited")) {
                            cb.onError("⏸️ Rate Limit - انتظر دقيقة");
                        } else {
                            cb.onError("فشل: " + err);
                        }
                        return;
                    }

                    String text = json.optString("text", "");
                    if (text.isEmpty()) {
                        cb.onError("Qwen ما رجع رد");
                        return;
                    }

                    lastQwenResponse = text;

                    if (text.contains("FINAL_REPORT:")) {
                        String report = text.substring(text.indexOf("FINAL_REPORT:") + "FINAL_REPORT:".length()).trim();
                        fullAnswer.append(report);
                        cb.onFinalAnswer(fullAnswer.toString());
                        return;
                    }

                    List<String[]> calls = extractTools(text);

                    if (calls.isEmpty()) {
                        fullAnswer.append(text);
                        cb.onFinalAnswer(fullAnswer.toString());
                        return;
                    }

                    cb.onProgress("🔧 [" + iteration + "] " + calls.size() + " أداة");
                    StringBuilder iterResult = new StringBuilder();

                    for (int i = 0; i < calls.size(); i++) {
                        String tool = calls.get(i)[0];
                        String args = calls.get(i)[1];
                        cb.onToolCall(tool, "READ");

                        String url = SERVER + "/api/agent.php?action=execute&tool=" + enc(tool) +
                            "&args=" + enc(args) + "&approved=true&token=" + TOKEN;
                        String resp = httpGet(url);
                        cb.onToolResult(tool, "OK");

                        iterResult.append(tool).append(": ").append(resp.substring(0, Math.min(300, resp.length()))).append("\n");
                    }

                    iterationLogs.add(iterResult.toString());

                    fullAnswer.append("✅ ").append(iteration).append(": ");
                    for (String[] call : calls) {
                        fullAnswer.append(call[0]).append(" ");
                    }
                    fullAnswer.append("\n");
                }

                // وصلنا للحد - نعرض آخر رد من Qwen + نتائج آخر iteration
                fullAnswer.append("\n---\n\n");
                fullAnswer.append("**آخر رد من Qwen:**\n");
                fullAnswer.append(lastQwenResponse).append("\n\n");
                
                if (!iterationLogs.isEmpty()) {
                    fullAnswer.append("**نتائج آخر iteration:**\n```\n");
                    String lastLog = iterationLogs.get(iterationLogs.size() - 1);
                    fullAnswer.append(lastLog.length() > 500 ? lastLog.substring(0, 500) + "..." : lastLog);
                    fullAnswer.append("\n```\n");
                }

                cb.onFinalAnswer(fullAnswer.toString());

            } catch (Exception e) {
                cb.onError("خطأ: " + e.getMessage());
            }
        }).start();
    }

    private static List<String[]> extractTools(String text) {
        List<String[]> calls = new ArrayList<>();
        Matcher m = Pattern.compile("TOOL:\\s*([a-zA-Z0-9_-]+)\\s*ARGS:\\s*(\\{[^}]*\\})").matcher(text);
        while (m.find()) {
            calls.add(new String[]{m.group(1).trim(), m.group(2).trim()});
        }
        return calls;
    }

    private static String httpGet(String urlStr) {
        try {
            HttpURLConnection c = (HttpURLConnection) new URL(urlStr).openConnection();
            c.setConnectTimeout(15000);
            c.setReadTimeout(90000);
            return rs(c.getInputStream());
        } catch (Exception e) {
            return "{\"success\":false,\"error\":\"" + e.getMessage() + "\"}";
        }
    }

    private static String httpPost(String urlStr, String data) {
        try {
            URL url = new URL(urlStr);
            HttpURLConnection c = (HttpURLConnection) url.openConnection();
            c.setRequestMethod("POST");
            c.setDoOutput(true);
            c.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
            c.setRequestProperty("Content-Length", String.valueOf(data.getBytes("UTF-8").length));
            c.setConnectTimeout(15000);
            c.setReadTimeout(90000);
            c.setUseCaches(false);

            try (OutputStream os = c.getOutputStream()) {
                byte[] input = data.getBytes("UTF-8");
                os.write(input, 0, input.length);
                os.flush();
            }

            int code = c.getResponseCode();
            InputStream is = (code >= 200 && code < 400) ? c.getInputStream() : c.getErrorStream();
            String response = rs(is);
            c.disconnect();
            return response;
        } catch (Exception e) {
            return "{\"success\":false,\"error\":\"" + e.getMessage() + "\"}";
        }
    }

    private static String rs(InputStream is) throws Exception {
        if (is == null) return "null stream";
        BufferedReader r = new BufferedReader(new InputStreamReader(is, "UTF-8"));
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = r.readLine()) != null) sb.append(line).append("\n");
        r.close();
        return sb.toString().trim();
    }

    private static String enc(String s) {
        try {
            return URLEncoder.encode(s, "UTF-8");
        } catch (Exception e) {
            return s;
        }
    }
}
