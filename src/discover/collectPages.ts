import { globby } from "globby";
import { relative, resolve } from "node:path";
import type { Framework, PageEntry } from "../types.js";

const APP_PAGE_GLOBS = ["**/page.{js,jsx,ts,tsx}"];
const APP_SPECIAL_GLOBS = [
  "**/layout.{js,jsx,ts,tsx}",
  "**/template.{js,jsx,ts,tsx}",
  "**/error.{js,jsx,ts,tsx}",
  "**/global-error.{js,jsx,ts,tsx}",
  "**/not-found.{js,jsx,ts,tsx}",
  "**/loading.{js,jsx,ts,tsx}",
  "**/default.{js,jsx,ts,tsx}",
];
const APP_EXCLUDE = ["**/route.{js,ts}"];
const PAGES_ROUTER_GLOBS = ["**/*.{js,jsx,ts,tsx}"];
const PAGES_ROUTER_EXCLUDE = [
  "_app.{js,jsx,ts,tsx}",
  "_document.{js,jsx,ts,tsx}",
  "_error.{js,jsx,ts,tsx}",
  "api/**",
];

function routeFromAppFile(relFromAppDir: string): string {
  // dashboard/(group)/page.tsx → /dashboard
  // page.tsx → /
  const trimmed = relFromAppDir
    .replace(/\\/g, "/")
    .replace(/(^|\/)page\.[jt]sx?$/, "");
  const cleaned = trimmed
    .split("/")
    .filter((seg) => seg !== "")
    .filter((seg) => !/^\(.+\)$/.test(seg)) // route groups
    .filter((seg) => !/^@/.test(seg)) // parallel routes
    .join("/");
  return cleaned === "" ? "/" : "/" + cleaned;
}

function routeFromPagesFile(relFromPagesDir: string): string {
  const trimmed = relFromPagesDir.replace(/\\/g, "/").replace(/\.[jt]sx?$/, "");
  return trimmed === "index" ? "/" : "/" + trimmed.replace(/\/index$/, "");
}

export async function collectPages(
  rootDir: string,
  framework: Framework,
  appDir: string | null,
  pagesDir: string | null,
): Promise<{ pages: PageEntry[]; roots: string[] }> {
  const pages: PageEntry[] = [];
  const roots: string[] = [];

  if ((framework === "next-app" || framework === "next-mixed") && appDir) {
    const appFiles = await globby(APP_PAGE_GLOBS, {
      cwd: appDir,
      absolute: true,
      ignore: APP_EXCLUDE,
    });
    for (const file of appFiles) {
      const absFile = resolve(file);
      const relFromApp = relative(appDir, absFile);
      const relFromRoot = relative(rootDir, absFile);
      pages.push({
        id: relFromRoot,
        file: absFile,
        route: routeFromAppFile(relFromApp),
        framework: "next-app",
        isSpecialFile: false,
      });
      roots.push(absFile);
    }
    const specialFiles = await globby(APP_SPECIAL_GLOBS, {
      cwd: appDir,
      absolute: true,
      ignore: APP_EXCLUDE,
    });
    for (const file of specialFiles) roots.push(resolve(file));
  }

  if (
    (framework === "next-pages" || framework === "next-mixed") &&
    pagesDir
  ) {
    const pageFiles = await globby(PAGES_ROUTER_GLOBS, {
      cwd: pagesDir,
      absolute: true,
      ignore: PAGES_ROUTER_EXCLUDE,
    });
    for (const file of pageFiles) {
      const absFile = resolve(file);
      const relFromPages = relative(pagesDir, absFile);
      const relFromRoot = relative(rootDir, absFile);
      pages.push({
        id: relFromRoot,
        file: absFile,
        route: routeFromPagesFile(relFromPages),
        framework: "next-pages",
        isSpecialFile: false,
      });
      roots.push(absFile);
    }
  }

  return { pages, roots };
}
