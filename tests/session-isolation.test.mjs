import test from 'node:test';import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import {saveSession,loadSession,clearSession} from '../lib/session-store.js';
const session=name=>({schemaVersion:1,artifacts:[{id:'one',name,source:'local',bytes:new Uint8Array([1,2,3])}]});
test('Preservation Desk persists independently and archive clearing does not remove it',async()=>{await saveSession(session('archive.txt'));await saveSession(session('desk.txt'),'preservation-desk');assert.equal((await loadSession()).artifacts[0].name,'archive.txt');assert.equal((await loadSession('preservation-desk')).artifacts[0].name,'desk.txt');await clearSession();assert.equal(await loadSession(),null);assert.equal((await loadSession('preservation-desk')).artifacts[0].name,'desk.txt')});
