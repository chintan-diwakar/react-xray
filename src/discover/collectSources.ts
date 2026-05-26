import { globby } from "globby";

const DEFAULT_EXCLUDES = [
  "**/node_modules/**",
  "**/.next/**",
  "**/dist/**",
  "**/build/**",
  "**/out/**",
  "**/.turbo/**",
  "**/coverage/**",
  "**/*.d.ts",
];

export async function collectSources(
  rootDir: string,
  opts: { include: string[]; exclude: string[] },
): Promise<string[]> {
  return globby(opts.include, {
    cwd: rootDir,
    absolute: true,
    gitignore: true,
    ignore: [...DEFAULT_EXCLUDES, ...opts.exclude],
  });
}
