"use client";
import { useEffect, useRef } from "react";
const palette = [
  "#152526",
  "#cc7359",
  "#87b89c",
  "#dfc174",
  "#769ab1",
  "#b28eaa",
  "#72b9b9",
  "#e9e6dc",
  "#74847b",
  "#ff8e6a",
  "#b5db9c",
  "#ffe0a1",
  "#a9c4ed",
  "#ddaccd",
  "#a0e3d5",
  "#ffffff",
];
function Terminal({ text }) {
  let color = 7,
    bold = false;
  const parts = text.split(/(\x1b\[[0-9;]*[a-zA-Z])/g),
    nodes = [];
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (p.startsWith("\x1b[")) {
      if (p.endsWith("m"))
        for (const v of p.slice(2, -1).split(";").map(Number)) {
          if (v === 0) {
            color = 7;
            bold = false;
          } else if (v === 1) bold = true;
          else if (v >= 30 && v <= 37) color = v - 30;
          else if (v >= 90 && v <= 97) color = v - 90 + 8;
        }
      continue;
    }
    nodes.push(
      <span
        key={i}
        style={{
          color: palette[Math.min(15, color + (bold && color < 8 ? 8 : 0))],
        }}
      >
        {p}
      </span>,
    );
  }
  return <pre className="ansi-art">{nodes}</pre>;
}
export default function ArtifactView({ result, modern }) {
  const ref = useRef(null);
  useEffect(() => {
    if (result?.kind === "image" && ref.current) {
      const { width, height, rgba } = result.image;
      const c = ref.current;
      c.width = width;
      c.height = height;
      c.getContext("2d").putImageData(
        new ImageData(new Uint8ClampedArray(rgba), width, height),
        0,
        0,
      );
    }
  }, [result]);
  if (!result) return null;
  if (result.kind === "image")
    return (
      <div className="image-stage">
        <div className="image-corner corner-tl" />
        <div className="image-corner corner-tr" />
        <div className="image-corner corner-bl" />
        <div className="image-corner corner-br" />
        <canvas
          ref={ref}
          className={modern ? "modern-pixels" : "legacy-pixels"}
          aria-label={`Decoded ${result.format} image`}
        />
        <div className="image-stage-footer">
          <span>DECODED FROM ORIGINAL PIXEL DATA</span>
          <span>
            {result.image.width} × {result.image.height}
          </span>
        </div>
      </div>
    );
  if (result.kind === "table")
    return (
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th className="row-number">#</th>
              {result.table.columns.map((c, i) => (
                <th key={i}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.table.rows.map((row, i) => (
              <tr key={i}>
                <td className="row-number">{String(i + 1).padStart(2, "0")}</td>
                {row.map((v, j) => (
                  <td key={j}>{v}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="table-footer">
          {result.table.rows.length} records decoded • original field order
          preserved
        </div>
      </div>
    );
  if (result.kind === "terminal")
    return (
      <div className="terminal-stage">
        <div className="terminal-top">
          <i />
          <span>MIRA-BBS / ARCHIVED TRANSMISSION</span>
          <span>CP437</span>
        </div>
        <Terminal text={result.text || ""} />
        <span className="terminal-cursor">▌</span>
      </div>
    );
  return (
    <article className={"document-stage " + (!modern ? "document-legacy" : "")}>
      <div className="document-heading">
        <span>FROM THE ARCHIVE</span>
        <span>TRANSCRIBED / LOCAL</span>
      </div>
      <div className="document-text">{result.text}</div>
      <div className="document-seal">
        M
        <span>
          ARCHIVE 001
          <br />
          MIRA OBSERVATORY
        </span>
      </div>
    </article>
  );
}
