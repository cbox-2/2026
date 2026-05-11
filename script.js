document.addEventListener('DOMContentLoaded', function() {
    //// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD_UssZllzECYbTMR_0NCTzEGAIMeZAcos",
  authDomain: "cbox22026.firebaseapp.com",
  projectId: "cbox22026",
  storageBucket: "cbox22026.firebasestorage.app",
  messagingSenderId: "175894881657",
  appId: "1:175894881657:web:ae5e693d843ee594eb7ba8",
  measurementId: "G-0BP0P4KWL8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
    const firebaseConfig = {
        apiKey: "ضع_API_KEY_هنا",
        authDomain: "مشروعك.firebaseapp.com",
        projectId: "مشروعك",
        storageBucket: "مشروعك.appspot.com",
        messagingSenderId: "رقم_المرسل",
        appId: "رقم_التطبيق"
    };

    // تهيئة الخدمات
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();

    // 🖥️ عناصر الواجهة
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

    // 🔁 مراقبة حالة المصادقة (يعمل تلقائياً عند فتح الصفحة أو بعد الدخول)
    auth.onAuthStateChanged(user => {
        if (user) {
            // ✅ مستخدم مسجل دخوله
            loginSection.style.display = 'none';
            dashboardSection.style.display = 'block';
            userDisplay.textContent = user.email.split('@')[0];
            errorBar.textContent = 'متصل بـ Firebase ✅';
            loadDashboardData(user.email);
        } else {
            // ❌ غير مسجل
            loginSection.style.display = 'block';
            dashboardSection.style.display = 'none';
            mainNotice.textContent = 'يرجى تسجيل الدخول أدناه للوصول إلى هذه الصفحة.';
            errorBar.textContent = 'جاهز...';
            emailInput.value = '';
            passInput.value = '';
        }
    });

    // 📝 تبديل بين الدخول وإنشاء الحساب
    toggleAuth.addEventListener('click', e => {
        e.preventDefault();
        isLoginMode = !isLoginMode;
        formTitle.textContent = isLoginMode ? 'تسجيل الدخول' : 'إنشاء حساب جديد';
        authBtn.value = isLoginMode ? 'تسجيل الدخول' : 'إنشاء الحساب';
        toggleText.innerHTML = isLoginMode 
            ? 'ليس لديك حساب؟ <a href="#" id="toggle-auth">إنشاء حساب جديد</a>'
            : 'لديك حساب بالفعل؟ <a href="#" id="toggle-auth">تسجيل الدخول</a>';
        // إعادة ربط الحدث بعد تعديل الـ HTML
        document.getElementById('toggle-auth').addEventListener('click', arguments.callee);
    });

    // 🔐 معالجة الإرسال (دخول أو تسجيل)
    authForm.addEventListener('submit', async e => {
        e.preventDefault();
        const email = emailInput.value.trim();
        const pass = passInput.value.trim();
        
        if (!email || !pass) return alert('⚠️ يرجى ملء جميع الحقول.');

        authBtn.disabled = true;
        authBtn.value = 'جاري المعالجة...';
        errorBar.textContent = 'جاري الاتصال بـ Firebase...';

        try {
            if (isLoginMode) {
                await auth.signInWithEmailAndPassword(email, pass);
                errorBar.textContent = 'تم الدخول بنجاح ✅';
            } else {
                await auth.createUserWithEmailAndPassword(email, pass);
                // حفظ بيانات المستخدم في Firestore
                await db.collection('users').doc(auth.currentUser.uid).set({
                    email: email,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    loginCount: 1
                });
                errorBar.textContent = 'تم إنشاء الحساب وتسجيل الدخول ✅';
            }
            // تسجيل جلسة في Firestore
            await db.collection('sessions').add({
                userId: auth.currentUser.uid,
                email: email,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            alert('❌ ' + translateFirebaseError(error.code));
            errorBar.textContent = 'حدث خطأ';
        } finally {
            authBtn.disabled = false;
            authBtn.value = isLoginMode ? 'تسجيل الدخول' : 'إنشاء الحساب';
        }
    });

    // 🚪 تسجيل الخروج
    logoutBtn.addEventListener('click', () => auth.signOut());

    // 📊 تحميل بيانات اللوحة من Firestore
    async function loadDashboardData(email) {
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
                sessionCount.textContent = count;
                lastLogin.textContent = snap.docs[0].data().timestamp.toDate().toLocaleString('ar-EG');
            }
        } catch (e) {
            loginHistory.innerHTML = '<li>فشل تحميل البيانات</li>';
        }
    }

    // 🌍 ترجمة أخطاء Firebase للعربية
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
