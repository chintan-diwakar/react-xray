# react-xray

**Per-page component reachability for React apps.**

Static analysis CLI that answers: which pages render which components (yours and your libraries'), and which components no page reaches?

## Install

```bash
npm install -g react-xray
# or
npx react-xray
```

## Usage

```bash
cd your-next-app
react-xray
```

Outputs:
- terminal summary
- `react-xray-report.json` — machine-readable
- `react-xray-report.html` — drop in a PR

## What it does

- Detects pages from Next.js App Router and Pages Router automatically
- Lists every component in your project (functions, arrows, classes, factory patterns like `styled.button`)
- Builds a per-page reachability matrix: which components each page transitively uses
- Reports two kinds of unused components:
  - **Strictly unused** — never rendered anywhere
  - **Unreachable** — no page transitively imports it (catches orphan subtrees)
- Tracks external library component usage (NextUI, MUI, shadcn, …) per package
- LOC stats per language and per component

## Configuration

See [docs/CONFIG.md](docs/CONFIG.md).

## Status

v0 — Next.js only. Remix and React Router auto-detect coming in v0.1.
