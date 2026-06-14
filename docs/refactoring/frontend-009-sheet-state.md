# Frontend Step 9 - Spreadsheet Version State

## 목표

- 스프레드시트 버전 상태 저장소의 persist 설정을 명시적으로 관리한다.
- localStorage 문자열 키와 저장 대상 필드를 테스트 가능한 계약으로 고정한다.

## 변경 사항

- `SPREADSHEET_VERSION_STORAGE_KEY`와 `SpreadSheetVersionState`를 export했다.
- Zustand persist 설정에 `version`과 `partialize`를 추가했다.
- reset 액션에서 수동 localStorage JSON 수정 코드를 제거하고 persist 미들웨어의 단일 경로로 저장을 갱신한다.
- 스프레드시트 버전 ID와 edit lock 버전 저장, reset 직렬화를 검증하는 테스트를 추가했다.

## 검증

- `npm run test`
- `npm run lint`
- `npm run build`
