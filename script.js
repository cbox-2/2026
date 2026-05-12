console.log("✅ النظام يبدأ مع 4 قوائم منسدلة...");

const $ = id => document.getElementById(id);
let isLoggedIn = false;
let isLoginMode = true;

// 🧭 التنقل بين الأقسام الرئيسية
window.showSection = function(name) {
    console.log("🔀 إلى:", name);
    ['login-section','dashboard-section','publish-section','mailbox-section','settings-section','subpage-section'].forEach(id => {
        const el = $(id); if(el) el.style.display = 'none';
    });
    const target = $(name); if(target) target.style.display = 'block';
    closeAllMenus();
};

// 📋 عرض الصفحات الفرعية للقوائم المنسدلة
window.showSubPage = function(page) {
    showSection('subpage-section');
    const content = $('subpage-section');
    if(!content) return;
    
    const pages = {
        // 🎨 المظهر والملمس
        'style': `<div class="card"><h3>🎨 محرر السمات</h3><p>تخصيص الألوان والخطوط</p><label>لون الخلفية: <input type="color" value="#ffffff" class="input" style="width:60px"></label><button class="btn" style="margin-top:10px" onclick="alert('✅ تم تطبيق السمة')">معاينة</button><p style="margin-top:15px"><a onclick="showSection('dashboard');return false">← العودة</a></p></div>`,
        'layout': `<div class="card"><h3>📐 خيارات التخطيط</h3><label>عرض الصندوق:<select class="input"><option>كامل</option><option>متوسط</option><option>ضيق</option></select></label><button class="btn" style="margin-top:10px" onclick="alert('✅ تم تطبيق التخطيط')">تطبيق</button><p style="margin-top:15px"><a onclick="showSection('dashboard');return false">← العودة</a></p></div>`,
        
        // ⚙️ خيارات
        'filter': `<div class="card"><h3>🔍 تصفية المحتوى</h3><textarea class="input" rows="3" placeholder="كلمات محظورة (مفصولة بفاصلة)..."></textarea><button class="btn" style="margin-top:10px" onclick="alert('✅ تم حفظ الفلاتر')">حفظ</button><p style="margin-top:15px"><a onclick="showSection('dashboard');return false">← العودة</a></p></div>`,
        'smilies': `<div class="card"><h3>😊 الرموز التعبيرية</h3><label><input type="checkbox" checked> تفعيل الرموز تلقائياً</label><button class="btn" style="margin-top:10px" onclick="alert('✅ تم حفظ الإعدادات')">حفظ</button><p style="margin-top:15px"><a onclick="showSection('dashboard');return false">← العودة</a></p></div>`,
        'date': `<div class="card"><h3>📅 خيارات التاريخ</h3><label>التنسيق:<select class="input"><option>24 ساعة (14:30)</option><option>12 ساعة (2:30 م)</option><option>منذ (منذ 5 دقائق)</option></select></label><button class="btn" style="margin-top:10px" onclick="alert('✅ تم تطبيق التنسيق')">تطبيق</button><p style="margin-top:15px"><a onclick="showSection('dashboard');return false">← العودة</a></p></div>`,
        'post': `<div class="card"><h3>📝 خيارات النشر</h3><label>حد الأحرف:<input type="number" class="input" value="500"></label><button class="btn" style="margin-top:10px" onclick="alert('✅ تم حفظ الإعدادات')">حفظ</button><p style="margin-top:15px"><a onclick="showSection('dashboard');return false">← العودة</a></p></div>`,
        
        // 👥 المستخدمون
        'users': `<div class="card"><h3>👥 المستخدمون المسجلون</h3><p style="color:#888">لا يوجد مستخدمون مسجلون حالياً</p><button class="btn" style="margin-top:10px" onclick="alert('✅ سيتم تحديث القائمة')">تحديث</button><p style="margin-top:15px"><a onclick="showSection('dashboard');return false">← العودة</a></p></div>`,
        'bans': `<div class="card"><h3>🚫 المستخدمون المحظورون</h3><p style="color:#888">لا يوجد مستخدمون محظورون</p><button class="btn" style="margin-top:10px" onclick="alert('✅ إضافة حظر جديد')">إضافة حظر</button><p style="margin-top:15px"><a onclick="showSection('dashboard');return false">← العودة</a></p></div>`,
        'integrate': `<div class="card"><h3>🔗 تكامل المستخدم</h3><p>🔌 Discord: <span style="color:#c00">غير متصل</span></p><p>🔌 Telegram: <span style="color:#16a34a">متصل</span></p><button class="btn" style="margin-top:10px" onclick="alert('✅ إدارة التكاملات')">إدارة</button><p style="margin-top:15px"><a onclick="showSection('dashboard');return false">← العودة</a></p></div>`,
        
        // 💬 رسائل
        'messages': `<div class="card"><h3>📩 إدارة الرسائل</h3><p style="color:#888">لا توجد رسائل جديدة</p><p style="margin-top:15px"><a onclick="showSection('dashboard');return false">← العودة</a></p></div>`,
        'archive': `<div class="card"><h3>🗄️ الأرشيف</h3><p style="color:#888">الأرشيف فارغ</p><p style="margin-top:15px"><a onclick="showSection('dashboard');return false">← العودة</a></p></div>`,
        'sticky': `<div class="card"><h3>📌 رسالة لاصقة</h3><textarea class="input" rows="3" placeholder="نص الرسالة التي تريد تثبيتها..."></textarea><button class="btn" style="margin-top:10px" onclick="alert('✅ تم تثبيت الرسالة')">تثبيت</button><p style="margin-top:15px"><a onclick="showSection('dashboard');return false">← العودة</a></p></div>`,
        'channels': `<div class="card"><h3>📺 القنوات</h3><p>🟢 <strong>عام</strong> <span style="color:#888;font-size:11px">(افتراضي)</span></p><button class="btn" style="margin-top:10px" onclick="alert('✅ إنشاء قناة جديدة')">+ قناة جديدة</button><p style="margin-top:15px"><a onclick="showSection('dashboard');return false">← العودة</a></p></div>`,
        'webhook': `<div class="card"><h3>🔗 رابط الويب</h3><input type="text" class="input" value="https://your-webhook.com/endpoint" readonly><button class="btn" style="margin-top:10px" onclick="navigator.clipboard.writeText(this.previousElementSibling.value);alert('✅ تم نسخ الرابط')">📋 نسخ</button><p style="margin-top:15px"><a onclick="showSection('dashboard');return false">← العودة</a></p></div>`
    };
    
    content.innerHTML = pages[page] || '<p class="card">صفحة غير متوفرة <a onclick="showSection(\'dashboard\');return false">← عودة</a></p>';
    console.log("📄 عرض:", page);
};

