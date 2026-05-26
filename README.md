<p align="center">
  <img src="https://raw.githubusercontent.com/chintan-diwakar/react-xray/master/assets/logo-wide.svg" alt="react-xray" width="600"/>
</p>

<p align="center">
  <strong>Per-page component reachability for React apps.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@chintandiwakar1/react-xray"><img src="https://img.shields.io/npm/v/@chintandiwakar1/react-xray?color=22d3ee&label=npm" alt="npm"/></a>
  <a href="https://www.npmjs.com/package/@chintandiwakar1/react-xray"><img src="https://img.shields.io/npm/dm/@chintandiwakar1/react-xray?color=22d3ee&label=downloads" alt="downloads"/></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-22d3ee" alt="license"/></a>
  <img src="https://img.shields.io/badge/node-%3E%3D18-22d3ee" alt="node"/>
  <img src="https://img.shields.io/badge/typescript-strict-22d3ee" alt="typescript"/>
</p>

---

A static analyzer CLI that answers: **which pages render which components** (yours and your libraries'), and **which components no page reaches**.

It builds a per-page → component reachability matrix, a render-aware unused-components report, and tracks how much you actually use third-party UI libraries — in one self-contained HTML artifact you can drop in a PR.

## Why

| Tool | What it does | Gap react-xray fills |
|---|---|---|
| `knip` | Unused **exports** at the file level | Doesn't tell you which **components** are rendered by which pages |
| `madge` | File-level dependency graph | No concept of pages, components, or external library adoption |
| `react-scanner` | Counts JSX **render sites** | No definitions, no pages, no reachability |
| Bundle analyzers | Bytes per chunk | Component-blind |

react-xray combines page detection + file-graph reachability + render-aware usage in one report.

## Install

```bash
# one-shot run (no install)
npx @chintandiwakar1/react-xray

# or install globally
npm install -g @chintandiwakar1/react-xray
react-xray   # CLI command name stays react-xray
```

Requires Node 18+. Works with TypeScript and JavaScript projects.

> **Note on the package name:** the npm registry rejects the unscoped name `react-xray` because of an existing unrelated package `react-x-ray` (a CSS layout debugger). The tool is therefore published under the scope `@chintandiwakar1`. The CLI binary name, terminal banner, and HTML report branding all remain `react-xray`.

## Usage

```bash
cd your-next-app
react-xray
```

Outputs three things in the scanned directory:

- **Terminal summary** (tokei-style table)
- **`react-xray-report.json`** — full machine-readable scan result
- **`react-xray-report.html`** — single self-contained HTML report; drop in a PR

### Sample terminal output

```
react-xray v0.0.1   /path/to/your-app   next-app   scanned 1781 files in 2.66s

┌─────────────────────┬───────┬────────┬─────────┬───────────┐
│ Language            │ Files │ Lines  │ Code    │ Comments  │
├─────────────────────┼───────┼────────┼─────────┼───────────┤
│ TypeScript (.tsx)   │  1387 │ 382863 │  345817 │     14978 │
│ TypeScript (.ts)    │   384 │  32449 │   29819 │       892 │
│ JavaScript          │     6 │    308 │     295 │         4 │
├─────────────────────┼───────┼────────┼─────────┼───────────┤
│ Total               │       │ 415669 │         │     15874 │
└─────────────────────┴───────┴────────┴─────────┴───────────┘

Components       1494 (used 1234 · unused 260)
Pages            252
External usage   406 packages, 6332 instances

⚠  Top unused
   UserProvider           src/contexts/UserContext.tsx           26 LOC
   InvoiceTransactions    src/components/invoice-transactions.tsx  858 LOC
   LeadContactInfoComponent  src/components/lead-contact-info.tsx  18 LOC
   … 257 more — see report.html or report.json
```

### Sample HTML report

The `react-xray-report.html` is a single self-contained file — drop it in a PR. The "Unused (strictly)" section, for example, looks like this:

<p align="center">
  <img src="https://raw.githubusercontent.com/chintan-diwakar/react-xray/master/assets/report-unused.png" alt="react-xray HTML report — Unused components section" width="900"/>
</p>

Component, file path, LOC, and the concrete `reasons[]` are listed for every flagged unused component — no opaque confidence scores.

### CLI flags

| Flag | Default | Description |
|---|---|---|
| `--json [path]` / `--no-json` | on | Write JSON report |
| `--html [path]` / `--no-html` | on | Write HTML report |
| `--quiet` / `--no-terminal` | off | Suppress terminal output |
| `--no-color` | auto | Force-disable color |
| `-c, --config <file>` | auto | Override config path |
| `--version`, `--help` | — | |

## What it detects

- **Frameworks:** Next.js App Router, Pages Router, mixed setups, with or without the `src/` directory layout.
- **Pages:** Real route files plus reachability roots (`layout`, `template`, `error`, `not-found`, `loading`, `default`, `global-error`). `route.ts` and `api/**` excluded.
- **Components:** function declarations, arrow consts, class components extending `React.Component`, default exports, and **factory patterns** (`styled.button`, `forwardRef`, `memo`, `lazy`, `createIcon`, …).
- **JSX usage:** plain `<Foo/>`, compound `<Card.Header/>`, and polymorphic `<Box as={Custom}/>`.
- **Imports:** static, re-exports, dynamic with literal specifiers, and `React.lazy(() => import('...'))`.
- **External components:** every JSX element resolved to a `node_modules` package — grouped by `{ package, name }` with instance counts.

## Two kinds of unused

| Report | What it catches |
|---|---|
| **Strictly unused** | Component defined but no `<JSXTag/>` anywhere in the project renders it |
| **Unreachable** | Component's file isn't reached by BFS from any page — catches orphan subtrees that import each other but no page imports them |

Every entry carries a `reasons[]` array — concrete facts (e.g., *"no JSX usage in project"*, *"file not reached by BFS from any page"*). No opaque confidence scores; you decide.

## Configuration

react-xray is zero-config on Next.js projects. To customize, add `react-xray.config.json`:

```json
{
  "components": {
    "include": ["src/**/*.{ts,tsx,js,jsx}"],
    "exclude": ["**/*.{test,spec,stories}.*", "**/__tests__/**"]
  },
  "externalPackages": "all",
  "tsconfig": "./tsconfig.json"
}
```

Full reference: [docs/CONFIG.md](docs/CONFIG.md).

## How it works

Six-stage pipeline, each stage a pure function emitting a plain object so they can be tested in isolation:

```
discover → parse → extract → resolve → analyze → report
```

- **discover** — framework detection, file collection (respects `.gitignore`)
- **parse** — `oxc-parser` (Rust-native; AST cached by content hash)
- **extract** — single AST walk emits `ComponentDef`, `JSXUsage`, `ImportEdge` records
- **resolve** — `oxc-resolver` with tsconfig paths / monorepo references / exports map
- **analyze** — file-level graph, BFS reachability from pages, unused lists, LOC stats
- **report** — terminal table, JSON, self-contained HTML

The graph is **file-level imports** — not component-render relationships. This is the right model because `children` and slot props mean a page transitively renders things it never directly imports.

## Caveats

- **MDX:** out of scope for v0.
- **Polymorphic identifiers** (`const Comp = map[key]; <Comp/>`): invisible to a static analyzer. Logged as a warning rather than a usage edge.
- **Dynamic imports with non-literal specifiers** (`import(variable)`): same — logged, not followed.
- **`as` prop:** the target identifier is recorded as a polymorphic usage warning so it doesn't silently flag the target as unused, but it's still a heuristic.
- Expect some false positives in the unused report on apps with heavy barrel re-exports or HOC chains. Treat the high-LOC findings as the highest-value place to look first.

## Status

v0 — Next.js (App Router, Pages Router, both with or without `src/`).
Coming in v0.1+: Remix and React Router auto-detect, orphan subtree visualization, prop usage tracking, monorepo / multi-tsconfig support, plugin API.

## License

[MIT](LICENSE)
