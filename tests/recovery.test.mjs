import test from "node:test";
import assert from "node:assert/strict";
import { zipSync, strToU8 } from "fflate";
import { modernFile } from "../lib/recovery.js";
import {
  openArchive,
  MAX_FILE_BYTES,
  MAX_TOTAL_BYTES,
} from "../lib/archive.mjs";
const zip = (entries) =>
  zipSync(
    Object.fromEntries(
      Object.entries(entries).map(([k, v]) => [
        k,
        typeof v === "string" ? strToU8(v) : v,
      ]),
    ),
    { level: 6 },
  );
test("archives return actual bytes, omit metadata and flatten folders", () => {
  const result = openArchive(
    zip({
      "folder/a.txt": "hello",
      "__MACOSX/foo": "meta",
      ".DS_Store": "meta",
    }),
    "demo.zip",
  );
  assert.equal(result.length, 1);
  assert.equal(result[0].name, "a.txt");
  assert.equal(new TextDecoder().decode(result[0].bytes), "hello");
});
test("upload byte limit applies to ZIP and individual files", () => {
  for (const name of ["a.zip", "a.txt"])
    assert.throws(
      () => openArchive(new Uint8Array(MAX_FILE_BYTES + 1), name),
      /8 MiB/,
    );
});
test("archive traversal and absolute paths reject", () => {
  for (const path of [
    "../bad.txt",
    "ok/../../bad.txt",
    "/bad.txt",
    "ok\\bad.txt",
  ])
    assert.throws(() => openArchive(zip({ [path]: "x" }), "a.zip"), /Unsafe/);
});
test("archive count, per-file and total expanded limits reject", () => {
  const entries = Object.fromEntries(
    Array.from({ length: 33 }, (_, i) => [`${i}.txt`, "x"]),
  );
  assert.throws(() => openArchive(zip(entries), "a.zip"), /32 files/);
  assert.throws(
    () =>
      openArchive(
        zip({ "big.txt": new Uint8Array(MAX_FILE_BYTES + 1) }),
        "a.zip",
      ),
    /Expanded/,
  );
  assert.throws(
    () =>
      openArchive(
        zip({
          "a.txt": new Uint8Array(MAX_FILE_BYTES),
          "b.txt": new Uint8Array(MAX_FILE_BYTES),
          "c.txt": new Uint8Array(1),
        }),
        "a.zip",
      ),
    /Expanded/,
  );
  assert.equal(MAX_TOTAL_BYTES, MAX_FILE_BYTES * 2);
});
test("table CSV exports UTF-8 BOM, quote escaping, commas and multiline values", async () => {
  const f = await modernFile(
    {
      kind: "table",
      table: { columns: ["name", "note"], rows: [["Zoë", 'a,"b"\nnext']] },
    },
    "old table.dbf",
  );
  assert.equal(f.name, "old_table.csv");
  assert.equal(f.type, "text/csv;charset=utf-8");
  assert.deepEqual([...f.bytes.slice(0, 3)], [239, 187, 191]);
  assert.equal(
    new TextDecoder().decode(f.bytes),
    '"name","note"\r\n"Zoë","a,""b""\nnext"',
  );
});
test("document export retains text verbatim", async () => {
  const f = await modernFile({ kind: "document", text: "α\ntext" }, "memo.rtf");
  assert.equal(f.name, "memo.txt");
  assert.equal(new TextDecoder().decode(f.bytes), "α\ntext");
});
function corruptCentral(zipBytes, offset, value) {
  const b = zipBytes.slice(),
    v = new DataView(b.buffer);
  for (let i = 0; i < b.length - 46; i++)
    if (v.getUint32(i, true) === 0x02014b50) {
      v.setUint32(i + offset, value, true);
      break;
    }
  return b;
}
test("hostile central size and CRC mismatches never return truncated recovery", () => {
  const b = zip({ "a.txt": "HELLO WORLD" });
  assert.throws(
    () => openArchive(corruptCentral(b, 24, 1), "bad.zip"),
    /size|header/i,
  );
  assert.throws(
    () => openArchive(corruptCentral(b, 16, 0), "bad.zip"),
    /CRC|header/i,
  );
  const c = b.slice(),
    v = new DataView(c.buffer);
  v.setUint32(14, 0, true);
  assert.throws(() => openArchive(c, "bad.zip"), /CRC|header/i);
});
test("flattened basename collisions reject and malformed archives reject", () => {
  assert.throws(
    () => openArchive(zip({ "a/x.txt": "a", "b/x.txt": "b" }), "bad.zip"),
    /duplicate|collision/i,
  );
  assert.throws(
    () => openArchive(new Uint8Array([80, 75, 3, 4]), "bad.zip"),
    /ZIP|Truncated/i,
  );
});
function patchBoth(b, localOffset, centralOffset, value, width = 4) {
  const out = b.slice(),
    v = new DataView(out.buffer);
  const set = (p) =>
    width === 2 ? v.setUint16(p, value, true) : v.setUint32(p, value, true);
  set(localOffset);
  for (let i = 0; i < out.length - 46; i++)
    if (v.getUint32(i, true) === 0x02014b50) {
      set(i + centralOffset);
      break;
    }
  return out;
}
test("streaming output verifies actual CRC and inflated length when both headers are forged", () => {
  const b = zip({ "a.txt": "HELLO WORLD" });
  assert.throws(
    () => openArchive(patchBoth(b, 22, 24, 1), "bad.zip"),
    /expanded size/i,
  );
  assert.throws(
    () => openArchive(patchBoth(b, 14, 16, 0), "bad.zip"),
    /CRC mismatch/i,
  );
  const bomb = zip({ "a.txt": new Uint8Array(MAX_FILE_BYTES) });
  assert.throws(
    () => openArchive(patchBoth(bomb, 22, 24, 1), "bad.zip"),
    /expanded size/i,
  );
});
test("encrypted files, data descriptors, unsupported methods and multidisk reject", () => {
  const b = zip({ "a.txt": "hello" });
  for (const flags of [1, 8])
    assert.throws(
      () => openArchive(patchBoth(b, 6, 8, flags, 2), "bad.zip"),
      /unsupported/i,
    );
  assert.throws(
    () => openArchive(patchBoth(b, 8, 10, 99, 2), "bad.zip"),
    /compression/i,
  );
  const c = b.slice();
  new DataView(c.buffer).setUint16(c.length - 18, 1, true);
  assert.throws(() => openArchive(c, "bad.zip"), /disk/i);
});
