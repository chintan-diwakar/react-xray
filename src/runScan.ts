import { readFile } from "node:fs/promises";
import { detectFramework } from "./discover/detectFramework.js";
import { collectPages } from "./discover/collectPages.js";
import { collectSources } from "./discover/collectSources.js";
import { createCache } from "./parse/cache.js";
import { extractComponents } from "./extract/extractComponents.js";
import { extractJSXUsages } from "./extract/extractJSXUsages.js";
import { extractImports } from "./extract/extractImports.js";
import { countLines, type LineCount } from "./extract/countLines.js";
import { createResolver } from "./resolve/resolveImport.js";
import { buildGraph, type ResolvedEdge } from "./analyze/buildGraph.js";
import { reachabilityFrom } from "./analyze/reachability.js";
import { computeUnused } from "./analyze/computeUnused.js";
import { buildMatrix } from "./analyze/buildMatrix.js";
import { aggregateStats } from "./analyze/aggregateStats.js";
import { loadConfig } from "./config.js";
import type {
  ComponentDef,
  ComponentEntry,
  ComponentId,
  ExternalUsage,
  ImportEdge,
  JSXUsage,
  ScanResult,
  SourceLocation,
  Warning,
} from "./types.js";
import { VERSION } from "./index.js";

export type RunScanOptions = {
  rootDir: string;
};

export async function runScan(opts: RunScanOptions): Promise<ScanResult> {
  const t0 = Date.now();
  const config = await loadConfig(opts.rootDir, {});

  const framework = await detectFramework(opts.rootDir);
  const { pages, roots } = await collectPages(opts.rootDir, framework);
  const sources = await collectSources(opts.rootDir, config.components);

  const cache = createCache();
  const resolver = await createResolver(opts.rootDir);

  const componentsByFile = new Map<string, ComponentId[]>();
  const allComponents: ComponentEntry[] = [];
  const allUsages: JSXUsage[] = [];
  const allDefs: ComponentDef[] = [];
  const importsByFile = new Map<string, ImportEdge[]>();
  const resolvedEdges: ResolvedEdge[] = [];
  const locByFile = new Map<string, LineCount>();
  const externalInstancesByFile = new Map<string, number>();
  const externalUsageMap = new Map<
    string,
    { package: string; name: string; instances: number; sites: SourceLocation[] }
  >();
  const warnings: Warning[] = [];

  const pageFiles = new Set(pages.map((p) => p.file));

  for (const file of sources) {
    const code = await readFile(file, "utf-8");
    let ast;
    try {
      ast = await cache.getOrParse(file, code);
    } catch (err) {
      warnings.push({
        kind: "parse-error",
        message: err instanceof Error ? err.message : String(err),
        file,
      });
      continue;
    }

    const defs = extractComponents(file, ast);
    const usages = extractJSXUsages(file, ast);
    const imports = extractImports(file, ast);
    const lc = countLines(code);

    locByFile.set(file, lc);
    importsByFile.set(file, imports);

    for (const d of defs) {
      if (pageFiles.has(file)) d.isPage = true;
      allDefs.push(d);
      const list = componentsByFile.get(file) ?? [];
      list.push(d.id);
      componentsByFile.set(file, list);
      allComponents.push({
        id: d.id,
        name: d.name,
        file: d.file,
        location: d.location,
        loc: Math.max(1, d.endLine - d.startLine + 1),
        blank: 0,
        comment: 0,
        isPage: d.isPage,
        isExternal: false,
        exportKind: d.exportKind,
        detectedBy: d.detectedBy,
      });
    }

    for (const u of usages) allUsages.push(u);

    for (const imp of imports) {
      if (imp.isDynamic && !imp.dynamicSpecifierIsLiteral) {
        warnings.push({
          kind: "dynamic-import",
          message: "non-literal dynamic specifier",
          file,
        });
        continue;
      }
      const target = await resolver.resolve(file, imp.source);
      resolvedEdges.push({ fromFile: file, target });

      if (target.kind === "external") {
        const localToImported = new Map<string, string>();
        for (const sp of imp.imported) localToImported.set(sp.local, sp.imported);
        let count = 0;
        for (const u of usages) {
          const id = u.memberPath ? u.memberPath[0]! : u.identifier;
          const importedName = localToImported.get(id);
          if (importedName == null) continue;
          count++;
          const exName = u.memberPath
            ? `${importedName}.${u.memberPath.slice(1).join(".")}`
            : importedName;
          const k = `${target.package}::${exName}`;
          let entry = externalUsageMap.get(k);
          if (!entry) {
            entry = { package: target.package, name: exName, instances: 0, sites: [] };
            externalUsageMap.set(k, entry);
          }
          entry.instances++;
          entry.sites.push(u.location);
        }
        if (count > 0) {
          externalInstancesByFile.set(
            file,
            (externalInstancesByFile.get(file) ?? 0) + count,
          );
        }
      }
      if (target.kind === "unresolved") {
        warnings.push({
          kind: "unresolved-module",
          message: `cannot resolve ${imp.source}`,
          file,
        });
      }
    }
  }

  const graph = buildGraph(resolvedEdges);
  const reachable = reachabilityFrom(graph, roots);
  const unused = computeUnused({
    defs: allDefs,
    usages: allUsages,
    reachable,
    importMaps: importsByFile,
  });

  const matrix = buildMatrix({
    graph,
    pages,
    componentsByFile,
    locByFile: new Map([...locByFile].map(([k, v]) => [k, v.lines])),
    externalInstancesByFile,
  });

  const stats = aggregateStats(locByFile);

  const externals: ExternalUsage[] = [...externalUsageMap.values()].sort(
    (a, b) => b.instances - a.instances,
  );

  return {
    meta: {
      version: VERSION,
      scannedAt: new Date().toISOString(),
      rootDir: opts.rootDir,
      framework,
      durationMs: Date.now() - t0,
      fileCount: sources.length,
    },
    pages,
    components: allComponents,
    externals,
    matrix,
    unused,
    stats: {
      ...stats,
      perComponent: allComponents.map((c) => ({
        id: c.id,
        loc: c.loc,
        blank: 0,
        comment: 0,
      })),
    },
    warnings,
  };
}
