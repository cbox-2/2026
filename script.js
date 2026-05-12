document.addEventListener('DOMContentLoaded', function() {
    const firebaseConfig = {
        apiKey: "AIzaSyD_UssZllzECYbTMR_0NCTzEGAIMeZAcos",
        authDomain: "cbox22026.firebaseapp.com",
        projectId: "cbox22026",
        storageBucket: "cbox22026.firebasestorage.app",
        messagingSenderId: "175894881657",
        appId: "1:175894881657:web:ae5e693d843ee594eb7ba8",
        measurementId: "G-0BP0P4KWL8"
    };
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth(); const db = firebase.firestore();

    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const settingsSection = document.getElementById('settings-section');
    const publishSection = document.getElementById('publish-section');
    const mailboxSection = document.getElementById('mailbox-section');
    const subpageView = document.getElementById('subpage-view');
    const emailInput = document.getElementById('email-input'); const passInput = document.getElementById('pass-input');
    const authBtn = document.getElementById('auth-btn'); const formTitle = document.getElementById('form-title');
    const toggleAuth = document.getElementById('toggle-auth'); const resetLink = document.getElementById('reset-link');
    const userDisplay = document.getElementById('user-name-display'); const logoutBtn = document.getElementById('logout-btn');
    const chatInput = document.getElementById('chat-input'); const chatSendBtn = document.getElementById('chat-send-btn');
    const messagesList = document.getElementById('messages-list'); const chatContainer = document.getElementById('chat-container');
    const themeToggle = document.getElementById('theme-toggle'); const todayMsgCount = document.getElementById('today-msg-count');
    const activeUsersCount = document.getElementById('active-users-count'); const exportBtn = document.getElementById('export-btn');
    const errorBar = document.getElementById('siteErrorBarCont'); const loginHistory = document.getElementById('login-history');
    const sessionCount = document.getElementById('session-count'); const lastLogin = document.getElementById('last-login');
    const settingsName = document.getElementById('settings-name'); const saveSettingsBtn = document.getElementById('save-settings-btn');
    
    let currentUser = null; let unsubscribeChat = null; let isLoginMode = true;
    let unreadCount = 0; let isTabActive = true; let lastKnownTimestamp = null;
    let chatInitialized = false; let cachedMessages = [];
    const originalTitle = document.title;

    function applyTheme(theme) { document.documentElement.setAttribute('data-theme', theme); localStorage.setItem('cbox-theme', theme); if (themeToggle) themeToggle.textContent = theme === 'dark' ? '☀️ وضع فاتح' : '🌙 وضع ليلي'; }
    if (themeToggle) { applyTheme(localStorage.getItem('cbox-theme') || 'light'); themeToggle.addEventListener('click', () => { applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'); }); }

    function playNotificationSound() { try { const c = new (window.AudioContext||window.webkitAudioContext)(); const o=c.createOscillator(), g=c.createGain(); o.connect(g).connect(c.destination); o.frequency.value=800; g.gain.value=0.1; o.start(); g.gain.exponentialRampToValueAtTime(0.00001,c.currentTime+0.3); o.stop(c.currentTime+0.3); } catch(e){} }
    function updateNotificationBadge() { document.title = unreadCount > 0 ? `(${unreadCount}) ${originalTitle}` : originalTitle; }
    document.addEventListener('visibilitychange', () => { isTabActive = document.visibilityState === 'visible'; if (isTabActive && unreadCount > 0) { unreadCount = 0; updateNotificationBadge(); if (chatContainer) chatContainer.style.animation = ''; } });

    auth.onAuthStateChanged(user => {
        currentUser = user;
        if (user) { showSection('dashboard'); userDisplay.textContent = user.displayName || user.email.split('@')[0]; if (errorBar) errorBar.textContent = 'متصل ✅'; loadDashboardData(user.email); initChat(); } 
        else { showSection('login'); if (errorBar) errorBar.textContent = 'جاهز...'; if (messagesList) messagesList.innerHTML = '<p style="text-align:center;color:#888;padding:20px;">سجّل الدخول لرؤية الرسائل</p>'; unreadCount = 0; updateNotificationBadge(); }
    });

    function showSection(name) { 
        loginSection.style.display = 'none'; dashboardSection.style.display = 'none'; 
        settingsSection.style.display = 'none'; subpageView.style.display = 'none'; 
        if(publishSection) publishSection.style.display = 'none';
        if(mailboxSection) mailboxSection.style.display = 'none';
        if (name === 'login') loginSection.style.display = 'block'; 
        else if (name === 'dashboard') dashboardSection.style.display = 'block'; 
        else if (name === 'settings') settingsSection.style.display = 'block'; 
        else if (name === 'publish' && publishSection) publishSection.style.display = 'block';
        else if (name === 'mailbox' && mailboxSection) mailboxSection.style.display = 'block';
        else if (name === 'subpage') subpageView.style.display = 'block'; 
    }

    if (toggleAuth) { toggleAuth.addEventListener('click', e => { e.preventDefault(); isLoginMode = !isLoginMode; if (formTitle) formTitle.textContent = isLoginMode ? 'تسجيل الدخول' : 'إنشاء حساب جديد'; if (authBtn) authBtn.textContent = isLoginMode ? 'تسجيل الدخول' : 'إنشاء حساب'; }); }
    if (authBtn) { authBtn.addEventListener('click', async () => { const email = emailInput?.value.trim()||''; const pass = passInput?.value.trim()||''; if (!email.includes('@')) return alert('⚠️ أدخل بريد إلكتروني صحيح'); if (!email || !pass) return alert('⚠️ املأ جميع الحقول'); authBtn.disabled = true; authBtn.textContent = 'جاري...'; try { if (isLoginMode) await auth.signInWithEmailAndPassword(email, pass); else { await auth.createUserWithEmailAndPassword(email, pass); await db.collection('users').doc(auth.currentUser.uid).set({ email, displayName: email.split('@')[0], createdAt: firebase.firestore.FieldValue.serverTimestamp() }); } await db.collection('sessions').add({ userId: auth.currentUser.uid, email, timestamp: firebase.firestore.FieldValue.serverTimestamp() }); } catch (err) { alert('❌ ' + (err.message||err.code)); } finally { authBtn.disabled = false; authBtn.textContent = isLoginMode ? 'تسجيل الدخول' : 'إنشاء حساب'; } }); }
    if (resetLink) { resetLink.addEventListener('click', async e => { e.preventDefault(); const em=prompt('أدخل بريدك الإلكتروني:'); if(em){try{await auth.sendPasswordResetEmail(em);alert('✅ تم الإرسال')}catch(err){alert('❌ '+err.message)}} }); }
    const doLogout = () => auth.signOut(); if (logoutBtn) logoutBtn.onclick = doLogout;
    if (saveSettingsBtn) { saveSettingsBtn.addEventListener('click', async () => { const n=settingsName?.value.trim(); if(!n) return alert('⚠️ الاسم مطلوب'); try{await auth.currentUser.updateProfile({displayName:n}); await db.collection('users').doc(auth.currentUser.uid).update({displayName:n}); if(userDisplay) userDisplay.textContent=n; alert('✅ تم الحفظ')}catch(err){alert('❌ '+err.message)} }); }

    async function loadDashboardData(email) { if (!loginHistory) return; loginHistory.innerHTML='<li>جاري...</li>'; try{const snap=await db.collection('sessions').orderBy('timestamp','desc').limit(50).get(); const u=snap.docs.filter(d=>d.data().email===email).slice(0,5); if(u.length===0) loginHistory.innerHTML='<li>لا توجد جلسات</li>'; else{let h='';u.forEach(d=>{const t=d.data().timestamp?d.data().timestamp.toDate().toLocaleString('ar-EG'):'غير معروف'; h+=`<li>🟢 ${t}</li>`}); loginHistory.innerHTML=h; if(sessionCount) sessionCount.textContent=u.length; }}catch(e){loginHistory.innerHTML='<li>فشل</li>'; }}

    async function loadAdvancedStats() { if(!todayMsgCount||!activeUsersCount) return; todayMsgCount.textContent='...'; activeUsersCount.textContent='...'; try{const now=new Date(), todayStart=new Date(now.getFullYear(),now.getMonth(),now.getDate()), sevenDaysAgo=new Date(todayStart.getTime()-(7*24*60*60*1000)); const m=await db.collection('messages').where('timestamp','>=',todayStart).get(); todayMsgCount.textContent=m.size; const s=await db.collection('sessions').where('timestamp','>=',sevenDaysAgo).get(); activeUsersCount.textContent=new Set(s.docs.map(d=>d.data().userId)).size;}catch(e){todayMsgCount.textContent='0';activeUsersCount.textContent='0';}}

    if (exportBtn) { exportBtn.addEventListener('click', async () => { exportBtn.disabled=true; exportBtn.textContent='⏳ جاري...'; try{if(cachedMessages.length===0){const snap=await db.collection('messages').orderBy('timestamp','asc').get(); cachedMessages=snap.docs.map(d=>({id:d.id,...d.data()}));} let csv='\uFEFF"التاريخ","الوقت","المرسل","الرسالة"\n'; cachedMessages.forEach(m=>{const d=m.timestamp?m.timestamp.toDate():new Date(); csv+=`"${d.toLocaleDateString('ar-EG')}","${d.toLocaleTimeString('ar-EG')}","${(m.senderName||'مستخدم').replace(/"/g,'""')}","${(m.text||'').replace(/"/g,'""')}"\n`;}); const b=new Blob([csv],{type:'text/csv;charset=utf-8;'}), u=URL.createObjectURL(b), l=document.createElement('a'); l.href=u; l.download=`export-${new Date().toISOString().slice(0,10)}.csv`; document.body.appendChild(l); l.click(); document.body.removeChild(l);}catch(err){alert('❌ فشل التصدير')} finally{exportBtn.disabled=false;exportBtn.textContent='📥 تصدير (CSV)';}}); }

    function initChat() { if(unsubscribeChat) unsubscribeChat(); if(messagesList) messagesList.innerHTML='<p style="text-align:center;color:#888;padding:20px;">جاري التحميل...</p>'; chatInitialized=false; lastKnownTimestamp=null; unreadCount=0; updateNotificationBadge(); cachedMessages=[]; loadAdvancedStats();
        unsubscribeChat=db.collection('messages').orderBy('timestamp','asc').onSnapshot(snap=>{ if(!messagesList) return; messagesList.innerHTML=''; if(snap.empty) messagesList.innerHTML='<p style="text-align:center;color:#888;padding:20px;">🎉 لا توجد رسائل بعد</p>'; else{ let newMsg=false; cachedMessages=[]; snap.forEach(doc=>{const m=doc.data(); cachedMessages.push({id:doc.id,...m}); const t=m.timestamp?m.timestamp.toDate().toLocaleTimeString('ar-EG',{hour:'2-digit',minute:'2-digit'}):''; const isMe=m.senderEmail===currentUser?.email; if(chatInitialized&&lastKnownTimestamp&&m.timestamp&&m.timestamp.toMillis()>lastKnownTimestamp.toMillis()&&!isMe) newMsg=true; const d=document.createElement('div'); d.className='message-item'+(isMe?' my-message':''); d.innerHTML=`<div class="sender">${escapeHtml(m.senderName||'مستخدم')}</div><span class="time">${t}</span><span class="text">${escapeHtml(m.text)}</span>`; if(isMe){const btn=document.createElement('button'); btn.className='msg-delete-btn'; btn.textContent='🗑️'; btn.onclick=async()=>{if(confirm('حذف؟')){try{await db.collection('messages').doc(doc.id).delete();}catch(e){alert('❌ فشل')}}}; d.appendChild(btn);} messagesList.appendChild(d); if(m.timestamp&&(!lastKnownTimestamp||m.timestamp.toMillis()>lastKnownTimestamp.toMillis())) lastKnownTimestamp=m.timestamp; }); if(newMsg&&!isTabActive){unreadCount++; updateNotificationBadge(); playNotificationSound(); if(chatContainer) chatContainer.style.animation='flashBorder 1s ease-in-out';} if(newMsg) loadAdvancedStats(); } chatInitialized=true; if(chatContainer) chatContainer.scrollTop=chatContainer.scrollHeight; }, err=>{console.error("❌ خطأ:",err); if(messagesList) messagesList.innerHTML=`<p style="color:#c00;text-align:center;padding:20px;">❌ ${err.message}</p>`; }); }

    if (chatSendBtn) { chatSendBtn.addEventListener('click', async () => { const t=chatInput?.value.trim(); if(!t||!currentUser) return; chatSendBtn.disabled=true; chatSendBtn.textContent='...'; try{await db.collection('messages').add({text:t, senderName:currentUser.displayName||currentUser.email.split('@')[0], senderEmail:currentUser.email, userId:currentUser.uid, timestamp:firebase.firestore.FieldValue.serverTimestamp()}); if(chatInput) chatInput.value='';}catch(err){alert('❌ فشل الإرسال')} finally{chatSendBtn.disabled=false; chatSendBtn.textContent='إرسال';} }); if(chatInput) chatInput.addEventListener('keypress', e=>{if(e.key==='Enter'&&!chatSendBtn.disabled) chatSendBtn.click();}); }

    function escapeHtml(text) { const d=document.createElement('div'); d.appendChild(document.createTextNode(text||'')); return d.innerHTML; }

    // 📋 جميع الصفحات الفرعية
    const allSubPages = {
        posts: `<div class="subpage"><h2>📩 إدارة الرسائل</h2><div class="notice">عرض جميع الرسائل</div><div class="card"><p>لا توجد رسائل حالياً</p></div><a class="back-link" data-return="dashboard">← العودة</a></div>`,
        postsarc: `<div class="subpage"><h2>🗄️ الأرشيف</h2><div class="notice">الرسائل المؤرشفة</div><div class="card"><p>فارغ</p></div><a class="back-link" data-return="dashboard">← العودة</a></div>`,
        sticky: `<div class="subpage"><h2>📌 رسالة لاصقة</h2><div class="card"><textarea class="txtbox" rows="4" placeholder="نص الرسالة..."></textarea><button class="btn-primary" style="margin-top:10px;" onclick="alert('✅ تم التثبيت')">تثبيت</button></div><a class="back-link" data-return="dashboard">← العودة</a></div>`,
        channels: `<div class="subpage"><h2>📺 القنوات</h2><div class="card"><p>🟢 عام <span style="color:#888;font-size:11px;">(افتراضي)</span></p></div><a class="back-link" data-return="dashboard">← العودة</a></div>`,
        webhook: `<div class="subpage"><h2>🔗 رابط الويب</h2><div class="card"><input type="text" class="txtbox" value="https://your-webhook.com/endpoint" readonly><button class="btn-primary" style="margin-top:10px;" onclick="navigator.clipboard.writeText(this.previousElementSibling.value);alert('✅ تم النسخ')">📋 نسخ</button></div><a class="back-link" data-return="dashboard">← العودة</a></div>`,
        users: `<div class="subpage"><h2>👥 المستخدمون</h2><div class="card"><p>قائمة المستخدمين</p></div><a class="back-link" data-return="dashboard">← العودة</a></div>`,
        bans: `<div class="subpage"><h2>🚫 المحظورون</h2><div class="card"><p>لا يوجد محظورون</p></div><a class="back-link" data-return="dashboard">← العودة</a></div>`,
        userint: `<div class="subpage"><h2>🔗 التكامل</h2><div class="card"><p>إعدادات التكامل</p></div><a class="back-link" data-return="dashboard">← العودة</a></div>`,
        filtering: `<div class="subpage"><h2>🔍 التصفية</h2><div class="card"><textarea class="txtbox" rows="3" placeholder="كلمات محظورة..."></textarea><button class="btn-primary" style="margin-top:10px;">حفظ</button></div><a class="back-link" data-return="dashboard">← العودة</a></div>`,
        smilies: `<div class="subpage"><h2>😊 الرموز</h2><div class="card"><label><input type="checkbox" checked> تفعيل الرموز</label><button class="btn-primary" style="margin-top:10px;">حفظ</button></div><a class="back-link" data-return="dashboard">← العودة</a></div>`,
        dateopt: `<div class="subpage"><h2>📅 التاريخ</h2><div class="card"><select class="txtbox"><option>24 ساعة</option><option>12 ساعة</option></select><button class="btn-primary" style="margin-top:10px;">تطبيق</button></div><a class="back-link" data-return="dashboard">← العودة</a></div>`,
        postopt: `<div class="subpage"><h2>📝 النشر</h2><div class="card"><input type="number" class="txtbox" value="500" placeholder="حد الأحرف"><button class="btn-primary" style="margin-top:10px;">حفظ</button></div><a class="back-link" data-return="dashboard">← العودة</a></div>`,
        style: `<div class="subpage"><h2>🎨 السمات</h2><div class="card"><label>لون الخلفية: <input type="color" value="#ffffff"></label><button class="btn-primary" style="margin-top:10px;">معاينة</button></div><a class="back-link" data-return="dashboard">← العودة</a></div>`,
        layout: `<div class="subpage"><h2>📐 التخطيط</h2><div class="card"><select class="txtbox"><option>كامل</option><option>متوسط</option></select><button class="btn-primary" style="margin-top:10px;">تطبيق</button></div><a class="back-link" data-return="dashboard">← العودة</a></div>`
    };

    // 📋 نظام القوائم المنسدلة
    const dropdowns = [
        { trigger: document.getElementById('hovmenu1'), content: document.getElementById('hovmenu1-content') },
        { trigger: document.getElementById('hovmenu2'), content: document.getElementById('hovmenu2-content') },
        { trigger: document.getElementById('hovmenu3'), content: document.getElementById('hovmenu3-content') },
        { trigger: document.getElementById('hovmenu4'), content: document.getElementById('hovmenu4-content') }
    ];

    function closeAllDropdowns() { dropdowns.forEach(d => { if(d.content) d.content.classList.remove('show'); const a=d.trigger?.querySelector('.submenu-arrow'); if(a) a.style.transform='rotate(0deg)'; }); }

    dropdowns.forEach(({ trigger, content }) => {
        if (!trigger || !content) return;
        trigger.addEventListener('click', function(e) {
            e.preventDefault(); e.stopPropagation();
            const isOpen = content.classList.toggle('show');
            const arrow = this.querySelector('.submenu-arrow');
            if(arrow) arrow.style.transform = isOpen ? 'rotate(180deg)' : 'rotate(0deg)';
            dropdowns.forEach(d => { if (d.content !== content && d.content) { d.content.classList.remove('show'); const oa=d.trigger.querySelector('.submenu-arrow'); if(oa) oa.style.transform='rotate(0deg)'; } });
        });
        content.querySelectorAll('.sublink').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault(); content.classList.remove('show'); const arrow=trigger.querySelector('.submenu-arrow'); if(arrow) arrow.style.transform='rotate(0deg)';
                content.querySelectorAll('.sublink').forEach(l => l.classList.remove('active')); this.classList.add('active');
                const target = this.getAttribute('data-target'); showSection('subpage'); subpageView.innerHTML = allSubPages[target] || '<p>صفحة غير متوفرة</p>'; if(errorBar) errorBar.textContent = this.textContent.trim();
            });
        });
    });

    document.addEventListener('click', function(e) {
        dropdowns.forEach(({ trigger, content }) => { if (content?.classList.contains('show') && !trigger.contains(e.target) && !content.contains(e.target)) { content.classList.remove('show'); const a=trigger.querySelector('.submenu-arrow'); if(a) a.style.transform='rotate(0deg)'; } });
        if (e.target.classList.contains('back-link')) { e.preventDefault(); showSection(e.target.getAttribute('data-return')||'dashboard'); closeAllDropdowns(); if(errorBar) errorBar.textContent='متصل ✅'; }
    });

    // 🆕 دوال صفحة "انشر"
    var curCode = "default";
    function switchcode() {
        var v = document.getElementById("variation-select")?.value || "default";
        document.querySelectorAll('[id^="cboxcode_"]').forEach(ta => ta.style.display = "none");
        var target = document.getElementById("cboxcode_" + v);
        if(target) target.style.display = ""; curCode = v;
    }
    function copytext() {
        var $ta = document.getElementById("cboxcode_" + curCode); if(!$ta) return;
        $ta.focus(); $ta.select();
        try { if (!document.execCommand("copy")) { navigator.clipboard.writeText($ta.value); }
            var $btnCopy = document.getElementById("btnCopy"); var orig = $btnCopy.textContent;
            $btnCopy.textContent = "✅ تم النسخ!"; setTimeout(() => { $btnCopy.textContent = orig; }, 2000);
        } catch (e) { alert("اضغط على الكود ثم اضغط Ctrl+C للنسخ يدوياً."); }
    }
    function gentag() {
        var x = document.getElementById("hashtag"); if(!x) return;
        var t = Math.round(Math.random()*1838265624).toString(35);
        t = t.replace('u','z').replace('i','5').replace('o','w'); x.value = t.substring(0,6);
    }
    function updateinst() {
        var a = document.getElementById("sitetype-select")?.value || "generic";
        document.querySelectorAll('[id^="ii_"]').forEach(div => div.style.display = "none");
        var target = document.getElementById("ii_" + a + "_v10") || document.getElementById("ii_generic_v10");
        if(target) target.style.display = "";
    }

    // 🆕 دوال صفحة "صندوق بريدي"
    function chk_faccount() {
        const f = document.forms["faccount"]; let err = "";
        if (f?.email?.value.trim() === "") { err += "يرجى إدخال بريد إلكتروني\n"; }
        if (f?.pword?.value && f.pword.value !== f.pword2?.value) { err += "كلمتا المرور غير متطابقتين\n"; }
        if (f?.pword?.value && f.pword.value.length < 6) { err += "كلمة المرور يجب أن تكون 6 أحرف على الأقل\n"; }
        if (err) { alert('❌ أخطاء:\n' + err); return false; }
        alert('✅ تم حفظ التغييرات'); return false;
    }
    function createBar(elem, isLog, showLimit) {
        if(!elem) return { setBarSize: function(){} };
        let bar = elem.querySelector('.barFill'), text = elem.querySelector('.barText');
        if(!bar || !text) return { setBarSize: function(){} };
        return { setBarSize: function(val, max) {
            const prop = Math.min(1, Math.max(0, val / max));
            const w = (isLog ? Math.log(prop * 1.718 + 1) : prop) * 100;
            const r = Math.min(255, prop/0.7 * 255 + 50), g = Math.max(0, 255 - prop*0.6*255), b = 80;
            bar.style.width = Math.max(w, 5) + "%";
            bar.style.backgroundColor = `rgb(${Math.round(r)}, ${Math.round(g)}, ${b})`;
            text.textContent = val.toLocaleString('ar-EG') + (showLimit ? `/${max}` : "");
        }};
    }
    function initMailboxStats() {
        if(!mailboxSection || mailboxSection.style.display === 'none') return;
        createBar(document.getElementById("sbar1"), true).setBarSize(128, 10000);
        createBar(document.getElementById("sbar2"), true).setBarSize(45, 500);
        createBar(document.getElementById("sbar3"), false).setBarSize(2, 100);
    }
    const lockedChk = document.getElementById('locked-chk');
    if(lockedChk) { lockedChk.addEventListener('change', function() { const msg = document.getElementById('m_flock'); if(msg) msg.textContent = this.checked ? 'مقفل' : 'مفتوح'; alert(this.checked ? '✅ تم القفل' : '✅ تم الفتح'); }); }

    // تهيئة عند التحميل
    if(document.getElementById("variation-select")) switchcode();
    if(document.getElementById("sitetype-select")) updateinst();
    const originalShowSection = showSection;
    showSection = function(name) { originalShowSection(name); if(name === 'mailbox') { setTimeout(initMailboxStats, 100); } }
});
