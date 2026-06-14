# Frontend Step 1 Baseline

- Date: 2026-06-13
- Branch: `refactor-frontend-001-baseline`
- Repository root: `/Users/jihong/Documents/EXTION/EXTION-web`
- Scope: baseline only. No runtime code change.

## Purpose

Record the current frontend baseline before structural refactoring starts. This commit intentionally does not add test tooling, bundle analyzer, API client changes, or source refactors.

## Current Scripts

`package.json` defines:

- `dev`: `next dev`
- `build`: `next build`
- `start`: `next start`
- `lint`: `next lint`

There is no `test` script and no `analyze` script yet.

## Environment Baseline

The current shell cannot run Node package manager commands:

```text
node not found
npm not found
npx not found
pnpm not found
yarn not found
bun not found
corepack not found
```

Because of that, lint/build/test results in this baseline are command availability failures, not confirmed source-code failures.

Existing build output exists at `.next`, but its modified time is `Oct 26 00:28:39 2025`. It is not treated as a current bundle baseline because it may not match the current source tree.

## Source Inventory

- TypeScript/TSX files under `src`: 197
- App Router page/layout/route files under `src/app`: 16
- Test files found by `rg --files | rg '(\\.test\\.|\\.spec\\.|__tests__)'`: 0

Current App Router files:

```text
src/app/(main)/layout.tsx
src/app/(main)/page.tsx
src/app/(minimal)/admin-page/page.tsx
src/app/(minimal)/invite-check/page.tsx
src/app/(minimal)/invite/[code]/page.tsx
src/app/(minimal)/sctest/page.tsx
src/app/(minimal)/select-service/page.tsx
src/app/(minimal)/sorryformobile/page.tsx
src/app/(minimal)/testCompo/page.tsx
src/app/(minimal)/testLending/page.tsx
src/app/(minimal)/trypage/layout.tsx
src/app/(minimal)/trypage/page.tsx
src/app/(minimal)/websocket/page.tsx
src/app/(seo)/privacy/page.tsx
src/app/(seo)/terms/page.tsx
src/app/layout.tsx
```

## Early Risk Inventory

Client source currently imports Node core modules in frontend code:

```text
src/_aaa_schema-converter/_sc-store/sourceSheetRangeStore.ts:1: import { readFileSync } from 'fs';
src/_aaa_sheetChat/_ApiConnector/chat/mainChatApi.ts:4: import { parse } from "path";
```

Heavy runtime dependencies are imported across multiple feature boundaries. The first bundle-routing pass should inspect these files:

```text
src/_aaa_schema-converter/_sc-component/sc-chatting/ScChattingViewer.tsx
src/_aaa_schema-converter/_sc-component/sc-fileupload/TwoFileUpload.tsx
src/_aaa_schema-converter/_sc-component/sc-sheet/FIleUploadButton.tsx
src/_aaa_schema-converter/_sc-component/sc-sheet/FileSpreadSheet.tsx
src/_aaa_schema-converter/_sc-component/sc-sheet/sc-spreadsheetRenderer.tsx
src/_aaa_schema-converter/_sc-hook/useGetActiveSheetName.ts
src/_aaa_schema-converter/_sc-hook/useGetSheetRanage.ts
src/_aaa_sheetChat/_ApiConnector/ai-chat/aiChatApiConnector.ts
src/_aaa_sheetChat/_aa_superRefactor/compo/shared/FileUploadModal.tsx
src/_aaa_sheetChat/_aa_superRefactor/compo/sheet/SpreadSheetRender.tsx
src/_aaa_sheetChat/_applyEngine/applyCommand/detailedCommandApply/addNewSheet.ts
src/_aaa_sheetChat/_applyEngine/applyCommand/detailedCommandApply/createUniqueSheetName.ts
src/_aaa_sheetChat/_applyEngine/applyCommand/detailedCommandApply/valueConverter.ts
src/_aaa_sheetChat/_applyEngine/applyCommand/styleCommandApplyEngine.ts
src/_aaa_sheetChat/_components/chat/message/StreamingMarkdown.tsx
src/_aaa_sheetChat/_components/sheet/FileUploadSheetRender.tsx
src/_aaa_sheetChat/_components/sheet/MainSpreadSheet.tsx
src/_aaa_sheetChat/_components/sheet/SpreadSheetToolbar.tsx
src/_aaa_sheetChat/_hooks/sheet/file_upload_export/useFileExport.ts
src/_aaa_sheetChat/_hooks/sheet/file_upload_export/useFileUpload.ts
src/_aaa_sheetChat/_hooks/sheet/file_upload_export/useFileUploadIntegration.ts
src/_aaa_sheetChat/_hooks/sheet/spreadjs/useSheetRender.ts
src/_aaa_sheetChat/_utils/sheet/authSave/isSpreadSheetDataDirty.ts
src/_aaa_sheetChat/_utils/sheet/fileConverters/csvConverter.ts
src/_aaa_sheetChat/_utils/sheet/fileConverters/excelConverter.ts
src/_aaa_sheetChat/_utils/sheet/fileConverters/index.ts
src/_aaa_sheetChat/_utils/sheet/spreadJSConfig.ts
src/_analytics/posthog/PHproivder.tsx
src/_invite/_hook/useVerifyInviteCode.ts
src/_lending/lendingComponents/lending/sections/HeroButtons.tsx
src/app/(minimal)/websocket/page.tsx
```

This inventory includes SpreadJS/ExcelIO, `xlsx`, Socket.IO, ReactMarkdown, and PostHog import sites. It is only a starting point; Step 3 should measure actual route bundles after analyzer setup.

## Verification

Commands run from `/Users/jihong/Documents/EXTION/EXTION-web`:

```text
git status --short --branch
find src/app -maxdepth 4 -type f \( -name 'page.tsx' -o -name 'layout.tsx' -o -name 'route.ts' \) | sort
rg --files -g '!node_modules' -g '!dist' -g '!build' -g '!coverage' | rg '(\\.test\\.|\\.spec\\.|__tests__)'
find src -type f \( -name '*.ts' -o -name '*.tsx' \) | wc -l
rg -n "from ['\"](path|fs|child_process|crypto|os|stream)['\"]|require\(['\"](path|fs|child_process|crypto|os|stream)['\"]\)" src -g '*.ts' -g '*.tsx'
rg -l "@mescius/spread|@grapecity/spread|spread-sheets|spread-excelio|xlsx|socket.io-client|react-markdown|posthog-js" src -g '*.ts' -g '*.tsx' | sort
stat -f '%Sm %N' .next package.json package-lock.json
which node npm npx pnpm yarn bun corepack
npm run
npm run lint
npm run build
npm run test
```

Results:

- `git status --short --branch`: clean before this document was added.
- App Router file count: 16.
- Source TypeScript/TSX file count: 197.
- Test file search: no results.
- `which node npm npx pnpm yarn bun corepack`: all unavailable in current PATH.
- `npm run`: failed with `zsh:1: command not found: npm`.
- `npm run lint`: failed with `zsh:1: command not found: npm`.
- `npm run build`: failed with `zsh:1: command not found: npm`.
- `npm run test`: failed with `zsh:1: command not found: npm`.

## Next Step

Step 2 should add a frontend test setup inside this repository. Before doing that, Node/npm availability should be fixed in the working shell so `npm run lint`, `npm run build`, and the new test command can be measured against source-code results instead of environment failures.
