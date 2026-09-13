<?php
$DB_USER = 'seabox_agent';
$DB_PASS = 'SeaBox2026!Secure';
$DB_NAME = 'nexusbox_db';
$MYSQL = 'mysql -u ' . $DB_USER . ' -p' . escapeshellarg($DB_PASS);
function execSQL($q) { global $MYSQL, $DB_NAME; return trim(shell_exec("$MYSQL $DB_NAME -N -e " . escapeshellarg($q) . " 2>&1")); }
$stats = ['users'=>execSQL("SELECT COUNT(*) FROM users"),'messages'=>execSQL("SELECT COUNT(*) FROM messages"),'channels'=>execSQL("SELECT COUNT(*) FROM channels"),'boxes'=>execSQL("SELECT COUNT(*) FROM boxes"),'alerts'=>execSQL("SELECT COUNT(*) FROM system_alerts")];
$health = ['uptime'=>trim(shell_exec('uptime -p')),'memory'=>trim(shell_exec("free -m | grep Mem | awk '{print \$3\"/\"\$2\" MB\"}'")),'disk'=>trim(shell_exec("df -h / | tail -1 | awk '{print \$5}'"))];
?>
<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>SeaBox Dashboard</title><style>body{font-family:Arial;background:#1a1a2e;color:#eee;padding:20px}.card{background:#16213e;padding:20px;border-radius:10px;margin:10px}.stat{display:flex;justify-content:space-between;padding:10px 0}</style></head><body><h1>🚀 SeaBox Dashboard</h1><div class="card"><h3>📊 الإحصائيات</h3><div class="stat"><span>المستخدمون</span><span><?= $stats['users'] ?></span></div><div class="stat"><span>الرسائل</span><span><?= $stats['messages'] ?></span></div><div class="stat"><span>القنوات</span><span><?= $stats['channels'] ?></span></div><div class="stat"><span>الصناديق</span><span><?= $stats['boxes'] ?></span></div><div class="stat"><span>التنبيهات</span><span><?= $stats['alerts'] ?></span></div></div><div class="card"><h3>💻 النظام</h3><div class="stat"><span>Uptime</span><span><?= $health['uptime'] ?></span></div><div class="stat"><span>الذاكرة</span><span><?= $health['memory'] ?></span></div><div class="stat"><span>القرص</span><span><?= $health['disk'] ?></span></div></div></body></html>
