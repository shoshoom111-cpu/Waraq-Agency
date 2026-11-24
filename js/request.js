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
function ar(n){return String(n)}
function vis(l){return (l||[]).filter(function(x){return x&&!x.hidden})}
function opts(s){if(Array.isArray(s))return s.filter(function(o){return o&&!o.hidden&&String(o.t||"").trim()}).map(function(o){return String(o.t).trim()});return String(s||"").split("\n").map(function(x){return x.trim()}).filter(Boolean)}
function choices(s){return opts(s).filter(function(x){return x.charAt(0)!=="#"})}
function digits(s){return String(s||"").replace(/[٠-٩]/g,function(c){return c.charCodeAt(0)-0x660}).replace(/[۰-۹]/g,function(c){return c.charCodeAt(0)-0x6F0}).replace(/\D/g,"")}
/* تفاصيل الخيار: كل خيار ممكن يكون فيه حقول (o.sub) تطلع تحته بس لما العميل يختاره */
function expand(fs){var out=[];fs.forEach(function(f){out.push(f);if(!WaraqContent.CHOICE[f.type]||!Array.isArray(f.options))return;
  f.options.forEach(function(o,i){if(!o||o.hidden||!Array.isArray(o.sub))return;vis(o.sub).forEach(function(sf){out.push(Object.assign({},sf,{when:{f:f.id,o:[o.id||("o"+i)]}}))})})});return out}
function fields(){var out=[];(R.parts||[]).filter(function(p){return p&&(!p.hidden||(p.fields||[]).some(function(f){return locked(f)}))}).forEach(function(p){expand(vis(p.fields)).forEach(function(f){out.push(f)})});return out}
function locked(f){return LOCKED[f.key]}
/* حقل مشروط: f.when={f: id حقل الاختيار, o: [ids الخيارات]}. يظهر بس لما العميل يختار وحدة منها. */
function optList(f){return Array.isArray(f.options)?f.options.map(function(o,i){return o&&{id:o.id||("o"+i),t:String(o.t||"").trim(),hidden:o.hidden,more:!!o.more}}).filter(function(o){return o&&o.t&&!o.hidden&&o.t.charAt(0)!=="#"}):[]}
function whenSrc(f){if(!f.when||!f.when.f||locked(f))return null;return fields().filter(function(x){return x.id===f.when.f&&x!==f})[0]||null}
function whenTexts(f){var src=whenSrc(f),ids=(f.when&&f.when.o)||[];return src?optList(src).filter(function(o){return ids.indexOf(o.id)>-1}).map(function(o){return o.t}):[]}
function pickedIn(src){var v=valueOf(src);return Array.isArray(v)?v:v?[v]:[]}
/* يرجّع الخيار اللي أظهر الحقل، أو true لو الحقل عادي، أو false لو مخفي */
function shownBy(f,depth){
  var src=whenSrc(f); if(!src)return true;
  if((depth||0)<5&&shownBy(src,(depth||0)+1)===false)return false;
  var want=whenTexts(f), got=pickedIn(src).filter(function(t){return want.indexOf(t)>-1});
  return got.length?got[0]:false;
}
function applyWhen(){
  fields().forEach(function(f){
    if(!whenSrc(f))return;
    var box=document.querySelector('[data-field="'+f.id+'"]'); if(box)box.hidden=shownBy(f)===false;
  });
}
document.addEventListener("change",function(e){if(e.target.closest&&e.target.closest("#parts"))applyWhen()});

