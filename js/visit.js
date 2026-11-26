/* زوار الموقع وطلبات الخدمة غير المكتملة — تنحفظ في قاعدة البيانات (book-campaigns) وتظهر في صفحة الطلبات في لوحة الوكالة.
   - الزائر = متصفح واحد بمعرّف مجهول، والصفحة تنحسب مرة وحدة في الجلسة.
   - ما ننحسب: برامج البحث ومعاينات الروابط، ووضع المعاينة في لوحة التحكم، وأجهزة فريق الوكالة (أي جهاز فتح لوحة التحكم).
   - نموذج الطلب: اللي ينكتب ينحفظ أول بأول كـ«طلب غير مكتمل»، وينعلَّم «اكتمل» لما ينرسل الطلب. */
(function () {
  "use strict";
  var FB = (window.WARAQ || {}).firebase || {};
  var ok = FB.projectId && FB.apiKey && !/[?&]preview=1/.test(location.search) && window.parent === window;
  var bot = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegram|twitterbot|preview|lighthouse|headless|pingdom|monitor/i.test(navigator.userAgent || "") || !!navigator.webdriver;
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  var staff = get("waraq-staff") === "1";
  var vid = get("waraq-vid");
  if (!vid) { vid = Math.random().toString(36).slice(2, 10) + Date.now().toString(36); try { localStorage.setItem("waraq-vid", vid); } catch (e) { vid = ""; } }
  var src = (function () {
    var u = (location.search.match(/[?&]utm_source=([^&#]+)/) || [])[1], r = "";
    try { r = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, "") : ""; } catch (e) {}
    if (r === location.hostname.replace(/^www\./, "")) r = "";
    try { u = u ? decodeURIComponent(u) : ""; } catch (e) { u = ""; }
    return String(u || r || "direct").toLowerCase().slice(0, 60);
  })();
  var device = (window.innerWidth || 1024) < 1024 ? "mobile" : "desktop";
  var BASE = "projects/" + FB.projectId + "/databases/(default)/documents/";
  var URL_ = "https://firestore.googleapis.com/v1/" + BASE.slice(0, -1) + ":commit?key=" + encodeURIComponent(FB.apiKey);

  function val(v) {
    if (Array.isArray(v)) return { arrayValue: { values: v.slice(0, 20).map(function (x) { return { stringValue: String(x).slice(0, 200) }; }) } };
    if (typeof v === "boolean") return { booleanValue: v };
    if (typeof v === "number") return { integerValue: String(Math.round(v)) };
    return { stringValue: String(v) };
  }
  /* كتابة وحدة: مستند جديد أو تحديثه، والوقت من الخادم */
  function write(col, id, data, timeFields, mustBeNew) {
    var fields = {};
    Object.keys(data).forEach(function (k) { if (data[k] !== undefined && data[k] !== null) fields[k] = val(data[k]); });
    var w = { update: { name: BASE + col + "/" + id, fields: fields }, updateTransforms: (timeFields || []).map(function (f) { return { fieldPath: f, setToServerValue: "REQUEST_TIME" }; }) };
    if (mustBeNew) w.currentDocument = { exists: false };
    else w.updateMask = { fieldPaths: Object.keys(fields) };
    return fetch(URL_, { method: "POST", keepalive: true, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ writes: [w] }) }).catch(function () {});
  }
  function rid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 12); }

  /* زيارة الصفحة */
  var page = /request/.test(location.pathname) ? "request" : /privacy/.test(location.pathname) ? "privacy" : "home";
  if (ok && !bot && !staff) {
    var seen = "waraq-seen:" + page, fresh = true;
    try { fresh = !sessionStorage.getItem(seen); sessionStorage.setItem(seen, "1"); } catch (e) {}
    if (fresh) write("visits", rid(), { page: page, visitor: vid, src: src, device: device }, ["at"], true);
  }

  /* طلب غير مكتمل: معرّف واحد لكل جلسة تعبئة */
  var draftId = null, timer = null, last = "", started = false;
  try { draftId = sessionStorage.getItem("waraq-draft"); } catch (e) {}
  function draft(data) {
    if (!ok || bot || staff || !data) return;
    if (!String(data.name || "").trim() && String(data.phone || "").replace(/\D/g, "").length < 6) return;   // ما ننحفظ قبل ما يكتب اسمه أو جواله
    var s = JSON.stringify(data); if (s === last) return; last = s;
    clearTimeout(timer);
    timer = setTimeout(function () {
      if (!draftId) { draftId = rid(); try { sessionStorage.setItem("waraq-draft", draftId); } catch (e) {} }
      var d = { visitor: vid, src: src, device: device, done: false };
      Object.keys(data).forEach(function (k) { d[k] = data[k]; });
      write("drafts", draftId, d, started ? ["at"] : ["at", "startedAt"], false);
      started = true;
    }, 1200);
  }
  /* بعد ما ينرسل الطلب: نعلّم المسودة إنها اكتملت (وتختفي من «غير مكتملة») */
  function done(requestId) {
    clearTimeout(timer);
    if (!ok || !draftId) return;
    write("drafts", draftId, { done: true, requestId: String(requestId || "").slice(0, 40) }, ["at"], false);
    try { sessionStorage.removeItem("waraq-draft"); } catch (e) {}
    draftId = null; last = ""; started = false;
  }
  window.WaraqTrack = { visitor: vid, draft: draft, done: done };

  /* الموقع مقفل مؤقتًا من لوحة الوكالة */
  if (FB.projectId && FB.apiKey && !/[?&]preview=1/.test(location.search) && window.parent === window) {
    fetch("https://firestore.googleapis.com/v1/" + BASE + "siteSettings/site?key=" + encodeURIComponent(FB.apiKey))
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        var f = (d && d.fields) || {}, closed = !!(f.closed && f.closed.booleanValue), msg = f.msg && f.msg.stringValue || "";
        if (!closed) return;
        if (staff) {
          var bar = document.createElement("div"); bar.setAttribute("role", "status");
          bar.style.cssText = "position:sticky;top:0;z-index:9999;background:#16223a;color:#fff;text-align:center;padding:8px 12px;font-size:14px;font-family:inherit";
          bar.textContent = "الموقع مقفل للزوار الحين. تشوفينه لأنك فتحتي لوحة التحكم من هذا الجهاز. تفتحينه من الإعدادات.";
          document.body.insertBefore(bar, document.body.firstChild); return;
        }
        var page = document.createElement("div"); page.id = "closed-page"; page.setAttribute("role", "main");
        page.style.cssText = "position:fixed;inset:0;z-index:99999;background:#f3f5f1;color:#16223a;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px;gap:12px";
        page.innerHTML = '<img src="img/wordmark-blue.png" alt="وكالة رحلة ورق للدعاية والإعلان" style="height:110px;width:auto">'
          + '<h1 style="font-family:\'Noto Kufi Arabic\',Tahoma,sans-serif;font-weight:800;font-size:34px;margin:0;background:linear-gradient(#ffd84a,#ffd84a) no-repeat right bottom .1em/100% .42em">الموقع مغلق مؤقتًا</h1><p id="closed-msg" style="font-size:17px;color:#56637a;max-width:520px;margin:0"></p>';
        document.body.appendChild(page);
        document.getElementById("closed-msg").textContent = msg || "نرجع لكم قريب إن شاء الله.";
        document.documentElement.style.overflow = "hidden";
        document.title = "الموقع مغلق مؤقتًا — وكالة رحلة ورق للدعاية والإعلان";
      }).catch(function () {});
  }
})();
