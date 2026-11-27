/* حماية App Check (reCAPTCHA): كل طلب لقاعدة البيانات من صفحات الوكالة يحمل «إثبات» إنه من الموقع الحقيقي، مو من برنامج.
   - WaraqAC.app()      تطبيق Firebase الوحيد في الصفحة (مع App Check)، تستخدمه نماذج الطلب والانضمام ولوحة التحكم.
   - WaraqAC.headers(h) يضيف ترويسة X-Firebase-AppCheck لطلبات REST (محتوى الصفحة، الزيارات، الدعم الفني).
   لو reCAPTCHA ما اشتغل (مانع إعلانات مثلًا) الطلب يمشي بدون إثبات، وقاعدة البيانات تقرر حسب إعدادات الفرض. */
(function () {
  "use strict";
  var CFG = window.WARAQ || {}, FB = CFG.firebase || {}, KEY = CFG.appCheckKey || "";
  var SDK = "https://www.gstatic.com/firebasejs/10.12.2/", boot = null;
  function start() {
    if (!boot) boot = Promise.all([import(SDK + "firebase-app.js"), import(SDK + "firebase-app-check.js")]).then(function (m) {
      var A = m[0], C = m[1], app = A.getApps().length ? A.getApp() : A.initializeApp(FB), ac = null;
      if (KEY && !/[?&]preview=1/.test(location.search)) {
        try { ac = C.initializeAppCheck(app, { provider: new C.ReCaptchaEnterpriseProvider(KEY), isTokenAutoRefreshEnabled: true }); } catch (e) { }
      }
      return { app: app, ac: ac, C: C };
    });
    return boot;
  }
  function token() {
    var t = start().then(function (x) { return x.ac ? x.C.getToken(x.ac, false).then(function (r) { return r.token; }) : null; }).catch(function () { return null; });
    return Promise.race([t, new Promise(function (r) { setTimeout(function () { r(null); }, 5000); })]);
  }
  window.WaraqAC = {
    app: function () { return start().then(function (x) { return x.app; }); },
    token: token,
    headers: function (h) { h = h || {}; return token().then(function (t) { if (t) h["X-Firebase-AppCheck"] = t; return h; }); }
  };
})();
