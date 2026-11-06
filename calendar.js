/* Calendar consent is separate from reminder opt-in. All tokens stay in memory. */
(function(){
'use strict';
var CLIENT='959272085060-djjanrue85mbas7hcvkeum2q98h0p32o.apps.googleusercontent.com';
var SCOPE='openid email https://www.googleapis.com/auth/calendar.app.created https://www.googleapis.com/auth/calendar.freebusy';
var access='',who=null,expires=0,preview=[],busy=[],calMap=null,loading=false;
function el(id){return document.getElementById(id)}
function status(s){if(el('cal-status'))el('cal-status').textContent=s}
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function data(){return JSON.parse(localStorage.getItem('study-planner.v1')||'{"exams":[]}')}
function ymd(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function next(s,n){var d=new Date(s+'T12:00:00');d.setDate(d.getDate()+n);return ymd(d)}
async function api(path,body,method){if(!access||Date.now()>expires)throw Error('permission_expired');var r=await fetch('https://www.googleapis.com/calendar/v3/'+path,{method:method||(body?'POST':'GET'),headers:{Authorization:'Bearer '+access,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});if(!r.ok)throw Error('calendar_'+r.status);return r.status===204?{}:r.json()}
window.calendarHtml=function(){return '<h2>היומן שלי</h2><p>חיבור Google לבדיקת זמינות ולכתיבת מבחנים וזמני לימוד ליומן נפרד. רק אתה מאשר את החשבון ואת השינויים.</p><div class="note"><b>מה משתפים?</b>בודקים רק זמני תפוס/פנוי ביומן הראשי, בלי שמות פגישות. מבחנים ובלוקי לימוד שתבחר יישמרו ב-Google Calendar שלך. לא בשרת התזכורות ולא אצל ההורה. ההרשאה זמנית; אין סנכרון אוטומטי כשהדף סגור. זמני התפוס נשארים בזיכרון רק בזמן השימוש. החיבור מוגבל כרגע לחשבונות בדיקה שאושרו להגדרת Google.</div><p><button class="btn" data-cal="connect">בחירת חשבון ומתן הרשאה ב-Google</button></p><p id="cal-who" class="quiet small">'+(who?'מחובר: '+esc(who.email):'עדיין לא מחובר. בחר את החשבון של בעל היומן, לא חשבון של אדם אחר.')+'</p><div class="form"><label>תחילת תקופת הלימוד<input type="date" id="cal-from"></label><label>סוף התקופה (עד 21 ימים)<input type="date" id="cal-to"></label><label>תחילת חלון לימוד (שעת ישראל)<input type="time" id="cal-start"></label><label>סוף חלון לימוד (שעת ישראל)<input type="time" id="cal-end"></label><label>כמה דקות לכל בלוק לימוד?<input type="number" min="10" max="180" step="5" id="cal-minutes" placeholder="בחירה שלך"></label></div><p class="small quiet">בלוק אחד לכל יום לימוד, לא הערכה של משך כל נושא. אתה בוחר את הדקות. זמינות נבדקת ביומן הראשי בלבד. רק ימים עם תכנון לימוד או חזרה מקבלים בלוק. מבחנים מתווספים כאירוע יום שלם כי לא הוזנה שעת מבחן.</p><p><button class="btn ghost" data-cal="preview">בדיקת זמינות ותצוגה מקדימה</button></p><p id="cal-status" role="status" class="quiet small"></p><div id="cal-preview"></div><p><button class="link" data-cal="disconnect">ניתוק ההרשאה</button></p><p class="small quiet">ניתוק לא מוחק אירועים קיימים. אין הזמנות או משתתפים. אירועים אישיים קיימים לעולם לא נמחקים. עדכון נוגע רק לאירועים שנוצרו כאן ומזוהים כשייכים למתכנן.</p>'};
async function connect(){
 if(!window.google||!google.accounts){if(!loading){loading=true;var s=document.createElement('script');s.src='https://accounts.google.com/gsi/client';s.onload=function(){loading=false;status('Google נטען. לחץ שוב כדי לבחור חשבון.');};s.onerror=function(){loading=false;status('Google לא נטען. בדוק חיבור ונסה שוב.');};document.head.appendChild(s)}status('טוענים את Google. ההרשאה תתבקש רק בלחיצה נוספת.');return}
 var client=google.accounts.oauth2.initTokenClient({client_id:CLIENT,scope:SCOPE,prompt:'select_account',callback:async function(r){
  if(r.error){status('החיבור לא אושר. לא בוצע שינוי ביומן.');return}
  if(!google.accounts.oauth2.hasGrantedAllScopes(r,'https://www.googleapis.com/auth/calendar.app.created','https://www.googleapis.com/auth/calendar.freebusy')){status('לא ניתנו כל ההרשאות הנדרשות. לא בוצע שינוי.');return}
  access=r.access_token;expires=Date.now()+(r.expires_in-60)*1000;
  try{who=await fetch('https://www.googleapis.com/oauth2/v3/userinfo',{headers:{Authorization:'Bearer '+access}}).then(function(x){if(!x.ok)throw Error();return x.json()});el('cal-who').textContent='מחובר: '+who.email;preview=[];status('מחובר. מלא חלון לימוד ודקות, ואז בדוק תצוגה מקדימה.')}catch(e){access='';who=null;status('לא זוהה החשבון. לא בוצע שינוי.')}
 },error_callback:function(){status('חלון החיבור נסגר או נחסם. פתח ב-Safari ואפשר חלון קופץ, ואז נסה שוב.')}});client.requestAccessToken();
}
// Resolve Israel wall time via Intl, including daylight saving; reject invalid wall times.
function instant(date,time){var wall=date+'T'+time+':00';var guess=new Date(wall+'Z');for(var i=0;i<3;i++){var p=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Jerusalem',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).format(guess).replace(' ','T');var delta=Date.parse(wall+'Z')-Date.parse(p+'Z');if(!delta)return guess.toISOString();guess=new Date(+guess+delta)}throw Error('invalid_wall_time')}
async function buildPreview(){
 if(!who||!access)throw Error('not_connected');var from=el('cal-from').value,to=el('cal-to').value,start=el('cal-start').value,end=el('cal-end').value,min=Number(el('cal-minutes').value);
 if(!from||!to||!start||!end||!Number.isInteger(min)||min<10||min>180||end<=start||from<ymd(new Date())||to<from||to>next(from,20))throw Error('invalid_inputs');
 var begin=instant(from,'00:00'),finish=instant(next(to,1),'00:00');status('בודקים זמני תפוס/פנוי ביומן הראשי…');var fb=await api('freeBusy',{timeMin:begin,timeMax:finish,timeZone:'Asia/Jerusalem',items:[{id:'primary'}]});if(!fb.calendars||!fb.calendars.primary||fb.calendars.primary.errors)throw Error('availability_unknown');busy=fb.calendars.primary.busy||[];preview=[];
 var st=data(),planned=window.plannerCalendarDays?window.plannerCalendarDays():[];(st.exams||[]).filter(function(e){return !e.demo&&e.date>=from&&e.date<=to}).forEach(function(e){preview.push({key:'exam-'+e.id,summary:'מבחן: '+e.subject,start:{date:e.date},end:{date:next(e.date,1)}})});
 var skipped=[];
 for(var day=from;day<=to;day=next(day,1)){
  if(!planned.includes(day))continue;
  var pending=(st.exams||[]).filter(function(e){return !e.demo&&e.date>day&&e.topics.some(function(x){return !x.done})});if(!pending.length)continue;
  var a=Date.parse(instant(day,start)),z=Date.parse(instant(day,end)),slot=null;
  for(var t=a;t+min*60000<=z;t+=5*60000){if(t<Date.now())continue;if(!busy.some(function(b){return t<Date.parse(b.end)&&t+min*60000>Date.parse(b.start)})){slot=t;break}}
  if(slot===null){skipped.push(day);continue}
  preview.push({key:'study-'+day,summary:'זמן לימוד',start:{dateTime:new Date(slot).toISOString(),timeZone:'Asia/Jerusalem'},end:{dateTime:new Date(slot+min*60000).toISOString(),timeZone:'Asia/Jerusalem'}});
 }
 var h='<h3>לפני שמוסיפים ליומן</h3><p>חשבון: '+esc(who.email)+'. יומן נפרד: "התכנון שלי". אין משתתפים ואין הזמנות. מסמנים רק את האירועים שרוצים. בדיקת הפנוי נכונה לרגע הבדיקה בלבד.</p>';
 preview.forEach(function(e,i){h+='<label class="check"><input style="position:static;opacity:1;width:22px;height:22px" type="checkbox" data-cal-event="'+i+'" checked><span>'+esc(e.summary)+' · '+esc(e.start.date||new Date(e.start.dateTime).toLocaleString('he-IL',{timeZone:'Asia/Jerusalem'}))+(e.end.dateTime?' · '+min+' דקות':' · יום שלם')+'</span></label>'});
 if(skipped.length)h+='<p>לא נמצא מקום בחלון שבחרת בימים: '+skipped.map(esc).join(', ')+'. לא נוצר בהם בלוק.</p>';
 h+=preview.length?'<p><button class="btn" data-cal="apply">אישור: הוספה / עדכון המסומנים ביומן שלי</button></p>':'<p>אין אירועים להוסיף בתקופה הזו.</p>';el('cal-preview').innerHTML=h;status('זו תצוגה מקדימה בלבד. לא בוצע שינוי.');
}
async function digest(x){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(x)))).map(function(c){return c.toString(16).padStart(2,'0')}).join('')}
async function apply(){
 if(!who||Date.now()>expires)throw Error('permission_expired');var selected=Array.from(document.querySelectorAll('[data-cal-event]:checked')).map(function(e){return preview[Number(e.dataset.calEvent)]});if(!selected.length)throw Error('nothing_selected');
 if(!confirm('להוסיף או לעדכן '+selected.length+' אירועים ביומן נפרד בחשבון '+who.email+'?'))return;
 status('בודקים שוב זמינות לפני השמירה…');var times=selected.filter(function(e){return e.start.dateTime});if(times.length){var f=await api('freeBusy',{timeMin:times[0].start.dateTime,timeMax:times[times.length-1].end.dateTime,items:[{id:'primary'}]});var b=f.calendars&&f.calendars.primary;if(!b||b.errors)throw Error('availability_unknown');if(times.some(function(e){return (b.busy||[]).some(function(x){return e.start.dateTime<x.end&&e.end.dateTime>x.start})}))throw Error('availability_changed')}
 var mk='planner-calendar-'+who.sub;calMap=JSON.parse(localStorage.getItem(mk)||'null');
 if(!calMap){var c=await api('calendars',{summary:'התכנון שלי',description:'מבחנים וזמני לימוד מהמתכנן, ללא הזמנות',timeZone:'Asia/Jerusalem'});calMap={id:c.id,owner:who.sub};localStorage.setItem(mk,JSON.stringify(calMap))}
 if(calMap.owner!==who.sub)throw Error('wrong_owner');
 var done=0;status('שומרים אירועים. אם הפעולה תיעצר, ייתכן שחלק נשמרו.');
 for(var e of selected){var id=await digest('study-planner|'+who.sub+'|'+e.key),path='calendars/'+encodeURIComponent(calMap.id)+'/events',body={id:id,summary:e.summary,start:e.start,end:e.end,visibility:'private',transparency:e.start.date?'transparent':'opaque',extendedProperties:{private:{planner:'study-planner-v1',owner:who.sub}},reminders:{useDefault:false},attendees:[]};
  var exists=null;try{exists=await api(path+'/'+id)}catch(err){if(err.message!=='calendar_404')throw err}
  if(exists){if(exists.extendedProperties?.private?.planner!=='study-planner-v1'||exists.extendedProperties?.private?.owner!==who.sub)throw Error('ownership_guard');delete body.id;await api(path+'/'+id+'?sendUpdates=none',body,'PUT')}else await api(path+'?sendUpdates=none',body);
  done++;
 }
 preview=[];el('cal-preview').innerHTML='';status('נשמרו '+done+' אירועים. שינוי עתידי במתכנן מחייב תצוגה מקדימה ואישור מחדש. מחיקת נושא או מבחן כאן לא מוחקת אירוע ביומן. אפשר לנהל אירועים ישירות ב-Google Calendar.');
}
document.addEventListener('click',async function(ev){var b=ev.target.closest('[data-cal]');if(!b)return;b.disabled=true;try{
 if(b.dataset.cal==='connect')await connect();else if(b.dataset.cal==='preview')await buildPreview();else if(b.dataset.cal==='apply')await apply();else if(b.dataset.cal==='disconnect'){if(access&&window.google)google.accounts.oauth2.revoke(access);access='';who=null;preview=[];el('cal-who').textContent='מנותק';el('cal-preview').innerHTML='';status('ההרשאה נותקה. אירועים קיימים נשארו ביומן.')}
 }catch(e){var msg={invalid_inputs:'מלא תאריכים עד 21 ימים, חלון שעות ודקות לבלוק. אין תאריך עבר.',not_connected:'בחר קודם חשבון ואשר הרשאה.',permission_expired:'ההרשאה הזמנית הסתיימה. התחבר שוב לפני המשך.',availability_unknown:'לא ניתן לאמת זמינות. לא מוסיפים אירועים בלי הבדיקה.',availability_changed:'הזמינות השתנתה. בנה תצוגה מקדימה חדשה.',ownership_guard:'האירוע אינו מזוהה כשל המתכנן. לא בוצע עדכון שלו.'};status(msg[e.message]||'לא הושלם. ייתכן שחלק מהאירועים כבר נשמרו. אפשר לבדוק ביומן ולנסות שוב; אירועים עם אותו מזהה יעודכנו בלי כפילות.')}finally{b.disabled=false}});
})();
