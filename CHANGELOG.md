# Changelog

## 0.0.1 — 2026-05-26

Initial release.

- Next.js App Router + Pages Router auto-detect (mixed supported)
- Component detection (function, arrow, class, factory, default export)
- Compound component (`<Card.Header/>`) and polymorphic `as`-prop tracking
- Per-page → component reachability matrix
- Strictly-unused and unreachable component reports with `reasons[]`
- External library component usage grouped by npm package
- LOC stats by language (ts/tsx/js/jsx) and per component
- Terminal table + JSON + self-contained HTML output (auto split-to-sidecar over 10 MB)
- Content-hash parse cache; oxc-resolver for tsconfig-aware module resolution
