import { globby } from "globby";
import { relative } from "node:path";
import type { Framework, PageEntry } from "../types.js";

const APP_PAGE_GLOBS = ["app/**/page.{js,jsx,ts,tsx}"];
const APP_SPECIAL_GLOBS = [
  "app/**/layout.{js,jsx,ts,tsx}",
  "app/**/template.{js,jsx,ts,tsx}",
  "app/**/error.{js,jsx,ts,tsx}",
  "app/**/global-error.{js,jsx,ts,tsx}",
  "app/**/not-found.{js,jsx,ts,tsx}",
  "app/**/loading.{js,jsx,ts,tsx}",
  "app/**/default.{js,jsx,ts,tsx}",
];
const APP_EXCLUDE = ["app/**/route.{js,ts}"];
const PAGES_ROUTER_GLOBS = ["pages/**/*.{js,jsx,ts,tsx}"];
const PAGES_ROUTER_EXCLUDE = [
  "pages/_app.{js,jsx,ts,tsx}",
  "pages/_document.{js,jsx,ts,tsx}",
  "pages/_error.{js,jsx,ts,tsx}",
  "pages/api/**",
];

function routeFromAppFile(rel: string): string {
  // app/dashboard/(group)/page.tsx → /dashboard
  // app/page.tsx → /
  const trimmed = rel.replace(/\\/g, "/").replace(/^app\//, "").replace(/(^|\/)page\.[jt]sx?$/, "");
  const cleaned = trimmed
    .split("/")
    .filter((seg) => !/^\(.+\)$/.test(seg)) // route groups
    .filter((seg) => !/^@/.test(seg))       // parallel routes
    .join("/");
  return cleaned === "" ? "/" : "/" + cleaned;
}

function routeFromPagesFile(rel: string): string {
  const trimmed = rel.replace(/\\/g, "/").replace(/^pages\//, "").replace(/\.[jt]sx?$/, "");
  return trimmed === "index" ? "/" : "/" + trimmed.replace(/\/index$/, "");
}

export async function collectPages(
  rootDir: string,
  framework: Framework,
): Promise<{ pages: PageEntry[]; roots: string[] }> {
  const pages: PageEntry[] = [];
  const roots: string[] = [];

  if (framework === "next-app" || framework === "next-mixed") {
    const appFiles = await globby(APP_PAGE_GLOBS, { cwd: rootDir, absolute: true, ignore: APP_EXCLUDE });
    for (const file of appFiles) {
      const rel = relative(rootDir, file);
      pages.push({
        id: rel,
        file,
        route: routeFromAppFile(rel),
        framework: "next-app",
        isSpecialFile: false,
      });
      roots.push(file);
    }
    const specialFiles = await globby(APP_SPECIAL_GLOBS, { cwd: rootDir, absolute: true, ignore: APP_EXCLUDE });
    for (const file of specialFiles) roots.push(file);
  }

  if (framework === "next-pages" || framework === "next-mixed") {
    const pageFiles = await globby(PAGES_ROUTER_GLOBS, {
      cwd: rootDir,
      absolute: true,
      ignore: PAGES_ROUTER_EXCLUDE,
    });
    for (const file of pageFiles) {
      const rel = relative(rootDir, file);
      pages.push({
        id: rel,
        file,
        route: routeFromPagesFile(rel),
        framework: "next-pages",
        isSpecialFile: false,
      });
      roots.push(file);
    }
  }

  return { pages, roots };
}
