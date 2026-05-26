import { readFile, access } from "node:fs/promises";
import { join } from "node:path";
import type { Config } from "./types.js";

const DEFAULTS: Config = {
  rootDir: process.cwd(),
  components: {
    include: ["**/*.{ts,tsx,js,jsx}"],
    exclude: [
      "**/*.{test,spec,stories}.{ts,tsx,js,jsx}",
      "**/__tests__/**",
    ],
  },
  externalPackages: "all",
  tsconfig: "./tsconfig.json",
};

const exists = async (p: string) => {
  try { await access(p); return true; } catch { return false; }
};

export async function loadConfig(
  rootDir: string,
  overrides: Partial<Config>,
): Promise<Config> {
  const configPath = join(rootDir, "react-xray.config.json");
  let fileConfig: Partial<Config> = {};
  if (await exists(configPath)) {
    fileConfig = JSON.parse(await readFile(configPath, "utf-8"));
  }
  return {
    ...DEFAULTS,
    ...fileConfig,
    ...overrides,
    rootDir,
    components: {
      ...DEFAULTS.components,
      ...(fileConfig.components ?? {}),
      ...(overrides.components ?? {}),
    },
  };
}