/* ---------- render ---------- */
function fieldHTML(f,pi){
  var id="q-"+f.id, req=f.required||locked(f), lab=esc(f.label)+(req?'':' <small>(اختياري)</small>')+(f.hint?' <small>('+esc(f.hint)+')</small>':'');
  var full=f.width==="full"||f.type==="textarea"||f.type==="radio"||f.type==="checks"||f.type==="svclist";
  var h='<div class="f'+(full?' full':'')+(f.when&&f.when.f?' cond':'')+'" data-field="'+esc(f.id)+'" data-part="'+pi+'">';
  if(f.type==="svclist"){
    return h+'<span class="lab" id="'+id+'-l">'+lab+'</span><div class="srows" id="'+id+'" data-svc="'+esc(f.id)+'" role="group" aria-labelledby="'+id+'-l"></div>'+
      '<button type="button" class="addsvc" data-addsvc="'+esc(f.id)+'"><span aria-hidden="true">+</span> '+esc(f.addText||"أضف خدمة")+'</button></div>';
  }
  if(f.type==="checks"&&(f.other||optList(f).some(function(o){return o.more}))){
    var main=optList(f).filter(function(o){return !o.more}), extra=optList(f).filter(function(o){return o.more});
    var box=function(o){return '<label><input type="checkbox" name="'+id+'" value="'+esc(o.t)+'">'+esc(o.t)+'</label>'};
    return h+'<span class="lab" id="'+id+'-l">'+lab+'</span><div class="picks" id="'+id+'" role="group" aria-labelledby="'+id+'-l">'+main.map(box).join("")+
      '<button type="button" class="morebtn" data-more="'+esc(f.id)+'" aria-expanded="false" aria-controls="'+id+'-more">'+esc(f.moreText||"+ خدمات أخرى")+'</button></div>'+
      '<div class="morebox" id="'+id+'-more" hidden>'+(extra.length?'<div class="picks">'+extra.map(box).join("")+'</div>':'')+
      (f.other?'<div class="addcustom"><label class="otherlab" for="'+id+'-cn">'+esc(f.otherLabel||"خدمة غير موجودة؟ اكتبها")+'</label>'+
        '<div class="addcustom-row"><input type="text" id="'+id+'-cn" class="o-name" maxlength="80" data-cname="'+esc(f.id)+'" placeholder="'+esc(f.otherPh||"اسم الخدمة")+'">'+
        '<button type="button" class="addother" data-addother="'+esc(f.id)+'" disabled><span aria-hidden="true">+</span> إضافة</button></div>'+
        '<p class="cmsg" id="'+id+'-cmsg" aria-live="polite"></p></div>':'')+'</div></div>';
  }
  if(f.type==="radio"||f.type==="checks"){
    var list=choices(f.options);
    h+='<span class="lab" id="'+id+'-l">'+lab+'</span><div class="picks'+(f.key==="who"?" big":"")+'" id="'+id+'" role="'+(f.type==="radio"?"radiogroup":"group")+'" aria-labelledby="'+id+'-l">'+
      list.map(function(o,k){return '<label><input type="'+(f.type==="radio"?"radio":"checkbox")+'" name="'+id+'" value="'+esc(o)+'"'+(f.type==="radio"&&f.key==="who"&&k===0?" checked":"")+'>'+esc(o)+'</label>'}).join("")+'</div>';
  }else if(f.type==="select"&&f.key==="pkg"){
    var body2="";
    opts(f.options).forEach(function(o){if(o.charAt(0)!=="#")body2+='<option>'+esc(o)+'</option>'});
    h='<div class="f full" data-field="'+esc(f.id)+'" data-part="'+pi+'">';
    h+='<span class="lab" id="'+id+'-l">'+lab+'</span><div class="picks pkgpicks" id="'+id+'-chips" role="radiogroup" aria-labelledby="'+id+'-l"></div>'+
      '<select id="'+id+'" hidden aria-hidden="true" tabindex="-1"><option value="">ما حددت</option>'+body2+'</select>';
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
    var t=f.type==="tel"?"tel":f.type==="email"?"email":f.type==="url"?"text":f.type==="number"?"number":f.type==="date"?"date":"text";
    var dl=t==="text"&&choices(f.options).length?"dl-"+f.id:"";
    h+='<label for="'+id+'"'+(f.key==="name"?' id="name-l"':'')+'>'+lab+'</label><input type="'+t+'" id="'+id+'"'+
      (t==="tel"||t==="email"||f.type==="url"?' dir="ltr"':'')+(f.type==="url"?' inputmode="url" autocomplete="url"':'')+(t==="number"?' inputmode="numeric" min="0"':'')+(t==="tel"?' inputmode="tel" autocomplete="tel"':'')+(t==="email"?' autocomplete="email"':'')+(f.key==="name"?' autocomplete="name"':'')+
      ' maxlength="'+(t==="tel"?20:t==="url"?300:t==="email"?120:200)+'" placeholder="'+esc(f.placeholder||"")+'"'+(dl?' list="'+dl+'"':'')+'>'+
      (dl?'<datalist id="'+dl+'">'+choices(f.options).map(function(o){return '<option value="'+esc(o)+'">'}).join("")+'</datalist>':'');
  }
  return h+'</div>';
}
function render(r){
  R=r;
  WA=String(BRAND.whatsapp||CFG.whatsapp||"").replace(/\D/g,""); hasWA=/^\d{8,15}$/.test(WA);
  var parts=(R.parts||[]).filter(function(p){return p&&(!p.hidden||(p.fields||[]).some(function(f){return locked(f)}))}), n=0;
  $("intro").innerHTML='<h1>'+esc(R.title)+(R.highlight?' <span class="hl">'+esc(R.highlight)+'</span>':'')+'</h1>'+(R.intro?'<p>'+esc(R.intro)+'</p>':'');
  $("parts").innerHTML=parts.map(function(p){
    var fs=vis(p.fields); if(!fs.length)return "";
    var pk=fs.filter(function(f){return f.key==="pkg"})[0], at=-1;
    fs.forEach(function(f,k){if(f.key==="picks"&&at<0)at=k});
    if(pk&&at>-1&&fs.indexOf(pk)>at){fs=fs.filter(function(f){return f!==pk});fs.splice(at,0,pk)}
    var pi=R.parts.indexOf(p);
    return '<fieldset class="part" data-part="'+pi+'"><legend><span>'+esc(p.title)+'</span></legend><div class="grid">'+expand(fs).map(function(f){return fieldHTML(f,pi)}).join("")+'</div></fieldset>';
  }).join("");
  $("go").querySelector(".t").textContent=R.submit||"أرسل الطلب";$("go").dataset.label=R.submit||"أرسل الطلب";
  $("agree").textContent=R.agree||"";
  $("after-h").textContent=R.afterTitle||"";
  $("steps").innerHTML=vis(R.after).map(function(a){return '<li><b>'+esc(a.title)+'</b><span>'+esc(a.text)+'</span></li>'}).join("");
  $("after").hidden=!vis(R.after).length&&!R.afterTitle;
  $("ok-title").textContent=R.okTitle||"وصلنا طلبك";
  $("wa").hidden=!hasWA;
  initRows(); prefill(); syncWho(); syncPkgAud(); applyWhen();
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
/* قائمة «حملة جاهزة» تعرض حملات المؤلفين أو دور النشر حسب «أنت». المجموعة تنعرف من عنوانها (# لدور النشر) أو من «(دار نشر)» في الاسم */
var PUB_RE=/دار|دور|نشر/;
function syncPkgAud(){
  var who=fieldBy("who"), pkg=fieldBy("pkg"); if(!who||!pkg||pkg.type!=="select")return;
  var sel=$("q-"+pkg.id); if(!sel)return;
  if(!sel._all){var all=[];each(sel.children,function(n){
      if(n.tagName==="OPTGROUP"){var a=PUB_RE.test(n.label)?"pub":"author";each(n.children,function(o){all.push({t:o.value,g:n.label,aud:a})})}
      else if(n.value)all.push({t:n.value,g:"",aud:/\(دار نشر\)/.test(n.value)?"pub":(pkg.key==="pkg"&&$("q-"+pkg.id+"-chips")?"author":"")});
    });sel._all=all}
  var c=document.querySelector('input[name="q-'+who.id+'"]:checked'), first=choices(who.options)[0];
  var aud=!c?"":c.value===first?"author":"pub", cur=sel.value, html='<option value="">ما حددت</option>', g=null;
  sel._all.forEach(function(o){
    if(aud&&o.aud&&o.aud!==aud)return;
    if(!aud&&o.g!==g){if(g)html+='</optgroup>';if(o.g)html+='<optgroup label="'+esc(o.g)+'">';g=o.g}
    html+='<option>'+esc(o.t)+'</option>';
  });
  if(!aud&&g)html+='</optgroup>';
  sel.innerHTML=html;
  sel.value=sel._all.some(function(o){return o.t===cur&&!(aud&&o.aud&&o.aud!==aud)})?cur:"";
  drawPkgChips(pkg);
}
function drawPkgChips(pkg){
  var box=$("q-"+pkg.id+"-chips"), sel=$("q-"+pkg.id); if(!box||!sel)return;
  box.innerHTML=Array.prototype.filter.call(sel.options,function(o){return o.value}).map(function(o){
    return '<label><input type="radio" name="q-'+pkg.id+'-chip" value="'+esc(o.value)+'"'+(o.value===sel.value?' checked data-was="1"':'')+'>'+esc(o.value.replace(/\s*\(دار نشر\)\s*$/,""))+'</label>';
  }).join("");
  box.closest("[data-field]").hidden=!sel.options.length||sel.options.length<2;
}
document.addEventListener("click",function(e){
  var inp=e.target.closest&&e.target.closest(".pkgpicks input"); if(!inp)return;
  var pkg=fieldBy("pkg"), sel=pkg&&$("q-"+pkg.id); if(!sel)return;
  if(inp.dataset.was==="1"){inp.checked=false;sel.value=""}else sel.value=inp.value;
  each(document.querySelectorAll(".pkgpicks input"),function(x){x.dataset.was=x.checked?"1":""});
});
document.addEventListener("change",function(e){if(e.target.name&&fieldBy("who")&&e.target.name==="q-"+fieldBy("who").id){syncWho();syncPkgAud()}});
function prefill(){
  var q=new URLSearchParams(location.search);
  [["who","who"],["pick","picks"],["pkg","pkg"]].forEach(function(x){
    var v=q.get(x[0]), f=fieldBy(x[1]); if(!v||!f)return;
    var base=function(s){return s.replace(/\s*\(.*\)\s*$/,"").trim()};
    var same=function(t){return t===v||base(t)===base(v)||(base(v)&&base(t).indexOf(base(v))===0)};
    if(f.type==="select"){var sel=$("q-"+f.id);each(sel.options,function(o){if(same(o.value))sel.value=o.value})}
    else each(document.querySelectorAll('input[name="q-'+f.id+'"]'),function(c){if(same(c.value))c.checked=true});
  });
  each(document.querySelectorAll(".morebox"),function(b){if(b.querySelector("input:checked")){var btn=document.querySelector('[aria-controls="'+b.id+'"]');if(btn)openMore(btn,true)}});
  var pk=q.get("pick"), sv=fields().filter(function(f){return f.type==="svclist"})[0];
  if(pk&&sv){
    var hit=optList(sv).filter(function(o){return o.t===pk||o.t.indexOf(pk)===0||pk.indexOf(o.t)===0})[0], first=document.querySelector("#q-"+sv.id+" .srow select");
    if(hit&&first&&!first.value){first.value=hit.id;syncRows(sv)}
  }
}

/* ---------- «+ أضف خدمة»: كل سطر خدمة من القائمة ومربع يوصف فيه وش يبي ---------- */
var MAXROWS=10;
function svcField(id){return fields().filter(function(f){return f.id===id})[0]}
function addRow(f,pickId){
  var box=$("q-"+f.id); if(!box||box.children.length>=MAXROWS)return null;
  var rid="q-"+f.id+"-r"+(addRow.n=(addRow.n||0)+1), div=document.createElement("div");
  div.className="srow";
  div.innerHTML='<div class="srow-top"><label class="sr-only" for="'+rid+'-s">الخدمة</label><select id="'+rid+'-s" data-srow-sel><option value="">اختر الخدمة</option>'+
    optList(f).map(function(o){return '<option value="'+esc(o.id)+'">'+esc(o.t)+'</option>'}).join("")+'</select>'+
    '<button type="button" class="srow-x" data-srow-del aria-label="حذف هذي الخدمة"><span aria-hidden="true">×</span></button></div>'+
    '<label class="sr-only" for="'+rid+'-d">تفاصيل الخدمة</label><textarea id="'+rid+'-d" data-srow-txt maxlength="1500" rows="3" placeholder="'+esc(f.placeholder||"وش تبي بالضبط في هذي الخدمة؟")+'" hidden></textarea>';
  box.appendChild(div);
  if(pickId)div.querySelector("select").value=pickId;
  syncRows(f); return div;
}
function syncRows(f){
  var box=$("q-"+f.id); if(!box)return;
  var rows=box.querySelectorAll(".srow"), used={};
  each(rows,function(r){var v=r.querySelector("select").value;if(v)used[v]=(used[v]||0)+1});
  each(rows,function(r){
    var sel=r.querySelector("select"), v=sel.value;
    each(sel.options,function(o){if(o.value)o.disabled=o.value!==v&&!!used[o.value]});
    r.querySelector("textarea").hidden=!v;
    r.querySelector("[data-srow-del]").hidden=rows.length<2&&!v;
  });
  var add=document.querySelector('[data-addsvc="'+f.id+'"]');
  if(add)add.disabled=rows.length>=MAXROWS||rows.length>=optList(f).length||Array.prototype.some.call(rows,function(r){return !r.querySelector("select").value});
}
function initRows(){fields().forEach(function(f){if(f.type==="svclist"){var b=$("q-"+f.id);if(b&&!b.children.length)addRow(f)}})}
document.addEventListener("click",function(e){
  var a=e.target.closest&&e.target.closest("[data-addsvc]");
  if(a){var f=svcField(a.dataset.addsvc),r=f&&addRow(f);if(r)r.querySelector("select").focus();return}
  var x=e.target.closest&&e.target.closest("[data-srow-del]");
  if(x){var box=x.closest(".srows"),f2=svcField(box.dataset.svc);x.closest(".srow").remove();if(!box.children.length)addRow(f2);else syncRows(f2);var s=box.querySelector("select");if(s)s.focus()}
});
document.addEventListener("change",function(e){
  if(!e.target.matches||!e.target.matches("[data-srow-sel]"))return;
  var box=e.target.closest(".srows"),f=svcField(box.dataset.svc); syncRows(f);
  var t=e.target.closest(".srow").querySelector("textarea"); if(e.target.value&&!t.value)t.focus();
});
function svcValue(f){
  var opts=optList(f), out=[]; out.bad=null;
  each(document.querySelectorAll("#q-"+f.id+" .srow"),function(r){
    var id=r.querySelector("select").value, d=r.querySelector("textarea").value.trim(), o=opts.filter(function(x){return x.id===id})[0];
    if(o)out.push({id:o.id,s:o.t,d:d.slice(0,1500)}); else if(d&&!out.bad)out.bad=r;
  });
  return out;
}

/* ---------- «+ خدمات أخرى»: الخدمة اللي يكتبها العميل تصير مربع مثل باقي الخدمات، وتحتها خانة وصف ---------- */
var MAXOTHER=5;
function customs(fid){return document.querySelectorAll('#q-'+fid+' label.custom')}
function syncOther(fid){
  var inp=$("q-"+fid+"-cn"), add=document.querySelector('[data-addother="'+fid+'"]'); if(!inp||!add)return;
  add.disabled=!inp.value.trim()||customs(fid).length>=MAXOTHER;
}
function addOther(fid){
  var inp=$("q-"+fid+"-cn"), msg=$("q-"+fid+"-cmsg"), name=inp?inp.value.trim().replace(/\s+/g," ").slice(0,80):""; if(!name)return;
  var picks=$("q-"+fid), taken=Array.prototype.map.call(document.querySelectorAll('input[name="q-'+fid+'"]'),function(c){return c.value.trim()});
  if(taken.indexOf(name)>-1){var same=Array.prototype.filter.call(document.querySelectorAll('input[name="q-'+fid+'"]'),function(c){return c.value.trim()===name})[0];if(same&&!same.checked){same.checked=true;same.dispatchEvent(new Event("change",{bubbles:true}))}msg.textContent="«"+name+"» موجودة، واخترناها لك.";inp.value="";syncOther(fid);return}
  if(customs(fid).length>=MAXOTHER){msg.textContent="تقدر تضيف "+MAXOTHER+" خدمات بس.";return}
  var n=(addOther.n=(addOther.n||0)+1), cid="q-"+fid+"-c"+n;
  var lab=document.createElement("label"); lab.className="custom"; lab.dataset.cid=cid;
  lab.innerHTML='<input type="checkbox" name="q-'+fid+'" value="'+esc(name)+'" checked data-custom="'+cid+'">'+esc(name);
  picks.insertBefore(lab,picks.querySelector("[data-more]"));
  var box=document.createElement("div"); box.className="f full cond cdesc"; box.id=cid+"-box";
  box.innerHTML='<label for="'+cid+'-d">وش تبي في «'+esc(name)+'»؟ <small>(اختياري)</small></label><textarea id="'+cid+'-d" maxlength="1500" placeholder="اكتب تفاصيل الخدمة اللي تبيها"></textarea>';
  var field=document.querySelector('[data-field="'+fid+'"]'), after=field; while(after.nextElementSibling&&after.nextElementSibling.classList.contains("cdesc"))after=after.nextElementSibling;
  after.parentNode.insertBefore(box,after.nextSibling);
  inp.value=""; msg.textContent="انضافت «"+name+"». تقدر تضيف خدمة ثانية."; syncOther(fid);
  box.querySelector("textarea").focus();
}
function otherRows(f){
  var out=[]; out.bad=null;
  each(customs(f.id),function(l){var c=l.querySelector("input");if(!c.checked)return;var t=$(l.dataset.cid+"-d");out.push({id:"custom",s:c.value.slice(0,120),d:t?t.value.trim().slice(0,1500):""})});
  return out;
}
document.addEventListener("click",function(e){
  var a=e.target.closest&&e.target.closest("[data-addother]"); if(a)addOther(a.dataset.addother);
});
document.addEventListener("keydown",function(e){
  var i=e.target.closest&&e.target.closest("[data-cname]"); if(i&&e.key==="Enter"){e.preventDefault();addOther(i.dataset.cname)}
});
document.addEventListener("input",function(e){var i=e.target.closest&&e.target.closest("[data-cname]");if(i)syncOther(i.dataset.cname)});
document.addEventListener("change",function(e){
  var c=e.target.closest&&e.target.closest("[data-custom]"); if(!c)return;
  var box=$(c.dataset.custom+"-box"); if(box)box.hidden=!c.checked;
});

/* ---------- «+ خدمات أخرى» ---------- */
function openMore(btn,open){var b=$(btn.getAttribute("aria-controls"));if(!b)return;b.hidden=!open;btn.setAttribute("aria-expanded",open)}
document.addEventListener("click",function(e){
  var m=e.target.closest&&e.target.closest("[data-more]"); if(!m)return;
  var open=m.getAttribute("aria-expanded")!=="true"; openMore(m,open);
  if(open){var first=$(m.getAttribute("aria-controls")).querySelector("input");if(first)first.focus()}
});

/* ---------- read answers ---------- */
function valueOf(f){
  if(f.type==="svclist")return svcValue(f);
  if(f.type==="radio"){var c=document.querySelector('input[name="q-'+f.id+'"]:checked');return c?c.value:""}
  if(f.type==="checks"){
    var got=Array.prototype.filter.call(document.querySelectorAll('input[name="q-'+f.id+'"]'),function(c){return c.checked}).map(function(c){return c.value});
    return got;
  }
  var el=$("q-"+f.id);return el?el.value.trim():"";
}
function normLink(v){
  v=String(v||"").trim(); if(!v)return "";
  if(/^@[\w.\-]{2,}$/.test(v))return v;
  if(!/^https?:\/\//i.test(v))v="https://"+v.replace(/^\/+/,"");
  return /^https?:\/\/[^\s\/]+\.[^\s]+/i.test(v)?v.slice(0,300):"";
}
function clearErrs(){each(document.querySelectorAll(".ferr"),function(x){x.remove()});each(document.querySelectorAll("[aria-invalid]"),function(x){x.removeAttribute("aria-invalid")});$("err").textContent=""}
function fail(f,msg){
  $("err").textContent=msg;
  var fb=document.querySelector('[data-field="'+f.id+'"]');
  if(fb){var fe=document.createElement("p");fe.className="ferr";fe.id="ferr-"+f.id;fe.setAttribute("role","alert");fe.textContent=msg;fb.appendChild(fe)}
  var box=document.querySelector('[data-field="'+f.id+'"]'), el=f.type==="svclist"?(box.querySelector(".srow select")||box):$("q-"+f.id)||box.querySelector("input");
  (el.closest(".picks")||el).setAttribute("aria-invalid","true");
  if(el.setAttribute)el.setAttribute("aria-describedby","ferr-"+f.id);
  el.focus(); box.scrollIntoView({block:"center",behavior:"smooth"});
}
document.addEventListener("input",function(e){var t=e.target;if(t.removeAttribute){t.removeAttribute("aria-invalid");var g=t.closest&&t.closest(".picks");if(g)g.removeAttribute("aria-invalid");var fb=t.closest&&t.closest("[data-field]"),fe=fb&&fb.querySelector(".ferr");if(fe)fe.remove()}});
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
/* تنبيه واتساب لجوال الوكالة عن طريق CallMeBot (الرقم والمفتاح من الإعدادات) */
function waSend(d,subject,ls){
  var ph=String(d.waPhone||"").replace(/\D/g,""), key=String(d.waKey||"").trim(); if(ph.length<10||!key)return;
  var text=(subject+"\n\n"+ls.filter(function(l,i){return i>1||l}).join("\n")).slice(0,1500);
  try{fetch("https://api.callmebot.com/whatsapp.php?phone=%2B"+ph+"&apikey="+encodeURIComponent(key)+"&text="+encodeURIComponent(text),{mode:"no-cors",keepalive:true}).catch(function(){})}catch(e){}
}
function notify(x,subject,lines){
  return x.fs.getDoc(x.fs.doc(x.db,"siteSettings","notify")).then(function(s){
    var d=s.exists()?s.data():{}, em=String(d.email||"").trim();
    waSend(d,subject,lines);
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em))return;
    return fetch("https://formsubmit.co/ajax/"+em,{method:"POST",keepalive:true,headers:{"Content-Type":"application/json","Accept":"application/json"},
      body:JSON.stringify({_subject:subject,_template:"box",_captcha:"false",message:lines.join("\n")+"\n\nتفاصيل الطلب في صفحة طلبات الوكالة ولوحة المسوقين."})});
  }).catch(function(e){if(window.console)console.warn("notify:",e)});
}
function save(data,lines,onLate){
  return db().then(function(x){
    Object.keys(data).forEach(function(k){if(data[k]===""||(Array.isArray(data[k])&&!data[k].length))delete data[k]});
    data.state="new";data.createdAt=x.fs.serverTimestamp();data.source=(location.hostname||"local").slice(0,100);
    var work=x.fs.addDoc(x.fs.collection(x.db,"requests"),data).then(function(ref){notify(x,"طلب خدمة جديد"+(data.book?": «"+data.book+"»":"")+" من "+data.name,lines);return ref});
    var late=false;
    work.then(function(ref){if(late&&onLate)onLate(ref)},function(){});
    return Promise.race([work,new Promise(function(_,rej){setTimeout(function(){late=true;rej(new Error("timeout"))},20000)})]);
  });
}

