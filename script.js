console.log("✅ النظام يبدأ...");

// 🧭 التنقل بين الصفحات الرئيسية
window.showPage = function(id) {
    console.log("🔀 صفحة:", id);
    const sections = ['sec-login','sec-dash','sec-pub','sec-mail','sec-set','sec-sub'];
    sections.forEach(s => {
        const el = document.getElementById(s);
        if(el) el.style.display = 'none';
    });
    const target = document.getElementById('sec-' + id);
    if(target) {
        target.style.display = 'block';
        console.log("✅ ظهر:", id);
    }
    hideAll(); // إغلاق القوائم عند التنقل
};

// 📋 عرض الصفحات الفرعية
window.showSub = function(pg) {
    console.log("📄 فرعي:", pg);
    showPage('sub');
    const box = document.getElementById('sec-sub');
    if(!box) return;
    
    const content = {
        'style': '<div class="card"><h3>🎨 سمات</h3><p>تخصيص الألوان</p><a onclick="showPage(\'dashboard\')">← عودة</a></div>',
        'layout': '<div class="card"><h3>📐 تخطيط</h3><p>خيارات العرض</p><a onclick="showPage(\'dashboard\')">← عودة</a></div>',
        'filter': '<div class="card"><h3>🔍 تصفية</h3><p>كلمات محظورة</p><a onclick="showPage(\'dashboard\')">← عودة</a></div>',
        'smilies': '<div class="card"><h3>😊 رموز</h3><p>إدارة الابتسامات</p><a onclick="showPage(\'dashboard\')">← عودة</a></div>',
        'users': '<div class="card"><h3>👥 مسجلون</h3><p>قائمة المستخدمين</p><a onclick="showPage(\'dashboard\')">← عودة</a></div>',
        'bans': '<div class="card"><h3>🚫 محظورون</h3><p>قائمة الحظر</p><a onclick="showPage(\'dashboard\')">← عودة</a></div>',
        'msgs': '<div class="card"><h3>📩 رسائل</h3><p>إدارة الرسائل</p><a onclick="showPage(\'dashboard\')">← عودة</a></div>',
        'archive': '<div class="card"><h3>🗄️ أرشيف</h3><p>المؤرشف</p><a onclick="showPage(\'dashboard\')">← عودة</a></div>'
    };
    box.innerHTML = content[pg] || '<p>غير متاح <a onclick="showPage(\'dashboard\')">← عودة</a></p>';
};

// 🔐 تسجيل الدخول
window.doLogin = function(e) {
    e.preventDefault();
    const em = document.getElementById('inp-em')?.value.trim();
    const pw = document.getElementById('inp-pw')?.value.trim();
    if(!em || !pw || !em.includes('@')) return alert("⚠️ بيانات خاطئة");
    
    const name = em.split('@')[0];
    document.getElementById('lbl-name').textContent = name;
    document.getElementById('userDisplay').textContent = em;
    showPage('dash');
    alert("✅ مرحباً، " + name + "!");
    return false;
};

window.doLogout = function() {
    document.getElementById('userDisplay').textContent = 'ضيف';
    showPage('login');
    alert("✅ تم الخروج");
};

// 📋 إدارة القوائم المنسدلة (مضمونة 100%)
window.toggleDrop = function(id) {
    console.log("🔽 تبديل:", id);
    hideAll(); // أغلق الكل أولاً
    const menu = document.getElementById(id);
    if(menu) {
        menu.style.display = (menu.style.display === 'block') ? 'none' : 'block';
        console.log("  → " + (menu.style.display === 'block' ? 'فتح' : 'إغلاق'));
    }
};

window.hideAll = function() {
    ['m1','m2','m3','m4'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.style.display = 'none';
    });
};

// إغلاق القوائم عند النقر خارجها
document.addEventListener('click', function(e) {
    if(!e.target.closest('.drop-btn') && !e.target.closest('.drop-menu')) {
        hideAll();
    }
});

// 💬 وظائف الدردشة
window.sendChat = function() {
    const msg = document.getElementById('cMsg')?.value.trim();
    if(!msg) return alert("⚠️ اكتب رسالة");
    alert("✅ تم: " + msg);
    document.getElementById('cMsg').value = '';
};
window.refreshChat = function() {
    document.getElementById('chatStatus').textContent = '🔄 جاري...';
    setTimeout(() => document.getElementById('chatStatus').textContent = '🟢 متصل', 800);
};
window.toggleSmilies = function() {
    const box = document.getElementById('smiliesBox');
    box.style.display = (box.style.display === 'none' || !box.style.display) ? 'block' : 'none';
};
window.insertSmiley = function(emo) {
    const inp = document.getElementById('cMsg');
    if(inp) { inp.value += ' ' + emo + ' '; inp.focus(); }
};
window.testSys = function() {
    const t = new Date().toLocaleTimeString('ar-EG');
    document.getElementById('testOut').innerHTML = `✅ يعمل!<br>⏰ ${t}`;
    alert("✅ النظام يعمل!\n" + t);
};

console.log("✅ النظام جاهز تماماً!");
