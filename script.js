console.log("✅ النظام الكامل مع الدردشة الكلاسيكية يبدأ...");
const $=id=>document.getElementById(id);
let isLoggedIn=false,isLogin=true;

// 🧭 التنقل
window.go=function(sec){
    console.log("🔀 إلى:",sec);
    ['sec-login','sec-dash','sec-pub','sec-mail','sec-set','sec-sub'].forEach(s=>{const e=$(s);if(e)e.style.display='none'});
    const t=$('sec-'+sec); if(t)t.style.display='block';
    closeMenus();
};

// 📋 الصفحات الفرعية للقوائم
window.showSub=function(pg){
    console.log("📄 صفحة:",pg);
    go('sub');
    const c=$('sec-sub'); if(!c)return;
    const pages={
        'style':'<div class="card"><h3>🎨 محرر السمات</h3><p>تخصيص الألوان</p><label>لون: <input type="color" value="#2563eb"></label><button class="btn" style="margin-top:10px" onclick="alert(\'✅ تم\')">حفظ</button><p style="margin-top:15px"><a onclick="go(\'dash\')">← عودة</a></p></div>',
        'layout':'<div class="card"><h3>📐 التخطيط</h3><select class="txt"><option>كامل</option><option>متوسط</option></select><button class="btn" style="margin-top:10px" onclick="alert(\'✅ تم\')">تطبيق</button><p style="margin-top:15px"><a onclick="go(\'dash\')">← عودة</a></p></div>',
        'filter':'<div class="card"><h3>🔍 التصفية</h3><textarea class="txt" rows="3" placeholder="كلمات محظورة..."></textarea><button class="btn" style="margin-top:10px" onclick="alert(\'✅ تم\')">حفظ</button><p style="margin-top:15px"><a onclick="go(\'dash\')">← عودة</a></p></div>',
        'smilies':'<div class="card"><h3>😊 الرموز</h3><label><input type="checkbox" checked> تفعيل</label><button class="btn" style="margin-top:10px" onclick="alert(\'✅ تم\')">حفظ</button><p style="margin-top:15px"><a onclick="go(\'dash\')">← عودة</a></p></div>',
        'date':'<div class="card"><h3>📅 التاريخ</h3><select class="txt"><option>24 ساعة</option><option>12 ساعة</option></select><button class="btn" style="margin-top:10px" onclick="alert(\'✅ تم\')">تطبيق</button><p style="margin-top:15px"><a onclick="go(\'dash\')">← عودة</a></p></div>',
        'post':'<div class="card"><h3>📝 النشر</h3><input type="number" class="txt" value="500"><button class="btn" style="margin-top:10px" onclick="alert(\'✅ تم\')">حفظ</button><p style="margin-top:15px"><a onclick="go(\'dash\')">← عودة</a></p></div>',
        'users':'<div class="card"><h3>👥 المسجلون</h3><p style="color:#888">لا يوجد مستخدمون</p><p style="margin-top:15px"><a onclick="go(\'dash\')">← عودة</a></p></div>',
        'bans':'<div class="card"><h3>🚫 المحظورون</h3><p style="color:#888">لا يوجد محظورون</p><p style="margin-top:15px"><a onclick="go(\'dash\')">← عودة</a></p></div>',
        'integrate':'<div class="card"><h3>🔗 التكامل</h3><p>🔌 Telegram: <span style="color:#16a34a">متصل</span></p><p style="margin-top:15px"><a onclick="go(\'dash\')">← عودة</a></p></div>',
        'messages':'<div class="card"><h3>📩 الرسائل</h3><p style="color:#888">لا توجد رسائل</p><p style="margin-top:15px"><a onclick="go(\'dash\')">← عودة</a></p></div>',
        'archive':'<div class="card"><h3>🗄️ الأرشيف</h3><p style="color:#888">فارغ</p><p style="margin-top:15px"><a onclick="go(\'dash\')">← عودة</a></p></div>',
        'sticky':'<div class="card"><h3>📌 لاصقة</h3><textarea class="txt" rows="3" placeholder="نص الرسالة..."></textarea><button class="btn" style="margin-top:10px" onclick="alert(\'✅ تم\')">تثبيت</button><p style="margin-top:15px"><a onclick="go(\'dash\')">← عودة</a></p></div>',
        'channels':'<div class="card"><h3>📺 القنوات</h3><p>🟢 <strong>عام</strong></p><p style="margin-top:15px"><a onclick="go(\'dash\')">← عودة</a></p></div>',
        'webhook':'<div class="card"><h3>🔗 الويب</h3><input type="text" class="txt" value="https://example.com/webhook" readonly><button class="btn" style="margin-top:10px" onclick="navigator.clipboard.writeText(this.previousElementSibling.value);alert(\'✅ نسخ\')">📋 نسخ</button><p style="margin-top:15px"><a onclick="go(\'dash\')">← عودة</a></p></div>'
    };
    c.innerHTML=pages[pg]||'<p class="card">غير متاح <a onclick="go(\'dash\')">← عودة</a></p>';
};

// 🔐 الدخول
window.doLogin=function(e){
    e.preventDefault();
    const em=$('em')?.value.trim(),pw=$('pw')?.value.trim();
    if(!em||!pw||!em.includes('@'))return alert("⚠️ بيانات خاطئة");
    const b=$('sec-login')?.querySelector('button[type="submit"]');
    if(b){b.disabled=true;b.textContent='جاري...'}
    setTimeout(()=>{
        if($('lbl-name'))$('lbl-name').textContent=em.split('@')[0];
        if($('userEmail'))$('userEmail').textContent=em;
        go('dash');
        alert("✅ أهلاً، "+em.split('@')[0]+"!");
        if(b){b.disabled=false;b.textContent='دخول'}
    },300);
    return false;
};
window.toggleAuth=function(){alert(isLogin?"✓ إنشاء حساب":"✓ تسجيل الدخول")};
window.logout=function(){go('login');if($('userEmail'))$('userEmail').textContent='user@example.com';alert("✅ خروج")};

