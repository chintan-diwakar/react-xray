import type { ComponentDef, ComponentRef, ImportEdge, JSXUsage } from "../types.js";

export type ComputeUnusedInput = {
  defs: ComponentDef[];
  usages: JSXUsage[];
  reachable: Set<string>;
  importMaps: Map<string, ImportEdge[]>;
};

export type ComputeUnusedOutput = {
  strictlyUnused: ComponentRef[];
  unreachable: ComponentRef[];
};

function toRef(d: ComponentDef, reasons: string[]): ComponentRef {
  return {
    id: d.id,
    name: d.name,
    file: d.file,
    loc: Math.max(1, d.endLine - d.startLine + 1),
    reasons,
  };
}

export function computeUnused(input: ComputeUnusedInput): ComputeUnusedOutput {
  const { defs, usages, reachable } = input;

  // Index usage identifiers by file for cheap lookup; for v0 we treat any matching name as a usage.
  // The matrix layer (Task 6.5) will refine with per-file resolution.
  const usedNames = new Set<string>();
  for (const u of usages) {
    usedNames.add(u.identifier);
    if (u.memberPath) usedNames.add(u.memberPath[u.memberPath.length - 1]!);
    if (u.polymorphicTarget) usedNames.add(u.polymorphicTarget);
  }

  const strictlyUnused: ComponentRef[] = [];
  const unreachable: ComponentRef[] = [];

  for (const d of defs) {
    if (!d.isPage && !usedNames.has(d.name)) {
      strictlyUnused.push(
        toRef(d, ["no JSX usage in project"]),
      );
    }
    if (!d.isPage && !reachable.has(d.file)) {
      const reasons: string[] = ["file not reached by BFS from any page"];
      if (!usedNames.has(d.name)) reasons.push("no JSX usage in project");
      unreachable.push(toRef(d, reasons));
    }
  }

  return { strictlyUnused, unreachable };
}
