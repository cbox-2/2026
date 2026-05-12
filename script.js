console.log("✅ النظام يبدأ...");

// دالة مساعدة
const $=id=>document.getElementById(id);

// 🧭 التنقل الرئيسي
window.go=function(sec){
    console.log("🔀 إلى:",sec);
    // إخفاء الكل
    ['sec-login','sec-dash','sec-pub','sec-mail','sec-set','sec-sub'].forEach(s=>{
        const e=$(s); if(e)e.style.display='none';
    });
    // إظهار المطلوب
    const t=$( 'sec-'+sec); if(t)t.style.display='block';
    // إغلاق كل المجموعات
    closeGroups();
};

// 📋 عرض الصفحات الفرعية
window.showPage=function(pg){
    console.log("📄 صفحة:",pg);
    go('sub'); // إظهار قسم الصفحات الفرعية
    const c=$('sec-sub'); if(!c)return;
    
    const pages={
        'style':'<div class="card"><h3>🎨 محرر السمات</h3><p>تخصيص الألوان</p><label>لون: <input type="color" value="#2563eb"></label><button class="btn" style="margin-top:10px" onclick="alert(\'✅ تم\')">حفظ</button><p style="margin-top:15px"><a onclick="go(\'dash\')">← عودة</a></p></div>',
        'layout':'<div class="card"><h3>📐 التخطيط</h3><select class="txt"><option>كامل</option><option>متوسط</option></select><button class="btn" style="margin-top:10px" onclick="alert(\'✅ تم\')">تطبيق</button><p style="margin-top:15px"><a onclick="go(\'dash\')">← عودة</a></p></div>',
        'filter':'<div class="card"><h3>🔍 التصفية</h3><textarea class="txt" rows="3" placeholder="كلمات محظورة..."></textarea><button class="btn" style="margin-top:10px" onclick="alert(\'✅ تم\')">حفظ</button><p style="margin-top:15px"><a onclick="go(\'dash\')">← عودة</a></p></div>',
        'smilies':'<div class="card"><h3>😊 الرموز</h3><label><input type="checkbox" checked> تفعيل</label><button class="btn" style="margin-top:10px" onclick="alert(\'✅ تم\')">حفظ</button><p style="margin-top:15px"><a onclick="go(\'dash\')">← عودة</a></p></div>',
        'date':'<div class="card"><h3>📅 التاريخ</h3><select class="txt"><option>24 ساعة</option><option>12 ساعة</option></select><button class="btn" style="margin-top:10px" onclick="alert(\'✅ تم\')">تطبيق</button><p style="margin-top:15px"><a onclick="go(\'dash\')">← عودة</a></p></div>',
        'post':'<div class="card"><h3>📝 النشر</h3><input type="number" class="txt" value="500" placeholder="حد الأحرف"><button class="btn" style="margin-top:10px" onclick="alert(\'✅ تم\')">حفظ</button><p style="margin-top:15px"><a onclick="go(\'dash\')">← عودة</a></p></div>',
        'users-list':'<div class="card"><h3>👥 المسجلون</h3><p style="color:#888">لا يوجد مستخدمون</p><p style="margin-top:15px"><a onclick="go(\'dash\')">← عودة</a></p></div>',
        'bans':'<div class="card"><h3>🚫 المحظورون</h3><p style="color:#888">لا يوجد محظورون</p><p style="margin-top:15px"><a onclick="go(\'dash\')">← عودة</a></p></div>',
        'integrate':'<div class="card"><h3>🔗 التكامل</h3><p>🔌 Telegram: <span style="color:#16a34a">متصل</span></p><p style="margin-top:15px"><a onclick="go(\'dash\')">← عودة</a></p></div>',
        'msgs':'<div class="card"><h3>📩 الرسائل</h3><p style="color:#888">لا توجد رسائل</p><p style="margin-top:15px"><a onclick="go(\'dash\')">← عودة</a></p></div>',
        'archive':'<div class="card"><h3>🗄️ الأرشيف</h3><p style="color:#888">فارغ</p><p style="margin-top:15px"><a onclick="go(\'dash\')">← عودة</a></p></div>',
        'sticky':'<div class="card"><h3>📌 لاصقة</h3><textarea class="txt" rows="3" placeholder="نص الرسالة..."></textarea><button class="btn" style="margin-top:10px" onclick="alert(\'✅ تم\')">تثبيت</button><p style="margin-top:15px"><a onclick="go(\'dash\')">← عودة</a></p></div>',
        'channels':'<div class="card"><h3>📺 القنوات</h3><p>🟢 <strong>عام</strong></p><p style="margin-top:15px"><a onclick="go(\'dash\')">← عودة</a></p></div>',
        'webhook':'<div class="card"><h3>🔗 الويب</h3><input type="text" class="txt" value="https://example.com/webhook" readonly><button class="btn" style="margin-top:10px" onclick="navigator.clipboard.writeText(this.previousElementSibling.value);alert(\'✅ نسخ\')">📋 نسخ</button><p style="margin-top:15px"><a onclick="go(\'dash\')">← عودة</a></p></div>'
    };
    
    c.innerHTML = pages[pg] || '<p class="card">غير متاح <a onclick="go(\'dash\')">← عودة</a></p>';
};

