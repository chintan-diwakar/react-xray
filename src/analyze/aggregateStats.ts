import type { FileStats, ScanResult } from "../types.js";
import type { LineCount } from "../extract/countLines.js";

type Stats = Pick<ScanResult["stats"], "totalLOC" | "totalBlankLOC" | "totalCommentLOC" | "byLanguage">;

function langOf(file: string): keyof Stats["byLanguage"] | null {
  if (file.endsWith(".tsx")) return "tsx";
  if (file.endsWith(".ts")) return "ts";
  if (file.endsWith(".jsx")) return "jsx";
  if (file.endsWith(".js") || file.endsWith(".cjs") || file.endsWith(".mjs")) return "js";
  return null;
}

const empty = (): FileStats => ({ files: 0, lines: 0, code: 0, blank: 0, comment: 0 });

export function aggregateStats(counts: Map<string, LineCount>): Stats {
  const byLanguage: Stats["byLanguage"] = {
    ts: empty(), tsx: empty(), js: empty(), jsx: empty(),
  };
  let totalLOC = 0, totalBlankLOC = 0, totalCommentLOC = 0;
  for (const [file, c] of counts) {
    const lang = langOf(file);
    if (!lang) continue;
    byLanguage[lang].files++;
    byLanguage[lang].lines += c.lines;
    byLanguage[lang].code += c.code;
    byLanguage[lang].blank += c.blank;
    byLanguage[lang].comment += c.comment;
    totalLOC += c.lines;
    totalBlankLOC += c.blank;
    totalCommentLOC += c.comment;
  }
  return { totalLOC, totalBlankLOC, totalCommentLOC, byLanguage };
}
