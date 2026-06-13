# Frontend Step 13 - Legacy Test Routes

## 목표

- 사용자 플로우와 연결되지 않은 개발용 테스트 라우트를 제거한다.
- 프로덕션 빌드 라우트 표면과 불필요한 테스트 전용 컴포넌트를 줄인다.

## 변경 사항

- `/testCompo` 테스트 라우트를 제거했다.
- `/testLending` 테스트 라우트와 전용 `TestHeroSection` 컴포넌트를 제거했다.
- `/websocket` 수동 소켓 테스트 라우트를 제거했다.
- `/sctest`는 서비스 선택과 스키마 컨버터에서 실제 참조하므로 유지했다.

## 검증

- `npm run test`
- `npm run lint`
- `npm run build`
