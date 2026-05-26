import type { Graph } from "./buildGraph.js";

export function reachabilityFrom(graph: Graph, roots: string[]): Set<string> {
  const visited = new Set<string>();
  const queue: string[] = [];
  for (const r of roots) {
    if (!visited.has(r)) {
      visited.add(r);
      queue.push(r);
    }
  }
  while (queue.length > 0) {
    const cur = queue.shift()!;
    const outs = graph.outgoing.get(cur);
    if (!outs) continue;
    for (const next of outs) {
      if (!visited.has(next)) {
        visited.add(next);
        queue.push(next);
      }
    }
  }
  return visited;
}

export function reachableExternalPackages(graph: Graph, reachable: Set<string>): Set<string> {
  const pkgs = new Set<string>();
  for (const f of reachable) {
    const ext = graph.outgoingExternal.get(f);
    if (!ext) continue;
    for (const p of ext) pkgs.add(p);
  }
  return pkgs;
}
