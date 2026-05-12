console.log("✅ النظام يبدأ...");

// 🧭 التنقل
window.go = function(sec) {
    console.log("🔀 إلى:", sec);
    ['login','dash','pub','mail','set','sub'].forEach(s => {
        const el = document.getElementById(s);
        if(el) el.style.display = 'none';
    });
    const t = document.getElementById(sec);
    if(t) t.style.display = 'block';
    hideAll();
};

// 📋 الصفحات الفرعية
window.pick = function(pg) {
    console.log("📄 فرعي:", pg);
    go('sub');
    const box = document.getElementById('sub');
    if(!box) return;
    const map = {
        'style':'<div class="card"><h3>🎨 سمات</h3><p>تخصيص الألوان</p><a onclick="go(\'dash\')">← عودة</a></div>',
        'layout':'<div class="card"><h3>📐 تخطيط</h3><p>خيارات العرض</p><a onclick="go(\'dash\')">← عودة</a></div>',
        'filter':'<div class="card"><h3>🔍 تصفية</h3><p>كلمات محظورة</p><a onclick="go(\'dash\')">← عودة</a></div>',
        'smilies':'<div class="card"><h3>😊 رموز</h3><p>إدارة الابتسامات</p><a onclick="go(\'dash\')">← عودة</a></div>',
        'users':'<div class="card"><h3>👥 مسجلون</h3><p>قائمة المستخدمين</p><a onclick="go(\'dash\')">← عودة</a></div>',
        'bans':'<div class="card"><h3>🚫 محظورون</h3><p>قائمة الحظر</p><a onclick="go(\'dash\')">← عودة</a></div>',
        'msgs':'<div class="card"><h3>📩 رسائل</h3><p>إدارة الرسائل</p><a onclick="go(\'dash\')">← عودة</a></div>',
        'archive':'<div class="card"><h3>🗄️ أرشيف</h3><p>المؤرشف</p><a onclick="go(\'dash\')">← عودة</a></div>'
    };
    box.innerHTML = map[pg] || '<p>غير متاح</p>';
};

// 🔐 الدخول
window.doLogin = function(e) {
    e.preventDefault();
    const em = document.getElementById('em')?.value.trim();
    const pw = document.getElementById('pw')?.value.trim();
    if(!em || !pw || !em.includes('@')) return alert("⚠️ بيانات خاطئة");
    document.getElementById('name').textContent = em.split('@')[0];
    document.getElementById('userDisplay').textContent = em;
    go('dash');
    alert("✅ مرحباً، " + em.split('@')[0]);
    return false;
};
window.logout = function() { document.getElementById('userDisplay').textContent = 'ضيف'; go('login'); alert("✅ خروج"); };

// 📋 القوائم المنسدلة (مضمونة 100%)
window.openMenu = function(id) {
    console.log("🔽 فتح:", id);
    hideAll();
    const menu = document.getElementById(id);
    if(menu) {
        menu.style.display = 'block';
        console.log("✅ ظهر:", id);
    } else {
        console.error("❌ غير موجود:", id);
    }
};
window.hideAll = function() {
    ['m1','m2','m3','m4'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.style.display = 'none';
    });
};
document.addEventListener('click', function(e) {
    if(!e.target.closest('.menu-wrap')) hideAll();
});

// 💬 الدردشة
window.send = function() {
    const m = document.getElementById('cMsg')?.value.trim();
    if(!m) return alert("⚠️ اكتب رسالة");
    alert("✅ تم: " + m);
    document.getElementById('cMsg').value = '';
};
window.refresh = function() {
    document.getElementById('stat').textContent = '🔄 جاري...';
    setTimeout(() => document.getElementById('stat').textContent = '🟢 متصل', 800);
};
window.toggleSmilies = function() {
    const b = document.getElementById('smBox');
    b.style.display = (b.style.display === 'none' || !b.style.display) ? 'block' : 'none';
};
window.ins = function(em) {
    const i = document.getElementById('cMsg');
    if(i) { i.value += ' '+em+' '; i.focus(); }
};
window.test = function() {
    const t = new Date().toLocaleTimeString('ar-EG');
    document.getElementById('out').innerHTML = `✅ يعمل!<br>⏰ ${t}`;
    alert("✅ النظام يعمل!\n" + t);
};

console.log("✅ جاهز تماماً!");