/* ---------- طلب غير مكتمل: نحفظ اللي انكتب أول بأول (بدون تحقق)، ويظهر في لوحة الوكالة لو ما انرسل ---------- */
function draftData(){
  var d={}, svc=[], other=0;
  try{
    fields().forEach(function(f){
      if(shownBy(f)===false)return;
      if(f.type==="svclist"){svcValue(f).forEach(function(x){svc.push(x.s)});return}
      if(f.type==="checks"&&f.other)otherRows(f).forEach(function(o){svc.push(o.s)});
      var v=valueOf(f), empty=Array.isArray(v)?!v.length:!v; if(empty)return;
      if(CORE[f.key]&&!d.hasOwnProperty(f.key)){
        if(f.key==="picks")svc=svc.concat(Array.isArray(v)?v:[v]);
        else if(["name","phone","email","book","who","pkg","budget"].indexOf(f.key)>-1)d[f.key]=(Array.isArray(v)?v.join("، "):String(v)).slice(0,f.key==="book"||f.key==="pkg"?200:120);
        else other++;
      }else other++;
    });
  }catch(e){return null}
  if(svc.length)d.services=svc.join("، ").slice(0,600);
  d.filled=Object.keys(d).length+other;
  return d;
}
if(!PREVIEW){
  var saveDraft=function(){if(window.WaraqTrack&&!$("form").hidden)WaraqTrack.draft(draftData())};
  $("form").addEventListener("input",saveDraft);
  $("form").addEventListener("change",saveDraft);
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
  clearErrs();
  if($("web").value){show(true,{},"------",[]);return}
  var data={}, answers=[], lines=["طلب خدمة من موقع وكالة "+BRAND.name,""], bad=null;
  fields().some(function(f){
    var by=shownBy(f); if(by===false)return false;
    var lbl=by===true?f.label:by+" ← "+f.label;
    if(f.type==="svclist"){
      var sv=svcValue(f);
      if(sv.bad){bad=[f,"اختر الخدمة من القائمة، أو احذف السطر."];return true}
      if((f.required)&&!sv.length){bad=[f,"أضف خدمة وحدة على الأقل."];return true}
      if(sv.length){data.services=(data.services||[]).concat(sv).slice(0,10);lines.push(lbl+":");sv.forEach(function(x){lines.push("- "+x.s+(x.d?": "+x.d:""))})}
      return false;
    }
    if(f.type==="checks"&&f.other){
      var ors=otherRows(f);
      if(ors.length){data.services=(data.services||[]).concat(ors).slice(0,10)}
    }
    var v=valueOf(f), empty=Array.isArray(v)?!v.length:!v, req=f.required||locked(f);
    var shownLabel=f.key==="name"&&$("name-l")?$("name-l").textContent.replace(/\s*\(.*$/,"").trim():f.label;
    if(req&&empty){bad=[f,f.type==="checks"||f.type==="radio"?"اختر من «"+f.label+"».":"اكتب "+shownLabel+"."];return true}
    if(!empty&&f.type==="tel"){var dg=digits(v);if(dg.length<9||dg.length>15){bad=[f,"اكتب رقم جوال صحيح، مثل 05xxxxxxxx."];return true}v=dg}
    if(!empty&&f.type==="email"&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)){bad=[f,"البريد غير صحيح. صحّحه أو اتركه فارغًا."];return true}
    if(!empty&&f.type==="url"){v=normLink(v);if(!v){bad=[f,"اكتب رابط صحيح (مثل instagram.com/حسابك) أو اسم حسابك مثل ‎@حسابك."];return true}}
    if(empty)return false;
    var shown=Array.isArray(v)?v.join("، "):v;
    lines.push(lbl+": "+(f.type==="tel"?valueOf(f):shown));
    if(f.type==="checks"&&f.other)otherRows(f).forEach(function(o){if(o.d)lines.push("- "+o.s+": "+o.d)});
    if(CORE[f.key]&&!data.hasOwnProperty(f.key))data[f.key]=f.key==="picks"?(Array.isArray(v)?v:[v]):(Array.isArray(v)?v.join("، "):String(v)).slice(0,2000);
    else answers.push({l:String(lbl).slice(0,120),v:String(shown).slice(0,2000)});
    return false;
  });
  if(bad)return fail(bad[0],bad[1]);
  if(answers.length)data.answers=answers.slice(0,40);
  // الطلب يروح للوحة المسوقين بعد ما توافق عليه الوكالة من صفحة الطلبات
  data.dash=false;
  if(!hasDB){show(false,data,"",lines);return}
  busy(true);
  var okd=function(ref){busy(false);if(window.WaraqTrack)WaraqTrack.done(ref.id);show(true,data,ref.id.slice(0,6).toUpperCase(),lines)};
  save(data,lines,okd).then(okd,
    function(err){busy(false);if(window.console)console.warn("Firestore:",err);
      var denied=err&&err.code==="permission-denied";
      show(false,data,"",lines,denied?"ما قدرنا نحفظ الطلب لأن فيه بيانات غير مقبولة (مثلًا نص طويل جدًا). أرسله لنا بالواتساب أو انسخه وأرسله على حساباتنا.":"ما قدرنا نحفظ الطلب الآن (تحقّق من اتصالك). أرسله لنا بالواتساب أو انسخه وأرسله على حساباتنا.")});
});
$("again").addEventListener("click",function(){$("form").reset();each(document.querySelectorAll(".srows"),function(b){b.innerHTML=""});each(document.querySelectorAll("label.custom,.cdesc"),function(x){x.remove()});each(document.querySelectorAll(".morebox"),function(b){b.hidden=true});each(document.querySelectorAll("[data-more]"),function(b){b.setAttribute("aria-expanded","false")});initRows();prefill();syncWho();syncPkgAud();applyWhen();$("done").hidden=true;$("form").hidden=false;var i=$("form").querySelector("input:not([type=radio]):not([type=checkbox]),textarea");if(i)i.focus()});
$("copy").addEventListener("click",function(){
  var ta=$("text");
  function man(){ta.focus();ta.select();$("copied").textContent="حدّدنا النص. انسخه يدويًا."}
  try{navigator.clipboard.writeText(ta.value).then(function(){$("copied").textContent="تم النسخ."},man)}catch(e){man()}
});

