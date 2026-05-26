# Changelog

## 0.0.2 — 2026-05-26

- Detect Next.js projects with `src/app/` and `src/pages/` directory layouts (previously only root-level `app/` / `pages/` were detected).
- Classify uninstalled bare specifiers (`react`, `next/link`, etc.) as `external` rather than `unresolved` — library-adoption tracking now works on projects without `node_modules/` installed.
- Add denylist of non-component factory callees so PascalCase consts like `localFont(...)`, `Inter(...)`, `cva(...)`, `createContext(...)`, `z.object(...)` are no longer flagged as "unused components."
- Embed the logo and improve styling in the generated HTML report.
- Fix syntax bug in the embedded HTML renderer that left the page stuck on "Loading…".
- Documentation: README now references the actual published npm package (`@chintandiwakar1/react-xray`), includes a screenshot of the report, and clarifies the brand vs package-name distinction.

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
