import { expect, test } from "vitest";
import { parseFile } from "../../src/parse/parseFile.js";
import { extractImports } from "../../src/extract/extractImports.js";

async function edges(file: string, code: string) {
  const ast = await parseFile(file, code);
  return extractImports(file, ast);
}

test("static named imports", async () => {
  const e = await edges("a.ts", `import { Foo, Bar as Baz } from "./b";`);
  expect(e[0]?.source).toBe("./b");
  expect(e[0]?.isDynamic).toBe(false);
  expect(e[0]?.imported).toEqual([
    { local: "Foo", imported: "Foo" },
    { local: "Baz", imported: "Bar" },
  ]);
});

test("default and namespace imports", async () => {
  const e = await edges("a.ts", `import React, * as RR from "react";`);
  expect(e[0]?.imported).toEqual([
    { local: "React", imported: "default" },
    { local: "RR", imported: "*" },
  ]);
});

test("re-exports", async () => {
  const e = await edges("a.ts", `export { Foo as Bar } from "./foo";`);
  expect(e[0]?.isReExport).toBe(true);
  expect(e[0]?.imported).toEqual([{ local: "Bar", imported: "Foo" }]);
});

test("dynamic import with literal specifier", async () => {
  const e = await edges("a.ts", `const x = import("./b");`);
  expect(e[0]?.isDynamic).toBe(true);
  expect(e[0]?.dynamicSpecifierIsLiteral).toBe(true);
  expect(e[0]?.source).toBe("./b");
});

test("dynamic import with non-literal specifier", async () => {
  const e = await edges("a.ts", `const p = "./b"; const x = import(p);`);
  expect(e[0]?.isDynamic).toBe(true);
  expect(e[0]?.dynamicSpecifierIsLiteral).toBe(false);
});

test("React.lazy(() => import(literal))", async () => {
  const e = await edges("a.ts", `const L = React.lazy(() => import("./b"));`);
  expect(e[0]?.isDynamic).toBe(true);
  expect(e[0]?.dynamicSpecifierIsLiteral).toBe(true);
  expect(e[0]?.source).toBe("./b");
});
