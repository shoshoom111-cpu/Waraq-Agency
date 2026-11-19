/* يرسم صفحة «اطلب خدمة» من إعدادات النموذج (المحفوظة أو الأصلية) ويرسل الطلب.
   ?preview=1: معاينة داخل المحرر. */
(function(){
"use strict";
var CFG=window.WARAQ||{}, FB=CFG.firebase||{};
var PREVIEW=/[?&]preview=1/.test(location.search);
var hasDB=!!(FB.apiKey&&FB.projectId&&FB.appId);
var SDK="https://www.gstatic.com/firebasejs/10.12.2/";
var CORE=WaraqContent.CORE, LOCKED=WaraqContent.LOCKED;
var R=null, BRAND={name:"ورق",whatsapp:""}, WA="", hasWA=false;
var AR="٠١٢٣٤٥٦٧٨٩";
function $(i){return document.getElementById(i)}
function each(l,f){Array.prototype.forEach.call(l,f)}
function esc(t){return String(t==null?"":t).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function ar(n){return String(n).replace(/\d/g,function(d){return AR[d]})}
function vis(l){return (l||[]).filter(function(x){return x&&!x.hidden})}
function opts(s){if(Array.isArray(s))return s.filter(function(o){return o&&!o.hidden&&String(o.t||"").trim()}).map(function(o){return String(o.t).trim()});return String(s||"").split("\n").map(function(x){return x.trim()}).filter(Boolean)}
function choices(s){return opts(s).filter(function(x){return x.charAt(0)!=="#"})}
function digits(s){return String(s||"").replace(/[٠-٩]/g,function(c){return c.charCodeAt(0)-0x660}).replace(/[۰-۹]/g,function(c){return c.charCodeAt(0)-0x6F0}).replace(/\D/g,"")}
function fields(){var out=[];vis(R.parts).forEach(function(p){vis(p.fields).forEach(function(f){out.push(f)})});return out}
function locked(f){return LOCKED[f.key]}

/* ---------- render ---------- */
function fieldHTML(f,pi){
  var id="q-"+f.id, req=f.required||locked(f), lab=esc(f.label)+(req?'':' <small>(اختياري)</small>')+(f.hint?' <small>('+esc(f.hint)+')</small>':'');
  var full=f.width==="full"||f.type==="textarea"||f.type==="radio"||f.type==="checks";
  var h='<div class="f'+(full?' full':'')+'" data-field="'+esc(f.id)+'" data-part="'+pi+'">';
  if(f.type==="radio"||f.type==="checks"){
    var list=choices(f.options);
    h+='<span class="lab" id="'+id+'-l">'+lab+'</span><div class="picks'+(f.key==="who"?" big":"")+'" id="'+id+'" role="'+(f.type==="radio"?"radiogroup":"group")+'" aria-labelledby="'+id+'-l">'+
      list.map(function(o,k){return '<label><input type="'+(f.type==="radio"?"radio":"checkbox")+'" name="'+id+'" value="'+esc(o)+'"'+(f.type==="radio"&&f.key==="who"&&k===0?" checked":"")+'>'+esc(o)+'</label>'}).join("")+'</div>';
  }else if(f.type==="select"){
    var groups=opts(f.options), body="", open=false;
    groups.forEach(function(o){
      if(o.charAt(0)==="#"){if(open)body+='</optgroup>';body+='<optgroup label="'+esc(o.slice(1).trim())+'">';open=true}
      else body+='<option>'+esc(o)+'</option>';
    });
    if(open)body+='</optgroup>';
    h+='<label for="'+id+'">'+lab+'</label><select id="'+id+'"><option value="">ما حددت</option>'+body+'</select>';
  }else if(f.type==="textarea"){
    h+='<label for="'+id+'">'+lab+'</label><textarea id="'+id+'" maxlength="2000" placeholder="'+esc(f.placeholder||"")+'"></textarea>';
  }else{
    var t=f.type==="tel"?"tel":f.type==="email"?"email":f.type==="url"?"url":"text";
    var dl=t==="text"&&choices(f.options).length?"dl-"+f.id:"";
    h+='<label for="'+id+'"'+(f.key==="name"?' id="name-l"':'')+'>'+lab+'</label><input type="'+t+'" id="'+id+'"'+
      (t==="tel"||t==="email"||t==="url"?' dir="ltr"':'')+(t==="tel"?' inputmode="tel" autocomplete="tel"':'')+(t==="email"?' autocomplete="email"':'')+(f.key==="name"?' autocomplete="name"':'')+
      ' maxlength="'+(t==="tel"?20:t==="url"?300:200)+'" placeholder="'+esc(f.placeholder||"")+'"'+(dl?' list="'+dl+'"':'')+'>'+
      (dl?'<datalist id="'+dl+'">'+choices(f.options).map(function(o){return '<option value="'+esc(o)+'">'}).join("")+'</datalist>':'');
  }
  return h+'</div>';
}
function render(r){
  R=r;
  WA=String(BRAND.whatsapp||CFG.whatsapp||"").replace(/\D/g,""); hasWA=/^\d{8,15}$/.test(WA);
  var parts=vis(R.parts), n=0;
  $("intro").innerHTML='<h1>'+esc(R.title)+(R.highlight?' <span class="hl">'+esc(R.highlight)+'</span>':'')+'</h1>'+(R.intro?'<p>'+esc(R.intro)+'</p>':'');
  $("parts").innerHTML=parts.map(function(p){
    var fs=vis(p.fields); if(!fs.length)return "";
    var pi=R.parts.indexOf(p);
    return '<fieldset class="part" data-part="'+pi+'"><legend><b>'+ar(++n)+'</b><span>'+esc(p.title)+'</span></legend><div class="grid">'+fs.map(function(f){return fieldHTML(f,pi)}).join("")+'</div></fieldset>';
  }).join("");
  $("go").querySelector(".t").textContent=R.submit||"أرسل الطلب";$("go").dataset.label=R.submit||"أرسل الطلب";
  $("agree").textContent=R.agree||"";
  $("after-h").textContent=R.afterTitle||"";
  $("steps").innerHTML=vis(R.after).map(function(a){return '<li><b>'+esc(a.title)+'</b><span>'+esc(a.text)+'</span></li>'}).join("");
  $("after").hidden=!vis(R.after).length&&!R.afterTitle;
  $("ok-title").textContent=R.okTitle||"وصلنا طلبك";
  $("wa").hidden=!hasWA;
  prefill(); syncWho();
  document.body.classList.remove("loading");
}

/* ---------- who → name label, URL pre-fill ---------- */
function fieldBy(key){return fields().filter(function(f){return f.key===key})[0]}
function syncWho(){
  var who=fieldBy("who"), name=fieldBy("name"); if(!who||!name||!name.altLabel)return;
  var c=document.querySelector('input[name="q-'+who.id+'"]:checked'), first=choices(who.options)[0];
  var l=document.getElementById("name-l"); if(!l)return;
  var req=name.required||locked(name);
  l.innerHTML=esc(c&&c.value!==first?name.altLabel:name.label)+(req?'':' <small>(اختياري)</small>')+(name.hint?' <small>('+esc(name.hint)+')</small>':'');
}
document.addEventListener("change",function(e){if(e.target.name&&fieldBy("who")&&e.target.name==="q-"+fieldBy("who").id)syncWho()});
function prefill(){
  var q=new URLSearchParams(location.search);
  [["who","who"],["pick","picks"],["pkg","pkg"]].forEach(function(x){
    var v=q.get(x[0]), f=fieldBy(x[1]); if(!v||!f)return;
    var base=function(s){return s.replace(/\s*\(.*\)\s*$/,"").trim()};
    var same=function(t){return t===v||base(t)===base(v)||(base(v)&&base(t).indexOf(base(v))===0)};
    if(f.type==="select"){var sel=$("q-"+f.id);each(sel.options,function(o){if(same(o.value))sel.value=o.value})}
    else each(document.querySelectorAll('input[name="q-'+f.id+'"]'),function(c){if(same(c.value))c.checked=true});
  });
}

/* ---------- read answers ---------- */
function valueOf(f){
  if(f.type==="radio"){var c=document.querySelector('input[name="q-'+f.id+'"]:checked');return c?c.value:""}
  if(f.type==="checks")return Array.prototype.filter.call(document.querySelectorAll('input[name="q-'+f.id+'"]'),function(c){return c.checked}).map(function(c){return c.value});
  var el=$("q-"+f.id);return el?el.value.trim():"";
}
function fail(f,msg){
  $("err").textContent=msg;
  var box=document.querySelector('[data-field="'+f.id+'"]'), el=$("q-"+f.id)||box.querySelector("input");
  (el.closest(".picks")||el).setAttribute("aria-invalid","true");
  el.focus(); box.scrollIntoView({block:"center",behavior:"smooth"});
}
document.addEventListener("input",function(e){var t=e.target;if(t.removeAttribute){t.removeAttribute("aria-invalid");var g=t.closest&&t.closest(".picks");if(g)g.removeAttribute("aria-invalid")}});
document.addEventListener("change",function(e){var g=e.target.closest&&e.target.closest(".picks");if(g)g.removeAttribute("aria-invalid")});

/* ---------- Firestore ---------- */
var dbReady=null;
function db(){
  if(!dbReady){
    dbReady=Promise.all([import(SDK+"firebase-app.js"),import(SDK+"firebase-firestore.js")]).then(function(m){return {fs:m[1],db:m[1].getFirestore(m[0].initializeApp(FB))}});
    dbReady.catch(function(){dbReady=null});
  }
  return dbReady;
}
if(hasDB&&!PREVIEW)document.addEventListener("focusin",function f(){document.removeEventListener("focusin",f);db().catch(function(){})});
function notify(x,subject,lines){
  return x.fs.getDoc(x.fs.doc(x.db,"siteSettings","notify")).then(function(s){
    var em=s.exists()?String(s.data().email||"").trim():"";
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em))return;
    return fetch("https://formsubmit.co/ajax/"+em,{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},
      body:JSON.stringify({_subject:subject,_template:"box",_captcha:"false",message:lines.join("\n")+"\n\nتفاصيل الطلب في صفحة طلبات الوكالة ولوحة المسوقين."})});
  }).catch(function(e){if(window.console)console.warn("notify:",e)});
}
function save(data,lines){
  var work=db().then(function(x){
    Object.keys(data).forEach(function(k){if(data[k]===""||(Array.isArray(data[k])&&!data[k].length))delete data[k]});
    data.state="new";data.createdAt=x.fs.serverTimestamp();data.source=(location.hostname||"local").slice(0,100);
    return x.fs.addDoc(x.fs.collection(x.db,"requests"),data).then(function(ref){notify(x,"طلب خدمة جديد"+(data.book?": «"+data.book+"»":"")+" من "+data.name,lines);return ref});
  });
  return Promise.race([work,new Promise(function(_,rej){setTimeout(function(){rej(new Error("timeout"))},15000)})]);
}

