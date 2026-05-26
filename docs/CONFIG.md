# Configuration

react-xray works zero-config on most Next.js projects. To customize, add `react-xray.config.json` to your project root.

```json
{
  "pages": ["src/pages/**/*.tsx"],
  "components": {
    "include": ["src/**/*.{ts,tsx,js,jsx}"],
    "exclude": ["**/*.{test,spec,stories}.*", "**/__tests__/**"]
  },
  "externalPackages": "all",
  "tsconfig": "./tsconfig.json"
}
```

## Fields

| Field | Default | Description |
|---|---|---|
| `pages` | auto-detected | Overrides framework detection. Glob array. |
| `components.include` | `["**/*.{ts,tsx,js,jsx}"]` | Globs scanned for component definitions. |
| `components.exclude` | tests/stories | Globs excluded. |
| `externalPackages` | `"all"` | Track all external packages or restrict to a list. |
| `tsconfig` | `./tsconfig.json` | Path to tsconfig for module resolution. |

## CLI flags override config

`react-xray --json out.json --no-html`

## Excluded by default

`.gitignore` is always respected. In addition: `node_modules`, `.next`, `dist`, `build`, `out`, `.turbo`, `coverage`, and all `.d.ts` files.
