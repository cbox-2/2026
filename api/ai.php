<?php
// Key Rotation + Smart Caching + Fallback
$keysFile = '/var/www/html/.groq_api_keys';
$keys = file_exists($keysFile) ? json_decode(file_get_contents($keysFile), true) : [];
if (empty($keys)) {
    $keys = [trim(@file_get_contents('/home/cboxms0/.groq_api_key') ?: '')];
}

// اختيار مفتاح عشوائي
$keyIndex = array_rand($keys);
$api_key = $keys[$keyIndex];

if (!$api_key) {
    echo json_encode(['success'=>false,'error'=>'API key missing']);
    exit;
}

header('Content-Type: application/json');

// قراءة المدخلات
$prompt = $_POST['prompt'] ?? $_GET['prompt'] ?? '';
$session = $_POST['session'] ?? $_GET['session'] ?? '';
$token = $_GET['token'] ?? $_POST['token'] ?? '';

if ($token !== 'seabox-agent-2026') {
    echo json_encode(['success'=>false,'error'=>'Invalid token']);
    exit;
}

if (empty($prompt)) {
    echo json_encode(['success'=>false,'error'=>'Empty prompt']);
    exit;
}

// System Prompt
$systemPrompt = "أنت SeaBox Engineer Pro - مهندس برمجيات AI احترافي.\n\n🎯 قواعد:\n1. افهم المشروع أولاً (project-scan)\n2. اكتشف النواقص (link-checker, page-validator)\n3. ابنِ خطة ثم نفّذ\n4. اختبر كل تعديل (Test-Fix-Test)\n5. لا تكرر أي أداة\n6. قدّم تقرير نهائي\n\n🔧 تنسيق استدعاء الأدوات:\nTOOL: اسم_الأداة\nARGS: {\"param\": \"value\"}\n\n🛡️ قبل أي تعديل خطير: Backup → Modify → Test → Verify\n\nقاعدة البيانات: nexusbox_db\nالأدوات المتاحة: 104 أداة (agent.php?action=tools)";

$messages = [
    ['role' => 'system', 'content' => $systemPrompt],
    ['role' => 'user', 'content' => $prompt]
];

$data = [
    'model' => 'qwen/qwen3.8-27b',
    'messages' => $messages,
    'max_tokens' => 1500,
    'temperature' => 0.3
];

// Caching محلي (سريع - ساعة)
$hash = md5($prompt);
$cache_file = '/tmp/ai_cache_' . $hash . '.json';
if (file_exists($cache_file) && (time() - filemtime($cache_file)) < 3600) {
    $cached = json_decode(file_get_contents($cache_file), true);
    if ($cached && isset($cached['choices'][0]['message']['content'])) {
        $text = $cached['choices'][0]['message']['content'];
        echo json_encode(['success' => true, 'text' => $text, 'cached' => true]);
        exit;
    }
}

// Fallback حقيقي - جرب كل المفاتيح عند 429
$response = null;
$http = 0;
$usedKey = -1;

for ($i = 0; $i < count($keys); $i++) {
    $keyIdx = ($keyIndex + $i) % count($keys);
    $key = $keys[$keyIdx];
    
    $ch = curl_init('https://api.groq.com/openai/v1/chat/completions');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($data),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $key
        ],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 90
    ]);
    
    $resp = curl_exec($ch);
    $http = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($http === 200) {
        $response = $resp;
        $usedKey = $keyIdx;
        break;
    }
    
    if ($http !== 429) {
        $response = $resp;
        $usedKey = $keyIdx;
        break;
    }
    // 429 → جرب المفتاح التالي
}

// حفظ في Cache عند النجاح
if ($http === 200 && $response) {
    file_put_contents($cache_file, $response);
}

if ($http !== 200 || !$response) {
    echo json_encode(['success'=>false,'error'=>'كل المفاتيح Rate Limited','http'=>$http]);
    exit;
}

$json = json_decode($response, true);
$text = $json['choices'][0]['message']['content'] ?? '';

if (empty($text)) {
    echo json_encode(['success'=>false,'error'=>'Empty response','http'=>$http]);
    exit;
}

echo json_encode([
    'success' => true,
    'text' => $text,
    'key_used' => $usedKey,
    'cached' => false
]);
