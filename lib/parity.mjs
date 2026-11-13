/** Exact single-erasure XOR recovery. A capsule must be created before damage. */
export const MAX_PARITY_BYTES = 16 * 1024 * 1024;
const BLOCK = 4096, WIDTH = 8;
const fail = message => { throw new Error(message); };
const digest = async bytes => {
  if (!globalThis.crypto?.subtle) fail('WebCrypto SHA-256 is unavailable in this environment.');
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');
};
const encode = bytes => {
  let s = ''; for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
};
const decode = s => {
  if (typeof s !== 'string' || s.length !== 5464 || !/^[A-Za-z0-9+/]{5462}==$/.test(s)) fail('Invalid parity block base64 or length.');
  let raw; try { raw = atob(s); } catch { fail('Invalid parity block base64.'); }
  const bytes = Uint8Array.from(raw,c=>c.charCodeAt(0));
  if (bytes.length !== BLOCK || encode(bytes) !== s) fail('Parity block must be exactly 4096 bytes with canonical base64.');
  return bytes;
};
const validBytes = bytes => { if (!(bytes instanceof Uint8Array) || bytes.length > MAX_PARITY_BYTES) fail('Expected at most 16 MiB of bytes.'); };
export async function createParityCapsule(bytes, name = 'artifact') {
  validBytes(bytes);
  if (typeof name !== 'string' || !name.length || name.length > 256) fail('Capsule name must contain 1–256 characters.');
  const count = Math.ceil(bytes.length / BLOCK), blockHashes = [], parityBlocks = [];
  for (let stripe = 0; stripe < count; stripe += WIDTH) {
    const parity = new Uint8Array(BLOCK);
    for (let i = stripe; i < Math.min(stripe + WIDTH,count); i++) {
      const part = bytes.subarray(i*BLOCK,Math.min((i+1)*BLOCK,bytes.length));
      blockHashes.push(await digest(part));
      for (let k = 0; k < part.length; k++) parity[k] ^= part[k];
    }
    parityBlocks.push(encode(parity));
  }
  return {version:1,name,originalSize:bytes.length,sha256:await digest(bytes),blockSize:BLOCK,stripeWidth:WIDTH,blockHashes,parityBlocks};
}
function validateCapsule(c) {
  if (!c || typeof c !== 'object' || c.version !== 1 || c.blockSize !== BLOCK || c.stripeWidth !== WIDTH) fail('Unsupported or malformed parity capsule.');
  if (!Number.isSafeInteger(c.originalSize) || c.originalSize < 0 || c.originalSize > MAX_PARITY_BYTES) fail('Invalid capsule size; maximum is 16 MiB.');
  if (typeof c.name !== 'string' || !c.name.length || c.name.length > 256 || !/^[a-f0-9]{64}$/.test(c.sha256)) fail('Invalid capsule name or SHA-256.');
  const count = Math.ceil(c.originalSize/BLOCK);
  if (!Array.isArray(c.blockHashes) || c.blockHashes.length !== count || c.blockHashes.some(h=>typeof h !== 'string' || !/^[a-f0-9]{64}$/.test(h))) fail('Invalid capsule block hash count or values.');
  if (!Array.isArray(c.parityBlocks) || c.parityBlocks.length !== Math.ceil(count/WIDTH)) fail('Invalid capsule parity block count.');
  return c.parityBlocks.map(decode);
}
export async function repairWithCapsule(damaged, capsule) {
  validBytes(damaged);
  const parity = validateCapsule(capsule);
  if (damaged.length > capsule.originalSize) fail('Damaged input is larger than the capsule original size. Insertions cannot be repaired.');
  const result = new Uint8Array(capsule.originalSize); result.set(damaged);
  const repairedBlocks = [], count = capsule.blockHashes.length;
  for (let stripe = 0; stripe < count; stripe += WIDTH) {
    const corrupt = [];
    for (let i = stripe; i < Math.min(stripe+WIDTH,count); i++) {
      const start=i*BLOCK, end=Math.min(start+BLOCK,result.length);
      // Missing tail bytes are damage even if their zero-filled hash accidentally matches.
      if (end > damaged.length || await digest(result.subarray(start,end)) !== capsule.blockHashes[i]) corrupt.push(i);
    }
    if (corrupt.length > 1) fail(`Stripe ${stripe/WIDTH} contains ${corrupt.length} damaged or missing blocks; XOR parity can repair only one.`);
    if (!corrupt.length) continue;
    const bad = corrupt[0], recovered = parity[stripe/WIDTH].slice();
    for (let i = stripe; i < Math.min(stripe+WIDTH,count); i++) if (i !== bad) {
      const part = result.subarray(i*BLOCK,Math.min((i+1)*BLOCK,result.length));
      for (let k=0;k<part.length;k++) recovered[k] ^= part[k];
    }
    const length=Math.min(BLOCK,result.length-bad*BLOCK), part=recovered.subarray(0,length);
    if (await digest(part) !== capsule.blockHashes[bad]) fail(`Parity failed to reconstruct block ${bad}; the capsule may be damaged.`);
    result.set(part,bad*BLOCK); repairedBlocks.push(bad);
  }
  if (await digest(result) !== capsule.sha256) fail('Final SHA-256 verification failed; no recovered file is returned.');
  return {bytes:result,repairedBlocks,warnings:['Recovery is exact only relative to this capsule SHA-256. The capsule is not proof of authorship or authenticity.', ...(repairedBlocks.length ? [] : ['All input blocks were already intact.'])]};
}
