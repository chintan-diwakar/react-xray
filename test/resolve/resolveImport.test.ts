import { expect, test } from "vitest";
import { resolve } from "node:path";
import { createResolver } from "../../src/resolve/resolveImport.js";

const root = resolve(__dirname, "../fixtures/resolve");

test("resolves tsconfig path alias to absolute internal file", async () => {
  const r = await createResolver(root);
  const target = await r.resolve(resolve(root, "src/page.tsx"), "@/components/Button");
  expect(target.kind).toBe("internal");
  if (target.kind === "internal") {
    expect(target.path).toMatch(/src\/components\/Button\.tsx$/);
  }
});

test("resolves bare specifier to external package", async () => {
  const r = await createResolver(root);
  const target = await r.resolve(resolve(root, "src/page.tsx"), "lib");
  expect(target.kind).toBe("external");
  if (target.kind === "external") expect(target.package).toBe("lib");
});

test("resolves scoped package", async () => {
  const r = await createResolver(root);
  const target = await r.resolve(resolve(root, "src/page.tsx"), "@scope/pkg");
  // not installed → unresolved
  expect(target.kind).toBe("unresolved");
});
