import { cac } from "cac";
import { resolve } from "node:path";
import { VERSION } from "./index.js";
import { runScan } from "./runScan.js";
import { renderJSON } from "./report/json.js";
import { renderHTML } from "./report/html/index.js";
import { renderTerminal } from "./report/terminal.js";

const cli = cac("react-xray");

cli
  .command("[root]", "Scan a React project")
  .option("--json [path]", "Write JSON report (default: ./react-xray-report.json)", { default: true })
  .option("--html [path]", "Write HTML report (default: ./react-xray-report.html)", { default: true })
  .option("--terminal", "Print terminal summary (default: true)", { default: true })
  .option("--quiet", "Print only one-line summary")
  .option("--color", "Enable color in terminal output (default: true)", { default: true })
  .option("-c, --config <file>", "Path to config file")
  .action(async (rootArg: string | undefined, opts: Record<string, unknown>) => {
    const rootDir = resolve(rootArg ?? process.cwd());
    const result = await runScan({ rootDir });

    if (opts.terminal !== false) {
      const noColor =
        opts.color === false || process.env.NO_COLOR != null || !process.stdout.isTTY;
      console.log(renderTerminal(result, { noColor, quiet: opts.quiet === true }));
    }

    if (opts.json !== false) {
      const path =
        typeof opts.json === "string"
          ? resolve(opts.json)
          : resolve(rootDir, "react-xray-report.json");
      await renderJSON(result, path);
    }

    if (opts.html !== false) {
      const path =
        typeof opts.html === "string"
          ? resolve(opts.html)
          : resolve(rootDir, "react-xray-report.html");
      await renderHTML(result, path);
    }
  });

cli.help();
cli.version(VERSION);
cli.parse(process.argv, { run: false });
await cli.runMatchedCommand();
