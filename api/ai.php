<?php

// Smart Caching - حفظ الردود في GitHub
function getCachedResponse($prompt) {
    $hash = md5($prompt);
    // Cache محلي (سريع - ساعة)
    $cache_file = '/tmp/ai_cache_' . $hash . '.json';
    if (file_exists($cache_file) && (time() - filemtime($cache_file)) < 3600) {
        return json_decode(file_get_contents($cache_file), true);
    }
    // Cache GitHub (دائم - 24 ساعة)
    $token = trim(@file_get_contents('/var/www/html/.github_token') ?: '');
    $repo = trim(@file_get_contents('/var/www/html/.github_repo') ?: '');
    if ($token && $repo) {
        $path = 'memory/cache/' . $hash . '.json';
        $ch = curl_init("https://api.github.com/repos/$repo/contents/$path");
        curl_setopt_array($ch, [
            CURLOPT_HTTPHEADER => ['Authorization: token '.$token, 'User-Agent: SeaBox', 'Accept: application/vnd.github.v3.raw'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 10
        ]);
        $resp = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($code == 200 && !empty($resp)) {
            $data = json_decode($resp, true);
            if (isset($data['timestamp']) && (time() - $data['timestamp']) < 86400) {
                return $data['response'];
            }
        }
    }
    return null;
}

function saveCachedResponse($prompt, $response) {
    $hash = md5($prompt);
    // حفظ محلي
    $cache_file = '/tmp/ai_cache_' . $hash . '.json';
    file_put_contents($cache_file, json_encode($response));
    // حفظ GitHub (دائم)
    $token = trim(@file_get_contents('/var/www/html/.github_token') ?: '');
    $repo = trim(@file_get_contents('/var/www/html/.github_repo') ?: '');
    if ($token && $repo) {
        $path = 'memory/cache/' . $hash . '.json';
        $data = json_encode(['timestamp' => time(), 'prompt' => substr($prompt, 0, 200), 'response' => $response]);
        $ch = curl_init("https://api.github.com/repos/$repo/contents/$path");
        curl_setopt_array($ch, [
            CURLOPT_CUSTOMREQUEST => 'PUT',
            CURLOPT_POSTFIELDS => json_encode(['message' => 'Cache '.$hash, 'content' => base64_encode($data), 'branch' => 'main']),
            CURLOPT_HTTPHEADER => ['Authorization: token '.$token, 'Content-Type: application/json', 'User-Agent: SeaBox'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 10
        ]);
        curl_exec($ch);
        curl_close($ch);
    }
}

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
$token = $_GET['token'] ?? '';
if ($token !== 'seabox-agent-2026') { echo json_encode(['success'=>false,'message'=>'Unauthorized']); exit; }
$prompt = $_POST['prompt'] ?? $_GET['prompt'] ?? '';
if (empty($prompt)) { echo json_encode(['success'=>false,'message'=>'Empty prompt']); exit; }

$SYSTEM_PROMPT = <<<EOT
أنت SeaBox Engineer - نظام بـ 100 أداة.

🎯 قواعد صارمة (اتبعها حرفياً):
1. حلل المهمة → حدد الأدوات المطلوبة فقط
2. استدعِ كل الأدوات دفعة واحدة (لا تستدعِ نفس الأداة مرتين)
3. بعد تنفيذ الأدوات → قدم تقرير نهائي فوراً
4. **لا تكرر أي أداة** - إذا استدعيت أداة مرة، لا تستدعها مرة أخرى
5. **لا تستدعِ db-schema أكثر من مرة واحدة**
6. إذا المهمة "ولّد كود" → استدعِ code-generate مباشرة

📋 أمثلة صحيحة:

مثال 1: "كم عدد المستخدمين؟"
TOOL: db-query
ARGS: {"query": "SELECT COUNT(*) as total FROM users"}
[بعد النتيجة: قدم التقرير النهائي]

مثال 2: "ولّد كود تسجيل دخول"
TOOL: db-schema
ARGS: {"table": "users"}

TOOL: code-generate
ARGS: {"type": "php", "description": "دالة تسجيل دخول آمنة تستخدم بنية جدول users"}
[بعد النتائج: قدم التقرير النهائي مع الكود]

مثال 3: "إحصائيات شاملة"
TOOL: db-query
ARGS: {"query": "SELECT COUNT(*) as total FROM users"}

TOOL: db-query
ARGS: {"query": "SELECT COUNT(*) as total FROM messages"}

TOOL: db-query
ARGS: {"query": "SELECT COUNT(*) as total FROM channels"}

TOOL: db-query
ARGS: {"query": "SELECT COUNT(*) as total FROM boxes"}

TOOL: db-query
ARGS: {"query": "SELECT COUNT(*) as total FROM bans"}
[بعد النتائج: قدم التقرير النهائي]

🔧 الأدوات المتاحة (100 أداة):
- db-query, db-query-write, db-schema
- code-generate, refactor-code, architecture-design, debug-code, generate-tests
- deploy-app, ci-cd-pipeline, code-review, generate-docs, manage-dependencies
- security-audit, performance-profile, database-migrate
- memory, disk, services, health, network, system-info
- alert-system, get-alerts, check-health-alerts
- backup-now, list-backups, cleanup-logs, cleanup-temp

⚠️ تنسيق استدعاء الأدوات:
TOOL: اسم_الأداة
ARGS: {"parameter": "value"}

🚀 ابدأ الآن. استدعِ الأدوات المطلوبة فقط، ثم قدم تقرير نهائي.
EOT;

// Key Rotation - 5 مفاتيح بالتناوب
$keysFile = '/var/www/html/.groq_api_keys';
$keys = file_exists($keysFile) ? json_decode(file_get_contents($keysFile), true) : [];
if (empty($keys)) { $keys = [trim(@file_get_contents('/home/cboxms0/.groq_api_key') ?: '')]; }
$keyIndex = abs(crc32($prompt ?? '')) % count($keys);
$api_key = $keys[$keyIndex];
if (!$api_key) { echo json_encode(['success'=>false,'error'=>'API key missing']); exit; }

$messages = [
    ['role' => 'system', 'content' => $SYSTEM_PROMPT],
    ['role' => 'user', 'content' => $prompt]
];

$data = [
    'model' => 'qwen/qwen3.8-27b',
    'messages' => $messages,
    'max_tokens' => 1500,
    'temperature' => 0.3
];


// محاولة الحصول من Cache أولاً
$cached = getCachedResponse($prompt);
if ($cached && isset($cached['choices'][0]['message']['content'])) {
    $response = $cached;
} else {
    $ch = curl_init('https://api.groq.com/openai/v1/chat/completions');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode($data),
    CURLOPT_HTTPHEADER => ['Content-Type: application/json','Authorization: Bearer ' . $api_key],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 90
]);

$response = curl_exec($ch);
$http = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
    saveCachedResponse($prompt, $response);
}

if ($http !== 200) { echo json_encode(['success'=>false,'error'=>'فشل','http'=>$http]); exit; }

$json = json_decode($response, true);
$text = $json['choices'][0]['message']['content'] ?? '';
echo json_encode(['success' => true, 'text' => $text]);
