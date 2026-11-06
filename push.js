/* Only token, hour and opt-in state are stored remotely. Never reads study storage. */
(function(){
var config={apiKey:'AIzaSyBnhZsSN7JZHvLZ3WXVqChaaFM_B86QNSk',authDomain:'study-planner-reminders.firebaseapp.com',projectId:'study-planner-reminders',messagingSenderId:'959272085060',appId:'1:959272085060:web:8080b97c0c80c0f1ba7e11'};
var vapid='BCq0ViBqBokZ_mbrUMhi18t8v0axcFAZU6aVbYkbwzsANdH4_ys1JCwpsazRKNssA7c7he1RoRVL7IaR9x1v8kc',ready;
function load(src){return new Promise(function(ok,no){var s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=no;document.head.appendChild(s)})}
function init(){return ready||(ready=Promise.all(['app','auth','firestore','messaging'].map(function(x){return x})).then(async function(){await load('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');await Promise.all(['auth','firestore','messaging'].map(function(x){return load('https://www.gstatic.com/firebasejs/10.14.1/firebase-'+x+'-compat.js')}));firebase.initializeApp(config);if(!firebase.auth().currentUser)await firebase.auth().signInAnonymously();return firebase.auth().currentUser}));}
function status(s){var e=document.getElementById('push-status');if(e)e.textContent=s}
async function hash(s){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(function(v){return v.toString(16).padStart(2,'0')}).join('')}
window.plannerPushHtml=function(){var ios=/iphone|ipad/i.test(navigator.userAgent),stand=window.navigator.standalone||matchMedia('(display-mode: standalone)').matches;
 var h='<p class="quiet small">תזכורת יומית כללית גם כשהמתכנן סגור. לא נשלחים מבחנים, נושאים או התקדמות. רק הרשאת התראות והשעה נשמרות בנפרד. הבדיקה היא פעם בשעה, סביב דקה 17, וייתכנו עיכובים. שעות לפי ישראל. מכסה חינמית שנגמרת יכולה לעצור תזכורות.</p>';
 if(ios&&!stand)return h+'<div class="note"><b>קודם מוסיפים למסך הבית</b>ב-Safari: שיתוף ← הוספה למסך הבית ← הוסף. פותחים מהסמל החדש ואז חוזרים לכאן. נדרש iOS 16.4 ומעלה.</div>';
 if(!('Notification'in window)||!('serviceWorker'in navigator)||!('PushManager'in window))return h+'<p>התראות אינן זמינות בדפדפן הזה. התכנון עצמו עובד גם בלעדיהן.</p>';
 h+='<div class="form"><label>שעת התזכורת (ישראל)<select id="push-hour"><option value="">בחירת שעה</option>'+Array.from({length:24},function(_,i){return '<option value="'+i+'"'+(localStorage.getItem('planner-push-hour')===String(i)?' selected':'')+'>'+String(i).padStart(2,'0')+':17 בערך</option>'}).join('')+'</select></label></div><p><button class="btn" data-push="enable">הפעלה / עדכון שעה</button></p><p><button class="btn ghost sm" data-push="off">כיבוי תזכורת במכשיר הזה</button></p><p id="push-status" class="quiet small" role="status">'+(localStorage.getItem('planner-push-hour')!==null?'השעה נשמרה במכשיר. יש לבדוק קבלה בהתראת ניסיון.':'התזכורת עדיין לא הופעלה כאן.')+'</p>';
 var id=localStorage.getItem('planner-push-hash');if(id)h+='<details><summary>בדיקת התראת ניסיון</summary><p class="small">ההפעלה נבדקת בפועל בטלפון. לבדיקת ניסיון עם אלעד, מוסרים רק את מזהה המכשיר הזה, לא את נתוני המבחנים:</p><code style="overflow-wrap:anywhere;font-size:12px">'+id+'</code></details>';
 return h;
};
document.addEventListener('click',async function(e){var b=e.target.closest('[data-push]');if(!b)return;b.disabled=true;
 try{
  if(b.dataset.push==='off'){var u=await init();await firebase.firestore().doc('devices/'+u.uid).delete();try{await firebase.messaging().deleteToken()}catch(e){}localStorage.removeItem('planner-push-hour');localStorage.removeItem('planner-push-hash');status('התזכורת כבויה במכשיר הזה.');return}
  var h=document.getElementById('push-hour').value;if(h===''){status('בחר שעה לפני ההפעלה.');return}
  var perm=await Notification.requestPermission();if(perm!=='granted'){status('לא ניתנה הרשאה. אפשר להמשיך לתכנן בלי התראות. אם נחסם, משנים בהגדרות ההתראות של האייפון.');return}
  status('שומרים הרשאה ושעה…');var u=await init();var reg=await navigator.serviceWorker.ready;
  var token=await firebase.messaging().getToken({vapidKey:vapid,serviceWorkerRegistration:reg});if(!token)throw Error('no token');
  await firebase.firestore().doc('devices/'+u.uid).set({token:token,hour:Number(h),enabled:true});
  localStorage.setItem('planner-push-hour',h);localStorage.setItem('planner-push-hash',await hash(token));status('נשמר. יש לבדוק קבלה בפועל בהתראת ניסיון בטלפון. לפתיחת מזהה הבדיקה, עבור ללשונית אחרת וחזור.');
 }catch(err){status('לא הצלחנו לשמור את התזכורת. בדוק חיבור ונסה שוב. נתוני הלימוד לא נפגעו.')}finally{b.disabled=false}
});
})();
