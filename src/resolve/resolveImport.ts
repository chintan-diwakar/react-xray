import { ResolverFactory } from "oxc-resolver";
import { dirname, join, sep, isAbsolute } from "node:path";

export type ResolvedTarget =
  | { kind: "internal"; path: string }
  | { kind: "external"; package: string }
  | { kind: "unresolved"; specifier: string };

export type Resolver = {
  resolve(fromFile: string, specifier: string): Promise<ResolvedTarget>;
};

function packageNameFromBare(spec: string): string {
  if (spec.startsWith("@")) {
    const parts = spec.split("/");
    return `${parts[0]}/${parts[1] ?? ""}`;
  }
  return spec.split("/", 1)[0]!;
}

function isBareSpecifier(spec: string): boolean {
  return !spec.startsWith(".") && !spec.startsWith("/") && !isAbsolute(spec);
}

export async function createResolver(rootDir: string): Promise<Resolver> {
  const tsconfigPath = join(rootDir, "tsconfig.json");
  const factory = new ResolverFactory({
    extensions: [".ts", ".tsx", ".js", ".jsx", ".cjs", ".mjs"],
    tsconfig: { configFile: tsconfigPath, references: "auto" },
    conditionNames: ["import", "require", "node", "default"],
  });

  return {
    async resolve(fromFile, specifier) {
      const dir = dirname(fromFile);
      try {
        const result = factory.sync(dir, specifier);
        if (result.error || !result.path) {
          // Bare specifiers that fail to resolve are still libraries — the package
          // simply isn't installed locally. Treat as external so library-adoption
          // tracking works on uninstalled projects.
          if (isBareSpecifier(specifier)) {
            return { kind: "external", package: packageNameFromBare(specifier) };
          }
          return { kind: "unresolved", specifier };
        }
        const p = result.path;
        if (p.includes(`${sep}node_modules${sep}`)) {
          return { kind: "external", package: packageNameFromBare(specifier) };
        }
        return { kind: "internal", path: p };
      } catch {
        if (isBareSpecifier(specifier)) {
          return { kind: "external", package: packageNameFromBare(specifier) };
        }
        return { kind: "unresolved", specifier };
      }
    },
  };
}
