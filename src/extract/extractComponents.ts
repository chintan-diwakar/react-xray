import { basename } from "node:path";
import type { ComponentDef } from "../types.js";
import { containsJSX, isPascalCase, startLine, startColumn, endLine } from "./astHelpers.js";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Node = any;

function filenameAsPascal(file: string): string | null {
  const base = basename(file).replace(/\.(tsx?|jsx?)$/, "");
  return isPascalCase(base) ? base : null;
}

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
    // export class Foo extends React.Component | Component { ... }
    if (
      stmt.type === "ExportNamedDeclaration" &&
      stmt.declaration?.type === "ClassDeclaration" &&
      isPascalCase(stmt.declaration.id?.name ?? "")
    ) {
      const superClass = stmt.declaration.superClass;
      const isReactClass =
        (superClass?.type === "Identifier" && superClass.name === "Component") ||
        (superClass?.type === "MemberExpression" &&
          superClass.object?.name === "React" &&
          superClass.property?.name === "Component");
      if (isReactClass) {
        push(stmt.declaration.id.name, stmt.declaration, "class", "named");
        continue;
      }
    }

    // export default function/arrow/class/factory
    if (stmt.type === "ExportDefaultDeclaration") {
      const decl = stmt.declaration;
      const inferredName = filenameAsPascal(file);
      if (!inferredName) continue;
      if (
        (decl.type === "FunctionDeclaration" || decl.type === "FunctionExpression") &&
        containsJSX(decl.body)
      ) {
        push(inferredName, decl, "function", "default");
        continue;
      }
      if (decl.type === "ArrowFunctionExpression" && containsJSX(decl.body)) {
        push(inferredName, decl, "arrow", "default");
        continue;
      }
      if (decl.type === "ClassDeclaration") {
        const superClass = decl.superClass;
        const isReactClass =
          (superClass?.type === "Identifier" && superClass.name === "Component") ||
          (superClass?.type === "MemberExpression" &&
            superClass.object?.name === "React" &&
            superClass.property?.name === "Component");
        if (isReactClass) {
          push(inferredName, decl, "class", "default");
          continue;
        }
      }
      if (decl.type === "CallExpression" || decl.type === "TaggedTemplateExpression") {
        push(inferredName, decl, "factory", "default");
        continue;
      }
    }

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
