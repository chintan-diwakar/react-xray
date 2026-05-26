import { expect, test } from "vitest";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { collectSources } from "../../src/discover/collectSources.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const f = (name: string) => resolve(__dirname, "../fixtures/discover", name);

test("respects .gitignore and excludes node_modules", async () => {
  const files = await collectSources(f("next-app"), {
    include: ["**/*.{ts,tsx,js,jsx}"],
    exclude: [],
  });
  expect(files.some((p) => p.includes("node_modules"))).toBe(false);
});

test("excludes .d.ts files by default", async () => {
  const files = await collectSources(f("next-app"), {
    include: ["**/*.{ts,tsx,js,jsx}"],
    exclude: [],
  });
  expect(files.some((p) => p.endsWith(".d.ts"))).toBe(false);
});

test("respects user exclude patterns", async () => {
  const files = await collectSources(f("next-app"), {
    include: ["**/*.{ts,tsx,js,jsx}"],
    exclude: ["**/Button.tsx"],
  });
  expect(files.some((p) => p.endsWith("Button.tsx"))).toBe(false);
});
