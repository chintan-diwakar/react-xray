import { expect, test } from "vitest";
import { computeUnused } from "../../src/analyze/computeUnused.js";
import type { ComponentDef, JSXUsage, ImportEdge } from "../../src/types.js";

const def = (id: string, file: string, name: string, isPage = false): ComponentDef => ({
  id, name, file,
  location: { file, line: 1, column: 0 },
  startLine: 1, endLine: 10,
  detectedBy: "function", exportKind: "named", isPage,
});

test("strictly-unused excludes pages", () => {
  const defs: ComponentDef[] = [
    def("/p/PageA#A", "/p/PageA.tsx", "A", true),  // never rendered, but is a page
    def("/p/Old#Old", "/p/Old.tsx", "Old"),         // never rendered, not a page
  ];
  const usages: JSXUsage[] = [];
  const reachable = new Set<string>(["/p/PageA.tsx"]);
  const importMaps = new Map<string, ImportEdge[]>();
  const r = computeUnused({ defs, usages, reachable, importMaps });
  expect(r.strictlyUnused.map((c) => c.name)).toEqual(["Old"]);
});

test("unreachable catches orphan subtrees", () => {
  const defs: ComponentDef[] = [
    def("/p/Page#P", "/p/Page.tsx", "P", true),
    def("/p/OrphanA#A", "/p/OrphanA.tsx", "A"),
    def("/p/OrphanB#B", "/p/OrphanB.tsx", "B"),
  ];
  // OrphanA renders OrphanB; both never reached from Page
  const usages: JSXUsage[] = [
    { file: "/p/OrphanA.tsx", location: { file: "/p/OrphanA.tsx", line: 2, column: 0 }, identifier: "B" },
  ];
  const reachable = new Set<string>(["/p/Page.tsx"]);
  const r = computeUnused({ defs, usages, reachable, importMaps: new Map() });
  expect(r.unreachable.map((c) => c.name).sort()).toEqual(["A", "B"]);
  // OrphanB is "used" by OrphanA so NOT strictly unused
  expect(r.strictlyUnused.map((c) => c.name)).toEqual(["A"]);
});

test("entries carry reasons[]", () => {
  const defs: ComponentDef[] = [def("/p/Old#Old", "/p/Old.tsx", "Old")];
  const r = computeUnused({
    defs,
    usages: [],
    reachable: new Set(),
    importMaps: new Map(),
  });
  expect(r.strictlyUnused[0]?.reasons).toContain("no JSX usage in project");
});
