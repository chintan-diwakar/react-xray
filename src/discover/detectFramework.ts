import { access } from "node:fs/promises";
import { join } from "node:path";
import type { Framework } from "../types.js";

const exists = async (p: string) => {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
};

const NEXT_CONFIG_CANDIDATES = [
  "next.config.js",
  "next.config.mjs",
  "next.config.cjs",
  "next.config.ts",
];

export type FrameworkDetection = {
  framework: Framework;
  appDir: string | null;
  pagesDir: string | null;
};

export async function detectFramework(
  rootDir: string,
): Promise<FrameworkDetection> {
  const hasNextConfig = (
    await Promise.all(
      NEXT_CONFIG_CANDIDATES.map((c) => exists(join(rootDir, c))),
    )
  ).some(Boolean);
  if (!hasNextConfig) {
    return { framework: "unknown", appDir: null, pagesDir: null };
  }

  // Prefer root layout; fall back to src/ layout.
  const rootApp = join(rootDir, "app");
  const srcApp = join(rootDir, "src", "app");
  const rootPages = join(rootDir, "pages");
  const srcPages = join(rootDir, "src", "pages");

  const [hasRootApp, hasSrcApp, hasRootPages, hasSrcPages] = await Promise.all([
    exists(rootApp),
    exists(srcApp),
    exists(rootPages),
    exists(srcPages),
  ]);

  const appDir = hasRootApp ? rootApp : hasSrcApp ? srcApp : null;
  const pagesDir = hasRootPages ? rootPages : hasSrcPages ? srcPages : null;

  if (appDir && pagesDir) {
    return { framework: "next-mixed", appDir, pagesDir };
  }
  if (appDir) return { framework: "next-app", appDir, pagesDir: null };
  if (pagesDir) return { framework: "next-pages", appDir: null, pagesDir };
  return { framework: "unknown", appDir: null, pagesDir: null };
}
