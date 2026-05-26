import { expect, test } from "vitest";
import type { ScanResult, ComponentEntry, PageEntry, ExternalUsage, MatrixRow, Warning, ComponentRef } from "../src/types.js";

test("ScanResult shape compiles", () => {
  const result: ScanResult = {
    meta: {
      version: "0.0.1",
      scannedAt: new Date().toISOString(),
      rootDir: "/tmp/example",
      framework: "next-app",
      durationMs: 0,
      fileCount: 0,
    },
    pages: [],
    components: [],
    externals: [],
    matrix: [],
    unused: { strictlyUnused: [], unreachable: [] },
    stats: {
      totalLOC: 0,
      totalBlankLOC: 0,
      totalCommentLOC: 0,
      byLanguage: {
        ts: { files: 0, lines: 0, code: 0, blank: 0, comment: 0 },
        tsx: { files: 0, lines: 0, code: 0, blank: 0, comment: 0 },
        js: { files: 0, lines: 0, code: 0, blank: 0, comment: 0 },
        jsx: { files: 0, lines: 0, code: 0, blank: 0, comment: 0 },
      },
      perComponent: [],
    },
    warnings: [],
  };
  expect(result.meta.framework).toBe("next-app");
});
