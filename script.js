// 🆕 دعم صفحة "صندوق بريدي"
const mailboxSection = document.getElementById('mailbox-section');

// تحديث دالة showSection لدعم صفحة صندوق بريدي
function showSection(name) { 
    loginSection.style.display = 'none'; dashboardSection.style.display = 'none'; 
    settingsSection.style.display = 'none'; subpageView.style.display = 'none'; 
    if(publishSection) publishSection.style.display = 'none';
    if(mailboxSection) mailboxSection.style.display = 'none';
    
    if (name === 'login') loginSection.style.display = 'block'; 
    else if (name === 'dashboard') dashboardSection.style.display = 'block'; 
    else if (name === 'settings') settingsSection.style.display = 'block'; 
    else if (name === 'publish' && publishSection) publishSection.style.display = 'block';
    else if (name === 'mailbox' && mailboxSection) mailboxSection.style.display = 'block'; // 🆕 صفحة صندوق بريدي
    else if (name === 'subpage') subpageView.style.display = 'block'; 
}

// 🆕 ربط زر "صناديق بريدي" في الهيدر
const userWelcome = document.getElementById('userWelcome');
if(userWelcome) {
    userWelcome.addEventListener('click', function(e) {
        e.preventDefault();
        if(!currentUser) { alert('⚠️ يرجى تسجيل الدخول أولاً'); showSection('login'); return; }
        showSection('mailbox');
        if(errorBar) errorBar.textContent = 'صندوق بريدي';
        closeAllDropdowns();
    });
}

// 🆕 دالة التحقق من نموذج تغيير البريد/كلمة المرور
function chk_faccount() {
    const f = document.forms["faccount"];
    let err = "";
    if (f["email"].value.trim() === "") { err += "<li>يرجى إدخال بريد إلكتروني</li>"; }
    if (f["pword"].value && f["pword"].value !== f["pword2"].value) { err += "<li>كلمتا المرور غير متطابقتين</li>"; }
    if (f["pword"].value && f["pword"].value.length < 6) { err += "<li>كلمة المرور يجب أن تكون 6 أحرف على الأقل</li>"; }
    
    if (err) {
        alert('❌ أخطاء في الإدخال:\n' + err.replace(/<[^>]+>/g, ''));
        return false;
    }
    alert('✅ تم حفظ التغييرات');
    return false;
}

// 🆕 دالة إنشاء شريط الإحصائيات (مبسطة)
function createBar(elem, isLog, showLimit) {
    if(!elem) return { setBarSize: function(){} };
    let bar = elem.querySelector('.barFill');
    let text = elem.querySelector('.barText');
    if(!bar || !text) return { setBarSize: function(){} };
    
    return {
        setBarSize: function(val, max) {
            const prop = Math.min(1, Math.max(0, val / max));
            const w = (isLog ? Math.log(prop * 1.718 + 1) : prop) * 100;
            const r = Math.min(255, prop/0.7 * 255 + 50);
            const g = Math.max(0, 255 - prop*0.6*255);
            const b = 80;
            bar.style.width = Math.max(w, 5) + "%";
            bar.style.backgroundColor = `rgb(${Math.round(r)}, ${Math.round(g)}, ${b})`;
            text.textContent = val.toLocaleString('ar-EG') + (showLimit ? `/${max}` : "");
        }
    };
}

// 🆕 تهيئة أشرطة الإحصائيات عند تحميل صفحة صندوق بريدي
function initMailboxStats() {
    if(!mailboxSection || mailboxSection.style.display === 'none') return;
    // محاكاة بيانات إحصائية
    createBar(document.getElementById("sbar1"), true).setBarSize(3, 10000);
    createBar(document.getElementById("sbar2"), true).setBarSize(0, 500);
    createBar(document.getElementById("sbar3"), false).setBarSize(0, 100);
}

// 🆕 مراقبة التبديل بين الأقسام لتحديث الإحصائيات
const originalShowSection = showSection;
showSection = function(name) {
    originalShowSection(name);
    if(name === 'mailbox') { setTimeout(initMailboxStats, 100); }
}

// 🆕 ربط زر قفل الصندوق
const lockedChk = document.getElementById('locked-chk');
if(lockedChk) {
    lockedChk.addEventListener('change', function() {
        const msg = document.getElementById('m_flock');
        if(msg) msg.textContent = this.checked ? 'مقفل' : 'مفتوح';
        alert(this.checked ? '✅ تم قفل الصندوق' : '✅ تم فتح الصندوق');
    });
}
