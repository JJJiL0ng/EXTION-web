# aiChatStore 마이그레이션 문서

## 개요
기존의 주석 처리된 채팅 훅들을 새로운 `aiChatStore` Zustand 스토어를 사용하도록 마이그레이션한 작업 문서입니다.

## 마이그레이션 완료 날짜
2025년 1월 20일

## 마이그레이션된 컴포넌트

### 1. ChatInputBox.tsx
**위치**: `src/_components/chat/ChatInputBox.tsx`

#### 변경사항
- **Before**: `aiChatStore()`를 훅으로 호출 (오류)
- **After**: `aiChatStore`에서 필요한 메서드와 상태를 직접 구조분해
- **주요 변경점**:
  - `sendMessage` → `addUserMessage`
  - `isLoading` → `isSendingMessage`
  - 사용하지 않는 파일 핸들러 함수들 주석 처리
  - 사용하지 않는 imports 정리

#### TypeScript 오류 해결
- `'AiChatState & ChatActions' 형식에 'sendMessage' 속성이 없습니다` 해결
- `'AiChatState & ChatActions' 형식에 'isLoading' 속성이 없습니다` 해결
- 사용하지 않는 변수 경고들 해결

### 2. FileUploadChattingContainer.tsx
**위치**: `src/_components/chat/FileUploadChattingContainer.tsx`

#### 변경사항
- **Before**: `useChatFlow`와 `useChatStore` 훅 사용
- **After**: `aiChatStore`에서 `wsConnectionStatus`와 `wsError` 사용
- **주요 변경점**:
  - 초기화 상태 관리를 로컬 state로 단순화
  - ChatViewer 컴포넌트가 준비될 때까지 플레이스홀더 표시
  - 웹소켓 연결 상태에 따른 ChatInputBox disabled 처리
  - 사용하지 않는 props 매개변수 처리

#### 제거된 의존성
- `useChatFlow` 훅
- `useChatStore` 훅
- `getOrCreateGuestId` 유틸리티

### 3. MainChattingContainer.tsx
**위치**: `src/_components/chat/MainChattingContainer.tsx`

#### 변경사항
- **Before**: `useChatFlow`와 `useChatStore` 훅 사용
- **After**: `aiChatStore`에서 `wsConnectionStatus`와 `wsError` 사용
- **주요 변경점**:
  - FileUploadChattingContainer와 동일한 패턴 적용
  - ChatViewer 컴포넌트 플레이스홀더 처리
  - 웹소켓 상태 기반 UI 제어

## aiChatStore 구조

### 상태 (State)
```typescript
interface AiChatState {
  messages: ChatMessage[];
  webSocket: WebSocket | null;
  wsConnectionStatus: WebSocketConnectionStatus;
  wsError: string | null;
  currentAssistantMessageId: string | null;
  websocketId: string | null;
  isTyping: boolean;
  isSendingMessage: boolean;
  aiThinkingIndicatorVisible: boolean;
}
```

### 액션 (Actions)
```typescript
interface ChatActions {
  // 상태 설정
  setWsConnectionStatus: (status: WebSocketConnectionStatus, error?: string) => void;
  setWebsocketId: (id: string) => void;
  
  // 메시지 관련
  addUserMessage: (content: string) => string;
  updateAssistantMessage: (id: string, newContentChunk: string) => void;
  completeAssistantMessage: (id: string) => void;
  setAssistantMessageError: (id: string, errorContent: string) => void;
  updateUserMessageStatus: (id: string, status: MessageStatus) => void;
  addSystemMessage: (content: string) => void;
  addErrorMessage: (content: string) => void;
  
  // UI 상태
  setIsSendingMessage: (sending: boolean) => void;
  setAiThinkingIndicatorVisible: (visible: boolean) => void;
}
```

## 빌드 테스트 결과
✅ **빌드 성공**: `npm run build` 명령어로 테스트 완료
- 컴파일 에러 없음
- TypeScript 검증 통과
- 기존 경고들은 마이그레이션과 무관한 기존 코드의 경고

## 마이그레이션 패턴

### 공통 패턴
1. **기존 훅 제거**: `useChatFlow`, `useChatStore` 등
2. **aiChatStore 사용**: 필요한 상태와 액션만 구조분해
3. **상태 매핑**:
   - `chatFlow.isInitialized` → 로컬 `isInitialized` state
   - `storeError` → `wsError`
   - `chatFlow.canSendMessage` → `wsConnectionStatus !== 'connected'`
4. **사용하지 않는 코드 정리**: imports, props, 변수들

### 에러 처리
- 웹소켓 연결 오류를 `wsError`로 표시
- 간단한 에러 클리어 함수 제공
- UI 상태에 따른 적절한 로딩/에러 표시

## 향후 개선 사항

### 1. ChatViewer 컴포넌트
현재 주석 처리되어 플레이스홀더로 표시 중
- aiChatStore의 messages 배열을 사용하는 ChatViewer 구현 필요
- 메시지 타입별 렌더링 로직 구현
- 스트리밍 메시지 표시 기능

### 2. 웹소켓 연결 관리
- 자동 재연결 로직
- 연결 상태에 따른 더 세밀한 UI 처리
- 에러 복구 메커니즘

### 3. 메시지 전송 완성
- 파일 업로드 기능 통합
- 시트 선택 정보를 메시지와 함께 전송
- 메시지 전송 후 상태 업데이트

## 기술적 세부사항

### 사용된 도구
- **상태 관리**: Zustand with Immer
- **타입스크립트**: 엄격한 타입 체크
- **UUID**: 메시지 고유 ID 생성
- **React 18**: 최신 React 훅 사용

### 코드 품질
- ESLint 규칙 준수
- TypeScript 엄격 모드
- 사용하지 않는 코드 제거
- 일관된 코딩 스타일

## 결론
모든 컴포넌트가 성공적으로 aiChatStore로 마이그레이션되어 빌드 테스트를 통과했습니다. 웹소켓 기반의 실시간 채팅 시스템의 기반이 완성되었으며, ChatViewer 구현과 실제 메시지 전송 로직 완성이 다음 단계입니다.