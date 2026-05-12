console.log("🚀 النظام المتكامل النهائي يبدأ...");

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

// 🌐 الثوابت
const BASE_URL = 'https://cbox-2.github.io/2026/?#';
const $ = id => document.getElementById(id);

try {
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();

    let currentUser = null, userRole = 'user', unsubChat = null, notifAllowed = false;

    // 🧭 نظام التوجيه بالهاش
    function handleHashRoute() {
        const hash = window.location.hash.replace('?#', '').replace('#', '') || 'login';
        console.log("🔀 توجيه إلى:", hash);
        document.querySelectorAll('main section').forEach(sec => sec.style.display = 'none');
        const target = document.getElementById('sec-' + hash);
        if (target) {
            target.style.display = 'block';
            if (hash === 'dash' && currentUser) { initChat(); loadStats(); }
            else if (hash === 'publish' && $('codeVar')) updateCode();
            else if (hash === 'stats') loadStats();
        } else { window.location.hash = '#dashboard'; }
        hideAll();
    }
    window.addEventListener('hashchange', handleHashRoute);
    window.addEventListener('load', handleHashRoute);
    window.go = function(sec) { window.location.hash = '#' + sec; };

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
            window.location.hash = '#dashboard';
            alert("✅ مرحباً، " + em.split('@')[0] + "!");
        } catch (err) {
            let msg = "حدث خطأ";
            if (err.code === 'auth/invalid-credential') msg = 'بيانات الدخول غير صحيحة';
            else if (err.message?.includes('permission')) msg = 'أذونات Firestore مطلوبة. راجع Firebase Console → Firestore → Rules';
            alert("❌ " + msg);
        } finally { btn.disabled = false; btn.textContent = 'دخول'; }
        return false;
    };

    async function checkRoleAndBan() {
        if (!currentUser) return;
        const email = currentUser.email;
        try {
            const banSnap = await db.collection('banned').doc(email).get();
            if (banSnap.exists) { alert("🚫 حسابك محظور"); auth.signOut(); window.location.hash = '#login'; return; }
        } catch(e) { console.warn("⚠️ فحص الحظر:", e); }
        
        const userRef = db.collection('users').doc(currentUser.uid);
        try {
            const userSnap = await userRef.get();
            if (!userSnap.exists) {
                userRole = email === 'admin@cbox.com' ? 'admin' : 'user';
                await userRef.set({ email, displayName: email.split('@')[0], role: userRole, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
            } else { userRole = userSnap.data().role || 'user'; }
        } catch(e) { userRole = email === 'admin@cbox.com' ? 'admin' : 'user'; console.warn("⚠️ قراءة المستخدم:", e); }
        
        $('name').textContent = currentUser.displayName || email.split('@')[0];
        $('userDisplay').textContent = email;
        $('role-badge').textContent = userRole === 'admin' ? 'أدمن 👑' : 'مستخدم 👤';
        $('role-badge').style.background = userRole === 'admin' ? '#fef3c7' : '#e2e8f0';
        $('cName').value = $('name').textContent;
        $('cEmail').value = email;
        $('sendBtn').disabled = false;
    }

    window.logout = () => {
        if(unsubChat) unsubChat();
        auth.signOut();
        currentUser = null; userRole = 'user';
        $('chatMain').innerHTML = '<p style="text-align:center;color:#888;padding:40px">مرحباً! ابدأ المحادثة...</p>';
        $('userDisplay').textContent = 'ضيف';
        window.location.hash = '#login';
        alert("✅ تم تسجيل الخروج");
    };

    // 💬 دردشة لحظية
    function initChat() {
        if (!currentUser) return;
        $('chatMain').innerHTML = '<p style="text-align:center;color:#888;padding:40px">جاري التحميل...</p>';
        unsubChat = db.collection('messages').orderBy('timestamp', 'desc').limit(50).onSnapshot(snapshot => {
            $('chatMain').innerHTML = '';
            if (snapshot.empty) { $('chatMain').innerHTML = '<p style="text-align:center;color:#888;padding:40px">🎉 لا توجد رسائل بعد</p>'; return; }
            const msgs = []; snapshot.forEach(doc => msgs.push({ id: doc.id, ...doc.data() }));
            msgs.reverse().forEach(m => renderMessage(m));
            $('chatMain').scrollTop = $('chatMain').scrollHeight;
        }, err => {
            console.error("❌ خطأ في الدردشة:", err);
            $('chatMain').innerHTML = `<p style="color:#c00;text-align:center;padding:20px">⚠️ ${err.message?.includes('permission') ? 'أذونات Firestore مطلوبة' : 'فشل التحميل'}</p>`;
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
            await db.collection('messages').add({ text: txt, senderName: currentUser.displayName || currentUser.email.split('@')[0], senderEmail: currentUser.email, userId: currentUser.uid, timestamp: firebase.firestore.FieldValue.serverTimestamp() });
            $('cMsg').value = ''; playSound();
        } catch(err) { alert("❌ فشل الإرسال"); }
        finally { btn.disabled = false; btn.textContent = 'إرسال'; }
    };
    window.deleteMsg = async (id) => { if (userRole !== 'admin') return; try { await db.collection('messages').doc(id).delete(); } catch(err) { alert("❌ فشل الحذف"); } };

    // 📊 إحصائيات
    async function loadStats() {
        if (!currentUser) return;
        try {
            const snap = await db.collection('messages').get();
            const total = snap.size;
            const today = snap.docs.filter(d => d.data().timestamp && d.data().timestamp.toDate().toDateString() === new Date().toDateString()).length;
            const uniqueUsers = new Set(snap.docs.map(d => d.data().senderEmail)).size;
            $('stat-total').textContent = total.toLocaleString('ar-EG');
            $('stat-today').textContent = today.toLocaleString('ar-EG');
            $('stat-users').textContent = uniqueUsers.toLocaleString('ar-EG');
            const chart = $('chart'); chart.innerHTML = '';
            const days = ['أحد','إثنين','ثلاثاء','أربعاء','خميس','جمعة','سبت'];
            const counts = Array(7).fill(0);
            const now = new Date();
            snap.docs.forEach(d => { if (d.data().timestamp) { const diff = Math.floor((now - d.data().timestamp.toDate()) / (1000*60*60*24)); if (diff < 7) counts[6-diff]++; } });
            const max = Math.max(...counts, 1);
            counts.forEach((c, i) => { const h = Math.max(5, (c/max)*100); chart.innerHTML += `<div style="flex:1;display:flex;flex-direction:column;align-items:justify-content:flex-end;height:100%"><div class="bar" style="height:${h}%"></div><div class="bar-label">${days[(now.getDay()-i+7)%7]}</div></div>`; });
        } catch(err) { console.error("❌ خطأ في الإحصائيات", err); }
    }

    // 📥 تصدير CSV
    window.exportCSV = async () => {
        const btn = document.querySelector('#sec-stats button');
        btn.textContent = '⏳ جاري...'; btn.disabled = true;
        try {
            const snap = await db.collection('messages').orderBy('timestamp').get();
            let csv = '\uFEFF"التاريخ","الوقت","المرسل","البريد","الرسالة"\n';
            snap.forEach(doc => { const d = doc.data(); const dt = d.timestamp ? d.timestamp.toDate() : new Date(); csv += `"${dt.toLocaleDateString('ar-EG')}","${dt.toLocaleTimeString('ar-EG')}","${escape(d.senderName||'')}" ,"${d.senderEmail}","${(d.text||'').replace(/"/g,'""')}"\n`; });
            const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'}), url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = `cbox-report-${new Date().toISOString().slice(0,10)}.csv`; a.click();
        } catch(err) { alert("❌ فشل التصدير"); }
        finally { btn.textContent = '📥 تصدير البيانات (Excel/CSV)'; btn.disabled = false; }
    };

    // 🔔 إشعارات
    window.toggleNotif = () => {
        if (!("Notification" in window)) return alert("متصفحك لا يدعم الإشعارات");
        if (Notification.permission === "denied") return alert("يرجى السماح بالإشعارات من إعدادات المتصفح");
        notifAllowed = !notifAllowed;
        $('notifStatus').textContent = notifAllowed ? 'مفعّلة ✅' : 'موقفة ⏸';
        $('notifBtn').textContent = notifAllowed ? 'إيقاف' : 'تفعيل';
        if (notifAllowed && Notification.permission === "default") Notification.requestPermission();
    };
    function playSound() { try { const ctx = new (window.AudioContext||window.webkitAudioContext)(), o=ctx.createOscillator(), g=ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.frequency.value=800; g.gain.value=0.1; o.start(); g.gain.exponentialRampToValueAtTime(0.00001,ctx.currentTime+0.2); o.stop(ctx.currentTime+0.2); } catch(e){} }

    // 📋 القوائم والصفحات الفرعية
    window.pick = function(pg) {
        window.location.hash = '#sub';
        const box = $('sec-sub'); if(!box) return;
        const map = { 'style':'<div class="card"><h3>🎨 سمات</h3><p>تخصيص الألوان</p><a href="?#" onclick="go(\'dash\');return false">← عودة</a></div>', 'layout':'<div class="card"><h3>📐 تخطيط</h3><p>خيارات العرض</p><a href="?#" onclick="go(\'dash\');return false">← عودة</a></div>', 'filter':'<div class="card"><h3>🔍 تصفية</h3><p>كلمات محظورة</p><a href="?#" onclick="go(\'dash\');return false">← عودة</a></div>', 'smilies':'<div class="card"><h3>😊 رموز</h3><p>إدارة الابتسامات</p><a href="?#" onclick="go(\'dash\');return false">← عودة</a></div>', 'users':'<div class="card"><h3>👥 مسجلون</h3><p>قائمة المستخدمين</p><a href="?#" onclick="go(\'dash\');return false">← عودة</a></div>', 'bans':'<div class="card"><h3>🚫 محظورون</h3><p><button onclick="alert(\'لحظر مستخدم: أضف بريده في Firebase Console\')" class="cb">إضافة حظر (أدمن)</button></p><a href="?#" onclick="go(\'dash\');return false">← عودة</a></div>', 'messages':'<div class="card"><h3>📩 رسائل</h3><p>إدارة الرسائل</p><a href="?#" onclick="go(\'dash\');return false">← عودة</a></div>', 'archive':'<div class="card"><h3>🗄️ أرشيف</h3><p>المؤرشف</p><a href="?#" onclick="go(\'dash\');return false">← عودة</a></div>' };
        box.innerHTML = map[pg] || '<p>غير متاح</p>';
    };
    window.openMenu = function(id) { hideAll(); const menu = document.getElementById(id); if(menu) menu.style.display = 'block'; };
    window.hideAll = function() { ['m1','m2','m3','m4'].forEach(id => { const el = document.getElementById(id); if(el) el.style.display = 'none'; }); };
    document.addEventListener('click', e => { if(!e.target.closest('.menu-wrap')) hideAll(); });

    // 💬 وظائف مساعدة
    window.refreshChat = () => { $('chatStat').textContent = '🔄 جاري...'; setTimeout(() => $('chatStat').textContent = '🟢 متصل', 800); };
    window.toggleSmilies = () => { const b = $('smBox'); b.style.display = (b.style.display === 'none' || !b.style.display) ? 'block' : 'none'; };
    window.ins = (em) => { const i = $('cMsg'); if(i) { i.value += ' '+em+' '; i.focus(); } };
    window.test = () => { const t = new Date().toLocaleTimeString('ar-EG'); $('out').innerHTML = `✅ يعمل!<br>⏰ ${t}`; alert("✅ النظام يعمل!\n" + t); };
    function escape(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }

    // 📤 صفحة انشر - أكواد تشير لرابطك
    window.generateTag = function() { const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'; let tag = ''; for(let i=0; i<6; i++) tag += chars.charAt(Math.floor(Math.random() * chars.length)); $('securityTag').value = tag; updateCode(); alert('✅ New tag: ' + tag); };
    window.saveEmbedOpts = function() { const opts = { siteUrl: $('siteUrl')?.value, whitelist: $('whitelistChk')?.checked ? $('whitelistTxt')?.value : '', ssl: $('sslChk')?.checked, tag: $('securityTag')?.value }; localStorage.setItem('cbox-embed-opts', JSON.stringify(opts)); alert('✅ Saved!'); };
    window.updateCode = function() {
        const varType = $('codeVar')?.value || 'inline', tag = $('securityTag')?.value || '52gxr7', ssl = $('sslChk')?.checked, proto = ssl ? 'https' : 'http';
        const YOUR_URL = `${proto}://cbox-2.github.io/2026/?#chat`;
        const codes = {
            'inline': `<!-- BEGIN CHAT BOX -->\n<div id="cboxdiv" style="position:relative;margin:0 auto;width:400px">\n<iframe src="${YOUR_URL}&sec=main" width="100%" height="293" frameborder="0" scrolling="auto"></iframe>\n<iframe src="${YOUR_URL}&sec=form" width="100%" height="107" frameborder="0" scrolling="no"></iframe>\n</div>\n<!-- END CHAT BOX -->`,
            'popup': `<script>\nfunction popchat(){window.open("${YOUR_URL}","Chat","width=400,height=400");}\n<\/script>\n<a href="JavaScript:popchat()">Open Chat</a>`,
            'button': `<div id="chatbtn" style="position:fixed;bottom:10px;right:10px;padding:8px 16px;background:#2563eb;color:#fff;border-radius:6px;cursor:pointer">💬 Chat</div>\n<script>\ndocument.getElementById('chatbtn').onclick=function(){window.open("${YOUR_URL}","Chat","width=400,height=450");};\n<\/script>`,
            'defer': `<div id="chatwrap"></div>\n<script>\n(function(){document.getElementById("chatwrap").innerHTML='<iframe src="${YOUR_URL}" width="400" height="400" frameborder="0"><\\/iframe>';})();\n<\/script>`
        };
        if($('codeBox')) $('codeBox').value = codes[varType] || codes['inline'];
    };
    window.copyCode = function() { const box = $('codeBox'); if(!box) return; box.select(); try { document.execCommand('copy'); alert('✅ Copied!'); } catch(e) { alert('Ctrl+C للنسخ'); } };
    window.previewCode = function() { const code = $('codeBox')?.value; if(!code) return; const win = window.open('','_blank','width=500,height=500'); win.document.write('<html><head><title>Preview</title></head><body><pre style="font-family:monospace;font-size:11px;padding:15px">'+escapeHtml(code)+'</pre></body></html>'); win.document.close(); };
    window.updateInstructions = function() { const plat = $('platformSel')?.value || 'generic'; document.querySelectorAll('.instructions').forEach(el => el.style.display = 'none'); const target = document.getElementById('instr-' + plat); if(target) target.style.display = 'block'; };
    function escapeHtml(text) { const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }

    // بدء المراقبة
    auth.onAuthStateChanged(user => { if (user) { currentUser = user; checkRoleAndBan(); } else { if(window.location.hash !== '#login') window.location.hash = '#login'; } });

    // تهيئة
    document.addEventListener('DOMContentLoaded', function() {
        try { const saved = JSON.parse(localStorage.getItem('cbox-embed-opts')); if(saved) { if(saved.siteUrl && $('siteUrl')) $('siteUrl').value = saved.siteUrl; if(saved.whitelist && $('whitelistChk') && $('whitelistTxt')) { $('whitelistChk').checked = true; $('whitelistTxt').value = saved.whitelist; $('whitelistTxt').style.display = 'block'; } if(saved.ssl !== undefined && $('sslChk')) $('sslChk').checked = saved.ssl; if(saved.tag && $('securityTag')) $('securityTag').value = saved.tag; } } catch(e) {}
        if($('codeVar')) updateCode();
        if($('whitelistChk') && $('whitelistTxt')) { $('whitelistChk').onchange = function() { $('whitelistTxt').style.display = this.checked ? 'block' : 'none'; }; $('whitelistChk').onchange(); }
        console.log("✅ النظام النهائي جاهز مع رابط: " + BASE_URL);
    });

} catch (err) { console.error("❌ خطأ فادح:", err); alert("حدث خطأ في التحميل. تحقق من الكونسول."); }
