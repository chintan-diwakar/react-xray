import { expect, test } from "vitest";
import { aggregateStats } from "../../src/analyze/aggregateStats.js";

test("aggregates per-file LOC counts by language", () => {
  const r = aggregateStats(new Map([
    ["/p/a.ts", { lines: 10, code: 7, blank: 2, comment: 1 }],
    ["/p/b.tsx", { lines: 20, code: 16, blank: 3, comment: 1 }],
    ["/p/c.jsx", { lines: 5, code: 4, blank: 0, comment: 1 }],
  ]));
  expect(r.byLanguage.ts.files).toBe(1);
  expect(r.byLanguage.tsx.files).toBe(1);
  expect(r.byLanguage.jsx.files).toBe(1);
  expect(r.totalLOC).toBe(35);
  expect(r.totalCommentLOC).toBe(3);
});
