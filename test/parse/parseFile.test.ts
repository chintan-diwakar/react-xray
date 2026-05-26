import { expect, test } from "vitest";
import { parseFile } from "../../src/parse/parseFile.js";

test("parses a TSX file and returns an AST with type === 'Program'", async () => {
  const code = `
    import React from "react";
    export function Foo() { return <div>hi</div>; }
  `;
  const ast = await parseFile("foo.tsx", code);
  expect(ast.type).toBe("Program");
  expect(ast.body.length).toBeGreaterThan(0);
});

test("parses a JS file without JSX", async () => {
  const ast = await parseFile("foo.js", "export const x = 1;");
  expect(ast.type).toBe("Program");
});

test("emits parse-error for invalid syntax", async () => {
  await expect(parseFile("bad.tsx", "const x = ;")).rejects.toThrow();
});
