import { expect, test } from "vitest";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { collectPages } from "../../src/discover/collectPages.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const f = (name: string) => resolve(__dirname, "../fixtures/discover", name);

test("collects app router pages and special files separately", async () => {
  const { pages, roots } = await collectPages(f("next-app"), "next-app");
  const pageFiles = pages.map((p) => p.file.replace(f("next-app") + "/", "")).sort();
  const rootFiles = roots.map((p) => p.replace(f("next-app") + "/", "")).sort();

  expect(pageFiles).toEqual(["app/dashboard/page.tsx", "app/page.tsx"]);
  // Special files are roots-for-reachability but not in pages
  expect(rootFiles).toContain("app/dashboard/layout.tsx");
  expect(rootFiles).toContain("app/not-found.tsx");
  // route.ts is excluded entirely
  expect(rootFiles.some((r) => r.endsWith("route.ts"))).toBe(false);
  expect(pageFiles.some((r) => r.endsWith("route.ts"))).toBe(false);
});

test("collects pages-router pages, excluding _app and _document", async () => {
  const { pages } = await collectPages(f("next-pages"), "next-pages");
  expect(pages.map((p) => p.file).every((file) => !file.includes("_app"))).toBe(true);
  expect(pages.map((p) => p.file).every((file) => !file.includes("/api/"))).toBe(true);
});

test("collects both routers for next-mixed", async () => {
  const { pages } = await collectPages(f("next-mixed"), "next-mixed");
  const routes = pages.map((p) => p.route).sort();
  expect(routes).toEqual(["/", "/legacy"]);
});
