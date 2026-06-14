# Frontend Step 7 Auth Session Store

- Date: 2026-06-13
- Branch: `refactor-frontend-007-auth-session-store`
- Base: `refactor`
- Scope: user id store source-of-truth cleanup.

## Purpose

Move the official user id store out of `_aa_superRefactor` while keeping existing imports compatible. This reduces one duplicated auth/session boundary before chat and spreadsheet state cleanup.

## Existing Problem

- `src/_aaa_sheetChat/_store/auth/userIdStore.ts` was only commented-out code.
- The active user id store lived under `_aa_superRefactor/store/user`, so non-refactor code depended on the temporary refactor namespace.
- Most routes and hooks import the legacy path directly.

## Design Decision

- Implement the official store in `src/_aaa_sheetChat/_store/auth/userIdStore.ts`.
- Keep the existing storage key `user-id-storage` to avoid logging users out during migration.
- Change `_aa_superRefactor/store/user/userIdStore.ts` into a re-export shim.
- Do not mass-edit every import in this PR; the shim keeps the PR small and avoids path churn.

## Changed Files

- `src/_aaa_sheetChat/_store/auth/userIdStore.ts`
- `src/_aaa_sheetChat/_aa_superRefactor/store/user/userIdStore.ts`
- `docs/refactoring/frontend-007-auth-session-store.md`

## Before/After

- Before: official auth store file was commented out.
- After: official auth store is implemented and persisted with `user-id-storage`.
- Before: `_aa_superRefactor` owned the store implementation.
- After: `_aa_superRefactor` only re-exports the official store.

## Verification

Commands were run with the nvm Node path:

```text
PATH="$HOME/.nvm/versions/node/v22.20.0/bin:$PATH" npm run test
PATH="$HOME/.nvm/versions/node/v22.20.0/bin:$PATH" npm run lint
PATH="$HOME/.nvm/versions/node/v22.20.0/bin:$PATH" npm run build
```

Results:

- `npm run test`: passed. 4 files, 18 tests.
- `npm run lint`: passed with existing warnings.
- `npm run build`: passed with existing warnings.

## Remaining Risk

- Many files still import the compatibility path. Later feature-structure work can move imports to the official path in smaller batches.
- This PR only covers `userId`; chat session and spreadsheet ids are handled in later steps.

## Next Step

Step 8 should reduce chat store duplication and remove unused alternative store variants.
