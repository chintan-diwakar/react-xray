import { expect, test } from "vitest";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { resolve, join } from "node:path";
import { mkdtemp, rm, readFile, cp } from "node:fs/promises";
import { tmpdir } from "node:os";

const exec = promisify(execFile);

test(
  "CLI runs end-to-end and writes JSON + HTML",
  async () => {
    const fixture = resolve(__dirname, "fixtures/e2e/next-app");
    const dir = await mkdtemp(join(tmpdir(), "rx-cli-"));
    await cp(fixture, dir, { recursive: true });
    const bin = resolve(__dirname, "../bin/react-xray");

    try {
      const { stdout } = await exec("node", [bin, dir], {
        env: { ...process.env, NO_COLOR: "1" },
      });
      expect(stdout).toMatch(/react-xray/);
      const json = JSON.parse(
        await readFile(join(dir, "react-xray-report.json"), "utf-8"),
      );
      expect(json.meta.framework).toBe("next-app");
      const html = await readFile(join(dir, "react-xray-report.html"), "utf-8");
      expect(html).toMatch(/<html/);
    } finally {
      await rm(dir, { recursive: true });
    }
  },
  30_000,
);
