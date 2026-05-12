console.log("🚀 بدء النظام...");
const $=id=>document.getElementById(id);
let auth,db,user,unsub,isLogin=true;

// تهيئة آمنة
function init() {
    try {
        if (!window.firebase) return console.warn("⏳ انتظار Firebase...");
        firebase.initializeApp({
            apiKey:"AIzaSyD_UssZllzECYbTMR_0NCTzEGAIMeZAcos",
            authDomain:"cbox22026.firebaseapp.com",
            projectId:"cbox22026",
            storageBucket:"cbox22026.firebasestorage.app",
            messagingSenderId:"175894881657",
            appId:"1:175894881657:web:ae5e693d843ee594eb7ba8"
        });
        auth=firebase.auth(); db=firebase.firestore();
        console.log("✅ Firebase جاهز");
        auth.onAuthStateChanged(u=>{ user=u; u?show('dash'):show('login'); if(u)startChat(); });
    } catch(e){ console.error("❌ Firebase:",e); }
}

// التنقل
window.go=name=>{ if(!user&&name!=='login'){alert("⚠️ سجل الدخول أولاً");return show('login')} show(name) };
function show(n){ ['login','dash','pub','mail','set','sub'].forEach(id=>{const e=$(id);if(e)e.style.display='none'}); const s=$(n); if(s)s.style.display='block'; console.log("🔀 إلى:",n) }

// المصادقة
window.auth=e=>{ e.preventDefault(); const em=$( 'em').value.trim(), pw=$('pw').value.trim(); if(!em||!pw||!em.includes('@'))return alert("⚠️ بيانات غير صحيحة"); const b=$('authBtn'); b.disabled=true; b.textContent='جاري...'; loadFirebase(async()=>{ try{ isLogin?await auth.signInWithEmailAndPassword(em,pw):(await auth.createUserWithEmailAndPassword(em,pw), await db.collection('users').doc(auth.currentUser.uid).set({email:em,displayName:em.split('@')[0],createdAt:firebase.firestore.FieldValue.serverTimestamp()})); await db.collection('sessions').add({userId:auth.currentUser.uid,email:em,timestamp:firebase.firestore.FieldValue.serverTimestamp()}); }catch(err){alert("❌ "+(err.message||err.code))}finally{b.disabled=false;b.textContent=isLogin?'دخول':'إنشاء'} }) };
window.toggleAuth=()=>{ isLogin=!isLogin; $('authBtn').textContent=isLogin?'دخول':'إنشاء حساب' };
window.logout=()=>{ auth?.signOut(); show('login') };

// الدردشة
function startChat(){ if(!db||!user)return; $('inp')?.removeAttribute('disabled'); $('send')?.removeAttribute('disabled'); unsub=db.collection('messages').orderBy('timestamp','asc').limit(50).onSnapshot(snap=>{ const m=$('msgs'); if(!m)return; m.innerHTML=''; if(snap.empty)m.innerHTML='<p style="text-align:center;color:#888;padding:20px">🎉 لا توجد رسائل</p>'; else snap.forEach(doc=>{ const d=doc.data(), me=d.senderEmail===user.email, div=document.createElement('div'); div.className='msg'+(me?' me':''); div.innerHTML=`<span class="s">${esc(d.senderName||'مستخدم')}</span><span class="t">${d.timestamp?new Date(d.timestamp.toDate()).toLocaleTimeString('ar-EG'):''}</span><span class="x">${esc(d.text)}</span>`; if(me){const btn=document.createElement('button');btn.textContent='🗑️';btn.style.cssText='float:left;background:none;border:none;cursor:pointer;font-size:12px;opacity:.6';btn.onclick=async()=>{if(confirm('حذف؟'))try{await db.collection('messages').doc(doc.id).delete()}catch{alert('❌ فشل')}};div.appendChild(btn)} m.appendChild(div) }); m.scrollTop=m.scrollHeight },err=>{console.error("❌ دردشة:",err); if($('msgs'))$('msgs').innerHTML=`<p style="color:#c00;text-align:center;padding:20px">❌ ${err.message}</p>`}) }
window.send=async()=>{ const t=$('inp')?.value.trim(); if(!t||!user||!db)return; const b=$('send'); b.disabled=true; b.textContent='...'; try{ await db.collection('messages').add({text:t,senderName:user.displayName||user.email.split('@')[0],senderEmail:user.email,userId:user.uid,timestamp:firebase.firestore.FieldValue.serverTimestamp()}); if($('inp'))$('inp').value=''; }catch{alert('❌ فشل الإرسال')}finally{b.disabled=false;b.textContent='إرسال'} };
function esc(t){const d=document.createElement('div');d.appendChild(document.createTextNode(t||''));return d.innerHTML}

// صفحة انشر
window.switchCode=()=>{ const v=$('var')?.value||'d'; ['d','p'].forEach(x=>{const e=$('code-'+x);if(e)e.style.display=x===v?'':'none'}) };
window.copy=()=>{ const v=$('var')?.value||'d', ta=$('code-'+v); if(!ta)return; ta.focus();ta.select(); try{ document.execCommand('copy')||navigator.clipboard.writeText(ta.value); alert("✅ تم النسخ") }catch{alert("Ctrl+C للنسخ") } };

// صندوق بريدي
window.upd=()=>{ const v=Math.floor(Math.random()*1000)+100, p=Math.floor(Math.random()*200)+10; if($('v'))$('v').textContent=v.toLocaleString('ar-EG'); if($('p'))$('p').textContent=p.toLocaleString('ar-EG'); if($('bar'))$('bar').style.width=Math.min(100,Math.max(5,p/2))+'%'; alert(`✅ مشاهدات: ${v}\n📩 رسائل: ${p}`) };

// إعدادات
window.save=()=>{ const n=$('set-name')?.value.trim(); if(!n)return alert("⚠️ اكتب اسماً"); if($('name'))$('name').textContent=n; alert("✅ تم: "+n) };

// صفحات فرعية
window.subPage=t=>{ show('sub'); const p={posts:'<div class="card"><h3>📩 الرسائل</h3><p>لا توجد رسائل</p></div><a onclick="go(\'dashboard\')">← عودة</a>', archive:'<div class="card"><h3>🗄️ الأرشيف</h3><p>فارغ</p></div><a onclick="go(\'dashboard\')">← عودة</a>'}; $('sub').innerHTML=p[t]||'<p>غير متاح</p>' };

// اختبار
window.test=()=>{ const now=new Date().toLocaleTimeString('ar-EG'); if($('res'))$('res').innerHTML=`✅ يعمل!<br>⏰ ${now}<br>👤 ${user?.email||'غير مسجل'}`; alert("✅ الجافاسكربت يعمل!\n"+now) };

// قوائم منسدلة
document.addEventListener('click',e=>{ const d=$('menu4-c'); if(d?.classList.contains('show')&&!$('menu4').contains(e.target)&&!d.contains(e.target))d.classList.remove('show') });
$('menu4')?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();$('menu4-c')?.classList.toggle('show')});

// بدء
document.addEventListener('DOMContentLoaded', init);