// 🔐 تسجيل الدخول
window.handleLogin = function(e) {
    e.preventDefault();
    const email = $('email')?.value.trim(), pw = $('password')?.value.trim();
    if(!email || !pw || !email.includes('@')) return alert("⚠️ بيانات غير صحيحة");
    const btn = $('loginBtn'); if(btn){btn.disabled=true; btn.textContent='جاري...'}
    setTimeout(()=>{
        isLoggedIn = true;
        const name = email.split('@')[0];
        if($('userName')) $('userName').textContent = name;
        if($('userEmail')) $('userEmail').textContent = email;
        showSection('dashboard-section');
        alert("✅ مرحباً، "+name+"!");
        if(btn){btn.disabled=false; btn.textContent=isLoginMode?'دخول':'إنشاء حساب'}
    }, 400);
};

window.toggleMode = ()=>{ isLoginMode=!isLoginMode; const b=$('loginBtn'); if(b)b.textContent=isLoginMode?'دخول':'إنشاء حساب'; alert(isLoginMode?"✓ تسجيل الدخول":"✓ إنشاء حساب") };
window.logout = ()=>{ isLoggedIn=false; showSection('login-section'); if($('userEmail'))$('userEmail').textContent='user@example.com'; alert("✅ تم الخروج") };

// 💬 الدردشة
window.sendMessage = function(){
    const inp=$('chatInput'), txt=inp?.value.trim(), msgs=$('messages');
    if(!txt||!msgs)return;
    const div=document.createElement('div'); div.className='message me';
    div.innerHTML=`<span class="sender">أنت</span><span class="time">${new Date().toLocaleTimeString('ar-EG',{hour:'2-digit',minute:'2-digit'})}</span><span class="text">${txt}</span>`;
    msgs.appendChild(div); inp.value=''; msgs.scrollTop=msgs.scrollHeight;
    setTimeout(()=>{const r=document.createElement('div');r.className='message';r.innerHTML=`<span class="sender">النظام</span><span class="time">${new Date().toLocaleTimeString('ar-EG',{hour:'2-digit',minute:'2-digit'})}</span><span class="text">✅ تم الاستلام</span>`;msgs.appendChild(r);msgs.scrollTop=msgs.scrollHeight},800);
};

