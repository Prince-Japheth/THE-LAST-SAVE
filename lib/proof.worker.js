import {runProof} from './proof.mjs';
self.onmessage=async({data})=>{try{self.postMessage({result:await runProof(data.blocks,data.missing)})}catch(e){self.postMessage({error:e.message})}};
