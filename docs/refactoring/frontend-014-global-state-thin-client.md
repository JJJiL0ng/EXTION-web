# Frontend Step 14 - Global State Thin Client Audit

## 목표

- 프론트에서 현재 전역 상태처럼 쓰이는 Zustand store와 Context provider를 전수 확인한다.
- thin client 기준으로 전역 유지가 필요한 상태와 props/화면 단위 상태로 내릴 수 있는 상태를 분리한다.
- 전환의 첫 단계로 실제 참조가 없는 전역 상태 파일을 제거해 상태 관리 표면을 줄인다.

## 판단 기준

전역 상태로 유지할 수 있는 경우:

- 앱 여러 라우트에서 동일 identity 또는 session 계약으로 참조한다.
- 새로고침/탭 이동 후에도 유지되어야 하고 저장 범위가 명확하다.
- 서버 캐시, 분석 SDK, 인증처럼 앱 전역 provider가 자연스러운 책임이다.

props 또는 화면 단위 상태로 내릴 후보:

- URL 파라미터, 서버 응답, SpreadJS 인스턴스에서 다시 계산할 수 있다.
- 한 라우트 또는 한 컨테이너 하위 컴포넌트에서만 공유된다.
- UI 표시 여부, 모달, 업로드 진행, 선택된 시트처럼 화면 lifetime을 넘길 필요가 없다.
- `getState()`로 임의 위치에서 읽기 위해 전역화되어 있지만 실제 소유자는 상위 페이지가 될 수 있다.

## 현재 전역 상태 인벤토리

### 앱 전역 provider

| 위치 | 역할 | 판단 |
| --- | --- | --- |
| `src/app/layout.tsx` -> `QueryProvider` | TanStack Query 서버 캐시 | 유지. UI 상태가 아니라 서버 데이터 캐시다. |
| `src/app/layout.tsx` -> `PHProvider` | PostHog SDK provider | 유지. 상태 분리 대상은 아니지만 thin client 관점에서는 production lazy init/라우트별 제외를 별도 검토한다. |

### sheet-chat Zustand

| store | 현재 상태 | 판단 |
| --- | --- | --- |
| `_store/auth/userIdStore.ts` | `userId`, localStorage persist | 당장은 유지. invite/select-service/sheetchat/schema-converter에서 공유한다. 장기적으로는 쿠키/서버 세션으로 이동하면 클라이언트 store를 제거할 수 있다. |
| `_store/chat/chatIdAndChatSessionIdStore.ts` | `chatId`, `chatSessionId`, sessionStorage persist | 부분 분리. `chatId`는 URL 파라미터라 props로 충분하다. `chatSessionId`는 서버 응답 이후 요청/롤백에 쓰이므로 route-scoped state 또는 query data로 내린다. |
| `_store/sheet/spreadSheetIdStore.ts` | `spreadSheetId` | 분리 우선. URL 파라미터와 중복된다. page에서 props로 `SpreadSheet`, `ChattingContainer`, hooks에 전달한다. |
| `_store/sheet/spreadSheetVersionIdStore.ts` | `spreadSheetVersionId`, `editLockVersion`, localStorage persist | 분리 후보. 시트/채팅 조합에 종속된 서버 version이다. localStorage 단일 key는 다른 문서로 새어 나갈 수 있으므로 route state 또는 query cache에 둔다. 유지가 필요하면 key를 `spreadSheetId/chatId`로 스코프한다. |
| `_store/sheet/fileNameStore.ts` | `fileName`, `lastUpdated` | 분리 우선. 서버 load/rename/AI response에서 오는 sheet metadata다. `Home` 또는 sheet route state가 소유하고 `SpreadSheetToolbar`, `useFileExport`, document title에 props로 전달한다. |
| `_store/sheet/spreadSheetNamesStore.ts` | `spreadSheetNames`, `selectedSheets` | 분리 우선. SpreadJS instance에서 파생되는 화면 상태다. `SpreadSheet` 또는 `ChattingContainer` 상위에서 `useState/useReducer`로 들고 selector modal/input에 props로 전달한다. |
| `_store/sheet/spreadsheetUploadStore.ts` | `isFileUploaded`, `uploadedFileName`, `uploadedAt` | 분리 우선. 업로드/렌더링 화면 lifetime 상태다. 현재 새 `sheetchat` 라우트에서는 직접 렌더링 판단에 거의 쓰이지 않고 legacy `MainSpreadSheet` 쪽 의존이 크다. |
| `_aa_superRefactor/store/sheet/isEmptySheetStore.ts` | `isEmptySheet` | 분리 후보. request payload와 toolbar 표시 조건에 쓰이는 per-sheet flag다. route state로 둔다. |
| `_aa_superRefactor/store/chat/chatVisibilityStore.ts` | `chatVisability` | 분리 우선. layout UI 상태다. `Home`이 소유하고 `SpreadSheetToolbar`, `ChattingContainer`, `Resizer`에 props로 내린다. |
| `_store/handleZindex/chattingComponentZindexStore.ts` | `isVisible`, `zIndex` | 제거/legacy 분리 후보. 주로 `sheetchat-old`, legacy upload chat container에서 쓰인다. 새 라우트에는 `chatVisibilityStore`와 역할이 겹친다. |
| `_store/chat/chatModeStore.ts` | `mode`, 중복 `chatId` | 분리 우선. `ChatInputBox` 내부 선택값이다. `useChatInputBoxHook`의 local `useState` 또는 `ChattingContainer` props로 충분하다. |
| `_store/aiChat/aiChatStore.ts` | messages, ws 상태, sending flag, chat UI flags | 분리 후보지만 규모가 큼. `ChattingContainer`가 reducer를 소유하고 `AiChatViewer`, `ChatInputBox`, `useCheckAndLoadOnMount`에 actions를 주입하는 구조로 옮긴다. |
| `_store/sheet/spreadjsCommandStore.ts` | 실행 히스토리, rollback stack, autosave 설정, persist + immer | 제거 우선. 현재 store export 외 실제 참조가 없다. thin client 관점에서 `immer`, `persist`, Map state를 끌고 오는 비용만 남아 있다. |

