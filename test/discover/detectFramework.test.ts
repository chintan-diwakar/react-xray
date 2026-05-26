import { expect, test } from "vitest";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import { detectFramework } from "../../src/discover/detectFramework.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const f = (name: string) => resolve(__dirname, "../fixtures/discover", name);

test("detects next-app", async () => {
  const det = await detectFramework(f("next-app"));
  expect(det.framework).toBe("next-app");
  expect(det.appDir).toBe(join(f("next-app"), "app"));
  expect(det.pagesDir).toBe(null);
});

test("detects next-pages", async () => {
  const det = await detectFramework(f("next-pages"));
  expect(det.framework).toBe("next-pages");
  expect(det.pagesDir).toBe(join(f("next-pages"), "pages"));
  expect(det.appDir).toBe(null);
});

test("detects next-mixed when both app/ and pages/ exist", async () => {
  const det = await detectFramework(f("next-mixed"));
  expect(det.framework).toBe("next-mixed");
});

test("returns unknown for an empty dir", async () => {
  const det = await detectFramework(f("empty"));
  expect(det.framework).toBe("unknown");
  expect(det.appDir).toBe(null);
  expect(det.pagesDir).toBe(null);
});

test("detects next-app with src/app layout", async () => {
  const det = await detectFramework(f("next-app-src"));
  expect(det.framework).toBe("next-app");
  expect(det.appDir).toBe(join(f("next-app-src"), "src", "app"));
  expect(det.pagesDir).toBe(null);
});

test("detects next-pages with src/pages layout", async () => {
  const det = await detectFramework(f("next-pages-src"));
  expect(det.framework).toBe("next-pages");
  expect(det.pagesDir).toBe(join(f("next-pages-src"), "src", "pages"));
  expect(det.appDir).toBe(null);
});
