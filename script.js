console.log("🚀 النظام يبدأ...");

// دالة مساعدة آمنة
const $ = (id) => {
    const el = document.getElementById(id);
    if (!el) console.warn("⚠️ عنصر غير موجود:", id);
    return el;
};

// 🧭 التنقل بين الأقسام
window.show = function(sec) {
    console.log("🔀 الانتقال إلى:", sec);
    try {
        // إخفاء كل الأقسام
        ['login','dashboard','publish','mailbox','settings','subpage'].forEach(s => {
            const e = $(s);
            if (e) e.style.display = 'none';
        });
        // إظهار القسم المطلوب
        const t = $(sec);
        if (t) {
            t.style.display = 'block';
            console.log("✅ عرض:", sec);
        } else {
            console.error("❌ القسم غير موجود:", sec);
        }
        // إغلاق القوائم
        closeDrops();
    } catch(err) {
        console.error("❌ خطأ في show():", err);
        alert("حدث خطأ في التنقل. افتح F12 ← Console للتفاصيل");
    }
};

// 📋 الصفحات الفرعية
window.sub = function(pg) {
    console.log("📄 صفحة فرعية:", pg);
    show('subpage');
    const c = $('subpage');
    if (!c) return;
    
    const pages = {
        'style': '<div><h3>🎨 سمات</h3><p>تخصيص الألوان</p><a onclick="show(\'dashboard\')">← عودة</a></div>',
        'layout': '<div><h3>📐 تخطيط</h3><p>خيارات العرض</p><a onclick="show(\'dashboard\')">← عودة</a></div>',
        'filter': '<div><h3>🔍 تصفية</h3><p>كلمات محظورة</p><a onclick="show(\'dashboard\')">← عودة</a></div>',
        'smilies': '<div><h3>😊 رموز</h3><p>إدارة الابتسامات</p><a onclick="show(\'dashboard\')">← عودة</a></div>',
        'users': '<div><h3>👥 مسجلون</h3><p>قائمة المستخدمين</p><a onclick="show(\'dashboard\')">← عودة</a></div>',
        'bans': '<div><h3>🚫 محظورون</h3><p>قائمة الحظر</p><a onclick="show(\'dashboard\')">← عودة</a></div>',
        'msgs': '<div><h3>📩 رسائل</h3><p>إدارة الرسائل</p><a onclick="show(\'dashboard\')">← عودة</a></div>',
        'archive': '<div><h3>🗄️ أرشيف</h3><p>الرسائل المؤرشفة</p><a onclick="show(\'dashboard\')">← عودة</a></div>'
    };
    
    c.innerHTML = pages[pg] || '<p>غير متاح <a onclick="show(\'dashboard\')">← عودة</a></p>';
};

// 🔐 تسجيل الدخول
window.doLogin = function(e) {
    e.preventDefault();
    console.log("🔐 محاولة الدخول...");
    try {
        const em = $('em')?.value.trim();
        const pw = $('pw')?.value.trim();
        
        if (!em || !pw) {
            alert("⚠️ املأ جميع الحقول");
            return false;
        }
        if (!em.includes('@')) {
            alert("⚠️ أدخل بريد إلكتروني صحيح");
            return false;
        }
        
        // محاكاة الدخول الناجح
        const name = em.split('@')[0];
        if ($('name')) $('name').textContent = name;
        if ($('userDisplay')) $('userDisplay').textContent = em;
        
        show('dashboard');
        alert("✅ مرحباً، " + name + "!");
        console.log("✅ تم الدخول:", em);
        return false;
    } catch(err) {
        console.error("❌ خطأ في doLogin():", err);
        alert("حدث خطأ في تسجيل الدخول");
        return false;
    }
};

// 🚪 تسجيل الخروج
window.logout = function() {
    console.log("🚪 تسجيل الخروج");
    if ($('userDisplay')) $('userDisplay').textContent = 'ضيف';
    show('login');
    alert("✅ تم الخروج");
};

