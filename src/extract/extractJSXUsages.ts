import type { JSXUsage } from "../types.js";
import { walk, isPascalCase, startLine, startColumn } from "./astHelpers.js";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Node = any;

function readMember(node: Node): { root: string; path: string[] } | null {
  // JSXMemberExpression: { object: JSXIdentifier|JSXMemberExpression, property: JSXIdentifier }
  const path: string[] = [];
  let cur: Node = node;
  while (cur?.type === "JSXMemberExpression") {
    path.unshift(cur.property.name);
    cur = cur.object;
  }
  if (cur?.type === "JSXIdentifier") {
    path.unshift(cur.name);
    return { root: cur.name, path };
  }
  return null;
}

export function extractJSXUsages(file: string, ast: Node): JSXUsage[] {
  const out: JSXUsage[] = [];
  const lineStarts: number[] = (ast && ast.__lineStarts) || [0];

  walk(ast, (n) => {
    if (n.type !== "JSXOpeningElement") return;

    const tag = n.name;
    if (tag.type === "JSXIdentifier") {
      if (!isPascalCase(tag.name)) return;
      out.push({
        file,
        location: { file, line: startLine(n, lineStarts), column: startColumn(n, lineStarts) },
        identifier: tag.name,
      });
    } else if (tag.type === "JSXMemberExpression") {
      const member = readMember(tag);
      if (!member) return;
      if (!isPascalCase(member.root)) return;
      out.push({
        file,
        location: { file, line: startLine(n, lineStarts), column: startColumn(n, lineStarts) },
        identifier: member.root,
        memberPath: member.path,
      });
    }

    // Polymorphic `as` prop
    for (const attr of n.attributes ?? []) {
      if (
        attr.type === "JSXAttribute" &&
        attr.name?.name === "as" &&
        attr.value?.type === "JSXExpressionContainer" &&
        attr.value.expression?.type === "Identifier" &&
        isPascalCase(attr.value.expression.name)
      ) {
        out.push({
          file,
          location: { file, line: startLine(n, lineStarts), column: startColumn(n, lineStarts) },
          identifier: tag.type === "JSXIdentifier" ? tag.name : "<unknown>",
          polymorphicTarget: attr.value.expression.name,
        });
      }
    }
  });

  return out;
}
