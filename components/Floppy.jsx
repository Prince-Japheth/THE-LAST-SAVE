"use client";
import { useState } from "react";
export default function Floppy({ busy, onInsert }) {
  const [angle, setAngle] = useState({ x: -9, y: -20 });
  return (
    <div
      className={"floppy-scene " + (busy ? "is-reading" : "")}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setAngle({
          x: -9 - (e.clientY - r.top - r.height / 2) / 30,
          y: -20 + (e.clientX - r.left - r.width / 2) / 30,
        });
      }}
      onPointerLeave={() => setAngle({ x: -9, y: -20 })}
    >
      <div className="orbital orbital-one" />
      <div className="orbital orbital-two" />
      <div className="disk-shadow" />
      <button
        className="floppy"
        aria-label="Insert the MIRA demonstration disk"
        onClick={onInsert}
        disabled={busy}
        style={{
          transform: `rotateX(${angle.x}deg) rotateY(${angle.y}deg) rotateZ(-9deg)`,
        }}
      >
        <div className="floppy-rib rib-one" />
        <div className="floppy-rib rib-two" />
        <div className="shutter">
          <div className="shutter-cutout" />
          <span>3.5″ • HIGH DENSITY</span>
        </div>
        <div className="disk-label">
          <div className="label-stripe">MIRA OBSERVATORY</div>
          <div className="label-handwriting">
            Don't let us
            <br />
            disappear.
          </div>
          <div className="label-rule" />
          <div className="label-footer">
            <span>BACKUP_07</span>
            <span>31 OCT 1996</span>
          </div>
        </div>
        <div className="disk-grip" />
        <div className="disk-screw screw-a" />
        <div className="disk-screw screw-b" />
        <div className="protect-tab" />
        <div className="disk-edge">ARCHIVE / 001</div>
      </button>

      <div className="coordinate coordinate-one">35° 41′ 22″ N</div>
      <div className="coordinate coordinate-two">[ OBJECT 001 ]</div>
    </div>
  );
}
