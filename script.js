document.addEventListener('DOMContentLoaded', function() {
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

    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();

    const ADMIN_EMAIL = 'admin@cbox.com'; // 🛡️ البريد الإداري

    // 🖥️ عناصر الواجهة
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const settingsSection = document.getElementById('settings-section');
    const emailInput = document.getElementById('email-input');
    const passInput = document.getElementById('pass-input');
    const authBtn = document.getElementById('auth-btn');
    const formTitle = document.getElementById('form-title');
    const toggleAuth = document.getElementById('toggle-auth');
    const resetLink = document.getElementById('reset-link');
    const userDisplay = document.getElementById('user-name-display');
    const logoutBtn = document.getElementById('logout-btn');
    const navLogout = document.getElementById('nav-logout');
    const navSettings = document.getElementById('nav-settings');
    const backToDash = document.getElementById('back-to-dashboard');
    const errorBar = document.getElementById('siteErrorBarCont');
    const loginHistory = document.getElementById('login-history');
    const sessionCount = document.getElementById('session-count');
    const lastLogin = document.getElementById('last-login');
    const settingsName = document.getElementById('settings-name');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const qLoginBtn = document.getElementById('q-login-btn');
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send-btn');
    const messagesList = document.getElementById('messages-list');
    const chatContainer = document.getElementById('chat-container');
    const themeToggle = document.getElementById('theme-toggle');

    let currentUser = null;
    let unsubscribeChat = null;
    let isLoginMode = true;
    let unreadCount = 0;
    let isTabActive = true;
    let lastKnownTimestamp = null;
    let chatInitialized = false;
    const originalTitle = document.title;

    // 🌙 الوضع الليلي
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('cbox-theme', theme);
        if (themeToggle) themeToggle.textContent = theme === 'dark' ? '☀️ وضع فاتح' : '🌙 وضع ليلي';
    }
    if (themeToggle) {
        applyTheme(localStorage.getItem('cbox-theme') || 'light');
        themeToggle.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            applyTheme(current === 'dark' ? 'light' : 'dark');
        });
    }

    // 🎵 صوت الإشعار
    function playNotificationSound() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext(); const osc = ctx.createOscillator(); const gain = ctx.createGain();
            osc.type = 'sine'; osc.frequency.value = 800; gain.gain.value = 0.1;
            osc.connect(gain).connect(ctx.destination); osc.start();
            gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.3);
            osc.stop(ctx.currentTime + 0.3);
        } catch (e) {}
    }
    function updateNotificationBadge() {
        document.title = unreadCount > 0 ? `(${unreadCount}) ${originalTitle}` : originalTitle;
    }
    document.addEventListener('visibilitychange', () => {
        isTabActive = document.visibilityState === 'visible';
        if (isTabActive && unreadCount > 0) { unreadCount = 0; updateNotificationBadge(); if (chatContainer) chatContainer.style.animation = ''; }
    });

    // 🔁 مراقبة المصادقة
    auth.onAuthStateChanged(user => {
        currentUser = user;
        if (user) {
            loginSection.style.display = 'none';
            dashboardSection.style.display = 'block';
            settingsSection.style.display = 'none';
            if (navLogout) navLogout.style.display = 'inline-block';
            if (chatInput) chatInput.disabled = false;
            if (chatSendBtn) chatSendBtn.disabled = false;
            userDisplay.textContent = user.displayName || user.email.split('@')[0];
            if (settingsName) settingsName.value = user.displayName || '';
            if (errorBar) errorBar.textContent = 'متصل بـ Firebase ✅';
            loadDashboardData(user.email);
            initChat();
        } else {
            loginSection.style.display = 'block';
            dashboardSection.style.display = 'none';
            settingsSection.style.display = 'none';
            if (navLogout) navLogout.style.display = 'none';
            if (chatInput) chatInput.disabled = true;
            if (chatSendBtn) chatSendBtn.disabled = true;
            if (unsubscribeChat) unsubscribeChat();
            if (errorBar) errorBar.textContent = 'جاهز...';
            if (messagesList) messagesList.innerHTML = '<p style="text-align:center;color:#888;padding:20px;">سجّل الدخول لرؤية الرسائل</p>';
            unreadCount = 0; updateNotificationBadge();
        }
    });

    if (toggleAuth) {
        toggleAuth.addEventListener('click', e => { e.preventDefault(); isLoginMode = !isLoginMode; if (formTitle) formTitle.textContent = isLoginMode ? 'تسجيل الدخول' : 'إنشاء حساب جديد'; if (authBtn) authBtn.textContent = isLoginMode ? 'تسجيل الدخول' : 'إنشاء حساب'; });
    }
    if (authBtn) {
        authBtn.addEventListener('click', async () => {
            const email = emailInput?.value.trim() || ''; const pass = passInput?.value.trim() || '';
            if (!email.includes('@')) return alert('⚠️ أدخل بريد إلكتروني صحيح');
            if (!email || !pass) return alert('⚠️ املأ جميع الحقول');
            authBtn.disabled = true; authBtn.textContent = 'جاري المعالجة...';
            try {
                if (isLoginMode) await auth.signInWithEmailAndPassword(email, pass);
                else { await auth.createUserWithEmailAndPassword(email, pass); await db.collection('users').doc(auth.currentUser.uid).set({ email, displayName: email.split('@')[0], createdAt: firebase.firestore.FieldValue.serverTimestamp() }); }
                await db.collection('sessions').add({ userId: auth.currentUser.uid, email, timestamp: firebase.firestore.FieldValue.serverTimestamp() });
            } catch (err) { alert('❌ ' + (translateFirebaseError(err.code) || err.message)); }
            finally { authBtn.disabled = false; authBtn.textContent = isLoginMode ? 'تسجيل الدخول' : 'إنشاء حساب'; }
        });
    }
    if (qLoginBtn) { qLoginBtn.addEventListener('click', async () => { const qEmail = document.getElementById('q-email')?.value.trim(); const qPass = document.getElementById('q-pass')?.value.trim(); if (!qEmail || !qPass) return alert('⚠️ املأ حقول الهيدر'); try { await auth.signInWithEmailAndPassword(qEmail, qPass); } catch (err) { alert('❌ ' + translateFirebaseError(err.code)); } }); }
    if (resetLink) { resetLink.addEventListener('click', async e => { e.preventDefault(); const email = prompt('أدخل بريدك الإلكتروني لاستعادة كلمة المرور:'); if (email) { try { await auth.sendPasswordResetEmail(email); alert('✅ تم إرسال رابط الاستعادة'); } catch (err) { alert('❌ ' + err.message); } } }); }
    const doLogout = () => auth.signOut();
    if (logoutBtn) logoutBtn.onclick = doLogout;
    if (navLogout) navLogout.onclick = doLogout;
    if (navSettings) navSettings.onclick = e => { e.preventDefault(); dashboardSection.style.display='none'; settingsSection.style.display='block'; };
    if (backToDash) backToDash.onclick = e => { e.preventDefault(); settingsSection.style.display='none'; dashboardSection.style.display='block'; };
    if (saveSettingsBtn) { saveSettingsBtn.addEventListener('click', async () => { const newName = settingsName?.value.trim(); if (!newName) return alert('⚠️ الاسم مطلوب'); try { await auth.currentUser.updateProfile({ displayName: newName }); await db.collection('users').doc(auth.currentUser.uid).update({ displayName: newName }); if (userDisplay) userDisplay.textContent = newName; alert('✅ تم حفظ التغييرات'); } catch (err) { alert('❌ ' + err.message); } }); }

    // 📊 تحميل بيانات اللوحة
    async function loadDashboardData(email) {
        if (!loginHistory) return;
        loginHistory.innerHTML = '<li>جاري التحميل...</li>';
        try {
            const snap = await db.collection('sessions').orderBy('timestamp', 'desc').limit(50).get();
            const userSessions = snap.docs.filter(doc => doc.data().email === email).slice(0, 5);
            if (userSessions.length === 0) loginHistory.innerHTML = '<li>لا توجد جلسات سابقة</li>';
            else {
                let html = '';
                userSessions.forEach(doc => { const d = doc.data(); const t = d.timestamp ? d.timestamp.toDate().toLocaleString('ar-EG') : 'غير معروف'; html += `<li>🟢 دخول في: ${t}</li>`; });
                loginHistory.innerHTML = html;
                if (sessionCount) sessionCount.textContent = userSessions.length;
                if (lastLogin) lastLogin.textContent = userSessions[0].data().timestamp.toDate().toLocaleString('ar-EG');
            }
        } catch(e) { loginHistory.innerHTML = '<li>فشل التحميل</li>'; }
    }

    // 💬 الدردشة + نظام الحذف
    function initChat() {
        if (unsubscribeChat) unsubscribeChat();
        if (messagesList) messagesList.innerHTML = '<p style="text-align:center;color:#888;padding:20px;">جاري تحميل الرسائل...</p>';
        chatInitialized = false; lastKnownTimestamp = null; unreadCount = 0; updateNotificationBadge();
        
        unsubscribeChat = db.collection('messages').orderBy('timestamp','asc').onSnapshot(snapshot => {
            if (!messagesList) return;
            messagesList.innerHTML = '';
            if (snapshot.empty) messagesList.innerHTML = '<p style="text-align:center;color:#888;padding:20px;">🎉 لا توجد رسائل بعد. كن أول من يكتب!</p>';
            else {
                let hasNewMessages = false;
                snapshot.forEach(doc => {
                    const m = doc.data();
                    const time = m.timestamp ? m.timestamp.toDate().toLocaleTimeString('ar-EG',{hour:'2-digit',minute:'2-digit'}) : '';
                    const isMe = m.senderEmail === currentUser?.email;
                    const isAdmin = currentUser?.email === ADMIN_EMAIL;
                    if (chatInitialized && lastKnownTimestamp && m.timestamp && m.timestamp.toMillis() > lastKnownTimestamp.toMillis() && !isMe) hasNewMessages = true;
                    
                    const div = document.createElement('div');
                    div.className = 'message-item' + (isMe ? ' my-message' : '');
                    div.innerHTML = `<div class="sender">${escapeHtml(m.senderName || 'مستخدم')}</div><span class="time">${time}</span><span class="text">${escapeHtml(m.text)}</span>`;
                    
                    // 🗑️ زر الحذف (يظهر لصاحب الرسالة أو الأدمن فقط)
                    if (isMe || isAdmin) {
                        const delBtn = document.createElement('button');
                        delBtn.className = 'msg-delete-btn';
                        delBtn.textContent = '🗑️';
                        delBtn.title = 'حذف الرسالة';
                        delBtn.onclick = async () => {
                            if (confirm('هل تريد حذف هذه الرسالة نهائياً؟')) {
                                try { await db.collection('messages').doc(doc.id).delete(); } 
                                catch (err) { alert('❌ فشل الحذف: ' + err.message); }
                            }
                        };
                        div.appendChild(delBtn);
                    }
                    messagesList.appendChild(div);
                    if (m.timestamp && (!lastKnownTimestamp || m.timestamp.toMillis() > lastKnownTimestamp.toMillis())) lastKnownTimestamp = m.timestamp;
                });
                if (hasNewMessages && !isTabActive) { unreadCount++; updateNotificationBadge(); playNotificationSound(); if (chatContainer) chatContainer.style.animation = 'flashBorder 1s ease-in-out'; }
            }
            chatInitialized = true;
            if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
        }, error => { console.error("❌ خطأ في الدردشة:", error); if (messagesList) messagesList.innerHTML = `<p style="color:#c00;text-align:center;padding:20px;">❌ خطأ: ${error.message}</p>`; });
    }

    // 📤 إرسال رسالة
    if (chatSendBtn) {
        chatSendBtn.addEventListener('click', async () => {
            const text = chatInput?.value.trim();
            if (!text || !currentUser) return;
            chatSendBtn.disabled = true; chatSendBtn.textContent = '...';
            try { await db.collection('messages').add({ text, senderName: currentUser.displayName || currentUser.email.split('@')[0], senderEmail: currentUser.email, userId: currentUser.uid, timestamp: firebase.firestore.FieldValue.serverTimestamp() }); if (chatInput) chatInput.value = ''; }
            catch (err) { alert('❌ فشل إرسال الرسالة'); }
            finally { chatSendBtn.disabled = false; chatSendBtn.textContent = 'إرسال'; }
        });
        if (chatInput) chatInput.addEventListener('keypress', e => { if (e.key === 'Enter' && !chatSendBtn.disabled) chatSendBtn.click(); });
    }

    function escapeHtml(text) { const div = document.createElement('div'); div.appendChild(document.createTextNode(text)); return div.innerHTML; }
    function translateFirebaseError(code) { const map = { 'auth/invalid-credential': 'البريد أو كلمة المرور غير صحيحة', 'auth/email-already-in-use': 'البريد مسجل مسبقاً', 'auth/invalid-email': 'صيغة البريد غير صحيحة', 'auth/user-not-found': 'البريد غير مسجل', 'auth/wrong-password': 'كلمة المرور غير صحيحة', 'auth/weak-password': 'كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'auth/too-many-requests': 'محاولات كثيرة، انتظر قليلاً' }; return map[code] || code; }
});
