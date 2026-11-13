import { Unzip, UnzipInflate } from "fflate";
export const MAX_FILE_BYTES = 8 * 1024 * 1024;
export const MAX_TOTAL_BYTES = 16 * 1024 * 1024;
const reject = (message) => {
  throw new Error(message);
};
const crcTable = Uint32Array.from({ length: 256 }, (_, n) => {
  for (let k = 0; k < 8; k++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
  return n >>> 0;
});
export function openArchive(bytes, name) {
  if (!(bytes instanceof Uint8Array)) reject("Expected upload bytes.");
  if (bytes.length > MAX_FILE_BYTES) reject("Keep each upload under 8 MiB.");
  if (!/\.zip$/i.test(name)) return [{ name, bytes }];
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const need = (p, n) => {
    if (!Number.isSafeInteger(p) || p < 0 || n < 0 || p + n > bytes.length)
      reject("Truncated ZIP header or payload.");
  };
  const u16 = (p) => {
    need(p, 2);
    return v.getUint16(p, true);
  };
  const u32 = (p) => {
    need(p, 4);
    return v.getUint32(p, true);
  };
  let end = -1;
  for (let p = bytes.length - 22; p >= Math.max(0, bytes.length - 65557); p--) {
    if (u32(p) === 0x06054b50 && p + 22 + u16(p + 20) === bytes.length) {
      end = p;
      break;
    }
  }
  if (end < 0) reject("Invalid ZIP end-of-directory record.");
  if (u16(end + 4) || u16(end + 6) || u16(end + 8) !== u16(end + 10))
    reject("Multi-disk ZIP archives are unsupported.");
  const count = u16(end + 10),
    centralSize = u32(end + 12),
    centralStart = u32(end + 16);
  if (
    count === 65535 ||
    centralSize === 0xffffffff ||
    centralStart === 0xffffffff
  )
    reject("ZIP64 archives are unsupported.");
  if (count > 32) reject("This archive contains more than 32 files.");
  if (centralStart + centralSize !== end)
    reject("Invalid ZIP central directory bounds.");
  const records = [],
    basenames = new Set();
  let p = centralStart,
    total = 0,
    localEnd = 0;
  for (let i = 0; i < count; i++) {
    need(p, 46);
    if (u32(p) !== 0x02014b50) reject("Invalid ZIP central header.");
    const flags = u16(p + 8),
      method = u16(p + 10),
      crc = u32(p + 16),
      compressed = u32(p + 20),
      size = u32(p + 24),
      nl = u16(p + 28),
      el = u16(p + 30),
      cl = u16(p + 32),
      local = u32(p + 42);
    if (flags & ~0x800)
      reject("Encrypted ZIP files and data descriptors are unsupported.");
    if (![0, 8].includes(method)) reject("Unsupported ZIP compression method.");
    if (u16(p + 34) || [compressed, size, local].includes(0xffffffff))
      reject("ZIP64 and multi-disk archives are unsupported.");
    need(p + 46, nl + el + cl);
    const raw = bytes.subarray(p + 46, p + 46 + nl);
    let path;
    try {
      path =
        flags & 0x800
          ? new TextDecoder("utf-8", { fatal: true }).decode(raw)
          : Array.from(raw, (c) => String.fromCharCode(c)).join("");
    } catch {
      reject("Invalid ZIP filename encoding.");
    }
    if (
      !path ||
      /[\x00-\x1f\x7f]/.test(path) ||
      /(^\/|(^|\/)\.\.(\/|$)|\\|^[A-Za-z]:)/.test(path)
    )
      reject("Unsafe archive path.");
    const directory = path.endsWith("/"),
      base = path.split("/").at(-1);
    if (!directory) {
      if (basenames.has(base.toLowerCase()))
        reject("Duplicate archive basename collision.");
      basenames.add(base.toLowerCase());
    }
    if (size > MAX_FILE_BYTES || (total += size) > MAX_TOTAL_BYTES)
      reject("Expanded archive exceeds the 16 MiB limit.");
    need(local, 30);
    if (local !== localEnd || u32(local) !== 0x04034b50)
      reject("Invalid or overlapping ZIP local header.");
    const lnl = u16(local + 26),
      lel = u16(local + 28),
      start = local + 30 + lnl + lel;
    need(local + 30, lnl + lel);
    need(start, compressed);
    if (
      start + compressed > centralStart ||
      u16(local + 6) !== flags ||
      u16(local + 8) !== method ||
      u32(local + 14) !== crc ||
      u32(local + 18) !== compressed ||
      u32(local + 22) !== size ||
      lnl !== nl ||
      raw.some((x, k) => x !== bytes[local + 30 + k])
    )
      reject("ZIP local and central header size/CRC mismatch.");
    if ((method === 0 && size !== compressed) || (directory && size !== 0))
      reject("ZIP stored size mismatch.");
    for (const [extra, length] of [
      [p + 46 + nl, el],
      [local + 30 + lnl, lel],
    ]) {
      let q = extra;
      while (q < extra + length) {
        if (q + 4 > extra + length) reject("Invalid ZIP extra header.");
        const id = u16(q),
          n = u16(q + 2);
        q += 4;
        if (q + n > extra + length) reject("Invalid ZIP extra field length.");
        if (id === 1) reject("ZIP64 archives are unsupported.");
        q += n;
      }
    }
    records.push({
      path,
      name: base,
      size,
      crc,
      directory,
      parts: [],
      actual: 0,
      checksum: 0xffffffff,
      done: false,
    });
    localEnd = start + compressed;
    p += 46 + nl + el + cl;
  }
  if (p !== end || localEnd !== centralStart)
    reject("Invalid ZIP directory or unreferenced local data.");
  let seen = 0,
    actualTotal = 0;
  const unzip = new Unzip((file) => {
    const r = records[seen++];
    if (!r || file.name !== r.path) reject("ZIP stream/header mismatch.");
    file.ondata = (error, data, final) => {
      if (error) throw error;
      r.actual += data.length;
      actualTotal += data.length;
      if (
        r.actual > r.size ||
        r.actual > MAX_FILE_BYTES ||
        actualTotal > MAX_TOTAL_BYTES
      )
        reject("ZIP expanded size exceeds declared size or recovery limits.");
      for (let j = 0; j < data.length; j++)
        r.checksum =
          crcTable[(r.checksum ^ data[j]) & 255] ^ (r.checksum >>> 8);
      r.parts.push(data.slice());
      if (final) {
        if (r.actual !== r.size) reject("ZIP expanded size mismatch.");
        if ((r.checksum ^ 0xffffffff) >>> 0 !== r.crc)
          reject("ZIP CRC mismatch: damaged or forged archive.");
        r.done = true;
      }
    };
    file.start();
  });
  unzip.register(UnzipInflate);
  // A small compressed input chunk bounds each inflater emission even for forged sizes.
  for (let q = 0; q < bytes.length; q += 256)
    unzip.push(
      bytes.subarray(q, Math.min(q + 256, bytes.length)),
      q + 256 >= bytes.length,
    );
  if (seen !== records.length || records.some((r) => !r.done))
    reject("Truncated ZIP stream.");
  return records
    .filter(
      (r) =>
        !r.directory &&
        !r.path.startsWith("__MACOSX/") &&
        r.name !== ".DS_Store",
    )
    .map((r) => {
      const data = new Uint8Array(r.actual);
      let offset = 0;
      for (const part of r.parts) {
        data.set(part, offset);
        offset += part.length;
      }
      return { name: r.name, bytes: data };
    });
}
