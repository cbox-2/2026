<?php
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

$api_key = trim(file_get_contents('/home/cboxms0/.groq_api_key'));
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

if ($http !== 200) { echo json_encode(['success'=>false,'error'=>'فشل','http'=>$http]); exit; }

$json = json_decode($response, true);
$text = $json['choices'][0]['message']['content'] ?? '';
echo json_encode(['success' => true, 'text' => $text]);
