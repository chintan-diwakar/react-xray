// Generic walker over the oxc AST. We don't have official types so we treat nodes as `any`.
// All node access goes through these helpers to keep the rest of the code legible.
//
// Note: oxc 0.133 does NOT emit `loc` objects — nodes carry only `start`/`end`
// byte offsets. parseFile attaches a `__lineStarts` array to the Program; the
// line/column helpers below take that array as an argument.

/* eslint-disable @typescript-eslint/no-explicit-any */
type Node = any;

export function walk(node: Node, visit: (n: Node, parent: Node | null) => void | "skip") {
  function recur(n: Node, parent: Node | null) {
    if (!n || typeof n !== "object") return;
    if (Array.isArray(n)) {
      for (const c of n) recur(c, parent);
      return;
    }
    if (typeof n.type === "string") {
      const result = visit(n, parent);
      if (result === "skip") return;
    }
    for (const key of Object.keys(n)) {
      if (key === "type" || key === "loc" || key === "start" || key === "end") continue;
      recur(n[key], typeof n.type === "string" ? n : parent);
    }
  }
  recur(node, null);
}

export function isPascalCase(name: string): boolean {
  return /^[A-Z][A-Za-z0-9_]*$/.test(name);
}

export function containsJSX(node: Node): boolean {
  let found = false;
  walk(node, (n) => {
    if (n.type === "JSXElement" || n.type === "JSXFragment") {
      found = true;
      return "skip";
    }
    if (n.type === "CallExpression") {
      const c = n.callee;
      // React.createElement(...)
      if (
        c?.type === "MemberExpression" &&
        c.object?.name === "React" &&
        c.property?.name === "createElement"
      ) {
        found = true;
        return "skip";
      }
    }
  });
  return found;
}

// Binary search for the largest index `i` such that lineStarts[i] <= offset.
// 1-based line number is i + 1.
function lineFromOffset(lineStarts: number[], offset: number): number {
  if (!Number.isFinite(offset) || offset < 0) return 1;
  let lo = 0;
  let hi = lineStarts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >>> 1;
    if (lineStarts[mid]! <= offset) lo = mid;
    else hi = mid - 1;
  }
  return lo + 1;
}

function columnFromOffset(lineStarts: number[], offset: number): number {
  const line = lineFromOffset(lineStarts, offset);
  return Math.max(0, offset - (lineStarts[line - 1] ?? 0));
}

export function startLine(node: Node, lineStarts: number[]): number {
  if (typeof node?.start === "number") return lineFromOffset(lineStarts, node.start);
  return node?.loc?.start?.line ?? 1;
}

export function startColumn(node: Node, lineStarts: number[]): number {
  if (typeof node?.start === "number") return columnFromOffset(lineStarts, node.start);
  return node?.loc?.start?.column ?? 0;
}

export function endLine(node: Node, lineStarts: number[]): number {
  if (typeof node?.end === "number") return lineFromOffset(lineStarts, node.end);
  return node?.loc?.end?.line ?? startLine(node, lineStarts);
}
