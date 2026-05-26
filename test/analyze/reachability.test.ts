import { expect, test } from "vitest";
import { buildGraph } from "../../src/analyze/buildGraph.js";
import { reachabilityFrom } from "../../src/analyze/reachability.js";

test("BFS collects reachable files", () => {
  const g = buildGraph([
    { fromFile: "/p/page.tsx", target: { kind: "internal", path: "/p/Header.tsx" } },
    { fromFile: "/p/Header.tsx", target: { kind: "internal", path: "/p/Logo.tsx" } },
    { fromFile: "/p/Orphan.tsx", target: { kind: "internal", path: "/p/OldDep.tsx" } },
  ]);
  const reachable = reachabilityFrom(g, ["/p/page.tsx"]);
  expect([...reachable].sort()).toEqual(["/p/Header.tsx", "/p/Logo.tsx", "/p/page.tsx"]);
});

test("BFS handles cycles", () => {
  const g = buildGraph([
    { fromFile: "/a.tsx", target: { kind: "internal", path: "/b.tsx" } },
    { fromFile: "/b.tsx", target: { kind: "internal", path: "/a.tsx" } },
  ]);
  expect([...reachabilityFrom(g, ["/a.tsx"])].sort()).toEqual(["/a.tsx", "/b.tsx"]);
});
