import { expect, test } from "vitest";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadConfig } from "../src/config.js";

async function withTmp(fn: (dir: string) => Promise<void>) {
  const dir = await mkdtemp(join(tmpdir(), "rx-"));
  try { await fn(dir); } finally { await rm(dir, { recursive: true }); }
}

test("returns defaults when no config file exists", async () => {
  await withTmp(async (dir) => {
    const cfg = await loadConfig(dir, {});
    expect(cfg.components.include.length).toBeGreaterThan(0);
    expect(cfg.externalPackages).toBe("all");
  });
});

test("merges file config over defaults", async () => {
  await withTmp(async (dir) => {
    await writeFile(join(dir, "react-xray.config.json"), JSON.stringify({
      components: { include: ["src/**/*.tsx"], exclude: ["**/*.test.*"] },
      externalPackages: ["@nextui-org/react"],
    }));
    const cfg = await loadConfig(dir, {});
    expect(cfg.components.include).toEqual(["src/**/*.tsx"]);
    expect(cfg.externalPackages).toEqual(["@nextui-org/react"]);
  });
});

test("CLI overrides win over file config", async () => {
  await withTmp(async (dir) => {
    await writeFile(join(dir, "react-xray.config.json"), JSON.stringify({
      components: { include: ["src/**/*.tsx"], exclude: [] },
    }));
    const cfg = await loadConfig(dir, { tsconfig: "./custom-tsconfig.json" });
    expect(cfg.tsconfig).toBe("./custom-tsconfig.json");
  });
});
