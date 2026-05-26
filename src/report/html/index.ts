import { writeFile } from "node:fs/promises";
import { join, dirname, basename } from "node:path";
import { htmlShell } from "./template.js";
import type { ScanResult } from "../../types.js";

export type RenderHTMLOptions = { splitThresholdBytes?: number };

export async function renderHTML(result: ScanResult, outPath: string, opts: RenderHTMLOptions = {}): Promise<void> {
  const threshold = opts.splitThresholdBytes ?? 10 * 1024 * 1024;
  const json = JSON.stringify(result);
  if (Buffer.byteLength(json) > threshold) {
    const dir = dirname(outPath);
    const base = basename(outPath).replace(/\.html$/, "");
    const dataPath = join(dir, `${base}-data.json`);
    await writeFile(dataPath, json, "utf-8");
    await writeFile(outPath, htmlShell({
      title: "react-xray report",
      dataExternalPath: `./${base}-data.json`,
    }), "utf-8");
  } else {
    await writeFile(outPath, htmlShell({
      title: "react-xray report",
      dataInline: json.replace(/<\/script>/g, "<\\/script>"),
    }), "utf-8");
  }
}
