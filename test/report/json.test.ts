import { expect, test } from "vitest";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { renderJSON } from "../../src/report/json.js";
import type { ScanResult } from "../../src/types.js";

const empty: ScanResult = {
  meta: { version: "0.0.1", scannedAt: "x", rootDir: "/p", framework: "next-app", durationMs: 0, fileCount: 0 },
  pages: [], components: [], externals: [], matrix: [],
  unused: { strictlyUnused: [], unreachable: [] },
  stats: {
    totalLOC: 0, totalBlankLOC: 0, totalCommentLOC: 0,
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

test("writes JSON to disk and roundtrips", async () => {
  const dir = await mkdtemp(join(tmpdir(), "rx-"));
  const path = join(dir, "out.json");
  await renderJSON(empty, path);
  const back = JSON.parse(await readFile(path, "utf-8"));
  expect(back.meta.framework).toBe("next-app");
  await rm(dir, { recursive: true });
});
