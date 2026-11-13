import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSubscription, notificationPayload, bearerToken } from '../lib/push-server.mjs';
const subscription = {endpoint:'https://fcm.googleapis.com/fcm/send/example',keys:{p256dh:Buffer.concat([Buffer.from([4]),Buffer.alloc(64,1)]).toString('base64url'),auth:Buffer.alloc(16,1).toString('base64url')}};
test('accepts a standard push subscription',()=>assert.equal(validateSubscription(subscription).endpoint,subscription.endpoint));
test('blocks SSRF and malformed endpoints',()=>{for(const endpoint of ['http://fcm.googleapis.com/a','https://localhost/a','https://127.0.0.1/a','https://192.168.0.1/a','https://fcm.googleapis.com.evil.test/a','https://evil.test/a','https://user:pass@fcm.googleapis.com/a','https://fcm.googleapis.com:8443/a']) assert.throws(()=>validateSubscription({...subscription,endpoint}));});
test('rejects wrong key encoding and size',()=>{for(const p256dh of ['bad','!!',Buffer.alloc(65).toString('base64url')]) assert.throws(()=>validateSubscription({...subscription,keys:{...subscription.keys,p256dh}})); assert.throws(()=>validateSubscription({...subscription,keys:{...subscription.keys,auth:'bad'}}));});
test('only permits bounded fixed notifications',()=>{assert.equal(notificationPayload({event:'test'}).url,'/'); assert.equal(notificationPayload({event:'recovery-complete',count:32}).url,'/'); for(const data of [{event:'oops'},{event:'recovery-complete',count:33},{event:'test',url:'https://evil.test'},{event:'recovery-complete',count:1.5}]) assert.throws(()=>notificationPayload(data));});
test('requires a bounded bearer token',()=>{assert.equal(bearerToken('Bearer a.b.c'),'a.b.c'); for(const token of [null,'Basic a','Bearer ','Bearer a b','Bearer '+ 'a'.repeat(9000)]) assert.throws(()=>bearerToken(token));});
test('rejects unsafe subscription shapes',()=>{for(const value of [null,{}, {endpoint:'https://fcm.googleapis.com/'+ 'a'.repeat(2048)}, {...subscription,endpoint:'https://[::1]/a'}, {...subscription,endpoint:'https://fcm.googleapis.com/a#fragment'}]) assert.throws(()=>validateSubscription(value));});

import {issueTicket,verifyTicket,readBody,requireOrigin} from '../lib/push-server.mjs';
test('signed subscription tickets bind endpoint and expire',()=>{process.env.VAPID_PRIVATE_KEY='test-only-key';const ticket=issueTicket(subscription,1000);assert.deepEqual(verifyTicket(ticket,1001),subscription);assert.throws(()=>verifyTicket(ticket,1000+7*86400000),/expired/);assert.throws(()=>verifyTicket(ticket+'x',1001),/Invalid/);const pieces=ticket.split('.');pieces[0]=Buffer.from(JSON.stringify({subscription:{...subscription,endpoint:'https://fcm.googleapis.com/other'},expires:99999999})).toString('base64url');assert.throws(()=>verifyTicket(pieces.join('.'),1001),/Invalid/)});
test('push POST rejects missing or cross-site origin',()=>{assert.throws(()=>requireOrigin(new Request('https://save.test/api/push/notify')),/same-origin/);assert.throws(()=>requireOrigin(new Request('https://save.test/api/push/notify',{headers:{origin:'https://evil.test'}})),/same-origin/);requireOrigin(new Request('https://save.test/api/push/notify',{headers:{origin:'https://save.test'}}))});
test('body reader stops at the byte limit',async()=>{await assert.rejects(readBody(new Request('https://save.test',{method:'POST',body:'x'.repeat(9000)})),/too large/);assert.deepEqual(await readBody(new Request('https://save.test',{method:'POST',body:'{"ok":true}'})),{ok:true})});

import webpush from 'web-push';
import {createECDH,createPublicKey,verify as verifySignature} from 'node:crypto';
test('real VAPID request signs the provider audience and encrypts notification content',()=>{
 const vapid=webpush.generateVAPIDKeys();const receiver=createECDH('prime256v1');receiver.generateKeys();
 const sub={endpoint:'https://fcm.googleapis.com/fcm/send/test-device',keys:{p256dh:receiver.getPublicKey().toString('base64url'),auth:Buffer.alloc(16,7).toString('base64url')}};
 const details=webpush.generateRequestDetails(sub,JSON.stringify(notificationPayload({event:'test'})),{vapidDetails:{subject:'https://save.test',publicKey:vapid.publicKey,privateKey:vapid.privateKey},TTL:300});
 assert.equal(details.method,'POST');assert.equal(details.headers['Content-Encoding'],'aes128gcm');assert.ok(Buffer.isBuffer(details.body));assert.equal(details.body.includes(Buffer.from('Notifications are ready.')),false);
 const jwt=/t=([^,]+)/.exec(details.headers.Authorization)[1];const [header,payload,signature]=jwt.split('.');const claims=JSON.parse(Buffer.from(payload,'base64url'));assert.equal(claims.aud,'https://fcm.googleapis.com');assert.equal(claims.sub,'https://save.test');
 const pub=Buffer.from(vapid.publicKey,'base64url');const key=createPublicKey({key:{kty:'EC',crv:'P-256',x:pub.subarray(1,33).toString('base64url'),y:pub.subarray(33).toString('base64url')},format:'jwk'});
 assert.equal(verifySignature('sha256',Buffer.from(header+'.'+payload),{key,dsaEncoding:'ieee-p1363'},Buffer.from(signature,'base64url')),true);
});
