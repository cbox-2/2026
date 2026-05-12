console.log("🚀 النظام المتكامل يبدأ...");

// 🔑 إعدادات Firebase
const firebaseConfig = {
    apiKey: "AIzaSyD_UssZllzECYbTMR_0NCTzEGAIMeZAcos",
    authDomain: "cbox22026.firebaseapp.com",
    projectId: "cbox22026",
    storageBucket: "cbox22026.firebasestorage.app",
    messagingSenderId: "175894881657",
    appId: "1:175894881657:web:ae5e693d843ee594eb7ba8",
    measurementId: "G-0BP0P4KWL8"
};

try {
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();

    // 🌐 المتغيرات العامة
    let currentUser = null, userRole = 'user', isBanned = false, unsubChat = null;
    let notifAllowed = false;
    const $ = id => document.getElementById(id);

    // 🔐 تسجيل الدخول
    window.doLogin = async (e) => {
        e.preventDefault();
        const em = $('em')?.value.trim(), pw = $('pw')?.value.trim();
        if (!em || !pw) return alert("⚠️ املأ الحقول");
        
        const btn = document.querySelector('#sec-login button');
        btn.disabled = true; btn.textContent = 'جاري...';

        try {
            const cred = await auth.signInWithEmailAndPassword(em, pw);
            currentUser = cred.user;
            await checkRoleAndBan();
            go('dash');
            alert("✅ مرحباً، " + em.split('@')[0] + "!");
        } catch (err) {
            alert("❌ " + (err.code === 'auth/invalid-credential' ? 'بيانات خاطئة' : err.message));
        } finally {
            btn.disabled = false; btn.textContent = 'دخول';
        }
        return false;
    };

    async function checkRoleAndBan() {
        if (!currentUser) return;
        const email = currentUser.email;
        
        // 1. فحص الحظر
        const banSnap = await db.collection('banned').doc(email).get();
        if (banSnap.exists) {
            isBanned = true;
            alert("🚫 حسابك محظور من الدخول. تواصل مع الإدارة.");
            auth.signOut(); currentUser = null; go('login'); return;
        }

        // 2. تحديد الصلاحيات وإنشاء الحساب إذا جديد
        const userRef = db.collection('users').doc(currentUser.uid);
        const userSnap = await userRef.get();
        
        if (!userSnap.exists) {
            userRole = email === 'admin@cbox.com' ? 'admin' : 'user';
            await userRef.set({
                email: email,
                displayName: email.split('@')[0],
                role: userRole,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            userRole = userSnap.data().role || 'user';
        }

        // تحديث الواجهة
        $('name').textContent = currentUser.displayName || email.split('@')[0];
        $('userDisplay').textContent = email;
        $('role-badge').textContent = userRole === 'admin' ? 'أدمن 👑' : 'مستخدم 👤';
        $('role-badge').style.background = userRole === 'admin' ? '#fef3c7' : '#e2e8f0';
        $('cName').value = $('name').textContent;
        $('cEmail').value = email;
        $('sendBtn').disabled = false;

        initChat();
        loadStats();
        requestNotifPermission();
    }

    // 🚪 تسجيل الخروج
    window.logout = () => {
        if(unsubChat) unsubChat();
        auth.signOut();
        currentUser = null; userRole = 'user'; isBanned = false;
        $('chatMain').innerHTML = '<p style="text-align:center;color:#888;padding:40px">مرحباً! ابدأ المحادثة...</p>';
        $('userDisplay').textContent = 'ضيف';
        go('login');
        alert("✅ تم تسجيل الخروج");
    };

    // 💬 دردشة لحظية (Firebase)
    function initChat() {
        if (!currentUser || unsubChat) return;
        $('chatMain').innerHTML = '<p style="text-align:center;color:#888;padding:40px">جاري التحميل...</p>';
        
        unsubChat = db.collection('messages')
            .orderBy('timestamp', 'desc')
            .limit(50)
            .onSnapshot(snapshot => {
                $('chatMain').innerHTML = '';
                if (snapshot.empty) {
                    $('chatMain').innerHTML = '<p style="text-align:center;color:#888;padding:40px">🎉 لا توجد رسائل بعد</p>';
                    return;
                }

                const msgs = [];
                snapshot.forEach(doc => msgs.push({ id: doc.id, ...doc.data() }));
                msgs.reverse().forEach(m => renderMessage(m));
                $('chatMain').scrollTop = $('chatMain').scrollHeight;
            }, err => {
                console.error("❌ خطأ في الدردشة:", err);
                $('chatMain').innerHTML = `<p style="color:#c00;text-align:center;padding:20px">❌ فشل التحميل: ${err.message}</p>`;
            });
    }

    function renderMessage(m) {
        const div = document.createElement('div');
        div.style.cssText = 'margin:8px 0;padding:8px 10px;background:'+(m.senderEmail===currentUser.email?'#dbeafe':'#fff')+';border:1px solid #e2e8f0;border-radius:6px;';
        const time = m.timestamp ? new Date(m.timestamp.toDate()).toLocaleTimeString('ar-EG',{hour:'2-digit',minute:'2-digit'}) : '';
        div.innerHTML = `<div style="font-weight:bold;font-size:11px;color:#2563eb">${escape(m.senderName||'مستخدم')} <span style="color:#888;font-weight:normal;margin-right:5px">${time}</span></div><div style="margin-top:4px;word-break:break-word">${escape(m.text)}</div>`;
        
        if (userRole === 'admin') {
            const del = document.createElement('span');
            del.textContent = '🗑️'; del.style.cssText = 'cursor:pointer;float:left;margin-top:4px;font-size:12px;opacity:0.6';
            del.onclick = () => { if(confirm('حذف الرسالة؟')) deleteMsg(m.id); };
            div.appendChild(del);
        }
        $('chatMain').appendChild(div);
    }

    window.sendMsg = async () => {
        const txt = $('cMsg')?.value.trim();
        if (!txt || !currentUser) return;
        const btn = $('sendBtn'); btn.disabled = true; btn.textContent = '⏳';
        
        try {
            await db.collection('messages').add({
                text: txt,
                senderName: currentUser.displayName || currentUser.email.split('@')[0],
                senderEmail: currentUser.email,
                userId: currentUser.uid,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            $('cMsg').value = '';
            playSound();
        } catch(err) { alert("❌ فشل الإرسال"); }
        finally { btn.disabled = false; btn.textContent = 'إرسال'; }
    };

    window.deleteMsg = async (id) => {
        if (userRole !== 'admin') return;
        try { await db.collection('messages').doc(id).delete(); } catch(err) { alert("❌ فشل الحذف"); }
    };

    // 📊 إحصائيات متقدمة
    async function loadStats() {
        if (!currentUser) return;
        try {
            const snap = await db.collection('messages').get();
            const total = snap.size;
            const today = snap.docs.filter(d => {
                if (!d.data().timestamp) return false;
                const msgDate = d.data().timestamp.toDate();
                const now = new Date();
                return msgDate.toDateString() === now.toDateString();
            }).length;
            const uniqueUsers = new Set(snap.docs.map(d => d.data().senderEmail)).size;

            $('stat-total').textContent = total.toLocaleString('ar-EG');
            $('stat-today').textContent = today.toLocaleString('ar-EG');
            $('stat-users').textContent = uniqueUsers.toLocaleString('ar-EG');

            // رسم بياني بسيط (آخر 7 أيام)
            const chart = $('chart'); chart.innerHTML = '';
            const days = ['أحد','إثنين','ثلاثاء','أربعاء','خميس','جمعة','سبت'];
            const counts = Array(7).fill(0);
            const now = new Date();
            snap.docs.forEach(d => {
                if (d.data().timestamp) {
                    const dDate = d.data().timestamp.toDate();
                    const diff = Math.floor((now - dDate) / (1000*60*60*24));
                    if (diff < 7) counts[6-diff]++;
                }
            });
            const max = Math.max(...counts, 1);
            counts.forEach((c, i) => {
                const h = Math.max(5, (c/max)*100);
                chart.innerHTML += `<div style="flex:1;display:flex;flex-direction:column;align-items:justify-content:flex-end;height:100%">
                    <div class="bar" style="height:${h}%"></div>
                    <div class="bar-label">${days[(now.getDay()-i+7)%7]}</div>
                </div>`;
            });
        } catch(err) { console.error("❌ خطأ في الإحصائيات", err); }
    }

    // 📥 تصدير CSV
    window.exportCSV = async () => {
        const btn = document.querySelector('#sec-stats button');
        btn.textContent = '⏳ جاري التحميل...'; btn.disabled = true;
        try {
            const snap = await db.collection('messages').orderBy('timestamp').get();
            let csv = '\uFEFF"التاريخ","الوقت","المرسل","البريد","الرسالة"\n';
            snap.forEach(doc => {
                const d = doc.data();
                const dt = d.timestamp ? d.timestamp.toDate() : new Date();
                csv += `"${dt.toLocaleDateString('ar-EG')}","${dt.toLocaleTimeString('ar-EG')}","${escape(d.senderName||'')}" ,"${d.senderEmail}","${(d.text||'').replace(/"/g,'""')}"\n`;
            });
            const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = `cbox-report-${new Date().toISOString().slice(0,10)}.csv`;
            a.click();
        } catch(err) { alert("❌ فشل التصدير"); }
        finally { btn.textContent = '📥 تصدير البيانات (Excel/CSV)'; btn.disabled = false; }
    };

    // 🔔 إشعارات ذكية
    function requestNotifPermission() {
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    }
    window.toggleNotif = () => {
        if (!("Notification" in window)) return alert("متصفحك لا يدعم الإشعارات");
        if (Notification.permission === "denied") return alert("يرجى السماح بالإشعارات من إعدادات المتصفح");
        notifAllowed = !notifAllowed;
        $('notifStatus').textContent = notifAllowed ? 'مفعّلة ✅' : 'موقفة ⏸';
        $('notifBtn').textContent = notifAllowed ? 'إيقاف' : 'تفعيل';
    };
    function playSound() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const o = ctx.createOscillator(); const g = ctx.createGain();
            o.connect(g); g.connect(ctx.destination);
            o.frequency.value = 800; g.gain.value = 0.1;
            o.start(); g.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.2);
            o.stop(ctx.currentTime + 0.2);
        } catch(e) {}
    }
    function showBrowserNotif(text) {
        if (notifAllowed && document.hidden && Notification.permission === "granted") {
            new Notification("صندوق التحكم", { body: "رسالة جديدة: " + text.substring(0, 30) + "...", icon: "📦" });
        }
    }

    // 🧭 التنقل والقوائم
    window.go = function(sec) {
        ['sec-login','sec-dash','sec-pub','sec-mail','sec-set','sec-stats','sec-sub','sec-publish'].forEach(s => {
            const el = document.getElementById(s); if(el) el.style.display = 'none';
        });
        const t = document.getElementById('sec-' + sec); if(t) t.style.display = 'block';
        hideAll();
        if(sec === 'stats') loadStats();
        if(sec === 'publish' && document.getElementById('codeVar')) updateCode();
    };
    
    window.pick = function(pg) {
        go('sub');
        const box = $('sec-sub'); if(!box) return;
        const map = {
            'style':'<div class="card"><h3>🎨 سمات</h3><p>تخصيص الألوان</p><a onclick="go(\'dash\')">← عودة</a></div>',
            'layout':'<div class="card"><h3>📐 تخطيط</h3><p>خيارات العرض</p><a onclick="go(\'dash\')">← عودة</a></div>',
            'filter':'<div class="card"><h3>🔍 تصفية</h3><p>كلمات محظورة</p><a onclick="go(\'dash\')">← عودة</a></div>',
            'smilies':'<div class="card"><h3>😊 رموز</h3><p>إدارة الابتسامات</p><a onclick="go(\'dash\')">← عودة</a></div>',
            'users':'<div class="card"><h3>👥 مسجلون</h3><p>قائمة المستخدمين</p><a onclick="go(\'dash\')">← عودة</a></div>',
            'bans':'<div class="card"><h3>🚫 محظورون</h3><p><button onclick="alert(\'لحظر مستخدم: أضف بريده يدوياً في Firebase Console\')" class="cb">إضافة حظر (أدمن فقط)</button></p><a onclick="go(\'dash\')">← عودة</a></div>',
            'msgs':'<div class="card"><h3>📩 رسائل</h3><p>إدارة الرسائل</p><a onclick="go(\'dash\')">← عودة</a></div>',
            'archive':'<div class="card"><h3>🗄️ أرشيف</h3><p>المؤرشف</p><a onclick="go(\'dash\')">← عودة</a></div>'
        };
        box.innerHTML = map[pg] || '<p>غير متاح</p>';
    };
    
    window.openMenu = function(id) {
        hideAll();
        const menu = document.getElementById(id);
        if(menu) menu.style.display = 'block';
    };
    
    window.hideAll = function() {
        ['m1','m2','m3','m4'].forEach(id => {
            const el = document.getElementById(id); if(el) el.style.display = 'none';
        });
    };
    
    document.addEventListener('click', function(e) {
        if(!e.target.closest('.menu-wrap')) hideAll();
    });

    // 💬 وظائف مساعدة
    window.refreshChat = () => { $('chatStat').textContent = '🔄 جاري...'; setTimeout(() => $('chatStat').textContent = '🟢 متصل', 800); };
    window.toggleSmilies = () => { const b = $('smBox'); b.style.display = (b.style.display === 'none' || !b.style.display) ? 'block' : 'none'; };
    window.ins = (em) => { const i = $('cMsg'); if(i) { i.value += ' '+em+' '; i.focus(); } };
    window.test = () => { const t = new Date().toLocaleTimeString('ar-EG'); $('out').innerHTML = `✅ يعمل!<br>⏰ ${t}`; alert("✅ النظام يعمل!\n" + t); };
    function escape(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }

    // 📤 وظائف صفحة "انشر"
    window.generateTag = function() {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let tag = '';
        for(let i=0; i<6; i++) tag += chars.charAt(Math.floor(Math.random() * chars.length));
        document.getElementById('securityTag').value = tag;
        updateCode();
        alert('✅ New security tag: ' + tag);
    };

    window.saveEmbedOpts = function() {
        const opts = {
            siteUrl: document.getElementById('siteUrl')?.value,
            whitelist: document.getElementById('whitelistChk')?.checked ? document.getElementById('whitelistTxt')?.value : '',
            ssl: document.getElementById('sslChk')?.checked,
            tag: document.getElementById('securityTag')?.value
        };
        localStorage.setItem('cbox-embed-opts', JSON.stringify(opts));
        alert('✅ Embed options saved!');
    };

    window.updateCode = function() {
        const varType = document.getElementById('codeVar')?.value || 'inline';
        const tag = document.getElementById('securityTag')?.value || '52gxr7';
        const ssl = document.getElementById('sslChk')?.checked;
        const proto = ssl ? 'https' : 'http';
        const boxUrl = `${proto}://www4.cbox.ws/box/?boxid=4257987&boxtag=${tag}`;
        
        const codes = {
            'inline': `<!-- BEGIN CBOX - www.cbox.ws - v4.3 -->
<div id="cboxdiv" style="position:relative;margin:0 auto;width:400px;font-size:0;line-height:0">
<div style="position:relative;height:293px;overflow:auto;border:0"><iframe src="${boxUrl}&sec=main" marginheight="0" marginwidth="0" frameborder="0" width="100%" height="100%" scrolling="auto" allowtransparency="yes"></iframe></div>
<div style="position:relative;height:107px;overflow:hidden;border:0;border-top:0"><iframe src="${boxUrl}&sec=form" marginheight="0" marginwidth="0" frameborder="0" width="100%" height="100%" scrolling="no" allowtransparency="yes"></iframe></div>
</div>
<!-- END CBOX -->`,
            'popup': `<script>
function popcbox(){var w=window.open("${boxUrl}","Cbox","width=400,height=400,toolbar=no,scrollbars=no");}
<\/script>
<a href="JavaScript:popcbox()">Open my Cbox</a>`,
            'button': `<div id="cboxbtn" style="position:fixed;bottom:10px;right:10px;padding:8px 16px;background:#2563eb;color:#fff;border-radius:6px;cursor:pointer;z-index:9999">💬 Chat</div>
<script>
document.getElementById('cboxbtn').onclick=function(){window.open("${boxUrl}","Cbox","width=400,height=450");};
<\/script>`,
            'defer': `<div id="cboxwrap"></div>
<script>
(function(){var c=document.getElementById("cboxwrap");c.innerHTML='<iframe src="${boxUrl}" width="400" height="400" frameborder="0"><\\/iframe>';})();
<\/script>`
        };
        const box = document.getElementById('codeBox');
        if(box) box.value = codes[varType] || codes['inline'];
    };

    window.copyCode = function() {
        const box = document.getElementById('codeBox');
        if(!box) return;
        box.select();
        box.setSelectionRange(0, 99999);
        try {
            document.execCommand('copy');
            const btn = event?.target;
            if(btn) { const orig = btn.textContent; btn.textContent = '✅ Copied!'; setTimeout(()=>btn.textContent=orig, 1500); }
            else alert('✅ Code copied to clipboard!');
        } catch(err) {
            alert('Press Ctrl+C (or Cmd+C) to copy the code manually.');
        }
    };

    window.previewCode = function() {
        const code = document.getElementById('codeBox')?.value;
        if(!code) return;
        const win = window.open('', '_blank', 'width=500,height=500');
        win.document.write('<html><head><title>Preview</title><style>body{font-family:sans-serif;padding:20px}</style></head><body><h3>👁️ Embed Code Preview</h3><pre style="background:#f1f5f9;padding:15px;border-radius:6px;overflow-x:auto;font-size:11px">'+escapeHtml(code)+'</pre><p style="margin-top:15px"><small>This is a preview only. The actual embed will render on your site.</small></p></body></html>');
        win.document.close();
    };

    window.updateInstructions = function() {
        const plat = document.getElementById('platformSel')?.value || 'generic';
        document.querySelectorAll('.instructions').forEach(el => el.style.display = 'none');
        const target = document.getElementById('instr-' + plat);
        if(target) target.style.display = 'block';
    };

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // بدء المراقبة
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            checkRoleAndBan();
            go('dash');
        } else {
            go('login');
        }
    });

    // تهيئة عند التحميل
    document.addEventListener('DOMContentLoaded', function() {
        // استعادة خيارات التضمين المحفوظة
        try {
            const saved = JSON.parse(localStorage.getItem('cbox-embed-opts'));
            if(saved) {
                if(saved.siteUrl && $('siteUrl')) $('siteUrl').value = saved.siteUrl;
                if(saved.whitelist && $('whitelistChk') && $('whitelistTxt')) { 
                    $('whitelistChk').checked = true; 
                    $('whitelistTxt').value = saved.whitelist; 
                    $('whitelistTxt').style.display = 'block';
                }
                if(saved.ssl !== undefined && $('sslChk')) $('sslChk').checked = saved.ssl;
                if(saved.tag && $('securityTag')) $('securityTag').value = saved.tag;
            }
        } catch(e) {}
        
        // تحديث كود التضمين الأولي
        if($('codeVar')) updateCode();
        
        // إظهار/إخفاء حقل القائمة البيضاء
        if($('whitelistChk') && $('whitelistTxt')) {
            $('whitelistChk').onchange = function() { 
                $('whitelistTxt').style.display = this.checked ? 'block' : 'none'; 
            };
            $('whitelistChk').onchange();
        }
        
        console.log("✅ النظام المتكامل جاهز تماماً!");
    });

} catch (err) {
    console.error("❌ خطأ فادح في التهيئة:", err);
    alert("حدث خطأ في تحميل النظام. تأكد من اتصال الإنترنت أو تحقق من الكونسول.");
}
