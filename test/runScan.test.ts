import { expect, test } from "vitest";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { runScan } from "../src/runScan.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "fixtures/e2e/next-app");

test("e2e: detects framework, components, and per-page matrix", async () => {
  const r = await runScan({ rootDir: root });
  expect(r.meta.framework).toBe("next-app");
  expect(r.components.map((c) => c.name).sort()).toEqual(
    ["DashboardCard", "Header", "Logo", "OldHeader", "OldLogo"].sort(),
  );
  const routes = r.matrix.map((m) => m.pageRoute).sort();
  expect(routes).toEqual(["/", "/dashboard"]);
});

test("e2e: detects orphan subtree (OldHeader → OldLogo) as unreachable", async () => {
  const r = await runScan({ rootDir: root });
  const names = r.unused.unreachable.map((u) => u.name).sort();
  expect(names).toEqual(["OldHeader", "OldLogo"]);
});

test("e2e: OldHeader is strictly unused but OldLogo is not (rendered by OldHeader)", async () => {
  const r = await runScan({ rootDir: root });
  const strict = r.unused.strictlyUnused.map((u) => u.name).sort();
  expect(strict).toEqual(["OldHeader"]);
});
