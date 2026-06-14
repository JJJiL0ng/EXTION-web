# EXTION Web

AI 기반 스프레드시트 작업을 위한 EXTION의 Next.js 프론트엔드입니다. 사용자는 브라우저에서 스프레드시트를 업로드/편집하고, AI 채팅을 통해 데이터 변환 명령을 생성하거나, 두 시트 간 schema mapping script를 만들 수 있습니다.

## 주요 화면과 기능

- 랜딩, 초대 코드, 관리자 초대 코드 생성 화면
- SpreadJS 기반 스프레드시트 업로드, 렌더링, 저장, 파일명 변경, 내보내기
- AI 채팅 기반 sheet edit command 생성과 적용
- WebSocket 기반 AI job 진행 상태 수신
- 이전 채팅/시트 버전 rollback
- source/target spreadsheet를 비교해 mapping script 생성
- mapping 결과를 multiturn chat으로 수정
- PostHog/GA 기반 analytics hook

## 집중 리팩토링 스프린트

이 저장소의 `refactor` 브랜치는 개인 주말/여유 시간에 진행한 집중 리팩토링 스프린트 결과입니다. 목표는 화면을 새로 만드는 것이 아니라, 이미 동작하던 프론트엔드의 API 호출, 상태 관리, SpreadJS runtime, legacy route를 단계적으로 정리해서 이후 기능 개발이 가능한 구조로 만드는 것이었습니다.

작업은 `refactor-frontend-001-*`부터 `refactor-frontend-014-*`까지 단계별 브랜치로 나눴고, 각 단계의 판단과 검증 결과는 [docs/refactoring](docs/refactoring)에 남겼습니다.

| Step | 주제 | 핵심 결과 |
| --- | --- | --- |
| 1 | baseline | 파일 수, route, 테스트 부재, 환경 문제 기록 |
| 2 | test setup | Vitest, Testing Library, jsdom 기반 테스트 추가 |
| 3 | bundle analyzer | opt-in bundle analyzer와 route bundle baseline 추가 |
| 4 | shared API client | `jsonRequest`, typed API error, base URL helper 도입 |
| 5 | query keys | TanStack Query key factory와 cache invalidation 정리 |
| 6 | chat SSE split | streaming parser를 테스트 가능한 순수 함수로 분리 |
| 7 | auth/session store | user/session store 책임과 persist 범위 정리 |
| 8 | chat state | 채팅 session state 테스트와 경계 정리 |
| 9 | sheet state | spreadsheet version/edit lock state 테스트 추가 |
| 10 | SpreadJS runtime | client-only runtime/mock 경계 정리 |
| 11 | upload validation | 파일 업로드 validation을 순수 함수로 분리 |
| 12 | feature boundary | sheet-chat feature export boundary 추가 |
| 13 | legacy routes | 개발용 legacy route와 미사용 route 정리 |
| 14 | global state audit | 전역 Zustand/Context 인벤토리와 thin client 전환 계획 정리 |

## 현재 구조

```text
src/app                         Next.js App Router routes
src/_aaa_sheetChat              sheet chat feature 구현과 legacy 경계
src/_aaa_schema-converter       schema mapping 화면과 hooks
src/features/sheet-chat         sheet-chat 공개 feature boundary
src/shared/api                  공통 API client와 typed error
src/shared/config               client env helper
src/shared/spreadjs             SpreadJS runtime boundary
src/test                        Vitest setup과 heavy runtime mocks
docs/refactoring                프론트 리팩토링 기록
```

`_aaa_*` prefix가 남아 있는 영역은 기존 기능을 보존하면서 점진적으로 `features`, `shared` 경계로 옮기는 중입니다. README와 refactoring docs는 현재 상태와 다음 정리 방향을 같이 보여주기 위해 남겨둔 문서입니다.

## 기술 스택

- Next.js 14, React 18, TypeScript
- SpreadJS / ExcelIO, xlsx, PapaParse
- Socket.IO client
- TanStack Query
- Zustand
- Styled Components, Tailwind utilities
- Vitest, Testing Library, jsdom
- PostHog, Google Analytics

## 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`을 열면 됩니다. 백엔드는 기본적으로 `http://localhost:8080`을 바라봅니다.

## 주요 환경 변수

```text
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_GA_ID=G-...
NEXT_PUBLIC_POSTHOG_KEY=...
ADMIN_USERNAME=...
ADMIN_PASSWORD=...
```

`NEXT_PUBLIC_API_URL`을 지정하지 않으면 `src/shared/config/clientEnv.ts`의 기본값인 `http://localhost:8080`을 사용합니다.

## 검증

`refactor` 브랜치 최종 리팩토링 문서 기준:

```bash
npm run test
npm run lint
npm run build
```

- `npm run test`: 성공, 7 files / 27 tests
- `npm run lint`: 성공, 기존 warning 8개 유지
- `npm run build`: 성공, 기존 lint warning과 `metadataBase` warning 유지

## 분석 명령

```bash
npm run analyze
```

`ANALYZE=true next build`로 bundle analyzer를 opt-in 실행합니다. 일반 `npm run build` 동작은 유지합니다.

## 포트폴리오에서 볼 지점

- starter README 상태에서 실제 프로젝트 구조와 리팩토링 맥락을 문서화했습니다.
- 테스트가 없던 프론트에 Vitest 기반 회귀 테스트를 추가하고, API/SSE/query key처럼 깨지기 쉬운 로직을 순수 함수와 공통 helper로 분리했습니다.
- 무거운 SpreadJS runtime은 mock/runtime boundary를 만들고, sheet-chat은 feature boundary를 통해 import 표면을 줄였습니다.
- 전역 상태는 모두 제거하지 않고, 유지할 상태와 props/local reducer로 내릴 상태를 기준과 함께 문서화했습니다.

## 남은 작업

- `aiChatStore`, `spreadSheetVersionStore`, schema-converter stores의 route-scoped reducer 전환
- `_aaa_*` legacy prefix를 feature/shared 구조로 점진 이동
- 개발용 debug log 정리
- backend error response shape와 frontend error handling의 최종 계약 확인
