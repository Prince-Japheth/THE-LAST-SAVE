import test from 'node:test';
import assert from 'node:assert/strict';
import {makeProofImage,damageProof,runProof} from '../lib/proof.mjs';
test('synthetic BMP is eight blocks and damage leaves original immutable',()=>{const original=makeProofImage(),copy=original.slice();assert.equal(original.length,32768);const damaged=damageProof(original,[2]);assert.deepEqual(original,copy);assert.notDeepEqual(damaged,original);assert.throws(()=>damageProof(original,[8]),/block/)});
test('every selectable block reconstructs exactly, with matching output SHA',async()=>{for(let i=0;i<8;i++){const r=await runProof([i]);assert.equal(r.status,'verified');assert.equal(r.originalHash,r.repairedHash);assert.notEqual(r.originalHash,r.damagedHash);assert.deepEqual(r.repaired,r.original);assert.deepEqual(r.repairedBlocks,[i])}});
test('two same-stripe corrupt blocks return a refusal and no repaired output',async()=>{const r=await runProof([2,5]);assert.equal(r.status,'refused');assert.match(r.reason,/only one/);assert.equal(r.repaired,undefined)});
test('missing final block is reconstructed using earlier parity',async()=>{const r=await runProof([7],true);assert.equal(r.status,'verified');assert.equal(r.damaged.length,7*4096);assert.deepEqual(r.repaired,r.original)});
