import test from "node:test";
import assert from "node:assert/strict";
import { modernFile } from "../lib/recovery.js";
test("recovered CSV neutralizes executable spreadsheet formulas but retains plain numeric data", async () => {
  const file = await modernFile(
    {
      kind: "table",
      table: {
        columns: ["cell"],
        rows: [["=1+1"], [" @SUM(A1)"], ["+cmd"], ["-3"], ["ordinary"]],
      },
    },
    "a.dbf",
  );
  const csv = new TextDecoder().decode(file.bytes);
  assert.match(csv, /"'=1\+1"/);
  assert.match(csv, /"' @SUM\(A1\)"/);
  assert.match(csv, /"'\+cmd"/);
  assert.match(csv, /"-3"/);
  assert.match(csv, /"ordinary"/);
});
test("terminal UTF-8 export removes nonprinting CSI codes without losing the readable text", async () => {
  const file = await modernFile(
    { kind: "terminal", text: "\x1b[32mHELLO\x1b[0m\nWORLD" },
    "n.ans",
  );
  assert.equal(new TextDecoder().decode(file.bytes), "HELLO\nWORLD");
});
