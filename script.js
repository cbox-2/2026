document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const userEmailDisplay = document.getElementById('user-email-display');
    const logoutBtn = document.getElementById('logout-btn');
    const mask = document.getElementById('mask');
    const errorBar = document.getElementById('siteErrorBarCont');

    // 1. التحقق من وجود جلسة محفوظة
    if (localStorage.getItem('cbox_logged_in') === 'true') {
        showDashboard(localStorage.getItem('cbox_user') || 'مستخدم');
    }

    // 2. معالجة نموذج الدخول
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault(); // منع إعادة تحميل الصفحة
            
            const email = this.elements['uname'].value.trim();
            const password = this.elements['pword'].value.trim();

            if (!email || !password) {
                alert('⚠️ يرجى ملء جميع الحقول.');
                return;
            }

            // محاكاة تأخير الخادم
            mask.style.display = 'block';
            errorBar.textContent = 'جاري التحقق...';
            
            setTimeout(() => {
                mask.style.display = 'none';
                errorBar.textContent = 'تحميل...';
                
                // حفظ الجلسة (تجريبي)
                localStorage.setItem('cbox_logged_in', 'true');
                localStorage.setItem('cbox_user', email);
                
                showDashboard(email);
            }, 800);
        });
    }

    // 3. تسجيل الخروج
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('cbox_logged_in');
            localStorage.removeItem('cbox_user');
            loginSection.style.display = 'block';
            dashboardSection.style.display = 'none';
            document.querySelector('.notice').textContent = 'يرجى تسجيل الدخول أدناه للوصول إلى هذه الصفحة.';
        });
    }

    // دالة عرض اللوحة
    function showDashboard(email) {
        loginSection.style.display = 'none';
        dashboardSection.style.display = 'block';
        userEmailDisplay.textContent = email.split('@')[0] || email;
        document.querySelector('#main .notice').textContent = '✅ تم تسجيل الدخول بنجاح. مرحباً بك في لوحة التحكم.';
    }
});
