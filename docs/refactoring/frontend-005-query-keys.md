# Frontend Step 5 Query Keys

- Date: 2026-06-13
- Branch: `refactor-frontend-005-query-keys`
- Base: `refactor`
- Scope: TanStack Query key factory for check-and-load cache.

## Purpose

Centralize query key creation and query key parsing before changing chat API streaming. This step keeps the existing `checkAndLoad` query behavior but removes string literal prefix checks and `as any` query key parsing from cache lookup paths.

## Existing Problem

- `QUERY_KEYS` lived inside cache config and mixed cache duration constants with key construction.
- Cache invalidation used direct `['checkAndLoad']` arrays in multiple places.
- Previous-version cache lookup manually inspected `query.queryKey` and cast params with `as any`.

## Design Decision

- Add `src/_aaa_sheetChat/_config/queryKeys.ts` for key construction and parsing.
- Keep `QUERY_KEYS.checkAndLoad(params)` compatible through a re-export from `queryConfig.ts`.
- Add `checkAndLoadQueryKeys.all` for prefix invalidation.
- Add `getCheckAndLoadParamsFromQueryKey` so cache predicates can safely parse params.
- Keep the PR focused on `checkAndLoad`; broader chat history query migration waits until the chat API split is stable.

## Changed Files

- `src/_aaa_sheetChat/_config/queryKeys.ts`
- `src/_aaa_sheetChat/_config/queryKeys.test.ts`
- `src/_aaa_sheetChat/_config/queryConfig.ts`
- `src/_aaa_sheetChat/_hooks/tanstack/useCacheInvalidation.ts`
- `src/_aaa_sheetChat/_hooks/sheet/data_save/useCheckAndLoad.ts`
- `docs/refactoring/frontend-005-query-keys.md`

## Before/After

- Before: query key prefix arrays were repeated as `['checkAndLoad']`.
- After: prefix invalidation uses `checkAndLoadQueryKeys.all`.
- Before: previous cache lookup used manual query key shape checks and `as any`.
- After: previous cache lookup uses `getCheckAndLoadParamsFromQueryKey`.
- Before: 2 frontend test files, 9 tests.
- After: 3 frontend test files, 13 tests.

## Verification

Commands were run with the nvm Node path because the default shell PATH still does not expose `node` or `npm`:

```text
PATH="$HOME/.nvm/versions/node/v22.20.0/bin:$PATH" npm run test
PATH="$HOME/.nvm/versions/node/v22.20.0/bin:$PATH" npm run lint
PATH="$HOME/.nvm/versions/node/v22.20.0/bin:$PATH" npm run build
```

Results:

- `npm run test`: passed. 3 files, 13 tests.
- `npm run lint`: passed with existing warnings.
- `npm run build`: passed with existing warnings.

Existing warnings still present:

- `@next/next/no-img-element` in existing image usage.
- `react-hooks/exhaustive-deps` in existing hooks/components.
- `no-undef` for `NodeJS` in existing resize hook.
- `metadataBase` warnings during build for existing metadata.
- Browserslist data is stale during build.

## Remaining Risk

- This PR does not change server data ownership. It only makes the key boundary explicit.
- Chat history/list query keys still need a stable factory after `mainChatApi.ts` is split.
- Cache predicates still depend on current `checkAndLoad` key shape, now enforced by tests.

## Next Step

Step 6 should split `mainChatApi.ts` so SSE parsing becomes testable without fetch or UI typing side effects.
