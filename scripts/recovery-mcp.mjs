import readline from 'node:readline';
import {FORMAT_CONTRACTS} from '../lib/format-contracts.mjs';
import {runProof} from '../lib/proof.mjs';
const tools=[{name:'format_contract',description:'Read the implemented Last Save format subsets and hard limits before extending a decoder. No user file access.',inputSchema:{type:'object',properties:{format:{type:'string',enum:Object.keys(FORMAT_CONTRACTS)}},additionalProperties:false}},{name:'reconstruction_proof',description:'Run a bounded synthetic eight-block parity reconstruction or refusal using the actual core. Returns hashes, no user bytes.',inputSchema:{type:'object',properties:{blocks:{type:'array',items:{type:'integer',minimum:0,maximum:7},maxItems:8},missingTail:{type:'boolean'}},additionalProperties:false}}];
const respond=value=>process.stdout.write(JSON.stringify(value)+'\n');
async function dispatch(request){
 if(!request||request.jsonrpc!=='2.0')throw {code:-32600,message:'Invalid JSON-RPC request'};
 if(request.id===undefined)return;
 const {method,params={}}=request;
 if(method==='initialize')return {protocolVersion:'2024-11-05',capabilities:{tools:{}},serverInfo:{name:'last-save-evidence',version:'1.0.0'}};
 if(method==='ping')return {};
 if(method==='tools/list')return {tools};
 if(method!=='tools/call')throw {code:-32601,message:'Method not found'};
 const args=params.arguments||{};
 try{
  let value;
  if(params.name==='format_contract'){
   if(Object.keys(args).some(k=>k!=='format')||args.format!==undefined&&!Object.hasOwn(FORMAT_CONTRACTS,args.format))throw Error('Choose an implemented format.');
   value=args.format?FORMAT_CONTRACTS[args.format]:FORMAT_CONTRACTS;
  }else if(params.name==='reconstruction_proof'){
   if(Object.keys(args).some(k=>!['blocks','missingTail'].includes(k))||args.missingTail!==undefined&&typeof args.missingTail!=='boolean'||args.blocks!==undefined&&(!Array.isArray(args.blocks)||args.blocks.length>8||args.blocks.some(n=>!Number.isInteger(n)||n<0||n>7)))throw Error('Expected at most eight block indices 0–7 and a boolean missingTail.');
   const r=await runProof(args.blocks??[3],args.missingTail??false);
   value={fixture:'Synthetic generated BMP only',status:r.status,originalSha256:r.originalHash,damagedSha256:r.damagedHash,repairedSha256:r.repairedHash??null,repairedBlocks:r.repairedBlocks??[],refusal:r.reason??null};
  }else throw Error('Unknown tool');
  return {content:[{type:'text',text:JSON.stringify(value)}]};
 }catch(error){return {isError:true,content:[{type:'text',text:error.message}]}}
}
const lines=readline.createInterface({input:process.stdin,crlfDelay:Infinity});
let queue=Promise.resolve();
lines.on('line',line=>{queue=queue.then(async()=>{let request;try{if(line.length>4096)throw {code:-32600,message:'Request exceeds 4 KiB limit'};try{request=JSON.parse(line)}catch{throw {code:-32700,message:'Invalid JSON'}};const result=await dispatch(request);if(request.id!==undefined)respond({jsonrpc:'2.0',id:request.id,result})}catch(e){respond({jsonrpc:'2.0',id:request?.id??null,error:{code:e.code??-32603,message:e.message}})}})});
