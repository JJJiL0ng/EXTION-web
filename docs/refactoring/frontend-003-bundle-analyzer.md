# Frontend Step 3 Bundle Analyzer

- Date: 2026-06-13
- Branch: `refactor-frontend-003-bundle-analyzer`
- Base: `refactor`
- Scope: bundle analyzer setup and route-level build baseline.

## Purpose

Add a repeatable way to inspect Next.js bundle composition before changing route boundaries, SpreadJS loading, or legacy routes. This step records the current route-level bundle baseline so later optimization PRs can compare against concrete numbers.

## Existing Problem

- Step 1 had no current bundle baseline because the existing `.next` output was stale.
- There was no `analyze` script and no analyzer integration in `next.config.mjs`.
- Heavy spreadsheet and chat dependencies are spread across route-level features, but there was no repeatable report for checking where bundle weight lands.

## Design Decision

- Use `@next/bundle-analyzer@14.2.25` to match the installed `next@14.2.25`.
- Keep analyzer opt-in through `ANALYZE=true` so normal `npm run build` is unchanged.
- Keep analyzer HTML output under `.next/analyze`, which is already ignored through `/.next/`.

## Changed Files

- `package.json`
- `package-lock.json`
- `next.config.mjs`
- `docs/refactoring/frontend-003-bundle-analyzer.md`

## Before/After

- Before: no analyzer dependency, no analyzer script.
- After: `npm run analyze` runs `ANALYZE=true next build`.
- Before: route bundle sizes were not recorded from a current build.
- After: route-level `Size` and `First Load JS` are documented below.

## Analyzer Output

During `npm run analyze`, Next generated analyzer reports at:

```text
.next/analyze/nodejs.html
.next/analyze/edge.html
.next/analyze/client.html
```

These files are build artifacts and are not committed.

## Route Baseline

Captured from `npm run analyze` and confirmed again with `npm run build`:

```text
Route                                      Mode     Size      First Load JS
/                                          static   6.39 kB   114 kB
/_not-found                                static   876 B     88.4 kB
/admin-page                                static   2.77 kB   98 kB
/invite-check                              static   5.97 kB   158 kB
/invite/[code]                             dynamic  3.76 kB   151 kB
/privacy                                   static   150 B     87.6 kB
/sctest                                    static   737 B     91.5 kB
/select-service                            static   4.6 kB    92.1 kB
/sheetchat-old/[SpreadSheetId]/[ChatId]    dynamic  2.44 kB   1.57 MB
/sheetchat/[SpreadSheetId]/[ChatId]        dynamic  1.09 kB   1.9 MB
/sorryformobile                            static   297 B     94.5 kB
/terms                                     static   150 B     87.6 kB
/testCompo                                 static   310 B     87.8 kB
/testLending                               static   1.6 kB    89.1 kB
/trypage                                   dynamic  1.02 kB   1.9 MB
/websocket                                 static   757 B     101 kB
First Load JS shared by all                         87.5 kB
chunks/2117-e5b3654149f6172b.js                     31.6 kB
chunks/fd9d1056-2f566fe3a4633790.js                 53.6 kB
other shared chunks (total)                         2.27 kB
Middleware                                          26.6 kB
```

The current highest first-load routes are:

- `/sheetchat/[SpreadSheetId]/[ChatId]`: 1.9 MB
- `/trypage`: 1.9 MB
- `/sheetchat-old/[SpreadSheetId]/[ChatId]`: 1.57 MB
- `/invite-check`: 158 kB
- `/invite/[code]`: 151 kB

## Verification

Commands were run with the nvm Node path because the default shell PATH still does not expose `node` or `npm`:

```text
PATH="$HOME/.nvm/versions/node/v22.20.0/bin:$PATH" npm run analyze
PATH="$HOME/.nvm/versions/node/v22.20.0/bin:$PATH" npm run test
PATH="$HOME/.nvm/versions/node/v22.20.0/bin:$PATH" npm run lint
PATH="$HOME/.nvm/versions/node/v22.20.0/bin:$PATH" npm run build
```

Results:

- `npm run analyze`: passed and generated analyzer reports during the build.
- `npm run test`: passed. 1 file, 6 tests.
- `npm run lint`: passed with existing warnings.
- `npm run build`: passed with existing warnings.

Existing warnings still present:

- `@next/next/no-img-element` in existing image usage.
- `react-hooks/exhaustive-deps` in existing hooks/components.
- `no-undef` for `NodeJS` in existing resize hook.
- `metadataBase` warnings during build for existing metadata.
- Browserslist data is stale during build.

`npm install` still reports the same audit class as Step 2:

- 32 vulnerabilities: 15 moderate, 14 high, 3 critical.
- `npm audit fix` was not run because dependency remediation is outside this PR and may change runtime packages.

## Remaining Risk

- This PR only adds measurement. It does not reduce bundle size.
- Analyzer HTML is not committed, so reviewers should run `npm run analyze` locally when they need module-level treemaps.
- The sheetchat and trypage first-load sizes suggest SpreadJS/runtime loading work should stay high priority.

## Next Step

Step 4 should introduce the shared API client boundary without mixing it with bundle or route changes.
