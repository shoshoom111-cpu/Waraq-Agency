/* سياسة الخصوصية: النص ينكتب من لوحة التحكم (siteContent/privacy) بتنسيق بسيط:
   «## عنوان» = عنوان قسم، «- نص» = نقطة في قائمة، **نص** = خط عريض، سطر فاضي = فقرة جديدة. الروابط (https://… أو wa.me/…) تصير قابلة للضغط.
   WaraqPolicy.html(text) يحوّل النص لـ HTML آمن. في صفحة privacy.html يجيب النص المحفوظ ويعرضه بدل النص الأصلي اللي في الصفحة. */
(function () {
  "use strict";
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function inline(t) {
    var s = esc(t).replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
    return s.replace(/(https?:\/\/[^\s<]+|\bwa\.me\/\d+|[\w.+-]+@[\w-]+\.[\w.]+)/g, function (u) {
      var href = /@/.test(u) && !/^https?:/.test(u) ? "mailto:" + u : /^https?:/.test(u) ? u : "https://" + u;
      return '<a href="' + href + '" dir="ltr" target="_blank" rel="noopener">' + u + "</a>";
    });
  }
  function html(text) {
    var out = [], list = null, para = [];
    function flushP() { if (para.length) { out.push("<p>" + para.map(inline).join("<br>") + "</p>"); para = []; } }
    function flushL() { if (list) { out.push("<ul>" + list.map(function (x) { return "<li>" + inline(x) + "</li>"; }).join("") + "</ul>"); list = null; } }
    String(text || "").replace(/\r/g, "").split("\n").forEach(function (raw) {
      var l = raw.trim();
      if (!l) { flushP(); flushL(); return; }
      var h = l.match(/^#{1,3}\s*(.+)$/), li = l.match(/^[-•*]\s+(.+)$/);
      if (h) { flushP(); flushL(); out.push("<h2>" + inline(h[1]) + "</h2>"); }
      else if (li) { flushP(); (list = list || []).push(li[1]); }
      else { flushL(); para.push(l); }
    });
    flushP(); flushL();
    return out.join("\n");
  }
  /* النص الأصلي اللي في الصفحة → نفس التنسيق، عشان المحرر يبدأ منه */
  function fromDOM(root) {
    var lines = [];
    function txt(el) { var c = el.cloneNode(true); Array.prototype.forEach.call(c.querySelectorAll("b,strong"), function (b) { b.replaceWith("**" + b.textContent + "**"); }); return c.textContent.replace(/\s+/g, " ").trim(); }
    Array.prototype.forEach.call(root.children, function (el) {
      if (/^H[1-6]$/.test(el.tagName)) { lines.push("", "## " + txt(el)); }
      else if (el.tagName === "UL" || el.tagName === "OL") { Array.prototype.forEach.call(el.children, function (li) { lines.push("- " + txt(li)); }); lines.push(""); }
      else if (el.tagName === "P") { lines.push(txt(el), ""); }
    });
    return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  }
  window.WaraqPolicy = { html: html, fromDOM: fromDOM };

  // صفحة سياسة الخصوصية نفسها
  var box = document.getElementById("policy");
  if (!box) return;
  var FB = (window.WARAQ || {}).firebase || {};
  if (!FB.projectId || !FB.apiKey) return;
  var url = "https://firestore.googleapis.com/v1/projects/" + FB.projectId + "/databases/(default)/documents/siteContent/privacy?key=" + encodeURIComponent(FB.apiKey);
  (window.WaraqAC ? WaraqAC.headers({}) : Promise.resolve({})).then(function (h) { return fetch(url, { cache: "no-store", headers: h }); })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) {
      var j = d && d.fields && d.fields.json && d.fields.json.stringValue; if (!j) return;
      var p = JSON.parse(j); if (!p || !String(p.text || "").trim()) return;
      box.innerHTML = html(p.text);
      var dt = document.getElementById("pol-date"); if (dt) { dt.textContent = p.updated ? "آخر تحديث: " + p.updated : ""; dt.hidden = !p.updated; }
    }).catch(function () { });
})();