### sheet-chat Context

| context | 현재 상태 | 판단 |
| --- | --- | --- |
| `_contexts/SpreadsheetContext.tsx` | SpreadJS instance, ready flag | 앱 전역은 아니고 route-scoped context다. 다만 100ms polling으로 ref를 감시하므로 thin client 관점에서는 `workbookInitialized`에서 set하는 방식으로 변경한다. |
| `_contexts/ChatVisibilityContext.tsx` | 전체 주석 처리된 legacy context | 제거 후보. 실제 사용되지 않는다. |

## 이번 PR의 실제 정리

전역 상태 축소의 첫 PR로, 런타임에서 참조되지 않는 상태 관리 파일과 stale 문서를 제거했다.

삭제:

- `src/_aaa_sheetChat/_store/sheet/spreadjsCommandStore.ts`
- `src/_aaa_sheetChat/_contexts/ChatVisibilityContext.tsx`
- `src/_aaa_sheetChat/_components/chat/message/ROLLBACK_SYSTEM.md`

정리:

- `src/app/(minimal)/sheetchat-old/[SpreadSheetId]/[ChatId]/page.tsx`의 삭제된 `ChatVisibilityContext` 주석과 `immer.enableMapSet()` side effect 제거
- `src/_aaa_sheetChat/_hooks/sheet/file_upload_export/useFileUploadIntegration.ts`의 삭제된 context 주석 제거
- `src/_aaa_sheetChat/_components/sheet/MainSpreadSheet.tsx`의 삭제된 context 주석 제거
- `src/_aaa_sheetChat/_aa_superRefactor/compo/sheet/SpreadSheetRender.tsx`가 `spreadSheetId/chatId/userId`를 store에서 직접 읽지 않고 route props로 받도록 변경
- `src/app/(minimal)/sheetchat/[SpreadSheetId]/[ChatId]/page.tsx`와 `src/app/(minimal)/trypage/page.tsx`에서 `SpreadSheetRender`에 id props 전달

Before/After:

- Zustand store 파일: 20개 -> 19개
- sheet-chat context 파일: 3개 -> 2개
- `zustand/middleware/immer` import: 1곳 -> 0곳
- `enableMapSet()` 호출: 2곳 -> 0곳
- `SpreadSheetRender`의 id/user 전역 store 구독: 3개 -> 0개

이번 PR에서 일부러 하지 않은 것:

- `spreadSheetIdStore`, `fileNameStore`, `spreadSheetNamesStore`, `chatVisibilityStore`, `aiChatStore`의 전체 props 전환은 후속 PR로 분리한다.
- schema-converter store reducer 전환은 `/sctest` 회귀 범위가 커서 별도 PR로 분리한다.

### schema-converter Zustand/Context

