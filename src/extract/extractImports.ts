import type { ImportEdge } from "../types.js";
import { walk } from "./astHelpers.js";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Node = any;

function nameOf(id: Node): string {
  // Identifier → name; Literal (e.g. import { "x" as y }) → string value
  if (!id) return "";
  if (id.type === "Identifier") return id.name;
  if (id.type === "Literal" || id.type === "StringLiteral") return String(id.value);
  return id.name ?? "";
}

function readImportSpecifiers(specifiers: Node[]): ImportEdge["imported"] {
  const out: ImportEdge["imported"] = [];
  for (const s of specifiers) {
    if (s.type === "ImportSpecifier") {
      out.push({ local: nameOf(s.local), imported: nameOf(s.imported) });
    } else if (s.type === "ImportDefaultSpecifier") {
      out.push({ local: nameOf(s.local), imported: "default" });
    } else if (s.type === "ImportNamespaceSpecifier") {
      out.push({ local: nameOf(s.local), imported: "*" });
    }
  }
  return out;
}

function readExportSpecifiers(specifiers: Node[]): ImportEdge["imported"] {
  const out: ImportEdge["imported"] = [];
  for (const s of specifiers) {
    if (s.type === "ExportSpecifier") {
      // re-export: local is the source name, exported is the local alias
      out.push({ local: nameOf(s.exported), imported: nameOf(s.local) });
    }
  }
  return out;
}

export function extractImports(file: string, ast: Node): ImportEdge[] {
  const out: ImportEdge[] = [];

  for (const stmt of ast.body ?? []) {
    if (stmt.type === "ImportDeclaration") {
      out.push({
        file,
        source: String(stmt.source?.value ?? ""),
        imported: readImportSpecifiers(stmt.specifiers ?? []),
        isDynamic: false,
        isReExport: false,
        dynamicSpecifierIsLiteral: false,
      });
    } else if (stmt.type === "ExportNamedDeclaration" && stmt.source?.value !== undefined) {
      out.push({
        file,
        source: String(stmt.source.value),
        imported: readExportSpecifiers(stmt.specifiers ?? []),
        isDynamic: false,
        isReExport: true,
        dynamicSpecifierIsLiteral: false,
      });
    } else if (stmt.type === "ExportAllDeclaration" && stmt.source?.value !== undefined) {
      out.push({
        file,
        source: String(stmt.source.value),
        imported: [{ local: "*", imported: "*" }],
        isDynamic: false,
        isReExport: true,
        dynamicSpecifierIsLiteral: false,
      });
    }
  }

  // Walk for dynamic imports anywhere in expression positions.
  // oxc 0.133 emits these as `ImportExpression` with a `.source` field.
  // Also handle the CallExpression-of-Import legacy form as a fallback.
  walk(ast, (n) => {
    const isImportExpr = n.type === "ImportExpression";
    const isCallImport = n.type === "CallExpression" && n.callee?.type === "Import";
    if (!isImportExpr && !isCallImport) return;
    const src = isImportExpr ? n.source : n.arguments?.[0];
    if (!src) return;
    const isLiteral = src.type === "Literal" || src.type === "StringLiteral";
    out.push({
      file,
      source: isLiteral ? String(src.value) : "<dynamic>",
      imported: [{ local: "*", imported: "*" }],
      isDynamic: true,
      isReExport: false,
      dynamicSpecifierIsLiteral: isLiteral,
    });
  });

  return out;
}
