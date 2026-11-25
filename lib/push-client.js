const KEY='last-save-push';
export function savedPush(){try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch{return null}}
export async function getPushConfig(){const r=await fetch('/api/push/config');if(!r.ok)throw Error('Could not read push configuration.');return r.json()}
function keyBytes(s){return Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-s.length%4)%4)),c=>c.charCodeAt(0))}
async function post(url,body){const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await r.json();if(!r.ok)throw Error(data.error||'Push request failed.');return data}
export async function enablePush(config){
 if(!config.configured)throw Error('Configure VAPID environment variables on your server first.');
 if(!window.isSecureContext||!('serviceWorker' in navigator)||!('PushManager' in window)||!('Notification' in window))throw Error('This browser does not support Web Push here.');
 const permission=await Notification.requestPermission();if(permission!=='granted')throw Error('Notification permission was not granted.');
 await navigator.serviceWorker.register('/sw.js');const registration=await navigator.serviceWorker.ready;
 let subscription=await registration.pushManager.getSubscription();if(!subscription)subscription=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:keyBytes(config.publicKey)});
 const {ticket}=await post('/api/push/subscribe',{subscription:subscription.toJSON()});localStorage.setItem(KEY,JSON.stringify({ticket}));return ticket;
}
export async function disablePush(){localStorage.removeItem(KEY);const registration=await navigator.serviceWorker.getRegistration('/');const subscription=await registration?.pushManager.getSubscription();if(subscription)await subscription.unsubscribe()}
export async function sendPush(event,count=0){const saved=savedPush();if(!saved?.ticket)throw Error('Enable push notifications first.');return post('/api/push/notify',{ticket:saved.ticket,event,count})}
