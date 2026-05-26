import { expect, test } from "vitest";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import { collectPages } from "../../src/discover/collectPages.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const f = (name: string) => resolve(__dirname, "../fixtures/discover", name);

test("collects app router pages and special files separately", async () => {
  const root = f("next-app");
  const { pages, roots } = await collectPages(
    root,
    "next-app",
    join(root, "app"),
    null,
  );
  const pageFiles = pages.map((p) => p.file.replace(root + "/", "")).sort();
  const rootFiles = roots.map((p) => p.replace(root + "/", "")).sort();

  expect(pageFiles).toEqual(["app/dashboard/page.tsx", "app/page.tsx"]);
  // Special files are roots-for-reachability but not in pages
  expect(rootFiles).toContain("app/dashboard/layout.tsx");
  expect(rootFiles).toContain("app/not-found.tsx");
  // route.ts is excluded entirely
  expect(rootFiles.some((r) => r.endsWith("route.ts"))).toBe(false);
  expect(pageFiles.some((r) => r.endsWith("route.ts"))).toBe(false);
});

test("collects pages-router pages, excluding _app and _document", async () => {
  const root = f("next-pages");
  const { pages } = await collectPages(
    root,
    "next-pages",
    null,
    join(root, "pages"),
  );
  expect(pages.map((p) => p.file).every((file) => !file.includes("_app"))).toBe(true);
  expect(pages.map((p) => p.file).every((file) => !file.includes("/api/"))).toBe(true);
});

test("collects both routers for next-mixed", async () => {
  const root = f("next-mixed");
  const { pages } = await collectPages(
    root,
    "next-mixed",
    join(root, "app"),
    join(root, "pages"),
  );
  const routes = pages.map((p) => p.route).sort();
  expect(routes).toEqual(["/", "/legacy"]);
});

test("collects app router pages from src/app layout", async () => {
  const root = f("next-app-src");
  const { pages } = await collectPages(
    root,
    "next-app",
    join(root, "src", "app"),
    null,
  );
  const routes = pages.map((p) => p.route).sort();
  expect(routes).toEqual(["/"]);
  expect(pages[0]?.file).toBe(join(root, "src", "app", "page.tsx"));
});

test("collects pages-router pages from src/pages layout", async () => {
  const root = f("next-pages-src");
  const { pages } = await collectPages(
    root,
    "next-pages",
    null,
    join(root, "src", "pages"),
  );
  const routes = pages.map((p) => p.route).sort();
  expect(routes).toEqual(["/"]);
});
