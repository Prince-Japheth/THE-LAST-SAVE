/** Browser-local originals and preferences. Decoded images are intentionally never stored. */
const DB_NAME = 'last-save-lab';
const STORE = 'sessions';
const KEY = 'active';
const MAX_FILES = 32;
const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_TOTAL_BYTES = 16 * 1024 * 1024;

function invalid(message) { throw new Error(`Invalid saved session: ${message}`); }

export function normalizeSession(record) {
  if (record === undefined) record = { schemaVersion: 1, artifacts: [] };
  if (!record || typeof record !== 'object' || Array.isArray(record)) invalid('expected a session object.');
  if (record.schemaVersion !== 1) invalid('unsupported schema version.');
  if (!Array.isArray(record.artifacts) || record.artifacts.length > MAX_FILES) invalid('expected at most 32 artifacts.');
  const ids = new Set();
  let total = 0;
  const artifacts = record.artifacts.map((artifact) => {
    if (!artifact || typeof artifact !== 'object') invalid('an artifact is malformed.');
    if (typeof artifact.id !== 'string' || !artifact.id.trim() || artifact.id.length > 256 || ids.has(artifact.id)) invalid('artifact IDs must be nonempty and unique.');
    ids.add(artifact.id);
    if (typeof artifact.name !== 'string' || !artifact.name.trim() || artifact.name.length > 256) invalid('artifact names must contain 1–256 characters.');
    if (artifact.source !== 'local' && artifact.source !== 'demo') invalid('artifact source must be local or demo.');
    if (!(artifact.bytes instanceof Uint8Array)) invalid('artifact bytes must be Uint8Array values.');
    if (artifact.bytes.byteLength > MAX_FILE_BYTES) invalid('an artifact exceeds the 8 MiB limit.');
    total += artifact.bytes.byteLength;
    if (total > MAX_TOTAL_BYTES) invalid('original files exceed the 16 MiB session limit.');
    let bytes;
    try { bytes = new Uint8Array(artifact.bytes); }
    catch { invalid('artifact byte buffer is detached or unreadable.'); }
    let provenance;
    if(artifact.provenance!==undefined){
      const p=artifact.provenance;
      if(!p||!['carved','parity-repair'].includes(p.kind)||typeof p.sourceName!=='string'||p.sourceName.length>256)invalid('invalid recovery provenance.');
      provenance={kind:p.kind,sourceName:p.sourceName};
      if(p.offset!==undefined){if(!Number.isSafeInteger(p.offset)||p.offset<0)invalid('invalid source offset.');provenance.offset=p.offset;}
      for(const key of ['sourceSha256','verifiedSha256'])if(p[key]!==undefined){if(typeof p[key]!=='string'||!/^[a-f0-9]{64}$/.test(p[key]))invalid('invalid provenance digest.');provenance[key]=p[key]}
      if(p.repairedBlocks!==undefined){if(!Array.isArray(p.repairedBlocks)||p.repairedBlocks.length>4096||p.repairedBlocks.some(n=>!Number.isSafeInteger(n)||n<0))invalid('invalid repaired blocks.');provenance.repairedBlocks=[...p.repairedBlocks]}
    }
    return { id: artifact.id, name: artifact.name, source: artifact.source, bytes, ...(provenance?{provenance}:{}) };
  });
  const selectedId = record.selectedId === undefined ? null : record.selectedId;
  if (selectedId !== null && (typeof selectedId !== 'string' || !ids.has(selectedId))) invalid('selected artifact is missing.');
  const tab = record.tab === undefined ? 'recovered' : record.tab;
  if (!['recovered', 'bytes', 'report'].includes(tab)) invalid('unknown active tab.');
  for (const key of ['modern', 'sound']) if (record[key] !== undefined && typeof record[key] !== 'boolean') invalid(`${key} must be boolean.`);
  const updatedAt = record.updatedAt === undefined ? new Date().toISOString() : record.updatedAt;
  if (typeof updatedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(updatedAt) || !Number.isFinite(Date.parse(updatedAt))) invalid('updatedAt must be an ISO UTC timestamp.');
  if (new Date(updatedAt).toISOString().slice(0, 19) !== updatedAt.slice(0, 19)) invalid('updatedAt contains an invalid calendar date.');
  return { schemaVersion: 1, artifacts, selectedId, tab, modern: record.modern ?? false, sound: record.sound ?? true, updatedAt };
}

function storageError(operation, error) {
  if (error?.name === 'QuotaExceededError') return new Error(`Could not ${operation} session: local storage quota exceeded.`, { cause: error });
  return new Error(`Could not ${operation} session: local storage ${error?.message || 'is unavailable.'}`, { cause: error });
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) { reject(new Error('Local session storage is unavailable in this browser.')); return; }
    let request;
    let settled = false;
    try { request = globalThis.indexedDB.open(DB_NAME, 1); }
    catch (error) { reject(storageError('open', error)); return; }
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
    };
    request.onsuccess = () => {
      if (settled) { request.result.close(); return; }
      settled = true;
      resolve(request.result);
    };
    request.onerror = () => { settled = true; reject(storageError('open', request.error)); };
    request.onblocked = () => { settled = true; reject(new Error('Could not open session: local storage is blocked by another tab.')); };
  });
}

async function transact(mode, operation, action) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    let transaction;
    let result;
    try {
      transaction = database.transaction(STORE, mode);
      const request = action(transaction.objectStore(STORE));
      request.onsuccess = () => { result = request.result; };
      // Only transaction completion means a write is durable. A request can succeed before an abort.
      transaction.oncomplete = () => { database.close(); resolve(result); };
      transaction.onabort = () => { database.close(); reject(storageError(operation, transaction.error)); };
      transaction.onerror = () => { /* Let the transaction abort report its final failure. */ };
    } catch (error) {
      try { transaction?.abort(); } catch { /* Transaction may already have ended. */ }
      database.close();
      reject(storageError(operation, error));
    }
  });
}

export async function loadSession(key = KEY) {
  const record = await transact('readonly', 'load', (store) => store.get(key));
  if (record === undefined) return null;
  return normalizeSession(record);
}

export async function saveSession(record, key = KEY) {
  const normalized = normalizeSession(record);
  await transact('readwrite', 'save', (store) => store.put(normalized, key));
  return normalized;
}

export async function clearSession() {
  await transact('readwrite', 'clear', (store) => store.delete(KEY));
}
