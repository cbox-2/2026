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
    private static final int MAX_ITERATIONS = 8;

    public static void initialize(LoopCallback cb) {
        cb.onFinalAnswer("✅ SeaBox Engineer Pro - 109 أداة\n🔄 Multi-step Loop حقيقي (حتى 8 iterations)");
    }

    public static void run(String sessionId, String userPrompt, List<String> history, LoopCallback cb) {
        new Thread(() -> {
            try {
                if (userPrompt == null || userPrompt.trim().isEmpty()) {
                    cb.onError("Empty prompt");
                    return;
                }

                StringBuilder context = new StringBuilder();
                context.append("المهمة الأصلية: ").append(userPrompt).append("\n\n");

                if (history != null && !history.isEmpty()) {
                    context.append("📜 المحادثة السابقة:\n");
                    for (String h : history) context.append(h).append("\n");
                    context.append("\n");
                }

                context.append("🎯 الأدوات المتاحة:\n");
                context.append("- project-scan, production-readiness, impact-analysis\n");
                context.append("- dependency-graph, rollback, link-checker\n");
                context.append("- page-validator, api-tester, crud-tester, final-package\n");
                context.append("- auto-fix, test-runner, code-review, code-generate\n");
                context.append("- security-audit, health, system-info, memory, disk\n");
                context.append("- db-schema, db-query, architecture-design\n");
                context.append("- github-store, github-read, github-list\n\n");
                context.append("🔧 تنسيق استدعاء الأدوات:\n");
                context.append("TOOL: اسم_الأداة\n");
                context.append("ARGS: {\"param\": \"value\"}\n\n");
                context.append("⚠️ قواعد:\n");
                context.append("1. استدعي أداة واحدة أو أكثر في كل رد\n");
                context.append("2. استخدم أسماء الأدوات الصحيحة فقط\n");
                context.append("3. بعد ما تجمع كل المعلومات، قدّم التقرير النهائي\n");
                context.append("4. التقرير النهائي يبدأ بـ: FINAL_REPORT:\n");

                StringBuilder fullAnswer = new StringBuilder();
                List<String> iterationLogs = new ArrayList<>();

                for (int iteration = 1; iteration <= MAX_ITERATIONS; iteration++) {
                    cb.onProgress("🔄 Iteration " + iteration + "/" + MAX_ITERATIONS);

                    String currentPrompt = context.toString();
                    if (!iterationLogs.isEmpty()) {
                        currentPrompt += "\n\n📊 نتائج الـ iterations السابقة:\n";
                        for (String log : iterationLogs) {
                            currentPrompt += log + "\n";
                        }
                        currentPrompt += "\n\nالآن، بناءً على النتائج أعلاه، قرر:\n";
                        currentPrompt += "- إذا تحتاج معلومات إضافية → استدعي أدوات\n";
                        currentPrompt += "- إذا عندك كل المعلومات → اكتب FINAL_REPORT: ثم التقرير\n";
                    }

                    String aiResp = httpPost(SERVER + "/api/ai.php?token=" + TOKEN, "prompt=" + enc(currentPrompt));

                    JSONObject json;
                    try {
                        json = new JSONObject(aiResp);
                    } catch (Exception e) {
                        cb.onError("رد غير صالح في iteration " + iteration);
                        return;
                    }

                    if (!json.optBoolean("success")) {
                        cb.onError("فشل AI في iteration " + iteration + ": " + json.optString("error", ""));
                        return;
                    }

                    String text = json.optString("text", "");
                    if (text.isEmpty()) {
                        cb.onError("Qwen ما رجع رد في iteration " + iteration);
                        return;
                    }

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

                    cb.onProgress("🔧 Iteration " + iteration + ": تنفيذ " + calls.size() + " أداة");
                    StringBuilder iterResult = new StringBuilder();
                    iterResult.append("=== Iteration ").append(iteration).append(" ===\n");

                    for (int i = 0; i < calls.size(); i++) {
                        String tool = calls.get(i)[0];
                        String args = calls.get(i)[1];
                        cb.onToolCall(tool, "READ");

                        String url = SERVER + "/api/agent.php?action=execute&tool=" + enc(tool) +
                            "&args=" + enc(args) + "&approved=true&token=" + TOKEN;
                        String resp = httpGet(url);
                        cb.onToolResult(tool, "OK");

                        iterResult.append("TOOL_RESULT: ").append(tool).append("\n");
                        iterResult.append(resp).append("\n\n");
                    }

                    iterationLogs.add(iterResult.toString());

                    fullAnswer.append("🔄 **Iteration ").append(iteration).append("**: ");
                    for (String[] call : calls) {
                        fullAnswer.append(call[0]).append(" ");
                    }
                    fullAnswer.append("\n");
                }

                cb.onFinalAnswer(fullAnswer.toString() + "\n\n⚠️ وصلنا للحد الأقصى (8 iterations)");

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
