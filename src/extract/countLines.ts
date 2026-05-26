export type LineCount = { lines: number; code: number; blank: number; comment: number };

export function countLines(source: string): LineCount {
  const lines = source.split(/\r?\n/);
  let code = 0;
  let blank = 0;
  let comment = 0;
  let inBlock = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (inBlock) {
      comment++;
      if (line.includes("*/")) inBlock = false;
      continue;
    }
    if (line === "") {
      blank++;
      continue;
    }
    if (line.startsWith("//")) {
      comment++;
      continue;
    }
    if (line.startsWith("/*")) {
      comment++;
      if (!line.includes("*/")) inBlock = true;
      continue;
    }
    code++;
  }
  return { lines: lines.length, code, blank, comment };
}