// 🔐 الدخول
window.doLogin=function(e){
    e.preventDefault();
    const em=$('inp-em')?.value.trim(), pw=$('inp-pw')?.value.trim();
    if(!em||!pw||!em.includes('@'))return alert("⚠️ بيانات خاطئة");
    const b=$('sec-login')?.querySelector('button[type="submit"]');
    if(b){b.disabled=true; b.textContent='جاري...'}
    setTimeout(()=>{
        if($('lbl-name'))$('lbl-name').textContent=em.split('@')[0];
        if($('userEmail'))$('userEmail').textContent=em;
        go('dash');
        alert("✅ أهلاً، "+em.split('@')[0]+"!");
        if(b){b.disabled=false; b.textContent='دخول'}
    },300);
    return false;
};

window.toggleAuthMode=function(){ alert(isLoginMode?"✓ إنشاء حساب":"✓ تسجيل الدخول") };
window.logout=function(){ go('login'); if($('userEmail'))$('userEmail').textContent='user@example.com'; alert("✅ خروج") };

// 💬 الدردشة
window.sendChat=function(){
    const t=$('chat-txt')?.value.trim(), m=$('chat-msgs');
    if(!t||!m)return;
    const d=document.createElement('div'); d.className='msg me';
    d.innerHTML=`<span class="s">أنت</span><span class="t">${new Date().toLocaleTimeString('ar-EG',{hour:'2-digit',minute:'2-digit'})}</span><span class="x">${t}</span>`;
    m.appendChild(d); $('chat-txt').value=''; m.scrollTop=m.scrollHeight;
    setTimeout(()=>{const r=document.createElement('div');r.className='msg';r.innerHTML=`<span class="s">النظام</span><span class="t">${new Date().toLocaleTimeString('ar-EG',{hour:'2-digit',minute:'2-digit'})}</span><span class="x">✅ وصل</span>`;m.appendChild(r);m.scrollTop=m.scrollHeight},600);
};

// 📤 انشر
window.swapCode=function(){
    const v=$('sel-code')?.value||'inline', b=$('txt-code');
    if(!b)return;
    b.value = v==='inline' ? '<iframe src="https://example.com/chat" width="400" height="400"></iframe>' : '<a href="#" onclick="openPop()">افتح</a>';
};
window.copyCode=function(){
    const b=$('txt-code'); if(!b)return;
    b.select(); try{document.execCommand('copy');alert("✅ نسخ")}catch{alert("Ctrl+C")}
};

// 📦 صندوق بريدي
window.updStats=function(){
    const v=Math.floor(Math.random()*5000)+10000, m=Math.floor(Math.random()*1000)+2000;
    if($('stat-v'))$('stat-v').textContent=v.toLocaleString('ar-EG');
    if($('stat-m'))$('stat-m').textContent=m.toLocaleString('ar-EG');
    if($('bar-fill'))$('bar-fill').style.width=Math.min(100,Math.max(10,m/20))+'%';
    alert(`✅ مشاهدات: ${v.toLocaleString('ar-EG')}\n📩 رسائل: ${m.toLocaleString('ar-EG')}`);
};

// ⚙️ إعدادات
window.saveSet=function(){
    const n=$('inp-name')?.value.trim(); if(!n)return alert("⚠️ اكتب اسماً");
    if($('lbl-name'))$('lbl-name').textContent=n;
    alert("✅ تم: "+n);
};

// 🧪 اختبار
window.testSys=function(){
    const now=new Date().toLocaleString('ar-EG');
    if($('test-out'))$('test-out').innerHTML=`✅ يعمل!<br>⏰ ${now}`;
    alert("✅ الجافاسكربت يعمل!\n"+now);
};

// 📋 إدارة مجموعات الأزرار
function closeGroups(){
    ['grp-appearance','grp-options','grp-users','grp-messages'].forEach(id=>{
        const g=$(id); if(g)g.style.display='none';
    });
}
window.toggleGroup=function(grp){
    console.log("📋 مجموعة:",grp);
    closeGroups(); // إغلاق الكل أولاً
    const g=$('grp-'+grp);
    if(g){
        g.style.display = (g.style.display==='none'||!g.style.display) ? 'block' : 'none';
        console.log("  → "+(g.style.display==='block'?'فتح':'إغلاق'));
    }
};

// بدء
console.log("✅ النظام جاهز!");
