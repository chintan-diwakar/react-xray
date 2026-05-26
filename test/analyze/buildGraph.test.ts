import { expect, test } from "vitest";
import { buildGraph } from "../../src/analyze/buildGraph.js";

test("builds adjacency list from resolved edges", () => {
  const g = buildGraph([
    { fromFile: "/p/a.tsx", target: { kind: "internal", path: "/p/b.tsx" } },
    { fromFile: "/p/a.tsx", target: { kind: "internal", path: "/p/c.tsx" } },
    { fromFile: "/p/b.tsx", target: { kind: "external", package: "react" } },
  ]);
  expect(g.outgoing.get("/p/a.tsx")).toEqual(new Set(["/p/b.tsx", "/p/c.tsx"]));
  expect(g.outgoingExternal.get("/p/b.tsx")).toEqual(new Set(["react"]));
});
