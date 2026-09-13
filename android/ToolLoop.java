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
    private static final int MAX_ITERATIONS = 50;

    public static void initialize(LoopCallback cb) {
        cb.onFinalAnswer("✅ SeaBox Engineer Pro جاهز - 109 أداة\n📡 GitHub Memory + Key Rotation + 10 أدوات هندسية (project-scan, production-readiness, impact-analysis, dependency-graph, rollback, link-checker, page-validator, api-tester, crud-tester, final-package)");
    }

    public static void run(String sessionId, String userPrompt, List<String> history, LoopCallback cb) {
        new Thread(() -> {
            try {
                if (userPrompt == null || userPrompt.trim().isEmpty()) {
                    cb.onError("Empty prompt");
                    return;
                }
                
                cb.onProgress("🧠 يفكر...");
                String prompt = buildPrompt(userPrompt, history);
                
                // إرسال POST بشكل صحيح
                String aiResp = httpPost(SERVER + "/api/ai.php?token=" + TOKEN, "prompt=" + enc(prompt));
                
                if (aiResp.contains("EXCEPTION") || aiResp.contains("ERROR")) {
                    cb.onError("فشل الاتصال: " + aiResp);
                    return;
                }
                
                JSONObject json;
                try {
                    json = new JSONObject(aiResp);
                } catch (Exception e) {
                    cb.onError("رد غير صالح: " + aiResp.substring(0, Math.min(200, aiResp.length())));
                    return;
                }
                
                if (!json.optBoolean("success")) {
                    String error = json.optString("error", "غير معروف");
                    cb.onError("فشل AI: " + error);
                    return;
                }
                
                String text = json.optString("text", "");
                if (text.isEmpty()) {
                    cb.onError("Qwen ما رجع رد");
                    return;
                }
                
                List<String[]> calls = extractTools(text);
                
                if (calls.isEmpty()) {
                    cb.onFinalAnswer(text);
                    return;
                }

                cb.onProgress("🔧 تنفيذ " + calls.size() + " أداة...");
                StringBuilder results = new StringBuilder();
                
                for (int i = 0; i < calls.size(); i++) {
                    String tool = calls.get(i)[0];
                    String args = calls.get(i)[1];
                    cb.onProgress("🔧 [" + (i+1) + "/" + calls.size() + "] " + tool);
                    cb.onToolCall(tool, "READ");

                    String url = SERVER + "/api/agent.php?action=execute&tool=" + enc(tool) +
                        "&args=" + enc(args) + "&approved=true&token=" + TOKEN;
                    String resp = httpGet(url);
                    cb.onToolResult(tool, "OK");
                    results.append(formatResult(i+1, tool, resp));
                }

                cb.onFinalAnswer("📊 **النتائج:**\n\n" + results.toString() + "\n---\n\n📝 **تقرير Qwen:**\n" + text);
            } catch (Exception e) {
                cb.onError("خطأ: " + e.getMessage());
            }
        }).start();
    }

    private static String buildPrompt(String userPrompt, List<String> history) {
        StringBuilder sb = new StringBuilder();
        sb.append("المهمة: ").append(userPrompt).append("\n\n");
        sb.append("🎯 الأدوات الهندسية المتاحة:\n");
        sb.append("- project-scan, impact-analysis, dependency-graph, rollback\n");
        sb.append("- production-readiness, link-checker, page-validator\n");
        sb.append("- api-tester, crud-tester, final-package\n");
        sb.append("- auto-fix, test-runner, code-review\n");
        sb.append("- security-audit, health, system-info, memory, disk\n");
        sb.append("- db-schema, db-query, code-generate\n");
        sb.append("- github-store, github-read, github-list\n\n");
        sb.append("🔧 تنسيق:\nTOOL: اسم_الأداة\nARGS: {\"param\": \"value\"}\n\n");
        sb.append("⚠️ استخدم أسماء الأدوات الصحيحة فقط.\n");
        if (history != null && !history.isEmpty()) {
            sb.append("\n📜 السياق:\n");
            for (String h : history) sb.append(h).append("\n");
        }
        return sb.toString();
    }

    private static String formatResult(int num, String tool, String resp) {
        StringBuilder sb = new StringBuilder();
        sb.append("**").append(num).append(". ").append(tool).append(":**\n");
        try {
            JSONObject rj = new JSONObject(resp);
            if (rj.optBoolean("success")) {
                JSONObject res = rj.optJSONObject("result");
                if (res != null) {
                    if (res.has("preview")) {
                        sb.append("```php\n").append(res.optString("preview")).append("\n```\n\n");
                    } else if (res.has("result")) {
                        String r = res.optString("result");
                        sb.append("```\n").append(r.length() > 500 ? r.substring(0, 500) + "..." : r).append("\n```\n\n");
                    } else if (res.has("checks")) {
                        JSONObject checks = res.optJSONObject("checks");
                        JSONArray names = checks.names();
                        sb.append("| الفحص | الحالة |\n|-------|:---:|\n");
                        if (names != null) {
                            for (int i = 0; i < names.length(); i++) {
                                String key = names.getString(i);
                                sb.append("| ").append(key).append(" | ").append(checks.optString(key)).append(" |\n");
                            }
                        }
                        sb.append("\n");
                    } else if (res.has("summary")) {
                        sb.append(res.optString("summary")).append("\n\n");
                    } else {
                        sb.append("✅\n\n");
                    }
                }
            } else {
                sb.append("❌ ").append(rj.optString("error", "خطأ")).append("\n\n");
            }
        } catch (Exception e) {
            sb.append(resp.substring(0, Math.min(200, resp.length()))).append("\n\n");
        }
        return sb.toString();
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
            return "{\"error\":\"" + e.getMessage() + "\"}";
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
            return "EXCEPTION: " + e.getMessage();
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