/* ---------- submit ---------- */
function busy(on){var b=$("go");b.disabled=on;b.setAttribute("aria-busy",on);b.querySelector(".t").textContent=on?"جارٍ الإرسال…":b.dataset.label}
function show(okMode,d,ref,lines,warn){
  $("form").hidden=true;$("done").hidden=false;$("ok").hidden=!okMode;$("fb").hidden=okMode;
  if(okMode){$("ref").textContent=ref;$("ok-text").textContent=R.okText||"";}
  else{$("text").value=lines.join("\n");if(hasWA)$("wa").href="https://wa.me/"+WA+"?text="+encodeURIComponent(lines.join("\n"));$("warn").hidden=!warn;$("warn").textContent=warn||""}
  $("done").focus({preventScroll:true});window.scrollTo({top:0,behavior:"smooth"});
}
$("form").addEventListener("submit",function(e){
  e.preventDefault(); if(PREVIEW)return;
  $("err").textContent="";each(document.querySelectorAll("[aria-invalid]"),function(x){x.removeAttribute("aria-invalid")});
  if($("web").value)return;
  var data={}, answers=[], lines=["طلب خدمة من موقع وكالة "+BRAND.name,""], bad=null;
  fields().some(function(f){
    var v=valueOf(f), empty=Array.isArray(v)?!v.length:!v, req=f.required||locked(f);
    var shownLabel=f.key==="name"&&$("name-l")?$("name-l").textContent.replace(/\s*\(.*$/,"").trim():f.label;
    if(req&&empty){bad=[f,f.type==="checks"||f.type==="radio"?"اختر من «"+f.label+"».":"اكتب "+shownLabel+"."];return true}
    if(!empty&&f.type==="tel"){var dg=digits(v);if(dg.length<9||dg.length>15){bad=[f,"اكتب رقم جوال صحيح، مثل 05xxxxxxxx."];return true}v=dg}
    if(!empty&&f.type==="email"&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)){bad=[f,"البريد غير صحيح. صحّحه أو اتركه فارغًا."];return true}
    if(!empty&&f.type==="url"&&!/^https?:\/\/\S+\.\S+/.test(v)){bad=[f,"الرابط لازم يبدأ بـ https:// أو اتركه فارغًا."];return true}
    if(empty)return false;
    var shown=Array.isArray(v)?v.join("، "):v;
    lines.push(f.label+": "+(f.type==="tel"?valueOf(f):shown));
    if(CORE[f.key]&&!data.hasOwnProperty(f.key))data[f.key]=f.key==="picks"?(Array.isArray(v)?v:[v]):(Array.isArray(v)?v.join("، "):String(v)).slice(0,2000);
    else answers.push({l:String(f.label).slice(0,120),v:String(shown).slice(0,2000)});
    return false;
  });
  if(bad)return fail(bad[0],bad[1]);
  if(answers.length)data.answers=answers.slice(0,40);
  // يروح للوحة المسوقين إذا اختار العميل خيارًا معلّمًا «يروح للوحة المسوقين»
  data.dash=fields().some(function(f){
    if(!Array.isArray(f.options))return false;
    var v=valueOf(f), picked=Array.isArray(v)?v:[v];
    return f.options.some(function(o){return o&&o.dash&&!o.hidden&&picked.indexOf(String(o.t).trim())>-1});
  });
  if(data.dash)lines.push("","يروح للوحة المسوقين");
  if(!hasDB){show(false,data,"",lines);return}
  busy(true);
  save(data,lines).then(function(ref){busy(false);show(true,data,ref.id.slice(0,6).toUpperCase(),lines)},
    function(err){busy(false);if(window.console)console.warn("Firestore:",err);show(false,data,"",lines,"ما قدرنا نحفظ الطلب الآن (تحقّق من اتصالك). أرسله لنا بالواتساب أو انسخه وأرسله على حساباتنا.")});
});
$("again").addEventListener("click",function(){$("form").reset();prefill();syncWho();$("done").hidden=true;$("form").hidden=false;var i=$("form").querySelector("input:not([type=radio]):not([type=checkbox]),textarea");if(i)i.focus()});
$("copy").addEventListener("click",function(){
  var ta=$("text");
  function man(){ta.focus();ta.select();$("copied").textContent="حدّدنا النص. انسخه يدويًا."}
  try{navigator.clipboard.writeText(ta.value).then(function(){$("copied").textContent="تم النسخ."},man)}catch(e){man()}
});

