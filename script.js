// 🔥 ملف script.js - نسخة اختبار بسيطة
document.addEventListener('DOMContentLoaded', function() {
    console.log("✅ script.js تم تحميله بنجاح!");
    
    // تهيئة Firebase
    const firebaseConfig = {
        apiKey: "AIzaSyD_UssZllzECYbTMR_0NCTzEGAIMeZAcos",
        authDomain: "cbox22026.firebaseapp.com",
        projectId: "cbox22026",
        storageBucket: "cbox22026.firebasestorage.app",
        messagingSenderId: "175894881657",
        appId: "1:175894881657:web:ae5e693d843ee594eb7ba8",
        measurementId: "G-0BP0P4KWL8"
    };
    
    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        console.log("✅ Firebase مهيأ");
    }
    
    // اختبار بسيط: تغيير نص شريط الحالة
    const errorBar = document.getElementById('siteErrorBarCont');
    if (errorBar) {
        errorBar.textContent = "النظام يعمل! 🚀";
    }
});
