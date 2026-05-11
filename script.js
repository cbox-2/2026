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
    const authForm = document.getElementById('auth-form');
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
    const settingsForm = document.getElementById('settings-form');
    const settingsName = document.getElementById('settings-name');
    const saveSettingsBtn = document.getElementById('save-settings-btn');

    let isLoginMode = true;

    // 🔁 مراقبة حالة المصادقة + حماية الصفحات
    auth.onAuthStateChanged(user => {
        if (user) {
            loginSection.style.display = 'none';
            dashboardSection.style.display = 'block';
            settingsSection.style.display = 'none';
            navLogout.style.display = 'inline-block';
            
            // عرض الاسم من Firebase أو من Firestore
            userDisplay.textContent = user.displayName || user.email.split('@')[0];
            settingsName.value = user.displayName || '';
            
            errorBar.textContent = 'متصل بـ Firebase ✅';
            loadDashboardData(user.email);
        } else {
            loginSection.style.display = 'block';
            dashboardSection.style.display = 'none';
            settingsSection.style.display = 'none';
            navLogout.style.display = 'none';
            
            if (mainNotice) mainNotice.textContent = 'يرجى تسجيل الدخول أدناه للوصول إلى هذه الصفحة.';
            errorBar.textContent = 'جاهز...';
            if (emailInput) emailInput.value = '';
            if (passInput) passInput.value = '';
        }
    });

    // 📝 تبديل بين الدخول وإنشاء الحساب
    if (toggleAuth) {
        toggleAuth.addEventListener('click', e => {
            e.preventDefault();
            isLoginMode = !isLoginMode;
            formTitle.textContent = isLoginMode ? 'تسجيل الدخول' : 'إنشاء حساب جديد';
            authBtn.value = isLoginMode ? 'تسجيل الدخول' : 'إنشاء الحساب';
            toggleText.innerHTML = isLoginMode 
                ? 'ليس لديك حساب؟ <a href="#" id="toggle-auth">إنشاء حساب جديد</a>'
                : 'لديك حساب بالفعل؟ <a href="#" id="toggle-auth">تسجيل الدخول</a>';
            document.getElementById('toggle-auth').onclick = arguments.callee;
        });
    }
