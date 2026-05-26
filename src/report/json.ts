import { writeFile } from "node:fs/promises";
import type { ScanResult } from "../types.js";

export async function renderJSON(result: ScanResult, outPath: string): Promise<void> {
  await writeFile(outPath, JSON.stringify(result, null, 2), "utf-8");
}
