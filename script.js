console.log("✅ النظام يبدأ...");

// عناصر الصفحة
const $ = id => document.getElementById(id);
let isLoggedIn = false;
let isLoginMode = true;

// التنقل بين الأقسام
window.showSection = function(name) {
    console.log("🔀 الانتقال إلى:", name);
    // إخفاء كل الأقسام
    ['login-section', 'dashboard-section', 'publish-section', 'mailbox-section', 'settings-section', 'subpage-section'].forEach(id => {
        const el = $(id);
        if (el) el.style.display = 'none';
    });
    // عرض القسم المطلوب
    const target = $(name);
    if (target) {
        target.style.display = 'block';
        console.log("✅ عرض:", name);
    }
    // إغلاق القائمة المنسدلة
    const menu = $('menuContent');
    if (menu) menu.classList.remove('show');
};

// تبديل وضع تسجيل الدخول/إنشاء حساب
window.toggleMode = function() {
    isLoginMode = !isLoginMode;
    const btn = $('loginBtn');
    const form = $('loginForm');
    if (btn) btn.textContent = isLoginMode ? 'دخول' : 'إنشاء حساب';
    if (form) form.querySelector('legend').textContent = isLoginMode ? 'تسجيل الدخول' : 'إنشاء حساب جديد';
    alert(isLoginMode ? "✓ وضع: تسجيل الدخول" : "✓ وضع: إنشاء حساب");
};

// معالجة تسجيل الدخول
window.handleLogin = function(e) {
    e.preventDefault();
    const email = $('email')?.value.trim();
    const password = $('password')?.value.trim();
    const btn = $('loginBtn');
    
    if (!email || !password) {
        alert("⚠️ يرجى ملء جميع الحقول");
        return;
    }
    if (!email.includes('@')) {
        alert("⚠️ أدخل بريد إلكتروني صحيح");
        return;
    }
    
    // محاكاة تسجيل الدخول
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'جاري...';
    }
    
    setTimeout(() => {
        isLoggedIn = true;
        const name = email.split('@')[0];
        if ($('userName')) $('userName').textContent = name;
        if ($('userEmail')) $('userEmail').textContent = email;
        showSection('dashboard-section');
        alert("✅ تم تسجيل الدخول بنجاح!\nمرحباً، " + name);
        if (btn) {
            btn.disabled = false;
            btn.textContent = isLoginMode ? 'دخول' : 'إنشاء حساب';
        }
        console.log("✅ مستخدم مسجل:", email);
    }, 500);
};

// تسجيل الخروج
window.logout = function() {
    isLoggedIn = false;
    showSection('login-section');
    if ($('userEmail')) $('userEmail').textContent = 'user@example.com';
    alert("✅ تم تسجيل الخروج");
    console.log("🚪 تم تسجيل الخروج");
};

// إرسال رسالة في الدردشة
window.sendMessage = function() {
    const input = $('chatInput');
    const text = input?.value.trim();
    const messages = $('messages');
    
    if (!text || !messages) return;
    
    // إضافة الرسالة
    const div = document.createElement('div');
    div.className = 'message me';
    const time = new Date().toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'});
    div.innerHTML = `<span class="sender">أنت</span><span class="time">${time}</span><span class="text">${text}</span>`;
    messages.appendChild(div);
    
    // مسح الحقل والتمرير للأسفل
    if (input) input.value = '';
    messages.scrollTop = messages.scrollHeight;
    
    // رد تلقائي بعد ثانية
    setTimeout(() => {
        const reply = document.createElement('div');
        reply.className = 'message';
        reply.innerHTML = `<span class="sender">النظام</span><span class="time">${new Date().toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'})}</span><span class="text">تم استلام رسالتك! ✅</span>`;
        messages.appendChild(reply);
        messages.scrollTop = messages.scrollHeight;
    }, 1000);
    
    console.log("💬 رسالة مرسلة:", text);
};