/* ---------- preview mode ---------- */
function mark(sel,scroll){
  each(document.querySelectorAll(".sel-sec"),function(x){x.classList.remove("sel-sec")});
  if(!sel)return;
  var el=document.querySelector(sel.field?'[data-field="'+sel.field+'"]':sel.part!=null?'fieldset[data-part="'+sel.part+'"]':sel.box?'[data-box="'+sel.box+'"]':null);
  if(el){el.classList.add("sel-sec");if(scroll)el.scrollIntoView({block:"center",behavior:"smooth"})}
}
if(PREVIEW){
  document.documentElement.classList.add("preview");
  var host=window.parent!==window?window.parent:window.opener;
  window.addEventListener("message",function(e){
    var m=e.data||{};
    if(m.type==="waraq-content"&&m.id==="request"){if(m.home&&m.home.brand)BRAND=m.home.brand;render(m.content);mark(m.focus)}
    if(m.type==="waraq-focus")mark(m.sel,true);
  });
  document.addEventListener("click",function(e){
    var a=e.target.closest("a,button[type=submit]");if(a)e.preventDefault();
    var f=e.target.closest("[data-field]"), p=e.target.closest("[data-part]"), b=e.target.closest("[data-box]");
    var sel=f?{field:f.dataset.field}:p?{part:+p.dataset.part}:b?{box:b.dataset.box}:null;
    if(sel&&host)host.postMessage({type:"waraq-pick",id:"request",sel:sel},"*");
  },true);
  if(host)host.postMessage({type:"waraq-ready",id:"request"},"*");
}else{
  WaraqContent.load("home",function(h){if(h&&h.brand){BRAND=h.brand;if(R)render(R)}});
  WaraqContent.load("request",function(r,net){
    if(R&&net){var a=document.activeElement;if(a&&a.closest&&a.closest("form")&&a!==document.body)return}
    render(r);
  });
}
})();
