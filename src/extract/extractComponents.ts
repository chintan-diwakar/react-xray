import type { ComponentDef } from "../types.js";
import { containsJSX, isPascalCase, startLine, startColumn, endLine } from "./astHelpers.js";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Node = any;

export function extractComponents(file: string, ast: Node): ComponentDef[] {
  const defs: ComponentDef[] = [];
  const lineStarts: number[] = (ast && ast.__lineStarts) || [0];

  const push = (
    name: string,
    node: Node,
    detectedBy: ComponentDef["detectedBy"],
    exportKind: ComponentDef["exportKind"],
  ) => {
    defs.push({
      id: `${file}#${name}`,
      name,
      file,
      location: {
        file,
        line: startLine(node, lineStarts),
        column: startColumn(node, lineStarts),
      },
      startLine: startLine(node, lineStarts),
      endLine: endLine(node, lineStarts),
      detectedBy,
      exportKind,
      isPage: false,
    });
  };

  for (const stmt of ast.body as Node[]) {
    // export function Foo() { ... }
    if (
      stmt.type === "ExportNamedDeclaration" &&
      stmt.declaration?.type === "FunctionDeclaration" &&
      isPascalCase(stmt.declaration.id?.name ?? "") &&
      containsJSX(stmt.declaration.body)
    ) {
      push(stmt.declaration.id.name, stmt.declaration, "function", "named");
      continue;
    }
    // function Foo() { ... }   (no export — still a component definition)
    if (
      stmt.type === "FunctionDeclaration" &&
      isPascalCase(stmt.id?.name ?? "") &&
      containsJSX(stmt.body)
    ) {
      push(stmt.id.name, stmt, "function", "none");
      continue;
    }
    // export const Foo = () => <div/>;
    // const Foo = () => <div/>;
    const variable =
      stmt.type === "ExportNamedDeclaration" && stmt.declaration?.type === "VariableDeclaration"
        ? stmt.declaration
        : stmt.type === "VariableDeclaration"
          ? stmt
          : null;
    const exportKind: ComponentDef["exportKind"] =
      stmt.type === "ExportNamedDeclaration" ? "named" : "none";
    if (variable) {
      for (const decl of variable.declarations) {
        const name = decl.id?.name;
        if (!name || !isPascalCase(name)) continue;
        const init = decl.init;
        if (!init) continue;
        if (
          (init.type === "ArrowFunctionExpression" || init.type === "FunctionExpression") &&
          containsJSX(init.body)
        ) {
          push(name, decl, "arrow", exportKind);
          continue;
        }
        // Factory pattern: const Foo = <CallExpression>(...);
        // We accept any call expression (styled.button``, createX(), memo(...), forwardRef(...), lazy(() => ...))
        // to cover styled-components / emotion / vanilla-extract / React wrappers without false-negative.
        if (init.type === "CallExpression" || init.type === "TaggedTemplateExpression") {
          push(name, decl, "factory", exportKind);
          continue;
        }
      }
    }
  }

  return defs;
}
