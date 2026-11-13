import {createParityCapsule,repairWithCapsule} from './parity.mjs';
export const PROOF_BLOCK_SIZE=4096;
export function makeProofImage(){
 const b=new Uint8Array(32768),v=new DataView(b.buffer),w=104,h=104,stride=312;
 b[0]=66;b[1]=77;v.setUint32(2,b.length,true);v.setUint32(10,54,true);v.setUint32(14,40,true);v.setInt32(18,w,true);v.setInt32(22,h,true);v.setUint16(26,1,true);v.setUint16(28,24,true);v.setUint32(34,stride*h,true);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const dx=(x-52)/39,dy=(y-54)/38,p=54+(h-1-y)*stride+x*3;
  let c=[24,13,33];
  if(dx*dx+dy*dy<1)c=[240-Math.floor(Math.abs(dx)*35),112+Math.floor(Math.sin(x*.24)*19),28];
  if(y>17&&y<58&&x>48&&x<57)c=[112,145,75];
  if(y>39&&y<55&&((x>29&&x<43&&y>53-(x-29))||(x>62&&x<77&&y>39+(x-62))))c=[255,235,160];
  if(y>68&&y<79&&x>31&&x<75&&Math.abs(x-52)<26-(y-68))c=[255,235,160];
  b[p]=c[2];b[p+1]=c[1];b[p+2]=c[0];
 }
 return b;
}
export function damageProof(original,blocks,missingTail=false){
 if(!Array.isArray(blocks)||blocks.some(n=>!Number.isInteger(n)||n<0||n>7))throw Error('Choose block indices 0–7.');
 if(missingTail)return original.slice(0,7*PROOF_BLOCK_SIZE);
 const damaged=original.slice();
 for(const index of new Set(blocks))for(let p=index*4096;p<Math.min((index+1)*4096,damaged.length);p++)damaged[p]^=0xa5;
 return damaged;
}
export async function runProof(blocks=[3],missingTail=false){
 const original=makeProofImage(),capsule=await createParityCapsule(original,'LANTERN.bmp');
 const damaged=damageProof(original,blocks,missingTail),hash=async b=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',b))].map(x=>x.toString(16).padStart(2,'0')).join('');
 const result={original,damaged,capsule,blocks:missingTail?[7]:[...new Set(blocks)],originalHash:capsule.sha256,damagedHash:await hash(damaged),missingTail};
 try{const repaired=await repairWithCapsule(damaged,capsule);return {...result,status:'verified',repaired:repaired.bytes,repairedBlocks:repaired.repairedBlocks,repairedHash:await hash(repaired.bytes)}}
 catch(e){return {...result,status:'refused',reason:e.message}}
}
