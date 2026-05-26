import { expect, test } from "vitest";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { detectFramework } from "../../src/discover/detectFramework.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const f = (name: string) => resolve(__dirname, "../fixtures/discover", name);

test("detects next-app", async () => {
  expect(await detectFramework(f("next-app"))).toBe("next-app");
});

test("detects next-pages", async () => {
  expect(await detectFramework(f("next-pages"))).toBe("next-pages");
});

test("detects next-mixed when both app/ and pages/ exist", async () => {
  expect(await detectFramework(f("next-mixed"))).toBe("next-mixed");
});

test("returns unknown for an empty dir", async () => {
  expect(await detectFramework(f("empty"))).toBe("unknown");
});