// تبديل كود التضمين
window.switchCode = function() {
    const type = $('codeType')?.value || 'inline';
    const box = $('codeBox');
    if (!box) return;
    
    if (type === 'inline') {
        box.value = '<iframe src="https://example.com/chat" width="400" height="400" frameborder="0"></iframe>';
    } else {
        box.value = '<a href="#" onclick="openChat()">افتح الدردشة المنبثقة</a>\n<script>\nfunction openChat(){window.open("https://example.com/chat","Chat","width=400,height=400");}\n</script>';
    }
    console.log("🔄 تم تبديل الكود إلى:", type);
};

// نسخ الكود
window.copyCode = function() {
    const box = $('codeBox');
    if (!box) return;
    
    box.select();
    box.setSelectionRange(0, 99999); // للجوال
    
    try {
        document.execCommand('copy');
        alert("✅ تم نسخ الكود إلى الحافظة!");
        console.log("📋 تم نسخ الكود");
    } catch (err) {
        alert("اضغط على الكود ثم اضغط Ctrl+C (أو Cmd+C على Mac) للنسخ");
    }
};

// تحديث إحصائيات صندوق البريد
window.refreshStats = function() {
    const views = Math.floor(Math.random() * 5000) + 10000;
    const msgs = Math.floor(Math.random() * 1000) + 2000;
    const percent = Math.min(100, Math.max(10, msgs / 50));
    
    if ($('views')) $('views').textContent = views.toLocaleString('ar-EG');
    if ($('msgs')) $('msgs').textContent = msgs.toLocaleString('ar-EG');
    if ($('progress')) $('progress').style.width = percent + '%';
    
    alert(`✅ تم التحديث!\n👁️ المشاهدات: ${views.toLocaleString('ar-EG')}\n💬 الرسائل: ${msgs.toLocaleString('ar-EG')}`);
    console.log("📊 إحصائيات محدثة:", { views, msgs, percent });
};

// حفظ الإعدادات
window.saveSettings = function() {
    const name = $('displayName')?.value.trim();
    if (!name) {
        alert("⚠️ يرجى إدخال اسم");
        return;
    }
    if ($('userName')) $('userName').textContent = name;
    alert("✅ تم حفظ الاسم: " + name);
    console.log("⚙️ تم حفظ الاسم:", name);
};

// عرض الصفحات الفرعية
window.showSubPage = function(page) {
    showSection('subpage-section');
    const content = $('subpage-section');
    if (!content) return;
    
    const pages = {
        'messages': '<div class="card"><h3>📩 إدارة الرسائل</h3><p>لا توجد رسائل جديدة حالياً.</p><p style="margin-top:10px"><a onclick="showSection(\'dashboard-section\');return false">← العودة</a></p></div>',
        'archive': '<div class="card"><h3>🗄️ الأرشيف</h3><p>الأرشيف فارغ.</p><p style="margin-top:10px"><a onclick="showSection(\'dashboard-section\');return false">← العودة</a></p></div>'
    };
    
    content.innerHTML = pages[page] || '<p>صفحة غير متوفرة</p>';
    console.log("📄 عرض صفحة:", page);
};

// اختبار النظام
window.testJS = function() {
    const now = new Date().toLocaleString('ar-EG');
    const result = $('testResult');
    if (result) {
        result.innerHTML = `✅ النظام يعمل!<br>⏰ ${now}<br>👤 ${isLoggedIn ? $('userEmail')?.textContent : 'غير مسجل'}`;
    }
    alert(`✅ الجافاسكربت يعمل!\nالوقت: ${now}`);
    console.log("🧪 اختبار ناجح - الوقت:", now);
};

// القائمة المنسدلة
document.addEventListener('DOMContentLoaded', function() {
    const menuBtn = $('menuBtn');
    const menuContent = $('menuContent');
    
    if (menuBtn && menuContent) {
        menuBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            menuContent.classList.toggle('show');
            console.log("📋 القائمة:", menuContent.classList.contains('show') ? 'فتحت' : 'أغلقت');
        });
    }
    
    // إغلاق القائمة عند النقر خارجها
    document.addEventListener('click', function(e) {
        if (menuContent?.classList.contains('show') && !menuBtn?.contains(e.target) && !menuContent.contains(e.target)) {
            menuContent.classList.remove('show');
        }
    });
    
    console.log("✅ النظام جاهز تماماً!");
});
