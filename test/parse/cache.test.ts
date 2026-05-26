import { expect, test } from "vitest";
import { createCache } from "../../src/parse/cache.js";

test("returns the same AST instance for identical content", async () => {
  const cache = createCache();
  const code = "export const x = 1;";
  const a = await cache.getOrParse("foo.ts", code);
  const b = await cache.getOrParse("foo.ts", code);
  expect(b).toBe(a);
});

test("re-parses when content changes", async () => {
  const cache = createCache();
  const a = await cache.getOrParse("foo.ts", "export const x = 1;");
  const b = await cache.getOrParse("foo.ts", "export const x = 2;");
  expect(b).not.toBe(a);
});
