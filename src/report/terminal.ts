import pc from "picocolors";
import type { ScanResult } from "../types.js";

export type TerminalOptions = { noColor?: boolean; quiet?: boolean };

function color(noColor: boolean) {
  if (noColor) {
    return { dim: (s: string) => s, bold: (s: string) => s, yellow: (s: string) => s, cyan: (s: string) => s };
  }
  return { dim: pc.dim, bold: pc.bold, yellow: pc.yellow, cyan: pc.cyan };
}

function row(cols: (string | number)[], widths: number[]): string {
  return "│ " + cols.map((c, i) => String(c).padEnd(widths[i]!)).join(" │ ") + " │";
}

function rule(widths: number[], left: string, mid: string, right: string): string {
  return left + widths.map((w) => "─".repeat(w + 2)).join(mid) + right;
}

export function renderTerminal(r: ScanResult, opts: TerminalOptions = {}): string {
  const c = color(opts.noColor ?? false);
  const lines: string[] = [];

  lines.push(
    `${c.bold("react-xray")} v${r.meta.version}   ${c.dim(r.meta.rootDir)}   ${c.cyan(r.meta.framework)}   scanned ${r.meta.fileCount} files in ${(r.meta.durationMs / 1000).toFixed(2)}s`,
  );
  if (opts.quiet) return lines.join("\n");

  const widths = [19, 6, 6, 8, 9];
  const langs: [string, keyof ScanResult["stats"]["byLanguage"]][] = [
    ["TypeScript (.tsx)", "tsx"],
    ["TypeScript (.ts)", "ts"],
    ["JavaScript", "js"],
    ["JavaScript (.jsx)", "jsx"],
  ];
  lines.push("");
  lines.push(rule(widths, "┌", "┬", "┐"));
  lines.push(row(["Language", "Files", "Lines", "Code", "Comments"], widths));
  lines.push(rule(widths, "├", "┼", "┤"));
  for (const [label, key] of langs) {
    const s = r.stats.byLanguage[key];
    if (s.files === 0) continue;
    lines.push(row([label, s.files, s.lines, s.code, s.comment], widths));
  }
  lines.push(rule(widths, "├", "┼", "┤"));
  lines.push(row(["Total", "", r.stats.totalLOC, "", r.stats.totalCommentLOC], widths));
  lines.push(rule(widths, "└", "┴", "┘"));

  const used = r.components.length - r.unused.strictlyUnused.length;
  lines.push("");
  lines.push(`Components       ${r.components.length} (used ${used} · unused ${r.unused.strictlyUnused.length})`);
  lines.push(`Pages            ${r.pages.length}`);
  lines.push(`External usage   ${r.externals.length} packages, ${r.externals.reduce((n, e) => n + e.instances, 0)} instances`);

  if (r.unused.strictlyUnused.length > 0) {
    lines.push("");
    lines.push(c.yellow("⚠  Top unused"));
    const top = r.unused.strictlyUnused.slice(0, 3);
    for (const u of top) lines.push(`   ${u.name}  ${u.file.replace(r.meta.rootDir + "/", "")}  ${u.loc} LOC`);
    if (r.unused.strictlyUnused.length > 3) lines.push(`   … ${r.unused.strictlyUnused.length - 3} more — see report.html or report.json`);
  }
  return lines.join("\n");
}
