document.addEventListener('DOMContentLoaded', function() {
    // 🔑 إعدادات Firebase - تأكد أنها مطابقة لمشروعك
    const firebaseConfig = {
        apiKey: "AIzaSyD_UssZllzECYbTMR_0NCTzEGAIMeZAcos",
        authDomain: "cbox22026.firebaseapp.com",
        projectId: "cbox22026",
        storageBucket: "cbox22026.firebasestorage.app",
        messagingSenderId: "175894881657",
        appId: "1:175894881657:web:ae5e693d843ee594eb7ba8",
        measurementId: "G-0BP0P4KWL8"
    };

    // تهيئة الخدمات (Compat - تعمل مباشرة في المتصفح)
    firebase.initializeApp(firebaseConfig);
   // في ملف script.js
firebase.initializeApp(firebaseConfig);

// ضبط إعدادات المصادقة
firebase.auth().settings.appVerificationDisabledForTesting = false; // افتراضي

// لضمان عمل الكوكيز في جميع البيئات (اختياري)
firebase.auth().useEmulator('http://localhost:9099'); // فقط للتطوير المحلي
    const auth = firebase.auth();
    const db = firebase.firestore();

    // 🖥️ تعريف عناصر الواجهة
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const authForm = document.getElementById('auth-form');
    const emailInput = document.getElementById('email-input');
    const passInput = document.getElementById('pass-input');
    const authBtn = document.getElementById('auth-btn');
    const formTitle = document.getElementById('form-title');
    const toggleText = document.getElementById('toggle-text');
    const toggleAuth = document.getElementById('toggle-auth');
    const userDisplay = document.getElementById('user-email-display');
    const logoutBtn = document.getElementById('logout-btn');
    const mainNotice = document.getElementById('main-notice');
    const errorBar = document.getElementById('siteErrorBarCont');
    const loginHistory = document.getElementById('login-history');
    const sessionCount = document.getElementById('session-count');
    const lastLogin = document.getElementById('last-login');

    let isLoginMode = true;

    // 🔁 مراقبة حالة المصادقة
    auth.onAuthStateChanged(user => {
        if (user) {
            loginSection.style.display = 'none';
            dashboardSection.style.display = 'block';
            userDisplay.textContent = user.email.split('@')[0] || 'مستخدم';
            errorBar.textContent = 'متصل بـ Firebase ✅';
            loadDashboardData(user.email);
        } else {
            loginSection.style.display = 'block';
            dashboardSection.style.display = 'none';
            if (mainNotice) mainNotice.textContent = 'يرجى تسجيل الدخول أدناه للوصول إلى هذه الصفحة.';
            errorBar.textContent = 'جاهز...';
            if (emailInput) emailInput.value = '';
            if (passInput) passInput.value = '';
        }
    });

    // 📝 تبديل بين الدخول وإنشاء الحساب
    if (toggleAuth) {
        toggleAuth.addEventListener('click', function(e) {
            e.preventDefault();
            isLoginMode = !isLoginMode;
            if (formTitle) formTitle.textContent = isLoginMode ? 'تسجيل الدخول' : 'إنشاء حساب جديد';
            if (authBtn) authBtn.value = isLoginMode ? 'تسجيل الدخول' : 'إنشاء الحساب';
            if (toggleText) {
                toggleText.innerHTML = isLoginMode 
                    ? 'ليس لديك حساب؟ <a href="#" id="toggle-auth">إنشاء حساب جديد</a>'
                    : 'لديك حساب بالفعل؟ <a href="#" id="toggle-auth">تسجيل الدخول</a>';
                // إعادة ربط الحدث
                document.getElementById('toggle-auth').onclick = this.onclick;
            }
        });
    }

    // 🔐 معالجة الإرسال
    if (authForm) {
        authForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = emailInput ? emailInput.value.trim() : '';
            const pass = passInput ? passInput.value.trim() : '';
            
            if (!email || !pass) return alert('⚠️ يرجى ملء جميع الحقول.');

            if (authBtn) {
                authBtn.disabled = true;
                authBtn.value = 'جاري المعالجة...';
            }
            if (errorBar) errorBar.textContent = 'جاري الاتصال بـ Firebase...';

            try {
                if (isLoginMode) {
                    await auth.signInWithEmailAndPassword(email, pass);
                    if (errorBar) errorBar.textContent = 'تم الدخول بنجاح ✅';
                } else {
                    await auth.createUserWithEmailAndPassword(email, pass);
                    if (db) {
                        await db.collection('users').doc(auth.currentUser.uid).set({
                            email: email,
                            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                            loginCount: 1
                        });
                    }
                    if (errorBar) errorBar.textContent = 'تم إنشاء الحساب وتسجيل الدخول ✅';
                }
                // تسجيل جلسة
                if (db && auth.currentUser) {
                    await db.collection('sessions').add({
                        userId: auth.currentUser.uid,
                        email: email,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
            } catch (error) {
                alert('❌ ' + translateFirebaseError(error.code));
                if (errorBar) errorBar.textContent = 'حدث خطأ';
            } finally {
                if (authBtn) {
                    authBtn.disabled = false;
                    authBtn.value = isLoginMode ? 'تسجيل الدخول' : 'إنشاء الحساب';
                }
            }
        });
    }

    // 🚪 تسجيل الخروج
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => auth.signOut());
    }

    // 📊 تحميل بيانات اللوحة
    async function loadDashboardData(email) {
        if (!loginHistory || !db) return;
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
                let html = '';
                let count = 0;
                snap.forEach(doc => {
                    const data = doc.data();
                    const time = data.timestamp ? data.timestamp.toDate().toLocaleString('ar-EG') : 'غير معروف';
                    html += `<li>🟢 دخول في: ${time}</li>`;
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
        const errors = {
            'auth/email-already-in-use': 'البريد مسجل مسبقاً',
            'auth/invalid-email': 'صيغة البريد غير صحيحة',
            'auth/user-not-found': 'البريد غير مسجل',
            'auth/wrong-password': 'كلمة المرور غير صحيحة',
            'auth/weak-password': 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
            'auth/too-many-requests': 'محاولات كثيرة، انتظر قليلاً'
        };
        return errors[code] || 'خطأ غير متوقع: ' + code;
    }
});
