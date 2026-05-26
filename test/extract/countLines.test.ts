import { expect, test } from "vitest";
import { countLines } from "../../src/extract/countLines.js";

test("counts code, blank, comment lines", () => {
  const code = [
    "// header",
    "import x from 'y';",
    "",
    "/* block",
    "   comment */",
    "export const z = 1;",
  ].join("\n");
  const r = countLines(code);
  expect(r.lines).toBe(6);
  expect(r.blank).toBe(1);
  expect(r.comment).toBe(3);
  expect(r.code).toBe(2);
});
