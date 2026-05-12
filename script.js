console.log("🚀 بدء تحميل النظام...");

document.addEventListener('DOMContentLoaded', function() {
    try {
        console.log("✅ DOM جاهز");

        // 🔑 تهيئة Firebase مع معالجة الأخطاء
        const firebaseConfig = {
            apiKey: "AIzaSyD_UssZllzECYbTMR_0NCTzEGAIMeZAcos",
            authDomain: "cbox22026.firebaseapp.com",
            projectId: "cbox22026",
            storageBucket: "cbox22026.firebasestorage.app",
            messagingSenderId: "175894881657",
            appId: "1:175894881657:web:ae5e693d843ee594eb7ba8"
        };

        let auth, db;
        try {
            firebase.initializeApp(firebaseConfig);
            auth = firebase.auth();
            db = firebase.firestore();
            console.log("✅ Firebase مهيأ");
        } catch (e) {
            console.error("❌ خطأ في Firebase:", e);
            alert("⚠️ مشكلة في الاتصال بـ Firebase. تأكد من الإنترنت.");
        }

        // 🖥️ تعريف العناصر مع التحقق من وجودها
        const $ = (id) => document.getElementById(id);
        const loginSection = $('login-section');
        const dashboardSection = $('dashboard-section');
        const publishSection = $('publish-section');
        const mailboxSection = $('mailbox-section');
        const settingsSection = $('settings-section');
        const subpageView = $('subpage-view');
        const emailInput = $('email-input');
        const passInput = $('pass-input');
        const authBtn = $('auth-btn');
        const userDisplay = $('user-name-display');
        const chatInput = $('chat-input');
        const chatSendBtn = $('chat-send-btn');
        const messagesList = $('messages-list');
        const testResult = $('test-result');

        let currentUser = null;
        let unsubscribeChat = null;
        let isLoginMode = true;

        // 🔁 مراقبة المصادقة
        if (auth) {
            auth.onAuthStateChanged(user => {
                currentUser = user;
                if (user) {
                    console.log("✅ مستخدم مسجل:", user.email);
                    showSection('dashboard');
                    if (userDisplay) userDisplay.textContent = user.displayName || user.email.split('@')[0];
                    initChat();
                } else {
                    console.log("🔓 غير مسجل");
                    showSection('login');
                }
            }, err => {
                console.error("❌ خطأ في المصادقة:", err);
            });
        }

        // 🧭 دالة التنقل بين الأقسام
        window.navTo = function(name) {
            console.log("🔀 الانتقال إلى:", name);
            if (!currentUser && name !== 'login') {
                alert("⚠️ يرجى تسجيل الدخول أولاً");
                showSection('login');
                return;
            }
            showSection(name);
        };

        function showSection(name) {
            [loginSection, dashboardSection, publishSection, mailboxSection, settingsSection, subpageView].forEach(el => {
                if (el) el.style.display = 'none';
            });
            const sections = {
                'login': loginSection,
                'dashboard': dashboardSection,
                'publish': publishSection,
                'mailbox': mailboxSection,
                'settings': settingsSection,
                'subpage': subpageView
            };
            if (sections[name] && sections[name].style) {
                sections[name].style.display = 'block';
                console.log("✅ عرض القسم:", name);
            }
        }

        // 🔐 تسجيل الدخول / إنشاء حساب
        window.handleAuth = async function() {
            if (!auth) { alert("❌ Firebase غير مهيأ"); return; }
            const email = emailInput?.value.trim();
            const pass = passInput?.value.trim();
            if (!email || !pass) { alert("⚠️ املأ جميع الحقول"); return; }
            if (!email.includes('@')) { alert("⚠️ أدخل بريد إلكتروني صحيح"); return; }

            if (authBtn) { authBtn.disabled = true; authBtn.textContent = 'جاري...'; }
            try {
                if (isLoginMode) {
                    await auth.signInWithEmailAndPassword(email, pass);
                    console.log("✅ تم الدخول");
                } else {
                    await auth.createUserWithEmailAndPassword(email, pass);
                    await db.collection('users').doc(auth.currentUser.uid).set({
                        email, displayName: email.split('@')[0],
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    console.log("✅ تم إنشاء الحساب");
                }
            } catch (err) {
                console.error("❌ خطأ:", err);
                alert("❌ " + (err.message || "حدث خطأ"));
            } finally {
                if (authBtn) { authBtn.disabled = false; authBtn.textContent = isLoginMode ? 'دخول' : 'إنشاء'; }
            }
        };

        window.toggleAuthMode = function() {
            isLoginMode = !isLoginMode;
            if (authBtn) authBtn.textContent = isLoginMode ? 'دخول' : 'إنشاء حساب';
            alert(isLoginMode ? "وضع: تسجيل الدخول" : "وضع: إنشاء حساب");
        };

        // 🚪 تسجيل الخروج
        window.doLogout = function() {
            if (auth) auth.signOut();
            showSection('login');
            console.log("🚪 تم تسجيل الخروج");
        };

        // 💬 الدردشة
        function initChat() {
            if (!db || !currentUser) return;
            console.log("💬 بدء الدردشة...");
            if (messagesList) messagesList.innerHTML = '<p style="text-align:center;color:#888;padding:20px;">جاري التحميل...</p>';
            if (chatInput) chatInput.disabled = false;
            if (chatSendBtn) chatSendBtn.disabled = false;

            unsubscribeChat = db.collection('messages').orderBy('timestamp', 'asc').limit(50).onSnapshot(snapshot => {
                if (!messagesList) return;
                messagesList.innerHTML = '';
                if (snapshot.empty) {
                    messagesList.innerHTML = '<p style="text-align:center;color:#888;padding:20px;">🎉 لا توجد رسائل بعد</p>';
                } else {
                    snapshot.forEach(doc => {
                        const m = doc.data();
                        const isMe = m.senderEmail === currentUser?.email;
                        const div = document.createElement('div');
                        div.className = 'message-item' + (isMe ? ' my-message' : '');
                        div.innerHTML = `<div class="sender">${escapeHtml(m.senderName || 'مستخدم')}</div><span class="time">${m.timestamp ? new Date(m.timestamp.toDate()).toLocaleTimeString('ar-EG') : ''}</span><span class="text">${escapeHtml(m.text)}</span>`;
                        if (isMe) {
                            const btn = document.createElement('button');
                            btn.textContent = '🗑️';
                            btn.style.cssText = 'float:left;background:none;border:none;cursor:pointer;font-size:12px;opacity:0.6;';
                            btn.onclick = async () => {
                                if (confirm('حذف هذه الرسالة؟')) {
                                    try { await db.collection('messages').doc(doc.id).delete(); }
                                    catch (e) { alert('❌ فشل الحذف'); }
                                }
                            };
                            div.appendChild(btn);
                        }
                        messagesList.appendChild(div);
                    });
                }
                if (messagesList) messagesList.scrollTop = messagesList.scrollHeight;
            }, err => {
                console.error("❌ خطأ في الدردشة:", err);
                if (messagesList) messagesList.innerHTML = `<p style="color:#c00;text-align:center;padding:20px;">❌ ${err.message}</p>`;
            });
        }

        window.sendChat = async function() {
            const text = chatInput?.value.trim();
            if (!text || !currentUser || !db) return;
            if (chatSendBtn) { chatSendBtn.disabled = true; chatSendBtn.textContent = '...'; }
            try {
                await db.collection('messages').add({
                    text,
                    senderName: currentUser.displayName || currentUser.email.split('@')[0],
                    senderEmail: currentUser.email,
                    userId: currentUser.uid,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
                if (chatInput) chatInput.value = '';
                console.log("✅ تم إرسال الرسالة");
            } catch (err) {
                console.error("❌ فشل الإرسال:", err);
                alert("❌ فشل إرسال الرسالة");
            } finally {
                if (chatSendBtn) { chatSendBtn.disabled = false; chatSendBtn.textContent = 'إرسال'; }
            }
        };

        function escapeHtml(text) {
            const d = document.createElement('div');
            d.appendChild(document.createTextNode(text || ''));
            return d.innerHTML;
        }

        // 📋 صفحة انشر
        window.switchCode = function() {
            const v = $('variation-select')?.value || 'default';
            document.querySelectorAll('[id^="cboxcode_"]').forEach(ta => {
                if (ta) ta.style.display = (ta.id === 'cboxcode_' + v) ? '' : 'none';
            });
            console.log("🔄 تم تبديل الكود إلى:", v);
        };

        window.copyCode = function() {
            const v = $('variation-select')?.value || 'default';
            const ta = $('cboxcode_' + v);
            if (!ta) return;
            ta.focus(); ta.select();
            try {
                if (!document.execCommand('copy')) {
                    navigator.clipboard.writeText(ta.value);
                }
                alert("✅ تم نسخ الكود!");
                console.log("📋 تم نسخ الكود");
            } catch (e) {
                alert("اضغط على الكود ثم اضغط Ctrl+C للنسخ");
            }
        };

        // 📦 صفحة صندوق بريدي
        window.updateStats = function() {
            const views = Math.floor(Math.random() * 1000) + 100;
            const posts = Math.floor(Math.random() * 200) + 10;
            if ($('stat-views')) $('stat-views').textContent = views.toLocaleString('ar-EG');
            if ($('stat-posts')) $('stat-posts').textContent = posts.toLocaleString('ar-EG');
            if ($('stat-bar')) {
                const percent = Math.min(100, Math.max(5, posts / 2));
                $('stat-bar').style.width = percent + '%';
            }
            console.log("📊 تم تحديث الإحصائيات:", { views, posts });
            alert(`✅ المشاهدات: ${views}\n📩 الرسائل: ${posts}`);
        };

        // ⚙️ الإعدادات
        window.saveSettings = function() {
            const name = $('settings-name')?.value.trim();
            if (!name) { alert("⚠️ اكتب اسماً"); return; }
            if (userDisplay) userDisplay.textContent = name;
            alert("✅ تم حفظ الاسم: " + name);
            console.log("⚙️ تم حفظ الاسم:", name);
        };

        // 🧪 اختبار الجافاسكربت
        window.testJS = function() {
            const time = new Date().toLocaleTimeString('ar-EG');
            if (testResult) {
                testResult.innerHTML = `✅ الجافاسكربت يعمل! <br>⏰ الوقت: ${time} <br>👤 المستخدم: ${currentUser?.email || 'غير مسجل'}`;
            }
            console.log("🧪 اختبار ناجح - الوقت:", time);
            alert("✅ الجافاسكربت يعمل!\nالوقت: " + time);
        };

        // 📋 القوائم المنسدلة
        const dropdowns = [
            { trigger: $('hovmenu4'), content: $('hovmenu4-content') }
        ];
        dropdowns.forEach(({ trigger, content }) => {
            if (!trigger || !content) return;
            trigger.addEventListener('click', function(e) {
                e.preventDefault(); e.stopPropagation();
                const isOpen = content.classList.toggle('show');
                console.log("📋 القائمة:", isOpen ? 'فتحت' : 'أغلقت');
            });
        });
        document.addEventListener('click', function(e) {
            dropdowns.forEach(({ content }) => {
                if (content && content.classList.contains('show') && !content.contains(e.target)) {
                    content.classList.remove('show');
                }
            });
        });

        // 🎉 رسالة نجاح نهائية
        console.log("✅ النظام جاهز تماماً!");
        if (testResult) testResult.innerHTML = "✅ النظام جاهز! اضغط على زر الاختبار للتأكد.";

    } catch (err) {
        console.error("❌❌❌ خطأ فادح في النظام:", err);
        document.body.innerHTML = `<div style="padding:20px;text-align:center;color:#c00;">
            <h2>❌ حدث خطأ في النظام</h2>
            <p style="font-size:12px;">${err.message}</p>
            <p style="font-size:11px;color:#666;">افتح F12 ← Console لمزيد من التفاصيل</p>
            <button onclick="location.reload()" style="margin-top:10px;padding:8px 20px;">إعادة التحميل</button>
        </div>`;
    }
});