// 🔐 معالجة الدخول/التسجيل (زر عادي لا يرسل النموذج)
const authBtn = document.getElementById('auth-btn');
if (authBtn) {
    authBtn.addEventListener('click', async function(e) {
        e.preventDefault(); // حاجز إضافي للأمان
        const email = document.getElementById('email-input').value.trim();
        const pass = document.getElementById('pass-input').value.trim();
        
        if (!email || !pass) return alert('⚠️ يرجى ملء جميع الحقول.');

        authBtn.disabled = true; 
        authBtn.textContent = 'جاري المعالجة...';
        document.getElementById('siteErrorBarCont').textContent = 'جاري الاتصال بـ Firebase...';

        try {
            if (isLoginMode) {
                await auth.signInWithEmailAndPassword(email, pass);
                document.getElementById('siteErrorBarCont').textContent = 'تم الدخول بنجاح ✅';
            } else {
                await auth.createUserWithEmailAndPassword(email, pass);
                await db.collection('users').doc(auth.currentUser.uid).set({
                    email: email,
                    displayName: email.split('@')[0],
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                document.getElementById('siteErrorBarCont').textContent = 'تم إنشاء الحساب وتسجيل الدخول ✅';
            }
            // تسجيل الجلسة
            await db.collection('sessions').add({
                userId: auth.currentUser.uid,
                email: email,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (err) {
            alert('❌ ' + translateFirebaseError(err.code));
            document.getElementById('siteErrorBarCont').textContent = 'حدث خطأ';
        } finally {
            authBtn.disabled = false;
            authBtn.textContent = isLoginMode ? 'تسجيل الدخول' : 'إنشاء حساب';
        }
    });
}
                await db.collection('sessions').add({
                    userId: auth.currentUser.uid,
                    email: email,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
            } catch (err) {
                alert('❌ ' + translateFirebaseError(err.code));
                errorBar.textContent = 'حدث خطأ';
            } finally {
                authBtn.disabled = false;
                authBtn.value = isLoginMode ? 'تسجيل الدخول' : 'إنشاء الحساب';
            }
        });
    }

    // 🔗 نسيت كلمة المرور
    if (resetLink) {
        resetLink.addEventListener('click', async e => {
            e.preventDefault();
            const email = prompt('أدخل بريدك الإلكتروني لاستعادة كلمة المرور:');
            if (!email) return;
            try {
                await auth.sendPasswordResetEmail(email);
                alert('✅ تم إرسال رابط استعادة كلمة المرور إلى بريدك. تحقق من صندوق الوارد أو البريد العشوائي.');
            } catch (err) {
                alert('❌ ' + translateFirebaseError(err.code));
            }
        });
    }

    // 🚪 تسجيل الخروج
    const handleLogout = () => auth.signOut();
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (navLogout) navLogout.addEventListener('click', handleLogout);

    // ⚙️ التنقل بين الأقسام
    if (navSettings) {
        navSettings.addEventListener('click', e => {
            e.preventDefault();
            dashboardSection.style.display = 'none';
            settingsSection.style.display = 'block';
        });
    }
    if (backToDash) {
        backToDash.addEventListener('click', e => {
            e.preventDefault();
            settingsSection.style.display = 'none';
            dashboardSection.style.display = 'block';
        });
    }

    // 💾 حفظ الإعدادات
    if (settingsForm) {
        settingsForm.addEventListener('submit', async e => {
            e.preventDefault();
            const newName = settingsName.value.trim();
            if (!newName) return alert('⚠️ الاسم لا يمكن أن يكون فارغاً.');
            
            saveSettingsBtn.disabled = true; saveSettingsBtn.value = 'جاري الحفظ...';
            try {
                await auth.currentUser.updateProfile({ displayName: newName });
                await db.collection('users').doc(auth.currentUser.uid).update({ displayName: newName });
                userDisplay.textContent = newName;
                alert('✅ تم حفظ التغييرات بنجاح!');
            } catch (err) {
                alert('❌ فشل الحفظ: ' + err.message);
            } finally {
                saveSettingsBtn.disabled = false; saveSettingsBtn.value = 'حفظ التغييرات';
            }
        });
    }

    // 📊 تحميل بيانات اللوحة
    async function loadDashboardData(email) {
        if (!loginHistory) return;
        loginHistory.innerHTML = '<li>جاري التحميل...</li>';
        try {
            const snap = await db.collection('sessions')
                .where('email', '==', email)
                .orderBy('timestamp', 'desc')
                .limit(5)
                .get();
            
            if (snap.empty) {
                loginHistory.innerHTML = '<li>لا توجد جلسات سابقة</li>';
            } else {
                let html = ''; let count = 0;
                snap.forEach(doc => {
                    const d = doc.data();
                    const t = d.timestamp ? d.timestamp.toDate().toLocaleString('ar-EG') : 'غير معروف';
                    html += `<li>🟢 دخول في: ${t}</li>`;
                    count++;
                });
                loginHistory.innerHTML = html;
                if (sessionCount) sessionCount.textContent = count;
                if (lastLogin && snap.docs[0]) {
                    lastLogin.textContent = snap.docs[0].data().timestamp.toDate().toLocaleString('ar-EG');
                }
            }
        } catch (e) {
            loginHistory.innerHTML = '<li>فشل تحميل البيانات</li>';
        }
    }

    // 🌍 ترجمة أخطاء Firebase
    function translateFirebaseError(code) {
        const map = {
            'auth/email-already-in-use': 'البريد مسجل مسبقاً',
            'auth/invalid-email': 'صيغة البريد غير صحيحة',
            'auth/user-not-found': 'البريد غير مسجل',
            'auth/wrong-password': 'كلمة المرور غير صحيحة',
            'auth/weak-password': 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
            'auth/too-many-requests': 'محاولات كثيرة، انتظر قليلاً',
            'auth/user-disabled': 'تم تعطيل هذا الحساب',
            'auth/missing-email': 'يرجى إدخال البريد الإلكتروني'
        };
        return map[code] || 'خطأ غير متوقع: ' + code;
    }
});
