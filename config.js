/* إعدادات موقع وكالة ورق — هذا هو الملف الوحيد اللي تحتاجين تعدّلينه. */
window.WARAQ = {
  // رقم واتساب الوكالة بالصيغة الدولية بدون + أو أصفار، مثال: "9665XXXXXXXX"
  // إذا بقي فارغًا تختفي أزرار الواتساب.
  whatsapp: "",

  // الطلبات تُحفظ في قاعدة بيانات لوحة المسوقين (مشروع book-campaigns)،
  // وتظهر في تبويب «الطلبات» في اللوحة: https://book-campaigns.web.app/admin.html
  // مفتاح reCAPTCHA العام لحماية App Check (مو سري)
  appCheckKey: "6LfeGTUuAAAAAFBtOssabYYkJ7vN1V12Od1dw-ur",

  firebase: {
    apiKey: "AIzaSyBp3h0ovlP8jUXPFwHKujeZ0g1vBBkdIVw",
    authDomain: "book-campaigns.firebaseapp.com",
    projectId: "book-campaigns",
    storageBucket: "book-campaigns.firebasestorage.app",
    messagingSenderId: "6782912085",
    appId: "1:6782912085:web:ef51ec401aa2c2733a76dc"
  }
};
