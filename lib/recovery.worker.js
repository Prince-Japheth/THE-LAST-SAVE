import {decodeArtifact} from './decoders.mjs';
import {openArchive} from './archive.mjs';
import {createParityCapsule,repairWithCapsule} from './parity.mjs';
import {carveDiskImage} from './carve.mjs';
import {nativeImageDimensions} from './image-dimensions.mjs';
async function decode(bytes,name){
 if(bytes.length>8*1024*1024)throw Error('File exceeds the 8 MiB decoding limit.');
 const raster=nativeImageDimensions(bytes);
 if(!raster)return decodeArtifact(bytes,name);
 if(typeof createImageBitmap!=='function'||typeof OffscreenCanvas!=='function')throw Error('This browser cannot decode PNG/JPEG in its recovery worker. Use a current Chromium or Safari version.');
 const bitmap=await createImageBitmap(new Blob([bytes],{type:raster.format==='PNG'?'image/png':'image/jpeg'}));
 try{if(bitmap.width*bitmap.height>4*1024*1024)throw Error('Raster exceeds the pixel limit.');const canvas=new OffscreenCanvas(bitmap.width,bitmap.height);const context=canvas.getContext('2d');context.drawImage(bitmap,0,0);return {kind:'image',format:raster.format,title:name.replace(/\.[^.]+$/,''),era:raster.format==='PNG'?'1996 onward':'1992 onward',description:'Pixels decoded from the supplied image bytes by the browser image decoder.',metadata:[{label:'Dimensions',value:`${bitmap.width} × ${bitmap.height}`}],warnings:['Metadata, animation and original compression are not preserved in PNG exports.'],image:{width:bitmap.width,height:bitmap.height,rgba:context.getImageData(0,0,bitmap.width,bitmap.height).data}}}finally{bitmap.close()}
}
self.onmessage=async({data})=>{try{const bytes=new Uint8Array(data.bytes);let result;switch(data.operation){case'archive':result=openArchive(bytes,data.name);break;case'capsule':result=await createParityCapsule(bytes,data.name);break;case'repair':result=await repairWithCapsule(bytes,data.capsule);break;case'carve':result=carveDiskImage(bytes);break;default:result=await decode(bytes,data.name)}self.postMessage({result})}catch(error){self.postMessage({error:error.message||'Recovery failed.'})}};
