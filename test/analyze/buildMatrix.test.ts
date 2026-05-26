import { expect, test } from "vitest";
import { buildMatrix } from "../../src/analyze/buildMatrix.js";
import { buildGraph } from "../../src/analyze/buildGraph.js";

test("matrix row has direct + transitive components and external packages", () => {
  const g = buildGraph([
    { fromFile: "/p/page.tsx", target: { kind: "internal", path: "/p/Header.tsx" } },
    { fromFile: "/p/Header.tsx", target: { kind: "internal", path: "/p/Logo.tsx" } },
    { fromFile: "/p/Header.tsx", target: { kind: "external", package: "@nextui-org/react" } },
  ]);
  const rows = buildMatrix({
    graph: g,
    pages: [{ id: "/", file: "/p/page.tsx", route: "/", framework: "next-app", isSpecialFile: false }],
    componentsByFile: new Map([
      ["/p/Header.tsx", ["/p/Header.tsx#Header"]],
      ["/p/Logo.tsx", ["/p/Logo.tsx#Logo"]],
    ]),
    locByFile: new Map([["/p/Header.tsx", 30], ["/p/Logo.tsx", 10], ["/p/page.tsx", 5]]),
    externalInstancesByFile: new Map([["/p/Header.tsx", 2]]),
  });
  const row = rows[0]!;
  expect(row.directComponents).toEqual(["/p/Header.tsx#Header"]);
  expect(row.transitiveComponents.sort()).toEqual(["/p/Header.tsx#Header", "/p/Logo.tsx#Logo"]);
  expect(row.externalPackages).toEqual(["@nextui-org/react"]);
  expect(row.locReached).toBe(45);
  expect(row.externalInstanceCount).toBe(2);
});

test("matrix handles page with no imports", () => {
  const g = buildGraph([]);
  const rows = buildMatrix({
    graph: g,
    pages: [{ id: "/lonely", file: "/p/lonely.tsx", route: "/lonely", framework: "next-app", isSpecialFile: false }],
    componentsByFile: new Map(),
    locByFile: new Map([["/p/lonely.tsx", 8]]),
    externalInstancesByFile: new Map(),
  });
  const row = rows[0]!;
  expect(row.directComponents).toEqual([]);
  expect(row.transitiveComponents).toEqual([]);
  expect(row.externalPackages).toEqual([]);
  expect(row.locReached).toBe(8);
  expect(row.externalInstanceCount).toBe(0);
});
