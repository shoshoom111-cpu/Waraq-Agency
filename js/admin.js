/* إدارة موقع وكالة ورق: الطلبات، تعديل الصفحة الأساسية، تعديل صفحة الطلبات، السجل والنسخ، الإعدادات */
const FBC = (window.WARAQ || {}).firebase || {};
const WC = window.WaraqContent;
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
const toAr = (n) => String(n);
const GATES = ["g-config","g-login","g-noadmin"];
const VIEWS = { requests:"v-requests", home:"v-editor", form:"v-editor", history:"v-history", settings:"v-settings" };
function gate(id) { GATES.forEach(g => $(g).hidden = g !== id); document.querySelectorAll(".view").forEach(v => v.hidden = true); $("appnav").hidden = true; }
let toastT;
function toast(t) { const el = $("toast"); el.textContent = t; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => el.hidden = true, 3500); }
function arm(btn, msg) {
  if (btn.dataset.armed === "1") return true;
  btn.dataset.armed = "1"; btn.classList.add("armed"); toast(msg);
  setTimeout(() => { if (btn.isConnected) { btn.dataset.armed = ""; btn.classList.remove("armed"); } }, 4000);
  return false;
}
const ICON = {
  up:'<svg viewBox="0 0 24 24"><path d="M6 15l6-6 6 6"/></svg>', down:'<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>',
  eye:'<svg viewBox="0 0 24 24"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  off:'<svg viewBox="0 0 24 24"><path d="M3 3l18 18M10.6 6.1A10 10 0 0 1 12 6c6 0 10 6 10 6a17 17 0 0 1-3.2 3.8M6.6 6.6C3.8 8.4 2 12 2 12s4 7 10 7c1.6 0 3-.4 4.3-1"/></svg>',
  del:'<svg viewBox="0 0 24 24"><path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13"/></svg>'
};
if (!(FBC.apiKey && FBC.projectId && FBC.appId)) { gate("g-config"); throw new Error("config"); }

const SDK = "https://www.gstatic.com/firebasejs/10.12.2/";
const [{ initializeApp }, A, F] = await Promise.all([import(SDK + "firebase-app.js"), import(SDK + "firebase-auth.js"), import(SDK + "firebase-firestore.js")]);
const app = window.WaraqAC ? await window.WaraqAC.app() : initializeApp(FBC);   // نفس التطبيق مع حماية App Check
const auth = A.getAuth(app); auth.languageCode = "ar";
const db = F.getFirestore(app);

/* =============== sign in =============== */
const lmsg = (t, ok) => { $("login-msg").textContent = t; $("login-msg").className = "msg " + (ok ? "ok" : "err"); };
$("g-login").addEventListener("submit", async (e) => {
  e.preventDefault(); const btn = $("login-btn"); lmsg("");
  if (!$("em").value || !$("pw").value) return lmsg("اكتبي البريد وكلمة المرور.");
  btn.disabled = true; btn.textContent = "جارٍ الدخول…";
  try { await A.signInWithEmailAndPassword(auth, $("em").value.trim(), $("pw").value); }
  catch (err) { const c = err.code || "";
    lmsg(c.includes("invalid-credential") || c.includes("wrong-password") || c.includes("user-not-found") ? "البريد أو كلمة المرور غير صحيحة. جرّبي «نسيت كلمة المرور؟»." :
      c.includes("too-many-requests") ? "محاولات كثيرة. انتظري دقائق وجرّبي مرة ثانية." : c.includes("network") ? "ما فيه اتصال بالإنترنت." : "تعذّر تسجيل الدخول (" + c + ")."); }
  finally { btn.disabled = false; btn.textContent = "دخول"; }
});
$("forgot").addEventListener("click", async () => {
  const em = $("em").value.trim();
  if (!/^\S+@\S+\.\S+$/.test(em)) return lmsg("اكتبي بريدك أولًا، ثم اضغطي «نسيت كلمة المرور؟».");
  try { await A.sendPasswordResetEmail(auth, em); lmsg("إذا كان البريد مسجّلًا، وصلك رابط لتغيير كلمة المرور. شيّكي على البريد المزعج كمان.", true); }
  catch { lmsg("تعذّر الإرسال. تأكدي من البريد وحاولي بعد قليل."); }
});
$("logout").addEventListener("click", () => {
  if (anyDirty() && !confirm("عندك تعديلات ما انحفظت. تبين تطلعين؟")) return;
  A.signOut(auth);
});

let USER = null, unsubs = [];
A.onAuthStateChanged(auth, (user) => {
  unsubs.forEach(u => u()); unsubs = []; USER = user;
  $("me").hidden = !user;
  if (!user) { gate("g-login"); return; }
  GATES.forEach(g => $(g).hidden = true); $("appnav").hidden = false;
  try { localStorage.setItem("waraq-staff", "1"); } catch (e) {}
  startRequests(); loadSettings(); route();
});

/* =============== routing =============== */
let VIEW = null;
function route() {
  if (!USER) return;
  let v = location.hash.slice(1); if (!VIEWS[v]) v = "requests";
  VIEW = v;
  document.querySelectorAll(".view").forEach(el => el.hidden = el.id !== VIEWS[v]);
  document.querySelectorAll(".appnav a").forEach(a => { if (a.dataset.view === v) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
  $("frame").classList.toggle("wide", v === "home" || v === "form");
  if (v === "home") openEditor("home"); else if (v === "form") openEditor("request");
  if (v === "history") loadHistory();
  if (v === "settings") { renderTeam(); renderTpl(); loadAgr(); }
}
window.addEventListener("hashchange", route);

/* =============== requests =============== */
const STATES = [["new","جديد"],["approved","مقبول"],["rejected","مرفوض"]];
const SNAME = Object.fromEntries(STATES);
const RF = {
  requests: [["who","الصفة"],["phone","الجوال"],["email","البريد"],["book","الكتاب"],["genre","النوع"],["status","حالة الكتاب"],["date","الموعد المهم"],["where","يُباع في"],["link","رابط"],["picks","الخدمات"],["pkg","الحملة الجاهزة"],["budget","الميزانية"],["notes","تفاصيل"]],
  joinRequests: [["handle","الحساب"],["phone","الجوال"],["platforms","المنصات"],["genre","نوع الكتب"],["views","متوسط المشاهدات"],["price","السعر للمقطع"],["license","رخصة موثوق"]]
};
const fmt = new Intl.DateTimeFormat("ar-u-ca-gregory-nu-latn", { dateStyle: "medium", timeStyle: "short" });
const when = (d) => d && d.toDate ? fmt.format(d.toDate()) : "الآن";
const txt = (v) => Array.isArray(v) ? v.join("، ") : (v ?? "");
const RQ = { requests: [], joinRequests: [] }, RQL = { requests: false, joinRequests: false };
/* قبلتيه وانتقل للوحة المسوقين: يبقى «جديد» هناك عشان تكمّلين الموافقة فيها */
const eff = (d) => d.agencyOk && d.state === "new" ? "approved" : d.state;
/* مراحل طلب الخدمة الخمس: استلام ← قبول/رفض ← التسعير في الحاسبة (والعميل يوافق أو يعتذر) ← التجهيز ← الاكتمال.
   نفس الدالة موجودة في لوحة المسوقين والحاسبة. الطلبات القديمة: «مقبول» = قيد التجهيز. */
const STAGES = [["new","جديد"],["pricing","بالتسعير"],["prep","قيد التجهيز"],["done","مكتمل"],["rejected","مرفوض"],["refused","العميل اعتذر"]];
const STNAME = Object.fromEntries(STAGES);
const stageOf = (d) => d.stage || (d.state === "rejected" ? "rejected" : d.state === "approved" ? "prep" : d.agencyOk ? "pricing" : "new");
const stOf = (d) => col === "requests" ? stageOf(d) : d.state;
const stLabel = (d) => col === "requests" ? (stageOf(d) === "pricing" && d.quote && !d.answer ? "بانتظار رد العميل" : STNAME[stageOf(d)]) : SNAME[d.state];
const legacyState = (st) => st === "new" ? "new" : st === "rejected" || st === "refused" ? "rejected" : "approved";
const CALC_URL = "https://book-campaigns.web.app/calc.html";
const money = (n) => Number(n || 0).toLocaleString("ar-SA") + " ر.س";
function stepperHTML(d) {
  const st = stageOf(d), t = d.times || {}, dt = (x) => x && x.toDate ? fmt.format(x.toDate()) : "";
  const at = { new: 1, pricing: 2, prep: 3, done: 5, rejected: 1, refused: 2 }[st];
  const steps = [["استلمنا الطلب", dt(d.createdAt)], ["قبلناه", dt(t.accepted)], ["التسعير وموافقة العميل", dt(t.answered)], ["التجهيز", dt(t.prep)], ["اكتمل", dt(t.done)]];
  const stop = st === "rejected" ? 1 : st === "refused" ? 2 : -1;
  return `<ol class="stepper">` + steps.map(([l, w], i) => {
    const cls = i === stop ? "stop" : i < at ? "done" : i === at ? "cur" : "";
    const lab = i === stop ? (st === "rejected" ? "رفضناه" : "العميل اعتذر") : l;
    return `<li class="${cls}"><i>${i < at && i !== stop ? "✓" : toAr(i + 1)}</i><b>${esc(lab)}</b>${w && i !== stop ? `<small class="num">${esc(w)}</small>` : ""}</li>`;
  }).join("") + `</ol>`;
}
let EXEC = {};
const EXEC_DOC = () => F.doc(db, "siteSettings", "executors");
let PEOPLE = [], TPL = {};
const TPL_DEF = {
  customer: "السلام عليكم {الاسم}،\nوصلنا طلبك من موقع {الوكالة}، ونراجعه ونتواصل معك قريب.",
  join: "أهلًا {الاسم}،\nوصلنا طلب انضمامك لشبكة مسوقي {الوكالة}.",
  joinOk: "أهلًا {الاسم}،\nتم قبولك في شبكة مسوقي {الوكالة}، أهلًا فيك.\n\nرمزك: {الرمز}\nلما تنشر عن كتاب، أرسل روابط النشر من هنا:\n{الرابط}",
  exec: "السلام عليكم {المنفذ}،\nعندنا طلب جديد من {الوكالة}:\n\n{التفاصيل}\n\nللتنسيق تواصل معنا."
};
const agency = () => { try { return (JSON.parse(ED.home.pub || "{}").brand || {}).name || "الوكالة"; } catch { return "الوكالة"; } };
const fill = (t, v) => String(t || "").replace(/\{([^{}]+)\}/g, (m, k) => (k in v ? v[k] : m)).replace(/\n{3,}/g, "\n\n").trim();
async function loadExec(strict) { try { const s = await F.getDoc(EXEC_DOC()), x = s.exists() ? s.data() : {}; EXEC = x.map || {}; PEOPLE = Array.isArray(x.people) ? x.people : []; TPL = x.tpl || {}; } catch (err) { if (strict) throw err; EXEC = {}; PEOPLE = []; TPL = {}; } }
const person = (id) => PEOPLE.find(p => p.id === id);
/* نموذج الطلب المنشور (مو المسودة): منه نعرف الخدمات ومنفذيها */
let PUBD = null;
const pubReq = () => { try { return prep("request", ED.request.pub || JSON.stringify(WC.defaults("request"))); } catch { return null; } };
/* الخدمة: الاسم الحالي، ومرجعها الثابت (رقم الحقل/رقم الخيار) عشان تغيير الاسم ما يقطع توجيهها */
function svcOption(D, kind, val) {
  for (const f of reqFields(D)) {
    if (!Array.isArray(f.options)) continue;
    if (kind === "id" && f.type !== "svclist") continue;
    if (kind === "name" && f.key !== "picks" && f.type !== "svclist") continue;
    const o = f.options.find(o => o && (kind === "id" ? o.id === val : String(o.t || "").trim() === val));
    if (o) return { name: String(o.t).trim(), ref: f.id + "/" + o.id, dash: !!o.dash };
  }
  return null;
}
/* كل خدمة في الطلب ومين ينفذها */
function routesOf(d, D) {
  D = D || PUBD; const seen = new Set(), out = [];
  const asg = d.assign || {};
  const add = (name, det, hit) => { name = String((hit && hit.name) || name || "").trim(); if (!name || seen.has(name)) return; seen.add(name);
    const who = person(asg[name]), kind = hit && hit.dash ? "dash" : who ? "person" : "me";
    out.push({ name, det: det || "", kind, who }); };
  (d.services || []).forEach(x => add(x.s, x.d, D && (svcOption(D, "id", x.id) || svcOption(D, "name", String(x.s || "").trim()))));
  (d.picks || []).forEach(p => add(p, "", D && svcOption(D, "name", String(p || "").trim())));
  return out;
}
function execMsg(d, items, who) {
  const det = execDetails(d, items);
  return fill(TPL.exec || TPL_DEF.exec, { "المنفذ": (who && who.name) || "", "الوكالة": agency(), "التفاصيل": det, "الاسم": d.name || "", "الكتاب": d.book || "" });
}
function execDetails(d, items) {
  const head = [];
  items.forEach(r => { head.push("الخدمة: " + r.name); if (r.det) head.push("المطلوب: " + r.det); head.push(""); });
  [["الكتاب", d.book], ["النوع", d.genre], ["حالة الكتاب", d.status], ["الموعد", d.date], ["الرابط", d.link]].forEach(([l, v]) => { if (v) head.push(l + ": " + v); });
  return head.join("\n").trim();
}
const waNum = (v) => { let n = String(v || "").replace(/\D/g, ""); if (n.startsWith("00")) n = n.slice(2); if (n.startsWith("05") && n.length === 10) n = "966" + n.slice(1); return n; };
function sendExecEmail(to, d, items) {
  return fetch("https://formsubmit.co/ajax/" + to, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({ _subject: "طلب خدمة: " + items.map(r => r.name).join("، "), _template: "box", _captcha: "false", message: execMsg(d, items, items[0] && items[0].who) }) })
    .then(r => r.json().catch(() => ({}))).then(j => String(j.success) === "true" ? "ok" : /activat/i.test(j.message || "") ? "activate" : "fail").catch(() => "fail");
}
function routesHTML(d) {
  const rs = routesOf(d); if (!rs.length) return "";
  const done = ["prep", "done"].includes(stageOf(d));
  const opts = (sel) => `<option value="">أنا (بدون إرسال)</option>` + PEOPLE.map(p => `<option value="${esc(p.id)}"${p.id === sel ? " selected" : ""}>${esc(p.name)}${p.role ? " — " + esc(p.role) : ""}</option>`).join("");
  return `<div class="routes"><h4>${done ? "الخدمات ومنفذينها <small>(كلّمي المنفذ وأرسلي له لما يوافق)</small>" : "كل خدمة لمين؟ <small>(تقدرين تختارين الحين، والإرسال يكون في مرحلة التجهيز)</small>"}</h4>` + rs.map(r => {
    if (r.kind === "dash") return `<div class="route"><b>${esc(r.name)}</b><span class="to">← لوحة المسوقين</span></div>`;
    const sel = r.who ? r.who.id : "";
    let act = "";
    if (done && r.who) {
      const n = waNum(r.who.phone);
      if (n.length >= 10) act += `<button class="btn sm" type="button" data-wa="${n}" data-wato="${esc(r.who.name + (r.who.role ? " — " + r.who.role : ""))}" data-wam="${esc(execMsg(d, [r], r.who))}">إرسال بالواتساب</button>`;
      if (r.who.email) act += `<button class="btn line sm" type="button" data-resend="${esc(d.id)}" data-svc="${esc(r.name)}">إرسال بالإيميل</button>`;
    }
    return `<div class="route"><b>${esc(r.name)}</b><select data-assign data-id="${esc(d.id)}" data-svc="${esc(r.name)}" aria-label="منفذ ${esc(r.name)}">${opts(sel)}</select>${act}</div>`;
  }).join("") + (PEOPLE.length ? "" : `<p class="hint">أضيفي الفريق من «الإعدادات» عشان يطلعون هنا.</p>`) + `</div>`;
}
/* اختيارات المنفذين الظاهرة في الطلب المفتوح (حتى لو ما وصل حفظها لسا) */
function liveAssign(d) {
  const a = { ...(d.assign || {}) };
  document.querySelectorAll(`[data-assign][data-id="${esc(d.id)}"]`).forEach(el => { a[el.dataset.svc] = el.value; });
  return a;
}
async function approve(d) {
  let D;
  try {
    const [s] = await Promise.all([F.getDoc(F.doc(db, "siteContent", "request")), loadExec(true)]);
    D = prep("request", s.exists() && s.data().json ? s.data().json : JSON.stringify(WC.defaults("request"))); PUBD = D;
  } catch (err) { toast("ما قدرت أحمّل الإعدادات، فما قبلت الطلب. تأكدي من الاتصال وجرّبي مرة ثانية."); return; }
  const assign = liveAssign(d), dd = { ...d, assign };
  const rs = routesOf(dd, D), toDash = rs.some(r => r.kind === "dash");
  await F.updateDoc(F.doc(db, "requests", d.id), { assign, dash: toDash, stage: "pricing", state: "approved", "times.accepted": F.serverTimestamp(), handledAt: F.serverTimestamp() });
  toast("قُبل الطلب وانتقل للتسعير. افتحيه في الحاسبة وسعّريه.");
}
/* قبول طلب انضمام مسوق من هنا: يصير مسوق في لوحة المسوقين (marketers) برمز يرسل فيه روابطه (codes). نفس طريقة لوحة المسوقين. */
const MK_URL = "https://book-campaigns.web.app/";
const ALPHA = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const PNAMES = ["إنستقرام", "تيك توك", "إكس", "سناب شات", "يوتيوب", "فيسبوك", "ثريدز"];
const cleanH = (h) => String(h || "").trim().replace(/^@/, "").toLowerCase();
function newCode(ms) { let c; do { c = ""; for (let i = 0; i < 6; i++) c += ALPHA.charAt(Math.floor(Math.random() * ALPHA.length)); } while (ms.some(m => m.code === c)); return c; }
async function approveJoin(d) {
  const snap = await F.getDocs(F.collection(db, "marketers"));
  const ms = snap.docs.map(x => ({ ...x.data(), id: x.id }));
  const nm = String(d.name || "").trim(), h = String(d.handle || "").trim();
  const ex = ms.find(m => String(m.name || "").trim() === nm);
  const notes = ["انضم عبر موقع الوكالة.", d.genre ? "نوع الكتب: " + d.genre : "", d.views ? "متوسط المشاهدات: " + d.views : "", d.price ? "السعر للمقطع: " + d.price + " ريال" : "", d.license ? "رخصة موثوق: " + d.license : ""].filter(Boolean).join("\n");
  const m = ex ? { ...ex } : { id: "x" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7), name: nm, phone: d.phone || "", accounts: [], code: newCode(ms), active: true, address: "", iban: "", notes: "" };
  m.accounts = Array.isArray(m.accounts) ? m.accounts.slice() : [];
  (d.platforms || []).forEach(p => { if (PNAMES.includes(p) && !m.accounts.some(a => a.p === p && cleanH(a.h) === cleanH(h))) m.accounts.push({ p, h }); });
  if (!m.phone && d.phone) m.phone = d.phone;
  m.notes = m.notes ? m.notes + "\n" + notes : notes;
  const batch = F.writeBatch(db);
  batch.set(F.doc(db, "marketers", m.id), JSON.parse(JSON.stringify(m)));
  if (!ex) batch.set(F.doc(db, "codes", m.code), { m: m.id, name: m.name, active: true, bookIds: [], books: [] });
  batch.update(F.doc(db, "joinRequests", d.id), { state: "approved", marketerId: m.id, code: m.code, handledAt: F.serverTimestamp() });
  await batch.commit();
  toast(ex ? `قُبل الطلب. «${m.name}» موجود من قبل في لوحة المسوقين، وانضافت حساباته له.` : `قُبل «${m.name}» وصار مسوق في لوحة المسوقين برمز ${m.code}. أرسلي له رمزه من «رسالة القبول».`);
}
function welcomeMsg(d) {
  return fill(TPL.joinOk || TPL_DEF.joinOk, { "الاسم": d.name || "", "الوكالة": agency(), "الرمز": d.code || "", "الرابط": MK_URL });
}
let col = "requests", filter = "all", query = "", openId = null;
function startRequests() {
  loadExec(); loadContent("home").catch(() => {}); loadContent("request").then(() => { PUBD = pubReq(); if (VIEW === "requests") renderReq(); }).catch(() => {});
  Object.keys(RQ).forEach(c => {
    const q = F.query(F.collection(db, c), F.orderBy("createdAt", "desc"), F.limit(1000));
    unsubs.push(F.onSnapshot(q, (snap) => {
      RQ[c] = snap.docs.map(d => ({ id: d.id, ...d.data({ serverTimestamps: "estimate" }) })); RQL[c] = true;
      document.querySelector(`[data-count="${c}"]`).textContent = toAr(RQ[c].filter(x => c === "requests" ? stageOf(x) === "new" : x.state === "new").length);
      const n = RQ.requests.filter(x => stageOf(x) === "new").length + RQ.joinRequests.filter(x => x.state === "new").length;
      $("nav-new").hidden = !n; $("nav-new").textContent = toAr(n);
      if (c === col) renderReq();
    }, (err) => {
      if (err.code === "permission-denied") { gate("g-noadmin"); $("me").hidden = false; return; }
      RQL[c] = true; if (c === col) reqEmpty("تعذّر تحميل الطلبات", err.code || err.message);
    }));
  });
  startExtra();
}