| store/context | 현재 상태 | 판단 |
| --- | --- | --- |
| `_sc-store/sourceSheetRangeStore.ts`, `_sc-store/targetSheetRangeStore.ts` | source/target range | 분리 우선. `sctest` 아래 `ScContainer` 한 화면의 mapping state다. `ScContainer` reducer에서 관리하고 `RangeSelector`, `MappingTopBar`, upload hook에 props로 전달한다. `sourceSheetRangeStore.ts`는 frontend store에서 `fs`, `next/dist`를 import하는 문제도 같이 제거한다. |
| `_sc-store/sourceSheetNameStore.ts`, `_sc-store/targetSheetNameStore.ts` | source/target active sheet name | 분리 우선. SpreadJS instance에서 계산되는 화면 상태다. range와 같은 reducer로 묶는다. |
| `_sc-store/scChattingVisabiltyStore.ts` | schema converter chat open flag | 분리 우선. `ScContainer`가 `useState(false)`로 소유하고 `ScChatting`에 `visible/onClose` props를 넘긴다. |
| `_sc-store/scChattingStore.ts` | schema converter chat messages, mapping suggestion flags | 분리 후보. `ScContainer` 또는 `ScChatting` reducer가 소유하고 `ScChattingViewer`, `ScChatInputbox`, upload/multiturn callbacks에 actions를 주입한다. |
| `_sc-store/scWorkflowStore.ts` | workflow/code/version ids | 분리 후보. upload mutation 결과로 생기는 route-scoped workflow state다. `useUploadSheetAndMapping`이 반환한 값을 `ScContainer` state에 저장하고 `useMappingScript/sendMultiturnChat`에 인자로 넘긴다. |
| `_sc-context/FileStateProvider.tsx` | source/target `File` | 이미 route-scoped provider지만 props로 더 단순화 가능. `sctest/page.tsx`가 아니라 `ScContainer`가 파일 상태를 소유하는 편이 낫다. |
| `_sc-context/SourceSheetProvider.tsx`, `_sc-context/TargetSheetProvider.tsx` | source/target SpreadJS instance | route-scoped context다. 전역 store는 아니지만 중복 구현이다. 하나의 generic provider 또는 props/ref 전달로 단순화한다. |

## props로 내릴 우선순위

1. 사용되지 않는 store 제거

- `useSpreadjsCommandStore`: 실제 참조 없음. 파일 제거 또는 legacy 폴더로 격리.
- `ChatVisibilityContext`: 주석 처리된 미사용 파일. 제거.

2. URL에서 바로 얻는 ID 제거

- `spreadSheetIdStore` 제거.
- `chatIdAndChatSessionIdStore.chatId` 제거.
- `Home`에서 `const spreadSheetId = params.SpreadSheetId`, `const chatId = params.ChatId`를 만들고 하위로 전달한다.
- `useCheckAndLoadOnMount`, `useChatInputBoxHook`, `AiChatViewer` rollback, `renameSheet`는 store `getState()` 대신 인자를 받는다.

3. layout/UI 상태 제거

- `chatVisibilityStore` -> `Home`의 `const [chatVisible, setChatVisible] = useState(true)`.
- `chatModeStore` -> `ChatInputBox` 또는 `useChatInputBoxHook` local state.
- `spreadsheetUploadStore` -> upload/render 컴포넌트 local state.
- `isEmptySheetStore` -> route state.
- `chattingComponentZindexStore` -> old route 정리 시 제거. 유지해야 하면 old route 내부 state로 제한.

4. sheet metadata/selection 제거

- `fileNameStore` -> route state + server query response.
- `spreadSheetNamesStore` -> SpreadJS event hook이 상위 state를 갱신하고 `FileSelectModal`, `ChatInputBox`는 props로 사용.
- `selectedSheets`는 chat input subtree state로 충분하지만, AI request 생성에 필요하므로 `useChatInputBoxHook` 인자로 전달한다.

5. chat state 축소

- `aiChatStore`는 제일 큰 변경이다.
- `ChattingContainer`에 `useReducer(chatReducer)`를 두고 `messages`, `isSendingMessage`, `wsError`, `addLoadedPreviousMessages`, `addUserMessage`, `addAiMessage`, `rollbackMessage`를 actions로 만든다.
- `useCheckAndLoadOnMount`는 `onChatHistoryLoaded(messages)` callback을 받는다.
- `useChatInputBoxHook`은 `chatActions`, `ids`, `versionState`, `selectedSheets`, `setFileName`, `setIsEmptySheet`를 인자로 받는다.

6. schema-converter 화면 상태 축소

