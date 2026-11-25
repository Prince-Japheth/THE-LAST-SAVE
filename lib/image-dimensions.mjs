const MAX_PIXELS=4*1024*1024;
export function nativeImageDimensions(bytes){
 const b=bytes,v=new DataView(b.buffer,b.byteOffset,b.byteLength);let width,height,format;
 if(b.length>=24&&[137,80,78,71,13,10,26,10].every((n,i)=>b[i]===n)){if(String.fromCharCode(...b.slice(12,16))!=='IHDR')throw Error('PNG lacks its image header.');width=v.getUint32(16);height=v.getUint32(20);format='PNG'}
 else if(b[0]===255&&b[1]===216){format='JPEG';let p=2;while(p<b.length){if(b[p++]!==255)throw Error('Invalid JPEG marker.');while(b[p]===255)p++;const marker=b[p++];if(marker===217||marker===218)break;if(marker===1||(marker>=208&&marker<=215))continue;if(p+2>b.length)throw Error('Truncated JPEG segment.');const length=v.getUint16(p);if(length<2||p+length>b.length)throw Error('Invalid JPEG segment length.');if([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker)){if(length<8)throw Error('Truncated JPEG frame.');height=v.getUint16(p+3);width=v.getUint16(p+5);break}p+=length}if(!width)throw Error('JPEG frame dimensions were not found.')}
 else return null;
 if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||width<1||height<1||width*height>MAX_PIXELS)throw Error('Raster exceeds the 4 million pixel limit.');
 return {format,width,height};
}
