# Frontend Step 4 Shared API Client

- Date: 2026-06-13
- Branch: `refactor-frontend-004-api-client`
- Base: `refactor`
- Scope: shared JSON REST client and low-risk connector migration.

## Purpose

Introduce a shared frontend API boundary for JSON REST calls before changing query keys or chat streaming. The goal is to stop repeating API base URL resolution, JSON headers, response parsing, and error parsing in every connector.

## Existing Problem

- Several connectors repeated `process.env.NEXT_PUBLIC_API_URL`, `fetch`, JSON headers, and `response.ok` checks.
- Some connectors had a localhost fallback while others did not.
- Error parsing was inconsistent: some used `response.text()`, some used `response.json()`, and some threw only `statusText`.

## Design Decision

- Add `src/shared/config/clientEnv.ts` as the single client API base URL reader.
- Add `src/shared/api/httpClient.ts` with `getJson`, `postJson`, and typed `ApiError`.
- Keep the first migration to simple JSON REST connectors.
- Leave chat streaming, chat history/list/health, and Socket.IO URLs for Step 6 because those flows have different response and lifecycle behavior.

## Changed Files

- `src/shared/config/clientEnv.ts`
- `src/shared/api/apiError.ts`
- `src/shared/api/httpClient.ts`
- `src/shared/api/httpClient.test.ts`
- `src/_aaa_sheetChat/_ApiConnector/sheet/checkAndLoadApi.ts`
- `src/_aaa_sheetChat/_ApiConnector/sheet/createSpreadSheetApi.ts`
- `src/_aaa_sheetChat/_ApiConnector/sheet/renameSheetApi.ts`
- `src/_admin/adminApiConnector/createInviteCode.ts`
- `src/_invite/_apiConnector/verify-invite.apiConnector.ts`
- `src/_aaa_schema-converter/_sc-apiConnector/uploadSheetsAndMapping.apiConnector.ts`
- `src/_aaa_schema-converter/_sc-apiConnector/mappingScript.apiConnector.ts`
- `src/_aaa_schema-converter/_sc-apiConnector/multiturnChat.apiConnector.ts`
- `docs/refactoring/frontend-004-api-client.md`

## Before/After

- Before: REST connectors each built URLs and parsed errors directly.
- After: migrated JSON connectors call `getJson` or `postJson`.
- Before: frontend tests covered 1 utility file and 6 cases.
- After: frontend tests cover 2 files and 9 cases, including shared API URL building, JSON body handling, and typed error parsing.

## Remaining Direct Fetches

These direct calls intentionally remain after Step 4:

```text
src/_aaa_sheetChat/_ApiConnector/chat/mainChatApi.ts
src/app/(minimal)/websocket/page.tsx
src/_aaa_sheetChat/_hooks/aiChat/useChatInputBoxHook.ts
```

`mainChatApi.ts` is handled in Step 6 because it mixes fetch streaming, SSE buffer parsing, typing effect, history/list/health calls, and response normalization.

## Verification

Commands were run with the nvm Node path because the default shell PATH still does not expose `node` or `npm`:

```text
PATH="$HOME/.nvm/versions/node/v22.20.0/bin:$PATH" npm run test
PATH="$HOME/.nvm/versions/node/v22.20.0/bin:$PATH" npm run lint
PATH="$HOME/.nvm/versions/node/v22.20.0/bin:$PATH" npm run build
```

Results:

- `npm run test`: passed. 2 files, 9 tests.
- `npm run lint`: passed with existing warnings.
- `npm run build`: passed with existing warnings.

Existing warnings still present:

- `@next/next/no-img-element` in existing image usage.
- `react-hooks/exhaustive-deps` in existing hooks/components.
- `no-undef` for `NodeJS` in existing resize hook.
- `metadataBase` warnings during build for existing metadata.
- Browserslist data is stale during build.

## Remaining Risk

- The shared client now uses a consistent localhost fallback when `NEXT_PUBLIC_API_URL` is missing. This makes local behavior explicit, but production must still provide the env var.
- `ApiError` is typed, but most UI call sites still catch generic `Error`. Follow-up work can narrow UI error states if needed.
- Streaming chat calls are still outside the shared client boundary until Step 6.

## Next Step

Step 5 should centralize TanStack Query keys for check-and-load and related invalidation without changing the REST client again.
