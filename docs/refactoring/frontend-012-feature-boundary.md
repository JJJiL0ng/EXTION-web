# Frontend Step 12 - Sheet Chat Feature Boundary

## 목표

- `sheetchat` 화면이 내부 `_aaa_sheetChat`와 `_aa_superRefactor` 경로에 직접 의존하는 범위를 줄인다.
- 이후 컴포넌트 이동이나 legacy 폴더 정리 시 라우트 import 변경 범위를 작게 만든다.

## 변경 사항

- `src/features/sheet-chat` 아래에 `context`, `hooks`, `state`, `ui` public re-export 모듈을 추가했다.
- SpreadSheet 동적 import를 위한 `spreadsheetRender` 경계 파일을 추가했다.
- `/sheetchat/[SpreadSheetId]/[ChatId]`와 `/trypage` 라우트가 새 feature 경계를 통해 필요한 모듈을 가져오도록 변경했다.

## 검증

- `npm run test`
- `npm run lint`
- `npm run build`
