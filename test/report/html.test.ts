import { expect, test } from "vitest";
import { renderHTML } from "../../src/report/html/index.js";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ScanResult } from "../../src/types.js";

const empty: ScanResult = {
  meta: { version: "0.0.1", scannedAt: "x", rootDir: "/p", framework: "next-app", durationMs: 0, fileCount: 0 },
  pages: [], components: [], externals: [], matrix: [],
  unused: { strictlyUnused: [], unreachable: [] },
  stats: {
    totalLOC: 0, totalBlankLOC: 0, totalCommentLOC: 0,
    byLanguage: { ts: { files: 0, lines: 0, code: 0, blank: 0, comment: 0 }, tsx: { files: 0, lines: 0, code: 0, blank: 0, comment: 0 }, js: { files: 0, lines: 0, code: 0, blank: 0, comment: 0 }, jsx: { files: 0, lines: 0, code: 0, blank: 0, comment: 0 } },
    perComponent: [],
  },
  warnings: [],
};

test("writes a single self-contained HTML file with embedded JSON", async () => {
  const dir = await mkdtemp(join(tmpdir(), "rx-"));
  const path = join(dir, "report.html");
  await renderHTML(empty, path, { splitThresholdBytes: 10 * 1024 * 1024 });
  const html = await readFile(path, "utf-8");
  expect(html).toMatch(/<script type="application\/json" id="data">/);
  expect(html).toMatch(/react-xray/);
  await rm(dir, { recursive: true });
});

test("emits sidecar JSON when payload exceeds threshold", async () => {
  const dir = await mkdtemp(join(tmpdir(), "rx-"));
  const path = join(dir, "report.html");
  await renderHTML(empty, path, { splitThresholdBytes: 10 }); // force split
  const html = await readFile(path, "utf-8");
  expect(html).toMatch(/fetch\(['"]\.\/report-data\.json/);
  await rm(dir, { recursive: true });
});
