import type { Graph } from "./buildGraph.js";
import type { ComponentId, MatrixRow, PageEntry } from "../types.js";
import { reachabilityFrom, reachableExternalPackages } from "./reachability.js";

export type BuildMatrixInput = {
  graph: Graph;
  pages: PageEntry[];
  componentsByFile: Map<string, ComponentId[]>;
  locByFile: Map<string, number>;
  externalInstancesByFile: Map<string, number>;
};

export function buildMatrix(input: BuildMatrixInput): MatrixRow[] {
  const { graph, pages, componentsByFile, locByFile, externalInstancesByFile } = input;
  const rows: MatrixRow[] = [];

  for (const page of pages) {
    const reachable = reachabilityFrom(graph, [page.file]);
    const directFiles = graph.outgoing.get(page.file) ?? new Set<string>();

    const directComponents: ComponentId[] = [];
    for (const f of directFiles) {
      for (const c of componentsByFile.get(f) ?? []) directComponents.push(c);
    }
    const transitiveComponents: ComponentId[] = [];
    for (const f of reachable) {
      for (const c of componentsByFile.get(f) ?? []) transitiveComponents.push(c);
    }

    const externalPackages = [...reachableExternalPackages(graph, reachable)].sort();

    let locReached = 0;
    for (const f of reachable) locReached += locByFile.get(f) ?? 0;

    let externalInstanceCount = 0;
    for (const f of reachable) externalInstanceCount += externalInstancesByFile.get(f) ?? 0;

    rows.push({
      pageId: page.id,
      pageRoute: page.route,
      directComponents,
      transitiveComponents,
      externalPackages,
      externalInstanceCount,
      locReached,
    });
  }

  return rows;
}
