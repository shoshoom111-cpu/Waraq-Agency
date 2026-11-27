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
    return fetch(URL_, { method: "POST", keepalive: true, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ writes: [w] }) }).catch(function () { return null; });
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

  /* الصفحة تفتح من فوق دائمًا (إلا لو الرابط فيه قسم معيّن مثل #campaigns)، بدل ما يرجّعها المتصفح لآخر مكان */
  try { if ("scrollRestoration" in history) history.scrollRestoration = "manual"; } catch (e) {}
  if (!location.hash) { window.scrollTo(0, 0); window.addEventListener("load", function () { if (!location.hash && window.scrollY > 0 && !document.activeElement.closest("form")) window.scrollTo(0, 0); }); }

  /* الدعم الفني: زر «دعم فني» يفتح نموذج صغير، والرسالة توصل لتبويب «الرسائل» في لوحة الوكالة */
  if (window.parent === window && !/[?&]preview=1/.test(location.search)) (function () {
    var css = ".sup-btn{position:fixed;bottom:18px;left:18px;z-index:9000;display:inline-flex;gap:8px;align-items:center;font-family:var(--display),Tahoma,sans-serif;font-weight:700;font-size:.92rem;background:var(--brand,#0F30B3);color:#fff;border:0;padding:10px 16px;cursor:pointer;box-shadow:0 10px 24px -10px rgba(15,48,179,.6)}"
      + ".sup-btn:hover{background:var(--brand-2,#0B248A)}.sup-btn svg{width:18px;height:18px}"
      + ".sup-dlg{border:0;padding:0;max-width:420px;width:calc(100% - 32px);background:var(--sheet,#fff);color:var(--ink,#16223a);box-shadow:0 30px 60px -20px rgba(22,34,58,.5)}"
      + ".sup-dlg::backdrop{background:rgba(22,34,58,.45)}.sup-dlg form{padding:22px 22px 20px;display:grid;gap:12px}"
      + ".sup-dlg h2{margin:0;font-family:var(--display),Tahoma,sans-serif;font-size:1.25rem}.sup-dlg p{margin:0;color:var(--muted,#56637a);font-size:.92rem}"
      + ".sup-dlg label{display:grid;gap:4px;font-family:var(--display),Tahoma,sans-serif;font-size:.85rem;font-weight:500}"
      + ".sup-dlg input,.sup-dlg textarea{font:inherit;font-size:.95rem;border:1.5px solid var(--rule,#cfd6dc);background:var(--paper,#f3f5f1);padding:8px 10px;color:inherit;width:100%;box-sizing:border-box}"
      + ".sup-dlg input:focus,.sup-dlg textarea:focus{outline:0;border-color:var(--brand,#0F30B3);background:#fff}.sup-dlg textarea{min-height:110px;resize:vertical}"
      + ".sup-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.sup-x{margin-inline-start:auto;background:none;border:1.5px solid var(--rule,#cfd6dc);padding:6px 12px;cursor:pointer;font:inherit}"
      + ".sup-ok{color:var(--ok,#2f7d4f);font-weight:700}.sup-err{color:var(--bad,#a3392b)}.sup-toast{position:fixed;bottom:70px;left:18px;z-index:9001;background:var(--ok,#2f7d4f);color:#fff;font-family:var(--display),Tahoma,sans-serif;font-weight:700;font-size:.9rem;padding:10px 16px;box-shadow:0 10px 24px -10px rgba(0,0,0,.45);transition:opacity .4s}.sup-toast.out{opacity:0}.sup-hp{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}.sup-dlg{overflow-x:hidden;max-height:calc(100dvh - 32px)}@media (max-width:600px){.sup-btn{bottom:12px;left:12px;padding:9px 13px;font-size:.86rem}body{padding-bottom:64px}}";
    var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
    var btn = document.createElement("button"); btn.type = "button"; btn.className = "sup-btn"; btn.setAttribute("aria-haspopup", "dialog");
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 5h16v11H8l-4 4z"/></svg>دعم فني';
    var dlg = document.createElement("dialog"); dlg.className = "sup-dlg"; dlg.setAttribute("aria-labelledby", "sup-h");
    dlg.innerHTML = '<form method="dialog" novalidate><h2 id="sup-h">دعم فني</h2><p>واجهتك مشكلة في الموقع أو عندك سؤال؟ اكتبه هنا، ونرد عليك على جوالك أو بريدك.</p>'
      + '<label>اسمك<input id="sup-name" maxlength="80" autocomplete="name" required></label>'
      + '<label>جوالك أو بريدك<input id="sup-contact" maxlength="120" autocomplete="tel" dir="auto" required></label>'
      + '<label>وش المشكلة أو السؤال؟<textarea id="sup-msg" maxlength="1500" required></textarea></label>'
      + '<label class="sup-hp" aria-hidden="true">اترك هذا فاضي<input id="sup-web" tabindex="-1" autocomplete="off"></label>'
      + '<div class="sup-row"><button type="submit" class="btn" id="sup-go">إرسال</button><span id="sup-out" role="status"></span><button type="button" class="sup-x" id="sup-close">إغلاق</button></div>'
      + '<p style="font-size:.8rem">نستخدم بياناتك للرد عليك بس، كما في <a href="privacy.html">سياسة الخصوصية</a>.</p></form>';
    document.body.appendChild(btn); document.body.appendChild(dlg);
    var $ = function (id) { return document.getElementById(id); };
    btn.addEventListener("click", function () { dlg.querySelector("form").reset(); $("sup-go").disabled = false; $("sup-out").textContent = ""; $("sup-out").className = ""; if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", ""); $("sup-name").focus(); });
    $("sup-close").addEventListener("click", function () { dlg.close ? dlg.close() : dlg.removeAttribute("open"); btn.focus(); });
    dlg.querySelector("form").addEventListener("submit", function (e) {
      e.preventDefault();
      var out = $("sup-out"), name = $("sup-name").value.trim(), contact = $("sup-contact").value.trim(), msg = $("sup-msg").value.trim();
      out.className = "sup-err";
      if (!name) { out.textContent = "اكتب اسمك."; $("sup-name").focus(); return; }
      if (contact.replace(/\D/g, "").length < 9 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) { out.textContent = "اكتب جوال أو بريد صحيح عشان نرد عليك."; $("sup-contact").focus(); return; }
      if (msg.length < 3) { out.textContent = "اكتب رسالتك."; $("sup-msg").focus(); return; }
      if ($("sup-web").value) { out.className = "sup-ok"; out.textContent = "وصلت رسالتك."; return; }
      if (!ok) { out.textContent = "ما قدرنا نرسل الحين. راسلنا على حساباتنا."; return; }
      $("sup-go").disabled = true; out.className = ""; out.textContent = "جارٍ الإرسال…";
      write("messages", rid(), { name: name.slice(0, 80), contact: contact.slice(0, 120), msg: msg.slice(0, 1500), page: page, visitor: vid, state: "new" }, ["at"], true)
        .then(function (r) {
          $("sup-go").disabled = false;
          if (r && r.ok) {
            dlg.querySelector("form").reset(); out.textContent = ""; out.className = "";
            if (dlg.close) dlg.close(); else dlg.removeAttribute("open");
            var tt = document.createElement("div"); tt.className = "sup-toast"; tt.setAttribute("role", "status"); tt.textContent = "وصلت رسالتك، بنرد عليك قريب.";
            document.body.appendChild(tt); setTimeout(function () { tt.classList.add("out"); }, 3500); setTimeout(function () { tt.remove(); }, 4000);
            btn.focus();
          }
          else { out.className = "sup-err"; out.textContent = "ما انرسلت. جرّب مرة ثانية أو راسلنا على حساباتنا."; }
        });
    });
  })();

  /* الموقع مقفل مؤقتًا من لوحة الوكالة */
  if (FB.projectId && FB.apiKey && !/[?&]preview=1/.test(location.search) && window.parent === window) {
    fetch("https://firestore.googleapis.com/v1/" + BASE + "siteSettings/site?key=" + encodeURIComponent(FB.apiKey))
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        var f = (d && d.fields) || {}, closed = !!(f.closed && f.closed.booleanValue), msg = f.msg && f.msg.stringValue || "";
        if (!closed) return;
        if (staff) {
          var bar = document.createElement("div"); bar.setAttribute("role", "status");
          bar.style.cssText = "position:sticky;top:0;z-index:9999;background:#0F30B3;color:#fff;text-align:center;padding:8px 12px;font-size:14px;font-family:inherit";
          bar.textContent = "الموقع مقفل للزوار الحين. تشوفينه لأنك فتحتي لوحة التحكم من هذا الجهاز. تفتحينه من الإعدادات.";
          document.body.insertBefore(bar, document.body.firstChild); return;
        }
        var page = document.createElement("div"); page.id = "closed-page"; page.setAttribute("role", "main");
        page.style.cssText = "position:fixed;inset:0;z-index:99999;background:#f3f5f1;color:#16223a;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px;gap:12px";
        page.innerHTML = '<img src="img/wordmark-blue.png" alt="وكالة رحلة ورق للدعاية والإعلان" style="height:110px;width:auto">'
          + '<h1 style="font-family:\'Noto Kufi Arabic\',Tahoma,sans-serif;font-weight:800;font-size:34px;margin:0;background:linear-gradient(#c9d4f7,#c9d4f7) no-repeat right bottom .1em/100% .42em">الموقع مغلق مؤقتًا</h1><p id="closed-msg" style="font-size:17px;color:#56637a;max-width:520px;margin:0"></p>';
        document.body.appendChild(page);
        document.getElementById("closed-msg").textContent = msg || "نرجع لكم قريب إن شاء الله.";
        document.documentElement.style.overflow = "hidden";
        Array.prototype.forEach.call(document.body.children, function (el) { if (el !== page && el.tagName !== "SCRIPT" && el.tagName !== "STYLE") el.setAttribute("inert", ""); });
        document.title = "الموقع مغلق مؤقتًا — وكالة رحلة ورق للدعاية والإعلان";
      }).catch(function () {});
  }
})();
