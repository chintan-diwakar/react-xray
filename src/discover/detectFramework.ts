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

export async function detectFramework(rootDir: string): Promise<Framework> {
  const hasNextConfig = (
    await Promise.all(
      NEXT_CONFIG_CANDIDATES.map((c) => exists(join(rootDir, c))),
    )
  ).some(Boolean);
  if (!hasNextConfig) return "unknown";

  const hasApp = await exists(join(rootDir, "app"));
  const hasPages = await exists(join(rootDir, "pages"));

  if (hasApp && hasPages) return "next-mixed";
  if (hasApp) return "next-app";
  if (hasPages) return "next-pages";
  return "unknown";
}
