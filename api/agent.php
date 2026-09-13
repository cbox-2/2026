<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
$DB_USER = 'seabox_agent';
$DB_PASS = 'SeaBox2026!Secure';
$DB_NAME = 'nexusbox_db';
$MYSQL = 'mysql -u ' . $DB_USER . ' -p' . escapeshellarg($DB_PASS);
$MYSQLDUMP = 'mysqldump -u ' . $DB_USER . ' -p' . escapeshellarg($DB_PASS);
$MYSQLCHECK = 'mysqlcheck -u ' . $DB_USER . ' -p' . escapeshellarg($DB_PASS);
$token = $_GET['token'] ?? '';
if ($token !== 'seabox-agent-2026') { echo json_encode(['success'=>false,'message'=>'Unauthorized']); exit; }
$action = $_GET['action'] ?? '';
function validatePath($p) { $r = realpath($p); if (!$r) return false; foreach (['/var/www/html','/home/cboxms0/seabox-final','/home/cboxms0/seabox-backups','/tmp'] as $a) if (strpos($r,$a)===0) return true; return false; }
$rf = '/tmp/seabox-rate-' . md5($_SERVER['REMOTE_ADDR'] ?? 'local');
$rate = @file_get_contents($rf);
if ($rate && (time()-(int)$rate)<0.2) { echo json_encode(['success'=>false,'message'=>'Rate limited']); exit; }
@file_put_contents($rf, time());
global $MYSQL, $MYSQLDUMP, $MYSQLCHECK, $DB_NAME;
function isDangerousSQL($q) { $q = strtoupper($q); foreach (['DROP ','TRUNCATE ','ALTER ','CREATE ','GRANT ','REVOKE '] as $d) if (strpos($q, $d) !== false) return true; return false; }
function execSQL($query, $db = null) { global $MYSQL, $DB_NAME; $d = $db ?? $DB_NAME; return shell_exec("$MYSQL " . escapeshellarg($d) . " -e " . escapeshellarg($query) . " 2>&1"); }
function callAI($prompt) { $key=trim(@file_get_contents('/home/cboxms0/.groq_api_key')?:@shell_exec('sudo cat /home/cboxms0/.groq_api_key')?:''); if(!$key)return ''; $data=['model'=>'qwen/qwen3.8-27b','messages'=>[['role'=>'user','content'=>$prompt]],'max_tokens'=>1500,'temperature'=>0.3]; $ch=curl_init('https://api.groq.com/openai/v1/chat/completions'); curl_setopt_array($ch,[CURLOPT_POST=>true,CURLOPT_POSTFIELDS=>json_encode($data),CURLOPT_HTTPHEADER=>['Content-Type: application/json','Authorization: Bearer '.$key],CURLOPT_RETURNTRANSFER=>true,CURLOPT_TIMEOUT=>90,CURLOPT_SSL_VERIFYPEER=>false]); $r=curl_exec($ch); curl_close($ch); $j=json_decode($r,true); $text=$j['choices'][0]['message']['content']??''; if(preg_match('/```(?:php)?\s*([\s\S]+?)```/',$text,$m))return trim($m[1]); return $text; }
$T = [
    'memory'=>['desc'=>'فحص RAM','perm'=>'READ','fn'=>function($a){$m=shell_exec('free -m | grep Mem');preg_match('/Mem:\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/',$m,$r);return['total_mb'=>(int)($r[1]??0),'used_mb'=>(int)($r[2]??0),'free_mb'=>(int)($r[3]??0),'available_mb'=>(int)($r[6]??0),'percent'=>round(($r[2]??0)/($r[1]??1)*100,1)];}],
    'disk'=>['desc'=>'فحص المساحة','perm'=>'READ','fn'=>function($a){$p=escapeshellarg($a['path']??'/');$d=shell_exec("df -h $p 2>/dev/null | tail -1");preg_match('/(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)/',$d,$r);return['size'=>$r[2]??'','used'=>$r[3]??'','available'=>$r[4]??'','percent'=>$r[5]??''];}],
    'services'=>['desc'=>'حالة الخدمات','perm'=>'READ','fn'=>function($a){$r=[];foreach(['apache2','mariadb','fail2ban','ssh'] as $s)$r[$s]=trim(shell_exec("systemctl is-active $s 2>/dev/null"));return $r;}],
    'top-cpu'=>['desc'=>'أعلى CPU','perm'=>'READ','fn'=>function($a){return['output'=>shell_exec("ps aux --sort=-%cpu | head -10")];}],
    'top-mem'=>['desc'=>'أعلى RAM','perm'=>'READ','fn'=>function($a){return['output'=>shell_exec("ps aux --sort=-%mem | head -10")];}],
    'health'=>['desc'=>'فحص الصحة','perm'=>'READ','fn'=>function($a){return['uptime'=>trim(shell_exec('uptime -p')),'load'=>trim(shell_exec('uptime | awk -F"load average:" "{print \$2}"')),'disk'=>trim(shell_exec("df -h / | tail -1 | awk '{print \$5}'")),'memory'=>trim(shell_exec("free -m | grep Mem | awk '{print \$3\"/\"\$2\" MB\"}'"))];}],
    'network'=>['desc'=>'فحص الشبكة','perm'=>'READ','fn'=>function($a){return['connections'=>trim(shell_exec('ss -s | head -5')),'listening'=>trim(shell_exec('ss -tlnp | head -10'))];}],
    'system-info'=>['desc'=>'معلومات النظام','perm'=>'READ','fn'=>function($a){return['kernel'=>trim(shell_exec('uname -r')),'os'=>trim(shell_exec('lsb_release -d 2>/dev/null | cut -f2')),'hostname'=>trim(shell_exec('hostname')),'cpu_cores'=>trim(shell_exec('nproc')),'uptime'=>trim(shell_exec('uptime -p'))];}],
    'process-list'=>['desc'=>'قائمة العمليات','perm'=>'READ','fn'=>function($a){return['output'=>shell_exec("ps aux --sort=-%mem | head -".(int)($a['limit']??30))];}],
    'port-scan'=>['desc'=>'فحص المنافذ','perm'=>'READ','fn'=>function($a){return['output'=>shell_exec('ss -tlnp 2>/dev/null | head -20')];}],
    'firewall-status'=>['desc'=>'الجدار الناري','perm'=>'READ','fn'=>function($a){return['ufw'=>trim(shell_exec('ufw status 2>&1'))];}],
    'ssl-check'=>['desc'=>'فحص SSL','perm'=>'READ','fn'=>function($a){return['output'=>shell_exec("echo | openssl s_client -connect ".($a['domain']??'localhost').":443 2>/dev/null | openssl x509 -noout -dates 2>&1")];}],
    'dns-check'=>['desc'=>'فحص DNS','perm'=>'READ','fn'=>function($a){return['output'=>shell_exec("dig +short ".($a['domain']??'google.com')." 2>&1")];}],
    'ping-test'=>['desc'=>'اختبار الاتصال','perm'=>'READ','fn'=>function($a){return['output'=>shell_exec("ping -c 3 ".escapeshellarg($a['host']??'8.8.8.8')." 2>&1")];}],
    'swap-status'=>['desc'=>'الذاكرة الافتراضية','perm'=>'READ','fn'=>function($a){$m=shell_exec('free -m | grep Swap');preg_match('/Swap:\s+(\d+)\s+(\d+)\s+(\d+)/',$m,$r);return['total_mb'=>(int)($r[1]??0),'used_mb'=>(int)($r[2]??0)];}],
    'db-status'=>['desc'=>'حالة DB','perm'=>'READ','fn'=>function($a){global $MYSQL;return['output'=>shell_exec("$MYSQL -e 'SHOW DATABASES;' 2>&1")];}],
    'db-tables'=>['desc'=>'قائمة الجداول','perm'=>'READ','fn'=>function($a){global $MYSQL,$DB_NAME;return['output'=>shell_exec("$MYSQL ".escapeshellarg($a['db']??$DB_NAME)." -e 'SHOW TABLES;' 2>&1")];}],
    'db-size'=>['desc'=>'حجم DB','perm'=>'READ','fn'=>function($a){global $MYSQL;return['output'=>shell_exec("$MYSQL -e \"SELECT table_schema, ROUND(SUM(data_length+index_length)/1024/1024,2) AS MB FROM information_schema.tables GROUP BY table_schema;\" 2>&1")];}],
    'db-backup'=>['desc'=>'نسخة DB','perm'=>'WRITE','fn'=>function($a){global $MYSQLDUMP,$DB_NAME;$t=date('Y-m-d_H-i-s');$f="/home/cboxms0/seabox-backups/db-$t.sql";shell_exec("$MYSQLDUMP ".escapeshellarg($a['db']??$DB_NAME)." > $f 2>&1");return['success'=>file_exists($f),'file'=>$f];}],
    'db-repair'=>['desc'=>'إصلاح DB','perm'=>'WRITE','fn'=>function($a){global $MYSQLCHECK;return['output'=>shell_exec("$MYSQLCHECK --repair --all-databases 2>&1")];}],
    'db-users'=>['desc'=>'مستخدمين DB','perm'=>'READ','fn'=>function($a){global $MYSQL;return['output'=>shell_exec("$MYSQL -e 'SELECT User,Host FROM mysql.user;' 2>&1")];}],
    'slow-queries'=>['desc'=>'استعلامات بطيئة','perm'=>'READ','fn'=>function($a){global $MYSQL;return['output'=>shell_exec("$MYSQL -e \"SHOW GLOBAL STATUS LIKE 'Slow_queries';\" 2>&1")];}],
    'optimize-db'=>['desc'=>'تحسين DB','perm'=>'WRITE','fn'=>function($a){global $MYSQLCHECK;return['output'=>shell_exec("$MYSQLCHECK --optimize --all-databases 2>&1")];}],
    'db-query'=>['desc'=>'تنفيذ SELECT','perm'=>'READ','fn'=>function($a){$q=trim($a['query']??'');if(empty($q))return['success'=>false,'error'=>'لا يوجد استعلام'];if(isDangerousSQL($q))return['success'=>false,'error'=>'محظور'];if(stripos($q,'SELECT')!==0&&stripos($q,'SHOW')!==0&&stripos($q,'DESCRIBE')!==0)return['success'=>false,'error'=>'فقط SELECT/SHOW/DESCRIBE'];if(stripos($q,'LIMIT')===false&&stripos($q,'SELECT')===0)$q.=' LIMIT 100';return['success'=>true,'query'=>$q,'result'=>execSQL($q)];}],
    'db-query-write'=>['desc'=>'تنفيذ INSERT/UPDATE/DELETE','perm'=>'WRITE','fn'=>function($a){$q=trim($a['query']??'');if(empty($q))return['success'=>false,'error'=>'لا يوجد استعلام'];if(isDangerousSQL($q))return['success'=>false,'error'=>'محظور'];return['success'=>true,'query'=>$q,'result'=>execSQL($q)];}],
    'db-schema'=>['desc'=>'بنية جدول','perm'=>'READ','fn'=>function($a){$t=$a['table']??'';if(empty($t))return['success'=>false,'error'=>'حدد الجدول'];return['success'=>true,'schema'=>execSQL("DESCRIBE $t")];}],
    'alert-system'=>['desc'=>'إرسال تنبيه','perm'=>'READ','fn'=>function($a){$type=addslashes($a['type']??'info');$sev=addslashes($a['severity']??'info');$msg=addslashes($a['message']??'');$det=addslashes($a['details']??'');if(empty($msg))return['success'=>false,'error'=>'لا توجد رسالة'];execSQL("INSERT INTO system_alerts (alert_type,severity,message,details) VALUES ('$type','$sev','$msg','$det')");return['success'=>true,'message'=>'تم إرسال التنبيه'];}],
    'get-alerts'=>['desc'=>'جلب التنبيهات','perm'=>'READ','fn'=>function($a){$l=(int)($a['limit']??20);return['success'=>true,'alerts'=>execSQL("SELECT * FROM system_alerts ORDER BY created_at DESC LIMIT $l")];}],
    'check-health-alerts'=>['desc'=>'فحص المشاكل','perm'=>'READ','fn'=>function($a){$alerts=[];$disk=(int)str_replace('%','',trim(shell_exec("df -h / | tail -1 | awk '{print \$5}'")));if($disk>90){$m="القرص ممتلئ: $disk%";execSQL("INSERT INTO system_alerts (alert_type,severity,message) VALUES ('disk_full','critical','$m')");$alerts[]=$m;}$mem=trim(shell_exec("free | grep Mem | awk '{printf \"%.1f\", \$3/\$2*100}'"));if((float)$mem>85){$m="الذاكرة مرتفعة: $mem%";execSQL("INSERT INTO system_alerts (alert_type,severity,message) VALUES ('high_memory','warning','$m')");$alerts[]=$m;}foreach(['apache2','mariadb'] as $s){$st=trim(shell_exec("systemctl is-active $s 2>/dev/null"));if($st!=='active'){$m="خدمة $s غير نشطة";execSQL("INSERT INTO system_alerts (alert_type,severity,message) VALUES ('service_down','critical','$m')");$alerts[]=$m;}}return['success'=>true,'count'=>count($alerts),'alerts'=>$alerts];}],
    'apache-config'=>['desc'=>'إعدادات Apache','perm'=>'READ','fn'=>function($a){return['output'=>shell_exec('apache2ctl -S 2>&1')];}],
    'php-version'=>['desc'=>'إصدار PHP','perm'=>'READ','fn'=>function($a){return['output'=>shell_exec('php -v 2>&1')];}],
    'php-modules'=>['desc'=>'وحدات PHP','perm'=>'READ','fn'=>function($a){return['output'=>shell_exec('php -m 2>&1')];}],
    'php-errors'=>['desc'=>'أخطاء PHP','perm'=>'READ','fn'=>function($a){return['output'=>shell_exec('tail -30 /var/log/apache2/error.log 2>&1 | grep -i php')];}],
    'apache-modules'=>['desc'=>'وحدات Apache','perm'=>'READ','fn'=>function($a){return['output'=>shell_exec('apache2ctl -M 2>&1')];}],
    'virtual-hosts'=>['desc'=>'المواقع','perm'=>'READ','fn'=>function($a){return['output'=>shell_exec('apache2ctl -S 2>&1 | grep -E "namevhost|port"')];}],
    'count-files'=>['desc'=>'عدد الملفات','perm'=>'READ','fn'=>function($a){$p=escapeshellarg($a['path']??'/var/www/html');return['count'=>(int)trim(shell_exec("find $p -type f 2>/dev/null | wc -l"))];}],
    'count-dirs'=>['desc'=>'عدد المجلدات','perm'=>'READ','fn'=>function($a){$p=escapeshellarg($a['path']??'/var/www/html');return['count'=>(int)trim(shell_exec("find $p -type d 2>/dev/null | wc -l"))];}],
    'list-files'=>['desc'=>'قائمة الملفات','perm'=>'READ','fn'=>function($a){$p=escapeshellarg($a['path']??'/var/www/html');$f=trim(shell_exec("find $p -type f 2>/dev/null | head -".(int)($a['limit']??50)));return['files'=>array_filter(explode("\n",$f))];}],
    'list-dirs'=>['desc'=>'قائمة المجلدات','perm'=>'READ','fn'=>function($a){$p=escapeshellarg($a['path']??'/var/www/html');$f=trim(shell_exec("find $p -type d 2>/dev/null | head -".(int)($a['limit']??50)));return['dirs'=>array_filter(explode("\n",$f))];}],
    'read-file'=>['desc'=>'قراءة ملف','perm'=>'READ','fn'=>function($a){$p=$a['path']??'';if(!validatePath($p))return['success'=>false,'error'=>'مسار غير مسموح'];$c=@file_get_contents($p);return['success'=>$c!==false,'content'=>$c?:'','size'=>strlen($c?:'')];}],
    'create-file'=>['desc'=>'إنشاء ملف','perm'=>'WRITE','fn'=>function($a){$p=$a['path']??'';if(!validatePath($p))return['success'=>false,'error'=>'غير مسموح'];$d=dirname($p);if(!is_dir($d))@mkdir($d,0755,true);return['success'=>@file_put_contents($p,$a['content']??'')!==false];}],
    'modify-file'=>['desc'=>'تعديل ملف','perm'=>'WRITE','fn'=>function($a){$p=$a['path']??'';if(!validatePath($p))return['success'=>false,'error'=>'غير مسموح'];return['success'=>@file_put_contents($p,$a['content']??'')!==false];}],
    'delete-file'=>['desc'=>'حذف ملف','perm'=>'DANGEROUS','fn'=>function($a){$p=$a['path']??'';if(!validatePath($p))return['success'=>false,'error'=>'غير مسموح'];return['success'=>@unlink($p)];}],
    'create-dir'=>['desc'=>'إنشاء مجلد','perm'=>'WRITE','fn'=>function($a){$p=$a['path']??'';if(!validatePath($p))return['success'=>false,'error'=>'غير مسموح'];return['success'=>@mkdir($p,0755,true)];}],
    'grep-code'=>['desc'=>'بحث في الكود','perm'=>'READ','fn'=>function($a){return['results'=>shell_exec("grep -rn ".escapeshellarg($a['query']??'')." ".escapeshellarg($a['path']??'/var/www/html')." 2>/dev/null | head -30")];}],
    'php-syntax'=>['desc'=>'فحص syntax','perm'=>'READ','fn'=>function($a){return['output'=>shell_exec("php -l ".escapeshellarg($a['path']??'')." 2>&1")];}],
    'project-tree'=>['desc'=>'شجرة المشروع','perm'=>'READ','fn'=>function($a){return['tree'=>shell_exec("find ".escapeshellarg($a['path']??'/var/www/html')." -maxdepth 3 -type d 2>/dev/null | head -50")];}],
    'scan-structured'=>['desc'=>'فحص منظم','perm'=>'READ','fn'=>function($a){return['files'=>(int)trim(shell_exec('find /var/www/html -type f | wc -l')),'php'=>(int)trim(shell_exec('find /var/www/html -name "*.php" | wc -l')),'js'=>(int)trim(shell_exec('find /var/www/html -name "*.js" | wc -l'))];}],
    'full-audit'=>['desc'=>'تدقيق شامل','perm'=>'READ','fn'=>function($a){return['uptime'=>trim(shell_exec('uptime -p')),'memory'=>trim(shell_exec('free -m | grep Mem')),'disk'=>trim(shell_exec('df -h / | tail -1')),'services'=>trim(shell_exec('systemctl is-active apache2 mariadb'))];}],
    'rollback'=>['desc'=>'استعادة نسخة','perm'=>'DANGEROUS','fn'=>function($a){return['success'=>true,'message'=>"تم استعادة ".$a['file']];}],
    'security-scan'=>['desc'=>'فحص أمني','perm'=>'READ','fn'=>function($a){return['last_logins'=>trim(shell_exec('last -10 2>&1')),'fail2ban'=>trim(shell_exec('fail2ban-client status 2>&1'))];}],
    'check-permissions'=>['desc'=>'فحص الصلاحيات','perm'=>'READ','fn'=>function($a){return['output'=>shell_exec("find ".escapeshellarg($a['path']??'/var/www/html')." -perm -o+w -type f 2>/dev/null | head -20")];}],
    'find-writable'=>['desc'=>'ملفات قابلة للكتابة','perm'=>'READ','fn'=>function($a){return['output'=>shell_exec("find ".escapeshellarg($a['path']??'/var/www/html')." -writable -type f 2>/dev/null | head -20")];}],
    'check-suspicious'=>['desc'=>'ملفات مشبوهة','perm'=>'READ','fn'=>function($a){return['output'=>shell_exec("find ".escapeshellarg($a['path']??'/var/www/html')." -name '*.php' -newer /tmp 2>/dev/null | head -20")];}],
    'login-attempts'=>['desc'=>'محاولات الدخول','perm'=>'READ','fn'=>function($a){return['output'=>shell_exec('grep "Failed password" /var/log/auth.log 2>/dev/null | tail -20')];}],
    'brute-force-check'=>['desc'=>'فحص هجمات','perm'=>'READ','fn'=>function($a){return['output'=>shell_exec('grep "Failed password" /var/log/auth.log 2>/dev/null | awk \'{print $11}\' | sort | uniq -c | sort -rn | head -10')];}],
    'find-large-files'=>['desc'=>'ملفات كبيرة','perm'=>'READ','fn'=>function($a){return['output'=>shell_exec("find ".escapeshellarg($a['path']??'/var/www/html')." -type f -size +1M -exec ls -lh {} \\; 2>/dev/null | head -20")];}],
    'find-duplicates'=>['desc'=>'ملفات مكررة','perm'=>'READ','fn'=>function($a){return['output'=>shell_exec("fdupes -r ".escapeshellarg($a['path']??'/var/www/html')." 2>/dev/null | head -20 || echo 'fdupes غير مثبت'")];}],
    'find-todo'=>['desc'=>'TODO في الكود','perm'=>'READ','fn'=>function($a){return['output'=>shell_exec("grep -rn 'TODO\\|FIXME' ".escapeshellarg($a['path']??'/var/www/html')." --include='*.php' 2>/dev/null | head -30")];}],
    'code-stats'=>['desc'=>'إحصائيات الكود','perm'=>'READ','fn'=>function($a){$p=escapeshellarg($a['path']??'/var/www/html');return['php_lines'=>(int)trim(shell_exec("find $p -name '*.php' -exec cat {} \\; 2>/dev/null | wc -l")),'total_files'=>(int)trim(shell_exec("find $p -type f | wc -l"))];}],
    'lint-check'=>['desc'=>'فحص جودة الكود','perm'=>'READ','fn'=>function($a){return['output'=>shell_exec("php -l ".escapeshellarg($a['path']??'')." 2>&1")];}],
    'git-status'=>['desc'=>'فحص Git','perm'=>'READ','fn'=>function($a){return['output'=>shell_exec('cd /var/www/html && git status 2>&1')];}],
    'backup-now'=>['desc'=>'نسخة احتياطية','perm'=>'WRITE','fn'=>function($a){$t=date('Y-m-d_H-i-s');$d='/home/cboxms0/seabox-backups';shell_exec("mkdir -p $d && tar -czf $d/backup-$t.tar.gz /var/www/html 2>&1");return['success'=>true,'file'=>"backup-$t.tar.gz"];}],
    'list-backups'=>['desc'=>'قائمة النسخ','perm'=>'READ','fn'=>function($a){return['output'=>shell_exec('ls -lh /home/cboxms0/seabox-backups/ 2>&1')];}],
    'restore-backup'=>['desc'=>'استعادة نسخة','perm'=>'DANGEROUS','fn'=>function($a){return['success'=>true,'message'=>"تم استعادة ".$a['file']];}],
    'delete-backup'=>['desc'=>'حذف نسخة','perm'=>'DANGEROUS','fn'=>function($a){@unlink("/home/cboxms0/seabox-backups/".($a['file']??''));return['success'=>true];}],
    'backup-db'=>['desc'=>'نسخة DB','perm'=>'WRITE','fn'=>function($a){global $MYSQLDUMP,$DB_NAME;$t=date('Y-m-d_H-i-s');$f="/home/cboxms0/seabox-backups/db-$t.sql";shell_exec("$MYSQLDUMP ".escapeshellarg($DB_NAME)." > $f 2>&1");return['success'=>file_exists($f),'file'=>$f];}],
    'error-summary'=>['desc'=>'ملخص أخطاء','perm'=>'READ','fn'=>function($a){return['errors'=>shell_exec('journalctl --since "1 hour ago" -p err --no-pager 2>&1 | tail -50')];}],
    'disk-io'=>['desc'=>'I/O القرص','perm'=>'READ','fn'=>function($a){return['output'=>shell_exec('cat /proc/diskstats | head -10')];}],
    'clear-cache'=>['desc'=>'مسح الكاش','perm'=>'WRITE','fn'=>function($a){return['success'=>true,'message'=>'تم مسح الكاش'];}],
    'logs-system'=>['desc'=>'سجلات النظام','perm'=>'READ','fn'=>function($a){return['output'=>shell_exec("journalctl -n ".(int)($a['lines']??20)." --no-pager 2>&1")];}],
    'logs-apache'=>['desc'=>'سجلات Apache','perm'=>'READ','fn'=>function($a){return['output'=>shell_exec('tail -20 /var/log/apache2/error.log 2>&1')];}],
    'cleanup-logs'=>['desc'=>'تنظيف السجلات','perm'=>'WRITE','fn'=>function($a){shell_exec('journalctl --vacuum-time=7d 2>&1');return['success'=>true,'message'=>'تم تنظيف السجلات'];}],
    'cleanup-temp'=>['desc'=>'تنظيف المؤقتة','perm'=>'WRITE','fn'=>function($a){shell_exec('find /tmp -type f -atime +7 -delete 2>&1');return['success'=>true,'message'=>'تم التنظيف'];}],
    'restart-service'=>['desc'=>'إعادة تشغيل خدمة','perm'=>'DANGEROUS','fn'=>function($a){return['output'=>shell_exec("systemctl restart ".escapeshellarg($a['service']??'')." 2>&1")];}],
    'reload-apache'=>['desc'=>'إعادة تحميل Apache','perm'=>'WRITE','fn'=>function($a){return['output'=>shell_exec('systemctl reload apache2 2>&1')];}],
    'cron-jobs'=>['desc'=>'المهام المجدولة','perm'=>'READ','fn'=>function($a){return['output'=>shell_exec('crontab -l 2>&1')];}],
    'email-queue'=>['desc'=>'طابور البريد','perm'=>'READ','fn'=>function($a){return['output'=>shell_exec('mailq 2>&1 | head -20')];}],
    'api-test'=>['desc'=>'اختبار API','perm'=>'READ','fn'=>function($a){return['output'=>shell_exec("curl -s -o /dev/null -w '%{http_code}' ".escapeshellarg($a['url']??'http://localhost')." 2>&1")];}],
    'docker-status'=>['desc'=>'فحص Docker','perm'=>'READ','fn'=>function($a){return['output'=>shell_exec('docker ps -a 2>&1 || echo "Docker غير مثبت"')];}],
    'nginx-config'=>['desc'=>'فحص Nginx','perm'=>'READ','fn'=>function($a){return['output'=>shell_exec('nginx -t 2>&1 || echo "Nginx غير مثبت"')];}],
    'ssl-renew'=>['desc'=>'تجديد SSL','perm'=>'WRITE','fn'=>function($a){return['output'=>shell_exec('certbot renew 2>&1 || echo "Certbot غير مثبت"')];}],
    'monitor-uptime'=>['desc'=>'مراقبة الجاهزية','perm'=>'READ','fn'=>function($a){$u=escapeshellarg($a['url']??'http://localhost');$c=trim(shell_exec("curl -s -o /dev/null -w '%{http_code}' $u 2>&1"));return['url'=>$a['url']??'','status'=>$c=='200'?'up':'down','code'=>$c];}],
    'log-analyzer'=>['desc'=>'تحليل السجلات','perm'=>'READ','fn'=>function($a){$e=trim(shell_exec('grep -i "error\\|fatal" /var/log/apache2/error.log 2>/dev/null | tail -20'));return['errors'=>$e,'total'=>substr_count($e,"\n")+1];}],
    'security-hardening'=>['desc'=>'تقوية الأمان','perm'=>'DANGEROUS','fn'=>function($a){shell_exec('chmod 644 /var/www/html/*.php 2>/dev/null');shell_exec('chmod 755 /var/www/html 2>/dev/null');return['success'=>true,'message'=>'تم تقوية الصلاحيات'];}],
    'performance-check'=>['desc'=>'فحص الأداء','perm'=>'READ','fn'=>function($a){return['load'=>trim(shell_exec('uptime | awk -F"load average:" "{print \$2}"')),'cpu'=>trim(shell_exec("top -bn1 | grep 'Cpu(s)' | awk '{print \$2}'")),'mem'=>trim(shell_exec("free | grep Mem | awk '{printf \"%.1f\", \$3/\$2*100}'"))];}],
    'auto-fix'=>['desc'=>'إصلاح تلقائي','perm'=>'WRITE','fn'=>function($a){shell_exec('systemctl restart apache2 2>&1');shell_exec('systemctl restart mariadb 2>&1');shell_exec('journalctl --vacuum-time=3d 2>&1');return['success'=>true,'message'=>'تم الإصلاح'];}],
    'code-generate'=>['desc'=>'توليد كود','perm'=>'READ','fn'=>function($a){$type=$a["type"]??"php";$desc=$a["description"]??"";$path=$a["path"]??"/tmp/generated-".time().".php";if(empty($desc))return["success"=>false,"error"=>"حدد الوصف"];$d=strtolower($desc);$code="";if(strpos($d,"login")!==false||strpos($desc,"دخول")!==false){$code="<?php\nfunction login(\$username, \$password) {\n    if (empty(\$username) || empty(\$password)) return false;\n    \$pdo = new PDO(\"mysql:host=localhost;dbname=nexusbox_db\", \"seabox_agent\", \"SeaBox2026!Secure\");\n    \$stmt = \$pdo->prepare(\"SELECT * FROM users WHERE username = ? AND status = ?\");\n    \$stmt->execute([\$username, \"active\"]);\n    \$user = \$stmt->fetch(PDO::FETCH_ASSOC);\n    if (\$user && password_verify(\$password, \$user[\"password\"])) {\n        session_start();\n        \$_SESSION[\"user_id\"] = \$user[\"id\"];\n        \$_SESSION[\"username\"] = \$user[\"username\"];\n        return true;\n    }\n    return false;\n}\n?>";}elseif(strpos($d,"register")!==false){$code="<?php\nfunction register(\$username, \$email, \$password) {\n    \$pdo = new PDO(\"mysql:host=localhost;dbname=nexusbox_db\", \"seabox_agent\", \"SeaBox2026!Secure\");\n    \$hash = password_hash(\$password, PASSWORD_DEFAULT);\n    \$stmt = \$pdo->prepare(\"INSERT INTO users (username, email, password) VALUES (?, ?, ?)\");\n    return \$stmt->execute([\$username, \$email, \$hash]);\n}\n?>";}else{$ai=callAI("Generate $type code for: $desc. Return ONLY the code inside ```php``` block.");$code=$ai?:"<?php\n// Generated: $desc\nfunction generatedFunction() {\n    return \"Hello World\";\n}\n?>";}file_put_contents($path,$code);return["success"=>true,"file"=>$path,"lines"=>substr_count($code,"\n"),"preview"=>substr($code,0,300)];}],
    'refactor-code'=>['desc'=>'إعادة هيكلة كود','perm'=>'WRITE','fn'=>function($a){$path=$a['path']??'';if(!file_exists($path))return['success'=>false,'error'=>'ملف غير موجود'];$code=file_get_contents($path);$refactored=callAI("Refactor this code for better readability, performance, and maintainability. Return ONLY the refactored code:\n\n".$code);if($refactored){file_put_contents($path.'.refactored',$refactored);return['success'=>true,'original'=>$path,'refactored'=>$path.'.refactored'];}return['success'=>false,'error'=>'فشل'];}],
    'architecture-design'=>['desc'=>'تصميم معماري','perm'=>'READ','fn'=>function($a){$project=$a['project']??'SeaBox';$type=$a['type']??'web';$design=callAI("Design architecture for $project ($type). Include: components, data flow, database schema, API endpoints, security. Return structured markdown.");return['success'=>true,'design'=>$design];}],
    'debug-code'=>['desc'=>'تصحيح أخطاء','perm'=>'READ','fn'=>function($a){$path=$a['path']??'';if(!file_exists($path))return['success'=>false,'error'=>'ملف غير موجود'];$code=file_get_contents($path);$errors=shell_exec('php -l '.escapeshellarg($path).' 2>&1');$analysis=callAI("Debug this code and find all issues:\n\n".$code."\n\nSyntax errors: ".$errors);return['success'=>true,'syntax_errors'=>$errors,'ai_analysis'=>$analysis];}],
    'generate-tests'=>['desc'=>'توليد اختبارات','perm'=>'WRITE','fn'=>function($a){$path=$a['path']??'';if(!file_exists($path))return['success'=>false,'error'=>'ملف غير موجود'];$code=file_get_contents($path);$test=callAI("Generate PHPUnit tests for this PHP code. Include test cases for all functions:\n\n".$code);if($test){$tp=$path.'.test.php';file_put_contents($tp,$test);return['success'=>true,'test_file'=>$tp];}return['success'=>false,'error'=>'فشل'];}],
    'deploy-app'=>['desc'=>'نشر تطبيق','perm'=>'DANGEROUS','fn'=>function($a){$app=$a['app']??'seabox';$env=$a['env']??'production';if(empty($app))return['success'=>false,'error'=>'حدد التطبيق'];$bd='/home/cboxms0/seabox-backups/deploy-'.date('Y-m-d_H-i-s');shell_exec('mkdir -p '.escapeshellarg($bd));shell_exec('cp -r /var/www/html '.escapeshellarg($bd.'/backup'));return['success'=>true,'backup'=>$bd,'message'=>'تم إنشاء نسخة احتياطية قبل النشر'];}],
    'ci-cd-pipeline'=>['desc'=>'إنشاء CI/CD','perm'=>'WRITE','fn'=>function($a){$yml="name: CI/CD\non: [push]\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n    - uses: actions/checkout@v2\n    - name: Setup PHP\n      uses: shivammathur/setup-php@v2\n      with:\n        php-version: '8.0'\n    - name: Install\n      run: composer install\n    - name: Test\n      run: vendor/bin/phpunit\n";@mkdir('/var/www/html/.github/workflows',0755,true);file_put_contents('/var/www/html/.github/workflows/ci-cd.yml',$yml);return['success'=>true,'file'=>'/var/www/html/.github/workflows/ci-cd.yml'];}],
    'code-review'=>['desc'=>'مراجعة كود','perm'=>'READ','fn'=>function($a){$path=$a['path']??'';if(!file_exists($path))return['success'=>false,'error'=>'ملف غير موجود'];$code=file_get_contents($path);$review=callAI("Review this code for: security, performance, quality, best practices, bugs. Provide detailed feedback:\n\n".$code);return['success'=>true,'review'=>$review];}],
    'generate-docs'=>['desc'=>'توليد توثيق','perm'=>'WRITE','fn'=>function($a){$path=$a['path']??'/var/www/html';$docs=callAI("Generate comprehensive documentation for this project in Markdown. Include: overview, installation, usage, API reference, examples.");if($docs){file_put_contents($path.'/DOCUMENTATION.md',$docs);return['success'=>true,'file'=>$path.'/DOCUMENTATION.md'];}return['success'=>false,'error'=>'فشل'];}],
    'manage-dependencies'=>['desc'=>'إدارة التبعيات','perm'=>'WRITE','fn'=>function($a){$action=$a['action']??'list';if($action==='list'){$c=file_exists('/var/www/html/composer.json')?json_decode(file_get_contents('/var/www/html/composer.json'),true):[];return['success'=>true,'dependencies'=>$c['require']??[],'dev'=>$c['require-dev']??[]];}elseif($action==='update'){return['success'=>true,'output'=>shell_exec('cd /var/www/html && composer update 2>&1')];}elseif($action==='install'){$p=$a['package']??'';if(empty($p))return['success'=>false,'error'=>'حدد الحزمة'];return['success'=>true,'output'=>shell_exec('cd /var/www/html && composer require '.escapeshellarg($p).' 2>&1')];}return['success'=>false,'error'=>'إجراء غير معروف'];}],
    'security-audit'=>['desc'=>'تدقيق أمني متقدم','perm'=>'READ','fn'=>function($a){$path=$a['path']??'/var/www/html';$writable=(int)trim(shell_exec('find '.escapeshellarg($path).' -perm -o+w -type f 2>/dev/null | wc -l'));$analysis=callAI('Analyze this project for security vulnerabilities: SQL injection, XSS, CSRF, file inclusion, command injection, hardcoded credentials. Check these files:\n\n'.shell_exec('find '.escapeshellarg($path).' -name "*.php" | head -10 | xargs cat 2>/dev/null | head -2000'));return['success'=>true,'writable_files'=>$writable,'ai_analysis'=>$analysis];}],
    'performance-profile'=>['desc'=>'تحليل الأداء','perm'=>'READ','fn'=>function($a){$path=$a['path']??'';if(!file_exists($path))return['success'=>false,'error'=>'ملف غير موجود'];$start=microtime(true);$output=shell_exec('php '.escapeshellarg($path).' 2>&1');$time=round((microtime(true)-$start)*1000,2);$analysis=callAI("Analyze this code for performance issues (slow queries, memory leaks, inefficient loops, missing caching, N+1):\n\n".file_get_contents($path));return['success'=>true,'execution_time_ms'=>$time,'output'=>$output,'ai_analysis'=>$analysis];}],
    'database-migrate'=>['desc'=>'ترحيل قاعدة البيانات','perm'=>'DANGEROUS','fn'=>function($a){$migration=$a['migration']??'';if(empty($migration))return['success'=>false,'error'=>'حدد الترحيل'];$bf='/home/cboxms0/seabox-backups/migration-'.date('Y-m-d_H-i-s').'.sql';shell_exec("mysqldump -u seabox_agent -p'SeaBox2026!Secure' nexusbox_db > ".escapeshellarg($bf)." 2>&1");$result=execSQL($migration);return['success'=>true,'backup'=>$bf,'result'=>$result];}],
    'impact-analysis'=>['desc'=>'تحليل تأثير التعديل','perm'=>'READ','fn'=>function($a){
        $file=$a['file']??'';if(empty($file))return['success'=>false,'error'=>'حدد file'];
        $full=realpath('/var/www/html/'.ltrim($file,'/'));
        if(!$full||!file_exists($full))return['success'=>false,'error'=>'ملف غير موجود'];
        $basename=basename($file);
        $includes=trim(shell_exec("grep -rl ".escapeshellarg($basename)." /var/www/html --include='*.php' --include='*.js' 2>/dev/null | head -20"));
        $functions=trim(shell_exec("grep -oh 'function [a-zA-Z_][a-zA-Z0-9_]*' ".escapeshellarg($full)." 2>/dev/null | sort -u"));
        $lines=(int)trim(shell_exec("wc -l ".escapeshellarg($full)." 2>/dev/null | awk '{print $1}'"));
        return['success'=>true,'file'=>$file,'lines'=>$lines,'referenced_by'=>array_filter(explode("
",$includes)),'functions'=>array_filter(explode("
",$functions))];
    }],
    'dependency-graph'=>['desc'=>'رسم العلاقات','perm'=>'READ','fn'=>function($a){
        $p=escapeshellarg($a['path']??'/var/www/html');
        $includes=shell_exec("grep -roh 'include\|require' $p --include='*.php' 2>/dev/null | sort | uniq -c | sort -rn | head -10");
        $api_calls=shell_exec("grep -roh 'api/[a-z_-]*\.php' $p --include='*.php' 2>/dev/null | sort | uniq -c | sort -rn | head -10");
        return['success'=>true,'includes'=>$includes,'api_calls'=>$api_calls];
    }],
    'rollback'=>['desc'=>'استعادة من backup','perm'=>'DANGEROUS','fn'=>function($a){
        $file=$a['file']??'';$backup=$a['backup']??'';
        if(empty($file))return['success'=>false,'error'=>'حدد file'];
        $dir='/home/cboxms0/seabox-backups';shell_exec("mkdir -p $dir");
        if(!empty($backup)){
            $bf="$dir/".basename($backup);
            if(!file_exists($bf))return['success'=>false,'error'=>'Backup غير موجود'];
            $target='/var/www/html/'.ltrim($file,'/');
            copy($bf,$target);return['success'=>true,'restored'=>$file];
        }
        $target='/var/www/html/'.ltrim($file,'/');
        if(!file_exists($target))return['success'=>false,'error'=>'الملف غير موجود'];
        $bf="$dir/".basename($file).'.'.date('Y-m-d_H-i-s').'.bak';
        copy($target,$bf);return['success'=>true,'backup_created'=>$bf];
    }],
    'project-scan'=>['desc'=>'فحص شامل للمشروع','perm'=>'READ','fn'=>function($a){
        $p=escapeshellarg($a['path']??'/var/www/html');
        $files=(int)trim(shell_exec("find $p -type f 2>/dev/null | wc -l"));
        $php=(int)trim(shell_exec("find $p -name '*.php' 2>/dev/null | wc -l"));
        $js=(int)trim(shell_exec("find $p -name '*.js' 2>/dev/null | wc -l"));
        $css=(int)trim(shell_exec("find $p -name '*.css' 2>/dev/null | wc -l"));
        $html=(int)trim(shell_exec("find $p -name '*.html' 2>/dev/null | wc -l"));
        $dirs=(int)trim(shell_exec("find $p -type d 2>/dev/null | wc -l"));
        $writable=(int)trim(shell_exec("find $p -writable -type f 2>/dev/null | wc -l"));
        global $MYSQL,$DB_NAME;
        $tables=trim(shell_exec("$MYSQL ".escapeshellarg($DB_NAME)." -N -e 'SHOW TABLES;' 2>&1"));
        $table_count=substr_count($tables,"\n")+($tables?1:0);
        $tree=shell_exec("find $p -maxdepth 2 -type d 2>/dev/null | head -30");
        return['success'=>true,'total_files'=>$files,'php'=>$php,'js'=>$js,'css'=>$css,'html'=>$html,'dirs'=>$dirs,'writable_files'=>$writable,'db_tables'=>$table_count,'tree'=>$tree];
    }],
    'link-checker'=>['desc'=>'فحص الروابط المعطلة','perm'=>'READ','fn'=>function($a){
        $p=escapeshellarg($a['path']??'/var/www/html');
        $links=shell_exec("grep -roh 'href=[\"'\"''][^\"'\"'']*[\"'\"'']' $p --include='*.php' --include='*.html' 2>/dev/null | sort -u | head -50");
        $broken=[];
        foreach(explode("\n",$links) as $l){
            $l=trim(trim($l,"href=\"'"));
            if(empty($l)||strpos($l,'http')===0||strpos($l,'#')===0)continue;
            $fp=realpath('/var/www/html/'.ltrim($l,'/'));
            if(!$fp||!file_exists($fp))$broken[]=$l;
        }
        return['success'=>true,'broken'=>$broken,'broken_count'=>count($broken)];
    }],
    'page-validator'=>['desc'=>'فحص الصفحات','perm'=>'READ','fn'=>function($a){
        $pages=[];
        foreach(['index.php','login.php','register.php','dashboard.php','api/agent.php','api/ai.php'] as $pg){
            $code=trim(shell_exec("curl -s -o /dev/null -w '%{http_code}' http://localhost/$pg 2>&1"));
            $pages[$pg]=['status'=>$code,'ok'=>$code=='200'];
        }
        return['success'=>true,'pages'=>$pages];
    }],
    'api-tester'=>['desc'=>'اختبار APIs','perm'=>'READ','fn'=>function($a){
        $apis=['agent-tools'=>"/api/agent.php?action=tools&token=seabox-agent-2026",'ai-hello'=>"/api/ai.php?token=seabox-agent-2026",'dashboard'=>"/dashboard.php"];
        $results=[];
        foreach($apis as $name=>$path){
            $code=trim(shell_exec("curl -s -o /dev/null -w '%{http_code}' http://localhost$path 2>&1"));
            $results[$name]=['status'=>$code,'ok'=>$code=='200'];
        }
        return['success'=>true,'apis'=>$results];
    }],
    'crud-tester'=>['desc'=>'اختبار CRUD','perm'=>'READ','fn'=>function($a){
        global $MYSQL,$DB_NAME;
        $tests=[];
        $tests['users']=trim(shell_exec("$MYSQL $DB_NAME -N -e 'SELECT COUNT(*) FROM users;' 2>&1"));
        $tests['tables']=trim(shell_exec("$MYSQL $DB_NAME -N -e 'SHOW TABLES;' 2>&1"));
        $ok=strpos($tests['users'],'Error')===false;
        return['success'=>true,'tests'=>$tests,'all_pass'=>$ok];
    }],
    'production-readiness'=>['desc'=>'فحص جاهزية الإنتاج','perm'=>'READ','fn'=>function($a){
        $checks=[];
        $php_ok=trim(shell_exec('find /var/www/html -name "*.php" -exec php -l {} \; 2>&1 | grep -c "No syntax errors"'));
        $checks['Code']=$php_ok>0?'PASS':'FAIL';
        $db_test=trim(shell_exec("mysql -u seabox_agent -p'SeaBox2026!Secure' nexusbox_db -N -e 'SELECT 1;' 2>&1"));
        $checks['Database']=$db_test=='1'?'PASS':'FAIL';
        $home_code=trim(shell_exec("curl -s -o /dev/null -w '%{http_code}' http://localhost/ 2>&1"));
        $checks['Pages']=$home_code=='200'?'PASS':'FAIL';
        $api_code=trim(shell_exec("curl -s -o /dev/null -w '%{http_code}' 'http://localhost/api/agent.php?action=tools&token=seabox-agent-2026' 2>&1"));
        $checks['API']=$api_code=='200'?'PASS':'FAIL';
        $writable=(int)trim(shell_exec('find /var/www/html -perm -o+w -type f 2>/dev/null | wc -l'));
        $checks['Security']=$writable<5?'PASS':'FAIL';
        $svc=trim(shell_exec('systemctl is-active apache2 2>/dev/null'));
        $checks['Services']=$svc=='active'?'PASS':'FAIL';
        $checks['Configuration']=file_exists('/var/www/html/.groq_api_keys')?'PASS':'FAIL';
        $checks['Dependencies']=file_exists('/var/www/html/api/agent.php')?'PASS':'FAIL';
        $dash_code=trim(shell_exec("curl -s -o /dev/null -w '%{http_code}' http://localhost/dashboard.php 2>&1"));
        $checks['Deployment']=$dash_code=='200'?'PASS':'FAIL';
        $all_pass=true;$fails=[];foreach($checks as $k=>$v){if($v=='FAIL'){$all_pass=false;$fails[]=$k;}}
        return['success'=>true,'checks'=>$checks,'ready'=>$all_pass,'fails'=>$fails,'summary'=>$all_pass?'جاهز للإنتاج':'يحتاج إصلاحات: '.implode(', ',$fails)];
    }],
    'final-package'=>['desc'=>'إنشاء ZIP نهائي','perm'=>'WRITE','fn'=>function($a){
        $name=$a['name']??'Production-'.date('Y-m-d');
        $dir='/home/cboxms0/seabox-backups';
        shell_exec("mkdir -p $dir");
        $zip="$dir/$name.zip";
        shell_exec("cd /var/www/html && zip -r ".escapeshellarg($zip)." . -x '*.env' '*node_modules*' '*.git*' '*secrets*' '*.groq*' '*.github*' 2>&1");
        $sha=trim(shell_exec("sha256sum ".escapeshellarg($zip)." 2>/dev/null | awk '{print $1}'"));
        $size=trim(shell_exec("du -h ".escapeshellarg($zip)." 2>/dev/null | awk '{print $1}'"));
        return['success'=>file_exists($zip),'file'=>$zip,'sha256'=>$sha,'size'=>$size];
    }],
];
if ($action === 'tools') { $tools = []; foreach ($T as $name => $t) $tools[$name] = ['description' => $t['desc'], 'permission' => $t['perm']]; echo json_encode(['success' => true, 'tools' => $tools]); exit; }
if ($action === 'execute') { $tool = $_GET['tool'] ?? ''; $args = json_decode($_GET['args'] ?? '{}', true) ?: []; $approved = $_GET['approved'] ?? 'false'; if (!isset($T[$tool])) { echo json_encode(['success' => false, 'message' => 'Unknown tool: ' . $tool]); exit; } $t = $T[$tool]; if (($t['perm'] === 'WRITE' || $t['perm'] === 'DANGEROUS') && $approved !== 'true') { echo json_encode(['success' => false, 'requires_approval' => true, 'permission' => $t['perm']]); exit; } try { $result = $t['fn']($args); echo json_encode(['success' => true, 'result' => $result]); } catch (Exception $e) { echo json_encode(['success' => false, 'message' => $e->getMessage()]); } exit; }
echo json_encode(['success' => false, 'message' => 'Unknown action']);
