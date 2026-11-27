/* محتوى موقع وكالة ورق: النسخة الأصلية (تُستخدم إذا ما فيه محتوى محفوظ)، وتحميل المحتوى المحفوظ من قاعدة البيانات.
   التعديل يكون من صفحة الطلبات ← «تعديل الصفحة الأساسية» و«تعديل صفحة الطلبات»، مو من هذا الملف. */
(function(){
"use strict";

var HOME={
  v:1,
  seo:{title:"وكالة رحلة ورق للدعاية والإعلان | تسويق الكتب للمؤلفين ودور النشر",description:"وكالة رحلة ورق للدعاية والإعلان: تسويق متخصص للكتب، للمؤلفين ودور النشر. حملات مسوقين، معارض الكتاب، أمسيات، بوسترات ومقاطع."},
  brand:{name:"ورق",tagline:"وكالة تسويق للكتب",cta:"اطلب خدمة",handle:"@Waraq_Agency",domain:"waraq-agency.com",year:"2026",whatsapp:"",
    socials:[{name:"إنستقرام",url:"https://www.instagram.com/Waraq_Agency"},{name:"تيك توك",url:"https://www.tiktok.com/@Waraq_Agency"},{name:"إكس (تويتر)",url:"https://x.com/Waraq_Agency"}]},
  sections:[
    {id:"hero",type:"hero",nav:"",toc:"",data:{
      title:"نوصل كتابك إلى",highlight:"قرّائه",
      lead:"وكالة رحلة ورق للدعاية والإعلان تتولى ما يحتاجه الكتاب من تسويق: حملات ينفّذها مسوقون في منصات التواصل، حضور في معارض الكتاب، أمسيات، وبوسترات ومقاطع جاهزة للنشر.",
      cta1:"اطلب خدمة",cta2:"شوف الحملات الجاهزة",tocTitle:"الفهرس",
      bullets:[{text:"للمؤلفين"},{text:"لدور النشر"},{text:"تقرير بروابط كل منشور"}]}},
    {id:"services",type:"services",nav:"الخدمات",toc:"الخدمات",data:{title:"الخدمات",sub:"خدمة واحدة أو أكثر، حسب ما يحتاجه كتابك.",items:[
      {title:"حملات المسوقين",text:"حملة محددة المدة لكتابك، ينشر فيها مسوقون مختارون يناسب جمهورهم نوع الكتاب. نتابع النشر والمواعيد، ونسلّمك رابط كل منشور.",tags:"إنستقرام، تيك توك، إكس، سناب شات"},
      {title:"معارض الكتاب",text:"نروّج لمشاركتك وكتابك قبل المعرض وأثناءه، ونعلن عن مواعيد التوقيع، ليعرف القارئ أين يجدك ومتى.",tags:"قبل المعرض، أثناء المعرض، جلسات التوقيع"},
      {title:"الأمسيات واللقاءات",text:"ننظّم أمسيتك أو لقاءك المباشر مع القرّاء ونروّج له، من الإعلان الأول إلى يوم اللقاء.",tags:"تنظيم، ترويج، بث مباشر"},
      {title:"البوسترات والمقاطع",text:"مقطع تشويقي للكتاب، ومجسّم الغلاف، وبطاقات اقتباس، وتصاميم لفعالياتك، جاهزة للنشر في حساباتك.",tags:"مقطع تشويقي، بطاقات اقتباس، بوسترات"},
      {title:"حملة ترويجية متكاملة",text:"خطة واحدة تجمع ما يلزم كتابك من الخدمات السابقة، بترتيب وتوقيت واحد، مع إعلان ممول عند الحاجة.",tags:"تخطيط، تنفيذ، متابعة، تقرير"}]}},
    {id:"campaigns",type:"campaigns",nav:"الحملات",toc:"حملات جاهزة",data:{title:"حملات جاهزة",sub:"اختر الأقرب لاحتياجك، ونعدّلها معك حسب كتابك.",
      tabA:"للمؤلفين",tabB:"لدور النشر",button:"اطلب هذه الحملة",
      a:[
        {label:"لأول تجربة",title:"البداية",text:"لمؤلف يجرّب التسويق لأول مرة.",items:"مقاطع من مسوقين مختارين\nتصاميم للنشر\nخطة تسويق مختصرة",pick:"حملة مسوقين",star:false},
        {label:"قبل الصدور",title:"العدّ التنازلي",text:"تشويق للكتاب قبل نزوله للمكتبات.",items:"مقطع تشويقي ومجسّم الغلاف\nمقاطع من مسوقين\nمسابقة على نسخ من الكتاب",pick:"حملة مسوقين",star:false},
        {label:"الأكثر طلبًا",title:"الإطلاق",text:"حملة متكاملة عند صدور الكتاب.",items:"مقاطع من مسوقين على أكثر من منصة\nمقطع تشويقي وتصاميم\nإعلان ممول\nتقرير بروابط كل منشور",pick:"حملة متكاملة",star:true},
        {label:"لكتاب صدر سابقًا",title:"الاقتباسات",text:"دفعة جديدة لكتاب يستحق قرّاء أكثر.",items:"بطاقات اقتباس من الكتاب\nمقاطع من مسوقين",pick:"حملة مسوقين",star:false},
        {label:"لقاء القرّاء",title:"الأمسية",text:"أمسية أو لقاء مباشر مع قرّائك.",items:"تنظيم الأمسية\nتصاميم ودعوات\nمقاطع تدعو للحضور",pick:"أمسية أو لقاء",star:false},
        {label:"موسم المعارض",title:"معرض الكتاب",text:"حضورك في المعرض قبله وأثناءه.",items:"إعلان مكان التوقيع وموعده\nمقاطع ومحتوى من المعرض\nبوسترات للمشاركة",pick:"معرض كتاب",star:false}],
      b:[
        {label:"كتاب واحد",title:"إصدار جديد",text:"حملة لإصدار واحد من الدار.",items:"مقاطع من مسوقين\nمقطع تشويقي وتصاميم\nخطة وتقرير",pick:"حملة متكاملة",star:false},
        {label:"الأكثر طلبًا",title:"موسم الإصدارات",text:"عدة إصدارات في حملة واحدة.",items:"مقاطع لكل إصدار\nمقطع تشويقي لكل كتاب\nإعلان ممول\nتقرير موحّد",pick:"حملة متكاملة",star:true},
        {label:"موسم المعارض",title:"جناح المعرض",text:"حضور الدار وجناحها في معرض الكتاب.",items:"تغطية قبل المعرض وأثناءه\nالترويج لجلسات التوقيع\nبوسترات وفواصل كتب",pick:"معرض كتاب",star:false},
        {label:"كتب المخزون",title:"إحياء الكتب القديمة",text:"دفعة لكتب صدرت ولم تأخذ حقها.",items:"بطاقات اقتباس\nمقاطع من مسوقين\nمسابقة على نسخ",pick:"حملة مسوقين",star:false},
        {label:"حضور ثابت",title:"الاشتراك الشهري",text:"محتوى ومقاطع للدار كل شهر.",items:"مقاطع شهرية من مسوقين\nتصاميم وبطاقات اقتباس\nتقرير شهري",pick:"حملة متكاملة",star:false}]}},
    {id:"why",type:"cols",nav:"",toc:"لماذا ورق",data:{title:"لماذا ورق",sub:"",items:[
      {title:"من داخل صناعة النشر",text:"عملنا في التسويق داخل دار نشر، ونعرف مواسم الكتب ومعارضها وكيف يصل الكتاب إلى قارئه."},
      {title:"مسوقون نعرفهم",text:"نختار لكل كتاب مسوقين يناسب جمهورهم نوعه، ونتابع التزامهم بالمحتوى والموعد."},
      {title:"كل شيء موثّق",text:"اتفاق واضح قبل البدء، ومراجعة قبل النشر، وتقرير في النهاية برابط كل منشور."}]}},
    {id:"how",type:"steps",nav:"كيف نعمل",toc:"كيف نعمل",data:{title:"كيف نعمل",sub:"خمس خطوات من أول تواصل إلى التسليم.",items:[
      {title:"نتعرّف على كتابك",text:"تخبرنا عن الكتاب وموعده وما تريده له، ونقترح الحملة المناسبة."},
      {title:"نتفق ونبدأ",text:"عرض سعر واتفاق مكتوب بالمطلوب والمدة، ودفعة أولى لبدء العمل."},
      {title:"نجهّز الحملة",text:"نصمّم المواد ونختار المسوقين، وتراجع التصاميم قبل النشر."},
      {title:"ننفّذ ونتابع",text:"ننشر حسب جدول، ونتابع كل مسوق ونراجع كل رابط."},
      {title:"نسلّمك التقرير",text:"روابط المنشورات ونتائجها، مرتبة حسب المنصة."}]}},
    {id:"publishers",type:"band",nav:"",toc:"",data:{title:"دار نشر؟",text:"نعمل مع دور النشر على الإصدارات الجديدة ومواسم المعارض وكتب المخزون، بحملة لكل إصدار أو اشتراك شهري، مع فاتورة رسمية.",
      button:"تواصل معنا كدار نشر",who:"دار نشر",pick:"حملة متكاملة"}},
    {id:"faq",type:"faq",nav:"أسئلة",toc:"أسئلة شائعة",data:{title:"أسئلة شائعة",sub:"",items:[
      {q:"كم تكلفة الحملة؟",a:"تختلف حسب عدد المقاطع والخدمات ومدة الحملة. أرسل لنا طلبك، ونرسل لك عرض سعر واضحًا بكل ما تشمله الحملة."},
      {q:"كيف يكون الدفع؟",a:"دفعة أولى عند الاتفاق لبدء العمل، والباقي قبل بدء النشر. الحملات الصغيرة تُدفع كاملة عند الاتفاق."},
      {q:"هل السعر يشمل الإعلانات الممولة؟",a:"لا. ميزانية الإعلان الممول يدفعها العميل للمنصة مباشرة، ونحن نجهّز الإعلان ونديره."},
      {q:"هل تضمنون عدد مبيعات؟",a:"لا نضمن عدد مبيعات أو مشاهدات، لأن ذلك يعتمد على الجمهور والمنصات. نضمن تنفيذ كل ما اتفقنا عليه في موعده، ونسلّمك رابط كل منشور."},
      {q:"هل المسوقون مرخّصون؟",a:"نعم، نتعامل مع مسوقين لديهم رخصة موثوق، ويُذكر في كل مقطع مدفوع أنه إعلان، التزامًا بأنظمة الهيئة العامة لتنظيم الإعلام."},
      {q:"كم مدة الحملة؟",a:"أغلب الحملات من أسبوعين إلى أربعة أسابيع، وحملات المعارض تبدأ قبل المعرض بأسابيع. الأفضل أن تتواصل معنا قبل موعد صدور كتابك بشهر."},
      {q:"ماذا أحتاج أرسل لكم؟",a:"صورة الغلاف، ملخص الكتاب، نبذة عنك، اقتباسات تحبها من الكتاب، وروابط الشراء. ونسخًا للمسوقين إن أمكن."}]}},
    {id:"request",type:"request",nav:"",toc:"اطلب خدمة",data:{title:"اطلب خدمة",sub:"سجّل طلبك في صفحة الطلب، ونراجعه ونتواصل معك.",
      boxTitle:"صفحة واحدة، وتوصلنا كل التفاصيل",boxText:"اسمك، كتابك وحالته، والخدمة اللي تحتاجها، وطريقة التواصل معك.",button:"ابدأ الطلب",
      waButton:"راسلنا على الواتساب",socialText:"حساباتنا في إنستقرام وتيك توك وإكس (تويتر):"}},
    {id:"join",type:"join",nav:"للمسوقين",toc:"للمسوقين",data:{title:"انضم إلى شبكة المسوقين",sub:"تسوّق للكتب في حساباتك؟ نكلّفك بكتب تناسب جمهورك، بمدة ومطلوب واضحين لكل حملة.",
      button:"أرسل طلب الانضمام",okTitle:"وصلنا طلب انضمامك",okText:"نراجع حسابك ونتواصل معك إذا ناسبتنا حملة لجمهورك."}}
  ]
};

var REQUEST={
  v:1,
  title:"اطلب",highlight:"خدمة",intro:"عبّ الطلب مرة وحدة، ويوصلنا مع كل تفاصيل كتابك. نراجعه ونتواصل معك.",
  submit:"أرسل الطلب",agree:"إرسال الطلب ما يلزمك بشي. نراجعه ونرسل لك عرض سعر واضح قبل أي اتفاق.",
  okTitle:"وصلنا طلبك",okText:"نراجع طلبك ونتواصل معك على الواتساب.",
  afterTitle:"بعد ما ترسل الطلب",
  after:[{title:"نراجع طلبك",text:"نقرأ تفاصيل الكتاب والخدمة اللي تحتاجها."},{title:"نتواصل معك",text:"على الواتساب، ونرسل لك عرض سعر واضح."},{title:"نتفق ونبدأ",text:"اتفاق مكتوب بالمطلوب والمدة، ثم نبدأ الحملة."}],
  parts:[
    {id:"p1",title:"عنك",fields:[
      {id:"f-who",key:"who",type:"radio",label:"أنت",options:"مؤلف\nدار نشر",required:true,width:"full"},
      {id:"f-name",key:"name",type:"text",label:"اسم المؤلف",altLabel:"اسم دار النشر",required:true,width:"full"}]},
    {id:"p2",title:"كتابك",fields:[
      {id:"f-book",key:"book",type:"text",label:"عنوان الكتاب",required:true,width:"full",hint:""},
      {id:"f-genre",key:"genre",type:"text",label:"نوع الكتاب",placeholder:"رواية، تطوير ذات، أطفال…",options:"رواية\nقصص قصيرة\nشعر\nتطوير ذات\nفكر وفلسفة\nتاريخ\nدين\nأطفال\nسيرة ذاتية\nعلمي",width:"half"},
      {id:"f-date",key:"date",type:"text",label:"الموعد المهم",placeholder:"موعد الصدور أو المعرض",width:"half"},
      {id:"f-status",key:"status",type:"radio",label:"حالة الكتاب",options:"صدر\nيصدر قريبًا\nمشارك في معرض",width:"full"},
      {id:"f-where",key:"where",type:"text",label:"أين يُباع؟",placeholder:"مكتبات، متاجر إلكترونية…",width:"half"},
      {id:"f-link",key:"link",type:"url",label:"رابط الكتاب أو حسابك",placeholder:"https://",width:"half"}]},
    {id:"p3",title:"الخدمة",fields:[
      {id:"f-picks",key:"picks",type:"checks",label:"وش تحتاج؟",hint:"اختر وحدة أو أكثر",options:"حملة مسوقين\nمعرض كتاب\nأمسية أو لقاء\nبوسترات ومقاطع\nحملة متكاملة",required:true,width:"full"},
      {id:"f-pkg",key:"pkg",type:"select",label:"حملة جاهزة",options:"# للمؤلفين\nالبداية\nالعدّ التنازلي\nالإطلاق\nالاقتباسات\nالأمسية\nمعرض الكتاب\n# لدور النشر\nإصدار جديد (دار نشر)\nموسم الإصدارات (دار نشر)\nجناح المعرض (دار نشر)\nإحياء الكتب القديمة (دار نشر)\nالاشتراك الشهري (دار نشر)",width:"half"},
      {id:"f-budget",key:"budget",type:"select",label:"الميزانية التقريبية",options:"أقل من 2,000 ريال\n2,000 إلى 5,000 ريال\n5,000 إلى 10,000 ريال\nأكثر من 10,000 ريال\nأبي اقتراحكم",width:"half"},
      {id:"f-notes",key:"notes",type:"textarea",label:"تفاصيل",placeholder:"هدفك من الحملة، جمهور الكتاب، أي شي تحب نعرفه",width:"full"}]},
    {id:"p4",title:"التواصل",fields:[
      {id:"f-phone",key:"phone",type:"tel",label:"الجوال",hint:"واتساب",placeholder:"05xxxxxxxx",required:true,width:"half"},
      {id:"f-email",key:"email",type:"email",label:"البريد",width:"half"}]}
  ]
};

/* خيارات حقول الاختيار تصير قائمة: كل خيار {t: النص, dash: يروح الطلب للوحة المسوقين لو اختاره, hidden} */
var CHOICE={radio:1,checks:1,select:1,svclist:1};
function normField(f){
  if(CHOICE[f.type]&&!Array.isArray(f.options))f.options=String(f.options||"").split("\n").map(function(x){return x.trim()}).filter(Boolean).map(function(t){return {t:t}});
  if(!CHOICE[f.type]&&Array.isArray(f.options))f.options=f.options.map(function(o){return o.t}).join("\n");
  return f;
}
/* خانات نموذج «انضم إلى شبكة المسوقين». key يربط الخانة بعمود في لوحة المسوقين؛ الخانة بدون key تنحفظ كإجابة إضافية.
   الاسم والحساب ثابتين (ما ينحذفون ولا ينخفون). */
var JOIN_FIELDS=[
  {key:"name",label:"الاسم",type:"text",required:true},
  {key:"handle",label:"الحساب",type:"text",placeholder:"@",required:true},
  {key:"phone",label:"الجوال (واتساب)",type:"tel",placeholder:"05xxxxxxxx"},
  {key:"genre",label:"نوع الكتب التي تقدّمها",type:"text",placeholder:"روايات، فكر، أطفال..."},
  {key:"platforms",label:"المنصات",type:"checks",options:"تيك توك\nإنستقرام\nإكس\nسناب شات",required:true},
  {key:"views",label:"متوسط المشاهدات للمقطع",type:"number"},
  {key:"price",label:"سعرك للمقطع (ريال)",type:"number"},
  {key:"license",label:"رخصة موثوق",type:"radio",options:"لدي رخصة\nقيد الإصدار\nلا يوجد"}
];
function joinFields(d){
  var f=Array.isArray(d&&d.fields)&&d.fields.length?d.fields:clone(JOIN_FIELDS);
  f.forEach(function(x){if(x&&typeof x.options==="string")x.options=x.options.split("\\n").join("\n")});
  ["handle","name"].forEach(function(k){var x=f.filter(function(y){return y&&y.key===k})[0];if(!x){x=clone(JOIN_FIELDS.filter(function(y){return y.key===k})[0]);f.unshift(x)}x.hidden=false;x.required=true});
  return f;
}
function normRequest(r){(r.parts||[]).forEach(function(p){(p.fields||[]).forEach(function(f){normField(f);if(Array.isArray(f.options))f.options.forEach(function(o){if(o&&Array.isArray(o.sub))o.sub.forEach(normField)})})});return r}
normRequest(REQUEST);
REQUEST.parts.forEach(function(p){p.fields.forEach(function(f){if(f.key==="picks")f.options.forEach(function(o){if(o.t==="حملة مسوقين")o.dash=true})})});

/* الحقول الأساسية: تنحفظ باسمها في الطلب وتستخدمها اللوحة (الموافقة تضيف المؤلف والكتاب) */
var CORE={who:"radio",name:"text",book:"text",genre:"text",date:"text",status:"radio",where:"text",link:"url",picks:"checks",pkg:"select",budget:"select",notes:"textarea",phone:"tel",email:"email"};
var LOCKED={name:1,phone:1};

function clone(o){return JSON.parse(JSON.stringify(o))}
var CFG=(window.WARAQ||{}).firebase||{};
function cacheKey(id){return "waraq-content-"+id}
function readCache(id){try{var s=localStorage.getItem(cacheKey(id));return s?JSON.parse(s):null}catch(e){return null}}
function writeCache(id,v){try{localStorage.setItem(cacheKey(id),JSON.stringify(v))}catch(e){}}

/* يجيب المحتوى المحفوظ (siteContent/{id}) بطلب واحد بدون مكتبة Firebase. يرجّع null إذا ما فيه محتوى محفوظ. */
function fetchContent(id){
  if(!CFG.apiKey||!CFG.projectId)return Promise.resolve(null);
  var url="https://firestore.googleapis.com/v1/projects/"+CFG.projectId+"/databases/(default)/documents/siteContent/"+id+"?key="+CFG.apiKey;
  return (window.WaraqAC?WaraqAC.headers({}):Promise.resolve({})).then(function(h){return fetch(url,{cache:"no-store",headers:h})}).then(function(r){
    if(r.status===404)return null;
    if(!r.ok)throw new Error("HTTP "+r.status);
    return r.json().then(function(d){
      var j=d&&d.fields&&d.fields.json&&d.fields.json.stringValue;
      return j?JSON.parse(j):null;
    });
  });
}

window.WaraqContent={
  defaults:function(id){return clone(id==="home"?HOME:REQUEST)},
  CORE:CORE,LOCKED:LOCKED,JOIN_FIELDS:JOIN_FIELDS,joinFields:joinFields,clone:clone,normField:normField,normRequest:normRequest,CHOICE:CHOICE,
  cached:function(id){return readCache(id)},
  /* cb(content, fromNetwork) قد تُستدعى مرتين: من النسخة المحفوظة في الجهاز ثم من القاعدة إذا اختلفت */
  load:function(id,cb){
    var c=readCache(id), first=c||null, done=false;
    var timer=setTimeout(function(){if(!done){done=true;cb(first||clone(id==="home"?HOME:REQUEST),false)}},first?0:1500);
    fetchContent(id).then(function(remote){
      var v=remote||clone(id==="home"?HOME:REQUEST);
      if(remote)writeCache(id,remote);else{try{localStorage.removeItem(cacheKey(id))}catch(e){}}
      if(!done){done=true;clearTimeout(timer);cb(v,true)}
      else if(JSON.stringify(v)!==JSON.stringify(first))cb(v,true);
    },function(){if(!done){done=true;clearTimeout(timer);cb(first||clone(id==="home"?HOME:REQUEST),false)}});
  }
};
})();
