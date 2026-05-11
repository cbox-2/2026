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

    // تهيئة Firebase
    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
    }
    const auth = firebase.auth();
    const db = firebase.firestore();

    // 🖥️ تعريف العناصر
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

    let currentUser = null;
    let unsubscribeChat = null;
    let isLoginMode = true;

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
        }
    });

    // 📝 تبديل الدخول/التسجيل
    if (toggleAuth) {
        toggleAuth.addEventListener('click', e => {
            e.preventDefault();
            isLoginMode = !isLoginMode;
            if (formTitle) formTitle.textContent = isLoginMode ? 'تسجيل الدخول' : 'إنشاء حساب جديد';
            if (authBtn) authBtn.textContent = isLoginMode ? 'تسجيل الدخول' : 'إنشاء حساب';
        });
    }

    // 🔐 زر الدخول/التسجيل
    if (authBtn) {
        authBtn.addEventListener('click', async () => {
            const email = emailInput?.value.trim() || '';
            const pass = passInput?.value.trim() || '';
            if (!email.includes('@')) return alert('⚠️ أدخل بريد إلكتروني صحيح');
            if (!email || !pass) return alert('⚠️ املأ جميع الحقول');

            authBtn.disabled = true; authBtn.textContent = 'جاري...';
            try {
                if (isLoginMode) {
                    await auth.signInWithEmailAndPassword(email, pass);
                } else {
                    await auth.createUserWithEmailAndPassword(email, pass);
                    await db.collection('users').doc(auth.currentUser.uid).set({
                        email, displayName: email.split('@')[0],
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
                await db.collection('sessions').add({
                    userId: auth.currentUser.uid, email,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
            } catch (err) {
                alert('❌ ' + (translateFirebaseError(err.code) || err.message));
            } finally {
                authBtn.disabled = false;
                authBtn.textContent = isLoginMode ? 'تسجيل الدخول' : 'إنشاء حساب';
            }
        });
    }

    // 🔗 نسيت كلمة المرور
    if (resetLink) {
        resetLink.addEventListener('click', async e => {
            e.preventDefault();
            const email = prompt('أدخل بريدك الإلكتروني:');
            if (email) {
                try {
                    await auth.sendPasswordResetEmail(email);
                    alert('✅ تم إرسال رابط الاستعادة');
                } catch (err) { alert('❌ ' + err.message); }
            }
        });
    }

    // 🚪 تسجيل الخروج
    const doLogout = () => auth.signOut();
    if (logoutBtn) logoutBtn.onclick = doLogout;
    if (navLogout) navLogout.onclick = doLogout;

    // ⚙️ التنقل
    if (navSettings) navSettings.onclick = e => { e.preventDefault(); dashboardSection.style.display='none'; settingsSection.style.display='block'; };
    if (backToDash) backToDash.onclick = e => { e.preventDefault(); settingsSection.style.display='none'; dashboardSection.style.display='block'; };

    // 💾 حفظ الإعدادات
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', async () => {
            const newName = settingsName?.value.trim();
            if (!newName) return alert('⚠️ الاسم مطلوب');
            try {
                await auth.currentUser.updateProfile({ displayName: newName });
                await db.collection('users').doc(auth.currentUser.uid).update({ displayName: newName });
                if (userDisplay) userDisplay.textContent = newName;
                alert('✅ تم الحفظ');
            } catch (err) { alert('❌ ' + err.message); }
        });
    }

    // 📊 تحميل الإحصائيات
    async function loadDashboardData(email) {
        if (!loginHistory) return;
        loginHistory.innerHTML = '<li>جاري...</li>';
        try {
            const snap = await db.collection('sessions').where('email','==',email).orderBy('timestamp','desc').limit(5).get();
            if (snap.empty) loginHistory.innerHTML = '<li>لا توجد جلسات</li>';
            else {
                let html = ''; let cnt = 0;
                snap.forEach(doc => {
                    const d = doc.data();
                    const t = d.timestamp ? d.timestamp.toDate().toLocaleString('ar-EG') : '';
                    html += `<li>🟢 ${t}</li>`; cnt++;
                });
                loginHistory.innerHTML = html;
                if (sessionCount) sessionCount.textContent = cnt;
            }
        } catch(e) { loginHistory.innerHTML = '<li>فشل التحميل</li>'; }
    }

    // 💬 الدردشة الفورية
    function initChat() {
        if (unsubscribeChat) unsubscribeChat();
        if (messagesList) messagesList.innerHTML = '<p style="text-align:center;color:#888;padding:20px;">جاري التحميل...</p>';
        
        unsubscribeChat = db.collection('messages').orderBy('timestamp','asc').onSnapshot(snapshot => {
            if (!messagesList) return;
            messagesList.innerHTML = '';
            if (snapshot.empty) {
                messagesList.innerHTML = '<p style="text-align:center;color:#888;padding:20px;">كن أول من يكتب!</p>';
            } else {
                snapshot.forEach(doc => {
                    const m = doc.data();
                    const time = m.timestamp ? m.timestamp.toDate().toLocaleTimeString('ar-EG',{hour:'2-digit',minute:'2-digit'}) : '';
                    const isMe = m.senderEmail === currentUser?.email;
                    const div = document.createElement('div');
                    div.className = 'message-item' + (isMe ? ' my-message' : '');
                    div.innerHTML = `<div class="sender">${escapeHtml(m.senderName||'مستخدم')}</div><span class="time">${time}</span><span class="text">${escapeHtml(m.text)}</span>`;
                    messagesList.appendChild(div);
                });
            }
            if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
        });
    }

    // 📤 إرسال رسالة
    if (chatSendBtn) {
        chatSendBtn.addEventListener('click', async () => {
            const text = chatInput?.value.trim();
            if (!text || !currentUser) return;
            chatSendBtn.disabled = true; chatSendBtn.textContent = '...';
            try {
                await db.collection('messages').add({
                    text,
                    senderName: currentUser.displayName || currentUser.email.split('@')[0],
                    senderEmail: currentUser.email,
                    userId: currentUser.uid,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
                if (chatInput) chatInput.value = '';
            } catch(err) { alert('❌ فشل الإرسال'); }
            finally { chatSendBtn.disabled = false; chatSendBtn.textContent = 'إرسال'; }
        });
        if (chatInput) {
            chatInput.addEventListener('keypress', e => {
                if (e.key === 'Enter' && !chatSendBtn.disabled) chatSendBtn.click();
            });
        }
    }

    // 🛡️ حماية XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(text));
        return div.innerHTML;
    }

    // 🌍 ترجمة الأخطاء
    function translateFirebaseError(code) {
        const map = {
            'auth/invalid-credential': 'البريد أو كلمة المرور غير صحيحة',
            'auth/email-already-in-use': 'البريد مسجل مسبقاً',
            'auth/invalid-email': 'صيغة البريد غير صحيحة',
            'auth/user-not-found': 'البريد غير مسجل',
            'auth/wrong-password': 'كلمة المرور غير صحيحة',
            'auth/weak-password': 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
        };
        return map[code] || code;
    }
});
