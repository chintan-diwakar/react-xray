import { basename } from "node:path";
import type { ComponentDef } from "../types.js";
import { containsJSX, isPascalCase, startLine, startColumn, endLine } from "./astHelpers.js";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Node = any;

function filenameAsPascal(file: string): string | null {
  const base = basename(file).replace(/\.(tsx?|jsx?)$/, "");
  return isPascalCase(base) ? base : null;
}

// Callees that look like component factories (PascalCase const = SomeCall(...)) but
// actually produce non-component values. Skip these or they show up as false-positive
// "unused components" — they're real values used via .className / .Provider / .object etc.,
// not via JSX rendering.
const NON_COMPONENT_CALLEE_NAMES = new Set([
  // next/font/local
  "localFont",
  // next/font/google — popular subset; full list is ~1000+ Google Fonts, this covers the
  // ones we've actually seen in real codebases
  "Inter", "Roboto", "Roboto_Mono", "Roboto_Slab", "Roboto_Condensed",
  "Open_Sans", "Lato", "Montserrat", "Poppins", "Source_Sans_3", "Source_Sans_Pro",
  "Raleway", "Oswald", "Merriweather", "Nunito", "Nunito_Sans",
  "PT_Sans", "PT_Serif", "PT_Mono", "Ubuntu", "Ubuntu_Mono",
  "Playfair_Display", "Noto_Sans", "Noto_Serif", "Noto_Mono",
  "Geist", "Geist_Mono",
  "Fira_Code", "Fira_Mono", "Fira_Sans",
  "JetBrains_Mono",
  "IBM_Plex_Sans", "IBM_Plex_Mono", "IBM_Plex_Serif",
  "Source_Code_Pro", "Inconsolata",
  "Space_Mono", "Space_Grotesk",
  "DM_Sans", "DM_Serif_Display", "DM_Serif_Text", "DM_Mono",
  "Cabin", "Karla", "Manrope", "Work_Sans", "Quicksand", "Mulish",
  "Outfit", "Plus_Jakarta_Sans", "Sora", "Urbanist",
  "Bricolage_Grotesque", "Bebas_Neue", "Lora", "Inter_Tight",
  "Archivo", "Cormorant", "Cormorant_Garamond", "EB_Garamond",
  "Crimson_Text", "Crimson_Pro", "Libre_Franklin", "Libre_Caslon_Text",
  // Style/variant utilities
  "cva", "tv", "stitches", "createStitches",
  // React primitives that aren't themselves components
  "createContext", "createRef", "createServerContext",
  // Schema/validation builders commonly assigned to PascalCase consts
  "object", "string", "number", "boolean", "array", "union", "intersection",
]);

// MemberExpression call roots that always produce non-component values.
// Catches `const UserSchema = z.object({...})`, `const Q = api.query(...)` etc.
const NON_COMPONENT_CALLEE_ROOTS = new Set([
  "z",       // zod
  "yup",     // yup
  "v",       // valibot
  "Joi",     // joi (when imported as Joi)
  "S",       // effect/schema
]);

function calleeName(callee: Node): string | null {
  if (!callee) return null;
  if (callee.type === "Identifier") return callee.name;
  if (callee.type === "MemberExpression") return callee.property?.name ?? null;
  return null;
}

function calleeRoot(callee: Node): string | null {
  if (!callee) return null;
  let cur = callee;
  while (cur?.type === "MemberExpression") cur = cur.object;
  if (cur?.type === "Identifier") return cur.name;
  return null;
}

function isNonComponentCallee(callee: Node): boolean {
  const name = calleeName(callee);
  if (name && NON_COMPONENT_CALLEE_NAMES.has(name)) return true;
  const root = calleeRoot(callee);
  if (root && NON_COMPONENT_CALLEE_ROOTS.has(root)) return true;
  return false;
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
        const callee = decl.type === "CallExpression" ? decl.callee : decl.tag;
        if (isNonComponentCallee(callee)) continue;
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
        // to cover styled-components / emotion / vanilla-extract / React wrappers without false-negative,
        // EXCEPT for an explicit denylist of well-known non-component factories (next/font, cva, zod, etc.).
        if (init.type === "CallExpression" || init.type === "TaggedTemplateExpression") {
          const callee = init.type === "CallExpression" ? init.callee : init.tag;
          if (isNonComponentCallee(callee)) continue;
          push(name, decl, "factory", exportKind);
          continue;
        }
      }
    }
  }

  return defs;
}
