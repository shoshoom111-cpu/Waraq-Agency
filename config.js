/* إعدادات موقع وكالة ورق — هذا هو الملف الوحيد اللي تحتاجين تعدّلينه.
   الخطوات كاملة في ملف: إعداد-فايربيس.md */
window.WARAQ = {
  // رقم واتساب الوكالة بالصيغة الدولية بدون + أو أصفار، مثال: "9665XXXXXXXX"
  // إذا بقي فارغًا تختفي أزرار الواتساب.
  whatsapp: "",

  // من Firebase Console ← Project settings ← Your apps ← Web app ← SDK setup and configuration (Config)
  // إذا بقي فارغًا يشتغل الموقع بدون قاعدة بيانات (الطلب يُنسخ أو يُرسل بالواتساب فقط).
  firebase: {
    apiKey: "AIzaSyB3WysocwvDsMeVU5Xoss0Sr4c-4EVB5C8",
    authDomain: "waraq-agency.firebaseapp.com",
    projectId: "waraq-agency",
    storageBucket: "waraq-agency.firebasestorage.app",
    messagingSenderId: "586474991423",
    appId: "1:586474991423:web:04c5ab37eeb72166b46d8a"
  }
};
