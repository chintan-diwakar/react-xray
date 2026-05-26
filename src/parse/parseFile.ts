import { parse as oxcParse } from "oxc-parser";

export type AST = {
  type: "Program";
  body: unknown[];
  // oxc returns more fields; we only type the ones we use
  [key: string]: unknown;
};

export async function parseFile(filename: string, code: string): Promise<AST> {
  const lang: "tsx" | "ts" | "jsx" | "js" = filename.endsWith(".tsx")
    ? "tsx"
    : filename.endsWith(".jsx")
      ? "jsx"
      : filename.endsWith(".ts")
        ? "ts"
        : "js";

  const result = await oxcParse(filename, code, {
    sourceType: "module",
    lang,
  });

  if (result.errors && result.errors.length > 0) {
    const first = result.errors[0];
    throw new Error(
      `Parse error in ${filename}: ${first?.message ?? "unknown"}`,
    );
  }

  return result.program as unknown as AST;
}
