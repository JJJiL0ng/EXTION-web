# Frontend Step 8 - Chat Session Store

## 목표

- 채팅 화면에서 사용하는 채팅 ID와 채팅 세션 ID 저장소를 단일 구현으로 유지한다.
- 실제로 참조되지 않는 대안 스토어 파일을 제거해 상태 관리 진입점을 줄인다.

## 변경 사항

- `chatIdAndChatSessionIdStore`에서 `ChatState` 타입과 `CHAT_STORAGE_KEY`를 명시적으로 export했다.
- Zustand persist 설정에 `version`과 `partialize`를 추가해 저장 대상 필드를 고정했다.
- 참조되지 않는 memory-only, alternative 채팅 스토어 파일을 제거했다.
- 채팅 ID 저장, 초기화, sessionStorage 직렬화 범위를 검증하는 테스트를 추가했다.

## 검증

- `npm run test`
- `npm run lint`
- `npm run build`
