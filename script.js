console.log("🚀 واجهة الدردشة الكلاسيكية تبدأ...");

// دالة مساعدة للوصول للعناصر
const $ = id => document.getElementById(id);

// 🏠 العودة للرئيسية
window.goHome = function() {
    // هنا يمكن إعادة التوجيه للوحة التحكم الرئيسية
    alert("🏠 العودة للوحة التحكم");
    // مثال: window.location.href = '/2026/';
};

// 🚪 تسجيل الخروج
window.logout = function() {
    if(confirm("هل تريد تسجيل الخروج؟")) {
        alert("✅ تم تسجيل الخروج");
        // مثال: window.location.href = '/2026/?logout=1';
    }
};

// 🔄 تحديث الدردشة
window.refreshChat = function() {
    const mainFrame = $('chatmain');
    const formFrame = $('chatform');
    
    if(mainFrame) {
        // إعادة تحميل الإطار الرئيسي
        const src = mainFrame.src;
        mainFrame.src = src;
    }
    if(formFrame) {
        const src = formFrame.src;
        formFrame.src = src;
    }
    
    // تحديث مؤشر الحالة
    const indicator = $('chanBar');
    if(indicator) {
        indicator.textContent = '🔄 جاري التحديث...';
        setTimeout(() => { indicator.textContent = '🟢 متصل'; }, 1000);
    }
    
    console.log("🔄 تم تحديث الدردشة");
};

// 💬 إرسال رسالة (نموذج كلاسيكي)
window.sendClassicChat = function() {
    const name = $('chatName')?.value.trim();
    const email = $('chatEmail')?.value.trim();
    const message = $('chatMsg')?.value.trim();
    
    if(!message) {
        alert("⚠️ اكتب رسالة أولاً");
        return;
    }
    
    // محاكاة الإرسال (يمكن ربطها بـ Firebase لاحقاً)
    const btn = $('btnSend');
    if(btn) {
        btn.disabled = true;
        btn.value = 'جاري...';
    }
    
    // إضافة الرسالة للإطار الرئيسي (محاكاة)
    setTimeout(() => {
        alert(`✅ تم إرسال رسالتك:\n"${message}"\n\nباسم: ${name || 'ضيف'}`);
        
        // مسح حقل الرسالة
        if($('chatMsg')) $('chatMsg').value = '';
        
        // إعادة تمكين الزر
        if(btn) {
            btn.disabled = false;
            btn.value = 'إرسال';
        }
        
        // تحديث مؤشر النشاط
        const indicator = $('chanBar');
        if(indicator) {
            indicator.textContent = '💬 رسالة مرسلة';
            setTimeout(() => { indicator.textContent = '🟢 متصل'; }, 2000);
        }
    }, 300);
    
    console.log("💬 رسالة مرسلة:", { name, email, message });
};

// ❓ عرض المساعدة
window.showHelp = function() {
    alert(`❓ مساعدة الدردشة:

• اكتب اسمك في خانة "الاسم"
• يمكنك إضافة بريدك (اختياري)
• اكتب رسالتك واضغط "إرسال"
• استخدم زر "رموز" لإضافة ابتسامات
• زر "تحديث" ينشّط الدردشة إذا توقفت

للمزيد من المساعدة، تواصل مع الدعم.`);
};

// 😊 إظهار/إخفاء لوحة الرموز
window.toggleSmilies = function() {
    const panel = $('smilies-panel');
    if(panel) {
        panel.style.display = (panel.style.display === 'none' || !panel.style.display) ? 'block' : 'none';
        console.log("😊 لوحة الرموز: " + (panel.style.display === 'block' ? 'ظهرت' : 'اختفت'));
    }
};

// 😊 إدراج رمز تعبيري في حقل الرسالة
window.insertSmiley = function(emote) {
    const msgField = $('chatMsg');
    if(msgField) {
        // إضافة الرمز في نهاية النص الحالي
        msgField.value += ' ' + emote + ' ';
        msgField.focus();
        console.log("😊 أضيف الرمز:", emote);
    }
};

// 👤 عرض الملف الشخصي
window.showProfile = function() {
    const name = $('chatName')?.value.trim() || 'ضيف';
    alert(`👤 ملفك الشخصي:

الاسم: ${name}
الحالة: متصل الآن 🟢
الرسائل المرسلة: 0 (تجريبي)

💡 لتعديل ملفك، اذهب إلى لوحة التحكم → الإعدادات`);
};

// 🎨 دعم الوضع الليلي (اختياري)
function applyTheme() {
    const saved = localStorage.getItem('chat-theme');
    if(saved === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
}

// تهيئة عند التحميل
document.addEventListener('DOMContentLoaded', function() {
    console.log("✅ واجهة الدردشة جاهزة");
    applyTheme();
    
    // تفعيل إرسال الرسالة عند ضغط Enter في حقل النص
    const msgInput = $('chatMsg');
    if(msgInput) {
        msgInput.addEventListener('keypress', function(e) {
            if(e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendClassicChat();
            }
        });
    }
    
    // تحميل اسم المستخدم إذا كان محفوظاً
    const savedName = localStorage.getItem('chat-username');
    if(savedName && $('chatName')) {
        $('chatName').value = savedName;
    }
    
    // حفظ الاسم عند التغيير
    if($('chatName')) {
        $('chatName').addEventListener('change', function() {
            localStorage.setItem('chat-username', this.value);
        });
    }
});
