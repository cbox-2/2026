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

    private static final String API = "http://34.61.70.211/api/agent.php";
    private static final String AI = "http://34.61.70.211/api/ai.php";
    private static final String TOKEN = "seabox-agent-2026";
    private static final int MAX_ITER = 5;

    public static void initialize(LoopCallback cb) {
        cb.onFinalAnswer("✅ SeaBox Engineer جاهز - 100 أداة");
    }

    public static void run(String sessionId, String userPrompt, List<String> history, LoopCallback cb) {
        new Thread(() -> {
            try {
                cb.onProgress("🧠 يفكر...");
                loop(userPrompt, cb, new ArrayList<>(), 0);
            } catch (Exception e) {
                cb.onError("خطأ: " + e.getMessage());
            }
        }).start();
    }

    private static void loop(String prompt, LoopCallback cb, List<String> hist, int iter) {
        if (iter >= MAX_ITER) {
            cb.onFinalAnswer("📊 النتائج:\n" + String.join("\n", hist));
            return;
        }

        String fullPrompt = iter == 0 ?
            "المهمة: " + prompt + "\n\nاستدعِ الأدوات المطلوبة فقط (مرة واحدة لكل أداة) ثم قدم تقرير نهائي.\n\nتنسيق:\nTOOL: اسم_الأداة\nARGS: {\"param\": \"value\"}\n\nمثال:\nTOOL: db-schema\nARGS: {\"table\": \"users\"}\n\nTOOL: code-generate\nARGS: {\"type\": \"php\", \"description\": \"دالة تسجيل دخول\"}\n\nابدأ الآن:" :
            "المهمة: " + prompt + "\n\nالخطوات المنفذة:\n" + String.join("\n", hist) + "\n\nقدم تقرير نهائي الآن (لا تستدعِ أدوات أخرى):";

        String aiResp = httpPost(AI + "?token=" + TOKEN, "prompt=" + urlEncode(fullPrompt));
        
        try {
            JSONObject json = new JSONObject(aiResp);
            String text = json.optString("text", "");
            List<String[]> calls = extractTools(text);

            if (calls.isEmpty()) {
                cb.onFinalAnswer(text);
                return;
            }

            for (int i = 0; i < calls.size(); i++) {
                String tool = calls.get(i)[0];
                String args = calls.get(i)[1];
                cb.onProgress("🔧 [" + (i+1) + "/" + calls.size() + "] " + tool);
                cb.onToolCall(tool, "READ");

                String url = API + "?action=execute&tool=" + urlEncode(tool) +
                    "&args=" + urlEncode(args) + "&approved=true&token=" + TOKEN;
                String resp = httpGet(url);

                cb.onToolResult(tool, "OK");
                String shortR = resp.length() > 200 ? resp.substring(0, 200) + "..." : resp;
                hist.add(tool + " → " + shortR);
            }

            loop(prompt, cb, hist, iter + 1);
        } catch (Exception e) {
            cb.onFinalAnswer("خطأ: " + e.getMessage() + "\nالرد: " + aiResp);
        }
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
            return readStream(c.getInputStream());
        } catch (Exception e) { return "{\"error\":\"" + e.getMessage() + "\"}"; }
    }

    private static String httpPost(String urlStr, String data) {
        try {
            HttpURLConnection c = (HttpURLConnection) new URL(urlStr).openConnection();
            c.setRequestMethod("POST");
            c.setDoOutput(true);
            c.setConnectTimeout(15000);
            c.setReadTimeout(90000);
            c.getOutputStream().write(data.getBytes("UTF-8"));
            return readStream(c.getInputStream());
        } catch (Exception e) { return "{\"error\":\"" + e.getMessage() + "\"}"; }
    }

    private static String readStream(InputStream is) throws Exception {
        BufferedReader r = new BufferedReader(new InputStreamReader(is, "UTF-8"));
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = r.readLine()) != null) sb.append(line);
        r.close();
        return sb.toString();
    }

    private static String urlEncode(String s) {
        try { return URLEncoder.encode(s, "UTF-8"); }
        catch (Exception e) { return s; }
    }
}
