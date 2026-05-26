import { createHash } from "node:crypto";
import { parseFile, type AST } from "./parseFile.js";

export type ParseCache = {
  getOrParse(filename: string, code: string): Promise<AST>;
  clear(): void;
};

export function createCache(): ParseCache {
  const cache = new Map<string, AST>();
  return {
    async getOrParse(filename, code) {
      const key = createHash("sha1")
        .update(filename)
        .update("\0")
        .update(code)
        .digest("hex");
      const hit = cache.get(key);
      if (hit) return hit;
      const ast = await parseFile(filename, code);
      cache.set(key, ast);
      return ast;
    },
    clear() {
      cache.clear();
    },
  };
}
