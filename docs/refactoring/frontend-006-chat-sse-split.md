# Frontend Step 6 Chat SSE Split

- Date: 2026-06-13
- Branch: `refactor-frontend-006-chat-sse-split`
- Base: `refactor`
- Scope: split SSE buffer parsing from `mainChatApi.ts`.

## Purpose

Make chat stream parsing testable without fetch, React UI handlers, or typing-effect timers. This step focuses on the riskiest low-level parsing boundary and removes a frontend Node `path` import from the chat API file.

## Existing Problem

- `mainChatApi.ts` mixed request setup, fetch streaming, SSE buffer parsing, event dispatch, typing effect, response enrichment, and history/list/health calls.
- SSE parser behavior could not be unit-tested without instantiating the full API class.
- The file imported Node `path` in frontend code even though the import was unused.

## Design Decision

- Extract only SSE buffer parsing to `sseParser.ts`.
- Keep `streamChat`, event dispatch, typing effect, and history/list/health calls in `mainChatApi.ts` for this PR.
- Add parser tests for complete events, partial buffers, CRLF line endings, multi-line data, and invalid JSON.
- Preserve the public `MainChatApi` class and handler API.

## Changed Files

- `src/_aaa_sheetChat/_ApiConnector/chat/mainChatApi.ts`
- `src/_aaa_sheetChat/_ApiConnector/chat/sseParser.ts`
- `src/_aaa_sheetChat/_ApiConnector/chat/sseParser.test.ts`
- `docs/refactoring/frontend-006-chat-sse-split.md`

## Before/After

- Before: `mainChatApi.ts` had an inline private `parseSSEBuffer` method and an unused `path` import.
- After: `mainChatApi.ts` imports `parseSSEBuffer` from `sseParser.ts`.
- Before: `mainChatApi.ts` was 832 lines.
- After: `mainChatApi.ts` is 771 lines, with parser logic moved to a 47-line pure module.
- Before: 3 frontend test files, 13 tests.
- After: 4 frontend test files, 18 tests.

## Verification

Commands were run with the nvm Node path because the default shell PATH still does not expose `node` or `npm`:

```text
PATH="$HOME/.nvm/versions/node/v22.20.0/bin:$PATH" npm run test
PATH="$HOME/.nvm/versions/node/v22.20.0/bin:$PATH" npm run lint
PATH="$HOME/.nvm/versions/node/v22.20.0/bin:$PATH" npm run build
```

Results:

- `npm run test`: passed. 4 files, 18 tests.
- `npm run lint`: passed with existing warnings.
- `npm run build`: passed with existing warnings.

Existing warnings still present:

- `@next/next/no-img-element` in existing image usage.
- `react-hooks/exhaustive-deps` in existing hooks/components.
- `no-undef` for `NodeJS` in existing resize hook.
- `metadataBase` warnings during build for existing metadata.
- Browserslist data is stale during build.

## Remaining Risk

- This PR does not yet split fetch streaming, history/list/health calls, or response enrichment.
- Invalid JSON SSE events are skipped by the parser so later valid events can still be processed. If backend needs UI-visible malformed-event errors, that should become a separate event-normalization policy.
- `mainChatApi.ts` still owns typing effect timers and event handler dispatch; those can be split after parser behavior is locked.

## Next Step

Step 7 should handle auth/session store cleanup. A later chat follow-up can split fetch client methods and response normalization after this parser boundary is stable.
