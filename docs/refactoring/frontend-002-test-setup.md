# Frontend Step 2 Test Setup

- Date: 2026-06-13
- Branch: `refactor-frontend-002-test-setup`
- Base: `refactor`
- Scope: frontend test runner setup and first low-risk unit tests.

## Purpose

Add a repeatable frontend test command before changing API, state, or spreadsheet runtime boundaries. Step 1 recorded that there was no test script and no test file. This step makes the first regression check available through `npm run test`.

## Existing Problem

- `package.json` had `dev`, `build`, `start`, and `lint`, but no test command.
- There were no `*.test.*`, `*.spec.*`, or `__tests__` files.
- SpreadJS, Socket.IO, and Next navigation imports make component tests hard to add unless test-time mocks exist first.

## Design Decision

- Use Vitest because the project is already TypeScript/React based and Vitest can run focused unit/component tests without changing Next.js runtime code.
- Use jsdom and Testing Library so future component tests can exercise browser-facing React behavior.
- Keep the first test on `validationUtils.ts`, a pure utility with no browser, network, SpreadJS, or React dependency.
- Add test aliases for SpreadJS, ExcelIO, Socket.IO, and Next navigation mocks as a base for later feature tests. The mocks are intentionally small and only cover common methods used by current code.

## Tradeoffs

- Jest would also work, but it needs more transform/config wiring in a Next 14 + TypeScript app. Vitest gives a smaller setup for the first regression layer.
- The first test does not cover chat streaming or spreadsheet rendering. That is intentional: this PR proves the runner and mock boundary first, then later PRs can add focused tests around SSE parsing, query keys, upload parsing, and command normalization.
- Test dependencies were pinned to Node 18-compatible ranges. Latest Vitest/jsdom versions pulled stricter Node 20.19+ engine requirements, which is riskier for this Next 14 project.

## Changed Files

- `package.json`
- `package-lock.json`
- `vitest.config.ts`
- `src/test/setup.ts`
- `src/test/mocks/*`
- `src/_aaa_sheetChat/_utils/validationUtils.test.ts`
- `docs/refactoring/frontend-002-test-setup.md`

## Before/After

- Before: no test script, no test files.
- After: `npm run test` runs Vitest.
- Before: 0 frontend tests.
- After: 1 test file, 6 passing assertions for UUID, file name, cell/range, color/formula, request validation, and UUID generation.

## Verification

Commands were run with the nvm Node path because the default shell PATH still does not expose `node` or `npm`:

```text
PATH="$HOME/.nvm/versions/node/v22.20.0/bin:$PATH" npm run test
PATH="$HOME/.nvm/versions/node/v22.20.0/bin:$PATH" npm run lint
PATH="$HOME/.nvm/versions/node/v22.20.0/bin:$PATH" npm run build
```

Results:

- `npm run test`: passed. 1 file, 6 tests.
- `npm run lint`: passed with existing warnings.
- `npm run build`: passed with existing warnings.

Existing warnings still present:

- `@next/next/no-img-element` in existing image usage.
- `react-hooks/exhaustive-deps` in existing hooks/components.
- `no-undef` for `NodeJS` in existing resize hook.
- `metadataBase` warnings during build for existing metadata.
- Browserslist data is stale during build.

`npm install` reported dependency audit findings after adding test packages:

- 32 vulnerabilities: 15 moderate, 14 high, 3 critical.
- `npm audit fix` was not run because dependency remediation is outside this PR and may change runtime packages.

## Remaining Risk

- The test mocks are intentionally shallow. Tests that need real SpreadJS behavior still require integration or browser-level coverage later.
- The default shell should load nvm or otherwise expose Node/npm before this can run without PATH prefix.
- CI is not configured in this PR; the next quality step should decide whether `npm run test` belongs in CI with lint/build.

## Next Step

Step 3 should add bundle analyzer support and record route-level bundle size using the now-working Node/npm path.
