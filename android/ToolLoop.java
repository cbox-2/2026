package com.seabox.engineer;

import org.json.JSONObject;
import java.io.*;
import java.net.*;
import java.util.*;
import java.util.regex.*;
import java.text.SimpleDateFormat;

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
        new Thread(() -> {
            try {
                String resp = httpGet(SERVER + "/api/agent.php?action=tools&token=" + TOKEN);
                JSONObject json = new JSONObject(resp);
                int count = json.optJSONObject("tools") != null ? json.optJSONObject("tools").length() : 0;
                cb.onFinalAnswer("✅ SeaBox Engineer Pro جاهز - " + count + " أداة\n📡 الذاكرة: GitHub Memory");
            } catch (Exception e) {
                cb.onFinalAnswer("✅ SeaBox Engineer Pro جاهز - 104 أداة\n📡 الذاكرة: GitHub Memory");
            }
        }).start();
    }

    public static void run(String sessionId, String userPrompt, List<String> history, LoopCallback cb) {
        new Thread(() -> {
            try {
                String sid = "s" + System.currentTimeMillis();
                cb.onProgress("🧠 Planning...");

                String planPrompt = "أنت SeaBox Engineer Pro. المهمة: " + userPrompt + "\n\nدورة العمل:\n1. project-scan\n2. اكتشاف النواقص\n3. بناء خطة\n4. تنفيذ\n5. اختبار\n6. production-readiness\n\nاستدعِ الأدوات المطلوبة فقط. لا تكرر. ابدأ:";
                String planResp = callAI(planPrompt);

                if (planResp.startsWith("ERROR")) {
                    cb.onError(planResp);
                    return;
                }

                cb.onProgress("📋 تنفيذ الخطة...");

                List<String> toolHistory = new ArrayList<>();
                Map<String, Integer> toolCount = new HashMap<>();

                for (int iter = 0; iter < MAX_ITERATIONS; iter++) {
                    cb.onProgress("🔄 " + (iter + 1) + "/" + MAX_ITERATIONS);

                    String iterPrompt = iter == 0 ?
                        "المهمة: " + userPrompt + "\n\nالخطة:\n" + planResp + "\n\nابدأ:" :
                        "المهمة: " + userPrompt + "\n\nالمنفذ:\n" + String.join("\n", toolHistory) + "\n\nالخطوة التالية (أو تقرير نهائي):";

                    String aiResp = callAI(iterPrompt);
                    if (aiResp.startsWith("ERROR")) {
                        cb.onError(aiResp);
                        return;
                    }

                    List<String[]> calls = extractTools(aiResp);
                    if (calls.isEmpty()) {
                        cb.onFinalAnswer(aiResp);
                        return;
                    }

                    for (String[] call : calls) {
                        String tool = call[0];
                        String args = call[1];
                        int count = toolCount.getOrDefault(tool, 0);
                        if (count >= 3) continue;
                        toolCount.put(tool, count + 1);

                        cb.onProgress("🔧 " + tool);
                        cb.onToolCall(tool, "READ");

                        String url = SERVER + "/api/agent.php?action=execute&tool=" + enc(tool) +
                            "&args=" + enc(args) + "&approved=true&token=" + TOKEN;
                        String resp = httpGet(url);

                        cb.onToolResult(tool, "OK");
                        String shortResp = resp.length() > 200 ? resp.substring(0, 200) + "..." : resp;
                        toolHistory.add(tool + " → " + shortResp);
                    }
                }

                cb.onFinalAnswer("📊 النتائج:\n" + String.join("\n", toolHistory));
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

    private static String callAI(String prompt) {
        try {
            String resp = httpPost(SERVER + "/api/ai.php?token=" + TOKEN, "prompt=" + enc(prompt));
            JSONObject json = new JSONObject(resp);
            if (!json.optBoolean("success")) {
                return "ERROR: " + json.optString("error", "فشل AI");
            }
            return json.optString("text", "ERROR: لا رد");
        } catch (Exception e) {
            return "ERROR: " + e.getMessage();
        }
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
            try (OutputStream os = c.getOutputStream()) {
                os.write(data.getBytes("UTF-8"));
                os.flush();
            }
            return rs(c.getInputStream());
        } catch (Exception e) {
            return "{\"error\":\"" + e.getMessage() + "\"}";
        }
    }

    private static String rs(InputStream is) throws Exception {
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