/* =============== الطلبات غير المكتملة والزوار =============== */
const EX = { drafts: [], visits: [], dl: false, vl: false, derr: "", verr: "" };
const DAY = 864e5, ago = (ms) => new Date(Date.now() - ms);
const tsd = (t) => t && t.toDate ? t.toDate() : null;
function startExtra() {
  unsubs.push(F.onSnapshot(F.query(F.collection(db, "drafts"), F.orderBy("at", "desc"), F.limit(500)), (snap) => {
    EX.drafts = snap.docs.map(d => ({ id: d.id, ...d.data({ serverTimestamps: "estimate" }) })); EX.dl = true; EX.derr = "";
    const old = EX.drafts.filter(d => tsd(d.at) && tsd(d.at) < ago(30 * DAY));   // ننظف بعد ٣٠ يوم، مثل ما في سياسة الخصوصية
    old.forEach(d => F.deleteDoc(F.doc(db, "drafts", d.id)).catch(() => {}));
    const n = openDrafts().length; document.querySelector('[data-count="drafts"]').textContent = toAr(n);
    if (col === "drafts" || col === "visits") renderReq();
  }, (err) => { EX.dl = true; EX.derr = err.code || err.message; if (col === "drafts") renderReq(); }));
  unsubs.push(F.onSnapshot(F.query(F.collection(db, "messages"), F.orderBy("at", "desc"), F.limit(500)), (snap) => {
    EX.msgs = snap.docs.map(d => ({ id: d.id, ...d.data({ serverTimestamps: "estimate" }) })); EX.ml = true; EX.merr = "";
    const n = EX.msgs.filter(m => m.state === "new").length; document.querySelector('[data-count="messages"]').textContent = toAr(n);
    if (col === "messages") renderReq();
  }, (err) => { EX.ml = true; EX.merr = err.code || err.message; if (col === "messages") renderReq(); }));
  unsubs.push(F.onSnapshot(F.query(F.collection(db, "visits"), F.where("at", ">=", F.Timestamp.fromDate(ago(30 * DAY))), F.orderBy("at", "desc"), F.limit(10000)), (snap) => {
    EX.visits = snap.docs.map(d => d.data({ serverTimestamps: "estimate" })); EX.vl = true; EX.verr = "";
    if (col === "visits") renderReq();
  }, (err) => { EX.vl = true; EX.verr = err.code || err.message; if (col === "visits") renderReq(); }));
}
/* غير مكتمل = ما انرسل، وآخر كتابة فيه قبل ١٠ دقايق على الأقل (عشان ما يطلع اللي يعبّي الحين) */
const openDrafts = () => EX.drafts.filter(d => !d.done && tsd(d.at) && tsd(d.at) < ago(10 * 60e3));
const since = (d) => { if (!d) return ""; const m = Math.round((Date.now() - d) / 60e3); return m < 60 ? "قبل " + m + " دقيقة" : m < 1440 ? "قبل " + Math.round(m / 60) + " ساعة" : "قبل " + Math.round(m / 1440) + " يوم"; };
function renderDrafts() {
  $("chips").innerHTML = ""; $("loading").hidden = EX.dl; if (!EX.dl) { $("list").innerHTML = ""; $("empty").hidden = true; return; }
  if (EX.derr) return reqEmpty("تعذّر تحميل الطلبات غير المكتملة", EX.derr);
  const all = openDrafts().filter(d => !query || JSON.stringify(Object.values(d)).toLowerCase().includes(query));
  if (!all.length) return reqEmpty("ما فيه طلبات غير مكتملة", "لما أحد يكتب اسمه أو جواله في نموذج الطلب وما يرسله، يظهر هنا بعد ١٠ دقايق، عشان تتواصلين معه.");
  $("empty").hidden = true;
  $("list").innerHTML = all.map(d => {
    const n = waNum(d.phone), open = openId === d.id;
    const hi = "السلام عليكم" + (d.name ? " " + d.name : "") + "، معك " + agency() + ". لاحظنا إنك بديت طلب خدمة" + (d.book ? " لكتاب «" + d.book + "»" : "") + " وما اكتمل. نقدر نساعدك تكمله أو نجاوب على أي سؤال؟";
    const det = open ? `<div class="detail" id="d-${esc(d.id)}"><dl>
      <dt>آخر كتابة</dt><dd class="num">${esc(when(d.at))} (${esc(since(tsd(d.at)))})</dd>
      ${d.who ? `<dt>الصفة</dt><dd>${esc(d.who)}</dd>` : ""}${d.phone ? `<dt>الجوال</dt><dd class="num">${esc(d.phone)}</dd>` : ""}${d.email ? `<dt>البريد</dt><dd>${esc(d.email)}</dd>` : ""}
      ${d.book ? `<dt>الكتاب</dt><dd>${esc(d.book)}</dd>` : ""}${d.pkg ? `<dt>الحملة الجاهزة</dt><dd>${esc(d.pkg)}</dd>` : ""}${d.services ? `<dt>الخدمات</dt><dd>${esc(d.services)}</dd>` : ""}${d.budget ? `<dt>الميزانية</dt><dd>${esc(d.budget)}</dd>` : ""}
      <dt>جاء من</dt><dd>${esc(srcName(d.src))} · ${d.device === "mobile" ? "جوال" : "كمبيوتر"}</dd></dl>
      <div class="acts">${n.length >= 10 ? `<button class="btn sm" type="button" data-wa="${n}" data-wato="${esc(d.name || "")}" data-wam="${esc(hi)}">راسليه بالواتساب</button><a class="btn line sm" href="tel:+${n}">اتصال</a>` : ""}
      <button class="btn danger sm" type="button" data-ddel="${esc(d.id)}">حذف</button></div></div>` : "";
    return `<li class="item${open ? " open" : ""}"><button class="row" type="button" data-open="${esc(d.id)}" aria-expanded="${open}" aria-controls="d-${esc(d.id)}">
      <span class="nm">${esc(d.name || d.phone || "بدون اسم")}</span><span class="sm">${esc([d.book && "«" + d.book + "»", d.services || d.pkg, (d.filled || 0) + " خانات معبّاة"].filter(Boolean).join(" · "))}</span><span class="pill" data-s="new">غير مكتمل</span><span class="dt num">${esc(since(tsd(d.at)))}</span>
    </button>${det}</li>`;
  }).join("");
}
/* رسائل «دعم فني» */
function renderMsgs() {
  $("chips").innerHTML = ""; $("loading").hidden = !!EX.ml; if (!EX.ml) { $("list").innerHTML = ""; $("empty").hidden = true; return; }
  if (EX.merr) return reqEmpty("تعذّر تحميل الرسائل", EX.merr);
  const all = (EX.msgs || []).filter(m => !query || JSON.stringify(Object.values(m)).toLowerCase().includes(query));
  if (!all.length) return reqEmpty("ما فيه رسائل", "لما أحد يرسل من زر «دعم فني» في الموقع تظهر رسالته هنا.");
  $("empty").hidden = true;
  $("list").innerHTML = all.map(m => {
    const open = openId === m.id, n = waNum(m.contact), mail = /@/.test(m.contact || "");
    const det = open ? `<div class="detail" id="d-${esc(m.id)}"><dl><dt>التاريخ</dt><dd class="num">${esc(when(m.at))}</dd><dt>للتواصل</dt><dd dir="auto">${esc(m.contact || "")}</dd><dt>من صفحة</dt><dd>${esc(({ home: "الرئيسية", request: "صفحة الطلب", privacy: "الخصوصية" })[m.page] || m.page || "")}</dd></dl>
      <p style="white-space:pre-wrap;margin:10px 0 14px;line-height:1.9">${esc(m.msg || "")}</p>
      <div class="acts">${!mail && n.length >= 10 ? `<button class="btn sm" type="button" data-wa="${n}" data-wato="${esc(m.name || "")}" data-wam="${esc("أهلًا " + (m.name || "") + "، معك " + agency() + ". بخصوص رسالتك: ")}">رد بالواتساب</button>` : ""}${mail ? `<a class="btn sm" href="mailto:${esc(m.contact)}?subject=${encodeURIComponent("رد من " + agency())}">رد بالبريد</a>` : ""}
      ${m.state === "new" ? `<button class="btn line sm" type="button" data-mdone="${esc(m.id)}">تم الرد</button>` : `<button class="btn line sm" type="button" data-mnew="${esc(m.id)}">رجّعها جديدة</button>`}
      <button class="btn danger sm" type="button" data-mdel="${esc(m.id)}">حذف</button></div></div>` : "";
    return `<li class="item${open ? " open" : ""}"><button class="row" type="button" data-open="${esc(m.id)}" aria-expanded="${open}" aria-controls="d-${esc(m.id)}">
      <span class="nm">${esc(m.name || "بدون اسم")}</span><span class="sm">${esc(String(m.msg || "").slice(0, 90))}</span><span class="pill" data-s="${m.state === "new" ? "new" : "approved"}">${m.state === "new" ? "جديدة" : "تم الرد"}</span><span class="dt num">${esc(when(m.at))}</span>
    </button>${det}</li>`;
  }).join("");
}
const SRC = { direct: "مباشر (رابط محفوظ أو مكتوب)", "google.com": "قوقل", "google.com.sa": "قوقل", "bing.com": "بينق", "t.co": "إكس (تويتر)", "x.com": "إكس (تويتر)", "instagram.com": "انستقرام", "l.instagram.com": "انستقرام", "facebook.com": "فيسبوك", "m.facebook.com": "فيسبوك", "l.facebook.com": "فيسبوك", "tiktok.com": "تيك توك", "snapchat.com": "سناب شات", "linkedin.com": "لينكدإن", "youtube.com": "يوتيوب", "waraqmagazine.com": "مجلة ورق", "book-campaigns.web.app": "لوحة المسوقين" };
const srcName = (s) => SRC[s] || (/google\./.test(s || "") ? "قوقل" : s || "غير معروف");
function renderVisits() {
  $("chips").innerHTML = ""; $("loading").hidden = EX.vl; $("empty").hidden = true; if (!EX.vl) { $("list").innerHTML = ""; return; }
  if (EX.verr) return reqEmpty("تعذّر تحميل الزوار", EX.verr);
  const V = EX.visits.filter(v => tsd(v.at)), day = (d) => d.toISOString().slice(0, 10), today = day(new Date());
  const uniq = (list) => new Set(list.map(v => v.visitor)).size;
  const inDays = (n) => V.filter(v => tsd(v.at) >= ago(n * DAY));
  const t1 = V.filter(v => day(tsd(v.at)) === today), reqPage = V.filter(v => v.page === "request");
  const sent = RQ.requests.filter(d => tsd(d.createdAt) && tsd(d.createdAt) >= ago(30 * DAY) && d.source !== "dash").length;
  const started = EX.drafts.filter(d => tsd(d.startedAt || d.at) && tsd(d.startedAt || d.at) >= ago(30 * DAY)).length;
  const u30 = uniq(V), pct = (a, b) => b ? Math.round(a * 100 / b) + "٪" : "—";
  const byDay = {}; V.forEach(v => { const k = day(tsd(v.at)); (byDay[k] = byDay[k] || new Set()).add(v.visitor); });
  const days = []; for (let i = 29; i >= 0; i--) { const k = day(ago(i * DAY)); days.push([k, byDay[k] ? byDay[k].size : 0]); }
  const max = Math.max(1, ...days.map(x => x[1]));
  const firstSeen = {}; V.forEach(v => { if (!firstSeen[v.visitor] || tsd(v.at) < firstSeen[v.visitor].t) firstSeen[v.visitor] = { t: tsd(v.at), v }; });
  const count = (list, key) => { const m = {}; list.forEach(x => { const k = key(x); m[k] = (m[k] || 0) + 1; }); return Object.entries(m).sort((a, b) => b[1] - a[1]); };
  const bars = (rows, name) => { const tot = rows.reduce((s, r) => s + r[1], 0) || 1; return rows.slice(0, 8).map(([k, n]) => `<div class="vbar"><span>${esc(name(k))}</span><u style="width:${Math.max(3, Math.round(n * 100 / tot))}%"></u><span class="n num">${toAr(n)}</span></div>`).join("") || '<p class="dmeta">ما فيه بيانات بعد.</p>'; };
  const firsts = Object.values(firstSeen).map(x => x.v);
  const stat = (n, l, s) => `<div class="vstat"><b class="num">${n}</b><span>${l}</span>${s ? `<small>${s}</small>` : ""}</div>`;
  $("list").innerHTML = `<li style="list-style:none">
    <p class="vnote">الأرقام للزوار الحقيقيين في آخر ٣٠ يوم: كل متصفح ينحسب زائر واحد مهما فتح صفحات. ما ننحسب برامج البحث ومعاينات الروابط، ولا أجهزتك وأجهزة الفريق اللي فتحت لوحة التحكم.</p>
    <div class="vstats">${stat(uniq(t1), "زوار اليوم")}${stat(uniq(inDays(7)), "زوار آخر ٧ أيام")}${stat(u30, "زوار آخر ٣٠ يوم")}${stat(uniq(reqPage), "فتحوا صفحة الطلب", pct(uniq(reqPage), u30) + " من الزوار")}${stat(started, "بدوا يعبّون الطلب")}${stat(sent, "أرسلوا طلب", pct(sent, uniq(reqPage)) + " من اللي فتحوا صفحة الطلب")}${stat(openDrafts().length, "طلبات غير مكتملة", "تلقينها في تبويب «غير مكتملة»")}</div>
    <div class="vcard" style="margin-bottom:14px"><h3>الزوار يوميًا — آخر ٣٠ يوم</h3><div class="vchart">${days.map(([k, n]) => `<i style="height:${Math.round(n * 100 / max)}%" title="${k}: ${n} زائر"></i>`).join("")}</div><div class="vaxis"><span class="num">${days[0][0]}</span><span>اليوم</span></div></div>
    <div class="vgrid">
      <div class="vcard"><h3>من وين جوا</h3>${bars(count(firsts, v => srcName(v.src)), x => x)}</div>
      <div class="vcard"><h3>الأجهزة</h3>${bars(count(firsts, v => v.device === "mobile" ? "جوال" : "كمبيوتر"), x => x)}</div>
      <div class="vcard"><h3>الصفحات (زوار)</h3>${bars(count([...new Map(V.map(v => [v.visitor + "|" + v.page, v])).values()], v => ({ home: "الصفحة الرئيسية", request: "صفحة الطلب", privacy: "الخصوصية" })[v.page] || v.page), x => x)}</div>
    </div></li>`;
}
document.querySelectorAll(".tabs button").forEach(b => b.addEventListener("click", () => selectTab(b)));
document.querySelector(".tabs").addEventListener("keydown", (e) => {
  if (!["ArrowLeft","ArrowRight"].includes(e.key)) return;
  const tabs = [...document.querySelectorAll(".tabs button")], i = tabs.findIndex(b => b.getAttribute("aria-selected") === "true");
  const other = tabs[(i + (e.key === "ArrowLeft" ? 1 : tabs.length - 1)) % tabs.length]; selectTab(other); other.focus();
});
function selectTab(b) { document.querySelectorAll(".tabs button").forEach(x => { const on = x === b; x.setAttribute("aria-selected", on); x.tabIndex = on ? 0 : -1; }); col = b.dataset.col; filter = "all"; openId = null; renderReq(); }
$("q").addEventListener("input", (e) => { query = e.target.value.trim().toLowerCase(); renderReq(); });
$("chips").addEventListener("click", (e) => { const b = e.target.closest("[data-f]"); if (!b) return; filter = b.dataset.f; openId = null; renderReq(); });
function matches(d) {
  const st = stOf(d);
  if (filter === "closed") { if (st !== "rejected" && st !== "refused") return false; }
  else if (filter !== "all" && st !== filter) return false;
  if (!query) return true;
  return JSON.stringify(Object.values(d)).toLowerCase().includes(query);
}
function summary(d) {
  return col === "requests" ? [d.dash === true ? "لوحة المسوقين" : "", d.who, d.book && "«" + d.book + "»", txt([...(d.services || []).map(x => x.s), ...(d.picks || [])])].filter(Boolean).join(" · ")
    : [d.handle, txt(d.platforms), d.price && d.price + " ريال"].filter(Boolean).join(" · ");
}
function contactLinks(d) {
  let out = "";
  if (d.phone) {
    let n = String(d.phone).replace(/\D/g, "");
    if (n.startsWith("00")) n = n.slice(2);
    if (n.startsWith("05") && n.length === 10) n = "966" + n.slice(1); else if (n.startsWith("5") && n.length === 9) n = "966" + n;
    const hi = fill(col === "requests" ? (TPL.customer || TPL_DEF.customer) : (TPL.join || TPL_DEF.join), { "الاسم": d.name || "", "الكتاب": d.book || "", "الوكالة": agency(), "الخدمات": [...(d.services || []).map(x => x.s), ...(d.picks || [])].join("، ") });
    out += `<button class="btn sm" type="button" data-wa="${n}" data-wato="${esc(d.name || "")}" data-wam="${esc(hi)}">واتساب</button>`;
  }
  if (d.email) out += `<a class="btn line sm" href="mailto:${esc(d.email)}">بريد</a>`;
  return out;
}
function rows(d) {
  return [...RF[col].filter(([k]) => txt(d[k]) !== ""), ...(d.services || []).map(x => [null, "خدمة: " + x.s, x.d || "—"]), ...(d.answers || []).map(a => [null, a.l, a.v])]
    .map(r => r[0] === null ? [r[1], r[2]] : [r[1], txt(d[r[0]])]);
}
function reqDetail(d) {
  if (col === "requests") return svcDetail(d);
  const st = d.state;
  const decide = st === "new"
    ? (col === "joinRequests" ? `<button class="btn sm" type="button" data-joinok="${esc(d.id)}">قبول وإضافته للمسوقين</button>` : `<button class="btn sm" type="button" data-accept="${esc(d.id)}">قبول</button>`) + `<button class="btn danger sm" type="button" data-reject="${esc(d.id)}">رفض</button>`
    : (col === "joinRequests" && st === "approved" && waNum(d.phone).length >= 10 ? `<button class="btn sm" type="button" data-wa="${waNum(d.phone)}" data-wato="${esc(d.name || "")}" data-wam="${esc(welcomeMsg(d))}">رسالة القبول بالواتساب</button>` : "") +
      (col === "joinRequests" && st === "approved" ? `<a class="btn line sm" href="${MK_URL}admin.html" target="_blank" rel="noopener">فتح لوحة المسوقين</a>` : "") +
      (d.agencyOk && d.state === "new" ? `<a class="btn line sm" href="https://book-campaigns.web.app/admin.html" target="_blank" rel="noopener">كمّلي في لوحة المسوقين</a>` : "") + `<button class="btn danger sm" type="button" data-del="${esc(d.id)}">حذف</button>`;
  return `<div class="detail" id="d-${esc(d.id)}"><dl><dt>التاريخ</dt><dd class="num">${esc(when(d.createdAt))}</dd><dt>الحالة</dt><dd>${esc(SNAME[st] || st || "")}${d.agencyOk && d.state === "new" ? " · بانتظار لوحة المسوقين" : ""}</dd>
    ${rows(d).map(([l, v]) => `<dt>${esc(l)}</dt><dd>${esc(v)}</dd>`).join("")}</dl>
    <div class="side"><div class="acts">${contactLinks(d)}<button class="btn line sm" type="button" data-copy="${esc(d.id)}">نسخ الطلب</button></div>
      <div class="field"><label for="nt-${esc(d.id)}">ملاحظة داخلية <small>(تظهر في لوحة المسوقين بعد)</small></label><textarea id="nt-${esc(d.id)}" maxlength="2000" placeholder="عرض السعر، موعد المكالمة…">${esc(d.adminNote || "")}</textarea></div>
      <div class="acts"><button class="btn sm" type="button" data-save="${esc(d.id)}">حفظ الملاحظة</button><span class="saved" aria-live="polite"></span></div>
      ${col === "requests" ? routesHTML(d) : ""}
      <div class="acts" style="margin-top:16px">${decide}</div></div></div>`;
}
/* تفاصيل طلب خدمة: المراحل، والأزرار حسب المرحلة */
function svcDetail(d) {
  const st = stageOf(d), q = d.quote, B = (stage, label, cls = "line") => `<button class="btn ${cls} sm" type="button" data-stage="${stage}" data-id="${esc(d.id)}">${label}</button>`;
  let act = "";
  if (st === "new") act = `<button class="btn sm" type="button" data-accept="${esc(d.id)}">قبول</button><button class="btn danger sm" type="button" data-reject="${esc(d.id)}">رفض</button>`;
  if (st === "pricing") act = `<a class="btn sm" href="${CALC_URL}?req=${esc(d.id)}" target="_blank" rel="noopener">افتحيه في الحاسبة</a>`;
  if (st === "prep") act = B(d.dash && !d.bookId ? "done-nobook" : "done", "اكتمل الطلب", "") + (d.dash ? `<a class="btn line sm" href="${MK_URL}admin.html" target="_blank" rel="noopener">لوحة المسوقين</a>` : "") + B("pricing", "رجّعيه للتسعير");
  if (st === "done") act = B("prep", "رجّعيه للتجهيز");
  if (st === "rejected") act = B("new", "رجّعيه جديد");
  if (st === "refused") act = B("pricing", "افتحيه للتسعير من جديد");
  const qrow = st === "pricing" ? `<dt>التسعير</dt><dd>في الحاسبة: السعر ورد العميل يتسجّلون هناك</dd>` : "";
  return `<div class="detail" id="d-${esc(d.id)}">${stepperHTML(d)}<dl><dt>التاريخ</dt><dd class="num">${esc(when(d.createdAt))}</dd><dt>المرحلة</dt><dd>${esc(stLabel(d))}</dd>${qrow}
    ${d.answerNote ? `<dt>سبب الاعتذار</dt><dd>${esc(d.answerNote)}</dd>` : ""}
    ${rows(d).map(([l, v]) => `<dt>${esc(l)}</dt><dd>${esc(v)}</dd>`).join("")}</dl>
    <div class="side"><div class="acts">${contactLinks(d)}<button class="btn line sm" type="button" data-copy="${esc(d.id)}">نسخ الطلب</button></div>
      <div class="field"><label for="nt-${esc(d.id)}">ملاحظة داخلية <small>(تظهر في لوحة المسوقين بعد)</small></label><textarea id="nt-${esc(d.id)}" maxlength="2000" placeholder="موعد المكالمة، اتفاق المنفذ…">${esc(d.adminNote || "")}</textarea></div>
      <div class="acts"><button class="btn sm" type="button" data-save="${esc(d.id)}">حفظ الملاحظة</button><span class="saved" aria-live="polite"></span></div>
      ${routesHTML(d)}
      <div class="acts" style="margin-top:16px">${act}<button class="btn danger sm" type="button" data-del="${esc(d.id)}">حذف</button></div></div></div>`;
}
function reqEmpty(h, p) { $("loading").hidden = true; $("list").innerHTML = ""; $("empty").hidden = false; $("empty-h").textContent = h; $("empty-p").textContent = p; }
function renderReq() {
  $("q").hidden = col === "visits"; $("csv").hidden = col === "drafts" || col === "visits" || col === "messages";
  if (col === "drafts") return renderDrafts();
  if (col === "messages") return renderMsgs();
  if (col === "visits") return renderVisits();
  const all = RQ[col];
  const chip = (key, label, n) => `<button type="button" data-f="${key}" aria-pressed="${filter === key}">${label} <span class="num">${toAr(n)}</span></button>`;
  $("chips").innerHTML = chip("all", "الكل", all.length) + (col === "requests"
    ? [["new", "جديد"], ["pricing", "بالتسعير"], ["prep", "قيد التجهيز"], ["done", "مكتمل"]].map(([k, l]) => chip(k, l, all.filter(d => stageOf(d) === k).length)).join("") + chip("closed", "مقفل", all.filter(d => ["rejected", "refused"].includes(stageOf(d))).length)
    : STATES.map(([k, l]) => chip(k, l, all.filter(d => d.state === k).length)).join(""));
  if (!RQL[col]) { $("loading").hidden = false; $("list").innerHTML = ""; $("empty").hidden = true; return; }
  $("loading").hidden = true;
  const items = all.filter(matches);
  if (!all.length) return reqEmpty(col === "requests" ? "ما فيه طلبات خدمة بعد" : "ما فيه طلبات انضمام بعد", "أول ما يرسل أحد طلبًا من الموقع يظهر هنا وفي لوحة المسوقين.");
  if (!items.length) return reqEmpty("ما فيه نتائج", "غيّري الكلمة أو الحالة المختارة.");
  $("empty").hidden = true;
  $("list").innerHTML = items.map(d => `<li class="item${openId === d.id ? " open" : ""}"><button class="row" type="button" data-open="${esc(d.id)}" aria-expanded="${openId === d.id}" aria-controls="d-${esc(d.id)}">
    <span class="nm">${esc(d.name || "بدون اسم")}</span><span class="sm">${esc(summary(d))}</span><span class="pill" data-s="${esc(stOf(d) || "")}">${esc(stLabel(d) || "—")}</span><span class="dt num">${esc(when(d.createdAt))}</span>
    </button>${openId === d.id ? reqDetail(d) : ""}</li>`).join("");
}
$("list").addEventListener("click", async (e) => {
  const md = e.target.closest("[data-mdone],[data-mnew]");
  if (md) { const id = md.dataset.mdone || md.dataset.mnew; try { await F.updateDoc(F.doc(db, "messages", id), { state: md.dataset.mdone ? "done" : "new" }); } catch (err) { toast("ما انحفظ: " + (err.code || err.message)); } return; }
  const mx = e.target.closest("[data-mdel]");
  if (mx) { if (!arm(mx, "اضغطي «حذف» مرة ثانية للتأكيد.")) return; try { await F.deleteDoc(F.doc(db, "messages", mx.dataset.mdel)); toast("انحذفت الرسالة."); } catch (err) { toast("ما انحذفت: " + (err.code || err.message)); } return; }
  const dd = e.target.closest("[data-ddel]");
  if (dd) { if (!arm(dd, "اضغطي «حذف» مرة ثانية للتأكيد.")) return; try { await F.deleteDoc(F.doc(db, "drafts", dd.dataset.ddel)); toast("انحذف."); } catch (err) { toast("ما انحذف: " + (err.code || err.message)); } return; }
  const o = e.target.closest("[data-open]");
  if (o) { openId = openId === o.dataset.open ? null : o.dataset.open; renderReq(); document.querySelector(`[data-open="${o.dataset.open}"]`)?.focus(); return; }
  const s = e.target.closest("[data-save]");
  if (s) { const id = s.dataset.save, m = s.parentNode.querySelector(".saved"); s.disabled = true; m.textContent = "";
    try { await F.updateDoc(F.doc(db, col, id), { adminNote: $("nt-" + id).value.trim() }); m.className = "saved"; m.textContent = "تم الحفظ."; }
    catch (err) { m.className = "saved err"; m.textContent = "ما انحفظ: " + (err.code || err.message); } finally { s.disabled = false; } return; }
  const ac = e.target.closest("[data-accept]");
  if (ac) { const d = RQ[col].find(x => x.id === ac.dataset.accept); ac.disabled = true;
    try { await approve(d); } catch (err) { toast("ما انحفظ: " + (err.code || err.message)); } finally { ac.disabled = false; } return; }
  const jo = e.target.closest("[data-joinok]");
  if (jo) { const d = RQ.joinRequests.find(x => x.id === jo.dataset.joinok); if (!d) return; jo.disabled = true; jo.textContent = "جارٍ القبول…";
    try { await approveJoin(d); } catch (err) { toast("ما انقبل: " + (err.code || err.message)); jo.disabled = false; jo.textContent = "قبول وإضافته للمسوقين"; } return; }
  const rs = e.target.closest("[data-resend]");
  if (rs) { const d = RQ[col].find(x => x.id === rs.dataset.resend), r = routesOf(d).find(x => x.name === rs.dataset.svc); if (!r || !r.who || !r.who.email) return;
    rs.disabled = true; const res = await sendExecEmail(r.who.email, d, [r]); rs.disabled = false;
    toast(res === "ok" ? "انرسل." : res === "activate" ? "المنفذ لازم يفعّل FormSubmit من الإيميل اللي وصله أول." : "ما انرسل. تأكدي من الإيميل والاتصال."); return; }
  const rj = e.target.closest("[data-reject]");
  if (rj) { if (!arm(rj, "اضغطي «رفض» مرة ثانية للتأكيد.")) return;
    try { await F.updateDoc(F.doc(db, col, rj.dataset.reject), col === "requests" ? { stage: "rejected", state: "rejected", "times.closed": F.serverTimestamp(), handledAt: F.serverTimestamp() } : { state: "rejected", handledAt: F.serverTimestamp() }); } catch (err) { toast("ما انحفظ: " + (err.code || err.message)); } return; }
  const sg = e.target.closest("[data-stage]");
  if (sg) {
    const d = RQ.requests.find(x => x.id === sg.dataset.id); let to = sg.dataset.stage; if (!d) return;
    const msg = { prep: "اضغطي مرة ثانية: العميل وافق والطلب يروح للتجهيز. (الحاسبة تضيفه في «الحسابات» أول ما تنفتح)", refused: "اضغطي مرة ثانية: العميل اعتذر ويتقفل الطلب.", done: "اضغطي مرة ثانية: الطلب اكتمل.", "done-nobook": "انتبهي: الكتاب ما انضاف في لوحة المسوقين بعد. اضغطي مرة ثانية لو تبين تعلّمينه مكتمل.", pricing: "اضغطي مرة ثانية: الطلب يرجع للتسعير.", new: "اضغطي مرة ثانية: الطلب يرجع «جديد» وتقبلينه أو ترفضينه من جديد." }[to] || "اضغطي مرة ثانية للتأكيد.";
    if (to === "done-nobook") to = "done";
    if (!arm(sg, msg)) return;
    const ts = F.serverTimestamp(), from = stageOf(d), up = { stage: to, state: legacyState(to) };
    if (to === "prep" && from === "pricing") Object.assign(up, { answer: "yes", "times.answered": ts, "times.prep": ts });
    else if (to === "prep") up["times.prep"] = ts;
    if (to === "refused") Object.assign(up, { answer: "no", "times.answered": ts, "times.closed": ts });
    if (to === "done") up["times.done"] = ts;
    if (to === "pricing") { up.answer = F.deleteField(); up.answerNote = F.deleteField(); up["times.reopened"] = ts; }
    if (to === "new") { up["times.reopened"] = ts; up["times.closed"] = F.deleteField(); }
    try { await F.updateDoc(F.doc(db, "requests", d.id), up); toast({ new: "رجع الطلب «جديد».", prep: "الطلب صار قيد التجهيز.", refused: "تقفل الطلب: العميل اعتذر.", done: "اكتمل الطلب 🎉", pricing: "رجع الطلب للتسعير." }[to] || "انحفظ."); }
    catch (err) { toast("ما انحفظ: " + (err.code || err.message)); } return; }
  const del = e.target.closest("[data-del]");
  if (del) { if (!arm(del, "اضغطي «حذف» مرة ثانية. الحذف نهائي وينحذف من لوحة المسوقين بعد.")) return;
    try { await F.deleteDoc(F.doc(db, col, del.dataset.del)); openId = null; } catch (err) { toast("ما انحذف: " + (err.code || err.message)); } return; }
  const cp = e.target.closest("[data-copy]");
  if (cp) { const d = RQ[col].find(x => x.id === cp.dataset.copy);
    try { await navigator.clipboard.writeText([`الاسم: ${d.name}`, ...rows(d).map(([l, v]) => `${l}: ${v}`)].join("\n")); toast("تم نسخ الطلب."); } catch { toast("تعذّر النسخ."); } }
});
$("list").addEventListener("change", async (e) => {
  const el = e.target.closest("[data-assign]"); if (!el) return;
  const d = RQ.requests.find(x => x.id === el.dataset.id); if (!d) return;
  try { await F.updateDoc(F.doc(db, "requests", d.id), { assign: liveAssign(d) }); }
  catch (err) { toast("ما انحفظ الاختيار: " + (err.code || err.message)); }
});
$("csv").addEventListener("click", () => {
  const list = RQ[col].filter(matches);
  const extra = [...new Set(list.flatMap(d => (d.answers || []).map(a => a.l)))];
  const cols = [["name","الاسم"], ...RF[col], ["adminNote","ملاحظة"]];
  const cell = (v) => { let s = String(v ?? ""); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return `"${s.replace(/"/g, '""')}"`; };
  const csv = [...cols.map(c => c[1]), ...extra, "الحالة", "التاريخ"].map(cell).join(",") + "\n" +
    list.map(d => [...cols.map(([k]) => txt(d[k])), ...extra.map(l => ((d.answers || []).find(a => a.l === l) || {}).v || ""), stLabel(d) || d.state, when(d.createdAt)].map(cell).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
  a.download = (col === "requests" ? "طلبات-الخدمة" : "طلبات-المسوقين") + ".csv"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
});

/* =============== content: load / publish =============== */
const ED = {
  home: { id: "home", title: "تعديل الصفحة الأساسية", page: "index.html", data: null, saved: null, undo: [], loading: null },
  request: { id: "request", title: "تعديل صفحة الطلبات", page: "request.html", data: null, saved: null, undo: [], loading: null }
};
const OPEN = { home: {}, request: {} };
let CUR = null;
function loadContent(id) {
  const E = ED[id];
  if (!E.loading) E.loading = F.getDoc(F.doc(db, "siteContent", id)).then(s => {
    const j = s.exists() ? s.data().json : null;
    E.ver = s.exists() && s.data().updatedAt && s.data().updatedAt.toMillis ? s.data().updatedAt.toMillis() : 0;
    E.pub = j || JSON.stringify(WC.defaults(id));
    E.data = prep(id, E.pub); E.saved = JSON.stringify(E.data);
    let draft = null; try { draft = localStorage.getItem("waraq-draft-" + id); } catch {}
    E.draft = draft && draft !== E.saved ? draft : null;
  }).catch(err => { E.loading = null; throw err; });
  return E.loading;
}
/* request options get a hidden stable id, so a renamed option can be followed everywhere it is used */
function prep(id, json) {
  const D = JSON.parse(json);
  if (id === "home") (D.sections || []).forEach(s => { if (s && s.type === "join") s.data.fields = WC.joinFields(s.data); });
  if (id === "request") { WC.normRequest(D); reqFields(D).forEach(f => { if (Array.isArray(f.options)) f.options.forEach((o, i) => { if (o && !o.id) o.id = "o" + i; }); }); }
  return D;
}
const reqFields = (D) => ((D && D.parts) || []).flatMap(p => p.fields || []);
const baseT = (s) => String(s || "").replace(/\s*\(.*\)\s*$/, "").trim();
const sameRef = (ref, t) => !!ref && (ref === t || baseT(ref) === baseT(t) || baseT(t).startsWith(baseT(ref)));
function refOptions(src) {
  const f = reqFields(ED.request.data).find(x => x.key === src);
  return f && Array.isArray(f.options) ? f.options.filter(o => o && o.t && !/^#/.test(o.t)) : [];
}
/* every place on the home page that points at a request option */
function homeRefs(H, fn) {
  ((H && H.sections) || []).forEach(s => {
    if (s.type === "campaigns") ["a", "b"].forEach(k => (s.data[k] || []).forEach(c => fn(c, "pick", "picks")));
    if (s.type === "band") { fn(s.data, "pick", "picks"); fn(s.data, "who", "who"); }
  });
}
/* campaign cards → the «حملة جاهزة» options of the order form (linked by the card's cid). Returns true if something changed. */
function syncPkg(H, Rq) {
  const f = reqFields(Rq).find(x => x.key === "pkg"); if (!f || !Array.isArray(f.options)) return false;
  const sec = ((H && H.sections) || []).find(s => s.type === "campaigns"); if (!sec) return false;
  const before = JSON.stringify(f.options), live = new Set();
  [["a", false], ["b", true]].forEach(([k, pub]) => (sec.data[k] || []).forEach(c => {
    if (!c || !c.title || !c.cid) return;
    live.add(c.cid);
    const sameAud = (t) => pub === /\(دار نشر\)/.test(t);
    let o = f.options.find(x => x && x.cid === c.cid) || f.options.find(x => x && x.t && !x.cid && !/^#/.test(x.t) && sameAud(x.t) && baseT(x.t) === baseT(c.title));
    if (!o) { o = { id: uid("o") }; const h = pub ? -1 : f.options.findIndex(x => x && /^#/.test(x.t || "") && /دور|دار/.test(x.t)); if (h >= 0) f.options.splice(h, 0, o); else f.options.push(o); }
    o.t = c.title + (pub && !/\(.*\)$/.test(c.title) ? " (دار نشر)" : ""); o.cid = c.cid;
    if (c.hidden) o.hidden = true; else delete o.hidden;
  }));
  // options with no card behind them (deleted campaign) are hidden, not deleted: they can come back from «تعديل صفحة الطلبات»
  f.options.forEach(o => { if (o && o.t && !/^#/.test(o.t) && (!o.cid || !live.has(o.cid))) o.hidden = true; });
  return JSON.stringify(f.options) !== before;
}
/* الحفظ ما يكتب فوق نسخة أحدث انحفظت من جهاز أو صفحة ثانية بعد ما انفتح المحرر هنا (الاسترجاع من السجل يتجاوز هذا عن قصد) */
async function publish(id, json, note, force) {
  const ref = F.doc(db, "siteContent", id), E = ED[id];
  await F.runTransaction(db, async (tx) => {
    const cur = await tx.get(ref);
    const v = cur.exists() && cur.data().updatedAt && cur.data().updatedAt.toMillis ? cur.data().updatedAt.toMillis() : 0;
    if (!force && E.ver != null && v && v !== E.ver) { const e = new Error("stale"); e.code = "stale"; throw e; }
    tx.set(ref, { json, updatedAt: F.serverTimestamp() });
    tx.set(F.doc(F.collection(db, "siteHistory")), { kind: id, json, at: F.serverTimestamp(), note: String(note || "").slice(0, 300), by: (USER && USER.email || "").slice(0, 120) });
  });
  try { const s = await F.getDoc(ref); E.ver = s.exists() && s.data().updatedAt && s.data().updatedAt.toMillis ? s.data().updatedAt.toMillis() : E.ver; } catch {}
  ED[id].saved = json; ED[id].pub = json;
  try { localStorage.setItem("waraq-content-" + id, json); } catch {}
}
const isDirty = (id) => ED[id].data && JSON.stringify(ED[id].data) !== ED[id].saved;
const anyDirty = () => isDirty("home") || isDirty("request");
window.addEventListener("beforeunload", (e) => { if (anyDirty()) { e.preventDefault(); e.returnValue = ""; } });

/* =============== editor schema =============== */
const S = (k, l, t = "text", ex = {}) => ({ k, l, t, ...ex });
const TITLE = S("title", "العنوان", "text", { title: true }), SUB = S("sub", "السطر تحت العنوان");
const L = (k, l, item, tpl, tk, ex = {}) => S(k, l, "list", { item, tpl, tk, ...ex });
const TYPES = {
  hero: { name: "الواجهة", unique: true, nav: false, fields: [S("title", "العنوان", "text", { title: true }), S("highlight", "الكلمة المظللة بالأصفر"), S("lead", "النص تحت العنوان", "area"), S("cta1", "زر الطلب"), S("cta2", "الزر الثاني (يودّي للحملات)"),
      L("bullets", "النقاط تحت الأزرار", [S("text", "النقطة", "text", { title: true })], { text: "نقطة جديدة" }, "text")] },
  services: { name: "الخدمات", fields: [TITLE, SUB, S("button", "زر الطلب تحت الخدمات", "text", { hint: "فاضي = «اطلب خدمة»" }), L("items", "الخدمات", [S("title", "اسم الخدمة", "text", { title: true }), S("text", "الوصف", "area"), S("tags", "الوسوم", "text", { hint: "افصلي بينها بفاصلة ،" })], { title: "خدمة جديدة", text: "", tags: "" }, "title")],
    make: () => ({ title: "خدماتنا", sub: "", items: [{ title: "خدمة جديدة", text: "", tags: "" }] }) },
  campaigns: { name: "الحملات الجاهزة", unique: true, fields: [TITLE, SUB, S("tabA", "اسم التبويب الأول"), S("tabB", "اسم التبويب الثاني"), S("button", "نص زر الحملة"), S("more", "نص زر التفاصيل في البطاقة", "text", { hint: "فاضي = «التفاصيل»" }),
      L("a", "حملات التبويب الأول", null, null, "title"), L("b", "حملات التبويب الثاني", null, null, "title")],
    make: () => ({ title: "حملات جاهزة", sub: "", tabA: "للمؤلفين", tabB: "لدور النشر", button: "اطلب هذه الحملة", a: [], b: [] }) },
  cols: { name: "أعمدة", fields: [TITLE, SUB, L("items", "الأعمدة", [S("title", "العنوان", "text", { title: true }), S("text", "النص", "area")], { title: "عنوان جديد", text: "" }, "title")],
    make: () => ({ title: "لماذا نحن", sub: "", items: [{ title: "عنوان", text: "" }, { title: "عنوان", text: "" }, { title: "عنوان", text: "" }] }) },
  steps: { name: "خطوات", fields: [TITLE, SUB, L("items", "الخطوات", [S("title", "الخطوة", "text", { title: true }), S("text", "الشرح", "area")], { title: "خطوة جديدة", text: "" }, "title")],
    make: () => ({ title: "كيف نعمل", sub: "", items: [{ title: "الخطوة الأولى", text: "" }, { title: "الخطوة الثانية", text: "" }, { title: "الخطوة الثالثة", text: "" }] }) },
  band: { name: "شريط دعوة", fields: [S("title", "العنوان", "text", { title: true }), S("text", "النص", "area"), S("button", "نص الزر"), S("who", "يختار في صفحة الطلب «أنت»", "ref", { src: "who" }), S("pick", "يختار في صفحة الطلب «وش تحتاج؟»", "ref", { src: "picks" })],
    make: () => ({ title: "عنوان الشريط", text: "", button: "اطلب خدمة", who: "", pick: "" }) },
  faq: { name: "أسئلة شائعة", fields: [TITLE, SUB, L("items", "الأسئلة", [S("q", "السؤال", "text", { title: true }), S("a", "الجواب", "area")], { q: "سؤال جديد؟", a: "" }, "q")],
    make: () => ({ title: "أسئلة شائعة", sub: "", items: [{ q: "سؤال جديد؟", a: "" }] }) },
  text: { name: "نص حر", fields: [TITLE, SUB, S("text", "النص", "area", { rows: 8, hint: "سطر فاضي بين الفقرات" })], make: () => ({ title: "عنوان", sub: "", text: "" }) },
  quotes: { name: "آراء العملاء", fields: [TITLE, SUB, L("items", "الآراء", [S("quote", "الرأي", "area"), S("name", "الاسم", "text", { title: true }), S("role", "الصفة أو الكتاب")], { quote: "", name: "اسم العميل", role: "" }, "name")],
    make: () => ({ title: "قالوا عنا", sub: "", items: [{ quote: "", name: "اسم العميل", role: "" }] }) },
  request: { name: "قسم اطلب خدمة", unique: true, fields: [TITLE, SUB, S("boxTitle", "عنوان المربع"), S("boxText", "نص المربع", "area"), S("button", "نص الزر"), S("waButton", "زر الواتساب"), S("socialText", "نص الحسابات")],
    make: () => WC.defaults("home").sections.find(s => s.type === "request").data },
  join: { name: "انضم كمسوق", unique: true, fields: [TITLE, SUB,
    L("fields", "خانات النموذج", [S("label", "اسم الخانة", "text", { title: true }),
      S("type", "نوع الخانة", "select", { opts: [["text", "نص قصير"], ["area", "نص طويل"], ["tel", "رقم جوال"], ["number", "رقم"], ["checks", "اختيارات (أكثر من وحدة)"], ["radio", "اختيار واحد"]] }),
      S("options", "الخيارات", "area", { hint: "لخانات الاختيار بس. كل سطر خيار" }), S("placeholder", "نص رمادي داخل الخانة"), S("required", "إجبارية", "bool")],
      { label: "خانة جديدة", type: "text", options: "", placeholder: "", required: false }, "label", { lockKeys: ["name", "handle"] }),
    S("button", "زر الإرسال"), S("okTitle", "عنوان رسالة النجاح"), S("okText", "نص رسالة النجاح", "area")],
    make: () => WC.defaults("home").sections.find(s => s.type === "join").data }
};
const CARD = [S("label", "الوسم الصغير"), S("title", "اسم الحملة", "text", { title: true }), S("text", "الوصف"), S("svc", "الخدمات (هي مميزات البطاقة)", "svc"), S("pick", "تنختار في صفحة الطلب «وش تحتاج؟»", "ref", { src: "picks" }), S("star", "تمييزها (الأكثر طلبًا)", "bool")];
TYPES.campaigns.fields[TYPES.campaigns.fields.findIndex(x => x.k === "a")] = L("a", "حملات التبويب الأول", CARD, { label: "", title: "حملة جديدة", text: "", items: "", svc: {}, pick: "", star: false }, "title");
TYPES.campaigns.fields[TYPES.campaigns.fields.findIndex(x => x.k === "b")] = L("b", "حملات التبويب الثاني", CARD, { label: "", title: "حملة جديدة", text: "", items: "", svc: {}, pick: "", star: false }, "title");
/* قائمة الخدمات من حاسبة الحملات (calc/services). مميزات بطاقة الحملة الجاهزة = خدماتها وكمياتها، بنفس صياغة الحاسبة. */
let CAT = null;
const loadCat = () => F.getDoc(F.doc(db, "calc", "services")).then(s => { const l = s.exists() ? s.data().list : null; CAT = Array.isArray(l) && l.length ? l : null; }).catch(() => { CAT = null; });
const svcText = q => (CAT || []).map(s => { const n = Math.floor(+((q || {})[s.id]) || 0); return n > 0 ? (n > 1 ? `${s.name} (${n})` : s.name) : ""; }).filter(Boolean).join("\n");
const BRAND = [S("name", "اسم الوكالة", "text", { title: true }), S("tagline", "الوصف القصير"), S("cta", "زر «اطلب خدمة» في الأعلى"), S("whatsapp", "رقم الواتساب", "text", { hint: "بالصيغة الدولية مثل 9665XXXXXXXX. فاضي = أزرار الواتساب مخفية", ltr: true }),
  S("handle", "اسم الحساب", "text", { ltr: true }), S("domain", "الدومين", "text", { ltr: true }), S("year", "سنة الحقوق"),
  L("socials", "الحسابات", [S("name", "المنصة", "text", { title: true }), S("url", "الرابط", "text", { ltr: true })], { name: "منصة", url: "https://" }, "name"),
  L("links", "أزرار في الشريط العلوي", [S("text", "نص الزر", "text", { title: true }), S("url", "الرابط", "text", { ltr: true, hint: "رابط كامل يبدأ بـ https:// أو اسم صفحة" })], { text: "زر جديد", url: "https://" }, "text")];
const SEO = [S("title", "عنوان الصفحة في قوقل والتبويب"), S("description", "وصف الصفحة في نتائج البحث", "area")];

const FTYPES = [["text","نص قصير"],["textarea","نص طويل"],["tel","جوال"],["email","بريد"],["url","رابط"],["radio","اختيار واحد"],["checks","اختيار متعدد"],["select","قائمة منسدلة"],["number","رقم"],["date","تاريخ"],["svclist","خدمات يضيفها العميل (+ أضف خدمة)"]];
const FTN = Object.fromEntries(FTYPES);
const CORE_NAMES = { who:"الصفة (مؤلف / دار نشر)", name:"الاسم", book:"عنوان الكتاب", genre:"نوع الكتاب", date:"الموعد المهم", status:"حالة الكتاب", where:"أين يُباع", link:"الرابط", picks:"الخدمات المطلوبة", pkg:"الحملة الجاهزة", budget:"الميزانية", notes:"التفاصيل", phone:"الجوال", email:"البريد" };
const REQ_TEXTS = [S("title", "العنوان"), S("highlight", "الكلمة المظللة"), S("intro", "النص تحت العنوان", "area"), S("submit", "زر الإرسال"), S("agree", "النص تحت زر الإرسال", "area"),
  S("okTitle", "عنوان رسالة النجاح"), S("okText", "نص رسالة النجاح", "area"), S("afterTitle", "عنوان «بعد ما ترسل الطلب»"),
  L("after", "خطوات «بعد ما ترسل الطلب»", [S("title", "الخطوة", "text", { title: true }), S("text", "الشرح")], { title: "خطوة", text: "" }, "title")];

/* =============== editor: generic form builder =============== */
const getP = (o, p) => p === "" ? o : p.split(".").reduce((a, k) => a == null ? a : a[k], o);
function setP(o, p, v) { const ks = p.split("."), last = ks.pop(); const t = ks.reduce((a, k) => a[k], o); t[last] = v; }
const uid = (pre) => pre + Math.random().toString(36).slice(2, 8);
function ops(path, i, n, item, opts = {}) {
  return `<span class="ops">
    <button class="ib" type="button" data-op="up" data-p="${path}" data-i="${i}" title="فوق" aria-label="تحريك لفوق"${i === 0 ? " disabled" : ""}>${ICON.up}</button>
    <button class="ib" type="button" data-op="down" data-p="${path}" data-i="${i}" title="تحت" aria-label="تحريك لتحت"${i === n - 1 ? " disabled" : ""}>${ICON.down}</button>
    <button class="ib" type="button" data-op="hide" data-p="${path}" data-i="${i}" title="${item.hidden ? "إظهار" : "إخفاء"}" aria-label="${item.hidden ? "إظهار" : "إخفاء"}"${opts.noHide ? " disabled" : ""}>${item.hidden ? ICON.off : ICON.eye}</button>
    <button class="ib" type="button" data-op="del" data-p="${path}" data-i="${i}" title="حذف" aria-label="حذف"${opts.noDel ? " disabled" : ""}>${ICON.del}</button></span>`;
}
function inputHTML(f, base, obj) {
  const p = (base ? base + "." : "") + f.k, v = obj ? obj[f.k] : "", id = "e-" + p.replace(/\./g, "-");
  const hint = f.hint ? ` <small>(${esc(f.hint)})</small>` : "";
  if (f.t === "list") return listHTML(f, p, v || []);
  if (f.t === "subs") return subsHTML(p, Array.isArray(v) ? v : []);
  if (f.t === "svc") {
    const q = obj && obj.svc && typeof obj.svc === "object" ? obj.svc : {}, ip = (base ? base + "." : "") + "items";
    if (!CAT) return `<div class="fld"><label for="${id}">المميزات <small>(كل سطر ميزة. قائمة الخدمات تجي من حاسبة الحملات: افتحيها مرة وهي مسجّلة دخول عشان تنربط)</small></label><textarea id="${id}" data-p="${ip}" rows="3">${esc(obj ? obj.items || "" : "")}</textarea></div>`;
    const old = obj && obj.items && !Object.keys(q).length ? `<p class="hint">المكتوب الحين: ${esc(obj.items).replace(/\n/g, "، ")}. اختاري الخدمات عشان تنربط بالحاسبة.</p>` : "";
    return `<div class="fld"><label>${esc(f.l)} <small>(نفس خدمات حاسبة الحملات. الرقم = الكمية، فاضي = مو فيها. أي تغيير هنا يتغيّر في الحاسبة وسعرها)</small></label>${old}
      <div class="svcpick" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:4px 14px;max-height:260px;overflow:auto;border:1px solid var(--rule,#ddd);padding:8px 10px">` +
      CAT.map(s => `<label style="display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:.9rem"><span>${esc(s.name)}</span><input type="number" min="0" max="999" step="1" inputmode="numeric" style="width:64px" data-svc="${esc(base)}" data-sid="${esc(s.id)}" value="${q[s.id] ? esc(q[s.id]) : ""}" placeholder="0"></label>`).join("") +
      `</div><p class="hint" data-svcprev="${esc(base)}" style="white-space:pre-line">تظهر في البطاقة:\n${esc(obj && obj.items || "—")}</p></div>`;
  }
  if (f.t === "bool") return `<label class="chk"><input type="checkbox" data-p="${p}"${v ? " checked" : ""}>${esc(f.l)}</label>`;
  if (f.t === "area") return `<div class="fld"><label for="${id}">${esc(f.l)}${hint}</label><textarea id="${id}" data-p="${p}" rows="${f.rows || 3}">${esc(v)}</textarea></div>`;
  if (f.t === "ref") {
    const os = refOptions(f.src), hit = os.find(o => o.t === v) || os.find(o => sameRef(v, o.t));
    const opt = (val, lab, sel) => `<option value="${esc(val)}"${sel ? " selected" : ""}>${esc(lab)}</option>`;
    return `<div class="fld"><label for="${id}">${esc(f.l)} <small>(الخيارات من «تعديل صفحة الطلبات»)</small></label><select id="${id}" data-p="${p}">` +
      opt("", "بدون", !v) + os.map(o => opt(o.t, o.t + (o.hidden ? " (مخفي)" : ""), hit === o)).join("") +
      (v && !hit ? opt(v, v + " (مو موجود في صفحة الطلبات)", true) : "") + `</select></div>`;
  }
  if (f.t === "select") return `<div class="fld"><label for="${id}">${esc(f.l)}${hint}</label><select id="${id}" data-p="${p}"${f.re ? ' data-re="1"' : ""}>${f.opts.map(([a, b]) => `<option value="${esc(a)}"${a === v ? " selected" : ""}>${esc(b)}</option>`).join("")}</select></div>`;
  return `<div class="fld"><label for="${id}">${esc(f.l)}${hint}</label><input type="text" id="${id}" data-p="${p}" value="${esc(v)}"${f.title ? ' data-title="1"' : ""}${f.ltr ? ' dir="ltr"' : ""}></div>`;
}
function fieldsHTML(schema, base, obj) { return schema.map(f => inputHTML(f, base, obj)).join(""); }
function listHTML(f, p, arr) {
  const open = OPEN[CUR.id];
  return `<div class="lst"><h4>${esc(f.l)} <span class="hint">${toAr(arr.length)}</span></h4>` +
    arr.map((it, i) => { const k = p + "." + i, t = (it && it[f.tk]) || "عنصر " + toAr(i + 1);
      return `<details class="card${it.hidden ? " off" : ""}" data-k="${k}"${open[k] ? " open" : ""}><summary><span class="t"><span class="tt">${esc(t)}</span></span>${ops(p, i, arr.length, it, f.lockKeys && it && f.lockKeys.includes(it.key) ? { noHide: true, noDel: true } : {})}</summary><div class="body">${fieldsHTML(f.item, k, it)}</div></details>`;
    }).join("") + `<div class="addrow"><button class="btn line sm" type="button" data-op="add" data-p="${p}" data-tpl='${esc(JSON.stringify(f.tpl))}'>+ إضافة</button></div></div>`;
}

/* ---- home panel ---- */
function homePanel(D) {
  const open = OPEN.home, n = D.sections.length;
  let h = `<details class="card" data-k="brand"${open.brand ? " open" : ""}><summary><span class="t">معلومات عامة <small>الاسم، الواتساب، الحسابات، البحث</small></span></summary><div class="body">${fieldsHTML(BRAND, "brand", D.brand)}
    <div class="lst"><h4>الظهور في قوقل</h4>${fieldsHTML(SEO, "seo", D.seo || {})}</div></div></details>`;
  h += `<h4 class="hint" style="margin:16px 2px 8px">أقسام الصفحة بالترتيب</h4>`;
  h += D.sections.map((s, i) => {
    const T = TYPES[s.type] || { name: s.type, fields: [] }, k = "sec:" + s.id;
    return `<details class="card${s.hidden ? " off" : ""}" data-k="${k}" data-sec="${i}"${open[k] ? " open" : ""}><summary><span class="t">${esc(T.name)}<small class="tt">${esc(s.data.title || "")}</small></span>${ops("sections", i, n, s)}</summary><div class="body">
      ${T.nav === false ? "" : `<div class="two">${inputHTML(S("nav", "اسمه في القائمة العلوية", "text", { hint: "فاضي = ما يظهر" }), "sections." + i, s)}</div>`}
      ${fieldsHTML(T.fields, "sections." + i + ".data", s.data)}</div></details>`;
  }).join("");
  const have = new Set(D.sections.map(s => s.type));
  const addable = Object.entries(TYPES).filter(([t, T]) => T.make && !(T.unique && have.has(t)));
  h += `<div class="addrow" style="margin:6px 0 30px"><select id="sec-type" aria-label="نوع القسم">${addable.map(([t, T]) => `<option value="${t}">${esc(T.name)}</option>`).join("")}</select><button class="btn sm" type="button" data-op="sec-add">+ إضافة قسم</button></div>`;
  return h;
}

/* ---- request form panel ---- */
/* حقول تفصيلية داخل الخيار: تطلع تحته في صفحة الطلب لما يختاره العميل */
function subsHTML(p, arr) {
  const open = OPEN[CUR.id];
  return `<div class="lst subs"><h4>تفاصيل تطلع لما يختار العميل هذا الخيار <span class="hint">${toAr(arr.length)}</span></h4>` +
    arr.map((sf, i) => { const k = p + "." + i;
      return `<details class="card${sf.hidden ? " off" : ""}" data-k="${k}"${open[k] ? " open" : ""}><summary><span class="t"><span class="tt">${esc(sf.label || "حقل")}</span></span><span class="tag">${esc(FTN[sf.type] || sf.type)}</span>${sf.required ? '<span class="tag">إلزامي</span>' : ""}${ops(p, i, arr.length, sf)}</summary><div class="body">${subEditor(sf, k)}</div></details>`;
    }).join("") + `<div class="addrow"><button class="btn line sm" type="button" data-op="sub-add" data-p="${p}">+ حقل تفصيلي</button></div></div>`;
}
function subEditor(f, base) {
  const isChoice = !!WC.CHOICE[f.type];
  return inputHTML(S("label", "اسم الحقل", "text", { title: true }), base, f) +
    inputHTML(S("type", "نوع الحقل", "select", { opts: FTYPES, re: true }), base, f) +
    inputHTML(S("hint", "ملاحظة صغيرة جنب الاسم"), base, f) +
    (isChoice ? listHTML(L("options", "الخيارات", [S("t", "نص الخيار", "text", { title: true })], { t: "خيار جديد" }, "t"), base + ".options", Array.isArray(f.options) ? f.options : [])
      : inputHTML(S("placeholder", "النص الرمادي داخل الخانة"), base, f)) +
    (["textarea", "radio", "checks"].includes(f.type) ? "" : inputHTML(S("width", "العرض", "select", { opts: [["half", "نص السطر"], ["full", "سطر كامل"]] }), base, f)) +
    inputHTML(S("required", "إلزامي (لما يظهر)", "bool"), base, f);
}
/* حقل مشروط قديم (f.when): نعرض اسم الخيار اللي يظهره */
function whenNames(D, f) {
  const src = f.when && reqFields(D).find(x => x.id === f.when.f); if (!src) return [];
  return src.options.filter(o => o && (f.when.o || []).includes(o.id)).map(o => o.t);
}
function fieldEditor(f, base, pi, parts) {
  const core = WC.CORE[f.key], locked = WC.LOCKED[f.key];
  const typeRow = core ? `<p class="hint" style="margin:-4px 0 10px">نوعه: ${esc(FTN[f.type] || f.type)}. حقل أساسي${f.key === "name" || f.key === "book" ? "، تستخدمه «الموافقة» في لوحة المسوقين" : ""}.</p>`
    : inputHTML(S("type", "نوع الحقل", "select", { opts: FTYPES, re: true }), base, f);
  const isChoice = !!WC.CHOICE[f.type];
  const optsHTML = f.type === "svclist"
    ? listHTML(L("options", "الخدمات اللي يختار منها العميل", [S("t", "اسم الخدمة", "text", { title: true }), S("dash", "هذي حملة المسوقين: تنتقل للوحة المسوقين لما تقبلين الطلب", "bool")], { t: "خدمة جديدة" }, "t"), base + ".options", Array.isArray(f.options) ? f.options : []) +
      inputHTML(S("addText", "نص زر الإضافة", "text", { hint: "فاضي = «أضف خدمة»" }), base, f) +
      `<p class="hint">مين ينفذ كل خدمة تحددينه من «الإعدادات» ← منفذو الخدمات.</p>`
    : isChoice
    ? listHTML(L("options", "الخيارات" + (f.type === "select" ? " (خيار يبدأ بـ # = عنوان مجموعة)" : ""),
        [S("t", "نص الخيار", "text", { title: true }), S("dash", "لو اختاره العميل، الطلب يروح للوحة المسوقين بعد ما تقبلينه", "bool")].concat(f.type === "checks" ? [S("more", "يظهر بعد ما يضغط العميل زر «خدمات أخرى»", "bool")] : []).concat([S("sub", "", "subs")]), { t: "خيار جديد" }, "t"), base + ".options", Array.isArray(f.options) ? f.options : []) +
      (f.type === "checks" ? `<div class="lst when"><h4>زر «خدمات أخرى»</h4><p class="hint">يطلع الزر لو فيه خيار معلّم «يظهر بعد ما يضغط العميل زر خدمات أخرى»، أو لو فعّلتي الكتابة.</p>` +
        inputHTML(S("moreText", "نص الزر", "text", { hint: "فاضي = «+ خدمات أخرى»" }), base, f) +
        inputHTML(S("other", "العميل يقدر يكتب خدمة من عنده", "bool"), base, f) +
        (f.other ? inputHTML(S("otherLabel", "عنوان خانة الكتابة", "text", { hint: "فاضي = «خدمة غير موجودة؟ اكتبها»" }), base, f) + inputHTML(S("otherPh", "النص الرمادي داخل الخانة"), base, f) : "") + `</div>` : "")
    : f.type === "text" ? inputHTML(S("options", "اقتراحات تطلع للعميل", "area", { hint: "اختياري، كل سطر اقتراح", rows: 3 }), base, f) : "";
  return inputHTML(S("label", "اسم الحقل", "text", { title: true }), base, f) +
    (f.key === "name" ? inputHTML(S("altLabel", "اسمه لما يختار الخيار الثاني في «أنت»", "text", { hint: "مثل: اسم دار النشر" }), base, f) : "") +
    typeRow + inputHTML(S("hint", "ملاحظة صغيرة جنب الاسم"), base, f) +
    (["radio", "checks"].includes(f.type) ? "" : inputHTML(S("placeholder", f.type === "svclist" ? "النص الرمادي داخل مربع التفاصيل" : "النص الرمادي داخل الخانة"), base, f)) +
    optsHTML +
    `<div class="two">${["textarea", "radio", "checks", "svclist"].includes(f.type) ? "<span></span>" : inputHTML(S("width", "العرض", "select", { opts: [["half", "نص السطر"], ["full", "سطر كامل"]] }), base, f)}
      <div class="fld"><label for="mv-${f.id}">نقله لقسم ثاني</label><select id="mv-${f.id}" data-move="${pi}" data-fid="${f.id}">${parts.map((p, j) => `<option value="${j}"${j === pi ? " selected" : ""}>${esc(p.title || "قسم " + toAr(j + 1))}</option>`).join("")}</select></div></div>` +
    (locked ? `<label class="chk"><input type="checkbox" checked disabled>إلزامي (دايمًا، ما ينشال)</label>` : inputHTML(S("required", f.when && f.when.f ? "إلزامي (لما يظهر)" : "إلزامي", "bool"), base, f));
}
function requestPanel(D) {
  const open = OPEN.request;
  let h = `<details class="card" data-k="texts"${open.texts ? " open" : ""}><summary><span class="t">نصوص الصفحة <small>العنوان، الأزرار، رسالة النجاح</small></span></summary><div class="body">${fieldsHTML(REQ_TEXTS, "", D)}</div></details>`;
  h += `<h4 class="hint" style="margin:16px 2px 8px">أقسام النموذج وحقوله</h4>`;
  const used = new Set(D.parts.flatMap(p => p.fields.map(f => f.key)));
  h += D.parts.map((p, i) => {
    const k = "part:" + p.id, hasLock = p.fields.some(f => WC.LOCKED[f.key]);
    const flds = p.fields.map((f, j) => {
      const fk = "fld:" + f.id, lock = WC.LOCKED[f.key];
      const toDash = Array.isArray(f.options) && f.options.some(o => o && o.dash && !o.hidden);
      const wn = whenNames(D, f), nsub = Array.isArray(f.options) ? f.options.reduce((a, o) => a + ((o && Array.isArray(o.sub)) ? o.sub.length : 0), 0) : 0;
      const tags = `<span class="tag">${esc(FTN[f.type] || f.type)}</span>${nsub ? `<span class="tag">${toAr(nsub)} تفاصيل</span>` : ""}${wn.length ? `<span class="tag">يظهر مع: ${esc(wn.join("، "))}</span>` : ""}${toDash ? '<span class="tag lock">← لوحة المسوقين</span>' : ""}${lock ? '<span class="tag lock">أساسي</span>' : f.required ? '<span class="tag">إلزامي</span>' : ""}`;
      return `<details class="card${f.hidden ? " off" : ""}" data-k="${fk}" data-fid="${f.id}"${open[fk] ? " open" : ""}><summary><span class="t"><span class="tt">${esc(f.label || "حقل")}</span></span>${tags}${ops("parts." + i + ".fields", j, p.fields.length, f, { noHide: lock, noDel: lock })}</summary>
        <div class="body">${fieldEditor(f, "parts." + i + ".fields." + j, i, D.parts)}</div></details>`;
    }).join("");
    const missing = Object.keys(WC.CORE).filter(c => !used.has(c));
    return `<details class="card${p.hidden ? " off" : ""}" data-k="${k}" data-part="${i}"${open[k] ? " open" : ""}><summary><span class="t">${esc(p.title || "قسم")}<small>${toAr(p.fields.length)} حقول</small></span>${ops("parts", i, D.parts.length, p, { noHide: hasLock, noDel: hasLock })}</summary><div class="body">
      ${inputHTML(S("title", "عنوان القسم", "text", { title: true }), "parts." + i, p)}<div class="lst"><h4>الحقول</h4>${flds}
      <div class="addrow"><button class="btn line sm" type="button" data-op="fld-add" data-pi="${i}">+ حقل جديد</button>
      ${missing.length ? `<select data-core="${i}" aria-label="إرجاع حقل أساسي"><option value="">+ إرجاع حقل أساسي محذوف</option>${missing.map(c => `<option value="${c}">${esc(CORE_NAMES[c])}</option>`).join("")}</select>` : ""}</div></div></div></details>`;
  }).join("");
  h += `<div class="addrow" style="margin:6px 0 30px"><button class="btn sm" type="button" data-op="part-add">+ إضافة قسم للنموذج</button></div>`;
  return h;
}

/* =============== editor: state, preview, events =============== */
const panel = $("panel"), frame = $("frame-prev");
let undoTimer = null, previewTimer = null;
async function openEditor(id) {
  const E = ED[id]; CUR = E;
  $("ed-title").textContent = E.title; $("ed-note").value = "";
  panel.innerHTML = '<div class="skel"></div><div class="skel"></div><div class="skel"></div>';
  try { await Promise.all([loadContent("home"), loadContent("request"), loadCat()]); }
  catch (err) { panel.innerHTML = `<div class="empty"><h2>تعذّر التحميل</h2><p>${esc(err.code || err.message)}</p></div>`; return; }
  if (CUR !== E) return;
  $("ed-draft").innerHTML = E.draft ? `<div class="restore"><span>عندك تعديلات من قبل ما انحفظت على هذي الصفحة.</span><span class="acts"><button class="btn sm" type="button" id="dr-use">استرجاعها</button><button class="btn line sm" type="button" id="dr-drop">تجاهلها</button></span></div>` : "";
  renderPanel();
  const want = E.page + "?preview=1";
  if (!frame.src.endsWith(want)) frame.src = want; else sendPreview();
}
$("ed-draft").addEventListener("click", (e) => {
  const E = CUR; if (!E) return;
  if (e.target.id === "dr-use") { pushUndo(); E.data = JSON.parse(E.draft); E.draft = null; $("ed-draft").innerHTML = ""; changed(true); }
  if (e.target.id === "dr-drop") { E.draft = null; try { localStorage.removeItem("waraq-draft-" + E.id); } catch {} $("ed-draft").innerHTML = ""; }
});
function renderPanel() {
  const y = panel.scrollTop;
  panel.innerHTML = CUR.id === "home" ? homePanel(CUR.data) : requestPanel(CUR.data);
  panel.scrollTop = y; updateState();
}
function updateState() {
  if (!CUR) return;
  const d = isDirty(CUR.id);
  $("ed-state").textContent = d ? "تعديلات ما انحفظت" : "كل شي محفوظ ومنشور"; $("ed-state").className = "state" + (d ? " dirty" : "");
  $("ed-save").disabled = !d; $("ed-revert").disabled = !d; $("ed-undo").disabled = !CUR.undo.length;
  document.querySelectorAll("[data-dirty]").forEach(el => el.hidden = !isDirty(el.dataset.dirty));
  try { if (d) localStorage.setItem("waraq-draft-" + CUR.id, JSON.stringify(CUR.data)); else localStorage.removeItem("waraq-draft-" + CUR.id); } catch {}
}
function pushUndo() { CUR.undo.push(JSON.stringify(CUR.data)); if (CUR.undo.length > 60) CUR.undo.shift(); }
function changed(rerender) {
  if (rerender) renderPanel(); else updateState();
  clearTimeout(previewTimer); previewTimer = setTimeout(sendPreview, rerender ? 0 : 200);
}
function sendPreview(focus) {
  if (!CUR || !frame.contentWindow) return;
  frame.contentWindow.postMessage({ type: "waraq-content", id: CUR.id, content: CUR.data, home: ED.home.data, request: ED.request.data, focus }, location.origin);
}
function focusPreview(details) {
  if (!frame.contentWindow) return;
  if (CUR.id === "home") { const s = details.dataset.sec ?? (details.dataset.k === "brand" ? "brand" : null); if (s != null) frame.contentWindow.postMessage({ type: "waraq-focus", sec: s }, location.origin); }
  else { const sel = details.dataset.fid ? { field: details.dataset.fid } : details.dataset.part != null ? { part: +details.dataset.part } : details.dataset.k === "texts" ? { box: "intro" } : null;
    if (sel) frame.contentWindow.postMessage({ type: "waraq-focus", sel }, location.origin); }
}
window.addEventListener("message", (e) => {
  const m = e.data || {};
  if (e.source === $("modal-frame").contentWindow) { if (m.type === "waraq-ready") sendModal(); return; }
  if (e.source !== frame.contentWindow || !CUR) return;
  if (m.type === "waraq-ready") sendPreview();
  if (m.type === "waraq-pick") {
    let key = null;
    if (m.id === "home") key = m.sec === "brand" ? "brand" : CUR.data.sections[+m.sec] && "sec:" + CUR.data.sections[+m.sec].id;
    else if (m.sel) {
      if (m.sel.field) { const pi = CUR.data.parts.findIndex(p => p.fields.some(f => f.id === m.sel.field)); if (pi > -1) { OPEN.request["part:" + CUR.data.parts[pi].id] = true; key = "fld:" + m.sel.field; } }
      else if (m.sel.part != null && CUR.data.parts[m.sel.part]) key = "part:" + CUR.data.parts[m.sel.part].id;
      else if (m.sel.box) key = "texts";
    }
    if (!key) return;
    OPEN[CUR.id][key] = true; renderPanel();
    const el = panel.querySelector(`[data-k="${CSS.escape(key)}"]`);
    if (el) { el.scrollIntoView({ block: "start", behavior: "smooth" }); el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash"); }
  }
});
panel.addEventListener("toggle", (e) => {
  const d = e.target; if (!d.dataset || !d.dataset.k || !CUR) return;
  OPEN[CUR.id][d.dataset.k] = d.open; if (d.open) focusPreview(d);
}, true);
panel.addEventListener("input", (e) => {
  const el = e.target, p = el.dataset.p;
  if (el.dataset.svc != null && CUR) {   // خدمة وكميتها في بطاقة حملة جاهزة → مميزات البطاقة تنكتب منها
    if (!undoTimer) pushUndo(); clearTimeout(undoTimer); undoTimer = setTimeout(() => undoTimer = null, 900);
    const c = getP(CUR.data, el.dataset.svc); if (!c) return;
    const q = { ...(c.svc && typeof c.svc === "object" ? c.svc : {}) }, n = Math.min(999, Math.max(0, Math.floor(+el.value || 0)));
    if (n) q[el.dataset.sid] = n; else delete q[el.dataset.sid];
    c.svc = q; c.items = svcText(q);
    const pv = panel.querySelector(`[data-svcprev="${CSS.escape(el.dataset.svc)}"]`); if (pv) pv.textContent = "تظهر في البطاقة:\n" + (c.items || "—");
    changed(false); return;
  }
  if (!p || !CUR) return;
  if (!undoTimer) pushUndo(); clearTimeout(undoTimer); undoTimer = setTimeout(() => undoTimer = null, 900);
  setP(CUR.data, p, el.type === "checkbox" ? el.checked : el.value);
  if (/\.(fields|sub)\.\d+\.type$/.test(p)) WC.normField(getP(CUR.data, p.slice(0, -5)));
  if (/\.options\.\d+\.dash$/.test(p)) el.dataset.re = "1";
  if (/\.(other|more)$/.test(p)) el.dataset.re = "1";
  if (el.dataset.title) { const t = el.closest(".card")?.querySelector(":scope>summary .tt"); if (t) t.textContent = el.value; }
  changed(!!el.dataset.re);
});
panel.addEventListener("change", (e) => {
  const el = e.target; if (!CUR) return;
  if (el.dataset.wsrc != null) {   // which choice field controls this field
    pushUndo(); const f = getP(CUR.data, el.dataset.wsrc);
    if (el.value) f.when = { f: el.value, o: [] }; else delete f.when;
    changed(true); return;
  }
  if (el.dataset.wopt != null) {   // which options show it
    pushUndo(); const f = getP(CUR.data, el.dataset.wopt);
    f.when = f.when || { f: "", o: [] };
    f.when.o = [...panel.querySelectorAll(`[data-wopt="${CSS.escape(el.dataset.wopt)}"]`)].filter(x => x.checked).map(x => x.value);
    changed(true); return;
  }
  if (el.dataset.move != null) {   // move field to another part
    pushUndo(); const from = +el.dataset.move, to = +el.value, P = CUR.data.parts;
    const k = P[from].fields.findIndex(f => f.id === el.dataset.fid); const [f] = P[from].fields.splice(k, 1); P[to].fields.push(f); if (P[to].hidden && WC.LOCKED[f.key]) P[to].hidden = false;
    OPEN.request["part:" + P[to].id] = true; OPEN.request["fld:" + f.id] = true; changed(true); toast("انتقل الحقل لقسم «" + (P[to].title || "") + "».");
  }
  if (el.dataset.core != null && el.value) {   // bring back a core field
    pushUndo(); const key = el.value, def = WC.defaults("request").parts.flatMap(p => p.fields).find(f => f.key === key) || { key, type: WC.CORE[key], label: CORE_NAMES[key] };
    const f = { ...def, id: uid("f-"), hidden: false }; CUR.data.parts[+el.dataset.core].fields.push(f);
    OPEN.request["fld:" + f.id] = true; changed(true);
  }
});
panel.addEventListener("click", (e) => {
  const b = e.target.closest("[data-op]"); if (!b || !CUR) return;
  e.preventDefault(); e.stopPropagation();
  const op = b.dataset.op, p = b.dataset.p, i = +b.dataset.i, D = CUR.data;
  if (op === "del") { if (!arm(b, "اضغطي الحذف مرة ثانية للتأكيد. وتقدرين تتراجعين بزر «تراجع».")) return; }
  pushUndo();
  if (op === "sec-add") {
    const t = $("sec-type").value, T = TYPES[t]; if (!T) return;
    const data = T.make(), s = { id: uid(t + "-"), type: t, nav: "", toc: data.title || "", data };
    D.sections.splice(Math.max(0, D.sections.length - 2), 0, s); OPEN.home["sec:" + s.id] = true;
    changed(true); setTimeout(() => panel.querySelector(`[data-k="sec:${s.id}"]`)?.scrollIntoView({ block: "center" }), 50); return;
  }
  if (op === "sub-add") {
    let arr = getP(D, p); if (!Array.isArray(arr)) { setP(D, p, []); arr = getP(D, p); }
    arr.push({ id: uid("f-"), key: uid("c_"), type: "text", label: "حقل جديد", width: "half" });
    OPEN[CUR.id][p + "." + (arr.length - 1)] = true; changed(true); return;
  }
  if (op === "part-add") { const pt = { id: uid("p"), title: "قسم جديد", fields: [] }; D.parts.push(pt); OPEN.request["part:" + pt.id] = true; changed(true); return; }
  if (op === "fld-add") { const f = { id: uid("f-"), key: uid("c_"), type: "text", label: "حقل جديد", width: "half" }; D.parts[+b.dataset.pi].fields.push(f); OPEN.request["fld:" + f.id] = true; changed(true); return; }
  let arr = getP(D, p); if (arr === undefined && op === "add") { setP(D, p, []); arr = getP(D, p); } if (!Array.isArray(arr)) return;
  if (op === "add") { arr.push(JSON.parse(b.dataset.tpl)); OPEN[CUR.id][p + "." + (arr.length - 1)] = true; }
  else if (op === "up" && i > 0) [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
  else if (op === "down" && i < arr.length - 1) [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]];
  else if (op === "hide") arr[i].hidden = !arr[i].hidden;
  else if (op === "del") arr.splice(i, 1);
  changed(true);
});
$("ed-undo").addEventListener("click", () => { if (!CUR || !CUR.undo.length) return; CUR.data = JSON.parse(CUR.undo.pop()); changed(true); });
$("ed-revert").addEventListener("click", (e) => { if (!CUR || !arm(e.currentTarget, "اضغطي مرة ثانية: ترجع الصفحة لآخر نسخة محفوظة.")) return; pushUndo(); CUR.data = JSON.parse(CUR.saved); changed(true); });
$("ed-save").addEventListener("click", async () => {
  if (!CUR) return; const E = CUR, btn = $("ed-save"); let json = JSON.stringify(E.data);
  btn.disabled = true; btn.textContent = "جارٍ النشر…";
  try {
    let extra = "";
    if (E.id === "request") {
      reqFields(E.data).forEach(f => { if (Array.isArray(f.options)) f.options.forEach(o => { if (o && !o.id) o.id = uid("o"); }); });
      const before = reqFields(JSON.parse(E.saved)), ren = [];
      reqFields(E.data).forEach(f => { if (!Array.isArray(f.options) || !["picks", "who"].includes(f.key)) return;
        const old = before.find(x => x.key === f.key); if (!old || !Array.isArray(old.options)) return;
        f.options.forEach(o => { const was = old.options.find(x => x && x.id === o.id); if (was && was.t !== o.t) ren.push([f.key, was.t, o.t]); }); });
      json = JSON.stringify(E.data);
      await publish(E.id, json, $("ed-note").value.trim() || "تعديل");
      if (ren.length) {
        const H = ED.home, wasClean = !isDirty("home"); let n = 0;
        homeRefs(H.data, (obj, k, src) => { const r = ren.find(x => x[0] === src && sameRef(obj[k], x[1])); if (r) { obj[k] = r[2]; n++; } });
        if (n && wasClean) { await publish("home", JSON.stringify(H.data), "تحديث أسماء الخيارات تلقائيًا"); extra = " وتحدّث الاسم الجديد في الصفحة الأساسية بعد."; }
        else if (n) { try { localStorage.setItem("waraq-draft-home", JSON.stringify(H.data)); } catch {} extra = " وتحدّث الاسم في الصفحة الأساسية، احفظيها من «تعديل الصفحة الأساسية»."; }
      }
    } else {
      // كل بطاقة حملة جاهزة تاخذ معرّف ثابت (cid) عشان حاسبة الحملات تتبعها لو تغيّر اسمها أو انحذفت
      if (E.id === "home") { const seen = new Set(); (E.data.sections || []).filter(s => s.type === "campaigns").forEach(s => ["a", "b"].forEach(k => (s.data[k] || []).forEach(c => { if (c && (!c.cid || seen.has(c.cid))) c.cid = uid("k"); if (c) seen.add(c.cid); }))); json = JSON.stringify(E.data); }
      await publish(E.id, json, $("ed-note").value.trim() || "تعديل");
      // قائمة «حملة جاهزة» في نموذج الطلب تمشي مع البطاقات: تنضاف، يتغيّر اسمها، أو تنخفي
      if (E.id === "home") {
        try { await loadContent("request"); } catch {}
        const R = ED.request;
        if (R && R.data) {
          const wasClean = !isDirty("request");
          if (syncPkg(E.data, R.data)) {
            if (wasClean) { await publish("request", JSON.stringify(R.data), "تحديث قائمة الحملات الجاهزة تلقائيًا"); extra = " وتحدّثت قائمة «حملة جاهزة» في نموذج الطلب."; }
            else { try { localStorage.setItem("waraq-draft-request", JSON.stringify(R.data)); } catch {} extra = " وتحدّثت قائمة «حملة جاهزة» في صفحة الطلبات، احفظيها من «تعديل صفحة الطلبات»."; }
          }
        }
      }
    }
    $("ed-note").value = ""; toast("انحفظ ونُشر. التعديل ظاهر في الموقع الحين." + extra);
  }
  catch (err) { toast(err.code === "stale" ? "ما انحفظ: فيه نسخة أحدث انحفظت من جهاز أو صفحة ثانية. انسخي تعديلك، وحدّثي الصفحة (F5) وعدّلي على النسخة الجديدة." : "ما انحفظ: " + (err.code || err.message)); }
  finally { btn.textContent = "حفظ ونشر"; updateState(); }
});
document.querySelectorAll("[data-dev]").forEach(b => b.addEventListener("click", () => {
  document.querySelectorAll("[data-dev]").forEach(x => x.setAttribute("aria-pressed", x === b)); $("prev").classList.toggle("mobile", b.dataset.dev === "mobile");
}));
$("ed-show").addEventListener("click", () => $("prev").classList.add("open"));
$("ed-hide").addEventListener("click", () => $("prev").classList.remove("open"));
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s" && (VIEW === "home" || VIEW === "form")) { e.preventDefault(); if (!$("ed-save").disabled) $("ed-save").click(); }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && (VIEW === "home" || VIEW === "form") && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); $("ed-undo").click(); }
  if (e.key === "Escape" && !$("modal").hidden) closeModal();
});

/* =============== history =============== */
const KIND = { home: "الصفحة الأساسية", request: "صفحة الطلبات" };
let HIST = [], hKind = "all", MODAL = null;
async function loadHistory() {
  $("hist").innerHTML = '<div class="skel"></div><div class="skel"></div>'; $("h-empty").hidden = true;
  try {
    await Promise.all([loadContent("home"), loadContent("request")]);
    const s = await F.getDocs(F.query(F.collection(db, "siteHistory"), F.orderBy("at", "desc"), F.limit(300)));
    HIST = s.docs.map(d => ({ id: d.id, ...d.data({ serverTimestamps: "estimate" }) }));
    renderHistory();
  } catch (err) { $("hist").innerHTML = `<li><span></span><span class="what"><b>تعذّر التحميل</b><p>${esc(err.code || err.message)}</p></span></li>`; }
}
function renderHistory() {
  const chip = (k, l, n) => `<button type="button" data-hk="${k}" aria-pressed="${hKind === k}">${l} <span class="num">${toAr(n)}</span></button>`;
  $("h-chips").innerHTML = chip("all", "الكل", HIST.length) + Object.entries(KIND).map(([k, l]) => chip(k, l, HIST.filter(h => h.kind === k).length)).join("");
  const list = HIST.filter(h => hKind === "all" || h.kind === hKind);
  $("h-empty").hidden = !!list.length;
  const curSeen = {};
  $("hist").innerHTML = list.map(h => {
    const isCur = !curSeen[h.kind] && h.json === ED[h.kind].pub; if (isCur) curSeen[h.kind] = 1;
    return `<li><span class="when num">${esc(when(h.at))}</span><span class="what"><b>${esc(KIND[h.kind] || h.kind)}</b>${isCur ? '<span class="cur">المنشورة الحين</span>' : ""}<p>${esc(h.note || "بدون وصف")}</p></span>
      <span class="acts"><button class="btn line sm" type="button" data-hv="${esc(h.id)}">معاينة</button>${isCur ? "" : `<button class="btn sm" type="button" data-hr="${esc(h.id)}">استرجاع</button>`}<button class="ib" type="button" data-hd="${esc(h.id)}" title="حذف النسخة" aria-label="حذف النسخة">${ICON.del}</button></span></li>`;
  }).join("");
}
$("h-chips").addEventListener("click", (e) => { const b = e.target.closest("[data-hk]"); if (b) { hKind = b.dataset.hk; renderHistory(); } });
async function restore(kind, json, note, btn) {
  if (isDirty(kind) && !confirm("عندك تعديلات ما انحفظت على " + KIND[kind] + "، بتنمسح بالاسترجاع. تكملين؟")) return;
  if (btn) btn.disabled = true;
  try {
    await publish(kind, json, note, true);
    ED[kind].data = prep(kind, json); ED[kind].saved = JSON.stringify(ED[kind].data); ED[kind].undo = []; updateState();
    toast("رجعت " + KIND[kind] + " لهذي النسخة، وصارت منشورة."); closeModal(); loadHistory();
  } catch (err) { toast("ما انحفظ: " + (err.code || err.message)); }
  finally { if (btn) btn.disabled = false; }
}
$("hist").addEventListener("click", async (e) => {
  const v = e.target.closest("[data-hv]"), r = e.target.closest("[data-hr]"), d = e.target.closest("[data-hd]");
  const h = HIST.find(x => x.id === (v || r || d)?.dataset[v ? "hv" : r ? "hr" : "hd"]); if (!h) return;
  if (v) openModal(h);
  if (r) { if (!arm(r, "اضغطي «استرجاع» مرة ثانية للتأكيد.")) return; restore(h.kind, h.json, "استرجاع نسخة " + when(h.at), r); }
  if (d) { if (!arm(d, "اضغطي مرة ثانية لحذف هذي النسخة من السجل.")) return;
    try { await F.deleteDoc(F.doc(db, "siteHistory", h.id)); HIST = HIST.filter(x => x !== h); renderHistory(); } catch (err) { toast("ما انحذفت: " + (err.code || err.message)); } }
});
document.querySelectorAll("[data-orig]").forEach(b => b.addEventListener("click", () => {
  const k = b.dataset.orig; if (!arm(b, "اضغطي مرة ثانية: ترجع " + KIND[k] + " للنسخة الأصلية (والحالية تبقى في السجل).")) return;
  restore(k, JSON.stringify(WC.defaults(k)), "رجوع للنسخة الأصلية", b);
}));
function openModal(h) {
  MODAL = h; $("modal-t").textContent = KIND[h.kind] + " · " + when(h.at) + (h.note ? " · " + h.note : "");
  $("modal-restore").hidden = h.json === ED[h.kind].pub;
  $("modal").hidden = false; $("modal-frame").src = (h.kind === "home" ? "index.html" : "request.html") + "?preview=1&v=" + h.id;
}
function sendModal() { if (MODAL) $("modal-frame").contentWindow.postMessage({ type: "waraq-content", id: MODAL.kind, content: JSON.parse(MODAL.json), home: ED.home.data, request: ED.request.data }, location.origin); }
function closeModal() { $("modal").hidden = true; $("modal-frame").src = "about:blank"; MODAL = null; }
$("modal-close").addEventListener("click", closeModal);
$("modal-restore").addEventListener("click", (e) => { if (MODAL) { if (!arm(e.currentTarget, "اضغطي مرة ثانية للتأكيد.")) return; restore(MODAL.kind, MODAL.json, "استرجاع نسخة " + when(MODAL.at), e.currentTarget); } });

/* =============== agreement text (used by the campaign calculator: calc/agreement) =============== */
const AGR_DOC = () => F.doc(db, "calc", "agreement");
let AGR_LOADED = false;
async function loadAgr() {
  const t = $("agr-text"), m = $("agr-msg");
  $("agr-keys").innerHTML = (window.AGR_KEYS || []).map(([k, l]) => `<button type="button" data-agk="${esc(k)}" title="${esc(l)}">{${esc(k)}}</button>`).join("");
  if (AGR_LOADED) return;
  t.disabled = true;
  try { const s = await F.getDoc(AGR_DOC()); t.value = (s.exists() && (s.data().client || "").trim()) || window.AGR_DEFAULT || ""; AGR_LOADED = true; m.textContent = ""; }
  catch (err) { m.className = "saved err"; m.textContent = "ما قدرت أحمّل النص: " + (err.code || err.message); }
  finally { t.disabled = false; }
}
$("agr-keys").addEventListener("click", (e) => {
  const b = e.target.closest("[data-agk]"); if (!b) return; const t = $("agr-text"), ins = "{" + b.dataset.agk + "}";
  const a = t.selectionStart ?? t.value.length, z = t.selectionEnd ?? a;
  t.value = t.value.slice(0, a) + ins + t.value.slice(z); t.focus(); t.selectionStart = t.selectionEnd = a + ins.length;
});
$("agr-save").addEventListener("click", async (e) => {
  const b = e.currentTarget, m = $("agr-msg"), v = $("agr-text").value.trim();
  if (!v) { m.className = "saved err"; m.textContent = "النص فاضي. لو تبين الأصلي اضغطي «رجوع للنص الأصلي»."; return; }
  b.disabled = true;
  try { await F.setDoc(AGR_DOC(), { client: v.slice(0, 30000), updatedAt: F.serverTimestamp() }); m.className = "saved"; m.textContent = "انحفظ. الحاسبة بتستخدم النص الجديد."; }
  catch (err) { m.className = "saved err"; m.textContent = "ما انحفظ: " + (err.code || err.message); }
  finally { b.disabled = false; }
});
$("agr-reset").addEventListener("click", (e) => {
  if (!arm(e.currentTarget, "اضغطي مرة ثانية: يرجع النص الأصلي في المربع، وبعدها اضغطي «حفظ».")) return;
  $("agr-text").value = window.AGR_DEFAULT || ""; $("agr-msg").className = "saved"; $("agr-msg").textContent = "رجع النص الأصلي. اضغطي «حفظ» عشان يتطبّق.";
});

/* =============== WhatsApp: confirm and edit before opening =============== */
const waDlg = $("wa-dlg");
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-wa]"); if (!b) return;
  e.preventDefault();
  waDlg.dataset.n = b.dataset.wa; $("wa-dlg-to").textContent = "إلى: " + (b.dataset.wato || "") + " (" + b.dataset.wa + ")"; $("wa-dlg-msg").value = b.dataset.wam || "";
  waDlg.showModal(); $("wa-dlg-msg").focus();
});
$("wa-dlg-go").addEventListener("click", (e) => {
  e.preventDefault();
  window.open("https://wa.me/" + waDlg.dataset.n + "?text=" + encodeURIComponent($("wa-dlg-msg").value), "_blank", "noopener");
  waDlg.close(); toast("انفتح الواتساب والرسالة جاهزة. اضغطي إرسال فيه.");
});
$("wa-dlg-no").addEventListener("click", () => waDlg.close());

/* =============== settings =============== */
async function renderTpl() {
  try { await loadExec(true); } catch { return; }
  ["customer", "join", "exec"].forEach(k => { $("tpl-" + k).value = TPL[k] || TPL_DEF[k]; });
}
$("tpl-save").addEventListener("click", async () => {
  const m = $("tpl-msg"), tpl = {}; ["customer", "join", "exec"].forEach(k => { tpl[k] = $("tpl-" + k).value.trim().slice(0, 1500) || TPL_DEF[k]; });
  $("tpl-save").disabled = true; m.textContent = "";
  try { await F.setDoc(EXEC_DOC(), { tpl, updatedAt: F.serverTimestamp() }, { merge: true }); TPL = tpl; m.className = "saved"; m.textContent = "انحفظ."; }
  catch (err) { m.className = "saved err"; m.textContent = "ما انحفظ: " + (err.code || err.message); } finally { $("tpl-save").disabled = false; }
});
$("tpl-reset").addEventListener("click", (e) => {
  if (!arm(e.currentTarget, "اضغطي مرة ثانية: ترجع الرسائل للنص الأصلي (ما تنحفظ إلا لما تضغطين حفظ).")) return;
  ["customer", "join", "exec"].forEach(k => { $("tpl-" + k).value = TPL_DEF[k]; });
});
let TEAM = [];
const teamRow = (p) => `<div class="exrow team" data-pid="${esc(p.id)}">
  <input data-t="name" aria-label="الاسم" placeholder="الاسم" value="${esc(p.name || "")}">
  <input data-t="role" aria-label="الوظيفة" placeholder="الوظيفة (مثل: مصمم)" value="${esc(p.role || "")}">
  <input data-t="phone" aria-label="رقم الجوال" dir="ltr" inputmode="tel" placeholder="05xxxxxxxx" value="${esc(p.phone || "")}">
  <input data-t="email" aria-label="الإيميل (اختياري)" dir="ltr" type="email" placeholder="الإيميل (اختياري)" value="${esc(p.email || "")}">
  <button class="btn danger sm" type="button" data-tdel aria-label="حذف ${esc(p.name || "الشخص")}">حذف</button></div>`;
async function renderTeam() {
  const box = $("team-list"); box.innerHTML = '<div class="skel"></div>';
  try { await loadExec(true); } catch (err) { box.innerHTML = `<p class="hint">تعذّر التحميل: ${esc(err.code || err.message)}</p>`; return; }
  TEAM = PEOPLE.map(p => ({ ...p })); drawTeam();
}
function drawTeam() {
  $("team-list").innerHTML = TEAM.length ? `<div class="exrow team head"><span>الاسم</span><span>الوظيفة</span><span>الجوال</span><span>الإيميل</span><span></span></div>` + TEAM.map(teamRow).join("")
    : '<p class="hint">ما فيه أحد. اضغطي «+ إضافة شخص».</p>';
}
function readTeam() {
  document.querySelectorAll("#team-list [data-pid]").forEach(row => {
    const p = TEAM.find(x => x.id === row.dataset.pid); if (!p) return;
    row.querySelectorAll("[data-t]").forEach(i => { p[i.dataset.t] = i.value.trim(); });
  });
}
$("team-add").addEventListener("click", () => { readTeam(); TEAM.push({ id: uid("p"), name: "", role: "", phone: "", email: "" }); drawTeam(); const r = $("team-list").querySelector(".exrow.team:last-child input"); if (r) r.focus(); });
$("team-list").addEventListener("click", (e) => {
  const x = e.target.closest("[data-tdel]"); if (!x) return;
  if (!arm(x, "اضغطي «حذف» مرة ثانية للتأكيد.")) return;
  readTeam(); TEAM = TEAM.filter(p => p.id !== x.closest("[data-pid]").dataset.pid); drawTeam();
});
$("team-save").addEventListener("click", async () => {
  readTeam(); const m = $("team-msg"); let bad = null;
  const list = TEAM.filter(p => p.name || p.phone || p.email || p.role).map(p => ({ id: p.id, name: p.name.slice(0, 80), role: (p.role || "").slice(0, 80), phone: waNum(p.phone), email: (p.email || "").slice(0, 120) }));
  list.forEach(p => {
    if (!p.name) bad = bad || "فيه شخص بدون اسم";
    else if (p.phone.length < 10 || p.phone.length > 15) bad = bad || p.name + ": رقم الجوال غير صحيح";
    else if (p.email && !okEmail(p.email)) bad = bad || p.name + ": الإيميل غير صحيح";
  });
  if (bad) { m.className = "saved err"; m.textContent = bad + "."; return; }
  $("team-save").disabled = true; m.textContent = "";
  try { await F.setDoc(EXEC_DOC(), { people: list, updatedAt: F.serverTimestamp() }, { merge: true }); PEOPLE = list; TEAM = list.map(p => ({ ...p })); drawTeam(); m.className = "saved"; m.textContent = "انحفظ."; }
  catch (err) { m.className = "saved err"; m.textContent = "ما انحفظ: " + (err.code || err.message); } finally { $("team-save").disabled = false; }
});
const NOTIFY = F.doc(db, "siteSettings", "notify");
/* إقفال الموقع مؤقتًا: siteSettings/site { closed, msg } — الموقع يقرأه ويعرض صفحة الإقفال للزوار */
const SITE = F.doc(db, "siteSettings", "site");
let CLOSED = { closed: false, msg: "" };
function drawClosed() {
  $("cl-btn").textContent = CLOSED.closed ? "افتحي الموقع للزوار" : "اقفلي الموقع مؤقتًا";
  $("cl-btn").className = CLOSED.closed ? "btn sm" : "btn line sm";
  $("cl-state").textContent = CLOSED.closed ? "مقفل الحين" : "مفتوح"; $("cl-state").dataset.s = CLOSED.closed ? "rejected" : "approved";
  if (document.activeElement !== $("cl-msg")) $("cl-msg").value = CLOSED.msg || "";
}
async function loadClosed() { try { const s = await F.getDoc(SITE); CLOSED = s.exists() ? { closed: !!s.data().closed, msg: s.data().msg || "" } : { closed: false, msg: "" }; } catch {} drawClosed(); }
$("cl-btn").addEventListener("click", async (e) => {
  const next = !CLOSED.closed, b = e.currentTarget, m = $("cl-msgbox");
  if (next && !arm(b, "اضغطي مرة ثانية للتأكيد: الزوار بيشوفون «الموقع مغلق مؤقتًا» لين تفتحينه.")) return;
  b.disabled = true; m.textContent = "";
  const val = { closed: next, msg: $("cl-msg").value.trim().slice(0, 300), updatedAt: F.serverTimestamp() };
  try { await F.setDoc(SITE, val); CLOSED = { closed: next, msg: val.msg }; drawClosed(); m.className = "saved"; m.textContent = next ? "انقفل الموقع للزوار." : "انفتح الموقع للزوار."; }
  catch (err) { m.className = "saved err"; m.textContent = "ما انحفظ: " + (err.code || err.message); }
  finally { b.disabled = false; }
});
const okEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const nmsg = (t, bad) => { $("ntf-msg").textContent = t; $("ntf-msg").className = "saved" + (bad ? " err" : ""); };
async function loadSettings() { loadClosed(); try { const s = await F.getDoc(NOTIFY), d = s.exists() ? s.data() : {}; $("ntf").value = d.email || ""; } catch {} }
$("ntf-save").addEventListener("click", async () => {
  const v = $("ntf").value.trim(); if (v && !okEmail(v)) return nmsg("البريد غير صحيح.", true);
  $("ntf-save").disabled = true; nmsg("");
  try { await F.setDoc(NOTIFY, { email: v, updatedAt: F.serverTimestamp() }, { merge: true }); nmsg(v ? "انحفظ. اضغطي «إرسال إيميل تجربة»." : "انحفظ. التنبيهات متوقفة."); }
  catch (err) { nmsg("ما انحفظ: " + (err.code || err.message), true); } finally { $("ntf-save").disabled = false; }
});
$("ntf-test").addEventListener("click", async () => {
  const v = $("ntf").value.trim(); if (!okEmail(v)) return nmsg("اكتبي البريد واحفظيه أول.", true);
  $("ntf-test").disabled = true; nmsg("جارٍ الإرسال…");
  try {
    const r = await fetch("https://formsubmit.co/ajax/" + v, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ _subject: "تجربة تنبيهات وكالة رحلة ورق للدعاية والإعلان", _template: "box", _captcha: "false", message: "هذا إيميل تجربة من صفحة إدارة الوكالة. إذا وصلك، التنبيهات شغالة." }) });
    const j = await r.json().catch(() => ({}));
    if (String(j.success) === "true") nmsg("انرسل. شيّكي على بريدك.");
    else if (/activat/i.test(j.message || "")) nmsg("وصلك إيميل تفعيل من FormSubmit. افتحيه واضغطي Activate Form، وبعدها جرّبي مرة ثانية.");
    else nmsg("ما انرسل: " + (j.message || r.status), true);
  } catch { nmsg("ما انرسل. تأكدي من الاتصال.", true); } finally { $("ntf-test").disabled = false; }
});
