import { expect, test } from "vitest";
import { renderTerminal } from "../../src/report/terminal.js";
import type { ScanResult } from "../../src/types.js";

const r: ScanResult = {
  meta: { version: "0.0.1", scannedAt: "2026-05-26T00:00:00Z", rootDir: "/p", framework: "next-app", durationMs: 780, fileCount: 412 },
  pages: new Array(34).fill(0).map((_, i) => ({ id: `${i}`, file: `${i}`, route: `/p${i}`, framework: "next-app" as const, isSpecialFile: false })),
  components: new Array(148).fill(0).map((_, i) => ({
    id: `c${i}`, name: `C${i}`, file: `${i}`,
    location: { file: `${i}`, line: 1, column: 0 },
    loc: 10, blank: 1, comment: 0,
    isPage: false, isExternal: false as const, exportKind: "named" as const, detectedBy: "function" as const,
  })),
  externals: [], matrix: [],
  unused: { strictlyUnused: new Array(27).fill(0).map((_, i) => ({ id: `u${i}`, name: `U${i}`, file: `u${i}`, loc: 10, reasons: ["no JSX usage in project"] })), unreachable: [] },
  stats: {
    totalLOC: 34345, totalBlankLOC: 0, totalCommentLOC: 2997,
    byLanguage: {
      ts: { files: 98, lines: 8421, code: 7102, blank: 0, comment: 812 },
      tsx: { files: 287, lines: 24812, code: 21034, blank: 0, comment: 2103 },
      js: { files: 27, lines: 1112, code: 998, blank: 0, comment: 82 },
      jsx: { files: 0, lines: 0, code: 0, blank: 0, comment: 0 },
    },
    perComponent: [],
  },
  warnings: [],
};

test("includes summary line and component counts", () => {
  const out = renderTerminal(r, { noColor: true });
  expect(out).toMatch(/react-xray v0\.0\.1/);
  expect(out).toMatch(/next-app/);
  expect(out).toMatch(/Components\s+148/);
  expect(out).toMatch(/Pages\s+34/);
  expect(out).toMatch(/unused 27/);
});

test("shows up to 3 top unused entries", () => {
  const out = renderTerminal(r, { noColor: true });
  expect(out).toMatch(/U0/);
  expect(out).toMatch(/24 more/);
});
