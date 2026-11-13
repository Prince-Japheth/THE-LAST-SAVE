import { zipSync, strToU8 } from "fflate";
export { openArchive, MAX_FILE_BYTES, MAX_TOTAL_BYTES } from "./archive.mjs";
export async function hashBytes(bytes) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("");
}
function runWorker(operation, artifact) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./recovery.worker.js", import.meta.url));
    const timer = setTimeout(() => {
      worker.terminate();
      reject(Error("The reader exceeded its 10-second time limit."));
    }, 10000);
    const finish = () => {
      clearTimeout(timer);
      worker.terminate();
    };
    worker.onmessage = ({ data }) => {
      finish();
      data.error ? reject(Error(data.error)) : resolve(data.result);
    };
    worker.onerror = () => {
      finish();
      reject(Error("The recovery worker could not read this artifact."));
    };
    try {
      const copy = artifact.bytes.slice();
      worker.postMessage(
        { operation, name: artifact.name, bytes: copy.buffer },
        [copy.buffer],
      );
    } catch (error) {
      finish();
      reject(error);
    }
  });
}
export const decodeInWorker = (artifact) => runWorker("decode", artifact);
export const openArchiveInWorker = (bytes, name) =>
  runWorker("archive", { bytes, name });
function csvCell(value) {
  const original = String(value);
  const numeric = /^[+-]?\d+(?:\.\d+)?$/.test(original.trim());
  const safe =
    !numeric && /^[\u0000-\u0020]*[=+\-@]/.test(original)
      ? "'" + original
      : original;
  return '"' + safe.replaceAll('"', '""') + '"';
}
export function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function modernFile(result, name) {
  const stem = name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_");
  if (result.kind === "image") {
    const c = document.createElement("canvas");
    c.width = result.image.width;
    c.height = result.image.height;
    c.getContext("2d").putImageData(
      new ImageData(
        new Uint8ClampedArray(result.image.rgba),
        c.width,
        c.height,
      ),
      0,
      0,
    );
    const b = await new Promise((resolve, reject) =>
      c.toBlob(
        (b) => (b ? resolve(b) : reject(Error("PNG export failed."))),
        "image/png",
      ),
    );
    return {
      name: stem + ".png",
      bytes: new Uint8Array(await b.arrayBuffer()),
      type: "image/png",
    };
  }
  if (result.kind === "table") {
    const csv = [result.table.columns, ...result.table.rows]
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n");
    return {
      name: stem + ".csv",
      bytes: strToU8("\ufeff" + csv),
      type: "text/csv;charset=utf-8",
    };
  }
  return {
    name: stem + ".txt",
    bytes: strToU8(
      result.kind === "terminal"
        ? (result.text || "").replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, "")
        : result.text || "",
    ),
    type: "text/plain;charset=utf-8",
  };
}
export async function buildRecoveryBundle(artifacts, known, onProgress) {
  const zip = {},
    records = [];
  for (let i = 0; i < artifacts.length; i++) {
    const a = artifacts[i];
    onProgress?.(i + 1, artifacts.length);
    let result = known[a.id],
      error = null;
    try {
      result ??= await decodeInWorker(a);
    } catch (e) {
      error = e.message;
    }
    const sha256 = await hashBytes(a.bytes);
    const safe = a.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
    zip[`originals/${String(i + 1).padStart(2, "0")}-${safe}`] = a.bytes;
    if (result) {
      const file = await modernFile(result, a.name);
      zip[`recovered/${String(i + 1).padStart(2, "0")}-${file.name}`] =
        file.bytes;
    }
    records.push({
      original: a.name,
      ...(a.provenance ? {provenance:a.provenance} : {}),
      sha256,
      bytes: a.bytes.length,
      status: result ? "decoded" : "not decoded",
      format: result?.format,
      warnings: [
        ...(result?.warnings || []),
        ...(result?.kind === "table"
          ? [
              "CSV formula-like cells are prefixed with an apostrophe for spreadsheet safety. Originals preserve exact source data.",
            ]
          : result?.kind === "terminal"
            ? [
                "Terminal CSI control sequences are omitted from the modern text export; the original file retains them.",
              ]
            : []),
      ],
      error,
    });
  }
  const report = {
    application: "THE LAST SAVE",
    version: "0.1.0",
    createdAt: new Date().toISOString(),
    processing: "Entirely in this browser. Originals retained byte-for-byte.",
    fictionalDemo: artifacts.every((a) => a.source === "demo"),
    artifacts: records,
  };
  zip["recovery-manifest.json"] = strToU8(JSON.stringify(report, null, 2));
  zip["READ-ME.txt"] = strToU8(
    "THE LAST SAVE\nImported bytes are unmodified. Derived parity reconstructions and carved candidates are identified by provenance in the manifest. Modern exports convert the imported or reconstructed bytes. Consult recovery-manifest.json for format limitations and warnings.\n",
  );
  return new Blob([zipSync(zip, { level: 6 })], { type: "application/zip" });
}
export function formatSize(bytes) {
  return bytes >= 1024 * 1024
    ? (bytes / 1024 / 1024).toFixed(1) + " MiB"
    : bytes >= 1024
      ? (bytes / 1024).toFixed(1) + " KB"
      : bytes + " bytes";
}
export function hexDump(bytes) {
  const lines = [];
  for (let i = 0; i < Math.min(bytes.length, 1024); i += 16) {
    const row = bytes.slice(i, i + 16);
    lines.push(
      i.toString(16).padStart(6, "0") +
        "   " +
        [...row]
          .map((n) => n.toString(16).padStart(2, "0"))
          .join(" ")
          .padEnd(47, " ") +
        "   " +
        [...row]
          .map((n) => (n >= 32 && n < 127 ? String.fromCharCode(n) : "."))
          .join(""),
    );
  }
  return lines.join("\n");
}
