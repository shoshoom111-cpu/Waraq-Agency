/* يرسم الصفحة الأساسية من المحتوى (المحفوظ أو الأصلي)، ويشغّل نموذج انضمام المسوقين.
   ?preview=1: وضع المعاينة داخل المحرر (يستقبل المحتوى من المحرر ويعلّم القسم اللي تضغطين عليه). */
(function(){
"use strict";
var CFG=window.WARAQ||{}, FB=CFG.firebase||{};
var PREVIEW=/[?&]preview=1/.test(location.search);
var hasDB=!!(FB.apiKey&&FB.projectId&&FB.appId);
var SDK="https://www.gstatic.com/firebasejs/10.12.2/";
var C=null, WA="", hasWA=false;
var AR="٠١٢٣٤٥٦٧٨٩", CHEV='<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
function $(i){return document.getElementById(i)}
function each(l,f){Array.prototype.forEach.call(l,f)}
function esc(t){return String(t==null?"":t).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function ar(n){return String(n)}
function vis(list){return (list||[]).filter(function(x){return x&&!x.hidden})}
function lines(s){return String(s||"").split("\n").map(function(x){return x.trim()}).filter(Boolean)}
function tags(s){return String(s||"").split(/[،,]/).map(function(x){return x.trim()}).filter(Boolean)}
function wa(text){return "https://wa.me/"+WA+"?text="+encodeURIComponent(text)}
function reqLink(q){var p=new URLSearchParams();Object.keys(q).forEach(function(k){if(q[k])p.set(k,q[k])});var s=p.toString();return "request.html"+(s?"?"+s:"")}
function safeUrl(u){u=String(u||"").trim();return /^(https?:|mailto:|tel:|#|\/|[\w.\-]+\.html)/i.test(u)?u:"#"}
function socials(){return '<span class="soc">'+vis(C.brand.socials).filter(function(s){return s.url}).map(function(s){return '<a href="'+esc(safeUrl(s.url))+'" target="_blank" rel="noopener">'+esc(s.name)+'</a>'}).join("")+'</span>'}
function head(n,d){return '<div class="head"><h2>'+esc(d.title)+'</h2>'+(d.sub?'<p>'+esc(d.sub)+'</p>':'')+'</div>'}
function anchor(s){return s.type==="request"?"request.html":"#"+s.id}

/* ---------- sections ---------- */
var R={
  hero:function(s,i,ctx){
    var d=s.data, firstLink=ctx.secs.filter(function(x){return x.type==="campaigns"})[0]||ctx.secs.filter(function(x){return x.type!=="hero"})[0];
    return '<div class="wrap" data-sec="'+i+'"><div class="hero"><div>'+
      '<h1>'+esc(d.title)+(d.highlight?' <span class="hl">'+esc(d.highlight)+'</span>':'')+'</h1>'+
      (d.lead?'<p class="lead">'+esc(d.lead)+'</p>':'')+
      '<div class="cta">'+(d.cta1?'<a class="btn" href="request.html">'+esc(d.cta1)+'</a>':'')+(d.cta2&&firstLink?'<a class="btn line" href="'+anchor(firstLink)+'">'+esc(d.cta2)+'</a>':'')+'</div>'+
      (vis(d.bullets).length?'<ul class="for">'+vis(d.bullets).map(function(b){return '<li>'+esc(b.text)+'</li>'}).join("")+'</ul>':'')+
      '</div></div></div>';
  },
  services:function(s,i,ctx){
    var items=vis(s.data.items);
    return '<div class="wrap" data-sec="'+i+'"><section id="'+esc(s.id)+'">'+head(ctx.folio[s.id],s.data)+'<ol class="svc">'+items.map(function(it,k){
      var tg=tags(it.tags);
      var body=(it.text?'<p>'+esc(it.text)+'</p>':'')+(tg.length?'<div class="tags">'+tg.map(function(t){return '<span>'+esc(t)+'</span>'}).join("")+'</div>':'');
      return '<li><details><summary><span class="n">'+ar(k+1)+'</span><h3>'+esc(it.title)+'</h3>'+(body?CHEV:'')+'</summary>'+(body?'<div class="svc-b">'+body+'</div>':'')+'</details></li>';
    }).join("")+'</ol></section></div>';
  },
  campaigns:function(s,i,ctx){
    var d=s.data, A=vis(d.a), B=vis(d.b), two=A.length&&B.length, pubWho=whoPublisher();
    function card(c,pub){
      var href=reqLink({pick:c.pick,pkg:c.title+(pub&&!/\(.*\)$/.test(c.title)?" (دار نشر)":""),who:pub?pubWho:""});
      // الوصف ظاهر تحت اسم الحملة، و«التفاصيل» فيها المميزات بس
      var more=lines(c.items).length?'<ul>'+lines(c.items).map(function(x){return '<li>'+esc(x)+'</li>'}).join("")+'</ul>':'';
      return '<article class="card'+(c.star?' star':'')+'">'+(c.label?'<span class="lbl">'+esc(c.label)+'</span>':'')+'<h3>'+esc(c.title)+'</h3>'+(c.text?'<p class="desc">'+esc(c.text)+'</p>':'')+
        (more?'<details class="more"><summary aria-label="'+esc((d.more||"التفاصيل")+": "+c.title)+'">'+esc(d.more||"التفاصيل")+CHEV+'</summary>'+more+'</details>':'')+'<span class="grow"></span>'+
        '<a class="btn'+(c.star?'':' line')+'" href="'+esc(href)+'" aria-label="'+esc((d.button||"اطلب هذه الحملة")+": "+c.title)+'">'+esc(d.button||"اطلب هذه الحملة")+'</a></article>';
    }
    return '<div class="wrap" data-sec="'+i+'"><section id="'+esc(s.id)+'">'+head(ctx.folio[s.id],d)+
      (two?'<div class="aud" role="tablist" aria-label="نوع العميل"><button type="button" role="tab" id="t-auth-'+i+'" data-tab="a" aria-selected="true" aria-controls="pk-a-'+i+'">'+esc(d.tabA)+'</button>'+
        '<button type="button" role="tab" id="t-pub-'+i+'" data-tab="b" aria-selected="false" aria-controls="pk-b-'+i+'" tabindex="-1">'+esc(d.tabB)+'</button></div>':'')+
      (A.length?'<div class="pk" id="pk-a-'+i+'" role="tabpanel"'+(two?' aria-labelledby="t-auth-'+i+'"':'')+'>'+A.map(function(c){return card(c,false)}).join("")+'</div>':'')+
      (B.length?'<div class="pk" id="pk-b-'+i+'" role="tabpanel"'+(two?' aria-labelledby="t-pub-'+i+'" hidden':'')+'>'+B.map(function(c){return card(c,true)}).join("")+'</div>':'')+
      '</section></div>';
  },
  cols:function(s,i,ctx){
    var items=vis(s.data.items);
    return '<div class="wrap" data-sec="'+i+'"><section id="'+esc(s.id)+'">'+head(ctx.folio[s.id],s.data)+'<div class="why" style="--n:'+Math.max(1,Math.min(4,items.length))+'">'+
      items.map(function(it){return '<div><h3>'+esc(it.title)+'</h3><p>'+esc(it.text)+'</p></div>'}).join("")+'</div></section></div>';
  },
  steps:function(s,i,ctx){
    var items=vis(s.data.items);
    return '<div class="wrap" data-sec="'+i+'"><section id="'+esc(s.id)+'">'+head(ctx.folio[s.id],s.data)+'<ol class="steps" style="--n:'+Math.max(1,Math.min(6,items.length))+'">'+
      items.map(function(it){return '<li><h3>'+esc(it.title)+'</h3><p>'+esc(it.text)+'</p></li>'}).join("")+'</ol></section></div>';
  },
  band:function(s,i){
    var d=s.data;
    return '<div class="wrap" data-sec="'+i+'"><section id="'+esc(s.id)+'"><div class="band"><div><h2><span>'+esc(d.title)+'</span></h2>'+(d.text?'<p>'+esc(d.text)+'</p>':'')+'</div>'+
      (d.button?'<a class="btn" href="'+esc(reqLink({who:d.who,pick:d.pick}))+'">'+esc(d.button)+'</a>':'')+'</div></section></div>';
  },
  faq:function(s,i,ctx){
    return '<div class="wrap" data-sec="'+i+'"><section id="'+esc(s.id)+'">'+head(ctx.folio[s.id],s.data)+'<div class="faq">'+
      vis(s.data.items).map(function(it){return '<details><summary>'+esc(it.q)+'</summary><p>'+esc(it.a)+'</p></details>'}).join("")+'</div></section></div>';
  },
  text:function(s,i,ctx){
    var ps=String(s.data.text||"").split(/\n\s*\n/).map(function(p){return p.trim()}).filter(Boolean);
    return '<div class="wrap" data-sec="'+i+'"><section id="'+esc(s.id)+'">'+head(ctx.folio[s.id],s.data)+'<div class="prose">'+
      ps.map(function(p){return '<p>'+esc(p).replace(/\n/g,"<br>")+'</p>'}).join("")+'</div></section></div>';
  },
  quotes:function(s,i,ctx){
    return '<div class="wrap" data-sec="'+i+'"><section id="'+esc(s.id)+'">'+head(ctx.folio[s.id],s.data)+'<div class="quotes">'+
      vis(s.data.items).map(function(it){return '<figure><blockquote><p>'+esc(it.quote)+'</p></blockquote><figcaption><b>'+esc(it.name)+'</b>'+(it.role?'<span>'+esc(it.role)+'</span>':'')+'</figcaption></figure>'}).join("")+
      '</div></section></div>';
  },
  request:function(s,i,ctx){
    var d=s.data;
    return '<section class="req" id="'+esc(s.id)+'" data-sec="'+i+'"><div class="wrap">'+head(ctx.folio[s.id],d)+
      '<div class="start"><div><h3>'+esc(d.boxTitle)+'</h3><p>'+esc(d.boxText)+'</p></div><a class="btn" href="request.html">'+esc(d.button||"ابدأ الطلب")+'</a></div>'+
      '<div class="contact">'+(hasWA&&d.waButton?'<a class="btn wa" href="'+esc(wa("السلام عليكم، أرغب بالاستفسار عن خدمات وكالة "+C.brand.name+"."))+'" target="_blank" rel="noopener">'+esc(d.waButton)+'</a>':'')+
      '<p>'+esc(d.socialText)+' <span class="handle">'+esc(C.brand.handle)+'</span></p>'+socials()+'</div></div></section>';
  },
  join:function(s,i,ctx){
    var d=s.data;
    return '<section class="req alt2" id="'+esc(s.id)+'" data-sec="'+i+'"><div class="wrap">'+head(ctx.folio[s.id],d)+
    '<form id="mk-form" novalidate>'+
      '<div><label for="mk-name">الاسم</label><input type="text" id="mk-name" autocomplete="name" maxlength="120" required></div>'+
      '<div><label for="mk-handle">الحساب</label><input type="text" id="mk-handle" dir="ltr" placeholder="@" maxlength="120" required></div>'+
      '<div><label for="mk-contact">الجوال <small>(واتساب)</small></label><input type="text" id="mk-contact" dir="ltr" inputmode="tel" autocomplete="tel" placeholder="05xxxxxxxx" maxlength="20"></div>'+
      '<div><label for="mk-genre">نوع الكتب التي تقدّمها</label><input type="text" id="mk-genre" placeholder="روايات، فكر، أطفال..." maxlength="200"></div>'+
      '<fieldset class="full"><legend>المنصات</legend><div class="picks" id="mk-plat">'+["تيك توك","إنستقرام","إكس","سناب شات"].map(function(p,k){return '<label for="pl-'+(k+1)+'"><input type="checkbox" id="pl-'+(k+1)+'" value="'+p+'">'+p+'</label>'}).join("")+'</div></fieldset>'+
      '<div><label for="mk-views">متوسط المشاهدات للمقطع</label><input type="text" id="mk-views" inputmode="numeric" maxlength="40"></div>'+
      '<div><label for="mk-price">سعرك للمقطع (ريال)</label><input type="text" id="mk-price" inputmode="numeric" maxlength="40"></div>'+
      '<fieldset class="full"><legend>رخصة موثوق</legend><div class="picks" id="mk-lic">'+["لدي رخصة","قيد الإصدار","لا يوجد"].map(function(p,k){return '<label for="lc-'+(k+1)+'"><input type="radio" name="lic" id="lc-'+(k+1)+'" value="'+p+'">'+p+'</label>'}).join("")+'</div></fieldset>'+
      '<div class="hp" aria-hidden="true"><label for="mk-web">اترك هذا الحقل فارغًا</label><input type="text" id="mk-web" tabindex="-1" autocomplete="off"></div>'+
      '<div class="full send"><button type="submit" class="btn" id="mk-go"><span class="spin" aria-hidden="true"></span><span class="t">'+esc(d.button||"أرسل طلب الانضمام")+'</span></button><span class="err" id="mk-err" role="alert"></span><p class="consent">بإرسال الطلب توافق على استخدام بياناتك للتواصل معك بخصوص الانضمام، كما في <a href="privacy.html">سياسة الخصوصية</a>.</p></div>'+
      '<div class="out" id="mk-out" hidden tabindex="-1"><div class="ok" hidden><svg viewBox="0 0 34 34" aria-hidden="true"><rect x="1" y="1" width="32" height="32" fill="#ffd84a" stroke="currentColor" stroke-width="2"/><path d="M9 17.5l5.5 5.5L25 12" fill="none" stroke="currentColor" stroke-width="2.6"/></svg>'+
        '<div><h3><span>'+esc(d.okTitle)+'</span></h3><p>رقم الطلب <span class="ref"></span>. '+esc(d.okText)+'</p></div></div>'+
        '<div class="fb"><p class="note warn" hidden></p><label for="mk-text">طلب الانضمام جاهز للإرسال</label><textarea id="mk-text" readonly></textarea>'+
        '<div class="row">'+(hasWA?'<a class="btn wa" id="mk-wa" href="#" target="_blank" rel="noopener">إرسال بالواتساب</a>':'')+'<button type="button" class="btn line" data-copy="mk-text">نسخ الطلب</button><span class="done" aria-live="polite"></span></div></div></div>'+
    '</form></div></section>';
  }
};
var whoOpts=null;
function whoPublisher(){return whoOpts&&whoOpts[1]||"دار نشر"}

function render(content){
  C=content;
  WA=String(C.brand.whatsapp||CFG.whatsapp||"").replace(/\D/g,""); hasWA=/^\d{8,15}$/.test(WA);
  var secs=C.sections.filter(function(s){return !s.hidden&&R[s.type]});
  var folio={}, n=0;
  secs.forEach(function(s){if(s.type!=="hero"&&s.type!=="band")folio[s.id]=++n});
  var ctx={secs:secs,folio:folio};
  var navs=secs.filter(function(s){return s.nav});
  var reqSec=secs.filter(function(s){return s.type==="request"})[0];
  var html='<a class="skip" href="request.html">انتقل إلى طلب الخدمة</a>'+
    '<div class="top" data-sec="brand"><div class="wrap"><header class="mast"><a class="brand" href="#top"><b>'+esc(C.brand.name)+'</b><span>'+esc(C.brand.tagline)+'</span></a>'+
    '<a class="btn mcta" href="request.html">'+esc(C.brand.cta)+'</a><nav aria-label="أقسام الصفحة">'+
    vis(C.brand.links).filter(function(l){return l.text&&l.url}).map(function(l){var ext=/^https?:/i.test(l.url);return '<a class="xl" href="'+esc(safeUrl(l.url))+'"'+(ext?' target="_blank" rel="noopener"':'')+'>'+esc(l.text)+'</a>'}).join("")+
    navs.map(function(s){return '<a href="'+anchor(s)+'">'+esc(s.nav)+'</a>'}).join("")+
    '<a class="btn" href="request.html">'+esc(C.brand.cta)+'</a></nav></header></div></div>'+
    '<main id="top">'+C.sections.map(function(s,i){return s.hidden||!R[s.type]?"":R[s.type](s,i,ctx)}).join("")+'</main>'+
    '<div class="wrap" data-sec="brand"><footer><b>'+esc(C.brand.name)+'</b><span>'+esc(C.brand.tagline)+'</span>'+socials()+
    (C.brand.handle?'<span class="handle">'+esc(C.brand.handle)+'</span>':'')+(C.brand.domain?'<span class="handle">'+esc(C.brand.domain)+'</span>':'')+
    (C.brand.year?'<span>© '+esc(C.brand.year)+'</span>':'')+'</footer></div>';
  var y=window.scrollY;
  $("site").innerHTML=html;
  if(PREVIEW)window.scrollTo(0,y);
  if(C.seo){if(C.seo.title)document.title=C.seo.title;var md=document.querySelector('meta[name=description]');if(md&&C.seo.description)md.setAttribute("content",C.seo.description)}
  document.body.classList.remove("loading");
  watchNav();
  if(!PREVIEW&&location.hash&&!render.jumped){render.jumped=true;var t=document.getElementById(location.hash.slice(1));if(t)t.scrollIntoView()}
}

/* ---------- tabs (event delegation so it survives re-rendering) ---------- */
function setTab(tl,b,focus){
  var tabsEls=tl.querySelectorAll("[role=tab]");
  each(tabsEls,function(t){var on=t===b;t.setAttribute("aria-selected",on);t.tabIndex=on?0:-1;var p=$(t.getAttribute("aria-controls"));if(p)p.hidden=!on;if(on&&focus)t.focus()});
}
document.addEventListener("click",function(e){var b=e.target.closest(".aud [role=tab]");if(b)setTab(b.parentNode,b)});
document.addEventListener("keydown",function(e){
  var b=e.target.closest&&e.target.closest(".aud [role=tab]");if(!b)return;
  if(["ArrowLeft","ArrowRight","Home","End"].indexOf(e.key)<0)return;e.preventDefault();
  var all=b.parentNode.querySelectorAll("[role=tab]"), k=Array.prototype.indexOf.call(all,b);
  k=e.key==="Home"?0:e.key==="End"?all.length-1:(k+1)%all.length; setTab(b.parentNode,all[k],true);
});

/* ---------- current section in the nav ---------- */
var io=null;
function watchNav(){
  if(!("IntersectionObserver" in window))return;
  if(io)io.disconnect();
  var links={};each(document.querySelectorAll(".mast nav a:not(.btn)"),function(a){var h=a.getAttribute("href");if(h.charAt(0)==="#")links[h.slice(1)]=a});
  io=new IntersectionObserver(function(es){es.forEach(function(e){
    var a=links[e.target.id];if(!a||!e.isIntersecting)return;
    each(document.querySelectorAll(".mast nav a[aria-current]"),function(x){x.removeAttribute("aria-current")});a.setAttribute("aria-current","true");
  })},{rootMargin:"-45% 0px -50% 0px"});
  Object.keys(links).forEach(function(id){var s=$(id);if(s)io.observe(s)});
}

/* ---------- Firestore (marketers join form) ---------- */
var dbReady=null;
function db(){
  if(!dbReady){
    dbReady=Promise.all([import(SDK+"firebase-app.js"),import(SDK+"firebase-firestore.js")]).then(function(m){return {fs:m[1],db:m[1].getFirestore(m[0].initializeApp(FB))}});
    dbReady.catch(function(){dbReady=null});
  }
  return dbReady;
}
/* تنبيه واتساب لجوال الوكالة عن طريق CallMeBot (الرقم والمفتاح من الإعدادات) */
function waSend(d,subject,ls){
  var ph=String(d.waPhone||"").replace(/\D/g,""), key=String(d.waKey||"").trim(); if(ph.length<10||!key)return;
  var text=(subject+"\n\n"+ls.filter(function(l,i){return i>1||l}).join("\n")).slice(0,1500);
  try{fetch("https://api.callmebot.com/whatsapp.php?phone=%2B"+ph+"&apikey="+encodeURIComponent(key)+"&text="+encodeURIComponent(text),{mode:"no-cors",keepalive:true}).catch(function(){})}catch(e){}
}
function notify(x,subject,ls){
  return x.fs.getDoc(x.fs.doc(x.db,"siteSettings","notify")).then(function(s){
    var d=s.exists()?s.data():{}, em=String(d.email||"").trim();
    waSend(d,subject,ls);
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em))return;
    return fetch("https://formsubmit.co/ajax/"+em,{method:"POST",keepalive:true,headers:{"Content-Type":"application/json","Accept":"application/json"},
      body:JSON.stringify({_subject:subject,_template:"box",_captcha:"false",message:ls.join("\n")+"\n\nتفاصيل الطلب في صفحة طلبات الوكالة ولوحة المسوقين."})});
  }).catch(function(e){if(window.console)console.warn("notify:",e)});
}
function save(col,data,ls,onLate){
  return db().then(function(x){
    Object.keys(data).forEach(function(k){if(data[k]==="")delete data[k]});
    data.state="new";data.createdAt=x.fs.serverTimestamp();data.source=(location.hostname||"local").slice(0,100);
    var work=x.fs.addDoc(x.fs.collection(x.db,col),data).then(function(ref){notify(x,"طلب انضمام مسوق: "+data.name,ls);return ref});
    var late=false; work.then(function(ref){if(late&&onLate)onLate(ref)},function(){});
    return Promise.race([work,new Promise(function(_,rej){setTimeout(function(){late=true;rej(new Error("timeout"))},20000)})]);
  });
}
if(hasDB&&!PREVIEW)document.addEventListener("focusin",function f(e){if(e.target.closest&&e.target.closest("#mk-form")){document.removeEventListener("focusin",f);db().catch(function(){})}});

function val(i){return $(i).value.trim()}
function checked(box){return Array.prototype.filter.call($(box).querySelectorAll("input"),function(c){return c.checked}).map(function(c){return c.value})}
function digits(s){return String(s||"").replace(/[٠-٩]/g,function(c){return c.charCodeAt(0)-0x660}).replace(/[۰-۹]/g,function(c){return c.charCodeAt(0)-0x6F0}).replace(/\D/g,"")}
function fail(field,msg){$("mk-err").textContent=msg;if(field){$(field).setAttribute("aria-invalid","true");$(field).focus()}}
function busy(btn,on){btn.disabled=on;btn.setAttribute("aria-busy",on);var t=btn.querySelector(".t");if(!btn.dataset.label)btn.dataset.label=t.textContent;t.textContent=on?"جارٍ الإرسال…":btn.dataset.label}
function showOut(ok,ref,ls,warn){
  var out=$("mk-out");out.querySelector(".ok").hidden=!ok;out.querySelector(".fb").hidden=ok;
  if(ok)out.querySelector(".ref").textContent=ref;
  else{var n=out.querySelector(".note");n.hidden=!warn;n.textContent=warn||"";$("mk-text").value=ls.join("\n");if(hasWA&&$("mk-wa"))$("mk-wa").href=wa(ls.join("\n"));out.querySelector(".done").textContent=""}
  out.hidden=false;out.focus({preventScroll:true});out.scrollIntoView({block:"nearest",behavior:"smooth"});
}
document.addEventListener("submit",function(e){
  if(e.target.id!=="mk-form")return;
  e.preventDefault(); if(PREVIEW)return;
  var form=e.target;$("mk-err").textContent="";each(form.querySelectorAll("[aria-invalid]"),function(x){x.removeAttribute("aria-invalid")});
  if(val("mk-web"))return showOut(true,"------");
  var name=val("mk-name"),handle=val("mk-handle"),plat=checked("mk-plat"),contact=val("mk-contact");
  if(!name)return fail("mk-name","اكتب اسمك.");
  if(!handle)return fail("mk-handle","اكتب اسم حسابك.");
  if(contact){var dg=digits(contact);if(dg.length<9||dg.length>15)return fail("mk-contact","رقم الجوال غير صحيح. اكتبه مثل 05xxxxxxxx أو اتركه فارغًا.")}
  if(!plat.length){fail(null,"اختر منصة واحدة على الأقل.");$("pl-1").focus();return}
  var d={name:name,handle:handle,phone:digits(contact).slice(0,20),platforms:plat,genre:val("mk-genre"),views:val("mk-views"),price:val("mk-price"),license:checked("mk-lic").join("")};
  var t=["طلب انضمام لشبكة مسوقي وكالة "+C.brand.name,"","الاسم: "+name,"الحساب: "+handle,"المنصات: "+plat.join("، ")];
  if(contact)t.push("الجوال: "+contact);
  if(d.genre)t.push("نوع الكتب: "+d.genre);
  if(d.views)t.push("متوسط المشاهدات: "+d.views);
  if(d.price)t.push("السعر للمقطع: "+d.price+" ريال");
  if(d.license)t.push("رخصة موثوق: "+d.license);
  if(!hasDB)return showOut(false,"",t);
  var btn=$("mk-go");busy(btn,true);
  var okd=function(ref){busy(btn,false);form.reset();showOut(true,ref.id.slice(0,6).toUpperCase())};
  save("joinRequests",d,t,okd).then(okd,
    function(err){busy(btn,false);if(window.console)console.warn("Firestore:",err);showOut(false,"",t,"ما قدرنا نحفظ الطلب الآن (تحقّق من اتصالك). انسخه وأرسله على حساباتنا.")});
});
document.addEventListener("input",function(e){if(e.target.removeAttribute)e.target.removeAttribute("aria-invalid")});
document.addEventListener("click",function(e){
  var b=e.target.closest("[data-copy]");if(!b)return;
  var ta=$(b.dataset.copy),done=b.parentNode.querySelector(".done");
  function manual(){ta.focus();ta.select();done.textContent="حدّدنا النص لك. انسخه يدويًا."}
  try{navigator.clipboard.writeText(ta.value).then(function(){done.textContent="تم النسخ."},manual)}catch(err){manual()}
});

/* ---------- preview mode (inside the editor) ---------- */
if(PREVIEW){
  document.documentElement.classList.add("preview");
  var host=window.parent!==window?window.parent:window.opener;
  window.addEventListener("message",function(e){
    if(e.origin!==location.origin)return;
    var m=e.data||{};
    if(m.type==="waraq-content"&&m.id==="home"){if(m.request&&m.request.parts)whoOpts=reqWho(m.request);render(m.content);mark(m.focus)}
    if(m.type==="waraq-focus")mark(m.sec,true);
  });
  document.addEventListener("click",function(e){
    var a=e.target.closest("a,button[type=submit]");if(a)e.preventDefault();
    var s=e.target.closest("[data-sec]");if(s&&host)host.postMessage({type:"waraq-pick",id:"home",sec:s.dataset.sec},"*");
  },true);
  if(host)host.postMessage({type:"waraq-ready",id:"home"},"*");
}
function reqWho(r){var out=null;(r.parts||[]).forEach(function(p){(p.fields||[]).forEach(function(f){if(f.key==="who")out=(Array.isArray(f.options)?f.options.filter(function(o){return !o.hidden}).map(function(o){return o.t}):lines(f.options)).filter(function(x){return x.charAt(0)!=="#"})})});return out}
function mark(sec,scroll){
  each(document.querySelectorAll(".sel-sec"),function(x){x.classList.remove("sel-sec")});
  if(sec==null)return;
  var els=document.querySelectorAll('[data-sec="'+sec+'"]');
  each(els,function(x){x.classList.add("sel-sec")});
  if(scroll&&els[0])els[0].scrollIntoView({block:"start",behavior:"smooth"});
}

if(!PREVIEW){
  WaraqContent.load("request",function(r){whoOpts=reqWho(r)});
  var dirty=false;
  document.addEventListener("input",function(e){if(e.target.closest&&e.target.closest("#mk-form"))dirty=true});
  document.addEventListener("change",function(e){if(e.target.closest&&e.target.closest("#mk-form"))dirty=true});
  WaraqContent.load("home",function(c,net){
    if(C&&net&&dirty)return;   // ما نعيد الرسم والزائر يكتب في نموذج الانضمام
    try{render(c)}catch(err){if(window.console)console.warn("render:",err);try{localStorage.removeItem("waraq-content-home")}catch(x){}render(WaraqContent.defaults("home"))}
  });
}
})();