// 💬 إرسال رسالة في الدردشة الكلاسيكية
window.sendChat = function() {
    console.log("💬 إرسال رسالة...");
    try {
        const msg = $('cMsg')?.value.trim();
        if (!msg) {
            alert("⚠️ اكتب رسالة أولاً");
            return;
        }
        
        // محاكاة الإرسال
        const btn = $('cMsg')?.closest('td')?.querySelector('button');
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'جاري...';
        }
        
        setTimeout(() => {
            alert("✅ تم إرسال: " + msg);
            if ($('cMsg')) $('cMsg').value = '';
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'إرسال';
            }
            // تحديث الحالة
            if ($('status')) {
                $('status').textContent = '💬 مرسلة';
                setTimeout(() => { if ($('status')) $('status').textContent = '🟢 متصل'; }, 1500);
            }
        }, 300);
    } catch(err) {
        console.error("❌ خطأ في sendChat():", err);
        alert("فشل إرسال الرسالة");
    }
};

// 🔄 تحديث الدردشة
window.refreshChat = function() {
    console.log("🔄 تحديث الدردشة...");
    try {
        const main = $('chatMain');
        const form = $('chatForm');
        
        if (main) {
            const src = main.src;
            main.src = src; // إعادة التحميل
        }
        if (form) {
            const src = form.src;
            form.src = src;
        }
        
        if ($('status')) {
            $('status').textContent = '🔄 جاري...';
            setTimeout(() => { if ($('status')) $('status').textContent = '🟢 متصل'; }, 1000);
        }
        alert("✅ تم تحديث الدردشة");
    } catch(err) {
        console.error("❌ خطأ في refreshChat():", err);
    }
};

// 😊 الرموز التعبيرية
window.toggleSmilies = function() {
    console.log("😊 تبديل الرموز");
    const p = $('smilies');
    if (p) {
        p.style.display = (p.style.display === 'none' || !p.style.display) ? 'block' : 'none';
    }
};
window.addSmiley = function(em) {
    console.log("😊 إضافة رمز:", em);
    const f = $('cMsg');
    if (f) {
        f.value += ' ' + em + ' ';
        f.focus();
    }
};

// ❓ مساعدة + 👤 ملفي
window.showHelp = function() {
    alert("❓ مساعدة الدردشة:\n• اكتب اسمك ورسالتك ثم اضغط إرسال\n• استخدم زر الرموز لإضافة ابتسامات\n• زر التحديث ينشّط الدردشة");
};
window.showProfile = function() {
    const n = $('cName')?.value.trim() || 'ضيف';
    alert("👤 ملفك:\nالاسم: " + n + "\nالحالة: متصل 🟢");
};

// 🧪 اختبار النظام
window.test = function() {
    console.log("🧪 اختبار النظام");
    const now = new Date().toLocaleTimeString('ar-EG');
    if ($('out')) {
        $('out').innerHTML = "✅ يعمل!<br>⏰ " + now + "<br>👤 " + ($('userDisplay')?.textContent || 'غير معروف');
    }
    alert("✅ الجافاسكربت يعمل!\nالوقت: " + now);
};

// 📋 إدارة القوائم المنسدلة
window.toggle = function(id) {
    console.log("📋 قائمة:", id);
    closeDrops();
    const m = $(id);
    if (m) {
        m.classList.toggle('show');
        console.log("  → " + (m.classList.contains('show') ? 'فتح' : 'إغلاق'));
    }
};
function closeDrops() {
    ['m1','m2','m3','m4'].forEach(id => {
        const m = $(id);
        if (m) m.classList.remove('show');
    });
}

// بدء النظام
document.addEventListener('DOMContentLoaded', function() {
    console.log("✅ DOM جاهز - النظام يبدأ");
    
    // إغلاق القوائم عند النقر خارجها
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.drop') && !e.target.closest('.drop-c')) {
            closeDrops();
        }
    });
    
    // إرسال الرسالة عند ضغط Enter
    const msgInput = $('cMsg');
    if (msgInput) {
        msgInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendChat();
            }
        });
    }
    
    console.log("✅ النظام جاهز تماماً!");
});