/* اسم الوكالة في رأس الصفحة والعنوان، والواتساب، بدون إعادة رسم النموذج */
function applyBrand(){
  var b=document.querySelector(".mast .brand");
  if(b&&BRAND.name){b.querySelector("b").textContent=BRAND.name;var sp=b.querySelector("span");if(sp)sp.textContent=BRAND.tagline||""}
  if(BRAND.name)document.title=(R&&R.title?R.title+(R.highlight?" "+R.highlight:"")+" · ":"")+BRAND.name;
  WA=String(BRAND.whatsapp||CFG.whatsapp||"").replace(/\D/g,""); hasWA=/^\d{8,15}$/.test(WA); $("wa").hidden=!hasWA;
}
/* لو المحتوى المحفوظ في الجهاز خربان: نمسحه ونعرض النسخة الأصلية بدل ما تعلق الصفحة */
function safeRender(r){
  try{render(r);applyBrand()}
  catch(e){if(window.console)console.warn("render:",e);try{localStorage.removeItem("waraq-content-request")}catch(x){}render(WaraqContent.defaults("request"));applyBrand()}
}

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
    if(e.origin!==location.origin)return;
    var m=e.data||{};
    if(m.type==="waraq-content"&&m.id==="request"){if(m.home&&m.home.brand)BRAND=m.home.brand;render(m.content);applyBrand();mark(m.focus)}
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
  var dirty=false;
  $("form").addEventListener("input",function(){dirty=true});
  $("form").addEventListener("change",function(){dirty=true});
  WaraqContent.load("home",function(h){if(h&&h.brand){BRAND=h.brand;applyBrand()}});
  WaraqContent.load("request",function(r,net){
    if(R&&net&&dirty)return;   // ما نعيد رسم النموذج والعميل يعبّيه
    safeRender(r);
  });
}
})();
