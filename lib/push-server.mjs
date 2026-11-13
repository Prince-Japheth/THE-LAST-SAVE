import {createHmac,timingSafeEqual} from 'node:crypto';
const PUSH_HOSTS = ['fcm.googleapis.com','updates.push.services.mozilla.com','push.services.mozilla.com','web.push.apple.com','push.apple.com','wns.windows.com'];
export class PushError extends Error { constructor(message,status=400){super(message);this.status=status;} }
export function bearerToken(header){if(typeof header!=='string'||!/^Bearer [A-Za-z0-9._~-]{1,8192}$/.test(header))throw new PushError('A valid sign-in token is required.',401);return header.slice(7);}
function key(value,bytes){if(typeof value!=='string'||!/^[A-Za-z0-9_-]+={0,2}$/.test(value))throw new PushError('Invalid push encryption keys.');const decoded=Buffer.from(value,'base64url');if(decoded.length!==bytes||decoded.toString('base64url')!==value.replace(/=+$/,''))throw new PushError('Invalid push encryption keys.');return decoded;}
export function validateSubscription(value){if(!value||typeof value!=='object'||typeof value.endpoint!=='string'||value.endpoint.length>2048)throw new PushError('Invalid push subscription.');let url;try{url=new URL(value.endpoint);}catch{throw new PushError('Invalid push endpoint.');}const host=url.hostname.toLowerCase();if(url.protocol!=='https:'||url.username||url.password||url.port||url.hash||!PUSH_HOSTS.some(allowed=>host===allowed||host.endsWith('.'+allowed)))throw new PushError('Unsupported push service.');if(!value.keys||key(value.keys.p256dh,65)[0]!==4)throw new PushError('Invalid push public key.');key(value.keys.auth,16);return {endpoint:url.href,keys:{p256dh:value.keys.p256dh,auth:value.keys.auth}};}
export function notificationPayload(value){if(!value||typeof value!=='object'||Object.keys(value).some(k=>!['event','count'].includes(k))||!['test','recovery-complete'].includes(value.event))throw new PushError('Unsupported notification event.');const count=value.count??0;if(!Number.isInteger(count)||count<0||count>32)throw new PushError('Recovery count must be between 0 and 32.');return {title:'THE LAST SAVE',body:value.event==='test'?'Notifications are ready.':`Recovery complete. ${count} ${count===1?'file is':'files are'} ready.`,tag:value.event,url:'/'};}

export function publicConfig(request){
 const origin=new URL(request.url).origin;
 const subject=process.env.VAPID_SUBJECT || (origin.startsWith('https:')?origin:'');
 return {configured:Boolean(process.env.VAPID_PUBLIC_KEY&&process.env.VAPID_PRIVATE_KEY&&subject),publicKey:process.env.VAPID_PUBLIC_KEY||'',subject};
}
export function requireOrigin(request){if(request.headers.get('origin')!==new URL(request.url).origin)throw new PushError('A same-origin request is required.',403);}
export async function readBody(request){
 const reader=request.body?.getReader();if(!reader)throw new PushError('Missing JSON body.');let chunks=[],size=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>8192){await reader.cancel();throw new PushError('Request is too large.',413)}chunks.push(Buffer.from(value));}}finally{reader.releaseLock()}
 try{return JSON.parse(Buffer.concat(chunks).toString('utf8'))}catch{throw new PushError('Invalid JSON request.')}
}
function signature(value){if(!process.env.VAPID_PRIVATE_KEY)throw new PushError('Push is not configured.',503);return createHmac('sha256',process.env.VAPID_PRIVATE_KEY).update(value).digest('base64url')}
export function issueTicket(subscription,now=Date.now()){
 const payload=Buffer.from(JSON.stringify({subscription:validateSubscription(subscription),expires:now+7*86400000})).toString('base64url');return payload+'.'+signature(payload);
}
export function verifyTicket(ticket,now=Date.now()){
 if(typeof ticket!=='string'||ticket.length>6000)throw new PushError('Enable push again.',401);const parts=ticket.split('.');if(parts.length!==2)throw new PushError('Invalid push ticket.',401);
 const expected=Buffer.from(signature(parts[0]));const actual=Buffer.from(parts[1]);if(actual.length!==expected.length||!timingSafeEqual(actual,expected))throw new PushError('Invalid push ticket.',401);
 let value;try{value=JSON.parse(Buffer.from(parts[0],'base64url').toString('utf8'))}catch{throw new PushError('Invalid push ticket.',401)}if(!Number.isFinite(value.expires)||value.expires<=now)throw new PushError('Push ticket expired. Enable push again.',401);return validateSubscription(value.subscription);
}
export function errorResponse(error){return Response.json({error:error instanceof PushError?error.message:'The push service could not complete this request.'},{status:error instanceof PushError?error.status:500,headers:{'Cache-Control':'no-store'}})}
const sends=new Map();
export function reserveSend(endpoint,now=Date.now()){
 for(const [id,time] of sends)if(now-time>10000)sends.delete(id);
 if(sends.has(endpoint)||sends.size>=1000)throw new PushError('Wait 10 seconds before sending another notification.',429);sends.set(endpoint,now);
}
