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
    const ADMIN_EMAIL = 'admin@cbox.com';

    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const settingsSection = document.getElementById('settings-section');
    const subpageView = document.getElementById('subpage-view');
    const emailInput = document.getElementById('email-input'); const passInput = document.getElementById('pass-input');
    const authBtn = document.getElementById('auth-btn'); const formTitle = document.getElementById('form-title');
    const toggleAuth = document.getElementById('toggle-auth'); const resetLink = document.getElementById('reset-link');
    const userDisplay = document.getElementById('user-name-display'); const logoutBtn = document.getElementById('logout-btn');
    const navLogout = document.getElementById('nav-logout'); const navSettings = document.getElementById('nav-settings');
    const backToDash = document.getElementById('back-to-dashboard'); const errorBar = document.getElementById('siteErrorBarCont');
    const loginHistory = document.getElementById('login-history'); const sessionCount = document.getElementById('session-count');
    const lastLogin = document.getElementById('last-login'); const settingsName = document.getElementById('settings-name');
    const saveSettingsBtn = document.getElementById('save-settings-btn'); const qLoginBtn = document.getElementById('q-login-btn');
    const chatInput = document.getElementById('chat-input'); const chatSendBtn = document.getElementById('chat-send-btn');
    const messagesList = document.getElementById('messages-list'); const chatContainer = document.getElementById('chat-container');
    const themeToggle = document.getElementById('theme-toggle'); const todayMsgCount = document.getElementById('today-msg-count');
    const activeUsersCount = document.getElementById('active-users-count'); const exportBtn = document.getElementById('export-btn');
    
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
        if (user) { showSection('dashboard'); if (navLogout) navLogout.style.display = 'inline-block'; if (chatInput) chatInput.disabled = false; if (chatSendBtn) chatSendBtn.disabled = false; userDisplay.textContent = user.displayName || user.email.split('@')[0]; if (settingsName) settingsName.value = user.displayName || ''; if (errorBar) errorBar.textContent = 'متصل بـ Firebase ✅'; loadDashboardData(user.email); initChat(); } 
        else { showSection('login'); if (navLogout) navLogout.style.display = 'none'; if (chatInput) chatInput.disabled = true; if (chatSendBtn) chatSendBtn.disabled = true; if (unsubscribeChat) unsubscribeChat(); if (errorBar) errorBar.textContent = 'جاهز...'; if (messagesList) messagesList.innerHTML = '<p style="text-align:center;color:#888;padding:20px;">سجّل الدخول لرؤية الرسائل</p>'; unreadCount = 0; updateNotificationBadge(); }
    });

    function showSection(name) { loginSection.style.display = 'none'; dashboardSection.style.display = 'none'; settingsSection.style.display = 'none'; subpageView.style.display = 'none'; if (name === 'login') loginSection.style.display = 'block'; else if (name === 'dashboard') dashboardSection.style.display = 'block'; else if (name === 'settings') settingsSection.style.display = 'block'; else if (name === 'subpage') subpageView.style.display = 'block'; }

    if (toggleAuth) { toggleAuth.addEventListener('click', e => { e.preventDefault(); isLoginMode = !isLoginMode; if (formTitle) formTitle.textContent = isLoginMode ? 'تسجيل الدخول' : 'إنشاء حساب جديد'; if (authBtn) authBtn.textContent = isLoginMode ? 'تسجيل الدخول' : 'إنشاء حساب'; }); }
    if (authBtn) { authBtn.addEventListener('click', async () => { const email = emailInput?.value.trim()||''; const pass = passInput?.value.trim()||''; if (!email.includes('@')) return alert('⚠️ أدخل بريد إلكتروني صحيح'); if (!email || !pass) return alert('⚠️ املأ جميع الحقول'); authBtn.disabled = true; authBtn.textContent = 'جاري المعالجة...'; try { if (isLoginMode) await auth.signInWithEmailAndPassword(email, pass); else { await auth.createUserWithEmailAndPassword(email, pass); await db.collection('users').doc(auth.currentUser.uid).set({ email, displayName: email.split('@')[0], createdAt: firebase.firestore.FieldValue.serverTimestamp() }); } await db.collection('sessions').add({ userId: auth.currentUser.uid, email, timestamp: firebase.firestore.FieldValue.serverTimestamp() }); } catch (err) { alert('❌ ' + (translateFirebaseError(err.code) || err.message)); } finally { authBtn.disabled = false; authBtn.textContent = isLoginMode ? 'تسجيل الدخول' : 'إنشاء حساب'; } }); }
    if (qLoginBtn) { qLoginBtn.addEventListener('click', async () => { const e=document.getElementById('q-email')?.value.trim(), p=document.getElementById('q-pass')?.value.trim(); if(!e||!p) return alert('⚠️ املأ حقول الهيدر'); try{await auth.signInWithEmailAndPassword(e,p)}catch(err){alert('❌ '+translateFirebaseError(err.code))} }); }
    if (resetLink) { resetLink.addEventListener('click', async e => { e.preventDefault(); const em=prompt('أدخل بريدك الإلكتروني لاستعادة كلمة المرور:'); if(em){try{await auth.sendPasswordResetEmail(em);alert('✅ تم إرسال رابط الاستعادة')}catch(err){alert('❌ '+err.message)}} }); }
    const doLogout = () => auth.signOut(); if (logoutBtn) logoutBtn.onclick = doLogout; if (navLogout) navLogout.onclick = doLogout;
    if (navSettings) navSettings.onclick = e => { e.preventDefault(); showSection('settings'); if(errorBar) errorBar.textContent='الإعدادات'; };
    if (backToDash) backToDash.onclick = e => { e.preventDefault(); showSection('dashboard'); if(errorBar) errorBar.textContent='متصل بـ Firebase ✅'; };
    if (document.getElementById('nav-home')) document.getElementById('nav-home').onclick = e => { e.preventDefault(); showSection('dashboard'); if(errorBar) errorBar.textContent='متصل بـ Firebase ✅'; };
    if (saveSettingsBtn) { saveSettingsBtn.addEventListener('click', async () => { const n=settingsName?.value.trim(); if(!n) return alert('⚠️ الاسم مطلوب'); try{await auth.currentUser.updateProfile({displayName:n}); await db.collection('users').doc(auth.currentUser.uid).update({displayName:n}); if(userDisplay) userDisplay.textContent=n; alert('✅ تم حفظ التغييرات')}catch(err){alert('❌ '+err.message)} }); }

    async function loadDashboardData(email) { if (!loginHistory) return; loginHistory.innerHTML='<li>جاري التحميل...</li>'; try{const snap=await db.collection('sessions').orderBy('timestamp','desc').limit(50).get(); const u=snap.docs.filter(d=>d.data().email===email).slice(0,5); if(u.length===0) loginHistory.innerHTML='<li>لا توجد جلسات سابقة</li>'; else{let h='';u.forEach(d=>{const t=d.data().timestamp?d.data().timestamp.toDate().toLocaleString('ar-EG'):'غير معروف'; h+=`<li>🟢 دخول في: ${t}</li>`}); loginHistory.innerHTML=h; if(sessionCount) sessionCount.textContent=u.length; if(lastLogin) lastLogin.textContent=u[0].data().timestamp.toDate().toLocaleString('ar-EG'); }}catch(e){loginHistory.innerHTML='<li>فشل التحميل</li>'; }}

    async function loadAdvancedStats() { if(!todayMsgCount||!activeUsersCount) return; todayMsgCount.textContent='...'; activeUsersCount.textContent='...'; try{const now=new Date(), todayStart=new Date(now.getFullYear(),now.getMonth(),now.getDate()), sevenDaysAgo=new Date(todayStart.getTime()-(7*24*60*60*1000)); const m=await db.collection('messages').where('timestamp','>=',todayStart).get(); todayMsgCount.textContent=m.size; const s=await db.collection('sessions').where('timestamp','>=',sevenDaysAgo).get(); activeUsersCount.textContent=new Set(s.docs.map(d=>d.data().userId)).size;}catch(e){todayMsgCount.textContent='0';activeUsersCount.textContent='0';}}

    if (exportBtn) { exportBtn.addEventListener('click', async () => { exportBtn.disabled=true; exportBtn.textContent='⏳ جاري التحضير...'; try{if(cachedMessages.length===0){const snap=await db.collection('messages').orderBy('timestamp','asc').get(); cachedMessages=snap.docs.map(d=>({id:d.id,...d.data()}));} let csv='\uFEFF"التاريخ","الوقت","المرسل","الرسالة"\n'; cachedMessages.forEach(m=>{const d=m.timestamp?m.timestamp.toDate():new Date(); const date=d.toLocaleDateString('ar-EG'), time=d.toLocaleTimeString('ar-EG'); csv+=`"${date}","${time}","${(m.senderName||'مستخدم').replace(/"/g,'""')}","${(m.text||'').replace(/"/g,'""')}"\n`;}); const b=new Blob([csv],{type:'text/csv;charset=utf-8;'}), u=URL.createObjectURL(b), l=document.createElement('a'); l.href=u; l.download=`chat-export-${new Date().toISOString().slice(0,10)}.csv`; document.body.appendChild(l); l.click(); document.body.removeChild(l);}catch(err){alert('❌ فشل التصدير: '+err.message)} finally{exportBtn.disabled=false;exportBtn.textContent='📥 تصدير الدردشة (CSV)';}}); }

    function initChat() { if(unsubscribeChat) unsubscribeChat(); if(messagesList) messagesList.innerHTML='<p style="text-align:center;color:#888;padding:20px;">جاري تحميل الرسائل...</p>'; chatInitialized=false; lastKnownTimestamp=null; unreadCount=0; updateNotificationBadge(); cachedMessages=[]; loadAdvancedStats();
        unsubscribeChat=db.collection('messages').orderBy('timestamp','asc').onSnapshot(snap=>{ if(!messagesList) return; messagesList.innerHTML=''; if(snap.empty) messagesList.innerHTML='<p style="text-align:center;color:#888;padding:20px;">🎉 لا توجد رسائل بعد. كن أول من يكتب!</p>'; else{ let newMsg=false; cachedMessages=[]; snap.forEach(doc=>{const m=doc.data(); cachedMessages.push({id:doc.id,...m}); const t=m.timestamp?m.timestamp.toDate().toLocaleTimeString('ar-EG',{hour:'2-digit',minute:'2-digit'}):''; const isMe=m.senderEmail===currentUser?.email, isAdmin=currentUser?.email===ADMIN_EMAIL; if(chatInitialized&&lastKnownTimestamp&&m.timestamp&&m.timestamp.toMillis()>lastKnownTimestamp.toMillis()&&!isMe) newMsg=true; const d=document.createElement('div'); d.className='message-item'+(isMe?' my-message':''); d.innerHTML=`<div class="sender">${escapeHtml(m.senderName||'مستخدم')}</div><span class="time">${t}</span><span class="text">${escapeHtml(m.text)}</span>`; if(isMe||isAdmin){const btn=document.createElement('button'); btn.className='msg-delete-btn'; btn.textContent='🗑️'; btn.title='حذف الرسالة'; btn.onclick=async()=>{if(confirm('هل تريد حذف هذه الرسالة نهائياً؟')){try{await db.collection('messages').doc(doc.id).delete();}catch(e){alert('❌ فشل الحذف')}}}; d.appendChild(btn);} messagesList.appendChild(d); if(m.timestamp&&(!lastKnownTimestamp||m.timestamp.toMillis()>lastKnownTimestamp.toMillis())) lastKnownTimestamp=m.timestamp; }); if(newMsg&&!isTabActive){unreadCount++; updateNotificationBadge(); playNotificationSound(); if(chatContainer) chatContainer.style.animation='flashBorder 1s ease-in-out';} if(newMsg) loadAdvancedStats(); } chatInitialized=true; if(chatContainer) chatContainer.scrollTop=chatContainer.scrollHeight; }, err=>{console.error("❌ خطأ في الدردشة:",err); if(messagesList) messagesList.innerHTML=`<p style="color:#c00;text-align:center;padding:20px;">❌ خطأ: ${err.message}</p>`; }); }

    if (chatSendBtn) { chatSendBtn.addEventListener('click', async () => { const t=chatInput?.value.trim(); if(!t||!currentUser) return; chatSendBtn.disabled=true; chatSendBtn.textContent='...'; try{await db.collection('messages').add({text:t, senderName:currentUser.displayName||currentUser.email.split('@')[0], senderEmail:currentUser.email, userId:currentUser.uid, timestamp:firebase.firestore.FieldValue.serverTimestamp()}); if(chatInput) chatInput.value='';}catch(err){alert('❌ فشل إرسال الرسالة')} finally{chatSendBtn.disabled=false; chatSendBtn.textContent='إرسال';} }); if(chatInput) chatInput.addEventListener('keypress', e=>{if(e.key==='Enter'&&!chatSendBtn.disabled) chatSendBtn.click();}); }

    function escapeHtml(text) { const d=document.createElement('div'); d.appendChild(document.createTextNode(text||'')); return d.innerHTML; }
    function translateFirebaseError(code) { const m={'auth/invalid-credential':'البريد أو كلمة المرور غير صحيحة','auth/email-already-in-use':'البريد مسجل مسبقاً','auth/invalid-email':'صيغة البريد غير صحيحة','auth/user-not-found':'البريد غير مسجل','auth/wrong-password':'كلمة المرور غير صحيحة','auth/weak-password':'كلمة المرور يجب أن تكون 6 أحرف على الأقل','auth/too-many-requests':'محاولات كثيرة، انتظر قليلاً'}; return m[code]||code; }

    // 📋 جميع الصفحات الفرعية (مدمجة وقابلة للتوسع)
    const allSubPages = {
        posts: `<div class="subpage"><h2>📩 إدارة الرسائل</h2><div class="notice">عرض جميع الرسائل الواردة في الصندوق</div><div class="card"><p>🔍 بحث: <input type="text" class="txtbox" placeholder="ابحث في الرسائل..." style="width:200px;display:inline-block;"></p><p>📅 تصفية: <select class="txtbox" style="width:150px;display:inline-block;"><option>الكل</option><option>اليوم</option><option>هذا الأسبوع</option></select></p><div style="margin-top:15px;"><p style="color:#888;">لا توجد رسائل لعرضها حالياً</p></div></div><a class="back-link" data-return="dashboard">← العودة للوحة التحكم</a></div>`,
        postsarc: `<div class="subpage"><h2>🗄️ الأرشيف</h2><div class="notice">الرسائل المؤرشفة والمحذوفة</div><div class="card"><p>📦 إجمالي المؤرشف: <strong>0</strong></p><p>🗑️ إجمالي المحذوف: <strong>0</strong></p><button class="btn-primary" style="margin-top:10px;background:#64748b;">استعادة رسائل</button></div><a class="back-link" data-return="dashboard">← العودة للوحة التحكم</a></div>`,
        sticky: `<div class="subpage"><h2>📌 رسالة لاصقة</h2><div class="notice">تعيين رسالة تظهر دائماً في أعلى الدردشة</div><div class="card"><fieldset><legend>نص الرسالة اللاصقة</legend><textarea class="txtbox" rows="4" placeholder="اكتب الرسالة التي تريد تثبيتها..." style="width:100%;"></textarea><button class="btn-primary" style="margin-top:10px;" id="save-sticky-btn">تثبيت الرسالة</button><button class="btn-primary" style="margin-top:10px;background:#dc2626;" id="remove-sticky-btn">إزالة التثبيت</button></fieldset></div><a class="back-link" data-return="dashboard">← العودة للوحة التحكم</a></div>`,
        channels: `<div class="subpage"><h2>📺 القنوات</h2><div class="notice">إدارة قنوات الدردشة المتعددة</div><div class="card"><p>➕ <a href="#" id="add-channel-link">إنشاء قناة جديدة</a></p><ul id="channels-list" style="list-style:none;padding-right:0;margin-top:10px;"><li style="padding:8px;border-bottom:1px solid var(--border-color);">🟢 <strong>عام</strong> <span style="color:#888;font-size:11px;">(القناة الافتراضية)</span></li></ul></div><a class="back-link" data-return="dashboard">← العودة للوحة التحكم</a></div>`,
        webhook: `<div class="subpage"><h2>🔗 رابط الويب (Webhook)</h2><div class="notice">ربط الصندوق بخدمات خارجية مثل Discord أو Slack</div><div class="card"><label>رابط الويب هووك:</label><input type="text" class="txtbox" value="https://your-webhook-url.com/endpoint" readonly style="width:100%;direction:ltr;text-align:left;"><button class="btn-primary" style="margin-top:10px;" onclick="navigator.clipboard.writeText(this.previousElementSibling.value); alert('✅ تم نسخ الرابط!')">📋 نسخ الرابط</button><p style="margin-top:15px;font-size:11px;color:#666;">💡 استخدم هذا الرابط لإرسال رسائل تلقائية من خدماتك إلى صندوق التحكم.</p></div><a class="back-link" data-return="dashboard">← العودة للوحة التحكم</a></div>`,
        users: `<div class="subpage"><h2>👥 المستخدمون المسجلون</h2><div class="notice">قائمة بجميع المستخدمين الذين أنشأوا حسابات</div><div class="card"><div id="users-table" style="max-height:300px;overflow-y:auto;"></div><button class="btn-primary" style="margin-top:10px;background:#64748b;" onclick="alert('✅ سيتم تحديث القائمة')">تحديث القائمة</button></div><a class="back-link" data-return="dashboard">← العودة للوحة التحكم</a></div>`,
        bans: `<div class="subpage"><h2>🚫 المستخدمون المحظورون</h2><div class="notice">المستخدمون الذين تم منعهم من الدخول أو الكتابة</div><div class="card"><p style="color:#888;text-align:center;padding:20px;">لا يوجد مستخدمون محظورون حالياً</p><button class="btn-primary" style="margin-top:10px;">إضافة حظر جديد</button></div><a class="back-link" data-return="dashboard">← العودة للوحة التحكم</a></div>`,
        userint: `<div class="subpage"><h2>🔗 تكامل المستخدم</h2><div class="notice">ربط الحسابات بمنصات خارجية (Discord, Telegram, إلخ)</div><div class="card"><p>🔌 <strong>Discord:</strong> <span style="color:#c00">غير متصل</span></p><p>🔌 <strong>Telegram:</strong> <span style="color:#16a34a">متصل</span></p><p style="margin-top:15px;"><button class="btn-primary">إدارة التكاملات</button></p></div><a class="back-link" data-return="dashboard">← العودة للوحة التحكم</a></div>`,
        filtering: `<div class="subpage"><h2>🔍 تصفية المحتوى</h2><div class="notice">إعداد كلمات محظورة، فلاتر الروابط، ومراقبة تلقائية</div><div class="card"><fieldset><legend>كلمات محظورة</legend><textarea class="txtbox" rows="3" placeholder="اكتب الكلمات مفصولة بفاصلة..." style="width:100%;"></textarea><button class="btn-primary" style="margin-top:10px;">حفظ الفلاتر</button></fieldset></div><a class="back-link" data-return="dashboard">← العودة للوحة التحكم</a></div>`,
        smilies: `<div class="subpage"><h2>😊 الرموز التعبيرية</h2><div class="notice">تفعيل أو تعطيل الرموز التعبيرية وتخصيصها</div><div class="card"><label><input type="checkbox" checked> تفعيل الرموز التعبيرية تلقائياً</label><br><label><input type="checkbox"> تحويل الروابط إلى معاينات</label><button class="btn-primary" style="margin-top:10px;">حفظ الإعدادات</button></div><a class="back-link" data-return="dashboard">← العودة للوحة التحكم</a></div>`,
        dateopt: `<div class="subpage"><h2>📅 خيارات التاريخ</h2><div class="notice">تنسيق التاريخ والوقت المعروض في اللوحة والدردشة</div><div class="card"><label>التنسيق:</label><select class="txtbox" style="width:100%;margin-top:5px;"><option>24 ساعة (14:30)</option><option>12 ساعة (2:30 م)</option><option>منذ (منذ 5 دقائق)</option></select><button class="btn-primary" style="margin-top:10px;">تطبيق</button></div><a class="back-link" data-return="dashboard">← العودة للوحة التحكم</a></div>`,
        postopt: `<div class="subpage"><h2>📝 خيارات النشر</h2><div class="notice">التحكم في طول الرسائل، عدد الأسطر، وتأخير النشر</div><div class="card"><label>الحد الأقصى للأحرف:</label><input type="number" class="txtbox" value="500" style="width:100%;margin-top:5px;"><label>تأخير النشر (ثواني):</label><input type="number" class="txtbox" value="3" style="width:100%;margin-top:5px;"><button class="btn-primary" style="margin-top:10px;">حفظ</button></div><a class="back-link" data-return="dashboard">← العودة للوحة التحكم</a></div>`,
        style: `<div class="subpage"><h2>🎨 محرر السمات</h2><div class="notice">تخصيص ألوان وخطوط واجهة الدردشة</div><div class="card"><fieldset><legend>الألوان الأساسية</legend><label>لون الخلفية: <input type="color" value="#ffffff"></label><br><label>لون النص: <input type="color" value="#333333"></label><br><label>لون الرابط: <input type="color" value="#2563eb"></label></fieldset><button class="btn-primary" style="margin-top:10px;">معاينة وحفظ</button></div><a class="back-link" data-return="dashboard">← العودة للوحة التحكم</a></div>`,
        layout: `<div class="subpage"><h2>📐 خيارات التخطيط</h2><div class="notice">التحكم في عرض العناصر، حجم الخط، وترتيب الأقسام</div><div class="card"><label>عرض الصندوق:</label><select class="txtbox" style="width:100%;margin-top:5px;"><option>كامل الشاشة</option><option>متوسط (960px)</option><option>ضيق (720px)</option></select><label>حجم الخط الأساسي:</label><input type="range" class="txtbox" min="10" max="16" value="12" style="width:100%;margin-top:5px;"><button class="btn-primary" style="margin-top:10px;">تطبيق التخطيط</button></div><a class="back-link" data-return="dashboard">← العودة للوحة التحكم</a></div>`
    };

    // 📋 نظام القوائم المنسدلة (قابل للتوسع لأي عدد)
    const dropdowns = [
        { trigger: document.getElementById('hovmenu4'), content: document.getElementById('hovmenu4-content') },
        { trigger: document.getElementById('hovmenu5'), content: document.getElementById('hovmenu5-content') },
        { trigger: document.getElementById('hovmenu6'), content: document.getElementById('hovmenu6-content') },
        { trigger: document.getElementById('hovmenu7'), content: document.getElementById('hovmenu7-content') }
    ];

    dropdowns.forEach(({ trigger, content }) => {
        if (!trigger || !content) return;
        trigger.addEventListener('click', function(e) {
            e.preventDefault(); e.stopPropagation();
            const isOpen = content.classList.toggle('show');
            const arrow = this.querySelector('.submenu-arrow');
            if(arrow) arrow.style.transform = isOpen ? 'rotate(180deg)' : 'rotate(0deg)';
            // إغلاق القوائم الأخرى
            dropdowns.forEach(d => {
                if (d.content !== content) {
                    d.content.classList.remove('show');
                    const otherArrow = d.trigger.querySelector('.submenu-arrow');
                    if(otherArrow) otherArrow.style.transform = 'rotate(0deg)';
                }
            });
        });

        content.querySelectorAll('.sublink').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                content.classList.remove('show');
                const arrow = trigger.querySelector('.submenu-arrow');
                if(arrow) arrow.style.transform = 'rotate(0deg)';
                content.querySelectorAll('.sublink').forEach(l => l.classList.remove('active'));
                this.classList.add('active');
                const target = this.getAttribute('data-target');
                showSection('subpage');
                subpageView.innerHTML = allSubPages[target] || '<p>صفحة غير متوفرة</p>';
                if(errorBar) errorBar.textContent = this.textContent.trim();
            });
        });
    });

    document.addEventListener('click', function(e) {
        dropdowns.forEach(({ trigger, content }) => {
            if (content.classList.contains('show') && !trigger.contains(e.target) && !content.contains(e.target)) {
                content.classList.remove('show');
                const a = trigger.querySelector('.submenu-arrow');
                if(a) a.style.transform = 'rotate(0deg)';
            }
        });
        if (e.target.classList.contains('back-link')) {
            e.preventDefault();
            showSection(e.target.getAttribute('data-return') || 'dashboard');
            dropdowns.forEach(d => { d.content.classList.remove('show'); const a=d.trigger.querySelector('.submenu-arrow'); if(a) a.style.transform='rotate(0deg)'; });
            if(errorBar) errorBar.textContent = 'متصل بـ Firebase ✅';
        }
    });
});
