const LIMIT = 8 * 1024 * 1024,
  PIXELS = 4 * 1024 * 1024;
const bad = (message) => {
  throw new Error(message);
};
const CP437 =
  "ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ ";
const dos = (bytes) =>
  Array.from(bytes, (x) =>
    x < 128 ? String.fromCharCode(x) : CP437[x - 128],
  ).join("");
export function decodeArtifact(bytes, filename = "untitled") {
  if (!(bytes instanceof Uint8Array)) bad("Expected file bytes as Uint8Array.");
  if (bytes.length > LIMIT) bad("File exceeds the 8 MiB decoding limit.");
  if (!bytes.length) bad("The file is empty.");
  const b = bytes,
    v = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const need = (p, n) => {
    if (!Number.isSafeInteger(p) || p < 0 || n < 0 || p + n > b.length)
      bad("Truncated file or invalid data offset.");
  };
  const u16 = (p) => {
    need(p, 2);
    return v.getUint16(p, true);
  };
  const u32 = (p) => {
    need(p, 4);
    return v.getUint32(p, true);
  };
  const i32 = (p) => {
    need(p, 4);
    return v.getInt32(p, true);
  };
  const base = (kind, format, era, description) => ({
    kind,
    format,
    title:
      filename
        .split(/[\\/]/)
        .pop()
        .replace(/\.[^.]+$/, "") || filename,
    era,
    description,
    metadata: [
      { label: "Source", value: filename },
      { label: "Bytes", value: String(b.length) },
    ],
    warnings: [],
  });
  const raster = (w, h) => {
    if (w <= 0 || h <= 0 || !Number.isSafeInteger(w * h) || w * h > PIXELS)
      bad("Invalid image dimensions or image exceeds 4 million pixels.");
    return new Uint8ClampedArray(w * h * 4);
  };
  const ext = filename.split(".").pop().toLowerCase();
  if (b[0] === 66 && b[1] === 77) {
    need(0, 54);
    const offset = u32(10),
      dib = u32(14);
    if (dib < 40)
      bad("Unsupported BMP header: BITMAPINFOHEADER or newer required.");
    need(14, dib);
    const w = i32(18),
      signedHeight = i32(22),
      h = Math.abs(signedHeight),
      bits = u16(28);
    if (u16(26) !== 1 || u32(30) !== 0 || ![8, 24, 32].includes(bits))
      bad(
        "Unsupported BMP: only uncompressed 8, 24 and 32 bit images are supported.",
      );
    const rgba = raster(w, h),
      stride = Math.ceil((w * bits) / 32) * 4;
    need(offset, stride * h);
    if (offset < 14 + dib) bad("BMP pixel offset overlaps its header.");
    let colors = 0;
    if (bits === 8) {
      colors = u32(46) || 256;
      if (colors > 256) bad("Invalid BMP palette size.");
      need(14 + dib, colors * 4);
      if (14 + dib + colors * 4 > offset) bad("BMP palette overlaps pixels.");
    }
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const p =
            offset +
            (signedHeight < 0 ? y : h - 1 - y) * stride +
            (x * bits) / 8,
          d = (y * w + x) * 4;
        let q = p;
        if (bits === 8) {
          if (b[p] >= colors)
            bad("BMP pixel references a missing palette entry.");
          q = 14 + dib + b[p] * 4;
        }
        rgba.set([b[q + 2], b[q + 1], b[q], 255], d);
      }
    return {
      ...base(
        "image",
        "BMP",
        "1987 onward",
        "Windows bitmap decoded from its original pixel array.",
      ),
      image: { width: w, height: h, rgba },
    };
  }
  if (b[0] === 10 && ext === "pcx") {
    need(0, 128);
    if (b[2] !== 1 || b[3] !== 8 || ![1, 3].includes(b[65]))
      bad("Unsupported PCX: requires 8-bit RLE with one or three planes.");
    const w = u16(8) - u16(4) + 1,
      h = u16(10) - u16(6) + 1,
      planes = b[65],
      line = u16(66),
      rgba = raster(w, h);
    if (line < w) bad("Invalid PCX scanline size.");
    const end = planes === 1 ? b.length - 769 : b.length;
    if (planes === 1 && (end < 128 || b[end] !== 12))
      bad("Missing PCX 256-color palette trailer.");
    let p = 128;
    const row = new Uint8Array(line * planes);
    for (let y = 0; y < h; y++) {
      let k = 0;
      while (k < row.length) {
        if (p >= end) bad("Truncated PCX RLE scanline.");
        let value = b[p++],
          count = 1;
        if ((value & 192) === 192) {
          count = value & 63;
          if (!count || p >= end) bad("Invalid or truncated PCX RLE run.");
          value = b[p++];
        }
        if (k + count > row.length) bad("PCX RLE run exceeds scanline bounds.");
        row.fill(value, k, k + count);
        k += count;
      }
      for (let x = 0; x < w; x++) {
        const d = (y * w + x) * 4;
        for (let c = 0; c < 3; c++)
          rgba[d + c] =
            planes === 1 ? b[end + 1 + row[x] * 3 + c] : row[c * line + x];
        rgba[d + 3] = 255;
      }
    }
    const result = base(
      "image",
      "PCX",
      "1985 onward",
      "ZSoft Paintbrush RLE image with original palette or RGB planes.",
    );
    if (p !== end)
      result.warnings.push("Unused bytes follow the decoded PCX scanlines.");
    return { ...result, image: { width: w, height: h, rgba } };
  }
  if (ext === "dbf") {
    need(0, 33);
    if (![3, 131].includes(b[0]))
      bad("Unsupported DBF version: dBASE III required.");
    const count = u32(4),
      head = u16(8),
      length = u16(10);
    if (head < 33 || (head - 33) % 32 !== 0 || length < 1)
      bad("Invalid DBF header or record length.");
    need(0, head);
    if (b[head - 1] !== 13) bad("Missing DBF field terminator.");
    if (count > 100000 || count * length > LIMIT)
      bad("DBF record count exceeds bounded decoding limits.");
    need(head, count * length);
    const fields = [];
    let sum = 1;
    for (let p = 32; p < head - 1; p += 32) {
      const name = dos(b.subarray(p, p + 11))
          .split("\0")[0]
          .trim(),
        type = String.fromCharCode(b[p + 11]),
        size = b[p + 16];
      if (!name || !size || !"CNFDL".includes(type))
        bad("Unsupported or invalid DBF field definition.");
      fields.push({ name, type, size });
      sum += size;
    }
    if (sum !== length) bad("DBF field widths do not match record size.");
    const rows = [];
    let deleted = 0;
    for (let n = 0; n < count; n++) {
      let p = head + n * length;
      if (b[p] === 42) {
        deleted++;
        continue;
      }
      if (b[p++] !== 32) bad("Invalid DBF record marker.");
      const row = [];
      for (const field of fields) {
        let text = dos(b.subarray(p, p + field.size)).trim();
        p += field.size;
        if (field.type === "D" && /^\d{8}$/.test(text))
          text = `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6)}`;
        row.push(text);
      }
      rows.push(row);
    }
    const result = base(
      "table",
      "dBASE III",
      "1984 onward",
      "Field descriptors and undeleted records from a dBASE III table.",
    );
    if (deleted) result.warnings.push(`${deleted} deleted record(s) omitted.`);
    result.warnings.push(
      "Text uses CP437; DBF code-page metadata is not reliably available in dBASE III. Memo fields are unsupported.",
    );
    return { ...result, table: { columns: fields.map((f) => f.name), rows } };
  }
  if (ext === "rtf" || dos(b.subarray(0, 5)) === "{\\rtf") {
    const s = new TextDecoder("windows-1252").decode(b);
    if (!s.startsWith("{\\rtf")) bad("Invalid RTF signature.");
    const stack = [];
    let state = { skip: false, uc: 1 },
      output = "",
      fallback = 0;
    const emit = (text) => {
      if (!state.skip) {
        if (fallback) fallback--;
        else output += text;
      }
    };
    for (let p = 0; p < s.length;) {
      let c = s[p++];
      if (c === "{") {
        if (stack.length >= 256) bad("RTF nesting exceeds 256 groups.");
        stack.push({ ...state });
      } else if (c === "}") {
        if (!stack.length) bad("Unbalanced RTF groups.");
        state = stack.pop();
      } else if (c === "\\") {
        if (p >= s.length) bad("Truncated RTF escape.");
        c = s[p++];
        if ("\\{}".includes(c)) {
          emit(c);
          continue;
        }
        if (c === "'") {
          const hex = s.slice(p, p + 2);
          if (!/^[0-9a-f]{2}$/i.test(hex))
            bad("Invalid RTF hexadecimal escape.");
          emit(
            new TextDecoder("windows-1252").decode(
              new Uint8Array([parseInt(hex, 16)]),
            ),
          );
          p += 2;
          continue;
        }
        if (c === "*") {
          state.skip = true;
          continue;
        }
        if (!/[a-z]/i.test(c)) {
          if (c === "~") emit(" ");
          else if (c === "_") emit("‑");
          continue;
        }
        let word = c;
        while (p < s.length && /[a-z]/i.test(s[p])) word += s[p++];
        let number = "";
        if (s[p] === "-") number += s[p++];
        while (p < s.length && /\d/.test(s[p])) number += s[p++];
        if (s[p] === " ") p++;
        const n = Number(number);
        if (
          [
            "fonttbl",
            "colortbl",
            "stylesheet",
            "info",
            "pict",
            "object",
            "header",
            "footer",
            "filetbl",
            "datastore",
            "themedata",
          ].includes(word)
        )
          state.skip = true;
        if (word === "bin") {
          if (!number || !Number.isSafeInteger(n) || n < 0 || n > s.length - p)
            bad("Invalid RTF binary payload length.");
          p += n;
        } else if (word === "uc") {
          if (!number || n < 0 || n > 16)
            bad("Invalid RTF Unicode fallback count.");
          state.uc = n;
        } else if (word === "u") {
          if (!number || n < -32768 || n > 65535)
            bad("Invalid RTF Unicode code unit.");
          if (!state.skip) output += String.fromCharCode(n & 65535);
          fallback = state.uc;
        } else if (word === "par" || word === "line") emit("\n");
        else if (word === "tab") emit("\t");
      } else if (c !== "\r" && c !== "\n") emit(c);
    }
    if (stack.length) bad("Truncated RTF: unclosed group.");
    return {
      ...base(
        "document",
        "RTF",
        "1987 onward",
        "Plain text extracted from Rich Text Format groups and Unicode escapes.",
      ),
      text: output,
      warnings: [
        "Formatting, embedded objects, pictures and document metadata are omitted. Text code page is Windows-1252; complex alternate Unicode destinations are unsupported.",
      ],
    };
  }
  if (["ans", "txt", "asc", "nfo"].includes(ext)) {
    if (b.includes(0)) bad("Binary data is not supported as terminal text.");
    let text;
    try {
      text = new TextDecoder("utf-8", { fatal: true }).decode(b);
    } catch {
      text = dos(b);
    }
    return {
      ...base(
        "terminal",
        ext === "ans" ? "ANSI / CP437" : "Plain text",
        "DOS era onward",
        "Terminal text preserved, including ANSI escape sequences.",
      ),
      text,
    };
  }
  bad(
    "Unsupported file format. Choose PCX, BMP, dBASE III DBF, RTF, ANSI or text.",
  );
}