// 💬 الدردشة الكلاسيكية
window.sendChat=function(){
    const name=$('chatName')?.value.trim(),email=$('chatEmail')?.value.trim(),msg=$('chatMsg')?.value.trim();
    if(!msg)return alert("⚠️ اكتب رسالة أولاً");
    const btn=$('btnSend');
    if(btn){btn.disabled=true;btn.value='جاري...'}
    setTimeout(()=>{
        alert(`✅ تم الإرسال:\n"${msg}"\nباسم: ${name||'ضيف'}`);
        if($('chatMsg'))$('chatMsg').value='';
        if(btn){btn.disabled=false;btn.value='إرسال'}
        const ind=$('chanBar');
        if(ind){ind.textContent='💬 مرسلة';setTimeout(()=>ind.textContent='🟢 متصل',2000)}
    },300);
};

// 🔄 تحديث الدردشة
window.refreshChat=function(){
    const main=$('cboxmain'),form=$('cboxform');
    if(main){const s=main.src;main.src=s}
    if(form){const s=form.src;form.src=s}
    const ind=$('chanBar');
    if(ind){ind.textContent='🔄 جاري...';setTimeout(()=>ind.textContent='🟢 متصل',1000)}
    console.log("🔄 تم التحديث");
};

// 😊 الرموز التعبيرية
window.toggleSmilies=function(){
    const p=$('smiliesPanel');
    if(p)p.style.display=(p.style.display==='none'||!p.style.display)?'block':'none';
};
window.insertSmiley=function(em){
    const f=$('chatMsg');
    if(f){f.value+=' '+em+' ';f.focus()}
};

// ❓ المساعدة + 👤 الملف الشخصي
window.showHelp=function(){alert(`❓ مساعدة الدردشة:
• اكتب اسمك في خانة "الاسم"
• يمكنك إضافة بريدك (اختياري)
• اكتب رسالتك واضغط "إرسال"
• استخدم زر "الابتسامات" لإضافة رموز
• زر "تحديث" ينشّط الدردشة إذا توقفت`)};
window.showProfile=function(){
    const n=$('chatName')?.value.trim()||'ضيف';
    alert(`👤 ملفك الشخصي:\nالاسم: ${n}\nالحالة: متصل 🟢`);
};

// 📤 انشر
window.switchCode=function(){
    const v=$('codeType')?.value||'inline',b=$('codeBox');
    if(!b)return;
    b.value=v==='inline'?'<iframe src="https://example.com/chat" width="400" height="400"></iframe>':'<a href="#" onclick="openPop()">افتح</a>';
};
window.copyCode=function(){
    const b=$('codeBox');if(!b)return;
    b.select();try{document.execCommand('copy');alert("✅ نسخ")}catch{alert("Ctrl+C")}
};

// 📦 صندوق بريدي
window.refreshStats=function(){
    const v=Math.floor(Math.random()*5000)+10000,m=Math.floor(Math.random()*1000)+2000;
    if($('views'))$('views').textContent=v.toLocaleString('ar-EG');
    if($('msgs'))$('msgs').textContent=m.toLocaleString('ar-EG');
    if($('progress'))$('progress').style.width=Math.min(100,Math.max(10,m/20))+'%';
    alert(`✅ مشاهدات: ${v.toLocaleString('ar-EG')}\n📩 رسائل: ${m.toLocaleString('ar-EG')}`);
};

// ⚙️ إعدادات
window.saveSettings=function(){
    const n=$('displayName')?.value.trim();if(!n)return alert("⚠️ اكتب اسماً");
    if($('lbl-name'))$('lbl-name').textContent=n;
    alert("✅ تم: "+n);
};

// 🧪 اختبار
window.testSys=function(){
    const now=new Date().toLocaleString('ar-EG');
    if($('testOut'))$('testOut').innerHTML=`✅ يعمل!<br>⏰ ${now}<br>👤 ${isLoggedIn?$('userEmail')?.textContent:'غير مسجل'}`;
    alert("✅ الجافاسكربت يعمل!\n"+now);
};

// 📋 إدارة القوائم
function closeMenus(){
    ['menu1-c','menu2-c','menu3-c','menu4-c'].forEach(id=>{const m=$(id);if(m)m.classList.remove('show')});
}
document.addEventListener('DOMContentLoaded',function(){
    ['menu1','menu2','menu3','menu4'].forEach(btnId=>{
        const btn=$(btnId),cnt=$(btnId+'-c');
        if(btn&&cnt){
            btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();closeMenus();cnt.classList.toggle('show')});
        }
    });
    document.addEventListener('click',e=>{if(!e.target.closest('.dropdown')&&!e.target.closest('.dropdown-content'))closeMenus()});
    
    // حفظ اسم المستخدم
    const saved=$('chatName'),sn=localStorage.getItem('chat-uname');
    if(saved&&sn)saved.value=sn;
    if(saved)saved.addEventListener('change',()=>localStorage.setItem('chat-uname',saved.value));
    
    // Enter للإرسال
    const mf=$('chatMsg');
    if(mf)mf.addEventListener('keypress',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendChat()}});
    
    console.log("✅ النظام الكامل جاهز مع الدردشة الكلاسيكية!");
});