- `ScContainer`에 `mappingState` reducer를 둔다.
- `sourceRange`, `targetRange`, `sourceSheetName`, `targetSheetName`, `workflow ids`, `chatVisible`, `chatMessages`를 한 화면 state로 묶는다.
- `useUploadSheetAndMapping`, `useMappingScript`, `sendMultiturnChat`는 Zustand `getState()` 대신 필요한 값을 인자로 받는다.

## 목표 구조 예시

sheet-chat page:

```tsx
const ids = { spreadSheetId, chatId, userId };
const [chatSessionId, setChatSessionId] = useState<string | null>(null);
const [version, setVersion] = useState({ spreadSheetVersionId: null, editLockVersion: null });
const [fileName, setFileName] = useState<string | null>(null);
const [isEmptySheet, setIsEmptySheet] = useState(false);
const [chatVisible, setChatVisible] = useState(true);
const [sheetSelection, setSheetSelection] = useState({ names: [], selected: [] });
```

주요 props 흐름:

- `SpreadSheetToolbar`: `fileName`, `isEmptySheet`, `chatVisible`, `onRename`, `onToggleChat`, `onOpenFile`.
- `SpreadSheet`: `ids`, `version`, `onLoadedMeta`, `onSheetNamesChange`.
- `ChattingContainer`: `ids`, `chatSessionId`, `version`, `selectedSheets`, `fileName setters`, `isEmptySheet setters`.
- `useChatInputBoxHook`: store 접근 대신 위 값과 action callback을 인자로 받는다.

schema-converter page:

```tsx
const [state, dispatch] = useReducer(mappingReducer, initialMappingState);
```

주요 props 흐름:

- `MappingTopBar`: ranges, workflow id, `onUploadAndMap`.
- `DualSpreadViewer`: files, spread refs, `onRangeChange`, `onActiveSheetNameChange`.
- `ScChatting`: messages, pending flags, workflow ids, `onSend`, `onAcceptMapping`.

## 전역으로 남길 것

- `QueryProvider`: 유지.
- `PHProvider`: 유지하되 production-only lazy init은 별도 bundle 작업에서 검토.
- `userIdStore`: 당장 유지. 다만 auth/session을 서버로 이동하는 장기 작업의 대상.
- `SpreadsheetContext`: 당장 유지 가능. 단, polling 제거와 route-scoped provider 명시가 필요.

## 주의할 점

- `useSpreadSheetVersionStore`의 localStorage persist는 현재 key가 문서별로 분리되지 않는다. 분리 전에 유지한다면 최소한 `spreadSheetId/chatId` 기준 scope를 추가해야 한다.
- `aiChatStore` 생성 시점에 `useChatStore.getState()`로 `chatId/chatSessionId`를 읽는다. 이후 chat store가 바뀌어도 초기값은 자동 동기화되지 않는다. props 기반으로 바꾸면 이 문제도 같이 사라진다.
- `sourceSheetRangeStore.ts`는 프론트 store에서 `fs`와 `next/dist/shared/lib/constants`를 import한다. 해당 store를 제거하거나 local reducer로 옮길 때 같이 삭제해야 한다.
- `getState()` 직접 접근을 먼저 줄여야 props 분리가 가능하다. 특히 `useChatInputBoxHook`, `AiChatViewer`, `useCheckAndLoadOnMount`, schema-converter hooks가 핵심 대상이다.

## 권장 작업 순서

1. 미사용/legacy store 제거: `spreadjsCommandStore`, 주석 처리된 `ChatVisibilityContext`.
2. `spreadSheetId/chatId`를 route props로 전환하고 `getState()` 호출을 인자 기반으로 바꾼다.
3. `chatVisibility`, `chatMode`, `isEmptySheet`, `spreadsheetUpload`을 local state로 이동한다.
4. `fileName`, `spreadSheetNames`, `selectedSheets`를 route/chat subtree state로 이동한다.
5. `aiChatStore`를 `ChattingContainer` reducer로 치환한다.
6. schema-converter store 묶음을 `ScContainer` reducer로 치환한다.
7. 마지막으로 남은 Zustand store를 `userId`, 필요 시 scoped `chatSession/version`만 남기고 재평가한다.

## 검증

이번 단계는 미사용 전역 상태 파일 제거와 문서화를 수행했다. 최소 검증 범위:

- `npm run test`
- `npm run lint`
- `npm run build`
- `/sheetchat/[SpreadSheetId]/[ChatId]`: load, rename, chat send, rollback, chat hide/show
- `/sctest`: source/target upload, range 선택, mapping upload, multiturn chat, script apply
