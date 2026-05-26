import type { ResolvedTarget } from "../resolve/resolveImport.js";

export type ResolvedEdge = { fromFile: string; target: ResolvedTarget };

export type Graph = {
  outgoing: Map<string, Set<string>>;
  outgoingExternal: Map<string, Set<string>>;
};

export function buildGraph(edges: ResolvedEdge[]): Graph {
  const outgoing = new Map<string, Set<string>>();
  const outgoingExternal = new Map<string, Set<string>>();
  for (const { fromFile, target } of edges) {
    if (target.kind === "internal") {
      let set = outgoing.get(fromFile);
      if (!set) outgoing.set(fromFile, (set = new Set()));
      set.add(target.path);
    } else if (target.kind === "external") {
      let set = outgoingExternal.get(fromFile);
      if (!set) outgoingExternal.set(fromFile, (set = new Set()));
      set.add(target.package);
    }
  }
  return { outgoing, outgoingExternal };
}
