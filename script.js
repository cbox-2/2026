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

    // 🖥️ عناصر الواجهة
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const settingsSection = document.getElementById('settings-section');
    const emailInput = document.getElementById('email-input');
    const passInput = document.getElementById('pass-input');
    const authBtn = document.getElementById('auth-btn');
    const formTitle = document.getElementById('form-title');
    const toggleText = document.getElementById('toggle-text');
    const toggleAuth = document.getElementById('toggle-auth');
    const resetLink = document.getElementById('reset-link');
    const userDisplay = document.getElementById('user-name-display');
    const logoutBtn = document.getElementById('logout-btn');
    const navLogout = document.getElementById('nav-logout');
    const navSettings = document.getElementById('nav-settings');
    const backToDash = document.getElementById('back-to-dashboard');
    const mainNotice = document.getElementById('main-notice');
    const errorBar = document.getElementById('siteErrorBarCont');
    const loginHistory = document.getElementById('login-history');
    const sessionCount = document.getElementById('session-count');
    const lastLogin = document.getElementById('last-login');
    const settingsName = document.getElementById('settings-name');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const qLoginBtn = document.getElementById('q-login-btn');
    
    // عناصر الدردشة
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send-btn');
    const messagesList = document.getElementById('messages-list');
    const chatContainer = document.getElementById('chat-container');
    let currentUser = null;
    let unsubscribeChat = null;

    let isLoginMode = true;

    // 🔁 مراقبة حالة المصادقة + حماية الأقسام
    auth.onAuthStateChanged(user => {
        currentUser = user;
        if (user) {
            loginSection.style.display = 'none';
            dashboardSection.style.display = 'block';
            settingsSection.style.display = 'none';
            navLogout.style.display = 'inline-block';
            
            // تفعيل حقل الدردشة
            chatInput.disabled = false;
            chatSendBtn.disabled = false;
            
            userDisplay.textContent = user.displayName || user.email.split('@')[0];
            settingsName.value = user.displayName || '';
            
            errorBar.textContent = 'متصل بـ Firebase ✅';
            loadDashboardData(user.email);
            initChat(); // تشغيل الدردشة
        } else {
            loginSection.style.display = 'block';
            dashboardSection.style.display = 'none';
            settingsSection.style.display = 'none';
            navLogout.style.display = 'none';
            
            // تعطيل الدردشة
            chatInput.disabled = true;
            chatSendBtn.disabled = true;
            if (unsubscribeChat) unsubscribeChat(); // إيقاف المستمع
            
            if (mainNotice) mainNotice.textContent = 'يرجى تسجيل الدخول أدناه للوصول إلى هذه الصفحة.';
            errorBar.textContent = 'جاهز...';
            if (emailInput) emailInput.value = '';
            if (passInput) passInput.value = '';
            messagesList.innerHTML = '<p class="loading-msg">سجّل الدخول لرؤية الرسائل</p>';
        }
    });

    // 📝 تبديل بين الدخول وإنشاء الحساب
    if (toggleAuth) {
        toggleAuth.addEventListener('click', e => {
            e.preventDefault();
            isLoginMode = !isLoginMode;
            formTitle.textContent = isLoginMode ? 'تسجيل الدخول' : 'إنشاء حساب جديد';
            authBtn.textContent = isLoginMode ? 'تسجيل الدخول' : 'إنشاء حساب';
            toggleText.innerHTML = isLoginMode 
                ? 'ليس لديك حساب؟ <a href="#" id="toggle-auth">إنشاء حساب جديد</a>'
                : 'لديك حساب بالفعل؟ <a href="#" id="toggle-auth">تسجيل الدخول</a>';
            document.getElementById('toggle-auth').onclick = arguments.callee;
        });
    }

    // 🔐 زر الدخول / التسجيل الرئيسي
    if (authBtn) {
        authBtn.addEventListener('click', async e => {
            e.preventDefault(); e.stopPropagation();
            const email = emailInput ? emailInput.value.trim() : '';
            const pass = passInput ? passInput.value.trim() : '';
            
            if (!email.includes('@')) { alert('⚠️ Firebase يتطلب بريد إلكتروني صحيح.'); return; }
            if (!email || !pass) return alert('⚠️ يرجى ملء جميع الحقول.');

            authBtn.disabled = true; authBtn.textContent = 'جاري المعالجة...';
            errorBar.textContent = 'جاري الاتصال بـ Firebase...';

            try {
                if (isLoginMode) {
                    await auth.signInWithEmailAndPassword(email, pass);
                    errorBar.textContent = 'تم الدخول بنجاح ✅';
                } else {
                    await auth.createUserWithEmailAndPassword(email, pass);
                    await db.collection('users').doc(auth.currentUser.uid).set({
                        email: email, displayName: email.split('@')[0],
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    errorBar.textContent = 'تم إنشاء الحساب وتسجيل الدخول ✅';
                }
                await db.collection('sessions').add({ userId: auth.currentUser.uid, email: email, timestamp: firebase.firestore.FieldValue.serverTimestamp() });
            } catch (err) {
                alert('❌ ' + translateFirebaseError(err.code));
                errorBar.textContent = 'حدث خطأ';
            } finally {
                authBtn.disabled = false;
                authBtn.textContent = isLoginMode ? 'تسجيل الدخول' : 'إنشاء حساب';
            }
        });
    }

    // 🔑 تسجيل الدخول السريع من الهيدر
    if (qLoginBtn) {
        qLoginBtn.addEventListener('click', async () => {
            const qEmail = document.getElementById('q-email').value.trim();
            const qPass = document.getElementById('q-pass').value.trim();
            if (!qEmail || !qPass) return alert('⚠️ يرجى ملء حقول الهيدر');
            try { await auth.signInWithEmailAndPassword(qEmail, qPass); errorBar.textContent = 'تم الدخول عبر الهيدر ✅'; } 
            catch (err) { alert('❌ ' + translateFirebaseError(err.code)); }
        });
    }

    // 🔗 نسيت كلمة المرور
    if (resetLink) {
        resetLink.addEventListener('click', async e => {
            e.preventDefault();
            const email = prompt('أدخل بريدك الإلكتروني لاستعادة كلمة المرور:');
            if (!email) return;
            try { await auth.sendPasswordResetEmail(email); alert('✅ تم إرسال رابط استعادة كلمة المرور.'); } 
            catch (err) { alert('❌ ' + translateFirebaseError(err.code)); }
        });
    }

    // 🚪 تسجيل الخروج
    const handleLogout = () => auth.signOut();
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (navLogout) navLogout.addEventListener('click', handleLogout);

    // ⚙️ التنقل بين الأقسام
    if (navSettings) navSettings.addEventListener('click', e => { e.preventDefault(); dashboardSection.style.display='none'; settingsSection.style.display='block'; });
    if (backToDash) backToDash.addEventListener('click', e => { e.preventDefault(); settingsSection.style.display='none'; dashboardSection.style.display='block'; });
    if (document.getElementById('nav-home')) document.getElementById('nav-home').addEventListener('click', e => { e.preventDefault(); settingsSection.style.display='none'; dashboardSection.style.display='block'; });

    // 💾 حفظ الإعدادات
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', async e => {
            e.preventDefault();
            const newName = settingsName.value.trim();
            if (!newName) return alert('⚠️ الاسم لا يمكن أن يكون فارغاً.');
            saveSettingsBtn.disabled = true; saveSettingsBtn.textContent = 'جاري الحفظ...';
            try {
                await auth.currentUser.updateProfile({ displayName: newName });
                await db.collection('users').doc(auth.currentUser.uid).update({ displayName: newName });
                userDisplay.textContent = newName; alert('✅ تم حفظ التغييرات بنجاح!');
            } catch (err) { alert('❌ فشل الحفظ: ' + err.message); } 
            finally { saveSettingsBtn.disabled = false; saveSettingsBtn.textContent = 'حفظ التغييرات'; }
        });
    }

    // 📊 تحميل بيانات اللوحة
    async function loadDashboardData(email) {
        if (!loginHistory) return;
        loginHistory.innerHTML = '<li>جاري التحميل...</li>';
        try {
            const snap = await db.collection('sessions').where('email', '==', email).orderBy('timestamp', 'desc').limit(5).get();
            if (snap.empty) loginHistory.innerHTML = '<li>لا توجد جلسات سابقة</li>';
            else {
                let html = ''; let count = 0;
                snap.forEach(doc => {
                    const d = doc.data(); const t = d.timestamp ? d.timestamp.toDate().toLocaleString('ar-EG') : 'غير معروف';
                    html += `<li>🟢 دخول في: ${t}</li>`; count++;
                });
                loginHistory.innerHTML = html;
                if (sessionCount) sessionCount.textContent = count;
                if (lastLogin && snap.docs[0]) lastLogin.textContent = snap.docs[0].data().timestamp.toDate().toLocaleString('ar-EG');
            }
        } catch (e) { loginHistory.innerHTML = '<li>فشل تحميل البيانات</li>'; }
    }

    // 💬 بدء الدردشة الفورية
    function initChat() {
        if (unsubscribeChat) unsubscribeChat(); // إيقاف أي مستمع سابق
        messagesList.innerHTML = '<p class="loading-msg">جاري تحميل الرسائل...</p>';

        unsubscribeChat = db.collection('messages').orderBy('timestamp', 'asc').onSnapshot(snapshot => {
            messagesList.innerHTML = '';
            if (snapshot.empty) {
                messagesList.innerHTML = '<p style="text-align:center; color:#888; padding:20px;">لا توجد رسائل بعد. كن أول من يكتب!</p>';
            } else {
                snapshot.forEach(doc => {
                    const msg = doc.data();
                    const time = msg.timestamp ? msg.timestamp.toDate().toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'}) : '';
                    const isMe = msg.senderEmail === currentUser?.email;
                    const div = document.createElement('div');
                    div.className = 'message-item' + (isMe ? ' my-message' : '');
                    div.innerHTML = `
                        <div class="sender">${msg.senderName || 'مستخدم'}</div>
                        <span class="time">${time}</span>
                        <span class="text">${escapeHtml(msg.text)}</span>
                    `;
                    messagesList.appendChild(div);
                });
            }
            // تمرير تلقائي للأسفل
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }, err => {
            console.error("Chat Error:", err);
            messagesList.innerHTML = '<p style="color:#c00; text-align:center;">فشل تحميل الرسائل. تأكد من اتصال الإنترنت.</p>';
        });
    }

    // 📤 إرسال رسالة
    if (chatSendBtn) {
        chatSendBtn.addEventListener('click', async () => {
            const text = chatInput.value.trim();
            if (!text || !currentUser) return;
            
            chatSendBtn.disabled = true; chatSendBtn.textContent = '...';
            try {
                await db.collection('messages').add({
                    text: text,
                    senderName: currentUser.displayName || currentUser.email.split('@')[0],
                    senderEmail: currentUser.email,
                    userId: currentUser.uid,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
                chatInput.value = '';
            } catch (err) {
                alert('❌ فشل إرسال الرسالة');
            } finally {
                chatSendBtn.disabled = false; chatSendBtn.textContent = 'إرسال';
            }
        });

        // إرسال بـ Enter
        chatInput.addEventListener('keypress', e => {
            if (e.key === 'Enter' && !chatSendBtn.disabled) chatSendBtn.click();
        });
    }

    // 🛡️ حماية من XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(text));
        return div.innerHTML;
    }

    // 🌍 ترجمة أخطاء Firebase
    function translateFirebaseError(code) {
        const map = {
            'auth/email-already-in-use': 'البريد مسجل مسبقاً', 'auth/invalid-email': 'صيغة البريد غير صحيحة',
            'auth/user-not-found': 'البريد غير مسجل', 'auth/wrong-password': 'كلمة المرور غير صحيحة',
            'auth/weak-password': 'كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'auth/too-many-requests': 'محاولات كثيرة، انتظر قليلاً',
            'auth/user-disabled': 'تم تعطيل هذا الحساب', 'auth/missing-email': 'يرجى إدخال البريد الإلكتروني',
            'auth/invalid-credential': 'البريد أو كلمة المرور غير صحيحة، أو الحساب غير مسجل.'
        };
        return map[code] || 'خطأ: ' + code;
    }
});
