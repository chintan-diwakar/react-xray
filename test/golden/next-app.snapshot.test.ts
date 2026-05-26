import { expect, test } from "vitest";
import { resolve } from "node:path";
import { runScan } from "../../src/runScan.js";

test("golden: next-app fixture full ScanResult", async () => {
  const result = await runScan({
    rootDir: resolve(__dirname, "../fixtures/e2e/next-app"),
  });
  // Strip volatile fields before snapshot
  const rootDir = result.meta.rootDir;
  const withStableMeta = {
    ...result,
    meta: { ...result.meta, scannedAt: "[ts]", durationMs: 0, rootDir: "[root]" },
  };
  // Normalize every path-containing string (file paths and component ids) by
  // serializing, replacing the absolute rootDir, then parsing back.
  const stable = JSON.parse(
    JSON.stringify(withStableMeta).split(rootDir).join("[root]"),
  );
  // Discovery order is not deterministic across runs (parallel I/O). Sort
  // collections by stable keys so the snapshot is reproducible.
  const byKey =
    <T>(get: (x: T) => string) =>
    (a: T, b: T) =>
      get(a).localeCompare(get(b));
  stable.components.sort(byKey((c: any) => c.id));
  stable.pages.sort(byKey((p: any) => p.id));
  stable.unused.strictlyUnused.sort(byKey((u: any) => u.id));
  stable.unused.unreachable.sort(byKey((u: any) => u.id));
  stable.externals.sort(byKey((e: any) => `${e.package}::${e.name}`));
  stable.matrix.sort(byKey((m: any) => m.pageId));
  stable.stats.perComponent.sort(byKey((p: any) => p.id));
  stable.warnings.sort(
    byKey((w: any) => `${w.kind}::${w.file ?? ""}::${w.message}`),
  );
  for (const row of stable.matrix) {
    row.directComponents.sort();
    row.transitiveComponents.sort();
    row.externalPackages.sort();
  }
  for (const e of stable.externals) {
    e.sites.sort(byKey((s: any) => `${s.file}:${s.line}:${s.column}`));
  }
  expect(stable).toMatchSnapshot();
});