// 📤 انشر
window.switchCode = ()=>{ const t=$('codeType')?.value||'inline', b=$('codeBox'); if(!b)return; b.value=t==='inline'?'<iframe src="https://example.com/chat" width="400" height="400"></iframe>':'<a href="#" onclick="openPop()">افتح الدردشة</a>'; };
window.copyCode = ()=>{ const b=$('codeBox'); if(!b)return; b.select(); try{document.execCommand('copy');alert("✅ تم النسخ")}catch{alert("Ctrl+C للنسخ")} };

// 📦 صندوق بريدي
window.refreshStats = ()=>{ const v=Math.floor(Math.random()*5000)+10000, m=Math.floor(Math.random()*1000)+2000, p=Math.min(100,Math.max(10,m/50)); if($('views'))$('views').textContent=v.toLocaleString('ar-EG'); if($('msgs'))$('msgs').textContent=m.toLocaleString('ar-EG'); if($('progress'))$('progress').style.width=p+'%'; alert(`✅ المشاهدات: ${v.toLocaleString('ar-EG')}\n📩 الرسائل: ${m.toLocaleString('ar-EG')}`) };

// ⚙️ إعدادات
window.saveSettings = ()=>{ const n=$('displayName')?.value.trim(); if(!n)return alert("⚠️ اكتب اسماً"); if($('userName'))$('userName').textContent=n; alert("✅ تم: "+n) };

// 🧪 اختبار
window.testJS = ()=>{ const now=new Date().toLocaleString('ar-EG'); if($('testResult'))$('testResult').innerHTML=`✅ يعمل!<br>⏰ ${now}<br>👤 ${isLoggedIn?$('userEmail')?.textContent:'غير مسجل'}`; alert("✅ الجافاسكربت يعمل!\n"+now) };

// 📋 إدارة القوائم المنسدلة
function closeAllMenus(){ ['menu1-c','menu2-c','menu3-c','menu4-c'].forEach(id=>{const m=$(id);if(m)m.classList.remove('show')}) }

document.addEventListener('DOMContentLoaded', function(){
    // تفعيل جميع القوائم
    ['menu1','menu2','menu3','menu4'].forEach(btnId=>{
        const btn=$(btnId), content=$(btnId+'-c');
        if(btn&&content){
            btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();closeAllMenus();content.classList.toggle('show');console.log("📋 "+btn.textContent.trim()+": "+(content.classList.contains('show')?'فتح':'إغلاق'))});
        }
    });
    // إغلاق عند النقر خارج القائمة
    document.addEventListener('click',e=>{ if(!e.target.closest('.dropdown')&&!e.target.closest('.dropdown-content'))closeAllMenus() });
    
    console.log("✅ النظام جاهز مع 4 قوائم منسدلة!");
});
