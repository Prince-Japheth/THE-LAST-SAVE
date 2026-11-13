import test from "node:test";
import assert from "node:assert/strict";
import { decodeArtifact as decode } from "../lib/decoders.mjs";
const ascii = (s) => new TextEncoder().encode(s);
function bmp() {
  const b = new Uint8Array(58),
    v = new DataView(b.buffer);
  b.set([66, 77]);
  v.setUint32(10, 54, true);
  v.setUint32(14, 40, true);
  v.setInt32(18, 1, true);
  v.setInt32(22, 1, true);
  v.setUint16(26, 1, true);
  v.setUint16(28, 24, true);
  b.set([3, 2, 1], 54);
  return b;
}
function pcx() {
  const b = new Uint8Array(898),
    v = new DataView(b.buffer);
  b.set([10, 5, 1, 8]);
  b[65] = 1;
  v.setUint16(66, 1, true);
  b[128] = 2;
  b[129] = 12;
  b.set([10, 20, 30], 136);
  return b;
}
function dbf() {
  const b = new Uint8Array(74),
    v = new DataView(b.buffer);
  b[0] = 3;
  v.setUint32(4, 2, true);
  v.setUint16(8, 65, true);
  v.setUint16(10, 4, true);
  b.set(ascii("NAME"), 32);
  b[43] = 67;
  b[48] = 3;
  b[64] = 13;
  b.set(ascii(" abc*def"), 65);
  b[73] = 26;
  return b;
}
test("BMP decodes BGR and rejects truncation and oversized dimensions", () => {
  assert.deepEqual([...decode(bmp(), "a.bmp").image.rgba], [1, 2, 3, 255]);
  assert.throws(() => decode(bmp().slice(0, 57), "a.bmp"), /Truncated/);
  const b = bmp();
  new DataView(b.buffer).setInt32(18, 0x7fffffff, true);
  assert.throws(() => decode(b, "a.bmp"), /dimensions/);
});
test("PCX palette colors and bounded scanline RLE", () => {
  assert.deepEqual([...decode(pcx(), "a.pcx").image.rgba], [10, 20, 30, 255]);
  const b = pcx();
  b[128] = 194;
  assert.throws(() => decode(b, "a.pcx"), /RLE/);
  assert.throws(() => decode(pcx().slice(0, 300), "a.pcx"), /palette/);
});
test("DBF reads original rows and omits deleted records", () => {
  const d = decode(dbf(), "a.dbf");
  assert.deepEqual(d.table, { columns: ["NAME"], rows: [["abc"]] });
  assert.match(d.warnings[0], /1 deleted/);
  const b = dbf();
  new DataView(b.buffer).setUint32(4, 0xffffffff, true);
  assert.throws(() => decode(b, "a.dbf"), /count/);
  assert.throws(() => decode(dbf().slice(0, 70), "a.dbf"), /Truncated/);
});
test("RTF groups, escaped braces, hex, signed Unicode and fallback", () => {
  const d = decode(
    ascii(
      "{\\rtf1{\\fonttbl hidden}Hello \\{x\\} \\'e9 \\uc1\\u-10179?\\u-8704?\\par end}",
    ),
    "a.rtf",
  );
  assert.equal(d.text, "Hello {x} é 😀\nend");
  assert.throws(() => decode(ascii("{\\rtf1 unfinished"), "a.rtf"), /unclosed/);
  assert.throws(() => decode(ascii("{\\rtf1\\bin999 x}"), "a.rtf"), /binary/);
});
test("ANSI preserves escapes and maps CP437, with resource and binary limits", () => {
  assert.equal(
    decode(new Uint8Array([27, 91, 51, 49, 109, 0xda]), "a.ans").text,
    "\x1b[31m┌",
  );
  assert.throws(
    () => decode(new Uint8Array(8 * 1024 * 1024 + 1), "a.txt"),
    /8 MiB/,
  );
  assert.throws(() => decode(new Uint8Array([1, 0]), "a.txt"), /Binary/);
  assert.throws(() => decode(ascii("bad"), "a.exe"), /Unsupported/);
});
test("BMP 8-bit palette and top-down 32-bit pixels", () => {
  const b = new Uint8Array(62),
    v = new DataView(b.buffer);
  b.set([66, 77]);
  v.setUint32(10, 58, true);
  v.setUint32(14, 40, true);
  v.setInt32(18, 1, true);
  v.setInt32(22, -1, true);
  v.setUint16(26, 1, true);
  v.setUint16(28, 8, true);
  v.setUint32(46, 1, true);
  b.set([90, 80, 70, 0], 54);
  assert.deepEqual([...decode(b, "a.bmp").image.rgba], [70, 80, 90, 255]);
  b[58] = 1;
  assert.throws(() => decode(b, "a.bmp"), /palette/);
  const c = bmp();
  new DataView(c.buffer).setUint16(28, 32, true);
  assert.deepEqual([...decode(c, "a.bmp").image.rgba], [1, 2, 3, 255]);
});
test("PCX RGB planes decode and oversized scanline runs reject", () => {
  const b = new Uint8Array(131),
    v = new DataView(b.buffer);
  b.set([10, 5, 1, 8]);
  b[65] = 3;
  v.setUint16(66, 1, true);
  b.set([11, 22, 33], 128);
  assert.deepEqual([...decode(b, "a.pcx").image.rgba], [11, 22, 33, 255]);
  const c = new Uint8Array(130);
  c.set(b.subarray(0, 128));
  c.set([196, 0], 128);
  assert.throws(() => decode(c, "a.pcx"), /exceeds scanline/);
});
