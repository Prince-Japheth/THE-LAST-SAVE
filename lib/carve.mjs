/** Contiguous file carving only. No filesystem metadata or deleted-state inference. */
export const MAX_IMAGE_BYTES=64*1024*1024;
const MAX_FILE=16*1024*1024, MAX_PIXELS=4*1024*1024;
const table=Uint32Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
const crc32=(b,start,end)=>{let c=0xffffffff;for(let p=start;p<end;p++)c=table[(c^b[p])&255]^(c>>>8);return (c^0xffffffff)>>>0;};
const dimensions=(w,h)=>w>0&&h>0&&w*h<=MAX_PIXELS;
function png(b,start,v,spend){
 const stop=Math.min(b.length,start+MAX_FILE);let p=start+8,header=false,data=false,endedData=false,palette=false,chunks=0,color;
 while(p+12<=stop&&++chunks<=8192){
  const n=v.getUint32(p,false);if(n>MAX_FILE||p+12+n>stop)return null;
  spend(n+12);
  const t=String.fromCharCode(...b.subarray(p+4,p+8));
  if(!/^[A-Za-z]{4}$/.test(t)||crc32(b,p+4,p+8+n)!==v.getUint32(p+8+n,false))return null;
  if(!header&&t!=='IHDR')return null;
  if(t==='IHDR'){
   if(header||n!==13)return null;
   const w=v.getUint32(p+8,false),h=v.getUint32(p+12,false),depth=b[p+16];color=b[p+17];
   const depths={0:[1,2,4,8,16],2:[8,16],3:[1,2,4,8],4:[8,16],6:[8,16]};
   if(!dimensions(w,h)||!depths[color]?.includes(depth)||b[p+18]!==0||b[p+19]!==0||b[p+20]>1)return null;
   header=true;
  } else if(t==='PLTE') {if(data||palette||!n||n%3||n>768||[0,4].includes(color))return null;palette=true;}
  else if(t==='IDAT'){if(endedData||color===3&&!palette)return null;if(n)data=true;}
  else if(t==='IEND'){if(n||!data)return null;return {end:p+12,warnings:['PNG chunk structure and CRCs verified; pixel decompression is left to the image viewer.']};}
  else {if(t[0]===t[0].toUpperCase())return null;if(data)endedData=true;}
  p+=12+n;
 }
 return null;
}
function bmp(b,start,v,spend){
 if(start+54>b.length)return null;
 const size=v.getUint32(start+2,true),offset=v.getUint32(start+10,true),dib=v.getUint32(start+14,true);
 if(size<54||size>MAX_FILE||start+size>b.length||dib<40||14+dib>size||offset<14+dib||offset>=size)return null;
 spend(size);
 const w=v.getInt32(start+18,true),signed=v.getInt32(start+22,true),h=Math.abs(signed),bits=v.getUint16(start+28,true);
 if(!dimensions(w,h)||v.getUint16(start+26,true)!==1||v.getUint32(start+30,true)!==0||![8,24,32].includes(bits))return null;
 const stride=Math.ceil(w*bits/32)*4;
 if(offset+stride*h>size)return null;
 if(bits===8){const colors=v.getUint32(start+46,true)||256;if(colors>256||14+dib+colors*4>offset)return null;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(b[start+offset+y*stride+x]>=colors)return null;}
 return {end:start+size,warnings:['Uncompressed BMP header, dimensions, palette and complete pixel-array bounds verified.']};
}
function jpeg(b,start,v,spend){
 const stop=Math.min(b.length,start+MAX_FILE);let p=start+2,sof=false,dqt=false,dht=false,sos=false,entropy=0,segments=0;let components=[];
 while(p+1<stop&&++segments<=8192){
  if(b[p++]!==255)return null;
  while(p<stop&&b[p]===255)p++;
  if(p>=stop)return null;
  const marker=b[p++];
  if(marker===217)return sof&&dqt&&dht&&sos&&entropy?{end:p,warnings:['JPEG marker structure and contiguous EOI verified; entropy coefficients are not decoded or repaired.']}:null;
  if(marker===0||marker===216||marker===1||marker>=208&&marker<=215)return null;
  if(p+2>stop)return null;const n=v.getUint16(p,false);if(n<2||p+n>stop)return null;
  spend(n+2);
  if(marker===192||marker===194){
   if(sof||n<8)return null;const h=v.getUint16(p+3,false),w=v.getUint16(p+5,false),count=b[p+7];
   if(!dimensions(w,h)||b[p+2]!==8||![1,3].includes(count)||n!==8+3*count)return null;
   components=[];for(let i=0;i<count;i++){const q=p+8+i*3,id=b[q],sampling=b[q+1];if(components.includes(id)||!(sampling>>4)||!(sampling&15)||(sampling>>4)>4||(sampling&15)>4||b[q+2]>3)return null;components.push(id);}sof=true;
  }else if(marker>=193&&marker<=207&&![196,200,204].includes(marker))return null;
  else if(marker===219){
   let q=p+2;while(q<p+n){const spec=b[q++],width=spec>>4;if(width>1||(spec&15)>3||q+64*(width+1)>p+n)return null;q+=64*(width+1);}if(q!==p+n||n<67)return null;dqt=true;
  }else if(marker===196){
   let q=p+2;while(q<p+n){if(q+17>p+n)return null;const spec=b[q++];if((spec>>4)>1||(spec&15)>3)return null;let count=0;for(let i=0;i<16;i++)count+=b[q++];if(!count||count>256||q+count>p+n)return null;q+=count;}if(q!==p+n)return null;dht=true;
  }else if(marker===218){
   const count=b[p+2];if(!sof||!dqt||!dht||!count||count>components.length||n!==6+2*count)return null;
   const selected=new Set();for(let i=0;i<count;i++){const id=b[p+3+i*2],tables=b[p+4+i*2];if(!components.includes(id)||selected.has(id)||(tables>>4)>3||(tables&15)>3)return null;selected.add(id);}
   sos=true;p+=n;const entropyStart=p;
   while(p<stop){if(b[p]!==255){entropy++;p++;continue;}let q=p+1;while(q<stop&&b[q]===255)q++;if(q>=stop){spend(q-entropyStart);return null;}if(b[q]===0){entropy++;p=q+1;continue;}if(b[q]>=208&&b[q]<=215){p=q+1;continue;}break;}
   spend(p-entropyStart);
   continue;
  }else if(marker===221&&n!==4)return null;
  else if(!(marker>=224&&marker<=239)&&![254,196,219,221,218,192,194].includes(marker))return null;
  p+=n;
 }
 return null;
}
export function carveDiskImage(bytes){
 if(!(bytes instanceof Uint8Array)||bytes.length>MAX_IMAGE_BYTES)throw new Error('Disk images must be at most 64 MiB of bytes.');
 const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),results=[];
 let budget=MAX_IMAGE_BYTES*3,attempts=0;
 const spend=n=>{budget-=n;if(budget<0)throw new Error('Image validation work limit reached; use a smaller disk-image slice.');};
 const attempt=()=>{if(++attempts>4096)throw new Error('Too many candidate signatures; use a smaller disk-image slice.');};
 for(let p=0;p<bytes.length-1&&results.length<32;p++){
  let result=null,format;
  if(bytes[p]===137&&p+8<=bytes.length&&[80,78,71,13,10,26,10].every((n,i)=>bytes[p+1+i]===n)){format='PNG';attempt();result=png(bytes,p,v,spend);}
  else if(bytes[p]===66&&bytes[p+1]===77){format='BMP';attempt();result=bmp(bytes,p,v,spend);}
  else if(bytes[p]===255&&bytes[p+1]===216){format='JPEG';attempt();result=jpeg(bytes,p,v,spend);}
  if(result){results.push({name:`carved-${p.toString(16).padStart(8,'0')}.${format==='JPEG'?'jpg':format.toLowerCase()}`,offset:p,bytes:bytes.slice(p,result.end),format,warnings:['Contiguous file candidate only. Original filename, deletion state and filesystem ownership are unknown.',...result.warnings]});p=result.end-1;}
 }
 return results;
}
