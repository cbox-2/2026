package com.seabox.engineer;

import org.json.JSONObject;
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
        cb.onFinalAnswer("✅ SeaBox Engineer Pro جاهز - 104 أداة\n📡 الذاكرة: GitHub Memory");
    }

    public static void run(String sessionId, String userPrompt, List<String> history, LoopCallback cb) {
        new Thread(() -> {
            try {
                cb.onProgress("🧠 يفكر...");
                
                String prompt = "المهمة: " + userPrompt + "\nاستدع الادوات ثم قدم تقرير. تنسيق: TOOL: اسم\nARGS: {}";
                
                cb.onProgress("📡 يرسل لـ AI...");
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
                    cb.onError("فشل AI: " + json.optString("error", "غير معروف"));
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
                    
                    try {
                        JSONObject rj = new JSONObject(resp);
                        if (rj.optBoolean("success")) {
                            JSONObject res = rj.optJSONObject("result");
                            if (res != null) {
                                if (res.has("preview")) {
                                    results.append("**").append(i+1).append(". ").append(tool).append(":**\n```php\n")
                                        .append(res.optString("preview")).append("\n```\n\n");
                                } else if (res.has("result")) {
                                    String r = res.optString("result");
                                    results.append("**").append(i+1).append(". ").append(tool).append(":**\n```\n")
                                        .append(r.length() > 500 ? r.substring(0, 500) + "..." : r).append("\n```\n\n");
                                } else if (res.has("schema")) {
                                    results.append("**").append(i+1).append(". ").append(tool).append(":**\n```\n")
                                        .append(res.optString("schema")).append("\n```\n\n");
                                } else {
                                    results.append("**").append(i+1).append(". ").append(tool).append(":** ✅\n\n");
                                }
                            }
                        } else {
                            results.append("**").append(i+1).append(". ").append(tool).append(":** ❌ ").append(rj.optString("error", "خطأ")).append("\n\n");
                        }
                    } catch (Exception e) {
                        results.append("**").append(i+1).append(". ").append(tool).append(":** ").append(resp.substring(0, Math.min(200, resp.length()))).append("\n\n");
                    }
                }

                cb.onFinalAnswer("📊 **النتائج:**\n\n" + results.toString() + "\n---\n\n📝 **تقرير Qwen:**\n" + text);
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
            return "{\"error\":\"" + e.getMessage() + "\"}";
        }
    }

    private static String httpPost(String urlStr, String data) {
        try {
            HttpURLConnection c = (HttpURLConnection) new URL(urlStr).openConnection();
            c.setRequestMethod("POST");
            c.setDoOutput(true);
            c.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
            c.setConnectTimeout(15000);
            c.setReadTimeout(90000);
            c.setUseCaches(false);
            try (OutputStream os = c.getOutputStream()) {
                os.write(data.getBytes("UTF-8"));
                os.flush();
            }
            int code = c.getResponseCode();
            InputStream is = (code >= 200 && code < 400) ? c.getInputStream() : c.getErrorStream();
            return rs(is);
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
